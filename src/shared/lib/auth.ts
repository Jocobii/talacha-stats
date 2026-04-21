/**
 * shared/lib/auth.ts
 * Obtiene el usuario de la sesión activa.
 *
 * getSessionUser()            → para Server Components (lee cookies() de next/headers)
 * getSessionUserFromRequest() → para API Route Handlers (lee el Request directamente)
 *
 * Ambas verifican el HMAC del token Y confirman que el usuario existe en DB.
 */

import { cookies }        from "next/headers";
import { verifySession, getSessionToken } from "./session";
import { getUserById }    from "@/entities/user";

// ── Tipo público de sesión ────────────────────────────────────────────────────

export type SessionUser = {
  id:    string;
  email: string;
  name:  string;
  role:  "owner" | "organizer";
};

// ── Para Server Components ────────────────────────────────────────────────────

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get("ts_session")?.value;
  if (!token) return null;
  return resolveUser(token);
}

// ── Para API Route Handlers ───────────────────────────────────────────────────

export async function getSessionUserFromRequest(
  request: Request,
): Promise<SessionUser | null> {
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
    id:    user.id,
    email: user.email,
    name:  user.name,
    role:  user.role as SessionUser["role"],
  };
}

/** Verifica que el usuario sea owner o que la liga le pertenezca. */
export function canManageLeague(
  user: SessionUser,
  leagueAdminId: string | null,
): boolean {
  if (user.role === "owner") return true;
  return leagueAdminId === user.id;
}
