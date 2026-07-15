"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/shared/api/client";

type OrgOption = { id: string; name: string; slug: string };
type LeagueOption = {
	id: string;
	name: string;
	city: string;
	season: string;
	teamCount: number;
	orgName: string | null;
};

type Tier = "S" | "M" | "L" | "XL";
type Mode = "new" | "existing";

const TIERS: { value: Tier; label: string; description: string }[] = [
	{ value: "S", label: "S", description: "1 org · 1 liga · 8 equipos · 8 jugadores/equipo" },
	{ value: "M", label: "M", description: "1 org · 3 ligas · 10 equipos · 10 jugadores/equipo" },
	{ value: "L", label: "L", description: "1 org · 6 ligas · 12 equipos · 12 jugadores/equipo" },
	{
		value: "XL",
		label: "XL",
		description: "3 orgs · 6 ligas/org · 14 equipos · 14 jugadores/equipo",
	},
];

type NewFormState = {
	tier: Tier;
	advanceMode: "jornadas" | "champion";
	jornadas: number;
	seed: string;
	organizationId: string;
};

type ExistingFormState = {
	leagueId: string;
	advanceMode: "jornadas" | "champion";
	jornadas: number;
	teamsToCreate: number;
	playersPerTeamToCreate: number;
};

type NewResult = {
	tier: Tier;
	seed: number;
	jornadasAdvanced: number;
	note: string | null;
	organizations: { id: string; name: string; slug: string }[];
	leagues: { id: string; name: string; slug: string | null; city: string }[];
	counts: Record<string, number>;
	previewLeague: { id: string; name: string } | null;
	previewStandings: {
		teamId: string;
		teamName: string;
		jornada: number;
		played: number;
		wins: number;
		draws: number;
		losses: number;
		goalsFor: number;
		goalsAgainst: number;
		points: number;
	}[];
};

type ExistingResult = {
	leagueId: string;
	leagueName: string;
	startedAtJornada: number;
	endedAtJornada: number;
	teamsCreated: number;
	playersCreated: number;
	note: string | null;
	counts: Record<string, number>;
};

const DEFAULT_NEW_FORM: NewFormState = {
	tier: "S",
	advanceMode: "champion",
	jornadas: 5,
	seed: "",
	organizationId: "",
};

const DEFAULT_EXISTING_FORM: ExistingFormState = {
	leagueId: "",
	advanceMode: "champion",
	jornadas: 5,
	teamsToCreate: 10,
	playersPerTeamToCreate: 10,
};

const COUNT_LABELS: Record<string, string> = {
	globalPlayers: "Jugadores globales",
	teams: "Equipos",
	venues: "Canchas",
	leagueMembers: "Membresías de liga",
	inscriptions: "Inscripciones",
	matchdays: "Jornadas",
	matches: "Partidos",
	matchEvents: "Eventos de partido",
	matchPlayerStats: "Stats por partido",
	teamStandingsSnapshot: "Snapshots de tabla",
	playerSeasonStats: "Stats de temporada",
	suspensions: "Suspensiones",
};

