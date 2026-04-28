// PDB · Mapa de Procesos — Generador del PPT (v3 · diseño limpio · sin solapamientos)
//
// Cambios v3:
//   · Layouts en cuadrícula (sin flechas que crucen cards)
//   · Cada slide de proceso usa el mismo template horizontal de 5–7 pasos
//   · Slide de ciclo end-to-end rediseñado como timeline horizontal
//   · Más procesos cubiertos: añadidos Stacking Plan, Visitas, Vencimientos,
//     Actividades transversales, Confidencialidad
//   · Separación generosa entre elementos
//   · Conectores entre cards = pequeños chevrons en el borde, no flechas largas
//
// Uso:  node scripts/generate_flujos_ppt.mjs

import PptxGenJS from 'pptxgenjs'

const prs = new PptxGenJS()
prs.layout  = 'LAYOUT_WIDE'
prs.title   = 'PDB CRM · Mapa de Procesos'
prs.author  = 'Savills · PDB Team'
prs.company = 'Savills'

// ── Paleta corporativa ────────────────────────────────────────────────────
const C = {
  ink:       '0F172A', ink2: '334155', muted: '64748B', hint: '94A3B8',
  bg:        'F8FAFC', surface: 'FFFFFF', border: 'E2E8F0', borderL: 'F1F5F9',
  primary:   '0B1F3F',
  dynamics:  '2563EB', pdb: '15803D', warn: 'D97706', critical: 'B91C1C',
  purple:    '7C3AED', teal: '0D9488',
  bgDyn:     'EFF6FF', bgPdb: 'F0FDF4', bgWarn: 'FEF3C7', bgCrit: 'FEE2E2',
  bgPurple:  'F5F3FF', bgTeal: 'F0FDFA',
}

// ── Layout ────────────────────────────────────────────────────────────────
const W = 13.33
const H = 7.5
const M = 0.55
const HEADER_H = 0.45
const FOOTER_H = 0.3
const CONTENT_W = W - 2 * M
const FONT = 'Calibri'

let slideCounter = 0
const TOTAL = 18 // actualizar si cambia

// ── Helpers ───────────────────────────────────────────────────────────────
function addSlide({ title = '', section = '' } = {}) {
  slideCounter += 1
  const s = prs.addSlide()
  s.background = { color: C.bg }
  s.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: W, h: HEADER_H,
    fill: { color: C.primary }, line: { color: C.primary },
  })
  s.addText('PDB', {
    x: M, y: 0, w: 0.6, h: HEADER_H,
    fontFace: FONT, fontSize: 13, bold: true, color: 'FFFFFF',
    align: 'left', valign: 'middle',
  })
  s.addText(section || 'Mapa de Procesos', {
    x: M + 0.7, y: 0, w: 8, h: HEADER_H,
    fontFace: FONT, fontSize: 10.5, color: 'CBD5E1',
    align: 'left', valign: 'middle',
  })
  s.addText(`${String(slideCounter).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`, {
    x: W - M - 1, y: 0, w: 1, h: HEADER_H,
    fontFace: FONT, fontSize: 9.5, color: '94A3B8',
    align: 'right', valign: 'middle',
  })
  // Footer
  s.addText('Savills · PDB CRM · 2026', {
    x: M, y: H - FOOTER_H, w: 6, h: FOOTER_H,
    fontFace: FONT, fontSize: 8.5, color: C.hint, align: 'left', valign: 'middle',
  })
  s.addText('Confidencial — uso interno', {
    x: W - M - 4, y: H - FOOTER_H, w: 4, h: FOOTER_H,
    fontFace: FONT, fontSize: 8.5, italic: true, color: C.hint, align: 'right', valign: 'middle',
  })
  // Slide title
  if (title) {
    s.addText(title, {
      x: M, y: HEADER_H + 0.18, w: CONTENT_W, h: 0.5,
      fontFace: FONT, fontSize: 22, bold: true, color: C.ink,
      align: 'left', valign: 'top',
    })
  }
  return s
}

function note(s, text, y = HEADER_H + 0.78) {
  s.addText(text, {
    x: M, y, w: CONTENT_W, h: 0.32,
    fontFace: FONT, fontSize: 11.5, color: C.muted, italic: true,
    align: 'left', valign: 'top',
  })
}

function chevron(s, { x, y, color = C.hint }) {
  // Pequeño chevron «›» en texto, indica flujo entre cards sin solapar
  s.addText('›', {
    x: x - 0.05, y: y - 0.05, w: 0.3, h: 0.32,
    fontFace: FONT, fontSize: 22, bold: true, color,
    align: 'center', valign: 'middle',
  })
}

function laneLabel(s, { x, y, w, label, color }) {
  s.addText(label, {
    x, y, w, h: 0.22,
    fontFace: FONT, fontSize: 8.5, bold: true, color, letterSpacing: 2,
    align: 'left', valign: 'middle',
  })
}

