/**
 * entities/search/model.ts
 *
 * Tipos client-safe del buscador universal por organización
 * (docs/UNIVERSAL-SEARCH.md). Sin `rule` todavía: no existe columna de texto
 * libre de reglamento en el schema (§8.3 del doc) — se agrega cuando exista.
 */

export type SearchHitKind = "team" | "league" | "player" | "suspension" | "venue";

type BaseHit = {
	id: string;
	title: string;
	subtitle: string | null;
	url: string;
	score: number;
};

export type TeamSearchHit = BaseHit & { kind: "team" };
export type LeagueSearchHit = BaseHit & { kind: "league" };
export type PlayerSearchHit = BaseHit & { kind: "player" };
export type SuspensionSearchHit = BaseHit & { kind: "suspension" };
export type VenueSearchHit = BaseHit & { kind: "venue" };

export type SearchHit =
	TeamSearchHit | LeagueSearchHit | PlayerSearchHit | SuspensionSearchHit | VenueSearchHit;
