/**
 * POST /api/auth/setup
 * Crea el primer usuario owner del sistema.
 * Solo funciona si NO existe ningún usuario — después se bloquea automáticamente.
 *
 * Body: { email, password, name, setupSecret }
 * Requiere la variable de entorno SETUP_SECRET para evitar uso no autorizado.
 */
import { apiSuccess, apiError } from "@/types";
import { countUsers, createUser } from "@/entities/user";
import { z } from "zod";

const SetupSchema = z.object({
	email: z.email(),
	password: z.string().min(8),
	name: z.string().min(2),
	setupSecret: z.string().min(1),
});

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const parsed = SetupSchema.safeParse(body);
	if (!parsed.success) return apiError("Datos inválidos", 400);

	// Verificar el secreto de setup
	const expectedSecret = process.env.SETUP_SECRET;
	if (!expectedSecret || parsed.data.setupSecret !== expectedSecret) {
		return apiError("Secreto inválido", 403);
	}

	// Solo permitir si no existe ningún usuario todavía
	const total = await countUsers();
	if (total > 0) {
		return apiError(
			"El sistema ya tiene usuarios. Usa el panel de admin.",
			409,
		);
	}

	const user = await createUser({
		email: parsed.data.email,
		password: parsed.data.password,
		name: parsed.data.name,
		role: "owner",
	});

	return apiSuccess({ message: "Owner creado exitosamente", user }, 201);
}
