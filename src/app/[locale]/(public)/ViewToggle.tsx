"use client";

import type { HomeView } from "./home-view";

const OPTIONS: { value: HomeView; label: string }[] = [
	{ value: "jugador", label: "Soy jugador" },
	{ value: "organizador", label: "Organizo una liga" },
];

type ViewToggleProps = {
	view: HomeView;
	onSelect: (view: HomeView) => void;
};

/** Control segmentado jugador/organizador — auto-etiquetado como micro-compromiso. */
export default function ViewToggle({ view, onSelect }: ViewToggleProps) {
	return (
		<div
			role="group"
			aria-label="Elige tu vista"
			className="inline-flex w-full max-w-xs sm:w-auto sm:max-w-none rounded-full border border-line bg-surface-2 p-1"
		>
			{OPTIONS.map(({ value, label }) => {
				const isActive = view === value;
				return (
					<button
						key={value}
						type="button"
						aria-pressed={isActive}
						onClick={() => onSelect(value)}
						className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
							isActive ? "bg-brand text-pitch" : "text-ink-2 hover:text-ink"
						}`}
					>
						{label}
					</button>
				);
			})}
		</div>
	);
}
