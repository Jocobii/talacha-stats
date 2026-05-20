/**
 * features/admin-registration/hash.ts
 *
 * Utilidad server-only para derivar el curp_hash a partir del CURP raw.
 *
 * Regla de oro: el CURP nunca se persiste ni se loguea. Esta función
 * se ejecuta SOLO en el servidor (API route / Server Action).
 * El cliente nunca recibe ni envía el curpHash directamente — envía
 * el CURP raw en el POST y el servidor lo transforma aquí antes de
 * tocar cualquier query de DB.
 *
 * Algoritmo: sha256(CURP.toUpperCase().trim()) → hex lowercase 64 chars.
 */

import { createHash } from "crypto";

/**
 * Deriva el curp_hash a partir del CURP raw.
 * Input: CURP en cualquier casing — se normaliza internamente.
 * Output: sha256 hex en minúsculas (64 chars).
 */
export function hashCurp(curp: string): string {
	return createHash("sha256").update(curp.trim().toUpperCase()).digest("hex");
}