function processStepCard(s, { x, y, w, h, num, title, sub, accent, fill = C.surface }) {
  s.addShape(prs.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: fill }, line: { color: accent, width: 1 },
    rectRadius: 0.06,
    shadow: { type: 'outer', color: '00000014', blur: 4, offset: 1, angle: 90 },
  })
  // Top accent bar
  s.addShape(prs.ShapeType.rect, {
    x, y, w, h: 0.06,
    fill: { color: accent }, line: { color: accent },
  })
  // Number circle
  s.addShape(prs.ShapeType.ellipse, {
    x: x - 0.14, y: y - 0.14, w: 0.32, h: 0.32,
    fill: { color: accent }, line: { color: 'FFFFFF', width: 1.5 },
  })
  s.addText(String(num), {
    x: x - 0.14, y: y - 0.14, w: 0.32, h: 0.32,
    fontFace: FONT, fontSize: 10, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle',
  })
  // Title
  s.addText(title, {
    x: x + 0.15, y: y + 0.18, w: w - 0.25, h: 0.32,
    fontFace: FONT, fontSize: 12, bold: true, color: C.ink,
    align: 'left', valign: 'top',
  })
  // Sub
  if (sub) {
    s.addText(sub, {
      x: x + 0.15, y: y + 0.55, w: w - 0.25, h: h - 0.65,
      fontFace: FONT, fontSize: 9.5, color: C.muted,
      align: 'left', valign: 'top',
    })
  }
}

function legendItem(s, { x, y, color, label }) {
  s.addShape(prs.ShapeType.rect, {
    x, y: y + 0.05, w: 0.18, h: 0.18, fill: { color }, line: { color },
  })
  s.addText(label, {
    x: x + 0.25, y, w: 1.7, h: 0.28,
    fontFace: FONT, fontSize: 9.5, color: C.ink2, align: 'left', valign: 'middle',
  })
}

function readingBlock(s, text) {
  const y = H - FOOTER_H - 1.0
  s.addShape(prs.ShapeType.roundRect, {
    x: M, y, w: CONTENT_W, h: 0.7,
    fill: { color: 'FFFFFF' }, line: { color: C.border, width: 0.5 }, rectRadius: 0.06,
  })
  s.addText('LECTURA DEL PROCESO', {
    x: M + 0.2, y: y + 0.06, w: CONTENT_W - 0.4, h: 0.2,
    fontFace: FONT, fontSize: 8.5, bold: true, color: C.muted, letterSpacing: 2,
  })
  s.addText(text, {
    x: M + 0.2, y: y + 0.27, w: CONTENT_W - 0.4, h: 0.4,
    fontFace: FONT, fontSize: 10.5, color: C.ink2, valign: 'top',
  })
}

// Lane color mapping
function laneAccent(lane) {
  if (lane === 'dyn')   return { color: C.dynamics, bg: C.bgDyn,    label: 'DYNAMICS' }
  if (lane === 'lead')  return { color: C.warn,     bg: C.bgWarn,   label: 'LEAD' }
  if (lane === 'pdb')   return { color: C.pdb,      bg: C.surface,  label: 'PDB' }
  if (lane === 'crit')  return { color: C.critical, bg: C.bgCrit,   label: 'CIERRE' }
  if (lane === 'aux')   return { color: C.purple,   bg: C.bgPurple, label: 'TRANSVERSAL' }
  return { color: C.muted, bg: C.surface, label: 'OTRO' }
}

