# Stacking Plan · PDB

Documento funcional y técnico del Stacking Plan: cómo está construido, cómo se
asignan y se dan de baja propietarios, arrendatarios y ofertas, cómo se modifica
la estructura del edificio y qué reglas de bloqueo protegen la integridad de los
datos.

Código fuente: `src/views/FichaActivo.jsx` (componente `StackingPlan`, línea 664).

---

## 1. Qué es y por qué importa

El Stacking Plan es la **representación física del activo**: qué edificios lo
componen, qué plantas tiene cada edificio, cuántos m² tiene cada planta, a qué
uso se destinan esos m², quién es su propietario y quién lo ocupa (arrendatario
o una oferta en el mercado).

> **Regla maestra: el stacking es la única fuente de verdad.**
> `activos.stacking_data` es el dato real. Las fichas de Propietario, de
> Arrendatario y de Oferta son **vistas** de lo que dice el stacking, no fuentes
> paralelas. Si en el stacking hay 2.000 m² de Barings en P3, eso es lo cierto;
> la ficha del propietario lo refleja, no lo contradice.

Consecuencias prácticas de esa regla:

- La **ocupación** del activo no se lee de un campo almacenado, se **deriva** del
  stacking (`src/lib/deriveOccupancy.js`): m² con `ten`/`rt` = ocupado, m² con
  `vac` = vacante, `occ = ocupado / (ocupado + vacante)`.
- La **superficie** de un propietario o de un arrendatario se recalcula sumando
  sus unidades en el stacking y se propaga a su fila en BD
  (`syncStackingToRecords`, `FichaActivo.jsx:4905`).
- Un propietario o arrendatario **sin asignación en el stacking existe pero está
  incompleto**: no tiene superficie real.

## 2. Un único componente, tres puntos de entrada

`StackingPlan` es un componente exportado y **reutilizado tal cual** — no hay
versiones simplificadas ni clones:

| Dónde | Import | Vista inicial | Para qué |
|---|---|---|---|
| Ficha de Activo → tab Stacking | definición local | `principal` | Construir y gobernar el edificio completo |
| Ficha de Oferta | `import { StackingPlan } from './FichaActivo'` | `arr` | Colocar la disponibilidad de la oferta sobre las plantas |
| Ficha de Arrendatario | `import { StackingPlan } from './FichaActivo'` | `arr` | Colocar al inquilino en sus plantas |

Lo único que cambia entre los tres es `initView` y qué chips recibe por props
(`extraOwners`, `extraTenants`, `extraOfertas`). El comportamiento, el diseño y
el guardado son idénticos. Desde la ficha de Arrendatario u Oferta se puede
incluso **crear el stacking desde cero** si el activo aún no lo tiene: se guarda
en el activo, porque es el mismo plan.

## 3. Modelo de datos

`activos.stacking_data` es un **array de edificios**. Cada edificio:

```jsonc
{
  "id": "A",                    // A, B, C… correlativo
  "label": "Edificio A",
  "supPlantaTipo": 1500,        // m² de planta tipo usados al insertar plantas
  "floors": [                   // capa 1 — estructura + Uso principal
    {
      "id": "P3",               // P3, P2, P1, PB, S1, S2…
      "sup": 2000,              // superficie de la planta (m²)
      "principal": [            // TRAMOS: reparto de la planta por uso
        { "uso": "oficinas", "sup": 1200 },
        { "uso": "retail",   "sup": 800  }
      ],
      "adicional": [            // atributos / dotaciones de la planta
        { "uso": "recepcion", "label": "Recepción", "sup": 0, "attr": true }
      ]
    }
  ],
  "prop": [                     // capa 2 — propietarios, alineada a floors por `p`
    { "p": "P3", "sup": 2000, "units": [
        { "prop_id": "uuid…", "n": "Barings Core Spain SOCIMI", "seg": 0, "sup": 1200 }
    ]}
  ],
  "arr": [                      // capa 3 — arrendatarios y ofertas
    { "p": "P3", "sup": 2000, "units": [
        { "type": "ten", "arr_ref": "ARR-0000123", "n": "Cuatrecasas", "seg": 0, "sup": 900, "renta": 32 },
        { "type": "vac", "oferta": "OFR-0000045", "oferta_ref": "OFR-0000045", "seg": 0, "sup": 300, "renta": 0 }
    ]}
  ]
}
```

### 3.1 El concepto de **tramo**

Un **tramo** es cada segmento de `floor.principal` — es decir, cada porción de
la planta con un uso y unos m². El tramo es la unidad estructural de todo el
stacking:

- **Un tramo = la frontera de un propietario.** Un tramo tiene 0 o 1 propietario.
- **Un tramo puede tener varios ocupantes** (arrendatarios u ofertas) que se
  reparten sus m².
