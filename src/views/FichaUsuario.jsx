import { useState } from 'react'
import { useNav } from '../context/NavigationContext'

const USUARIO = {
  id:'USR-001', nombre:'Sierra Alvaro', iniciales:'AS',
  equipo:'Leasing Oficinas MAD', linea:'Leasing', rol:'Senior Consultant',
  email:'a.sierra@savills.es', tel:'+34 91 xxx xx xx',
  actividades:9, demandas:7, ofertas:4, proyectos:3, ops_cerradas:5,
  m2_gestionados:48750, honorarios:'3,2 M€', pipeline:'1,1 M€',
  color:'var(--accent)', bg:'var(--accent-lt)',
}

// Actividades (fuente: módulo Actividades)
const ACTS_U = [
  {id:'ACT-2501',tipo:'Email',asunto:'Propuesta arrendamiento Albatros — Edif. D',ref:'Demanda · Corp. Financiera',f:'20/10/2025',est:'Abierto',cat:'Cliente'},
  {id:'ACT-2504',tipo:'Email',asunto:'Envío dossier Albatros a Oracle',ref:'Oferta · OLBUR2315645',f:'08/10/2025',est:'Abierto',cat:'Cliente'},
  {id:'ACT-2507',tipo:'Reunión',asunto:'ISDE — reunión presentación portfolio Savills',ref:'Cuenta · ISDE',f:'30/09/2025',est:'Finalizado',cat:'Cliente'},
  {id:'ACT-2509',tipo:'Reunión',asunto:'Catch up Oficinas — inversión zona norte',ref:'Cuenta · RENTAMAR SL',f:'26/09/2025',est:'Abierto',cat:'Cliente'},
  {id:'ACT-TAR-01',tipo:'Llamada',asunto:'Llamada propietario Barings — mandato Avalon',ref:'Activo · P.E Avalon',f:'12/03/2026',est:'Finalizado',cat:'Propietario'},
]
const TIPO_TAG = {Email:'tag-blue',Llamada:'tag-green','Reunión':'tag-purple',Tarea:'tag-gray'}
const TIPO_ICO = {Email:'📧',Llamada:'📞','Reunión':'🤝',Tarea:'✅'}
const CAT_TAG  = {Cliente:'tag-blue',Propietario:'tag-teal',Interna:'tag-gray'}

// Demandas (fuente: módulo Demanda)
const DEMS_U = [
  {ref:'D251035690',cuenta:'Corp. Financiera Azuaga SL',sup:'2.200–3.000 m²',zona:'Alcobendas',est:'En Curso',f:'17/10/2025'},
  {ref:'D250935800',cuenta:'Medicina Responsable SL',sup:'200–300 m²',zona:'Alcobendas',est:'En Curso',f:'01/10/2025'},
  {ref:'D250934000',cuenta:'Global Alumni Education SL',sup:'700–900 m²',zona:'Madrid',est:'En Curso',f:'03/09/2025'},
  {ref:'D250935600',cuenta:'Paraguas Grupo Hostelero SL',sup:'2.000–6.000 m²',zona:'Madrid',est:'En Curso',f:'30/09/2025'},
]

// Ofertas (fuente: módulo Oferta)
const OFRS_U = [
  {ref:'OLBUR2315645',activo:'Albatros Edif. D',m2:13486,renta:'12,50 €/m²',cliente:'Oracle Spain SL',est:'Negociando'},
  {ref:'OLB001',activo:'P.E Avalon',m2:1500,renta:'10,5–14,5 €/m²',cliente:'Empresa XYZ',est:'En negociación'},
]

// Operaciones cerradas (fuente: Transacciones / Arrendatarios)
const OPS_U = [
  {f:'Mar 2026',activo:'P.E Avalon',cliente:'Oracle Spain SL',m2:13486,renta:12.5,tipo:'Nuevo contrato',honorarios:'1,35 M€'},
  {f:'Nov 2025',activo:'P.E Avalon',cliente:'Generali R.E.',m2:1500,renta:14.5,tipo:'Renovación',honorarios:'420 k€'},
  {f:'Jun 2025',activo:'Albatros',cliente:'Corp. Financiera',m2:2500,renta:12.0,tipo:'Nuevo contrato',honorarios:'600 k€'},
  {f:'Feb 2025',activo:'P.E Avalon',cliente:'Celonis SE',m2:2702,renta:10.5,tipo:'Prórroga',honorarios:'280 k€'},
  {f:'Sep 2024',activo:'Torre Europa',cliente:'Pharma Group',m2:1200,renta:14.0,tipo:'Nuevo contrato',honorarios:'340 k€'},
]

