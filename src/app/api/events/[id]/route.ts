import { db, matchEvents } from "@/db";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";

// DELETE /api/events/:id — eliminar evento (corrección de error)
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deleted] = await db.delete(matchEvents).where(eq(matchEvents.id, id)).returning();
  if (!deleted) return apiError("Evento no encontrado", 404);
  return apiSuccess({ deleted: true });
}
