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
ALTER TABLE "match_events" RENAME COLUMN "player_id" TO "legacy_player_id";--> statement-breakpoint
ALTER TABLE "player_registrations" RENAME COLUMN "player_id" TO "legacy_player_id";--> statement-breakpoint
ALTER TABLE "player_season_stats" RENAME COLUMN "player_id" TO "legacy_player_id";--> statement-breakpoint
ALTER TABLE "player_registrations" DROP CONSTRAINT "unique_player_per_league";--> statement-breakpoint
ALTER TABLE "player_season_stats" DROP CONSTRAINT "unique_player_season";--> statement-breakpoint
ALTER TABLE "match_events" DROP CONSTRAINT "match_events_player_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "player_registrations" DROP CONSTRAINT "player_registrations_player_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "player_season_stats" DROP CONSTRAINT "player_season_stats_player_id_players_id_fk";
--> statement-breakpoint
DROP INDEX "events_player_idx";--> statement-breakpoint
DROP INDEX "registrations_player_idx";--> statement-breakpoint
DROP INDEX "pss_player_idx";--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "player_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "player_registrations" ADD COLUMN "player_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD COLUMN "player_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_claimed_player_id_players_id_fk" FOREIGN KEY ("claimed_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_player_profiles_org" ON "player_profiles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_player_profiles_claimed" ON "player_profiles" USING btree ("claimed_player_id");--> statement-breakpoint
CREATE INDEX "idx_player_profiles_normalized" ON "player_profiles" USING btree ("normalized_name");--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_player_profile_id_player_profiles_id_fk" FOREIGN KEY ("player_profile_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_legacy_player_id_players_id_fk" FOREIGN KEY ("legacy_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_registrations" ADD CONSTRAINT "player_registrations_player_profile_id_player_profiles_id_fk" FOREIGN KEY ("player_profile_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_registrations" ADD CONSTRAINT "player_registrations_legacy_player_id_players_id_fk" FOREIGN KEY ("legacy_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_player_profile_id_player_profiles_id_fk" FOREIGN KEY ("player_profile_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_legacy_player_id_players_id_fk" FOREIGN KEY ("legacy_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_profile_idx" ON "match_events" USING btree ("player_profile_id");--> statement-breakpoint
CREATE INDEX "events_legacy_player_idx" ON "match_events" USING btree ("legacy_player_id");--> statement-breakpoint
CREATE INDEX "registrations_profile_idx" ON "player_registrations" USING btree ("player_profile_id");--> statement-breakpoint
CREATE INDEX "registrations_legacy_player_idx" ON "player_registrations" USING btree ("legacy_player_id");--> statement-breakpoint
CREATE INDEX "pss_profile_idx" ON "player_season_stats" USING btree ("player_profile_id");--> statement-breakpoint
CREATE INDEX "pss_legacy_player_idx" ON "player_season_stats" USING btree ("legacy_player_id");--> statement-breakpoint
ALTER TABLE "player_registrations" ADD CONSTRAINT "unique_profile_per_league" UNIQUE("player_profile_id","league_id");--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "unique_profile_season" UNIQUE("player_profile_id","league_id");