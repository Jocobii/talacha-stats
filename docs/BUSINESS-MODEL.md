# TalachaStats — Modelo de negocio

> **Última revisión:** 2026-07-18
> **Audiencia:** Founder, futuros socios/inversionistas, agentes de IA que ayuden en decisiones de producto con impacto comercial.
> **Documento hermano:** [`SALES-PLAYBOOK.md`](./SALES-PLAYBOOK.md) — cómo se vende esto en la calle.
> **Fuente de verdad de producto:** `AGENTS.md` §1.5. Si algo aquí contradice el posicionamiento, manda `AGENTS.md`.

---

## 0. Resumen en cinco líneas

1. El organizador de una liga madura factura **~$47,200 directos por torneo**, pero por sus manos pasan **~$320,000** de volumen transaccional.
2. Una cuota de software solo puede aspirar al 3-5% de los $47,200. Eso es **~$5,600 al año por liga**: un negocio real pero delgado.
3. El negocio grande está en el **volumen transaccional** (`FINANCE-ENGINE.md`) y en la **base de jugadores** (480 por liga madura), no en la cuota del organizador.
4. Por eso la secuencia es: **entrar gratis por el contenido → cobrar poco por la gestión → monetizar el volumen y al jugador**.
5. Cobrar por uso (equipo inscrito por torneo) y no por membresía mensual, porque entre torneos la liga se apaga 4-8 semanas y ahí es donde se cancelan las suscripciones.

---

## 1. La economía real de una liga

Números de **Novofut** (una de las mejores ligas de la ciudad), liga madura de ~30 equipos, torneo de ~14 jornadas.

### 1.1 Lo que cobra el organizador directamente

| Concepto     | Monto unitario | Quién lo paga       | Total por torneo                    |
| ------------ | -------------- | ------------------- | ----------------------------------- |
| Inscripción  | $800           | Los 30 equipos      | **$24,000**                         |
| Horario fijo | $5,800         | Solo 3-5 equipos    | **$23,200**                         |
| Fianza       | $800           | Los 30 equipos      | $24,000 _(retenida, no es ingreso)_ |
|              |                | **Ingreso directo** | **$47,200**                         |

> **Corrección importante.** El horario fijo es un premium que compra la minoría (3-5 de 30), no un cobro universal. Modelar la liga asumiendo que los 30 equipos pagan $5,800 infla el ingreso 4x y lleva a poner precios imposibles. Es el error más fácil de cometer con estos números.

### 1.2 Lo que pasa por la liga sin ser suyo

Con 30 equipos son 15 partidos por jornada y **210 partidos por torneo**.

| Concepto                  | Rango unitario       | Total por torneo    |
| ------------------------- | -------------------- | ------------------- |
| Arbitraje                 | $600-800 por partido | $126,000 - $168,000 |
| Renta de cancha           | $500-700 por partido | $105,000 - $147,000 |
| Permisos (sin credencial) | variable             | no cuantificado     |
| Multas / reprogramaciones | variable             | no cuantificado     |

### 1.3 La cifra que importa

```
Ingreso directo del organizador ......  $47,200
Fianzas retenidas (flotante) .........  $24,000
Arbitraje + cancha ................... ~$249,000
                                       ──────────
VOLUMEN TRANSACCIONAL POR TORNEO ..... ~$320,000
```

**~$10,700 por equipo por torneo** mueve el ecosistema de una liga. El organizador se queda con una fracción, pero **toca, coordina o dispone de casi todo el flujo**.

Esa brecha entre _lo que gana_ ($47,200) y _lo que mueve_ ($320,000) es la tesis completa del negocio.

---

## 2. Principio rector: nunca cobrar por lo que alimenta el dato

**Registrar jugadores con CURP y capturar cédulas es gratis, ilimitado, en todos los planes, para siempre.**

La identidad global anclada al CURP (`AGENTS.md` §14) es el único activo que no se puede copiar y que mejora solo conforme más ligas de la ciudad entran. Ponerle precio o fricción a la captura mata el activo para ganar unos pesos. Es la decisión más importante de este documento.

Corolarios operativos:

- ❌ No cobrar por jugador registrado — castiga rosters grandes y frena el CURP.
- ❌ No cobrar por cédula capturada — crea incentivo a _no_ capturar.
- ❌ No poner paywall a las stats del jugador — rompe el viral loop (`AGENTS.md` §13).
- ✅ Cobrar por **el derecho a operar el torneo** y por **la presencia/contenido** que sale de él.

---

## 3. Unidad de cobro: equipo inscrito por torneo

| Unidad              | Veredicto      | Por qué                                                                                                                  |
| ------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Equipo × torneo** | ✅ **Elegida** | Escala con el tamaño de liga, se apaga sola en tiempos muertos, y el organizador ya cobra por equipo — solo lo repercute |
| Jugador registrado  | ❌             | Frena el registro CURP, que es el activo                                                                                 |
| Cédula / partido    | ❌             | Desincentiva capturar; impredecible para el organizador                                                                  |
| Membresía mensual   | ❌             | Entre torneos la liga muere 4-8 semanas; ahí cancelan                                                                    |

