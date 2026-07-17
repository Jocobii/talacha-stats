CREATE TABLE "organization_credential_config" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"allow_single_league_pass" boolean DEFAULT false NOT NULL,
	"allow_organization_pass" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_credential_config_at_least_one" CHECK ("organization_credential_config"."allow_single_league_pass" OR "organization_credential_config"."allow_organization_pass")
);
--> statement-breakpoint
ALTER TABLE "organization_credential_config" ADD CONSTRAINT "organization_credential_config_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;