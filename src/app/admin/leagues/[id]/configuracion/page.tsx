/**
 * app/admin/leagues/[id]/configuracion/page.tsx
 *
 * Tab "Configuración" — settings de la liga:
 * organización, módulo de sorteo y nueva temporada.
 * La cabecera y el tab bar viven en el layout padre (leagues/[id]/layout.tsx).
 */

import { redirect, notFound } from "next/navigation";
import { eq, and, asc } from "drizzle-orm";
import { getSessionUser } from "@/shared/lib/auth";
import { db } from "@/db";
import {
	leagues,
	teams,
	leagueVenues,
	leaguePlayoffZones,
	leagueSchedulingConfig,
	venueTimeWindows,
	teamPurchasedTimeslots,
} from "@/db/schema";
import { listOrganizations } from "@/entities/organization";
import OrganizationSection from "../OrganizerSection";
import NewSeasonButton from "../NewSeasonButton";
import { SchedulingToggle } from "../sorteo/SchedulingToggle";
import { SlotsFijosSection } from "./SlotsFijosSection";
import type { SlotRow } from "./SlotsFijosSection";
import { PlayoffZonesSection } from "./PlayoffZonesSection";
import type { ZoneRow } from "./PlayoffZonesSection";
import { TeamsSection } from "./TeamsSection";
import { buildSlotsFromWindow } from "@/features/scheduling/slot-assigner/build-slots";

export const metadata = { title: "Configuración · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

type VenueWithSlots = { id: string; name: string; slots: string[] };

async function fetchVenuesForLeague(
	leagueId: string,
	dayOfWeek: string,
): Promise<VenueWithSlots[]> {
	const [pivotRows, windowRows, config] = await Promise.all([
		db.query.leagueVenues.findMany({
			where: eq(leagueVenues.leagueId, leagueId),
			with: { venue: { columns: { id: true, name: true } } },
		}),
		db.query.venueTimeWindows.findMany({
			where: and(
				eq(venueTimeWindows.leagueId, leagueId),
				eq(venueTimeWindows.dayOfWeek, dayOfWeek),
				eq(venueTimeWindows.isActive, true),
			),
			orderBy: [asc(venueTimeWindows.startTime)],
		}),
		db.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, leagueId),
			columns: { matchDurationMinutes: true, bufferMinutes: true },
		}),
	]);

	if (pivotRows.length === 0) return [];

	const duration = config?.matchDurationMinutes ?? 50;
	const buffer = config?.bufferMinutes ?? 0;

	// Build real slot start times per venue using the same logic as the slot assigner
	const slotsByVenue = new Map<string, string[]>();
	for (const w of windowRows) {
		const generated = buildSlotsFromWindow(w.venueId, w.startTime, w.endTime, duration, buffer);
		if (!slotsByVenue.has(w.venueId)) slotsByVenue.set(w.venueId, []);
		for (const s of generated) slotsByVenue.get(w.venueId)!.push(s.startTime);
	}

	return pivotRows.map((r) => ({
		id: r.venue.id,
		name: r.venue.name,
		slots: slotsByVenue.get(r.venueId) ?? [],
	}));
}

async function fetchPurchasedSlots(leagueId: string): Promise<SlotRow[]> {
	const rows = await db.query.teamPurchasedTimeslots.findMany({
		where: eq(teamPurchasedTimeslots.leagueId, leagueId),
		with: {
			team: { columns: { id: true, name: true, color: true } },
			venue: { columns: { id: true, name: true } },
		},
	});

	return rows.map((r) => ({
		id: r.id,
		teamId: r.team.id,
		teamName: r.team.name,
		teamColor: r.team.color,
		venueId: r.venueId ?? null,
		venueName: r.venue?.name ?? null,
		startTime: r.startTime,
	}));
}

export default async function ConfiguracionPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: {
			id: true,
			name: true,
			dayOfWeek: true,
			season: true,
			organizationId: true,
			schedulingEnabled: true,
		},
		with: {
			organization: {
				columns: { id: true, name: true, slug: true },
				with: {
					members: { columns: { id: true, name: true, email: true } },
				},
			},
		},
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	const isOwner = user.role === "owner";
	const [
		allOrganizations,
		leagueTeams,
		leagueVenuesList,
		purchasedSlots,
		leagueZones,
		leagueVenueCount,
	] = await Promise.all([
		isOwner ? listOrganizations() : Promise.resolve([]),
		db.query.teams.findMany({
			where: eq(teams.leagueId, id),
			columns: { id: true, name: true, color: true, status: true },
		}),
		league.schedulingEnabled
			? fetchVenuesForLeague(id, league.dayOfWeek ?? "")
			: Promise.resolve([]),
		league.schedulingEnabled ? fetchPurchasedSlots(id) : Promise.resolve([]),
		db.query.leaguePlayoffZones.findMany({
			where: eq(leaguePlayoffZones.leagueId, id),
			orderBy: [asc(leaguePlayoffZones.order), asc(leaguePlayoffZones.fromPosition)],
		}),
		db.query.leagueVenues.findMany({
			where: eq(leagueVenues.leagueId, id),
			columns: { venueId: true },
		}),
	]);

	const initialZones: ZoneRow[] = leagueZones.map((z) => ({
		id: z.id,
		name: z.name,
		fromPosition: z.fromPosition,
		toPosition: z.toPosition,
		color: z.color,
		order: z.order,
	}));

	const activeTeamCount = leagueTeams.filter((t) => t.status === "active").length;

	return (
		<div className="max-w-xl space-y-6">
			{/* ── Organización ──────────────────────────────────────────────── */}
			<OrganizationSection
				leagueId={id}
				current={league.organization ?? null}
				organizations={allOrganizations}
				isOwner={isOwner}
			/>

			{/* ── Módulo de sorteo ──────────────────────────────────────────── */}
			<div className="bg-surface rounded-lg shadow p-4">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-sm font-semibold text-ink">Módulo de sorteo</h2>
						<p className="text-xs text-ink-2 mt-1">
							Activa para sortear jornadas automáticamente, asignar canchas y gestionar el
							calendario de la liga.
						</p>
					</div>
					<SchedulingToggle leagueId={id} initialEnabled={league.schedulingEnabled} />
				</div>
			</div>

			{/* ── Slots fijos comprados ─────────────────────────────────────── */}
			{league.schedulingEnabled && (
				<SlotsFijosSection
					leagueId={id}
					teams={leagueTeams}
					venues={leagueVenuesList}
					initialSlots={purchasedSlots}
				/>
			)}

			{/* ── Zonas de clasificación ───────────────────────────────────── */}
			<PlayoffZonesSection leagueId={id} initialZones={initialZones} />

			{/* ── Equipos ───────────────────────────────────────────────────── */}
			<TeamsSection leagueId={id} teams={leagueTeams} />

			{/* ── Nueva temporada ───────────────────────────────────────────── */}
			<div className="bg-surface rounded-lg shadow p-4">
				<h2 className="text-sm font-semibold text-ink mb-1">Nueva temporada</h2>
				<p className="text-xs text-ink-2 mb-3">
					Crea la siguiente temporada copiando equipos, canchas y zonas. Los resultados anteriores
					quedan archivados en esta liga.
				</p>
				<NewSeasonButton
					leagueId={id}
					leagueName={league.name}
					teamCount={activeTeamCount}
					venueCount={leagueVenueCount.length}
					zoneCount={leagueZones.length}
				/>
			</div>
		</div>
	);
}
