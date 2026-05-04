// Genera docs/procesos-editable.pptx con TODO el contenido como shapes
// nativos de PowerPoint (cajas, flechas, líneas, tablas) — editable
// caja por caja en cualquier versión de PowerPoint o Keynote.
//
// Estructura:
//   1  Cover
//   2  Swim lane Dynamics ↔ PDB · vista global (boxes + flechas)
//   3  Tabla de procesos × responsabilidades (15 filas)
//   4+ Una slide por módulo:
//        - tira contextual (predecesor → este → siguiente, editable)
//        - tabla de campos a cumplimentar (sólo nuevos)
//
// Sin imágenes. Sin Mermaid. Sin Kroki.

import path from 'node:path'
import pptxgen from 'pptxgenjs'

const OUT_PATH = path.join(process.cwd(), 'docs/procesos-editable.pptx')

const C = {
  bg:        'FFFFFF',
  text:      '0F172A',
  text2:     '475569',
  text3:     '94A3B8',
  border:    'E2E8F0',
  border2:   'CBD5E1',
  ink:       '1E293B',
  // Lanes
  dyn_bg:    'EFF6FF',   // azul claro (Dynamics)
  dyn_acc:   '2563EB',
  dyn_lt:    'DBEAFE',
  pdb_bg:    'F0FDF4',   // verde claro (PDB)
  pdb_acc:   '15803D',
  pdb_lt:    'DCFCE7',
  amber:     'B45309',
  amber_lt:  'FEF3C7',
  red:       'DC2626',
  purple:    '7C3AED',
  surface_alt: 'F8FAFC',
}

const pptx = new pptxgen()
pptx.layout  = 'LAYOUT_WIDE' // 13.33" x 7.5"
pptx.author  = 'PDB CRM'
pptx.title   = 'Procesos PDB ↔ Dynamics'
pptx.company = 'PDB'

pptx.defineSlideMaster({
  title: 'BASE',
  background: { color: C.bg },
  objects: [
    { rect: { x: 0, y: 7.10, w: 13.33, h: 0.04, fill: { color: C.dyn_acc } } },
    { text: { text: 'PDB CRM · procesos por módulo · diagrama editable',
              options: { x: 0.4, y: 7.18, w: 9, h: 0.30, fontSize: 9, color: C.text2, fontFace: 'Calibri' } } },
    { text: { text: 'Confidencial · uso interno',
              options: { x: 9.4, y: 7.18, w: 3.6, h: 0.30, fontSize: 9, color: C.text2, align: 'right', fontFace: 'Calibri' } } },
  ],
})

// ─── Helpers ───────────────────────────────────────────────────────
function addCover() {
  const s = pptx.addSlide()
  s.background = { color: C.ink }
  s.addText('PDB CRM', { x: 0.6, y: 1.5, w: 12, h: 0.9, fontSize: 56, bold: true, color: 'FFFFFF', fontFace: 'Calibri' })
  s.addText('Procesos por módulo · diagrama editable',
    { x: 0.6, y: 2.6, w: 12, h: 0.7, fontSize: 28, color: 'CBD5E1', fontFace: 'Calibri' })
  s.addText('Swim lane Dynamics ↔ PDB · campos a cumplimentar por etapa',
    { x: 0.6, y: 3.5, w: 12, h: 0.5, fontSize: 16, color: '94A3B8', fontFace: 'Calibri' })
  s.addShape(pptx.ShapeType.line, { x: 0.6, y: 4.3, w: 4.5, h: 0, line: { color: C.dyn_acc, width: 3 } })
  s.addText('v 2026-05-04 · todas las cajas editables', { x: 0.6, y: 6.4, w: 12, h: 0.4, fontSize: 12, color: '64748B', fontFace: 'Calibri' })
}

function titleBar(s, title, subtitle) {
  if (subtitle) s.addText(subtitle, { x: 0.4, y: 0.08, w: 8, h: 0.22, fontSize: 9, bold: true, color: C.dyn_acc, fontFace: 'Calibri' })
  s.addText(title, { x: 0.4, y: 0.25, w: 12.5, h: 0.45, fontSize: 22, bold: true, color: C.text, fontFace: 'Calibri' })
  s.addShape(pptx.ShapeType.line, { x: 0.4, y: 0.78, w: 12.5, h: 0, line: { color: C.border, width: 0.75 } })
}

// Caja editable con texto centrado
function box(s, { x, y, w, h, label, sub, lane, accent }) {
  // Color según el lane
  let fill, border, color
  if (lane === 'dyn') { fill = 'FFFFFF'; border = C.dyn_acc; color = C.dyn_acc }
  else if (lane === 'pdb') { fill = 'FFFFFF'; border = C.pdb_acc; color = C.pdb_acc }
  else if (lane === 'pdb-current') { fill = C.pdb_acc; border = C.pdb_acc; color = 'FFFFFF' }
  else if (lane === 'dyn-current') { fill = C.dyn_acc; border = C.dyn_acc; color = 'FFFFFF' }
  else { fill = 'FFFFFF'; border = C.border2; color = C.text }
  if (accent) { border = accent; color = accent }

  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: fill },
    line: { color: border, width: 1.25 },
    rectRadius: 0.06,
  })
  // Texto principal
  s.addText(label, {
    x, y: y + (sub ? 0.04 : 0), w, h: sub ? h - 0.18 : h,
    fontSize: 11, bold: true, color, fontFace: 'Calibri', align: 'center', valign: 'middle',
  })
  if (sub) {
    s.addText(sub, {
      x, y: y + h - 0.22, w, h: 0.20,
      fontSize: 8, color, fontFace: 'Calibri', align: 'center', valign: 'middle', italic: true,
    })
  }
}

