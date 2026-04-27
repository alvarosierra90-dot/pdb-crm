// PDB · Mapa de Procesos — Generador del PPT (v2 · diseño profesional)
//
// Reemplaza la versión anterior con una estética más sobria:
//   · Slide master con header + footer + numeración
//   · Tipografía Calibri en pesos 300/400/600/700 (jerarquía clara)
//   · Paleta corporativa neutra (azul oscuro · azul medio · verde · ámbar · rojo · grises)
//   · Sin emojis en los diagramas (solo texto + iconos vectoriales/símbolos)
//   · Cards con sombra suave, esquinas 6pt, líneas finas
//   · Mucho espacio en blanco — un mensaje por slide
//
// Uso:  node scripts/generate_flujos_ppt.mjs
// Genera FLUJOS_PDB.pptx en la raíz del repo.

import PptxGenJS from 'pptxgenjs'

const prs = new PptxGenJS()
prs.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 inches (16:9)
prs.title  = 'PDB CRM · Mapa de Procesos'
prs.author = 'Savills · PDB Team'
prs.company = 'Savills'

// ── Paleta corporativa ────────────────────────────────────────────────────
const C = {
  ink:       '0F172A',  // texto principal
  ink2:      '334155',  // texto secundario
  muted:     '64748B',  // texto auxiliar
  hint:      '94A3B8',  // pie / metadatos
  bg:        'F8FAFC',  // fondo slide
  surface:   'FFFFFF',  // tarjetas
  border:    'E2E8F0',  // líneas finas
  borderL:   'F1F5F9',

  // Acentos semánticos
  primary:   '0B1F3F',  // azul oscuro corporate (header / títulos)
  dynamics:  '2563EB',  // azul Microsoft Dynamics
  pdb:       '15803D',  // verde PDB
  warn:      'D97706',  // ámbar (handoff / alertas)
  critical:  'B91C1C',  // rojo (vínculo crítico / cierre perdido)
  purple:    '7C3AED',  // morado (advisory / servicio)
  teal:      '0D9488',  // teal (datos / canales)

  // Backgrounds suaves
  bgDyn:     'EFF6FF',
  bgPdb:     'F0FDF4',
  bgWarn:    'FEF3C7',
  bgCrit:    'FEE2E2',
  bgPurple:  'F5F3FF',
  bgTeal:    'F0FDFA',
}

// ── Constantes layout ─────────────────────────────────────────────────────
const W = 13.33
const H = 7.5
const M = 0.6                  // margen lateral
const HEADER_H = 0.45
const FOOTER_H = 0.3
const CONTENT_T = HEADER_H + 0.2
const CONTENT_B = H - FOOTER_H - 0.1
const CONTENT_W = W - 2 * M

const FONT = 'Calibri'

let slideCounter = 0
const TOTAL_SLIDES_PLACEHOLDER = '15'  // total estático — actualizar si cambia el número de slides

// ── Helpers ───────────────────────────────────────────────────────────────
function addSlide({ title = '', section = '' } = {}) {
  slideCounter += 1
  const s = prs.addSlide()
  s.background = { color: C.bg }

  // Header bar
  s.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: W, h: HEADER_H,
    fill: { color: C.primary }, line: { color: C.primary },
  })
  // Logo / brand
  s.addText('PDB', {
    x: M, y: 0, w: 0.6, h: HEADER_H,
    fontFace: FONT, fontSize: 13, bold: true, color: 'FFFFFF',
    align: 'left', valign: 'middle',
  })
  // Section / title
  s.addText(section ? `${section}` : 'Mapa de Procesos', {
    x: M + 0.7, y: 0, w: 6, h: HEADER_H,
    fontFace: FONT, fontSize: 10.5, color: 'CBD5E1',
    align: 'left', valign: 'middle',
  })
  // Slide number
  s.addText(`${String(slideCounter).padStart(2, '0')} / ${TOTAL_SLIDES_PLACEHOLDER}`, {
    x: W - M - 1, y: 0, w: 1, h: HEADER_H,
    fontFace: FONT, fontSize: 9.5, color: '94A3B8',
    align: 'right', valign: 'middle',
  })

  // Footer
  s.addText('Savills · PDB CRM · 2026', {
    x: M, y: H - FOOTER_H, w: 6, h: FOOTER_H,
    fontFace: FONT, fontSize: 8.5, color: C.hint,
    align: 'left', valign: 'middle',
  })
  s.addText('Confidencial — uso interno', {
    x: W - M - 4, y: H - FOOTER_H, w: 4, h: FOOTER_H,
    fontFace: FONT, fontSize: 8.5, italic: true, color: C.hint,
    align: 'right', valign: 'middle',
  })

  // Slide title (gran título de página)
  if (title) {
    s.addText(title, {
      x: M, y: HEADER_H + 0.1, w: CONTENT_W, h: 0.5,
      fontFace: FONT, fontSize: 24, bold: true, color: C.ink,
      align: 'left', valign: 'top',
    })
  }
  return s
}

function note(s, text, { x = M, y = HEADER_H + 0.65, w = CONTENT_W } = {}) {
  s.addText(text, {
    x, y, w, h: 0.35,
    fontFace: FONT, fontSize: 11.5, color: C.muted, italic: true,
    align: 'left', valign: 'top',
  })
}

function card(s, { x, y, w, h, fill = C.surface, border = C.border, radius = 0.06 }) {
  s.addShape(prs.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: fill },
    line: { color: border, width: 0.75 },
    rectRadius: radius,
    shadow: { type: 'outer', color: '00000018', blur: 6, offset: 1.5, angle: 90 },
  })
}

