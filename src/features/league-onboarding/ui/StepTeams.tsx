"use client";

/**
 * features/league-onboarding/ui/StepTeams.tsx
 * Paso 0 del wizard — crear equipos en bloque antes de arrancar.
 */

import { Plus, X, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { KeyHint } from "@/shared/ui/KeyHint";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { useStepTeams } from "../model/useStepTeams";
import { WizardFooter } from "./WizardShared";
import type { CreatedTeam, League } from "../types";

type Props = {
	league: League;
	onNext: (teams: CreatedTeam[]) => void;
};

export function StepTeams({ league, onNext }: Props) {
	const {
		draft,
		drafts,
		saving,
		error,
		inputRef,
		setDraftInput,
		addDraft,
		removeDraft,
		handleNext,
	} = useStepTeams(league, onNext);

	const leftHint =
		drafts.length === 0
			? "Agrega al menos 2 equipos para continuar."
			: `${drafts.length} equipo${drafts.length !== 1 ? "s" : ""} listos`;

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
				{/* Main card */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-1">
						<h3 className="font-display text-[22px] text-ink font-bold tracking-tight">
							Crea los equipos
						</h3>
						<span className="text-[12px] text-ink-3">{drafts.length} equipos</span>
					</div>
					<p className="text-sm text-ink-2 mb-5">
						Puedes agregar más después. Sugerimos al menos 4 para arrancar.
					</p>

					{/* Add form */}
					<div className="flex items-center gap-2 mb-2">
						<div className="flex-1">
							<Input
								ref={inputRef}
								placeholder="Nombre del equipo — ej. Las Leonas"
								value={draft}
								onChange={(e) => setDraftInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addDraft();
									}
								}}
							/>
						</div>
						<Button variant="primary" size="md" icon={Plus} onClick={addDraft}>
							Agregar
						</Button>
					</div>

					<div className="text-[11px] text-ink-3 mb-5 flex items-center gap-1.5">
						Tip: presiona <KeyHint>Enter</KeyHint> para agregar rápido
					</div>

					{error && (
						<p className="mb-3 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
							{error}
						</p>
					)}

					{/* Team list */}
					<ul className="flex flex-col">
						{drafts.map((t, i) => (
							<li
								key={i}
								className="flex items-center gap-3 py-2.5 border-t border-line first:border-t-0"
							>
								<span
									className="w-8 h-8 rounded-md grid place-items-center text-pitch font-display font-bold text-[13px] shrink-0"
									style={{ background: t.color }}
								>
									{t.name.slice(0, 1).toUpperCase()}
								</span>
								<span className="flex-1 text-[14px] font-medium text-ink truncate">{t.name}</span>
								<button
									onClick={() => removeDraft(i)}
									className="w-7 h-7 grid place-items-center rounded-md text-ink-3 hover:text-red-400 hover:bg-red-500/10 transition"
								>
									<X size={14} strokeWidth={2} />
								</button>
							</li>
						))}
						{drafts.length === 0 && (
							<li className="text-center py-8 text-sm text-ink-3">
								Aún sin equipos. Agrega el primero arriba.
							</li>
						)}
					</ul>
				</Card>

				{/* Tips sidebar */}
				<div className="flex flex-col gap-4">
					<Card className="p-5">
						<SectionLabel className="mb-3">Consejos</SectionLabel>
						<ul className="flex flex-col gap-3 text-[13px] text-ink-2 leading-snug">
							<li className="flex gap-2">
								<span className="text-ink-3 shrink-0">01</span>
								Usa el nombre real del equipo, sin abreviar.
							</li>
							<li className="flex gap-2">
								<span className="text-ink-3 shrink-0">02</span>
								Si dudas del nombre, créalo y edítalo después.
							</li>
							<li className="flex gap-2">
								<span className="text-ink-3 shrink-0">03</span>
								No hace falta logo aún — lo subes desde el detalle del equipo.
							</li>
						</ul>
					</Card>
				</div>
			</div>

			<WizardFooter
				leftHint={leftHint}
				primary={
					<Button
						variant="primary"
						size="md"
						iconRight={ArrowRight}
						onClick={handleNext}
						disabled={drafts.length < 2 || saving}
					>
						{saving ? "Guardando…" : "Siguiente: registrar jugadores"}
					</Button>
				}
			/>
		</div>
	);
}
