/**
 * GET /api/org/[slug]/search-teams?q=...
 *
 * Buscador público "¿En qué equipo juegas?" del home del subdominio de
 * organización (Zona 1). Controlador delgado (§3.2 AGENTS.md): resuelve la
 * org por slug, valida el término y llama a la entidad — sin lógica de
 * negocio aquí.
 */

import { apiError, apiSuccess } from "@/types";
import {
	getPublicOrganization,
	searchOrgTeams,
	type OrgTeamSearchResult,
} from "@/entities/organization";

const MIN_QUERY_LENGTH = 2;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";

	if (q.length < MIN_QUERY_LENGTH) return apiSuccess<OrgTeamSearchResult[]>([]);

	const org = await getPublicOrganization(slug);
	if (!org) return apiError("Organización no encontrada", 404);

	const results = await searchOrgTeams(org.id, q);
	return apiSuccess<OrgTeamSearchResult[]>(results);
}
