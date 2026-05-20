-- T1.3: Índice único parcial para prevenir pares repetidos en fase regular (S4)
--
-- Drizzle no genera índices parciales con expresiones LEAST/GREATEST,
-- por eso este archivo es SQL custom y debe aplicarse manualmente después
-- de correr `pnpm drizzle-kit push` o junto a la migración principal.
--
-- Contexto: scheduling-plan.md §3.3

CREATE UNIQUE INDEX IF NOT EXISTS uq_regular_pair
  ON matches (
    league_id,
    LEAST(home_team_id, away_team_id),
    GREATEST(home_team_id, away_team_id)
  )
  WHERE
    is_makeup = false
    AND matchday_id IS NOT NULL
    AND matchday_id IN (
      SELECT id FROM matchdays WHERE phase = 'regular'
    );
