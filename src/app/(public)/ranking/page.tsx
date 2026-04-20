import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Trophy, ArrowLeft } from "lucide-react";
import {
  getCityRanking, getLeagueRanking, getGlobalRanking, getCityLeagues,
} from "@/entities/player/ranking";
import type { RankingEntry } from "@/entities/player/ranking";
import CityFilter from "@/shared/ui/CityFilter";
import Pagination from "@/shared/ui/Pagination";
import PlayerSearch from "./PlayerSearch";
import LeagueSelector from "./LeagueSelector";
import { parsePaginationParams } from "@/shared/lib/pagination";

export const metadata: Metadata = {
  title: "Ranking — TalachaStats",
  description: "Los mejores goleadores de las ligas de fútbol amateur. Compárate con los demás.",
};

type Scope = "city" | "league" | "global";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const city = params.city ?? "Tijuana";
  const scope = (params.scope ?? "city") as Scope;
  const leagueId = params.leagueId ?? undefined;
  const pagination = parsePaginationParams(
    new URLSearchParams(params as Record<string, string>),
    { limit: 30 },
  );

  // ── Fetch ranking based on scope ────────────────────────────────────────────
  const noLeagueSelected = scope === "league" && !leagueId;

  const rankingResult = noLeagueSelected
    ? { items: [] as RankingEntry[], meta: { total: 0, page: 1, limit: 30, totalPages: 0, hasNext: false, hasPrev: false } }
    : scope === "league"
      ? await getLeagueRanking(leagueId!, pagination)
      : scope === "global"
        ? await getGlobalRanking(pagination)
        : await getCityRanking(city, pagination);

  // ── City leagues for the Liga selector ─────────────────────────────────────
  const cityLeagues = scope === "league" ? await getCityLeagues(city) : [];

  const { items: ranking, meta } = rankingResult;
  const isFirstPage = pagination.page === 1;
  const hasPodium = isFirstPage && ranking.length >= 3 && !noLeagueSelected;
  const listItems = isFirstPage && hasPodium ? ranking.slice(3) : ranking;
  const globalOffset = (pagination.page - 1) * pagination.limit;

  // ── Scope tab links ─────────────────────────────────────────────────────────
  const cityTabHref = `/ranking?scope=city&city=${encodeURIComponent(city)}`;
  const leagueTabHref = `/ranking?scope=league&city=${encodeURIComponent(city)}${leagueId ? `&leagueId=${leagueId}` : ""}`;
  const globalTabHref = `/ranking?scope=global`;

  return (
    <div className="text-ink flex flex-col flex-1">

      {/* Header */}
      <header className="bg-pitch px-5 pt-8 pb-6 max-w-lg mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm transition mb-5"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Inicio
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={22} className="text-brand" strokeWidth={2.5} />
              <h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
                Ranking
              </h1>
            </div>
            <p className="text-ink-2 text-sm">
              {noLeagueSelected
                ? "Selecciona una liga"
                : `${meta.total} jugadores · Fútbol Amateur`}
              {!noLeagueSelected && meta.totalPages > 1 && (
                <span className="ml-2 text-ink-3">· pág. {meta.page}/{meta.totalPages}</span>
              )}
            </p>
          </div>

          {/* City filter — hidden in global scope */}
          {scope !== "global" && (
            <div className="shrink-0 pt-1">
              <CityFilter />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 bg-surface rounded-t-3xl px-4 pt-5 pb-16">
        <div className="max-w-lg mx-auto">

          {/* Scope tabs */}
          <div className="flex gap-1 bg-surface-2 border border-line p-1 rounded-xl mb-4">
            <ScopeTab href={cityTabHref} active={scope === "city"}>
              Ciudad
            </ScopeTab>
            <ScopeTab href={leagueTabHref} active={scope === "league"}>
              Liga
            </ScopeTab>
            <ScopeTab href={globalTabHref} active={scope === "global"}>
              Nacional
            </ScopeTab>
          </div>

          {/* League selector (scope=league only) */}
          {scope === "league" && (
            <Suspense>
              <LeagueSelector leagues={cityLeagues} city={city} current={leagueId} />
            </Suspense>
          )}

          {/* "Find me" search — shown in all scopes once a league is selected */}
          {!noLeagueSelected && (
            <Suspense>
              <PlayerSearch
                city={scope !== "global" ? city : ""}
                leagueId={scope === "league" ? leagueId : undefined}
              />
            </Suspense>
          )}

          {/* Empty state */}
          {noLeagueSelected ? (
            <div className="bg-surface-2 border border-line rounded-2xl p-8 text-center text-ink-3 text-sm">
              Elige una liga del selector de arriba para ver el ranking.
            </div>
          ) : meta.total === 0 ? (
            <div className="bg-surface-2 border border-line rounded-2xl p-8 text-center text-ink-3 text-sm">
              Aún no hay estadísticas registradas.
            </div>
          ) : (
            <div className="space-y-3">

              {/* Podium — page 1 only */}
              {hasPodium && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { entry: ranking[1], pos: 2, medal: "🥈", goalsSize: "text-3xl", mt: "mt-6" },
                    { entry: ranking[0], pos: 1, medal: "🥇", goalsSize: "text-5xl", mt: "" },
                    { entry: ranking[2], pos: 3, medal: "🥉", goalsSize: "text-3xl", mt: "mt-6" },
                  ].map(({ entry, pos, medal, goalsSize, mt }) => (
                    <Link
                      key={entry.playerId}
                      href={`/player/${entry.playerId}`}
                      className={`bg-surface-2 border border-line rounded-2xl flex flex-col items-center text-center px-2 py-4 ${mt} hover:border-brand transition`}
                    >
                      <span className="text-xl mb-2">{medal}</span>
                      <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-xl mb-2">
                        {(entry.alias ?? entry.fullName).charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs font-semibold text-ink leading-tight line-clamp-2 w-full">
                        {entry.alias ? `"${entry.alias}"` : entry.fullName}
                      </p>
                      {/* City badge for global scope */}
                      {entry.cities && entry.cities.length > 0 && (
                        <p className="text-[10px] text-ink-3 mt-0.5">{entry.cities[0]}</p>
                      )}
                      <p className={`${goalsSize} font-display font-black text-brand mt-1 leading-none`}>
                        {entry.totalGoals}
                      </p>
                      <p className="text-[10px] text-ink-3">goles</p>
                      {entry.totalMatches > 0 && (
                        <p className="text-[10px] text-ink-3 mt-0.5">
                          {entry.goalsPerMatch.toFixed(2)}/PJ
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* List */}
              {listItems.map((entry, idx) => {
                const position = hasPodium
                  ? globalOffset + idx + 4
                  : globalOffset + idx + 1;
                return <RankRow key={entry.playerId} entry={entry} position={position} showCity={scope === "global"} />;
              })}

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <Suspense>
                  <Pagination meta={meta} className="pt-4" />
                </Suspense>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Scope tab ─────────────────────────────────────────────────────────────────

function ScopeTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex-1 text-center text-xs font-semibold py-2 rounded-lg transition ${active
          ? "bg-brand text-pitch shadow-sm"
          : "text-ink-3 hover:text-ink"
        }`}
    >
      {children}
    </Link>
  );
}

// ── Rank row ──────────────────────────────────────────────────────────────────

function RankRow({
  entry, position, showCity,
}: {
  entry: RankingEntry; position: number; showCity: boolean;
}) {
  const isTop10 = position <= 10;

  return (
    <Link
      href={`/player/${entry.playerId}`}
      className="flex items-center gap-4 bg-surface-2 border border-line rounded-2xl px-4 py-3.5 hover:border-brand transition"
    >
      <div className={`w-8 text-center shrink-0 font-display font-black text-xl ${isTop10 ? "text-brand" : "text-ink-3"}`}>
        {position}
      </div>

      <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-base shrink-0">
        {(entry.alias ?? entry.fullName).charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink truncate text-sm">
          {entry.alias ? `"${entry.alias}"` : entry.fullName}
        </p>
        <p className="text-xs text-ink-2 truncate">
          {entry.topTeam} · {entry.topLeague}
          {showCity && entry.cities && entry.cities.length > 0 && (
            <span className="ml-1 text-ink-3">· {entry.cities[0]}</span>
          )}
          {entry.leaguesCount > 1 && (
            <span className="ml-1 text-brand font-medium">
              +{entry.leaguesCount - 1} liga{entry.leaguesCount - 1 !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-display font-black text-2xl text-brand leading-none">{entry.totalGoals}</p>
        {entry.totalMatches > 0 && (
          <p className="text-[10px] text-ink-3">{entry.goalsPerMatch.toFixed(2)}/PJ</p>
        )}
      </div>
    </Link>
  );
}
