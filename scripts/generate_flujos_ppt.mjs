// PDB · Mapa de Procesos — Generador del PPT (v4 · notación Gane-Sarson)
//
// DFDs formales con la notación Gane-Sarson:
//   · Procesos: rect redondeado con franja superior numerada (P1, P2…)
//   · Entidades externas: rect simple (sin redondear)
//   · Almacenes de datos: rect abierto a la derecha con etiqueta D1, D2…
//   · Flujos de datos: flechas con etiqueta del dato que viaja
//
// Estructura del PPT:
//   01. Portada
//   02. Convenciones notacionales (leyenda)
//   03. Catálogo de entidades externas
//   04. Catálogo de almacenes de datos
//   05. Diagrama de contexto (DFD nivel 0)
//   06. DFD nivel 1 — vista general de procesos
//   07–17. DFD nivel 2 — un diagrama por proceso clave
//   18. Regla de oro / cierre
//
// Uso:  node scripts/generate_flujos_ppt.mjs

import PptxGenJS from 'pptxgenjs'

const prs = new PptxGenJS()
prs.layout  = 'LAYOUT_WIDE'
prs.title   = 'PDB CRM · DFD Gane-Sarson'
prs.author  = 'Savills · PDB Team'
prs.company = 'Savills'

// ── Paleta ──────────────────────────────────────────────────────────────
const C = {
  ink: '0F172A', ink2: '334155', muted: '64748B', hint: '94A3B8',
  bg: 'F8FAFC', surface: 'FFFFFF', border: 'CBD5E1', borderL: 'E2E8F0',
  primary: '0B1F3F',
  // Gane-Sarson usa típicamente colores neutros/sobrios
  process: '1E40AF',     // azul oscuro - procesos
  external: '475569',    // gris pizarra - entidades externas
  store: '0F766E',       // teal - almacenes de datos
  flow: '64748B',        // gris medio - flujos
  // Acentos para clasificación temática
  pdb: '15803D', dynamics: '2563EB', warn: 'D97706', critical: 'B91C1C',
}

// ── Layout ──────────────────────────────────────────────────────────────
const W = 13.33
const H = 7.5
const M = 0.5
const HEADER_H = 0.42
const FOOTER_H = 0.28
const CONTENT_W = W - 2 * M
const FONT = 'Calibri'
const MONO = 'Consolas'

let slideCounter = 0
const TOTAL = 18

// ── Slide master (header + footer) ──────────────────────────────────────
function addSlide({ title = '', section = '', dfdLevel = '' } = {}) {
  slideCounter += 1
  const s = prs.addSlide()
  s.background = { color: C.bg }
  // Header bar
  s.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: W, h: HEADER_H,
    fill: { color: C.primary }, line: { color: C.primary },
  })
  s.addText('PDB', {
    x: M, y: 0, w: 0.6, h: HEADER_H,
    fontFace: FONT, fontSize: 12, bold: true, color: 'FFFFFF',
    align: 'left', valign: 'middle',
  })
  s.addText(section || 'DFD · Gane-Sarson', {
    x: M + 0.7, y: 0, w: 8, h: HEADER_H,
    fontFace: FONT, fontSize: 10, color: 'CBD5E1',
    align: 'left', valign: 'middle',
  })
  s.addText(`${String(slideCounter).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`, {
    x: W - M - 1, y: 0, w: 1, h: HEADER_H,
    fontFace: FONT, fontSize: 9, color: '94A3B8',
    align: 'right', valign: 'middle',
  })
  // Footer
  s.addText('Savills · PDB CRM · 2026 · Notación Gane-Sarson', {
    x: M, y: H - FOOTER_H, w: 6, h: FOOTER_H,
    fontFace: FONT, fontSize: 8, color: C.hint, align: 'left', valign: 'middle',
  })
  s.addText('Confidencial — uso interno', {
    x: W - M - 4, y: H - FOOTER_H, w: 4, h: FOOTER_H,
    fontFace: FONT, fontSize: 8, italic: true, color: C.hint, align: 'right', valign: 'middle',
  })
  // Title + level
  if (title) {
    s.addText(title, {
      x: M, y: HEADER_H + 0.15, w: CONTENT_W - 2.5, h: 0.45,
      fontFace: FONT, fontSize: 20, bold: true, color: C.ink,
      align: 'left', valign: 'top',
    })
    if (dfdLevel) {
      s.addText(dfdLevel, {
        x: W - M - 2.5, y: HEADER_H + 0.22, w: 2.5, h: 0.3,
        fontFace: MONO, fontSize: 10, color: C.muted,
        align: 'right', valign: 'top',
      })
    }
  }
  return s
}

// ── Notación Gane-Sarson ────────────────────────────────────────────────

// PROCESO: rect redondeado con franja superior con número + responsable
function process(s, { x, y, w, h, code, name, owner = '', accent = C.process }) {
  // Sombra suave
  s.addShape(prs.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: 'FFFFFF' }, line: { color: accent, width: 1.25 },
    rectRadius: 0.10,
    shadow: { type: 'outer', color: '00000018', blur: 5, offset: 1.5, angle: 90 },
  })
  // Franja superior con número
  s.addShape(prs.ShapeType.rect, {
    x, y, w, h: 0.32,
    fill: { color: accent }, line: { color: accent },
  })
  s.addText(code, {
    x: x + 0.1, y, w: w - 0.2, h: 0.32,
    fontFace: MONO, fontSize: 10, bold: true, color: 'FFFFFF',
    align: 'left', valign: 'middle',
  })
  if (owner) {
    s.addText(owner, {
      x: x + 0.1, y, w: w - 0.2, h: 0.32,
      fontFace: FONT, fontSize: 8.5, color: 'FFFFFF',
      align: 'right', valign: 'middle',
    })
  }
  // Nombre del proceso
  s.addText(name, {
    x: x + 0.1, y: y + 0.4, w: w - 0.2, h: h - 0.5,
    fontFace: FONT, fontSize: 11, bold: true, color: C.ink,
    align: 'center', valign: 'middle',
  })
}

// ENTIDAD EXTERNA: rectángulo simple con borde grueso
function external(s, { x, y, w, h, name }) {
  s.addShape(prs.ShapeType.rect, {
    x, y, w, h,
    fill: { color: 'FFFFFF' }, line: { color: C.external, width: 1.5 },
    shadow: { type: 'outer', color: '00000010', blur: 3, offset: 1, angle: 135 },
  })
  // Borde interno (efecto doble línea típico Gane-Sarson para entidad)
  s.addShape(prs.ShapeType.rect, {
    x: x + 0.04, y: y + 0.04, w: w - 0.08, h: h - 0.08,
    fill: { color: 'FFFFFF', transparency: 100 }, line: { color: C.external, width: 0.5 },
  })
  s.addText(name, {
    x: x + 0.1, y, w: w - 0.2, h,
    fontFace: FONT, fontSize: 11, bold: true, color: C.external,
    align: 'center', valign: 'middle',
  })
}

