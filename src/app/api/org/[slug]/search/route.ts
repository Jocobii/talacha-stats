/**
 * GET /api/org/[slug]/search?q=...&types=team,league,player,suspension,venue
 *
 * Buscador universal por organización (docs/UNIVERSAL-SEARCH.md, Fase B).
 * Controlador delgado (§3.2 AGENTS.md): resuelve la org por slug, valida
 * término y `?types=`, y llama a la entidad — sin lógica de negocio aquí.
 * Mismo patrón que `search-teams/route.ts`.
 */

import { apiError, apiSuccess } from "@/types";
import { getPublicOrganization } from "@/entities/organization";
import { searchOrgUniversal } from "@/entities/search/queries";
import type { SearchHit, SearchHitKind } from "@/entities/search";

const MIN_QUERY_LENGTH = 2;
const VALID_TYPES = new Set<SearchHitKind>(["team", "league", "player", "suspension", "venue"]);

function parseTypes(raw: string | null): SearchHitKind[] | undefined {
	if (!raw) return undefined;
	const parsed = raw
		.split(",")
		.map((t) => t.trim())
		.filter((t): t is SearchHitKind => VALID_TYPES.has(t as SearchHitKind));
	return parsed.length > 0 ? parsed : undefined;
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const url = new URL(request.url);
	const q = url.searchParams.get("q")?.trim() ?? "";

	if (q.length < MIN_QUERY_LENGTH) return apiSuccess<SearchHit[]>([]);

	const org = await getPublicOrganization(slug);
	if (!org) return apiError("Organización no encontrada", 404);

	const types = parseTypes(url.searchParams.get("types"));
	const results = await searchOrgUniversal(org.id, q, { types });
	return apiSuccess<SearchHit[]>(results);
}
