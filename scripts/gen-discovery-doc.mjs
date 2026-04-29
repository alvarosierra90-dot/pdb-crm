// Genera un .docx con todas las preguntas del discovery PDB,
// indicando las que ya has respondido y las pendientes.
//
// Uso: node scripts/gen-discovery-doc.mjs

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { writeFileSync } from 'node:fs'

// ───── helpers ─────
const H1 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 480, after: 240 },
  children: [new TextRun({ text: t, bold: true, size: 36, color: '0F172A' })],
})
const H2 = (t, color = '1E40AF') => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 360, after: 180 },
  children: [new TextRun({ text: t, bold: true, size: 28, color })],
})
const H3 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text: t, bold: true, size: 22, color: '0F172A' })],
})
const P = (t, opts = {}) => new Paragraph({
  spacing: { before: 0, after: 120 },
  children: [new TextRun({ text: t, ...opts })],
})
const Italic = (t) => new Paragraph({
  spacing: { before: 0, after: 120 },
  children: [new TextRun({ text: t, italics: true, color: '475569' })],
})
const Bullet = (t, level = 0) => new Paragraph({
  bullet: { level },
  spacing: { before: 0, after: 60 },
  children: [new TextRun(t)],
})
const SubQ = (label, text) => new Paragraph({
  spacing: { before: 60, after: 80 },
  indent: { left: 360 },
  children: [
    new TextRun({ text: label + ' ', bold: true, color: '1E40AF' }),
    new TextRun({ text }),
  ],
})
const Resp = (text) => new Paragraph({
  spacing: { before: 60, after: 60 },
  indent: { left: 720 },
  shading: { type: 'clear', fill: 'DCFCE7' },
  children: [
    new TextRun({ text: '✓ Respondido — ', bold: true, color: '15803D', size: 20 }),
    new TextRun({ text, italics: true, size: 20 }),
  ],
})
const Pending = () => new Paragraph({
  spacing: { before: 60, after: 200 },
  indent: { left: 720 },
  shading: { type: 'clear', fill: 'FEF3C7' },
  children: [
    new TextRun({ text: '⏳ Pendiente — escribe aquí tu respuesta…', bold: true, italics: true, color: 'B45309', size: 20 }),
  ],
})
const Note = (t) => new Paragraph({
  spacing: { before: 60, after: 240 },
  indent: { left: 720 },
  shading: { type: 'clear', fill: 'EFF6FF' },
  children: [
    new TextRun({ text: '💡 ' + t, italics: true, color: '1E40AF', size: 18 }),
  ],
})
const Spacer = () => new Paragraph({ spacing: { before: 0, after: 200 }, children: [new TextRun('')] })

// ───── contenido ─────
const children = []
const add = (...items) => children.push(...items)

// PORTADA
add(
  H1('PDB · Documento de Discovery completo'),
  Italic('Sesión Q&A · 30/04/2026 · Property Database Savills'),
  Spacer(),
  P('Este documento recopila todas las preguntas del proceso de descubrimiento estructurado del sistema PDB, agrupadas por bloques temáticos. Cada pregunta incluye:'),
  Bullet('✓ Las preguntas que ya has respondido, con un resumen de tu respuesta confirmada.'),
  Bullet('⏳ Las preguntas pendientes con espacio para que las completes y resolvamos toda la spec.'),
  Spacer(),
  P('Si en alguna pregunta respondida quieres matizar o cambiar algo, escribe debajo del bloque verde y lo recogemos en la próxima iteración.', { italics: true }),
  Spacer(), Spacer(),
)

// ═══════════════════════════════════════════════════════════
// BLOQUE 1
// ═══════════════════════════════════════════════════════════
add(H1('Bloque 1 — Lead → Cualificación → Mandato'))

