# Auditoría transversal definitiva · Property Database

**Fecha:** 06/07/2026
**Método:** 4 análisis en paralelo (modelo de datos · flujos · bugs · armonía) cruzados contra las **41 migraciones SQL** de `supabase/migrations/` (esquema autoritativo) y el historial git.
**Objetivo:** versión consolidada de los procesos — todos los campos conectados de forma coherente, lógica y armonía entre módulos.

---

## Resumen ejecutivo

El **modelo persistido en Supabase está bien normalizado** (FKs por uuid, tablas puente, triggers). El problema es que **muchas vistas se construyeron contra un modelo mock más plano** y todavía leen/escriben columnas que no existen o duplican el vínculo real. Conviven **tres fuentes de verdad**: (a) tablas Supabase normalizadas, (b) `stacking_data` jsonb del activo, (c) mock-data.

Consecuencia técnica repetida: en PostgREST, **una sola columna inexistente en `.select()` anula la query entera** (400 → `data=null`), y casi todos los sitios hacen `(data || [])` sin mirar `error` → **el fallo es silencioso**. Por eso hay secciones que "siempre salen vacías" sin dar error visible.

La **mitad izquierda del funnel** (Lead → Transformación → Demanda/Oferta → Matching → arranque de Negociación) está genuinamente implementada en Supabase. La **mitad derecha** (Oportunidad WIP viva, Negociación formal, Instrucción, Transacción, honorarios) y el módulo **Cuentas/Dynamics** son en su mayoría maqueta con "Dynamics" simulado por `alert()`.

---

## BLOQUE A · Bugs de queries rotas (columna inexistente) 🔴

Fallos silenciosos de runtime. Fix por sitio: corregir el nombre de columna. Riesgo bajo.

| # | Archivo:línea | Columna pedida | Real | Efecto |
|---|---|---|---|---|
| A1 | `MatchingOfertasModal.jsx:34` · `DossierGenerator.jsx:166` | `ofertas.nombre` | `titulo_web` | Matching de demanda y dossier **siempre vacíos** |
| A2 | `FichaActivo.jsx:5004` · `FichaOferta.jsx:163-165` | `demandas(sup_min,sup_max,estado)` | `requisitos` jsonb + `estatus` | Sección "Demandas interesadas" de la Vista 360 vacía |
| A3 | `FichaActivo.jsx:5007` | `negociaciones.renta_cierre` | `renta_ultima` | Sección "Transacciones" de la 360 muerta |
| A4 | `FichaActivo.jsx:5010` | `mandatos.fecha_fin` | `fecha_vencimiento` | Sección "Mandatos" de la 360 muerta |
| A5 | `VencimientosView.jsx:184` | `arrendatarios.m2` | `superficie` | El feed real de vencimientos nunca carga (solo mock) |
| A6 | `InformesMercado.jsx:563` | `fecha_fin`, `m2`, `anio_firma` | `vencimiento`, `superficie`, `anyo_firma` | "Contratos reales" nunca se cargan (siempre mock) |
| A7 | `DossierGenerator.jsx:271` | `desglose_ofertas.sup_min` | (no existe) | Superficie mínima alquilable del dossier ignora el desglose |
| A8 | `FichaOferta.jsx:883-897` | `gastos_medios`, `ibi_medio` | `gastos_comunes` | **Pérdida silenciosa de datos** al guardar oferta (tipología, estado espacio, equipo, colaboradores, confidencial…) |

---

## BLOQUE B · Navegación con params incorrectos 🔴

Fichas que solo leen un nombre de parámetro mientras los callers pasan otro → se abre ficha vacía o **una demo hardcodeada sin aviso**.

