import { cookies } from "next/headers";
import { DEFAULT_CITY, isMexicoCity } from "./cities";

export const ACTIVE_CITY_COOKIE = "active_city";

// Server-only: reads the active city from the session cookie.
// Falls back to DEFAULT_CITY if the cookie is missing or invalid.
export async function getActiveCity(): Promise<string> {
  const store = await cookies();
  const value = store.get(ACTIVE_CITY_COOKIE)?.value;
  return value && isMexicoCity(value) ? value : DEFAULT_CITY;
}

// Resolves city for API Route Handlers:
//   1. ?city= query param  (public pages or explicit override)
//   2. active_city cookie  (admin client-side fetches — browser sends it automatically)
//   3. DEFAULT_CITY        (unauthenticated public users)
export async function getRequestCity(request: Request): Promise<string> {
  const cityParam = new URL(request.url).searchParams.get("city");
  if (cityParam && isMexicoCity(cityParam)) return cityParam;
  return getActiveCity();
}

// Build the Set-Cookie header string for a city cookie.
export function buildCityCookieHeader(city: string, isProduction: boolean): string {
  return [
    `${ACTIVE_CITY_COOKIE}=${city}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    isProduction ? "Secure" : "",
    `Max-Age=${60 * 60 * 24 * 30}`, // 30 days
  ]
    .filter(Boolean)
    .join("; ");
}