// ALMACÉN DE DATOS (Gane-Sarson): rect abierto a la derecha
//   ╔════════════════
// D1║  Nombre del almacén
//   ╚════════════════
function dataStore(s, { x, y, w, h, code, name }) {
  // Bandera lateral izquierda con código D1, D2…
  s.addShape(prs.ShapeType.rect, {
    x, y, w: 0.42, h,
    fill: { color: C.store }, line: { color: C.store },
  })
  s.addText(code, {
    x, y, w: 0.42, h,
    fontFace: MONO, fontSize: 11, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle',
  })
  // Cuerpo del almacén — fondo blanco con bordes superior e inferior (abierto a la derecha)
  s.addShape(prs.ShapeType.rect, {
    x: x + 0.42, y, w: w - 0.42, h,
    fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF', width: 0 },
  })
  // Borde superior
  s.addShape(prs.ShapeType.line, {
    x: x + 0.42, y, w: w - 0.42, h: 0,
    line: { color: C.store, width: 1.25 },
  })
  // Borde inferior
  s.addShape(prs.ShapeType.line, {
    x: x + 0.42, y: y + h, w: w - 0.42, h: 0,
    line: { color: C.store, width: 1.25 },
  })
  s.addText(name, {
    x: x + 0.5, y, w: w - 0.55, h,
    fontFace: FONT, fontSize: 10.5, bold: true, color: C.store,
    align: 'left', valign: 'middle',
  })
}

// FLUJO DE DATOS: línea con flecha + label de dato
function flow(s, { x1, y1, x2, y2, label = null, color = C.flow, dash = false, weight = 1.1, labelOffset = 0 }) {
  s.addShape(prs.ShapeType.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color, width: weight, endArrowType: 'arrow', dashType: dash ? 'dash' : 'solid' },
  })
  if (label) {
    const mx = (x1 + x2) / 2 - 1.0
    const my = (y1 + y2) / 2 - 0.13 + labelOffset
    s.addShape(prs.ShapeType.rect, {
      x: mx, y: my, w: 2.0, h: 0.26,
      fill: { color: C.bg }, line: { color: C.bg, width: 0 },
    })
    s.addText(label, {
      x: mx, y: my, w: 2.0, h: 0.26,
      fontFace: FONT, fontSize: 9, italic: true, color: C.ink2,
      align: 'center', valign: 'middle',
    })
  }
}

// Etiqueta general (para anotaciones)
function caption(s, { x, y, w, text, size = 9, color = C.muted, align = 'left' }) {
  s.addText(text, {
    x, y, w, h: 0.2,
    fontFace: FONT, fontSize: size, color, italic: true, align, valign: 'middle',
  })
}