// Renderiza una fila horizontal de pasos. Calcula automáticamente posiciones
// y dibuja chevrons entre pasos consecutivos (sin solapar nada).
function renderProcess(s, { steps, yTop = HEADER_H + 1.5, height = 1.7 }) {
  const N = steps.length
  const gap = 0.25
  const stepW = (CONTENT_W - (N - 1) * gap) / N

  // Lane labels — agrupar pasos consecutivos del mismo lane
  let i = 0
  while (i < N) {
    const lane = steps[i].lane
    let j = i
    while (j + 1 < N && steps[j + 1].lane === lane) j++
    const a = laneAccent(lane)
    const x = M + i * (stepW + gap)
    const w = (j - i + 1) * stepW + (j - i) * gap
    laneLabel(s, { x, y: yTop - 0.32, w, label: a.label, color: a.color })
    i = j + 1
  }

  // Step cards
  steps.forEach((st, idx) => {
    const a = laneAccent(st.lane)
    const x = M + idx * (stepW + gap)
    processStepCard(s, {
      x, y: yTop, w: stepW, h: height,
      num: idx + 1, title: st.title, sub: st.sub,
      accent: a.color, fill: a.bg,
    })
    // Chevron entre pasos
    if (idx < N - 1) {
      const cx = x + stepW + (gap - 0.18) / 2
      const cy = yTop + (height - 0.22) / 2
      chevron(s, { x: cx, y: cy, color: C.hint })
    }
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 01 · PORTADA
// ══════════════════════════════════════════════════════════════════════════
{
  slideCounter += 1
  const s = prs.addSlide()
  s.background = { color: C.surface }
  s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 4.2, h: H, fill: { color: C.primary }, line: { color: C.primary } })
  s.addShape(prs.ShapeType.rect, { x: 4.2, y: 0, w: 0.06, h: H, fill: { color: '0EA5E9' }, line: { color: '0EA5E9' } })
  s.addText('PDB', {
    x: 0.6, y: 0.7, w: 3, h: 0.7,
    fontFace: FONT, fontSize: 38, bold: true, color: 'FFFFFF',
  })
  s.addText('PropDatabase CRM', {
    x: 0.6, y: 1.4, w: 3, h: 0.4, fontFace: FONT, fontSize: 12, color: '94A3B8',
  })
  s.addText('Savills', {
    x: 0.6, y: H - 1.3, w: 3, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: 'FFFFFF',
  })
  s.addText('Departamento de Capital Markets', {
    x: 0.6, y: H - 0.95, w: 3, h: 0.3, fontFace: FONT, fontSize: 10, color: '94A3B8',
  })
  s.addText('2026', {
    x: 0.6, y: H - 0.6, w: 3, h: 0.3, fontFace: FONT, fontSize: 10, color: '94A3B8',
  })
  s.addText('Mapa de Procesos', {
    x: 4.7, y: 2.2, w: 8.2, h: 0.6, fontFace: FONT, fontSize: 16, color: C.muted,
  })
  s.addText('Cómo se conectan\nlos módulos del CRM', {
    x: 4.7, y: 2.7, w: 8.2, h: 1.7, fontFace: FONT, fontSize: 38, bold: true, color: C.ink, valign: 'top',
  })
  s.addShape(prs.ShapeType.line, { x: 4.7, y: 4.85, w: 1.2, h: 0, line: { color: '0EA5E9', width: 2.5 } })
  s.addText('Documento de referencia interno que describe los flujos comerciales del CRM, las dependencias entre módulos y las reglas de gobierno entre PropDatabase y Microsoft Dynamics 365.', {
    x: 4.7, y: 5.15, w: 8.0, h: 1.3, fontFace: FONT, fontSize: 12, color: C.ink2, italic: true, valign: 'top',
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 02 · ÍNDICE
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Contenido', section: 'Índice' })
  note(s, 'Mapa completo de los procesos del CRM, agrupados por bloque temático.')

  const groups = [
    { gtitle: 'FUNDAMENTOS', items: [
      ['01', 'Conceptos clave',         'Oportunidad · Instrucción · Cuenta vs Entidad Legal · Activo vs Oferta'],
      ['02', 'Mapa de dependencias',    'Qué entidad cuelga de qué · FKs obligatorios'],
      ['03', 'Ciclo comercial completo','Lead → Cuenta → Activo/Oferta/Demanda → Negociación → Instrucción'],
    ]},
    { gtitle: 'ENTRADA Y RELACIÓN', items: [
      ['04', 'Lead — origen del funnel','Captura automática y cualificación'],
      ['05', 'Cuentas y Contactos',     'Núcleo relacional · Dynamics como sistema maestro'],
      ['06', 'Oportunidades (WIP)',     'Paraguas comercial · Dynamics'],
    ]},
    { gtitle: 'PRODUCTO', items: [
      ['07', 'Activo',                  'Estructura física · puede existir sin propietario'],
      ['08', 'Stacking Plan',           'Distribución de plantas · usos · ocupación'],
      ['09', 'Oferta',                  'Disponibilidad comercial · cuelga del Activo'],
    ]},
    { gtitle: 'COMERCIALIZACIÓN', items: [
      ['10', 'Demanda',                 'Perfil de búsqueda · matching contra Ofertas'],
      ['11', 'Visitas',                 'Inspección física · feedback comercial'],
      ['12', 'Negociación',             'Hilo formal · tabla evolutiva de versiones'],
    ]},
    { gtitle: 'CIERRE Y CONTINUIDAD', items: [
      ['13', 'Instrucción / Transacción','Cierre formal · facturación contra Entidad Legal'],
      ['14', 'Mandatos · Propuestas',   'Procesos derivados que cuelgan de Oportunidad'],
      ['15', 'Vencimientos',            'Detección de break/fin · reactivación del ciclo'],
      ['16', 'Confidencialidad',        'Visibilidad granular en ofertas y demandas'],
    ]},
  ]

  let y = HEADER_H + 1.15
  groups.forEach(g => {
    s.addText(g.gtitle, {
      x: M, y, w: CONTENT_W, h: 0.22,
      fontFace: FONT, fontSize: 9, bold: true, color: C.muted, letterSpacing: 2,
    })
    y += 0.3
    g.items.forEach(it => {
      s.addText(it[0], {
        x: M, y, w: 0.45, h: 0.28,
        fontFace: FONT, fontSize: 13, bold: true, color: C.dynamics, align: 'left',
      })
      s.addText(it[1], {
        x: M + 0.5, y, w: 4.0, h: 0.28,
        fontFace: FONT, fontSize: 11.5, bold: true, color: C.ink,
      })
      s.addText(it[2], {
        x: M + 4.6, y, w: CONTENT_W - 4.6, h: 0.28,
        fontFace: FONT, fontSize: 10, color: C.muted,
      })
      y += 0.32
    })
    y += 0.12
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 03 · CONCEPTOS CLAVE
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Conceptos clave', section: '01 · Fundamentos' })
  note(s, 'Cuatro pares de conceptos que sostienen toda la arquitectura del CRM.')

  const cards = [
    { title: 'Oportunidad', subtitle: 'WIP comercial · Microsoft Dynamics',
      body: 'Cualquier registro con posibilidad real de generar facturación, desde 0% a 100% de probabilidad. Cubre advisory, valoración, captación, leasing, venta y consultoría. Vive en Dynamics; el PDB consume y enriquece.',
      accent: C.dynamics },
    { title: 'Instrucción', subtitle: 'Cierre formal · Revenue real',
      body: 'Facturación cerrada: fee, honorarios, formalización contractual. Frontera entre WIP y revenue. Se factura siempre contra una Entidad Legal, no contra la Cuenta.',
      accent: C.warn },
    { title: 'Cuenta vs Entidad Legal', subtitle: 'Relación vs fiscalidad',
      body: 'Cuenta = matriz comercial (Samsung, Merlin, Inditex). Entidad Legal = sociedad fiscal con CIF/NIF (Merlin Offices SL, Merlin Logistics SL). Las Entidades Legales cuelgan de la Cuenta. Facturación → Entidad Legal.',
      accent: C.purple },
    { title: 'Activo vs Oferta', subtitle: 'Estructura vs disponibilidad',
      body: 'Activo = inmueble físico (dato maestro). Oferta = disponibilidad comercializable que cuelga del Activo. La disponibilidad NUNCA se almacena en el Activo; sí puede mostrarse como KPI agregado derivado.',
      accent: C.pdb },
  ]

  const cw = (CONTENT_W - 0.3) / 2
  const ch = 2.25
  cards.forEach((c, i) => {
    const x = M + (i % 2) * (cw + 0.3)
    const y = HEADER_H + 1.2 + Math.floor(i / 2) * (ch + 0.2)
    s.addShape(prs.ShapeType.roundRect, {
      x, y, w: cw, h: ch,
      fill: { color: 'FFFFFF' }, line: { color: C.border, width: 0.75 }, rectRadius: 0.06,
      shadow: { type: 'outer', color: '00000014', blur: 5, offset: 1, angle: 90 },
    })
    s.addShape(prs.ShapeType.rect, { x, y, w: cw, h: 0.05, fill: { color: c.accent }, line: { color: c.accent } })
    s.addText(c.title, {
      x: x + 0.25, y: y + 0.18, w: cw - 0.5, h: 0.4,
      fontFace: FONT, fontSize: 17, bold: true, color: C.ink,
    })
    s.addText(c.subtitle, {
      x: x + 0.25, y: y + 0.62, w: cw - 0.5, h: 0.25,
      fontFace: FONT, fontSize: 10.5, color: c.accent, bold: true,
    })
    s.addText(c.body, {
      x: x + 0.25, y: y + 0.95, w: cw - 0.5, h: ch - 1.0,
      fontFace: FONT, fontSize: 10.5, color: C.ink2, valign: 'top',
    })
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 04 · MAPA DE DEPENDENCIAS — vista de tabla limpia
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Mapa de dependencias', section: '02 · Fundamentos' })
  note(s, 'Cómo se anidan las entidades. Cada módulo declara sus FKs obligatorios y opcionales.')

  // Leyenda
  legendItem(s, { x: M,        y: HEADER_H + 1.1, color: C.dynamics, label: 'Dynamics' })
  legendItem(s, { x: M + 1.7,  y: HEADER_H + 1.1, color: C.pdb,      label: 'PDB' })
  legendItem(s, { x: M + 3.4,  y: HEADER_H + 1.1, color: C.critical, label: 'FK obligatorio' })
  legendItem(s, { x: M + 5.4,  y: HEADER_H + 1.1, color: C.muted,    label: 'FK opcional' })

  const yT = HEADER_H + 1.6
  const rowH = 0.42
  const cols = [
    { label: 'MÓDULO',           w: 2.4 },
    { label: 'SISTEMA',          w: 1.4 },
    { label: 'FK OBLIGATORIOS',  w: 4.0 },
    { label: 'FK OPCIONALES',    w: 4.4 },
  ]

  // Header
  let cx = M
  cols.forEach(c => {
    s.addShape(prs.ShapeType.rect, {
      x: cx, y: yT, w: c.w, h: rowH,
      fill: { color: C.primary }, line: { color: C.primary },
    })
    s.addText(c.label, {
      x: cx + 0.15, y: yT, w: c.w - 0.3, h: rowH,
      fontFace: FONT, fontSize: 9, bold: true, color: 'FFFFFF', letterSpacing: 1,
      align: 'left', valign: 'middle',
    })
    cx += c.w
  })

  const rows = [
    ['Cuenta',              'dyn', '—',                                          '—'],
    ['Contacto',            'dyn', 'Cuenta',                                     '—'],
    ['Entidad Legal',       'dyn', 'Cuenta',                                     '—'],
    ['Oportunidad',         'dyn', 'Cuenta',                                     '—'],
    ['Lead',                'pdb', '—',                                          'Cuenta · Contacto · Activo · Oferta · Demanda'],
    ['Activo',              'pdb', '—',                                          'Cuenta-Propietario'],
    ['Stacking Plan',       'pdb', 'Activo',                                     '—'],
    ['Oferta',              'pdb', 'Activo',                                     '—'],
    ['Demanda',             'pdb', 'Cuenta-Arrendatario · Oportunidad (heredada)','—'],
    ['Negociación',         'pdb', 'Oportunidad',                                'Demanda · Activo · Oferta'],
    ['Mandato',             'pdb', 'Oportunidad + Oferta + Activo',              '—'],
    ['Propuesta / Proyecto','pdb', 'Oportunidad',                                'Demanda · Activo · Oferta'],
    ['Instrucción',         'dyn', 'Oportunidad · Entidad Legal',                '—'],
  ]

  rows.forEach((r, i) => {
    const y = yT + rowH + i * rowH
    const odd = i % 2 === 1
    cx = M
    cols.forEach((c, ci) => {
      s.addShape(prs.ShapeType.rect, {
        x: cx, y, w: c.w, h: rowH,
        fill: { color: odd ? C.borderL : 'FFFFFF' }, line: { color: C.border, width: 0.5 },
      })
      let val = r[ci]
      let color = C.ink2
      let bold = false
      if (ci === 0) { color = C.ink; bold = true }
      if (ci === 1) {
        val = r[1] === 'dyn' ? 'Dynamics' : 'PDB'
        color = r[1] === 'dyn' ? C.dynamics : C.pdb
        bold = true
      }
      if (ci === 2 && val !== '—') color = C.critical
      s.addText(val, {
        x: cx + 0.15, y, w: c.w - 0.3, h: rowH,
        fontFace: FONT, fontSize: 10.5, color, bold,
        align: 'left', valign: 'middle',
      })
      cx += c.w
    })
  })

  // Observación final
  s.addShape(prs.ShapeType.roundRect, {
    x: M, y: H - FOOTER_H - 0.85, w: CONTENT_W, h: 0.55,
    fill: { color: C.bgWarn }, line: { color: C.warn, width: 0.5 }, rectRadius: 0.06,
  })
  s.addText('Activo es independiente: puede existir sin Cuenta-Propietario. El Stacking Plan se construye igual. Pero Mandato exige los tres anclajes (Op + Of + Activo) — esto es lo que evita registros sueltos sin trazabilidad.', {
    x: M + 0.2, y: H - FOOTER_H - 0.78, w: CONTENT_W - 0.4, h: 0.42,
    fontFace: FONT, fontSize: 10.5, color: C.ink2, italic: true, valign: 'middle',
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 05 · CICLO COMERCIAL COMPLETO — timeline horizontal de 9 etapas
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Ciclo comercial completo', section: '03 · End-to-end' })
  note(s, 'De Lead a Transacción · 9 etapas · 3 sistemas (Lead, Dynamics, PDB)')

  // Timeline horizontal con cards conectadas. Pondré una "línea de tiempo"
  // y cada paso como burbuja vertical con su número.
  const yLine = HEADER_H + 2.6
  const yPad  = HEADER_H + 1.2

  const steps = [
    { lane: 'lead', title: 'Lead',          sub: 'captura' },
    { lane: 'dyn',  title: 'Cuenta',        sub: 'fuente verdad' },
    { lane: 'pdb',  title: 'Activo',        sub: 'estructura' },
    { lane: 'pdb',  title: 'Oferta',        sub: 'producto' },
    { lane: 'pdb',  title: 'Demanda',       sub: 'búsqueda' },
    { lane: 'pdb',  title: 'Match',         sub: 'Of ↔ Dem' },
    { lane: 'dyn',  title: 'Oportunidad',   sub: 'WIP · handoff #1' },
    { lane: 'pdb',  title: 'Negociación',   sub: 'condiciones' },
    { lane: 'dyn',  title: 'Instrucción',   sub: 'handoff #2' },
    { lane: 'pdb',  title: 'Transacción',   sub: 'cierre' },
  ]
  const N = steps.length
  const gap = 0.12
  const stepW = (CONTENT_W - (N - 1) * gap) / N
  const stepH = 1.5

  // Línea base detrás
  s.addShape(prs.ShapeType.line, {
    x: M + 0.2, y: yLine, w: CONTENT_W - 0.4, h: 0,
    line: { color: C.border, width: 1.5 },
  })

  steps.forEach((st, i) => {
    const a = laneAccent(st.lane)
    const x = M + i * (stepW + gap)
    // Card vertical compacta
    s.addShape(prs.ShapeType.roundRect, {
      x, y: yPad, w: stepW, h: stepH,
      fill: { color: a.bg }, line: { color: a.color, width: 0.75 }, rectRadius: 0.06,
      shadow: { type: 'outer', color: '00000010', blur: 3, offset: 1, angle: 90 },
    })
    // Acento superior
    s.addShape(prs.ShapeType.rect, { x, y: yPad, w: stepW, h: 0.05, fill: { color: a.color }, line: { color: a.color } })
    // Number
    s.addText(String(i + 1), {
      x, y: yPad + 0.12, w: stepW, h: 0.32,
      fontFace: FONT, fontSize: 13, bold: true, color: a.color, align: 'center',
    })
    // Title
    s.addText(st.title, {
      x: x + 0.05, y: yPad + 0.5, w: stepW - 0.1, h: 0.32,
      fontFace: FONT, fontSize: 11, bold: true, color: C.ink, align: 'center',
    })
    // Sub
    s.addText(st.sub, {
      x: x + 0.05, y: yPad + 0.85, w: stepW - 0.1, h: 0.55,
      fontFace: FONT, fontSize: 9, color: C.muted, align: 'center', valign: 'top',
    })
    // Punto sobre la línea
    s.addShape(prs.ShapeType.ellipse, {
      x: x + stepW / 2 - 0.08, y: yLine - 0.08, w: 0.16, h: 0.16,
      fill: { color: a.color }, line: { color: 'FFFFFF', width: 1.5 },
    })
    // Lane label bajo el punto
    s.addText(a.label, {
      x: x, y: yLine + 0.15, w: stepW, h: 0.22,
      fontFace: FONT, fontSize: 7.5, bold: true, color: a.color, letterSpacing: 1, align: 'center',
    })
  })

  // Sección explicativa
  const ey = yLine + 0.65
  s.addShape(prs.ShapeType.roundRect, {
    x: M, y: ey, w: CONTENT_W, h: 1.55,
    fill: { color: 'FFFFFF' }, line: { color: C.border, width: 0.5 }, rectRadius: 0.06,
  })
  // Tres columnas explicativas
  const colW = (CONTENT_W - 0.6) / 3
  const cols2 = [
    { title: 'ENTRADA · LEAD', body: 'El Lead es el origen real del funnel. Antes de él no hay nada en PDB. Captura automática desde web, portales, formularios y campañas. Se transforma en Oportunidad cuando hay Cuenta o Contacto vinculado.', color: C.warn },
    { title: 'OPERATIVA · PDB', body: 'Activo (estructura), Oferta (disponibilidad) y Demanda (búsqueda) viven en PDB. La Oferta cuelga del Activo. La Demanda machea contra Ofertas vivas, no contra Activos sueltos.', color: C.pdb },
    { title: 'CIERRE · DYNAMICS', body: 'Oportunidad e Instrucción son registros maestros en Dynamics. PDB lanza handoffs y consume sincronizaciones. La Instrucción factura siempre contra una Entidad Legal.', color: C.dynamics },
  ]
  cols2.forEach((c, i) => {
    const x = M + 0.2 + i * (colW + 0.1)
    s.addText(c.title, {
      x, y: ey + 0.15, w: colW, h: 0.25,
      fontFace: FONT, fontSize: 9, bold: true, color: c.color, letterSpacing: 1,
    })
    s.addText(c.body, {
      x, y: ey + 0.42, w: colW, h: 1.0,
      fontFace: FONT, fontSize: 10, color: C.ink2, valign: 'top',
    })
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 06 · LEAD
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Lead — origen del funnel', section: '04 · Entrada' })
  note(s, 'Captura automática desde múltiples canales · cualificación · transformación a Oportunidad.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'lead', title: 'Captura',       sub: 'Web · portales · LinkedIn · campañas · formularios · recomendaciones' },
      { lane: 'lead', title: 'Clasificación', sub: 'Tipo: Demanda · Oferta · Servicio' },
      { lane: 'lead', title: 'Cualificación', sub: 'Actividades · llamadas · validación' },
      { lane: 'lead', title: 'Vinculación',   sub: 'Cuenta o Contacto (obligatorio para transformar)' },
      { lane: 'dyn',  title: 'Transformar',   sub: 'Handoff a Dynamics → crea Oportunidad' },
    ],
  })
  readingBlock(s, 'El Lead es el verdadero punto de entrada. La transformación a Oportunidad exige obligatoriamente Cuenta o Contacto vinculado: sin eso no se puede crear el registro maestro en Dynamics. Tres tipos posibles: Demanda (busca espacio), Oferta (quiere comercializar), Servicio (consultoría/advisory).')
}

// ══════════════════════════════════════════════════════════════════════════
// 07 · CUENTAS Y CONTACTOS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Cuentas y Contactos', section: '05 · Entrada' })
  note(s, 'Núcleo relacional · Dynamics es el sistema maestro · PDB consume y enriquece operativamente.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'dyn', title: 'Alta Cuenta',     sub: 'Datos fiscales y de contacto' },
      { lane: 'dyn', title: 'Sync PDB',        sub: 'Replicación lectura' },
      { lane: 'pdb', title: 'Enriquecimiento', sub: 'Contactos · actividades · histórico' },
      { lane: 'pdb', title: 'Vista 360º',      sub: 'Activos · ofertas · oportunidades · operaciones' },
      { lane: 'pdb', title: 'Roles',           sub: 'Propietario · Arrendatario · Inversor (no excluyentes)' },
    ],
  })
  readingBlock(s, 'La Cuenta es el núcleo relacional. Sobre ella se asientan tres roles posibles: Propietario (cartera de activos), Arrendatario (demandas y contratos), Inversor (transacciones de capital). Las Entidades Legales (CIF/NIF) cuelgan como filiales fiscales.')
}

// ══════════════════════════════════════════════════════════════════════════
// 08 · OPORTUNIDADES
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Oportunidades — WIP comercial', section: '06 · Entrada' })
  note(s, 'Cualquier registro que pueda generar facturación · vive en Dynamics · paraguas de todo el ciclo.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'pdb', title: 'Origen',       sub: 'Lead cualificado · match Of↔Dem · captación · advisory' },
      { lane: 'pdb', title: 'Transformar',  sub: '"Crear oportunidad" → abre Dynamics' },
      { lane: 'dyn', title: 'Creación',     sub: 'Registro maestro WIP en Dynamics' },
      { lane: 'dyn', title: 'Sync vuelta',  sub: 'Visible en PDB · solo lectura' },
      { lane: 'pdb', title: 'Seguimiento',  sub: 'Vinculaciones · actividades · negociación' },
    ],
  })
  readingBlock(s, 'La Oportunidad NO es un estadio del ciclo: es el paraguas. Desde 0% a 100% de probabilidad. Dynamics es el sistema maestro: PDB lanza la transición y consume el registro sincronizado. Mandatos, Propuestas y Negociaciones cuelgan obligatoriamente de una Oportunidad.')
}

// ══════════════════════════════════════════════════════════════════════════
// 09 · ACTIVO
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Activo — base maestra del inmueble', section: '07 · Producto' })
  note(s, 'Estructura física · independiente · puede existir sin Cuenta-Propietario.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'pdb', title: 'Alta',           sub: 'Ref · dirección · uso · SBA' },
      { lane: 'pdb', title: 'Stacking Plan',  sub: 'Plantas · unidades · usos · arr/prop' },
      { lane: 'pdb', title: 'Vinculación',    sub: 'Cuenta-Propietario (opcional pero recomendado)' },
      { lane: 'pdb', title: 'Publicación',    sub: 'Vía Oferta · disponibilidad al mercado' },
      { lane: 'pdb', title: 'KPIs derivados', sub: 'Ocupación · días en mercado (de Ofertas)' },
    ],
  })
  readingBlock(s, 'Activo NO almacena disponibilidad: vive siempre en la Oferta. La ficha del Activo puede mostrar KPIs agregados (ocupación, renta promedio) calculados desde las Ofertas vinculadas, pero los datos no se persisten en él. El Stacking Plan se construye aunque no haya propietario conocido.')
}

