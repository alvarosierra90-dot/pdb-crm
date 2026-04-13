import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'

const TABS = ['datos','equipos','trazabilidad','resumen']
const TAB_LABELS = ['📋 Datos del proyecto','👥 Equipos y participantes','🔄 Trazabilidad','📊 Resumen']

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
  const { navigate } = useNav()
  const [tab, setTab] = useState('datos')

  const [form, setForm] = useState({
    id: 'PRY-2501',
    nombre: 'Pitch BBVA Torre Norte',
    tipo: 'Pitch',
    linea: 'Capital Markets',
    estado: 'Activo',
    empresa: 'BBVA SA',
    activo: 'Torre Norte Castellana',
    demanda: '',
    oferta: '',
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
          : <button className="ab-btn" style={{background:'var(--accent)',color:'#fff',border:'none'}} onClick={()=>{set('estado','Adjudicado');setShowConvert(true)}}>🏆 Marcar adjudicado</button>
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
              <button key={t} className={`tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>{TAB_LABELS[i]}</button>
            ))}
          </div>

          {/* TAB DATOS */}
          {tab==='datos' && (
            <div className="tab-content active">
              <div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>

                {/* Col 1: Identificación */}
                <div>
                  <div className="ib-title">Identificación</div>
                  <div>
                    <div className="kf-grid">
                      <KF label="ID" value={form.id} mono/>
                      <KF label="Nombre del proyecto" value={form.nombre} set={v=>set('nombre',v)}/>
                      <KF label="Tipo de proyecto">
                        <select className="kf-sel" value={form.tipo} onChange={e=>set('tipo',e.target.value)}>
                          {TIPOS.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Línea de negocio">
                        <select className="kf-sel" value={form.linea} onChange={e=>set('linea',e.target.value)}>
                          {LINEAS.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Estado">
                        <select className="kf-sel" value={form.estado} onChange={e=>set('estado',e.target.value)} style={{color:ESTADO_COLOR[form.estado],fontWeight:700}}>
                          {ESTADOS.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Creado por" value={form.creado_por} set={v=>set('creado_por',v)}/>
                      <KF label="Fecha creación" value={form.fecha_creacion} mono/>
                      <KF label="Última modificación" value={form.fecha_mod} mono/>
                    </div>
                    <div style={{marginTop:10}}>
                      <div className="rp-lbl">Descripción del proyecto</div>
                      <textarea className="kf-inp" value={form.descripcion} onChange={e=>set('descripcion',e.target.value)} rows={4} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                    </div>
                    <div style={{marginTop:8}}>
                      <div className="rp-lbl">Notas internas</div>
                      <textarea className="kf-inp" value={form.notas_internas} onChange={e=>set('notas_internas',e.target.value)} rows={3} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                    </div>
                  </div>
                </div>

                {/* Col 2: Vinculaciones */}
                <div>
                  <div className="ib-title">Vinculaciones</div>
                  <div>
                    <div style={{marginBottom:4,fontSize:10,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em'}}>Obligatorio</div>
                    <div style={{marginBottom:12,padding:'8px 10px',border:'2px solid var(--accent-bd)',borderRadius:6,background:'var(--accent-lt)'}}>
                      <div className="rp-lbl" style={{color:'var(--accent)'}}>Empresa / Cuenta ★</div>
                      <input className="kf-inp" value={form.empresa} onChange={e=>set('empresa',e.target.value)} style={{width:'100%',marginTop:4,fontWeight:600}} placeholder="Buscar cuenta en Dynamics..."/>
                      <div style={{fontSize:9,color:'var(--text4)',marginTop:3}}>Campo obligatorio — vinculado a Dynamics CRM</div>
                    </div>

                    <div style={{marginBottom:4,fontSize:10,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginTop:12}}>Opcional</div>
                    <div className="kf-grid">
                      <KF label="Activo (si aplica)">
                        <div style={{display:'flex',gap:4,alignItems:'center'}}>
                          <input className="kf-inp" value={form.activo} onChange={e=>set('activo',e.target.value)} style={{flex:1}} placeholder="Buscar activo..."/>
                          {form.activo && <button className="ra p" style={{fontSize:9,padding:'2px 6px'}} onClick={()=>navigate('ficha-activo')}>Ver</button>}
                        </div>
                      </KF>
                      <KF label="Demanda (si aplica)">
                        <div style={{display:'flex',gap:4,alignItems:'center'}}>
                          <input className="kf-inp" value={form.demanda} onChange={e=>set('demanda',e.target.value)} style={{flex:1}} placeholder="Ej: DEM-0078"/>
                          {form.demanda && <button className="ra p" style={{fontSize:9,padding:'2px 6px'}} onClick={()=>navigate('ficha-demanda')}>Ver</button>}
                        </div>
                      </KF>
                      <KF label="Oferta (si aplica)">
                        <div style={{display:'flex',gap:4,alignItems:'center'}}>
                          <input className="kf-inp" value={form.oferta} onChange={e=>set('oferta',e.target.value)} style={{flex:1}} placeholder="Ej: OF-0041"/>
                          {form.oferta && <button className="ra p" style={{fontSize:9,padding:'2px 6px'}} onClick={()=>navigate('ficha-oferta')}>Ver</button>}
                        </div>
                      </KF>
                    </div>

                    {/* Mapa de vinculaciones */}
                    <div style={{marginTop:14,background:'var(--gray-lt)',borderRadius:8,padding:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:10}}>Mapa de vinculaciones</div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {[
                          {icon:'🏢',label:'Empresa',value:form.empresa,color:'var(--accent)',req:true},
                          {icon:'🏛',label:'Activo',value:form.activo||'—',color:'var(--teal)',req:false},
                          {icon:'🔍',label:'Demanda',value:form.demanda||'—',color:'var(--purple)',req:false},
                          {icon:'📧',label:'Oferta',value:form.oferta||'—',color:'var(--amber)',req:false},
                        ].map(v=>(
                          <div key={v.label} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:5,border:`1px solid ${v.value&&v.value!=='—'?v.color+'44':'var(--border)'}`,background:v.value&&v.value!=='—'?v.color+'11':'transparent'}}>
                            <span style={{fontSize:13}}>{v.icon}</span>
                            <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',width:50,flexShrink:0}}>{v.label}{v.req&&<span style={{color:'var(--red)'}}>*</span>}</span>
                            <span style={{fontSize:11,fontWeight:600,color:v.value&&v.value!=='—'?v.color:'var(--text4)',flex:1}}>{v.value||'—'}</span>
                            {v.value&&v.value!=='—'&&<span style={{width:6,height:6,borderRadius:'50%',background:v.color,display:'inline-block'}}/>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Col 3: Económico */}
                <div>
                  <div className="ib-title">Datos económicos</div>
                  <div>
                    <div className="kf-grid">
                      <KF label="Fees potenciales (€)">
                        <input className="kf-inp" value={form.fees} onChange={e=>set('fees',e.target.value)} style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:14}}/>
                      </KF>
                      <KF label="Fecha estimada de cierre">
                        <input className="kf-inp" value={form.fecha_cierre} onChange={e=>set('fecha_cierre',e.target.value)} placeholder="DD/MM/AAAA" style={{fontFamily:'var(--mono)'}}/>
                      </KF>
                      <KF label="Probabilidad de éxito (%)">
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <input type="range" min={0} max={100} step={5} value={form.probabilidad} onChange={e=>set('probabilidad',e.target.value)} style={{flex:1,accentColor:'var(--accent)'}}/>
                          <span style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:14,color:'var(--accent)',minWidth:36}}>{form.probabilidad}%</span>
                        </div>
                      </KF>
                    </div>

                    <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      {[
                        {label:'Fees brutos',val:`${parseInt(form.fees.replace(/[^0-9]/g,'')||0).toLocaleString('es-ES')} €`,color:'var(--text1)'},
                        {label:'Fees ajustados',val:`${Math.round(feesAdj).toLocaleString('es-ES')} €`,color:'var(--green)'},
                      ].map(m=>(
                        <div key={m.label} style={{background:'var(--gray-lt)',borderRadius:6,padding:'10px 12px',textAlign:'center'}}>
                          <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{m.label}</div>
                          <div style={{fontSize:16,fontWeight:700,fontFamily:'var(--mono)',color:m.color}}>{m.val}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{marginTop:14,borderTop:'1px solid var(--border)',paddingTop:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>Acciones rápidas</div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start'}} onClick={()=>navigate('ficha-actividad')}>📝 Crear actividad vinculada</button>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start'}} onClick={()=>navigate('ficha-oferta')}>📧 Emitir oferta</button>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start'}} onClick={()=>navigate('ficha-demanda')}>🔍 Crear demanda</button>
                        {form.estado==='Adjudicado'&&!form.convertido_mandato&&(
                          <button style={{background:'var(--green)',color:'#fff',border:'none',borderRadius:5,padding:'6px 12px',cursor:'pointer',fontWeight:700,fontSize:11,fontFamily:'inherit',textAlign:'left'}} onClick={convertirMandato}>
                            🏆 Convertir en mandato →
                          </button>
                        )}
                      </div>
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
                      {label:'Activo', val:form.activo||'—'},
                      {label:'Demanda', val:form.demanda||'—', mono:true},
                      {label:'Oferta', val:form.oferta||'—', mono:true},
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
