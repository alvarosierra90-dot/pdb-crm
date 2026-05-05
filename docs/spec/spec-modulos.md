# Spec de cambios por módulo — mayo 2026

Registro estructurado de los cambios estructurales en pestañas, campos, búsquedas y flujos. Aplica regla universal de [terminología única](./terminologia.md) y [glosario](./glosario.md).

## Reglas universales (aplican a TODOS los módulos)

1. **Menos pestañas por módulo** — consolidación general.
2. **Primera pestaña "Información general"** en oferta / demanda / negociación / propuesta / proyecto / mandato debe contener SIEMPRE en mismo orden: **Cuenta · Activo · Oportunidad · Instrucción** (cuando estén vinculados). Quitar de cualquier otra pestaña donde aparezcan.
3. **Misma terminología y mismo orden** en todos los módulos.
4. **Confidencialidad** = formato canónico Oferta. **NUNCA cambiar de formato entre módulos** (regla explícita: *"es muy confuso"*).
5. **Auditoría** ("última modificación · quién · cuándo"): badge arriba a la derecha bajo los cuadros de estado / confidencial / equipo / responsable. No como pestaña.
6. **Búsqueda de Cuenta** = barra con lupa + autocomplete sobre tabla `cuentas`. Nunca texto libre. Al asignar, autopuebla datos.
7. **Búsqueda de Activo** = lupa + autocomplete. Al asignar, autopuebla zona + subzona. Superficie NO se autopuebla hasta el stacking plan.
8. **Búsqueda de usuarios para Equipo de trabajo** = lupa con autocomplete sobre usuarios de la compañía. Nunca lista cerrada predefinida.
9. **Crear nuevo registro** = todos los campos vacíos por defecto (ningún módulo precargado).
10. **Vista 360** en TODOS los módulos: Activo · Oferta · Demanda · Propuesta · Proyecto · Mandato · Instrucción · Propietario · Arrendatario. Mismo componente compartido.

## LEAD

- Editar lead → **Vinculaciones**: barra con lupa para buscar **Cuenta** (master Dynamics).
- Al enlazar Cuenta → autopuebla el Contacto ya vinculado a esa cuenta.
- Si no hay Cuenta disponible → entrada manual de Contacto: Nombre, Apellidos, **Email o teléfono obligatorio**.
- Estado por defecto al crear: **Standby** (no "cualificado").
- Al pulsar "Transformar" → si ya está vinculado, sincroniza Cuenta + Contacto. Muestra link Dynamics para cargar info en Microsoft.
- Si "Sí, hay pitch" → permite elegir entre **Propuesta** o **Proyecto** y transforma directamente.

## PROPUESTA / PROYECTO

- **Datos del proyecto**: autopuebla con Cuenta + Contacto + económicos + fechas.
- **Asignación**: auto-asigna creador + equipo. **"Equipos y participantes" se elimina como pestaña**, se integra como cuadro debajo de Asignación.
- **Documentación**: subida y carga real de docs.
- **Trazabilidad**: línea cronológica Lead → Propuesta → (si gana) Mandato.
- En el paso de "Transformar a Mandato" (Mandato-PDB): si origen es Demanda, solo 3 campos: **Demanda alquiler · Demanda venta · Demanda alquiler / venta**.
- **Fee Savills**: hoy aparece duplicado, dejar uno solo y sincronizar auto desde Datos del proyecto.

## MANDATO

- Integrar en Información: **Equipo de trabajo** + **Activos vinculados** + **Vigencias y alertas** + **Exclusividad**.
- **Fees y honorarios** queda como pestaña independiente.
- **Documentos**: enable upload.
- **Confidencialidad**: formato canónico Oferta.

## ACTIVO