export default function OrganizationSimulatorForm({
	organizations,
	leagues,
}: {
	organizations: OrgOption[];
	leagues: LeagueOption[];
}) {
	const [mode, setMode] = useState<Mode>("existing");

	const [newForm, setNewForm] = useState<NewFormState>(DEFAULT_NEW_FORM);
	const [existingForm, setExistingForm] = useState<ExistingFormState>(DEFAULT_EXISTING_FORM);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [newResult, setNewResult] = useState<NewResult | null>(null);
	const [existingResult, setExistingResult] = useState<ExistingResult | null>(null);

	function setNew<K extends keyof NewFormState>(key: K, value: NewFormState[K]) {
		setNewForm((prev) => ({ ...prev, [key]: value }));
	}
	function setExisting<K extends keyof ExistingFormState>(key: K, value: ExistingFormState[K]) {
		setExistingForm((prev) => ({ ...prev, [key]: value }));
	}

	const selectedLeague = leagues.find((l) => l.id === existingForm.leagueId) ?? null;
	const leagueNeedsTeams = selectedLeague !== null && selectedLeague.teamCount === 0;

	async function handleSubmitNew(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		setNewResult(null);

		const seedNum = newForm.seed.trim() ? Number(newForm.seed.trim()) : undefined;
		if (newForm.seed.trim() && (!Number.isInteger(seedNum) || seedNum! < 0)) {
			setError("La semilla debe ser un entero positivo.");
			setLoading(false);
			return;
		}

		try {
			const res = await apiFetch<NewResult>("/api/organization-simulator", {
				method: "POST",
				body: {
					tier: newForm.tier,
					mode: newForm.advanceMode,
					jornadas: newForm.advanceMode === "jornadas" ? newForm.jornadas : undefined,
					seed: seedNum,
					organizationId: newForm.organizationId || undefined,
				},
			});
			if (!res.ok) setError(res.error ?? "Error al correr el simulador.");
			else setNewResult(res.data);
		} catch (networkError) {
			console.error("[OrganizationSimulatorForm] run new", networkError);
			setError("Error de red. Revisa la consola.");
		} finally {
			setLoading(false);
		}
	}

	async function handleSubmitExisting(e: React.FormEvent) {
		e.preventDefault();
		setError("");

		if (!existingForm.leagueId) {
			setError("Elige una liga.");
			return;
		}

		setLoading(true);
		setExistingResult(null);

		try {
			const res = await apiFetch<ExistingResult>("/api/organization-simulator/advance", {
				method: "POST",
				body: {
					leagueId: existingForm.leagueId,
					mode: existingForm.advanceMode,
					jornadas: existingForm.advanceMode === "jornadas" ? existingForm.jornadas : undefined,
					...(leagueNeedsTeams
						? {
								teamsToCreate: existingForm.teamsToCreate,
								playersPerTeamToCreate: existingForm.playersPerTeamToCreate,
							}
						: {}),
				},
			});
			if (!res.ok) setError(res.error ?? "Error al avanzar la liga.");
			else setExistingResult(res.data);
		} catch (networkError) {
			console.error("[OrganizationSimulatorForm] run existing", networkError);
			setError("Error de red. Revisa la consola.");
		} finally {
			setLoading(false);
		}
	}

	function handleReset() {
		setNewResult(null);
		setExistingResult(null);
		setNewForm(DEFAULT_NEW_FORM);
		setExistingForm(DEFAULT_EXISTING_FORM);
	}

	const result = newResult ?? existingResult;

	return (
		<div className="min-h-screen bg-pitch text-ink py-10 px-4">
			<div className="max-w-3xl mx-auto">
				<div className="mb-8">
					<p className="text-xs text-ink-2 uppercase tracking-widest mb-1 font-mono">
						herramienta interna
					</p>
					<h1 className="text-3xl font-bold text-white">Organization Simulator</h1>
					<p className="text-ink-3 text-sm mt-1">
						Genera datos sintéticos en cascada (identidad global → estructura → partidos → agregados
						→ disciplina) para probar los flujos reales a escala.
					</p>
				</div>

				{!result ? (
					<div className="space-y-6">
						{/* Selector de modo */}
						<div className="flex gap-2 bg-surface-2 border border-line rounded-xl p-1">
							<button
								type="button"
								onClick={() => setMode("existing")}
								className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
									mode === "existing" ? "bg-brand text-white" : "text-ink-3 hover:text-ink"
								}`}
							>
								Mi liga
							</button>
							<button
								type="button"
								onClick={() => setMode("new")}
								className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
									mode === "new" ? "bg-brand text-white" : "text-ink-3 hover:text-ink"
								}`}
							>
								Liga(s) nueva(s) desde cero
							</button>
						</div>

						{mode === "existing" ? (
							<form onSubmit={handleSubmitExisting} className="space-y-6">
								<section className="bg-surface border border-line rounded-2xl p-6 space-y-4">
									<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wider">
										Liga
									</h2>

									{leagues.length === 0 ? (
										<p className="text-xs text-yellow-400">
											No hay ninguna liga creada todavía. Crea una desde{" "}
											<Link href="/admin/leagues" className="underline hover:text-yellow-300">
												Ligas →
											</Link>
										</p>
									) : (
										<div>
											<label className="block text-xs text-ink-3 mb-1.5">Elige tu liga</label>
											<select
												value={existingForm.leagueId}
												onChange={(e) => setExisting("leagueId", e.target.value)}
												className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand"
											>
												<option value="">— Selecciona —</option>
												{leagues.map((l) => (
													<option key={l.id} value={l.id}>
														{l.name} · {l.city} {l.orgName ? `· ${l.orgName}` : ""} ·{" "}
														{l.teamCount === 0 ? "sin equipos" : `${l.teamCount} equipos`}
													</option>
												))}
											</select>
										</div>
									)}

									{leagueNeedsTeams && (
										<div className="bg-yellow-950/30 border border-yellow-900/50 rounded-lg p-4 space-y-4">
											<p className="text-xs text-yellow-400">
												Esta liga no tiene equipos todavía — el simulador va a crear equipos y
												jugadores para ella antes de simular partidos.
											</p>
											<SliderField
												label="Equipos a crear"
												value={existingForm.teamsToCreate}
												min={6}
												max={16}
												step={1}
												description={`${existingForm.teamsToCreate} equipos`}
												onChange={(v) => setExisting("teamsToCreate", v)}
											/>
											<SliderField
												label="Jugadores por equipo"
												value={existingForm.playersPerTeamToCreate}
												min={7}
												max={14}
												step={1}
												description={`${existingForm.playersPerTeamToCreate} jugadores × ${existingForm.teamsToCreate} equipos = ${existingForm.teamsToCreate * existingForm.playersPerTeamToCreate} totales`}
												onChange={(v) => setExisting("playersPerTeamToCreate", v)}
											/>
										</div>
									)}
								</section>

								<section className="bg-surface border border-line rounded-2xl p-6 space-y-4">
									<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wider">
										Cuánto avanzar
									</h2>

									<div className="flex gap-2 bg-surface-2 border border-line rounded-xl p-1">
										<button
											type="button"
											onClick={() => setExisting("advanceMode", "champion")}
											className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
												existingForm.advanceMode === "champion"
													? "bg-brand text-white"
													: "text-ink-3 hover:text-ink"
											}`}
										>
											Hasta que haya campeón
										</button>
										<button
											type="button"
											onClick={() => setExisting("advanceMode", "jornadas")}
											className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
												existingForm.advanceMode === "jornadas"
													? "bg-brand text-white"
													: "text-ink-3 hover:text-ink"
											}`}
										>
											N jornadas
										</button>
									</div>

									{existingForm.advanceMode === "champion" ? (
										<p className="text-xs text-ink-2">
											Simula partidos hasta completar la jornada 20 (temporada regular completa)
											para que la tabla tenga un líder claro. No cierra la temporada ni corre
											liguilla — esa lógica no existe todavía.
										</p>
									) : (
										<div>
											<div className="flex items-center justify-between mb-1.5">
												<label className="text-xs text-ink-3">Jornadas a avanzar</label>
												<span className="text-sm font-bold text-white tabular-nums">
													{existingForm.jornadas}
												</span>
											</div>
											<input
												type="range"
												min={1}
												max={19}
												step={1}
												value={existingForm.jornadas}
												onChange={(e) => setExisting("jornadas", Number(e.target.value))}
												className="w-full accent-green-500"
											/>
											<p className="text-xs text-ink-2 mt-1">
												Avanza desde donde se quedó la liga (tope: jornada 20).
											</p>
										</div>
									)}
								</section>

								{error && (
									<p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-4 py-2.5">
										{error}
									</p>
								)}

								<button
									type="submit"
									disabled={loading || leagues.length === 0}
									className="w-full bg-brand hover:bg-brand-dim disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm"
								>
									{loading ? "Simulando…" : "Simular esta liga"}
								</button>

								{loading && <LoadingSpinner />}
							</form>
						) : (
							<form onSubmit={handleSubmitNew} className="space-y-6">
								<section className="bg-surface border border-line rounded-2xl p-6 space-y-4">
									<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wider">
										Tier
									</h2>
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
										{TIERS.map((t) => (
											<button
												key={t.value}
												type="button"
												onClick={() => setNew("tier", t.value)}
												className={`text-left rounded-xl border px-4 py-3 transition ${
													newForm.tier === t.value
														? "border-brand bg-brand/10"
														: "border-line bg-surface-2 hover:border-ink-3"
												}`}
											>
												<p className="text-lg font-bold text-white">{t.label}</p>
												<p className="text-xs text-ink-3 mt-0.5">{t.description}</p>
											</button>
										))}
									</div>
									{newForm.tier === "XL" && (
										<p className="text-xs text-yellow-400">
											Tier XL genera volumen alto — considera respaldar la DB antes de correr
											(convención en docs/ORGANIZATION-SIMULATOR.md §D2).
										</p>
									)}
								</section>

								<section className="bg-surface border border-line rounded-2xl p-6 space-y-5">
									<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wider">
										Corrida
									</h2>

									<div className="flex gap-2 bg-surface-2 border border-line rounded-xl p-1">
										<button
											type="button"
											onClick={() => setNew("advanceMode", "champion")}
											className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
												newForm.advanceMode === "champion"
													? "bg-brand text-white"
													: "text-ink-3 hover:text-ink"
											}`}
										>
											Hasta que haya campeón
										</button>
										<button
											type="button"
											onClick={() => setNew("advanceMode", "jornadas")}
											className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
												newForm.advanceMode === "jornadas"
													? "bg-brand text-white"
													: "text-ink-3 hover:text-ink"
											}`}
										>
											N jornadas
										</button>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div>
											{newForm.advanceMode === "champion" ? (
												<div className="h-full flex flex-col justify-center">
													<label className="text-xs text-ink-3 mb-1.5">Jornadas a avanzar</label>
													<p className="text-xs text-ink-2">
														Corre la temporada regular completa (20 jornadas) para que la tabla
														tenga un campeón claro. No corre liguilla todavía (Épica C5).
													</p>
												</div>
											) : (
												<>
													<div className="flex items-center justify-between mb-1.5">
														<label className="text-xs text-ink-3">Jornadas a avanzar</label>
														<span className="text-sm font-bold text-white tabular-nums">
															{newForm.jornadas}
														</span>
													</div>
													<input
														type="range"
														min={1}
														max={5}
														step={1}
														value={newForm.jornadas}
														onChange={(e) => setNew("jornadas", Number(e.target.value))}
														className="w-full accent-green-500"
													/>
													<p className="text-xs text-ink-2 mt-1">
														1 temporada = 20 jornadas; esta corrida avanza {newForm.jornadas}.
													</p>
												</>
											)}
										</div>

										<div>
											<label className="block text-xs text-ink-3 mb-1.5">Semilla (opcional)</label>
											<input
												type="text"
												inputMode="numeric"
												value={newForm.seed}
												onChange={(e) => setNew("seed", e.target.value)}
												placeholder="aleatoria si se deja vacía"
												className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-3 focus:outline-none focus:ring-1 focus:ring-brand"
											/>
											<p className="text-xs text-ink-2 mt-1">
												Misma semilla + tier ⇒ mismo dataset.
											</p>
										</div>

										<div className="sm:col-span-2">
											<label className="block text-xs text-ink-3 mb-1.5">
												Org destino (opcional)
											</label>
											<select
												value={newForm.organizationId}
												onChange={(e) => setNew("organizationId", e.target.value)}
												className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand"
											>
												<option value="">— Crear org(s) nueva(s) según el tier —</option>
												{organizations.map((o) => (
													<option key={o.id} value={o.id}>
														{o.name} ({o.slug})
													</option>
												))}
											</select>
											<p className="text-xs text-ink-2 mt-1">
												Si eliges una org, se le agregan liga(s) nueva(s); el conteo de orgs del
												tier se ignora.
											</p>
										</div>
									</div>
								</section>

								{error && (
									<p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-4 py-2.5">
										{error}
									</p>
								)}

								<button
									type="submit"
									disabled={loading}
									className="w-full bg-brand hover:bg-brand-dim disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm"
								>
									{loading ? "Corriendo simulador…" : "Correr simulador"}
								</button>

								{loading && <LoadingSpinner />}
							</form>
						)}
					</div>
				) : newResult ? (
					<NewResultView result={newResult} onReset={handleReset} />
				) : existingResult ? (
					<ExistingResultView result={existingResult} onReset={handleReset} />
				) : null}
			</div>
		</div>
	);
}

