import { db, leagues }                from "@/db";
import { eq, count }                  from "drizzle-orm";
import { apiSuccess, apiError }       from "@/types";
import { getSessionUserFromRequest }  from "@/shared/lib/auth";
import {
  getOrganizationWithDetails,
  updateOrganization,
  deleteOrganization,
  setUserOrganization,
  UpdateOrganizationSchema,
} from "@/entities/organization";
import { z } from "zod";

// GET /api/organizations/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return apiError("No autenticado", 401);

  const { id } = await params;

  // Organizer solo puede ver su propia organización
  if (session.role !== "owner" && session.organizationId !== id) {
    return apiError("Sin permiso", 403);
  }

  const org = await getOrganizationWithDetails(id);
  if (!org) return apiError("Organización no encontrada", 404);

  return apiSuccess(org);
}

// PATCH /api/organizations/:id
// Editar nombre, slug, logo, ciudad
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return apiError("No autenticado", 401);

  const { id } = await params;

  if (session.role !== "owner" && session.organizationId !== id) {
    return apiError("Sin permiso para editar esta organización", 403);
  }

  const body   = await request.json().catch(() => null);
  const parsed = UpdateOrganizationSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const updated = await updateOrganization(id, parsed.data);
  if (!updated) return apiError("Organización no encontrada", 404);

  return apiSuccess(updated);
}

// DELETE /api/organizations/:id
// Solo el owner puede eliminar organizaciones, y solo si no tienen ligas activas
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return apiError("No autenticado", 401);
  if (session.role !== "owner") return apiError("Sin permiso", 403);

  const { id } = await params;

  // Verificar que no tenga ligas activas
  const [{ total }] = await db
    .select({ total: count() })
    .from(leagues)
    .where(eq(leagues.organizationId, id));

  if (total > 0) {
    return apiError(
      `No se puede eliminar: la organización tiene ${total} liga(s) asociada(s)`,
      409,
    );
  }

  const deleted = await deleteOrganization(id);
  if (!deleted) return apiError("Organización no encontrada", 404);

  return apiSuccess({ message: "Organización eliminada" });
}

// POST /api/organizations/:id/members
// Agregar o quitar un usuario de la organización
// Body: { userId, action: "add" | "remove" }
const MemberActionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["add", "remove"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return apiError("No autenticado", 401);
  if (session.role !== "owner") return apiError("Sin permiso", 403);

  const { id } = await params;

  const body   = await request.json().catch(() => null);
  const parsed = MemberActionSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  await setUserOrganization(
    parsed.data.userId,
    parsed.data.action === "add" ? id : null,
  );

  return apiSuccess({ message: parsed.data.action === "add" ? "Usuario agregado" : "Usuario removido" });
}