### Pestañas finales (7, de 10 hoy)
| Pestaña | Contenido |
|---|---|
| Información general | Datos básicos · Cuenta-propietario · Zona · Subzona · SBA · KPIs · "Información adicional" disuelta como sub-bloque |
| Características | Transporte · Normativa · Sostenibilidad · Características generales y por uso · Nº plazas |
| Stacking Plan | Las 3 capas (uso principal manda) · Propietarios y arrendatarios visibles aquí como capas (ya no son tab aparte) |
| Ofertas | Lista de ofertas vinculadas |
| Multimedia & Documentos | Fotos · planos · contratos · técnicos · valoraciones · informes (fusionado) |
| Vista 360 | Componente compartido |
| Confidencialidad | Formato canónico Oferta |

Eliminadas: "Propietarios y arrendatarios" (absorbida por Stacking), "Información adicional" (sub-bloque de Información general), "Follow-up" (audit badge).

### Botones top-right (bajo KPIs, junto al título)
- **Export rent-roll** (.xlsx)
- **Export ficha** (.pdf)

Mismo patrón que Oferta ("Crear ficha" PPT / PDF).

### Stacking Plan — modelo compartido
Una sola estructura de Stacking por Activo, creada al crear el Activo. Mismo componente reusado en Activo / Propietario / Arrendatario / Oferta. Solo cambia la **capa por defecto** (`initView`):

| Módulo | Capa por defecto | Qué se ve |
|---|---|---|
| Activo | `principal` (uso principal) | La capa que manda |
| Propietario | `prop` | Cuentas-propietarios por planta |
| Arrendatario | `arr` | Arrendatarios + ofertas |
| Oferta | `arr` | Igual que Arrendatario (capa contiene ambas) |

Editas desde donde editas, todo se actualiza en la única estructura del Activo padre.

## OFERTA

- Información general: Activo vinculado auto-poblado.
- **Comercialización**: si seleccionas "Mandato Savills" → cuadro con lupa para asociar mandato existente. **Quitar KYC**.
- **Equipo de trabajo**: lupa con autocomplete sobre usuarios.
- **Propietario**: sincroniza con propietario del stacking plan; blanco si no hay.
- **Imágenes**: sincronizan del activo. Borrables a nivel oferta (afecta solo a fichas comerciales). **NUNCA se borran del activo**.
- **Stacking plan**: la capa "uso principal" manda — si parte una planta en oficinas, las capas propietario / arrendatario / oferta la muestran partida en gris automáticamente. Mismo número de plantas en las 3 capas.
- **Espacios comerciales > Desglose**: añadir botón **Guardar** junto a lápiz / X. Al guardar, se refleja en stacking.
- **Pestaña "Crear ficha" desaparece**: botones PPT y PDF arriba a la derecha bajo KPIs.

## DEMANDA

- Integrar en Información: **Equipo de trabajo** + **Partes involucradas**.
- Fusionar **Requisitos + Zona de búsqueda** → "Requisitos".
- Al rellenar Requisitos → aparece botón **"Exportar a mapa"** para seleccionar alternativas.
- Fusionar **Seguimiento comercial + Ciclo 360º + Actividades** → **"Vista 360"** (mismo nombre canónico). Muestra histórico de microsites enviados, visitas, finalista.
- Quitar pestaña **Follow-up** → "última modificación" arriba a la derecha como badge (audit universal).
- Confidencialidad: formato canónico Oferta.
- Soporta **Demanda genérica** (requisitos abstractos) Y **Demanda específica** (un único Activo en alternativas — cuando alguien llama por X edificio concreto).

## ARRENDATARIO

- **Tenant (cuenta)** y **Tenant mayoritario** → renombrar a **"Arrendatario (Cuenta)"** y **"Arrendatario mayoritario"**: no texto libre, búsqueda con autocomplete sobre módulo Cuentas.
- Todos los campos **vacíos por defecto** (no precargados).
- Obligatorios con asterisco rojo, bloquean guardar:
  - Arrendatario (cuenta) **O** "Arrendatario desconocido" (uno de los dos)
  - Año de firma · Trimestre · Fecha inicio contrato · Recordatorio
- Si falta uno y se intenta guardar → reborde rojo en el campo.
- **Pestaña Stacking plan añadida**.

