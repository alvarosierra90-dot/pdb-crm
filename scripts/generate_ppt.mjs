import PptxGenJS from 'pptxgenjs'

const prs = new PptxGenJS()
prs.layout = 'LAYOUT_WIDE'  // 33.87 x 19.05 cm  (16:9 widescreen)

// ── Paleta ─────────────────────────────────────────────────────────────────
const C = {
  dynamics:  { fill:'0078D4', text:'FFFFFF', border:'005A9E' },
  activo:    { fill:'E65100', text:'FFFFFF', border:'BF360C' },
  oferta:    { fill:'2E7D32', text:'FFFFFF', border:'1B5E20' },
  demanda:   { fill:'6A1B9A', text:'FFFFFF', border:'4A148C' },
  contrato:  { fill:'B71C1C', text:'FFFFFF', border:'7F0000' },
  portfolio: { fill:'37474F', text:'FFFFFF', border:'263238' },
  propuesta: { fill:'4E342E', text:'FFFFFF', border:'3E2723' },
  mapa:      { fill:'00838F', text:'FFFFFF', border:'006064' },
  neutral:   { fill:'F5F5F5', text:'333333', border:'BDBDBD' },
  arrow:     'BDBDBD',
  bg:        'FAFAFA',
  titulo:    '1A237E',
  subtitulo: '455A64',
}

// ── Helpers ────────────────────────────────────────────────────────────────
function box(slide, { x, y, w, h, label, sub, scheme, fontSize=11, bold=false }) {
  const s = C[scheme] || C.neutral
  slide.addShape(prs.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: s.fill },
    line: { color: s.border, width: 1.5 },
    rectRadius: 0.08,
    shadow: { type:'outer', color:'00000022', blur:4, offset:2, angle:45 },
  })
  const lines = sub ? `${label}\n${sub}` : label
  slide.addText(lines, {
    x, y, w, h,
    align: 'center', valign: 'middle',
    color: s.text,
    fontSize: fontSize,
    bold: bold,
    fontFace: 'Calibri',
    wrap: true,
  })
}

function arrow(slide, { x1, y1, x2, y2, label, color }) {
  const col = color || C.arrow
  slide.addShape(prs.ShapeType.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color: col, width: 1.5, endArrowType: 'arrow' },
  })
  if (label) {
    const mx = (x1 + x2) / 2 - 0.4
    const my = (y1 + y2) / 2 - 0.13
    slide.addText(label, {
      x: mx, y: my, w: 1.0, h: 0.26,
      align: 'center', fontSize: 7, color: '888888',
      fontFace: 'Calibri',
    })
  }
}

function section(slide, { x, y, w, h, label, color }) {
  slide.addShape(prs.ShapeType.rect, {
    x, y, w, h,
    fill: { color: color || 'F0F4FF', transparency: 80 },
    line: { color: color || 'C5CAE9', width: 1, dashType: 'dash' },
  })
  slide.addText(label, {
    x: x + 0.08, y: y + 0.04, w: w - 0.16, h: 0.22,
    fontSize: 8, bold: true, color: color || '3949AB',
    fontFace: 'Calibri', valign: 'top',
  })
}

