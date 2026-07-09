"use client";

/**
 * features/onboarding-wizard/model/useCreateIdentityStep.ts
 * Paso 1 (Identidad): crea la organización y, si el usuario eligió paleta,
 * guarda el tema. El tema es opcional y no bloquea el alta: si falla, se
 * loguea y se continúa igual — el usuario lo edita después en /admin (mismo
 * comportamiento del OnboardingForm original).
 */

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import type { Organization } from "@/entities/organization";
import type { OrgStyleValue } from "@/features/org-theming/ui/OrgStyleStep";
import { ORGANIZATIONS_URL, orgThemeUrl } from "../constants";
import { mapOrganizationToIdentity } from "../lib/map-organization-to-identity";
import type { OrgIdentityFormInput } from "./onboarding-org-schema";
import type { OrgIdentityView } from "../types";

type IdentityStepInput = { form: OrgIdentityFormInput; style: OrgStyleValue };

export function useCreateIdentityStep() {
	return useMutation<OrgIdentityView, Error, IdentityStepInput>({
		mutationFn: async ({ form, style }) => {
			const created = await apiFetch<Organization>(ORGANIZATIONS_URL, {
				method: "POST",
				body: { ...form, logoUrl: form.logoUrl || undefined },
			});
			if (!created.ok) throw new Error(created.error);

			await saveThemeIfChosen(created.data.id, style);

			return mapOrganizationToIdentity(created.data);
		},
	});
}

/** No bloquea el alta si falla: se loguea y el usuario ajusta el tema después. */
async function saveThemeIfChosen(organizationId: string, style: OrgStyleValue): Promise<void> {
	if (!style.presetId) return;

	const themed = await apiFetch(orgThemeUrl(organizationId), {
		method: "PUT",
		body: { mode: "preset", presetId: style.presetId, fontId: style.fontId },
	});
	if (!themed.ok) console.error("[useCreateIdentityStep] guardar tema", themed.error);
}
