# Roadmap: Registro Público de Organizadores

> Objetivo: Abrir TalachaStats al público. Cualquier persona puede registrarse como organizador,
> crear su organización y subir su liga. Los datos quedan en modo **trial** hasta que nosotros
> los verificamos manualmente. Solo las ligas verificadas aparecen en vistas cross-org.

---

## Estado actual del codebase (referencia)

| Qué existe                                             | Estado       |
| ------------------------------------------------------ | ------------ |
| `POST /api/auth/login` + página `/login`               | ✅ Funciona  |
| `users` table con email + passwordHash + role + active | ✅ Existe    |
| `organizations` table con name + slug + city           | ✅ Existe    |
| `users.email_verified`                                 | ❌ Falta     |
| `organizations.status` (trial/verified)                | ❌ Falta     |
| Registro público                                       | ❌ No existe |
| Onboarding (crear org al registrarse)                  | ❌ No existe |
| Middleware root de autenticación                       | ❌ No existe |

---

## Epics y orden de ejecución

```
Epic A: Schema          →  Epic B: Email service
                               ↓
                        Epic C: Registro público
                               ↓
                        Epic D: Onboarding forzado
                               ↓
                        Epic E: Sistema Trial/Verified
                               ↓
                        Epic F: Admin — Verificaciones
```

---

## Epic A — Schema y migraciones

### A1 · Migración: campos de verificación de email en `users`

**Labels:** `schema`, `migration`, `backend`
**Bloquea:** C1, C2, C5

**Qué hacer:**

Agregar a la tabla `users`:

```sql
email_verified          boolean   NOT NULL DEFAULT false
email_verification_token text     NULLABLE UNIQUE
email_verification_expires_at timestamp with timezone  NULLABLE
```

Y en `schema.ts`:

```ts
emailVerified: boolean("email_verified").notNull().default(false),
emailVerificationToken: text("email_verification_token").unique(),
emailVerificationExpiresAt: timestamp("email_verification_expires_at", { withTimezone: true }),
```

**Criterios de aceptación:**

- [ ] Migración de Drizzle generada y aplicada en dev
- [ ] Schema.ts actualizado
- [ ] Los usuarios existentes quedan con `email_verified = true` (son cuentas ya validadas manualmente)

---

### A2 · Migración: `status` en `organizations`

**Labels:** `schema`, `migration`, `backend`
**Bloquea:** E1, E2, E3, F2, F3

**Qué hacer:**

Agregar a la tabla `organizations`:

```sql
status                    text  NOT NULL DEFAULT 'trial'   -- 'trial' | 'verified'
verification_requested_at timestamp with timezone  NULLABLE
```

Y en `schema.ts`:

```ts
status: text("status").notNull().default("trial"), // "trial" | "verified"
verificationRequestedAt: timestamp("verification_requested_at", { withTimezone: true }),
```

**Criterios de aceptación:**

- [ ] Migración aplicada
- [ ] Las organizaciones existentes (nuestras ligas piloto) quedan con `status = 'verified'`
- [ ] Schema.ts actualizado

---

## Epic B — Servicio de email

### B1 · Configurar proveedor de email (Resend)

**Labels:** `infra`, `email`, `backend`
**Bloquea:** C1

**Qué hacer:**

Instalar Resend (`npm install resend`), configurar variable `RESEND_API_KEY` en `.env`.

Crear `shared/lib/email.ts` con función base:

```ts
export async function sendEmail(to: string, subject: string, html: string): Promise<void>;
```

**Criterios de aceptación:**

- [ ] `RESEND_API_KEY` en `.env.example` documentado
- [ ] `shared/lib/email.ts` creado y funcionando
- [ ] Email de prueba llega a bandeja de entrada (no spam)

---

### B2 · Template de email de verificación

**Labels:** `email`, `backend`
**Depende de:** B1
**Bloquea:** C1

**Qué hacer:**

Crear `shared/lib/email-templates.ts` con función:

```ts
export function verificationEmailHtml(params: { name: string; verificationUrl: string }): string;
```

Email simple, en español, con el link de verificación. Sin librerías de templates — HTML inline limpio.

**Criterios de aceptación:**

- [ ] Template renderiza correctamente en Gmail y en cliente móvil
- [ ] El link de verificación es visible y clicable
- [ ] Menciona que el link expira en 24 horas

---

## Epic C — Registro público

### C1 · Endpoint `POST /api/auth/register`

**Labels:** `backend`, `auth`
**Depende de:** A1, B2
**Bloquea:** C3

**Qué hacer:**

Crear `app/api/auth/register/route.ts`. Flujo:

