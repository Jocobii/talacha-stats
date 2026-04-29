-- ---------------------------------------------------------------------------
-- 0009_league_slugs.sql
-- Agrega slug a la tabla leagues para URLs públicas limpias.
-- Backfill: genera slug desde nombre + día de la semana.
-- Índice único compuesto (organization_id, slug) — slugs únicos por org.
-- ---------------------------------------------------------------------------

-- 1. Agregar columna slug (nullable durante la migración)
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Backfill: generar slug desde nombre + día de semana
--    "Liga Lunes" + "lunes" → "liga-lunes-lunes"  (se limpia después)
--    Usamos unaccent para manejar acentos correctamente.
UPDATE leagues
SET slug = regexp_replace(
             regexp_replace(
               lower(unaccent(name || '-' || day_of_week)),
               '[^a-z0-9]+', '-', 'g'
             ),
             '-+$', ''
           )
WHERE slug IS NULL OR slug = '';

-- 3. Resolver duplicados dentro de la misma organización
--    Si hay dos ligas con mismo slug en la misma org, agrega sufijo numérico.
WITH numbered AS (
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
SET slug = n.slug || '-' || n.rn
FROM numbered n
WHERE l.id = n.id
  AND n.rn > 1;

-- 4. Índice único por organización (permite mismo slug en orgs distintas)
CREATE UNIQUE INDEX IF NOT EXISTS leagues_org_slug_idx
  ON leagues (organization_id, slug)
  WHERE organization_id IS NOT NULL;

-- 5. Índice para búsquedas de ligas sin org por slug (por si se necesita)
CREATE INDEX IF NOT EXISTS leagues_slug_idx
  ON leagues (slug)
  WHERE slug IS NOT NULL;
