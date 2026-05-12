/**
 * features/import-excel/events.ts
 *
 * Flujo de importacion basado en eventos partido a partido.
 * Migrado desde src/lib/excel-import.ts.
 *
 * Mejoras respecto al original:
 *   - generateEventPreview: usa resolveImportEntities para batch fuzzy matching
 *     (N queries por jugador -> 2-4 queries totales)
 *   - confirmEventImport: batch inserts en cada paso
 *     (equipos, partidos, eventos — pre-cargados en batch, no en loop)
 *
 * Exportaciones publicas:
 *   generateEventPreview(input)  -> EventPreviewResult
 *   confirmEventImport(input)    -> EventConfirmResult
 */

import { and, eq, inArray } from "drizzle-orm";
import { db, leagues, players, teams, matches, matchEvents, playerRegistrations } from "@/db";
import { sanitizeName } from "@/shared/lib/normalize";
import { readWorkbook, sheetToObjects } from "@/shared/lib/excel";
import { resolveImportEntities } from "./resolver";
import type { EventType } from "@/db/schema";

/** Tipo del tx derivado sin importar drizzle directamente. */
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ---------------------------------------------------------------------------
// Tipos publicos
// ---------------------------------------------------------------------------

export type ImportRow = {
	jugador: string;
	equipo: string;
	jornada: number;
	equipoLocal: string;
	equipoVisitante: string;
	tipo: string;
	minuto?: number;
	fecha?: string;
};

export type ResultRow = {
	jornada: number;
	equipoLocal: string;
	golesLocal: number;
	equipoVisitante: string;
	golesVisitante: number;
	fecha?: string;
};

export type ParsedEventImport = {
	events: ImportRow[];
	results: ResultRow[];
};

export type PlayerMatch = {
	name: string;
	found: boolean;
	playerId?: string;
	candidates: { id: string; fullName: string; alias: string | null }[];
};

export type EventPreviewInput = {
	buffer: Buffer;
	leagueId: string;
};

export type EventPreviewResult = {
	events: ImportRow[];
	results: ResultRow[];
	playerMatches: PlayerMatch[];
	warnings: string[];
};

export type EventConfirmInput = {
	leagueId: string;
	events: ImportRow[];
	results: ResultRow[];
	/** nombre crudo -> playerId existente | "NEW" */
	playerResolutions: Record<string, string>;
};

export type EventConfirmResult = {
	matchesCreated: number;
	eventsInserted: number;
	playersCreated: number;
	errors: string[];
};

// ---------------------------------------------------------------------------
// API publica
// ---------------------------------------------------------------------------

/**
 * Parsea el Excel y resuelve jugadores en batch.
 * Reemplaza parseExcelBuffer + generateImportPreview del flujo original.
 */
export async function generateEventPreview(input: EventPreviewInput): Promise<EventPreviewResult> {
	const { buffer, leagueId } = input;

	// Parsear Excel
	const parsed = await parseEventBuffer(buffer);

	// Obtener organizationId de la liga para el scope del matching intra-org
	// HOTFIX Historia 01: el resolver ahora filtra por org, no por ciudad.
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { organizationId: true },
	});
	const organizationId = league?.organizationId ?? "";

	// Nombres unicos de jugadores y equipos
	const playerNames = [...new Set(parsed.events.map((e) => e.jugador).filter(Boolean))];
	const teamNames = [
		...new Set(
			[
				...parsed.events.map((e) => sanitizeName(e.equipo)),
				...parsed.results.map((r) => sanitizeName(r.equipoLocal)),
				...parsed.results.map((r) => sanitizeName(r.equipoVisitante)),
			].filter(Boolean),
		),
	];

	// Resolver jugadores en batch (2-4 queries via resolver)
	const { playerResolutions } = await resolveImportEntities({
		playerNames,
		teamNames,
		leagueId,
		organizationId,
	});

	// Mapear a PlayerMatch (formato legacy que espera la UI)
	const warnings: string[] = [];
	const playerMatches: PlayerMatch[] = playerResolutions.map((res) => {
		const candidates = res.candidates.map((c) => ({
			id: c.id,
			fullName: c.fullName,
			alias: c.alias,
		}));

		if (res.found && res.playerId) {
			return { name: res.rawName, found: true, playerId: res.playerId, candidates };
		}

		if (candidates.length > 1) {
			warnings.push(
				`"${res.rawName}" tiene ${candidates.length} candidatos — seleccionar manualmente.`,
			);
		} else {
			warnings.push(`"${res.rawName}" no existe — se creara como jugador nuevo.`);
		}

		return { name: res.rawName, found: false, candidates };
	});

	return { events: parsed.events, results: parsed.results, playerMatches, warnings };
}

/**
 * Confirma e inserta los datos en la DB usando batch inserts.
 * Reemplaza confirmImport del flujo original con N+1 eliminado.
 */