- Los **m² del tramo solo se definen en la capa Uso principal**. Las capas de
  Propietarios y Arrendatarios los **heredan** y no los pueden reescribir.

Cada unidad lleva `seg` = índice de su tramo. Eso hace el vínculo estable aunque
se reordene o se renombre. Los datos antiguos sin `seg` se reconcilian por m²
acumulados (`slotsFor`, línea 785; `arrSlotsFor`, línea 873).

### 3.2 Identificadores estables

| Capa | Campo de identidad | Fallback legacy |
|---|---|---|
| Propietario | `prop_id` (uuid de `propietarios.id`) | `n` (nombre) |
| Arrendatario | `arr_ref` (`ARR-XXXXXXX`) | `n` (nombre) |
| Oferta | `oferta_ref` (`OFR-XXXXXXX`) | `oferta` (nombre) |

El match se hace **siempre id-first**. Solo se cae al nombre cuando el registro
es legacy y no tiene id. Por eso renombrar una oferta o un arrendatario no rompe
su vínculo con el stacking.

### 3.3 Tipos de unidad en la capa `arr`

| `type` | Significado | Ocupación |
|---|---|---|
| `ten` | Arrendatario con contrato | Ocupado |
| `rt` | Retail con inquilino | Ocupado |
| `vac` **con** `oferta` | Espacio vacante publicado en una oferta | Vacante |
| `vac` **sin** `oferta` | Hueco vacío (marcador, no ocupante) | Se ignora |
| `com` | Zona común / hall | No computa |
| `pk` | Parking (plazas se cuentan aparte) | No computa |

## 4. Las tres capas (sub-tabs)

1. **Uso principal** — estructura del edificio. Define plantas, m² y el reparto
   por uso (tramos). Es la **capa gobernante**: todo lo demás cuelga de aquí.
2. **Propietarios** — quién posee cada tramo.
3. **Arrendatarios y oferta** — quién ocupa cada tramo, o qué oferta lo publica.

Las tres comparten la misma rejilla: cada fila es una planta, con **ancho
proporcional a su superficie** (silueta real del edificio) y una línea gruesa
bajo PB que separa sobre rasante de bajo rasante. Cabecera con KPIs: SBA total,
asignado, sin asignar y % de cobertura.

Cada capa tiene un **panel lateral** (300 px, plegable a rail de 60 px) con los
chips arrastrables de esa capa. En Propietarios y Arrendatarios los chips son
además **clicables** y navegan a la ficha del registro.

---

## 5. Construir y modificar la estructura

### 5.1 Crear un edificio

Todo el stacking arranca aquí: **sin edificio no hay plantas, y sin plantas no
hay nada que asignar**. Hay dos puntos de entrada, con el mismo formulario y la
misma lógica.

#### a) Primer edificio — asistente de configuración

Si el activo todavía no tiene stacking, el tab no muestra una rejilla vacía:
muestra el **asistente "Configura el stacking plan"** (`createFirstBuilding`,
línea 1181), con el subtítulo *"Define la estructura del edificio para empezar a
asignar plantas y usos"*.

| Campo | Etiqueta en pantalla | Qué es | Rango | Por defecto |
|---|---|---|---|---|
| Nombre | **Nombre del edificio** | Etiqueta de la pestaña del edificio | texto | El nombre o la dirección del activo |
| Plantas sobre rasante | **Plantas SR** | Nº de plantas por encima del suelo, **PB incluida** | 1–100 | 5 |
| Plantas bajo rasante | **Sótanos BR** | Nº de sótanos | 0–20 | 1 |
| Superficie | **Sup. tipo (m²)** | m² de la planta tipo — se aplica a **todas** las plantas creadas | mín. 100 | La `sup_planta_tipo` del activo, o 1.000 |

Botón **Crear estructura**.

#### b) Edificios adicionales — pestaña *+ Añadir edificio*

Un activo puede tener **varios edificios** (`createBuilding`, línea 1137). En la
fila de pestañas de edificios hay un botón `+ Añadir edificio` que despliega el
mismo formulario en línea, con los campos:

- **Nombre**
- **m² planta tipo**
- **P. sobre rasante**
- **P. bajo rasante**

Cada edificio es **independiente**: sus plantas, sus tramos, sus propietarios y
sus arrendatarios. Se le asigna un id correlativo (`A`, `B`, `C`…) y el stacking
salta automáticamente a la pestaña del edificio recién creado, en la vista *Uso
principal*.

#### Cómo se traduce en plantas

**"Plantas SR" incluye la planta baja.** Si se indica 5, el edificio tiene 5
plantas sobre rasante = **PB + 4 plantas superiores**. Es el error de conteo más
habitual, y está resuelto así a propósito.

