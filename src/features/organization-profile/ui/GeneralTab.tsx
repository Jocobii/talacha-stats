"use client";

/**
 * features/organization-profile/ui/GeneralTab.tsx
 * Tab General del hub (docs/ORG-PROFILE-HUB.md §7 O2): nombre, slug, ciudad,
 * logo. Backend ya existía (PATCH /api/organizations/[id]) — esto es la
 * primera pantalla que lo consume. Logo: MVP como campo de URL de imagen
 * (no hay pipeline de subida de archivos en el repo hoy).
 */

import { Controller } from "react-hook-form";
import { Building2, Image as ImageIcon } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { SaveButton } from "@/shared/ui/SaveButton";
import { useOrganizationGeneral } from "../model/useOrganizationGeneral";
import { useGeneralForm } from "../model/useGeneralForm";
import { SlugField } from "./SlugField";
import type { OrganizationGeneralDto } from "../types";

type Props = {
	organizationId: string;
	initialData: OrganizationGeneralDto;
};

export function GeneralTab({ organizationId, initialData }: Props) {
	const { data: saved } = useOrganizationGeneral(organizationId, initialData);
	const { form, slugStatus, handleSlugChange, onValid, canSubmit, mutation } = useGeneralForm(
		organizationId,
		saved,
	);
	const {
		register,
		handleSubmit,
		control,
		watch,
		formState: { errors },
	} = form;
	const logoUrl = watch("logoUrl");

	return (
		<Card className="p-6">
			<form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
				<Field label="Nombre de la organización" required error={errors.name?.message}>
					<Input placeholder="Ej. Liga MiLigaTest" {...register("name")} />
				</Field>

				<Controller
					control={control}
					name="slug"
					render={({ field }) => (
						<SlugField
							value={field.value}
							onChange={handleSlugChange}
							status={slugStatus}
							error={errors.slug?.message}
						/>
					)}
				/>

				<Field label="Ciudad" required error={errors.city?.message}>
					<Input placeholder="Ej. Tijuana" {...register("city")} />
				</Field>

				<Field
					label="Logo"
					hint="URL de la imagen del logo. Si lo dejas vacío usamos las iniciales."
					error={errors.logoUrl?.message}
				>
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 rounded-full bg-surface-2 border border-line grid place-items-center text-ink-3 shrink-0 overflow-hidden">
							{logoUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={logoUrl} alt="" className="w-full h-full object-cover" />
							) : (
								<Building2 size={22} strokeWidth={1.5} />
							)}
						</div>
						<Input icon={ImageIcon} placeholder="https://…/logo.png" {...register("logoUrl")} />
					</div>
				</Field>

				<div className="mt-2 pt-5 border-t border-line flex justify-end">
					<SaveButton
						type="submit"
						variant="primary"
						disabled={!canSubmit}
						status={mutation.status}
						errorMessage={mutation.error?.message}
						label="Guardar cambios"
					/>
				</div>
			</form>
		</Card>
	);
}
