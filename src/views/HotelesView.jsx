import { useState, useRef } from 'react'
import '../styles/hoteles.css'
import {
  FileText, Star, LayoutGrid, UploadCloud, ChevronRight, Download, Printer,
  Trash2, Sparkles, RotateCcw, Wifi, MapPin, ArrowUp, MessageSquare, Building2, Check,
  ArrowRight, FileCheck,
} from 'lucide-react'

/* ============================================================================
 * Hoteles · suite de análisis hotelero — nativo PDB (.hot-skin)
 *   1. Revisión de contratos (plantilla HLA → microsite + export Word)
 *   2. Score de hoteles (comp set / gravity, autocompletado IA, ranking)
 *   3. Presentación (P&L editable + microsite ejecutiva)
 * TODA la IA pasa por el proxy serverless /api/gemini (Google Gemini).
 * Layout: barra superior con 3 botones (módulos). Impresión = solo contenido.
 * ========================================================================== */

const AI_MODEL = 'gemini-2.5-flash'
// Clave de Google Maps/Places del proyecto del usuario (la misma que usa FichaActivo).
// La env VITE_GOOGLE_MAPS_API_KEY de Vercel apunta a otra clave sin Places, por eso
// aquí usamos directamente la clave correcta (con Places API New habilitada).
const GMAPS_KEY_PLACES = 'AIzaSyArChBWnXkvyrdP-6uxTCDwFMjluO_QiSo'

async function callAI(parts, maxTokens) {
  const res = await fetch('/api/gemini', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: maxTokens, temperature: 0.4, responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
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
function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) }
// Imprime SOLO el informe: abre una ventana con el contenido clonado + los
// estilos de la app, para que pagine y maquete bien (sin sacar toda la PDB).
function printNode(node) {
  if (!node) return
  const w = window.open('', 'hot_print', 'width=940,height=1000')
  if (!w) { window.print(); return }
  const styles = [...document.querySelectorAll('link[rel="stylesheet"],style')].map(n => n.outerHTML).join('\n')
  w.document.open()
  w.document.write(`<!doctype html><html><head><meta charset="utf-8">${styles}<style>html,body{margin:0;padding:0;background:#fff}.hot-skin.print-host{display:block!important;overflow:visible!important;height:auto!important;min-height:0!important}</style></head><body><div class="hot-skin print-host">${node.outerHTML}</div></body></html>`)
  w.document.close()
  const go = () => { try { w.focus(); w.print() } catch { /* noop */ } }
  w.onload = go
  setTimeout(go, 900)
}
const dlWord = (html, name) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + html, ''].join(''), { type: 'application/msword' }))
  a.download = name; a.click()
}

// ── Google Places (API New, REST desde el navegador) → foto real del hotel ──
// Devuelve { url, err } para poder mostrar el motivo en pantalla si falla.
async function fetchHotelPhoto(query) {
  const KEY = GMAPS_KEY_PLACES
  if (!KEY) return { url: null, err: 'Falta la clave de Maps' }
  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'places.photos,places.displayName' },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) return { url: null, err: 'Places (New): ' + (d?.error?.message || ('HTTP ' + r.status)) }
    const name = d?.places?.[0]?.photos?.[0]?.name
    if (!name) return { url: null, err: 'Google no tiene foto de este hotel' }
    return { url: `https://places.googleapis.com/v1/${name}/media?maxWidthPx=800&key=${encodeURIComponent(KEY)}`, err: null }
  } catch (e) { return { url: null, err: 'Red/CORS: ' + (e?.message || e) } }
}
// Comprueba que una imagen carga de verdad (detecta 403 del SKU de fotos, etc.)
const preloadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false); im.src = src })
// Respaldo: foto de la web oficial del hotel (og:image) vía nuestro serverless
async function fetchOgImage(web) {
  if (!web) return { url: null, err: 'sin web' }
  try {
    const r = await fetch('/api/oimg?url=' + encodeURIComponent(web))
    const d = await r.json().catch(() => ({}))
    if (d.image) return { url: d.image, err: null }
    return { url: null, err: d.error ? 'web: ' + d.error : 'web sin og:image' }
  } catch (e) { return { url: null, err: 'web: ' + (e?.message || e) } }
}