- **B1 — `FichaMandato.jsx:11` solo lee `params.id`; 14 enlaces pasan `{ ref }`.** Callers: `FichaDemandaSupabase.jsx:1018,1376`, `FichaLead.jsx:344,587`, `FichaNegociacion.jsx:316,387`, `FichaOferta.jsx:1247`, `FichaOfertaSupabase.jsx:354,465`, `FichaOportunidad.jsx:98,229,419`, `FichaPropuestaSupabase.jsx:319`. → "Mandato no especificado". **Fix:** `params?.id || params?.ref`.
- **B2 — `FichaNegociacion.jsx:212-216` renderiza la demo NEG-0044** si el id no matchea `/^NEG-\d{7}$/`. Callers pasan un ref de oferta (`FichaDemandaSupabase.jsx:2054`) o un uuid (`FichaActivo.jsx:6812`) → se abre una **negociación falsa con datos inventados**. **Fix:** cargar el ref real por `oferta_demanda_id` y aceptar uuid; nunca renderizar demo sin banner.
- **B3 — otros params `{ ref }` → ficha que lee `id`:** `FichaOportunidad.jsx:398 → ficha-demanda`, `FichaArrendatario.jsx:915 → ficha-oferta`. **Fix:** normalizar contrato (`id || ref`).
- **B4 (relacionado, modelo) — clave de mandato `id` vs `ref` inconsistente:** unas navegaciones usan `{ id: mandato_ref }` (funciona porque `FichaMandato` filtra por `ref`), otras `{ ref }` → error. Homogeneizar.

---

## BLOQUE C · Integridad de datos / vínculos 🟠

- **C1 — `IniciarNegociacionModal.jsx:178` inserta `actividades.tipo:'Nota'`** pero el CHECK es minúsculas (`nota`) → rechazo 23514 silencioso, **se pierde el rastro de auditoría** de cada negociación. **Fix (1 línea):** `'nota'`.
- **C2 — `BajaArrendatarioModal.jsx:123-137` crea la oferta sell-side sin `activo_ref`** (solo `activo_id`), y `OfertasList.jsx:65-72` resuelve el activo por `activo_ref` → la oferta aparece como **"Pendiente Activo"** sin dirección/zona. **Fix:** añadir `activo_ref: act.ref`.
- **C3 — `MatchingOfertasModal.jsx:145`** inserta en `oferta_demanda` con `activo_id` posiblemente `null`, pero la columna es **NOT NULL** → añadir alternativa sin activo falla.
- **C4 — `healRefs('ofertas','OFR')` en `OfertasList.jsx:57`** renombra refs legacy en cada carga, pero el vínculo oferta↔stacking y `arrendatarios.oferta_origen` son **por ref** → deja tramos y orígenes **huérfanos** (corrupción sin traza). **Fix:** actualizar también `stacking_data`/`oferta_origen` o vincular por `oferta_id`.
- **C5 — Doble eje "oferta viva": `activa` (bool) vs `estado` (string) con criterios divergentes.** `FichaOferta.jsx:511` filtra por `activa`; `MatchingOfertasModal.jsx:36` por `estado`. Una oferta `Retirada` pero `activa=true` aparece en un sitio y no en otro; una dada de baja (`activa=false`, sin cerrar `estado`) **reaparece en el matching como "Cumple"**. **Fix:** un único eje; derivar `activa` de `estado` siempre + `ofertas.estado` con CHECK canónico.

---

## BLOQUE D · Modelo de datos derivado y vínculos estructurales 🟠

- **D1 — Ocupación/días/renta del Activo.** `ActivosList.jsx:82-90` deriva bien `occ` desde ofertas activas, pero `FichaActivo.jsx:5693,5704` muestra `occupancy_rate` (**columna almacenada obsoleta**) rotulada como "derivado"; `dias_comercializacion` es estático (0). El `stacking_data` (fuente real vac/ten) no alimenta nada. El helper `deriveActivoStats` (`mockData.js:208`) quedó **huérfano (0 usos)**. **Fix:** un único helper derivador (revivir/extender `deriveActivoStats` con stacking) consumido en lista **y** ficha.
- **D2 — Doble referencia Oferta→Activo (`activo_id` uuid + `activo_ref` string)** sin sincronía garantizada. **Fix:** `activo_id` como fuente única, derivar `activo_ref` por trigger (o escribir siempre ambas).
- **D3 — Propietario↔Activo por `activo_ref` string** en vez de `activo_id` (inconsistente con el resto). **Fix:** añadir `propietarios.activo_id` con FK.
- **D4 — Enlace Propuesta⇄Mandato roto en ambos sentidos.** `propuestas` no tiene `mandato_id/ref`; `FichaMandatoSupabase.jsx:687` lee `propuesta_ref` (fantasma); al ganar (`MarcarPropuestaGanadaModal.jsx:226`) no se escribe el mandato de vuelta. **Fix:** persistir `mandato_id` en la propuesta al ganar; resolver por join `mandatos.propuesta_id`.
- **D5 — Matching lee campos planos** (`demanda.sup_min/zonas/uso_principal`) cuando viven en `demanda.requisitos` jsonb → **el matching corre casi sin criterios**. **Fix:** leer desde `requisitos`.
- **D6 — Refs fantasma en FichaLead** (`propuesta_ref`, `mandato_ref`, `cuenta_nombre`) → FunnelTracker siempre vacío. **Fix:** usar objetos anidados (`lead.propuestas?.ref`).
- **D7 — Vínculos por nombre frágiles:** `activos.propietario`, `arrendatarios.propietario_cuenta`, `SalidaOfertaModal` `oferta_origen`, activo firmado como texto en `notas`. **Fix:** usar ids/refs (ya existen como fallback).
- **Glosario pendiente:** superficie con 6 nombres (`sba`/`superficie`/`superficie_disponible`/`m2_oferta`/`sup`/`sup_max`); renta con 5 (`renta_zona`/`renta_m2`/`closing_rent`/`renta_cierre`/`renta`); estados divergentes por módulo; `zona` sin entidad propia.

