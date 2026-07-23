-- Índices GIN trgm para el buscador universal por organización
-- (docs/UNIVERSAL-SEARCH.md, Fase A.1).
--
-- pg_trgm y unaccent ya están instalados por `db:sync --ext pg_trgm,unaccent`;
-- estas dos líneas son defensivas (idempotentes) por si corren en un entorno
-- que no pasó por ese script.
--
-- Sin rama 'rule' (reglamento): hoy no existe columna de texto libre de
-- reglamento en el schema (league_config/organization_config son parámetros
-- estructurados, no prosa) — ver docs/UNIVERSAL-SEARCH.md §8.3.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teams_name_canonical_trgm" ON "teams" USING gin ("name_canonical" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leagues_name_canonical_trgm" ON "leagues" USING gin ("name_canonical" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "global_players_full_name_canonical_trgm" ON "global_players" USING gin ("full_name_canonical" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venues_name_canonical_trgm" ON "venues" USING gin ("name_canonical" gin_trgm_ops);
