CREATE TABLE "narrator_analysis_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"league_name" text,
	"team_a_name" text NOT NULL,
	"team_b_name" text NOT NULL,
	"visitor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leagues" ALTER COLUMN "scheduling_enabled" SET DEFAULT true;--> statement-breakpoint
CREATE INDEX "nae_source_idx" ON "narrator_analysis_events" USING btree ("source");--> statement-breakpoint
CREATE INDEX "nae_created_at_idx" ON "narrator_analysis_events" USING btree ("created_at");