// Flecha entre dos puntos (con cabeza). Ambos puntos en pulgadas.
function arrow(s, x1, y1, x2, y2, { color = C.text2, label, dashed = false, width = 1.25 } = {}) {
  const dx = x2 - x1, dy = y2 - y1
  s.addShape(pptx.ShapeType.line, {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(dx) || 0.001,
    h: Math.abs(dy) || 0.001,
    flipH: dx < 0,
    flipV: dy < 0,
    line: {
      color, width,
      endArrowType: 'triangle',
      dashType: dashed ? 'dash' : 'solid',
    },
  })
  if (label) {
    const mx = (x1 + x2) / 2 - 0.7
    const my = (y1 + y2) / 2 - 0.13
    s.addText(label, {
      x: mx, y: my, w: 1.4, h: 0.26,
      fontSize: 8, color, fontFace: 'Calibri', align: 'center', italic: true,
      fill: { color: 'FFFFFF' },
    })
  }
}

// Lane background — banda horizontal con etiqueta a la izquierda
function laneBackground(s, { x, y, w, h, fill, label, accentColor }) {
  s.addShape(pptx.ShapeType.rect, {
    x, y, w, h,
    fill: { color: fill },
    line: { color: 'FFFFFF', width: 0 },
  })
  // Etiqueta vertical a la izquierda
  s.addShape(pptx.ShapeType.rect, {
    x, y, w: 0.45, h,
    fill: { color: accentColor },
    line: { color: 'FFFFFF', width: 0 },
  })
  s.addText(label, {
    x: x + 0.02, y, w: 0.45, h,
    fontSize: 11, bold: true, color: 'FFFFFF', fontFace: 'Calibri',
    align: 'center', valign: 'middle', rotate: 270,
  })
}

// ─── Slide 2 · Swim lane global ────────────────────────────────────
function addSwimLaneGlobal() {
  const s = pptx.addSlide({ masterName: 'BASE' })
  titleBar(s, 'Swim lane Dynamics ↔ PDB · vista global', 'Vista de procesos')

  // Lane DYN (top)
  laneBackground(s, { x: 0.4, y: 1.0, w: 12.5, h: 2.2, fill: C.dyn_bg, label: 'DYNAMICS 365', accentColor: C.dyn_acc })
  // Lane PDB (bottom)
  laneBackground(s, { x: 0.4, y: 3.4, w: 12.5, h: 3.4, fill: C.pdb_bg, label: 'PDB · operativo', accentColor: C.pdb_acc })

  // Boxes — Dynamics (lane y centro ~ 2.1)
  const dynY = 1.7
  const dynH = 0.7
  box(s, { x: 1.1, y: dynY, w: 1.7, h: dynH, label: 'Cuenta + Contacto', sub: 'master', lane: 'dyn' })
  box(s, { x: 3.4, y: dynY, w: 1.7, h: dynH, label: 'Oportunidad',       sub: '5 tipos',  lane: 'dyn' })
  box(s, { x: 9.7, y: dynY, w: 1.7, h: dynH, label: 'Instrucción',       sub: 'kickoff → cerrada',  lane: 'dyn' })

  // Boxes — PDB
  // Lead
  box(s, { x: 1.1, y: 4.7, w: 1.7, h: 0.7, label: 'Lead',                sub: 'captura',  lane: 'pdb' })
  // Fork: Propuesta / Demanda / Oferta en y stack
  box(s, { x: 3.4, y: 3.65, w: 1.7, h: 0.55, label: 'Propuesta',         sub: 'vía pitch', lane: 'pdb' })
  box(s, { x: 3.4, y: 4.6,  w: 1.7, h: 0.55, label: 'Demanda',           sub: 'vía directa', lane: 'pdb' })
  box(s, { x: 3.4, y: 5.55, w: 1.7, h: 0.55, label: 'Oferta',            sub: 'vía directa', lane: 'pdb' })
  // Mandato
  box(s, { x: 5.7, y: 4.55, w: 1.7, h: 0.7, label: 'Mandato',            sub: 'opcional', lane: 'pdb' })
  // Matching / Visita
  box(s, { x: 7.7, y: 4.55, w: 1.7, h: 0.7, label: 'Matching · Visita',  sub: 'oferta_demanda', lane: 'pdb' })
  // Negociación
  box(s, { x: 9.7, y: 4.55, w: 1.7, h: 0.7, label: 'Negociación',        sub: 'iteraciones', lane: 'pdb' })
  // Cierre
  box(s, { x: 11.6, y: 4.55, w: 1.4, h: 0.7, label: 'Cierre',            sub: 'arrendatario', lane: 'pdb' })

  // Arrows DYN→DYN
  arrow(s, 2.8,  2.05, 3.4, 2.05, { color: C.dyn_acc })
  arrow(s, 5.1,  2.05, 9.7, 2.05, { color: C.dyn_acc, dashed: true })

  // Arrows PDB→PDB principales
  arrow(s, 2.8,  5.05, 3.4, 4.0, { color: C.pdb_acc, label: 'cualifica · pitch=sí' })
  arrow(s, 2.8,  5.05, 3.4, 4.87, { color: C.pdb_acc, label: 'directa · demanda' })
  arrow(s, 2.8,  5.05, 3.4, 5.82, { color: C.pdb_acc, label: 'directa · oferta' })
  arrow(s, 5.1,  3.92, 5.7, 4.7,  { color: C.pdb_acc, label: 'ganada' })
  arrow(s, 5.1,  4.87, 5.7, 4.87, { color: C.pdb_acc, dashed: true, label: 'firma opcional' })
  arrow(s, 5.1,  5.82, 5.7, 5.1,  { color: C.pdb_acc, dashed: true })
  arrow(s, 7.4,  4.9,  7.7, 4.9,  { color: C.pdb_acc })
  arrow(s, 9.4,  4.9,  9.7, 4.9,  { color: C.pdb_acc })
  arrow(s, 11.4, 4.9,  11.6, 4.9, { color: C.pdb_acc })

  // Arrows cross-lane
  // Lead → Oportunidad (cualificar genera la opp)
  arrow(s, 1.95, 4.7, 4.25, 2.4, { color: C.dyn_acc, label: 'cualifica' })
  // Propuesta ganada → Instrucción
  arrow(s, 5.1,  3.85, 9.7, 2.3, { color: C.dyn_acc, label: 'ganada · INSERT instr' })
  // Negociación firmado → Instrucción (cierre fee)
  arrow(s, 10.55, 4.55, 10.55, 2.4, { color: C.dyn_acc, label: 'firmado · UPDATE cerrada' })

  // Leyenda
  s.addText('► flechas continuas: cascada principal   |   ▷ discontinuas: ramas opcionales', {
    x: 0.4, y: 6.85, w: 12.5, h: 0.25, fontSize: 9, color: C.text3, fontFace: 'Calibri', italic: true,
  })
}

