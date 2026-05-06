import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import { Download, SlidersHorizontal } from 'lucide-react'

const VISS = [
  {id:'VIS-001',f:'13/11/2025',h:'10:00',cuenta:'Corporacion Financiera Azuaga SL',dem:'D251035690',act:'Albatros — Edif. D',of:'OLBUR2315645',tipo:'Inicial',est:'Realizada',cont:'Estefanía García',int:'Alto',prob:'60%'},
  {id:'VIS-002',f:'01/03/2025',h:'11:30',cuenta:'Oracle Spain SL',dem:'NEG-0041',act:'Albatros — Edif. D',of:'OLBUR2315645',tipo:'Inicial',est:'Realizada',cont:'Carlos Méndez',int:'Alto',prob:'75%'},
  {id:'VIS-003',f:'01/03/2025',h:'16:00',cuenta:'Generali Real Estate',dem:'NEG-0039',act:'P.E Avalon — P5',of:'OLB001',tipo:'Segunda',est:'Realizada',cont:'Marta Solá',int:'Muy alto',prob:'90%'},
  {id:'VIS-004',f:'15/04/2026',h:'10:00',cuenta:'Empresa XYZ',dem:'NEG-0044',act:'P.E Avalon',of:'OLB001',tipo:'Técnica',est:'Pendiente',cont:'Ana Gómez',int:'Medio',prob:'55%'},
  {id:'VIS-005',f:'20/03/2026',h:'09:30',cuenta:'Pharma Group Spain',dem:'NEG-0037',act:'Diagonal 95 — P3',of:'OFR-0017',tipo:'Segunda',est:'Realizada',cont:'Javier Ruiz',int:'Medio',prob:'45%'},
]

const TIPO_TAG  = { Inicial:'tag-teal', Segunda:'tag-purple', 'Técnica':'tag-blue', 'Cliente final':'tag-amber' }
const EST_TAG   = { Realizada:'tag-green', Pendiente:'tag-amber', Cancelada:'tag-red' }
const INT_COLOR = { Alto:'var(--accent)', 'Muy alto':'var(--green)', Medio:'var(--amber)', Bajo:'var(--text3)' }

const COLS = [
  { id: '_chk',  label: '',             sys: true },
  { id: 'id',    label: 'ID',           required: true, type:'text',   getValue: r => r.id },
  { id: 'fecha', label: 'Fecha · Hora',                 type:'text',   getValue: r => r.f },
  { id: 'cuenta',label: 'Cuenta',       required: true, type:'text',   getValue: r => r.cuenta },
  { id: 'dem',   label: 'Demanda',                      type:'text',   getValue: r => r.dem },
  { id: 'act',   label: 'Activo',                       type:'text',   getValue: r => r.act },
  { id: 'of',    label: 'Oferta',                       type:'text',   getValue: r => r.of },
  { id: 'tipo',  label: 'Tipo visita',                  type:'enum',   getValue: r => r.tipo },
  { id: 'est',   label: 'Estado',                       type:'enum',   getValue: r => r.est },
  { id: 'cont',  label: 'Contacto',                     type:'text',   getValue: r => r.cont },
  { id: 'int',   label: 'Interés',                      type:'enum',   getValue: r => r.int },
  { id: 'prob',  label: 'Prob. cierre',                 type:'text',   getValue: r => r.prob },
  { id: '_act',  label: '',             sys: true },
]

