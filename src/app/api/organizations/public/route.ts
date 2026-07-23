import { z } from "zod";
import { apiSuccessPaginated, apiError } from "@/types";
import { parseQueryParams } from "@/shared/lib/query-filters";
import { parsePaginationParams, buildMeta, toOffset } from "@/shared/lib/pagination";
import { listOrganizationsPublicPaginated } from "@/entities/organization";

const OrgDirectoryFiltersSchema = z.object({
	city: z.string().trim().min(1).optional(),
	q: z.string().trim().min(1).optional(),
	sort: z.enum(["name_asc", "name_desc", "leagues_desc", "players_desc"]).default("name_asc"),
});

// GET /api/organizations/public?city=Tijuana&q=novo&sort=name_asc&page=1&limit=20
// Directorio público del Hub de Portales (/organizaciones). Sin sesión, solo
// organizaciones verificadas (entities/organization/queries.ts
// listOrganizationsPublicPaginated hace el filtrado/orden/paginado en SQL).
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);

	const filters = parseQueryParams(searchParams, OrgDirectoryFiltersSchema);
	if (!filters.success) return apiError("Parámetros de filtro inválidos", 400);

	const pagination = parsePaginationParams(searchParams, { limit: 20 });

	const { rows, total } = await listOrganizationsPublicPaginated({
		city: filters.data.city,
		q: filters.data.q,
		sort: filters.data.sort,
		limit: pagination.limit,
		offset: toOffset(pagination),
	});

	return apiSuccessPaginated(rows, buildMeta(total, pagination));
}
