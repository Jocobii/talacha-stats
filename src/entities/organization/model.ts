import { z } from "zod";
import { validateOrgSlug } from "@/shared/org-theme";

// ---------------------------------------------------------------------------
// Schemas Zod
// ---------------------------------------------------------------------------

export const CreateOrganizationSchema = z.object({
	name: z.string().min(2, "Escribe al menos 2 caracteres.").max(100, "Máximo 100 caracteres."),
	// El slug será mañana un subdominio (novofut.talachastats.com): validamos
	// DNS-safe + reservados con la MISMA función que usa el form (validateOrgSlug),
	// para que cliente y servidor rechacen exactamente lo mismo.
	slug: z
		.string()
		.trim()
		.toLowerCase()
		.superRefine((slug, ctx) => {
			const result = validateOrgSlug(slug);
			if (!result.ok) {
				ctx.addIssue({ code: "custom", message: result.message });
			}
		}),
	logoUrl: z.string().url("URL de logo inválida").optional(),
	city: z.string().min(2).max(60).default("Tijuana"),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

/** Respuesta de GET /api/organizations/check-slug (chequeo en tiempo real, §7.4). */
export const SlugAvailabilitySchema = z.object({ available: z.boolean() });

// ---------------------------------------------------------------------------
// Tipos inferidos
// ---------------------------------------------------------------------------

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type SlugAvailability = z.infer<typeof SlugAvailabilitySchema>;

/** Genera un slug a partir de un nombre:
 *  "Novofut Lunes" → "novofut-lunes"
 *
 *  Nota: usado también para slugs de LIGA (quick-create, new-season), por eso
 *  no delega en suggestOrgSlug (que recorta a 40 chars, dimensionado para
 *  subdominios de organización). Para el slug de ORG, el POST revalida con
 *  CreateOrganizationSchema (validateOrgSlug) — la red final. */
export function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "") // quitar acentos
		.replace(/[^a-z0-9\s-]/g, "") // solo alfanuméricos y espacios
		.trim()
		.replace(/\s+/g, "-") // espacios → guión
		.replace(/-+/g, "-") // guiones dobles → uno
		.replace(/^-|-$/g, ""); // sin guiones al inicio/fin
}
