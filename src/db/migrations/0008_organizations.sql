-- ---------------------------------------------------------------------------
-- 0008_organizations.sql
-- Introduce la tabla `organizations` como capa entre usuarios y ligas.
-- Un usuario pertenece a máximo una organización (users.organization_id).
-- Una liga pertenece a una organización (leagues.organization_id).
-- Se elimina leagues.admin_id que era la relación directa usuario → liga.
-- ---------------------------------------------------------------------------

-- 1. Crear tabla organizations
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  logo_url    TEXT,
  city        TEXT        NOT NULL DEFAULT 'Tijuana',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Agregar organization_id a users (nullable — los usuarios sin org son válidos)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS organization_id UUID
  REFERENCES organizations(id) ON DELETE SET NULL;

-- 3. Agregar organization_id a leagues (nullable durante la migración)
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS organization_id UUID
  REFERENCES organizations(id) ON DELETE SET NULL;

-- 4. Backfill: crear una organización por cada usuario único en leagues.admin_id
--    Usa el nombre del usuario como nombre de la org y genera un slug limpio.
INSERT INTO organizations (name, slug, city)
SELECT DISTINCT ON (u.id)
  u.name,
  -- slug: lowercase, espacios y caracteres especiales → guión, sin guiones dobles ni al final
  regexp_replace(
    regexp_replace(
      lower(unaccent(u.name)),
      '[^a-z0-9]+', '-', 'g'
    ),
    '-+$', ''
  ),
  COALESCE(l.city, 'Tijuana')
FROM leagues l
JOIN users u ON l.admin_id = u.id
WHERE l.admin_id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- 5. Vincular leagues → organizations a través del admin_id existente
UPDATE leagues l
SET organization_id = o.id
FROM organizations o
JOIN users u ON lower(unaccent(u.name)) = lower(unaccent(
  regexp_replace(
    regexp_replace(o.slug, '-', ' ', 'g'),
    '  +', ' ', 'g'
  )
))
WHERE l.admin_id = u.id
  AND l.organization_id IS NULL;

-- Fallback más robusto: join directo por admin_id → user → org por nombre
UPDATE leagues l
SET organization_id = (
  SELECT o.id
  FROM organizations o
  WHERE o.name = (SELECT name FROM users WHERE id = l.admin_id)
  LIMIT 1
)
WHERE l.admin_id IS NOT NULL
  AND l.organization_id IS NULL;

-- 6. Vincular users → organizations (el usuario que era admin de ligas pertenece a esa org)
UPDATE users u
SET organization_id = (
  SELECT l.organization_id
  FROM leagues l
  WHERE l.admin_id = u.id
    AND l.organization_id IS NOT NULL
  LIMIT 1
)
WHERE u.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM leagues WHERE admin_id = u.id AND organization_id IS NOT NULL
  );

-- 7. Eliminar la columna admin_id de leagues (ya no es necesaria)
ALTER TABLE leagues DROP COLUMN IF EXISTS admin_id;

-- 8. Índices
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS users_organization_idx ON users(organization_id);
CREATE INDEX IF NOT EXISTS leagues_organization_idx ON leagues(organization_id);
