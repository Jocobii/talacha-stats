import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, ArrowLeft } from "lucide-react";
import { getCityRanking } from "@/entities/player/ranking";
import type { RankingEntry } from "@/entities/player/ranking";
import CityFilter from "@/shared/ui/CityFilter";

export const metadata: Metadata = {
  title: "Ranking Tijuana — TalachaStats",
  description:
    "Los mejores goleadores de todas las ligas de fútbol amateur en Tijuana. Temporada actual.",
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city = "Tijuana" } = await searchParams;
  const ranking = await getCityRanking(city);

  return (
    <div className="min-h-screen bg-pitch text-ink font-body flex flex-col">

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
              {ranking.length} jugadores · Fútbol Amateur
            </p>
          </div>
          <div className="shrink-0 pt-1">
            <CityFilter />
          </div>
        </div>
      </header>

      {/* Cuerpo */}
      <div className="flex-1 bg-surface rounded-t-3xl px-4 pt-6 pb-16">
        <div className="max-w-lg mx-auto space-y-3">

          {ranking.length === 0 && (
            <div className="bg-surface-2 border border-line rounded-2xl p-8 text-center text-ink-3 text-sm">
              Aún no hay estadísticas registradas.
            </div>
          )}

          {/* Podio top 3 */}
          {ranking.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { entry: ranking[1], pos: 2, medal: "🥈", goalsSize: "text-3xl", mt: "mt-6" },
                { entry: ranking[0], pos: 1, medal: "🥇", goalsSize: "text-5xl", mt: "" },
                { entry: ranking[2], pos: 3, medal: "🥉", goalsSize: "text-3xl", mt: "mt-6" },
              ].map(({ entry, pos, medal, goalsSize, mt }) => (
                <Link
                  key={entry.playerId}
                  href={`/jugador/${entry.playerId}`}
                  className={`bg-surface-2 border border-line rounded-2xl flex flex-col items-center text-center px-2 py-4 ${mt} hover:border-brand transition`}
                >
                  <span className="text-xl mb-2">{medal}</span>
                  <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-xl mb-2">
                    {(entry.alias ?? entry.fullName).charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-ink leading-tight line-clamp-2 w-full">
                    {entry.alias ? `"${entry.alias}"` : entry.fullName}
                  </p>
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

          {/* Lista completa a partir del 4° */}
          {ranking.slice(ranking.length >= 3 ? 3 : 0).map((entry, idx) => (
            <RankRow
              key={entry.playerId}
              entry={entry}
              position={idx + (ranking.length >= 3 ? 4 : 1)}
            />
          ))}

          {ranking.length > 0 && ranking.length < 3 &&
            ranking.map((entry, idx) => (
              <RankRow key={entry.playerId} entry={entry} position={idx + 1} />
            ))
          }

          <p className="text-center text-xs text-ink-3 pt-4 font-display uppercase tracking-widest">
            ⚽ TalachaStats · Tijuana
          </p>
        </div>
      </div>
    </div>
  );
}

function RankRow({ entry, position }: { entry: RankingEntry; position: number }) {
  const isTop10 = position <= 10;

  return (
    <Link
      href={`/jugador/${entry.playerId}`}
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