---

## BLOQUE E · Flujos incompletos (maqueta) — decisiones de fondo

- **E1 — Oportunidad:** `FichaOportunidad`/`OportunidadesList` son 100% mock; se navega con `dynamics_opportunity_id` real → cae al fallback `[0]`. Decidir punto de nacimiento único (lead-cualificación vs match) y reconectar a `dynamics_opportunities`.
- **E2 — Negociación:** tabla real, pero ficha (chat, versiones, cierre) es demo; `NegociacionesList` lee mock; botones de cierre sin `onClick`; `negociacion_mensajes` nunca se usa. Reconectar a Supabase.
- **E3 — Instrucción/Transacción/Honorarios:** `dynamics_instructions` se escribe pero **ninguna vista la lee**; sin módulo de Transacción ni honorarios (viven en `mandatos.fee_reparto` jsonb).
- **E4 — Regla de oro Activo→Cuenta-Propietario:** el modal la exige en front pero el insert **omite `dynamics_account_id`**; ni BD ni triggers la enforzan.
- **E5 — Tablas huérfanas:** `visitas`, `envios_ofertas`, `vencimientos`, `negociacion_mensajes` definidas con triggers/índices pero **sin uso**. Decidir: poblarlas y leerlas, o retirarlas del esquema y del doc.
- **E6 — Dualidad mock/Supabase:** eliminar y enrutar siempre a la ficha que lee ids reales.

---

## BLOQUE F · Armonía visual/UX 🟡

De las 7 desviaciones del `ARMONIA_PDB.md` de abril, **5 resueltas**; lo que queda:

