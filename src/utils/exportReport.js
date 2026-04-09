/**
 * exportReport.js — PDF (print-window) & PPT (PptxGenJS) export
 */

/* ── Color palette ──────────────────────────────────────── */
const HEX = {
  dark:    '#0F1623',
  dark2:   '#162137',
  accent:  '#3B82F6',
  surface: '#F8FAFC',
  border:  '#E2E8F0',
  stripe:  '#F1F5F9',
  text1:   '#0F172A',
  text2:   '#334155',
  text3:   '#64748B',
  text4:   '#94A3B8',
  green:   '#22C55E',
  amber:   '#F59E0B',
  white:   '#FFFFFF',
}

/* ═══════════════════════════════════════════════════════════
   PDF — print-window (browser native, CSS-rendered)
═══════════════════════════════════════════════════════════ */
export function exportPDF(config) {
  const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  const metricsHtml = config.coverMetrics?.length
    ? `<div class="cover-metrics">
        ${config.coverMetrics.map(m => `
          <div class="cover-kpi">
            <div class="cover-kpi-val">${m.value}</div>
            <div class="cover-kpi-lbl">${m.label}</div>
          </div>`).join('')}
       </div>` : ''

  const sectionsHtml = (config.sections || []).map(s => {
    let body = ''

    if (s.type === 'kpis') {
      body = `<div class="kpi-grid">
        ${s.data.map(k => `
          <div class="kpi-card">
            <div class="kpi-val">${k.value}</div>
            <div class="kpi-lbl">${k.label}</div>
          </div>`).join('')}
      </div>`
    }

    if (s.type === 'table') {
      body = `<table class="rep-table">
        <thead><tr>${s.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${s.rows.map((r, ri) => `
          <tr class="${ri === s.rows.length - 1 ? 'total-row' : ''}">
            ${r.map(c => `<td>${c ?? ''}</td>`).join('')}
          </tr>`).join('')}
        </tbody>
      </table>`
    }

    if (s.type === 'chart') {
      const maxV = Math.max(...s.data.map(d => d.v ?? d.value ?? 0), 1)
      body = `<div class="chart-wrap">
        ${s.data.filter(d => (d.v ?? d.value ?? 0) > 0 || d.ytd).map(d => {
          const val  = d.v ?? d.value ?? 0
          const pct  = Math.round((val / maxV) * 100)
          const lbl  = d.y ?? d.q ?? d.label ?? ''
          const valStr = val > 1000 ? `${(val / 1000).toFixed(1)}k` : String(val)
          return `<div class="chart-row">
            <span class="chart-lbl">${lbl}${d.ytd ? ' YTD' : ''}</span>
            <div class="chart-track">
              <div class="chart-bar ${d.ytd ? 'ytd' : ''}" style="width:${pct}%"></div>
            </div>
            <span class="chart-val">${valStr}</span>
          </div>`
        }).join('')}
      </div>`
    }

    if (s.type === 'text') {
      body = `<p class="rep-text">${s.content}</p>`
    }

    return `<div class="section">
      <div class="section-hdr">${s.title.toUpperCase()}</div>
      <div class="section-body">${body}</div>
    </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${config.title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;color:${HEX.text1};background:#fff}

    /* ── Cover ── */
    .cover{background:${HEX.dark};color:#fff;padding:48px 48px 32px;min-height:280px;position:relative;page-break-after:always}
    .cover-accent{position:absolute;left:0;top:0;width:5px;height:100%;background:${HEX.accent}}
    .cover-brand{font-size:10px;font-weight:700;color:${HEX.accent};letter-spacing:.1em;margin-bottom:4px}
    .cover-brand span{color:${HEX.text4};font-weight:400;margin-left:8px}
    .cover-divider{height:1px;background:${HEX.dark2};margin:10px 0 24px}
    .cover-title{font-size:32px;font-weight:800;line-height:1.15;margin-bottom:10px}
    .cover-subtitle{font-size:13px;color:${HEX.text3};margin-bottom:8px}
    .cover-date{font-size:9px;color:${HEX.text4}}
    .cover-stripe{height:3px;background:${HEX.accent};margin:24px -48px 0}
    .cover-metrics{display:flex;gap:10px;margin-top:24px}
    .cover-kpi{flex:1;background:${HEX.dark2};border-top:3px solid ${HEX.accent};padding:12px 10px 10px;text-align:center}
    .cover-kpi-val{font-size:18px;font-weight:800;color:#fff;margin-bottom:4px}
    .cover-kpi-lbl{font-size:8px;color:${HEX.text4};text-transform:uppercase;letter-spacing:.04em;line-height:1.3}

    /* ── Content ── */
    .content{padding:32px 48px}
    .section{margin-bottom:24px;page-break-inside:avoid}
    .section-hdr{background:${HEX.accent};color:#fff;font-size:8px;font-weight:700;letter-spacing:.08em;padding:5px 10px;border-radius:2px;margin-bottom:10px}
    .section-body{padding:0 2px}

    /* KPI grid */
    .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .kpi-card{background:${HEX.surface};border:1px solid ${HEX.border};border-top:3px solid ${HEX.accent};border-radius:4px;padding:10px 12px}
    .kpi-val{font-size:18px;font-weight:800;color:${HEX.text1};margin-bottom:3px}
    .kpi-lbl{font-size:8px;color:${HEX.text3};text-transform:uppercase;letter-spacing:.04em}

    /* Table */
    .rep-table{width:100%;border-collapse:collapse;font-size:10px}
    .rep-table th{background:${HEX.dark};color:#fff;padding:5px 8px;text-align:left;font-size:8px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
    .rep-table td{padding:5px 8px;border-bottom:1px solid ${HEX.border};color:${HEX.text2}}
    .rep-table tr:nth-child(even) td{background:${HEX.stripe}}
    .rep-table tr.total-row td{font-weight:700;color:${HEX.text1};background:${HEX.stripe};border-top:2px solid ${HEX.border}}

    /* Chart */
    .chart-wrap{display:flex;flex-direction:column;gap:5px}
    .chart-row{display:flex;align-items:center;gap:8px;height:18px}
    .chart-lbl{width:60px;text-align:right;font-size:9px;color:${HEX.text2};flex-shrink:0}
    .chart-track{flex:1;height:12px;background:${HEX.border};border-radius:2px;overflow:hidden}
    .chart-bar{height:100%;background:${HEX.text4};border-radius:2px;transition:width .3s}
    .chart-bar.ytd{background:${HEX.accent}}
    .chart-val{width:40px;font-size:9px;color:${HEX.text3}}

    /* Text */
    .rep-text{font-size:10px;color:${HEX.text2};line-height:1.6}

    /* Footer */
    .footer{position:fixed;bottom:0;left:0;right:0;background:${HEX.dark};color:${HEX.text4};font-size:8px;padding:5px 48px;display:flex;justify-content:space-between}

    /* Print */
    @media print {
      @page{margin:10mm 12mm;size:A4}
      .footer{position:fixed;bottom:0}
      .section{page-break-inside:avoid}
    }
  </style>
</head>
<body>
  <div class="cover">
    <div class="cover-accent"></div>
    <div class="cover-brand">SAVILLS <span>· PDB · PLATAFORMA DE DATOS DE BUILDINGS</span></div>
    <div class="cover-divider"></div>
    <div class="cover-title">${config.title}</div>
    <div class="cover-subtitle">${config.subtitle || ''}</div>
    <div class="cover-date">Generado el ${date}</div>
    <div class="cover-stripe"></div>
    ${metricsHtml}
  </div>
  <div class="content">
    ${sectionsHtml}
  </div>
  <div class="footer">
    <span>© Savills Aguirre Newman · Uso interno · Confidencial</span>
    <span>${config.title} · ${date}</span>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print() }, 400)
    }
  </script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('El navegador ha bloqueado la ventana emergente. Permite los pop-ups para esta página y vuelve a intentarlo.')
    return
  }
  win.document.write(html)
  win.document.close()
}

/* ═══════════════════════════════════════════════════════════
   PPT — PptxGenJS (dynamic import)
═══════════════════════════════════════════════════════════ */
export async function exportPPT(config) {
  let pptxgen
  try {
    const mod = await import('pptxgenjs')
    pptxgen = mod.default
  } catch (e) {
    alert(`No se pudo cargar la librería PPT: ${e.message}`)
    return
  }

  try {
    const pptx = new pptxgen()
    pptx.layout = 'LAYOUT_WIDE'
    const SW = 13.33, SH = 7.5

    const addChrome = (sl, title) => {
      sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: SW, h: 0.65, fill: { color: '0F1623' }, line: { type: 'none' } })
      sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0.65, w: SW, h: 0.05, fill: { color: '3B82F6' }, line: { type: 'none' } })
      sl.addText(title.toUpperCase(), { x: 0.3, y: 0.1, w: 9, h: 0.45, fontSize: 10, bold: true, color: 'FFFFFF', fontFace: 'Calibri' })
      sl.addText('SAVILLS · PDB', { x: SW - 2.2, y: 0.18, w: 1.9, h: 0.3, fontSize: 7, color: '94A3B8', align: 'right', fontFace: 'Calibri' })
      sl.addShape(pptx.ShapeType.rect, { x: 0, y: SH - 0.38, w: SW, h: 0.38, fill: { color: '0F1623' }, line: { type: 'none' } })
      sl.addText(config.title, { x: 0.3, y: SH - 0.32, w: 8, h: 0.28, fontSize: 6.5, color: '94A3B8', fontFace: 'Calibri' })
      sl.addText(new Date().toLocaleDateString('es-ES'), { x: SW - 1.8, y: SH - 0.32, w: 1.5, h: 0.28, fontSize: 6.5, color: '94A3B8', align: 'right', fontFace: 'Calibri' })
    }

    /* ── Cover ── */
    const cover = pptx.addSlide()
    cover.background = { color: '0F1623' }
    cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.1, h: SH, fill: { color: '3B82F6' }, line: { type: 'none' } })
    cover.addShape(pptx.ShapeType.rect, { x: 0, y: 4.5, w: SW, h: 0.06, fill: { color: '3B82F6' }, line: { type: 'none' } })
    cover.addText([
      { text: 'SAVILLS', options: { bold: true, color: '3B82F6' } },
      { text: '  ·  PDB · PLATAFORMA DE DATOS DE BUILDINGS', options: { color: '94A3B8' } },
    ], { x: 0.4, y: 0.35, w: 11, h: 0.35, fontSize: 9, fontFace: 'Calibri' })
    cover.addText(config.title, { x: 0.4, y: 1.1, w: SW - 0.8, h: 1.4, fontSize: 36, bold: true, color: 'FFFFFF', fontFace: 'Calibri' })
    if (config.subtitle) {
      cover.addText(config.subtitle, { x: 0.4, y: 2.65, w: SW - 0.8, h: 0.45, fontSize: 13, color: '64748B', fontFace: 'Calibri' })
    }
    cover.addText(
      `Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}  ·  Savills Aguirre Newman`,
      { x: 0.4, y: 4.1, w: SW - 0.8, h: 0.3, fontSize: 8, color: '94A3B8', fontFace: 'Calibri' }
    )
    if (config.coverMetrics?.length) {
      const n = config.coverMetrics.length
      const mW = (SW - 0.8) / n
      config.coverMetrics.forEach((m, i) => {
        const x = 0.4 + i * mW
        cover.addShape(pptx.ShapeType.rect, { x, y: 4.75, w: mW - 0.1, h: 1.7, fill: { color: '162137' }, line: { color: '334155', width: 0.5 } })
        cover.addShape(pptx.ShapeType.rect, { x, y: 4.75, w: mW - 0.1, h: 0.07, fill: { color: '3B82F6' }, line: { type: 'none' } })
        cover.addText(String(m.value), { x, y: 4.9, w: mW - 0.1, h: 0.75, fontSize: 22, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Calibri' })
        cover.addText(m.label, { x, y: 5.7, w: mW - 0.1, h: 0.6, fontSize: 7.5, color: '64748B', align: 'center', fontFace: 'Calibri', wrap: true })
      })
    }

    /* ── Content slides ── */
    for (const section of (config.sections || [])) {
      const sl = pptx.addSlide()
      sl.background = { color: 'F8FAFC' }
      addChrome(sl, section.title)
      const cy = 0.85, cH = SH - cy - 0.55, cW = SW - 0.6

      if (section.type === 'kpis') {
        const cols = Math.min(section.data.length, 4)
        const kW = cW / cols
        const kH = Math.min(cH / Math.ceil(section.data.length / cols) - 0.12, 1.9)
        section.data.forEach((kpi, i) => {
          const col = i % cols, row = Math.floor(i / cols)
          const x = 0.3 + col * kW, y = cy + row * (kH + 0.12)
          sl.addShape(pptx.ShapeType.rect, { x, y, w: kW - 0.1, h: kH, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.7 } })
          sl.addShape(pptx.ShapeType.rect, { x, y, w: kW - 0.1, h: 0.06, fill: { color: '3B82F6' }, line: { type: 'none' } })
          sl.addText(String(kpi.value), { x, y: y + kH * 0.18, w: kW - 0.1, h: kH * 0.48, fontSize: Math.min(24, Math.max(14, 120 / String(kpi.value).length)), bold: true, color: '0F172A', align: 'center', fontFace: 'Calibri' })
          sl.addText(kpi.label, { x, y: y + kH * 0.68, w: kW - 0.1, h: kH * 0.28, fontSize: 7, color: '64748B', align: 'center', fontFace: 'Calibri', wrap: true })
        })
      }

      if (section.type === 'table') {
        const firstW = cW * 0.26
        const restW  = (cW - firstW) / (section.headers.length - 1)
        const colW   = section.headers.map((_, i) => i === 0 ? firstW : restW)
        const rowH   = Math.min(0.36, cH / (section.rows.length + 1))
        sl.addTable([
          section.headers.map(h => ({ text: h.toUpperCase(), options: { bold: true, color: 'FFFFFF', fill: '0F1623', fontSize: 7.5, align: 'left', fontFace: 'Calibri' } })),
          ...section.rows.map((row, ri) => row.map(cell => ({
            text: String(cell ?? ''),
            options: { fontSize: 8, color: ri === section.rows.length - 1 ? '0F172A' : '334155', bold: ri === section.rows.length - 1, fill: ri % 2 === 0 ? 'F1F5F9' : 'FFFFFF', align: 'left', fontFace: 'Calibri' },
          }))),
        ], { x: 0.3, y: cy, w: cW, colW, rowH, border: { type: 'solid', color: 'E2E8F0', pt: 0.5 } })
      }

      if (section.type === 'chart') {
        const data = section.data.filter(d => (d.v ?? d.value ?? 0) > 0 || d.ytd)
        const maxV = Math.max(...data.map(d => d.v ?? d.value ?? 0), 1)
        const barH = Math.min(0.4, cH / data.length - 0.07)
        data.forEach((d, i) => {
          const val = d.v ?? d.value ?? 0
          const pct = val / maxV
          const lbl = d.y ?? d.q ?? d.label ?? ''
          const y   = cy + i * (barH + 0.07)
          const lblW = 0.65, trackW = cW - lblW - 0.5
          sl.addText(lbl + (d.ytd ? ' YTD' : ''), { x: 0.3, y, w: lblW, h: barH, fontSize: 8, color: '334155', align: 'right', fontFace: 'Calibri', valign: 'middle' })
          sl.addShape(pptx.ShapeType.rect, { x: 0.3 + lblW + 0.08, y, w: trackW, h: barH, fill: { color: 'E2E8F0' }, line: { type: 'none' } })
          if (pct > 0) sl.addShape(pptx.ShapeType.rect, { x: 0.3 + lblW + 0.08, y, w: trackW * pct, h: barH, fill: { color: d.ytd ? '3B82F6' : '94A3B8' }, line: { type: 'none' } })
          const valStr = val > 1000 ? `${(val / 1000).toFixed(1)}k` : String(val)
          sl.addText(valStr, { x: 0.3 + lblW + 0.08 + trackW * pct + 0.06, y, w: 0.8, h: barH, fontSize: 7, color: '94A3B8', align: 'left', fontFace: 'Calibri', valign: 'middle' })
        })
      }

      if (section.type === 'text') {
        sl.addText(section.content, { x: 0.3, y: cy, w: cW, h: cH, fontSize: 10, color: '334155', fontFace: 'Calibri', wrap: true, valign: 'top' })
      }
    }

    const fname = `${(config.filename || config.title).replace(/[^a-z0-9áéíóúñ ]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.pptx`
    await pptx.writeFile({ fileName: fname })
  } catch (err) {
    console.error('[exportPPT]', err)
    alert(`Error al generar PPT: ${err.message}`)
  }
}
