/**
 * features/import-excel/types.ts
 *
 * Tipos compartidos del pipeline de importación (Historia 03).
 *
 * Jerarquía:
 *   ParsedRow         → una fila del Excel normalizada
 *   MatchOutcome      → resultado del motor de matching para esa fila
 *   ImportDecision    → decisión del organizador para resolver una duda/sugerencia
 *   ConfirmImportInput → input de confirmImportDecisions()
 *   ConfirmImportResult → resultado de la persistencia
 *
 * Seguridad cross-org:
 *   GlobalCandidate no incluye nombres de orgs ajenas, ligas, equipos ni stats.
 *   Solo expone el playerId global y un conteo agregado de apariciones.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// ParsedRow — fila normalizada del Excel lista para matching
// ---------------------------------------------------------------------------

export type ParsedRow = {
	/** Nombre tal como aparece en el Excel (post-sanitizeName) */
	rawFullName: string;
	/** Clave de matching exacto — resultado de normalizePlayerName() */
	normalizedName: string;
	/** Clave de deduplicación con dorsal — resultado de fingerprintPlayer() */
	fingerprint: string;
	alias?: string;
	jerseyNumber?: number;
	/** Nombre del equipo (sanitizado) */
	team: string;
	// Stats crudas del Excel
	goals: number;
	assists: number;
	yellowCards: number;
	redCards: number;
	matchesPlayed: number;
	jornada?: number;
};

// ---------------------------------------------------------------------------
// Candidatos
// ---------------------------------------------------------------------------

/**
 * Candidato intra-org (L3 fuzzy).
 * Solo contiene datos de la propia organización.
 */
export type ProfileCandidate = {
	profileId: string;
	fullName: string;
	alias: string | null;
	/** Liga más reciente donde apareció (dentro de la misma org) */
	leagueName: string;
	/** Score 0-100 — calculado por scoreCandidate() */
	score: number;
	/** Descripción legible del por qué se sugiere este candidato */
	reason: string;
};

/**
 * Candidato cross-org (L4 exact).
 * ⚠️ NUNCA incluir nombres de orgs ajenas, ligas, equipos ni stats detalladas.
 * Solo metadata agregada y anónima para que el organizador tome la decisión.
 */
export type GlobalCandidate = {
	/** players.id — identidad global en la plataforma */
	playerId: string;
	/** Nombre canónico del jugador en el sistema global */
	canonicalName: string;
	/** Cantidad de orgs distintas donde tiene historial — NO el detalle */
	appearancesCount: number;
};

// ---------------------------------------------------------------------------
// MatchOutcome — resultado del motor por fila
// ---------------------------------------------------------------------------

export type MatchOutcome =
	/** L1/L2: match seguro, se persiste sin intervención de UI */
	| {
			kind: "auto_resolved";
			profileId: string;
			via: "L1" | "L2";
			/** true si fue L2 (cross-league intra-org) — notificar al organizador */
			crossLeagueLink: boolean;
			row: ParsedRow;
	  }
	/** L3: candidatos ambiguos dentro de la org — requiere selección del organizador */
	| {
			kind: "intra_org_doubt";
			candidates: ProfileCandidate[];
			row: ParsedRow;
	  }
	/** L4: match exacto en otra org — propuesta opcional bajo feature flag */
	| {
			kind: "cross_org_suggestion";
			candidates: GlobalCandidate[];
			row: ParsedRow;
	  }
	/** Default: nada matcheó, se creará player_profile nuevo */
	| {
			kind: "create_new";
			row: ParsedRow;
	  };

// ---------------------------------------------------------------------------
// ImportDecision — decisión del organizador por fila
// ---------------------------------------------------------------------------

export const ImportDecisionSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("link_profile"),
		/** rowId = ParsedRow.fingerprint — identifica la fila unívocamente */
		rowId: z.string(),
		profileId: z.string().uuid(),
	}),
	z.object({
		kind: z.literal("create_new"),
		rowId: z.string(),
		fullName: z.string().min(2).max(200),
		alias: z.string().max(100).optional(),
	}),
	z.object({
		kind: z.literal("propose_claim"),
		rowId: z.string(),
		/** players.id — identidad global a reclamar */
		playerId: z.string().uuid(),
	}),
	z.object({
		kind: z.literal("ignore"),
		rowId: z.string(),
	}),
]);

export type ImportDecision = z.infer<typeof ImportDecisionSchema>;

// ---------------------------------------------------------------------------
// ConfirmImport — input / output de confirmImportDecisions()
// ---------------------------------------------------------------------------

export type ConfirmImportInput = {
	leagueId: string;
	organizationId: string;
	/** Outcomes auto-resueltos del preview (L1/L2) — se persisten sin decisión */
	autoResolved: Extract<MatchOutcome, { kind: "auto_resolved" }>[];
	/** Decisiones del organizador para los outcomes dudosos */
	decisions: ImportDecision[];
	/** Map rowId → ParsedRow para acceder a stats al persistir */
	rowsById: Map<string, ParsedRow>;
	jornada?: number;
};

export type ConfirmImportResult = {
	/** player_profiles creados (create_new decisions) */
	createdProfiles: number;
	/** player_registrations + season_stats actualizadas */
	updatedProfiles: number;
	/** proposed claims insertados (propose_claim decisions) */
	claimsProposed: number;
	/** proposed claims que se auto-verificaron (mutual claim) */
	claimsAutoVerified: number;
	errors: string[];
};

// ---------------------------------------------------------------------------
// PreviewResult del nuevo pipeline
// ---------------------------------------------------------------------------

export type ImportPreviewResult = {
	outcomes: MatchOutcome[];
	summary: {
		auto: number;
		doubts: number;
		suggestions: number;
		createNew: number;
	};
	jornada?: number;
	warnings: string[];
};
