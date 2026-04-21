import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlayerProfile, getPlayerEgoStats } from "@/entities/player";
import type {
  PlayerLeagueStats,
  PlayerGlobalProfile,
  PlayerEgoStats,
  PlayerBadge,
  PlayerTeamGoalShare,
} from "@/entities/player";
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
      : "Jugador amateur de fútbol 7";

  return {
    title: `${name} — TalachaStats`,
    description: desc,
    openGraph: { title: name, description: desc, type: "profile" },
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, egoStats] = await Promise.all([
    getPlayerProfile(id),
    getPlayerEgoStats(id),
  ]);
  if (!profile) return notFound();

  const { global: g } = profile;
  const hasStats = g.totalGoals > 0 || g.totalMatches > 0;
  const initial  = (profile.alias ?? profile.fullName).charAt(0).toUpperCase();

  const cityPos      = egoStats.positions.city;
  const showCityRank = cityPos !== null && cityPos.goals > 0;

  const shareByLeague = new Map<string, PlayerTeamGoalShare>(
    egoStats.teamGoalShares.map((s) => [s.leagueId, s]),
  );

  return (
    <div className="min-h-screen bg-pitch text-ink flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 pt-10 pb-20 flex flex-col gap-5">

        {/* ── Header: Avatar small left + name right ── */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-brand flex items-center justify-center text-2xl font-display font-black text-pitch shrink-0">
            {initial}
          </div>
          <div className="flex-1 pt-1">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-ink leading-tight uppercase">
              {profile.fullName}
            </h1>
            {profile.alias && (
              <p className="text-brand text-sm font-semibold mt-1">
                "{profile.alias}"
              </p>
            )}
          </div>
        </div>

        {/* ── Ranking ciudad — hero card ── */}
        {showCityRank && (
          <CityRankCard
            rank={cityPos!.rank}
            total={cityPos!.total}
            cityName={cityPos!.cityName}
            topPercent={egoStats.cityTopPercent}
          />
        )}

        {/* ── Stats hero ── */}
        {hasStats && <StatsHero global={g} />}

        {/* ── Badges ── */}
        {egoStats.badges.length > 0 && (
          <BadgesGrid badges={egoStats.badges} />
        )}

        {/* ── Racha ── */}
        {egoStats.goalStreak > 0 && (
          <StreakCard streak={egoStats.goalStreak} />
        )}

        {/* ── Ligas ── */}
        {profile.leagues.length > 0 && (
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-bold text-ink-2 uppercase tracking-widest px-1">
              Ligas ({profile.leagues.length})
            </p>
            {profile.leagues.map((l) => (
              <LeagueCard
                key={l.leagueId}
                league={l}
                teamShare={shareByLeague.get(l.leagueId)}
              />
            ))}
          </section>
        )}

        {!hasStats && (
          <div className="bg-surface border border-line rounded-2xl p-8 text-center text-ink-2 text-sm">
            Este jugador aún no tiene estadísticas registradas.
          </div>
        )}

        <ShareButton
          url={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/player/${id}`}
          playerName={profile.alias ?? profile.fullName}
        />
      </div>
    </div>
  );
}

// ── Componentes ───────────────────────────────────────────────────────────────

function CityRankCard({
  rank,
  total,
  cityName,
  topPercent,
}: {
  rank: number;
  total: number;
  cityName: string;
  topPercent: number | null;
}) {
  const medal =
    rank === 1 ? "🥇" :
    rank === 2 ? "🥈" :
    rank === 3 ? "🥉" : null;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 flex items-center gap-4">
      <div className="shrink-0 text-center">
        {medal ? (
          <span className="text-5xl leading-none">{medal}</span>
        ) : (
          <span className="font-display font-black text-5xl text-brand leading-none">
            #{rank}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-display font-black text-xl text-ink uppercase leading-tight">
          Goleador de {cityName}
        </p>
        <p className="text-ink-2 text-xs mt-1">
          {topPercent !== null && topPercent <= 10
            ? `Top ${topPercent}% · entre ${total} goleadores`
            : `Entre ${total} goleadores`}
        </p>
      </div>
    </div>
  );
}

function StatsHero({ global: g }: { global: PlayerGlobalProfile }) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-ink-2 text-xs uppercase tracking-widest mb-1">
            {g.totalMatches > 0 ? "Goles por partido" : "Goles totales"}
          </p>
          <p className="font-display font-black text-6xl text-brand leading-none">
            {g.totalMatches > 0 ? g.goalsPerMatch.toFixed(2) : g.totalGoals}
          </p>
        </div>
        <div className="flex gap-4 pb-1">
          <StatPill label="Goles"   value={g.totalGoals}   />
          {g.totalMatches > 0 && (
            <StatPill label="PJ" value={g.totalMatches} />
          )}
          <StatPill label={`Liga${g.leaguesCount !== 1 ? "s" : ""}`} value={g.leaguesCount} />
        </div>
      </div>

      {g.totalContributions > g.totalGoals && (
        <div className="mt-4 pt-4 border-t border-line flex gap-4">
          <StatPill label="Asistencias"  value={g.totalAssists}       />
          <StatPill label="Contribuciones" value={g.totalContributions} accent />
        </div>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <p className={`font-display font-black text-2xl leading-none ${accent ? "text-brand" : "text-ink"}`}>
        {value}
      </p>
      <p className="text-[10px] text-ink-2 mt-0.5">{label}</p>
    </div>
  );
}

const BADGE_CONFIG: Record<PlayerBadge, { icon: string; label: string }> = {
  league_top_scorer: { icon: "🥇", label: "Goleador de liga" },
  multi_league:      { icon: "🌐", label: "Multiligas"       },
  marksman:          { icon: "🎯", label: "Artillero"        },
  on_streak:         { icon: "🔥", label: "En racha"         },
  mvp:               { icon: "🎖️",  label: "MVP"             },
  hat_trick_club:    { icon: "⚽",  label: "Hat-trick"       },
  veteran:           { icon: "🏅", label: "Veterano"         },
};

function BadgesGrid({ badges }: { badges: PlayerBadge[] }) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5">
      <p className="text-[11px] font-bold text-ink-2 uppercase tracking-widest mb-3">
        Logros
      </p>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => {
          const cfg = BADGE_CONFIG[b];
          return (
            <div
              key={b}
              className="flex items-center gap-1.5 bg-surface-2 border border-line rounded-full px-3 py-2"
            >
              <span className="text-base leading-none">{cfg.icon}</span>
              <span className="text-xs font-semibold text-ink">{cfg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StreakCard({ streak }: { streak: number }) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 flex items-center gap-4">
      <span className="text-4xl leading-none shrink-0">🔥</span>
      <div>
        <p className="font-display font-black text-xl text-ink leading-tight">
          {streak} partido{streak !== 1 ? "s" : ""} consecutivo{streak !== 1 ? "s" : ""} anotando
        </p>
        <p className="text-ink-2 text-xs mt-0.5">Racha activa</p>
      </div>
    </div>
  );
}

function LeagueCard({
  league: l,
  teamShare,
}: {
  league: PlayerLeagueStats;
  teamShare?: PlayerTeamGoalShare;
}) {
  const gpmColor =
    l.goalsPerMatch >= 1   ? "text-brand"    :
    l.goalsPerMatch >= 0.5 ? "text-yellow-400" :
                             "text-ink-2";

  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <div className="h-0.5 bg-brand" />

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-ink text-sm">{l.leagueName}</p>
            <p className="text-[11px] text-ink-2 capitalize mt-0.5">
              {l.dayOfWeek} · {l.season}
            </p>
            <p className="text-xs text-ink-3 mt-1">{l.teamName}</p>
          </div>
          {l.goals > 0 && l.matchesPlayed > 0 && (
            <div className="text-right shrink-0">
              <p className={`font-display font-black text-3xl leading-none ${gpmColor}`}>
                {l.goalsPerMatch.toFixed(2)}
              </p>
              <p className="text-[10px] text-ink-2 mt-0.5">goles/PJ</p>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <LeagueStat label="Goles"  value={l.goals}        accent />
          <LeagueStat label="Asist." value={l.assists}       />
          <LeagueStat label="PJ"     value={l.matchesPlayed} />
        </div>

        {/* Participación en goles del equipo */}
        {teamShare && teamShare.sharePercent >= 20 && (
          <TeamShareBar share={teamShare} />
        )}

        {/* Tarjetas */}
        {(l.yellowCards > 0 || l.redCards > 0) && (
          <div className="flex gap-3 text-[11px] text-ink-2">
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

function LeagueStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-2.5 text-center ${accent ? "bg-surface-2" : "bg-surface-2"}`}>
      <p className={`font-display font-black text-xl leading-none ${accent ? "text-brand" : "text-ink"}`}>
        {value}
      </p>
      <p className="text-[10px] text-ink-2 mt-0.5">{label}</p>
    </div>
  );
}

function TeamShareBar({ share }: { share: PlayerTeamGoalShare }) {
  const pct = Math.min(share.sharePercent, 100);
  const barColor =
    pct >= 50 ? "bg-brand"        :
    pct >= 30 ? "bg-yellow-400"   :
                "bg-ink-3";

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-[11px] text-ink-2">
          {share.sharePercent}% de los goles del equipo
        </p>
        <p className="text-[11px] text-ink-3">
          {share.playerGoals}/{share.teamGoals}
        </p>
      </div>
      <div className="h-1 bg-line rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