// ══════════════════════════════════════════════════════════════════════════
// 10 · STACKING PLAN
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Stacking Plan — distribución del edificio', section: '08 · Producto' })
  note(s, 'Visualización por plantas · usos · propietarios · arrendatarios · ofertas. Componente único compartido.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'pdb', title: 'Configuración',  sub: 'Edificios · plantas sobre/bajo rasante · sup. planta tipo' },
      { lane: 'pdb', title: 'Capa Uso',       sub: 'Usos por planta: oficinas · retail · parking · común' },
      { lane: 'pdb', title: 'Capa Propiedad', sub: 'Propietarios asignados a plantas o unidades' },
      { lane: 'pdb', title: 'Capa Arr/Of.',   sub: 'Arrendatarios actuales + Ofertas activas' },
      { lane: 'pdb', title: 'Edición',        sub: 'Drag & drop · split · convertir Oferta → Arrendatario' },
    ],
  })
  readingBlock(s, 'El Stacking Plan es un componente único reutilizable. Se accede desde la ficha del Activo y desde la ficha de la Oferta — siempre el mismo componente, solo cambia la capa por defecto. Editar desde Oferta persiste igual que desde Activo (autosave a stacking_data).')
}

// ══════════════════════════════════════════════════════════════════════════
// 11 · OFERTA
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Oferta — disponibilidad al mercado', section: '09 · Producto' })
  note(s, 'Producto comercial · cuelga del Activo · existe antes que la demanda concreta que la captura.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'pdb', title: 'Creación',     sub: 'Sobre el Activo (FK obligatorio)' },
      { lane: 'pdb', title: 'Publicación',  sub: 'Activa al mercado · espacios · renta' },
      { lane: 'pdb', title: 'Recepción',    sub: 'Demandas que machean · interés' },
      { lane: 'pdb', title: 'Match',        sub: 'Demanda concreta seleccionada' },
      { lane: 'pdb', title: 'Cierre',       sub: 'Lockeada · handoff Op · retirada' },
    ],
  })
  readingBlock(s, 'La Oferta es el contenedor de mercado, no el de la transacción. La transacción se cierra en la Negociación → Instrucción. Una Oferta puede dar de baja un espacio convirtiéndolo en Arrendatario sobre el Activo (flujo "cerrar oferta → crear arrendatario").')
}

