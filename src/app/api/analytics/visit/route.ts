/**
 * POST /api/analytics/visit
 * Body: { page: string }
 *
 * Registra una visita a una página pública.
 * - Lee el visitor_id de la cookie. Si no existe, crea un UUID nuevo.
 * - Inserta una fila en page_views.
 * - Devuelve la cookie visitor_id (nueva o existente).
 */

import { randomUUID } from "crypto";
import { recordVisit } from "@/entities/analytics/queries";
import { apiError } from "@/types";

const COOKIE_NAME  = "visitor_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { page?: string };
  const page = body.page?.trim();

  if (!page) return apiError("Falta page", 400);

  // Leer visitor_id de la cookie de la request
  const cookieHeader = request.headers.get("cookie") ?? "";
  const existing = cookieHeader
    .split(";")
    .map((c) => c.trim().split("="))
    .find(([name]) => name === COOKIE_NAME);

  const visitorId  = existing?.[1] ?? randomUUID();
  const isNew      = !existing;

  // Registrar la visita en DB (fire-and-forget — no bloqueamos la respuesta)
  recordVisit(visitorId, page).catch(() => {
    // Silenciar errores de tracking — nunca deben romper la experiencia
  });

  const cookieOptions = [
    `${COOKIE_NAME}=${visitorId}`,
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE}`,
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ].filter(Boolean).join("; ");

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (isNew) headers["Set-Cookie"] = cookieOptions;

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
