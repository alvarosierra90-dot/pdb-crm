import { useState } from 'react'
import { useNav } from '../context/NavigationContext'

const DEM_TABS = [
  ['dem-info','Información Demanda'],['dem-req','Requisitos'],['dem-zona','Zona búsqueda'],
  ['dem-seg','Seguimiento comercial'],['dem-act','Actividades'],['dem-partes','Partes involucradas'],
  ['dem-docs','Documentos'],['dem-neg','Negociaciones en curso'],['dem-followup','Follow-up'],
]

/* ── Right Panel ── */
function RightPanel({ navigate }) {
  return (
    <div className="ficha-right">
      <div className="rp-sec">
        <div className="rp-lbl">Estado</div>
        <select className="of-sel" style={{fontSize:12,marginBottom:10}}>
          <option>● En Curso</option><option>◎ Potencial</option><option>⏸ Paralizado</option>
        </select>
        <button className="acc-btn">↔ Ver negociación vinculada</button>
        <button className="acc-btn">📋 Ver oferta vinculada</button>
        <button className="acc-btn" style={{background:'var(--accent)',color:'#fff',border:'none',fontWeight:600}} onClick={()=>navigate('mapas',{from:'demanda',id:'D251035690',nombre:'Corporacion Financiera Azuaga SL',uso:'Oficinas',sbaMin:2200,sbaMax:3000,rentaMax:18,zona:'A-1 · Alcobendas',provincia:'Madrid'})}>🗺 Exportar a mapa</button>
      </div>
      <div className="rp-sec">
        <div className="rp-lbl">Superficie buscada</div>
        <div className="kf-grid">
          <div className="kf"><div className="kf-lbl">Mínimo</div><div className="kf-val">2.200 m²</div></div>
          <div className="kf"><div className="kf-lbl">Máximo</div><div className="kf-val">3.000 m²</div></div>
        </div>
        <div style={{marginTop:8}}>
          <div style={{fontSize:9,color:'var(--text4)',marginBottom:3}}>Tipo búsqueda</div>
          <span className="tag tag-gray">Estándar</span>
        </div>
      </div>
      <div className="rp-sec">
        <div className="rp-lbl">Activos presentados</div>
        <div style={{background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',padding:'7px 9px',marginBottom:5,cursor:'pointer'}}>
          <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>Albatros — Edif. D</div>
          <div style={{fontSize:10,color:'var(--text3)'}}>13/11/2025 · Presentación · OLBUR2315645</div>
        </div>
        <div style={{background:'var(--green-lt)',border:'1px solid var(--green-bd)',borderRadius:'var(--r)',padding:'7px 9px',cursor:'pointer'}}>
          <div style={{fontSize:11,fontWeight:600,color:'var(--green)'}}>Albatros — Visita</div>
          <div style={{fontSize:10,color:'var(--text3)'}}>Calle de Anabel Segura 9-11</div>
        </div>
      </div>
      <div className="rp-sec">
        <div className="rp-lbl">Zona de búsqueda</div>
        <span className="tag tag-blue">Madrid</span>
        <div style={{marginTop:6,fontSize:11,color:'var(--text3)'}}>A-1 · Alcobendas / Arroyo de la Vega</div>
      </div>
      <div className="rp-sec">
        <div className="rp-lbl">Equipo asignado</div>
        <div className="cont-row">
          <div className="c-av" style={{background:'#dbeafe',color:'#1e40af'}}>AS</div>
          <div><div className="c-name">Sierra Alvaro</div><div className="c-role">Leasing Oficinas · MAD</div></div>
        </div>
      </div>
      <div className="rp-sec">
        <div className="rp-lbl">Asistente IA</div>
        <div className="ai-box">
          <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Matching automático</span><span className="ai-badge">Beta</span></div>
          <div className="ai-text">2.200–3.000 m² en A-1. <strong>3 activos compatibles</strong>. Albatros P4 (última planta con terraza) es el más ajustado.</div>
          <div className="ai-cta">✎ Ver activos compatibles</div>
        </div>
      </div>
    </div>
  )
}

export default function FichaDemanda() {
  const { navigate } = useNav()
  const [activeTab, setActiveTab] = useState('dem-info')

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Guardar y cerrar</button>
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn">Transformar</button>
        <button className="ab-btn">Desactivar</button>
        <div className="ab-sep"/>
        <button className="ab-btn blue" onClick={()=>navigate('mapas',{from:'demanda',id:'D251035690',nombre:'Corporacion Financiera Azuaga SL',uso:'Oficinas',sbaMin:2200,sbaMax:3000,rentaMax:18,zona:'A-1 · Alcobendas',provincia:'Madrid'})}>🗺 Exportar a mapa</button>
        <button className="ab-btn">Actualizar</button>
        <button className="ab-btn">Asignar</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">
          {/* Header */}
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>🔍</div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>DEMANDA</span>
                  <span className="mono">D251035690</span>
                  <span className="tag tag-gray" style={{fontSize:9}}>Guardado</span>
                </div>
                <div className="ah-name">Corporacion Financiera Azuaga SL</div>
                <div className="ah-addr">📍 Avda. Diego Martínez Barrios, 41013 Sevilla · Origen: Otras Consultoras · Creada: 17/10/2025 · Sierra Alvaro</div>
                <div className="ah-tags">
                  <span className="tag tag-green">● En Curso</span>
                  <span className="tag tag-blue">Oficinas</span>
                  <span className="tag tag-gray">2.200–3.000 m²</span>
                  <span className="tag tag-gray">Estándar</span>
                  <span className="tag tag-purple">Expansión / Crecimiento</span>
                </div>
              </div>
              <div style={{flexShrink:0,display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:1,background:'var(--border)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden',fontSize:10,alignSelf:'flex-start'}}>
                {[['Motivo del estado','En Curso','var(--green)'],['Confidencial','No',null],['Equipo','Leasing Of. MAD',null],['Responsable','Sierra Alvaro','var(--accent)']].map(([lbl,val,col])=>(
                  <div key={lbl} style={{background:'var(--surface)',padding:'6px 10px',textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--text4)'}}>{lbl}</div>
                    <div style={{fontWeight:600,color:col||'var(--text)'}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {DEM_TABS.map(([key,label])=>(
              <div key={key} className={`tab ${activeTab===key?'active':''}`} onClick={()=>setActiveTab(key)}>{label}</div>
            ))}
          </div>

          {/* ── TAB: Información Demanda ── */}
          {activeTab==='dem-info' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <div>
                  <div className="of-section">🏢 CUENTA</div>
                  <div className="info-block" style={{marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--accent)',marginBottom:10,cursor:'pointer'}}>Corporacion Financiera Azuaga SL ↗</div>
                    <div className="ir"><span className="ir-k">Teléfono</span><span className="ir-v">—</span></div>
                    <div className="ir"><span className="ir-k">Dirección</span><span className="ir-v" style={{fontSize:10}}>Avda. Diego Martínez Barrios</span></div>
                    <div className="ir"><span className="ir-k">Código postal</span><span className="ir-v">41013</span></div>
                    <div className="ir"><span className="ir-k">Ciudad</span><span className="ir-v">Sevilla</span></div>
                    <div className="ir"><span className="ir-k">País</span><span className="ir-v link">🌍 Spain</span></div>
                    <div className="ir"><span className="ir-k">Cía. sustituta</span><span className="ir-v"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></span></div>
                    <div className="ir"><span className="ir-k">KYC demanda</span><span className="ir-v link">— ↗</span></div>
                  </div>
                  <div className="of-section">🏷 TIPO DE DEMANDA</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Demanda corporativa</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>No</option><option>Sí</option></select></span></div>
                    <div className="ir"><span className="ir-k">Confidencial</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>No</option><option>Sí</option></select></span></div>
                  </div>
                </div>
                <div>
                  <div className="of-section">👤 CONTACTO</div>
                  <div className="info-block" style={{marginBottom:10}}>
                    <div className="ir"><span className="ir-k">Persona física</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>No</option><option>Sí</option></select></span></div>
                    <div className="ir"><span className="ir-k">Contacto mandante</span><span className="ir-v link">— ↗</span></div>
                  </div>
                  <div className="of-section">📋 ESTADO</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Motivo del estado</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>En Curso</option><option>Potencial</option><option>Paralizado</option></select></span></div>
                    <div className="ir"><span className="ir-k">Equipo</span><span className="ir-v">Leasing Oficinas – MAD</span></div>
                  </div>
                </div>
                <div>
                  <div className="of-section">👥 OTROS CONTACTOS ASOCIADOS</div>
                  <div className="info-block">
                    <table className="pat-table">
                      <thead><tr><th>Nombre com.</th><th>Persona física</th></tr></thead>
                      <tbody><tr><td colSpan={2} style={{textAlign:'center',color:'var(--text4)',padding:16,fontSize:11}}>No se encontró nada para mostrar aquí</td></tr></tbody>
                    </table>
                    <div style={{fontSize:10,color:'var(--text4)',marginTop:5}}>Filas: 0</div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Requisitos ── */}
          {activeTab==='dem-req' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <div>
                  <div className="of-section">📋 REQUISITOS GENERALES</div>
                  <div className="info-block" style={{marginBottom:10}}>
                    {[['Tipo activo demandado',['Edificio','Suelo']],['Uso principal',['Oficinas','Retail','Logístico','Hoteles','Living']],['Tipología',['Oficina','Coworking','Subarrendamiento']],['Razón de búsqueda',['Expansión / Crecimiento','Reducción','Reubicación','Reagrupación','Creación','Obsoleto']]].map(([lbl,opts])=>(
                      <div key={lbl} className="ir">
                        <span className="ir-k">{lbl}</span>
                        <span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}>{opts.map(o=><option key={o}>{o}</option>)}</select></span>
                      </div>
                    ))}
                    <div className="ir"><span className="ir-k">Timing proyecto</span><span className="ir-v"><input type="date" className="of-inp" style={{padding:'2px 6px',fontSize:11,width:120}}/></span></div>
                    <div className="ir"><span className="ir-k">Origen Demanda</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>OTRAS CONSULTORAS</option><option>IDEALISTA</option><option>WEB BNPPRE</option><option>SAVILLS ESPAÑA</option></select></span></div>
                    <div className="ir"><span className="ir-k">Mandato asociado</span><span className="ir-v link">— ↗</span></div>
                    <div className="ir"><span className="ir-k">Nº NDA</span><span className="ir-v link">— ↗</span></div>
                  </div>
                  <div className="of-section">📝 DESCRIPCIÓN</div>
                  <textarea className="of-textarea" style={{fontSize:11}}>Savills (Estefanía): Buscan unos 2.500 m2 en la zona de Alcobendas. Preguntan específicamente por Albatros. Quieren solo la última planta con terraza.</textarea>
                </div>
                <div>
                  <div className="of-section">📐 SUPERFICIE DEMANDADA</div>
                  <div className="info-block" style={{marginBottom:10}}>
                    <div className="ir"><span className="ir-k">Oficina mín. (m²)</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} defaultValue="2.200"/></span></div>
                    <div className="ir"><span className="ir-k">Oficina máx. (m²)</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} defaultValue="3.000"/></span></div>
                    <div className="ir"><span className="ir-k">Nº Puestos de trabajo</span><span className="ir-v">—</span></div>
                  </div>
                  <div className="of-section">💰 PRESUPUESTO ALQUILER</div>
                  <div className="info-block" style={{marginBottom:10}}>
                    <div className="ir"><span className="ir-k">Alquiler</span><span className="ir-v"><input type="checkbox" defaultChecked style={{accentColor:'var(--accent)'}}/></span></div>
                    <div className="ir"><span className="ir-k">Tipo de búsqueda</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>—</option><option>Estándar</option><option>Estándar / Flexible</option></select></span></div>
                    <div className="ir"><span className="ir-k">Alquiler (€/m²)</span><span className="ir-v">—</span></div>
                    <div className="ir"><span className="ir-k">Renta mensual (€/mes)</span><span className="ir-v">—</span></div>
                  </div>
                  <div className="of-section">🏠 PRESUPUESTO VENTA</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Venta</span><span className="ir-v"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></span></div>
                    <div className="ir"><span className="ir-k">Precio (€/m²)</span><span className="ir-v">—</span></div>
                    <div className="ir"><span className="ir-k">Precio total (€)</span><span className="ir-v">—</span></div>
                  </div>
                </div>
                <div>
                  <div className="of-section">🔍 PARÁMETROS DE BÚSQUEDA</div>
                  <div className="info-block" style={{marginBottom:10}}>
                    <div style={{fontSize:10,color:'var(--text3)',marginBottom:4}}>Requisitos de búsqueda</div>
                    <textarea className="of-textarea" style={{fontSize:11,minHeight:50}}>—</textarea>
                    <div style={{fontSize:10,color:'var(--text3)',marginTop:8,marginBottom:4}}>Canal de entrada</div>
                    <input className="of-inp" style={{fontSize:11}} defaultValue="—"/>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Zona búsqueda ── */}
          {activeTab==='dem-zona' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div>
                  <div className="of-section">🗺 PROVINCIAS DE INTERÉS</div>
                  <div className="info-block" style={{minHeight:200}}>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                      <span style={{background:'var(--border2)',color:'var(--text2)',padding:'3px 10px',borderRadius:20,fontSize:12,display:'inline-flex',alignItems:'center',gap:5}}>Madrid <span style={{cursor:'pointer',color:'var(--text4)'}}>×</span></span>
                    </div>
                    <select className="of-sel"><option>+ Añadir provincia</option><option>Barcelona</option><option>Valencia</option><option>Sevilla</option></select>
                  </div>
                </div>
                <div>
                  <div className="of-section">📍 ZONAS DE BÚSQUEDA</div>
                  <div className="info-block">
                    <select className="of-sel" style={{marginBottom:10}}><option>+ Añadir zona</option><option>CBD</option><option>M-30</option><option>A-1 · Alcobendas</option><option>A-2</option></select>
                    <div style={{background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',padding:'6px 10px',marginBottom:10,fontSize:11,color:'var(--accent)'}}>
                      A-1 · Alcobendas / Arroyo de la Vega <span style={{cursor:'pointer',color:'var(--text4)',float:'right'}}>×</span>
                    </div>
                    <div className="ir"><span className="ir-k">Calles específicas</span><span className="ir-v">—</span></div>
                    <div className="ir"><span className="ir-k">Puntos de interés</span><span className="ir-v">—</span></div>
                    <div className="ir"><span className="ir-k">Puntos a evitar</span><span className="ir-v">—</span></div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Seguimiento comercial ── */}
          {activeTab==='dem-seg' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{fontSize:11,fontWeight:600}}>Serie de presentaciones</div>
                    <button className="ab-btn blue" style={{padding:'3px 8px',fontSize:10}}>+ Crear Presentación</button>
                  </div>
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:12}}>
                    <table className="pat-table"><thead><tr><th>Redacción</th><th>Fecha acción</th><th>Nº oferta</th><th>Enlace web</th></tr></thead>
                    <tbody><tr><td colSpan={4} style={{textAlign:'center',color:'var(--text4)',fontSize:11,padding:14}}>No se encontró nada para mostrar aquí</td></tr></tbody></table>
                    <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 0</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{fontSize:11,fontWeight:600}}>Presentaciones (Oferta)</div>
                    <button className="ab-btn blue" style={{padding:'3px 8px',fontSize:10}}>+ Crear Presentación</button>
                  </div>
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                    <table className="pat-table"><thead><tr><th><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th><th>Fecha</th><th>Cuenta</th><th>Oferta</th><th>Motivo estado</th></tr></thead>
                    <tbody><tr>
                      <td><input type="checkbox" style={{accentColor:'var(--accent)'}}/></td>
                      <td>13/11/2025</td><td className="pat-link">Corporacion Fina...</td>
                      <td className="pat-link">OLBUR2315645 - Albatros...</td>
                      <td><span className="tag tag-blue">Presentacion</span></td>
                    </tr></tbody></table>
                    <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 1</div>
                  </div>
                </div>
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{fontSize:11,fontWeight:600}}>Serie de visitas</div>
                    <button className="ab-btn blue" style={{padding:'3px 8px',fontSize:10}}>+ Crear Tour de visitas</button>
                  </div>
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:12}}>
                    <table className="pat-table"><thead><tr><th>Nombre</th><th>Motivo estado</th><th>Fecha visita</th><th>Cuenta</th></tr></thead>
                    <tbody><tr><td colSpan={4} style={{textAlign:'center',color:'var(--text4)',fontSize:11,padding:14}}>No se encontró nada para mostrar aquí</td></tr></tbody></table>
                    <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 0</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{fontSize:11,fontWeight:600}}>Visitas</div>
                    <button className="ab-btn blue" style={{padding:'3px 8px',fontSize:10}}>+ Crear Visita</button>
                  </div>
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                    <table className="pat-table"><thead><tr><th><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th><th>Apellido</th><th>Cuenta</th><th>Asset / Activo (Oferta)</th></tr></thead>
                    <tbody><tr>
                      <td><input type="checkbox" style={{accentColor:'var(--accent)'}}/></td>
                      <td className="pat-link">V - Corporacion Financier...</td>
                      <td>Corporaci...</td>
                      <td className="pat-link">Albatros - Calle de Anabel Segura 9-11</td>
                    </tr></tbody></table>
                    <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 1</div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Actividades ── */}
          {activeTab==='dem-act' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{fontSize:11,fontWeight:600,marginBottom:10}}>Escala de tiempo</div>
              <div style={{border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 12px',display:'flex',alignItems:'center',gap:8,marginBottom:8,background:'var(--surface)'}}>
                <input className="search-inp" style={{border:'none',padding:0,flex:1}} placeholder="Buscar escala de tiempo"/>
                <button className="ab-btn blue" style={{padding:'3px 9px',fontSize:10}}>+ Actividad ▾</button>
              </div>
              <div style={{border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 12px',display:'flex',alignItems:'center',gap:8,marginBottom:20,background:'var(--surface)'}}>
                <span style={{fontSize:14}}>✏️</span>
                <input className="search-inp" style={{border:'none',padding:0,flex:1}} placeholder="Escriba una nota..."/>
              </div>
              <div style={{textAlign:'center',padding:50,color:'var(--text4)'}}>
                <div style={{fontSize:32,marginBottom:8}}>📋</div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text2)',marginBottom:6}}>Empezar</div>
                <div style={{fontSize:11}}>Capturar y administrar todos los registros de la escala de tiempo.</div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Partes involucradas ── */}
          {activeTab==='dem-partes' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <div>
                  <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Partners / Socios</div>
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                    <table className="pat-table"><thead><tr><th>Empresa</th><th>Tipo</th><th>Comentarios</th></tr></thead>
                    <tbody><tr><td colSpan={3} style={{textAlign:'center',color:'var(--text4)',fontSize:11,padding:16}}>No se encontró nada para mostrar aquí</td></tr></tbody></table>
                    <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 0</div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Otras cuentas</div>
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                    <table className="pat-table"><thead><tr><th><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th><th>Compañía</th><th>ID LiveDeal</th><th>Contacto</th></tr></thead>
                    <tbody><tr><td><input type="checkbox" style={{accentColor:'var(--accent)'}}/></td><td className="pat-link">Savills RE Spain SAU</td><td>—</td><td>Pardo Est...</td></tr></tbody></table>
                    <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 1</div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Equipo proyecto</div>
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                    <table className="pat-table"><thead><tr><th><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th><th>Usuario</th><th>Equipo</th></tr></thead>
                    <tbody><tr>
                      <td><input type="checkbox" style={{accentColor:'var(--accent)'}}/></td>
                      <td><div style={{display:'flex',alignItems:'center',gap:5}}>
                        <div className="c-av" style={{background:'#dcfce7',color:'#166534',width:18,height:18,fontSize:7}}>SA</div>
                        <span style={{fontSize:11}}>Sierra Alvaro (Ocupado)</span>
                      </div></td>
                      <td style={{fontSize:11,color:'var(--accent)'}}>Leasing Oficinas...</td>
                    </tr></tbody></table>
                    <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 1</div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Documentos ── */}
          {activeTab==='dem-docs' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'220px 1fr',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                <div style={{borderRight:'1px solid var(--border)',padding:12}}>
                  <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Navegar...</div>
                  <button className="ab-btn" style={{width:'100%',justifyContent:'center'}}>Reiniciar</button>
                </div>
                <div style={{padding:12}}>
                  <div style={{display:'flex',gap:6,marginBottom:10}}><button className="ab-btn">🗑 BORRAR</button><button className="ab-btn">🔍 CONSULTAR</button></div>
                  <table className="doc-table"><thead><tr><th><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th><th>Título del documento</th><th>Creado en</th><th>Creado por</th></tr></thead>
                  <tbody><tr><td colSpan={4} style={{textAlign:'center',color:'var(--text4)',fontSize:11,padding:14}}>No records are available.</td></tr></tbody></table>
                  <div className="doc-drop" style={{marginTop:10}}>📁 Deja tus archivos aquí</div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Negociaciones en curso ── */}
          {activeTab==='dem-neg' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:600}}>Negociaciones en curso</div>
                <div style={{display:'flex',gap:6}}><button className="ab-btn">↺ Actualizar</button><button className="ab-btn blue">⟶ Ver todas</button></div>
              </div>
              <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                <table className="pat-table">
                  <thead><tr><th>N° transacción</th><th>Petición</th><th>Oferta</th><th>Estado actual</th><th>Activo</th><th>Tipo operación</th><th>Demandante</th><th>Agente P.</th></tr></thead>
                  <tbody><tr><td colSpan={8} style={{textAlign:'center',color:'var(--text4)',fontSize:11,padding:20}}>No se encontró nada para mostrar aquí</td></tr></tbody>
                </table>
                <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 0</div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Follow-up ── */}
          {activeTab==='dem-followup' && (
            <div className="tab-content active"><div className="info-pad">
              <div className="info-2col" style={{maxWidth:560}}>
                <div className="info-block">
                  <div className="ib-title">CREACIÓN</div>
                  <div className="ir"><span className="ir-k">Creado el</span><span className="ir-v">17/10/2025 · 10:24</span></div>
                  <div className="ir"><span className="ir-k">Creado por</span><span className="ir-v link">Sierra Alvaro (Ocupado)</span></div>
                </div>
                <div className="info-block">
                  <div className="ib-title">ÚLTIMA MODIFICACIÓN</div>
                  <div className="ir"><span className="ir-k">Modificado el</span><span className="ir-v">17/10/2025 · 10:24</span></div>
                  <div className="ir"><span className="ir-k">Modificado por</span><span className="ir-v link">Sierra Alvaro (Ocupado)</span></div>
                </div>
              </div>
            </div></div>
          )}
        </div>

        <RightPanel navigate={navigate}/>
      </div>
    </div>
  )
}
