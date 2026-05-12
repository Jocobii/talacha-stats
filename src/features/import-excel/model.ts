/**
 * features/import-excel/model.ts
 *
 * Tipos y constantes que pertenecen al dominio de la UI del wizard de importación.
 * Los tipos de parsing y resolución de jugadores viven en sus módulos respectivos
 * (parser.ts, resolver.ts, anomaly-detector.ts) — aquí solo los re-usamos.
 *
 * Exports:
 *   - ImportTemplate     → plantillas guardadas por el usuario
 *   - BulkPreviewResult  → respuesta del endpoint /api/import/bulk (action=preview)
 *   - ImportResult       → respuesta del endpoint /api/import/bulk (action=confirm)
 *   - ImportStep         → pasos del wizard
 *   - FieldDefinition    → descriptor de un campo del mapeo
 *   - GOLEADORES_FIELDS  → campos disponibles para el mapeo de goleadores
 *   - STANDINGS_FIELDS   → campos disponibles para el mapeo de posiciones
 */

import type { GoleadoresRow, StandingsRow } from "./parser";
import type { PlayerResolution } from "./resolver";
import type { AnomalyReport } from "./anomaly-detector";

// ---------------------------------------------------------------------------
// Wizard navigation
// ---------------------------------------------------------------------------

export type ImportStep = "upload" | "map" | "preview" | "done";

// ---------------------------------------------------------------------------
// Import templates
// ---------------------------------------------------------------------------

export type ImportTemplate = {
	id: string;
	name: string;
	type: "goleadores" | "standings";
	headerRow: number;
	/** JSON-serialized Record<string, string> */
	columnMap: string;
};

// ---------------------------------------------------------------------------
// API response shapes (client-side representations)
// ---------------------------------------------------------------------------

/**
 * Respuesta del endpoint /api/import/bulk con action="preview".
 * Extiende PreviewResult del módulo preview.ts adaptándolo para el cliente.
 */
export type BulkPreviewResult = {
	type: "goleadores" | "standings";
	jornada?: number;
	rows: GoleadoresRow[] | StandingsRow[];
	playerResolutions?: PlayerResolution[];
	anomalyReports?: AnomalyReport[];
	warnings: string[];
	summary: {
		players?: number;
		teams?: number;
		totalGoals?: number;
	};
};

/**
 * Respuesta del endpoint /api/import/bulk con action="confirm".
 * Incluye el contenido generado post-importación (imagen, pills).
 */
export type ImportResult = {
	upserted: number;
	created: number;
	warnings: string[];
	content: {
		jornada: number;
		pills: {
			type: string;
			headline: string;
			detail: string;
			priority: number;
		}[];
		imageUrl: string;
	} | null;
};

// ---------------------------------------------------------------------------
// Field definitions for column mapping
// ---------------------------------------------------------------------------

export type FieldDefinition = {
	key: string;
	label: string;
	required: boolean;
};

export const GOLEADORES_FIELDS: FieldDefinition[] = [
	{ key: "rawName", label: "Nombre del jugador", required: true },
	{ key: "teamName", label: "Equipo", required: false },
	{ key: "goals", label: "Goles", required: true },
	{ key: "assists", label: "Asistencias", required: false },
	{ key: "yellowCards", label: "Tarjetas amarillas", required: false },
	{ key: "redCards", label: "Tarjetas rojas", required: false },
	{ key: "matchesPlayed", label: "Partidos jugados", required: false },
];

export const STANDINGS_FIELDS: FieldDefinition[] = [
	{ key: "teamName", label: "Equipo", required: true },
	{ key: "played", label: "Partidos jugados (JJ)", required: false },
	{ key: "wins", label: "Ganados (JG)", required: false },
	{ key: "draws", label: "Empatados (JE)", required: false },
	{ key: "losses", label: "Perdidos (JP)", required: false },
	{ key: "goalsFor", label: "Goles a favor (GF)", required: false },
	{ key: "goalsAgainst", label: "Goles en contra (GC)", required: false },
	{ key: "points", label: "Puntos (PTS)", required: true },
];

/**
 * Devuelve la lista de campos correspondiente al tipo de importación.
 * Función pura de conveniencia para evitar ternarios inline.
 */
export function getFieldsForType(type: "goleadores" | "standings"): FieldDefinition[] {
	return type === "goleadores" ? GOLEADORES_FIELDS : STANDINGS_FIELDS;
}
