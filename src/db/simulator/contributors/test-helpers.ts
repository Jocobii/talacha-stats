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
 *
 * Las tablas se indexan por referencia de objeto: como producción y tests
 * importan el mismo singleton desde "@/db/schema", `Map<tableRef, rows[]>`
 * es suficiente sin tener que interpretar SQL de drizzle.
 *
 * Nota sobre `.where()`: los contribuidores que necesitan filtrar por
 * condición traen todas las filas y filtran en JS (ver identity.ts
 * createOrganizationOwners) precisamente para que este fake no tenga que
 * parsear objetos SQL de drizzle. Si un contribuidor nuevo depende de
 * `.where()` real, hay que extender este helper — no fingir que funciona.
 */

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
	/** Acceso directo para preparar fixtures desde los tests. */
	seed(table: unknown, rows: Record<string, unknown>[]): void;
	/** Inspección directa del store para aserciones. */
	rowsOf(table: unknown): Record<string, unknown>[];
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
		seed(table: unknown, rows: Record<string, unknown>[]) {
			getStore(table).push(...rows);
		},
		rowsOf(table: unknown) {
			return getStore(table);
		},
	};
}
