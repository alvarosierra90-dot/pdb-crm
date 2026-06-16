import { useState, useRef, useEffect } from 'react'
import '../styles/hoteles.css'
import {
  Home, FileText, Star, LayoutGrid, UploadCloud, ChevronRight,
  Download, Play, X, Plus, Trash2, Sparkles,
} from 'lucide-react'

/* ============================================================================
 * Hoteles · suite de análisis hotelero — nativo PDB (.hot-skin)
 * Port a React del prototipo de 3 módulos:
 *   1. Revisión de contratos (plantilla HLA, deck y export Word)
 *   2. Score de hoteles (comp set / gravity, autocompletado IA)
 *   3. Presentación (P&L editable + microsite ejecutiva)
 * TODA la IA pasa por el proxy serverless /api/gemini (Google Gemini),
 * igual que Pitch — la clave nunca se expone en el navegador.
 * ========================================================================== */

const AI_MODEL = 'gemini-2.5-flash'

// ── Proxy IA (Gemini) ──
async function callAI(parts, maxTokens) {
  const res = await fetch('/api/gemini', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: maxTokens, temperature: 0.4, responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 }, // sin "thinking": evita truncar el JSON
      },
    }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Error ${res.status}`) }
  const d = await res.json()
  if (d?.promptFeedback?.blockReason) throw new Error('Bloqueado por seguridad: ' + d.promptFeedback.blockReason)
  return (d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('')
}
const parseJSON = raw => JSON.parse((raw || '').replace(/```json|```/g, '').trim())
const uid = () => Math.random().toString(36).slice(2, 9)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

/* ──────────────────────────── Plantilla HLA ──────────────────────────── */
const HLA = [
  ['Signature date', '-', 'Include the contract execution date'],
  ['Purpose of the contract', '-', 'Specify the purpose of the contract'],
  ['Lessee', '-', 'Include name and NIF of the lessee'],
  ['Lessor', '-', 'Include name and NIF of the lessor'],
  ['Guarantor', '-', 'Include details of the guarantor, if any'],
  ['Duration', 'Full Term', 'Specify the total term of the contract'],
  ['Duration', 'Mandatory Period', 'Specify the minimum mandatory term of the contract'],
  ['Renewal', 'Rights', 'Specify the renewal terms'],
  ['Renewal', 'Conditions', 'Specify the renewal rights of both the lessor and the lessee'],
  ['Break clauses', '-', 'Indicate whether any break clauses exist; if not, state No'],
  ['Performance Clause', '-', 'Indicate whether any performance clauses exist; if not, state No'],
  ['Grounds for Termination', '-', 'Specify the contractual grounds for termination'],
  ['GMI', 'Quantum / Calculation', 'Specify the exact amount or calculation method of the Guaranteed Minimum Income (rent)'],
  ['GMI', 'Update', 'Specify whether there are annual adjustments to the GMI and how they are applied'],
  ['GMI', 'Payment terms', 'Specify the payment terms of the GMI'],
  ['Variable rent', 'Quantum / Calculation', 'Specify the exact amount or calculation method of the variable rent'],
  ['Variable rent', 'Update', 'Specify whether there are annual adjustments to the variable rent and how they are applied'],
  ['Variable rent', 'Payment terms', 'Specify the payment terms of the variable rent'],
  ['FF&E Reserve', 'Quantum / Calculation', 'Specify the exact amount or calculation method of the FF&E Reserve'],
  ['FF&E Reserve', 'Update', 'Specify whether there are annual adjustments to the FF&E Reserve and how they are applied'],
  ['R&M', 'Routine / Structural', 'Include all provisions relating to repair and maintenance obligations'],
  ['R&M', 'CAPEX', 'Include all provisions relating to CAPEX and investment obligations'],
  ['Licences and Permits', '-', 'Include all provisions relating to licences and permits'],
  ['Insurances', 'Lessee', 'Include all insurance obligations applicable to the lessee'],
  ['Insurances', 'Lessor', 'Include all insurance obligations applicable to the lessor'],
  ['Staff', '-', 'Include all provisions relating to personnel and staff'],
  ['Taxes', 'Lessee', 'Include all tax obligations applicable to the lessee'],
  ['Taxes', 'Lessor', 'Include all tax obligations applicable to the lessor'],
  ['Subletting and Assignment', '-', 'Include all provisions relating to subletting and assignment'],
  ['Security Deposit', 'Cash', 'Specify whether a cash security deposit is required'],
  ['Security Deposit', 'Bank Guarantee', 'Specify whether a bank guarantee is required as security'],
  ['Security Deposit', 'Corporate Guarantee', 'Specify whether a corporate guarantee is required as security'],
  ['Return of the Property', '-', 'Specify the lessee obligations upon termination, including the condition and handover of the property'],
  ['Jurisdiction', '-', 'Specify the applicable jurisdiction of the contract'],
  ['Governing Law', '-', 'Specify the governing law of the contract'],
  ['Access to hotel', '-', 'Specify the terms under which the lessor may access the hotel'],
  ['Lessor representative', '-', 'Specify whether a lessor representative is appointed'],
  ['Lessee information', '-', 'Specify the reporting obligations and information to be provided by the lessee to the lessor'],
]

/* ════════════════════════════ MÓDULO 1 ════════════════════════════════ */
function ModContratos() {
  const [criteria, setCriteria] = useState(HLA.map(r => [...r]))
  const [lobName, setLobName] = useState('Hoteles — HLA')
  const [impName, setImpName] = useState('')
  const [critOpen, setCritOpen] = useState(false)
  const [doc, setDoc] = useState(null) // {name, kind:'pdf'|'text', data}
  const [over, setOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [deck, setDeck] = useState(null) // {slides, idx}
  const impRef = useRef(null)
  const docRef = useRef(null)

  const ready = criteria.length > 0 && !!doc

  /* Plantilla en blanco */
  const downloadBlank = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const instr = [
      ['PLANTILLA DE ANÁLISIS CONTRACTUAL'], [''],
      ['Cómo usar esta plantilla:'],
      ["1. Ve a la hoja 'Template'."],
      ['2. Cada fila es un punto que la IA analizará en el contrato.'],
      ["3. Columna 'Category': el concepto (ej. Duration, GMI, Insurances)."],
      ["4. Columna 'Subcategory': matiz dentro del concepto (usa '-' si no aplica)."],
      ["5. Columna 'Description': instrucción clara de QUÉ debe extraer la IA."],
      ['6. Añade, edita o elimina filas según las cláusulas que interesen a tu equipo.'],
      ["7. Deja vacías 'Contract summary' y 'Page in Contract': las rellena la IA."],
      ['8. Guarda e importa el Excel en la herramienta.'], [''],
      ["Consejo: cuanto más concreta sea la 'Description', mejor será el análisis."],
    ]
    const wsI = XLSX.utils.aoa_to_sheet(instr); wsI['!cols'] = [{ wch: 90 }]
    XLSX.utils.book_append_sheet(wb, wsI, 'Instrucciones')
    const head = ['Category', 'Subcategory', 'Description', 'Contract summary', 'Page in Contract']
    const wsT = XLSX.utils.aoa_to_sheet([head, ...HLA.map(r => [r[0], r[1], r[2], '', ''])])
    wsT['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 60 }, { wch: 40 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsT, 'Template')
    XLSX.writeFile(wb, 'Plantilla_Analisis_Contratos.xlsx')
  }

  /* Importar plantilla rellena */
  const importTemplate = async (f) => {
    if (!f) return
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(await f.arrayBuffer())
      const sh = wb.Sheets['Template'] || wb.Sheets[wb.SheetNames[wb.SheetNames.length - 1]]
      const rows = XLSX.utils.sheet_to_json(sh, { header: 1 }).filter(r => r.length)
      const start = (rows[0] && /category/i.test(rows[0][0])) ? 1 : 0
      const c = rows.slice(start).map(r => [r[0] || '', r[1] || '-', r[2] || '']).filter(r => r[0])
      if (!c.length) throw new Error('vacío')
      setCriteria(c); setLobName(f.name.replace(/\.(xlsx|xls)$/i, '')); setImpName(f.name)
    } catch { alert('No se pudo leer la plantilla. Usa el formato descargado.') }
  }

  /* Subida del contrato */
  const handleDoc = async (f) => {
    if (!f) return
    setErr('')
    const ext = f.name.split('.').pop().toLowerCase()
    if (ext === 'pdf') {
      const rd = new FileReader()
      rd.onload = e => setDoc({ name: f.name, kind: 'pdf', data: e.target.result.split(',')[1] })
      rd.readAsDataURL(f)
    } else if (ext === 'docx') {
      try {
        const m = await import('mammoth/mammoth.browser.js'); const mammoth = m.default || m
        const { value } = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })
        if (!value || !value.trim()) throw new Error('vacío')
        setDoc({ name: f.name, kind: 'text', data: value })
      } catch { alert('No se pudo leer el Word.') }
    } else if (ext === 'txt') {
      setDoc({ name: f.name, kind: 'text', data: await f.text() })
    } else alert('Formato no soportado. Usa PDF, Word (.docx) o TXT.')
  }

  /* Análisis */
  const analyze = async () => {
    setErr(''); setLoading(true)
    const critList = criteria.map((c, i) => `${i + 1}. [${c[0]}${c[1] && c[1] !== '-' ? ' / ' + c[1] : ''}] ${c[2]}`).join('\n')
    const sys = `Eres analista contractual senior de una consultora inmobiliaria. Analizas el contrato adjunto frente a una lista de criterios. Para CADA criterio devuelve un objeto con: "summary" (resumen claro y conciso en español de lo que dice el contrato sobre ese punto, 1-3 frases, con los datos concretos: importes, plazos, %), "page" (número o rango de página/cláusula donde aparece, o "" si no se localiza), "status" ("found" si está bien recogido, "attention" si existe pero tiene algún matiz/riesgo a revisar, "missing" si no aparece en el contrato), "highlight" (true si es un punto clave que destacar). Responde SOLO con JSON válido, sin markdown: un objeto {"meta":{"title":"breve título del contrato","parties":"partes principales","date":"fecha de firma si consta"},"items":[{...}]} con un item por criterio, EN EL MISMO ORDEN.`
    const userText = `CRITERIOS A ANALIZAR:\n${critList}\n\nAnaliza el contrato adjunto según estos criterios y devuelve el JSON.`
    const parts = doc.kind === 'pdf'
      ? [{ inlineData: { mimeType: 'application/pdf', data: doc.data } }, { text: sys + '\n\n' + userText }]
      : [{ text: sys + '\n\nCONTRATO:\n' + doc.data + '\n\n' + userText }]
    try {
      const j = parseJSON(await callAI(parts, 8000))
      const items = (j.items || []).map((it, i) => ({ ...it, _cat: criteria[i]?.[0] || '', _sub: criteria[i]?.[1] || '' }))
      setAnalysis({ meta: j.meta || {}, items })
      try { document.querySelector('.hot-skin .content')?.scrollTo(0, 0) } catch { /* noop */ }
    } catch (e) {
      setErr('No se pudo completar el análisis: ' + e.message + '. Revisa el contrato e inténtalo de nuevo.')
    } finally { setLoading(false) }
  }

  const newAnalysis = () => { setAnalysis(null); setDoc(null); setErr('') }

  /* Export Word */
  const exportWord = () => {
    if (!analysis) return
    const rows = analysis.items.map(it => {
      const status = it.status === 'missing' ? 'NO LOCALIZADO' : it.status === 'attention' ? 'REVISAR' : 'OK'
      return `<tr><td style="border:1px solid #ccc;padding:6px"><b>${esc(it._cat)}</b>${it._sub && it._sub !== '-' ? ' / ' + esc(it._sub) : ''}</td>
        <td style="border:1px solid #ccc;padding:6px">${esc(it.summary || '—')}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${it.page ? esc(it.page) : '—'}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${status}</td></tr>`
    }).join('')
    const m = analysis.meta || {}
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body style="font-family:Calibri,Arial">
      <h1>${esc(m.title || 'Análisis del contrato')}</h1>
      <p>${esc(m.parties || '')} ${m.date ? (' · Firma: ' + esc(m.date)) : ''}<br>Plantilla: ${esc(lobName)}</p>
      <table style="border-collapse:collapse;width:100%;font-size:11pt">
      <tr style="background:#1f5f5b;color:#fff"><th style="border:1px solid #ccc;padding:6px;text-align:left">Cláusula</th><th style="border:1px solid #ccc;padding:6px;text-align:left">Resumen</th><th style="border:1px solid #ccc;padding:6px">Pág.</th><th style="border:1px solid #ccc;padding:6px">Estado</th></tr>
      ${rows}</table></body></html>`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/msword' }))
    a.download = (m.title || 'analisis_contrato').replace(/[^\w]+/g, '_') + '.doc'; a.click()
  }

  /* Deck */
  const openDeck = () => {
    if (!analysis) return
    const { items, meta } = analysis
    const attn = items.filter(i => i.status === 'attention').length
    const miss = items.filter(i => i.status === 'missing').length
    const slides = [{
      sn: 'Resumen', h: meta.title || 'Análisis del contrato',
      sub: (meta.parties || '') + (meta.date ? (' · ' + meta.date) : ''),
      body: `${items.length} cláusulas analizadas · ${attn} a revisar · ${miss} no localizadas`, pg: lobName, badge: null,
    }]
    items.filter(i => i.highlight || i.status !== 'found').forEach(it => slides.push({
      sn: it._cat, h: (it._sub && it._sub !== '-') ? it._sub : it._cat, sub: (it._sub && it._sub !== '-') ? it._cat : '',
      body: it.summary || '—', pg: it.page ? ('Página ' + it.page) : '',
      badge: it.status === 'missing' ? ['No localizado', '#9c3329'] : it.status === 'attention' ? ['Revisar', '#9a6b00'] : null,
    }))
    if (slides.length === 1) items.forEach(it => slides.push({
      sn: it._cat, h: (it._sub && it._sub !== '-') ? it._sub : it._cat, sub: '',
      body: it.summary || '—', pg: it.page ? ('Página ' + it.page) : '', badge: null,
    }))
    setDeck({ slides, idx: 0 })
  }
  useEffect(() => {
    if (!deck) return
    const onKey = e => {
      if (e.key === 'ArrowRight') setDeck(d => d && { ...d, idx: Math.min(d.idx + 1, d.slides.length - 1) })
      if (e.key === 'ArrowLeft') setDeck(d => d && { ...d, idx: Math.max(d.idx - 1, 0) })
      if (e.key === 'Escape') setDeck(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deck])

  const stats = analysis ? (() => {
    const items = analysis.items
    const attn = items.filter(i => i.status === 'attention').length
    const miss = items.filter(i => i.status === 'missing').length
    return { tot: items.length, attn, miss, ok: items.length - attn - miss }
  })() : null

  const groups = analysis ? analysis.items.reduce((g, it) => { (g[it._cat] = g[it._cat] || []).push(it); return g }, {}) : {}

  return (
    <div className="wrap">
      {!analysis && !loading && (
        <div className="steps">
          {/* Paso 1 */}
          <div className="ccard">
            <div className="ccardhead">
              <div className={'step-n done'}>1</div>
              <div className="step-title">Elige la plantilla de análisis</div>
              <div className="step-meta">{criteria.length} criterios</div>
            </div>
            <div className="ccardbody">
              <label className="fld">Línea de negocio</label>
              <select value="HLA" onChange={e => { if (e.target.value === 'custom') impRef.current?.click() }}>
                <option value="HLA">Hoteles — Hotel Lease Agreement (HLA)</option>
                <option value="custom">Plantilla personalizada (importar Excel)</option>
              </select>
              <div className="row" style={{ marginTop: 16 }}>
                <button className="btn" onClick={downloadBlank}><Download size={15} /> Descargar plantilla en blanco</button>
                <button className="btn ghost" onClick={() => impRef.current?.click()}><UploadCloud size={15} /> Importar plantilla rellena</button>
                <input ref={impRef} type="file" accept=".xlsx,.xls" hidden onChange={e => importTemplate(e.target.files[0])} />
              </div>
              {impName && <div className="file-pill" style={{ marginTop: 12 }}>{impName} <span className="x" onClick={() => { setImpName(''); setCriteria(HLA.map(r => [...r])); setLobName('Hoteles — HLA') }}>×</span></div>}
              <p className="hint">La plantilla en blanco incluye una hoja de <strong>instrucciones</strong> y la estructura de criterios. Un director edita las cláusulas que interesan al equipo, la rellena y la vuelve a importar aquí.</p>
              <div style={{ marginTop: 18 }}>
                <button className="crit-toggle" aria-expanded={critOpen} onClick={() => setCritOpen(o => !o)}>
                  <span>{critOpen ? 'Ocultar' : 'Ver'} los {criteria.length} criterios · {lobName}</span>
                  <span className="chev"><ChevronRight size={16} /></span>
                </button>
                <div className={'crit-wrap' + (critOpen ? ' open' : '')}>
                  <table className="crit-table">
                    <thead><tr><th>Categoría</th><th>Subcategoría</th><th>Qué analiza</th></tr></thead>
                    <tbody>{criteria.map((r, i) => (
                      <tr key={i}><td><strong>{r[0]}</strong></td><td>{r[1] || '—'}</td><td style={{ color: 'var(--ink-soft)' }}>{r[2]}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 2 */}
          <div className={'ccard' + (criteria.length ? '' : ' dim')}>
            <div className="ccardhead">
              <div className={'step-n' + (doc ? ' done' : '')}>2</div>
              <div className="step-title">Sube el contrato</div>
              <div className="step-meta">{doc?.name || ''}</div>
            </div>
            <div className="ccardbody">
              <div className={'drop' + (over ? ' over' : '')} onClick={() => docRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
                onDrop={e => { e.preventDefault(); setOver(false); handleDoc(e.dataTransfer.files[0]) }}>
                <div className="ic"><UploadCloud size={24} /></div>
                <div className="t">Arrastra el contrato o haz clic</div>
                <div className="h">PDF, Word (.docx) o TXT</div>
              </div>
              <input ref={docRef} type="file" accept=".pdf,.docx,.txt" hidden onChange={e => handleDoc(e.target.files[0])} />
              {doc && <div className="file-pill"><FileText size={14} /> {doc.name} <span className="x" onClick={() => setDoc(null)}>×</span></div>}
            </div>
          </div>

          {/* Paso 3 */}
          <div className={'ccard' + (doc ? '' : ' dim')}>
            <div className="ccardhead">
              <div className="step-n">3</div>
              <div className="step-title">Analizar</div>
            </div>
            <div className="ccardbody">
              <button className="btn primary" disabled={!ready} onClick={analyze}>Analizar contrato</button>
              {err && <div className="err">{err}</div>}
              <p className="hint">El análisis recorre cada criterio de la plantilla, localiza la cláusula en el contrato e indica la página. Marca lo que falta o requiere atención.</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="cloading"><div className="cspin" /><div>Analizando contrato…</div></div>
      )}

      {analysis && !loading && (
        <div style={{ padding: '4px 0 80px' }}>
          <div className="rep-actions">
            <button className="btn" onClick={newAnalysis}>← Nuevo análisis</button>
            <button className="btn" onClick={openDeck}><Play size={14} /> Modo presentación</button>
            <button className="btn" onClick={exportWord}><Download size={14} /> Exportar a Word</button>
          </div>
          <div className="rep-head">
            <div className="rep-title">{analysis.meta.title || 'Análisis del contrato'}</div>
            <div className="rep-line">{[analysis.meta.parties, analysis.meta.date ? 'Firma: ' + analysis.meta.date : '', lobName].filter(Boolean).join('  ·  ')}</div>
            <div className="kpis">
              <div className="kpi"><div className="v mono">{stats.tot}</div><div className="l">Cláusulas analizadas</div></div>
              <div className="kpi"><div className="v mono">{stats.ok}</div><div className="l">Correctas</div></div>
              <div className="kpi attn"><div className="v mono">{stats.attn}</div><div className="l">A revisar</div></div>
              <div className="kpi miss"><div className="v mono">{stats.miss}</div><div className="l">No localizadas</div></div>
            </div>
          </div>
          {Object.keys(groups).map(cat => (
            <div className="group" key={cat}>
              <div className="group-h">{cat}</div>
              {groups[cat].map((it, i) => {
                const st = it.status === 'missing' ? 'miss' : it.status === 'attention' ? 'attn' : 'found'
                return (
                  <div className={'clause ' + st} key={i}>
                    <div className={'dot ' + st} />
                    <div className="c-main">
                      <div className="c-cat">{it._cat}{it._sub && it._sub !== '-' && <span className="c-sub">{it._sub}</span>}</div>
                      <div className="c-sum">{it.summary || '—'}</div>
                      {st === 'miss' && <div className="tag miss">No localizado</div>}
                      {st === 'attn' && <div className="tag attn">Revisar</div>}
                    </div>
                    <div className="c-side"><div className="c-page mono">{it.page ? ('p. ' + it.page) : '—'}</div></div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {deck && (() => {
        const s = deck.slides[deck.idx]
        return (
          <div className="deck">
            <button className="deck-close" onClick={() => setDeck(null)}>×</button>
            <div className="slide">
              <div className="sn">{s.sn}</div>
              <h2>{s.h}</h2>
              {s.sub && <div className="sub2">{s.sub}</div>}
              <div className="body">{s.body}</div>
              {s.badge && <div className="badge" style={{ background: s.badge[1] + '22', color: s.badge[1] }}>{s.badge[0]}</div>}
              {s.pg && <div className="pg mono">{s.pg}</div>}
            </div>
            <div className="deck-nav">
              <button onClick={() => setDeck(d => ({ ...d, idx: Math.max(d.idx - 1, 0) }))}>‹ Anterior</button>
              <div className="pos mono">{deck.idx + 1} / {deck.slides.length}</div>
              <button onClick={() => setDeck(d => ({ ...d, idx: Math.min(d.idx + 1, d.slides.length - 1) }))}>Siguiente ›</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ════════════════════════════ MÓDULO 2 ════════════════════════════════ */
function conditionRating(year) {
  year = +year; if (!year) return 0
  if (year < 2003) return 1; if (year >= 2024) return 5
  const t = [[2003, 1], [2006, 1.5], [2009, 2], [2012, 2.5], [2015, 3], [2017, 3.5], [2019, 4], [2021, 4.5], [2024, 5]]
  let r = 1; for (const [y, v] of t) { if (year >= y) r = v } return r
}
function computeScores(hotels, pois, amenities) {
  const der = {}
  hotels.forEach(h => {
    const ds = pois.map(p => h.distances[p.id]).filter(v => typeof v === 'number' && !isNaN(v))
    der[h.id] = { distAvg: ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null, facCount: amenities.filter(a => h.amenities[a]).length }
  })
  const distAvgs = hotels.map(h => der[h.id].distAvg).filter(v => v != null)
  const distCS = distAvgs.length ? distAvgs.reduce((a, b) => a + b, 0) / distAvgs.length : 1
  const facMax = Math.max(1, ...hotels.map(h => der[h.id].facCount))
  hotels.forEach(h => {
    const d = der[h.id]
    const loc = d.distAvg != null ? clamp(5 - d.distAvg / (distCS || 1), 0, 5) : 0
    const facScore = 5 * d.facCount / facMax
    const cond = conditionRating(h.lastRefurb)
    const prod = (facScore + (cond || facScore)) / (cond ? 2 : 1)
    const rt = []; if (+h.stars) rt.push(+h.stars); if (+h.booking) rt.push(+h.booking / 2); if (+h.tripadvisor) rt.push(+h.tripadvisor)
    const rat = rt.length ? rt.reduce((a, b) => a + b, 0) / rt.length : 0
    Object.assign(d, { loc, prod, rat, total: (loc + prod + rat) / 3, cond })
  })
  const cs = hotels.filter(h => h.inCS === 'Yes')
  const avg = k => cs.length ? cs.reduce((a, b) => a + der[b.id][k], 0) / cs.length : 0
  return { der, csAvg: { loc: avg('loc'), prod: avg('prod'), rat: avg('rat'), total: avg('total') }, csCount: cs.length }
}
const newScoreHotel = (subject) => ({
  id: uid(), name: '', address: '', web: '', stars: '', keys: '', group: '', brand: '', lastRefurb: '',
  booking: '', tripadvisor: '', amenities: {}, distances: {}, isSubject: subject, inCS: 'Yes', open: true,
})

function ModScore() {
  const [city, setCity] = useState('')
  const [started, setStarted] = useState(false)
  const [pane, setPane] = useState('config')
  const [pois, setPois] = useState([{ id: uid(), name: '' }, { id: uid(), name: '' }, { id: uid(), name: '' }])
  const [amenities, setAmenities] = useState(['F&B', 'Salas de reuniones', 'Auditorio', 'Spa', 'Piscina', 'Gimnasio', 'Parking'])
  const [amInput, setAmInput] = useState('')
  const [hotels, setHotels] = useState([])
  const [hName, setHName] = useState('')
  const [poiLoad, setPoiLoad] = useState(false)
  const [busy, setBusy] = useState({}) // id -> bool

  const { der, csAvg, csCount } = computeScores(hotels, pois, amenities)
  const setHotel = (id, patch) => setHotels(p => p.map(h => h.id === id ? { ...h, ...patch } : h))

  const suggestPoi = async () => {
    if (!city.trim()) return
    setPoiLoad(true)
    try {
      const prompt = `Devuelve SOLO JSON sin markdown: {"pois":["punto 1","punto 2","punto 3"]} con los 3 principales puntos turísticos o hitos de referencia de la ciudad indicada, los más relevantes para valorar la ubicación de un hotel.\nCiudad: ${city}`
      const j = parseJSON(await callAI([{ text: prompt }], 500))
      if (j.pois?.length) setPois(j.pois.slice(0, 5).map(n => ({ id: uid(), name: n })))
    } catch (e) { alert('No se pudieron sugerir puntos (' + e.message + '). Puedes escribirlos a mano.') }
    finally { setPoiLoad(false) }
  }

  const addAm = () => { const v = amInput.trim(); if (v && !amenities.includes(v)) { setAmenities(a => [...a, v]); setAmInput('') } }

  const start = () => {
    if (!city.trim()) { alert('Indica la ciudad de análisis.'); return }
    const valid = pois.filter(p => p.name.trim())
    if (!valid.length) { alert('Añade al menos un punto turístico.'); return }
    setPois(valid); setStarted(true); setPane('set')
  }

  const autofill = async (hotel) => {
    setBusy(b => ({ ...b, [hotel.id]: true }))
    const poiNames = pois.map(p => p.name)
    const prompt = `Eres analista de inversión hotelera. Dado el nombre de un hotel y su ciudad, completa sus datos con tu mejor conocimiento. Para las distancias, estima los km a pie desde el hotel a cada punto turístico indicado (número, una cifra decimal). Para amenities responde true/false. Si no conoces un dato, estima de forma razonable y conservadora. Responde SOLO JSON sin markdown:
{"address":"","web":"","stars":<0-5>,"keys":<nº habitaciones>,"group":"","brand":"","lastRefurb":<año>,"booking":<0-10>,"tripadvisor":<0-5>,"amenities":{"<nombre exacto>":true/false},"distances":{"<nombre punto>":<km>}}
Hotel: ${hotel.name}
Ciudad: ${city}
Amenities a evaluar: ${amenities.join(', ')}
Puntos turísticos: ${poiNames.join(', ')}`
    try {
      const j = parseJSON(await callAI([{ text: prompt }], 1200))
      setHotels(p => p.map(h => {
        if (h.id !== hotel.id) return h
        const next = { ...h }
        next.address = j.address || h.address; next.web = j.web || h.web
        next.stars = j.stars ?? h.stars; next.keys = j.keys ?? h.keys
        next.group = j.group || h.group; next.brand = j.brand || h.brand
        next.lastRefurb = j.lastRefurb ?? h.lastRefurb; next.booking = j.booking ?? h.booking; next.tripadvisor = j.tripadvisor ?? h.tripadvisor
        next.amenities = { ...h.amenities }; next.distances = { ...h.distances }
        if (j.amenities) amenities.forEach(a => { if (a in j.amenities) next.amenities[a] = !!j.amenities[a] })
        if (j.distances) pois.forEach(pp => { const v = j.distances[pp.name]; if (typeof v === 'number') next.distances[pp.id] = v })
        return next
      }))
    } catch (e) { alert('No se pudo autocompletar (' + e.message + '). Rellena los campos a mano.') }
    finally { setBusy(b => ({ ...b, [hotel.id]: false })) }
  }

  const addHotel = () => {
    const n = hName.trim(); if (!n) return
    const h = newScoreHotel(hotels.length === 0); h.name = n
    setHotels(p => [...p, h]); setHName('')
    autofill(h)
  }

  const exportWord = () => {
    if (!hotels.length) return
    const ranked = [...hotels].sort((a, b) => der[b.id].total - der[a.id].total)
    const rows = ranked.map((h, i) => `<tr>
      <td style="border:1px solid #ccc;padding:5px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #ccc;padding:5px"><b>${esc(h.name)}</b>${h.isSubject ? ' (objeto)' : ''}<br><span style="color:#777;font-size:9pt">${esc(h.address || '')}</span></td>
      <td style="border:1px solid #ccc;padding:5px;text-align:center">${esc(h.stars) || '–'}</td>
      <td style="border:1px solid #ccc;padding:5px;text-align:center">${der[h.id].loc.toFixed(1)}</td>
      <td style="border:1px solid #ccc;padding:5px;text-align:center">${der[h.id].prod.toFixed(1)}</td>
      <td style="border:1px solid #ccc;padding:5px;text-align:center">${der[h.id].rat.toFixed(1)}</td>
      <td style="border:1px solid #ccc;padding:5px;text-align:center;font-weight:bold">${(der[h.id].total * 20).toFixed(0)}</td></tr>`).join('')
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body style="font-family:Calibri,Arial">
      <h1>Score de hoteles — ${esc(city)}</h1>
      <p>${ranked.length} hoteles · Puntos de referencia: ${esc(pois.map(p => p.name).join(', '))}</p>
      <table style="border-collapse:collapse;width:100%;font-size:10pt">
      <tr style="background:#1f5f5b;color:#fff"><th style="border:1px solid #ccc;padding:5px">#</th><th style="border:1px solid #ccc;padding:5px;text-align:left">Hotel</th><th style="border:1px solid #ccc;padding:5px">★</th><th style="border:1px solid #ccc;padding:5px">Ubic.</th><th style="border:1px solid #ccc;padding:5px">Prod.</th><th style="border:1px solid #ccc;padding:5px">Reput.</th><th style="border:1px solid #ccc;padding:5px">Score</th></tr>
      ${rows}
      <tr style="background:#f2f1ee;font-weight:bold"><td style="border:1px solid #ccc;padding:5px"></td><td style="border:1px solid #ccc;padding:5px">Media comp set</td><td style="border:1px solid #ccc;padding:5px"></td><td style="border:1px solid #ccc;padding:5px;text-align:center">${csAvg.loc.toFixed(1)}</td><td style="border:1px solid #ccc;padding:5px;text-align:center">${csAvg.prod.toFixed(1)}</td><td style="border:1px solid #ccc;padding:5px;text-align:center">${csAvg.rat.toFixed(1)}</td><td style="border:1px solid #ccc;padding:5px;text-align:center">${(csAvg.total * 20).toFixed(0)}</td></tr>
      </table></body></html>`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/msword' }))
    a.download = 'score_hoteles_' + city.replace(/[^\w]+/g, '_') + '.doc'; a.click()
  }

  const scoreColor = t => t >= 3.5 ? 'var(--good)' : t >= 2.5 ? 'var(--accent)' : 'var(--warn)'
  const ranked = [...hotels].sort((a, b) => der[b.id].total - der[a.id].total)

  return (
    <div className="wrap">
      <div className="tabs">
        <button className={'tab' + (pane === 'config' ? ' active' : '')} onClick={() => setPane('config')}>Configuración</button>
        <button className={'tab' + (pane === 'set' ? ' active' : '')} disabled={!started} onClick={() => setPane('set')}>Comp set</button>
        <button className={'tab' + (pane === 'res' ? ' active' : '')} disabled={!started} onClick={() => setPane('res')}>Resultados</button>
      </div>

      {/* CONFIG */}
      <div className={'pane' + (pane === 'config' ? ' active' : '')}>
        <div className="card">
          <div className="card-h"><h2>Ciudad de análisis</h2></div>
          <p className="desc">Todo el análisis se referencia a una ciudad. Define los puntos turísticos clave: las distancias a ellos determinan el score de ubicación.</p>
          <label className="fld">Ciudad</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="inp" value={city} onChange={e => setCity(e.target.value)} placeholder="Ej. Madrid, Toledo, Sevilla…" style={{ maxWidth: 340 }} />
            <button className="btn ai sm" onClick={suggestPoi}><Sparkles size={14} /> Sugerir puntos turísticos</button>
          </div>
          {poiLoad && <div className="loading"><div className="spin" /><span>Buscando los principales puntos turísticos…</span></div>}
          <div style={{ marginTop: 20 }}>
            <label className="fld">Puntos turísticos de referencia</label>
            <div>
              {pois.map((p, i) => (
                <div className="poi-row" key={p.id}>
                  <input className="inp" value={p.name} placeholder={`Punto turístico ${i + 1}`} onChange={e => setPois(prev => prev.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))} />
                  <button className="del" onClick={() => setPois(prev => prev.filter(x => x.id !== p.id))}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <button className="btn sm" style={{ marginTop: 10 }} onClick={() => setPois(p => [...p, { id: uid(), name: '' }])}>+ Añadir punto</button>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h2>Amenities a evaluar</h2></div>
          <p className="desc">Las instalaciones que cuentan para el score de producto. En cada hotel marcarás cuáles tiene.</p>
          <div className="am-chips">
            {amenities.map(a => (
              <span className="am-chip" key={a}>{a} <span className="x" onClick={() => setAmenities(prev => prev.filter(x => x !== a))}>×</span></span>
            ))}
          </div>
          <div className="add-row" style={{ marginTop: 12, maxWidth: 420 }}>
            <input className="inp" value={amInput} onChange={e => setAmInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAm()} placeholder="Añadir amenity (ej. Rooftop)" />
            <button className="btn sm" onClick={addAm}>Añadir</button>
          </div>
        </div>

        <button className="btn primary" onClick={start}>Continuar al comp set →</button>
      </div>

      {/* COMP SET */}
      <div className={'pane' + (pane === 'set' ? ' active' : '')}>
        <div className="card">
          <div className="card-h"><h2>Añadir hotel</h2><span className="meta">{hotels.length ? `${hotels.length} hoteles` : ''}</span></div>
          <div className="add-row">
            <input className="inp" value={hName} onChange={e => setHName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHotel()} placeholder="Nombre del hotel (la IA completa el resto)" />
            <button className="btn primary" onClick={addHotel}>Añadir y autocompletar</button>
          </div>
          <p className="desc" style={{ margin: '10px 0 0' }}>Marca un hotel como <b>objeto</b> (el que analizas) y los que formen el <b>comp set relevante</b>. La media se calcula solo con los del comp set.</p>
        </div>

        {!hotels.length
          ? <div className="empty">Escribe el nombre de un hotel arriba para empezar. La IA completará dirección, categoría, amenities y distancias.</div>
          : hotels.map(h => {
            const d = der[h.id]
            const stars = '★'.repeat(Math.round(+h.stars || 0))
            return (
              <div className={'hotel' + (h.isSubject ? ' subject' : '') + (h.open ? ' open' : '')} key={h.id}>
                <div className="hotel-bar" onClick={() => setHotel(h.id, { open: !h.open })}>
                  <span className="h-chev"><ChevronRight size={14} /></span>
                  <div className="h-id">
                    <div className="h-name">{h.name}{stars && <span className="h-stars">{stars}</span>}
                      {h.isSubject && <span className="h-tag subj">Objeto</span>}
                      {h.inCS === 'Yes' && <span className="h-tag cs">Comp set</span>}</div>
                    <div className="h-sub">{h.address || 'Sin datos aún'}{h.keys ? ` · ${h.keys} hab.` : ''}</div>
                  </div>
                  <div className="h-score"><div className="n mono" style={{ color: scoreColor(d.total) }}>{d.total ? (d.total * 20).toFixed(0) : '–'}</div><div className="l">/100</div></div>
                </div>
                {h.open && (
                  <div className="hotel-body" onClick={e => e.stopPropagation()}>
                    {busy[h.id] && <div className="loading"><div className="spin" /><span>Autocompletando con IA…</span></div>}
                    <div className="grp"><div className="grp-t">Datos generales</div>
                      <div className="fgrid">
                        <div><label className="fld">Dirección</label><input className="inp" value={h.address} onChange={e => setHotel(h.id, { address: e.target.value })} /></div>
                        <div><label className="fld">Web</label><input className="inp" value={h.web} onChange={e => setHotel(h.id, { web: e.target.value })} /></div>
                        <div><label className="fld">Estrellas</label><input className="inp" type="number" min="0" max="5" value={h.stars} onChange={e => setHotel(h.id, { stars: e.target.value })} /></div>
                        <div><label className="fld">Habitaciones</label><input className="inp" type="number" value={h.keys} onChange={e => setHotel(h.id, { keys: e.target.value })} /></div>
                        <div><label className="fld">Grupo</label><input className="inp" value={h.group} onChange={e => setHotel(h.id, { group: e.target.value })} /></div>
                        <div><label className="fld">Marca</label><input className="inp" value={h.brand} onChange={e => setHotel(h.id, { brand: e.target.value })} /></div>
                      </div></div>
                    <div className="grp"><div className="grp-t">Ubicación · distancias a pie (km)</div>
                      {pois.map(p => (
                        <div className="dist-row" key={p.id}><span className="pl">{p.name}</span>
                          <input className="inp" type="number" step="0.1" value={h.distances[p.id] ?? ''} onChange={e => setHotel(h.id, { distances: { ...h.distances, [p.id]: e.target.value === '' ? undefined : +e.target.value } })} /></div>
                      ))}
                    </div>
                    <div className="grp"><div className="grp-t">Producto · amenities y estado</div>
                      <div className="am-grid">
                        {amenities.map(a => (
                          <div className={'am-toggle' + (h.amenities[a] ? ' on' : '')} key={a} onClick={() => setHotel(h.id, { amenities: { ...h.amenities, [a]: !h.amenities[a] } })}>
                            <span>{a}</span><span className="sw" /></div>
                        ))}
                      </div>
                      <div style={{ marginTop: 11, maxWidth: 200 }}><label className="fld">Año última reforma</label><input className="inp" type="number" value={h.lastRefurb} onChange={e => setHotel(h.id, { lastRefurb: e.target.value })} /></div>
                    </div>
                    <div className="grp"><div className="grp-t">Reputación</div>
                      <div className="fgrid">
                        <div><label className="fld">Booking (0-10)</label><input className="inp" type="number" step="0.1" min="0" max="10" value={h.booking} onChange={e => setHotel(h.id, { booking: e.target.value })} /></div>
                        <div><label className="fld">Tripadvisor (0-5)</label><input className="inp" type="number" step="0.1" min="0" max="5" value={h.tripadvisor} onChange={e => setHotel(h.id, { tripadvisor: e.target.value })} /></div>
                      </div></div>
                    <div className="hopts">
                      <label className="hopt"><input type="radio" name={'subj-' + h.id} checked={h.isSubject} onChange={() => setHotels(p => p.map(x => ({ ...x, isSubject: x.id === h.id })))} /> Hotel objeto del análisis</label>
                      <label className="hopt"><input type="checkbox" checked={h.inCS === 'Yes'} onChange={e => setHotel(h.id, { inCS: e.target.checked ? 'Yes' : 'No' })} /> Incluir en comp set</label>
                    </div>
                    <div className="row-actions">
                      <button className="btn ai sm" onClick={() => autofill(h)}><Sparkles size={14} /> Reautocompletar</button>
                      <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setHotels(p => p.filter(x => x.id !== h.id))}>Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        {!!hotels.length && <button className="btn primary" onClick={() => setPane('res')}>Ver resultados →</button>}
      </div>

      {/* RESULTADOS */}
      <div className={'pane' + (pane === 'res' ? ' active' : '')}>
        <div className="card">
          <div className="card-h"><h2>Ranking y comparativa</h2><span className="meta">{hotels.length} hoteles · {csCount} en comp set</span></div>
          <div className="res-head"><div /><div className="l">Hotel</div><div>Ubic.</div><div>Prod.</div><div>Reput.</div><div>Total</div></div>
          {!hotels.length ? <div className="empty">Sin hoteles.</div> : ranked.map((h, i) => {
            const d = der[h.id]
            const vs = csAvg.total ? (d.total / csAvg.total - 1) * 100 : 0
            return (
              <div className={'res-row' + (h.isSubject ? ' subj' : '')} key={h.id}>
                <div className={'rp ' + (i < 3 ? 'p' + (i + 1) : '')}>{i + 1}</div>
                <div className="rn">{h.name} {h.inCS === 'Yes' && csAvg.total ? <span className={'vsbar ' + (vs >= 0 ? 'up' : 'down')}>{vs >= 0 ? '+' : ''}{vs.toFixed(0)}%</span> : null}
                  <div className="loc">{h.address || h.group || ''}</div></div>
                <div className="sc">{d.loc ? d.loc.toFixed(1) : '–'}</div>
                <div className="sc">{d.prod ? d.prod.toFixed(1) : '–'}</div>
                <div className="sc">{d.rat ? d.rat.toFixed(1) : '–'}</div>
                <div className="sc tot" style={{ color: scoreColor(d.total) }}>{(d.total * 20).toFixed(0)}<small>{d.total.toFixed(1)}/5</small></div>
              </div>
            )
          })}
          {!!csCount && (
            <div className="res-row avg">
              <div /><div className="rn">Media comp set</div>
              <div className="sc">{csAvg.loc.toFixed(1)}</div><div className="sc">{csAvg.prod.toFixed(1)}</div><div className="sc">{csAvg.rat.toFixed(1)}</div>
              <div className="sc tot">{(csAvg.total * 20).toFixed(0)}<small>{csAvg.total.toFixed(1)}/5</small></div>
            </div>
          )}
          <div style={{ marginTop: 18 }}><button className="btn" onClick={exportWord}><Download size={14} /> Exportar informe</button></div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════ MÓDULO 3 ════════════════════════════════ */
const initialPNL = () => [
  { id: uid(), t: 'kpi', label: 'Ocupación', unit: '%', fmt: 'pct', v: [63.9, 64.6, 63.0] },
  { id: uid(), t: 'kpi', label: 'ADR', unit: '€', fmt: 'eur', v: [80.7, 81.8, 94.3] },
  { id: uid(), t: 'kpi', label: 'RevPAR', unit: '€', fmt: 'eur', v: [51.6, 52.8, 59.4] },
  { id: uid(), t: 'kpi', label: '% Margen GOP', unit: '%', fmt: 'pct', v: [23.9, 28.9, 33.9] },
  { id: uid(), t: 'sect', label: 'Ingresos' },
  { id: uid(), t: 'line', label: 'Habitaciones', unit: '% T Rev', fmt: 'keur', v: [5552, 5701, 6399] },
  { id: uid(), t: 'sub', label: 'F&B Rte. In house', unit: 'POR', fmt: 'keur', v: [0, 0, 2503] },
  { id: uid(), t: 'sub', label: 'F&B Rte. Walk-ins', unit: 'PAR', fmt: 'keur', v: [0, 0, 589] },
  { id: uid(), t: 'sub', label: 'F&B Eventos', unit: 'PAR', fmt: 'keur', v: [0, 0, 2621] },
  { id: uid(), t: 'line', label: 'F&B', unit: 'POR', fmt: 'keur', v: [6250, 5219, 5713] },
  { id: uid(), t: 'line', label: 'Eventos', unit: 'PAR', fmt: 'keur', v: [451, 277, 418] },
  { id: uid(), t: 'line', label: 'Spa', unit: 'POR', fmt: 'keur', v: [549, 555, 595] },
  { id: uid(), t: 'line', label: 'Otros', unit: 'PAR', fmt: 'keur', v: [240, 513, 813] },
  { id: uid(), t: 'total', label: 'Total Ingresos', unit: 'POR', fmt: 'keur', v: [13043, 12265, 13937] },
  { id: uid(), t: 'sect', label: 'Costes Operativos' },
  { id: uid(), t: 'line', label: 'Costes Habitaciones', unit: 'POR', fmt: 'keur', v: [1825, 1742, 1693] },
  { id: uid(), t: 'line', label: 'Costes F&B', unit: '% F&B Rev', fmt: 'keur', v: [4918, 3978, 4240] },
  { id: uid(), t: 'line', label: 'Costes Eventos', unit: '% Ev Rev', fmt: 'keur', v: [343, 448, 660] },
  { id: uid(), t: 'line', label: 'Costes Spa', unit: '% Spa Rev', fmt: 'keur', v: [327, 314, 330] },
  { id: uid(), t: 'total', label: 'Total Costes Operativos', unit: '% T Rev', fmt: 'keur', v: [7412, 6483, 6923] },
  { id: uid(), t: 'sect', label: 'Márgenes departamentales' },
  { id: uid(), t: 'line', label: 'Margen Habitaciones', unit: '% RRev', fmt: 'keur', v: [3727, 3959, 4706] },
  { id: uid(), t: 'line', label: 'Margen F&B + Eventos', unit: '% Rev', fmt: 'keur', v: [1441, 1069, 1231] },
  { id: uid(), t: 'line', label: 'Margen Spa', unit: '% Spa Rev', fmt: 'keur', v: [223, 241, 264] },
  { id: uid(), t: 'line', label: 'Margen Otros', unit: '% Rev', fmt: 'keur', v: [240, 513, 813] },
  { id: uid(), t: 'total', label: 'GOI', unit: '% T Rev', fmt: 'keur', v: [5631, 5782, 7014] },
  { id: uid(), t: 'sect', label: 'Gastos no distribuidos' },
  { id: uid(), t: 'line', label: 'Administración y Generales', unit: 'PAR', fmt: 'keur', v: [490, 575, 535] },
  { id: uid(), t: 'line', label: 'Ventas y Marketing', unit: 'PAR', fmt: 'keur', v: [326, 266, 314] },
  { id: uid(), t: 'line', label: 'Reparaciones y Mantenim.', unit: 'PAR', fmt: 'keur', v: [701, 672, 683] },
  { id: uid(), t: 'line', label: 'Suministros', unit: 'POR', fmt: 'keur', v: [990, 729, 760] },
  { id: uid(), t: 'total', label: 'Total gastos no distribuidos', unit: 'PAR', fmt: 'keur', v: [2507, 2242, 2291] },
  { id: uid(), t: 'total', label: 'Total Costes', unit: 'PAR', fmt: 'keur', v: [9919, 8725, 9214] },
  { id: uid(), t: 'total', label: 'GOP', unit: '% T Rev', fmt: 'keur', v: [3123, 3540, 4723] },
  { id: uid(), t: 'kpi', label: 'GOP / habitación', unit: 'Por Hab.', fmt: 'hab', v: [10.6, 12.0, 16.0] },
]
const fmtVal = (val, f) => {
  if (val == null || isNaN(val)) return '–'
  if (f === 'pct') return val.toFixed(1) + '%'
  if (f === 'eur') return val.toFixed(1) + '€'
  if (f === 'hab') return val.toFixed(1)
  return Math.round(val).toLocaleString('es-ES')
}
const cagr = v => (!v || v[0] === 0 || v[0] == null) ? null : Math.pow(v[2] / v[0], 1 / 2) - 1
const yoy = v => (!v || v[1] === 0 || v[1] == null) ? null : v[2] / v[1] - 1
const pctTxt = x => x == null ? 'n.a.' : (x >= 0 ? '+' : '') + (x * 100).toFixed(1) + '%'

function ModSlides() {
  const [pnl, setPnl] = useState(initialPNL)
  const [projName, setProjName] = useState('')
  const [showMs, setShowMs] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [activeSec, setActiveSec] = useState('sec-exec')
  const bodyRef = useRef(null)

  const setCell = (id, i, val) => setPnl(p => p.map(r => r.id === id ? { ...r, v: r.v.map((x, j) => j === i ? (parseFloat(val) || 0) : x) } : r))
  const setLabel = (id, label) => setPnl(p => p.map(r => r.id === id ? { ...r, label } : r))
  const addLine = () => { const name = prompt('Nombre de la línea:'); if (name) setPnl(p => [...p, { id: uid(), t: 'line', label: name, unit: '', fmt: 'keur', v: [0, 0, 0] }]) }
  const findRow = lbl => pnl.find(r => r.label === lbl)

  const generate = async () => {
    setErr(''); setLoading(true)
    const lines = pnl.filter(r => r.t !== 'sect').map(r => `${r.label}: 2023=${r.v[0]} 2024=${r.v[1]} 2025=${r.v[2]} (CAGR ${pctTxt(cagr(r.v))}, YoY ${pctTxt(yoy(r.v))})`).join('\n')
    const prompt = `Eres asset manager hotelero senior en PDB. Analizas una cuenta de explotación (P&L) y produces contenido para una presentación a inversores/propietarios. Tono ejecutivo, formal, claro y muy conciso. Terminología de hotelería y asset management. Básate EXCLUSIVAMENTE en los datos dados.
Devuelve SOLO JSON sin markdown:
{"headline":"titular insight-driven, 1-2 frases cortas, mensaje accionable para propietarios e inversores","histHeadline":"1 frase que sintetice la evolución histórica de ingresos/márgenes","comments":{"Habitaciones":"","F&B":"","Eventos":"","Spa":"","Otros":""}}
Cada comentario: máximo 20-25 palabras, explica los drivers principales (crecimiento/descenso/estabilidad) de esa línea de ingresos.
Cuenta de explotación (k€ salvo indicado):\n${lines}`
    try { setAnalysis(parseJSON(await callAI([{ text: prompt }], 1500))) }
    catch (e) { setErr('No se pudo generar el análisis (' + e.message + '). Los KPIs y la P&L sí se muestran.') }
    finally { setLoading(false) }
  }

  const goMicrosite = () => { setShowMs(true); generate() }
  const scrollTo = sec => {
    setActiveSec(sec)
    bodyRef.current?.querySelector('#' + sec)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const kpiWant = [['Ocupación', 'Ocupación'], ['ADR', 'ADR'], ['RevPAR', 'RevPAR'], ['GOP', 'GOP'], ['% Margen GOP', 'Margen GOP'], ['Total Ingresos', 'Ingresos totales']]
  const cmtOrder = ['Habitaciones', 'F&B', 'Eventos', 'Spa', 'Otros']

  return (
    <div className="s3wrap">
      <div className="s3head" style={{ display: showMs ? 'none' : 'block' }}>
        <div className="s3brand"><span className="s3eyebrow">Hoteles</span><span className="s3chip">Módulo 3</span></div>
        <div className="s3title">Presentación</div>
        <p className="s3sub">Edita la cuenta de explotación (P&amp;L) y genera una microsite ejecutiva con titular insight-driven, KPIs y comentarios por línea.</p>
      </div>
      <div className="s3main">
        {/* EDITOR */}
        <div className={'s3view' + (showMs ? '' : ' on')}>
          <div className="pnl-tools">
            <input className="s3btn" value={projName} onChange={e => setProjName(e.target.value)} placeholder="Nombre del proyecto / hotel" style={{ fontWeight: 560, minWidth: 240 }} />
            <span className="grow" />
            <button className="s3btn sm" onClick={addLine}>+ Añadir línea</button>
            <button className="s3btn primary" onClick={goMicrosite}>Generar microsite →</button>
          </div>
          <div className="pnl-card"><table className="pnl"><thead><tr>
            <th className="l">k€</th><th className="l">KPI</th><th>2023A</th><th>2024A</th><th>2025A</th><th>CAGR</th><th>YoY 25-24</th><th />
          </tr></thead><tbody>
            {pnl.map(r => {
              if (r.t === 'sect') return <tr className="sect" key={r.id}><td className="l" colSpan={8}>{r.label}</td></tr>
              const c = cagr(r.v), y = yoy(r.v)
              return (
                <tr className={r.t} key={r.id}>
                  <td className="l"><input className="lbl" value={r.label} onChange={e => setLabel(r.id, e.target.value)} /></td>
                  <td className="l"><span className="unit">{r.unit || ''}</span></td>
                  {[0, 1, 2].map(i => <td key={i}><input value={r.v[i]} onChange={e => setCell(r.id, i, e.target.value)} /></td>)}
                  <td className={'delta ' + (c >= 0 ? 'up' : 'down')}>{pctTxt(c)}</td>
                  <td className={'delta ' + (y >= 0 ? 'up' : 'down')}>{pctTxt(y)}</td>
                  <td><button className="rowdel" title="Eliminar" onClick={() => setPnl(p => p.filter(x => x.id !== r.id))}>×</button></td>
                </tr>
              )
            })}
          </tbody></table></div>
        </div>

        {/* MICROSITE */}
        <div className={'s3view' + (showMs ? ' on' : '')}>
          <div className="ms">
            <nav className="ms-index">
              <div className="lg">Hoteles <span className="sav">·</span></div>
              <div className="pj">{projName.trim() || 'Proyecto hotelero'}</div>
              <a className={activeSec === 'sec-exec' ? 'active' : ''} onClick={() => scrollTo('sec-exec')}><span className="num">1</span>Resumen Ejecutivo</a>
              <a className={activeSec === 'sec-hist' ? 'active' : ''} onClick={() => scrollTo('sec-hist')}><span className="num">2</span>Revisión · Datos Históricos</a>
            </nav>
            <div className="ms-body" ref={bodyRef}>
              <div className="ms-toolbar">
                <button className="s3btn sm" onClick={() => setShowMs(false)}>← Volver al editor</button>
                <button className="s3btn sm" onClick={generate}><Sparkles size={14} /> Regenerar análisis</button>
                <button className="s3btn sm" onClick={() => window.print()}><Download size={14} /> Imprimir / PDF</button>
              </div>
              {loading && <div className="s3load"><div className="s3spin" /><span>Generando análisis ejecutivo…</span></div>}
              {err && <div className="s3err">{err}</div>}

              <section className="slide-sec" id="sec-exec">
                <span className="savmark">PDB</span>
                <div className="sec-title"><span className="hl">1. Resumen Ejecutivo</span></div>
                <p className="headline">{analysis?.headline || 'El titular ejecutivo aparecerá aquí tras generar el análisis.'}</p>
                <div className="kpis">
                  {kpiWant.map(([lbl, disp]) => {
                    const r = findRow(lbl); if (!r) return null
                    const y = yoy(r.v); const up = y >= 0
                    return (
                      <div className="kpi" key={lbl}>
                        <div className="k-l">{disp}</div>
                        <div className="k-v mono">{fmtVal(r.v[2], (r.fmt === 'pct' || lbl === '% Margen GOP') ? 'pct' : r.fmt)}</div>
                        <div><span className={'k-d ' + (up ? 'up' : 'down')}>{up ? '▲' : '▼'} {pctTxt(y).replace('+', '')}</span><span className="k-yo">YoY 25-24</span></div>
                      </div>
                    )
                  })}
                </div>
                <div className="ctx-grid">
                  <div className="ctx-card"><h4>Contexto del proyecto</h4><ul><li>Cuenta de explotación 2023A–2025A</li><li>Análisis de desempeño y márgenes</li></ul></div>
                  <div className="ctx-card"><h4>Revisión datos históricos</h4><ul><li>Evolución de ingresos por departamento</li><li>Estructura de costes y GOP</li></ul></div>
                </div>
              </section>

              <section className="slide-sec" id="sec-hist">
                <span className="savmark">PDB</span>
                <div className="sec-title"><span className="hl">2. Revisión</span> · Datos Históricos</div>
                <p className="headline" style={{ borderLeftColor: 'var(--accent)' }}>{analysis?.histHeadline || 'Comentarios por línea de ingresos.'}</p>
                <div className="ms-pnl-wrap"><table className="msp"><thead><tr>
                  <th className="l">k€</th><th>2023A</th><th>2024A</th><th>2025A</th><th>CAGR</th><th>YoY</th>
                </tr></thead><tbody>
                  {pnl.filter(r => r.t !== 'kpi').map(r => {
                    if (r.t === 'sect') return <tr className="sect" key={r.id}><td className="l" colSpan={6}>{r.label}</td></tr>
                    const c = cagr(r.v), y = yoy(r.v)
                    return (
                      <tr className={r.t} key={r.id}>
                        <td className="l">{r.label}</td>
                        <td className="mono">{fmtVal(r.v[0], r.fmt)}</td><td className="mono">{fmtVal(r.v[1], r.fmt)}</td><td className="mono">{fmtVal(r.v[2], r.fmt)}</td>
                        <td className={'mono delta ' + (c >= 0 ? 'up' : 'down')}>{pctTxt(c)}</td>
                        <td className={'mono delta ' + (y >= 0 ? 'up' : 'down')}>{pctTxt(y)}</td>
                      </tr>
                    )
                  })}
                </tbody></table></div>
                <h4 style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 700, margin: '26px 0 4px' }}>Comentarios · Ingresos</h4>
                <div className="comments">
                  {cmtOrder.map((k, i) => analysis?.comments?.[k]
                    ? <div className="cmt" key={k}><div className="cn">{i + 1}</div><div className="cc"><h5>{k}</h5><p>{analysis.comments[k]}</p></div></div>
                    : null)}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════ HOME ════════════════════════════════════ */
const FEATS = {
  contracts: ['Carga de contratos en PDF, Word o TXT', 'Análisis cláusula a cláusula según plantilla por equipo', 'Detección de puntos a revisar y no localizados', 'Exportación a Word y modo presentación'],
  score: ['Competitive set por ciudad con puntos turísticos', 'Autocompletado por IA desde el nombre del hotel', 'Score ponderado: ubicación, producto y reputación', 'Ranking comparativo vs media del comp set'],
  slides: ['Microsite ejecutiva a partir del P&L', 'Titular insight-driven y comentarios por línea', 'Exportación a PDF / impresión'],
}
function HomePane({ go }) {
  return (
    <div className="home">
      <h1>Hoteles</h1>
      <p className="lead">Suite de análisis hotelero. Tres módulos que comparten datos: revisión de contratos, evaluación de activos y generación de presentaciones.</p>
      <div className="mods">
        <div className="mod-card" onClick={() => go('contracts')}>
          <div className="mc-top"><div className="mc-ic a"><FileText size={20} /></div><div className="mc-t"><div className="h">Revisión de contratos</div><div className="s">Análisis automático de documentos contractuales</div></div><span className="mc-tag a">Módulo 1</span></div>
          <div className="mc-feats">{FEATS.contracts.map(f => <div key={f}><span className="fi">›</span> {f}</div>)}</div>
        </div>
        <div className="mod-card" onClick={() => go('score')}>
          <div className="mc-top"><div className="mc-ic b"><Star size={20} /></div><div className="mc-t"><div className="h">Score de hoteles</div><div className="s">Evaluación y puntuación de propiedades</div></div><span className="mc-tag b">Módulo 2</span></div>
          <div className="mc-feats">{FEATS.score.map(f => <div key={f}><span className="fi">›</span> {f}</div>)}</div>
        </div>
        <div className="mod-card" onClick={() => go('slides')}>
          <div className="mc-top"><div className="mc-ic c"><LayoutGrid size={20} /></div><div className="mc-t"><div className="h">Presentación</div><div className="s">Generación de microsites ejecutivas</div></div><span className="mc-tag c">Módulo 3</span></div>
          <div className="mc-feats">{FEATS.slides.map(f => <div key={f}><span className="fi">›</span> {f}</div>)}</div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════ SHELL ═══════════════════════════════════ */
const NAV = [
  { v: 'home', label: 'Inicio', icon: Home },
  { v: 'contracts', label: 'Revisión de contratos', icon: FileText },
  { v: 'score', label: 'Score de hoteles', icon: Star },
  { v: 'slides', label: 'Presentación', icon: LayoutGrid },
]
function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) }

export default function HotelesView() {
  const [view, setView] = useState('home')
  const go = v => { setView(v); try { document.querySelector('.hot-skin .content')?.scrollTo(0, 0) } catch { /* noop */ } }

  return (
    <div className="hot-skin">
      <aside className="side">
        <div className="logo"><div className="mark">H</div><div className="nm">Hoteles</div></div>
        <nav className="nav">
          {NAV.map(n => {
            const Ico = n.icon
            return (
              <a key={n.v} className={view === n.v ? 'active' : ''} onClick={() => go(n.v)}>
                <span className="nicon"><Ico size={16} /></span> {n.label}
                {n.v === 'slides' && <span className="soon">Beta</span>}
              </a>
            )
          })}
        </nav>
      </aside>
      <div className="content">
        <section className={'view' + (view === 'home' ? ' active' : '')}><HomePane go={go} /></section>
        <section className={'view' + (view === 'contracts' ? ' active' : '')}>
          <div className="mhead"><div className="eyebrow">Hoteles · Módulo 1</div></div>
          <ModContratos />
        </section>
        <section className={'view' + (view === 'score' ? ' active' : '')}>
          <div className="mhead"><div className="eyebrow">Hoteles · Módulo 2</div></div>
          <ModScore />
        </section>
        <section className={'view' + (view === 'slides' ? ' active' : '')}><ModSlides /></section>
      </div>
    </div>
  )
}
