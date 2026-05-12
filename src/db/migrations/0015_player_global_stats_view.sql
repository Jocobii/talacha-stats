-- Historia 05: Vista player_global_stats
--
-- Agrega las estadísticas de un jugador a través de todos sus player_profiles
-- con claim_status = 'verified'. Perfiles unclaimed, proposed y rejected
-- quedan EXCLUIDOS explícitamente.
--
-- Nota de diseño:
--   Vista REGULAR (no materializada) para MVP.
--   Si el volumen crece, migrar a MATERIALIZED VIEW con REFRESH ON DEMAND.
--   Deuda técnica documentada: ver PR de Historia 05.
--
-- Índice de soporte para acelerar el JOIN por claim_status:
--   idx_player_profiles_claimed_verified — ya existe idx_player_profiles_claimed
--   Agregamos índice compuesto (claimed_player_id, claim_status) para el filtro.

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pp_claimed_verified"
  ON "player_profiles" ("claimed_player_id", "claim_status");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pss_profile_goals"
  ON "player_season_stats" ("player_profile_id", "goals" DESC);

--> statement-breakpoint
CREATE OR REPLACE VIEW "player_global_stats" AS
SELECT
  p.id                                                AS player_id,
  p.full_name                                         AS full_name,
  p.alias                                             AS alias,
  COUNT(DISTINCT pp.organization_id)::int             AS organizations_count,
  COUNT(DISTINCT pr.league_id)::int                   AS leagues_count,
  COALESCE(SUM(pss.goals), 0)::int                   AS total_goals,
  COALESCE(SUM(pss.assists), 0)::int                 AS total_assists,
  COALESCE(SUM(pss.matches_played), 0)::int          AS total_matches_played,
  COALESCE(SUM(pss.yellow_cards), 0)::int            AS total_yellow_cards,
  COALESCE(SUM(pss.red_cards), 0)::int               AS total_red_cards,
  MAX(pss.updated_at)                                 AS last_updated_at
FROM players p
JOIN player_profiles pp
  ON  pp.claimed_player_id = p.id
  AND pp.claim_status = 'verified'
LEFT JOIN player_registrations pr
  ON  pr.player_profile_id = pp.id
LEFT JOIN player_season_stats pss
  ON  pss.player_profile_id = pp.id
GROUP BY
  p.id,
  p.full_name,
  p.alias;
