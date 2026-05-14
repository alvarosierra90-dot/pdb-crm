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

// Tabs consolidados: Vista 360 unifica Activos/Ofertas/Oportunidades/
// Mandatos/Propuestas/Demandas/Actividades en una sola pantalla
// sincronizada. Facturación añade dashboard analítico de honorarios.
const TABS = ['pt-overview','pt-360','pt-facturacion']
const TAB_LABELS = ['Overview','Vista 360','Facturación']

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

// ── Filtro tipo Excel: popover con ordenación + lista de valores únicos
// con checkboxes. Devuelve un Set de valores seleccionados (null = todos).
function ExcelFilter({ values = [], selected, onChange, sortDir, onSort, isNumber, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const unique = [...new Set(values.map(v => (v == null || v === '') ? '(Vacío)' : String(v)))].sort((a, b) => {
    if (a === '(Vacío)') return 1
    if (b === '(Vacío)') return -1
    if (isNumber) return (Number(a) || 0) - (Number(b) || 0)
    return a.localeCompare(b)
  })
  const visible = unique.filter(v => !search || v.toLowerCase().includes(search.toLowerCase()))
  const allChecked = !selected || selected.size === 0 || selected.size === unique.length
  const toggleAll = () => onChange(allChecked ? new Set() : new Set(unique))
  const toggle = (v) => {
    const ns = new Set(selected || unique)
    if (ns.has(v)) ns.delete(v); else ns.add(v)
    onChange(ns)
  }
  const active = selected && selected.size > 0 && selected.size < unique.length

  return (
    <span ref={ref} style={{ position:'relative', display:'inline-block', marginLeft:4 }}>
      <button onClick={() => setOpen(o => !o)} title="Filtrar / ordenar"
        style={{ background:active ? 'var(--accent)' : 'transparent', color:active ? '#fff' : 'var(--text3)', border:'none', borderRadius:3, width:18, height:18, fontSize:10, cursor:'pointer', padding:0, fontFamily:'inherit', lineHeight:1, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
        ▼
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', [align==='right'?'right':'left']:0, zIndex:3000, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, boxShadow:'0 10px 28px rgba(0,0,0,.18)', width:220, padding:6 }}
          onClick={e => e.stopPropagation()}>
          <button onClick={() => { onSort('asc'); setOpen(false) }}
            style={{ width:'100%', textAlign:'left', padding:'7px 10px', background:'none', border:'none', cursor:'pointer', fontSize:11, fontFamily:'inherit', borderRadius:4, color: sortDir === 'asc' ? 'var(--accent)' : 'var(--text)' }}>
            {isNumber ? '↑ Menor a mayor' : '↑ Ordenar A → Z'} {sortDir === 'asc' && '✓'}
          </button>
          <button onClick={() => { onSort('desc'); setOpen(false) }}
            style={{ width:'100%', textAlign:'left', padding:'7px 10px', background:'none', border:'none', cursor:'pointer', fontSize:11, fontFamily:'inherit', borderRadius:4, color: sortDir === 'desc' ? 'var(--accent)' : 'var(--text)' }}>
            {isNumber ? '↓ Mayor a menor' : '↓ Ordenar Z → A'} {sortDir === 'desc' && '✓'}
          </button>
          <div style={{ borderTop:'1px solid var(--border)', margin:'4px 0' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
            style={{ width:'100%', padding:'5px 8px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, fontFamily:'inherit', boxSizing:'border-box', marginBottom:4 }} />
          <label style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 4px', fontSize:11, cursor:'pointer', fontWeight:600 }}>
            <input type="checkbox" checked={allChecked} onChange={toggleAll}/>
            (Seleccionar todo)
          </label>
          <div style={{ maxHeight:180, overflowY:'auto', borderTop:'1px solid var(--border)', paddingTop:4 }}>
            {visible.map(v => (
              <label key={v} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 4px', fontSize:11, cursor:'pointer' }}>
                <input type="checkbox" checked={!selected || selected.has(v)} onChange={() => toggle(v)} />
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{v}</span>
              </label>
            ))}
            {visible.length === 0 && <div style={{ padding:6, fontSize:10, color:'var(--text4)' }}>Sin coincidencias</div>}
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:6, marginTop:6 }}>
            <button onClick={() => onChange(new Set())} style={{ fontSize:10, background:'none', border:'1px solid var(--border)', padding:'4px 8px', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>Limpiar</button>
            <button onClick={() => setOpen(false)} style={{ fontSize:10, background:'var(--accent)', color:'#fff', border:'none', padding:'4px 10px', borderRadius:4, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Aceptar</button>
          </div>
        </div>
      )}
    </span>
  )
}

// ── Listado de activos para Overview (debajo del mapa, numerado igual)
// con encabezados con filtro Excel (ordenar + checkboxes).
function OverviewActivosList({ activos = [], onClickActivo }) {
  const [sortKey, setSortKey] = useState('idx')
  const [sortDir, setSortDir] = useState('asc')
  // Filtros tipo Excel: por columna, un Set con los valores aceptados.
  // null o vacío = todos.
  const [filters, setFilters] = useState({})

  const setColFilter = (col, set) => setFilters(f => ({ ...f, [col]: set }))
  const onSort = (col, dir) => { setSortKey(col); setSortDir(dir) }

  const accessors = {
    direccion: a => a.direccion || a.nombre || '',
    provincia: a => a.provincia || a.ciudad || '',
    uso:       a => a.uso || '',
    sba:       a => Number(a.sba) || Number(a.m2_totales) || 0,
  }
  const indexed = activos.map((a, i) => ({ ...a, _idx: i + 1 }))
  const passes = (a, col) => {
    const sel = filters[col]
    if (!sel || sel.size === 0) return true
    const v = accessors[col](a)
    const s = (v == null || v === '') ? '(Vacío)' : String(v)
    return sel.has(s)
  }
  const filtered = indexed.filter(a => ['direccion','provincia','uso','sba'].every(c => passes(a, c)))
  const sorted = [...filtered].sort((a, b) => {
    const isNum = sortKey === 'sba' || sortKey === 'idx'
    const va = sortKey === 'idx' ? a._idx : accessors[sortKey]?.(a)
    const vb = sortKey === 'idx' ? b._idx : accessors[sortKey]?.(b)
    const xa = isNum ? Number(va) : (va || '').toString().toLowerCase()
    const xb = isNum ? Number(vb) : (vb || '').toString().toLowerCase()
    if (xa < xb) return sortDir === 'asc' ? -1 : 1
    if (xa > xb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const Hd = ({ col, label, w, isNumber, align }) => (
    <th style={{ textAlign:align||'left', padding:'7px 12px', fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.04em', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', width:w, background:'var(--gray-lt)' }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:2 }}>
        {label}
        <ExcelFilter
          values={indexed.map(accessors[col])}
          selected={filters[col]}
          onChange={(s) => setColFilter(col, s)}
          sortDir={sortKey === col ? sortDir : null}
          onSort={(dir) => onSort(col, dir)}
          isNumber={isNumber}
          align={align === 'right' ? 'right' : 'left'}
        />
      </span>
    </th>
  )

  return (
    <div style={{ marginTop:16, marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.08em' }}>Listado de edificios ({sorted.length} de {activos.length})</span>
      </div>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'visible' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'7px 12px', fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.04em', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', width:48, background:'var(--gray-lt)' }}>#</th>
              <Hd col="direccion" label="Dirección"     />
              <Hd col="provincia" label="Provincia"     />
              <Hd col="uso"       label="Uso principal" />
              <Hd col="sba"       label="SBA (m²)"      w={120} isNumber align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:24, color:'var(--text4)', fontSize:11, textAlign:'center' }}>Sin resultados</td></tr>
            ) : sorted.map(a => (
              <tr key={a.id || a._idx} onClick={() => onClickActivo?.(a)} style={{ borderTop:'1px solid var(--border)', cursor:'pointer' }}>
                <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color:'var(--accent)' }}>#{a._idx}</td>
                <td style={{ padding:'7px 12px' }}>{a.direccion || a.nombre || '—'}</td>
                <td style={{ padding:'7px 12px' }}>{a.provincia || a.ciudad || '—'}</td>
                <td style={{ padding:'7px 12px' }}><span className="tag tag-blue" style={{ fontSize:9 }}>{a.uso || '—'}</span></td>
                <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', textAlign:'right', fontWeight:600 }}>{((Number(a.sba) || Number(a.m2_totales) || 0)).toLocaleString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
const inpStyle = { width:'100%', padding:'4px 6px', fontSize:10, border:'1px solid var(--border)', borderRadius:4, fontFamily:'inherit', background:'var(--surface)', boxSizing:'border-box' }

// Botón "Expandir" — gris oscuro con letras blancas
function ExpandBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:'4px 10px', background:'var(--text2,#334155)', color:'#fff',
      border:'none', borderRadius:4, fontSize:10, fontWeight:600, cursor:'pointer',
      fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:4,
    }}>⛶ Expandir</button>
  )
}

// Modal de expansión — vista grande con filtros Excel multi-columna
function ExpandModal({ open, onClose, title, items = [], columns = [], onRowClick }) {
  const [filters, setFilters] = useState({}) // { col: Set<string> }
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  if (!open) return null

  const getRaw = (c, it) => c.accessor ? c.accessor(it) : it[c.key]
  const toStr = (v) => (v == null || v === '') ? '(Vacío)' : String(v)

  const filtered = items.filter(it => columns.every(c => {
    const sel = filters[c.key]
    if (!sel || sel.size === 0) return true
    return sel.has(toStr(getRaw(c, it)))
  }))
  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const col = columns.find(c => c.key === sortKey)
        if (!col) return 0
        const va = getRaw(col, a)
        const vb = getRaw(col, b)
        const isNum = col.type === 'number'
        const xa = isNum ? (Number(va) || 0) : (va || '').toString().toLowerCase()
        const xb = isNum ? (Number(vb) || 0) : (vb || '').toString().toLowerCase()
        if (xa < xb) return sortDir === 'asc' ? -1 : 1
        if (xa > xb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    : filtered

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.48)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:30 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, width:'95vw', maxWidth:1400, height:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700 }}>{title}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{sorted.length} de {items.length} · filtros Excel-style en cada columna</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text3)', lineHeight:1 }}>×</button>
        </div>
        <div style={{ flex:1, overflow:'auto', padding:'12px 20px 20px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'var(--gray-lt)' }}>
                {columns.map((c, idx) => (
                  <th key={c.key} style={{ textAlign:c.cellStyle?.textAlign || 'left', padding:'8px 12px', fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.04em', userSelect:'none', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:2 }}>
                      {c.label}
                      <ExcelFilter
                        values={items.map(it => getRaw(c, it))}
                        selected={filters[c.key]}
                        onChange={(s) => setFilters(f => ({ ...f, [c.key]:s }))}
                        sortDir={sortKey === c.key ? sortDir : null}
                        onSort={(dir) => { setSortKey(c.key); setSortDir(dir) }}
                        isNumber={c.type === 'number'}
                        align={idx >= columns.length - 1 ? 'right' : 'left'}
                      />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0
                ? <tr><td colSpan={columns.length} style={{ padding:30, color:'var(--text4)', textAlign:'center' }}>Sin resultados</td></tr>
                : sorted.map((it, i) => (
                  <tr key={it.id || it.ref || i} onClick={() => onRowClick?.(it)} style={{ borderTop:'1px solid var(--border)', cursor: onRowClick ? 'pointer' : 'default' }}>
                    {columns.map(c => (
                      <td key={c.key} style={{ padding:'8px 12px', ...(c.cellStyle || {}) }}>
                        {c.render ? c.render(it) : (c.accessor ? c.accessor(it) : it[c.key]) ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function PortfolioFicha() {
  const { navigate, params } = useNav()
  const [activeTab, setActiveTab] = useState('pt-overview')
  const [expanded, setExpanded] = useState(null) // 'activos' | 'ofertas' | 'oportunidades' | 'mandatos' | null
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
    const palette = { Oficinas:'#B08D57', 'Logístico':'#16a34a', Logistico:'#16a34a', 'Industrial':'#16a34a', Retail:'#ec4899', Residencial:'#8b5cf6', Hoteles:'#f59e0b', Suelo:'#ef4444', 'Centros comerciales':'#0891b2', 'Data Center':'#9333ea', Mixto:'#9333ea' }
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
                <div style={{ display:'flex', alignItems:'stretch', gap:24, flexShrink: 0, marginLeft: 24 }}>
                  <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', textAlign:'right' }}>
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.06em' }}>Facturación Savills</div>
                    <div style={{ fontSize:22, fontWeight:700, lineHeight:1.1, marginTop:2, color:'var(--text)' }}>{fmtEur(facturacionTotal)}</div>
                    <div style={{ fontSize:10, color:'var(--text4)', marginTop:3 }}>{fmtEur(facturacionEnCurso)} en curso · {mandatos.length} mandatos</div>
                  </div>
                  <div style={{ width:1, background:'var(--border)' }} />
                  <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', textAlign:'right' }}>
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.06em' }}>Proyectos en curso</div>
                    <div style={{ fontSize:22, fontWeight:700, lineHeight:1.1, marginTop:2, color:'var(--text)' }}>{mandatosEnCurso.length}</div>
                    <div style={{ fontSize:10, color:'var(--text4)', marginTop:3 }}>{oportunidadesActivas.length} oportunidades activas</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center' }}>
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

        <div className="tabs">
          {TABS.map((t, i) => (
            <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[i]}</div>
          ))}
        </div>

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

              {/* Listado de edificios numerado (igual numeración que el mapa)
                  con ordenación por click en encabezados de columna */}
              <OverviewActivosList
                activos={activosFiltrados}
                onClickActivo={(a) => navigate('ficha-activo', { ref: a.ref })}
              />
            </div>
          </div>
        )}

        {/* Activos */}
        {/* ─── VISTA 360 ── Consolida activos, ofertas, oportunidades,
            mandatos, propuestas, demandas y actividades en una sola
            interfaz, mismo formato que la Vista 360 de Activos. ─── */}
        {activeTab === 'pt-360' && (() => {
          const totalFee = mandatos.reduce((s,m) => s + (Number(m.fee_eur_fijo)||0), 0)
          const numOps = mandatos.length + (oportunidadesActivas?.length || 0)
          // Timeline cronológico simulado (en un futuro vendrá de tabla actividades).
          const timeline = [
            ...mandatos.slice(0,3).map(m => ({ tipo:'MANDATO', av:'AS', bg:'#fef3c7', color:'#92400e', name:'Sistema', msg:`firmó mandato ${m.ref} — ${m.titulo || m.tipo}`, badge:{bg:'#fef3c7',color:'#92400e',bc:'#fde68a',lbl:'MANDATO'}, time:m.fecha_firma ? new Date(m.fecha_firma).toLocaleDateString('es-ES') : '—' })),
            ...ofertasFiltradas.slice(0,2).map(o => ({ tipo:'OFERTA', av:'JL', bg:'#dcfce7', color:'#166534', name:'Sistema', msg:`registró oferta ${o.ref}`, badge:{bg:'var(--green-lt)',color:'var(--green)',bc:'var(--green-bd)',lbl:'OFERTA'}, time:'—' })),
            ...oportunidades.slice(0,2).map(o => ({ tipo:'OPORT', av:'MR', bg:'#fce7f3', color:'#9d174d', name:'Sistema', msg:`abrió oportunidad ${o.nombre || o.dynamics_id}`, badge:{bg:'var(--accent-lt)',color:'var(--accent)',bc:'var(--accent-bd)',lbl:'OPORTUNIDAD'}, time:o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleDateString('es-ES') : '—' })),
          ]
          return (
            <div className="tab-content active" style={{ overflowY:'auto' }}>
              <div className="port-body">

                {/* KPI strip — 7 categorías sincronizadas */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, marginBottom:14 }}>
                  {[
                    { lbl:'Activos',       val:activosFiltrados.length, color:'var(--text1)' },
                    { lbl:'Ofertas',       val:ofertasFiltradas.length, color:'var(--green)' },
                    { lbl:'Oportunidades', val:oportunidades.length,    color:'var(--accent)' },
                    { lbl:'Mandatos',      val:mandatos.length,         color:'var(--amber)' },
                    { lbl:'Propuestas',    val:0,                        color:'var(--teal)' },
                    { lbl:'Demandas',      val:0,                        color:'var(--purple)' },
                    { lbl:'Fee total',     val:`${(totalFee/1000).toLocaleString('es-ES',{maximumFractionDigits:0})} k€`, color:'var(--green)' },
                  ].map(k => (
                    <div key={k.lbl} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'8px 10px', textAlign:'center' }}>
                      <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3, lineHeight:1.2 }}>{k.lbl}</div>
                      <div style={{ fontSize:18, fontWeight:800, fontFamily:'var(--mono)', color:k.color, lineHeight:1 }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {/* Timeline cronológico */}
                <div style={{ fontSize:11, fontWeight:600, marginBottom:8, color:'var(--text2)' }}>Timeline cronológico · trazabilidad comercial</div>
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'hidden', marginBottom:18 }}>
                  {timeline.length === 0 ? (
                    <div style={{ padding:'16px', textAlign:'center', color:'var(--text4)', fontSize:11 }}>Sin actividad reciente</div>
                  ) : timeline.map((item,i,arr) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderBottom:i<arr.length-1?'1px solid var(--border)':'none' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:item.color, flexShrink:0 }}>{item.av}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, color:'var(--text2)' }}><strong>{item.name}</strong> {item.msg} <span style={{ background:item.badge.bg, color:item.badge.color, border:`1px solid ${item.badge.bc}`, padding:'1px 7px', borderRadius:10, fontSize:9, fontWeight:700, marginLeft:4 }}>{item.badge.lbl}</span></div>
                        <div style={{ fontSize:10, color:'var(--text4)', marginTop:2 }}>{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grid 2 columnas con todas las secciones sincronizadas */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

                  {/* Activos vinculados */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header">
                      <h3>Activos vinculados <span style={{ fontSize:9, color:'var(--text4)', fontWeight:400, marginLeft:6 }}>{activosFiltrados.length}</span></h3>
                      <ExpandBtn onClick={() => setExpanded('activos')} />
                    </div>
                    <div style={{ padding:'4px 0 14px' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead><tr>{['Ref','Activo','Ciudad','Uso','SBA m²'].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 12px', fontSize:9, color:'var(--text4)', fontWeight:600, textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {activosFiltrados.length === 0
                            ? <tr><td colSpan={5} style={{ padding:14, color:'var(--text4)', fontSize:11, textAlign:'center' }}>Sin activos</td></tr>
                            : activosFiltrados.slice(0,10).map(a => (
                              <tr key={a.id} style={{ borderTop:'1px solid var(--border)', cursor:'pointer' }} onClick={() => navigate('ficha-activo', { ref:a.ref })}>
                                <td style={{ padding:'6px 12px' }}><span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--accent)' }}>{a.ref}</span></td>
                                <td style={{ padding:'6px 12px', fontWeight:500 }}>{a.nombre || '—'}</td>
                                <td style={{ padding:'6px 12px', fontSize:10 }}>{a.ciudad || '—'}</td>
                                <td style={{ padding:'6px 12px' }}><span className="tag tag-blue" style={{ fontSize:9 }}>{a.uso || '—'}</span></td>
                                <td style={{ padding:'6px 12px', fontFamily:'var(--mono)', fontSize:10 }}>{(Number(a.sba)||0).toLocaleString('es-ES')}</td>
                              </tr>
                            ))}
                          {activosFiltrados.length > 10 && <tr><td colSpan={5} style={{ padding:'6px 12px', fontSize:10, color:'var(--text3)', textAlign:'center' }}>+ {activosFiltrados.length - 10} más</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Ofertas asociadas */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header">
                      <h3>Ofertas asociadas <span style={{ fontSize:9, color:'var(--text4)', fontWeight:400, marginLeft:6 }}>{ofertasFiltradas.length}</span></h3>
                      <ExpandBtn onClick={() => setExpanded('ofertas')} />
                    </div>
                    <div style={{ padding:'4px 0 14px' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead><tr>{['Ref','Activo','Renta','Estado'].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 12px', fontSize:9, color:'var(--text4)', fontWeight:600, textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {ofertasFiltradas.length === 0
                            ? <tr><td colSpan={4} style={{ padding:14, color:'var(--text4)', fontSize:11, textAlign:'center' }}>Sin ofertas</td></tr>
                            : ofertasFiltradas.slice(0,10).map(o => {
                              const a = activosFiltrados.find(x => x.id === o.activo_id)
                              const col = o.estado === 'Retirada' ? 'tag-gray' : (o.estado || '').includes('Ocupada') ? 'tag-amber' : 'tag-green'
                              return (
                                <tr key={o.id} style={{ borderTop:'1px solid var(--border)', cursor:'pointer' }} onClick={() => navigate('ficha-oferta', { id:o.ref })}>
                                  <td style={{ padding:'6px 12px' }}><span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--accent)' }}>{o.ref}</span></td>
                                  <td style={{ padding:'6px 12px', fontSize:10 }}>{a?.nombre || '—'}</td>
                                  <td style={{ padding:'6px 12px', fontFamily:'var(--mono)', fontSize:10 }}>{o.renta_m2 ? `${o.renta_m2} €/m²` : '—'}</td>
                                  <td style={{ padding:'6px 12px' }}><span className={`tag ${col}`} style={{ fontSize:9 }}>{o.estado || '—'}</span></td>
                                </tr>
                              )
                            })}
                          {ofertasFiltradas.length > 10 && <tr><td colSpan={4} style={{ padding:'6px 12px', fontSize:10, color:'var(--text3)', textAlign:'center' }}>+ {ofertasFiltradas.length - 10} más</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Oportunidades */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header">
                      <h3>Oportunidades <span style={{ fontSize:9, color:'var(--text4)', fontWeight:400, marginLeft:6 }}>{oportunidades.length}</span></h3>
                      <ExpandBtn onClick={() => setExpanded('oportunidades')} />
                    </div>
                    <div style={{ padding:'4px 0 14px' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead><tr>{['ID','Nombre','Tipo','Estado'].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 12px', fontSize:9, color:'var(--text4)', fontWeight:600, textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {oportunidades.length === 0
                            ? <tr><td colSpan={4} style={{ padding:14, color:'var(--text4)', fontSize:11, textAlign:'center' }}>Sin oportunidades</td></tr>
                            : oportunidades.slice(0,10).map(o => (
                              <tr key={o.dynamics_id} style={{ borderTop:'1px solid var(--border)' }}>
                                <td style={{ padding:'6px 12px' }}><span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--accent)' }}>{o.dynamics_id}</span></td>
                                <td style={{ padding:'6px 12px', fontWeight:500 }}>{o.nombre || '—'}</td>
                                <td style={{ padding:'6px 12px' }}><span className="tag tag-blue" style={{ fontSize:9 }}>{o.tipo || '—'}</span></td>
                                <td style={{ padding:'6px 12px' }}><span className="tag tag-gray" style={{ fontSize:9 }}>{o.estado || '—'}</span></td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Instrucciones — a la derecha de Oportunidades (orden visual) */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header">
                      <h3>Instrucciones <span style={{ fontSize:9, color:'var(--text4)', fontWeight:400, marginLeft:6 }}>0</span></h3>
                      <ExpandBtn onClick={() => setExpanded('instrucciones')} />
                    </div>
                    <div style={{ padding:'16px', textAlign:'center', color:'var(--text4)', fontSize:11, fontStyle:'italic' }}>
                      Instrucciones (dynamics_instructions) vinculadas a la cuenta del portfolio aparecerán aquí.
                    </div>
                  </div>

                  {/* Mandatos */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header">
                      <h3>Mandatos vinculados <span style={{ fontSize:9, color:'var(--text4)', fontWeight:400, marginLeft:6 }}>{mandatos.length}</span></h3>
                      <ExpandBtn onClick={() => setExpanded('mandatos')} />
                    </div>
                    <div style={{ padding:'4px 0 14px' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead><tr>{['Ref','Título','Tipo','Fee €','Estado'].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 12px', fontSize:9, color:'var(--text4)', fontWeight:600, textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {mandatos.length === 0
                            ? <tr><td colSpan={5} style={{ padding:14, color:'var(--text4)', fontSize:11, textAlign:'center' }}>Sin mandatos</td></tr>
                            : mandatos.slice(0,10).map(m => (
                              <tr key={m.id} style={{ borderTop:'1px solid var(--border)', cursor:'pointer' }} onClick={() => navigate('ficha-mandato', { id:m.ref })}>
                                <td style={{ padding:'6px 12px' }}><span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--accent)' }}>{m.ref}</span></td>
                                <td style={{ padding:'6px 12px', fontSize:10 }}>{m.titulo || '—'}</td>
                                <td style={{ padding:'6px 12px' }}><span className="tag tag-blue" style={{ fontSize:9 }}>{m.tipo || '—'}</span></td>
                                <td style={{ padding:'6px 12px', fontFamily:'var(--mono)', fontSize:10, fontWeight:600, color:'var(--green)' }}>{m.fee_eur_fijo ? Number(m.fee_eur_fijo).toLocaleString('es-ES') : '—'}</td>
                                <td style={{ padding:'6px 12px' }}><span className={`tag ${m.estado === 'en_curso' ? 'tag-green' : 'tag-gray'}`} style={{ fontSize:9 }}>{m.estado || '—'}</span></td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Propuestas (placeholder hasta wiring de propuestas) */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header"><h3>Propuestas y proyectos <span style={{ fontSize:9, color:'var(--text4)', fontWeight:400, marginLeft:6 }}>0</span></h3></div>
                    <div style={{ padding:'16px', textAlign:'center', color:'var(--text4)', fontSize:11, fontStyle:'italic' }}>
                      Las propuestas vinculadas a la cuenta aparecerán aquí cuando se asocien al portfolio.
                    </div>
                  </div>

                  {/* Demandas (placeholder) */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header"><h3>Demandas relacionadas <span style={{ fontSize:9, color:'var(--text4)', fontWeight:400, marginLeft:6 }}>0</span></h3></div>
                    <div style={{ padding:'16px', textAlign:'center', color:'var(--text4)', fontSize:11, fontStyle:'italic' }}>
                      Las demandas en las que algún activo del portfolio aparezca como alternativa se mostrarán aquí.
                    </div>
                  </div>

                  {/* Instrucciones / actividades */}
                  <div className="va-card" style={{ margin:0, gridColumn:'1 / -1' }}>
                    <div className="va-card-header"><h3>Histórico de movimientos y vinculaciones</h3><span className="hint">Trazabilidad inmutable</span></div>
                    <div style={{ padding:'12px 20px', fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
                      Toda la actividad operativa del portfolio queda registrada y sincronizada automáticamente desde activos, ofertas, oportunidades y mandatos. El timeline superior muestra los eventos más relevantes.
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )
        })()}

        {/* ─── FACTURACIÓN ── Dashboard analítico ejecutivo ─── */}
        {activeTab === 'pt-facturacion' && (() => {
          const totalFee = mandatos.reduce((s,m) => s + (Number(m.fee_eur_fijo)||0), 0)
          const numOps = mandatos.length
          const feeMedio = numOps > 0 ? totalFee / numOps : 0

          // Breakdown por línea de negocio (tipo de mandato)
          const porLinea = {}
          mandatos.forEach(m => {
            const k = m.tipo || 'Otro'
            porLinea[k] = (porLinea[k] || 0) + (Number(m.fee_eur_fijo)||0)
          })
          const lineas = Object.entries(porLinea).sort((a,b) => b[1] - a[1])
          const maxLinea = Math.max(...lineas.map(l => l[1]), 1)

          // Por año (basado en fecha_firma)
          const porAnyo = {}
          mandatos.forEach(m => {
            if (!m.fecha_firma) return
            const y = String(new Date(m.fecha_firma).getFullYear())
            porAnyo[y] = (porAnyo[y] || 0) + (Number(m.fee_eur_fijo)||0)
          })
          const anyosSorted = Object.entries(porAnyo).sort((a,b) => a[0].localeCompare(b[0]))
          const maxAnyo = Math.max(...anyosSorted.map(a => a[1]), 1)

          // YoY (comparativa último vs anterior)
          const ult = anyosSorted[anyosSorted.length-1]
          const ant = anyosSorted[anyosSorted.length-2]
          const yoy = (ult && ant && ant[1] > 0) ? ((ult[1] - ant[1]) / ant[1]) * 100 : null

          // Por trimestre del año actual
          const yearAct = new Date().getFullYear()
          const trimestres = { Q1:0, Q2:0, Q3:0, Q4:0 }
          mandatos.forEach(m => {
            if (!m.fecha_firma) return
            const d = new Date(m.fecha_firma)
            if (d.getFullYear() !== yearAct) return
            const q = `Q${Math.floor(d.getMonth()/3)+1}`
            trimestres[q] += (Number(m.fee_eur_fijo)||0)
          })

          // Por responsable / consultor
          const porResp = {}
          mandatos.forEach(m => {
            const k = m.responsable || 'Sin asignar'
            porResp[k] = (porResp[k] || 0) + (Number(m.fee_eur_fijo)||0)
          })
          const responsables = Object.entries(porResp).sort((a,b) => b[1] - a[1])

          // Por provincia
          const porProv = {}
          mandatos.forEach(m => {
            const k = m.provincia || 'Sin asignar'
            porProv[k] = (porProv[k] || 0) + (Number(m.fee_eur_fijo)||0)
          })
          const provincias = Object.entries(porProv).sort((a,b) => b[1] - a[1])

          // Por departamento / delegación
          const porDep = {}
          mandatos.forEach(m => {
            const k = m.departamento || 'Sin asignar'
            porDep[k] = (porDep[k] || 0) + (Number(m.fee_eur_fijo)||0)
          })
          const deps = Object.entries(porDep).sort((a,b) => b[1] - a[1])

          const fmtEur = (n) => n >= 1000 ? `${(n/1000).toLocaleString('es-ES',{maximumFractionDigits:0})} k€` : `${n.toLocaleString('es-ES',{maximumFractionDigits:0})} €`

          return (
            <div className="tab-content active" style={{ overflowY:'auto' }}>
              <div className="port-body">

                {/* KPIs superiores */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:14 }}>
                  {[
                    { lbl:'Facturación total',  val:fmtEur(totalFee),                                color:'var(--green)' },
                    { lbl:'Operaciones',        val:numOps,                                          color:'var(--text1)' },
                    { lbl:'Honorario medio',    val:fmtEur(feeMedio),                                color:'var(--accent)' },
                    { lbl:'Líneas de negocio',  val:lineas.length,                                   color:'var(--purple)' },
                    { lbl:'YoY',                val:yoy != null ? `${yoy>=0?'+':''}${yoy.toFixed(1)}%` : '—', color: yoy != null && yoy >= 0 ? 'var(--green)' : 'var(--red)' },
                  ].map(k => (
                    <div key={k.lbl} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 14px' }}>
                      <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{k.lbl}</div>
                      <div style={{ fontSize:20, fontWeight:800, fontFamily:'var(--mono)', color:k.color, lineHeight:1 }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

                  {/* Evolución anual */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header"><h3>Evolución temporal · facturación por año</h3></div>
                    <div style={{ padding:'14px 18px' }}>
                      {anyosSorted.length === 0 ? (
                        <div style={{ padding:'16px', textAlign:'center', color:'var(--text4)', fontSize:11 }}>Sin datos históricos</div>
                      ) : (
                        <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:140 }}>
                          {anyosSorted.map(([y, v]) => {
                            const h = (v / maxAnyo) * 110
                            return (
                              <div key={y} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                                <div style={{ fontSize:9, fontFamily:'var(--mono)', fontWeight:600, color:'var(--text2)' }}>{fmtEur(v)}</div>
                                <div style={{ width:'100%', height:h, background:'linear-gradient(180deg,var(--accent),var(--accent-bd))', borderRadius:'4px 4px 0 0', minHeight:4 }} />
                                <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600 }}>{y}</div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Por trimestre (año actual) */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header"><h3>Por trimestre · {yearAct}</h3></div>
                    <div style={{ padding:'14px 18px' }}>
                      {(() => {
                        const maxQ = Math.max(...Object.values(trimestres), 1)
                        return (
                          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:140 }}>
                            {Object.entries(trimestres).map(([q, v]) => {
                              const h = (v / maxQ) * 110
                              return (
                                <div key={q} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                                  <div style={{ fontSize:9, fontFamily:'var(--mono)', fontWeight:600, color:'var(--text2)' }}>{v > 0 ? fmtEur(v) : '—'}</div>
                                  <div style={{ width:'100%', height: v > 0 ? h : 4, background: v > 0 ? 'var(--purple)' : 'var(--gray-lt)', borderRadius:'4px 4px 0 0', minHeight:4 }} />
                                  <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600 }}>{q}</div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

                  {/* Ranking líneas de negocio */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header"><h3>Ranking · líneas de negocio</h3></div>
                    <div style={{ padding:'10px 18px 14px' }}>
                      {lineas.length === 0 ? (
                        <div style={{ padding:'16px', textAlign:'center', color:'var(--text4)', fontSize:11 }}>Sin datos</div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {lineas.map(([l, v], i) => (
                            <div key={l}>
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                                <span style={{ fontWeight:600 }}>{i === 0 && '🏆 '}{l}</span>
                                <span style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--green)' }}>{fmtEur(v)}</span>
                              </div>
                              <div style={{ height:6, background:'var(--gray-lt)', borderRadius:3, overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${(v / maxLinea) * 100}%`, background:i === 0 ? 'var(--green)' : i === 1 ? 'var(--accent)' : 'var(--purple)' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Por responsable */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header"><h3>Por consultor responsable</h3></div>
                    <div style={{ padding:'4px 0 14px' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead><tr>{['Consultor','Ops','Facturado'].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 14px', fontSize:9, color:'var(--text4)', fontWeight:600, textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {responsables.length === 0
                            ? <tr><td colSpan={3} style={{ padding:14, color:'var(--text4)', fontSize:11, textAlign:'center' }}>Sin datos</td></tr>
                            : responsables.map(([r, v]) => {
                              const ops = mandatos.filter(m => (m.responsable || 'Sin asignar') === r).length
                              return (
                                <tr key={r} style={{ borderTop:'1px solid var(--border)' }}>
                                  <td style={{ padding:'6px 14px', fontWeight:500 }}>{r}</td>
                                  <td style={{ padding:'6px 14px', fontFamily:'var(--mono)' }}>{ops}</td>
                                  <td style={{ padding:'6px 14px', fontFamily:'var(--mono)', fontWeight:700, color:'var(--green)' }}>{fmtEur(v)}</td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

                  {/* Por provincia */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header"><h3>Por provincia</h3></div>
                    <div style={{ padding:'4px 0 14px' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead><tr>{['Provincia','Ops','Facturado'].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 14px', fontSize:9, color:'var(--text4)', fontWeight:600, textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {provincias.length === 0
                            ? <tr><td colSpan={3} style={{ padding:14, color:'var(--text4)', fontSize:11, textAlign:'center' }}>Sin datos</td></tr>
                            : provincias.map(([p, v]) => {
                              const ops = mandatos.filter(m => (m.provincia || 'Sin asignar') === p).length
                              return (
                                <tr key={p} style={{ borderTop:'1px solid var(--border)' }}>
                                  <td style={{ padding:'6px 14px', fontWeight:500 }}>{p}</td>
                                  <td style={{ padding:'6px 14px', fontFamily:'var(--mono)' }}>{ops}</td>
                                  <td style={{ padding:'6px 14px', fontFamily:'var(--mono)', fontWeight:700, color:'var(--green)' }}>{fmtEur(v)}</td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Por delegación / departamento */}
                  <div className="va-card" style={{ margin:0 }}>
                    <div className="va-card-header"><h3>Por delegación / equipo</h3></div>
                    <div style={{ padding:'4px 0 14px' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead><tr>{['Delegación','Ops','Facturado'].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 14px', fontSize:9, color:'var(--text4)', fontWeight:600, textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {deps.length === 0
                            ? <tr><td colSpan={3} style={{ padding:14, color:'var(--text4)', fontSize:11, textAlign:'center' }}>Sin datos</td></tr>
                            : deps.map(([d, v]) => {
                              const ops = mandatos.filter(m => (m.departamento || 'Sin asignar') === d).length
                              return (
                                <tr key={d} style={{ borderTop:'1px solid var(--border)' }}>
                                  <td style={{ padding:'6px 14px', fontWeight:500 }}>{d}</td>
                                  <td style={{ padding:'6px 14px', fontFamily:'var(--mono)' }}>{ops}</td>
                                  <td style={{ padding:'6px 14px', fontFamily:'var(--mono)', fontWeight:700, color:'var(--green)' }}>{fmtEur(v)}</td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

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

      {/* ─── Modal Expandir — configuración por sección ─── */}
      <ExpandModal
        open={expanded === 'activos'}
        onClose={() => setExpanded(null)}
        title={`Activos vinculados al portfolio (${activosFiltrados.length})`}
        items={activosFiltrados}
        onRowClick={(a) => navigate('ficha-activo', { ref: a.ref })}
        columns={[
          { key:'ref',       label:'Ref',           render:a => <span style={{ fontFamily:'var(--mono)', color:'var(--accent)' }}>{a.ref}</span> },
          { key:'nombre',    label:'Activo',        render:a => <span style={{ fontWeight:600 }}>{a.nombre || '—'}</span> },
          { key:'direccion', label:'Dirección' },
          { key:'provincia', label:'Provincia',     accessor:a => a.provincia || a.ciudad },
          { key:'uso',       label:'Uso principal', render:a => <span className="tag tag-blue" style={{ fontSize:9 }}>{a.uso || '—'}</span> },
          { key:'sba',       label:'SBA (m²)',      type:'number', accessor:a => Number(a.sba) || Number(a.m2_totales) || 0, render:a => ((Number(a.sba) || Number(a.m2_totales) || 0)).toLocaleString('es-ES'), cellStyle:{ fontFamily:'var(--mono)', textAlign:'right', fontWeight:600 } },
          { key:'estado',    label:'Estado',        render:a => <span className={`tag ${a.estado === 'archivado' ? 'tag-gray' : 'tag-green'}`} style={{ fontSize:9 }}>{a.estado || 'Activo'}</span> },
        ]}
      />
      <ExpandModal
        open={expanded === 'ofertas'}
        onClose={() => setExpanded(null)}
        title={`Ofertas del portfolio (${ofertasFiltradas.length})`}
        items={ofertasFiltradas}
        onRowClick={(o) => navigate('ficha-oferta', { id: o.ref })}
        columns={[
          { key:'ref',            label:'Ref',           render:o => <span style={{ fontFamily:'var(--mono)', color:'var(--accent)' }}>{o.ref}</span> },
          { key:'activo',         label:'Activo',        accessor:o => activosFiltrados.find(a => a.id === o.activo_id)?.nombre || '—' },
          { key:'tipo_operacion', label:'Tipo' },
          { key:'superficie_disponible', label:'m²', type:'number', accessor:o => Number(o.superficie_disponible) || 0, render:o => o.superficie_disponible ? Number(o.superficie_disponible).toLocaleString('es-ES') : '—', cellStyle:{ fontFamily:'var(--mono)', textAlign:'right' } },
          { key:'renta_m2',       label:'Renta €/m²',    type:'number', accessor:o => Number(o.renta_m2) || 0, render:o => o.renta_m2 != null ? Number(o.renta_m2).toLocaleString('es-ES') : '—', cellStyle:{ fontFamily:'var(--mono)', textAlign:'right' } },
          { key:'estado',         label:'Estado',        render:o => { const c = o.estado === 'Retirada' ? 'tag-gray' : (o.estado || '').includes('Ocupada') ? 'tag-amber' : 'tag-green'; return <span className={`tag ${c}`} style={{ fontSize:9 }}>{o.estado || '—'}</span> } },
        ]}
      />
      <ExpandModal
        open={expanded === 'oportunidades'}
        onClose={() => setExpanded(null)}
        title={`Oportunidades (${oportunidades.length})`}
        items={oportunidades}
        columns={[
          { key:'dynamics_id', label:'Dynamics ID',  render:o => <span style={{ fontFamily:'var(--mono)', color:'var(--accent)' }}>{o.dynamics_id}</span> },
          { key:'nombre',      label:'Nombre',       render:o => <span style={{ fontWeight:500 }}>{o.nombre || '—'}</span> },
          { key:'tipo',        label:'Tipo',         render:o => <span className="tag tag-blue" style={{ fontSize:9 }}>{o.tipo || '—'}</span> },
          { key:'estado',      label:'Estado',       render:o => <span className="tag tag-gray" style={{ fontSize:9 }}>{o.estado || '—'}</span> },
          { key:'fecha_creacion', label:'Fecha',     accessor:o => o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleDateString('es-ES') : '—' },
        ]}
      />
      <ExpandModal
        open={expanded === 'mandatos'}
        onClose={() => setExpanded(null)}
        title={`Mandatos vinculados (${mandatos.length})`}
        items={mandatos}
        onRowClick={(m) => navigate('ficha-mandato', { id: m.ref })}
        columns={[
          { key:'ref',          label:'Ref',         render:m => <span style={{ fontFamily:'var(--mono)', color:'var(--accent)' }}>{m.ref}</span> },
          { key:'titulo',       label:'Título' },
          { key:'tipo',         label:'Tipo',        render:m => <span className="tag tag-blue" style={{ fontSize:9 }}>{m.tipo || '—'}</span> },
          { key:'fecha_firma',  label:'Firma',       accessor:m => m.fecha_firma ? new Date(m.fecha_firma).toLocaleDateString('es-ES') : '—' },
          { key:'fecha_vencimiento', label:'Vencimiento', accessor:m => m.fecha_vencimiento ? new Date(m.fecha_vencimiento).toLocaleDateString('es-ES') : '—' },
          { key:'fee_eur_fijo', label:'Fee €',       type:'number', accessor:m => Number(m.fee_eur_fijo) || 0, render:m => m.fee_eur_fijo ? Number(m.fee_eur_fijo).toLocaleString('es-ES') : '—', cellStyle:{ fontFamily:'var(--mono)', textAlign:'right', fontWeight:700, color:'var(--green)' } },
          { key:'estado',       label:'Estado',      render:m => <span className={`tag ${m.estado === 'en_curso' ? 'tag-green' : m.estado === 'cancelado' ? 'tag-red' : 'tag-gray'}`} style={{ fontSize:9 }}>{m.estado || '—'}</span> },
        ]}
      />
    </div>
  )
}