add(H2('Pregunta 1 — Captura del Lead'))
add(P('Cuando entra un Lead (web, Idealista, LinkedIn, recomendación, contacto frío…):'))
add(SubQ('a)', '¿Quién recibe el lead y cómo se asigna al equipo?'))
add(SubQ('b)', '¿Qué decide el equipo y el responsable inicial: el canal, la tipología, la zona, una combinación?'))
add(SubQ('c)', '¿Hay leads que se descartan automáticamente o todos pasan por revisión humana?'))
add(Resp('El canal decide automáticamente la asignación al equipo (canal + tipología + zona). Después un coordinador puede reasignar. Ningún lead se descarta automáticamente — siempre lo evalúa una persona.'))

add(H2('Pregunta 2 — Asignación dentro del equipo'))
add(SubQ('a)', '¿Hay un coordinador por equipo, uno global, o ambos?'))
add(SubQ('b)', '¿El lead tiene estado "Pendiente de asignación" que solo ve el coordinador, o todos los brokers pueden cogerlo?'))
add(SubQ('c)', '¿Puede un mismo lead trabajarlo más de un broker?'))
add(SubQ('d)', '¿Hay notificaciones cuando el broker recibe un lead?'))
add(Resp('Un coordinador por equipo. Estado "Pendiente de asignación" solo lo ve el coordinador (sin esto habría caos). Un mismo lead puede trabajarlo varios brokers, incluso de equipos distintos = "equipo de trabajo". El módulo de Paneles está pendiente de crear: notificaciones de tareas, demandas, leads asignados.'))

add(H2('Pregunta 3 — Equipo de trabajo del Lead'))
add(SubQ('a)', '¿Hay roles diferenciados (Principal/Soporte/Colaborador) o todos iguales?'))
add(SubQ('b)', '¿Puede haber varios Principales? ¿Quién los asigna y quién puede cambiarlos?'))
add(SubQ('c)', '¿Quién puede editar el lead?'))
add(SubQ('d)', '¿Quién decide cualificar o marcar Lead Nulo?'))
add(SubQ('e)', '¿El equipo de trabajo se hereda automáticamente a Oportunidad/Demanda/Oferta/Mandato?'))
add(Resp('Hay roles. Pueden ser varios Principales, los asigna el coordinador. Solo Principales pueden añadir/quitar miembros (Soporte no). Edición ficha: solo Principales + Manager del equipo (siempre tiene permiso). Cualificar/Nulo: solo el Principal asignado. El equipo se hereda automáticamente.'))

add(H2('Pregunta 4 — Gate de cualificación'))
add(SubQ('a)', '¿Hay datos extra obligatorios para cualificar más allá de Cuenta + Contacto + Pitch + Tipo?'))
add(SubQ('b)', '¿Cuenta basta o el Contacto es siempre obligatorio?'))
add(SubQ('c)', '¿Validación contra duplicados antes de cualificar?'))
add(SubQ('d)', '¿Aprobación del coordinador antes de transformar?'))
add(SubQ('e)', '¿Sync con Dynamics es real-time o batch?'))
add(Resp('La lógica de bloqueos actual está bien. Contacto SIEMPRE obligatorio. Validación de duplicados clave (avisa pero permite seguir). Principal puede transformar directamente sin aprobación. Sync inmediato real-time.'))

add(H2('Pregunta 5 — Ciclo de la Propuesta (rama pitch=Sí)'))
add(SubQ('a)', '¿Sub-estados que necesitas en la Propuesta?'))
add(SubQ('b)', '¿Versiones de Propuesta o una sola con histórico?'))
add(SubQ('c)', '¿Qué pasa cuando Propuesta se marca Ganada?'))
add(SubQ('d)', '¿Hay aprendizaje a registrar al perder?'))
add(SubQ('e)', '¿Equipo de elaboración distinto al equipo de Lead/Mandato?'))
add(Resp('Estados: borrador → presentada → standby → ganada/perdida/cancelada. Una sola Propuesta con histórico. Al ganar: genera Instrucción en Dynamics y se transforma en Mandato con esa Instrucción asociada. Motivo de pérdida obligatorio. Pueden intervenir varios equipos.'))

