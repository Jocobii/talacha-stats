/**
 * features/onboarding-wizard/model/onboarding-org-schema.ts
 *
 * Schema del formulario del paso "Identidad". A diferencia del schema de
 * liga (ver onboarding-league-schema.ts), aquí SÍ reusamos el schema de
 * entities/organization en vez de duplicarlo: features → entities está
 * permitido por §3.1 (solo features → features está prohibido).
 *
 * Import PROFUNDO a propósito (./model, no el barrel `@/entities/organization`):
 * el barrel reexporta queries.ts/theme-queries.ts, que importan `@/db` (y por
 * tanto `pg`) — eso rompe el bundle de Client Components (mismo motivo que el
 * import profundo de OrgStyleStep, ver StepIdentity.tsx). `CreateOrganizationSchema`
 * vive en model.ts, que es puro/client-safe, así que importarlo directo de ahí
 * evita arrastrar el resto del barrel.
 *
 * `city` se omite del form: el server la default a "Tijuana" (igual que el
 * OnboardingForm original) y no se pide en el onboarding.
 */

import { z } from "zod";
import { CreateOrganizationSchema } from "@/entities/organization/model";

export const OrgIdentityFormSchema = CreateOrganizationSchema.omit({ city: true }).extend({
	// z.literal("") permite dejar el campo vacío sin disparar el .url() del
	// schema base; el hook de creación convierte "" → undefined al enviar.
	logoUrl: z.string().trim().url("URL de logo inválida").optional().or(z.literal("")),
});

export type OrgIdentityFormInput = z.infer<typeof OrgIdentityFormSchema>;
