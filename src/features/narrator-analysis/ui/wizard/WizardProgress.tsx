/**
 * WizardProgress — indicador de pasos (visibility of system status, NN/g).
 * Muestra los 4 pasos, resalta el actual y marca los completados. Compacto para
 * móvil: puntos + etiqueta corta.
 */

import { Check } from "lucide-react";
import type { WizardStep } from "../../model/wizard-reducer";

const STEPS: { key: WizardStep; label: string }[] = [
	{ key: "upload", label: "Subir" },
	{ key: "mapping", label: "Columnas" },
	{ key: "teams", label: "Equipos" },
	{ key: "report", label: "Análisis" },
];

const ORDER: WizardStep[] = ["upload", "mapping", "teams", "report"];

export function WizardProgress({ current }: { current: WizardStep }) {
	const currentIdx = ORDER.indexOf(current);

	return (
		<ol className="flex items-center justify-between gap-1 px-1">
			{STEPS.map((step, i) => {
				const done = i < currentIdx;
				const active = i === currentIdx;
				return (
					<li key={step.key} className="flex items-center gap-1 flex-1 last:flex-none">
						<div className="flex flex-col items-center gap-1">
							<span
								className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border transition
								${
									done
										? "bg-brand border-brand text-pitch"
										: active
											? "bg-brand/15 border-brand text-brand-ink"
											: "bg-surface-2 border-line text-ink-3"
								}`}
							>
								{done ? <Check size={14} strokeWidth={3} /> : i + 1}
							</span>
							<span
								className={`text-[10px] tracking-wide ${active ? "text-ink font-semibold" : "text-ink-3"}`}
							>
								{step.label}
							</span>
						</div>
						{i < STEPS.length - 1 && (
							<span className={`h-px flex-1 ${done ? "bg-brand" : "bg-line"}`} />
						)}
					</li>
				);
			})}
		</ol>
	);
}
