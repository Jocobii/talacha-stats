/**
 * features/discipline/index.ts
 * Exportaciones públicas. App/ y otras capas solo importan desde aquí.
 *
 * NOTA: manage-suspensions.ts, apply-card-discipline.ts,
 * decrement-suspensions.ts y sync-league-member-status.ts importan @/db y
 * son SOLO server — no se re-exportan aquí (mismo patrón que
 * features/tournament-rules/rules.ts). Server Components y API routes los
 * importan por ruta directa, ej. `@/features/discipline/manage-suspensions`.
 *
 * getOwnerSuspensionsView/getOrgSuspensionsView SÍ se re-exportan aquí (son
 * server-only pero solo los llama page.tsx, un Server Component — mismo
 * criterio que features/player-admin/index.ts). SuspensionModal y las
 * mutaciones "globales" (useCreate/useEscalateSuspensionGlobal) son
 * client-safe pero NO se re-exportan aquí a propósito: este barrel también
 * exporta funciones que tocan @/db, y un Client Component importando desde
 * el mismo módulo arrastraría ese código al bundle del navegador (regla del
 * split barrel, ver AGENTS.md §3 / memoria "entity-barrel-client-server-
 * split"). Los Client Components de app/admin/suspensiones las importan por
 * ruta directa: `@/features/discipline/ui/SuspensionModal`,
 * `@/features/discipline/model/useCreateManualSuspensionGlobal`,
 * `@/features/discipline/model/useEscalateSuspensionGlobal`.
 */

export { SuspensionsScreen } from "./ui/SuspensionsScreen";
export type { SuspensionsData } from "./model/useSuspensions";

export { getOwnerSuspensionsView } from "./lib/get-owner-suspensions-view";
export type { OwnerSuspensionsView } from "./lib/get-owner-suspensions-view";

export { getOrgSuspensionsView } from "./lib/get-org-suspensions-view";
export type { OrgSuspensionsView } from "./lib/get-org-suspensions-view";

export type { SuspensionFilterChip } from "./lib/chips";
