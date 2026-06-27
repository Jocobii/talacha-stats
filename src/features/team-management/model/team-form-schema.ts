/**
 * features/team-management/model/team-form-schema.ts
 *
 * FUENTE ÚNICA del contrato del formulario de equipo (alta y edición de nombre/
 * color). Lo consumen:
 *   - el formulario (cliente) vía zodResolver de React Hook Form
 *   - el caso de uso del server (route /api/teams) vía CreateTeamSchema de @/types
 *
 * Client-safe: NO importa de @/db (Drizzle) ni de @/types (que arrastra el schema
 * de la base al bundle). Espeja los campos de negocio de CreateTeamSchema; el
 * `leagueId` no es parte del formulario — lo aporta el hook de mutación.
 */

import { z } from "zod";

export const TeamFormSchema = z.object({
	name: z.string().trim().min(1, "El nombre del equipo es requerido.").max(100),
	/** Hex preset o cadena vacía cuando no se elige color. */
	color: z.string().max(30).optional(),
});

export type TeamFormInput = z.infer<typeof TeamFormSchema>;
