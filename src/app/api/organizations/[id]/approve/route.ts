import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { approveOrganization } from "@/entities/organization";
import { sendEmail } from "@/shared/lib/email";
import { verifiedOrgEmailHtml } from "@/shared/lib/email-templates";

// POST /api/organizations/[id]/approve
// Owner-only: marks the org as verified and emails the organizer.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);
	if (session.role !== "owner") return apiError("Sin permiso", 403);

	const { id } = await params;

	const result = await approveOrganization(id);
	if (!result) return apiError("Organizacion no encontrada", 404);

	const { org, organizerEmail, organizerName } = result;

	// Send confirmation email — non-blocking, failure is logged but does not break the response
	if (organizerEmail && organizerName) {
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
		sendEmail({
			to: organizerEmail,
			subject: `Tu liga ${org.name} fue verificada en TalachaStats`,
			html: verifiedOrgEmailHtml({
				name: organizerName,
				orgName: org.name,
				dashboardUrl: `${baseUrl}/admin`,
			}),
		}).catch((err: unknown) => {
			console.error("[approve] Error sending verification email:", err);
		});
	}

	return apiSuccess(org);
}
