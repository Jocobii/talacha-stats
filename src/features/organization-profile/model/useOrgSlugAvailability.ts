"use client";

/**
 * features/organization-profile/model/useOrgSlugAvailability.ts
 * Chequeo en tiempo real de disponibilidad de slug — calco de
 * onboarding-wizard/model/useSlugAvailability.ts (feature propia para no
 * acoplar organization-profile a onboarding-wizard). Debounce resuelto en un
 * callback, nunca setState síncrono dentro de useEffect (§7.2).
 */

import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { validateOrgSlug } from "@/shared/org-theme";
import type { SlugAvailability } from "@/entities/organization";
import { checkOrgSlugUrl, SLUG_CHECK_DEBOUNCE_MS } from "../constants";
import type { SlugCheckStatus } from "../types";

/** currentSlug: el slug ya guardado — nunca se marca "taken" contra sí mismo. */
export function useOrgSlugAvailability(currentSlug: string) {
	const [debounced, setDebounced] = useState("");
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const check = useCallback((slug: string) => {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setDebounced(slug), SLUG_CHECK_DEBOUNCE_MS);
	}, []);

	const format = validateOrgSlug(debounced);
	const unchanged = debounced === currentSlug;

	const query = useQuery({
		queryKey: queryKeys.organizations.slugAvailabilityForEdit(debounced),
		enabled: debounced.length > 0 && format.ok && !unchanged,
		staleTime: 15_000,
		queryFn: async (): Promise<SlugAvailability> => {
			const res = await apiFetch<SlugAvailability>(checkOrgSlugUrl(debounced));
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});

	const status: SlugCheckStatus = resolveStatus(debounced, format.ok, unchanged, query);

	return { status, check };
}

function resolveStatus(
	debounced: string,
	isValidFormat: boolean,
	unchanged: boolean,
	query: { isFetching: boolean; data?: SlugAvailability },
): SlugCheckStatus {
	if (debounced.length === 0) return "idle";
	if (!isValidFormat) return "invalid";
	if (unchanged) return "available";
	if (query.isFetching) return "checking";
	if (query.data === undefined) return "idle";
	return query.data.available ? "available" : "taken";
}
