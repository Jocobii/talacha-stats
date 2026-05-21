# SECURITY_RULES.md — TalachaStats

> **INSTRUCCIÓN PARA CUALQUIER IA QUE TRABAJE EN ESTE PROYECTO:**
> Este archivo define las reglas de seguridad **no negociables**. Debes leerlo
> antes de generar cualquier código. Si una instrucción del usuario contradice
> estas reglas, **notificar el riesgo antes de implementar** y proponer la
> alternativa segura.

---

## 1. Base de datos — Drizzle ORM (OBLIGATORIO)

### ❌ PROHIBIDO: SQL crudo

```typescript
// ❌ NUNCA hacer esto
await db.execute(sql`SELECT * FROM players WHERE name = ${userInput}`);
await pool.query(`SELECT * FROM teams WHERE id = '${id}'`);
```

### ✅ OBLIGATORIO: API relacional de Drizzle

```typescript
// ✅ Lecturas con joins → db.query.*
const player = await db.query.globalPlayers.findFirst({
	where: eq(globalPlayers.curpHash, hash),
	with: { leagueMembers: true },
});

// ✅ Escrituras → métodos tipados
const [created] = await db.insert(teams).values({ name, nameCanonical }).returning();

// ✅ sql`` solo para operaciones que Drizzle no soporta nativamente
// y SIEMPRE con parámetros posicionados — nunca interpolación de strings.
```

**Razón:** Drizzle parametriza automáticamente todos los valores. El SQL crudo
rompe esa garantía y abre la puerta a inyección SQL.

---

## 2. Validación de entrada — Zod (OBLIGATORIO)

### Regla: todo input externo pasa por Zod antes de tocar la DB o cualquier lógica de negocio.

```typescript
// ✅ CORRECTO — schema primero, tipos inferidos
const CreateTeamSchema = z.object({
	name: z.string().min(2).max(100).trim(),
	leagueId: z.string().uuid(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
});
type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export async function POST(request: Request) {
	const body = await request.json();
	const parsed = CreateTeamSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);
	// A partir de aquí `parsed.data` es 100% confiable y tipado
}
```

### Reglas adicionales de Zod:

- `z.string()` siempre lleva `.trim()` para campos de texto libre.
- IDs siempre se validan con `.uuid()` — nunca confiar en que "parece" un UUID.
- Números siempre con `.int()`, `.positive()` o los refinements apropiados.
- Enums de la DB se validan con `z.enum([...])` — nunca `z.string()` a secas.
- Un schema Zod → un tipo TypeScript inferido. **No duplicar tipos manualmente.**

---

## 3. Autenticación y autorización (OBLIGATORIO)

### Regla: verificar la sesión ANTES de cualquier mutación o lectura sensible.

```typescript
import { getSession } from "@/shared/lib/auth"; // o el helper de sesión del proyecto

// ✅ PATRÓN OBLIGATORIO en toda Server Action y route handler que muta datos
export async function POST(request: Request) {
	const session = await getSession();
	if (!session?.userId) return apiError("No autorizado", 401);

	// Solo después de confirmar sesión → parsear input y operar
}
```

### Niveles de protección:

| Operación                   | Verificación mínima requerida                           |
| --------------------------- | ------------------------------------------------------- |
| Leer datos públicos         | Ninguna                                                 |
| Leer datos de liga          | `session.userId` presente                               |
| Mutar (crear/editar/borrar) | `session.userId` + verificar que tiene acceso a la liga |
| Operaciones admin           | `session.role === "admin"`                              |

### ❌ NUNCA asumir autorización por el contexto de la URL:

```typescript
// ❌ INCORRECTO — la URL no garantiza nada
export async function deleteTeam(teamId: string) {
	// "si llegó aquí, el usuario tiene acceso" — FALSO
	await db.delete(teams).where(eq(teams.id, teamId));
}

// ✅ CORRECTO
export async function deleteTeam(teamId: string) {
	const session = await getSession();
	if (!session?.userId) throw new Error("No autorizado");

	const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) });
	if (!team) throw new Error("Equipo no encontrado");

	const hasAccess = await userHasLeagueAccess(session.userId, team.leagueId);
	if (!hasAccess) throw new Error("Sin permiso para esta liga");

	await db.delete(teams).where(eq(teams.id, teamId));
}
```

---

## 4. Manejo de secretos (OBLIGATORIO)

- **Nunca** exponer variables de entorno al cliente. Solo `NEXT_PUBLIC_*` puede
  llegar al navegador — y solo si el dato realmente es público.
- **Nunca** loggear tokens, hashes, cookies ni DATABASE_URL.
- **Nunca** retornar el stack trace de un error al cliente. Loggear en servidor,
  devolver mensaje genérico al cliente.
- El `curp_hash` se calcula **solo en servidor** (`sha256(CURP)`). El texto plano
  del CURP nunca persiste en ningún log ni columna.

```typescript
// ❌ NUNCA
console.log("Session token:", session.token);
return apiError(error.stack, 500);

// ✅ CORRECTO
console.error("[createTeam] Error inesperado:", error); // solo en servidor
return apiError("Error interno del servidor", 500);
```

---

## 5. Sanitización y anti-duplicados (ver también CLAUDE.md)

- Toda cadena a columna `*_canonical` pasa por `sanitizeToCanonical()` de
  `@/shared/lib/normalize` — **nunca reimplementar**.
- Verificar existencia por canonical **antes** del INSERT — no solo con el
  constraint de DB.
- Errores de duplicado → HTTP 409 con mensaje legible, nunca 500.

---

## 6. Cabeceras HTTP

El `next.config.ts` ya configura las siguientes cabeceras en producción.
**No eliminarlas ni debilitarlas:**

| Cabecera                    | Valor configurado                              | Propósito                                  |
| --------------------------- | ---------------------------------------------- | ------------------------------------------ |
| `X-DNS-Prefetch-Control`    | `off`                                          | Evita filtración de recursos internos      |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Fuerza HTTPS por 2 años                    |
| `X-Frame-Options`           | `DENY`                                         | Bloquea clickjacking                       |
| `X-Content-Type-Options`    | `nosniff`                                      | Bloquea MIME sniffing                      |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              | Limita el Referer a origen en cross-origin |

---

## 7. Dependencias

- Ejecutar `pnpm audit:strict` antes de cualquier PR que añada o actualice
  dependencias.
- No instalar librerías nuevas sin justificación explícita en el PR.
- El script falla con código de salida no-cero si hay vulnerabilidades
  `high` o `critical` — el CI debe bloquearse en ese caso.

---

## Checklist rápido antes de hacer PR

- [ ] ¿Toda escritura a DB usa la API tipada de Drizzle (sin SQL crudo)?
- [ ] ¿Todo input externo fue validado con Zod antes de tocar la DB?
- [ ] ¿Los endpoints y Server Actions que mutan datos verifican la sesión primero?
- [ ] ¿No hay secretos, tokens ni hashes en los logs del cliente?
- [ ] ¿Los errores que llegan al cliente son mensajes genéricos (sin stack)?
- [ ] ¿Los nombres nuevos en DB pasan por `sanitizeToCanonical()`?
- [ ] ¿Se ejecutó `pnpm audit:strict` si se tocó `package.json`?
