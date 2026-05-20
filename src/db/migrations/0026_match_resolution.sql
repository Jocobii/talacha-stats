-- ============================================================================
-- 0026_match_resolution.sql
-- Módulo de Resolución de Partidos
--
-- Cambios:
--   1. leagues: agrega columna `code` (texto corto para prefijo de cédula)
--   2. matches: nuevas columnas de resolución; homeScore/awayScore → nullable
--   3. match_player_stats: nueva tabla de estadísticas agregadas por partido
--   4. Backfill de leagues.code desde name_canonical
--   5. Backfill de matches.cedula con secuencial por liga
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. leagues.code
-- ----------------------------------------------------------------------------
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS code TEXT;

-- Índice único por (organization_id, code) — aplicado después del backfill
-- (ver paso 4 al final)

-- ----------------------------------------------------------------------------
-- 2. matches — nuevas columnas del módulo de resolución
-- ----------------------------------------------------------------------------

-- Cédula única por liga: "{LEAGUE_CODE}-{NNNN}"
ALTER TABLE matches ADD COLUMN IF NOT EXISTS cedula TEXT;

-- homeScore / awayScore: ya no tienen default NOT NULL (scheduled = null)
-- En PostgreSQL, cambiar NOT NULL a nullable con ALTER COLUMN
ALTER TABLE matches ALTER COLUMN home_score DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN home_score DROP DEFAULT;
ALTER TABLE matches ALTER COLUMN away_score DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN away_score DROP DEFAULT;

-- Poner en null los valores 0 existentes que son placeholder de "no capturado"
-- (solo para matches con status 'scheduled' que nunca fueron editados)
UPDATE matches
SET home_score = NULL, away_score = NULL
WHERE status = 'scheduled'
  AND home_score = 0
  AND away_score = 0
  AND notes IS NULL;

-- Goles de equipo no atribuibles a jugador (llegada tardía del rival, etc.)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_bonus_goals INTEGER NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_bonus_goals INTEGER NOT NULL DEFAULT 0;

-- Observaciones del árbitro
ALTER TABLE matches ADD COLUMN IF NOT EXISTS referee_observations TEXT;

-- Auditoría de resolución
ALTER TABLE matches ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Índices de cédula (aplicados después del backfill)
-- (ver paso 5 al final)

-- ----------------------------------------------------------------------------
-- 3. match_player_stats — nueva tabla
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_registration_id UUID NOT NULL REFERENCES player_registrations(id) ON DELETE CASCADE,
    team_side TEXT NOT NULL CHECK (team_side IN ('home', 'away')),
    is_present BOOLEAN NOT NULL DEFAULT FALSE,
    shirt_number INTEGER,
    goals INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    yellow_cards INTEGER NOT NULL DEFAULT 0,
    blue_cards INTEGER NOT NULL DEFAULT 0,
    red_cards INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_match_player
    ON match_player_stats (match_id, player_registration_id);

CREATE INDEX IF NOT EXISTS idx_mps_match
    ON match_player_stats (match_id);

CREATE INDEX IF NOT EXISTS idx_mps_registration
    ON match_player_stats (player_registration_id);

-- ----------------------------------------------------------------------------
-- 4. Backfill leagues.code
-- Genera código automático desde name_canonical eliminando stop words.
-- Formato: primeras letras de palabras significativas, 3-4 chars, mayúsculas.
-- Si hay colisión, agrega sufijo numérico (2, 3...).
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    league_row RECORD;
    raw_name TEXT;
    words TEXT[];
    stop_words TEXT[] := ARRAY['liga','futbol','soccer','la','el','los','las','de','del','y','en','fc','club'];
    filtered_words TEXT[];
    word TEXT;
    generated_code TEXT;
    suffix_n INT;
    final_code TEXT;
BEGIN
    FOR league_row IN
        SELECT id, name_canonical, organization_id
        FROM leagues
        WHERE code IS NULL
        ORDER BY created_at
    LOOP
        raw_name := COALESCE(league_row.name_canonical, '');

        -- Dividir en palabras
        words := string_to_array(raw_name, ' ');

        -- Filtrar stop words y palabras de 1 char
        filtered_words := ARRAY[]::TEXT[];
        FOREACH word IN ARRAY words LOOP
            IF length(word) > 1 AND NOT (word = ANY(stop_words)) THEN
                filtered_words := filtered_words || word;
            END IF;
        END LOOP;

        -- Generar código: si hay 2+ palabras, tomar inicial de cada una (max 4)
        IF array_length(filtered_words, 1) >= 2 THEN
            generated_code := '';
            FOREACH word IN ARRAY filtered_words[1:4] LOOP
                generated_code := generated_code || upper(left(word, 1));
            END LOOP;
        ELSIF array_length(filtered_words, 1) = 1 THEN
            generated_code := upper(left(filtered_words[1], 4));
        ELSE
            generated_code := upper(left(raw_name, 4));
        END IF;

        -- Limitar a 8 chars
        generated_code := left(generated_code, 8);

        -- Verificar unicidad por org, agregar sufijo si colisiona
        final_code := generated_code;
        suffix_n := 2;
        WHILE EXISTS (
            SELECT 1 FROM leagues
            WHERE organization_id = league_row.organization_id
              AND code = final_code
              AND id != league_row.id
        ) LOOP
            final_code := generated_code || suffix_n::TEXT;
            suffix_n := suffix_n + 1;
        END LOOP;

        UPDATE leagues SET code = final_code WHERE id = league_row.id;
    END LOOP;
END $$;

-- Índice único por (organization_id, code) — ahora que el backfill está hecho
CREATE UNIQUE INDEX IF NOT EXISTS uniq_league_code_per_org
    ON leagues (organization_id, code)
    WHERE code IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. Backfill matches.cedula
-- Asigna cédula secuencial a matches existentes usando el code de su liga.
-- Formato: "{LEAGUE_CODE}-{NNNN}" ordenado por created_at dentro de cada liga.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    match_row RECORD;
    league_code TEXT;
    seq_n INT;
    -- Mapa de contadores por liga (usando tabla temporal)
BEGIN
    -- Crear tabla temporal para el contador por liga
    CREATE TEMP TABLE _cedula_counter (
        league_id UUID PRIMARY KEY,
        counter INT DEFAULT 0
    ) ON COMMIT DROP;

    -- Inicializar contadores
    INSERT INTO _cedula_counter (league_id, counter)
    SELECT id, 0 FROM leagues;

    -- Iterar sobre todos los matches ordenados por liga + created_at
    FOR match_row IN
        SELECT m.id, m.league_id, m.created_at
        FROM matches m
        WHERE m.cedula IS NULL
        ORDER BY m.league_id, m.created_at
    LOOP
        -- Obtener code de la liga
        SELECT l.code INTO league_code
        FROM leagues l
        WHERE l.id = match_row.league_id;

        -- Obtener y actualizar contador
        UPDATE _cedula_counter
        SET counter = counter + 1
        WHERE league_id = match_row.league_id
        RETURNING counter INTO seq_n;

        -- Asignar cédula
        UPDATE matches
        SET cedula = league_code || '-' || lpad(seq_n::TEXT, 4, '0')
        WHERE id = match_row.id;
    END LOOP;
END $$;

-- Índices de cédula — después del backfill
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cedula_per_league
    ON matches (league_id, cedula)
    WHERE cedula IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_cedula
    ON matches (cedula)
    WHERE cedula IS NOT NULL;
