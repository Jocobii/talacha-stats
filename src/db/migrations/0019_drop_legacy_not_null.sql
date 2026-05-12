-- ---------------------------------------------------------------------------
-- 0019_drop_legacy_not_null.sql
--
-- Baja NOT NULL de las columnas legacy_player_id en las tres tablas.
-- Esto debió ocurrir en 0013 pero pudo no haberse aplicado correctamente.
-- Sin esto, INSERT sin legacy_player_id viola el constraint y falla el import.
-- ---------------------------------------------------------------------------

ALTER TABLE player_season_stats   ALTER COLUMN legacy_player_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE player_registrations  ALTER COLUMN legacy_player_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE match_events          ALTER COLUMN legacy_player_id DROP NOT NULL;
