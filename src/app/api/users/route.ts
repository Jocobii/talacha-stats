/**
 * GET  /api/users → listar todos los usuarios (solo owner)
 * POST /api/users → crear usuario (solo owner)
 */
import { apiSuccess, apiError }          from "@/types";
import { getSessionUserFromRequest }     from "@/shared/lib/auth";
import { listUsers, createUser }         from "@/entities/user";
import { CreateUserSchema }              from "@/entities/user";

export async function GET(request: Request) {
  const session = await getSessionUserFromRequest(request);
  if (!session)                  return apiError("No autenticado", 401);
  if (session.role !== "owner")  return apiError("Sin permiso", 403);

  const users = await listUsers();
  return apiSuccess(users);
}

export async function POST(request: Request) {
  const session = await getSessionUserFromRequest(request);
  if (!session)                  return apiError("No autenticado", 401);
  if (session.role !== "owner")  return apiError("Sin permiso", 403);

  const body   = await request.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);

  const user = await createUser(parsed.data);
  return apiSuccess(user, 201);
}
