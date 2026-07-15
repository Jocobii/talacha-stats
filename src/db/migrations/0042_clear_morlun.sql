ALTER TABLE "league_members" ADD COLUMN "credential_code" integer;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "uq_league_member_credential" UNIQUE("league_id","credential_code");--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "chk_credential_code_positive" CHECK ("league_members"."credential_code" IS NULL OR "league_members"."credential_code" >= 1);