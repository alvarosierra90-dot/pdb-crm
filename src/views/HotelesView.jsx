import { useState, useRef, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  FileText, Star, Presentation, Download, Brain, BarChart3, Lightbulb,
  UploadCloud, X, Building2, AlertTriangle, Database,
} from 'lucide-react'

/* ============================================================================
 * Hoteles · Hotel Asset Manager — nativo PDB
 * Reescritura del tool standalone usando el diseño de la PDB y nuestro proxy
 * serverless (/api/anthropic). 3 módulos: Revisión de contratos (HLA),
 * Score de hoteles (Gravity) y Presentación. El Score puede precargar datos de
 * un Hotel ya existente en la PDB (activos uso='Hotel').
 * ========================================================================== */

const AI_MODEL = 'claude-sonnet-4-6'

// ── Campos del template HLA ──
const HLA_FIELDS = [
  { cat: 'Signature date', sub: '-', desc: 'Contract execution date' },
  { cat: 'Purpose of the contract', sub: '-', desc: 'Purpose of the contract' },
  { cat: 'Lessee', sub: '-', desc: 'Name and NIF of lessee' },
  { cat: 'Lessor', sub: '-', desc: 'Name and NIF of lessor' },
  { cat: 'Guarantor', sub: '-', desc: 'Guarantor details if any' },
  { cat: 'Duration', sub: 'Full Term', desc: 'Total contract term' },
  { cat: 'Duration', sub: 'Mandatory Period', desc: 'Minimum mandatory term' },
  { cat: 'Renewal', sub: 'Rights', desc: 'Renewal terms' },
  { cat: 'Renewal', sub: 'Conditions', desc: 'Renewal conditions for both parties' },
  { cat: 'Break clauses', sub: '-', desc: 'Break clauses; No if none' },
  { cat: 'Performance Clause', sub: '-', desc: 'Performance clauses; No if none' },
  { cat: 'Grounds for Termination', sub: '-', desc: 'Grounds for termination' },
  { cat: 'GMI', sub: 'Quantum / Calculation', desc: 'GMI amount or calculation method' },
  { cat: 'GMI', sub: 'Update', desc: 'Annual adjustments to GMI' },
  { cat: 'GMI', sub: 'Payment terms', desc: 'GMI payment terms' },
  { cat: 'Variable rent', sub: 'Quantum / Calculation', desc: 'Variable rent calculation' },
  { cat: 'Variable rent', sub: 'Update', desc: 'Variable rent adjustments' },
  { cat: 'Variable rent', sub: 'Payment terms', desc: 'Variable rent payment terms' },
  { cat: 'FF&E Reserve', sub: 'Quantum / Calculation', desc: 'FF&E Reserve amount or method' },
  { cat: 'FF&E Reserve', sub: 'Update', desc: 'FF&E Reserve adjustments' },
  { cat: 'R&M', sub: 'Routine / Structural', desc: 'Repair and maintenance obligations' },
  { cat: 'R&M', sub: 'CAPEX', desc: 'CAPEX and investment obligations' },
  { cat: 'Licences and Permits', sub: '-', desc: 'Licences and permits' },
  { cat: 'Insurances', sub: 'Lessee', desc: 'Lessee insurance obligations' },
  { cat: 'Insurances', sub: 'Lessor', desc: 'Lessor insurance obligations' },
  { cat: 'Staff', sub: '-', desc: 'Staff and personnel provisions' },
  { cat: 'Taxes', sub: 'Lessee', desc: 'Lessee tax obligations' },
  { cat: 'Taxes', sub: 'Lessor', desc: 'Lessor tax obligations' },
  { cat: 'Subletting and Assignment', sub: '-', desc: 'Subletting and assignment' },
  { cat: 'Security Deposit', sub: 'Cash', desc: 'Cash security deposit' },
  { cat: 'Security Deposit', sub: 'Bank Guarantee', desc: 'Bank guarantee' },
  { cat: 'Security Deposit', sub: 'Corporate Guarantee', desc: 'Corporate guarantee' },
  { cat: 'Return of the Property', sub: '-', desc: 'Lessee obligations on termination' },
  { cat: 'Jurisdiction', sub: '-', desc: 'Applicable jurisdiction' },
  { cat: 'Governing Law', sub: '-', desc: 'Governing law' },
  { cat: 'Access to hotel', sub: '-', desc: 'Lessor access terms' },
  { cat: 'Lessor representative', sub: '-', desc: 'Lessor representative' },
  { cat: 'Lessee information', sub: '-', desc: 'Lessee reporting obligations' },
]