// ─── Slide 3 · Tabla de procesos × responsabilidades ───────────────
const PROCESOS = [
  ['1',  'Captura del Lead',                  '—',                                                  'INSERT lead (estado=nuevo, tipo, via=null)'],
  ['2',  'Cualificación',                     'INSERT oportunidad (broker pide)',                   'UPDATE lead estado=cualificado + INSERT entidad downstream'],
  ['3',  'Pitch (Propuesta)',                 'read-only oportunidad',                              'INSERT propuesta — broker la elabora'],
  ['4',  'Ganar Pitch → Mandato',             'INSERT instrucción (kickoff)',                       'INSERT mandato (vía=pitch, FK propuesta)'],
  ['5',  'Demanda directa',                   'read-only oportunidad',                              'INSERT demanda + (opcional) firma mandato'],
  ['6',  'Oferta directa',                    'read-only oportunidad',                              'INSERT oferta + (opcional) firma mandato'],
  ['7',  'Firma mandato directo (post-hoc)',  'INSERT instrucción',                                 'INSERT mandato (vía=directo) + UPDATE demanda/oferta.mandato_id'],
  ['8',  'Matching',                          '—',                                                  'INSERT oferta_demanda (snapshot condiciones)'],
  ['9',  'Envío al cliente',                  '—',                                                  'INSERT envios_ofertas + microsite'],
  ['10', 'Visita',                            '—',                                                  'INSERT visita (FK alternativa + oferta + demanda + activo)'],
  ['11', 'Negociación',                       '—',                                                  'INSERT negociación + iteraciones (jsonb diff)'],
  ['12', 'Cierre / Firmado',                  'UPDATE instrucción cerrada',                         'UPDATE oferta Ocupada total + INSERT arrendatario + UPDATE stacking'],
  ['13', 'Vencimiento — renovar',             '—',                                                  'UPDATE arrendatario fecha + estado_arr=Renovado'],
  ['14', 'Vencimiento — salir a mercado',     '—',                                                  'INSERT oferta sell-side + UPDATE arrendatario Finalizado'],
  ['15', 'Cancelación / Cierre Mandato',      '—',                                                  'UPDATE mandato + decisión sobre ofertas (desvincular vs retirar)'],
]