add(H2('Pregunta 6 — Cascada Propuesta Ganada y rama no-pitch'))
add(SubQ('a)', '¿La cadena Propuesta Ganada → Instrucción → Mandato es automática total, semi-automática o manual?'))
add(SubQ('b)', '¿Y en la rama no-pitch (sin Propuesta), cuándo y cómo se crea el Mandato?'))
add(Resp('Semi-automática: pulsas Marcar Ganada → modal abre Dynamics → broker completa Instrucción → al volver, sistema crea Mandato linked → broker completa fees, vigencia. En no-pitch: Oportunidad + Demanda/Oferta primero, Mandato lo crea manualmente el broker después cuando tiene la firma.'))

add(H2('Pregunta 7 — Anatomía del Mandato'))
add(SubQ('a)', 'Tipo del Mandato: ¿sell/buy con sub-tipos o categorías directas?'))
add(SubQ('b)', '¿Multi-activo permitido o siempre un activo único?'))
add(SubQ('c)', '¿Exclusiva, co-exclusiva, no exclusiva? ¿Co-exclusiva con qué datos del agente externo?'))
add(SubQ('d)', '¿Vigencia, alertas, prórrogas, cierre auto al vencer?'))
add(SubQ('e)', '¿Cancelación con motivo desplegable?'))
add(SubQ('f)', '¿Fees: solo % o más estructuras (fijo, mínimo, sliding, compartido)?'))
add(Resp('4 tipos: Alquiler, Venta, Demanda, Consultoría. Multi-activo permitido. Exclusiva o co-exclusiva (con cuenta-agente + contacto). Alertas 30/60/90 días. Prórrogas manuales. Cierre auto al vencer + Ofertas se retiran. Cancelación con motivo. Fees: %, € fijo, mínimo, sliding, compartido — todos.'))

add(H2('Pregunta 8 — Mandato ↔ Demanda/Oferta'))
add(SubQ('a)', '¿Quién crea Demanda u Oferta(s) tras firmar Mandato?'))
add(SubQ('b)', 'Multi-activo en Mandato Sell: ¿N Ofertas independientes o 1 Oferta multi-activo?'))
add(SubQ('c)', 'Mandato Consultoría: ¿genera entidad operativa propia?'))
add(SubQ('d)', 'Mandato Demanda multi-cliente (cliente busca varios espacios): ¿1 Mandato + N Demandas o N Mandatos?'))
add(Resp('La crea el responsable del Mandato. Multi-activo = N Ofertas independientes con FK al mismo Mandato (clickable desde Oferta para ver Mandato). Consultoría sin entidad operativa específica. Multi-cliente = 1 Mandato con N Demandas vinculadas.'))

// ═══════════════════════════════════════════════════════════
// BLOQUE 2
// ═══════════════════════════════════════════════════════════
add(H1('Bloque 2 — Demanda → Cierre + Activo + Vencimientos'))

add(H2('Pregunta 9 — Matching de Demanda contra pool de Ofertas'))
add(SubQ('a)', '¿Pool a cruzar incluye Ofertas externas o solo Savills?'))
add(SubQ('b)', '¿Sistema sugiere automático, broker manual, o combinado?'))
add(SubQ('c)', '¿Cómo gestionar Ofertas confidenciales en matching?'))
add(SubQ('d)', '¿Quién puede añadir Alternativas?'))
add(SubQ('e)', '¿Snapshot solo de condiciones negociadas o más?'))
add(SubQ('f)', '¿Cómo se gestiona cross-equipo (broker A con oferta de equipo B)?'))
add(Resp('Pool = TODAS las ofertas (una oferta es disponibilidad; la exclusividad la hereda del Mandato). Sistema sugiere automáticamente, broker añade/quita libremente. Confidencial: necesita autorización del responsable de la oferta. Solo Principal de la Demanda añade Alternativas. Snapshot solo condiciones negociadas. Cross-equipo libre.'))