### 3.1 Precio

Dos anclajes independientes que convergen:

- **3-5% del ingreso directo** del organizador ($47,200) ÷ 30 equipos = **$47-79**
- **~10% de la inscripción** ($800) = **$80**

**Precio de lista: $75 MXN por equipo, por torneo.**

| Verificación                          | Resultado                             |
| ------------------------------------- | ------------------------------------- |
| % del ingreso directo del organizador | 4.8% ✅ (banda sana 3-5%)             |
| % del volumen transaccional           | 0.70%                                 |
| Costo por jugador (roster de 16)      | **$4.70 por temporada** — invisible   |
| Liga madura (30 equipos)              | $2,250 por torneo → **$5,625 al año** |
| Liga nueva (10 equipos)               | $0 — dentro del tier gratis           |

### 3.2 Capa gratuita

**Gratis hasta 10 equipos, sin límite de tiempo.** Arriba de 10 equipos, se cobran todos.

Racional:

- Una liga naciente (8-12 equipos, el perfil de `PRODUCT-STRATEGY.md` §2) opera **completa y gratis**: sorteo, cédulas, tabla, liguilla, perfiles, contenido.
- El cobro entra exactamente cuando la liga creció — que es cuando ya factura $47,000+ por torneo y $2,250 no le mueve la aguja.
- El tier gratis **no existe por accesibilidad** (hasta una liga de 10 equipos puede pagar desde el día uno). Existe para probar valor sin fricción y para que los jugadores ya estén enganchados con sus perfiles antes de que haya una factura.

> **Nota sobre "una temporada gratis".** Un torneo amateur dura 4-6 meses. Regalar una temporada completa es mucho tiempo cargando costo, y el organizador puede rotar de cuenta al siguiente torneo. El techo por número de equipos es un corte más limpio y no tiene fecha de vencimiento que negociar. **Excepción táctica:** las primeras 10 ligas sí van gratis y con servicio de concierge, pero eso es adquisición, no modelo (§6).

---

## 4. Las tres bolsas, ordenadas por tamaño

Una liga madura de 30 equipos contiene:

| Bolsa                     | Tamaño             | Estado                                      |
| ------------------------- | ------------------ | ------------------------------------------- |
| **Volumen transaccional** | ~$320,000 / torneo | Fase 3 — `FINANCE-ENGINE.md` ya diseñado    |
| **Jugadores**             | 480 personas       | Fase 2 — el producto según `AGENTS.md` §1.5 |
| **Organizador**           | $47,200 / torneo   | Fase 1 — la puerta de entrada obligada      |

El error estratégico sería modelar el negocio solo contra la bolsa más chica. El organizador es **la puerta, no el negocio**.

### 4.1 Fase 1 — Cuota de plataforma (organizador)

$75 por equipo por torneo. Es el peaje de entrada, deliberadamente barato. Financia operación, no crecimiento.

### 4.2 Fase 2 — Jugador

480 jugadores por liga madura. **Sin paywall a las stats.** Lo que se cobra:

- Carnet / credencial digital premium (`CREDENCIAL-PASE-JUGADOR.md`)
- Tarjeta de temporada en alta resolución
- Reel / resumen de fin de torneo
- Credencial física impresa

A 8% de conversión × $60 son ~$2,300 por liga por torneo: **comparable a todo lo que paga el organizador**, y escala con la ciudad sin vender nada nuevo.

### 4.3 Fase 3 — Volumen transaccional

Aquí está el negocio de verdad. `FINANCE-ENGINE.md` ya modela el motor de cobros (inscripciones, fianzas, multas, arbitraje). Si la liga cobra a través de la app:

- 1.5% sobre $320,000 = **$4,800 por torneo por liga** — más del doble que la cuota SaaS
- Se cobra sobre dinero que ya se movía, no sobre presupuesto nuevo
- Genera lock-in real: quien lleva tus fianzas y tus cobros no se cambia de sistema

Requiere confianza acumulada. **No es un pitch de primera visita.**

### 4.4 Fase 4 — Ecosistema de ciudad

Patrocinadores, vitrina de jugadores libres, comparativos cross-liga. No construir hasta 20+ ligas activas (`PRODUCT-STRATEGY.md` §6).

### 4.5 Palanca aparte — Revenue share sobre horario fijo

Solo 4 de 30 equipos compran horario a $5,800. Si el calendario de canchas (`venue-calendar`) hace el horario **visible, comparable y comprable** desde la app, subir el attach rate de 4 a 10 equipos le mete **$34,800 extra al organizador en un torneo**.

