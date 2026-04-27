# Auditoría arquitectura funcional · Property Database

**Fecha:** 27/04/2026
**Alcance:** todos los módulos construidos del prototipo
**Criterios:** definición canónica de negocio (Oportunidad WIP, Activo vs Oferta, Cuenta vs Entidad Legal, FKs obligatorios por flujo, edición en Dynamics)

Cada bloque sigue el formato:
- ✓ Cumple · ✗ Desvía · ⚠ Dudoso · → Corrección · 🕐 Esfuerzo (bajo / medio / alto)

---

## Resumen ejecutivo

**Hallazgos críticos (orden de impacto)**

1. 🔴 **Mandato sin Oportunidad ni Oferta obligatorias** (`FichaMandato.jsx`). Validación actual permite "Activo solo". Triple FK Oportunidad+Oferta+Activo no aplicado. **Riesgo alto:** mandatos sin trazabilidad comercial ni anclaje al WIP.

2. 🔴 **Modelo de datos: Activo almacena disponibilidad** (`mockData.js`). Los campos `occ`, `renta`, `dias` viven en el Activo cuando deberían vivir en Oferta y mostrarse como KPI derivado. Violación raíz que se propaga a toda la UI.

3. 🟠 **Matching de Demanda contra Activos, no contra Ofertas** (`FichaDemanda.jsx`). La pestaña de matching cruza con activos sueltos (incluye textos como "3 activos compatibles"). Debería cruzar contra Ofertas vigentes con flexibilidad comercial.

4. 🟠 **Propuesta sin FK Oportunidad** (`FichaPropuesta.jsx`). El formulario obliga a Empresa pero no a Oportunidad. Una propuesta puede crearse sin anchor al WIP.

5. 🟡 **Oferta sin validación de Activo obligatorio** (`OfertasList.jsx` línea 64). Permite fallback a `'—'`. La Ficha sí valida, pero la lista no. Inconsistencia.

**Lo que cumple bien**

- ✓ `OportunidadesList` y `InstruccionesList` son read-only con banner Dynamics explícito.
- ✓ `CuentasList`, `ContactosList`, `EntidadesLegalesList` también read-only desde Dynamics.
- ✓ `EntidadesLegalesList` modela correctamente FK a Cuenta principal.
- ✓ `FichaActivo` permite alta sin propietario; `StackingPlan` se construye sin propietario.
- ✓ Módulo `Leads` (recién creado) sigue los principios.

---

## Bloque 1 — Núcleo Activo / Oferta / Stacking

### `src/data/mockData.js`
- ✓ **Cumple:** `OFERTAS` tiene FK explícito `activo_ref` (líneas 43, 59, 74...). Modelo correcto en la dirección Oferta→Activo.
- ✗ **Desvía:** `ACTIVOS` (líneas 3-33) almacena `occ` (ocupación), `renta` (€/m²), `dias` (en mercado) como campos propios persistibles. Estos son **datos de disponibilidad comercial** que pertenecen a Oferta. Violación raíz del Principio Activo vs Oferta.
- ⚠ **Dudoso:** `valor` (valoración del activo) sí es dato maestro del inmueble, mantener.
- → **Corrección:** mover `occ`, `renta`, `dias` del modelo Activo. Quedan en Activo: `ref`, `name`, `propietario` (opcional), `zona`, `subzona`, `ciudad`, `uso`, `sba`, `valor`, `estado` (estado físico/inmobiliario, no comercial). Calcular `occ`/`renta_disp`/`dias_mercado` en runtime sumando Ofertas vinculadas.
- 🕐 **Esfuerzo:** alto (cambio de schema + actualizar todas las vistas que leen estos campos)

### `src/views/ActivosList.jsx`
- ✓ **Cumple:** "+Nuevo" no obliga a propietario. Principio Activo independiente respetado.
- ✗ **Desvía:** muestra columnas `Ocupación` (`occ`), `Renta` (`renta`) y `Días en mercado` (`dias`) como columnas del Activo. Esto refuerza la confusión: parecen campos propios del activo.
- → **Corrección:** una vez migrados los campos a Oferta, recalcular en lista como KPI agregado y etiquetar con icono Σ ("derivado de Ofertas") o simplemente mostrarlos como métricas read-only sin posibilidad de edición.
- 🕐 **Esfuerzo:** bajo (etiquetado + lectura derivada)

