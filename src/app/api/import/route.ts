import { parseExcelBuffer, generateImportPreview, confirmImport } from "@/lib/excel-import";
import { apiSuccess, apiError } from "@/types";
import { z } from "zod";

// POST /api/import
// Content-Type: multipart/form-data
// Body: file (xlsx), league_id, action (preview | confirm), resolutions (JSON, solo en confirm)
export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return apiError("Se esperaba multipart/form-data", 400);

  const action = formData.get("action") as string;
  const leagueId = formData.get("league_id") as string;

  if (!leagueId) return apiError("Falta league_id", 400);

  const file = formData.get("file") as File | null;
  if (!file) return apiError("Falta el archivo Excel", 400);

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = parseExcelBuffer(buffer);
  } catch {
    return apiError("No se pudo parsear el archivo Excel. Verificar formato.", 400);
  }

  if (action === "preview" || !action) {
    const preview = await generateImportPreview(parsed);
    return apiSuccess(preview);
  }

  if (action === "confirm") {
    const rawResolutions = formData.get("resolutions") as string;
    let rawParsed: unknown;
    try {
      rawParsed = rawResolutions ? JSON.parse(rawResolutions) : {};
    } catch {
      return apiError("JSON de resoluciones inválido", 400);
    }

    const ResolutionsSchema = z.record(z.string(), z.string());
    const parsedRes = ResolutionsSchema.safeParse(rawParsed);
    if (!parsedRes.success) return apiError("Formato de resoluciones inválido", 400);

    const result = await confirmImport({
      leagueId,
      events: parsed.events,
      results: parsed.results,
      playerResolutions: parsedRes.data,
    });

    return apiSuccess(result);
  }

  return apiError("action debe ser 'preview' o 'confirm'", 400);
}
