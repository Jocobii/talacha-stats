import { getTeamRoster } from "@/entities/team";
import { apiSuccess } from "@/types";

/**
 * GET /api/teams/:id/members
 *
 * Roster V2 (inscriptions → league_members → global_players) en la forma
 * `RosterEntry` que consume la UI. Controlador delgado (§3.2): delega en la
 * query de entidad `getTeamRoster`. Es la fuente cliente del roster para que
 * TanStack Query pueda invalidar/refetch en vez de `router.refresh()`.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const roster = await getTeamRoster(id);
	return apiSuccess(roster);
}
