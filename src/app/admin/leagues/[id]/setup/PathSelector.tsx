"use client";

/**
 * app/admin/leagues/[id]/setup/PathSelector.tsx
 *
 * Client Component — pantalla de onboarding post-creación de liga.
 *
 * Muestra dos caminos:
 *   A) Importar Excel  → redirige a /admin/imports
 *   B) Flujo profesional V2 → wizard inline:
 *        Paso 1: Crear equipos (formulario inline)
 *        Paso 2: Registrar jugadores (link a /admin/registro)
 *        Paso 3: Todo listo (link a detalle de liga)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type League = {
	id: string;
	name: string;
	season: string;
	dayOfWeek: string;
};

type CreatedTeam = { id: string; name: string };

type Path = "choosing" | "v2";
type V2Step = 1 | 2 | 3;

// ── Componente principal ──────────────────────────────────────────────────────

export function PathSelector({
	league,
	initialPath = "choosing",
}: {
	league: League;
	initialPath?: Path;
}) {
	const [path, setPath] = useState<Path>(initialPath);
	const [v2Step, setV2Step] = useState<V2Step>(1);
	const [teams, setTeams] = useState<CreatedTeam[]>([]);
	const router = useRouter();

	if (path === "choosing") {
		return (
			<ChoosePathScreen
				league={league}
				onExcel={() => router.push(`/admin/imports?leagueId=${league.id}&from=new-league`)}
				onV2={() => setPath("v2")}
			/>
		);
	}

	return (
		<V2Wizard
			league={league}
			step={v2Step}
			teams={teams}
			onTeamsReady={(t) => {
				setTeams(t);
				setV2Step(2);
			}}
			onPlayersReady={() => setV2Step(3)}
			onBack={() => setPath("choosing")}
		/>
	);
}

// ── Pantalla: elegir camino ───────────────────────────────────────────────────

function ChoosePathScreen({
	league,
	onExcel,
	onV2,
}: {
	league: League;
	onExcel: () => void;
	onV2: () => void;
}) {
	return (
		<div className="max-w-2xl space-y-6">
			{/* Header */}
			<div>
				<div className="inline-flex items-center gap-2 text-sm text-brand font-medium mb-2">
					<span className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center text-[11px] font-black">
						✓
					</span>
					Liga creada
				</div>
				<h1 className="text-2xl font-bold text-ink">&ldquo;{league.name}&rdquo; está lista.</h1>
				<p className="text-sm text-ink-2 mt-1 capitalize">
					{league.season} · {league.dayOfWeek}
				</p>
			</div>

			<p className="text-sm text-ink-2">¿Cómo quieres cargar los datos de tu liga?</p>

			{/* Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{/* Card A: Excel */}
				<button
					onClick={onExcel}
					className="group text-left bg-surface rounded-2xl shadow border border-line p-6 hover:border-brand/50 hover:bg-brand/5 transition-all"
				>
					<div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mb-4 text-2xl group-hover:bg-brand/10 transition">
						📊
					</div>
					<p className="font-bold text-ink text-base mb-1">Importar Excel</p>
					<p className="text-xs text-ink-2 leading-relaxed">
						Tengo estadísticas históricas en una hoja de cálculo. La subo y el sistema genera
						posiciones y goleadores automáticamente.
					</p>
					<p className="text-xs text-brand font-semibold mt-4 group-hover:underline">
						Ir al importador →
					</p>
				</button>

				{/* Card B: V2 profesional */}
				<button
					onClick={onV2}
					className="group text-left bg-surface rounded-2xl shadow border border-line p-6 hover:border-brand/50 hover:bg-brand/5 transition-all"
				>
					<div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mb-4 text-2xl group-hover:bg-brand/10 transition">
						🏟️
					</div>
					<p className="font-bold text-ink text-base mb-1">Registro profesional</p>
					<p className="text-xs text-ink-2 leading-relaxed">
						Empiezo desde cero o quiero llevar un control preciso. Creo los equipos, registro
						jugadores con CURP y los inscribo a la liga.
					</p>
					<p className="text-xs text-brand font-semibold mt-4 group-hover:underline">
						Empezar flujo →
					</p>
				</button>
			</div>

			{/* Escape hatch */}
			<div className="pt-2 text-center">
				<Link
					href={`/admin/leagues/${league.id}`}
					className="text-xs text-ink-3 hover:text-ink-2 transition"
				>
					Hacer esto después — ir a la liga →
				</Link>
			</div>
		</div>
	);
}

