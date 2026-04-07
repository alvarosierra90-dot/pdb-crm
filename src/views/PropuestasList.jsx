import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

export const PROPUESTAS = [
  { id:'PRY-2501', nombre:'Pitch BBVA Torre Norte', tipo:'Pitch', linea:'Capital Markets', empresa:'BBVA SA', activo:'Torre Norte Castellana', demanda:'—', oferta:'—', creado_por:'Sierra Alvaro', fecha_mod:'07/04/2026', estado:'Activo', fees:'320.000 €', fecha_cierre:'30/06/2026' },
  { id:'PRY-2502', nombre:'Valoración portfolio logístico Getafe', tipo:'Valoración', linea:'Industrial/Logística', empresa:'Merlín Properties SOCIMI', activo:'Park Logístico Getafe', demanda:'—', oferta:'OF-0041', creado_por:'GOMEZ Ignacio', fecha_mod:'05/04/2026', estado:'Activo', fees:'85.000 €', fecha_cierre:'15/05/2026' },
  { id:'PRY-2503', nombre:'Propuesta de servicios Telefónica HQ', tipo:'Propuesta de servicios', linea:'Oficinas', empresa:'Telefónica SA', activo:'Distrito Telefónica', demanda:'DEM-0078', oferta:'—', creado_por:'García Marta', fecha_mod:'01/04/2026', estado:'Standby', fees:'210.000 €', fecha_cierre:'31/07/2026' },
  { id:'PRY-2504', nombre:'Mandato comercial P.E Avalon', tipo:'Mandato comercial', linea:'Oficinas', empresa:'Merlín Properties SOCIMI', activo:'P.E Avalon', demanda:'—', oferta:'OF-0038', creado_por:'Sierra Alvaro', fecha_mod:'28/03/2026', estado:'Adjudicado', fees:'650.000 €', fecha_cierre:'31/03/2026' },
  { id:'PRY-2505', nombre:'Urbanismo Residencial Valdebebas', tipo:'Urbanismo', linea:'Residencial', empresa:'Neinor Homes SA', activo:'—', demanda:'—', oferta:'—', creado_por:'GOMEZ Ignacio', fecha_mod:'20/03/2026', estado:'Activo', fees:'140.000 €', fecha_cierre:'30/09/2026' },
  { id:'PRY-2506', nombre:'Workplace Repsol oficinas centrales', tipo:'Proyecto de arquitectura / workplace', linea:'Oficinas', empresa:'Repsol SA', activo:'Repsol Campus Méndez Álvaro', demanda:'—', oferta:'—', creado_por:'García Marta', fecha_mod:'15/03/2026', estado:'Cancelado', fees:'95.000 €', fecha_cierre:'—' },
  { id:'PRY-2507', nombre:'Pitch venta Torre Europa Valencia', tipo:'Pitch', linea:'Capital Markets', empresa:'FREO Investments Spain SL', activo:'Torre Europa Valencia', demanda:'—', oferta:'OF-0044', creado_por:'Sierra Alvaro', fecha_mod:'10/03/2026', estado:'Activo', fees:'480.000 €', fecha_cierre:'31/08/2026' },
  { id:'PRY-2508', nombre:'Propuesta servicios Centro Comercial Parquesur', tipo:'Propuesta de servicios', linea:'Retail', empresa:'Inversiones Familiar Velada', activo:'Centro Comercial Parquesur', demanda:'—', oferta:'—', creado_por:'GOMEZ Ignacio', fecha_mod:'05/03/2026', estado:'Standby', fees:'175.000 €', fecha_cierre:'30/06/2026' },
  { id:'PRY-2509', nombre:'Valoración Edificio Diagonal 95 Barcelona', tipo:'Valoración', linea:'Oficinas', empresa:'FREO Investments Spain SL', activo:'Edificio Diagonal 95', demanda:'—', oferta:'—', creado_por:'García Marta', fecha_mod:'01/03/2026', estado:'Adjudicado', fees:'60.000 €', fecha_cierre:'28/02/2026' },
  { id:'PRY-2510', nombre:'Mandato búsqueda Oracle Spain expansión', tipo:'Mandato comercial', linea:'Oficinas', empresa:'Oracle Spain SL', activo:'—', demanda:'DEM-0091', oferta:'—', creado_por:'Sierra Alvaro', fecha_mod:'25/02/2026', estado:'Activo', fees:'390.000 €', fecha_cierre:'31/10/2026' },
]

const TIPO_TAG = {
  'Pitch':'tag-blue',
  'Valoración':'tag-teal',
  'Propuesta de servicios':'tag-purple',
  'Mandato comercial':'tag-amber',
  'Urbanismo':'tag-gray',
  'Proyecto de arquitectura / workplace':'tag-gray',
}

const ESTADO_TAG = {
  'Activo':'tag-green',
  'Standby':'tag-amber',
  'Cancelado':'tag-red',
  'Adjudicado':'tag-blue',
}

