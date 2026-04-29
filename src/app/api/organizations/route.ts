import { apiSuccess, apiError }           from "@/types";
import { getSessionUserFromRequest }       from "@/shared/lib/auth";
import {
  listOrganizations,
  getOrganizationByUserId,
  createOrganization,
  generateSlug,
  CreateOrganizationSchema,
} from "@/entities/organization";

// GET /api/organizations
// owner      → todas las organizaciones del sistema
// organizer  → solo la suya
export async function GET(request: Request) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return apiError("No autenticado", 401);

  if (session.role === "owner") {
    const orgs = await listOrganizations();
    return apiSuccess(orgs);
  }

  // organizer: devolver solo su organización
  if (!session.organizationId) {
    return apiSuccess([]);
  }

  const org = await getOrganizationByUserId(session.id);
  return apiSuccess(org ? [org] : []);
}

// POST /api/organizations
// Solo el owner puede crear organizaciones
export async function POST(request: Request) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return apiError("No autenticado", 401);
  if (session.role !== "owner") return apiError("Sin permiso", 403);

  const body   = await request.json().catch(() => null);

  // Si no viene slug, generarlo desde el nombre
  if (body && body.name && !body.slug) {
    body.slug = generateSlug(body.name);
  }

  const parsed = CreateOrganizationSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const org = await createOrganization(parsed.data);
  return apiSuccess(org, 201);
}