function nodeBox(s, { x, y, w, h, label, sub, accent = C.dynamics, num = null, fill = C.surface, border = null }) {
  const bd = border || accent
  s.addShape(prs.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: fill },
    line: { color: bd, width: 1 },
    rectRadius: 0.06,
    shadow: { type: 'outer', color: '00000014', blur: 4, offset: 1, angle: 90 },
  })
  // Acento izquierdo (barra de color)
  s.addShape(prs.ShapeType.rect, {
    x, y, w: 0.06, h,
    fill: { color: accent }, line: { color: accent },
  })
  // Número
  if (num != null) {
    s.addShape(prs.ShapeType.ellipse, {
      x: x - 0.14, y: y - 0.14, w: 0.32, h: 0.32,
      fill: { color: accent }, line: { color: 'FFFFFF', width: 1.5 },
    })
    s.addText(String(num), {
      x: x - 0.14, y: y - 0.14, w: 0.32, h: 0.32,
      fontFace: FONT, fontSize: 10, bold: true, color: 'FFFFFF',
      align: 'center', valign: 'middle',
    })
  }
  // Label
  s.addText(label, {
    x: x + 0.16, y: y + 0.08, w: w - 0.22, h: 0.32,
    fontFace: FONT, fontSize: 11.5, bold: true, color: C.ink,
    align: 'left', valign: 'top',
  })
  if (sub) {
    s.addText(sub, {
      x: x + 0.16, y: y + 0.40, w: w - 0.22, h: h - 0.42,
      fontFace: FONT, fontSize: 9.5, color: C.muted,
      align: 'left', valign: 'top',
    })
  }
}

function arrow(s, { x1, y1, x2, y2, label = null, color = C.muted, dash = false, weight = 1.25 }) {
  s.addShape(prs.ShapeType.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color, width: weight, endArrowType: 'arrow', dashType: dash ? 'dash' : 'solid' },
  })
  if (label) {
    const mx = (x1 + x2) / 2 - 0.7
    const my = (y1 + y2) / 2 - 0.13
    s.addShape(prs.ShapeType.roundRect, {
      x: mx, y: my, w: 1.4, h: 0.26,
      fill: { color: 'FFFFFF' }, line: { color, width: 0.5 }, rectRadius: 0.05,
    })
    s.addText(label, {
      x: mx, y: my, w: 1.4, h: 0.26,
      fontFace: FONT, fontSize: 9, color, bold: true,
      align: 'center', valign: 'middle',
    })
  }
}

function section(s, { x, y, w, h, label, color = C.muted }) {
  s.addShape(prs.ShapeType.rect, {
    x, y, w, h,
    fill: { color: 'FFFFFF', transparency: 30 },
    line: { color, width: 0.5, dashType: 'dash' },
  })
  s.addText(label, {
    x: x + 0.1, y: y + 0.05, w: w - 0.2, h: 0.22,
    fontFace: FONT, fontSize: 9, bold: true, color,
    align: 'left', valign: 'top',
  })
}

