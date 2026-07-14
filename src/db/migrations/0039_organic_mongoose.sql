CREATE TABLE "organization_config" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"points_win" integer DEFAULT 3 NOT NULL,
	"points_draw" integer DEFAULT 1 NOT NULL,
	"tiebreakers" jsonb DEFAULT '["points","head_to_head","goal_diff","goals_for","name"]'::jsonb NOT NULL,
	"yellow_threshold" integer DEFAULT 5 NOT NULL,
	"red_card_matches" integer DEFAULT 1 NOT NULL,
	"blue_card_meaning" text DEFAULT 'temp' NOT NULL,
	"reinforcement_limit" integer,
	"finance_level" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_config" ADD CONSTRAINT "organization_config_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;