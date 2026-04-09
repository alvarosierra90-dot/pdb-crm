import { useState, useRef, useEffect, useMemo } from 'react'

const CUENTAS_PDB = [
  'Oracle Spain SL', 'Generali Real Estate', 'Grupo Mediática España',
  'ISDE', 'Flexwork Solutions Spain SL', 'Hospitality Group Iberia SL',
  'Merlín Properties', 'GMP Property', 'FREO Investments',
  'Empresa XYZ', 'Pharma Group Spain', 'Grupo Empresarial Altamira SL',
]

const NOTICIAS = [
  {
    id: 1, cliente: 'Oracle Spain SL', fuente: 'Expansión', fuente_color: '#e63946',
    fecha: '07/04/2026', categoria: 'Expansión',
    titular: 'Oracle refuerza su presencia en España con una nueva sede operativa en Madrid',
    resumen: 'La compañía tecnológica confirma la búsqueda de entre 10.000 y 15.000 m² de oficinas en el corredor norte de Madrid para centralizar sus operaciones ibéricas.',
    relevancia: 'alta',
  },
  {
    id: 2, cliente: 'Oracle Spain SL', fuente: 'El Economista', fuente_color: '#2d6a4f',
    fecha: '03/04/2026', categoria: 'Resultados',
    titular: 'Oracle Spain registra un crecimiento del 18% en ingresos cloud durante el primer trimestre',
    resumen: 'El negocio de servicios en la nube impulsa la expansión del equipo local, con previsión de incorporar 200 nuevos empleados antes de fin de año.',
    relevancia: 'media',
  },
  {
    id: 3, cliente: 'Generali Real Estate', fuente: 'Cinco Días', fuente_color: '#457b9d',
    fecha: '06/04/2026', categoria: 'Transacción',
    titular: 'Generali Real Estate cierra la adquisición de un edificio prime en el eje Castellana por 85M€',
    resumen: 'La aseguradora italiana consolida su portfolio español con la compra de un inmueble de 8.200 m² totalmente arrendado en la zona CBD de Madrid.',
    relevancia: 'alta',
  },
  {
    id: 4, cliente: 'Generali Real Estate', fuente: 'Inmobiliaria', fuente_color: '#8338ec',
    fecha: '01/04/2026', categoria: 'Estrategia',
    titular: 'Generali destina 300M€ a nueva ronda de inversión en activos logísticos y oficinas en Iberia',
    resumen: 'El plan estratégico 2026-2028 contempla la compra de entre 4 y 6 activos en España y Portugal, con foco en ubicaciones prime y contratos de larga duración.',
    relevancia: 'alta',
  },
  {
    id: 5, cliente: 'Grupo Mediática España', fuente: 'PR Noticias', fuente_color: '#f77f00',
    fecha: '05/04/2026', categoria: 'Expansión',
    titular: 'Grupo Mediática busca nueva sede en Madrid para reunir sus divisiones en un solo campus',
    resumen: 'El grupo de comunicación evalúa espacios de entre 13.000 y 18.000 m² en el corredor norte. La mudanza prevista para el cuarto trimestre de 2026.',
    relevancia: 'alta',
  },
  {
    id: 6, cliente: 'Grupo Mediática España', fuente: 'El País', fuente_color: '#1d3461',
    fecha: '28/03/2026', categoria: 'Corporativo',
    titular: 'Mediática España completa la integración de su división digital tras la fusión con Contenidos Plus',
    resumen: 'La operación, valorada en 120M€, duplica la plantilla del grupo y acelera la necesidad de ampliar instalaciones físicas en la capital.',
    relevancia: 'media',
  },
  {
    id: 7, cliente: 'Merlín Properties', fuente: 'Expansión', fuente_color: '#e63946',
    fecha: '07/04/2026', categoria: 'Resultados',
    titular: 'Merlín Properties eleva su NAV un 4,2% en el primer trimestre y supera expectativas del mercado',
    resumen: 'El SOCIMI reporta una ocupación del 94% en su portfolio de oficinas y logística, con rentas medias al alza en todas las geografías.',
    relevancia: 'media',
  },
  {
    id: 8, cliente: 'Merlín Properties', fuente: 'Idealista News', fuente_color: '#06a77d',
    fecha: '04/04/2026', categoria: 'Producto',
    titular: 'Merlín lanza su nueva plataforma de espacios flex bajo la marca LOOM en tres nuevas ubicaciones',
    resumen: 'La SOCIMI amplía su oferta de coworking premium en Madrid y Barcelona con 6.000 m² adicionales para capturar la demanda de empresas medianas.',
    relevancia: 'media',
  },
  {
    id: 9, cliente: 'ISDE', fuente: 'El Mundo', fuente_color: '#c1121f',
    fecha: '02/04/2026', categoria: 'Expansión',
    titular: 'ISDE anuncia la apertura de un nuevo campus jurídico en Madrid con capacidad para 500 alumnos',
    resumen: 'La escuela de derecho busca instalaciones de entre 3.000 y 4.500 m² en zona céntrica o CBD para su nuevo campus especializado en derecho digital.',
    relevancia: 'alta',
  },
  {
    id: 10, cliente: 'Flexwork Solutions Spain SL', fuente: 'Cinco Días', fuente_color: '#457b9d',
    fecha: '06/04/2026', categoria: 'Expansión',
    titular: 'Flexwork Solutions acelera su expansión en España con 8 nuevas aperturas previstas para 2026',
    resumen: 'El operador de espacios de trabajo flexible busca locales de entre 800 y 2.000 m² en zonas de alta demanda para su modelo de coworking híbrido.',
    relevancia: 'alta',
  },
  {
    id: 11, cliente: 'FREO Investments', fuente: 'CoStar', fuente_color: '#0077b6',
    fecha: '05/04/2026', categoria: 'Transacción',
    titular: 'FREO Investments inicia proceso de desinversión de su portfolio madrileño de oficinas secundarias',
    resumen: 'El fondo alemán pone a la venta tres inmuebles en el extrarradio de Madrid como parte de su estrategia de rotación hacia activos core en zonas prime.',
    relevancia: 'media',
  },
  {
    id: 12, cliente: 'GMP Property', fuente: 'Savills Research', fuente_color: '#b5179e',
    fecha: '03/04/2026', categoria: 'Mercado',
    titular: 'GMP Property refuerza el portfolio Albatros con mejoras capex estimadas en 4M€',
    resumen: 'La propietaria ha iniciado obras de mejora en las zonas comunes del complejo Albatros con el objetivo de posicionarlo en el segmento prime-plus.',
    relevancia: 'alta',
  },
  {
    id: 13, cliente: 'Hospitality Group Iberia SL', fuente: 'Hosteltur', fuente_color: '#e76f51',
    fecha: '04/04/2026', categoria: 'Expansión',
    titular: 'Hospitality Group Iberia abre nueva división de espacios para eventos corporativos en Madrid',
    resumen: 'El grupo hotelero diversifica su negocio con la búsqueda de sedes para eventos de entre 2.000 y 6.000 m² en zonas bien comunicadas de la capital.',
    relevancia: 'media',
  },
  {
    id: 14, cliente: 'Pharma Group Spain', fuente: 'El Global', fuente_color: '#2b9348',
    fecha: '31/03/2026', categoria: 'Regulatorio',
    titular: 'Pharma Group Spain anuncia traslado de sus laboratorios de I+D al Parque Tecnológico de Madrid',
    resumen: 'La farmacéutica prevé liberar sus actuales instalaciones en el CBD y concentrar operaciones en un espacio de más de 800 m² en zona tecnológica.',
    relevancia: 'media',
  },
]

