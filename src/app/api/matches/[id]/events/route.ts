// RETIRADO (docs/V1-REMOVAL-PLAN.md, Fase 3, jul 2026): POST escribía
// `matchEvents.legacyPlayerId` (FK puente V1) y GET usaba la relación
// `legacyPlayer`. Cero callers reales — `match_events` no tiene flujo V2 vivo
// (D3: se dropea completa en Fase 4). Pendiente `git rm`.
export {};
