CREATE TABLE "playoff_brackets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"zone_name" text NOT NULL,
	"zone_color" text DEFAULT 'green' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_bracket_zone" UNIQUE("league_id","zone_id")
);
--> statement-breakpoint
CREATE TABLE "playoff_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bracket_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"slot_index" integer NOT NULL,
	"is_third_place" boolean DEFAULT false NOT NULL,
	"is_bye" boolean DEFAULT false NOT NULL,
	"home_team_id" uuid,
	"away_team_id" uuid,
	"home_from_slot_id" uuid,
	"home_from_type" text,
	"away_from_slot_id" uuid,
	"away_from_type" text,
	"winner_id" uuid,
	"loser_id" uuid,
	"match_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_slot_bracket_round_index" UNIQUE("bracket_id","round","slot_index")
);
--> statement-breakpoint
ALTER TABLE "playoff_brackets" ADD CONSTRAINT "playoff_brackets_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_brackets" ADD CONSTRAINT "playoff_brackets_zone_id_league_playoff_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."league_playoff_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_slots" ADD CONSTRAINT "playoff_slots_bracket_id_playoff_brackets_id_fk" FOREIGN KEY ("bracket_id") REFERENCES "public"."playoff_brackets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_slots" ADD CONSTRAINT "playoff_slots_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_slots" ADD CONSTRAINT "playoff_slots_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_slots" ADD CONSTRAINT "playoff_slots_home_from_slot_id_playoff_slots_id_fk" FOREIGN KEY ("home_from_slot_id") REFERENCES "public"."playoff_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_slots" ADD CONSTRAINT "playoff_slots_away_from_slot_id_playoff_slots_id_fk" FOREIGN KEY ("away_from_slot_id") REFERENCES "public"."playoff_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_slots" ADD CONSTRAINT "playoff_slots_winner_id_teams_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_slots" ADD CONSTRAINT "playoff_slots_loser_id_teams_id_fk" FOREIGN KEY ("loser_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_slots" ADD CONSTRAINT "playoff_slots_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "playoff_brackets_league_idx" ON "playoff_brackets" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "playoff_slots_bracket_idx" ON "playoff_slots" USING btree ("bracket_id");