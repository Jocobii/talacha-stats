/**
 * /admin/players/[id] — Perfil de jugador (admin)
 *
 * El [id] es un globalPlayerId (V2). La página:
 * 1. Carga datos básicos del global_player (V2).
 * 2. Carga estadísticas desde V1 si existe el perfil legacy.
 * 3. Carga las membresías (league_members) de la org del usuario para edición.
 * 4. Muestra el editor de inscripción solo a organizadores en sus ligas.
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
	getPlayerProfile,
	getGlobalPlayerBasic,
	getGlobalPlayerLeagueMembers,
} from "@/entities/player";
import type {
	PlayerLeagueStats,
	PlayerGlobalProfile,
	GlobalPlayerLeagueMember,
} from "@/entities/player";
import { db } from "@/db";
import { listCredentialsForPlayer } from "@/entities/player-credential/queries";
import { getOrganizationCredentialConfig } from "@/features/organization-credential-config/config";
import type { OrganizationCredentialConfigDto } from "@/entities/organization-credential-config";
import { getSessionUser } from "@/shared/lib/auth";
import { CredentialProfileSection } from "./CredentialProfileSection";

// ── Página principal ──────────────────────────────────────────────

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
	const [{ id }, user] = await Promise.all([params, getSessionUser()]);
	if (!user) redirect("/login");

	const isOrganizer = user.role === "organizer";
	const isOwner = user.role === "owner";
	const canEdit = isOrganizer || isOwner;

	// 1. Datos V1 (stats) — pueden no existir si el jugador es solo V2
	// 2. Datos V2 — global_player básico + league_members editables
	const [v1Profile, v2Basic, v2Members, rawCredentials] = await Promise.all([
		getPlayerProfile(id).catch(() => null),
		getGlobalPlayerBasic(id),
		canEdit
			? getGlobalPlayerLeagueMembers(id, isOwner ? undefined : (user.organizationId ?? undefined))
			: Promise.resolve([] as GlobalPlayerLeagueMember[]),
		listCredentialsForPlayer(db, id),
	]);

	// Si no existe en ningún sistema → 404
	if (!v1Profile && !v2Basic) notFound();

	// Credenciales (pantalla D) — data siloing: owner ve todas las orgs, un
	// organizer solo las suyas (mismo criterio que GET /api/players/[id]/credentials).
	const visibleCredentials = isOwner
		? rawCredentials
		: rawCredentials.filter((c) => c.organizationId === user.organizationId);

	const credentialGroups = Array.from(
		visibleCredentials
			.reduce((map, c) => {
				const group = map.get(c.organizationId) ?? {
					organizationId: c.organizationId,
					organizationName: c.organizationName,
					credentials: [] as typeof visibleCredentials,
				};
				group.credentials.push(c);
				map.set(c.organizationId, group);
				return map;
			}, new Map<string, { organizationId: string; organizationName: string; credentials: typeof visibleCredentials }>())
			.values(),
	);

	// Liga usada para emitir/renovar por organización — el pase se emite desde
	// el contexto de una liga; cualquiera de esa org sirve para derivar
	// organization_id (ver IssueCredentialModal). Solo resoluble para
	// organizaciones donde el usuario puede editar (v2Members ya viene scoped).
	const leagueIdByOrg: Record<string, string | undefined> = {};
	for (const m of v2Members) leagueIdByOrg[m.organizationId] ??= m.leagueId;

	const orgConfigEntries = canEdit
		? await Promise.all(
				credentialGroups
					.filter((g) => leagueIdByOrg[g.organizationId])
					.map(
						async (g) =>
							[g.organizationId, await getOrganizationCredentialConfig(g.organizationId)] as const,
					),
			)
		: [];
	const orgConfigByOrg: Record<string, OrganizationCredentialConfigDto | undefined> =
		Object.fromEntries(orgConfigEntries);

	// Nombre y datos básicos: V1 tiene más datos (alias, phone), V2 tiene birthDate
	const fullName = v1Profile?.fullName ?? v2Basic?.fullName ?? "Jugador";
	const alias = v1Profile?.alias ?? null;
	const phone = v1Profile?.phone ?? null;

	const hasStats =
		v1Profile != null &&
		(v1Profile.global.totalGoals > 0 ||
			v1Profile.global.totalAssists > 0 ||
			v1Profile.global.totalMatches > 0);

	// Indexar membresías por leagueId para cruzar con las league cards
	const membersByLeague = new Map<string, GlobalPlayerLeagueMember>(
		v2Members.map((m) => [m.leagueId, m]),
	);

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
				{v1Profile && (
					<Link
						href={`/player/${id}`}
						target="_blank"
						className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink hover:text-brand-ink transition"
					>
						Ver perfil público ↗
					</Link>
				)}
			</div>

			{/* ── Hero ────────────────────────────────────────────────────── */}
			<div className="bg-surface text-white rounded-2xl p-6 sm:p-8">
				<div className="flex flex-col sm:flex-row sm:items-center gap-6">
					{/* Avatar / inicial */}
					<div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-3xl font-black shrink-0">
						{(alias ?? fullName).charAt(0).toUpperCase()}
					</div>

					{/* Nombre */}
					<div className="flex-1 min-w-0">
						<h1 className="text-2xl sm:text-3xl font-black leading-tight">{fullName}</h1>
						{alias && (
							<p className="text-brand-ink text-lg font-semibold mt-0.5">&quot;{alias}&quot;</p>
						)}
						{phone && <p className="text-ink-3 text-sm mt-1">{phone}</p>}
						{v2Basic?.birthDate && (
							<p className="text-ink-3 text-sm mt-1">
								Nacimiento:{" "}
								{new Date(v2Basic.birthDate).toLocaleDateString("es-MX", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						)}
					</div>

					{/* Métrica principal */}
					{hasStats && v1Profile && (
						<div className="text-center sm:text-right shrink-0">
							{v1Profile.global.totalMatches > 0 ? (
								<>
									<p className="text-5xl font-black text-brand-ink leading-none">
										{v1Profile.global.goalsPerMatch.toFixed(2)}
									</p>
									<p className="text-ink-3 text-sm mt-1.5">goles / partido</p>
								</>
							) : (
								<>
									<p className="text-5xl font-black text-brand-ink leading-none">
										{v1Profile.global.totalGoals}
									</p>
									<p className="text-ink-3 text-sm mt-1.5">goles totales</p>
								</>
							)}
						</div>
					)}
				</div>
			</div>

			{/* ── Stats globales ────────────────────────────────────────────── */}
			{hasStats && v1Profile ? (
				<GlobalStatsBar global={v1Profile.global} />
			) : (
				<div className="bg-surface rounded-xl shadow p-5 text-center text-sm text-ink-3">
					Este jugador aún no tiene estadísticas registradas.
				</div>
			)}

			{/* ── Equipos actuales ───────────────────────────────────────────── */}
			{v2Members.some((m) => m.teamId) && <PlayerTeamsBar members={v2Members} />}

			{/* ── Ligas V1 (stats históricas) ────────────────────────────────── */}
			{v1Profile && v1Profile.leagues.length > 0 && (
				<section>
					<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wider mb-3">
						Historial de ligas ({v1Profile.leagues.length})
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{v1Profile.leagues.map((league) => (
							<LeagueStatsCard
								key={league.leagueId}
								league={league}
								v2Member={membersByLeague.get(league.leagueId)}
								globalPlayerId={id}
								canEdit={canEdit}
							/>
						))}
					</div>
				</section>
			)}

			{/* ── Credenciales (pantalla D) ──────────────────────────────────── */}
			{credentialGroups.length > 0 && (
				<CredentialProfileSection
					globalPlayerId={id}
					playerName={fullName}
					groups={credentialGroups}
					canEdit={canEdit}
					leagueIdByOrg={leagueIdByOrg}
					orgConfigByOrg={orgConfigByOrg}
				/>
			)}
		</div>
	);
}

