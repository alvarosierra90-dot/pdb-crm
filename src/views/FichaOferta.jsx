import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'
import { supabase } from '../lib/supabase'
import { OFERTAS as MOCK_OFERTAS, ACTIVOS as MOCK_ACTIVOS } from '../data/mockData'
import { BUILDINGS_BY_ACTIVO } from '../data/stackingData'

const TABS = ['of-info','of-stacking','of-espacios','of-condiciones','of-caract','of-docs','of-web','of-seg','of-ficha','of-conf']
const TAB_LABELS = ['Información oferta','Stacking plan','Espacios comerciales','Condiciones','Características','Documentos','Contenido web','Seguimiento comercial','Crear ficha','🔒 Confidencialidad']

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

function OfertaStackingTab({ activoRef, ofertasDesglose }) {
  const [view, setView] = useState('arr')
  const buildings = BUILDINGS_BY_ACTIVO[activoRef] || []
  const UNIT_COLORS = {
    ten: { bg:'#dbeafe', border:'#93c5fd', color:'#1e40af' },
    vac: { bg:'var(--accent-lt)', border:'var(--accent-bd)', color:'var(--accent)' },
    com: { bg:'#f1f5f9', border:'#cbd5e1', color:'#475569' },
    pk:  { bg:'#f8fafc', border:'#e2e8f0', color:'#64748b' },
    rt:  { bg:'#fdf4ff', border:'#e9d5ff', color:'#7e22ce' },
  }
  if (!activoRef) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', gap:12 }}>
      <div style={{ fontSize:32 }}>📊</div>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>Sin activo vinculado</div>
      <div style={{ fontSize:11, color:'var(--text3)' }}>Asigna un activo en "Información oferta" para ver el stacking plan.</div>
    </div>
  )
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <span style={{ fontSize:11, fontWeight:600, color:'var(--text3)' }}>Vista:</span>
        {[['uso','Uso principal'],['arr','Arrendatarios + Oferta'],['prop','Propietarios']].map(([v,lbl]) => (
          <button key={v} className={view===v?'ab-btn save':'ab-btn'} style={{ fontSize:10, padding:'3px 10px' }} onClick={() => setView(v)}>{lbl}</button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:10, color:'var(--text4)', fontStyle:'italic' }}>Stacking del activo vinculado · solo lectura estructural</span>
      </div>
      {buildings.length === 0 ? (
        <div style={{ padding:'32px 0', textAlign:'center', color:'var(--text4)', fontSize:12 }}>Sin datos de stacking para este activo.</div>
      ) : (
        <div style={{ display:'flex', gap:16, overflowX:'auto' }}>
          {buildings.map(bld => {
            const floors = view==='arr' ? bld.arr : view==='prop' ? bld.prop : bld.floors
            return (
              <div key={bld.id} style={{ minWidth:220, flex:1 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8, padding:'6px 10px', background:'var(--gray-lt)', borderRadius:'var(--r)', border:'1px solid var(--border)' }}>{bld.label}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  {(floors||[]).map(floor => {
                    const fId = floor.id||floor.p
                    const fSup = floor.sup
                    if (view==='uso') {
                      const usoBg = { oficinas:'#dbeafe', retail:'#fdf4ff', comun:'#f1f5f9', parking:'#f8fafc', logistico:'#f0fdfa' }
                      return (
                        <div key={fId} style={{ display:'flex', gap:3, height:30 }}>
                          <div style={{ width:32, flexShrink:0, fontSize:9, fontWeight:700, color:'var(--text4)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>{fId}</div>
                          <div style={{ flex:1, display:'flex', overflow:'hidden', borderRadius:'var(--r)', border:'1px solid var(--border)' }}>
                            {floor.principal.map((u,i) => (
                              <div key={i} style={{ flex:u.sup, background:usoBg[u.uso]||'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:600, color:'var(--text2)', textTransform:'capitalize' }}>{u.uso}</div>
                            ))}
                          </div>
                          <div style={{ width:56, flexShrink:0, fontSize:9, color:'var(--text4)', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{(fSup||0).toLocaleString()} m²</div>
                        </div>
                      )
                    }
                    return (
                      <div key={fId} style={{ display:'flex', gap:3, height:30 }}>
                        <div style={{ width:32, flexShrink:0, fontSize:9, fontWeight:700, color:'var(--text4)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>{fId}</div>
                        <div style={{ flex:1, display:'flex', overflow:'hidden', borderRadius:'var(--r)', border:'1px solid var(--border)' }}>
                          {(floor.units||[]).map((u,i) => {
                            const col = UNIT_COLORS[u.type]||UNIT_COLORS.com
                            const isOffer = ofertasDesglose?.some(od => od.nombre===u.oferta)
                            const bg = isOffer ? '#dcfce7' : col.bg
                            const clr = isOffer ? '#166534' : col.color
                            const label = u.type==='vac' ? (u.oferta ? `▸ ${u.oferta}` : 'Vacante') : (u.n||'').split(' ')[0]
                            return (
                              <div key={i} style={{ flex:u.sup, background:bg, borderLeft:`2px solid ${col.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontWeight:600, color:clr, overflow:'hidden', padding:'0 2px', textAlign:'center' }}
                                title={u.n||(u.oferta?`Oferta: ${u.oferta}`:'')}>
                                {label}
                              </div>
                            )
                          })}
                        </div>
                        <div style={{ width:56, flexShrink:0, fontSize:9, color:'var(--text4)', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{(fSup||0).toLocaleString()} m²</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap', paddingTop:12, borderTop:'1px solid var(--border)' }}>
        {[['ten','Arrendatario'],['vac','Vacante / Oferta'],['com','Zona común'],['pk','Parking'],['rt','Retail']].map(([t,lbl]) => (
          <div key={t} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:12, height:12, background:UNIT_COLORS[t].bg, border:`1px solid ${UNIT_COLORS[t].border}`, borderRadius:2 }} />
            <span style={{ fontSize:9, color:'var(--text3)' }}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  )
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
  const [isMock, setIsMock]     = useState(false)  // true when showing example data
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
  const [gastosComunes, setGastosComunes] = useState(3.01)
  const [ibi, setIbi] = useState('')
  const [gastosIncluidos, setGastosIncluidos] = useState(false)
  const [tituloWeb, setTituloWeb] = useState('Complejo de edificios exclusivos en Arroyo de la Vega')
  const [textoWeb, setTextoWeb] = useState('Situados en un entorno profesional de alto nivel, en Arroyo de la Vega, los edificios C y D Albatros ofrecen unas instalaciones únicas reformadas de forma integral.')
  const [keywordsWeb, setKeywordsWeb] = useState(['','','','',''])
  const [publicarCondiciones, setPublicarCondiciones] = useState(false)
  const [publicar, setPublicar] = useState(true)
  const [geolocalizacion, setGeolocalizacion] = useState(true)
  const [opcionPublicacion, setOpcionPublicacion] = useState('Publicar dirección')
  const [enlacesPortales, setEnlacesPortales] = useState([])

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

  // Activo selector
  const [activosDB, setActivosDB] = useState([])
  const [activoSeleccionado, setActivoSeleccionado] = useState(null)
  const [activoBuscador, setActivoBuscador] = useState('')
  const [showActivoDropdown, setShowActivoDropdown] = useState(false)

  // Tab 3 + Stacking
  const [fechaDispGlobal, setFechaDispGlobal] = useState('2026-06-01')
  const [divisibleGlobal, setDivisibleGlobal] = useState(true)
  const [supAprox, setSupAprox] = useState(false)
  const [plantaTipo, setPlantaTipo] = useState(2790)
  const [ofertasDesglose, setOfertasDesglose] = useState([
    { id:1, nombre:'Oferta 1', divisible:true, cargasM2:3.01 },
  ])
  const [nextOfertaId, setNextOfertaId] = useState(2)
  const [editNombreId, setEditNombreId] = useState(null)
  const [editNombreVal, setEditNombreVal] = useState('')

  // Características (filtro comercial sobre el activo)
  const [caracteristicas, setCaracteristicas] = useState(null) // null = no importadas aún

  function importarCaracteristicas() {
    const src = activoSeleccionado ? ASSET_CARACT : ASSET_CARACT
    setCaracteristicas(src.map(c => ({ ...c, incluir: true })))
  }

  // Plazas de aparcamiento (dentro de Espacios comerciales)
  const [plazas, setPlazas] = useState([])
  const [nextPlazaId, setNextPlazaId] = useState(1)
  const [addingPlaza, setAddingPlaza] = useState(false)
  const [newPlaza, setNewPlaza] = useState({ intExt:'Interior', tipo:'Coches', formato:'Simple', cantidad:1, renta:'', precio:'' })

  // Espacios comercializables — poblados desde asignaciones_stacking, vacíos por defecto
  const [espaciosComercializables, setEspaciosComercializables] = useState([])
  const supTotal = espaciosComercializables.reduce((s, e) => s + e.sup, 0)

  function addOferta() {
    const id = nextOfertaId
    setOfertasDesglose(prev => [...prev, { id, nombre:`Oferta ${id}`, divisible:divisibleGlobal, cargasM2:3.01 }])
    setNextOfertaId(id + 1)
  }

  function getEscenarios() {
    if (!divisibleGlobal) return [{ label:'Total disponible', sup:supTotal, tipo:'unico' }]
    const base = espaciosComercializables.map(e => ({ label:`${e.planta} — ${e.edificio}`, sup:e.sup, tipo:'modulo' }))
    if (espaciosComercializables.length > 1) base.push({ label:'Total combinado', sup:supTotal, tipo:'total' })
    return base
  }

  const tipologiaOpciones = TIPOLOGIA_MAP[activoSeleccionado?.uso || ''] || []

  // ── Always load activos for the selector ──────────────────────
  useEffect(() => {
    supabase.from('activos').select('ref,nombre,uso,estado_construccion,direccion,zona,subzona,ciudad,propietario').order('nombre')
      .then(({ data }) => { if (data) setActivosDB(data) })
  }, [])

  // ── Load oferta from Supabase (chained: oferta → sub-tables) ──
  useEffect(() => {
    if (!params?.ofertaRef) return
    supabase.from('ofertas').select('*').eq('ref', params.ofertaRef).single()
      .then(({ data }) => {
        if (!data) {
          // Fallback: check mock OFERTAS
          const mock = MOCK_OFERTAS.find(o => o.ref === params.ofertaRef)
          if (mock) {
            setIsMock(true)
            setOferta({ ref: mock.ref, id: null })
            if (mock.tipo_comercializacion) setTipoComercializacion(mock.tipo_comercializacion)
            if (mock.tipologia)             setTipologia(mock.tipologia)
            if (mock.estado_espacio)        setEstadoEspacio(mock.estado_espacio)
            if (mock.tipo_operacion)        setTipoOperacion(mock.tipo_operacion)
            if (mock.origen_oferta)         setOrigenOferta(mock.origen_oferta)
            if (mock.modalidad_visita)      setModalidadVisita(mock.modalidad_visita)
            if (mock.equipo?.length)        setEquipoMembers(mock.equipo)
            if (mock.espacios?.length) {
              setEspaciosComercializables(mock.espacios.map(e => ({
                edificio: e.edificio,
                modulo:   `${e.edificio}-${e.planta}`,
                planta:   e.planta,
                uso:      e.uso,
                sup:      e.sup,
                renta:    e.renta,
                ofertaNombre: 'Oferta 1',
              })))
            }
            // Load mock activo
            const mockActivo = MOCK_ACTIVOS.find(a => a.ref === mock.activo_ref)
            if (mockActivo) {
              setActivoSeleccionado({
                ref:       mockActivo.ref,
                nombre:    mockActivo.name,
                uso:       mockActivo.uso,
                propietario: mockActivo.propietario,
                direccion: mockActivo.direccion || '',
                ciudad:    mockActivo.ciudad || '',
                zona:      mockActivo.zona || '',
              })
            }
          }
          return
        }
        setOferta(data)
        if (data.tipo_comercializacion) setTipoComercializacion(data.tipo_comercializacion)
        if (data.tipologia)             setTipologia(data.tipologia)
        if (data.estado_espacio)        setEstadoEspacio(data.estado_espacio)
        if (data.tipo_operacion)        setTipoOperacion(data.tipo_operacion)
        if (data.origen_oferta)         setOrigenOferta(data.origen_oferta)
        if (data.modalidad_visita)      setModalidadVisita(data.modalidad_visita)
        if (data.confidencial != null)  setConfidential(data.confidencial)
        if (data.equipo?.length)        setEquipoMembers(data.equipo)
        if (data.colaboradores?.length) setColaboradores(data.colaboradores)

        const ofertaId = data.id  // UUID — used for sub-table joins

        // Load activo vinculado
        if (data.activo_ref) {
          supabase.from('activos').select('*').eq('ref', data.activo_ref).single()
            .then(({ data: a }) => { if (a) setActivoSeleccionado(a) })
        }

        // Load desglose_ofertas
        supabase.from('desglose_ofertas').select('*').eq('oferta_id', ofertaId).order('orden')
          .then(({ data: d }) => {
            if (d?.length > 0) {
              setOfertasDesglose(d.map(x => ({ id: x.id, nombre: x.nombre, divisible: x.divisible, cargasM2: x.cargas_m2||0 })))
              setNextOfertaId(d.length + 1)
            }
          })

        // Load plazas_oferta
        supabase.from('plazas_oferta').select('*').eq('oferta_id', ofertaId)
          .then(({ data: d }) => {
            if (d?.length > 0) {
              setPlazas(d.map((p, i) => ({ id: i+1, intExt: p.int_ext, tipo: p.tipo, formato: p.formato, cantidad: p.cantidad, renta: p.renta||'', precio: p.precio||'' })))
              setNextPlazaId(d.length + 1)
            }
          })

        // Load caracteristicas_oferta
        supabase.from('caracteristicas_oferta').select('*').eq('oferta_id', ofertaId)
          .then(({ data: d }) => {
            if (d?.length > 0) {
              setCaracteristicas(d.map(c => ({ id: c.caracteristica_origen_id, tipo: c.tipo, detalle: c.detalle, año: c.anno, comentario: c.comentario, incluir: c.incluir })))
            }
          })

        // Load asignaciones_stacking → espacios comercializables
        supabase.from('asignaciones_stacking').select('*, desglose_ofertas(nombre)').eq('oferta_id', ofertaId)
          .then(({ data: d }) => {
            if (d?.length > 0) {
              setEspaciosComercializables(d.map(a => ({
                edificio: a.edificio_id,
                modulo:   `${a.edificio_id}-${a.planta_id}`,
                planta:   a.planta_id,
                uso:      'Oficina',
                sup:      a.sup || 0,
                renta:    a.renta || 0,
                ofertaNombre: a.desglose_ofertas?.nombre || '—',
              })))
            }
          })
      })
  }, [params?.ofertaRef])

  // ── Save oferta to Supabase ────────────────────────────────────
  const handleSave = async () => {
    if (!oferta?.id) return
    setSaving(true); setSaveErr(''); setSaveOk(false)
    const { error } = await supabase.from('ofertas').update({
      activo_ref:            activoSeleccionado?.ref || null,
      tipo_comercializacion: tipoComercializacion    || null,
      tipologia:             tipologia               || null,
      estado_espacio:        estadoEspacio           || null,
      tipo_operacion:        tipoOperacion           || null,
      origen_oferta:         origenOferta            || null,
      modalidad_visita:      modalidadVisita         || null,
      confidencial,
      equipo:                equipoMembers,
      colaboradores,
    }).eq('id', oferta.id)
    if (error) { setSaveErr(error.message); setSaving(false); return }

    // Upsert desglose_ofertas
    await supabase.from('desglose_ofertas').delete().eq('oferta_id', oferta.id)
    if (ofertasDesglose.length > 0) {
      await supabase.from('desglose_ofertas').insert(
        ofertasDesglose.map((d, i) => ({
          oferta_id: oferta.id,
          nombre:    d.nombre,
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

    // Reload oferta after save so activo_ref is reflected
    const { data: refreshed } = await supabase.from('ofertas').select('*').eq('id', oferta.id).single()
    if (refreshed) setOferta(refreshed)

    setSaving(false); setSaveOk(true); setTimeout(() => setSaveOk(false), 3000)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn" onClick={() => navigate('ofertas')} style={{ color:'var(--text3)' }}>← Volver</button>
        <div className="ab-sep" />
        {isMock && <span style={{fontSize:11,color:'var(--amber)',background:'var(--amber-lt)',border:'1px solid var(--amber-bd)',borderRadius:'var(--r)',padding:'3px 8px',marginRight:6}}>Oferta de ejemplo · sólo lectura</span>}
        <button className="ab-btn save" onClick={handleSave} disabled={saving || isMock}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
        <button className="ab-btn" onClick={async () => { if (!isMock) await handleSave(); navigate('ofertas') }}>Guardar y cerrar</button>
        {saveOk  && <span style={{fontSize:11,color:'var(--green)',marginLeft:8}}>✓ Guardado</span>}
        {saveErr && <span style={{fontSize:11,color:'var(--red)',marginLeft:8}}>{saveErr}</span>}
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn">Desactivar</button>
        <div className="ab-sep" />
        <button className="ab-btn">📄 Crear ficha</button>
        <button className="ab-btn">🔄 Recalcular</button>
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
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{oferta?.ref || '—'}</span>
                  {confidential && <span style={{ background:'#1e293b',color:'#f8fafc',border:'1px solid #334155',padding:'0 7px',borderRadius:3,fontSize:9,fontWeight:700,letterSpacing:'.04em' }}>🔒 CONFIDENCIAL</span>}
                  {activoSeleccionado && (
                    <span style={{ color:'var(--text3)' }}>· Activo: <span className="pat-link" onClick={() => navigate('ficha-activo', { ref: activoSeleccionado.ref })}>{activoSeleccionado.nombre}</span></span>
                  )}
                  {activoSeleccionado && <span className="tag tag-green" style={{ fontSize:9 }}>+ Vinculado</span>}
                </div>
                <div className="ah-name">
                  {activoSeleccionado ? activoSeleccionado.nombre : <span style={{ color:'var(--text4)', fontStyle:'italic' }}>Sin activo asignado — selecciona uno en la pestaña Información</span>}
                </div>
                {activoSeleccionado && (
                  <div className="ah-addr">📍 {activoSeleccionado.ciudad} · {activoSeleccionado.zona}{activoSeleccionado.subzona ? ` · ${activoSeleccionado.subzona}` : ''}</div>
                )}
                <div className="ah-tags">
                  {activoSeleccionado?.uso && <span className="tag tag-blue">{activoSeleccionado.uso}</span>}
                  {tipoComercializacion && <span className="tag tag-purple">{tipoComercializacion}</span>}
                  {tipoOperacion && <span className="tag tag-teal">{tipoOperacion}</span>}
                  {oferta?.estado && <span className="tag tag-green">{oferta.estado}</span>}
                  {oferta?.dias_comercializacion > 0 && <span className="dias-pill">📅 {oferta.dias_comercializacion} días en comercialización</span>}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase' }}>Equipo</div>
                <div style={{ fontSize:11, fontWeight:600 }}>{equipoMembers[0]?.team || 'Transaction Spain'}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4, justifyContent:'flex-end' }}>
                  <div className="c-av" style={{ background: equipoMembers[0]?.bg || '#dbeafe', color: equipoMembers[0]?.color || '#1e40af', width:22, height:22, fontSize:8 }}>{equipoMembers[0]?.initials || 'AS'}</div>
                  <span style={{ fontSize:11 }}>{equipoMembers[0]?.name || 'Sierra Álvaro'}</span>
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
                      {/* LEFT: form fields */}
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        <div>
                          <FieldLbl req>Activo / Asset</FieldLbl>
                          {activoSeleccionado ? (
                            <div style={{ padding:'6px 9px', border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', background:'var(--accent-lt)', display:'flex', alignItems:'center', gap:6 }}>
                              <span>🏢</span>
                              <span style={{ flex:1, fontSize:12, fontWeight:500, color:'var(--accent)' }}>{activoSeleccionado.nombre}</span>
                              <button onClick={() => navigate('ficha-activo', { ref: activoSeleccionado.ref })} style={{ fontSize:9, fontWeight:700, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', padding:'0 3px' }}>↗</button>
                              <button onClick={() => setActivoSeleccionado(null)} style={{ fontSize:11, color:'var(--text4)', background:'none', border:'none', cursor:'pointer', padding:'0 3px' }}>✕</button>
                            </div>
                          ) : (
                            <div style={{ position:'relative' }}>
                              <input className="of-inp" placeholder="🔍 Buscar activo por nombre..." value={activoBuscador}
                                onChange={e => { setActivoBuscador(e.target.value); setShowActivoDropdown(true) }}
                                onFocus={() => setShowActivoDropdown(true)}
                                onBlur={() => setTimeout(() => setShowActivoDropdown(false), 150)} />
                              {showActivoDropdown && (
                                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', boxShadow:'0 4px 12px rgba(0,0,0,.12)', zIndex:200, maxHeight:200, overflowY:'auto' }}>
                                  {activosDB.filter(a => !activoBuscador || a.nombre.toLowerCase().includes(activoBuscador.toLowerCase())).slice(0,8).map(a => (
                                    <div key={a.ref} onMouseDown={() => { setActivoSeleccionado(a); setActivoBuscador(''); setShowActivoDropdown(false) }}
                                      style={{ padding:'7px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:11 }}>
                                      <div style={{ fontWeight:600 }}>{a.nombre}</div>
                                      <div style={{ color:'var(--text4)', fontSize:10 }}>{a.ref} · {a.uso}</div>
                                    </div>
                                  ))}
                                  {activosDB.filter(a => !activoBuscador || a.nombre.toLowerCase().includes(activoBuscador.toLowerCase())).length === 0 && (
                                    <div style={{ padding:'10px 12px', color:'var(--text4)', fontSize:11 }}>Sin resultados</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div><FieldLbl>Uso principal</FieldLbl><ReadonlyPill value={activoSeleccionado?.uso || '—'} /></div>
                        <div><FieldLbl>Estado de construcción</FieldLbl><ReadonlyPill value={activoSeleccionado?.estado_construccion || '—'} /></div>
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
                          {tipologiaOpciones.length > 0 && activoSeleccionado?.uso && <div style={{ fontSize:9, color:'var(--text4)', marginTop:2 }}>Opciones para <strong>{activoSeleccionado.uso}</strong></div>}
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
                        <div><FieldLbl>Comentarios</FieldLbl><textarea className="of-textarea" placeholder="Observaciones internas..." value={comentarios} onChange={e => setComentarios(e.target.value)} style={{ minHeight:72 }} /></div>
                      </div>
                      {/* RIGHT: map + images + contacts */}
                      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        <div>
                          <FieldLbl>Ubicación · Georreferenciado desde activo</FieldLbl>
                          <div style={{ borderRadius:'var(--r2)', overflow:'hidden', border:'1px solid var(--border)', height:220 }}>
                            {activoSeleccionado?.direccion ? (
                              <iframe title="Mapa oferta" width="100%" height="100%" style={{ border:0 }} loading="lazy"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(activoSeleccionado.direccion)}&z=15&output=embed`} />
                            ) : (
                              <div style={{ width:'100%', height:'100%', background:'var(--gray-lt)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, color:'var(--text4)' }}>
                                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                                <div style={{ fontSize:11 }}>Selecciona un activo para ver el mapa</div>
                              </div>
                            )}
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                            <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'7px 10px', fontSize:11 }}>
                              <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Dirección</div>
                              <div style={{ color:'var(--text2)', marginTop:2 }}>{activoSeleccionado?.direccion || '—'}</div>
                              <div style={{ color:'var(--text3)' }}>{activoSeleccionado?.ciudad || ''}</div>
                            </div>
                            <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'7px 10px', fontSize:11 }}>
                              <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Zona</div>
                              <div style={{ color:'var(--text2)', marginTop:2 }}>{activoSeleccionado?.zona || '—'}</div>
                              <div style={{ color:'var(--text3)' }}>{activoSeleccionado?.subzona || ''}</div>
                            </div>
                          </div>
                        </div>
                        <div><FieldLbl>Imágenes · Vinculadas al activo</FieldLbl><div className="img-strip"><div className="img-thumb principal">🏢</div><div className="img-thumb">🏙</div><div className="img-thumb">🖼</div></div></div>
                        {/* Contacts in right column */}
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', paddingTop:4 }}>Datos de contacto</div>
                        <div className="info-block">
                          <div className="ib-title">🏠 PROPIETARIO</div>
                          <div style={{ fontSize:9, color:'var(--text4)', marginBottom:8, fontWeight:600, letterSpacing:'.04em' }}>Heredado del activo · Solo lectura</div>
                          {activoSeleccionado?.propietario ? (
                            <>
                              <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>{activoSeleccionado.propietario}</div>
                              <div style={{ fontSize:10, color:'var(--text4)', fontStyle:'italic' }}>Para contacto detallado, consulta la ficha del activo.</div>
                              <div style={{ marginTop:8 }}><span style={{ fontSize:9, background:'var(--green-lt)', color:'var(--green)', border:'1px solid var(--green-bd)', padding:'2px 7px', borderRadius:10, fontWeight:700 }}>ↈ Sincronizado</span></div>
                            </>
                          ) : (
                            <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>
                              {activoSeleccionado ? 'Sin propietario registrado en el activo.' : 'Selecciona un activo para ver el propietario.'}
                            </div>
                          )}
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

              {/* ── TAB: Stacking plan ── */}
              {activeTab==='of-stacking' && (
                <div className="tab-content active">
                  <div className="info-pad">
                    <OfertaStackingTab activoRef={activoSeleccionado?.ref} ofertasDesglose={ofertasDesglose} />
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
                        <button className="ab-btn blue" style={{ fontSize:10 }} disabled={!activoSeleccionado}
                          onClick={() => navigate('ficha-activo', { ref: activoSeleccionado?.ref, tab:'at-stacking', stackingView:'arr', ofertasFromOferta: ofertasDesglose, ofertaId: oferta?.id })}>
                          📊 Abrir Stacking Plan →
                        </button>
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
                              {['Nombre área','Sup. asignada','¿Divisible?','Cargas €/m²','Fecha disp.','Plantas asignadas',''].map(h =>
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
                                    <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{assignedSup>0?assignedSup.toLocaleString()+' m²':<span style={{ color:'var(--text4)' }}>—</span>}</td>
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
                              {ofertasDesglose.length===0 && <tr><td colSpan={7} style={{ padding:18, textAlign:'center', color:'var(--text4)', fontSize:11, fontStyle:'italic' }}>Sin áreas. Pulsa "+ Agregar".</td></tr>}
                            </tbody>
                          </table>
                          <div style={{ padding:'7px 14px', background:'var(--accent-lt)', borderTop:'1px solid var(--accent-bd)', fontSize:10, color:'var(--accent)' }}>
                            ↈ Al guardar, las ofertas se sincronizan automáticamente con el Stacking Plan.
                          </div>
                        </div>

                        {/* Espacios comercializables */}
                        <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--gray-lt)' }}>
                            <div><span style={{ fontSize:11, fontWeight:700 }}>Espacios asignados</span><span style={{ marginLeft:8, fontSize:9, color:'var(--text4)' }}>Proyectados desde el Stacking Plan · solo lectura</span></div>
                            <span className="tag tag-gray" style={{ fontSize:9 }}>{espaciosComercializables.length > 0 ? 'ↈ Auto-calculado' : 'Pendiente asignación'}</span>
                          </div>
                          {espaciosComercializables.length === 0 ? (
                            <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--text4)', fontSize:12 }}>
                              <div style={{ fontSize:20, marginBottom:8 }}>📊</div>
                              <div style={{ fontWeight:600, marginBottom:4 }}>Sin espacios asignados</div>
                              <div style={{ fontSize:11 }}>Abre el Stacking Plan y arrastra esta oferta sobre las plantas disponibles.</div>
                              {activoSeleccionado && (
                                <button className="ab-btn blue" style={{ marginTop:12, fontSize:11 }}
                                  onClick={() => navigate('ficha-activo', { ref: activoSeleccionado.ref, tab:'at-stacking', stackingView:'arr', ofertasFromOferta: ofertasDesglose, ofertaId: oferta?.id })}>
                                  📊 Abrir Stacking Plan →
                                </button>
                              )}
                            </div>
                          ) : (
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                              <thead><tr>
                                {['Edificio','Planta','Sup. (m²)','Renta €/m²/mes','Renta mensual','Área'].map(h =>
                                  <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                                )}
                              </tr></thead>
                              <tbody>
                                {espaciosComercializables.map((e,i) => (
                                  <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                                    <td style={{ padding:'7px 12px', fontSize:10 }}>{e.edificio}</td>
                                    <td style={{ padding:'7px 12px' }}><span className="tag tag-gray" style={{ fontSize:9 }}>{e.planta}</span></td>
                                    <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{(e.sup||0).toLocaleString()}</td>
                                    <td style={{ padding:'7px 12px', fontFamily:'var(--mono)' }}>{e.renta > 0 ? `${e.renta.toFixed(2)} €` : '—'}</td>
                                    <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600, color:'var(--green)' }}>{e.renta > 0 ? `${(e.renta*e.sup).toLocaleString(undefined,{maximumFractionDigits:0})} €` : '—'}</td>
                                    <td style={{ padding:'7px 12px', fontSize:10 }}>{e.ofertaNombre}</td>
                                  </tr>
                                ))}
                                <tr style={{ background:'var(--gray-lt)', borderTop:'2px solid var(--border)' }}>
                                  <td colSpan={2} style={{ padding:'7px 12px', fontSize:10, fontWeight:700, color:'var(--text3)' }}>TOTAL</td>
                                  <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:800 }}>{supTotal.toLocaleString()}</td>
                                  <td /><td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:800, color:'var(--green)' }}>{espaciosComercializables.reduce((s,e)=>s+(e.renta||0)*e.sup,0).toLocaleString(undefined,{maximumFractionDigits:0})} €</td>
                                  <td />
                                </tr>
                              </tbody>
                            </table>
                          )}
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
                      <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:12 }}>
                        <div>
                          <FieldLbl>Gastos comunes (€/m²/mes)</FieldLbl>
                          <input type="number" step="0.01" className="of-inp" value={gastosComunes} onChange={e => setGastosComunes(e.target.value)} placeholder="0,00" />
                        </div>
                        <div>
                          <FieldLbl>IBI (€/m²/mes)</FieldLbl>
                          <input type="number" step="0.01" className="of-inp" value={ibi} onChange={e => setIbi(e.target.value)} placeholder="0,00" />
                        </div>
                        <label style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'9px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)', cursor:'pointer' }}>
                          <input type="checkbox" checked={gastosIncluidos} onChange={e => setGastosIncluidos(e.target.checked)} style={{ accentColor:'var(--accent)', marginTop:1 }} />
                          <div>
                            <div style={{ fontSize:11, fontWeight:600 }}>Gastos incluidos en renta</div>
                            <div style={{ fontSize:9, color:'var(--text4)', marginTop:1 }}>{gastosIncluidos ? 'Los importes son informativos (ya incluidos en la renta)' : 'Los importes son adicionales a la renta'}</div>
                          </div>
                        </label>
                      </div>
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
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                    {/* LEFT */}
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                          <FieldLbl>Título web / ficha</FieldLbl>
                          <button className="ab-btn blue" style={{ fontSize:9, padding:'2px 8px' }}>✦ IA</button>
                        </div>
                        <input className="of-inp" value={tituloWeb} onChange={e => setTituloWeb(e.target.value)} placeholder="Título comercial de la oferta..." />
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                          <FieldLbl>Texto descriptivo web / ficha</FieldLbl>
                          <button className="ab-btn blue" style={{ fontSize:9, padding:'2px 8px' }}>✦ IA</button>
                        </div>
                        <textarea className="of-textarea" value={textoWeb} onChange={e => setTextoWeb(e.target.value)} style={{ minHeight:120 }} placeholder="Descripción comercial del espacio..." />
                      </div>
                      <div>
                        <FieldLbl>Keywords comerciales</FieldLbl>
                        <div style={{ fontSize:10, color:'var(--text3)', marginBottom:8 }}>Aparecen como etiquetas en la ficha comercial · incluidas en PDF/PPT</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {keywordsWeb.map((kw,i) => (
                            <input key={i} className="of-inp" value={kw} onChange={e => setKeywordsWeb(prev => prev.map((k,j) => j===i ? e.target.value : k))}
                              placeholder={`Keyword ${i+1}...`} style={{ fontSize:11 }} />
                          ))}
                        </div>
                        {keywordsWeb.some(k=>k) && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:10 }}>
                            <div style={{ fontSize:9, color:'var(--text4)', width:'100%', marginBottom:3 }}>Vista previa:</div>
                            {keywordsWeb.filter(k=>k).map((k,i) => (
                              <span key={i} style={{ padding:'3px 10px', background:'#dbeafe', color:'#1e40af', border:'1px solid #93c5fd', borderRadius:12, fontSize:10, fontWeight:600 }}>{k}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* RIGHT */}
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      <div className="info-block">
                        <div className="ib-title">OPCIONES DE PUBLICACIÓN</div>
                        <div style={{ marginBottom:10 }}>
                          <FieldLbl>Dirección vinculada</FieldLbl>
                          <ReadonlyPill value={activoSeleccionado?.direccion || '—'} />
                        </div>
                        <div>
                          <FieldLbl>Opción de publicación</FieldLbl>
                          <select className="of-sel" value={opcionPublicacion} onChange={e => setOpcionPublicacion(e.target.value)}>
                            <option>Publicar dirección</option>
                            <option>Sin publicar dirección</option>
                          </select>
                        </div>
                      </div>
                      <div className="info-block">
                        <div className="ib-title">OPCIONES DE PUBLICACIÓN WEB</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {[
                            [publicarCondiciones, setPublicarCondiciones, 'Publicar condiciones económicas'],
                            [publicar, setPublicar, 'Publicar'],
                            [geolocalizacion, setGeolocalizacion, 'Geolocalización dirección'],
                          ].map(([val, setter, lbl], i) => (
                            <label key={i} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:11 }}>
                              <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} style={{ accentColor:'var(--accent)' }} />
                              {lbl}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="info-block">
                        <div className="ib-title">PORTALES WEB</div>
                        <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px' }}>
                            <span style={{ fontSize:12 }}>🏠 Idealista</span>
                            <input type="checkbox" defaultChecked style={{ accentColor:'var(--accent)' }} />
                          </div>
                        </div>
                      </div>
                      <div className="info-block">
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                          <div className="ib-title" style={{ marginBottom:0 }}>ENLACES PORTALES WEB</div>
                          <button className="ab-btn blue" style={{ fontSize:10, padding:'2px 8px' }} onClick={() => setEnlacesPortales(prev => [...prev, { portal:'Idealista', url:'' }])}>+ Añadir</button>
                        </div>
                        {enlacesPortales.length === 0 ? (
                          <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin enlaces añadidos</div>
                        ) : (
                          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            {enlacesPortales.map((e,i) => (
                              <div key={i} style={{ display:'flex', gap:6, alignItems:'center' }}>
                                <select className="fsel" style={{ width:100 }} value={e.portal} onChange={ev => setEnlacesPortales(prev => prev.map((x,j) => j===i ? {...x, portal:ev.target.value} : x))}>
                                  <option>Idealista</option>
                                </select>
                                <input className="of-inp" style={{ flex:1 }} placeholder="https://..." value={e.url} onChange={ev => setEnlacesPortales(prev => prev.map((x,j) => j===i ? {...x, url:ev.target.value} : x))} />
                                <button onClick={() => setEnlacesPortales(prev => prev.filter((_,j) => j!==i))} style={{ color:'var(--red)', background:'none', border:'none', cursor:'pointer', fontSize:14, fontFamily:'inherit' }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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
                    <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>Genera la ficha comercial de esta oferta en diferentes formatos.</div>
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <button className="ab-btn blue">📄 Generar PDF</button>
                      <button className="ab-btn">📊 Generar PPT</button>
                      <button className="ab-btn">🔗 Generar link</button>
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
