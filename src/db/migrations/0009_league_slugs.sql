-- ---------------------------------------------------------------------------
-- 0009_league_slugs.sql
-- Agrega slug a leagues para URLs públicas limpias.
-- UNIQUE (organization_id, slug) — único dentro de la organización.
-- Backfill: genera slug desde el nombre + día de semana.
-- ---------------------------------------------------------------------------

ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill: nombre + día de semana → slug
-- Ej: "Liga Lunes" + lunes → "liga-lunes"
-- Ej: "Liga Femenil" + martes → "liga-femenil-martes"
UPDATE leagues
SET slug = regexp_replace(
    regexp_replace(
      lower(unaccent(name || ' ' || day_of_week)),
      '[^a-z0-9]+', '-', 'g'
    ),
    '-+$', ''
  )
WHERE slug IS NULL;

-- Resolver colisiones dentro de la misma organización (si las hubiera):
-- Agregar sufijo numérico a duplicados
WITH duplicates AS (
  SELECT id,
         slug,
         organization_id,
         ROW_NUMBER() OVER (
           PARTITION BY organization_id, slug
           ORDER BY created_at
         ) AS rn
  FROM leagues
  WHERE organization_id IS NOT NULL
)
UPDATE leagues l
SET slug = l.slug || '-' || d.rn
FROM duplicates d
WHERE l.id = d.id AND d.rn > 1;

-- Unique constraint: slug único dentro de una organización
CREATE UNIQUE INDEX IF NOT EXISTS leagues_org_slug_idx
  ON leagues (organization_id, slug)
  WHERE organization_id IS NOT NULL;

-- Índice general para lookups
CREATE INDEX IF NOT EXISTS leagues_slug_idx ON leagues(slug);
