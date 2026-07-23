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
 *
 * `root` refleja la FAMILIA de dominio detectada en el host actual
 * (`localhost`, `lvh.me`, o el `rootDomain` configurado) — nunca un valor
 * hardcodeado ajeno al request. Así, cualquier redirect que `proxy.ts`
 * construya a partir de `ctx.root` se queda dentro del mismo ambiente:
 * un dev en `localhost:3000` nunca puede terminar redirigido a producción
 * solo porque `NEXT_PUBLIC_ROOT_DOMAIN` no esté seteado localmente (bug
 * real detectado en desarrollo: `/org/{slug}` en localhost mandaba a
 * `{slug}.talachastats.com`).
 */

import { RESERVED_ORG_SLUGS } from "@/shared/org-theme/slug";

export type HostContext =
	| { kind: "apex"; root: string; isRootHost: boolean }
	| { kind: "reserved"; sub: string; root: string }
	| { kind: "org"; slug: string; root: string };

/**
 * Dominio raíz de producción. `NEXT_PUBLIC_ROOT_DOMAIN` lo sobreescribe en
 * dev/preview (p. ej. `localhost` — ver docs/SUBDOMINIOS-MULTITENANT.md §7).
 * Sin la env var, cae a `talachastats.com` (no bloquea build como
 * `getSiteUrl` en shared/i18n/seo.ts: aquí un fallback erróneo solo
 * clasifica mal un host de subdominio, no envenena SEO — y `classifyHost`
 * ya no deja que ese fallback filtre a un redirect real, ver `isRootHost`).
 */
export function getRootDomain(): string {
	return process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "talachastats.com";
}

function escapeForRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Clasifica un header `Host`. `rootDomain` es opcional para tests puros;
 * `proxy.ts` la omite y usa `getRootDomain()`.
 *
 * `isRootHost` (solo relevante para `kind: "apex"`) distingue el apex
 * REAL (hostname === root o www.root) de un host desconocido que cayó a
 * apex por descarte (p. ej. un preview `*.vercel.app` sin wildcard propio,
 * o `localhost` cuando `rootDomain` configurado no coincide). `proxy.ts`
 * usa esta bandera para decidir si un redirect entre hosts es seguro —
 * nunca redirige "a ciegas" a `root` si no confirmó que el host actual
 * pertenece a esa familia.
 */
export function classifyHost(host: string | null, rootDomain: string = getRootDomain()): HostContext {
	const hostname = (host ?? "").split(":")[0].toLowerCase(); // sin puerto

	// Dev: *.localhost / *.lvh.me resuelven a 127.0.0.1 sin tocar /etc/hosts
	// (§7). Si el host pertenece a una de estas familias, esa ES la raíz —
	// independientemente de `rootDomain` — para no mezclar dev con prod.
	const isLocalhostFamily = hostname === "localhost" || hostname.endsWith(".localhost");
	const isLvhFamily = hostname === "lvh.me" || hostname.endsWith(".lvh.me");
	const root = isLocalhostFamily ? "localhost" : isLvhFamily ? "lvh.me" : rootDomain;

	const isRootHost = hostname === root || hostname === `www.${root}`;
	const rootSuffix = new RegExp(`\\.${escapeForRegex(root)}$`);
	const bare = hostname.replace(rootSuffix, "");

	if (isRootHost || bare === "" || bare === hostname) {
		return { kind: "apex", root, isRootHost };
	}

	const sub = bare.split(".")[0];
	if (RESERVED_ORG_SLUGS.has(sub)) {
		return { kind: "reserved", sub, root };
	}
	return { kind: "org", slug: sub, root };
}
