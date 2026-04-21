CREATE TABLE "player_season_stats_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"league_id" uuid NOT NULL,
	"team_id" uuid,
	"jornada" integer NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_player_league_jornada_snap" UNIQUE("player_id","league_id","jornada")
);
--> statement-breakpoint
ALTER TABLE "player_season_stats_snapshot" ADD CONSTRAINT "player_season_stats_snapshot_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats_snapshot" ADD CONSTRAINT "player_season_stats_snapshot_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats_snapshot" ADD CONSTRAINT "player_season_stats_snapshot_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "psss_player_idx" ON "player_season_stats_snapshot" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "psss_league_idx" ON "player_season_stats_snapshot" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "psss_jornada_idx" ON "player_season_stats_snapshot" USING btree ("jornada");