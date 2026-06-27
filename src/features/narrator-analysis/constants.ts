/**
 * features/narrator-analysis/constants.ts
 * Magic strings, sinónimos de columnas y límites del flujo Excel (§3.5 DRY).
 */

import type { CanonicalField } from "@/entities/narrator/model";
import { REQUIRED_FIELDS } from "@/entities/narrator/model";

// ── Límites de seguridad del endpoint público (§8) ──────────────────────────
export const EXCEL_LIMITS = {
	maxFileBytes: 2 * 1024 * 1024, // 2 MB — una tabla de posiciones es chica
	maxRows: 500, // filas de datos máximas a leer
	maxColumns: 50,
	allowedMimeTypes: [
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
		"application/vnd.ms-excel", // .xls
		"application/octet-stream", // algunos browsers no setean el mime correcto
	],
	allowedExtensions: [".xlsx", ".xls"],
} as const;

/**
 * Sinónimos por campo canónico. Se comparan ya normalizados (lowercase, sin
 * acentos ni signos) contra cada header del Excel. El orden importa: el primer
 * match gana. Cubre los encabezados más comunes de ligas amateur en México.
 */
export const COLUMN_SYNONYMS: Record<CanonicalField, string[]> = {
	team: ["equipo", "equipos", "club", "nombre", "team", "escuadra"],
	position: ["pos", "posicion", "lugar", "no", "num", "#", "rank", "puesto"],
	played: ["pj", "jj", "jug", "juegos", "partidos", "pg pe pp", "gp", "mp", "j"],
	wins: ["pg", "jg", "g", "ganados", "gana", "victorias", "w", "win"],
	draws: ["pe", "je", "e", "empates", "empate", "empatados", "d", "draw"],
	losses: ["pp", "jp", "p", "perdidos", "perdidas", "derrotas", "l", "loss"],
	goalsFor: ["gf", "goles a favor", "favor", "anotados", "gana goles", "goles favor"],
	goalsAgainst: ["gc", "ge", "goles en contra", "contra", "recibidos", "goles contra"],
	points: ["pts", "puntos", "pt", "points", "punt"],
} as const;

/**
 * Etiquetas y ayuda para la UI de mapeo. `required` refleja REQUIRED_FIELDS
 * (Equipo, Pts, GF, GC) — el mínimo para un análisis útil.
 */
export const FIELD_LABELS: Record<CanonicalField, { label: string; required: boolean }> = {
	team: { label: "Equipo", required: true },
	points: { label: "Puntos (PTS)", required: true },
	goalsFor: { label: "Goles a favor (GF)", required: true },
	goalsAgainst: { label: "Goles en contra (GC)", required: true },
	position: { label: "Posición (Pos)", required: false },
	played: { label: "Partidos jugados (PJ)", required: false },
	wins: { label: "Ganados (G)", required: false },
	draws: { label: "Empatados (E)", required: false },
	losses: { label: "Perdidos (P)", required: false },
};

export const REQUIRED_FIELD_SET: ReadonlySet<CanonicalField> = new Set(REQUIRED_FIELDS);

/** Cuántas filas del inicio mostrar al usuario para que elija la de encabezados. */
export const HEADER_PICKER_ROWS = 6;

/** Filas de vista previa antes de pedir scroll (mobile). */
export const PREVIEW_ROWS_COLLAPSED = 12;

/**
 * Persistimos SOLO la plantilla de mapeo (qué columna es qué), nunca los datos.
 * Así, al subir un Excel con el mismo formato en otra cancha, se auto-aplica y
 * el flujo se reduce a subir → elegir equipos (NN/g Wizards, recomendación #8).
 * Los datos se limpian al refrescar o subir otro archivo.
 */
export const MAPPING_TEMPLATE_KEY = "ts.narrator.excel.mappingTemplate.v1";
