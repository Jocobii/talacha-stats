/**
 * features/tournament-skin/lib/map-activation-view.ts
 *
 * Mapper puro DTO → ViewModel (§19). `today` se inyecta ("YYYY-MM-DD") para
 * que isLive sea determinista y testeable.
 */

import type { SkinActivationDto } from "@/entities/skin-activation";
import { isSkinId, SKINS } from "@/shared/skins/registry";
import type { SkinActivationView } from "../types";

const RANGE_FORMAT = new Intl.DateTimeFormat("es-MX", {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

function formatDateOnly(isoDate: string): string {
	return RANGE_FORMAT.format(new Date(`${isoDate}T00:00:00Z`));
}

/** Etiqueta desde el registry; si el skin ya no existe en código, la fila es huérfana. */
function describeSkin(skinId: string): { label: string; isOrphan: boolean } {
	if (isSkinId(skinId)) return { label: SKINS[skinId].label, isOrphan: false };
	return { label: skinId, isOrphan: true };
}

function isWithinRange(dto: SkinActivationDto, today: string): boolean {
	return dto.startsOn <= today && today <= dto.endsOn;
}

export function mapSkinActivationToView(dto: SkinActivationDto, today: string): SkinActivationView {
	const { label, isOrphan } = describeSkin(dto.skinId);
	return {
		id: dto.id,
		skinId: dto.skinId,
		skinLabel: label,
		isOrphan,
		name: dto.name,
		dateRangeLabel: `${formatDateOnly(dto.startsOn)} – ${formatDateOnly(dto.endsOn)}`,
		isEnabled: dto.isEnabled,
		isLive: dto.isEnabled && !isOrphan && isWithinRange(dto, today),
	};
}
