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
      { value: 'ficha', title: 'Ficha Comercial', desc: 'Dossier individual de un activo u oferta. PDF de 4-8 páginas. Para envíos puntuales y respuestas a requerimientos.' },
      { value: 'book',  title: 'Product Book',    desc: 'Selección de varios activos/ofertas en un único documento. Incluye índice y resumen.' },
    ],
  },
  fuente: {
    num: '02', label: 'FUENTE DE DATOS', cols: 2,
    options: [
      { value: 'activo', title: 'Desde un activo', desc: 'Ficha del edificio: fotos, planos, características, ubicación en mapa, parking, superficie y uso principal. Sincroniza desde la PDB de activos.' },
      { value: 'oferta', title: 'Desde una oferta', desc: 'Todo lo del activo + stacking plan con disponibilidad, lo disponible, superficie mín./máx. y condiciones económicas. Sincroniza desde la PDB de ofertas.' },
    ],
  },
  linea: {
    num: '03', label: 'LÍNEA DE NEGOCIO', cols: 3,
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
    num: '04', label: 'DELEGACIÓN', cols: 4,
    options: [
      { value: 'madrid',    title: 'Madrid',    desc: 'Mercado piloto. Catálogo completo de zonas y comparables.' },
      { value: 'barcelona', title: 'Barcelona', desc: '22@ · Eje Diagonal · Plaça d\'Europa · Sant Cugat.' },
      { value: 'malaga',    title: 'Málaga',    desc: 'Tech-hub creciente. Soho · Limonar · PT Andalucía.' },
      { value: 'valencia',  title: 'Valencia',  desc: 'Centro · Cortes · Beniferri · Benimaclet.' },
    ],
  },
  equipo: {
    num: '05', label: 'EQUIPO / SERVICIO', cols: 2,
    options: [
      { value: 'leasing', title: 'Leasing', desc: 'Comercialización · arrendamiento. Landlord rep o Tenant rep. Single / multi / dual track.', badge: { cls: 'badge-available', txt: 'Disponible' } },
      { value: 'cm', title: 'Capital Markets', desc: 'Inversión · transacciones. Sell-side, buy-side, forward funding, sale & leaseback.', badge: { cls: 'badge-dev', txt: 'En desarrollo' }, soon: true },
    ],
  },
  idioma: {
    num: '06', label: 'IDIOMA DEL DOSSIER', cols: 3,
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
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const emptyAsset = () => ({
  fuente: 'activo',                 // 'activo' | 'oferta'
  refPdb: '', activoRef: '',        // referencias de origen
  nombre: '', direccion: '', zona: '', propiedad: '', disponibilidad: '',
  transportes: '', empresas: '', pitch: '', specs: '', sost: '', cocom: '',
  lat: null, lng: null,
  kpis: {}, photos: [], plans: [],
  // Datos específicos de oferta
  tipo_operacion: '', sup_disponible: '', sup_min: '', sup_max: '',
  renta_m2: '', renta_mensual: '', renta_anual: '', gastos: '',
  stacking: null,                   // stacking_data del activo de la oferta
})

export default function DossierGenerator() {
  const [step, setStep] = useState(0)
  const [config, setConfig] = useState({ tipo: null, fuente: null, linea: null, delegacion: null, equipo: null, idioma: null })
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

  const configComplete = config.tipo && config.fuente && config.linea && config.delegacion && config.equipo && config.idioma
  const isBook = config.tipo === 'book'
  const isOferta = config.fuente === 'oferta'
  const linea = config.linea || 'oficinas'
  const kpiTpl = KPI_TEMPLATES[linea] || KPI_TEMPLATES.oficinas

  /* ---------- helpers ---------- */
  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  const setKpi   = (id, v) => setDraft(d => ({ ...d, kpis: { ...d.kpis, [id]: v } }))

  const selectConfig = (group, value) => {
    setConfig(c => ({ ...c, [group]: value }))
  }

  const goStep = (n) => { setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const newDraft = () => ({ ...emptyAsset(), fuente: config.fuente || 'activo' })

  const startWizard = () => {
    goStep(1)
    if (isBook) { setStage('list') } else { setStage('form'); setDraft(newDraft()); setEditingIdx(null) }
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

  /* ---------- PDB prefill (activos u ofertas según la fuente) ---------- */
  const searchPdb = useCallback(async (q) => {
    setPdbQuery(q)
    if (!q || q.trim().length < 2) { setPdbResults([]); return }
    const term = q.trim()
    if (isOferta) {
      const { data } = await supabase
        .from('ofertas')
        .select('id, ref, nombre, titulo_web, tipo_operacion, estado, superficie_disponible, renta_m2, tipologia, activo_id, activo_ref')
        .or(`nombre.ilike.%${term}%,ref.ilike.%${term}%,titulo_web.ilike.%${term}%`)
        .order('ref').limit(8)
      setPdbResults((data || []).map(o => ({
        id: o.id, kind: 'oferta', ref: o.ref,
        nombre: o.nombre || o.titulo_web || o.ref,
        meta: [o.ref, o.tipo_operacion, o.tipologia, o.superficie_disponible ? `${o.superficie_disponible} m²` : null, o.renta_m2 ? `${o.renta_m2} €/m²` : null].filter(Boolean).join(' · '),
      })))
    } else {
      const { data } = await supabase
        .from('activos')
        .select('id, ref, nombre, zona, subzona, ciudad, uso, sba')
        .or(`nombre.ilike.%${term}%,ref.ilike.%${term}%`)
        .order('nombre').limit(8)
      setPdbResults((data || []).map(a => ({
        id: a.id, kind: 'activo', ref: a.ref,
        nombre: a.nombre || a.ref,
        meta: [a.ref, a.zona || a.subzona, a.ciudad, a.uso, a.sba ? `${a.sba} m²` : null].filter(Boolean).join(' · '),
      })))
    }
  }, [isOferta])

  const mapActivoKpis = (act, base) => {
    const kpis = { ...base }
    if (act?.sba != null) kpis.sba = String(act.sba)
    if (act?.leed) kpis.cert = act.leed
    if (act?.plazas != null) kpis.parking = String(act.plazas)   // plazas en características/KPIs del activo
    if (act?.n_edificios != null && linea === 'industrial') kpis.naves = String(act.n_edificios)
    if (act?.sup_parcela != null && linea === 'industrial') kpis.parcela = String(act.sup_parcela)
    return kpis
  }

  // Espacios 'vac' del stacking del activo asignados a esta oferta → [{ sup, renta }]
  const stackingVacForOferta = (stacking, ofertaRef) => {
    const blds = Array.isArray(stacking) ? stacking : []
    return blds.flatMap(b => (b.arr || []).flatMap(r => (r.units || [])
      .filter(u => u.type === 'vac' && (u.oferta === ofertaRef || !ofertaRef))
      .map(u => ({ sup: Number(u.sup) || 0, renta: Number(u.renta) || 0 }))))
  }

  const closePdb = () => { setPdbOpen(false); setPdbQuery(''); setPdbResults([]) }

  const loadFromPdb = async (row) => {
    if (row.kind === 'oferta') {
      const { data: o } = await supabase.from('ofertas').select('*').eq('id', row.id).maybeSingle()
      if (!o) return
      let act = null
      if (o.activo_id) { const { data } = await supabase.from('activos').select('*').eq('id', o.activo_id).maybeSingle(); act = data }

      // Superficie disponible (máx = total de módulos vac de esta oferta) y
      // mínima alquilable: si la oferta es divisible → menor módulo; si no → total.
      const vac = stackingVacForOferta(act?.stacking_data, o.ref)
      const totalDisp = vac.reduce((s, e) => s + e.sup, 0) || Number(o.superficie_disponible) || 0
      const modules = vac.map(e => e.sup).filter(s => s > 0)
      let desg = []
      try { const { data } = await supabase.from('desglose_ofertas').select('divisible, sup_min').eq('oferta_id', o.id); desg = data || [] } catch { desg = [] }
      const divisible = desg.some(d => d.divisible) || modules.length > 1
      const desgMins = desg.filter(d => d.divisible && Number(d.sup_min) > 0).map(d => Number(d.sup_min))
      let supMin = totalDisp
      if (divisible) {
        if (desgMins.length) supMin = Math.min(...desgMins)
        else if (modules.length) supMin = Math.min(...modules)
      }

      setDraft(d => ({
        ...d,
        fuente: 'oferta', refPdb: o.ref, activoRef: act?.ref || o.activo_ref || '',
        nombre: act?.nombre || o.nombre || o.titulo_web || d.nombre,
        direccion: [act?.direccion, act?.ciudad].filter(Boolean).join(', ') || d.direccion,
        zona: act?.zona || act?.subzona || d.zona,
        propiedad: act?.propietario || d.propiedad,
        pitch: o.descriptivo || o.descripcion_web || d.pitch,
        lat: act?.lat ?? d.lat, lng: act?.lng ?? d.lng,
        tipo_operacion: o.tipo_operacion || '',
        disponibilidad: o.estado || (o.activa ? 'Disponible' : '') || d.disponibilidad,
        sup_disponible: totalDisp ? String(totalDisp) : (o.superficie_disponible != null ? String(o.superficie_disponible) : ''),
        sup_min: supMin ? String(supMin) : '',
        sup_max: totalDisp ? String(totalDisp) : '',
        renta_m2: o.renta_m2 != null ? String(o.renta_m2) : '',
        renta_mensual: o.renta_mensual != null ? String(o.renta_mensual) : '',
        renta_anual: o.renta_anual != null ? String(o.renta_anual) : '',
        gastos: o.gastos_comunes != null ? String(o.gastos_comunes) : '',
        stacking: act?.stacking_data || null,
        kpis: mapActivoKpis(act, d.kpis),
      }))
    } else {
      const { data: a } = await supabase.from('activos').select('*').eq('id', row.id).maybeSingle()
      if (!a) return
      setDraft(d => ({
        ...d,
        fuente: 'activo', refPdb: a.ref, activoRef: a.ref,
        nombre: a.nombre || d.nombre,
        direccion: [a.direccion, a.ciudad].filter(Boolean).join(', ') || d.direccion,
        zona: a.zona || a.subzona || d.zona,
        propiedad: a.propietario || d.propiedad,
        lat: a.lat ?? d.lat, lng: a.lng ?? d.lng,
        stacking: a.stacking_data || null,
        kpis: mapActivoKpis(a, d.kpis),
      }))
    }
    closePdb()
  }

  /* ---------- book actions ---------- */
  const addNewAsset = () => { setDraft(newDraft()); setEditingIdx(null); setStage('form') }
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
      setDraft(newDraft())
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
      try {
        const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false })
        shots.push({ img: canvas.toDataURL('image/png'), w: canvas.width, h: canvas.height })
      } catch (err) {
        // Una slide que no se puede capturar (p.ej. mapa con CORS) no debe abortar el resto.
        console.warn('Slide no capturable, se omite:', err)
      }
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
                <div className="pl-title">{isOferta ? 'Sincronizar desde una OFERTA de la PDB' : 'Sincronizar desde un ACTIVO de la PDB'}{draft.refPdb ? ` · cargado ${draft.refPdb}` : ''}</div>
                <div className="pl-row">
                  <input
                    placeholder={isOferta ? 'Buscar oferta por nombre, título o referencia…' : 'Buscar activo por nombre o referencia…'}
                    value={pdbQuery}
                    onChange={e => { searchPdb(e.target.value); setPdbOpen(true) }}
                    onFocus={() => setPdbOpen(true)}
                    onBlur={() => setTimeout(() => setPdbOpen(false), 200)}
                  />
                </div>
                {pdbOpen && pdbResults.length > 0 && (
                  <div className="pdb-results">
                    {pdbResults.map(r => (
                      <div className="pr-item" key={r.id} onMouseDown={() => loadFromPdb(r)}>
                        <div className="pr-name">{r.nombre}</div>
                        <div className="pr-meta">{r.meta}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="field" style={{ marginTop: 8 }}><div className="hint">{isOferta ? 'Trae el stacking, disponibilidad y condiciones económicas de la oferta + los datos del edificio. Editable más abajo.' : 'Trae fotos, características y ubicación del activo. Editable más abajo.'}</div></div>
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

              {/* 02b · Condiciones de la oferta (solo fuente = oferta) */}
              {isOferta && (
                <div className="form-sec">
                  <div className="form-sec-title"><span className="gnum">★</span>DISPONIBILIDAD Y CONDICIONES DE LA OFERTA</div>
                  <div className="form-row cols-3">
                    <Field label="Tipo de operación"><input value={draft.tipo_operacion} onChange={e => setField('tipo_operacion', e.target.value)} placeholder="Alquiler · Venta" /></Field>
                    <Field label="Disponibilidad / estado"><input value={draft.disponibilidad} onChange={e => setField('disponibilidad', e.target.value)} placeholder="Inmediata · Q3 2026" /></Field>
                    <Field label="Superficie disponible (m²)"><input value={draft.sup_disponible} onChange={e => setField('sup_disponible', e.target.value)} placeholder="3.500" /></Field>
                  </div>
                  <div className="form-row cols-4">
                    <Field label="Superficie mín. (m²)"><input value={draft.sup_min} onChange={e => setField('sup_min', e.target.value)} placeholder="500" /></Field>
                    <Field label="Superficie máx. (m²)"><input value={draft.sup_max} onChange={e => setField('sup_max', e.target.value)} placeholder="3.500" /></Field>
                    <Field label="Renta (€/m²/mes)"><input value={draft.renta_m2} onChange={e => setField('renta_m2', e.target.value)} placeholder="16,50" /></Field>
                    <Field label="Gastos comunes (€/m²/mes)"><input value={draft.gastos} onChange={e => setField('gastos', e.target.value)} placeholder="3,00" /></Field>
                  </div>
                  <div className="form-row cols-2">
                    <Field label="Renta mensual (€)"><input value={draft.renta_mensual} onChange={e => setField('renta_mensual', e.target.value)} placeholder="57.750" /></Field>
                    <Field label="Renta anual (€)"><input value={draft.renta_anual} onChange={e => setField('renta_anual', e.target.value)} placeholder="693.000" /></Field>
                  </div>
                  <div className="field"><div className="hint">{draft.stacking ? `Stacking plan sincronizado del activo${draft.activoRef ? ` ${draft.activoRef}` : ''} · se incluye una slide de disponibilidad por planta.` : 'Sin stacking sincronizado. Carga la oferta desde la PDB para traerlo.'}</div></div>
                </div>
              )}

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
                  {isBook && <button className="btn btn-ghost" onClick={() => { setDraft(newDraft()); setEditingIdx(null); setStage('list') }}>Cancelar</button>}
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

/* Slide de ubicación · static map exportable si hay clave, si no embed (solo pantalla) */
function MapSlide({ a }) {
  const q = (a.lat != null && a.lng != null) ? `${a.lat},${a.lng}` : (a.direccion || a.zona || '')
  if (!q) return null
  const staticUrl = MAPS_KEY
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(q)}&zoom=15&size=640x360&scale=2&maptype=roadmap&markers=color:0x0B2545%7C${encodeURIComponent(q)}&key=${MAPS_KEY}`
    : null
  return (
    <div className="slide" style={{ position: 'relative', background: '#e8e6e2' }}>
      <div style={{ position: 'absolute', top: 24, left: 32, zIndex: 2, background: 'rgba(255,255,255,0.94)', padding: '10px 16px', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)' }}>Ubicación</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: 'var(--ink)' }}>{a.zona || a.nombre || '—'}</div>
        {a.direccion && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{a.direccion}</div>}
      </div>
      {staticUrl
        ? <img src={staticUrl} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Mapa de ubicación" />
        : <iframe title="Mapa" style={{ width: '100%', height: '100%', border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`} />}
    </div>
  )
}

function EconItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--navy)' }}>{value || '—'}</div>
    </div>
  )
}

