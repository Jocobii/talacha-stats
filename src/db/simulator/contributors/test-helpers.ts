/**
 * src/db/simulator/contributors/test-helpers.ts
 *
 * Fake de `db` (drizzle) para probar contribuidores sin Postgres real.
 * No es un archivo *.test.ts a propósito — vitest solo recoge
 * `src/**\/*.test.{ts,tsx}` (ver vitest.config.ts), así que este helper no
 * se ejecuta como suite, solo se importa desde los tests de contribuidores.
 *
 * Soporta exactamente los patrones que usan los contribuidores:
 *   - db.insert(table).values(rowOrRows).returning()
 *   - db.select(proj?).from(table)              (sin .where — filtrado en JS)
 *   - db.select(proj?).from(table).where(cond)   (cond se ignora — ver nota)
 *   - db.update(table).set(values).where(inArray(col, ids))
 *
 * Las tablas se indexan por referencia de objeto: como producción y tests
 * importan el mismo singleton desde "@/db/schema", `Map<tableRef, rows[]>`
 * es suficiente sin tener que interpretar SQL de drizzle.
 *
 * Nota sobre `.where()` en select: los contribuidores que necesitan filtrar
 * por condición traen todas las filas y filtran en JS (ver identity.ts
 * createOrganizationOwners) precisamente para que este fake no tenga que
 * parsear objetos SQL de drizzle. Si un contribuidor nuevo depende de
 * `.where()` real en un select, hay que extender este helper — no fingir
 * que funciona.
 *
 * Nota sobre `.where()` en update: a diferencia de select, `update` sí
 * necesita aplicar el filtro de verdad (ver matchplay.ts cerrando jornadas
 * jugadas) — de lo contrario tests que insertan varias ligas en la misma
 * corrida marcarían como completadas jornadas de ligas que no le tocan a
 * ese contribuidor. Solo soporta `inArray(columna, ids)`, que es el único
 * patrón que usan los contribuidores hoy; ver `extractInArrayCondition`.
 */

import { Column } from "drizzle-orm";

export interface FakeDb {
	insert(table: unknown): {
		values(rows: Record<string, unknown> | Record<string, unknown>[]): {
			returning(): Promise<Record<string, unknown>[]>;
			onConflictDoNothing(): { returning(): Promise<Record<string, unknown>[]> };
		};
	};
	select(projection?: unknown): {
		from(table: unknown): Promise<Record<string, unknown>[]> & {
			where(cond?: unknown): Promise<Record<string, unknown>[]>;
		};
	};
	update(table: unknown): {
		set(values: Record<string, unknown>): {
			where(cond?: unknown): Promise<Record<string, unknown>[]>;
		};
	};
	/** Acceso directo para preparar fixtures desde los tests. */
	seed(table: unknown, rows: Record<string, unknown>[]): void;
	/** Inspección directa del store para aserciones. */
	rowsOf(table: unknown): Record<string, unknown>[];
}

function isParamChunk(chunk: unknown): chunk is { value: unknown } {
	return (
		!!chunk &&
		typeof chunk === "object" &&
		"value" in chunk &&
		"encoder" in chunk &&
		!(chunk instanceof Column)
	);
}

/**
 * Extrae `{ columnName, values }` de una condición `inArray(columna, ids)`
 * construida con drizzle-orm. Recorre `queryChunks` buscando la primera
 * `Column` (para el nombre de campo) y todos los `Param` (para los valores).
 * No soporta `and`/`eq`/otros operadores — ver nota de cabecera.
 */
function extractInArrayCondition(cond: unknown): { columnName: string; values: unknown[] } | null {
	if (!cond || typeof cond !== "object" || !("queryChunks" in cond)) return null;
	const chunks = (cond as { queryChunks: unknown[] }).queryChunks;
	let columnName: string | null = null;
	const values: unknown[] = [];

	const visit = (chunk: unknown): void => {
		if (Array.isArray(chunk)) {
			chunk.forEach(visit);
			return;
		}
		if (chunk instanceof Column) {
			columnName = columnName ?? chunk.name;
			return;
		}
		if (isParamChunk(chunk)) {
			values.push(chunk.value);
		}
	};
	chunks.forEach(visit);

	if (!columnName) return null;
	return { columnName, values };
}

export function createFakeDb(): FakeDb {
	const store = new Map<unknown, Record<string, unknown>[]>();
	let idCounter = 0;

	function getStore(table: unknown): Record<string, unknown>[] {
		if (!store.has(table)) store.set(table, []);
		return store.get(table)!;
	}

	return {
		insert(table: unknown) {
			return {
				values(rows: Record<string, unknown> | Record<string, unknown>[]) {
					const arr = Array.isArray(rows) ? rows : [rows];
					// Simula `defaultNow()` de Postgres para columnas createdAt/updatedAt que
					// el contribuidor no seteó explícitamente (la DB real las llena solas).
					// Sin esto, contribuidores que leen `row.createdAt` de vuelta (p. ej.
					// calendar.ts::scheduledDateForJornada usando league.createdAt) reciben
					// `undefined` aquí y `Invalid Date` allá, aunque en Postgres real nunca pasa.
					const inserted = arr.map((r) => ({
						id: r.id ?? `sim-${idCounter++}`,
						createdAt: r.createdAt ?? new Date(),
						updatedAt: r.updatedAt ?? new Date(),
						...r,
					}));
					getStore(table).push(...inserted);
					const result = { returning: async () => inserted };
					return { ...result, onConflictDoNothing: () => result };
				},
			};
		},
		select(_projection?: unknown) {
			return {
				from(table: unknown) {
					const rows = getStore(table);
					const promise = Promise.resolve(rows) as Promise<Record<string, unknown>[]> & {
						where(): Promise<Record<string, unknown>[]>;
					};
					promise.where = async () => rows;
					return promise;
				},
			};
		},
		update(table: unknown) {
			return {
				set(values: Record<string, unknown>) {
					return {
						async where(cond?: unknown) {
							const rows = getStore(table);
							const parsed = extractInArrayCondition(cond);
							const targets = parsed
								? rows.filter((r) => parsed.values.includes(r[parsed.columnName]))
								: rows;
							for (const row of targets) Object.assign(row, values);
							return targets;
						},
					};
				},
			};
		},
		seed(table: unknown, rows: Record<string, unknown>[]) {
			getStore(table).push(...rows);
		},
		rowsOf(table: unknown) {
			return getStore(table);
		},
	};
}
