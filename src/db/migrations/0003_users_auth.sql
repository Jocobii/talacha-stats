--> statement-breakpoint
CREATE TABLE "users" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"         TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "role"          TEXT NOT NULL DEFAULT 'organizer',
  "active"        BOOLEAN NOT NULL DEFAULT true,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" ("email");
--> statement-breakpoint
ALTER TABLE "leagues"
  ADD CONSTRAINT "leagues_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "users"("id")
  ON DELETE SET NULL;
