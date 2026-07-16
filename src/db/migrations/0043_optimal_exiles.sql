CREATE TABLE "organization_scheduling_config" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"regular_matchdays" integer,
	"regular_format" text DEFAULT 'single' NOT NULL,
	"match_duration_minutes" integer DEFAULT 50 NOT NULL,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"allow_duplicate_matchups" boolean DEFAULT false NOT NULL,
	"no_repeat_within" integer DEFAULT 3 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_scheduling_config" ADD CONSTRAINT "organization_scheduling_config_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;