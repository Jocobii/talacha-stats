"use client";

import { useState, useEffect } from "react";
import type { NarratorAnalysis, RosterPlayer, TeamAnalysis } from "@/lib/narrator";

type League = { id: string; name: string; dayOfWeek: string; season: string };
type Team   = { id: string; name: string };

// ────────────────────────────────────────────────────────────────────────────
// Página principal
// ────────────────────────────────────────────────────────────────────────────

export default function AnalisisPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueId, setLeagueId] = useState("");
  const [leagueTeams, setLeagueTeams] = useState<Team[]>([]);
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<NarratorAnalysis | null>(null);

  useEffect(() => {
    fetch("/api/leagues").then(r => r.json()).then(d => setLeagues(d.data ?? []));
  }, []);

  useEffect(() => {
    if (!leagueId) { setLeagueTeams([]); return; }
    fetch(`/api/teams?league_id=${leagueId}`)
      .then(r => r.json())
      .then(d => setLeagueTeams(d.data ?? []));
    setTeamA("");
    setTeamB("");
    setAnalysis(null);
  }, [leagueId]);

  async function handleAnalyze() {
    if (!teamA || !teamB || !leagueId) { setError("Selecciona liga y dos equipos."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/narrator?leagueId=${leagueId}&teamA=${teamA}&teamB=${teamB}`);
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      setAnalysis(data.data);
    } catch {
      setError("Error de red al generar el análisis.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 Análisis de partido</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona dos equipos y obtén el análisis completo del partido.
        </p>
      </div>

      {/* Selector */}
      <div className="bg-white rounded-xl shadow p-5 space-y-4">
        {/* Liga */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Liga</label>
          {leagues.length === 0 ? (
            <p className="text-sm text-yellow-600">No hay ligas registradas.</p>
          ) : (
            <select value={leagueId} onChange={e => setLeagueId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
              <option value="">— Seleccionar liga —</option>
              {leagues.map(l => (
                <option key={l.id} value={l.id}>{l.name} · {l.dayOfWeek} · {l.season}</option>
              ))}
            </select>
          )}
        </div>

        {/* Dos equipos */}
        {leagueTeams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1.5" />
                Equipo A
              </label>
              <select value={teamA} onChange={e => setTeamA(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none">
                <option value="">— Seleccionar —</option>
                {leagueTeams.filter(t => t.id !== teamB).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1.5" />
                Equipo B
              </label>
              <select value={teamB} onChange={e => setTeamB(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none">
                <option value="">— Seleccionar —</option>
                {leagueTeams.filter(t => t.id !== teamA).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          onClick={handleAnalyze}
          disabled={loading || !teamA || !teamB}
          className="bg-green-600 text-white px-8 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition">
          {loading ? "Analizando…" : "🔍 Generar análisis"}
        </button>
      </div>

      {/* Resultados */}
      {analysis && (
        <AnalysisPanel
          analysis={analysis}
          leagueId={leagueId}
          teamAId={teamA}
          teamBId={teamB}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Panel de análisis
// ────────────────────────────────────────────────────────────────────────────

function AnalysisPanel({
  analysis,
  leagueId,
  teamAId,
  teamBId,
}: {
  analysis: NarratorAnalysis;
  leagueId: string;
  teamAId: string;
  teamBId: string;
}) {
  const { teamA, teamB, winProbability: prob, headToHead: h2h, narratorBullets, funFacts } = analysis;

  const exportParams = `leagueId=${leagueId}&teamA=${teamAId}&teamB=${teamBId}`;

  return (
    <div className="space-y-5">
      {/* Botones de exportar — llaman directamente al API */}
      <div className="flex justify-end gap-2">
        <a
          href={`/api/narrator/export?format=pdf&${exportParams}`}
          download
          className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm">
          🖨️ Exportar PDF
        </a>
        <a
          href={`/api/narrator/export?format=png&${exportParams}`}
          download
          className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm">
          🖼️ Exportar PNG
        </a>
      </div>

      <div className="space-y-5">

      {/* Encabezado del partido */}
      <div className="bg-gray-900 text-white rounded-xl p-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
          {analysis.league.name} · {analysis.league.season}
        </p>
        <div className="flex items-center justify-center gap-3">
          <div className="text-right flex-1 min-w-0">
            <p className="text-base sm:text-xl font-black text-blue-300 leading-tight break-words">
              {teamA.team.name}
            </p>
            {teamA.position && <p className="text-xs text-gray-400 mt-0.5">{teamA.position}° en tabla</p>}
          </div>
          <div className="text-lg font-black text-gray-500 shrink-0 px-1">VS</div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-base sm:text-xl font-black text-red-300 leading-tight break-words">
              {teamB.team.name}
            </p>
            {teamB.position && <p className="text-xs text-gray-400 mt-0.5">{teamB.position}° en tabla</p>}
          </div>
        </div>
      </div>

      {/* Probabilidad de victoria */}
      <WinProbBar prob={prob} nameA={teamA.team.name} nameB={teamB.team.name} />

      {/* Forma de los equipos (lado a lado) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeamCard team={teamA} color="blue" />
        <TeamCard team={teamB} color="red" />
      </div>

      {/* Bullets del narrador */}
      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="font-bold text-gray-800 mb-3 text-base">🎙️ Guión del narrador</h2>
        <ul className="space-y-2">
          {narratorBullets.map((b, i) => (
            <li key={i} className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
              {b}
            </li>
          ))}
        </ul>
      </section>

      {/* Datos curiosos */}
      {funFacts.length > 0 && (
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="font-bold text-gray-800 mb-3 text-base">💡 Datos curiosos</h2>
          <ul className="space-y-2">
            {funFacts.map((f, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-yellow-500 shrink-0">★</span>
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Head to head */}
      <HeadToHeadCard h2h={h2h} nameA={teamA.team.name} nameB={teamB.team.name} />

      {/* Planteles completos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RosterTable team={teamA} color="blue" />
        <RosterTable team={teamB} color="red" />
      </div>

      </div>{/* fin printRef */}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Barra de probabilidad
// ────────────────────────────────────────────────────────────────────────────

function WinProbBar({ prob, nameA, nameB }: {
  prob: NarratorAnalysis["winProbability"];
  nameA: string;
  nameB: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Probabilidad de victoria</h2>
      <div className="flex rounded-full overflow-hidden h-8 text-xs font-bold">
        <div className="flex items-center justify-center bg-blue-500 text-white transition-all"
          style={{ width: `${prob.aWinPct}%` }}>
          {prob.aWinPct}%
        </div>
        <div className="flex items-center justify-center bg-gray-300 text-gray-700"
          style={{ width: `${prob.drawPct}%` }}>
          {prob.drawPct > 8 ? `${prob.drawPct}%` : ""}
        </div>
        <div className="flex items-center justify-center bg-red-500 text-white"
          style={{ width: `${prob.bWinPct}%` }}>
          {prob.bWinPct}%
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1.5 px-0.5">
        <span className="text-blue-600 font-medium">{nameA}</span>
        <span>Empate</span>
        <span className="text-red-600 font-medium">{nameB}</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tarjeta de equipo
// ────────────────────────────────────────────────────────────────────────────

function TeamCard({ team, color }: { team: TeamAnalysis; color: "blue" | "red" }) {
  const accent = color === "blue" ? "text-blue-600" : "text-red-600";
  const bg     = color === "blue" ? "bg-blue-50" : "bg-red-50";
  const border = color === "blue" ? "border-blue-100" : "border-red-100";

  const last5 = team.last5;

  return (
    <div className={`bg-white rounded-xl shadow p-5 border-t-4 ${color === "blue" ? "border-blue-500" : "border-red-500"}`}>
      <h3 className={`font-black text-lg ${accent} mb-3`}>{team.team.name}</h3>

      {/* Récord */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: "PTS", value: team.points },
          { label: "G",   value: team.record.wins },
          { label: "E",   value: team.record.draws },
          { label: "P",   value: team.record.losses },
        ].map(s => (
          <div key={s.label} className={`${bg} ${border} border rounded-lg p-2 text-center`}>
            <p className="text-xl font-black text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Goles */}
      <div className="flex gap-3 mb-3 text-sm">
        <span className="text-gray-500">GF <strong className="text-gray-800">{team.goalsFor}</strong></span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">GC <strong className="text-gray-800">{team.goalsAgainst}</strong></span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">Dif <strong className={team.goalDiff >= 0 ? "text-green-600" : "text-red-500"}>{team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}</strong></span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">Prom <strong className="text-gray-800">{team.avgGoalsFor}</strong></span>
      </div>

      {/* Últimos 5 */}
      {last5.length > 0 && (
        <div className="flex gap-1 mb-3">
          <span className="text-xs text-gray-400 mr-1 self-center">Últ. {last5.length}:</span>
          {last5.map((r, i) => (
            <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
              ${r === "W" ? "bg-green-500" : r === "D" ? "bg-gray-400" : "bg-red-400"}`}>
              {r === "W" ? "G" : r === "D" ? "E" : "P"}
            </span>
          ))}
        </div>
      )}

      {/* Racha */}
      {team.currentStreak && (
        <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mb-3
          ${team.currentStreak.type === "W" ? "bg-green-100 text-green-700" :
            team.currentStreak.type === "D" ? "bg-gray-100 text-gray-600" :
            "bg-red-100 text-red-600"}`}>
          🔥 Racha: {team.currentStreak.count} {
            { W: "victorias", D: "empates", L: "derrotas" }[team.currentStreak.type]
          }
        </div>
      )}

      {/* Top jugadores */}
      <div className="space-y-1.5">
        {team.topScorer && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600">⚽</span>
            <span className="text-gray-700 font-medium">{playerDisplay(team.topScorer)}</span>
            <span className="ml-auto text-gray-500">{team.topScorer.goals} goles</span>
          </div>
        )}
        {team.topAssist && team.topAssist.playerId !== team.topScorer?.playerId && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-500">🎯</span>
            <span className="text-gray-700 font-medium">{playerDisplay(team.topAssist)}</span>
            <span className="ml-auto text-gray-500">{team.topAssist.assists} asist.</span>
          </div>
        )}
        {team.cardRisk.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span>🟨</span>
            <span className="text-gray-700">{team.cardRisk[0].player}</span>
            <span className="ml-auto text-xs text-yellow-700">{team.cardRisk[0].note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Head to head
// ────────────────────────────────────────────────────────────────────────────

function HeadToHeadCard({ h2h, nameA, nameB }: {
  h2h: NarratorAnalysis["headToHead"];
  nameA: string;
  nameB: string;
}) {
  if (h2h.total === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-5 text-sm text-gray-400 text-center">
        Sin enfrentamientos previos registrados entre estos equipos.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="font-bold text-gray-800 mb-3 text-base">📋 Historial cara a cara</h2>
      <div className="flex items-center justify-center gap-6">
        <div className="text-center flex-1">
          <p className="text-4xl font-black text-blue-600">{h2h.aWins}</p>
          <p className="text-xs text-gray-500">{nameA}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black text-gray-400">{h2h.draws}</p>
          <p className="text-xs text-gray-500">Empates</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-4xl font-black text-red-500">{h2h.bWins}</p>
          <p className="text-xs text-gray-500">{nameB}</p>
        </div>
      </div>
      {h2h.lastMatch && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Último enfrentamiento: <strong>{h2h.lastMatch.aGoals}–{h2h.lastMatch.bGoals}</strong>
          {" "}({h2h.lastMatch.result}) · {h2h.lastMatch.date}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tabla de plantel completo
// ────────────────────────────────────────────────────────────────────────────

function RosterTable({ team, color }: { team: TeamAnalysis; color: "blue" | "red" }) {
  if (team.roster.length === 0) return null;

  const borderColor = color === "blue" ? "border-blue-500" : "border-red-500";
  const headerColor = color === "blue" ? "text-blue-700" : "text-red-700";

  return (
    <div className={`bg-white rounded-xl shadow overflow-hidden border-t-4 ${borderColor}`}>
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className={`font-bold text-sm ${headerColor}`}>{team.team.name} — Plantel</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Jugador</th>
              <th className="px-2 py-2 text-center">⚽</th>
              <th className="px-2 py-2 text-center">🎯</th>
              <th className="px-2 py-2 text-center">🤝</th>
              <th className="px-2 py-2 text-center">🟨</th>
              <th className="px-2 py-2 text-center">🟥</th>
              <th className="px-2 py-2 text-center">PJ</th>
              <th className="px-2 py-2 text-center">Peligro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {team.roster.map(p => (
              <tr key={p.playerId} className={`hover:bg-gray-50 ${p.contributions === 0 ? "opacity-50" : ""}`}>
                <td className="px-3 py-2 font-medium text-gray-800 max-w-[130px] truncate">
                  {p.alias ? (
                    <><span className="text-gray-400 mr-1">"{p.alias}"</span></>
                  ) : p.fullName}
                  {p.alias && <span className="block text-gray-400 text-[10px]">{p.fullName}</span>}
                </td>
                <td className="px-2 py-2 text-center font-bold text-green-600">{p.goals || "—"}</td>
                <td className="px-2 py-2 text-center text-blue-500">{p.assists || "—"}</td>
                <td className="px-2 py-2 text-center font-bold text-gray-700">{p.contributions || "—"}</td>
                <td className="px-2 py-2 text-center text-yellow-600">{p.yellowCards || "—"}</td>
                <td className="px-2 py-2 text-center text-red-600">{p.redCards || "—"}</td>
                <td className="px-2 py-2 text-center text-gray-400">{p.matchesPlayed || "—"}</td>
                <td className="px-2 py-2 text-center">
                  <DangerBadge rating={p.dangerRating} goals={p.goals} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DangerBadge({ rating, goals }: { rating: string; goals: number }) {
  if (goals === 0) return <span className="text-gray-300 text-[10px]">—</span>;
  const styles = {
    ALTO:  "bg-red-100 text-red-700",
    MEDIO: "bg-yellow-100 text-yellow-700",
    BAJO:  "bg-gray-100 text-gray-500",
  }[rating] ?? "bg-gray-100 text-gray-400";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${styles}`}>
      {rating}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function playerDisplay(p: RosterPlayer) {
  return p.alias ? `"${p.alias}"` : p.fullName;
}
