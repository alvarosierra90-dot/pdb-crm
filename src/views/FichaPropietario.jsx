import { useState, useRef, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import DesactivarPropietarioModal from '../components/DesactivarPropietarioModal'
import AsignarTareaModal from '../components/AsignarTareaModal'
import { exportPDF, exportPPT } from '../utils/exportReport'
import { supabase } from '../lib/supabase'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'

function ExportMenu({ getConfig }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <button onClick={() => setOpen(o => !o)}
        style={{padding:'5px 14px',background:'var(--accent)',border:'none',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:6,boxShadow:'0 1px 4px rgba(59,130,246,.3)'}}>
        ⬇ Exportar informe <span style={{fontSize:8}}>{open?'▲':'▼'}</span>
      </button>
      {open && (
        <div style={{position:'absolute',right:0,top:'110%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,boxShadow:'0 4px 16px rgba(0,0,0,.12)',zIndex:999,minWidth:130,overflow:'hidden'}}>
          <div onClick={() => { setOpen(false); exportPDF(getConfig()) }}
            style={{padding:'9px 14px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid var(--border)'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
            onMouseLeave={e=>e.currentTarget.style.background=''}>
            📄 <span>PDF</span>
          </div>
          <div onClick={() => { setOpen(false); exportPPT(getConfig()) }}
            style={{padding:'9px 14px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
            onMouseLeave={e=>e.currentTarget.style.background=''}>
            <span>PowerPoint</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Tabs (mayo 2026): Condiciones + Análisis unificadas; renombrado el "Histórico
// propietarios" como "Histórico de activos" (más correcto: el propietario no se
// historifica a sí mismo, sino los activos que ha tenido).
const TABS = ['datos','condiciones','historico','conf']
const TAB_LABELS = ['Datos del propietario','Condiciones e inversión','Histórico de activos','Confidencialidad']

const USOS_PROPIETARIO = [
  'Oficinas','Logístico / Industrial','Retail','Centros comerciales',
  'Residencial','Living (PRS / BTR / Flex)','Hoteles','Suelos',
  'Alternativos','Mixto',
]

const PERFIL_COLOR = { 'Core':'var(--accent)', 'Value-add':'var(--purple)', 'Oportunista':'var(--red)', 'Institucional':'var(--teal)', 'Privado':'var(--text3)' }
const ESTADO_COLOR = { 'Activo':'var(--green)', 'Inactivo':'var(--text4)', 'En desinversión':'var(--amber)', 'Vendido':'var(--red)' }

const HIST_INIT = [
  { id:'H-001', propietario:'Blackstone Real Estate', activo:'P.E Avalon', tipo:'Asset deal', precio:'98 M€', fecha_entrada:'2014/Q1', fecha_salida:'2018/Q3', duracion:'4 años 6 meses', motivo:'Venta estratégica — ciclo de desinversión', cap_rate_entrada:7.2, cap_rate_salida:5.1, rentabilidad:'+32%', responsable:'Sierra Alvaro' },
  { id:'H-002', propietario:'AXA IM Real Assets', activo:'Torre Glòries', tipo:'Share deal', precio:'110 M€', fecha_entrada:'2017/Q2', fecha_salida:'2021/Q2', duracion:'4 años', motivo:'Rotación de portfolio', cap_rate_entrada:5.8, cap_rate_salida:4.8, rentabilidad:'+24%', responsable:'García Marta' },
]

const LOG_INIT = [
  { fecha:'07/04/2026', usuario:'Sierra Alvaro', accion:'Actualización cap rate → 5.1%' },
  { fecha:'15/03/2026', usuario:'García Marta',  accion:'Alta propietario — PRO-2501 registrado' },
]

export default function FichaPropietario() {
  const { navigate, params } = useNav()
  const fromActivo = !!(params?.fromActivoRef)
  // "Nuevo en blanco" = sin contexto de activo, sin id de DB, sin ownerData del stacking
  const isBlankNew = !fromActivo && !params?.id && !params?.ownerData
  // Tratamos blank-new igual que fromActivo en cuanto a borrar todos los defaults
  const noPrefill  = fromActivo || isBlankNew
  const [tab, setTab] = useState('datos')
  const [hist] = useState(HIST_INIT)
  const [log]  = useState(LOG_INIT)
  const [propConfidential, setPropConfidential] = useState(false)
  const [propAuthUsers, setPropAuthUsers] = useState([
    { name:'Sierra Álvaro', team:'Leasing Oficinas MAD', role:'Principal', initials:'AS', bg:'#f5efe5', color:'#5a4828', owner:true },
  ])
  const [showTarea, setShowTarea] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [showDesactivar, setShowDesactivar] = useState(false)
  const [desactivarMode, setDesactivarMode] = useState('desactivar')
  const [propietarioReal, setPropietarioReal] = useState(null) // { id, nombre, estado }
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!params?.id) { setPropietarioReal(null); return }
    let cancel = false
    supabase.from('propietarios')
      .select('id, nombre, estado, fecha_desactivacion, motivo_desactivacion')
      .eq('id', params.id)
      .maybeSingle()
      .then(({ data }) => { if (!cancel) setPropietarioReal(data || null) })
    return () => { cancel = true }
  }, [params?.id, reloadKey])
  const [usos, setUsos] = useState(['Oficinas','Logístico / Industrial'])
  const toggleUso = (u) => setUsos(prev => prev.includes(u) ? prev.filter(x=>x!==u) : [...prev,u])

  // Cuando fromActivo === true (alta desde stacking de un activo / oferta),
  // solo heredamos la info ESTRUCTURAL del activo. Todo lo demás queda vacío
  // con placeholder 'por completar'.
  const [form, setForm] = useState({
    // Identificación
    id: params?.ownerData?.id || (noPrefill ? `PRO-${Date.now()}` : 'PRO-2501'),
    propietario: params?.ownerData?.propietario || (noPrefill ? '' : 'Merlín Properties SOCIMI'),
    cif:           noPrefill ? '' : 'A-86305997',
    tipo_entidad:  noPrefill ? '' : 'SOCIMI',
    pais:          noPrefill ? '' : 'España',
    ciudad_sede:   noPrefill ? '' : 'Madrid',
    estado:        noPrefill ? '' : 'Activo',
    perfil:        noPrefill ? '' : 'Core',
    asset_manager: noPrefill ? '' : 'Merlín Properties SOCIMI',
    responsable:   '',
    email:         noPrefill ? '' : 'ir@merlin-properties.com',
    telefono:      noPrefill ? '' : '+34 91 769 99 00',
    contacto_principal: noPrefill ? '' : 'Ismael Clemente (CEO)',
    observaciones: '',

    // Activo vinculado — único bloque que se autocompleta
    activo:           noPrefill ? (params?.fromActivoNombre    || '') : 'P.E Avalon',
    activo_direccion: noPrefill ? (params?.fromActivoDireccion || '') : 'Calle Albasanz 16, 28037 Madrid',
    zona:             noPrefill ? '' : 'M-30',
    subzona:          '',
    superficie: params?.ownerSuperficie != null
      ? String(params.ownerSuperficie)
      : params?.ownerData?.superficie != null
        ? String(params.ownerData.superficie)
        : noPrefill ? '' : '46956',
    uso:           noPrefill ? '' : 'Oficinas',
    area:          '',
    tipologia:     noPrefill ? '' : 'Asset deal',
    anyo_compra:   noPrefill ? '' : '2018',
    trimestre:     noPrefill ? '' : 'Q3',
    precio_compra: '',
    estado_activo: noPrefill ? '' : 'Ocupado',
    regimen:       noPrefill ? '' : 'Propiedad 100%',
    valoracion_actual: '',
    plusvalia_latente: '',

    // Condiciones inversión — sin defaults ficticios cuando fromActivo
    cap_rate:           noPrefill ? '' : '5.1',
    yield:              noPrefill ? '' : '5.4',
    tir_objetivo:       noPrefill ? '' : '7.0',
    horizonte_inv:      noPrefill ? '' : '7',
    estrategia:         noPrefill ? '' : 'Hold',
    cap_rate_compra:    noPrefill ? '' : '7.2',
    precio_m2_compra:   noPrefill ? '' : '2769',
    precio_m2_actual:   noPrefill ? '' : '3088',
    revalorizacion:     noPrefill ? '' : '+11.5%',
    nota_estrategia:    noPrefill ? '' : 'Activo estabilizado con potencial de rotación de arrendatarios. Estrategia de captura de rentas y eventual desinversión en ciclo alcista.',

    // Financiación — sin defaults ficticios cuando fromActivo
    ltv:               noPrefill ? '' : '45',
    financiacion:      noPrefill ? '' : '60',
    banco:             noPrefill ? '' : 'CaixaBank / BBVA (sindicado)',
    tipo_deuda:        noPrefill ? '' : 'Préstamo hipotecario',
    vencimiento_deuda: noPrefill ? '' : '2028',
    tipo_interes:      noPrefill ? '' : 'EURIBOR + 175pb',
    cobertura:         noPrefill ? '' : 'IRS al 70%',
    loan_amount:       noPrefill ? '' : '58.5 M€',
    dscr:              noPrefill ? '' : '2.1x',
    nota_financiacion: noPrefill ? '' : 'Deuda sindicada refinanciada en 2023. Covenant DSCR mínimo 1.5x cumplido holgadamente.',
  })

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  // ── Lupa: Propietario (cuenta) sobre dynamics_accounts ──
  const [propSearch,  setPropSearch]  = useState('')
  const [showPropDD,  setShowPropDD]  = useState(false)
  const [propResults, setPropResults] = useState([])
  useEffect(() => {
    if (!propSearch || propSearch.length < 2) { setPropResults([]); return }
    let cancel = false
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('dynamics_accounts')
        .select('dynamics_id, nombre, tipo, sector')
        .ilike('nombre', `%${propSearch}%`)
        .order('nombre')
        .limit(10)
      if (!cancel) setPropResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [propSearch])

  // ── Lupa: Activo (para vincular desde la lista o cambiar el actual) ──
  const [activoSearch,  setActivoSearch]  = useState('')
  const [showActivoDD,  setShowActivoDD]  = useState(false)
  const [activoResults, setActivoResults] = useState([])
  useEffect(() => {
    if (!activoSearch || activoSearch.length < 2) { setActivoResults([]); return }
    let cancel = false
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('activos')
        .select('ref, nombre, direccion, propietario, zona, uso')
        .ilike('nombre', `%${activoSearch}%`)
        .order('nombre')
        .limit(10)
      if (!cancel) setActivoResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [activoSearch])
  const [linkedActivoRef, setLinkedActivoRef] = useState(null)
  const linkActivo = (a) => {
    set('activo',           a.nombre || '')
    set('activo_direccion', a.direccion || '')
    if (a.propietario) set('propietario', a.propietario)
    if (a.zona)        set('zona', a.zona)
    if (a.uso)         set('uso', a.uso)
    setLinkedActivoRef(a.ref || null)
    setActivoSearch('')
    setShowActivoDD(false)
  }

  const plusvaliaNum = form.valoracion_actual && form.precio_compra
    ? (() => {
        const va = parseFloat(form.valoracion_actual.replace(/[^0-9.]/g,''))
        const pc = parseFloat(form.precio_compra.replace(/[^0-9.]/g,''))
        if (isNaN(va)||isNaN(pc)||pc===0) return '—'
        const diff = va - pc
        const pct  = ((diff/pc)*100).toFixed(1)
        return `${diff>0?'+':''}${diff.toFixed(0)} M€ (${diff>0?'+':''}${pct}%)`
      })()
    : '—'

  const [saving, setSaving] = useState(false)

  const handleSaveFromActivo = async () => {
    setSaveErr('')
    if (!form.propietario.trim()) { setSaveErr('El nombre del propietario es obligatorio'); return }
    if (!form.anyo_compra) { setSaveErr('El año de compra es obligatorio'); return }
    if (!form.trimestre)   { setSaveErr('El trimestre es obligatorio'); return }
    setSaving(true)
    const row = {
      id:                form.id,
      propietario:       form.propietario,
      activo:            form.activo,
      activo_ref:        params?.fromActivoRef || linkedActivoRef || null,
      zona:              form.zona || null,
      subzona:           form.subzona || null,
      superficie:        form.superficie ? parseFloat(form.superficie) : null,
      uso:               form.uso || null,
      area:              form.area || null,
      tipologia:         form.tipologia || null,
      anyo_compra:       form.anyo_compra ? parseInt(form.anyo_compra) : null,
      trimestre:         form.trimestre || null,
      precio_compra:     form.precio_compra || null,
      estado_activo:     form.estado_activo || null,
      regimen:           form.regimen || null,
      valoracion_actual: form.valoracion_actual || null,
      perfil:            form.perfil || null,
      estrategia:        form.estrategia || null,
      cap_rate:          form.cap_rate ? parseFloat(form.cap_rate) : null,
      yield_pct:         form.yield ? parseFloat(form.yield) : null,
      tir_objetivo:      form.tir_objetivo ? parseFloat(form.tir_objetivo) : null,
      horizonte_inv:     form.horizonte_inv ? parseInt(form.horizonte_inv) : null,
      ltv:               form.ltv ? parseFloat(form.ltv) : null,
      financiacion:      form.financiacion ? parseFloat(form.financiacion) : null,
      banco:             form.banco || null,
      tipo_deuda:        form.tipo_deuda || null,
      vencimiento_deuda: form.vencimiento_deuda || null,
      estado:            form.estado || 'Activo',
      responsable:       form.responsable || null,
      asset_manager:     form.asset_manager || null,
      cif:               form.cif || null,
      tipo_entidad:      form.tipo_entidad || null,
      pais:              form.pais || null,
      ciudad_sede:       form.ciudad_sede || null,
      email:             form.email || null,
      telefono:          form.telefono || null,
      contacto_principal: form.contacto_principal || null,
      observaciones:     form.observaciones || null,
    }
    const { error } = await supabase.from('propietarios').upsert(row)
    setSaving(false)
    if (error) { setSaveErr(error.message); return }

    navigate('ficha-activo', {
      ref: params?.fromActivoRef,
      tab: 'at-prop',
      newOwnerData: { ...row, sba: row.superficie },
      substituteOwner: params?.substituteOwner || false,
      previousOwner: params?.previousOwner || null,
    })
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="action-bar">
        {noPrefill ? (
          <>
            <button className="ab-btn save" onClick={handleSaveFromActivo} disabled={saving}>{saving ? 'Guardando...' : 'Guardar propietario'}</button>
            <button className="ab-btn" onClick={()=>navigate('ficha-activo',{
              ref: params?.fromActivoRef,
              tab: params?.fromActivoTab || 'at-stacking',
            })}>
              ← Volver a {params?.fromActivoNombre ? params.fromActivoNombre : 'activo'}
            </button>
            {saveErr && <span style={{fontSize:11,color:'var(--red)',marginLeft:8}}>{saveErr}</span>}
          </>
        ) : (
          <>
            <button className="ab-btn save">💾 Guardar</button>
            <button className="ab-btn">Nuevo</button>
            {propietarioReal?.estado === 'Activo' && (
              <button className="ab-btn" style={{color:'var(--amber)'}} onClick={() => { setDesactivarMode('desactivar'); setShowDesactivar(true) }}>⏸ Desactivar</button>
            )}
            {propietarioReal && propietarioReal.estado !== 'Activo' && (
              <button className="ab-btn" style={{color:'var(--green)'}} onClick={() => { setDesactivarMode('reactivar'); setShowDesactivar(true) }}>🔄 Reactivar</button>
            )}
            {!propietarioReal && (
              <button className="ab-btn" disabled style={{color:'var(--text4)', opacity:0.5}} title="Abre este propietario desde la lista para poder desactivarlo">⏸ Desactivar</button>
            )}
            <div className="ab-sep"/>
            <button className="ab-btn blue" onClick={()=>navigate('ficha-activo')}>Ver activo</button>
            <button className="ab-btn blue" onClick={()=>navigate('ficha-arrendatario')}>🔑 Ver arrendatarios</button>
            <button className="ab-btn blue" onClick={()=>navigate('mandatos')}>📄 Mandatos</button>
            <button className="ab-btn" onClick={()=>navigate('propietarios')}>← Volver</button>
          </>
        )}
        <div className="ab-sep"/>
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
        {(()=>{
          const getPropConfig = () => ({
            title: form.propietario,
            subtitle: `Informe de propietario · ${form.tipo_entidad} · ${form.perfil}`,
            coverMetrics: [
              { label: 'Perfil inversor', value: form.perfil },
              { label: 'Cap Rate', value: `${form.cap_rate}%` },
              { label: 'Yield', value: `${form.yield}%` },
              { label: 'Valoración actual', value: form.valoracion_actual },
              { label: 'Plusvalía latente', value: form.plusvalia_latente },
            ],
            sections: [
              {
                title: 'Identificación del propietario',
                type: 'kpis',
                data: [
                  { label: 'ID', value: form.id },
                  { label: 'CIF / NIF', value: form.cif },
                  { label: 'Tipo entidad', value: form.tipo_entidad },
                  { label: 'País', value: form.pais },
                  { label: 'Ciudad sede', value: form.ciudad_sede },
                  { label: 'Estado', value: form.estado },
                  { label: 'Perfil inversor', value: form.perfil },
                  { label: 'Responsable', value: form.responsable },
                ],
              },
              {
                title: 'Activo vinculado',
                type: 'kpis',
                data: [
                  { label: 'Activo', value: form.activo },
                  { label: 'Zona', value: form.zona },
                  { label: 'Uso', value: form.uso },
                  { label: 'Superficie (m²)', value: `${Number(form.superficie).toLocaleString('es-ES')} m²` },
                  { label: 'Régimen', value: form.regimen || '—' },
                  { label: 'Año compra', value: form.anyo_compra || '—' },
                  { label: 'Precio compra', value: form.precio_compra || '—' },
                  { label: 'Valoración actual', value: form.valoracion_actual || '—' },
                  { label: 'Plusvalía latente', value: form.plusvalia_latente || '—' },
                ],
              },
              {
                title: 'Condiciones de inversión',
                type: 'kpis',
                data: [
                  { label: 'Cap Rate actual', value: `${form.cap_rate}%` },
                  { label: 'Yield', value: `${form.yield}%` },
                  { label: 'TIR objetivo', value: `${form.tir_objetivo}%` },
                  { label: 'Cap Rate compra', value: `${form.cap_rate_compra}%` },
                  { label: 'Horizonte inv. (años)', value: form.horizonte_inv },
                  { label: 'Estrategia', value: form.estrategia },
                  { label: '€/m² compra', value: `${Number(form.precio_m2_compra).toLocaleString('es-ES')} €` },
                  { label: '€/m² actual', value: `${Number(form.precio_m2_actual).toLocaleString('es-ES')} €` },
                  { label: 'Revalorización', value: form.revalorizacion },
                ],
              },
              {
                title: 'Financiación',
                type: 'kpis',
                data: [
                  { label: 'LTV', value: `${form.ltv}%` },
                  { label: 'Banco', value: form.banco || '—' },
                  { label: 'Tipo de deuda', value: form.tipo_deuda || '—' },
                  { label: 'Vencimiento', value: form.vencimiento_deuda || '—' },
                  { label: 'Tipo de interés', value: form.tipo_interes ? `${form.tipo_interes}%` : '—' },
                ],
              },
              {
                title: 'Histórico de propietarios',
                type: 'table',
                headers: ['Propietario', 'Activo', 'Tipo', 'Precio', 'Entrada', 'Salida', 'Rentabilidad'],
                rows: HIST_INIT.map(h=>[h.propietario, h.activo, h.tipo, h.precio, h.fecha_entrada, h.fecha_salida||'Actual', h.rentabilidad||'—']),
              },
            ],
          })
          return <ExportMenu getConfig={getPropConfig} />
        })()}
      </div>

      {/* Header */}
      <div className="ficha-wrap" style={{overflow:'auto'}}>
        <div className="ficha-main" style={{minWidth:0}}>

          {fromActivo && (
            <div style={{padding:'8px 14px',background:'#faf5ec',border:'1px solid #ece0c9',borderRadius:'var(--r)',marginBottom:12,display:'flex',alignItems:'center',gap:8,fontSize:11,color:'#5a4828'}}>
              <span style={{fontWeight:700}}>Nuevo propietario</span>
              <span style={{color:'#B08D57'}}>·</span>
              Activo: <strong>{params?.fromActivoNombre || params?.fromActivoRef}</strong>
              {params?.substituteOwner && params?.previousOwner && (
                <span style={{marginLeft:8,padding:'2px 8px',background:'#fef9c3',border:'1px solid #fde047',borderRadius:8,color:'#92400e',fontWeight:600,fontSize:10}}>
                  Sustitución de: {params.previousOwner}
                </span>
              )}
            </div>
          )}

          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#5a4828,#B08D57)',fontSize:18}}></div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'#faf5ec',color:'#6f5734',border:'1px solid #ece0c9',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>PROPIETARIO</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>{form.id}</span>
                  <span className="tag" style={{fontSize:9,background:PERFIL_COLOR[form.perfil]+'22',color:PERFIL_COLOR[form.perfil],border:`1px solid ${PERFIL_COLOR[form.perfil]}44`}}>{form.perfil}</span>
                  <span className="tag" style={{fontSize:9,background:ESTADO_COLOR[form.estado]+'22',color:ESTADO_COLOR[form.estado],border:`1px solid ${ESTADO_COLOR[form.estado]}44`}}>{form.estado}</span>
                </div>
                <div className="ah-name">{form.propietario}</div>
                <div className="ah-sub">{form.activo} · {form.zona} · {form.superficie} m² · {form.anyo_compra}/{form.trimestre}</div>
              </div>

              {/* KPIs económicos a la derecha del título */}
              <div style={{ display:'flex', alignItems:'stretch', gap:0, flexShrink:0, border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', background:'var(--surface)' }}>
                {(() => {
                  const ltvNum = parseFloat(form.ltv) || 0
                  const items = [
                    { lbl:'Precio compra',  val: form.precio_compra || '—',                                     sub:'€',          color:'var(--text1)' },
                    { lbl:'Valoración',     val: form.valoracion_actual || '—',                                 sub:'€ actual',   color:'var(--green)' },
                    { lbl:'Plusvalía',      val: plusvaliaNum || '—',                                            sub:'latente',    color: plusvaliaNum.startsWith('+') ? 'var(--green)' : 'var(--red)' },
                    { lbl:'Cap Rate',       val: form.cap_rate ? `${form.cap_rate}%` : '—',                     sub:'actual',     color:'var(--accent)' },
                    { lbl:'Yield',          val: form.yield ? `${form.yield}%` : '—',                            sub:'NOI/V',      color:'var(--purple)' },
                    { lbl:'LTV',            val: form.ltv ? `${form.ltv}%` : '—',                                sub:'leverage',   color: ltvNum > 55 ? 'var(--amber)' : 'var(--text1)' },
                  ]
                  return items.map((k, i) => (
                    <div key={k.lbl} style={{ padding:'10px 14px', textAlign:'center', minWidth:88, borderLeft: i === 0 ? 'none' : '1px solid var(--border)' }}>
                      <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{k.lbl}</div>
                      <div style={{ fontSize:20, fontWeight:800, fontFamily:'var(--mono)', color:k.color, lineHeight:1 }}>{k.val}</div>
                      <div style={{ fontSize:9, color:'var(--text4)', marginTop:3 }}>{k.sub}</div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {TABS.map((t,i)=>(
              <div key={t} className={`tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>{TAB_LABELS[i]}</div>
            ))}
          </div>

          {/* TAB: DATOS */}
          {tab==='datos' && (
            <div className="tab-content active">
              <div className="info-pad" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,alignItems:'start'}}>

                {/* Col 1: Propietario */}
                <div className="va-meta-card" style={{ overflow:'visible' }}>
                  <div className="va-meta-head"><span className="dot"/>Propietario</div>
                  <div style={{padding:'10px 14px'}}>
                    <div className="kf-grid">
                      <KF label="ID" value={form.id} mono/>
                      <KF label="Propietario (cuenta)">
                        {form.propietario ? (
                          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',background:'var(--accent-lt)',width:'100%'}}>
                            <span style={{fontWeight:600,color:'var(--accent)',fontSize:12,flex:1}}>{form.propietario}</span>
                            <button onClick={()=>set('propietario','')} style={{fontSize:11,color:'var(--text4)',background:'none',border:'none',cursor:'pointer'}}>✕</button>
                          </div>
                        ) : (
                          <div style={{position:'relative'}}>
                            <input
                              className="kf-inp"
                              placeholder="🔍 Buscar cuenta..."
                              value={propSearch}
                              onChange={e => { setPropSearch(e.target.value); setShowPropDD(true) }}
                              onFocus={() => setShowPropDD(true)}
                              onBlur={() => setTimeout(() => setShowPropDD(false), 200)}
                              style={{ fontStyle: propSearch ? 'normal' : 'italic', width:'100%' }}
                            />
                            {showPropDD && propSearch.length >= 2 && (
                              <div style={{position:'absolute',top:'100%',left:0,right:0,minWidth:280,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.18)',zIndex:9999,maxHeight:240,overflowY:'auto',marginTop:2}}>
                                {propResults.length === 0 ? (
                                  <div style={{padding:'10px 12px',color:'var(--text4)',fontSize:11}}>Sin resultados</div>
                                ) : propResults.map(a => (
                                  <div key={a.dynamics_id} onMouseDown={() => { set('propietario', a.nombre); setPropSearch(''); setShowPropDD(false) }}
                                    style={{padding:'7px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',fontSize:11}}>
                                    <div style={{fontWeight:600}}>{a.nombre}</div>
                                    <div style={{color:'var(--text4)',fontSize:10,marginTop:2}}>{[a.tipo, a.sector].filter(Boolean).join(' · ') || a.dynamics_id}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </KF>
                      <KF label="CIF / NIF" value={form.cif} set={(v)=>set('cif',v)} mono/>
                      <KF label="Tipo entidad" value={form.tipo_entidad} set={(v)=>set('tipo_entidad',v)}/>
                      <KF label="País" value={form.pais} set={(v)=>set('pais',v)}/>
                      <KF label="Ciudad sede" value={form.ciudad_sede} set={(v)=>set('ciudad_sede',v)}/>
                      <KF label="Perfil inversor">
                        <select className="kf-sel" value={form.perfil} onChange={e=>set('perfil',e.target.value)}>
                          {['Core','Value-add','Oportunista','Institucional','Privado'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Estado">
                        <select className="kf-sel" value={form.estado} onChange={e=>set('estado',e.target.value)}>
                          {['Activo','Inactivo','En desinversión','Vendido'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Asset manager" value={form.asset_manager} set={(v)=>set('asset_manager',v)}/>
                      <KF label="Responsable Savills">
                        <select className="kf-sel" value={form.responsable} onChange={e=>set('responsable',e.target.value)}>
                          {['Sierra Alvaro','GOMEZ Ignacio','García Marta'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                    </div>
                    <div style={{marginTop:10}}>
                      <div className="rp-lbl">Contacto principal</div>
                      <input className="kf-inp" value={form.contacto_principal} onChange={e=>set('contacto_principal',e.target.value)} style={{width:'100%',marginTop:3}}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
                      <div>
                        <div className="rp-lbl">Email</div>
                        <input className="kf-inp" value={form.email} onChange={e=>set('email',e.target.value)} style={{width:'100%',marginTop:3}}/>
                      </div>
                      <div>
                        <div className="rp-lbl">Teléfono</div>
                        <input className="kf-inp" value={form.telefono} onChange={e=>set('telefono',e.target.value)} style={{width:'100%',marginTop:3}}/>
                      </div>
                    </div>
                    <div style={{marginTop:10}}>
                      <div className="rp-lbl">Observaciones</div>
                      <textarea className="kf-inp" value={form.observaciones} onChange={e=>set('observaciones',e.target.value)} rows={4} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                    </div>
                    <div style={{marginTop:12}}>
                      <div className="rp-lbl" style={{marginBottom:6}}>Usos principales</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                        {USOS_PROPIETARIO.map(u=>{
                          const active = usos.includes(u)
                          return (
                            <button key={u} onClick={()=>toggleUso(u)} style={{
                              fontSize:10,padding:'3px 9px',borderRadius:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600,border:'1px solid',
                              background: active ? 'var(--accent-lt)' : 'var(--gray-lt)',
                              color: active ? 'var(--accent)' : 'var(--text3)',
                              borderColor: active ? 'var(--accent-bd)' : 'var(--border)',
                            }}>{u}</button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Col 2: Activo vinculado */}
                <div className="va-meta-card" style={{ overflow:'visible' }}>
                  <div className="va-meta-head accent-purple"><span className="dot"/>Activo vinculado</div>
                  <div style={{padding:'10px 14px'}}>
                    <div className="kf-grid">
                      <KF label="Activo">
                        {form.activo ? (
                          <div style={{display:'inline-flex',alignItems:'center',gap:6,width:'100%'}}>
                            <span className="asset-link" style={{cursor:'pointer',flex:1,textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:2}} onClick={()=>navigate('ficha-activo', params?.fromActivoRef ? { ref: params.fromActivoRef } : undefined)}>{form.activo} ↗</span>
                            <button onClick={() => { set('activo',''); set('activo_direccion',''); set('zona',''); set('uso','') }} style={{fontSize:11,color:'var(--text4)',background:'none',border:'none',cursor:'pointer'}} title="Cambiar activo">✕</button>
                          </div>
                        ) : (
                          <div style={{position:'relative'}}>
                            <input
                              className="kf-inp"
                              placeholder="🔍 Buscar activo..."
                              value={activoSearch}
                              onChange={e => { setActivoSearch(e.target.value); setShowActivoDD(true) }}
                              onFocus={() => setShowActivoDD(true)}
                              onBlur={() => setTimeout(() => setShowActivoDD(false), 200)}
                              style={{ fontStyle: activoSearch ? 'normal' : 'italic', width:'100%' }}
                            />
                            {showActivoDD && activoSearch.length >= 2 && (
                              <div style={{position:'absolute',top:'100%',left:0,right:0,minWidth:280,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.18)',zIndex:9999,maxHeight:240,overflowY:'auto',marginTop:2}}>
                                {activoResults.length === 0 ? (
                                  <div style={{padding:'10px 12px',color:'var(--text4)',fontSize:11}}>Sin resultados</div>
                                ) : activoResults.map(a => (
                                  <div key={a.ref} onMouseDown={() => linkActivo(a)}
                                    style={{padding:'7px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',fontSize:11}}>
                                    <div style={{fontWeight:600}}>{a.nombre}</div>
                                    <div style={{color:'var(--text4)',fontSize:10,marginTop:2}}>{[a.ref, a.uso, a.zona].filter(Boolean).join(' · ')}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </KF>
                      <KF label="Dirección">
                        {form.activo_direccion
                          ? <span style={{ color:'var(--text2)' }}>{form.activo_direccion}</span>
                          : <span style={{fontStyle:'italic', color:'var(--text4)'}}>por completar</span>}
                      </KF>
                      <KF label="Zona" value={form.zona} set={(v)=>set('zona',v)}/>
                      <KF label="Sub-zona" value={form.subzona} set={(v)=>set('subzona',v)}/>
                      <KF label="Superficie" value={form.superficie} set={(v)=>set('superficie',v)} mono suffix="m²"/>
                      <KF label="Uso" value={form.uso} set={(v)=>set('uso',v)}/>
                      <KF label="Área">
                        <select className="kf-sel" value={form.area} onChange={e=>set('area',e.target.value)}>
                          {['CBD','Centro','Descentralizado','Periferia'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Tipología op.">
                        <select className="kf-sel" value={form.tipologia} onChange={e=>set('tipologia',e.target.value)}>
                          {['Asset deal','Share deal'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Año compra" value={form.anyo_compra} set={(v)=>set('anyo_compra',v)} mono/>
                      <KF label="Trimestre">
                        <select className="kf-sel" value={form.trimestre} onChange={e=>set('trimestre',e.target.value)}>
                          {['Q1','Q2','Q3','Q4'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Estado activo">
                        <select className="kf-sel" value={form.estado_activo} onChange={e=>set('estado_activo',e.target.value)}>
                          {['Ocupado','Vacío','En bruto','En reforma'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Régimen de prop." value={form.regimen} set={(v)=>set('regimen',v)}/>
                    </div>
                    <div style={{marginTop:12,background:'var(--gray-lt)',borderRadius:6,padding:10}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Valoración</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <div>
                          <div className="rp-lbl">Precio compra</div>
                          <input className="kf-inp" value={form.precio_compra} onChange={e=>set('precio_compra',e.target.value)} style={{width:'100%',marginTop:3,fontFamily:'var(--mono)',fontWeight:700}}/>
                        </div>
                        <div>
                          <div className="rp-lbl">Valoración actual</div>
                          <input className="kf-inp" value={form.valoracion_actual} onChange={e=>set('valoracion_actual',e.target.value)} style={{width:'100%',marginTop:3,fontFamily:'var(--mono)',fontWeight:700,color:'var(--green)'}}/>
                        </div>
                        <div>
                          <div className="rp-lbl">€/m² compra</div>
                          <input className="kf-inp" value={form.precio_m2_compra} onChange={e=>set('precio_m2_compra',e.target.value)} style={{width:'100%',marginTop:3,fontFamily:'var(--mono)'}}/>
                        </div>
                        <div>
                          <div className="rp-lbl">€/m² actual</div>
                          <input className="kf-inp" value={form.precio_m2_actual} onChange={e=>set('precio_m2_actual',e.target.value)} style={{width:'100%',marginTop:3,fontFamily:'var(--mono)'}}/>
                        </div>
                      </div>
                      <div style={{marginTop:8,padding:'6px 10px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:5}}>
                        <span style={{fontSize:11,color:'var(--text3)'}}>Plusvalía latente: </span>
                        <span style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:plusvaliaNum.startsWith('+')?'var(--green)':'var(--red)'}}>{plusvaliaNum}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Col 3: Financiación */}
                <div className="va-meta-card">
                  <div className="va-meta-head accent-green"><span className="dot"/>Financiación y estrategia</div>
                  <div style={{padding:'10px 14px'}}>
                    <div className="kf-grid">
                      <KF label="LTV %" value={form.ltv} set={(v)=>set('ltv',v)} mono
                        extra={<span style={{fontSize:10,color:parseFloat(form.ltv)>55?'var(--amber)':'var(--green)',fontWeight:700,marginLeft:4}}>{parseFloat(form.ltv)>55?'⚠ Alto':'✓ OK'}</span>}
                      />
                      <KF label="Financiación %" value={form.financiacion} set={(v)=>set('financiacion',v)} mono/>
                      <KF label="Banco / entidad" value={form.banco} set={(v)=>set('banco',v)}/>
                      <KF label="Tipo de deuda" value={form.tipo_deuda} set={(v)=>set('tipo_deuda',v)}/>
                      <KF label="Importe del préstamo" value={form.loan_amount} set={(v)=>set('loan_amount',v)} mono/>
                      <KF label="Vencimiento deuda" value={form.vencimiento_deuda} set={(v)=>set('vencimiento_deuda',v)} mono/>
                      <KF label="Tipo de interés" value={form.tipo_interes} set={(v)=>set('tipo_interes',v)}/>
                      <KF label="Cobertura" value={form.cobertura} set={(v)=>set('cobertura',v)}/>
                      <KF label="DSCR" value={form.dscr} set={(v)=>set('dscr',v)} mono/>
                    </div>
                    <div style={{marginTop:10}}>
                      <div className="rp-lbl">Nota financiación</div>
                      <textarea className="kf-inp" value={form.nota_financiacion} onChange={e=>set('nota_financiacion',e.target.value)} rows={3} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                    </div>

                    <div style={{marginTop:14,borderTop:'1px solid var(--border)',paddingTop:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Estrategia inversión</div>
                      <div className="kf-grid">
                        <KF label="Estrategia">
                          <select className="kf-sel" value={form.estrategia} onChange={e=>set('estrategia',e.target.value)}>
                            {['Hold','Add value','Desinvertir','Refinanciar','Renovar contrato'].map(o=><option key={o}>{o}</option>)}
                          </select>
                        </KF>
                        <KF label="TIR objetivo %" value={form.tir_objetivo} set={(v)=>set('tir_objetivo',v)} mono/>
                        <KF label="Horizonte (años)" value={form.horizonte_inv} set={(v)=>set('horizonte_inv',v)} mono/>
                      </div>
                      <div style={{marginTop:8}}>
                        <div className="rp-lbl">Nota estrategia</div>
                        <textarea className="kf-inp" value={form.nota_estrategia} onChange={e=>set('nota_estrategia',e.target.value)} rows={3} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: CONDICIONES */}
          {tab==='condiciones' && (
            <div className="tab-content active">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

                <div>
                  <div className="rp-sec">Métricas de inversión</div>
                  <div className="info-pad">
                    <div className="kf-grid">
                      <KF label="Cap Rate entrada %" value={form.cap_rate_compra} set={(v)=>set('cap_rate_compra',v)} mono/>
                      <KF label="Cap Rate actual %" value={form.cap_rate} set={(v)=>set('cap_rate',v)} mono/>
                      <KF label="Yield actual %" value={form.yield} set={(v)=>set('yield',v)} mono/>
                      <KF label="TIR objetivo %" value={form.tir_objetivo} set={(v)=>set('tir_objetivo',v)} mono/>
                      <KF label="Revalorización" value={form.revalorizacion} mono
                        extra={<span style={{fontSize:11,fontWeight:700,color:form.revalorizacion.startsWith('+')?'var(--green)':'var(--red)',marginLeft:4}}>{form.revalorizacion.startsWith('+')?'▲':'▼'}</span>}
                      />
                      <KF label="Horizonte inversión (años)" value={form.horizonte_inv} set={(v)=>set('horizonte_inv',v)} mono/>
                    </div>

                    <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                      {[
                        {label:'Cap Rate compra',val:`${form.cap_rate_compra}%`,color:'var(--text2)'},
                        {label:'Cap Rate actual',val:`${form.cap_rate}%`,color:'var(--accent)'},
                        {label:'Compresión',val:`-${(parseFloat(form.cap_rate_compra)-parseFloat(form.cap_rate)).toFixed(1)}pp`,color:'var(--green)'},
                      ].map(m=>(
                        <div key={m.label} style={{background:'var(--gray-lt)',borderRadius:6,padding:'8px 10px',textAlign:'center'}}>
                          <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{m.label}</div>
                          <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--mono)',color:m.color}}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="rp-sec">Estrategia y desinversión</div>
                  <div className="info-pad">
                    <div className="kf-grid">
                      <KF label="Estrategia actual">
                        <select className="kf-sel" value={form.estrategia} onChange={e=>set('estrategia',e.target.value)}>
                          {['Hold','Add value','Desinvertir','Refinanciar','Renovar contrato'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Perfil inversor">
                        <select className="kf-sel" value={form.perfil} onChange={e=>set('perfil',e.target.value)}>
                          {['Core','Value-add','Oportunista','Institucional','Privado'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                    </div>
                    <div style={{marginTop:10}}>
                      <div className="rp-lbl">Nota estrategia</div>
                      <textarea className="kf-inp" value={form.nota_estrategia} onChange={e=>set('nota_estrategia',e.target.value)} rows={5} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                    </div>
                    <div style={{marginTop:12,padding:10,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6}}>
                      <div style={{fontSize:10,fontWeight:700,color:'#16a34a',marginBottom:6}}>ACCIONES COMERCIALES</div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start',textAlign:'left'}} onClick={()=>navigate('ficha-mandato')}>📄 Crear mandato de venta</button>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start',textAlign:'left'}} onClick={()=>navigate('demandas')}>🔍 Buscar comprador activo</button>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start',textAlign:'left'}} onClick={()=>navigate('ficha-oferta')}>📧 Emitir oferta de venta</button>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start',textAlign:'left'}} onClick={()=>navigate('ficha-negociacion')}>Iniciar negociación</button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: HISTÓRICO DE ACTIVOS — activos que ha tenido este propietario */}
          {tab==='historico' && (
            <div className="tab-content active">
              <div style={{marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:12,color:'var(--text3)'}}>Activos que este propietario ha tenido en cartera — cuando un activo se desinviste, queda registrado aquí.</div>
                <button className="tbtn prim" style={{fontSize:11}} onClick={()=>{}}>+ Registrar desinversión</button>
              </div>

              {hist.length===0 ? (
                <div style={{textAlign:'center',padding:'40px 0',color:'var(--text4)',fontSize:12}}>Sin registros históricos para este activo.</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {hist.map(h=>(
                    <div key={h.id} style={{border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'}}>
                      <div style={{background:'var(--gray-lt)',padding:'10px 14px',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid var(--border)'}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:13}}>{h.propietario}</div>
                          <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{h.activo} · {h.fecha_entrada} → {h.fecha_salida} · {h.duracion}</div>
                        </div>
                        <span className="tag tag-blue" style={{fontSize:9}}>{h.tipo}</span>
                        <span style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:13,color:'var(--text1)'}}>{h.precio}</span>
                        <span style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:h.rentabilidad.startsWith('+')?'var(--green)':'var(--red)'}}>{h.rentabilidad}</span>
                      </div>
                      <div style={{padding:'10px 14px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                        <div><div className="rp-lbl">Cap Rate entrada</div><div style={{fontFamily:'var(--mono)',fontWeight:600,marginTop:2}}>{h.cap_rate_entrada}%</div></div>
                        <div><div className="rp-lbl">Cap Rate salida</div><div style={{fontFamily:'var(--mono)',fontWeight:600,marginTop:2,color:'var(--accent)'}}>{h.cap_rate_salida}%</div></div>
                        <div><div className="rp-lbl">Responsable</div><div style={{fontSize:12,marginTop:2}}>{h.responsable}</div></div>
                        <div><div className="rp-lbl">Motivo desinversión</div><div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{h.motivo}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{marginTop:24}}>
                <div className="rp-sec">Registro de actividad</div>
                <div className="info-pad" style={{padding:0,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr style={{background:'var(--gray-lt)'}}>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'var(--text4)',fontSize:10,textTransform:'uppercase',letterSpacing:'.04em'}}>Fecha</th>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'var(--text4)',fontSize:10,textTransform:'uppercase',letterSpacing:'.04em'}}>Usuario</th>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'var(--text4)',fontSize:10,textTransform:'uppercase',letterSpacing:'.04em'}}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {log.map((l,i)=>(
                        <tr key={i} style={{borderTop:'1px solid var(--border)'}}>
                          <td style={{padding:'7px 12px',fontFamily:'var(--mono)',color:'var(--text3)'}}>{l.fecha}</td>
                          <td style={{padding:'7px 12px',fontWeight:600}}>{l.usuario}</td>
                          <td style={{padding:'7px 12px',color:'var(--text2)'}}>{l.accion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Bloque Análisis — fusionado dentro de "Condiciones e inversión" */}
          {tab==='condiciones' && (
            <div className="tab-content active">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

                <div>
                  <div className="rp-sec">Evolución de métricas</div>
                  <div className="info-pad">
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      {[
                        {anyo:'2018',cap:'7.2',yield:'7.5',val:'130 M€',nota:'Adquisición'},
                        {anyo:'2019',cap:'7.0',yield:'7.3',val:'133 M€',nota:''},
                        {anyo:'2020',cap:'6.5',yield:'6.8',val:'131 M€',nota:'Impacto Covid'},
                        {anyo:'2021',cap:'6.0',yield:'6.3',val:'136 M€',nota:''},
                        {anyo:'2022',cap:'5.8',yield:'6.1',val:'138 M€',nota:''},
                        {anyo:'2023',cap:'5.4',yield:'5.7',val:'142 M€',nota:'Refinanciación'},
                        {anyo:'2024',cap:'5.2',yield:'5.5',val:'143 M€',nota:''},
                        {anyo:'2025',cap:'5.1',yield:'5.4',val:'145 M€',nota:'Valoración actual'},
                      ].map((row,i,arr)=>(
                        <div key={row.anyo} style={{display:'grid',gridTemplateColumns:'50px 60px 60px 80px 1fr',gap:8,padding:'5px 10px',background:i===arr.length-1?'var(--accent-lt)':'transparent',borderRadius:4,fontSize:11,alignItems:'center'}}>
                          <div style={{fontWeight:700,fontFamily:'var(--mono)'}}>{row.anyo}</div>
                          <div style={{fontFamily:'var(--mono)',color:'var(--accent)'}}>{row.cap}%</div>
                          <div style={{fontFamily:'var(--mono)',color:'var(--purple)'}}>{row.yield}%</div>
                          <div style={{fontFamily:'var(--mono)',fontWeight:600}}>{row.val}</div>
                          <div style={{fontSize:10,color:'var(--text4)'}}>{row.nota}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:8,padding:'4px 10px',background:'var(--gray-lt)',borderRadius:4,fontSize:10,color:'var(--text4)',display:'flex',gap:16}}>
                      <span>Cap Rate · <span style={{color:'var(--accent)'}}>acum.</span></span>
                      <span>Yield · <span style={{color:'var(--purple)'}}>acum.</span></span>
                      <span>Valoración · <span style={{fontWeight:700}}>€</span></span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="rp-sec">Comparativa de mercado</div>
                  <div className="info-pad">
                    <div style={{marginBottom:10,fontSize:11,color:'var(--text3)'}}>Métricas del activo vs. benchmark de mercado (M-30 / Descentralizado)</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {[
                        {met:'Cap Rate',activo:5.1,mercado:5.3,unit:'%'},
                        {met:'Yield',activo:5.4,mercado:5.6,unit:'%'},
                        {met:'Precio €/m²',activo:3088,mercado:2900,unit:''},
                        {met:'LTV',activo:45,mercado:50,unit:'%'},
                      ].map(m=>{
                        const better = m.met==='Precio €/m²' ? m.activo > m.mercado : m.activo < m.mercado
                        return (
                          <div key={m.met} style={{display:'grid',gridTemplateColumns:'120px 1fr 80px',gap:8,alignItems:'center'}}>
                            <div style={{fontSize:11,fontWeight:600}}>{m.met}</div>
                            <div style={{position:'relative',height:14,background:'var(--gray-lt)',borderRadius:10,overflow:'hidden'}}>
                              <div style={{position:'absolute',left:0,top:0,height:'100%',width:`${Math.min((m.activo/Math.max(m.activo,m.mercado))*100,100)}%`,background:better?'var(--green)':'var(--amber)',borderRadius:10,transition:'width .4s'}}/>
                              <div style={{position:'absolute',left:`${(m.mercado/Math.max(m.activo,m.mercado))*100}%`,top:0,bottom:0,width:2,background:'var(--accent)',opacity:.5}}/>
                            </div>
                            <div style={{fontSize:11,fontFamily:'var(--mono)',textAlign:'right',color:better?'var(--green)':'var(--amber)',fontWeight:700}}>
                              {m.activo}{m.unit} <span style={{color:'var(--text4)',fontWeight:400,fontSize:9}}>vs {m.mercado}{m.unit}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{marginTop:14,padding:'8px 10px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,fontSize:11,color:'#15803d'}}>
                      <strong>Posición relativa:</strong> Activo con métricas por debajo del mercado en cap rate y yield (mejor posición para el propietario). Precio €/m² por encima de la media.
                    </div>
                  </div>

                  <div style={{marginTop:12}}>
                    <div className="rp-sec">Portfolio del propietario</div>
                    <div className="info-pad" style={{padding:0,overflow:'hidden'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                        <thead>
                          <tr style={{background:'var(--gray-lt)'}}>
                            {['Activo','Área','Sup. m²','Cap Rate','Estado'].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',fontWeight:700,color:'var(--text4)',fontSize:10,textTransform:'uppercase',letterSpacing:'.04em'}}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {activo:'P.E Avalon',area:'Descentralizado',sup:'46.956',cap:'5.1%',estado:'Ocupado',current:true},
                            {activo:'Albatros Edif. D',area:'Periferia',sup:'53.944',cap:'5.4%',estado:'Ocupado'},
                            {activo:'Torre Glòries',area:'Descentralizado',sup:'18.500',cap:'4.8%',estado:'Ocupado'},
                            {activo:'Park Logístico Getafe',area:'Periferia',sup:'24.000',cap:'6.2%',estado:'Ocupado'},
                          ].map(r=>(
                            <tr key={r.activo} style={{borderTop:'1px solid var(--border)',background:r.current?'var(--accent-lt)':'transparent'}}>
                              <td style={{padding:'6px 10px'}}><span className="asset-link" onClick={()=>navigate('ficha-activo')} style={{cursor:'pointer'}}>{r.activo}</span>{r.current&&<span style={{marginLeft:4,fontSize:8,background:'var(--accent)',color:'#fff',borderRadius:3,padding:'0 4px'}}>ESTE</span>}</td>
                              <td style={{padding:'6px 10px',color:'var(--text3)'}}>{r.area}</td>
                              <td style={{padding:'6px 10px',fontFamily:'var(--mono)'}}>{r.sup}</td>
                              <td style={{padding:'6px 10px',fontFamily:'var(--mono)',color:'var(--accent)',fontWeight:700}}>{r.cap}</td>
                              <td style={{padding:'6px 10px'}}><span className="tag tag-green" style={{fontSize:9}}>{r.estado}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: CONFIDENCIALIDAD — formato canónico Oferta */}
          {tab==='conf' && (
            <ConfidencialidadPanel
              entityLabel="propietario"
              confidential={propConfidential}
              onToggle={setPropConfidential}
              hiddenFields={['Cuenta','Datos de contacto','Condiciones de inversión','Activos del portfolio','Documentación']}
              visibleFields={['Tipo de entidad','Estado','Equipo','País','Información básica']}
              authorizedUsers={propAuthUsers}
              onAddUser={(newUser) => {
                const [name, team] = [newUser.split('·')[0].trim(), newUser.split('·')[1]?.trim() || '']
                const ini = name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                const today = new Date().toLocaleDateString('es-ES')
                setPropAuthUsers(prev => [...prev, { name, team, role:'Autorizado', initials:ini, bg:'#f0fdf4', color:'#166534', granted:today }])
              }}
              onRemoveUser={(idx) => setPropAuthUsers(prev => prev.filter((_,j) => j !== idx))}
              responsable="Sierra Álvaro"
            />
          )}

        </div>

        {/* Barra lateral derecha — coherencia con FichaArrendatario y FichaActivo */}
        <div className="ficha-right">
          <div className="rp-sec">
            <div className="rp-lbl">Estado del propietario</div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:ESTADO_COLOR[form.estado]||'var(--text4)'}}/>
              <span style={{fontSize:13,fontWeight:700,color:ESTADO_COLOR[form.estado]||'var(--text4)'}}>{form.estado}</span>
            </div>
            <button className="acc-btn" onClick={()=>navigate('ficha-activo')}>Ver activo</button>
            <button className="acc-btn" onClick={()=>navigate('ficha-actividad')}>Registrar actividad</button>
            <button className="acc-btn" onClick={()=>navigate('portfolios')}>Ver portfolio</button>
          </div>

          <div className="rp-sec">
            <div className="rp-lbl">KPIs económicos</div>
            <div className="kf-grid">
              <div className="kf"><div className="kf-lbl">Precio compra</div><div className="kf-val" style={{fontFamily:'var(--mono)'}}>{form.precio_compra || '—'}</div></div>
              <div className="kf"><div className="kf-lbl">Valoración actual</div><div className="kf-val" style={{fontFamily:'var(--mono)',color:'var(--green)'}}>{form.valoracion_actual || '—'}</div></div>
              <div className="kf"><div className="kf-lbl">Plusvalía latente</div><div className="kf-val" style={{fontFamily:'var(--mono)',color:plusvaliaNum.startsWith('+')?'var(--green)':'var(--red)'}}>{plusvaliaNum || '—'}</div></div>
              <div className="kf"><div className="kf-lbl">Cap Rate</div><div className="kf-val" style={{color:'var(--accent)'}}>{form.cap_rate ? `${form.cap_rate}%` : '—'}</div></div>
              <div className="kf"><div className="kf-lbl">Yield</div><div className="kf-val" style={{color:'var(--purple)'}}>{form.yield ? `${form.yield}%` : '—'}</div></div>
              <div className="kf"><div className="kf-lbl">LTV</div><div className="kf-val" style={{color:parseFloat(form.ltv)>55?'var(--amber)':'var(--text2)'}}>{form.ltv ? `${form.ltv}%` : '—'}</div></div>
            </div>
          </div>

          <div className="rp-sec">
            <div className="rp-lbl">Estrategia de inversión</div>
            <div className="info-block" style={{padding:0}}>
              {[
                {k:'Estrategia', v:form.estrategia},
                {k:'TIR objetivo', v:form.tir_objetivo ? `${form.tir_objetivo}%` : '—'},
                {k:'Horizonte', v:form.horizonte_inv ? `${form.horizonte_inv} años` : '—'},
                {k:'Año compra', v:form.anyo_compra ? `${form.anyo_compra} ${form.trimestre || ''}` : '—'},
              ].map((r,i) => (
                <div key={i} className="ir" style={{padding:'6px 10px'}}>
                  <span className="ir-k">{r.k}</span>
                  <span className="ir-v">{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-sec">
            <div className="rp-lbl">Activo vinculado</div>
            <div style={{background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 10px',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{form.activo}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>{form.zona}{form.subzona ? ` · ${form.subzona}` : ''} · {form.superficie} m²</div>
            </div>
          </div>

          <div className="rp-sec">
            <div className="rp-lbl">Contacto principal</div>
            <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>{form.contacto_principal || '—'}</div>
            <div style={{fontSize:10,color:'var(--accent)'}}>{form.email || '—'}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>{form.telefono || '—'}</div>
          </div>
        </div>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Propietario" refNombre="Merlín Properties SOCIMI" onClose={() => setShowTarea(false)} />}
      {showDesactivar && propietarioReal && (
        <DesactivarPropietarioModal
          propietarioId={propietarioReal.id}
          propietarioNombre={propietarioReal.nombre}
          modo={desactivarMode}
          onClose={() => setShowDesactivar(false)}
          onSuccess={() => { setShowDesactivar(false); setReloadKey(k => k + 1) }}
        />
      )}
    </div>
  )
}

function KpiMini({label,value,color}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:2}}>
      <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</div>
      <div style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:color||'var(--text1)'}}>{value}</div>
    </div>
  )
}

function KF({label,value,set,mono,suffix,extra,children,placeholder='por completar'}) {
  if (children) return (
    <div className="kf">
      <div className="rp-lbl">{label}</div>
      {children}
    </div>
  )
  const empty = !value
  return (
    <div className="kf">
      <div className="rp-lbl">{label}</div>
      {set
        ? <input className="kf-inp" placeholder={placeholder} value={value||''} onChange={e=>set(e.target.value)}
            style={{ ...(mono?{fontFamily:'var(--mono)'}:{}), ...(empty?{fontStyle:'italic'}:{}) }}/>
        : <div className="kf-val" style={{ ...(mono?{fontFamily:'var(--mono)'}:{}), ...(empty?{fontStyle:'italic',color:'var(--text4)'}:{}) }}>
            {value || placeholder}
            {value && suffix && <span style={{fontSize:10,marginLeft:3,color:'var(--text4)'}}>{suffix}</span>}
            {extra}
          </div>
      }
    </div>
  )
}
