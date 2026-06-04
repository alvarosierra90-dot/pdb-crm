import { useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/dossier.css'

/* ============================================================
   Generador de Dossier (fichas + product book)
   Modalidad de Marketing · estilo premium aislado (.dossier-skin).
   - Config → Activo → Vista previa
   - Datos manuales + prefill desde activos de la PDB
   - Export real PDF / PPT (html2canvas + jsPDF / pptxgenjs)
   ============================================================ */

const SAVILLS_CONTACT = 'Álvaro Sierra · agenciamadrid@savills.es · +34 91 319 13 14'

const CONFIG_GROUPS = {
  tipo: {
    num: '01', label: 'TIPO DE OUTPUT', cols: 2,
    options: [
      { value: 'ficha', title: 'Ficha Comercial', desc: 'Dossier individual de un activo. PDF de 4-8 páginas. Para envíos puntuales y respuestas a requerimientos.' },
      { value: 'book',  title: 'Product Book',    desc: 'Selección de varios activos en un único documento. Incluye índice, comparables y mapa de zona.' },
    ],
  },
  linea: {
    num: '02', label: 'LÍNEA DE NEGOCIO', cols: 3,
    options: [
      { value: 'oficinas',   title: 'Oficinas',              desc: 'Edificios corporativos · plantas de oficina · sedes premium. Madrid prime + descentralizado.' },
      { value: 'industrial', title: 'Industrial / Logístico', desc: 'Naves logísticas · parques empresariales · last-mile · centros de distribución.' },
      { value: 'retail',   title: 'Retail',              desc: 'Locales high street · sucursales · calles comerciales prime.', soon: true },
      { value: 'cc',       title: 'Centros comerciales', desc: 'Espacios dentro de CC · operadores ancla · F&B · entertainment.', soon: true },
      { value: 'hoteles',  title: 'Hoteles',             desc: 'Operadores hoteleros · lease & management · activos en explotación.', soon: true },
      { value: 'resi',     title: 'Residencial',         desc: 'BTR · multifamily · build-to-sell · co-living.', soon: true },
    ],
  },
  delegacion: {
    num: '03', label: 'DELEGACIÓN', cols: 4,
    options: [
      { value: 'madrid',    title: 'Madrid',    desc: 'Mercado piloto. Catálogo completo de zonas y comparables.' },
      { value: 'barcelona', title: 'Barcelona', desc: '22@ · Eje Diagonal · Plaça d\'Europa · Sant Cugat.' },
      { value: 'malaga',    title: 'Málaga',    desc: 'Tech-hub creciente. Soho · Limonar · PT Andalucía.' },
      { value: 'valencia',  title: 'Valencia',  desc: 'Centro · Cortes · Beniferri · Benimaclet.' },
    ],
  },
  equipo: {
    num: '04', label: 'EQUIPO / SERVICIO', cols: 2,
    options: [
      { value: 'leasing', title: 'Leasing', desc: 'Comercialización · arrendamiento. Landlord rep o Tenant rep. Single / multi / dual track.', badge: { cls: 'badge-available', txt: 'Disponible' } },
      { value: 'cm', title: 'Capital Markets', desc: 'Inversión · transacciones. Sell-side, buy-side, forward funding, sale & leaseback.', badge: { cls: 'badge-dev', txt: 'En desarrollo' }, soon: true },
    ],
  },
  idioma: {
    num: '05', label: 'IDIOMA DEL DOSSIER', cols: 3,
    options: [
      { value: 'es', title: 'Español',  desc: 'Estándar. Para clientes nacionales y equipo local.' },
      { value: 'en', title: 'English',  desc: 'Para cuentas internacionales, REITs y fondos extranjeros.' },
      { value: 'bi', title: 'Bilingüe', desc: 'Dos versiones simultáneas en el mismo PDF.' },
    ],
  },
}

const KPI_TEMPLATES = {
  oficinas: [
    { id: 'sba', label: 'Superficie total alquilable', unit: 'm²', placeholder: '17.715' },
    { id: 'plantas', label: 'Composición', unit: '', placeholder: 'PB + 6 + Cubierta + 3 sótanos' },
    { id: 'parking', label: 'Plazas de parking', unit: '', placeholder: '239' },
    { id: 'ratio', label: 'Ratio de ocupación', unit: '', placeholder: '1:7' },
    { id: 'altura', label: 'Altura libre', unit: 'm', placeholder: '2,70' },
    { id: 'cert', label: 'Certificaciones', unit: '', placeholder: 'LEED Oro · WELL Oro' },
    { id: 'amenities', label: 'Amenities (separados por coma)', unit: '', placeholder: 'Restaurante, Gimnasio, Terraza, Business Center' },
    { id: 'parkingev', label: 'Plazas vehículo eléctrico', unit: '', placeholder: '18' },
  ],
  industrial: [
    { id: 'sba', label: 'Superficie construida', unit: 'm²', placeholder: '38.763' },
    { id: 'parcela', label: 'Suelo total', unit: 'm²', placeholder: '64.018' },
    { id: 'naves', label: 'Nº edificios / naves', unit: '', placeholder: '4' },
    { id: 'altura', label: 'Altura libre máxima', unit: 'm', placeholder: '11,5' },
    { id: 'maniobra', label: 'Espacio de maniobra', unit: 'm', placeholder: '35' },
    { id: 'fotovoltaica', label: 'Capacidad fotovoltaica', unit: 'MW', placeholder: '3,0' },
    { id: 'muelles', label: 'Nº muelles de carga', unit: '', placeholder: '33' },
    { id: 'cert', label: 'Certificaciones', unit: '', placeholder: 'LEED Platinum · WELL Ready' },
  ],
}

const LINEA_LABEL = { oficinas: 'Oficinas', industrial: 'Industrial / Logístico' }
const emptyAsset = () => ({
  nombre: '', direccion: '', zona: '', propiedad: '', disponibilidad: '',
  transportes: '', empresas: '', pitch: '', specs: '', sost: '', cocom: '',
  kpis: {}, photos: [], plans: [],
})

export default function DossierGenerator() {
  const [step, setStep] = useState(0)
  const [config, setConfig] = useState({ tipo: null, linea: null, delegacion: null, equipo: null, idioma: null })
  const [stage, setStage] = useState('form')          // 'list' | 'form' (solo relevante en book)
  const [assets, setAssets] = useState([])            // product book
  const [editingIdx, setEditingIdx] = useState(null)  // índice en edición (book), null = nuevo
  const [draft, setDraft] = useState(emptyAsset())    // activo en edición
  const [previewAssets, setPreviewAssets] = useState([]) // lo que se muestra/exporta en preview
  const [exporting, setExporting] = useState(null)    // 'pdf' | 'ppt' | null

  // PDB loader
  const [pdbQuery, setPdbQuery] = useState('')
  const [pdbResults, setPdbResults] = useState([])
  const [pdbOpen, setPdbOpen] = useState(false)

  const frameRef = useRef(null)

  const configComplete = config.tipo && config.linea && config.delegacion && config.equipo && config.idioma
  const isBook = config.tipo === 'book'
  const linea = config.linea || 'oficinas'
  const kpiTpl = KPI_TEMPLATES[linea] || KPI_TEMPLATES.oficinas

  /* ---------- helpers ---------- */
  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  const setKpi   = (id, v) => setDraft(d => ({ ...d, kpis: { ...d.kpis, [id]: v } }))

  const selectConfig = (group, value) => {
    setConfig(c => ({ ...c, [group]: value }))
  }

  const goStep = (n) => { setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const startWizard = () => {
    goStep(1)
    if (isBook) { setStage('list') } else { setStage('form'); setDraft(emptyAsset()); setEditingIdx(null) }
  }

  /* ---------- uploads (a dataURL para preview + export) ---------- */
  const handleUpload = (fileList, type) => {
    const files = Array.from(fileList || [])
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setDraft(d => ({ ...d, [type]: [...(d[type] || []), { name: f.name, url: e.target.result }] }))
      reader.readAsDataURL(f)
    })
  }
  const removeFile = (type, idx) => setDraft(d => ({ ...d, [type]: d[type].filter((_, i) => i !== idx) }))

  /* ---------- PDB prefill ---------- */
  const searchPdb = useCallback(async (q) => {
    setPdbQuery(q)
    if (!q || q.trim().length < 2) { setPdbResults([]); return }
    const term = q.trim()
    const { data } = await supabase
      .from('activos')
      .select('id, ref, nombre, direccion, zona, subzona, ciudad, uso, sba, n_edificios, leed')
      .or(`nombre.ilike.%${term}%,ref.ilike.%${term}%`)
      .order('nombre')
      .limit(8)
    setPdbResults(data || [])
  }, [])

  const loadFromPdb = (a) => {
    setDraft(d => {
      const kpis = { ...d.kpis }
      if (a.sba != null) kpis.sba = String(a.sba)
      if (a.leed) kpis.cert = a.leed
      if (a.n_edificios != null && linea === 'industrial') kpis.naves = String(a.n_edificios)
      return {
        ...d,
        nombre: a.nombre || d.nombre,
        direccion: [a.direccion, a.ciudad].filter(Boolean).join(', ') || d.direccion,
        zona: a.zona || a.subzona || d.zona,
        kpis,
      }
    })
    setPdbOpen(false)
    setPdbQuery('')
    setPdbResults([])
  }

  /* ---------- book actions ---------- */
  const addNewAsset = () => { setDraft(emptyAsset()); setEditingIdx(null); setStage('form') }
  const editAsset = (i) => { setDraft({ ...assets[i] }); setEditingIdx(i); setStage('form') }
  const removeAsset = (i) => {
    if (!window.confirm('¿Eliminar este activo del book?')) return
    setAssets(prev => prev.filter((_, idx) => idx !== i))
  }

  const saveAssetFromForm = () => {
    if (!draft.nombre.trim()) { window.alert('Indica al menos un nombre para el activo.'); return }
    if (isBook) {
      setAssets(prev => {
        if (editingIdx != null) { const next = [...prev]; next[editingIdx] = { ...draft }; return next }
        return [...prev, { ...draft }]
      })
      setDraft(emptyAsset())
      setEditingIdx(null)
      setStage('list')
    } else {
      setPreviewAssets([{ ...draft }])
      goStep(2)
    }
  }

  const generateBookPreview = () => {
    if (assets.length === 0) return
    setPreviewAssets(assets.map(a => ({ ...a })))
    goStep(2)
  }

  const backFromPreview = () => { goStep(1); setStage(isBook ? 'list' : 'form') }

  /* ====================================================
     EXPORT · captura cada .slide con html2canvas
  ==================================================== */
  const captureSlides = async () => {
    const html2canvas = (await import('html2canvas')).default
    const nodes = frameRef.current ? Array.from(frameRef.current.querySelectorAll('.slide')) : []
    const shots = []
    for (const node of nodes) {
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false })
      shots.push({ img: canvas.toDataURL('image/png'), w: canvas.width, h: canvas.height })
    }
    return shots
  }

  const fileBase = () => {
    const tipoLabel = isBook ? 'ProductBook' : 'Ficha'
    const name = (previewAssets[0]?.nombre || 'dossier').replace(/[^\w\-]+/g, '_')
    return `${tipoLabel}_${name}`
  }

  const exportPDF = async () => {
    try {
      setExporting('pdf')
      const { jsPDF } = await import('jspdf')
      const shots = await captureSlides()
      if (shots.length === 0) { window.alert('No hay slides para exportar.'); return }
      // Página 16:9 en pt (1280×720)
      const PW = 1280, PH = 720
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [PW, PH] })
      shots.forEach((s, i) => {
        if (i > 0) pdf.addPage([PW, PH], 'landscape')
        // encajar manteniendo aspecto
        const ratio = Math.min(PW / s.w, PH / s.h)
        const w = s.w * ratio, h = s.h * ratio
        pdf.addImage(s.img, 'PNG', (PW - w) / 2, (PH - h) / 2, w, h)
      })
      pdf.save(`${fileBase()}.pdf`)
    } catch (e) {
      console.error('Error exportando PDF:', e)
      window.alert('No se pudo exportar el PDF: ' + (e.message || e))
    } finally { setExporting(null) }
  }

  const exportPPT = async () => {
    try {
      setExporting('ppt')
      const pptxgen = (await import('pptxgenjs')).default
      const shots = await captureSlides()
      if (shots.length === 0) { window.alert('No hay slides para exportar.'); return }
      const pptx = new pptxgen()
      pptx.defineLayout({ name: 'D169', width: 13.333, height: 7.5 })
      pptx.layout = 'D169'
      shots.forEach(s => {
        const slide = pptx.addSlide()
        slide.addImage({ data: s.img, x: 0, y: 0, w: 13.333, h: 7.5 })
      })
      await pptx.writeFile({ fileName: `${fileBase()}.pptx` })
    } catch (e) {
      console.error('Error exportando PPT:', e)
      window.alert('No se pudo exportar el PPT: ' + (e.message || e))
    } finally { setExporting(null) }
  }

  /* ====================================================
     RENDER
  ==================================================== */
  const lineaLabel = LINEA_LABEL[linea] || 'Oficinas'

  return (
    <div className="dossier-skin">

      {/* Stepper */}
      <div className="stepper">
        {['Configuración', 'Activo', 'Vista previa'].map((lbl, i) => (
          <div key={i}
            className={`step ${step === i ? 'active' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => { if (i < step || (i === 1 && configComplete)) goStep(i) }}>
            <span className="num">{String(i).padStart(2, '0')}</span>{lbl}
          </div>
        ))}
      </div>

      {/* ===== VIEW 0 · Configuración ===== */}
      {step === 0 && (
        <div className="view active">
          <div className="section-eyebrow">Paso 0 · Configuración inicial</div>
          <h1 className="section-title">Define el <span className="italic-gold">contexto</span><br/>del dossier</h1>
          <p className="section-sub">Esto determina los campos del cuestionario, la estructura del dossier y el formato de salida (ficha individual o product book).</p>

          {Object.entries(CONFIG_GROUPS).map(([group, g]) => (
            <div className="group" key={group}>
              <div className="group-label"><span className="gnum">{g.num}</span>{g.label}</div>
              <div className={`grid grid-${g.cols}`}>
                {g.options.map(o => {
                  const selected = config[group] === o.value
                  const disabled = !!o.soon
                  return (
                    <div key={o.value}
                      className={`opt ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                      onClick={() => !disabled && selectConfig(group, o.value)}>
                      <div className="check">✓</div>
                      {o.soon && !o.badge && <span className="badge-soon-corner">Próximamente</span>}
                      {o.badge && <span className={`badge ${o.badge.cls}`}>{o.badge.txt}</span>}
                      <h4>{o.title}</h4>
                      <p>{o.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="actions">
            <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Paso 1 de 3</span>
            <button className="btn" disabled={!configComplete} onClick={startWizard}>Siguiente · Cargar activo →</button>
          </div>
        </div>
      )}

      {/* ===== VIEW 1 · Activo ===== */}
      {step === 1 && (
        <div className="view active">

          {/* Stage A · lista del book */}
          {isBook && stage === 'list' && (
            <>
              <div className="form-header">
                <h2>Product Book · {lineaLabel}</h2>
                <p>Añade los activos uno a uno con la misma dinámica que una ficha comercial. Cuando termines, genera la vista previa del book.</p>
              </div>
              <div className="form-sec" style={{ borderTop: 'none', paddingTop: 0 }}>
                <div className="form-sec-title"><span className="gnum">↗</span>ACTIVOS EN EL BOOK · <span style={{ color: 'var(--ink)' }}>{String(assets.length).padStart(2, '0')}</span></div>
                <div className="assets-list">
                  {assets.length === 0 ? (
                    <div className="empty"><div className="e-icon">∅</div><div className="e-title">Aún no hay activos en el book</div><div className="e-sub">Pulsa "Añadir nuevo activo" para empezar.</div></div>
                  ) : assets.map((a, i) => (
                    <div className="asset-row" key={i}>
                      <span className="a-num">{String(i + 1).padStart(2, '0')}</span>
                      <div className="a-info">
                        <div className="a-name">{a.nombre || 'Sin nombre'}</div>
                        <div className="a-meta">{a.zona || a.direccion || '—'}{a.kpis?.sba ? ` · ${a.kpis.sba} m²` : ''}</div>
                      </div>
                      <div className="a-actions">
                        <button onClick={() => editAsset(i)}>Editar</button>
                        <button onClick={() => removeAsset(i)}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="add-asset-btn" onClick={addNewAsset}>+ Añadir nuevo activo al book</button>
              </div>
              <div className="actions">
                <button className="btn btn-ghost" onClick={() => goStep(0)}>← Volver a configuración</button>
                <button className="btn" disabled={assets.length === 0} onClick={generateBookPreview}>Generar vista previa →</button>
              </div>
            </>
          )}

          {/* Stage B · formulario del activo */}
          {(!isBook || stage === 'form') && (
            <>
              <div className="form-header">
                <h2>{isBook ? (editingIdx != null ? `Editar activo #${String(editingIdx + 1).padStart(2, '0')} · ${lineaLabel}` : `Activo #${String(assets.length + 1).padStart(2, '0')} del book · ${lineaLabel}`) : `Ficha Comercial · ${lineaLabel}`}</h2>
                <p>{isBook ? 'Misma dinámica que una ficha comercial. Al guardar, vuelves a la lista del book.' : 'Cuestionario adaptado al contexto seleccionado. Los campos con * son obligatorios.'}</p>
              </div>

              {/* Cargar desde PDB */}
              <div className="pdb-loader">
                <div className="pl-title">Cargar desde la PDB · autorrellena el formulario</div>
                <div className="pl-row">
                  <input
                    placeholder="Buscar activo de la PDB por nombre o referencia…"
                    value={pdbQuery}
                    onChange={e => { searchPdb(e.target.value); setPdbOpen(true) }}
                    onFocus={() => setPdbOpen(true)}
                    onBlur={() => setTimeout(() => setPdbOpen(false), 200)}
                  />
                </div>
                {pdbOpen && pdbResults.length > 0 && (
                  <div className="pdb-results">
                    {pdbResults.map(a => (
                      <div className="pr-item" key={a.id} onMouseDown={() => loadFromPdb(a)}>
                        <div className="pr-name">{a.nombre}</div>
                        <div className="pr-meta">{[a.ref, a.zona || a.subzona, a.ciudad, a.uso, a.sba ? `${a.sba} m²` : null].filter(Boolean).join(' · ')}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="field" style={{ marginTop: 8 }}><div className="hint">O rellena los campos manualmente más abajo.</div></div>
              </div>

              {/* 01 Identificación */}
              <div className="form-sec">
                <div className="form-sec-title"><span className="gnum">01</span>IDENTIFICACIÓN</div>
                <div className="form-row cols-2">
                  <Field label="Nombre comercial del activo *"><input value={draft.nombre} onChange={e => setField('nombre', e.target.value)} placeholder="Ej: Edificio Dublín" /></Field>
                  <Field label="Dirección *"><input value={draft.direccion} onChange={e => setField('direccion', e.target.value)} placeholder="Vía de Dublín 7, Madrid" /></Field>
                </div>
                <div className="form-row cols-3">
                  <Field label="Submercado / Zona"><input value={draft.zona} onChange={e => setField('zona', e.target.value)} placeholder="Campo de las Naciones" /></Field>
                  <Field label="Propiedad"><input value={draft.propiedad} onChange={e => setField('propiedad', e.target.value)} placeholder="Monthisa" /></Field>
                  <Field label="Disponibilidad"><input value={draft.disponibilidad} onChange={e => setField('disponibilidad', e.target.value)} placeholder="Inmediata · Q3 2026 · ..." /></Field>
                </div>
              </div>

              {/* 02 KPIs */}
              <div className="form-sec">
                <div className="form-sec-title"><span className="gnum">02</span>KEY HIGHLIGHTS</div>
                {chunk(kpiTpl, 4).map((row, ri) => (
                  <div className="form-row cols-4" key={ri}>
                    {row.map(item => (
                      <Field key={item.id} label={`${item.label}${item.unit ? ` (${item.unit})` : ''}`}>
                        <input value={draft.kpis[item.id] || ''} onChange={e => setKpi(item.id, e.target.value)} placeholder={item.placeholder} />
                      </Field>
                    ))}
                    {row.length < 4 && Array.from({ length: 4 - row.length }).map((_, k) => <div key={`x${k}`} />)}
                  </div>
                ))}
              </div>

              {/* 03 Fotos y planos */}
              <div className="form-sec">
                <div className="form-sec-title"><span className="gnum">03</span>FOTOGRAFÍAS Y PLANOS</div>
                <div className="form-row cols-2">
                  <Dropzone label="Subir fotografías" hint="Portada, exteriores, lobby, terrazas. JPG/PNG"
                    files={draft.photos} accept="image/*"
                    onUpload={fl => handleUpload(fl, 'photos')} onRemove={i => removeFile('photos', i)} />
                  <Dropzone label="Subir planos" hint="Plantas, parking, alzados. JPG/PNG"
                    files={draft.plans} accept="image/*"
                    onUpload={fl => handleUpload(fl, 'plans')} onRemove={i => removeFile('plans', i)} />
                </div>
              </div>

              {/* 04 Ubicación */}
              <div className="form-sec">
                <div className="form-sec-title"><span className="gnum">04</span>UBICACIÓN Y CONTEXTO</div>
                <div className="form-row cols-2">
                  <Field label="Transportes (uno por línea)"><textarea value={draft.transportes} onChange={e => setField('transportes', e.target.value)} placeholder={'Metro Feria de Madrid (L8)\nAeropuerto Barajas a 8 km'} /></Field>
                  <Field label="Empresas en la zona (separadas por coma)"><textarea value={draft.empresas} onChange={e => setField('empresas', e.target.value)} placeholder="Endesa, American Express, Sanitas, Roche" /></Field>
                </div>
              </div>

              {/* 05 Descripción */}
              <div className="form-sec">
                <div className="form-sec-title"><span className="gnum">05</span>DESCRIPCIÓN COMERCIAL</div>
                <div className="form-row">
                  <Field label="Pitch principal (2-3 frases)"><textarea value={draft.pitch} onChange={e => setField('pitch', e.target.value)} placeholder="El Edificio X está diseñado por y para las personas..." /></Field>
                </div>
                <div className="form-row cols-2">
                  <Field label="Especificaciones técnicas (una por línea)"><textarea value={draft.specs} onChange={e => setField('specs', e.target.value)} placeholder={'Climatización VRV a 3 tubos\nSuelo técnico registrable'} /></Field>
                  <Field label="Sostenibilidad / Certificaciones"><textarea value={draft.sost} onChange={e => setField('sost', e.target.value)} placeholder={'LEED Oro\nWELL Oro\nPlacas fotovoltaicas en cubierta'} /></Field>
                </div>
              </div>

              {/* 06 Contactos */}
              <div className="form-sec">
                <div className="form-sec-title"><span className="gnum">06</span>CONTACTOS COMERCIALIZADORES</div>
                <div className="form-row cols-2">
                  <Field label="Comercializa (Savills · autorelleno)"><input value={SAVILLS_CONTACT} readOnly style={{ background: 'var(--surface)' }} /></Field>
                  <Field label="Co-comercializador (opcional)"><input value={draft.cocom} onChange={e => setField('cocom', e.target.value)} placeholder="CBRE · spain.oficinasmadrid@cbre.com" /></Field>
                </div>
              </div>

              <div className="actions">
                <button className="btn btn-ghost" onClick={() => { if (isBook) setStage('list'); else goStep(0) }}>{isBook ? '← Volver al book' : '← Volver'}</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  {isBook && <button className="btn btn-ghost" onClick={() => { setDraft(emptyAsset()); setEditingIdx(null); setStage('list') }}>Cancelar</button>}
                  <button className="btn" onClick={saveAssetFromForm}>{isBook ? (editingIdx != null ? 'Guardar cambios →' : 'Guardar activo →') : 'Generar vista previa →'}</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== VIEW 2 · Vista previa ===== */}
      {step === 2 && (
        <div className="view active">
          <div className="preview-bar">
            <div>
              <div style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>Vista previa</div>
              <h2>{isBook ? 'Product Book' : 'Ficha Comercial'} · {lineaLabel}{config.delegacion ? ` · ${cap(config.delegacion)}` : ''}</h2>
            </div>
            <div className="preview-actions">
              <button className="btn btn-ghost" onClick={backFromPreview}>← Editar</button>
              <button className="btn btn-ghost" disabled={!!exporting} onClick={exportPPT}>{exporting === 'ppt' ? 'Generando…' : 'Exportar PPT'}</button>
              <button className="btn btn-gold" disabled={!!exporting} onClick={exportPDF}>{exporting === 'pdf' ? 'Generando…' : 'Descargar PDF'}</button>
            </div>
          </div>

          <div className="preview-frame" ref={frameRef}>
            {isBook && <IndexSlide assets={previewAssets} />}
            {previewAssets.map((a, i) => (
              linea === 'industrial' ? <LogSlides key={i} a={a} /> : <OffSlides key={i} a={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- subcomponentes ---------- */
function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>
}

function Dropzone({ label, hint, files, accept, onUpload, onRemove }) {
  const ref = useRef(null)
  return (
    <div>
      <div className="dropzone" onClick={() => ref.current?.click()}>
        <div className="dz-icon">+</div>
        <div className="dz-title">{label}</div>
        <div className="dz-hint">{hint}</div>
        <input ref={ref} type="file" multiple accept={accept} style={{ display: 'none' }} onChange={e => { onUpload(e.target.files); e.target.value = '' }} />
      </div>
      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div className="file-chip" key={i}>{f.name}<span className="x" onClick={() => onRemove(i)}>×</span></div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- slides ---------- */
function IndexSlide({ assets }) {
  return (
    <div className="slide slide-index">
      <div className="ix-eyebrow">— Índice del Product Book —</div>
      <h2 className="ix-title">Activos <span className="italic-gold">seleccionados</span></h2>
      <div className="ix-list">
        {assets.map((a, i) => (
          <div className="ix-item" key={i}>
            <span className="ix-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="ix-name">{a.nombre || 'Sin nombre'}</span>
            <span className="ix-loc">{a.zona || a.direccion || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KpiOff({ value, unit, label, sublabel }) {
  return (
    <div className="kpi">
      <div className="kpi-num">{value || '—'}{unit ? <span className="unit">{unit}</span> : null}</div>
      <div className="kpi-label">{label}{sublabel ? <><br/><span style={{ color: 'var(--muted)' }}>{sublabel}</span></> : null}</div>
    </div>
  )
}

function OffSlides({ a }) {
  const k = a.kpis || {}
  const mainPhoto = a.photos?.[0]?.url
  return (
    <>
      <div className="slide slide-cover-off">
        <div className="logo-mark">
          <div className="triangle"></div>
          <div className="name">{(a.nombre || 'Edificio').replace('Edificio ', '')}</div>
          <div className="loc">{(a.zona || a.direccion || 'Madrid').toUpperCase()}</div>
        </div>
        <div className="cover-pretitle">{(a.zona || 'Madrid').toUpperCase()} · MADRID</div>
        <h1 className="cover-title">{a.nombre || 'Sin nombre'}</h1>
      </div>

      <div className="slide slide-kpis-off">
        <div className="kpi-title">Key <span className="italic-gold">Highlights</span></div>
        <KpiOff value={k.sba} unit="m²" label="Superficie total alquilable" />
        <KpiOff value={k.plantas} label="Composición" />
        <KpiOff value={k.parking} label="Plazas de parking" sublabel={k.parkingev ? `${k.parkingev} para vehículos eléctricos` : ''} />
        <KpiOff value={k.ratio} label="Ratio de ocupación" />
      </div>

      <div className="slide slide-photo">{mainPhoto ? <img src={mainPhoto} alt="" /> : '— Imagen principal del activo —'}</div>

      <div className="slide slide-content">
        <h3>Las personas, <span className="italic-gold">en el centro</span></h3>
        <p>{a.pitch || 'Descripción comercial pendiente. Añade un pitch principal en el cuestionario.'}</p>
        <div style={{ marginTop: 20, fontSize: 11, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {a.zona ? `${a.zona} · ` : ''}{a.direccion || ''}
        </div>
      </div>

      {a.empresas && (
        <div className="slide slide-content">
          <h3>Empresas en la <span className="italic-gold">zona</span></h3>
          <p style={{ maxWidth: 720 }}>{a.empresas}</p>
        </div>
      )}

      {(a.specs || a.sost) && (
        <div className="slide slide-content" style={{ padding: '32px 52px' }}>
          <h3 style={{ fontSize: 28, marginBottom: 12 }}>Especificaciones <span className="italic-gold">técnicas</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Instalaciones</div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>{lines(a.specs)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Sostenibilidad</div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>{lines(a.sost)}</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function LogSlides({ a }) {
  const k = a.kpis || {}
  const mainPhoto = a.photos?.[0]?.url
  return (
    <>
      <div className="slide slide-cover-log">
        <div className="brand-badge"><span className="dot">●</span> Newdock</div>
        <div className="pretitle">Parque logístico</div>
        <h1 className="title">{(a.nombre || 'SIN NOMBRE').toUpperCase()}</h1>
        <div className="sub">{(a.zona || a.direccion || 'Madrid').toUpperCase()} <span className="yellow-dot"></span> MADRID</div>
        <div className="meta"><strong>{k.sba || '—'} m²</strong> construidos <span className="yellow-dot"></span> Disponibilidad <strong>{a.disponibilidad || '—'}</strong></div>
      </div>

      <div className="slide slide-kpis-log">
        <h3>DATOS CLAVE</h3>
        <div className="kpi-grid">
          <KpiLog value={k.naves} label="Edificios independientes" />
          <KpiLog value={k.sba} unit="m²" label="Superficie construida" />
          <KpiLog value={k.altura} unit="m" label="Altura máxima" />
          <KpiLog value={k.maniobra} unit="m" label="Espacio de maniobra" />
          <KpiLog value={k.muelles} label="Muelles de carga" />
          <KpiLog value={k.fotovoltaica} unit="MW" label="Capacidad fotovoltaica" />
          <KpiLog value={k.parcela} unit="m²" label="Suelo total" />
          <KpiLog value={k.cert ? '✓' : ''} label={k.cert || 'Certificaciones'} />
        </div>
      </div>

      <div className="slide slide-photo">{mainPhoto ? <img src={mainPhoto} alt="" /> : '— Imagen aérea / nave —'}</div>

      <div className="slide slide-content">
        <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 24 }}>UBICACIÓN</h3>
        <p>{a.pitch || 'Descripción comercial del activo.'}</p>
        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--muted)' }}>{(a.transportes || '').split('\n').filter(Boolean).join(' · ')}</div>
      </div>

      {a.specs && (
        <div className="slide slide-content">
          <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 24 }}>ESPECIFICACIONES DEL EDIFICIO</h3>
          <div style={{ fontSize: 12, lineHeight: 1.7, maxWidth: 640 }}>{lines(a.specs)}</div>
        </div>
      )}
    </>
  )
}

function KpiLog({ value, unit, label }) {
  return (
    <div>
      <div className="kpi-num">{value || '—'}{unit ? <span className="unit">{unit}</span> : null}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

/* ---------- utils ---------- */
function chunk(arr, n) { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }
function lines(txt) { return (txt || '—').split('\n').map((l, i) => <span key={i}>{l}<br/></span>) }