export async function confirmEventImport(input: EventConfirmInput): Promise<EventConfirmResult> {
	const { leagueId, events, results, playerResolutions } = input;
	const errors: string[] = [];
	let matchesCreated = 0;
	let eventsInserted = 0;
	let playersCreated = 0;

	// Pre-load: equipos existentes en la liga (una query)
	const allTeamNamesRaw = [
		...new Set(
			[
				...events.map((e) => sanitizeName(e.equipo)),
				...results.map((r) => sanitizeName(r.equipoLocal)),
				...results.map((r) => sanitizeName(r.equipoVisitante)),
			].filter(Boolean),
		),
	];

	const existingTeams: { id: string; name: string }[] =
		allTeamNamesRaw.length > 0
			? await db.query.teams.findMany({
					where: and(eq(teams.leagueId, leagueId), inArray(teams.name, allTeamNamesRaw)),
					columns: { id: true, name: true },
				})
			: [];

	const teamNameToId = new Map<string, string>(existingTeams.map((t) => [t.name, t.id]));

	// Pre-load: partidos existentes en la liga (una query)
	const existingMatches: {
		id: string;
		homeTeamId: string;
		awayTeamId: string;
		matchday: number | null;
	}[] = await db.query.matches.findMany({
		where: eq(matches.leagueId, leagueId),
		columns: { id: true, homeTeamId: true, awayTeamId: true, matchday: true },
	});

	// matchKey: "matchday-homeTeamId-awayTeamId"
	const matchKeyToId = new Map<string, string>(
		existingMatches.map((m) => [matchKey(m.matchday ?? 0, m.homeTeamId, m.awayTeamId), m.id]),
	);

	await db.transaction(async (tx: DbTx) => {
		// Paso 1: Crear nuevos jugadores en batch
		const newPlayerNames = Object.entries(playerResolutions)
			.filter(([, v]) => v === "NEW")
			.map(([name]) => name);

		const playerIdMap = new Map<string, string>(
			Object.entries(playerResolutions).filter(([, v]) => v !== "NEW") as [string, string][],
		);

		if (newPlayerNames.length > 0) {
			const inserted = await tx
				.insert(players)
				.values(newPlayerNames.map((name) => ({ fullName: sanitizeName(name) })))
				.returning({ id: players.id, fullName: players.fullName });

			for (let i = 0; i < newPlayerNames.length; i++) {
				playerIdMap.set(newPlayerNames[i], inserted[i].id);
				playersCreated++;
			}
		}

		// Paso 2: Crear nuevos equipos en batch
		const missingTeamNames = allTeamNamesRaw.filter((n) => !teamNameToId.has(n));

		if (missingTeamNames.length > 0) {
			const inserted = await tx
				.insert(teams)
				.values(missingTeamNames.map((name) => ({ name, leagueId })))
				.returning({ id: teams.id, name: teams.name });

			for (const t of inserted) {
				teamNameToId.set(t.name, t.id);
			}
		}

		// Paso 3: Crear/actualizar partidos en batch
		const newMatchValues: {
			leagueId: string;
			homeTeamId: string;
			awayTeamId: string;
			matchDate: string;
			matchday: number;
			homeScore: number;
			awayScore: number;
			status: string;
		}[] = [];

		for (const result of results) {
			const homeTeamId = teamNameToId.get(sanitizeName(result.equipoLocal));
			const awayTeamId = teamNameToId.get(sanitizeName(result.equipoVisitante));

			if (!homeTeamId || !awayTeamId) {
				errors.push(`Equipos no encontrados: ${result.equipoLocal} vs ${result.equipoVisitante}`);
				continue;
			}

			const key = matchKey(result.jornada, homeTeamId, awayTeamId);

			if (matchKeyToId.has(key)) {
				// Actualizar marcador del partido existente
				await tx
					.update(matches)
					.set({
						homeScore: result.golesLocal,
						awayScore: result.golesVisitante,
						status: "completed",
					})
					.where(eq(matches.id, matchKeyToId.get(key)!));
			} else {
				newMatchValues.push({
					leagueId,
					homeTeamId,
					awayTeamId,
					matchDate: result.fecha ?? new Date().toISOString().split("T")[0],
					matchday: result.jornada,
					homeScore: result.golesLocal,
					awayScore: result.golesVisitante,
					status: "completed",
				});
			}
		}

		if (newMatchValues.length > 0) {
			const inserted = await tx.insert(matches).values(newMatchValues).returning({
				id: matches.id,
				homeTeamId: matches.homeTeamId,
				awayTeamId: matches.awayTeamId,
				matchday: matches.matchday,
			});

			for (const m of inserted) {
				matchKeyToId.set(matchKey(m.matchday ?? 0, m.homeTeamId, m.awayTeamId), m.id);
				matchesCreated++;
			}
		}

		// Paso 4: Insertar registrations + eventos en batch
		const registrationValues: { legacyPlayerId: string; teamId: string; leagueId: string }[] = [];
		const eventValues: {
			matchId: string;
			legacyPlayerId: string;
			teamId: string;
			eventType: string;
			minute: number | null;
		}[] = [];

		for (const event of events) {
			const playerId = playerIdMap.get(event.jugador);
			if (!playerId) {
				errors.push(`Jugador sin resolver: ${event.jugador}`);
				continue;
			}

			const teamId = teamNameToId.get(sanitizeName(event.equipo));
			const homeTeamId = teamNameToId.get(sanitizeName(event.equipoLocal));
			const awayTeamId = teamNameToId.get(sanitizeName(event.equipoVisitante));
			const key = matchKey(event.jornada, homeTeamId ?? "", awayTeamId ?? "");
			const matchId = matchKeyToId.get(key);

			if (!matchId) {
				errors.push(`Partido no encontrado para evento de ${event.jugador} (J${event.jornada})`);
				continue;
			}

			if (teamId) {
				registrationValues.push({ legacyPlayerId: playerId, teamId, leagueId });
			}

			eventValues.push({
				matchId,
				legacyPlayerId: playerId,
				teamId: teamId ?? homeTeamId ?? awayTeamId ?? "",
				eventType: normalizeTipo(event.tipo),
				minute: event.minuto ?? null,
			});
		}

		// Registrations en batch (ignorar duplicados)
		if (registrationValues.length > 0) {
			await tx.insert(playerRegistrations).values(registrationValues).onConflictDoNothing();
		}

		// Eventos en batch
		if (eventValues.length > 0) {
			await tx.insert(matchEvents).values(eventValues);
			eventsInserted = eventValues.length;
		}
	});

	return { matchesCreated, eventsInserted, playersCreated, errors };
}

