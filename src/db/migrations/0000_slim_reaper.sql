CREATE TABLE "global_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curp_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"full_name_canonical" text,
	"birth_date" date NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "global_players_curp_hash_unique" UNIQUE("curp_hash")
);
--> statement-breakpoint
CREATE TABLE "import_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"imported_by" uuid,
	"import_type" text NOT NULL,
	"jornada" integer,
	"rows_processed" integer DEFAULT 0 NOT NULL,
	"rows_created" integer DEFAULT 0 NOT NULL,
	"anomaly_summary" jsonb,
	"warnings" text[],
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"header_row" integer DEFAULT 0 NOT NULL,
	"column_map" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_member_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inscription_member" UNIQUE("league_member_id")
);
--> statement-breakpoint
CREATE TABLE "league_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"global_player_id" uuid NOT NULL,
	"league_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"dorsal" integer,
	"inscription_date" date NOT NULL,
	"institution_photo_url" text,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_league_member" UNIQUE("global_player_id","league_id"),
	CONSTRAINT "chk_league_member_status" CHECK ("league_members"."status" IN ('active','suspended','inactive')),
	CONSTRAINT "chk_dorsal_range" CHECK ("league_members"."dorsal" IS NULL OR ("league_members"."dorsal" >= 1 AND "league_members"."dorsal" <= 99))
);
--> statement-breakpoint
CREATE TABLE "league_playoff_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"name" text NOT NULL,
	"from_position" integer NOT NULL,
	"to_position" integer NOT NULL,
	"color" text DEFAULT 'green' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_scheduling_config" (
	"league_id" uuid PRIMARY KEY NOT NULL,
	"regular_matchdays" integer NOT NULL,
	"regular_format" text DEFAULT 'single' NOT NULL,
	"match_duration_minutes" integer DEFAULT 50 NOT NULL,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"allow_duplicate_matchups" boolean DEFAULT false NOT NULL,
	"no_repeat_within" integer DEFAULT 3 NOT NULL,
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
CREATE TABLE "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_canonical" text,
	"slug" text,
	"category" text,
	"day_of_week" text NOT NULL,
	"season" text NOT NULL,
	"city" text DEFAULT 'Tijuana' NOT NULL,
	"organization_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"scheduling_enabled" boolean DEFAULT false NOT NULL,
	"code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "match_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"global_player_id" uuid,
	"league_member_id" uuid,
	"player_profile_id" uuid,
	"legacy_player_id" uuid,
	"team_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"minute" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"home_team_id" uuid NOT NULL,
	"away_team_id" uuid NOT NULL,
	"match_date" date NOT NULL,
	"matchday" integer,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"notes" text,
	"matchday_id" uuid,
	"venue_id" uuid,
	"kickoff_at" timestamp with time zone,
	"is_makeup" boolean DEFAULT false NOT NULL,
	"cedula" text,
	"home_bonus_goals" integer DEFAULT 0 NOT NULL,
	"away_bonus_goals" integer DEFAULT 0 NOT NULL,
	"referee_observations" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"city" text DEFAULT 'Tijuana' NOT NULL,
	"status" text DEFAULT 'trial' NOT NULL,
	"verification_requested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" uuid NOT NULL,
	"page" text NOT NULL,
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"alias" text,
	"normalized_name" text NOT NULL,
	"fingerprint" text NOT NULL,
	"claimed_player_id" uuid,
	"claim_status" text DEFAULT 'unclaimed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_player_profile_org_name" UNIQUE("organization_id","normalized_name"),
	CONSTRAINT "chk_claim_status" CHECK ("player_profiles"."claim_status" IN ('unclaimed','proposed','verified','rejected'))
);
--> statement-breakpoint
CREATE TABLE "player_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_profile_id" uuid,
	"legacy_player_id" uuid,
	"team_id" uuid NOT NULL,
	"league_id" uuid NOT NULL,
	"jersey_number" integer,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_profile_per_league" UNIQUE("player_profile_id","league_id")
);
--> statement-breakpoint
CREATE TABLE "player_season_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"global_player_id" uuid,
	"league_member_id" uuid,
	"player_profile_id" uuid,
	"legacy_player_id" uuid,
	"league_id" uuid NOT NULL,
	"team_id" uuid,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"jornada" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_profile_season" UNIQUE("player_profile_id","league_id")
);
--> statement-breakpoint
CREATE TABLE "player_season_stats_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"global_player_id" uuid,
	"player_id" uuid,
	"player_profile_id" uuid,
	"league_id" uuid NOT NULL,
	"team_id" uuid,
	"jornada" integer NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_player_league_jornada_snap" UNIQUE("player_id","league_id","jornada"),
	CONSTRAINT "unique_profile_league_jornada_snap" UNIQUE("player_profile_id","league_id","jornada")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"alias" text,
	"phone" text,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "team_standings_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"league_id" uuid NOT NULL,
	"jornada" integer NOT NULL,
	"played" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"draws" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"goals_for" integer DEFAULT 0 NOT NULL,
	"goals_against" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"zone" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_team_jornada" UNIQUE("team_id","league_id","jornada")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_canonical" text,
	"league_id" uuid NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_teams_league_canonical" UNIQUE("league_id","name_canonical")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'organizer' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"organization_id" uuid,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" text,
	"email_verification_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_email_verification_token_unique" UNIQUE("email_verification_token")
);
--> statement-breakpoint
CREATE TABLE "venue_rentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"title" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"price" numeric(10, 2),
	"status" text DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_rental_status" CHECK ("venue_rentals"."status" IN ('confirmed','tentative','cancelled')),
	CONSTRAINT "chk_rental_dates" CHECK ("venue_rentals"."end_at" > "venue_rentals"."start_at")
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
	"address" text,
	"color" text DEFAULT '#60A5FA' NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_venues_org_canonical" UNIQUE("organization_id","name_canonical")
);
--> statement-breakpoint
ALTER TABLE "import_audit_log" ADD CONSTRAINT "import_audit_log_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_audit_log" ADD CONSTRAINT "import_audit_log_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_league_member_id_league_members_id_fk" FOREIGN KEY ("league_member_id") REFERENCES "public"."league_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_global_player_id_global_players_id_fk" FOREIGN KEY ("global_player_id") REFERENCES "public"."global_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_playoff_zones" ADD CONSTRAINT "league_playoff_zones_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_scheduling_config" ADD CONSTRAINT "league_scheduling_config_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_venues" ADD CONSTRAINT "league_venues_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_venues" ADD CONSTRAINT "league_venues_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_matches" ADD CONSTRAINT "makeup_matches_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_matches" ADD CONSTRAINT "makeup_matches_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_global_player_id_global_players_id_fk" FOREIGN KEY ("global_player_id") REFERENCES "public"."global_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_league_member_id_league_members_id_fk" FOREIGN KEY ("league_member_id") REFERENCES "public"."league_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_player_profile_id_player_profiles_id_fk" FOREIGN KEY ("player_profile_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_legacy_player_id_players_id_fk" FOREIGN KEY ("legacy_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_player_registration_id_inscriptions_id_fk" FOREIGN KEY ("player_registration_id") REFERENCES "public"."inscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_schedule_overrides" ADD CONSTRAINT "match_schedule_overrides_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_schedule_overrides" ADD CONSTRAINT "match_schedule_overrides_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchdays" ADD CONSTRAINT "matchdays_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_matchday_id_matchdays_id_fk" FOREIGN KEY ("matchday_id") REFERENCES "public"."matchdays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_claimed_player_id_players_id_fk" FOREIGN KEY ("claimed_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_registrations" ADD CONSTRAINT "player_registrations_player_profile_id_player_profiles_id_fk" FOREIGN KEY ("player_profile_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_registrations" ADD CONSTRAINT "player_registrations_legacy_player_id_players_id_fk" FOREIGN KEY ("legacy_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_registrations" ADD CONSTRAINT "player_registrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_registrations" ADD CONSTRAINT "player_registrations_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_global_player_id_global_players_id_fk" FOREIGN KEY ("global_player_id") REFERENCES "public"."global_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_league_member_id_league_members_id_fk" FOREIGN KEY ("league_member_id") REFERENCES "public"."league_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_player_profile_id_player_profiles_id_fk" FOREIGN KEY ("player_profile_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_legacy_player_id_players_id_fk" FOREIGN KEY ("legacy_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats_snapshot" ADD CONSTRAINT "player_season_stats_snapshot_global_player_id_global_players_id_fk" FOREIGN KEY ("global_player_id") REFERENCES "public"."global_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats_snapshot" ADD CONSTRAINT "player_season_stats_snapshot_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats_snapshot" ADD CONSTRAINT "player_season_stats_snapshot_player_profile_id_player_profiles_id_fk" FOREIGN KEY ("player_profile_id") REFERENCES "public"."player_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats_snapshot" ADD CONSTRAINT "player_season_stats_snapshot_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats_snapshot" ADD CONSTRAINT "player_season_stats_snapshot_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "team_purchased_timeslots" ADD CONSTRAINT "team_purchased_timeslots_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_purchased_timeslots" ADD CONSTRAINT "team_purchased_timeslots_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_purchased_timeslots" ADD CONSTRAINT "team_purchased_timeslots_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_rest_requests" ADD CONSTRAINT "team_rest_requests_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_rest_requests" ADD CONSTRAINT "team_rest_requests_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_standings_snapshot" ADD CONSTRAINT "team_standings_snapshot_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_standings_snapshot" ADD CONSTRAINT "team_standings_snapshot_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_rentals" ADD CONSTRAINT "venue_rentals_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_time_windows" ADD CONSTRAINT "venue_time_windows_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_time_windows" ADD CONSTRAINT "venue_time_windows_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "global_players_curp_idx" ON "global_players" USING btree ("curp_hash");--> statement-breakpoint
CREATE INDEX "global_players_name_canonical_idx" ON "global_players" USING btree ("full_name_canonical");--> statement-breakpoint
CREATE INDEX "ial_league_idx" ON "import_audit_log" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "ial_imported_at_idx" ON "import_audit_log" USING btree ("imported_at");--> statement-breakpoint
CREATE INDEX "ial_jornada_idx" ON "import_audit_log" USING btree ("league_id","jornada");--> statement-breakpoint
CREATE INDEX "inscriptions_team_idx" ON "inscriptions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "league_members_global_player_idx" ON "league_members" USING btree ("global_player_id");--> statement-breakpoint
CREATE INDEX "league_members_league_idx" ON "league_members" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "league_playoff_zones_league_idx" ON "league_playoff_zones" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "mm_team_idx" ON "makeup_matches" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "mm_match_idx" ON "makeup_matches" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "events_match_idx" ON "match_events" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "events_global_player_idx" ON "match_events" USING btree ("global_player_id");--> statement-breakpoint
CREATE INDEX "events_league_member_idx" ON "match_events" USING btree ("league_member_id");--> statement-breakpoint
CREATE INDEX "events_profile_idx" ON "match_events" USING btree ("player_profile_id");--> statement-breakpoint
CREATE INDEX "events_legacy_player_idx" ON "match_events" USING btree ("legacy_player_id");--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "match_events" USING btree ("event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_match_player" ON "match_player_stats" USING btree ("match_id","player_registration_id");--> statement-breakpoint
CREATE INDEX "idx_mps_match" ON "match_player_stats" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_mps_registration" ON "match_player_stats" USING btree ("player_registration_id");--> statement-breakpoint
CREATE INDEX "mso_match_idx" ON "match_schedule_overrides" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "mso_changed_by_idx" ON "match_schedule_overrides" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "matchdays_league_idx" ON "matchdays" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "matches_league_idx" ON "matches" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "matches_date_idx" ON "matches" USING btree ("match_date");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "matches_matchday_idx" ON "matches" USING btree ("matchday_id");--> statement-breakpoint
CREATE INDEX "matches_venue_idx" ON "matches" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "matches_kickoff_idx" ON "matches" USING btree ("kickoff_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_cedula_per_league" ON "matches" USING btree ("league_id","cedula");--> statement-breakpoint
CREATE INDEX "idx_matches_cedula" ON "matches" USING btree ("cedula");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pv_visitor_idx" ON "page_views" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "pv_page_idx" ON "page_views" USING btree ("page");--> statement-breakpoint
CREATE INDEX "pv_visited_at_idx" ON "page_views" USING btree ("visited_at");--> statement-breakpoint
CREATE INDEX "idx_player_profiles_org" ON "player_profiles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_player_profiles_claimed" ON "player_profiles" USING btree ("claimed_player_id");--> statement-breakpoint
CREATE INDEX "idx_player_profiles_normalized" ON "player_profiles" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "registrations_profile_idx" ON "player_registrations" USING btree ("player_profile_id");--> statement-breakpoint
CREATE INDEX "registrations_legacy_player_idx" ON "player_registrations" USING btree ("legacy_player_id");--> statement-breakpoint
CREATE INDEX "registrations_team_idx" ON "player_registrations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "registrations_league_idx" ON "player_registrations" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "pss_global_player_idx" ON "player_season_stats" USING btree ("global_player_id");--> statement-breakpoint
CREATE INDEX "pss_league_member_idx" ON "player_season_stats" USING btree ("league_member_id");--> statement-breakpoint
CREATE INDEX "pss_profile_idx" ON "player_season_stats" USING btree ("player_profile_id");--> statement-breakpoint
CREATE INDEX "pss_legacy_player_idx" ON "player_season_stats" USING btree ("legacy_player_id");--> statement-breakpoint
CREATE INDEX "pss_league_idx" ON "player_season_stats" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "psss_global_player_idx" ON "player_season_stats_snapshot" USING btree ("global_player_id");--> statement-breakpoint
CREATE INDEX "psss_player_idx" ON "player_season_stats_snapshot" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "psss_profile_idx" ON "player_season_stats_snapshot" USING btree ("player_profile_id");--> statement-breakpoint
CREATE INDEX "psss_league_idx" ON "player_season_stats_snapshot" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "psss_jornada_idx" ON "player_season_stats_snapshot" USING btree ("jornada");--> statement-breakpoint
CREATE INDEX "playoff_brackets_league_idx" ON "playoff_brackets" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "playoff_slots_bracket_idx" ON "playoff_slots" USING btree ("bracket_id");--> statement-breakpoint
CREATE INDEX "tpt_team_idx" ON "team_purchased_timeslots" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "tpt_league_idx" ON "team_purchased_timeslots" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "trr_league_matchday_idx" ON "team_rest_requests" USING btree ("league_id","matchday_number");--> statement-breakpoint
CREATE INDEX "tss_league_idx" ON "team_standings_snapshot" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "tss_jornada_idx" ON "team_standings_snapshot" USING btree ("jornada");--> statement-breakpoint
CREATE INDEX "teams_league_idx" ON "teams" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_organization_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vr_venue_idx" ON "venue_rentals" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "vr_start_at_idx" ON "venue_rentals" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "vr_status_idx" ON "venue_rentals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vtw_league_idx" ON "venue_time_windows" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "vtw_venue_idx" ON "venue_time_windows" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "venues_org_idx" ON "venues" USING btree ("organization_id");--> statement-breakpoint
CREATE VIEW "public"."player_global_stats" AS (select "players"."id", "players"."full_name", "players"."alias", COUNT(DISTINCT "player_profiles"."organization_id")::int as "organizations_count", COUNT(DISTINCT "player_registrations"."league_id")::int as "leagues_count", COALESCE(SUM("player_season_stats"."goals"), 0)::int as "total_goals", COALESCE(SUM("player_season_stats"."assists"), 0)::int as "total_assists", COALESCE(SUM("player_season_stats"."matches_played"), 0)::int as "total_matches_played", COALESCE(SUM("player_season_stats"."yellow_cards"), 0)::int as "total_yellow_cards", COALESCE(SUM("player_season_stats"."red_cards"), 0)::int as "total_red_cards", MAX("player_season_stats"."updated_at") as "last_updated_at" from "players" inner join "player_profiles" on "player_profiles"."claimed_player_id" = "players"."id" AND "player_profiles"."claim_status" = 'verified' left join "player_registrations" on "player_registrations"."player_profile_id" = "player_profiles"."id" left join "player_season_stats" on "player_season_stats"."player_profile_id" = "player_profiles"."id" group by "players"."id", "players"."full_name", "players"."alias");