// ══════════════════════════════════════════════════════════════════════════
// 12 · DEMANDA
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Demanda — perfil de búsqueda', section: '10 · Comercialización' })
  note(s, 'Búsqueda activa de un Cuenta-Arrendatario · matching contra Ofertas (no contra Activos sueltos).')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'dyn', title: 'Cuenta-Arr.',   sub: 'FK obligatorio' },
      { lane: 'pdb', title: 'Alta Demanda',  sub: 'Uso · sup · renta máx · zona · break' },
      { lane: 'pdb', title: 'Matching',      sub: 'contra Ofertas vigentes · flexible' },
      { lane: 'pdb', title: 'Visitas',       sub: 'Presencial · virtual · resultados' },
      { lane: 'pdb', title: 'Shortlist',     sub: 'Selección final · handoff a Op WIP' },
    ],
  })
  readingBlock(s, 'El matching parte de los requisitos pero permite flexibilidad comercial: rangos ampliados, alternativas razonables, opciones algo más caras o de superficie próxima. Nunca recomienda Activos sin Oferta vigente.')
}

// ══════════════════════════════════════════════════════════════════════════
// 13 · VISITAS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Visitas — inspección física', section: '11 · Comercialización' })
  note(s, 'Inspección presencial o virtual de espacios · feedback comercial estructurado.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'pdb', title: 'Programación', sub: 'Activo · Demanda · asistentes · fecha' },
      { lane: 'pdb', title: 'Confirmación', sub: 'Calendario · invitaciones · NDA si aplica' },
      { lane: 'pdb', title: 'Realización',  sub: 'Tour · demo · documentación entregada' },
      { lane: 'pdb', title: 'Feedback',     sub: 'Valoración cliente · interés · objeciones' },
      { lane: 'pdb', title: 'Acción',       sub: 'Oferta · 2ª visita · descartar · cualificar más' },
    ],
  })
  readingBlock(s, 'Toda visita queda vinculada al Activo, a la Demanda y al usuario responsable. El feedback alimenta la cualificación: si el interés es alto, se acelera la oferta; si hay objeciones recurrentes, se ajustan los criterios de matching.')
}