const CAT_COLORS = {
  'Expansión':  { bg:'#eff6ff', color:'#2563eb' },
  'Transacción':{ bg:'#f0fdf4', color:'#16a34a' },
  'Resultados': { bg:'#fefce8', color:'#ca8a04' },
  'Estrategia': { bg:'#faf5ff', color:'#7c3aed' },
  'Corporativo':{ bg:'#fff1f2', color:'#e11d48' },
  'Producto':   { bg:'#f0fdfa', color:'#0d9488' },
  'Mercado':    { bg:'#fdf4ff', color:'#a21caf' },
  'Regulatorio':{ bg:'#fff7ed', color:'#ea580c' },
}
const REL_COLORS = {
  alta:  { bg:'#fef2f2', color:'#dc2626' },
  media: { bg:'#fefce8', color:'#ca8a04' },
}

export default function Noticias() {
  const [watchlist, setWatchlist] = useState(['Oracle Spain SL', 'Generali Real Estate', 'Grupo Mediática España'])
  const [showAdd, setShowAdd] = useState(false)
  const [filterCliente, setFilterCliente] = useState('Todos')
  const [filterCat, setFilterCat] = useState('Todas')
  const [refreshing, setRefreshing] = useState(false)
  const addRef = useRef(null)

  useEffect(() => {
    const h = e => { if (addRef.current && !addRef.current.contains(e.target)) setShowAdd(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function addToWatchlist(cuenta) {
    if (!watchlist.includes(cuenta)) setWatchlist(p => [...p, cuenta])
    setShowAdd(false)
  }
  function removeFromWatchlist(cuenta) {
    setWatchlist(p => p.filter(c => c !== cuenta))
    if (filterCliente === cuenta) setFilterCliente('Todos')
  }
  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  const noticiasWatchlist = useMemo(() => NOTICIAS.filter(n => watchlist.includes(n.cliente)), [watchlist])
  const categorias = useMemo(() => ['Todas', ...new Set(noticiasWatchlist.map(n => n.categoria))], [noticiasWatchlist])

  const noticias = useMemo(() => noticiasWatchlist.filter(n => {
    if (filterCliente !== 'Todos' && n.cliente !== filterCliente) return false
    if (filterCat !== 'Todas' && n.categoria !== filterCat) return false
    return true
  }), [noticiasWatchlist, filterCliente, filterCat])

  const disponibles = CUENTAS_PDB.filter(c => !watchlist.includes(c))

  return (
    <div style={{display:'flex',flex:1,overflow:'hidden',background:'var(--bg)'}}>

      {/* Sidebar watchlist */}
      <div style={{width:220,flexShrink:0,borderRight:'1px solid var(--border)',background:'var(--surface)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text)'}}>Mis cuentas</div>
          <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>Watchlist de clientes</div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
          <div
            onClick={() => setFilterCliente('Todos')}
            style={{padding:'7px 14px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',background:filterCliente==='Todos'?'var(--accent-lt)':'',color:filterCliente==='Todos'?'var(--accent)':'var(--text2)',fontWeight:filterCliente==='Todos'?700:400,borderLeft:filterCliente==='Todos'?'3px solid var(--accent)':'3px solid transparent'}}
            onMouseEnter={e=>{ if(filterCliente!=='Todos') e.currentTarget.style.background='var(--gray-lt)' }}
            onMouseLeave={e=>{ if(filterCliente!=='Todos') e.currentTarget.style.background='' }}
          >
            <span>Todos los clientes</span>
            <span style={{fontSize:10,background:'var(--border)',borderRadius:9,padding:'1px 6px',color:'var(--text3)'}}>{noticiasWatchlist.length}</span>
          </div>

          {watchlist.map(cuenta => {
            const count = noticiasWatchlist.filter(n => n.cliente === cuenta).length
            const active = filterCliente === cuenta
            return (
              <div
                key={cuenta}
                onClick={() => setFilterCliente(cuenta)}
                style={{padding:'7px 14px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',background:active?'var(--accent-lt)':'',color:active?'var(--accent)':'var(--text2)',fontWeight:active?600:400,borderLeft:active?'3px solid var(--accent)':'3px solid transparent',gap:6}}
                onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='var(--gray-lt)' }}
                onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='' }}
              >
                <span style={{flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{cuenta}</span>
                <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                  <span style={{fontSize:10,background:'var(--border)',borderRadius:9,padding:'1px 5px',color:'var(--text3)'}}>{count}</span>
                  <span
                    onClick={e=>{ e.stopPropagation(); removeFromWatchlist(cuenta) }}
                    style={{fontSize:10,color:'var(--text4)',cursor:'pointer',lineHeight:1,padding:'1px 3px',borderRadius:3}}
                    onMouseEnter={e=>{ e.currentTarget.style.color='var(--red)'; e.currentTarget.style.background='var(--red-lt)' }}
                    onMouseLeave={e=>{ e.currentTarget.style.color='var(--text4)'; e.currentTarget.style.background='' }}
                  >✕</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Añadir cuenta */}
        <div style={{padding:10,borderTop:'1px solid var(--border)',flexShrink:0,position:'relative'}} ref={addRef}>
          <button
            onClick={() => setShowAdd(v => !v)}
            style={{width:'100%',padding:'6px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'#fff',fontSize:11,cursor:'pointer',color:'var(--text3)',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}
          >
            <span style={{fontSize:13,lineHeight:1}}>+</span> Añadir cuenta
          </button>
          {showAdd && disponibles.length > 0 && (
            <div style={{position:'absolute',bottom:'110%',left:0,right:0,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',boxShadow:'0 4px 16px rgba(0,0,0,.12)',zIndex:99,maxHeight:240,overflowY:'auto'}}>
              <div style={{padding:'6px 10px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',borderBottom:'1px solid var(--border)'}}>Cuentas PDB</div>
              {disponibles.map(c => (
                <div
                  key={c}
                  onClick={() => addToWatchlist(c)}
                  style={{padding:'7px 12px',fontSize:11,cursor:'pointer',color:'var(--text2)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                >{c}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feed noticias */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Toolbar */}
        <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>Noticias</div>
          <div style={{fontSize:11,color:'var(--text3)'}}>
            {noticias.length} resultado{noticias.length!==1?'s':''} · actualizado hoy
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{display:'flex',gap:4,alignItems:'center'}}>
              <span style={{fontSize:10,color:'var(--text4)',fontWeight:600,textTransform:'uppercase'}}>Categoría:</span>
              <select
                value={filterCat}
                onChange={e=>setFilterCat(e.target.value)}
                style={{fontSize:11,border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'3px 6px',background:'#fff',fontFamily:'inherit',color:'var(--text)',cursor:'pointer'}}
              >
                {categorias.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{padding:'5px 10px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'#fff',fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)',display:'flex',alignItems:'center',gap:4}}
            >
              <span style={{display:'inline-block',animation:refreshing?'spin 1s linear infinite':'none'}}>↻</span>
              {refreshing ? 'Buscando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Cards */}
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px',display:'flex',flexDirection:'column',gap:10}}>
          {watchlist.length === 0 ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,color:'var(--text3)',padding:40}}>
              <div style={{fontSize:32}}>📋</div>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text2)'}}>Sin cuentas en seguimiento</div>
              <div style={{fontSize:12,textAlign:'center',maxWidth:280}}>Añade cuentas de la PDB a tu watchlist para ver las últimas noticias relacionadas.</div>
            </div>
          ) : noticias.length === 0 ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,color:'var(--text3)',padding:40}}>
              <div style={{fontSize:28}}>🔍</div>
              <div style={{fontSize:13,fontWeight:600}}>Sin resultados para este filtro</div>
            </div>
          ) : noticias.map(n => {
            const cat = CAT_COLORS[n.categoria] || { bg:'var(--gray-lt)', color:'var(--text3)' }
            const rel = REL_COLORS[n.relevancia] || REL_COLORS.media
            return (
              <div
                key={n.id}
                style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'12px 14px',display:'flex',flexDirection:'column',gap:6,cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,.07)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
              >
                <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                  <span style={{fontSize:10,fontWeight:700,color:'#fff',background:n.fuente_color,borderRadius:4,padding:'2px 7px'}}>{n.fuente}</span>
                  <span style={{fontSize:10,fontWeight:600,color:cat.color,background:cat.bg,borderRadius:4,padding:'2px 7px'}}>{n.categoria}</span>
                  {n.relevancia === 'alta' && (
                    <span style={{fontSize:10,fontWeight:600,color:rel.color,background:rel.bg,borderRadius:4,padding:'2px 7px'}}>⬆ Alta relevancia</span>
                  )}
                  <span style={{marginLeft:'auto',fontSize:10,color:'var(--text4)'}}>{n.fecha}</span>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:'var(--text)',lineHeight:1.4}}>{n.titular}</div>
                <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.6}}>{n.resumen}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
                  <span style={{fontSize:10,fontWeight:600,color:'var(--accent)',background:'var(--accent-lt)',borderRadius:4,padding:'2px 7px'}}>🏢 {n.cliente}</span>
                  <span style={{fontSize:10,color:'var(--text4)',marginLeft:'auto'}}>Ver fuente →</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
