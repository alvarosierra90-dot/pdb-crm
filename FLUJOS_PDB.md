# Flujos PDB — Mapa de procesos

Este documento describe los 11 procesos clave del PDB CRM y su relación con Dynamics. En todos los diagramas, los nodos azules pertenecen a **Dynamics** (sistema maestro) y los nodos verdes pertenecen al **PDB** (sistema operativo del broker). Los nodos amarillos representan el **LEAD**, punto de entrada de todo el funnel comercial. El sentido de las flechas indica el flujo natural del proceso; los retornos sombreados representan la sincronización automática Dynamics → PDB.

---

## 0. LEAD — Punto de entrada del funnel

```mermaid
flowchart LR
    subgraph EXT[CANALES EXTERNOS · captura automática]
        C1[1 · Web<br/>+ landing pages]
        C2[2 · Portales<br/>Idealista · Habitaclia · Belbex]
        C3[3 · LinkedIn<br/>+ campañas]
        C4[4 · Formularios<br/>consultoría · advisory]
        C5[5 · Recomendación<br/>+ contacto directo]
    end

    subgraph PDB[PDB · Módulo LEADS]
        L1[6 · Captura automática<br/>anuncio · campaña · URL · fecha]
        L2[7 · Clasificación tipo<br/>Demanda / Oferta / Servicio]
        L3[8 · Cualificación<br/>actividades · llamadas]
        L4[9 · Vinculación obligatoria<br/>Cuenta y/o Contacto]
        L5{10 · Decisión}
    end

    subgraph DEST[DESTINOS · transformación]
        T1[11a · Demanda + Oportunidad<br/>tipo Demanda]
        T2[11b · Oferta + Oportunidad<br/>tipo Oferta]
        T3[11c · Solo Oportunidad Dynamics<br/>tipo Servicio]
        T4[11d · Lead Nulo<br/>15 motivos · trazabilidad]
    end

    C1 --> L1
    C2 --> L1
    C3 --> L1
    C4 --> L1
    C5 --> L1
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 -->|Lead Demanda| T1
    L5 -->|Lead Oferta| T2
    L5 -->|Lead Servicio| T3
    L5 -.->|no válido| T4

    classDef ext fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e,stroke-width:1.5px
    classDef pdb fill:#fef3c7,stroke:#92400e,color:#7c2d12,stroke-width:2px
    classDef dest fill:#dcfce7,stroke:#15803d,color:#14532d,stroke-width:1.5px
    classDef nulo fill:#fee2e2,stroke:#991b1b,color:#7f1d1d,stroke-width:1.5px
    class C1,C2,C3,C4,C5 ext
    class L1,L2,L3,L4,L5 pdb
    class T1,T2,T3 dest
    class T4 nulo
```

El módulo LEADS es **el verdadero origen del funnel**. La captura es **automática** desde múltiples canales (1–5): web corporativa, portales inmobiliarios (Idealista, Habitaclia, Belbex), LinkedIn, formularios de captación, recomendaciones, contacto directo y otros. Cada lead capturado registra automáticamente anuncio, campaña, URL, fecha y canal de origen (6). Se clasifica por tipo (7) — **Demanda**, **Oferta** o **Servicio** — y se cualifica con actividades (8). Para transformar es **obligatorio** vincular Cuenta o Contacto (9). Tras la decisión (10), el lead se transforma según su tipo (11a/b/c) o se cierra como Lead Nulo con motivo trazable (11d). Sin vinculación a Cuenta/Contacto, el lead no puede transformarse — esto evita oportunidades sin trazabilidad comercial.

---

## 1. Ciclo comercial completo (end-to-end)

