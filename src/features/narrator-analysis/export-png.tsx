/**
 * export-png.tsx — Genera una imagen PNG (800×1500) con el análisis completo
 * del narrador usando next/og (satori). Diseñado para compartir por WhatsApp
 * o Messenger antes del partido.
 *
 * Devuelve un React element compatible con ImageResponse de next/og.
 */

import type { NarratorAnalysis } from "@/lib/narrator";
import React from "react";

// ── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  dark:    "#111827",
  darkBg:  "#1f2937",
  blue:    "#3b82f6",
  blueDk:  "#1d4ed8",
  red:     "#ef4444",
  redDk:   "#dc2626",
  green:   "#22c55e",
  yellow:  "#eab308",
  gray:    "#9ca3af",
  lgray:   "#d1d5db",
  white:   "#ffffff",
  bg:      "#f3f4f6",
  cardBg:  "#ffffff",
};

function displayName(p: { fullName: string; alias: string | null }): string {
  return p.alias ? `"${p.alias}"` : p.fullName;
}

// ── Componentes satori (solo flexbox, estilos inline) ────────────────────────

function Section({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: C.cardBg,
        borderRadius: 12,
        padding: "16px 20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: C.dark,
        marginBottom: 10,
      }}
    >
      {children}
    </span>
  );
}

// ── Layout principal ──────────────────────────────────────────────────────────

