"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { Search, Users, ArrowLeft, ChevronRight } from "lucide-react";
import CityFilter from "@/shared/ui/CityFilter";
import { usePlayersFilters, usePlayersQuery } from "@/features/player-directory";

export default function PlayersView() {
	const t = useTranslations("players");
	const tCommon = useTranslations("common");

	const { city, query, debouncedQuery, setQuery } = usePlayersFilters();
	const playersQuery = usePlayersQuery(city, debouncedQuery);
	const players = playersQuery.data ?? [];
	const loading = playersQuery.isFetching;
	const fetched = playersQuery.isSuccess;

	return (
		<div className="text-ink flex flex-col flex-1">
			<header className="bg-pitch px-5 pt-8 pb-6 max-w-lg mx-auto w-full">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm transition mb-5"
				>
					<ArrowLeft size={16} strokeWidth={2} />
					{tCommon("backHome")}
				</Link>
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<Users size={24} className="text-brand-ink" strokeWidth={2} />
							<h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
								{t("title")}
							</h1>
						</div>
						<p className="text-ink-2 text-sm mt-0.5">{t("subtitle")}</p>
					</div>
					<div className="shrink-0 pt-1">
						<CityFilter />
					</div>
				</div>
			</header>

			<div className="bg-surface flex-1 rounded-t-3xl px-4 pt-6 pb-16">
				<div className="max-w-lg mx-auto space-y-3">
					<div className="relative">
						<Search
							size={16}
							strokeWidth={2}
							className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
						/>
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={t("searchPlaceholder")}
							className="w-full bg-surface-2 border border-line rounded-2xl pl-11 pr-4 py-3.5 text-sm text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
						/>
					</div>

					{loading && <p className="text-center text-sm text-ink-3 py-6">{t("searching")}</p>}

					{!loading && fetched && players.length === 0 && (
						<p className="text-center text-sm text-ink-3 py-6">
							{query ? t("noResultsQuery", { query }) : t("noResults")}
						</p>
					)}

					{!loading &&
						players.map((p) => (
							<Link
								key={p.id}
								href={`/player/${p.id}`}
								className="flex items-center gap-4 bg-surface-2 border border-line rounded-2xl px-4 py-3.5 hover:border-brand transition"
							>
								<div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-lg shrink-0">
									{(p.alias ?? p.displayName).charAt(0).toUpperCase()}
								</div>

								<div className="min-w-0 flex-1">
									<p className="font-semibold text-ink truncate">{p.displayName}</p>
									{p.alias && (
										<p className="text-sm text-brand-ink truncate">&quot;{p.alias}&quot;</p>
									)}
								</div>

								<ChevronRight size={16} className="text-ink-3 shrink-0" strokeWidth={2} />
							</Link>
						))}
				</div>
			</div>
		</div>
	);
}
