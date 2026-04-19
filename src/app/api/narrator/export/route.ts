/**
 * GET /api/narrator/export?format=pdf|png&leagueId=...&teamA=...&teamB=...
 *
 * Genera y devuelve el análisis del narrador como archivo descargable.
 * - format=pdf → application/pdf  (pdfkit)
 * - format=png → image/png        (next/og ImageResponse + satori)
 */

import { ImageResponse } from "next/og";
import { generateNarratorAnalysis } from "@/lib/narrator";
import { buildNarratorPdf } from "@/features/narrator-analysis/export-pdf";
import { buildNarratorPngElement } from "@/features/narrator-analysis/export-png";
import { apiError } from "@/types";

export const runtime = "nodejs"; // necesario para pdfkit y pg

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  const teamA    = searchParams.get("teamA");
  const teamB    = searchParams.get("teamB");
  const format   = searchParams.get("format") ?? "pdf";

  if (!leagueId || !teamA || !teamB) {
    return apiError("Se requieren leagueId, teamA y teamB", 400);
  }
  if (teamA === teamB) {
    return apiError("Los dos equipos deben ser diferentes", 400);
  }
  if (format !== "pdf" && format !== "png") {
    return apiError("format debe ser 'pdf' o 'png'", 400);
  }

  const analysis = await generateNarratorAnalysis(teamA, teamB, leagueId);
  if (!analysis) {
    return apiError("No se encontraron los equipos o la liga", 404);
  }

  const filename = `${analysis.teamA.team.name}_vs_${analysis.teamB.team.name}`
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "");

  // ── PDF ────────────────────────────────────────────────────────────────────
  if (format === "pdf") {
    const buffer = await buildNarratorPdf(analysis);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  }

  // ── PNG ────────────────────────────────────────────────────────────────────
  return new ImageResponse(buildNarratorPngElement(analysis), {
    width: 800,
    height: 1900,
    headers: {
      "Content-Disposition": `attachment; filename="${filename}.png"`,
    },
  });
}