add(H2('Pregunta 10 — Envío al cliente y Visitas'))
add(SubQ('a)', '¿Email automático, PDF descargable, portal cliente externo, o combinación?'))
add(SubQ('b)', '¿Qué datos se registran de cada envío?'))
add(SubQ('c)', '¿Cómo se programan las visitas? ¿Sync con calendarios?'))
add(SubQ('d)', '¿Datos de visita: resultado, motivos?'))
add(SubQ('e)', '¿La Negociación se abre solo desde Visita o también sin ella?'))
add(Resp('Link a microsite con mapa interactivo (clic en activo → condiciones, fotos, planos, stacking) + PDF descargable. Cada envío queda registrado en la Demanda. Si cambian requisitos → nueva selección, ambas coexisten. Visitas se programan desde Demanda → quedan registradas en Demanda + Oferta + Activo (trazabilidad triple). Tras visita positiva el sistema pregunta auto "¿abrir negociación?". Negociación también puede abrirse sin visita.'))

add(H2('Pregunta 11 — Negociación'))
add(SubQ('a)', '¿Quién participa en la Negociación?'))
add(SubQ('b)', '¿Estados de la Negociación?'))
add(SubQ('c)', '¿Cómo se gestionan las condiciones evolutivas (chat por rondas)?'))
add(SubQ('d)', '¿Documentos versionados — quién sube, quién edita, quién acepta?'))
add(SubQ('e)', '¿Confidencialidad de los datos sensibles de la Negociación?'))
add(SubQ('f)', '¿Cascada al Cierre Concedido?'))
add(SubQ('g)', '¿Cierre Perdido con motivo?'))
add(Resp('Empieza el equipo de la Demanda enviando oferta inicial → otra parte hace contraoferta o asume → se añade la cuenta propietaria. Estados: Activo, Standby, Pendiente Contestación, Cancelada. Condiciones acordadas finales sí. Borrador de contrato lo sube SIEMPRE el arrendador, el arrendatario hace cambios, el arrendador acepta o rechaza. Solo Manager y Principales ven precios y fees. Al ganar: Negociación → Instrucción cerrada en Dynamics. Vas al Stacking, quitas la planta de la Oferta y la transformas en Arrendatario, los m² salen de la disponibilidad. Cierre Perdido con motivo confirmado.'))

add(H2('Pregunta 12 — Activo: creación, propiedad, Stacking Plan'))
add(SubQ('a)', '¿Origen del Activo: catálogo, Mandato Sell, ambos?'))
add(SubQ('b)', '¿Propietario único, múltiples co-propietarios, sin propietario?'))
add(SubQ('c)', '¿Cambio de propiedad: nuevo Activo o histórico en el mismo?'))
add(SubQ('d)', '¿Activo siempre en Portfolio o puede estar suelto?'))
add(SubQ('e)', '¿Stacking Plan estructura física (multi-edificio, multi-planta, espacios)?'))
add(SubQ('f)', '¿Estados de planta/espacio?'))
add(SubQ('g)', '¿Cómo se cargan arrendatarios actuales?'))
add(SubQ('h)', '¿Multi-uso del Activo (oficinas + retail + parking)?'))
add(Resp('Catálogo + Mandato Sell mixto. Propietario único (siempre). Cambio de propiedad: mismo Activo + histórico en pestañas Arrendatarios y Propietarios. Portfolio = derivado de Cuenta+Activos vinculados (no entidad separada). Activos parque empresarial = 1 solo Activo (no 5 separados). Stacking Plan tiene 3 capas: Propietarios, Uso Principal, Arrendatarios+Ofertas. Drag & drop. Arrendatarios se pueden crear desde Stacking o desde módulo Arrendatarios pero siempre rellenas la ficha completa primero. Ofertas siempre desde el módulo Ofertas. Multi-uso se asigna en la capa Uso Principal del Stacking.'))

add(H2('Pregunta 13 — Vencimientos del rent roll'))
add(SubQ('a)', '¿Punto de aviso (12 meses, break options)?'))
add(SubQ('b)', '¿Quién recibe la alerta?'))
add(SubQ('c)', '¿Qué hace el sistema: crea Lead, Oportunidad, te pregunta, no hace nada?'))
add(SubQ('d)', '¿Renovación, reposicionamiento, recolocación del cliente?'))
add(SubQ('e)', '¿Vencimientos del catálogo de mercado se trackean también?'))
add(SubQ('f)', '¿Trazabilidad histórica de renovaciones y rentas?'))
add(Resp('Renovación: NO Negociación nueva. Solo entras al Arrendatario y cambias fechas (cuándo renovó, cuánto le queda). Si quiere otro espacio: nueva Demanda → si firma otro, desasignar del activo viejo (queda en histórico) + asignar al nuevo. Vencimientos del mercado: se ven TODOS, también operaciones que no llevemos nosotros, para inteligencia de mercado. Trazabilidad histórica completa sí.'))

