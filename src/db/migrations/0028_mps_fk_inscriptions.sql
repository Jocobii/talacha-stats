-- Migration: 0028_mps_fk_inscriptions
-- Cambia la FK de match_player_stats.player_registration_id
-- de player_registrations(id) → inscriptions(id)
--
-- Nombre real del constraint en Postgres (truncado a 63 chars):
-- match_player_stats_player_registration_id_player_registrations_

ALTER TABLE "public"."match_player_stats"
  DROP CONSTRAINT IF EXISTS "match_player_stats_player_registration_id_player_registrations_";--> statement-breakpoint

ALTER TABLE "public"."match_player_stats"
  ADD CONSTRAINT "match_player_stats_player_registration_id_inscriptions_id_fk"
  FOREIGN KEY ("player_registration_id")
  REFERENCES "public"."inscriptions"("id")
  ON DELETE CASCADE;
