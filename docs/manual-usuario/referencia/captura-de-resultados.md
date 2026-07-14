---
titulo: Captura de resultados — Referencia
tipo: referencia
modulo: captura
ruta_ui: /admin/leagues/[id]/captura
audiencia: organizador
rol_minimo: admin
estado: borrador
version-app: as-is 2026-07
---

# Captura de resultados — Referencia

> Ejemplo llenado para mostrar la plantilla en uso. Verificar cada dato contra
> la UI antes de marcar `estado: oficial`.

## Qué es

Pantalla que lista todas las **jornadas** de una liga con el **progreso de
captura** de cada una: cuántos partidos ya tienen resultado registrado y cuántos
faltan. Es el punto de entrada para ir a capturar la cédula de cada partido.

## Cómo se llega

Panel de la liga → tab **Captura**. Ruta: `/admin/leagues/[id]/captura`.

## Precondiciones / dependencias

- La liga debe existir y tener **calendario generado** (jornadas creadas por el
  sorteo). Sin jornadas, la pantalla aparece vacía.
- Los partidos se crean al generar el calendario; esta pantalla solo los lee.

## Elementos de la pantalla

| Elemento             | Qué hace                                              | Restricciones / validaciones             |
| -------------------- | ----------------------------------------------------- | ---------------------------------------- |
| Tarjeta de jornada   | Muestra número, fecha, fase y avance de captura       | Solo lectura; se ordena por número       |
| Contador X/Y         | Partidos capturados (X) sobre total de la jornada (Y) | Se recalcula según el estado del partido |
| Botón "ir a captura" | Abre el dashboard de captura de esa jornada           | Requiere partidos en la jornada          |

## Estados posibles

Un partido se cuenta como **capturado** cuando su estado es uno de:

- `played` — jugado con resultado registrado.
- `walkover_home` / `walkover_away` — victoria por default (no se presentó un equipo).
- `suspended` — partido suspendido.
- `postponed` — pospuesto.
- `completed` — cerrado.

Cualquier otro estado (ej.: `scheduled`) cuenta como **pendiente**.

## Reglas de negocio y restricciones

- El progreso `X/Y` es informativo: refleja el estado real de cada partido, no
  una marca manual.
- Las jornadas se muestran ordenadas por número ascendente.
- Esta pantalla no edita datos; toda captura ocurre en el dashboard de la jornada
  y en la cédula de cada partido.

## Casos y ejemplos

- **Caso normal:** jornada con 6 partidos, 4 jugados → la tarjeta muestra `4/6`
  y sigue apareciendo como pendiente de cerrar.
- **Caso límite:** jornada sin partidos (0 total) → la tarjeta aparece pero sin
  progreso; revisar que el sorteo/calendario haya generado los partidos.
- **Error frecuente:** "no veo mis jornadas" → casi siempre el calendario no se
  ha generado todavía (ver flujo de Sorteo).

## Relacionado

- [Cédula de partido](./cedula-de-partido.md) _(por documentar)_
- [Sorteo y calendario](./sorteo.md) _(por documentar)_
- Cómo capturar una cédula → `../how-to/capturar-cedula.md` _(por documentar)_
