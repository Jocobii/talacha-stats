-- =============================================================================
-- 0005_normalize_names
--
-- Convención de normalización de texto en TalachaStats:
--
--   APLICA a campos de texto ingresados por humanos que se usen en búsqueda
--   o matching (nombres de jugadores, equipos, ligas).
--
--   NO APLICA a enums controlados por el sistema (dayOfWeek, status, role),
--   campos técnicos (UUIDs, timestamps, emails), ni listas fijas (city, season).
--
-- Qué hace esta migración:
--   1. Habilitar las extensiones `unaccent` y `pg_trgm`
--   2. Crear función f_unaccent() IMMUTABLE indexable
--   3. Normalizar datos existentes a lowercase + trim + espacios colapsados
--   4. Crear índices GIN de trigramas para búsqueda fuzzy eficiente
--
-- Campos normalizados:
--   players.full_name, players.alias
--   teams.name
--   leagues.name
--
-- Por qué cada decisión:
--   - lowercase en BD:    matching sin preocuparse por mayúsculas
--   - unaccent:           "José" y "Jose" se tratan igual en búsquedas
--   - pg_trgm similarity: tolera typos ("martinez" encuentra "martines")
--   - f_unaccent IMMUTABLE en plpgsql: PostgreSQL no inlinea funciones plpgsql,
--     por lo que respeta la declaración IMMUTABLE sin intentar verificarla.
--     Esto es necesario para crear índices GIN funcionales sobre unaccent().
--   - SET search_path = public, extensions: Supabase instala las extensiones
--     en el schema `extensions`, no en `public`. Sin esto unaccent() no se
--     encuentra en runtime.
-- =============================================================================

-- 1. Extensiones ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint

-- 2. Función f_unaccent IMMUTABLE ----------------------------------------------
CREATE OR REPLACE FUNCTION f_unaccent(text)
RETURNS text AS $$
BEGIN
  RETURN unaccent($1);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE
   SET search_path = public, extensions, pg_catalog;
--> statement-breakpoint

-- 3. Normalizar datos existentes -----------------------------------------------

-- players: full_name y alias
UPDATE "players"
SET
  "full_name" = LOWER(TRIM(REGEXP_REPLACE("full_name", '\s+', ' ', 'g'))),
  "alias" = CASE
               WHEN "alias" IS NOT NULL AND TRIM("alias") <> ''
               THEN LOWER(TRIM(REGEXP_REPLACE("alias", '\s+', ' ', 'g')))
               ELSE "alias"
             END;
--> statement-breakpoint

-- teams: name
UPDATE "teams"
SET "name" = LOWER(TRIM(REGEXP_REPLACE("name", '\s+', ' ', 'g')));
--> statement-breakpoint

-- leagues: name
UPDATE "leagues"
SET "name" = LOWER(TRIM(REGEXP_REPLACE("name", '\s+', ' ', 'g')));
--> statement-breakpoint

-- 4. Índices GIN de trigramas --------------------------------------------------
-- Indexamos f_unaccent(campo) para que las búsquedas similarity() ignoren
-- acentos y usen el índice en lugar de hacer full table scan.

-- players
CREATE INDEX IF NOT EXISTS players_fullname_trgm_idx
  ON "players" USING GIN (f_unaccent("full_name") gin_trgm_ops);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS players_alias_trgm_idx
  ON "players" USING GIN (f_unaccent("alias") gin_trgm_ops);
--> statement-breakpoint

-- teams
CREATE INDEX IF NOT EXISTS teams_name_trgm_idx
  ON "teams" USING GIN (f_unaccent("name") gin_trgm_ops);
--> statement-breakpoint

-- leagues
CREATE INDEX IF NOT EXISTS leagues_name_trgm_idx
  ON "leagues" USING GIN (f_unaccent("name") gin_trgm_ops);
