"use client";

/**
 * features/league-onboarding/model/useFirstOrgVenue.ts
 *
 * Autoselección de cancha al crear liga (decisión Jocobi, jul 2026): si la
 * organización tiene canchas registradas, se toma siempre la primera (orden
 * alfabético, mismo criterio que /admin/canchas) sin preguntar — ahorra un
 * paso. Si no hay ninguna, el caller lo maneja mostrando un aviso y dejando
 * la asignación para después en el tab Canchas.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { VenueWithStats } from "@/entities/venue";
import { ORG_VENUES_URL } from "../constants";

export function useFirstOrgVenue(organizationId: string) {
	const query = useQuery<VenueWithStats[]>({
		queryKey: queryKeys.venues.list({ orgId: organizationId }),
		queryFn: async () => {
			const res = await apiFetch<VenueWithStats[]>(ORG_VENUES_URL(organizationId));
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		enabled: !!organizationId,
	});

	return { ...query, firstVenue: query.data?.[0] ?? null };
}