```mermaid
flowchart LR
    subgraph LEAD[LEAD · Punto de entrada del funnel]
        L0[0 · LEAD<br/>captura automática<br/>web · portales · campañas]
    end

    subgraph DYN[DYNAMICS · Sistema maestro]
        D1[1 · Cuenta<br/>fuente de verdad]
        D7[7 · Oportunidad WIP<br/>handoff #1]
        D9[9 · Instrucción<br/>handoff #2 · contrato]
    end

    subgraph PDB[PDB · Sistema operativo]
        P2[2 · Activo<br/>alta + publicación]
        P3[3 · Oferta<br/>producto al mercado]
        P5[5 · Demanda<br/>perfil de búsqueda]
        P6[6 · Match<br/>Oferta ↔ Demanda]
        P8[8 · Negociación<br/>hilo condiciones]
        P10[10 · Transacción<br/>cierre + honorarios]
    end

    L0 -->|cualificación + vinculación| D1
    D1 ==>|FK CRÍTICO| P2
    P2 --> P3
    D1 -->|FK Arrendatario| P5
    P3 --> P6
    P5 --> P6
    P6 -->|handoff #1| D7
    L0 -.->|servicio · sin activo/oferta/demanda| D7
    D7 -->|sync| P8
    P8 -->|handoff #2| D9
    D9 -->|sync| P10

    classDef lead fill:#fef3c7,stroke:#92400e,color:#7c2d12,stroke-width:2px
    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    classDef critical stroke:#dc2626,stroke-width:3px,color:#fff
    class L0 lead
    class D1,D7,D9 dyn
    class P2,P3,P5,P6,P8,P10 pdb
    class D1,P2 critical
```

El ciclo arranca con el **LEAD** (0), que se captura automáticamente desde web, portales (Idealista, Habitaclia, Belbex), LinkedIn, formularios y campañas. Tras cualificarlo y vincularlo obligatoriamente a una **Cuenta** o Contacto en Dynamics (1), el flujo se bifurca según el tipo: los leads de Demanda y Oferta alimentan **Activos** (2), **Ofertas** (3), **Demandas** (5) en PDB, que machean (6) y disparan la **Oportunidad WIP** en Dynamics (7); los leads de Servicio van directos a Oportunidad sin pasar por activo/oferta/demanda. De ahí baja a **Negociación** (8), **Instrucción** (9) y se cierra como **Transacción** (10). El LEAD es el verdadero origen del funnel: ningún proceso comercial debería empezar sin él.

---

## 2. Cuentas

```mermaid
flowchart LR
    subgraph DYN[DYNAMICS]
        D1[1 · Alta Cuenta<br/>Datos fiscales + contacto]
    end

    subgraph PDB[PDB]
        P2[2 · Sync PDB<br/>Replicación lectura]
        P3[3 · Enriquecimiento<br/>Contactos + actividades]
        P4[4 · Vista 360º<br/>Activos + ofertas + histórico]
        P5a[5a · Cuenta-Propietario<br/>Activos en cartera]
        P5b[5b · Cuenta-Arrendatario<br/>Demandas + contratos]
        P5c[5c · Cuenta-Inversor<br/>Apetito + transacciones]
    end

    D1 -->|sync auto| P2
    P2 --> P3
    P3 --> P4
    P4 --> P5a
    P4 --> P5b
    P4 --> P5c

    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    classDef branch fill:#0d9488,stroke:#0f766e,color:#fff,stroke-width:2px
    class D1 dyn
    class P2,P3,P4 pdb
    class P5a,P5b,P5c branch
```

La cuenta se da de alta siempre en Dynamics (1), porque es el sistema maestro fiscal y de gobierno. El PDB recibe la sincronización (2), enriquece la cuenta con contactos y actividades (3) y construye una **vista 360º** (4). A partir de ahí, la cuenta toma uno de tres roles: **Propietario** de activos (5a), **Arrendatario** que ocupa espacios (5b) o **Inversor** que adquiere producto (5c). Una misma cuenta puede tener varios roles simultáneamente.

---

## 3. Oportunidades (WIP)

```mermaid
flowchart LR
    subgraph PDB[PDB · Sistema operativo]
        P1[1 · Match<br/>Oferta ↔ Demanda]
        P2[2 · Click<br/>Transformar en Oportunidad]
        P5[5 · Sync vuelta<br/>Oportunidad WIP en PDB lectura]
        P6[6 · Seguimiento WIP<br/>actividades + visitas]
        P7a[7a · Avanza a Negociación]
    end

    subgraph DYN[DYNAMICS · Sistema maestro]
        D3[3 · Apertura Dynamics<br/>datos preasignados]
        D4[4 · Creación Oportunidad<br/>registro maestro WIP]
        D7b[7b · Cierre Perdida<br/>motivo + lecciones]
    end

    P1 --> P2
    P2 -->|abre| D3
    D3 --> D4
    D4 -->|sync auto| P5
    P5 --> P6
    P6 --> P7a
    P6 -.->|outcome| D7b

    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    classDef result fill:#dc2626,stroke:#991b1b,color:#fff,stroke-width:2px
    class D3,D4 dyn
    class P1,P2,P5,P6,P7a pdb
    class D7b result
```

