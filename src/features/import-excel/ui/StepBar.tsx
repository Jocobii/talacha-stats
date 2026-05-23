"use client";

import type { ImportStep } from "../model";

const STEPS: { id: ImportStep; label: string }[] = [
	{ id: "upload", label: "Archivo" },
	{ id: "map", label: "Revisar columnas" },
	{ id: "preview", label: "Vista previa" },
	{ id: "done", label: "¡Listo!" },
];

const STEP_ORDER = STEPS.map((s) => s.id);

type Props = { current: ImportStep };

export function StepBar({ current }: Props) {
	const currentIdx = STEP_ORDER.indexOf(current);

	return (
		<div className="flex items-center gap-0 mb-7">
			{STEPS.map((s, i) => {
				const isDone = i < currentIdx;
				const isActive = i === currentIdx;
				return (
					<div key={s.id} className="flex items-center gap-0">
						<div className="flex items-center gap-1.5">
							<div
								className={[
									"w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-all duration-300",
									isDone ? "bg-brand text-pitch" : "",
									isActive ? "bg-brand/15 text-white shadow-[0_0_0_4px_rgba(22,163,74,0.2)]" : "",
									!isDone && !isActive ? "bg-surface-2 text-ink-3" : "",
								].join(" ")}
							>
								{isDone ? "✓" : i + 1}
							</div>
							<span
								className={[
									"text-[13px] whitespace-nowrap",
									isActive ? "inline font-semibold text-brand-ink" : "hidden sm:inline",
									isDone ? "text-brand-ink" : "",
									!isDone && !isActive ? "text-ink-3" : "",
								].join(" ")}
							>
								{s.label}
							</span>
						</div>
						{i < STEPS.length - 1 && (
							<div
								className={[
									"h-0.5 mx-1.5 sm:mx-2 w-3 sm:w-10 shrink-0 transition-colors duration-300",
									isDone ? "bg-brand" : "bg-surface-2",
								].join(" ")}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}
