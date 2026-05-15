/**
 * features/team-management/actions.ts
 * Operaciones de escritura para teams y roster.
 * Transacciones y logica de negocio — llamadas desde API routes.
 * No importar en Client Components.
 */

import { db, teams, leagueMembers, inscriptions } from "@/db";
import { eq } from "drizzle-orm";
import type { Team, LeagueMember, Inscription } from "@/db";
import type { UpdateTeamData, UpdateRosterMemberData } from "./types";

/** Actualiza nombre y/o color de un equipo. */
export async function updateTeamInfo(id: string, data: UpdateTeamData): Promise<Team> {
	const [updated] = await db
		.update(teams)
		.set({ ...(data.name && { name: data.name }), color: data.color ?? null })
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