// ── Wizard V2 ─────────────────────────────────────────────────────────────────

function V2Wizard({
	league,
	step,
	teams,
	onTeamsReady,
	onPlayersReady,
	onBack,
}: {
	league: League;
	step: V2Step;
	teams: CreatedTeam[];
	onTeamsReady: (teams: CreatedTeam[]) => void;
	onPlayersReady: () => void;
	onBack: () => void;
}) {
	return (
		<div className="max-w-2xl space-y-6">
			{/* Header */}
			<div>
				<button
					onClick={onBack}
					className="text-sm text-ink-2 hover:text-ink transition mb-3 inline-flex items-center gap-1"
				>
					← Volver
				</button>
				<h1 className="text-2xl font-bold text-ink">Registro profesional</h1>
				<p className="text-sm text-ink-2 mt-1">
					<span className="font-medium text-ink">{league.name}</span>
					{" · "}
					<span className="capitalize">{league.season}</span>
				</p>
			</div>

			{/* Barra de pasos */}
			<StepBar currentStep={step} />

			{/* Contenido por paso */}
			{step === 1 && <Step1Teams league={league} onDone={onTeamsReady} />}
			{step === 2 && <Step2Players league={league} teams={teams} onDone={onPlayersReady} />}
			{step === 3 && <Step3Done league={league} teams={teams} />}
		</div>
	);
}

// ── Barra de pasos ────────────────────────────────────────────────────────────

function StepBar({ currentStep }: { currentStep: V2Step }) {
	const steps = [
		{ n: 1, label: "Equipos" },
		{ n: 2, label: "Jugadores" },
		{ n: 3, label: "Listo" },
	];

	return (
		<div className="flex items-center gap-0">
			{steps.map((s, i) => (
				<div key={s.n} className="flex items-center flex-1 last:flex-none">
					<div className="flex flex-col items-center">
						<div
							className={[
								"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition",
								currentStep > s.n
									? "bg-brand text-pitch"
									: currentStep === s.n
										? "bg-brand text-pitch ring-4 ring-brand/20"
										: "bg-surface-2 text-ink-3",
							].join(" ")}
						>
							{currentStep > s.n ? "✓" : s.n}
						</div>
						<span
							className={[
								"text-[11px] font-medium mt-1 whitespace-nowrap",
								currentStep >= s.n ? "text-ink" : "text-ink-3",
							].join(" ")}
						>
							{s.label}
						</span>
					</div>
					{i < steps.length - 1 && (
						<div
							className={[
								"h-px flex-1 mx-2 mb-4 transition",
								currentStep > s.n ? "bg-brand" : "bg-line",
							].join(" ")}
						/>
					)}
				</div>
			))}
		</div>
	);
}

// ── Paso 1: Crear equipos ─────────────────────────────────────────────────────

