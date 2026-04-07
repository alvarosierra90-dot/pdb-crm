import { useState } from 'react'
import { useNav } from '../context/NavigationContext'

const COLAB_INIT = [
  { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable visita', initials:'AS', bg:'#dbeafe', color:'#1e40af', principal:true },
  { name:'García Marta', team:'Arquitectura / Workplace', role:'Asesor implantación', initials:'GM', bg:'#f3e8ff', color:'#6b21a8', principal:false },
]

export default function FichaVisita() {
  const { navigate } = useNav()
  const [tab, setTab] = useState('info')
  const [colabTeams, setColabTeams] = useState(COLAB_INIT)
  const [addingTeam, setAddingTeam] = useState(false)
  const [newTeam, setNewTeam] = useState('')

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Nueva visita</button>
        <button className="ab-btn">Cancelar visita</button>
        <div className="ab-sep"/>
        <button className="ab-btn blue">📎 Vincular actividad</button>
        <button className="ab-btn" onClick={()=>navigate('visitas')}>← Volver</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#064e3b,#10b981)',fontSize:20}}>👁</div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'var(--teal-lt)',color:'var(--teal)',border:'1px solid var(--teal-bd)',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>VISITA</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>VIS-001</span>
                  <span className="tag tag-green">● Realizada</span>
                </div>
                <div className="ah-name">Corp. Financiera Azuaga SL — Albatros Edif. D</div>
                <div className="ah-addr">📍 C. Anabel Segura 9-11, Alcobendas · 13/11/2025 · 10:00 · Estefanía García</div>
                <div className="ah-tags">
                  <span className="tag tag-teal">Visita inicial</span>
                  <span className="tag tag-green">● Realizada</span>
                  <span className="tag tag-blue">Alto interés</span>
                  <span className="tag tag-gray">Prob. cierre: 60%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tabs">
            <div className={`tab ${tab==='info'?'active':''}`} onClick={()=>setTab('info')}>Información</div>
            <div className={`tab ${tab==='feed'?'active':''}`} onClick={()=>setTab('feed')}>Feedback comercial</div>
            <div className={`tab ${tab==='acts'?'active':''}`} onClick={()=>setTab('acts')}>Actividades relacionadas</div>
            <div className={`tab ${tab==='colab'?'active':''}`} onClick={()=>setTab('colab')}>👥 Equipos colaboradores{colabTeams.length > 1 && <span style={{marginLeft:5,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{colabTeams.length}</span>}</div>
          </div>

          {/* Tab Información */}
          <div className={`tab-content ${tab==='info'?'active':''}`}>
            <div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>🗓 Datos de la visita</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">ID</span><span className="ir-v mono">VIS-001</span></div>
                    <div className="ir"><span className="ir-k">Fecha</span><span className="ir-v">13/11/2025 · 10:00</span></div>
                    <div className="ir"><span className="ir-k">Tipo visita</span><span className="ir-v"><span className="tag tag-teal">Inicial</span></span></div>
                    <div className="ir"><span className="ir-k">Estado</span><span className="ir-v"><span className="tag tag-green">Realizada</span></span></div>
                    <div className="ir"><span className="ir-k">Motivo</span><span className="ir-v" style={{fontSize:10}}>Última planta con terraza</span></div>
                    <div className="ir"><span className="ir-k">Creada</span><span className="ir-v">12/11/2025</span></div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>🔗 Registros vinculados</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Cuenta</span><span className="ir-v link">Corp. Financiera ↗</span></div>
                    <div className="ir"><span className="ir-k">Demanda</span><span className="ir-v link mono">D251035690 ↗</span></div>
                    <div className="ir"><span className="ir-k">Activo</span><span className="ir-v link">Albatros Edif. D ↗</span></div>
                    <div className="ir"><span className="ir-k">Oferta</span><span className="ir-v link mono">OLBUR2315645 ↗</span></div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>👤 Contacto</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Contacto</span><span className="ir-v">Estefanía García</span></div>
                    <div className="ir"><span className="ir-k">Cargo</span><span className="ir-v">Dir. Inmobiliaria</span></div>
                    <div className="ir"><span className="ir-k">Teléfono</span><span className="ir-v">+34 650 xxx xxx</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Feedback */}
          <div className={`tab-content ${tab==='feed'?'active':''}`}>
            <div className="info-pad">
              <div className="info-2col">
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>💬 Feedback del cliente</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Nivel de interés</span><span className="ir-v"><span className="tag tag-blue">Alto</span></span></div>
                    <div className="ir"><span className="ir-k">Probabilidad cierre</span><span className="ir-v" style={{color:'var(--green)',fontWeight:700}}>60%</span></div>
                    <div className="ir"><span className="ir-k">Próximos pasos</span><span className="ir-v" style={{fontSize:10}}>Segunda visita técnica</span></div>
                    <div className="ir"><span className="ir-k">Decisión esperada</span><span className="ir-v">Dic 2025</span></div>
                    <div className="ir"><span className="ir-k">Competencia</span><span className="ir-v">2 activos alternativos</span></div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>📝 Notas</div>
                  <textarea style={{padding:8,border:'1px solid var(--border2)',borderRadius:'var(--r)',fontSize:12,fontFamily:'inherit',outline:'none',background:'#fff',width:'100%',resize:'vertical',minHeight:150}}
                    defaultValue="Cliente muy interesado en la última planta con terraza. Confirman que el espacio se ajusta a sus necesidades (2.500 m²). Solicitan propuesta económica y visita técnica."/>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Actividades relacionadas */}
          <div className={`tab-content ${tab==='acts'?'active':''}`}>
            <div className="info-pad">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:600}}>Actividades relacionadas</div>
                <button className="ab-btn blue" onClick={()=>navigate('ficha-actividad')}>+ Nueva actividad</button>
              </div>
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>
                      {['Fecha','Tipo','Asunto','Por','Estado'].map(h=>(
                        <th key={h} style={{padding:'6px 10px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{borderBottom:'1px solid var(--border)'}}>
                      <td style={{padding:'7px 10px'}}>20/10/2025</td>
                      <td style={{padding:'7px 10px'}}><span className="tag tag-blue">📧 Email</span></td>
                      <td style={{padding:'7px 10px'}}>Propuesta arrendamiento Albatros</td>
                      <td style={{padding:'7px 10px'}}>Sierra Alvaro</td>
                      <td style={{padding:'7px 10px'}}><span className="tag tag-amber">Abierto</span></td>
                    </tr>
                    <tr>
                      <td style={{padding:'7px 10px'}}>12/11/2025</td>
                      <td style={{padding:'7px 10px'}}><span className="tag tag-green">📞 Llamada</span></td>
                      <td style={{padding:'7px 10px'}}>Confirmación visita 13/11</td>
                      <td style={{padding:'7px 10px'}}>Sierra Alvaro</td>
                      <td style={{padding:'7px 10px'}}><span className="tag tag-gray">Finalizado</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Tab Equipos colaboradores */}
          <div className={`tab-content ${tab==='colab'?'active':''}`}>
            <div className="info-pad">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>Equipos colaboradores</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>Gestiona qué equipos y usuarios participan en esta visita</div>
                </div>
                <button className="ab-btn blue" onClick={()=>setAddingTeam(true)}>+ Añadir equipo / usuario</button>
              </div>

              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Participantes actuales</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {colabTeams.map((t,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',border:'1px solid var(--border)',borderRadius:'var(--r)',background:'var(--surface)'}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:t.bg,color:t.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{t.initials}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600}}>{t.name}</div>
                        <div style={{fontSize:10,color:'var(--text3)'}}>{t.team} · {t.role}</div>
                      </div>
                      <span className={`tag ${t.principal?'tag-blue':'tag-gray'}`}>{t.principal?'Responsable':'Colaborador'}</span>
                      {!t.principal && <button onClick={()=>setColabTeams(prev=>prev.filter((_,j)=>j!==i))} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'2px 6px',fontFamily:'inherit'}}>✕ Quitar</button>}
                    </div>
                  ))}
                </div>
              </div>

              {addingTeam && (
                <div style={{border:'1px solid var(--accent-bd)',background:'var(--accent-lt)',borderRadius:'var(--r2)',padding:14,marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Añadir equipo o usuario</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Equipo</span>
                      <select className="fsel" value={newTeam} onChange={e=>setNewTeam(e.target.value)} style={{minWidth:220}}>
                        <option value="">Seleccionar equipo...</option>
                        <option>Arquitectura / Workplace</option>
                        <option>Capital Markets MAD</option>
                        <option>Retail MAD</option>
                        <option>Logístico MAD</option>
                        <option>Hoteles</option>
                        <option>Valoraciones MAD</option>
                        <option>Centros Comerciales</option>
                      </select>
                    </div>
                    <button className="ab-btn save" onClick={()=>{
                      if(!newTeam)return
                      const ini=newTeam.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                      setColabTeams(prev=>[...prev,{name:newTeam,team:newTeam,role:'Colaborador',initials:ini,bg:'#f3e8ff',color:'#6b21a8',principal:false}])
                      setAddingTeam(false);setNewTeam('')
                    }}>Añadir</button>
                    <button className="ab-btn" onClick={()=>{setAddingTeam(false);setNewTeam('')}}>Cancelar</button>
                  </div>
                </div>
              )}

              <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Historial de colaboración</div>
              <div style={{border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
                {[
                  {color:'var(--green)',msg:'Sierra Álvaro invitó a García Marta (Arquitectura / Workplace) a colaborar',date:'13/11/2025 · 10:30'},
                  {color:'var(--accent)',msg:'García Marta aceptó la invitación y accedió a la visita',date:'13/11/2025 · 11:15'},
                  {color:'var(--accent)',msg:'Visita creada — responsable asignado: Sierra Álvaro (Transaction Spain)',date:'12/11/2025 · 09:00'},
                ].map((e,i,arr)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 12px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:e.color,flexShrink:0,marginTop:4}}/>
                    <div><div style={{fontSize:11}}>{e.msg}</div><div style={{fontSize:10,color:'var(--text4)'}}>{e.date}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right panel */}
        <div className="ficha-right">
          <div className="rp-sec">
            <div className="rp-lbl">Estado visita</div>
            <select style={{width:'100%',fontSize:12,padding:'5px 8px',border:'1px solid var(--border2)',borderRadius:'var(--r)',fontFamily:'inherit',marginBottom:8}}>
              <option>Realizada</option><option>Pendiente</option><option>Cancelada</option>
            </select>
            <RpBtn>🔍 Ver demanda ↗</RpBtn>
            <RpBtn>📋 Ver oferta ↗</RpBtn>
            <RpBtn>🏢 Ver activo ↗</RpBtn>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Interés y probabilidad</div>
            <div className="kf-grid">
              <div className="kf"><div className="kf-lbl">Interés</div><div className="kf-val" style={{color:'var(--accent)'}}>Alto</div></div>
              <div className="kf"><div className="kf-lbl">Prob. cierre</div><div className="kf-val" style={{color:'var(--green)'}}>60%</div></div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Registros vinculados</div>
            <LinkedRecord type="Demanda" id="D251035690" name="Corp. Financiera Azuaga SL" color="var(--accent)" bg="var(--accent-lt)" border="var(--accent-bd)"/>
            <LinkedRecord type="Oferta" id="OLBUR2315645" color="var(--teal)" bg="var(--teal-lt)" border="var(--teal-bd)"/>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Asistente IA</div>
            <div className="ai-box">
              <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Insight visita</span></div>
              <div className="ai-text">Interés <strong>alto</strong>. 60% prob. — programar seguimiento en 5 días.</div>
              <div className="ai-cta">✎ Generar email de seguimiento</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RpBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',padding:'5px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'#fff',fontSize:11,fontWeight:500,cursor:'pointer',color:'var(--text2)',fontFamily:'inherit',marginBottom:4}}>
      {children}
    </button>
  )
}

function LinkedRecord({ type, id, name, color, bg, border }) {
  return (
    <div style={{background:bg,border:`1px solid ${border}`,borderRadius:'var(--r)',padding:'7px 9px',marginBottom:5,cursor:'pointer'}}>
      <div style={{fontSize:9,fontWeight:600,color,textTransform:'uppercase',marginBottom:2}}>{type}</div>
      <div style={{fontSize:11,fontWeight:600,color}}>{id}</div>
      {name && <div style={{fontSize:10,color:'var(--text3)'}}>{name}</div>}
    </div>
  )
}