function LoadingSpinner() {
	return (
		<div className="text-center">
			<div className="inline-flex flex-col items-center gap-3">
				<div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
				<p className="text-xs text-ink-3">Calendario → partidos → agregados → disciplina…</p>
			</div>
		</div>
	);
}

function ExistingResultView({ result, onReset }: { result: ExistingResult; onReset: () => void }) {
	return (
		<div className="space-y-6">
			<div className="bg-brand/10 border border-brand/20 rounded-2xl px-6 py-5">
				<p className="text-brand-ink text-xs font-semibold uppercase tracking-wider mb-1">
					{result.startedAtJornada === result.endedAtJornada
						? "Nada que avanzar"
						: "Corrida completa"}
				</p>
				<h2 className="text-2xl font-bold text-white">{result.leagueName}</h2>
				<p className="text-ink-3 text-sm mt-0.5">
					Jornada {result.startedAtJornada} → {result.endedAtJornada}
				</p>
				{result.note && <p className="text-yellow-400 text-xs mt-2">{result.note}</p>}
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{Object.entries(result.counts).map(([key, value]) => (
					<div key={key} className="bg-surface border border-line rounded-xl px-4 py-3 text-center">
						<p className="text-xl font-bold text-white">{value}</p>
						<p className="text-xs text-ink-2 mt-0.5">{COUNT_LABELS[key] ?? key}</p>
					</div>
				))}
			</div>

			{(result.teamsCreated > 0 || result.playersCreated > 0) && (
				<div className="bg-surface border border-line rounded-2xl px-6 py-4 flex gap-6 text-sm">
					<Stat label="Equipos creados" value={String(result.teamsCreated)} />
					<Stat label="Jugadores creados" value={String(result.playersCreated)} />
				</div>
			)}

			<div className="flex gap-3">
				<Link
					href={`/admin/leagues/${result.leagueId}`}
					className="flex-1 bg-brand hover:bg-brand-dim text-white text-sm font-semibold text-center py-3 rounded-xl transition"
				>
					Ver liga en admin →
				</Link>
				<button
					onClick={onReset}
					className="flex-1 bg-surface-2 hover:bg-surface-2 text-ink-2 text-sm font-semibold py-3 rounded-xl transition"
				>
					Simular otra
				</button>
			</div>
		</div>
	);
}