// ═══════════════════════════════════════════════════════════
// BLOQUE 3
// ═══════════════════════════════════════════════════════════
add(H1('Bloque 3 — Capa transversal: Vista 360°, Tareas, Permisos, Sync'))

add(H2('Pregunta 14 — Vistas 360°'))
add(SubQ('a-c)', '¿Bloques de Vista 360° de Cuenta, Activo y Demanda?'))
add(SubQ('d)', '¿Acceso: pestaña, página separada, sidebar lateral?'))
add(SubQ('e)', '¿Solo lectura o permite acciones rápidas?'))
add(SubQ('f)', '¿KPIs agregados críticos?'))
add(Resp('Bloques propuestos correctos. Vista 360° del Activo: incluir TAMBIÉN ofertas activas que no lleva Savills (otra agencia o propiedad directa) — visión completa del mercado. Sidebar lateral siempre visible. Cliclable a detalle (resumen + profundización al ir).'))

add(H2('Pregunta 15 — Tareas, Actividades y Notificaciones'))
add(SubQ('a)', '¿Diferencia Actividad vs Tarea?'))
add(SubQ('b)', '¿Origen: integración email/llamadas, manual, automáticas?'))
add(SubQ('c)', '¿Cada Actividad/Tarea se vincula a 1 o N entidades?'))
add(SubQ('d)', '¿Quién asigna y reasigna tareas?'))
add(SubQ('e)', '¿Estados de Tarea?'))
add(SubQ('f)', '¿Recordatorios y tareas recurrentes?'))
add(SubQ('g)', '¿Bloques imprescindibles del panel home del usuario?'))
add(SubQ('h)', '¿Notificaciones push/email/in-app?'))
add(Resp('Completar tarea → genera Actividad. Integración Outlook futura + app móvil para llamadas. Tareas automáticas existen. Actividad/Tarea cuelga de UNA Cuenta concreta (cuentas son el hub). Creador asigna libremente, manager reasigna/edita. Estado adicional: Reasignada. Recordatorios + recurrentes ambas. Bloques home correctos. Notificaciones solo en panel in-app, tiempo real. Solo Principal recibe notificación. Tarea vencida avisa Principal + Manager. Diferenciar urgente.'))

add(H2('Pregunta 16 — Permisos por rol y visibilidad'))
add(SubQ('a)', '¿Qué ve un broker de equipo A sobre el equipo B?'))
add(SubQ('b)', '¿Roles directivos (Director Madrid, Country Manager, Global)?'))
add(SubQ('c)', '¿Roles funcionales (Property Mgmt, Capital Markets, Research, Marketing, Legal)?'))
add(SubQ('d)', '¿System Admin?'))
add(SubQ('e)', '¿Confidencialidad — alcance e implementación?'))
add(SubQ('f)', '¿Solicitud de acceso a confidencial?'))
add(Resp('Cross-equipo: ve TODO excepto confidencial. Sin asignación, no edita. Directores: permisos completos solo en SU área. Manager General futuro cross-area. Capital Markets es transaccional, no transversal. Research ve todo y edita datos validados. System admin existirá. Confidencialidad funciona igual en todas las entidades. Solicitud de acceso formal: hasta que Principal/Manager autorice, no se ve nada.'))

