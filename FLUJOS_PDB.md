# Flujos PDB — Mapa de procesos

Este documento describe los 10 procesos clave del PDB CRM y su relación con Dynamics. En todos los diagramas, los nodos azules pertenecen a **Dynamics** (sistema maestro) y los nodos verdes pertenecen al **PDB** (sistema operativo del broker). El sentido de las flechas indica el flujo natural del proceso; los retornos sombreados representan la sincronización automática Dynamics → PDB.

---

## 1. Ciclo comercial completo (end-to-end)

```mermaid
flowchart LR
    subgraph DYN[DYNAMICS · Sistema maestro]
        D1[1 · Cuenta<br/>Alta fuente de verdad]
        D2[2 · Oportunidad<br/>Detección comercial]
        D8[8 · Instrucción<br/>Mandato formal]
    end

    subgraph PDB[PDB · Sistema operativo]
        P3[3 · Demanda<br/>Cualificación necesidad]
        P4[4 · Activo<br/>Producto disponible]
        P5[5 · Visita<br/>Inspección física]
        P6[6 · Oferta<br/>Propuesta económica]
        P7[7 · Negociación<br/>Hilo condiciones]
        P9[9 · Transacción<br/>Cierre + honorarios]
    end

    D1 --> D2
    D2 -->|sync| P3
    P3 --> P4
    P4 --> P5
    P5 --> P6
    P6 --> P7
    P7 -->|handoff| D8
    D8 -->|sync| P9

    P4 <-.->|vínculo Cuenta-Propietario<br/>CRÍTICO| D1

    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    classDef critical stroke:#dc2626,stroke-width:3px,color:#fff
    class D1,D2,D8 dyn
    class P3,P4,P5,P6,P7,P9 pdb
```

El ciclo arranca en Dynamics con el alta de la **Cuenta** (paso 1) y la detección de la **Oportunidad** (paso 2). Una vez sincronizada al PDB, se cualifica como **Demanda** (paso 3) y se conecta con uno o varios **Activos** (paso 4). Se ejecutan **Visitas** (5), se formaliza la **Oferta** (6) y se abre la **Negociación** (7). El acuerdo final se devuelve a Dynamics como **Instrucción** (8), y el cierre se registra como **Transacción** (9). El vínculo Activo ↔ Cuenta-Propietario atraviesa todo el ciclo: sin él, el flujo se rompe.

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

## 3. Oportunidades

```mermaid
flowchart LR
    subgraph DYN[DYNAMICS]
        D1[1 · Detección<br/>Lead u origen comercial]
        D2[2 · Cualificación<br/>BANT + score]
        D6a[6a · Cierre Ganada<br/>Transacción]
        D6b[6b · Cierre Perdida<br/>Motivo + lecciones]
    end

    subgraph PDB[PDB]
        P3[3 · Conversión a Demanda<br/>en PDB]
        P4[4 · Seguimiento<br/>Actividades + visitas]
        P5[5 · Negociación<br/>Oferta viva]
    end

    D1 --> D2
    D2 -->|sync + handoff| P3
    P3 --> P4
    P4 --> P5
    P5 -->|outcome| D6a
    P5 -->|outcome| D6b

    P3 -.->|trazabilidad<br/>bidireccional| D2
    P5 -.->|trazabilidad<br/>bidireccional| D2

    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    classDef result fill:#7c3aed,stroke:#6d28d9,color:#fff,stroke-width:2px
    class D1,D2 dyn
    class P3,P4,P5 pdb
    class D6a,D6b result
```

La oportunidad nace en Dynamics (1) y se cualifica allí (2). Cuando supera el filtro BANT, se convierte en **Demanda** dentro del PDB (3), donde el broker ejecuta el seguimiento operativo (4) y abre la negociación (5). El resultado — ganada (6a) o perdida (6b) — se registra de nuevo en Dynamics. La trazabilidad **Oportunidad ↔ Demanda ↔ Negociación** se mantiene bidireccional en todo momento para reporting y forecasting.

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
        P2[2 · Alta Demanda<br/>Uso + sup + renta máx]
        P3[3 · Matching Activos<br/>cruce automático]
        P4[4 · Visitas<br/>presencial o virtual]
        P5[5 · Shortlist<br/>preselección 3-5]
        P6[6 · Oferta<br/>sobre activo final]
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

Toda demanda parte de una **Cuenta-Arrendatario** en Dynamics (1). El broker da de alta la demanda en el PDB (2) con el perfil de búsqueda (uso, superficie, renta máxima, zona). El sistema realiza un matching automático contra los activos disponibles (3), se ejecutan visitas (4) y se construye una shortlist (5) que culmina en una oferta concreta (6) sobre el activo seleccionado.

---

## 6. Flujo de Oferta

```mermaid
flowchart LR
    subgraph PDB[PDB]
        P1[1 · Creación<br/>Activo + Demanda + condiciones]
        P2[2 · Envío<br/>al propietario]
        P3[3 · Respuesta<br/>aceptada / contrapropuesta / rechazada]
        P4[4 · Apertura Negociación<br/>hilo formal]
        P5[5 · Versionado docs<br/>borradores + diff]
        P6[6 · Cierre<br/>acuerdo o ruptura]
    end

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
    P5 --> P6

    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    class P1,P2,P3,P4,P5,P6 pdb
```

La oferta vive íntegramente dentro del PDB. Se crea (1) vinculando un activo y una demanda, con las condiciones económicas. Se envía al propietario (2) y se registra su respuesta (3): aceptación, contrapropuesta o rechazo. Si avanza, se abre formalmente la **Negociación** (4) y se gestiona el versionado de borradores (5) hasta el cierre (6), positivo o negativo. La oferta es siempre el contenedor económico previo a la negociación.

---

## 7. Negociación

```mermaid
flowchart LR
    subgraph PDB[PDB]
        P1[1 · Apertura hilo<br/>desde Oferta aceptada<br/>como base]
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
    P4 -->|handoff| D5

    classDef dyn fill:#1e40af,stroke:#1e3a8a,color:#fff,stroke-width:2px
    classDef pdb fill:#15803d,stroke:#14532d,color:#fff,stroke-width:2px
    class D5 dyn
    class P1,P2,P3,P4 pdb
```

La negociación abre un hilo formal a partir de la oferta aceptada como base (1). Las partes intercambian condiciones documentadas en un chat con adjuntos (2), y el PDB mantiene una tabla evolutiva con todas las versiones lado a lado (3) para trazabilidad. Cuando se alcanza el acuerdo final (4), se ejecuta el handoff a Dynamics (5) para crear la Instrucción maestra. **No existe contrato sin Instrucción en Dynamics.**

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
