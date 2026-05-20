-- Migration: 0029_league_playoff_zones
-- Creates the league_playoff_zones table for configurable classification zones
-- (Liguilla, Copa, Recopa, Descenso, etc.) shown in public and admin standings.

CREATE TABLE IF NOT EXISTS "league_playoff_zones" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id"     UUID NOT NULL REFERENCES "leagues"("id") ON DELETE CASCADE,
  "name"          TEXT NOT NULL,
  "from_position" INTEGER NOT NULL,
  "to_position"   INTEGER NOT NULL,
  "color"         TEXT NOT NULL DEFAULT 'green',
  "order"         INTEGER NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "league_playoff_zones_league_idx"
  ON "league_playoff_zones"("league_id");
