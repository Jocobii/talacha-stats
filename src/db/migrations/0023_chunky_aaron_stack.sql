CREATE TABLE "venue_rentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"title" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"price" numeric(10, 2),
	"status" text DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_rental_status" CHECK ("venue_rentals"."status" IN ('confirmed','tentative','cancelled')),
	CONSTRAINT "chk_rental_dates" CHECK ("venue_rentals"."end_at" > "venue_rentals"."start_at")
);
--> statement-breakpoint
ALTER TABLE "venue_rentals" ADD CONSTRAINT "venue_rentals_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vr_venue_idx" ON "venue_rentals" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "vr_start_at_idx" ON "venue_rentals" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "vr_status_idx" ON "venue_rentals" USING btree ("status");