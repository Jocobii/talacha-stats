import * as XLSX from "xlsx";
import { apiSuccess, apiError } from "@/types";

export type DetectResult = {
  sheets: string[];
  activeSheet: string;
  // Primeras 10 filas como arrays de strings — para que el usuario vea el contenido
  preview: string[][];
  // Total de filas con datos
  totalRows: number;
};

// POST /api/import/detect
// Recibe un archivo Excel y devuelve las primeras filas para que el usuario
// pueda identificar en qué fila están los encabezados y mapear columnas.
export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return apiError("Se esperaba multipart/form-data", 400);

  const file = formData.get("file") as File | null;
  if (!file) return apiError("Falta el archivo", 400);

  const sheetName = formData.get("sheet") as string | null;

  const buffer = Buffer.from(await file.arrayBuffer());

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return apiError("No se pudo leer el archivo Excel", 400);
  }

  const sheets = workbook.SheetNames;
  const active = sheetName && sheets.includes(sheetName) ? sheetName : sheets[0];
  const sheet = workbook.Sheets[active];

  // Leer todas las filas como arrays (header: 1 = sin inferir encabezados)
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  // Limpiar: convertir cada celda a string, quitar filas completamente vacías
  const cleaned: string[][] = allRows
    .map((row) => (row as unknown[]).map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some((cell) => cell !== ""));

  const preview = cleaned.slice(0, 15); // primeras 15 filas para el preview

  return apiSuccess({
    sheets,
    activeSheet: active,
    preview,
    totalRows: cleaned.length,
  } satisfies DetectResult);
}