Con `SR = 5` y `BR = 2`, y superficie tipo 1.500 m², se generan de arriba abajo:

```
P4   1.500 m²
P3   1.500 m²
P2   1.500 m²
P1   1.500 m²
PB   1.500 m²   ← línea gruesa: separa sobre rasante de bajo rasante
S1   1.500 m²
S2   1.500 m²
```

- Los ids son `P{n}` descendiendo hasta `PB`, y `S{n}` para los sótanos.
- **Todas las plantas nacen con la misma superficie** (la de planta tipo) y
  **vacías**: sin uso principal, sin propietario y sin arrendatario. La SBA
  total del edificio = `SR + BR` × superficie tipo.
- Se crean a la vez las **filas espejo** en las tres capas: `floors`, `prop` y
  `arr`, todas alineadas por el id de planta. Por eso el edificio nunca nace
  descuadrado.
- Los valores se sanean: SR mínimo 1, BR mínimo 0, superficie mínima 100 m².

A partir de aquí, cada planta se puede ajustar individualmente: cambiar su
superficie (§5.3), insertar plantas intermedias o eliminarlas (§5.2) y repartir
su superficie por usos (§5.4).

#### Nº de plantas en la ficha del activo

Al crear la estructura, además de `stacking_data` se rellenan las columnas
**`activos.n_plantas_sobre`** y **`activos.n_plantas_bajo`**, que consumen otros
módulos (p. ej. Mapas). No son un dato que se teclee aparte: se **derivan del
stacking** y se escriben en el mismo `update` que lo persiste, de modo que no
pueden desincronizarse (`src/lib/stackingCounts.js`).

- Se recalculan **en cada guardado del stacking**, no solo al crear: insertar o
  eliminar plantas después también las actualiza.
- Regla de conteo: id que empieza por `S` → bajo rasante; el resto (`PB`, `P1`,
  `P2`…) → sobre rasante.
- Con **varios edificios** se toma el **máximo, no la suma**: la columna
  describe la altura del edificio, no el total de forjados del activo.
- Sin plantas quedan a `null` (no a `0`, que parecería un dato medido).

> El número de **edificios** que se muestra en la cabecera y en el panel derecho
> también se deriva en vivo del stacking (`liveEdifCount`), no de
> `activos.n_edificios`.

### 5.2 Insertar y eliminar plantas

- **Insertar** (`insertFloorAt`, línea 1095): botón `+` entre dos plantas. La
  nueva planta hereda la superficie de planta tipo y el ID se deduce del
  contexto (entre P3 y P1 → P2; encima de P4 → P5). Si el ID chocara, se
  sufija con `b`. Se crean también sus filas vacías en `prop` y `arr`.
- **Eliminar** (`deleteFloor`, línea 1124): botón `−`. Borra la planta y sus
  filas de `prop` y `arr`.
  **Bloqueado si la planta tiene propietario, arrendatario u oferta** — borrarla
  dejaría esos registros huérfanos (ver §9).

### 5.3 Modificar el tamaño (m²) de una planta

Se edita **solo desde la vista Uso principal**, haciendo clic sobre la
superficie de la planta (`tryEditFloorSup` → `saveFloorSup`, líneas 1051 y 1057).

Al guardar, el nuevo valor se propaga a las tres capas a la vez:

```js
floors: f.sup = val
prop:   row.sup = val     // fila de propietarios de esa planta
arr:    row.sup = val     // fila de arrendatarios/ofertas de esa planta
```

Así la planta nunca queda descuadrada entre capas.

**Restricción:** solo se admiten valores numéricos > 0, y la edición está
**bloqueada si la planta tiene asignaciones** (ver §9). El bloqueo se comprueba
dos veces: al abrir el editor y otra vez al guardar (backstop), para que no se
cuele un cambio si el estado cambió con el editor abierto.

### 5.4 Modificar el reparto por uso (tramos)

- **Asignar un uso**: se arrastra un chip de *Usos principales* (Oficinas,
  Retail, Logístico, Residencial, Hotel, Zona común, Parking) sobre una planta.
  Si queda superficie libre, el uso ocupa todo lo libre (`assignPrincipal`,
  línea 743).
- **Dividir una planta llena**: si la planta ya está completa, soltar un uso
  abre el **modal de división** (línea 2368): se indican los m² para el nuevo
  uso y el último tramo existente se reduce en esa cantidad. Resultado: dos
  tramos.
- **Editar los m² de un tramo**: clic sobre el bloque del uso (`saveSup`,
  línea 1073).
- **Quitar un tramo**: `removeItem` con `layer='principal'` (línea 765).
- **Asignación masiva**: seleccionando varias plantas (checkbox o clic en la
  fila) se puede asignar el mismo uso a todas de golpe (`bulkAssign`,
  línea 1087), o arrastrar un chip sobre cualquiera de las seleccionadas.