export default function VisitasList() {
  const { navigate } = useNav()
  const [query,   setQuery]   = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ tipo: '', est: '', int: '' })
  const [vis, setVis] = useVisibleCols('visitas', COLS)

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = VISS.filter(v => {
    const q = query.toLowerCase()
    if (q && !v.cuenta.toLowerCase().includes(q) && !v.act.toLowerCase().includes(q) && !v.id.toLowerCase().includes(q)) return false
    if (af.tipo && v.tipo !== af.tipo) return false
    if (af.est  && v.est  !== af.est)  return false
    if (af.int  && v.int  !== af.int)  return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  const total      = VISS.length
  const realizadas = VISS.filter(v=>v.est==='Realizada').length
  const pendientes = VISS.filter(v=>v.est==='Pendiente').length
  const altoInt    = VISS.filter(v=>v.int==='Alto'||v.int==='Muy alto').length
  const probMedia  = Math.round(VISS.reduce((s,v)=>s+parseInt(v.prob),0)/VISS.length)

  const cell = (v) => ({
    _chk:  <td key="_chk"><input type="checkbox" onClick={e=>e.stopPropagation()} style={{accentColor:'var(--accent)'}}/></td>,
    id:    <td key="id"><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{v.id}</span></td>,
    fecha: <td key="fecha" style={{fontSize:11}}>{v.f} <span style={{color:'var(--text4)'}}>{v.h}</span></td>,
    cuenta:<td key="cuenta"><span className="dtbl-link" onClick={e=>e.stopPropagation()}>{v.cuenta}</span></td>,
    dem:   <td key="dem"><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}} onClick={e=>e.stopPropagation()}>{v.dem}</span></td>,
    act:   <td key="act" style={{fontSize:11,fontWeight:500}}>{v.act}</td>,
    of:    <td key="of"><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}} onClick={e=>e.stopPropagation()}>{v.of}</span></td>,
    tipo:  <td key="tipo"><span className={`tag ${TIPO_TAG[v.tipo]||'tag-gray'}`}>{v.tipo}</span></td>,
    est:   <td key="est"><span className={`tag ${EST_TAG[v.est]||'tag-gray'}`}>{v.est}</span></td>,
    cont:  <td key="cont" style={{fontSize:11}}>{v.cont}</td>,
    int:   <td key="int" style={{fontSize:11,fontWeight:600,color:INT_COLOR[v.int]||'var(--text)'}}>{v.int}</td>,
    prob:  <td key="prob" style={{fontSize:11,fontWeight:600,color:'var(--green)'}}>{v.prob}</td>,
    _act:  <td key="_act"><button className="tbtn" style={{fontSize:10,padding:'3px 8px'}} onClick={e=>{e.stopPropagation();navigate('ficha-visita')}}>Ver</button></td>,
  })

  const visibleCols = COLS.filter(c => vis.has(c.id))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Total visitas</div><div className="ks-val">{total}</div></div>
        <div className="ks"><div className="ks-lbl">Realizadas</div><div className="ks-val green">{realizadas}</div></div>
        <div className="ks"><div className="ks-lbl">Pendientes</div><div className="ks-val amber">{pendientes}</div></div>
        <div className="ks"><div className="ks-lbl">Alto interés</div><div className="ks-val" style={{color:'var(--accent)'}}>{altoInt}</div></div>
        <div className="ks"><div className="ks-lbl">Prob. media</div><div className="ks-val">{probMedia}%</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar visitas..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          <SlidersHorizontal size={14} strokeWidth={1.75} /> Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge activeCount={activeCount} onClear={clearAll}/>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>
          <button className="tbtn"><Download size={14} strokeWidth={1.75} /> Exportar</button>
          <button className="tbtn prim" onClick={()=>navigate('ficha-visita')}>+ Nueva Visita</button>
        </div>
      </div>

      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Tipo"><select className="fsel" value={af.tipo} onChange={e=>setAf(p=>({...p,tipo:e.target.value}))}><option value="">Todos</option><option>Inicial</option><option>Segunda</option><option>Técnica</option><option>Cliente final</option></select></Field>
          <Field label="Estado"><select className="fsel" value={af.est} onChange={e=>setAf(p=>({...p,est:e.target.value}))}><option value="">Todos</option><option>Pendiente</option><option>Realizada</option><option>Cancelada</option></select></Field>
          <Field label="Nivel de interés"><select className="fsel" value={af.int} onChange={e=>setAf(p=>({...p,int:e.target.value}))}><option value="">Todos</option><option>Muy alto</option><option>Alto</option><option>Medio</option><option>Bajo</option></select></Field>
          {advCount>0&&<button onClick={()=>setAf({tipo:'',est:'',int:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c =>
              c.id === '_chk' ? <th key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th> :
              c.sys ? <th key={c.id}>{c.label}</th> :
              <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={VISS}/>
            )}</tr>
          </thead>
          <tbody>
            {result.map(v=><tr key={v.id} onClick={()=>navigate('ficha-visita')}>{visibleCols.map(c=>cell(v)[c.id])}</tr>)}
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