// ---------------------------------------------------------------------------
// Parser de Excel (funcion pura)
// ---------------------------------------------------------------------------

async function parseEventBuffer(buffer: Buffer): Promise<ParsedEventImport> {
	const workbook = await readWorkbook(buffer);
	const events: ImportRow[] = [];
	const results: ResultRow[] = [];

	const eventsSheet =
		workbook.sheets["Eventos"] ??
		workbook.sheets["eventos"] ??
		workbook.sheets[workbook.sheetNames[0]];

	if (eventsSheet) {
		for (const row of sheetToObjects(eventsSheet)) {
			const jugador = str(row["Jugador"] ?? row["jugador"] ?? row["JUGADOR"]);
			const tipo = normalizeTipo(str(row["Tipo"] ?? row["tipo"] ?? row["Evento"]));
			if (!jugador || !tipo) continue;

			events.push({
				jugador,
				equipo: str(row["Equipo"] ?? row["equipo"]),
				jornada: num(row["Jornada"] ?? row["jornada"]),
				equipoLocal: str(row["Equipo Local"] ?? row["Local"]),
				equipoVisitante: str(row["Equipo Visitante"] ?? row["Visitante"]),
				tipo,
				minuto: row["Minuto"] ? num(row["Minuto"]) : undefined,
				fecha: row["Fecha"] ? str(row["Fecha"]) : undefined,
			});
		}
	}

	const resultsSheet =
		workbook.sheets["Resultados"] ??
		workbook.sheets["resultados"] ??
		workbook.sheets[workbook.sheetNames[1]];

	if (resultsSheet) {
		for (const row of sheetToObjects(resultsSheet)) {
			const equipoLocal = str(row["Equipo Local"] ?? row["Local"]);
			const equipoVisitante = str(row["Equipo Visitante"] ?? row["Visitante"]);
			if (!equipoLocal || !equipoVisitante) continue;

			results.push({
				jornada: num(row["Jornada"] ?? row["jornada"]),
				equipoLocal,
				golesLocal: num(row["Goles Local"] ?? row["GL"]),
				equipoVisitante,
				golesVisitante: num(row["Goles Visitante"] ?? row["GV"]),
				fecha: row["Fecha"] ? str(row["Fecha"]) : undefined,
			});
		}
	}

	return { events, results };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchKey(matchday: number, homeTeamId: string, awayTeamId: string): string {
	return `${matchday}-${homeTeamId}-${awayTeamId}`;
}

function normalizeTipo(tipo: string): EventType {
	const map: Record<string, EventType> = {
		gol: "goal",
		goal: "goal",
		"gol propio": "own_goal",
		autogol: "own_goal",
		own_goal: "own_goal",
		asistencia: "assist",
		assist: "assist",
		amarilla: "yellow_card",
		yellow: "yellow_card",
		yellow_card: "yellow_card",
		roja: "red_card",
		red: "red_card",
		red_card: "red_card",
		mvp: "mvp",
	};
	return map[tipo.toLowerCase().trim()] ?? "goal";
}

function str(v: unknown): string {
	return String(v ?? "").trim();
}

function num(v: unknown): number {
	const n = parseInt(String(v ?? "0"), 10);
	return isNaN(n) ? 0 : n;
}
