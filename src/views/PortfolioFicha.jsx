import { useState, useRef, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
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

const TABS = ['pt-overview','pt-activos','pt-ofertas','pt-actividad','pt-financiero']
const TAB_LABELS = ['Overview','Activos (8)','Ofertas (5)','Actividad comercial','Financiero']

const USOS_FILTRO = ['Todo','Oficinas','Logístico','Retail','Residencial','Suelo','Centros comerciales','Hoteles']

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
  const { navigate } = useNav()
  const [activeTab, setActiveTab] = useState('pt-overview')
  const [fUso,    setFUso]    = useState('Todo')
  const [fAnio,   setFAnio]   = useState('')
  const [fPeriodo,setFPeriodo]= useState('')

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
            <div className="port-ico">M</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="port-name">Merlín Properties SOCIMI</div>
                    <span className="tag tag-gray">MRL</span>
                    <span className="tag tag-gray">SOCIMI</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Mayor SOCIMI cotizada de España. Portfolio diversificado con activos prime en principales mercados.</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>📅 Último contacto: 12/03/2026</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase' }}>Cotización</div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>11,24 €</div>
                    <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>↑ +1,8%</div>
                  </div>
                  <ExportMenu getConfig={getReportConfig} />
                </div>
              </div>
              <div className="uso-bar">
                <div style={{ flex: .55, background: '#3b82f6', borderRadius: '3px 0 0 3px' }} />
                <div style={{ flex: .10, background: '#f59e0b' }} />
                <div style={{ flex: .20, background: '#ec4899' }} />
                <div style={{ flex: .05, background: '#8b5cf6' }} />
                <div style={{ flex: .05, background: '#f97316' }} />
                <div style={{ flex: .05, background: '#94a3b8', borderRadius: '0 3px 3px 0' }} />
              </div>
              <div className="uso-leg">
                {[['#3b82f6','Oficinas: 55%'],['#f59e0b','Logístico: 10%'],['#ec4899','Retail: 20%'],['#8b5cf6','Residencial: 5%'],['#f97316','Hoteles: 5%']].map(([c,l]) => (
                  <div key={l} className="ul-item"><div className="ul-dot" style={{ background: c }} />{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filtros-wrap">
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>Uso principal</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {USOS_FILTRO.map(f => (
                  <span key={f} className={`fchip ${fUso===f ? 'active' : ''}`} onClick={()=>setFUso(f)}
                    style={{cursor:'pointer'}}>{f}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>Ciudad</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['Todo','Madrid','Barcelona','Valencia'].map((f, i) => (
                  <span key={f} className={`fchip ${i === 0 ? 'active' : ''}`}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="port-kpi-strip">
          <div className="pks"><div className="pks-lbl">Portfolio total (m²)</div><div className="pks-val">612.800</div><div className="pks-sub">Filtrado: {fUso}</div></div>
          <div className="pks"><div className="pks-lbl">Disponible (m²)</div><div className="pks-val amber">48.496</div><div className="pks-sub">Disponibilidad: 7.9%</div></div>
          <div className="pks"><div className="pks-lbl">Ocupación media</div><div className="pks-val green">88.8%</div><div className="pks-sub">WAULT: 4.2 años</div></div>
          <div className="pks"><div className="pks-lbl">Take-up 2026</div><div className="pks-val">52.000</div><div className="pks-sub">m² absorbidos</div></div>
          <div className="pks"><div className="pks-lbl">Yield medio</div><div className="pks-val">5.1%</div><div className="pks-sub">Cap rate: 4.8%</div></div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map((t, i) => (
            <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[i]}</div>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'pt-overview' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">

              {/* Gráfico de absorción */}
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:12}}>
                <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--text1)'}}>{absLabel}</div>
                    <div style={{fontSize:9,color:'var(--text4)',marginTop:1}}>m² absorbidos en el portfolio · Savills</div>
                  </div>
                  {/* Filtros temporales del gráfico */}
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase'}}>Año</span>
                    <select value={fAnio} onChange={e=>{setFAnio(e.target.value)}} className="fsel" style={{fontSize:10}}>
                      <option value="">Todos</option>
                      {Object.keys(ABS_Q).reverse().map(y=><option key={y}>{y}</option>)}
                    </select>
                    <span style={{fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase'}}>Período</span>
                    <select value={fPeriodo} onChange={e=>setFPeriodo(e.target.value)} className="fsel" style={{fontSize:10}}>
                      <option value="">Anual</option>
                      <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                    </select>
                  </div>
                </div>
                <div style={{padding:'16px 20px 12px'}}>
                  {/* Leyenda */}
                  <div style={{display:'flex',gap:14,marginBottom:10}}>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <div style={{width:10,height:10,borderRadius:2,background:'var(--accent)'}}/>
                      <span style={{fontSize:9,color:'var(--text3)',fontWeight:600}}>Absorción m²</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <div style={{width:10,height:10,borderRadius:2,background:'var(--amber)'}}/>
                      <span style={{fontSize:9,color:'var(--text3)',fontWeight:600}}>Disponibilidad %</span>
                    </div>
                  </div>
                  {/* Chart grouped */}
                  <div style={{display:'flex',alignItems:'flex-end',gap:6,height:120}}>
                    {absData.filter((_,i)=>!(dispData[i]?.v===0&&!dispData[i]?.ytd&&absData[i]?.v===0)).map((d,i)=>{
                      const dd = dispData[i] || {v:0}
                      const hAbs  = Math.max(Math.round((d.v/absMax)*90), d.v>0?4:0)
                      const hDisp = Math.max(Math.round((dd.v/dispMax)*90), dd.v>0?4:0)
                      const isYtd = d.ytd
                      const label = d.y || d.q
                      if(d.v===0 && dd.v===0 && !isYtd) return null
                      return (
                        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                          {/* values above */}
                          <div style={{display:'flex',gap:2,marginBottom:2,flexDirection:'column',alignItems:'center'}}>
                            <span style={{fontSize:8,fontWeight:700,color:isYtd?'var(--accent)':'var(--text3)',whiteSpace:'nowrap'}}>
                              {d.v>0?`${(d.v/1000).toFixed(1)}k`:'—'}
                            </span>
                            <span style={{fontSize:8,fontWeight:700,color:isYtd?'var(--amber)':'var(--text3)',whiteSpace:'nowrap'}}>
                              {dd.v>0?`${dd.v.toFixed(1)}%`:'—'}
                            </span>
                          </div>
                          {/* grouped bars */}
                          <div style={{display:'flex',alignItems:'flex-end',gap:2,width:'100%',justifyContent:'center'}}>
                            <div style={{flex:1,background:isYtd?'var(--accent)':'var(--border2)',borderRadius:'3px 3px 0 0',height:hAbs,minHeight:d.v>0?3:0,transition:'.3s'}}/>
                            <div style={{flex:1,background:isYtd?'var(--amber)':'color-mix(in srgb,var(--amber) 40%,var(--border2))',borderRadius:'3px 3px 0 0',height:hDisp,minHeight:dd.v>0?3:0,transition:'.3s'}}/>
                          </div>
                          <span style={{fontSize:9,color:isYtd?'var(--accent)':'var(--text4)',fontWeight:isYtd?700:400,marginTop:3}}>
                            {label}{isYtd&&fPeriodo?'':isYtd?' YTD':''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {/* Totales */}
                  <div style={{display:'flex',gap:16,marginTop:10,paddingTop:8,borderTop:'1px solid var(--border)',flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'baseline',gap:5}}>
                      <span style={{fontSize:18,fontWeight:800,color:'var(--text1)',fontFamily:'var(--mono)'}}>
                        {fAnio ? (ABS_Q[fAnio]||[]).reduce((s,d)=>s+d.v,0).toLocaleString('es-ES')
                          : ABS_ANUAL.reduce((s,d)=>s+d.v,0).toLocaleString('es-ES')}
                      </span>
                      <span style={{fontSize:10,color:'var(--text3)'}}>m² {fAnio||'acumulados'}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'baseline',gap:5}}>
                      <span style={{fontSize:18,fontWeight:800,color:'var(--accent)',fontFamily:'var(--mono)'}}>52.000</span>
                      <span style={{fontSize:10,color:'var(--text3)'}}>m² YTD 2026</span>
                    </div>
                    <div style={{display:'flex',alignItems:'baseline',gap:5}}>
                      <span style={{fontSize:18,fontWeight:800,color:'var(--green)',fontFamily:'var(--mono)'}}>+16%</span>
                      <span style={{fontSize:10,color:'var(--text3)'}}>vs. año anterior</span>
                    </div>
                    <div style={{display:'flex',alignItems:'baseline',gap:5,borderLeft:'1px solid var(--border)',paddingLeft:16}}>
                      <span style={{fontSize:18,fontWeight:800,color:'var(--amber)',fontFamily:'var(--mono)'}}>
                        {(()=>{
                          const last = dispData.filter(d=>d.v>0)
                          return last.length ? `${last[last.length-1].v.toFixed(1)}%` : '—'
                        })()}
                      </span>
                      <span style={{fontSize:10,color:'var(--text3)'}}>disponibilidad actual</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tablas overview */}
              <div className="port-grid-2">
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Portfolio total · Por ciudad</div>
                  <table className="dtbl">
                    <thead><tr><th>Ciudad</th><th>Nº Activos</th><th>M² Totales</th><th>Disponible</th></tr></thead>
                    <tbody>
                      <tr><td>Madrid</td><td>32</td><td>1.050.000</td><td className="d-up">96.000</td></tr>
                      <tr><td>Barcelona</td><td>19</td><td>630.000</td><td className="d-up">54.000</td></tr>
                      <tr><td>Valencia</td><td>6</td><td>210.000</td><td className="d-up">18.000</td></tr>
                      <tr style={{ fontWeight: 700 }}><td>TOTAL</td><td>64</td><td>2.100.000</td><td style={{ color: 'var(--amber)' }}>180.000</td></tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Portfolio · Por uso principal</div>
                  <table className="dtbl">
                    <thead><tr><th>Uso</th><th>% Portfolio</th><th>M² estimados</th></tr></thead>
                    <tbody>
                      <tr><td><span className="tag tag-blue">Oficinas</span></td><td>55%</td><td>1.155.000</td></tr>
                      <tr><td><span className="tag tag-teal">Logístico</span></td><td>10%</td><td>210.000</td></tr>
                      <tr><td><span className="tag tag-purple">Retail</span></td><td>20%</td><td>420.000</td></tr>
                      <tr><td><span className="tag tag-amber">Hoteles</span></td><td>5%</td><td>105.000</td></tr>
                      <tr><td><span className="tag tag-gray">Residencial</span></td><td>5%</td><td>105.000</td></tr>
                      <tr><td><span className="tag tag-gray">Otros</span></td><td>5%</td><td>105.000</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="port-grid-2" style={{marginTop:12}}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Facturación Savills · KPIs</div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div className="kf"><div className="kf-lbl">Facturación histórica</div><div className="kf-val">20 M€</div></div>
                      <div className="kf"><div className="kf-lbl">Facturación 2026</div><div className="kf-val">2,65 M€</div></div>
                      <div className="kf"><div className="kf-lbl">Pipeline activo</div><div className="kf-val amber">1,50 M€</div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Facturación por Línea de Negocio — datos desde Transacciones/Instrucción */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden', marginTop: 12 }}>
                <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>💼 Facturación por Línea de Negocio</div>
                  <span style={{ fontSize: 9, color: 'var(--text4)' }}>Origen: Transacciones / Instrucción</span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  {[
                    { linea: 'Leasing Oficinas',         fees: 10_600_000, ops: 14, color: 'var(--accent)' },
                    { linea: 'Capital Markets',          fees:  5_700_000, ops:  6, color: 'var(--purple)' },
                    { linea: 'Retail',                   fees:  1_800_000, ops:  3, color: 'var(--red)' },
                    { linea: 'Industrial / Logística',   fees:    980_000, ops:  2, color: 'var(--amber)' },
                    { linea: 'Valoraciones',             fees:    560_000, ops:  4, color: 'var(--teal)' },
                    { linea: 'Property Management',      fees:    360_000, ops:  1, color: 'var(--green)' },
                  ].map(r => {
                    const maxFees = 10_600_000
                    const pct = Math.round(r.fees / maxFees * 100)
                    return (
                      <div key={r.linea} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 110, fontSize: 10, color: 'var(--text2)', flexShrink: 0 }}>{r.linea}</div>
                        <div style={{ flex: 1, height: 7, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: 4, transition: '.3s' }}/>
                        </div>
                        <div style={{ width: 70, fontSize: 10, fontWeight: 700, color: r.color, textAlign: 'right', fontFamily: 'var(--mono)', flexShrink: 0 }}>
                          {(r.fees / 1_000_000).toFixed(2)} M€
                        </div>
                        <div style={{ width: 28, fontSize: 9, color: 'var(--text4)', textAlign: 'right', flexShrink: 0 }}>{r.ops} ops</div>
                      </div>
                    )
                  })}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700 }}>TOTAL ACUMULADO</span>
                    <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--text1)' }}>20,00 M€</span>
                  </div>
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
                <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Activos del portfolio (8)</div>
                <table className="dtbl">
                  <thead><tr><th>Activo</th><th>Ciudad</th><th>Uso</th><th>SBA (m²)</th><th>Ocupación</th><th>Renta €/m²</th><th>Estado</th></tr></thead>
                  <tbody>
                    <tr onClick={() => navigate('ficha-activo')}><td className="dtbl-link">P.E Avalon</td><td>Madrid</td><td><span className="tag tag-blue">Oficinas</span></td><td>46.956</td><td style={{ color: 'var(--amber)' }}>78.4%</td><td>10,5</td><td><span className="tag tag-green">Activo</span></td></tr>
                    <tr><td className="dtbl-link">Torre Glòries</td><td>Barcelona</td><td><span className="tag tag-blue">Oficinas</span></td><td>18.500</td><td style={{ color: 'var(--green)' }}>100%</td><td>28,0</td><td><span className="tag tag-green">Activo</span></td></tr>
                    <tr><td className="dtbl-link">Park Logístico Getafe</td><td>Madrid</td><td><span className="tag tag-teal">Logístico</span></td><td>24.000</td><td style={{ color: 'var(--green)' }}>96%</td><td>6,8</td><td><span className="tag tag-green">Activo</span></td></tr>
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
                <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Ofertas activas (5)</div>
                <table className="dtbl">
                  <thead><tr><th>Ref.</th><th>Activo</th><th>M²</th><th>Renta</th><th>Estado</th></tr></thead>
                  <tbody>
                    <tr onClick={() => navigate('ficha-oferta')}><td><span className="asset-link" style={{fontFamily:'var(--mono)'}}>OLB001</span></td><td>P.E Avalon</td><td>698</td><td>10,5–14,5 €/m²</td><td><span className="tag tag-blue">En curso</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Actividad */}
        {activeTab === 'pt-actividad' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">
              <div className="info-block">
                <div className="ib-title">ACTIVIDAD COMERCIAL RECIENTE</div>
                <div className="ir"><span className="ir-k">12/03/2026</span><span className="ir-v">Llamada con Asset Manager — interés mandato</span></div>
                <div className="ir"><span className="ir-k">01/03/2025</span><span className="ir-v">Visita Oracle a P.E Avalon — fase finalista</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Financiero */}
        {activeTab === 'pt-financiero' && (
          <FinancieroTab/>
        )}
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
