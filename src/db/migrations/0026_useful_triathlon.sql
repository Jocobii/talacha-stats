CREATE TABLE "match_player_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_registration_id" uuid NOT NULL,
	"team_side" text NOT NULL,
	"is_present" boolean DEFAULT false NOT NULL,
	"shirt_number" integer,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"blue_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_mps_team_side" CHECK ("match_player_stats"."team_side" IN ('home','away'))
);
--> statement-breakpoint
DROP VIEW "public"."player_global_stats";--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "home_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "home_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "away_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "away_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leagues" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "cedula" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "home_bonus_goals" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "away_bonus_goals" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "referee_observations" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "resolved_by" uuid;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_player_registration_id_player_registrations_id_fk" FOREIGN KEY ("player_registration_id") REFERENCES "public"."player_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_match_player" ON "match_player_stats" USING btree ("match_id","player_registration_id");--> statement-breakpoint
CREATE INDEX "idx_mps_match" ON "match_player_stats" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_mps_registration" ON "match_player_stats" USING btree ("player_registration_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_cedula_per_league" ON "matches" USING btree ("league_id","cedula");--> statement-breakpoint
CREATE INDEX "idx_matches_cedula" ON "matches" USING btree ("cedula");--> statement-breakpoint
CREATE VIEW "public"."player_global_stats" AS (select "players"."id", "players"."full_name", "players"."alias", COUNT(DISTINCT "player_profiles"."organization_id")::int as "organizations_count", COUNT(DISTINCT "player_registrations"."league_id")::int as "leagues_count", COALESCE(SUM("player_season_stats"."goals"), 0)::int as "total_goals", COALESCE(SUM("player_season_stats"."assists"), 0)::int as "total_assists", COALESCE(SUM("player_season_stats"."matches_played"), 0)::int as "total_matches_played", COALESCE(SUM("player_season_stats"."yellow_cards"), 0)::int as "total_yellow_cards", COALESCE(SUM("player_season_stats"."red_cards"), 0)::int as "total_red_cards", MAX("player_season_stats"."updated_at") as "last_updated_at" from "players" inner join "player_profiles" on "player_profiles"."claimed_player_id" = "players"."id" AND "player_profiles"."claim_status" = 'verified' left join "player_registrations" on "player_registrations"."player_profile_id" = "player_profiles"."id" left join "player_season_stats" on "player_season_stats"."player_profile_id" = "player_profiles"."id" group by "players"."id", "players"."full_name", "players"."alias");