### 5.5 Usos adicionales

Son **dotaciones y atributos** de la planta (Recepción, Núcleos de comunicación,
Parking, Trasteros, Comedor, Auditorio, Muelles de carga, Spa…). Se muestran
filtrados según el uso principal del edificio (`UA_BY_USO`): un edificio de
oficinas no ofrece "Cámaras frigoríficas".

Dos naturalezas:
- `attr: true` → **atributo** (marcado `A`): no consume superficie.
- `sup: true` → **dotación con superficie** (marcado `S`): arranca con m².

**Los usos adicionales NO están sujetos al bloqueo por asignación**: se pueden
añadir y quitar aunque la planta tenga propietario o inquilino, porque no
reescriben los muros del tramo.

---

## 6. Propietarios

### 6.0 El botón de alta vive en el propio stacking

Cada capa del panel lateral tiene, en su cabecera, un **botón de acción
`+ Añadir`** (`SidebarSection`, línea 618; `actionLabel="+ Añadir"` en las
líneas 1693 para Propietarios y 1961 para Arrendatarios). Es decir: **se puede
dar de alta un propietario o un arrendatario nuevo sin salir del stacking**, y
el registro aparece al instante como chip arrastrable en el panel.

Es una de las **4 vías de alta** previstas (idénticas para propietario y
arrendatario):

| Vía | Dónde | Qué vincula |
|---|---|---|
| 1 | Cards del activo (asignar cuenta arriba) | Vincula la card, **no** la superficie |
| 2 | Módulo → *Nuevo* | Ficha completa; obligatorio activo + cuenta |
| 3 | **Panel izquierdo del stacking → `+ Añadir`** | Crea el registro y lo deja listo para arrastrar |
| 4 | **Sustitución desde el aspa** del stacking | Reemplaza al que estaba |

> **Principio:** el alta crea el **vínculo cuenta ↔ activo en un rol**. La
> **superficie nace únicamente al arrastrar el chip sobre un tramo del
> stacking**. Vincular la cuenta en una card o en la ficha ≠ vincular m².

### 6.1 Alta

Desde el panel lateral de la vista *Propietarios*, botón **+ Añadir**
(`handleAddOwner`, línea 4700):

- **Si el activo aún no tiene propietario** → abre directamente
  `AltaPropietarioModal`: buscador de cuenta en la PDB (typeahead sobre
  `dynamics_accounts`) o alta manual, más año de firma y trimestre
  (obligatorios), perfil inversor, estrategia, horizonte, cap rate y notas.
- **Si ya hay propietario** → primero pregunta qué se quiere hacer:
  - **Propietario adicional (co-propiedad)** — el actual sigue activo y el nuevo
    comparte el activo según los m² que se le asignen en el stacking.
  - **Sustitución** — el anterior pasa al histórico.

Al guardar, `handlePropietarioCreado` (línea 4713) inserta la fila en
`propietarios` heredando del activo zona, subzona, área y uso, y devuelve el
**uuid real**. Ese uuid es el que se estampa como `prop_id` al arrastrar.

> **Gotcha de esquema:** la tabla `propietarios` no tiene columnas `ref` ni
> `updated_at`. No se envían en el insert (falla "schema cache").

### 6.2 Asignación a plantas

El chip del propietario se arrastra **sobre un tramo concreto**
(`assignOwner`, línea 802):

- Si el tramo estaba libre, el propietario lo ocupa entero: `sup = tramo.sup`.
- Si se sueltan **varias plantas seleccionadas**, el propietario cae en el
  **primer tramo libre** de cada una.
- Una planta **sin uso principal no tiene tramos** → no admite propietario. Al
  intentarlo, la fila se tiñe de rojo con el aviso *"Asigna primero un uso
  principal en esta planta"*.
- La fila se normaliza a units con `seg` y con los m² heredados del tramo. **Los
  m² del propietario no se editan en esta capa**: son los del tramo.

Cada propietario recibe un color estable del panel, y el chip muestra su total
de m² sumado en todo el edificio. Al pasar el ratón sobre el chip, se resaltan
sus bloques en la rejilla.

### 6.3 Baja de propietario = **venta**

Un propietario no "se muda": cuando sale de un activo es porque **lo ha
vendido**. No existe traslado para propietarios.

Flujo (`removeOwnerTramo`, línea 820 → `SalidaPropietarioModal`):

1. Se pulsa la ✕ del bloque del propietario.
2. Se abre el modal **Dar de baja propietario** con:
   - **Año y trimestre de venta** (obligatorios)
   - **Precio de venta** (opcional)
   - **Comprador** (typeahead de cuentas, opcional)
   - **Alcance**, solo si ocupa más de una planta:
     - `all` → vende **toda** su superficie en el activo
     - `one` → vende **solo** la planta del aspa (venta parcial)
