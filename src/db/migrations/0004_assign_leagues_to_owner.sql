--> statement-breakpoint
-- Asigna todas las ligas sin dueño (admin_id IS NULL) al primer usuario owner
-- que encuentre, ordenado por fecha de creación.
-- Si no existe ningún owner todavía, el UPDATE no hace nada (safe to run).
UPDATE "leagues"
SET "admin_id" = (
  SELECT "id"
  FROM   "users"
  WHERE  "role" = 'owner'
  ORDER  BY "created_at" ASC
  LIMIT  1
)
WHERE "admin_id" IS NULL;
