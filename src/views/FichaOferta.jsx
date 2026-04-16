import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'

const TABS = ['of-info','of-contacto','of-espacios','of-plazas','of-condiciones','of-caract','of-docs','of-web','of-desc','of-seg','of-ficha','of-conf']
const TAB_LABELS = ['Información oferta','Datos de contacto','Espacios comerciales','Plazas de aparcamiento','Condiciones','Características','Documentos','Contenido web','Descriptivo','Seguimiento comercial','Crear ficha','🔒 Confidencialidad']

// ── Datos heredados del activo (mock) ──────────────────────────────────────
const ASSET = {
  nombre: 'Albatros — C. Anabel Segura 9-11, Alcobendas',
  usoPrincipal: 'Oficinas',
  estadoConstruccion: 'Rehabilitado (2023)',
  direccion: 'Calle de Anabel Segura 9-11, 28108 Alcobendas, Madrid',
  propietario: {
    sociedad: 'FREO Investments Spain SL',
    contacto: 'Baena Borja',
    telFijo: '+34 910 888 998',
    telMovil: '629 846 923',
    email: 'b.baena@freogroup.com',
  },
}

// ── Tipología condicional por uso ──────────────────────────────────────────
const TIPOLOGIA_MAP = {
  'Oficinas':               ['Oficina tradicional','Coworking','Subarriendo','Business park','Sede única (HQ)'],
  'Logístico':              ['Nave logística','Nave industrial','Última milla','Plataforma logística','Cross-docking'],
  'Logístico / Industrial': ['Nave logística','Nave industrial','Última milla','Plataforma logística','Cross-docking'],
  'Retail':                 ['High Street','Local en centro comercial','Parque comercial','Local stand-alone','Flagship store','Parque de medianas'],
  'Centros comerciales':    ['Centro comercial dominante','Centro comercial secundario','Outlet','Participación en centro'],
  'Residencial':            ['Vivienda plurifamiliar','Vivienda unifamiliar','Obra nueva','Segunda mano'],
  'Living (PRS / BTR / Flex)': ['Build to Rent (BTR)','Build to Sell (BTS)','Flex living','Student housing','Senior living','Coliving'],
  'Hoteles':                ['Hotel urbano','Hotel vacacional','Resort','Aparthotel','Hostal'],
  'Suelos':                 ['Suelo finalista','Suelo en desarrollo','Suelo urbanizable'],
  'Alternativos':           ['Selección abierta'],
  'Mixtos':                 ['Selección combinada de tipologías'],
  'Data Center':            ['Hyperscale','Colocation','Edge computing'],
}

// ── Espacios del stacking plan (sincronizados) ────────────────────────────
const ESPACIOS_STACKING = [
  { edificio: 'Edificio Albatros D', modulo: 'D-P4', planta: 'P4', uso: 'Oficina', sup: 2577, renta: 12.50 },
  { edificio: 'Edificio Albatros D', modulo: 'D-P3', planta: 'P3', uso: 'Oficina', sup: 2790, renta: 12.50 },
  { edificio: 'Edificio Albatros D', modulo: 'D-P1', planta: 'P1', uso: 'Oficina', sup: 2793, renta: 12.50 },
]

