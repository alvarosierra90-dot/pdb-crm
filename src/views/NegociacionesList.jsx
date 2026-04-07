import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import { NEGOCIACIONES } from '../data/mockData'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

const estadoStyle = { 'En negociación': { cls:'tag-amber', label:'↔ En negociación' }, 'Pendiente respuesta': { bg:'#fce7f3', color:'#9d174d', bc:'#fbcfe8', label:'⏳ Pendiente respuesta' }, 'Acuerdo alcanzado': { cls:'tag-green', label:'✓ Acuerdo alcanzado' } }
function EstadoTag({ estado }) {
  const s = estadoStyle[estado] || { cls:'tag-gray', label:estado }
  if (s.cls) return <span className={`tag ${s.cls}`}>{s.label}</span>
  return <span className="tag" style={{ background:s.bg, color:s.color, borderColor:s.bc }}>{s.label}</span>
}
function cierreColor(e) { return e==='Acuerdo alcanzado'?'var(--green)':e==='Pendiente respuesta'?'var(--amber)':'var(--accent)' }

const COLS = [
  { id:'_chk',       label:'',                 sys:true },
  { id:'ref',        label:'ID',                required:true, type:'text', getValue:r=>r.ref },
  { id:'contraparte',label:'Contraparte',       required:true, type:'text', getValue:r=>r.contraparte },
  { id:'parte',      label:'Parte (Savills)',                  type:'enum', getValue:r=>r.parte },
  { id:'equipo',     label:'Equipo',                          type:'enum', getValue:r=>r.equipo },
  { id:'contacto',   label:'Contacto',                        type:'text', getValue:r=>r.contacto },
  { id:'activo',     label:'Activo',                          type:'text', getValue:r=>r.activo },
  { id:'espacio',    label:'Espacio',                         type:'text', getValue:r=>r.espacio },
  { id:'estado',     label:'Estado',                          type:'enum', getValue:r=>r.estado },
  { id:'envio',      label:'Envío link',                      type:'text', getValue:r=>r.envio },
  { id:'ultima_mod', label:'Últ. modificación',               type:'text', getValue:r=>r.ultima_mod },
  { id:'cierre',     label:'Cierre estimado',                 type:'text', getValue:r=>r.cierre },
  { id:'_act',       label:'',                 sys:true },
]

export default function NegociacionesList() {
  const { navigate } = useNav()
  const [query, setQuery] = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ estado:'', equipo:'', parte:'' })
  const [vis, setVis] = useVisibleCols('negociaciones', COLS)

  const advCount = Object.values(af).filter(Boolean).length
  const preFiltered = NEGOCIACIONES.filter(n => {
    const q = query.toLowerCase()
    if (q && !n.contraparte.toLowerCase().includes(q) && !n.ref.toLowerCase().includes(q) && !n.activo.toLowerCase().includes(q)) return false
    if (af.estado && n.estado !== af.estado) return false
    if (af.equipo && n.equipo !== af.equipo) return false
    if (af.parte  && n.parte !== af.parte) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  const cell = (n) => ({
    _chk:       <td key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}} onClick={e=>e.stopPropagation()}/></td>,
    ref:        <td key="ref"><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{n.ref}</span></td>,
    contraparte:<td key="contraparte"><div className="asset-link">{n.contraparte}</div><div className="asset-sub">{n.contacto}</div></td>,
    parte:      <td key="parte"><div style={{fontSize:11,fontWeight:600}}>{n.parte}</div><div className="asset-sub">{n.equipo}</div></td>,
    equipo:     <td key="equipo" style={{fontSize:11,color:'var(--text3)'}}>{n.equipo}</td>,
    contacto:   <td key="contacto" style={{fontSize:11}}>{n.contacto}</td>,
    activo:     <td key="activo"><div style={{fontSize:11,fontWeight:500}}>{n.activo}</div></td>,
    espacio:    <td key="espacio"><div className="asset-sub">{n.espacio}</div></td>,
    estado:     <td key="estado"><EstadoTag estado={n.estado}/></td>,
    envio:      <td key="envio" style={{fontSize:11,color:'var(--text3)'}}>{n.envio}</td>,
    ultima_mod: <td key="ultima_mod"><div style={{fontSize:11,fontWeight:500}}>{n.ultima_mod}</div><div className="asset-sub">{n.mod_desc}</div></td>,
    cierre:     <td key="cierre" style={{fontSize:11,fontWeight:600,color:cierreColor(n.estado)}}>{n.cierre}</td>,
    _act:       <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-negociacion')}}>Ver</button></div></td>,
  })

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <div className="ks" style={{padding:'12px 16px'}}><div className="ks-lbl">En curso</div><div className="ks-val">4</div></div>
        <div className="ks" style={{padding:'12px 16px'}}><div className="ks-lbl">Pendiente respuesta</div><div className="ks-val amber">2</div></div>
        <div className="ks" style={{padding:'12px 16px'}}><div className="ks-lbl">Acuerdo alcanzado</div><div className="ks-val green">1</div></div>
        <div className="ks" style={{padding:'12px 16px'}}><div className="ks-lbl">Cierre estimado</div><div className="ks-val" style={{color:'var(--accent)'}}>Abr 2026</div></div>
        <div className="ks" style={{padding:'12px 16px'}}><div className="ks-lbl">Renta potencial</div><div className="ks-val">2,02 M€</div></div>
      </div>
      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar negociaciones..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          ⚙ Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll}/>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim">+ Nueva negociación</button>
        </div>
      </div>
      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Estado"><select className="fsel" value={af.estado} onChange={e=>setAf(p=>({...p,estado:e.target.value}))}><option value="">Todos</option><option>En negociación</option><option>Pendiente respuesta</option><option>Acuerdo alcanzado</option></select></Field>
          <Field label="Equipo"><select className="fsel" value={af.equipo} onChange={e=>setAf(p=>({...p,equipo:e.target.value}))}><option value="">Todos</option><option>Transaction Spain</option><option>Leasing Oficinas MAD</option></select></Field>
          <Field label="Consultor"><select className="fsel" value={af.parte} onChange={e=>setAf(p=>({...p,parte:e.target.value}))}><option value="">Todos</option><option>Sierra Álvaro</option><option>Alonso Abruña D.</option></select></Field>
          {advCount>0&&<button onClick={()=>setAf({estado:'',equipo:'',parte:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}
      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c=>c.id==='_chk'?<th key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th>:c.sys?<th key={c.id}>{c.label}</th>:<ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={NEGOCIACIONES}/>)}</tr>
          </thead>
          <tbody>
            {result.map(n=><tr key={n.ref} onClick={()=>navigate('ficha-negociacion')}>{visibleCols.map(c=>cell(n)[c.id])}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function Field({label,children}){return <div style={{display:'flex',flexDirection:'column',gap:3}}><span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</span>{children}</div>}
