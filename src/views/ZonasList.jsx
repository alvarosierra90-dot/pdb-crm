import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

const ZONAS = [
  { id:'MAD-M30', zona:'M-30 / Distrito Centro', subzona:'M-30', provincia:'Madrid', uso:'Oficinas', activos_n:2, activos:['P.E Avalon','Parque Empresarial Norte'], stock:58156, disponible:13024, ocupacion:78.9, ofertas_activas:3, takeup_ytd:8500, ops_ytd:4, renta_media:13.5, renta_min:10.5, renta_max:16.8, vacancia:22.4 },
  { id:'ALC-A1', zona:'Alcobendas / A-1', subzona:'Corredor A-1', provincia:'Madrid', uso:'Oficinas', activos_n:1, activos:['Albatros'], stock:53944, disponible:13486, ocupacion:75.0, ofertas_activas:2, takeup_ytd:5200, ops_ytd:2, renta_media:12.5, renta_min:12.0, renta_max:14.5, vacancia:25.0 },
  { id:'BCN-22AT', zona:'22@ / Diagonal', subzona:'22@', provincia:'Barcelona', uso:'Oficinas', activos_n:2, activos:['Edificio Diagonal 95','Torre Glòries'], stock:28300, disponible:1176, ocupacion:95.8, ofertas_activas:1, takeup_ytd:3200, ops_ytd:3, renta_media:25.0, renta_min:22.0, renta_max:28.0, vacancia:4.2 },
  { id:'MAD-GET', zona:'Getafe / Corredor A-4', subzona:'Getafe Industrial', provincia:'Madrid', uso:'Logístico', activos_n:1, activos:['Park Logístico Getafe'], stock:24000, disponible:960, ocupacion:96.0, ofertas_activas:1, takeup_ytd:12000, ops_ytd:1, renta_media:6.8, renta_min:6.5, renta_max:7.2, vacancia:4.0 },
  { id:'MAD-LEG', zona:'Leganés / Sur Madrid', subzona:'Sur M-40', provincia:'Madrid', uso:'Retail', activos_n:1, activos:['Centro Comercial Parquesur'], stock:42000, disponible:3780, ocupacion:91.0, ofertas_activas:2, takeup_ytd:2100, ops_ytd:2, renta_media:18.0, renta_min:15.0, renta_max:22.0, vacancia:9.0 },
  { id:'VLC-MES', zona:'Mestalla / Valencia', subzona:'Centro Valencia', provincia:'Valencia', uso:'Oficinas', activos_n:1, activos:['Torre Europa Valencia'], stock:7600, disponible:1292, ocupacion:83.0, ofertas_activas:1, takeup_ytd:900, ops_ytd:1, renta_media:14.5, renta_min:13.0, renta_max:16.0, vacancia:17.0 },
]

const USO_TAG = { Oficinas:'tag-blue', Logístico:'tag-teal', Retail:'tag-purple' }
const fmt = n => n >= 1000 ? (n/1000).toFixed(1).replace(/\.0$/,'')+'k' : n

const totalStock   = ZONAS.reduce((s,z)=>s+z.stock,0)
const totalDisp    = ZONAS.reduce((s,z)=>s+z.disponible,0)
const totalTakeup  = ZONAS.reduce((s,z)=>s+z.takeup_ytd,0)
const totalOps     = ZONAS.reduce((s,z)=>s+z.ops_ytd,0)
const avgOcupacion = Math.round(ZONAS.reduce((s,z)=>s+z.ocupacion,0)/ZONAS.length*10)/10
const totalOfertas = ZONAS.reduce((s,z)=>s+z.ofertas_activas,0)

const COLS = [
  { id: 'zona',           label: 'Zona',        required: true, type:'text',   getValue: r => r.zona },
  { id: 'provincia',      label: 'Provincia',                   type:'enum',   getValue: r => r.provincia },
  { id: 'uso',            label: 'Uso',                         type:'enum',   getValue: r => r.uso },
  { id: 'activos_n',      label: 'Activos',                     type:'number', getValue: r => r.activos_n },
  { id: 'stock',          label: 'Stock m²',                    type:'number', getValue: r => r.stock },
  { id: 'disponible',     label: 'Disponible',                  type:'number', getValue: r => r.disponible },
  { id: 'ocupacion',      label: 'Ocupación',                   type:'number', getValue: r => r.ocupacion },
  { id: 'ofertas_activas',label: 'Ofertas',                     type:'number', getValue: r => r.ofertas_activas },
  { id: 'takeup_ytd',     label: 'Take-up YTD',                 type:'number', getValue: r => r.takeup_ytd },
  { id: 'ops_ytd',        label: 'Ops YTD',                     type:'number', getValue: r => r.ops_ytd },
  { id: 'renta_media',    label: 'Renta media',                 type:'number', getValue: r => r.renta_media },
  { id: '_act',           label: '',             sys: true },
]

