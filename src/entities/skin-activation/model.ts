/**
 * entities/skin-activation/model.ts
 *
 * Contratos del recurso skin-activation (§7.4): DTOs nombrados que comparten
 * los API routes (tipado de salida) y los hooks de features (genérico de
 * apiFetch). Los tipos de fila se infieren del schema Drizzle (§4.1).
 *
 * El schema del formulario (client-safe, sin @/db) vive en
 * features/tournament-skin/model/activation-form-schema.ts (§7.2).
 */

import { z } from "zod";
import type { skinActivations } from "@/db/schema";

export type SkinActivation = typeof skinActivations.$inferSelect;
export type NewSkinActivation = typeof skinActivations.$inferInsert;

/** GET /api/skin — skin activo resuelto contra el registry; null = paleta TalachaStats. */
export const ActiveSkinResponseSchema = z.object({
	skinId: z.string().nullable(),
});
export type ActiveSkinResponse = z.infer<typeof ActiveSkinResponseSchema>;

/** Filas que viajan por /api/skin-activations. Fechas como "YYYY-MM-DD" (modo string de Drizzle). */
export type SkinActivationDto = Pick<
	SkinActivation,
	"id" | "skinId" | "name" | "startsOn" | "endsOn" | "isEnabled"
>;

/** PATCH /api/skin-activations/[id] — único campo mutable post-creación. */
export const ToggleSkinActivationSchema = z.object({
	isEnabled: z.boolean(),
});
export type ToggleSkinActivationInput = z.infer<typeof ToggleSkinActivationSchema>;
