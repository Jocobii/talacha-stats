import { db, leagues } from "@/db";
import { asc } from "drizzle-orm";
import { apiSuccess } from "@/types";

// GET /api/cities — returns distinct cities that have at least one league
export async function GET() {
  const rows = await db
    .selectDistinct({ city: leagues.city })
    .from(leagues)
    .orderBy(asc(leagues.city));

  return apiSuccess(rows.map((r) => r.city));
}
