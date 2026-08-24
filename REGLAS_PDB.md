# Reglas del proyecto PDB · léeme antes de tocar código

Documento de contexto para cualquier agente que trabaje en este repositorio.
Son reglas del **usuario**, no preferencias mías: se han consolidado a lo largo
del proyecto y romperlas obliga a rehacer trabajo.

Documentación de referencia en la raíz:

| Documento | Qué cubre |
|---|---|
| `REGLAS_PDB.md` | **Este documento.** Las reglas transversales |
| `STACKING_PLAN_PDB.md` | Stacking Plan: estructura, propietarios, arrendatarios, bloqueos, fechas de contrato |
| `GUIA_OFERTA_PDB.md` | Oferta: flujo end-to-end y catálogo de desplegables |
| `GLOSARIO_DATOS_PDB.md` | Qué significa cada columna de superficie/renta/estado |

---

## 1. Reglas que no se negocian

### 1.1 Un concepto, un término

Un concepto tiene **un único nombre** en todo el sistema: en la interfaz, en las
columnas y en el código. Sin sinónimos. Si aparece un conflicto de nombres,
**parar y preguntar**, no elegir por cuenta propia.

Ejemplos ya fijados:
- Salida de arrendatario: **Baja** / **Fin de contrato**. Nunca "mudanza".
- Estados de arrendatario en listados: **Vigente / Baja / Traslado**. Nunca
  "Mudado".
- Salida de propietario: es una **venta**. No existe "traslado" de propietario.

### 1.2 Un flujo, un componente

Las vistas equivalentes comparten **el mismo componente real**. Está prohibido
crear una versión "simplificada" para un caso concreto: acaba divergiendo.

Casos vivos:
- `StackingPlan` se usa tal cual en Activo, Oferta, Arrendatario y Propietario.
  Solo cambia `initView` y los chips que recibe por props.
- `SalidaOfertaModal` se usa tanto desde la ✕ del stacking como desde el botón
  "Dar de baja" de la ficha de Oferta.

> Si detectas dos implementaciones de la misma decisión, **es un bug**, aunque
> ninguna falle por separado. Unifícalas o repórtalo.

### 1.3 Formato canónico de IDs

**`PREFIJO-XXXXXXX`**: 3 letras, guion, 7 dígitos con ceros a la izquierda.
Sin años, sin timestamps. `OFR-0000045`, `ARR-0000123`, `PRO-0000007`.

El único generador válido es **`nextRef(tabla, prefijo)`** (`src/lib/nextRef.js`).
Nunca `Date.now()` ni contadores locales. Los mocks usan el mismo formato.

### 1.4 Nada se borra: se cambia de estado

Los registros de negocio no se eliminan, cambian de estado y salen de las
vistas activas. Una oferta pasa a `Cerrada` o `Desactivada`; un arrendatario a
`Finalizado`; un propietario a `Vendido`. El borrado real rompe la trazabilidad
—`oferta_origen`, `destino_activo_ref`— y deja huérfanos.

**Excepción única:** las unidades del stacking sí se retiran, porque son la
representación física del espacio, no un registro histórico.

### 1.5 La superficie nunca queda huérfana

Si alguien vende, alguien compra. Al dar de baja a un propietario, sus tramos
**no se borran**: se sustituyen por «Propietario desconocido» (numerado, con id
propio) hasta que se complete el comprador real.

### 1.6 Toda transición de estado necesita un botón explícito

Ningún handoff entre entidades ocurre solo. Lead → Oportunidad, Propuesta →
Mandato, Oferta → Arrendatario: cada uno tiene su acción y su modal. Y cuando la
consecuencia no es obvia, el modal **pregunta el motivo** antes de actuar,
porque el motivo determina el resultado.

### 1.7 Cerrar un mandato no implica retirar las ofertas

Siempre hay que preguntar: **desvincular** (la oferta sigue viva) o **retirar**
(el activo sale del mercado). No asumir.

---

## 2. Reglas de datos

### 2.1 El stacking es la única fuente de verdad

`activos.stacking_data` manda. Las fichas de Propietario, Arrendatario y Oferta
son **vistas** de lo que dice el stacking, no fuentes paralelas.

De ahí se derivan, **nunca se leen de un campo almacenado**:
- **Ocupación** → `deriveOccupancy()` (`src/lib/deriveOccupancy.js`). No usar
  `activos.occupancy_rate`.
- **Superficie** de propietarios y arrendatarios → `syncStackingToRecords()`.
- **Nº de plantas** sobre y bajo rasante → `stackingPayload()`
  (`src/lib/stackingCounts.js`), que viaja en el mismo `update` que
  `stacking_data` para que no puedan desincronizarse.

> Cuando escribas el array completo de edificios, usa `stackingPayload(blds)` en
> lugar de `{ stacking_data: blds }`.

### 2.2 Cuentas: la PDB no las crea

Propietario y arrendatario son **siempre cuentas de Dynamics ya sincronizadas**.
La PDB crea el **vínculo** cuenta ↔ activo en un rol, no la cuenta. Toda búsqueda
va contra `dynamics_accounts`. Sin texto libre.

### 2.3 FKs denormalizadas

Cada tabla operativa lleva FK a **todos** sus padres, no solo al inmediato. Es lo
que hace posible la vista 360 sin joins encadenados. Al insertar, rellena todas
las que conozcas (`activo_id` **y** `activo_ref`, `portfolio_id`,
`dynamics_account_id`…). Si falta `activo_ref`, el listado muestra "Pendiente
Activo".

