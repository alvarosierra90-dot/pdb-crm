import { useState } from 'react'
import { useNav } from '../context/NavigationContext'

// ── Datos del mandato MAN-2501 ──
const M = {
  id:'MAN-2501', titulo:'Exclusiva Leasing — P.E Avalon · P4 y P5',
  tipo:'Leasing', excl:'Coexclusiva', estado:'Activo',
  cuenta:'Merlín Properties SOCIMI', cuenta_id:'MRL',
  activos:[
    {ref:'MAD-OF-00189',nombre:'P.E Avalon',zona:'M-30 · Madrid',uso:'Oficinas',sba:4050,occ:78.4,renta:10.5},
  ],
  responsable:'Sierra Alvaro', responsable_ini:'AS',
  equipo:'Leasing Oficinas MAD', linea:'Leasing',
  miembros:[
    {nombre:'Sierra Alvaro',rol:'Responsable principal',ini:'AS',color:'var(--accent)'},
    {nombre:'Consultor MAD',rol:'Consultor de apoyo',ini:'CM',color:'var(--purple)'},
  ],
  cobrokers:[
    {consultora:'CBRE',contacto:'María García López',rol:'Co-agente',email:'mgarcia@cbre.es',tel:'+34 91 598 44 00'},
    {consultora:'JLL', contacto:'Carlos Martínez',   rol:'Co-agente',email:'carlos.martinez@jll.com',tel:'+34 91 789 11 00'},
  ],
  provincia:'Madrid', zona:'M-30',
  fecha_concesion:'01/02/2025',
  fecha_inicio:'01/03/2025',
  fecha_fin:'28/02/2026',
  fecha_preaviso:'29/01/2026',   // fecha_fin - preaviso_dias
  preaviso_dias:30,
  alerta_dias:60,
  prorroga_tacita:true,
  prorroga_meses:6,
  prorroga_inicio:'01/03/2026',  // si se activa
  prorroga_fin:'31/08/2026',
  condiciones:'Exclusiva de comercialización para las plantas P4 (1.500 m²) y P5 (2.550 m²) del Edificio A, P.E Avalon. Comisión pactada: 15% sobre la renta anual del primer año.',
  condiciones_prorroga:'Prórroga tácita por períodos de 6 meses si ninguna de las partes notifica rescisión con 30 días de antelación.',
  observaciones:'Mandato firmado tras visita de Oracle Spain. Se han realizado 2 visitas técnicas. Negociación activa con Empresa XYZ (NEG-0044).',
  honorarios_pct:15, honorarios_base:'renta anual 1er año',
  sba_mandato:4050,
  dias_restantes:55,
  ofertas_activas:2,
  actividades:4,
}

// ── Alertas / hitos del mandato ──
const ALERTAS = [
  {tipo:'warning',label:'Alerta vencimiento',desc:'Quedan 55 días para el vencimiento del mandato (28/02/2026)',fecha:'28/02/2026',dias:55,activa:true},
  {tipo:'info',   label:'Preaviso contractual',desc:'La fecha límite para notificar rescisión es el 29/01/2026',fecha:'29/01/2026',dias:24,activa:true},
  {tipo:'neutral',label:'Prórroga tácita',desc:'Si no hay rescisión antes del 29/01/2026, el mandato se prorroga automáticamente 6 meses hasta 31/08/2026',fecha:'01/03/2026',dias:null,activa:false},
  {tipo:'success',label:'Mandato activo',desc:'Mandato en vigor desde 01/03/2025',fecha:'01/03/2025',dias:null,activa:true},
]

// ── Actividades vinculadas ──
const ACTS = [
  {id:'ACT-2507',tipo:'Reunión',asunto:'Presentación portfolio Merlín — revisión mandato',fecha:'30/09/2025',estado:'Finalizado'},
  {id:'ACT-2501',tipo:'Email',asunto:'Propuesta arrendamiento Albatros — Edif. D',fecha:'20/10/2025',estado:'Abierto'},
  {id:'ACT-TAR-01',tipo:'Llamada',asunto:'Llamada propietario Barings — estado mandato',fecha:'12/03/2026',estado:'Finalizado'},
  {id:'TAR-001',tipo:'Tarea',asunto:'Llamar a propietario — Activo Avalon',fecha:'07/04/2026',estado:'En curso'},
]

// ── Documentos ──
const DOCS = [
  {nombre:'Contrato de mandato MAN-2501.pdf',cat:'Contrato',fecha:'01/02/2025',autor:'Sierra Alvaro',size:'1.2 MB'},
  {nombre:'Anexo I — Condiciones económicas.pdf',cat:'Anexo',fecha:'01/02/2025',autor:'Sierra Alvaro',size:'320 KB'},
  {nombre:'Presentación comercial P.E Avalon Q1 2025.pptx',cat:'Comercial',fecha:'15/03/2025',autor:'Sierra Alvaro',size:'4.8 MB'},
  {nombre:'Informe de mercado M-30 — Savills Q1 2026.pdf',cat:'Informe',fecha:'01/03/2026',autor:'Research MAD',size:'2.1 MB'},
]

// ── Transacciones firmadas bajo el mandato ──
const TRANS = [
  {id:'TRX-2501',fecha:'15/11/2025',activo:'P.E Avalon',arrendatario:'Oracle Spain SL',m2:1500,renta:10.5,tipo:'Arrendamiento',honorarios:'23.625 €',estado:'Firmado'},
]

// ── Visitas vinculadas a los activos del mandato ──
const VISS = [
  {id:'VIS-012',fecha:'20/09/2025',cuenta:'Oracle Spain SL',demanda:'DEM-0089',activo:'P.E Avalon',tipo:'Técnica',estado:'Realizada',interes:'Alto',prob:80},
  {id:'VIS-018',fecha:'05/10/2025',cuenta:'Empresa XYZ SA',demanda:'DEM-0102',activo:'P.E Avalon',tipo:'Comercial',estado:'Realizada',interes:'Medio',prob:45},
  {id:'VIS-024',fecha:'18/11/2025',cuenta:'Oracle Spain SL',demanda:'DEM-0089',activo:'P.E Avalon',tipo:'Segunda visita',estado:'Realizada',interes:'Alto',prob:85},
]