La Oportunidad **no es el origen del ciclo, es WIP intermedio**. Nace cuando hay un **match Oferta ↔ Demanda** (1) con tracción real en el PDB. El broker pulsa "Transformar en Oportunidad" (2), lo que abre Dynamics con los datos preasignados (3) para que el usuario complete y cree el registro maestro (4). Dynamics sincroniza la oportunidad de vuelta al PDB en modo lectura (5), donde el broker continúa el **seguimiento WIP** con actividades y visitas (6). El estado avanza a **Negociación** (7a) si hay tracción, o se cierra como **Perdida** en Dynamics (7b) con motivo. Es el primer cruce a Dynamics del ciclo comercial.

---

## 4. Gestión de Activo

```mermaid
flowchart LR
    subgraph DYN[DYNAMICS]
        D2[2 · Cuenta-Propietario<br/>vínculo CRÍTICO]
    end

    subgraph PDB[PDB]
        P1[1 · Alta Activo<br/>Ref + dirección + uso]
        P3[3 · Publicación<br/>Disponibilidad + fotos]
        P4[4 · Recepción Demandas<br/>Matching entrante]
        P5[5 · Visitas<br/>Agenda + reporting]
        P6[6 · Ofertas<br/>Vinculadas al activo]
    end

    P1 --> P3
    P1 ==>|FK obligatorio| D2
    D2 -.->|sync datos cuenta| P1
    P3 --> P4
    P4 --> P5
    P5 --> P6

    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    classDef critical fill:#dc2626,stroke:#991b1b,color:#fff,stroke-width:3px
    class D2 critical
    class P1,P3,P4,P5,P6 pdb
```

El alta del activo (1) es la primera operación que el broker realiza en el PDB. Antes de cualquier publicación, el activo **debe vincularse a una Cuenta-Propietario en Dynamics** (2): este FK es obligatorio y bloqueante. Una vez vinculado, el activo se publica con disponibilidad y fotos (3), recibe demandas entrantes (4), genera visitas (5) y, en su caso, ofertas (6). Toda la información heredable (titular, fiscal, contactos) se sincroniza desde la cuenta.

---

## 5. Gestión de Demanda

```mermaid
flowchart LR
    subgraph DYN[DYNAMICS]
        D1[1 · Cuenta-Arrendatario<br/>origen demanda]
    end

    subgraph PDB[PDB]
        P2[2 · Alta Demanda<br/>uso + sup + renta máx]
        P3[3 · Matching contra Ofertas<br/>cruce automático]
        P4[4 · Visitas<br/>presencial o virtual]
        P5[5 · Shortlist<br/>preselección de Ofertas]
        P6[6 · Match definitivo<br/>handoff a Oportunidad WIP]
    end

    D1 -->|FK obligatorio| P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
    P5 --> P6

    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    class D1 dyn
    class P2,P3,P4,P5,P6 pdb
```

Toda demanda parte de una **Cuenta-Arrendatario** en Dynamics (1). El broker da de alta la demanda en el PDB (2) con el perfil de búsqueda (uso, superficie, renta máxima, zona). El sistema realiza un matching automático **contra las Ofertas publicadas** (3) — no contra activos sueltos: el activo está detrás de cada oferta, pero el cruce comercial es Demanda↔Oferta. Se ejecutan visitas (4) y se construye una shortlist de ofertas (5) hasta llegar al match definitivo (6) que dispara el handoff a Oportunidad WIP.

---

## 6. Flujo de Oferta