// ── Barra de stats globales ───────────────────────────────────────────────

function GlobalStatsBar({ global: g }: { global: PlayerGlobalProfile }) {
	const stats = [
		{ label: "Goles", value: g.totalGoals, color: "text-brand-ink" },
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

// ── Equipos actuales ───────────────────────────────────────────────────

function PlayerTeamsBar({ members }: { members: GlobalPlayerLeagueMember[] }) {
	// Solo ligas activas cuentan como "actuales" — tras Nueva Temporada, el
	// jugador queda con membresía también en la liga vieja (finished) y ahí
	// se duplicaría el mismo equipo si no se filtra.
	const withTeam = members.filter((m) => m.teamId && m.leagueStatus === "active");

	return (
		<div className="bg-surface rounded-xl shadow p-5">
			<h2 className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest mb-3">
				Equipos actuales
			</h2>
			<div className="flex flex-wrap gap-2">
				{withTeam.map((m) => (
					<Link
						key={m.memberId}
						href={`/admin/teams/${m.teamId}`}
						className="inline-flex items-center gap-2 bg-surface-2 border border-line hover:border-brand/50 hover:bg-surface px-3 py-2 rounded-xl transition group"
					>
						<span className="text-[13px] font-semibold text-ink group-hover:text-brand-ink transition">
							{m.teamName}
						</span>
						<span className="text-[11px] text-ink-3">{m.leagueName}</span>
						<span className="text-ink-3 group-hover:text-brand-ink transition text-[11px]">↗</span>
					</Link>
				))}
			</div>
		</div>
	);
}
// ── Tarjeta de liga V1 (stats históricas + editor si hay membresía V2) ───────

function LeagueStatsCard({
	league: l,
	v2Member,
	globalPlayerId,
	canEdit,
}: {
	league: PlayerLeagueStats;
	v2Member?: GlobalPlayerLeagueMember;
	globalPlayerId: string;
	canEdit: boolean;
}) {
	const gpmColor =
		l.goalsPerMatch >= 1
			? "text-brand-ink"
			: l.goalsPerMatch >= 0.5
				? "text-yellow-600"
				: "text-ink-2";

	const borderColor = v2Member
		? ({ active: "border-green-500", suspended: "border-yellow-500", inactive: "border-line" }[
				v2Member.status
			] ?? "border-green-500")
		: "border-green-500";

	return (
		<div className={`bg-surface rounded-xl shadow border-t-4 ${borderColor} p-5 space-y-4`}>
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
					<span className="shrink-0 text-[10px] font-semibold bg-brand/15 text-brand-ink px-2 py-0.5 rounded-full">
						Importado
					</span>
				)}
			</div>

			{/* Stats: goles, asistencias, partidos */}
			<div className="grid grid-cols-3 gap-2">
				<StatBox label="Goles" value={l.goals} color="bg-brand/10 text-brand-ink" />
				<StatBox label="Asist." value={l.assists} color="bg-blue-950/40 text-blue-300" />
				<StatBox label="PJ" value={l.matchesPlayed} color="bg-surface-2 text-ink" />
			</div>

			{/* Goles por partido */}
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

			{/* Tarjetas */}
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
