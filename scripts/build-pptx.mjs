// Convierte docs/diagramas-bd.md → docs/diagramas-bd.pptx
//
// Estrategia:
// 1. Parsea el markdown en secciones (h2/h3/h4) y extrae bloques mermaid.
// 2. Renderiza cada mermaid a PNG vía Kroki (sin install local).
// 3. Cachea los PNG en .cache-pptx/ para re-runs rápidos.
// 4. Ensambla el PPTX con pptxgenjs (1 slide por sección + slides extra
//    para diagramas largos).
//
// Uso: node scripts/build-pptx.mjs

import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import pptxgen from 'pptxgenjs'

const ROOT      = process.cwd()
const MD_PATH   = path.join(ROOT, 'docs/diagramas-bd.md')
const OUT_PATH  = path.join(ROOT, 'docs/diagramas-bd.pptx')
const CACHE_DIR = path.join(ROOT, '.cache-pptx')

const PALETTE = {
  bg:        'FFFFFF',
  text:      '0F172A',
  text2:     '475569',
  accent:    '2563EB',
  accent_lt: 'DBEAFE',
  green:     '15803D',
  amber:     'B45309',
  red:       'DC2626',
  purple:    '7C3AED',
  border:    'E2E8F0',
}

async function ensureDir(p) {
  try { await fs.mkdir(p, { recursive: true }) } catch {}
}

// ─── Render Mermaid → PNG vía Kroki ────────────────────────────────
// Pedimos PNG a Kroki. Para mejor calidad usamos un theme con fonts
// más grandes y guardamos el PNG ya escalado. Kroki PNG output es a
// la resolución natural que Mermaid renderiza — para diagramas anchos
// y bajitos el PNG es 1500x150, lo cual al escalar a la slide se ve
// pequeño pero legible. La presentación visual mejora ampliando el
// área de la slide para el diagrama (no tanto la resolución).
async function renderMermaid(src) {
  const hash = crypto.createHash('sha1').update(src).digest('hex').slice(0, 12)
  const cached = path.join(CACHE_DIR, `${hash}.png`)
  try {
    const buf = await fs.readFile(cached)
    return buf
  } catch {}

  const resp = await fetch('https://kroki.io/mermaid/png', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: src,
  })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(`Kroki ${resp.status}: ${txt.slice(0,200)}`)
  }
  const buf = Buffer.from(await resp.arrayBuffer())
  await fs.writeFile(cached, buf)
  return buf
}

// Devuelve {width, height} de un PNG leyendo el header (8 bytes magic + 8 IHDR + 4 width + 4 height)
function pngDims(buf) {
  if (!buf || buf.length < 24) return null
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  return { w, h }
}