function note(s, text, y = HEADER_H + 0.72) {
  s.addText(text, {
    x: M, y, w: CONTENT_W, h: 0.3,
    fontFace: FONT, fontSize: 11, color: C.muted, italic: true,
    align: 'left', valign: 'top',
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

  s.addText('PDB', { x: 0.6, y: 0.7, w: 3, h: 0.7, fontFace: FONT, fontSize: 38, bold: true, color: 'FFFFFF' })
  s.addText('PropDatabase CRM', { x: 0.6, y: 1.4, w: 3, h: 0.4, fontFace: FONT, fontSize: 12, color: '94A3B8' })

  s.addText('Savills', { x: 0.6, y: H - 1.3, w: 3, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: 'FFFFFF' })
  s.addText('Departamento de Capital Markets', { x: 0.6, y: H - 0.95, w: 3, h: 0.3, fontFace: FONT, fontSize: 10, color: '94A3B8' })
  s.addText('2026', { x: 0.6, y: H - 0.6, w: 3, h: 0.3, fontFace: FONT, fontSize: 10, color: '94A3B8' })

  s.addText('Diagramas de Flujo de Datos', { x: 4.7, y: 1.9, w: 8.2, h: 0.5, fontFace: FONT, fontSize: 14, color: C.muted })
  s.addText('Mapa de Procesos PDB', { x: 4.7, y: 2.4, w: 8.2, h: 1.0, fontFace: FONT, fontSize: 38, bold: true, color: C.ink, valign: 'top' })
  s.addText('Notación Gane-Sarson', { x: 4.7, y: 3.5, w: 8.2, h: 0.45, fontFace: FONT, fontSize: 18, color: C.process, italic: true })

  s.addShape(prs.ShapeType.line, { x: 4.7, y: 4.2, w: 1.2, h: 0, line: { color: '0EA5E9', width: 2.5 } })
  s.addText('Documento técnico de referencia interno: cada proceso del CRM se describe con un diagrama de flujo de datos (DFD) según la notación clásica Gane-Sarson — procesos numerados, entidades externas, almacenes de datos abiertos a la derecha y flujos de datos etiquetados.', {
    x: 4.7, y: 4.5, w: 8.0, h: 1.6, fontFace: FONT, fontSize: 12, color: C.ink2, italic: true, valign: 'top',
  })

  // Mini-leyenda visual abajo derecha
  const lx = 4.7, ly = H - 1.4
  s.addText('Notación', { x: lx, y: ly - 0.25, w: 8, h: 0.2, fontFace: FONT, fontSize: 9, bold: true, color: C.muted, letterSpacing: 2 })
  // Mini proceso
  s.addShape(prs.ShapeType.roundRect, { x: lx, y: ly, w: 1.4, h: 0.5, fill: { color: 'FFFFFF' }, line: { color: C.process, width: 1 }, rectRadius: 0.08 })
  s.addShape(prs.ShapeType.rect, { x: lx, y: ly, w: 1.4, h: 0.16, fill: { color: C.process }, line: { color: C.process } })
  s.addText('Proceso', { x: lx, y: ly + 0.16, w: 1.4, h: 0.34, fontFace: FONT, fontSize: 9, bold: true, color: C.ink, align: 'center', valign: 'middle' })
  // Mini entidad
  s.addShape(prs.ShapeType.rect, { x: lx + 1.7, y: ly, w: 1.4, h: 0.5, fill: { color: 'FFFFFF' }, line: { color: C.external, width: 1.25 } })
  s.addText('Entidad ext.', { x: lx + 1.7, y: ly, w: 1.4, h: 0.5, fontFace: FONT, fontSize: 9, bold: true, color: C.external, align: 'center', valign: 'middle' })
  // Mini almacén
  s.addShape(prs.ShapeType.rect, { x: lx + 3.4, y: ly, w: 0.32, h: 0.5, fill: { color: C.store }, line: { color: C.store } })
  s.addText('D1', { x: lx + 3.4, y: ly, w: 0.32, h: 0.5, fontFace: MONO, fontSize: 8, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
  s.addShape(prs.ShapeType.line, { x: lx + 3.72, y: ly, w: 1.08, h: 0, line: { color: C.store, width: 1 } })
  s.addShape(prs.ShapeType.line, { x: lx + 3.72, y: ly + 0.5, w: 1.08, h: 0, line: { color: C.store, width: 1 } })
  s.addText('Almacén', { x: lx + 3.78, y: ly, w: 1.0, h: 0.5, fontFace: FONT, fontSize: 9, bold: true, color: C.store, align: 'left', valign: 'middle' })
}

// ══════════════════════════════════════════════════════════════════════════
// 02 · CONVENCIONES NOTACIONALES
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Convenciones notacionales', section: 'Notación Gane-Sarson' })
  note(s, 'Toda lectura de los diagramas siguientes se basa en estos cuatro símbolos.')

  const xL = M
  const yT = HEADER_H + 1.2
  const itemH = 1.5
  const itemW = (CONTENT_W - 0.3) / 2

  const items = [
    {
      x: xL, y: yT, draw: (xx, yy) => {
        // Proceso
        process(s, { x: xx + 0.3, y: yy + 0.2, w: 1.8, h: 1.0, code: 'P3', name: 'Cualificar Lead', owner: 'Broker' })
      },
      title: 'Proceso',
      body: 'Acción del sistema o usuario que transforma entradas en salidas. Se numera (P1, P2…) y siempre lleva un verbo en su nombre. Opcionalmente incluye el actor responsable.',
    },
    {
      x: xL + itemW + 0.3, y: yT, draw: (xx, yy) => {
        external(s, { x: xx + 0.3, y: yy + 0.3, w: 1.8, h: 0.8, name: 'Cliente' })
      },
      title: 'Entidad externa',
      body: 'Origen o destino de datos fuera del sistema. Por ejemplo: Cliente, Banco, Notario, Microsoft Dynamics. No se descompone — son fronteras del sistema.',
    },
    {
      x: xL, y: yT + itemH + 0.3, draw: (xx, yy) => {
        dataStore(s, { x: xx + 0.3, y: yy + 0.4, w: 2.4, h: 0.7, code: 'D4', name: 'Ofertas' })
      },
      title: 'Almacén de datos',
      body: 'Repositorio donde se almacena información persistente. Se identifica con D1, D2… El símbolo es un rectángulo abierto a la derecha (puede leerse y escribirse).',
    },
    {
      x: xL + itemW + 0.3, y: yT + itemH + 0.3, draw: (xx, yy) => {
        flow(s, { x1: xx + 0.4, y1: yy + 0.7, x2: xx + 2.6, y2: yy + 0.7, label: 'datos de la oferta' })
      },
      title: 'Flujo de datos',
      body: 'Movimiento de información entre dos elementos. La flecha indica el sentido y la etiqueta nombra exactamente qué dato concreto viaja por ahí.',
    },
  ]

  items.forEach(it => {
    s.addShape(prs.ShapeType.roundRect, {
      x: it.x, y: it.y, w: itemW, h: itemH,
      fill: { color: 'FFFFFF' }, line: { color: C.borderL, width: 0.75 }, rectRadius: 0.06,
    })
    // Lado izquierdo: dibujo
    it.draw(it.x, it.y)
    // Lado derecho: texto
    s.addText(it.title, {
      x: it.x + 2.7, y: it.y + 0.18, w: itemW - 2.85, h: 0.3,
      fontFace: FONT, fontSize: 14, bold: true, color: C.ink,
    })
    s.addText(it.body, {
      x: it.x + 2.7, y: it.y + 0.5, w: itemW - 2.85, h: itemH - 0.55,
      fontFace: FONT, fontSize: 10.5, color: C.ink2, valign: 'top',
    })
  })

  // Reglas de lectura
  s.addShape(prs.ShapeType.roundRect, {
    x: M, y: H - FOOTER_H - 1.3, w: CONTENT_W, h: 1.0,
    fill: { color: 'FFFFFF' }, line: { color: C.borderL, width: 0.5 }, rectRadius: 0.06,
  })
  s.addText('REGLAS DE LECTURA', {
    x: M + 0.2, y: H - FOOTER_H - 1.22, w: CONTENT_W - 0.4, h: 0.2,
    fontFace: FONT, fontSize: 9, bold: true, color: C.muted, letterSpacing: 2,
  })
  s.addText(
    '· Todo flujo entra o sale de un proceso (no hay flujos directos entre almacenes ni entre entidades externas).  ' +
    '· Cada proceso tiene al menos un flujo de entrada y uno de salida.  ' +
    '· El nombre del flujo describe el dato que viaja, no el medio (decir "datos del lead", no "email").',
    {
      x: M + 0.2, y: H - FOOTER_H - 1.0, w: CONTENT_W - 0.4, h: 0.7,
      fontFace: FONT, fontSize: 10.5, color: C.ink2, valign: 'top',
    }
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 03 · CATÁLOGO ENTIDADES EXTERNAS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Catálogo de entidades externas', section: 'Catálogo' })
  note(s, 'Todos los actores y sistemas que interactúan con el CRM desde fuera de su frontera.')

  const ents = [
    { name: 'Cliente / Empresa',         desc: 'Empresa que busca espacio (arrendatario potencial)' },
    { name: 'Propietario / Inversor',    desc: 'Titular del activo o inversor con interés en producto' },
    { name: 'Microsoft Dynamics 365',    desc: 'Sistema maestro de Cuentas, Contactos, E. Legales, Oportunidades, Instrucciones' },
    { name: 'Web · portales',            desc: 'Web Savills, Idealista, Habitaclia, Belbex, LinkedIn (origen de leads)' },
    { name: 'Catastro · APIs urbanísticas', desc: 'Datos catastrales, edificabilidad, certificaciones ESG' },
    { name: 'Google Maps',               desc: 'Geocodificación, mapa, distancia a transportes' },
    { name: 'Banco · Notaría',           desc: 'Formalización contractual y firma' },
    { name: 'Departamento legal',        desc: 'Visto bueno contractual antes de Instrucción' },
    { name: 'Broker comercial',          desc: 'Usuario operativo que ejecuta el ciclo en el CRM' },
    { name: 'Manager · Director',        desc: 'Aprobación de mandatos, propuestas y pricing' },
  ]

  const cols = 2
  const rowH = 0.55
  const cw = (CONTENT_W - 0.3) / cols
  ents.forEach((e, i) => {
    const x = M + (i % cols) * (cw + 0.3)
    const y = HEADER_H + 1.2 + Math.floor(i / cols) * (rowH + 0.1)
    // Card
    s.addShape(prs.ShapeType.rect, {
      x, y, w: cw, h: rowH,
      fill: { color: 'FFFFFF' }, line: { color: C.external, width: 0.75 },
    })
    s.addShape(prs.ShapeType.rect, {
      x: x + 0.04, y: y + 0.04, w: cw - 0.08, h: rowH - 0.08,
      fill: { color: 'FFFFFF', transparency: 100 }, line: { color: C.external, width: 0.4 },
    })
    s.addText(e.name, {
      x: x + 0.2, y: y + 0.06, w: cw - 0.4, h: 0.22,
      fontFace: FONT, fontSize: 11, bold: true, color: C.external,
    })
    s.addText(e.desc, {
      x: x + 0.2, y: y + 0.27, w: cw - 0.4, h: 0.27,
      fontFace: FONT, fontSize: 9.5, color: C.muted,
    })
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 04 · CATÁLOGO ALMACENES DE DATOS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Catálogo de almacenes de datos', section: 'Catálogo' })
  note(s, 'Repositorios persistentes del CRM. Algunos viven en PDB (Supabase), otros en Microsoft Dynamics.')

  const stores = [
    { code: 'D1',  name: 'Leads',                src: 'PDB' },
    { code: 'D2',  name: 'Cuentas',              src: 'Dynamics' },
    { code: 'D3',  name: 'Contactos',            src: 'Dynamics' },
    { code: 'D4',  name: 'Entidades Legales',    src: 'Dynamics' },
    { code: 'D5',  name: 'Oportunidades',        src: 'Dynamics' },
    { code: 'D6',  name: 'Instrucciones',        src: 'Dynamics' },
    { code: 'D7',  name: 'Activos',              src: 'PDB' },
    { code: 'D8',  name: 'Stacking · plantas',   src: 'PDB' },
    { code: 'D9',  name: 'Ofertas',              src: 'PDB' },
    { code: 'D10', name: 'Demandas',             src: 'PDB' },
    { code: 'D11', name: 'Visitas',              src: 'PDB' },
    { code: 'D12', name: 'Negociaciones',        src: 'PDB' },
    { code: 'D13', name: 'Mandatos',             src: 'PDB' },
    { code: 'D14', name: 'Propuestas / Proyectos', src: 'PDB' },
    { code: 'D15', name: 'Vencimientos',         src: 'PDB' },
    { code: 'D16', name: 'Actividades · Tareas', src: 'PDB' },
  ]

  const cols = 2
  const rowH = 0.46
  const cw = (CONTENT_W - 0.3) / cols
  stores.forEach((d, i) => {
    const x = M + (i % cols) * (cw + 0.3)
    const y = HEADER_H + 1.15 + Math.floor(i / cols) * (rowH + 0.08)
    dataStore(s, { x, y, w: cw - 1.2, h: rowH, code: d.code, name: d.name })
    // Origen badge
    const isDyn = d.src === 'Dynamics'
    s.addShape(prs.ShapeType.roundRect, {
      x: x + cw - 1.1, y: y + 0.08, w: 1.0, h: rowH - 0.16,
      fill: { color: isDyn ? C.dynamics : C.pdb, transparency: 87 },
      line: { color: isDyn ? C.dynamics : C.pdb, width: 0.5 }, rectRadius: 0.04,
    })
    s.addText(d.src, {
      x: x + cw - 1.1, y: y + 0.08, w: 1.0, h: rowH - 0.16,
      fontFace: FONT, fontSize: 9, bold: true, color: isDyn ? C.dynamics : C.pdb,
      align: 'center', valign: 'middle',
    })
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 05 · DFD NIVEL 0 — DIAGRAMA DE CONTEXTO
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Diagrama de contexto', section: '05 · Nivel 0', dfdLevel: 'DFD nivel 0' })
  note(s, 'El CRM como una sola caja, rodeado por las entidades externas que intercambian datos con él.')

  // Centro: caja gigante "Sistema PDB CRM"
  const cx = W / 2
  const cy = HEADER_H + 3.6
  const sysW = 3.4, sysH = 1.4
  s.addShape(prs.ShapeType.roundRect, {
    x: cx - sysW / 2, y: cy - sysH / 2, w: sysW, h: sysH,
    fill: { color: 'FFFFFF' }, line: { color: C.process, width: 2 }, rectRadius: 0.12,
    shadow: { type: 'outer', color: '0000001f', blur: 8, offset: 2, angle: 90 },
  })
  s.addShape(prs.ShapeType.rect, {
    x: cx - sysW / 2, y: cy - sysH / 2, w: sysW, h: 0.4,
    fill: { color: C.process }, line: { color: C.process },
  })
  s.addText('0', { x: cx - sysW / 2 + 0.15, y: cy - sysH / 2, w: 0.4, h: 0.4, fontFace: MONO, fontSize: 13, bold: true, color: 'FFFFFF', align: 'left', valign: 'middle' })
  s.addText('Sistema CRM', { x: cx - sysW / 2, y: cy - sysH / 2, w: sysW, h: 0.4, fontFace: FONT, fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
  s.addText('Property Database', {
    x: cx - sysW / 2, y: cy - sysH / 2 + 0.5, w: sysW, h: sysH - 0.5,
    fontFace: FONT, fontSize: 18, bold: true, color: C.ink, align: 'center', valign: 'middle',
  })

  // Entidades externas alrededor
  const ents = [
    { name: 'Cliente',        x: 1.0, y: 1.3,  flowsIn: ['solicitud de espacio', 'datos contacto'], flowsOut: ['oferta · propuesta'] },
    { name: 'Propietario',    x: 9.7, y: 1.3,  flowsIn: ['mandato comercializar', 'datos activo'], flowsOut: ['contrato · arrendamiento'] },
    { name: 'Web · portales', x: 1.0, y: 5.9,  flowsIn: ['lead capturado'],                       flowsOut: ['anuncio publicado'] },
    { name: 'Dynamics 365',   x: 9.7, y: 5.9,  flowsIn: ['handoff oportunidad', 'cierre instrucc.'],flowsOut: ['cuenta · oport. · instr.'] },
    { name: 'Broker',         x: 5.7, y: 0.85, flowsIn: ['acción operativa'],                     flowsOut: ['vista 360º · alertas'] },
    { name: 'Banco / Notaría',x: 5.7, y: 6.4,  flowsIn: ['contrato firmado'],                     flowsOut: ['confirmación firma'] },
  ]

  ents.forEach(e => {
    external(s, { x: e.x, y: e.y, w: 2.6, h: 0.8, name: e.name })
  })

  // Flechas (entidad → sistema y sistema → entidad)
  // Cliente
  flow(s, { x1: 3.6, y1: 1.7,  x2: cx - sysW / 2 + 0.2, y2: cy - 0.4, label: 'demanda' })
  flow(s, { x1: cx - sysW / 2 + 0.4, y1: cy - 0.2, x2: 3.6, y2: 1.95, label: 'oferta', labelOffset: 0.2 })
  // Propietario
  flow(s, { x1: 9.7, y1: 1.7,  x2: cx + sysW / 2 - 0.2, y2: cy - 0.4, label: 'mandato' })
  flow(s, { x1: cx + sysW / 2 - 0.4, y1: cy - 0.2, x2: 9.7, y2: 1.95, label: 'arrendatario', labelOffset: 0.2 })
  // Web
  flow(s, { x1: 3.6, y1: 6.3,  x2: cx - sysW / 2 + 0.2, y2: cy + 0.4, label: 'lead capturado' })
  // Dynamics
  flow(s, { x1: cx + sysW / 2 - 0.2, y1: cy + 0.4, x2: 9.7, y2: 6.3, label: 'handoff Op./Instr.' })
  flow(s, { x1: 9.7, y1: 6.6,  x2: cx + sysW / 2 - 0.4, y2: cy + 0.6, label: 'sync registros', labelOffset: 0.25, dash: true })
  // Broker
  flow(s, { x1: cx, y1: 1.65, x2: cx, y2: cy - sysH / 2 - 0.05, label: 'acciones operativas' })
  // Banco
  flow(s, { x1: cx, y1: cy + sysH / 2 + 0.05, x2: cx, y2: 6.4, label: 'contrato firmado' })

  caption(s, { x: M, y: H - FOOTER_H - 0.55, w: CONTENT_W,
    text: 'El nivel 0 muestra la frontera del sistema. Los procesos internos se descomponen a partir del nivel 1.',
    align: 'center', size: 10, color: C.muted })
}

// ══════════════════════════════════════════════════════════════════════════
// 06 · DFD NIVEL 1 — VISTA GENERAL
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'DFD nivel 1 — vista general', section: '06 · Nivel 1', dfdLevel: 'DFD nivel 1' })
  note(s, 'Los 11 procesos principales del CRM y sus interacciones con los almacenes de datos.')

  // Layout: 11 procesos en una rejilla 4x3 (last row 3) con almacenes en márgenes
  const procs = [
    { code: 'P1',  name: 'Capturar Lead' },
    { code: 'P2',  name: 'Cualificar y Transformar' },
    { code: 'P3',  name: 'Gestionar Activo' },
    { code: 'P4',  name: 'Construir Stacking' },
    { code: 'P5',  name: 'Publicar Oferta' },
    { code: 'P6',  name: 'Captar Demanda' },
    { code: 'P7',  name: 'Hacer Matching' },
    { code: 'P8',  name: 'Realizar Visita' },
    { code: 'P9',  name: 'Negociar' },
    { code: 'P10', name: 'Cerrar Instrucción' },
    { code: 'P11', name: 'Detectar Vencimiento' },
  ]

  const cols = 4
  const rows = 3
  const pw = 2.6, ph = 0.9
  const gx = 0.4
  const gy = 0.7
  const totalW = cols * pw + (cols - 1) * gx
  const startX = (W - totalW) / 2
  const startY = HEADER_H + 1.25

  procs.forEach((p, i) => {
    const x = startX + (i % cols) * (pw + gx)
    const y = startY + Math.floor(i / cols) * (ph + gy)
    process(s, { x, y, w: pw, h: ph, code: p.code, name: p.name })
  })

  // Flechas que muestran el flujo principal entre procesos
  // Línea horizontal P1→P2
  flow(s, { x1: startX + pw, y1: startY + ph / 2, x2: startX + pw + gx, y2: startY + ph / 2 })
  // P2→P5 (cualificación lleva a publicar oferta o captar demanda)
  flow(s, { x1: startX + 2 * pw + gx, y1: startY + ph / 2, x2: startX + 2 * pw + 2 * gx, y2: startY + ph / 2 })
  // P5→P6
  flow(s, { x1: startX + 3 * pw + 2 * gx, y1: startY + ph / 2, x2: startX + 3 * pw + 3 * gx, y2: startY + ph / 2 })
  // 1ª fila → 2ª (varios down arrows)
  flow(s, { x1: startX + 1.3, y1: startY + ph, x2: startX + 1.3, y2: startY + ph + gy })  // P3
  flow(s, { x1: startX + pw + gx + 1.3, y1: startY + ph, x2: startX + pw + gx + 1.3, y2: startY + ph + gy })
  // Filas 2 → 3 (vertical)
  flow(s, { x1: startX + 1.3, y1: startY + 2 * ph + gy, x2: startX + 1.3, y2: startY + 2 * ph + 2 * gy })
  // Cadena horizontal P9→P10
  flow(s, { x1: startX + 2 * pw + gx, y1: startY + 2 * ph + 2 * gy + ph / 2, x2: startX + 2 * pw + 2 * gx, y2: startY + 2 * ph + 2 * gy + ph / 2 })

  // Pie explicativo
  s.addShape(prs.ShapeType.roundRect, {
    x: M, y: H - FOOTER_H - 0.95, w: CONTENT_W, h: 0.65,
    fill: { color: 'FFFFFF' }, line: { color: C.borderL, width: 0.5 }, rectRadius: 0.06,
  })
  s.addText('Cada proceso se descompone en su propio DFD nivel 2 en las siguientes diapositivas (07–17).', {
    x: M + 0.2, y: H - FOOTER_H - 0.85, w: CONTENT_W - 0.4, h: 0.45,
    fontFace: FONT, fontSize: 10.5, color: C.ink2, italic: true, valign: 'middle',
  })
}

// ══════════════════════════════════════════════════════════════════════════
// HELPER: layout estándar para slides DFD nivel 2
//   Entidad/Almacén izquierda → procesos centrales → Entidad/Almacén derecha
// ══════════════════════════════════════════════════════════════════════════
function dfdL2Slide({ code, title, description, leftEntities = [], leftStores = [], processes = [], rightEntities = [], rightStores = [], flows = [], readingNote }) {
  const s = addSlide({ title, section: code, dfdLevel: 'DFD nivel 2' })
  note(s, description)

  // Coordenadas: tres columnas
  const colLeft = M + 0.3
  const colRight = W - M - 2.6
  const colCenterX = (colLeft + colRight + 2.6) / 2 - 1.4
  const yTop = HEADER_H + 1.6
  const yBottom = H - FOOTER_H - 1.5

  const colW = 2.4
  const procW = 2.6
  const procH = 0.85

  // Left items (entidades arriba, almacenes abajo)
  const leftItems = [
    ...leftEntities.map(e => ({ kind: 'ent', ...e })),
    ...leftStores.map(d => ({ kind: 'store', ...d })),
  ]
  if (leftItems.length > 0) {
    const itemH = 0.8
    const totalH = leftItems.length * itemH + (leftItems.length - 1) * 0.25
    let y = yTop + ((yBottom - yTop) - totalH) / 2
    leftItems.forEach((it, idx) => {
      it._x = colLeft
      it._y = y
      it._w = colW
      it._h = itemH
      if (it.kind === 'ent') external(s, { x: colLeft, y, w: colW, h: itemH, name: it.name })
      else dataStore(s, { x: colLeft, y, w: colW, h: itemH, code: it.code, name: it.name })
      y += itemH + 0.25
    })
  }

  // Right items
  const rightItems = [
    ...rightEntities.map(e => ({ kind: 'ent', ...e })),
    ...rightStores.map(d => ({ kind: 'store', ...d })),
  ]
  if (rightItems.length > 0) {
    const itemH = 0.8
    const totalH = rightItems.length * itemH + (rightItems.length - 1) * 0.25
    let y = yTop + ((yBottom - yTop) - totalH) / 2
    rightItems.forEach((it, idx) => {
      it._x = colRight
      it._y = y
      it._w = colW
      it._h = itemH
      if (it.kind === 'ent') external(s, { x: colRight, y, w: colW, h: itemH, name: it.name })
      else dataStore(s, { x: colRight, y, w: colW, h: itemH, code: it.code, name: it.name })
      y += itemH + 0.25
    })
  }

  // Centre processes — apilados verticalmente
  const totalPH = processes.length * procH + (processes.length - 1) * 0.4
  let py = yTop + ((yBottom - yTop) - totalPH) / 2
  processes.forEach(p => {
    p._x = colCenterX
    p._y = py
    p._w = procW
    p._h = procH
    process(s, { x: colCenterX, y: py, w: procW, h: procH, code: p.code, name: p.name, owner: p.owner })
    py += procH + 0.4
  })

  // Resolve flows: each flow has from/to references (e.g., 'L1' = leftItems[0], 'R2' = rightItems[1], 'P1' = processes[0])
  const findItem = (ref) => {
    if (ref.startsWith('L')) return leftItems[parseInt(ref.slice(1)) - 1]
    if (ref.startsWith('R')) return rightItems[parseInt(ref.slice(1)) - 1]
    if (ref.startsWith('P')) return processes[parseInt(ref.slice(1)) - 1]
    return null
  }
  flows.forEach(f => {
    const a = findItem(f.from)
    const b = findItem(f.to)
    if (!a || !b) return
    // Anchor points: right-edge of A, left-edge of B (o ajustar si verticales)
    const ax = a._x + a._w
    const ay = a._y + a._h / 2
    const bx = b._x
    const by = b._y + b._h / 2
    flow(s, { x1: ax, y1: ay, x2: bx, y2: by, label: f.label, labelOffset: f.offset || 0 })
  })

  if (readingNote) {
    s.addShape(prs.ShapeType.roundRect, {
      x: M, y: H - FOOTER_H - 1.0, w: CONTENT_W, h: 0.7,
      fill: { color: 'FFFFFF' }, line: { color: C.borderL, width: 0.5 }, rectRadius: 0.06,
    })
    s.addText('LECTURA', {
      x: M + 0.2, y: H - FOOTER_H - 0.92, w: CONTENT_W - 0.4, h: 0.2,
      fontFace: FONT, fontSize: 8.5, bold: true, color: C.muted, letterSpacing: 2,
    })
    s.addText(readingNote, {
      x: M + 0.2, y: H - FOOTER_H - 0.7, w: CONTENT_W - 0.4, h: 0.45,
      fontFace: FONT, fontSize: 10.5, color: C.ink2, valign: 'top',
    })
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 07 · P1 · CAPTURAR LEAD
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '07 · P1 — Capturar Lead',
  title: 'Captura de Lead',
  description: 'Cómo entra un lead al sistema y queda almacenado para cualificación posterior.',
  leftEntities: [
    { name: 'Web · portales' },
    { name: 'Cliente' },
    { name: 'Broker' },
  ],
  processes: [
    { code: 'P1.1', name: 'Recibir entrada', owner: 'Sistema' },
    { code: 'P1.2', name: 'Detectar canal', owner: 'Sistema' },
    { code: 'P1.3', name: 'Crear registro', owner: 'Sistema' },
  ],
  rightStores: [
    { code: 'D1', name: 'Leads' },
    { code: 'D16', name: 'Actividades' },
  ],
  flows: [
    { from: 'L1', to: 'P1', label: 'formulario · email · click' },
    { from: 'L2', to: 'P1', label: 'consulta directa' },
    { from: 'L3', to: 'P1', label: 'lead manual' },
    { from: 'P1', to: 'P2', label: 'datos crudos' },
    { from: 'P2', to: 'P3', label: 'canal + tipo sugerido' },
    { from: 'P3', to: 'R1', label: 'lead nuevo' },
    { from: 'P3', to: 'R2', label: 'evento "lead creado"' },
  ],
  readingNote: 'Toda entrada (web, portal, llamada, email, recomendación) se canaliza por P1.1. P1.2 detecta el canal y propone tipo (Demanda/Oferta/Servicio). P1.3 persiste el registro en D1 y deja rastro en D16 (actividad de tipo "captura").',
})

// ══════════════════════════════════════════════════════════════════════════
// 08 · P2 · CUALIFICAR Y TRANSFORMAR
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '08 · P2 — Cualificar y Transformar Lead',
  title: 'Cualificación · Transformación a Oportunidad',
  description: 'El broker cualifica el lead, lo vincula a Cuenta/Contacto y lanza el handoff a Dynamics.',
  leftStores: [
    { code: 'D1',  name: 'Leads' },
    { code: 'D2',  name: 'Cuentas' },
    { code: 'D3',  name: 'Contactos' },
  ],
  processes: [
    { code: 'P2.1', name: 'Cualificar lead',    owner: 'Broker' },
    { code: 'P2.2', name: 'Vincular Cta./Cont.',owner: 'Broker' },
    { code: 'P2.3', name: 'Lanzar handoff',     owner: 'Sistema' },
  ],
  rightEntities: [
    { name: 'Microsoft Dynamics 365' },
  ],
  rightStores: [
    { code: 'D5', name: 'Oportunidades' },
  ],
  flows: [
    { from: 'L1', to: 'P1', label: 'lead candidato' },
    { from: 'L2', to: 'P2', label: 'cuenta existente' },
    { from: 'L3', to: 'P2', label: 'contacto existente' },
    { from: 'P1', to: 'P2', label: 'lead cualificado' },
    { from: 'P2', to: 'P3', label: 'lead + Cta/Cont' },
    { from: 'P3', to: 'R1', label: 'crear oportunidad' },
    { from: 'R1', to: 'R2', label: 'oportunidad creada', offset: 0.1 },
  ],
  readingNote: 'P2.1 ejecuta cualificación BANT (presupuesto, autoridad, necesidad, plazo). P2.2 obliga a vincular Cuenta o Contacto antes de continuar. P2.3 abre Dynamics con datos preasignados; el broker completa allí y la Oportunidad sincroniza de vuelta al PDB.',
})

// ══════════════════════════════════════════════════════════════════════════
// 09 · P3 · GESTIONAR ACTIVO
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '09 · P3 — Gestionar Activo',
  title: 'Gestión del Activo',
  description: 'Alta del activo, vinculación opcional con propietario y enriquecimiento de información.',
  leftEntities: [
    { name: 'Catastro · APIs urbanísticas' },
    { name: 'Google Maps' },
    { name: 'Broker' },
  ],
  processes: [
    { code: 'P3.1', name: 'Alta del activo',   owner: 'Broker' },
    { code: 'P3.2', name: 'Enriquecer datos',  owner: 'Sistema' },
    { code: 'P3.3', name: 'Vincular cuenta',   owner: 'Broker' },
  ],
  rightStores: [
    { code: 'D7', name: 'Activos' },
    { code: 'D2', name: 'Cuentas' },
  ],
  flows: [
    { from: 'L1', to: 'P2', label: 'ref. catastral · ESG' },
    { from: 'L2', to: 'P2', label: 'coordenadas · dirección' },
    { from: 'L3', to: 'P1', label: 'datos básicos del activo' },
    { from: 'P1', to: 'P2', label: 'activo nuevo' },
    { from: 'P2', to: 'P3', label: 'activo enriquecido' },
    { from: 'P3', to: 'R1', label: 'activo persistido' },
    { from: 'P3', to: 'R2', label: 'cuenta-propietario (opcional)' },
  ],
  readingNote: 'Activo es independiente: P3.1 puede crear el registro sin propietario. P3.2 sincroniza con Catastro y Google Maps. P3.3 vincula la Cuenta-Propietario cuando se conozca (FK opcional, recomendado).',
})

// ══════════════════════════════════════════════════════════════════════════
// 10 · P4 · CONSTRUIR STACKING PLAN
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '10 · P4 — Construir Stacking Plan',
  title: 'Construcción del Stacking Plan',
  description: 'Modelado de la distribución física del edificio: plantas, usos, propietarios, arrendatarios.',
  leftEntities: [
    { name: 'Broker' },
  ],
  leftStores: [
    { code: 'D7', name: 'Activos' },
    { code: 'D9', name: 'Ofertas' },
  ],
  processes: [
    { code: 'P4.1', name: 'Configurar edif.', owner: 'Broker' },
    { code: 'P4.2', name: 'Asignar usos',    owner: 'Broker' },
    { code: 'P4.3', name: 'Mapear ocupantes',owner: 'Broker' },
  ],
  rightStores: [
    { code: 'D8', name: 'Stacking · plantas' },
  ],
  flows: [
    { from: 'L1', to: 'P1', label: 'sup. planta · sobre/bajo' },
    { from: 'L2', to: 'P2', label: 'datos del activo' },
    { from: 'L3', to: 'P3', label: 'ofertas vivas' },
    { from: 'P1', to: 'P2', label: 'estructura plantas' },
    { from: 'P2', to: 'P3', label: 'usos por planta' },
    { from: 'P3', to: 'R1', label: 'stacking_data persistido' },
  ],
  readingNote: 'P4.1 crea la estructura del edificio (plantas sobre rasante, sótanos, sup. planta tipo). P4.2 asigna uso a cada planta. P4.3 mapea propietarios y arrendatarios. El componente es único: se accede igual desde Activo y Oferta.',
})

// ══════════════════════════════════════════════════════════════════════════
// 11 · P5 · PUBLICAR OFERTA
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '11 · P5 — Publicar Oferta',
  title: 'Publicación de Oferta',
  description: 'Creación de la oferta sobre un activo y publicación al mercado.',
  leftEntities: [
    { name: 'Broker' },
    { name: 'Manager' },
  ],
  leftStores: [
    { code: 'D7', name: 'Activos' },
  ],
  processes: [
    { code: 'P5.1', name: 'Crear oferta',    owner: 'Broker' },
    { code: 'P5.2', name: 'Definir esp./renta',owner: 'Broker' },
    { code: 'P5.3', name: 'Aprobar y publicar',owner: 'Manager' },
  ],
  rightStores: [
    { code: 'D9', name: 'Ofertas' },
    { code: 'D8', name: 'Stacking · plantas' },
  ],
  flows: [
    { from: 'L1', to: 'P1', label: 'datos comerciales' },
    { from: 'L2', to: 'P3', label: 'visto bueno' },
    { from: 'L3', to: 'P1', label: 'activo + stacking' },
    { from: 'P1', to: 'P2', label: 'oferta borrador' },
    { from: 'P2', to: 'P3', label: 'oferta completa' },
    { from: 'P3', to: 'R1', label: 'oferta publicada' },
    { from: 'P3', to: 'R2', label: 'unidades reservadas' },
  ],
  readingNote: 'Oferta cuelga del Activo (FK obligatorio). P5.2 define superficie, renta, condiciones. La aprobación del Manager (P5.3) es opcional según política. Al publicar, las unidades del stacking se marcan como "ofertadas".',
})

