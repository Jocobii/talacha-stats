---
titulo: <Pantalla/Flujo> — Referencia
tipo: referencia
modulo: <modulo>
ruta_ui: <ruta real, ej. /admin/leagues/[id]/captura>
audiencia: organizador
rol_minimo: <owner | admin | narrador>
estado: borrador
version-app: <fecha>
---

# <Pantalla/Flujo> — Referencia

## Qué es

Descripción en 1–3 frases de qué es esta pantalla y para qué sirve dentro de la
gestión de la liga.

## Cómo se llega

Ruta UI y navegación (menú → sección → tab). Precondiciones para que aparezca.

## Precondiciones / dependencias

Qué debe existir antes (ej.: liga creada, equipos inscritos, calendario
generado). Qué otras pantallas alimentan a esta.

## Elementos de la pantalla

| Elemento      | Qué hace | Restricciones / validaciones      |
| ------------- | -------- | --------------------------------- |
| <botón/campo> | <acción> | <requerido, formato, rango, etc.> |

## Estados posibles

Lista de estados del dato o de la vista y qué significa cada uno (ej.: estados
de un partido: `scheduled`, `played`, `walkover_home`, `suspended`…).

## Reglas de negocio y restricciones

- <Regla>: <detalle y por qué>.
- <Qué NO se puede hacer y qué mensaje aparece>.

## Casos y ejemplos

- **Caso normal:** …
- **Caso límite:** …
- **Error frecuente:** … → cómo se resuelve.

## Relacionado

- [<Otro flujo>](../referencia/<archivo>.md)
- [<How-to correspondiente>](../how-to/<archivo>.md)
