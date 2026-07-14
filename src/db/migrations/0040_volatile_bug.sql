CREATE TABLE "suspensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"global_player_id" uuid NOT NULL,
	"league_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"reason_detail" text,
	"duration_type" text NOT NULL,
	"matches_total" integer,
	"matches_served" integer DEFAULT 0 NOT NULL,
	"duration_value" integer,
	"duration_unit" text,
	"starts_on" date,
	"ends_on" date,
	"status" text DEFAULT 'active' NOT NULL,
	"source_match_id" uuid,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_suspension_reason" CHECK ("suspensions"."reason" IN ('yellow_accumulation','red_card','manual')),
	CONSTRAINT "chk_suspension_duration_type" CHECK ("suspensions"."duration_type" IN ('matches','time','permanent')),
	CONSTRAINT "chk_suspension_duration_unit" CHECK ("suspensions"."duration_unit" IS NULL OR "suspensions"."duration_unit" IN ('days','weeks','months')),
	CONSTRAINT "chk_suspension_status" CHECK ("suspensions"."status" IN ('active','served','lifted')),
	CONSTRAINT "chk_suspension_duration_fields" CHECK (
				("suspensions"."duration_type" = 'matches' AND "suspensions"."matches_total" IS NOT NULL)
				OR ("suspensions"."duration_type" = 'time' AND "suspensions"."duration_value" IS NOT NULL AND "suspensions"."duration_unit" IS NOT NULL AND "suspensions"."starts_on" IS NOT NULL)
				OR ("suspensions"."duration_type" = 'permanent')
			)
);
--> statement-breakpoint
ALTER TABLE "suspensions" ADD CONSTRAINT "suspensions_global_player_id_global_players_id_fk" FOREIGN KEY ("global_player_id") REFERENCES "public"."global_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensions" ADD CONSTRAINT "suspensions_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensions" ADD CONSTRAINT "suspensions_source_match_id_matches_id_fk" FOREIGN KEY ("source_match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensions" ADD CONSTRAINT "suspensions_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "suspensions_global_player_idx" ON "suspensions" USING btree ("global_player_id");--> statement-breakpoint
CREATE INDEX "suspensions_league_idx" ON "suspensions" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "suspensions_status_idx" ON "suspensions" USING btree ("status");