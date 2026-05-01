/**
 * GET /api/auth/verify-email?token=xxx
 * Validates the email verification token, marks the user as verified,
 * sets the session cookie, and redirects to /onboarding.
 */
import { getUserByVerificationToken, markEmailVerified } from "@/entities/user";
import { buildSessionCookie } from "@/shared/lib/session";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const token = searchParams.get("token");

	if (!token) {
		return Response.redirect(new URL("/verify-email?error=token-expired", request.url));
	}

	const user = await getUserByVerificationToken(token);
	if (!user) {
		return Response.redirect(new URL("/verify-email?error=token-expired", request.url));
	}

	await markEmailVerified(user.id);

	const isProduction = process.env.NODE_ENV === "production";
	const sessionCookie = buildSessionCookie(user.id, isProduction);

	return new Response(null, {
		status: 302,
		headers: {
			Location: "/onboarding",
			"Set-Cookie": sessionCookie,
		},
	});
}
