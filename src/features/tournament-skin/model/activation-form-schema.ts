/**
 * features/tournament-skin/model/activation-form-schema.ts
 *
 * Schema Zod ÚNICO de la activación (§7.2): valida el form (zodResolver) y el
 * API route (safeParse). Client-safe: sin imports de @/db.
 */

import { z } from "zod";
import { SKIN_IDS } from "@/shared/skins/registry";
import { ACTIVATION_NAME_MAX, ACTIVATION_NAME_MIN } from "../constants";

export const ActivationFormSchema = z
	.object({
		skinId: z.enum(SKIN_IDS, { error: "Elige un tema del catálogo" }),
		name: z
			.string()
			.trim()
			.min(ACTIVATION_NAME_MIN, `Mínimo ${ACTIVATION_NAME_MIN} caracteres`)
			.max(ACTIVATION_NAME_MAX, `Máximo ${ACTIVATION_NAME_MAX} caracteres`),
		startsOn: z.iso.date({ error: "Fecha de inicio inválida" }),
		endsOn: z.iso.date({ error: "Fecha de fin inválida" }),
	})
	.refine((value) => value.startsOn <= value.endsOn, {
		message: "La fecha de fin debe ser igual o posterior a la de inicio",
		path: ["endsOn"],
	});

export type ActivationFormInput = z.infer<typeof ActivationFormSchema>;
