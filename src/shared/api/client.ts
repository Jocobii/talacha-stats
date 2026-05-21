/**
 * shared/api/client.ts
 *
 * Cliente HTTP para Client Components.
 *
 * Encapsula el patrón estándar de fetch hacia las API Routes internas:
 * serialización del body, headers JSON y lectura de la respuesta tipada
 * { ok, data } / { ok, error } que devuelve el backend.
 *
 * Uso obligatorio en todo Client Component que haga mutaciones o lecturas
 * a rutas internas. NO usar fetch() desnudo en el frontend.
 *
 * Para Server Components que necesiten reenviar cookies usar `serverFetch`
 * de shared/lib/server-fetch.ts — este módulo es solo para el cliente.
 */

// ---------------------------------------------------------------------------
// Tipos públicos — re-exportar para que los callsites no importen desde aquí
// ---------------------------------------------------------------------------

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// Helpers de narrowing — usar en callsites para mayor claridad
// ---------------------------------------------------------------------------

export function isApiSuccess<T>(result: ApiResult<T>): result is ApiSuccess<T> {
	return result.ok === true;
}

// ---------------------------------------------------------------------------
// Opciones — igual que RequestInit pero body siempre como objeto plano
// ---------------------------------------------------------------------------

type FetchOptions = Omit<RequestInit, "body"> & {
	body?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Implementación principal
// ---------------------------------------------------------------------------

/**
 * Hace una petición a una API Route interna y devuelve un ApiResult<T>.
 *
 * - Serializa `body` como JSON automáticamente.
 * - Preserva el mensaje de error del backend tal como viene.
 * - Errores de red (sin conexión, CORS) se propagan como excepción para que
 *   el componente los maneje con try/catch si lo necesita.
 *
 * @example
 * const result = await apiFetch<SeedResult>("/api/seed-liga", {
 *   method: "POST",
 *   body: { ...form, organizationId: form.organizationId || undefined },
 * });
 *
 * if (!result.ok) {
 *   setError(result.error);
 * } else {
 *   setResult(result.data);
 * }
 */
export async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<ApiResult<T>> {
	const { body, headers, ...rest } = options;

	const res = await fetch(url, {
		...rest,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});

	const payload: unknown = await res.json();

	if (!res.ok || !(payload as { ok?: boolean }).ok) {
		return {
			ok: false,
			error: (payload as { error?: string }).error ?? "Error inesperado",
		};
	}

	return { ok: true, data: (payload as { data: T }).data };
}
