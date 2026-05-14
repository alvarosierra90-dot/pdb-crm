import { useState } from 'react'
import { useNav } from '../context/NavigationContext'

export default function FichaActividad() {
  const { navigate } = useNav()
  const [tab, setTab] = useState('info')

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Guardar y cerrar</button>
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn">Marcar finalizado</button>
        <div className="ab-sep"/>
        <button className="ab-btn blue">📎 Vincular registro</button>
        <button className="ab-btn" onClick={()=>navigate('actividades')}>← Volver</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">
          {/* Header */}
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#1e3a5f,#B08D57)',fontSize:20}}>📧</div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>ACTIVIDAD</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>ACT-2501</span>
                  <span className="tag tag-amber">Abierto</span>
                </div>
                <div className="ah-name">Propuesta arrendamiento Albatros — Edif. D</div>
                <div className="ah-addr">👤 Sierra Alvaro · Leasing Oficinas MAD · 20/10/2025 13:40</div>
                <div className="ah-tags">
                  <span className="tag tag-blue">📧 Email</span>
                  <span className="tag tag-blue">Demanda</span>
                  <span className="tag tag-amber">Abierto</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <div className={`tab ${tab==='info'?'active':''}`} onClick={()=>setTab('info')}>Información</div>
            <div className={`tab ${tab==='hist'?'active':''}`} onClick={()=>setTab('hist')}>Historial de cambios</div>
          </div>

          {/* Tab: Información */}
          <div className={`tab-content ${tab==='info'?'active':''}`}>
            <div className="info-pad">
              <div className="info-2col">
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',margin:'0 0 8px'}}>📋 Datos</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">ID</span><span className="ir-v mono">ACT-2501</span></div>
                    <div className="ir"><span className="ir-k">Tipo</span><span className="ir-v"><span className="tag tag-blue">📧 Email</span></span></div>
                    <div className="ir"><span className="ir-k">Estado</span><span className="ir-v"><span className="tag tag-amber">Abierto</span></span></div>
                    <div className="ir"><span className="ir-k">Fecha creación</span><span className="ir-v">20/10/2025 · 13:40</span></div>
                    <div className="ir"><span className="ir-k">Usuario creador</span><span className="ir-v link">Sierra Alvaro</span></div>
                    <div className="ir"><span className="ir-k">Equipo</span><span className="ir-v">Leasing Oficinas MAD</span></div>
                    <div className="ir"><span className="ir-k">Modificado por</span><span className="ir-v link">Sierra Alvaro</span></div>
                  </div>

                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',margin:'14px 0 8px'}}>🔗 Referente a</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Tipo de registro</span><span className="ir-v"><span className="tag tag-blue">Demanda</span></span></div>
                    <div className="ir"><span className="ir-k">ID relacionado</span><span className="ir-v link mono">D251035690 ↗</span></div>
                    <div className="ir"><span className="ir-k">Cuenta</span><span className="ir-v link">Corp. Financiera Azuaga SL</span></div>
                  </div>
                </div>

                <div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',margin:'0 0 8px'}}>✏️ Contenido</div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>Asunto</div>
                    <input className="search-inp" style={{paddingLeft:9}} defaultValue="Propuesta arrendamiento Albatros — Edif. D"/>
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>Descripción</div>
                    <textarea style={{padding:8,border:'1px solid var(--border2)',borderRadius:'var(--r)',fontSize:12,fontFamily:'inherit',outline:'none',background:'#fff',width:'100%',resize:'vertical',minHeight:150}}
                      defaultValue="Estimados, adjunto propuesta de arrendamiento para Albatros Edif. D — 2.500 m² en zona Alcobendas. Oferta incluye P4, P3 y P1 con renta 12,50 €/m²/mes."/>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab: Historial */}
          <div className={`tab-content ${tab==='hist'?'active':''}`}>
            <div className="info-pad">
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>Historial de cambios · <span style={{fontWeight:400,color:'var(--text4)'}}>AUDITABLE</span></div>
                <HistItem color="var(--green)" text="Actividad creada — Email enviado a Corp. Financiera Azuaga SL" by="Sierra Alvaro" date="20/10/2025 · 13:40"/>
                <HistItem color="var(--accent)" text={<>Estado: <strong>Abierto</strong> — pendiente de respuesta</>} by="Sierra Alvaro" date="20/10/2025 · 13:41"/>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="ficha-right">
          <div className="rp-sec">
            <div className="rp-lbl">Estado</div>
            <select style={{width:'100%',fontSize:12,padding:'5px 8px',border:'1px solid var(--border2)',borderRadius:'var(--r)',fontFamily:'inherit',marginBottom:8}}>
              <option>Abierto</option><option>Finalizado</option>
            </select>
            <RpBtn>✅ Marcar finalizado</RpBtn>
            <RpBtn>🔍 Ver demanda vinculada ↗</RpBtn>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Tipo de actividad</div>
            <select style={{width:'100%',fontSize:12,padding:'5px 8px',border:'1px solid var(--border2)',borderRadius:'var(--r)',fontFamily:'inherit'}}>
              <option>📧 Email</option><option>📞 Llamada</option><option>🤝 Reunión</option><option>📝 Nota</option><option>💬 WhatsApp</option><option>✅ Tarea</option>
            </select>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Referente a</div>
            <div style={{background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',padding:'7px 9px',marginBottom:5,cursor:'pointer'}}>
              <div style={{fontSize:9,fontWeight:600,color:'var(--accent)',textTransform:'uppercase',marginBottom:2}}>Demanda</div>
              <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>D251035690</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>Corp. Financiera Azuaga SL</div>
            </div>
            <RpBtn>+ Añadir otro registro</RpBtn>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Asistente IA</div>
            <div className="ai-box">
              <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Insight actividad</span></div>
              <div className="ai-text">Email sin respuesta <strong>7 días</strong>. Considerar llamada de seguimiento.</div>
              <div className="ai-cta">✎ Redactar seguimiento</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HistItem({ color, text, by, date }) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 14px',borderBottom:'1px solid var(--border)'}}>
      <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0,marginTop:3}}/>
      <div>
        <div style={{fontSize:11,fontWeight:500}}>{text}</div>
        <div style={{fontSize:10,color:'var(--text4)'}}>{date} · {by}</div>
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
