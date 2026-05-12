-- ---------------------------------------------------------------------------
-- 0013_player_profiles.sql
-- Historia 02: Introduce la tabla player_profiles (identidad local por org).
--
-- Modelo de dos capas:
--   players          → identidad global en la plataforma (sin cambios)
--   player_profiles  → identidad local dentro de una organización (nueva)
--
-- Las tres tablas que apuntaban a players.player_id ahora apuntan a
-- player_profiles.player_profile_id (nueva columna). La columna original
-- se renombra a legacy_player_id y se hace nullable para preservar datos
-- durante la transición. El backfill se ejecuta por separado.
--
-- Cambios:
--   1. CREATE TABLE player_profiles
--   2. player_registrations: rename + nullable + add profile FK + constraints
--   3. match_events:         rename + nullable + add profile FK + indexes
--   4. player_season_stats:  rename + nullable + add profile FK + constraints
-- ---------------------------------------------------------------------------

-- ── 1. Tabla player_profiles ──────────────────────────────────────────────

CREATE TABLE "player_profiles" (
  "id"                uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id"   uuid        NOT NULL
    REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  "full_name"         text        NOT NULL,
  "alias"             text,
  "normalized_name"   text        NOT NULL,
  "fingerprint"       text        NOT NULL,
  "claimed_player_id" uuid
    REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
  "claim_status"      text        NOT NULL DEFAULT 'unclaimed',
  "created_at"        timestamptz NOT NULL DEFAULT NOW(),
  "updated_at"        timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "uq_player_profile_org_name"  UNIQUE ("organization_id", "normalized_name"),
  CONSTRAINT "chk_claim_status" CHECK (claim_status IN ('unclaimed','proposed','verified','rejected'))
);
--> statement-breakpoint
CREATE INDEX "idx_player_profiles_org"        ON "player_profiles" ("organization_id");
--> statement-breakpoint
CREATE INDEX "idx_player_profiles_claimed"    ON "player_profiles" ("claimed_player_id");
--> statement-breakpoint
CREATE INDEX "idx_player_profiles_normalized" ON "player_profiles" ("normalized_name");

-- ── 2. player_registrations ───────────────────────────────────────────────
-- Rename player_id → legacy_player_id, drop NOT NULL, change FK to SET NULL.
-- Add player_profile_id as new nullable FK.
-- Replace UNIQUE unique_player_per_league with unique_profile_per_league.
-- Replace old index with two new ones.

--> statement-breakpoint
DROP INDEX "registrations_player_idx";
--> statement-breakpoint
ALTER TABLE "player_registrations"
  DROP CONSTRAINT "unique_player_per_league";
--> statement-breakpoint
ALTER TABLE "player_registrations"
  DROP CONSTRAINT "player_registrations_player_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "player_registrations"
  RENAME COLUMN "player_id" TO "legacy_player_id";
--> statement-breakpoint
ALTER TABLE "player_registrations"
  ALTER COLUMN "legacy_player_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "player_registrations"
  ADD CONSTRAINT "player_registrations_legacy_player_id_players_id_fk"
  FOREIGN KEY ("legacy_player_id") REFERENCES "public"."players"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "player_registrations"
  ADD COLUMN "player_profile_id" uuid
  REFERENCES "public"."player_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "player_registrations"
  ADD CONSTRAINT "unique_profile_per_league" UNIQUE ("player_profile_id", "league_id");
--> statement-breakpoint
CREATE INDEX "registrations_profile_idx"        ON "player_registrations" ("player_profile_id");
--> statement-breakpoint
CREATE INDEX "registrations_legacy_player_idx"  ON "player_registrations" ("legacy_player_id");

-- ── 3. match_events ───────────────────────────────────────────────────────
-- Rename player_id → legacy_player_id, drop NOT NULL, change FK to SET NULL.
-- Add player_profile_id as new nullable FK.
-- Replace old index with two new ones.

--> statement-breakpoint
DROP INDEX "events_player_idx";
--> statement-breakpoint
ALTER TABLE "match_events"
  DROP CONSTRAINT "match_events_player_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "match_events"
  RENAME COLUMN "player_id" TO "legacy_player_id";
--> statement-breakpoint
ALTER TABLE "match_events"
  ALTER COLUMN "legacy_player_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "match_events"
  ADD CONSTRAINT "match_events_legacy_player_id_players_id_fk"
  FOREIGN KEY ("legacy_player_id") REFERENCES "public"."players"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "match_events"
  ADD COLUMN "player_profile_id" uuid
  REFERENCES "public"."player_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX "events_profile_idx"        ON "match_events" ("player_profile_id");
--> statement-breakpoint
CREATE INDEX "events_legacy_player_idx"  ON "match_events" ("legacy_player_id");

-- ── 4. player_season_stats ────────────────────────────────────────────────
-- Rename player_id → legacy_player_id, drop NOT NULL, change FK to SET NULL.
-- Add player_profile_id as new nullable FK.
-- Replace UNIQUE unique_player_season with unique_profile_season.
-- Replace old index with two new ones.

--> statement-breakpoint
DROP INDEX "pss_player_idx";
--> statement-breakpoint
ALTER TABLE "player_season_stats"
  DROP CONSTRAINT "unique_player_season";
--> statement-breakpoint
ALTER TABLE "player_season_stats"
  DROP CONSTRAINT "player_season_stats_player_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "player_season_stats"
  RENAME COLUMN "player_id" TO "legacy_player_id";
--> statement-breakpoint
ALTER TABLE "player_season_stats"
  ALTER COLUMN "legacy_player_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "player_season_stats"
  ADD CONSTRAINT "player_season_stats_legacy_player_id_players_id_fk"
  FOREIGN KEY ("legacy_player_id") REFERENCES "public"."players"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "player_season_stats"
  ADD COLUMN "player_profile_id" uuid
  REFERENCES "public"."player_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "player_season_stats"
  ADD CONSTRAINT "unique_profile_season" UNIQUE ("player_profile_id", "league_id");
--> statement-breakpoint
CREATE INDEX "pss_profile_idx"        ON "player_season_stats" ("player_profile_id");
--> statement-breakpoint
CREATE INDEX "pss_legacy_player_idx"  ON "player_season_stats" ("legacy_player_id");