```mermaid
flowchart LR
    subgraph PDB[PDB]
        P1[1 · Creación<br/>cuelga del Activo]
        P2[2 · Publicación<br/>activa al mercado]
        P3[3 · Recepción interés<br/>demandas que machean]
        P4[4 · Match con Demanda<br/>concreta]
        P5[5 · Handoff a Oportunidad WIP<br/>oferta lockeada]
        P6[6 · Cierre Oferta<br/>retirada del mercado]
    end

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
    P5 --> P6

    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    class P1,P2,P3,P4,P5,P6 pdb
```

La oferta es el **producto disponible al mercado**: cuelga del Activo y existe antes de que llegue la demanda concreta que la captura. Se crea (1) sobre el activo con las condiciones publicables, se activa al mercado (2) y empieza a recibir interés de demandas que machean (3). Cuando una demanda concreta selecciona la oferta (4), se ejecuta el handoff a **Oportunidad WIP** (5) y la oferta queda lockeada — ya no admite nuevas demandas. Tras la transacción (o si se retira por otro motivo), la oferta se cierra (6) y desaparece del mercado activo. La oferta es el contenedor de mercado, no el contenedor de la transacción.

---

## 7. Negociación

```mermaid
flowchart LR
    subgraph PDB[PDB]
        P1[1 · Apertura hilo<br/>desde Oportunidad WIP]
        P2[2 · Intercambio condiciones<br/>chat + adjuntos]
        P3[3 · Tabla evolutiva<br/>versiones lado a lado]
        P4[4 · Acuerdo final<br/>firma condiciones]
    end

    subgraph DYN[DYNAMICS]
        D5[5 · Handoff a Instrucción<br/>creación registro maestro]
    end

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 -->|handoff #2| D5

    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    class D5 dyn
    class P1,P2,P3,P4 pdb
```

La negociación abre un hilo formal **a partir de la Oportunidad WIP** (1) — no directamente desde la oferta. Las partes intercambian condiciones documentadas en un chat con adjuntos (2), y el PDB mantiene una tabla evolutiva con todas las versiones lado a lado (3) para trazabilidad. Cuando se alcanza el acuerdo final (4), se ejecuta el **handoff #2 a Dynamics** (5) para crear la Instrucción maestra. **No existe contrato sin Instrucción en Dynamics.**

---

## 8. Instrucción / Transacción

```mermaid
flowchart LR
    subgraph PDB[PDB]
        P1[1 · Cierre Negociación<br/>acuerdo alcanzado]
        P5[5 · Registro Transacción<br/>vista lectura PDB]
        P6[6 · Facturación honorarios<br/>cálculo + emisión]
        P7[7 · Archivo<br/>cierre operación]
    end

    subgraph DYN[DYNAMICS]
        D2[2 · Creación Instrucción<br/>registro maestro]
        D3[3 · Formalización contrato<br/>firma + legal]
        D4[4 · Sync vuelta PDB<br/>auto]
    end

    P1 -->|handoff| D2
    D2 --> D3
    D3 --> D4
    D4 -->|sync| P5
    P5 --> P6
    P6 --> P7

    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    class D2,D3,D4 dyn
    class P1,P5,P6,P7 pdb
```

El cierre de la negociación (1) lanza la creación de la **Instrucción en Dynamics** (2), donde se formaliza el contrato con el visto bueno legal (3). Una vez firmado, Dynamics sincroniza el registro de vuelta al PDB (4), que lo muestra como **Transacción** en modo lectura (5). Sobre esa transacción se calculan y emiten los **honorarios** (6) y, finalmente, se archiva la operación (7). Este es el único camino válido para registrar ingresos.

---

## 9. Actividades y seguimiento

```mermaid
flowchart LR
    subgraph PDB[PDB]
        P1a[1a · Email]
        P1b[1b · Llamada]
        P1c[1c · Reunión]
        P2[2 · Vinculación a entidad<br/>Cuenta / Oportunidad / Demanda<br/>Oferta / Activo]
        P3[3 · Tarea derivada<br/>seguimiento + responsable]
        P4[4 · Cierre actividad<br/>resultado + notas]
    end

    P1a --> P2
    P1b --> P2
    P1c --> P2
    P2 --> P3
    P3 --> P4

    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    classDef channel fill:#0d9488,stroke:#0f766e,color:#fff,stroke-width:2px
    class P1a,P1b,P1c channel
    class P2,P3,P4 pdb
```

