CREATE TABLE "skin_activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skin_id" text NOT NULL,
	"name" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_skin_activation_range" CHECK ("skin_activations"."starts_on" <= "skin_activations"."ends_on")
);
--> statement-breakpoint
CREATE INDEX "sa_active_lookup_idx" ON "skin_activations" USING btree ("is_enabled","starts_on","ends_on");