// ══════════════════════════════════════════════════════════════════════════
// 12 · P6 · CAPTAR DEMANDA
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '12 · P6 — Captar Demanda',
  title: 'Captación de Demanda',
  description: 'Registro estructurado de lo que un Cliente busca: uso, superficie, renta máxima, zona.',
  leftEntities: [
    { name: 'Cliente' },
    { name: 'Broker' },
  ],
  leftStores: [
    { code: 'D2', name: 'Cuentas' },
    { code: 'D5', name: 'Oportunidades' },
  ],
  processes: [
    { code: 'P6.1', name: 'Recoger requisitos', owner: 'Broker' },
    { code: 'P6.2', name: 'Validar perfil',     owner: 'Broker' },
    { code: 'P6.3', name: 'Persistir demanda',  owner: 'Sistema' },
  ],
  rightStores: [
    { code: 'D10', name: 'Demandas' },
  ],
  flows: [
    { from: 'L1', to: 'P1', label: 'necesidad concreta' },
    { from: 'L2', to: 'P1', label: 'briefing con cliente' },
    { from: 'L3', to: 'P2', label: 'cuenta-arrendatario (FK)' },
    { from: 'L4', to: 'P3', label: 'oportunidad (FK opcional)' },
    { from: 'P1', to: 'P2', label: 'requisitos en bruto' },
    { from: 'P2', to: 'P3', label: 'demanda validada' },
    { from: 'P3', to: 'R1', label: 'demanda activa' },
  ],
  readingNote: 'Demanda exige Cuenta-Arrendatario (FK obligatorio). P6.1 recoge uso, superficie, renta máx., zona, break option. P6.2 valida coherencia (rangos sensatos, zonas existentes). Si hay Oportunidad vinculada, la Cuenta se hereda.',
})