Un revenue share de 10-15% sobre horario incremental paga ~$5,200 — más que la cuota plana — y cambia la conversación de _"me cobras"_ a _"me hiciste ganar"_.

Es la palanca mejor alineada que existe en este modelo. Requiere que el organizador confíe la venta de horarios a la app: salto de fe mayor que capturar cédulas, pero el módulo ya está construido.

---

## 5. Proyección a 3 años

Supuestos: liga madura promedio de 30 equipos, 2.5 torneos al año, precio $75/equipo/torneo, 1.5% sobre volumen transaccional, 8% de conversión de jugadores a $60.

|                                            | Año 1       | Año 2        | Año 3          |
| ------------------------------------------ | ----------- | ------------ | -------------- |
| Ligas en la plataforma                     | 10          | 40           | 100            |
| % de pago (resto en tier gratis/concierge) | 20%         | 85%          | 90%            |
| % con motor de cobros                      | 0%          | 10%          | 30%            |
| **Cuota de plataforma**                    | $11,250     | $191,250     | $506,250       |
| **Finanzas (1.5%)**                        | —           | $48,030      | $360,225       |
| **Jugadores**                              | —           | $48,960      | $207,360       |
| **TOTAL (MXN)**                            | **$11,250** | **$288,240** | **$1,073,835** |

**Cómo leer esto.** El año 1 no es un año de ingresos, es un año de **casos de referencia e histórico acumulado**. El punto de inflexión es el motor de cobros en el año 3: pasa de 0% a 33% de los ingresos y es lo que convierte esto de un negocio de subsistencia a uno que escala.

---

## 6. Estrategia de adquisición (resumen)

Detalle completo en [`SALES-PLAYBOOK.md`](./SALES-PLAYBOOK.md).

1. **Primeras 10 ligas: gratis y con concierge total.** Tú capturas, tú das de alta. Lo que compras con ese trabajo es el caso de referencia y el histórico — valen más que $2,250.
2. **La cuña es el contenido, no la gestión.** El organizador ya arma su tabla a mano cada semana. Ese es el trabajo que le quitas primero, sin pedirle que migre nada.
3. **Empezar por la liga de referencia** (Novofut). En este mercado las ligas se copian entre ellas.
4. **El compromiso pequeño es una jornada, no una temporada.** Nadie cambia de sistema en jornada 7, pero sí te deja hacerle el contenido de una jornada.
5. **La posteridad como gancho.** Armar el palmarés histórico de la liga es un pitch emocional que además te entrega años de dato que nadie más va a tener.

---

## 7. Riesgos

| Riesgo                                                   | Mitigación                                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Ticket bajo por liga** ($5,625/año) — obliga a volumen | Fases 2 y 3; el SaaS solo no sostiene el negocio                                   |
| **Ventana de adopción angosta** (2-3 veces al año)       | Entrar por contenido a media temporada, sin migración                              |
| **Churn en tiempos muertos**                             | Cobro por uso, no membresía; org-hub mantiene la liga viva entre torneos           |
| **Concierge no escala**                                  | Es deliberadamente temporal: 10 ligas, luego autoservicio                          |
| **Una liga ya se dejó de usar**                          | Entender por qué antes de escalar — es el dato de churn más valioso que existe hoy |
| **Dependencia de un solo organizador clave**             | Diversificar a 5+ ligas antes de invertir en fase 3                                |
| **Fase 3 implica manejar dinero ajeno**                  | Requisitos legales/fiscales sin resolver; no prometerlo en ventas                  |

---

## 8. Supuestos a validar

Ninguna de estas cifras debe darse por buena sin confirmarla en campo:

- [ ] ¿Cuántos torneos al año corre una liga? (asumido 2.5 — mueve toda la proyección)
- [ ] ¿El arbitraje de $600-800 es por partido total o por equipo? (asumido total, split entre los dos)
- [ ] ¿La renta de cancha la paga el equipo o es costo del organizador?
- [ ] ¿Cuántas ligas organizadas hay en la ciudad? (define el techo del mercado)
- [ ] ¿Qué porcentaje de fianzas se pierde por walkover/multa? (ingreso oculto del organizador)
- [ ] ¿Cuánto le cuesta al organizador la cancha por horario? (define si $75 sale de su bolsa o lo repercute)
- [ ] ¿Por qué se dejó de usar la liga que ya estaba cargada?

---

## 9. Nota de coherencia con documentos previos

`PRODUCT-STRATEGY.md` y `brief-marketing.md` fueron escritos antes de 2026 y sostienen que **no** construimos gestión de liga. Eso quedó superado por el cambio de estrategia descrito en `AGENTS.md` §1.5: ahora sí se construye gestión completa, **como medio para capturar dato**, no como producto.

Este documento asume el posicionamiento de `AGENTS.md`. La gestión es lo que se vende de entrada; la identidad y el contenido son lo que retiene y lo que se monetiza.