// ── Actividades de seguimiento ────────────────────────────────────────────
const USERS_INIT = [
  { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', granted:'—', owner:true },
]

const TIPO_TAG = { Email:'tag-blue', Llamada:'tag-green', Reunión:'tag-purple', Tarea:'tag-gray', Visita:'tag-teal', Presentación:'tag-amber' }
const TIPO_ICO = { Email:'📧', Llamada:'📞', Reunión:'🤝', Tarea:'✅', Visita:'🏢', Presentación:'📤' }
const ACT_EST  = { Abierto:'tag-amber', Finalizado:'tag-gray', 'En curso':'tag-blue', Realizada:'tag-green' }

const SEG_ACTS = [
  { id:'ACT-OF-01', tipo:'Presentación', asunto:'Presentación oferta Albatros P1–P4 enviada a Oracle Spain',   fecha:'10/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-OF-02', tipo:'Visita',       asunto:'Visita técnica Oracle Spain — Albatros Edif. D P2',           fecha:'15/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Realizada'  },
  { id:'ACT-OF-03', tipo:'Email',        asunto:'Envío condiciones económicas actualizadas a Carlos Méndez',    fecha:'20/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-OF-04', tipo:'Llamada',      asunto:'Llamada de seguimiento — confirmación interés Oracle',         fecha:'25/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-OF-05', tipo:'Reunión',      asunto:'Reunión propietario Allianz — revisión oferta y condiciones',  fecha:'28/03/2026', user:'GOMEZ Ignacio', initials:'GI', bg:'#fdf4ff', color:'#7e22ce', estado:'Finalizado' },
  { id:'ACT-OF-06', tipo:'Email',        asunto:'Contraoferta recibida Oracle — análisis pendiente',            fecha:'02/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'En curso'   },
  { id:'ACT-OF-07', tipo:'Tarea',        asunto:'Preparar respuesta a contraoferta Oracle Spain SL',            fecha:'07/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Abierto'    },
]

// ── Helpers ───────────────────────────────────────────────────────────────
function FieldLbl({ children, req }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>
      {children}{req && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
    </div>
  )
}
function ReadonlyPill({ value }) {
  return (
    <div style={{ padding: '6px 9px', border: '1px solid var(--border)', borderRadius: 'var(--r)', fontSize: 12, background: 'var(--gray-lt)', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
      {value}
      <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text4)', fontWeight: 600, letterSpacing: '.04em' }}>AUTO</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FichaOferta() {
  const { navigate } = useNav()
  const [activeTab, setActiveTab] = useState('of-info')
  const [confidential, setConfidential] = useState(false)
  const [authorizedUsers, setAuthorizedUsers] = useState(USERS_INIT)
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState('')
  const [showTarea, setShowTarea] = useState(false)

  // ── Tab 1 – Información oferta ──
  const [tipoComercializacion, setTipoComercializacion] = useState('Mandato Savills')
  const [tipologia, setTipologia] = useState('')
  const [estadoEspacio, setEstadoEspacio] = useState('')
  const [tipoOperacion, setTipoOperacion] = useState('Alquiler')
  const [origenOferta, setOrigenOferta] = useState('')
  const [modalidadVisita, setModalidadVisita] = useState('')
  const [comentarios, setComentarios] = useState('')

  // ── Tab 2 – Contacto ──
  const [colaboradores, setColaboradores] = useState([])
  const [addingColab, setAddingColab] = useState(false)
  const [newColabEmpresa, setNewColabEmpresa] = useState('')
  const [newColabContacto, setNewColabContacto] = useState('')
  const [equipoMembers, setEquipoMembers] = useState([
    { name:'Sierra Álvaro',    team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', owner:true  },
    { name:'Alonso Abruña D.', team:'Leasing MAD',       role:'Colaborador', initials:'AD', bg:'#f3e8ff', color:'#6b21a8', owner:false },
  ])
  const [addingMiembro, setAddingMiembro] = useState(false)
  const [newMiembro, setNewMiembro] = useState('')

  // ── Tab 3 – Espacios ──
  const [fechaDispGlobal, setFechaDispGlobal] = useState('2026-06-01')
  const [divisibleGlobal, setDivisibleGlobal] = useState(true)
  const [supAprox, setSupAprox] = useState(false)
  const [plantaTipo, setPlantaTipo] = useState(2790)
  const [ofertasDesglose, setOfertasDesglose] = useState([
    { id: 1, nombre: 'Oferta 1', sup: 8160, divisible: true, minEspacio: 2577, cargasM2: 3.01, modulos: 3, editando: false },
  ])
  const [nextOfertaId, setNextOfertaId] = useState(2)
  const [editNombreId, setEditNombreId] = useState(null)
  const [editNombreVal, setEditNombreVal] = useState('')

  const supTotal = ESPACIOS_STACKING.reduce((s, e) => s + e.sup, 0)

  function addOferta() {
    const id = nextOfertaId
    setOfertasDesglose(prev => [...prev, {
      id, nombre: `Oferta ${id}`, sup: 0, divisible: divisibleGlobal,
      minEspacio: 0, cargasM2: 3.01, modulos: 0, editando: false,
    }])
    setNextOfertaId(id + 1)
  }

  function removeOferta(id) {
    setOfertasDesglose(prev => prev.filter(o => o.id !== id))
  }

  // Escenarios comerciales según divisibilidad
  function getEscenarios() {
    if (!divisibleGlobal) {
      return [{ label: 'Total disponible', sup: supTotal, tipo: 'unico' }]
    }
    const base = ESPACIOS_STACKING.map(e => ({ label: `${e.planta} — ${e.edificio}`, sup: e.sup, tipo: 'modulo' }))
    if (ESPACIOS_STACKING.length > 1) {
      base.push({ label: 'Total combinado', sup: supTotal, tipo: 'total' })
    }
    return base
  }

  const tipologiaOpciones = TIPOLOGIA_MAP[ASSET.usoPrincipal] || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Action bar */}
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
          {/* Header */}
          <div className="ah">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div className="ah-ico" style={{ background: 'linear-gradient(135deg,#064e3b,#10b981)' }}>📋</div>
              <div style={{ flex: 1 }}>
                <div className="ah-ref">
                  <span className="ref-badge-oferta">OFERTA</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>OLBUR2315645</span>
                  {confidential && <span style={{ background:'#1e293b',color:'#f8fafc',border:'1px solid #334155',padding:'0 7px',borderRadius:3,fontSize:9,fontWeight:700,letterSpacing:'.04em' }}>🔒 CONFIDENCIAL</span>}
                  <span style={{ color:'var(--text3)' }}>· Activo: <span className="pat-link" onClick={() => navigate('ficha-activo')}>Albatros — C. Anabel Segura 9-11, Alcobendas</span></span>
                  <span className="tag tag-green" style={{ fontSize:9 }}>+ Vinculado</span>
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
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase' }}>Equipo</div>
                <div style={{ fontSize:11, fontWeight:600 }}>Transaction Spain</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4, justifyContent:'flex-end' }}>
                  <div className="c-av" style={{ background:'#dbeafe', color:'#1e40af', width:22, height:22, fontSize:8 }}>AS</div>
                  <span style={{ fontSize:11 }}>Sierra Álvaro</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {TABS.map((t, i) => (
              <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[i]}</div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1 — INFORMACIÓN OFERTA
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'of-info' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                  {/* ── Columna izquierda — formulario ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Activo */}
                    <div>
                      <FieldLbl req>Activo / Asset</FieldLbl>
                      <div style={{ padding:'6px 9px', border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', fontSize:12, color:'var(--accent)', cursor:'pointer', background:'var(--accent-lt)', display:'flex', alignItems:'center', gap:6 }}
                           onClick={() => navigate('ficha-activo')}>
                        <span>🏢</span>
                        <span style={{ flex:1, fontWeight:500 }}>Albatros — C. Anabel Segura 9-11, Alcobendas</span>
                        <span style={{ fontSize:9, color:'var(--accent)', fontWeight:700 }}>↗</span>
                      </div>
                    </div>

                    {/* Uso principal — heredado, no editable */}
                    <div>
                      <FieldLbl>Uso principal</FieldLbl>
                      <ReadonlyPill value={ASSET.usoPrincipal} />
                    </div>

                    {/* Estado de construcción — heredado, no editable */}
                    <div>
                      <FieldLbl>Estado de construcción</FieldLbl>
                      <ReadonlyPill value={ASSET.estadoConstruccion} />
                    </div>

                    {/* Tipología de comercialización */}
                    <div>
                      <FieldLbl req>Tipología de comercialización</FieldLbl>
                      <select className="of-sel" value={tipoComercializacion} onChange={e => setTipoComercializacion(e.target.value)}>
                        <option>Mandato Savills</option>
                        <option>Sin mandato</option>
                        <option>Otras consultoras</option>
                      </select>
                    </div>

                    {/* Tipología — condicional según uso */}
                    <div>
                      <FieldLbl req>Tipología</FieldLbl>
                      <select className="of-sel" value={tipologia} onChange={e => setTipologia(e.target.value)}>
                        <option value="">— Seleccionar —</option>
                        {tipologiaOpciones.map(t => <option key={t}>{t}</option>)}
                      </select>
                      {tipologiaOpciones.length > 0 && (
                        <div style={{ fontSize:9, color:'var(--text4)', marginTop:2 }}>
                          Opciones para <strong>{ASSET.usoPrincipal}</strong>
                        </div>
                      )}
                    </div>

                    {/* Estado del espacio */}
                    <div>
                      <FieldLbl>Estado del espacio</FieldLbl>
                      <select className="of-sel" value={estadoEspacio} onChange={e => setEstadoEspacio(e.target.value)}>
                        <option value="">— Seleccionar —</option>
                        {['Nuevo','Obra nueva','Muy buen estado','En bruto','Segunda mano','Implantado','Plug&Play','Por reformar','Amueblado','Sin amueblar'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Tipo de operación */}
                    <div>
                      <FieldLbl req>Tipo de operación</FieldLbl>
                      <select className="of-sel" value={tipoOperacion} onChange={e => setTipoOperacion(e.target.value)}>
                        <option>Alquiler</option>
                        <option>Venta</option>
                        <option>Alquiler / Venta</option>
                      </select>
                    </div>

                    {/* Origen de la oferta */}
                    <div>
                      <FieldLbl>Origen de la oferta</FieldLbl>
                      <select className="of-sel" value={origenOferta} onChange={e => setOrigenOferta(e.target.value)}>
                        <option value="">— Seleccionar —</option>
                        {['Demanda entrante','Prospección directa','Referencia interna','Portal web','Red de colaboradores','Otra consultora'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Mandato asociado */}
                    <div>
                      <FieldLbl>Mandato asociado</FieldLbl>
                      <div style={{ position:'relative' }}>
                        <input className="of-inp" placeholder="🔍  Buscar mandato..." style={{ paddingLeft:8 }} />
                      </div>
                    </div>

                    {/* KYC */}
                    <div>
                      <FieldLbl>KYC</FieldLbl>
                      <div style={{ position:'relative' }}>
                        <input className="of-inp" placeholder="🔍  Buscar registro KYC..." style={{ paddingLeft:8 }} />
                      </div>
                    </div>

                    {/* Modalidad de visita */}
                    <div>
                      <FieldLbl>Modalidad de visita</FieldLbl>
                      <select className="of-sel" value={modalidadVisita} onChange={e => setModalidadVisita(e.target.value)}>
                        <option value="">— Seleccionar —</option>
                        <option>Presencial</option>
                        <option>Virtual</option>
                        <option>Presencial + Virtual</option>
                      </select>
                    </div>

                    {/* Comentarios */}
                    <div>
                      <FieldLbl>Comentarios</FieldLbl>
                      <textarea className="of-textarea" placeholder="Observaciones internas..." value={comentarios} onChange={e => setComentarios(e.target.value)} style={{ minHeight:72 }} />
                    </div>
                  </div>

                  {/* ── Columna derecha — mapa + imágenes ── */}
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <div>
                      <FieldLbl>Ubicación · Georreferenciado desde activo</FieldLbl>
                      <div style={{ borderRadius:'var(--r2)', overflow:'hidden', border:'1px solid var(--border)', height:280 }}>
                        <iframe
                          title="Mapa oferta"
                          width="100%"
                          height="100%"
                          style={{ border:0 }}
                          loading="lazy"
                          src="https://maps.google.com/maps?q=Calle+de+Anabel+Segura+9-11,+Alcobendas,+Madrid&z=15&output=embed"
                        />
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                        <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'7px 10px', fontSize:11 }}>
                          <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Dirección</div>
                          <div style={{ color:'var(--text2)', marginTop:2 }}>Calle de Anabel Segura 9-11</div>
                          <div style={{ color:'var(--text3)' }}>28108 Alcobendas, Madrid</div>
                        </div>
                        <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'7px 10px', fontSize:11 }}>
                          <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Zona</div>
                          <div style={{ color:'var(--text2)', marginTop:2 }}>A-1 · Alcobendas</div>
                          <div style={{ color:'var(--text3)' }}>Arroyo de la Vega</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <FieldLbl>Imágenes · Vinculadas al activo</FieldLbl>
                      <div className="img-strip">
                        <div className="img-thumb principal">🏢</div>
                        <div className="img-thumb">🏙</div>
                        <div className="img-thumb">🖼</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2 — DATOS DE CONTACTO
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'of-contacto' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

                  {/* ── Bloque izquierdo: Propietario ── */}
                  <div className="info-block">
                    <div className="ib-title">🏠 PROPIETARIO</div>
                    <div style={{ fontSize:9, color:'var(--text4)', marginBottom:8, fontWeight:600, letterSpacing:'.04em' }}>
                      Sincronizado desde el activo
                    </div>
                    {ASSET.propietario ? (
                      <>
                        <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{ASSET.propietario.sociedad}</div>
                        <div style={{ fontSize:11, color:'var(--accent)', fontWeight:500, marginBottom:8 }}>{ASSET.propietario.contacto}</div>
                        <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:10, fontSize:11, display:'flex', flexDirection:'column', gap:4 }}>
                          <div>📞 {ASSET.propietario.telFijo}</div>
                          <div>📱 {ASSET.propietario.telMovil}</div>
                          <div style={{ color:'var(--accent)' }}>✉ {ASSET.propietario.email}</div>
                        </div>
                        <div style={{ marginTop:8 }}>
                          <span style={{ fontSize:9, background:'var(--green-lt)', color:'var(--green)', border:'1px solid var(--green-bd)', padding:'2px 7px', borderRadius:10, fontWeight:700 }}>ↈ Sincronizado</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic', padding:'12px 0' }}>
                        El activo no tiene propietario asociado.
                      </div>
                    )}
                  </div>

                  {/* ── Bloque central: Colaboradores ── */}
                  <div className="info-block">
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div className="ib-title" style={{ marginBottom:0 }}>🤝 COLABORADORES</div>
                      {tipoComercializacion === 'Otras consultoras' && (
                        <button className="ab-btn blue" style={{ fontSize:10, padding:'2px 8px' }} onClick={() => setAddingColab(true)}>+ Añadir</button>
                      )}
                    </div>

                    {tipoComercializacion !== 'Otras consultoras' ? (
                      <div style={{ fontSize:11, color:'var(--text4)', padding:'10px 0', fontStyle:'italic' }}>
                        No aplica. Selecciona "Otras consultoras" en Información general para activar esta sección.
                      </div>
                    ) : colaboradores.length === 0 && !addingColab ? (
                      <div style={{ fontSize:11, color:'var(--text4)', padding:'10px 0' }}>
                        Sin colaboradores añadidos.
                        <button className="ab-btn" style={{ fontSize:10, marginTop:8, display:'block' }} onClick={() => setAddingColab(true)}>+ Añadir consultora</button>
                      </div>
                    ) : null}

                    {colaboradores.map((c, i) => (
                      <div key={i} style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', padding:10, marginBottom:8, fontSize:11 }}>
                        <div style={{ fontWeight:600, marginBottom:2 }}>{c.empresa}</div>
                        {c.contacto && <div style={{ color:'var(--accent)' }}>{c.contacto}</div>}
                        <button onClick={() => setColaboradores(prev => prev.filter((_, j) => j !== i))}
                          style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'4px 0', fontFamily:'inherit' }}>✕ Quitar</button>
                      </div>
                    ))}

                    {addingColab && (
                      <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r)', padding:12 }}>
                        <div style={{ fontSize:11, fontWeight:600, marginBottom:8 }}>Añadir consultora colaboradora</div>
                        <div style={{ marginBottom:7 }}>
                          <FieldLbl>Empresa / Cuenta</FieldLbl>
                          <select className="fsel" style={{ width:'100%' }} value={newColabEmpresa} onChange={e => setNewColabEmpresa(e.target.value)}>
                            <option value="">Buscar consultora...</option>
                            {['CBRE','JLL','Cushman & Wakefield','Colliers','Knight Frank','BNP Paribas RE'].map(e => <option key={e}>{e}</option>)}
                          </select>
                        </div>
                        <div style={{ marginBottom:10 }}>
                          <FieldLbl>Persona de contacto</FieldLbl>
                          <input className="of-inp" placeholder="Buscar contacto..." value={newColabContacto} onChange={e => setNewColabContacto(e.target.value)} />
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="ab-btn save" onClick={() => {
                            if (!newColabEmpresa) return
                            setColaboradores(prev => [...prev, { empresa: newColabEmpresa, contacto: newColabContacto }])
                            setAddingColab(false); setNewColabEmpresa(''); setNewColabContacto('')
                          }}>Añadir</button>
                          <button className="ab-btn" onClick={() => { setAddingColab(false); setNewColabEmpresa(''); setNewColabContacto('') }}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Bloque derecho: Equipo Savills ── */}
                  <div className="info-block">
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div className="ib-title" style={{ marginBottom:0 }}>👥 EQUIPO SAVILLS</div>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="ab-btn" style={{ fontSize:9, padding:'2px 7px' }} onClick={() => setAddingMiembro(true)}>+ Miembro</button>
                        <button className="ab-btn" style={{ fontSize:9, padding:'2px 7px' }}>+ Equipo</button>
                      </div>
                    </div>
                    <div style={{ fontSize:9, color:'var(--amber)', background:'var(--amber-lt)', border:'1px solid var(--amber-bd)', borderRadius:4, padding:'4px 8px', marginBottom:10, fontWeight:600 }}>
                      Solo editable por creador o manager
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {equipoMembers.map((m, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:m.bg, color:m.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>{m.initials}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:11, fontWeight:600 }}>{m.name}</div>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>{m.team}</div>
                          </div>
                          {m.owner
                            ? <span className="tag tag-blue" style={{ fontSize:9 }}>Responsable</span>
                            : <button onClick={() => setEquipoMembers(prev => prev.filter((_, j) => j !== i))}
                                style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', fontFamily:'inherit' }}>✕</button>
                          }
                        </div>
                      ))}
                    </div>

                    {addingMiembro && (
                      <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r)', padding:10, marginTop:8 }}>
                        <FieldLbl>Usuario</FieldLbl>
                        <select className="fsel" style={{ width:'100%', marginBottom:8 }} value={newMiembro} onChange={e => setNewMiembro(e.target.value)}>
                          <option value="">Seleccionar usuario...</option>
                          {['GOMEZ Ignacio · Leasing Oficinas MAD','García Marta · Capital Markets MAD','López Carmen · Valoraciones MAD','Martínez Rosa · Retail MAD'].map(u => <option key={u}>{u}</option>)}
                        </select>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="ab-btn save" style={{ fontSize:10 }} onClick={() => {
                            if (!newMiembro) return
                            const [nameStr, teamStr] = [newMiembro.split('·')[0].trim(), newMiembro.split('·')[1]?.trim() || '']
                            const ini = nameStr.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase()
                            setEquipoMembers(prev => [...prev, { name:nameStr, team:teamStr, role:'Colaborador', initials:ini, bg:'#f0fdf4', color:'#166534', owner:false }])
                            setAddingMiembro(false); setNewMiembro('')
                          }}>Añadir</button>
                          <button className="ab-btn" style={{ fontSize:10 }} onClick={() => { setAddingMiembro(false); setNewMiembro('') }}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3 — ESPACIOS COMERCIALES
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'of-espacios' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16 }}>

                  {/* ── Columna izquierda — configuración general ── */}
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text)', marginBottom:2 }}>Configuración general</div>

                    {/* Fecha disponibilidad */}
                    <div>
                      <FieldLbl>Fecha disponibilidad</FieldLbl>
                      <input type="date" className="of-inp" value={fechaDispGlobal} onChange={e => setFechaDispGlobal(e.target.value)} />
                    </div>

                    {/* Divisible */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600 }}>¿Divisible?</div>
                        <div style={{ fontSize:9, color:'var(--text4)' }}>Aplica a toda la oferta</div>
                      </div>
                      <button onClick={() => setDivisibleGlobal(v => !v)} style={{ padding:'4px 12px', borderRadius:12, border:'none', fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit', background:divisibleGlobal?'#dcfce7':'#fef2f2', color:divisibleGlobal?'#166534':'#991b1b', transition:'all .15s' }}>
                        {divisibleGlobal ? 'Sí' : 'No'}
                      </button>
                    </div>

                    {/* Superficie total — auto */}
                    <div>
                      <FieldLbl>Superficie total disponible (m²)</FieldLbl>
                      <div style={{ padding:'6px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', fontSize:14, fontWeight:700, background:'var(--gray-lt)', display:'flex', alignItems:'center', gap:6 }}>
                        <span>{supTotal.toLocaleString()}</span>
                        <span style={{ marginLeft:'auto', fontSize:9, color:'var(--text4)', fontWeight:600 }}>AUTO</span>
                      </div>
                    </div>

                    {/* Superficie aproximada */}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input type="checkbox" id="supAprox" checked={supAprox} onChange={e => setSupAprox(e.target.checked)} style={{ accentColor:'var(--accent)' }} />
                      <label htmlFor="supAprox" style={{ fontSize:11, cursor:'pointer' }}>Superficie aproximada</label>
                    </div>

                    {/* Planta tipo */}
                    <div>
                      <FieldLbl>Planta tipo (m²)</FieldLbl>
                      <input type="number" className="of-inp" value={plantaTipo} onChange={e => setPlantaTipo(e.target.value)} />
                    </div>

                    {/* Info escenarios */}
                    <div style={{ marginTop:4, padding:'10px 12px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', fontSize:10 }}>
                      <div style={{ fontWeight:700, color:'var(--accent)', marginBottom:4 }}>Escenarios comerciales</div>
                      {getEscenarios().map((sc, i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', color:'var(--text2)', marginBottom:2 }}>
                          <span>{sc.label}</span>
                          <span style={{ fontFamily:'var(--mono)', fontWeight:600 }}>{sc.sup.toLocaleString()} m²</span>
                        </div>
                      ))}
                      {divisibleGlobal && ESPACIOS_STACKING.length > 1 && (
                        <div style={{ marginTop:4, fontSize:9, color:'var(--text4)' }}>
                          {ESPACIOS_STACKING.length} módulos + combinado = {ESPACIOS_STACKING.length + 1} escenarios
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Columna derecha ── */}
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                    {/* Bloque superior: Desglose de ofertas */}
                    <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--gray-lt)' }}>
                        <div style={{ fontSize:11, fontWeight:700 }}>Desglose de ofertas</div>
                        <button className="ab-btn blue" style={{ fontSize:10, padding:'3px 10px' }} onClick={addOferta}>+ Agregar</button>
                      </div>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead>
                          <tr>
                            {['Nombre área','Sup. total','¿Divisible?','Mín. espacio','Cargas €/m²','Cargas anuales','Fecha disp.','Módulos',''].map(h => (
                              <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ofertasDesglose.map(o => (
                            <tr key={o.id} style={{ borderBottom:'1px solid var(--border)' }}>
                              <td style={{ padding:'7px 12px' }}>
                                {editNombreId === o.id ? (
                                  <input autoFocus value={editNombreVal} onChange={e => setEditNombreVal(e.target.value)}
                                    onBlur={() => { setOfertasDesglose(prev => prev.map(x => x.id === o.id ? {...x, nombre:editNombreVal||x.nombre} : x)); setEditNombreId(null) }}
                                    onKeyDown={e => { if (e.key === 'Enter') { setOfertasDesglose(prev => prev.map(x => x.id === o.id ? {...x, nombre:editNombreVal||x.nombre} : x)); setEditNombreId(null) } }}
                                    style={{ fontSize:11, border:'1px solid var(--accent)', borderRadius:3, padding:'2px 6px', fontFamily:'inherit', width:120 }} />
                                ) : (
                                  <span className="pat-link" onClick={() => { setEditNombreId(o.id); setEditNombreVal(o.nombre) }} title="Clic para editar">{o.nombre}</span>
                                )}
                              </td>
                              <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{o.sup > 0 ? o.sup.toLocaleString() : <span style={{ color:'var(--text4)' }}>—</span>}</td>
                              <td style={{ padding:'7px 12px' }}>
                                <span style={{ fontSize:10, fontWeight:600, color:o.divisible?'var(--green)':'var(--red)' }}>{o.divisible ? 'Sí' : 'No'}</span>
                              </td>
                              <td style={{ padding:'7px 12px', color:'var(--text3)' }}>{o.minEspacio > 0 ? `${o.minEspacio.toLocaleString()} m²` : '—'}</td>
                              <td style={{ padding:'7px 12px', color:'var(--text3)' }}>{o.cargasM2} €</td>
                              <td style={{ padding:'7px 12px', color:'var(--text3)', fontFamily:'var(--mono)' }}>
                                {o.sup > 0 ? `${(o.cargasM2 * o.sup * 12).toLocaleString(undefined,{maximumFractionDigits:0})} €` : '—'}
                              </td>
                              <td style={{ padding:'7px 12px', color:'var(--text3)', whiteSpace:'nowrap' }}>
                                {fechaDispGlobal ? new Date(fechaDispGlobal).toLocaleDateString('es-ES') : '—'}
                              </td>
                              <td style={{ padding:'7px 12px', textAlign:'center' }}>
                                <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)' }}>{o.modulos || '—'}</span>
                              </td>
                              <td style={{ padding:'7px 12px' }}>
                                <div style={{ display:'flex', gap:5 }}>
                                  <button className="ra p" onClick={() => { setEditNombreId(o.id); setEditNombreVal(o.nombre) }}>✎</button>
                                  <button className="ra" onClick={() => removeOferta(o.id)} style={{ color:'var(--red)' }}>✕</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {ofertasDesglose.length === 0 && (
                            <tr><td colSpan={9} style={{ padding:'18px', textAlign:'center', color:'var(--text4)', fontSize:11, fontStyle:'italic' }}>Sin ofertas. Pulsa "+ Agregar" para crear la primera.</td></tr>
                          )}
                        </tbody>
                      </table>
                      <div style={{ padding:'7px 14px', background:'var(--accent-lt)', borderTop:'1px solid var(--accent-bd)', fontSize:10, color:'var(--accent)' }}>
                        ↈ Al guardar, las ofertas se crean automáticamente en el Stacking Plan como elementos arrastrables.
                      </div>
                    </div>

                    {/* Bloque inferior: Espacios comercializables */}
                    <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--gray-lt)' }}>
                        <div>
                          <span style={{ fontSize:11, fontWeight:700 }}>Espacios comercializables</span>
                          <span style={{ marginLeft:8, fontSize:9, color:'var(--text4)' }}>Proyección automática del Stacking Plan</span>
                        </div>
                        <span className="tag tag-green" style={{ fontSize:9 }}>ↈ Auto-calculado</span>
                      </div>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead>
                          <tr>
                            {['Edificio','Módulo','Planta','Uso','Superficie','Divisible','Renta €/m²/mes','Renta mensual'].map(h => (
                              <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ESPACIOS_STACKING.map((e, i) => (
                            <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                              <td style={{ padding:'7px 12px', fontSize:10, color:'var(--text2)' }}>{e.edificio}</td>
                              <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontSize:10 }}>{e.modulo}</td>
                              <td style={{ padding:'7px 12px' }}><span className="tag tag-gray" style={{ fontSize:9 }}>{e.planta}</span></td>
                              <td style={{ padding:'7px 12px' }}><span className="tag tag-blue" style={{ fontSize:9 }}>{e.uso}</span></td>
                              <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{e.sup.toLocaleString()}</td>
                              <td style={{ padding:'7px 12px' }}><span style={{ fontSize:10, fontWeight:600, color:divisibleGlobal?'var(--green)':'var(--red)' }}>{divisibleGlobal ? 'Sí' : 'No'}</span></td>
                              <td style={{ padding:'7px 12px', fontFamily:'var(--mono)' }}>{e.renta.toFixed(2)} €</td>
                              <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600, color:'var(--green)' }}>{(e.renta * e.sup).toLocaleString(undefined,{maximumFractionDigits:0})} €</td>
                            </tr>
                          ))}
                          {/* Fila total */}
                          <tr style={{ background:'var(--gray-lt)', borderTop:'2px solid var(--border)' }}>
                            <td colSpan={4} style={{ padding:'7px 12px', fontSize:10, fontWeight:700, color:'var(--text3)' }}>TOTAL</td>
                            <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:800 }}>{supTotal.toLocaleString()}</td>
                            <td />
                            <td />
                            <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:800, color:'var(--green)' }}>
                              {ESPACIOS_STACKING.reduce((s,e) => s + e.renta * e.sup, 0).toLocaleString(undefined,{maximumFractionDigits:0})} €
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plazas */}
          {activeTab === 'of-plazas' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Plazas de aparcamiento</div>
                <table className="pat-table">
                  <thead><tr><th>Tipo</th><th>Int/Ext</th><th>Vehículo</th><th>Número</th><th>Renta plaza</th><th>Total alquiler/mes</th></tr></thead>
                  <tbody><tr><td>Simple</td><td>Interior</td><td>Coches</td><td>322</td><td>€110,00</td><td style={{ fontWeight:600 }}>€35.420,00</td></tr></tbody>
                </table>
              </div>
            </div>
          )}

          {/* Condiciones */}
          {activeTab === 'of-condiciones' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>
                  Condiciones <span className="tag tag-green" style={{ fontSize:9, marginLeft:6 }}>+ Sincronizado</span>
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
                    <div className="cond-row"><span className="cond-key">Renta (€/m²/mes)</span><span className="cond-val" style={{ fontSize:15, color:'var(--green)' }}>12,50 €</span></div>
                    <div className="cond-row"><span className="cond-key">Renta mensual</span><span className="cond-val" style={{ color:'var(--green)' }}>168.575 €</span></div>
                    <div className="cond-row"><span className="cond-key">Gastos comunes</span><span className="cond-val">3,01 €/m²/mes</span></div>
                  </div>
                  <div className="cond-block">
                    <div className="cond-block-title">INCENTIVOS Y CAPEX</div>
                    <div className="cond-row"><span className="cond-key">Meses de carencia</span><span className="cond-val">—</span></div>
                    <div className="cond-row"><span className="cond-key">Aportación obras</span><span className="cond-val">—</span></div>
                    <div className="cond-row"><span className="cond-key">Estado oferta</span><span className="cond-val" style={{ color:'var(--green)' }}>Disponible</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Características */}
          {activeTab === 'of-caract' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>Características · Importadas del activo</div>
                  <button className="ab-btn blue" style={{ padding:'3px 9px', fontSize:10 }}>↩ Recuperar</button>
                </div>
                <div style={{ background:'var(--green-lt)', border:'1px solid var(--green-bd)', borderRadius:'var(--r)', padding:'6px 10px', marginBottom:10, fontSize:11, color:'var(--green)' }}>
                  ↈ Características recuperadas del activo. Edita sin modificar el dato maestro.
                  <span style={{ background:'var(--green-lt)', color:'var(--green)', border:'1px solid var(--green-bd)', padding:'1px 7px', borderRadius:10, fontSize:9, fontWeight:700, marginLeft:6 }}>+ Importado</span>
                </div>
                <table className="pat-table">
                  <thead><tr><th>¿Incluido?</th><th>Proponer</th><th>Tipo</th><th>Año</th><th>Comentario</th></tr></thead>
                  <tbody><tr><td><input type="checkbox" defaultChecked style={{ accentColor:'var(--accent)' }} /></td><td><input type="checkbox" style={{ accentColor:'var(--accent)' }} /></td><td>Rehabilitación integral</td><td>2023</td><td style={{ color:'var(--text4)' }}>—</td></tr></tbody>
                </table>
              </div>
            </div>
          )}

          {/* Documentos */}
          {activeTab === 'of-docs' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>Documentos</div>
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
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <div className="of-field" style={{ marginBottom:10 }}>
                      <div className="of-lbl">Título (Web/Flyer) — Español</div>
                      <input className="of-inp" defaultValue="Complejo de edificios exclusivos en Arroyo de la Vega" />
                    </div>
                    <div className="of-field">
                      <div className="of-lbl">Texto descriptivo — Español</div>
                      <textarea className="of-textarea" defaultValue="Situados en un entorno profesional de alto nivel, en Arroyo de la Vega, los edificios C y D Albatros ofrecen unas instalaciones únicas reformadas de forma integral." />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>PORTALES WEB</div>
                    <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                      {[['🌐 Web Savills', true], ['🏠 Idealista', false], ['🏢 Mis Oficinas', false]].map(([lbl, checked], i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom:i < 2 ? '1px solid var(--border)' : 'none' }}>
                          <span style={{ fontSize:12 }}>{lbl}</span>
                          <input type="checkbox" defaultChecked={checked} style={{ accentColor:'var(--accent)' }} />
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
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className="info-block">
                    <div className="ib-title">OPCIONES DE VISUALIZACIÓN</div>
                    <div className="of-field" style={{ marginBottom:10 }}><div className="of-lbl">Geolocalizar dirección</div><select className="of-sel"><option>Sí</option><option>No</option></select></div>
                    <div className="of-field"><div className="of-lbl">Mostrar datos consultor</div><select className="of-sel"><option>No</option><option>Sí</option></select></div>
                  </div>
                  <div className="info-block">
                    <div className="ib-title">CARACTERÍSTICAS A RESALTAR</div>
                    <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:10, fontSize:11, lineHeight:1.8 }}>
                      <div>• Gimnasio equipado</div><div>• Parking interior</div>
                      <div>• Zonas ajardinadas</div><div>• Terraza privativa en 4ª planta</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>HISTÓRICO DE DESCRIPTIVOS</div>
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
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                  {[
                    { lbl:'Actividades totales', val:SEG_ACTS.length, color:'var(--text1)' },
                    { lbl:'Presentaciones',      val:SEG_ACTS.filter(a=>a.tipo==='Presentación').length, color:'var(--amber)' },
                    { lbl:'Visitas realizadas',  val:SEG_ACTS.filter(a=>a.tipo==='Visita').length, color:'var(--teal)' },
                    { lbl:'Pendientes',          val:SEG_ACTS.filter(a=>a.estado==='Abierto'||a.estado==='En curso').length, color:'var(--red)' },
                  ].map(k => (
                    <div key={k.lbl} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'8px 12px', textAlign:'center' }}>
                      <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{k.lbl}</div>
                      <div style={{ fontSize:18, fontWeight:800, fontFamily:'var(--mono)', color:k.color }}>{k.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:600 }}>Actividades vinculadas a la oferta</div>
                  <button className="ab-btn blue">+ Registrar actividad</button>
                </div>
                <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                    <thead>
                      <tr>{['','ID','Tipo','Descripción','Fecha','Responsable','Estado'].map(h => (
                        <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', background:'var(--gray-lt)', borderBottom:'1px solid var(--border)', textTransform:'uppercase' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {SEG_ACTS.map(a => (
                        <tr key={a.id} style={{ borderBottom:'1px solid var(--border)', cursor:'pointer' }} onClick={() => navigate('ficha-actividad')}>
                          <td style={{ padding:'7px 10px', width:30 }}>
                            <div style={{ width:26, height:26, borderRadius:'50%', background:a.bg, color:a.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700 }}>{a.initials}</div>
                          </td>
                          <td style={{ padding:'7px 12px' }}><span className="asset-link" style={{ fontFamily:'var(--mono)', fontSize:10 }}>{a.id}</span></td>
                          <td style={{ padding:'7px 12px' }}><span className={`tag ${TIPO_TAG[a.tipo]||'tag-gray'}`}>{TIPO_ICO[a.tipo]} {a.tipo}</span></td>
                          <td style={{ padding:'7px 12px', fontWeight:500, maxWidth:320 }}>{a.asunto}</td>
                          <td style={{ padding:'7px 12px', color:'var(--text3)', whiteSpace:'nowrap' }}>{a.fecha}</td>
                          <td style={{ padding:'7px 12px', fontSize:10, color:'var(--text3)' }}>{a.user}</td>
                          <td style={{ padding:'7px 12px' }}><span className={`tag ${ACT_EST[a.estado]||'tag-gray'}`}>{a.estado}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
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
            <div className="tab-content active" style={{ overflowY:'auto', flex:1 }}>
              <div className="info-pad">
                <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', border:`1px solid ${confidential?'#334155':'var(--border)'}`, borderRadius:'var(--r2)', background:confidential?'#0f172a':'var(--surface)', marginBottom:18, transition:'all .2s' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:confidential?'#f8fafc':'var(--text)' }}>Oferta confidencial</div>
                    <div style={{ fontSize:11, color:confidential?'#94a3b8':'var(--text3)', marginTop:2 }}>
                      {confidential ? 'Activo, dirección, documentos y condiciones económicas ocultos para usuarios no autorizados.' : 'La oferta es visible para todos los usuarios con acceso al PDB.'}
                    </div>
                  </div>
                  <button onClick={() => setConfidential(v => !v)} style={{ padding:'6px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', background:confidential?'#f8fafc':'#1e293b', color:confidential?'#0f172a':'#f8fafc', transition:'all .2s' }}>
                    {confidential ? '🔓 Desactivar' : '🔒 Activar'}
                  </button>
                </div>
                {confidential && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
                    <div style={{ border:'1px solid var(--red-bd)', background:'var(--red-lt)', borderRadius:'var(--r2)', padding:12 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--red)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>❌ Oculto (no autorizados)</div>
                      {['Activo / Inmueble','Dirección y ubicación','Condiciones económicas','Documentación adjunta','Stacking plan'].map(item => (
                        <div key={item} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text2)', marginBottom:4 }}>
                          <span style={{ color:'var(--red)', fontWeight:700 }}>✕</span> {item}
                        </div>
                      ))}
                    </div>
                    <div style={{ border:'1px solid var(--green-bd)', background:'var(--green-lt)', borderRadius:'var(--r2)', padding:12 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--green)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>✅ Visible (siempre)</div>
                      {['Cliente / Cuenta','Tipo de operación','Estado de la oferta','Equipo responsable','Información básica'].map(item => (
                        <div key={item} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text2)', marginBottom:4 }}>
                          <span style={{ color:'var(--green)', fontWeight:700 }}>✓</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em' }}>Usuarios autorizados</div>
                    <button className="ab-btn blue" onClick={() => setAddingUser(true)} style={{ fontSize:10, padding:'3px 9px' }}>+ Añadir usuario</button>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {authorizedUsers.map((u, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:u.bg, color:u.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{u.initials}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:600 }}>{u.name}</div>
                          <div style={{ fontSize:10, color:'var(--text3)' }}>{u.team} · {u.role}</div>
                        </div>
                        {u.owner
                          ? <span className="tag tag-blue">Propietario</span>
                          : <>
                              <span style={{ fontSize:10, color:'var(--text4)' }}>Acceso: {u.granted}</span>
                              <button onClick={() => setAuthorizedUsers(prev => prev.filter((_, j) => j !== i))} style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 6px', fontFamily:'inherit' }}>✕ Quitar</button>
                            </>
                        }
                      </div>
                    ))}
                  </div>
                </div>
                {addingUser && (
                  <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r2)', padding:14, marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Conceder acceso a usuario</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                        <span style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Usuario</span>
                        <select className="fsel" value={newUser} onChange={e => setNewUser(e.target.value)} style={{ minWidth:220 }}>
                          <option value="">Seleccionar usuario...</option>
                          <option>GOMEZ Ignacio · Leasing Oficinas MAD</option>
                          <option>García Marta · Capital Markets MAD</option>
                          <option>López Carmen · Valoraciones MAD</option>
                          <option>Alonso Abruña D. · Leasing MAD</option>
                          <option>Martínez Rosa · Retail MAD</option>
                        </select>
                      </div>
                      <button className="ab-btn save" onClick={() => {
                        if (!newUser) return
                        const [nameStr, teamStr] = [newUser.split('·')[0].trim(), newUser.split('·')[1]?.trim() || '']
                        const ini = nameStr.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase()
                        const today = new Date().toLocaleDateString('es-ES')
                        setAuthorizedUsers(prev => [...prev, { name:nameStr, team:teamStr, role:'Autorizado', initials:ini, bg:'#f0fdf4', color:'#166534', granted:today, owner:false }])
                        setAddingUser(false); setNewUser('')
                      }}>Conceder acceso</button>
                      <button className="ab-btn" onClick={() => { setAddingUser(false); setNewUser('') }}>Cancelar</button>
                    </div>
                  </div>
                )}
                {confidential && (
                  <div style={{ border:'1px solid var(--amber-bd)', background:'var(--amber-lt)', borderRadius:'var(--r2)', padding:14, marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--amber)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>DEMO — Vista de usuario no autorizado</div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                      <span style={{ fontSize:20 }}>🔒</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>Oferta confidencial</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>No tienes permisos para ver el detalle de esta oferta. Puedes solicitar acceso al responsable.</div>
                      </div>
                      <button className="ab-btn save" style={{ flexShrink:0 }} onClick={() => alert('✅ Solicitud enviada a Sierra Álvaro\n\nEl responsable recibirá una notificación y podrá aprobar o rechazar tu acceso.')}>Solicitar acceso</button>
                    </div>
                  </div>
                )}
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Trazabilidad de accesos</div>
                <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                  {[
                    { color:'var(--green)', msg:'Sierra Álvaro creó la oferta y quedó asignado como responsable', date:'05/04/2026 · 10:00' },
                    { color:'var(--accent)', msg:'Sierra Álvaro activó confidencialidad en esta oferta', date:'07/04/2026 · 09:00' },
                  ].map((e, i, arr) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 12px', borderBottom:i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:e.color, flexShrink:0, marginTop:4 }} />
                      <div><div style={{ fontSize:11 }}>{e.msg}</div><div style={{ fontSize:10, color:'var(--text4)' }}>{e.date}</div></div>
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
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div><div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>Ocupación activo</div><div style={{ fontSize:20, fontWeight:700 }}>75%</div></div>
              <div><div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>Otras ofertas</div><div style={{ fontSize:20, fontWeight:700 }}>2</div></div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">KPIs de la oferta</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Renta (€/m²/mes)</div><div style={{ fontSize:14, fontWeight:700 }}>12,58</div></div>
              <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Gastos (€/m²/mes)</div><div style={{ fontSize:14, fontWeight:700 }}>3,81</div></div>
              <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Renta mensual</div><div style={{ fontSize:12, fontWeight:700 }}>168.575 €</div></div>
              <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Renta anual</div><div style={{ fontSize:12, fontWeight:700 }}>2,02 M€</div></div>
              <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Sup. disponible</div><div style={{ fontSize:12, fontWeight:700, color:'var(--amber)' }}>13.486 m²</div></div>
              <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Plazas</div><div style={{ fontSize:12, fontWeight:700 }}>322</div></div>
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
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:'#fef3c7', border:'1px solid #fde68a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#92400e' }}>BB</div>
              <div><div style={{ fontSize:11, fontWeight:600, color:'var(--accent)' }}>Baena Borja</div><div style={{ fontSize:10, color:'var(--text3)' }}>FREO Investments Spain SL</div></div>
            </div>
            <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:8, fontSize:11 }}>
              <div>📞 +34 910 888 998 · 📱 629 846 923</div>
              <div style={{ color:'var(--accent)' }}>✉ b.baena@freogroup.com</div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Publicación portales</div>
            {[['🌐 Web Savills','Publicado',true],['🏠 Idealista','No publicado',false],['🏢 Mis Oficinas','No publicado',false]].map(([lbl,status,pub], i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:i < 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize:11 }}>{lbl}</span>
                <span style={{ fontSize:10, fontWeight:600, color:pub ? 'var(--green)' : 'var(--text4)' }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Oferta" refNombre="OLBUR2315645" onClose={() => setShowTarea(false)} />}
    </div>
  )
}
