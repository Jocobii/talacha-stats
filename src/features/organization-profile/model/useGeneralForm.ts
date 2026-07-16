"use client";

/**
 * features/organization-profile/model/useGeneralForm.ts
 * Estado del tab General: form RHF+Zod + disponibilidad de slug en vivo.
 * Extraído de la UI para mantenerla tonta (§7.3).
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GeneralFormSchema, type GeneralFormInput } from "./general-form-schema";
import { useOrgSlugAvailability } from "./useOrgSlugAvailability";
import { useUpdateOrganizationGeneral } from "./useUpdateOrganizationGeneral";
import type { OrganizationGeneralDto } from "../types";

export function useGeneralForm(organizationId: string, saved: OrganizationGeneralDto) {
	const slugCheck = useOrgSlugAvailability(saved.slug);
	const mutation = useUpdateOrganizationGeneral(organizationId);

	const form = useForm<GeneralFormInput>({
		resolver: zodResolver(GeneralFormSchema),
		mode: "onBlur",
		defaultValues: {
			name: saved.name,
			slug: saved.slug,
			city: saved.city,
			logoUrl: saved.logoUrl ?? "",
		},
	});
	const { setValue } = form;

	function handleSlugChange(value: string) {
		setValue("slug", value, { shouldValidate: true, shouldDirty: true });
		slugCheck.check(value);
	}

	function onValid(values: GeneralFormInput) {
		if (slugCheck.status === "taken" || slugCheck.status === "checking") return;
		mutation.mutate({
			name: values.name,
			slug: values.slug,
			city: values.city,
			logoUrl: values.logoUrl || undefined,
		});
	}

	const canSubmit = !mutation.isPending && slugCheck.status !== "taken";

	return { form, slugStatus: slugCheck.status, handleSlugChange, onValid, canSubmit, mutation };
}
