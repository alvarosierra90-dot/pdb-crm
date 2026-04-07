import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

const USUARIOS = [
  { id:'USR-001', nombre:'Sierra Alvaro', iniciales:'AS', equipo:'Leasing Oficinas MAD', linea:'Leasing', rol:'Senior Consultant', actividades:9, demandas:7, ofertas:4, proyectos:3, ops_cerradas:5, m2_gestionados:48750, honorarios:'3,2 M€', ultimo_act:'06/04/2026', color:'var(--accent)', bg:'var(--accent-lt)' },
  { id:'USR-002', nombre:'GOMEZ Ignacio', iniciales:'IG', equipo:'Leasing Oficinas MAD', linea:'Leasing', rol:'Consultant', actividades:1, demandas:6, ofertas:2, proyectos:2, ops_cerradas:3, m2_gestionados:31200, honorarios:'1,8 M€', ultimo_act:'29/09/2025', color:'var(--teal)', bg:'var(--teal-lt)' },
  { id:'USR-003', nombre:'Consultor MAD', iniciales:'CM', equipo:'Leasing Oficinas MAD', linea:'Leasing', rol:'Junior Consultant', actividades:4, demandas:2, ofertas:1, proyectos:1, ops_cerradas:1, m2_gestionados:8500, honorarios:'420 k€', ultimo_act:'10/10/2025', color:'var(--purple)', bg:'var(--purple-lt)' },
  { id:'USR-004', nombre:'Alonso Abruña D.', iniciales:'AA', equipo:'Leasing Oficinas MAD', linea:'Leasing', rol:'Consultant', actividades:2, demandas:1, ofertas:1, proyectos:1, ops_cerradas:1, m2_gestionados:6200, honorarios:'310 k€', ultimo_act:'26/03/2026', color:'var(--amber)', bg:'var(--amber-lt)' },
]

const totActs = USUARIOS.reduce((s,u)=>s+u.actividades,0)
const totDems = USUARIOS.reduce((s,u)=>s+u.demandas,0)
const totOfrs = USUARIOS.reduce((s,u)=>s+u.ofertas,0)
const totOps  = USUARIOS.reduce((s,u)=>s+u.ops_cerradas,0)
const totM2   = USUARIOS.reduce((s,u)=>s+u.m2_gestionados,0)

const COLS = [
  { id: 'nombre',         label: 'Usuario',          required: true, type:'text',   getValue: r => r.nombre },
  { id: 'equipo',         label: 'Equipo · Línea',                   type:'text',   getValue: r => r.equipo },
  { id: 'rol',            label: 'Rol',                              type:'enum',   getValue: r => r.rol },
  { id: 'actividades',    label: 'Actividades',                      type:'number', getValue: r => r.actividades },
  { id: 'demandas',       label: 'Demandas',                         type:'number', getValue: r => r.demandas },
  { id: 'ofertas',        label: 'Ofertas',                          type:'number', getValue: r => r.ofertas },
  { id: 'proyectos',      label: 'Proyectos',                        type:'number', getValue: r => r.proyectos },
  { id: 'ops_cerradas',   label: 'Ops cerradas',                     type:'number', getValue: r => r.ops_cerradas },
  { id: 'm2_gestionados', label: 'M² gestionados',                   type:'number', getValue: r => r.m2_gestionados },
  { id: 'honorarios',     label: 'Honorarios',                       type:'text',   getValue: r => r.honorarios },
  { id: 'ultimo_act',     label: 'Última act.',                      type:'text',   getValue: r => r.ultimo_act },
  { id: '_act',           label: '',                 sys: true },
]

