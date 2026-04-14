import { generateMatchPreview } from "@/lib/preview";
import { apiSuccess, apiError } from "@/types";

// GET /api/matches/:id/preview
// Retorna inteligencia pre-partido para el narrador del live
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const preview = await generateMatchPreview(id);
  if (!preview) return apiError("Partido no encontrado", 404);

  return apiSuccess(preview);
}
