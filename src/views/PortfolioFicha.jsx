import { useState, useRef, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import PortfolioMap from '../components/PortfolioMap'
import { exportPDF, exportPPT } from '../utils/exportReport'

function ExportMenu({ getConfig }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <button onClick={() => setOpen(o => !o)}
        style={{padding:'7px 16px',background:'var(--accent)',border:'none',borderRadius:6,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:6,boxShadow:'0 1px 4px rgba(59,130,246,.3)'}}>
        ⬇ Exportar informe <span style={{fontSize:8,marginLeft:2}}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{position:'absolute',right:0,top:'110%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,boxShadow:'0 4px 16px rgba(0,0,0,.12)',zIndex:999,minWidth:130,overflow:'hidden'}}>
          <div onClick={() => { setOpen(false); exportPDF(getConfig()) }}
            style={{padding:'9px 14px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid var(--border)'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
            onMouseLeave={e=>e.currentTarget.style.background=''}>
            📄 <span>PDF</span>
          </div>
          <div onClick={() => { setOpen(false); exportPPT(getConfig()) }}
            style={{padding:'9px 14px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
            onMouseLeave={e=>e.currentTarget.style.background=''}>
            📊 <span>PowerPoint</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Tabs sintetizados: solo los que tienen datos reales detrás. Antes existían
// 'pt-actividad' y 'pt-financiero' con contenido mock — quitados.
const TABS = ['pt-overview','pt-activos','pt-ofertas','pt-oportunidades','pt-transaccion']
// Las etiquetas con conteo se generan en runtime — ver tabLabel(idx, counts)

// USOS_FILTRO eliminado — los filtros se calculan ahora dinámicamente
// de los activos reales del portfolio (uso y ciudad).

/* ── Datos absorción ── */
/* ── Absorción (m² take-up) ── */
const ABS_ANUAL = [
  {y:'2021',v:28400},{y:'2022',v:38500},{y:'2023',v:45200},{y:'2024',v:52000},{y:'2025',v:61800},{y:'2026',v:52000,ytd:true},
]
const ABS_Q = {
  '2021':[{q:'Q1',v:5800},{q:'Q2',v:8200},{q:'Q3',v:7600},{q:'Q4',v:6800}],
  '2022':[{q:'Q1',v:7800},{q:'Q2',v:11400},{q:'Q3',v:10600},{q:'Q4',v:8700}],
  '2023':[{q:'Q1',v:9800},{q:'Q2',v:13200},{q:'Q3',v:11600},{q:'Q4',v:10600}],
  '2024':[{q:'Q1',v:11200},{q:'Q2',v:16000},{q:'Q3',v:13400},{q:'Q4',v:11400}],
  '2025':[{q:'Q1',v:14200},{q:'Q2',v:18500},{q:'Q3',v:16800},{q:'Q4',v:12300}],
  '2026':[{q:'Q1',v:15600},{q:'Q2',v:20000,ytd:true},{q:'Q3',v:0},{q:'Q4',v:0}],
}
const ABS_Q_CROSS = (q) => Object.entries(ABS_Q).map(([y,qs])=>({y, v:qs.find(x=>x.q===q)?.v||0, ytd:y==='2026'}))

/* ── Disponibilidad (% portfolio disponible) ── */
const DISP_ANUAL = [
  {y:'2021',v:14.2},{y:'2022',v:12.8},{y:'2023',v:10.5},{y:'2024',v:8.9},{y:'2025',v:7.6},{y:'2026',v:7.9,ytd:true},
]
const DISP_Q = {
  '2021':[{q:'Q1',v:15.1},{q:'Q2',v:14.5},{q:'Q3',v:13.8},{q:'Q4',v:13.2}],
  '2022':[{q:'Q1',v:13.4},{q:'Q2',v:12.6},{q:'Q3',v:12.0},{q:'Q4',v:11.5}],
  '2023':[{q:'Q1',v:11.8},{q:'Q2',v:11.2},{q:'Q3',v:10.4},{q:'Q4',v:10.1}],
  '2024':[{q:'Q1',v:10.0},{q:'Q2',v:9.4},{q:'Q3',v:8.8},{q:'Q4',v:8.5}],
  '2025':[{q:'Q1',v:8.3},{q:'Q2',v:7.8},{q:'Q3',v:7.5},{q:'Q4',v:7.2}],
  '2026':[{q:'Q1',v:7.6},{q:'Q2',v:7.9,ytd:true},{q:'Q3',v:0},{q:'Q4',v:0}],
}
const DISP_Q_CROSS = (q) => Object.entries(DISP_Q).map(([y,qs])=>({y, v:qs.find(x=>x.q===q)?.v||0, ytd:y==='2026'}))

/* ── Config informe portfolio ── */
function getReportConfig() {
  return {
    title: 'Portfolio Merlín Properties',
    subtitle: 'Informe de portfolio · SOCIMI',
    coverMetrics: [
      { label: 'Total activos', value: '64' },
      { label: 'Portfolio total', value: '2.100.000 m²' },
      { label: 'Ocupación media', value: '88,8%' },
      { label: 'Take-up 2026', value: '52.000 m²' },
      { label: 'Yield medio', value: '5,1%' },
    ],
    sections: [
      {
        title: 'Resumen portfolio',
        type: 'kpis',
        data: [
          { label: 'Total activos', value: '64' },
          { label: 'Portfolio total (m²)', value: '2.100.000' },
          { label: 'Disponible (m²)', value: '180.000' },
          { label: 'Disponibilidad', value: '7,9%' },
          { label: 'Ocupación media', value: '88,8%' },
          { label: 'WAULT (años)', value: '4,2' },
          { label: 'Yield medio', value: '5,1%' },
          { label: 'Cap rate', value: '4,8%' },
          { label: 'Take-up 2026 YTD', value: '52.000 m²' },
        ],
      },
      {
        title: 'Distribución por ciudad',
        type: 'table',
        headers: ['Ciudad', 'Nº Activos', 'M² Totales', 'Disponible'],
        rows: [
          ['Madrid',    '32', '1.050.000', '96.000'],
          ['Barcelona', '19', '630.000',   '54.000'],
          ['Valencia',  '6',  '210.000',   '18.000'],
          ['TOTAL',     '64', '2.100.000', '180.000'],
        ],
      },
      {
        title: 'Distribución por uso principal',
        type: 'table',
        headers: ['Uso', '% Portfolio', 'M² estimados'],
        rows: [
          ['Oficinas',     '55%', '1.155.000'],
          ['Logístico',    '10%', '210.000'],
          ['Retail',       '20%', '420.000'],
          ['Residencial',  '5%',  '105.000'],
          ['Hoteles',      '5%',  '105.000'],
          ['Otros',        '5%',  '105.000'],
        ],
      },
      {
        title: 'Absorción anual (m² take-up)',
        type: 'chart',
        data: ABS_ANUAL,
      },
      {
        title: 'Facturación Savills',
        type: 'kpis',
        data: [
          { label: 'Facturación 2026 YTD', value: '2,65 M€' },
          { label: 'Facturación 2025', value: '4,10 M€' },
          { label: 'Facturación 2024', value: '3,80 M€' },
          { label: 'Histórico acumulado', value: '20,3 M€' },
        ],
      },
      {
        title: 'Listado de activos del propietario',
        type: 'table',
        headers: ['Activo', 'Superficie (m²)', 'Uso principal', 'Ubicación'],
        rows: [
          ['P.E Avalon',              '46.956', 'Oficinas',   'Madrid · M-30 · Julián Camarillo'],
          ['Torre Glòries',           '18.500', 'Oficinas',   'Barcelona · 22@ · Poblenou'],
          ['Park Logístico Getafe',   '24.000', 'Logístico',  'Madrid · Getafe · Corredor del Henares'],
          ['C.C. La Maquinista',      '65.000', 'Retail',     'Barcelona · Sant Andreu'],
          ['Hotel ME Madrid',         '11.200', 'Hotel',      'Madrid · Centro · Gran Vía'],
          ['Residencial Valdebebas',  '32.000', 'Residencial','Madrid · Valdebebas'],
          ['Logístico Guadalajara',   '48.000', 'Logístico',  'Guadalajara · Corredor A-2'],
          ['Torre Realia Barcelona',  '28.200', 'Oficinas',   'Barcelona · L\'Hospitalet'],
        ],
      },
      {
        title: 'Facturación Savills por Línea de Negocio',
        type: 'table',
        headers: ['Línea de Negocio', 'Facturación acum.', 'Nº Operaciones'],
        rows: [
          ['Leasing Oficinas',       '10,60 M€', '14'],
          ['Capital Markets',        '5,70 M€',  '6'],
          ['Retail',                 '1,80 M€',  '3'],
          ['Industrial / Logística', '0,98 M€',  '2'],
          ['Valoraciones',           '0,56 M€',  '4'],
          ['Property Management',    '0,36 M€',  '1'],
          ['TOTAL',                  '20,00 M€', '30'],
        ],
      },
    ],
  }
}

/* ── Datos financieros por año/trimestre/línea ── */
const FIN_LINEAS = ['Oficinas','Industrial','Retail','Residencial','Hoteles','Capital Markets','Valoraciones']
const FIN_DATA = {
  '2024': { Q1:[3.2,1.1,0.8,0.4,0.3,1.8,0.2], Q2:[3.8,1.3,0.9,0.5,0.4,2.1,0.3], Q3:[3.5,1.2,0.8,0.4,0.3,1.9,0.2], Q4:[3.1,1.0,0.7,0.3,0.2,1.7,0.2] },
  '2025': { Q1:[3.9,1.4,1.0,0.5,0.4,2.2,0.3], Q2:[4.5,1.6,1.2,0.6,0.5,2.6,0.4], Q3:[4.2,1.5,1.1,0.5,0.4,2.4,0.3], Q4:[3.8,1.3,0.9,0.4,0.3,2.0,0.3] },
  '2026': { Q1:[4.1,1.5,1.0,0.6,0.4,2.3,0.3], Q2:[4.8,1.7,1.2,0.6,0.5,2.7,0.4], Q3:[], Q4:[] },
}
const FIN_COLORS = ['var(--accent)','var(--amber)','var(--red)','var(--purple)','var(--teal)','var(--green)','var(--text3)']

function FinancieroTab() {
  const [fYear,    setFYear]    = useState('')
  const [fPeriod,  setFPeriod]  = useState('')
  const [fCountry, setFCountry] = useState('')
  const [fRegion,  setFRegion]  = useState('')
  const [fMarket,  setFMarket]  = useState('')
  const [fLinea,   setFLinea]   = useState('')
  const [fService, setFService]  = useState('')
  const [fSector,  setFSector]   = useState('')

  // Calcular datos del gráfico según filtros
  const chartData = (() => {
    const years = fYear ? [fYear] : Object.keys(FIN_DATA)
    const periods = fPeriod ? [fPeriod] : ['Q1','Q2','Q3','Q4']
    const lineaIdx = fLinea ? FIN_LINEAS.indexOf(fLinea) : -1
    const result = []
    for (const y of years) {
      for (const q of periods) {
        const vals = FIN_DATA[y]?.[q]
        if (!vals || vals.length === 0) continue
        const total = lineaIdx >= 0 ? (vals[lineaIdx]||0) : vals.reduce((s,v)=>s+v,0)
        result.push({ label: `${y} ${q}`, total: parseFloat(total.toFixed(2)), ytd: y==='2026'&&(q==='Q1'||q==='Q2') })
      }
    }
    return result
  })()
  const chartMax = Math.max(...chartData.map(d=>d.total), 1)

  // KPIs derivados
  const totalFact = chartData.reduce((s,d)=>s+d.total, 0)

  const filterSel = {fontSize:10,padding:'3px 8px',borderRadius:5,border:'1px solid var(--border)',background:'var(--surface)',fontFamily:'inherit',color:'var(--text2)',cursor:'pointer'}
  const filterLbl = {fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}

  return (
    <div className="tab-content active" style={{ overflowY: 'auto' }}>
      <div className="port-body">
        {/* Barra de filtros */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'12px 16px',marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>🔽 Filtros</div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
            {[
              {lbl:'Year',     val:fYear,    set:setFYear,    opts:['','2024','2025','2026']},
              {lbl:'Period',   val:fPeriod,  set:setFPeriod,  opts:['','Q1','Q2','Q3','Q4']},
              {lbl:'Country',  val:fCountry, set:setFCountry, opts:['','España','Portugal']},
              {lbl:'Region',   val:fRegion,  set:setFRegion,  opts:['','Centro','Este','Norte','Sur']},
              {lbl:'Market',   val:fMarket,  set:setFMarket,  opts:['','Madrid','Barcelona','Valencia','Sevilla','Lisboa']},
              {lbl:'Business Line', val:fLinea, set:setFLinea, opts:['',...FIN_LINEAS]},
              {lbl:'Service Group', val:fService, set:setFService, opts:['','Leasing','Investment','Advisory','PM']},
              {lbl:'Property Sector', val:fSector, set:setFSector, opts:['','Prime','Secondary','Logístico','Retail Park']},
            ].map(({lbl,val,set,opts})=>(
              <div key={lbl} style={{display:'flex',flexDirection:'column',minWidth:90}}>
                <div style={filterLbl}>{lbl}</div>
                <select style={filterSel} value={val} onChange={e=>set(e.target.value)}>
                  {opts.map(o=><option key={o} value={o}>{o||'Todas'}</option>)}
                </select>
              </div>
            ))}
            <button onClick={()=>{setFYear('');setFPeriod('');setFCountry('');setFRegion('');setFMarket('');setFLinea('');setFService('');setFSector('')}}
              style={{...filterSel,color:'var(--accent)',border:'1px solid var(--accent-bd)',background:'var(--accent-lt)',fontWeight:700,marginTop:12}}>
              ✕ Limpiar
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
          {[
            {lbl:'Valor total cartera',val:'487 M€',color:'var(--text1)'},
            {lbl:'Ingresos brutos',val:'28,3 M€/año',color:'var(--green)'},
            {lbl:'NOI',val:'24,2 M€/año',color:'var(--teal)'},
            {lbl:'Cap Rate',val:'5,8%',color:'var(--accent)'},
          ].map(k=>(
            <div key={k.lbl} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'10px 14px',textAlign:'center'}}>
              <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{k.lbl}</div>
              <div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:k.color}}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Gráfico de barras */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:12}}>
          <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:11,fontWeight:700}}>Facturación por período {fLinea ? `· ${fLinea}` : '· todas las líneas'}</div>
              <div style={{fontSize:9,color:'var(--text4)',marginTop:1}}>M€ según filtros aplicados · Total selección: {totalFact.toFixed(2)} M€</div>
            </div>
          </div>
          <div style={{padding:'16px 20px 12px'}}>
            {chartData.length === 0
              ? <div style={{textAlign:'center',padding:32,color:'var(--text4)',fontSize:12}}>Sin datos para los filtros aplicados</div>
              : (
                <div style={{display:'flex',alignItems:'flex-end',gap:8,height:120}}>
                  {chartData.map((d,i)=>{
                    const h = Math.max(Math.round((d.total/chartMax)*100), d.total>0?4:0)
                    return (
                      <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                        <span style={{fontSize:8,fontWeight:700,color:d.ytd?'var(--accent)':'var(--text3)'}}>{d.total.toFixed(1)}M</span>
                        <div style={{width:'100%',background:d.ytd?'var(--accent)':'var(--border2)',borderRadius:'3px 3px 0 0',height:h,minHeight:d.total>0?3:0,transition:'.3s'}}/>
                        <span style={{fontSize:8,color:d.ytd?'var(--accent)':'var(--text4)',fontWeight:d.ytd?700:400,textAlign:'center',lineHeight:1.2}}>{d.label}</span>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </div>
        </div>

        {/* Desglose por línea de negocio */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>Desglose por Línea de Negocio · 2026 YTD</div>
          <div style={{padding:'12px 14px'}}>
            {FIN_LINEAS.map((l,i)=>{
              const q1 = FIN_DATA['2026']?.Q1?.[i]||0
              const q2 = FIN_DATA['2026']?.Q2?.[i]||0
              const total = q1 + q2
              const maxL = 4.8 + 1.7
              return (
                <div key={l} style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
                  <div style={{width:120,fontSize:10,color:'var(--text2)',flexShrink:0}}>{l}</div>
                  <div style={{flex:1,height:7,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.round(total/maxL*100)}%`,background:FIN_COLORS[i],borderRadius:4,transition:'.3s'}}/>
                  </div>
                  <div style={{width:55,fontSize:10,fontWeight:700,color:FIN_COLORS[i],textAlign:'right',fontFamily:'var(--mono)',flexShrink:0}}>{total.toFixed(1)} M€</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function PortfolioFicha() {
  const { navigate, params } = useNav()
  const [activeTab, setActiveTab] = useState('pt-overview')
  const [fUso,    setFUso]    = useState('Todo')
  const [fCiudad, setFCiudad] = useState('Todo')
  const [fAnio,   setFAnio]   = useState('')
  const [fPeriodo,setFPeriodo]= useState('')

  // Datos reales del portfolio (propietario)
  const [propietario, setPropietario] = useState(null)
  const [activos, setActivos]         = useState([])
  const [ofertas, setOfertas]         = useState([])
  const [oportunidades, setOportunidades] = useState([])
  const [mandatos, setMandatos]       = useState([])
  const [loadingPort, setLoadingPort] = useState(true)

  useEffect(() => {
    let cancel = false
    async function load() {
      if (!params?.id) { setLoadingPort(false); return }
      setLoadingPort(true)
      const { data: prop } = await supabase.from('propietarios').select('*').eq('id', params.id).maybeSingle()
      if (cancel) return
      if (!prop) { setLoadingPort(false); return }
      setPropietario(prop)

      const { data: acts } = await supabase
        .from('activos')
        .select('id, ref, nombre, ciudad, zona, uso, sba, m2_totales, m2_disponibles, estado, dynamics_account_id, coordenadas')
        .eq('portfolio_id', prop.id)
      const actList = acts || []
      setActivos(actList)

      const actIds = actList.map(a => a.id)
      if (actIds.length > 0) {
        const { data: ofs } = await supabase
          .from('ofertas')
          .select('id, ref, activo_id, estado, tipo_operacion, superficie_disponible, renta_m2, fecha_disponibilidad, mandato_id')
          .in('activo_id', actIds)
        setOfertas(ofs || [])
      } else {
        setOfertas([])
      }

      // Oportunidades por cuenta del propietario (si existe vínculo a Dynamics)
      if (prop.dynamics_account_id) {
        const { data: opps } = await supabase
          .from('dynamics_opportunities')
          .select('dynamics_id, nombre, tipo, estado, fecha_creacion')
          .eq('cuenta_dynamics_id', prop.dynamics_account_id)
          .order('fecha_creacion', { ascending: false })
        setOportunidades(opps || [])

        const { data: mans } = await supabase
          .from('mandatos')
          .select('id, ref, titulo, tipo, estado, fecha_firma, fecha_vencimiento, fee_eur_fijo, fee_porcentaje, dynamics_account_id')
          .eq('dynamics_account_id', prop.dynamics_account_id)
          .order('fecha_firma', { ascending: false })
        setMandatos(mans || [])
      } else {
        setOportunidades([])
        setMandatos([])
      }

      setLoadingPort(false)
    }
    load()
    return () => { cancel = true }
  }, [params?.id])

  // Listas únicas para los dropdowns de filtro (derivadas de los activos reales).
  const usosOpts = Array.from(new Set(activos.map(a => a.uso).filter(Boolean))).sort()
  const ciudadesOpts = Array.from(new Set(activos.map(a => a.ciudad).filter(Boolean))).sort()

  // Conteos derivados (filtran por uso + ciudad si están activos)
  const filterUso    = (a) => fUso    === 'Todo' || (a.uso    || '') === fUso
  const filterCiudad = (a) => fCiudad === 'Todo' || (a.ciudad || '') === fCiudad
  const activosFiltrados = activos.filter(a => filterUso(a) && filterCiudad(a))
  const ofertasFiltradas = ofertas.filter(o => activosFiltrados.some(a => a.id === o.activo_id))
  const totalSba = activosFiltrados.reduce((s, a) => s + (Number(a.sba) || Number(a.m2_totales) || 0), 0)
  const totalDisp = activosFiltrados.reduce((s, a) => s + (Number(a.m2_disponibles) || 0), 0)
  const ocupacionPct = totalSba > 0 ? Math.round(((totalSba - totalDisp) / totalSba) * 1000) / 10 : 0
  const dispPct = totalSba > 0 ? Math.round((totalDisp / totalSba) * 1000) / 10 : 0
  const ofertasActivas = ofertasFiltradas.filter(o => o.estado !== 'Retirada' && o.estado !== 'Ocupada total').length
  const oportunidadesActivas = oportunidades.filter(o => o.estado !== 'cerrada' && o.estado !== 'perdida')

  // KPIs comerciales del portfolio (cabecera): facturación total y mandatos vivos.
  const mandatosEnCurso = mandatos.filter(m => m.estado === 'en_curso')
  const facturacionTotal = mandatos.reduce((s, m) => s + (Number(m.fee_eur_fijo) || 0), 0)
  const facturacionEnCurso = mandatosEnCurso.reduce((s, m) => s + (Number(m.fee_eur_fijo) || 0), 0)

  // Distribución por uso para la barra del header (real vs % hardcoded antes).
  const usoBreakdown = (() => {
    const totals = {}
    activosFiltrados.forEach(a => {
      const u = a.uso || 'Sin uso'
      const m2 = Number(a.sba) || Number(a.m2_totales) || 0
      totals[u] = (totals[u] || 0) + m2
    })
    const total = Object.values(totals).reduce((s, v) => s + v, 0)
    if (total === 0) return []
    const palette = { Oficinas:'#3b82f6', 'Logístico':'#16a34a', Logistico:'#16a34a', 'Industrial':'#16a34a', Retail:'#ec4899', Residencial:'#8b5cf6', Hoteles:'#f59e0b', Suelo:'#ef4444', 'Centros comerciales':'#0891b2', 'Data Center':'#9333ea', Mixto:'#9333ea' }
    return Object.entries(totals)
      .sort((a,b) => b[1] - a[1])
      .map(([uso, m2]) => ({
        uso,
        m2,
        pct: m2 / total,
        color: palette[uso] || '#94a3b8',
      }))
  })()
  const fmtEur = (n) => {
    if (!n) return '0 €'
    if (n >= 1_000_000) return `${(n/1_000_000).toLocaleString('es-ES', { maximumFractionDigits:1 })} M€`
    if (n >= 1_000)     return `${(n/1_000).toLocaleString('es-ES', { maximumFractionDigits:0 })} k€`
    return `${n.toLocaleString('es-ES')} €`
  }

  /* ── Datos absorción según filtros ── */
  const absData = (() => {
    if (fPeriodo && !fAnio)       return ABS_Q_CROSS(fPeriodo)   // Q cross-year
    if (fAnio && ABS_Q[fAnio])    return ABS_Q[fAnio].map(d=>({...d,y:d.q})) // quarters of that year
    return ABS_ANUAL                                               // default: all years
  })()
  const absMax  = Math.max(...absData.map(d=>d.v), 1)
  const absLabel= fPeriodo&&!fAnio ? `Absorción & Disponibilidad ${fPeriodo} · comparativa anual`
    : fAnio ? `Absorción & Disponibilidad ${fAnio} · por trimestre`
    : 'Absorción m² · Disponibilidad % · portfolio'
  const absColor= 'var(--accent)'

  const dispData = (() => {
    if (fPeriodo && !fAnio)      return DISP_Q_CROSS(fPeriodo)
    if (fAnio && DISP_Q[fAnio])  return DISP_Q[fAnio].map(d=>({...d,y:d.q}))
    return DISP_ANUAL
  })()
  const dispMax = Math.max(...dispData.map(d=>d.v), 1)

  const doExport = (fmt) => {
    const cfg = getReportConfig()
    if (fmt === 'pdf') exportPDF(cfg)
    else               exportPPT(cfg)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div className="ficha-main" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="port-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div className="port-ico">{(propietario?.nombre || '?').charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="port-name">{propietario?.nombre || (loadingPort ? 'Cargando…' : 'Portfolio sin datos')}</div>
                    {propietario?.ticker && <span className="tag tag-gray">{propietario.ticker}</span>}
                    {propietario?.tipo   && <span className="tag tag-gray">{propietario.tipo}</span>}
                  </div>
                  {propietario?.descripcion && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{propietario.descripcion}</div>
                  )}
                  {propietario?.ultimo_contacto && (
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>📅 Último contacto: {propietario.ultimo_contacto}</div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'stretch', gap:10, flexShrink: 0, marginLeft: 16 }}>
                  <div style={{
                    background:'linear-gradient(135deg, #16a34a, #15803d)',
                    color:'#fff', borderRadius:10, padding:'12px 18px', minWidth:170,
                    boxShadow:'0 2px 6px rgba(22,163,74,.25)',
                    display:'flex', flexDirection:'column', justifyContent:'center',
                  }}>
                    <div style={{ fontSize:9, fontWeight:700, opacity:.85, textTransform:'uppercase', letterSpacing:'.05em' }}>💰 Facturación Savills</div>
                    <div style={{ fontSize:22, fontWeight:800, lineHeight:1.1, marginTop:4 }}>{fmtEur(facturacionTotal)}</div>
                    <div style={{ fontSize:10, opacity:.85, marginTop:2 }}>{fmtEur(facturacionEnCurso)} en curso · {mandatos.length} mandatos</div>
                  </div>
                  <div style={{
                    background:'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color:'#fff', borderRadius:10, padding:'12px 18px', minWidth:150,
                    boxShadow:'0 2px 6px rgba(37,99,235,.25)',
                    display:'flex', flexDirection:'column', justifyContent:'center',
                  }}>
                    <div style={{ fontSize:9, fontWeight:700, opacity:.85, textTransform:'uppercase', letterSpacing:'.05em' }}>📜 Proyectos en curso</div>
                    <div style={{ fontSize:22, fontWeight:800, lineHeight:1.1, marginTop:4 }}>{mandatosEnCurso.length}</div>
                    <div style={{ fontSize:10, opacity:.85, marginTop:2 }}>{oportunidadesActivas.length} oportunidades activas</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-end' }}>
                    <ExportMenu getConfig={getReportConfig} />
                  </div>
                </div>
              </div>
              {usoBreakdown.length > 0 ? (
                <>
                  <div className="uso-bar">
                    {usoBreakdown.map((u, i) => (
                      <div
                        key={u.uso}
                        title={`${u.uso}: ${u.m2.toLocaleString('es-ES')} m² (${(u.pct*100).toFixed(1)}%)`}
                        style={{
                          flex: u.pct,
                          background: u.color,
                          borderRadius:
                            i === 0 && i === usoBreakdown.length - 1 ? '3px' :
                            i === 0 ? '3px 0 0 3px' :
                            i === usoBreakdown.length - 1 ? '0 3px 3px 0' : 0,
                        }}
                      />
                    ))}
                  </div>
                  <div className="uso-leg">
                    {usoBreakdown.map(u => (
                      <div key={u.uso} className="ul-item">
                        <div className="ul-dot" style={{ background: u.color }} />
                        {u.uso}: {(u.pct * 100).toFixed(1)}%
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ marginTop:8, fontSize:10, color:'var(--text4)' }}>Sin distribución por uso (los activos del portfolio no tienen m² asignados).</div>
              )}
            </div>
          </div>
        </div>

        {/* Filtros — desplegables porque los portfolios reales pueden cubrir
            decenas de ciudades y muchos usos distintos en varios países. */}
        <div className="filtros-wrap">
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>Uso principal</div>
              <select
                value={fUso}
                onChange={e => setFUso(e.target.value)}
                style={{ padding:'6px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'var(--surface)', fontFamily:'inherit', minWidth:180 }}
              >
                <option value="Todo">Todos los usos ({usosOpts.length})</option>
                {usosOpts.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>Ciudad</div>
              <select
                value={fCiudad}
                onChange={e => setFCiudad(e.target.value)}
                style={{ padding:'6px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'var(--surface)', fontFamily:'inherit', minWidth:180 }}
              >
                <option value="Todo">Todas las ciudades ({ciudadesOpts.length})</option>
                {ciudadesOpts.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {(fUso !== 'Todo' || fCiudad !== 'Todo') && (
              <button
                onClick={() => { setFUso('Todo'); setFCiudad('Todo') }}
                style={{ padding:'6px 12px', fontSize:11, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', color:'var(--text3)', fontFamily:'inherit', fontWeight:600 }}
              >
                ✕ Limpiar filtros
              </button>
            )}
            <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text4)' }}>
              Mostrando <strong style={{ color:'var(--text)' }}>{activosFiltrados.length}</strong> de {activos.length} activos
            </span>
          </div>
        </div>

        {/* KPI strip */}
        <div className="port-kpi-strip">
          <div className="pks"><div className="pks-lbl">Activos</div><div className="pks-val">{activosFiltrados.length}</div><div className="pks-sub">Filtrado: {fUso}</div></div>
          <div className="pks"><div className="pks-lbl">Portfolio total (m²)</div><div className="pks-val">{totalSba.toLocaleString('es-ES')}</div><div className="pks-sub">SBA</div></div>
          <div className="pks"><div className="pks-lbl">Disponible (m²)</div><div className="pks-val amber">{totalDisp.toLocaleString('es-ES')}</div><div className="pks-sub">Disponibilidad: {dispPct}%</div></div>
          <div className="pks"><div className="pks-lbl">Ocupación</div><div className="pks-val green">{ocupacionPct}%</div><div className="pks-sub">{ofertasActivas} ofertas activas</div></div>
          <div className="pks"><div className="pks-lbl">Mandatos</div><div className="pks-val">{mandatos.filter(m => m.estado === 'en_curso').length}</div><div className="pks-sub">{mandatos.length} totales</div></div>
        </div>

        {/* Tabs (con conteos reales del portfolio) */}
        {(() => {
          const labels = [
            'Overview',
            `Activos (${activosFiltrados.length})`,
            `Ofertas (${ofertasActivas})`,
            `Oportunidades (${oportunidadesActivas.length})`,
            `Mandatos (${mandatos.length})`,
          ]
          return (
            <div className="tabs">
              {TABS.map((t, i) => (
                <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{labels[i]}</div>
              ))}
            </div>
          )
        })()}

        {/* ── Overview ── */}
        {activeTab === 'pt-overview' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">

              {/* Mapa de ubicaciones del portfolio */}
              <div style={{ marginBottom: 12 }}>
                <PortfolioMap
                  activos={activosFiltrados}
                  height={380}
                  onMarkerClick={(a) => navigate('ficha-activo', { ref: a.ref })}
                />
              </div>

              {/* Distribución — sin cuadros, listas con barras y tipografía clara */}
              {(() => {
                const porCiudad = {}
                activosFiltrados.forEach(a => {
                  const c = a.ciudad || '—'
                  if (!porCiudad[c]) porCiudad[c] = { cnt:0, m2:0 }
                  porCiudad[c].cnt++
                  porCiudad[c].m2 += Number(a.sba) || Number(a.m2_totales) || 0
                })
                const ciudades = Object.entries(porCiudad).sort((a,b) => b[1].m2 - a[1].m2)
                const maxCiudad = Math.max(1, ...ciudades.map(([, v]) => v.m2))
                const totalM2 = ciudades.reduce((s, [, v]) => s + v.m2, 0)

                return (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, padding:'12px 4px 28px' }}>
                    {/* Por ciudad */}
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:14 }}>Por ciudad</div>
                      {ciudades.length === 0 ? (
                        <div style={{ fontSize:13, color:'var(--text4)' }}>Sin datos.</div>
                      ) : ciudades.map(([c, v]) => {
                        const pct = v.m2 / maxCiudad
                        const portPct = totalM2 > 0 ? (v.m2 / totalM2 * 100).toFixed(1) : '0.0'
                        return (
                          <div key={c} style={{ marginBottom:14 }}>
                            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:14, fontWeight:600 }}>{c}</span>
                              <span style={{ fontSize:13, color:'var(--text3)', fontFamily:'var(--mono)' }}>{v.m2.toLocaleString('es-ES')} m² <span style={{ fontSize:11, color:'var(--text4)' }}>· {v.cnt}</span></span>
                            </div>
                            <div style={{ height:4, background:'var(--gray-lt)', borderRadius:4, overflow:'hidden' }}>
                              <div style={{ width:`${pct*100}%`, height:'100%', background:'var(--accent)', borderRadius:4 }} />
                            </div>
                            <div style={{ fontSize:10, color:'var(--text4)', marginTop:3 }}>{portPct}% del portfolio</div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Por uso */}
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:14 }}>Por uso</div>
                      {usoBreakdown.length === 0 ? (
                        <div style={{ fontSize:13, color:'var(--text4)' }}>Sin datos.</div>
                      ) : usoBreakdown.map(u => (
                        <div key={u.uso} style={{ marginBottom:14 }}>
                          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:14, fontWeight:600 }}>
                              <span style={{ width:10, height:10, borderRadius:'50%', background:u.color, flexShrink:0 }} />
                              {u.uso}
                            </span>
                            <span style={{ fontSize:13, color:'var(--text3)', fontFamily:'var(--mono)' }}>{u.m2.toLocaleString('es-ES')} m²</span>
                          </div>
                          <div style={{ height:4, background:'var(--gray-lt)', borderRadius:4, overflow:'hidden' }}>
                            <div style={{ width:`${u.pct*100}%`, height:'100%', background:u.color, borderRadius:4 }} />
                          </div>
                          <div style={{ fontSize:10, color:'var(--text4)', marginTop:3 }}>{(u.pct*100).toFixed(1)}% del portfolio</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Listas planas — top oportunidades + top mandatos, sin boxes */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, padding:'4px 4px 24px' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.08em' }}>Oportunidades activas</span>
                    <button onClick={() => setActiveTab('pt-oportunidades')} style={{ fontSize:11, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Ver todas →</button>
                  </div>
                  {oportunidadesActivas.length === 0 ? (
                    <div style={{ fontSize:13, color:'var(--text4)' }}>{loadingPort ? 'Cargando…' : 'Sin oportunidades activas.'}</div>
                  ) : oportunidadesActivas.slice(0, 5).map(o => (
                    <div
                      key={o.dynamics_id}
                      onClick={() => setActiveTab('pt-oportunidades')}
                      style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--gray-lt)', cursor:'pointer' }}
                    >
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{o.nombre || '—'}</div>
                        <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>{o.tipo || '—'} · {o.estado || '—'}</div>
                      </div>
                      <div style={{ fontSize:11, color:'var(--text4)', fontFamily:'var(--mono)', flexShrink:0 }}>{o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleDateString('es-ES') : ''}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.08em' }}>Mandatos recientes</span>
                    <button onClick={() => setActiveTab('pt-transaccion')} style={{ fontSize:11, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Ver todos →</button>
                  </div>
                  {mandatos.length === 0 ? (
                    <div style={{ fontSize:13, color:'var(--text4)' }}>{loadingPort ? 'Cargando…' : 'Sin mandatos.'}</div>
                  ) : mandatos.slice(0, 5).map(m => (
                    <div
                      key={m.id}
                      onClick={() => navigate('ficha-mandato', { id: m.ref })}
                      style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--gray-lt)', cursor:'pointer' }}
                    >
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{m.titulo || m.ref}</div>
                        <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>{m.tipo || '—'} · {m.estado || '—'}{m.fecha_vencimiento ? ` · vence ${new Date(m.fecha_vencimiento).toLocaleDateString('es-ES')}` : ''}</div>
                      </div>
                      <div style={{ fontSize:13, fontFamily:'var(--mono)', fontWeight:700, color: m.fee_eur_fijo ? 'var(--green)' : 'var(--text4)', flexShrink:0 }}>
                        {m.fee_eur_fijo ? fmtEur(Number(m.fee_eur_fijo)) : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activos */}
        {activeTab === 'pt-activos' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
                <button onClick={()=>exportarInforme('Activos-Portfolio-Merlin',[
                  'ACTIVOS DEL PORTFOLIO',
                  'Activo | Ciudad | Uso | SBA m² | Ocupación | Renta €/m²',
                  'P.E Avalon | Madrid | Oficinas | 46.956 | 78.4% | 10,5',
                  'Torre Glòries | Barcelona | Oficinas | 18.500 | 100% | 28,0',
                  'Park Logístico Getafe | Madrid | Logístico | 24.000 | 96% | 6,8',
                ])} style={{padding:'4px 12px',background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:5,fontSize:10,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)',fontWeight:600}}>
                  ⬇ Exportar
                </button>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Activos del portfolio ({activosFiltrados.length})</div>
                <table className="dtbl">
                  <thead><tr><th>Ref.</th><th>Activo</th><th>Ciudad</th><th>Uso</th><th>SBA (m²)</th><th>Disponible</th><th>Estado</th></tr></thead>
                  <tbody>
                    {activosFiltrados.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign:'center', padding:24, color:'var(--text4)', fontSize:12 }}>{loadingPort ? 'Cargando…' : 'Sin activos en este portfolio.'}</td></tr>
                    ) : activosFiltrados.map(a => {
                      const sba = Number(a.sba) || Number(a.m2_totales) || 0
                      const disp = Number(a.m2_disponibles) || 0
                      const ocu = sba > 0 ? Math.round(((sba - disp) / sba) * 1000) / 10 : null
                      return (
                        <tr key={a.id} onClick={() => navigate('ficha-activo', { ref: a.ref })} style={{ cursor:'pointer' }}>
                          <td style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--accent)' }}>{a.ref}</td>
                          <td className="dtbl-link">{a.nombre || '—'}</td>
                          <td>{a.ciudad || '—'}</td>
                          <td><span className="tag tag-blue">{a.uso || '—'}</span></td>
                          <td>{sba ? sba.toLocaleString('es-ES') : '—'}</td>
                          <td style={{ color: disp > 0 ? 'var(--amber)' : 'var(--green)' }}>{disp ? `${disp.toLocaleString('es-ES')} (${ocu ? (100 - ocu) : 0}%)` : '0'}</td>
                          <td><span className={`tag ${a.estado === 'archivado' ? 'tag-gray' : 'tag-green'}`}>{a.estado || 'Activo'}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Ofertas */}
        {activeTab === 'pt-ofertas' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Ofertas del portfolio ({ofertasFiltradas.length})</div>
                <table className="dtbl">
                  <thead><tr><th>Ref.</th><th>Activo</th><th>Tipo</th><th>M²</th><th>Renta €/m²</th><th>Disponibilidad</th><th>Estado</th></tr></thead>
                  <tbody>
                    {ofertasFiltradas.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign:'center', padding:24, color:'var(--text4)', fontSize:12 }}>{loadingPort ? 'Cargando…' : 'Sin ofertas en este portfolio.'}</td></tr>
                    ) : ofertasFiltradas.map(o => {
                      const a = activosFiltrados.find(x => x.id === o.activo_id)
                      const tagClass = o.estado === 'Retirada' ? 'tag-gray' : (o.estado || '').includes('Ocupada') ? 'tag-amber' : 'tag-blue'
                      return (
                        <tr key={o.id} onClick={() => navigate('ficha-oferta', { id: o.ref })} style={{ cursor:'pointer' }}>
                          <td><span className="asset-link" style={{fontFamily:'var(--mono)'}}>{o.ref}</span></td>
                          <td>{a?.nombre || '—'}</td>
                          <td style={{ fontSize:11 }}>{o.tipo_operacion || '—'}</td>
                          <td>{o.superficie_disponible ? Number(o.superficie_disponible).toLocaleString('es-ES') : '—'}</td>
                          <td>{o.renta_m2 != null ? Number(o.renta_m2).toLocaleString('es-ES') : '—'}</td>
                          <td style={{ fontSize:10, color:'var(--text3)' }}>{o.fecha_disponibilidad ? new Date(o.fecha_disponibilidad).toLocaleDateString('es-ES') : '—'}</td>
                          <td><span className={`tag ${tagClass}`}>{o.estado || '—'}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Oportunidades */}
        {activeTab === 'pt-oportunidades' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                {[
                  { lbl: 'Total',  val: oportunidades.length,         color: 'var(--text1)' },
                  { lbl: 'Activas', val: oportunidadesActivas.length, color: 'var(--accent)' },
                  { lbl: 'Cerradas', val: oportunidades.filter(o => o.estado === 'cerrada').length, color: 'var(--green)' },
                ].map(k => (
                  <div key={k.lbl} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>{k.lbl}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--mono)', color: k.color }}>{k.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Oportunidades vinculadas a la cuenta ({oportunidades.length})</div>
                <table className="dtbl">
                  <thead>
                    <tr><th>Dynamics ID</th><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Fecha</th></tr>
                  </thead>
                  <tbody>
                    {oportunidades.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign:'center', padding:24, color:'var(--text4)', fontSize:12 }}>{loadingPort ? 'Cargando…' : (propietario?.dynamics_account_id ? 'Sin oportunidades para esta cuenta.' : 'Este portfolio no tiene cuenta Dynamics vinculada.')}</td></tr>
                    ) : oportunidades.map(o => (
                      <tr key={o.dynamics_id} style={{ cursor: 'pointer' }}>
                        <td><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{o.dynamics_id}</span></td>
                        <td style={{ fontSize: 11, fontWeight: 500 }}>{o.nombre || '—'}</td>
                        <td><span className="tag tag-blue" style={{ fontSize: 9 }}>{o.tipo || '—'}</span></td>
                        <td><span className="tag tag-gray" style={{ fontSize: 9 }}>{o.estado || '—'}</span></td>
                        <td style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleDateString('es-ES') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Mandatos del portfolio */}
        {activeTab === 'pt-transaccion' && (() => {
          const totalFee = mandatos.reduce((s, m) => s + (Number(m.fee_eur_fijo) || 0), 0)
          return (
            <div className="tab-content active" style={{ overflowY: 'auto' }}>
              <div className="port-body">
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  {[
                    { lbl: 'Total mandatos', val: mandatos.length,                                              color: 'var(--text1)' },
                    { lbl: 'En curso',       val: mandatos.filter(m => m.estado === 'en_curso').length,         color: 'var(--green)' },
                    { lbl: 'Cerrados',       val: mandatos.filter(m => m.estado === 'cerrado').length,          color: 'var(--text3)' },
                    { lbl: 'Fees totales',   val: `${(totalFee/1000).toLocaleString('es-ES', { maximumFractionDigits:0 })} k€`, color: 'var(--accent)' },
                  ].map(k => (
                    <div key={k.lbl} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>{k.lbl}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--mono)', color: k.color }}>{k.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Mandatos vinculados ({mandatos.length})</div>
                  <table className="dtbl">
                    <thead>
                      <tr><th>Ref.</th><th>Título</th><th>Tipo</th><th>Firma</th><th>Vencimiento</th><th>Fee €</th><th>Fee %</th><th>Estado</th></tr>
                    </thead>
                    <tbody>
                      {mandatos.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign:'center', padding:24, color:'var(--text4)', fontSize:12 }}>{loadingPort ? 'Cargando…' : (propietario?.dynamics_account_id ? 'Sin mandatos para esta cuenta.' : 'Este portfolio no tiene cuenta Dynamics vinculada.')}</td></tr>
                      ) : mandatos.map(m => (
                        <tr key={m.id} onClick={() => navigate('ficha-mandato', { id: m.ref })} style={{ cursor: 'pointer' }}>
                          <td><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{m.ref}</span></td>
                          <td style={{ fontSize: 11, fontWeight: 500 }}>{m.titulo || '—'}</td>
                          <td><span className="tag tag-blue" style={{ fontSize: 9 }}>{m.tipo || '—'}</span></td>
                          <td style={{ fontSize: 10, fontFamily: 'var(--mono)' }}>{m.fecha_firma ? new Date(m.fecha_firma).toLocaleDateString('es-ES') : '—'}</td>
                          <td style={{ fontSize: 10, fontFamily: 'var(--mono)' }}>{m.fecha_vencimiento ? new Date(m.fecha_vencimiento).toLocaleDateString('es-ES') : '—'}</td>
                          <td style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--green)' }}>{m.fee_eur_fijo ? Number(m.fee_eur_fijo).toLocaleString('es-ES') : '—'}</td>
                          <td style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>{m.fee_porcentaje != null ? `${m.fee_porcentaje}%` : '—'}</td>
                          <td><span className={`tag ${m.estado === 'en_curso' ? 'tag-green' : m.estado === 'cancelado' ? 'tag-red' : 'tag-gray'}`} style={{ fontSize: 9 }}>{m.estado || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })()}

      </div>

      {/* Right panel */}
      <div className="ficha-right">

        {/* Resumen portfolio */}
        <div className="rp-sec">
          <div className="rp-lbl">Resumen del portfolio</div>
          <div className="kf-grid">
            <div className="kf"><div className="kf-lbl">Total activos</div><div className="kf-val">64</div></div>
            <div className="kf"><div className="kf-lbl">Portfolio (m²)</div><div className="kf-val">2.1M</div></div>
            <div className="kf"><div className="kf-lbl">Disponible</div><div className="kf-val amber">180k m²</div></div>
            <div className="kf"><div className="kf-lbl">Ofertas activas</div><div className="kf-val">31</div></div>
          </div>
        </div>

        {/* Facturación histórica */}
        <div className="rp-sec">
          <div className="rp-lbl">Facturación Savills · Histórico</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Total acumulado</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>20,3 M€</span>
            </div>
            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1, marginBottom: 6 }}>
              <div style={{ flex: .52, background: 'var(--accent)' }} title="Leasing"/>
              <div style={{ flex: .28, background: 'var(--purple)' }} title="Capital Markets"/>
              <div style={{ flex: .12, background: 'var(--teal)' }} title="Valoraciones"/>
              <div style={{ flex: .08, background: 'var(--amber)' }} title="Otros"/>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', marginBottom: 8 }}>
              {[['var(--accent)','Leasing','10,6M'],['var(--purple)','Cap. Markets','5,7M'],['var(--teal)','Valoraciones','2,4M'],['var(--amber)','Otros','1,6M']].map(([c,l,v])=>(
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: c, flexShrink: 0 }}/>
                  <span style={{ fontSize: 9, color: 'var(--text3)' }}>{l}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '3px 0', fontSize: 9, fontWeight: 600, color: 'var(--text4)', textAlign: 'left', textTransform: 'uppercase' }}>Año</th>
                <th style={{ padding: '3px 0', fontSize: 9, fontWeight: 600, color: 'var(--text4)', textAlign: 'right', textTransform: 'uppercase' }}>Facturado</th>
                <th style={{ padding: '3px 0', fontSize: 9, fontWeight: 600, color: 'var(--text4)', textAlign: 'right', textTransform: 'uppercase' }}>Ops</th>
              </tr>
            </thead>
            <tbody>
              {[
                {year:'2026',val:'2,65 M€',ops:3,cur:true},
                {year:'2025',val:'4,10 M€',ops:5},
                {year:'2024',val:'3,80 M€',ops:4},
                {year:'2023',val:'5,20 M€',ops:7},
                {year:'2022',val:'4,55 M€',ops:6},
              ].map(r=>(
                <tr key={r.year} style={{ borderBottom: '1px solid var(--border)', background: r.cur ? 'var(--accent-lt)' : 'transparent' }}>
                  <td style={{ padding: '4px 0', fontWeight: r.cur ? 700 : 400, color: r.cur ? 'var(--accent)' : 'var(--text2)' }}>{r.year}{r.cur && <span style={{ fontSize: 8, marginLeft: 4, background: 'var(--accent)', color: '#fff', padding: '0 4px', borderRadius: 3 }}>YTD</span>}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: r.cur ? 700 : 500, color: r.cur ? 'var(--accent)' : 'var(--text)' }}>{r.val}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--text3)' }}>{r.ops}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Facturación año en curso */}
        <div className="rp-sec">
          <div className="rp-lbl">Facturación 2026 · En curso</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Facturado</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>2,65 M€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Pipeline activo</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)' }}>1,50 M€</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 3 }}>Progreso vs. objetivo anual (5,5 M€)</div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
              <div style={{ height: '100%', width: '48%', background: 'var(--green)', borderRadius: 3 }}/>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'right' }}>48% conseguido</div>
          </div>
          {[
            {ico:'📋',label:'Arrendamiento P.E Avalon P4',valor:'620 k€',estado:'Cerrado',color:'var(--green)'},
            {ico:'💹',label:'Mandato captación Glòries',valor:'1,03 M€',estado:'Cerrado',color:'var(--green)'},
            {ico:'📊',label:'Valoración portfolio Q1',valor:'85 k€',estado:'Facturado',color:'var(--teal)'},
            {ico:'🤝',label:'Arrendamiento Getafe P3',valor:'910 k€',estado:'En curso',color:'var(--amber)'},
            {ico:'📄',label:'Mandato exclusiva retail',valor:'590 k€',estado:'En curso',color:'var(--amber)'},
          ].map((op,i)=>(
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{op.ico}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{op.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: op.color }}>{op.valor}</span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: op.color, background: op.color === 'var(--green)' ? 'var(--green-lt)' : op.color === 'var(--teal)' ? 'var(--teal-lt)' : 'var(--amber-lt)', border: `1px solid ${op.color === 'var(--green)' ? 'var(--green-bd)' : op.color === 'var(--teal)' ? 'var(--teal-bd)' : 'var(--amber-bd)'}`, padding: '0 4px', borderRadius: 4 }}>{op.estado}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Proyectos en curso */}
        <div className="rp-sec">
          <div className="rp-lbl">Proyectos en curso</div>
          {[
            {ico:'📋',label:'Mandato exclusiva Leasing',sub:'Leasing · P.E Avalon P4–P5 · Activo',color:'var(--accent)'},
            {ico:'📋',label:'Mandato captación retail',sub:'Retail · Parque La Gavia · Activo',color:'var(--accent)'},
            {ico:'💹',label:'Due Diligence venta Torre Glòries',sub:'Capital Markets · En proceso',color:'var(--purple)'},
            {ico:'📊',label:'Valoración anual portfolio',sub:'Valoraciones · Q2 2026 · Abierto',color:'var(--teal)'},
            {ico:'🔍',label:'Informe de mercado logístico',sub:'Research · Q2 2026 · En redacción',color:'var(--gray)'},
          ].map((p,i)=>(
            <div key={i} className="proj-item">
              <div style={{ width: 26, height: 26, borderRadius: 5, background: 'var(--gray-lt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{p.ico}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.sub}</div>
              </div>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0, marginTop: 5 }}/>
            </div>
          ))}
          <span style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500, marginTop: 4, display: 'inline-block' }}>+ Añadir proyecto</span>
        </div>

        {/* Equipos comerciales */}
        <div className="rp-sec">
          <div className="rp-lbl">Equipos comerciales</div>
          {[
            {equipo:'Leasing Oficinas MAD',ops:12,factura:'8,4 M€',last:'Mar 2026',color:'var(--accent)'},
            {equipo:'Capital Markets MAD',ops:4,factura:'5,7 M€',last:'Feb 2026',color:'var(--purple)'},
            {equipo:'Valoraciones MAD',ops:6,factura:'2,4 M€',last:'Ene 2026',color:'var(--teal)'},
            {equipo:'Leasing Industrial MAD',ops:3,factura:'1,8 M€',last:'Dic 2025',color:'var(--orange)'},
            {equipo:'Retail MAD',ops:2,factura:'1,0 M€',last:'Nov 2025',color:'var(--amber)'},
            {equipo:'Research MAD',ops:5,factura:'—',last:'Mar 2026',color:'var(--gray)'},
          ].map((eq,i)=>(
            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
              <div style={{ width: 4, borderRadius: 2, alignSelf: 'stretch', background: eq.color, flexShrink: 0, marginTop: 2 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)' }}>{eq.equipo}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 9, color: 'var(--text4)' }}>{eq.ops} ops</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: eq.color }}>{eq.factura}</span>
                  <span style={{ fontSize: 9, color: 'var(--text4)' }}>Últ. {eq.last}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Asistente IA */}
        <div className="rp-sec">
          <div className="rp-lbl">Asistente IA</div>
          <div className="ai-box">
            <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Análisis relación</span><span className="ai-badge">Tiempo real</span></div>
            <div className="ai-text">Relación de <strong>5 años</strong>. Facturación histórica 20M€ — 3er mayor cliente. Pipeline 1,5M€ activo. Próximo vencimiento mandato <strong>Jul 2026</strong>.</div>
            <div className="ai-cta">✎ Preparar propuesta de valor</div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="rp-sec">
          <div className="rp-lbl">Accesos rápidos</div>
          <button className="acc-btn" onClick={() => setActiveTab('pt-activos')}>📋 Ver activos (8)</button>
          <button className="acc-btn" onClick={() => setActiveTab('pt-ofertas')}>📄 Ver ofertas (5)</button>
          <button className="acc-btn" onClick={() => setActiveTab('pt-actividad')}>📊 Actividad comercial</button>
          <button className="acc-btn">💹 Cotización 11,24€</button>
          <button className="acc-btn" onClick={doExport}>⬇ Exportar informe completo</button>
        </div>
      </div>
    </div>
  )
}
