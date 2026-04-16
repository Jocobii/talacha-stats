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
