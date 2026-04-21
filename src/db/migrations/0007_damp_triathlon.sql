CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'regular' NOT NULL,
	"city" text DEFAULT 'Tijuana' NOT NULL,
	"admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leagues" ALTER COLUMN "day_of_week" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leagues" ADD COLUMN "competition_id" uuid;--> statement-breakpoint
ALTER TABLE "leagues" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "leagues" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "leagues" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competitions_city_idx" ON "competitions" USING btree ("city");--> statement-breakpoint
CREATE INDEX "competitions_name_city_idx" ON "competitions" USING btree ("name","city");--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE set null ON UPDATE no action;