// ══════════════════════════════════════════════════════════════════════════
// 13 · P7 · MATCHING
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '13 · P7 — Matching Oferta ↔ Demanda',
  title: 'Matching Oferta ↔ Demanda',
  description: 'Cruce flexible entre demanda y ofertas vigentes. Genera shortlist priorizada.',
  leftStores: [
    { code: 'D10', name: 'Demandas' },
    { code: 'D9',  name: 'Ofertas' },
  ],
  processes: [
    { code: 'P7.1', name: 'Filtrar requisitos', owner: 'Sistema' },
    { code: 'P7.2', name: 'Aplicar flexibilidad',owner: 'Sistema' },
    { code: 'P7.3', name: 'Priorizar shortlist',owner: 'Broker' },
  ],
  rightEntities: [
    { name: 'Cliente' },
  ],
  rightStores: [
    { code: 'D14', name: 'Propuestas / Proyectos' },
  ],
  flows: [
    { from: 'L1', to: 'P1', label: 'criterios de búsqueda' },
    { from: 'L2', to: 'P1', label: 'ofertas activas' },
    { from: 'P1', to: 'P2', label: 'matches estrictos' },
    { from: 'P2', to: 'P3', label: 'cumple + flexible + alternativas' },
    { from: 'P3', to: 'R1', label: 'propuesta visual' },
    { from: 'P3', to: 'R2', label: 'propuesta persistida' },
  ],
  readingNote: 'P7.1 filtra estricto (uso, sup., renta máx., zona). P7.2 amplía con tres bandas: cumple requisitos, flexible (±10–20%), alternativas razonables. P7.3 deja al broker priorizar antes de enviar al Cliente.',
})

