ALTER TABLE "competitions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "competitions" CASCADE;--> statement-breakpoint
ALTER TABLE "leagues" DROP CONSTRAINT "leagues_competition_id_competitions_id_fk";
--> statement-breakpoint
ALTER TABLE "leagues" ALTER COLUMN "day_of_week" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leagues" DROP COLUMN "competition_id";--> statement-breakpoint
ALTER TABLE "leagues" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "leagues" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "leagues" DROP COLUMN "end_date";