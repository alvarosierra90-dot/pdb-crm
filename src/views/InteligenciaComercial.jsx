import { useState, useRef, useEffect, useMemo } from 'react'

// ─── NOTICIAS DATA ───────────────────────────────────────────────────────────
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
    url: '#', relevancia: 'alta',
  },
  {
    id: 2, cliente: 'Oracle Spain SL', fuente: 'El Economista', fuente_color: '#2d6a4f',
    fecha: '03/04/2026', categoria: 'Resultados',
    titular: 'Oracle Spain registra un crecimiento del 18% en ingresos cloud durante el primer trimestre',
    resumen: 'El negocio de servicios en la nube impulsa la expansión del equipo local, con previsión de incorporar 200 nuevos empleados antes de fin de año.',
    url: '#', relevancia: 'media',
  },
  {
    id: 3, cliente: 'Generali Real Estate', fuente: 'Cinco Días', fuente_color: '#457b9d',
    fecha: '06/04/2026', categoria: 'Transacción',
    titular: 'Generali Real Estate cierra la adquisición de un edificio prime en el eje Castellana por 85M€',
    resumen: 'La aseguradora italiana consolida su portfolio español con la compra de un inmueble de 8.200 m² totalmente arrendado en la zona CBD de Madrid.',
    url: '#', relevancia: 'alta',
  },
  {
    id: 4, cliente: 'Generali Real Estate', fuente: 'Inmobiliaria', fuente_color: '#8338ec',
    fecha: '01/04/2026', categoria: 'Estrategia',
    titular: 'Generali destina 300M€ a nueva ronda de inversión en activos logísticos y oficinas en Iberia',
    resumen: 'El plan estratégico 2026-2028 contempla la compra de entre 4 y 6 activos en España y Portugal, con foco en ubicaciones prime y contratos de larga duración.',
    url: '#', relevancia: 'alta',
  },
  {
    id: 5, cliente: 'Grupo Mediática España', fuente: 'PR Noticias', fuente_color: '#f77f00',
    fecha: '05/04/2026', categoria: 'Expansión',
    titular: 'Grupo Mediática busca nueva sede en Madrid para reunir sus divisiones en un solo campus',
    resumen: 'El grupo de comunicación evalúa espacios de entre 13.000 y 18.000 m² en el corredor norte. La mudanza prevista para el cuarto trimestre de 2026.',
    url: '#', relevancia: 'alta',
  },
  {
    id: 6, cliente: 'Grupo Mediática España', fuente: 'El País', fuente_color: '#1d3461',
    fecha: '28/03/2026', categoria: 'Corporativo',
    titular: 'Mediática España completa la integración de su división digital tras la fusión con Contenidos Plus',
    resumen: 'La operación, valorada en 120M€, duplica la plantilla del grupo y acelera la necesidad de ampliar instalaciones físicas en la capital.',
    url: '#', relevancia: 'media',
  },
  {
    id: 7, cliente: 'Merlín Properties', fuente: 'Expansión', fuente_color: '#e63946',
    fecha: '07/04/2026', categoria: 'Resultados',
    titular: 'Merlín Properties eleva su NAV un 4,2% en el primer trimestre y supera expectativas del mercado',
    resumen: 'El SOCIMI reporta una ocupación del 94% en su portfolio de oficinas y logística, con rentas medias al alza en todas las geografías.',
    url: '#', relevancia: 'media',
  },
  {
    id: 8, cliente: 'Merlín Properties', fuente: 'Idealista News', fuente_color: '#06a77d',
    fecha: '04/04/2026', categoria: 'Producto',
    titular: 'Merlín lanza su nueva plataforma de espacios flex bajo la marca LOOM en tres nuevas ubicaciones',
    resumen: 'La SOCIMI amplía su oferta de coworking premium en Madrid y Barcelona con 6.000 m² adicionales para capturar la demanda de empresas medianas.',
    url: '#', relevancia: 'media',
  },
  {
    id: 9, cliente: 'ISDE', fuente: 'El Mundo', fuente_color: '#c1121f',
    fecha: '02/04/2026', categoria: 'Expansión',
    titular: 'ISDE anuncia la apertura de un nuevo campus jurídico en Madrid con capacidad para 500 alumnos',
    resumen: 'La escuela de derecho busca instalaciones de entre 3.000 y 4.500 m² en zona céntrica o CBD para su nuevo campus especializado en derecho digital.',
    url: '#', relevancia: 'alta',
  },
  {
    id: 10, cliente: 'Flexwork Solutions Spain SL', fuente: 'Cinco Días', fuente_color: '#457b9d',
    fecha: '06/04/2026', categoria: 'Expansión',
    titular: 'Flexwork Solutions acelera su expansión en España con 8 nuevas aperturas previstas para 2026',
    resumen: 'El operador de espacios de trabajo flexible busca locales de entre 800 y 2.000 m² en zonas de alta demanda para su modelo de coworking híbrido.',
    url: '#', relevancia: 'alta',
  },
  {
    id: 11, cliente: 'FREO Investments', fuente: 'CoStar', fuente_color: '#0077b6',
    fecha: '05/04/2026', categoria: 'Transacción',
    titular: 'FREO Investments inicia proceso de desinversión de su portfolio madrileño de oficinas secundarias',
    resumen: 'El fondo alemán pone a la venta tres inmuebles en el extrarradio de Madrid como parte de su estrategia de rotación hacia activos core en zonas prime.',
    url: '#', relevancia: 'media',
  },
  {
    id: 12, cliente: 'GMP Property', fuente: 'Savills Research', fuente_color: '#b5179e',
    fecha: '03/04/2026', categoria: 'Mercado',
    titular: 'GMP Property refuerza el portfolio Albatros con mejoras capex estimadas en 4M€',
    resumen: 'La propietaria ha iniciado obras de mejora en las zonas comunes del complejo Albatros con el objetivo de posicionarlo en el segmento prime-plus.',
    url: '#', relevancia: 'alta',
  },
  {
    id: 13, cliente: 'Hospitality Group Iberia SL', fuente: 'Hosteltur', fuente_color: '#e76f51',
    fecha: '04/04/2026', categoria: 'Expansión',
    titular: 'Hospitality Group Iberia abre nueva división de espacios para eventos corporativos en Madrid',
    resumen: 'El grupo hotelero diversifica su negocio con la búsqueda de sedes para eventos de entre 2.000 y 6.000 m² en zonas bien comunicadas de la capital.',
    url: '#', relevancia: 'media',
  },
  {
    id: 14, cliente: 'Pharma Group Spain', fuente: 'El Global', fuente_color: '#2b9348',
    fecha: '31/03/2026', categoria: 'Regulatorio',
    titular: 'Pharma Group Spain anuncia traslado de sus laboratorios de I+D al Parque Tecnológico de Madrid',
    resumen: 'La farmacéutica prevé liberar sus actuales instalaciones en el CBD y concentrar operaciones en un espacio de más de 800 m² en zona tecnológica.',
    url: '#', relevancia: 'media',
  },
]

