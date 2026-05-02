import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerProfile } from "@/entities/player";
import type { PlayerLeagueStats, PlayerGlobalProfile } from "@/entities/player";

// ── Página principal (Server Component) ──────────────────────────────────────

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const profile = await getPlayerProfile(id);
	if (!profile) notFound();

	const { global: g } = profile;
	const hasStats = g.totalGoals > 0 || g.totalAssists > 0 || g.totalMatches > 0;

	return (
		<div className="max-w-4xl space-y-6">
			{/* Navegación */}
			<div className="flex items-center justify-between">
				<Link
					href="/admin/players"
					className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink transition"
				>
					← Todos los jugadores
				</Link>
				<Link
					href={`/player/${id}`}
					target="_blank"
					className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand transition"
				>
					Ver perfil público ↗
				</Link>
			</div>

			{/* ── Hero ─────────────────────────────────────────────────────────── */}
			<div className="bg-surface text-white rounded-2xl p-6 sm:p-8">
				<div className="flex flex-col sm:flex-row sm:items-center gap-6">
					{/* Avatar / inicial */}
					<div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-3xl font-black shrink-0">
						{(profile.alias ?? profile.fullName).charAt(0).toUpperCase()}
					</div>

					{/* Nombre */}
					<div className="flex-1 min-w-0">
						<h1 className="text-2xl sm:text-3xl font-black leading-tight">{profile.fullName}</h1>
						{profile.alias && (
							<p className="text-brand text-lg font-semibold mt-0.5">
								&quot;{profile.alias}&quot;
							</p>
						)}
						{profile.phone && <p className="text-ink-3 text-sm mt-1">{profile.phone}</p>}
					</div>

					{/* Métrica principal */}
					{hasStats && (
						<div className="text-center sm:text-right shrink-0">
							{g.totalMatches > 0 ? (
								<>
									<p className="text-5xl font-black text-brand leading-none">
										{g.goalsPerMatch.toFixed(2)}
									</p>
									<p className="text-ink-3 text-sm mt-1.5">goles / partido</p>
								</>
							) : (
								<>
									<p className="text-5xl font-black text-brand leading-none">{g.totalGoals}</p>
									<p className="text-ink-3 text-sm mt-1.5">goles totales</p>
								</>
							)}
						</div>
					)}
				</div>
			</div>

			{/* ── Stats globales ───────────────────────────────────────────────── */}
			{hasStats ? (
				<GlobalStatsBar global={g} />
			) : (
				<div className="bg-surface rounded-xl shadow p-5 text-center text-sm text-ink-3">
					Este jugador aún no tiene estadísticas registradas.
				</div>
			)}

			{/* ── Ligas ────────────────────────────────────────────────────────── */}
			{profile.leagues.length > 0 && (
				<section>
					<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wider mb-3">
						Ligas ({profile.leagues.length})
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{profile.leagues.map((league) => (
							<LeagueCard key={league.leagueId} league={league} />
						))}
					</div>
				</section>
			)}
		</div>
	);
}

// ── Barra de stats globales ───────────────────────────────────────────────────

function GlobalStatsBar({ global: g }: { global: PlayerGlobalProfile }) {
	const stats = [
		{ label: "Goles", value: g.totalGoals, color: "text-brand" },
		{ label: "Asistencias", value: g.totalAssists, color: "text-blue-600" },
		{ label: "Contribuciones", value: g.totalContributions, color: "text-purple-600" },
		{ label: "Partidos", value: g.totalMatches, color: "text-ink" },
		{ label: "Ligas", value: g.leaguesCount, color: "text-orange-600" },
	];

	return (
		<div className="bg-surface rounded-xl shadow p-5">
			<div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
				{stats.map((s) => (
					<div key={s.label} className="text-center">
						<p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
						<p className="text-xs text-ink-2 mt-0.5">{s.label}</p>
					</div>
				))}
			</div>
		</div>
	);
}

// ── Tarjeta por liga ──────────────────────────────────────────────────────────

function LeagueCard({ league: l }: { league: PlayerLeagueStats }) {
	const gpmColor =
		l.goalsPerMatch >= 1
			? "text-brand"
			: l.goalsPerMatch >= 0.5
				? "text-yellow-600"
				: "text-ink-2";

	return (
		<div className="bg-surface rounded-xl shadow border-t-4 border-green-500 p-5 space-y-4">
			{/* Encabezado */}
			<div className="flex items-start justify-between gap-2">
				<div>
					<p className="font-bold text-ink text-base leading-tight">{l.leagueName}</p>
					<p className="text-xs text-ink-3 mt-0.5 capitalize">
						{l.dayOfWeek} · {l.season}
					</p>
					<p className="text-sm text-ink-2 mt-1 font-medium">{l.teamName}</p>
				</div>
				{l.source === "season_stats" && (
					<span className="shrink-0 text-[10px] font-semibold bg-brand/15 text-brand px-2 py-0.5 rounded-full">
						Importado
					</span>
				)}
			</div>

			{/* Stats: goles, asistencias, partidos */}
			<div className="grid grid-cols-3 gap-2">
				<StatBox label="Goles" value={l.goals} color="bg-brand/10 text-brand" />
				<StatBox label="Asist." value={l.assists} color="bg-blue-950/40 text-blue-300" />
				<StatBox label="PJ" value={l.matchesPlayed} color="bg-surface-2 text-ink" />
			</div>

			{/* Goles por partido — o total de goles si no hay PJ */}
			{l.goals > 0 && (
				<div className="flex items-center justify-between border-t border-line pt-3">
					{l.matchesPlayed > 0 ? (
						<>
							<span className="text-xs text-ink-3">Goles por partido</span>
							<span className={`text-xl font-black ${gpmColor}`}>{l.goalsPerMatch.toFixed(2)}</span>
						</>
					) : (
						<>
							<span className="text-xs text-ink-3">Sin partidos registrados</span>
							<span className="text-xs text-ink-3">
								{l.goals} gol{l.goals !== 1 ? "es" : ""} importados
							</span>
						</>
					)}
				</div>
			)}

			{/* Tarjetas — solo si hay */}
			{(l.yellowCards > 0 || l.redCards > 0) && (
				<div className="flex gap-3 text-xs text-ink-2 border-t border-line pt-3">
					{l.yellowCards > 0 && (
						<span>
							🟨 {l.yellowCards} amarilla{l.yellowCards !== 1 ? "s" : ""}
						</span>
					)}
					{l.redCards > 0 && (
						<span>
							🟥 {l.redCards} roja{l.redCards !== 1 ? "s" : ""}
						</span>
					)}
				</div>
			)}
		</div>
	);
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
	return (
		<div className={`${color} rounded-lg p-2 text-center`}>
			<p className="text-xl font-black">{value}</p>
			<p className="text-[10px] font-medium">{label}</p>
		</div>
	);
}