const COLS = [
  { id:'_chk',         label:'',                   sys:true },
  { id:'id',           label:'ID',                 required:true, type:'text',   getValue:r=>r.id },
  { id:'nombre',       label:'Nombre del proyecto', required:true, type:'text',   getValue:r=>r.nombre },
  { id:'tipo',         label:'Tipo de proyecto',                  type:'enum',   getValue:r=>r.tipo },
  { id:'linea',        label:'Línea de negocio',                  type:'enum',   getValue:r=>r.linea },
  { id:'empresa',      label:'Empresa',                           type:'text',   getValue:r=>r.empresa },
  { id:'activo',       label:'Activo',                            type:'text',   getValue:r=>r.activo },
  { id:'demanda',      label:'Demanda',                           type:'text',   getValue:r=>r.demanda },
  { id:'oferta',       label:'Oferta',                            type:'text',   getValue:r=>r.oferta },
  { id:'creado_por',   label:'Creado por',                        type:'enum',   getValue:r=>r.creado_por },
  { id:'fecha_mod',    label:'Últ. modificación',                 type:'text',   getValue:r=>r.fecha_mod },
  { id:'estado',       label:'Estado',                            type:'enum',   getValue:r=>r.estado },
  { id:'fees',         label:'Fees potenciales',                  type:'text',   getValue:r=>r.fees },
  { id:'fecha_cierre', label:'F. estimada cierre',                type:'text',   getValue:r=>r.fecha_cierre },
  { id:'_act',         label:'',                   sys:true },
]

const DEFAULT_VIS = new Set(['_chk','id','nombre','tipo','linea','empresa','activo','creado_por','estado','fees','fecha_cierre','_act'])

