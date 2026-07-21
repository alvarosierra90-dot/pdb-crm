# Diccionario de datos · Property Database

**Fecha:** 21/07/2026 · **Alcance:** columnas físicas de BD (Supabase) de las familias que la auditoría (D7) marcó como "6 nombres para superficie / 5 para renta".
**Objetivo:** fijar qué concepto representa cada columna en cada tabla, distinguir **conceptos distintos** (que deben conservar nombre propio) de **duplicados reales** (a deprecar), y catalogar los **alias fantasma** (nombres que NO son columnas y solo funcionan vía alias en `.select()`).

> Regla de uso: antes de añadir/leer una columna de superficie, renta, estado o vínculo, comprobar esta tabla. Si necesitas un concepto que no está aquí, **no inventes un sinónimo** — usa el nombre canónico o pregunta. Esto complementa `project_glosario_canonico` (que gobierna **labels de UI**, no columnas de BD).

---

## 1 · Superficie — NO es un solo concepto

Cada columna mide una superficie **de una entidad distinta**. Consolidar a un nombre único sería incorrecto.

| Columna (tabla) | Concepto | Unidad | Notas |
|---|---|---|---|
| `activos.sba` | Superficie Bruta Alquilable del **activo** | m² | Dato maestro del activo |
| `activos.sba_neta` | Superficie neta del activo | m² | Derivable de `sba × (1 − ratio_perdida)` |
| `ofertas.superficie_disponible` | Superficie disponible de la **oferta** | m² | **Canónica** para oferta |
| ~~`ofertas.m2_oferta`~~ | *(era igual que arriba)* | m² | ✅ **DEPRECADO** en migración `043` (backfill → drop). Código unificado en `superficie_disponible` |
| `arrendatarios.superficie` | Superficie del **contrato** de arrendamiento | m² | |
| `negociaciones.superficie` | Superficie en **negociación** | m² | |
| `vencimientos.m2` | Superficie del **vencimiento** | m² | Nombre `m2` incoherente con el resto → idealmente `superficie` |
| `asignaciones_stacking.sup` · `stacking_data[].arr[].units[].sup` (jsonb) | Superficie de la **unidad** en el stacking | m² | Dato maestro del stacking |
| `demandas.requisitos.sup_min` / `sup_max` (jsonb) | **Rango** buscado por la demanda | m² | Viven dentro del jsonb `requisitos`, no como columnas |
| `activos.sup_planta_tipo` | Superficie de planta tipo | m² | |

**Único duplicado real:** `ofertas.m2_oferta` ≡ `ofertas.superficie_disponible` → **deprecado** (migración 043).

---

## 2 · Renta — tampoco es un solo concepto

| Columna (tabla) | Concepto | Unidad |
|---|---|---|
| `activos.renta_zona` | Renta **benchmark de la zona** | €/m²/mes |
| `ofertas.renta_m2` | Renta **pedida** de la oferta | €/m²/mes |
| `ofertas.renta_mensual` · `ofertas.renta_anual` | Variantes absolutas de la renta de oferta | € |
| `negociaciones.renta_inicial` | Renta **inicial** de la negociación | €/m²/mes |
| `negociaciones.renta_ultima` | Renta **última / de cierre** de la negociación | €/m²/mes |
| `arrendatarios.renta` | Renta del **contrato** vigente | €/m²/mes |
| `arrendatarios.closing_rent` | Renta de **cierre** del arrendatario | €/m²/mes |
| `vencimientos.renta_actual` | Renta actual del vencimiento | €/m²/mes |
| `asignaciones_stacking.renta` | Renta en el stacking | €/m²/mes |

**No hay duplicados reales** — son rentas de entidades/momentos distintos. La confusión viene de los **alias fantasma** (§4).

---

## 3 · Vínculos entre entidades — id/ref canónicos

| Relación | Canónico | Denormalizado | Mantenido por |
|---|---|---|---|
| oferta → activo | `ofertas.activo_id` (uuid FK) | `ofertas.activo_ref` (text) | Trigger `sync_ofertas_fks` (011) |
| propietario → activo | `propietarios.activo_id` (uuid FK) | `propietarios.activo_ref` (text) | Trigger `sync_propietarios_activo_id` (**042**) |
| arrendatario → activo | `arrendatarios.activo_id` (uuid FK) | `arrendatarios.activo_ref` (text) | — |
| oferta_demanda → activo/oferta/demanda | `activo_id` · `oferta_id` · `demanda_id` (uuid) | — | Triggers `011` (heredan de la oferta) |
| mandato → propuesta | `mandatos.propuesta_id` (uuid FK, `023`) | — | Escrito al ganar la propuesta |
| arrendatario → oferta de origen | `arrendatarios.oferta_origen` = **ref de la oferta** | — | 4 escritores, todos por ref |
| oferta ↔ unidad de stacking | `stacking_data[].arr[].units[].oferta` = **ref de la oferta** | — | Match id-first, fallback nombre solo legacy |

