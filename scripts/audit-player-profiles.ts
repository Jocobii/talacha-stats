/**
 * scripts/audit-player-profiles.ts
 *
 * Historia 02 — Auditoría del estado de player_profiles tras el backfill.
 *
 * Reporta:
 *   1. Cobertura general: perfiles por claim_status
 *   2. Registrations / season_stats / events aún sin player_profile_id (legacy no migrado)
 *   3. Contaminación cross-org detectada en el periodo pre-Historia-01:
 *      jugadores que tienen registrations en ligas de ORGs distintas
 *   4. Perfiles duplicados potenciales (mismo normalized_name, distinta org)
 *      — indica jugadores que juegan en múltiples orgs (válido pero notable)
 *
 * Ejecutar:
 *   npx tsx scripts/audit-player-profiles.ts
 *   npx tsx scripts/audit-player-profiles.ts --json   (output JSON)
 */

// ── Env must be loaded BEFORE any @/db import (db/index.ts validates at load time) ──
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { sql } from "drizzle-orm";

const JSON_OUTPUT = process.argv.includes("--json");

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	// Dynamic import AFTER config() has loaded .env.local
	const { db } = await import("../src/db/index.js");

	const [claimStatus, unlinked, crossOrg, sharedNames] = await Promise.all([
		reportClaimStatus(db),
		reportUnlinkedLegacy(db),
		reportCrossOrgContamination(db),
		reportSharedNormalizedNames(db),
	]);

	const report = {
		generatedAt: new Date().toISOString(),
		claimStatus,
		unlinkedLegacyRows: unlinked,
		crossOrgContamination: {
			playersAffected: crossOrg.length,
			details: crossOrg,
		},
		sharedNormalizedNames: {
			count: sharedNames.length,
			details: sharedNames,
		},
	};

	if (JSON_OUTPUT) {
		console.log(JSON.stringify(report, null, 2));
		return;
	}

	// Human-readable output
	console.log("\n=== Auditoría player_profiles ===");
	console.log(`Generado: ${report.generatedAt}\n`);

	console.log("── 1. Cobertura claim_status ──");
	const total = Object.values(claimStatus).reduce((s, v) => s + v, 0);
	for (const [status, cnt] of Object.entries(claimStatus)) {
		const pct = total > 0 ? ((cnt / total) * 100).toFixed(1) : "0.0";
		console.log(`   ${status.padEnd(12)} ${String(cnt).padStart(6)}  (${pct}%)`);
	}
	console.log(`   ${"TOTAL".padEnd(12)} ${String(total).padStart(6)}`);

	console.log("\n── 2. Filas legacy sin player_profile_id (pendientes de backfill) ──");
	console.log(`   player_registrations:  ${unlinked.registrations}`);
	console.log(`   player_season_stats:   ${unlinked.seasonStats}`);
	console.log(`   match_events:          ${unlinked.events}`);
	const pendingTotal = unlinked.registrations + unlinked.seasonStats + unlinked.events;
	if (pendingTotal === 0) {
		console.log("   → Backfill completo ✓");
	} else {
		console.log(`   → ${pendingTotal} filas pendientes — ejecutar backfill-player-profiles.ts`);
	}

	console.log("\n── 3. Contaminación cross-org (legacy pre Historia-01) ──");
	if (crossOrg.length === 0) {
		console.log("   Sin contaminación detectada ✓");
	} else {
		console.log(`   ${crossOrg.length} jugador(es) con registrations en múltiples orgs:`);
		for (const p of crossOrg.slice(0, 20)) {
			console.log(`   • "${p.fullName}" (${p.orgCount} orgs): ${p.orgs.join(" | ")}`);
		}
		if (crossOrg.length > 20) console.log(`   ... y ${crossOrg.length - 20} más`);
	}

	console.log("\n── 4. Nombres normalizados compartidos entre orgs ──");
	if (sharedNames.length === 0) {
		console.log("   Ninguno ✓");
	} else {
		console.log(`   ${sharedNames.length} nombre(s) aparecen en más de una org (primeros 10):`);
		for (const s of sharedNames.slice(0, 10)) {
			console.log(
				`   • "${s.normalizedName}" en ${s.profileCount} perfiles: ${s.orgs.join(" | ")}`,
			);
		}
	}

	console.log("");
}

