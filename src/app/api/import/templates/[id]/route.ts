import { db, importTemplates } from "@/db";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";

// DELETE /api/import/templates/:id
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deleted] = await db.delete(importTemplates).where(eq(importTemplates.id, id)).returning();
  if (!deleted) return apiError("Plantilla no encontrada", 404);
  return apiSuccess({ deleted: true });
}
