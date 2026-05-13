import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, teams, leagues } from "@/db";
import { getTeamRoster } from "@/entities/player";
import type { TeamRosterEntry } from "@/entities/player";

// ── Helpers ───────────────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_LABEL: Record<TeamRosterEntry["status"], string> = {
	active: "Activo",
	suspended: "Suspendido",
	inactive: "Inactivo",
};

const STATUS_COLOR: Record<TeamRosterEntry["status"], string> = {
	active: "bg-brand/15 text-brand",
	suspended: "bg-yellow-900/40 text-yellow-400",
	inactive: "bg-surface-2 text-ink-3",
};

// ── Página principal (Server Component) ──────────────────────────────────────

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!UUID_REGEX.test(id)) notFound();

	// Carga equipo + liga en paralelo con el roster
	const [teamRows, roster] = await Promise.all([
		db
			.select({
				teamId: teams.id,
				teamName: teams.name,
				leagueId: leagues.id,
				leagueName: leagues.name,
				season: leagues.season,
				dayOfWeek: leagues.dayOfWeek,
			})
			.from(teams)
			.innerJoin(leagues, eq(leagues.id, teams.leagueId))
			.where(eq(teams.id, id))
			.limit(1),
		getTeamRoster(id),
	]);

	const team = teamRows[0];
	if (!team) notFound();

	const activeCount = roster.filter((p) => p.status === "active").length;
	const suspendedCount = roster.filter((p) => p.status === "suspended").length;

	return (
		<div className="max-w-3xl space-y-6">
			{/* Navegación */}
			<div className="flex items-center justify-between">
				<Link
					href="/admin/teams"
					className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink transition"
				>
					← Gestionar equipos
				</Link>
				<Link
					href={`/admin/registro?leagueId=${team.leagueId}`}
					className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
				>
					+ Inscribir jugador
				</Link>
			</div>

			{/* Hero */}
			<div className="bg-surface rounded-2xl p-6 sm:p-8 space-y-1">
				<p className="text-xs font-semibold uppercase tracking-widest text-ink-3">
					{team.leagueName} · {team.season} · {team.dayOfWeek}
				</p>
				<h1 className="text-3xl font-black text-white">{team.teamName}</h1>

				{/* Resumen numérico */}
				<div className="flex gap-6 pt-3">
					<div className="text-center">
						<p className="text-4xl font-black text-brand">{roster.length}</p>
						<p className="text-xs text-ink-3 mt-0.5">inscritos</p>
					</div>
					{activeCount > 0 && (
						<div className="text-center">
							<p className="text-4xl font-black text-white">{activeCount}</p>
							<p className="text-xs text-ink-3 mt-0.5">activos</p>
						</div>
					)}
					{suspendedCount > 0 && (
						<div className="text-center">
							<p className="text-4xl font-black text-yellow-400">{suspendedCount}</p>
							<p className="text-xs text-ink-3 mt-0.5">suspendidos</p>
						</div>
					)}
				</div>
			</div>

			{/* Roster */}
			{roster.length === 0 ? (
				<div className="bg-surface rounded-xl shadow p-8 text-center space-y-3">
					<p className="text-ink-2 text-sm">
						Este equipo aún no tiene jugadores inscritos en el sistema V2.
					</p>
					<Link
						href={`/admin/registro?leagueId=${team.leagueId}`}
						className="inline-block bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand/90 transition"
					>
						Inscribir primer jugador
					</Link>
				</div>
			) : (
				<div className="bg-surface rounded-xl shadow overflow-hidden">
					<div className="px-4 py-3 border-b border-line">
						<p className="text-sm font-medium text-ink">
							{roster.length} jugador{roster.length !== 1 ? "es" : ""} inscrito
							{roster.length !== 1 ? "s" : ""}
						</p>
					</div>

					<table className="w-full text-sm">
						<thead className="bg-surface-2 text-xs uppercase text-ink-2">
							<tr>
								<th className="px-4 py-2 text-center w-12">#</th>
								<th className="px-4 py-2 text-left">Jugador</th>
								<th className="px-4 py-2 text-center hidden sm:table-cell">Fecha nasc.</th>
								<th className="px-4 py-2 text-center">Estado</th>
								<th className="px-4 py-2 text-right hidden sm:table-cell">Inscripción</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{roster.map((player) => (
								<PlayerRow key={player.inscriptionId} player={player} />
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

// ── Fila de jugador ───────────────────────────────────────────────────────────

function PlayerRow({ player: p }: { player: TeamRosterEntry }) {
	const initials = p.fullName
		.split(" ")
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();

	// Fecha de nacimiento formateada
	const birthFormatted = p.birthDate
		? new Date(p.birthDate + "T12:00:00").toLocaleDateString("es-MX", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			})
		: "—";

	// Fecha de inscripción formateada
	const inscriptionFormatted = p.inscriptionDate
		? new Date(p.inscriptionDate + "T12:00:00").toLocaleDateString("es-MX", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			})
		: "—";

	return (
		<tr className="hover:bg-surface-2 transition">
			{/* Dorsal */}
			<td className="px-4 py-3 text-center">
				{p.dorsal != null ? (
					<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand/15 text-brand font-black text-sm">
						{p.dorsal}
					</span>
				) : (
					<span className="text-ink-3 text-xs">—</span>
				)}
			</td>

			{/* Avatar + nombre */}
			<td className="px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-xs font-bold text-brand shrink-0">
						{initials}
					</div>
					<span className="font-medium text-ink">{p.fullName}</span>
				</div>
			</td>

			{/* Fecha nacimiento */}
			<td className="px-4 py-3 text-center text-ink-2 hidden sm:table-cell">{birthFormatted}</td>

			{/* Estado */}
			<td className="px-4 py-3 text-center">
				<span
					className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLOR[p.status]}`}
				>
					{STATUS_LABEL[p.status]}
				</span>
			</td>

			{/* Fecha inscripción */}
			<td className="px-4 py-3 text-right text-xs text-ink-3 hidden sm:table-cell">
				{inscriptionFormatted}
			</td>
		</tr>
	);
}