1. Validar body con Zod: `{ name, email, password }`
2. Verificar que el email no esté registrado
3. Crear usuario con `emailVerified = false`
4. Generar token de verificación (random UUID o crypto.randomBytes)
5. Guardar token + expiración (24h) en el usuario
6. Enviar email de verificación
7. Retornar `apiSuccess({ message: "Revisa tu correo" })`

Schema Zod en `entities/user/model.ts`:

```ts
export const RegisterSchema = z.object({
	name: z.string().min(2).max(80),
	email: z.string().email().toLowerCase(),
	password: z.string().min(8, "Mínimo 8 caracteres"),
});
```

**Criterios de aceptación:**

- [ ] Email duplicado retorna `apiError("Este correo ya está registrado", 409)`
- [ ] Usuario creado con `emailVerified = false`, `role = 'organizer'`, `organizationId = null`
- [ ] Email de verificación llega correctamente
- [ ] Token expira a las 24 horas
- [ ] Contraseña hasheada correctamente (usa `hashPassword` existente)

---

### C2 · Endpoint `GET /api/auth/verify-email?token=xxx`

**Labels:** `backend`, `auth`
**Depende de:** A1
**Bloquea:** C4

**Qué hacer:**

Crear `app/api/auth/verify-email/route.ts`. Flujo:

1. Leer `token` del query string
2. Buscar usuario con ese token
3. Verificar que no haya expirado
4. Marcar `emailVerified = true`, limpiar token y expiración
5. Crear sesión (como en login) y redirigir a `/onboarding`

**Criterios de aceptación:**

- [ ] Token válido → sesión creada + redirect a `/onboarding`
- [ ] Token inválido → redirect a `/registro?error=token-invalido`
- [ ] Token expirado → redirect a `/registro?error=token-expirado`
- [ ] Token usado dos veces → error (ya no existe en DB)

---

### C3 · Página `/registro`

**Labels:** `frontend`, `auth`
**Depende de:** C1

**Qué hacer:**

Crear `app/registro/page.tsx` (Client Component). Formulario con:

- Nombre completo
- Correo electrónico
- Contraseña (mínimo 8 caracteres)
- Botón "Crear cuenta"

Después de submit exitoso, redirigir a `/verificar-email`.

Misma estética que `/login` (dark, verde, centrado).

Agregar link "¿Ya tienes cuenta? Inicia sesión" apuntando a `/login`.

**Criterios de aceptación:**

- [ ] Validación client-side antes de enviar (feedback inmediato)
- [ ] Errores de la API se muestran en la UI
- [ ] Link "Ya tienes cuenta" visible y funcional
- [ ] Responsive en móvil

---

### C4 · Página `/verificar-email`

**Labels:** `frontend`, `auth`
**Depende de:** C2

**Qué hacer:**

Crear `app/verificar-email/page.tsx`. Pantalla estática que dice:

> "Revisa tu correo"
> Te enviamos un link de verificación a [email]. Haz clic en el link para activar tu cuenta.
> El link expira en 24 horas.

Opcionalmente: botón "Reenviar correo" (puede ser un segundo endpoint o quedar para después).

**Criterios de aceptación:**

- [ ] Muestra el email al que se envió (pasado como query param desde `/registro`)
- [ ] No tiene estado interactivo complejo — es pantalla informativa

---

### C5 · Bloquear login si email no verificado

**Labels:** `backend`, `auth`
**Depende de:** A1

**Qué hacer:**

Modificar `app/api/auth/login/route.ts`. Después de verificar la contraseña, agregar:

```ts
if (!user.emailVerified) {
	return apiError("Verifica tu correo antes de iniciar sesión", 403);
}
```

Mostrar el error en la página de login con instrucción de revisar el correo.

**Criterios de aceptación:**

- [ ] Usuario no verificado no puede loguear
- [ ] Error en login muestra mensaje claro (no genérico "credenciales incorrectas")

---

## Epic D — Onboarding forzado

### D1 · Middleware root: redirigir a `/onboarding` si no tiene org

**Labels:** `backend`, `auth`, `middleware`
**Depende de:** A1
**Bloquea:** D3

**Qué hacer:**

Crear `src/middleware.ts` (Next.js middleware). Lógica:

```
Ruta /admin/** + sesión válida + user.organizationId === null
  → redirect /onboarding

Ruta /admin/** + sin sesión
  → redirect /login?from=[ruta original]

Ruta /onboarding + sin sesión
  → redirect /login
```

El middleware corre en el Edge Runtime — solo verificar el token de sesión (no consultar DB).
Guardar `organizationId` en el token de sesión para evitar consultas en el edge.

> **Nota:** Esto requiere re-emitir la cookie de sesión después del onboarding con el `organizationId` incluido, o usar un mecanismo alternativo (e.g. el layout de admin ya consulta el user completo).

