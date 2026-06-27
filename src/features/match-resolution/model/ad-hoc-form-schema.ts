/**
 * features/match-resolution/model/ad-hoc-form-schema.ts
 *
 * Contrato único del formulario de alta de jugador ad-hoc. Lo consumen:
 *   - el formulario (cliente) vía zodResolver de React Hook Form
 *   - el API route (POST /api/matches/[id]/players) vía safeParse
 *
 * Client-safe: NO importa de @/db. Espeja el AddAdHocSchema del route (sin
 * `teamSide`, que lo aporta el modal por props, no el formulario).
 */

import { z } from "zod";

export const AdHocPlayerFormSchema = z.object({
	fullName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
	// El input se registra con `valueAsNumber` (RHF), así que llega ya como number
	// — sin `coerce`, para que input y output del schema coincidan (RHF + zodResolver).
	shirtNumber: z.number().int().min(1).max(99),
});

export type AdHocPlayerFormInput = z.infer<typeof AdHocPlayerFormSchema>;
