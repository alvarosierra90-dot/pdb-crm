import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'

const OFERTAS_DISPONIBLES = [
  { ref:'OLB001', activo:'P.E Avalon',              cuenta:'Merlín Properties SOCIMI',    espacio:'P5 · 1.500 m²',     sba:1500, renta:10.5 },
  { ref:'OLB002', activo:'P.E Avalon',              cuenta:'Merlín Properties SOCIMI',    espacio:'P3 · 2.550 m²',     sba:2550, renta:11.0 },
  { ref:'OLB003', activo:'Albatros Edif. D',        cuenta:'Merlín Properties SOCIMI',    espacio:'P2 · 3.200 m²',     sba:3200, renta:13.5 },
  { ref:'OLB004', activo:'Torre Glòries',           cuenta:'Merlín Properties SOCIMI',    espacio:'P10-P12 · 5.400 m²',sba:5400, renta:18.0 },
  { ref:'OLB005', activo:'Parque Empresarial Norte','cuenta':'FREO Investments Spain SL', espacio:'Módulo A · 2.800 m²',sba:2800, renta:9.5  },
]

const ACTIVOS_DISPONIBLES = [
  { ref:'MAD-OF-00189', nombre:'P.E Avalon',              zona:'M-30 · Madrid',       uso:'Oficinas',  sba:4050, renta:10.5, cuenta:'Merlín Properties SOCIMI' },
  { ref:'MAD-OF-00190', nombre:'Albatros Edif. D',        zona:'A-1 · Alcobendas',    uso:'Oficinas',  sba:13486,renta:13.5, cuenta:'Merlín Properties SOCIMI' },
  { ref:'BCN-OF-00041', nombre:'Torre Glòries',           zona:'22@ · Barcelona',     uso:'Oficinas',  sba:18500,renta:18.0, cuenta:'Merlín Properties SOCIMI' },
  { ref:'MAD-OF-00201', nombre:'Parque Empresarial Norte',zona:'M-30 · Madrid',       uso:'Oficinas',  sba:11200,renta:9.5,  cuenta:'FREO Investments Spain SL' },
  { ref:'MAD-OF-00214', nombre:'Torre Europa Valencia',   zona:'Mestalla · Valencia', uso:'Oficinas',  sba:7600, renta:11.0, cuenta:'FREO Investments Spain SL' },
]

const toISO  = s => { if(!s) return ''; const [d,m,y]=s.split('/'); return `${y}-${m}-${d}` }
const fromISO = s => { if(!s) return ''; const [y,m,d]=s.split('-'); return `${d}/${m}/${y}` }

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

// ── Informe de gestión: datos vinculados al activo y zona ──
const COMPARABLES = [
  {ref:'MAD-OF-00156',nombre:'Torre Europa',zona:'M-30 · Madrid',uso:'Oficinas',sba:6200,renta:11.2,ocup:92,estado:'Comercializado'},
  {ref:'MAD-OF-00178',nombre:'Edificio Conata II',zona:'M-30 · Madrid',uso:'Oficinas',sba:3800,renta:10.8,ocup:85,estado:'Disponible'},
  {ref:'MAD-OF-00201',nombre:'Business Park M-30',zona:'M-30 · Madrid',uso:'Oficinas',sba:5100,renta:12.0,ocup:96,estado:'Comercializado'},
  {ref:'MAD-OF-00214',nombre:'Parque Empresarial Omega',zona:'M-30 · Madrid',uso:'Oficinas',sba:4400,renta:10.0,ocup:78,estado:'Disponible'},
]

const MERCADO_OPS = [
  {fecha:'01/03/2026',activo:'Torre Europa',arrendatario:'Repsol SA',m2:2100,renta:11.5,plazo:'5 años',consultora:'Savills'},
  {fecha:'15/01/2026',activo:'Edificio Conata II',arrendatario:'Mapfre SL',m2:1800,renta:10.9,plazo:'7 años',consultora:'CBRE'},
  {fecha:'10/12/2025',activo:'Business Park M-30 B',arrendatario:'Endesa SA',m2:3200,renta:12.2,plazo:'10 años',consultora:'JLL'},
  {fecha:'22/10/2025',activo:'Parque Omega P2',arrendatario:'Telefónica SA',m2:1500,renta:10.5,plazo:'5 años',consultora:'Savills'},
]

const PRESENTACIONES_INFORME = [
  {fecha:'15/03/2026',empresa:'Empresa XYZ SA',contacto:'Ana Gómez',plantas:'P4+P5',m2:4050,interes:'Muy alto',estado:'En negociación',ref:'NEG-0044'},
  {fecha:'01/02/2026',empresa:'Oracle Spain SL',contacto:'Carlos Méndez',plantas:'P4',m2:1500,interes:'Alto',estado:'Firmado',ref:'TRX-2501'},
  {fecha:'10/01/2026',empresa:'Pharma Group Spain',contacto:'Javier Ruiz',plantas:'P5',m2:2550,interes:'Medio',estado:'Descartado',ref:'DEM-0037'},
  {fecha:'05/12/2025',empresa:'Generali Real Estate',contacto:'Marta Solá',plantas:'P4+P5',m2:4050,interes:'Bajo',estado:'Sin respuesta',ref:'DEM-0039'},
]

