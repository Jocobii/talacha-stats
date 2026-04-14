-- =============================================================================
-- VISTAS SQL para estadísticas
-- Ejecutar en Supabase después de correr las migraciones Drizzle
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Stats por jugador por liga
-- Fuente: match_events + player_registrations + matches
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW player_league_stats AS
SELECT
  p.id                                                          AS player_id,
  p.full_name,
  p.alias,
  l.id                                                          AS league_id,
  l.name                                                        AS league_name,
  l.season,
  t.id                                                          AS team_id,
  t.name                                                        AS team_name,
  COUNT(DISTINCT me.match_id) FILTER (
    WHERE me.id IS NOT NULL
  )                                                             AS matches_played,
  COUNT(me.id) FILTER (WHERE me.event_type = 'goal')            AS goals,
  COUNT(me.id) FILTER (WHERE me.event_type = 'assist')          AS assists,
  COUNT(me.id) FILTER (WHERE me.event_type = 'yellow_card')     AS yellow_cards,
  COUNT(me.id) FILTER (WHERE me.event_type = 'red_card')        AS red_cards,
  COUNT(me.id) FILTER (WHERE me.event_type = 'own_goal')        AS own_goals,
  COUNT(me.id) FILTER (WHERE me.event_type = 'mvp')             AS mvp_count
FROM players p
JOIN player_registrations pr ON pr.player_id = p.id
JOIN leagues l ON l.id = pr.league_id
JOIN teams t ON t.id = pr.team_id
LEFT JOIN match_events me
  ON me.player_id = p.id
  AND me.match_id IN (
    SELECT id FROM matches
    WHERE league_id = l.id AND status = 'completed'
  )
GROUP BY p.id, p.full_name, p.alias, l.id, l.name, l.season, t.id, t.name;

-- -----------------------------------------------------------------------------
-- 2. Stats globales del jugador (suma de todas las ligas)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW player_global_stats AS
SELECT
  player_id,
  full_name,
  alias,
  SUM(matches_played)  AS total_matches,
  SUM(goals)           AS total_goals,
  SUM(assists)         AS total_assists,
  SUM(yellow_cards)    AS total_yellow_cards,
  SUM(red_cards)       AS total_red_cards,
  SUM(own_goals)       AS total_own_goals,
  SUM(mvp_count)       AS total_mvp,
  COUNT(DISTINCT league_id) AS leagues_count
FROM player_league_stats
GROUP BY player_id, full_name, alias;

-- -----------------------------------------------------------------------------
-- 3. Tabla de posiciones por liga
-- 3 pts victoria, 1 empate, 0 derrota
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW league_standings AS
SELECT
  t.id                                                          AS team_id,
  t.name                                                        AS team_name,
  l.id                                                          AS league_id,
  l.name                                                        AS league_name,
  l.season,

  COUNT(m.id) FILTER (
    WHERE m.status = 'completed'
  )                                                             AS played,

  COUNT(m.id) FILTER (
    WHERE m.status = 'completed'
    AND (
      (m.home_team_id = t.id AND m.home_score > m.away_score)
      OR
      (m.away_team_id = t.id AND m.away_score > m.home_score)
    )
  )                                                             AS wins,

  COUNT(m.id) FILTER (
    WHERE m.status = 'completed'
    AND m.home_score = m.away_score
  )                                                             AS draws,

  COUNT(m.id) FILTER (
    WHERE m.status = 'completed'
    AND (
      (m.home_team_id = t.id AND m.home_score < m.away_score)
      OR
      (m.away_team_id = t.id AND m.away_score < m.home_score)
    )
  )                                                             AS losses,

  -- Goles a favor
  COALESCE(SUM(
    CASE
      WHEN m.home_team_id = t.id AND m.status = 'completed' THEN m.home_score
      WHEN m.away_team_id = t.id AND m.status = 'completed' THEN m.away_score
      ELSE 0
    END
  ), 0)                                                         AS goals_for,

  -- Goles en contra
  COALESCE(SUM(
    CASE
      WHEN m.home_team_id = t.id AND m.status = 'completed' THEN m.away_score
      WHEN m.away_team_id = t.id AND m.status = 'completed' THEN m.home_score
      ELSE 0
    END
  ), 0)                                                         AS goals_against,

  -- Puntos: 3 x victoria + 1 x empate
  (
    COUNT(m.id) FILTER (
      WHERE m.status = 'completed'
      AND (
        (m.home_team_id = t.id AND m.home_score > m.away_score)
        OR
        (m.away_team_id = t.id AND m.away_score > m.home_score)
      )
    ) * 3
    +
    COUNT(m.id) FILTER (
      WHERE m.status = 'completed' AND m.home_score = m.away_score
    )
  )                                                             AS points

FROM teams t
JOIN leagues l ON l.id = t.league_id
LEFT JOIN matches m
  ON (m.home_team_id = t.id OR m.away_team_id = t.id)
  AND m.league_id = l.id
GROUP BY t.id, t.name, l.id, l.name, l.season;

-- -----------------------------------------------------------------------------
-- 4. Top goleadores por liga (útil para narrador y tabla de stats)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW league_top_scorers AS
SELECT
  league_id,
  league_name,
  season,
  team_id,
  team_name,
  player_id,
  full_name,
  alias,
  goals,
  assists,
  matches_played,
  ROUND(goals::numeric / NULLIF(matches_played, 0), 2) AS goals_per_match
FROM player_league_stats
WHERE goals > 0
ORDER BY goals DESC;