const EVOL_ACTS = [
  {p:'Ene',v:1},{p:'Feb',v:0},{p:'Mar',v:2},{p:'Abr',v:1},{p:'May',v:0},
  {p:'Jun',v:0},{p:'Jul',v:0},{p:'Ago',v:0},{p:'Sep',v:2},{p:'Oct',v:3},{p:'Nov',v:0},{p:'Dic',v:0},
]
const maxActs = Math.max(...EVOL_ACTS.map(x=>x.v),1)

export default function FichaUsuario() {
  const { navigate } = useNav()
  const [tab, setTab] = useState('overview')
  const [fAnio, setFAnio] = useState('2026')
  const [fTrim, setFTrim] = useState('')

  return (
    <div style={{display:'flex',flex:1,overflow:'hidden'}}>
      <div className="ficha-main">

        {/* Header */}
        <div className="ah">
          <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
            <div style={{width:48,height:48,borderRadius:'50%',background:USUARIO.bg,border:`2px solid ${USUARIO.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:USUARIO.color,flexShrink:0}}>{USUARIO.iniciales}</div>
            <div style={{flex:1}}>
              <div className="ah-ref">
                <span style={{background:'var(--gray-lt)',color:'var(--text2)',border:'1px solid var(--border)',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>USUARIO SAVILLS</span>
                <span className="asset-link" style={{fontFamily:'var(--mono)'}}>{USUARIO.id}</span>
                <span className="tag tag-blue">{USUARIO.linea}</span>
              </div>
              <div className="ah-name">{USUARIO.nombre}</div>
              <div className="ah-addr">👤 {USUARIO.rol} · {USUARIO.equipo} · {USUARIO.email}</div>
              <div className="ah-tags">
                <span className="tag tag-teal">{USUARIO.equipo}</span>
                <span className="tag tag-blue">{USUARIO.ops_cerradas} ops cerradas</span>
                <span className="tag tag-green">{USUARIO.honorarios} honorarios</span>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5,alignItems:'flex-end',flexShrink:0}}>
              <select className="fsel" value={fAnio} onChange={e=>setFAnio(e.target.value)} style={{fontSize:10}}>
                <option value="">Todos los años</option>
                <option>2026</option><option>2025</option><option>2024</option>
              </select>
              <select className="fsel" value={fTrim} onChange={e=>setFTrim(e.target.value)} style={{fontSize:10}}>
                <option value="">Todos los trimestres</option>
                <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="kpi-strip" style={{gridTemplateColumns:'repeat(6,1fr)'}}>
          <div className="ks"><div className="ks-lbl">Actividades</div><div className="ks-val" style={{color:'var(--accent)'}}>{USUARIO.actividades}</div><div className="ks-sub" style={{fontSize:9,color:'var(--text4)'}}>← Actividades</div></div>
          <div className="ks"><div className="ks-lbl">Demandas</div><div className="ks-val">{USUARIO.demandas}</div><div className="ks-sub" style={{fontSize:9,color:'var(--text4)'}}>← Demanda</div></div>
          <div className="ks"><div className="ks-lbl">Ofertas</div><div className="ks-val green">{USUARIO.ofertas}</div><div className="ks-sub" style={{fontSize:9,color:'var(--text4)'}}>← Oferta</div></div>
          <div className="ks"><div className="ks-lbl">Proyectos</div><div className="ks-val" style={{color:'var(--teal)'}}>{USUARIO.proyectos}</div><div className="ks-sub" style={{fontSize:9,color:'var(--text4)'}}>← Proyectos</div></div>
          <div className="ks"><div className="ks-lbl">Ops cerradas</div><div className="ks-val" style={{color:'var(--purple)'}}>{USUARIO.ops_cerradas}</div><div className="ks-sub" style={{fontSize:9,color:'var(--text4)'}}>← Transacciones</div></div>
          <div className="ks"><div className="ks-lbl">M² gestionados</div><div className="ks-val">{(USUARIO.m2_gestionados/1000).toFixed(0)}k</div><div className="ks-sub" style={{fontSize:9,color:'var(--text4)'}}>← Activos + Ofertas</div></div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[['overview','Overview'],['actividades','Actividades ('+ACTS_U.length+')'],['demandas','Demandas ('+DEMS_U.length+')'],['ofertas','Ofertas ('+OFRS_U.length+')'],['operaciones','Ops cerradas ('+OPS_U.length+')'],['evolucion','Evolución']].map(([k,l])=>(
            <div key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</div>
          ))}
        </div>

        {/* Tab: Overview */}
        {tab==='overview' && (
          <div className="tab-content active">
            <div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                <div className="info-block">
                  <div className="ib-title">ACTIVIDAD GLOBAL<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Módulos operativos</span></div>
                  <div className="ir"><span className="ir-k">Total actividades</span><span className="ir-v" style={{color:'var(--accent)',fontWeight:700}}>{USUARIO.actividades}</span></div>
                  <div className="ir"><span className="ir-k">Demandas activas</span><span className="ir-v">{USUARIO.demandas}</span></div>
                  <div className="ir"><span className="ir-k">Ofertas en curso</span><span className="ir-v" style={{color:'var(--green)'}}>{USUARIO.ofertas}</span></div>
                  <div className="ir"><span className="ir-k">Proyectos abiertos</span><span className="ir-v" style={{color:'var(--teal)'}}>{USUARIO.proyectos}</span></div>
                  <div className="ir"><span className="ir-k">Ops cerradas</span><span className="ir-v" style={{color:'var(--purple)',fontWeight:700}}>{USUARIO.ops_cerradas}</span></div>
                </div>
                <div className="info-block">
                  <div className="ib-title">VOLUMEN Y HONORARIOS<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Transacciones</span></div>
                  <div className="ir"><span className="ir-k">Honorarios totales</span><span className="ir-v" style={{color:'var(--green)',fontWeight:700}}>{USUARIO.honorarios}</span></div>
                  <div className="ir"><span className="ir-k">Pipeline activo</span><span className="ir-v" style={{color:'var(--amber)'}}>{USUARIO.pipeline}</span></div>
                  <div className="ir"><span className="ir-k">M² gestionados</span><span className="ir-v">{USUARIO.m2_gestionados.toLocaleString()}</span></div>
                  <div className="ir"><span className="ir-k">M² / operación media</span><span className="ir-v">{Math.round(USUARIO.m2_gestionados/USUARIO.ops_cerradas).toLocaleString()}</span></div>
                </div>
                <div className="info-block">
                  <div className="ib-title">DISTRIBUCIÓN ACTIVIDAD<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Actividades</span></div>
                  {[
                    {label:'Con clientes',n:ACTS_U.filter(a=>a.cat==='Cliente').length,total:ACTS_U.length,color:'var(--accent)'},
                    {label:'Con propietarios',n:ACTS_U.filter(a=>a.cat==='Propietario').length,total:ACTS_U.length,color:'var(--teal)'},
                    {label:'Interna',n:ACTS_U.filter(a=>a.cat==='Interna').length,total:ACTS_U.length,color:'var(--gray)'},
                  ].map(d=>(
                    <div key={d.label} style={{marginBottom:7}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                        <span style={{fontSize:10,color:'var(--text3)'}}>{d.label}</span>
                        <span style={{fontSize:10,fontWeight:600,color:d.color}}>{d.n}</span>
                      </div>
                      <div style={{height:5,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${d.total?d.n/d.total*100:0}%`,background:d.color,borderRadius:3}}/>
                      </div>
                    </div>
                  ))}
                  <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:4}}>
                    {[['📧','Emails',USUARIO.actividades>0?5:0,'var(--accent)'],['📞','Llamadas',1,'var(--green)'],['🤝','Reuniones',2,'var(--purple)']].map(([ico,l,n,c])=>(
                      <div key={l} style={{flex:'1 0 auto',minWidth:60,background:'var(--gray-lt)',borderRadius:'var(--r)',padding:'4px 6px',textAlign:'center'}}>
                        <div style={{fontSize:11}}>{ico}</div>
                        <div style={{fontSize:9,color:'var(--text4)'}}>{l}</div>
                        <div style={{fontSize:12,fontWeight:700,color:c}}>{n}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Últimas actividades */}
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <div className="ib-title" style={{padding:'8px 14px'}}>ACTIVIDAD RECIENTE<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Actividades + Demandas + Ofertas</span></div>
                {[
                  ...ACTS_U.slice(0,3).map(a=>({tipo:a.tipo,texto:a.asunto,ref:a.ref,fecha:a.f,color:a.cat==='Propietario'?'var(--teal)':'var(--accent)'})),
                  ...OPS_U.slice(0,2).map(o=>({tipo:'Operación',texto:`${o.tipo} — ${o.cliente} · ${o.m2.toLocaleString()} m²`,ref:`Activo · ${o.activo}`,fecha:o.f,color:'var(--purple)'})),
                ].sort((a,b)=>0).map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:9,padding:'8px 14px',borderBottom:'1px solid var(--border)'}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:item.color,flexShrink:0,marginTop:4}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.texto}</div>
                      <div style={{fontSize:10,color:'var(--text4)'}}>{item.ref} · {item.fecha}</div>
                    </div>
                    <span className={`tag ${TIPO_TAG[item.tipo]||'tag-gray'}`} style={{fontSize:9,flexShrink:0}}>{item.tipo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Actividades */}
        {tab==='actividades' && (
          <div className="tab-content active">
            <div className="info-pad">
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <select className="fsel"><option>Todos los tipos</option><option>Email</option><option>Llamada</option><option>Reunión</option></select>
                <select className="fsel"><option>Todos los estados</option><option>Abierto</option><option>Finalizado</option></select>
                <select className="fsel"><option>Toda la actividad</option><option>Con clientes</option><option>Con propietarios</option><option>Interna</option></select>
                <span style={{fontSize:10,color:'var(--text4)',marginLeft:'auto',alignSelf:'center'}}>← Módulo Actividades</span>
              </div>
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>{['ID','Tipo','Asunto','Referente a','Fecha','Categoría','Estado'].map(h=>(
                      <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {ACTS_U.map(a=>(
                      <tr key={a.id} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-actividad')}>
                        <td style={{padding:'7px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{a.id}</span></td>
                        <td style={{padding:'7px 12px'}}><span className={`tag ${TIPO_TAG[a.tipo]||'tag-gray'}`}>{TIPO_ICO[a.tipo]} {a.tipo}</span></td>
                        <td style={{padding:'7px 12px',fontWeight:500,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.asunto}</td>
                        <td style={{padding:'7px 12px',fontSize:10,color:'var(--text3)'}}>{a.ref}</td>
                        <td style={{padding:'7px 12px',color:'var(--text3)'}}>{a.f}</td>
                        <td style={{padding:'7px 12px'}}><span className={`tag ${CAT_TAG[a.cat]}`}>{a.cat}</span></td>
                        <td style={{padding:'7px 12px'}}><span className={`tag ${a.est==='Abierto'?'tag-amber':'tag-gray'}`}>{a.est}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Demandas */}
        {tab==='demandas' && (
          <div className="tab-content active">
            <div className="info-pad">
              <div style={{marginBottom:8,fontSize:10,color:'var(--text4)',textAlign:'right'}}>← Módulo Demanda — filtrado por usuario creador</div>
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>{['Ref.','Cuenta','Superficie','Zona','Estado','Fecha'].map(h=>(
                      <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {DEMS_U.map(d=>(
                      <tr key={d.ref} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-demanda')}>
                        <td style={{padding:'7px 12px'}}><span className="dtbl-link mono">{d.ref}</span></td>
                        <td style={{padding:'7px 12px',fontWeight:500}}>{d.cuenta}</td>
                        <td style={{padding:'7px 12px'}}>{d.sup}</td>
                        <td style={{padding:'7px 12px',color:'var(--text3)'}}>{d.zona}</td>
                        <td style={{padding:'7px 12px'}}><span className="tag tag-green">{d.est}</span></td>
                        <td style={{padding:'7px 12px',color:'var(--text3)'}}>{d.f}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Ofertas */}
        {tab==='ofertas' && (
          <div className="tab-content active">
            <div className="info-pad">
              <div style={{marginBottom:8,fontSize:10,color:'var(--text4)',textAlign:'right'}}>← Módulo Oferta — filtrado por broker</div>
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>{['Ref. Oferta','Activo','M²','Renta','Cliente / Demanda','Estado'].map(h=>(
                      <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {OFRS_U.map(o=>(
                      <tr key={o.ref} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-oferta')}>
                        <td style={{padding:'7px 12px'}}><span className="dtbl-link mono">{o.ref}</span></td>
                        <td style={{padding:'7px 12px',fontWeight:500}}>{o.activo}</td>
                        <td style={{padding:'7px 12px',fontWeight:600}}>{o.m2.toLocaleString()}</td>
                        <td style={{padding:'7px 12px'}}>{o.renta}</td>
                        <td style={{padding:'7px 12px',color:'var(--accent)'}}>{o.cliente}</td>
                        <td style={{padding:'7px 12px'}}><span className={`tag ${o.est==='En negociación'?'tag-amber':'tag-blue'}`}>{o.est}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Operaciones cerradas */}
        {tab==='operaciones' && (
          <div className="tab-content active">
            <div className="info-pad">
              <div style={{marginBottom:8,fontSize:10,color:'var(--text4)',textAlign:'right'}}>← Transacciones + Arrendatarios — filtrado por usuario responsable</div>
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>{['Fecha','Activo','Cliente','M²','Renta €/m²','Tipo','Honorarios'].map(h=>(
                      <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {OPS_U.map((o,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                        <td style={{padding:'7px 12px',fontWeight:500,color:'var(--text3)'}}>{o.f}</td>
                        <td style={{padding:'7px 12px'}}><span className="dtbl-link">{o.activo}</span></td>
                        <td style={{padding:'7px 12px',fontWeight:500}}>{o.cliente}</td>
                        <td style={{padding:'7px 12px',fontWeight:600}}>{o.m2.toLocaleString()}</td>
                        <td style={{padding:'7px 12px'}}>{o.renta} €</td>
                        <td style={{padding:'7px 12px'}}><span className={`tag ${o.tipo==='Nuevo contrato'?'tag-green':o.tipo==='Renovación'?'tag-blue':'tag-amber'}`}>{o.tipo}</span></td>
                        <td style={{padding:'7px 12px',fontWeight:700,color:'var(--green)'}}>{o.honorarios}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'var(--gray-lt)',borderTop:'2px solid var(--border)'}}>
                      <td colSpan={3} style={{padding:'7px 12px',fontWeight:700,fontSize:11}}>TOTAL</td>
                      <td style={{padding:'7px 12px',fontWeight:700}}>{OPS_U.reduce((s,o)=>s+o.m2,0).toLocaleString()} m²</td>
                      <td/>
                      <td style={{padding:'7px 12px',fontWeight:600,color:'var(--text3)'}}>{OPS_U.length} operaciones</td>
                      <td style={{padding:'7px 12px',fontWeight:700,color:'var(--green)'}}>~3,2 M€</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Evolución */}
        {tab==='evolucion' && (
          <div className="tab-content active">
            <div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                {/* Actividad mensual */}
                <div className="info-block">
                  <div className="ib-title">Actividad mensual 2025<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Actividades</span></div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:4,height:70,marginTop:8}}>
                    {EVOL_ACTS.map(d=>(
                      <div key={d.p} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                        {d.v>0 && <span style={{fontSize:8,fontWeight:600,color:'var(--accent)'}}>{d.v}</span>}
                        <div style={{width:'100%',background:d.v>0?'var(--accent)':'var(--border)',borderRadius:'2px 2px 0 0',height:`${Math.round(d.v/maxActs*55)+2}px`}}/>
                        <span style={{fontSize:8,color:'var(--text4)'}}>{d.p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Honorarios por año */}
                <div className="info-block">
                  <div className="ib-title">Honorarios anuales<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Transacciones</span></div>
                  {[{y:'2026',v:3.2,ytd:true},{y:'2025',v:2.8},{y:'2024',v:1.9},{y:'2023',v:2.1}].map(d=>(
                    <div key={d.y} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                      <span style={{fontSize:10,color:'var(--text3)',width:28}}>{d.y}{d.ytd&&<span style={{fontSize:8,color:'var(--green)',marginLeft:2}}>YTD</span>}</span>
                      <div style={{flex:1,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${d.v/4*100}%`,background:d.ytd?'var(--green)':'var(--border2)',borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:d.ytd?'var(--green)':'var(--text2)',width:40,textAlign:'right'}}>{d.v} M€</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Clientes y propietarios con los que ha trabajado */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="info-block">
                  <div className="ib-title">Clientes trabajados<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Demandas + Actividades</span></div>
                  {USUARIO.clientes.map((c,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                      <div style={{width:5,height:5,borderRadius:'50%',background:'var(--accent)',flexShrink:0}}/>
                      <span style={{fontSize:11,color:'var(--text2)'}}>{c}</span>
                    </div>
                  ))}
                </div>
                <div className="info-block">
                  <div className="ib-title">Propietarios trabajados<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Activos + Proyectos</span></div>
                  {USUARIO.propietarios.map((p,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                      <div style={{width:5,height:5,borderRadius:'50%',background:'var(--teal)',flexShrink:0}}/>
                      <span style={{fontSize:11,color:'var(--text2)'}}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel derecho */}
      <div className="ficha-right">
        <div className="rp-sec">
          <div className="rp-lbl">Perfil</div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:USUARIO.bg,border:`2px solid ${USUARIO.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:USUARIO.color,flexShrink:0}}>{USUARIO.iniciales}</div>
            <div>
              <div style={{fontSize:12,fontWeight:600}}>{USUARIO.nombre}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>{USUARIO.rol}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>{USUARIO.equipo}</div>
            </div>
          </div>
          <div className="kf-grid">
            <div className="kf"><div className="kf-lbl">Ops cerradas</div><div className="kf-val" style={{color:'var(--purple)'}}>{USUARIO.ops_cerradas}</div></div>
            <div className="kf"><div className="kf-lbl">Honorarios</div><div className="kf-val" style={{color:'var(--green)',fontSize:11}}>{USUARIO.honorarios}</div></div>
            <div className="kf"><div className="kf-lbl">Pipeline</div><div className="kf-val amber" style={{fontSize:11}}>{USUARIO.pipeline}</div></div>
            <div className="kf"><div className="kf-lbl">M² gestionados</div><div className="kf-val" style={{fontSize:10}}>{(USUARIO.m2_gestionados/1000).toFixed(0)}k m²</div></div>
          </div>
        </div>

        <div className="rp-sec">
          <div className="rp-lbl">Origen del dato</div>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {[
              {fuente:'Actividades',dato:'Nº actividades · Tipos',color:'var(--accent)'},
              {fuente:'Demanda',dato:'Demandas gestionadas',color:'var(--blue)'},
              {fuente:'Oferta',dato:'Ofertas activas',color:'var(--green)'},
              {fuente:'Proyectos',dato:'Mandatos · Proyectos',color:'var(--teal)'},
              {fuente:'Transacciones',dato:'Ops cerradas · Honorarios',color:'var(--purple)'},
              {fuente:'Activos + Ofertas',dato:'M² gestionados',color:'var(--amber)'},
            ].map(f=>(
              <div key={f.fuente} style={{display:'flex',alignItems:'center',gap:7,padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{width:4,height:28,borderRadius:2,background:f.color,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:f.color}}>{f.fuente}</div>
                  <div style={{fontSize:9,color:'var(--text4)'}}>{f.dato}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rp-sec">
          <div className="rp-lbl">Asistente IA</div>
          <div className="ai-box">
            <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Análisis usuario</span><span className="ai-badge">Tiempo real</span></div>
            <div className="ai-text"><strong>5 operaciones</strong> cerradas, 3,2 M€ en honorarios. Pipeline activo 1,1 M€. Oracle en fase finalista — posible cierre Q2 2026.</div>
            <div className="ai-cta">✎ Ver objetivos del equipo</div>
          </div>
        </div>
      </div>
    </div>
  )
}