const CAT_COLORS = {
  'Expansión': { bg:'#eff6ff', color:'#2563eb' },
  'Transacción': { bg:'#f0fdf4', color:'#16a34a' },
  'Resultados': { bg:'#fefce8', color:'#ca8a04' },
  'Estrategia': { bg:'#faf5ff', color:'#7c3aed' },
  'Corporativo': { bg:'#fff1f2', color:'#e11d48' },
  'Producto': { bg:'#f0fdfa', color:'#0d9488' },
  'Mercado': { bg:'#fdf4ff', color:'#a21caf' },
  'Regulatorio': { bg:'#fff7ed', color:'#ea580c' },
}
const REL_COLORS = { alta: { bg:'#fef2f2', color:'#dc2626' }, media: { bg:'#fefce8', color:'#ca8a04' } }

const SUGERENCIAS = [
  { cat: 'Demanda', preguntas: [
    '¿Cuántas demandas activas hay y cuáles son las más grandes?',
    '¿Qué demandas llevan más tiempo sin actividad?',
    'Resume las demandas activas por zona',
  ]},
  { cat: 'Activos', preguntas: [
    '¿Qué activos tienen mayor superficie disponible?',
    '¿Cuál es la ocupación media del portfolio?',
    'Lista los activos en comercialización con más días',
  ]},
  { cat: 'Pipeline', preguntas: [
    '¿Cuál es el estado actual de las negociaciones?',
    '¿Qué negociaciones tienen el cierre más próximo?',
    'Muéstrame el pipeline por equipo',
  ]},
  { cat: 'Inteligencia', preguntas: [
    '¿Qué zonas tienen más demanda activa?',
    'Sugiere activos para Grupo Mediática España',
    '¿Qué mandatos están próximos a vencer?',
    '¿Qué clientes tienen más actividad este mes?',
  ]},
]

