import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'

const MESES_ANTES_BREAK = 3

function calcRecordatorio(breakOption, meses) {
  if (!breakOption) return '—'
  const [d,m,y] = breakOption.split('/').map(Number)
  const fecha = new Date(y, m-1-meses, d)
  return `${String(fecha.getDate()).padStart(2,'0')}/${String(fecha.getMonth()+1).padStart(2,'0')}/${fecha.getFullYear()}`
}

function diasHasta(fechaStr) {
  if (!fechaStr || fechaStr==='—') return null
  const [d,m,y] = fechaStr.split('/').map(Number)
  return Math.ceil((new Date(y,m-1,d) - new Date())/(1000*60*60*24))
}

const TABS = ['datos','condiciones','alertas','historial']
const TAB_LABELS = ['📋 Datos del arrendatario','💰 Condiciones económicas','🔔 Alertas y break option','🕐 Historial']

const TIPO_TAG_ARR = { Email:'tag-blue', Llamada:'tag-green', Reunión:'tag-purple', Tarea:'tag-gray', Nota:'tag-gray', Alerta:'tag-red', Modificación:'tag-amber' }
const TIPO_ICO_ARR = { Email:'📧', Llamada:'📞', Reunión:'🤝', Tarea:'✅', Nota:'📝', Alerta:'🔔', Modificación:'✏️' }
const ACT_EST_ARR  = { Sistema:'tag-gray', 'Sierra Alvaro':'tag-blue', Automático:'tag-amber' }

const HIST_ACTS = [
  { id:'HST-001', tipo:'Nota',         asunto:'Arrendatario creado — Oracle Spain SL vinculado a Albatros Edif. D · 13.486 m²',        fecha:'01/07/2021', user:'Sierra Alvaro',  initials:'AS', bg:'#dbeafe', color:'#1e40af', origen:'Sierra Alvaro'  },
  { id:'HST-002', tipo:'Modificación', asunto:'Actualización condiciones económicas — closing rent ajustado a 12,50 €/m²/mes',          fecha:'15/06/2023', user:'Sierra Alvaro',  initials:'AS', bg:'#dbeafe', color:'#1e40af', origen:'Sierra Alvaro'  },
  { id:'HST-003', tipo:'Email',        asunto:'Email de renovación enviado a Carlos Méndez (Dir. Real Estate Oracle)',                   fecha:'01/04/2024', user:'Sierra Alvaro',  initials:'AS', bg:'#dbeafe', color:'#1e40af', origen:'Sierra Alvaro'  },
  { id:'HST-004', tipo:'Alerta',       asunto:'Recordatorio automático — break option a 90 días (vencimiento 01/07/2024)',               fecha:'01/04/2024', user:'Sistema',        initials:'SY', bg:'#fff7ed', color:'#c2410c', origen:'Automático'     },
  { id:'HST-005', tipo:'Llamada',      asunto:'Llamada Carlos Méndez — Oracle no ejercerá break option, confirma continuidad',          fecha:'15/05/2024', user:'Sierra Alvaro',  initials:'AS', bg:'#dbeafe', color:'#1e40af', origen:'Sierra Alvaro'  },
  { id:'HST-006', tipo:'Alerta',       asunto:'Break option alcanzada — Oracle Spain SL no ha notificado decisión (vencida 01/07/2024)',fecha:'01/07/2024', user:'Sistema',        initials:'SY', bg:'#fff7ed', color:'#c2410c', origen:'Automático'     },
  { id:'HST-007', tipo:'Reunión',      asunto:'Reunión de seguimiento anual — revisión condiciones y plazos',                           fecha:'10/01/2025', user:'GOMEZ Ignacio',  initials:'GI', bg:'#fdf4ff', color:'#7e22ce', origen:'Sierra Alvaro'  },
  { id:'HST-008', tipo:'Nota',         asunto:'Oracle interesado en ampliar superficie — P3 disponible (13.486 m² adicionales)',        fecha:'15/02/2025', user:'Sierra Alvaro',  initials:'AS', bg:'#dbeafe', color:'#1e40af', origen:'Sierra Alvaro'  },
]