const DOC_TAG = {Contrato:'tag-purple',Anexo:'tag-blue',Comercial:'tag-teal',Informe:'tag-amber',Legal:'tag-red'}
const TIPO_TAG= {Email:'tag-blue',Llamada:'tag-green','Reunión':'tag-purple',Tarea:'tag-gray'}
const TIPO_ICO= {Email:'📧',Llamada:'📞','Reunión':'🤝',Tarea:'✅'}
const ACT_EST = {Abierto:'tag-amber',Finalizado:'tag-gray','En curso':'tag-blue'}

// ── Cronograma helpers ──
// Fechas reales en ms para calcular posiciones
function parseES(s) {
  if(!s) return null
  const [d,mo,y] = s.split('/')
  return new Date(+y,+mo-1,+d).getTime()
}
const T_INI   = parseES(M.fecha_inicio)
const T_FIN   = parseES(M.prorroga_fin) // timeline hasta fin de prórroga
const T_RANGE = T_FIN - T_INI
const pct = d => Math.max(0,Math.min(100, (parseES(d)-T_INI)/T_RANGE*100))
const TODAY_PCT = Math.max(0,Math.min(100,(Date.now()-T_INI)/T_RANGE*100))

function RpBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',padding:'5px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'#fff',fontSize:11,fontWeight:500,cursor:'pointer',color:'var(--text2)',fontFamily:'inherit',marginBottom:4}}>
      {children}
    </button>
  )
}