const AI_RESPONSES = {
  demanda: `**Demanda activa — resumen PDB**

Actualmente hay **11 demandas activas** en el sistema. Las más relevantes por superficie:

| Cuenta | Sup. buscada | Estado |
|--------|-------------|--------|
| Grupo Mediática España | 13.000–18.000 m² | En curso |
| Flexwork Solutions Spain SL | 800–6.000 m² | En curso |
| Hospitality Group Iberia SL | 2.000–6.000 m² | En curso |
| Grupo Empresarial Altamira SL | 2.200–3.000 m² | En curso |

La superficie media buscada es **2.800 m²**. El **100%** de las demandas activas son de alquiler. Origen más frecuente: Web Savills (2) e IDEALISTA (1).

> 💡 **Insight:** Hay una oportunidad clara en la zona A-1/Alcobendas — 2 demandas activas sin activo asignado.`,

  activo: `**Activos disponibles — análisis PDB**

Portfolio actual: **8 activos**, superficie total: **213.000 m²** aprox.

Los activos con mayor disponibilidad:

| Activo | Disponible | Zona | Días comerc. |
|--------|-----------|------|-------------|
| Albatros Edif. D | ~13.486 m² (25%) | A-1 · Alcobendas | 127d |
| P.E Avalon | ~10.124 m² (21.6%) | M-30 · Madrid | 127d |
| Torre Europa Valencia | ~1.292 m² (17%) | Mestalla · Valencia | 62d |
| Parque Empresarial Norte | ~2.352 m² (21%) | M-30 · Madrid | 34d |

Ocupación media del portfolio: **86,1%**

> ⚠️ **Alerta:** Albatros y Avalon llevan más de 120 días en comercialización. Considera revisar la estrategia de precios.`,

  pipeline: `**Pipeline de negociaciones — estado actual**

Hay **4 negociaciones activas** en el PDB:

| Ref. | Contraparte | Activo | Estado | Cierre est. |
|------|------------|--------|--------|------------|
| NEG-0044 | Empresa XYZ | Avalon P5 · 1.000 m² | ↔ En negociación | 30/03/2026 ⚠️ |
| NEG-0041 | Oracle Spain SL | Albatros D · 13.486 m² | ⏳ Pdte. respuesta | 30/04/2026 |
| NEG-0039 | Generali Real Estate | Avalon P5 · 1.500 m² | ✓ Acuerdo | 15/04/2026 |
| NEG-0037 | Pharma Group Spain | Diagonal 95 P3 · 820 m² | ↔ En negociación | 15/05/2026 |

Renta potencial total: **2,02 M€/año**

> 💡 **Insight:** NEG-0044 tiene el cierre vencido. Acción recomendada: contactar a Sierra Álvaro para actualizar fecha o escalar.`,

  zona: `**Análisis de demanda por zona — PDB**

Las zonas con mayor actividad de demanda activa:

| Zona | Demandas | Sup. total buscada |
|------|---------|-------------------|
| M-30 (Madrid) | 4 | ~20.000–27.000 m² |
| A-1 / Alcobendas | 2 | ~2.400–9.300 m² |
| 22@ (Barcelona) | 0 | — |
| Mestalla (Valencia) | 0 | — |

**Tendencias identificadas:**
- Zona M-30 concentra el 40% de las demandas activas
- Creciente demanda de espacios flexibles (Estándar/Flexible)
- Perfil predominante: expansión/crecimiento (73% de las demandas)

> 💡 **Oportunidad:** Sin demanda activa en 22@ pese a tener dos activos allí (Torre Glòries, Diagonal 95). Considera generar prospección activa en Barcelona.`,

  mandato: `**Mandatos — alertas de vencimiento**

De los **6 mandatos** activos en el PDB:

| ID | Mandato | Vencimiento | Días rest. | Estado |
|----|---------|------------|-----------|--------|
| MAN-2506 | Torre Europa Valencia | 31/03/2025 | -6d | 🔴 Vencido |
| MAN-2505 | Parque Empresarial Norte | 30/04/2026 | 24d | 🔴 Alerta |
| MAN-2501 | P.E Avalon P4-P5 | 28/02/2026 | 55d | 🟡 Revisar |
| MAN-2502 | Albatros Edif. D | 30/06/2026 | 85d | 🟡 Revisar |

> ⚠️ **Acción urgente:** MAN-2505 (Parque Empresarial Norte) vence en 24 días. GOMEZ Ignacio debe contactar a FREO Investments para renovar o notificar el preaviso.`,

  cliente: `**Actividad por cliente — últimos 30 días**

Los clientes con más actividad reciente en el PDB:

| Cuenta | Actividades | Tipo más frecuente | Última actividad |
|--------|------------|-------------------|-----------------|
| Oracle Spain SL | 3 | Email | 28/03/2026 |
| Generali Real Estate | 2 | Llamada / Email | 29/03/2026 |
| Grupo Mediática España | 2 | Reunión / Llamada | 15/01/2026 |
| ISDE | 2 | Reunión / Email | 08/10/2025 |

> 💡 **Insight:** Grupo Mediática España lleva más de **2 meses sin actividad registrada**. Recomendamos programar un seguimiento para mantener el pipeline activo.`,

  mediatica: `**Análisis: Grupo Mediática España — activos sugeridos**

Demanda activa: **13.000–18.000 m²** · Tipo: Estándar · Zona: Madrid preferente

Activos del PDB que encajan:

| Activo | Disponible | Zona | Precio zona |
|--------|-----------|------|------------|
| P.E Avalon | ~10.124 m² | M-30 | 10,5 €/m²/mes |
| Albatros Edif. D | ~13.486 m² ✅ | A-1 | 12,5 €/m²/mes |
| Parque Empresarial Norte | ~2.352 m² | M-30 | 16,8 €/m²/mes |

**Mejor match:** Albatros Edif. D — cubre la superficie buscada completa y está en zona norte, compatible con los criterios de Grupo Mediática.

> ⚠️ **Nota:** Para cubrir el mínimo (13.000 m²) con un solo activo, Albatros D es la única opción en portfolio. Considera combinar plantas de Avalon si es flexible.`,

  default: (msg) => `**Análisis PDB — respuesta IA**

He analizado tu consulta: *"${msg}"*

Basándome en los datos actuales del PDB:

- **11 demandas activas** con superficie media buscada de 2.800 m²
- **8 activos** en portfolio, ocupación media **86,1%**
- **4 negociaciones** en curso con renta potencial de **2,02 M€/año**
- **6 mandatos** activos, 1 vencido y 1 en alerta

Para consultas más específicas, puedes preguntarme sobre demandas, activos disponibles, pipeline de negociaciones, mandatos, zonas o clientes concretos.

> 💡 Prueba: *"¿Qué activos tienen mayor disponibilidad?"* o *"Sugiere activos para Grupo Mediática España"*`,
}

