"use client";

/**
 * features/admin-registration/ui/StageIndicator.tsx
 * Indicador de pasos del flujo de registro (dots + labels).
 */

import { cn } from "@/shared/lib/cn";
import type { RegistrationStage } from "../types";

const STAGES: { id: RegistrationStage; label: string }[] = [
	{ id: "search", label: "Buscar CURP" },
	{ id: "review", label: "Revisar jugador" },
	{ id: "done", label: "Asignar equipo" },
];

type Props = { current: RegistrationStage };

export function StageIndicator({ current }: Props) {
	const currentIdx = STAGES.findIndex((s) => s.id === current);

	return (
		<ol className="flex items-center gap-0">
			{STAGES.map((s, i) => {
				const done = i < currentIdx;
				const active = i === currentIdx;
				return (
					<li key={s.id} className="flex items-center flex-1 last:flex-none">
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"w-1.5 h-1.5 rounded-full transition",
									done
										? "bg-brand"
										: active
											? "bg-brand shadow-[0_0_6px_rgba(0,230,118,.7)]"
											: "bg-ink-3/40",
								)}
							/>
							<span
								className={cn(
									"text-[11px] font-semibold tracking-[0.14em] uppercase",
									done || active ? "text-ink-2" : "text-ink-3",
								)}
							>
								{s.label}
							</span>
						</div>
						{i < STAGES.length - 1 && <div className="flex-1 h-px bg-line mx-3" />}
					</li>
				);
			})}
		</ol>
	);
}