export default function PropuestasList() {
  const { navigate } = useNav()
  const [query,   setQuery]   = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ tipo:'', linea:'', estado:'', creado_por:'' })
  const [vis, setVis] = useVisibleCols('propuestas', COLS, DEFAULT_VIS)

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = PROPUESTAS.filter(p => {
    const q = query.toLowerCase()
    if (q && !p.nombre.toLowerCase().includes(q) && !p.empresa.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false
    if (af.tipo       && p.tipo !== af.tipo) return false
    if (af.linea      && p.linea !== af.linea) return false
    if (af.estado     && p.estado !== af.estado) return false
    if (af.creado_por && p.creado_por !== af.creado_por) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  // KPIs
  const total       = PROPUESTAS.length
  const activos     = PROPUESTAS.filter(p=>p.estado==='Activo').length
  const adjudicados = PROPUESTAS.filter(p=>p.estado==='Adjudicado').length
  const winRate     = Math.round((adjudicados / (adjudicados + PROPUESTAS.filter(p=>p.estado==='Cancelado').length)) * 100)
  const feesTotal   = PROPUESTAS
    .filter(p=>p.estado==='Activo'||p.estado==='Adjudicado')
    .reduce((s,p)=>{ const n=parseFloat(p.fees.replace(/[^0-9]/g,'')); return isNaN(n)?s:s+n },0)

  const cell = (p) => ({
    _chk:         <td key="_chk"><input type="checkbox" onClick={e=>e.stopPropagation()} style={{accentColor:'var(--accent)'}}/></td>,
    id:           <td key="id"><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{p.id}</span></td>,
    nombre:       <td key="nombre"><div className="asset-link" style={{fontWeight:600,maxWidth:260}}>{p.nombre}</div></td>,
    tipo:         <td key="tipo"><span className={`tag ${TIPO_TAG[p.tipo]||'tag-gray'}`} style={{fontSize:9,whiteSpace:'nowrap'}}>{p.tipo}</span></td>,
    linea:        <td key="linea" style={{fontSize:11,color:'var(--text2)',whiteSpace:'nowrap'}}>{p.linea}</td>,
    empresa:      <td key="empresa"><div style={{fontSize:12,fontWeight:600,color:'var(--accent)',cursor:'pointer'}}>{p.empresa}</div></td>,
    activo:       <td key="activo" style={{fontSize:11}}>{p.activo!=='—'?<span className="asset-link" style={{fontSize:11}} onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>{p.activo}</span>:<span style={{color:'var(--text4)'}}>—</span>}</td>,
    demanda:      <td key="demanda" style={{fontSize:11}}>{p.demanda!=='—'?<span className="asset-link" style={{fontSize:11}} onClick={e=>{e.stopPropagation();navigate('ficha-demanda')}}>{p.demanda}</span>:<span style={{color:'var(--text4)'}}>—</span>}</td>,
    oferta:       <td key="oferta" style={{fontSize:11}}>{p.oferta!=='—'?<span className="asset-link" style={{fontSize:11}} onClick={e=>{e.stopPropagation();navigate('ficha-oferta')}}>{p.oferta}</span>:<span style={{color:'var(--text4)'}}>—</span>}</td>,
    creado_por:   <td key="creado_por" style={{fontSize:11}}>{p.creado_por}</td>,
    fecha_mod:    <td key="fecha_mod" style={{fontSize:11,color:'var(--text3)'}}>{p.fecha_mod}</td>,
    estado:       <td key="estado"><span className={`tag ${ESTADO_TAG[p.estado]||'tag-gray'}`}>{p.estado}</span></td>,
    fees:         <td key="fees"><span style={{fontFamily:'var(--mono)',fontSize:12,fontWeight:700,color:p.estado==='Adjudicado'?'var(--green)':p.estado==='Cancelado'?'var(--text4)':'var(--text1)'}}>{p.fees}</span></td>,
    fecha_cierre: <td key="fecha_cierre" style={{fontSize:11,color:p.estado==='Cancelado'?'var(--text4)':'var(--text2)'}}>{p.fecha_cierre}</td>,
    _act:         <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-propuesta')}}>Ver</button></div></td>,
  })

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Total proyectos</div><div className="ks-val">{total}</div></div>
        <div className="ks"><div className="ks-lbl">En curso</div><div className="ks-val" style={{color:'var(--green)'}}>{activos}</div></div>
        <div className="ks"><div className="ks-lbl">Adjudicados</div><div className="ks-val" style={{color:'var(--accent)'}}>{adjudicados}</div></div>
        <div className="ks"><div className="ks-lbl">Win rate</div><div className="ks-val" style={{color:'var(--purple)'}}>{winRate}%</div></div>
        <div className="ks"><div className="ks-lbl">Pipeline fees</div><div className="ks-val green">{(feesTotal/1000).toFixed(0)}k €</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar proyecto, empresa, ID..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          ⚙ Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll}/>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim" onClick={()=>navigate('ficha-propuesta')}>+ Nueva propuesta</button>
        </div>
      </div>

      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Tipo de proyecto">
            <select className="fsel" value={af.tipo} onChange={e=>setAf(p=>({...p,tipo:e.target.value}))}>
              <option value="">Todos</option>
              <option>Pitch</option><option>Valoración</option><option>Propuesta de servicios</option>
              <option>Mandato comercial</option><option>Urbanismo</option><option>Proyecto de arquitectura / workplace</option>
            </select>
          </Field>
          <Field label="Línea de negocio">
            <select className="fsel" value={af.linea} onChange={e=>setAf(p=>({...p,linea:e.target.value}))}>
              <option value="">Todas</option>
              <option>Oficinas</option><option>Capital Markets</option><option>Retail</option>
              <option>Industrial/Logística</option><option>Residencial</option>
            </select>
          </Field>
          <Field label="Estado">
            <select className="fsel" value={af.estado} onChange={e=>setAf(p=>({...p,estado:e.target.value}))}>
              <option value="">Todos</option>
              <option>Activo</option><option>Standby</option><option>Cancelado</option><option>Adjudicado</option>
            </select>
          </Field>
          <Field label="Creado por">
            <select className="fsel" value={af.creado_por} onChange={e=>setAf(p=>({...p,creado_por:e.target.value}))}>
              <option value="">Todos</option>
              <option>Sierra Alvaro</option><option>GOMEZ Ignacio</option><option>García Marta</option>
            </select>
          </Field>
          {advCount>0&&<button onClick={()=>setAf({tipo:'',linea:'',estado:'',creado_por:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      {/* Pipeline visual */}
      <div style={{padding:'8px 16px',borderBottom:'1px solid var(--border)',display:'flex',gap:6,alignItems:'center'}}>
        <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginRight:4}}>Pipeline</span>
        {[
          {label:'Pitch',color:'var(--accent)',n:PROPUESTAS.filter(p=>p.tipo==='Pitch').length},
          {label:'Valoración',color:'var(--teal)',n:PROPUESTAS.filter(p=>p.tipo==='Valoración').length},
          {label:'Propuesta servicios',color:'var(--purple)',n:PROPUESTAS.filter(p=>p.tipo==='Propuesta de servicios').length},
          {label:'Mandato comercial',color:'var(--amber)',n:PROPUESTAS.filter(p=>p.tipo==='Mandato comercial').length},
          {label:'Otros',color:'var(--text4)',n:PROPUESTAS.filter(p=>['Urbanismo','Proyecto de arquitectura / workplace'].includes(p.tipo)).length},
        ].map(s=>(
          <div key={s.label} style={{display:'flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:12,background:s.color+'18',border:`1px solid ${s.color}33`,fontSize:10}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:s.color,display:'inline-block'}}/>
            <span style={{color:s.color,fontWeight:700}}>{s.n}</span>
            <span style={{color:'var(--text3)'}}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c=>
              c.id==='_chk'?<th key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th>:
              c.sys?<th key={c.id}>{c.label}</th>:
              <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={PROPUESTAS}/>
            )}</tr>
          </thead>
          <tbody>
            {result.map(p=>(
              <tr key={p.id} onClick={()=>navigate('ficha-propuesta')} style={{cursor:'pointer'}}>
                {visibleCols.map(c=>cell(p)[c.id])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({label,children}){
  return <div style={{display:'flex',flexDirection:'column',gap:3}}><span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</span>{children}</div>
}
