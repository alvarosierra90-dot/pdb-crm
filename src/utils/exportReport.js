/**
 * exportReport.js — PDF & PPT export utility for Savills PDB
 * Uses jsPDF (PDF programmatic) + PptxGenJS (PowerPoint)
 */

import { jsPDF } from 'jspdf'
import pptxgen from 'pptxgenjs'

/* ── Color palette (matches PDB CSS vars) ─────────────────── */
const C = {
  dark:    [15,  22,  35],
  dark2:   [22,  33,  55],
  accent:  [59,  130, 246],
  surface: [248, 250, 252],
  border:  [226, 232, 240],
  stripe:  [241, 245, 249],
  text1:   [15,  23,  42],
  text2:   [51,  65,  85],
  text3:   [100, 116, 139],
  text4:   [148, 163, 184],
  green:   [34,  197, 94],
  amber:   [245, 158, 11],
  purple:  [139, 92,  246],
  teal:    [20,  184, 166],
  white:   [255, 255, 255],
}
const HEX = {
  dark:    '0F1623',
  dark2:   '162137',
  accent:  '3B82F6',
  surface: 'F8FAFC',
  border:  'E2E8F0',
  stripe:  'F1F5F9',
  text1:   '0F172A',
  text2:   '334155',
  text3:   '64748B',
  text4:   '94A3B8',
  green:   '22C55E',
  amber:   'F59E0B',
  purple:  '8B5CF6',
  teal:    '14B8A6',
  white:   'FFFFFF',
}

/* ── A4 constants ─────────────────────────────────────────── */
const W = 210, H = 297, M = 14, CW = W - M * 2

/* ── jsPDF helpers ────────────────────────────────────────── */
const fill   = (doc, col) => doc.setFillColor(...col)
const stroke = (doc, col) => doc.setDrawColor(...col)
const color  = (doc, col) => doc.setTextColor(...col)