// ══════════════════════════════════════════════════════════════════════════
// 14 · NEGOCIACIÓN
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Negociación — hilo formal', section: '12 · Comercialización' })
  note(s, 'Intercambio versionado de condiciones · tabla evolutiva con todas las rondas.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'pdb', title: 'Apertura',     sub: 'Desde Oportunidad WIP · participantes' },
      { lane: 'pdb', title: 'Intercambio',  sub: 'Chat · adjuntos · contraofertas' },
      { lane: 'pdb', title: 'Versionado',   sub: 'Tabla evolutiva · diff de borradores' },
      { lane: 'pdb', title: 'Acuerdo',      sub: 'Firma de condiciones finales' },
      { lane: 'dyn', title: 'Handoff #2',   sub: 'Crear Instrucción en Dynamics' },
    ],
  })
  readingBlock(s, 'No existe contrato sin Instrucción en Dynamics. La Negociación es la última fase operativa en PDB; el cierre formal y la facturación se gestionan exclusivamente desde el sistema maestro. La tabla evolutiva mantiene auditabilidad completa de cada ronda.')
}

// ══════════════════════════════════════════════════════════════════════════
// 15 · INSTRUCCIÓN / TRANSACCIÓN
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Instrucción / Transacción — cierre formal', section: '13 · Cierre' })
  note(s, 'Facturación · única vía válida para registrar revenue · contra Entidad Legal.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'pdb', title: 'Cierre Neg.',  sub: 'Acuerdo final alcanzado' },
      { lane: 'dyn', title: 'Instrucción',  sub: 'Registro maestro en Dynamics' },
      { lane: 'dyn', title: 'Contrato',     sub: 'Formalización + visto bueno legal' },
      { lane: 'pdb', title: 'Transacción',  sub: 'Sync de vuelta · vista lectura' },
      { lane: 'pdb', title: 'Honorarios',   sub: 'Cálculo · emisión · archivo' },
    ],
  })
  readingBlock(s, 'La Instrucción se emite contra una Entidad Legal (sociedad fiscal con CIF/NIF), nunca contra la Cuenta directamente. Esto cierra el ciclo y permite registrar revenue en el reporting. Cualquier modificación posterior a la firma debe gestionarse en Dynamics.')
}

