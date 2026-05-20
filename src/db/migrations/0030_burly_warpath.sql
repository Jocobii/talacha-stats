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
ALTER TABLE "league_playoff_zones" ADD CONSTRAINT "league_playoff_zones_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "league_playoff_zones_league_idx" ON "league_playoff_zones" USING btree ("league_id");