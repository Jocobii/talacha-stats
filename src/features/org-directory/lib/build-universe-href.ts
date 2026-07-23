/**
 * features/org-directory/lib/build-universe-href.ts
 *
 * Arma la URL absoluta al subdominio de una organización ("Entrar al
 * universo" del diseño) a partir del host actual del navegador — funciona
 * igual en prod (talachastats.com) y dev (*.localhost, docs/
 * SUBDOMINIOS-MULTITENANT.md §7), sin necesitar el helper server-only
 * `getApexUrl` (usa `next/headers`, no disponible en un Client Component).
 *
 * Las cards de este directorio nunca se renderizan en el servidor (la query
 * de TanStack Query resuelve 100% en cliente, §7.3), así que leer
 * `window.location` aquí no genera mismatch de hidratación.
 */
export function buildUniverseHref(slug: string, rootDomainFallback: string): string {
	if (typeof window === "undefined") {
		return `https://${slug}.${rootDomainFallback}`;
	}
	const { protocol, hostname, port } = window.location;
	return `${protocol}//${slug}.${hostname}${port ? `:${port}` : ""}`;
}