add(H2('Pregunta 17 — Sync Dynamics + Cuentas/Contactos + Entidades Legales'))
add(SubQ('a)', '¿Mecánica del sync (real-time, batch, pull-on-read)?'))
add(SubQ('b)', '¿Cambios en Dynamics propagados a TODOS los registros vinculados?'))
add(SubQ('c)', '¿Borrado/desactivación de cuenta en Dynamics: qué pasa con sus registros en PDB?'))
add(SubQ('d)', '¿Merge de cuentas duplicadas en Dynamics?'))
add(SubQ('e)', '¿Crear cuenta/contacto desde PDB: API nativa o handoff a Dynamics?'))
add(SubQ('f)', '¿Contactos vinculados a múltiples cuentas?'))
add(SubQ('g)', '¿Validación duplicados al cualificar Lead?'))
add(SubQ('h)', '¿Cuentas matriz vs Entidades Legales?'))
add(Resp('Real-time event-driven (no batch). Cualquier cambio Dynamics se refleja en TODOS los registros (no histórico congelado). Desactivación: histórico siempre visible, sin bloqueo automático, broker decide. Merge: aviso previo + redirección automática de FKs. Crear cuenta: botón obliga a Dynamics externo (NO API nativa). Contacto puede pertenecer a múltiples cuentas. Validación duplicados con aviso (no bloqueo) si cuenta similar / demanda activa / contacto coincide. Entidades Legales = filiales fiscales con CIF/NIF cuelgan de Cuenta Matriz. Activos NUNCA a Entidades Legales (siempre a Matriz). Facturación contra Entidad Legal pero gestión comercial en Matriz.'))

// ═══════════════════════════════════════════════════════════
// BLOQUE 4
// ═══════════════════════════════════════════════════════════
add(H1('Bloque 4 — Reporting + Mapas + Research'))

add(H2('Pregunta 18 — Dashboards, KPIs, Forecasting, Exports'))
add(SubQ('a)', '¿Dashboard del Broker: qué bloques?'))
add(SubQ('b)', '¿Dashboard del Manager: qué bloques?'))
add(SubQ('c)', '¿Dashboard del Director: qué nivel de segmentación?'))
add(SubQ('d)', '¿Reportes ejecutivos (mensual/trimestral, cliente, mercado)?'))
add(SubQ('e)', '¿Exports y plantillas (Excel, PDF, PowerPoint, otros)?'))
add(SubQ('f)', '¿Forecasting ponderado por probabilidad?'))
add(SubQ('g)', '¿Cuentas/Contactos dormant?'))
add(SubQ('h)', '¿Cierre fiscal anual?'))
add(Resp('Broker: KPIs personales completos + ranking equipo + pipeline funnel completo (Lead → Cualificado → Demanda → Negociación → Cerrada) con cantidad y valor económico. Manager: estado equipo, carga por broker, pipeline agregado, fees vs objetivo, vencimientos rent roll, mandatos vivos, alertas. Director: TODAS las delegaciones (Madrid, BCN, Málaga, Valencia, Sevilla…). Segmentable por línea de negocio (Leasing, Capital Markets, Consultoría, Arq, PM…) y por tipología (Oficinas, Logístico, Retail, Living, Hoteles, Industrial). Sin "fees vs objetivo" como bloque principal. Reportes los generan los Managers. Exports: Excel rent roll, PDF ficha + microsite, PPT propuesta, Excel pipeline, informe mercado PDF+PPT. Forecasting ponderado, % manual del broker. Dormant: alertas + tareas auto follow-up. Cierre fiscal con reporte + reset objetivos + revisión pipeline.'))

add(H2('Pregunta 19 — Mapas + Microsite + Research'))
add(SubQ('a)', '¿Capas de mapa, dónde embeber, datos sobre el mapa?'))
add(SubQ('b)', '¿Microsite: acceso, interacción cliente, branding, tracking, versionado?'))
add(SubQ('c)', '¿Research: origen datos, outputs, permisos especiales, automatización?'))
add(Resp('Mapas: capas Ofertas, Activos, Demandas, Vencimientos, Transacciones. Embebido en Vista 360 Cuenta, ficha Activo, ficha Demanda (heatmap zonas), microsite. Críticas: transporte (Transit), POIs (Places), comparables, take-up, yield medio. Secundario: INE para Retail/Living. Microsite: link público sin login + PDF + acciones (interesa/descartar/visita) + comentarios + tracking completo + branding Savills+cliente + versiones coexisten. Research: ingesta multi-fuente (interno + INE + Catastro + portales + investigación + datos consultores). Outputs: informe mercado, Capital Markets, Leasing, comparables 6m. Permisos especiales para editar precios reales/rentas reales/datos validados. Solicita cualquier broker/manager (sin tickets). Informes automáticos en tiempo real con templates.'))

