import { useState } from 'react'
import { useNav } from '../context/NavigationContext'

const CUENTAS_DISPONIBLES = [
  'Grupo Empresarial Altamira SL','Nexo Digital Media SL','Centro Médico Integra SL',
  'Hospitality Group Iberia SL','Flexwork Solutions Spain SL','Grupo Mediática España',
  'Capital Industrial Partners','Academia Global Formación SL','Inversiones Familiar Velada',
  'Oracle Spain SL','Generali Real Estate','Pharma Group Spain','ISDE','RENTAMAR SL',
  'Merlín Properties SOCIMI','FREO Investments Spain SL',
]

const INIT_CLIENTES = ['Oracle Spain SL','Grupo Mediática España','ISDE','Generali Real Estate']

const TODAS_ACTS = [
  {id:'ACT-2501',cuenta:'Grupo Empresarial Altamira SL',tipo:'Email',  as:'Propuesta arrendamiento Albatros — Edif. D',     f:'20/10/2025',u:'Sierra Alvaro',   ref:'D251035690',refT:'Demanda',   est:'Abierto'},
  {id:'ACT-2503',cuenta:'Oracle Spain SL',              tipo:'Llamada', as:'Llamada Oracle — avance negociación Albatros',   f:'08/10/2025',u:'Sierra Alvaro',   ref:'NEG-0041',  refT:'Negociación',est:'Finalizado'},
  {id:'ACT-2504',cuenta:'ISDE',                         tipo:'Email',   as:'Envío dossier Albatros a ISDE',                  f:'08/10/2025',u:'Sierra Alvaro',   ref:'OFR-0017',  refT:'Oferta',     est:'Abierto'},
  {id:'ACT-2507',cuenta:'ISDE',                         tipo:'Reunión', as:'ISDE — reunión presentación portfolio Savills',  f:'30/09/2025',u:'Sierra Alvaro',   ref:'D250934000',refT:'Cuenta',    est:'Finalizado'},
  {id:'ACT-2509',cuenta:'RENTAMAR SL',                  tipo:'Reunión', as:'Catch up Oficinas — inversión zona norte',       f:'26/09/2025',u:'Sierra Alvaro',   ref:'D250934200',refT:'Demanda',   est:'Abierto'},
  {id:'ACT-2512',cuenta:'Generali Real Estate',         tipo:'Email',   as:'Generali — envío term sheet Avalon P5',          f:'15/03/2026',u:'Sierra Alvaro',   ref:'NEG-0039',  refT:'Negociación',est:'Finalizado'},
  {id:'ACT-2513',cuenta:'Oracle Spain SL',              tipo:'Email',   as:'Oracle — contraoferta Albatros condiciones',     f:'28/03/2026',u:'Sierra Alvaro',   ref:'NEG-0041',  refT:'Negociación',est:'Abierto'},
  {id:'ACT-2514',cuenta:'Grupo Mediática España',       tipo:'Reunión', as:'Reunión exploratoria nueva sede 2027',           f:'12/09/2025',u:'GOMEZ Ignacio',   ref:'D250934600',refT:'Demanda',   est:'Finalizado'},
  {id:'ACT-2515',cuenta:'Grupo Mediática España',       tipo:'Llamada', as:'Seguimiento búsqueda — actualización criterios', f:'15/01/2026',u:'GOMEZ Ignacio',   ref:'D250934600',refT:'Demanda',   est:'Abierto'},
  {id:'ACT-2516',cuenta:'Generali Real Estate',         tipo:'Llamada', as:'Confirmación acuerdo Avalon P5',                 f:'29/03/2026',u:'Sierra Alvaro',   ref:'NEG-0039',  refT:'Negociación',est:'Finalizado'},
]

const DEMANDAS_CLIENTES = [
  {ref:'D250934600',cuenta:'Grupo Mediática España',   sup:'13.000–18.000 m²',estado:'En Curso', tipo:'Estándar',      u:'GOMEZ Ignacio'},
  {ref:'D250934200',cuenta:'Capital Industrial Partners',sup:'500–700 m²',   estado:'En Curso', tipo:'Estándar',      u:'GOMEZ Ignacio'},
  {ref:'D251035690',cuenta:'Grupo Empresarial Altamira SL',sup:'2.200–3.000 m²',estado:'En Curso',tipo:'Estándar',   u:'Sierra Alvaro'},
]