### 2.4 Gotchas de esquema verificados

- `propietarios` **no tiene** columnas `ref` ni `updated_at`. Enviarlas rompe el
  insert con error de "schema cache".
- `nombre` es **NOT NULL** en `propietarios` y en `arrendatarios`.
- `ofertas` **no tiene** columna `nombre`: usa `titulo_web` o `ref`.
- Antes de dar por buena una columna, **compruébala contra la BD real**. El
  cliente Supabase está en `src/lib/supabase.js`.

---

## 3. Reglas de interfaz

### 3.1 Diseño

- **Sidebar vertical** multisección. No proponer tabs horizontales, icon-rail ni
  "workspaces", aunque haya scroll.
- Módulos al **50% de ancho** por defecto.
- Iconos **vectoriales monocromo**.
- **Color restrictivo**: solo en los campos importantes.
- Tipografía única: **Inter** en todo (las variables `--serif`/`--sans`/`--mono`
  apuntan todas a Inter). Refs con `tabular-nums`.

### 3.2 Estructura universal de fichas

**Todas** las fichas comparten plantilla: Vinculaciones arriba, y Equipo /
Colaboradores al 50/50. Mismo orden de campos en todas. Cada card de
Vinculaciones **navega** a la ficha del registro vinculado.

No hay que preguntar módulo por módulo: se aplica el canon.

### 3.3 Rediseño ≠ recorte

Cuando el encargo es **mejorar el diseño**, se puede cambiar orden, tintes y
tipografía. **No** se puede esconder cards, quitar buscadores ni condicionar
visibilidad. Antes de quitar cualquier card, comprobar si contiene controles.

### 3.4 Nuevo registro con FKs obligatorias

"+ Nuevo X" abre un **modal** con typeahead de sus padres (Oportunidad, Cuenta,
Activo) **antes** de crear. Nunca mandar a una ficha vacía a rellenar a ciegas.

### 3.5 Componentes fuera del render

Nunca definir un componente dentro del `render` de otro: al teclear, el input se
remonta y **pierde el foco**. Siempre a nivel de módulo.

---

## 4. Cómo trabajar en este repo

1. **Verifica contra el código y contra la BD**, no contra la memoria ni contra
   estos documentos. Si un documento contradice al código, gana el código — y
   avisa de la discrepancia.
2. **Commit + push tras cada cambio funcional**, sin esperar a que lo pidan.
3. **No bajes el listón de calidad para acabar antes**: si algo queda a medias,
   dilo explícitamente en vez de entregarlo como completo.
4. **Reporta lo que encuentres.** Si al implementar A descubres que B está roto,
   dilo aunque no lo hayan preguntado. No lo arregles por tu cuenta si excede el
   encargo: pregunta.
5. **Antes de tocar columnas de superficie, renta, estado o vínculo**, consulta
   `GLOSARIO_DATOS_PDB.md`.
6. Comprueba que no introduces problemas de lint nuevos: compara el recuento de
   `npx eslint <ficheros>` antes y después. El repo arrastra errores previos; el
   listón es **no empeorarlo**.

---

## 5. Deuda conocida (no la des por buena)

Verificado en agosto de 2026 contra código y BD de producción:

| Qué | Dónde | Estado |
|---|---|---|
| El **estado de la oferta** tiene 4 vocabularios distintos (`Disponible`, `En curso`, `Cerrada`/`Desactivada`, `Retirada`) | Listado, altas, cierres, mandato | Abierto. En producción solo existe `Disponible`, aún se está a tiempo de fijar la lista |
| `FichaOfertaSupabase.jsx` es **código muerto**: se importa pero no se renderiza | `src/views/` | Abierto. Es la fuente de catálogos alternativos que confunden |
| Los tabs de **Condiciones económicas** y **Contenido web** de la Oferta **no se guardan**: las columnas `condiciones` y `contenido_web` existen pero nadie las escribe | `FichaOferta.jsx` | Abierto. Se pierde al recargar |
| `modalidad_visita` se persiste pero **no hay control en la interfaz** que lo rellene | `FichaOferta.jsx` | Abierto |
| `tipologia` mezcla dos escalas (`Oficina tradicional` vs `Oficinas`) | Oferta | Abierto |
| El **alta rápida de arrendatario** escribe `vencimiento = break_option`, así que un contrato recién creado "vence" en su break | `FichaActivo.jsx` | Abierto |
| El cálculo del **break option** está duplicado en la ficha de arrendatario, con distinto trato de los decimales | `FichaArrendatario.jsx` | Abierto |
| Cerrar una oferta como alquilada crea el arrendatario **sin cadena de fechas** (`anios_obligado`, `break_option`, `vencimiento` a null) | `SalidaOfertaModal.jsx` | Abierto |
| `activos.n_edificios` no se escribe; la cabecera lo deriva en vivo | `FichaActivo.jsx` | Abierto |
| La salida de oferta divergía entre ficha y stacking (la ficha hacía `DELETE`) | `FichaOferta.jsx` | **Resuelto** — ambos usan `SalidaOfertaModal` |
| `n_plantas_sobre` / `n_plantas_bajo` no se rellenaban | `stackingCounts.js` | **Resuelto** — derivadas del stacking |