function NewResultView({ result, onReset }: { result: NewResult; onReset: () => void }) {
	return (
		<div className="space-y-6">
			<div className="bg-brand/10 border border-brand/20 rounded-2xl px-6 py-5">
				<p className="text-brand-ink text-xs font-semibold uppercase tracking-wider mb-1">
					Corrida completa
				</p>
				<h2 className="text-2xl font-bold text-white">
					tier {result.tier} · semilla {result.seed}
				</h2>
				<p className="text-ink-3 text-sm mt-0.5">
					{result.jornadasAdvanced} jornada(s) avanzadas ·{" "}
					{result.organizations.map((o) => o.name).join(", ")}
				</p>
				{result.note && <p className="text-yellow-400 text-xs mt-2">{result.note}</p>}
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{Object.entries(result.counts).map(([key, value]) => (
					<div key={key} className="bg-surface border border-line rounded-xl px-4 py-3 text-center">
						<p className="text-xl font-bold text-white">{value}</p>
						<p className="text-xs text-ink-2 mt-0.5">{COUNT_LABELS[key] ?? key}</p>
					</div>
				))}
			</div>

			<div className="bg-surface border border-line rounded-2xl p-5">
				<h3 className="text-sm font-semibold text-ink-2 mb-3">
					Ligas generadas ({result.leagues.length})
				</h3>
				<ul className="space-y-1.5 text-sm">
					{result.leagues.map((l) => (
						<li key={l.id} className="flex justify-between text-ink-3">
							<span className="text-white">{l.name}</span>
							<span>
								{l.city} ·{" "}
								<Link href={`/admin/leagues/${l.id}`} className="underline hover:text-brand">
									ver en admin →
								</Link>
							</span>
						</li>
					))}
				</ul>
			</div>

			{result.previewLeague && result.previewStandings.length > 0 && (
				<div className="bg-surface border border-line rounded-2xl overflow-hidden">
					<div className="px-5 py-3 border-b border-line">
						<h3 className="text-sm font-semibold text-ink-2">
							Tabla de posiciones — {result.previewLeague.name} · jornada{" "}
							{result.previewStandings[0].jornada}
						</h3>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-xs">
							<thead className="bg-surface-2/60 text-ink-2 uppercase">
								<tr>
									<th className="px-4 py-2.5 text-left w-6">#</th>
									<th className="px-4 py-2.5 text-left">Equipo</th>
									<th className="px-3 py-2.5 text-center">PJ</th>
									<th className="px-3 py-2.5 text-center">G</th>
									<th className="px-3 py-2.5 text-center">E</th>
									<th className="px-3 py-2.5 text-center">P</th>
									<th className="px-3 py-2.5 text-center">GF</th>
									<th className="px-3 py-2.5 text-center">GC</th>
									<th className="px-3 py-2.5 text-center font-bold">Pts</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{result.previewStandings.map((row, i) => (
									<tr key={row.teamId} className="hover:bg-surface-2/40">
										<td className="px-4 py-2.5 text-ink-2">{i + 1}</td>
										<td className="px-4 py-2.5 font-medium text-white">{row.teamName}</td>
										<td className="px-3 py-2.5 text-center text-ink-3">{row.played}</td>
										<td className="px-3 py-2.5 text-center text-ink-3">{row.wins}</td>
										<td className="px-3 py-2.5 text-center text-ink-3">{row.draws}</td>
										<td className="px-3 py-2.5 text-center text-ink-3">{row.losses}</td>
										<td className="px-3 py-2.5 text-center text-ink-3">{row.goalsFor}</td>
										<td className="px-3 py-2.5 text-center text-ink-3">{row.goalsAgainst}</td>
										<td className="px-3 py-2.5 text-center font-bold text-white">{row.points}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			<div className="flex gap-3">
				{result.leagues[0] && (
					<Link
						href={`/admin/leagues/${result.leagues[0].id}`}
						className="flex-1 bg-brand hover:bg-brand-dim text-white text-sm font-semibold text-center py-3 rounded-xl transition"
					>
						Ver primera liga en admin →
					</Link>
				)}
				<button
					onClick={onReset}
					className="flex-1 bg-surface-2 hover:bg-surface-2 text-ink-2 text-sm font-semibold py-3 rounded-xl transition"
				>
					Correr otra
				</button>
			</div>
		</div>
	);
}

function SliderField({
	label,
	value,
	min,
	max,
	step,
	description,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	description: string;
	onChange: (v: number) => void;
}) {
	return (
		<div>
			<div className="flex items-center justify-between mb-1.5">
				<label className="text-xs text-ink-3">{label}</label>
				<span className="text-sm font-bold text-white tabular-nums">{value}</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-green-500"
			/>
			<p className="text-xs text-ink-2 mt-1">{description}</p>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="text-xs text-ink-2">{label}</p>
			<p className="text-sm font-bold text-white">{value}</p>
		</div>
	);
}
