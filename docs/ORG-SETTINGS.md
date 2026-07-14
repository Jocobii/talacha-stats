# Configuración de la organización — hub pendiente

> **Estado:** propuesta sin construir (jul 2026). No hay pantalla hoy. Este doc deja evidencia del hueco y de cómo debería armarse el módulo cuando se priorice — pedido explícito de Jocobi para no perder el contexto.

## 0. El hueco

Hoy **no existe una pantalla de autoservicio** donde un organizador pueda administrar los datos de su propia organización (nombre, logo, slug/URL única, ciudad). Lo que sí existe está repartido y es parcial:

| Qué                                            | Dónde vive                                                                                                                       | Quién lo usa                                                           | Completo                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| Tema visual (colores, preset)                  | `/admin/organizacion/tema` (`features/org-theming`)                                                                              | Organizer/owner de su propia org                                       | Sí — tiene UI                                                  |
| Reglamento por defecto (`organization_config`) | Backend en `entities/organization-config` + seed al crear liga (docs/MODULOS-GESTION-LIGA.md §4.5/§5.1b)                         | Nadie — sin UI ni endpoint                                             | **No — falta UI y `GET/PATCH /api/organizations/[id]/config`** |
| Nombre, logo, slug, ciudad                     | Backend YA EXISTE: `PATCH /api/organizations/[id]` (`updateOrganization`, `UpdateOrganizationSchema` en `entities/organization`) | Nadie — el endpoint no se llama desde ninguna pantalla de autoservicio | **No — falta UI**                                              |
| Ligas de la organización + miembros            | `/admin/organizations/[id]` (`OrganizationDetailClient.tsx`)                                                                     | Solo **owner** (vista cross-org, no self-service del organizer)        | Parcial — lista, pero no edita nombre/logo/slug tampoco ahí    |

Conclusión: el dato y hasta el endpoint de "nombre/logo/slug" ya existen (`updateOrganization`), pero **nadie los puede usar** porque no hay formulario en ningún lado que llame ese PATCH para el caso de autoservicio del organizer.

## 1. Propuesta de forma (cuando se construya)

Un hub en `/admin/organizacion` (singular, implícito a la sesión — mismo patrón que `/admin/organizacion/tema` ya usa, sin `[id]` porque un organizer solo administra la suya) con tabs, mismo patrón de `LeagueTabBar` / `leagues/[id]/layout.tsx`:

- **General** — nombre, logo (upload), slug/URL única, ciudad. Backend: ya existe (`PATCH /api/organizations/[id]`). Falta: página + formulario (React Hook Form + Zod, §7.2) + subida de logo (revisar cómo se sube el logo hoy, si acaso, en onboarding).
- **Tema** — ya construido, mover/enlazar aquí tal cual (`/admin/organizacion/tema`).
- **Reglamento por defecto** — nueva. Necesita:
  - Endpoint `GET/PATCH /api/organizations/[id]/config` (mismo Zod schema `UpdateOrganizationConfigSchema` que ya existe en `entities/organization-config/model.ts`).
  - Feature `features/organization-rules/` — calco de `features/tournament-rules/rules.ts` pero sin `locked_at` (la config de organización nunca se congela, §4.5).
  - UI — puede reusar casi 1:1 los componentes de `features/tournament-rules/ui/` (`TiebreakerList`, `DisciplineSection`, `ReinforcementSection`, `FinanceSection`) parametrizados por el shape de `OrganizationConfigDto` en vez de `LeagueConfigDto` — son estructuralmente idénticos salvo `locked_at`.
- **Miembros** — hoy vive en `/admin/organizations/[id]` (vista de owner). Evaluar si se consolida aquí para el organizer o se deja como está (es owner-only hoy, decisión de producto pendiente).

## 2. Por qué no se construye ahora

Sigue el gate de diseño de docs/MODULOS-GESTION-LIGA.md §8: toda UI nueva se detiene a preguntar si Jocobi tiene diseño antes de escribir componentes. Este doc es la evidencia para retomarlo — no bloquea nada de lo ya construido (Épica A de docs/MODULOS-GESTION-LIGA.md funciona sin esta pantalla; el default de organización se puede sembrar por SQL mientras tanto).

## 3. Siguiente paso cuando se priorice

1. Preguntar diseño (§8 gate) antes de tocar `ui/`.
2. Empezar por **Reglamento por defecto** (es lo más nuevo y lo que motivó este doc) o por **General** (el backend ya existe, es el más barato de cerrar) — a decidir con Jocobi.
3. Seguir el orden estándar de §3.7 AGENTS.md: modelo → queries → feature → endpoint → UI.