function sectionHeader(doc, title, y) {
  fill(doc, C.accent)
  doc.rect(M, y, CW, 7.5, 'F')
  color(doc, C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text(title.toUpperCase(), M + 4, y + 5)
  return y + 7.5
}

function drawPageChrome(doc, config, pageNum, totalHint) {
  // Top bar
  fill(doc, C.dark)
  doc.rect(0, 0, W, 10, 'F')
  fill(doc, C.accent)
  doc.rect(0, 10, W, 0.8, 'F')
  color(doc, C.accent)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text('SAVILLS · PDB', M, 7)
  color(doc, C.text3)
  doc.setFont('helvetica', 'normal')
  doc.text(config.title, W / 2, 7, { align: 'center' })
  color(doc, C.text4)
  doc.text(`Pág. ${pageNum}`, W - M, 7, { align: 'right' })
  // Bottom bar
  fill(doc, C.dark)
  doc.rect(0, H - 7, W, 7, 'F')
  color(doc, C.text4)
  doc.setFontSize(6)
  doc.text('© Savills Aguirre Newman · Uso interno · Confidencial', M, H - 2.5)
  doc.text(new Date().toLocaleDateString('es-ES'), W - M, H - 2.5, { align: 'right' })
}

function drawCover(doc, config) {
  // Full dark top
  fill(doc, C.dark)
  doc.rect(0, 0, W, 90, 'F')
  // Accent stripe
  fill(doc, C.accent)
  doc.rect(0, 90, W, 1.5, 'F')
  // Left accent bar
  fill(doc, C.accent)
  doc.rect(0, 0, 3, 90, 'F')

  // SAVILLS
  color(doc, C.accent)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('SAVILLS', M + 4, 18)
  color(doc, C.text4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('PDB · PLATAFORMA DE DATOS DE BUILDINGS', M + 22, 18)

  // Divider
  fill(doc, C.dark2)
  doc.rect(M + 4, 21, CW - 4, 0.3, 'F')

  // Title
  color(doc, C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  const titleLines = doc.splitTextToSize(config.title, CW - 4)
  doc.text(titleLines, M + 4, 38)

  // Subtitle
  const subtitleY = 38 + titleLines.length * 9
  color(doc, C.text3)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(config.subtitle || '', M + 4, subtitleY)

  // Date
  color(doc, C.text4)
  doc.setFontSize(7.5)
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    M + 4, subtitleY + 12
  )

  // Cover metrics
  let nextY = 100
  if (config.coverMetrics?.length) {
    const n = config.coverMetrics.length
    const mW = CW / n
    config.coverMetrics.forEach((m, i) => {
      const x = M + i * mW
      // Card
      fill(doc, C.surface)
      stroke(doc, C.border)
      doc.setLineWidth(0.3)
      doc.roundedRect(x + 0.5, 97, mW - 2, 20, 1.5, 1.5, 'FD')
      // Accent top
      fill(doc, C.accent)
      doc.rect(x + 0.5, 97, mW - 2, 1.5, 'F')
      // Value
      color(doc, C.text1)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(String(m.value), x + mW / 2 - 1, 111, { align: 'center' })
      // Label
      color(doc, C.text3)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.text(m.label, x + mW / 2 - 1, 115, { align: 'center', maxWidth: mW - 4 })
    })
    nextY = 126
  }

  // Footer
  fill(doc, C.dark)
  doc.rect(0, H - 7, W, 7, 'F')
  color(doc, C.text4)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text('© Savills Aguirre Newman · Uso interno · Confidencial', M, H - 2.5)
  doc.text(new Date().toLocaleDateString('es-ES'), W - M, H - 2.5, { align: 'right' })

  return nextY
}

function renderKpis(doc, data, startY, pageBreakFn) {
  let y = startY + 4
  const cols = Math.min(data.length, 3)
  const kW = CW / cols
  const kH = 19

  let maxRowY = y
  data.forEach((kpi, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const rowY = y + row * (kH + 3)
    if (rowY + kH > H - 15 && row > 0) return // simple overflow guard
    const x = M + col * kW

    fill(doc, C.surface)
    stroke(doc, C.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(x + 0.5, rowY, kW - 2, kH, 1.5, 1.5, 'FD')
    fill(doc, C.accent)
    doc.rect(x + 0.5, rowY, kW - 2, 1.5, 'F')

    color(doc, C.text1)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(String(kpi.value), x + (kW - 2) / 2, rowY + 10.5, { align: 'center' })
    color(doc, C.text3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text(kpi.label, x + (kW - 2) / 2, rowY + 15.5, { align: 'center', maxWidth: kW - 5 })

    maxRowY = Math.max(maxRowY, rowY + kH)
  })
  return maxRowY + 5
}

function renderTable(doc, headers, rows, startY, pageBreakFn) {
  let y = startY + 3
  const n = headers.length
  // Compute column widths (first col wider)
  const firstW = CW * 0.26
  const restW  = (CW - firstW) / (n - 1)
  const colWidths = headers.map((_, i) => i === 0 ? firstW : restW)

  // Header row
  fill(doc, C.dark)
  doc.rect(M, y, CW, 6.5, 'F')
  color(doc, C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  let cx = M
  headers.forEach((h, i) => {
    doc.text(h.toUpperCase(), cx + 2.5, y + 4.5, { maxWidth: colWidths[i] - 3 })
    cx += colWidths[i]
  })
  y += 6.5

  rows.forEach((row, ri) => {
    if (y > H - 15) y = pageBreakFn()
    const rowH = 6.2
    fill(doc, ri % 2 === 0 ? C.stripe : C.white)
    doc.rect(M, y, CW, rowH, 'F')
    stroke(doc, C.border)
    doc.setLineWidth(0.15)
    doc.line(M, y + rowH, M + CW, y + rowH)

    const isLast = ri === rows.length - 1
    color(doc, isLast ? C.text1 : C.text2)
    doc.setFont('helvetica', isLast ? 'bold' : 'normal')
    doc.setFontSize(7.5)
    let cx2 = M
    row.forEach((cell, ci) => {
      doc.text(String(cell ?? ''), cx2 + 2.5, y + 4.3, { maxWidth: colWidths[ci] - 3 })
      cx2 += colWidths[ci]
    })
    y += rowH
  })
  return y + 4
}

function renderChart(doc, data, startY) {
  let y = startY + 3
  const maxVal = Math.max(...data.map(d => d.v ?? d.value ?? 0), 1)
  const labelW = 16
  const trackW = CW - labelW - 18
  const barH   = 5.5
  const gap    = 2

  data.forEach(d => {
    const val = d.v ?? d.value ?? 0
    if (val === 0 && !d.ytd) return
    const pct = val / maxVal
    const lbl = d.y ?? d.q ?? d.label ?? ''

    color(doc, C.text2)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(lbl, M + labelW - 1, y + barH - 1.2, { align: 'right' })

    fill(doc, C.border)
    doc.rect(M + labelW, y, trackW, barH, 'F')
    fill(doc, d.ytd ? C.accent : [148, 163, 184])
    if (pct > 0) doc.rect(M + labelW, y, trackW * pct, barH, 'F')

    color(doc, C.text3)
    doc.setFontSize(6.5)
    const valStr = val > 1000 ? `${(val / 1000).toFixed(1)}k` : String(val)
    doc.text(valStr, M + labelW + trackW * pct + 2, y + barH - 1.2)

    y += barH + gap
  })
  return y + 4
}

/* ═══════════════════════════════════════════════════════════
   PDF EXPORT
═══════════════════════════════════════════════════════════ */
export function exportPDF(config) {
  try {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let pageNum = 1

  const newPage = () => {
    doc.addPage()
    pageNum++
    drawPageChrome(doc, config, pageNum)
    return 18
  }

  let y = drawCover(doc, config)

  for (const section of (config.sections || [])) {
    if (y > H - 45) y = newPage()
    y = sectionHeader(doc, section.title, y) + 2

    if (section.type === 'kpis')   y = renderKpis(doc, section.data, y, newPage)
    if (section.type === 'table')  y = renderTable(doc, section.headers, section.rows, y, newPage)
    if (section.type === 'chart')  y = renderChart(doc, section.data, y)
    if (section.type === 'text') {
      color(doc, C.text2)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      const lines = doc.splitTextToSize(section.content, CW)
      doc.text(lines, M, y + 2)
      y += lines.length * 4 + 6
    }
    y += 5
  }

  // Add chrome to cover page (already has footer)
  // Add chrome to pages 2+
  const total = doc.getNumberOfPages()
  for (let p = 2; p <= total; p++) {
    doc.setPage(p)
    drawPageChrome(doc, config, p)
  }

  const fname = `${(config.filename || config.title).replace(/[^a-z0-9áéíóúñ ]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fname)
  } catch(err) {
    console.error('[exportPDF] error:', err)
    alert(`Error al generar PDF: ${err.message}`)
  }
}

/* ═══════════════════════════════════════════════════════════
   PPT EXPORT
═══════════════════════════════════════════════════════════ */
export function exportPPT(config) {
  try {
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE' // 13.33" × 7.5"
  const SW = 13.33, SH = 7.5

  /* ── Cover slide ── */
  const cover = pptx.addSlide()
  cover.background = { color: HEX.dark }

  // Left accent bar
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: SH, fill: { color: HEX.accent }, line: { type: 'none' } })
  // Bottom accent stripe
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 4.6, w: SW, h: 0.06, fill: { color: HEX.accent }, line: { type: 'none' } })

  // SAVILLS · PDB
  cover.addText([
    { text: 'SAVILLS', options: { bold: true, color: HEX.accent } },
    { text: '  ·  PDB · PLATAFORMA DE DATOS DE BUILDINGS', options: { color: HEX.text4 } },
  ], { x: 0.4, y: 0.35, w: 10, h: 0.35, fontSize: 9, fontFace: 'Calibri' })

  // Title
  cover.addText(config.title, {
    x: 0.4, y: 1.1, w: SW - 0.8, h: 1.5,
    fontSize: 40, bold: true, color: HEX.white, fontFace: 'Calibri',
  })

  // Subtitle
  if (config.subtitle) {
    cover.addText(config.subtitle, {
      x: 0.4, y: 2.8, w: SW - 0.8, h: 0.5,
      fontSize: 14, color: HEX.text3, fontFace: 'Calibri',
    })
  }

  // Date
  cover.addText(
    `Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}  ·  Savills Aguirre Newman`,
    { x: 0.4, y: 4.2, w: SW - 0.8, h: 0.3, fontSize: 8, color: HEX.text4, fontFace: 'Calibri' }
  )

  // Cover metrics
  if (config.coverMetrics?.length) {
    const n = config.coverMetrics.length
    const mW = (SW - 0.8) / n
    config.coverMetrics.forEach((m, i) => {
      const x = 0.4 + i * mW
      cover.addShape(pptx.ShapeType.rect, {
        x, y: 4.9, w: mW - 0.12, h: 1.7,
        fill: { color: HEX.dark2 }, line: { color: HEX.text4, width: 0.5 },
      })
      cover.addShape(pptx.ShapeType.rect, {
        x, y: 4.9, w: mW - 0.12, h: 0.07,
        fill: { color: HEX.accent }, line: { type: 'none' },
      })
      cover.addText(String(m.value), {
        x, y: 5.05, w: mW - 0.12, h: 0.8,
        fontSize: 26, bold: true, color: HEX.white, align: 'center', fontFace: 'Calibri',
      })
      cover.addText(m.label, {
        x, y: 5.9, w: mW - 0.12, h: 0.55,
        fontSize: 8, color: HEX.text3, align: 'center', fontFace: 'Calibri', wrap: true,
      })
    })
  }

  /* ── Content slides ── */
  const addContentSlide = (title) => {
    const sl = pptx.addSlide()
    sl.background = { color: HEX.surface }

    // Header
    sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: SW, h: 0.65, fill: { color: HEX.dark }, line: { type: 'none' } })
    sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0.65, w: SW, h: 0.05, fill: { color: HEX.accent }, line: { type: 'none' } })
    sl.addText(title.toUpperCase(), {
      x: 0.3, y: 0.1, w: 9, h: 0.45,
      fontSize: 10.5, bold: true, color: HEX.white, fontFace: 'Calibri',
    })
    sl.addText('SAVILLS · PDB', {
      x: SW - 2.3, y: 0.18, w: 2, h: 0.3,
      fontSize: 7, color: HEX.text4, align: 'right', fontFace: 'Calibri',
    })
    // Footer
    sl.addShape(pptx.ShapeType.rect, { x: 0, y: SH - 0.38, w: SW, h: 0.38, fill: { color: HEX.dark }, line: { type: 'none' } })
    sl.addText(config.title, {
      x: 0.3, y: SH - 0.32, w: 8, h: 0.28,
      fontSize: 6.5, color: HEX.text4, fontFace: 'Calibri',
    })
    sl.addText(new Date().toLocaleDateString('es-ES'), {
      x: SW - 1.8, y: SH - 0.32, w: 1.5, h: 0.28,
      fontSize: 6.5, color: HEX.text4, align: 'right', fontFace: 'Calibri',
    })
    return sl
  }

  for (const section of (config.sections || [])) {
    const sl = addContentSlide(section.title)
    const contentY = 0.85
    const contentH = SH - contentY - 0.55
    const contentW = SW - 0.6

    if (section.type === 'kpis') {
      const n = section.data.length
      const cols = Math.min(n, 4)
      const kW = contentW / cols
      const rows = Math.ceil(n / cols)
      const kH = Math.min(contentH / rows - 0.15, 2.0)

      section.data.forEach((kpi, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = 0.3 + col * kW
        const y = contentY + row * (kH + 0.12)
        sl.addShape(pptx.ShapeType.rect, {
          x, y, w: kW - 0.12, h: kH,
          fill: { color: HEX.white }, line: { color: HEX.border, width: 0.7 },
        })
        sl.addShape(pptx.ShapeType.rect, {
          x, y, w: kW - 0.12, h: 0.06,
          fill: { color: HEX.accent }, line: { type: 'none' },
        })
        sl.addText(String(kpi.value), {
          x, y: y + kH * 0.18, w: kW - 0.12, h: kH * 0.48,
          fontSize: Math.max(18, Math.min(28, 180 / (String(kpi.value).length + 1))),
          bold: true, color: HEX.text1, align: 'center', fontFace: 'Calibri',
        })
        sl.addText(kpi.label, {
          x, y: y + kH * 0.68, w: kW - 0.12, h: kH * 0.28,
          fontSize: 7.5, color: HEX.text3, align: 'center', fontFace: 'Calibri', wrap: true,
        })
      })
    }

    if (section.type === 'table') {
      const hdrs = section.headers
      const firstW = contentW * 0.26
      const restW  = (contentW - firstW) / (hdrs.length - 1)
      const colW   = hdrs.map((_, i) => i === 0 ? firstW : restW)
      const rowH   = Math.min(0.38, contentH / (section.rows.length + 1))

      const tableRows = [
        hdrs.map((h, i) => ({
          text: h.toUpperCase(),
          options: { bold: true, color: HEX.white, fill: HEX.dark, fontSize: 7.5, align: 'left', fontFace: 'Calibri' },
        })),
        ...section.rows.map((row, ri) => row.map(cell => ({
          text: String(cell ?? ''),
          options: {
            fontSize: 8, color: ri === section.rows.length - 1 ? HEX.text1 : HEX.text2,
            bold: ri === section.rows.length - 1,
            fill: ri % 2 === 0 ? HEX.stripe : HEX.white,
            align: 'left', fontFace: 'Calibri',
          },
        }))),
      ]
      sl.addTable(tableRows, {
        x: 0.3, y: contentY, w: contentW,
        colW, rowH,
        border: { type: 'solid', color: HEX.border, pt: 0.5 },
      })
    }

    if (section.type === 'chart') {
      const data = section.data.filter(d => (d.v ?? d.value ?? 0) > 0 || d.ytd)
      const maxVal = Math.max(...data.map(d => d.v ?? d.value ?? 0), 1)
      const labelW = 0.65
      const trackW = contentW - labelW - 0.8
      const barH   = Math.min(0.42, contentH / data.length - 0.08)
      const gap    = 0.07

      data.forEach((d, i) => {
        const val = d.v ?? d.value ?? 0
        const pct = val / maxVal
        const lbl = d.y ?? d.q ?? d.label ?? ''
        const y   = contentY + i * (barH + gap)

        sl.addText(lbl, {
          x: 0.3, y, w: labelW, h: barH,
          fontSize: 8, color: HEX.text2, align: 'right', fontFace: 'Calibri', valign: 'middle',
        })
        sl.addShape(pptx.ShapeType.rect, {
          x: 0.3 + labelW + 0.08, y, w: trackW, h: barH,
          fill: { color: HEX.border }, line: { type: 'none' },
        })
        if (pct > 0) {
          sl.addShape(pptx.ShapeType.rect, {
            x: 0.3 + labelW + 0.08, y, w: trackW * pct, h: barH,
            fill: { color: d.ytd ? HEX.accent : '94A3B8' }, line: { type: 'none' },
          })
        }
        const valStr = val > 1000 ? `${(val / 1000).toFixed(1)}k` : String(val)
        sl.addText(valStr, {
          x: 0.3 + labelW + 0.08 + trackW * pct + 0.08, y, w: 0.9, h: barH,
          fontSize: 7, color: HEX.text3, align: 'left', fontFace: 'Calibri', valign: 'middle',
        })
      })
    }

    if (section.type === 'text') {
      sl.addText(section.content, {
        x: 0.3, y: contentY, w: contentW, h: contentH,
        fontSize: 10, color: HEX.text2, fontFace: 'Calibri', wrap: true, valign: 'top',
      })
    }
  }

  const fname = `${(config.filename || config.title).replace(/[^a-z0-9áéíóúñ ]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.pptx`
  pptx.writeFile({ fileName: fname }).catch(err => {
    console.error('[exportPPT] writeFile error:', err)
    alert(`Error al generar PPT: ${err.message}`)
  })
  } catch(err) {
    console.error('[exportPPT] error:', err)
    alert(`Error al generar PPT: ${err.message}`)
  }
}
