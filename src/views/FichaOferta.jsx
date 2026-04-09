import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'

const TABS = ['of-info','of-contacto','of-espacios','of-plazas','of-condiciones','of-caract','of-docs','of-web','of-desc','of-seg','of-ficha','of-conf']
const TAB_LABELS = ['Información oferta','Datos de contacto','Espacios comerciales','Plazas de aparcamiento','Condiciones','Características','Documentos','Contenido web','Descriptivo','Seguimiento comercial','Crear ficha','🔒 Confidencialidad']

const USERS_INIT = [
  { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', granted:'—', owner:true },
]

export default function FichaOferta() {
  const { navigate } = useNav()
  const [activeTab, setActiveTab] = useState('of-info')
  const [confidential, setConfidential] = useState(false)
  const [authorizedUsers, setAuthorizedUsers] = useState(USERS_INIT)
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState('')
  const [showTarea, setShowTarea] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Guardar y cerrar</button>
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn">Desactivar</button>
        <div className="ab-sep" />
        <button className="ab-btn blue">📊 Stacking plan</button>
        <button className="ab-btn">📄 Crear ficha</button>
        <button className="ab-btn">🔄 Recalcular</button>
        <button className="ab-btn">🌐 Descripción web</button>
        <div className="ab-sep" />
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
      </div>
      <div className="ficha-wrap">
        <div className="ficha-main">
          <div className="ah">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div className="ah-ico" style={{ background: 'linear-gradient(135deg,#064e3b,#10b981)' }}>📋</div>
              <div style={{ flex: 1 }}>
                <div className="ah-ref">
                  <span className="ref-badge-oferta">OFERTA</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>OLBUR2315645</span>
                  {confidential && <span style={{background:'#1e293b',color:'#f8fafc',border:'1px solid #334155',padding:'0 7px',borderRadius:3,fontSize:9,fontWeight:700,letterSpacing:'.04em'}}>🔒 CONFIDENCIAL</span>}
                  <span style={{ color: 'var(--text3)' }}>· Activo: <span className="pat-link" onClick={() => navigate('ficha-activo')}>Albatros — C. Anabel Segura 9-11, Alcobendas</span></span>
                  <span className="tag tag-green" style={{ fontSize: 9 }}>+ Vinculado</span>
                </div>
                <div className="ah-name">Albatros — Calle de Anabel Segura 9-11, 28108 Alcobendas</div>
                <div className="ah-addr">📍 Alcobendas · Área: Periferia · Zona: A-1 · Sub-zona: Alcobendas / Arroyo de la Vega</div>
                <div className="ah-tags">
                  <span className="tag tag-blue">Oficinas</span>
                  <span className="tag tag-purple">Mandato Savills</span>
                  <span className="tag tag-teal">Alquiler</span>
                  <span className="tag tag-green">En curso</span>
                  <span className="dias-pill">📅 127 días en comercialización</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase' }}>Equipo</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>Transaction Spain</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, justifyContent: 'flex-end' }}>
                  <div className="c-av" style={{ background: '#dbeafe', color: '#1e40af', width: 22, height: 22, fontSize: 8 }}>AS</div>
                  <span style={{ fontSize: 11 }}>Sierra Álvaro</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tabs">
            {TABS.map((t, i) => (
              <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[i]}</div>
            ))}
          </div>

          {/* Información oferta */}
          {activeTab === 'of-info' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div className="of-section">📎 VINCULACIÓN CON ACTIVO</div>
                    <div className="of-field" style={{ marginBottom: 10 }}>
                      <div className="of-lbl req">Asset / Activo</div>
                      <div style={{ padding: '6px 9px', border: '1px solid var(--border2)', borderRadius: 'var(--r)', fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('ficha-activo')}>
                        Albatros — C. Anabel Segura 9-11, Alcobendas
                      </div>
                    </div>
                    <div className="of-section">🏷 TIPO Y ORIGEN</div>
                    <div className="of-form-grid-3">
                      <div className="of-field"><div className="of-lbl req">Tip. comercialización</div><select className="of-sel"><option>Mandato Savills</option></select></div>
                      <div className="of-field"><div className="of-lbl req">Tipología</div><select className="of-sel"><option>Oficina</option></select></div>
                      <div className="of-field"><div className="of-lbl req">Tipo operación</div><select className="of-sel"><option>Alquiler</option></select></div>
                    </div>
                    <div className="of-section">🔍 ORIGEN Y TRAZABILIDAD</div>
                    <div className="of-form-grid">
                      <div className="of-field"><div className="of-lbl">Modalidad de visita</div><select className="of-sel"><option>—</option><option>Presencial</option><option>Virtual</option></select></div>
                      <div className="of-field"><div className="of-lbl">Nº NDA</div><input className="of-inp" placeholder="—" /></div>
                    </div>
                    <div className="of-section">💬 COMENTARIOS</div>
                    <textarea className="of-textarea" placeholder="Comentarios internos..." />
                  </div>
                  <div>
                    <div className="of-section">📍 MAPA</div>
                    <div className="map-big">
                      <div style={{ fontSize: 28 }}>📍</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Alcobendas · Arroyo de la Vega</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Calle de Anabel Segura 9-11, 28108</div>
                      <div className="map-big-btn">Ver en Google Maps</div>
                    </div>
                    <div className="map-big-meta">
                      <div className="map-meta-cell"><div className="map-meta-lbl">Geolocalización</div><div style={{ fontSize: 11, color: 'var(--accent)' }}>Sí · Dirección propiedad ↗</div></div>
                      <div className="map-meta-cell"><div className="map-meta-lbl">Vista satélite</div><div style={{ fontSize: 11, color: 'var(--accent)' }}>Activar ↗</div></div>
                    </div>
                    <div className="of-section" style={{ marginTop: 14 }}>🖼 IMÁGENES</div>
                    <div className="img-strip">
                      <div className="img-thumb principal">🏢</div>
                      <div className="img-thumb">🏙</div>
                      <div className="img-thumb">🖼</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Datos de contacto */}
          {activeTab === 'of-contacto' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div className="info-block">
                    <div className="ib-title">🏠 PROPIETARIO</div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>FREO Investments Spain SL</div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>Baena Borja</div>
                    <div style={{ background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 8, marginTop: 8, fontSize: 11 }}>
                      <div>📞 +34 910 888 998</div><div>📱 629 846 923</div>
                      <div style={{ color: 'var(--accent)' }}>✉ b.baena@freogroup.com</div>
                    </div>
                  </div>
                  <div className="info-block"><div className="ib-title">⭐ MANDANTE</div><div style={{ fontSize: 11, color: 'var(--accent)' }}>FREO Investments Spain SL</div></div>
                  <div className="info-block">
                    <div className="ib-title">👥 EQUIPO SAVILLS</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <div className="c-av" style={{ background: '#dbeafe', color: '#1e40af', width: 22, height: 22, fontSize: 8 }}>AS</div>
                      <span style={{ fontSize: 11 }}>Sierra Álvaro</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto' }}>Transaction Spain</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="c-av" style={{ background: '#f3e8ff', color: '#6b21a8', width: 22, height: 22, fontSize: 8 }}>AD</div>
                      <span style={{ fontSize: 11 }}>Alonso Abruña D.</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto' }}>Leasing MAD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Espacios comerciales */}
          {activeTab === 'of-espacios' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Espacios comerciales</div>
                  <button className="ab-btn blue">+ Agregar espacio</button>
                </div>
                <table className="pat-table">
                  <thead><tr><th>Edificio</th><th>Planta</th><th>Uso</th><th>Superficie (m²)</th><th>Divisibilidad</th><th>Renta (€/m²/mes)</th><th>Renta mensual</th></tr></thead>
                  <tbody>
                    <tr><td>Edificio Albatros D</td><td>P4</td><td><span className="tag tag-blue">Oficina</span></td><td>2.577</td><td>Sí</td><td>12,50</td><td>€32.212,50</td></tr>
                    <tr><td>Edificio Albatros D</td><td>P3</td><td><span className="tag tag-blue">Oficina</span></td><td>2.790</td><td>Sí</td><td>12,50</td><td>€34.875,00</td></tr>
                    <tr><td>Edificio Albatros D</td><td>P1</td><td><span className="tag tag-blue">Oficina</span></td><td>2.793</td><td>Sí</td><td>12,50</td><td>€34.912,50</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Plazas */}
          {activeTab === 'of-plazas' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Plazas de aparcamiento</div>
                <table className="pat-table">
                  <thead><tr><th>Tipo</th><th>Int/Ext</th><th>Vehículo</th><th>Número</th><th>Renta plaza</th><th>Total alquiler/mes</th></tr></thead>
                  <tbody><tr><td>Simple</td><td>Interior</td><td>Coches</td><td>322</td><td>€110,00</td><td style={{ fontWeight: 600 }}>€35.420,00</td></tr></tbody>
                </table>
              </div>
            </div>
          )}

          {/* Condiciones */}
          {activeTab === 'of-condiciones' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
                  Condiciones <span className="tag tag-green" style={{ fontSize: 9, marginLeft: 6 }}>+ Sincronizado</span>
                </div>
                <div className="cond-grid">
                  <div className="cond-block">
                    <div className="cond-block-title">CONDICIONES CONTRACTUALES</div>
                    <div className="cond-row"><span className="cond-key">Tipo arrendamiento</span><span className="cond-val">Alquiler comercial</span></div>
                    <div className="cond-row"><span className="cond-key">Régimen fiscal</span><span className="cond-val">I.V.A.</span></div>
                    <div className="cond-row"><span className="cond-key">Fianza legal</span><span className="cond-val">2 meses sin IVA</span></div>
                    <div className="cond-row"><span className="cond-key">Indexación anual</span><span className="cond-val">Sí</span></div>
                    <div className="cond-row"><span className="cond-key">Pago honorarios</span><span className="cond-val">A la firma</span></div>
                  </div>
                  <div className="cond-block">
                    <div className="cond-block-title">CONDICIONES ECONÓMICAS</div>
                    <div className="cond-row"><span className="cond-key">Renta (€/m²/mes)</span><span className="cond-val" style={{ fontSize: 15, color: 'var(--green)' }}>12,50 €</span></div>
                    <div className="cond-row"><span className="cond-key">Renta mensual</span><span className="cond-val" style={{ color: 'var(--green)' }}>168.575 €</span></div>
                    <div className="cond-row"><span className="cond-key">Gastos comunes</span><span className="cond-val">3,01 €/m²/mes</span></div>
                  </div>
                  <div className="cond-block">
                    <div className="cond-block-title">INCENTIVOS Y CAPEX</div>
                    <div className="cond-row"><span className="cond-key">Meses de carencia</span><span className="cond-val">—</span></div>
                    <div className="cond-row"><span className="cond-key">Aportación obras</span><span className="cond-val">—</span></div>
                    <div className="cond-row"><span className="cond-key">Estado oferta</span><span className="cond-val" style={{ color: 'var(--green)' }}>Disponible</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Características */}
          {activeTab === 'of-caract' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Características · Importadas del activo</div>
                  <button className="ab-btn blue" style={{ padding: '3px 9px', fontSize: 10 }}>↩ Recuperar</button>
                </div>
                <div style={{ background: 'var(--green-lt)', border: '1px solid var(--green-bd)', borderRadius: 'var(--r)', padding: '6px 10px', marginBottom: 10, fontSize: 11, color: 'var(--green)' }}>
                  ↈ Características recuperadas del activo. Edita sin modificar el dato maestro.
                  <span style={{ background: 'var(--green-lt)', color: 'var(--green)', border: '1px solid var(--green-bd)', padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700, marginLeft: 6 }}>+ Importado</span>
                </div>
                <table className="pat-table">
                  <thead><tr><th>¿Incluido?</th><th>Proponer</th><th>Tipo</th><th>Año</th><th>Comentario</th></tr></thead>
                  <tbody><tr><td><input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} /></td><td><input type="checkbox" style={{ accentColor: 'var(--accent)' }} /></td><td>Rehabilitación integral</td><td>2023</td><td style={{ color: 'var(--text4)' }}>—</td></tr></tbody>
                </table>
              </div>
            </div>
          )}

          {/* Documentos */}
          {activeTab === 'of-docs' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Documentos</div>
                  <button className="ab-btn blue">↑ Cargar</button>
                </div>
                <table className="doc-table">
                  <thead><tr><th>Documento</th><th>Tipo</th><th>Fecha</th></tr></thead>
                  <tbody>
                    <tr><td><span className="doc-link">📊 Dossier Albatros</span></td><td><span className="tag tag-blue">Comercial</span></td><td>05/11/2024</td></tr>
                    <tr><td><span className="doc-link">📋 Ficha técnica Edif. D</span></td><td><span className="tag tag-teal">Técnica</span></td><td>05/11/2024</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Contenido web */}
          {activeTab === 'of-web' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div className="of-field" style={{ marginBottom: 10 }}>
                      <div className="of-lbl">Título (Web/Flyer) — Español</div>
                      <input className="of-inp" defaultValue="Complejo de edificios exclusivos en Arroyo de la Vega" />
                    </div>
                    <div className="of-field">
                      <div className="of-lbl">Texto descriptivo — Español</div>
                      <textarea className="of-textarea" defaultValue="Situados en un entorno profesional de alto nivel, en Arroyo de la Vega, los edificios C y D Albatros ofrecen unas instalaciones únicas reformadas de forma integral." />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>PORTALES WEB</div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                      {[['🌐 Web Savills', true], ['🏠 Idealista', false], ['🏢 Mis Oficinas', false]].map(([lbl, checked], i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                          <span style={{ fontSize: 12 }}>{lbl}</span>
                          <input type="checkbox" defaultChecked={checked} style={{ accentColor: 'var(--accent)' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Descriptivo */}
          {activeTab === 'of-desc' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="info-block">
                    <div className="ib-title">OPCIONES DE VISUALIZACIÓN</div>
                    <div className="of-field" style={{ marginBottom: 10 }}><div className="of-lbl">Geolocalizar dirección</div><select className="of-sel"><option>Sí</option><option>No</option></select></div>
                    <div className="of-field"><div className="of-lbl">Mostrar datos consultor</div><select className="of-sel"><option>No</option><option>Sí</option></select></div>
                  </div>
                  <div className="info-block">
                    <div className="ib-title">CARACTERÍSTICAS A RESALTAR</div>
                    <div style={{ background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 10, fontSize: 11, lineHeight: 1.8 }}>
                      <div>• Gimnasio equipado</div><div>• Parking interior</div>
                      <div>• Zonas ajardinadas</div><div>• Terraza privativa en 4ª planta</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>HISTÓRICO DE DESCRIPTIVOS</div>
                  <table className="pat-table">
                    <thead><tr><th>Enlace</th><th>Fecha</th><th>Autor</th></tr></thead>
                    <tbody>
                      <tr><td><span className="pat-link">https://savills.com/flyer/#/descrip...</span></td><td>13/10/2025 · 9:58</td><td>Sierra Álvaro</td></tr>
                      <tr><td><span className="pat-link">https://savills.com/flyer/#/descrip...</span></td><td>27/11/2024 · 18:09</td><td>Sierra Álvaro</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Seguimiento comercial */}
          {activeTab === 'of-seg' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Seguimiento comercial</div>
                  <button className="ab-btn blue">+ Registrar</button>
                </div>
                <div className="seg-2col" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  <div className="seg-block">
                    <div className="seg-head">Presentaciones</div>
                    <table className="seg-table"><thead><tr><th>Fecha</th><th>Demanda</th><th>Consultor</th><th>Feedback</th></tr></thead>
                    <tbody><tr><td>01/03/2025</td><td>Oracle</td><td>Álvaro P.</td><td className="fb-fin">Finalista</td></tr></tbody></table>
                  </div>
                  <div className="seg-block">
                    <div className="seg-head">Visitas</div>
                    <table className="seg-table"><thead><tr><th>Fecha</th><th>Demanda</th><th>Feedback</th></tr></thead>
                    <tbody><tr><td>01/03/2025</td><td>Oracle</td><td className="fb-fin">Finalista</td></tr></tbody></table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Crear ficha */}
          {activeTab === 'of-ficha' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div className="info-block">
                  <div className="ib-title">CREAR FICHA COMERCIAL</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="ab-btn blue">📄 Generar PDF</button>
                    <button className="ab-btn">📝 Generar Word</button>
                    <button className="ab-btn">🌐 Ver ficha web</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confidencialidad */}
          {activeTab === 'of-conf' && (
            <div className="tab-content active" style={{overflowY:'auto',flex:1}}>
              <div className="info-pad">

                {/* Toggle principal */}
                <div style={{display:'flex',alignItems:'center',gap:16,padding:'14px 16px',border:`1px solid ${confidential?'#334155':'var(--border)'}`,borderRadius:'var(--r2)',background:confidential?'#0f172a':'var(--surface)',marginBottom:18,transition:'all .2s'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:confidential?'#f8fafc':'var(--text)'}}>Oferta confidencial</div>
                    <div style={{fontSize:11,color:confidential?'#94a3b8':'var(--text3)',marginTop:2}}>
                      {confidential ? 'Activo, dirección, documentos y condiciones económicas ocultos para usuarios no autorizados.' : 'La oferta es visible para todos los usuarios con acceso al PDB.'}
                    </div>
                  </div>
                  <button onClick={()=>setConfidential(v=>!v)} style={{padding:'6px 16px',borderRadius:20,border:'none',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',background:confidential?'#f8fafc':'#1e293b',color:confidential?'#0f172a':'#f8fafc',transition:'all .2s'}}>
                    {confidential ? '🔓 Desactivar' : '🔒 Activar'}
                  </button>
                </div>

                {/* Info visible / oculta */}
                {confidential && (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:18}}>
                    <div style={{border:'1px solid var(--red-bd)',background:'var(--red-lt)',borderRadius:'var(--r2)',padding:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--red)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>❌ Oculto (no autorizados)</div>
                      {['Activo / Inmueble','Dirección y ubicación','Condiciones económicas','Documentación adjunta','Stacking plan'].map(item=>(
                        <div key={item} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--text2)',marginBottom:4}}>
                          <span style={{color:'var(--red)',fontWeight:700}}>✕</span> {item}
                        </div>
                      ))}
                    </div>
                    <div style={{border:'1px solid var(--green-bd)',background:'var(--green-lt)',borderRadius:'var(--r2)',padding:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>✅ Visible (siempre)</div>
                      {['Cliente / Cuenta','Tipo de operación','Estado de la oferta','Equipo responsable','Información básica'].map(item=>(
                        <div key={item} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--text2)',marginBottom:4}}>
                          <span style={{color:'var(--green)',fontWeight:700}}>✓</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usuarios autorizados */}
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em'}}>Usuarios autorizados</div>
                    <button className="ab-btn blue" onClick={()=>setAddingUser(true)} style={{fontSize:10,padding:'3px 9px'}}>+ Añadir usuario</button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {authorizedUsers.map((u,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',border:'1px solid var(--border)',borderRadius:'var(--r)',background:'var(--surface)'}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:u.bg,color:u.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>{u.initials}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:600}}>{u.name}</div>
                          <div style={{fontSize:10,color:'var(--text3)'}}>{u.team} · {u.role}</div>
                        </div>
                        {u.owner
                          ? <span className="tag tag-blue">Propietario</span>
                          : <>
                              <span style={{fontSize:10,color:'var(--text4)'}}>Acceso: {u.granted}</span>
                              <button onClick={()=>setAuthorizedUsers(prev=>prev.filter((_,j)=>j!==i))} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'2px 6px',fontFamily:'inherit'}}>✕ Quitar</button>
                            </>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {addingUser && (
                  <div style={{border:'1px solid var(--accent-bd)',background:'var(--accent-lt)',borderRadius:'var(--r2)',padding:14,marginBottom:14}}>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Conceder acceso a usuario</div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
                      <div style={{display:'flex',flexDirection:'column',gap:3}}>
                        <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Usuario</span>
                        <select className="fsel" value={newUser} onChange={e=>setNewUser(e.target.value)} style={{minWidth:220}}>
                          <option value="">Seleccionar usuario...</option>
                          <option>GOMEZ Ignacio · Leasing Oficinas MAD</option>
                          <option>García Marta · Capital Markets MAD</option>
                          <option>López Carmen · Valoraciones MAD</option>
                          <option>Alonso Abruña D. · Leasing MAD</option>
                          <option>Martínez Rosa · Retail MAD</option>
                        </select>
                      </div>
                      <button className="ab-btn save" onClick={()=>{
                        if(!newUser)return
                        const [nameStr,teamStr]=[newUser.split('·')[0].trim(),newUser.split('·')[1]?.trim()||'']
                        const ini=nameStr.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                        const today=new Date().toLocaleDateString('es-ES')
                        setAuthorizedUsers(prev=>[...prev,{name:nameStr,team:teamStr,role:'Autorizado',initials:ini,bg:'#f0fdf4',color:'#166534',granted:today,owner:false}])
                        setAddingUser(false);setNewUser('')
                      }}>Conceder acceso</button>
                      <button className="ab-btn" onClick={()=>{setAddingUser(false);setNewUser('')}}>Cancelar</button>
                    </div>
                  </div>
                )}

                {/* Solicitud de acceso (demo: usuario no autorizado) */}
                {confidential && (
                  <div style={{border:'1px solid var(--amber-bd)',background:'var(--amber-lt)',borderRadius:'var(--r2)',padding:14,marginBottom:16}}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--amber)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>DEMO — Vista de usuario no autorizado</div>
                    <div style={{fontSize:11,color:'var(--text2)',marginBottom:10}}>Un usuario sin acceso vería este mensaje y podría solicitar acceso al responsable.</div>
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',border:'1px solid var(--border)',borderRadius:'var(--r)',background:'var(--surface)'}}>
                      <span style={{fontSize:20}}>🔒</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600}}>Oferta confidencial</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>No tienes permisos para ver el detalle de esta oferta. Puedes solicitar acceso al responsable.</div>
                      </div>
                      <button className="ab-btn save" style={{flexShrink:0}} onClick={()=>alert('✅ Solicitud enviada a Sierra Álvaro\n\nEl responsable recibirá una notificación y podrá aprobar o rechazar tu acceso.')}>Solicitar acceso</button>
                    </div>
                  </div>
                )}

                {/* Trazabilidad */}
                <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Trazabilidad de accesos</div>
                <div style={{border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
                  {[
                    {color:'var(--green)',msg:'Sierra Álvaro creó la oferta y quedó asignado como responsable',date:'05/04/2026 · 10:00'},
                    {color:'var(--accent)',msg:'Sierra Álvaro activó confidencialidad en esta oferta',date:'07/04/2026 · 09:00'},
                  ].map((e,i,arr)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 12px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:e.color,flexShrink:0,marginTop:4}}/>
                      <div><div style={{fontSize:11}}>{e.msg}</div><div style={{fontSize:10,color:'var(--text4)'}}>{e.date}</div></div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="ficha-right">
          <div className="rp-sec">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Ocupación activo</div><div style={{ fontSize: 20, fontWeight: 700 }}>75%</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Otras ofertas</div><div style={{ fontSize: 20, fontWeight: 700 }}>2</div></div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">KPIs de la oferta</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div><div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 1 }}>Renta (€/m²/mes)</div><div style={{ fontSize: 14, fontWeight: 700 }}>12,58</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 1 }}>Gastos (€/m²/mes)</div><div style={{ fontSize: 14, fontWeight: 700 }}>3,81</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 1 }}>Renta mensual</div><div style={{ fontSize: 12, fontWeight: 700 }}>168.575 €</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 1 }}>Renta anual</div><div style={{ fontSize: 12, fontWeight: 700 }}>2,02 M€</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 1 }}>Sup. disponible</div><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)' }}>13.486 m²</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 1 }}>Plazas</div><div style={{ fontSize: 12, fontWeight: 700 }}>322</div></div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Asistente IA</div>
            <div className="ai-box">
              <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Insight oferta</span><span className="ai-badge">Tiempo real</span></div>
              <div className="ai-text">127 días en comercialización. Renta 12,50 €/m² <strong>por debajo del mercado A-1</strong> (13,50–14,00 €). Oracle en fase finalista.</div>
              <div className="ai-cta">✎ Preguntar a la IA</div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Propietario / Mandante</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#92400e' }}>BB</div>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>Baena Borja</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>FREO Investments Spain SL</div></div>
            </div>
            <div style={{ background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 8, fontSize: 11 }}>
              <div>📞 +34 910 888 998 · 📱 629 846 923</div>
              <div style={{ color: 'var(--accent)' }}>✉ b.baena@freogroup.com</div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Publicación portales</div>
            {[['🌐 Web Savills','Publicado',true],['🏠 Idealista','No publicado',false],['🏢 Mis Oficinas','No publicado',false]].map(([lbl,status,pub],i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 11 }}>{lbl}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: pub ? 'var(--green)' : 'var(--text4)' }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Oferta" refNombre="OLBUR2315645" onClose={() => setShowTarea(false)} />}
    </div>
  )
}
