import { useTranslations } from "next-intl";
import type { OrgDirectoryQueryResult } from "../model/useOrgDirectoryQuery";
import type { OrgDirectoryViewMode } from "../constants";
import OrgDirectoryCard from "./OrgDirectoryCard";

type Props = {
	result: OrgDirectoryQueryResult | undefined;
	isLoading: boolean;
	isError: boolean;
	viewMode: OrgDirectoryViewMode;
	onLoadMore: () => void;
};

const GRID_CLASSES = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
const LIST_CLASSES = "flex flex-col gap-3";

/** Contador "X de Y", grid/lista de cards, estados vacío/carga/error y "cargar más". */
export default function OrgDirectoryResults({
	result,
	isLoading,
	isError,
	viewMode,
	onLoadMore,
}: Props) {
	const t = useTranslations("organizaciones");
	const items = result?.items ?? [];
	const meta = result?.meta;

	if (isLoading) {
		return <p className="text-center text-sm text-ink-3 py-10">{t("loading")}</p>;
	}

	if (isError) {
		return <p className="text-center text-sm text-red-500 py-10">{t("error")}</p>;
	}

	if (meta && items.length === 0) {
		return (
			<div className="bg-surface-2 border border-line rounded-2xl p-8 text-center text-ink-3 text-sm">
				{t("empty")}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{meta && (
				<p className="text-xs text-ink-3">
					{t("resultsCount", { loaded: items.length, total: meta.total })}
				</p>
			)}

			<div className={viewMode === "grid" ? GRID_CLASSES : LIST_CLASSES}>
				{items.map((org) => (
					<OrgDirectoryCard key={org.id} org={org} />
				))}
			</div>

			{meta?.hasNext && (
				<button
					type="button"
					onClick={onLoadMore}
					className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-line text-sm font-semibold text-ink-3 hover:border-brand/40 hover:text-brand-ink transition-colors"
				>
					{t("loadMore")}
				</button>
			)}
		</div>
	);
}