export default function ZonasList() {
  const { navigate } = useNav()
  const [query,   setQuery]   = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ uso: '', provincia: '', occMin: '', occMax: '' })
  const [vis, setVis] = useVisibleCols('zonas', COLS)

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = ZONAS.filter(z => {
    const q = query.toLowerCase()
    if (q && !z.zona.toLowerCase().includes(q) && !z.subzona.toLowerCase().includes(q)) return false
    if (af.uso      && z.uso !== af.uso) return false
    if (af.provincia && z.provincia !== af.provincia) return false
    if (af.occMin   && z.ocupacion < parseFloat(af.occMin)) return false
    if (af.occMax   && z.ocupacion > parseFloat(af.occMax)) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  const cell = (z) => ({
    zona:      <td key="zona"><div style={{fontWeight:600,color:'var(--text)',fontSize:12}}>{z.zona}</div><div className="asset-sub">{z.subzona}</div></td>,
    provincia: <td key="provincia" style={{fontSize:11,color:'var(--text3)'}}>{z.provincia}</td>,
    uso:       <td key="uso"><span className={`tag ${USO_TAG[z.uso]||'tag-gray'}`}>{z.uso}</span></td>,
    activos_n: <td key="activos_n"><div style={{fontSize:11,fontWeight:500}}>{z.activos_n}</div><div className="asset-sub" style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{z.activos.join(', ')}</div></td>,
    stock:     <td key="stock" style={{fontSize:12,fontWeight:600}}>{z.stock.toLocaleString()}</td>,
    disponible:<td key="disponible" style={{fontSize:12,fontWeight:600,color:'var(--amber)'}}>{z.disponible.toLocaleString()}</td>,
    ocupacion: <td key="ocupacion">
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <div style={{flex:1,height:5,background:'var(--border)',borderRadius:3,overflow:'hidden',maxWidth:50}}>
          <div style={{height:'100%',width:`${z.ocupacion}%`,background:z.ocupacion>=90?'var(--green)':z.ocupacion>=75?'var(--amber)':'var(--red)',borderRadius:3}}/>
        </div>
        <span style={{fontSize:11,fontWeight:600,color:z.ocupacion>=90?'var(--green)':z.ocupacion>=75?'var(--amber)':'var(--red)'}}>{z.ocupacion}%</span>
      </div>
    </td>,
    ofertas_activas:<td key="ofertas_activas" style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{z.ofertas_activas}</td>,
    takeup_ytd:<td key="takeup_ytd" style={{fontSize:12,fontWeight:600}}>{z.takeup_ytd.toLocaleString()} m²</td>,
    ops_ytd:   <td key="ops_ytd" style={{fontSize:11,fontWeight:600,color:'var(--purple)'}}>{z.ops_ytd}</td>,
    renta_media:<td key="renta_media" style={{fontSize:12,fontWeight:600}}>{z.renta_media} €/m²<div className="asset-sub">{z.renta_min}–{z.renta_max} rango</div></td>,
    _act:      <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-zona')}}>Ver</button></div></td>,
  })

  const visibleCols = COLS.filter(c => vis.has(c.id))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(6,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Stock total</div><div className="ks-val">{(totalStock/1000).toFixed(0)}k m²</div></div>
        <div className="ks"><div className="ks-lbl">Disponible</div><div className="ks-val amber">{fmt(totalDisp)} m²</div></div>
        <div className="ks"><div className="ks-lbl">Ocupación media</div><div className="ks-val green">{avgOcupacion}%</div></div>
        <div className="ks"><div className="ks-lbl">Ofertas activas</div><div className="ks-val" style={{color:'var(--accent)'}}>{totalOfertas}</div></div>
        <div className="ks"><div className="ks-lbl">Take-up YTD</div><div className="ks-val">{fmt(totalTakeup)} m²</div></div>
        <div className="ks"><div className="ks-lbl">Operaciones YTD</div><div className="ks-val">{totalOps}</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar zona, subzona..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          ⚙ Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge activeCount={activeCount} onClear={clearAll}/>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>
          <button className="tbtn">⬇ Exportar</button>
        </div>
      </div>

      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Uso"><select className="fsel" value={af.uso} onChange={e=>setAf(p=>({...p,uso:e.target.value}))}><option value="">Todos</option><option>Oficinas</option><option>Logístico</option><option>Retail</option></select></Field>
          <Field label="Provincia"><select className="fsel" value={af.provincia} onChange={e=>setAf(p=>({...p,provincia:e.target.value}))}><option value="">Todas</option><option>Madrid</option><option>Barcelona</option><option>Valencia</option></select></Field>
          <Field label="Ocupación mín %"><input className="fsel" type="number" placeholder="0" value={af.occMin} onChange={e=>setAf(p=>({...p,occMin:e.target.value}))}/></Field>
          <Field label="Ocupación máx %"><input className="fsel" type="number" placeholder="100" value={af.occMax} onChange={e=>setAf(p=>({...p,occMax:e.target.value}))}/></Field>
          {advCount>0&&<button onClick={()=>setAf({uso:'',provincia:'',occMin:'',occMax:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c =>
              c.sys ? <th key={c.id}>{c.label}</th> :
              <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={ZONAS}/>
            )}</tr>
          </thead>
          <tbody>
            {result.map(z=><tr key={z.id} onClick={()=>navigate('ficha-zona')}>{visibleCols.map(c=>cell(z)[c.id])}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:3}}>
      <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</span>
      {children}
    </div>
  )
}
