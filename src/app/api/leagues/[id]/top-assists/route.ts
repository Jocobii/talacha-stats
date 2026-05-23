import { z } from "zod";
import { getLeagueTopAssists } from "@/lib/stats";
import { apiSuccess, apiError } from "@/types";
import { db, leagues } from "@/db";
import { eq } from "drizzle-orm";
import { parseQueryParams } from "@/shared/lib/query-filters";

const TopAssistsFiltersSchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

// GET /api/leagues/:id/top-assists?limit=10
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const { searchParams } = new URL(request.url);

	const parsed = parseQueryParams(searchParams, TopAssistsFiltersSchema);
	const limit = parsed.success ? parsed.data.limit : 10;

	const league = await db.query.leagues.findFirst({ where: eq(leagues.id, id) });
	if (!league) return apiError("Liga no encontrada", 404);

	const topAssists = await getLeagueTopAssists(id, limit);
	return apiSuccess(topAssists);
}