// ══════════════════════════════════════════════════════════════════════════
// 16 · MANDATOS · PROPUESTAS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Mandatos y Propuestas', section: '14 · Cierre' })
  note(s, 'Procesos derivados que cuelgan siempre de una Oportunidad existente.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'dyn', title: 'Oportunidad',  sub: 'FK obligatorio para todo lo siguiente' },
      { lane: 'pdb', title: 'Propuesta',    sub: 'Pitch · RFP · advisory · valoración (FK Op)' },
      { lane: 'pdb', title: 'Mandato',      sub: 'Necesita Op + Oferta + Activo (triple FK)' },
      { lane: 'pdb', title: 'Ejecución',    sub: 'Comercialización · seguimiento · entregables' },
      { lane: 'pdb', title: 'Honorarios',   sub: 'Cálculo · facturación contra E. Legal' },
    ],
  })
  readingBlock(s, 'Mandato y Propuesta nunca nacen solos: ambos exigen FK Oportunidad obligatorio. Mandato exige además FK Oferta y Activo (triple anclaje). Una Propuesta ganada típicamente se transforma en Mandato — y de ahí en operación.')
}

// ══════════════════════════════════════════════════════════════════════════
// 17 · VENCIMIENTOS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Vencimientos — reactivación del ciclo', section: '15 · Cierre' })
  note(s, 'Detección automática de break/fin de contrato · alertas · reentrada en el funnel.')

  renderProcess(s, {
    yTop: HEADER_H + 1.7,
    height: 1.7,
    steps: [
      { lane: 'pdb', title: 'Detección',    sub: 'Motor de fechas · break option · fin contrato' },
      { lane: 'pdb', title: 'Alerta',       sub: 'Badge días restantes · tabla vencimientos' },
      { lane: 'pdb', title: 'Acción',       sub: 'Contacto con arrendatario o propietario' },
      { lane: 'pdb', title: 'Resolución',   sub: 'Renovación · relocation · nueva oportunidad' },
      { lane: 'dyn', title: 'Sync',         sub: 'Update contrato o nueva Oportunidad en Dynamics' },
    ],
  })
  readingBlock(s, 'El motor de vencimientos actúa como reactivador del ciclo comercial: detecta contratos próximos a expirar y dispara alertas con días restantes. La acción comercial deriva en renovación (update contrato Dynamics) o en una nueva Oportunidad (relocation, tenant alternativo, salida).')
}