const NEGS_CLIENTES = [
  {ref:'NEG-0041',cuenta:'Oracle Spain SL',        activo:'Albatros — Edif. D',   estado:'Pendiente respuesta',cierre:'30/04/2026'},
  {ref:'NEG-0039',cuenta:'Generali Real Estate',   activo:'P.E Avalon — P5',      estado:'Acuerdo alcanzado',  cierre:'15/04/2026'},
  {ref:'NEG-0044',cuenta:'Empresa XYZ',            activo:'Avalon — Santa Leonor',estado:'En negociación',     cierre:'30/03/2026'},
]

const OPORS_CLIENTES = [
  {ref:'OPO-2501',cuenta:'Oracle Spain SL',      activo:'Albatros — Edif. D',   tipo:'Arrendamiento',sup:'13.486 m²',estado:'En curso',      prob:'75%',cierre:'30/04/2026',u:'Sierra Alvaro'},
  {ref:'OPO-2502',cuenta:'Generali Real Estate', activo:'P.E Avalon — P5',      tipo:'Arrendamiento',sup:'1.500 m²', estado:'Acuerdo alcanzado',prob:'95%',cierre:'15/04/2026',u:'Sierra Alvaro'},
  {ref:'OPO-2503',cuenta:'Grupo Mediática España',activo:'Torre Norte',          tipo:'Arrendamiento',sup:'16.000 m²',estado:'Potencial',     prob:'30%',cierre:'30/09/2026',u:'GOMEZ Ignacio'},
]

const OFERTAS_CLIENTES = [
  {ref:'OFR-0017',cuenta:'ISDE',                 activo:'Albatros — Edif. D',   sup:'1.200 m²',renta:'16 €/m²/mes',estado:'En curso',     fecha:'08/10/2025',u:'Sierra Alvaro'},
  {ref:'OFR-0038',cuenta:'Oracle Spain SL',       activo:'Albatros — Edif. D',   sup:'13.486 m²',renta:'14,5 €/m²/mes',estado:'Finalista',fecha:'15/03/2026',u:'Sierra Alvaro'},
]

const TRANS_CLIENTES = [
  {ref:'TRN-2501',cuenta:'Generali Real Estate', activo:'P.E Avalon — P5',      tipo:'Instrucción',linea:'Oficinas',sup:'1.500 m²',renta:'18,5 €/m²/mes',fecha_cierre:'15/04/2026',fees:'85.000 €',estado:'Firmado',u:'Sierra Alvaro'},
]

const TIPO_TAG = { Email:'tag-blue', Llamada:'tag-green', 'Reunión':'tag-purple', Nota:'tag-amber', Tarea:'tag-gray' }
const TIPO_ICO = { Email:'📧', Llamada:'📞', 'Reunión':'🤝', Nota:'📝', Tarea:'✅' }
const EST_TAG  = { 'Abierto':'tag-amber', 'Finalizado':'tag-gray', 'En Curso':'tag-green', 'En negociación':'tag-amber', 'Pendiente respuesta':'tag-amber', 'Acuerdo alcanzado':'tag-green' }
const REF_TAG  = { Demanda:'tag-blue', Negociación:'tag-purple', Oferta:'tag-green', Cuenta:'tag-gray', Activo:'tag-teal' }

