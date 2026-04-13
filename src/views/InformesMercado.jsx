import { useState } from 'react'
import { useNav } from '../context/NavigationContext'

const LINEAS_NEGOCIO = [
  { id:'oficinas',     label:'Oficinas',              icon:'🏢', color:'var(--accent)',  bg:'#eff6ff', bd:'#bfdbfe' },
  { id:'industrial',   label:'Industrial & Logística', icon:'🏭', color:'var(--amber)',   bg:'#fffbeb', bd:'#fde68a' },
  { id:'retail',       label:'Retail',                icon:'🛍', color:'var(--red)',     bg:'#fef2f2', bd:'#fca5a5' },
  { id:'residencial',  label:'Residencial',           icon:'🏠', color:'var(--purple)',  bg:'#faf5ff', bd:'#e9d5ff' },
  { id:'inversion',    label:'Inversión / Cap. Mkts', icon:'💰', color:'var(--green)',   bg:'#f0fdf4', bd:'#bbf7d0' },
  { id:'valoraciones', label:'Valoraciones',          icon:'📊', color:'var(--teal)',    bg:'#f0fdfa', bd:'#99f6e4' },
  { id:'pm',           label:'Property Management',   icon:'🔧', color:'var(--text3)',   bg:'#f9fafb', bd:'#e5e7eb' },
  { id:'projmgmt',     label:'Project Management',    icon:'📐', color:'var(--text2)',   bg:'#f9fafb', bd:'#e5e7eb' },
  { id:'workplace',    label:'Workplace Consulting',  icon:'💼', color:'var(--purple)',  bg:'#fdf4ff', bd:'#e9d5ff' },
  { id:'hoteles',      label:'Hoteles',               icon:'🏨', color:'#0891b2',        bg:'#ecfeff', bd:'#67e8f9' },
  { id:'cciales',      label:'Centros Comerciales',   icon:'🏬', color:'#c2410c',        bg:'#fff7ed', bd:'#fed7aa' },
  { id:'healthcare',   label:'Healthcare',            icon:'🏥', color:'#16a34a',        bg:'#f0fdf4', bd:'#bbf7d0' },
]

/* ── Datos mock por línea ── */
const DATA_LINEA = {
  oficinas: {
    takeup: [
      { area:'CBD', zona:'Gran Vía', subzona:'Recoletos', m2:12400 },
      { area:'CBD', zona:'Gran Vía', subzona:'Castellana Norte', m2:8200 },
      { area:'Descentralizado', zona:'M-30', subzona:'Julián Camarillo', m2:18600 },
      { area:'Descentralizado', zona:'A-1', subzona:'Alcobendas', m2:9800 },
      { area:'Periferia', zona:'A-2', subzona:'Coslada', m2:4200 },
    ],
    disponibilidad: [
      { area:'CBD', zona:'Gran Vía', subzona:'Recoletos', m2:3200, activos:4 },
      { area:'Descentralizado', zona:'M-30', subzona:'Julián Camarillo', m2:21000, activos:8 },
      { area:'Descentralizado', zona:'A-1', subzona:'Alcobendas', m2:13486, activos:3 },
    ],
    transacciones: [
      { area:'Descentralizado', zona:'A-1', subzona:'Alcobendas', arrendatario:'Oracle Spain SL', activo:'Albatros D', m2:13486, renta:14.5, fecha:'Q2 2026' },
      { area:'CBD', zona:'Gran Vía', subzona:'Recoletos', arrendatario:'BBVA', activo:'Torre Norte', m2:4200, renta:36.0, fecha:'Q1 2026' },
      { area:'Descentralizado', zona:'M-30', subzona:'Julián Camarillo', arrendatario:'Generali RE', activo:'P.E Avalon P5', m2:1500, renta:18.5, fecha:'Q1 2026' },
    ],
    top10_m2: [
      { arrendatario:'Oracle Spain SL', activo:'Albatros D', m2:13486, renta:14.5 },
      { arrendatario:'BBVA', activo:'Torre Norte', m2:4200, renta:36.0 },
      { arrendatario:'Repsol Exp.', activo:'Avalon P3-P2', m2:3167, renta:10.5 },
      { arrendatario:'Celonis', activo:'Avalon P4-P5', m2:2702, renta:12.0 },
      { arrendatario:'Generali RE', activo:'Avalon P5', m2:1500, renta:18.5 },
    ],
    top10_renta: [
      { arrendatario:'BBVA', activo:'Torre Norte', m2:4200, renta:36.0 },
      { arrendatario:'Generali RE', activo:'Avalon P5', m2:1500, renta:18.5 },
      { arrendatario:'Oracle Spain SL', activo:'Albatros D', m2:13486, renta:14.5 },
      { arrendatario:'Celonis', activo:'Avalon P4-P5', m2:2702, renta:12.0 },
      { arrendatario:'Repsol Exp.', activo:'Avalon P3-P2', m2:3167, renta:10.5 },
    ],
    sectores: [
      { sector:'Tecnología', m2:16188 },
      { sector:'Banca / Finanzas', m2:4200 },
      { sector:'Energía', m2:3167 },
      { sector:'Seguros', m2:1500 },
      { sector:'Consultoría', m2:2800 },
    ],
    top10_propietarios_m2: [
      { propietario:'Merlín Properties', m2:46956, renta:11.5 },
      { propietario:'Colonial SOCIMI', m2:18500, renta:28.0 },
      { propietario:'Barings Core Spain', m2:9967, renta:10.5 },
    ],
    top10_propietarios_renta: [
      { propietario:'Colonial SOCIMI', m2:18500, renta:28.0 },
      { propietario:'Merlín Properties', m2:46956, renta:11.5 },
      { propietario:'Barings Core Spain', m2:9967, renta:10.5 },
    ],
  },
}

