"use client";

/**
 * features/onboarding-wizard/model/useIdentityStepForm.ts
 * Dueño del estado del paso Identidad: form RHF, estilo, disponibilidad de
 * slug y el snapshot en vivo que consume el aside de preview
 * (draftIdentity, vía onDraftChange). Extraído de StepIdentity.tsx para
 * respetar el límite de 150 líneas por componente (§3.5) — la UI queda tonta.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { suggestOrgSlug } from "@/shared/org-theme";
import { DEFAULT_ORG_STYLE, type OrgStyleValue } from "@/features/org-theming/ui/OrgStyleStep";
import { OrgIdentityFormSchema, type OrgIdentityFormInput } from "./onboarding-org-schema";
import { useSlugAvailability } from "./useSlugAvailability";
import { useCreateIdentityStep } from "./useCreateIdentityStep";
import type { DraftIdentity, OrgIdentityView } from "../types";

type Params = {
	onIdentityReady: (identity: OrgIdentityView) => void;
	onDraftChange: (draft: DraftIdentity) => void;
};

export function useIdentityStepForm({ onIdentityReady, onDraftChange }: Params) {
	const [style, setStyle] = useState<OrgStyleValue>(DEFAULT_ORG_STYLE);
	const [slugEdited, setSlugEdited] = useState(false);
	const slugCheck = useSlugAvailability();
	const createIdentity = useCreateIdentityStep();

	const form = useForm<OrgIdentityFormInput>({
		resolver: zodResolver(OrgIdentityFormSchema),
		mode: "onBlur",
		defaultValues: { name: "", slug: "", logoUrl: "" },
	});
	const { setValue, getValues } = form;

	function notifyDraft(next: Partial<Omit<DraftIdentity, "style">> & { style?: OrgStyleValue }) {
		const current = getValues();
		onDraftChange({
			name: next.name ?? current.name,
			slug: next.slug ?? current.slug,
			logoUrl: next.logoUrl ?? current.logoUrl,
			style: next.style ?? style,
		});
	}

	function handleNameChange(value: string) {
		if (slugEdited) {
			notifyDraft({ name: value });
			return;
		}
		const suggested = suggestOrgSlug(value);
		setValue("slug", suggested);
		slugCheck.check(suggested);
		notifyDraft({ name: value, slug: suggested });
	}

	function handleSlugChange(value: string) {
		setSlugEdited(true);
		setValue("slug", value);
		slugCheck.check(value);
		notifyDraft({ slug: value });
	}

	function handleLogoUrlChange(value: string) {
		notifyDraft({ logoUrl: value });
	}

	function handleStyleChange(next: OrgStyleValue) {
		setStyle(next);
		notifyDraft({ style: next });
	}

	function onValid(values: OrgIdentityFormInput) {
		if (slugCheck.status === "taken" || slugCheck.status === "checking") return;
		createIdentity.mutate({ form: values, style }, { onSuccess: onIdentityReady });
	}

	const canSubmit = !createIdentity.isPending && slugCheck.status !== "taken";

	return {
		form,
		style,
		slugStatus: slugCheck.status,
		handleNameChange,
		handleSlugChange,
		handleLogoUrlChange,
		handleStyleChange,
		onValid,
		canSubmit,
		createIdentity,
	};
}
