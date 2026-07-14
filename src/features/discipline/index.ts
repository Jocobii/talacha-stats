/**
 * features/discipline/index.ts
 * Exportaciones públicas. App/ y otras capas solo importan desde aquí.
 *
 * NOTA: manage-suspensions.ts, apply-card-discipline.ts,
 * decrement-suspensions.ts y sync-league-member-status.ts importan @/db y
 * son SOLO server — no se re-exportan aquí (mismo patrón que
 * features/tournament-rules/rules.ts). Server Components y API routes los
 * importan por ruta directa, ej. `@/features/discipline/manage-suspensions`.
 */

export { SuspensionsScreen } from "./ui/SuspensionsScreen";
export type { SuspensionsData } from "./model/useSuspensions";
export { GlobalSuspensionsScreen } from "./ui/GlobalSuspensionsScreen";
export type { AdminSuspensionsData } from "./model/useAdminSuspensions";