// Volver arriba (scrollea el contenedor interno del módulo)
function BackToTop() {
  const up = () => document.querySelector('.hot-skin .hot-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
  return <div className="backtop hot-no-print"><button className="btn" onClick={up}><ArrowUp size={15} /> Volver arriba</button></div>
}

// Card de cláusula (a nivel de módulo: el input de comentario no pierde el foco)
function ClauseCard({ it, clickable, onOpen, comment, onComment, reviewed, onReview }) {
  const st = it.status === 'missing' ? 'miss' : it.status === 'attention' ? 'attn' : 'found'
  const ref = it.clause || ''
  const pg = (it.pageNum !== '' && it.pageNum != null) ? it.pageNum : ''
  return (
    <div id={'cl-' + it._idx} className={'clause ' + st + (clickable ? ' clickable' : '') + (reviewed ? ' reviewed' : '')} onClick={clickable ? () => onOpen(it) : undefined}>
      <div className="dot" />
      <div className="c-main">
        <div className="c-cat">{it._cat}{it._sub && it._sub !== '-' && <span className="c-sub">{it._sub}</span>}</div>
        <div className="c-sum">{it.summary || '—'}</div>
        {(ref || pg !== '' || clickable) && (
          <div className="c-ref">
            {ref && <span className="c-ref-i"><MapPin size={13} /> {ref}</span>}
            {pg !== '' && <span className="c-ref-i">Página {pg}</span>}
            {clickable && <span className="c-open">Ver en el contrato →</span>}
          </div>
        )}
        <div className="c-cmt" onClick={e => e.stopPropagation()}>
          <MessageSquare size={14} />
          <input className="c-cmt-inp" value={comment || ''} placeholder="Añade un comentario / punto a completar…"
            onChange={e => onComment(it._idx, e.target.value)} />
        </div>
      </div>
      <div className="c-side">
        {st === 'miss' && <span className="tag miss">No localizado</span>}
        {st === 'attn' && <span className="tag attn">Revisar</span>}
        {st === 'found' && <span className="tag ok">OK</span>}
        {(comment || '').trim() && <span className="tag blue">Comentario</span>}
        <button className={'c-ok' + (reviewed ? ' on' : '')} onClick={e => { e.stopPropagation(); onReview(it._idx) }}>
          <Check size={14} /> {reviewed ? 'Revisado' : 'Marcar OK'}
        </button>
      </div>
    </div>
  )
}

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
  const [doc, setDoc] = useState(null)
  const [over, setOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [comments, setComments] = useState({})
  const [reviewed, setReviewed] = useState({})
  const [sec, setSec] = useState('resumen')
  const impRef = useRef(null), docRef = useRef(null), msRef = useRef(null)
  const onComment = (idx, val) => setComments(c => ({ ...c, [idx]: val }))
  const onReview = idx => setReviewed(r => ({ ...r, [idx]: !r[idx] }))
  const ready = criteria.length > 0 && !!doc

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

  const handleDoc = async (f) => {
    if (!f) return
    setErr('')
    const ext = f.name.split('.').pop().toLowerCase()
    if (ext === 'pdf') {
      const rd = new FileReader()
      const url = URL.createObjectURL(f)
      rd.onload = e => setDoc({ name: f.name, kind: 'pdf', data: e.target.result.split(',')[1], url })
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

  const analyze = async () => {
    setErr(''); setLoading(true)
    const critList = criteria.map((c, i) => `${i + 1}. [${c[0]}${c[1] && c[1] !== '-' ? ' / ' + c[1] : ''}] ${c[2]}`).join('\n')
    const sys = `Eres analista contractual senior de una consultora inmobiliaria. Analizas el contrato adjunto frente a una lista de criterios. Para CADA criterio devuelve un objeto con: "summary" (resumen claro y completo en español de lo que dice el contrato sobre ese punto, 2-4 frases, con los datos concretos: importes, plazos, %), "clause" (referencia textual a la cláusula/apartado del contrato donde aparece, ej. "Cláusula Décima — 10.1 Duración", o "" si no se localiza), "pageNum" (número de página del documento donde aparece esa cláusula, ENTERO; si hay varias usa la primera; "" si no se puede determinar), "status" ("found" si está bien recogido, "attention" si existe pero tiene algún matiz/riesgo a revisar, "missing" si no aparece en el contrato), "highlight" (true si es un punto clave que destacar). Responde SOLO con JSON válido, sin markdown: {"meta":{"title":"breve título del contrato","parties":"partes principales","date":"fecha de firma si consta"},"items":[{...}]} con un item por criterio, EN EL MISMO ORDEN.`
    const userText = `CRITERIOS A ANALIZAR:\n${critList}\n\nAnaliza el contrato adjunto según estos criterios y devuelve el JSON.`
    const parts = doc.kind === 'pdf'
      ? [{ inlineData: { mimeType: 'application/pdf', data: doc.data } }, { text: sys + '\n\n' + userText }]
      : [{ text: sys + '\n\nCONTRATO:\n' + doc.data + '\n\n' + userText }]
    try {
      const j = parseJSON(await callAI(parts, 16000))
      const items = (j.items || []).map((it, i) => ({
        ...it, _idx: i, _cat: criteria[i]?.[0] || '', _sub: criteria[i]?.[1] || '',
        clause: it.clause || it.page || '', pageNum: (it.pageNum ?? it.page_num ?? '') === null ? '' : (it.pageNum ?? it.page_num ?? ''),
      }))
      setComments({}); setReviewed({}); setAnalysis({ meta: j.meta || {}, items }); setSec('resumen')
    } catch (e) { setErr('No se pudo completar el análisis: ' + e.message + '. Revisa el contrato e inténtalo de nuevo.') }
    finally { setLoading(false) }
  }

  const exportWord = () => {
    if (!analysis) return
    const rows = analysis.items.map(it => {
      const status = it.status === 'missing' ? 'NO LOCALIZADO' : it.status === 'attention' ? 'REVISAR' : 'OK'
      const refTxt = [it.clause, it.pageNum !== '' && it.pageNum != null ? 'p. ' + it.pageNum : ''].filter(Boolean).join(' · ')
      return `<tr><td style="border:1px solid #ccc;padding:6px"><b>${esc(it._cat)}</b>${it._sub && it._sub !== '-' ? ' / ' + esc(it._sub) : ''}</td>
        <td style="border:1px solid #ccc;padding:6px">${esc(it.summary || '—')}</td>
        <td style="border:1px solid #ccc;padding:6px">${esc(refTxt || '—')}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${status}</td></tr>`
    }).join('')
    const m = analysis.meta || {}
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body style="font-family:Calibri,Arial">
      <h1>${esc(m.title || 'Análisis del contrato')}</h1>
      <p>${esc(m.parties || '')} ${m.date ? (' · Firma: ' + esc(m.date)) : ''}<br>Plantilla: ${esc(lobName)}</p>
      <table style="border-collapse:collapse;width:100%;font-size:11pt">
      <tr style="background:#1f5f5b;color:#fff"><th style="border:1px solid #ccc;padding:6px;text-align:left">Cláusula</th><th style="border:1px solid #ccc;padding:6px;text-align:left">Resumen</th><th style="border:1px solid #ccc;padding:6px;text-align:left">Referencia</th><th style="border:1px solid #ccc;padding:6px">Estado</th></tr>
      ${rows}</table></body></html>`
    dlWord(html, (m.title || 'analisis_contrato').replace(/[^\w]+/g, '_') + '.doc')
  }

  // Devuelve la hoja "Template" del modelo HLA cumplimentada según el contrato:
  // mismas columnas que downloadBlank, con Contract summary y Page in Contract rellenadas por la IA.
  const exportFilledTemplate = async () => {
    if (!analysis) return
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const m = analysis.meta || {}
    const statusTxt = s => s === 'missing' ? 'No localizado' : s === 'attention' ? 'A revisar' : 'OK'
    const head = ['Category', 'Subcategory', 'Description', 'Contract summary', 'Page in Contract', 'Status']
    const body = criteria.map((c, i) => {
      const it = analysis.items[i] || {}
      const page = it.pageNum !== '' && it.pageNum != null ? it.pageNum : ''
      const ref = [it.clause, page !== '' ? 'p. ' + page : ''].filter(Boolean).join(' · ')
      return [c[0], c[1] || '-', c[2] || '', it.summary || '', ref, statusTxt(it.status)]
    })
    const ws = XLSX.utils.aoa_to_sheet([head, ...body])
    ws['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 60 }, { wch: 70 }, { wch: 28 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, ((m.title || 'plantilla_cumplimentada').replace(/[^\w]+/g, '_')) + '_HLA.xlsx')
  }

  const goSec = s => { setSec(s); msRef.current?.querySelector('#hc-' + s)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  if (loading) return <div className="wrap"><div className="cloading"><div className="cspin" /><div>Analizando contrato…</div></div></div>

  if (analysis) {
    const items = analysis.items
    const attn = items.filter(i => i.status === 'attention')
    const miss = items.filter(i => i.status === 'missing')
    const review = [...miss, ...attn]
    const groups = items.reduce((g, it) => { (g[it._cat] = g[it._cat] || []).push(it); return g }, {})
    const m = analysis.meta
    const canOpen = doc?.kind === 'pdf' && !!doc.url
    const openClause = (it) => {
      if (!canOpen) return
      const pg = parseInt(it.pageNum)
      window.open(doc.url + (pg ? '#page=' + pg : ''), '_blank', 'noopener')
    }
    const pending = items.filter(it => (comments[it._idx] || '').trim())
    const cardOf = it => <ClauseCard key={it._idx} it={it} clickable={canOpen && it.status !== 'missing'} onOpen={openClause} comment={comments[it._idx]} onComment={onComment} reviewed={!!reviewed[it._idx]} onReview={onReview} />
    const goToClause = idx => {
      setSec('clausulas')
      setTimeout(() => {
        const el = msRef.current?.querySelector('#cl-' + idx)
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600) }
      }, 60)
    }
    return (
      <div className="wrap">
        <div className="ms-toolbar hot-no-print">
          <button className="btn" onClick={() => setAnalysis(null)}><RotateCcw size={15} /> Nuevo análisis</button>
          <button className="btn" onClick={() => printNode(msRef.current)}><Printer size={15} /> Imprimir / PDF</button>
          <button className="btn" onClick={exportWord}><Download size={15} /> Exportar a Word</button>
          <button className="btn" onClick={exportFilledTemplate}><Download size={15} /> Plantilla cumplimentada</button>
        </div>
        <div className="ms-doc" ref={msRef}>
          <div className="ms-band">
            <div className="ms-brand">PDB</div>
            <div className="ms-eyebrow">Revisión de contratos</div>
            <div className="ms-title">{m.title || 'Análisis del contrato'}</div>
            <div className="ms-meta">{[m.parties, m.date ? 'Firma: ' + m.date : '', lobName].filter(Boolean).join('  ·  ')}</div>
          </div>
          <div className="ms-nav hot-no-print">
            <a className={sec === 'resumen' ? 'active' : ''} onClick={() => goSec('resumen')}><span className="num">1</span>Resumen</a>
            <a className={sec === 'completar' ? 'active' : ''} onClick={() => goSec('completar')}><span className="num">2</span>Por completar ({pending.length})</a>
            <a className={sec === 'revisar' ? 'active' : ''} onClick={() => goSec('revisar')}><span className="num">3</span>A revisar ({review.length})</a>
            <a className={sec === 'clausulas' ? 'active' : ''} onClick={() => goSec('clausulas')}><span className="num">4</span>Cláusulas ({items.length})</a>
          </div>

          <section className="ms-sec" id="hc-resumen">
            <div className="ms-h"><span className="hl">Resumen ejecutivo</span></div>
            <p className="headline">{miss.length || attn.length
              ? `${miss.length} cláusula${miss.length === 1 ? '' : 's'} no localizada${miss.length === 1 ? '' : 's'} y ${attn.length} requieren revisión, de un total de ${items.length} criterios analizados.`
              : `Las ${items.length} cláusulas de la plantilla están correctamente recogidas en el contrato.`}</p>
            <div className="mk-grid">
              <div className="mk"><div className="k-l">Cláusulas</div><div className="k-v mono">{items.length}</div></div>
              <div className="mk"><div className="k-l">Correctas</div><div className="k-v mono" style={{ color: 'var(--good)' }}>{items.length - attn.length - miss.length}</div></div>
              <div className="mk"><div className="k-l">A revisar</div><div className="k-v mono" style={{ color: 'var(--warn)' }}>{attn.length}</div></div>
              <div className="mk"><div className="k-l">No localizadas</div><div className="k-v mono" style={{ color: 'var(--miss)' }}>{miss.length}</div></div>
            </div>
          </section>

          <section className="ms-sec" id="hc-completar">
            <div className="ms-h"><span className="hl">Puntos por completar</span></div>
            <p className="headline" style={{ borderLeftColor: 'var(--blue)' }}>Escribe un comentario en cualquier card (campo inferior) y aparecerá aquí como punto a completar para tu revisión.</p>
            {pending.length
              ? pending.map(it => (
                <div className="complete-card" key={it._idx} onClick={() => goToClause(it._idx)} title="Ir a la cláusula">
                  <div className="cc-h">{it._cat}{it._sub && it._sub !== '-' ? <span className="c-sub" style={{ display: 'inline', marginLeft: 8 }}>· {it._sub}</span> : null}<span className="cc-go">Ir a la cláusula →</span></div>
                  <div className="cc-cmt">{comments[it._idx]}</div>
                  {(it.clause || it.pageNum) && <div className="cc-ref">{[it.clause, it.pageNum ? 'Página ' + it.pageNum : ''].filter(Boolean).join('  ·  ')}</div>}
                </div>
              ))
              : <p className="headline" style={{ borderLeftColor: 'var(--good)' }}>Aún no has añadido comentarios.</p>}
          </section>

          <section className="ms-sec" id="hc-revisar">
            <div className="ms-h"><span className="hl">Puntos a revisar</span></div>
            {review.length ? review.map(cardOf)
              : <p className="headline" style={{ borderLeftColor: 'var(--good)' }}>No hay cláusulas pendientes de revisión.</p>}
          </section>

          <section className="ms-sec" id="hc-clausulas">
            <div className="ms-h"><span className="hl">Análisis cláusula a cláusula</span></div>
            {Object.keys(groups).map(cat => (
              <div key={cat}>
                <div className="group-h">{cat}</div>
                {groups[cat].map(cardOf)}
              </div>
            ))}
          </section>
        </div>
        <BackToTop />
      </div>
    )
  }

  const plantillaTag = /HLA/i.test(lobName) ? 'HLA' : 'Personalizada'
  return (
    <div className="wrap">
      <header className="c-hero">
        <div className="c-hero-txt">
          <div className="eyebrow">Módulo 01 · Análisis contractual</div>
          <h1>Revisión de contratos</h1>
          <p className="lead">Analiza un contrato de arrendamiento hotelero (PDF, Word o TXT) frente a la plantilla por equipo. La IA localiza cada cláusula, indica la página y marca lo que falta o requiere atención.</p>
        </div>
        <div className="c-hero-badge"><FileCheck size={16} /><span className="t">{plantillaTag}</span><span className="n">{criteria.length} criterios</span></div>
      </header>
      <div className="steps spine">
        <div className="cstep">
          <div className="cstep-rail"><div className="step-dot done">1</div></div>
          <div className="ccard">
          <div className="ccardhead"><div className="step-title">Elige la plantilla de análisis</div><div className="step-meta">{criteria.length} criterios</div></div>
          <div className="ccardbody">
            <label className="fld">Línea de negocio</label>
            <select value="HLA" onChange={e => { if (e.target.value === 'custom') impRef.current?.click() }}>
              <option value="HLA">Hoteles — Hotel Lease Agreement (HLA)</option>
              <option value="custom">Plantilla personalizada (importar Excel)</option>
            </select>
            <div className="row" style={{ marginTop: 18 }}>
              <button className="btn" onClick={downloadBlank}><Download size={15} /> Descargar plantilla en blanco</button>
              <button className="btn ghost" onClick={() => impRef.current?.click()}><UploadCloud size={15} /> Importar plantilla rellena</button>
              <input ref={impRef} type="file" accept=".xlsx,.xls" hidden onChange={e => importTemplate(e.target.files[0])} />
            </div>
            {impName && <div className="file-pill">{impName} <span className="x" onClick={() => { setImpName(''); setCriteria(HLA.map(r => [...r])); setLobName('Hoteles — HLA') }}>×</span></div>}
            <p className="hint">La plantilla en blanco incluye una hoja de <strong>instrucciones</strong> y la estructura de criterios. Un director edita las cláusulas que interesan al equipo, la rellena y la vuelve a importar aquí.</p>
            <div style={{ marginTop: 18 }}>
              <button className="crit-toggle" aria-expanded={critOpen} onClick={() => setCritOpen(o => !o)}>
                <span>{critOpen ? 'Ocultar' : 'Ver'} los {criteria.length} criterios · {lobName}</span>
                <span className="chev"><ChevronRight size={16} /></span>
              </button>
              <div className={'crit-wrap' + (critOpen ? ' open' : '')}>
                <table className="crit-table">
                  <thead><tr><th>Categoría</th><th>Subcategoría</th><th>Qué analiza</th></tr></thead>
                  <tbody>{criteria.map((r, i) => <tr key={i}><td><strong>{r[0]}</strong></td><td>{r[1] || '—'}</td><td style={{ color: 'var(--ink-soft)' }}>{r[2]}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div className="cstep">
          <div className="cstep-rail"><div className={'step-dot' + (doc ? ' done' : '')}>2</div></div>
          <div className={'ccard' + (criteria.length ? '' : ' dim')}>
          <div className="ccardhead"><div className="step-title">Sube el contrato</div><div className="step-meta">{doc?.name || ''}</div></div>
          <div className="ccardbody">
            <div className={'drop' + (over ? ' over' : '')} onClick={() => docRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
              onDrop={e => { e.preventDefault(); setOver(false); handleDoc(e.dataTransfer.files[0]) }}>
              <div className="ic"><UploadCloud size={28} /></div>
              <div className="t">Arrastra el contrato o haz clic</div>
              <div className="h">PDF, Word (.docx) o TXT</div>
            </div>
            <input ref={docRef} type="file" accept=".pdf,.docx,.txt" hidden onChange={e => handleDoc(e.target.files[0])} />
            {doc && <div className="file-pill"><FileText size={15} /> {doc.name} <span className="x" onClick={() => setDoc(null)}>×</span></div>}
          </div>
          </div>
        </div>

        <div className="cstep">
          <div className="cstep-rail"><div className={'step-dot' + (ready ? ' done' : '')}>3</div></div>
          <div className={'ccard' + (doc ? '' : ' dim')}>
          <div className="ccardhead"><div className="step-title">Analizar</div></div>
          <div className="ccardbody">
            <div className="analyze-panel">
              <div className="ap-recap">
                <span className="ap-chip"><FileCheck size={15} /> {plantillaTag} · {criteria.length} criterios</span>
                <span className="ap-chip">{doc ? <><FileText size={15} /> {doc.name}</> : <><UploadCloud size={15} /> Sin documento</>}</span>
              </div>
              <button className="btn primary lg" disabled={!ready} onClick={analyze}>Analizar contrato <ArrowRight size={16} /></button>
            </div>
            {err && <div className="err">{err}</div>}
          </div>
          </div>
        </div>
      </div>
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
  booking: '', tripadvisor: '', amenities: {}, distances: {}, photo: '', photoErr: '', isSubject: subject, inCS: 'Yes', open: true,
})
function HotelPhoto({ src, className }) {
  const [ok, setOk] = useState(true)
  if (src && ok) return <img className={className} src={src} alt="" loading="lazy" onError={() => setOk(false)} />
  return <div className={className + ' ph'}><Building2 size={18} /></div>
}
const scoreColor = t => t >= 3.5 ? 'var(--good)' : t >= 2.5 ? 'var(--accent)' : 'var(--warn)'
const scoreTint = t => t >= 3.5 ? 'var(--good-soft)' : t >= 2.5 ? 'var(--accent-soft)' : 'var(--warn-soft)'
function Stars({ n }) {
  const v = Math.round(+n || 0)
  if (!v) return null
  return <span className="rk-stars">{[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= v ? 'on' : ''}>★</span>)}</span>
}

function AddHotel({ value, onChange, onAdd }) {
  return (
    <div className="add-card">
      <label className="fld">Añadir hotel</label>
      <div className="add-row">
        <input className="inp" value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()} placeholder="Nombre del hotel (la IA completa el resto)" />
        <button className="btn primary" onClick={onAdd}><Sparkles size={15} /> Añadir y autocompletar</button>
      </div>
    </div>
  )
}

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
  const [busy, setBusy] = useState({})
  const resRef = useRef(null)

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

  const resolveHotelPhoto = async (hotel, web, image) => {
    // 1) Foto de la web oficial del hotel (og:image) — fuente principal, sin Google
    const o = await fetchOgImage(web || hotel.web)
    if (o.url && await preloadImg(o.url)) { setHotel(hotel.id, { photo: o.url, photoErr: '' }); return }
    // 2) Imagen directa sugerida por la IA (validada cargándola)
    if (image && await preloadImg(image)) { setHotel(hotel.id, { photo: image, photoErr: '' }); return }
    // 3) Google Places (extra, solo si la clave lo permite)
    const p = await fetchHotelPhoto(`${hotel.name}${city ? ', ' + city : ''}`)
    if (p.url && await preloadImg(p.url)) { setHotel(hotel.id, { photo: p.url, photoErr: '' }); return }
    setHotel(hotel.id, { photoErr: `Sin foto · web (${web || hotel.web || '—'}): ${o.err} · img IA: ${image ? 'rota' : 'no'}` })
  }
  const autofill = async (hotel) => {
    setBusy(b => ({ ...b, [hotel.id]: true }))
    const poiNames = pois.map(p => p.name)
    const prompt = `Eres analista de inversión hotelera. Dado el nombre de un hotel y su ciudad, completa sus datos con tu mejor conocimiento. Para las distancias, estima los km a pie desde el hotel a cada punto turístico indicado (número, una cifra decimal). Para amenities responde true/false. Si no conoces un dato, estima de forma razonable y conservadora. Responde SOLO JSON sin markdown:
{"address":"","web":"<URL de la web OFICIAL del hotel>","image":"<URL directa a una foto del hotel si la conoces (web oficial o Wikimedia Commons); cadena vacía si no>","stars":<0-5>,"keys":<nº habitaciones>,"group":"","brand":"","lastRefurb":<año>,"booking":<0-10>,"tripadvisor":<0-5>,"amenities":{"<nombre exacto>":true/false},"distances":{"<nombre punto>":<km>}}
Hotel: ${hotel.name}
Ciudad: ${city}
Amenities a evaluar: ${amenities.join(', ')}
Puntos turísticos: ${poiNames.join(', ')}`
    try {
      const j = parseJSON(await callAI([{ text: prompt }], 1200))
      setHotels(p => p.map(h => {
        if (h.id !== hotel.id) return h
        const next = { ...h, amenities: { ...h.amenities }, distances: { ...h.distances } }
        next.address = j.address || h.address; next.web = j.web || h.web
        next.stars = j.stars ?? h.stars; next.keys = j.keys ?? h.keys
        next.group = j.group || h.group; next.brand = j.brand || h.brand
        next.lastRefurb = j.lastRefurb ?? h.lastRefurb; next.booking = j.booking ?? h.booking; next.tripadvisor = j.tripadvisor ?? h.tripadvisor
        if (j.amenities) amenities.forEach(a => { if (a in j.amenities) next.amenities[a] = !!j.amenities[a] })
        if (j.distances) pois.forEach(pp => { const v = j.distances[pp.name]; if (typeof v === 'number') next.distances[pp.id] = v })
        return next
      }))
      resolveHotelPhoto(hotel, j.web, j.image)   // foto: web del hotel → imagen IA → Places
    } catch (e) { alert('No se pudo autocompletar (' + e.message + '). Rellena los campos a mano.') }
    finally { setBusy(b => ({ ...b, [hotel.id]: false })) }
  }
  const addHotel = () => {
    const n = hName.trim(); if (!n) return
    const h = newScoreHotel(hotels.length === 0); h.name = n
    setHotels(p => [...p, h]); setHName(''); autofill(h)
  }

  const ranked = [...hotels].sort((a, b) => der[b.id].total - der[a.id].total)
  const exportWord = () => {
    if (!hotels.length) return
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
    dlWord(html, 'score_hoteles_' + city.replace(/[^\w]+/g, '_') + '.doc')
  }

  const Bars = ({ d }) => {
    const bars = [['Ubicación', d.loc, 'var(--blue)'], ['Producto', d.prod, 'var(--good)'], ['Reputación', d.rat, 'var(--purple)']]
    return (
      <div className="rk-bars">
        {bars.map(([l, v, c]) => (
          <div key={l}>
            <div className="bar-l"><span>{l}</span><b>{v ? v.toFixed(1) : '–'}</b></div>
            <div className="bar-t"><div className="bar-f" style={{ width: (clamp(v, 0, 5) / 5 * 100) + '%', background: c }} /></div>
          </div>
        ))}
      </div>
    )
  }
  const DataChips = ({ h }) => {
    const ams = amenities.filter(a => h.amenities[a])
    return (
      <div className="data-chips">
        {h.booking ? <span className="dchip rate"><Star size={12} /> Booking <b>{h.booking}</b></span> : null}
        {h.tripadvisor ? <span className="dchip rate"><Star size={12} /> TripAdvisor <b>{h.tripadvisor}</b></span> : null}
        {h.lastRefurb ? <span className="dchip">Reforma <b>{h.lastRefurb}</b></span> : null}
        {der[h.id].distAvg != null ? <span className="dchip"><MapPin size={12} /> <b>{der[h.id].distAvg.toFixed(1)}</b> km medios</span> : null}
        {ams.map(a => <span className="dchip am" key={a}><Wifi size={12} /> {a}</span>)}
      </div>
    )
  }

  return (
    <div className="wrap">
      <h1>Score de hoteles</h1>
      <p className="lead">Define la ciudad y su conjunto competitivo. La IA autocompleta cada hotel por su nombre; el score pondera ubicación, producto y reputación, y se compara con la media del comp set.</p>
      <div className="subtabs">
        <button className={'subtab' + (pane === 'config' ? ' active' : '')} onClick={() => setPane('config')}>Configuración</button>
        <button className={'subtab' + (pane === 'set' ? ' active' : '')} disabled={!started} onClick={() => setPane('set')}>Comp set</button>
        <button className={'subtab' + (pane === 'res' ? ' active' : '')} disabled={!started} onClick={() => setPane('res')}>Resultados</button>
      </div>

      {pane === 'config' && <>
        <div className="card">
          <div className="card-h"><h2>Ciudad de análisis</h2></div>
          <p className="desc">Todo el análisis se referencia a una ciudad. Define los puntos turísticos clave: las distancias a ellos determinan el score de ubicación.</p>
          <label className="fld">Ciudad</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="inp" value={city} onChange={e => setCity(e.target.value)} placeholder="Ej. Madrid, Toledo, Sevilla…" style={{ maxWidth: 380 }} />
            <button className="btn ai sm" onClick={suggestPoi}><Sparkles size={15} /> Sugerir puntos turísticos</button>
          </div>
          {poiLoad && <div className="loading"><div className="spin" /><span>Buscando los principales puntos turísticos…</span></div>}
          <div style={{ marginTop: 22 }}>
            <label className="fld">Puntos turísticos de referencia</label>
            {pois.map((p, i) => (
              <div className="poi-row" key={p.id}>
                <input className="inp" value={p.name} placeholder={`Punto turístico ${i + 1}`} onChange={e => setPois(prev => prev.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))} />
                <button className="del" onClick={() => setPois(prev => prev.filter(x => x.id !== p.id))}><Trash2 size={17} /></button>
              </div>
            ))}
            <button className="btn sm" style={{ marginTop: 12 }} onClick={() => setPois(p => [...p, { id: uid(), name: '' }])}>+ Añadir punto</button>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h2>Amenities a evaluar</h2></div>
          <p className="desc">Las instalaciones que cuentan para el score de producto. En cada hotel marcarás cuáles tiene.</p>
          <div className="am-chips">{amenities.map(a => <span className="am-chip" key={a}>{a} <span className="x" onClick={() => setAmenities(prev => prev.filter(x => x !== a))}>×</span></span>)}</div>
          <div className="add-row" style={{ marginTop: 14, maxWidth: 460 }}>
            <input className="inp" value={amInput} onChange={e => setAmInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAm()} placeholder="Añadir amenity (ej. Rooftop)" />
            <button className="btn sm" onClick={addAm}>Añadir</button>
          </div>
        </div>
        <button className="btn primary" onClick={start}>Continuar al comp set →</button>
      </>}

      {pane === 'set' && <>
        <AddHotel value={hName} onChange={setHName} onAdd={addHotel} />
        <p className="desc" style={{ margin: '12px 2px 18px' }}>Marca un hotel como <b>objeto</b> (el que analizas) y los que formen el <b>comp set relevante</b>. La media se calcula solo con los del comp set.</p>
        {!hotels.length
          ? <div className="empty">Escribe el nombre de un hotel arriba para empezar. La IA completará dirección, categoría, amenities y distancias.</div>
          : hotels.map(h => {
            const d = der[h.id]; const stars = '★'.repeat(Math.round(+h.stars || 0))
            return (
              <div className={'hotel' + (h.isSubject ? ' subject' : '') + (h.open ? ' open' : '')} key={h.id}>
                <div className="hotel-bar" onClick={() => setHotel(h.id, { open: !h.open })}>
                  <span className="h-chev"><ChevronRight size={15} /></span>
                  <HotelPhoto src={h.photo} className="rk-photo" />
                  <div className="h-id">
                    <div className="h-name">{h.name}{stars && <span className="h-stars">{stars}</span>}
                      {h.isSubject && <span className="h-tag subj">Objeto</span>}{h.inCS === 'Yes' && <span className="h-tag cs">Comp set</span>}</div>
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
                          <div className={'am-toggle' + (h.amenities[a] ? ' on' : '')} key={a} onClick={() => setHotel(h.id, { amenities: { ...h.amenities, [a]: !h.amenities[a] } })}><span>{a}</span><span className="sw" /></div>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, maxWidth: 220 }}><label className="fld">Año última reforma</label><input className="inp" type="number" value={h.lastRefurb} onChange={e => setHotel(h.id, { lastRefurb: e.target.value })} /></div>
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
                      <button className="btn ai sm" onClick={() => autofill(h)}><Sparkles size={15} /> Reautocompletar</button>
                      <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setHotels(p => p.filter(x => x.id !== h.id))}>Eliminar</button>
                    </div>
                    {!h.photo && h.photoErr && <div className="photo-note">Foto no disponible · {h.photoErr}</div>}
                  </div>
                )}
              </div>
            )
          })}
        {!!hotels.length && <>
          <AddHotel value={hName} onChange={setHName} onAdd={addHotel} />
          <button className="btn primary" style={{ marginTop: 14 }} onClick={() => setPane('res')}>Ver resultados →</button>
          <BackToTop />
        </>}
      </>}

      {pane === 'res' && <>
        <div className="ms-toolbar hot-no-print">
          <button className="btn" onClick={() => setPane('set')}>← Volver al comp set</button>
          <button className="btn" onClick={() => printNode(resRef.current)}><Printer size={15} /> Imprimir / PDF</button>
          <button className="btn" onClick={exportWord}><Download size={15} /> Exportar a Word</button>
        </div>
        <div className="ms-doc" ref={resRef}>
          <div className="ms-band">
              <div className="ms-eyebrow">Score de hoteles · Comp set</div>
            <div className="ms-title">Ranking comparativo — {city || 'ciudad'}</div>
            <div className="ms-meta">{hotels.length} hoteles · {csCount} en comp set · Ref.: {pois.map(p => p.name).filter(Boolean).join(', ') || '—'}</div>
          </div>
          {!hotels.length ? <div className="ms-sec"><div className="empty">Sin hoteles.</div></div> : <>
            <section className="ms-sec">
              <div className="ms-h"><span className="hl">Podio</span></div>
              <div className="podium">
                {ranked.slice(0, 3).map((h, i) => {
                  const d = der[h.id]; const vs = csAvg.total ? (d.total / csAvg.total - 1) * 100 : 0
                  return (
                    <div className={'pod r' + (i + 1) + (h.isSubject ? ' subject' : '')} key={h.id}>
                      <HotelPhoto src={h.photo} className="pod-photo" />
                      <div className="medal">{i + 1}</div>
                      <div className="pn">{h.name}{h.isSubject ? ' ·' : ''}</div>
                      <div className="pstars"><Stars n={h.stars} /></div>
                      <div className="pscore" style={{ color: scoreColor(d.total) }}>{(d.total * 20).toFixed(0)}<small>/100</small></div>
                      {h.inCS === 'Yes' && csAvg.total ? <div className="pvs"><span className={'vsbar ' + (vs >= 0 ? 'up' : 'down')}>{vs >= 0 ? '+' : ''}{vs.toFixed(0)}% vs media</span></div> : null}
                    </div>
                  )
                })}
              </div>
            </section>
            <section className="ms-sec">
              <div className="ms-h"><span className="hl">Ranking detallado</span></div>
              {ranked.map((h, i) => {
                const d = der[h.id]; const vs = csAvg.total ? (d.total / csAvg.total - 1) * 100 : 0
                return (
                  <div className={'rk-card' + (h.isSubject ? ' subject' : '')} key={h.id}>
                    <div className="rk-top">
                      <div className={'rk-pos' + (i < 3 ? ' p' + (i + 1) : '')}>{i + 1}</div>
                      <HotelPhoto src={h.photo} className="rk-photo big" />
                      <div className="rk-name">
                        <div className="nn">{h.name}
                          {h.isSubject && <span className="h-tag subj">Objeto</span>}
                          {h.inCS === 'Yes' && csAvg.total ? <span className={'vsbar ' + (vs >= 0 ? 'up' : 'down')}>{vs >= 0 ? '+' : ''}{vs.toFixed(0)}% vs media</span> : null}</div>
                        <div className="ss">
                          <Stars n={h.stars} />
                          <span className="ss-t">{[h.address || h.group, h.keys ? `${h.keys} hab.` : ''].filter(Boolean).join(' · ')}</span>
                        </div>
                      </div>
                      <div className="rk-total">
                        <div className="rk-badge" style={{ background: scoreTint(d.total), color: scoreColor(d.total) }}>{(d.total * 20).toFixed(0)}</div>
                        <div className="s">{d.total.toFixed(1)} / 5</div>
                      </div>
                    </div>
                    <Bars d={d} />
                    <DataChips h={h} />
                  </div>
                )
              })}
            </section>
            {!!csCount && (
              <section className="ms-sec">
                <div className="ms-h"><span className="hl">Media del comp set</span></div>
                <div className="mk-grid">
                  <div className="mk"><div className="k-l">Ubicación</div><div className="k-v mono">{csAvg.loc.toFixed(1)}</div></div>
                  <div className="mk"><div className="k-l">Producto</div><div className="k-v mono">{csAvg.prod.toFixed(1)}</div></div>
                  <div className="mk"><div className="k-l">Reputación</div><div className="k-v mono">{csAvg.rat.toFixed(1)}</div></div>
                  <div className="mk"><div className="k-l">Score medio</div><div className="k-v mono" style={{ color: 'var(--accent)' }}>{(csAvg.total * 20).toFixed(0)}</div></div>
                </div>
              </section>
            )}
          </>}
        </div>
        <BackToTop />
      </>}
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
  const [sec, setSec] = useState('exec')
  const msRef = useRef(null)

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
  const goMicrosite = () => { setShowMs(true); setSec('exec'); generate() }
  const goSec = s => { setSec(s); msRef.current?.querySelector('#hs-' + s)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  const kpiWant = [['Ocupación', 'Ocupación'], ['ADR', 'ADR'], ['RevPAR', 'RevPAR'], ['GOP', 'GOP'], ['% Margen GOP', 'Margen GOP'], ['Total Ingresos', 'Ingresos totales']]
  const cmtOrder = ['Habitaciones', 'F&B', 'Eventos', 'Spa', 'Otros']

  if (!showMs) {
    return (
      <div className="wrap">
        <h1>Presentación</h1>
        <p className="lead">Edita la cuenta de explotación (P&amp;L) y genera una microsite ejecutiva con titular insight-driven, KPIs y comentarios por línea.</p>
        <div className="pnl-tools">
          <input className="inp" value={projName} onChange={e => setProjName(e.target.value)} placeholder="Nombre del proyecto / hotel" style={{ fontWeight: 600, minWidth: 260, maxWidth: 360 }} />
          <span className="grow" />
          <button className="btn sm" onClick={addLine}>+ Añadir línea</button>
          <button className="btn primary" onClick={goMicrosite}>Generar microsite →</button>
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
        <BackToTop />
      </div>
    )
  }

  return (
    <div className="wrap">
      <div className="ms-toolbar hot-no-print">
        <button className="btn" onClick={() => setShowMs(false)}>← Volver al editor</button>
        <button className="btn" onClick={generate}><Sparkles size={15} /> Regenerar análisis</button>
        <button className="btn" onClick={() => printNode(msRef.current)}><Printer size={15} /> Imprimir / PDF</button>
      </div>
      <div className="ms-doc" ref={msRef}>
        <div className="ms-band">
          <div className="ms-eyebrow">Presentación · Business Plan Review</div>
          <div className="ms-title">{projName.trim() || 'Proyecto hotelero'}</div>
          <div className="ms-meta">Cuenta de explotación 2023A–2025A · Desempeño, márgenes y GOP</div>
        </div>
        <div className="ms-nav hot-no-print">
          <a className={sec === 'exec' ? 'active' : ''} onClick={() => goSec('exec')}><span className="num">1</span>Resumen Ejecutivo</a>
          <a className={sec === 'hist' ? 'active' : ''} onClick={() => goSec('hist')}><span className="num">2</span>Datos Históricos</a>
        </div>
        {loading && <div className="loading" style={{ padding: '16px 36px 0' }}><div className="spin" /><span>Generando análisis ejecutivo…</span></div>}
        {err && <div className="err" style={{ margin: '14px 36px 0' }}>{err}</div>}

        <section className="ms-sec" id="hs-exec">
          <div className="ms-h"><span className="hl">1. Resumen Ejecutivo</span></div>
          <p className="headline">{analysis?.headline || 'El titular ejecutivo aparecerá aquí tras generar el análisis.'}</p>
          <div className="mk-grid one-row">
            {kpiWant.map(([lbl, disp]) => {
              const r = findRow(lbl); if (!r) return null
              const y = yoy(r.v); const up = y >= 0
              return (
                <div className="mk" key={lbl}>
                  <div className="k-l">{disp}</div>
                  <div className="k-v mono">{fmtVal(r.v[2], (r.fmt === 'pct' || lbl === '% Margen GOP') ? 'pct' : r.fmt)}</div>
                  <div><span className={'k-d ' + (up ? 'up' : 'down')}>{up ? '▲' : '▼'} {pctTxt(y).replace('+', '')}</span><span className="k-yo">YoY 25-24</span></div>
                </div>
              )
            })}
          </div>
          <div className="ctx-grid" style={{ marginTop: 18 }}>
            <div className="ctx-card"><h4>Contexto del proyecto</h4><ul><li>Cuenta de explotación 2023A–2025A</li><li>Análisis de desempeño y márgenes</li></ul></div>
            <div className="ctx-card"><h4>Revisión datos históricos</h4><ul><li>Evolución de ingresos por departamento</li><li>Estructura de costes y GOP</li></ul></div>
          </div>
        </section>

        <section className="ms-sec" id="hs-hist">
          <div className="ms-h"><span className="hl">2. Revisión</span> · Datos Históricos</div>
          <p className="headline">{analysis?.histHeadline || 'Comentarios por línea de ingresos.'}</p>
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
          <h4 style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 700, margin: '26px 0 6px' }}>Comentarios · Ingresos</h4>
          <div className="comments">
            {cmtOrder.map((k, i) => analysis?.comments?.[k]
              ? <div className="cmt" key={k}><div className="cn">{i + 1}</div><div className="cc"><h5>{k}</h5><p>{analysis.comments[k]}</p></div></div>
              : null)}
          </div>
        </section>
      </div>
      <BackToTop />
    </div>
  )
}

/* ════════════════════════════ SHELL ═══════════════════════════════════ */
const TABS = [
  { v: 'contracts', label: 'Revisión de contratos', sub: 'Análisis HLA', icon: FileText },
  { v: 'score', label: 'Score de hoteles', sub: 'Comp set / Gravity', icon: Star },
  { v: 'slides', label: 'Presentación', sub: 'BP Review · microsite', icon: LayoutGrid },
]
export default function HotelesView() {
  const [view, setView] = useState('contracts')
  return (
    <div className="hot-skin">
      <div className="hot-top">
        <div className="hot-top-head">
          <div className="hot-mark">H</div>
          <div><div className="hot-h1">Hoteles</div><div className="hot-h2">Suite de análisis hotelero · contratos, score y presentaciones</div></div>
        </div>
        <div className="hot-tabs">
          {TABS.map(t => {
            const Ico = t.icon
            return (
              <button key={t.v} className={'hot-tab' + (view === t.v ? ' active' : '')} onClick={() => setView(t.v)}>
                <span className="tic"><Ico size={19} /></span>
                <span className="tt"><span className="a">{t.label}</span><span className="b">{t.sub}</span></span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="hot-scroll">
        {/* Montados siempre: cambiar de botón no pierde el trabajo en curso */}
        <div style={{ display: view === 'contracts' ? 'block' : 'none' }}><ModContratos /></div>
        <div style={{ display: view === 'score' ? 'block' : 'none' }}><ModScore /></div>
        <div style={{ display: view === 'slides' ? 'block' : 'none' }}><ModSlides /></div>
      </div>
    </div>
  )
}
