/**
 * entities/analytics/queries.ts
 * Lecturas de la tabla page_views para el dashboard de admin.
 */

import { db, pageViews } from "@/db";
import { sql, gte } from "drizzle-orm";

export type VisitStats = {
  totalUniqueVisitors: number;
  totalPageViews: number;
  uniqueVisitorsToday: number;
  pageViewsToday: number;
  byPage: { page: string; uniqueVisitors: number; totalViews: number }[];
};

export async function getVisitStats(): Promise<VisitStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [global, today, byPage] = await Promise.all([
    // Totales globales
    db
      .select({
        uniqueVisitors: sql<number>`count(distinct visitor_id)::int`,
        totalViews:     sql<number>`count(*)::int`,
      })
      .from(pageViews),

    // Solo hoy
    db
      .select({
        uniqueVisitors: sql<number>`count(distinct visitor_id)::int`,
        totalViews:     sql<number>`count(*)::int`,
      })
      .from(pageViews)
      .where(gte(pageViews.visitedAt, todayStart)),

    // Por página
    db
      .select({
        page:           pageViews.page,
        uniqueVisitors: sql<number>`count(distinct visitor_id)::int`,
        totalViews:     sql<number>`count(*)::int`,
      })
      .from(pageViews)
      .groupBy(pageViews.page)
      .orderBy(sql`count(distinct visitor_id) desc`),
  ]);

  return {
    totalUniqueVisitors: global[0]?.uniqueVisitors ?? 0,
    totalPageViews:      global[0]?.totalViews     ?? 0,
    uniqueVisitorsToday: today[0]?.uniqueVisitors  ?? 0,
    pageViewsToday:      today[0]?.totalViews      ?? 0,
    byPage: byPage.map((r) => ({
      page:           r.page,
      uniqueVisitors: r.uniqueVisitors,
      totalViews:     r.totalViews,
    })),
  };
}

export async function recordVisit(visitorId: string, page: string): Promise<void> {
  await db.insert(pageViews).values({ visitorId, page });
}