// ══════════════════════════════════════════════════════════════════════════
// 18 · CIERRE — REGLA DE ORO
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Vínculos críticos · Regla de oro', section: 'Cierre' })
  note(s, 'Las tres reglas duras que mantienen la integridad del ciclo comercial.')

  const reglas = [
    { title: 'Activo + Cuenta-Propietario',
      body: 'Aunque el Activo puede existir sin Cuenta, vincularlo desbloquea la vista 360º del Propietario, el cross-selling, el reporting agregado y la facturación. Un Activo sin Cuenta queda como dato incompleto.',
      accent: C.critical },
    { title: 'Demanda + Cuenta-Arrendatario',
      body: 'No existe Demanda sin Cuenta-Arrendatario. La Cuenta es el origen del interés comercial y permite segmentar, hacer reporting y mantener trazabilidad cuando la búsqueda evoluciona.',
      accent: C.warn },
    { title: 'Oferta + Demanda + Activo',
      body: 'Toda Oferta debe colgar de un Activo. La Demanda machea siempre contra Ofertas vivas. El triángulo Oferta-Demanda-Activo es la unidad mínima que permite cerrar una operación.',
      accent: C.pdb },
  ]

  const cw = (CONTENT_W - 0.4) / 3
  const ch = 2.6
  reglas.forEach((r, i) => {
    const x = M + i * (cw + 0.2)
    const y = HEADER_H + 1.3
    s.addShape(prs.ShapeType.roundRect, {
      x, y, w: cw, h: ch,
      fill: { color: 'FFFFFF' }, line: { color: r.accent, width: 0.75 }, rectRadius: 0.06,
      shadow: { type: 'outer', color: '00000018', blur: 5, offset: 1, angle: 90 },
    })
    s.addShape(prs.ShapeType.rect, { x, y, w: cw, h: 0.06, fill: { color: r.accent }, line: { color: r.accent } })
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
    fontFace: FONT, fontSize: 18, color: 'FFFFFF', align: 'center', valign: 'middle',
  })
}

// ══════════════════════════════════════════════════════════════════════════
await prs.writeFile({ fileName: 'FLUJOS_PDB.pptx' })
console.log(`OK · FLUJOS_PDB.pptx generado (${slideCounter} slides) — diseño v3 limpio`)