// ══════════════════════════════════════════════════════════════════════════
// 14 · P8 · VISITA
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '14 · P8 — Realizar Visita',
  title: 'Programación y feedback de Visita',
  description: 'Inspección física del espacio · captura de feedback comercial estructurado.',
  leftEntities: [
    { name: 'Broker' },
    { name: 'Cliente' },
  ],
  leftStores: [
    { code: 'D9',  name: 'Ofertas' },
    { code: 'D10', name: 'Demandas' },
  ],
  processes: [
    { code: 'P8.1', name: 'Programar visita', owner: 'Broker' },
    { code: 'P8.2', name: 'Realizar visita',  owner: 'Broker' },
    { code: 'P8.3', name: 'Capturar feedback',owner: 'Broker' },
  ],
  rightStores: [
    { code: 'D11', name: 'Visitas' },
    { code: 'D16', name: 'Actividades' },
  ],
  flows: [
    { from: 'L1', to: 'P1', label: 'fecha · asistentes' },
    { from: 'L2', to: 'P2', label: 'asistencia confirmada' },
    { from: 'L3', to: 'P1', label: 'oferta a visitar' },
    { from: 'L4', to: 'P1', label: 'demanda asociada' },
    { from: 'P1', to: 'P2', label: 'visita programada' },
    { from: 'P2', to: 'P3', label: 'visita realizada' },
    { from: 'P3', to: 'R1', label: 'visita + feedback' },
    { from: 'P3', to: 'R2', label: 'actividad de visita' },
  ],
  readingNote: 'Cada visita queda vinculada a Oferta + Demanda + responsable. El feedback (interés, objeciones, valoración) alimenta la cualificación posterior. Si el interés es alto → Negociación. Si bajo → ajustar matching o descartar.',
})