const INT_COLOR = {'Muy alto':'var(--green)','Alto':'var(--accent)','Medio':'var(--amber)','Bajo':'var(--text4)'}
const PRES_EST  = {'En negociación':'tag-purple','Firmado':'tag-green','Descartado':'tag-red','Sin respuesta':'tag-gray'}
const COMP_EST  = {'Disponible':'tag-amber','Comercializado':'tag-green'}

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
  const { navigate, params } = useNav()
  const nuevoModo = params?.nuevo === true
  const [tab, setTab] = useState('info')
  const [showTarea, setShowTarea] = useState(false)

  // ── Estado editable (nuevo modo + edición) ──
  const [oportunidadV,   setOportunidadV]   = useState(null)
  const [ofertasV,       setOfertasV]       = useState([])
  const [activosV,       setActivosV]       = useState([])
  const [tipoV,          setTipoV]          = useState('Leasing')
  const [exclV,          setExclV]          = useState('Exclusiva')
  const [lineaV,         setLineaV]         = useState('Leasing')
  const [equipoV,        setEquipoV]        = useState('Leasing Oficinas MAD')
  const [fConcesion,     setFConcesion]     = useState(toISO(M.fecha_concesion))
  const [fInicio,        setFInicio]        = useState(toISO(M.fecha_inicio))
  const [fFin,           setFFin]           = useState(toISO(M.fecha_fin))
  const [preavisoDias,   setPreavisoDias]   = useState(M.preaviso_dias)
  const [alertaDias,     setAlertaDias]     = useState(M.alerta_dias)
  const [prorrogaTacita, setProrrogaTacita] = useState(M.prorroga_tacita)
  const [prorrogaMeses,  setProrrogaMeses]  = useState(M.prorroga_meses)
  const [honorariosPct,  setHonorariosPct]  = useState(M.honorarios_pct)
  const [sbaMandato,     setSbaMandato]     = useState(M.sba_mandato)
  const [rentaEuros,     setRentaEuros]     = useState(M.activos[0]?.renta ?? 0)
  const [plazoAnios,     setPlazoAnios]     = useState(5)
  const [condiciones,    setCondiciones]    = useState(M.condiciones)
  const [condProrroga,   setCondProrroga]   = useState(M.condiciones_prorroga)
  const [obsInternas,    setObsInternas]    = useState(M.observaciones)
  const [ofertaSelInput, setOfertaSelInput] = useState('')
  const [activoSelInput, setActivoSelInput] = useState('')

  const canGuardar = !!oportunidadV && ofertasV.length > 0 && activosV.length > 0

  const honorariosEst = Math.round(honorariosPct / 100 * sbaMandato * rentaEuros * 12)

  const addOferta = (ref) => {
    const o = OFERTAS_DISPONIBLES.find(x => x.ref === ref)
    if (!o || ofertasV.find(x => x.ref === ref)) return
    setOfertasV(v => [...v, o])
    setSbaMandato(s => s + o.sba)
    setRentaEuros(o.renta)
    setOfertaSelInput('')
  }
  const removeOferta = (ref) => {
    const o = ofertasV.find(x => x.ref === ref)
    if (o) setSbaMandato(s => Math.max(0, s - o.sba))
    setOfertasV(v => v.filter(x => x.ref !== ref))
  }

  const addActivo = (ref) => {
    const a = ACTIVOS_DISPONIBLES.find(x => x.ref === ref)
    if (!a || activosV.find(x => x.ref === ref)) return
    setActivosV(v => [...v, a])
    setSbaMandato(s => s + a.sba)
    setRentaEuros(a.renta)
    setActivoSelInput('')
  }
  const removeActivo = (ref) => {
    const a = activosV.find(x => x.ref === ref)
    if (a) setSbaMandato(s => Math.max(0, s - a.sba))
    setActivosV(v => v.filter(x => x.ref !== ref))
  }

  const diasColor = M.dias_restantes <= 0 ? 'var(--red)'
    : M.dias_restantes <= 30 ? 'var(--red)'
    : M.dias_restantes <= 60 ? 'var(--amber)'
    : 'var(--green)'

  const exportarPPT = async () => {
    const { default: PptxGenJS } = await import('pptxgenjs')
    const pptx = new PptxGenJS()
    pptx.layout = 'LAYOUT_WIDE'
    pptx.title  = `Informe de gestión — ${M.id}`

    const AZUL  = '0071e3'
    const NEGRO = '1d1d1f'
    const GRIS  = 'f8f8fa'
    const BORDE = 'e8e8ed'

    const addHeader = (slide, titulo, subtitulo) => {
      slide.addShape(pptx.ShapeType.rect, { x:0, y:0, w:'100%', h:1.1, fill:{color:NEGRO} })
      slide.addText(`${M.id}  ·  ${M.titulo}`, { x:0.4, y:0.08, w:8, h:0.35, fontSize:9, color:'ffffff', bold:false })
      slide.addText(titulo, { x:0.4, y:0.38, w:12, h:0.55, fontSize:22, color:'ffffff', bold:true })
      if (subtitulo) slide.addText(subtitulo, { x:0.4, y:0.88, w:12, h:0.22, fontSize:10, color:'aaaaaa' })
    }

    // ── Slide 1: Portada ──
    const s0 = pptx.addSlide()
    s0.addShape(pptx.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%', fill:{color:NEGRO} })
    s0.addShape(pptx.ShapeType.rect, { x:0, y:3.5, w:'100%', h:0.06, fill:{color:AZUL} })
    s0.addText('INFORME DE GESTIÓN', { x:0.6, y:1.2, w:12, h:0.6, fontSize:13, color:'aaaaaa', bold:true, charSpacing:4 })
    s0.addText(M.titulo, { x:0.6, y:1.8, w:12, h:1.2, fontSize:30, color:'ffffff', bold:true })
    s0.addText(`Mandato: ${M.id}  ·  Activo: ${M.activos[0].nombre}  ·  Zona: ${M.zona}`, { x:0.6, y:3.1, w:12, h:0.35, fontSize:11, color:'888888' })
    s0.addText(`Generado: ${new Date().toLocaleDateString('es-ES')}  ·  Savills España`, { x:0.6, y:4.5, w:12, h:0.3, fontSize:9, color:'555555' })

    // ── Slide 2: Activos comparables ──
    const s1 = pptx.addSlide()
    addHeader(s1, 'Activos comparables por la zona', `Zona de referencia: ${M.zona}`)
    const rows1 = [
      [{ text:'Referencia', options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Activo',     options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'SBA (m²)',   options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Renta (€/m²/mes)', options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Ocupación',  options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Estado',     options:{bold:true,fill:{color:NEGRO},color:'ffffff'} }],
      ...COMPARABLES.map(c => [c.ref, c.nombre, c.sba.toLocaleString(), `${c.renta} €`, `${c.ocup}%`, c.estado]),
    ]
    s1.addTable(rows1, { x:0.4, y:1.3, w:12.2, fontSize:10, border:{type:'solid',color:BORDE}, align:'left', autoPage:false })

    // ── Slide 3: Situación del mercado ──
    const s2 = pptx.addSlide()
    addHeader(s2, 'Situación actual del mercado', `Operaciones cerradas en ${M.zona} — Acumulado del año`)
    const rows2 = [
      [{ text:'Fecha',       options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Activo',      options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Arrendatario',options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Superficie',  options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Renta (€/m²/mes)', options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Plazo',       options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Consultora',  options:{bold:true,fill:{color:NEGRO},color:'ffffff'} }],
      ...MERCADO_OPS.map(o => [o.fecha, o.activo, o.arrendatario, `${o.m2.toLocaleString()} m²`, `${o.renta} €`, o.plazo, o.consultora]),
    ]
    s2.addTable(rows2, { x:0.4, y:1.3, w:12.2, fontSize:10, border:{type:'solid',color:BORDE}, align:'left', autoPage:false })

    // ── Slide 4: Visitas al activo ──
    const s3 = pptx.addSlide()
    addHeader(s3, 'Visitas realizadas al activo', `${VISS.length} visitas registradas · ${M.activos[0].nombre}`)
    const rows3 = [
      [{ text:'ID',         options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Fecha',      options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Cuenta',     options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Tipo',       options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Estado',     options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Interés',    options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Prob. KF',   options:{bold:true,fill:{color:NEGRO},color:'ffffff'} }],
      ...VISS.map(v => [v.id, v.fecha, v.cuenta, v.tipo, v.estado, v.interes, `${v.prob}%`]),
    ]
    s3.addTable(rows3, { x:0.4, y:1.3, w:12.2, fontSize:10, border:{type:'solid',color:BORDE}, align:'left', autoPage:false })

    // ── Slide 5: Presentaciones a compañías ──
    const s4 = pptx.addSlide()
    addHeader(s4, 'Presentaciones del activo a compañías', `${PRESENTACIONES_INFORME.length} presentaciones realizadas · ${M.activos[0].nombre}`)
    const rows4 = [
      [{ text:'Fecha',    options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Empresa',  options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Contacto', options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Plantas',  options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Sup. (m²)',options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Interés',  options:{bold:true,fill:{color:NEGRO},color:'ffffff'} },
       { text:'Estado',   options:{bold:true,fill:{color:NEGRO},color:'ffffff'} }],
      ...PRESENTACIONES_INFORME.map(p => [p.fecha, p.empresa, p.contacto, p.plantas, `${p.m2.toLocaleString()} m²`, p.interes, p.estado]),
    ]
    s4.addTable(rows4, { x:0.4, y:1.3, w:12.2, fontSize:10, border:{type:'solid',color:BORDE}, align:'left', autoPage:false })

    await pptx.writeFile({ fileName: `Informe_Gestion_${M.id}_${new Date().toISOString().slice(0,10)}.pptx` })
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="action-bar">
        {nuevoModo ? (
          <>
            <button className="ab-btn save"
              style={{background:canGuardar?'var(--green)':'var(--border2)',color:canGuardar?'#fff':'var(--text4)',border:'none',fontWeight:700,cursor:canGuardar?'pointer':'not-allowed'}}
              onClick={()=>{ if(!canGuardar) return; navigate('mandatos') }}>
              💾 Guardar mandato
            </button>
            <button className="ab-btn" onClick={()=>navigate('mandatos')}>✕ Cancelar</button>
            {!canGuardar && <span style={{fontSize:10,color:'var(--red)',marginLeft:4,fontWeight:600}}>★ Faltan: {[!oportunidadV&&'Oportunidad', ofertasV.length===0&&'Oferta', activosV.length===0&&'Activo'].filter(Boolean).join(' · ')}</span>}
          </>
        ) : (
          <>
            <button className="ab-btn save">💾 Guardar</button>
            <button className="ab-btn">Guardar y cerrar</button>
            <button className="ab-btn">Renovar mandato</button>
            <button className="ab-btn">Rescindir</button>
            <div className="ab-sep"/>
            <button className="ab-btn blue">📋 Nueva actividad</button>
            <button className="ab-btn" onClick={()=>navigate('mandatos')}>← Volver</button>
            <div className="ab-sep"/>
            <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
          </>
        )}
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
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>{M.id}</span>
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
            {[['info','Información'],['alertas',`Alertas (${ALERTAS.filter(a=>a.activa).length})`],['actividades',`Actividades (${ACTS.length})`],['transacciones',`Transacciones (${TRANS.length})`],['visitas',`Visitas (${VISS.length})`],['docs',`Documentación (${DOCS.length})`],['equipo','Equipo'],['informe','📊 Informe de gestión']].map(([k,l])=>(
              <div key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</div>
            ))}
          </div>

          {/* ── TAB: INFORMACIÓN ── */}
          {tab==='info' && (
            <div className="tab-content active">
              <div className="info-pad">

                {/* Cronograma visual — solo en modo vista */}
                {!nuevoModo && (
                  <div className="info-block" style={{marginBottom:12}}>
                    <div className="ib-title">CRONOGRAMA CONTRACTUAL</div>
                    <div style={{position:'relative',margin:'24px 8px 40px',userSelect:'none'}}>
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
                      <div style={{position:'relative',height:28,borderRadius:6,overflow:'visible'}}>
                        <div style={{position:'absolute',left:'0%',width:`${pct(M.fecha_fin)}%`,height:'100%',background:'linear-gradient(90deg,#dcfce7,#bbf7d0)',borderRadius:'6px 0 0 6px'}}/>
                        <div style={{position:'absolute',left:`${pct(M.fecha_fin)}%`,width:`${100-pct(M.fecha_fin)}%`,height:'100%',background:'linear-gradient(90deg,#ede9fe,#ddd6fe)',borderRadius:'0 6px 6px 0',borderLeft:'2px dashed var(--purple)'}}/>
                        <div style={{position:'absolute',left:`${pct(M.fecha_preaviso)-5}%`,width:`${pct(M.fecha_fin)-pct(M.fecha_preaviso)+5}%`,height:'100%',background:'rgba(251,191,36,.25)',borderLeft:'2px solid var(--amber)'}}/>
                        <div style={{position:'absolute',left:`${TODAY_PCT}%`,top:-4,bottom:-4,width:2,background:'var(--accent)',zIndex:2}}>
                          <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',background:'var(--accent)',color:'#fff',fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap'}}>HOY</div>
                        </div>
                        <div style={{position:'absolute',left:'2%',top:'50%',transform:'translateY(-50%)',fontSize:9,fontWeight:700,color:'var(--green)'}}>ACTIVO</div>
                        <div style={{position:'absolute',left:`${pct(M.fecha_fin)+1}%`,top:'50%',transform:'translateY(-50%)',fontSize:9,fontWeight:700,color:'var(--purple)'}}>PRÓRROGA {M.prorroga_meses}m</div>
                      </div>
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
                  </div>
                )}

                {/* Vinculaciones */}
                <div className="info-block" style={{marginBottom:12,borderLeft: nuevoModo ? '3px solid var(--accent)' : undefined}}>
                  <div className="ib-title" style={{color: nuevoModo ? 'var(--accent)' : undefined}}>
                    {nuevoModo ? '★ VINCULACIONES OBLIGATORIAS · Oportunidad + Oferta + Activo' : 'VINCULACIONES'}
                  </div>
                  {nuevoModo && (
                    <div style={{marginBottom:10,padding:'8px 10px',background:'#fef3c7',border:'1px solid #fde68a',borderRadius:6,fontSize:10,color:'#7c2d12'}}>
                      🔒 Un mandato exige <strong>los tres anclajes obligatorios</strong>: una <strong>Oportunidad</strong> (Dynamics WIP), al menos una <strong>Oferta</strong> y al menos un <strong>Activo</strong>. Sin los tres no se puede guardar.
                    </div>
                  )}

                  {/* ── Oportunidad (FK obligatorio · Dynamics) ── */}
                  {nuevoModo && (
                    <>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                        <span style={{width:14,height:14,borderRadius:3,background:'#0078d4',color:'#fff',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>D</span>
                        Oportunidad vinculada · OBLIGATORIO
                      </div>
                      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
                        <select className="fsel" value={oportunidadV?.ref || ''} onChange={e=>{
                          const ops = [
                            { ref:'OP-2026-0042', nombre:'Captación mandato P.E. Avalon — Edif. A', cuenta:'Barings RE', etapa:'Calificación' },
                            { ref:'OP-2026-0041', nombre:'Comercialización Albatros · Allianz RE', cuenta:'Allianz RE',  etapa:'Propuesta enviada' },
                            { ref:'OP-2026-0038', nombre:'Mandato exclusiva Castellana 77 GMP',    cuenta:'GMP',         etapa:'Negociación' },
                            { ref:'OP-2026-0036', nombre:'Captación Diagonal 95 Grosvenor',        cuenta:'Grosvenor',   etapa:'Identificación' },
                          ]
                          setOportunidadV(ops.find(o=>o.ref===e.target.value) || null)
                        }} style={{flex:1,fontSize:11}}>
                          <option value="">Seleccionar oportunidad de Dynamics...</option>
                          <option value="OP-2026-0042">OP-2026-0042 · Captación mandato P.E. Avalon — Edif. A · Barings RE</option>
                          <option value="OP-2026-0041">OP-2026-0041 · Comercialización Albatros · Allianz RE</option>
                          <option value="OP-2026-0038">OP-2026-0038 · Mandato exclusiva Castellana 77 GMP</option>
                          <option value="OP-2026-0036">OP-2026-0036 · Captación Diagonal 95 Grosvenor</option>
                        </select>
                      </div>
                      {oportunidadV && (
                        <div style={{padding:'8px 10px',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:6,fontSize:11,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontWeight:700,color:'#1e40af'}}>{oportunidadV.ref}</span>
                          <span style={{color:'#1e3a8a'}}>·</span>
                          <span>{oportunidadV.nombre}</span>
                          <span style={{marginLeft:'auto',fontSize:9,fontWeight:700,color:'#1e40af',background:'#dbeafe',padding:'2px 8px',borderRadius:6}}>{oportunidadV.etapa}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Ofertas ── */}
                  <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>
                    Ofertas vinculadas {nuevoModo && <span style={{color:'var(--red)',fontWeight:600}}>(★ obligatorio)</span>}
                  </div>
                  <div style={{display:'flex',gap:8,marginBottom:6,alignItems:'center'}}>
                    <select className="fsel" value={ofertaSelInput} onChange={e=>setOfertaSelInput(e.target.value)} style={{flex:1,fontSize:11}}>
                      <option value="">Seleccionar oferta...</option>
                      {OFERTAS_DISPONIBLES.filter(o=>!ofertasV.find(x=>x.ref===o.ref)).map(o=>(
                        <option key={o.ref} value={o.ref}>{o.ref} · {o.activo} · {o.espacio}</option>
                      ))}
                    </select>
                    <button className="ab-btn blue" disabled={!ofertaSelInput} onClick={()=>addOferta(ofertaSelInput)}>+ Añadir oferta</button>
                  </div>
                  {(nuevoModo ? ofertasV : M.activos.map(a=>({ref:'OLB001',activo:a.nombre,cuenta:M.cuenta,espacio:`${a.sba.toLocaleString()} m²`,sba:a.sba,renta:a.renta}))).length === 0
                    ? <div style={{padding:'6px 0 10px',color:'var(--text4)',fontSize:10}}>Sin ofertas vinculadas</div>
                    : (
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,marginBottom:12}}>
                        <thead><tr>{['Ref. Oferta','Activo','Espacio','SBA','Renta €/m²','Cuenta',''].map(h=>(
                          <th key={h} style={{padding:'5px 10px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                        ))}</tr></thead>
                        <tbody>
                          {(nuevoModo ? ofertasV : M.activos.map(a=>({ref:'OLB001',activo:a.nombre,cuenta:M.cuenta,espacio:`${a.sba.toLocaleString()} m²`,sba:a.sba,renta:a.renta}))).map(o=>(
                            <tr key={o.ref} style={{borderBottom:'1px solid var(--border)'}}>
                              <td style={{padding:'6px 10px'}}><span className="asset-link mono" style={{fontSize:10}}>{o.ref}</span></td>
                              <td style={{padding:'6px 10px',fontWeight:500,color:'var(--teal)'}}>{o.activo}</td>
                              <td style={{padding:'6px 10px',color:'var(--text3)'}}>{o.espacio}</td>
                              <td style={{padding:'6px 10px',fontWeight:600}}>{o.sba?.toLocaleString()} m²</td>
                              <td style={{padding:'6px 10px'}}>{o.renta} €</td>
                              <td style={{padding:'6px 10px',color:'var(--accent)'}}>{o.cuenta}</td>
                              <td style={{padding:'6px 10px'}}>
                                {nuevoModo
                                  ? <button className="ra" style={{color:'var(--red)'}} onClick={()=>removeOferta(o.ref)}>✕</button>
                                  : <button className="ra p" onClick={()=>navigate('ficha-oferta')}>Ver</button>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }

                  {/* ── Activos ── */}
                  <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6,borderTop:'1px solid var(--border)',paddingTop:10}}>
                    Activos vinculados {nuevoModo && <span style={{color:'var(--red)',fontWeight:600}}>(★ obligatorio)</span>}
                  </div>
                  <div style={{display:'flex',gap:8,marginBottom:6,alignItems:'center'}}>
                    <select className="fsel" value={activoSelInput} onChange={e=>setActivoSelInput(e.target.value)} style={{flex:1,fontSize:11}}>
                      <option value="">Seleccionar activo...</option>
                      {ACTIVOS_DISPONIBLES.filter(a=>!activosV.find(x=>x.ref===a.ref)).map(a=>(
                        <option key={a.ref} value={a.ref}>{a.ref} · {a.nombre} · {a.zona}</option>
                      ))}
                    </select>
                    <button className="ab-btn blue" disabled={!activoSelInput} onClick={()=>addActivo(activoSelInput)}>+ Añadir activo</button>
                  </div>
                  {(nuevoModo ? activosV : M.activos).length === 0
                    ? <div style={{padding:'6px 0',color:'var(--text4)',fontSize:10}}>Sin activos vinculados</div>
                    : (
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                        <thead><tr>{['Referencia','Nombre','Zona','Uso','SBA','Renta €/m²','Cuenta',''].map(h=>(
                          <th key={h} style={{padding:'5px 10px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                        ))}</tr></thead>
                        <tbody>
                          {(nuevoModo ? activosV : M.activos.map(a=>({ref:a.ref,nombre:a.nombre,zona:a.zona,uso:a.uso,sba:a.sba,renta:a.renta,cuenta:M.cuenta}))).map(a=>(
                            <tr key={a.ref} style={{borderBottom:'1px solid var(--border)'}}>
                              <td style={{padding:'6px 10px'}}><span className="asset-link mono" style={{fontSize:10}}>{a.ref}</span></td>
                              <td style={{padding:'6px 10px',fontWeight:500,color:'var(--teal)'}}>{a.nombre}</td>
                              <td style={{padding:'6px 10px',color:'var(--text3)'}}>{a.zona}</td>
                              <td style={{padding:'6px 10px'}}><span className="tag tag-blue" style={{fontSize:9}}>{a.uso}</span></td>
                              <td style={{padding:'6px 10px',fontWeight:600}}>{a.sba?.toLocaleString()} m²</td>
                              <td style={{padding:'6px 10px'}}>{a.renta} €</td>
                              <td style={{padding:'6px 10px',color:'var(--accent)'}}>{a.cuenta}</td>
                              <td style={{padding:'6px 10px'}}>
                                {nuevoModo
                                  ? <button className="ra" style={{color:'var(--red)'}} onClick={()=>removeActivo(a.ref)}>✕</button>
                                  : <button className="ra p" onClick={()=>navigate('ficha-activo')}>Ver</button>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }

                  {/* Cuenta derivada */}
                  {nuevoModo && (ofertasV.length > 0 || activosV.length > 0) && (
                    <div style={{marginTop:8,padding:'6px 10px',background:'var(--gray-lt)',borderRadius:6,display:'flex',alignItems:'center',gap:8,fontSize:11}}>
                      <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Propietario asignado:</span>
                      <span style={{fontWeight:600,color:'var(--accent)'}}>{(ofertasV[0]||activosV[0])?.cuenta}</span>
                      <span style={{fontSize:9,color:'var(--text4)'}}>· Derivado de la vinculación</span>
                    </div>
                  )}
                </div>

                {/* Activos del mandato — solo en vista (resumen rápido debajo del cronograma) */}
                {!nuevoModo && (
                  <div className="info-block" style={{marginBottom:12}}>
                    <div className="ib-title">ACTIVOS BAJO MANDATO · {M.activos.length} activo{M.activos.length>1?'s':''} · {M.sba_mandato.toLocaleString()} m² SBA</div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr>{['Referencia','Nombre','Zona','Uso','SBA','Ocupación','Renta €/m²',''].map(h=>(
                        <th key={h} style={{padding:'5px 10px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                      ))}</tr></thead>
                      <tbody>
                        {M.activos.map(a=>(
                          <tr key={a.ref} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>
                            <td style={{padding:'7px 10px'}}><span className="asset-link mono" style={{fontSize:10}}>{a.ref}</span></td>
                            <td style={{padding:'7px 10px',fontWeight:600,color:'var(--teal)'}}>{a.nombre}</td>
                            <td style={{padding:'7px 10px',color:'var(--text3)'}}>{a.zona}</td>
                            <td style={{padding:'7px 10px'}}><span className="tag tag-blue" style={{fontSize:9}}>{a.uso}</span></td>
                            <td style={{padding:'7px 10px',fontWeight:600}}>{a.sba.toLocaleString()} m²</td>
                            <td style={{padding:'7px 10px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <div style={{width:44,height:5,borderRadius:3,background:'var(--border2)',overflow:'hidden'}}>
                                  <div style={{width:`${a.occ}%`,height:'100%',background:a.occ>=90?'var(--green)':a.occ>=75?'var(--amber)':'var(--red)',borderRadius:3}}/>
                                </div>
                                <span style={{fontSize:10,fontWeight:600,color:a.occ>=90?'var(--green)':a.occ>=75?'var(--amber)':'var(--red)'}}>{a.occ}%</span>
                              </div>
                            </td>
                            <td style={{padding:'7px 10px'}}>{a.renta} €</td>
                            <td style={{padding:'7px 10px'}}><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>Ver</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tres columnas: Identificación · Fechas · Prórroga */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                  <div className="info-block">
                    <div className="ib-title">IDENTIFICACIÓN</div>
                    {!nuevoModo && <div className="ir"><span className="ir-k">ID mandato</span><span className="ir-v mono">{M.id}</span></div>}
                    <div className="ir"><span className="ir-k">Tipo</span>
                      <select className="fsel" value={tipoV} onChange={e=>setTipoV(e.target.value)} style={{fontSize:11,padding:'2px 6px'}}>
                        {['Leasing','Capital Markets','Valoraciones','Property Management'].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="ir"><span className="ir-k">Exclusividad</span>
                      <select className="fsel" value={exclV} onChange={e=>setExclV(e.target.value)} style={{fontSize:11,padding:'2px 6px'}}>
                        {['Exclusiva','Coexclusiva'].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    {!nuevoModo && <div className="ir"><span className="ir-k">Estado</span><span className="ir-v"><span className="tag tag-green">{M.estado}</span></span></div>}
                    <div className="ir"><span className="ir-k">Línea de negocio</span>
                      <select className="fsel" value={lineaV} onChange={e=>setLineaV(e.target.value)} style={{fontSize:11,padding:'2px 6px'}}>
                        {['Leasing','Capital Markets','Valoraciones'].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="ir"><span className="ir-k">Equipo</span>
                      <select className="fsel" value={equipoV} onChange={e=>setEquipoV(e.target.value)} style={{fontSize:11,padding:'2px 6px'}}>
                        {['Leasing Oficinas MAD','Leasing Oficinas BCN','Capital Markets MAD','Valoraciones MAD'].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="info-block">
                    <div className="ib-title">FECHAS CONTRACTUALES</div>
                    <div className="ir"><span className="ir-k">Concesión</span>
                      <input type="date" className="fsel" value={fConcesion} onChange={e=>setFConcesion(e.target.value)} style={{fontSize:11,padding:'2px 6px',fontFamily:'var(--mono)'}}/>
                    </div>
                    <div className="ir"><span className="ir-k">Inicio</span>
                      <input type="date" className="fsel" value={fInicio} onChange={e=>setFInicio(e.target.value)} style={{fontSize:11,padding:'2px 6px',fontFamily:'var(--mono)'}}/>
                    </div>
                    <div className="ir"><span className="ir-k">Finalización</span>
                      <input type="date" className="fsel" value={fFin} onChange={e=>setFFin(e.target.value)} style={{fontSize:11,padding:'2px 6px',fontFamily:'var(--mono)',color:'var(--red)',fontWeight:600}}/>
                    </div>
                    {!nuevoModo && <div className="ir"><span className="ir-k">Límite preaviso</span><span className="ir-v" style={{color:'var(--amber)',fontWeight:600}}>{M.fecha_preaviso}</span></div>}
                    <div className="ir"><span className="ir-k">Preaviso (días)</span>
                      <input type="number" className="fsel" value={preavisoDias} onChange={e=>setPreavisoDias(+e.target.value)} min={0} style={{fontSize:11,padding:'2px 6px',width:70}}/>
                    </div>
                    <div className="ir"><span className="ir-k">Alerta PDB (días)</span>
                      <input type="number" className="fsel" value={alertaDias} onChange={e=>setAlertaDias(+e.target.value)} min={0} style={{fontSize:11,padding:'2px 6px',width:70}}/>
                    </div>
                  </div>

                  <div className="info-block">
                    <div className="ib-title">PRÓRROGA Y HONORARIOS</div>
                    <div className="ir"><span className="ir-k">Prórroga tácita</span>
                      <select className="fsel" value={prorrogaTacita?'Sí':'No'} onChange={e=>setProrrogaTacita(e.target.value==='Sí')} style={{fontSize:11,padding:'2px 6px',color:prorrogaTacita?'var(--teal)':'var(--text3)',fontWeight:600}}>
                        <option>Sí</option><option>No</option>
                      </select>
                    </div>
                    {prorrogaTacita && <>
                      <div className="ir"><span className="ir-k">Duración prórroga</span>
                        <input type="number" className="fsel" value={prorrogaMeses} onChange={e=>setProrrogaMeses(+e.target.value)} min={1} style={{fontSize:11,padding:'2px 6px',width:70}}/>
                        <span style={{fontSize:10,color:'var(--text4)',marginLeft:4}}>meses</span>
                      </div>
                      {!nuevoModo && <>
                        <div className="ir"><span className="ir-k">Inicio prórroga</span><span className="ir-v">{M.prorroga_inicio}</span></div>
                        <div className="ir"><span className="ir-k">Fin prórroga</span><span className="ir-v">{M.prorroga_fin}</span></div>
                      </>}
                    </>}
                    <div className="ir"><span className="ir-k">Honorarios (%)</span>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <input type="number" className="fsel" value={honorariosPct} onChange={e=>setHonorariosPct(+e.target.value)} min={0} max={100} step={0.5} style={{fontSize:11,padding:'2px 6px',width:65}}/>
                        <span style={{fontSize:10,color:'var(--text4)'}}>% renta anual</span>
                      </div>
                    </div>
                    {!nuevoModo && <div className="ir"><span className="ir-k">SBA bajo mandato</span><span className="ir-v">{M.sba_mandato.toLocaleString()} m²</span></div>}
                  </div>
                </div>

                {/* Condiciones + Datos económicos */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                  <div className="info-block">
                    <div className="ib-title">CONDICIONES DEL MANDATO</div>
                    <textarea value={condiciones} onChange={e=>setCondiciones(e.target.value)} rows={4}
                      style={{width:'100%',fontSize:11,fontFamily:'inherit',border:'1px solid var(--border)',borderRadius:4,padding:'6px 8px',resize:'vertical',color:'var(--text2)',lineHeight:1.6,marginBottom:8}}/>
                    <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>Condiciones de prórroga</div>
                    <textarea value={condProrroga} onChange={e=>setCondProrroga(e.target.value)} rows={3}
                      style={{width:'100%',fontSize:11,fontFamily:'inherit',border:'1px solid var(--border)',borderRadius:4,padding:'6px 8px',resize:'vertical',color:'var(--text3)',lineHeight:1.6,marginBottom:8}}/>
                    <div style={{fontSize:10,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>Observaciones internas</div>
                    <textarea value={obsInternas} onChange={e=>setObsInternas(e.target.value)} rows={3}
                      style={{width:'100%',fontSize:11,fontFamily:'inherit',border:'1px solid var(--border)',borderRadius:4,padding:'6px 8px',resize:'vertical',color:'var(--text3)',lineHeight:1.6}}/>
                  </div>

                  <div className="info-block">
                    <div className="ib-title">DATOS ECONÓMICOS</div>
                    <div className="ir"><span className="ir-k">SBA bajo mandato (m²)</span>
                      <input type="number" className="fsel" value={sbaMandato} onChange={e=>setSbaMandato(+e.target.value)} min={0} style={{fontSize:12,padding:'2px 6px',width:90,fontFamily:'var(--mono)',fontWeight:600}}/>
                    </div>
                    <div className="ir"><span className="ir-k">Renta de referencia (€/m²)</span>
                      <input type="number" className="fsel" value={rentaEuros} onChange={e=>setRentaEuros(+e.target.value)} min={0} step={0.5} style={{fontSize:12,padding:'2px 6px',width:80,fontFamily:'var(--mono)'}}/>
                    </div>
                    <div className="ir"><span className="ir-k">Plazo estimado (años)</span>
                      <input type="number" className="fsel" value={plazoAnios} onChange={e=>setPlazoAnios(+e.target.value)} min={1} style={{fontSize:12,padding:'2px 6px',width:65}}/>
                    </div>
                    <div style={{marginTop:12,padding:'12px 14px',background:'var(--green-lt)',border:'1px solid var(--green-bd)',borderRadius:6}}>
                      <div style={{fontSize:9,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Honorarios estimados</div>
                      <div style={{fontSize:24,fontWeight:700,color:'var(--green)',fontFamily:'var(--mono)',lineHeight:1}}>
                        {honorariosEst > 0 ? honorariosEst.toLocaleString('es-ES') + ' €' : '—'}
                      </div>
                      <div style={{fontSize:10,color:'var(--green)',opacity:.75,marginTop:3}}>
                        {honorariosPct}% × {sbaMandato.toLocaleString()} m² × {rentaEuros} €/m² × 12 meses
                      </div>
                    </div>
                    {!nuevoModo && (
                      <div style={{marginTop:10}}>
                        <div className="ib-title" style={{marginTop:8}}>CUENTA VINCULADA</div>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6,cursor:'pointer'}} onClick={()=>navigate('portfolios')}>
                          <div style={{width:32,height:32,borderRadius:6,background:'var(--gray-lt)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'var(--text)'}}>{M.cuenta_id}</div>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:'var(--accent)'}}>{M.cuenta}</div>
                            <div className="asset-sub">Ver portfolio ↗</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hitos contractuales — solo en vista */}
                {!nuevoModo && (
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
                          {hito:'Concesión del mandato',fecha:M.fecha_concesion,est:'Completado',color:'var(--green)'},
                          {hito:'Inicio del mandato',fecha:M.fecha_inicio,est:'Completado',color:'var(--green)'},
                          {hito:'Alerta PDB (60 días)',fecha:'30/12/2025',est:'Completado',color:'var(--teal)'},
                          {hito:'Límite preaviso',fecha:M.fecha_preaviso,est:'Próximo',color:'var(--amber)'},
                          {hito:'Vencimiento mandato',fecha:M.fecha_fin,est:'Próximo',color:'var(--red)'},
                          {hito:'Inicio prórroga tácita',fecha:M.prorroga_inicio,est:'Pendiente',color:'var(--purple)'},
                          {hito:'Fin prórroga',fecha:M.prorroga_fin,est:'Pendiente',color:'var(--purple)'},
                        ].map((h,i)=>(
                          <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                            <td style={{padding:'7px 12px',fontWeight:500}}>{h.hito}</td>
                            <td style={{padding:'7px 12px',fontWeight:600,color:h.color,fontFamily:'monospace'}}>{h.fecha}</td>
                            <td style={{padding:'7px 12px'}}><span className={`tag ${h.est==='Completado'?'tag-green':h.est==='Próximo'?'tag-amber':'tag-gray'}`}>{h.est}</span></td>
                            <td style={{padding:'7px 12px',fontSize:10,color:'var(--text4)'}}>{h.hito}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                          <td style={{padding:'7px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{a.id}</span></td>
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
                            <td style={{padding:'8px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{t.id}</span></td>
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
                            <td style={{padding:'8px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{v.id}</span></td>
                            <td style={{padding:'8px 12px',color:'var(--text3)'}}>{v.fecha}</td>
                            <td style={{padding:'8px 12px',fontWeight:500}}>{v.cuenta}</td>
                            <td style={{padding:'8px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{v.demanda}</span></td>
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

          {/* ── TAB: INFORME DE GESTIÓN ── */}
          {tab==='informe' && (
            <div className="tab-content active">
              <div className="info-pad">

                {/* Cabecera */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                  <div>
                    <div style={{fontSize:11,color:'var(--text3)',marginBottom:2}}>Informe generado automáticamente · Mandato {M.id} · {M.activos[0].nombre}</div>
                    <div style={{fontSize:10,color:'var(--text4)'}}>Zona: {M.zona} · Actualizado: {new Date().toLocaleDateString('es-ES')}</div>
                  </div>
                  <button className="ab-btn save" style={{gap:6,fontSize:12,padding:'8px 18px'}} onClick={exportarPPT}>
                    <span style={{fontSize:14}}>📊</span> Exportar informe (PPT)
                  </button>
                </div>

                {/* Bloque 1: Activos comparables */}
                <div className="info-block" style={{marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                    <div>
                      <div className="ib-title" style={{marginBottom:2}}>ACTIVOS COMPARABLES POR LA ZONA</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>Activos de oficinas en {M.zona} vinculados a la zona del activo del mandato</div>
                    </div>
                    <span className="tag tag-blue">{COMPARABLES.length} activos</span>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead><tr>{['Referencia','Nombre del activo','SBA (m²)','Renta €/m²/mes','Ocupación','Estado'].map(h=>(
                      <th key={h} style={{padding:'7px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {COMPARABLES.map((c,i)=>(
                        <tr key={c.ref} style={{borderBottom:'1px solid var(--border)',background:i%2===0?'#fff':'var(--gray-lt)'}}>
                          <td style={{padding:'8px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{c.ref}</span></td>
                          <td style={{padding:'8px 12px',fontWeight:500}}>{c.nombre}</td>
                          <td style={{padding:'8px 12px',fontWeight:600}}>{c.sba.toLocaleString()} m²</td>
                          <td style={{padding:'8px 12px',fontWeight:600,color:'var(--accent)'}}>{c.renta} €</td>
                          <td style={{padding:'8px 12px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{width:50,height:4,borderRadius:2,background:'var(--border)'}}>
                                <div style={{width:`${c.ocup}%`,height:'100%',borderRadius:2,background:c.ocup>=90?'var(--green)':c.ocup>=70?'var(--amber)':'var(--red)'}}/>
                              </div>
                              <span style={{fontSize:10,fontWeight:600}}>{c.ocup}%</span>
                            </div>
                          </td>
                          <td style={{padding:'8px 12px'}}><span className={`tag ${COMP_EST[c.estado]||'tag-gray'}`}>{c.estado}</span></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr style={{borderTop:'2px solid var(--border)',background:'var(--gray-lt)'}}>
                      <td colSpan={2} style={{padding:'7px 12px',fontWeight:700,fontSize:10}}>MEDIA ZONA {M.zona}</td>
                      <td style={{padding:'7px 12px',fontWeight:700}}>{Math.round(COMPARABLES.reduce((s,c)=>s+c.sba,0)/COMPARABLES.length).toLocaleString()} m²</td>
                      <td style={{padding:'7px 12px',fontWeight:700,color:'var(--accent)'}}>{(COMPARABLES.reduce((s,c)=>s+c.renta,0)/COMPARABLES.length).toFixed(1)} €</td>
                      <td style={{padding:'7px 12px',fontWeight:700}}>{Math.round(COMPARABLES.reduce((s,c)=>s+c.ocup,0)/COMPARABLES.length)}%</td>
                      <td/>
                    </tr></tfoot>
                  </table>
                </div>

                {/* Bloque 2: Situación del mercado */}
                <div className="info-block" style={{marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                    <div>
                      <div className="ib-title" style={{marginBottom:2}}>SITUACIÓN ACTUAL DEL MERCADO</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>Operaciones cerradas en la zona del acumulado del año · Fuente: Arrendatarios PDB</div>
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:10,color:'var(--text4)'}}>Total absorbido</div>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--accent)'}}>{MERCADO_OPS.reduce((s,o)=>s+o.m2,0).toLocaleString()} m²</div>
                      </div>
                      <span className="tag tag-teal">{MERCADO_OPS.length} ops. cerradas</span>
                    </div>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead><tr>{['Fecha','Activo','Arrendatario','Superficie','Renta €/m²/mes','Plazo','Consultora'].map(h=>(
                      <th key={h} style={{padding:'7px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {MERCADO_OPS.map((o,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid var(--border)',background:i%2===0?'#fff':'var(--gray-lt)'}}>
                          <td style={{padding:'8px 12px',color:'var(--text3)',fontSize:10}}>{o.fecha}</td>
                          <td style={{padding:'8px 12px',fontWeight:500}}>{o.activo}</td>
                          <td style={{padding:'8px 12px',fontWeight:500,color:'var(--accent)'}}>{o.arrendatario}</td>
                          <td style={{padding:'8px 12px',fontWeight:600}}>{o.m2.toLocaleString()} m²</td>
                          <td style={{padding:'8px 12px',fontWeight:600,color:'var(--green)'}}>{o.renta} €</td>
                          <td style={{padding:'8px 12px',color:'var(--text3)'}}>{o.plazo}</td>
                          <td style={{padding:'8px 12px'}}><span style={{fontSize:10,fontWeight:600,color:o.consultora==='Savills'?'var(--accent)':'var(--text3)'}}>{o.consultora}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bloque 3: Visitas realizadas */}
                <div className="info-block" style={{marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                    <div>
                      <div className="ib-title" style={{marginBottom:2}}>VISITAS REALIZADAS AL ACTIVO</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>Registro de todas las visitas vinculadas a {M.activos[0].nombre}</div>
                    </div>
                    <div style={{display:'flex',gap:12,alignItems:'center'}}>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:10,color:'var(--text4)'}}>Prob. media</div>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--purple)'}}>{Math.round(VISS.reduce((s,v)=>s+v.prob,0)/VISS.length)}%</div>
                      </div>
                      <span className="tag tag-purple">{VISS.length} visitas</span>
                    </div>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead><tr>{['ID','Fecha','Cuenta','Demanda','Tipo','Estado','Interés','Prob. KF'].map(h=>(
                      <th key={h} style={{padding:'7px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {VISS.map((v,i)=>(
                        <tr key={v.id} style={{borderBottom:'1px solid var(--border)',background:i%2===0?'#fff':'var(--gray-lt)'}}>
                          <td style={{padding:'8px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{v.id}</span></td>
                          <td style={{padding:'8px 12px',color:'var(--text3)',fontSize:10}}>{v.fecha}</td>
                          <td style={{padding:'8px 12px',fontWeight:500}}>{v.cuenta}</td>
                          <td style={{padding:'8px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{v.demanda}</span></td>
                          <td style={{padding:'8px 12px'}}><span className="tag tag-teal">{v.tipo}</span></td>
                          <td style={{padding:'8px 12px'}}><span className="tag tag-green">{v.estado}</span></td>
                          <td style={{padding:'8px 12px',fontWeight:600,color:INT_COLOR[v.interes]||'var(--text)'}}>{v.interes}</td>
                          <td style={{padding:'8px 12px',fontWeight:700,color:'var(--purple)'}}>{v.prob}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bloque 4: Presentaciones */}
                <div className="info-block">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                    <div>
                      <div className="ib-title" style={{marginBottom:2}}>PRESENTACIONES DEL ACTIVO A COMPAÑÍAS</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>Registro de todas las presentaciones comerciales realizadas sobre {M.activos[0].nombre}</div>
                    </div>
                    <div style={{display:'flex',gap:12,alignItems:'center'}}>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:10,color:'var(--text4)'}}>En negociación / Firmado</div>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--green)'}}>{PRESENTACIONES_INFORME.filter(p=>p.estado==='En negociación'||p.estado==='Firmado').length}</div>
                      </div>
                      <span className="tag tag-amber">{PRESENTACIONES_INFORME.length} presentaciones</span>
                    </div>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead><tr>{['Fecha','Empresa','Contacto','Plantas','Superficie','Interés','Estado','Ref.'].map(h=>(
                      <th key={h} style={{padding:'7px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {PRESENTACIONES_INFORME.map((p,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid var(--border)',background:i%2===0?'#fff':'var(--gray-lt)'}}>
                          <td style={{padding:'8px 12px',color:'var(--text3)',fontSize:10}}>{p.fecha}</td>
                          <td style={{padding:'8px 12px',fontWeight:600}}>{p.empresa}</td>
                          <td style={{padding:'8px 12px',color:'var(--text3)'}}>{p.contacto}</td>
                          <td style={{padding:'8px 12px',fontSize:10,color:'var(--text3)'}}>{p.plantas}</td>
                          <td style={{padding:'8px 12px',fontWeight:600}}>{p.m2.toLocaleString()} m²</td>
                          <td style={{padding:'8px 12px',fontWeight:600,color:INT_COLOR[p.interes]||'var(--text)'}}>{p.interes}</td>
                          <td style={{padding:'8px 12px'}}><span className={`tag ${PRES_EST[p.estado]||'tag-gray'}`}>{p.estado}</span></td>
                          <td style={{padding:'8px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{p.ref}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* ── Panel derecho ── */}
        <div className="ficha-right">

          {/* KPIs del mandato */}
          <div className="rp-sec">
            <div className="rp-lbl">Métricas del mandato</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:4}}>
              {[
                {lbl:'Activos',val: nuevoModo ? ofertasV.length : M.activos.length, color:'var(--teal)'},
                {lbl:'Tipo',val: nuevoModo ? tipoV : M.tipo, color:'var(--accent)', small:true},
              ].map(k=>(
                <div key={k.lbl} style={{background:'var(--gray-lt)',borderRadius:'var(--r)',padding:'7px 10px',border:'1px solid var(--border)'}}>
                  <div style={{fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:2}}>{k.lbl}</div>
                  <div style={{fontSize:k.small?11:18,fontWeight:700,color:k.color,lineHeight:1}}>{k.val||'—'}</div>
                </div>
              ))}
            </div>
            <div style={{background:'var(--green-lt)',border:'1px solid var(--green-bd)',borderRadius:'var(--r)',padding:'9px 12px'}}>
              <div style={{fontSize:9,fontWeight:600,color:'var(--green)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Honorarios estimados</div>
              <div style={{fontSize:20,fontWeight:700,color:'var(--green)',fontFamily:'var(--mono)',lineHeight:1}}>
                {honorariosEst > 0 ? honorariosEst.toLocaleString('es-ES') + ' €' : '—'}
              </div>
              <div style={{fontSize:9,color:'var(--green)',opacity:.75,marginTop:2}}>{honorariosPct}% · {sbaMandato.toLocaleString()} m² · {rentaEuros} €/m²</div>
            </div>
          </div>

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
            <RpBtn onClick={()=>setTab('info')}>📅 Ver cronograma</RpBtn>
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
      {showTarea && <AsignarTareaModal refTipo="Mandato" refNombre="MAN-2501 · P.E Avalon" onClose={() => setShowTarea(false)} />}
    </div>
  )
}
