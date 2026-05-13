"use client";

/**
 * features/admin-registration/ui/RegistrationForm.tsx
 *
 * Formulario de registro de ventanilla — usado por el oficinista de la liga.
 *
 * Máquina de estados:
 *   idle        → CURP input (+ selector de liga si no viene en props)
 *   searching   → spinner de lookup
 *   found       → tarjeta con datos globales + asignación a equipo
 *   not_found   → formulario de jugador nuevo + asignación a equipo
 *   submitting  → procesando el registro
 *   success     → confirmación con resumen
 *   error       → banner de error con opción de reintentar
 *
 * Diseño: la liga puede venir fijada por props (lo más común — el oficinista
 * trabaja en una liga específica) o seleccionarse desde un dropdown.
 */

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, Search, UserPlus, User, RotateCcw } from "lucide-react";

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

type League = { id: string; name: string; season: string };
type Team = { id: string; name: string };

type GlobalPlayerData = {
	id: string;
	fullName: string;
	birthDate: string;
	avatarUrl: string | null;
	createdAt: string;
};

type SuccessData = {
	isNew: boolean;
	globalPlayer: GlobalPlayerData;
	leagueMember: { id: string; dorsal: number | null; inscriptionDate: string };
	inscription: { teamId: string } | null;
};

type Step =
	| { type: "idle" }
	| { type: "searching" }
	| { type: "found"; player: GlobalPlayerData }
	| { type: "not_found" }
	| { type: "submitting" }
	| { type: "success"; data: SuccessData }
	| { type: "error"; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

function formatDate(iso: string): string {
	const [y, m, d] = iso.split("-");
	return `${d}/${m}/${y}`;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

type Props = {
	/** Liga prefijada — si se provee, no se muestra el selector de liga. */
	fixedLeague?: League;
	/** Lista de ligas para el selector (solo si no hay fixedLeague). */
	leagues?: League[];
};

export default function RegistrationForm({ fixedLeague, leagues = [] }: Props) {
	// ── State ────────────────────────────────────────────────────────────────
	const [curp, setCurp] = useState("");
	const [leagueId, setLeagueId] = useState(fixedLeague?.id ?? "");
	const [teams, setTeams] = useState<Team[]>([]);
	const [teamId, setTeamId] = useState("");
	const [dorsal, setDorsal] = useState("");
	const [internalNotes, setInternalNotes] = useState("");
	// Campos solo para jugador nuevo
	const [fullName, setFullName] = useState("");
	const [birthDate, setBirthDate] = useState("");

	const [step, setStep] = useState<Step>({ type: "idle" });
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const curpInputRef = useRef<HTMLInputElement>(null);

	const selectedLeague = fixedLeague ?? leagues.find((l) => l.id === leagueId);

	// ── Cargar equipos cuando cambia la liga ─────────────────────────────────
	// setTeams([]) se llama en el handler de cambio de liga, no aquí,
	// para evitar setState sincrónico dentro del cuerpo del efecto.
	useEffect(() => {
		if (!leagueId) return;
		let cancelled = false;
		fetch(`/api/teams?league_id=${leagueId}`)
			.then((r) => r.json())
			.then((d) => {
				if (!cancelled && d.ok) setTeams(d.data);
			})
			.catch(() => {
				if (!cancelled) setTeams([]);
			});
		return () => {
			cancelled = true;
		};
	}, [leagueId]);

	// ── Debounced lookup ─────────────────────────────────────────────────────
	useEffect(() => {
		const normalized = curp.trim().toUpperCase();
		const isValidCurp = normalized.length === 18 && CURP_REGEX.test(normalized);

		// Si el CURP no es válido aún o no hay liga, no lanzamos la búsqueda.
		// El estado se resetea a 'idle' solo desde callbacks asíncronos o handlers.
		if (!isValidCurp || !leagueId) return;

		// Cancelar timer anterior
		if (debounceRef.current) clearTimeout(debounceRef.current);

		debounceRef.current = setTimeout(async () => {
			setStep({ type: "searching" });
			try {
				const res = await fetch(`/api/players/lookup?curp=${encodeURIComponent(normalized)}`);
				const data = await res.json();

				if (!data.ok) {
					setStep({ type: "error", message: data.error ?? "Error al buscar el jugador" });
					return;
				}

				if (data.data.found) {
					setStep({ type: "found", player: data.data.player });
				} else {
					setStep({ type: "not_found" });
				}
			} catch {
				setStep({ type: "error", message: "Sin conexión — verifica la red" });
			}
		}, 400);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
		 
	}, [curp, leagueId]);

	// ── Submit ───────────────────────────────────────────────────────────────
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!leagueId) return;

		const normalized = curp.trim().toUpperCase();

		// Para jugador nuevo, validar campos requeridos
		if (step.type === "not_found") {
			if (!fullName.trim()) return;
			if (!birthDate) return;
		}

		setStep({ type: "submitting" });

		try {
			const body = {
				curp: normalized,
				fullName:
					step.type === "not_found"
						? fullName.trim()
						: (step as { type: "found"; player: GlobalPlayerData }).player.fullName,
				birthDate:
					step.type === "not_found"
						? birthDate
						: (step as { type: "found"; player: GlobalPlayerData }).player.birthDate,
				leagueId,
				teamId: teamId || null,
				dorsal: dorsal ? parseInt(dorsal, 10) : null,
				internalNotes: internalNotes.trim() || null,
			};

			const res = await fetch("/api/players/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const data = await res.json();

			if (!data.ok) {
				setStep({ type: "error", message: data.error ?? "Error al registrar" });
				return;
			}

			setStep({ type: "success", data: data.data });
		} catch {
			setStep({ type: "error", message: "Sin conexión — el registro no se completó" });
		}
	}

	// ── Reset completo ───────────────────────────────────────────────────────
	function reset() {
		setCurp("");
		setTeamId("");
		setDorsal("");
		setInternalNotes("");
		setFullName("");
		setBirthDate("");
		setStep({ type: "idle" });
		setTimeout(() => curpInputRef.current?.focus(), 50);
	}

	// ── Render ───────────────────────────────────────────────────────────────
	return (
		<div className="max-w-lg space-y-6">
			{/* Selector de liga (solo si no viene fijada) */}
			{!fixedLeague && (
				<div>
					<label className="block text-sm font-medium text-ink mb-1">
						Liga <span className="text-red-500">*</span>
					</label>
					<select
						value={leagueId}
						onChange={(e) => {
							setLeagueId(e.target.value);
							setStep({ type: "idle" });
							setCurp("");
							setTeams([]);
							setTeamId("");
						}}
						className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-brand"
					>
						<option value="">— Seleccionar liga —</option>
						{leagues.map((l) => (
							<option key={l.id} value={l.id}>
								{l.name} · {l.season}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Header de liga activa */}
			{selectedLeague && (
				<div className="text-xs text-ink-3 bg-surface-2 px-3 py-2 rounded-lg">
					Liga activa: <span className="text-ink font-medium">{selectedLeague.name}</span>
					{" · "}
					{selectedLeague.season}
				</div>
			)}

			{/* CURP input */}
			<div>
				<label className="block text-sm font-medium text-ink mb-1">
					CURP del jugador <span className="text-red-500">*</span>
				</label>
				<div className="relative">
					<input
						ref={curpInputRef}
						value={curp}
						onChange={(e) => {
							const val = e.target.value.toUpperCase();
							setCurp(val);
							// Si el CURP se acorta/invalida, volver a idle desde el handler
							// (evitar setState sincrónico dentro de un efecto)
							if (
								val.length < 18 &&
								step.type !== "idle" &&
								step.type !== "submitting" &&
								step.type !== "success"
							) {
								setStep({ type: "idle" });
							}
						}}
						placeholder="AAAA000000HXXXXXX0"
						maxLength={18}
						autoComplete="off"
						autoFocus
						disabled={step.type === "submitting" || step.type === "success"}
						className="w-full border border-line rounded-lg px-3 py-2 pr-10 text-sm text-ink bg-surface font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
					/>
					<div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3">
						{step.type === "searching" && <Loader2 className="w-4 h-4 animate-spin" />}
						{step.type === "found" && <User className="w-4 h-4 text-green-500" />}
						{step.type === "not_found" && <UserPlus className="w-4 h-4 text-blue-400" />}
						{step.type === "idle" && curp.length > 0 && curp.length < 18 && (
							<Search className="w-4 h-4" />
						)}
					</div>
				</div>
				<p className="text-xs text-ink-3 mt-1">
					{curp.length}/18 caracteres · Se busca automáticamente al completar
				</p>
			</div>

			{/* Estado: liga requerida */}
			{!leagueId && curp.length >= 18 && (
				<p className="text-sm text-amber-400 bg-amber-950/30 px-3 py-2 rounded-lg">
					Selecciona una liga antes de buscar.
				</p>
			)}

			{/* Estado: jugador encontrado */}
			{step.type === "found" && (
				<form onSubmit={handleSubmit} className="space-y-5">
					{/* Tarjeta de jugador */}
					<div className="bg-green-950/30 border border-green-800/40 rounded-xl p-4 flex items-start gap-3">
						{step.player.avatarUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={step.player.avatarUrl}
								alt={step.player.fullName}
								className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-line"
							/>
						) : (
							<div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
								<User className="w-6 h-6 text-ink-3" />
							</div>
						)}
						<div className="min-w-0">
							<p className="text-xs text-green-400 font-medium mb-0.5">✓ Jugador encontrado</p>
							<p className="text-ink font-semibold text-base truncate">{step.player.fullName}</p>
							<p className="text-ink-3 text-xs">Nacimiento: {formatDate(step.player.birthDate)}</p>
						</div>
					</div>

					<AssignmentFields
						teams={teams}
						teamId={teamId}
						dorsal={dorsal}
						internalNotes={internalNotes}
						onTeamChange={setTeamId}
						onDorsalChange={setDorsal}
						onNotesChange={setInternalNotes}
					/>

					<SubmitRow loading={false} label="Registrar en liga" />
				</form>
			)}

			{/* Estado: jugador nuevo */}
			{step.type === "not_found" && (
				<form onSubmit={handleSubmit} className="space-y-5">
					<div className="bg-blue-950/30 border border-blue-800/40 rounded-xl px-4 py-3">
						<p className="text-xs text-blue-400 font-medium">Jugador nuevo — completa sus datos</p>
					</div>

					<div>
						<label className="block text-sm font-medium text-ink mb-1">
							Nombre completo <span className="text-red-500">*</span>
						</label>
						<input
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							placeholder="Nombre como aparece en la INE"
							required
							className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-ink mb-1">
							Fecha de nacimiento <span className="text-red-500">*</span>
						</label>
						<input
							type="date"
							value={birthDate}
							onChange={(e) => setBirthDate(e.target.value)}
							required
							max={new Date().toISOString().slice(0, 10)}
							className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-brand"
						/>
					</div>

					<AssignmentFields
						teams={teams}
						teamId={teamId}
						dorsal={dorsal}
						internalNotes={internalNotes}
						onTeamChange={setTeamId}
						onDorsalChange={setDorsal}
						onNotesChange={setInternalNotes}
					/>

					<SubmitRow loading={false} label="Crear y registrar jugador" />
				</form>
			)}

			{/* Estado: enviando */}
			{step.type === "submitting" && (
				<div className="flex items-center gap-3 text-ink-2 text-sm py-4">
					<Loader2 className="w-5 h-5 animate-spin text-brand" />
					Registrando jugador…
				</div>
			)}

			{/* Estado: éxito */}
			{step.type === "success" && (
				<div className="bg-surface rounded-xl border border-line p-5 space-y-4">
					<div className="flex items-center gap-3">
						<CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0" />
						<div>
							<p className="text-ink font-semibold">
								{step.data.isNew ? "Jugador creado y registrado" : "Jugador registrado en liga"}
							</p>
							<p className="text-ink-3 text-sm">{step.data.globalPlayer.fullName}</p>
						</div>
					</div>

					<dl className="text-sm space-y-1.5 border-t border-line pt-3">
						{step.data.leagueMember.dorsal && (
							<div className="flex justify-between">
								<dt className="text-ink-3">Dorsal</dt>
								<dd className="text-ink font-medium">#{step.data.leagueMember.dorsal}</dd>
							</div>
						)}
						<div className="flex justify-between">
							<dt className="text-ink-3">Inscripción</dt>
							<dd className="text-ink">{formatDate(step.data.leagueMember.inscriptionDate)}</dd>
						</div>
						{step.data.inscription && (
							<div className="flex justify-between">
								<dt className="text-ink-3">Equipo</dt>
								<dd className="text-ink">
									{teams.find((t) => t.id === step.data.inscription?.teamId)?.name ?? "Asignado"}
								</dd>
							</div>
						)}
					</dl>

					<button
						type="button"
						onClick={reset}
						className="flex items-center gap-2 text-sm text-brand hover:underline"
					>
						<RotateCcw className="w-4 h-4" />
						Registrar otro jugador
					</button>
				</div>
			)}

			{/* Estado: error */}
			{step.type === "error" && (
				<div className="bg-red-950/40 border border-red-800/40 rounded-xl p-4 space-y-2">
					<p className="text-red-400 text-sm font-medium">{step.message}</p>
					<button type="button" onClick={reset} className="text-sm text-ink-2 hover:underline">
						Intentar de nuevo
					</button>
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function AssignmentFields({
	teams,
	teamId,
	dorsal,
	internalNotes,
	onTeamChange,
	onDorsalChange,
	onNotesChange,
}: {
	teams: Team[];
	teamId: string;
	dorsal: string;
	internalNotes: string;
	onTeamChange: (v: string) => void;
	onDorsalChange: (v: string) => void;
	onNotesChange: (v: string) => void;
}) {
	return (
		<>
			{/* Equipo */}
			<div>
				<label className="block text-sm font-medium text-ink mb-1">
					Equipo <span className="text-ink-3 text-xs font-normal">(opcional)</span>
				</label>
				{teams.length > 0 ? (
					<select
						value={teamId}
						onChange={(e) => onTeamChange(e.target.value)}
						className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-brand"
					>
						<option value="">— Sin asignar por ahora —</option>
						{teams.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
							</option>
						))}
					</select>
				) : (
					<p className="text-xs text-ink-3 italic">No hay equipos registrados en esta liga.</p>
				)}
			</div>

			{/* Dorsal */}
			<div>
				<label className="block text-sm font-medium text-ink mb-1">
					Dorsal <span className="text-ink-3 text-xs font-normal">(opcional)</span>
				</label>
				<input
					type="number"
					min={1}
					max={99}
					value={dorsal}
					onChange={(e) => onDorsalChange(e.target.value)}
					placeholder="ej. 10"
					className="w-24 border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
				/>
			</div>

			{/* Notas internas */}
			<div>
				<label className="block text-sm font-medium text-ink mb-1">
					Notas internas{" "}
					<span className="text-ink-3 text-xs font-normal">(privadas de la liga)</span>
				</label>
				<textarea
					value={internalNotes}
					onChange={(e) => onNotesChange(e.target.value)}
					maxLength={500}
					rows={2}
					placeholder="Observaciones para el archivo interno de la liga…"
					className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface resize-none focus:outline-none focus:ring-2 focus:ring-brand"
				/>
			</div>
		</>
	);
}

function SubmitRow({ loading, label }: { loading: boolean; label: string }) {
	return (
		<div className="pt-1">
			<button
				type="submit"
				disabled={loading}
				className="bg-brand text-pitch px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-dim disabled:opacity-50 flex items-center gap-2"
			>
				{loading && <Loader2 className="w-4 h-4 animate-spin" />}
				{label}
			</button>
		</div>
	);
}
