import PptxGenJS from 'pptxgenjs'

const prs = new PptxGenJS()
prs.layout = 'LAYOUT_WIDE'  // 13.33 x 7.5 inches (16:9)

// ── Paleta (alineada con generate_ppt.mjs) ────────────────────────────────
const C = {
  dynamics: { fill:'0078D4', text:'FFFFFF', border:'005A9E' },
  pdb:      { fill:'2E7D32', text:'FFFFFF', border:'1B5E20' },
  branch:   { fill:'00838F', text:'FFFFFF', border:'006064' },
  result:   { fill:'7C3AED', text:'FFFFFF', border:'5B21B6' },
  alert:    { fill:'EA580C', text:'FFFFFF', border:'C2410C' },
  critical: { fill:'DC2626', text:'FFFFFF', border:'991B1B' },
  channel:  { fill:'0D9488', text:'FFFFFF', border:'0F766E' },
  neutral:  { fill:'F5F5F5', text:'333333', border:'BDBDBD' },
  arrow:    'BDBDBD',
  bg:       'FAFAFA',
  titulo:   '1A237E',
  subtitulo:'455A64',
}

// ── Helpers ────────────────────────────────────────────────────────────────
function box(slide, { x, y, w, h, label, sub, scheme, fontSize=10, bold=false, num }) {
  const s = C[scheme] || C.neutral
  slide.addShape(prs.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: s.fill },
    line: { color: s.border, width: scheme === 'critical' ? 2.5 : 1.5 },
    rectRadius: 0.08,
    shadow: { type:'outer', color:'00000022', blur:4, offset:2, angle:45 },
  })
  const lines = sub ? `${label}\n${sub}` : label
  slide.addText(lines, {
    x, y, w, h,
    align:'center', valign:'middle',
    color: s.text, fontSize, bold, fontFace:'Calibri', wrap:true,
  })
  if (num != null) {
    slide.addShape(prs.ShapeType.ellipse, {
      x: x - 0.12, y: y - 0.12, w: 0.36, h: 0.36,
      fill:{ color:'1A237E' }, line:{ color:'FFFFFF', width:2 },
    })
    slide.addText(String(num), {
      x: x - 0.12, y: y - 0.12, w: 0.36, h: 0.36,
      fontSize:10, bold:true, color:'FFFFFF', align:'center', valign:'middle', fontFace:'Calibri',
    })
  }
}

function arrow(slide, { x1, y1, x2, y2, label, color, dash=false, width=1.8 }) {
  const col = color || C.arrow
  slide.addShape(prs.ShapeType.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color: col, width, endArrowType:'arrow', dashType: dash ? 'dash' : 'solid' },
  })
  if (label) {
    const mx = (x1 + x2) / 2 - 0.65
    const my = (y1 + y2) / 2 - 0.13
    slide.addText(label, {
      x: mx, y: my, w: 1.3, h: 0.26,
      align:'center', fontSize:8, color:'555555', italic:true,
      fontFace:'Calibri', fill:{ color:'FFFFFF', transparency:20 },
    })
  }
}

function section(slide, { x, y, w, h, label, color }) {
  slide.addShape(prs.ShapeType.rect, {
    x, y, w, h,
    fill: { color: color || 'F0F4FF', transparency: 88 },
    line: { color: color || 'C5CAE9', width: 1, dashType:'dash' },
  })
  slide.addText(label, {
    x: x + 0.08, y: y + 0.04, w: w - 0.16, h: 0.24,
    fontSize:9, bold:true, color: color || '3949AB',
    fontFace:'Calibri', valign:'top',
  })
}

function slideHeader(slide, { num, title, subtitle }) {
  slide.background = { color: C.bg }
  // Number badge
  slide.addShape(prs.ShapeType.roundRect, {
    x: 0.3, y: 0.18, w: 0.6, h: 0.5,
    fill:{ color: C.titulo }, line:{ color: C.titulo }, rectRadius: 0.08,
  })
  slide.addText(String(num), {
    x: 0.3, y: 0.18, w: 0.6, h: 0.5,
    fontSize:22, bold:true, color:'FFFFFF', align:'center', valign:'middle', fontFace:'Calibri',
  })
  slide.addText(title, {
    x: 1.0, y: 0.15, w: 12.0, h: 0.4,
    fontSize:22, bold:true, color: C.titulo, fontFace:'Calibri',
  })
  slide.addShape(prs.ShapeType.line, {
    x: 0.3, y: 0.72, w: 12.73, h: 0,
    line:{ color:'E0E0E0', width:1 },
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 1.0, y: 0.55, w: 12.0, h: 0.25,
      fontSize:10, italic:true, color: C.subtitulo, fontFace:'Calibri',
    })
  }
  // Legend (Dynamics / PDB)
  slide.addShape(prs.ShapeType.roundRect, { x:9.6, y:0.22, w:0.22, h:0.22, fill:{color:C.dynamics.fill}, line:{color:C.dynamics.border}, rectRadius:0.04 })
  slide.addText('Dynamics', { x:9.85, y:0.22, w:1.1, h:0.22, fontSize:9, color:'333333', fontFace:'Calibri', valign:'middle' })
  slide.addShape(prs.ShapeType.roundRect, { x:11.0, y:0.22, w:0.22, h:0.22, fill:{color:C.pdb.fill}, line:{color:C.pdb.border}, rectRadius:0.04 })
  slide.addText('PDB', { x:11.25, y:0.22, w:0.7, h:0.22, fontSize:9, color:'333333', fontFace:'Calibri', valign:'middle' })
}

