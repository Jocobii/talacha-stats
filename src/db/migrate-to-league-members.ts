/**
 * src/db/migrate-to-league-members.ts
 *
 * Migración de datos: player_profiles + player_registrations → league_members
 *
 * Cadena de resolución para obtener el global_player_id de cada registro:
 *   1. player_registrations.player_profile_id
 *      → player_profiles.claimed_player_id
 *      → players.id
 *      → global_players (via sha256("PENDING_" + players.id))
 *
 *   2. Fallback: player_registrations.legacy_player_id
 *      → players.id
 *      → global_players (via sha256("PENDING_" + players.id))
 *
 * Por cada registro resuelto, inserta en league_members con:
 *   - global_player_id resuelto
 *   - league_id del registro original
 *   - status = 'active'
 *   - inscription_date = fecha de registro original
 *   - dorsal = jersey_number (si existe)
 *
 * IDEMPOTENTE: omite pares (global_player_id, league_id) ya existentes.
 *
 * Uso:
 *   npx tsx src/db/migrate-to-league-members.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "dotenv";
import { createHash } from "crypto";
import {
	players,
	playerProfiles,
	playerRegistrations,
	globalPlayers,
	leagueMembers,
} from "./schema";

config({ path: ".env.local" });
config({ path: ".env" });

const url = (process.env.DATABASE_URL ?? "").trim();
if (!url) {
	console.error("❌  DATABASE_URL no definida");
	process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dummyHash(playerId: string): string {
	return createHash("sha256").update(`PENDING_${playerId}`).digest("hex");
}

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
	console.log("──────────────────────────────────────────────────────");
	console.log("🔄  Migración: player_registrations → league_members");
	console.log("──────────────────────────────────────────────────────");

	// 1. Construir mapa legacy_player_id → global_player_id
	//    usando los hashes dummy que ya existen en global_players
	console.log("📦  Cargando mapa de identidad legacy → global…");

	const globalRows = await db
		.select({ id: globalPlayers.id, curpHash: globalPlayers.curpHash })
		.from(globalPlayers);

	// Mapa: curp_hash → global_player.id
	const hashToGlobalId = new Map(globalRows.map((r) => [r.curpHash, r.id]));

	// Mapa: legacy player.id → global_player.id
	const legacyToGlobalId = new Map<string, string>();
	for (const row of globalRows) {
		// Los dummy hashes tienen formato sha256("PENDING_" + uuid)
		// Reconstruimos el player.id a partir del hash para armar el mapa inverso
		// No es posible invertir sha256, así que leemos players directamente
	}

	// Leer todos los players legacy para construir el mapa directo
	const legacyPlayers = await db.select({ id: players.id }).from(players);
	for (const p of legacyPlayers) {
		const hash = dummyHash(p.id);
		const globalId = hashToGlobalId.get(hash);
		if (globalId) legacyToGlobalId.set(p.id, globalId);
	}
	console.log(`   Jugadores mapeados: ${legacyToGlobalId.size}`);

	// 2. Leer player_profiles con su claimed_player_id
	const profiles = await db
		.select({ id: playerProfiles.id, claimedPlayerId: playerProfiles.claimedPlayerId })
		.from(playerProfiles);

	// Mapa: profile.id → global_player.id
	const profileToGlobalId = new Map<string, string>();
	for (const profile of profiles) {
		if (!profile.claimedPlayerId) continue;
		const globalId = legacyToGlobalId.get(profile.claimedPlayerId);
		if (globalId) profileToGlobalId.set(profile.id, globalId);
	}
	console.log(`   Perfiles con identidad global: ${profileToGlobalId.size}/${profiles.length}`);

	// 3. Leer todos los player_registrations
	const registrations = await db
		.select({
			id: playerRegistrations.id,
			playerProfileId: playerRegistrations.playerProfileId,
			legacyPlayerId: playerRegistrations.legacyPlayerId,
			leagueId: playerRegistrations.leagueId,
			jerseyNumber: playerRegistrations.jerseyNumber,
			registeredAt: playerRegistrations.registeredAt,
		})
		.from(playerRegistrations);

	console.log(`📋  Registros legacy: ${registrations.length}`);

	// 4. Leer league_members ya existentes para idempotencia
	const existingMembers = await db
		.select({
			globalPlayerId: leagueMembers.globalPlayerId,
			leagueId: leagueMembers.leagueId,
		})
		.from(leagueMembers);

	const existingSet = new Set(existingMembers.map((m) => `${m.globalPlayerId}:${m.leagueId}`));
	console.log(`✅  Ya migrados: ${existingSet.size}`);
	console.log("──────────────────────────────────────────────────────");

	// 5. Resolver y filtrar registros
	type MemberRow = {
		globalPlayerId: string;
		leagueId: string;
		status: "active";
		dorsal: number | null;
		inscriptionDate: string;
	};

	const toInsert: MemberRow[] = [];
	let unresolved = 0;

	for (const reg of registrations) {
		// Resolver global_player_id: primero por perfil, luego por legacy
		let globalPlayerId: string | undefined;

		if (reg.playerProfileId) {
			globalPlayerId = profileToGlobalId.get(reg.playerProfileId);
		}
		if (!globalPlayerId && reg.legacyPlayerId) {
			globalPlayerId = legacyToGlobalId.get(reg.legacyPlayerId);
		}

		if (!globalPlayerId) {
			unresolved++;
			continue;
		}

		// Omitir si ya existe el par (global_player_id, league_id)
		const key = `${globalPlayerId}:${reg.leagueId}`;
		if (existingSet.has(key)) continue;

		toInsert.push({
			globalPlayerId,
			leagueId: reg.leagueId,
			status: "active",
			dorsal: reg.jerseyNumber ?? null,
			inscriptionDate: reg.registeredAt ? reg.registeredAt.toISOString().slice(0, 10) : today(),
		});

		// Marcar como procesado para no duplicar en esta misma corrida
		existingSet.add(key);
	}

	console.log(`⏳  Por insertar: ${toInsert.length}`);
	if (unresolved > 0) {
		console.log(`⚠️   Sin resolver (sin perfil ni legacy): ${unresolved}`);
	}

	if (toInsert.length === 0) {
		console.log("ℹ️   Sin registros nuevos — migración ya completa.");
		return;
	}

	// 6. Insertar en lotes de 50
	const BATCH_SIZE = 50;
	let inserted = 0;
	let errors = 0;

	for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
		const batch = toInsert.slice(i, i + BATCH_SIZE);
		try {
			await db.insert(leagueMembers).values(batch).onConflictDoNothing();
			inserted += batch.length;
			process.stdout.write(`\r   Progreso: ${inserted + errors}/${toInsert.length}`);
		} catch (err) {
			console.error(`\n❌  Error en lote ${Math.floor(i / BATCH_SIZE) + 1}:`, err);
			errors += batch.length;
		}
	}

	console.log("\n──────────────────────────────────────────────────────");
	console.log(`✅  Insertados: ${inserted}`);
	if (errors > 0) console.log(`❌  Errores:    ${errors}`);
	if (unresolved > 0) {
		console.log(
			`⚠️   Sin resolver: ${unresolved} — revisar registros sin perfil ni legacy_player_id`,
		);
	}
	console.log("──────────────────────────────────────────────────────");
}

run()
	.then(() => pool.end())
	.catch((e) => {
		console.error("❌  Error fatal:", e);
		pool.end();
		process.exit(1);
	});
