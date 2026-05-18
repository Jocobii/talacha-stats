ALTER TABLE "venues" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "color" text DEFAULT '#60A5FA' NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "capacity" integer DEFAULT 1 NOT NULL;