### `src/views/FichaActivo.jsx`
- ✓ **Cumple:** no edita `occ`/`renta` desde campos del Activo (no hay onChange asociado).
- ✓ **Cumple:** acepta `propietario: null`. Principio Activo independiente respetado.
- ✓ **Cumple:** muestra Ofertas vinculadas en tabla read-only respetando FK `activo_ref`.
- ⚠ **Dudoso:** la Ficha muestra `occupancy_rate` como KPI sin etiquetar explícitamente como "derivado". Para el usuario no queda claro si es dato maestro o agregado.
- → **Corrección:** etiquetar todos los KPI agregados con un sufijo visual: "Σ derivado de N ofertas". Usar el mismo patrón que ya existe (`ReadonlyPill`).
- 🕐 **Esfuerzo:** bajo

### `src/views/OfertasList.jsx`
- ✓ **Cumple:** cada Oferta tiene `activo_ref`. Modelo correcto.
- ✗ **Desvía:** línea 64 permite `o.activo_ref || '—'`, fallback que no rompe pero indica que la lista acepta Ofertas sin Activo. FK no validado.
- → **Corrección:** FK Activo obligatorio en validación de alta. Si una Oferta no tiene Activo: rechazar guardado o marcar "Borrador · pendiente Activo".
- 🕐 **Esfuerzo:** medio

### `src/views/FichaOferta.jsx`
- ✓ **Cumple:** línea 848 bloquea acceso al Stacking si no hay Activo seleccionado.
- ✓ **Cumple:** `activo_ref` se persiste al guardar (líneas 397, 541).
- ⚠ **Dudoso:** ¿qué ocurre exactamente si `handleSave()` se ejecuta sin Activo seleccionado? No hay validación en el handler.
- → **Corrección:** añadir guard al inicio de `handleSave`: `if (!activoSeleccionado) { alert('Activo obligatorio'); return }`.
- 🕐 **Esfuerzo:** bajo

### `src/components/StackingPlan.jsx`
- ✓ **Cumple:** se construye aunque no haya propietario (línea 774 placeholder "Aún no hay propietarios"; línea 852 placeholder por unidad). Principio Stacking independiente cumplido.
- ✓ **Cumple:** FK a Activo correcto.
- 🕐 **Esfuerzo:** N/A

---

## Bloque 2 — Demanda / Oportunidad / Propuesta / Mandato / Instrucción

### `src/views/DemandaList.jsx`
- ✓ **Cumple:** filtros con rangos (no rígidos en superficie).
- ⚠ **Dudoso:** "+Nueva Demanda" no enfatiza vínculo a Oportunidad.
- → **Corrección:** banner / hint informativo "Toda Demanda vive bajo una Oportunidad de Dynamics" con CTA para vincular o crear oportunidad.
- 🕐 **Esfuerzo:** bajo

### `src/views/FichaDemanda.jsx`
- ✗ **Desvía:** la pestaña / sección de matching cruza contra **Activos sueltos**, no contra **Ofertas** (líneas 280-281, 283: literales "3 activos compatibles", "Ver activos compatibles"). Violación directa del Principio Matching.
- ⚠ **Dudoso:** no se detecta filtro flexible (rangos ampliados, alternativas razonables). El matching parece rígido.
- → **Corrección:**
  - Sustituir el cruce contra `ACTIVOS` por cruce contra `OFERTAS` filtradas por `activo_ref` y rango compatible con la Demanda.
  - Excluir Activos sin Oferta vigente.
  - Añadir secciones flexibles: "Cumple requisitos", "Flexible (±10–20%)", "Alternativas razonables".
- 🕐 **Esfuerzo:** medio

