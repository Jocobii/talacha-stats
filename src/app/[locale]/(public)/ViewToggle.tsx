"use client";

import { useTranslations } from "next-intl";
import type { HomeView } from "./home-view";

const OPTIONS: { value: HomeView; key: "player" | "organizer" }[] = [
	{ value: "jugador", key: "player" },
	{ value: "organizador", key: "organizer" },
];

type ViewToggleProps = {
	view: HomeView;
	onSelect: (view: HomeView) => void;
};

/** Control segmentado jugador/organizador — auto-etiquetado como micro-compromiso. */
export default function ViewToggle({ view, onSelect }: ViewToggleProps) {
	const t = useTranslations("home");

	return (
		<div
			role="group"
			aria-label={t("viewToggle.ariaLabel")}
			className="inline-flex w-full max-w-xs sm:w-auto sm:max-w-none rounded-full border border-line bg-surface-2 p-1"
		>
			{OPTIONS.map(({ value, key }) => {
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
						{t(`viewToggle.${key}`)}
					</button>
				);
			})}
		</div>
	);
}