**Criterios de aceptación:**

- [ ] Organizer sin org no puede acceder a `/admin`
- [ ] Acceso a `/admin` sin sesión redirige a login con `from` param
- [ ] Owner (`role = 'owner'`) no es redirigido a onboarding (no necesita org)

---

### D2 · Endpoint `POST /api/organizations`

**Labels:** `backend`
**Depende de:** A2
**Bloquea:** D3

**Qué hacer:**

Crear `app/api/organizations/route.ts`. Flujo:

1. Verificar sesión
2. Verificar que el user aún no tiene org
3. Validar body: `{ name, city }`
4. Generar slug único a partir del nombre
5. Crear organización con `status = 'trial'`
6. Actualizar `users.organizationId` con el nuevo ID
7. Retornar la org creada

Schema Zod en `entities/organization/model.ts` (crear si no existe):

```ts
export const CreateOrganizationSchema = z.object({
	name: z.string().min(2).max(100),
	city: z.string().min(2).max(80),
});
```

**Criterios de aceptación:**

- [ ] Slug generado automáticamente y único (ej: "liga-lunes" → "liga-lunes-2" si ya existe)
- [ ] `status = 'trial'` por default
- [ ] `organizationId` del usuario actualizado correctamente
- [ ] Si el usuario ya tiene org, retorna `409`

---

### D3 · Página `/onboarding`

**Labels:** `frontend`
**Depende de:** D1, D2

**Qué hacer:**

Crear `app/onboarding/page.tsx` (Client Component). Formulario con:

- Nombre de la organización/liga
- Ciudad

Después de submit exitoso, redirigir a `/admin`.

Contexto visual: explicar brevemente para qué sirve ("Esta será la identidad pública de tu organización en TalachaStats").

**Criterios de aceptación:**

- [ ] No accesible sin sesión (middleware lo protege)
- [ ] Si el user ya tiene org, redirige directo a `/admin`
- [ ] Submit crea la org y redirige a `/admin`
- [ ] Misma estética que login/registro

---

## Epic E — Sistema Trial/Verified

### E1 · Banner trial en el dashboard del organizador

**Labels:** `frontend`
**Depende de:** A2

**Qué hacer:**

En `app/admin/layout.tsx`, después de obtener el user, obtener su organización y verificar `status`.

Si `status === 'trial'`, mostrar banner amarillo/naranja fijo en la parte superior:

> ⚠️ **Tu liga está en modo de prueba.** Los datos no aparecen en rankings globales.
> [Solicitar verificación →]

El link abre un modal o redirige a una página de solicitud.

**Criterios de aceptación:**

- [ ] Banner visible solo si `org.status === 'trial'`
- [ ] No aparece si está verificada
- [ ] No aparece para `role = 'owner'`

---

### E2 · Endpoint `POST /api/organizations/[id]/request-verification`

**Labels:** `backend`
**Depende de:** A2

**Qué hacer:**

Crear `app/api/organizations/[id]/request-verification/route.ts`. Flujo:

1. Verificar sesión y que el user pertenece a esa org
2. Verificar que `status === 'trial'` (no pedir verificación dos veces)
3. Marcar `verificationRequestedAt = now()`
4. (Opcional) Enviar email interno a nosotros notificando la solicitud
5. Retornar éxito

**Criterios de aceptación:**

- [ ] Solo el dueño de la org puede solicitar verificación
- [ ] Si ya se solicitó, retorna mensaje apropiado (no error, sino "ya enviado")
- [ ] `verificationRequestedAt` queda guardado en DB

---

### E3 · Badge "Liga en verificación" en páginas públicas

**Labels:** `frontend`
**Depende de:** A2

**Qué hacer:**

En `app/(public)/org/[slug]/page.tsx` y `app/(public)/org/[slug]/[leagueSlug]/page.tsx`,
si la organización tiene `status === 'trial'`, mostrar un badge discreto:

```
🔵 Liga en verificación
```

Texto pequeño, gris o azul claro, bajo el nombre de la liga. No intrusivo.

**Criterios de aceptación:**

- [ ] Badge visible en org pública y en liga pública si `status === 'trial'`
- [ ] Desaparece cuando `status === 'verified'`
- [ ] No afecta el diseño de ligas verificadas

---

### E4 · Filtrar `verified` en queries cross-org

**Labels:** `backend`
**Depende de:** A2

**Qué hacer:**

En cualquier query que mezcle datos de múltiples organizaciones (rankings globales,
`/ranking`, listado de ligas públicas `/ligas`), agregar filtro:

```ts
where: eq(organizations.status, "verified");
```

