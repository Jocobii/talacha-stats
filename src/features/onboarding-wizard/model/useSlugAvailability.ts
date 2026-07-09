"use client";

/**
 * features/onboarding-wizard/model/useSlugAvailability.ts
 *
 * Chequeo en tiempo real de disponibilidad del slug (paso Identidad). El
 * debounce se resuelve en un callback (`check`) que el caller dispara en su
 * handler de cambio — nunca `setState` síncrono dentro de un `useEffect`
 * (§7.2). Mismo patrón que useAddExistingPlayer (team-management).
 */

import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { validateOrgSlug } from "@/shared/org-theme";
import type { SlugAvailability } from "@/entities/organization";
import { checkSlugUrl, SLUG_CHECK_DEBOUNCE_MS } from "../constants";
import type { SlugCheckStatus } from "../types";

export function useSlugAvailability() {
	const [debounced, setDebounced] = useState("");
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const check = useCallback((slug: string) => {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setDebounced(slug), SLUG_CHECK_DEBOUNCE_MS);
	}, []);

	const format = validateOrgSlug(debounced);
	const query = useQuery({
		queryKey: ["org-slug-availability", debounced] as const,
		enabled: debounced.length > 0 && format.ok,
		staleTime: 15_000,
		queryFn: async (): Promise<SlugAvailability> => {
			const res = await apiFetch<SlugAvailability>(checkSlugUrl(debounced));
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});

	const status: SlugCheckStatus = resolveStatus(debounced, format.ok, query);

	return { status, check };
}

function resolveStatus(
	debounced: string,
	isValidFormat: boolean,
	query: { isFetching: boolean; data?: SlugAvailability },
): SlugCheckStatus {
	if (debounced.length === 0) return "idle";
	if (!isValidFormat) return "invalid";
	if (query.isFetching) return "checking";
	if (query.data === undefined) return "idle";
	return query.data.available ? "available" : "taken";
}