export default function UsuariosList() {
  const { navigate } = useNav()
  const [query,   setQuery]   = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ linea: '', equipo: '', rol: '' })
  const [vis, setVis] = useVisibleCols('usuarios', COLS)

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = USUARIOS.filter(u => {
    const q = query.toLowerCase()
    if (q && !u.nombre.toLowerCase().includes(q) && !u.equipo.toLowerCase().includes(q)) return false
    if (af.linea && u.linea !== af.linea) return false
    if (af.equipo && u.equipo !== af.equipo) return false
    if (af.rol   && u.rol !== af.rol) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  const cell = (u) => ({
    nombre:        <td key="nombre">
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:u.bg,border:`1px solid ${u.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:u.color,flexShrink:0}}>{u.iniciales}</div>
        <div><div className="asset-link">{u.nombre}</div><div className="asset-sub">{u.rol}</div></div>
      </div>
    </td>,
    equipo:        <td key="equipo"><div style={{fontSize:11,fontWeight:500,color:'var(--text2)'}}>{u.equipo}</div><div className="asset-sub">{u.linea}</div></td>,
    rol:           <td key="rol" style={{fontSize:11}}>{u.rol}</td>,
    actividades:   <td key="actividades" style={{fontSize:12,fontWeight:600,color:'var(--accent)'}}>{u.actividades}</td>,
    demandas:      <td key="demandas" style={{fontSize:12,fontWeight:600}}>{u.demandas}</td>,
    ofertas:       <td key="ofertas" style={{fontSize:12,fontWeight:600,color:'var(--green)'}}>{u.ofertas}</td>,
    proyectos:     <td key="proyectos" style={{fontSize:12,fontWeight:600,color:'var(--teal)'}}>{u.proyectos}</td>,
    ops_cerradas:  <td key="ops_cerradas" style={{fontSize:12,fontWeight:600,color:'var(--purple)'}}>{u.ops_cerradas}</td>,
    m2_gestionados:<td key="m2_gestionados" style={{fontSize:12,fontWeight:600}}>{u.m2_gestionados.toLocaleString()} m²</td>,
    honorarios:    <td key="honorarios" style={{fontSize:12,fontWeight:700,color:'var(--green)'}}>{u.honorarios}</td>,
    ultimo_act:    <td key="ultimo_act" style={{fontSize:11,color:'var(--text3)'}}>{u.ultimo_act}</td>,
    _act:          <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-usuario')}}>Ver</button></div></td>,
  })

  const visibleCols = COLS.filter(c => vis.has(c.id))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Actividades totales</div><div className="ks-val" style={{color:'var(--accent)'}}>{totActs}</div></div>
        <div className="ks"><div className="ks-lbl">Demandas gestionadas</div><div className="ks-val">{totDems}</div></div>
        <div className="ks"><div className="ks-lbl">Ofertas activas</div><div className="ks-val green">{totOfrs}</div></div>
        <div className="ks"><div className="ks-lbl">Operaciones cerradas</div><div className="ks-val" style={{color:'var(--purple)'}}>{totOps}</div></div>
        <div className="ks"><div className="ks-lbl">M² gestionados</div><div className="ks-val">{(totM2/1000).toFixed(0)}k</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar usuario o equipo..." value={query} onChange={e=>setQuery(e.target.value)}/>
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
          <Field label="Línea"><select className="fsel" value={af.linea} onChange={e=>setAf(p=>({...p,linea:e.target.value}))}><option value="">Todas</option><option>Leasing</option><option>Capital Markets</option><option>Valoraciones</option></select></Field>
          <Field label="Equipo"><select className="fsel" value={af.equipo} onChange={e=>setAf(p=>({...p,equipo:e.target.value}))}><option value="">Todos</option><option>Leasing Oficinas MAD</option><option>Leasing Industrial MAD</option><option>Capital Markets MAD</option></select></Field>
          <Field label="Rol"><select className="fsel" value={af.rol} onChange={e=>setAf(p=>({...p,rol:e.target.value}))}><option value="">Todos</option><option>Senior Consultant</option><option>Consultant</option><option>Junior Consultant</option></select></Field>
          {advCount>0&&<button onClick={()=>setAf({linea:'',equipo:'',rol:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c =>
              c.sys ? <th key={c.id}>{c.label}</th> :
              <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={USUARIOS}/>
            )}</tr>
          </thead>
          <tbody>
            {result.map(u=><tr key={u.id} onClick={()=>navigate('ficha-usuario')}>{visibleCols.map(c=>cell(u)[c.id])}</tr>)}
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