// ══════════════════════════════════════════════════════════════════════════
// 15 · P9 · NEGOCIACIÓN
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '15 · P9 — Negociar condiciones',
  title: 'Negociación · hilo formal de condiciones',
  description: 'Intercambio versionado de condiciones entre las partes hasta acuerdo.',
  leftEntities: [
    { name: 'Cliente' },
    { name: 'Broker' },
    { name: 'Propietario' },
  ],
  leftStores: [
    { code: 'D5',  name: 'Oportunidades' },
  ],
  processes: [
    { code: 'P9.1', name: 'Abrir hilo',         owner: 'Broker' },
    { code: 'P9.2', name: 'Iterar contraofertas',owner: 'Broker' },
    { code: 'P9.3', name: 'Firmar acuerdo',     owner: 'Cliente · Prop.' },
  ],
  rightStores: [
    { code: 'D12', name: 'Negociaciones' },
  ],
  rightEntities: [
    { name: 'Microsoft Dynamics 365' },
  ],
  flows: [
    { from: 'L1', to: 'P2', label: 'condiciones cliente' },
    { from: 'L2', to: 'P1', label: 'apertura desde Op.' },
    { from: 'L3', to: 'P2', label: 'contraoferta propietario' },
    { from: 'L4', to: 'P1', label: 'oportunidad (FK obl.)' },
    { from: 'P1', to: 'P2', label: 'hilo abierto' },
    { from: 'P2', to: 'P3', label: 'condiciones finales' },
    { from: 'P3', to: 'R1', label: 'negociación cerrada' },
    { from: 'P3', to: 'R2', label: 'handoff #2 (instrucción)' },
  ],
  readingNote: 'P9.1 requiere Oportunidad (FK obligatorio). P9.2 mantiene tabla evolutiva con cada ronda y diff de borradores. P9.3 dispara handoff a Dynamics para crear la Instrucción — no existe contrato sin ese paso.',
})

