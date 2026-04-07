import { useState } from 'react'
import { useNav } from '../context/NavigationContext'

export default function FichaTarea() {
  const { navigate } = useNav()
  const [tab, setTab] = useState('info')

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Nueva tarea</button>
        <button className="ab-btn">Marcar finalizada</button>
        <div className="ab-sep"/>
        <button className="ab-btn blue">👤 Reasignar</button>
        <button className="ab-btn blue">📎 Vincular registro</button>
        <button className="ab-btn" onClick={()=>navigate('tareas')}>← Volver</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#7c3aed,#a855f7)',fontSize:20}}>✅</div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'var(--purple-lt)',color:'var(--purple)',border:'1px solid var(--purple-bd)',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>TAREA</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>TAR-001</span>
                  <span className="tag tag-blue">En curso</span>
                  <span style={{background:'var(--red-lt)',color:'var(--red)',border:'1px solid var(--red-bd)',padding:'1px 7px',borderRadius:9,fontSize:10,fontWeight:600}}>⬆ Alta prioridad</span>
                </div>
                <div className="ah-name">Llamar a propietario — Activo Avalon</div>
                <div className="ah-addr">👤 Responsable: Sierra Alvaro · Asignado por: Manager · Límite: 07/04/2026</div>
                <div className="ah-tags">
                  <span className="tag tag-teal">Gestión de producto</span>
                  <span className="tag tag-blue">En curso</span>
                  <span className="tag tag-gray">Activo: P.E Avalon</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tabs">
            <div className={`tab ${tab==='info'?'active':''}`} onClick={()=>setTab('info')}>Información</div>
            <div className={`tab ${tab==='desc'?'active':''}`} onClick={()=>setTab('desc')}>Descripción</div>
            <div className={`tab ${tab==='hist'?'active':''}`} onClick={()=>setTab('hist')}>Historial</div>
          </div>

          {/* Tab Información */}
          <div className={`tab-content ${tab==='info'?'active':''}`}>
            <div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>📋 Datos</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">ID</span><span className="ir-v mono">TAR-001</span></div>
                    <div className="ir"><span className="ir-k">Tipo</span><span className="ir-v"><span className="tag tag-teal">Gestión de producto</span></span></div>
                    <div className="ir"><span className="ir-k">Estado</span><span className="ir-v"><span className="tag tag-blue">En curso</span></span></div>
                    <div className="ir"><span className="ir-k">Prioridad</span><span className="ir-v"><span style={{background:'var(--red-lt)',color:'var(--red)',border:'1px solid var(--red-bd)',padding:'1px 7px',borderRadius:9,fontSize:10,fontWeight:600}}>⬆ Alta</span></span></div>
                    <div className="ir"><span className="ir-k">Fecha inicio</span><span className="ir-v">01/04/2026</span></div>
                    <div className="ir"><span className="ir-k">Fecha límite</span><span className="ir-v" style={{color:'var(--amber)',fontWeight:600}}>07/04/2026 ⚠</span></div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>👥 Asignación</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Responsable</span><span className="ir-v link">Sierra Alvaro</span></div>
                    <div className="ir"><span className="ir-k">Asignado por</span><span className="ir-v link">Manager</span></div>
                    <div className="ir"><span className="ir-k">Equipo</span><span className="ir-v">Leasing Oficinas MAD</span></div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>🔗 Referente a</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Tipo</span><span className="ir-v"><span className="tag tag-teal">Activo</span></span></div>
                    <div className="ir"><span className="ir-k">ID</span><span className="ir-v link mono">MAD-OF-00189 ↗</span></div>
                    <div className="ir"><span className="ir-k">Activo</span><span className="ir-v link">P.E Avalon ↗</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Descripción */}
          <div className={`tab-content ${tab==='desc'?'active':''}`}>
            <div className="info-pad">
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>Asunto</div>
                <input className="search-inp" style={{paddingLeft:9}} defaultValue="Llamar a propietario — Activo Avalon"/>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>Descripción detallada</div>
                <textarea style={{padding:8,border:'1px solid var(--border2)',borderRadius:'var(--r)',fontSize:12,fontFamily:'inherit',outline:'none',background:'#fff',width:'100%',resize:'vertical',minHeight:220}}
                  defaultValue={`Contactar con Rodrigo García (Asset Manager de Barings) para actualizar el estado de la comercialización del P.E Avalon.\n\nPuntos a tratar:\n1. Estado negociaciones activas (NEG-0044 con Empresa XYZ)\n2. Posibilidad de ajustar renta asking para acelerar ocupación\n3. Break options de Celonis (Oct 2025) y posibles movimientos\n4. Interés en ampliar mandato de captación para P4 y P5\n\nObjetivo: obtener autorización para proponer carencia adicional de 1 mes.`}/>
              </div>
            </div>
          </div>

          {/* Tab Historial */}
          <div className={`tab-content ${tab==='hist'?'active':''}`}>
            <div className="info-pad">
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>Historial · <span style={{fontWeight:400,color:'var(--text4)'}}>AUDITABLE</span></div>
                <HistItem color="var(--accent)" text={<>Estado actualizado a <strong>En curso</strong></>} by="Sierra Alvaro" date="05/04/2026"/>
                <HistItem color="var(--green)" text="Tarea creada y asignada a Sierra Alvaro" by="Manager" date="01/04/2026"/>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="ficha-right">
          <div className="rp-sec">
            <div className="rp-lbl">Estado y prioridad</div>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
              <div style={{width:9,height:9,borderRadius:'50%',background:'var(--accent)'}}/>
              <span style={{fontSize:12,fontWeight:700,color:'var(--accent)'}}>En curso</span>
            </div>
            <div style={{marginBottom:9}}>
              <span style={{background:'var(--red-lt)',color:'var(--red)',border:'1px solid var(--red-bd)',padding:'1px 7px',borderRadius:9,fontSize:10,fontWeight:600}}>⬆ Alta prioridad</span>
            </div>
            <RpBtn>✅ Marcar finalizada</RpBtn>
            <RpBtn>👤 Reasignar tarea</RpBtn>
            <RpBtn>📎 Añadir actividad</RpBtn>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Fechas clave</div>
            <div className="kf-grid">
              <div className="kf"><div className="kf-lbl">Inicio</div><div className="kf-val" style={{fontSize:11}}>01/04/2026</div></div>
              <div className="kf"><div className="kf-lbl">Límite</div><div className="kf-val" style={{color:'var(--amber)',fontSize:11}}>07/04/2026</div></div>
            </div>
            <div style={{marginTop:8,background:'var(--amber-lt)',border:'1px solid var(--amber-bd)',borderRadius:'var(--r)',padding:'5px 9px',fontSize:11,color:'var(--amber)'}}>⚠ Vence en 1 día</div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Referente a</div>
            <div style={{background:'var(--teal-lt)',border:'1px solid var(--teal-bd)',borderRadius:'var(--r)',padding:'7px 9px',cursor:'pointer'}}>
              <div style={{fontSize:9,fontWeight:600,color:'var(--teal)',textTransform:'uppercase',marginBottom:2}}>Activo</div>
              <div style={{fontSize:11,fontWeight:600,color:'var(--teal)'}}>P.E Avalon</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>MAD-OF-00189 · M-30 · Madrid</div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Responsable</div>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
              <div style={{width:26,height:26,borderRadius:'50%',background:'var(--accent-lt)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>AS</div>
              <div>
                <div style={{fontSize:11,fontWeight:500}}>Sierra Alvaro</div>
                <div style={{fontSize:10,color:'var(--text3)'}}>Leasing Oficinas · MAD</div>
              </div>
            </div>
            <div style={{fontSize:10,color:'var(--text3)'}}>Asignado por: Manager</div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Asistente IA</div>
            <div className="ai-box">
              <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Insight tarea</span></div>
              <div className="ai-text">Tarea <strong>vence mañana</strong>. NEG-0044 activa — momento clave para negociar margen.</div>
              <div className="ai-cta">✎ Preparar argumentario</div>
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