// ---------------------------------------------------------------------------
// Queries — reciben db como parámetro porque se importa dinámicamente
// ---------------------------------------------------------------------------

import type { db as _DbInstance } from "../src/db/index.js";
type Db = typeof _DbInstance;

async function reportClaimStatus(db: Db): Promise<Record<string, number>> {
	const rows = await db.execute<{ claim_status: string; cnt: string }>(
		sql`SELECT claim_status, COUNT(*) AS cnt FROM player_profiles GROUP BY claim_status ORDER BY cnt DESC`,
	);
	const result: Record<string, number> = {};
	for (const row of rows.rows) {
		result[row.claim_status] = Number(row.cnt);
	}
	return result;
}

async function reportUnlinkedLegacy(
	db: Db,
): Promise<{ registrations: number; seasonStats: number; events: number }> {
	const [regRow] = (
		await db.execute<{ cnt: string }>(
			sql`SELECT COUNT(*) AS cnt FROM player_registrations WHERE player_profile_id IS NULL AND legacy_player_id IS NOT NULL`,
		)
	).rows;
	const [pssRow] = (
		await db.execute<{ cnt: string }>(
			sql`SELECT COUNT(*) AS cnt FROM player_season_stats WHERE player_profile_id IS NULL AND legacy_player_id IS NOT NULL`,
		)
	).rows;
	const [evRow] = (
		await db.execute<{ cnt: string }>(
			sql`SELECT COUNT(*) AS cnt FROM match_events WHERE player_profile_id IS NULL AND legacy_player_id IS NOT NULL`,
		)
	).rows;
	return {
		registrations: Number(regRow?.cnt ?? 0),
		seasonStats: Number(pssRow?.cnt ?? 0),
		events: Number(evRow?.cnt ?? 0),
	};
}

type CrossOrgPlayer = { playerId: string; fullName: string; orgCount: number; orgs: string[] };

async function reportCrossOrgContamination(db: Db): Promise<CrossOrgPlayer[]> {
	const rows = await db.execute<{
		player_id: string;
		full_name: string;
		org_count: string;
		org_names: string;
	}>(
		sql`
      SELECT p.id AS player_id, p.full_name,
             COUNT(DISTINCT l.organization_id) AS org_count,
             STRING_AGG(DISTINCT o.name, ', ' ORDER BY o.name) AS org_names
      FROM players p
      JOIN player_registrations pr ON pr.legacy_player_id = p.id
      JOIN leagues l ON l.id = pr.league_id
      JOIN organizations o ON o.id = l.organization_id
      WHERE l.organization_id IS NOT NULL
      GROUP BY p.id, p.full_name
      HAVING COUNT(DISTINCT l.organization_id) > 1
      ORDER BY org_count DESC, p.full_name
    `,
	);
	return rows.rows.map((r) => ({
		playerId: r.player_id,
		fullName: r.full_name,
		orgCount: Number(r.org_count),
		orgs: r.org_names.split(", "),
	}));
}

type SharedNameProfile = { normalizedName: string; profileCount: number; orgs: string[] };

async function reportSharedNormalizedNames(db: Db): Promise<SharedNameProfile[]> {
	const rows = await db.execute<{
		normalized_name: string;
		profile_count: string;
		org_names: string;
	}>(
		sql`
      SELECT pp.normalized_name, COUNT(*) AS profile_count,
             STRING_AGG(DISTINCT o.name, ', ' ORDER BY o.name) AS org_names
      FROM player_profiles pp
      JOIN organizations o ON o.id = pp.organization_id
      GROUP BY pp.normalized_name
      HAVING COUNT(*) > 1
      ORDER BY profile_count DESC, pp.normalized_name
      LIMIT 50
    `,
	);
	return rows.rows.map((r) => ({
		normalizedName: r.normalized_name,
		profileCount: Number(r.profile_count),
		orgs: r.org_names.split(", "),
	}));
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
