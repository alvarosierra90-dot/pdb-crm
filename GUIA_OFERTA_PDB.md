# Guía de la Oferta · PDB

Flujo completo de una Oferta —desde cómo nace hasta cómo se cierra— y catálogo
de todos sus campos desplegables con sus opciones.

Código: `src/views/FichaOferta.jsx` (ficha), `src/views/OfertasList.jsx`
(listado), `src/components/SalidaOfertaModal.jsx` (cierre).

---

## 1. Qué es una Oferta

| | Activo | Oferta |
|---|---|---|
| Qué es | El **inmueble físico** | El **producto comercial** que se pone en mercado |
| Cuántos | Uno | **Varias por activo**, y varias a la vez |
| Vida | Permanente | Se abre, se comercializa y se cierra |
| Superficie | SBA total del edificio | Solo los m² **disponibles** que se comercializan |

Una Oferta es *"estos m² de este activo, en estas condiciones, ahora"*. Por eso
un mismo activo puede tener una oferta de alquiler de las plantas 3–5 y otra de
venta del edificio entero, cada una con su ciclo.

**Vínculo con el stacking:** la oferta ocupa tramos de plantas como unidades
`type:'vac'` con `oferta_ref`. Mientras esos m² tengan oferta, cuentan como
**vacantes** en la ocupación derivada del activo (ver `STACKING_PLAN_PDB.md`).

---

## 2. Flujo: cómo nace, vive y muere una oferta

```
        ┌─────────────── 5 VÍAS DE ALTA ───────────────┐
        │                                              │
  Listado Ofertas    Lead          Propuesta      Baja de          Stacking
   "+ Nueva"      (transformar)     ganada       arrendatario    (chip de oferta)
        │              │               │              │
        └──────────────┴───────┬───────┴──────────────┘
                               ▼
                    ┌──────────────────────┐
                    │  OFERTA CREADA       │  ref OFR-XXXXXXX
                    └──────────┬───────────┘
                               ▼
        1. Vincular ACTIVO (buscador)  ── obligatorio para todo lo demás
        2. Vincular MANDATO            ── obligatorio si "Mandato Savills"
        3. Rellenar INFORMACIÓN        ── tipología, operación, estado…
        4. DESGLOSE de áreas           ── 1 disponibilidad por propietario/tramo
        5. Asignar en el STACKING      ── arrastrar cada área a sus plantas
        6. CONDICIONES económicas      ── renta, gastos, incentivos
        7. CONTENIDO WEB / portales    ── publicación
                               ▼
                    ┌──────────────────────┐
                    │  EN MERCADO          │ ← matching con Demandas,
                    └──────────┬───────────┘   microsite, visitas
                               ▼
                      ┌────────┴────────┐
                      ▼                 ▼
              Oferta cerrada      Introducida
              (alquilada)         por error
                      │                 │
          crea ARRENDATARIO       se elimina del
          y sustituye la unit     stacking sin más
          'vac' → 'ten'                 │
                      ▼                 ▼
                  Cerrada          Desactivada
                      └────────┬────────┘
                               ▼
                    activa = false → pestaña
                    "Desactivadas" (reactivable)
```

### 2.1 Las cinco vías de alta

| Vía | Dónde | Qué precarga |
|---|---|---|
| **Listado** | Ofertas → `+ Nueva oferta` | `tipo_comercializacion='Mandato Savills'`, `tipo_operacion='Alquiler'`, `estado='Disponible'`, `activa=true`. Nada más: el activo se vincula después |
| **Lead** | `TransformarLeadModal` | Activo elegido, cuenta y oportunidad de Dynamics, equipo de trabajo heredado |
| **Propuesta ganada** | `MarcarPropuestaGanadaModal` | **Una oferta por activo del mandato**, con `mandato_id`, oportunidad, cuenta y equipo. `estado='En curso'` |
| **Baja de arrendatario** | `BajaArrendatarioModal` → *Generar oferta* | Superficie del arrendatario que se va, `fecha_disponibilidad` = su fecha de salida, tipología = uso del activo, y un comentario trazando el origen |
| **Stacking** | Panel *Ofertas activas* | No crea la oferta: coloca una ya existente sobre los tramos |

En las cinco, la referencia es **`OFR-XXXXXXX`** generada por `nextRef`.

### 2.2 Vincular el activo

Sin activo la oferta no puede hacer casi nada: no hay stacking, no hay
dirección, no hay propietario. Se vincula con el **buscador "Vincular activo"**
y se escriben a la vez `activo_ref` y `activo_id`. Si falta `activo_ref`, el
listado muestra la oferta como *"Pendiente Activo"*.

