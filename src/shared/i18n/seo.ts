// ── Helpers de SEO multi-idioma (plan I18N §7) ───────────────────────────────
// Única fuente de verdad para construir `alternates.languages` (hreflang),
// `alternates.canonical` y `openGraph.locale` en `generateMetadata` de las
// páginas públicas. Evita repetir la lógica de "con/sin prefijo" en cada
// página (AGENTS.md §3.5 DRY).

import { locales, defaultLocale, type AppLocale } from "./config";
import { getRootDomain } from "@/shared/tenant/host";

/** Mapea cada locale soportado a su código `og:locale` (Open Graph). */
const OG_LOCALES: Record<AppLocale, string> = {
	es: "es_MX",
	en: "en_US",
};

/**
 * Única fuente de verdad para la base URL del sitio. En producción, todo
 * primitivo de SEO (metadataBase, canonicals, hreflang, sitemap, robots)
 * depende de esto — si `NEXT_PUBLIC_BASE_URL` falta en build de prod, Google
 * indexaría localhost y los canonicals quedarían envenenados. Por eso el
 * build falla en vez de caer silenciosamente a localhost; en dev/preview sin
 * la env var seteada, sí cae a localhost para no bloquear el flujo local.
 */
export function getSiteUrl(): string {
	const url = process.env.NEXT_PUBLIC_BASE_URL;
	if (!url) {
		if (process.env.NODE_ENV === "production") {
			throw new Error(
				"NEXT_PUBLIC_BASE_URL no está seteado en producción. Configúralo en Vercel " +
					"(https://www.talachastats.com) antes de desplegar — todo el SEO (metadataBase, " +
					"canonicals, hreflang, sitemap, robots) depende de esta variable.",
			);
		}
		return "http://localhost:3000";
	}
	return url;
}

function siteUrl(): string {
	return getSiteUrl();
}

/**
 * Construye el pathname con el prefijo de locale correcto según
 * `localePrefix: 'as-needed'`: el `defaultLocale` (`es`) nunca lleva
 * prefijo, el resto sí (`/en/...`).
 */
export function localizedPathname(locale: AppLocale, pathname: string): string {
	const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
	return locale === defaultLocale ? clean : `/${locale}${clean}`;
}

/** Devuelve `og:locale` (`es_MX` / `en_US`) para el locale dado. */
export function ogLocale(locale: AppLocale): string {
	return OG_LOCALES[locale];
}

export type LocaleAlternates = {
	canonical: string;
	languages: Record<AppLocale | "x-default", string>;
};

function buildAlternatesFromBase(base: string, locale: AppLocale, pathname: string): LocaleAlternates {
	const languages = Object.fromEntries(
		locales.map((l) => [l, `${base}${localizedPathname(l, pathname)}`]),
	) as Record<AppLocale, string>;

	return {
		canonical: `${base}${localizedPathname(locale, pathname)}`,
		languages: {
			...languages,
			"x-default": `${base}${localizedPathname(defaultLocale, pathname)}`,
		},
	};
}

/**
 * Construye `alternates.canonical` (autorreferente, apunta a la URL del
 * locale actual) + `alternates.languages` (una entrada `hreflang` por
 * locale soportado, más `x-default` → `es`) para un `pathname` dado
 * (sin prefijo de locale, ej. `/ligas`, `/player/abc123`). Base = apex.
 */
export function buildLocaleAlternates(locale: AppLocale, pathname: string): LocaleAlternates {
	return buildAlternatesFromBase(siteUrl(), locale, pathname);
}

/**
 * URL base del subdominio de una org (`https://{slug}.talachastats.com`).
 * Mismo protocolo que `NEXT_PUBLIC_BASE_URL` (así dev con `http://localhost`
 * no genera canonicals `https://` rotos), dominio raíz de
 * `NEXT_PUBLIC_ROOT_DOMAIN` (shared/tenant/host.ts — misma fuente que usa
 * proxy.ts para el rewrite real, nunca un segundo lugar donde hardcodear
 * el dominio).
 */
export function buildOrgSiteUrl(orgSlug: string): string {
	const protocol = siteUrl().startsWith("https") ? "https" : "http";
	return `${protocol}://${orgSlug}.${getRootDomain()}`;
}

/**
 * Igual que `buildLocaleAlternates`, pero para páginas del subárbol de una
 * org (docs/SUBDOMINIOS-MULTITENANT.md §5): la URL canónica de esas páginas
 * es el SUBDOMINIO, no `/org/{slug}` en el apex (eso es un alias legacy que
 * 301/307-redirige, ver proxy.ts). `pathname` va SIN el prefijo `/org/{slug}`
 * — es relativo al subdominio (`/`, `/ranking`, `/{leagueSlug}`, etc.), igual
 * que los `Link` internos del subárbol (ver OrgPublicShell.tsx).
 */
export function buildOrgLocaleAlternates(
	locale: AppLocale,
	orgSlug: string,
	pathname: string,
): LocaleAlternates {
	return buildAlternatesFromBase(buildOrgSiteUrl(orgSlug), locale, pathname);
}
