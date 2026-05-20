ALTER TABLE "global_players" ADD COLUMN "full_name_canonical" text;--> statement-breakpoint
ALTER TABLE "leagues" ADD COLUMN "name_canonical" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "name_canonical" text;--> statement-breakpoint
CREATE INDEX "global_players_name_canonical_idx" ON "global_players" USING btree ("full_name_canonical");--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "uq_teams_league_canonical" UNIQUE("league_id","name_canonical");