function StackingMini({ stacking }) {
  const blds = Array.isArray(stacking) ? stacking : []
  if (blds.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {blds.map((b, bi) => (
        <div key={bi} style={{ minWidth: 130 }}>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 5 }}>{b.label || b.id}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(b.arr || []).map((f, fi) => {
              const vac = (f.units || []).some(u => u.type === 'vac')
              return (
                <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9 }}>
                  <span style={{ width: 30, color: 'var(--muted)' }}>{f.p}</span>
                  <span style={{ flex: 1, height: 11, borderRadius: 2, background: vac ? '#9CC5AB' : '#E2DFD9' }} title={vac ? 'Disponible' : 'Ocupado'} />
                  <span style={{ width: 48, textAlign: 'right', color: 'var(--muted)' }}>{f.sup ? `${f.sup}` : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function OfertaSlide({ a }) {
  const eur = v => v ? Number(String(v).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.')).toLocaleString('es-ES') + ' €' : ''
  const supRange = (a.sup_min || a.sup_max) ? `${a.sup_min || '?'}–${a.sup_max || '?'} m²` : ''
  return (
    <div className="slide slide-content" style={{ padding: '36px 52px' }}>
      <h3 style={{ fontSize: 30, marginBottom: 16 }}>Disponibilidad y <span className="italic-gold">condiciones</span></h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 20 }}>
        <EconItem label="Operación" value={a.tipo_operacion} />
        <EconItem label="Disponibilidad" value={a.disponibilidad} />
        <EconItem label="Sup. disponible" value={a.sup_disponible ? `${a.sup_disponible} m²` : ''} />
        <EconItem label="Sup. mín–máx" value={supRange} />
        <EconItem label="Renta" value={a.renta_m2 ? `${a.renta_m2} €/m²/mes` : ''} />
        <EconItem label="Gastos" value={a.gastos ? `${a.gastos} €/m²/mes` : ''} />
        <EconItem label="Renta mensual" value={a.renta_mensual ? eur(a.renta_mensual) : ''} />
        <EconItem label="Renta anual" value={a.renta_anual ? eur(a.renta_anual) : ''} />
      </div>
      {Array.isArray(a.stacking) && a.stacking.length > 0 && (
        <div>
          <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            Stacking · disponibilidad por planta
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--muted)', letterSpacing: 0, textTransform: 'none' }}><span style={{ width: 10, height: 10, background: '#9CC5AB', borderRadius: 2, display: 'inline-block' }} /> Disponible</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--muted)', letterSpacing: 0, textTransform: 'none' }}><span style={{ width: 10, height: 10, background: '#E2DFD9', borderRadius: 2, display: 'inline-block' }} /> Ocupado</span>
          </div>
          <StackingMini stacking={a.stacking} />
        </div>
      )}
    </div>
  )
}

/* Galería · resto de fotos subidas (la 1ª va como imagen principal) */
function GallerySlide({ photos }) {
  const rest = (photos || []).slice(1)
  if (rest.length === 0) return null
  return (
    <div className="slide" style={{ background: '#fff', padding: 18, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridAutoRows: '1fr', gap: 10 }}>
      {rest.slice(0, 4).map((p, i) => (
        <div key={i} style={{ overflow: 'hidden', borderRadius: 2, background: 'var(--surface-2)' }}>
          <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  )
}

/* Planos subidos */
function PlanosSlide({ plans }) {
  if (!plans || plans.length === 0) return null
  const cols = Math.min(plans.length, 3)
  return (
    <div className="slide slide-content" style={{ padding: '32px 52px' }}>
      <h3 style={{ fontSize: 30, marginBottom: 16 }}>Planos</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, flex: 1, minHeight: 0 }}>
        {plans.slice(0, 3).map((p, i) => (
          <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={p.url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* Amenities (oficinas) · separados por coma */
function AmenitiesSlide({ amenities }) {
  const items = (amenities || '').split(',').map(s => s.trim()).filter(Boolean)
  if (items.length === 0) return null
  return (
    <div className="slide slide-content">
      <h3>Amenities <span className="italic-gold">& servicios</span></h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 28px', marginTop: 8, maxWidth: 780 }}>
        {items.map((it, i) => (
          <div key={i} style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', gap: 8, alignItems: 'baseline' }}><span style={{ color: 'var(--gold)' }}>—</span>{it}</div>
        ))}
      </div>
    </div>
  )
}

/* Sostenibilidad · una por línea */
function SostSlide({ sost }) {
  const items = (sost || '').split('\n').map(s => s.trim()).filter(Boolean)
  if (items.length === 0) return null
  return (
    <div className="slide slide-content">
      <h3>Sostenibilidad <span className="italic-gold">& certificaciones</span></h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 28px', marginTop: 8, maxWidth: 780 }}>
        {items.map((it, i) => (
          <div key={i} style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', gap: 8, alignItems: 'baseline' }}><span style={{ color: 'var(--success)' }}>✓</span>{it}</div>
        ))}
      </div>
    </div>
  )
}

/* Especificaciones técnicas · una por línea */
function SpecsSlide({ specs, mono }) {
  const items = (specs || '').split('\n').map(s => s.trim()).filter(Boolean)
  if (items.length === 0) return null
  return (
    <div className="slide slide-content">
      <h3 style={mono ? { fontFamily: 'Manrope', fontWeight: 700, fontSize: 24 } : undefined}>Especificaciones <span className="italic-gold">técnicas</span></h3>
      <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-2)', maxWidth: 660, marginTop: 8 }}>{items.map((l, i) => <div key={i}>{l}</div>)}</div>
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

      <GallerySlide photos={a.photos} />

      <MapSlide a={a} />

      <PlanosSlide plans={a.plans} />

      <AmenitiesSlide amenities={a.kpis?.amenities} />

      <SostSlide sost={a.sost} />

      {a.fuente === 'oferta' && <OfertaSlide a={a} />}

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

      <SpecsSlide specs={a.specs} />
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

      <GallerySlide photos={a.photos} />

      <MapSlide a={a} />

      <PlanosSlide plans={a.plans} />

      <SostSlide sost={a.sost} />

      {a.fuente === 'oferta' && <OfertaSlide a={a} />}

      <div className="slide slide-content">
        <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 24 }}>UBICACIÓN</h3>
        <p>{a.pitch || 'Descripción comercial del activo.'}</p>
        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--muted)' }}>{(a.transportes || '').split('\n').filter(Boolean).join(' · ')}</div>
      </div>

      <SpecsSlide specs={a.specs} mono />
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
