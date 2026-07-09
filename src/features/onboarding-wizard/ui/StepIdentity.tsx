"use client";

/**
 * features/onboarding-wizard/ui/StepIdentity.tsx
 * Paso 1 — nombre + slug (con chequeo de disponibilidad en vivo) + logo +
 * estilo, todo en una sola pantalla (antes eran 2 pasos separados). Estado
 * en useIdentityStepForm (§3.5); este componente solo pinta.
 *
 * OrgStyleStep se importa por ruta profunda (§3.1: evita que el barrel, que
 * reexporta helpers server-side, entre al bundle del cliente) y con
 * showPreview={false}: el preview en vivo ahora lo pinta el aside del wizard
 * (OnboardingPreviewAside), no este paso.
 */

import { Controller } from "react-hook-form";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { WizardFooter } from "./WizardShared";
import { OrgSlugField } from "./OrgSlugField";
import { OrgStyleStep } from "@/features/org-theming/ui/OrgStyleStep";
import { useIdentityStepForm } from "../model/useIdentityStepForm";
import type { DraftIdentity, OrgIdentityView } from "../types";

type Props = {
	onIdentityReady: (identity: OrgIdentityView) => void;
	/** Notifica cada tecleo relevante al wizard, que lo pasa al aside de
	 *  preview (§ aún no existe una org real en este paso). */
	onDraftChange: (draft: DraftIdentity) => void;
};

export function StepIdentity({ onIdentityReady, onDraftChange }: Props) {
	const {
		form,
		style,
		slugStatus,
		handleNameChange,
		handleSlugChange,
		handleLogoUrlChange,
		handleStyleChange,
		onValid,
		canSubmit,
		createIdentity,
	} = useIdentityStepForm({ onIdentityReady, onDraftChange });

	const {
		register,
		handleSubmit,
		control,
		watch,
		formState: { errors },
	} = form;
	const name = watch("name");
	const logoUrlField = register("logoUrl");

	return (
		<Card className="p-6">
			<h2 className="font-display text-2xl text-ink font-bold tracking-tight mb-1">
				Ponle cara a tu liga
			</h2>
			<p className="text-sm text-ink-2 mb-5">
				Nombre, dirección y estilo. Esto es lo que verán tus jugadores en la página pública.
			</p>

			<form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
				<Controller
					control={control}
					name="name"
					render={({ field }) => (
						<Field label="Nombre de la organización" required error={errors.name?.message}>
							<Input
								autoFocus
								placeholder="Ej. Liga Jardines"
								{...field}
								onChange={(e) => {
									field.onChange(e);
									handleNameChange(e.target.value);
								}}
							/>
						</Field>
					)}
				/>

				<Controller
					control={control}
					name="slug"
					render={({ field }) => (
						<OrgSlugField
							value={field.value}
							onChange={handleSlugChange}
							status={slugStatus}
							error={errors.slug?.message}
						/>
					)}
				/>

				<Field
					label="Logo"
					hint="Si lo dejas vacío usamos las iniciales de tu liga."
					error={errors.logoUrl?.message}
				>
					<Input
						placeholder="Pega la URL de tu escudo (.png)"
						{...logoUrlField}
						onChange={(e) => {
							logoUrlField.onChange(e);
							handleLogoUrlChange(e.target.value);
						}}
					/>
				</Field>

				<OrgStyleStep
					value={style}
					onChange={handleStyleChange}
					orgName={name || undefined}
					showPreview={false}
				/>

				{createIdentity.isError && (
					<p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
						{createIdentity.error.message}
					</p>
				)}

				<WizardFooter
					leftHint="Cámbialo todo después."
					primary={
						<Button type="submit" variant="primary" disabled={!canSubmit}>
							{createIdentity.isPending ? "Creando…" : "Continuar"}
						</Button>
					}
				/>
			</form>
		</Card>
	);
}