### `src/views/MandatosList.jsx`
- ✓ **Cumple:** columnas Estado/Vencimiento/Activos/Ofertas activas reflejan FKs.
- ⚠ **Dudoso:** "+Nuevo Mandato" navega a ficha sin contextualizar Oportunidad de origen.
- → **Corrección:** que el alta de Mandato exija venir desde una Oportunidad (vía `params.opportunityId`) o forzar selección de Oportunidad en el primer paso del wizard.
- 🕐 **Esfuerzo:** bajo

### `src/views/FichaMandato.jsx` 🔴 **CRÍTICO**
- ✗ **Desvía:** la validación de guardado (línea 520) acepta `ofertasV.length > 0 || activosV.length > 0`. Esto permite Mandatos con **solo Activo** o con **solo Oferta**. Viola el triple FK obligatorio Oportunidad+Oferta+Activo.
- ✗ **Desvía:** **no existe campo Oportunidad** en el formulario, ni para lectura ni para edición. La Oportunidad está completamente ausente del modelo Mandato.
- ✗ **Desvía:** la UI dice literalmente "*al menos una oferta o un activo*" (línea 428) — lenguaje opuesto al canónico ("los tres obligatorios").
- → **Corrección:**
  - Añadir campo obligatorio "Oportunidad" en cabecera de la Ficha (autocomplete que filtra oportunidades abiertas en Dynamics).
  - Cambiar validación: `if (!oportunidad || ofertas.length === 0 || activos.length === 0) { alert('Oportunidad, Oferta y Activo son obligatorios'); return }`.
  - Cambiar labels UI de "opcional" a "obligatorio".
- 🕐 **Esfuerzo:** alto

### `src/views/PropuestasList.jsx`
- ✓ **Cumple:** columnas demanda/oferta/activo opcionales en la lista (correcto: una propuesta no siempre necesita los tres).
- ⚠ **Dudoso:** falta columna Oportunidad. ¿Cada propuesta tiene una?
- → **Corrección:** añadir columna Oportunidad en la lista. Si está vacía, marcarla en rojo (dato faltante crítico).
- 🕐 **Esfuerzo:** bajo

### `src/views/FichaPropuesta.jsx` 🔴 **CRÍTICO**
- ✗ **Desvía:** **no existe campo Oportunidad** en el formulario. Solo Empresa es obligatorio (línea 268). Una Propuesta puede crearse sin anchor al WIP — viola el Principio "Propuesta nunca nace sola".
- ⚠ **Dudoso:** ¿el flujo correcto es navegar a Propuesta desde una Oportunidad y heredar el FK?
- → **Corrección:**
  - Añadir campo obligatorio "Oportunidad" en cabecera, autocomplete sobre oportunidades de Dynamics.
  - Validar `if (!oportunidad) { alert('Oportunidad obligatoria'); return }`.
  - Heredar `oportunidad` desde `params` cuando se navega desde una ficha de Oportunidad.
- 🕐 **Esfuerzo:** medio

### `src/views/OportunidadesList.jsx`
- ✓ **Cumple:** banner Dynamics explícito (línea 84): "Solo lectura · WIP oficial en Microsoft Dynamics 365". Línea 85: "Las oportunidades se crean y editan exclusivamente en Dynamics".
- ✓ **Cumple:** sin botón "Nueva Oportunidad" — coherente con el principio "PDB consume, Dynamics crea".
- ✓ **Cumple:** los datos mock cubren etapas variadas (Identificación → Acuerdo) y tipos amplios.
- 🕐 **Esfuerzo:** N/A

### `src/views/InstruccionesList.jsx`
- ✓ **Cumple:** banner Dynamics (línea 70): "Solo lectura · Cierre oficial en Microsoft Dynamics 365".
- ✓ **Cumple:** los registros mock incluyen `entidad_legal` (línea 5) — Principio Facturación contra Entidad Legal respetado.
- ✓ **Cumple:** referencias a "Contrato firmado", "Venta escriturada" — coherente con cierre formal.
- 🕐 **Esfuerzo:** N/A

---

## Bloque 3 — Cuentas / Contactos / Entidades Legales / Leads

