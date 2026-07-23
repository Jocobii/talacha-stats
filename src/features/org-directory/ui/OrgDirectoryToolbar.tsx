"use client";

import { useTranslations } from "next-intl";
import { Search, LayoutGrid, List } from "lucide-react";
import { MEXICO_CITIES } from "@/shared/lib/cities";
import { ORG_DIRECTORY_SORT_OPTIONS } from "../constants";
import type { OrgDirectorySort } from "@/entities/organization";
import type { OrgDirectoryViewMode } from "../constants";

type Props = {
	query: string;
	onQueryChange: (value: string) => void;
	city: string;
	onCityChange: (value: string) => void;
	sort: OrgDirectorySort;
	onSortChange: (value: OrgDirectorySort) => void;
	viewMode: OrgDirectoryViewMode;
	onViewModeChange: (value: OrgDirectoryViewMode) => void;
};

/** Barra de filtros del Hub de Portales: búsqueda + ciudad + orden + vista. */
export default function OrgDirectoryToolbar({
	query,
	onQueryChange,
	city,
	onCityChange,
	sort,
	onSortChange,
	viewMode,
	onViewModeChange,
}: Props) {
	const t = useTranslations("organizaciones");

	return (
		<div className="flex flex-col sm:flex-row gap-2.5">
			<div className="relative flex-1">
				<Search
					size={16}
					strokeWidth={2}
					className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
				/>
				<input
					type="text"
					value={query}
					onChange={(e) => onQueryChange(e.target.value)}
					placeholder={t("searchPlaceholder")}
					className="w-full bg-surface-2 border border-line rounded-2xl pl-11 pr-4 py-3 text-sm text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
				/>
			</div>

			<div className="flex gap-2.5 shrink-0">
				<select
					value={city}
					onChange={(e) => onCityChange(e.target.value)}
					className="bg-surface-2 border border-line text-ink text-sm font-semibold rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition appearance-none cursor-pointer"
				>
					<option value="">{t("cityAll")}</option>
					{MEXICO_CITIES.map((c) => (
						<option key={c} value={c}>
							{c}
						</option>
					))}
				</select>

				<select
					value={sort}
					onChange={(e) => onSortChange(e.target.value as OrgDirectorySort)}
					className="bg-surface-2 border border-line text-ink text-sm font-semibold rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition appearance-none cursor-pointer"
				>
					{ORG_DIRECTORY_SORT_OPTIONS.map((option) => (
						<option key={option} value={option}>
							{t(`sort.${option}`)}
						</option>
					))}
				</select>

				<div className="flex items-center rounded-xl border border-line overflow-hidden shrink-0">
					<button
						type="button"
						onClick={() => onViewModeChange("grid")}
						aria-label={t("viewGrid")}
						aria-pressed={viewMode === "grid"}
						className={`px-2.5 py-3 transition-colors ${viewMode === "grid" ? "bg-brand/15 text-brand-ink" : "text-ink-3 hover:text-ink"}`}
					>
						<LayoutGrid size={16} strokeWidth={2} />
					</button>
					<button
						type="button"
						onClick={() => onViewModeChange("list")}
						aria-label={t("viewList")}
						aria-pressed={viewMode === "list"}
						className={`px-2.5 py-3 border-l border-line transition-colors ${viewMode === "list" ? "bg-brand/15 text-brand-ink" : "text-ink-3 hover:text-ink"}`}
					>
						<List size={16} strokeWidth={2} />
					</button>
				</div>
			</div>
		</div>
	);
}
