ALTER TABLE "match_events" ADD COLUMN "global_player_id" uuid;--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "league_member_id" uuid;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD COLUMN "global_player_id" uuid;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD COLUMN "league_member_id" uuid;--> statement-breakpoint
ALTER TABLE "player_season_stats_snapshot" ADD COLUMN "global_player_id" uuid;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_global_player_id_global_players_id_fk" FOREIGN KEY ("global_player_id") REFERENCES "public"."global_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_league_member_id_league_members_id_fk" FOREIGN KEY ("league_member_id") REFERENCES "public"."league_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_global_player_id_global_players_id_fk" FOREIGN KEY ("global_player_id") REFERENCES "public"."global_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_league_member_id_league_members_id_fk" FOREIGN KEY ("league_member_id") REFERENCES "public"."league_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats_snapshot" ADD CONSTRAINT "player_season_stats_snapshot_global_player_id_global_players_id_fk" FOREIGN KEY ("global_player_id") REFERENCES "public"."global_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_global_player_idx" ON "match_events" USING btree ("global_player_id");--> statement-breakpoint
CREATE INDEX "events_league_member_idx" ON "match_events" USING btree ("league_member_id");--> statement-breakpoint
CREATE INDEX "pss_global_player_idx" ON "player_season_stats" USING btree ("global_player_id");--> statement-breakpoint
CREATE INDEX "pss_league_member_idx" ON "player_season_stats" USING btree ("league_member_id");--> statement-breakpoint
CREATE INDEX "psss_global_player_idx" ON "player_season_stats_snapshot" USING btree ("global_player_id");