### 2.3 Desglose de áreas (disponibilidades)

Una oferta puede cubrir espacios de **varios propietarios o tramos**. Para eso
está el desglose: cada línea es una **disponibilidad** con nombre propio y color
propio, y **cada una debe corresponder a un único propietario/tramo**.

Columnas de la tabla: *Nombre área · Sup. asignada · Divisible · Sup. mín. ·
Gastos €/m² · IBI €/m² · Fecha disp. · Plantas asignadas*.

- El nombre por defecto es **`{OFR-XXXXXXX} - Disp N`**.
- **Sup. asignada y Plantas asignadas no se teclean**: se derivan de lo que se
  haya arrastrado en el stacking.
- Hay un candado: no se puede pulsar `+ Agregar` mientras haya una línea nueva
  sin guardar.
- Se persiste en la tabla `desglose_ofertas` (borrar + reinsertar en cada
  guardado, con el campo `orden`).

### 2.4 En mercado

Con la oferta publicada entra en el pool que consume el **matching de Demanda**;
las alternativas seleccionadas se envían por **microsite**, y de ahí salen
visitas y negociación. El botón de negociación pone la oferta `En negociación`.

### 2.5 Quitar una oferta: siempre te pregunta **por qué**

Una oferta nunca desaparece en silencio. Tanto si pulsas la **✕ del bloque en el
stacking** como el botón **"Dar de baja"** de la ficha, se abre una ventana
central que obliga a elegir uno de **dos motivos**, porque las consecuencias son
opuestas:

```
                    ¿Por qué sale esta oferta?
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
  Oferta cerrada (alquilada)            Introducida por error
  «Se ha alquilado / vendido»           «No debería existir»
          │                                       │
  · Se crea un ARRENDATARIO                · No se crea nada
  · La unit 'vac' pasa a 'ten'             · La unit se borra del stacking
  · El espacio pasa a OCUPADO              · El espacio vuelve a estar libre
  · Queda la trazabilidad                  · No queda registro
    (oferta_origen)
```

#### a) «Oferta cerrada (alquilada)» → **se convierte en arrendatario**

Es el final feliz: el espacio se ha comercializado. El sistema **no te hace dar
de alta al inquilino por separado** — la oferta se transforma en él.

El modal pide:

| Campo | Obligatorio |
|---|---|
| **Arrendatario** (nombre) o marcar *Arrendatario desconocido* | Sí |
| **Fecha de inicio del contrato** (calendario) | Sí |
| Año de firma y trimestre | Precargados con el actual |
| **Renta de cierre** | Precargada con la renta de la oferta |

El resto del contrato (obligado cumplimiento, break option, segundo periodo,
recordatorio) se completa en la ficha del arrendatario, a la que se navega
automáticamente. Ver la cadena de fechas en `STACKING_PLAN_PDB.md` §7.1.1.

Al confirmar ocurren cuatro cosas encadenadas:

1. Se **crea la fila en `arrendatarios`** con `estado_arr='Vigente'`, la
   superficie de la oferta y **`oferta_origen` = ref de la oferta** — ese campo
   es la trazabilidad: desde el inquilino siempre se puede volver a la oferta
   que lo generó.
2. En el stacking, la unit **`type:'vac'` se sustituye por `type:'ten'`** con el
   nombre del arrendatario y sus mismos m². El espacio deja de contar como
   vacante y pasa a ocupado, así que **la ocupación del activo sube sola**.
3. La **oferta se desactiva** (`activa = false`) y sale del panel lateral del
   stacking y de la lista de ofertas activas.
4. Se navega a la **ficha del nuevo arrendatario** para completar el contrato
   (break option, segundo periodo, recordatorio).

> **Alcance según desde dónde se haga:** desde el stacking se convierte **solo
> la planta de la ✕**; desde la ficha, **todas las plantas** de la oferta de una
> vez. En ambos casos se respeta el tramo: cada unidad `vac` produce su propia
> unidad `ten` con sus m² y su `seg`, no se fusionan los bloques de una planta.

#### b) «Introducida por error» → se retira sin dejar rastro

Para cuando la oferta no debería haberse creado. No crea arrendatario, no deja
histórico: limpia las unidades del stacking y el espacio vuelve a quedar libre.

La oferta **no se borra**: pasa a `Desactivada` y sigue en su módulo, en la
pestaña *Desactivadas*, por si hay que reactivarla o consultarla.