function legendItem(s, { x, y, color, label }) {
  s.addShape(prs.ShapeType.rect, {
    x, y: y + 0.05, w: 0.18, h: 0.18,
    fill: { color }, line: { color },
  })
  s.addText(label, {
    x: x + 0.25, y, w: 1.6, h: 0.28,
    fontFace: FONT, fontSize: 9.5, color: C.ink2,
    align: 'left', valign: 'middle',
  })
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 1 — PORTADA
// ══════════════════════════════════════════════════════════════════════════
{
  slideCounter += 1
  const s = prs.addSlide()
  s.background = { color: C.surface }

  // Banda lateral izquierda
  s.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: 4.2, h: H,
    fill: { color: C.primary }, line: { color: C.primary },
  })
  // Detalle dorado lateral
  s.addShape(prs.ShapeType.rect, {
    x: 4.2, y: 0, w: 0.06, h: H,
    fill: { color: '0EA5E9' }, line: { color: '0EA5E9' },
  })

  // Logo/brand grande
  s.addText('PDB', {
    x: 0.6, y: 0.7, w: 3, h: 0.7,
    fontFace: FONT, fontSize: 38, bold: true, color: 'FFFFFF',
  })
  s.addText('PropDatabase CRM', {
    x: 0.6, y: 1.4, w: 3, h: 0.4,
    fontFace: FONT, fontSize: 12, color: '94A3B8',
  })

  // Sección lateral inferior
  s.addText('Savills', {
    x: 0.6, y: H - 1.3, w: 3, h: 0.35,
    fontFace: FONT, fontSize: 13, bold: true, color: 'FFFFFF',
  })
  s.addText('Departamento de Capital Markets', {
    x: 0.6, y: H - 0.95, w: 3, h: 0.3,
    fontFace: FONT, fontSize: 10, color: '94A3B8',
  })
  s.addText('2026', {
    x: 0.6, y: H - 0.6, w: 3, h: 0.3,
    fontFace: FONT, fontSize: 10, color: '94A3B8',
  })

  // Contenido central
  s.addText('Mapa de Procesos', {
    x: 4.7, y: 2.2, w: 8.2, h: 0.6,
    fontFace: FONT, fontSize: 16, color: C.muted, bold: false,
  })
  s.addText('Cómo se conectan\nlos módulos del CRM', {
    x: 4.7, y: 2.7, w: 8.2, h: 1.6,
    fontFace: FONT, fontSize: 40, bold: true, color: C.ink,
    valign: 'top',
  })
  // Línea separadora
  s.addShape(prs.ShapeType.line, {
    x: 4.7, y: 4.7, w: 1.2, h: 0,
    line: { color: '0EA5E9', width: 2.5 },
  })
  // Resumen
  s.addText('Documento de referencia interno que describe los flujos comerciales del CRM, las dependencias entre módulos y las reglas de gobierno entre PropDatabase y Microsoft Dynamics 365.', {
    x: 4.7, y: 5.0, w: 8.0, h: 1.3,
    fontFace: FONT, fontSize: 12, color: C.ink2, italic: true,
    valign: 'top',
  })
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 2 — ÍNDICE
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Contenido', section: 'Índice' })
  note(s, 'Once procesos clave del ciclo comercial PDB, conectados de extremo a extremo.')

  const items = [
    ['01', 'Conceptos clave', 'Oportunidad · Instrucción · Cuenta vs Entidad Legal · Activo vs Oferta'],
    ['02', 'Mapa de dependencias', 'Qué entidad cuelga de qué: jerarquía y FKs obligatorios'],
    ['03', 'Ciclo comercial completo', 'Lead → Cuenta → Activo/Oferta/Demanda → Negociación → Instrucción'],
    ['04', 'Lead — origen del funnel', 'Captura automática y cualificación previa'],
    ['05', 'Cuentas y Contactos', 'Núcleo relacional · Dynamics como sistema maestro'],
    ['06', 'Oportunidades (WIP)', 'El paraguas comercial, 0–100% probabilidad'],
    ['07', 'Activo', 'Estructura física · puede existir sin propietario'],
    ['08', 'Demanda', 'Perfil de búsqueda · matching contra Ofertas'],
    ['09', 'Oferta', 'Disponibilidad comercial · cuelga del Activo'],
    ['10', 'Negociación', 'Hilo formal · tabla evolutiva de versiones'],
    ['11', 'Instrucción / Transacción', 'Cierre formal · facturación contra Entidad Legal'],
    ['12', 'Mandatos · Propuestas · Vencimientos', 'Procesos derivados que cuelgan de Oportunidad'],
  ]

  const colCount = 2
  const colW = (CONTENT_W - 0.4) / colCount
  const rowH = 0.42
  const startY = HEADER_H + 1.05
  items.forEach((it, i) => {
    const col = i % colCount
    const row = Math.floor(i / colCount)
    const x = M + col * (colW + 0.4)
    const y = startY + row * (rowH + 0.18)
    // Numerito
    s.addText(it[0], {
      x, y, w: 0.5, h: rowH,
      fontFace: FONT, fontSize: 18, bold: true, color: C.dynamics,
      align: 'left', valign: 'top',
    })
    // Title
    s.addText(it[1], {
      x: x + 0.55, y, w: colW - 0.55, h: 0.22,
      fontFace: FONT, fontSize: 12, bold: true, color: C.ink,
      align: 'left', valign: 'top',
    })
    // Sub
    s.addText(it[2], {
      x: x + 0.55, y: y + 0.22, w: colW - 0.55, h: 0.2,
      fontFace: FONT, fontSize: 9.5, color: C.muted,
      align: 'left', valign: 'top',
    })
  })
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 3 — CONCEPTOS CLAVE
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Conceptos clave', section: '01 · Conceptos' })
  note(s, 'Cuatro pares de conceptos que sostienen toda la arquitectura del CRM.')

  const cards = [
    {
      title: 'Oportunidad',
      subtitle: 'WIP comercial · Microsoft Dynamics',
      body: 'Cualquier registro con posibilidad real de generar facturación, desde 0% a 100% de probabilidad. Cubre advisory, valoración, captación, leasing, venta y consultoría. Vive obligatoriamente en Dynamics; el PDB consume y enriquece.',
      accent: C.dynamics, bg: C.bgDyn,
    },
    {
      title: 'Instrucción',
      subtitle: 'Cierre formal · Revenue real',
      body: 'Facturación cerrada: fee, honorarios, formalización contractual. Frontera entre WIP y revenue. Se factura siempre contra una Entidad Legal, no contra la Cuenta. La Instrucción se origina en Dynamics y se refleja en PDB en lectura.',
      accent: C.warn, bg: C.bgWarn,
    },
    {
      title: 'Cuenta vs Entidad Legal',
      subtitle: 'Relación vs fiscalidad',
      body: 'Cuenta = matriz comercial (Samsung, Merlin, Inditex). Entidad Legal = sociedad fiscal con CIF/NIF (Merlin Offices SL, Merlin Logistics SL). Las Entidades Legales cuelgan de la Cuenta. Facturación → Entidad Legal.',
      accent: C.purple, bg: C.bgPurple,
    },
    {
      title: 'Activo vs Oferta',
      subtitle: 'Estructura vs disponibilidad',
      body: 'Activo = inmueble físico (dato maestro). Oferta = disponibilidad comercializable que cuelga del Activo. La disponibilidad NUNCA se almacena en el Activo; sí puede mostrarse como KPI agregado derivado de las Ofertas vinculadas.',
      accent: C.pdb, bg: C.bgPdb,
    },
  ]

  const cw = (CONTENT_W - 0.3) / 2
  const ch = 2.2
  cards.forEach((c, i) => {
    const x = M + (i % 2) * (cw + 0.3)
    const y = HEADER_H + 1.1 + Math.floor(i / 2) * (ch + 0.25)
    card(s, { x, y, w: cw, h: ch, fill: 'FFFFFF', border: C.border })
    // Acento superior
    s.addShape(prs.ShapeType.rect, {
      x, y, w: cw, h: 0.05,
      fill: { color: c.accent }, line: { color: c.accent },
    })
    s.addText(c.title, {
      x: x + 0.25, y: y + 0.18, w: cw - 0.5, h: 0.4,
      fontFace: FONT, fontSize: 17, bold: true, color: C.ink,
    })
    s.addText(c.subtitle, {
      x: x + 0.25, y: y + 0.62, w: cw - 0.5, h: 0.25,
      fontFace: FONT, fontSize: 10.5, color: c.accent, bold: true,
    })
    s.addText(c.body, {
      x: x + 0.25, y: y + 0.92, w: cw - 0.5, h: ch - 1.0,
      fontFace: FONT, fontSize: 11, color: C.ink2, valign: 'top',
    })
  })
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 4 — MAPA DE DEPENDENCIAS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Mapa de dependencias', section: '02 · Jerarquía' })
  note(s, 'Cómo se anidan las entidades y qué FKs son obligatorios para cada flujo.')

  // Leyenda arriba
  legendItem(s, { x: M,        y: HEADER_H + 1.0, color: C.dynamics, label: 'Dynamics (read-only)' })
  legendItem(s, { x: M + 2.4,  y: HEADER_H + 1.0, color: C.pdb,      label: 'PDB (operativo)' })
  legendItem(s, { x: M + 4.8,  y: HEADER_H + 1.0, color: C.critical, label: 'FK crítico' })
  legendItem(s, { x: M + 7.2,  y: HEADER_H + 1.0, color: C.muted,    label: 'FK opcional' })

  const yTop = HEADER_H + 1.6

  // Dynamics (left)
  section(s, { x: M, y: yTop, w: 4, h: 4.6, label: 'DYNAMICS · Sistema maestro', color: C.dynamics })
  nodeBox(s, { x: M + 0.2, y: yTop + 0.45, w: 3.6, h: 0.65, label: 'Cuenta',          sub: 'Matriz comercial', accent: C.dynamics })
  nodeBox(s, { x: M + 0.2, y: yTop + 1.20, w: 3.6, h: 0.65, label: 'Contacto',        sub: 'Personas asociadas', accent: C.dynamics })
  nodeBox(s, { x: M + 0.2, y: yTop + 1.95, w: 3.6, h: 0.65, label: 'Entidad Legal',   sub: 'Sociedad con CIF · facturación', accent: C.dynamics })
  nodeBox(s, { x: M + 0.2, y: yTop + 2.70, w: 3.6, h: 0.65, label: 'Oportunidad',     sub: 'WIP comercial 0–100%', accent: C.dynamics })
  nodeBox(s, { x: M + 0.2, y: yTop + 3.45, w: 3.6, h: 0.65, label: 'Instrucción',     sub: 'Cierre formal · revenue', accent: C.dynamics })

  // PDB (right)
  section(s, { x: M + 4.5, y: yTop, w: CONTENT_W - 4.5, h: 4.6, label: 'PDB · Sistema operativo', color: C.pdb })

  // Activo
  nodeBox(s, { x: M + 4.7, y: yTop + 0.45, w: 3.5, h: 0.65, label: 'Activo',          sub: 'Estructura física (independiente)', accent: C.pdb })
  // Stacking + Oferta cuelgan del Activo
  nodeBox(s, { x: M + 4.7, y: yTop + 1.20, w: 1.65, h: 0.55, label: 'Stacking', sub: 'plantas / unidades', accent: C.pdb })
  nodeBox(s, { x: M + 6.55, y: yTop + 1.20, w: 1.65, h: 0.55, label: 'Oferta',   sub: 'disponibilidad', accent: C.pdb })
  // Demanda
  nodeBox(s, { x: M + 4.7, y: yTop + 1.95, w: 3.5, h: 0.55, label: 'Demanda',         sub: 'Perfil de búsqueda · cuelga de Cuenta', accent: C.pdb })
  // Negociación / Mandato / Propuesta
  nodeBox(s, { x: M + 4.7, y: yTop + 2.70, w: 1.65, h: 0.65, label: 'Negociación', sub: 'cuelga de Op.', accent: C.pdb })
  nodeBox(s, { x: M + 6.55, y: yTop + 2.70, w: 1.65, h: 0.65, label: 'Mandato',     sub: 'Op + Of + Activo', accent: C.pdb })
  nodeBox(s, { x: M + 4.7, y: yTop + 3.45, w: 3.5, h: 0.65, label: 'Propuesta / Proyecto', sub: 'cuelga de Op.', accent: C.pdb })

  // Conexiones críticas
  s.addShape(prs.ShapeType.line, {
    x: M + 3.8, y: yTop + 0.78, w: 0.9, h: 0,
    line: { color: C.critical, width: 1.5, endArrowType: 'arrow' },
  })
  s.addText('FK crítico', {
    x: M + 3.85, y: yTop + 0.55, w: 0.9, h: 0.2,
    fontFace: FONT, fontSize: 8, color: C.critical, bold: true, align: 'center',
  })

  // Texto explicativo abajo
  s.addText('Activo es independiente: puede existir sin Cuenta-Propietario vinculada. Stacking Plan se construye igual. Oferta sí requiere Activo.', {
    x: M, y: H - FOOTER_H - 0.7, w: CONTENT_W, h: 0.3,
    fontFace: FONT, fontSize: 10, color: C.muted, italic: true, align: 'left',
  })
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 5 — CICLO COMERCIAL COMPLETO
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Ciclo comercial completo', section: '03 · End-to-end' })
  note(s, 'Lead → Cuenta → Activo + Oferta + Demanda → Match → Oportunidad → Negociación → Instrucción → Transacción')

  // Layout: 3 carriles horizontales
  const yLead = HEADER_H + 1.2
  const yDyn  = HEADER_H + 2.1
  const yPdb  = HEADER_H + 3.6

  // Lead (carril superior solo)
  section(s, { x: M, y: yLead - 0.05, w: 1.8, h: 0.85, label: 'LEAD', color: C.warn })
  nodeBox(s, { x: M + 0.1, y: yLead + 0.15, w: 1.6, h: 0.6, label: 'Lead',  sub: 'captura', accent: C.warn, num: 0 })

  // Dynamics carril
  section(s, { x: M + 2.0, y: yDyn - 0.7, w: CONTENT_W - 2.0, h: 1.3, label: 'DYNAMICS', color: C.dynamics })
  nodeBox(s, { x: M + 2.2, y: yDyn - 0.35, w: 1.6, h: 0.85, label: 'Cuenta',       sub: 'fuente de verdad', accent: C.dynamics, num: 1 })
  nodeBox(s, { x: M + 7.0, y: yDyn - 0.35, w: 1.6, h: 0.85, label: 'Oportunidad',  sub: 'WIP · handoff #1', accent: C.dynamics, num: 6 })
  nodeBox(s, { x: M + 10.5,y: yDyn - 0.35, w: 1.6, h: 0.85, label: 'Instrucción',  sub: 'handoff #2', accent: C.dynamics, num: 8 })

  // PDB carril
  section(s, { x: M + 2.0, y: yPdb - 0.5, w: CONTENT_W - 2.0, h: 1.4, label: 'PDB', color: C.pdb })
  nodeBox(s, { x: M + 2.2, y: yPdb - 0.15, w: 1.4, h: 0.85, label: 'Activo',     sub: 'alta', accent: C.pdb, num: 2 })
  nodeBox(s, { x: M + 3.8, y: yPdb - 0.15, w: 1.4, h: 0.85, label: 'Oferta',     sub: 'producto', accent: C.pdb, num: 3 })
  nodeBox(s, { x: M + 5.4, y: yPdb - 0.15, w: 1.4, h: 0.85, label: 'Demanda',    sub: 'búsqueda', accent: C.pdb, num: 4 })
  nodeBox(s, { x: M + 7.0, y: yPdb - 0.15, w: 1.4, h: 0.85, label: 'Match',      sub: 'Of ↔ Dem', accent: C.pdb, num: 5 })
  nodeBox(s, { x: M + 8.7, y: yPdb - 0.15, w: 1.6, h: 0.85, label: 'Negociación',sub: 'condiciones', accent: C.pdb, num: 7 })
  nodeBox(s, { x: M + 10.5,y: yPdb - 0.15, w: 1.6, h: 0.85, label: 'Transacción',sub: 'cierre', accent: C.pdb, num: 9 })

  // Flechas
  arrow(s, { x1: M + 1.7, y1: yLead + 0.45, x2: M + 2.2, y2: yDyn + 0.05, color: C.warn, label: 'cualificación' })
  arrow(s, { x1: M + 3.0, y1: yDyn + 0.5,   x2: M + 2.9, y2: yPdb - 0.15, color: C.critical, weight: 2, label: 'FK Activo' })
  arrow(s, { x1: M + 3.6, y1: yPdb + 0.27,  x2: M + 3.8, y2: yPdb + 0.27 })
  arrow(s, { x1: M + 5.2, y1: yPdb + 0.27,  x2: M + 5.4, y2: yPdb + 0.27 })
  arrow(s, { x1: M + 6.8, y1: yPdb + 0.27,  x2: M + 7.0, y2: yPdb + 0.27 })
  arrow(s, { x1: M + 8.0, y1: yPdb + 0.05,  x2: M + 7.6, y2: yDyn + 0.5, color: C.warn, label: 'handoff #1', dash: false })
  arrow(s, { x1: M + 7.8, y1: yDyn + 0.5,   x2: M + 9.2, y2: yPdb - 0.15, color: C.dynamics, label: 'sync' })
  arrow(s, { x1: M + 10.3,y1: yPdb + 0.05,  x2: M + 10.9,y2: yDyn + 0.5, color: C.warn, label: 'handoff #2' })
  arrow(s, { x1: M + 11.3,y1: yDyn + 0.5,   x2: M + 11.3,y2: yPdb - 0.15, color: C.dynamics, label: 'sync' })

  // Cita inferior
  s.addShape(prs.ShapeType.roundRect, {
    x: M, y: H - FOOTER_H - 1.3, w: CONTENT_W, h: 0.8,
    fill: { color: C.bgDyn }, line: { color: C.dynamics, width: 0.5 }, rectRadius: 0.06,
  })
  s.addText(
    'La Oportunidad NO es el origen del ciclo. Aparece como WIP cuando el Lead se cualifica y se vincula a una Cuenta. PDB lanza el handoff a Dynamics; Dynamics sincroniza el registro de vuelta para seguir operando en PDB.',
    {
      x: M + 0.2, y: H - FOOTER_H - 1.2, w: CONTENT_W - 0.4, h: 0.65,
      fontFace: FONT, fontSize: 10.5, color: C.ink2, italic: true,
      align: 'left', valign: 'middle',
    }
  )
}

