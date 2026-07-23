/**
 * shared/tenant/apex-url.ts
 *
 * Server-only. Construye una URL ABSOLUTA al apex (talachastats.com) a
 * partir del request actual — funciona igual en prod, dev (*.localhost) y
 * *.lvh.me sin hardcodear protocolo/puerto (mismo espíritu que
 * `sameOriginAuthority` en proxy.ts).
 *
 * Por qué existe: dentro de un subdominio de org, proxy.ts reescribe
 * CUALQUIER pathname no protegido a `/org/{slug}{pathname}`
 * (docs/SUBDOMINIOS-MULTITENANT.md §2.2). Un link relativo como
 * `href="/ligas"` renderizado en el nav/footer de la org, si se navega
 * mientras el host actual es `miliga.talachastats.com`, terminaría
 * reescrito a `/org/miliga/ligas` (no existe, 404) en vez de llevar al
 * `/ligas` real del apex. Cualquier link que deba SALIR del mundo de la
 * org de vuelta al apex necesita una URL absoluta — de ahí este helper.
 */

import { headers } from "next/headers";
import { classifyHost } from "./host";

const DEV_ROOT_FAMILIES = new Set(["localhost", "lvh.me"]);

export async function getApexUrl(pathname: string): Promise<string> {
	const host = (await headers()).get("host");
	const { root } = classifyHost(host);
	const port = (host ?? "").split(":")[1];
	const protocol = DEV_ROOT_FAMILIES.has(root) ? "http" : "https";
	return `${protocol}://${root}${port ? `:${port}` : ""}${pathname}`;
}
