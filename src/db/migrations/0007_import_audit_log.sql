-- Migration: 0007_import_audit_log
-- Agrega la tabla import_audit_log para registrar cada importación realizada.
-- Permite auditar qué se importó, cuándo, por quién, y si hubo anomalías.

CREATE TABLE IF NOT EXISTS "import_audit_log" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "league_id"       uuid NOT NULL REFERENCES "leagues"("id") ON DELETE CASCADE,
  "imported_by"     uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "import_type"     text NOT NULL,         -- 'goleadores' | 'standings' | 'events'
  "jornada"         integer,
  "rows_processed"  integer NOT NULL DEFAULT 0,
  "rows_created"    integer NOT NULL DEFAULT 0,
  "anomaly_summary" jsonb,                 -- AnomalyReport[] serializado
  "warnings"        text[],
  "imported_at"     timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ial_league_idx"      ON "import_audit_log" ("league_id");
CREATE INDEX IF NOT EXISTS "ial_imported_at_idx" ON "import_audit_log" ("imported_at");
CREATE INDEX IF NOT EXISTS "ial_jornada_idx"     ON "import_audit_log" ("league_id", "jornada");
