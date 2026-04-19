import Link from "next/link";
import type { Metadata } from "next";
import { Star, ArrowLeft } from "lucide-react";
import { getJornadaHonor } from "@/entities/player/ranking";
import type { JornadaLeague, JornadaHero } from "@/entities/player/ranking";
import CityFilter from "@/shared/ui/CityFilter";

export const metadata: Metadata = {
  title: "Tabla de honor — TalachaStats",
  description:
    "Los mejores goleadores de la última jornada en todas las ligas de Tijuana.",
};

export default async function MatchdayPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city = "Tijuana" } = await searchParams;
  const leagues = await getJornadaHonor(city);

  return (
    <div className="text-ink flex flex-col flex-1">

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
              <Star size={22} className="text-brand" strokeWidth={2.5} />
              <h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
                Tabla de honor
              </h1>
            </div>
            <p className="text-ink-2 text-sm mt-0.5">
              Top goleadores · última jornada por liga
            </p>
          </div>
          <div className="shrink-0 pt-1">
            <CityFilter />
          </div>
        </div>
      </header>

      <div className="flex-1 bg-surface rounded-t-3xl px-4 pt-6 pb-16">
        <div className="max-w-lg mx-auto space-y-4">

          {leagues.length === 0 && (
            <div className="bg-surface-2 border border-line rounded-2xl p-8 text-center text-ink-3 text-sm">
              Aún no hay datos de jornadas importados.
            </div>
          )}

          {leagues.map((league) => (
            <LeagueHonorCard key={league.leagueId} league={league} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LeagueHonorCard({ league }: { league: JornadaLeague }) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-surface-2 border border-line rounded-2xl overflow-hidden">
      <div className="h-1 bg-brand" />

      <div className="px-4 pt-4 pb-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display font-black text-xl uppercase tracking-wide text-ink leading-tight">
              {league.leagueName}
            </p>
            <p className="text-xs text-ink-2 capitalize mt-0.5">
              {league.dayOfWeek} · {league.season}
            </p>
          </div>
          <div className="bg-surface border border-line rounded-xl px-3 py-1.5 text-center shrink-0">
            <p className="font-display font-black text-lg text-brand leading-none">J{league.jornada}</p>
            <p className="text-[9px] text-ink-3 uppercase tracking-wide">jornada</p>
          </div>
        </div>

        <div className="space-y-2">
          {league.heroes.map((hero, i) => (
            <HeroRow key={hero.playerId} hero={hero} medal={medals[i]} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroRow({ hero, medal, rank }: { hero: JornadaHero; medal: string; rank: number }) {
  const isBest = rank === 1;

  return (
    <Link
      href={`/player/${hero.playerId}`}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:border-brand border
        ${isBest ? "bg-pitch border-brand/30" : "bg-surface border-line"}`}
    >
      <span className="text-xl shrink-0">{medal}</span>

      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-sm shrink-0
        ${isBest ? "bg-brand text-pitch" : "bg-surface-2 text-ink-2"}`}>
        {(hero.alias ?? hero.fullName).charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink text-sm truncate">
          {hero.alias ? `"${hero.alias}"` : hero.fullName}
        </p>
        <p className="text-xs text-ink-2 truncate">{hero.teamName}</p>
      </div>

      <div className="text-right shrink-0">
        <p className={`font-display font-black text-2xl leading-none ${isBest ? "text-brand" : "text-ink"}`}>
          {hero.goals}
        </p>
        <p className="text-[10px] text-ink-3">
          {hero.matchesPlayed > 0 ? `${hero.goalsPerMatch.toFixed(2)}/PJ` : "goles"}
        </p>
      </div>
    </Link>
  );
}
