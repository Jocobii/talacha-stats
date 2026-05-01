ALTER TABLE "organizations" ADD COLUMN "status" text DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "verification_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_verification_token_unique" UNIQUE("email_verification_token");
--> statement-breakpoint
-- Usuarios existentes ya validados manualmente -> marcar como verificados
UPDATE "users" SET "email_verified" = true;
--> statement-breakpoint
-- Organizaciones existentes son ligas piloto reales -> marcar como verificadas
UPDATE "organizations" SET "status" = 'verified';
