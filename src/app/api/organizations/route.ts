import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import {
	listOrganizations,
	getOrganizationByUserId,
	createOrganization,
	setUserOrganization,
	generateSlug,
	CreateOrganizationSchema,
} from "@/entities/organization";

// GET /api/organizations
// owner      -> all organizations in the system
// organizer  -> only their own
export async function GET(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	if (session.role === "owner") {
		const orgs = await listOrganizations();
		return apiSuccess(orgs);
	}

	if (!session.organizationId) {
		return apiSuccess([]);
	}

	const org = await getOrganizationByUserId(session.id);
	return apiSuccess(org ? [org] : []);
}

// POST /api/organizations
// owner     -> creates any org (no user linking)
// organizer -> onboarding flow: creates their org and links themselves to it
//              only allowed if they don't have an org yet
export async function POST(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const isOwner = session.role === "owner";
	const isOrganizerOnboarding = session.role === "organizer" && !session.organizationId;

	if (!isOwner && !isOrganizerOnboarding) {
		return apiError("Sin permiso", 403);
	}

	const body = await request.json().catch(() => null);

	// Auto-generate slug from name if not provided
	if (body && body.name && !body.slug) {
		body.slug = generateSlug(body.name);
	}

	const parsed = CreateOrganizationSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message);

	const org = await createOrganization(parsed.data);

	// Onboarding: link the organizer to their new org
	if (isOrganizerOnboarding) {
		await setUserOrganization(session.id, org.id);
	}

	return apiSuccess(org, 201);
}