// ─── Parser muy simple del markdown ────────────────────────────────
// Genera una lista de "slides candidatas" — cada h2/h3/h4 es una slide.
function parseMd(md) {
  const lines = md.split(/\r?\n/)
  const slides = []
  let cur = null
  let inFence = false
  let fenceLang = ''
  let fenceBuf = []

  function startSlide(level, title) {
    if (cur) slides.push(cur)
    cur = { level, title, body: [], mermaids: [] }
  }
  startSlide(0, '__pre__')

  for (const line of lines) {
    if (inFence) {
      if (line.trim().startsWith('```')) {
        if (fenceLang === 'mermaid') {
          cur.mermaids.push(fenceBuf.join('\n'))
        } else {
          cur.body.push({ type: 'code', lang: fenceLang, text: fenceBuf.join('\n') })
        }
        inFence = false
        fenceBuf = []
        fenceLang = ''
        continue
      }
      fenceBuf.push(line)
      continue
    }

    const fence = line.match(/^```\s*(\w+)?/)
    if (fence) {
      inFence = true
      fenceLang = (fence[1] || '').toLowerCase()
      fenceBuf = []
      continue
    }

    const h = line.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (h) {
      const lvl = h[1].length
      if (lvl <= 4) { startSlide(lvl, h[2]); continue }
    }

    cur.body.push({ type: 'text', text: line })
  }
  if (cur) slides.push(cur)
  return slides.filter(s => s.title !== '__pre__')
}

// ─── Limpieza markdown → texto plano ───────────────────────────────
function clean(t) {
  return t
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\\\|/g, '|')
    .trim()
}

function summarizeBody(body, maxChars = 1400) {
  const paras = []
  let buf = []
  for (const b of body) {
    if (b.type === 'code') {
      paras.push(b.text)
      continue
    }
    const t = b.text
    if (!t.trim()) {
      if (buf.length) { paras.push(buf.join(' ')); buf = [] }
    } else {
      buf.push(t)
    }
  }
  if (buf.length) paras.push(buf.join(' '))

  const out = paras
    .map(clean)
    .filter(Boolean)
    .filter(p => !p.startsWith('|') && !/^\s*-{3,}\s*$/.test(p))
    .join('\n\n')
  return out.length > maxChars ? out.slice(0, maxChars) + '…' : out
}

// ─── Construcción del PPTX ─────────────────────────────────────────
function setupSlideMasters(pptx) {
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5"
  pptx.defineSlideMaster({
    title: 'BASE',
    background: { color: PALETTE.bg },
    objects: [
      { rect: { x: 0, y: 7.10, w: 13.33, h: 0.05, fill: { color: PALETTE.accent } } },
      { text: {
          text: 'PDB CRM · Diagramas técnicos de base de datos',
          options: { x: 0.4, y: 7.18, w: 9, h: 0.30, fontSize: 9, color: PALETTE.text2, fontFace: 'Calibri' },
      } },
      { text: {
          text: 'Confidencial · uso interno',
          options: { x: 9.4, y: 7.18, w: 3.6, h: 0.30, fontSize: 9, color: PALETTE.text2, align: 'right', fontFace: 'Calibri' },
      } },
    ],
  })
}

function addCover(pptx) {
  const s = pptx.addSlide()
  s.background = { color: PALETTE.text }
  s.addText('PDB CRM', { x: 0.6, y: 1.6, w: 12, h: 0.9, fontSize: 56, bold: true, color: 'FFFFFF', fontFace: 'Calibri' })
  s.addText('Diagramas técnicos de la base de datos', { x: 0.6, y: 2.7, w: 12, h: 0.7, fontSize: 28, color: 'CBD5E1', fontFace: 'Calibri' })
  s.addText('Modelo de entidades · Flujos transversales · State machines · Flujos por módulo', {
    x: 0.6, y: 3.6, w: 12, h: 0.5, fontSize: 16, color: '94A3B8', fontFace: 'Calibri',
  })
  s.addText('Versión 2026-05-04 · migraciones 001-026', {
    x: 0.6, y: 6.4, w: 12, h: 0.4, fontSize: 12, color: '64748B', fontFace: 'Calibri',
  })
  s.addShape(pptx.ShapeType.line, { x: 0.6, y: 4.3, w: 4.5, h: 0, line: { color: PALETTE.accent, width: 3 } })
}

function addSectionDivider(pptx, title) {
  const s = pptx.addSlide({ masterName: 'BASE' })
  s.background = { color: PALETTE.accent_lt }
  s.addText(title, {
    x: 0.6, y: 3.0, w: 12, h: 1.5, fontSize: 40, bold: true, color: PALETTE.accent, fontFace: 'Calibri',
  })
  s.addShape(pptx.ShapeType.line, { x: 0.6, y: 4.4, w: 5, h: 0, line: { color: PALETTE.accent, width: 4 } })
}

function addDiagramSlide(pptx, { title, png, isModule, caption }) {
  const s = pptx.addSlide({ masterName: 'BASE' })
  if (isModule) {
    s.addText('Módulo', { x: 0.4, y: 0.08, w: 4, h: 0.22, fontSize: 9, bold: true, color: PALETTE.accent, fontFace: 'Calibri' })
  }
  s.addText(title, {
    x: 0.4, y: 0.25, w: 12.5, h: 0.45, fontSize: 20, bold: true, color: PALETTE.text, fontFace: 'Calibri',
  })
  s.addShape(pptx.ShapeType.line, { x: 0.4, y: 0.72, w: 12.5, h: 0, line: { color: PALETTE.border, width: 0.75 } })

  // Área del diagrama: ~el resto de la slide. Si hay caption, dejamos sitio
  // para 1-2 líneas debajo. Calcula h y ajusta el rect interno preservando
  // el aspect ratio del PNG (Kroki devuelve aspect variable).
  const captionH   = caption ? 0.45 : 0
  const areaX      = 0.4
  const areaY      = 0.85
  const areaW      = 12.5
  const areaH      = 6.55 - captionH

  const dims = pngDims(png) || { w: areaW * 100, h: areaH * 100 }
  const aspect = dims.w / dims.h
  const areaAspect = areaW / areaH
  let drawW, drawH, drawX, drawY
  if (aspect >= areaAspect) {
    // El diagrama es más ancho que el área → fit width
    drawW = areaW
    drawH = areaW / aspect
    drawX = areaX
    drawY = areaY + (areaH - drawH) / 2
  } else {
    // Más alto → fit height
    drawH = areaH
    drawW = areaH * aspect
    drawX = areaX + (areaW - drawW) / 2
    drawY = areaY
  }

  // Para diagramas muy estrechos (aspect > 5) ampliamos un poco más para
  // que el texto del diagrama no quede minúsculo. Topamos al ancho del área.
  if (aspect > 5 && drawW < areaW) {
    const factor = Math.min(1.5, areaW / drawW)
    drawW *= factor
    drawH *= factor
    drawX = areaX + (areaW - drawW) / 2
    drawY = areaY + (areaH - drawH) / 2
  }

  s.addImage({
    data: 'data:image/png;base64,' + png.toString('base64'),
    x: drawX, y: drawY, w: drawW, h: drawH,
  })

  if (caption) {
    s.addText(caption, {
      x: 0.4, y: 0.85 + areaH + 0.05, w: 12.5, h: captionH, fontSize: 10, color: PALETTE.text2, fontFace: 'Calibri', italic: true, valign: 'top',
    })
  }
}

function addTextSlide(pptx, { title, body, isModule, suffix }) {
  const s = pptx.addSlide({ masterName: 'BASE' })
  if (isModule) {
    s.addText('Módulo', { x: 0.4, y: 0.08, w: 4, h: 0.22, fontSize: 9, bold: true, color: PALETTE.accent, fontFace: 'Calibri' })
  }
  s.addText(title + (suffix ? ' · ' + suffix : ''), {
    x: 0.4, y: 0.25, w: 12.5, h: 0.5, fontSize: 22, bold: true, color: PALETTE.text, fontFace: 'Calibri',
  })
  s.addShape(pptx.ShapeType.line, { x: 0.4, y: 0.78, w: 12.5, h: 0, line: { color: PALETTE.border, width: 0.75 } })
  s.addText(body || '(sin contenido)', {
    x: 0.5, y: 1.0, w: 12.3, h: 6.0, fontSize: 14, color: PALETTE.text, fontFace: 'Calibri', valign: 'top',
    paraSpaceAfter: 6,
  })
}

function addCodeSlide(pptx, { title, code, caption }) {
  const s = pptx.addSlide({ masterName: 'BASE' })
  s.addText(title, {
    x: 0.4, y: 0.25, w: 12.5, h: 0.5, fontSize: 22, bold: true, color: PALETTE.text, fontFace: 'Calibri',
  })
  s.addShape(pptx.ShapeType.line, { x: 0.4, y: 0.78, w: 12.5, h: 0, line: { color: PALETTE.border, width: 0.75 } })
  if (caption) {
    s.addText(caption, { x: 0.5, y: 0.95, w: 12.3, h: 0.5, fontSize: 12, color: PALETTE.text2, fontFace: 'Calibri' })
  }
  s.addText(code, {
    x: 0.5, y: caption ? 1.5 : 0.95, w: 12.3, h: caption ? 5.5 : 6.1,
    fontSize: 10, color: PALETTE.text, fontFace: 'Consolas', valign: 'top',
    fill: { color: 'F8FAFC' }, margin: 8,
  })
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  await ensureDir(CACHE_DIR)
  const md = await fs.readFile(MD_PATH, 'utf8')
  const slides = parseMd(md)
  console.log(`Parsed ${slides.length} sections from markdown`)

  const pptx = new pptxgen()
  pptx.author    = 'PDB CRM · Equipo'
  pptx.title     = 'Diagramas técnicos de la BD'
  pptx.subject   = 'PDB CRM — base de datos'
  pptx.company   = 'PDB'

  setupSlideMasters(pptx)
  addCover(pptx)

  // Pre-renderizar todos los Mermaid en paralelo (con cache)
  const allMermaids = []
  for (const s of slides) for (const m of s.mermaids) allMermaids.push(m)
  console.log(`Rendering ${allMermaids.length} Mermaid diagrams via Kroki…`)
  const pngByHash = new Map()
  let rendered = 0, failed = 0
  await Promise.all(allMermaids.map(async (src) => {
    const hash = crypto.createHash('sha1').update(src).digest('hex').slice(0, 12)
    if (pngByHash.has(hash)) return
    try {
      const png = await renderMermaid(src)
      pngByHash.set(hash, png)
      rendered++
      if (rendered % 5 === 0) console.log(`  · rendered ${rendered}/${allMermaids.length}`)
    } catch (e) {
      failed++
      console.warn(`  ✗ failed (${hash}): ${e.message}`)
      pngByHash.set(hash, null)
    }
  }))
  console.log(`Rendered ${rendered}, failed ${failed}`)

  function pngFor(src) {
    const hash = crypto.createHash('sha1').update(src).digest('hex').slice(0, 12)
    return pngByHash.get(hash) || null
  }

  // Construir slides
  let inSection11 = false
  for (const s of slides) {
    const title = s.title

    // Detectar si es la sección 11 (módulos)
    if (s.level === 2 && /^11\./.test(title)) inSection11 = true
    if (s.level === 2 && !/^11\./.test(title) && inSection11) inSection11 = false
    const isModule = inSection11 && s.level === 3

    // Section divider para H2
    if (s.level === 2) {
      addSectionDivider(pptx, title)
    }

    const bodyText = summarizeBody(s.body, 1800)
    const codeBlocks = s.body.filter(b => b.type === 'code')

    if (s.mermaids.length === 0) {
      if (bodyText) {
        if (codeBlocks.length === 1 && codeBlocks[0].text.length > 200 && bodyText.length > 400) {
          addTextSlide(pptx, { title, body: bodyText.replace(codeBlocks[0].text, '').trim(), isModule })
          addCodeSlide(pptx, { title, code: codeBlocks[0].text })
        } else {
          addTextSlide(pptx, { title, body: bodyText, isModule })
        }
      }
      // si el level 2 no tiene body, ya tiene divider
    } else {
      // Para cada Mermaid: 1 slide solo con el diagrama, ocupando casi toda
      // la slide. Si la sección tiene texto sustancial, primero un slide de
      // texto con el contexto, luego el diagrama. Caption corta debajo.
      const hasSubstantialText = bodyText && bodyText.length > 200
      if (hasSubstantialText) {
        addTextSlide(pptx, { title, body: bodyText, isModule, suffix: 'contexto' })
      }
      // Caption corta = primera frase del body (o nada)
      const shortCaption = bodyText
        ? (bodyText.split(/\.\s+|\n/)[0] || '').slice(0, 220) + (bodyText.length > 220 ? '…' : '')
        : null

      s.mermaids.forEach((src, idx) => {
        const png = pngFor(src)
        const slideTitle = s.mermaids.length > 1 ? `${title} (${idx+1}/${s.mermaids.length})` : title
        if (png) {
          addDiagramSlide(pptx, { title: slideTitle, png, isModule, caption: idx === 0 && !hasSubstantialText ? shortCaption : null })
        } else {
          addCodeSlide(pptx, { title: slideTitle, code: src, caption: '⚠ Diagrama no renderizado — pega el código en mermaid.live' })
        }
      })
    }
  }

  await pptx.writeFile({ fileName: OUT_PATH })
  console.log(`\n✓ Generado: ${OUT_PATH}`)
}

main().catch(err => {
  console.error('ERROR:', err)
  process.exit(1)
})
