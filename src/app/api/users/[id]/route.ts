/**
 * PATCH  /api/users/[id] → actualizar usuario (solo owner)
 * DELETE /api/users/[id] → desactivar usuario (solo owner, no elimina datos)
 */
import { apiSuccess, apiError }          from "@/types";
import { getSessionUserFromRequest }     from "@/shared/lib/auth";
import { updateUser, getUserById }       from "@/entities/user";
import { UpdateUserSchema }              from "@/entities/user";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUserFromRequest(request);
  if (!session)                  return apiError("No autenticado", 401);
  if (session.role !== "owner")  return apiError("Sin permiso", 403);

  const { id } = await params;

  const body   = await request.json().catch(() => null);
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);

  const user = await updateUser(id, parsed.data);
  if (!user) return apiError("Usuario no encontrado", 404);

  return apiSuccess(user);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUserFromRequest(request);
  if (!session)                  return apiError("No autenticado", 401);
  if (session.role !== "owner")  return apiError("Sin permiso", 403);

  const { id } = await params;

  // No eliminar el propio usuario
  if (id === session.id) return apiError("No puedes desactivarte a ti mismo", 400);

  const user = await updateUser(id, { active: false });
  if (!user) return apiError("Usuario no encontrado", 404);

  return apiSuccess({ message: "Usuario desactivado" });
}
