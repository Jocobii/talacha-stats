CREATE TABLE "organization_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"mode" text DEFAULT 'preset' NOT NULL,
	"preset_id" text,
	"color_primary" text,
	"color_accent" text,
	"color_surface" text,
	"color_ink" text,
	"font_id" text DEFAULT 'brand' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_themes_organization_id_unique" UNIQUE("organization_id"),
	CONSTRAINT "chk_org_theme_mode" CHECK ("organization_themes"."mode" IN ('preset','custom')),
	CONSTRAINT "chk_org_theme_preset_complete" CHECK ("organization_themes"."mode" <> 'preset' OR "organization_themes"."preset_id" IS NOT NULL),
	CONSTRAINT "chk_org_theme_custom_complete" CHECK ("organization_themes"."mode" <> 'custom' OR ("organization_themes"."color_primary" IS NOT NULL AND "organization_themes"."color_accent" IS NOT NULL AND "organization_themes"."color_surface" IS NOT NULL AND "organization_themes"."color_ink" IS NOT NULL)),
	CONSTRAINT "chk_org_theme_hex_format" CHECK (("organization_themes"."color_primary" IS NULL OR "organization_themes"."color_primary" ~* '^#[0-9a-f]{6}$') AND ("organization_themes"."color_accent" IS NULL OR "organization_themes"."color_accent" ~* '^#[0-9a-f]{6}$') AND ("organization_themes"."color_surface" IS NULL OR "organization_themes"."color_surface" ~* '^#[0-9a-f]{6}$') AND ("organization_themes"."color_ink" IS NULL OR "organization_themes"."color_ink" ~* '^#[0-9a-f]{6}$'))
);
--> statement-breakpoint
ALTER TABLE "organization_themes" ADD CONSTRAINT "organization_themes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;