function getResponse(msg) {
  const m = msg.toLowerCase()
  if (m.includes('demanda')) return AI_RESPONSES.demanda
  if (m.includes('activo') || m.includes('disponib') || m.includes('ocupaci')) return AI_RESPONSES.activo
  if (m.includes('negoci') || m.includes('pipeline') || m.includes('cierre')) return AI_RESPONSES.pipeline
  if (m.includes('zona') || m.includes('tendencia') || m.includes('barcelona') || m.includes('madrid')) return AI_RESPONSES.zona
  if (m.includes('mandato') || m.includes('vencimi')) return AI_RESPONSES.mandato
  if (m.includes('cliente') || m.includes('cuenta') || m.includes('actividad')) return AI_RESPONSES.cliente
  if (m.includes('mediática') || m.includes('mediatica') || m.includes('sugiere') || m.includes('recomiend')) return AI_RESPONSES.mediatica
  return AI_RESPONSES.default(msg)
}

function renderMd(text) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**') && !line.slice(2,-2).includes('**'))
      return <div key={i} style={{fontWeight:700,fontSize:13,marginBottom:4}}>{line.slice(2,-2)}</div>
    if (line.startsWith('> '))
      return <div key={i} style={{borderLeft:'3px solid var(--accent)',paddingLeft:10,margin:'8px 0',color:'var(--text2)',fontSize:11}}>{renderInline(line.slice(2))}</div>
    if (line.startsWith('| ') && line.endsWith(' |')) {
      const cells = line.split('|').slice(1,-1).map(c=>c.trim())
      const isHeader = lines[i+1]?.match(/^\|[-| ]+\|$/)
      const isSep = line.match(/^\|[-| ]+\|$/)
      if (isSep) return null
      return (
        <tr key={i}>
          {cells.map((c,j)=>(
            isHeader
              ? <th key={j} style={{padding:'4px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)'}}>{c}</th>
              : <td key={j} style={{padding:'5px 10px',fontSize:11,borderBottom:'1px solid var(--border)'}}>{renderInline(c)}</td>
          ))}
        </tr>
      )
    }
    if (line === '') return <div key={i} style={{height:6}}/>
    return <div key={i} style={{fontSize:12,lineHeight:1.6,marginBottom:2}}>{renderInline(line)}</div>
  })
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((p,i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2,-2)}</strong>
      : p
  )
}

