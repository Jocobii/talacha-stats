/**
 * features/tournament-skin/types.ts
 * ViewModels de la feature (§19). La UI consume esto, nunca el DTO crudo.
 */

import type { SkinId } from "@/shared/skins/registry";

export type SkinActivationView = {
	id: string;
	/** Id crudo del skin — lo usa SkinPreview para pintar los swatches reales. */
	skinId: string;
	/** Etiqueta del skin en el registry; el id crudo si el skin ya no existe en código. */
	skinLabel: string;
	/** true si el skinId ya no está en el registry (fila inerte tras un deploy). */
	isOrphan: boolean;
	name: string;
	/** "12 jun – 19 jul 2026" */
	dateRangeLabel: string;
	isEnabled: boolean;
	/** Habilitada Y con el día de referencia dentro del rango. */
	isLive: boolean;
};

export type ActiveSkinView = {
	skinId: SkinId | null;
};