> **Los dos caminos hacen lo mismo.** La ✕ del stacking y el botón "Dar de baja"
> de la ficha abren **el mismo modal** (`SalidaOfertaModal`) y producen el mismo
> resultado en BD. La única diferencia es el **alcance**: desde el stacking se
> actúa sobre la planta de la ✕; desde la ficha, sobre todas las plantas de la
> oferta, porque ahí la decisión es sobre la oferta entera.

### 2.6 Desactivar y reactivar una oferta

Al margen del cierre, la oferta tiene un interruptor propio: la columna
booleana **`activa`**. Es lo que separa las dos pestañas del listado.

| | Activas | Desactivadas |
|---|---|---|
| Filtro | `activa = true` | `activa = false` |
| Qué son | Ofertas vivas, en mercado | *"Arrendadas / retiradas"* |
| En el stacking | Aparecen como chip arrastrable | **Desaparecen del panel** |
| Acción disponible | — | Botón **Reactivar** |

- **Desactivar** no es una acción suelta: ocurre como consecuencia de cerrar la
  oferta (alquilada) o de retirarla.
- **Reactivar** (botón verde en la pestaña *Desactivadas*) devuelve la oferta al
  mercado: `activa = true` y `estado = 'Disponible'`.

> ⚠ **Reactivar no devuelve el espacio.** Solo cambia los dos campos de la
> oferta; las unidades del stacking ya se convirtieron en arrendatario o se
> borraron. La oferta vuelve al panel lateral **vacía**, y hay que volver a
> arrastrarla a sus plantas.

### 2.7 Retirada por el mandato

Si se **cancela o no se renueva el mandato**, sus ofertas vivas pasan
automáticamente a `Retirada` con `activa = false` y un `motivo_descarte`
("Mandato cancelado", "Mandato finalizado / no renovado").

---

## 3. Anatomía de la ficha — 8 tabs

| # | Tab | Contiene |
|---|---|---|
| 1 | **Información oferta** | Vinculaciones, comercialización, tipología y estado, localización, equipo y colaboradores |
| 2 | **Stacking plan** | El `StackingPlan` compartido, abierto en la vista *Arrendatarios y oferta* |
| 3 | **Espacios comerciales** | Desglose de áreas + condiciones económicas + plazas de parking |
| 4 | **Características** | Se importan del activo y se filtran para esta oferta |
| 5 | **Documentos** | Fichas comerciales, dossieres |
| 6 | **Contenido web** | Título, texto, keywords, opciones de publicación y portales |
| 7 | **Vista 360** | Histórico comercial |
| 8 | **Confidencialidad** | Marcar confidencial y gestionar accesos |

---

## 4. Catálogo de campos desplegables

> `*` = obligatorio. "Columna" es la columna real de la tabla `ofertas`.

### 4.1 Tab *Información oferta* — bloque **Comercialización**

| Campo | Opciones | Defecto | Columna |
|---|---|---|---|
| **Tipología comerc.** `*` | `Mandato Savills` · `Sin mandato` · `Colaboradores` | Mandato Savills | `tipo_comercializacion` |
| **Tipo de operación** `*` | `Alquiler` · `Venta` · `Alquiler / Venta` | Alquiler | `tipo_operacion` |
| **Origen de la oferta** | `Demanda entrante` · `Prospección directa` · `Referencia interna` · `Portal web` · `Red de colaboradores` · `Otra consultora` | — Seleccionar — | `origen_oferta` |

**Dependencias:**
- `Mandato Savills` → aparece el bloque **Mandato asociado `*`** con buscador de
  mandatos. Es obligatorio.
- `Colaboradores` → aparece el buscador de **cuenta colaboradora** (typeahead
  sobre `dynamics_accounts`).

### 4.2 Tab *Información oferta* — bloque **Tipología y estado**

| Campo | Opciones | Defecto | Columna |
|---|---|---|---|
| **Tipología** `*` | **Depende del uso del activo** (ver tabla 4.3) | — Seleccionar — | `tipologia` |
| **Estado del espacio** | `Nuevo` · `Obra nueva` · `Muy buen estado` · `En bruto` · `Segunda mano` · `Implantado` · `Plug&Play` · `Por reformar` · `Amueblado` · `Sin amueblar` | — Seleccionar — | `estado_espacio` |

### 4.3 Tipología según el uso del activo (`TIPOLOGIA_MAP`)

Este desplegable **está vacío hasta que se vincula un activo**: sus opciones se
derivan del uso principal de ese activo.

