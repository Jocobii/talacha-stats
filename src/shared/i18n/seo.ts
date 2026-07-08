// ── Helpers de SEO multi-idioma (plan I18N §7) ───────────────────────────────
// Única fuente de verdad para construir `alternates.languages` (hreflang),
// `alternates.canonical` y `openGraph.locale` en `generateMetadata` de las
// páginas públicas. Evita repetir la lógica de "con/sin prefijo" en cada
// página (AGENTS.md §3.5 DRY).

import { locales, defaultLocale, type AppLocale } from "./config";

/** Mapea cada locale soportado a su código `og:locale` (Open Graph). */
const OG_LOCALES: Record<AppLocale, string> = {
	es: "es_MX",
	en: "en_US",
};

function siteUrl(): string {
	return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
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

/**
 * Construye `alternates.canonical` (autorreferente, apunta a la URL del
 * locale actual) + `alternates.languages` (una entrada `hreflang` por
 * locale soportado, más `x-default` → `es`) para un `pathname` dado
 * (sin prefijo de locale, ej. `/ligas`, `/player/abc123`).
 */
export function buildLocaleAlternates(locale: AppLocale, pathname: string): LocaleAlternates {
	const base = siteUrl();
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
