"use client";

/**
 * features/org-directory/ui/OrgDirectory.tsx
 * Orquestador del Hub de Portales (§7.2a): cablea los hooks de filtro + query
 * y compone toolbar/resultados. Sin fetch, mapeo ni reglas de negocio propias.
 */

import { useState } from "react";
import { useOrgDirectoryFilters } from "../model/useOrgDirectoryFilters";
import { useOrgDirectoryQuery } from "../model/useOrgDirectoryQuery";
import { ORG_DIRECTORY_DEFAULT_VIEW, type OrgDirectoryViewMode } from "../constants";
import OrgDirectoryToolbar from "./OrgDirectoryToolbar";
import OrgDirectoryResults from "./OrgDirectoryResults";

export default function OrgDirectory() {
	const { city, setCity, query, setQuery, sort, setSort, filters, visibleCount, loadMore } =
		useOrgDirectoryFilters();
	const [viewMode, setViewMode] = useState<OrgDirectoryViewMode>(ORG_DIRECTORY_DEFAULT_VIEW);

	const { data, isLoading, isError } = useOrgDirectoryQuery(filters, visibleCount);

	return (
		<div className="space-y-4">
			<OrgDirectoryToolbar
				query={query}
				onQueryChange={setQuery}
				city={city}
				onCityChange={setCity}
				sort={sort}
				onSortChange={setSort}
				viewMode={viewMode}
				onViewModeChange={setViewMode}
			/>
			<OrgDirectoryResults
				result={data}
				isLoading={isLoading}
				isError={isError}
				viewMode={viewMode}
				onLoadMore={loadMore}
			/>
		</div>
	);
}
