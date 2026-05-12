import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'
import { isSupabaseRef } from '../components/FichaPendienteSupabase'
import FichaPropuestaSupabase from './FichaPropuestaSupabase'

const TABS = ['datos','equipos','trazabilidad','docs','resumen']
const TAB_LABELS = ['Datos del proyecto','Equipos y participantes','Trazabilidad','Documentación','Resumen']

const TIPOS = ['Pitch','Valoración','Propuesta de servicios','Mandato comercial','Consultoría','Urbanismo','Proyecto de arquitectura / workplace']
const ESTADOS = ['Activo','Standby','Cancelado','Adjudicado']
const LINEAS = ['Oficinas','Capital Markets','Retail','Industrial/Logística','Residencial','Hoteles','Alternativo']
const ROLES = ['Responsable','Originador','Soporte','Coordinador','Analista']

const EQUIPOS_DISPONIBLES = [
  'Leasing Oficinas Madrid',
  'Leasing Oficinas Barcelona',
  'Capital Markets',
  'Retail',
  'Industrial / Logística',
  'Residencial',
  'Hoteles',
  'Workplace & Consulting',
  'Urbanismo',
  'Valoraciones',
  'Property Management',
]

const USUARIOS_POR_EQUIPO = {
  'Leasing Oficinas Madrid':  ['Sierra Alvaro','GOMEZ Ignacio','García Marta','Ruiz Pablo'],
  'Leasing Oficinas Barcelona':['Puig Anna','Ferrer Marc','Vidal Laura'],
  'Capital Markets':          ['Moreno Carlos','López Sara','Díaz Javier'],
  'Retail':                   ['Martín Elena','Sanz David'],
  'Industrial / Logística':   ['Jiménez Rosa','Navarro Luis'],
  'Residencial':              ['Torres Beatriz','Ramos Andrés'],
  'Hoteles':                  ['Vega Carmen','Gil Pedro'],
  'Workplace & Consulting':   ['Blanco Sofía','Ortiz Miguel'],
  'Urbanismo':                ['Castro Isabel','Reyes Fernando'],
  'Valoraciones':             ['Molina Patricia','Herrera Jorge'],
  'Property Management':      ['Romero Ana','Serrano Roberto'],
}

const EQUIPOS_INIT = [
  { equipo:'Leasing Oficinas Madrid', usuario:'Sierra Alvaro', rol:'Responsable' },
  { equipo:'Capital Markets', usuario:'Moreno Carlos', rol:'Soporte' },
]

const TRAZABILIDAD_INIT = [
  { fecha:'07/04/2026 09:14', usuario:'Sierra Alvaro', accion:'Cambio de estado', detalle:'Activo → Activo', campo:'estado' },
  { fecha:'01/04/2026 11:30', usuario:'GOMEZ Ignacio', accion:'Actualización fees', detalle:'280.000 € → 320.000 €', campo:'fees' },
  { fecha:'28/03/2026 16:45', usuario:'Sierra Alvaro', accion:'Vinculación activo', detalle:'Torre Norte Castellana añadido', campo:'activo' },
  { fecha:'20/03/2026 10:00', usuario:'Sierra Alvaro', accion:'Creación del proyecto', detalle:'PRY-2501 creado', campo:'sistema' },
]

const ESTADO_COLOR = { 'Activo':'var(--green)', 'Standby':'var(--amber)', 'Cancelado':'var(--red)', 'Adjudicado':'var(--accent)' }
const TIPO_COLOR   = { 'Pitch':'var(--accent)', 'Valoración':'var(--teal)', 'Propuesta de servicios':'var(--purple)', 'Mandato comercial':'var(--amber)', 'Urbanismo':'var(--text3)', 'Proyecto de arquitectura / workplace':'var(--text3)' }

export default function FichaPropuesta() {
  const { params } = useNav()
  if (isSupabaseRef(params.id)) {
    return <FichaPropuestaSupabase refOrId={params.id} />
  }
  return <FichaPropuestaMock />
}

