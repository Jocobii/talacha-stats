/**
 * features/share-assets/deep-link.ts
 * Construye el deep-link canónico de un asset con parámetros de atribución.
 *
 * Regla C2: el QR y el deep-link siempre llevan atribución (ref, t).
 * Regla C3: apunta a la liga, no a la raíz.
 */
import { BRAND } from "@/shared/brand";

export type AssetType =
	| "standings"
	| "goleadores"
	| "combo"
	| "league_launch"
	| "player_card"
	| "og";

type DeepLinkParams = {
	orgSlug: string;
	leagueSlug: string;
	assetType: AssetType;
};

/**
 * Retorna la URL canónica de la liga con parámetros de atribución.
 * Ejemplo: https://talachastats.com/novofut/liga-lunes?ref=asset&t=combo
 */
export function buildDeepLink({ orgSlug, leagueSlug, assetType }: DeepLinkParams): string {
	const base = `https://${BRAND.domain}/${orgSlug}/${leagueSlug}`;
	const params = new URLSearchParams({ ref: "asset", t: assetType });
	return `${base}?${params.toString()}`;
}

/**
 * Versión sin atribución — solo para mostrar en pantalla como texto amigable.
 * Usar buildDeepLink() para el QR y los links reales.
 */
export function buildDisplayUrl(orgSlug: string, leagueSlug: string): string {
	return `${BRAND.domain}/${orgSlug}/${leagueSlug}`;
}
