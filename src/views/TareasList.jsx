import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

const TARS = [
  {id:'TAR-001',as:'Llamar a propietario — Activo Avalon',tipo:'Gestión de producto',resp:'Sierra Alvaro',asig:'Manager',team:'Leasing Oficinas MAD',rT:'Activo',ref:'P.E Avalon',est:'En curso',prio:'Alta',ini:'01/04/2026',lim:'07/04/2026',upd:'05/04/2026'},
  {id:'TAR-002',as:'Presentar dossier — Pharma Group',tipo:'Acción comercial',resp:'Consultor MAD',asig:'Sierra Alvaro',team:'Leasing Oficinas MAD',rT:'Demanda',ref:'Pharma Group Spain',est:'Pendiente',prio:'Media',ini:'03/04/2026',lim:'10/04/2026',upd:'03/04/2026'},
  {id:'TAR-003',as:'Plan comercial — Zona Centro Q2 2026',tipo:'Estrategia',resp:'Sierra Alvaro',asig:'Director',team:'Leasing Oficinas MAD',rT:'Interno',ref:'Equipo Leasing MAD',est:'Finalizada',prio:'Alta',ini:'01/03/2026',lim:'31/03/2026',upd:'31/03/2026'},
  {id:'TAR-004',as:'Actualizar datos — Albatros Edif. D',tipo:'Gestión de producto',resp:'Consultor MAD',asig:'Sierra Alvaro',team:'Leasing Oficinas MAD',rT:'Activo',ref:'Albatros Edif. D',est:'En curso',prio:'Media',ini:'28/03/2026',lim:'04/04/2026',upd:'02/04/2026'},
  {id:'TAR-005',as:'Seguimiento NEG-0044 · Empresa XYZ',tipo:'Seguimiento',resp:'Sierra Alvaro',asig:'Sierra Alvaro',team:'Leasing Oficinas MAD',rT:'Negociación',ref:'Empresa XYZ — Avalon P5',est:'En curso',prio:'Alta',ini:'15/03/2026',lim:'30/03/2026',upd:'06/04/2026'},
  {id:'TAR-006',as:'Enviar propuesta Oracle — Albatros',tipo:'Acción comercial',resp:'Sierra Alvaro',asig:'Manager',team:'Leasing Oficinas MAD',rT:'Demanda',ref:'Oracle Spain SL',est:'Finalizada',prio:'Alta',ini:'10/03/2026',lim:'15/03/2026',upd:'12/03/2026'},
]

const TIPO_TAG = { 'Gestión de producto':'tag-teal', 'Acción comercial':'tag-blue', Estrategia:'tag-purple', Seguimiento:'tag-amber' }
const REF_TAG  = { Activo:'tag-teal', Demanda:'tag-blue', 'Negociación':'tag-purple', Interno:'tag-gray', Cuenta:'tag-gray' }
const EST_TAG  = { Pendiente:'tag-amber', 'En curso':'tag-blue', Finalizada:'tag-green' }

function PrioBadge({ prio }) {
  if (prio === 'Alta')  return <span style={{background:'var(--red-lt)',color:'var(--red)',border:'1px solid var(--red-bd)',padding:'1px 7px',borderRadius:9,fontSize:10,fontWeight:600}}>⬆ Alta</span>
  if (prio === 'Media') return <span style={{background:'var(--amber-lt)',color:'var(--amber)',border:'1px solid var(--amber-bd)',padding:'1px 7px',borderRadius:9,fontSize:10,fontWeight:600}}>→ Media</span>
  return <span style={{background:'var(--gray-lt)',color:'var(--text3)',border:'1px solid var(--gray-bd)',padding:'1px 7px',borderRadius:9,fontSize:10,fontWeight:600}}>⬇ Baja</span>
}

