import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas Zod
// ---------------------------------------------------------------------------

export const CreateOrganizationSchema = z.object({
	name: z.string().min(2).max(100),
	slug: z
		.string()
		.min(2)
		.max(60)
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"El slug solo puede contener letras minúsculas, números y guiones",
		),
	logoUrl: z.string().url("URL de logo inválida").optional(),
	city: z.string().min(2).max(60).default("Tijuana"),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

// ---------------------------------------------------------------------------
// Tipos inferidos
// ---------------------------------------------------------------------------

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

/** Genera un slug a partir de un nombre:
 *  "Novofut Lunes" → "novofut-lunes"
 */
export function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "") // quitar acentos
		.replace(/[^a-z0-9\s-]/g, "")   // solo alfanuméricos y espacios
		.trim()
		.replace(/\s+/g, "-")            // espacios → guión
		.replace(/-+/g, "-")             // guiones dobles → uno
		.replace(/^-|-$/g, "");          // sin guiones al inicio/fin
}
