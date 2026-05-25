import { useState, useEffect, useRef } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'
import { supabase } from '../lib/supabase'
import { OFERTAS as MOCK_OFERTAS, ACTIVOS as MOCK_ACTIVOS } from '../data/mockData'
import { isSupabaseRef } from '../components/FichaPendienteSupabase'
import FichaOfertaSupabase from './FichaOfertaSupabase'
import { FileText, Presentation, Link2, Clock } from 'lucide-react'
import Vinculaciones from '../components/Vinculaciones'
import NotasModal from '../components/NotasModal'
import { CURRENT_USER } from '../lib/currentUser'
// IMPORTANTE: Importar el StackingPlan exacto de FichaActivo para garantizar
// igualdad visual y funcional total entre Activo y Oferta (regla del usuario).
import { StackingPlan } from './FichaActivo'

// 'Condiciones' fusionado dentro de 'Espacios comerciales' (regla del usuario)
const TABS = ['of-info','of-stacking','of-espacios','of-caract','of-docs','of-web','of-seg','of-conf']
const TAB_LABELS = ['Información oferta','Stacking plan','Espacios comerciales','Características','Documentos','Contenido web','Vista 360','Confidencialidad']

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

// Placeholder media — in production this comes from activoSeleccionado.media or a media Supabase table
const MOCK_MEDIA_ACTIVO = [
  { id:1, tipo:'Fotografía', subtipo:'Exterior',        desc:'Fachada principal',          src:'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80' },
  { id:2, tipo:'Fotografía', subtipo:'Interior',        desc:'Planta tipo — open space',   src:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80' },
  { id:3, tipo:'Fotografía', subtipo:'Interior',        desc:'Sala de reuniones',          src:'https://images.unsplash.com/photo-1497366754035-f200968a7db3?w=800&q=80' },
  { id:4, tipo:'Fotografía', subtipo:'Zonas comunes',   desc:'Lobby recepción',            src:'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80' },
  { id:5, tipo:'Fotografía', subtipo:'Fotos aéreas',    desc:'Vista aérea conjunto',       src:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80' },
  { id:6, tipo:'Plano',      subtipo:'Plano de planta', desc:'Planta tipo — distribución', src:'https://images.unsplash.com/photo-1541888846341-b14b40e47e34?w=800&q=80' },
]

// ── Date helpers for dar de baja ──
function parseDateDMY(ddmmyyyy) {
  if (!ddmmyyyy || ddmmyyyy.length < 8) return null
  const [d,m,y] = ddmmyyyy.trim().split('/').map(Number)
  if (!d||!m||!y||y<1900) return null
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}
function addYearsDMY(ddmmyyyy, years) {
  if (!ddmmyyyy || !years || isNaN(parseFloat(years))) return ''
  const [d,m,y] = ddmmyyyy.trim().split('/').map(Number)
  if (!d||!m||!y||y<1900) return ''
  const dt = new Date(y + Math.floor(parseFloat(years)), m-1, d)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}
function fromInput(yyyymmdd) { if (!yyyymmdd) return ''; const [y,m,d]=yyyymmdd.split('-'); return `${d}/${m}/${y}` }
function toInput(ddmmyyyy) { return parseDateDMY(ddmmyyyy)||'' }

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

// Paleta de colores para Disp / ofertas. DEBE coincidir con OCOLS del
// StackingPlan (FichaActivo.jsx) — si en el stacking sale verde, en el
// desglose también sale verde (mismo índice = mismo color).
const OFERTA_COLORS = [
  { bg:'#dcfce7', border:'#86efac', text:'#166534', dot:'#16a34a' }, // verde
  { bg:'#f5efe5', border:'#d4c2a0', text:'#5a4828', dot:'#8a6d40' }, // marrón
  { bg:'#fef3c7', border:'#fcd34d', text:'#92400e', dot:'#d97706' }, // ámbar
  { bg:'#f3e8ff', border:'#d8b4fe', text:'#6b21a8', dot:'#6b5b8e' }, // morado
]

const USERS_INIT = [{ name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#f5efe5', color:'#5a4828', granted:'—', owner:true }]
const TIPO_TAG = { Email:'tag-blue', Llamada:'tag-green', Reunión:'tag-purple', Tarea:'tag-gray', Visita:'tag-teal', Presentación:'tag-amber' }
const TIPO_ICO = { Email:'📧', Llamada:'', Reunión:'', Tarea:'✅', Visita:'', Presentación:'📤' }
const ACT_EST  = { Abierto:'tag-amber', Finalizado:'tag-gray', 'En curso':'tag-blue', Realizada:'tag-green' }
const SEG_ACTS = [
  { id:'ACT-OF-01', tipo:'Presentación', asunto:'Presentación oferta Albatros P1–P4 enviada a Oracle Spain',  fecha:'10/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'Finalizado' },
  { id:'ACT-OF-02', tipo:'Visita',       asunto:'Visita técnica Oracle Spain — Albatros Edif. D P2',          fecha:'15/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'Realizada'  },
  { id:'ACT-OF-03', tipo:'Email',        asunto:'Envío condiciones económicas actualizadas a Carlos Méndez',   fecha:'20/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'Finalizado' },
  { id:'ACT-OF-04', tipo:'Llamada',      asunto:'Llamada de seguimiento — confirmación interés Oracle',        fecha:'25/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'Finalizado' },
  { id:'ACT-OF-05', tipo:'Reunión',      asunto:'Reunión propietario Allianz — revisión oferta y condiciones', fecha:'28/03/2026', user:'GOMEZ Ignacio', initials:'GI', bg:'#fdf4ff', color:'#6b5b8e', estado:'Finalizado' },
  { id:'ACT-OF-06', tipo:'Email',        asunto:'Contraoferta recibida Oracle — análisis pendiente',           fecha:'02/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'En curso'   },
  { id:'ACT-OF-07', tipo:'Tarea',        asunto:'Preparar respuesta a contraoferta Oracle Spain SL',           fecha:'07/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'Abierto'    },
]

function FieldLbl({ children, req }) {
  return <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{children}{req && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}</div>
}
function ReadonlyPill({ value }) {
  return <div style={{ padding:'6px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', fontSize:12, background:'var(--gray-lt)', color:'var(--text3)', display:'flex', alignItems:'center', gap:6 }}>{value}<span style={{ marginLeft:'auto', fontSize:9, color:'var(--text4)', fontWeight:600 }}>AUTO</span></div>
}


export default function FichaOferta() {
  // Patron unificado: TODAS las ofertas pasan por el mismo render (FichaOfertaMock)
  // independientemente de si la ref viene del mock legacy o de Supabase (OFE-YYYY-NNNN).
  // La carga de datos discrimina la fuente dentro del componente; la vista es la misma.
  return <FichaOfertaMock />
}

function FichaOfertaMock() {
  const { navigate, params } = useNav()
  const [activeTab, setActiveTab] = useState(() => {
    const t = params?.tab
    return (t && TABS.includes(t)) ? t : 'of-info'
  })
  // Sincronizar si el params.tab cambia tras montar (p. ej. navegación interna)
  useEffect(() => {
    const t = params?.tab
    if (t && TABS.includes(t) && t !== activeTab) setActiveTab(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.tab])
  const [confidential, setConfidential] = useState(false)
  const [authorizedUsers, setAuthorizedUsers] = useState(USERS_INIT)
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState('')
  const [showTarea, setShowTarea] = useState(false)
  const [showNotasModal, setShowNotasModal] = useState(false)
  const [showNegociacion, setShowNegociacion] = useState(false)
  const [negOk, setNegOk] = useState(false)

  // DB state
  const [oferta, setOferta]     = useState(null)   // loaded from Supabase
  const [isMock, setIsMock]     = useState(false)  // true when showing example data
  const [saving, setSaving]     = useState(false)
  const [saveOk, setSaveOk]     = useState(false)
  const [saveErr, setSaveErr]   = useState('')
  // Modo edición: por defecto se entra a la ficha en modo "vista" (datos
  // como texto plano, sin flechas ni inputs). El usuario pulsa "✎ Editar"
  // para activar el modo edición. Tras guardar OK, vuelve a vista.
  // Patrón pensado para que el broker vea claramente qué está guardado.
  const [editing, setEditing]   = useState(false)

  // Tab 1
  // Comercialización: 3 opciones canónicas. Migramos valores legacy en el load.
  const [tipoComercializacion, setTipoComercializacion] = useState('Mandato Savills')
  const [tipologia, setTipologia] = useState('')
  const [estadoEspacio, setEstadoEspacio] = useState('')
  const [tipoOperacion, setTipoOperacion] = useState('Alquiler')
  const [origenOferta, setOrigenOferta] = useState('')
  const [modalidadVisita, setModalidadVisita] = useState('')
  const [comentarios, setComentarios] = useState('')
  const [condContractuales, setCondContractuales] = useState('')
  const [incentivosCapex, setIncentivosCapex]     = useState('')

  // ── Condiciones contractuales · campos estructurados ──
  const [tipoArrendamiento, setTipoArrendamiento] = useState('Alquiler comercial')
  const [regimenFiscal,     setRegimenFiscal]     = useState('IVA')
  const [fianzaMeses,       setFianzaMeses]       = useState(2)
  const [avalBancario,      setAvalBancario]      = useState('')
  const [indexacionAnual,   setIndexacionAnual]   = useState('IPC')
  const [pagoHonorarios,    setPagoHonorarios]    = useState('A la firma')

  // ── Incentivos y CAPEX · campos estructurados ──
  const [mesesCarencia,     setMesesCarencia]     = useState('')
  const [aportacionObras,   setAportacionObras]   = useState('')
  const [otrosIncentivos,   setOtrosIncentivos]   = useState('')

  // ── Precio de venta (cuando tipoOperacion ≠ Alquiler) ──
  const [precioMin,         setPrecioMin]         = useState('')
  const [precioMax,         setPrecioMax]         = useState('')
  const [precioVentaTotal,  setPrecioVentaTotal]  = useState('')

  // ── Mandato asociado (solo si Mandato Savills) ──
  const [mandatoAsociado,    setMandatoAsociado]    = useState(null)   // { id, ref, titulo, activos:[{nombre,direccion}] }
  const [mandatoBuscador,    setMandatoBuscador]    = useState('')
  const [showMandatoDropdown,setShowMandatoDropdown]= useState(false)
  const [mandatosDB,         setMandatosDB]         = useState([])

  // ── Colaborador asociado (solo si Colaboradores) ──
  const [colaboradorAsociado,    setColaboradorAsociado]    = useState(null) // { dynamics_id, nombre, tipo, sector }
  const [colaboradorBuscador,    setColaboradorBuscador]    = useState('')
  const [showColaboradorDropdown,setShowColaboradorDropdown]= useState(false)
  const [colaboradoresResults,   setColaboradoresResults]   = useState([])

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
    { name:'Sierra Álvaro',    team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#f5efe5', color:'#5a4828', owner:true  },
    { name:'Alonso Abruña D.', team:'Leasing MAD',       role:'Colaborador', initials:'AD', bg:'#f3e8ff', color:'#6b21a8', owner:false },
  ])
  const [addingMiembro, setAddingMiembro] = useState(false)
  const [newMiembro, setNewMiembro] = useState('')

  // Activo selector
  const [activosDB, setActivosDB] = useState([])
  const [activoSeleccionado, setActivoSeleccionado] = useState(null)
  const [loadingActivo, setLoadingActivo] = useState(false)
  const [activoBuscador, setActivoBuscador] = useState('')
  const [showActivoDropdown, setShowActivoDropdown] = useState(false)

  // Live stacking buildings (updated by StackingPlan callback)
  const liveBuildings = useRef([])
  // Debounced auto-save del stacking — mismo patrón que FichaActivo para mantener
  // consistencia funcional: edición en Oferta persiste igual que edición en Activo.
  const stackingAutoSaveTimer = useRef(null)
  // Forzamos remount del StackingPlan cuando cambia el nombre de una oferta
  // para que las unidades 'vac' arrastradas reflejen el nombre nuevo en pantalla.
  const [stackingKey, setStackingKey] = useState(0)

  // Renombrar oferta en la tabla de espacios comerciales debe propagarse a todas
  // las unidades del stacking que la referencian (capa 'arr', type='vac').
  // Sin esto, el panel izquierdo muestra el nombre nuevo pero los bloques pintan
  // el nombre antiguo, que es lo que el usuario marcó como "lío".
  const renameOferta = (id, oldName, newName) => {
    if (!newName || newName === oldName) {
      setOfertasDesglose(prev => prev.map(x => x.id === id ? { ...x, nombre: newName || x.nombre } : x))
      return
    }
    setOfertasDesglose(prev => prev.map(x => x.id === id ? { ...x, nombre: newName } : x))
    if (liveBuildings.current?.length > 0) {
      const updated = liveBuildings.current.map(b => ({
        ...b,
        arr: (b.arr || []).map(r => ({
          ...r,
          units: r.units.map(u => (u.type === 'vac' && u.oferta === oldName) ? { ...u, oferta: newName } : u),
        })),
      }))
      liveBuildings.current = updated
      if (activoSeleccionado?.ref) {
        supabase.from('activos').update({ stacking_data: updated }).eq('ref', activoSeleccionado.ref)
      }
      setStackingKey(k => k + 1)
    }
  }

  // Handlers de creación equivalentes a FichaActivo: navegan a la ficha del
  // tipo correspondiente con datos del activo vinculado prerrellenados.
  const handleStackingAddOwner = () => {
    if (!activoSeleccionado?.ref) return
    // Solo info ESTRUCTURAL del activo. Resto queda 'por completar'.
    navigate('ficha-propietario', {
      fromActivoRef:        activoSeleccionado.ref,
      fromActivoNombre:     activoSeleccionado.nombre    || '',
      fromActivoDireccion:  activoSeleccionado.direccion || '',
      fromOfertaRef:        oferta?.ref,
    })
  }
  const handleStackingAddTenant = () => {
    if (!activoSeleccionado?.ref) return
    navigate('ficha-arrendatario', {
      fromActivoRef: activoSeleccionado.ref,
      fromActivoNombre: activoSeleccionado.nombre || '',
      fromActivoZona: activoSeleccionado.zona || '',
      fromActivoSba: activoSeleccionado.sba || 0,
      fromActivoPropietario: activoSeleccionado.propietario || '',
      fromOfertaRef: oferta?.ref,
    })
  }

  // Dar de baja
  const [showDarBaja, setShowDarBaja] = useState(false)
  const [dbForm, setDbForm] = useState({ tenant:'', tenant_desconocido:false, anyo_firma:String(new Date().getFullYear()), trimestre:'Q1', fecha_inicio:'', anios_obligado:'', anios_obligado_2:'', closing_rent:'' })
  const [dbSaving, setDbSaving] = useState(false)
  const [dbErrors, setDbErrors] = useState([])
  // Motivo de baja · 'cierre' (alquilada → crea arrendatario) | 'error' (eliminar)
  const [dbMode, setDbMode] = useState(null)
  const setDbF = (k,v) => setDbForm(p => {
    const n = {...p,[k]:v}
    if (k==='fecha_inicio'||k==='anios_obligado') {
      if (n.fecha_inicio&&n.anios_obligado) { const bo=addYearsDMY(n.fecha_inicio,n.anios_obligado); if(bo) { n.break_option=bo; if(n.anios_obligado_2){const ff=addYearsDMY(bo,n.anios_obligado_2);if(ff)n.fecha_fin=ff} } }
    }
    if (k==='anios_obligado_2'||k==='break_option') {
      if (n.break_option&&n.anios_obligado_2) { const ff=addYearsDMY(n.break_option,n.anios_obligado_2); if(ff) n.fecha_fin=ff }
    }
    return n
  })

  // Tab 3 + Stacking
  const [fechaDispGlobal, setFechaDispGlobal] = useState('2026-06-01')
  const [divisibleGlobal, setDivisibleGlobal] = useState(true)
  const [supAprox, setSupAprox] = useState(false)
  const [plantaTipo, setPlantaTipo] = useState(2790)
  const [ofertasDesglose, setOfertasDesglose] = useState([
    { id:1, nombre:'Disp - ', divisible:true, supMin:null, cargasM2:3.01, ibiM2:0, fechaDisp:'' },
  ])
  const [nextOfertaId, setNextOfertaId] = useState(2)
  const [editNombreId, setEditNombreId] = useState(null)
  const [editNombreVal, setEditNombreVal] = useState('')
  // Ids de filas recién agregadas no guardadas. Bloquea "+ Agregar" hasta que se pulse "Guardar".
  const [pendingNewIds, setPendingNewIds] = useState([])
  const [savingDesglose, setSavingDesglose] = useState(false)

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

  // Arrendatarios añadidos vía conversión de oferta (aparecen en panel lateral del stacking)
  const [stackingExtraTenants, setStackingExtraTenants] = useState([])
  // Todas las ofertas del activo (la actual + hermanas) para que el StackingPlan
  // muestre TODO el contenido del activo cuando se ve desde una oferta.
  const [allOfertasActivo, setAllOfertasActivo] = useState([])
  // Propietarios persistidos del activo (mismo formato que FichaActivo) —
  // necesario para que el panel lateral del stacking muestre los propietarios
  // REALES (matcheo por prop_id), no solo el campo legacy `activo.propietario`.
  const [propietariosReg, setPropietariosReg] = useState([])
  // Arrendatarios persistidos del activo — análogo a propietariosReg
  const [arrendatariosReg, setArrendatariosReg] = useState([])

  // Multimedia de la oferta (subconjunto del activo — borrar aquí no afecta al activo)
  // Los items sincronizados llevan { synced:true, included:bool, principal:bool }
  // para que el usuario pueda toggle qué imágenes aparecen en microsite/exportaciones.
  const [imagenesOferta, setImagenesOferta] = useState([])  // { id, src, desc, subtipo, tipo, synced?, included?, principal? }
  const [planosOferta, setPlanosOferta] = useState([])
  const [showImportMedia, setShowImportMedia] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState(null)

  function syncImagenesFromActivo() {
    const sourceMedia = activoSeleccionado?.media || MOCK_MEDIA_ACTIVO
    if (!sourceMedia || sourceMedia.length === 0) {
      alert('El activo vinculado no tiene imágenes disponibles para sincronizar.')
      return
    }
    setImagenesOferta(prev => {
      // Merge: mantén included previo si ya existía; nuevas entran included:true
      const merged = sourceMedia.map(m => {
        const existing = prev.find(p => p.id === m.id)
        return {
          ...m,
          synced: true,
          included: existing ? !!existing.included : true,
          principal: m.principal ?? false,
        }
      })
      // Si ninguna está marcada como principal, marcar la primera Fotografía
      if (!merged.some(x => x.principal)) {
        const firstPhoto = merged.find(x => x.tipo === 'Fotografía')
        if (firstPhoto) firstPhoto.principal = true
      }
      return merged
    })
    setLastSyncAt(new Date())
  }

  function toggleImagenIncluded(id) {
    setImagenesOferta(prev => prev.map(i => i.id === id ? { ...i, included: !i.included } : i))
  }

  // Nombre por defecto del desglose: "{OFR-XXXXXXX} - Disp N" — N es el número
  // de la línea (1, 2, 3…). El código de la oferta padre va primero para
  // distinguir disps cuando hay varias ofertas sobre el mismo activo.
  function defaultOfertaName(n) {
    const code = oferta?.ref || 'OFR'
    return `${code} - Disp ${n}`
  }

  // Patrones de nombre auto-generado. Detecta tanto el formato nuevo
  // "{REF} - Disp N" como los legacy ("Disp N - dirección", "Oferta N").
  const isAutoName = (name) =>
    /^OFR-\d+ - Disp \d+$/.test(name) ||
    /^OFR - Disp \d+$/.test(name) ||
    name === 'Disp - ' || name === 'Disp -' ||
    /^Disp \d+ - /.test(name) || /^Disp \d+ -$/.test(name) || /^Disp \d+ - $/.test(name) ||
    /^Oferta \d+$/.test(name)

  function addOferta() {
    if (pendingNewIds.length > 0) return  // hay una fila pendiente — bloquear hasta que se guarde
    const id = nextOfertaId
    setOfertasDesglose(prev => {
      const n = prev.length + 1
      return [...prev, { id, nombre: defaultOfertaName(n), divisible:divisibleGlobal, supMin:null, cargasM2:parseFloat(gastosComunes)||0, ibiM2:parseFloat(ibi)||0, fechaDisp:fechaDispGlobal||'' }]
    })
    setNextOfertaId(id + 1)
    setPendingNewIds(prev => [...prev, id])
  }

  // Cuando se vincula/cambia el activo, refresca el nombre por defecto de las
  // filas auto-generadas, manteniendo la numeración por posición.
  useEffect(() => {
    if (!activoSeleccionado) return
    setOfertasDesglose(prev => prev.map((o, i) =>
      isAutoName(o.nombre) ? { ...o, nombre: defaultOfertaName(i + 1) } : o
    ))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activoSeleccionado?.ref, oferta?.ref])

  // Carga TODAS las ofertas activas del activo (incluida la actual). El panel
  // lateral del StackingPlan debe ser idéntico al de FichaActivo: una card por
  // oferta real del activo. Los disps NO se decomponen en el panel — eso vive
  // en la pestaña Desglose. Aquí queremos paridad visual con FichaActivo.
  useEffect(() => {
    const ref = activoSeleccionado?.ref
    if (!ref) { setAllOfertasActivo([]); return }
    supabase.from('ofertas').select('id, ref, nombre, tipo_operacion, activa')
      .eq('activo_ref', ref)
      .then(({ data }) => {
        const list = (data || []).filter(o => o.activa !== false)
        setAllOfertasActivo(list)
      })
  }, [activoSeleccionado?.ref])

  // Carga propietarios y arrendatarios del activo (mismo flujo que FichaActivo)
  useEffect(() => {
    const ref = activoSeleccionado?.ref
    if (!ref) { setPropietariosReg([]); setArrendatariosReg([]); return }
    supabase.from('propietarios').select('*').eq('activo_ref', ref).is('motivo_salida', null)
      .then(({ data }) => setPropietariosReg(data || []))
    supabase.from('arrendatarios').select('*').eq('activo_ref', ref).is('motivo_salida', null)
      .then(({ data }) => setArrendatariosReg((data || []).map(a => ({
        id: a.id, ref: a.ref, tenant: a.tenant || a.nombre,
      }))))
  }, [activoSeleccionado?.ref])

  async function guardarDesglose() {
    const ofertaId = oferta?.id
    if (!ofertaId) {
      // Sin oferta persistida aún — limpiar pending para desbloquear UI
      setPendingNewIds([])
      return
    }
    setSavingDesglose(true)
    try {
      await supabase.from('desglose_ofertas').delete().eq('oferta_id', ofertaId)
      if (ofertasDesglose.length > 0) {
        await supabase.from('desglose_ofertas').insert(
          ofertasDesglose.map((d, i) => ({
            oferta_id: ofertaId,
            nombre: d.nombre,
            divisible: d.divisible,
            sup_min: d.supMin || null,
            cargas_m2: d.cargasM2 || 0,
            ibi_m2: d.ibiM2 || 0,
            fecha_disp: d.fechaDisp || null,
            orden: i,
          }))
        )
      }
      setPendingNewIds([])
    } finally {
      setSavingDesglose(false)
    }
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

  // ── Load mandatos para el buscador (solo cuando Mandato Savills) ──
  useEffect(() => {
    if (tipoComercializacion !== 'Mandato Savills') return
    if (mandatosDB.length > 0) return
    // 1) Query base — no usa joins para evitar errores si la relación falla
    supabase.from('mandatos')
      .select('id, ref, titulo, tipo, estado')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(async ({ data, error }) => {
        if (error) { console.error('Error cargando mandatos:', error); return }
        if (!data || data.length === 0) return
        // 2) Intentar enriquecer con activos (no crítico si falla)
        let activosByMandato = {}
        try {
          const { data: rels } = await supabase
            .from('mandato_activos')
            .select('mandato_id, activos ( nombre, direccion, ciudad )')
          if (rels) {
            rels.forEach(r => {
              if (!activosByMandato[r.mandato_id]) activosByMandato[r.mandato_id] = []
              if (r.activos) activosByMandato[r.mandato_id].push(r.activos)
            })
          }
        } catch (e) { console.warn('No se pudieron cargar relaciones mandato_activos:', e) }
        const mapped = data.map(m => ({
          id: m.id,
          ref: m.ref,
          titulo: m.titulo || m.ref,
          tipo: m.tipo,
          estado: m.estado,
          activos: activosByMandato[m.id] || [],
        }))
        setMandatosDB(mapped)
      })
  }, [tipoComercializacion])

  // ── Búsqueda de cuentas para Colaboradores (debounce sobre dynamics_accounts).
  // Disponible siempre · un colaborador es típicamente competencia o un gestor
  // exclusivo del activo (no depende del tipo de comercialización).
  useEffect(() => {
    if (!colaboradorBuscador || colaboradorBuscador.length < 2) {
      setColaboradoresResults([])
      return
    }
    let cancel = false
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from('dynamics_accounts')
        .select('dynamics_id, nombre, tipo, sector')
        .ilike('nombre', `%${colaboradorBuscador}%`)
        .order('nombre')
        .limit(10)
      if (error) { console.error('Error buscando colaboradores:', error); return }
      if (!cancel) setColaboradoresResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [colaboradorBuscador])

  // ── When returning from FichaArrendatario, add tenant to left panel ──
  useEffect(() => {
    if (!params?.newTenantName) return
    const name = params.newTenantName
    setStackingExtraTenants(prev => prev.includes(name) ? prev : [...prev, name])
    // Stacking DB is already updated by FichaArrendatario — reload activo so StackingPlan remounts correctly
    if (params?.newActivoRef) {
      supabase.from('activos').select('*').eq('ref', params.newActivoRef).single()
        .then(({ data }) => { if (data) setActivoSeleccionado(data) })
    }
  }, [params?.newTenantName])

  // ── Load oferta from Supabase (chained: oferta → sub-tables) ──
  // ref puede venir como `ofertaRef` (link clásico desde listado) o `id` (cuando
  // se navega desde TransformarLeadModal o el StackingPlan tras crear una oferta).
  useEffect(() => {
    const refToLoad = params?.ofertaRef || params?.id
    if (!refToLoad) return
    supabase.from('ofertas').select('*').eq('ref', refToLoad).single()
      .then(({ data }) => {
        if (!data) {
          // Fallback: check mock OFERTAS
          const mock = MOCK_OFERTAS.find(o => o.ref === refToLoad)
          if (mock) {
            setIsMock(true)
            setOferta({ ref: mock.ref, id: null })
            if (mock.tipo_comercializacion) {
              const legacyMap = { 'Otras consultoras': 'Colaboradores', 'Mandatos hábiles': 'Mandato Savills' }
              setTipoComercializacion(legacyMap[mock.tipo_comercializacion] || mock.tipo_comercializacion)
            }
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
        if (data.tipo_comercializacion) {
          // Normalizar valores legacy a los nuevos canónicos
          const legacyMap = { 'Mandato Savills': 'Mandato Savills', 'Otras consultoras': 'Colaboradores' }
          setTipoComercializacion(legacyMap[data.tipo_comercializacion] || data.tipo_comercializacion)
        }
        if (data.tipologia)             setTipologia(data.tipologia)
        if (data.estado_espacio)        setEstadoEspacio(data.estado_espacio)
        if (data.tipo_operacion)        setTipoOperacion(data.tipo_operacion)
        if (data.origen_oferta)         setOrigenOferta(data.origen_oferta)
        if (data.modalidad_visita)      setModalidadVisita(data.modalidad_visita)
        if (data.confidencial != null)  setConfidential(data.confidencial)
        if (data.gastos_comunes != null) setGastosComunes(data.gastos_comunes)
        // Cuando la oferta nace de una transformación de lead, el equipo viene
        // en `equipo_trabajo` con shape { nombre, equipo, rol }. Lo mapeamos al
        // shape interno { name, team, role, initials, bg, color, owner }.
        // Si la oferta ya tiene `equipo` (gestión propia posterior), prevalece.
        if (data.equipo?.length) {
          setEquipoMembers(data.equipo)
        } else if (Array.isArray(data.equipo_trabajo) && data.equipo_trabajo.length > 0) {
          const palette = [
            { bg:'#f5efe5', color:'#5a4828' },
            { bg:'#f3e8ff', color:'#6b21a8' },
            { bg:'#dcfce7', color:'#166534' },
            { bg:'#fef3c7', color:'#92400e' },
            { bg:'#fee2e2', color:'#991b1b' },
          ]
          const mapped = data.equipo_trabajo.map((m, i) => {
            const name = m.nombre || m.name || ''
            const initials = name.split(' ').filter(Boolean).slice(0,2).map(s => s[0]?.toUpperCase() || '').join('') || '·'
            const p = palette[i % palette.length]
            return { name, team: m.equipo || m.team || '', role: m.rol || m.role || 'Colaborador', initials, bg: p.bg, color: p.color, owner: (m.rol || m.role) === 'Principal' }
          })
          setEquipoMembers(mapped)
        }
        if (data.colaboradores?.length) {
          setColaboradores(data.colaboradores)
          // El primer colaborador se considera el principal (asociado)
          const first = data.colaboradores[0]
          if (first && (first.dynamics_id || first.nombre || first.empresa)) {
            setColaboradorAsociado({
              dynamics_id: first.dynamics_id || null,
              nombre: first.nombre || first.empresa || '',
              tipo: first.tipo || null,
              sector: first.sector || null,
            })
          }
        }

        const ofertaId = data.id  // UUID — used for sub-table joins

        // Load activo vinculado
        if (data.activo_ref) {
          setLoadingActivo(true)
          supabase.from('activos').select('*').eq('ref', data.activo_ref).single()
            .then(({ data: a }) => {
              if (a) {
                setActivoSeleccionado(a)
                // Derive espaciosComercializables directly from stacking_data — no need for asignaciones_stacking table
                if (a.stacking_data?.length > 0) {
                  const spaces = a.stacking_data.flatMap(b =>
                    (b.arr || []).flatMap(row =>
                      row.units
                        .filter(u => u.type === 'vac' && u.oferta)
                        .map(u => ({
                          edificio: b.label || b.id,
                          modulo: `${b.id}-${row.p}`,
                          planta: row.p,
                          uso: 'Oficina',
                          sup: u.sup || 0,
                          renta: u.renta || 0,
                          ofertaNombre: u.oferta,
                        }))
                    )
                  )
                  if (spaces.length > 0) setEspaciosComercializables(spaces)
                }
              }
              setLoadingActivo(false)
            })
        }

        // Load desglose_ofertas
        supabase.from('desglose_ofertas').select('*').eq('oferta_id', ofertaId).order('orden')
          .then(({ data: d }) => {
            if (d?.length > 0) {
              setOfertasDesglose(d.map(x => ({ id: x.id, nombre: x.nombre, divisible: x.divisible, supMin: x.sup_min||null, cargasM2: x.cargas_m2||0, ibiM2: x.ibi_m2||0, fechaDisp: x.fecha_disp||'' })))
              setNextOfertaId(d.length + 1)
              setPendingNewIds([])
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
      })
  }, [params?.ofertaRef, params?.id])

  // ── Sync planta tipo from activo ──────────────────────────────
  useEffect(() => {
    if (activoSeleccionado?.sup_planta_tipo) setPlantaTipo(activoSeleccionado.sup_planta_tipo)
  }, [activoSeleccionado?.ref])

  // ── Save oferta to Supabase ────────────────────────────────────
  const dbCall = (promise, ms = 8000) => Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout — sin respuesta del servidor (8s)')), ms)),
  ])

  const handleSave = async () => {
    if (!oferta?.ref) return
    if (!activoSeleccionado?.ref) {
      setSaveErr('Debes seleccionar un Activo antes de guardar la Oferta. La Oferta cuelga obligatoriamente de un Activo.')
      return
    }
    setSaving(true); setSaveErr(''); setSaveOk(false)
    try {
      // Derivar superficie y renta desde espacios asignados
      const supDisp = espaciosComercializables.reduce((s, e) => s + (e.sup || 0), 0)
      const rentaTotal = espaciosComercializables.reduce((s, e) => s + (e.renta || 0) * (e.sup || 0), 0)
      const rentaM2 = supDisp > 0 ? Math.round((rentaTotal / supDisp) * 100) / 100 : null

      // 1. Update campos básicos — solo columnas seguras que existen siempre
      const { error } = await dbCall(supabase.from('ofertas').update({
        activo_ref:             activoSeleccionado?.ref || null,
        tipo_comercializacion:  tipoComercializacion    || null,
        tipo_operacion:         tipoOperacion           || null,
        estado:                 oferta.estado           || 'En curso',
        superficie_disponible:  supDisp || null,
        renta_m2:               rentaM2,
        // Gastos comunes / IBI: persistir el valor que el broker rellenó.
        // Sin esto, la columna gastos_comunes en la BD queda NULL y la lista
        // de Ofertas no muestra los gastos pese a haberlos rellenado en ficha.
        gastos_comunes:         parseFloat(gastosComunes) || null,
      }).eq('ref', oferta.ref))
      if (error) { setSaveErr(error.message); return }

      // 2. Intentar guardar columnas opcionales (pueden no existir aún en la tabla)
      // Compute gastos_medios / ibi_medio for the list view
      let gNum=0, gDen=0
      ofertasDesglose.forEach(o => {
        if (o.cargasM2 > 0) {
          const asSup = espaciosComercializables.filter(e => e.ofertaNombre===o.nombre).reduce((s,e)=>s+e.sup,0)
          if (asSup > 0) { gNum += o.cargasM2*asSup; gDen += asSup } else { gNum += o.cargasM2; gDen += 1 }
        }
      })
      const gastosMedios = gDen > 0 ? Math.round(gNum/gDen*100)/100 : null
      let iNum=0, iDen=0
      ofertasDesglose.forEach(o => { if (o.ibiM2 > 0) { iNum += o.ibiM2; iDen += 1 } })
      const ibiMedio = iDen > 0 ? Math.round(iNum/iDen*100)/100 : null

      await dbCall(supabase.from('ofertas').update({
        tipologia:        tipologia        || null,
        estado_espacio:   estadoEspacio    || null,
        origen_oferta:    origenOferta     || null,
        modalidad_visita: modalidadVisita  || null,
        confidencial:     confidential,
        equipo:           equipoMembers,
        // Si hay colaborador asociado vía lupa, sustituye el array (modelo nuevo).
        // Si no, conserva el array legacy.
        colaboradores: colaboradorAsociado
          ? [{ dynamics_id: colaboradorAsociado.dynamics_id, nombre: colaboradorAsociado.nombre, tipo: colaboradorAsociado.tipo, sector: colaboradorAsociado.sector }]
          : colaboradores,
        gastos_medios:    gastosMedios,
        ibi_medio:        ibiMedio,
      }).eq('ref', oferta.ref)).catch(() => {})
      // Ignorar error aquí — columnas opcionales

      // 3. Reload oferta para obtener id UUID actualizado
      const { data: refreshed } = await dbCall(supabase.from('ofertas').select('*').eq('ref', oferta.ref).single())
      if (refreshed) setOferta(refreshed)
      const ofertaId = refreshed?.id || oferta?.id
      if (!ofertaId) { setSaveOk(true); setEditing(false); setTimeout(() => setSaveOk(false), 3000); return }

      // 4. Sub-tablas
      await dbCall(supabase.from('desglose_ofertas').delete().eq('oferta_id', ofertaId)).catch(() => {})
      if (ofertasDesglose.length > 0) {
        await dbCall(supabase.from('desglose_ofertas').insert(
          ofertasDesglose.map((d, i) => ({ oferta_id: ofertaId, nombre: d.nombre, divisible: d.divisible, sup_min: d.supMin || null, cargas_m2: d.cargasM2 || 0, ibi_m2: d.ibiM2 || 0, fecha_disp: d.fechaDisp || null, orden: i }))
        )).catch(() => {})
      }

      await dbCall(supabase.from('plazas_oferta').delete().eq('oferta_id', ofertaId)).catch(() => {})
      if (plazas.length > 0) {
        await dbCall(supabase.from('plazas_oferta').insert(
          plazas.map(p => ({ oferta_id: ofertaId, int_ext: p.intExt, tipo: p.tipo, formato: p.formato, cantidad: p.cantidad, renta: p.renta ? parseFloat(p.renta) : null, precio: p.precio ? parseFloat(p.precio) : null }))
        )).catch(() => {})
      }

      if (caracteristicas) {
        await dbCall(supabase.from('caracteristicas_oferta').delete().eq('oferta_id', ofertaId)).catch(() => {})
        await dbCall(supabase.from('caracteristicas_oferta').insert(
          caracteristicas.map(c => ({ oferta_id: ofertaId, caracteristica_origen_id: c.id, tipo: c.tipo, detalle: c.detalle, anno: c.año || null, comentario: c.comentario || null, incluir: c.incluir }))
        )).catch(() => {})
      }

      // 5. Save stacking assignments
      if (liveBuildings.current.length > 0) {
        await dbCall(supabase.from('asignaciones_stacking').delete().eq('oferta_id', ofertaId)).catch(() => {})
        const assignments = liveBuildings.current.flatMap(b =>
          (b.arr || []).flatMap(row =>
            row.units
              .filter(u => u.type === 'vac' && u.oferta)
              .map(u => ({
                activo_id:  activoSeleccionado?.id || null,
                oferta_id:  ofertaId,
                edificio_id: b.id,
                planta_id:  row.p,
                sup:        u.sup || 0,
                renta:      u.renta || null,
                oferta_nombre: u.oferta || null,
              }))
          )
        )
        if (assignments.length > 0) {
          await dbCall(supabase.from('asignaciones_stacking').insert(assignments)).catch(() => {})
        }
        // Persist stacking_data to activo — this is the source of truth for visual reload
        if (activoSeleccionado?.ref) {
          const { error: sdErr } = await dbCall(supabase.from('activos').update({ stacking_data: liveBuildings.current }).eq('ref', activoSeleccionado.ref))
          if (sdErr) { setSaveErr('Error guardando stacking: ' + sdErr.message); return }
          // Update local state so returning to the stacking tab shows the saved state
          setActivoSeleccionado(prev => ({ ...prev, stacking_data: liveBuildings.current }))
        }
      }

      setPendingNewIds([])
      setSaveOk(true); setEditing(false); setTimeout(() => setSaveOk(false), 3000)
    } catch (e) {
      setSaveErr(e.message || 'Error inesperado al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Eliminar la oferta por completo: la fila de Supabase + las unidades vac
  // del stacking. Se usa cuando la oferta fue introducida por error.
  const handleEliminarOferta = async () => {
    setDbErrors([]); setDbSaving(true)
    const ofertaNombres = ofertasDesglose.map(o => o.nombre)
    try {
      // 1. Limpiar stacking: quitar units 'vac' que pertenezcan a esta oferta
      if (activoSeleccionado?.ref) {
        const { data: acData } = await supabase.from('activos').select('stacking_data').eq('ref', activoSeleccionado.ref).single()
        if (acData?.stacking_data) {
          const updated = acData.stacking_data.map(b => ({
            ...b,
            arr: (b.arr||[]).map(row => ({
              ...row,
              units: row.units.filter(u => !(u.type==='vac' && (ofertaNombres.includes(u.oferta) || u.prop_id === oferta?.ref)))
            }))
          }))
          await supabase.from('activos').update({ stacking_data: updated }).eq('ref', activoSeleccionado.ref)
        }
      }
      // 2. Borrar la fila de la oferta
      await supabase.from('ofertas').delete().eq('ref', oferta.ref)
    } catch (e) {
      setDbErrors([e.message || 'Error eliminando oferta'])
      setDbSaving(false)
      return
    }
    setDbSaving(false)
    setShowDarBaja(false)
    navigate('ofertas')
  }

  const handleDarBaja = async () => {
    const errs = []
    if (!dbForm.tenant_desconocido && !dbForm.tenant.trim()) errs.push('Tenant o marca "Desconocido"')
    if (!dbForm.fecha_inicio) errs.push('Fecha de inicio de contrato')
    if (!dbForm.anios_obligado || isNaN(parseFloat(dbForm.anios_obligado))) errs.push('Años de obligado cumplimiento')
    if (errs.length) { setDbErrors(errs); return }
    setDbErrors([]); setDbSaving(true)

    const tenantName = dbForm.tenant_desconocido ? 'Desconocido' : dbForm.tenant.trim()
    const ofertaNombres = ofertasDesglose.map(o => o.nombre)
    const supTotal = espaciosComercializables.reduce((s,e)=>s+(e.sup||0),0)
    const bo = addYearsDMY(dbForm.fecha_inicio, dbForm.anios_obligado)
    const ff = dbForm.anios_obligado_2 ? addYearsDMY(bo||dbForm.fecha_inicio, dbForm.anios_obligado_2) : bo

    // 1. Dar de baja la oferta
    await supabase.from('ofertas').update({ activa: false }).eq('ref', oferta.ref)

    // 2. Actualizar stacking: vac → ten en todas las plantas con esta oferta
    if (activoSeleccionado?.ref) {
      const { data: acData } = await supabase.from('activos').select('stacking_data').eq('ref', activoSeleccionado.ref).single()
      if (acData?.stacking_data) {
        const updated = acData.stacking_data.map(b => ({
          ...b,
          arr: (b.arr||[]).map(row => {
            const hasOffer = row.units.some(u=>u.type==='vac'&&ofertaNombres.includes(u.oferta))
            if (!hasOffer) return row
            const offerSup = row.units.filter(u=>u.type==='vac'&&ofertaNombres.includes(u.oferta)).reduce((s,u)=>s+u.sup,0)
            const withoutOffers = row.units.filter(u=>!(u.type==='vac'&&ofertaNombres.includes(u.oferta)))
            return {...row, units:[...withoutOffers,{type:'ten',n:tenantName,sup:offerSup}]}
          })
        }))
        await supabase.from('activos').update({ stacking_data: updated }).eq('ref', activoSeleccionado.ref)
      }
    }

    // 3. Crear arrendatario
    const { nextRef } = await import('../lib/nextRef')
    const arrRef = await nextRef('arrendatarios', 'ARR')
    const { data: newArr } = await supabase.from('arrendatarios').insert({
      ref: arrRef,
      nombre: tenantName,
      tenant: tenantName,
      tenant_desconocido: dbForm.tenant_desconocido,
      activo_ref: activoSeleccionado?.ref || null,
      uso: activoSeleccionado?.uso || null,
      superficie: supTotal || null,
      renta: parseFloat(dbForm.closing_rent)||oferta?.renta_m2||null,
      closing_rent: parseFloat(dbForm.closing_rent)||oferta?.renta_m2||null,
      anyo_firma: parseInt(dbForm.anyo_firma)||null,
      trimestre: dbForm.trimestre,
      inicio: parseDateDMY(dbForm.fecha_inicio),
      break_option: parseDateDMY(bo),
      vencimiento: parseDateDMY(ff),
      anios_obligado: parseFloat(dbForm.anios_obligado)||null,
      anios_obligado_2: parseFloat(dbForm.anios_obligado_2)||null,
      tipo_contrato: 'Alquiler comercial',
      meses_recordatorio: 3,
      estado_arr: 'Vigente',
      oferta_origen: oferta?.ref||null,
    }).select().single()

    setDbSaving(false)
    setShowDarBaja(false)
    navigate('ficha-arrendatario', { arrRef: newArr?.ref || arrRef })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}
      className={editing ? 'oferta-editing' : 'oferta-viewing'}>
      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn" onClick={() => navigate('ofertas')} style={{ color:'var(--text3)' }}>← Volver</button>
        <div className="ab-sep" />
        {isMock && <span style={{fontSize:11,color:'var(--amber)',background:'var(--amber-lt)',border:'1px solid var(--amber-bd)',borderRadius:'var(--r)',padding:'3px 8px',marginRight:6}}>Oferta de ejemplo · sólo lectura</span>}
        {/* Modo edición vs vista · cuando NO editas, los selects/inputs se ven como
            texto plano sin flechas. Pulsa "Editar" para modificar. */}
        {!editing ? (
          <button className="ab-btn save" onClick={() => setEditing(true)} disabled={isMock}>✎ Editar</button>
        ) : (
          <>
            <button className="ab-btn save" onClick={handleSave} disabled={saving || isMock}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
            <button className="ab-btn" onClick={() => setEditing(false)} disabled={saving}>Cancelar</button>
          </>
        )}
        <button className="ab-btn" onClick={async () => { try { if (!isMock) await handleSave() } catch(e) {} navigate('ofertas') }}>Guardar y cerrar</button>
        {saveOk  && <span style={{fontSize:11,color:'var(--green)',marginLeft:8}}>✓ Guardado</span>}
        {saveErr && <span style={{fontSize:11,color:'var(--red)',marginLeft:8}}>{saveErr}</span>}
        <button className="ab-btn">Nuevo</button>
        {!isMock && oferta?.ref && oferta?.activa !== false && (
          <button className="ab-btn" style={{color:'var(--red)',borderColor:'var(--red)'}} onClick={()=>{ setDbMode(null); setDbErrors([]); setDbForm(p=>({...p,closing_rent:oferta?.renta_m2?String(oferta.renta_m2):''})); setShowDarBaja(true) }}>Dar de baja</button>
        )}
        <div className="ab-sep" />
        <button className="ab-btn">Recalcular</button>
        <div className="ab-sep" />
        <button
          className="ab-btn"
          onClick={() => setShowNotasModal(true)}
          style={(comentarios || '').trim() ? { background:'var(--accent-lt)', borderColor:'var(--accent-bd)', color:'var(--accent)', fontWeight:700 } : undefined}
          title={(comentarios || '').trim() ? 'Ver / editar notas' : 'Añadir notas'}
        >
          📝 Notas{(comentarios || '').trim() && ' ●'}
        </button>
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
        {!isMock && oferta?.ref && oferta?.estado !== 'En negociación' && (
          <button className="ab-btn" style={{ color:'var(--amber)', borderColor:'var(--amber-bd)', background:'var(--amber-lt)' }} onClick={() => setShowNegociacion(true)}>Iniciar negociación</button>
        )}
        {negOk && <span style={{ fontSize:11, color:'var(--amber)', marginLeft:8, fontWeight:600 }}>✓ Estado actualizado: En negociación</span>}
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">
          {/* Header */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#064e3b,#10b981)' }}></div>
              <div style={{ flex:1 }}>
                <div className="ah-ref">
                  <span className="ref-badge-oferta">OFERTA</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{oferta?.ref || '—'}</span>
                  {confidential && <span style={{ background:'#1e293b',color:'#f8fafc',border:'1px solid #334155',padding:'0 7px',borderRadius:3,fontSize:9,fontWeight:700,letterSpacing:'.04em' }}>CONFIDENCIAL</span>}
                  {activoSeleccionado && (
                    <span style={{ color:'var(--text3)' }}>· Activo: <span className="pat-link" onClick={() => navigate('ficha-activo', { ref: activoSeleccionado.ref })}>{activoSeleccionado.nombre}</span></span>
                  )}
                  {activoSeleccionado && <span className="tag tag-green" style={{ fontSize:9 }}>+ Vinculado</span>}
                </div>
                <div className="ah-name">
                  {activoSeleccionado
                    ? <>📍 {activoSeleccionado.direccion || activoSeleccionado.nombre}</>
                    : <span style={{ color:'var(--text4)', fontStyle:'italic' }}>Sin activo asignado — selecciona uno en la pestaña Información</span>}
                </div>
                {activoSeleccionado && (
                  <div className="ah-addr">
                    <span style={{fontWeight:600,color:'var(--text2)'}}>{activoSeleccionado.nombre}</span>
                    <> · {activoSeleccionado.ciudad}{activoSeleccionado.zona ? ` · ${activoSeleccionado.zona}` : ''}{activoSeleccionado.subzona ? ` · ${activoSeleccionado.subzona}` : ''}</>
                  </div>
                )}
                <div className="ah-tags">
                  {activoSeleccionado?.uso && <span className="tag tag-blue">{activoSeleccionado.uso}</span>}
                  {tipoComercializacion && <span className="tag tag-purple">{tipoComercializacion}</span>}
                  {tipoOperacion && <span className="tag tag-teal">{tipoOperacion}</span>}
                  {oferta?.estado && <span className={`tag ${oferta.estado === 'En negociación' ? 'tag-amber' : 'tag-green'}`}>{oferta.estado}</span>}
                  {oferta?.dias_comercializacion > 0 && <span className="dias-pill">📅 {oferta.dias_comercializacion} días en comercialización</span>}
                </div>
              </div>
              {/* KPIs destacados a la derecha del título */}
              <div style={{ display:'flex', alignItems:'stretch', gap:0, flexShrink:0, border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', background:'var(--surface)' }}>
                {(() => {
                  const supDisp  = espaciosComercializables.reduce((s,e) => s + (e.sup||0), 0)
                  const rentaTot = espaciosComercializables.reduce((s,e) => s + (e.renta||0)*(e.sup||0), 0)
                  const rentaM2  = supDisp > 0 ? (rentaTot / supDisp) : 0
                  const items = [
                    { lbl:'Renta',         val: rentaM2 > 0 ? rentaM2.toFixed(2) : '—',                                sub:'€/m²/mes',    color:'var(--green)' },
                    { lbl:'Gastos',        val: '3,01',                                                                sub:'€/m²/mes',    color:'var(--text1)' },
                    { lbl:'Sup. disp.',    val: supDisp > 0 ? supDisp.toLocaleString('es-ES') : '—',                  sub:'m²',          color:'var(--accent)' },
                    { lbl:'Renta mensual', val: rentaTot > 0 ? Math.round(rentaTot).toLocaleString('es-ES') : '—',     sub:'€/mes',        color:'var(--green)' },
                  ]
                  return items.map((k, i) => (
                    <div key={k.lbl} style={{ padding:'10px 18px', textAlign:'center', minWidth:96, borderLeft: i === 0 ? 'none' : '1px solid var(--border)' }}>
                      <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{k.lbl}</div>
                      <div style={{ fontSize:24, fontWeight:800, fontFamily:'var(--mono)', color:k.color, lineHeight:1 }}>{k.val}</div>
                      <div style={{ fontSize:9, color:'var(--text4)', marginTop:3 }}>{k.sub}</div>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Audit + Crear ficha (PDF / PPT / Link) — bajo los KPIs */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text3)' }}>
                <Clock size={12} strokeWidth={1.75} />
                <span>Última modificación · Sierra Álvaro · {new Date().toLocaleDateString('es-ES')}</span>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="tbtn" onClick={() => window.alert('Generando ficha PDF…')}><FileText size={13} strokeWidth={1.75} /> Ficha PDF</button>
                <button className="tbtn" onClick={() => window.alert('Generando ficha PPT…')}><Presentation size={13} strokeWidth={1.75} /> Ficha PPT</button>
                <button className="tbtn" onClick={() => window.alert('Link público generado y copiado al portapapeles')}><Link2 size={13} strokeWidth={1.75} /> Link público</button>
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
                  <div className="info-pad" style={{padding:'20px 36px 4px'}}>
                    {/* ── 01 · VINCULACIONES (canónico, siempre arriba) ── */}
                    <Vinculaciones
                      cuentaLabel="Propietario (Cuenta)"
                      cuenta={activoSeleccionado?.propietario ? { id: null, nombre: activoSeleccionado.propietario } : null}
                      activo={activoSeleccionado ? { ref: activoSeleccionado.ref, nombre: activoSeleccionado.nombre, direccion: activoSeleccionado.direccion } : null}
                      oportunidad={mandatoAsociado?.dynamics_opportunity_id ? { id: mandatoAsociado.dynamics_opportunity_id, nombre: mandatoAsociado.dynamics_opportunity_id } : null}
                      instruccion={mandatoAsociado?.dynamics_instruction_id ? { id: mandatoAsociado.dynamics_instruction_id, dynamics_id: mandatoAsociado.dynamics_instruction_id } : null}
                      mandato={mandatoAsociado ? { id: mandatoAsociado.id, ref: mandatoAsociado.ref, titulo: mandatoAsociado.titulo } : null}
                    />
                  </div>

                  {/* ── 02 · EQUIPO Y COLABORADORES (50/50, justo bajo Vinculaciones) ── */}
                  <div className="info-pad" style={{padding:'0 36px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                    {/* ─ Equipo de trabajo (izquierda) ─ */}
                    <div className="va-card">
                      <div className="va-card-header">
                        <h3><span className="ico"></span> Equipo de trabajo</h3>
                        <div style={{display:'flex',gap:5}}>
                          <button className="ab-btn" onClick={() => setAddingMiembro(true)}>+ Miembro</button>
                          <button className="ab-btn">+ Equipo</button>
                        </div>
                      </div>
                      <div style={{padding:'4px 20px 16px'}}>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {(() => {
                            const responsablesActuales = equipoMembers.filter(x => x.owner)
                            // El usuario puede marcar/desmarcar Responsables solo si:
                            //  (a) ya es Responsable él mismo en este equipo, o
                            //  (b) todavía no hay ningún Responsable (caso inicial — alguien tiene que poder asignar al primero)
                            const yoSoyResponsable = responsablesActuales.some(x => (x.name || '').trim().toLowerCase() === CURRENT_USER.nombre.toLowerCase())
                            const puedoAsignar = yoSoyResponsable || responsablesActuales.length === 0
                            return equipoMembers.map((m,i) => (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                                <div style={{ width:30, height:30, borderRadius:'50%', background:m.bg, color:m.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{m.initials}</div>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:12, fontWeight:600 }}>{m.name}</div>
                                  <div style={{ fontSize:11, color:'var(--text3)' }}>{m.team}</div>
                                </div>
                                {/* Toggle Responsable: solo los Responsables actuales pueden promover/degradar.
                                    Pueden existir varios Responsables (no hay límite). */}
                                {puedoAsignar ? (
                                  <span
                                    onClick={() => setEquipoMembers(prev => prev.map((x,j) => j===i ? { ...x, owner: !x.owner } : x))}
                                    className={`tag ${m.owner ? 'tag-blue' : 'tag-gray'}`}
                                    style={{ cursor:'pointer', userSelect:'none' }}
                                    title={m.owner ? 'Click para quitar como Responsable' : 'Click para marcar como Responsable'}
                                  >
                                    {m.owner ? 'Responsable' : 'Hacer responsable'}
                                  </span>
                                ) : (
                                  m.owner ? (
                                    <span className="tag tag-blue" style={{ opacity:.85 }}>Responsable</span>
                                  ) : (
                                    <span
                                      className="tag tag-gray"
                                      style={{ opacity:.5, cursor:'not-allowed' }}
                                      title="Solo los Responsables del equipo pueden asignar nuevos Responsables"
                                    >Miembro</span>
                                  )
                                )}
                                <button onClick={() => setEquipoMembers(prev=>prev.filter((_,j)=>j!==i))} style={{ fontSize:11, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 6px', fontFamily:'inherit' }} title="Quitar del equipo">✕</button>
                              </div>
                            ))
                          })()}
                        </div>
                        {addingMiembro && (
                          <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r)', padding:12, marginTop:10 }}>
                            <FieldLbl>Usuario</FieldLbl>
                            <select className="fsel" style={{ width:'100%', marginBottom:8 }} value={newMiembro} onChange={e => setNewMiembro(e.target.value)}>
                              <option value="">Seleccionar...</option>
                              {['GOMEZ Ignacio · Leasing Oficinas MAD','García Marta · Capital Markets MAD','López Carmen · Valoraciones MAD','Martínez Rosa · Retail MAD'].map(u => <option key={u}>{u}</option>)}
                            </select>
                            <div style={{ display:'flex', gap:6 }}>
                              <button className="ab-btn save" onClick={() => {
                                if(!newMiembro)return
                                const [nameStr,teamStr]=[newMiembro.split('·')[0].trim(),newMiembro.split('·')[1]?.trim()||'']
                                const ini=nameStr.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                                setEquipoMembers(prev=>[...prev,{name:nameStr,team:teamStr,role:'Colaborador',initials:ini,bg:'#f0fdf4',color:'#166534',owner:false}])
                                setAddingMiembro(false); setNewMiembro('')
                              }}>Añadir</button>
                              <button className="ab-btn" onClick={() => { setAddingMiembro(false); setNewMiembro('') }}>Cancelar</button>
                            </div>
                          </div>
                        )}
                        <div style={{ fontSize:10, color:'var(--amber)', marginTop:10, fontStyle:'italic' }}>Solo editable por creador o manager</div>
                      </div>
                    </div>

                    {/* ─ Colaboradores (derecha) ─ */}
                    <div className="va-card" style={{ overflow:'visible' }}>
                      <div className="va-card-header">
                        <h3><span className="ico">◈</span> Colaboradores</h3>
                        <span className="hint">Consultora colaboradora (cuenta de competencia o gestor exclusivo)</span>
                      </div>
                      <div style={{padding:'8px 18px 14px'}}>
                        {colaboradorAsociado ? (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'8px 12px', border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', background:'var(--accent-lt)' }}>
                            <div>
                              <div style={{ fontWeight:600, fontSize:13, color:'var(--accent)' }}>{colaboradorAsociado.nombre}</div>
                              {(colaboradorAsociado.sector || colaboradorAsociado.tipo) && (
                                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                                  {[colaboradorAsociado.tipo, colaboradorAsociado.sector].filter(Boolean).join(' · ')}
                                </div>
                              )}
                            </div>
                            <button onClick={() => setColaboradorAsociado(null)} style={{ fontSize:11, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 6px', fontFamily:'inherit' }}>✕ Quitar</button>
                          </div>
                        ) : (
                          <div style={{ position:'relative' }}>
                            <input
                              className="of-inp"
                              placeholder="🔍 Buscar consultora colaboradora..."
                              value={colaboradorBuscador}
                              onChange={e => { setColaboradorBuscador(e.target.value); setShowColaboradorDropdown(true) }}
                              onFocus={() => setShowColaboradorDropdown(true)}
                              onBlur={() => setTimeout(() => setShowColaboradorDropdown(false), 200)}
                              style={{ width:'100%' }}
                            />
                            {showColaboradorDropdown && colaboradorBuscador.length >= 2 && (
                              <div style={{ position:'absolute', top:'100%', left:0, right:0, minWidth:340, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', boxShadow:'0 8px 24px rgba(0,0,0,.18)', zIndex:9999, maxHeight:260, overflowY:'auto', textAlign:'left', marginTop:2 }}>
                                {colaboradoresResults.length === 0 ? (
                                  <div style={{ padding:'10px 12px', color:'var(--text4)', fontSize:11 }}>Sin resultados</div>
                                ) : (
                                  colaboradoresResults.map(a => (
                                    <div key={a.dynamics_id} onMouseDown={() => {
                                      setColaboradorAsociado(a)
                                      setColaboradorBuscador('')
                                      setShowColaboradorDropdown(false)
                                    }} style={{ padding:'7px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:11 }}>
                                      <div style={{ fontWeight:600 }}>{a.nombre}</div>
                                      <div style={{ color:'var(--text4)', fontSize:10, marginTop:2 }}>
                                        {[a.tipo, a.sector].filter(Boolean).join(' · ') || a.dynamics_id}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                            {colaboradorBuscador.length > 0 && colaboradorBuscador.length < 2 && (
                              <div style={{ fontSize:10, color:'var(--text4)', marginTop:4 }}>Escribe al menos 2 caracteres para buscar.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="info-pad" style={{display:'grid',gridTemplateColumns:'1.45fr 1fr',gap:12,alignItems:'start',paddingTop:0}}>
                  <div style={{display:'flex',flexDirection:'column',gap:12,minWidth:0}}>

                    {/* ── VINCULAR ACTIVO · solo si aún no hay activo asignado.
                        Cuando hay activo, el chip del header arriba ya navega a su
                        ficha y muestra todos sus datos heredados (regla del usuario). ── */}
                    {!activoSeleccionado && (
                      <div className="va-card" style={{ overflow:'visible' }}>
                        <div className="va-card-header">
                          <h3><span className="ico" style={{color:'var(--pdb-blue)'}}>●</span> Vincular activo</h3>
                          <span className="hint">Esta oferta necesita un activo asignado</span>
                        </div>
                        <div style={{ padding:'4px 18px 14px' }}>
                          <div style={{ position:'relative', maxWidth:340, marginBottom:8 }}>
                            <input className="of-inp" placeholder="🔍 Buscar activo por nombre..." value={activoBuscador}
                              onChange={e => { setActivoBuscador(e.target.value); setShowActivoDropdown(true) }}
                              onFocus={() => setShowActivoDropdown(true)}
                              onBlur={() => setTimeout(() => setShowActivoDropdown(false), 150)} />
                            {showActivoDropdown && (
                              <div style={{ position:'absolute', top:'100%', left:0, right:0, minWidth:300, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', boxShadow:'0 8px 24px rgba(0,0,0,.18)', zIndex:9999, maxHeight:240, overflowY:'auto', textAlign:'left' }}>
                                {activosDB.filter(a => !activoBuscador || a.nombre.toLowerCase().includes(activoBuscador.toLowerCase())).slice(0,8).map(a => (
                                  <div key={a.ref} onMouseDown={() => {
                                    setActivoBuscador(''); setShowActivoDropdown(false)
                                    setLoadingActivo(true)
                                    supabase.from('activos').select('*').eq('ref', a.ref).single()
                                      .then(({ data: full }) => { setActivoSeleccionado(full || a); setLoadingActivo(false) })
                                  }} style={{ padding:'7px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:11 }}>
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
                        </div>
                      </div>
                    )}

                    {/* ── COMERCIALIZACIÓN + TIPOLOGÍA Y ESTADO ── */}
                    <div className="va-two-col" style={{ overflow:'visible' }}>
                      <div className="va-meta-card" style={{ overflow:'visible' }}>
                        <div className="va-meta-head"><span className="dot"/>Comercialización</div>
                        <div className="va-kv-list">
                          <div className="ir"><span className="ir-k">Tipología comerc. *</span><span className="ir-v">
                            <select className="of-sel" value={tipoComercializacion} onChange={e => setTipoComercializacion(e.target.value)} style={{minWidth:160}}>
                              <option>Mandato Savills</option><option>Sin mandato</option><option>Colaboradores</option>
                            </select>
                          </span></div>
                          <div className="ir"><span className="ir-k">Tipo de operación *</span><span className="ir-v">
                            <select className="of-sel" value={tipoOperacion} onChange={e => setTipoOperacion(e.target.value)} style={{minWidth:160}}>
                              <option>Alquiler</option><option>Venta</option><option>Alquiler / Venta</option>
                            </select>
                          </span></div>
                          <div className="ir"><span className="ir-k">Origen de la oferta</span><span className="ir-v">
                            <select className="of-sel" value={origenOferta} onChange={e => setOrigenOferta(e.target.value)} style={{minWidth:160}}>
                              <option value="">— Seleccionar —</option>
                              {['Demanda entrante','Prospección directa','Referencia interna','Portal web','Red de colaboradores','Otra consultora'].map(o => <option key={o}>{o}</option>)}
                            </select>
                          </span></div>
                        </div>
                        {/* Mandato asociado — bloque dedicado a ancho completo (sólo si Mandato Savills) */}
                        {tipoComercializacion === 'Mandato Savills' && (
                          <div style={{ padding:'4px 14px 12px', borderTop:'1px dashed var(--va-line2)', marginTop:4 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                              <span style={{ fontSize:11, fontWeight:600, color: mandatoAsociado ? 'var(--text3)' : 'var(--red,#dc2626)' }}>
                                Mandato asociado *
                              </span>
                              {!mandatoAsociado && (
                                <span style={{ fontSize:9, color:'var(--text4)' }}>{mandatosDB.length} mandatos disponibles</span>
                              )}
                            </div>
                            {mandatoAsociado ? (
                              <div>
                                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 10px', border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', background:'var(--accent-lt)' }}>
                                  <span style={{ fontWeight:600, color:'var(--accent)', fontSize:12 }}>{mandatoAsociado.titulo || mandatoAsociado.ref}</span>
                                  {mandatoAsociado.tipo && <span style={{ fontSize:9, color:'var(--accent)', opacity:0.7, textTransform:'uppercase' }}>· {mandatoAsociado.tipo}</span>}
                                  <button onClick={() => setMandatoAsociado(null)} style={{ fontSize:11, color:'var(--text4)', background:'none', border:'none', cursor:'pointer', padding:'0 2px' }} title="Quitar">✕</button>
                                </div>
                                {(() => {
                                  const a = mandatoAsociado.activos?.[0]
                                  if (!a) return null
                                  return (
                                    <div style={{ marginTop:6, fontSize:11, color:'var(--text3)', display:'flex', gap:6, alignItems:'baseline' }}>
                                      <span style={{ fontSize:10, color:'var(--text4)' }}>Dirección:</span>
                                      <span style={{ fontWeight:500 }}>{a.direccion || a.nombre || '—'}</span>
                                    </div>
                                  )
                                })()}
                              </div>
                            ) : (
                              <div style={{ position:'relative', width:'100%' }}>
                                <input
                                  className="of-inp"
                                  placeholder="🔍 Buscar mandato por título, ref o activo..."
                                  value={mandatoBuscador}
                                  onChange={e => { setMandatoBuscador(e.target.value); setShowMandatoDropdown(true) }}
                                  onFocus={() => setShowMandatoDropdown(true)}
                                  onBlur={() => setTimeout(() => setShowMandatoDropdown(false), 200)}
                                  style={{ width:'100%' }}
                                />
                                {showMandatoDropdown && (
                                  <div style={{ position:'absolute', top:'100%', left:0, right:0, minWidth:340, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', boxShadow:'0 8px 24px rgba(0,0,0,.18)', zIndex:9999, maxHeight:260, overflowY:'auto', textAlign:'left', marginTop:2 }}>
                                    {(()=>{
                                      const term = mandatoBuscador.toLowerCase()
                                      const filtered = mandatosDB.filter(m => !term
                                        || (m.titulo||'').toLowerCase().includes(term)
                                        || (m.ref||'').toLowerCase().includes(term)
                                        || (m.activos||[]).some(a => (a.nombre||'').toLowerCase().includes(term))
                                      )
                                      if (mandatosDB.length === 0) return <div style={{ padding:'10px 12px', color:'var(--text4)', fontSize:11 }}>Cargando mandatos…</div>
                                      if (filtered.length === 0) return <div style={{ padding:'10px 12px', color:'var(--text4)', fontSize:11 }}>Sin resultados</div>
                                      return filtered.slice(0,12).map(m => {
                                        const firstActivo = m.activos?.[0]
                                        return (
                                          <div key={m.id} onMouseDown={() => {
                                            setMandatoAsociado(m)
                                            setMandatoBuscador('')
                                            setShowMandatoDropdown(false)
                                          }} style={{ padding:'7px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:11 }}>
                                            <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'baseline' }}>
                                              <span style={{ fontWeight:600 }}>{m.titulo || m.ref}</span>
                                              {m.tipo && <span style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase' }}>{m.tipo}</span>}
                                            </div>
                                            <div style={{ color:'var(--text4)', fontSize:10, marginTop:2 }}>
                                              {m.ref}{firstActivo?.direccion ? ` · ${firstActivo.direccion}` : firstActivo?.nombre ? ` · ${firstActivo.nombre}` : ''}
                                            </div>
                                          </div>
                                        )
                                      })
                                    })()}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="va-meta-card">
                        <div className="va-meta-head accent-purple"><span className="dot"/>Tipología y estado</div>
                        <div className="va-kv-list">
                          <div className="ir"><span className="ir-k">Tipología *</span><span className="ir-v">
                            <select className="of-sel" value={tipologia} onChange={e => setTipologia(e.target.value)} style={{minWidth:160}}>
                              <option value="">— Seleccionar —</option>
                              {tipologiaOpciones.map(t => <option key={t}>{t}</option>)}
                            </select>
                          </span></div>
                          {tipologiaOpciones.length > 0 && activoSeleccionado?.uso && (
                            <div className="ir"><span className="ir-k" style={{fontStyle:'italic',fontSize:10}}>Opciones para</span><span className="ir-v" style={{fontStyle:'italic',color:'var(--text4)'}}>{activoSeleccionado.uso}</span></div>
                          )}
                          <div className="ir"><span className="ir-k">Estado del espacio</span><span className="ir-v">
                            <select className="of-sel" value={estadoEspacio} onChange={e => setEstadoEspacio(e.target.value)} style={{minWidth:160}}>
                              <option value="">— Seleccionar —</option>
                              {['Nuevo','Obra nueva','Muy buen estado','En bruto','Segunda mano','Implantado','Plug&Play','Por reformar','Amueblado','Sin amueblar'].map(o => <option key={o}>{o}</option>)}
                            </select>
                          </span></div>
                        </div>
                      </div>
                    </div>

                    {/* ── LOCALIZACIÓN ── */}
                    <div className="va-card">
                      <div className="va-card-header">
                        <h3><span className="ico" style={{color:'var(--pdb-blue)'}}>●</span> Localización</h3>
                        <span className="hint">Heredada del activo · sin edición manual</span>
                      </div>
                      <div style={{ padding:'4px 18px 16px' }}>
                        {activoSeleccionado?.direccion ? (
                          <>
                            <div style={{ borderRadius:'var(--r2)', overflow:'hidden', border:'1px solid var(--border)', height:260, marginBottom:8 }}>
                              <iframe title="Mapa oferta" width="100%" height="100%" style={{ border:0 }} loading="lazy"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(activoSeleccionado.direccion)}&z=15&output=embed`} />
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--text2)' }}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                              <span style={{ fontWeight:600 }}>{activoSeleccionado.direccion}</span>
                              {activoSeleccionado.ciudad && <span style={{ color:'var(--text4)' }}>· {activoSeleccionado.ciudad}</span>}
                              {activoSeleccionado.zona && <span style={{ color:'var(--text4)' }}>· {activoSeleccionado.zona}{activoSeleccionado.subzona ? ` / ${activoSeleccionado.subzona}` : ''}</span>}
                            </div>
                          </>
                        ) : (
                          <div style={{ borderRadius:'var(--r2)', overflow:'hidden', border:'1px solid var(--border)', height:200, background:'var(--gray-lt)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, color:'var(--text4)' }}>
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                            <div style={{ fontSize:11 }}>Selecciona un activo para ver el mapa</div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:12,minWidth:0}}>

                    {/* ── IMÁGENES ── */}
                    <div className="va-card">
                      <div className="va-card-header">
                        <h3><span className="ico"></span> Imágenes</h3>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {lastSyncAt && (
                            <span style={{ fontSize:9, color:'var(--text4)' }}>
                              Sincronizado · {lastSyncAt.toLocaleString('es-ES', { dateStyle:'short', timeStyle:'short' })}
                            </span>
                          )}
                          <button
                            className="ab-btn blue"
                            style={{ fontSize:10, padding:'4px 10px' }}
                            disabled={!activoSeleccionado}
                            onClick={syncImagenesFromActivo}
                            title={!activoSeleccionado ? 'Vincula un activo primero' : ''}
                          >
                            ↻ {imagenesOferta.length === 0 ? 'Sincronizar con imágenes del activo' : 'Re-sincronizar'}
                          </button>
                        </div>
                      </div>
                      <div style={{ padding:'4px 20px 16px' }}>
                        {imagenesOferta.length === 0 ? (
                          <div style={{ padding:'24px 16px', textAlign:'center', border:'2px dashed var(--border)', borderRadius:'var(--r2)', color:'var(--text4)', fontSize:11 }}>
                            {activoSeleccionado
                              ? 'Sin imágenes. Pulsa "Sincronizar con imágenes del activo" para importar las fotos del activo vinculado.'
                              : 'Vincula un activo primero para poder sincronizar sus imágenes.'}
                          </div>
                        ) : (
                          <>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, fontSize:10 }}>
                              <span style={{ color:'var(--text3)' }}>
                                <strong style={{ color:'var(--text2)' }}>{imagenesOferta.filter(i => i.included).length}</strong> de {imagenesOferta.length} incluidas en la oferta
                              </span>
                              <span style={{ display:'flex', gap:10 }}>
                                <button onClick={() => setImagenesOferta(prev => prev.map(i => ({ ...i, included:true })))}
                                  style={{ fontSize:10, background:'none', border:'none', color:'var(--accent)', cursor:'pointer', padding:0, fontFamily:'inherit' }}>
                                  Seleccionar todas
                                </button>
                                <button onClick={() => setImagenesOferta(prev => prev.map(i => ({ ...i, included:false })))}
                                  style={{ fontSize:10, background:'none', border:'none', color:'var(--text4)', cursor:'pointer', padding:0, fontFamily:'inherit' }}>
                                  Ninguna
                                </button>
                              </span>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:10 }}>
                              {imagenesOferta.map(m => {
                                const catColor = m.tipo === 'Plano'
                                  ? { bg:'#fef3c7', text:'#92400e' }
                                  : { bg:'#f5efe5', text:'#5a4828' }
                                return (
                                  <div key={m.id} style={{
                                    position:'relative',
                                    borderRadius:'var(--r)',
                                    overflow:'hidden',
                                    border:`1px solid ${m.included ? 'var(--accent-bd)' : 'var(--border)'}`,
                                    background:'var(--surface)',
                                    opacity: m.included ? 1 : 0.55,
                                    transition:'opacity 0.15s ease, border-color 0.15s ease',
                                  }}>
                                    <div style={{ position:'relative' }}>
                                      <img src={m.src} alt={m.desc} style={{ width:'100%', height:100, objectFit:'cover', display:'block' }} />
                                      <label style={{ position:'absolute', top:6, left:6, background:'rgba(255,255,255,0.92)', borderRadius:4, padding:'2px 4px', display:'flex', alignItems:'center', gap:3, cursor:'pointer' }}>
                                        <input
                                          type="checkbox"
                                          checked={!!m.included}
                                          onChange={() => toggleImagenIncluded(m.id)}
                                          style={{ accentColor:'var(--accent)', cursor:'pointer', width:13, height:13, margin:0 }}
                                        />
                                      </label>
                                      {m.principal && (
                                        <span style={{ position:'absolute', top:6, right:6, fontSize:8, fontWeight:700, background:'var(--accent)', color:'#fff', padding:'2px 6px', borderRadius:8, letterSpacing:0.3 }}>
                                          ★ PRINCIPAL
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ padding:'6px 8px' }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3, flexWrap:'wrap' }}>
                                        <span style={{ fontSize:8, fontWeight:700, background:catColor.bg, color:catColor.text, padding:'1px 5px', borderRadius:6, whiteSpace:'nowrap' }}>
                                          {m.subtipo || m.tipo}
                                        </span>
                                        {m.synced && (
                                          <span style={{ fontSize:8, color:'var(--green)', fontWeight:600, display:'inline-flex', alignItems:'center', gap:2, whiteSpace:'nowrap' }} title="Sincronizada desde el activo">
                                            ↻ Del activo
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize:10, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.desc}</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Stacking plan — mismo layout que FichaActivo ── */}
              {activeTab==='of-stacking' && (
                <div className="tab-content active">
                  <div className="info-pad">
                    {!activoSeleccionado && !loadingActivo ? (
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 24px',gap:12}}>
                        <div style={{fontSize:32}}>🔗</div>
                        <div style={{fontSize:14,fontWeight:600}}>Sin activo vinculado</div>
                        <div style={{fontSize:12,color:'var(--text3)',textAlign:'center'}}>Vincula un activo en la pestaña Información para ver su stacking plan.</div>
                      </div>
                    ) : loadingActivo ? (
                      <div style={{padding:'48px 24px',textAlign:'center',color:'var(--text4)',fontSize:13}}>Cargando stacking...</div>
                    ) : (
                      <>
                        {/* Header idéntico al de FichaActivo */}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                          <div>
                            <div style={{fontSize:14,fontWeight:600}}>Stacking Plan</div>
                            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>Distribución de usos, propietarios y arrendatarios por planta y edificio</div>
                          </div>
                        </div>
                        <StackingPlan
                      key={`${activoSeleccionado.ref}-${stackingKey}`}
                      initBuildings={liveBuildings.current?.length > 0 ? liveBuildings.current : (activoSeleccionado.stacking_data?.length > 0 ? activoSeleccionado.stacking_data : [])}
                      initView='arr'
                      allowCreate={true}
                      extraOfertas={allOfertasActivo.map(o => ({
                        id: o.id,
                        ref: o.ref,
                        nombre: o.nombre || o.ref,
                        tipoOperacion: o.tipo_operacion || 'Alquiler',
                      }))}
                      activoPropietario={activoSeleccionado.propietario || ''}
                      extraOwners={propietariosReg.length > 0
                        ? propietariosReg.map(p => ({ id: p.id, name: p.propietario }))
                        : [activoSeleccionado.propietario].filter(Boolean)
                      }
                      extraTenants={[
                        ...arrendatariosReg.map(a => ({ ref: a.ref, name: a.tenant })),
                        ...stackingExtraTenants,
                      ]}
                      defaultLabel={activoSeleccionado.nombre || ''}
                      defaultSupPlantaTipo={activoSeleccionado.sup_planta_tipo || undefined}
                      onAddOwner={handleStackingAddOwner}
                      onAddTenant={handleStackingAddTenant}
                      onTenantClick={(name) => navigate('ficha-arrendatario', {
                        tenantName: name,
                        fromActivoRef: activoSeleccionado?.ref,
                        fromActivoNombre: activoSeleccionado?.nombre || '',
                      })}
                      onConvertToTenant={async (unit, floorId, idx) => {
                        // Remove the offer unit — guaranteed save before navigating
                        const updatedBlds = liveBuildings.current.map(b => ({
                          ...b,
                          arr: (b.arr||[]).map(r => r.p !== floorId ? r : { ...r, units: r.units.filter((_,i) => i !== idx) })
                        }))
                        liveBuildings.current = updatedBlds
                        setEspaciosComercializables(prev => prev.filter(e => !(e.planta === floorId && e.ofertaNombre === unit.oferta)))
                        if (activoSeleccionado?.ref) {
                          // AWAIT — ensures FichaArrendatario reads stacking without the offer unit
                          await supabase.from('activos').update({ stacking_data: updatedBlds }).eq('ref', activoSeleccionado.ref)
                          setActivoSeleccionado(prev => prev ? { ...prev, stacking_data: updatedBlds } : prev)
                        }
                        // Solo pasamos info estructural del activo. Tenant/sup/renta NO
                        // se pre-rellenan: el usuario debe completarlos manualmente.
                        navigate('ficha-arrendatario', {
                          fromOfertaRef:        oferta?.ref,
                          fromActivoRef:        activoSeleccionado?.ref,
                          fromActivoNombre:     activoSeleccionado?.nombre || '',
                          fromActivoDireccion:  activoSeleccionado?.direccion || '',
                          fromActivoPropietario:activoSeleccionado?.propietario || '',
                          fromFloorId:          floorId,
                        })
                      }}
                      onBuildingsChange={(blds) => {
                        liveBuildings.current = blds
                        const newEspacios = blds.flatMap(b =>
                          (b.arr || []).flatMap(row =>
                            row.units
                              .filter(u => u.type === 'vac' && u.oferta)
                              .map(u => ({
                                edificio: b.label || b.id,
                                modulo: `${b.id}-${row.p}`,
                                planta: row.p,
                                uso: 'Oficina',
                                sup: u.sup || 0,
                                renta: u.renta || 0,
                                ofertaNombre: u.oferta,
                              }))
                          )
                        )
                        setEspaciosComercializables(newEspacios)
                        // Auto-save del stacking_data al activo (debounce 1.5 s) — mismo patrón
                        // que FichaActivo. Mantiene la consistencia: edición desde Oferta
                        // persiste igual que edición desde Activo.
                        if (activoSeleccionado?.ref) {
                          clearTimeout(stackingAutoSaveTimer.current)
                          stackingAutoSaveTimer.current = setTimeout(() => {
                            supabase.from('activos').update({ stacking_data: blds }).eq('ref', activoSeleccionado.ref)
                            setActivoSeleccionado(prev => prev ? { ...prev, stacking_data: blds } : prev)
                          }, 1500)
                        }
                      }}
                    />
                      </>
                    )}
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
                      </div>

                      {/* Derecha */}
                      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        {/* Desglose de ofertas */}
                        <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border)', background:'var(--gray-lt)' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Desglose de ofertas</div>
                              {pendingNewIds.length > 0 && (
                                <span style={{ fontSize:11, color:'var(--orange,#c97a00)', fontWeight:700, background:'rgba(201,122,0,0.08)', padding:'3px 9px', borderRadius:10 }}>Sin guardar</span>
                              )}
                            </div>
                            <div style={{ display:'flex', gap:6 }}>
                              {pendingNewIds.length > 0 && (
                                <button
                                  className="ab-btn green"
                                  style={{ fontSize:10, padding:'3px 10px' }}
                                  disabled={savingDesglose}
                                  onClick={guardarDesglose}
                                >{savingDesglose ? 'Guardando…' : 'Guardar'}</button>
                              )}
                              <button
                                className="ab-btn blue"
                                style={{ fontSize:10, padding:'3px 10px', opacity: pendingNewIds.length > 0 ? 0.45 : 1, cursor: pendingNewIds.length > 0 ? 'not-allowed' : 'pointer' }}
                                onClick={addOferta}
                                disabled={pendingNewIds.length > 0}
                                title={pendingNewIds.length > 0 ? 'Guarda la oferta pendiente antes de agregar otra' : ''}
                              >+ Agregar</button>
                            </div>
                          </div>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                            <thead><tr>
                              {['Nombre área','Sup. asignada','Divisible','Sup. mín.','Gastos €/m²','IBI €/m²','Fecha disp.','Plantas asignadas',''].map(h =>
                                <th key={h} style={{ padding:'10px 14px', fontSize:10.5, fontWeight:700, color:'var(--text4)', textAlign:'left', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap', letterSpacing:'.04em' }}>{h}</th>
                              )}
                            </tr></thead>
                            <tbody>
                              {ofertasDesglose.map((o,idx) => {
                                const col = OFERTA_COLORS[idx % OFERTA_COLORS.length]
                                const assignedSpaces = espaciosComercializables.filter(e => e.ofertaNombre === o.nombre)
                                const assignedSup = assignedSpaces.reduce((s,e) => s + e.sup, 0)
                                return (
                                  <tr key={o.id} style={{ borderBottom:'1px solid var(--border)' }}>
                                    <td style={{ padding:'10px 14px' }}>
                                      {editNombreId===o.id
                                        ? <input autoFocus value={editNombreVal} onChange={e => setEditNombreVal(e.target.value)}
                                            onBlur={() => { renameOferta(o.id, o.nombre, editNombreVal); setEditNombreId(null) }}
                                            onKeyDown={e => { if(e.key==='Enter'){ renameOferta(o.id, o.nombre, editNombreVal); setEditNombreId(null) } }}
                                            style={{ fontSize:13, border:'1px solid var(--accent)', borderRadius:4, padding:'4px 8px', fontFamily:'inherit', width:200 }} />
                                        : <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                            <div style={{ width:10, height:10, borderRadius:'50%', background:col.dot, flexShrink:0 }} />
                                            <span className="pat-link" style={{ fontSize:13, fontWeight:600 }} onClick={() => { setEditNombreId(o.id); setEditNombreVal(o.nombre) }}>{o.nombre}</span>
                                          </div>
                                      }
                                    </td>
                                    <td style={{ padding:'10px 14px', fontFamily:'var(--mono)', fontWeight:700, fontSize:13 }}>{assignedSup>0?assignedSup.toLocaleString()+' m²':<span style={{ color:'var(--text4)' }}>—</span>}</td>
                                    <td style={{ padding:'10px 14px' }}>
                                      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                                        <input type="checkbox" checked={!!o.divisible} onChange={() => setOfertasDesglose(prev=>prev.map(x=>x.id===o.id?{...x,divisible:!x.divisible,supMin:!x.divisible?x.supMin:null}:x))} style={{ accentColor:'var(--accent)', cursor:'pointer', width:14, height:14 }} />
                                        <span style={{ fontSize:12, fontWeight:600, color:o.divisible?'var(--green)':'var(--text4)' }}>{o.divisible?'Sí':'No'}</span>
                                      </label>
                                    </td>
                                    <td style={{ padding:'10px 14px' }}>
                                      {o.divisible
                                        ? <input type="number" value={o.supMin||''} onChange={e => setOfertasDesglose(prev=>prev.map(x=>x.id===o.id?{...x,supMin:parseFloat(e.target.value)||null}:x))}
                                            placeholder="m² mín." style={{ width:84, padding:'5px 8px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'var(--mono)', background:'var(--surface)' }} />
                                        : <span style={{ color:'var(--text4)', fontSize:12 }}>Total</span>
                                      }
                                    </td>
                                    <td style={{ padding:'8px 10px' }}>
                                      <input type="number" step="0.01" value={o.cargasM2||''} onChange={e => setOfertasDesglose(prev=>prev.map(x=>x.id===o.id?{...x,cargasM2:parseFloat(e.target.value)||0}:x))}
                                        placeholder="0,00" style={{ width:80, padding:'5px 8px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'var(--mono)', background:'var(--surface)' }} />
                                    </td>
                                    <td style={{ padding:'8px 10px' }}>
                                      <input type="number" step="0.01" value={o.ibiM2||''} onChange={e => setOfertasDesglose(prev=>prev.map(x=>x.id===o.id?{...x,ibiM2:parseFloat(e.target.value)||0}:x))}
                                        placeholder="0,00" style={{ width:80, padding:'5px 8px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'var(--mono)', background:'var(--surface)' }} />
                                    </td>
                                    <td style={{ padding:'8px 10px' }}>
                                      <input type="date" value={o.fechaDisp||''} onChange={e => setOfertasDesglose(prev=>prev.map(x=>x.id===o.id?{...x,fechaDisp:e.target.value}:x))}
                                        style={{ fontSize:12, padding:'5px 8px', border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', background:'var(--surface)', color: o.fechaDisp?'var(--text2)':'var(--text4)' }} />
                                    </td>
                                    <td style={{ padding:'10px 14px' }}>
                                      {assignedSpaces.length>0
                                        ? <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                            {assignedSpaces.map(e=><span key={e.modulo} style={{ fontSize:11, background:col.bg, color:col.text, border:`1px solid ${col.border}`, borderRadius:10, padding:'2px 8px', fontWeight:700 }}>{e.planta}</span>)}
                                          </div>
                                        : <span style={{ fontSize:12, color:'var(--text4)', fontStyle:'italic' }}>Sin asignar</span>
                                      }
                                    </td>
                                    <td style={{ padding:'10px 14px' }}>
                                      <div style={{ display:'flex', gap:5 }}>
                                        <button className="ra p" style={{ fontSize:13 }} onClick={() => { setEditNombreId(o.id); setEditNombreVal(o.nombre) }}>✎</button>
                                        <button className="ra" style={{ fontSize:13 }} onClick={() => { setOfertasDesglose(prev=>prev.filter(x=>x.id!==o.id)); setPendingNewIds(prev => prev.filter(x => x !== o.id)) }}>✕</button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                              {ofertasDesglose.length===0 && <tr><td colSpan={9} style={{ padding:24, textAlign:'center', color:'var(--text4)', fontSize:13, fontStyle:'italic' }}>Sin áreas. Pulsa "+ Agregar".</td></tr>}
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
                              <div style={{ fontSize:20, marginBottom:8 }}></div>
                              <div style={{ fontWeight:600, marginBottom:4 }}>Sin espacios asignados</div>
                              <div style={{ fontSize:11 }}>Ve a la pestaña <strong>Stacking plan</strong> y arrastra la oferta sobre las plantas disponibles.</div>
                            </div>
                          ) : (() => {
                            const ventaMode = tipoOperacion === 'Venta'
                            const headers = ventaMode
                              ? ['Edificio','Planta','Sup. (m²)','Precio €/m²','Precio total','Área']
                              : ['Edificio','Planta','Sup. (m²)','Renta €/m²/mes','Renta mensual','Área']
                            return (
                              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                                <thead><tr>
                                  {headers.map(h =>
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
                            )
                          })()}
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

              {/* Condiciones · integrado dentro de Espacios comerciales
                  (regla del usuario · ya no es un tab independiente). */}
              {activeTab==='of-espacios' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 16px', paddingTop:14, borderTop:'2px solid var(--border)' }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, flexShrink:0 }}>€</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Condiciones de la oferta</div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Económicas, contractuales e incentivos · derivado de los espacios comerciales de arriba</div>
                    </div>
                  </div>
                  {(()=>{
                    const isVenta   = tipoOperacion === 'Venta'
                    const isAlquiler = tipoOperacion === 'Alquiler' || tipoOperacion === 'Alquiler / Venta'
                    // Mismas fórmulas — etiqueta dinámica según operación
                    const rentaSpaces = espaciosComercializables.filter(e=>e.renta>0)
                    const valMax = rentaSpaces.length>0 ? Math.max(...rentaSpaces.map(e=>e.renta)) : null
                    const valMin = rentaSpaces.length>0 ? Math.min(...rentaSpaces.map(e=>e.renta)) : null
                    const supConVal = rentaSpaces.reduce((s,e)=>s+e.sup,0)
                    const valMedia = supConVal>0 ? rentaSpaces.reduce((s,e)=>s+e.renta*e.sup,0)/supConVal : null
                    const totalAlquiler = espaciosComercializables.reduce((s,e)=>s+(e.renta||0)*e.sup,0)
                    const totalVenta    = espaciosComercializables.reduce((s,e)=>s+(e.renta||0)*e.sup,0)
                    const withGastos = ofertasDesglose.filter(o=>o.cargasM2>0)
                    const gastosMax = withGastos.length>0 ? Math.max(...withGastos.map(o=>o.cargasM2)) : null
                    const gastosMin = withGastos.length>0 ? Math.min(...withGastos.map(o=>o.cargasM2)) : null
                    let gNum=0, gDen=0
                    ofertasDesglose.forEach(o=>{
                      if(o.cargasM2>0){
                        const asSup=espaciosComercializables.filter(e=>e.ofertaNombre===o.nombre).reduce((s,e)=>s+e.sup,0)
                        if(asSup>0){gNum+=o.cargasM2*asSup;gDen+=asSup}else{gNum+=o.cargasM2;gDen+=1}
                      }
                    })
                    const gastosMedia = gDen>0 ? gNum/gDen : null
                    const withIbi = ofertasDesglose.filter(o=>o.ibiM2>0)
                    const ibiMax = withIbi.length>0?Math.max(...withIbi.map(o=>o.ibiM2)):null
                    const ibiMin = withIbi.length>0?Math.min(...withIbi.map(o=>o.ibiM2)):null
                    const unitMes = '€/m²/mes'
                    const unitVenta = '€/m²'
                    return (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, alignItems:'start' }}>
                      {/* ── COLUMNA IZQUIERDA · Renta/Precio + Gastos+IBI ── */}
                      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        {/* ── ECONÓMICAS · RENTA o PRECIO ── */}
                        <div className="va-card">
                          <div className="va-card-header">
                            <h3><span className="ico" style={{color:'var(--green)'}}>●</span> {isVenta ? 'Precio de venta' : 'Renta'}</h3>
                            <span className="hint">{isVenta ? 'Importes en €/m²' : 'Calculada desde el Stacking Plan'}</span>
                          </div>
                          {isVenta ? (
                            <div style={{ padding:'8px 18px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px', rowGap:8 }}>
                              <div>
                                <FieldLbl>Precio mínimo (€/m²)</FieldLbl>
                                <input type="number" className="of-inp" value={precioMin} onChange={e=>setPrecioMin(e.target.value)} placeholder="0" />
                              </div>
                              <div>
                                <FieldLbl>Precio máximo (€/m²)</FieldLbl>
                                <input type="number" className="of-inp" value={precioMax} onChange={e=>setPrecioMax(e.target.value)} placeholder="0" />
                              </div>
                              <div style={{ gridColumn:'1 / -1' }}>
                                <FieldLbl>Precio total (€)  <span style={{fontSize:9,color:'var(--text4)',fontWeight:500}}>opcional</span></FieldLbl>
                                <input type="number" className="of-inp" value={precioVentaTotal} onChange={e=>setPrecioVentaTotal(e.target.value)} placeholder="0" />
                              </div>
                              <div className="ir" style={{ gridColumn:'1 / -1', borderTop:'1px solid var(--va-line2)', paddingTop:8 }}>
                                <span className="ir-k">Precio medio asignado</span>
                                <span className="ir-v" style={{ fontFamily:'var(--mono)', color:'var(--green)', fontWeight:700 }}>{valMedia!=null?`${valMedia.toFixed(2)} ${unitVenta}`:'—'}</span>
                              </div>
                              {totalVenta > 0 && (
                                <div className="ir" style={{ gridColumn:'1 / -1' }}>
                                  <span className="ir-k">Total proyectado (sup × precio €/m²)</span>
                                  <span className="ir-v" style={{ fontFamily:'var(--mono)', fontWeight:700 }}>{totalVenta.toLocaleString(undefined,{maximumFractionDigits:0})} €</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="va-kv-list" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px', paddingBottom:16 }}>
                              <div className="ir"><span className="ir-k">Renta media ({unitMes})</span><span className="ir-v" style={{ fontFamily:'var(--mono)', color:'var(--green)', fontWeight:700, fontSize:14 }}>{valMedia!=null?`${valMedia.toFixed(2)} €`:'—'}</span></div>
                              <div className="ir"><span className="ir-k">Renta mín. / máx. ({unitMes})</span><span className="ir-v" style={{ fontFamily:'var(--mono)' }}>{valMin!=null?`${valMin.toFixed(2)} — ${valMax.toFixed(2)} €`:'—'}</span></div>
                              <div className="ir" style={{ gridColumn:'1 / -1' }}><span className="ir-k">Renta mensual total</span><span className="ir-v" style={{ fontFamily:'var(--mono)', color:'var(--green)', fontWeight:700 }}>{totalAlquiler>0?`${totalAlquiler.toLocaleString(undefined,{maximumFractionDigits:0})} €`:'—'}</span></div>
                            </div>
                          )}
                        </div>

                        {/* ── ECONÓMICAS · GASTOS / IBI ── */}
                        <div className="va-card">
                          <div className="va-card-header">
                            <h3><span className="ico"></span> Gastos e IBI</h3>
                            <span className="hint">{isVenta ? 'IBI anual · gastos opcionales' : 'Desde el desglose de ofertas'}</span>
                          </div>
                          <div className="va-kv-list" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px', paddingBottom:14 }}>
                            <div className="ir"><span className="ir-k">Gastos medios ({isVenta ? unitVenta : unitMes})</span><span className="ir-v" style={{ fontFamily:'var(--mono)' }}>{gastosMedia!=null?`${gastosMedia.toFixed(2)} €`:'—'}</span></div>
                            <div className="ir"><span className="ir-k">Gastos mín. / máx.</span><span className="ir-v" style={{ fontFamily:'var(--mono)' }}>{gastosMin!=null?`${gastosMin.toFixed(2)} — ${gastosMax.toFixed(2)} €`:'—'}</span></div>
                            <div className="ir" style={{ gridColumn:'1 / -1' }}><span className="ir-k">{isVenta ? 'IBI anual mín. / máx. (€)' : `IBI mín. / máx. (${unitMes})`}</span><span className="ir-v" style={{ fontFamily:'var(--mono)' }}>{ibiMin!=null?`${ibiMin.toFixed(2)} — ${ibiMax.toFixed(2)} €`:'—'}</span></div>
                          </div>
                          {!isVenta && (
                            <div style={{ padding:'0 18px 16px' }}>
                              <label style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'9px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)', cursor:'pointer' }}>
                                <input type="checkbox" checked={gastosIncluidos} onChange={e => setGastosIncluidos(e.target.checked)} style={{ accentColor:'var(--accent)', marginTop:1 }} />
                                <div>
                                  <div style={{ fontSize:12, fontWeight:600 }}>Gastos incluidos en renta</div>
                                  <div style={{ fontSize:10, color:'var(--text4)', marginTop:2 }}>{gastosIncluidos ? 'Los importes son informativos (ya incluidos en la renta)' : 'Los importes son adicionales a la renta'}</div>
                                </div>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── COLUMNA DERECHA · Condiciones contractuales + Incentivos ── */}
                      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        {/* Condiciones contractuales · estructurado */}
                        <div className="va-meta-card">
                          <div className="va-meta-head"><span className="dot"/>Condiciones contractuales</div>
                          <div style={{ padding:'10px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 14px' }}>
                            <div>
                              <FieldLbl>Tipo de arrendamiento</FieldLbl>
                              <select className="of-sel" value={tipoArrendamiento} onChange={e=>setTipoArrendamiento(e.target.value)} style={{ width:'100%' }}>
                                {['Alquiler comercial','Uso distinto de vivienda','Vivienda habitual','Temporada','Industria','Otro'].map(o => <option key={o}>{o}</option>)}
                              </select>
                            </div>
                            <div>
                              <FieldLbl>Régimen fiscal</FieldLbl>
                              <select className="of-sel" value={regimenFiscal} onChange={e=>setRegimenFiscal(e.target.value)} style={{ width:'100%' }}>
                                {['IVA','Exento de IVA','Sujeto y exento','ITP','Otro'].map(o => <option key={o}>{o}</option>)}
                              </select>
                            </div>
                            <div>
                              <FieldLbl>Fianza legal (meses)</FieldLbl>
                              <input type="number" min="0" step="1" className="of-inp" value={fianzaMeses} onChange={e=>setFianzaMeses(e.target.value)} placeholder="0" />
                            </div>
                            <div>
                              <FieldLbl>Aval bancario (meses o €)</FieldLbl>
                              <input className="of-inp" value={avalBancario} onChange={e=>setAvalBancario(e.target.value)} placeholder="Ej. 6 meses · 100.000 €" />
                            </div>
                            <div>
                              <FieldLbl>Indexación anual</FieldLbl>
                              <select className="of-sel" value={indexacionAnual} onChange={e=>setIndexacionAnual(e.target.value)} style={{ width:'100%' }}>
                                {['IPC','Fijo','Escalonado','Otro','Sin indexación'].map(o => <option key={o}>{o}</option>)}
                              </select>
                            </div>
                            <div>
                              <FieldLbl>Pago de honorarios a la firma</FieldLbl>
                              <input className="of-inp" value={pagoHonorarios} onChange={e=>setPagoHonorarios(e.target.value)} placeholder="Ej. A la firma · 1 mensualidad" />
                            </div>
                          </div>
                        </div>

                        {/* Incentivos y CAPEX · estructurado */}
                        <div className="va-meta-card">
                          <div className="va-meta-head accent-purple"><span className="dot"/>Incentivos y CAPEX</div>
                          <div style={{ padding:'10px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 14px' }}>
                            <div>
                              <FieldLbl>Meses de carencia</FieldLbl>
                              <input type="number" min="0" step="1" className="of-inp" value={mesesCarencia} onChange={e=>setMesesCarencia(e.target.value)} placeholder="0" />
                            </div>
                            <div>
                              <FieldLbl>Aportación obras / CAPEX (€)</FieldLbl>
                              <input type="number" min="0" step="1000" className="of-inp" value={aportacionObras} onChange={e=>setAportacionObras(e.target.value)} placeholder="0" />
                            </div>
                            <div style={{ gridColumn:'1 / -1' }}>
                              <FieldLbl>Otros incentivos</FieldLbl>
                              <textarea className="of-textarea" value={otrosIncentivos} onChange={e=>setOtrosIncentivos(e.target.value)}
                                placeholder="Mejoras pactadas, mobiliario incluido, escalado de rentas, otras condiciones negociables..."
                                style={{ width:'100%', minHeight:64, resize:'vertical', fontSize:12, lineHeight:1.5 }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )
                  })()}
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
                      <div style={{ fontSize:32 }}></div>
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
                            <th style={{ padding:'7px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'center', background:'var(--gray-lt)', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap', width:60 }}>
                              {(()=>{
                                const all = caracteristicas.every(c=>c.incluir)
                                const none = caracteristicas.every(c=>!c.incluir)
                                return <input type="checkbox" checked={all} ref={el => { if(el) el.indeterminate = !all && !none }} onChange={() => setCaracteristicas(prev=>prev.map(c=>({...c,incluir:!all})))} style={{ accentColor:'var(--accent)', width:15, height:15, cursor:'pointer' }} title={all?'Deseleccionar todas':'Seleccionar todas'} />
                              })()}
                            </th>
                            {['Tipo','Detalle','Año','Comentario'].map(h =>
                              <th key={h} style={{ padding:'7px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', background:'var(--gray-lt)', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
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
                <div className="tab-content active"><div className="info-pad" style={{ display:'flex', flexDirection:'column', gap:24 }}>
                  {/* Documentos */}
                  <div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>Documentos</div><button className="ab-btn blue">↑ Cargar</button>
                    </div>
                    <table className="doc-table"><thead><tr><th>Documento</th><th>Tipo</th><th>Fecha</th></tr></thead>
                    <tbody>
                      <tr><td><span className="doc-link">Dossier Albatros</span></td><td><span className="tag tag-blue">Comercial</span></td><td>05/11/2024</td></tr>
                      <tr><td><span className="doc-link">Ficha técnica Edif. D</span></td><td><span className="tag tag-teal">Técnica</span></td><td>05/11/2024</td></tr>
                    </tbody></table>
                  </div>

                  {/* Fotografías */}
                  <div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600 }}>Fotografías</div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Imágenes vinculadas a esta oferta · eliminar aquí no afecta al activo</div>
                      </div>
                      <button className="ab-btn blue" style={{ fontSize:10 }} onClick={() => setShowImportMedia(v => v==='fotos'?false:'fotos')}>↩ Importar del activo</button>
                    </div>
                    {showImportMedia==='fotos' && (
                      <div style={{ border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', background:'var(--accent-lt)', padding:12, marginBottom:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', marginBottom:8 }}>Selecciona las imágenes del activo a incluir en esta oferta:</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
                          {(activoSeleccionado?.media?.filter(m=>m.tipo==='Fotografía') || MOCK_MEDIA_ACTIVO.filter(m=>m.tipo==='Fotografía')).map(m => {
                            const already = imagenesOferta.some(i=>i.id===m.id)
                            return (
                              <div key={m.id} style={{ position:'relative', borderRadius:'var(--r)', overflow:'hidden', border:`2px solid ${already?'var(--accent)':'var(--border)'}`, cursor:'pointer' }}
                                onClick={() => {
                                  if (already) setImagenesOferta(prev=>prev.filter(i=>i.id!==m.id))
                                  else setImagenesOferta(prev=>[...prev,m])
                                }}>
                                <img src={m.src} alt={m.desc} style={{ width:'100%', height:90, objectFit:'cover', display:'block' }} />
                                <div style={{ padding:'3px 6px', fontSize:9, color:'var(--text3)', background:'var(--surface)' }}>{m.desc}</div>
                                {already && <div style={{ position:'absolute', top:4, right:4, background:'var(--accent)', color:'#fff', borderRadius:10, fontSize:9, fontWeight:700, padding:'1px 6px' }}>✓</div>}
                              </div>
                            )
                          })}
                        </div>
                        <button className="ab-btn save" style={{ marginTop:10, fontSize:10 }} onClick={() => setShowImportMedia(false)}>Confirmar selección</button>
                      </div>
                    )}
                    {imagenesOferta.length === 0 ? (
                      <div style={{ padding:'24px 16px', textAlign:'center', border:'2px dashed var(--border)', borderRadius:'var(--r2)', color:'var(--text4)', fontSize:12 }}>
                        Sin fotografías. Importa desde el activo para añadir imágenes a esta oferta.
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
                        {imagenesOferta.map(m => (
                          <div key={m.id} style={{ position:'relative', borderRadius:'var(--r)', overflow:'hidden', border:'1px solid var(--border)' }}>
                            <img src={m.src} alt={m.desc} style={{ width:'100%', height:110, objectFit:'cover', display:'block' }} />
                            <div style={{ padding:'4px 8px', fontSize:10, color:'var(--text2)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.desc}</span>
                              <button onClick={() => setImagenesOferta(prev=>prev.filter(i=>i.id!==m.id))} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:12, lineHeight:1, padding:'0 0 0 4px', flexShrink:0 }}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Planos */}
                  <div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600 }}>Planos</div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Planos vinculados a esta oferta · eliminar aquí no afecta al activo</div>
                      </div>
                      <button className="ab-btn blue" style={{ fontSize:10 }} onClick={() => setShowImportMedia(v => v==='planos'?false:'planos')}>↩ Importar del activo</button>
                    </div>
                    {showImportMedia==='planos' && (
                      <div style={{ border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', background:'var(--accent-lt)', padding:12, marginBottom:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', marginBottom:8 }}>Selecciona los planos del activo a incluir en esta oferta:</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
                          {(activoSeleccionado?.media?.filter(m=>m.tipo==='Plano') || MOCK_MEDIA_ACTIVO.filter(m=>m.tipo==='Plano')).map(m => {
                            const already = planosOferta.some(i=>i.id===m.id)
                            return (
                              <div key={m.id} style={{ position:'relative', borderRadius:'var(--r)', overflow:'hidden', border:`2px solid ${already?'var(--accent)':'var(--border)'}`, cursor:'pointer' }}
                                onClick={() => {
                                  if (already) setPlanosOferta(prev=>prev.filter(i=>i.id!==m.id))
                                  else setPlanosOferta(prev=>[...prev,m])
                                }}>
                                <img src={m.src} alt={m.desc} style={{ width:'100%', height:90, objectFit:'cover', display:'block' }} />
                                <div style={{ padding:'3px 6px', fontSize:9, color:'var(--text3)', background:'var(--surface)' }}>{m.desc}</div>
                                {already && <div style={{ position:'absolute', top:4, right:4, background:'var(--accent)', color:'#fff', borderRadius:10, fontSize:9, fontWeight:700, padding:'1px 6px' }}>✓</div>}
                              </div>
                            )
                          })}
                        </div>
                        <button className="ab-btn save" style={{ marginTop:10, fontSize:10 }} onClick={() => setShowImportMedia(false)}>Confirmar selección</button>
                      </div>
                    )}
                    {planosOferta.length === 0 ? (
                      <div style={{ padding:'24px 16px', textAlign:'center', border:'2px dashed var(--border)', borderRadius:'var(--r2)', color:'var(--text4)', fontSize:12 }}>
                        Sin planos. Importa desde el activo para añadir planos a esta oferta.
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
                        {planosOferta.map(m => (
                          <div key={m.id} style={{ position:'relative', borderRadius:'var(--r)', overflow:'hidden', border:'1px solid var(--border)' }}>
                            <img src={m.src} alt={m.desc} style={{ width:'100%', height:110, objectFit:'cover', display:'block' }} />
                            <div style={{ padding:'4px 8px', fontSize:10, color:'var(--text2)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.desc}</span>
                              <button onClick={() => setPlanosOferta(prev=>prev.filter(i=>i.id!==m.id))} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:12, lineHeight:1, padding:'0 0 0 4px', flexShrink:0 }}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                          <button className="ab-btn blue" style={{ fontSize:9, padding:'2px 8px' }}>IA</button>
                        </div>
                        <input className="of-inp" value={tituloWeb} onChange={e => setTituloWeb(e.target.value)} placeholder="Título comercial de la oferta..." />
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                          <FieldLbl>Texto descriptivo web / ficha</FieldLbl>
                          <button className="ab-btn blue" style={{ fontSize:9, padding:'2px 8px' }}>IA</button>
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
                              <span key={i} style={{ padding:'3px 10px', background:'#f5efe5', color:'#5a4828', border:'1px solid #93c5fd', borderRadius:12, fontSize:10, fontWeight:600 }}>{k}</span>
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

                  {/* ── KPIs de seguimiento ── */}
                  <div className="va-card">
                    <div className="va-card-header">
                      <h3><span className="ico" style={{color:'var(--pdb-blue)'}}>●</span> Resumen de actividad</h3>
                    </div>
                    <div style={{padding:'4px 20px 16px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                      {[
                        {lbl:'Actividades totales',val:SEG_ACTS.length,color:'var(--text1)'},
                        {lbl:'Presentaciones',val:SEG_ACTS.filter(a=>a.tipo==='Presentación').length,color:'var(--amber)'},
                        {lbl:'Visitas realizadas',val:SEG_ACTS.filter(a=>a.tipo==='Visita').length,color:'var(--teal)'},
                        {lbl:'Pendientes',val:SEG_ACTS.filter(a=>a.estado==='Abierto'||a.estado==='En curso').length,color:'var(--red)'},
                      ].map(k => (
                        <div key={k.lbl} style={{ textAlign:'center' }}>
                          <div style={{ fontSize:22, fontWeight:800, fontFamily:'var(--mono)', color:k.color }}>{k.val}</div>
                          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginTop:3 }}>{k.lbl}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Tabla actividades ── */}
                  <div className="va-card">
                    <div className="va-card-header">
                      <h3><span className="ico">◈</span> Actividades vinculadas</h3>
                      <button className="ab-btn blue">+ Registrar actividad</button>
                    </div>
                    <div style={{padding:'4px 0 0', overflow:'hidden'}}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                        <thead><tr>{['','ID','Tipo','Descripción','Fecha','Responsable','Estado'].map(h =>
                          <th key={h} style={{ padding:'8px 16px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', background:'var(--gray-lt)', borderBottom:'1px solid var(--border)', textTransform:'uppercase' }}>{h}</th>
                        )}</tr></thead>
                        <tbody>{SEG_ACTS.map(a => (
                          <tr key={a.id} style={{ borderBottom:'1px solid var(--border)', cursor:'pointer' }} onClick={() => navigate('ficha-actividad')}>
                            <td style={{ padding:'8px 12px', width:30 }}><div style={{ width:28, height:28, borderRadius:'50%', background:a.bg, color:a.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{a.initials}</div></td>
                            <td style={{ padding:'8px 16px' }}><span className="asset-link" style={{ fontFamily:'var(--mono)', fontSize:11 }}>{a.id}</span></td>
                            <td style={{ padding:'8px 16px' }}><span className={`tag ${TIPO_TAG[a.tipo]||'tag-gray'}`}>{TIPO_ICO[a.tipo]} {a.tipo}</span></td>
                            <td style={{ padding:'8px 16px', fontWeight:500, maxWidth:320 }}>{a.asunto}</td>
                            <td style={{ padding:'8px 16px', color:'var(--text3)', whiteSpace:'nowrap' }}>{a.fecha}</td>
                            <td style={{ padding:'8px 16px', fontSize:11, color:'var(--text3)' }}>{a.user}</td>
                            <td style={{ padding:'8px 16px' }}><span className={`tag ${ACT_EST[a.estado]||'tag-gray'}`}>{a.estado}</span></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                </div></div>
              )}

              {/* Confidencialidad */}
              {activeTab==='of-conf' && (
                <div className="tab-content active" style={{ overflowY:'auto', flex:1 }}><div className="info-pad">

                  {/* ── Toggle confidencialidad (mantenido el estilo oscuro intencional) ── */}
                  <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 18px', border:`1px solid ${confidential?'#334155':'var(--border)'}`, borderRadius:'var(--r2)', background:confidential?'#0f172a':'var(--surface)', marginBottom:18 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:confidential?'#f8fafc':'var(--text)' }}>Oferta confidencial</div>
                      <div style={{ fontSize:11, color:confidential?'#94a3b8':'var(--text3)', marginTop:2 }}>{confidential?'Activo, dirección, documentos y condiciones ocultos para no autorizados.':'La oferta es visible para todos los usuarios con acceso al PDB.'}</div>
                    </div>
                    <button onClick={() => setConfidential(v=>!v)} style={{ padding:'6px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', background:confidential?'#f8fafc':'#1e293b', color:confidential?'#0f172a':'#f8fafc' }}>
                      {confidential?'🔓 Desactivar':'Activar'}
                    </button>
                  </div>

                  {/* ── Visibilidad (cuando confidencial está activo) ── */}
                  {confidential && (
                    <div className="va-two-col">
                      <div className="va-meta-card">
                        <div className="va-meta-head accent-red"><span className="dot"/>Oculto para no autorizados</div>
                        <div className="va-kv-list">
                          {['Activo / Inmueble','Dirección y ubicación','Condiciones económicas','Documentación adjunta','Stacking plan'].map(item=>(
                            <div key={item} className="ir"><span className="ir-k" style={{display:'flex',alignItems:'center',gap:6}}><span style={{color:'var(--red)',fontWeight:700}}>✕</span> {item}</span><span className="ir-v"><span style={{color:'var(--red)',fontSize:10,fontWeight:600}}>Oculto</span></span></div>
                          ))}
                        </div>
                      </div>
                      <div className="va-meta-card">
                        <div className="va-meta-head accent-green"><span className="dot"/>Visible siempre</div>
                        <div className="va-kv-list">
                          {['Cuenta','Tipo de operación','Estado de la oferta','Equipo','Información básica'].map(item=>(
                            <div key={item} className="ir"><span className="ir-k" style={{display:'flex',alignItems:'center',gap:6}}><span style={{color:'var(--green)',fontWeight:700}}>✓</span> {item}</span><span className="ir-v"><span style={{color:'var(--green)',fontSize:10,fontWeight:600}}>Visible</span></span></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Usuarios autorizados ── */}
                  <div className="va-card">
                    <div className="va-card-header">
                      <h3><span className="ico"></span> Usuarios autorizados</h3>
                      <button className="ab-btn blue" onClick={() => setAddingUser(true)}>+ Añadir usuario</button>
                    </div>
                    <div style={{padding:'4px 20px 16px'}}>
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {authorizedUsers.map((u,i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                            <div style={{ width:30, height:30, borderRadius:'50%', background:u.bg, color:u.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{u.initials}</div>
                            <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>{u.name}</div><div style={{ fontSize:11, color:'var(--text3)' }}>{u.team} · {u.role}</div></div>
                            {u.owner ? <span className="tag tag-blue">Propietario</span>
                              : <><span style={{ fontSize:10, color:'var(--text4)' }}>Acceso: {u.granted}</span><button onClick={() => setAuthorizedUsers(prev=>prev.filter((_,j)=>j!==i))} style={{ fontSize:11, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 6px', fontFamily:'inherit' }}>✕ Quitar</button></>}
                          </div>
                        ))}
                      </div>
                      {addingUser && (
                        <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r2)', padding:14, marginTop:12 }}>
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
                    </div>
                  </div>

                  {/* ── Demo no autorizado ── */}
                  {confidential && (
                    <div className="va-card">
                      <div className="va-card-header">
                        <h3><span className="ico" style={{color:'var(--amber)'}}>●</span> Vista de usuario no autorizado (demo)</h3>
                      </div>
                      <div style={{padding:'4px 20px 16px'}}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', border:'1px solid var(--amber-bd)', borderRadius:'var(--r)', background:'var(--amber-lt)' }}>
                          <span style={{ fontSize:22 }}></span>
                          <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>Oferta confidencial</div><div style={{ fontSize:11, color:'var(--text3)' }}>No tienes permisos. Puedes solicitar acceso al responsable.</div></div>
                          <button className="ab-btn save" style={{ flexShrink:0 }} onClick={() => alert('✅ Solicitud enviada a Sierra Álvaro')}>Solicitar acceso</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Trazabilidad ── */}
                  <div className="va-card">
                    <div className="va-card-header">
                      <h3><span className="ico">◷</span> Trazabilidad de accesos</h3>
                    </div>
                    <div style={{padding:'4px 0 0'}}>
                      {[{color:'var(--green)',msg:'Sierra Álvaro creó la oferta',date:'05/04/2026 · 10:00'},{color:'var(--accent)',msg:'Sierra Álvaro activó confidencialidad',date:'07/04/2026 · 09:00'}].map((e,i,arr) => (
                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 20px', borderTop:i===0?'1px solid var(--border)':'none', borderBottom:i<arr.length-1?'1px solid var(--border)':'none' }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:e.color, flexShrink:0, marginTop:5 }} />
                          <div><div style={{ fontSize:12 }}>{e.msg}</div><div style={{ fontSize:10, color:'var(--text4)', marginTop:2 }}>{e.date}</div></div>
                        </div>
                      ))}
                    </div>
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
              <div className="rp-lbl">Equipo responsable</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div className="c-av" style={{ background: equipoMembers[0]?.bg || '#f5efe5', color: equipoMembers[0]?.color || '#5a4828', width:30, height:30, fontSize:10 }}>{equipoMembers[0]?.initials || 'AS'}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600 }}>{equipoMembers[0]?.name || 'Sierra Álvaro'}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>{equipoMembers[0]?.team || 'Transaction Spain'}</div>
                </div>
              </div>
            </div>
            <div className="rp-sec">
              <div className="rp-lbl">Asistente IA</div>
              <div className="ai-box">
                <div className="ai-head"><div className="ai-ico"></div><span className="ai-lbl">Insight oferta</span><span className="ai-badge">Tiempo real</span></div>
                <div className="ai-text">127 días en comercialización. Renta 12,50 €/m² <strong>por debajo del mercado A-1</strong> (13,50–14,00 €). Oracle en fase finalista.</div>
                <div className="ai-cta">✎ Preguntar a la IA</div>
              </div>
            </div>
            {/* ── Propietario (heredado del activo) ── */}
            <div className="rp-sec">
              <div className="rp-lbl">Propietario</div>
              {activoSeleccionado?.propietario ? (
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'#fef3c7', border:'1px solid #fde68a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#92400e' }}>
                    {activoSeleccionado.propietario.split(' ').filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()||'').join('') || '—'}
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--accent)' }}>{activoSeleccionado.propietario}</div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>Heredado del activo</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize:10, color:'var(--text4)', fontStyle:'italic' }}>Sin propietario en el activo.</div>
              )}
            </div>

            {/* ── Colaboradores · siempre disponible (cuenta competencia / gestor exclusivo) ── */}
            <div className="rp-sec">
              <div className="rp-lbl">Colaboradores</div>
              {colaboradorAsociado ? (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--accent)' }}>{colaboradorAsociado.nombre}</div>
                  {(colaboradorAsociado.tipo || colaboradorAsociado.sector) && (
                    <div style={{ fontSize:10, color:'var(--text3)' }}>
                      {[colaboradorAsociado.tipo, colaboradorAsociado.sector].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize:10, color:'var(--text4)', fontStyle:'italic' }}>Sin colaborador asociado.</div>
              )}
            </div>

            {/* ── Superficie mínima alquilable ── */}
            {/*
              Regla:
              - divisible = No  → sup. total disponible
              - divisible = Sí  → menor módulo asignado en el stacking
                                  (fallback al menor supMin del desglose si no
                                  hay espacios asignados aún)
            */}
            <div className="rp-sec">
              <div className="rp-lbl">Superficie mínima alquilable</div>
              {(()=>{
                let minSup = null
                let hint = ''
                if (!divisibleGlobal) {
                  if (supTotal > 0) { minSup = supTotal; hint = 'No divisible · total disponible' }
                } else {
                  const sizes = espaciosComercializables.map(e => e.sup).filter(s => s > 0)
                  if (sizes.length > 0) {
                    minSup = Math.min(...sizes)
                    hint = `Divisible · menor módulo de ${sizes.length}`
                  } else {
                    const supMins = ofertasDesglose.filter(o => o.divisible && o.supMin > 0).map(o => o.supMin)
                    if (supMins.length > 0) { minSup = Math.min(...supMins); hint = 'Divisible · mínimo del desglose' }
                  }
                }
                if (minSup == null) {
                  return <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin espacios asignados todavía.</div>
                }
                return (
                  <div>
                    <div style={{ fontSize:20, fontWeight:700, color:'var(--accent)', fontFamily:'var(--mono)' }}>
                      {minSup.toLocaleString('es-ES')} <span style={{ fontSize:11, color:'var(--text3)', fontWeight:500 }}>m²</span>
                    </div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{hint}</div>
                  </div>
                )
              })()}
            </div>

            {/* ── Vista 360 (resumen de seguimiento) ── */}
            <div className="rp-sec">
              <div className="rp-lbl">Vista 360</div>
              {(()=>{
                const total = SEG_ACTS.length
                const pendientes = SEG_ACTS.filter(a => a.estado==='Abierto' || a.estado==='En curso').length
                const ultima = SEG_ACTS[SEG_ACTS.length - 1]
                return (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      <div><div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase' }}>Actividades</div><div style={{ fontSize:16, fontWeight:700 }}>{total}</div></div>
                      <div><div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase' }}>Pendientes</div><div style={{ fontSize:16, fontWeight:700, color:pendientes>0?'var(--red)':'var(--text1)' }}>{pendientes}</div></div>
                    </div>
                    {ultima && (
                      <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:8 }}>
                        <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', marginBottom:3 }}>Última actividad</div>
                        <div style={{ fontSize:11, fontWeight:600, marginBottom:2, lineHeight:1.3 }}>{ultima.asunto}</div>
                        <div style={{ fontSize:10, color:'var(--text3)' }}>{ultima.tipo} · {ultima.fecha}</div>
                      </div>
                    )}
                    <div onClick={() => setActiveTab('of-seg')} style={{ fontSize:10, color:'var(--accent)', cursor:'pointer', textAlign:'right', textDecoration:'underline', textDecorationStyle:'dotted', textUnderlineOffset:2 }}>
                      Ver actividad completa →
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="rp-sec">
              <div className="rp-lbl">Publicación portales</div>
              {[['🌐 Web Savills','Publicado',true],['🏠 Idealista','No publicado',false],['Mis Oficinas','No publicado',false]].map(([lbl,status,pub],i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:i<2?'1px solid var(--border)':'none' }}>
                  <span style={{ fontSize:11 }}>{lbl}</span><span style={{ fontSize:10, fontWeight:600, color:pub?'var(--green)':'var(--text4)' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Oferta" refNombre="OLBUR2315645" onClose={() => setShowTarea(false)} />}
      <NotasModal
        open={showNotasModal}
        onClose={() => setShowNotasModal(false)}
        title="Notas"
        subtitle={oferta?.ref ? `Notas internas · ${oferta.ref}` : 'Notas internas'}
        fields={[{
          key:'notas',
          label:'Notas internas',
          value: comentarios,
          onChange: setComentarios,
          placeholder:'Observaciones internas sobre la oferta...',
          rows:6,
        }]}
      />

      {/* Modal Iniciar negociación */}
      {showNegociacion && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowNegociacion(false)}>
          <div style={{background:'var(--surface)',borderRadius:10,padding:24,maxWidth:420,width:'90%',boxShadow:'0 8px 32px rgba(0,0,0,.18)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <div style={{width:32,height:32,borderRadius:6,background:'var(--amber-lt)',border:'1px solid var(--amber-bd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}></div>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>Iniciar negociación</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>El estado de la oferta pasará a "En negociación"</div>
              </div>
            </div>
            <div style={{background:'var(--amber-lt)',border:'1px solid var(--amber-bd)',borderRadius:7,padding:12,marginBottom:16,fontSize:11,color:'var(--text2)',lineHeight:1.6}}>
              Al confirmar, se actualizará el estado de esta oferta a <strong>En negociación</strong> en el sistema. El equipo será notificado y la oferta quedará marcada para seguimiento activo.
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button className="ab-btn" onClick={()=>setShowNegociacion(false)}>Cancelar</button>
              <button style={{padding:'7px 16px',borderRadius:6,background:'var(--amber)',color:'#fff',border:'none',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}
                onClick={async () => {
                  setShowNegociacion(false)
                  if (oferta?.ref) {
                    await supabase.from('ofertas').update({ estado: 'En negociación' }).eq('ref', oferta.ref)
                    setOferta(prev => prev ? { ...prev, estado: 'En negociación' } : prev)
                    setNegOk(true)
                    setTimeout(() => setNegOk(false), 4000)
                  }
                }}>
                Confirmar → En negociación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dar de baja */}
      {showDarBaja && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',borderRadius:12,padding:28,width:480,maxWidth:'95vw',boxShadow:'0 8px 40px rgba(0,0,0,.25)',display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:'var(--text1)'}}>Dar de baja oferta</div>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
                  {dbMode==='cierre' && 'Se creará un arrendatario y se actualizará el stacking plan'}
                  {dbMode==='error'  && 'Se eliminará la oferta por completo'}
                  {!dbMode             && 'Selecciona el motivo'}
                </div>
              </div>
              <button onClick={()=>setShowDarBaja(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--text3)',lineHeight:1}}>✕</button>
            </div>

            {/* Paso 1: elegir motivo */}
            {!dbMode && (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <button onClick={()=>setDbMode('cierre')}
                  style={{textAlign:'left',padding:'14px 16px',border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:4}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--text1)'}}>Oferta cerrada (alquilada)</span>
                  <span style={{fontSize:11,color:'var(--text3)',lineHeight:1.5}}>El espacio queda como ocupado · se crea un arrendatario en el stacking y la oferta se desactiva.</span>
                </button>
                <button onClick={()=>setDbMode('error')}
                  style={{textAlign:'left',padding:'14px 16px',border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:4}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--red)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--red)'}}>Introducida por error</span>
                  <span style={{fontSize:11,color:'var(--text3)',lineHeight:1.5}}>La oferta no debería haberse creado · se elimina la fila y se limpian las unidades del stacking. No queda registro.</span>
                </button>
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:4}}>
                  <button onClick={()=>setShowDarBaja(false)} style={{padding:'8px 16px',background:'none',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Paso 2A: introducida por error → confirmación */}
            {dbMode==='error' && (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={{padding:'12px 14px',background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:8,fontSize:12,color:'#7f1d1d',lineHeight:1.55}}>
                  Se va a <strong>eliminar la oferta {oferta?.ref}</strong> por completo: la fila en Supabase + las unidades vacantes del stacking asociadas. <strong>No es reversible.</strong>
                </div>
                {dbErrors.length>0 && <div style={{padding:'8px 12px',background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:6,fontSize:11,color:'var(--red)'}}>{dbErrors.map((e,i)=><div key={i}>• {e}</div>)}</div>}
                <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:4}}>
                  <button onClick={()=>setDbMode(null)} style={{padding:'8px 16px',background:'none',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>← Atrás</button>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setShowDarBaja(false)} style={{padding:'8px 16px',background:'none',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
                    <button onClick={handleEliminarOferta} disabled={dbSaving} style={{padding:'8px 16px',background:'var(--red)',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:dbSaving?'wait':'pointer',fontFamily:'inherit',opacity:dbSaving?.6:1}}>
                      {dbSaving ? 'Eliminando...' : 'Eliminar oferta'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2B: cierre normal (arrendatario) — formulario completo */}
            {dbMode==='cierre' && (<>

            {/* Tenant */}
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Arrendatario <span style={{color:'var(--red)'}}>*</span></span>
                <label style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'var(--text3)',cursor:'pointer',marginLeft:'auto'}}>
                  <input type="checkbox" checked={dbForm.tenant_desconocido} onChange={e=>setDbF('tenant_desconocido',e.target.checked)} style={{accentColor:'var(--accent)'}}/>
                  Desconocido
                </label>
              </div>
              {!dbForm.tenant_desconocido && <input value={dbForm.tenant} onChange={e=>setDbF('tenant',e.target.value)} placeholder="Nombre de empresa o persona" style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}}/>}
            </div>

            {/* Año firma + Trimestre */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Año de firma <span style={{color:'var(--red)'}}>*</span></span>
                <input type="number" value={dbForm.anyo_firma} onChange={e=>setDbF('anyo_firma',e.target.value)} style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit'}}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Trimestre</span>
                <select value={dbForm.trimestre} onChange={e=>setDbF('trimestre',e.target.value)} style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)'}}>
                  <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                </select>
              </div>
            </div>

            {/* Fecha inicio + Años obligado */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Fecha inicio <span style={{color:'var(--red)'}}>*</span></span>
                <input type="date" value={toInput(dbForm.fecha_inicio)} onChange={e=>setDbF('fecha_inicio',fromInput(e.target.value))} style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit'}}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Años OC 1 <span style={{color:'var(--red)'}}>*</span></span>
                <input type="number" step="0.5" value={dbForm.anios_obligado} onChange={e=>setDbF('anios_obligado',e.target.value)} placeholder="3" style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit'}}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Años OC 2</span>
                <input type="number" step="0.5" value={dbForm.anios_obligado_2} onChange={e=>setDbF('anios_obligado_2',e.target.value)} placeholder="2" style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit'}}/>
              </div>
            </div>

            {/* Fechas auto-calculadas */}
            {(dbForm.break_option||dbForm.fecha_fin) && (
              <div style={{display:'flex',gap:12,padding:'8px 12px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:6}}>
                {dbForm.break_option&&<span style={{fontSize:11,color:'var(--accent)'}}>Break option: <strong>{dbForm.break_option}</strong></span>}
                {dbForm.fecha_fin&&<span style={{fontSize:11,color:'var(--accent)',marginLeft:8}}>Vencimiento: <strong>{dbForm.fecha_fin}</strong></span>}
              </div>
            )}

            {/* Closing rent */}
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Closing rent (€/m²/mes)</span>
              <input type="number" step="0.01" value={dbForm.closing_rent} onChange={e=>setDbF('closing_rent',e.target.value)} placeholder={oferta?.renta_m2||''} style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit'}}/>
            </div>

            {dbErrors.length>0 && <div style={{padding:'8px 12px',background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:6,fontSize:11,color:'var(--red)'}}>{dbErrors.map((e,i)=><div key={i}>• {e}</div>)}</div>}

            <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:4}}>
              <button onClick={()=>setDbMode(null)} style={{padding:'8px 16px',background:'none',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>← Atrás</button>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setShowDarBaja(false)} style={{padding:'8px 16px',background:'none',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
                <button onClick={handleDarBaja} disabled={dbSaving} style={{padding:'8px 16px',background:'var(--red)',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:dbSaving?'wait':'pointer',fontFamily:'inherit',opacity:dbSaving?.6:1}}>
                  {dbSaving ? 'Procesando...' : 'Confirmar baja'}
                </button>
              </div>
            </div>
            </>)}
          </div>
        </div>
      )}
    </div>
  )
}