3. Al confirmar:
   - Con alcance `all`: la fila del propietario se marca
     `estado='Vendido'`, `motivo_salida='Baja'`, `fecha_salida` (1.º del
     trimestre) y una observación legible
     `Venta Q3 2026 · 12.000.000 € · <comprador>`.
   - Con alcance `one`: el propietario **conserva su fila** (sigue siendo dueño
     del resto) y se inserta una fila de histórico con la superficie vendida.
   - Se crea un registro **«Propietario desconocido»** nuevo por cada baja,
     numerado (`Propietario desconocido`, `Propietario desconocido 2`, …), con
     su propio id → su propio color en el stacking.
   - En el stacking, las units del vendedor **no se borran**: se sustituyen por
     esa identidad desconocida.

> **Sustitución, nunca borrado.** La superficie no puede quedar huérfana: si
> alguien vendió, alguien compró. El hueco queda visible (borde discontinuo)
> hasta que se completa el comprador real.

**La baja de propietario NO está bloqueada por ocupación.** Al ser una venta,
los arrendatarios y ofertas que haya encima **se traspasan al comprador**; no
hay motivo para impedirla. El bloqueo aplica solo a cambios de Uso principal.

### 6.4 Completar el comprador

El chip «Propietario desconocido» y su bloque en la rejilla admiten dos caminos:

- **Clic en el chip** → abre la ficha de propietario en modo `completingUnknown`
  para asignarle la cuenta compradora. Al guardar, sustituye únicamente sus
  tramos en el stacking.
- **Arrastrar una cuenta del panel encima del bloque discontinuo** → sustituye
  directamente.

---

## 7. Arrendatarios

### 7.1 Alta

Mismo patrón que el propietario (ver §6.0): panel lateral de la vista
*Arrendatarios y oferta*, cabecera de la sección *Arrendatarios*, botón
**+ Añadir** (`handleAddTenant`, línea 4765) → `AltaArrendatarioModal`. Aquí no
se pregunta por co-propiedad ni sustitución: un tramo admite varios ocupantes,
así que el alta es directa.

- **Arrendatario (Cuenta)** — obligatorio; typeahead sobre `dynamics_accounts`.
  **No admite texto libre**: o se elige una cuenta del desplegable, o se marca
  *Arrendatario desconocido*
- **Año de firma** y **Trimestre** — obligatorios
- **Fecha de inicio de contrato** — obligatoria
- **Años de obligado cumplimiento** (calcula el break automáticamente)
- **Renta de cierre (€/m²/mes)** y **renta mensual**
- Notas

Se persiste con **ref canónico `ARR-XXXXXXX`** generado por `nextRef` — sin
ref, la ficha no cargaría. La superficie se completa después, al arrastrarlo
sobre las plantas.

> `nombre` es NOT NULL en `arrendatarios` y en `propietarios`: siempre se envía.

> **Regla canónica:** propietario y arrendatario son **siempre cuentas de
> Dynamics ya sincronizadas en la PDB** — la PDB no crea cuentas, crea el
> vínculo cuenta ↔ activo en un rol. El alta de arrendatario ya la cumple; solo
> queda un resto cosmético: el placeholder aún dice *"Buscar cuenta o escribir
> nombre…"* aunque escribir un nombre suelto no valida.

### 7.1.1 La cadena de fechas del contrato

Las fechas del contrato **no son campos sueltos**: forman una cadena en la que
cada eslabón se calcula del anterior. Solo se teclean dos fechas reales (inicio
y, si acaso, salida efectiva); el resto son plazos.

```
Fecha inicio            ← se elige en calendario
   + Obligado cumplimiento 1er periodo (años)
= Break option          ← AUTO
   + Obligado cumplimiento 2º periodo (años)
= Fecha fin de contrato ← AUTO
   − Recordatorio (meses antes del break)
= Fecha recordatorio    ← AUTO, solo lectura
```

| Campo | Cómo se introduce | Columna en BD |
|---|---|---|
| Fecha inicio | **Calendario** (`<input type="date">`), obligatorio | `inicio` |
| Obligado cumplimiento 1er periodo | Años, admite decimales (0,5 = 6 meses) | `anios_obligado` |
| **Break option** | **Automática** (inicio + años), con chip `AUTO`; editable a mano si el contrato pacta otra cosa | `break_option` |
| Obligado cumplimiento 2º periodo | Años | `anios_obligado_2` |
| **Fecha fin de contrato** | **Automática** (break + años del 2º periodo), chip `AUTO`, editable | `vencimiento` |
| Recordatorio | **Meses de antelación** respecto al break (obligatorio, 1–24, por defecto 3) | `meses_recordatorio` |
| **Fecha recordatorio** | **Automática y de solo lectura** (break − meses). Se pinta ámbar si faltan ≤ 30 días y roja si ya venció | *no se guarda* — se recalcula al vuelo |
| Fecha salida efectiva | Calendario; solo al dar de baja | `fecha_salida` |

