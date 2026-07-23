/**
 * features/org-directory/lib/map-org-directory-view.ts
 * Único puente DTO → ViewModel del Hub de Portales (§19). Función pura, sin
 * imports de `@/db`.
 */
import { titleCase } from "@/shared/lib/normalize";
import { getRootDomain } from "@/shared/tenant/host";
import type { OrgDirectoryItem } from "@/entities/organization";
import { ORG_DIRECTORY_AVATAR_PALETTE } from "../constants";
import type { OrgDirectoryCardView } from "../types";

/** Hash simple y determinístico (mismo id → mismo índice siempre). */
function hashToIndex(id: string, length: number): number {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
	}
	return hash % length;
}

export function mapOrgDirectoryItemToView(item: OrgDirectoryItem): OrgDirectoryCardView {
	const name = titleCase(item.name);
	const palette =
		ORG_DIRECTORY_AVATAR_PALETTE[hashToIndex(item.id, ORG_DIRECTORY_AVATAR_PALETTE.length)];

	return {
		id: item.id,
		name,
		slug: item.slug,
		href: `/org/${item.slug}`,
		logoUrl: item.logoUrl,
		city: item.city,
		leagueCount: item.leagueCount,
		teamCount: item.teamCount,
		playerCount: item.playerCount,
		initial: name.charAt(0).toUpperCase(),
		avatarPalette: palette,
		subdomainPreview: `${item.slug}.${getRootDomain()}`,
	};
}
