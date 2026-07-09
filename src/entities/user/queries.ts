/**
 * entities/user/queries.ts
 * Acceso a DB + utilidades de contrasena para usuarios.
 *
 * Hashing: Node.js crypto.scrypt — sin dependencias externas.
 * Format del hash: "{salt}:{derivedKey}" (ambos en hex).
 */

import { eq, and, gt } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db, users } from "@/db";
import type { CreateUserInput, UpdateUserInput, UserPublic, RegisterInput } from "./model";

const scryptAsync = promisify(scrypt);

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
/** Debe calzar con el timer de reenvio mostrado en /verify-email. */
const RESEND_COOLDOWN_MS = 45 * 1000;

// -- Contrasenyas ---------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const derived = (await scryptAsync(password, salt, 64)) as Buffer;
	return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const [salt, storedHex] = hash.split(":");
	if (!salt || !storedHex) return false;
	const derived = (await scryptAsync(password, salt, 64)) as Buffer;
	const stored = Buffer.from(storedHex, "hex");
	if (derived.length !== stored.length) return false;
	return timingSafeEqual(derived, stored);
}

// -- Queries -------------------------------------------------------------------

export async function getUserById(id: string) {
	return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function getUserByEmail(email: string) {
	return db.query.users.findFirst({
		where: eq(users.email, email.toLowerCase().trim()),
	});
}

export async function getUserByVerificationToken(token: string) {
	return db.query.users.findFirst({
		where: and(
			eq(users.emailVerificationToken, token),
			gt(users.emailVerificationExpiresAt, new Date()),
		),
	});
}

export async function listUsers(): Promise<UserPublic[]> {
	const rows = await db.query.users.findMany({
		orderBy: (u, { asc }) => [asc(u.createdAt)],
	});
	return rows.map(toPublic);
}

/**
 * Crea un usuario para registro publico.
 * emailVerified = false, genera token de verificacion valido 24h.
 * Retorna el usuario completo (con token) para enviar el email.
 */
export async function registerUser(input: RegisterInput) {
	const passwordHash = await hashPassword(input.password);
	const token = randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

	const [user] = await db
		.insert(users)
		.values({
			email: input.email.toLowerCase().trim(),
			passwordHash,
			name: input.name,
			role: "organizer",
			emailVerified: false,
			emailVerificationToken: token,
			emailVerificationExpiresAt: expiresAt,
		})
		.returning();

	return { user: toPublic(user), token };
}

/**
 * Marca el email del usuario como verificado y limpia el token.
 * Debe llamarse despues de validar el token con getUserByVerificationToken.
 */
export async function markEmailVerified(userId: string): Promise<void> {
	await db
		.update(users)
		.set({
			emailVerified: true,
			emailVerificationToken: null,
			emailVerificationExpiresAt: null,
		})
		.where(eq(users.id, userId));
}

export type RenewVerificationResult =
	| { status: "not-found" }
	| { status: "already-verified" }
	| { status: "cooldown"; retryAfterMs: number }
	| { status: "ok"; user: UserPublic; token: string };

/**
 * Regenera el token de verificacion de un usuario no verificado (flujo de reenvio).
 * Respeta un cooldown de RESEND_COOLDOWN_MS derivado de emailVerificationExpiresAt
 * (no requiere columna extra: ultimo envio = expiresAt - VERIFICATION_TOKEN_TTL_MS).
 */
export async function renewVerificationToken(email: string): Promise<RenewVerificationResult> {
	const user = await getUserByEmail(email);
	if (!user) return { status: "not-found" };
	if (user.emailVerified) return { status: "already-verified" };

	if (user.emailVerificationExpiresAt) {
		const lastSentAt = user.emailVerificationExpiresAt.getTime() - VERIFICATION_TOKEN_TTL_MS;
		const elapsed = Date.now() - lastSentAt;
		if (elapsed < RESEND_COOLDOWN_MS) {
			return { status: "cooldown", retryAfterMs: RESEND_COOLDOWN_MS - elapsed };
		}
	}

	const token = randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

	const [updated] = await db
		.update(users)
		.set({ emailVerificationToken: token, emailVerificationExpiresAt: expiresAt })
		.where(eq(users.id, user.id))
		.returning();

	return { status: "ok", user: toPublic(updated), token };
}

export async function createUser(input: CreateUserInput) {
	const passwordHash = await hashPassword(input.password);
	const [user] = await db
		.insert(users)
		.values({
			email: input.email.toLowerCase().trim(),
			passwordHash,
			name: input.name,
			role: input.role ?? "organizer",
			emailVerified: true, // usuarios creados por admin ya estan verificados
		})
		.returning();
	return toPublic(user);
}

export async function updateUser(id: string, input: UpdateUserInput) {
	const patch: Record<string, unknown> = {};
	if (input.name !== undefined) patch.name = input.name;
	if (input.role !== undefined) patch.role = input.role;
	if (input.active !== undefined) patch.active = input.active;
	if (input.password !== undefined) patch.passwordHash = await hashPassword(input.password);

	const [updated] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
	return updated ? toPublic(updated) : null;
}

export async function countUsers(): Promise<number> {
	const rows = await db.query.users.findMany({ columns: { id: true } });
	return rows.length;
}

// -- Helpers -------------------------------------------------------------------

function toPublic(u: typeof users.$inferSelect): UserPublic {
	return {
		id: u.id,
		email: u.email,
		name: u.name,
		role: u.role as UserPublic["role"],
		active: u.active,
		emailVerified: u.emailVerified,
		organizationId: u.organizationId ?? null,
		createdAt: u.createdAt,
	};
}
