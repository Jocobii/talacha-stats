import { z } from "zod";
import { validateOrgSlug } from "@/shared/org-theme";

/** Espejo de CreateOrganizationSchema (entities/organization) para el form. */
export const GeneralFormSchema = z.object({
	name: z.string().min(2, "Escribe al menos 2 caracteres.").max(100, "Máximo 100 caracteres."),
	slug: z
		.string()
		.trim()
		.toLowerCase()
		.superRefine((slug, ctx) => {
			const result = validateOrgSlug(slug);
			if (!result.ok) ctx.addIssue({ code: "custom", message: result.message });
		}),
	city: z.string().min(2, "Escribe al menos 2 caracteres.").max(60, "Máximo 60 caracteres."),
	logoUrl: z.union([z.literal(""), z.string().url("URL de logo inválida")]),
});

export type GeneralFormInput = z.infer<typeof GeneralFormSchema>;