const FACILITIES = ['F&B', 'Meeting', 'Auditorium', 'Spa', 'Pool', 'Gym', 'Parking']

// ── Llamada al proxy serverless de la PDB ──
async function callAI(messages, maxTokens) {
  const res = await fetch('/api/anthropic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: AI_MODEL, max_tokens: maxTokens, messages }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.error?.message || `Error ${res.status}`)
  }
  const d = await res.json()
  return (d.content || []).map(b => b.text || '').join('')
}
function parseJSON(raw) { return JSON.parse((raw || '').replace(/```json|```/g, '').trim()) }

function dlCSV(rows, name) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const b = new Blob([csv], { type: 'text/csv' })
  const u = URL.createObjectURL(b)
  const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u)
}

// ── Estilos compartidos (tokens PDB) ──
const inp = { width: '100%', padding: '8px 10px', border: '1px solid var(--border2)', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text1)', boxSizing: 'border-box', outline: 'none' }
const lbl = { display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }
const secLbl = { fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '16px 0 8px', paddingBottom: 6, borderBottom: '1px solid var(--border)' }

export default function HotelesView() {
  const [mod, setMod] = useState('contract')

  // ── Estado módulo Contratos ──
  const [cFile, setCFile] = useState(null)   // { name, size, b64, mime }
  const [cRows, setCRows] = useState([])
  const [cLoading, setCLoading] = useState(false)
  const [cErr, setCErr] = useState('')
  const cInputRef = useRef(null)

  // ── Estado módulo Score ──
  const [form, setForm] = useState({ name: '', addr: '', cat: '4★', keys: '', ref: '', stars: '4', book: '', trip: '', web: '' })
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const [pois, setPois] = useState(['', '', '', ''])
  const [facs, setFacs] = useState([])
  const [score, setScore] = useState(null)
  const [sLoading, setSLoading] = useState(false)
  const [sErr, setSErr] = useState('')
  const [hoteles, setHoteles] = useState([])

  // Carga de hoteles de la PDB (activos uso = Hotel) para precargar el formulario
  useEffect(() => {
    let cancel = false
    supabase.from('activos').select('id,ref,nombre,direccion,calidad,anno_rehabilitacion,metricas')
      .eq('uso', 'Hotel').order('nombre')
      .then(({ data }) => { if (!cancel) setHoteles(data || []) })
    return () => { cancel = true }
  }, [])

  const loadHotelFromPDB = (id) => {
    const h = hoteles.find(x => x.id === id)
    if (!h) return
    const m = h.metricas || {}
    const stars = (h.calidad || '').match(/(\d)/)?.[1] || form.stars
    setForm(p => ({
      ...p,
      name: h.nombre || '',
      addr: h.direccion || '',
      cat: /[1-5]★/.test(h.calidad || '') ? h.calidad : p.cat,
      keys: m.n_habitaciones != null ? String(m.n_habitaciones) : '',
      ref: h.anno_rehabilitacion ? String(h.anno_rehabilitacion) : '',
      stars,
    }))
  }

  // ─────────────────────── MÓDULO 1: CONTRATOS ───────────────────────
  const onFile = (f) => {
    if (!f || f.size > 10 * 1024 * 1024) return
    const n = f.name.toLowerCase()
    const kind = n.endsWith('.pdf') ? 'pdf' : n.endsWith('.docx') ? 'docx' : 'text'
    setCErr(''); setCRows([])
    if (kind === 'pdf') {
      const r = new FileReader()
      r.onload = e => setCFile({ name: f.name, size: f.size, kind, b64: e.target.result.split(',')[1] })
      r.readAsDataURL(f)
    } else {
      // .docx / .txt → guardamos el File; el texto se extrae al analizar
      setCFile({ name: f.name, size: f.size, kind, file: f })
    }
  }

  const analyzeContract = async () => {
    if (!cFile) return
    setCErr(''); setCRows([]); setCLoading(true)
    const flds = HLA_FIELDS.map((f, i) => `${i + 1}. Category:"${f.cat}" Sub:"${f.sub}" Extract:${f.desc}`).join('\n')
    const prompt = `You are a hotel asset manager. Analyze this hotel lease contract and extract each field.
For each: "summary" = concise English (2-3 sentences). "TBC" if not found. Start with "DUDA: " if ambiguous. "page" = clause reference.
Add up to 5 "otros" for important clauses not in the list (pre-emption, confidentiality, force majeure, etc.).
Return ONLY valid JSON, no markdown fences:
{"fields":[{"id":1,"cat":"...","sub":"...","summary":"...","page":"..."}],"otros":[{"cat":"Otros: ...","sub":"-","summary":"...","page":"..."}]}
Fields:\n${flds}`
    try {
      let block
      if (cFile.kind === 'pdf') {
        block = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: cFile.b64 } }
      } else if (cFile.kind === 'docx') {
        const mod = await import('mammoth/mammoth.browser.js')
        const mammoth = mod.default || mod
        const { value } = await mammoth.extractRawText({ arrayBuffer: await cFile.file.arrayBuffer() })
        if (!value || !value.trim()) throw new Error('No se pudo extraer texto del documento Word.')
        block = { type: 'text', text: value }
      } else {
        block = { type: 'text', text: await cFile.file.text() }
      }
      const raw = await callAI([{ role: 'user', content: [block, { type: 'text', text: prompt }] }], 4000)
      const parsed = parseJSON(raw)
      setCRows([...(parsed.fields || []), ...(parsed.otros || [])])
    } catch (e) {
      setCErr('Error al analizar el contrato: ' + e.message)
    } finally { setCLoading(false) }
  }

  const cStats = useMemo(() => {
    const tot = cRows.length
    const tbc = cRows.filter(r => !r.summary || r.summary === 'TBC').length
    const duda = cRows.filter(r => (r.summary || '').startsWith('DUDA:')).length
    return { tot, tbc, duda, ok: tot - tbc - duda }
  }, [cRows])

  const exportContract = () => dlCSV(
    [['Category', 'Subcategory', 'Summary', 'Clause'], ...cRows.map(r => [r.cat, r.sub, r.summary, r.page])],
    'HLA_export.csv')

  // ─────────────────────── MÓDULO 2: SCORE ───────────────────────
  const genScore = async () => {
    setSErr(''); setScore(null); setSLoading(true)
    const name = form.name.trim() || 'Hotel analizado'
    const refY = parseInt(form.ref) || null
    const cond = (() => { if (!refY) return 3; const y = new Date().getFullYear() - refY; return y <= 1 ? 5 : y <= 3 ? 4.5 : y <= 5 ? 4 : y <= 7 ? 3.5 : y <= 9 ? 3 : y <= 12 ? 2.5 : y <= 15 ? 2 : 1 })()
    const poisF = pois.map(p => p.trim()).filter(Boolean)
    const prompt = `You are a hotel commercial due diligence expert (Gravity Analysis framework).
Hotel: ${name} | ${form.addr} | ${form.cat} | ${form.keys || '—'} keys
Facilities: ${facs.length ? facs.join(', ') : 'none indicated'}
Booking: ${form.book || 'N/A'}/10 | TripAdvisor: ${form.trip || 'N/A'}/5
Last refurb: ${refY || 'N/A'} | Condition score (auto-calculated): ${cond}/5
POIs: ${poisF.length ? poisF.join(', ') : 'none provided'}
${form.web ? 'Web: ' + form.web : ''}
Return ONLY valid JSON, no markdown:
{"hotelName":"${name}","scores":{"location":<0-5>,"product":<0-5>,"condition":${cond},"rating":<0-5>,"total":<avg 1dec>},"poiDistances":[${poisF.map(p => `{"poi":"${p}","km":"<estimate>","note":"<brief>"}`).join(',')}],"facilitiesNote":"<2 sentences>","ratingNote":"<1 sentence>","insights":"• point1\n• point2\n• point3","grade":"Strong|Good|Average|Weak"}`
    try {
      const raw = await callAI([{ role: 'user', content: prompt }], 1200)
      setScore(parseJSON(raw))
    } catch (e) {
      setSErr('Error: ' + e.message)
    } finally { setSLoading(false) }
  }

  const exportScore = () => {
    const s = score.scores || {}
    dlCSV([['Hotel', 'Location', 'Product', 'Condition', 'Rating', 'Total', 'Grade'],
      [score.hotelName, s.location, s.product, s.condition, s.rating, s.total, score.grade]], 'Score_export.csv')
  }

  const gradeColor = { Strong: 'var(--pdb-blue)', Good: 'var(--pdb-green)', Average: 'var(--amber)', Weak: 'var(--pdb-red)' }
  const breakdown = [
    { l: 'Location', k: 'location', c: 'var(--pdb-blue)' },
    { l: 'Product', k: 'product', c: 'var(--pdb-green)' },
    { l: 'Condition', k: 'condition', c: 'var(--amber)' },
    { l: 'Rating', k: 'rating', c: '#7C3AED' },
  ]

  const hasData = cRows.length > 0 || !!score

  const MODULES = [
    { id: 'contract', label: 'Revisión de contratos', icon: FileText },
    { id: 'score', label: 'Score de hoteles', icon: Star },
    { id: 'slide', label: 'Presentación', icon: Presentation },
  ]

  return (
    <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 28px' }}>

        {/* Cabecera + sub-nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={18} strokeWidth={1.9} /></div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Hotel Asset Manager</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Commercial Due Diligence · IA sobre el proxy de la PDB</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', margin: '16px 0 20px' }}>
          {MODULES.map(m => {
            const on = mod === m.id
            const Ico = m.icon
            return (
              <button key={m.id} onClick={() => setMod(m.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', background: 'none', border: 'none', borderBottom: on ? '2px solid var(--accent)' : '2px solid transparent', color: on ? 'var(--accent)' : 'var(--text3)', fontWeight: on ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>
                <Ico size={15} strokeWidth={1.8} /> {m.label}
              </button>
            )
          })}
        </div>

        {/* ───────── MÓDULO 1: CONTRATOS ───────── */}
        {mod === 'contract' && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Revisión de contratos — HLA</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 16 }}>Sube el contrato de arrendamiento hotelero. La IA extrae los campos del template HLA, marcando <b>TBC</b> cuando falta info y <b>DUDA</b> cuando hay ambigüedad.</p>

            <div className="va-card" style={{ padding: 20 }}>
              <div onClick={() => cInputRef.current?.click()}
                onDragOver={e => { e.preventDefault() }}
                onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]) }}
                style={{ border: '2px dashed var(--border2)', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer', background: 'var(--gray-lt)' }}>
                <input ref={cInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
                <UploadCloud size={30} strokeWidth={1.5} color="var(--text3)" />
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 8 }}>Arrastra el contrato aquí o haz clic para seleccionar</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                  {['PDF', 'DOCX', 'TXT'].map(x => <span key={x} style={{ border: '1px solid var(--border)', borderRadius: 99, padding: '2px 10px', fontSize: 11, color: 'var(--text3)' }}>{x}</span>)}
                </div>
              </div>

              {cFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 14px', marginTop: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={17} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{cFile.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{cFile.size > 1e6 ? (cFile.size / 1e6).toFixed(1) + ' MB' : Math.round(cFile.size / 1024) + ' KB'}</div>
                  </div>
                  <button onClick={() => setCFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><X size={16} /></button>
                </div>
              )}

              <button className="ab-btn blue" disabled={!cFile || cLoading} onClick={analyzeContract}
                style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '10px', opacity: (!cFile || cLoading) ? .5 : 1, cursor: (!cFile || cLoading) ? 'not-allowed' : 'pointer' }}>
                <Brain size={15} strokeWidth={1.8} /> {cLoading ? 'Analizando con IA…' : 'Analizar contrato con IA'}
              </button>
              {cErr && <div style={{ background: 'var(--red-lt)', border: '1px solid #f3b4b4', borderRadius: 7, padding: '10px 14px', marginTop: 10, fontSize: 12, color: 'var(--pdb-red)' }}><AlertTriangle size={13} style={{ verticalAlign: -2, marginRight: 5 }} />{cErr}</div>}
            </div>

            {cRows.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, margin: '16px 0' }}>
                  {[['Total campos', cStats.tot, 'var(--text)'], ['Extraídos', cStats.ok, 'var(--pdb-blue)'], ['Dudas', cStats.duda, 'var(--amber)'], ['TBC', cStats.tbc, 'var(--pdb-red)']].map(([l, n, c]) => (
                    <div key={l} style={{ background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 7, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{n}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div className="dash-card">
                  <div className="dash-card-head">Resultado HLA — Hotel Lease Analysis
                    <button className="ab-btn" onClick={exportContract} style={{ padding: '4px 10px', fontSize: 11 }}><Download size={12} /> CSV</button>
                  </div>
                  <div style={{ maxHeight: 460, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead><tr>{['Categoría', 'Subcategoría', 'Resumen', 'Cláusula'].map(h => <th key={h} style={{ position: 'sticky', top: 0, background: 'var(--gray-lt)', padding: '8px 12px', textAlign: 'left', fontSize: 9.5, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {cRows.map((r, i) => {
                          const isO = (r.cat || '').startsWith('Otros')
                          const tbc = !r.summary || r.summary === 'TBC'
                          const duda = (r.summary || '').startsWith('DUDA:')
                          const tag = isO ? 'tag-green' : tbc ? 'tag-red' : duda ? 'tag-amber' : 'tag-blue'
                          const txt = isO ? 'Otros' : tbc ? 'TBC' : duda ? 'DUDA' : '✓'
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid var(--line-2)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{(r.cat || '').replace(/^Otros: /, '')}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{r.sub || '-'}</td>
                              <td style={{ padding: '8px 12px', lineHeight: 1.5 }}><span className={`tag ${tag}`} style={{ marginRight: 5, fontSize: 9 }}>{txt}</span>{r.summary || 'TBC'}</td>
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

        {/* ───────── MÓDULO 2: SCORE ───────── */}
        {mod === 'score' && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Score de hoteles — Gravity Analysis</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 16 }}>Introduce los datos del hotel (o cárgalos desde la PDB). La IA genera el score CompSet: Location · Product · Condition · Rating.</p>

            <div className="va-card" style={{ padding: 20 }}>
              {hoteles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Database size={14} color="var(--accent)" />
                  <select onChange={e => loadHotelFromPDB(e.target.value)} value="" style={{ ...inp, width: 'auto', cursor: 'pointer', flex: 1, maxWidth: 360 }}>
                    <option value="">Cargar un hotel de la PDB…</option>
                    {hoteles.map(h => <option key={h.id} value={h.id}>{h.nombre || h.ref}</option>)}
                  </select>
                </div>
              )}

              <div style={{ ...secLbl, marginTop: 8 }}>Hotel analizado</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={lbl}>Nombre del hotel</label><input style={inp} value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Hotel Beatriz Toledo" /></div>
                <div><label style={lbl}>Dirección</label><input style={inp} value={form.addr} onChange={e => setF('addr', e.target.value)} placeholder="Carretera CM-40, Toledo" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                <div><label style={lbl}>Categoría</label><select style={{ ...inp, cursor: 'pointer' }} value={form.cat} onChange={e => setF('cat', e.target.value)}>{['4★', '5★', '3★'].map(o => <option key={o}>{o}</option>)}</select></div>
                <div><label style={lbl}>Habitaciones</label><input style={inp} type="number" value={form.keys} onChange={e => setF('keys', e.target.value)} placeholder="180" /></div>
                <div><label style={lbl}>Año última reforma</label><input style={inp} type="number" value={form.ref} onChange={e => setF('ref', e.target.value)} placeholder="2019" /></div>
                <div><label style={lbl}>Estrellas</label><select style={{ ...inp, cursor: 'pointer' }} value={form.stars} onChange={e => setF('stars', e.target.value)}>{['4', '5', '3'].map(o => <option key={o} value={o}>{o} ★</option>)}</select></div>
              </div>

              <div style={secLbl}>Puntos de interés (POI)</div>
              {pois.map((p, i) => (
                <input key={i} style={{ ...inp, marginBottom: 8 }} value={p}
                  onChange={e => setPois(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                  placeholder={`POI ${i + 1} — ej. Catedral de Toledo`} />
              ))}

              <div style={secLbl}>Facilities del hotel</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {FACILITIES.map(fName => {
                  const on = facs.includes(fName)
                  return (
                    <div key={fName} onClick={() => setFacs(p => on ? p.filter(x => x !== fName) : [...p, fName])}
                      style={{ padding: '10px 8px', borderRadius: 7, textAlign: 'center', cursor: 'pointer', userSelect: 'none', fontSize: 11.5, fontWeight: 600, border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-lt)' : 'var(--gray-lt)', color: on ? 'var(--accent)' : 'var(--text2)' }}>{fName}</div>
                  )
                })}
              </div>

              <div style={secLbl}>Reputación online</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                <div><label style={lbl}>Booking.com (0–10)</label><input style={inp} type="number" step="0.1" value={form.book} onChange={e => setF('book', e.target.value)} placeholder="8.5" /></div>
                <div><label style={lbl}>TripAdvisor (0–5)</label><input style={inp} type="number" step="0.1" value={form.trip} onChange={e => setF('trip', e.target.value)} placeholder="4.2" /></div>
                <div><label style={lbl}>Web oficial</label><input style={inp} type="url" value={form.web} onChange={e => setF('web', e.target.value)} placeholder="https://…" /></div>
              </div>

              <button className="ab-btn blue" disabled={sLoading} onClick={genScore}
                style={{ width: '100%', justifyContent: 'center', marginTop: 14, padding: '10px', opacity: sLoading ? .5 : 1, cursor: sLoading ? 'not-allowed' : 'pointer' }}>
                <BarChart3 size={15} strokeWidth={1.8} /> {sLoading ? 'Analizando con IA…' : 'Generar score con IA'}
              </button>
              {sErr && <div style={{ background: 'var(--red-lt)', border: '1px solid #f3b4b4', borderRadius: 7, padding: '10px 14px', marginTop: 10, fontSize: 12, color: 'var(--pdb-red)' }}><AlertTriangle size={13} style={{ verticalAlign: -2, marginRight: 5 }} />{sErr}</div>}
            </div>

            {score && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 12, margin: '16px 0 12px' }}>
                  <div className="va-card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 50, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{parseFloat(score.scores?.total || 0).toFixed(1)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Score global / 5.0</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8, color: gradeColor[score.grade] || 'var(--text3)' }}>{score.grade || ''}</div>
                  </div>
                  <div className="va-card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Desglose por categoría</div>
                    {breakdown.map(x => {
                      const v = parseFloat(score.scores?.[x.k] || 0)
                      return (
                        <div key={x.k} style={{ display: 'flex', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, color: 'var(--text2)', width: 80 }}>{x.l}</span>
                          <div style={{ flex: 1, margin: '0 12px', background: 'var(--gray-lt)', borderRadius: 99, height: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <div style={{ height: '100%', width: `${v / 5 * 100}%`, background: x.c, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{v.toFixed(1)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="va-card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={14} color="var(--accent)" /> Análisis IA — Asset Manager</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
                    {(score.poiDistances || []).length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>POI Distances</div>
                        {score.poiDistances.map((p, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}><span>{p.poi}</span><b>{p.km}</b></div>)}
                      </div>
                    )}
                    {score.facilitiesNote && <p style={{ marginBottom: 6 }}><b>Facilities:</b> {score.facilitiesNote}</p>}
                    {score.ratingNote && <p style={{ marginBottom: 6 }}><b>Reputación:</b> {score.ratingNote}</p>}
                    {(score.insights || '').split('\n').filter(Boolean).map((l, i) => <p key={i} style={{ marginBottom: 4 }}>{l}</p>)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginTop: 10 }}>
                  <button className="ab-btn" onClick={exportScore} style={{ fontSize: 12 }}><Download size={13} /> Exportar CSV</button>
                </div>
              </>
            )}
          </>
        )}

        {/* ───────── MÓDULO 3: PRESENTACIÓN ───────── */}
        {mod === 'slide' && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Presentación ejecutiva</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 16 }}>Generada con los datos del contrato y del score. Lista para presentar al cliente.</p>
            {!hasData ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
                <Presentation size={38} strokeWidth={1.4} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', margin: '12px 0 6px' }}>Completa primero los módulos anteriores</h3>
                <p style={{ fontSize: 12, lineHeight: 1.6 }}>Analiza un contrato o genera un score.<br />La presentación se generará automáticamente con los datos disponibles.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 16 }}>
                  <button className="ab-btn" onClick={() => window.print()}><Download size={13} /> Exportar PDF</button>
                </div>
                <div className="va-card" style={{ padding: 16, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)', marginBottom: 6 }}>Slide 1 — Portada</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{score ? score.hotelName : (form.name || 'Hotel')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Commercial Due Diligence Report · {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</div>
                </div>
                {score && (
                  <div className="va-card" style={{ padding: 16, marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)', marginBottom: 6 }}>Slide 2 — Gravity Score</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Score global: <span style={{ color: 'var(--accent)' }}>{parseFloat(score.scores?.total || 0).toFixed(1)}/5.0</span> — {score.grade || ''}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                      {breakdown.map(x => (
                        <div key={x.k} style={{ textAlign: 'center', padding: 10, background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 7 }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: x.c }}>{parseFloat(score.scores?.[x.k] || 0).toFixed(1)}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {cRows.length > 0 && (
                  <div className="va-card" style={{ padding: 16, marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)', marginBottom: 6 }}>Slide 3 — HLA Key Highlights</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Key Contract Clauses</div>
                    {cRows.filter(r => r.summary && r.summary !== 'TBC' && !(r.summary || '').startsWith('DUDA:')).slice(0, 6).map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 600, minWidth: 140, color: 'var(--text2)' }}>{r.cat}</span>
                        <span>{(r.summary || '').slice(0, 100)}{(r.summary || '').length > 100 ? '…' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}
