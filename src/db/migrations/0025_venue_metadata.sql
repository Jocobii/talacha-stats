-- 0025_venue_metadata.sql
-- Agrega color, capacity y address a la tabla venues.
-- color: hex de identificación visible en cockpit, tarjetas y calendario.
-- capacity: número de canchas paralelas (1–6).
-- address: dirección completa (opcional, aparece en sorteo y calendario público).

ALTER TABLE venues ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#60A5FA';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS capacity integer NOT NULL DEFAULT 1;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS address text;

-- CHECK constraint para capacity (Drizzle no lo genera nativamente)
ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_capacity_check;
ALTER TABLE venues ADD CONSTRAINT venues_capacity_check CHECK (capacity >= 1 AND capacity <= 6);

-- CHECK constraint para color (hex válido)
ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_color_check;
ALTER TABLE venues ADD CONSTRAINT venues_color_check CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
