# Estándar de listado con filtros — `shared/lib/list-query`

Contrato único para las pantallas "data-heavy" (jugadores, equipos, …). El
frontend manda filtros/orden/paginación en la **URL como params planos**; el
backend los normaliza a un objeto `ListQuery` y los traduce a cláusulas de
Drizzle que se ejecutan en PostgreSQL. Encaja con §17 (Thin Client, Smart
Backend), §3.2 (routes delgadas) y §7.4 (contrato DTO).

> Reglas fijas: **solo lógica AND**, el **operador de cada campo lo decide el
> registro** (no el usuario), y el **registro es la allowlist** — lo único
> filtrable y lo único que la UI pinta.

---

## 1. Las 3 piezas

| Pieza                      | Archivo                                      | Rol                                           |
| -------------------------- | -------------------------------------------- | --------------------------------------------- |
| **Contrato**               | `shared/lib/list-query/types.ts`             | `ListQuery`, operadores, `FilterMap`          |
| **Registro** (por recurso) | `entities/[recurso]/filters.ts`              | allowlist: campo → columna + ops + validación |
| **Parser + Traductor**     | `shared/lib/list-query/{parse,translate}.ts` | URL → `ListQuery` → Drizzle                   |

El registro vive en `entities/` porque referencia columnas de `@/db`
(**server-only**: no re-exportar desde el `index.ts` de la entidad hacia el
cliente — ver regla del split barrel).

---

## 2. Formato de URL (plano y compartible)

```
?estado=activo,suspendido&nombre=jose&goles__gte=5&sort=-goles,nombre&page=2&pageSize=25
```

- `campo=valor` → usa el `defaultOp` del campo (o `eq`).
- `campo__op=valor` → operador explícito; debe estar en las `ops` del campo.
- valores separados por coma → lista, para `in` / `nin` / `between`.
- `sort=-campo` → desc; `sort=campo` → asc. Solo campos `sortable`.
- `page`, `pageSize` → paginación (pageSize se clampa a `MAX_LIST_PAGE_SIZE`).

Operadores soportados: `eq, ne, in, nin, gt, gte, lt, lte, contains,
containsWords, between, isNull`.

`contains` vs `containsWords`: `contains` exige la frase completa contigua
(`ILIKE '%valor%'`) — buscar "pedro aguilar" NO matchea "Pedro Flores
Aguilar". `containsWords` parte el valor en palabras y exige que cada una
aparezca en la columna, en cualquier orden — es lo que casi siempre se
quiere para un buscador de nombre (ver `entities/player/filters.ts`).

---

## 3. Declarar el registro de un recurso

```typescript
// entities/player/filters.ts   (server-only)
import { z } from "zod";
import { globalPlayers, leagueMembers } from "@/db";
import { defineFilterMap } from "@/shared/lib/list-query";
import { sanitizeToCanonical } from "@/shared/lib/normalize";

export const orgPlayerFilters = defineFilterMap({
	nombre: {
		column: globalPlayers.fullNameCanonical,
		ops: ["contains"],
		defaultOp: "contains",
		value: z.string().min(1),
		transform: sanitizeToCanonical, // acento-insensible
		sortable: true,
	},
	estado: {
		column: leagueMembers.status,
		ops: ["eq", "in"],
		defaultOp: "eq",
		value: z.enum(["active", "suspended", "inactive"]),
	},
	dorsal: {
		column: leagueMembers.dorsal,
		ops: ["eq", "gte", "lte", "between"],
		value: z.coerce.number().int(),
		sortable: true,
	},
});
```

Quitar un campo del registro lo elimina **a la vez** del backend (deja de
aceptarlo) y de la UI (deja de pintarlo). Esa es la fuente de verdad única.

---

## 4. Usarlo en una query de entidad

```typescript
// entities/player/queries.ts
import { buildWhere, buildOrderBy, type ListQuery } from "@/shared/lib/list-query";
import { and, eq } from "drizzle-orm";
import { orgPlayerFilters } from "./filters";

export async function listOrgPlayers(organizationId: string, query: ListQuery) {
	const filterWhere = buildWhere(orgPlayerFilters, query.filters);
	const orderBy = buildOrderBy(orgPlayerFilters, query.sort);
	const offset = (query.page - 1) * query.pageSize;

	// El scope de negocio (org) SIEMPRE se combina aparte: no es filtro de usuario.
	const where = and(eq(leagues.organizationId, organizationId), filterWhere);

	const rows = await db
		.select({
			/* … */
		})
		.from(/* … */)
		.where(where)
		.orderBy(...orderBy)
		.limit(query.pageSize)
		.offset(offset);
	// … + count para el meta de paginación
}
```

**Importante:** los scopes de seguridad/negocio (organización, ciudad activa,
soft-delete) se aplican en la query con su propio `and(...)`, **nunca** como
filtro del usuario. `buildWhere` solo traduce lo que llegó por URL.

---

## 5. Usarlo en el borde (page o route)

```typescript
// Server Component
const parsed = parseListQuery(new URLSearchParams(searchParams), orgPlayerFilters, {
	defaultSort: [{ field: "nombre", dir: "asc" }],
});
const { rows, total } = await listOrgPlayers(orgId, parsed.query);
```

`parseListQuery` es **best-effort**: descarta condiciones inválidas y las
reporta en `parsed.issues`. Una page puede ignorar `issues` (robusto ante
params basura); un route de API puede optar por `apiError(...)` si
`issues.length > 0`.

---

## 6. Qué NO va aquí

- **Lógica OR / grupos anidados.** El contrato es AND plano. Si en el futuro se
  necesita OR, se extiende el contrato sin romper el formato de URL.
- **Filtrado/orden en memoria.** Todo baja a SQL vía el traductor (§17.3).
- **Scopes de negocio** (org, ciudad, borrado) como si fueran filtros de usuario.

---

## 7. Extensiones previstas (aún no implementadas)

1. **Descriptor público para la UI.** Proyectar del registro un objeto
   serializable (`field`, `label`, `controlType`, `options` estáticas) — sin
   columnas Drizzle — que la page baje como props al `FilterBar`. Deja la lista
   de filtros declarada en un solo lugar sin arrastrar `@/db` al cliente.
2. **Endpoint de descubrimiento** `GET /api/[recurso]/filters` — solo si aparece
   un consumidor en runtime (app móvil nativa, cliente externo, filtros por rol).
   Sería una proyección del mismo descriptor; agregarlo después no rompe nada.
3. **Endpoints de opciones dinámicas** (ligas, equipos) para poblar los selects
   cuyas opciones salen de la DB.

---

## 8. Plan de adopción

1. **Paso 1 (hecho):** `shared/lib/list-query` + tests.
2. **Paso 2:** `entities/player/filters.ts` + migrar `listOrgPlayers` y la page
   `/admin/players` al contrato.
3. **Paso 3:** `entities/team/filters.ts` + migrar Equipos.
4. **Paso 4:** UI homogénea (`FilterBar` + descriptor público) según el brief de
   diseño.

Un commit por paso.
