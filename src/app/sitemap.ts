import type { MetadataRoute } from "next";
import { locales, defaultLocale, type AppLocale } from "@/shared/i18n/config";
import { localizedPathname } from "@/shared/i18n/seo";
import { listOrganizationsPublic } from "@/entities/organization";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// Rutas públicas estáticas (fuera de esta lista: admin, api, auth — nunca en
// el sitemap, plan I18N §7.2).
const STATIC_PUBLIC_PATHS = [
	"/",
	"/ligas",
	"/ranking",
	"/matchday",
	"/players",
	"/about",
	"/para-organizadores",
	"/demo",
	"/analysis",
];

function alternatesFor(pathname: string): Record<string, string> {
	return Object.fromEntries(
		locales.map((locale) => [locale, `${siteUrl}${localizedPathname(locale, pathname)}`]),
	);
}

function entriesFor(pathname: string, lastModified?: Date): MetadataRoute.Sitemap {
	return locales.map((locale: AppLocale) => ({
		url: `${siteUrl}${localizedPathname(locale, pathname)}`,
		lastModified,
		alternates: { languages: alternatesFor(pathname) },
		// La versión `es` (default, sin prefijo) es la que lleva más tiempo indexada.
		priority: locale === defaultLocale ? 0.8 : 0.5,
	}));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticEntries = STATIC_PUBLIC_PATHS.flatMap((path) => entriesFor(path));

	// Entradas dinámicas: orgs verificadas + sus ligas activas (§7.2 "una
	// entrada por locale por URL pública"). Los perfiles de jugador
	// (`/player/[id]`) se descubren por rastreo de enlaces internos, no se
	// enumeran aquí por volumen.
	const orgs = await listOrganizationsPublic();
	const dynamicEntries = orgs.flatMap((org) => [
		...entriesFor(`/org/${org.slug}`),
		...org.leagues
			.filter((league) => league.slug)
			.flatMap((league) => entriesFor(`/org/${org.slug}/${league.slug}`)),
	]);

	return [...staticEntries, ...dynamicEntries];
}