function addProcesosTable() {
  const s = pptx.addSlide({ masterName: 'BASE' })
  titleBar(s, 'Procesos × responsabilidades', 'Vista de procesos')

  const header = [
    { text: '#',          options: { bold: true, color: 'FFFFFF', fill: { color: C.ink },     fontSize: 11, fontFace: 'Calibri', align: 'center', valign: 'middle' } },
    { text: 'Proceso',    options: { bold: true, color: 'FFFFFF', fill: { color: C.ink },     fontSize: 11, fontFace: 'Calibri', align: 'left',   valign: 'middle' } },
    { text: 'Dynamics',   options: { bold: true, color: 'FFFFFF', fill: { color: C.dyn_acc }, fontSize: 11, fontFace: 'Calibri', align: 'left',   valign: 'middle' } },
    { text: 'PDB',        options: { bold: true, color: 'FFFFFF', fill: { color: C.pdb_acc }, fontSize: 11, fontFace: 'Calibri', align: 'left',   valign: 'middle' } },
  ]
  const rows = PROCESOS.map(r => [
    { text: r[0], options: { fontSize: 10, color: C.text3, align: 'center', valign: 'middle', fontFace: 'Calibri' } },
    { text: r[1], options: { fontSize: 10, color: C.text,  align: 'left',   valign: 'middle', fontFace: 'Calibri', bold: true } },
    { text: r[2], options: { fontSize: 10, color: C.text,  align: 'left',   valign: 'middle', fontFace: 'Calibri', fill: { color: C.dyn_lt } } },
    { text: r[3], options: { fontSize: 10, color: C.text,  align: 'left',   valign: 'middle', fontFace: 'Calibri', fill: { color: C.pdb_lt } } },
  ])
  s.addTable([header, ...rows], {
    x: 0.4, y: 0.85, w: 12.5,
    colW: [0.5, 3.0, 4.5, 4.5],
    border: { type: 'solid', color: C.border, pt: 0.5 },
    rowH: 0.32, fontFace: 'Calibri',
  })
}

// ─── Per-module slides ─────────────────────────────────────────────
// Cada módulo: tira contextual (predecesor → este → siguiente) + tabla
//   prev: array de boxes [{label, sub, lane}]
//   curr: el box destacado
//   next: array de boxes
//   intro: 1 línea de contexto
//   fields: rows de la tabla
//   inherits: línea pequeña con qué hereda

function addModule(s_index, { title, intro, prev, curr, next, inherits, fields }) {
  const s = pptx.addSlide({ masterName: 'BASE' })
  titleBar(s, title, `Módulo ${s_index}`)

  // Tira contextual horizontal en y=0.95 a 1.85
  const stripY = 0.95
  const boxH = 0.6
  const boxW = 1.6
  const gap = 0.45
  // Layout: [prev boxes ...] arrow [curr] arrow [next boxes ...]
  let cursorX = 0.5
  prev.forEach((b, i) => {
    box(s, { x: cursorX, y: stripY + 0.1, w: boxW, h: boxH, label: b.label, sub: b.sub, lane: b.lane })
    if (i < prev.length - 1) {
      arrow(s, cursorX + boxW, stripY + 0.4, cursorX + boxW + gap, stripY + 0.4, { color: C.text3 })
    }
    cursorX += boxW + gap
  })
  // current (más grande)
  arrow(s, cursorX - gap*0.3, stripY + 0.4, cursorX + 0.05, stripY + 0.4, { color: C.dyn_acc, width: 2 })
  box(s, { x: cursorX + 0.1, y: stripY, w: 1.9, h: boxH + 0.2, label: curr.label, sub: curr.sub, lane: curr.lane === 'dyn' ? 'dyn-current' : 'pdb-current' })
  cursorX += 0.1 + 1.9 + gap
  // next
  next.forEach((b, i) => {
    arrow(s, cursorX - gap*0.7, stripY + 0.4, cursorX, stripY + 0.4, { color: C.text3 })
    box(s, { x: cursorX, y: stripY + 0.1, w: boxW, h: boxH, label: b.label, sub: b.sub, lane: b.lane })
    cursorX += boxW + gap
  })

  // Línea de contexto
  if (intro) {
    s.addText(intro, {
      x: 0.4, y: 1.95, w: 12.5, h: 0.3, fontSize: 11, color: C.text2, italic: true, fontFace: 'Calibri', valign: 'top',
    })
  }
  // Lo que hereda (etiqueta destacada)
  if (inherits) {
    s.addShape(pptx.ShapeType.rect, {
      x: 0.4, y: 2.3, w: 12.5, h: 0.4,
      fill: { color: C.amber_lt },
      line: { color: C.amber, width: 0.75 },
    })
    s.addText('🔗 HEREDA del módulo anterior:  ' + inherits, {
      x: 0.5, y: 2.3, w: 12.4, h: 0.4, fontSize: 11, color: C.amber, bold: true, fontFace: 'Calibri', valign: 'middle',
    })
  }

  // Tabla de campos a cumplimentar
  s.addText('Campos a cumplimentar', {
    x: 0.4, y: 2.85, w: 12.5, h: 0.3, fontSize: 13, bold: true, color: C.text, fontFace: 'Calibri',
  })
  const header = [
    { text: 'Campo',       options: { bold: true, color: 'FFFFFF', fill: { color: C.ink }, fontSize: 11, fontFace: 'Calibri', align: 'left',   valign: 'middle' } },
    { text: 'Tipo',        options: { bold: true, color: 'FFFFFF', fill: { color: C.ink }, fontSize: 11, fontFace: 'Calibri', align: 'left',   valign: 'middle' } },
    { text: 'Obl.',        options: { bold: true, color: 'FFFFFF', fill: { color: C.ink }, fontSize: 11, fontFace: 'Calibri', align: 'center', valign: 'middle' } },
    { text: 'Notas',       options: { bold: true, color: 'FFFFFF', fill: { color: C.ink }, fontSize: 11, fontFace: 'Calibri', align: 'left',   valign: 'middle' } },
  ]
  const rows = fields.map((f, idx) => [
    { text: f[0], options: { fontSize: 10, color: C.text, align: 'left',   valign: 'middle', fontFace: 'Calibri', bold: true,
                             fill: { color: idx % 2 === 0 ? C.surface_alt : 'FFFFFF' } } },
    { text: f[1], options: { fontSize: 10, color: C.text2, align: 'left',  valign: 'middle', fontFace: 'Calibri',
                             fill: { color: idx % 2 === 0 ? C.surface_alt : 'FFFFFF' } } },
    { text: f[2], options: { fontSize: 11, color: f[2] === '✓' ? C.red : (f[2] === '*' ? C.amber : C.text3),
                             align: 'center', valign: 'middle', fontFace: 'Calibri', bold: true,
                             fill: { color: idx % 2 === 0 ? C.surface_alt : 'FFFFFF' } } },
    { text: f[3], options: { fontSize: 10, color: C.text, align: 'left',   valign: 'middle', fontFace: 'Calibri',
                             fill: { color: idx % 2 === 0 ? C.surface_alt : 'FFFFFF' } } },
  ])
  s.addTable([header, ...rows], {
    x: 0.4, y: 3.2, w: 12.5,
    colW: [3.0, 1.5, 0.7, 7.3],
    border: { type: 'solid', color: C.border, pt: 0.5 },
    rowH: 0.28, fontFace: 'Calibri',
  })

  // Leyenda obligatoriedad
  s.addText('✓ obligatorio · * condicional · (vacío) opcional', {
    x: 0.4, y: 6.85, w: 12.5, h: 0.25, fontSize: 9, color: C.text3, italic: true, fontFace: 'Calibri',
  })
}

