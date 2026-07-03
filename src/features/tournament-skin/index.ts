/**
 * features/tournament-skin/index.ts
 * Exportaciones públicas. App/ y otras capas solo importan desde aquí.
 */

export { SkinScope } from "./ui/SkinScope";
export { SkinAdminPanel } from "./ui/SkinAdminPanel";
export { SkinPreview } from "./ui/SkinPreview";
export { SkinPickerGrid } from "./ui/SkinPickerGrid";

export { useSkinActivations } from "./model/useSkinActivations";
export {
	useCreateSkinActivation,
	useDeleteSkinActivation,
	useToggleSkinActivation,
} from "./model/useActivationMutations";
export { ActivationFormSchema, type ActivationFormInput } from "./model/activation-form-schema";

export { mapSkinActivationToView } from "./lib/map-activation-view";
export { resolveSkinId } from "./lib/resolve-skin-id";
export { todayIso } from "./lib/today-iso";

// NOTA: get-active-skin.ts y activations.ts importan @/db y son SOLO server.
// No se re-exportan aquí para no arrastrar `pg` al bundle del navegador.
// Server Components y API routes los importan por ruta directa:
//   `@/features/tournament-skin/get-active-skin`
//   `@/features/tournament-skin/activations`

export type { ActiveSkinView, SkinActivationView } from "./types";