export default function FichaArrendatario() {
  const { navigate } = useNav()
  const [tab, setTab] = useState('datos')
  const [showTarea, setShowTarea] = useState(false)

  // Datos del arrendatario (mock — Oracle Spain SL)
  const [form, setForm] = useState({
    activo: 'Albatros Edif. D',
    persona_fisica: false,
    tenant_desconocido: false,
    tenant: 'Oracle Spain SL',
    tenant_mayoritario: 'Oracle Spain SL',
    propietario: 'Merlín Properties SOCIMI',
    anyo_firma: '2021',
    trimestre: 'Q2',
    superficie: '13486',
    asking_rent: '13.00',
    closing_rent: '12.50',
    renta_mensual: '',
    meses_carencia: '2',
    plazas_int: '40',
    plazas_ext: '0',
    precio_int: '110',
    precio_ext: '0',
    agente_activo: 'Sierra Alvaro',
    agente_pasivo: 'CBRE',
    aportacion_obras_m2: '15',
    aportacion_total: '',
    tipo_contrato: 'Alquiler comercial',
    anios_obligado: '5',
    fecha_inicio: '01/07/2021',
    break_option: '01/07/2024',
    fecha_fin: '30/06/2026',
    fecha_salida: '',
    meses_recordatorio: '3',
    color: '#3b82f6',
    estado: 'Próximo a vencimiento',
    responsable: 'Sierra Alvaro',
    sector: 'Tecnología',
    area: 'Periferia',
    zona: 'A-1',
    subzona: 'Alcobendas',
  })

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const rentaMensual = form.superficie && form.closing_rent
    ? (parseFloat(form.superficie)*parseFloat(form.closing_rent)).toLocaleString('es-ES',{minimumFractionDigits:0,maximumFractionDigits:0})
    : '—'
  const aportacionTotal = form.superficie && form.aportacion_obras_m2
    ? (parseFloat(form.superficie)*parseFloat(form.aportacion_obras_m2)).toLocaleString('es-ES')
    : '—'
  const fechaRecordatorio = calcRecordatorio(form.break_option, parseInt(form.meses_recordatorio)||3)
  const diasBreak = diasHasta(form.break_option)
  const diasRecord = diasHasta(fechaRecordatorio)

  const ESTADO_COLOR = { 'Activo':'var(--green)', 'Próximo a vencimiento':'var(--red)', 'En negociación':'var(--purple)', 'Renovado':'var(--accent)', 'Finalizado':'var(--text4)' }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn">Desactivar</button>
        <div className="ab-sep"/>
        <button className="ab-btn blue" onClick={()=>navigate('ficha-activo')}>🏢 Ver activo</button>
        <button className="ab-btn blue" onClick={()=>navigate('ficha-demanda')}>🔍 Crear demanda</button>
        <button className="ab-btn" onClick={()=>navigate('arrendatarios')}>← Volver</button>
        <div className="ab-sep"/>
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">
          {/* Header */}
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#0f766e,#14b8a6)',fontSize:18}}>🏢</div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'var(--teal-lt)',color:'var(--teal)',border:'1px solid var(--teal-bd)',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>ARRENDATARIO</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>ARR-2501</span>
                  <span className={`tag ${form.estado==='Activo'?'tag-green':form.estado==='Próximo a vencimiento'?'tag-red':form.estado==='En negociación'?'tag-purple':'tag-gray'}`}>{form.estado}</span>
                </div>
                <div className="ah-name">{form.tenant} — {form.activo}</div>
                <div className="ah-addr">📍 {form.zona} · {form.subzona} · Inicio: {form.fecha_inicio} · Break: {form.break_option} · Fin: {form.fecha_fin}</div>
                <div className="ah-tags">
                  <span className="tag tag-teal">{form.sector}</span>
                  <span className="tag tag-blue">{form.area}</span>
                  <span className="tag tag-gray">{parseFloat(form.superficie||0).toLocaleString('es-ES')} m²</span>
                  <span className="tag tag-green">{form.closing_rent} €/m²/mes</span>
                  {diasBreak !== null && diasBreak <= 90 && (
                    <span style={{background:'var(--red-lt)',color:'var(--red)',border:'1px solid var(--red-bd)',padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700}}>
                      ⚠ Break option {diasBreak < 0 ? `vencida ${Math.abs(diasBreak)}d` : `en ${diasBreak}d`}
                    </span>
                  )}
                </div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:9,color:'var(--text4)',textTransform:'uppercase'}}>Renta mensual</div>
                <div style={{fontSize:22,fontWeight:700,color:'var(--accent)'}}>{rentaMensual} €</div>
                <div style={{fontSize:10,color:'var(--text3)'}}>Anual: {form.superficie&&form.closing_rent?(parseFloat(form.superficie)*parseFloat(form.closing_rent)*12/1000).toFixed(0)+'k':'—'} €</div>
              </div>
            </div>
          </div>

          <div className="tabs">
            {TABS.map((t,i)=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{TAB_LABELS[i]}</div>)}
          </div>

          {/* Tab Datos */}
          {tab==='datos' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>

                  {/* Columna izquierda — Inquilino */}
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10}}>🏷 INQUILINO</div>
                    <FField label="Activo">
                      <div style={{padding:'6px 9px',border:'1px solid var(--border2)',borderRadius:'var(--r)',fontSize:12,color:'var(--accent)',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>{form.activo} ↗</div>
                    </FField>
                    <div style={{display:'flex',gap:12,marginBottom:8}}>
                      <label style={{display:'flex',alignItems:'center',gap:5,fontSize:11,cursor:'pointer'}}>
                        <input type="checkbox" checked={form.persona_fisica} onChange={e=>set('persona_fisica',e.target.checked)} style={{accentColor:'var(--accent)'}}/>
                        Persona física
                      </label>
                      <label style={{display:'flex',alignItems:'center',gap:5,fontSize:11,cursor:'pointer'}}>
                        <input type="checkbox" checked={form.tenant_desconocido} onChange={e=>set('tenant_desconocido',e.target.checked)} style={{accentColor:'var(--accent)'}}/>
                        Tenant desconocido
                      </label>
                    </div>
                    <FField label="Tenant (Cuenta)"><input className="of-inp" value={form.tenant} onChange={e=>set('tenant',e.target.value)}/></FField>
                    <FField label="Tenant mayoritario"><input className="of-inp" value={form.tenant_mayoritario} onChange={e=>set('tenant_mayoritario',e.target.value)}/></FField>
                    <FField label="Propiedad (Cuenta)"><input className="of-inp" value={form.propietario} onChange={e=>set('propietario',e.target.value)}/></FField>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <FField label="Año firma"><input className="of-inp" value={form.anyo_firma} onChange={e=>set('anyo_firma',e.target.value)}/></FField>
                      <FField label="Trimestre">
                        <select className="of-sel" value={form.trimestre} onChange={e=>set('trimestre',e.target.value)}>
                          <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                        </select>
                      </FField>
                    </div>
                    <FField label="Sector actividad">
                      <select className="of-sel" value={form.sector} onChange={e=>set('sector',e.target.value)}>
                        <option>Tecnología</option><option>Logística</option><option>Sanidad</option><option>Comunicación / Media</option><option>Finanzas / Inversión</option><option>Consultoría</option><option>Retail / Distribución</option><option>Hostelería</option>
                      </select>
                    </FField>
                    <FField label="Área">
                      <select className="of-sel" value={form.area} onChange={e=>set('area',e.target.value)}>
                        <option>CBD</option><option>Centro</option><option>Descentralizado</option><option>Periferia</option><option>Corredor de Carretera</option>
                      </select>
                    </FField>
                    <FField label="Estado contrato">
                      <select className="of-sel" value={form.estado} onChange={e=>set('estado',e.target.value)}>
                        <option>Activo</option><option>Próximo a vencimiento</option><option>En negociación</option><option>Renovado</option><option>Finalizado</option>
                      </select>
                    </FField>
                    <FField label="Color identificativo">
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <input type="color" value={form.color} onChange={e=>set('color',e.target.value)} style={{width:36,height:28,border:'1px solid var(--border)',borderRadius:'var(--r)',cursor:'pointer',padding:2}}/>
                        <span style={{fontSize:11,color:'var(--text3)'}}>Para stacking plan</span>
                      </div>
                    </FField>
                  </div>

                  {/* Columna central — Condiciones */}
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10}}>💰 CONDICIONES</div>
                    <FField label="Superficie total ocupada (m²)" req><input className="of-inp" value={form.superficie} onChange={e=>set('superficie',e.target.value)}/></FField>
                    <FField label="Asking rent (€/m²/mes)"><input className="of-inp" value={form.asking_rent} onChange={e=>set('asking_rent',e.target.value)}/></FField>
                    <FField label="Closing rent (€/m²/mes)" req><input className="of-inp" value={form.closing_rent} onChange={e=>set('closing_rent',e.target.value)}/></FField>
                    <FField label="Renta mensual (€)">
                      <div style={{padding:'6px 9px',border:'1px solid var(--border)',borderRadius:'var(--r)',fontSize:12,fontWeight:700,color:'var(--accent)',background:'var(--gray-lt)'}}>{rentaMensual} €</div>
                    </FField>
                    <FField label="Nº meses carencia"><input className="of-inp" value={form.meses_carencia} onChange={e=>set('meses_carencia',e.target.value)}/></FField>
                    <div style={{height:1,background:'var(--border)',margin:'10px 0'}}/>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>🅿 APARCAMIENTO</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <FField label="Plazas interior"><input className="of-inp" value={form.plazas_int} onChange={e=>set('plazas_int',e.target.value)}/></FField>
                      <FField label="Precio/plaza int. (€)"><input className="of-inp" value={form.precio_int} onChange={e=>set('precio_int',e.target.value)}/></FField>
                      <FField label="Plazas exterior"><input className="of-inp" value={form.plazas_ext} onChange={e=>set('plazas_ext',e.target.value)}/></FField>
                      <FField label="Precio/plaza ext. (€)"><input className="of-inp" value={form.precio_ext} onChange={e=>set('precio_ext',e.target.value)}/></FField>
                    </div>
                    <div style={{height:1,background:'var(--border)',margin:'10px 0'}}/>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>👥 INTERVINIENTES</div>
                    <FField label="Agente activo">
                      <select className="of-sel" value={form.agente_activo} onChange={e=>set('agente_activo',e.target.value)}>
                        <option>Sierra Alvaro</option><option>GOMEZ Ignacio</option><option>García Marta</option><option>López Carmen</option>
                      </select>
                    </FField>
                    <FField label="Agente pasivo (cobroker)"><input className="of-inp" value={form.agente_pasivo} onChange={e=>set('agente_pasivo',e.target.value)}/></FField>
                  </div>

                  {/* Columna derecha — Contrato y gestión */}
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10}}>🏗 WORKPLACE</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <FField label="Aportación obras (€/m²)"><input className="of-inp" value={form.aportacion_obras_m2} onChange={e=>set('aportacion_obras_m2',e.target.value)}/></FField>
                      <FField label="Aportación total (€)">
                        <div style={{padding:'6px 9px',border:'1px solid var(--border)',borderRadius:'var(--r)',fontSize:12,fontWeight:700,color:'var(--accent)',background:'var(--gray-lt)'}}>{aportacionTotal} €</div>
                      </FField>
                    </div>
                    <div style={{height:1,background:'var(--border)',margin:'10px 0'}}/>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>📄 CONTRATO</div>
                    <FField label="Tipo de contrato">
                      <select className="of-sel" value={form.tipo_contrato} onChange={e=>set('tipo_contrato',e.target.value)}>
                        <option>Alquiler comercial</option><option>Alquiler industrial</option><option>Arrendamiento mixto</option>
                      </select>
                    </FField>
                    <FField label="Años obligado cumplimiento"><input className="of-inp" value={form.anios_obligado} onChange={e=>set('anios_obligado',e.target.value)}/></FField>
                    <FField label="Fecha inicio" req><input className="of-inp" value={form.fecha_inicio} onChange={e=>set('fecha_inicio',e.target.value)} placeholder="DD/MM/AAAA"/></FField>
                    <FField label="Break option (fecha)"><input className="of-inp" value={form.break_option} onChange={e=>set('break_option',e.target.value)} placeholder="DD/MM/AAAA"/></FField>
                    <FField label="Fecha fin contrato" req><input className="of-inp" value={form.fecha_fin} onChange={e=>set('fecha_fin',e.target.value)} placeholder="DD/MM/AAAA"/></FField>
                    <FField label="Fecha salida efectiva"><input className="of-inp" value={form.fecha_salida} onChange={e=>set('fecha_salida',e.target.value)} placeholder="DD/MM/AAAA"/></FField>
                    <div style={{height:1,background:'var(--border)',margin:'10px 0'}}/>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>🔔 ACCIÓN COMERCIAL</div>
                    <FField label="Recordatorio (meses antes de break option)">
                      <input className="of-inp" type="number" value={form.meses_recordatorio} onChange={e=>set('meses_recordatorio',e.target.value)} min="1" max="24"/>
                    </FField>
                    <FField label="Fecha recordatorio (automática)">
                      <div style={{padding:'6px 9px',border:'1px solid var(--border)',borderRadius:'var(--r)',fontSize:12,fontWeight:700,color:diasRecord!==null&&diasRecord<=0?'var(--red)':diasRecord!==null&&diasRecord<=30?'var(--amber)':'var(--text)',background:'var(--gray-lt)'}}>
                        {fechaRecordatorio}
                        {diasRecord!==null&&diasRecord<=0&&<span style={{fontSize:10,fontWeight:700,color:'var(--red)',marginLeft:8}}>⚠ Vencida</span>}
                        {diasRecord!==null&&diasRecord>0&&diasRecord<=30&&<span style={{fontSize:10,fontWeight:700,color:'var(--amber)',marginLeft:8}}>En {diasRecord}d</span>}
                      </div>
                    </FField>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Condiciones económicas */}
          {tab==='condiciones' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'var(--border)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden',marginBottom:16}}>
                  {[
                    ['Closing rent','12,50 €/m²/mes','var(--accent)'],
                    ['Renta mensual',`${rentaMensual} €`,'var(--text)'],
                    ['Renta anual',`${form.superficie&&form.closing_rent?(parseFloat(form.superficie)*parseFloat(form.closing_rent)*12/1000).toFixed(0)+'k €':'—'}`,'var(--text)'],
                    ['Plazas interior',`${form.plazas_int} × ${form.precio_int} €`,'var(--text3)'],
                  ].map(([l,v,c],i)=>(
                    <div key={i} style={{background:'var(--surface)',padding:12,textAlign:'center'}}>
                      <div style={{fontSize:9,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>{l}</div>
                      <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
                <table className="pat-table">
                  <thead><tr><th>Concepto</th><th>Valor</th><th>Observaciones</th></tr></thead>
                  <tbody>
                    <tr><td style={{fontWeight:500}}>Asking rent</td><td>{form.asking_rent} €/m²/mes</td><td style={{color:'var(--text4)',fontSize:10}}>Precio inicial ofertado</td></tr>
                    <tr><td style={{fontWeight:500}}>Closing rent</td><td style={{color:'var(--accent)',fontWeight:700}}>{form.closing_rent} €/m²/mes</td><td style={{color:'var(--text4)',fontSize:10}}>Precio negociado final</td></tr>
                    <tr><td style={{fontWeight:500}}>Carencia</td><td>{form.meses_carencia} meses</td><td style={{color:'var(--text4)',fontSize:10}}>Sin coste de renta</td></tr>
                    <tr><td style={{fontWeight:500}}>Superficie</td><td>{parseFloat(form.superficie||0).toLocaleString('es-ES')} m²</td><td style={{color:'var(--text4)',fontSize:10}}>Total ocupada</td></tr>
                    <tr><td style={{fontWeight:500}}>Plazas interior</td><td>{form.plazas_int} × {form.precio_int} €/mes</td><td style={{color:'var(--text4)',fontSize:10}}>{(parseInt(form.plazas_int||0)*parseInt(form.precio_int||0)).toLocaleString('es-ES')} €/mes</td></tr>
                    <tr><td style={{fontWeight:500}}>Aportación en obras</td><td>{form.aportacion_obras_m2} €/m²</td><td style={{color:'var(--text4)',fontSize:10}}>Total: {aportacionTotal} €</td></tr>
                    <tr><td style={{fontWeight:500}}>Agente activo</td><td>{form.agente_activo}</td><td style={{color:'var(--text4)',fontSize:10}}>Savills</td></tr>
                    <tr><td style={{fontWeight:500}}>Agente pasivo</td><td>{form.agente_pasivo||'—'}</td><td style={{color:'var(--text4)',fontSize:10}}>Cobroker externo</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Alertas */}
          {tab==='alertas' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Alertas y acción comercial</div>

                {/* Estado actual */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
                  {[
                    {label:'Break option',fecha:form.break_option,dias:diasBreak},
                    {label:'Fecha recordatorio',fecha:fechaRecordatorio,dias:diasRecord},
                    {label:'Fin contrato',fecha:form.fecha_fin,dias:diasHasta(form.fecha_fin)},
                  ].map((item,i)=>{
                    const alerta = item.dias!==null&&item.dias<=0 ? 'red' : item.dias!==null&&item.dias<=90 ? 'amber' : 'normal'
                    return (
                      <div key={i} style={{border:`1px solid ${alerta==='red'?'var(--red-bd)':alerta==='amber'?'var(--amber-bd)':'var(--border)'}`,background:alerta==='red'?'var(--red-lt)':alerta==='amber'?'var(--amber-lt)':'var(--surface)',borderRadius:'var(--r2)',padding:14,textAlign:'center'}}>
                        <div style={{fontSize:10,fontWeight:700,color:alerta==='red'?'var(--red)':alerta==='amber'?'var(--amber)':'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>{item.label}</div>
                        <div style={{fontSize:18,fontWeight:700,color:alerta==='red'?'var(--red)':alerta==='amber'?'var(--amber)':'var(--text)'}}>{item.fecha}</div>
                        {item.dias!==null&&<div style={{fontSize:11,marginTop:4,color:alerta==='red'?'var(--red)':alerta==='amber'?'var(--amber)':'var(--text3)'}}>
                          {item.dias<0?`Vencida hace ${Math.abs(item.dias)}d`:item.dias===0?'Hoy':`En ${item.dias} días`}
                        </div>}
                      </div>
                    )
                  })}
                </div>

                {/* Acciones comerciales */}
                <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:16}}>
                  <div style={{padding:'10px 14px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:700}}>Acciones comerciales recomendadas</div>
                  <div style={{padding:14,display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',border:'1px solid var(--red-bd)',background:'var(--red-lt)',borderRadius:'var(--r)'}}>
                      <span style={{fontSize:20}}>⚠️</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:700,color:'var(--red)'}}>Break option vencida — acción urgente</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>Oracle Spain SL tenía break option el 01/07/2024. Verificar si ejercieron o continúan. Contrato vence jun 2026.</div>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button className="ab-btn" style={{fontSize:10,padding:'3px 9px'}}>📞 Llamar</button>
                        <button className="ab-btn save" style={{fontSize:10,padding:'3px 9px'}} onClick={()=>navigate('ficha-actividad')}>+ Crear actividad</button>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',border:'1px solid var(--amber-bd)',background:'var(--amber-lt)',borderRadius:'var(--r)'}}>
                      <span style={{fontSize:20}}>📅</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:700,color:'var(--amber)'}}>Contrato vence en junio 2026 — iniciar conversación</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>Quedan ~{diasHasta(form.fecha_fin)} días. Recomendar iniciar negociación de renovación o búsqueda de alternativas.</div>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button className="ab-btn" style={{fontSize:10,padding:'3px 9px'}} onClick={()=>navigate('ficha-demanda')}>🔍 Crear demanda</button>
                        <button className="ab-btn save" style={{fontSize:10,padding:'3px 9px'}}>📧 Enviar propuesta</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuración alertas */}
                <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:700}}>Configuración de notificaciones</div>
                  <div style={{padding:14}}>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {[
                        {label:'Notificar al responsable del arrendatario',checked:true},
                        {label:'Notificar a equipos asignados',checked:true},
                        {label:'Crear actividad automática al alcanzar recordatorio',checked:false},
                        {label:'Enviar resumen semanal de contratos próximos a vencer',checked:true},
                      ].map((item,i)=>(
                        <label key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,cursor:'pointer'}}>
                          <input type="checkbox" defaultChecked={item.checked} style={{accentColor:'var(--accent)'}}/>
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Historial */}
          {tab==='historial' && (
            <div className="tab-content active">
              <div className="info-pad">
                {/* KPI strip */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                  {[
                    {lbl:'Eventos totales',    val:HIST_ACTS.length,                                                     color:'var(--text1)'},
                    {lbl:'Comunicaciones',     val:HIST_ACTS.filter(a=>['Email','Llamada','Reunión'].includes(a.tipo)).length, color:'var(--accent)'},
                    {lbl:'Alertas sistema',    val:HIST_ACTS.filter(a=>a.tipo==='Alerta').length,                         color:'var(--red)'},
                    {lbl:'Modificaciones',     val:HIST_ACTS.filter(a=>a.tipo==='Modificación'||a.tipo==='Nota').length,  color:'var(--amber)'},
                  ].map(k=>(
                    <div key={k.lbl} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 12px',textAlign:'center'}}>
                      <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>{k.lbl}</div>
                      <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:k.color}}>{k.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:600}}>Historial del arrendatario <span style={{fontSize:10,fontWeight:400,color:'var(--text4)'}}>· AUDITABLE</span></div>
                  <button className="ab-btn blue">+ Registrar actividad</button>
                </div>
                <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr>{['','ID','Tipo','Descripción','Fecha','Usuario','Origen'].map(h=>(
                        <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {[...HIST_ACTS].reverse().map(a=>(
                        <tr key={a.id} style={{borderBottom:'1px solid var(--border)'}}>
                          <td style={{padding:'7px 10px',width:30}}>
                            <div style={{width:26,height:26,borderRadius:'50%',background:a.bg,color:a.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>{a.initials}</div>
                          </td>
                          <td style={{padding:'7px 12px'}}><span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text3)'}}>{a.id}</span></td>
                          <td style={{padding:'7px 12px'}}><span className={`tag ${TIPO_TAG_ARR[a.tipo]||'tag-gray'}`}>{TIPO_ICO_ARR[a.tipo]} {a.tipo}</span></td>
                          <td style={{padding:'7px 12px',fontWeight:500,maxWidth:320}}>{a.asunto}</td>
                          <td style={{padding:'7px 12px',color:'var(--text3)',whiteSpace:'nowrap'}}>{a.fecha}</td>
                          <td style={{padding:'7px 12px',fontSize:10,color:'var(--text3)'}}>{a.user}</td>
                          <td style={{padding:'7px 12px'}}><span className={`tag ${ACT_EST_ARR[a.origen]||'tag-gray'}`} style={{fontSize:9}}>{a.origen}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="ficha-right">
          <div className="rp-sec">
            <div className="rp-lbl">Estado contrato</div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:ESTADO_COLOR[form.estado]||'var(--text4)'}}/>
              <span style={{fontSize:13,fontWeight:700,color:ESTADO_COLOR[form.estado]||'var(--text4)'}}>{form.estado}</span>
            </div>
            <button className="acc-btn" onClick={()=>navigate('ficha-activo')}>🏢 Ver activo</button>
            <button className="acc-btn" onClick={()=>navigate('ficha-demanda')}>🔍 Crear demanda</button>
            <button className="acc-btn" onClick={()=>navigate('ficha-actividad')}>📞 Registrar actividad</button>
            <button className="acc-btn">📊 Ver en stacking plan</button>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Fechas clave</div>
            <div className="info-block" style={{padding:0}}>
              {[
                {k:'Inicio',v:form.fecha_inicio},
                {k:'Break option',v:form.break_option,alerta:diasBreak!==null&&diasBreak<=90},
                {k:'Recordatorio',v:fechaRecordatorio,alerta:diasRecord!==null&&diasRecord<=30},
                {k:'Fin contrato',v:form.fecha_fin},
              ].map((r,i)=>(
                <div key={i} className="ir" style={{padding:'6px 10px'}}>
                  <span className="ir-k">{r.k}</span>
                  <span className="ir-v" style={{color:r.alerta?'var(--red)':'var(--text2)',fontWeight:r.alerta?700:400}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">KPIs económicos</div>
            <div className="kf-grid">
              <div className="kf"><div className="kf-lbl">Sup. ocupada</div><div className="kf-val">{parseFloat(form.superficie||0).toLocaleString('es-ES')} m²</div></div>
              <div className="kf"><div className="kf-lbl">Closing rent</div><div className="kf-val" style={{color:'var(--accent)'}}>{form.closing_rent} €</div></div>
              <div className="kf"><div className="kf-lbl">Renta mensual</div><div className="kf-val">{rentaMensual} €</div></div>
              <div className="kf"><div className="kf-lbl">Obras</div><div className="kf-val">{aportacionTotal} €</div></div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Activo vinculado</div>
            <div style={{background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 10px',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>Albatros Edif. D</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>A-1 · Alcobendas · Merlín Properties</div>
            </div>
          </div>
        </div>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Arrendatario" refNombre="Oracle Spain SL · ARR-2501" onClose={() => setShowTarea(false)} />}
    </div>
  )
}

function FField({label,req,children}){
  return (
    <div className="of-field" style={{marginBottom:8}}>
      <div className="of-lbl" style={req?{color:'var(--text)'}:{}}>{req&&<span style={{color:'var(--red)',marginRight:2}}>*</span>}{label}</div>
      {children}
    </div>
  )
}