// ─── Definición de los módulos ─────────────────────────────────────
const MODULES = [
  {
    title: 'Lead — captura',
    intro: 'Punto de entrada. Todos los campos son nuevos: no hay módulo anterior.',
    prev: [],
    curr: { label: 'Lead', sub: 'PDB · estado=nuevo', lane: 'pdb' },
    next: [{ label: 'Oportunidad', sub: 'al cualificar', lane: 'dyn' }],
    inherits: null,
    fields: [
      ['nombre',         'text', '✓', 'Nombre del lead/asunto'],
      ['tipo',           'enum', '✓', 'oferta · demanda · generico'],
      ['descripcion',    'text', '',  'Descripción libre'],
      ['prioridad',      'enum', '',  'baja · media · alta'],
      ['email',          'text', '*', 'Al menos uno (email o teléfono)'],
      ['telefono',       'text', '*', 'Al menos uno (email o teléfono)'],
      ['origen_canal',   'enum', '',  'web · portal · linkedin · recomendacion · directo'],
      ['origen_campana', 'text', '',  'Campaña de origen'],
      ['origen_anuncio', 'text', '',  'Anuncio concreto'],
      ['origen_url',     'text', '',  'URL de la landing/portal'],
    ],
  },

  {
    title: 'Oportunidad (Dynamics) — cualificación del Lead',
    intro: 'Modal TransformarLeadModal. Se crea la oportunidad en Dynamics y la entidad downstream en PDB.',
    prev: [{ label: 'Lead', sub: 'PDB', lane: 'pdb' }],
    curr: { label: 'Oportunidad', sub: 'Dynamics', lane: 'dyn' },
    next: [
      { label: 'Propuesta', sub: 'vía pitch', lane: 'pdb' },
      { label: 'Demanda · Oferta', sub: 'vía directa', lane: 'pdb' },
    ],
    inherits: 'nombre · tipo (derivado de lead.tipo + pitch?)',
    fields: [
      ['cuenta_dynamics_id',    'FK',   '✓', 'Typeahead. Si la cuenta no existe, crearla en Dynamics primero'],
      ['contacto_dynamics_id',  'FK',   '✓', 'Typeahead obligatorio'],
      ['pitch',                 'bool', '✓', 'Decisión del broker: SÍ → Propuesta · NO → Demanda/Oferta directa'],
      ['activo_id',             'FK',   '*', 'Solo si pitch=NO + tipo=oferta'],
    ],
  },

  {
    title: 'Propuesta — solo vía pitch',
    intro: 'El broker elabora la propuesta para competir por el mandato. Solo existe en la rama pitch.',
    prev: [{ label: 'Oportunidad', sub: 'Dynamics', lane: 'dyn' }],
    curr: { label: 'Propuesta', sub: 'PDB', lane: 'pdb' },
    next: [{ label: 'Mandato', sub: 'al ganar', lane: 'pdb' }],
    inherits: 'cuenta · oportunidad · equipo_trabajo (copia editable) · nombre derivado',
    fields: [
      ['nombre',          'text',    '✓', 'Editable; pre-rellenado con nombre de la cuenta'],
      ['tipo',            'enum',    '',  'Pitch · Valoración · Propuesta servicios · Mandato comercial · Consultoría · Urbanismo · Proyecto arquitectura'],
      ['linea',           'enum',    '',  'Línea de negocio'],
      ['fees',            'numeric', '',  'Honorarios estimados'],
      ['fecha_envio',     'date',    '',  'Cuando se envía al cliente'],
      ['fecha_cierre',    'date',    '',  'Auto al ganar/perder'],
      ['motivo_descarte', 'text',    '*', 'Si pasa a perdida'],
    ],
  },

  {
    title: 'Mandato — cascada Propuesta ganada',
    intro: 'Modal MarcarPropuestaGanadaModal. Crea automáticamente la Instrucción Dynamics y el Mandato en PDB.',
    prev: [{ label: 'Propuesta', sub: 'ganada', lane: 'pdb' }],
    curr: { label: 'Mandato', sub: 'PDB · vía pitch', lane: 'pdb' },
    next: [
      { label: 'Instrucción', sub: 'Dynamics', lane: 'dyn' },
      { label: 'Matching · Visita', sub: 'PDB', lane: 'pdb' },
    ],
    inherits: 'cuenta · oportunidad · propuesta_id · equipo_trabajo · responsable · título sugerido',
    fields: [
      ['fee_savills',          'numeric', '✓', '€ — va a la Instrucción Dynamics (lifetime fee)'],
      ['fecha_kickoff',        'date',    '✓', 'Para la Instrucción Dynamics'],
      ['tipo',                 'enum',    '✓', 'alquiler · venta · demanda · consultoria (sugerido por tipo de oportunidad)'],
      ['fecha_firma',          'date',    '✓', 'Default = hoy'],
      ['fecha_vencimiento',    'date',    '',  'Recomendable rellenar para alertas'],
      ['fee_eur_fijo',         'numeric', '',  'Default = fee_savills'],
      ['fee_porcentaje',       'numeric', '',  '% sobre operación (alternativa al fijo)'],
      ['fee_min_garantizado',  'numeric', '',  'Mínimo garantizado'],
      ['exclusividad_modo',    'enum',    '',  'Default exclusiva. Otra opción: coexclusiva'],
      ['cuenta_agente_id',     'FK',     '*',  'Solo si exclusividad_modo=coexclusiva'],
      ['activos_vinculados',   'rel',    '*',  'Mandato_activos. Obligatorio si tipo alquiler/venta'],
      ['preaviso_dias',        'int',     '',  'Default 30'],
      ['alerta_dias',          'int',     '',  'Default 60'],
      ['prorroga_tacita',      'bool',    '',  ''],
    ],
  },

  {
    title: 'Mandato — firma directa post-hoc',
    intro: 'FirmarMandatoModal desde Demanda u Oferta existentes. Crea Instrucción + Mandato y lo enlaza al origen.',
    prev: [{ label: 'Demanda · Oferta', sub: 'sin mandato', lane: 'pdb' }],
    curr: { label: 'Mandato', sub: 'PDB · vía directa', lane: 'pdb' },
    next: [{ label: 'Instrucción', sub: 'Dynamics', lane: 'dyn' }],
    inherits: 'cuenta · oportunidad · equipo_trabajo · FK al origen (demandas/ofertas.mandato_id) · activo (si origen=oferta)',
    fields: [
      ['fee_savills',          'numeric', '✓', '€ — Instrucción Dynamics'],
      ['fecha_kickoff',        'date',    '✓', 'Instrucción Dynamics'],
      ['tipo',                 'enum',    '✓', 'Sugerido según origen: demanda → demanda; oferta → alquiler/venta'],
      ['fecha_firma',          'date',    '✓', 'Default = hoy'],
      ['fecha_vencimiento',    'date',    '',  ''],
      ['fee_eur_fijo',         'numeric', '',  ''],
      ['exclusividad_modo',    'enum',    '',  'Default exclusiva'],
      ['cuenta_agente_id',     'FK',     '*',  'Solo coexclusiva'],
    ],
  },

  {
    title: 'Demanda — buy-side',
    intro: 'Cliente busca espacio. La mayoría de demandas operan SIN mandato (sub-brokering, búsquedas en paralelo).',
    prev: [{ label: 'Oportunidad', sub: 'Dynamics', lane: 'dyn' }],
    curr: { label: 'Demanda', sub: 'PDB', lane: 'pdb' },
    next: [
      { label: 'Mandato', sub: 'opcional', lane: 'pdb' },
      { label: 'Matching', sub: 'pool ofertas', lane: 'pdb' },
    ],
    inherits: 'cuenta · oportunidad · equipo_trabajo · nombre derivado',
    fields: [
      ['requisitos.uso',          'enum',    '✓', 'Oficinas · Logístico · Retail · Residencial · Hotel · Living'],
      ['requisitos.sup_min',      'numeric', '✓', 'm² mínimos'],
      ['requisitos.sup_max',      'numeric', '✓', 'm² máximos'],
      ['requisitos.zonas',        'array',   '',  'Zonas/submercados de interés'],
      ['requisitos.renta_max',    'numeric', '',  '€/m²/mes máximo'],
      ['requisitos.fecha_disp',   'date',    '',  'Cuándo necesita ocupar'],
      ['notas',                   'text',    '',  'Detalles libres'],
    ],
  },

  {
    title: 'Oferta — sell-side',
    intro: 'Activo en mercado. Puede nacer de un lead directo, del portfolio existente, o de un vencimiento.',
    prev: [{ label: 'Activo', sub: 'PDB', lane: 'pdb' }],
    curr: { label: 'Oferta', sub: 'PDB', lane: 'pdb' },
    next: [
      { label: 'Mandato', sub: 'opcional', lane: 'pdb' },
      { label: 'Matching', sub: 'demandas', lane: 'pdb' },
    ],
    inherits: '(cuenta + oportunidad si nace de lead)',
    fields: [
      ['activo_id',                'FK',      '✓', 'Activo a comercializar'],
      ['tipo_operacion',           'enum',    '✓', 'Alquiler · Venta'],
      ['desglose_ofertas',         'rel',     '✓', 'Al menos un espacio (ref interno + sup_min)'],
      ['renta',                    'numeric', '*', '€/m²/mes (alquiler)'],
      ['precio',                   'numeric', '*', '€/m² (venta)'],
      ['fecha_disponibilidad',     'date',    '✓', 'Default hoy. Si nace de un vencimiento → la fecha del vencimiento'],
      ['divisible',                'bool',    '',  'Default true'],
      ['confidencial',             'bool',    '',  'Toggle 🔒'],
      ['asignaciones_stacking',    'rel',     '',  'Asignar el desglose a planta(s) del activo'],
      ['caracteristicas',          'rel',     '',  'Filtro de features del activo a incluir'],
      ['plazas_oferta',            'rel',     '',  'Plazas de parking incluidas'],
    ],
  },

  {
    title: 'Activo',
    intro: 'No hereda de nada (es origen). Se da de alta directamente en el módulo Activos.',
    prev: [],
    curr: { label: 'Activo', sub: 'PDB', lane: 'pdb' },
    next: [
      { label: 'Propietario', sub: 'capa prop', lane: 'pdb' },
      { label: 'Arrendatario', sub: 'capa arr', lane: 'pdb' },
    ],
    inherits: null,
    fields: [
      ['ref',                  'text',    '✓', 'Slug único (ej. MAD-OF-00189)'],
      ['nombre',               'text',    '✓', 'Nombre comercial'],
      ['direccion',            'text',    '✓', ''],
      ['ciudad',               'text',    '✓', ''],
      ['codigo_postal',        'text',    '',  ''],
      ['zona',                 'text',    '',  'Submercado'],
      ['uso',                  'enum',    '✓', 'Oficinas · Logístico · Retail · Residencial · Living · Hotel · Industrial'],
      ['sba',                  'numeric', '✓', 'Superficie bruta arrendable total m²'],
      ['n_edificios',          'int',     '',  'Default 1'],
      ['coordenadas',          'point',   '',  'Latitud / longitud'],
      ['anno_construccion',    'int',     '',  ''],
      ['calidad',              'enum',    '',  'Prime · A · B · C'],
      ['stacking_data',        'jsonb',   '✓', 'Estructura de edificios + plantas (editor visual)'],
    ],
  },

  {
    title: 'Propietario (sobre activo)',
    intro: 'Se crea desde la ficha del activo. La cuenta del propietario se busca en Dynamics.',
    prev: [{ label: 'Activo', sub: 'PDB', lane: 'pdb' }],
    curr: { label: 'Propietario', sub: 'PDB', lane: 'pdb' },
    next: [{ label: 'Stacking', sub: 'arrastrar a planta', lane: 'pdb' }],
    inherits: 'activo_ref (auto)',
    fields: [
      ['propietario',           'FK Cuenta','✓', 'Typeahead Dynamics'],
      ['tipologia',             'enum',     '',  'Asset deal · Share deal · ...'],
      ['anyo_compra',           'int',      '✓', ''],
      ['trimestre',             'enum',     '✓', 'Q1 · Q2 · Q3 · Q4'],
      ['precio_compra',         'text',     '',  'Soporta texto (ej. "130 M€")'],
      ['regimen',               'enum',     '',  'Default Propiedad 100%'],
      ['perfil',                'enum',     '',  'Core · Core+ · Value-add · Opportunistic'],
      ['estrategia',            'enum',     '',  'Hold · Sell · Reposicionamiento'],
      ['cap_rate',              'numeric',  '',  ''],
      ['yield_pct',             'numeric',  '',  ''],
      ['ltv',                   'numeric',  '',  'Estructura de deuda'],
      ['Asignación al stacking','drag&drop','✓', 'Sin arrastrar al stacking, el alta queda incompleta'],
    ],
  },

  {
    title: 'Arrendatario (sobre activo)',
    intro: 'Si nace de cierre de oferta, los datos del cliente se prerrellenan.',
    prev: [{ label: 'Activo', sub: 'o cierre oferta', lane: 'pdb' }],
    curr: { label: 'Arrendatario', sub: 'PDB', lane: 'pdb' },
    next: [{ label: 'Vencimiento', sub: 'al acercarse fin', lane: 'pdb' }],
    inherits: 'activo_ref · (prefilledTenant + sup + fromFloorId si viene de oferta)',
    fields: [
      ['tenant',               'text',    '*', 'Nombre del inquilino. Si tenant_desconocido=true, se omite'],
      ['tenant_desconocido',   'bool',    '',  'Toggle si no se conoce el inquilino actual'],
      ['superficie',           'numeric', '✓', 'm² ocupados'],
      ['closing_rent',         'numeric', '✓', '€/m²/mes acordada'],
      ['fecha_inicio',         'date',    '✓', ''],
      ['fecha_fin',            'date',    '✓', 'Vencimiento contractual'],
      ['break_option',         'date',    '',  'Para alertas'],
      ['meses_carencia',       'int',     '',  ''],
      ['meses_recordatorio',   'int',     '',  'Default 3 (alertar antes del break)'],
      ['tipo_contrato',        'enum',    '',  'LAU · LAU comercial · ...'],
      ['anios_obligado',       'numeric', '',  'Periodo de obligatoriedad'],
      ['sector',               'text',    '',  'Sector del inquilino'],
      ['Asignación al stacking','drag&drop','✓','Auto si nace de cierre de oferta; si no, manual'],
    ],
  },

  {
    title: 'Negociación',
    intro: 'Iteraciones de borrador de contrato hasta el firmado. Versionado de documentos.',
    prev: [{ label: 'Visita', sub: 'positiva', lane: 'pdb' }],
    curr: { label: 'Negociación', sub: 'PDB', lane: 'pdb' },
    next: [
      { label: 'Cierre', sub: 'firmado', lane: 'pdb' },
      { label: 'Instrucción', sub: 'cerrada', lane: 'dyn' },
    ],
    inherits: 'oferta_id · oferta_demanda_id · demanda_id · cuenta_inquilina_id · cuenta_propietaria_id',
    fields: [
      ['condiciones_acordadas',   'jsonb',   '',  'Diff acumulado (renta · carencia · plazos · obras...)'],
      ['documentos_versionados',  'jsonb',   '',  'Array de versiones del borrador de contrato'],
      ['fee_savills_estimado',    'numeric', '',  'Estimación de honorarios'],
      ['fecha_cierre',            'date',    '*', 'Al cerrar'],
      ['motivo_perdida',          'text',    '*', 'Si rechazado'],
    ],
  },

  {
    title: 'Visita',
    intro: 'Trazabilidad triple: visible desde alternativa, oferta, demanda y activo. Una sola fila.',
    prev: [{ label: 'Matching', sub: 'alternativa', lane: 'pdb' }],
    curr: { label: 'Visita', sub: 'PDB', lane: 'pdb' },
    next: [{ label: 'Negociación', sub: 'si positiva', lane: 'pdb' }],
    inherits: 'oferta_demanda_id · oferta_id · activo_id · demanda_id (todos auto)',
    fields: [
      ['fecha',       'datetime', '✓', ''],
      ['asistentes',  'jsonb',    '',  'Broker · cliente · propietario...'],
      ['resultado',   'enum',     '*', 'positiva · neutral · negativa (al completar)'],
      ['notas',       'text',     '',  ''],
    ],
  },

  {
    title: 'Actividad — transversal',
    intro: 'Cualquier ficha tiene "+ Nueva actividad". Las FKs se rellenan según el contexto desde el que se crea.',
    prev: [{ label: 'Cualquier ficha', sub: 'lead/oferta/...', lane: 'pdb' }],
    curr: { label: 'Actividad', sub: 'PDB', lane: 'pdb' },
    next: [],
    inherits: 'FKs del contexto (lead_id · oferta_id · mandato_id · etc.)',
    fields: [
      ['tipo',         'enum',     '✓', 'email · llamada · reunion · nota · tarea'],
      ['asunto',       'text',     '✓', ''],
      ['descripcion',  'text',     '',  ''],
      ['fecha',        'datetime', '✓', ''],
      ['asignado_a',   'text',     '',  'Default = usuario actual'],
      ['estado',       'enum',     '',  'Default abierto → completado / cancelado'],
    ],
  },
]

// ─── Build ─────────────────────────────────────────────────────────
addCover()
addSwimLaneGlobal()
addProcesosTable()
MODULES.forEach((m, i) => addModule(i + 1, m))

await pptx.writeFile({ fileName: OUT_PATH })
console.log(`✓ Generado: ${OUT_PATH}`)
