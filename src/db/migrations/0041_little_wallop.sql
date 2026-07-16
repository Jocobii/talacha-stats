ALTER TABLE "global_players" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "league_members" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "league_members" ADD COLUMN "residence_area" text;--> statement-breakpoint
ALTER TABLE "league_members" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "league_members" ADD COLUMN "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "league_members" ADD COLUMN "medical_notes" text;--> statement-breakpoint
ALTER TABLE "global_players" ADD CONSTRAINT "chk_global_player_gender" CHECK ("global_players"."gender" IS NULL OR "global_players"."gender" IN ('masculino','femenino','otro'));