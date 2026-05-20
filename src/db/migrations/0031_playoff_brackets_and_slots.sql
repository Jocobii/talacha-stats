-- Migration: 0031_playoff_brackets_and_slots
-- Playoff brackets (one per zone) and slots (bracket casillas).
-- Uses self-referential FK on playoff_slots for round propagation.

CREATE TABLE IF NOT EXISTS "playoff_brackets" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id"  UUID NOT NULL REFERENCES "leagues"("id") ON DELETE CASCADE,
  "zone_id"    UUID NOT NULL REFERENCES "league_playoff_zones"("id") ON DELETE CASCADE,
  "zone_name"  TEXT NOT NULL,
  "zone_color" TEXT NOT NULL DEFAULT 'green',
  "status"     TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "uq_bracket_zone" UNIQUE ("league_id", "zone_id")
);

CREATE INDEX IF NOT EXISTS "playoff_brackets_league_idx"
  ON "playoff_brackets"("league_id");

CREATE TABLE IF NOT EXISTS "playoff_slots" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "bracket_id"       UUID NOT NULL REFERENCES "playoff_brackets"("id") ON DELETE CASCADE,
  "round"            INTEGER NOT NULL,
  "slot_index"       INTEGER NOT NULL,
  "is_third_place"   BOOLEAN NOT NULL DEFAULT false,
  "is_bye"           BOOLEAN NOT NULL DEFAULT false,
  "home_team_id"     UUID REFERENCES "teams"("id") ON DELETE SET NULL,
  "away_team_id"     UUID REFERENCES "teams"("id") ON DELETE SET NULL,
  "home_from_slot_id" UUID REFERENCES "playoff_slots"("id") ON DELETE SET NULL,
  "home_from_type"   TEXT,
  "away_from_slot_id" UUID REFERENCES "playoff_slots"("id") ON DELETE SET NULL,
  "away_from_type"   TEXT,
  "winner_id"        UUID REFERENCES "teams"("id") ON DELETE SET NULL,
  "loser_id"         UUID REFERENCES "teams"("id") ON DELETE SET NULL,
  "match_id"         UUID REFERENCES "matches"("id") ON DELETE SET NULL,
  "created_at"       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "uq_slot_bracket_round_index" UNIQUE ("bracket_id", "round", "slot_index")
);

CREATE INDEX IF NOT EXISTS "playoff_slots_bracket_idx"
  ON "playoff_slots"("bracket_id");