### `src/views/CuentasList.jsx`
- ✓ **Cumple:** banner Dynamics (línea 71): "Solo lectura · Datos sincronizados desde Microsoft Dynamics 365".
- ✓ **Cumple:** sin posibilidad de crear cuenta nueva en PDB.
- 🕐 **Esfuerzo:** N/A

### `src/views/ContactosList.jsx`
- ✓ **Cumple:** patrón idéntico a Cuentas. Read-only, banner Dynamics, FK a Cuenta.
- 🕐 **Esfuerzo:** N/A

### `src/views/EntidadesLegalesList.jsx`
- ✓ **Cumple:** banner Dynamics (línea 71-72): "Solo lectura · Entidades de facturación en Microsoft Dynamics 365".
- ✓ **Cumple:** modela FK a Cuenta principal correctamente (campo `cuenta` en cada registro).
- ✓ **Cumple:** ejemplos correctos (Generali Real Estate Spain SA + Generali Seguros SA bajo cuenta "Generali Real Estate"; Savills Aguirre Newman SA + Savills Management SL bajo cuenta "Savills RE Spain SAU").
- 🕐 **Esfuerzo:** N/A

### `src/views/LeadsList.jsx` y `src/views/FichaLead.jsx`
- ✓ **Cumple:** capta los 3 tipos (Demanda / Oferta / Servicio).
- ✓ **Cumple:** vinculación obligatoria a Cuenta o Contacto antes de transformar (validado en `TransformarLeadModal.jsx`).
- ✓ **Cumple:** acción "Lead Nulo" con motivo obligatorio + textarea para "Otro motivo".
- ✓ **Cumple:** activo / oferta / demanda son opcionales en el lead — coherente con leads tempranos sin contexto inmobiliario.
- ⚠ **Dudoso:** el modal de transformación menciona Dynamics pero no hay enlace explícito al alta en Dynamics 365. En producción debe abrir Dynamics con datos preasignados.
- 🕐 **Esfuerzo:** N/A en mock; en producción medio (integración real con Dynamics)

---

## Plan de corrección priorizado

| # | Cambio | Módulo | Esfuerzo | Bloqueante para |
|---|---|---|---|---|
| 1 | Migrar `occ`/`renta`/`dias` de Activo → Oferta + KPI derivado en Activo | `mockData.js`, `ActivosList`, `FichaActivo` | Alto | Cualquier reporting fiable |
| 2 | Triple FK obligatorio Oportunidad+Oferta+Activo en Mandato | `FichaMandato.jsx` | Alto | Operativa de captación |
| 3 | Matching Demanda → Ofertas (no Activos) con flexibilidad | `FichaDemanda.jsx` | Medio | Calidad del matching |
| 4 | FK Oportunidad obligatorio en Propuesta | `FichaPropuesta.jsx` | Medio | Trazabilidad WIP |
| 5 | Validación FK Activo obligatorio en alta de Oferta | `FichaOferta.jsx`, `OfertasList.jsx` | Bajo | Calidad de dato |
| 6 | Etiquetar KPI derivados con sufijo "Σ" | `FichaActivo.jsx`, `ActivosList.jsx` | Bajo | Claridad UI |
| 7 | Banner Demanda sobre vínculo Oportunidad | `DemandaList.jsx`, `FichaDemanda.jsx` | Bajo | UX |
| 8 | Columna Oportunidad en `PropuestasList` | `PropuestasList.jsx` | Bajo | Visibilidad |
| 9 | "Nuevo Mandato" desde contexto Oportunidad | `MandatosList.jsx` | Bajo | UX |

**Sugerencia de orden:** atacar primero #5 y #6 (rápidos, bajan riesgo), luego #2 y #4 (críticos arquitectónicos), después #1 y #3 (cambios profundos), por último #7-9 (UX).

---

## Notas finales

- La auditoría es **funcional**, no de UX ni de performance.
- No se ha modificado código durante la auditoría.
- Los hallazgos se basan en lectura del código a fecha 27/04/2026, último commit `a268931`.