function explanation(slide, text, y = 6.3) {
  slide.addShape(prs.ShapeType.rect, {
    x: 0.3, y, w: 12.73, h: 0.95,
    fill:{ color:'FFFFFF' },
    line:{ color:'E0E0E0', width:1 },
  })
  slide.addText(text, {
    x: 0.5, y: y + 0.08, w: 12.33, h: 0.79,
    fontSize:10, color:'333333', fontFace:'Calibri', wrap:true, lineSpacingMultiple:1.25,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 0 — PORTADA
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  s.background = { color:'1A237E' }
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:13.33, h:0.06, fill:{color:'FF9800'}, line:{color:'FF9800'} })
  s.addShape(prs.ShapeType.rect, { x:0, y:7.44, w:13.33, h:0.06, fill:{color:'FF9800'}, line:{color:'FF9800'} })
  s.addText('FLUJOS PDB', { x:1, y:2.0, w:11.33, h:1.2, fontSize:60, bold:true, color:'FFFFFF', fontFace:'Calibri', align:'center' })
  s.addText('Mapa de procesos · 10 ciclos clave', { x:1, y:3.4, w:11.33, h:0.6, fontSize:22, color:'90CAF9', fontFace:'Calibri', align:'center' })
  s.addText('Cuenta · Oportunidad · Demanda · Activo · Visita · Oferta · Negociación · Instrucción · Transacción', {
    x:1, y:4.1, w:11.33, h:0.4, fontSize:12, color:'BBDEFB', fontFace:'Calibri', align:'center',
  })
  // Legend
  const chips = [
    ['Dynamics — sistema maestro','0078D4'],
    ['PDB — sistema operativo','2E7D32'],
    ['Vínculo CRÍTICO','DC2626'],
  ]
  chips.forEach(([lbl, col], i) => {
    const cx = 2.5 + i * 3.0
    s.addShape(prs.ShapeType.roundRect, { x:cx, y:5.6, w:2.7, h:0.45, fill:{color:col}, line:{color:col}, rectRadius:0.08 })
    s.addText(lbl, { x:cx, y:5.6, w:2.7, h:0.45, fontSize:11, color:'FFFFFF', fontFace:'Calibri', align:'center', bold:true, valign:'middle' })
  })
  s.addText('Savills · 2026', { x:0, y:6.9, w:13.33, h:0.3, fontSize:11, color:'7986CB', fontFace:'Calibri', align:'center' })
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 1 — CICLO COMERCIAL COMPLETO
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  slideHeader(s, { num:1, title:'Ciclo comercial completo (end-to-end)', subtitle:'Cuenta → Oportunidad → Demanda → Activo → Visita → Oferta → Negociación → Instrucción → Transacción' })

  // Subgraph DYNAMICS arriba
  section(s, { x:0.3, y:1.0, w:12.73, h:1.85, label:'☁️  DYNAMICS · Sistema maestro', color:C.dynamics.fill })
  // Subgraph PDB abajo
  section(s, { x:0.3, y:3.45, w:12.73, h:2.55, label:'🟢  PDB · Sistema operativo', color:C.pdb.fill })

  // Pasos Dynamics
  box(s, { x:0.6,  y:1.45, w:1.9, h:1.2, label:'Cuenta', sub:'Alta fuente\nde verdad', scheme:'dynamics', num:1, fontSize:10 })
  box(s, { x:2.85, y:1.45, w:1.9, h:1.2, label:'Oportunidad', sub:'Detección\ncomercial', scheme:'dynamics', num:2, fontSize:10 })
  box(s, { x:9.5,  y:1.45, w:1.9, h:1.2, label:'Instrucción', sub:'Mandato\nformal', scheme:'dynamics', num:8, fontSize:10 })

  // Pasos PDB
  box(s, { x:0.6,  y:3.95, w:1.7, h:1.2, label:'Demanda', sub:'Cualificación\nnecesidad', scheme:'pdb', num:3, fontSize:10 })
  box(s, { x:2.55, y:3.95, w:1.7, h:1.2, label:'Activo', sub:'Producto\ndisponible', scheme:'pdb', num:4, fontSize:10 })
  box(s, { x:4.50, y:3.95, w:1.7, h:1.2, label:'Visita', sub:'Inspección\nfísica', scheme:'pdb', num:5, fontSize:10 })
  box(s, { x:6.45, y:3.95, w:1.7, h:1.2, label:'Oferta', sub:'Propuesta\neconómica', scheme:'pdb', num:6, fontSize:10 })
  box(s, { x:8.40, y:3.95, w:1.7, h:1.2, label:'Negociación', sub:'Hilo\ncondiciones', scheme:'pdb', num:7, fontSize:10 })
  box(s, { x:11.05,y:3.95, w:1.9, h:1.2, label:'Transacción', sub:'Cierre +\nhonorarios', scheme:'pdb', num:9, fontSize:10 })

  // Flujo principal
  arrow(s, { x1:2.5,  y1:2.05, x2:2.85, y2:2.05 })                          // 1→2 dyn
  arrow(s, { x1:3.8,  y1:2.65, x2:1.45, y2:3.95, label:'sync', color:'0078D4' })  // 2→3
  arrow(s, { x1:2.30, y1:4.55, x2:2.55, y2:4.55 })                          // 3→4
  arrow(s, { x1:4.25, y1:4.55, x2:4.50, y2:4.55 })                          // 4→5
  arrow(s, { x1:6.20, y1:4.55, x2:6.45, y2:4.55 })                          // 5→6
  arrow(s, { x1:8.15, y1:4.55, x2:8.40, y2:4.55 })                          // 6→7
  arrow(s, { x1:9.30, y1:3.95, x2:10.45,y2:2.65, label:'handoff', color:'7C3AED' }) // 7→8
  arrow(s, { x1:10.45,y1:2.65, x2:12.0, y2:3.95, label:'sync', color:'0078D4' })   // 8→9

  // Vínculo CRÍTICO Activo ↔ Cuenta
  s.addShape(prs.ShapeType.line, {
    x:1.55, y:2.65, w:1.85, h:1.3,
    line:{ color:'DC2626', width:3.5, beginArrowType:'arrow', endArrowType:'arrow' },
  })
  s.addShape(prs.ShapeType.roundRect, {
    x:0.4, y:3.05, w:2.55, h:0.32,
    fill:{ color:'FEE2E2' }, line:{ color:'DC2626', width:1.5 }, rectRadius:0.06,
  })
  s.addText('🔗 vínculo Cuenta-Propietario · CRÍTICO', {
    x:0.4, y:3.05, w:2.55, h:0.32,
    fontSize:9, bold:true, color:'991B1B', align:'center', valign:'middle', fontFace:'Calibri',
  })

  explanation(s, 'El ciclo arranca en Dynamics con el alta de la Cuenta (1) y la detección de la Oportunidad (2). Una vez sincronizada al PDB, se cualifica como Demanda (3) y se conecta con uno o varios Activos (4). Se ejecutan Visitas (5), se formaliza la Oferta (6) y se abre la Negociación (7). El acuerdo final se devuelve a Dynamics como Instrucción (8), y el cierre se registra como Transacción (9). El vínculo Activo ↔ Cuenta-Propietario atraviesa todo el ciclo: sin él, el flujo se rompe.')
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 2 — CUENTAS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  slideHeader(s, { num:2, title:'Cuentas', subtitle:'Alta en Dynamics → sync PDB → enriquecimiento → vista 360º · Tres roles posibles' })

  section(s, { x:0.3, y:1.0, w:2.6, h:5.0, label:'☁️  DYNAMICS', color:C.dynamics.fill })
  section(s, { x:3.15, y:1.0, w:9.88, h:5.0, label:'🟢  PDB', color:C.pdb.fill })

  box(s, { x:0.5,  y:2.5, w:2.2, h:1.5, label:'Alta Cuenta', sub:'Datos fiscales\n+ contacto', scheme:'dynamics', num:1, fontSize:11 })

  box(s, { x:3.4,  y:2.0, w:2.0, h:1.0, label:'Sync PDB', sub:'Replicación\nlectura', scheme:'pdb', num:2, fontSize:10 })
  box(s, { x:3.4,  y:3.4, w:2.0, h:1.0, label:'Enriquecimiento', sub:'Contactos +\nactividades', scheme:'pdb', num:3, fontSize:10 })
  box(s, { x:3.4,  y:4.8, w:2.0, h:1.0, label:'Vista 360º', sub:'Activos · ofertas\n· histórico', scheme:'pdb', num:4, fontSize:10 })

  // 3 ramas
  box(s, { x:6.5,  y:1.6, w:2.4, h:1.2, label:'Cuenta-Propietario', sub:'Activos en cartera', scheme:'branch', num:'5a', fontSize:10 })
  box(s, { x:6.5,  y:3.2, w:2.4, h:1.2, label:'Cuenta-Arrendatario', sub:'Demandas + contratos', scheme:'branch', num:'5b', fontSize:10 })
  box(s, { x:6.5,  y:4.8, w:2.4, h:1.2, label:'Cuenta-Inversor', sub:'Apetito + transacciones', scheme:'branch', num:'5c', fontSize:10 })

  // Salidas finales
  box(s, { x:10.3, y:1.6, w:2.5, h:1.2, label:'Activos vinculados', sub:'matriz propietario\n→ ref activos', scheme:'pdb', fontSize:10 })
  box(s, { x:10.3, y:3.2, w:2.5, h:1.2, label:'Pipeline demanda', sub:'matching automático\ncon activos', scheme:'pdb', fontSize:10 })
  box(s, { x:10.3, y:4.8, w:2.5, h:1.2, label:'Capital Markets', sub:'oferta a inversor\n+ producto encajable', scheme:'pdb', fontSize:10 })

  // Arrows
  arrow(s, { x1:2.7, y1:3.25, x2:3.4, y2:2.5, label:'sync auto', color:'0078D4' })
  arrow(s, { x1:4.4, y1:3.0, x2:4.4, y2:3.4 })
  arrow(s, { x1:4.4, y1:4.4, x2:4.4, y2:4.8 })
  arrow(s, { x1:5.4, y1:5.3, x2:6.5, y2:2.2 })
  arrow(s, { x1:5.4, y1:5.3, x2:6.5, y2:3.8 })
  arrow(s, { x1:5.4, y1:5.3, x2:6.5, y2:5.4 })
  arrow(s, { x1:8.9, y1:2.2, x2:10.3, y2:2.2 })
  arrow(s, { x1:8.9, y1:3.8, x2:10.3, y2:3.8 })
  arrow(s, { x1:8.9, y1:5.4, x2:10.3, y2:5.4 })

  explanation(s, 'La cuenta se da de alta siempre en Dynamics (1), porque es el sistema maestro fiscal y de gobierno. El PDB recibe la sincronización (2), enriquece la cuenta con contactos y actividades (3) y construye una vista 360º (4). A partir de ahí, la cuenta toma uno de tres roles: Propietario de activos (5a), Arrendatario que ocupa espacios (5b) o Inversor que adquiere producto (5c). Una misma cuenta puede tener varios roles simultáneamente.')
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 3 — OPORTUNIDADES
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  slideHeader(s, { num:3, title:'Oportunidades', subtitle:'Detección → cualificación → conversión a Demanda → seguimiento → cierre · Trazabilidad bidireccional' })

  section(s, { x:0.3, y:1.0, w:6.2, h:5.0, label:'☁️  DYNAMICS', color:C.dynamics.fill })
  section(s, { x:6.7, y:1.0, w:6.33, h:5.0, label:'🟢  PDB', color:C.pdb.fill })

  box(s, { x:0.6, y:1.6, w:2.6, h:1.0, label:'Detección', sub:'Lead u origen\ncomercial', scheme:'dynamics', num:1, fontSize:10 })
  box(s, { x:3.5, y:1.6, w:2.6, h:1.0, label:'Cualificación', sub:'BANT + score', scheme:'dynamics', num:2, fontSize:10 })

  box(s, { x:6.9,  y:1.6, w:1.85, h:1.0, label:'Conversión\na Demanda', sub:'en PDB', scheme:'pdb', num:3, fontSize:10 })
  box(s, { x:9.0,  y:1.6, w:1.85, h:1.0, label:'Seguimiento', sub:'Actividades\n+ visitas', scheme:'pdb', num:4, fontSize:10 })
  box(s, { x:11.1, y:1.6, w:1.85, h:1.0, label:'Negociación', sub:'Oferta viva', scheme:'pdb', num:5, fontSize:10 })

  // Cierre — vuelve a Dynamics
  box(s, { x:1.5, y:4.4, w:2.4, h:1.2, label:'Cierre Ganada', sub:'→ Transacción', scheme:'result', num:'6a', fontSize:11 })
  box(s, { x:4.2, y:4.4, w:2.4, h:1.2, label:'Cierre Perdida', sub:'Motivo +\nlecciones', scheme:'critical', num:'6b', fontSize:11 })

  // Flow
  arrow(s, { x1:3.2, y1:2.1, x2:3.5, y2:2.1 })
  arrow(s, { x1:6.1, y1:2.1, x2:6.9, y2:2.1, label:'sync + handoff', color:'7C3AED' })
  arrow(s, { x1:8.75,y1:2.1, x2:9.0, y2:2.1 })
  arrow(s, { x1:10.85,y1:2.1, x2:11.1, y2:2.1 })

  // Cierres
  arrow(s, { x1:11.5, y1:2.6, x2:2.7, y2:4.4, label:'outcome', color:'7C3AED' })
  arrow(s, { x1:11.5, y1:2.6, x2:5.4, y2:4.4, label:'outcome', color:'DC2626' })

  // Trazabilidad bidireccional
  s.addShape(prs.ShapeType.line, {
    x:4.8, y:2.6, w:3.05, h:0.7,
    line:{ color:'888888', width:1.2, dashType:'dash', beginArrowType:'arrow', endArrowType:'arrow' },
  })
  s.addText('trazabilidad bidireccional', { x:4.5, y:3.3, w:3.5, h:0.25, fontSize:8, italic:true, color:'666666', align:'center', fontFace:'Calibri' })

  explanation(s, 'La oportunidad nace en Dynamics (1) y se cualifica allí (2). Cuando supera el filtro BANT, se convierte en Demanda dentro del PDB (3), donde el broker ejecuta el seguimiento operativo (4) y abre la negociación (5). El resultado — ganada (6a) o perdida (6b) — se registra de nuevo en Dynamics. La trazabilidad Oportunidad ↔ Demanda ↔ Negociación se mantiene bidireccional en todo momento para reporting y forecasting.')
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 4 — GESTIÓN DE ACTIVO
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  slideHeader(s, { num:4, title:'Gestión de Activo', subtitle:'Alta → vinculación Cuenta-Propietario (CRÍTICO) → publicación → demandas → visitas → ofertas' })

  section(s, { x:0.3, y:1.0, w:3.0, h:5.0, label:'☁️  DYNAMICS', color:C.dynamics.fill })
  section(s, { x:3.55, y:1.0, w:9.48, h:5.0, label:'🟢  PDB', color:C.pdb.fill })

  // Cuenta-Propietario en Dynamics — CRÍTICO
  box(s, { x:0.5, y:2.5, w:2.6, h:2.0, label:'Cuenta-Propietario', sub:'vínculo\nCRÍTICO', scheme:'critical', num:2, fontSize:12, bold:true })

  // Pasos PDB
  box(s, { x:3.85, y:1.6, w:1.9, h:1.0, label:'Alta Activo', sub:'Ref + dirección\n+ uso', scheme:'pdb', num:1, fontSize:10 })
  box(s, { x:5.95, y:1.6, w:1.9, h:1.0, label:'Publicación', sub:'Disponibilidad\n+ fotos', scheme:'pdb', num:3, fontSize:10 })
  box(s, { x:8.05, y:1.6, w:1.9, h:1.0, label:'Recepción\nDemandas', sub:'Matching entrante', scheme:'pdb', num:4, fontSize:10 })
  box(s, { x:10.15,y:1.6, w:1.9, h:1.0, label:'Visitas', sub:'Agenda +\nreporting', scheme:'pdb', num:5, fontSize:10 })
  box(s, { x:8.05, y:4.4, w:1.9, h:1.0, label:'Ofertas', sub:'Vinculadas\nal activo', scheme:'pdb', num:6, fontSize:10 })

  // Flow
  arrow(s, { x1:5.75, y1:2.1, x2:5.95, y2:2.1 })
  arrow(s, { x1:7.85, y1:2.1, x2:8.05, y2:2.1 })
  arrow(s, { x1:9.95, y1:2.1, x2:10.15,y2:2.1 })
  arrow(s, { x1:11.10,y1:2.6, x2:9.0, y2:4.4 })

  // FK obligatorio - bidireccional
  s.addShape(prs.ShapeType.line, {
    x:3.1, y:2.5, w:0.75, h:-0.4,
    line:{ color:'DC2626', width:3, beginArrowType:'arrow', endArrowType:'arrow' },
  })
  s.addText('FK obligatorio', { x:2.9, y:1.95, w:1.2, h:0.22, fontSize:8, bold:true, color:'DC2626', align:'center', fontFace:'Calibri' })
  arrow(s, { x1:3.1, y1:3.5, x2:3.85, y2:2.0, label:'sync datos', color:'0078D4', dash:true })

  explanation(s, 'El alta del activo (1) es la primera operación que el broker realiza en el PDB. Antes de cualquier publicación, el activo debe vincularse a una Cuenta-Propietario en Dynamics (2): este FK es obligatorio y bloqueante. Una vez vinculado, el activo se publica con disponibilidad y fotos (3), recibe demandas entrantes (4), genera visitas (5) y, en su caso, ofertas (6). Toda la información heredable (titular, fiscal, contactos) se sincroniza desde la cuenta.')
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 5 — GESTIÓN DE DEMANDA
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  slideHeader(s, { num:5, title:'Gestión de Demanda', subtitle:'Cuenta-Arrendatario → alta demanda → matching activos → visitas → shortlist → oferta' })

  section(s, { x:0.3, y:1.0, w:2.7, h:5.0, label:'☁️  DYNAMICS', color:C.dynamics.fill })
  section(s, { x:3.25, y:1.0, w:9.78, h:5.0, label:'🟢  PDB', color:C.pdb.fill })

  box(s, { x:0.5, y:2.5, w:2.3, h:1.8, label:'Cuenta-\nArrendatario', sub:'origen demanda', scheme:'dynamics', num:1, fontSize:11, bold:true })

  const ds = [
    { x:3.5,  label:'Alta Demanda', sub:'Uso + sup\n+ renta máx', num:2 },
    { x:5.4,  label:'Matching Activos', sub:'cruce automático', num:3 },
    { x:7.3,  label:'Visitas', sub:'presencial\no virtual', num:4 },
    { x:9.2,  label:'Shortlist', sub:'preselección\n3-5', num:5 },
    { x:11.1, label:'Oferta', sub:'sobre activo\nfinal', num:6 },
  ]
  ds.forEach(({ x, label, sub, num }) => {
    box(s, { x, y:2.7, w:1.7, h:1.4, label, sub, scheme:'pdb', num, fontSize:10 })
  })

  arrow(s, { x1:2.8, y1:3.4, x2:3.5, y2:3.4, label:'FK obligatorio', color:'DC2626' })
  for (let i = 0; i < ds.length - 1; i++) {
    arrow(s, { x1: ds[i].x + 1.7, y1: 3.4, x2: ds[i+1].x, y2: 3.4 })
  }

  explanation(s, 'Toda demanda parte de una Cuenta-Arrendatario en Dynamics (1). El broker da de alta la demanda en el PDB (2) con el perfil de búsqueda (uso, superficie, renta máxima, zona). El sistema realiza un matching automático contra los activos disponibles (3), se ejecutan visitas (4) y se construye una shortlist (5) que culmina en una oferta concreta (6) sobre el activo seleccionado.')
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 6 — FLUJO DE OFERTA
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  slideHeader(s, { num:6, title:'Flujo de Oferta', subtitle:'Creación → envío → respuesta → apertura Negociación → versionado documentos → cierre · Vive íntegramente en PDB' })

  section(s, { x:0.3, y:1.0, w:12.73, h:5.0, label:'🟢  PDB', color:C.pdb.fill })

  const os = [
    { x:0.6,  label:'Creación', sub:'Activo + Demanda\n+ condiciones', num:1 },
    { x:2.65, label:'Envío', sub:'al propietario', num:2 },
    { x:4.7,  label:'Respuesta', sub:'aceptada /\ncontrapropuesta /\nrechazada', num:3 },
    { x:6.75, label:'Apertura\nNegociación', sub:'hilo formal', num:4 },
    { x:8.8,  label:'Versionado docs', sub:'borradores +\ndiff', num:5 },
    { x:10.85,label:'Cierre', sub:'acuerdo o\nruptura', num:6 },
  ]
  os.forEach(({ x, label, sub, num }) => {
    box(s, { x, y:2.7, w:1.85, h:1.7, label, sub, scheme:'pdb', num, fontSize:10 })
  })
  for (let i = 0; i < os.length - 1; i++) {
    arrow(s, { x1: os[i].x + 1.85, y1: 3.55, x2: os[i+1].x, y2: 3.55 })
  }

  explanation(s, 'La oferta vive íntegramente dentro del PDB. Se crea (1) vinculando un activo y una demanda, con las condiciones económicas. Se envía al propietario (2) y se registra su respuesta (3): aceptación, contrapropuesta o rechazo. Si avanza, se abre formalmente la Negociación (4) y se gestiona el versionado de borradores (5) hasta el cierre (6), positivo o negativo. La oferta es siempre el contenedor económico previo a la negociación.')
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 7 — NEGOCIACIÓN
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  slideHeader(s, { num:7, title:'Negociación', subtitle:'Apertura hilo → intercambio condiciones → tabla evolutiva → acuerdo final → handoff a Instrucción' })

  section(s, { x:0.3, y:1.0, w:9.0, h:5.0, label:'🟢  PDB', color:C.pdb.fill })
  section(s, { x:9.55, y:1.0, w:3.48, h:5.0, label:'☁️  DYNAMICS', color:C.dynamics.fill })

  const ns = [
    { x:0.6,  label:'Apertura hilo', sub:'desde Oferta\naceptada', num:1, scheme:'pdb' },
    { x:2.7,  label:'Intercambio\ncondiciones', sub:'chat + adjuntos', num:2, scheme:'pdb' },
    { x:4.8,  label:'Tabla evolutiva', sub:'versiones lado\na lado', num:3, scheme:'pdb' },
    { x:6.9,  label:'Acuerdo final', sub:'firma\ncondiciones', num:4, scheme:'pdb' },
    { x:9.85, label:'Handoff a\nInstrucción', sub:'creación registro\nmaestro', num:5, scheme:'dynamics' },
  ]
  ns.forEach(({ x, label, sub, num, scheme }) => {
    box(s, { x, y:2.7, w:1.95, h:1.7, label, sub, scheme, num, fontSize:10 })
  })
  for (let i = 0; i < ns.length - 1; i++) {
    const lbl = i === ns.length - 2 ? 'handoff' : null
    arrow(s, { x1: ns[i].x + 1.95, y1: 3.55, x2: ns[i+1].x, y2: 3.55, label:lbl, color: lbl ? '7C3AED' : null })
  }

  explanation(s, 'La negociación abre un hilo formal a partir de la oferta aceptada como base (1). Las partes intercambian condiciones documentadas en un chat con adjuntos (2), y el PDB mantiene una tabla evolutiva con todas las versiones lado a lado (3) para trazabilidad. Cuando se alcanza el acuerdo final (4), se ejecuta el handoff a Dynamics (5) para crear la Instrucción maestra. No existe contrato sin Instrucción en Dynamics.')
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 8 — INSTRUCCIÓN / TRANSACCIÓN
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  slideHeader(s, { num:8, title:'Instrucción / Transacción', subtitle:'Cierre Negociación → Instrucción Dynamics → contrato → sync → Transacción → honorarios → archivo' })

  section(s, { x:0.3, y:1.0, w:12.73, h:1.85, label:'🟢  PDB', color:C.pdb.fill })
  section(s, { x:0.3, y:3.4, w:12.73, h:2.6, label:'☁️  DYNAMICS', color:C.dynamics.fill })

  // PDB top
  box(s, { x:0.6,  y:1.45, w:1.85, h:1.2, label:'Cierre\nNegociación', sub:'acuerdo\nalcanzado', scheme:'pdb', num:1, fontSize:10 })
  box(s, { x:7.4,  y:1.45, w:1.85, h:1.2, label:'Registro\nTransacción', sub:'vista lectura\nPDB', scheme:'pdb', num:5, fontSize:10 })
  box(s, { x:9.4,  y:1.45, w:1.85, h:1.2, label:'Facturación\nhonorarios', sub:'cálculo +\nemisión', scheme:'pdb', num:6, fontSize:10 })
  box(s, { x:11.4, y:1.45, w:1.6, h:1.2, label:'Archivo', sub:'cierre\noperación', scheme:'pdb', num:7, fontSize:10 })

  // Dynamics bottom
  box(s, { x:1.0,  y:3.95, w:1.85, h:1.5, label:'Creación\nInstrucción', sub:'registro\nmaestro', scheme:'dynamics', num:2, fontSize:10 })
  box(s, { x:3.05, y:3.95, w:1.85, h:1.5, label:'Formalización\ncontrato', sub:'firma + legal', scheme:'dynamics', num:3, fontSize:10 })
  box(s, { x:5.10, y:3.95, w:1.85, h:1.5, label:'Sync vuelta PDB', sub:'auto', scheme:'dynamics', num:4, fontSize:10 })

  // Flow
  arrow(s, { x1:1.5, y1:2.65, x2:1.9, y2:3.95, label:'handoff', color:'7C3AED' })
  arrow(s, { x1:2.85, y1:4.7, x2:3.05, y2:4.7 })
  arrow(s, { x1:4.90, y1:4.7, x2:5.10, y2:4.7 })
  arrow(s, { x1:6.95, y1:4.7, x2:8.0, y2:2.65, label:'sync', color:'0078D4' })
  arrow(s, { x1:9.25, y1:2.05, x2:9.4, y2:2.05 })
  arrow(s, { x1:11.25,y1:2.05, x2:11.4, y2:2.05 })

  explanation(s, 'El cierre de la negociación (1) lanza la creación de la Instrucción en Dynamics (2), donde se formaliza el contrato con el visto bueno legal (3). Una vez firmado, Dynamics sincroniza el registro de vuelta al PDB (4), que lo muestra como Transacción en modo lectura (5). Sobre esa transacción se calculan y emiten los honorarios (6) y, finalmente, se archiva la operación (7). Este es el único camino válido para registrar ingresos.')
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 9 — ACTIVIDADES Y SEGUIMIENTO
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  slideHeader(s, { num:9, title:'Actividades y seguimiento', subtitle:'Email · Llamada · Reunión → vinculación a entidad (siempre) → Tarea derivada → Cierre' })

  section(s, { x:0.3, y:1.0, w:12.73, h:5.0, label:'🟢  PDB · Transversal a todos los módulos', color:C.pdb.fill })

  // Canales (entrada)
  box(s, { x:0.6, y:1.6, w:1.8, h:0.8, label:'📧 Email', scheme:'channel', num:'1a', fontSize:11 })
  box(s, { x:0.6, y:2.7, w:1.8, h:0.8, label:'📞 Llamada', scheme:'channel', num:'1b', fontSize:11 })
  box(s, { x:0.6, y:3.8, w:1.8, h:0.8, label:'🤝 Reunión', scheme:'channel', num:'1c', fontSize:11 })

  // Vinculación
  box(s, { x:3.5, y:2.4, w:3.0, h:1.7, label:'Vinculación a entidad', sub:'Cuenta · Oportunidad\nDemanda · Oferta · Activo', scheme:'pdb', num:2, fontSize:10, bold:true })

  // Tarea derivada
  box(s, { x:7.6, y:2.4, w:2.4, h:1.7, label:'Tarea derivada', sub:'seguimiento +\nresponsable + fecha', scheme:'pdb', num:3, fontSize:10 })

  // Cierre
  box(s, { x:11.0, y:2.4, w:1.9, h:1.7, label:'Cierre actividad', sub:'resultado +\nnotas', scheme:'pdb', num:4, fontSize:10 })

  arrow(s, { x1:2.4, y1:2.0, x2:3.5, y2:2.9 })
  arrow(s, { x1:2.4, y1:3.1, x2:3.5, y2:3.25 })
  arrow(s, { x1:2.4, y1:4.2, x2:3.5, y2:3.6 })
  arrow(s, { x1:6.5, y1:3.25, x2:7.6, y2:3.25 })
  arrow(s, { x1:10.0,y1:3.25, x2:11.0,y2:3.25 })

  // Nota crítica
  s.addShape(prs.ShapeType.roundRect, {
    x: 3.5, y: 4.4, w: 6.5, h: 0.6,
    fill:{ color:'FEF3C7' }, line:{ color:'F59E0B', width:1.5 }, rectRadius:0.06,
  })
  s.addText('⚠️  Sin vinculación a entidad, la actividad no se persiste — no existen actividades huérfanas', {
    x:3.5, y:4.4, w:6.5, h:0.6, fontSize:10, bold:true, color:'92400E', align:'center', valign:'middle', fontFace:'Calibri',
  })

  explanation(s, 'Las actividades son transversales: cualquier email (1a), llamada (1b) o reunión (1c) se registra en el PDB y debe vincularse obligatoriamente a una entidad — Cuenta, Oportunidad, Demanda, Oferta o Activo (2). De esa actividad puede derivar una Tarea (3) con responsable y fecha límite, que se cierra al ejecutarse con resultado y notas (4). Sin vinculación a entidad, la actividad no se persiste: no existen actividades huérfanas.')
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 10 — VENCIMIENTOS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  slideHeader(s, { num:10, title:'Vencimientos', subtitle:'Detección automática → alerta → acción comercial → renovación o nueva Oportunidad → reflejo en Dynamics' })

  section(s, { x:0.3, y:1.0, w:8.5, h:5.0, label:'🟢  PDB', color:C.pdb.fill })
  section(s, { x:9.05, y:1.0, w:3.98, h:5.0, label:'☁️  DYNAMICS', color:C.dynamics.fill })

  box(s, { x:0.6, y:2.8, w:2.0, h:1.4, label:'Detección\nvencimiento', sub:'contrato próximo\na vencer', scheme:'pdb', num:1, fontSize:10 })
  box(s, { x:2.85,y:2.8, w:1.8, h:1.4, label:'Alerta sistema', sub:'badge días\nrestantes', scheme:'alert', num:2, fontSize:10 })
  box(s, { x:4.9, y:2.8, w:1.85,h:1.4, label:'Acción comercial', sub:'contacto\narrendatario', scheme:'pdb', num:3, fontSize:10 })

  box(s, { x:7.0, y:1.4, w:1.7, h:1.4, label:'Renovación', sub:'nuevas\ncondiciones', scheme:'pdb', num:'4a', fontSize:10 })
  box(s, { x:7.0, y:4.2, w:1.7, h:1.4, label:'Nueva\nOportunidad', sub:'relocation o\nnuevo tenant', scheme:'pdb', num:'4b', fontSize:10 })

  box(s, { x:9.3, y:1.4, w:3.5, h:1.4, label:'Update contrato', sub:'en Dynamics', scheme:'dynamics', num:'5a', fontSize:11 })
  box(s, { x:9.3, y:4.2, w:3.5, h:1.4, label:'Alta Oportunidad', sub:'en Dynamics', scheme:'dynamics', num:'5b', fontSize:11 })

  arrow(s, { x1:2.6, y1:3.5, x2:2.85, y2:3.5 })
  arrow(s, { x1:4.65,y1:3.5, x2:4.9, y2:3.5 })
  arrow(s, { x1:6.75,y1:3.2, x2:7.0, y2:2.1 })
  arrow(s, { x1:6.75,y1:3.8, x2:7.0, y2:4.9 })
  arrow(s, { x1:8.7, y1:2.1, x2:9.3, y2:2.1 })
  arrow(s, { x1:8.7, y1:4.9, x2:9.3, y2:4.9 })

  explanation(s, 'El motor de vencimientos del PDB detecta automáticamente los contratos próximos a expirar (1) y genera una alerta visible con badge de días restantes (2). El broker ejecuta la acción comercial sobre el arrendatario (3), que deriva en una renovación con condiciones actualizadas (4a) o en una nueva Oportunidad — relocation, tenant alternativo o salida (4b). Ambos resultados se reflejan en Dynamics (5a/5b) para mantener la fuente de verdad.')
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE FINAL — POR QUÉ VINCULAR CUENTAS A ACTIVOS ES CRÍTICO
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide()
  s.background = { color: C.bg }
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:13.33, h:0.06, fill:{color:'DC2626'}, line:{color:'DC2626'} })

  s.addText('Por qué vincular Cuentas a Activos es CRÍTICO', {
    x:0.3, y:0.18, w:12.73, h:0.5,
    fontSize:24, bold:true, color:'DC2626', fontFace:'Calibri',
  })
  s.addShape(prs.ShapeType.line, { x:0.3, y:0.78, w:12.73, h:0, line:{color:'E0E0E0', width:1} })

  const motivos = [
    { titulo:'Nexo único con Dynamics', texto:'Dynamics es la fuente de verdad fiscal. Activo sin Cuenta = huérfano: no facturable, no contratable, no auditable.', color:'0078D4' },
    { titulo:'Vista 360º del Propietario', texto:'Sin vínculo, los activos del mismo propietario aparecen inconexos. Imposible mostrar cartera, vencimientos y ofertas consolidados.', color:'2E7D32' },
    { titulo:'Inteligencia comercial · Mapas', texto:'Los cruces clave — vencimientos por zona, ofertas por propietario — solo funcionan si cada activo conoce su Cuenta.', color:'00838F' },
    { titulo:'Reporting y honorarios', texto:'La facturación depende de saber a qué Cuenta pertenece cada operación. Sin Cuenta, no hay liquidación contable.', color:'E65100' },
    { titulo:'Cross-selling', texto:'El valor del CRM está en detectar que el propietario del activo X también tiene Y y Z. Sin vínculo, el cross-selling es invisible.', color:'7C3AED' },
    { titulo:'Riesgo operativo y calidad de dato', texto:'Un activo sin Cuenta contamina matching, falsea KPIs y obliga a limpiezas manuales costosas.', color:'B71C1C' },
  ]

  motivos.forEach(({ titulo, texto, color }, i) => {
    const row = Math.floor(i / 3)
    const col = i % 3
    const x = 0.3 + col * 4.35
    const y = 1.05 + row * 1.85

    s.addShape(prs.ShapeType.roundRect, {
      x, y, w:4.15, h:1.65,
      fill:{ color:'FFFFFF' },
      line:{ color, width:2 },
      rectRadius:0.1,
      shadow:{ type:'outer', color:'00000015', blur:6, offset:3, angle:45 },
    })
    s.addShape(prs.ShapeType.rect, {
      x, y, w:0.12, h:1.65, fill:{ color }, line:{ color },
    })
    s.addText(titulo, {
      x: x + 0.25, y: y + 0.1, w: 3.85, h: 0.4,
      fontSize:12, bold:true, color, fontFace:'Calibri', valign:'middle',
    })
    s.addText(texto, {
      x: x + 0.25, y: y + 0.55, w: 3.85, h: 1.05,
      fontSize:10, color:'424242', fontFace:'Calibri', wrap:true, lineSpacingMultiple:1.25, valign:'top',
    })
  })

  // Regla de oro
  s.addShape(prs.ShapeType.roundRect, {
    x: 0.3, y: 4.85, w: 12.73, h: 2.4,
    fill:{ color:'1A237E' },
    line:{ color:'FF9800', width:3 },
    rectRadius:0.15,
    shadow:{ type:'outer', color:'00000040', blur:10, offset:5, angle:45 },
  })
  s.addText('REGLA DE ORO', {
    x: 0.3, y: 5.0, w: 12.73, h: 0.4,
    fontSize:14, bold:true, color:'FF9800', fontFace:'Calibri', align:'center',
  })
  s.addText('Ningún Activo sin Cuenta-Propietario.\nNinguna Demanda sin Cuenta-Arrendatario.\nNinguna Oferta sin ambas.', {
    x: 0.3, y: 5.4, w: 12.73, h: 1.7,
    fontSize:22, bold:true, color:'FFFFFF', fontFace:'Calibri', align:'center', valign:'middle', lineSpacingMultiple:1.4,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// GUARDAR
// ══════════════════════════════════════════════════════════════════════════
await prs.writeFile({ fileName: 'FLUJOS_PDB.pptx' })
console.log('OK  FLUJOS_PDB.pptx generado correctamente')
