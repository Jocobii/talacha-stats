/**
 * features/org-theming/types.ts
 *
 * DTO serializado del tema (lo que viaja por el API route) y constantes.
 * Client-safe: sin imports de @/db.
 */

export type OrgThemeDto = {
	id: string;
	organizationId: string;
	mode: string;
	presetId: string | null;
	colorPrimary: string | null;
	colorAccent: string | null;
	colorSurface: string | null;
	colorInk: string | null;
	fontId: string;
	updatedAt: string;
};

export function orgThemeUrl(organizationId: string): string {
	return `/api/organizations/${organizationId}/theme`;
}