Dónde vive cada cosa:

- **Alta rápida desde el stacking** (`AltaArrendatarioModal`): pide fecha inicio
  (calendario, obligatoria) y años de obligado cumplimiento (opcional). Al
  guardar, `handleArrendatarioCreado` calcula el break option y lo persiste.
- **Ficha del arrendatario** → tab *Información general*, bloque **Contrato**:
  la cadena completa, con recálculo en vivo al teclear.
- **Bloque Acción comercial**: meses de recordatorio y la fecha resultante.
- El tab **Alertas y break option** explota estas fechas.

> **Cuidado (deuda conocida):** el alta rápida escribe `vencimiento` con el
> **mismo valor que el break option**, porque en ese momento no se ha pedido el
> segundo periodo. Es decir, un arrendatario recién creado desde el stacking
> "vence" en su break hasta que alguien abra la ficha y complete el 2º periodo.
> Como Vencimientos y las alertas leen `vencimiento`, conviene completarlo.

### 7.2 Asignación a plantas

Se arrastra el chip sobre un tramo (`assignTenant`, línea 899):

- El arrendatario ocupa **el hueco libre del tramo**
  (`free = tramo.sup − ya ocupado`).
- Un mismo tramo admite **varios ocupantes**.
- Los tramos de uso `parking` y `comun` **no son asignables**.
- Con varias plantas seleccionadas, cae en el primer tramo libre de cada una
  (útil para un inquilino en P5–P8).

**Validación dura:** un tramo **no puede mezclar oferta y arrendatario**. Si se
intenta, avisa: *"Un tramo no puede tener oferta y arrendatario a la vez. Retira
lo que haya antes."*

### 7.3 Edición de m² y renta

Clic sobre el bloque del ocupante → editor inline con superficie, renta y precio
total (`savePASup`, línea 978).

El máximo permitido es **los m² del tramo menos lo que ocupan los demás
ocupantes del mismo tramo**. Si se pide más, avisa y recorta al máximo:
*"No caben X m² en este tramo (máximo Y m²). El reparto de m² se define en Uso
principal."*

Al editar la renta de un arrendatario con `arr_ref`, se sincroniza
`closing_rent` y `renta` en su fila de BD.

### 7.4 Baja de arrendatario

Se pulsa la ✕ del bloque (`removeArrUnit`, línea 921) → `SalidaArrendatarioModal`
con **dos motivos canónicos**:

| Motivo | Qué significa | Efecto |
|---|---|---|
| **Baja** | Se va y no sabemos a dónde | Cierra su fila: `fecha_salida`, `motivo_salida='Baja'`, `estado_arr='Finalizado'` |
| **Fin de contrato** | Se traslada a otro activo de la PDB | Igual + `destino_activo_ref` y **crea una fila nueva** en el activo destino, pendiente de asignar planta |

En ambos casos se retira su unit del stacking del activo origen.

> **Terminología:** los motivos son *Baja* y *Fin de contrato* — nunca "mudanza".
> En listados, los estados son *Vigente / Baja / Traslado* — nunca "Mudado".

Si la unidad no tiene `arr_ref` (legacy, sin fila en BD) cae al modal antiguo
`BajaArrendatarioModal`, que sabe manejar ese caso.

---

## 8. Ofertas

### 8.1 De dónde salen los chips

El panel *Ofertas activas* se alimenta **solo de ofertas reales en BD** ligadas
al activo, filtrando las de estado `Cerrada` / `Desactivada` / `activa = false`.
No se inventan chips fantasma: si una unit `vac` del stacking apunta a una
oferta que ya no existe, es dato corrupto y se limpia, no se pinta.

Desde la **ficha de Oferta**, los chips son las **áreas del desglose** de esa
oferta (cada disponibilidad con su nombre), más las demás ofertas del activo
para tener paridad con el panel del activo.

### 8.2 Asignación

Idéntica a la de arrendatario: arrastrar sobre un tramo, ocupa el hueco libre y
crea una unit `{ type:'vac', oferta, oferta_ref }`.

El vínculo se guarda **por `oferta_ref`, no por nombre**: renombrar o dar de
baja no rompe la relación.

### 8.3 Salida de una oferta

✕ sobre el bloque → `SalidaOfertaModal`, con dos motivos:

