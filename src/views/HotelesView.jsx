import { useState, useRef, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  FileText, Star, Presentation, Download, Brain, BarChart3, Lightbulb,
  UploadCloud, X, Building2, AlertTriangle, Database, Plus, Trash2,
} from 'lucide-react'

/* ============================================================================
 * Hoteles · Hotel Asset Manager — nativo PDB
 * Adaptado a la documentación de /Hoteles (prompts, plantillas, ejemplos):
 *  1. Revisión de contratos — Template HLA (38 campos exactos) + prompt real.
 *  2. Score de hoteles — CompSet / Gravity Analysis (hotel + competidores
 *     ilimitados, Condition por año de reforma, medias y % vs CompSet).
 *  3. Presentación — BP Review · Datos históricos (P&L: subir Excel o manual →
 *     titular ejecutivo + comentarios por línea de ingreso).
 * IA vía nuestro proxy serverless /api/anthropic (clave server-side).
 * ========================================================================== */

const AI_MODEL = 'gemini-2.0-flash'
const YEAR = new Date().getFullYear()

// ── Template HLA (verbatim del Excel 2. 260612_Template_HLA) ──
const HLA_FIELDS = [
  ['Signature date', '-', 'Include the contract execution date'],
  ['Purpose of the contract', '-', 'Specify the purpose of the contract'],
  ['Lessee', '-', 'Include name and NIF of the lessee'],
  ['Lessor', '-', 'Include name and NIF of the lessor'],
  ['Guarantor', '-', 'Include details of the guarantor, if any'],
  ['Duration', 'Full Term', 'Specify the total term of the contract'],
  ['Duration', 'Mandatory Period', 'Specify the minimum mandatory term of the contract'],
  ['Renewal', 'Rights', 'Specify the renewal terms'],
  ['Renewal', 'Conditions', 'Specify the renewal rights of both the lessor and the lessee'],
  ['Break clauses', '-', 'Indicate whether any break clauses exist; if not, state "No"'],
  ['Performance Clause', '-', 'Indicate whether any performance clauses exist; if not, state "No"'],
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
  ['Return of the Property', '-', "Specify the lessee's obligations upon termination, including the condition and handover of the property"],
  ['Jurisdiction', '-', 'Specify the applicable jurisdiction of the contract'],
  ['Governing Law', '-', 'Specify the governing law of the contract'],
  ['Access to hotel', '-', 'Specify the terms under which the lessor may access the hotel'],
  ['Lessor representative', '-', 'Specify whether a lessor representative is appointed'],
  ['Lessee information', '-', 'Specify the reporting obligations and information to be provided by the lessee to the lessor'],
].map(([cat, sub, desc]) => ({ cat, sub, desc }))

const FACILITIES = ['F&B', 'Meeting areas', 'Auditorium', 'Spa', 'Pool', 'Gym', 'Parking']

// Condition (1-5) según año de última reforma — tabla exacta de CS Gravity
function conditionFromRefurb(year) {
  const y = parseInt(year)
  if (!y) return null
  const a = YEAR - y
  if (a <= 2) return 5
  if (a <= 5) return 4.5
  if (a <= 7) return 4
  if (a <= 9) return 3.5
  if (a <= 11) return 3
  if (a <= 14) return 2.5
  if (a <= 17) return 2
  if (a <= 20) return 1.5
  return 1
}