**Vínculos por NOMBRE (denormalización de display, NO claves de navegación):**
- `activos.propietario` (text) — nombre del propietario para listados. La navegación real a la ficha usa `propietario.id`; las ofertas matchean por `prop_id`.
- `arrendatarios.propietario_cuenta` (text) — nombre del propietario/cuenta, solo display (fallback en `ArrendatariosList`).
- Convertirlos en FK reales (`propietario_id`/`cuenta_id`) exige migración + decisión (la Cuenta es master de Dynamics).

---

## 4 · Alias fantasma — nombres que NO son columnas

Estos nombres **no existen** en la BD; solo funcionan si se piden con alias en `.select()`. Pedirlos como columna directa produce **400 → data=null silencioso** (causa raíz del Bloque A de la auditoría).

| Nombre fantasma | Columna real | Dónde se usa correctamente (alias) |
|---|---|---|
| `ofertas.nombre` | `ofertas.titulo_web` | `nombre:titulo_web` (Matching, Dossier) — fix A1 |
| `negociaciones.renta_cierre` | `negociaciones.renta_ultima` | `renta_cierre:renta_ultima` — fix A3 |
| `mandatos.fecha_fin` | `mandatos.fecha_vencimiento` | `fecha_fin:fecha_vencimiento` — fix A4 |
| `arrendatarios.fecha_fin` | `arrendatarios.vencimiento` | fix A6 |
| `arrendatarios.m2` | `arrendatarios.superficie` | `m2:superficie` — fix A5 |
| `*.anio_firma` | `*.anyo_firma` | `anio_firma:anyo_firma` — fix A6 |
| `demandas.sup_min` / `sup_max` / `estado` (planos) | `demandas.requisitos.sup_min/max` (jsonb) · `demandas.estatus` | fix A2 / D5 |
| `ofertas.gastos_medios` · `ibi_medio` | `ofertas.gastos_comunes` (no hay IBI) | fix A8 |
| `desglose_ofertas.sup_min` | *(no existe)* | fix A7 |

---

## 5 · Zona — sin entidad propia

No existe tabla `zonas`. La geografía vive como **texto libre** repartido:
- `activos.area` / `activos.zona` / `activos.subzona` / `activos.ciudad`
- `demandas.requisitos.zonas` / `provincias` (jsonb, array de strings u objetos)
- `mandatos.provincia` / `mandatos.zona`

Consecuencia: el match geográfico (Matching) se hace por `includes()` de tokens de texto, no por FK. Una entidad `zonas` sería un proyecto propio (no incluido aquí).

---

## 6 · Estados — la BD arranca en valores legacy, distintos del canon de UI

Muchas tablas tienen `DEFAULT` en minúscula/inglés que **divergen** del glosario canónico de estados (`project_glosario_canonico` §"Estados canónicos por entidad"). El código traduce/normaliza en la capa de vista.

| Tabla | `DEFAULT` en BD | Canon UI |
|---|---|---|
| `leads.estado` | `'nuevo'` | Standby / Cualificado / No cualificado |
| `mandatos.estado` | `'en_curso'` | En curso / Ganado / Perdido / Cancelado / Vencido |
| `demandas.estatus` | `'ongoing'` | Standby / En curso / Finalista / Ganado / Perdido / Cancelada |
| `actividades.estado` | `'abierto'` (CHECK abierto/completado/cancelado) | Pendiente / En curso / Completada / Cancelada |
| `vencimientos.estado` | `'vigente'` | (feed de Vencimientos) |
| `ofertas.estado` | `'En curso'` | Oferta futura / En comercialización / En negociación / Cerrada / Desactivada |
| `activos.estado` | `'Activo'` | Activo en mercado / En comercialización / Reservado / Vendido / Inactivo |

⚠️ Dos ejes de "oferta viva" conviven: `ofertas.activa` (bool) y `ofertas.estado` (string). El matching ya excluye `activa===false` (fix C5), pero falta un CHECK canónico en `ofertas.estado` (pendiente, requiere migración).

---

## Acciones derivadas (decisión pendiente)

1. ~~**Deprecar `ofertas.m2_oferta`**~~ ✅ **Hecho** (migración 043: backfill + drop; código unificado en `superficie_disponible`).
2. **`vencimientos.m2` → `superficie`**: renombrar para coherencia (o alias en `.select()`).
3. **CHECK canónico en `ofertas.estado`** + derivar `ofertas.activa` de `estado` (cierra C5).
4. **FK reales** para `arrendatarios.propietario_cuenta` / `activos.propietario` (requiere decisión: Cuenta es master Dynamics).

Ninguna se aplica automáticamente: son cambios de esquema con decisión de producto.
