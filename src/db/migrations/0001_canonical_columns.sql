-- ============================================================================
-- Migración 0001: columnas canonical para global_players, leagues y teams
--
-- Propósito: implementar el patrón "dos columnas" (display + canonical) para
-- prevenir duplicados y garantizar GROUP BY / filtros robustos.
--
-- Estrategia de despliegue:
--   1. Las columnas se agregan como nullable para no bloquear la aplicación.
--   2. Se hace backfill con una normalización básica en SQL (lower + trim +
--      colapso de espacios). El backfill exacto con preservación de Ñ y
--      eliminación de puntuación se delega a la aplicación (sanitizeToCanonical)
--      en inserciones y actualizaciones futuras.
--   3. El índice UNIQUE en teams se crea AFTER el backfill para evitar falsos
--      positivos en datos históricos (si los hubiera).
--
-- Para aplicar: npx drizzle-kit migrate
-- ============================================================================

-- 1. global_players.full_name_canonical
ALTER TABLE global_players
  ADD COLUMN IF NOT EXISTS full_name_canonical text;

UPDATE global_players
SET full_name_canonical = lower(trim(regexp_replace(full_name, '\s+', ' ', 'g')))
WHERE full_name_canonical IS NULL;

CREATE INDEX IF NOT EXISTS global_players_name_canonical_idx
  ON global_players (full_name_canonical);

-- 2. leagues.name_canonical
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS name_canonical text;

UPDATE leagues
SET name_canonical = lower(trim(regexp_replace(name, '\s+', ' ', 'g')))
WHERE name_canonical IS NULL;

-- 3. teams.name_canonical
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS name_canonical text;

UPDATE teams
SET name_canonical = lower(trim(regexp_replace(name, '\s+', ' ', 'g')))
WHERE name_canonical IS NULL;

-- Índice único: un mismo nombre canónico no puede aparecer dos veces en la
-- misma liga. Si el backfill revela duplicados preexistentes, el DBA debe
-- resolverlos antes de crear este constraint.
CREATE UNIQUE INDEX IF NOT EXISTS uq_teams_league_canonical
  ON teams (league_id, name_canonical);
