"use client";

/**
 * app/onboarding/OnboardingForm.tsx
 *
 * Wizard de alta de organización (2 pasos):
 *  1. Identidad básica — nombre + slug (validado con validateOrgSlug: DNS-safe
 *     + reservados, el mismo criterio que revalida el server).
 *  2. Identidad visual — logo (URL) + paleta + tipografía, con preview en vivo
 *     reutilizando OrgStyleStep de la feature org-theming.
 *
 * §7.2 — el slug es derivado del nombre hasta que el usuario lo edita a mano
 * (se calcula en el onChange, nunca con setState dentro de useEffect).
 *
 * Import profundo de OrgStyleStep (…/ui/OrgStyleStep) a propósito: el barrel
 * de la feature reexporta helpers server-side (getOrgTheme → @/db) que no
 * deben entrar al bundle de este Client Component.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/shared/api/client";
import { suggestOrgSlug, validateOrgSlug } from "@/shared/org-theme";
import {
	OrgStyleStep,
	DEFAULT_ORG_STYLE,
	type OrgStyleValue,
} from "@/features/org-theming/ui/OrgStyleStep";

export default function OnboardingForm() {
	const router = useRouter();

	const [step, setStep] = useState<1 | 2>(1);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);
	const [logoUrl, setLogoUrl] = useState("");
	const [style, setStyle] = useState<OrgStyleValue>(DEFAULT_ORG_STYLE);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// Nombre → slug sugerido mientras el usuario no lo edite a mano (event
	// handler, no efecto). Una vez editado, respetamos su valor.
	function handleNameChange(value: string) {
		setName(value);
		if (!slugEdited) setSlug(suggestOrgSlug(value));
	}

	function handleSlugChange(value: string) {
		setSlugEdited(true);
		setSlug(value.toLowerCase());
	}

	const slugValidation = validateOrgSlug(slug);
	const canContinue = name.trim().length >= 2 && slugValidation.ok;

	function goToStyle(e: React.FormEvent) {
		e.preventDefault();
		if (!canContinue) return;
		setError("");
		setStep(2);
	}

	async function handleCreate() {
		setError("");
		setLoading(true);
		try {
			const created = await apiFetch<{ id: string }>("/api/organizations", {
				method: "POST",
				body: {
					name: name.trim(),
					slug,
					logoUrl: logoUrl.trim() || undefined,
				},
			});
			if (!created.ok) {
				setError(created.error ?? "No se pudo crear la organización.");
				setLoading(false);
				return;
			}

			// Tema opcional: solo lo guardamos si el usuario eligió una paleta.
			// Sin paleta la org se queda con el tema TalachaStats (fallback).
			if (style.presetId) {
				const themed = await apiFetch(`/api/organizations/${created.data.id}/theme`, {
					method: "PUT",
					body: { mode: "preset", presetId: style.presetId, fontId: style.fontId },
				});
				if (!themed.ok) {
					// El tema es opcional y editable después: no bloqueamos el alta.
					console.error("[OnboardingForm] guardar tema", themed.error);
				}
			}

			router.push("/onboarding/arranque");
		} catch (networkError) {
			console.error("[OnboardingForm] create", networkError);
			setError("Error de conexión. Intenta de nuevo.");
			setLoading(false);
		}
	}

	return (
		<div className={`rounded-2xl bg-surface p-6 shadow ${step === 1 ? "mx-auto max-w-lg" : ""}`}>
			{/* Indicador de paso */}
			<ol className="mb-6 flex items-center gap-2 text-xs font-medium text-ink-2">
				<StepDot n={1} active={step === 1} done={step > 1} label="Identidad" />
				<span className="h-px flex-1 bg-line" aria-hidden />
				<StepDot n={2} active={step === 2} done={false} label="Estilo" />
			</ol>

			{step === 1 ? (
				<form onSubmit={goToStyle} className="space-y-5">
					<div>
						<label htmlFor="org-name" className="mb-2 block text-sm font-medium text-ink">
							Nombre de tu organización
						</label>
						<input
							id="org-name"
							type="text"
							value={name}
							onChange={(e) => handleNameChange(e.target.value)}
							placeholder="Ej. Novofut"
							autoFocus
							required
							minLength={2}
							className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink placeholder-ink-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
						/>
					</div>

					<div>
						<label htmlFor="org-slug" className="mb-2 block text-sm font-medium text-ink">
							Tu URL pública
						</label>
						<div className="flex items-center overflow-hidden rounded-xl border border-line focus-within:ring-2 focus-within:ring-brand">
							<span className="border-r border-line bg-surface-2 px-3 py-3 text-xs text-ink-3">
								talachastats.com/
							</span>
							<input
								id="org-slug"
								type="text"
								value={slug}
								onChange={(e) => handleSlugChange(e.target.value)}
								placeholder="novofut"
								className="flex-1 bg-surface px-3 py-3 text-sm text-ink placeholder-ink-3 focus:outline-none"
							/>
						</div>
						{slug.length > 0 && !slugValidation.ok ? (
							<p className="mt-1.5 text-xs text-red-400" role="alert">
								{slugValidation.message}
							</p>
						) : (
							<p className="mt-1.5 text-xs text-ink-3">
								Será la dirección de tu sitio (y mañana tu subdominio). Puedes cambiarla después.
							</p>
						)}
					</div>

					{error && (
						<p className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-400">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={!canContinue}
						className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-black transition disabled:opacity-50"
					>
						Continuar
					</button>
				</form>
			) : (
				<div className="space-y-6">
					<div>
						<label htmlFor="org-logo" className="mb-2 block text-sm font-medium text-ink">
							Logo <span className="font-normal text-ink-3">(opcional)</span>
						</label>
						<input
							id="org-logo"
							type="url"
							value={logoUrl}
							onChange={(e) => setLogoUrl(e.target.value)}
							placeholder="https://…/logo.png"
							className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink placeholder-ink-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
						/>
						<p className="mt-1.5 text-xs text-ink-3">
							Pega la URL de tu escudo. Puedes agregarlo después.
						</p>
					</div>

					<OrgStyleStep value={style} onChange={setStyle} orgName={name.trim() || undefined} />

					{error && (
						<p className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-400">
							{error}
						</p>
					)}

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => {
								setError("");
								setStep(1);
							}}
							disabled={loading}
							className="rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink transition hover:border-line-2 disabled:opacity-50"
						>
							Atrás
						</button>
						<button
							type="button"
							onClick={handleCreate}
							disabled={loading}
							className="flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-black transition disabled:opacity-50"
						>
							{loading ? "Creando tu organización…" : "Crear y entrar al panel"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function StepDot({
	n,
	active,
	done,
	label,
}: {
	n: number;
	active: boolean;
	done: boolean;
	label: string;
}) {
	return (
		<li className="flex items-center gap-2">
			<span
				className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
					active || done ? "bg-brand text-black" : "bg-surface-2 text-ink-3"
				}`}
			>
				{done ? "✓" : n}
			</span>
			<span className={active || done ? "text-ink" : ""}>{label}</span>
		</li>
	);
}