export default function FichaMandato() {
  const { navigate } = useNav()
  const [tab, setTab] = useState('info')

  const diasColor = M.dias_restantes <= 0 ? 'var(--red)'
    : M.dias_restantes <= 30 ? 'var(--red)'
    : M.dias_restantes <= 60 ? 'var(--amber)'
    : 'var(--green)'

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Guardar y cerrar</button>
        <button className="ab-btn">Renovar mandato</button>
        <button className="ab-btn">Rescindir</button>
        <div className="ab-sep"/>
        <button className="ab-btn blue">📎 Vincular activo</button>
        <button className="ab-btn blue">📋 Nueva actividad</button>
        <button className="ab-btn" onClick={()=>navigate('mandatos')}>← Volver</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Header */}
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#4c1d95,#7c3aed)',fontSize:20}}>📋</div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'var(--purple-lt)',color:'var(--purple)',border:'1px solid var(--purple-bd)',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>MANDATO</span>
                  <span className="mono">{M.id}</span>
                  <span className={`tag ${M.excl==='Coexclusiva'?'tag-teal':'tag-purple'}`}>{M.excl}</span>
                  <span className="tag tag-blue">{M.tipo}</span>
                  <span className="tag tag-green">{M.estado}</span>
                </div>
                <div className="ah-name">{M.titulo}</div>
                <div className="ah-addr">🏢 {M.cuenta} · 📍 {M.zona} · {M.provincia} · 🏗 {M.activos.length} activo{M.activos.length>1?'s':''}</div>
                <div className="ah-tags">
                  <span className="tag tag-teal">{M.equipo}</span>
                  <span className="tag tag-gray">{M.fecha_inicio} → {M.fecha_fin}</span>
                  {M.prorroga_tacita && <span className="tag tag-teal">Prórr. tácita {M.prorroga_meses}m</span>}
                  <span style={{fontSize:10,fontWeight:700,color:diasColor,background:M.dias_restantes<=30?'var(--red-lt)':M.dias_restantes<=60?'var(--amber-lt)':'var(--green-lt)',border:`1px solid ${M.dias_restantes<=30?'var(--red-bd)':M.dias_restantes<=60?'var(--amber-bd)':'var(--green-bd)'}`,padding:'1px 7px',borderRadius:9}}>
                    {M.dias_restantes>0?`⏳ ${M.dias_restantes} días restantes`:'⚠ Vencido'}
                  </span>
                </div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:9,color:'var(--text4)',textTransform:'uppercase'}}>Responsable</div>
                <div style={{display:'flex',alignItems:'center',gap:5,marginTop:4,justifyContent:'flex-end'}}>
                  <div className="c-av" style={{background:'var(--accent-lt)',color:'var(--accent)',width:22,height:22,fontSize:8}}>{M.responsable_ini}</div>
                  <span style={{fontSize:11,fontWeight:600}}>{M.responsable}</span>
                </div>
                <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>{M.equipo}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {[['info','Información'],['cronograma','Cronograma'],['alertas',`Alertas (${ALERTAS.filter(a=>a.activa).length})`],['activos','Activos vinculados'],['actividades',`Actividades (${ACTS.length})`],['transacciones',`Transacciones (${TRANS.length})`],['visitas',`Visitas (${VISS.length})`],['docs',`Documentación (${DOCS.length})`],['equipo','Equipo']].map(([k,l])=>(
              <div key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</div>
            ))}
          </div>

          {/* ── TAB: INFORMACIÓN ── */}
          {tab==='info' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                  <div className="info-block">
                    <div className="ib-title">IDENTIFICACIÓN</div>
                    <div className="ir"><span className="ir-k">ID mandato</span><span className="ir-v mono">{M.id}</span></div>
                    <div className="ir"><span className="ir-k">Tipo</span><span className="ir-v"><span className="tag tag-blue">{M.tipo}</span></span></div>
                    <div className="ir"><span className="ir-k">Exclusividad</span><span className="ir-v"><span className={`tag ${M.excl==='Coexclusiva'?'tag-teal':'tag-purple'}`}>{M.excl}</span></span></div>
                    <div className="ir"><span className="ir-k">Estado</span><span className="ir-v"><span className="tag tag-green">{M.estado}</span></span></div>
                    <div className="ir"><span className="ir-k">Línea de negocio</span><span className="ir-v">{M.linea}</span></div>
                    <div className="ir"><span className="ir-k">Equipo</span><span className="ir-v">{M.equipo}</span></div>
                  </div>
                  <div className="info-block">
                    <div className="ib-title">FECHAS CONTRACTUALES</div>
                    <div className="ir"><span className="ir-k">Concesión</span><span className="ir-v">{M.fecha_concesion}</span></div>
                    <div className="ir"><span className="ir-k">Inicio</span><span className="ir-v">{M.fecha_inicio}</span></div>
                    <div className="ir"><span className="ir-k">Finalización</span><span className="ir-v" style={{color:diasColor,fontWeight:600}}>{M.fecha_fin}</span></div>
                    <div className="ir"><span className="ir-k">Límite preaviso</span><span className="ir-v" style={{color:'var(--amber)',fontWeight:600}}>{M.fecha_preaviso}</span></div>
                    <div className="ir"><span className="ir-k">Preaviso (días)</span><span className="ir-v">{M.preaviso_dias} días</span></div>
                    <div className="ir"><span className="ir-k">Alerta PDB</span><span className="ir-v">{M.alerta_dias} días antes</span></div>
                  </div>
                  <div className="info-block">
                    <div className="ib-title">PRÓRROGA</div>
                    <div className="ir"><span className="ir-k">Prórroga tácita</span><span className="ir-v" style={{color:M.prorroga_tacita?'var(--teal)':'var(--text3)',fontWeight:600}}>{M.prorroga_tacita?'Sí':'No'}</span></div>
                    {M.prorroga_tacita && <>
                      <div className="ir"><span className="ir-k">Duración prórroga</span><span className="ir-v">{M.prorroga_meses} meses</span></div>
                      <div className="ir"><span className="ir-k">Inicio prórroga</span><span className="ir-v">{M.prorroga_inicio}</span></div>
                      <div className="ir"><span className="ir-k">Fin prórroga</span><span className="ir-v">{M.prorroga_fin}</span></div>
                    </>}
                    <div className="ir"><span className="ir-k">Honorarios</span><span className="ir-v">{M.honorarios_pct}% {M.honorarios_base}</span></div>
                    <div className="ir"><span className="ir-k">SBA bajo mandato</span><span className="ir-v">{M.sba_mandato.toLocaleString()} m²</span></div>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="info-block">
                    <div className="ib-title">CONDICIONES DEL MANDATO</div>
                    <p style={{fontSize:11,color:'var(--text2)',lineHeight:1.6,marginBottom:10}}>{M.condiciones}</p>
                    <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>Condiciones de prórroga</div>
                    <p style={{fontSize:11,color:'var(--text3)',lineHeight:1.6}}>{M.condiciones_prorroga}</p>
                  </div>
                  <div className="info-block">
                    <div className="ib-title">CUENTA VINCULADA</div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <div style={{width:32,height:32,borderRadius:6,background:'var(--gray-lt)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'var(--text)'}}>{M.cuenta_id}</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:'var(--accent)',cursor:'pointer'}}>{M.cuenta}</div>
                        <div className="asset-sub">SOCIMI · Madrid</div>
                      </div>
                    </div>
                    <div className="ib-title" style={{marginTop:10}}>OBSERVACIONES INTERNAS</div>
                    <p style={{fontSize:11,color:'var(--text2)',lineHeight:1.6}}>{M.observaciones}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: CRONOGRAMA ── */}
          {tab==='cronograma' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div className="info-block" style={{marginBottom:12}}>
                  <div className="ib-title">VIDA CONTRACTUAL DEL MANDATO · CRONOGRAMA VISUAL</div>

                  {/* Timeline principal */}
                  <div style={{position:'relative',margin:'24px 8px 40px',userSelect:'none'}}>

                    {/* Etiquetas de fechas — top */}
                    {[
                      {label:'Concesión',fecha:M.fecha_concesion,p:pct(M.fecha_concesion),color:'var(--text3)'},
                      {label:'Inicio',fecha:M.fecha_inicio,p:0,color:'var(--green)'},
                      {label:'Preaviso',fecha:M.fecha_preaviso,p:pct(M.fecha_preaviso),color:'var(--amber)'},
                      {label:'Vencimiento',fecha:M.fecha_fin,p:pct(M.fecha_fin),color:'var(--red)'},
                      {label:'Fin prórroga',fecha:M.prorroga_fin,p:100,color:'var(--purple)'},
                    ].map(item=>(
                      <div key={item.label} style={{position:'absolute',left:`${item.p}%`,top:-22,transform:'translateX(-50%)',textAlign:'center',minWidth:60}}>
                        <div style={{fontSize:9,fontWeight:600,color:item.color,whiteSpace:'nowrap'}}>{item.label}</div>
                      </div>
                    ))}

                    {/* Barra de fondo */}
                    <div style={{position:'relative',height:28,borderRadius:6,overflow:'visible'}}>

                      {/* Segmento: periodo activo */}
                      <div style={{position:'absolute',left:'0%',width:`${pct(M.fecha_fin)}%`,height:'100%',background:'linear-gradient(90deg,#dcfce7,#bbf7d0)',borderRadius:'6px 0 0 6px'}}/>

                      {/* Segmento: prórroga */}
                      <div style={{position:'absolute',left:`${pct(M.fecha_fin)}%`,width:`${100-pct(M.fecha_fin)}%`,height:'100%',background:'linear-gradient(90deg,#ede9fe,#ddd6fe)',borderRadius:'0 6px 6px 0',borderLeft:'2px dashed var(--purple)'}}/>

                      {/* Zona de alerta (últimos 60 días antes del fin) */}
                      <div style={{position:'absolute',left:`${pct(M.fecha_preaviso)-5}%`,width:`${pct(M.fecha_fin)-pct(M.fecha_preaviso)+5}%`,height:'100%',background:'rgba(251,191,36,.25)',borderLeft:'2px solid var(--amber)'}}/>

                      {/* Marcador Hoy */}
                      <div style={{position:'absolute',left:`${TODAY_PCT}%`,top:-4,bottom:-4,width:2,background:'var(--accent)',zIndex:2}}>
                        <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',background:'var(--accent)',color:'#fff',fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap'}}>HOY</div>
                      </div>

                      {/* Etiquetas en la barra */}
                      <div style={{position:'absolute',left:'2%',top:'50%',transform:'translateY(-50%)',fontSize:9,fontWeight:700,color:'var(--green)'}}>ACTIVO</div>
                      <div style={{position:'absolute',left:`${pct(M.fecha_fin)+1}%`,top:'50%',transform:'translateY(-50%)',fontSize:9,fontWeight:700,color:'var(--purple)'}}>PRÓRROGA {M.prorroga_meses}m</div>
                    </div>

                    {/* Marcadores de fecha — bottom */}
                    {[
                      {fecha:M.fecha_inicio,p:0,color:'var(--green)'},
                      {fecha:M.fecha_preaviso,p:pct(M.fecha_preaviso),color:'var(--amber)'},
                      {fecha:M.fecha_fin,p:pct(M.fecha_fin),color:'var(--red)'},
                      {fecha:M.prorroga_fin,p:100,color:'var(--purple)'},
                    ].map(m=>(
                      <div key={m.fecha} style={{position:'absolute',left:`${m.p}%`,top:30,transform:'translateX(-50%)',textAlign:'center'}}>
                        <div style={{width:1,height:8,background:m.color,margin:'0 auto 2px'}}/>
                        <div style={{fontSize:8,fontWeight:600,color:m.color,whiteSpace:'nowrap'}}>{m.fecha}</div>
                      </div>
                    ))}
                  </div>

                  {/* Leyenda */}
                  <div style={{display:'flex',gap:16,flexWrap:'wrap',marginTop:8}}>
                    {[
                      {color:'var(--green)',bg:'#dcfce7',label:'Periodo activo'},
                      {color:'var(--amber)',bg:'rgba(251,191,36,.25)',label:'Zona de preaviso / alerta'},
                      {color:'var(--purple)',bg:'#ede9fe',label:'Prórroga tácita'},
                      {color:'var(--accent)',bg:'var(--accent)',label:'Hoy'},
                    ].map(l=>(
                      <div key={l.label} style={{display:'flex',alignItems:'center',gap:5}}>
                        <div style={{width:12,height:8,borderRadius:2,background:l.bg,border:`1px solid ${l.color}`}}/>
                        <span style={{fontSize:10,color:'var(--text3)'}}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hitos en tabla */}
                <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                  <div className="ib-title" style={{padding:'8px 14px'}}>HITOS CONTRACTUALES</div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr>{['Hito','Fecha','Estado','Descripción'].map(h=>(
                        <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {[
                        {hito:'Concesión del mandato',fecha:M.fecha_concesion,est:'Completado',desc:'Mandato firmado y concedido por el propietario',color:'var(--green)'},
                        {hito:'Inicio del mandato',fecha:M.fecha_inicio,est:'Completado',desc:'Inicio del periodo de comercialización exclusiva',color:'var(--green)'},
                        {hito:'Alerta PDB (60 días)',fecha:'30/12/2025',est:'Completado',desc:'Notificación automática enviada al responsable',color:'var(--teal)'},
                        {hito:'Límite preaviso',fecha:M.fecha_preaviso,est:'Próximo',desc:`Último día para notificar rescisión sin activar prórroga`,color:'var(--amber)'},
                        {hito:'Vencimiento mandato',fecha:M.fecha_fin,est:'Próximo',desc:'Fin del periodo contractual principal',color:'var(--red)'},
                        {hito:'Inicio prórroga tácita',fecha:M.prorroga_inicio,est:'Pendiente',desc:`Si no hay rescisión: prórroga automática de ${M.prorroga_meses} meses`,color:'var(--purple)'},
                        {hito:'Fin prórroga',fecha:M.prorroga_fin,est:'Pendiente',desc:'Vencimiento final incluyendo prórroga',color:'var(--purple)'},
                      ].map((h,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                          <td style={{padding:'7px 12px',fontWeight:500}}>{h.hito}</td>
                          <td style={{padding:'7px 12px',fontWeight:600,color:h.color,fontFamily:'monospace'}}>{h.fecha}</td>
                          <td style={{padding:'7px 12px'}}>
                            <span className={`tag ${h.est==='Completado'?'tag-green':h.est==='Próximo'?'tag-amber':'tag-gray'}`}>{h.est}</span>
                          </td>
                          <td style={{padding:'7px 12px',fontSize:10,color:'var(--text3)'}}>{h.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: ALERTAS ── */}
          {tab==='alertas' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                  {[
                    {label:'Días para vencimiento',val:`${M.dias_restantes}d`,color:'var(--red)',bg:'var(--red-lt)',bd:'var(--red-bd)'},
                    {label:'Días para preaviso',val:'24d',color:'var(--amber)',bg:'var(--amber-lt)',bd:'var(--amber-bd)'},
                    {label:'Prórroga si no se rescinde',val:`+${M.prorroga_meses}m`,color:'var(--purple)',bg:'var(--purple-lt)',bd:'var(--purple-bd)'},
                  ].map(k=>(
                    <div key={k.label} style={{background:k.bg,border:`1px solid ${k.bd}`,borderRadius:'var(--r)',padding:'10px 14px'}}>
                      <div style={{fontSize:9,fontWeight:600,color:k.color,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>{k.label}</div>
                      <div style={{fontSize:22,fontWeight:700,color:k.color}}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {ALERTAS.map((a,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 14px',marginBottom:8,background:'var(--surface)',border:`1px solid ${a.tipo==='warning'?'var(--red-bd)':a.tipo==='info'?'var(--amber-bd)':a.tipo==='success'?'var(--green-bd)':'var(--border)'}`,borderRadius:'var(--r)',borderLeft:`4px solid ${a.tipo==='warning'?'var(--red)':a.tipo==='info'?'var(--amber)':a.tipo==='success'?'var(--green)':'var(--border2)'}`}}>
                    <div style={{fontSize:18,flexShrink:0}}>
                      {a.tipo==='warning'?'⚠️':a.tipo==='info'?'⏳':a.tipo==='success'?'✅':'🔔'}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--text)',marginBottom:3}}>{a.label}</div>
                      <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.5}}>{a.desc}</div>
                      <div style={{fontSize:10,color:'var(--text4)',marginTop:4}}>Fecha: {a.fecha}{a.dias&&` · En ${a.dias} días`}</div>
                    </div>
                    <span className={`tag ${a.activa?'tag-green':'tag-gray'}`} style={{flexShrink:0}}>{a.activa?'Activa':'Pendiente'}</span>
                  </div>
                ))}

                <div className="info-block" style={{marginTop:14}}>
                  <div className="ib-title">CONFIGURACIÓN DE ALERTAS</div>
                  {[
                    {label:'Alerta antes del vencimiento',val:`${M.alerta_dias} días antes`,editable:true},
                    {label:'Alerta antes del preaviso',val:`${M.preaviso_dias} días antes`,editable:true},
                    {label:'Notificar prórroga tácita',val:M.prorroga_tacita?'Activado':'Desactivado',editable:true},
                    {label:'Destinatario principal',val:M.responsable,editable:true},
                    {label:'Destinatario copia',val:M.equipo,editable:true},
                  ].map(c=>(
                    <div key={c.label} className="ir">
                      <span className="ir-k">{c.label}</span>
                      <span className="ir-v" style={{color:'var(--accent)',cursor:'pointer'}}>{c.val} ✎</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: ACTIVOS VINCULADOS ── */}
          {tab==='activos' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:600}}>Activos bajo mandato · {M.activos.length} activo{M.activos.length>1?'s':''} · {M.sba_mandato.toLocaleString()} m² SBA total</div>
                  <button className="ab-btn blue">+ Añadir activo</button>
                </div>
                <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr>{['Activo','Zona / Ciudad','Uso','SBA mandato','Ocupación','Renta €/m²','Ofertas activas',''].map(h=>(
                        <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {M.activos.map(a=>(
                        <tr key={a.ref} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>
                          <td style={{padding:'8px 12px'}}>
                            <div className="dtbl-link">{a.nombre}</div>
                            <div className="asset-sub mono">{a.ref}</div>
                          </td>
                          <td style={{padding:'8px 12px',fontSize:11,color:'var(--text3)'}}>{a.zona}</td>
                          <td style={{padding:'8px 12px'}}><span className="tag tag-blue">{a.uso}</span></td>
                          <td style={{padding:'8px 12px',fontWeight:600}}>{a.sba.toLocaleString()} m²</td>
                          <td style={{padding:'8px 12px'}}>
                            <div className="occ-cell">
                              <div className="occ-bar"><div className="occ-bar-fill" style={{width:`${a.occ}%`,background:a.occ>=90?'var(--green)':a.occ>=75?'var(--amber)':'var(--red)'}}/></div>
                              <span style={{fontSize:11,color:a.occ>=90?'var(--green)':a.occ>=75?'var(--amber)':'var(--red)'}}>{a.occ}%</span>
                            </div>
                          </td>
                          <td style={{padding:'8px 12px'}}>{a.renta} €</td>
                          <td style={{padding:'8px 12px',fontWeight:600,color:'var(--accent)'}}>{M.ofertas_activas}</td>
                          <td style={{padding:'8px 12px'}}><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>Ver activo</button></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{background:'var(--gray-lt)',borderTop:'2px solid var(--border)'}}>
                        <td colSpan={3} style={{padding:'7px 12px',fontWeight:700,fontSize:11}}>TOTAL MANDATO</td>
                        <td style={{padding:'7px 12px',fontWeight:700}}>{M.sba_mandato.toLocaleString()} m²</td>
                        <td colSpan={4}/>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* Ofertas vinculadas */}
                <div style={{marginTop:14,fontSize:11,fontWeight:600,marginBottom:8}}>Ofertas vinculadas a este mandato</div>
                <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr>{['Ref. Oferta','Activo','Espacio','Renta','Estado',''].map(h=>(
                        <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      <tr style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-oferta')}>
                        <td style={{padding:'7px 12px'}}><span className="dtbl-link mono">OLB001</span></td>
                        <td style={{padding:'7px 12px',fontWeight:500}}>P.E Avalon</td>
                        <td style={{padding:'7px 12px',color:'var(--text3)'}}>P5 · 1.500 m²</td>
                        <td style={{padding:'7px 12px'}}>10,5–14,5 €/m²</td>
                        <td style={{padding:'7px 12px'}}><span className="tag tag-amber">En negociación</span></td>
                        <td style={{padding:'7px 12px'}}><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-oferta')}}>Ver</button></td>
                      </tr>
                      <tr style={{cursor:'pointer'}} onClick={()=>navigate('ficha-oferta')}>
                        <td style={{padding:'7px 12px'}}><span className="dtbl-link mono">OLB002</span></td>
                        <td style={{padding:'7px 12px',fontWeight:500}}>P.E Avalon</td>
                        <td style={{padding:'7px 12px',color:'var(--text3)'}}>P3 · 2.550 m²</td>
                        <td style={{padding:'7px 12px'}}>11,0–13,0 €/m²</td>
                        <td style={{padding:'7px 12px'}}><span className="tag tag-blue">En curso</span></td>
                        <td style={{padding:'7px 12px'}}><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-oferta')}}>Ver</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: ACTIVIDADES ── */}
          {tab==='actividades' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:600}}>Actividades vinculadas al mandato</div>
                  <button className="ab-btn blue" onClick={()=>navigate('ficha-actividad')}>+ Nueva actividad</button>
                </div>
                <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr>{['ID','Tipo','Asunto','Fecha','Estado'].map(h=>(
                        <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {ACTS.map(a=>(
                        <tr key={a.id} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-actividad')}>
                          <td style={{padding:'7px 12px'}}><span className="mono" style={{color:'var(--text3)'}}>{a.id}</span></td>
                          <td style={{padding:'7px 12px'}}><span className={`tag ${TIPO_TAG[a.tipo]||'tag-gray'}`}>{TIPO_ICO[a.tipo]} {a.tipo}</span></td>
                          <td style={{padding:'7px 12px',fontWeight:500}}>{a.asunto}</td>
                          <td style={{padding:'7px 12px',color:'var(--text3)'}}>{a.fecha}</td>
                          <td style={{padding:'7px 12px'}}><span className={`tag ${ACT_EST[a.estado]||'tag-gray'}`}>{a.estado}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: TRANSACCIONES ── */}
          {tab==='transacciones' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                  {[
                    {lbl:'Operaciones firmadas',val:TRANS.length,color:'var(--green)'},
                    {lbl:'m² totales',val:TRANS.reduce((s,t)=>s+t.m2,0).toLocaleString()+' m²',color:'var(--accent)'},
                    {lbl:'Renta media',val:TRANS.length?(TRANS.reduce((s,t)=>s+t.renta,0)/TRANS.length).toFixed(1)+' €/m²':'—',color:'var(--text)'},
                    {lbl:'Honorarios generados',val:TRANS.reduce((s,t)=>{const n=parseFloat(t.honorarios.replace(/[^0-9.,]/g,'').replace(',','.'));return s+(isNaN(n)?0:n)},0).toLocaleString('es-ES',{minimumFractionDigits:0})+'€',color:'var(--purple)'},
                  ].map(k=>(
                    <div key={k.lbl} className="ks"><div className="ks-lbl">{k.lbl}</div><div className="ks-val" style={{color:k.color}}>{k.val}</div></div>
                  ))}
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{fontSize:11,fontWeight:600}}>Operaciones firmadas bajo este mandato</div>
                  <span style={{fontSize:10,color:'var(--text4)'}}>← Módulo Arrendatarios / Transacciones</span>
                </div>
                {TRANS.length === 0 ? (
                  <div style={{textAlign:'center',padding:'40px 0',color:'var(--text4)',fontSize:12}}>
                    <div style={{fontSize:32,marginBottom:8}}>📄</div>
                    <div>No hay transacciones firmadas bajo este mandato</div>
                  </div>
                ) : (
                  <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead>
                        <tr>{['ID','Fecha firma','Activo','Arrendatario','m²','Renta €/m²','Tipo','Honorarios','Estado',''].map(h=>(
                          <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {TRANS.map((t,i)=>(
                          <tr key={t.id} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-negociacion')}>
                            <td style={{padding:'8px 12px'}}><span className="mono" style={{color:'var(--text3)',fontSize:10}}>{t.id}</span></td>
                            <td style={{padding:'8px 12px',color:'var(--text3)'}}>{t.fecha}</td>
                            <td style={{padding:'8px 12px',fontWeight:500,color:'var(--accent)'}}>{t.activo}</td>
                            <td style={{padding:'8px 12px',fontWeight:500}}>{t.arrendatario}</td>
                            <td style={{padding:'8px 12px',fontWeight:600}}>{t.m2.toLocaleString()} m²</td>
                            <td style={{padding:'8px 12px'}}>{t.renta} €</td>
                            <td style={{padding:'8px 12px'}}><span className="tag tag-blue">{t.tipo}</span></td>
                            <td style={{padding:'8px 12px',fontWeight:600,color:'var(--purple)'}}>{t.honorarios}</td>
                            <td style={{padding:'8px 12px'}}><span className="tag tag-green">{t.estado}</span></td>
                            <td style={{padding:'8px 12px'}}><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-negociacion')}}>Ver</button></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{background:'var(--gray-lt)',borderTop:'2px solid var(--border)'}}>
                          <td colSpan={4} style={{padding:'7px 12px',fontWeight:700,fontSize:11}}>TOTAL</td>
                          <td style={{padding:'7px 12px',fontWeight:700}}>{TRANS.reduce((s,t)=>s+t.m2,0).toLocaleString()} m²</td>
                          <td colSpan={2}/>
                          <td style={{padding:'7px 12px',fontWeight:700,color:'var(--purple)'}}>{TRANS.reduce((s,t)=>{const n=parseFloat(t.honorarios.replace(/[^0-9.,]/g,'').replace(',','.'));return s+(isNaN(n)?0:n)},0).toLocaleString('es-ES',{minimumFractionDigits:0})+' €'}</td>
                          <td colSpan={2}/>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: VISITAS ── */}
          {tab==='visitas' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                  {[
                    {lbl:'Total visitas',val:VISS.length,color:'var(--accent)'},
                    {lbl:'Realizadas',val:VISS.filter(v=>v.estado==='Realizada').length,color:'var(--green)'},
                    {lbl:'Alto interés',val:VISS.filter(v=>v.interes==='Alto').length,color:'var(--amber)'},
                    {lbl:'Prob. media KF',val:VISS.length?Math.round(VISS.reduce((s,v)=>s+v.prob,0)/VISS.length)+'%':'—',color:'var(--purple)'},
                  ].map(k=>(
                    <div key={k.lbl} className="ks"><div className="ks-lbl">{k.lbl}</div><div className="ks-val" style={{color:k.color}}>{k.val}</div></div>
                  ))}
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{fontSize:11,fontWeight:600}}>Visitas a activos bajo este mandato</div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:10,color:'var(--text4)'}}>← Módulo Visitas</span>
                    <button className="ab-btn blue" onClick={()=>navigate('ficha-visita')}>+ Nueva visita</button>
                  </div>
                </div>
                {VISS.length === 0 ? (
                  <div style={{textAlign:'center',padding:'40px 0',color:'var(--text4)',fontSize:12}}>
                    <div style={{fontSize:32,marginBottom:8}}>🏢</div>
                    <div>No hay visitas registradas para los activos de este mandato</div>
                  </div>
                ) : (
                  <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead>
                        <tr>{['ID','Fecha','Cuenta','Demanda','Activo','Tipo visita','Estado','Interés','Prob. KF',''].map(h=>(
                          <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {VISS.map((v,i)=>(
                          <tr key={v.id} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-visita')}>
                            <td style={{padding:'8px 12px'}}><span className="mono" style={{color:'var(--text3)',fontSize:10}}>{v.id}</span></td>
                            <td style={{padding:'8px 12px',color:'var(--text3)'}}>{v.fecha}</td>
                            <td style={{padding:'8px 12px',fontWeight:500}}>{v.cuenta}</td>
                            <td style={{padding:'8px 12px'}}><span className="mono" style={{fontSize:10,color:'var(--accent)'}}>{v.demanda}</span></td>
                            <td style={{padding:'8px 12px',fontWeight:500,color:'var(--teal)'}}>{v.activo}</td>
                            <td style={{padding:'8px 12px'}}><span className="tag tag-blue">{v.tipo}</span></td>
                            <td style={{padding:'8px 12px'}}><span className="tag tag-green">{v.estado}</span></td>
                            <td style={{padding:'8px 12px'}}>
                              <span style={{fontSize:10,fontWeight:600,color:v.interes==='Alto'?'var(--accent)':v.interes==='Medio'?'var(--amber)':'var(--text3)'}}>{v.interes==='Alto'?'⬆':v.interes==='Medio'?'→':'⬇'} {v.interes}</span>
                            </td>
                            <td style={{padding:'8px 12px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:5}}>
                                <div style={{width:44,height:5,borderRadius:3,background:'var(--border2)',overflow:'hidden'}}>
                                  <div style={{width:`${v.prob}%`,height:'100%',background:v.prob>=70?'var(--green)':v.prob>=40?'var(--amber)':'var(--red)',borderRadius:3}}/>
                                </div>
                                <span style={{fontSize:10,fontWeight:600,color:v.prob>=70?'var(--green)':v.prob>=40?'var(--amber)':'var(--red)'}}>{v.prob}%</span>
                              </div>
                            </td>
                            <td style={{padding:'8px 12px'}}><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-visita')}}>Ver</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: DOCUMENTACIÓN ── */}
          {tab==='docs' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:600}}>Documentación del mandato · {DOCS.length} documentos</div>
                  <button className="ab-btn blue">📎 Adjuntar documento</button>
                </div>
                <div style={{border:'2px dashed var(--border2)',borderRadius:'var(--r2)',padding:18,textAlign:'center',color:'var(--text4)',fontSize:11,cursor:'pointer',marginBottom:14}}>
                  Arrastra aquí los documentos o haz clic para seleccionarlos
                </div>
                <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr>{['Documento','Categoría','Fecha','Autor','Tamaño',''].map(h=>(
                        <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {DOCS.map((d,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}}>
                          <td style={{padding:'8px 12px'}}>
                            <div style={{fontSize:11,fontWeight:500,color:'var(--accent)',cursor:'pointer'}}>📄 {d.nombre}</div>
                          </td>
                          <td style={{padding:'8px 12px'}}><span className={`tag ${DOC_TAG[d.cat]||'tag-gray'}`}>{d.cat}</span></td>
                          <td style={{padding:'8px 12px',color:'var(--text3)'}}>{d.fecha}</td>
                          <td style={{padding:'8px 12px',color:'var(--text3)'}}>{d.autor}</td>
                          <td style={{padding:'8px 12px',color:'var(--text4)'}}>{d.size}</td>
                          <td style={{padding:'8px 12px'}}>
                            <div style={{display:'flex',gap:4}}>
                              <button className="ra">⬇</button>
                              <button className="ra">👁</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: EQUIPO ── */}
          {tab==='equipo' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="info-block">
                    <div className="ib-title">MIEMBROS DEL EQUIPO</div>
                    {M.miembros.map((mb,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<M.miembros.length-1?'1px solid var(--border)':'none'}}>
                        <div style={{width:34,height:34,borderRadius:'50%',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--accent)',flexShrink:0}}>{mb.ini}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:600}}>{mb.nombre}</div>
                          <div style={{fontSize:10,color:'var(--text3)'}}>{mb.rol}</div>
                        </div>
                        <span className="tag tag-blue">Leasing</span>
                      </div>
                    ))}
                    <button className="ab-btn" style={{width:'100%',marginTop:8,justifyContent:'center'}}>+ Añadir miembro</button>
                  </div>
                  <div className="info-block">
                    <div className="ib-title">DEPARTAMENTOS IMPLICADOS</div>
                    {[
                      {dept:'Leasing Oficinas MAD',rol:'Equipo principal',ops:4,color:'var(--accent)'},
                      {dept:'Research MAD',rol:'Informes de mercado',ops:1,color:'var(--teal)'},
                      {dept:'Valoraciones MAD',rol:'Valoración del activo',ops:1,color:'var(--purple)'},
                    ].map((d,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 0',borderBottom:i<2?'1px solid var(--border)':'none'}}>
                        <div style={{width:4,borderRadius:2,alignSelf:'stretch',background:d.color,flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,fontWeight:600}}>{d.dept}</div>
                          <div style={{fontSize:10,color:'var(--text3)'}}>{d.rol} · {d.ops} actividad{d.ops>1?'es':''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Co-brokers (solo Coexclusiva) */}
                {M.excl === 'Coexclusiva' && (
                  <div className="info-block" style={{marginTop:12,borderLeft:'3px solid var(--teal)',paddingLeft:0,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',borderBottom:'1px solid var(--border)',background:'var(--teal-lt)'}}>
                      <div>
                        <div className="ib-title" style={{marginBottom:0}}>CO-CORREDORES · COEXCLUSIVA</div>
                        <div style={{fontSize:10,color:'var(--teal)',marginTop:2}}>Otras consultoras co-mandatadas para la comercialización</div>
                      </div>
                      <button className="ab-btn" style={{flexShrink:0}}>+ Añadir co-corredor</button>
                    </div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead>
                        <tr>{['Consultora','Contacto','Rol','Email','Teléfono',''].map(h=>(
                          <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {M.cobrokers.map((cb,i)=>(
                          <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                            <td style={{padding:'8px 12px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:7}}>
                                <div style={{width:26,height:26,borderRadius:4,background:'var(--teal-lt)',border:'1px solid var(--teal-bd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:'var(--teal)',flexShrink:0}}>{cb.consultora.slice(0,3)}</div>
                                <span style={{fontWeight:600,fontSize:11}}>{cb.consultora}</span>
                              </div>
                            </td>
                            <td style={{padding:'8px 12px',fontWeight:500}}>{cb.contacto}</td>
                            <td style={{padding:'8px 12px'}}><span className="tag tag-teal">{cb.rol}</span></td>
                            <td style={{padding:'8px 12px',color:'var(--accent)',fontSize:10}}>{cb.email}</td>
                            <td style={{padding:'8px 12px',color:'var(--text3)',fontSize:10}}>{cb.tel}</td>
                            <td style={{padding:'8px 12px'}}>
                              <div style={{display:'flex',gap:4}}>
                                <button className="ra">✎</button>
                                <button className="ra" style={{color:'var(--red)'}}>✕</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Trazabilidad */}
                <div className="info-block" style={{marginTop:12}}>
                  <div className="ib-title">TRAZABILIDAD · MÓDULOS RELACIONADOS</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                    {[
                      {label:'Cuenta',val:M.cuenta,ico:'🏢',nav:'portfolios'},
                      {label:'Activos',val:`${M.activos.length} activo`,ico:'🏗',nav:'ficha-activo'},
                      {label:'Ofertas',val:`${M.ofertas_activas} activas`,ico:'📋',nav:'ficha-oferta'},
                      {label:'Actividades',val:`${M.actividades} registradas`,ico:'📝',nav:'actividades'},
                    ].map(t=>(
                      <div key={t.label} style={{background:'var(--gray-lt)',borderRadius:'var(--r)',padding:'10px 12px',cursor:'pointer',border:'1px solid var(--border)'}} onClick={()=>navigate(t.nav)}>
                        <div style={{fontSize:18,marginBottom:4}}>{t.ico}</div>
                        <div style={{fontSize:9,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>{t.label}</div>
                        <div style={{fontSize:12,fontWeight:600,color:'var(--accent)',marginTop:2}}>{t.val} ↗</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Panel derecho ── */}
        <div className="ficha-right">
          {/* Vencimiento destacado */}
          <div className="rp-sec">
            <div className="rp-lbl">Estado del mandato</div>
            <div style={{background:M.dias_restantes<=30?'var(--red-lt)':M.dias_restantes<=60?'var(--amber-lt)':'var(--green-lt)',border:`1px solid ${M.dias_restantes<=30?'var(--red-bd)':M.dias_restantes<=60?'var(--amber-bd)':'var(--green-bd)'}`,borderRadius:'var(--r)',padding:'10px 12px',marginBottom:8}}>
              <div style={{fontSize:9,fontWeight:600,color:diasColor,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>{M.estado}</div>
              <div style={{fontSize:22,fontWeight:700,color:diasColor,lineHeight:1}}>{M.dias_restantes}d</div>
              <div style={{fontSize:10,color:diasColor,marginTop:2}}>restantes · vence {M.fecha_fin}</div>
            </div>
            {M.prorroga_tacita && (
              <div style={{background:'var(--purple-lt)',border:'1px solid var(--purple-bd)',borderRadius:'var(--r)',padding:'7px 10px',fontSize:10}}>
                <div style={{fontWeight:600,color:'var(--purple)',marginBottom:2}}>Prórroga tácita activa</div>
                <div style={{color:'var(--text3)'}}>+{M.prorroga_meses} meses si no hay rescisión antes del {M.fecha_preaviso}</div>
              </div>
            )}
          </div>

          {/* Fechas clave */}
          <div className="rp-sec">
            <div className="rp-lbl">Fechas clave</div>
            <div className="kf-grid">
              <div className="kf"><div className="kf-lbl">Inicio</div><div className="kf-val" style={{fontSize:10}}>{M.fecha_inicio}</div></div>
              <div className="kf"><div className="kf-lbl">Fin</div><div className="kf-val" style={{fontSize:10,color:diasColor}}>{M.fecha_fin}</div></div>
              <div className="kf"><div className="kf-lbl">Preaviso</div><div className="kf-val amber" style={{fontSize:10}}>{M.fecha_preaviso}</div></div>
              <div className="kf"><div className="kf-lbl">Fin prórr.</div><div className="kf-val" style={{fontSize:10,color:'var(--purple)'}}>{M.prorroga_fin}</div></div>
            </div>
          </div>

          {/* Cuenta */}
          <div className="rp-sec">
            <div className="rp-lbl">Cuenta</div>
            <div style={{background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'7px 9px',cursor:'pointer'}} onClick={()=>navigate('portfolios')}>
              <div style={{fontSize:9,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',marginBottom:1}}>Propietario</div>
              <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{M.cuenta}</div>
              <div style={{fontSize:10,color:'var(--text4)'}}>Ver portfolio ↗</div>
            </div>
          </div>

          {/* Activos */}
          <div className="rp-sec">
            <div className="rp-lbl">Activos vinculados</div>
            {M.activos.map(a=>(
              <div key={a.ref} style={{background:'var(--teal-lt)',border:'1px solid var(--teal-bd)',borderRadius:'var(--r)',padding:'7px 9px',marginBottom:5,cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>
                <div style={{fontSize:9,fontWeight:600,color:'var(--teal)',textTransform:'uppercase',marginBottom:1}}>{a.ref}</div>
                <div style={{fontSize:11,fontWeight:600,color:'var(--teal)'}}>{a.nombre}</div>
                <div style={{fontSize:10,color:'var(--text3)'}}>{a.sba.toLocaleString()} m² · {a.occ}% ocupado</div>
              </div>
            ))}
          </div>

          {/* Responsable */}
          <div className="rp-sec">
            <div className="rp-lbl">Responsable</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'var(--accent)'}}>{M.responsable_ini}</div>
              <div>
                <div style={{fontSize:11,fontWeight:600}}>{M.responsable}</div>
                <div style={{fontSize:10,color:'var(--text3)'}}>{M.equipo}</div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="rp-sec">
            <div className="rp-lbl">Acciones rápidas</div>
            <RpBtn onClick={()=>setTab('cronograma')}>📅 Ver cronograma</RpBtn>
            <RpBtn onClick={()=>setTab('alertas')}>⚠ Gestionar alertas</RpBtn>
            <RpBtn onClick={()=>navigate('ficha-actividad')}>📋 Nueva actividad</RpBtn>
            <RpBtn onClick={()=>setTab('docs')}>📎 Ver documentación</RpBtn>
          </div>

          {/* IA */}
          <div className="rp-sec">
            <div className="rp-lbl">Asistente IA</div>
            <div className="ai-box">
              <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Insight mandato</span><span className="ai-badge">Tiempo real</span></div>
              <div className="ai-text">Mandato vence en <strong>55 días</strong>. Preaviso en 24 días — acción urgente. NEG-0044 activa con Oracle: posible cierre antes del vencimiento.</div>
              <div className="ai-cta">✎ Preparar propuesta de renovación</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
