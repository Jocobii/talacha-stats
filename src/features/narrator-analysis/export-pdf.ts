/**
 * export-pdf.ts — Genera un PDF del análisis pre-partido para el narrador.
 * Usa pdfkit (Node.js puro, sin browser). Devuelve un Buffer listo para
 * enviarse como respuesta HTTP con Content-Type: application/pdf.
 */

import PDFDocument from "pdfkit";
import type { NarratorAnalysis } from "@/lib/narrator";

// ── Colores ──────────────────────────────────────────────────────────────────
const C = {
  black:  "#111827",
  gray:   "#6b7280",
  lgray:  "#d1d5db",
  blue:   "#1d4ed8",
  red:    "#dc2626",
  green:  "#16a34a",
  yellow: "#b45309",
  white:  "#ffffff",
  dark:   "#111827",
};

// Helvetica no soporta emojis — los limpiamos del texto
function strip(str: string): string {
  return str
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, "")
    .replace(/[\u2600-\u27BF]/gu, "")
    .replace(/[\uFE00-\uFE0F]/gu, "")
    .trim();
}

function displayName(p: { fullName: string; alias: string | null }): string {
  return p.alias ? `"${p.alias}"` : p.fullName;
}

// ── Función principal ─────────────────────────────────────────────────────────

export async function buildNarratorPdf(
  analysis: NarratorAnalysis,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, compress: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 80; // ancho útil
    const { teamA: a, teamB: b } = analysis;

    // ── Encabezado oscuro ─────────────────────────────────────────────────────
    doc.rect(40, 40, W, 72).fill(C.dark);
    doc
      .fill(C.lgray)
      .fontSize(8)
      .font("Helvetica")
      .text(
        `${analysis.league.name.toUpperCase()} · ${analysis.league.season}`,
        40,
        50,
        { width: W, align: "center" },
      );
    doc
      .fill(C.white)
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(`${a.team.name}  VS  ${b.team.name}`, 40, 64, {
        width: W,
        align: "center",
      });

    doc.y = 126;

    // ── Probabilidad ──────────────────────────────────────────────────────────
    const { aWinPct, drawPct, bWinPct } = analysis.winProbability;
    doc.fill(C.black).fontSize(10).font("Helvetica-Bold").text("Probabilidad de victoria", 40);
    doc.moveDown(0.25);
    doc
      .fill(C.blue)
      .fontSize(9)
      .font("Helvetica")
      .text(`${a.team.name}: ${aWinPct}%`, 40, doc.y, {
        continued: true,
        width: W / 3,
      });
    doc
      .fill(C.gray)
      .text(`Empate: ${drawPct}%`, { continued: true, align: "center", width: W / 3 });
    doc
      .fill(C.red)
      .text(`${b.team.name}: ${bWinPct}%`, { align: "right", width: W / 3 });
    doc.moveDown(0.8);

    // ── Tarjetas de equipo (2 columnas, posiciones manuales) ──────────────────
    const colW = (W - 16) / 2;
    const leftX = 40;
    const rightX = 40 + colW + 16;

    const teamStartY = doc.y;
    let yLeft = teamStartY;
    let yRight = teamStartY;

    function teamLine(
      text: string,
      x: number,
      y: number,
      color: string,
      bold = false,
      size = 9,
    ): number {
      doc
        .fill(color)
        .fontSize(size)
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .text(text, x, y, { width: colW, lineBreak: false });
      return y + size + 3;
    }

    // Equipo A
    yLeft = teamLine(a.team.name, leftX, yLeft, C.blue, true, 11);
    yLeft = teamLine(
      `${a.record.wins}G  ${a.record.draws}E  ${a.record.losses}P  —  ${a.points} pts`,
      leftX, yLeft, C.black,
    );
    yLeft = teamLine(
      `GF ${a.goalsFor}  GC ${a.goalsAgainst}  Dif ${a.goalDiff >= 0 ? "+" : ""}${a.goalDiff}  Prom ${a.avgGoalsFor}`,
      leftX, yLeft, C.gray,
    );
    if (a.currentStreak && a.currentStreak.count >= 2) {
      const word = { W: "victorias", D: "empates", L: "derrotas" }[a.currentStreak.type];
      const col = a.currentStreak.type === "W" ? C.green : a.currentStreak.type === "L" ? C.red : C.gray;
      yLeft = teamLine(`Racha: ${a.currentStreak.count} ${word}`, leftX, yLeft, col);
    }
    if (a.topScorer) {
      yLeft = teamLine(
        `Goleador: ${displayName(a.topScorer)} (${a.topScorer.goals} goles)`,
        leftX, yLeft, C.black,
      );
    }
    if (a.topAssist && a.topAssist.playerId !== a.topScorer?.playerId) {
      yLeft = teamLine(
        `Asistidor: ${displayName(a.topAssist)} (${a.topAssist.assists} asist.)`,
        leftX, yLeft, C.black,
      );
    }
    if (a.attackRank !== null && a.totalTeams > 2) {
      const t = a.totalTeams;
      const rankLabel = a.attackRank <= Math.ceil(t / 3) ? "Ataque fuerte" :
        a.attackRank <= Math.ceil(t * 2 / 3) ? "Ataque regular" : "Ataque flojo";
      const defLabel = a.defenseRank !== null ? (
        a.defenseRank <= Math.ceil(t / 3) ? "  Defensa solida" :
        a.defenseRank <= Math.ceil(t * 2 / 3) ? "  Defensa regular" : "  Defensa debil"
      ) : "";
      yLeft = teamLine(`${rankLabel}${defLabel}`, leftX, yLeft, C.gray);
    }
    if (a.cardRisk.length > 0) {
      yLeft = teamLine(
        `Tarjetas: ${a.cardRisk[0].player} — ${strip(a.cardRisk[0].note)}`,
        leftX, yLeft, C.yellow,
      );
    }

    // Equipo B
    yRight = teamLine(b.team.name, rightX, teamStartY, C.red, true, 11);
    yRight = teamLine(
      `${b.record.wins}G  ${b.record.draws}E  ${b.record.losses}P  —  ${b.points} pts`,
      rightX, yRight, C.black,
    );
    yRight = teamLine(
      `GF ${b.goalsFor}  GC ${b.goalsAgainst}  Dif ${b.goalDiff >= 0 ? "+" : ""}${b.goalDiff}  Prom ${b.avgGoalsFor}`,
      rightX, yRight, C.gray,
    );
    if (b.currentStreak && b.currentStreak.count >= 2) {
      const word = { W: "victorias", D: "empates", L: "derrotas" }[b.currentStreak.type];
      const col = b.currentStreak.type === "W" ? C.green : b.currentStreak.type === "L" ? C.red : C.gray;
      yRight = teamLine(`Racha: ${b.currentStreak.count} ${word}`, rightX, yRight, col);
    }
    if (b.topScorer) {
      yRight = teamLine(
        `Goleador: ${displayName(b.topScorer)} (${b.topScorer.goals} goles)`,
        rightX, yRight, C.black,
      );
    }
    if (b.topAssist && b.topAssist.playerId !== b.topScorer?.playerId) {
      yRight = teamLine(
        `Asistidor: ${displayName(b.topAssist)} (${b.topAssist.assists} asist.)`,
        rightX, yRight, C.black,
      );
    }
    if (b.attackRank !== null && b.totalTeams > 2) {
      const t = b.totalTeams;
      const rankLabel = b.attackRank <= Math.ceil(t / 3) ? "Ataque fuerte" :
        b.attackRank <= Math.ceil(t * 2 / 3) ? "Ataque regular" : "Ataque flojo";
      const defLabel = b.defenseRank !== null ? (
        b.defenseRank <= Math.ceil(t / 3) ? "  Defensa solida" :
        b.defenseRank <= Math.ceil(t * 2 / 3) ? "  Defensa regular" : "  Defensa debil"
      ) : "";
      yRight = teamLine(`${rankLabel}${defLabel}`, rightX, yRight, C.gray);
    }
    if (b.cardRisk.length > 0) {
      yRight = teamLine(
        `Tarjetas: ${b.cardRisk[0].player} — ${strip(b.cardRisk[0].note)}`,
        rightX, yRight, C.yellow,
      );
    }

    doc.y = Math.max(yLeft, yRight) + 12;

    // ── Predicción del partido ────────────────────────────────────────────────
    const pred = analysis.matchPrediction;
    if (pred.hasData) {
      doc.fill(C.black).fontSize(10).font("Helvetica-Bold").text("Prediccion del partido", 40);
      doc.moveDown(0.3);
      const totalLabelMap = { cerrado: "Partido cerrado", abierto: "Partido abierto", festival: "Festival de goles" };
      doc
        .fill(C.gray).fontSize(9).font("Helvetica")
        .text(
          `Marcador mas probable: ${pred.likelyScoreA}-${pred.likelyScoreB}  |  ` +
          `Goles esperados: ${a.team.name} ${pred.expectedGoalsA} — ${b.team.name} ${pred.expectedGoalsB}  |  ` +
          `Total: ${pred.expectedTotal} (${totalLabelMap[pred.totalLabel]})`,
          44, doc.y, { width: W - 4 },
        );
      doc.moveDown(0.3);
      const edgeLabel = (e: string) => e === "A" ? a.team.name : e === "B" ? b.team.name : "Equilibrado";
      doc
        .fill(C.gray).fontSize(9).font("Helvetica")
        .text(
          `Ambos anotan: ${pred.bothTeamsToScore ? "Probable" : "No garantizado"}  |  ` +
          `Ventaja ofensiva: ${edgeLabel(pred.offensiveEdge)}  |  ` +
          `Ventaja defensiva: ${edgeLabel(pred.defensiveEdge)}`,
          44, doc.y, { width: W - 4 },
        );
      doc.moveDown(0.8);
    }

    // ── Simulador de posición ─────────────────────────────────────────────────
    const sim = analysis.positionSimulator;
    if (sim.teamA.currentPosition !== null || sim.teamB.currentPosition !== null) {
      doc.fill(C.black).fontSize(10).font("Helvetica-Bold").text("Simulador de posicion", 40);
      doc.moveDown(0.3);
      for (const { name, s } of [
        { name: a.team.name, s: sim.teamA },
        { name: b.team.name, s: sim.teamB },
      ]) {
        const pos = (n: number | null) => n !== null ? `${n}°` : "—";
        doc
          .fill(C.gray).fontSize(9).font("Helvetica")
          .text(
            `${name} (ahora ${pos(s.currentPosition)}, ${s.currentPoints} pts): ` +
            `Gana → ${pos(s.ifWin)}  Empata → ${pos(s.ifDraw)}  Pierde → ${pos(s.ifLoss)}`,
            44, doc.y, { width: W - 4 },
          );
        doc.moveDown(0.3);
      }
      doc.moveDown(0.5);
    }

    // ── Amenazas goleadoras ───────────────────────────────────────────────────
    const threatsA = a.topScoringThreats;
    const threatsB = b.topScoringThreats;
    if (threatsA.length > 0 || threatsB.length > 0) {
      doc.fill(C.black).fontSize(10).font("Helvetica-Bold").text("Amenazas goleadoras", 40);
      doc.moveDown(0.3);
      const tStartY = doc.y;
      let ytA = tStartY;
      let ytB = tStartY;

      if (threatsA.length > 0) {
        ytA = teamLine(a.team.name, leftX, ytA, C.blue, true, 9);
        for (const p of threatsA) {
          const dangerLabel = p.dangerRating === "ALTO" ? "[ALTO]" : p.dangerRating === "MEDIO" ? "[MED]" : "";
          ytA = teamLine(
            `${displayName(p)} — ${p.goals} goles ${dangerLabel}`,
            leftX, ytA, C.black,
          );
        }
      }
      if (threatsB.length > 0) {
        ytB = teamLine(b.team.name, rightX, ytB, C.red, true, 9);
        for (const p of threatsB) {
          const dangerLabel = p.dangerRating === "ALTO" ? "[ALTO]" : p.dangerRating === "MEDIO" ? "[MED]" : "";
          ytB = teamLine(
            `${displayName(p)} — ${p.goals} goles ${dangerLabel}`,
            rightX, ytB, C.black,
          );
        }
      }
      doc.y = Math.max(ytA, ytB) + 8;
      doc.moveDown(0.5);
    }

    // ── Guión del narrador ────────────────────────────────────────────────────
    doc.fill(C.black).fontSize(10).font("Helvetica-Bold").text("Guion del narrador", 40);
    doc.moveDown(0.3);
    for (const bullet of analysis.narratorBullets) {
      doc
        .fill(C.black)
        .fontSize(9)
        .font("Helvetica")
        .text(`•  ${strip(bullet)}`, 44, doc.y, { width: W - 4 });
      doc.moveDown(0.2);
    }
    doc.moveDown(0.5);

    // ── Datos curiosos ────────────────────────────────────────────────────────
    if (analysis.funFacts.length > 0) {
      doc.fill(C.black).fontSize(10).font("Helvetica-Bold").text("Datos curiosos", 40);
      doc.moveDown(0.3);
      for (const fact of analysis.funFacts) {
        doc
          .fill(C.gray)
          .fontSize(9)
          .font("Helvetica")
          .text(`*  ${strip(fact)}`, 44, doc.y, { width: W - 4 });
        doc.moveDown(0.2);
      }
      doc.moveDown(0.5);
    }

    // ── Head to head ──────────────────────────────────────────────────────────
    const h2h = analysis.headToHead;
    if (h2h.total > 0) {
      doc.fill(C.black).fontSize(10).font("Helvetica-Bold").text("Historial cara a cara", 40);
      doc.moveDown(0.3);
      doc
        .fill(C.gray)
        .fontSize(9)
        .font("Helvetica")
        .text(
          `${h2h.total} enfrentamientos: ${a.team.name} ${h2h.aWins} — Empates ${h2h.draws} — ${b.team.name} ${h2h.bWins}`,
          40,
          doc.y,
          { width: W },
        );
      if (h2h.lastMatch) {
        doc.moveDown(0.2);
        doc
          .fill(C.gray)
          .text(
            `Ultimo: ${h2h.lastMatch.aGoals}-${h2h.lastMatch.bGoals} (${h2h.lastMatch.result}) · ${h2h.lastMatch.date}`,
            40,
            doc.y,
            { width: W },
          );
      }
      doc.moveDown(0.8);
    }

    // ── Planteles ─────────────────────────────────────────────────────────────
    if (doc.y > doc.page.height - 180) doc.addPage();

    const rosterStartY = doc.y;
    const rA = a.roster.filter((p) => p.matchesPlayed > 0 || p.goals > 0);
    const rB = b.roster.filter((p) => p.matchesPlayed > 0 || p.goals > 0);
    const maxRows = Math.max(rA.length, rB.length);

    const ROW_H = 11;
    const nameW = 130;
    const statW = 22;
    const headers = ["Jugador", "G", "A", "AM", "RJ", "PJ"];
    const colWidths = [nameW, statW, statW, statW, statW, statW];

    function drawRosterHeader(x: number, teamName: string, color: string, startY: number) {
      doc
        .fill(color)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(teamName, x, startY, { width: colW, lineBreak: false });
      let cx = x;
      const hy = startY + 13;
      for (let i = 0; i < headers.length; i++) {
        doc
          .fill(C.gray)
          .fontSize(7)
          .font("Helvetica-Bold")
          .text(headers[i], cx, hy, {
            width: colWidths[i],
            align: i > 0 ? "center" : "left",
            lineBreak: false,
          });
        cx += colWidths[i];
      }
      return hy + ROW_H + 2;
    }

    function drawRosterRow(
      p: (typeof rA)[number] | undefined,
      x: number,
      y: number,
    ) {
      if (!p) return;
      const cells = [
        displayName(p).substring(0, 20),
        p.goals > 0 ? String(p.goals) : "—",
        p.assists > 0 ? String(p.assists) : "—",
        p.yellowCards > 0 ? String(p.yellowCards) : "—",
        p.redCards > 0 ? String(p.redCards) : "—",
        p.matchesPlayed > 0 ? String(p.matchesPlayed) : "—",
      ];
      let cx = x;
      for (let i = 0; i < cells.length; i++) {
        doc
          .fill(C.black)
          .fontSize(7)
          .font("Helvetica")
          .text(cells[i], cx, y, {
            width: colWidths[i],
            align: i > 0 ? "center" : "left",
            lineBreak: false,
          });
        cx += colWidths[i];
      }
    }

    let yRosterLeft = drawRosterHeader(leftX, a.team.name, C.blue, rosterStartY);
    let yRosterRight = drawRosterHeader(rightX, b.team.name, C.red, rosterStartY);

    for (let i = 0; i < maxRows; i++) {
      const rowY = rosterStartY + 26 + i * ROW_H;

      // Nueva página si es necesario
      if (rowY > doc.page.height - 50) {
        doc.addPage();
        // Continuar sin resetear coordenadas
        break;
      }

      drawRosterRow(rA[i], leftX, rowY);
      drawRosterRow(rB[i], rightX, rowY);
      yRosterLeft = rowY + ROW_H;
      yRosterRight = rowY + ROW_H;
    }

    doc.y = Math.max(yRosterLeft, yRosterRight) + 10;

    doc.end();
  });
}