function hasTable(text) { return text.includes('| ') }

function MsgContent({ text }) {
  if (!hasTable(text)) {
    return <div style={{fontSize:12,lineHeight:1.7}}>{renderMd(text)}</div>
  }
  const blocks = []
  let tableLines = []
  let inTable = false
  text.split('\n').forEach((line, i) => {
    if (line.startsWith('| ')) {
      if (!inTable) { inTable = true; tableLines = [] }
      tableLines.push(line)
    } else {
      if (inTable) {
        blocks.push({ type:'table', lines: tableLines })
        tableLines = []; inTable = false
      }
      blocks.push({ type:'line', content: line })
    }
  })
  if (inTable) blocks.push({ type:'table', lines: tableLines })

  return (
    <div>
      {blocks.map((b,i) => {
        if (b.type === 'table') {
          return (
            <div key={i} style={{overflowX:'auto',margin:'8px 0'}}>
              <table style={{width:'100%',borderCollapse:'collapse',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
                <tbody>{b.lines.map((l,j)=>{
                  const cells = l.split('|').slice(1,-1).map(c=>c.trim())
                  const isSep = l.match(/^\|[-| ]+\|$/)
                  if (isSep) return null
                  const isHeader = j===0
                  return (
                    <tr key={j}>
                      {cells.map((c,k)=>(
                        isHeader
                          ? <th key={k} style={{padding:'5px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)'}}>{c}</th>
                          : <td key={k} style={{padding:'5px 10px',fontSize:11,borderBottom:'1px solid var(--border)'}}>{renderInline(c)}</td>
                      ))}
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )
        }
        const line = b.content
        if (line.startsWith('**') && line.endsWith('**') && !line.slice(2,-2).includes('**'))
          return <div key={i} style={{fontWeight:700,fontSize:13,marginBottom:4,marginTop:i>0?8:0}}>{line.slice(2,-2)}</div>
        if (line.startsWith('> '))
          return <div key={i} style={{borderLeft:'3px solid var(--accent)',paddingLeft:10,margin:'8px 0',color:'var(--text2)',fontSize:11}}>{renderInline(line.slice(2))}</div>
        if (line === '') return <div key={i} style={{height:4}}/>
        return <div key={i} style={{fontSize:12,lineHeight:1.6,marginBottom:2}}>{renderInline(line)}</div>
      })}
    </div>
  )
}

// ─── NOTICIAS MODULE ─────────────────────────────────────────────────────────
function NoticiasModule() {
  const [watchlist, setWatchlist] = useState(['Oracle Spain SL', 'Generali Real Estate', 'Grupo Mediática España'])
  const [showAdd, setShowAdd] = useState(false)
  const [filterCliente, setFilterCliente] = useState('Todos')
  const [filterCat, setFilterCat] = useState('Todas')
  const [refreshKey, setRefreshKey] = useState(0)
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
    setTimeout(() => { setRefreshKey(k => k + 1); setRefreshing(false) }, 1200)
  }

  const noticiasWatchlist = useMemo(() => NOTICIAS.filter(n => watchlist.includes(n.cliente)), [watchlist, refreshKey])
  const categorias = useMemo(() => ['Todas', ...new Set(noticiasWatchlist.map(n => n.categoria))], [noticiasWatchlist])

  const noticias = useMemo(() => noticiasWatchlist.filter(n => {
    if (filterCliente !== 'Todos' && n.cliente !== filterCliente) return false
    if (filterCat !== 'Todas' && n.categoria !== filterCat) return false
    return true
  }), [noticiasWatchlist, filterCliente, filterCat])

  const disponibles = CUENTAS_PDB.filter(c => !watchlist.includes(c))

  return (
    <div style={{display:'flex',flex:1,overflow:'hidden'}}>
      {/* Sidebar watchlist */}
      <div style={{width:220,flexShrink:0,borderRight:'1px solid var(--border)',background:'var(--surface)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text)'}}>Mis cuentas</div>
          <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>Watchlist de clientes</div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
          {/* ALL filter */}
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
                    onMouseEnter={e=>{e.currentTarget.style.color='var(--red)';e.currentTarget.style.background='var(--red-lt)'}}
                    onMouseLeave={e=>{e.currentTarget.style.color='var(--text4)';e.currentTarget.style.background=''}}
                  >✕</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add client */}
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
          <div style={{fontSize:12,fontWeight:700,color:'var(--text)',marginRight:4}}>Noticias</div>
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

        {/* Cards feed */}
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
              <div key={n.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'12px 14px',display:'flex',flexDirection:'column',gap:6,transition:'box-shadow .15s',cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,.07)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
              >
                <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                  <span style={{fontSize:10,fontWeight:700,color:'#fff',background:n.fuente_color,borderRadius:4,padding:'2px 7px'}}>{n.fuente}</span>
                  <span style={{fontSize:10,fontWeight:600,color:cat.color,background:cat.bg,borderRadius:4,padding:'2px 7px'}}>{n.categoria}</span>
                  {n.relevancia === 'alta' && <span style={{fontSize:10,fontWeight:600,color:rel.color,background:rel.bg,borderRadius:4,padding:'2px 7px'}}>⬆ Alta relevancia</span>}
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

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function InteligenciaComercial() {
  const [tab, setTab] = useState('ia')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [catOpen, setCatOpen] = useState('Demanda')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  function sendMsg(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role:'user', text: msg }])
    setLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { role:'ai', text: getResponse(msg) }])
      setLoading(false)
    }, 900 + Math.random() * 600)
  }

  return (
    <div style={{display:'flex',flex:1,flexDirection:'column',overflow:'hidden',background:'var(--bg)'}}>

      {/* Tab bar */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0,padding:'0 16px',gap:4}}>
        {[{id:'ia',label:'✦ IA Comercial'},{id:'noticias',label:'📰 Noticias'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'9px 14px',border:'none',background:'none',fontSize:12,fontWeight:tab===t.id?700:500,color:tab===t.id?'var(--accent)':'var(--text3)',cursor:'pointer',borderBottom:tab===t.id?'2px solid var(--accent)':'2px solid transparent',fontFamily:'inherit',transition:'color .15s'}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'noticias' && <NoticiasModule />}
      {tab === 'ia' && <div style={{display:'flex',flex:1,overflow:'hidden'}}>

      {/* Sidebar */}
      <div style={{width:240,flexShrink:0,borderRight:'1px solid var(--border)',background:'var(--surface)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text)'}}>Inteligencia Comercial</div>
          <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>Análisis IA sobre datos PDB</div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
          {SUGERENCIAS.map(s=>(
            <div key={s.cat}>
              <div
                onClick={()=>setCatOpen(catOpen===s.cat?null:s.cat)}
                style={{padding:'6px 14px',fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',userSelect:'none'}}
              >
                {s.cat}
                <span style={{fontSize:9,color:'var(--text4)'}}>{catOpen===s.cat?'▲':'▼'}</span>
              </div>
              {catOpen===s.cat && s.preguntas.map(p=>(
                <div
                  key={p}
                  onClick={()=>sendMsg(p)}
                  style={{padding:'6px 14px 6px 20px',fontSize:11,color:'var(--text2)',cursor:'pointer',lineHeight:1.4,transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}
                >
                  {p}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding:12,borderTop:'1px solid var(--border)',flexShrink:0}}>
          <button
            onClick={()=>setMessages([])}
            style={{width:'100%',padding:'6px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'#fff',fontSize:11,cursor:'pointer',color:'var(--text3)',fontFamily:'inherit'}}
          >
            + Nueva conversación
          </button>
        </div>
      </div>

      {/* Chat principal */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Pantalla bienvenida */}
        {messages.length === 0 && !loading && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,gap:24}}>
            <div style={{textAlign:'center'}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 14px'}}>✦</div>
              <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>Inteligencia Comercial</div>
              <div style={{fontSize:13,color:'var(--text3)',maxWidth:400,lineHeight:1.6}}>
                Consulta sobre demandas, activos, pipeline, mandatos y actividad comercial usando lenguaje natural.
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,maxWidth:560,width:'100%'}}>
              {[
                '¿Cuántas demandas activas hay?',
                '¿Qué activos tienen mayor disponibilidad?',
                'Muéstrame el estado del pipeline',
                'Sugiere activos para Grupo Mediática España',
              ].map(q=>(
                <button
                  key={q}
                  onClick={()=>sendMsg(q)}
                  style={{padding:'10px 14px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',fontSize:11,cursor:'pointer',textAlign:'left',color:'var(--text2)',fontFamily:'inherit',lineHeight:1.4,transition:'border-color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensajes */}
        {(messages.length > 0 || loading) && (
          <div style={{flex:1,overflowY:'auto',padding:'20px 0'}}>
            {messages.map((m,i)=>(
              <div key={i} style={{maxWidth:780,margin:'0 auto',padding:'0 24px',marginBottom:20}}>
                {m.role === 'user' ? (
                  <div style={{display:'flex',justifyContent:'flex-end'}}>
                    <div style={{background:'var(--accent)',color:'#fff',borderRadius:12,borderBottomRightRadius:3,padding:'10px 16px',maxWidth:'75%',fontSize:13,lineHeight:1.5}}>
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,marginTop:2}}>✦</div>
                    <div style={{flex:1,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,borderTopLeftRadius:3,padding:'12px 16px'}}>
                      <MsgContent text={m.text}/>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{maxWidth:780,margin:'0 auto',padding:'0 24px',marginBottom:20}}>
                <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>✦</div>
                  <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,borderTopLeftRadius:3,padding:'12px 16px',display:'flex',gap:5,alignItems:'center'}}>
                    {[0,1,2].map(j=>(
                      <div key={j} style={{width:7,height:7,borderRadius:'50%',background:'var(--accent)',opacity:.7,animation:`pulse 1.2s ease-in-out ${j*0.2}s infinite`}}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
        )}

        {/* Input */}
        <div style={{padding:'12px 24px',borderTop:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
          <div style={{maxWidth:780,margin:'0 auto',display:'flex',gap:8}}>
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg()}
              placeholder="Pregunta sobre demandas, activos, pipeline, zonas..."
              style={{flex:1,padding:'10px 14px',border:'1px solid var(--border2)',borderRadius:'var(--r)',fontSize:13,fontFamily:'inherit',outline:'none',background:'#fff'}}
            />
            <button
              onClick={()=>sendMsg()}
              disabled={!input.trim()||loading}
              style={{padding:'10px 20px',borderRadius:'var(--r)',border:'none',background:input.trim()&&!loading?'var(--accent)':'var(--border)',color:input.trim()&&!loading?'#fff':'var(--text4)',fontWeight:600,fontSize:13,cursor:input.trim()&&!loading?'pointer':'default',fontFamily:'inherit',transition:'background .15s'}}
            >
              Enviar
            </button>
          </div>
          <div style={{maxWidth:780,margin:'6px auto 0',fontSize:10,color:'var(--text4)',textAlign:'center'}}>
            IA analiza datos del PDB en tiempo real · Respuestas basadas en datos mock
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: .3; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      </div>}
    </div>
  )
}
