-- ---------------------------------------------------------------------------
-- 0018_ensure_profile_constraints.sql
--
-- Asegura que existan los constraints y columnas del pipeline player_profiles
-- que debieron haber sido creados por 0013/0014 pero pueden estar ausentes
-- dependiendo del orden en que se aplicaron las migraciones.
--
-- Idempotente: usa DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL END $$.
-- Seguro de correr aunque los objetos ya existan.
-- ---------------------------------------------------------------------------

-- ── player_season_stats ────────────────────────────────────────────────────

-- Bajar NOT NULL de legacy_player_id (la migración 0013 pudo no haber bajado el constraint)
ALTER TABLE player_season_stats ALTER COLUMN legacy_player_id DROP NOT NULL;
--> statement-breakpoint

-- Bajar NOT NULL de legacy_player_id en player_registrations también
ALTER TABLE player_registrations ALTER COLUMN legacy_player_id DROP NOT NULL;
--> statement-breakpoint

-- Bajar NOT NULL de legacy_player_id en match_events también
ALTER TABLE match_events ALTER COLUMN legacy_player_id DROP NOT NULL;
--> statement-breakpoint

-- Columna player_profile_id (puede no existir si 0013/0014 no se aplicaron bien)
DO $$ BEGIN
  ALTER TABLE player_season_stats ADD COLUMN player_profile_id uuid
    REFERENCES player_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint

-- Constraint UNIQUE (player_profile_id, league_id) — requerido por ON CONFLICT en upsertSeasonStats
DO $$ BEGIN
  ALTER TABLE player_season_stats
    ADD CONSTRAINT unique_profile_season UNIQUE (player_profile_id, league_id);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- ── player_registrations ──────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE player_registrations ADD COLUMN player_profile_id uuid
    REFERENCES player_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE player_registrations
    ADD CONSTRAINT unique_profile_per_league UNIQUE (player_profile_id, league_id);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- ── match_events ──────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE match_events ADD COLUMN player_profile_id uuid
    REFERENCES player_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint

-- ── player_season_stats_snapshot ─────────────────────────────────────────
-- Por si 0017 tampoco se aplicó correctamente.

DO $$ BEGIN
  ALTER TABLE player_season_stats_snapshot ALTER COLUMN player_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE player_season_stats_snapshot ADD COLUMN player_profile_id uuid
    REFERENCES player_profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE player_season_stats_snapshot
    ADD CONSTRAINT unique_profile_league_jornada_snap UNIQUE (player_profile_id, league_id, jornada);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS psss_profile_idx ON player_season_stats_snapshot (player_profile_id);
--> statement-breakpoint

-- ── Índices auxiliares ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS pss_profile_idx  ON player_season_stats  (player_profile_id);
CREATE INDEX IF NOT EXISTS pss_legacy_player_idx ON player_season_stats (legacy_player_id);