// ══════════════════════════════════════════════════════════════════════════
// 16 · P10 · INSTRUCCIÓN Y TRANSACCIÓN
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '16 · P10 — Cerrar Instrucción · Transacción',
  title: 'Instrucción · facturación · cierre formal',
  description: 'Formalización contractual y registro de la facturación contra Entidad Legal.',
  leftStores: [
    { code: 'D12', name: 'Negociaciones' },
    { code: 'D5',  name: 'Oportunidades' },
    { code: 'D4',  name: 'Entidades Legales' },
  ],
  processes: [
    { code: 'P10.1', name: 'Crear Instrucción', owner: 'Broker' },
    { code: 'P10.2', name: 'Firmar contrato',   owner: 'Legal · Notario' },
    { code: 'P10.3', name: 'Emitir honorarios', owner: 'Sistema' },
  ],
  rightEntities: [
    { name: 'Microsoft Dynamics 365' },
    { name: 'Banco · Notaría' },
  ],
  rightStores: [
    { code: 'D6', name: 'Instrucciones' },
  ],
  flows: [
    { from: 'L1', to: 'P1', label: 'condiciones acordadas' },
    { from: 'L2', to: 'P1', label: 'oportunidad madre' },
    { from: 'L3', to: 'P3', label: 'CIF · fiscalidad' },
    { from: 'P1', to: 'P2', label: 'instrucción borrador' },
    { from: 'P2', to: 'P3', label: 'contrato firmado' },
    { from: 'P3', to: 'R1', label: 'sync registro' },
    { from: 'P3', to: 'R2', label: 'orden de pago' },
    { from: 'P3', to: 'R3', label: 'instrucción cerrada' },
  ],
  readingNote: 'P10.1 crea la Instrucción en Dynamics (sistema maestro). P10.2 formaliza el contrato (banco/notaría). P10.3 calcula y emite honorarios contra la Entidad Legal correspondiente. Esto cierra el ciclo y registra revenue.',
})

// ══════════════════════════════════════════════════════════════════════════
// 17 · P11 · VENCIMIENTOS
// ══════════════════════════════════════════════════════════════════════════
dfdL2Slide({
  code: '17 · P11 — Detectar Vencimiento · Reactivar ciclo',
  title: 'Vencimientos · reactivación del ciclo comercial',
  description: 'Motor automático de detección de break/fin de contrato y disparo de acción comercial.',
  leftStores: [
    { code: 'D6', name: 'Instrucciones' },
    { code: 'D8', name: 'Stacking · plantas' },
  ],
  processes: [
    { code: 'P11.1', name: 'Escanear fechas',  owner: 'Sistema' },
    { code: 'P11.2', name: 'Generar alerta',   owner: 'Sistema' },
    { code: 'P11.3', name: 'Disparar acción',  owner: 'Broker' },
  ],
  rightStores: [
    { code: 'D15', name: 'Vencimientos' },
    { code: 'D5',  name: 'Oportunidades' },
  ],
  rightEntities: [
    { name: 'Broker' },
  ],
  flows: [
    { from: 'L1', to: 'P1', label: 'fecha break · fin' },
    { from: 'L2', to: 'P1', label: 'arrendatarios actuales' },
    { from: 'P1', to: 'P2', label: 'contratos próximos' },
    { from: 'P2', to: 'P3', label: 'alerta + días restantes' },
    { from: 'P3', to: 'R1', label: 'vencimiento detectado' },
    { from: 'P3', to: 'R2', label: 'nueva oportunidad (renov./reloc.)' },
    { from: 'P3', to: 'R3', label: 'notificación al broker' },
  ],
  readingNote: 'P11.1 corre periódicamente revisando fechas de contratos vivos. P11.2 emite alertas con días restantes. P11.3 deja al broker decidir: renovación (update Dynamics) o nueva Oportunidad (relocation, tenant alternativo, salida).',
})

// ══════════════════════════════════════════════════════════════════════════
// 18 · CIERRE — REGLA DE ORO
// ══════════════════════════════════════════════════════════════════════════
{
  const s = addSlide({ title: 'Vínculos críticos · Regla de oro', section: 'Cierre' })
  note(s, 'Las tres reglas duras de integridad referencial que mantienen el sistema coherente.')

  const reglas = [
    { title: 'Activo + Cuenta-Propietario', body: 'El Activo puede existir sin Cuenta, pero vincularlo desbloquea la vista 360º del Propietario, el cross-selling, el reporting agregado y la facturación. Activo sin Cuenta = dato incompleto.', accent: C.critical },
    { title: 'Demanda + Cuenta-Arrendatario', body: 'No existe Demanda sin Cuenta-Arrendatario. La Cuenta es el origen del interés comercial y permite segmentar, hacer reporting y mantener trazabilidad cuando la búsqueda evoluciona.', accent: C.warn },
    { title: 'Oferta + Demanda + Activo', body: 'Toda Oferta debe colgar de un Activo. La Demanda machea siempre contra Ofertas vivas. El triángulo Oferta-Demanda-Activo es la unidad mínima que permite cerrar una operación.', accent: C.pdb },
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
    s.addText(`0${i + 1}`, { x: x + 0.25, y: y + 0.2, w: 1, h: 0.5, fontFace: FONT, fontSize: 28, bold: true, color: r.accent })
    s.addText(r.title, { x: x + 0.25, y: y + 0.75, w: cw - 0.5, h: 0.5, fontFace: FONT, fontSize: 14, bold: true, color: C.ink, valign: 'top' })
    s.addText(r.body, { x: x + 0.25, y: y + 1.3, w: cw - 0.5, h: ch - 1.4, fontFace: FONT, fontSize: 11, color: C.ink2, valign: 'top' })
  })

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

await prs.writeFile({ fileName: 'FLUJOS_PDB.pptx' })
console.log(`OK · FLUJOS_PDB.pptx generado (${slideCounter} slides) — notación Gane-Sarson v4`)