Las actividades son **transversales**: cualquier email (1a), llamada (1b) o reunión (1c) se registra en el PDB y debe vincularse obligatoriamente a una entidad — Cuenta, Oportunidad, Demanda, Oferta o Activo (2). De esa actividad puede derivar una **Tarea** (3) con responsable y fecha límite, que se cierra al ejecutarse con resultado y notas (4). Sin vinculación a entidad, la actividad no se persiste: no existen actividades huérfanas.

---

## 10. Vencimientos

```mermaid
flowchart LR
    subgraph PDB[PDB]
        P1[1 · Detección vencimiento<br/>contrato próximo a vencer]
        P2[2 · Alerta sistema<br/>badge días restantes]
        P3[3 · Acción comercial<br/>contacto arrendatario]
        P4a[4a · Renovación<br/>nuevas condiciones]
        P4b[4b · Nueva Oportunidad<br/>relocation o nuevo tenant]
    end

    subgraph DYN[DYNAMICS]
        D5a[5a · Update contrato<br/>en Dynamics]
        D5b[5b · Alta Oportunidad<br/>en Dynamics]
    end

    P1 --> P2
    P2 --> P3
    P3 --> P4a
    P3 --> P4b
    P4a --> D5a
    P4b --> D5b

    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    classDef alert fill:#ea580c,stroke:#c2410c,color:#fff,stroke-width:2px
    class D5a,D5b dyn
    class P1,P3,P4a,P4b pdb
    class P2 alert
```

El motor de vencimientos del PDB detecta automáticamente los contratos próximos a expirar (1) y genera una alerta visible con badge de días restantes (2). El broker ejecuta la acción comercial sobre el arrendatario (3), que deriva en una **renovación** con condiciones actualizadas (4a) o en una **nueva Oportunidad** — relocation, tenant alternativo o salida (4b). Ambos resultados se reflejan en Dynamics (5a/5b) para mantener la fuente de verdad.

---

## Por qué vincular Cuentas a Activos es CRÍTICO

El vínculo **Activo → Cuenta-Propietario** no es un detalle de modelado: es la columna vertebral de todo el sistema. Saltárselo o dejarlo en blanco rompe el CRM en cadena.

- **La Cuenta es el nexo único con Dynamics.** Dynamics es la fuente de verdad fiscal, contractual y de gobierno. El PDB no inventa cuentas: las hereda. Un activo sin cuenta queda **huérfano**, sin titular real, sin contactos asociados, sin gobierno. No puede facturarse, no puede contratarse, no puede auditarse.

- **Vista 360º del Propietario.** Solo a través del vínculo se puede mostrar al equipo comercial todos los activos de un mismo propietario, sus vencimientos consolidados, las ofertas vivas en su cartera y el histórico de operaciones. Sin vínculo, el propietario aparece como una cadena de activos inconexos.

- **Inteligencia comercial en el módulo Mapas.** Los cruces que dan ventaja al broker — "qué cuentas tienen vencimientos en el eje Castellana", "qué propietarios concentran ofertas activas en Diagonal" — solo funcionan si cada activo conoce su cuenta. Sin el vínculo, el mapa pierde su capa analítica y se convierte en un visor estático.

- **Reporting y honorarios.** La facturación de honorarios depende de saber a qué cuenta pertenece cada operación. Un activo sin cuenta es una operación que no se puede liquidar contablemente y que rompe el reporting agregado por cliente.

- **Cross-selling.** El valor incremental del CRM está en detectar que el propietario del activo X también tiene los activos Y y Z, y que una operación en uno abre conversación sobre los otros. Sin vínculo, el cross-selling es invisible.

- **Riesgo operativo y calidad de dato.** Un activo sin cuenta es un fallo de calidad de dato que se propaga: contamina el matching de demandas, falsea los KPIs por propietario y obliga a limpiezas manuales costosas. La calidad del CRM se mide por el porcentaje de activos correctamente vinculados.

### Regla de oro

> **Ningún Activo sin Cuenta-Propietario.**
> **Ninguna Demanda sin Cuenta-Arrendatario.**
> **Ninguna Oferta sin ambas.**
