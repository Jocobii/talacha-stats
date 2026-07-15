/**
 * features/match-resolution/add-ad-hoc-player.ts
 * Agrega un jugador ad-hoc a un partido (no registrado previamente en el roster).
 * Usa el sistema nuevo: globalPlayers → leagueMembers → inscriptions.
 */
import { db } from "@/db";
import { matches, globalPlayers, leagueMembers, inscriptions, matchPlayerStats } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import type { AdHocPlayerResult } from "@/entities/match-player-stat";
import { assignNextCredential } from "@/entities/player/lib/assign-credential";

type AddAdHocInput = {
	matchId: string;
	teamSide: "home" | "away";
	fullName: string;
	shirtNumber: number;
	organizationId: string;
};

export async function addAdHocPlayer(input: AddAdHocInput): Promise<AdHocPlayerResult> {
	const { matchId, teamSide, fullName, shirtNumber } = input;

	// Resolver teamId y leagueId del partido
	const match = await db.query.matches.findFirst({
		where: eq(matches.id, matchId),
		columns: { homeTeamId: true, awayTeamId: true, leagueId: true },
	});
	if (!match) throw new Error("Partido no encontrado");

	const teamId = teamSide === "home" ? match.homeTeamId : match.awayTeamId;
	const { leagueId } = match;
	const fullNameCanonical = sanitizeToCanonical(fullName);

	// Verificar duplicado por nombre canónico en ese equipo × liga
	const existingRoster = await db
		.select({ inscriptionId: inscriptions.id, fullName: globalPlayers.fullName })
		.from(inscriptions)
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.where(
			and(
				eq(inscriptions.teamId, teamId),
				eq(leagueMembers.leagueId, leagueId),
				eq(globalPlayers.fullNameCanonical, fullNameCanonical),
			),
		);

	const duplicate = existingRoster[0];
	if (duplicate) {
		const error = new Error(
			`Ya existe un jugador con nombre similar ("${duplicate.fullName}") en este equipo`,
		) as Error & { code: string; existingRegistrationId: string };
		error.code = "DUPLICATE_PLAYER";
		error.existingRegistrationId = duplicate.inscriptionId;
		throw error;
	}

	// Crear globalPlayer (ad-hoc) → leagueMember → inscription → stat en transacción
	return await db.transaction(async (tx) => {
		// globalPlayer ad-hoc — CURP hash sintético único; fecha de nacimiento centinela
		const [player] = await tx
			.insert(globalPlayers)
			.values({
				curpHash: `adhoc-${crypto.randomUUID()}`,
				fullName,
				fullNameCanonical,
				birthDate: "1900-01-01",
			})
			.returning({ id: globalPlayers.id });

		if (!player) throw new Error("No se pudo crear el jugador ad-hoc");

		const today = new Date().toISOString().slice(0, 10);

		// credential_code se asigna aunque el jugador sea ad-hoc: también
		// aparece en la lista de asistencia del partido (ver
		// docs/CREDENCIAL-CODIGO-JUGADOR.md §6).
		const credentialCode = await assignNextCredential(tx, leagueId);

		const [member] = await tx
			.insert(leagueMembers)
			.values({
				globalPlayerId: player.id,
				leagueId,
				status: "active",
				credentialCode,
				inscriptionDate: today,
			})
			.returning({ id: leagueMembers.id });

		if (!member) throw new Error("No se pudo crear la membresía del jugador ad-hoc");

		const [inscription] = await tx
			.insert(inscriptions)
			.values({ leagueMemberId: member.id, teamId })
			.returning({ id: inscriptions.id });

		if (!inscription) throw new Error("No se pudo crear la inscripción del jugador ad-hoc");

		// Crear stat inicial: presente, contadores en 0
		await tx.insert(matchPlayerStats).values({
			matchId,
			playerRegistrationId: inscription.id,
			teamSide,
			isPresent: true,
			shirtNumber,
			goals: 0,
			assists: 0,
			yellowCards: 0,
			blueCards: 0,
			redCards: 0,
		});

		return { registrationId: inscription.id, playerProfileId: player.id };
	});
}