function badge(slide, { x, y, label, color, textColor }) {
  slide.addShape(prs.ShapeType.roundRect, {
    x, y, w: 1.1, h: 0.22,
    fill: { color: color || 'E3F2FD' },
    line: { color: color || '90CAF9', width: 1 },
    rectRadius: 0.1,
  })
  slide.addText(label, {
    x, y, w: 1.1, h: 0.22,
    align: 'center', fontSize: 7.5, color: textColor || '1565C0',
    fontFace: 'Calibri', bold: true,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 1 — PORTADA
// ══════════════════════════════════════════════════════════════════════════
const s1 = prs.addSlide()
s1.background = { color: '1A237E' }

s1.addShape(prs.ShapeType.rect, { x:0, y:0, w:13.33, h:0.06, fill:{ color:'FF9800' }, line:{ color:'FF9800' } })
s1.addShape(prs.ShapeType.rect, { x:0, y:7.44, w:13.33, h:0.06, fill:{ color:'FF9800' }, line:{ color:'FF9800' } })

s1.addText('PDB CRM', {
  x:1, y:1.8, w:11.33, h:1.2,
  fontSize:60, bold:true, color:'FFFFFF', fontFace:'Calibri', align:'center',
})
s1.addText('PropDatabase · Arquitectura completa del sistema', {
  x:1, y:3.2, w:11.33, h:0.6,
  fontSize:22, color:'90CAF9', fontFace:'Calibri', align:'center',
})
s1.addText('Módulos · Flujos · Conexiones · Datos', {
  x:1, y:3.9, w:11.33, h:0.4,
  fontSize:14, color:'BBDEFB', fontFace:'Calibri', align:'center',
})

// Legend chips on portada
const chips = [
  ['Dynamics CRM','0078D4'],['Activos','E65100'],['Ofertas','2E7D32'],
  ['Demanda','6A1B9A'],['Contratos','B71C1C'],['Portfolio','37474F'],
  ['Propuestas','4E342E'],['Mapa','00838F'],
]
chips.forEach(([lbl, col], i) => {
  const cx = 1.0 + i * 1.42
  s1.addShape(prs.ShapeType.roundRect, {
    x:cx, y:5.5, w:1.3, h:0.32, fill:{ color:col }, line:{ color:col }, rectRadius:0.05,
  })
  s1.addText(lbl, { x:cx, y:5.5, w:1.3, h:0.32, fontSize:9, color:'FFFFFF', fontFace:'Calibri', align:'center', bold:true })
})

s1.addText('Savills · 2026', {
  x:0, y:6.9, w:13.33, h:0.3,
  fontSize:11, color:'7986CB', fontFace:'Calibri', align:'center',
})

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 2 — MAPA DE MÓDULOS
// ══════════════════════════════════════════════════════════════════════════
const s2 = prs.addSlide()
s2.background = { color: 'FAFAFA' }

s2.addText('Mapa de módulos', {
  x:0.3, y:0.12, w:12.73, h:0.38,
  fontSize:22, bold:true, color:C.titulo, fontFace:'Calibri',
})
s2.addShape(prs.ShapeType.line, { x:0.3, y:0.52, w:12.73, h:0, line:{ color:'E0E0E0', width:1 } })

// ── Sección Dynamics ──
section(s2, { x:0.2, y:0.6, w:2.7, h:5.6, label:'☁️  DYNAMICS CRM  (origen)', color:'0078D4' })
box(s2, { x:0.35, y:1.0,  w:2.4, h:0.6, label:'🏬 Cuentas',     scheme:'dynamics', fontSize:10 })
box(s2, { x:0.35, y:1.72, w:2.4, h:0.6, label:'👤 Contactos',   scheme:'dynamics', fontSize:10 })
box(s2, { x:0.35, y:2.44, w:2.4, h:0.6, label:'⚡ Oportunidades', scheme:'dynamics', fontSize:10 })
box(s2, { x:0.35, y:3.16, w:2.4, h:0.6, label:'🤝 Negociaciones', scheme:'dynamics', fontSize:10 })
box(s2, { x:0.35, y:3.88, w:2.4, h:0.6, label:'✅ Instrucciones', scheme:'dynamics', fontSize:10 })
box(s2, { x:0.35, y:4.6,  w:2.4, h:0.6, label:'📋 Entidades\nLegales', scheme:'dynamics', fontSize:9 })

// ── Sección Activos ──
section(s2, { x:3.1, y:0.6, w:2.7, h:3.0, label:'🏗  ACTIVOS', color:'E65100' })
box(s2, { x:3.25, y:1.0,  w:2.4, h:0.7, label:'Activo', sub:'ref · nombre · zona · uso · SBA', scheme:'activo', fontSize:9 })
box(s2, { x:3.25, y:1.85, w:2.4, h:0.6, label:'📐 Stacking Plan', sub:'edificios · plantas · unidades', scheme:'activo', fontSize:9 })
box(s2, { x:3.25, y:2.6,  w:2.4, h:0.6, label:'🖼 Multimedia\n📄 Documentos', scheme:'neutral', fontSize:9 })

// ── Sección Oferta ──
section(s2, { x:3.1, y:3.75, w:2.7, h:2.45, label:'🏢  OFERTA', color:'2E7D32' })
box(s2, { x:3.25, y:4.15, w:2.4, h:0.7, label:'Oferta', sub:'SBA · renta · estado · activa', scheme:'oferta', fontSize:9 })
box(s2, { x:3.25, y:4.98, w:2.4, h:0.6, label:'Lista Activas /\nDesactivadas', scheme:'oferta', fontSize:9 })

// ── Sección Demanda ──
section(s2, { x:6.0, y:0.6, w:2.7, h:3.0, label:'🔍  DEMANDA', color:'6A1B9A' })
box(s2, { x:6.15, y:1.0,  w:2.4, h:0.8, label:'Demanda', sub:'requisitos · zona\npresupuesto', scheme:'demanda', fontSize:9 })
box(s2, { x:6.15, y:1.95, w:2.4, h:0.6, label:'🏢 Visita', scheme:'demanda', fontSize:10 })
box(s2, { x:6.15, y:2.7,  w:2.4, h:0.6, label:'📤 Propuesta\n(link cliente)', scheme:'demanda', fontSize:9 })

// ── Sección Mapa ──
section(s2, { x:6.0, y:3.75, w:2.7, h:2.45, label:'🗺  MAPA', color:'00838F' })
box(s2, { x:6.15, y:4.15, w:2.4, h:0.8, label:'Mapa interactivo', sub:'ofertas · activos · demanda\nvencimientos · cuentas', scheme:'mapa', fontSize:9 })
box(s2, { x:6.15, y:5.1,  w:2.4, h:0.6, label:'Selección\n→ Propuesta', scheme:'mapa', fontSize:9 })

// ── Sección Contratos ──
section(s2, { x:8.9, y:0.6, w:2.7, h:3.0, label:'📋  CONTRATOS', color:'B71C1C' })
box(s2, { x:9.05, y:1.0,  w:2.4, h:0.7, label:'Propietario', sub:'cuenta · SBA · yield', scheme:'contrato', fontSize:9 })
box(s2, { x:9.05, y:1.85, w:2.4, h:0.8, label:'Arrendatario', sub:'tenant · inicio · break\nvencimiento · renta', scheme:'contrato', fontSize:9 })
box(s2, { x:9.05, y:2.78, w:2.4, h:0.6, label:'Contratos / KYC', scheme:'neutral', fontSize:9 })

// ── Sección Portfolio ──
section(s2, { x:8.9, y:3.75, w:2.7, h:2.45, label:'📊  PORTFOLIO', color:'37474F' })
box(s2, { x:9.05, y:4.15, w:2.4, h:0.6, label:'Portfolios\n(por propietario)', scheme:'portfolio', fontSize:9 })
box(s2, { x:9.05, y:4.88, w:2.4, h:0.6, label:'Vencimientos', scheme:'portfolio', fontSize:10 })
box(s2, { x:9.05, y:5.58, w:2.4, h:0.5, label:'Informes mercado', scheme:'portfolio', fontSize:9 })

// ── Sección Propuestas ──
section(s2, { x:11.8, y:0.6, w:1.4, h:2.0, label:'📤  PROPUESTAS', color:'4E342E' })
box(s2, { x:11.88, y:1.0,  w:1.24, h:0.55, label:'Propuesta', scheme:'propuesta', fontSize:9 })
box(s2, { x:11.88, y:1.65, w:1.24, h:0.55, label:'Mandato', scheme:'propuesta', fontSize:9 })

// ── Arrows slide 2 ──
// Dynamics → Activo
arrow(s2, { x1:2.75, y1:1.3,  x2:3.1,  y2:1.3,  label:'propietario' })
// Dynamics → Demanda
arrow(s2, { x1:2.75, y1:2.02, x2:5.5,  y2:2.02, label:'cliente' })  // too wide, simplified
// Activo → Oferta
arrow(s2, { x1:4.45, y1:3.6,  x2:4.45, y2:4.15, label:'crea' })
// Oferta → Mapa
arrow(s2, { x1:5.65, y1:4.5,  x2:6.0,  y2:4.5 })
// Demanda → Mapa
arrow(s2, { x1:7.35, y1:3.6,  x2:7.35, y2:4.15 })
// Activo → Propietario
arrow(s2, { x1:5.65, y1:1.3,  x2:8.9,  y2:1.3 })
// Oferta (dar de baja) → Arrendatario
arrow(s2, { x1:5.65, y1:4.5,  x2:9.05, y2:2.25, label:'dar de baja' })
// Propietario → Portfolio
arrow(s2, { x1:10.25, y1:3.38, x2:10.25, y2:4.15 })
// Arrendatario → Vencimientos
arrow(s2, { x1:10.85, y1:2.65, x2:11.2,  y2:5.18 })

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 3 — FLUJO COMERCIAL PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
const s3 = prs.addSlide()
s3.background = { color: 'FAFAFA' }

s3.addText('Ciclo comercial completo', {
  x:0.3, y:0.12, w:12.73, h:0.38,
  fontSize:22, bold:true, color:C.titulo, fontFace:'Calibri',
})
s3.addShape(prs.ShapeType.line, { x:0.3, y:0.52, w:12.73, h:0, line:{ color:'E0E0E0', width:1 } })
s3.addText('Flujo secuencial desde la captación del activo hasta el cierre del contrato', {
  x:0.3, y:0.55, w:12.73, h:0.25,
  fontSize:10, color:C.subtitulo, fontFace:'Calibri',
})

// Línea de flujo principal — 10 pasos en horizontal
const steps = [
  { label:'Activo',       sub:'Se crea en PDB',          scheme:'activo',   x:0.25 },
  { label:'Oferta',       sub:'Disponibilidad',           scheme:'oferta',   x:1.55 },
  { label:'Demanda',      sub:'Requisitos cliente',       scheme:'demanda',  x:2.85 },
  { label:'Mapa',         sub:'Filtrar y seleccionar',    scheme:'mapa',     x:4.15 },
  { label:'Visita',       sub:'Visita técnica',           scheme:'demanda',  x:5.45 },
  { label:'Oportunidad',  sub:'→ Dynamics',               scheme:'dynamics', x:6.75 },
  { label:'Negociación',  sub:'Dynamics + link',          scheme:'dynamics', x:8.05 },
  { label:'Instrucción',  sub:'Desde Dynamics',           scheme:'dynamics', x:9.35 },
  { label:'Arrendatario', sub:'Contrato firmado',         scheme:'contrato', x:10.65 },
  { label:'Vencimiento',  sub:'Seguimiento activo',       scheme:'portfolio',x:11.95 },
]

const STEP_W = 1.22
const STEP_H = 1.0
const STEP_Y = 2.6

steps.forEach(({ label, sub, scheme, x }) => {
  box(s3, { x, y:STEP_Y, w:STEP_W, h:STEP_H, label, sub, scheme, fontSize:9, bold:false })
})

// Arrows between steps
for (let i = 0; i < steps.length - 1; i++) {
  arrow(s3, {
    x1: steps[i].x + STEP_W,
    y1: STEP_Y + STEP_H / 2,
    x2: steps[i+1].x,
    y2: STEP_Y + STEP_H / 2,
  })
}

// Step numbers
steps.forEach(({ x }, i) => {
  s3.addShape(prs.ShapeType.ellipse, {
    x: x + STEP_W/2 - 0.18, y: STEP_Y - 0.4, w: 0.36, h: 0.36,
    fill:{ color:'1A237E' }, line:{ color:'1A237E' },
  })
  s3.addText(String(i + 1), {
    x: x + STEP_W/2 - 0.18, y: STEP_Y - 0.4, w: 0.36, h: 0.36,
    fontSize:10, bold:true, color:'FFFFFF', align:'center', valign:'middle', fontFace:'Calibri',
  })
})

// Step labels below
steps.forEach(({ x }, i) => {
  s3.addShape(prs.ShapeType.line, {
    x: x + STEP_W/2, y: STEP_Y - 0.04, w: 0, h: 0.36,
    line:{ color:'BDBDBD', width:1, dashType:'dash' },
  })
})

// ── Rama paralela: Propuesta / Mandato ──
s3.addText('Rama paralela', {
  x:0.3, y:4.4, w:3, h:0.22, fontSize:8, bold:true, color:'4E342E', fontFace:'Calibri',
})
box(s3, { x:2.85, y:4.65, w:1.22, h:0.7, label:'Propuesta', sub:'Shortlist alternativas', scheme:'propuesta', fontSize:9 })
box(s3, { x:4.25, y:4.65, w:1.22, h:0.7, label:'Mandato', sub:'Si se gana el cliente', scheme:'propuesta', fontSize:9 })
arrow(s3, { x1:4.07, y1:5.0, x2:4.25, y2:5.0 })
// Dotted from Demanda down
s3.addShape(prs.ShapeType.line, {
  x:3.46, y:3.6, w:0, h:1.05,
  line:{ color:'9C27B0', width:1.5, dashType:'dash', endArrowType:'arrow' },
})

// ── Anotaciones clave ──
const notes = [
  { x:0.25, y:4.8,  text:'Origen:\nDynamics Cuentas', color:'0078D4' },
  { x:1.55, y:4.8,  text:'Estado:\nDisponible /\nEn negociación', color:'2E7D32' },
  { x:6.75, y:4.8,  text:'Sync\nautomático\nDynamics→PDB', color:'0078D4' },
  { x:10.65, y:4.8, text:'4 vías\nde creación', color:'B71C1C' },
]
notes.forEach(({ x, y, text, color }) => {
  s3.addShape(prs.ShapeType.line, { x:x+0.61, y:STEP_Y+STEP_H, w:0, h:y-STEP_Y-STEP_H-0.1, line:{ color:'E0E0E0', width:1, dashType:'dash' } })
  s3.addText(text, {
    x, y, w:1.22, h:0.8,
    fontSize:8, color, fontFace:'Calibri', align:'center',
    wrap:true,
  })
})

// ── Título de estado ──
s3.addText('Activo  →  Comercialización  →  Dynamics  →  Contrato  →  Seguimiento', {
  x:0.3, y:1.9, w:12.73, h:0.3,
  fontSize:9, color:'9E9E9E', fontFace:'Calibri', align:'center',
})

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 4 — ENTIDADES Y RELACIONES DE DATOS
// ══════════════════════════════════════════════════════════════════════════
const s4 = prs.addSlide()
s4.background = { color: 'FAFAFA' }

s4.addText('Modelo de datos — Entidades y relaciones', {
  x:0.3, y:0.12, w:12.73, h:0.38,
  fontSize:22, bold:true, color:C.titulo, fontFace:'Calibri',
})
s4.addShape(prs.ShapeType.line, { x:0.3, y:0.52, w:12.73, h:0, line:{ color:'E0E0E0', width:1 } })

// Activo — entidad central
box(s4, { x:5.2, y:2.8, w:2.8, h:1.1, label:'ACTIVO', sub:'ref · nombre · zona · uso\nSBA · lat/lng · stacking_data', scheme:'activo', fontSize:9, bold:true })

// Entidades relacionadas alrededor
box(s4, { x:0.3,  y:0.8,  w:2.5, h:1.0, label:'CUENTA\n(Dynamics)', sub:'nombre · sector · contacto', scheme:'dynamics', fontSize:9 })
box(s4, { x:0.3,  y:2.9,  w:2.5, h:0.9, label:'PROPIETARIO', sub:'propietario · yield · precio_compra\nanyo_compra · superficie', scheme:'contrato', fontSize:9 })
box(s4, { x:0.3,  y:5.0,  w:2.5, h:1.0, label:'ARRENDATARIO', sub:'tenant · inicio · break_option\nvencimiento · closing_rent · m2', scheme:'contrato', fontSize:9 })
box(s4, { x:3.6,  y:0.8,  w:2.5, h:1.0, label:'OFERTA', sub:'ref · estado · activa · renta_m2\nsuperficie_disponible · activo_ref', scheme:'oferta', fontSize:9 })
box(s4, { x:7.2,  y:0.8,  w:2.5, h:1.0, label:'NEGOCIACIÓN\n(Dynamics→PDB)', sub:'estado · superficie · renta\nduracion_anos · carencia_meses', scheme:'dynamics', fontSize:9 })
box(s4, { x:10.3, y:0.8,  w:2.4, h:1.0, label:'INSTRUCCIÓN\n(Dynamics)', sub:'cierre · arrendatario\nactivo · condiciones', scheme:'dynamics', fontSize:9 })
box(s4, { x:3.6,  y:5.0,  w:2.5, h:1.0, label:'DEMANDA', sub:'uso · tipología · sba_min/max\nrenta_max · zonas · naturaleza', scheme:'demanda', fontSize:9 })
box(s4, { x:7.2,  y:5.0,  w:2.5, h:1.0, label:'PROPUESTA', sub:'alternativas seleccionadas\nlink cliente · estado', scheme:'propuesta', fontSize:9 })
box(s4, { x:10.3, y:5.0,  w:2.4, h:1.0, label:'MANDATO', sub:'cliente · exclusiva\ncondiciones', scheme:'propuesta', fontSize:9 })
box(s4, { x:10.3, y:3.0,  w:2.4, h:0.9, label:'PORTFOLIOS', sub:'propietario · activos_count\nm2_totales · yield_pct', scheme:'portfolio', fontSize:9 })

// Relaciones
const rels = [
  // Cuenta → Activo
  { x1:2.8,  y1:1.3,  x2:5.2,  y2:3.0,  lbl:'propietario' },
  // Activo → Propietario
  { x1:5.2,  y1:3.35, x2:2.8,  y2:3.35, lbl:'1:N' },
  // Activo → Arrendatario
  { x1:5.2,  y1:3.8,  x2:2.8,  y2:5.5,  lbl:'1:N' },
  // Activo → Oferta
  { x1:5.4,  y1:2.8,  x2:5.4,  y2:1.8,  lbl:'1:N' },
  // Oferta → Negociación
  { x1:6.1,  y1:1.3,  x2:7.2,  y2:1.3,  lbl:'1:1' },
  // Negociación → Instrucción
  { x1:9.7,  y1:1.3,  x2:10.3, y2:1.3,  lbl:'→' },
  // Instrucción → Arrendatario
  { x1:11.5, y1:1.8,  x2:2.8,  y2:5.5 },
  // Demanda → Propuesta
  { x1:6.1,  y1:5.5,  x2:7.2,  y2:5.5,  lbl:'genera' },
  // Propuesta → Mandato
  { x1:9.7,  y1:5.5,  x2:10.3, y2:5.5,  lbl:'si gana' },
  // Propietario → Portfolio
  { x1:2.8,  y1:3.35, x2:10.3, y2:3.45 },
]
rels.forEach(r => arrow(s4, r))

// ── Campos clave Activo central ──
badge(s4, { x:5.2,  y:4.1, label:'lat / lng 🗺', color:'E0F2F1', textColor:'00695C' })
badge(s4, { x:6.55, y:4.1, label:'stacking_data 📐', color:'FFF3E0', textColor:'E65100' })
badge(s4, { x:5.2,  y:4.42, label:'activo_ref FK →', color:'EDE7F6', textColor:'4527A0' })
badge(s4, { x:6.55, y:4.42, label:'supabase UUID', color:'E8EAF6', textColor:'283593' })

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 5 — CREACIÓN DE PROPIETARIOS Y ARRENDATARIOS
// ══════════════════════════════════════════════════════════════════════════
const s5 = prs.addSlide()
s5.background = { color: 'FAFAFA' }

s5.addText('4 vías de creación — Propietarios & Arrendatarios', {
  x:0.3, y:0.12, w:12.73, h:0.38,
  fontSize:22, bold:true, color:C.titulo, fontFace:'Calibri',
})
s5.addShape(prs.ShapeType.line, { x:0.3, y:0.52, w:12.73, h:0, line:{ color:'E0E0E0', width:1 } })

const vias = [
  {
    n:'1',
    title:'Desde FichaActivo\n→ Pestaña at-prop',
    desc:'El broker abre el activo y crea\npropietario o arrendatario\ndirectamente desde la ficha.',
    icon:'🏗',
    color:'E65100',
    x:0.4,
  },
  {
    n:'2',
    title:'Desde FichaOferta\n→ Dar de baja',
    desc:'Al cerrar una oferta disponible,\nel sistema convierte automáticamente\nlas unidades vacantes en arrendadas\ny crea el registro de arrendatario.',
    icon:'🏢',
    color:'2E7D32',
    x:3.55,
  },
  {
    n:'3',
    title:'Desde módulo\nArrendatarios/Propietarios',
    desc:'Creación standalone desde\nla lista del módulo.\nSe asocia manualmente al activo\nmediante activo_ref.',
    icon:'📋',
    color:'B71C1C',
    x:6.7,
  },
  {
    n:'4',
    title:'Desde Instrucción\nDynamics → sync',
    desc:'Dynamics envía la instrucción\nde cierre → PDB crea\nautomáticamente el arrendatario\ncon los datos del contrato.',
    icon:'✅',
    color:'0078D4',
    x:9.85,
  },
]

vias.forEach(({ n, title, desc, icon, color, x }) => {
  // Number circle
  s5.addShape(prs.ShapeType.ellipse, {
    x:x+1.1, y:0.7, w:0.7, h:0.7,
    fill:{ color }, line:{ color },
  })
  s5.addText(n, { x:x+1.1, y:0.7, w:0.7, h:0.7, fontSize:20, bold:true, color:'FFFFFF', align:'center', valign:'middle', fontFace:'Calibri' })

  s5.addText(icon, { x:x+0.15, y:1.6, w:2.7, h:0.5, fontSize:28, align:'center', fontFace:'Segoe UI Emoji' })

  // Card
  s5.addShape(prs.ShapeType.roundRect, {
    x, y:2.2, w:3.0, h:3.5,
    fill:{ color:'FFFFFF' },
    line:{ color, width:2 },
    rectRadius:0.1,
    shadow:{ type:'outer', color:'00000015', blur:6, offset:3, angle:45 },
  })
  s5.addShape(prs.ShapeType.rect, {
    x, y:2.2, w:3.0, h:0.9,
    fill:{ color },
    line:{ color },
  })
  s5.addText(title, {
    x:x+0.1, y:2.22, w:2.8, h:0.86,
    fontSize:10, bold:true, color:'FFFFFF', fontFace:'Calibri', align:'center', valign:'middle', wrap:true,
  })
  s5.addText(desc, {
    x:x+0.15, y:3.2, w:2.7, h:2.2,
    fontSize:9.5, color:'424242', fontFace:'Calibri', align:'center', valign:'middle', wrap:true, lineSpacingMultiple:1.3,
  })

  // Arrow to Activo
  s5.addShape(prs.ShapeType.line, {
    x:x+1.5, y:5.75, w:0, h:0.5,
    line:{ color, width:1.5, dashType:'dash', endArrowType:'arrow' },
  })
})

// Activo central at bottom
box(s5, { x:4.3, y:6.35, w:4.5, h:0.8, label:'ACTIVO + PROPIETARIOS + ARRENDATARIOS  →  Supabase DB', scheme:'activo', fontSize:11, bold:true })

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 6 — MAPA INTERACTIVO
// ══════════════════════════════════════════════════════════════════════════
const s6 = prs.addSlide()
s6.background = { color: '0D1B2A' }

s6.addText('Mapa interactivo', {
  x:0.3, y:0.12, w:12.73, h:0.38,
  fontSize:22, bold:true, color:'FFFFFF', fontFace:'Calibri',
})
s6.addShape(prs.ShapeType.line, { x:0.3, y:0.52, w:12.73, h:0, line:{ color:'37474F', width:1 } })
s6.addText('Google Maps · Capas · Filtros · Zona circular/polígono · Propuesta cliente', {
  x:0.3, y:0.55, w:12.73, h:0.25,
  fontSize:10, color:'90A4AE', fontFace:'Calibri',
})

const layers = [
  { label:'Ofertas',       sub:'verde = Disponible\namber = En negociación', color:'4CAF50', x:0.4,  y:1.1 },
  { label:'Activos',       sub:'ocupación · SBA\nnúmero de plantas', color:'FF9800', x:2.25, y:1.1 },
  { label:'Cuentas',       sub:'propietarios · tenants\nestado relación', color:'2196F3', x:4.1,  y:1.1 },
  { label:'Demanda',       sub:'requisitos · zona\npresupuesto', color:'9C27B0', x:5.95, y:1.1 },
  { label:'Vencimientos',  sub:'break option\nfin contrato', color:'F44336', x:7.8,  y:1.1 },
  { label:'Transacciones', sub:'alquiler · venta\nfecha · precio', color:'607D8B', x:9.65, y:1.1 },
]
layers.forEach(({ label, sub, color, x, y }) => {
  s6.addShape(prs.ShapeType.roundRect, {
    x, y, w:1.7, h:0.85, fill:{ color }, line:{ color }, rectRadius:0.08,
  })
  s6.addText(`${label}\n${sub}`, {
    x:x+0.05, y:y+0.05, w:1.6, h:0.75,
    fontSize:8.5, color:'FFFFFF', fontFace:'Calibri', align:'center', valign:'middle', wrap:true,
  })
})

// Flow desde Demanda
s6.addText('Flujo desde Demanda →', { x:0.3, y:2.35, w:3, h:0.28, fontSize:10, bold:true, color:'CE93D8', fontFace:'Calibri' })
const demSteps = [
  { label:'FichaDemanda\n"Exportar a mapa"', color:'7B1FA2' },
  { label:'Mapa pre-filtrado\n(uso · SBA · renta)', color:'00838F' },
  { label:'Selección\nde pines', color:'00838F' },
  { label:'Propuesta\n(link cliente)', color:'4E342E' },
  { label:'Guardar en\ndemanda', color:'6A1B9A' },
]
demSteps.forEach(({ label, color }, i) => {
  const bx = 0.4 + i * 2.55
  s6.addShape(prs.ShapeType.roundRect, {
    x:bx, y:2.7, w:2.3, h:0.85,
    fill:{ color }, line:{ color: 'FFFFFF', width:1 }, rectRadius:0.08,
  })
  s6.addText(label, { x:bx, y:2.7, w:2.3, h:0.85, fontSize:9, color:'FFFFFF', fontFace:'Calibri', align:'center', valign:'middle', wrap:true })
  if (i < demSteps.length - 1) {
    s6.addShape(prs.ShapeType.line, {
      x:bx+2.3, y:3.125, w:0.25, h:0,
      line:{ color:'FFFFFF', width:1.5, endArrowType:'arrow' },
    })
  }
})

// Zona tools
s6.addText('Herramientas de zona:', { x:0.3, y:4.0, w:3, h:0.25, fontSize:10, bold:true, color:'80DEEA', fontFace:'Calibri' })
;[['◯ Zona circular','00838F'],['⬡ Polígono libre','0288D1'],['🚇 Transporte público','455A64']].forEach(([lbl,col],i) => {
  s6.addShape(prs.ShapeType.roundRect, {
    x:0.4+i*3.0, y:4.3, w:2.7, h:0.55, fill:{ color:col }, line:{ color:'FFFFFF', width:1 }, rectRadius:0.06,
  })
  s6.addText(lbl, { x:0.4+i*3.0, y:4.3, w:2.7, h:0.55, fontSize:10, color:'FFFFFF', fontFace:'Calibri', align:'center', valign:'middle' })
})

s6.addText('Los pins de Ofertas se cargan en tiempo real desde Supabase · Coloreados por estado · Filtros SBA mín/máx y Renta máx disponibles', {
  x:0.3, y:5.3, w:12.73, h:0.35,
  fontSize:9, color:'90A4AE', fontFace:'Calibri', align:'center',
  fill:{ color:'FFFFFF', transparency:95 },
})

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 7 — INTEGRACIÓN DYNAMICS
// ══════════════════════════════════════════════════════════════════════════
const s7 = prs.addSlide()
s7.background = { color: 'FAFAFA' }

s7.addText('Integración Dynamics CRM', {
  x:0.3, y:0.12, w:12.73, h:0.38,
  fontSize:22, bold:true, color:C.titulo, fontFace:'Calibri',
})
s7.addShape(prs.ShapeType.line, { x:0.3, y:0.52, w:12.73, h:0, line:{ color:'E0E0E0', width:1 } })

// Two columns
// PDB side
s7.addShape(prs.ShapeType.rect, { x:0.3, y:0.7, w:5.5, h:6.0, fill:{ color:'E8F5E9', transparency:20 }, line:{ color:'4CAF50', width:1.5 } })
s7.addText('🟢  PDB CRM', { x:0.4, y:0.72, w:5.3, h:0.28, fontSize:13, bold:true, color:'2E7D32', fontFace:'Calibri' })

// Dynamics side
s7.addShape(prs.ShapeType.rect, { x:7.2, y:0.7, w:5.8, h:6.0, fill:{ color:'E3F2FD', transparency:20 }, line:{ color:'0078D4', width:1.5 } })
s7.addText('☁️  DYNAMICS CRM', { x:7.3, y:0.72, w:5.6, h:0.28, fontSize:13, bold:true, color:'0078D4', fontFace:'Calibri' })

// Middle arrows
s7.addShape(prs.ShapeType.rect, { x:5.9, y:0.7, w:1.2, h:6.0, fill:{ color:'F5F5F5' }, line:{ color:'E0E0E0', width:1 } })
s7.addText('SYNC', { x:5.9, y:3.4, w:1.2, h:0.4, fontSize:9, bold:true, color:'9E9E9E', fontFace:'Calibri', align:'center' })

const syncs = [
  { pdb:'Crea Oportunidad\n(botón en FichaDemanda)', dyn:'Recibe Oportunidad\n→ asigna equipo comercial', y:1.2, dir:'→', color:'FF9800' },
  { pdb:'Consulta Negociaciones\n(read-only)', dyn:'Gestiona Negociación\n→ rondas · contraofertas', y:2.4, dir:'←', color:'9C27B0' },
  { pdb:'Recibe Instrucción\n→ crea Arrendatario', dyn:'Emite Instrucción\n→ acuerdo cerrado', y:3.6, dir:'←', color:'2E7D32' },
  { pdb:'Cuentas y Contactos\n(solo lectura)', dyn:'Gestiona CRM\n→ cuentas · contactos', y:4.8, dir:'←', color:'0078D4' },
]

syncs.forEach(({ pdb, dyn, y, dir, color }) => {
  s7.addShape(prs.ShapeType.roundRect, { x:0.5, y, w:5.1, h:0.9, fill:{ color: color, transparency: 85 }, line:{ color, width:1 }, rectRadius:0.06 })
  s7.addText(pdb, { x:0.55, y:y+0.05, w:5.0, h:0.8, fontSize:9.5, color:'212121', fontFace:'Calibri', align:'center', valign:'middle', wrap:true })
  s7.addShape(prs.ShapeType.roundRect, { x:7.3, y, w:5.4, h:0.9, fill:{ color: color, transparency: 85 }, line:{ color, width:1 }, rectRadius:0.06 })
  s7.addText(dyn, { x:7.35, y:y+0.05, w:5.3, h:0.8, fontSize:9.5, color:'212121', fontFace:'Calibri', align:'center', valign:'middle', wrap:true })
  const arrowX = dir === '→' ? 5.9 : 6.3
  const arrowEndX = dir === '→' ? 7.2 : 5.9
  s7.addShape(prs.ShapeType.line, {
    x:arrowX, y:y+0.45, w:arrowEndX-arrowX, h:0,
    line:{ color, width:2, endArrowType:'arrow' },
  })
  s7.addShape(prs.ShapeType.roundRect, { x:5.92, y:y+0.28, w:1.16, h:0.34, fill:{ color }, line:{ color }, rectRadius:0.06 })
  s7.addText(dir, { x:5.92, y:y+0.28, w:1.16, h:0.34, fontSize:12, bold:true, color:'FFFFFF', fontFace:'Calibri', align:'center', valign:'middle' })
})

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 8 — ROADMAP PENDIENTE
// ══════════════════════════════════════════════════════════════════════════
const s8 = prs.addSlide()
s8.background = { color: 'FAFAFA' }

s8.addText('Hoja de ruta — Próximos módulos', {
  x:0.3, y:0.12, w:12.73, h:0.38,
  fontSize:22, bold:true, color:C.titulo, fontFace:'Calibri',
})
s8.addShape(prs.ShapeType.line, { x:0.3, y:0.52, w:12.73, h:0, line:{ color:'E0E0E0', width:1 } })

const pending = [
  { fase:'Fase 1', label:'Demanda en Supabase', desc:'Tabla demandas · persistencia real · flujo completo', color:'6A1B9A', estado:'Pendiente' },
  { fase:'Fase 1', label:'Selección mapa → demanda', desc:'Guardar selecciones como registro vinculado a demanda', color:'00838F', estado:'Pendiente' },
  { fase:'Fase 2', label:'Visita desde demanda', desc:'Crear visita asociada a demanda · resultado · seguimiento', color:'E65100', estado:'Pendiente' },
  { fase:'Fase 2', label:'Negociación real', desc:'Tabla negociaciones · mensajes · rondas · persistencia', color:'B71C1C', estado:'Pendiente' },
  { fase:'Fase 3', label:'Propuestas / Mandatos', desc:'Persistencia en Supabase · estados · documentos', color:'4E342E', estado:'Pendiente' },
  { fase:'Fase 3', label:'Sync Dynamics real', desc:'Webhook / API Dynamics → instrucciones · oportunidades', color:'0078D4', estado:'Pendiente' },
]

pending.forEach(({ fase, label, desc, color, estado }, i) => {
  const row = Math.floor(i / 3)
  const col = i % 3
  const bx = 0.3 + col * 4.3
  const by = 1.0 + row * 2.6

  s8.addShape(prs.ShapeType.roundRect, {
    x:bx, y:by, w:4.0, h:2.2,
    fill:{ color: color, transparency: 92 },
    line:{ color, width:2 },
    rectRadius:0.1,
    shadow:{ type:'outer', color:'00000015', blur:6, offset:3, angle:45 },
  })
  s8.addShape(prs.ShapeType.rect, {
    x:bx, y:by, w:4.0, h:0.6,
    fill:{ color }, line:{ color },
  })
  s8.addText(`${fase}  ·  ${label}`, {
    x:bx+0.1, y:by, w:3.8, h:0.6,
    fontSize:10, bold:true, color:'FFFFFF', fontFace:'Calibri', align:'left', valign:'middle',
  })
  s8.addText(desc, {
    x:bx+0.15, y:by+0.7, w:3.7, h:1.0,
    fontSize:9.5, color:'424242', fontFace:'Calibri', wrap:true, lineSpacingMultiple:1.3,
  })
  s8.addShape(prs.ShapeType.roundRect, {
    x:bx+2.6, y:by+1.8, w:1.25, h:0.28,
    fill:{ color:'FFF3E0' }, line:{ color:'FF9800', width:1 }, rectRadius:0.06,
  })
  s8.addText(estado, { x:bx+2.6, y:by+1.8, w:1.25, h:0.28, fontSize:8, color:'E65100', fontFace:'Calibri', align:'center', bold:true })
})

// ══════════════════════════════════════════════════════════════════════════
// GUARDAR
// ══════════════════════════════════════════════════════════════════════════
await prs.writeFile({ fileName: 'PDB_CRM_Arquitectura.pptx' })
console.log('✅  PDB_CRM_Arquitectura.pptx generado correctamente')
