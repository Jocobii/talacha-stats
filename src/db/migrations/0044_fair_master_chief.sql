CREATE TABLE "player_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"global_player_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"league_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"valid_from" date,
	"valid_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_credential_scope_shape" CHECK ((
				("player_credentials"."scope" = 'single_league' AND "player_credentials"."league_id" IS NOT NULL)
				OR
				("player_credentials"."scope" = 'organization'  AND "player_credentials"."league_id" IS NULL
				 AND "player_credentials"."valid_from" IS NOT NULL AND "player_credentials"."valid_until" IS NOT NULL)
			)),
	CONSTRAINT "chk_credential_status" CHECK ("player_credentials"."status" IN ('active','expired','suspended','cancelled')),
	CONSTRAINT "chk_credential_scope_value" CHECK ("player_credentials"."scope" IN ('single_league','organization'))
);
--> statement-breakpoint
ALTER TABLE "league_members" ADD COLUMN "credential_id" uuid;--> statement-breakpoint
ALTER TABLE "player_credentials" ADD CONSTRAINT "player_credentials_global_player_id_global_players_id_fk" FOREIGN KEY ("global_player_id") REFERENCES "public"."global_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_credentials" ADD CONSTRAINT "player_credentials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_credentials" ADD CONSTRAINT "player_credentials_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_credentials_global_player_idx" ON "player_credentials" USING btree ("global_player_id");--> statement-breakpoint
CREATE INDEX "player_credentials_org_idx" ON "player_credentials" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "player_credentials_league_idx" ON "player_credentials" USING btree ("league_id");--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_credential_id_player_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."player_credentials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "league_members_credential_idx" ON "league_members" USING btree ("credential_id");--> statement-breakpoint
-- Un solo pase de organización vigente por (jugador, org): evita duplicar el
-- anual. Drizzle no expresa nativo un UNIQUE INDEX ... WHERE, así que se
-- agrega a mano (docs/CREDENCIAL-PASE-JUGADOR.md §4.1).
CREATE UNIQUE INDEX "uq_org_credential_active" ON "player_credentials" USING btree ("global_player_id", "organization_id") WHERE "player_credentials"."scope" = 'organization' AND "player_credentials"."status" = 'active';