export function buildNarratorPngElement(
  analysis: NarratorAnalysis,
): React.ReactElement {
  const { teamA: a, teamB: b, winProbability: prob, headToHead: h2h } = analysis;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: C.bg,
        padding: 24,
        gap: 14,
        fontFamily: "sans-serif",
      }}
    >
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          background: C.dark,
          borderRadius: 14,
          padding: "20px 24px",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 11, color: C.gray, letterSpacing: 2 }}>
          {analysis.league.name.toUpperCase()} · {analysis.league.season}
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginTop: 4,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#93c5fd" }}>
              {a.team.name}
            </span>
            {a.position != null && (
              <span style={{ fontSize: 11, color: C.gray }}>
                {a.position}° en tabla
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#4b5563",
              padding: "0 20px",
            }}
          >
            VS
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              alignItems: "flex-end",
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 900, color: "#fca5a5" }}>
              {b.team.name}
            </span>
            {b.position != null && (
              <span style={{ fontSize: 11, color: C.gray }}>
                {b.position}° en tabla
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Probabilidad ────────────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Probabilidad de victoria</SectionTitle>
        <div
          style={{
            display: "flex",
            borderRadius: 8,
            overflow: "hidden",
            height: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              background: C.blueDk,
              width: `${prob.aWinPct}%`,
              alignItems: "center",
              justifyContent: "center",
              color: C.white,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {prob.aWinPct}%
          </div>
          <div
            style={{
              display: "flex",
              background: "#d1d5db",
              width: `${prob.drawPct}%`,
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              fontSize: 11,
            }}
          >
            {prob.drawPct > 8 ? `${prob.drawPct}%` : ""}
          </div>
          <div
            style={{
              display: "flex",
              background: C.redDk,
              width: `${prob.bWinPct}%`,
              alignItems: "center",
              justifyContent: "center",
              color: C.white,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {prob.bWinPct}%
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 5,
          }}
        >
          <span style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>
            {a.team.name}
          </span>
          <span style={{ fontSize: 11, color: C.gray }}>Empate</span>
          <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>
            {b.team.name}
          </span>
        </div>
      </Section>

      {/* ── Tarjetas de equipo ───────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 14 }}>
        <TeamCard team={a} color="blue" />
        <TeamCard team={b} color="red" />
      </div>

      {/* ── Predicción del partido ──────────────────────────────────────── */}
      {analysis.matchPrediction.hasData && (() => {
        const pred = analysis.matchPrediction;
        const totalLabelMap = { cerrado: "Partido cerrado", abierto: "Partido abierto", festival: "Festival de goles" };
        const totalColor = { cerrado: "#1d4ed8", abierto: "#b45309", festival: "#dc2626" }[pred.totalLabel];
        const edgeLabel = (e: string) => e === "A" ? a.team.name : e === "B" ? b.team.name : "Equilibrado";
        return (
          <Section>
            <SectionTitle>Prediccion del partido</SectionTitle>
            {/* Marcador */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: C.blueDk }}>{pred.likelyScoreA}</span>
                <span style={{ fontSize: 10, color: C.gray }}>{a.team.name}</span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: C.lgray }}>—</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: C.redDk }}>{pred.likelyScoreB}</span>
                <span style={{ fontSize: 10, color: C.gray }}>{b.team.name}</span>
              </div>
            </div>
            {/* Goles esperados */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, background: "#eff6ff", borderRadius: 8, padding: "6px 0" }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: C.blueDk }}>{pred.expectedGoalsA}</span>
                <span style={{ fontSize: 9, color: C.gray }}>Goles esp. A</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, background: "#f9fafb", borderRadius: 8, padding: "6px 0" }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>{pred.expectedTotal}</span>
                <span style={{ fontSize: 9, color: totalColor, fontWeight: 700 }}>{totalLabelMap[pred.totalLabel]}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, background: "#fef2f2", borderRadius: 8, padding: "6px 0" }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: C.redDk }}>{pred.expectedGoalsB}</span>
                <span style={{ fontSize: 9, color: C.gray }}>Goles esp. B</span>
              </div>
            </div>
            {/* Métricas */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                ["Ambos equipos anotan", pred.bothTeamsToScore ? "Probable que si" : "No garantizado"],
                ["Ventaja ofensiva", edgeLabel(pred.offensiveEdge)],
                ["Ventaja defensiva", edgeLabel(pred.defensiveEdge)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: C.gray }}>{label}</span>
                  <span style={{ color: C.dark, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </Section>
        );
      })()}

      {/* ── Simulador de posición ────────────────────────────────────────── */}
      {(analysis.positionSimulator.teamA.currentPosition !== null || analysis.positionSimulator.teamB.currentPosition !== null) && (() => {
        const sim = analysis.positionSimulator;
        const pos = (n: number | null) => n !== null ? `${n}°` : "—";
        return (
          <Section>
            <SectionTitle>Simulador de posicion</SectionTitle>
            <div style={{ display: "flex", gap: 12 }}>
              {([
                { name: a.team.name, s: sim.teamA, color: C.blueDk, bg: "#eff6ff" },
                { name: b.team.name, s: sim.teamB, color: C.redDk, bg: "#fef2f2" },
              ] as const).map(({ name, s, color, bg }) => (
                <div key={name} style={{ display: "flex", flexDirection: "column", flex: 1, background: bg, borderRadius: 8, padding: "10px 12px", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{name}</span>
                  <span style={{ fontSize: 10, color: C.gray }}>Ahora: {pos(s.currentPosition)} · {s.currentPoints} pts</span>
                  {[
                    ["Si gana", s.ifWin],
                    ["Si empata", s.ifDraw],
                    ["Si pierde", s.ifLoss],
                  ].map(([label, val]) => {
                    const from = s.currentPosition;
                    const to = val as number | null;
                    const delta = from !== null && to !== null ? from - to : 0;
                    const valColor = delta > 0 ? C.green : delta < 0 ? C.red : C.gray;
                    return (
                      <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: C.gray }}>{label}</span>
                        <span style={{ color: valColor, fontWeight: 700 }}>{pos(to)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Section>
        );
      })()}

      {/* ── Amenazas goleadoras ─────────────────────────────────────────── */}
      {(a.topScoringThreats.length > 0 || b.topScoringThreats.length > 0) && (
        <Section>
          <SectionTitle>Amenazas goleadoras</SectionTitle>
          <div style={{ display: "flex", gap: 12 }}>
            {([
              { team: a, color: C.blueDk, bg: "#eff6ff" },
              { team: b, color: C.redDk,  bg: "#fef2f2" },
            ] as const).map(({ team, color, bg }) => (
              <div key={team.team.id} style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{team.team.name}</span>
                {team.topScoringThreats.length === 0 ? (
                  <span style={{ fontSize: 10, color: C.gray }}>Sin datos</span>
                ) : (
                  team.topScoringThreats.map((p, i) => (
                    <div key={p.playerId} style={{ display: "flex", alignItems: "center", gap: 6, background: bg, borderRadius: 6, padding: "5px 8px" }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: i === 0 ? color : C.gray, width: 14 }}>{i + 1}</span>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.dark }}>{displayName(p)}</span>
                        <span style={{ fontSize: 9, color: C.gray }}>{p.goals} goles</span>
                      </div>
                      {p.dangerRating !== "BAJO" && (
                        <span style={{
                          fontSize: 8, fontWeight: 700,
                          background: p.dangerRating === "ALTO" ? "#fee2e2" : "#fef9c3",
                          color: p.dangerRating === "ALTO" ? "#b91c1c" : "#92400e",
                          borderRadius: 4, padding: "1px 4px",
                        }}>
                          {p.dangerRating}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Guión del narrador ──────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Guion del narrador</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {analysis.narratorBullets.slice(0, 7).map((bullet, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: "7px 12px",
                fontSize: 12,
                color: "#1f2937",
              }}
            >
              {bullet}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Datos curiosos ───────────────────────────────────────────────── */}
      {analysis.funFacts.length > 0 && (
        <Section>
          <SectionTitle>Datos curiosos</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {analysis.funFacts.slice(0, 4).map((fact, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 12,
                  color: "#374151",
                }}
              >
                <span style={{ color: C.yellow }}>★</span>
                <span>{fact}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Head to head ────────────────────────────────────────────────── */}
      {h2h.total > 0 && (
        <Section>
          <SectionTitle>Historial cara a cara</SectionTitle>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 36, fontWeight: 900, color: C.blueDk }}>
                {h2h.aWins}
              </span>
              <span style={{ fontSize: 11, color: C.gray }}>{a.team.name}</span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 900, color: C.lgray }}>
                {h2h.draws}
              </span>
              <span style={{ fontSize: 11, color: C.gray }}>Empates</span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 36, fontWeight: 900, color: C.redDk }}>
                {h2h.bWins}
              </span>
              <span style={{ fontSize: 11, color: C.gray }}>{b.team.name}</span>
            </div>
          </div>
          {h2h.lastMatch && (
            <span
              style={{
                fontSize: 11,
                color: C.gray,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Ultimo: {h2h.lastMatch.aGoals}–{h2h.lastMatch.bGoals} (
              {h2h.lastMatch.result}) · {h2h.lastMatch.date}
            </span>
          )}
        </Section>
      )}
    </div>
  );
}

// ── Tarjeta de equipo ─────────────────────────────────────────────────────────

function TeamCard({
  team,
  color,
}: {
  team: NarratorAnalysis["teamA"];
  color: "blue" | "red";
}) {
  const accent = color === "blue" ? C.blueDk : C.redDk;
  const bg = color === "blue" ? "#eff6ff" : "#fef2f2";
  const borderTop = color === "blue" ? C.blue : C.red;

  const last5 = team.last5;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: C.cardBg,
        borderRadius: 12,
        padding: "14px 16px",
        borderTop: `4px solid ${borderTop}`,
        gap: 8,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 900, color: accent }}>
        {team.team.name}
      </span>

      {/* Récord */}
      <div style={{ display: "flex", gap: 6 }}>
        {[
          { l: "PTS", v: team.points },
          { l: "G", v: team.record.wins },
          { l: "E", v: team.record.draws },
          { l: "P", v: team.record.losses },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: bg,
              borderRadius: 6,
              padding: "4px 8px",
              flex: 1,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>
              {s.v}
            </span>
            <span style={{ fontSize: 9, color: C.gray }}>{s.l}</span>
          </div>
        ))}
      </div>

      {/* Goles */}
      <div style={{ display: "flex", gap: 10, fontSize: 11, color: C.gray }}>
        <span>
          GF <strong style={{ color: C.dark }}>{team.goalsFor}</strong>
        </span>
        <span>
          GC <strong style={{ color: C.dark }}>{team.goalsAgainst}</strong>
        </span>
        <span>
          Dif{" "}
          <strong
            style={{ color: team.goalDiff >= 0 ? C.green : C.red }}
          >
            {team.goalDiff >= 0 ? "+" : ""}
            {team.goalDiff}
          </strong>
        </span>
      </div>

      {/* Últimos 5 */}
      {last5.length > 0 && (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: C.gray, marginRight: 2 }}>
            Últ. {last5.length}:
          </span>
          {last5.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background:
                  r === "W" ? C.green : r === "D" ? C.gray : C.red,
                alignItems: "center",
                justifyContent: "center",
                color: C.white,
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              {r === "W" ? "G" : r === "D" ? "E" : "P"}
            </div>
          ))}
        </div>
      )}

      {/* Racha */}
      {team.currentStreak && team.currentStreak.count >= 2 && (
        <div style={{
          display: "flex",
          alignSelf: "flex-start",
          background: team.currentStreak.type === "W" ? "#dcfce7" : team.currentStreak.type === "L" ? "#fee2e2" : "#f3f4f6",
          borderRadius: 20,
          padding: "3px 8px",
          fontSize: 10,
          fontWeight: 700,
          color: team.currentStreak.type === "W" ? "#15803d" : team.currentStreak.type === "L" ? "#b91c1c" : "#4b5563",
        }}>
          Racha: {team.currentStreak.count} {{ W: "victorias", D: "empates", L: "derrotas" }[team.currentStreak.type]}
        </div>
      )}

      {/* Ranking */}
      {(team.attackRank !== null || team.defenseRank !== null) && team.totalTeams > 2 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {team.attackRank !== null && (() => {
            const t = team.totalTeams;
            const r = team.attackRank;
            const [label, bg, color] =
              r <= Math.ceil(t / 3)   ? ["Ataque fuerte",  "#dcfce7", "#15803d"] :
              r <= Math.ceil(t * 2/3) ? ["Ataque regular", "#fef9c3", "#92400e"] :
                                        ["Ataque flojo",   "#fee2e2", "#b91c1c"];
            return (
              <span style={{ display: "flex", background: bg, color, borderRadius: 20, padding: "2px 7px", fontSize: 9, fontWeight: 700 }}>
                {label}
              </span>
            );
          })()}
          {team.defenseRank !== null && (() => {
            const t = team.totalTeams;
            const r = team.defenseRank;
            const [label, bg, color] =
              r <= Math.ceil(t / 3)   ? ["Defensa solida",  "#dcfce7", "#15803d"] :
              r <= Math.ceil(t * 2/3) ? ["Defensa regular", "#fef9c3", "#92400e"] :
                                        ["Defensa debil",   "#fee2e2", "#b91c1c"];
            return (
              <span style={{ display: "flex", background: bg, color, borderRadius: 20, padding: "2px 7px", fontSize: 9, fontWeight: 700 }}>
                {label}
              </span>
            );
          })()}
        </div>
      )}

      {/* Top scorer */}
      {team.topScorer && (
        <div style={{ display: "flex", gap: 6, fontSize: 11, alignItems: "center" }}>
          <span>⚽</span>
          <span style={{ color: C.dark, fontWeight: 600 }}>
            {displayName(team.topScorer)}
          </span>
          <span style={{ color: C.gray, marginLeft: "auto" }}>
            {team.topScorer.goals} goles
          </span>
        </div>
      )}

      {/* Top assist */}
      {team.topAssist && team.topAssist.playerId !== team.topScorer?.playerId && (
        <div style={{ display: "flex", gap: 6, fontSize: 11, alignItems: "center" }}>
          <span>🎯</span>
          <span style={{ color: C.dark, fontWeight: 600 }}>
            {displayName(team.topAssist)}
          </span>
          <span style={{ color: C.gray, marginLeft: "auto" }}>
            {team.topAssist.assists} asist.
          </span>
        </div>
      )}

      {/* Riesgo tarjetas */}
      {team.cardRisk.length > 0 && (
        <div style={{ display: "flex", gap: 6, fontSize: 11, alignItems: "center" }}>
          <span>🟨</span>
          <span style={{ color: C.dark }}>{team.cardRisk[0].player}</span>
        </div>
      )}
    </div>
  );
}
