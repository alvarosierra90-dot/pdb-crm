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

function addContentSlide(pptx, { title, body, png, isModule }) {
  const s = pptx.addSlide({ masterName: 'BASE' })
  // Header
  s.addText(title, {
    x: 0.4, y: 0.25, w: 12.5, h: 0.5, fontSize: 22, bold: true, color: PALETTE.text, fontFace: 'Calibri',
  })
  if (isModule) {
    s.addText('Módulo', { x: 0.4, y: 0.05, w: 4, h: 0.22, fontSize: 9, bold: true, color: PALETTE.accent, fontFace: 'Calibri' })
  }
  s.addShape(pptx.ShapeType.line, { x: 0.4, y: 0.78, w: 12.5, h: 0, line: { color: PALETTE.border, width: 0.75 } })

  if (png) {
    // Diagrama centrado, texto debajo
    s.addImage({ data: 'data:image/png;base64,' + png.toString('base64'), x: 0.5, y: 0.95, w: 12.3, h: 4.6, sizing: { type: 'contain', w: 12.3, h: 4.6 } })
    if (body) {
      s.addText(body, { x: 0.5, y: 5.7, w: 12.3, h: 1.3, fontSize: 11, color: PALETTE.text2, fontFace: 'Calibri', valign: 'top' })
    }
  } else if (body) {
    // Solo texto
    s.addText(body, { x: 0.5, y: 1.0, w: 12.3, h: 6.0, fontSize: 14, color: PALETTE.text, fontFace: 'Calibri', valign: 'top' })
  } else {
    s.addText('(sin contenido)', { x: 0.5, y: 1.0, w: 12.3, h: 5.5, fontSize: 14, color: PALETTE.text2, italic: true, fontFace: 'Calibri' })
  }
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

    const bodyText = summarizeBody(s.body, 1100)

    if (s.mermaids.length === 0) {
      if (bodyText) {
        // Si el body tiene un bloque de código grande, hacer slide de código
        const codeBlocks = s.body.filter(b => b.type === 'code')
        if (codeBlocks.length === 1 && codeBlocks[0].text.length > 200 && bodyText.length > 200) {
          // text slide + code slide
          addContentSlide(pptx, { title, body: bodyText.replace(codeBlocks[0].text, '').trim(), png: null, isModule })
          addCodeSlide(pptx, { title: title + ' (cont.)', code: codeBlocks[0].text })
        } else {
          addContentSlide(pptx, { title, body: bodyText, png: null, isModule })
        }
      } else if (s.level === 2) {
        // Ya añadimos el divider, no hace falta más
      }
    } else {
      // 1 slide por diagrama (usualmente solo hay 1 por sección)
      s.mermaids.forEach((src, idx) => {
        const png = pngFor(src)
        const slideTitle = s.mermaids.length > 1 ? `${title} (${idx+1}/${s.mermaids.length})` : title
        if (png) {
          addContentSlide(pptx, { title: slideTitle, body: idx === 0 ? bodyText : null, png, isModule })
        } else {
          // Fallback: mostrar el código Mermaid
          addCodeSlide(pptx, { title: slideTitle, code: src, caption: '⚠ Diagrama no renderizado — ver mermaid.live con este código' })
          if (idx === 0 && bodyText) addContentSlide(pptx, { title: slideTitle + ' · notas', body: bodyText, png: null, isModule })
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