| Motivo | Efecto |
|---|---|
| **Oferta cerrada (alquilada)** | Pide arrendatario (o "Arrendatario desconocido"), fecha de inicio, año/trimestre y renta de cierre. Crea la fila en `arrendatarios` con `oferta_origen`, y **reemplaza la unit `vac` por una `ten`** en la misma planta. La oferta pasa a `Cerrada`. |
| **Introducida por error** | Elimina la unit del stacking. La oferta pasa a `Desactivada`. |

> **La oferta nunca se borra**: cambia de estado y desaparece del panel, pero
> sigue en su módulo con su histórico.

---

## 9. La regla de bloqueo: no se toca el Uso principal si hay asignaciones

Esta es la protección central del modelo. Los m² de un tramo son **la frontera
del propietario y del inquilino**. Cambiarlos por debajo dejaría datos
incoherentes: un propietario con más m² de los que existen, un inquilino en un
uso que ya no está ahí, una oferta publicando superficie inexistente.

### 9.1 Qué se comprueba

`floorAssignments(floorId)` (línea 1029) devuelve qué variables tiene la planta:

```js
propietario   ← alguna unit de `prop` con `n` o `prop_id`
arrendatario  ← alguna unit de `arr` con type === 'ten'
oferta        ← alguna unit de `arr` con type === 'vac' Y con oferta
```

`blockIfAssigned(floorId)` (línea 1042) es la **guarda única** de todas las
interacciones de Uso principal: si la lista no está vacía, muestra el aviso
sobre la propia planta y devuelve `true` (bloqueado). El aviso se auto-oculta a
los 4 segundos:

> ⚠ **Para modificar el Uso principal de esta planta, revisa y ajusta primero su
> propietario, arrendatario, oferta.**

### 9.2 Operaciones bloqueadas

| Operación | Función | Bloqueada |
|---|---|---|
| Cambiar la **superficie de la planta** | `tryEditFloorSup` / `saveFloorSup` | Sí (doble check: al abrir y al guardar) |
| Cambiar los **m² de un tramo** | `saveSup` (layer `principal`) | Sí |
| **Asignar** un uso principal (drag) | `assignPrincipal` / `onDrop` | Sí |
| **Quitar** un tramo de uso principal | `removeItem` (layer `principal`) | Sí |
| **Asignación masiva** de uso | `bulkAssign` | Sí (basta con que **una** de las plantas seleccionadas esté asignada) |
| **Eliminar la planta** | `deleteFloor` | Sí |

### 9.3 Operaciones NO bloqueadas

| Operación | Por qué |
|---|---|
| Añadir o quitar **usos adicionales** | Son atributos/dotaciones, no reescriben los muros del tramo |
| **Insertar** una planta nueva | No afecta a plantas existentes |
| **Baja de propietario** (venta) | Los ocupantes se traspasan al comprador; es una operación de negocio, no estructural |
| **Baja de arrendatario / salida de oferta** | Son precisamente la vía para desbloquear la planta |
| Editar **m² o renta de un ocupante** dentro de su tramo | Se mueve dentro del muro, no lo mueve |
| Crear un edificio nuevo | Independiente |

### 9.4 Cómo se desbloquea una planta

El orden correcto para cambiar la estructura de una planta ocupada es:

1. **Retirar la oferta** (cerrada o introducida por error).
2. **Dar de baja al arrendatario** (Baja o Fin de contrato).
3. **Resolver el propietario** si procede (venta).
4. Ya se puede cambiar la superficie de la planta, el reparto por uso o
   eliminarla.

Esto no es una molestia de la interfaz: es lo que evita que el activo quede
descuadrado y que la ocupación derivada mienta.

---

## 10. Persistencia y sincronización

### 10.1 Autosave

Todo cambio en el stacking dispara `onBuildingsChange`, que:

1. Guarda el estado en `liveStackingRef` y en `liveBuildings` (para que las
   tablas de Propietarios y Arrendatarios de la ficha se re-rendericen con la
   superficie real).
2. **Compara con lo que ya hay en BD**: si es idéntico, no escribe. Esto evita
   los "autosaves eco" del montaje, que podían pisar cambios hechos desde otra
   ficha.
3. Si difiere, programa un **guardado con debounce de 1,5 s** a
   `activos.stacking_data`.
4. Tras guardar, sincroniza la copia en memoria y llama a
   `syncStackingToRecords`.

Al **desmontar** el componente (p. ej. al navegar a la ficha del propietario
para completar un comprador) se **cancela el timer y se escribe inmediatamente**.
Si no, el `setTimeout` huérfano se disparaba después y reescribía el stacking
viejo encima de lo recién asignado.

### 10.2 Propagación a las fichas

`syncStackingToRecords` (línea 4905) agrega el stacking y actualiza las filas:

- **Arrendatarios** (por `arr_ref`): `superficie` = suma de sus units `ten`;
  `closing_rent` y `renta` si la unit lleva renta.