// ── Proxy IA (Gemini) de la PDB ──
// parts: array de partes Gemini ({text} | {inlineData:{mimeType,data}})
async function callAI(parts, maxTokens) {
  const res = await fetch('/api/gemini', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      contents: [{ role: 'user', parts }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Error ${res.status}`) }
  const d = await res.json()
  if (d?.promptFeedback?.blockReason) throw new Error('Bloqueado por seguridad: ' + d.promptFeedback.blockReason)
  return (d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('')
}
const parseJSON = raw => JSON.parse((raw || '').replace(/```json|```/g, '').trim())
function dlCSV(rows, name) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const u = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u)
}

// ── Estilos (tokens PDB) ──
const inp = { width: '100%', padding: '7px 9px', border: '1px solid var(--border2)', borderRadius: 6, fontSize: 12.5, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text1)', boxSizing: 'border-box', outline: 'none' }
const lbl = { display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }
const secLbl = { fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '16px 0 8px', paddingBottom: 6, borderBottom: '1px solid var(--border)' }
const errBox = { background: 'var(--red-lt)', border: '1px solid #f3b4b4', borderRadius: 7, padding: '10px 14px', marginTop: 10, fontSize: 12, color: 'var(--pdb-red)' }

const newHotel = (subject = false) => ({
  subject, name: '', address: '', web: '', category: subject ? '4★' : '4★', keys: '', group: '', brand: '',
  refurb: '', stars: '4', booking: '', trip: '', distHotel: subject ? '0' : '', facs: [],
})

// Líneas del P&L (BP Review · Datos históricos)
const PNL_KPIS = ['Ocupación', 'ADR', 'RevPAR', '% Margen GOP']
const PNL_REV = ['Habitaciones', 'F&B', 'Eventos', 'Spa', 'Otros']
const emptyPnl = () => {
  const o = {}
  ;[...PNL_KPIS, ...PNL_REV].forEach(k => { o[k] = { y2023: '', y2024: '', y2025: '' } })
  return o
}

export default function HotelesView() {
  const [mod, setMod] = useState('contract')

  /* ─────────── MÓDULO 1: CONTRATOS (HLA) ─────────── */
  const [cFile, setCFile] = useState(null)
  const [cRows, setCRows] = useState([])
  const [cLoading, setCLoading] = useState(false)
  const [cErr, setCErr] = useState('')
  const cInputRef = useRef(null)

  const onFile = (f) => {
    if (!f || f.size > 10 * 1024 * 1024) return
    const n = f.name.toLowerCase()
    const kind = n.endsWith('.pdf') ? 'pdf' : n.endsWith('.docx') ? 'docx' : 'text'
    setCErr(''); setCRows([])
    if (kind === 'pdf') {
      const r = new FileReader()
      r.onload = e => setCFile({ name: f.name, size: f.size, kind, b64: e.target.result.split(',')[1] })
      r.readAsDataURL(f)
    } else setCFile({ name: f.name, size: f.size, kind, file: f })
  }

  const analyzeContract = async () => {
    if (!cFile) return
    setCErr(''); setCRows([]); setCLoading(true)
    const tabla = HLA_FIELDS.map((f, i) => `${i + 1}. Category:"${f.cat}" | Subcategory:"${f.sub}" | ${f.desc}`).join('\n')
    const prompt = `Necesito que me rellenes la tabla "Template HLA" (Hotel Lease Analysis) con los datos de este contrato de arrendamiento hotelero. Soy Asset Manager de hoteles.
Reglas:
- Para cada fila escribe un "summary" conciso (2-3 frases) con la información del contrato para esa categoría/subcategoría.
- Si NO encuentras la información, pon exactamente "TBC".
- Si hay ambigüedad o tienes dudas, empieza el summary con "duda: " seguido de tus comentarios.
- "page" = referencia a la cláusula o página del contrato.
- Si hay algún tema relevante para un Asset Manager que NO esté en la tabla, añádelo en "otros" (hasta 6).
Devuelve SOLO JSON válido, sin markdown:
{"fields":[{"id":1,"cat":"...","sub":"...","summary":"...","page":"..."}],"otros":[{"cat":"Otros: ...","sub":"-","summary":"...","page":"..."}]}
Tabla HLA:\n${tabla}`
    try {
      let parts
      if (cFile.kind === 'pdf') {
        parts = [{ inlineData: { mimeType: 'application/pdf', data: cFile.b64 } }, { text: prompt }]
      } else if (cFile.kind === 'docx') {
        const mod2 = await import('mammoth/mammoth.browser.js'); const mammoth = mod2.default || mod2
        const { value } = await mammoth.extractRawText({ arrayBuffer: await cFile.file.arrayBuffer() })
        if (!value || !value.trim()) throw new Error('No se pudo extraer texto del documento Word.')
        parts = [{ text: prompt + '\n\nCONTRATO (texto extraído):\n' + value }]
      } else {
        parts = [{ text: prompt + '\n\nCONTRATO:\n' + (await cFile.file.text()) }]
      }
      const raw = await callAI(parts, 4500)
      const parsed = parseJSON(raw)
      // Mezcla con la plantilla para conservar la Descripción de cada fila
      const fields = HLA_FIELDS.map((tpl, i) => {
        const m = (parsed.fields || []).find(x => x.id === i + 1) || (parsed.fields || [])[i] || {}
        return { ...tpl, summary: m.summary || 'TBC', page: m.page || '-' }
      })
      const otros = (parsed.otros || []).map(o => ({ cat: o.cat || 'Otros', sub: o.sub || '-', desc: '', summary: o.summary || '', page: o.page || '-' }))
      setCRows([...fields, ...otros])
    } catch (e) { setCErr('Error al analizar el contrato: ' + e.message) }
    finally { setCLoading(false) }
  }

  const cStats = useMemo(() => {
    const tot = cRows.length
    const tbc = cRows.filter(r => !r.summary || r.summary === 'TBC').length
    const duda = cRows.filter(r => /^duda/i.test(r.summary || '')).length
    return { tot, tbc, duda, ok: tot - tbc - duda }
  }, [cRows])

  const exportContract = () => dlCSV(
    [['Category', 'Subcategory', 'Description', 'Contract summary', 'Page in Contract'],
      ...cRows.map(r => [r.cat, r.sub, r.desc, r.summary, r.page])], 'HLA.csv')

  /* ─────────── MÓDULO 2: COMPSET / GRAVITY ─────────── */
  const [cs, setCs] = useState([newHotel(true)])
  const [pois, setPois] = useState(['', '', '', ''])
  const [csResult, setCsResult] = useState(null)
  const [csLoading, setCsLoading] = useState(false)
  const [csErr, setCsErr] = useState('')
  const [hoteles, setHoteles] = useState([])

  useEffect(() => {
    let cancel = false
    supabase.from('activos').select('id,ref,nombre,direccion,calidad,anno_rehabilitacion,metricas')
      .eq('uso', 'Hotel').order('nombre').then(({ data }) => { if (!cancel) setHoteles(data || []) })
    return () => { cancel = true }
  }, [])

  const setHotel = (i, k, v) => setCs(p => p.map((h, j) => j === i ? { ...h, [k]: v } : h))
  const toggleFac = (i, f) => setCs(p => p.map((h, j) => j === i ? { ...h, facs: h.facs.includes(f) ? h.facs.filter(x => x !== f) : [...h.facs, f] } : h))
  const addHotel = () => setCs(p => [...p, newHotel(false)])
  const removeHotel = (i) => setCs(p => p.filter((_, j) => j !== i))
  const loadHotelFromPDB = (i, id) => {
    const hh = hoteles.find(x => x.id === id); if (!hh) return
    const m = hh.metricas || {}
    setCs(p => p.map((h, j) => j === i ? {
      ...h, name: hh.nombre || '', address: hh.direccion || '',
      category: /[1-5]★/.test(hh.calidad || '') ? hh.calidad : h.category,
      stars: (hh.calidad || '').match(/(\d)/)?.[1] || h.stars,
      keys: m.n_habitaciones != null ? String(m.n_habitaciones) : '',
      refurb: hh.anno_rehabilitacion ? String(hh.anno_rehabilitacion) : '',
    } : h))
  }

  const genCompSet = async () => {
    setCsErr(''); setCsResult(null); setCsLoading(true)
    const poisF = pois.map(p => p.trim()).filter(Boolean)
    const hotelsIn = cs.map((h, i) => ({
      idx: i, role: h.subject ? 'SUBJECT HOTEL' : 'competitor',
      name: h.name || (h.subject ? 'Hotel analizado' : `Competidor ${i}`),
      address: h.address, web: h.web, category: h.category, keys: h.keys, group: h.group, brand: h.brand,
      stars: h.stars, booking: h.booking, trip: h.trip, refurbYear: h.refurb,
      condition: conditionFromRefurb(h.refurb), facilities: h.facs,
    }))
    const prompt = `Actúa como experto en commercial due diligence hotelera (framework Gravity Analysis / CompSet).
Analiza este conjunto competitivo. POIs (puntos de interés) a medir: ${poisF.length ? poisF.join(', ') : 'ninguno'}.
Para CADA hotel calcula, de forma comparable y estandarizada:
- poiKm: distancia caminando (km, estimada) a cada POI en el MISMO orden que la lista de POIs.
- scoreLocation (0-5): mejor cuanto más cerca de los POIs.
- scoreProduct (0-5): según facilities y la Condition (ya calculada por año de reforma, te la doy).
- scoreRating (0-5): según estrellas, Booking (0-10) y TripAdvisor (0-5).
- total (0-5, 1 decimal): media de Location, Product y Rating.
- comment: 1 frase ejecutiva.
Devuelve SOLO JSON válido, sin markdown, en el MISMO orden de entrada:
{"hotels":[{"idx":0,"poiKm":[{"poi":"...","km":"<n>"}],"scoreLocation":<n>,"scoreProduct":<n>,"scoreRating":<n>,"total":<n>,"comment":"..."}]}
Hoteles (JSON):\n${JSON.stringify(hotelsIn)}`
    try {
      const raw = await callAI([{ text: prompt }], 2500)
      const data = parseJSON(raw)
      const byIdx = {}; (data.hotels || []).forEach(h => { byIdx[h.idx] = h })
      const rows = cs.map((h, i) => {
        const ai = byIdx[i] || {}
        return {
          ...h, condition: conditionFromRefurb(h.refurb),
          poiKm: ai.poiKm || [], scoreLocation: +ai.scoreLocation || 0, scoreProduct: +ai.scoreProduct || 0,
          scoreRating: +ai.scoreRating || 0, total: +ai.total || 0, comment: ai.comment || '',
        }
      })
      // Media del CompSet (competidores, idx>0) y % del hotel vs media
      const comps = rows.filter(r => !r.subject)
      const avg = k => comps.length ? comps.reduce((s, r) => s + (r[k] || 0), 0) / comps.length : 0
      const csAvg = { scoreLocation: avg('scoreLocation'), scoreProduct: avg('scoreProduct'), scoreRating: avg('scoreRating'), total: avg('total'), condition: avg('condition') }
      const subj = rows.find(r => r.subject)
      const pct = subj && csAvg.total ? (subj.total / csAvg.total - 1) : null
      setCsResult({ rows, csAvg, pct, poisF })
    } catch (e) { setCsErr('Error: ' + e.message) }
    finally { setCsLoading(false) }
  }

  const exportCompSet = () => {
    if (!csResult) return
    const head = ['Hotel', 'Address', 'Category', 'Keys', 'Last Refurb Year', 'Condition',
      ...csResult.poisF.map(p => `POI: ${p} (km)`), 'Score Location', 'Score Product', 'Score Rating', 'TOTAL SCORE', 'Comments']
    const body = csResult.rows.map(r => [r.name, r.address, r.category, r.keys, r.refurb, r.condition ?? '',
      ...csResult.poisF.map((_, i) => r.poiKm[i]?.km ?? ''), r.scoreLocation, r.scoreProduct, r.scoreRating, r.total, r.comment])
    const avg = csResult.csAvg
    body.push(['Relevant CS Average', '', '', '', '', avg.condition.toFixed(1), ...csResult.poisF.map(() => ''),
      avg.scoreLocation.toFixed(1), avg.scoreProduct.toFixed(1), avg.scoreRating.toFixed(1), avg.total.toFixed(1), ''])
    dlCSV([head, ...body], 'CompSet_Gravity.csv')
  }

  /* ─────────── MÓDULO 3: PRESENTACIÓN (BP REVIEW) ─────────── */
  const [pnl, setPnl] = useState(emptyPnl())
  const [pnlName, setPnlName] = useState('')
  const [bp, setBp] = useState(null)
  const [pLoading, setPLoading] = useState(false)
  const [pErr, setPErr] = useState('')
  const pInputRef = useRef(null)

  const setPnlCell = (row, yr, v) => setPnl(p => ({ ...p, [row]: { ...p[row], [yr]: v } }))

  const onPnlExcel = async (f) => {
    if (!f) return
    setPErr('')
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(await f.arrayBuffer())
      const ws = wb.Sheets[wb.SheetNames.find(n => /slide\s*2/i.test(n)) || wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' })
      const next = emptyPnl()
      const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? '' : n }
      rows.forEach(r => {
        const label = String(r[0] || '').trim()
        const key = [...PNL_KPIS, ...PNL_REV].find(k => label.toLowerCase() === k.toLowerCase())
        if (key) next[key] = { y2023: num(r[2]), y2024: num(r[3]), y2025: num(r[4]) }
      })
      setPnl(next); setPnlName(f.name)
    } catch (e) { setPErr('No se pudo leer el Excel: ' + e.message) }
  }

  const genBP = async () => {
    setPErr(''); setBp(null); setPLoading(true)
    const tbl = [...PNL_KPIS, ...PNL_REV].map(k => `${k}: 2023A=${pnl[k].y2023 || '—'} | 2024A=${pnl[k].y2024 || '—'} | 2025A=${pnl[k].y2025 || '—'}`).join('\n')
    const prompt = `Actúa como experto en Asset Management hotelero, con experiencia en análisis financiero, business plans y reporting para propietarios e inversores.
Analiza esta tabla de datos reales de un hotel (Datos históricos, slide ejecutiva de PowerPoint) y genera:
1) Un Titular Ejecutivo "insight-driven" (1-2 frases cortas) que sintetice la conclusión estratégica principal del desempeño financiero. Tono ejecutivo y formal, mensaje claro y accionable.
2) Un comentario por cada línea de ingresos (Habitaciones, F&B, Eventos, Spa, Otros): muy ejecutivo, formal y breve, MÁXIMO 20-25 palabras, explicando los principales drivers (crecimiento, descenso, estabilidad), con terminología de hotelería y asset management. Básate SOLO en los datos dados.
Devuelve SOLO JSON válido, sin markdown:
{"titular":"...","comentarios":{"Habitaciones":"...","F&B":"...","Eventos":"...","Spa":"...","Otros":"..."}}
Datos (k€ / ratios):\n${tbl}`
    try {
      const raw = await callAI([{ text: prompt }], 900)
      setBp(parseJSON(raw))
    } catch (e) { setPErr('Error: ' + e.message) }
    finally { setPLoading(false) }
  }

  const hasData = cRows.length > 0 || !!csResult || !!bp
  const MODULES = [
    { id: 'contract', label: 'Revisión de contratos', icon: FileText },
    { id: 'score', label: 'Score · CompSet', icon: Star },
    { id: 'slide', label: 'Presentación', icon: Presentation },
  ]
  const breakdown = [
    { l: 'Location', k: 'scoreLocation', c: 'var(--pdb-blue)' },
    { l: 'Product', k: 'scoreProduct', c: 'var(--pdb-green)' },
    { l: 'Rating', k: 'scoreRating', c: '#7C3AED' },
  ]
  const num3 = v => (v == null || v === '' || isNaN(v)) ? '—' : Number(v).toLocaleString('es-ES', { maximumFractionDigits: 2 })

  return (
    <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={18} strokeWidth={1.9} /></div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Hotel Asset Manager</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Commercial Due Diligence · HLA · CompSet Gravity · BP Review</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', margin: '16px 0 20px' }}>
          {MODULES.map(m => {
            const on = mod === m.id; const Ico = m.icon
            return (
              <button key={m.id} onClick={() => setMod(m.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', background: 'none', border: 'none', borderBottom: on ? '2px solid var(--accent)' : '2px solid transparent', color: on ? 'var(--accent)' : 'var(--text3)', fontWeight: on ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>
                <Ico size={15} strokeWidth={1.8} /> {m.label}
              </button>
            )
          })}
        </div>

        {/* ════════ MÓDULO 1: CONTRATOS ════════ */}
        {mod === 'contract' && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Revisión de contratos — HLA</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 16 }}>Sube el contrato de arrendamiento hotelero (PDF, Word o TXT). La IA rellena el template HLA marcando <b>TBC</b> si falta info, <b>duda</b> si hay ambigüedad y <b>Otros</b> para cláusulas relevantes fuera de la tabla.</p>

            <div className="va-card" style={{ padding: 20 }}>
              <div onClick={() => cInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]) }}
                style={{ border: '2px dashed var(--border2)', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer', background: 'var(--gray-lt)' }}>
                <input ref={cInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
                <UploadCloud size={30} strokeWidth={1.5} color="var(--text3)" />
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 8 }}>Arrastra el contrato aquí o haz clic para seleccionar</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>{['PDF', 'DOCX', 'TXT'].map(x => <span key={x} style={{ border: '1px solid var(--border)', borderRadius: 99, padding: '2px 10px', fontSize: 11, color: 'var(--text3)' }}>{x}</span>)}</div>
              </div>
              {cFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 14px', marginTop: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={17} /></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{cFile.name}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{cFile.size > 1e6 ? (cFile.size / 1e6).toFixed(1) + ' MB' : Math.round(cFile.size / 1024) + ' KB'}</div></div>
                  <button onClick={() => setCFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><X size={16} /></button>
                </div>
              )}
              <button className="ab-btn blue" disabled={!cFile || cLoading} onClick={analyzeContract} style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: 10, opacity: (!cFile || cLoading) ? .5 : 1, cursor: (!cFile || cLoading) ? 'not-allowed' : 'pointer' }}>
                <Brain size={15} strokeWidth={1.8} /> {cLoading ? 'Analizando con IA…' : 'Analizar contrato con IA'}
              </button>
              {cErr && <div style={errBox}><AlertTriangle size={13} style={{ verticalAlign: -2, marginRight: 5 }} />{cErr}</div>}
            </div>

            {cRows.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, margin: '16px 0' }}>
                  {[['Total campos', cStats.tot, 'var(--text)'], ['Extraídos', cStats.ok, 'var(--pdb-blue)'], ['Dudas', cStats.duda, 'var(--amber)'], ['TBC', cStats.tbc, 'var(--pdb-red)']].map(([l, n, c]) => (
                    <div key={l} style={{ background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 7, padding: 12, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 700, color: c }}>{n}</div><div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{l}</div></div>
                  ))}
                </div>
                <div className="dash-card">
                  <div className="dash-card-head">Resultado HLA — Hotel Lease Analysis<button className="ab-btn" onClick={exportContract} style={{ padding: '4px 10px', fontSize: 11 }}><Download size={12} /> CSV</button></div>
                  <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead><tr>{['Category', 'Subcategory', 'Contract summary', 'Page'].map(h => <th key={h} style={{ position: 'sticky', top: 0, background: 'var(--gray-lt)', padding: '8px 12px', textAlign: 'left', fontSize: 9.5, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {cRows.map((r, i) => {
                          const isO = (r.cat || '').startsWith('Otros')
                          const tbc = !r.summary || r.summary === 'TBC'
                          const duda = /^duda/i.test(r.summary || '')
                          const tag = isO ? 'tag-green' : tbc ? 'tag-red' : duda ? 'tag-amber' : 'tag-blue'
                          const txt = isO ? 'Otros' : tbc ? 'TBC' : duda ? 'Duda' : '✓'
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid var(--line-2)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{(r.cat || '').replace(/^Otros: /, '')}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{r.sub || '-'}</td>
                              <td style={{ padding: '8px 12px', lineHeight: 1.5 }} title={r.desc}><span className={`tag ${tag}`} style={{ marginRight: 5, fontSize: 9 }}>{txt}</span>{r.summary || 'TBC'}</td>
                              <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{r.page || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ════════ MÓDULO 2: COMPSET / GRAVITY ════════ */}
        {mod === 'score' && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Score de hoteles — CompSet / Gravity Analysis</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 16 }}>Define el hotel y su conjunto competitivo (sin límite de competidores) y hasta 4 POIs. La IA puntúa <b>Location · Product · Rating</b>; la <b>Condition</b> se calcula por el año de reforma. Se calcula la media del CompSet y el % del hotel vs la media.</p>

            <div className="va-card" style={{ padding: 16 }}>
              <div style={secLbl}>Puntos de interés (POI) · hasta 4</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {pois.map((p, i) => <input key={i} style={inp} value={p} onChange={e => setPois(prev => prev.map((x, j) => j === i ? e.target.value : x))} placeholder={`POI ${i + 1} — ej. Catedral de Toledo`} />)}
              </div>

              <div style={secLbl}>Conjunto competitivo</div>
              {cs.map((h, i) => (
                <div key={i} style={{ border: `1px solid ${h.subject ? 'var(--accent-bd)' : 'var(--border)'}`, background: h.subject ? 'var(--accent-lt)' : 'var(--gray-lt)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: h.subject ? 'var(--accent)' : 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h.subject ? '★ Hotel analizado' : `Competidor ${i}`}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {hoteles.length > 0 && (
                        <select value="" onChange={e => loadHotelFromPDB(i, e.target.value)} style={{ ...inp, width: 'auto', fontSize: 11, padding: '3px 6px', cursor: 'pointer' }}>
                          <option value="">Cargar de la PDB…</option>
                          {hoteles.map(x => <option key={x.id} value={x.id}>{x.nombre || x.ref}</option>)}
                        </select>
                      )}
                      {!h.subject && <button onClick={() => removeHotel(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pdb-red)' }} title="Eliminar"><Trash2 size={15} /></button>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div><label style={lbl}>Hotel</label><input style={inp} value={h.name} onChange={e => setHotel(i, 'name', e.target.value)} placeholder="Nombre" /></div>
                    <div><label style={lbl}>Dirección</label><input style={inp} value={h.address} onChange={e => setHotel(i, 'address', e.target.value)} /></div>
                    <div><label style={lbl}>Categoría</label><select style={{ ...inp, cursor: 'pointer' }} value={h.category} onChange={e => setHotel(i, 'category', e.target.value)}>{['5★', '4★', '3★', '2★', '1★'].map(o => <option key={o}>{o}</option>)}</select></div>
                    <div><label style={lbl}>Habitaciones</label><input style={inp} type="number" value={h.keys} onChange={e => setHotel(i, 'keys', e.target.value)} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 8 }}>
                    <div><label style={lbl}>Año reforma</label><input style={inp} type="number" value={h.refurb} onChange={e => setHotel(i, 'refurb', e.target.value)} placeholder="2019" /></div>
                    <div><label style={lbl}>Condition</label><input style={{ ...inp, background: 'var(--surface2)', color: 'var(--text3)' }} value={conditionFromRefurb(h.refurb) ?? '—'} readOnly /></div>
                    <div><label style={lbl}>Estrellas</label><select style={{ ...inp, cursor: 'pointer' }} value={h.stars} onChange={e => setHotel(i, 'stars', e.target.value)}>{['5', '4', '3', '2', '1'].map(o => <option key={o} value={o}>{o} ★</option>)}</select></div>
                    <div><label style={lbl}>Booking /10</label><input style={inp} type="number" step="0.1" value={h.booking} onChange={e => setHotel(i, 'booking', e.target.value)} /></div>
                    <div><label style={lbl}>TripAdvisor /5</label><input style={inp} type="number" step="0.1" value={h.trip} onChange={e => setHotel(i, 'trip', e.target.value)} /></div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {FACILITIES.map(f => {
                      const on = h.facs.includes(f)
                      return <span key={f} onClick={() => toggleFac(i, f)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, cursor: 'pointer', userSelect: 'none', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent)' : 'var(--surface)', color: on ? '#fff' : 'var(--text2)', fontWeight: on ? 700 : 500 }}>{f}</span>
                    })}
                  </div>
                </div>
              ))}
              <button className="ab-btn" onClick={addHotel} style={{ fontSize: 12 }}><Plus size={14} /> Añadir competidor</button>

              <button className="ab-btn blue" disabled={csLoading} onClick={genCompSet} style={{ width: '100%', justifyContent: 'center', marginTop: 14, padding: 10, opacity: csLoading ? .5 : 1, cursor: csLoading ? 'not-allowed' : 'pointer' }}>
                <BarChart3 size={15} strokeWidth={1.8} /> {csLoading ? 'Analizando CompSet con IA…' : 'Generar análisis CompSet con IA'}
              </button>
              {csErr && <div style={errBox}><AlertTriangle size={13} style={{ verticalAlign: -2, marginRight: 5 }} />{csErr}</div>}
            </div>

            {csResult && (
              <div className="dash-card" style={{ marginTop: 16 }}>
                <div className="dash-card-head">Gravity Analysis — CompSet<button className="ab-btn" onClick={exportCompSet} style={{ padding: '4px 10px', fontSize: 11 }}><Download size={12} /> CSV</button></div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 11.5, minWidth: '100%' }}>
                    <thead>
                      <tr>
                        {['Hotel', 'Cat.', 'Hab.', 'Reforma', 'Condition', ...csResult.poisF.map(p => `${p} (km)`), 'Location', 'Product', 'Rating', 'TOTAL'].map(h => (
                          <th key={h} style={{ position: 'sticky', top: 0, background: 'var(--gray-lt)', padding: '7px 10px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.03em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csResult.rows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--line-2)', background: r.subject ? 'var(--accent-lt)' : '#fff' }}>
                          <td style={{ padding: '7px 10px', fontWeight: r.subject ? 700 : 600, whiteSpace: 'nowrap' }}>{r.subject ? '★ ' : ''}{r.name || '—'}</td>
                          <td style={{ padding: '7px 10px' }}>{r.category}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)' }}>{r.keys || '—'}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)' }}>{r.refurb || '—'}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)' }}>{r.condition ?? '—'}</td>
                          {csResult.poisF.map((_, j) => <td key={j} style={{ padding: '7px 10px', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>{r.poiKm[j]?.km ?? '—'}</td>)}
                          <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--pdb-blue)' }}>{num3(r.scoreLocation)}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--pdb-green)' }}>{num3(r.scoreProduct)}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)', fontWeight: 700, color: '#7C3AED' }}>{num3(r.scoreRating)}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)', fontWeight: 800 }}>{num3(r.total)}</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--gray-lt)', fontWeight: 700 }}>
                        <td style={{ padding: '7px 10px' }} colSpan={4}>Relevant CS Average</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)' }}>{csResult.csAvg.condition.toFixed(1)}</td>
                        {csResult.poisF.map((_, j) => <td key={j} />)}
                        <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)' }}>{csResult.csAvg.scoreLocation.toFixed(1)}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)' }}>{csResult.csAvg.scoreProduct.toFixed(1)}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)' }}>{csResult.csAvg.scoreRating.toFixed(1)}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'var(--mono)' }}>{csResult.csAvg.total.toFixed(1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {csResult.pct != null && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', fontSize: 12.5 }}>
                    Hotel analizado vs media del CompSet: <b style={{ color: csResult.pct >= 0 ? 'var(--pdb-green)' : 'var(--pdb-red)' }}>{(csResult.pct * 100).toFixed(1)}%</b>
                  </div>
                )}
                {csResult.rows.some(r => r.comment) && (
                  <div style={{ padding: '4px 14px 14px' }}>
                    {csResult.rows.filter(r => r.comment).map((r, i) => (
                      <div key={i} style={{ fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                        <b style={{ minWidth: 160, color: 'var(--text2)' }}>{r.subject ? '★ ' : ''}{r.name}</b><span style={{ color: 'var(--text2)' }}>{r.comment}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ════════ MÓDULO 3: PRESENTACIÓN (BP REVIEW) ════════ */}
        {mod === 'slide' && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Presentación — BP Review · Datos históricos</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 16 }}>Carga el P&L (sube el Excel formato MASTER o edita a mano) y la IA genera el <b>titular ejecutivo</b> y los <b>comentarios por línea de ingreso</b> (≤20-25 palabras), listos para la slide.</p>

            <div className="va-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <button className="ab-btn" onClick={() => pInputRef.current?.click()} style={{ fontSize: 12 }}><UploadCloud size={14} /> Subir Excel del P&L</button>
                <input ref={pInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => e.target.files[0] && onPnlExcel(e.target.files[0])} />
                {pnlName && <span style={{ fontSize: 11, color: 'var(--text3)' }}><Database size={12} style={{ verticalAlign: -2 }} /> {pnlName} · ajusta los valores si hace falta</span>}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                  <thead><tr>{['Línea (k€ / ratio)', '2023A', '2024A', '2025A'].map(h => <th key={h} style={{ background: 'var(--gray-lt)', padding: '6px 10px', textAlign: 'left', fontSize: 9.5, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[...PNL_KPIS, ...PNL_REV].map(k => (
                      <tr key={k} style={{ borderBottom: '1px solid var(--line-2)' }}>
                        <td style={{ padding: '4px 10px', fontWeight: PNL_REV.includes(k) ? 700 : 500, color: PNL_REV.includes(k) ? 'var(--text)' : 'var(--text2)' }}>{k}</td>
                        {['y2023', 'y2024', 'y2025'].map(yr => (
                          <td key={yr} style={{ padding: '3px 6px' }}><input style={{ ...inp, fontFamily: 'var(--mono)', padding: '5px 7px' }} value={pnl[k][yr]} onChange={e => setPnlCell(k, yr, e.target.value)} placeholder="—" /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="ab-btn blue" disabled={pLoading} onClick={genBP} style={{ width: '100%', justifyContent: 'center', marginTop: 14, padding: 10, opacity: pLoading ? .5 : 1, cursor: pLoading ? 'not-allowed' : 'pointer' }}>
                <Lightbulb size={15} strokeWidth={1.8} /> {pLoading ? 'Generando con IA…' : 'Generar titular y comentarios con IA'}
              </button>
              {pErr && <div style={errBox}><AlertTriangle size={13} style={{ verticalAlign: -2, marginRight: 5 }} />{pErr}</div>}
            </div>

            {bp && (
              <>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', margin: '16px 0 10px' }}><button className="ab-btn" onClick={() => window.print()}><Download size={13} /> Exportar PDF</button></div>
                <div className="va-card" style={{ padding: 18, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)', marginBottom: 8 }}>Slide · Datos históricos — Titular ejecutivo</div>
                  <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, color: 'var(--text)' }}>{bp.titular}</div>
                </div>
                <div className="va-card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)', marginBottom: 8 }}>Comentarios por línea de ingresos</div>
                  {PNL_REV.map(k => (
                    <div key={k} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                      <b style={{ minWidth: 110, color: 'var(--text2)' }}>{k}</b>
                      <span style={{ color: 'var(--text2)', lineHeight: 1.55 }}>{bp.comentarios?.[k] || '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}
