import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'
import { supabase } from '../lib/supabase'

const TABS = ['of-info','of-espacios','of-condiciones','of-caract','of-docs','of-web','of-desc','of-seg','of-ficha','of-conf']
const TAB_LABELS = ['Información oferta','Espacios comerciales','Condiciones','Características','Documentos','Contenido web','Descriptivo','Seguimiento comercial','Crear ficha','🔒 Confidencialidad']

const ASSET = {
  nombre: 'Albatros — C. Anabel Segura 9-11, Alcobendas',
  usoPrincipal: 'Oficinas',
  estadoConstruccion: 'Rehabilitado (2023)',
  direccion: 'Calle de Anabel Segura 9-11, 28108 Alcobendas, Madrid',
  propietario: { sociedad:'FREO Investments Spain SL', contacto:'Baena Borja', telFijo:'+34 910 888 998', telMovil:'629 846 923', email:'b.baena@freogroup.com' },
}

// Características técnicas del activo (dato maestro — solo lectura en la oferta)
const ASSET_CARACT = [
  { id:1,  tipo:'Rehabilitación integral',   detalle:'Fachada, estructura e instalaciones',  año:2023, comentario:'Proyecto Arquitectura Aedas' },
  { id:2,  tipo:'Certificación energética',  detalle:'Calificación A',                        año:2023, comentario:'—' },
  { id:3,  tipo:'Certificación BREEAM',      detalle:'BREEAM Excellent',                      año:2024, comentario:'—' },
  { id:4,  tipo:'Altura libre',              detalle:'2,85 m planta tipo',                    año:null, comentario:'Plantas 1–4' },
  { id:5,  tipo:'Suelo técnico',             detalle:'Suelo técnico elevado 15 cm',           año:null, comentario:'—' },
  { id:6,  tipo:'Climatización',             detalle:'Fan-coil + VRF individualizado',        año:2023, comentario:'—' },
  { id:7,  tipo:'Conectividad',              detalle:'Fibra óptica redundante 10 Gbps',       año:null, comentario:'Carrier neutral' },
  { id:8,  tipo:'Control de accesos',        detalle:'Tornos biométricos + CCTV 24h',         año:2023, comentario:'—' },
  { id:9,  tipo:'Seguridad',                 detalle:'Vigilancia 24/7 + monitorización remota',año:null, comentario:'—' },
  { id:10, tipo:'Ascensores',                detalle:'6 ascensores de alta velocidad',        año:2023, comentario:'Capacidad 13 personas' },
  { id:11, tipo:'Accesibilidad PMR',         detalle:'Adaptado normativa accesibilidad',      año:2023, comentario:'—' },
  { id:12, tipo:'Parking',                   detalle:'322 plazas interiores, ratio 1:22 m²',  año:null, comentario:'Nivel S1 y S2' },
  { id:13, tipo:'Zonas comunes',             detalle:'Hall de doble altura reformado',        año:2023, comentario:'—' },
  { id:14, tipo:'Terraza',                   detalle:'Terraza privativa en planta 4',         año:2023, comentario:'290 m²' },
  { id:15, tipo:'Cafetería',                 detalle:'Restaurante / cafetería en PB',         año:null, comentario:'Concesionario externo' },
  { id:16, tipo:'Gimnasio',                  detalle:'Gimnasio equipado para usuarios',       año:2023, comentario:'—' },
  { id:17, tipo:'Zonas ajardinadas',         detalle:'Jardines perimetrales y patio interior',año:null, comentario:'3.200 m²' },
  { id:18, tipo:'Eficiencia energética',     detalle:'Paneles solares fotovoltaicos',         año:2023, comentario:'180 kWp instalados' },
]

const TIPOLOGIA_MAP = {
  'Oficinas':['Oficina tradicional','Coworking','Subarriendo','Business park','Sede única (HQ)'],
  'Logístico':['Nave logística','Nave industrial','Última milla','Plataforma logística','Cross-docking'],
  'Logístico / Industrial':['Nave logística','Nave industrial','Última milla','Plataforma logística','Cross-docking'],
  'Retail':['High Street','Local en centro comercial','Parque comercial','Local stand-alone','Flagship store','Parque de medianas'],
  'Centros comerciales':['Centro comercial dominante','Centro comercial secundario','Outlet','Participación en centro'],
  'Residencial':['Vivienda plurifamiliar','Vivienda unifamiliar','Obra nueva','Segunda mano'],
  'Living (PRS / BTR / Flex)':['Build to Rent (BTR)','Build to Sell (BTS)','Flex living','Student housing','Senior living','Coliving'],
  'Hoteles':['Hotel urbano','Hotel vacacional','Resort','Aparthotel','Hostal'],
  'Suelos':['Suelo finalista','Suelo en desarrollo','Suelo urbanizable'],
  'Alternativos':['Selección abierta'], 'Mixtos':['Selección combinada'],
  'Data Center':['Hyperscale','Colocation','Edge computing'],
}

const OFERTA_COLORS = [
  { bg:'#dcfce7', border:'#86efac', text:'#166534', dot:'#16a34a' },
  { bg:'#dbeafe', border:'#93c5fd', text:'#1e40af', dot:'#3b82f6' },
  { bg:'#fef3c7', border:'#fcd34d', text:'#92400e', dot:'#f59e0b' },
  { bg:'#f3e8ff', border:'#d8b4fe', text:'#6b21a8', dot:'#a855f7' },
]