function Step1Teams({
	league,
	onDone,
}: {
	league: League;
	onDone: (teams: CreatedTeam[]) => void;
}) {
	const [teamName, setTeamName] = useState("");
	const [teams, setTeams] = useState<CreatedTeam[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	async function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		const name = teamName.trim();
		if (!name) return;

		// Evitar duplicados locales
		if (teams.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
			setError("Ya agregaste un equipo con ese nombre.");
			return;
		}

		setSaving(true);
		setError("");
		try {
			const res = await fetch("/api/teams", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, leagueId: league.id }),
			});
			const data = await res.json();
			if (!data.ok) {
				setError(data.error ?? "Error al crear el equipo.");
				return;
			}
			setTeams((prev) => [...prev, { id: data.data.id, name: data.data.name }]);
			setTeamName("");
		} catch {
			setError("Error de conexión. Intenta de nuevo.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-5">
			<div className="bg-surface rounded-2xl shadow p-6 space-y-4">
				<div>
					<h2 className="text-base font-bold text-ink">Paso 1 — Crea los equipos</h2>
					<p className="text-sm text-ink-2 mt-1">
						Agrega todos los equipos que participan en esta liga. Después podrás inscribir jugadores
						a cada uno.
					</p>
				</div>

				{/* Formulario de equipo */}
				<form onSubmit={handleAdd} className="flex gap-2">
					<input
						type="text"
						value={teamName}
						onChange={(e) => {
							setTeamName(e.target.value);
							setError("");
						}}
						placeholder="Nombre del equipo…"
						maxLength={80}
						className="flex-1 border border-line rounded-xl px-3 py-2.5 text-sm bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand"
					/>
					<button
						type="submit"
						disabled={saving || !teamName.trim()}
						className="px-4 py-2.5 rounded-xl bg-brand text-pitch text-sm font-semibold hover:bg-brand/90 disabled:opacity-50 transition shrink-0"
					>
						{saving ? "…" : "+ Agregar"}
					</button>
				</form>

				{error && (
					<p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
						{error}
					</p>
				)}

				{/* Lista de equipos creados */}
				{teams.length > 0 && (
					<div className="space-y-1">
						<p className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
							Equipos creados ({teams.length})
						</p>
						<div className="rounded-xl border border-line overflow-hidden">
							{teams.map((t, i) => (
								<div
									key={t.id}
									className="flex items-center gap-3 px-4 py-2.5 border-b border-line last:border-0 bg-surface"
								>
									<span className="w-5 h-5 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[10px] font-black shrink-0">
										{i + 1}
									</span>
									<span className="text-sm font-medium text-ink">{t.name}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* CTA */}
			<div className="flex items-center justify-between">
				<p className="text-xs text-ink-3">
					{teams.length === 0
						? "Agrega al menos un equipo para continuar."
						: `${teams.length} equipo${teams.length !== 1 ? "s" : ""} listo${teams.length !== 1 ? "s" : ""}.`}
				</p>
				<button
					onClick={() => onDone(teams)}
					disabled={teams.length === 0}
					className="px-5 py-2.5 rounded-xl bg-brand text-pitch text-sm font-semibold hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
				>
					Continuar →
				</button>
			</div>
		</div>
	);
}

// ── Paso 2: Registrar jugadores ───────────────────────────────────────────────

function Step2Players({
	league,
	teams,
	onDone,
}: {
	league: League;
	teams: CreatedTeam[];
	onDone: () => void;
}) {
	return (
		<div className="space-y-5">
			<div className="bg-surface rounded-2xl shadow p-6 space-y-4">
				<div>
					<h2 className="text-base font-bold text-ink">Paso 2 — Registra jugadores</h2>
					<p className="text-sm text-ink-2 mt-1">
						Usa la ventanilla de registro para inscribir a cada jugador con su CURP y asignarlo a
						uno de los equipos que creaste.
					</p>
				</div>

				{/* Resumen de equipos */}
				{teams.length > 0 && (
					<div className="bg-surface-2 rounded-xl p-3 space-y-1">
						<p className="text-xs font-semibold text-ink-2">Equipos disponibles para inscribir:</p>
						<div className="flex flex-wrap gap-2 pt-1">
							{teams.map((t) => (
								<span
									key={t.id}
									className="text-xs px-2.5 py-1 rounded-full bg-brand/10 text-brand font-medium"
								>
									{t.name}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Instrucciones */}
				<div className="bg-blue-950/30 border border-blue-800/40 rounded-xl px-4 py-3 space-y-1 text-xs text-blue-300">
					<p className="font-semibold">Cómo registrar un jugador:</p>
					<p>1. Ingresa su CURP en la ventanilla de registro.</p>
					<p>2. Llena nombre y fecha de nacimiento si es nuevo en el sistema.</p>
					<p>3. Elige el equipo al que pertenece en esta liga.</p>
					<p>4. Repite por cada jugador.</p>
				</div>

				{/* CTA principal */}
				<a
					href={`/admin/registro?leagueId=${league.id}`}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center justify-between w-full bg-brand/10 border border-brand/30 rounded-xl px-5 py-4 hover:bg-brand/20 transition group"
				>
					<div>
						<p className="text-sm font-bold text-brand">Abrir ventanilla de registro</p>
						<p className="text-xs text-ink-2 mt-0.5">Se abre en una nueva pestaña</p>
					</div>
					<span className="text-brand text-lg group-hover:translate-x-1 transition-transform">
						→
					</span>
				</a>
			</div>

			{/* CTA siguiente paso */}
			<div className="flex items-center justify-between">
				<p className="text-xs text-ink-3">
					Cuando termines de registrar todos los jugadores, continúa.
				</p>
				<button
					onClick={onDone}
					className="px-5 py-2.5 rounded-xl bg-brand text-pitch text-sm font-semibold hover:bg-brand/90 transition"
				>
					Ya registré los jugadores →
				</button>
			</div>
		</div>
	);
}

// ── Paso 3: Listo ─────────────────────────────────────────────────────────────

function Step3Done({ league, teams }: { league: League; teams: CreatedTeam[] }) {
	return (
		<div className="space-y-5">
			<div className="bg-surface rounded-2xl shadow p-8 flex flex-col items-center text-center space-y-4">
				<div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-4xl">
					🏆
				</div>
				<div>
					<h2 className="text-xl font-bold text-ink">¡Liga configurada!</h2>
					<p className="text-sm text-ink-2 mt-1 max-w-sm">
						Los equipos están creados y los jugadores inscritos. Tu liga está lista para operar.
					</p>
				</div>

				{/* Equipos creados */}
				{teams.length > 0 && (
					<div className="w-full text-left bg-surface-2 rounded-xl p-4 space-y-2">
						<p className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
							Equipos en la liga
						</p>
						<div className="flex flex-wrap gap-2">
							{teams.map((t) => (
								<span
									key={t.id}
									className="text-xs px-2.5 py-1 rounded-full bg-brand/10 text-brand font-medium"
								>
									{t.name}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Acciones */}
				<div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
					<Link
						href={`/admin/leagues/${league.id}`}
						className="flex-1 text-center py-3 rounded-xl bg-brand text-pitch text-sm font-bold hover:bg-brand/90 transition"
					>
						Ver mi liga →
					</Link>
					<Link
						href="/admin/teams"
						className="flex-1 text-center py-3 rounded-xl border border-line text-ink text-sm font-medium hover:bg-surface-2 transition"
					>
						Gestionar equipos
					</Link>
				</div>
			</div>

			{/* Próximos pasos */}
			<div className="bg-surface rounded-2xl shadow p-5 space-y-3">
				<p className="text-sm font-semibold text-ink">¿Qué puedes hacer ahora?</p>
				<div className="space-y-2">
					{[
						{
							href: `/admin/registro?leagueId=${league.id}`,
							label: "Registrar más jugadores",
							desc: "Agrega más participantes cuando se inscriban.",
						},
						{
							href: `/admin/teams?leagueId=${league.id}`,
							label: "Ver plantillas de equipos",
							desc: "Revisa los jugadores inscritos por equipo.",
						},
						{
							href: `/admin/imports?leagueId=${league.id}`,
							label: "Importar estadísticas (Excel)",
							desc: "Si ya tienes datos históricos de temporadas anteriores.",
						},
					].map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="flex items-center justify-between p-3 rounded-xl border border-line hover:bg-surface-2 transition group"
						>
							<div>
								<p className="text-sm font-medium text-ink group-hover:text-brand transition">
									{item.label}
								</p>
								<p className="text-xs text-ink-3 mt-0.5">{item.desc}</p>
							</div>
							<span className="text-ink-3 group-hover:text-brand transition text-sm">→</span>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