| Uso del activo | Opciones de tipología |
|---|---|
| Oficinas | Oficina tradicional · Coworking · Subarriendo · Business park · Sede única (HQ) |
| Logístico *(y Logístico / Industrial)* | Nave logística · Nave industrial · Última milla · Plataforma logística · Cross-docking |
| Retail | High Street · Local en centro comercial · Parque comercial · Local stand-alone · Flagship store · Parque de medianas |
| Centros comerciales | Centro comercial dominante · Centro comercial secundario · Outlet · Participación en centro |
| Residencial | Vivienda plurifamiliar · Vivienda unifamiliar · Obra nueva · Segunda mano |
| Living (PRS / BTR / Flex) | Build to Rent (BTR) · Build to Sell (BTS) · Flex living · Student housing · Senior living · Coliving |
| Hoteles | Hotel urbano · Hotel vacacional · Resort · Aparthotel · Hostal |
| Suelos | Suelo finalista · Suelo en desarrollo · Suelo urbanizable |
| Data Center | Hyperscale · Colocation · Edge computing |
| Alternativos | Selección abierta |
| Mixtos | Selección combinada |

### 4.4 Tab *Espacios comerciales* — **Condiciones contractuales**

| Campo | Opciones | Defecto |
|---|---|---|
| **Tipo de arrendamiento** | `Alquiler comercial` · `Uso distinto de vivienda` · `Vivienda habitual` · `Temporada` · `Industria` · `Otro` | Alquiler comercial |
| **Régimen fiscal** | `IVA` · `Exento de IVA` · `Sujeto y exento` · `ITP` · `Otro` | IVA |
| **Indexación anual** | `IPC` · `Fijo` · `Escalonado` · `Otro` · `Sin indexación` | IPC |

Acompañan campos de texto/número: fianza legal (meses), aval bancario, pago de
honorarios a la firma, meses de carencia, aportación a obras, otros incentivos,
precio mínimo/máximo y precio de venta total.

### 4.5 Tab *Espacios comerciales* — **Plazas de aparcamiento**

| Campo | Opciones | Defecto |
|---|---|---|
| **Int / Ext** | `Interior` · `Exterior` | Interior |
| **Tipología** | `Coches` · `Motos` · `Bicicletas` · `Mixto` | Coches |
| **Formato** | `Simple` · `Doble` | Simple |

El campo de renta de la plaza se oculta cuando el tipo de operación es `Venta`.

### 4.6 Tab *Contenido web* — **Publicación**

| Campo | Opciones | Defecto |
|---|---|---|
| **Opción de publicación** | `Publicar dirección` · `Sin publicar dirección` | Publicar dirección |
| **Portal** (enlaces) | `Idealista` | Idealista |

Checkboxes: *Publicar condiciones económicas* · *Publicar* · *Geolocalización
dirección*. Y el portal Idealista con su propio check.

### 4.7 Desplegables auxiliares

| Campo | Opciones | Dónde |
|---|---|---|
| **Miembro del equipo** | Usuarios de la PDB | Bloque Equipo |
| **Usuario autorizado** | Usuarios de la PDB | Tab Confidencialidad |
| **Trimestre** | `Q1` · `Q2` · `Q3` · `Q4` | Modal de cierre → alta de arrendatario |
| **Divisible** | Sí / No | Tabla de desglose |

---

## 5. Reglas de dependencia entre desplegables

1. **Sin activo vinculado no hay tipología**: `TIPOLOGIA_MAP` se indexa por el
   uso del activo. Vincula primero el activo.
2. **`Mandato Savills` obliga a mandato asociado.**
3. **`Colaboradores` abre el buscador de cuenta colaboradora.**
4. **`Venta` oculta la renta** de las plazas de aparcamiento.
5. **Superficie y renta de la oferta no se teclean**: se derivan de los espacios
   asignados en el stacking (`superficie_disponible`, `renta_m2`).
6. **Un tramo no admite oferta y arrendatario a la vez** (validación del
   stacking).

---

## 6. Incoherencias detectadas (agosto 2026)

Verificadas contra el código y contra la BD de producción.

### 6.1 El estado de la oferta tiene **cuatro vocabularios distintos**

| Dónde | Valores |
|---|---|
| Listado, `+ Nueva` | `Disponible` |
| Propuesta ganada / Baja de arrendatario | `En curso` |
| Cierre desde el stacking | `Cerrada` · `Desactivada` |
| Cancelación de mandato | `Retirada` |
| Filtro del listado | `En curso` · `Finalista` · `Cerrada` |
| Colores del listado | 8 valores: `En revisión`, `Negociando`, `Pre-acuerdo`, `En curso`, `Disponible`, `En negociación`, `Cerrada`, `Finalista` |
| `FichaOfertaSupabase` (código muerto) | `En curso` · `Activa` · `Ocupada parcial` · `Ocupada total` · `Retirada` |

