CREATE TABLE "global_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curp_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"birth_date" date NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "global_players_curp_hash_unique" UNIQUE("curp_hash")
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
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_league_member_id_league_members_id_fk" FOREIGN KEY ("league_member_id") REFERENCES "public"."league_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_global_player_id_global_players_id_fk" FOREIGN KEY ("global_player_id") REFERENCES "public"."global_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "global_players_curp_idx" ON "global_players" USING btree ("curp_hash");--> statement-breakpoint
CREATE INDEX "inscriptions_team_idx" ON "inscriptions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "league_members_global_player_idx" ON "league_members" USING btree ("global_player_id");--> statement-breakpoint
CREATE INDEX "league_members_league_idx" ON "league_members" USING btree ("league_id");