function avatarIni(s){ return (s||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() }

const COLS = [
  { id: '_chk',  label: '',              sys: true },
  { id: 'id',    label: 'ID',            required: true, type:'text',   getValue: r => r.id },
  { id: 'as',    label: 'Asunto',        required: true, type:'text',   getValue: r => r.as },
  { id: 'tipo',  label: 'Tipo',                          type:'enum',   getValue: r => r.tipo },
  { id: 'resp',  label: 'Responsable',                   type:'text',   getValue: r => r.resp },
  { id: 'asig',  label: 'Asignado por',                  type:'text',   getValue: r => r.asig },
  { id: 'team',  label: 'Equipo',                        type:'text',   getValue: r => r.team },
  { id: 'rT',    label: 'Referente a',                   type:'enum',   getValue: r => r.rT },
  { id: 'est',   label: 'Estado',                        type:'enum',   getValue: r => r.est },
  { id: 'prio',  label: 'Prioridad',                     type:'enum',   getValue: r => r.prio },
  { id: 'ini',   label: 'Fecha inicio',                  type:'text',   getValue: r => r.ini },
  { id: 'lim',   label: 'Fecha límite',                  type:'text',   getValue: r => r.lim },
  { id: 'upd',   label: 'Última act.',                   type:'text',   getValue: r => r.upd },
  { id: '_act',  label: '',              sys: true },
]

export default function TareasList() {
  const { navigate } = useNav()
  const [query,   setQuery]   = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ tipo: '', est: '', prio: '', resp: '' })
  const [vis, setVis] = useVisibleCols('tareas', COLS)

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = TARS.filter(t => {
    const q = query.toLowerCase()
    if (q && !t.as.toLowerCase().includes(q) && !t.ref.toLowerCase().includes(q) && !t.resp.toLowerCase().includes(q)) return false
    if (af.tipo && t.tipo !== af.tipo) return false
    if (af.est  && t.est  !== af.est)  return false
    if (af.prio && t.prio !== af.prio) return false
    if (af.resp && t.resp !== af.resp) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  const total       = TARS.length
  const pendientes  = TARS.filter(t=>t.est==='Pendiente').length
  const enCurso     = TARS.filter(t=>t.est==='En curso').length
  const finalizadas = TARS.filter(t=>t.est==='Finalizada').length
  const prioAlta    = TARS.filter(t=>t.prio==='Alta').length

  const cell = (t) => ({
    _chk: <td key="_chk"><input type="checkbox" onClick={e=>e.stopPropagation()} style={{accentColor:'var(--accent)'}}/></td>,
    id:   <td key="id"><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{t.id}</span></td>,
    as:   <td key="as" style={{fontSize:11,fontWeight:500,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.as}</td>,
    tipo: <td key="tipo"><span className={`tag ${TIPO_TAG[t.tipo]||'tag-gray'}`} style={{fontSize:9}}>{t.tipo}</span></td>,
    resp: <td key="resp">
      <div style={{display:'flex',alignItems:'center',gap:5}}>
        <div style={{width:20,height:20,borderRadius:'50%',background:'var(--accent-lt)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,flexShrink:0}}>{avatarIni(t.resp)}</div>
        <span style={{fontSize:11}}>{t.resp}</span>
      </div>
    </td>,
    asig: <td key="asig" style={{fontSize:11,color:'var(--text3)'}}>{t.asig}</td>,
    team: <td key="team" style={{fontSize:11,color:'var(--text3)'}}>{t.team}</td>,
    rT:   <td key="rT">
      <div style={{display:'flex',flexDirection:'column',gap:2}}>
        <span className={`tag ${REF_TAG[t.rT]||'tag-gray'}`} style={{fontSize:9}}>{t.rT}</span>
        <span style={{fontSize:11,color:'var(--text2)'}}>{t.ref}</span>
      </div>
    </td>,
    est:  <td key="est"><span className={`tag ${EST_TAG[t.est]||'tag-gray'}`}>{t.est}</span></td>,
    prio: <td key="prio"><PrioBadge prio={t.prio}/></td>,
    ini:  <td key="ini" style={{fontSize:11}}>{t.ini}</td>,
    lim:  <td key="lim" style={{fontSize:11,fontWeight:600}}>{t.lim}</td>,
    upd:  <td key="upd" style={{fontSize:11,color:'var(--text3)'}}>{t.upd}</td>,
    _act: <td key="_act">
      <div style={{display:'flex',gap:3}}>
        <button className="tbtn" style={{fontSize:10,padding:'3px 8px'}} onClick={e=>{e.stopPropagation();navigate('ficha-tarea')}}>Ver</button>
        <button className="tbtn" style={{fontSize:10,padding:'3px 6px'}} onClick={e=>e.stopPropagation()}>✅</button>
      </div>
    </td>,
  })

  const visibleCols = COLS.filter(c => vis.has(c.id))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Total tareas</div><div className="ks-val">{total}</div></div>
        <div className="ks"><div className="ks-lbl">Pendientes</div><div className="ks-val amber">{pendientes}</div></div>
        <div className="ks"><div className="ks-lbl">En curso</div><div className="ks-val" style={{color:'var(--accent)'}}>{enCurso}</div></div>
        <div className="ks"><div className="ks-lbl">Finalizadas</div><div className="ks-val green">{finalizadas}</div></div>
        <div className="ks"><div className="ks-lbl">Prioridad alta</div><div className="ks-val red">{prioAlta}</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar tareas..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          ⚙ Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge activeCount={activeCount} onClear={clearAll}/>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim" onClick={()=>navigate('ficha-tarea')}>+ Nueva Tarea</button>
        </div>
      </div>

      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Tipo"><select className="fsel" value={af.tipo} onChange={e=>setAf(p=>({...p,tipo:e.target.value}))}><option value="">Todos</option><option>Gestión de producto</option><option>Acción comercial</option><option>Estrategia</option><option>Seguimiento</option></select></Field>
          <Field label="Estado"><select className="fsel" value={af.est} onChange={e=>setAf(p=>({...p,est:e.target.value}))}><option value="">Todos</option><option>Pendiente</option><option>En curso</option><option>Finalizada</option></select></Field>
          <Field label="Prioridad"><select className="fsel" value={af.prio} onChange={e=>setAf(p=>({...p,prio:e.target.value}))}><option value="">Todas</option><option>Alta</option><option>Media</option><option>Baja</option></select></Field>
          <Field label="Responsable"><select className="fsel" value={af.resp} onChange={e=>setAf(p=>({...p,resp:e.target.value}))}><option value="">Todos</option><option>Sierra Alvaro</option><option>Consultor MAD</option></select></Field>
          {advCount>0&&<button onClick={()=>setAf({tipo:'',est:'',prio:'',resp:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c =>
              c.id === '_chk' ? <th key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th> :
              c.sys ? <th key={c.id}>{c.label}</th> :
              <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={TARS}/>
            )}</tr>
          </thead>
          <tbody>
            {result.map(t=><tr key={t.id} onClick={()=>navigate('ficha-tarea')}>{visibleCols.map(c=>cell(t)[c.id])}</tr>)}
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
