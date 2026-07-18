/**
 * features/player-directory/lib/map-player-directory-view.ts
 * Único puente DTO → ViewModel del directorio público (§19). Función pura,
 * sin imports de `@/db`.
 */

import type { PlayerListItem } from "@/entities/player";
import type { PlayerDirectoryView } from "../types";

export function mapPlayerListItemToDirectoryView(item: PlayerListItem): PlayerDirectoryView {
	return {
		id: item.id,
		displayName: item.fullName,
		alias: item.alias,
	};
}
