import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { isMexicoCity } from "@/shared/lib/cities";
import { buildCityCookieHeader } from "@/shared/lib/active-city";

const Schema = z.object({ city: z.string().min(1) });

// POST /api/auth/city — switches the active city for the current admin session.
export async function POST(request: Request) {
  const body   = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError("Ciudad requerida", 400);

  const { city } = parsed.data;
  if (!isMexicoCity(city)) return apiError("Ciudad no reconocida", 400);

  const isProduction = process.env.NODE_ENV === "production";

  return new Response(JSON.stringify({ ok: true, city }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildCityCookieHeader(city, isProduction),
    },
  });
}
