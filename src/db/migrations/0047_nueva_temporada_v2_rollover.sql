ALTER TABLE "leagues" ADD COLUMN "registration_cutoff_matchday" integer;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "source_team_id" uuid;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "joined_at_matchday" integer;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_source_team_id_teams_id_fk" FOREIGN KEY ("source_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teams_source_team_idx" ON "teams" USING btree ("source_team_id");--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "chk_teams_status" CHECK ("teams"."status" IN ('active','pending','disbanded'));