### Pestañas finales (6)
1. Información general
2. Condiciones económicas
3. Stacking plan
4. Alertas / break option
5. Vista 360
6. Confidencialidad

## PROPIETARIO

- "Razón social" → renombrar a **"Cuenta"**. Búsqueda con lupa sobre `cuentas`. Al asignar, autopuebla datos.
- Asignar Activo (con lupa): autopuebla zona + subzona. Superficie viene del stacking.
- Campos **vacíos por defecto** al crear nuevo.
- Obligatorios con asterisco rojo, bloquean guardar:
  - Cuenta **O** "Propietario desconocido"
  - Año de firma · Trimestre
- Si falta uno y se intenta guardar → reborde rojo en el campo.

### Pestañas finales (5)
1. Información general (Cuenta · Activos · Oportunidad · Instrucción · Año firma · Trimestre · Régimen · Histórico como sub-bloque)
2. Condiciones de inversión
3. Stacking plan
4. Vista 360
5. Confidencialidad

## PORTFOLIOS

### Modelo (cambio arquitectónico)
- **1 Portfolio = 1 Cuenta** (no 1:N).
- **Auto-generado**: cuando asignas una Cuenta como propietario en un stacking plan, se crea automáticamente un Portfolio si no existía.
- **Composición**: si esa Cuenta es propietaria en N stacking plans (N activos), su Portfolio = esos N activos.
- **No hay botón "+ Crear portfolio"** — los portfolios emergen del stacking.

### `PortfoliosList`
- Vista resumen sin botón "+ Nuevo" (filas = cuentas con stacking activo).

### Pestañas finales (`PortfolioFicha`, 6)
1. Información general (Cuenta · Activos vinculados · datos básicos)
2. Activos
3. Comercial (fusión de Ofertas + Oportunidades + Mandatos + Propuestas / Proyectos)
4. Financiero
5. Vista 360
6. Confidencialidad

## NEGOCIACIONES

### Pestañas finales (`FichaNegociacion`, 5)
| Pestaña | Contenido |
|---|---|
| Información general | Cuenta · Activo · Oportunidad · Instrucción · Demanda / Oferta de origen · KPIs · Asignación con caja Equipo de trabajo |
| Negociación | Chat con contraparte + link externo + condiciones acordadas como sub-bloque |
| Documentos contractuales | Subida real de docs |
| Vista 360 | Sustituye "Historial completo" — timeline transversal compartido |
| Confidencialidad | Formato canónico Oferta |

Eliminadas: "Equipos colaboradores" (se integra como caja debajo de Asignación), "Historial completo" (absorbido por Vista 360).

### Estados (confirmados)
En negociación · Pendiente respuesta · Acuerdo alcanzado · Firmado · Rechazado

### Origen — regla universal
Toda Negociación nace de una **Demanda**. No existe Negociación huérfana ni Negociación creada directamente desde una Oferta. Si alguien llama por un único activo concreto, se crea Demanda + se añade ese único Activo en alternativas + se transita a Finalista → Negociación.

### Cascada "Negociación → Firmado" (CRÍTICA)
Al pulsar Firmado, en cadena automática:
1. **Negociación.estado** → Firmado
2. **Oferta.estado** → Cerrada
3. **Crear Arrendatario** con datos auto-poblados de Oferta + Demanda
4. **Asignar Arrendatario al Stacking Plan** en la planta / superficie de la Oferta

Un solo botón del usuario, 4 efectos en cadena.

### Chat con link externo
Se mantiene tal cual: botón **"Enviar link"** genera link público (ej. NEG-0044) que la contraparte abre sin estar dentro del CRM.

## MAPAS, VENCIMIENTOS, CIERRE DE MANDATO

Pendientes de spec.

## TAREAS, VISITAS, CUENTAS, CONTACTOS, INTELIGENCIA, INFORMES, MARKETING, MIS CLIENTES, USUARIOS, ZONAS, NOTICIAS

Pendientes de spec.
