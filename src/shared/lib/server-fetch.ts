/**
 * shared/lib/server-fetch.ts
 *
 * Wrapper de fetch para Server Components que reenvía automáticamente
 * las cookies del navegador en cada petición interna.
 *
 * El fetch nativo en Server Components NO incluye las cookies del browser,
 * lo que rompe la autenticación cuando una página llama a un API Route
 * interno (el token ts_session llega vacío al route handler).
 *
 * Uso: reemplazar `fetch(url, opts)` por `serverFetch(url, opts)` en
 * cualquier Server Component que llame a rutas internas autenticadas.
 */
import { cookies } from "next/headers";

export async function serverFetch(
  url: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Cookie: cookieHeader,
    },
  });
}
