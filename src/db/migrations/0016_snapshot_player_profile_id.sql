-- ---------------------------------------------------------------------------
-- 0016_snapshot_player_profile_id.sql
--
-- Extiende player_season_stats_snapshot para soportar el nuevo pipeline
-- basado en player_profiles (Historia 03).
--
-- Cambios:
--   1. player_id pasa a nullable (antes era NOT NULL FK a players)
--      → Las filas del pipeline legacy conservan su player_id.
--      → Las filas del nuevo pipeline tendrán player_id = NULL.
--   2. Se agrega player_profile_id (nullable FK a player_profiles).
--   3. Se agrega UNIQUE (player_profile_id, league_id, jornada) para upserts
--      del nuevo pipeline.
--   4. Se agrega índice en player_profile_id.
-- ---------------------------------------------------------------------------

-- 1. Quitar NOT NULL de player_id
ALTER TABLE "player_season_stats_snapshot"
  ALTER COLUMN "player_id" DROP NOT NULL;
--> statement-breakpoint

-- 2. Agregar FK a player_profiles
ALTER TABLE "player_season_stats_snapshot"
  ADD COLUMN "player_profile_id" uuid
  REFERENCES "public"."player_profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint

-- 3. Unique constraint para upserts del nuevo pipeline
ALTER TABLE "player_season_stats_snapshot"
  ADD CONSTRAINT "unique_profile_league_jornada_snap"
  UNIQUE ("player_profile_id", "league_id", "jornada");
--> statement-breakpoint

-- 4. Índice
CREATE INDEX "psss_profile_idx"
  ON "player_season_stats_snapshot" ("player_profile_id");
