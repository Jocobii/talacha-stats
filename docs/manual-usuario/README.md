---
titulo: Manual de usuario — TalachaStats
audiencia: organizadores de liga
estado: en-construccion
version-app: as-is 2026-07
---

# Manual de usuario — TalachaStats

Documentación oficial de los **flujos existentes a nivel UI** para
**organizadores de liga**. Es la fuente de verdad de "qué es, cómo funciona,
restricciones y casos" de cada pantalla del panel `/admin`.

Este manual está diseñado para cumplir tres metas a la vez:

1. Servir como **manual de usuario** legible por una persona.
2. Alimentar un **manual técnico** (referencia estructurada).
3. Ser el **corpus de un asistente virtual (RAG)** que responda preguntas
   vagas o específicas con documentación oficial.

---

## 1. Marco: por qué está organizado así (Diátaxis)

La documentación sigue el marco **Diátaxis** (Daniele Procida — https://diataxis.fr),
adoptado por Django, Cloudflare, Gatsby y Canonical/Ubuntu. Separa el contenido
por la necesidad del lector, no por el módulo. Cada carpeta es un tipo distinto:

| Carpeta        | Tipo        | Responde a…                         | Ejemplo                                   |
| -------------- | ----------- | ----------------------------------- | ----------------------------------------- |
| `tutoriales/`  | Aprendizaje | "Quiero aprender desde cero"        | Crear tu primera liga de principio a fin  |
| `how-to/`      | Tarea       | "Necesito hacer X ahora"            | Cómo capturar una cédula de partido       |
| `referencia/`  | Consulta    | "¿Qué hace este campo/restricción?" | Pantalla Captura: estados, campos, reglas |
| `explicacion/` | Comprensión | "¿Por qué funciona así?"            | Por qué la identidad se ancla al CURP     |

**Regla de oro para el asistente IA:** la carpeta `referencia/` es la que mejor
alimenta al chatbot (autocontenida, exhaustiva, seca). Las respuestas "vagas"
del usuario suelen resolverse con un `how-to`; las "específicas" con `referencia`.

## 2. Convención de escritura por tópico (topic-based authoring)

Cada archivo es **autocontenido**: se entiende sin haber leído el anterior.
Esto es el principio de DITA (estándar OASIS) y es lo que hace que un fragmento
recuperado por el asistente tenga sentido aislado. En la práctica:

- Un archivo = un flujo o una pantalla. No mezclar temas.
- Encabezados descriptivos y consistentes (ver plantillas).
- Nada de "como vimos arriba" entre archivos distintos.

## 3. Estilo

Se sigue la **Google Developer Documentation Style Guide**
(https://developers.google.com/style): voz activa, presente, segunda persona
("haz clic en…"), frases cortas. Términos del dominio en español y consistentes
(liga, jornada, cédula, sorteo, cancha, reglamento) — ver `GLOSARIO.md`.

## 4. Metadatos (frontmatter) — obligatorios

Todo archivo abre con frontmatter YAML. El asistente RAG lo usa para filtrar y
citar la fuente:

```yaml
---
titulo: <título legible>
tipo: tutorial | how-to | referencia | explicacion
modulo: <feature/ruta principal, ej. captura>
ruta_ui: <ruta real, ej. /admin/leagues/[id]/captura>
audiencia: organizador
rol_minimo: <owner | admin | narrador | …>
estado: borrador | revisado | oficial
version-app: <fecha o release>
---
```

## 5. Cómo contribuir

1. Copia la plantilla correspondiente de `_plantillas/`.
2. Llénala verificando contra la UI real (no inventar comportamiento).
3. Marca `estado: borrador` hasta que Jocobi la revise → `oficial`.
4. Un archivo por PR cuando sea posible (Docs-as-Code, revisión por PR).

## 6. Referencias del enfoque (verificables)

- **Diátaxis** — D. Procida. https://diataxis.fr
- **Docs as Code / comunidad** — Write the Docs. https://www.writethedocs.org
- **Libro** — _Docs for Developers_, Bhatti et al., Apress 2021.
- **Estilo** — Google Developer Documentation Style Guide.
- **Estructura técnica** — arc42 (https://arc42.org) y C4 Model
  (https://c4model.com) para el manual técnico (ver `../arquitectura/`).
- **DITA (topic-based authoring)** — estándar OASIS.
- **RAG (para el asistente)** — Lewis et al., _Retrieval-Augmented Generation
  for Knowledge-Intensive NLP Tasks_, NeurIPS 2020.

Ver `INVENTARIO-FLUJOS.md` para el backlog de pantallas por documentar.
