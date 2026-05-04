// Convierte docs/procesos-resumen.md → docs/procesos-resumen.pptx
//
// Pensado para presentar al ingeniero un resumen ejecutivo:
//  - swim lane Dynamics ↔ PDB (full slide)
//  - tabla de procesos × responsabilidades (pptx table nativa)
//  - 1 slide por módulo con tabla de campos (pptx table nativa)
//  - diagrama final de qué se hereda al cascadear
//
// Estilo Visio: poco texto, mucho diagrama y tablas.

import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import pptxgen from 'pptxgenjs'

const ROOT      = process.cwd()
const MD_PATH   = path.join(ROOT, 'docs/procesos-resumen.md')
const OUT_PATH  = path.join(ROOT, 'docs/procesos-resumen.pptx')
const CACHE_DIR = path.join(ROOT, '.cache-pptx')

const C = {
  bg:        'FFFFFF',
  text:      '0F172A',
  text2:     '475569',
  text3:     '94A3B8',
  accent:    '2563EB',
  accent_lt: 'DBEAFE',
  green:     '15803D',
  green_lt:  'DCFCE7',
  amber:     'B45309',
  amber_lt:  'FEF3C7',
  red:       'DC2626',
  purple:    '7C3AED',
  border:    'E2E8F0',
  surface_alt: 'F8FAFC',
  ink:       '1E293B',
}

await fs.mkdir(CACHE_DIR, { recursive: true })

// ─── Render Mermaid via Kroki con cache ────────────────────────────
async function renderMermaid(src) {
  const hash = crypto.createHash('sha1').update(src).digest('hex').slice(0, 12)
  const cached = path.join(CACHE_DIR, `${hash}.png`)
  try { return await fs.readFile(cached) } catch {}
  const resp = await fetch('https://kroki.io/mermaid/png', {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: src,
  })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(`Kroki ${resp.status}: ${txt.slice(0,200)}`)
  }
  const buf = Buffer.from(await resp.arrayBuffer())
  await fs.writeFile(cached, buf)
  return buf
}

