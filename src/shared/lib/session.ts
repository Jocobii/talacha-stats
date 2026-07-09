/**
 * shared/lib/session.ts
 * Firma y verifica tokens de sesión usando Node.js crypto (HMAC-SHA256).
 * Funciona en Server Components y API Routes (runtime Node.js).
 *
 * Formato del token (base64url):
 *   {userId}|{expiresAt}|{hmac-sha256-hex}
 *
 * Requiere la variable de entorno SESSION_SECRET (mínimo 32 chars).
 */

import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "ts_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días — "mantener sesión iniciada"
const SESSION_DURATION_SHORT_MS = 24 * 60 * 60 * 1000; // 1 día — sin "mantener sesión iniciada"

function secret(): string {
	const s = process.env.SESSION_SECRET;
	if (!s || s.length < 32) {
		console.warn(
			"[session] SESSION_SECRET no configurado o muy corto — usando valor de desarrollo.",
		);
		return "dev-secret-talachastats-32-chars!!";
	}
	return s;
}

// ── Firma ─────────────────────────────────────────────────────────────────────

export function signSession(userId: string, durationMs: number = SESSION_DURATION_MS): string {
	const exp = Date.now() + durationMs;
	const payload = `${userId}|${exp}`;
	const hmac = createHmac("sha256", secret()).update(payload).digest("hex");
	return Buffer.from(`${payload}|${hmac}`).toString("base64url");
}

// ── Verificación ──────────────────────────────────────────────────────────────

export function verifySession(token: string): { userId: string } | null {
	try {
		const decoded = Buffer.from(token, "base64url").toString("utf8");
		// Separar desde el último pipe — el HMAC es lo último
		const lastPipe = decoded.lastIndexOf("|");
		if (lastPipe < 0) return null;

		const hmac = decoded.slice(lastPipe + 1);
		const payload = decoded.slice(0, lastPipe);

		const expected = createHmac("sha256", secret()).update(payload).digest("hex");

		// Ambos son strings hex de 64 chars — timing-safe compare
		if (hmac.length !== expected.length) return null;
		if (!timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return null;

		// Parsear payload: userId|expiresAt
		const firstPipe = payload.indexOf("|");
		if (firstPipe < 0) return null;

		const userId = payload.slice(0, firstPipe);
		const exp = parseInt(payload.slice(firstPipe + 1), 10);

		if (!userId || isNaN(exp) || Date.now() > exp) return null;

		return { userId };
	} catch {
		return null;
	}
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

/**
 * Construye el header Set-Cookie de la sesión.
 * `remember=true` (default): token y cookie duran 7 días — "mantener sesión iniciada".
 * `remember=false`: token dura 1 día y la cookie no lleva Max-Age (cookie de sesión,
 * se borra al cerrar el navegador) — usado cuando el usuario destilda esa opción en /login.
 */
export function buildSessionCookie(
	userId: string,
	isProduction: boolean,
	remember: boolean = true,
): string {
	const durationMs = remember ? SESSION_DURATION_MS : SESSION_DURATION_SHORT_MS;
	const token = signSession(userId, durationMs);
	return [
		`${SESSION_COOKIE}=${token}`,
		"Path=/",
		"HttpOnly",
		"SameSite=Lax",
		isProduction ? "Secure" : "",
		remember ? `Max-Age=${7 * 24 * 60 * 60}` : "",
	]
		.filter(Boolean)
		.join("; ");
}

export function clearSessionCookie(isProduction: boolean): string {
	return [
		`${SESSION_COOKIE}=`,
		"Path=/",
		"HttpOnly",
		"SameSite=Lax",
		isProduction ? "Secure" : "",
		"Max-Age=0",
	]
		.filter(Boolean)
		.join("; ");
}

/** Lee el valor de la cookie ts_session de los headers de un Request. */
export function getSessionToken(request: Request): string | null {
	const cookieHeader = request.headers.get("cookie") ?? "";
	const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
	return match?.[1] ?? null;
}
