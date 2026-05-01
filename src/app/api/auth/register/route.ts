/**
 * POST /api/auth/register
 * Body: { name, email, password }
 *
 * Flujo:
 * 1. Validar body con RegisterSchema
 * 2. Verificar que el email no este registrado
 * 3. Crear usuario con emailVerified = false + token de 24h
 * 4. Enviar email de verificacion
 * 5. Retornar ok con el email para mostrarlo en /verificar-email
 */
import { apiSuccess, apiError } from "@/types";
import { RegisterSchema, getUserByEmail, registerUser } from "@/entities/user";
import { sendEmail } from "@/shared/lib/email";
import { verificationEmailHtml } from "@/shared/lib/email-templates";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function POST(request: Request) {
	const body = await request.json().catch(() => ({}));
	const parsed = RegisterSchema.safeParse(body);

	if (!parsed.success) {
		const message = parsed.error.issues[0]?.message ?? "Datos invalidos";
		return apiError(message, 400);
	}

	const { name, email, password } = parsed.data;

	// Verificar email unico
	const existing = await getUserByEmail(email);
	if (existing) {
		return apiError("Este correo ya esta registrado", 409);
	}

	// Crear usuario + token de verificacion
	const { user, token } = await registerUser({ name, email, password });

	// Enviar email (no bloqueamos la respuesta si falla — logueamos el error)
	const verificationUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`;
	try {
		await sendEmail({
			to: user.email,
			subject: "Verifica tu cuenta en TalachaStats",
			html: verificationEmailHtml({ name: user.name, verificationUrl }),
		});
	} catch (err) {
		console.error("[register] Error enviando email de verificacion:", err);
		// El usuario fue creado — no retornar error, el email puede reenviarse
	}

	return apiSuccess({ email: user.email }, 201);
}
