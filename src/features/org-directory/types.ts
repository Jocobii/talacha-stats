/**
 * features/org-directory/types.ts
 * ViewModel del Hub de Portales (§19) — nunca se consume el DTO crudo en la UI.
 */
import type { OrgDirectorySort } from "@/entities/organization";

export type OrgDirectoryFiltersValue = {
	/** "" = todas las ciudades (opción "Todas" del dropdown). */
	city: string;
	q: string;
	sort: OrgDirectorySort;
};

export type OrgDirectoryCardView = {
	id: string;
	name: string;
	slug: string;
	/** Ruta interna (/org/{slug}) — fallback confiable, no depende del host. */
	href: string;
	logoUrl: string | null;
	city: string;
	leagueCount: number;
	teamCount: number;
	playerCount: number;
	initial: string;
	avatarPalette: { bg: string; text: string; border: string };
	/** Texto de preview del subdominio, ej. "novofut.talachastats.com" (cosmético). */
	subdomainPreview: string;
};
