/**
 * shared/tenant/host.ts
 *
 * Clasificación del host de cada request para el multi-tenant por
 * subdominio (docs/SUBDOMINIOS-MULTITENANT.md §2.1). Puro y testeable sin
 * Next: `proxy.ts` es el único llamador en producción; los tests pasan
 * `rootDomain` explícito para no depender de `process.env`.
 *
 * No duplica la lista de reservados: reutiliza `RESERVED_ORG_SLUGS`
 * (shared/org-theme/slug.ts) — un slug reservado para una org tampoco es
 * un subdominio de org válido (docs/SUBDOMINIOS-MULTITENANT.md §2.1).
 */

import { RESERVED_ORG_SLUGS } from "@/shared/org-theme/slug";

export type HostContext =
	| { kind: "apex" }
	| { kind: "reserved"; sub: string }
	| { kind: "org"; slug: string };

/**
 * Dominio raíz de producción. `NEXT_PUBLIC_ROOT_DOMAIN` lo sobreescribe en
 * dev/preview (p. ej. `localhost` — ver docs/SUBDOMINIOS-MULTITENANT.md §7).
 * Sin la env var, cae a `talachastats.com` (no bloquea build como
 * `getSiteUrl` en shared/i18n/seo.ts: aquí un fallback erróneo solo
 * clasifica mal un host de subdominio, no envenena SEO).
 */
export function getRootDomain(): string {
	return process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "talachastats.com";
}

function escapeForRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Clasifica un header `Host` en uno de tres contextos. `rootDomain` es
 * opcional para tests puros; `proxy.ts` la omite y usa `getRootDomain()`.
 */
export function classifyHost(host: string | null, rootDomain: string = getRootDomain()): HostContext {
	const hostname = (host ?? "").split(":")[0].toLowerCase(); // sin puerto

	// Dev: *.localhost / *.lvh.me resuelven a 127.0.0.1 sin tocar /etc/hosts
	// (docs/SUBDOMINIOS-MULTITENANT.md §7), independientemente de `rootDomain`.
	const rootSuffix = new RegExp(`\\.${escapeForRegex(rootDomain)}$`);
	const bare = hostname.replace(/\.localhost$/, "").replace(/\.lvh\.me$/, "").replace(rootSuffix, "");

	if (hostname === rootDomain || hostname === `www.${rootDomain}` || bare === "" || bare === hostname) {
		return { kind: "apex" };
	}

	const sub = bare.split(".")[0];
	if (RESERVED_ORG_SLUGS.has(sub)) {
		return { kind: "reserved", sub };
	}
	return { kind: "org", slug: sub };
}
