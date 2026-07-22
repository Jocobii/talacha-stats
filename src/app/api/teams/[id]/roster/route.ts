// RETIRADO (docs/V1-REMOVAL-PLAN.md, Fase 3, jul 2026): POST escribía
// `playerRegistrations.legacyPlayerId` (FK puente V1) y GET usaba la relación
// `legacyPlayer`. Cero callers reales — el roster real V2 usa
// `/api/teams/[id]/members` y `/api/teams/[id]/roster/[memberId]` (y
// `/transfer`), rutas distintas que siguen vivas. Pendiente `git rm`.
export {};