- **Propietarios** (por `prop_id`): `superficie` = suma de sus units.

Así las fichas reflejan la realidad del stacking sin tener que abrirlas.

### 10.3 Ocupación derivada

`deriveOccupancy(stacking_data)` devuelve `{ ocupado, vacante, alquilable, occ }`.
Se usa en la lista de activos, en la ficha, en la tabla de competidores y en los
KPIs. Devuelve `occ = null` cuando el stacking no aporta superficie alquilable
(sin datos) — en ese caso se muestra `—`, **no un 0 %**.

---

## 11. Resumen de reglas

0. Un edificio se crea con **nombre + plantas sobre rasante (PB incluida) +
   plantas bajo rasante + superficie de planta tipo**. Todas las plantas nacen
   con esa superficie y vacías, y con sus filas espejo en las tres capas.
1. El stacking es la única fuente de verdad; propietario, arrendatario y oferta
   son vistas.
2. Un componente único (`StackingPlan`) para Activo, Oferta y Arrendatario.
3. El tramo es la unidad estructural: 1 tramo = 1 propietario, N ocupantes.
4. Los m² se definen **solo** en Uso principal; las demás capas los heredan.
5. Sin uso principal no hay tramos → no se puede asignar nada.
6. Un tramo no mezcla oferta y arrendatario.
7. **No se modifica el Uso principal (superficie de planta, m² de tramo,
   asignación, borrado de tramo o de planta) si la planta tiene propietario,
   arrendatario u oferta.**
8. La baja de propietario es una venta: sustitución por «Propietario
   desconocido», nunca borrado, y no bloqueada por ocupación.
9. La baja de arrendatario tiene dos motivos: Baja o Fin de contrato (traslado).
10. La oferta nunca se borra: pasa a Cerrada o Desactivada.
11. Los vínculos son id-first (`prop_id`, `arr_ref`, `oferta_ref`); el nombre es
    solo fallback legacy.
12. La ocupación se deriva, no se almacena.
13. El alta de propietario y de arrendatario se puede hacer **desde el propio
    stacking** (`+ Añadir` en el panel lateral), pero el alta solo crea el
    vínculo: **la superficie nace al arrastrar el chip sobre un tramo**.

---

## 12. Mapa de código

| Qué | Dónde |
|---|---|
| Componente `StackingPlan` | `src/views/FichaActivo.jsx:664` |
| Catálogo de usos principales / adicionales | `FichaActivo.jsx:478` / `:489` / `:517` |
| `slotsFor` (reconcilia propietarios ↔ tramos) | `FichaActivo.jsx:785` |
| `assignOwner` / `removeOwnerTramo` | `FichaActivo.jsx:802` / `:820` |
| `arrSlotsFor` (reconcilia ocupantes ↔ tramos) | `FichaActivo.jsx:873` |
| `assignTenant` / `removeArrUnit` | `FichaActivo.jsx:899` / `:921` |
| `savePASup` (m² y renta del ocupante) | `FichaActivo.jsx:978` |
| `floorAssignments` / `blockIfAssigned` | `FichaActivo.jsx:1029` / `:1042` |
| `tryEditFloorSup` / `saveFloorSup` | `FichaActivo.jsx:1051` / `:1057` |
| `saveSup` (m² de tramo) | `FichaActivo.jsx:1073` |
| `bulkAssign` | `FichaActivo.jsx:1087` |
| `insertFloorAt` / `deleteFloor` | `FichaActivo.jsx:1095` / `:1124` |
| `createBuilding` / `createFirstBuilding` | `FichaActivo.jsx:1137` / `:1181` |
| Modal de división de planta | `FichaActivo.jsx:2368` |
| Autosave + flush al desmontar | `FichaActivo.jsx:4892`, `:5811` |
| `syncStackingToRecords` | `FichaActivo.jsx:4905` |
| `deriveFloorCounts` / `stackingPayload` (nº de plantas SR/BR) | `src/lib/stackingCounts.js` |
| Botón `+ Añadir` del panel (`SidebarSection`) | `FichaActivo.jsx:618`, uso en `:1693` (prop) y `:1961` (arr) |
| `handleAddOwner` / `handleAddTenant` | `FichaActivo.jsx:4700` / `:4765` |
| `handlePropietarioCreado` / `handleArrendatarioCreado` | `FichaActivo.jsx:4714` / `:4771` |
| Alta de propietario / arrendatario | `src/components/AltaPropietarioModal.jsx`, `AltaArrendatarioModal.jsx` |
| Bajas | `SalidaPropietarioModal.jsx`, `SalidaArrendatarioModal.jsx`, `SalidaOfertaModal.jsx`, `BajaArrendatarioModal.jsx` |
| Ocupación derivada | `src/lib/deriveOccupancy.js` |
