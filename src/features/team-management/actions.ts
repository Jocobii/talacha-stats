/**
 * features/team-management/actions.ts
 * Operaciones de escritura para teams y roster.
 * Transacciones y logica de negocio — llamadas desde API routes.
 * No importar en Client Components.
 */

import { db, teams, leagueMembers, inscriptions } from "@/db";
import { eq, and } from "drizzle-orm";
import type { Team, LeagueMember, Inscription } from "@/db";
import type { UpdateTeamData, UpdateRosterMemberData } from "./types";
import { sanitizeToCanonical } from "@/shared/lib/normalize";

/** Actualiza nombre y/o color de un equipo. */
export async function updateTeamInfo(id: string, data: UpdateTeamData): Promise<Team> {
	const [updated] = await db
		.update(teams)
		.set({
			...(data.name && {
				name: data.name,
				// Recalcular canonical cada vez que cambia el nombre para mantener consistencia.
				nameCanonical: sanitizeToCanonical(data.name),
			}),
			color: data.color ?? null,
		})
		.where(eq(teams.id, id))
		.returning();
	if (!updated) throw new Error("Equipo no encontrado");
	return updated;
}

/**
 * Disuelve un equipo: elimina todas las inscriptions (jugadores quedan libres).
 * NO elimina el registro del equipo para preservar historial de partidos y estadisticas.
 * TODO: agregar columna deleted_at a teams cuando se requiera filtrado.
 */
export async function dissolveTeam(teamId: string): Promise<void> {
	await db.transaction(async (tx) => {
		// 1. Obtener inscriptions del equipo
		const teamInscriptions = await tx
			.select({ leagueMemberId: inscriptions.leagueMemberId })
			.from(inscriptions)
			.where(eq(inscriptions.teamId, teamId));

		// 2. Eliminar inscriptions — los jugadores quedan como agente libre en la liga
		await tx.delete(inscriptions).where(eq(inscriptions.teamId, teamId));

		// 3. Marcar leagueMembers como inactivos
		for (const { leagueMemberId } of teamInscriptions) {
			await tx
				.update(leagueMembers)
				.set({ status: "inactive" })
				.where(eq(leagueMembers.id, leagueMemberId));
		}
	});
}

/** Actualiza dorsal y/o estatus de un league_member. */
export async function updateRosterMember(
	memberId: string,
	data: UpdateRosterMemberData,
): Promise<LeagueMember> {
	const [updated] = await db
		.update(leagueMembers)
		.set({
			...(data.dorsal !== undefined && { dorsal: data.dorsal }),
			...(data.status && { status: data.status }),
		})
		.where(eq(leagueMembers.id, memberId))
		.returning();
	if (!updated) throw new Error("Jugador no encontrado");
	return updated;
}

/** Elimina la inscription de un jugador (baja del roster). Preserva leagueMember e historial. */
export async function removeFromRoster(memberId: string): Promise<void> {
	await db.delete(inscriptions).where(eq(inscriptions.leagueMemberId, memberId));
}

/**
 * Transfiere un jugador a otro equipo de la misma liga.
 * Elimina la inscription actual y crea una nueva en el equipo destino.
 * Preserva leagueMember, dorsal y todo el historial de eventos.
 */
export async function transferPlayer(memberId: string, targetTeamId: string): Promise<Inscription> {
	return db.transaction(async (tx) => {
		await tx.delete(inscriptions).where(eq(inscriptions.leagueMemberId, memberId));
		const [newInscription] = await tx
			.insert(inscriptions)
			.values({ leagueMemberId: memberId, teamId: targetTeamId })
			.returning();
		if (!newInscription) throw new Error("Error al crear inscripcion en equipo destino");
		return newInscription;
	});
}

/**
 * Agrega un jugador YA EXISTENTE (global_player) a un equipo.
 *
 * A diferencia del flujo de ventanilla (registerPlayer), aquí NO se crea
 * identidad: el jugador ya existe. Crear jugadores nuevos es responsabilidad
 * del módulo /admin/registro. Este flujo solo:
 *   1. Reutiliza el league_member de la liga (o lo crea si aún no es miembro).
 *   2. Crea la inscription al equipo.
 *
 * Todo en una transacción. Si el jugador ya está inscrito en un equipo de la
 * liga, retorna un error legible (la constraint UNIQUE(league_member_id) es el
 * último guardia).
 */
export type AddExistingResult =
	| { ok: true; memberId: string; inscriptionId: string }
	| { ok: false; code: "ALREADY_IN_TEAM"; error: string };

export async function addExistingPlayerToTeam(input: {
	globalPlayerId: string;
	leagueId: string;
	teamId: string;
	dorsal: number | null;
}): Promise<AddExistingResult> {
	try {
		return await db.transaction(async (tx) => {
			const member = await resolveLeagueMember(tx, input);

			const existing = await tx.query.inscriptions.findFirst({
				where: eq(inscriptions.leagueMemberId, member.id),
			});
			if (existing) {
				throw Object.assign(new Error("El jugador ya está en un equipo de esta liga"), {
					code: "ALREADY_IN_TEAM" as const,
				});
			}

			const [ins] = await tx
				.insert(inscriptions)
				.values({ leagueMemberId: member.id, teamId: input.teamId })
				.returning();
			if (!ins) throw new Error("No se pudo inscribir al equipo");

			return { ok: true as const, memberId: member.id, inscriptionId: ins.id };
		});
	} catch (err: unknown) {
		if (err instanceof Error && "code" in err && err.code === "ALREADY_IN_TEAM") {
			return { ok: false, code: "ALREADY_IN_TEAM", error: err.message };
		}
		console.error("[addExistingPlayerToTeam] error inesperado", err);
		throw err;
	}
}

/** Reutiliza el league_member de la liga o lo crea si el jugador aún no es miembro. */
async function resolveLeagueMember(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	input: { globalPlayerId: string; leagueId: string; dorsal: number | null },
): Promise<LeagueMember> {
	const existing = await tx.query.leagueMembers.findFirst({
		where: and(
			eq(leagueMembers.globalPlayerId, input.globalPlayerId),
			eq(leagueMembers.leagueId, input.leagueId),
		),
	});

	if (existing) {
		if (input.dorsal !== null) {
			await tx
				.update(leagueMembers)
				.set({ dorsal: input.dorsal })
				.where(eq(leagueMembers.id, existing.id));
		}
		return existing;
	}

	const [created] = await tx
		.insert(leagueMembers)
		.values({
			globalPlayerId: input.globalPlayerId,
			leagueId: input.leagueId,
			status: "active",
			dorsal: input.dorsal,
			inscriptionDate: new Date().toISOString().slice(0, 10),
		})
		.returning();
	if (!created) throw new Error("No se pudo crear la membresía en la liga");
	return created;
}
