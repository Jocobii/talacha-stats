-- Migración: agregar category a la tabla leagues
-- Permite clasificar ligas por categoría dentro de un mismo torneo.
-- (Libre, Libre Femenil, Mixto, 2015-2016, etc.)
-- Campo opcional (nullable) para no romper ligas existentes.

ALTER TABLE "leagues"
  ADD COLUMN IF NOT EXISTS "category" text;