const USERS_INIT = [{ name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', granted:'—', owner:true }]
const TIPO_TAG = { Email:'tag-blue', Llamada:'tag-green', Reunión:'tag-purple', Tarea:'tag-gray', Visita:'tag-teal', Presentación:'tag-amber' }
const TIPO_ICO = { Email:'📧', Llamada:'📞', Reunión:'🤝', Tarea:'✅', Visita:'🏢', Presentación:'📤' }
const ACT_EST  = { Abierto:'tag-amber', Finalizado:'tag-gray', 'En curso':'tag-blue', Realizada:'tag-green' }
const SEG_ACTS = [
  { id:'ACT-OF-01', tipo:'Presentación', asunto:'Presentación oferta Albatros P1–P4 enviada a Oracle Spain',  fecha:'10/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-OF-02', tipo:'Visita',       asunto:'Visita técnica Oracle Spain — Albatros Edif. D P2',          fecha:'15/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Realizada'  },
  { id:'ACT-OF-03', tipo:'Email',        asunto:'Envío condiciones económicas actualizadas a Carlos Méndez',   fecha:'20/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-OF-04', tipo:'Llamada',      asunto:'Llamada de seguimiento — confirmación interés Oracle',        fecha:'25/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-OF-05', tipo:'Reunión',      asunto:'Reunión propietario Allianz — revisión oferta y condiciones', fecha:'28/03/2026', user:'GOMEZ Ignacio', initials:'GI', bg:'#fdf4ff', color:'#7e22ce', estado:'Finalizado' },
  { id:'ACT-OF-06', tipo:'Email',        asunto:'Contraoferta recibida Oracle — análisis pendiente',           fecha:'02/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'En curso'   },
  { id:'ACT-OF-07', tipo:'Tarea',        asunto:'Preparar respuesta a contraoferta Oracle Spain SL',           fecha:'07/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Abierto'    },
]

function FieldLbl({ children, req }) {
  return <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{children}{req && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}</div>
}
function ReadonlyPill({ value }) {
  return <div style={{ padding:'6px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', fontSize:12, background:'var(--gray-lt)', color:'var(--text3)', display:'flex', alignItems:'center', gap:6 }}>{value}<span style={{ marginLeft:'auto', fontSize:9, color:'var(--text4)', fontWeight:600 }}>AUTO</span></div>
}

export default function FichaOferta() {
  const { navigate, params } = useNav()
  const [activeTab, setActiveTab] = useState('of-info')
  const [confidential, setConfidential] = useState(false)
  const [authorizedUsers, setAuthorizedUsers] = useState(USERS_INIT)
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState('')
  const [showTarea, setShowTarea] = useState(false)

  // DB state
  const [oferta, setOferta]     = useState(null)   // loaded from Supabase
  const [saving, setSaving]     = useState(false)
  const [saveOk, setSaveOk]     = useState(false)
  const [saveErr, setSaveErr]   = useState('')

  // Tab 1
  const [tipoComercializacion, setTipoComercializacion] = useState('Mandato Savills')
  const [tipologia, setTipologia] = useState('')
  const [estadoEspacio, setEstadoEspacio] = useState('')
  const [tipoOperacion, setTipoOperacion] = useState('Alquiler')
  const [origenOferta, setOrigenOferta] = useState('')
  const [modalidadVisita, setModalidadVisita] = useState('')
  const [comentarios, setComentarios] = useState('')

  // Tab 2
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

  // Tab 3 + Stacking
  const [fechaDispGlobal, setFechaDispGlobal] = useState('2026-06-01')
  const [divisibleGlobal, setDivisibleGlobal] = useState(true)
  const [supAprox, setSupAprox] = useState(false)
  const [plantaTipo, setPlantaTipo] = useState(2790)
  const [ofertasDesglose, setOfertasDesglose] = useState([
    { id:1, nombre:'Oferta 1', cuenta:'', divisible:true, cargasM2:3.01 },
  ])
  const [nextOfertaId, setNextOfertaId] = useState(2)
  const [editNombreId, setEditNombreId] = useState(null)
  const [editNombreVal, setEditNombreVal] = useState('')

  // Características (filtro comercial sobre el activo)
  const [caracteristicas, setCaracteristicas] = useState(null) // null = no importadas aún

  function importarCaracteristicas() {
    setCaracteristicas(ASSET_CARACT.map(c => ({ ...c, incluir: true })))
  }

  // Plazas de aparcamiento (dentro de Espacios comerciales)
  const [plazas, setPlazas] = useState([])
  const [nextPlazaId, setNextPlazaId] = useState(1)
  const [addingPlaza, setAddingPlaza] = useState(false)
  const [newPlaza, setNewPlaza] = useState({ intExt:'Interior', tipo:'Coches', formato:'Simple', cantidad:1, renta:'', precio:'' })

  // Espacios comercializables (mock — se actualizan desde el stacking plan del activo)
  const espaciosComercializables = [
    { edificio:'Edificio Albatros D', modulo:'D-P4', planta:'P4', uso:'Oficina', sup:2577, renta:12.50, ofertaNombre:'Oferta 1' },
    { edificio:'Edificio Albatros D', modulo:'D-P3', planta:'P3', uso:'Oficina', sup:2790, renta:12.50, ofertaNombre:'Oferta 1' },
    { edificio:'Edificio Albatros D', modulo:'D-P1', planta:'P1', uso:'Oficina', sup:2793, renta:12.50, ofertaNombre:'Oferta 1' },
  ]
  const supTotal = espaciosComercializables.reduce((s, e) => s + e.sup, 0)

  function addOferta() {
    const id = nextOfertaId
    setOfertasDesglose(prev => [...prev, { id, nombre:`Oferta ${id}`, cuenta:'', divisible:divisibleGlobal, cargasM2:3.01 }])
    setNextOfertaId(id + 1)
  }

  function getEscenarios() {
    if (!divisibleGlobal) return [{ label:'Total disponible', sup:supTotal, tipo:'unico' }]
    const base = espaciosComercializables.map(e => ({ label:`${e.planta} — ${e.edificio}`, sup:e.sup, tipo:'modulo' }))
    if (espaciosComercializables.length > 1) base.push({ label:'Total combinado', sup:supTotal, tipo:'total' })
    return base
  }

  const tipologiaOpciones = TIPOLOGIA_MAP[ASSET.usoPrincipal] || []

  // ── Load oferta from Supabase ──────────────────────────────────
  useEffect(() => {
    if (!params?.ofertaRef) return
    supabase.from('ofertas').select('*').eq('ref', params.ofertaRef).single()
      .then(({ data }) => {
        if (!data) return
        setOferta(data)
        if (data.tipo_comercializacion) setTipoComercializacion(data.tipo_comercializacion)
        if (data.tipologia)             setTipologia(data.tipologia)
        if (data.estado_espacio)        setEstadoEspacio(data.estado_espacio)
        if (data.tipo_operacion)        setTipoOperacion(data.tipo_operacion)
        if (data.origen_oferta)         setOrigenOferta(data.origen_oferta)
        if (data.modalidad_visita)      setModalidadVisita(data.modalidad_visita)
        if (data.confidencial != null)  setConfidential(data.confidencial)
        if (data.equipo)                setEquipoMembers(data.equipo)
        if (data.colaboradores)         setColaboradores(data.colaboradores)
      })
    // Load desglose
    supabase.from('desglose_ofertas').select('*').eq('oferta_id', params.ofertaRef).order('orden')
      .then(({ data }) => {
        if (data?.length > 0) {
          setOfertasDesglose(data.map(d => ({ id: d.id, nombre: d.nombre, cuenta: d.cuenta||'', divisible: d.divisible, cargasM2: d.cargas_m2||0 })))
          setNextOfertaId(data.length + 1)
        }
      })
    // Load plazas
    supabase.from('plazas_oferta').select('*').eq('oferta_id', params.ofertaRef)
      .then(({ data }) => {
        if (data?.length > 0) {
          setPlazas(data.map((p, i) => ({ id: i + 1, intExt: p.int_ext, tipo: p.tipo, formato: p.formato, cantidad: p.cantidad, renta: p.renta||'', precio: p.precio||'' })))
          setNextPlazaId(data.length + 1)
        }
      })
    // Load caracteristicas
    supabase.from('caracteristicas_oferta').select('*').eq('oferta_id', params.ofertaRef)
      .then(({ data }) => {
        if (data?.length > 0) {
          setCaracteristicas(data.map(c => ({ id: c.caracteristica_origen_id, tipo: c.tipo, detalle: c.detalle, año: c.anno, comentario: c.comentario, incluir: c.incluir })))
        }
      })
  }, [params?.ofertaRef])

  // ── Save oferta to Supabase ────────────────────────────────────
  const handleSave = async () => {
    if (!oferta?.id) return
    setSaving(true); setSaveErr(''); setSaveOk(false)
    const { error } = await supabase.from('ofertas').update({
      tipo_comercializacion: tipoComercializacion || null,
      tipologia:             tipologia            || null,
      estado_espacio:        estadoEspacio        || null,
      tipo_operacion:        tipoOperacion        || null,
      origen_oferta:         origenOferta         || null,
      modalidad_visita:      modalidadVisita      || null,
      confidencial,
      equipo:                equipoMembers,
      colaboradores,
    }).eq('id', oferta.id)
    if (error) { setSaveErr(error.message); setSaving(false); return }

    // Upsert desglose_ofertas
    if (ofertasDesglose.length > 0) {
      // Delete old + reinsert (simpler than diff)
      await supabase.from('desglose_ofertas').delete().eq('oferta_id', oferta.id)
      await supabase.from('desglose_ofertas').insert(
        ofertasDesglose.map((d, i) => ({
          oferta_id: oferta.id,
          nombre:    d.nombre,
          cuenta:    d.cuenta || null,
          divisible: d.divisible,
          cargas_m2: d.cargasM2 || 0,
          orden:     i,
        }))
      )
    }

    // Upsert plazas_oferta
    await supabase.from('plazas_oferta').delete().eq('oferta_id', oferta.id)
    if (plazas.length > 0) {
      await supabase.from('plazas_oferta').insert(
        plazas.map(p => ({
          oferta_id: oferta.id,
          int_ext:   p.intExt,
          tipo:      p.tipo,
          formato:   p.formato,
          cantidad:  p.cantidad,
          renta:     p.renta ? parseFloat(p.renta) : null,
          precio:    p.precio ? parseFloat(p.precio) : null,
        }))
      )
    }

    // Upsert caracteristicas_oferta
    if (caracteristicas) {
      await supabase.from('caracteristicas_oferta').delete().eq('oferta_id', oferta.id)
      await supabase.from('caracteristicas_oferta').insert(
        caracteristicas.map(c => ({
          oferta_id:                oferta.id,
          caracteristica_origen_id: c.id,
          tipo:                     c.tipo,
          detalle:                  c.detalle,
          anno:                     c.año || null,
          comentario:               c.comentario || null,
          incluir:                  c.incluir,
        }))
      )
    }

    setSaving(false); setSaveOk(true); setTimeout(() => setSaveOk(false), 3000)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn save" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
        <button className="ab-btn" onClick={async () => { await handleSave(); navigate('ofertas') }}>Guardar y cerrar</button>
        {saveOk  && <span style={{fontSize:11,color:'var(--green)',marginLeft:8}}>✓ Guardado</span>}
        {saveErr && <span style={{fontSize:11,color:'var(--red)',marginLeft:8}}>{saveErr}</span>}
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn">Desactivar</button>
        <div className="ab-sep" />
        <button className="ab-btn blue" onClick={() => navigate('ficha-activo', { ref: oferta?.activo_ref || 'ALC-OF-00231', tab:'at-stacking', stackingView:'arr', ofertasFromOferta: ofertasDesglose })}>
          📊 Stacking plan
        </button>
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
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#064e3b,#10b981)' }}>📋</div>
              <div style={{ flex:1 }}>
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

          <>
              <div className="tabs">
                {TABS.map((t,i) => <div key={t} className={`tab ${activeTab===t?'active':''}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[i]}</div>)}
              </div>

              {/* ── TAB 1: Información oferta ── */}
              {activeTab==='of-info' && (
                <div className="tab-content active">
                  <div className="info-pad">
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        <div>
                          <FieldLbl req>Activo / Asset</FieldLbl>
                          <div style={{ padding:'6px 9px', border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', fontSize:12, color:'var(--accent)', cursor:'pointer', background:'var(--accent-lt)', display:'flex', alignItems:'center', gap:6 }} onClick={() => navigate('ficha-activo')}>
                            <span>🏢</span><span style={{ flex:1, fontWeight:500 }}>Albatros — C. Anabel Segura 9-11, Alcobendas</span><span style={{ fontSize:9, fontWeight:700 }}>↗</span>
                          </div>
                        </div>
                        <div><FieldLbl>Uso principal</FieldLbl><ReadonlyPill value={ASSET.usoPrincipal} /></div>
                        <div><FieldLbl>Estado de construcción</FieldLbl><ReadonlyPill value={ASSET.estadoConstruccion} /></div>
                        <div>
                          <FieldLbl req>Tipología de comercialización</FieldLbl>
                          <select className="of-sel" value={tipoComercializacion} onChange={e => setTipoComercializacion(e.target.value)}>
                            <option>Mandato Savills</option><option>Sin mandato</option><option>Otras consultoras</option>
                          </select>
                        </div>
                        <div>
                          <FieldLbl req>Tipología</FieldLbl>
                          <select className="of-sel" value={tipologia} onChange={e => setTipologia(e.target.value)}>
                            <option value="">— Seleccionar —</option>
                            {tipologiaOpciones.map(t => <option key={t}>{t}</option>)}
                          </select>
                          {tipologiaOpciones.length > 0 && <div style={{ fontSize:9, color:'var(--text4)', marginTop:2 }}>Opciones para <strong>{ASSET.usoPrincipal}</strong></div>}
                        </div>
                        <div>
                          <FieldLbl>Estado del espacio</FieldLbl>
                          <select className="of-sel" value={estadoEspacio} onChange={e => setEstadoEspacio(e.target.value)}>
                            <option value="">— Seleccionar —</option>
                            {['Nuevo','Obra nueva','Muy buen estado','En bruto','Segunda mano','Implantado','Plug&Play','Por reformar','Amueblado','Sin amueblar'].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <FieldLbl req>Tipo de operación</FieldLbl>
                          <select className="of-sel" value={tipoOperacion} onChange={e => setTipoOperacion(e.target.value)}>
                            <option>Alquiler</option><option>Venta</option><option>Alquiler / Venta</option>
                          </select>
                        </div>
                        <div>
                          <FieldLbl>Origen de la oferta</FieldLbl>
                          <select className="of-sel" value={origenOferta} onChange={e => setOrigenOferta(e.target.value)}>
                            <option value="">— Seleccionar —</option>
                            {['Demanda entrante','Prospección directa','Referencia interna','Portal web','Red de colaboradores','Otra consultora'].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                        <div><FieldLbl>Mandato asociado</FieldLbl><input className="of-inp" placeholder="🔍  Buscar mandato..." /></div>
                        <div><FieldLbl>KYC</FieldLbl><input className="of-inp" placeholder="🔍  Buscar registro KYC..." /></div>
                        <div>
                          <FieldLbl>Modalidad de visita</FieldLbl>
                          <select className="of-sel" value={modalidadVisita} onChange={e => setModalidadVisita(e.target.value)}>
                            <option value="">— Seleccionar —</option><option>Presencial</option><option>Virtual</option><option>Presencial + Virtual</option>
                          </select>
                        </div>
                        <div><FieldLbl>Comentarios</FieldLbl><textarea className="of-textarea" placeholder="Observaciones internas..." value={comentarios} onChange={e => setComentarios(e.target.value)} style={{ minHeight:72 }} /></div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        <div>
                          <FieldLbl>Ubicación · Georreferenciado desde activo</FieldLbl>
                          <div style={{ borderRadius:'var(--r2)', overflow:'hidden', border:'1px solid var(--border)', height:280 }}>
                            <iframe title="Mapa oferta" width="100%" height="100%" style={{ border:0 }} loading="lazy"
                              src="https://maps.google.com/maps?q=Calle+de+Anabel+Segura+9-11,+Alcobendas,+Madrid&z=15&output=embed" />
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
                        <div><FieldLbl>Imágenes · Vinculadas al activo</FieldLbl><div className="img-strip"><div className="img-thumb principal">🏢</div><div className="img-thumb">🏙</div><div className="img-thumb">🖼</div></div></div>
                      </div>
                    </div>
                    {/* ── Datos de contacto ── */}
                    <div style={{ marginTop:18, borderTop:'1px solid var(--border)', paddingTop:14 }}>
                      <div style={{ fontSize:11, fontWeight:700, marginBottom:10, color:'var(--text2)' }}>Datos de contacto</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                        <div className="info-block">
                          <div className="ib-title">🏠 PROPIETARIO</div>
                          <div style={{ fontSize:9, color:'var(--text4)', marginBottom:8, fontWeight:600, letterSpacing:'.04em' }}>Sincronizado desde el activo</div>
                          <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{ASSET.propietario.sociedad}</div>
                          <div style={{ fontSize:11, color:'var(--accent)', fontWeight:500, marginBottom:8 }}>{ASSET.propietario.contacto}</div>
                          <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:10, fontSize:11, display:'flex', flexDirection:'column', gap:4 }}>
                            <div>📞 {ASSET.propietario.telFijo}</div>
                            <div>📱 {ASSET.propietario.telMovil}</div>
                            <div style={{ color:'var(--accent)' }}>✉ {ASSET.propietario.email}</div>
                          </div>
                          <div style={{ marginTop:8 }}><span style={{ fontSize:9, background:'var(--green-lt)', color:'var(--green)', border:'1px solid var(--green-bd)', padding:'2px 7px', borderRadius:10, fontWeight:700 }}>ↈ Sincronizado</span></div>
                        </div>
                        <div className="info-block">
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                            <div className="ib-title" style={{ marginBottom:0 }}>🤝 COLABORADORES</div>
                            {tipoComercializacion==='Otras consultoras' && <button className="ab-btn blue" style={{ fontSize:10, padding:'2px 8px' }} onClick={() => setAddingColab(true)}>+ Añadir</button>}
                          </div>
                          {tipoComercializacion!=='Otras consultoras'
                            ? <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Selecciona "Otras consultoras" para activar.</div>
                            : colaboradores.length===0 && !addingColab
                              ? <button className="ab-btn" style={{ fontSize:10 }} onClick={() => setAddingColab(true)}>+ Añadir consultora</button>
                              : null
                          }
                          {colaboradores.map((c,i) => (
                            <div key={i} style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', padding:10, marginBottom:8, fontSize:11 }}>
                              <div style={{ fontWeight:600 }}>{c.empresa}</div>
                              {c.contacto && <div style={{ color:'var(--accent)' }}>{c.contacto}</div>}
                              <button onClick={() => setColaboradores(prev => prev.filter((_,j)=>j!==i))} style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'4px 0', fontFamily:'inherit' }}>✕ Quitar</button>
                            </div>
                          ))}
                          {addingColab && (
                            <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r)', padding:12 }}>
                              <div style={{ marginBottom:7 }}><FieldLbl>Empresa</FieldLbl>
                                <select className="fsel" style={{ width:'100%' }} value={newColabEmpresa} onChange={e => setNewColabEmpresa(e.target.value)}>
                                  <option value="">Buscar...</option>
                                  {['CBRE','JLL','Cushman & Wakefield','Colliers','Knight Frank','BNP Paribas RE'].map(e => <option key={e}>{e}</option>)}
                                </select>
                              </div>
                              <div style={{ marginBottom:10 }}><FieldLbl>Contacto</FieldLbl><input className="of-inp" placeholder="Buscar..." value={newColabContacto} onChange={e => setNewColabContacto(e.target.value)} /></div>
                              <div style={{ display:'flex', gap:6 }}>
                                <button className="ab-btn save" onClick={() => { if(!newColabEmpresa)return; setColaboradores(prev=>[...prev,{empresa:newColabEmpresa,contacto:newColabContacto}]); setAddingColab(false); setNewColabEmpresa(''); setNewColabContacto('') }}>Añadir</button>
                                <button className="ab-btn" onClick={() => { setAddingColab(false); setNewColabEmpresa(''); setNewColabContacto('') }}>Cancelar</button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="info-block">
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                            <div className="ib-title" style={{ marginBottom:0 }}>👥 EQUIPO SAVILLS</div>
                            <div style={{ display:'flex', gap:5 }}>
                              <button className="ab-btn" style={{ fontSize:9, padding:'2px 7px' }} onClick={() => setAddingMiembro(true)}>+ Miembro</button>
                              <button className="ab-btn" style={{ fontSize:9, padding:'2px 7px' }}>+ Equipo</button>
                            </div>
                          </div>
                          <div style={{ fontSize:9, color:'var(--amber)', background:'var(--amber-lt)', border:'1px solid var(--amber-bd)', borderRadius:4, padding:'4px 8px', marginBottom:10, fontWeight:600 }}>Solo editable por creador o manager</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            {equipoMembers.map((m,i) => (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                                <div style={{ width:28, height:28, borderRadius:'50%', background:m.bg, color:m.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>{m.initials}</div>
                                <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:600 }}>{m.name}</div><div style={{ fontSize:10, color:'var(--text3)' }}>{m.team}</div></div>
                                {m.owner ? <span className="tag tag-blue" style={{ fontSize:9 }}>Responsable</span>
                                  : <button onClick={() => setEquipoMembers(prev=>prev.filter((_,j)=>j!==i))} style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', fontFamily:'inherit' }}>✕</button>}
                              </div>
                            ))}
                          </div>
                          {addingMiembro && (
                            <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r)', padding:10, marginTop:8 }}>
                              <FieldLbl>Usuario</FieldLbl>
                              <select className="fsel" style={{ width:'100%', marginBottom:8 }} value={newMiembro} onChange={e => setNewMiembro(e.target.value)}>
                                <option value="">Seleccionar...</option>
                                {['GOMEZ Ignacio · Leasing Oficinas MAD','García Marta · Capital Markets MAD','López Carmen · Valoraciones MAD','Martínez Rosa · Retail MAD'].map(u => <option key={u}>{u}</option>)}
                              </select>
                              <div style={{ display:'flex', gap:6 }}>
                                <button className="ab-btn save" style={{ fontSize:10 }} onClick={() => {
                                  if(!newMiembro)return
                                  const [nameStr,teamStr]=[newMiembro.split('·')[0].trim(),newMiembro.split('·')[1]?.trim()||'']
                                  const ini=nameStr.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                                  setEquipoMembers(prev=>[...prev,{name:nameStr,team:teamStr,role:'Colaborador',initials:ini,bg:'#f0fdf4',color:'#166534',owner:false}])
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
                </div>
              )}

              {/* ── TAB 2: Espacios comerciales ── */}
              {activeTab==='of-espacios' && (
                <div className="tab-content active">
                  <div className="info-pad">
                    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16 }}>
                      {/* Config izquierda */}
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        <div style={{ fontSize:11, fontWeight:700, marginBottom:2 }}>Configuración general</div>
                        <div><FieldLbl>Fecha disponibilidad</FieldLbl><input type="date" className="of-inp" value={fechaDispGlobal} onChange={e => setFechaDispGlobal(e.target.value)} /></div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                          <div><div style={{ fontSize:11, fontWeight:600 }}>¿Divisible?</div><div style={{ fontSize:9, color:'var(--text4)' }}>Aplica a toda la oferta</div></div>
                          <button onClick={() => setDivisibleGlobal(v=>!v)} style={{ padding:'4px 12px', borderRadius:12, border:'none', fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit', background:divisibleGlobal?'#dcfce7':'#fef2f2', color:divisibleGlobal?'#166534':'#991b1b' }}>
                            {divisibleGlobal ? 'Sí' : 'No'}
                          </button>
                        </div>
                        <div>
                          <FieldLbl>Superficie total disponible (m²)</FieldLbl>
                          <div style={{ padding:'6px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', fontSize:14, fontWeight:700, background:'var(--gray-lt)', display:'flex', alignItems:'center', gap:6 }}>
                            <span>{supTotal.toLocaleString()}</span><span style={{ marginLeft:'auto', fontSize:9, color:'var(--text4)', fontWeight:600 }}>AUTO</span>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <input type="checkbox" id="supAprox" checked={supAprox} onChange={e => setSupAprox(e.target.checked)} style={{ accentColor:'var(--accent)' }} />
                          <label htmlFor="supAprox" style={{ fontSize:11, cursor:'pointer' }}>Superficie aproximada</label>
                        </div>
                        <div><FieldLbl>Planta tipo (m²)</FieldLbl><input type="number" className="of-inp" value={plantaTipo} onChange={e => setPlantaTipo(e.target.value)} /></div>
                        <div style={{ padding:'10px 12px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', fontSize:10 }}>
                          <div style={{ fontWeight:700, color:'var(--accent)', marginBottom:4 }}>Escenarios comerciales</div>
                          {getEscenarios().map((sc,i) => (
                            <div key={i} style={{ display:'flex', justifyContent:'space-between', color:'var(--text2)', marginBottom:2 }}>
                              <span>{sc.label}</span><span style={{ fontFamily:'var(--mono)', fontWeight:600 }}>{sc.sup.toLocaleString()} m²</span>
                            </div>
                          ))}
                        </div>
                        <button className="ab-btn blue" style={{ fontSize:10 }} onClick={() => navigate('ficha-activo', { ref:'ALC-OF-00231', tab:'at-stacking', stackingView:'arr', ofertasFromOferta: ofertasDesglose })}>📊 Abrir Stacking Plan →</button>
                      </div>

                      {/* Derecha */}
                      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        {/* Desglose de ofertas */}
                        <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--gray-lt)' }}>
                            <div style={{ fontSize:11, fontWeight:700 }}>Desglose de ofertas</div>
                            <button className="ab-btn blue" style={{ fontSize:10, padding:'3px 10px' }} onClick={addOferta}>+ Agregar</button>
                          </div>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                            <thead><tr>
                              {['Nombre área','Cuenta','Sup. total','¿Divisible?','Cargas €/m²','Fecha disp.','Plantas asignadas',''].map(h =>
                                <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                              )}
                            </tr></thead>
                            <tbody>
                              {ofertasDesglose.map((o,idx) => {
                                const col = OFERTA_COLORS[idx % OFERTA_COLORS.length]
                                const assignedSpaces = espaciosComercializables.filter(e => e.ofertaNombre === o.nombre)
                                const assignedSup = assignedSpaces.reduce((s,e) => s + e.sup, 0)
                                return (
                                  <tr key={o.id} style={{ borderBottom:'1px solid var(--border)' }}>
                                    <td style={{ padding:'7px 12px' }}>
                                      {editNombreId===o.id
                                        ? <input autoFocus value={editNombreVal} onChange={e => setEditNombreVal(e.target.value)}
                                            onBlur={() => { setOfertasDesglose(prev=>prev.map(x=>x.id===o.id?{...x,nombre:editNombreVal||x.nombre}:x)); setEditNombreId(null) }}
                                            onKeyDown={e => { if(e.key==='Enter'){setOfertasDesglose(prev=>prev.map(x=>x.id===o.id?{...x,nombre:editNombreVal||x.nombre}:x));setEditNombreId(null)} }}
                                            style={{ fontSize:11, border:'1px solid var(--accent)', borderRadius:3, padding:'2px 6px', fontFamily:'inherit', width:120 }} />
                                        : <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                            <div style={{ width:8, height:8, borderRadius:'50%', background:col.dot, flexShrink:0 }} />
                                            <span className="pat-link" onClick={() => { setEditNombreId(o.id); setEditNombreVal(o.nombre) }}>{o.nombre}</span>
                                          </div>
                                      }
                                    </td>
                                    <td style={{ padding:'7px 12px' }}>
                                      <input className="of-inp" placeholder="Empresa / cuenta..." value={o.cuenta||''} onChange={e => setOfertasDesglose(prev=>prev.map(x=>x.id===o.id?{...x,cuenta:e.target.value}:x))} style={{ minWidth:130, fontSize:10 }} />
                                    </td>
                                    <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{assignedSup>0?assignedSup.toLocaleString():<span style={{ color:'var(--text4)' }}>—</span>}</td>
                                    <td style={{ padding:'7px 12px' }}><span style={{ fontSize:10, fontWeight:600, color:o.divisible?'var(--green)':'var(--red)' }}>{o.divisible?'Sí':'No'}</span></td>
                                    <td style={{ padding:'7px 12px', color:'var(--text3)' }}>{o.cargasM2} €</td>
                                    <td style={{ padding:'7px 12px', color:'var(--text3)', whiteSpace:'nowrap' }}>{fechaDispGlobal?new Date(fechaDispGlobal).toLocaleDateString('es-ES'):'—'}</td>
                                    <td style={{ padding:'7px 12px' }}>
                                      {assignedSpaces.length>0
                                        ? <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                                            {assignedSpaces.map(e=><span key={e.modulo} style={{ fontSize:9, background:col.bg, color:col.text, border:`1px solid ${col.border}`, borderRadius:8, padding:'1px 6px', fontWeight:600 }}>{e.planta}</span>)}
                                          </div>
                                        : <span style={{ fontSize:10, color:'var(--text4)', fontStyle:'italic' }}>Sin asignar</span>
                                      }
                                    </td>
                                    <td style={{ padding:'7px 12px' }}>
                                      <div style={{ display:'flex', gap:4 }}>
                                        <button className="ra p" onClick={() => { setEditNombreId(o.id); setEditNombreVal(o.nombre) }}>✎</button>
                                        <button className="ra" onClick={() => setOfertasDesglose(prev=>prev.filter(x=>x.id!==o.id))} style={{ color:'var(--red)' }}>✕</button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                              {ofertasDesglose.length===0 && <tr><td colSpan={8} style={{ padding:18, textAlign:'center', color:'var(--text4)', fontSize:11, fontStyle:'italic' }}>Sin ofertas. Pulsa "+ Agregar".</td></tr>}
                            </tbody>
                          </table>
                          <div style={{ padding:'7px 14px', background:'var(--accent-lt)', borderTop:'1px solid var(--accent-bd)', fontSize:10, color:'var(--accent)' }}>
                            ↈ Al guardar, las ofertas se sincronizan automáticamente con el Stacking Plan.
                          </div>
                        </div>

                        {/* Espacios comercializables */}
                        <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--gray-lt)' }}>
                            <div><span style={{ fontSize:11, fontWeight:700 }}>Espacios comercializables</span><span style={{ marginLeft:8, fontSize:9, color:'var(--text4)' }}>Proyección automática del Stacking Plan</span></div>
                            <span className="tag tag-green" style={{ fontSize:9 }}>ↈ Auto-calculado</span>
                          </div>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                            <thead><tr>
                              {['Edificio','Módulo','Planta','Uso','Superficie','Divisible','Renta €/m²/mes','Renta mensual'].map(h =>
                                <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                              )}
                            </tr></thead>
                            <tbody>
                              {espaciosComercializables.map((e,i) => (
                                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                                  <td style={{ padding:'7px 12px', fontSize:10, color:'var(--text2)' }}>{e.edificio}</td>
                                  <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontSize:10 }}>{e.modulo}</td>
                                  <td style={{ padding:'7px 12px' }}><span className="tag tag-gray" style={{ fontSize:9 }}>{e.planta}</span></td>
                                  <td style={{ padding:'7px 12px' }}><span className="tag tag-blue" style={{ fontSize:9 }}>{e.uso}</span></td>
                                  <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{e.sup.toLocaleString()}</td>
                                  <td style={{ padding:'7px 12px' }}><span style={{ fontSize:10, fontWeight:600, color:divisibleGlobal?'var(--green)':'var(--red)' }}>{divisibleGlobal?'Sí':'No'}</span></td>
                                  <td style={{ padding:'7px 12px', fontFamily:'var(--mono)' }}>{e.renta.toFixed(2)} €</td>
                                  <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600, color:'var(--green)' }}>{(e.renta*e.sup).toLocaleString(undefined,{maximumFractionDigits:0})} €</td>
                                </tr>
                              ))}
                              <tr style={{ background:'var(--gray-lt)', borderTop:'2px solid var(--border)' }}>
                                <td colSpan={4} style={{ padding:'7px 12px', fontSize:10, fontWeight:700, color:'var(--text3)' }}>TOTAL</td>
                                <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:800 }}>{supTotal.toLocaleString()}</td>
                                <td /><td />
                                <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:800, color:'var(--green)' }}>{espaciosComercializables.reduce((s,e)=>s+e.renta*e.sup,0).toLocaleString(undefined,{maximumFractionDigits:0})} €</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    {/* ── Plazas de aparcamiento ── */}
                    <div style={{ marginTop:16 }}>
                      <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--gray-lt)' }}>
                          <div>
                            <span style={{ fontSize:11, fontWeight:700 }}>Plazas de aparcamiento</span>
                            <span style={{ marginLeft:8, fontSize:9, color:'var(--text4)' }}>Solo las plazas de esta operación</span>
                          </div>
                          <button className="ab-btn blue" style={{ fontSize:10, padding:'3px 10px' }} onClick={() => setAddingPlaza(true)}>+ Añadir</button>
                        </div>
                        {addingPlaza && (
                          <div style={{ padding:'12px 14px', background:'var(--accent-lt)', borderBottom:'1px solid var(--accent-bd)', display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end' }}>
                            <div><FieldLbl>Int / Ext</FieldLbl>
                              <select className="fsel" style={{ width:100 }} value={newPlaza.intExt} onChange={e=>setNewPlaza(p=>({...p,intExt:e.target.value}))}>
                                <option>Interior</option><option>Exterior</option>
                              </select>
                            </div>
                            <div><FieldLbl>Tipología</FieldLbl>
                              <select className="fsel" style={{ width:110 }} value={newPlaza.tipo} onChange={e=>setNewPlaza(p=>({...p,tipo:e.target.value}))}>
                                <option>Coches</option><option>Motos</option><option>Bicicletas</option><option>Mixto</option>
                              </select>
                            </div>
                            <div><FieldLbl>Formato</FieldLbl>
                              <select className="fsel" style={{ width:90 }} value={newPlaza.formato} onChange={e=>setNewPlaza(p=>({...p,formato:e.target.value}))}>
                                <option>Simple</option><option>Doble</option>
                              </select>
                            </div>
                            <div><FieldLbl>Cantidad</FieldLbl>
                              <input type="number" className="of-inp" style={{ width:70 }} value={newPlaza.cantidad} onChange={e=>setNewPlaza(p=>({...p,cantidad:Number(e.target.value)}))} min={1} />
                            </div>
                            {tipoOperacion!=='Venta' && (
                              <div><FieldLbl>Renta €/plaza/mes</FieldLbl>
                                <input type="number" step="0.01" className="of-inp" style={{ width:100 }} value={newPlaza.renta} onChange={e=>setNewPlaza(p=>({...p,renta:e.target.value}))} placeholder="0,00" />
                              </div>
                            )}
                            {tipoOperacion!=='Alquiler' && (
                              <div><FieldLbl>Precio €/plaza</FieldLbl>
                                <input type="number" step="0.01" className="of-inp" style={{ width:100 }} value={newPlaza.precio} onChange={e=>setNewPlaza(p=>({...p,precio:e.target.value}))} placeholder="0,00" />
                              </div>
                            )}
                            <div style={{ display:'flex', gap:6 }}>
                              <button className="ab-btn save" onClick={() => {
                                const id=nextPlazaId
                                setPlazas(prev=>[...prev,{...newPlaza,id,renta:newPlaza.renta?Number(newPlaza.renta):null,precio:newPlaza.precio?Number(newPlaza.precio):null}])
                                setNextPlazaId(id+1)
                                setAddingPlaza(false)
                                setNewPlaza({intExt:'Interior',tipo:'Coches',formato:'Simple',cantidad:1,renta:'',precio:''})
                              }}>Añadir</button>
                              <button className="ab-btn" onClick={() => setAddingPlaza(false)}>Cancelar</button>
                            </div>
                          </div>
                        )}
                        {plazas.length===0 && !addingPlaza
                          ? <div style={{ padding:'14px 16px', fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin plazas añadidas. Añade solo las plazas que forman parte de esta operación.</div>
                          : (
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                              <thead><tr>
                                {['Int/Ext','Tipología','Formato','Cantidad',
                                  ...(tipoOperacion!=='Venta'?['Renta €/plaza/mes','Total/mes']:[]),
                                  ...(tipoOperacion!=='Alquiler'?['Precio €/plaza','Total']:[]),
                                  ''].map(h=><th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>)}
                              </tr></thead>
                              <tbody>
                                {plazas.map(p=>(
                                  <tr key={p.id} style={{ borderBottom:'1px solid var(--border)' }}>
                                    <td style={{ padding:'7px 12px' }}><span className="tag tag-gray" style={{ fontSize:9 }}>{p.intExt}</span></td>
                                    <td style={{ padding:'7px 12px' }}>{p.tipo}</td>
                                    <td style={{ padding:'7px 12px' }}>{p.formato}</td>
                                    <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{p.cantidad}</td>
                                    {tipoOperacion!=='Venta' && <>
                                      <td style={{ padding:'7px 12px', fontFamily:'var(--mono)' }}>{p.renta!=null?`${p.renta.toFixed(2)} €`:'—'}</td>
                                      <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600, color:'var(--green)' }}>{p.renta!=null?`${(p.renta*p.cantidad).toLocaleString(undefined,{maximumFractionDigits:0})} €`:'—'}</td>
                                    </>}
                                    {tipoOperacion!=='Alquiler' && <>
                                      <td style={{ padding:'7px 12px', fontFamily:'var(--mono)' }}>{p.precio!=null?`${p.precio.toFixed(2)} €`:'—'}</td>
                                      <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600, color:'var(--accent)' }}>{p.precio!=null?`${(p.precio*p.cantidad).toLocaleString(undefined,{maximumFractionDigits:0})} €`:'—'}</td>
                                    </>}
                                    <td style={{ padding:'7px 12px' }}><button className="ra" onClick={()=>setPlazas(prev=>prev.filter(x=>x.id!==p.id))} style={{ color:'var(--red)' }}>✕</button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Condiciones */}
              {activeTab==='of-condiciones' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Condiciones <span className="tag tag-green" style={{ fontSize:9, marginLeft:6 }}>+ Sincronizado</span></div>
                  <div className="cond-grid">
                    <div className="cond-block"><div className="cond-block-title">CONDICIONES CONTRACTUALES</div>
                      <div className="cond-row"><span className="cond-key">Tipo arrendamiento</span><span className="cond-val">Alquiler comercial</span></div>
                      <div className="cond-row"><span className="cond-key">Régimen fiscal</span><span className="cond-val">I.V.A.</span></div>
                      <div className="cond-row"><span className="cond-key">Fianza legal</span><span className="cond-val">2 meses sin IVA</span></div>
                      <div className="cond-row"><span className="cond-key">Indexación anual</span><span className="cond-val">Sí</span></div>
                      <div className="cond-row"><span className="cond-key">Pago honorarios</span><span className="cond-val">A la firma</span></div>
                    </div>
                    <div className="cond-block"><div className="cond-block-title">CONDICIONES ECONÓMICAS</div>
                      <div className="cond-row"><span className="cond-key">Renta (€/m²/mes)</span><span className="cond-val" style={{ fontSize:15, color:'var(--green)' }}>12,50 €</span></div>
                      <div className="cond-row"><span className="cond-key">Renta mensual</span><span className="cond-val" style={{ color:'var(--green)' }}>168.575 €</span></div>
                      <div className="cond-row"><span className="cond-key">Gastos comunes</span><span className="cond-val">3,01 €/m²/mes</span></div>
                    </div>
                    <div className="cond-block"><div className="cond-block-title">INCENTIVOS Y CAPEX</div>
                      <div className="cond-row"><span className="cond-key">Meses de carencia</span><span className="cond-val">—</span></div>
                      <div className="cond-row"><span className="cond-key">Aportación obras</span><span className="cond-val">—</span></div>
                      <div className="cond-row"><span className="cond-key">Estado oferta</span><span className="cond-val" style={{ color:'var(--green)' }}>Disponible</span></div>
                    </div>
                  </div>
                </div></div>
              )}

              {/* Características */}
              {activeTab==='of-caract' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>Características · Filtro comercial</div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Selecciona qué características del activo aparecerán en la ficha comercial y exportaciones</div>
                    </div>
                    <button className="ab-btn blue" style={{ padding:'4px 12px', fontSize:10 }} onClick={importarCaracteristicas}>
                      {caracteristicas ? '↩ Re-importar del activo' : '↩ Recuperar del activo'}
                    </button>
                  </div>

                  {!caracteristicas ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', border:'2px dashed var(--border)', borderRadius:'var(--r2)', gap:12 }}>
                      <div style={{ fontSize:32 }}>📋</div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>Sin características importadas</div>
                      <div style={{ fontSize:11, color:'var(--text3)', textAlign:'center', maxWidth:380, lineHeight:1.6 }}>
                        Pulsa <strong>Recuperar del activo</strong> para importar todas las características técnicas de <em>{ASSET.nombre}</em>. Después podrás elegir cuáles mostrar en la ficha comercial.
                      </div>
                      <button className="ab-btn blue" style={{ marginTop:4 }} onClick={importarCaracteristicas}>↩ Recuperar del activo</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--green-lt)', border:'1px solid var(--green-bd)', borderRadius:'var(--r)', marginBottom:12, fontSize:11 }}>
                        <span style={{ color:'var(--green)', fontWeight:700 }}>ↈ Importado</span>
                        <span style={{ color:'var(--text2)' }}>
                          <strong style={{ color:'var(--green)' }}>{caracteristicas.filter(c=>c.incluir).length}</strong> de {caracteristicas.length} características incluidas en la ficha comercial
                        </span>
                        <span style={{ marginLeft:'auto', fontSize:9, color:'var(--text4)' }}>Solo afecta a la oferta — el activo no se modifica</span>
                      </div>

                      <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                          <thead><tr>
                            {['Incluir','Tipo','Detalle','Año','Comentario'].map(h =>
                              <th key={h} style={{ padding:'7px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:h==='Incluir'?'center':'left', background:'var(--gray-lt)', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                            )}
                          </tr></thead>
                          <tbody>
                            {caracteristicas.map((c, i) => (
                              <tr key={c.id} style={{ borderBottom:'1px solid var(--border)', background:c.incluir?'var(--surface)':'var(--gray-lt)', opacity:c.incluir?1:.55, transition:'opacity .15s,background .15s' }}>
                                <td style={{ padding:'8px 12px', textAlign:'center', width:60 }}>
                                  <input type="checkbox" checked={c.incluir} onChange={() => setCaracteristicas(prev => prev.map((x,j) => j===i ? {...x, incluir:!x.incluir} : x))}
                                    style={{ accentColor:'var(--accent)', width:15, height:15, cursor:'pointer' }} />
                                </td>
                                <td style={{ padding:'8px 12px', fontWeight:c.incluir?600:400 }}>{c.tipo}</td>
                                <td style={{ padding:'8px 12px', color:'var(--text2)' }}>{c.detalle}</td>
                                <td style={{ padding:'8px 12px', fontFamily:'var(--mono)', color:'var(--text3)' }}>{c.año ?? '—'}</td>
                                <td style={{ padding:'8px 12px', color:'var(--text4)' }}>{c.comentario}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ padding:'8px 14px', background:'var(--gray-lt)', borderTop:'1px solid var(--border)', display:'flex', gap:10 }}>
                          <button className="ab-btn" style={{ fontSize:10 }} onClick={() => setCaracteristicas(prev=>prev.map(c=>({...c,incluir:true})))}>✓ Incluir todas</button>
                          <button className="ab-btn" style={{ fontSize:10 }} onClick={() => setCaracteristicas(prev=>prev.map(c=>({...c,incluir:false})))}>✗ Excluir todas</button>
                          <span style={{ marginLeft:'auto', fontSize:10, color:'var(--text4)', alignSelf:'center' }}>
                            Las excluidas aparecen en gris y no se exportarán
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div></div>
              )}

              {/* Documentos */}
              {activeTab==='of-docs' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div style={{ fontSize:14, fontWeight:600 }}>Documentos</div><button className="ab-btn blue">↑ Cargar</button>
                  </div>
                  <table className="doc-table"><thead><tr><th>Documento</th><th>Tipo</th><th>Fecha</th></tr></thead>
                  <tbody>
                    <tr><td><span className="doc-link">📊 Dossier Albatros</span></td><td><span className="tag tag-blue">Comercial</span></td><td>05/11/2024</td></tr>
                    <tr><td><span className="doc-link">📋 Ficha técnica Edif. D</span></td><td><span className="tag tag-teal">Técnica</span></td><td>05/11/2024</td></tr>
                  </tbody></table>
                </div></div>
              )}

              {/* Contenido web */}
              {activeTab==='of-web' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <div className="of-field" style={{ marginBottom:10 }}><div className="of-lbl">Título (Web/Flyer)</div><input className="of-inp" defaultValue="Complejo de edificios exclusivos en Arroyo de la Vega" /></div>
                      <div className="of-field"><div className="of-lbl">Texto descriptivo</div><textarea className="of-textarea" defaultValue="Situados en un entorno profesional de alto nivel, en Arroyo de la Vega, los edificios C y D Albatros ofrecen unas instalaciones únicas reformadas de forma integral." /></div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>PORTALES WEB</div>
                      <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                        {[['🌐 Web Savills',true],['🏠 Idealista',false],['🏢 Mis Oficinas',false]].map(([lbl,checked],i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom:i<2?'1px solid var(--border)':'none' }}>
                            <span style={{ fontSize:12 }}>{lbl}</span><input type="checkbox" defaultChecked={checked} style={{ accentColor:'var(--accent)' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div></div>
              )}

              {/* Descriptivo */}
              {activeTab==='of-desc' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div className="info-block"><div className="ib-title">OPCIONES DE VISUALIZACIÓN</div>
                      <div className="of-field" style={{ marginBottom:10 }}><div className="of-lbl">Geolocalizar dirección</div><select className="of-sel"><option>Sí</option><option>No</option></select></div>
                      <div className="of-field"><div className="of-lbl">Mostrar datos consultor</div><select className="of-sel"><option>No</option><option>Sí</option></select></div>
                    </div>
                    <div className="info-block"><div className="ib-title">CARACTERÍSTICAS A RESALTAR</div>
                      <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:10, fontSize:11, lineHeight:1.8 }}>
                        <div>• Gimnasio equipado</div><div>• Parking interior</div><div>• Zonas ajardinadas</div><div>• Terraza privativa en 4ª planta</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop:16 }}>
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>HISTÓRICO DE DESCRIPTIVOS</div>
                    <table className="pat-table"><thead><tr><th>Enlace</th><th>Fecha</th><th>Autor</th></tr></thead>
                    <tbody>
                      <tr><td><span className="pat-link">https://savills.com/flyer/#/descrip...</span></td><td>13/10/2025 · 9:58</td><td>Sierra Álvaro</td></tr>
                      <tr><td><span className="pat-link">https://savills.com/flyer/#/descrip...</span></td><td>27/11/2024 · 18:09</td><td>Sierra Álvaro</td></tr>
                    </tbody></table>
                  </div>
                </div></div>
              )}

              {/* Seguimiento */}
              {activeTab==='of-seg' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                    {[
                      {lbl:'Actividades totales',val:SEG_ACTS.length,color:'var(--text1)'},
                      {lbl:'Presentaciones',val:SEG_ACTS.filter(a=>a.tipo==='Presentación').length,color:'var(--amber)'},
                      {lbl:'Visitas realizadas',val:SEG_ACTS.filter(a=>a.tipo==='Visita').length,color:'var(--teal)'},
                      {lbl:'Pendientes',val:SEG_ACTS.filter(a=>a.estado==='Abierto'||a.estado==='En curso').length,color:'var(--red)'},
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
                      <thead><tr>{['','ID','Tipo','Descripción','Fecha','Responsable','Estado'].map(h =>
                        <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', background:'var(--gray-lt)', borderBottom:'1px solid var(--border)', textTransform:'uppercase' }}>{h}</th>
                      )}</tr></thead>
                      <tbody>{SEG_ACTS.map(a => (
                        <tr key={a.id} style={{ borderBottom:'1px solid var(--border)', cursor:'pointer' }} onClick={() => navigate('ficha-actividad')}>
                          <td style={{ padding:'7px 10px', width:30 }}><div style={{ width:26, height:26, borderRadius:'50%', background:a.bg, color:a.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700 }}>{a.initials}</div></td>
                          <td style={{ padding:'7px 12px' }}><span className="asset-link" style={{ fontFamily:'var(--mono)', fontSize:10 }}>{a.id}</span></td>
                          <td style={{ padding:'7px 12px' }}><span className={`tag ${TIPO_TAG[a.tipo]||'tag-gray'}`}>{TIPO_ICO[a.tipo]} {a.tipo}</span></td>
                          <td style={{ padding:'7px 12px', fontWeight:500, maxWidth:320 }}>{a.asunto}</td>
                          <td style={{ padding:'7px 12px', color:'var(--text3)', whiteSpace:'nowrap' }}>{a.fecha}</td>
                          <td style={{ padding:'7px 12px', fontSize:10, color:'var(--text3)' }}>{a.user}</td>
                          <td style={{ padding:'7px 12px' }}><span className={`tag ${ACT_EST[a.estado]||'tag-gray'}`}>{a.estado}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div></div>
              )}

              {/* Crear ficha */}
              {activeTab==='of-ficha' && (
                <div className="tab-content active"><div className="info-pad">
                  <div className="info-block"><div className="ib-title">CREAR FICHA COMERCIAL</div>
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <button className="ab-btn blue">📄 Generar PDF</button>
                      <button className="ab-btn">📝 Generar Word</button>
                      <button className="ab-btn">🌐 Ver ficha web</button>
                    </div>
                  </div>
                </div></div>
              )}

              {/* Confidencialidad */}
              {activeTab==='of-conf' && (
                <div className="tab-content active" style={{ overflowY:'auto', flex:1 }}><div className="info-pad">
                  <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', border:`1px solid ${confidential?'#334155':'var(--border)'}`, borderRadius:'var(--r2)', background:confidential?'#0f172a':'var(--surface)', marginBottom:18 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:confidential?'#f8fafc':'var(--text)' }}>Oferta confidencial</div>
                      <div style={{ fontSize:11, color:confidential?'#94a3b8':'var(--text3)', marginTop:2 }}>{confidential?'Activo, dirección, documentos y condiciones ocultos para no autorizados.':'La oferta es visible para todos los usuarios con acceso al PDB.'}</div>
                    </div>
                    <button onClick={() => setConfidential(v=>!v)} style={{ padding:'6px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', background:confidential?'#f8fafc':'#1e293b', color:confidential?'#0f172a':'#f8fafc' }}>
                      {confidential?'🔓 Desactivar':'🔒 Activar'}
                    </button>
                  </div>
                  {confidential && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
                      <div style={{ border:'1px solid var(--red-bd)', background:'var(--red-lt)', borderRadius:'var(--r2)', padding:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--red)', textTransform:'uppercase', marginBottom:8 }}>❌ Oculto (no autorizados)</div>
                        {['Activo / Inmueble','Dirección y ubicación','Condiciones económicas','Documentación adjunta','Stacking plan'].map(item=>(<div key={item} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, marginBottom:4 }}><span style={{ color:'var(--red)', fontWeight:700 }}>✕</span> {item}</div>))}
                      </div>
                      <div style={{ border:'1px solid var(--green-bd)', background:'var(--green-lt)', borderRadius:'var(--r2)', padding:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--green)', textTransform:'uppercase', marginBottom:8 }}>✅ Visible (siempre)</div>
                        {['Cliente / Cuenta','Tipo de operación','Estado de la oferta','Equipo responsable','Información básica'].map(item=>(<div key={item} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, marginBottom:4 }}><span style={{ color:'var(--green)', fontWeight:700 }}>✓</span> {item}</div>))}
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase' }}>Usuarios autorizados</div>
                      <button className="ab-btn blue" onClick={() => setAddingUser(true)} style={{ fontSize:10, padding:'3px 9px' }}>+ Añadir usuario</button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {authorizedUsers.map((u,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background:u.bg, color:u.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{u.initials}</div>
                          <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>{u.name}</div><div style={{ fontSize:10, color:'var(--text3)' }}>{u.team} · {u.role}</div></div>
                          {u.owner ? <span className="tag tag-blue">Propietario</span>
                            : <><span style={{ fontSize:10, color:'var(--text4)' }}>Acceso: {u.granted}</span><button onClick={() => setAuthorizedUsers(prev=>prev.filter((_,j)=>j!==i))} style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 6px', fontFamily:'inherit' }}>✕ Quitar</button></>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {addingUser && (
                    <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r2)', padding:14, marginBottom:14 }}>
                      <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Conceder acceso</div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                          <span style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase' }}>Usuario</span>
                          <select className="fsel" value={newUser} onChange={e => setNewUser(e.target.value)} style={{ minWidth:220 }}>
                            <option value="">Seleccionar...</option>
                            <option>GOMEZ Ignacio · Leasing Oficinas MAD</option>
                            <option>García Marta · Capital Markets MAD</option>
                            <option>López Carmen · Valoraciones MAD</option>
                            <option>Alonso Abruña D. · Leasing MAD</option>
                            <option>Martínez Rosa · Retail MAD</option>
                          </select>
                        </div>
                        <button className="ab-btn save" onClick={() => {
                          if(!newUser)return
                          const [nameStr,teamStr]=[newUser.split('·')[0].trim(),newUser.split('·')[1]?.trim()||'']
                          const ini=nameStr.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                          const today=new Date().toLocaleDateString('es-ES')
                          setAuthorizedUsers(prev=>[...prev,{name:nameStr,team:teamStr,role:'Autorizado',initials:ini,bg:'#f0fdf4',color:'#166534',granted:today,owner:false}])
                          setAddingUser(false);setNewUser('')
                        }}>Conceder acceso</button>
                        <button className="ab-btn" onClick={() => {setAddingUser(false);setNewUser('')}}>Cancelar</button>
                      </div>
                    </div>
                  )}
                  {confidential && (
                    <div style={{ border:'1px solid var(--amber-bd)', background:'var(--amber-lt)', borderRadius:'var(--r2)', padding:14, marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--amber)', textTransform:'uppercase', marginBottom:8 }}>DEMO — Vista de usuario no autorizado</div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                        <span style={{ fontSize:20 }}>🔒</span>
                        <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>Oferta confidencial</div><div style={{ fontSize:11, color:'var(--text3)' }}>No tienes permisos. Puedes solicitar acceso al responsable.</div></div>
                        <button className="ab-btn save" style={{ flexShrink:0 }} onClick={() => alert('✅ Solicitud enviada a Sierra Álvaro')}>Solicitar acceso</button>
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', marginBottom:8 }}>Trazabilidad de accesos</div>
                  <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                    {[{color:'var(--green)',msg:'Sierra Álvaro creó la oferta',date:'05/04/2026 · 10:00'},{color:'var(--accent)',msg:'Sierra Álvaro activó confidencialidad',date:'07/04/2026 · 09:00'}].map((e,i,arr) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 12px', borderBottom:i<arr.length-1?'1px solid var(--border)':'none' }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:e.color, flexShrink:0, marginTop:4 }} />
                        <div><div style={{ fontSize:11 }}>{e.msg}</div><div style={{ fontSize:10, color:'var(--text4)' }}>{e.date}</div></div>
                      </div>
                    ))}
                  </div>
                </div></div>
              )}
            </>
        </div>

        {/* Right panel */}
        <div className="ficha-right">
            <div className="rp-sec">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div><div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', marginBottom:3 }}>Ocupación activo</div><div style={{ fontSize:20, fontWeight:700 }}>75%</div></div>
                <div><div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', marginBottom:3 }}>Otras ofertas</div><div style={{ fontSize:20, fontWeight:700 }}>2</div></div>
              </div>
            </div>
            <div className="rp-sec">
              <div className="rp-lbl">KPIs de la oferta</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Renta (€/m²/mes)</div><div style={{ fontSize:14, fontWeight:700 }}>12,50</div></div>
                <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Gastos (€/m²/mes)</div><div style={{ fontSize:14, fontWeight:700 }}>3,01</div></div>
                <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Renta mensual</div><div style={{ fontSize:12, fontWeight:700 }}>{espaciosComercializables.reduce((s,e)=>s+e.renta*e.sup,0).toLocaleString(undefined,{maximumFractionDigits:0})} €</div></div>
                <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Sup. disponible</div><div style={{ fontSize:12, fontWeight:700, color:'var(--amber)' }}>{supTotal.toLocaleString()} m²</div></div>
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
              {[['🌐 Web Savills','Publicado',true],['🏠 Idealista','No publicado',false],['🏢 Mis Oficinas','No publicado',false]].map(([lbl,status,pub],i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:i<2?'1px solid var(--border)':'none' }}>
                  <span style={{ fontSize:11 }}>{lbl}</span><span style={{ fontSize:10, fontWeight:600, color:pub?'var(--green)':'var(--text4)' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Oferta" refNombre="OLBUR2315645" onClose={() => setShowTarea(false)} />}
    </div>
  )
}