function pngDims(buf) {
  if (!buf || buf.length < 24) return { w: 1000, h: 600 }
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

// ─── Parser markdown ───────────────────────────────────────────────
function parseMd(md) {
  const lines = md.split(/\r?\n/)
  const blocks = []
  let cur = { type: 'text', lines: [] }
  let inFence = false, fenceLang = ''

  function flush() {
    if (cur.type === 'text' && cur.lines.length === 0) return
    blocks.push(cur)
  }

  for (const line of lines) {
    if (inFence) {
      if (line.trim().startsWith('```')) {
        flush(); cur = { type: 'text', lines: [] }
        inFence = false; fenceLang = ''
        continue
      }
      cur.lines.push(line)
      continue
    }
    const fence = line.match(/^```\s*(\w+)?/)
    if (fence) {
      flush()
      inFence = true
      fenceLang = (fence[1] || '').toLowerCase()
      cur = { type: fenceLang === 'mermaid' ? 'mermaid' : 'code', lines: [] }
      continue
    }
    const h = line.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (h) {
      flush()
      blocks.push({ type: 'heading', level: h[1].length, text: h[2] })
      cur = { type: 'text', lines: [] }
      continue
    }
    if (line.trim().startsWith('|')) {
      if (cur.type !== 'table') { flush(); cur = { type: 'table', lines: [] } }
      cur.lines.push(line)
      continue
    }
    if (cur.type === 'table') { flush(); cur = { type: 'text', lines: [] } }
    cur.lines.push(line)
  }
  flush()
  return blocks
}

function parseTable(rawLines) {
  const rows = rawLines
    .map(l => l.trim())
    .filter(l => l.startsWith('|'))
    .map(l => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()))
  // Quitar fila separadora "---"
  const data = rows.filter(r => !r.every(c => /^:?-+:?$/.test(c)))
  if (data.length < 1) return null
  return { header: data[0], rows: data.slice(1) }
}

function clean(t) {
  return (t || '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\\\|/g, '|')
    .trim()
}

// ─── Slide builders ────────────────────────────────────────────────
function setupMaster(pptx) {
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5"
  pptx.defineSlideMaster({
    title: 'BASE',
    background: { color: C.bg },
    objects: [
      { rect: { x: 0, y: 7.10, w: 13.33, h: 0.04, fill: { color: C.accent } } },
      { text: { text: 'PDB CRM · procesos y campos por módulo',
                options: { x: 0.4, y: 7.18, w: 9, h: 0.30, fontSize: 9, color: C.text2, fontFace: 'Calibri' } } },
      { text: { text: 'Confidencial · uso interno',
                options: { x: 9.4, y: 7.18, w: 3.6, h: 0.30, fontSize: 9, color: C.text2, align: 'right', fontFace: 'Calibri' } } },
    ],
  })
}

function addCover(pptx) {
  const s = pptx.addSlide()
  s.background = { color: C.ink }
  s.addText('PDB CRM', { x: 0.6, y: 1.5, w: 12, h: 0.9, fontSize: 56, bold: true, color: 'FFFFFF', fontFace: 'Calibri' })
  s.addText('Procesos y campos por módulo', { x: 0.6, y: 2.6, w: 12, h: 0.7, fontSize: 28, color: 'CBD5E1', fontFace: 'Calibri' })
  s.addText('Vista swim lane Dynamics ↔ PDB · campos a cumplimentar por módulo', {
    x: 0.6, y: 3.5, w: 12, h: 0.5, fontSize: 16, color: '94A3B8', fontFace: 'Calibri',
  })
  s.addShape(pptx.ShapeType.line, { x: 0.6, y: 4.3, w: 4.5, h: 0, line: { color: C.accent, width: 3 } })
  s.addText('Versión 2026-05-04', {
    x: 0.6, y: 6.4, w: 12, h: 0.4, fontSize: 12, color: '64748B', fontFace: 'Calibri',
  })
}

function addSectionDivider(pptx, title, subtitle) {
  const s = pptx.addSlide({ masterName: 'BASE' })
  s.background = { color: C.accent_lt }
  s.addText(title, {
    x: 0.6, y: 2.8, w: 12, h: 1.2, fontSize: 40, bold: true, color: C.accent, fontFace: 'Calibri',
  })
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.6, y: 4.0, w: 12, h: 0.6, fontSize: 16, color: C.text2, fontFace: 'Calibri',
    })
  }
  s.addShape(pptx.ShapeType.line, { x: 0.6, y: 4.7, w: 5, h: 0, line: { color: C.accent, width: 4 } })
}

function addTitleBar(s, title, subtitle) {
  if (subtitle) {
    s.addText(subtitle, { x: 0.4, y: 0.08, w: 8, h: 0.22, fontSize: 9, bold: true, color: C.accent, fontFace: 'Calibri' })
  }
  s.addText(title, {
    x: 0.4, y: 0.25, w: 12.5, h: 0.45, fontSize: 22, bold: true, color: C.text, fontFace: 'Calibri',
  })
  s.addShape(pptx.AddShape ? pptx.AddShape : 'line', { x: 0.4, y: 0.72, w: 12.5, h: 0, line: { color: C.border, width: 0.75 } })
}

function addDiagramSlide(pptx, { title, subtitle, png, caption }) {
  const s = pptx.addSlide({ masterName: 'BASE' })
  // Título
  if (subtitle) s.addText(subtitle, { x: 0.4, y: 0.08, w: 8, h: 0.22, fontSize: 9, bold: true, color: C.accent, fontFace: 'Calibri' })
  s.addText(title, { x: 0.4, y: 0.25, w: 12.5, h: 0.45, fontSize: 22, bold: true, color: C.text, fontFace: 'Calibri' })
  s.addShape(pptx.ShapeType.line, { x: 0.4, y: 0.72, w: 12.5, h: 0, line: { color: C.border, width: 0.75 } })

  const captionH = caption ? 0.55 : 0
  const areaX = 0.4, areaY = 0.85, areaW = 12.5, areaH = 6.55 - captionH
  const dims = pngDims(png)
  const aspect = dims.w / dims.h
  const areaAspect = areaW / areaH
  let w, h, x, y
  if (aspect >= areaAspect) {
    w = areaW; h = areaW / aspect; x = areaX; y = areaY + (areaH - h) / 2
  } else {
    h = areaH; w = areaH * aspect; x = areaX + (areaW - w) / 2; y = areaY
  }
  if (aspect > 5 && w < areaW) {
    const f = Math.min(1.5, areaW / w)
    w *= f; h *= f
    x = areaX + (areaW - w) / 2
    y = areaY + (areaH - h) / 2
  }
  s.addImage({ data: 'data:image/png;base64,' + png.toString('base64'), x, y, w, h })

  if (caption) {
    s.addText(caption, {
      x: 0.4, y: 0.85 + areaH + 0.1, w: 12.5, h: captionH, fontSize: 11, color: C.text2, fontFace: 'Calibri', italic: true, valign: 'top',
    })
  }
}

function addModuleTableSlide(pptx, { title, subtitle, intro, header, rows, footer }) {
  const s = pptx.addSlide({ masterName: 'BASE' })
  if (subtitle) s.addText(subtitle, { x: 0.4, y: 0.08, w: 8, h: 0.22, fontSize: 9, bold: true, color: C.accent, fontFace: 'Calibri' })
  s.addText(title, { x: 0.4, y: 0.25, w: 12.5, h: 0.45, fontSize: 22, bold: true, color: C.text, fontFace: 'Calibri' })
  s.addShape(pptx.ShapeType.line, { x: 0.4, y: 0.72, w: 12.5, h: 0, line: { color: C.border, width: 0.75 } })

  let cursorY = 0.85
  if (intro) {
    s.addText(intro, { x: 0.4, y: cursorY, w: 12.5, h: 0.55, fontSize: 12, color: C.text2, fontFace: 'Calibri', valign: 'top' })
    cursorY += 0.65
  }

  // Tabla de campos. Anchos según cantidad de columnas.
  const ncols = header.length
  const totalW = 12.5
  let colW
  if (ncols === 4) colW = [3.0, 1.5, 1.0, 7.0]    // Campo, Tipo, Obl, Notas
  else if (ncols === 3) colW = [4.0, 2.5, 6.0]
  else colW = Array(ncols).fill(totalW / ncols)

  const headerRow = header.map(h => ({
    text: h,
    options: { bold: true, color: 'FFFFFF', fill: { color: C.accent }, fontSize: 11, fontFace: 'Calibri', align: 'left', valign: 'middle' },
  }))
  const bodyRows = rows.map((r, idx) => r.map((cell, ci) => ({
    text: cell,
    options: {
      fontSize: 10, fontFace: 'Calibri', color: C.text,
      fill: { color: idx % 2 === 0 ? C.surface_alt : 'FFFFFF' },
      align: ci === (ncols === 4 ? 2 : -1) ? 'center' : 'left',
      valign: 'middle',
    },
  })))

  s.addTable([headerRow, ...bodyRows], {
    x: 0.4, y: cursorY, w: totalW,
    colW,
    border: { type: 'solid', color: C.border, pt: 0.5 },
    rowH: 0.32,
    fontFace: 'Calibri',
  })

  if (footer) {
    s.addText(footer, {
      x: 0.4, y: 6.7, w: 12.5, h: 0.4, fontSize: 10, color: C.text3, fontFace: 'Calibri', italic: true,
    })
  }
}

function addProcessTableSlide(pptx, { title, header, rows }) {
  const s = pptx.addSlide({ masterName: 'BASE' })
  s.addText(title, { x: 0.4, y: 0.25, w: 12.5, h: 0.45, fontSize: 22, bold: true, color: C.text, fontFace: 'Calibri' })
  s.addShape(pptx.ShapeType.line, { x: 0.4, y: 0.72, w: 12.5, h: 0, line: { color: C.border, width: 0.75 } })

  // Tabla 4 cols: # | Proceso | Dynamics | PDB
  // Estilo Visio: lane Dynamics en azul, lane PDB en verde
  const colW = [0.5, 3.5, 4.25, 4.25]
  const headerRow = header.map(h => ({
    text: h,
    options: { bold: true, color: 'FFFFFF', fill: { color: C.ink }, fontSize: 11, fontFace: 'Calibri', align: 'left', valign: 'middle' },
  }))
  const bodyRows = rows.map(r => {
    const [num, proc, dyn, pdb] = r
    return [
      { text: num,  options: { fontSize: 10, color: C.text3, align: 'center', valign: 'middle', fontFace: 'Calibri' } },
      { text: proc, options: { fontSize: 10, color: C.text, align: 'left',   valign: 'middle', fontFace: 'Calibri', bold: true } },
      { text: dyn,  options: { fontSize: 10, color: C.text, align: 'left',   valign: 'middle', fontFace: 'Calibri', fill: { color: C.accent_lt } } },
      { text: pdb,  options: { fontSize: 10, color: C.text, align: 'left',   valign: 'middle', fontFace: 'Calibri', fill: { color: C.green_lt } } },
    ]
  })

  s.addTable([headerRow, ...bodyRows], {
    x: 0.4, y: 0.85, w: 12.5, colW,
    border: { type: 'solid', color: C.border, pt: 0.5 },
    rowH: 0.32, fontFace: 'Calibri',
  })

  // Leyenda
  s.addText('Lane Dynamics', { x: 0.4, y: 6.85, w: 1.5, h: 0.3, fontSize: 9, bold: true, color: C.accent, fontFace: 'Calibri', fill: { color: C.accent_lt } })
  s.addText('Lane PDB',      { x: 2.0, y: 6.85, w: 1.5, h: 0.3, fontSize: 9, bold: true, color: C.green,  fontFace: 'Calibri', fill: { color: C.green_lt } })
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  const md = await fs.readFile(MD_PATH, 'utf8')
  const blocks = parseMd(md)

  // Pre-render mermaids
  const mermaids = blocks.filter(b => b.type === 'mermaid')
  console.log(`Rendering ${mermaids.length} Mermaid diagrams via Kroki…`)
  const renderedByIdx = new Map()
  await Promise.all(mermaids.map(async (b, i) => {
    try {
      renderedByIdx.set(b, await renderMermaid(b.lines.join('\n')))
    } catch (e) {
      console.warn(`✗ Mermaid #${i} failed: ${e.message}`)
    }
  }))
  console.log('Done rendering.')

  const pptx = new pptxgen()
  pptx.author = 'PDB CRM'
  pptx.title  = 'Procesos y campos por módulo'
  pptx.company = 'PDB'

  setupMaster(pptx)
  addCover(pptx)

  // Recorremos los bloques agrupando por sección (h2/h3)
  let currentH2 = null
  let currentH3 = null
  let pendingSection2Rows = null

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (b.type === 'heading') {
      if (b.level === 1) continue // Título del doc, ya en la cover
      if (b.level === 2) {
        currentH2 = b.text
        currentH3 = null
        addSectionDivider(pptx, b.text)
      } else if (b.level === 3) {
        currentH3 = b.text
      }
      continue
    }

    if (b.type === 'mermaid') {
      const png = renderedByIdx.get(b)
      const title = currentH3 || currentH2 || 'Diagrama'
      const subtitle = currentH3 ? currentH2 : null
      // Caption: primera frase del párrafo de texto que sigue (si la hay)
      const next = blocks[i + 1]
      const cap = (next && next.type === 'text')
        ? clean(next.lines.find(l => l.trim() && !l.trim().startsWith('-')) || '').slice(0, 220)
        : null
      if (png) addDiagramSlide(pptx, { title, subtitle, png, caption: cap })
      continue
    }

    if (b.type === 'table') {
      const t = parseTable(b.lines)
      if (!t) continue

      // §2: tabla de procesos especial (4 cols: # · Proceso · Dynamics · PDB)
      if (currentH2 && currentH2.startsWith('2.') && t.header.length === 4) {
        addProcessTableSlide(pptx, {
          title: currentH2,
          header: t.header,
          rows: t.rows,
        })
        continue
      }

      // §3.x: tabla de campos por módulo
      if (currentH2 && currentH2.startsWith('3.') && currentH3 && t.header.length === 4) {
        // intro = el bloque text inmediatamente anterior al table
        let intro = null
        for (let j = i - 1; j >= 0; j--) {
          const prev = blocks[j]
          if (prev.type === 'heading') break
          if (prev.type === 'text' && prev.lines.join('').trim()) {
            intro = clean(prev.lines.filter(l => l.trim()).join(' ')).slice(0, 320)
            break
          }
        }
        addModuleTableSlide(pptx, {
          title: currentH3,
          subtitle: 'Módulo',
          intro,
          header: t.header,
          rows: t.rows,
        })
        continue
      }

      // Cualquier otra tabla genérica
      addModuleTableSlide(pptx, {
        title: currentH3 || currentH2 || 'Tabla',
        header: t.header,
        rows: t.rows,
      })
      continue
    }
  }

  await pptx.writeFile({ fileName: OUT_PATH })
  console.log(`\n✓ Generado: ${OUT_PATH}`)
}

main().catch(err => { console.error('ERROR:', err); process.exit(1) })
