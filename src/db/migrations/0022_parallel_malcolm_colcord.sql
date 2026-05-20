CREATE TABLE "league_scheduling_config" (
	"league_id" uuid PRIMARY KEY NOT NULL,
	"regular_matchdays" integer NOT NULL,
	"regular_format" text DEFAULT 'single' NOT NULL,
	"match_duration_minutes" integer DEFAULT 50 NOT NULL,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"allow_duplicate_matchups" boolean DEFAULT false NOT NULL,
	"last_seed" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_venues" (
	"league_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "uq_league_venue" UNIQUE("league_id","venue_id")
);
--> statement-breakpoint
CREATE TABLE "makeup_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"original_matchday_number" integer,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_schedule_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"changed_by" uuid,
	"change_type" text NOT NULL,
	"previous_value" jsonb NOT NULL,
	"new_value" jsonb NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchdays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"phase" text DEFAULT 'regular' NOT NULL,
	"scheduled_date" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_matchday_league_number" UNIQUE("league_id","number"),
	CONSTRAINT "chk_matchday_phase" CHECK ("matchdays"."phase" IN ('regular','playoff')),
	CONSTRAINT "chk_matchday_status" CHECK ("matchdays"."status" IN ('draft','published','in_progress','completed'))
);
--> statement-breakpoint
CREATE TABLE "team_purchased_timeslots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"league_id" uuid NOT NULL,
	"start_time" text NOT NULL,
	"venue_id" uuid,
	"active_from_date" date NOT NULL,
	"end_matchday_number" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_team_purchased" UNIQUE("team_id","league_id")
);
--> statement-breakpoint
CREATE TABLE "team_rest_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"league_id" uuid NOT NULL,
	"matchday_number" integer NOT NULL,
	"reason" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_team_rest" UNIQUE("team_id","league_id","matchday_number")
);
--> statement-breakpoint
CREATE TABLE "venue_time_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"day_of_week" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_canonical" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"city" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_venues_org_canonical" UNIQUE("organization_id","name_canonical")
);
--> statement-breakpoint
ALTER TABLE "leagues" ADD COLUMN "scheduling_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "matchday_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "venue_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "kickoff_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "is_makeup" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "league_scheduling_config" ADD CONSTRAINT "league_scheduling_config_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_venues" ADD CONSTRAINT "league_venues_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_venues" ADD CONSTRAINT "league_venues_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_matches" ADD CONSTRAINT "makeup_matches_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_matches" ADD CONSTRAINT "makeup_matches_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_schedule_overrides" ADD CONSTRAINT "match_schedule_overrides_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_schedule_overrides" ADD CONSTRAINT "match_schedule_overrides_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchdays" ADD CONSTRAINT "matchdays_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_purchased_timeslots" ADD CONSTRAINT "team_purchased_timeslots_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_purchased_timeslots" ADD CONSTRAINT "team_purchased_timeslots_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_purchased_timeslots" ADD CONSTRAINT "team_purchased_timeslots_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_rest_requests" ADD CONSTRAINT "team_rest_requests_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_rest_requests" ADD CONSTRAINT "team_rest_requests_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_time_windows" ADD CONSTRAINT "venue_time_windows_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_time_windows" ADD CONSTRAINT "venue_time_windows_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mm_team_idx" ON "makeup_matches" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "mm_match_idx" ON "makeup_matches" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "mso_match_idx" ON "match_schedule_overrides" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "mso_changed_by_idx" ON "match_schedule_overrides" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "matchdays_league_idx" ON "matchdays" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "tpt_team_idx" ON "team_purchased_timeslots" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "tpt_league_idx" ON "team_purchased_timeslots" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "trr_league_matchday_idx" ON "team_rest_requests" USING btree ("league_id","matchday_number");--> statement-breakpoint
CREATE INDEX "vtw_league_idx" ON "venue_time_windows" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "vtw_venue_idx" ON "venue_time_windows" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "venues_org_idx" ON "venues" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_matchday_id_matchdays_id_fk" FOREIGN KEY ("matchday_id") REFERENCES "public"."matchdays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matches_matchday_idx" ON "matches" USING btree ("matchday_id");--> statement-breakpoint
CREATE INDEX "matches_venue_idx" ON "matches" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "matches_kickoff_idx" ON "matches" USING btree ("kickoff_at");