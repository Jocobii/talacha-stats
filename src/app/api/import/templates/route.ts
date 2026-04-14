import { db, importTemplates } from "@/db";
import { desc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";
import { z } from "zod";

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["goleadores", "standings"]),
  headerRow: z.number().int().min(0),
  columnMap: z.record(z.string(), z.string()),
});

// GET /api/import/templates
export async function GET() {
  const templates = await db.query.importTemplates.findMany({
    orderBy: [desc(importTemplates.createdAt)],
  });
  return apiSuccess(templates);
}

// POST /api/import/templates
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateTemplateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const [template] = await db
    .insert(importTemplates)
    .values({
      name: parsed.data.name,
      type: parsed.data.type,
      headerRow: parsed.data.headerRow,
      columnMap: JSON.stringify(parsed.data.columnMap),
    })
    .returning();

  return apiSuccess(template, 201);
}
