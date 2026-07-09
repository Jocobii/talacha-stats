/**
 * POST /api/auth/resend-verification
 * Body: { email }
 *
 * Regenera el token de verificacion (valido otras 24h) y reenvia el correo.
 * Respeta un cooldown de 45s entre reenvios (ver entities/user/queries.ts).
 */
import { apiSuccess, apiError } from "@/types";
import { ResendVerificationSchema, renewVerificationToken } from "@/entities/user";
import { sendEmail } from "@/shared/lib/email";
import { verificationEmailHtml } from "@/shared/lib/email-templates";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function POST(request: Request) {
	const body = await request.json().catch(() => ({}));
	const parsed = ResendVerificationSchema.safeParse(body);

	if (!parsed.success) {
		const message = parsed.error.issues[0]?.message ?? "Correo invalido";
		return apiError(message, 400);
	}

	const result = await renewVerificationToken(parsed.data.email);

	switch (result.status) {
		case "not-found":
			return apiError("No encontramos una cuenta con ese correo", 404);
		case "already-verified":
			return apiError("Este correo ya esta verificado. Inicia sesion.", 409);
		case "cooldown":
			return apiError(
				`Espera ${Math.ceil(result.retryAfterMs / 1000)}s antes de reenviar de nuevo`,
				429,
			);
		case "ok": {
			const verificationUrl = `${BASE_URL}/api/auth/verify-email?token=${result.token}`;
			try {
				await sendEmail({
					to: result.user.email,
					subject: "Verifica tu cuenta en TalachaStats",
					html: verificationEmailHtml({ name: result.user.name, verificationUrl }),
					sender: "noreply",
				});
			} catch (err) {
				console.error("[resend-verification] Error enviando email:", err);
				return apiError("No se pudo enviar el correo. Intenta de nuevo en un momento.", 502);
			}
			return apiSuccess({ email: result.user.email });
		}
	}
}