Actualmente la Capa 4 no está construida, pero revisar los endpoints existentes
(`/api/leagues`, `/public/ligas`, `/ranking`) y aplicar el filtro donde corresponda.

**Criterios de aceptación:**

- [ ] `/ligas` (listado público) solo muestra ligas de orgs verificadas
- [ ] `/ranking` solo incluye jugadores de orgs verificadas
- [ ] Ligas trial son accesibles por URL directa (no están bloqueadas, solo no se listan)

---

## Epic F — Admin: Gestión de verificaciones

### F1 · Panel `/admin/verifications` — lista de solicitudes pendientes

**Labels:** `frontend`, `backend`, `admin`
**Depende de:** A2, E2

**Qué hacer:**

Crear `app/admin/verifications/page.tsx`. Server Component que muestra tabla con:

- Nombre de la organización
- Ciudad
- Email del dueño
- Fecha de solicitud
- Botón "Verificar" y "Rechazar"

Solo accesible para `role = 'owner'`.

Agregar link "Verificaciones" en el nav de admin (solo visible para owners).

**Criterios de aceptación:**

- [ ] Solo owners pueden acceder
- [ ] Lista orgs con `verificationRequestedAt IS NOT NULL AND status = 'trial'`
- [ ] Ordenadas por fecha de solicitud (más antiguas primero)

---

### F2 · Endpoint `PATCH /api/organizations/[id]` — aprobar/rechazar

**Labels:** `backend`, `admin`
**Depende de:** A2

**Qué hacer:**

Crear o extender `app/api/organizations/[id]/route.ts`. Solo `role = 'owner'` puede ejecutar.

Body: `{ status: 'verified' | 'trial' }`

Flujo al verificar:

1. Actualizar `status = 'verified'`
2. Limpiar `verificationRequestedAt`
3. (Opcional) Enviar email al organizador notificando la verificación

**Criterios de aceptación:**

- [ ] Solo owners pueden cambiar el status
- [ ] Cambio es inmediato (no requiere restart)
- [ ] Email de confirmación al organizador cuando se aprueba

---

### F3 · Email de confirmación al organizador al ser verificado

**Labels:** `email`, `backend`
**Depende de:** B1, F2

**Qué hacer:**

Crear template en `shared/lib/email-templates.ts`:

```ts
export function verifiedEmailHtml(params: { orgName: string; dashboardUrl: string }): string;
```

Enviar desde el endpoint F2 al aprobar.

**Criterios de aceptación:**

- [ ] Email llega al correo del dueño de la org
- [ ] Menciona el nombre de la org y da el link al dashboard
- [ ] Tono celebratorio pero profesional

---

## Resumen de historias

| #   | Historia                                            | Epic       | Depende de |
| --- | --------------------------------------------------- | ---------- | ---------- |
| A1  | Migración: verificación de email en users           | Schema     | —          |
| A2  | Migración: status en organizations                  | Schema     | —          |
| B1  | Configurar Resend                                   | Email      | —          |
| B2  | Template email de verificación                      | Email      | B1         |
| C1  | `POST /api/auth/register`                           | Registro   | A1, B2     |
| C2  | `GET /api/auth/verify-email`                        | Registro   | A1         |
| C3  | Página `/registro`                                  | Registro   | C1         |
| C4  | Página `/verificar-email`                           | Registro   | C2         |
| C5  | Bloquear login si no verificado                     | Registro   | A1         |
| D1  | Middleware root                                     | Onboarding | A1         |
| D2  | `POST /api/organizations`                           | Onboarding | A2         |
| D3  | Página `/onboarding`                                | Onboarding | D1, D2     |
| E1  | Banner trial en dashboard                           | Trial      | A2         |
| E2  | `POST /api/organizations/[id]/request-verification` | Trial      | A2         |
| E3  | Badge en páginas públicas                           | Trial      | A2         |
| E4  | Filtro verified en queries cross-org                | Trial      | A2         |
| F1  | Panel `/admin/verifications`                        | Admin      | A2, E2     |
| F2  | `PATCH /api/organizations/[id]`                     | Admin      | A2         |
| F3  | Email confirmación al verificar                     | Admin      | B1, F2     |

**Total: 19 historias**

---

## Orden sugerido para PRs

```
PR 1: A1 + A2  (schema — base de todo)
PR 2: B1 + B2  (email service)
PR 3: C1 + C2 + C5  (lógica de registro en backend)
PR 4: C3 + C4  (UI de registro)
PR 5: D1 + D2 + D3  (onboarding completo)
PR 6: E1 + E2 + E3 + E4  (sistema trial/verified)
PR 7: F1 + F2 + F3  (admin de verificaciones)
```
