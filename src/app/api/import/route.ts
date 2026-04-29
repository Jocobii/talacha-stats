/**
 * POST /api/import
 *
 * Flujo de importacion por eventos (goles, asistencias, tarjetas partido a partido).
 * Controlador delgado: valida entrada, delega a features/import-excel.
 */

import {
  generateEventPreview,
  confirmEventImport,
} from "@/features/import-excel";
import { apiSuccess, apiError } from "@/types";
import { z } from "zod";

const ResolutionsSchema = z.record(z.string(), z.string());

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return apiError("Se esperaba multipart/form-data", 400);

  const action = (formData.get("action") as string) || "preview";
  const leagueId = formData.get("league_id") as string;
  if (!leagueId) return apiError("Falta league_id", 400);

  const file = formData.get("file") as File | null;
  if (!file) return apiError("Falta el archivo Excel", 400);

  const buffer = Buffer.from(await file.arrayBuffer());

  if (action === "preview") {
    try {
      return apiSuccess(await generateEventPreview({ buffer, leagueId }));
    } catch {
      return apiError("No se pudo parsear el archivo. Verificar formato.", 400);
    }
  }

  if (action === "confirm") {
    let preview: Awaited<ReturnType<typeof generateEventPreview>>;
    try {
      preview = await generateEventPreview({ buffer, leagueId });
    } catch {
      return apiError("No se pudo parsear el archivo. Verificar formato.", 400);
    }

    const rawRes = formData.get("resolutions") as string | null;
    let playerResolutions: Record<string, string> = {};
    if (rawRes) {
      let raw: unknown;
      try {
        raw = JSON.parse(rawRes);
      } catch {
        return apiError("JSON de resoluciones invalido", 400);
      }
      const r = ResolutionsSchema.safeParse(raw);
      if (!r.success) return apiError("Formato de resoluciones invalido", 400);
      playerResolutions = r.data;
    }

    const result = await confirmEventImport({
      leagueId,      events: preview.events,
      results: preview.results,
      playerResolutions,
    });
    return apiSuccess(result);
  }

  return apiError("action debe ser 'preview' o 'confirm'", 400);
}