// ═══════════════════════════════════════════════════════════
// BLOQUE 5 - PENDIENTES
// ═══════════════════════════════════════════════════════════
add(H1('Bloque 5 — Pendientes (por resolver)'))
add(P('A partir de aquí están las preguntas que aún no se han abordado. Rellena debajo de cada bloque amarillo y lo recogemos.'))
add(Spacer())

add(H2('Pregunta 20 — Confidencialidad: workflow de solicitud y autorización', 'B45309'))
add(SubQ('a)', '¿Quién enciende la confidencialidad (Principal manual, automática por VIP/discreción)? ¿Lista inicial de autorizados (Principal+Manager+equipo o solo Principal)?'))
add(SubQ('b)', '¿Quién no ve nada cuando está confidencial? ¿La entidad aparece en listados con candado o desaparece? ¿Directores y Research siempre ven o también necesitan autorización?'))
add(SubQ('c)', '¿Mecánica de solicitar acceso (modal con motivo)? ¿Quién recibe la solicitud (Principal, Manager, ambos)?'))
add(SubQ('d)', '¿Aprobación con un click? ¿Caducidad temporal? ¿Granular (solo lectura vs lectura+edición)?'))
add(SubQ('e)', '¿Log de accesos (quién vio cuándo)? ¿Quién consulta el log? ¿Pestaña visible?'))
add(SubQ('f)', '¿Revocar acceso? ¿Caduca al cambiar de equipo o salir de Savills?'))
add(SubQ('g)', '¿Confidencialidad parcial (ej. precio confidencial pero resto visible) o siempre todo?'))
add(SubQ('h)', '¿Eventos automáticos que activan confidencialidad (operación > X €, NDA firmado)?'))
add(Pending())

add(H2('Pregunta 21 — Audit log y trazabilidad de cambios', 'B45309'))
add(SubQ('a)', '¿Histórico de cambios de cualquier entidad (quién cambió qué, cuándo, valor anterior vs nuevo)?'))
add(SubQ('b)', '¿Inmutable (no se puede borrar) o editable?'))
add(SubQ('c)', '¿Quién accede al audit (broker, manager, director, compliance, sólo system admin)?'))
add(SubQ('d)', '¿Se ve dentro de la propia entidad como pestaña "Histórico" o solo en panel admin separado?'))
add(SubQ('e)', '¿Exportable para auditoría legal (PDF, CSV)?'))
add(SubQ('f)', '¿Tiempo de retención (siempre, X años)?'))
add(Pending())

add(H2('Pregunta 22 — Onboarding inicial y migración de datos', 'B45309'))
add(SubQ('a)', '¿Cómo se importa el portfolio existente Savills al sistema en el lanzamiento? (Excel masivo, CSV de Dynamics, manual)'))
add(SubQ('b)', '¿Qué entidades se migran inicialmente: Activos, Arrendatarios, Rent Roll, Mandatos vigentes, operaciones cerradas históricas?'))
add(SubQ('c)', '¿Cuentas y Contactos: ¿migración inicial desde Dynamics (snapshot) o conexión live desde día 1?'))
add(SubQ('d)', '¿Periodo histórico a migrar (último año, últimos 3 años, todo)?'))
add(SubQ('e)', '¿Cómo se gestionan los datos sucios o duplicados durante la migración?'))
add(SubQ('f)', '¿Rollout (todos los equipos a la vez o piloto en un equipo primero)?'))
add(Pending())

add(H2('Pregunta 23 — Mobile app', 'B45309'))
add(SubQ('a)', '¿Funcionalidad mínima imprescindible (consulta, llamadas, registro de visitas in-situ)?'))
add(SubQ('b)', '¿Notificaciones push?'))
add(SubQ('c)', '¿Modo offline (visitas en zonas sin cobertura)?'))
add(SubQ('d)', '¿Captura de fotos in-situ del activo durante visitas?'))
add(SubQ('e)', '¿Autenticación: biometría / SSO corporativo Savills?'))
add(Pending())