// ══════════════════════════════════════════════════════════════════════════
// HELPER PARA SLIDES DE PROCESO INDIVIDUAL (5–14)
// ══════════════════════════════════════════════════════════════════════════
function processSlide({ num, code, title, subtitle, steps, footer }) {
  const s = addSlide({ title, section: `${code} · ${title}` })
  if (subtitle) note(s, subtitle)

  const yStart = HEADER_H + 1.2
  const stepW = (CONTENT_W - (steps.length - 1) * 0.45) / steps.length
  const stepH = 1.5

  steps.forEach((st, i) => {
    const x = M + i * (stepW + 0.45)
    const accent = st.accent || (st.lane === 'dyn' ? C.dynamics : st.lane === 'lead' ? C.warn : C.pdb)
    const fill = st.lane === 'dyn' ? C.bgDyn : st.lane === 'lead' ? C.bgWarn : C.surface

    // Lane label small
    if (i === 0 || st.lane !== steps[i-1].lane) {
      const laneLabel = st.lane === 'dyn' ? 'DYNAMICS' : st.lane === 'lead' ? 'LEAD' : 'PDB'
      s.addText(laneLabel, {
        x, y: yStart - 0.25, w: stepW, h: 0.2,
        fontFace: FONT, fontSize: 8, bold: true, color: accent,
        letterSpacing: 1, align: 'left',
      })
    }

    // Card
    card(s, { x, y: yStart, w: stepW, h: stepH, fill, border: accent })
    // Acento superior fino
    s.addShape(prs.ShapeType.rect, {
      x, y: yStart, w: stepW, h: 0.06,
      fill: { color: accent }, line: { color: accent },
    })
    // Número grande
    s.addText(String(st.num), {
      x: x + 0.18, y: yStart + 0.14, w: 0.6, h: 0.5,
      fontFace: FONT, fontSize: 28, bold: true, color: accent,
      align: 'left',
    })
    // Title
    s.addText(st.title, {
      x: x + 0.18, y: yStart + 0.6, w: stepW - 0.3, h: 0.32,
      fontFace: FONT, fontSize: 12, bold: true, color: C.ink,
      align: 'left',
    })
    // Sub
    if (st.sub) {
      s.addText(st.sub, {
        x: x + 0.18, y: yStart + 0.92, w: stepW - 0.3, h: stepH - 0.95,
        fontFace: FONT, fontSize: 10, color: C.muted,
        align: 'left', valign: 'top',
      })
    }

    // Flecha al siguiente
    if (i < steps.length - 1) {
      arrow(s, {
        x1: x + stepW + 0.05, y1: yStart + stepH / 2,
        x2: x + stepW + 0.40, y2: yStart + stepH / 2,
        color: C.hint, weight: 1.5,
      })
    }
  })

  // Footer block
  if (footer) {
    s.addShape(prs.ShapeType.roundRect, {
      x: M, y: H - FOOTER_H - 1.5, w: CONTENT_W, h: 1.0,
      fill: { color: C.bg }, line: { color: C.border, width: 0.5 }, rectRadius: 0.06,
    })
    s.addText('Lectura del proceso', {
      x: M + 0.2, y: H - FOOTER_H - 1.4, w: CONTENT_W - 0.4, h: 0.25,
      fontFace: FONT, fontSize: 9, bold: true, color: C.muted, letterSpacing: 1,
    })
    s.addText(footer, {
      x: M + 0.2, y: H - FOOTER_H - 1.15, w: CONTENT_W - 0.4, h: 0.7,
      fontFace: FONT, fontSize: 10.5, color: C.ink2, valign: 'top',
    })
  }
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDES 6–14: PROCESOS
// ══════════════════════════════════════════════════════════════════════════
processSlide({
  code: '04',
  title: 'Lead — origen del funnel',
  subtitle: 'Captura automática desde web, portales, formularios, recomendaciones y campañas. Tres tipos: Demanda, Oferta, Servicio.',
  steps: [
    { num: 1, lane: 'lead', title: 'Captura',         sub: 'Web · portales · LinkedIn · campañas · formularios' },
    { num: 2, lane: 'lead', title: 'Clasificación',   sub: 'Tipo: Demanda / Oferta / Servicio' },
    { num: 3, lane: 'lead', title: 'Cualificación',   sub: 'Actividades · llamadas · validación' },
    { num: 4, lane: 'lead', title: 'Vinculación',     sub: 'Cuenta o Contacto (obligatorio)' },
    { num: 5, lane: 'dyn',  title: 'Transformar',     sub: 'Handoff a Dynamics · crea Oportunidad' },
  ],
  footer: 'El Lead es el verdadero punto de entrada del funnel. La transformación a Oportunidad exige obligatoriamente Cuenta o Contacto vinculado — sin esto no se puede crear el registro maestro en Dynamics.',
})

processSlide({
  code: '05',
  title: 'Cuentas y Contactos',
  subtitle: 'Cuenta es la matriz comercial · Entidades Legales son las sociedades fiscales que cuelgan de ella · ambas viven en Dynamics.',
  steps: [
    { num: 1, lane: 'dyn', title: 'Alta Cuenta',          sub: 'Datos fiscales y de contacto' },
    { num: 2, lane: 'dyn', title: 'Sync PDB',             sub: 'Replicación lectura' },
    { num: 3, lane: 'pdb', title: 'Enriquecimiento',      sub: 'Contactos · actividades · histórico' },
    { num: 4, lane: 'pdb', title: 'Vista 360º',           sub: 'Activos · ofertas · oportunidades · operaciones' },
    { num: 5, lane: 'pdb', title: 'Roles',                sub: 'Propietario · Arrendatario · Inversor' },
  ],
  footer: 'La Cuenta es el núcleo relacional. Sobre ella se asientan tres roles posibles, no excluyentes: Propietario (cartera de activos), Arrendatario (demandas y contratos), Inversor (transacciones de capital). Las Entidades Legales (CIF/NIF) cuelgan como filiales fiscales.',
})

processSlide({
  code: '06',
  title: 'Oportunidades — WIP comercial',
  subtitle: 'Cualquier registro que pueda generar facturación: leasing, venta, advisory, valoración, captación, consultoría. Vive en Dynamics.',
  steps: [
    { num: 1, lane: 'pdb', title: 'Match / Oport.',  sub: 'Origen comercial real (lead cualif., match Of↔Dem, etc.)' },
    { num: 2, lane: 'pdb', title: 'Transformar',     sub: '"Crear oportunidad" → abre Dynamics' },
    { num: 3, lane: 'dyn', title: 'Creación',        sub: 'Registro maestro WIP en Dynamics' },
    { num: 4, lane: 'dyn', title: 'Sync vuelta',     sub: 'Oportunidad visible en PDB · solo lectura' },
    { num: 5, lane: 'pdb', title: 'Seguimiento',     sub: 'Vinculaciones · actividades · negociación' },
  ],
  footer: 'La Oportunidad NO es un estadio del ciclo: es el paraguas. Desde 0% a 100% de probabilidad. Dynamics es el sistema maestro: PDB lanza la transición y consume el registro sincronizado.',
})

processSlide({
  code: '07',
  title: 'Activo — base maestra',
  subtitle: 'El inmueble físico. Independiente: puede existir sin Cuenta-Propietario asignada. El Stacking Plan se construye igual.',
  steps: [
    { num: 1, lane: 'pdb', title: 'Alta Activo',     sub: 'Ref · dirección · uso · SBA' },
    { num: 2, lane: 'pdb', title: 'Stacking Plan',   sub: 'Plantas · unidades · usos · arr/prop' },
    { num: 3, lane: 'pdb', title: 'Vinculación',     sub: 'Cuenta-Propietario (opcional pero recomendado)' },
    { num: 4, lane: 'pdb', title: 'Publicación',     sub: 'Vía Oferta · disponibilidad al mercado' },
    { num: 5, lane: 'pdb', title: 'KPIs derivados',  sub: 'Ocupación · días en mercado (de Ofertas)' },
  ],
  footer: 'Activo NO almacena disponibilidad. Esta vive siempre en la Oferta. La ficha del activo puede mostrar KPIs agregados (ocupación, renta promedio) calculados a partir de las Ofertas vinculadas, pero los datos no se persisten en el activo.',
})

processSlide({
  code: '08',
  title: 'Demanda',
  subtitle: 'Perfil de búsqueda de un Cuenta-Arrendatario. Matching contra Ofertas (no contra Activos sueltos).',
  steps: [
    { num: 1, lane: 'dyn', title: 'Cuenta-Arr.',     sub: 'FK obligatorio' },
    { num: 2, lane: 'pdb', title: 'Alta Demanda',    sub: 'Uso · sup · renta máx · zona · break' },
    { num: 3, lane: 'pdb', title: 'Matching',        sub: 'contra Ofertas vigentes · flexible' },
    { num: 4, lane: 'pdb', title: 'Visitas',         sub: 'Presencial · virtual · resultados' },
    { num: 5, lane: 'pdb', title: 'Shortlist',       sub: 'Selección final · handoff a Op WIP' },
  ],
  footer: 'El matching parte de los requisitos pero permite flexibilidad comercial: rangos ampliados, alternativas razonables, opciones algo más caras o de superficie próxima. Nunca recomienda Activos sin Oferta vigente.',
})

processSlide({
  code: '09',
  title: 'Oferta',
  subtitle: 'Producto disponible al mercado. Cuelga del Activo. Existe antes que la demanda concreta que la captura.',
  steps: [
    { num: 1, lane: 'pdb', title: 'Creación',        sub: 'Sobre el Activo (FK obligatorio)' },
    { num: 2, lane: 'pdb', title: 'Publicación',     sub: 'Activa al mercado · espacios · renta' },
    { num: 3, lane: 'pdb', title: 'Recepción',       sub: 'Demandas que machean · interés' },
    { num: 4, lane: 'pdb', title: 'Match',           sub: 'Demanda concreta seleccionada' },
    { num: 5, lane: 'pdb', title: 'Cierre',          sub: 'Lockeada · handoff Op · retirada' },
  ],
  footer: 'La Oferta es el contenedor de mercado, no el de la transacción. La transacción se cierra en la Negociación → Instrucción. Una Oferta puede dar de baja un espacio convirtiéndolo en Arrendatario sobre el Activo.',
})

processSlide({
  code: '10',
  title: 'Negociación',
  subtitle: 'Hilo formal de condiciones. Tabla evolutiva con todas las versiones lado a lado para trazabilidad.',
  steps: [
    { num: 1, lane: 'pdb', title: 'Apertura',        sub: 'Desde Oportunidad WIP' },
    { num: 2, lane: 'pdb', title: 'Intercambio',     sub: 'Chat · adjuntos · contraofertas' },
    { num: 3, lane: 'pdb', title: 'Versionado',      sub: 'Tabla evolutiva · diff de borradores' },
    { num: 4, lane: 'pdb', title: 'Acuerdo',         sub: 'Firma de condiciones finales' },
    { num: 5, lane: 'dyn', title: 'Handoff #2',      sub: 'Crear Instrucción en Dynamics' },
  ],
  footer: 'No existe contrato sin Instrucción en Dynamics. La Negociación es la última fase operativa en PDB; el cierre formal y la facturación se gestionan exclusivamente desde el sistema maestro.',
})

processSlide({
  code: '11',
  title: 'Instrucción / Transacción',
  subtitle: 'Cierre formal · facturación · única vía válida para registrar revenue.',
  steps: [
    { num: 1, lane: 'pdb', title: 'Cierre Neg.',     sub: 'Acuerdo final alcanzado' },
    { num: 2, lane: 'dyn', title: 'Instrucción',     sub: 'Registro maestro en Dynamics' },
    { num: 3, lane: 'dyn', title: 'Contrato',        sub: 'Formalización + visto bueno legal' },
    { num: 4, lane: 'pdb', title: 'Transacción',     sub: 'Sync de vuelta · vista lectura' },
    { num: 5, lane: 'pdb', title: 'Honorarios',      sub: 'Cálculo · emisión · archivo' },
  ],
  footer: 'La Instrucción se emite contra una Entidad Legal (sociedad fiscal con CIF/NIF), nunca contra la Cuenta directamente. Esto es lo que cierra el ciclo y permite registrar revenue en el reporting.',
})

processSlide({
  code: '12',
  title: 'Mandatos · Propuestas · Vencimientos',
  subtitle: 'Procesos derivados que cuelgan siempre de una Oportunidad existente.',
  steps: [
    { num: 1, lane: 'dyn', title: 'Oportunidad',     sub: 'FK obligatorio para todo lo siguiente' },
    { num: 2, lane: 'pdb', title: 'Mandato',         sub: 'Necesita Op + Oferta + Activo' },
    { num: 3, lane: 'pdb', title: 'Propuesta',       sub: 'Pitch · RFP · advisory · valoración' },
    { num: 4, lane: 'pdb', title: 'Vencimiento',     sub: 'Detección automática · alerta' },
    { num: 5, lane: 'pdb', title: 'Reactivación',    sub: 'Renovación o nueva Oportunidad' },
  ],
  footer: 'Mandato y Propuesta nunca nacen solos: ambos exigen FK Oportunidad obligatorio. Mandato exige además FK Oferta y Activo (triple anclaje). Los Vencimientos detectan contratos próximos a expirar y reactivan el ciclo comercial.',
})

// ══════════════════════════════════════════════════════════════════════════
// SLIDE FINAL — REGLA DE ORO
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Vínculos críticos · Regla de oro', section: 'Cierre' })
  note(s, 'Las tres reglas duras que mantienen la integridad del ciclo comercial.')

  const reglas = [
    {
      title: 'Activo + Cuenta-Propietario',
      body: 'Aunque el Activo puede existir sin Cuenta, vincularlo desbloquea la vista 360º del Propietario, el cross-selling, el reporting agregado y la facturación. Un Activo sin Cuenta vinculada queda como dato incompleto.',
      accent: C.critical,
    },
    {
      title: 'Demanda + Cuenta-Arrendatario',
      body: 'No existe Demanda sin Cuenta-Arrendatario. La Cuenta es el origen del interés comercial y permite segmentar, hacer reporting y mantener trazabilidad cuando la búsqueda evoluciona.',
      accent: C.warn,
    },
    {
      title: 'Oferta + Demanda + Activo',
      body: 'Toda Oferta debe colgar de un Activo. La Demanda machea siempre contra Ofertas vivas, nunca contra Activos sueltos. El triángulo Oferta-Demanda-Activo es la unidad mínima que permite cerrar una operación.',
      accent: C.pdb,
    },
  ]

  const cw = (CONTENT_W - 0.4) / 3
  const ch = 2.6
  reglas.forEach((r, i) => {
    const x = M + i * (cw + 0.2)
    const y = HEADER_H + 1.3
    card(s, { x, y, w: cw, h: ch, fill: C.surface, border: r.accent })
    s.addShape(prs.ShapeType.rect, {
      x, y, w: cw, h: 0.06,
      fill: { color: r.accent }, line: { color: r.accent },
    })
    s.addText(`0${i + 1}`, {
      x: x + 0.25, y: y + 0.2, w: 1, h: 0.5,
      fontFace: FONT, fontSize: 28, bold: true, color: r.accent,
    })
    s.addText(r.title, {
      x: x + 0.25, y: y + 0.75, w: cw - 0.5, h: 0.5,
      fontFace: FONT, fontSize: 14, bold: true, color: C.ink, valign: 'top',
    })
    s.addText(r.body, {
      x: x + 0.25, y: y + 1.3, w: cw - 0.5, h: ch - 1.4,
      fontFace: FONT, fontSize: 11, color: C.ink2, valign: 'top',
    })
  })

  // Cita final
  s.addShape(prs.ShapeType.roundRect, {
    x: M, y: HEADER_H + 4.3, w: CONTENT_W, h: 1.5,
    fill: { color: C.primary }, line: { color: C.primary }, rectRadius: 0.08,
  })
  s.addText('REGLA DE ORO', {
    x: M, y: HEADER_H + 4.45, w: CONTENT_W, h: 0.3,
    fontFace: FONT, fontSize: 11, bold: true, color: '60A5FA', letterSpacing: 4, align: 'center',
  })
  s.addText('Ningún Activo sin Cuenta-Propietario. Ninguna Demanda sin Cuenta-Arrendatario. Ninguna Oferta sin ambas.', {
    x: M + 0.4, y: HEADER_H + 4.8, w: CONTENT_W - 0.8, h: 0.95,
    fontFace: FONT, fontSize: 18, italic: false, color: 'FFFFFF', align: 'center', valign: 'middle',
  })
}

// ══════════════════════════════════════════════════════════════════════════
// REEMPLAZAR PLACEHOLDERS DE TOTAL Y GUARDAR
// ══════════════════════════════════════════════════════════════════════════

// PptxGenJS renderiza los slides al guardar. No tenemos manera de reescribir
// los textos ya añadidos. Como workaround, calculamos slideCounter al final
// y dejamos el placeholder visible — alternativa: recargar el script con
// TOTAL_SLIDES dinámico. Para simplicidad mantengo TOTAL_SLIDES_PLACEHOLDER.
// Si quieres el total real visible, reescribe esta sección.

await prs.writeFile({ fileName: 'FLUJOS_PDB.pptx' })
console.log(`OK · FLUJOS_PDB.pptx generado (${slideCounter} slides) con diseño profesional`)
