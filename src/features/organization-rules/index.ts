/**
 * features/organization-rules/index.ts
 * Exportaciones públicas. rules.ts es SOLO server (importa @/db) — no se
 * re-exporta aquí; API routes lo importan por ruta directa
 * `@/features/organization-rules/rules` (mismo patrón que tournament-rules).
 */

export { ReglamentoTab } from "./ui/ReglamentoTab";
export { useOrganizationRules } from "./model/useOrganizationRules";
export { useUpdateOrganizationRules } from "./model/useUpdateOrganizationRules";
export { mapOrganizationConfigToRulesView } from "./lib/map-rules-view";
export type { OrgRulesFormView } from "./types";