add(H2('Pregunta 24 — Integración Outlook + email + calendario', 'B45309'))
add(SubQ('a)', '¿Sync de calendarios Outlook con visitas programadas?'))
add(SubQ('b)', '¿Auto-loguear emails enviados/recibidos a contactos identificados?'))
add(SubQ('c)', '¿Plantillas de email del PDB que abren Outlook con contenido pre-rellenado?'))
add(SubQ('d)', '¿Integración con Teams para reuniones programadas?'))
add(SubQ('e)', '¿Sync con OneDrive/SharePoint para documentos?'))
add(Pending())

add(H2('Pregunta 25 — Edge cases en transformaciones', 'B45309'))
add(SubQ('a)', '¿Cambio de tipo de Lead durante cualificación (ej. era Demanda y resulta ser Servicio)?'))
add(SubQ('b)', '¿Cambio Demanda → Oferta o viceversa cuando el cliente cambia de estrategia?'))
add(SubQ('c)', '¿Rollback de transformaciones (deshacer una transformación errónea)?'))
add(SubQ('d)', '¿Clones de Demandas (cliente con dos buscas similares en zonas distintas)?'))
add(SubQ('e)', '¿Pitch perdido que el cliente quiere reabrir directamente sin pitch (rama no-pitch)?'))
add(Pending())

add(H2('Pregunta 26 — Versionado de documentos y plantillas internas', 'B45309'))
add(SubQ('a)', '¿Borradores de contrato versionados (ya cubierto en Negociación)?'))
add(SubQ('b)', '¿Plantillas internas de Propuesta, Mandato, Carta de intenciones, NDA?'))
add(SubQ('c)', '¿Documentación legal centralizada (NDAs firmados, mandatos firmados)?'))
add(SubQ('d)', '¿Firmas electrónicas integradas (DocuSign, Adobe Sign)?'))
add(SubQ('e)', '¿Sistema de aprobación interno antes de enviar al cliente?'))
add(Pending())

add(H2('Pregunta 27 — Internacionalización', 'B45309'))
add(SubQ('a)', '¿Idiomas necesarios (ES, EN al menos)?'))
add(SubQ('b)', '¿Multi-divisa (€, $, £, AED)?'))
add(SubQ('c)', '¿Multi-país (procesos legales españoles vs UK vs ME diferentes)?'))
add(SubQ('d)', '¿Si el sistema escala fuera España, ¿qué se replica vs qué es España-específico?'))
add(Pending())

add(H2('Pregunta 28 — Módulos adicionales no cubiertos', 'B45309'))
add(P('Estos módulos existen en el prototipo actual pero no los hemos discutido en detalle:'))
add(SubQ('a)', 'Inteligencia Comercial: ¿qué incluye exactamente? ¿Cómo se diferencia de Research?'))
add(SubQ('b)', 'Marketing: ¿gestión de campañas, listings publicados, content para web Savills?'))
add(SubQ('c)', 'Mis Clientes: ¿vista personal de cuentas asignadas al broker?'))
add(SubQ('d)', 'Noticias: ¿alertas de mercado, news scraping, comunicaciones internas?'))
add(SubQ('e)', 'Presentaciones: ¿gestión de presentaciones comerciales? ¿Diferencia con Propuestas?'))
add(SubQ('f)', '¿Algún otro módulo que falte en el sistema (ej. Compliance, KYC, Anti-money-laundering)?'))
add(Pending())

add(Spacer(), Spacer())
add(P('Fin del documento. Cuando hayas rellenado las pendientes, las recogemos y actualizamos el modelo.', { italics: true, color: '475569' }))

// ───── construir documento ─────
const doc = new Document({
  creator: 'PDB Discovery',
  title: 'PDB Discovery - Documento completo',
  description: 'Spec operativa Property Database Savills',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children,
  }],
})

const buf = await Packer.toBuffer(doc)
const out = 'PDB-Discovery.docx'
writeFileSync(out, buf)
console.log(`✓ Documento generado: ${out}`)
