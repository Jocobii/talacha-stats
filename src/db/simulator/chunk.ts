/**
 * src/db/simulator/chunk.ts
 *
 * Bug real encontrado corriendo tier L/XL desde /admin/organization-simulator:
 * Postgres (protocolo extendido, driver `pg`) usa un contador de 16 bits para
 * los "parameter formats" de un bind message — un solo INSERT con más de
 * ~65535 parámetros (filas × columnas) revienta con
 * `bind message has N parameter formats but 0 parameters` (código 08P01).
 * A tier alto, `matchEvents`/`matchPlayerStats`/`playerSeasonStatsSnapshot`
 * fácilmente pasan de eso en una sola liga.
 *
 * `chunk()` parte un arreglo en lotes para que cada `.insert(table).values(lote)`
 * se quede bien por debajo del límite — el resto de la fila (contribuidor,
 * transacción) no cambia, solo cuántas filas van en cada round-trip.
 */

export function chunk<T>(items: T[], size: number): T[][] {
	if (items.length === 0) return [];
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		out.push(items.slice(i, i + size));
	}
	return out;
}

/**
 * Envuelve un `.insert(table).values(batch).returning()` en lotes de `size`
 * filas, preservando el tipado exacto de la llamada real (el caller pasa la
 * función de insert ya cerrada sobre su tabla — este helper no conoce tablas
 * de drizzle, solo trocea y junta resultados).
 *
 * Default 500 filas/lote: conservador incluso para tablas con ~30 columnas
 * (500 × 30 = 15,000, bien debajo del límite de 65,535 parámetros de Postgres).
 */
export async function insertInBatches<TRow, TResult>(
	rows: TRow[],
	insertFn: (batch: TRow[]) => Promise<TResult[]>,
	size = 500,
): Promise<TResult[]> {
	if (rows.length === 0) return [];
	const out: TResult[] = [];
	for (const batch of chunk(rows, size)) {
		out.push(...(await insertFn(batch)));
	}
	return out;
}
