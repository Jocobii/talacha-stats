"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, ArrowLeft } from "lucide-react";
import CityFilter from "@/shared/ui/CityFilter";
import type { NarratorAnalysis, RosterPlayer, TeamAnalysis, PositionSimulator, MatchPrediction } from "@/lib/narrator";

type League = { id: string; name: string; dayOfWeek: string; season: string };
type Team   = { id: string; name: string };

export default function AnalysisPage() {
  return (
    <div className="text-ink flex flex-col flex-1">

      <header className="bg-pitch px-5 pt-8 pb-6 max-w-2xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm transition mb-5"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Inicio
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={22} className="text-brand" strokeWidth={2.5} />
          <h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
            Análisis
          </h1>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-ink-2 text-sm">
            Selecciona dos equipos y obtén el análisis completo del partido.
          </p>
          <div className="shrink-0">
            <CityFilter />
          </div>
        </div>
      </header>

      <div className="bg-surface flex-1 rounded-t-3xl px-4 pt-6 pb-16">
        <div className="max-w-2xl mx-auto">
          <Suspense fallback={<p className="text-sm text-ink-3 py-8 text-center">Cargando…</p>}>
            <AnalysisContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [leagues,     setLeagues]     = useState<League[]>([]);
  const [leagueId,    setLeagueId]    = useState("");
  const [leagueTeams, setLeagueTeams] = useState<Team[]>([]);
  const [teamA,       setTeamA]       = useState("");
  const [teamB,       setTeamB]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [analysis,    setAnalysis]    = useState<NarratorAnalysis | null>(null);
  const [copied,      setCopied]      = useState(false);

  const urlParams = useRef<{ leagueId: string; teamA: string; teamB: string } | null>(null);

  const city = searchParams.get("city") ?? "Tijuana";

  useEffect(() => {
    const urlLeague = searchParams.get("leagueId");
    const urlTeamA  = searchParams.get("teamA");
    const urlTeamB  = searchParams.get("teamB");

    if (urlLeague && urlTeamA && urlTeamB) {
      urlParams.current = { leagueId: urlLeague, teamA: urlTeamA, teamB: urlTeamB };
      setLeagueId(urlLeague);
    }

    setLeagueId("");
    setLeagueTeams([]);
    setTeamA("");
    setTeamB("");
    setAnalysis(null);
    fetch(`/api/leagues?city=${encodeURIComponent(city)}`).then(r => r.json()).then(d => setLeagues(d.data ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  useEffect(() => {
    if (!leagueId) { setLeagueTeams([]); return; }

    fetch(`/api/teams?league_id=${leagueId}`)
      .then(r => r.json())
      .then(async (d) => {
        const teams: Team[] = d.data ?? [];
        setLeagueTeams(teams);

        const params = urlParams.current;
        if (params && params.leagueId === leagueId) {
          urlParams.current = null;

          const aExists = teams.some(t => t.id === params.teamA);
          const bExists = teams.some(t => t.id === params.teamB);

          if (!aExists || !bExists) {
            setError(
              !aExists && !bExists
                ? "Los equipos del enlace no se encontraron en esta liga."
                : `El equipo ${!aExists ? "A" : "B"} del enlace no se encontró en esta liga.`
            );
            return;
          }

          setTeamA(params.teamA);
          setTeamB(params.teamB);

          setLoading(true);
          setError("");
          try {
            const res  = await fetch(`/api/narrator?leagueId=${leagueId}&teamA=${params.teamA}&teamB=${params.teamB}`);
            const data = await res.json();
            if (!data.ok) { setError(data.error); return; }
            setAnalysis(data.data);
          } catch {
            setError("Error de red al generar el análisis.");
          } finally {
            setLoading(false);
          }
          return;
        }

        setTeamA("");
        setTeamB("");
        setAnalysis(null);
      });
  }, [leagueId]);

  async function handleAnalyze() {
    if (!teamA || !teamB || !leagueId) { setError("Selecciona liga y dos equipos."); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`/api/narrator?leagueId=${leagueId}&teamA=${teamA}&teamB=${teamB}`);
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      setAnalysis(data.data);
      router.replace(`?leagueId=${leagueId}&teamA=${teamA}&teamB=${teamB}`, { scroll: false });
    } catch {
      setError("Error de red al generar el análisis.");
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  }

  const selectCls = "w-full bg-pitch border border-line text-ink rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand appearance-none cursor-pointer";

  return (
    <div className="space-y-4">
      <div className="bg-surface-2 border border-line rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-2 uppercase tracking-widest mb-2">Liga</label>
          {leagues.length === 0 ? (
            <p className="text-sm text-yellow-500">No hay ligas registradas.</p>
          ) : (
            <select value={leagueId} onChange={e => setLeagueId(e.target.value)} className={selectCls}>
              <option value="">— Seleccionar liga —</option>
              {leagues.map(l => (
                <option key={l.id} value={l.id}>{l.name} · {l.dayOfWeek} · {l.season}</option>
              ))}
            </select>
          )}
        </div>

        {leagueTeams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-2 uppercase tracking-widest mb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1.5" />
                Equipo A
              </label>
              <select value={teamA} onChange={e => setTeamA(e.target.value)} className={selectCls}>
                <option value="">— Seleccionar —</option>
                {leagueTeams.filter(t => t.id !== teamB).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-2 uppercase tracking-widest mb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1.5" />
                Equipo B
              </label>
              <select value={teamB} onChange={e => setTeamB(e.target.value)} className={selectCls}>
                <option value="">— Seleccionar —</option>
                {leagueTeams.filter(t => t.id !== teamA).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-950 border border-red-900 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !teamA || !teamB}
          className="w-full bg-brand hover:bg-brand-dim disabled:opacity-40 text-pitch font-display font-black text-lg uppercase tracking-wide py-3.5 rounded-xl transition"
        >
          {loading ? "Analizando…" : "Generar análisis"}
        </button>
      </div>

      {analysis && (
        <AnalysisPanel
          analysis={analysis}
          leagueId={leagueId}
          teamAId={teamA}
          teamBId={teamB}
          onShare={handleShare}
          copied={copied}
        />
      )}
    </div>
  );
}

function AnalysisPanel({
  analysis,
  leagueId,
  teamAId,
  teamBId,
  onShare,
  copied,
}: {
  analysis: NarratorAnalysis;
  leagueId: string;
  teamAId: string;
  teamBId: string;
  onShare: () => void;
  copied: boolean;
}) {
  const { teamA, teamB, winProbability: prob, headToHead: h2h, narratorBullets, funFacts, positionSimulator, matchPrediction } = analysis;
  const exportParams = `leagueId=${leagueId}&teamA=${teamAId}&teamB=${teamBId}`;

  const actionBtnCls = "flex items-center gap-1.5 bg-surface-2 border border-line text-ink-2 hover:text-ink text-sm font-medium px-4 py-2 rounded-xl transition";

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 flex-wrap">
        <button onClick={onShare} className={actionBtnCls}>
          {copied ? "✅ Copiado" : "🔗 Compartir"}
        </button>
        <a href={`/api/narrator/export?format=pdf&${exportParams}`} download className={actionBtnCls}>
          🖨️ PDF
        </a>
        <a href={`/api/narrator/export?format=png&${exportParams}`} download className={actionBtnCls}>
          🖼️ PNG
        </a>
      </div>

      <div className="bg-pitch border border-line rounded-2xl p-5 text-center">
        <p className="text-xs text-ink-3 uppercase tracking-widest mb-1">
          {analysis.league.name} · {analysis.league.season}
        </p>
        {analysis.lastMatchday != null && (
          <p className="text-xs text-ink-3 mb-3">
            Datos hasta la jornada <span className="font-semibold text-ink-2">{analysis.lastMatchday}</span>
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <div className="text-right flex-1 min-w-0">
            <p className="text-base sm:text-xl font-display font-black text-blue-400 leading-tight break-words">{teamA.team.name}</p>
            {teamA.position && <p className="text-xs text-ink-3 mt-0.5">{teamA.position}° en tabla</p>}
          </div>
          <div className="font-display font-black text-xl text-ink-3 shrink-0 px-1">VS</div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-base sm:text-xl font-display font-black text-red-400 leading-tight break-words">{teamB.team.name}</p>
            {teamB.position && <p className="text-xs text-ink-3 mt-0.5">{teamB.position}° en tabla</p>}
          </div>
        </div>
      </div>

      <WinProbBar prob={prob} nameA={teamA.team.name} nameB={teamB.team.name} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeamCard team={teamA} color="blue" />
        <TeamCard team={teamB} color="red" />
      </div>

      <PredictionCard pred={matchPrediction} nameA={teamA.team.name} nameB={teamB.team.name} />

      <PositionSimulatorCard sim={positionSimulator} nameA={teamA.team.name} nameB={teamB.team.name} />

      <ScoringThreatsCard teamA={teamA} teamB={teamB} />

      <section className="bg-surface-2 border border-line rounded-2xl p-5">
        <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-3">🎙️ Guión del narrador</h2>
        <ul className="space-y-2">
          {narratorBullets.map((b, i) => (
            <li key={i} className="text-sm text-ink-2 bg-pitch border border-line rounded-xl px-4 py-2.5">{b}</li>
          ))}
        </ul>
      </section>

      {funFacts.length > 0 && (
        <section className="bg-surface-2 border border-line rounded-2xl p-5">
          <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-3">💡 Datos curiosos</h2>
          <ul className="space-y-2">
            {funFacts.map((f, i) => (
              <li key={i} className="text-sm text-ink-2 flex gap-2">
                <span className="text-brand shrink-0">★</span>{f}
              </li>
            ))}
          </ul>
        </section>
      )}

      <HeadToHeadCard h2h={h2h} nameA={teamA.team.name} nameB={teamB.team.name} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RosterTable team={teamA} color="blue" />
        <RosterTable team={teamB} color="red" />
      </div>
    </div>
  );
}

function WinProbBar({ prob, nameA, nameB }: { prob: NarratorAnalysis["winProbability"]; nameA: string; nameB: string }) {
  return (
    <div className="bg-surface-2 border border-line rounded-2xl p-5">
      <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-3">Probabilidad de victoria</h2>
      <div className="flex rounded-full overflow-hidden h-9 text-xs font-bold">
        <div className="flex items-center justify-center bg-blue-600 text-white" style={{ width: `${prob.aWinPct}%` }}>{prob.aWinPct}%</div>
        <div className="flex items-center justify-center bg-surface text-ink-3" style={{ width: `${prob.drawPct}%` }}>{prob.drawPct > 8 ? `${prob.drawPct}%` : ""}</div>
        <div className="flex items-center justify-center bg-red-600 text-white" style={{ width: `${prob.bWinPct}%` }}>{prob.bWinPct}%</div>
      </div>
      <div className="flex justify-between text-xs mt-2 px-0.5">
        <span className="text-blue-400 font-semibold">{nameA}</span>
        <span className="text-ink-3">Empate</span>
        <span className="text-red-400 font-semibold">{nameB}</span>
      </div>
    </div>
  );
}

function TeamCard({ team, color }: { team: TeamAnalysis; color: "blue" | "red" }) {
  const accent    = color === "blue" ? "text-blue-400"  : "text-red-400";
  const topBorder = color === "blue" ? "border-t-blue-500" : "border-t-red-500";
  const statBg    = color === "blue" ? "bg-blue-950 border-blue-900" : "bg-red-950 border-red-900";
  const statVal   = color === "blue" ? "text-blue-300" : "text-red-300";

  return (
    <div className={`bg-surface-2 border border-line border-t-2 ${topBorder} rounded-2xl p-5`}>
      <h3 className={`font-display font-black text-2xl ${accent} mb-3 uppercase tracking-wide`}>{team.team.name}</h3>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: "PTS", value: team.points },
          { label: "G",   value: team.record.wins },
          { label: "E",   value: team.record.draws },
          { label: "P",   value: team.record.losses },
        ].map(s => (
          <div key={s.label} className={`${statBg} border rounded-lg p-2 text-center`}>
            <p className={`text-xl font-display font-black ${statVal}`}>{s.value}</p>
            <p className="text-[10px] text-ink-3 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-3 text-sm flex-wrap">
        <span className="text-ink-3">GF <strong className="text-ink">{team.goalsFor}</strong></span>
        <span className="text-line">|</span>
        <span className="text-ink-3">GC <strong className="text-ink">{team.goalsAgainst}</strong></span>
        <span className="text-line">|</span>
        <span className="text-ink-3">Dif <strong className={team.goalDiff >= 0 ? "text-brand" : "text-red-400"}>{team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}</strong></span>
        <span className="text-line">|</span>
        <span className="text-ink-3">Prom <strong className="text-ink">{team.avgGoalsFor}</strong></span>
      </div>

      {team.last5.length > 0 && (
        <div className="flex gap-1 mb-3">
          <span className="text-xs text-ink-3 mr-1 self-center">Últ. {team.last5.length}:</span>
          {team.last5.map((r, i) => (
            <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
              ${r === "W" ? "bg-green-600" : r === "D" ? "bg-surface border border-line text-ink-2" : "bg-red-600"}`}>
              {r === "W" ? "G" : r === "D" ? "E" : "P"}
            </span>
          ))}
        </div>
      )}

      {team.currentStreak && (
        <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mb-3
          ${team.currentStreak.type === "W" ? "bg-green-950 text-green-400 border border-green-900" :
            team.currentStreak.type === "D" ? "bg-surface text-ink-2 border border-line" :
            "bg-red-950 text-red-400 border border-red-900"}`}>
          🔥 Racha: {team.currentStreak.count} {{ W: "victorias", D: "empates", L: "derrotas" }[team.currentStreak.type]}
        </div>
      )}

      {(team.attackRank !== null || team.defenseRank !== null) && team.totalTeams > 2 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {team.attackRank !== null && (() => {
            const t = team.totalTeams, r = team.attackRank;
            const [label, cls] =
              r <= Math.ceil(t / 3)   ? ["Ataque fuerte",  "bg-green-950 text-green-400 border-green-900"] :
              r <= Math.ceil(t * 2/3) ? ["Ataque regular", "bg-yellow-950 text-yellow-400 border-yellow-900"] :
                                        ["Ataque flojo",   "bg-red-950 text-red-400 border-red-900"];
            return <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cls}`}>⚔️ {label} ({r}/{t})</span>;
          })()}
          {team.defenseRank !== null && (() => {
            const t = team.totalTeams, r = team.defenseRank;
            const [label, cls] =
              r <= Math.ceil(t / 3)   ? ["Defensa sólida",  "bg-green-950 text-green-400 border-green-900"] :
              r <= Math.ceil(t * 2/3) ? ["Defensa regular", "bg-yellow-950 text-yellow-400 border-yellow-900"] :
                                        ["Defensa débil",   "bg-red-950 text-red-400 border-red-900"];
            return <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cls}`}>🛡️ {label} ({r}/{t})</span>;
          })()}
        </div>
      )}

      <div className="space-y-1.5 border-t border-line pt-3">
        {team.topScorer && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-brand">⚽</span>
            <span className="text-ink-2">{playerDisplay(team.topScorer)}</span>
            <span className="ml-auto text-ink-3">{team.topScorer.goals} goles</span>
          </div>
        )}
        {team.topAssist && team.topAssist.playerId !== team.topScorer?.playerId && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-400">🎯</span>
            <span className="text-ink-2">{playerDisplay(team.topAssist)}</span>
            <span className="ml-auto text-ink-3">{team.topAssist.assists} asist.</span>
          </div>
        )}
        {team.cardRisk.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span>🟨</span>
            <span className="text-ink-2">{team.cardRisk[0].player}</span>
            <span className="ml-auto text-xs text-yellow-400">{team.cardRisk[0].note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function HeadToHeadCard({ h2h, nameA, nameB }: { h2h: NarratorAnalysis["headToHead"]; nameA: string; nameB: string }) {
  if (h2h.total === 0) {
    return (
      <div className="bg-surface-2 border border-line rounded-2xl p-5 text-sm text-ink-3 text-center">
        Sin enfrentamientos previos registrados entre estos equipos.
      </div>
    );
  }
  return (
    <div className="bg-surface-2 border border-line rounded-2xl p-5">
      <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-4">📋 Cara a cara</h2>
      <div className="flex items-center justify-center gap-6">
        <div className="text-center flex-1">
          <p className="font-display font-black text-5xl text-blue-400">{h2h.aWins}</p>
          <p className="text-xs text-ink-3 mt-1">{nameA}</p>
        </div>
        <div className="text-center">
          <p className="font-display font-black text-4xl text-ink-3">{h2h.draws}</p>
          <p className="text-xs text-ink-3">Empates</p>
        </div>
        <div className="text-center flex-1">
          <p className="font-display font-black text-5xl text-red-400">{h2h.bWins}</p>
          <p className="text-xs text-ink-3 mt-1">{nameB}</p>
        </div>
      </div>
      {h2h.lastMatch && (
        <p className="text-center text-xs text-ink-3 mt-4 border-t border-line pt-3">
          Último: <strong className="text-ink">{h2h.lastMatch.aGoals}–{h2h.lastMatch.bGoals}</strong> ({h2h.lastMatch.result}) · {h2h.lastMatch.date}
        </p>
      )}
    </div>
  );
}

function RosterTable({ team, color }: { team: TeamAnalysis; color: "blue" | "red" }) {
  if (team.roster.length === 0) return null;
  const accent = color === "blue" ? "text-blue-400 border-t-blue-500" : "text-red-400 border-t-red-500";

  return (
    <div className={`bg-surface-2 border border-line border-t-2 ${accent} rounded-2xl overflow-hidden`}>
      <div className="px-4 py-3 border-b border-line">
        <h3 className={`font-display font-black text-lg uppercase tracking-wide ${color === "blue" ? "text-blue-400" : "text-red-400"}`}>
          {team.team.name}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-pitch text-ink-3 uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-semibold tracking-wide">Jugador</th>
              <th className="px-2 py-2 text-center">⚽</th>
              <th className="px-2 py-2 text-center">🤝</th>
              <th className="px-2 py-2 text-center">🟨</th>
              <th className="px-2 py-2 text-center">🟥</th>
              <th className="px-2 py-2 text-center">PJ</th>
              <th className="px-2 py-2 text-center">Peligro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {team.roster.map(p => (
              <tr key={p.playerId} className={`hover:bg-pitch transition ${p.contributions === 0 ? "opacity-40" : ""}`}>
                <td className="px-3 py-2 font-medium text-ink max-w-[130px] truncate">
                  {p.alias ? `"${p.alias}"` : p.fullName}
                  {p.alias && <span className="block text-ink-3 text-[10px]">{p.fullName}</span>}
                </td>
                <td className="px-2 py-2 text-center font-bold text-brand">{p.goals || "—"}</td>
                <td className="px-2 py-2 text-center font-bold text-ink-2">{p.contributions || "—"}</td>
                <td className="px-2 py-2 text-center text-yellow-400">{p.yellowCards || "—"}</td>
                <td className="px-2 py-2 text-center text-red-400">{p.redCards || "—"}</td>
                <td className="px-2 py-2 text-center text-ink-3">{p.matchesPlayed || "—"}</td>
                <td className="px-2 py-2 text-center"><DangerBadge rating={p.dangerRating} goals={p.goals} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PredictionCard({ pred, nameA, nameB }: { pred: MatchPrediction; nameA: string; nameB: string }) {
  if (!pred.hasData) return null;

  const totalLabels = {
    cerrado:  { text: "Partido cerrado",   cls: "bg-blue-950 text-blue-400 border border-blue-900" },
    abierto:  { text: "Partido abierto",   cls: "bg-yellow-950 text-yellow-400 border border-yellow-900" },
    festival: { text: "Festival de goles", cls: "bg-red-950 text-red-400 border border-red-900" },
  };
  const tl = totalLabels[pred.totalLabel];
  const edgeLabel = (edge: "A" | "B" | "equal", nA: string, nB: string) =>
    edge === "A" ? nA : edge === "B" ? nB : "Equilibrado";

  return (
    <div className="bg-surface-2 border border-line rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink">🔮 Predicción</h2>
        <span className="text-[10px] text-ink-3 italic">Estimación basada en promedios</span>
      </div>

      <div className="text-center">
        <p className="text-xs text-ink-3 uppercase tracking-widest mb-2">Marcador más probable</p>
        <div className="flex items-center justify-center gap-4">
          <div className="text-right">
            <p className="font-display font-black text-5xl text-blue-400">{pred.likelyScoreA}</p>
            <p className="text-xs text-ink-3 mt-0.5">{nameA}</p>
          </div>
          <span className="font-display font-black text-3xl text-line">–</span>
          <div className="text-left">
            <p className="font-display font-black text-5xl text-red-400">{pred.likelyScoreB}</p>
            <p className="text-xs text-ink-3 mt-0.5">{nameB}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-blue-950 border border-blue-900 rounded-xl p-3">
          <p className="font-display font-black text-3xl text-blue-400">{pred.expectedGoalsA}</p>
          <p className="text-[10px] text-ink-3 mt-0.5">Goles esp.</p>
        </div>
        <div className="bg-pitch border border-line rounded-xl p-3 flex flex-col items-center justify-center gap-1">
          <p className="font-display font-black text-2xl text-ink">{pred.expectedTotal}</p>
          <p className="text-[10px] text-ink-3">Total</p>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${tl.cls}`}>{tl.text}</span>
        </div>
        <div className="bg-red-950 border border-red-900 rounded-xl p-3">
          <p className="font-display font-black text-3xl text-red-400">{pred.expectedGoalsB}</p>
          <p className="text-[10px] text-ink-3 mt-0.5">Goles esp.</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-line pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-3">¿Ambos anotarán?</span>
          <span className={`font-semibold ${pred.bothTeamsToScore ? "text-brand" : "text-ink-3"}`}>
            {pred.bothTeamsToScore ? "Probable que sí" : "No garantizado"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-3">Ventaja ofensiva</span>
          <span className="font-semibold text-ink">{edgeLabel(pred.offensiveEdge, nameA, nameB)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-3">Ventaja defensiva</span>
          <span className="font-semibold text-ink">{edgeLabel(pred.defensiveEdge, nameA, nameB)}</span>
        </div>
      </div>
    </div>
  );
}

function PositionSimulatorCard({ sim, nameA, nameB }: { sim: PositionSimulator; nameA: string; nameB: string }) {
  if (sim.teamA.currentPosition === null && sim.teamB.currentPosition === null) return null;

  function PosDelta({ from, to }: { from: number | null; to: number | null }) {
    if (from === null || to === null) return <span className="text-ink-3">—</span>;
    const delta = from - to;
    if (delta > 0) return <span className="text-brand font-bold">{to}° ↑{delta}</span>;
    if (delta < 0) return <span className="text-red-400 font-bold">{to}° ↓{Math.abs(delta)}</span>;
    return <span className="text-ink-2 font-bold">{to}° =</span>;
  }

  return (
    <div className="bg-surface-2 border border-line rounded-2xl p-5">
      <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-4">📈 Simulador de posición</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          { name: nameA, s: sim.teamA, color: "blue" },
          { name: nameB, s: sim.teamB, color: "red" },
        ] as const).map(({ name, s, color }) => (
          <div key={name} className={`rounded-xl border p-4 ${color === "blue" ? "bg-blue-950 border-blue-900" : "bg-red-950 border-red-900"}`}>
            <p className={`font-display font-black text-lg uppercase mb-1 ${color === "blue" ? "text-blue-400" : "text-red-400"}`}>{name}</p>
            <p className="text-xs text-ink-3 mb-3">
              Posición: <strong className="text-ink">{s.currentPosition ?? "—"}°</strong> · {s.currentPoints} pts
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-ink-3">Si gana</span>
                <PosDelta from={s.currentPosition} to={s.ifWin} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-3">Si empata</span>
                <PosDelta from={s.currentPosition} to={s.ifDraw} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-3">Si pierde</span>
                <PosDelta from={s.currentPosition} to={s.ifLoss} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoringThreatsCard({ teamA, teamB }: { teamA: TeamAnalysis; teamB: TeamAnalysis }) {
  const hasThreats = teamA.topScoringThreats.length > 0 || teamB.topScoringThreats.length > 0;
  if (!hasThreats) return null;

  return (
    <div className="bg-surface-2 border border-line rounded-2xl p-5">
      <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-4">🎯 Amenazas goleadoras</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          { team: teamA, color: "blue" },
          { team: teamB, color: "red" },
        ] as const).map(({ team, color }) => (
          <div key={team.team.id}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${color === "blue" ? "text-blue-400" : "text-red-400"}`}>
              {team.team.name}
            </p>
            {team.topScoringThreats.length === 0 ? (
              <p className="text-xs text-ink-3">Sin datos de goles</p>
            ) : (
              <div className="space-y-2">
                {team.topScoringThreats.map((p, i) => (
                  <div key={p.playerId} className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0
                      ${i === 0 ? (color === "blue" ? "bg-blue-500" : "bg-red-500") : "bg-surface border border-line text-ink-3"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{playerDisplay(p)}</p>
                      <p className="text-xs text-ink-3">{p.goals} goles · {p.goalsPerMatch} x partido</p>
                    </div>
                    <DangerBadge rating={p.dangerRating} goals={p.goals} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DangerBadge({ rating, goals }: { rating: string; goals: number }) {
  if (goals === 0) return <span className="text-ink-3 text-[10px]">—</span>;
  const styles = {
    ALTO:  "bg-red-950 text-red-400 border-red-900",
    MEDIO: "bg-yellow-950 text-yellow-400 border-yellow-900",
    BAJO:  "bg-surface text-ink-3 border-line",
  }[rating] ?? "bg-surface text-ink-3 border-line";
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${styles}`}>{rating}</span>;
}

function playerDisplay(p: RosterPlayer) {
  return p.alias ? `"${p.alias}"` : p.fullName;
}
