/**
 * shared/lib/auth.ts
 * Obtiene el usuario de la sesión activa.
 *
 * getSessionUser()            → para Server Components (lee cookies() de next/headers)
 * getSessionUserFromRequest() → para API Route Handlers (lee el Request directamente)
 *
 * Ambas verifican el HMAC del token Y confirman que el usuario existe en DB.
 */

import { cookies } from "next/headers";
import { verifySession, getSessionToken } from "./session";
import { getUserById } from "@/entities/user";

// ── Tipo público de sesión ────────────────────────────────────────────────────

export type SessionUser = {
	id: string;
	email: string;
	name: string;
	role: "owner" | "organizer";
	organizationId: string | null;
};

// ── Para Server Components ────────────────────────────────────────────────────

export async function getSessionUser(): Promise<SessionUser | null> {
	const store = await cookies();
	const token = store.get("ts_session")?.value;
	if (!token) return null;
	return resolveUser(token);
}

// ── Para API Route Handlers ───────────────────────────────────────────────────

export async function getSessionUserFromRequest(request: Request): Promise<SessionUser | null> {
	const token = getSessionToken(request);
	if (!token) return null;
	return resolveUser(token);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveUser(token: string): Promise<SessionUser | null> {
	const session = verifySession(token);
	if (!session) return null;

	const user = await getUserById(session.userId);
	if (!user || !user.active) return null;

	return {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role as SessionUser["role"],
		organizationId: user.organizationId ?? null,
	};
}

/**
 * Verifica que el usuario pueda gestionar una liga.
 * - owner: puede gestionar cualquier liga.
 * - organizer: solo puede gestionar ligas de su propia organización.
 */
export function canManageLeague(user: SessionUser, leagueOrganizationId: string | null): boolean {
	if (user.role === "owner") return true;
	if (!user.organizationId || !leagueOrganizationId) return false;
	return user.organizationId === leagueOrganizationId;
}