const YEARS = ['2024','2025','2026']
const QUARTERS = ['Q1','Q2','Q3','Q4']
const PROVINCIAS = ['Madrid','Barcelona','Valencia','Sevilla']

function HierarchyTable({ data, cols, onRowClick }) {
  const [expanded, setExpanded] = useState({})
  const areas = [...new Set(data.map(r=>r.area))]

  return (
    <table className="dtbl" style={{width:'100%'}}>
      <thead>
        <tr>
          <th>Área / Zona / Subzona</th>
          {cols.map(c=><th key={c.key}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {areas.map(area=>{
          const areaRows = data.filter(r=>r.area===area)
          const zonas = [...new Set(areaRows.map(r=>r.zona))]
          const areaTotal = areaRows.reduce((s,r)=>s+(r.m2||0), 0)
          const isExpA = expanded[area]
          return [
            <tr key={area} onClick={()=>setExpanded(p=>({...p,[area]:!p[area]}))} style={{cursor:'pointer',background:'var(--gray-lt)'}}>
              <td style={{fontWeight:700,fontSize:11}}>
                <span style={{marginRight:6,fontSize:9}}>{isExpA?'▼':'▶'}</span>
                {area}
              </td>
              {cols.map(c=><td key={c.key} style={{fontWeight:700,fontSize:11,fontFamily:'var(--mono)'}}>{c.fmt ? c.fmt(areaTotal) : areaTotal.toLocaleString('es-ES')}</td>)}
            </tr>,
            ...(!isExpA ? [] : zonas.map(zona=>{
              const zonaRows = areaRows.filter(r=>r.zona===zona)
              const zonaTotal = zonaRows.reduce((s,r)=>s+(r.m2||0), 0)
              const isExpZ = expanded[`${area}_${zona}`]
              return [
                <tr key={`${area}_${zona}`} onClick={()=>setExpanded(p=>({...p,[`${area}_${zona}`]:!p[`${area}_${zona}`]}))} style={{cursor:'pointer',background:'var(--accent-lt)'}}>
                  <td style={{paddingLeft:20,fontWeight:600,fontSize:11}}>
                    <span style={{marginRight:6,fontSize:9}}>{isExpZ?'▼':'▶'}</span>
                    {zona}
                  </td>
                  {cols.map(c=><td key={c.key} style={{fontWeight:600,fontSize:11,fontFamily:'var(--mono)'}}>{c.fmt ? c.fmt(zonaTotal) : zonaTotal.toLocaleString('es-ES')}</td>)}
                </tr>,
                ...(!isExpZ ? [] : zonaRows.map(r=>(
                  <tr key={r.subzona} onClick={()=>onRowClick&&onRowClick(r)} style={{cursor:onRowClick?'pointer':'default'}}>
                    <td style={{paddingLeft:36,fontSize:11}}>↳ {r.subzona}</td>
                    {cols.map(c=><td key={c.key} style={{fontSize:11,fontFamily:'var(--mono)'}}>{c.fmt ? c.fmt(r[c.key]||0) : (r[c.key]||0).toLocaleString('es-ES')}</td>)}
                  </tr>
                )))
              ]
            }).flat())
          ]
        }).flat()}
      </tbody>
    </table>
  )
}

function InformeLinea({ linea, navigate }) {
  const [fYear,     setFYear]     = useState('2026')
  const [fQuarter,  setFQuarter]  = useState([])
  const [fProvincia,setFProvincia]= useState([])
  const d = DATA_LINEA[linea.id] || DATA_LINEA.oficinas

  const totalTakeup = d.takeup.reduce((s,r)=>s+r.m2, 0)
  const maxSector = Math.max(...d.sectores.map(s=>s.m2), 1)

  const filterSel = {fontSize:10,padding:'3px 8px',borderRadius:5,border:'1px solid var(--border)',background:'var(--surface)',fontFamily:'inherit',cursor:'pointer'}

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>

      {/* Header */}
      <div style={{padding:'10px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:'var(--r)',background:linea.bg,border:`1px solid ${linea.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{linea.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700}}>{linea.label} — Informe de Mercado</div>
          <div style={{fontSize:10,color:'var(--text3)'}}>Datos relacionales · Activos, Arrendatarios, Propietarios</div>
        </div>

        {/* Filtros globales */}
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Año</span>
          <select style={filterSel} value={fYear} onChange={e=>setFYear(e.target.value)}>
            {YEARS.map(y=><option key={y}>{y}</option>)}
          </select>
          <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Trimestre</span>
          <select style={filterSel} value={fQuarter[0]||''} onChange={e=>setFQuarter(e.target.value?[e.target.value]:[])}>
            <option value="">Todos</option>
            {QUARTERS.map(q=><option key={q}>{q}</option>)}
          </select>
          <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Provincia</span>
          <select style={filterSel} value={fProvincia[0]||''} onChange={e=>setFProvincia(e.target.value?[e.target.value]:[])}>
            <option value="">Todas</option>
            {PROVINCIAS.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'14px 16px',display:'flex',flexDirection:'column',gap:12}}>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[
            {lbl:'Take-up acumulado',val:`${(totalTakeup/1000).toFixed(0)}k m²`,color:linea.color},
            {lbl:'Transacciones',    val:d.transacciones.length,color:'var(--teal)'},
            {lbl:'Disponible total', val:`${(d.disponibilidad.reduce((s,r)=>s+r.m2,0)/1000).toFixed(0)}k m²`,color:'var(--amber)'},
            {lbl:'Renta prime',      val:`${Math.max(...d.top10_renta.map(r=>r.renta))} €/m²/mes`,color:'var(--green)'},
          ].map(k=>(
            <div key={k.lbl} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'10px 14px',textAlign:'center'}}>
              <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{k.lbl}</div>
              <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:k.color}}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* 1. Take-up */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>1. Take-up acumulado · {fYear}{fQuarter[0]?' '+fQuarter[0]:''}</div>
          <HierarchyTable data={d.takeup} cols={[{key:'m2',label:'m² Take-up',fmt:v=>v.toLocaleString('es-ES')+' m²'}]} onRowClick={()=>navigate('activos')}/>
        </div>

        {/* 2. Disponibilidad */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>2. Disponibilidad actual</div>
          <HierarchyTable data={d.disponibilidad} cols={[{key:'m2',label:'m² Disponible',fmt:v=>v.toLocaleString('es-ES')+' m²'},{key:'activos',label:'Nº activos'}]} onRowClick={()=>navigate('ofertas')}/>
        </div>

        {/* 3. Transacciones */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>3. Transacciones cerradas</div>
          <table className="dtbl">
            <thead><tr><th>Arrendatario</th><th>Activo</th><th>Zona</th><th>m²</th><th>Renta €/m²/mes</th><th>Período</th></tr></thead>
            <tbody>
              {d.transacciones.map((t,i)=>(
                <tr key={i} onClick={()=>navigate('ficha-arrendatario')} style={{cursor:'pointer'}}>
                  <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{t.arrendatario}</td>
                  <td style={{fontSize:11}}><span className="asset-link" onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>{t.activo}</span></td>
                  <td style={{fontSize:11}}>{t.zona} · {t.subzona}</td>
                  <td className="mono" style={{fontSize:11}}>{t.m2.toLocaleString('es-ES')}</td>
                  <td className="mono" style={{fontSize:11,fontWeight:700,color:'var(--teal)'}}>{t.renta}</td>
                  <td style={{fontSize:11,color:'var(--text3)'}}>{t.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4 & 5. Top 10 */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
            <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>4a. Top operaciones · Mayor superficie</div>
            <table className="dtbl">
              <thead><tr><th>#</th><th>Arrendatario</th><th>m²</th><th>€/m²/mes</th></tr></thead>
              <tbody>
                {d.top10_m2.map((r,i)=>(
                  <tr key={i} onClick={()=>navigate('ficha-arrendatario')} style={{cursor:'pointer'}}>
                    <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.arrendatario}</td>
                    <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                    <td className="mono" style={{fontSize:11,color:'var(--teal)',fontWeight:700}}>{r.renta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
            <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>4b. Top operaciones · Renta más alta</div>
            <table className="dtbl">
              <thead><tr><th>#</th><th>Arrendatario</th><th>€/m²/mes</th><th>m²</th></tr></thead>
              <tbody>
                {d.top10_renta.map((r,i)=>(
                  <tr key={i} onClick={()=>navigate('ficha-arrendatario')} style={{cursor:'pointer'}}>
                    <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.arrendatario}</td>
                    <td className="mono" style={{fontSize:11,fontWeight:800,color:'var(--teal)'}}>{r.renta}</td>
                    <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Sector de actividad */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>5. Sector de actividad con más contratación</div>
          <div style={{padding:'12px 14px'}}>
            {d.sectores.map((s,i)=>(
              <div key={s.sector} style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
                <div style={{width:16,fontSize:10,fontWeight:700,color:'var(--text4)',textAlign:'right',fontFamily:'var(--mono)',flexShrink:0}}>{i+1}</div>
                <div style={{width:120,fontSize:10,color:'var(--text2)',flexShrink:0}}>{s.sector}</div>
                <div style={{flex:1,height:7,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.round(s.m2/maxSector*100)}%`,background:linea.color,borderRadius:4}}/>
                </div>
                <div style={{width:70,fontSize:10,fontWeight:700,fontFamily:'var(--mono)',textAlign:'right',flexShrink:0}}>{s.m2.toLocaleString('es-ES')} m²</div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Top propietarios */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
            <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>6a. Top propietarios · Superficie absorbida</div>
            <table className="dtbl">
              <thead><tr><th>#</th><th>Propietario</th><th>m²</th><th>Renta media</th></tr></thead>
              <tbody>
                {d.top10_propietarios_m2.map((r,i)=>(
                  <tr key={i} onClick={()=>navigate('portfolio')} style={{cursor:'pointer'}}>
                    <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.propietario}</td>
                    <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                    <td className="mono" style={{fontSize:11,color:'var(--teal)'}}>{r.renta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
            <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>6b. Top propietarios · Renta más alta</div>
            <table className="dtbl">
              <thead><tr><th>#</th><th>Propietario</th><th>Renta max.</th><th>m²</th></tr></thead>
              <tbody>
                {d.top10_propietarios_renta.map((r,i)=>(
                  <tr key={i} onClick={()=>navigate('portfolio')} style={{cursor:'pointer'}}>
                    <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.propietario}</td>
                    <td className="mono" style={{fontSize:11,fontWeight:800,color:'var(--teal)'}}>{r.renta}</td>
                    <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function InformesMercado() {
  const { navigate } = useNav()
  const [linea, setLinea] = useState(null)

  if (linea) {
    return (
      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
        <div style={{padding:'6px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <button onClick={()=>setLinea(null)} style={{fontSize:11,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:600,padding:0}}>
            ← Informes de Mercado
          </button>
        </div>
        <InformeLinea linea={linea} navigate={navigate}/>
      </div>
    )
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div style={{padding:'10px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{fontSize:14,fontWeight:700}}>📈 Informes de Mercado</div>
        <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>Selecciona una línea de negocio para ver el informe de mercado</div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,maxWidth:960}}>
          {LINEAS_NEGOCIO.map(l=>(
            <div key={l.id} onClick={()=>setLinea(l)}
              style={{background:l.bg,border:`1px solid ${l.bd}`,borderRadius:'var(--r2)',padding:'18px 16px',cursor:'pointer',transition:'box-shadow .15s, transform .15s',textAlign:'center'}}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 4px 16px ${l.color}33`;e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none'}}>
              <div style={{fontSize:30,marginBottom:10}}>{l.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:l.color}}>{l.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