En producción hoy solo hay `Disponible` (6 ofertas), así que **aún se está a
tiempo de fijar la lista** antes de que el dato se ensucie. Contradice la regla
de terminología única: un concepto, un término.

### 6.2 `FichaOfertaSupabase.jsx` es código muerto

Se importa en `FichaOferta.jsx:8` pero **no se renderiza nunca**. Sus 929 líneas
definen catálogos alternativos —otro `tipo_operacion` (añade `Inversión` y
`Sale & Leaseback`), otro `tipo_comercializacion` (añade `Mandato compartido`,
`Off-market`, `Alianza`), otras `TIPOLOGIAS` y los `MOTIVOS_DESCARTE_OFERTA`—
que no llegan al usuario. Es la fuente de la confusión de vocabularios.

### 6.3 Dos tabs completos no se guardan

Las columnas `ofertas.condiciones` y `ofertas.contenido_web` existen, pero
**ningún punto del código las escribe**: están a `null` en las 6 ofertas reales.
Es decir, todo el bloque de **Condiciones contractuales / Incentivos y CAPEX /
Precio** y todo el **Contenido web** (título, texto, keywords, publicación,
portales) es estado de pantalla que **se pierde al recargar**.

### 6.4 `modalidad_visita` es un campo huérfano

Se persiste en el guardado (`modalidad_visita`) pero **no hay ningún control en
la interfaz** que lo rellene: siempre viaja vacío.

### 6.5 ~~La salida de la oferta divergía según dónde se hiciera~~ · RESUELTO

**Cómo estaba** (hasta agosto 2026): la ficha tenía su propio modal con reglas
distintas a las del stacking. Cerrar desde la ficha **no tocaba `estado`**, así
que una oferta alquilada seguía figurando como `Disponible` en el listado; y
"Introducida por error" hacía un **`DELETE`** real de la fila, rompiendo la
trazabilidad de cualquier arrendatario con `oferta_origen` apuntando a ella.

**Cómo está ahora:** la ficha usa el mismo `SalidaOfertaModal` que el stacking.
Una sola pregunta y un solo resultado: `Cerrada` o `Desactivada`, siempre con
`activa = false`, y la fila **nunca se borra**. Lo único que cambia según el
origen es el alcance (una planta desde el stacking, todas desde la ficha).

### 6.6 `tipologia` mezcla dos escalas

La ficha guarda valores finos (`Oficina tradicional`, `Coworking`), pero la baja
de arrendatario guarda el **uso del activo** (`Oficinas`). En producción las 6
ofertas tienen `Oficina`, que no está en ninguno de los dos catálogos.

---

## 7. Mapa de código

| Qué | Dónde |
|---|---|
| Ficha de Oferta (la que se usa) | `src/views/FichaOferta.jsx` |
| Tabs | `FichaOferta.jsx:21` |
| `TIPOLOGIA_MAP` | `FichaOferta.jsx:81` |
| Dropdowns de Comercialización | `FichaOferta.jsx:1432`, `:1437`, `:1442` |
| Dropdowns de Tipología y estado | `FichaOferta.jsx:1530`, `:1539` |
| Desglose de áreas | `FichaOferta.jsx:365` (modelo), `:1878` (tabla) |
| Condiciones contractuales | `FichaOferta.jsx:2207`, `:2213`, `:2227` |
| Plazas de aparcamiento | `FichaOferta.jsx:2015`, `:2020`, `:2025` |
| Publicación web | `FichaOferta.jsx:2505`, `:2546` |
| Guardado (payload real) | `FichaOferta.jsx:864` |
| Listado y alta rápida | `src/views/OfertasList.jsx:99` |
| Alta desde Lead | `src/components/TransformarLeadModal.jsx:372` |
| Alta desde Propuesta ganada | `src/components/MarcarPropuestaGanadaModal.jsx:190` |
| Alta desde Baja de arrendatario | `src/components/BajaArrendatarioModal.jsx:144` |
| Cierre de oferta (compartido ficha + stacking) | `src/components/SalidaOfertaModal.jsx` |
| Handler de salida en la ficha | `FichaOferta.jsx:937` |
| Retirada por mandato | `src/views/FichaMandatoSupabase.jsx:374`, `:404` |
| Ficha alternativa **sin usar** | `src/views/FichaOfertaSupabase.jsx` |
