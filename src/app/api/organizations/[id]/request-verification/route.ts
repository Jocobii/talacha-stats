import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { getOrganizationById } from "@/entities/organization";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/organizations/[id]/request-verification
// Marks verificationRequestedAt so the owner can review and approve.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	// Only the organizer of this org can request verification
	if (session.role !== "owner" && session.organizationId !== id) {
		return apiError("Sin permiso", 403);
	}

	const org = await getOrganizationById(id);
	if (!org) return apiError("Organizacion no encontrada", 404);

	if (org.status === "verified") {
		return apiError("Esta organizacion ya esta verificada", 409);
	}

	if (org.verificationRequestedAt) {
		return apiError("Ya solicitaste verificacion anteriormente", 409);
	}

	const [updated] = await db
		.update(organizations)
		.set({ verificationRequestedAt: new Date() })
		.where(eq(organizations.id, id))
		.returning();

	return apiSuccess(updated);
}