function FichaPropuestaMock() {
  const { navigate } = useNav()
  const [tab, setTab] = useState('datos')

  const [form, setForm] = useState({
    id: 'PRY-2501',
    nombre: 'Pitch BBVA Torre Norte',
    tipo: 'Pitch',
    linea: 'Capital Markets',
    estado: 'Activo',
    empresa: 'BBVA SA',
    oportunidad: 'OP-2026-0078',
    oportunidad_nombre: 'Pitch Torre Norte BBVA · Capital Markets',
    demanda: '',
    creado_por: 'Sierra Alvaro',
    fecha_creacion: '20/03/2026',
    fecha_mod: '07/04/2026',
    fees: '320.000',
    fecha_cierre: '30/06/2026',
    probabilidad: '60',
    descripcion: 'Pitch para la comercialización en exclusiva de Torre Norte Castellana. Cliente objetivo BBVA para relocalización de sede corporativa. Estimación superficie 18.000-22.000 m².',
    notas_internas: 'Presentación prevista para el 15 de abril. Preparar comparativa de mercado CBD.',
    convertido_mandato: false,
    mandato_ref: '',
  })

  const [activos, setActivos] = useState(['Torre Norte Castellana'])
  const [ofertas, setOfertas] = useState([])
  const [newActivo, setNewActivo] = useState('')
  const [newOferta, setNewOferta] = useState('')

  const [equipos, setEquipos]             = useState(EQUIPOS_INIT)
  const [trazabilidad, setTrazabilidad]   = useState(TRAZABILIDAD_INIT)
  const [showAddEquipo, setShowAddEquipo] = useState(false)
  const [newEq, setNewEq]                 = useState({ equipo:'', usuario:'', rol:'Soporte' })
  const [prevEstado, setPrevEstado]       = useState(form.estado)
  const [showConvert, setShowConvert]     = useState(false)

  const set = (k, v) => {
    if (k === 'estado' && v !== prevEstado) {
      const entry = {
        fecha: new Date().toLocaleString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',',''),
        usuario: 'Sierra Alvaro',
        accion: 'Cambio de estado',
        detalle: `${prevEstado} → ${v}`,
        campo: 'estado',
      }
      setTrazabilidad(t => [entry, ...t])
      setPrevEstado(v)
      if (v === 'Adjudicado') setShowConvert(true)
    }
    setForm(p => ({ ...p, [k]: v }))
  }

  const addEquipo = () => {
    if (!newEq.equipo || !newEq.usuario) return
    setEquipos(e => [...e, { ...newEq }])
    setNewEq({ equipo:'', usuario:'', rol:'Soporte' })
    setShowAddEquipo(false)
  }

  const removeEquipo = (i) => setEquipos(e => e.filter((_,idx)=>idx!==i))

  const [showTarea, setShowTarea] = useState(false)
  const [docs, setDocs] = useState([
    {id:'DOC-001',nombre:'Presentación Pitch BBVA v1.pdf',tipo:'Presentación',fecha:'20/03/2026',size:'4.2 MB',u:'Sierra Alvaro'},
    {id:'DOC-002',nombre:'Comparativa mercado CBD Q1 2026.xlsx',tipo:'Análisis',fecha:'28/03/2026',size:'1.1 MB',u:'GOMEZ Ignacio'},
    {id:'DOC-003',nombre:'NDA firmado BBVA.pdf',tipo:'Legal',fecha:'20/03/2026',size:'0.3 MB',u:'Sierra Alvaro'},
  ])
  const [showUploadDoc, setShowUploadDoc] = useState(false)
  const [newDocNombre, setNewDocNombre]   = useState('')
  const [newDocTipo,   setNewDocTipo]     = useState('Presentación')

  const feesNum = parseFloat(form.fees.replace(/[^0-9]/g,'')) || 0
  const feesAdj = feesNum * (parseInt(form.probabilidad)/100)

  const convertirMandato = () => {
    const ref = `MAN-${Date.now().toString().slice(-4)}`
    set('convertido_mandato', true)
    set('mandato_ref', ref)
    const entry = {
      fecha: new Date().toLocaleString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',',''),
      usuario: 'Sierra Alvaro',
      accion: 'Conversión a mandato',
      detalle: `Mandato ${ref} generado automáticamente`,
      campo: 'sistema',
    }
    setTrazabilidad(t => [entry, ...t])
    setShowConvert(false)
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn" style={{color:'var(--red)'}}>Cancelar proyecto</button>
        <div className="ab-sep"/>
        {form.convertido_mandato
          ? <button className="ab-btn blue" onClick={()=>navigate('ficha-mandato')}>📄 Ver mandato {form.mandato_ref}</button>
          : <>
              <button className="ab-btn" style={{background:'var(--accent)',color:'#fff',border:'none'}} onClick={()=>{set('estado','Adjudicado');setShowConvert(true)}}>🏆 Marcar adjudicado</button>
              <button className="ab-btn" style={{background:'var(--purple)',color:'#fff',border:'none'}} onClick={()=>navigate('ficha-mandato',{nuevo:true})}>📋 Transformar en mandato</button>
            </>
        }
        <button className="ab-btn" onClick={()=>navigate('propuestas')}>← Volver</button>
        <div className="ab-sep"/>
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
      </div>

      {/* Banner adjudicado */}
      {showConvert && !form.convertido_mandato && (
        <div style={{background:'linear-gradient(90deg,#14532d,#166534)',color:'#fff',padding:'10px 20px',display:'flex',alignItems:'center',gap:12,borderBottom:'2px solid #16a34a'}}>
          <span style={{fontSize:18}}>🏆</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13}}>¡Proyecto adjudicado!</div>
            <div style={{fontSize:11,opacity:.85}}>Puedes convertirlo automáticamente en un mandato comercial con trazabilidad completa.</div>
          </div>
          <button onClick={convertirMandato} style={{background:'#16a34a',color:'#fff',border:'1px solid #4ade80',borderRadius:6,padding:'6px 16px',cursor:'pointer',fontWeight:700,fontSize:12,fontFamily:'inherit'}}>
            Convertir a mandato →
          </button>
          <button onClick={()=>setShowConvert(false)} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:16,opacity:.6}}>✕</button>
        </div>
      )}

      {form.convertido_mandato && (
        <div style={{background:'#f0fdf4',borderBottom:'1px solid #bbf7d0',padding:'8px 20px',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:13}}>✅</span>
          <span style={{fontSize:12,color:'#15803d',fontWeight:600}}>Convertido en mandato <span style={{fontFamily:'var(--mono)'}}>{form.mandato_ref}</span></span>
          <button className="asset-link" style={{fontSize:11,marginLeft:4}} onClick={()=>navigate('ficha-mandato')}>Ver mandato →</button>
        </div>
      )}

      <div className="ficha-wrap" style={{overflow:'auto'}}>
        <div className="ficha-main" style={{minWidth:0}}>

          {/* Header */}
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#7c3aed,#a78bfa)',fontSize:18}}>📋</div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'#f5f3ff',color:'#7c3aed',border:'1px solid #ddd6fe',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>PROPUESTA</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>{form.id}</span>
                  <span className="tag" style={{fontSize:9,background:TIPO_COLOR[form.tipo]+'22',color:TIPO_COLOR[form.tipo],border:`1px solid ${TIPO_COLOR[form.tipo]}44`}}>{form.tipo}</span>
                  <span className="tag" style={{fontSize:9,background:ESTADO_COLOR[form.estado]+'22',color:ESTADO_COLOR[form.estado],border:`1px solid ${ESTADO_COLOR[form.estado]}44`}}>{form.estado}</span>
                </div>
                <div className="ah-name">{form.nombre}</div>
                <div className="ah-sub">{form.empresa} · {form.linea} · Creado {form.fecha_creacion} por {form.creado_por}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:24,marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)',flexWrap:'wrap'}}>
              <KpiMini label="Fees potenciales" value={`${parseInt(form.fees.replace(/[^0-9]/g,'')||0).toLocaleString('es-ES')} €`} color="var(--green)"/>
              <KpiMini label="Probabilidad" value={`${form.probabilidad}%`} color="var(--accent)"/>
              <KpiMini label="Fees ajustados" value={`${Math.round(feesAdj).toLocaleString('es-ES')} €`} color="var(--purple)"/>
              <KpiMini label="Cierre estimado" value={form.fecha_cierre||'—'} color="var(--text2)"/>
              <KpiMini label="Equipos" value={equipos.length} color="var(--teal)"/>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {TABS.map((t,i)=>(
              <div key={t} className={`tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>{TAB_LABELS[i]}</div>
            ))}
          </div>

          {/* TAB DATOS */}
          {tab==='datos' && (
            <div className="tab-content active">
              <div className="info-pad">

                {/* ─── FILA 1: Identificación | Datos económicos ─── */}
                <div className="va-two-col">
                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{color:'var(--pdb-blue)'}}>●</span> Identificación</h3>
                    </div>
                    <div className="va-kv-list" style={{paddingBottom:14}}>
                      <div className="ir"><span className="ir-k">ID</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{form.id}</span></div>
                      <div className="ir"><span className="ir-k">Nombre del proyecto</span><span className="ir-v" style={{fontWeight:600}}><input className="kf-inp" value={form.nombre} onChange={e=>set('nombre',e.target.value)} style={{width:'100%'}}/></span></div>
                      <div className="ir"><span className="ir-k">Tipo de proyecto</span><span className="ir-v">
                        <select className="kf-sel" value={form.tipo} onChange={e=>set('tipo',e.target.value)} style={{minWidth:160}}>
                          {TIPOS.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </span></div>
                      <div className="ir"><span className="ir-k">Línea de negocio</span><span className="ir-v">
                        <select className="kf-sel" value={form.linea} onChange={e=>set('linea',e.target.value)} style={{minWidth:160}}>
                          {LINEAS.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </span></div>
                      <div className="ir"><span className="ir-k">Estado</span><span className="ir-v">
                        <select className="kf-sel" value={form.estado} onChange={e=>set('estado',e.target.value)} style={{color:ESTADO_COLOR[form.estado],fontWeight:700,minWidth:140}}>
                          {ESTADOS.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </span></div>
                      <div className="ir"><span className="ir-k">Creado por</span><span className="ir-v"><input className="kf-inp" value={form.creado_por} onChange={e=>set('creado_por',e.target.value)} style={{width:'100%'}}/></span></div>
                      <div className="ir"><span className="ir-k">Fecha creación</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{form.fecha_creacion}</span></div>
                      <div className="ir"><span className="ir-k">Última modificación</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{form.fecha_mod}</span></div>
                    </div>
                  </div>

                  <div className="va-meta-card" style={{ marginBottom:0 }}>
                    <div className="va-meta-head accent-green"><span className="dot"/>Datos económicos</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Fees potenciales (€)</span><span className="ir-v"><input className="kf-inp" value={form.fees} onChange={e=>set('fees',e.target.value)} style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:13,width:140,textAlign:'right'}}/></span></div>
                      <div className="ir"><span className="ir-k">Fecha estimada cierre</span><span className="ir-v"><input className="kf-inp" value={form.fecha_cierre} onChange={e=>set('fecha_cierre',e.target.value)} placeholder="DD/MM/AAAA" style={{fontFamily:'var(--mono)',width:140,textAlign:'right'}}/></span></div>
                      <div className="ir"><span className="ir-k">Probabilidad de éxito</span><span className="ir-v" style={{display:'flex',alignItems:'center',gap:8,minWidth:200}}>
                        <input type="range" min={0} max={100} step={5} value={form.probabilidad} onChange={e=>set('probabilidad',e.target.value)} style={{flex:1,accentColor:'var(--accent)'}}/>
                        <span style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:13,color:'var(--accent)',minWidth:42,textAlign:'right'}}>{form.probabilidad}%</span>
                      </span></div>
                      <div className="ir"><span className="ir-k">Fees brutos</span><span className="ir-v" style={{fontFamily:'var(--mono)',fontWeight:700}}>{parseInt(form.fees.replace(/[^0-9]/g,'')||0).toLocaleString('es-ES')} €</span></div>
                      <div className="ir"><span className="ir-k">Fees ajustados (× prob.)</span><span className="ir-v" style={{fontFamily:'var(--mono)',color:'var(--green)',fontWeight:700}}>{Math.round(feesAdj).toLocaleString('es-ES')} €</span></div>
                    </div>
                  </div>
                </div>

                {/* ─── FILA 2: Descripción y notas | Acciones rápidas ─── */}
                <div className="va-two-col">
                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico">▭</span> Descripción y notas</h3>
                    </div>
                    <div style={{padding:'4px 20px 16px'}}>
                      <div className="rp-lbl">Descripción del proyecto</div>
                      <textarea className="kf-inp" value={form.descripcion} onChange={e=>set('descripcion',e.target.value)} rows={4} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                      <div className="rp-lbl" style={{marginTop:14}}>Notas internas</div>
                      <textarea className="kf-inp" value={form.notas_internas} onChange={e=>set('notas_internas',e.target.value)} rows={3} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                    </div>
                  </div>
                  <div className="va-meta-card" style={{ marginBottom:0 }}>
                    <div className="va-meta-head accent-purple"><span className="dot"/>Acciones rápidas</div>
                    <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:8}}>
                      <button className="ab-btn blue" style={{justifyContent:'flex-start'}} onClick={()=>navigate('ficha-actividad')}>📝 Crear actividad vinculada</button>
                      <button className="ab-btn blue" style={{justifyContent:'flex-start'}} onClick={()=>navigate('ficha-oferta')}>📧 Emitir oferta</button>
                      <button className="ab-btn blue" style={{justifyContent:'flex-start'}} onClick={()=>navigate('ficha-demanda')}>🔍 Crear demanda</button>
                      {form.estado==='Adjudicado'&&!form.convertido_mandato&&(
                        <button style={{background:'var(--green)',color:'#fff',border:'none',borderRadius:5,padding:'7px 14px',cursor:'pointer',fontWeight:700,fontSize:11,fontFamily:'inherit',textAlign:'left'}} onClick={convertirMandato}>
                          🏆 Convertir en mandato →
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── VINCULACIONES ── */}
                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico" style={{color:'var(--pdb-purple)'}}>●</span> Vinculaciones</h3>
                    <span className="hint">Oportunidad y Cuenta obligatorias</span>
                  </div>
                  <div style={{padding:'4px 20px 16px'}}>
                    <div style={{marginBottom:4,fontSize:10,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em'}}>Obligatorios</div>

                    {/* Oportunidad — FK obligatorio · Dynamics */}
                    <div style={{marginBottom:10,padding:'8px 10px',border:'2px solid #fde68a',borderRadius:6,background:'#fef3c7'}}>
                      <div className="rp-lbl" style={{color:'#7c2d12',display:'flex',alignItems:'center',gap:6}}>
                        <span style={{width:14,height:14,borderRadius:3,background:'#0078d4',color:'#fff',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>D</span>
                        Oportunidad ★
                      </div>
                      <input className="kf-inp" value={form.oportunidad} onChange={e=>set('oportunidad',e.target.value)} style={{width:'100%',marginTop:4,fontWeight:600}} placeholder="Ej: OP-2026-0078"/>
                      {form.oportunidad_nombre && <div style={{fontSize:10,color:'#7c2d12',marginTop:3}}>{form.oportunidad_nombre}</div>}
                      <div style={{fontSize:9,color:'#92400e',marginTop:3}}>Una Propuesta SIEMPRE cuelga de una Oportunidad existente en Dynamics. Sin Oportunidad no puede guardarse.</div>
                    </div>

                    <div style={{marginBottom:12,padding:'8px 10px',border:'2px solid var(--accent-bd)',borderRadius:6,background:'var(--accent-lt)'}}>
                      <div className="rp-lbl" style={{color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span>Empresa / Cuenta ★</span>
                        {form.oportunidad && <span style={{fontSize:9,fontWeight:700,color:'#15803d',background:'#dcfce7',padding:'2px 7px',borderRadius:6}}>🔒 heredada de Oportunidad</span>}
                      </div>
                      <input className="kf-inp" value={form.empresa} onChange={e=>!form.oportunidad && set('empresa',e.target.value)} disabled={!!form.oportunidad} style={{width:'100%',marginTop:4,fontWeight:600,background:form.oportunidad?'var(--gray-lt)':undefined,cursor:form.oportunidad?'not-allowed':undefined}} placeholder="Buscar cuenta en Dynamics..."/>
                      <div style={{fontSize:9,color:'var(--text4)',marginTop:3}}>{form.oportunidad ? 'Cuenta heredada automáticamente desde la Oportunidad seleccionada · No editable manualmente' : 'Campo obligatorio — vinculado a Dynamics CRM'}</div>
                    </div>

                    <div style={{marginBottom:4,fontSize:10,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginTop:12}}>Opcional</div>
                    <KF label="Demanda (si aplica)">
                      <div style={{display:'flex',gap:4,alignItems:'center'}}>
                        <input className="kf-inp" value={form.demanda} onChange={e=>set('demanda',e.target.value)} style={{flex:1}} placeholder="Ej: DEM-0078"/>
                        {form.demanda && <button className="ra p" style={{fontSize:9,padding:'2px 6px'}} onClick={()=>navigate('ficha-demanda')}>Ver</button>}
                      </div>
                    </KF>

                    {/* Activos múltiples */}
                    <div style={{marginTop:8}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Activos vinculados</div>
                      {activos.map((a,i)=>(
                        <div key={i} style={{display:'flex',gap:4,alignItems:'center',marginBottom:4}}>
                          <span style={{fontSize:10,color:'var(--teal)',fontWeight:600,flex:1,padding:'3px 8px',background:'var(--teal-lt)',border:'1px solid var(--teal-bd)',borderRadius:4}}>🏛 {a}</span>
                          <button className="ra p" style={{fontSize:9,padding:'2px 5px'}} onClick={()=>navigate('ficha-activo')}>Ver</button>
                          <button className="ra" style={{color:'var(--red)',fontSize:10}} onClick={()=>setActivos(v=>v.filter((_,idx)=>idx!==i))}>✕</button>
                        </div>
                      ))}
                      <div style={{display:'flex',gap:4,marginTop:4}}>
                        <input className="kf-inp" value={newActivo} onChange={e=>setNewActivo(e.target.value)} placeholder="Ref. o nombre del activo..." style={{flex:1,fontSize:11}}/>
                        <button className="ra p" style={{fontSize:10,padding:'3px 8px'}} onClick={()=>{if(newActivo.trim()){setActivos(v=>[...v,newActivo.trim()]);setNewActivo('')}}}>+ Añadir</button>
                      </div>
                    </div>

                    {/* Ofertas múltiples */}
                    <div style={{marginTop:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Ofertas vinculadas</div>
                      {ofertas.length===0 && <div style={{fontSize:10,color:'var(--text4)',padding:'4px 0'}}>Sin ofertas — opcional</div>}
                      {ofertas.map((o,i)=>(
                        <div key={i} style={{display:'flex',gap:4,alignItems:'center',marginBottom:4}}>
                          <span style={{fontSize:10,color:'var(--amber)',fontWeight:600,flex:1,padding:'3px 8px',background:'var(--amber-lt)',border:'1px solid var(--amber-bd)',borderRadius:4,fontFamily:'var(--mono)'}}>📧 {o}</span>
                          <button className="ra p" style={{fontSize:9,padding:'2px 5px'}} onClick={()=>navigate('ficha-oferta')}>Ver</button>
                          <button className="ra" style={{color:'var(--red)',fontSize:10}} onClick={()=>setOfertas(v=>v.filter((_,idx)=>idx!==i))}>✕</button>
                        </div>
                      ))}
                      <div style={{display:'flex',gap:4,marginTop:4}}>
                        <input className="kf-inp" value={newOferta} onChange={e=>setNewOferta(e.target.value)} placeholder="Ej: OLB001" style={{flex:1,fontSize:11,fontFamily:'var(--mono)'}}/>
                        <button className="ra p" style={{fontSize:10,padding:'3px 8px'}} onClick={()=>{if(newOferta.trim()){setOfertas(v=>[...v,newOferta.trim()]);setNewOferta('')}}}>+ Añadir</button>
                      </div>
                    </div>

                    {/* Mapa de vinculaciones */}
                    <div style={{marginTop:14,background:'var(--gray-lt)',borderRadius:8,padding:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:10}}>Mapa de vinculaciones</div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {[
                          {icon:'🏢',label:'Empresa',value:form.empresa,color:'var(--accent)',req:true},
                          {icon:'🏛',label:`Activos (${activos.length})`,value:activos.length>0?activos.join(', '):'—',color:'var(--teal)',req:false},
                          {icon:'🔍',label:'Demanda',value:form.demanda||'—',color:'var(--purple)',req:false},
                          {icon:'📧',label:`Ofertas (${ofertas.length})`,value:ofertas.length>0?ofertas.join(', '):'—',color:'var(--amber)',req:false},
                        ].map(v=>(
                          <div key={v.label} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:5,border:`1px solid ${v.value&&v.value!=='—'?v.color+'44':'var(--border)'}`,background:v.value&&v.value!=='—'?v.color+'11':'transparent'}}>
                            <span style={{fontSize:13}}>{v.icon}</span>
                            <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',width:70,flexShrink:0}}>{v.label}{v.req&&<span style={{color:'var(--red)'}}>*</span>}</span>
                            <span style={{fontSize:11,fontWeight:600,color:v.value&&v.value!=='—'?v.color:'var(--text4)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.value||'—'}</span>
                            {v.value&&v.value!=='—'&&<span style={{width:6,height:6,borderRadius:'50%',background:v.color,flexShrink:0,display:'inline-block'}}/>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB EQUIPOS */}
          {tab==='equipos' && (
            <div className="tab-content active">
            <div className="info-pad">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <div style={{fontSize:12,color:'var(--text3)'}}>Equipos internos participantes en este proyecto</div>
                <button className="tbtn prim" style={{fontSize:11}} onClick={()=>setShowAddEquipo(v=>!v)}>+ Añadir equipo</button>
              </div>

              {showAddEquipo && (
                <div style={{marginBottom:14,padding:14,border:'1px solid var(--accent-bd)',borderRadius:8,background:'var(--accent-lt)',display:'flex',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Equipo</span>
                    <select className="fsel" value={newEq.equipo} onChange={e=>setNewEq(p=>({...p,equipo:e.target.value,usuario:''}))}>
                      <option value="">Seleccionar equipo...</option>
                      {EQUIPOS_DISPONIBLES.filter(eq=>!equipos.find(e=>e.equipo===eq)).map(eq=><option key={eq}>{eq}</option>)}
                    </select>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Usuario</span>
                    <select className="fsel" value={newEq.usuario} onChange={e=>setNewEq(p=>({...p,usuario:e.target.value}))} disabled={!newEq.equipo}>
                      <option value="">Seleccionar usuario...</option>
                      {(USUARIOS_POR_EQUIPO[newEq.equipo]||[]).map(u=><option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Rol</span>
                    <select className="fsel" value={newEq.rol} onChange={e=>setNewEq(p=>({...p,rol:e.target.value}))}>
                      {ROLES.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <button className="tbtn prim" onClick={addEquipo} disabled={!newEq.equipo||!newEq.usuario}>Añadir</button>
                  <button className="tbtn" onClick={()=>setShowAddEquipo(false)}>Cancelar</button>
                </div>
              )}

              {equipos.length===0 ? (
                <div style={{textAlign:'center',padding:'40px 0',color:'var(--text4)',fontSize:12}}>Sin equipos asignados. Añade el primer equipo participante.</div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
                  {equipos.map((eq,i)=>(
                    <div key={i} style={{border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',background:'#fff'}}>
                      <div style={{background:'var(--gray-lt)',padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--border)'}}>
                        <div style={{fontWeight:700,fontSize:12}}>{eq.equipo}</div>
                        <button onClick={()=>removeEquipo(i)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text4)',fontSize:14,lineHeight:1}}>✕</button>
                      </div>
                      <div style={{padding:'10px 12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                          <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,flexShrink:0}}>
                            {eq.usuario.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontSize:12,fontWeight:600}}>{eq.usuario}</div>
                            <div style={{fontSize:10,color:'var(--text4)'}}>{eq.equipo}</div>
                          </div>
                        </div>
                        <div style={{display:'flex',justifyContent:'flex-end'}}>
                          <span className="tag tag-blue" style={{fontSize:9}}>{eq.rol}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Equipos disponibles */}
              <div style={{marginTop:24}}>
                <div className="ib-title">Equipos disponibles</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,padding:'8px 0'}}>
                  {EQUIPOS_DISPONIBLES.map(eq=>{
                    const asignado = equipos.find(e=>e.equipo===eq)
                    return (
                      <div key={eq} style={{padding:'4px 10px',borderRadius:12,border:`1px solid ${asignado?'var(--green)':'var(--border)'}`,background:asignado?'#f0fdf4':'transparent',fontSize:11,color:asignado?'var(--green)':'var(--text3)',display:'flex',alignItems:'center',gap:4}}>
                        {asignado&&<span style={{fontSize:10}}>✓</span>}
                        {eq}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            </div>
          )}

          {/* TAB TRAZABILIDAD */}
          {tab==='trazabilidad' && (
            <div className="tab-content active">
            <div className="info-pad">
              <div style={{marginBottom:12,fontSize:12,color:'var(--text3)'}}>Registro completo de cambios y acciones sobre este proyecto. Inmutable.</div>

              <div style={{position:'relative'}}>
                <div style={{position:'absolute',left:19,top:0,bottom:0,width:2,background:'var(--border)',zIndex:0}}/>
                <div style={{display:'flex',flexDirection:'column',gap:0}}>
                  {trazabilidad.map((t,i)=>{
                    const colorMap = { estado:'var(--accent)', fees:'var(--green)', activo:'var(--teal)', sistema:'var(--purple)', demanda:'var(--amber)', oferta:'var(--orange)' }
                    const iconMap  = { estado:'🔄', fees:'💰', activo:'🏛', sistema:'⚙', demanda:'🔍', oferta:'📧' }
                    const col = colorMap[t.campo]||'var(--text3)'
                    const ico = iconMap[t.campo]||'📝'
                    return (
                      <div key={i} style={{display:'flex',gap:14,position:'relative',paddingBottom:16}}>
                        <div style={{width:40,height:40,borderRadius:'50%',background:col+'22',border:`2px solid ${col}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,zIndex:1,background:'#fff',borderColor:col}}>
                          {ico}
                        </div>
                        <div style={{flex:1,paddingTop:6}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                            <span style={{fontWeight:700,fontSize:12}}>{t.accion}</span>
                            <span className="tag" style={{fontSize:9,background:col+'22',color:col,border:`1px solid ${col}44`}}>{t.campo}</span>
                          </div>
                          <div style={{fontSize:12,color:'var(--text2)',marginTop:3}}>{t.detalle}</div>
                          <div style={{fontSize:10,color:'var(--text4)',marginTop:2}}>{t.fecha} · {t.usuario}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            </div>
          )}

          {/* TAB DOCUMENTACIÓN */}
          {tab==='docs' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700}}>📁 Documentación del proyecto</div>
                <button className="ab-btn blue" style={{padding:'4px 12px',fontSize:10}} onClick={()=>setShowUploadDoc(v=>!v)}>+ Añadir documento</button>
              </div>

              {showUploadDoc && (
                <div style={{background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:12,marginBottom:12,display:'flex',gap:8,alignItems:'flex-end',flexWrap:'wrap'}}>
                  <div style={{display:'flex',flexDirection:'column',gap:3,flex:2,minWidth:200}}>
                    <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Nombre</span>
                    <input className="of-inp" style={{fontSize:11}} value={newDocNombre} onChange={e=>setNewDocNombre(e.target.value)} placeholder="Nombre del documento"/>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:3}}>
                    <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Tipo</span>
                    <select className="of-sel" style={{fontSize:11}} value={newDocTipo} onChange={e=>setNewDocTipo(e.target.value)}>
                      {['Presentación','Análisis','Legal','Propuesta','Informe','Plano','Foto','Otro'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <button className="ab-btn blue" style={{padding:'4px 12px',fontSize:10}} onClick={()=>{
                    if(!newDocNombre) return
                    const d = new Date()
                    setDocs(prev=>[...prev,{
                      id:`DOC-${String(prev.length+1).padStart(3,'0')}`,
                      nombre:newDocNombre, tipo:newDocTipo,
                      fecha:`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`,
                      size:'—', u:'Sierra Alvaro'
                    }])
                    setNewDocNombre('')
                    setShowUploadDoc(false)
                  }}>Guardar</button>
                  <button className="ab-btn" style={{padding:'4px 12px',fontSize:10}} onClick={()=>setShowUploadDoc(false)}>Cancelar</button>
                </div>
              )}

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
                {docs.map(doc=>{
                  const tipo_color = {Presentación:'var(--accent)',Análisis:'var(--teal)',Legal:'var(--red)',Propuesta:'var(--purple)',Informe:'var(--amber)',Plano:'var(--text2)',Foto:'var(--green)',Otro:'var(--text4)'}
                  const tipo_ico   = {Presentación:'📊',Análisis:'📈',Legal:'⚖️',Propuesta:'📋',Informe:'📄',Plano:'📐',Foto:'🖼',Otro:'📎'}
                  const col = tipo_color[doc.tipo]||'var(--text3)'
                  return (
                    <div key={doc.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'10px 12px',display:'flex',gap:10,alignItems:'flex-start',cursor:'pointer',transition:'border .15s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                      <div style={{fontSize:22,flexShrink:0,marginTop:2}}>{tipo_ico[doc.tipo]||'📎'}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:600,color:'var(--text1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{doc.nombre}</div>
                        <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap',alignItems:'center'}}>
                          <span style={{fontSize:9,padding:'1px 7px',borderRadius:8,background:col+'18',color:col,border:`1px solid ${col}33`,fontWeight:700}}>{doc.tipo}</span>
                          <span style={{fontSize:9,color:'var(--text4)'}}>{doc.fecha}</span>
                          <span style={{fontSize:9,color:'var(--text4)'}}>{doc.size}</span>
                        </div>
                        <div style={{fontSize:10,color:'var(--text3)',marginTop:3}}>{doc.u}</div>
                      </div>
                      <button onClick={(e)=>{e.stopPropagation();setDocs(prev=>prev.filter(d=>d.id!==doc.id))}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text4)',fontSize:12,padding:'0 2px',flexShrink:0}}>✕</button>
                    </div>
                  )
                })}
                {docs.length===0 && (
                  <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'var(--text4)',fontSize:12}}>No hay documentos. Añade el primero.</div>
                )}
              </div>
            </div></div>
          )}

          {/* TAB RESUMEN */}
          {tab==='resumen' && (
            <div className="tab-content active">
            <div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

                <div>
                  <div className="ib-title">Ficha resumen</div>
                  <div className="info-pad">
                    {[
                      {label:'ID', val:form.id, mono:true},
                      {label:'Nombre', val:form.nombre},
                      {label:'Tipo', val:form.tipo},
                      {label:'Línea de negocio', val:form.linea},
                      {label:'Estado', val:form.estado, color:ESTADO_COLOR[form.estado]},
                      {label:'Empresa', val:form.empresa},
                      {label:'Activos', val:activos.length>0?activos.join(', '):'—'},
                      {label:'Demanda', val:form.demanda||'—', mono:true},
                      {label:'Ofertas', val:ofertas.length>0?ofertas.join(', '):'—', mono:true},
                      {label:'Creado por', val:form.creado_por},
                      {label:'Fecha creación', val:form.fecha_creacion, mono:true},
                      {label:'Última modificación', val:form.fecha_mod, mono:true},
                    ].map(r=>(
                      <div key={r.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid var(--border)'}}>
                        <span style={{fontSize:11,color:'var(--text4)',fontWeight:600}}>{r.label}</span>
                        <span style={{fontSize:11,fontFamily:r.mono?'var(--mono)':'inherit',fontWeight:r.color?700:400,color:r.color||'var(--text1)'}}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="ib-title">Métricas y pipeline</div>
                  <div className="info-pad">
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                      {[
                        {label:'Fees brutos',val:`${parseInt(form.fees.replace(/[^0-9]/g,'')||0).toLocaleString('es-ES')} €`,color:'var(--text1)'},
                        {label:'Probabilidad',val:`${form.probabilidad}%`,color:'var(--accent)'},
                        {label:'Fees ajustados',val:`${Math.round(feesAdj).toLocaleString('es-ES')} €`,color:'var(--green)'},
                        {label:'Cierre estimado',val:form.fecha_cierre||'—',color:'var(--text2)'},
                      ].map(m=>(
                        <div key={m.label} style={{background:'var(--gray-lt)',borderRadius:6,padding:'10px 12px',textAlign:'center'}}>
                          <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{m.label}</div>
                          <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--mono)',color:m.color}}>{m.val}</div>
                        </div>
                      ))}
                    </div>

                    <div className="ib-title" style={{marginTop:4}}>Equipos ({equipos.length})</div>
                    {equipos.length===0
                      ? <div style={{fontSize:11,color:'var(--text4)',padding:'8px 0'}}>Sin equipos asignados</div>
                      : equipos.map((eq,i)=>(
                          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid var(--border)'}}>
                            <span style={{fontSize:11,fontWeight:600}}>{eq.usuario}</span>
                            <div style={{display:'flex',gap:4}}>
                              <span className="tag tag-blue" style={{fontSize:8}}>{eq.equipo.split(' ')[0]}</span>
                              <span className="tag tag-teal" style={{fontSize:8}}>{eq.rol}</span>
                            </div>
                          </div>
                        ))
                    }

                    {form.estado==='Adjudicado'&&(
                      <div style={{marginTop:16,padding:'12px 14px',background:form.convertido_mandato?'#f0fdf4':'linear-gradient(135deg,#14532d22,#16653422)',border:`1px solid ${form.convertido_mandato?'#bbf7d0':'#16a34a44'}`,borderRadius:8}}>
                        <div style={{fontWeight:700,fontSize:12,color:form.convertido_mandato?'#15803d':'var(--green)',marginBottom:4}}>
                          {form.convertido_mandato ? `✅ Mandato generado: ${form.mandato_ref}` : '🏆 Proyecto adjudicado'}
                        </div>
                        {!form.convertido_mandato&&(
                          <button onClick={convertirMandato} style={{marginTop:6,background:'var(--green)',color:'#fff',border:'none',borderRadius:5,padding:'6px 14px',cursor:'pointer',fontWeight:700,fontSize:11,fontFamily:'inherit'}}>
                            Convertir en mandato →
                          </button>
                        )}
                        {form.convertido_mandato&&(
                          <button className="asset-link" style={{fontSize:11,display:'block',marginTop:4}} onClick={()=>navigate('ficha-mandato')}>Ver mandato →</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
            </div>
          )}

        </div>

        {/* ─── Right sidebar: KPIs + IA · resumen vivo ─── */}
        <div className="ficha-right">
          {/* KPI principal · Probabilidad con barra */}
          <div className="rp-sec">
            <div className="rp-lbl">Probabilidad de éxito</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:6 }}>
              <span style={{ fontSize:24, fontWeight:700, color:'var(--accent)', fontFamily:'var(--mono)' }}>{form.probabilidad}%</span>
              <span style={{ fontSize:11, color:'var(--text3)' }}>de éxito</span>
            </div>
            <div style={{ background:'var(--gray-lt)', borderRadius:6, height:8, overflow:'hidden' }}>
              <div style={{ background:'var(--accent)', height:'100%', width:`${form.probabilidad}%`, transition:'width .25s ease' }}/>
            </div>
          </div>

          {/* Fees */}
          <div className="rp-sec">
            <div className="rp-lbl">Fees</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', marginBottom:3 }}>Brutos</div>
                <div style={{ fontSize:14, fontWeight:700, fontFamily:'var(--mono)' }}>{parseInt(form.fees.replace(/[^0-9]/g,'')||0).toLocaleString('es-ES')} €</div>
              </div>
              <div>
                <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', marginBottom:3 }}>Ajustados</div>
                <div style={{ fontSize:14, fontWeight:700, fontFamily:'var(--mono)', color:'var(--green)' }}>{Math.round(feesAdj).toLocaleString('es-ES')} €</div>
              </div>
            </div>
          </div>

          {/* Cierre estimado + días restantes */}
          <div className="rp-sec">
            <div className="rp-lbl">Cierre estimado</div>
            <div style={{ fontSize:14, fontWeight:700, fontFamily:'var(--mono)', marginBottom:4 }}>{form.fecha_cierre || '—'}</div>
            {(() => {
              if (!form.fecha_cierre) return null
              const m = form.fecha_cierre.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
              if (!m) return null
              const [, d, mo, y] = m
              const target = new Date(Number(y), Number(mo) - 1, Number(d))
              const diff = Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24))
              const color = diff < 0 ? 'var(--red)' : diff < 30 ? 'var(--amber)' : 'var(--green)'
              const label = diff < 0 ? `Hace ${-diff} días` : diff === 0 ? 'Hoy' : `En ${diff} días`
              return <div style={{ fontSize:11, color, fontWeight:600 }}>{label}</div>
            })()}
          </div>

          {/* Vinculaciones */}
          <div className="rp-sec">
            <div className="rp-lbl">Vinculaciones</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                <span style={{ color:'var(--text3)' }}>🏢 Cuenta</span>
                <span style={{ fontWeight:600, color: form.empresa ? 'var(--accent)' : 'var(--text4)', fontStyle: form.empresa ? 'normal' : 'italic' }}>{form.empresa || 'por completar'}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                <span style={{ color:'var(--text3)' }}>⚡ Oportunidad</span>
                <span style={{ fontWeight:600, fontFamily:'var(--mono)', color: form.oportunidad ? 'var(--text1)' : 'var(--text4)', fontStyle: form.oportunidad ? 'normal' : 'italic' }}>{form.oportunidad || 'por completar'}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                <span style={{ color:'var(--text3)' }}>🏛 Activos</span>
                <span style={{ fontWeight:600, color: activos.length>0 ? 'var(--teal)' : 'var(--text4)' }}>{activos.length}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                <span style={{ color:'var(--text3)' }}>📧 Ofertas</span>
                <span style={{ fontWeight:600, color: ofertas.length>0 ? 'var(--amber)' : 'var(--text4)' }}>{ofertas.length}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                <span style={{ color:'var(--text3)' }}>🔍 Demanda</span>
                <span style={{ fontWeight:600, fontFamily:'var(--mono)', color: form.demanda ? 'var(--purple)' : 'var(--text4)', fontStyle: form.demanda ? 'normal' : 'italic' }}>{form.demanda || '—'}</span>
              </div>
            </div>
          </div>

          {/* Equipos */}
          <div className="rp-sec">
            <div className="rp-lbl">Equipos participantes ({equipos.length})</div>
            {equipos.length === 0 ? (
              <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin equipos asignados</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {equipos.slice(0,4).map((eq,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>
                      {eq.usuario.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{eq.usuario}</div>
                      <div style={{ fontSize:9, color:'var(--text4)' }}>{eq.rol}</div>
                    </div>
                  </div>
                ))}
                {equipos.length > 4 && <div style={{ fontSize:10, color:'var(--text3)' }}>+ {equipos.length - 4} más</div>}
              </div>
            )}
          </div>

          {/* Asistente IA */}
          <div className="rp-sec">
            <div className="rp-lbl">Asistente IA</div>
            <div className="ai-box">
              <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Insight propuesta</span><span className="ai-badge">Tiempo real</span></div>
              <div className="ai-text">
                {(() => {
                  const p = parseInt(form.probabilidad) || 0
                  const fees = Math.round(feesAdj)
                  if (p >= 70) return `Probabilidad ${p}% — alta. Fees ajustados ${fees.toLocaleString('es-ES')} €. Confirma equipo y fecha de envío.`
                  if (p >= 40) return `Probabilidad ${p}% — media. Considera reforzar el pitch antes de ${form.fecha_cierre || 'cierre'}.`
                  return `Probabilidad ${p}% — baja. Revisa si compensa el esfuerzo o si conviene un enfoque distinto.`
                })()}
              </div>
              <div className="ai-cta">✎ Preguntar a la IA</div>
            </div>
          </div>

          {/* Estado */}
          <div className="rp-sec">
            <div className="rp-lbl">Estado del proyecto</div>
            <div style={{ padding:'8px 12px', borderRadius:6, background:ESTADO_COLOR[form.estado]+'22', border:`1px solid ${ESTADO_COLOR[form.estado]}55`, fontSize:12, fontWeight:700, color:ESTADO_COLOR[form.estado] }}>
              {form.estado}
            </div>
            {form.convertido_mandato && (
              <div style={{ marginTop:8, padding:'6px 10px', background:'#dcfce7', border:'1px solid #86efac', borderRadius:5, fontSize:10, color:'#15803d', fontWeight:600 }}>
                ✅ Mandato {form.mandato_ref}
              </div>
            )}
          </div>
        </div>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Propuesta" refNombre="PRY-2501 · Pitch BBVA Torre Norte" onClose={() => setShowTarea(false)} />}
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

function KF({label,value,set,mono,children}) {
  if (children) return (
    <div className="kf">
      <div className="rp-lbl">{label}</div>
      {children}
    </div>
  )
  return (
    <div className="kf">
      <div className="rp-lbl">{label}</div>
      {set
        ? <input className="kf-inp" value={value||''} onChange={e=>set(e.target.value)} style={mono?{fontFamily:'var(--mono)'}:{}}/>
        : <div className="kf-val" style={mono?{fontFamily:'var(--mono)'}:{}}>{value||'—'}</div>
      }
    </div>
  )
}
