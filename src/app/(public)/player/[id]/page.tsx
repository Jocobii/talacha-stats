import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlayerProfile } from "@/entities/player";
import type { PlayerLeagueStats, PlayerGlobalProfile } from "@/entities/player";
import ShareButton from "./ShareButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPlayerProfile(id);
  if (!profile) return { title: "Jugador no encontrado" };

  const name = profile.alias
    ? `${profile.fullName} "${profile.alias}"`
    : profile.fullName;

  const g = profile.global;
  const desc =
    g.totalGoals > 0
      ? `${g.totalGoals} goles en ${g.leaguesCount} liga${g.leaguesCount !== 1 ? "s" : ""}${g.totalMatches > 0 ? ` · ${g.goalsPerMatch.toFixed(2)} goles/partido` : ""}`
      : `Jugador amateur de fútbol 7`;

  return {
    title: `${name} — TalachaStats`,
    description: desc,
    openGraph: {
      title: name,
      description: desc,
      type: "profile",
    },
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getPlayerProfile(id);
  if (!profile) notFound();

  const { global: g } = profile;
  const hasStats = g.totalGoals > 0 || g.totalAssists > 0 || g.totalMatches > 0;
  const initial = (profile.alias ?? profile.fullName).charAt(0).toUpperCase();

  return (
    <div className="bg-gray-950 text-white flex flex-col flex-1">

      <div className="bg-gray-950 px-5 pt-10 pb-8">
        <div className="max-w-lg mx-auto">

          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-4xl font-black shrink-0 shadow-lg">
              {initial}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black leading-tight truncate">
                {profile.fullName}
              </h1>
              {profile.alias && (
                <p className="text-green-400 text-lg font-semibold mt-0.5">
                  "{profile.alias}"
                </p>
              )}
            </div>
          </div>

          {hasStats && (
            <div className="bg-gray-900 rounded-2xl px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {g.totalMatches > 0 ? "Goles por partido" : "Goles totales"}
                </p>
                <p className="text-5xl font-black text-green-400 mt-1 leading-none">
                  {g.totalMatches > 0
                    ? g.goalsPerMatch.toFixed(2)
                    : g.totalGoals}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-gray-300 text-sm">
                  <span className="text-white font-bold">{g.totalGoals}</span> goles
                </p>
                {g.totalMatches > 0 && (
                  <p className="text-gray-300 text-sm">
                    <span className="text-white font-bold">{g.totalMatches}</span> partidos
                  </p>
                )}
                <p className="text-gray-300 text-sm">
                  <span className="text-white font-bold">{g.leaguesCount}</span> liga{g.leaguesCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-100 flex-1 rounded-t-3xl -mt-1 px-5 pt-7 pb-16">
        <div className="max-w-lg mx-auto space-y-5">

          {hasStats && <GlobalStatsBar global={g} />}

          {profile.leagues.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Ligas ({profile.leagues.length})
              </h2>
              <div className="space-y-3">
                {profile.leagues.map((l) => (
                  <LeagueCard key={l.leagueId} league={l} />
                ))}
              </div>
            </section>
          )}

          {!hasStats && (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
              Este jugador aún no tiene estadísticas registradas.
            </div>
          )}

          <ShareButton
            url={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/player/${id}`}
            playerName={profile.alias ?? profile.fullName}
          />
        </div>
      </div>
    </div>
  );
}

function GlobalStatsBar({ global: g }: { global: PlayerGlobalProfile }) {
  const items = [
    { label: "Goles",       value: g.totalGoals,         color: "text-green-600"  },
    { label: "Asistencias", value: g.totalAssists,        color: "text-blue-600"   },
    { label: "Contribs.",   value: g.totalContributions,  color: "text-purple-600" },
    ...(g.totalMatches > 0
      ? [{ label: "Partidos", value: g.totalMatches, color: "text-gray-700" }]
      : []),
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
      <div className="grid grid-cols-4 gap-2">
        {items.map((s) => (
          <div key={s.label} className="text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeagueCard({ league: l }: { league: PlayerLeagueStats }) {
  const gpmColor =
    l.goalsPerMatch >= 1   ? "text-green-600"  :
    l.goalsPerMatch >= 0.5 ? "text-yellow-600" :
                             "text-gray-500";

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="h-1 bg-green-500" />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-gray-900">{l.leagueName}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">
              {l.dayOfWeek} · {l.season}
            </p>
            <p className="text-sm text-gray-600 mt-1">{l.teamName}</p>
          </div>
          {l.goals > 0 && l.matchesPlayed > 0 && (
            <div className="text-right shrink-0">
              <p className={`text-2xl font-black ${gpmColor}`}>
                {l.goalsPerMatch.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-400">goles/PJ</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Goles"  value={l.goals}         accent />
          <StatBox label="Asist." value={l.assists}        />
          <StatBox label="PJ"     value={l.matchesPlayed}  />
        </div>

        {(l.yellowCards > 0 || l.redCards > 0) && (
          <div className="flex gap-3 text-xs text-gray-500 pt-1">
            {l.yellowCards > 0 && (
              <span>🟨 {l.yellowCards} amarilla{l.yellowCards !== 1 ? "s" : ""}</span>
            )}
            {l.redCards > 0 && (
              <span>🟥 {l.redCards} roja{l.redCards !== 1 ? "s" : ""}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-2.5 text-center ${accent ? "bg-green-50" : "bg-gray-50"}`}>
      <p className={`text-xl font-black ${accent ? "text-green-600" : "text-gray-700"}`}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