- **F1 — Skeleton de modales fracturado en 2 familias** (overlay `0.48`/panel surface/radius 12 vs overlay slate/panel `#fff`/radius 10). Caso visible: `MarcarPropuestaGanadaModal` vs `MarcarPropuestaPerdidaModal` (gemelos, distintos). **Fix:** `ModalShell` compartido.
- **F2 — Conflicto de color en estados de arrendamiento:** "Próximo a vencimiento" es amarillo en `VencimientosView.jsx:122` pero `tag-red` en `ArrendatariosList.jsx:94`. **Fix:** mapa único con clases.
- **F3 — KPI strip "compacto" divergente** en `LeadsList`/`OportunidadesList` (flex + hex, orden invertido) vs `.ks` canónico. **Fix:** migrar o formalizar `.kpi-strip.compact`.
- **F4 — `AsignarTareaModal` success sin tarjeta verde** (único resto del punto #6).
- **F5 — Tab "Vista 360" que abre panel titulado "Seguimiento comercial"** (`FichaOfertaSupabase.jsx:30` vs `:921`); Vista 360 stub en Oferta/Propuesta mientras Mandato ya usa `ActividadesPanel` real.
- **F6 — Banner Dynamics inline** en `FichaOportunidad.jsx:68` (ya existe `BannerInfo`).
- **F7 — `DynIcon` duplicado** en 5 listas con `#B08D57` hardcodeado. Extraer a componente.

---

## BLOQUE G · Casos límite 🟡

- `BajaArrendatarioModal.jsx:81` / `SalidaPropietarioModal.jsx:135` — filtros PostgREST por nombre con coma/paréntesis (`"Empresa, S.L."`) rompen la sintaxis → escapar valor.
- `InformesMercado.jsx:248` (DonutChart) — `value/total` sin guardia → `NaN` con todo a 0 → gráfico en blanco.
- `FichaArrendatario.jsx:529` — lookup por nombre `limit(1)` abre fila arbitraria con duplicados ("Desconocido" es colectivo). Propagar `arr_ref`.
- `FichaOferta.jsx:163` — `of360.loaded` fuera de deps del efecto.

---

## Plan de corrección propuesto (orden esfuerzo/impacto)

1. **Bloque A + B + C** — bugs de runtime confirmados, mayoría one-liners, riesgo bajo. *Máximo impacto inmediato.*
2. **Bloque D** — coherencia transversal de campos (derivados, `activo_id`, propuesta↔mandato, matching por `requisitos`).
3. **Bloque F/G** — armonía y casos límite.
4. **Bloque E** — decisiones de fondo (mock→Supabase, tablas huérfanas): requieren definición de producto antes de implementar.

---

## Correcciones aplicadas · 06/07/2026 (Bloques A + B + C)

Verificado: `npm run build` ✅ · ESLint sin errores nuevos (88 preexistentes, 88 tras cambios).

**Bloque A · queries rotas**
- A1 — `ofertas.nombre` → `titulo_web`: `DossierGenerator.jsx` (select + `.or`), `MatchingOfertasModal.jsx` (`nombre:titulo_web`).
- A2 — embed `demandas(...)`: `sup_min,sup_max,estado` → `requisitos,estatus` en `FichaActivo.jsx` y `FichaOferta.jsx`, mapeando `sup_min/sup_max` desde `requisitos` y `estado` desde `estatus`.
- A3 — `negociaciones.renta_cierre` → alias `renta_cierre:renta_ultima` (`FichaActivo.jsx`).
- A4 — `mandatos.fecha_fin` → alias `fecha_fin:fecha_vencimiento` (`FichaActivo.jsx`).
- A5 — `arrendatarios.m2` → `m2:superficie` (`VencimientosView.jsx`).
- A6 — `fecha_fin/m2/anio_firma` → alias a `vencimiento/superficie/anyo_firma` (`InformesMercado.jsx`).
- A7 — `desglose_ofertas.sup_min` (inexistente) eliminado; superficie mínima desde módulos del stacking (`DossierGenerator.jsx`).
- A8 — guardado de oferta: eliminadas `gastos_medios`/`ibi_medio` (inexistentes) y fusionado en un **único update atómico** con las columnas reales → deja de perderse tipología/estado espacio/equipo/colaboradores (`FichaOferta.jsx`).

**Bloque B · navegación**
- B1 — `FichaMandato.jsx` acepta `{ id }` **o** `{ ref }` (los 14 enlaces que pasaban `ref` ya abren el mandato).
- B2 — `FichaActivo.jsx` "Ver transacción" pasa `{ ref: t.ref }` (NEG real) en vez del uuid; banner de aviso "Datos de ejemplo" en `FichaNegociacion.jsx` cuando no hay negociación real. *(Pendiente E: `FichaDemandaSupabase.jsx:2054` "Ver negociación" aún pasa un ref de oferta — requiere resolver la NEG por `oferta_demanda_id`.)*
- B3 — `FichaOportunidad.jsx` → `ficha-demanda { id }`; `FichaArrendatario.jsx` → `ficha-oferta { ofertaRef }`.

**Bloque C · integridad**
- C1 — `actividades.tipo:'Nota'` → `'nota'` (respeta el CHECK; deja de perderse la auditoría de negociación).
- C2 — oferta creada al dar de baja arrendatario incluye `activo_ref` → ya no sale "Pendiente Activo".
- C3 — `MatchingOfertasModal` valida `activo_id` (NOT NULL) antes de insertar en `oferta_demanda`.
- C4 — retirado `healRefs('ofertas')` de `OfertasList` (renombraba refs y dejaba huérfanos los vínculos por ref del stacking / `oferta_origen`).
- C5 (parcial) — el matching excluye ofertas con `activa=false` (una oferta dada de baja ya no reaparece como "Cumple"). *(Pendiente D/E: CHECK canónico en `ofertas.estado` + unificar eje `activa`↔`estado`, requiere migración.)*

*Análisis inicial: ningún archivo modificado. Correcciones A+B+C aplicadas el 06/07/2026 según lo anterior.*