function avatarIni(s){ return (s||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() }

export default function MisClientes() {
  const { navigate } = useNav()
  const [clientes, setClientes] = useState(INIT_CLIENTES)
  const [showGestionar, setShowGestionar] = useState(false)
  const [addCuenta, setAddCuenta] = useState('')
  const [tab, setTab] = useState('actividades')
  const [query, setQuery] = useState('')

  const disponibles = CUENTAS_DISPONIBLES.filter(c => !clientes.includes(c))

  const actsFiltered = TODAS_ACTS.filter(a =>
    clientes.includes(a.cuenta) &&
    (!query || a.as.toLowerCase().includes(query.toLowerCase()) || a.cuenta.toLowerCase().includes(query.toLowerCase()))
  )
  const demandasFiltered = DEMANDAS_CLIENTES.filter(d => clientes.includes(d.cuenta))
  const negsFiltered     = NEGS_CLIENTES.filter(n => clientes.includes(n.cuenta))
  const oporsFiltered    = OPORS_CLIENTES.filter(o => clientes.includes(o.cuenta))
  const ofertasFiltered  = OFERTAS_CLIENTES.filter(o => clientes.includes(o.cuenta))
  const transFiltered    = TRANS_CLIENTES.filter(t => clientes.includes(t.cuenta))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>

      {/* Header strip */}
      <div style={{padding:'10px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>Mis Clientes</div>
          <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>{clientes.length} cuentas seleccionadas · Seguimiento personalizado</div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {clientes.map(c=>(
            <span key={c} style={{fontSize:10,fontWeight:600,background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',borderRadius:20,padding:'2px 10px'}}>
              {c}
            </span>
          ))}
        </div>
        <button className="tbtn prim" onClick={()=>setShowGestionar(v=>!v)}>⚙ Gestionar mis clientes</button>
      </div>

      {/* Panel gestión clientes */}
      {showGestionar && (
        <div style={{padding:'12px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>Gestionar mi lista de clientes</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
            {clientes.map(c=>(
              <div key={c} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,background:'#fff',border:'1px solid var(--border)',borderRadius:20,padding:'3px 10px'}}>
                <span style={{fontWeight:500}}>{c}</span>
                <button onClick={()=>setClientes(prev=>prev.filter(x=>x!==c))} style={{color:'var(--red)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:11,padding:'0 2px',lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Añadir cuenta</span>
              <select className="fsel" value={addCuenta} onChange={e=>setAddCuenta(e.target.value)} style={{minWidth:250}}>
                <option value="">Seleccionar cuenta...</option>
                {disponibles.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <button className="tbtn prim" onClick={()=>{if(addCuenta){setClientes(prev=>[...prev,addCuenta]);setAddCuenta('')}}}>+ Añadir</button>
            <button className="tbtn" onClick={()=>setShowGestionar(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(7,1fr)',flexShrink:0}}>
        <div className="ks"><div className="ks-lbl">Cuentas seguidas</div><div className="ks-val" style={{color:'var(--accent)'}}>{clientes.length}</div></div>
        <div className="ks"><div className="ks-lbl">Actividades</div><div className="ks-val">{actsFiltered.length}</div></div>
        <div className="ks"><div className="ks-lbl">Demandas activas</div><div className="ks-val green">{demandasFiltered.length}</div></div>
        <div className="ks"><div className="ks-lbl">Negociaciones</div><div className="ks-val amber">{negsFiltered.length}</div></div>
        <div className="ks"><div className="ks-lbl">Oportunidades</div><div className="ks-val" style={{color:'var(--purple)'}}>{oporsFiltered.length}</div></div>
        <div className="ks"><div className="ks-lbl">Ofertas</div><div className="ks-val" style={{color:'var(--teal)'}}>{ofertasFiltered.length}</div></div>
        <div className="ks"><div className="ks-lbl">Transacciones</div><div className="ks-val" style={{color:'var(--green)'}}>{transFiltered.length}</div></div>
      </div>

      {/* Toolbar + tabs */}
      <div style={{padding:'8px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
        <div className="tabs" style={{margin:0,padding:0,border:'none',background:'none',gap:2}}>
          {[['actividades','Actividades'],['demandas','Demandas'],['negociaciones','Negociaciones'],['oportunidades','Oportunidades'],['ofertas','Ofertas'],['transacciones','Transacción / Instrucción']].map(([k,l])=>(
            <div key={k} className={`tab ${tab===k?'active':''}`} style={{margin:0}} onClick={()=>setTab(k)}>{l}</div>
          ))}
        </div>
        <div className="search-wrap" style={{marginLeft:'auto'}}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn prim" onClick={()=>navigate('ficha-actividad')}>+ Nueva actividad</button>
      </div>

      {/* Tabla actividades */}
      {tab === 'actividades' && (
        <div className="tbl-wrap">
          <table className="main-tbl">
            <thead>
              <tr>
                {['ID','Cuenta','Tipo','Asunto','Referencia','Fecha','Usuario','Estado'].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actsFiltered.length === 0
                ? <tr><td colSpan={8} style={{textAlign:'center',padding:32,color:'var(--text4)',fontSize:12}}>No hay actividades para los clientes seleccionados</td></tr>
                : actsFiltered.map(a=>(
                  <tr key={a.id} onClick={()=>navigate('ficha-actividad')} style={{cursor:'pointer'}}>
                    <td><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{a.id}</span></td>
                    <td><span style={{fontSize:11,fontWeight:600,color:'var(--accent)',cursor:'pointer'}}>{a.cuenta}</span></td>
                    <td><span className={`tag ${TIPO_TAG[a.tipo]||'tag-gray'}`}>{TIPO_ICO[a.tipo]||'📋'} {a.tipo}</span></td>
                    <td style={{fontSize:11,fontWeight:500,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.as}</td>
                    <td>
                      <div style={{display:'flex',flexDirection:'column',gap:2}}>
                        <span className={`tag ${REF_TAG[a.refT]||'tag-gray'}`} style={{fontSize:9}}>{a.refT}</span>
                        <span className="asset-link" style={{fontSize:10,fontFamily:'var(--mono)'}}>{a.ref}</span>
                      </div>
                    </td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{a.f}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <div style={{width:20,height:20,borderRadius:'50%',background:'var(--accent-lt)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700}}>{avatarIni(a.u)}</div>
                        <span style={{fontSize:11}}>{a.u}</span>
                      </div>
                    </td>
                    <td><span className={`tag ${EST_TAG[a.est]||'tag-gray'}`}>{a.est}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla demandas */}
      {tab === 'demandas' && (
        <div className="tbl-wrap">
          <table className="main-tbl">
            <thead>
              <tr>{['Ref.','Cuenta','Superficie','Estado','Tipo búsqueda','Consultor'].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {demandasFiltered.length === 0
                ? <tr><td colSpan={6} style={{textAlign:'center',padding:32,color:'var(--text4)',fontSize:12}}>No hay demandas para los clientes seleccionados</td></tr>
                : demandasFiltered.map(d=>(
                  <tr key={d.ref} onClick={()=>navigate('ficha-demanda')} style={{cursor:'pointer'}}>
                    <td><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{d.ref}</span></td>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{d.cuenta}</td>
                    <td className="mono" style={{fontSize:11}}>{d.sup}</td>
                    <td><span className={`tag ${EST_TAG[d.estado]||'tag-gray'}`}>{d.estado}</span></td>
                    <td style={{fontSize:11}}>{d.tipo||'—'}</td>
                    <td style={{fontSize:11}}>{d.u}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla negociaciones */}
      {tab === 'negociaciones' && (
        <div className="tbl-wrap">
          <table className="main-tbl">
            <thead>
              <tr>{['Ref.','Cuenta','Activo','Estado','Cierre estimado'].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {negsFiltered.length === 0
                ? <tr><td colSpan={5} style={{textAlign:'center',padding:32,color:'var(--text4)',fontSize:12}}>No hay negociaciones para los clientes seleccionados</td></tr>
                : negsFiltered.map(n=>(
                  <tr key={n.ref} onClick={()=>navigate('ficha-negociacion')} style={{cursor:'pointer'}}>
                    <td><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{n.ref}</span></td>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{n.cuenta}</td>
                    <td style={{fontSize:11}}>{n.activo}</td>
                    <td><span className={`tag ${EST_TAG[n.estado]||'tag-gray'}`}>{n.estado}</span></td>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--text2)'}}>{n.cierre}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla oportunidades */}
      {tab === 'oportunidades' && (
        <div className="tbl-wrap">
          <table className="main-tbl">
            <thead>
              <tr>{['Ref.','Cuenta','Activo','Tipo','Superficie','Probabilidad','Cierre est.','Estado','Consultor'].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {oporsFiltered.length === 0
                ? <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'var(--text4)',fontSize:12}}>No hay oportunidades para los clientes seleccionados</td></tr>
                : oporsFiltered.map(o=>(
                  <tr key={o.ref} onClick={()=>navigate('ficha-negociacion')} style={{cursor:'pointer'}}>
                    <td><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{o.ref}</span></td>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{o.cuenta}</td>
                    <td style={{fontSize:11}}>{o.activo}</td>
                    <td><span className="tag tag-purple" style={{fontSize:9}}>{o.tipo}</span></td>
                    <td className="mono" style={{fontSize:11}}>{o.sup}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:40,height:5,borderRadius:3,background:'var(--border)',overflow:'hidden'}}>
                          <div style={{width:o.prob,height:'100%',background:'var(--accent)',borderRadius:3}}/>
                        </div>
                        <span style={{fontSize:11,fontFamily:'var(--mono)',fontWeight:600}}>{o.prob}</span>
                      </div>
                    </td>
                    <td style={{fontSize:11}}>{o.cierre}</td>
                    <td><span className={`tag ${EST_TAG[o.estado]||'tag-gray'}`}>{o.estado}</span></td>
                    <td style={{fontSize:11}}>{o.u}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla ofertas */}
      {tab === 'ofertas' && (
        <div className="tbl-wrap">
          <table className="main-tbl">
            <thead>
              <tr>{['Ref.','Cuenta','Activo','Superficie','Renta asking','Fecha','Estado','Consultor'].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {ofertasFiltered.length === 0
                ? <tr><td colSpan={8} style={{textAlign:'center',padding:32,color:'var(--text4)',fontSize:12}}>No hay ofertas para los clientes seleccionados</td></tr>
                : ofertasFiltered.map(o=>(
                  <tr key={o.ref} onClick={()=>navigate('ficha-oferta')} style={{cursor:'pointer'}}>
                    <td><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{o.ref}</span></td>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{o.cuenta}</td>
                    <td style={{fontSize:11}}>{o.activo}</td>
                    <td className="mono" style={{fontSize:11}}>{o.sup}</td>
                    <td className="mono" style={{fontSize:11,fontWeight:600,color:'var(--teal)'}}>{o.renta}</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{o.fecha}</td>
                    <td><span className={`tag ${EST_TAG[o.estado]||'tag-gray'}`}>{o.estado}</span></td>
                    <td style={{fontSize:11}}>{o.u}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla transacciones / instrucciones */}
      {tab === 'transacciones' && (
        <div className="tbl-wrap">
          <table className="main-tbl">
            <thead>
              <tr>{['Ref.','Cuenta','Activo','Tipo','Línea','Superficie','Renta/Precio','Cierre','Fees','Estado','Consultor'].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {transFiltered.length === 0
                ? <tr><td colSpan={11} style={{textAlign:'center',padding:32,color:'var(--text4)',fontSize:12}}>No hay transacciones / instrucciones para los clientes seleccionados</td></tr>
                : transFiltered.map(t=>(
                  <tr key={t.ref} onClick={()=>navigate('ficha-arrendatario')} style={{cursor:'pointer'}}>
                    <td><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{t.ref}</span></td>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{t.cuenta}</td>
                    <td style={{fontSize:11}}>{t.activo}</td>
                    <td><span className="tag tag-teal" style={{fontSize:9}}>{t.tipo}</span></td>
                    <td style={{fontSize:11}}>{t.linea}</td>
                    <td className="mono" style={{fontSize:11}}>{t.sup}</td>
                    <td className="mono" style={{fontSize:11,fontWeight:600,color:'var(--teal)'}}>{t.renta}</td>
                    <td style={{fontSize:11}}>{t.fecha_cierre}</td>
                    <td className="mono" style={{fontSize:11,fontWeight:700,color:'var(--green)'}}>{t.fees}</td>
                    <td><span className={`tag ${EST_TAG[t.estado]||'tag-gray'}`}>{t.estado}</span></td>
                    <td style={{fontSize:11}}>{t.u}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
