import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

const ACTS = [
  {id:'ACT-2501',u:'Sierra Alvaro',team:'Leasing Oficinas MAD',rT:'Demanda',ref:'Corporacion Financiera Azuaga SL',as:'Propuesta arrendamiento Albatros — Edif. D',tipo:'Email',f:'20/10/2025',h:'13:40',est:'Abierto',mod:'Sierra Alvaro'},
  {id:'ACT-2502',u:'Consultor MAD',team:'Leasing Oficinas MAD',rT:'Demanda',ref:'Experta Media',as:'RE: propuesta arrendamiento alternativa',tipo:'Email',f:'10/10/2025',h:'09:57',est:'Abierto',mod:'Consultor MAD'},
  {id:'ACT-2503',u:'Consultor MAD',team:'Leasing Oficinas MAD',rT:'Activo',ref:'P.E Avalon',as:'Llamada propietario Barings — estado mandato',tipo:'Llamada',f:'08/10/2025',h:'10:14',est:'Finalizado',mod:'Consultor MAD'},
  {id:'ACT-2504',u:'Sierra Alvaro',team:'Leasing Oficinas MAD',rT:'Oferta',ref:'Albatros · OLBUR2315645',as:'Envío dossier Albatros a Oracle',tipo:'Email',f:'08/10/2025',h:'18:11',est:'Abierto',mod:'Sierra Alvaro'},
  {id:'ACT-2505',u:'Consultor MAD',team:'Leasing Oficinas MAD',rT:'Demanda',ref:'Paraguas Grupo Hostelero SL',as:'Propuesta alternativa zona M-30',tipo:'Email',f:'08/10/2025',h:'13:07',est:'Abierto',mod:'Consultor MAD'},
  {id:'ACT-2506',u:'Consultor MAD',team:'Leasing Oficinas MAD',rT:'Demanda',ref:'Medicina Responsable SL',as:'Medicina Responsable SL — seguimiento zona A',tipo:'Email',f:'01/10/2025',h:'12:13',est:'Finalizado',mod:'Sierra Alvaro'},
  {id:'ACT-2507',u:'Sierra Alvaro',team:'Leasing Oficinas MAD',rT:'Cuenta',ref:'ISDE',as:'ISDE — reunión presentación portfolio Savills',tipo:'Reunión',f:'30/09/2025',h:'16:32',est:'Finalizado',mod:'Sierra Alvaro'},
  {id:'ACT-2508',u:'Consultor MAD',team:'Leasing Industrial MAD',rT:'Demanda',ref:'CLIMAX SPORT',as:'CLIMAX SPORT — seguimiento visita nave logística',tipo:'Tarea',f:'29/09/2025',h:'16:03',est:'Abierto',mod:'Consultor MAD'},
  {id:'ACT-2509',u:'Sierra Alvaro',team:'Leasing Oficinas MAD',rT:'Cuenta',ref:'RENTAMAR SL',as:'Catch up Oficinas — inversión zona norte',tipo:'Reunión',f:'26/09/2025',h:'15:48',est:'Abierto',mod:'Sierra Alvaro'},
  {id:'ACT-2510',u:'Consultor MAD',team:'Leasing Oficinas MAD',rT:'Activo',ref:'Albatros',as:'Nota interna — estado comercialización Albatros Q4',tipo:'Nota',f:'25/09/2025',h:'11:00',est:'Finalizado',mod:'Consultor MAD'},
]

const TIPO_TAG = { Email:'tag-blue', Llamada:'tag-green', 'Reunión':'tag-purple', Nota:'tag-amber', Tarea:'tag-gray', WhatsApp:'tag-teal' }
const TIPO_ICO = { Email:'📧', Llamada:'📞', 'Reunión':'🤝', Nota:'📝', Tarea:'✅', WhatsApp:'💬' }
const REF_TAG  = { Demanda:'tag-blue', Activo:'tag-teal', Oferta:'tag-green', Cuenta:'tag-gray', 'Negociación':'tag-purple', Interno:'tag-amber' }
const EST_TAG  = { Abierto:'tag-amber', Finalizado:'tag-gray' }

function avatarIni(s){ return (s||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() }

const COLS = [
  { id: '_chk',  label: '',            sys: true },
  { id: 'id',    label: 'ID',          required: true, type:'text',  getValue: r => r.id },
  { id: 'u',     label: 'Usuario',     required: true, type:'text',  getValue: r => r.u },
  { id: 'team',  label: 'Equipo',                      type:'text',  getValue: r => r.team },
  { id: 'ref',   label: 'Referente a',                 type:'text',  getValue: r => r.ref },
  { id: 'as',    label: 'Asunto',                      type:'text',  getValue: r => r.as },
  { id: 'tipo',  label: 'Tipo',                        type:'enum',  getValue: r => r.tipo },
  { id: 'fecha', label: 'Fecha · Hora',                type:'text',  getValue: r => r.f },
  { id: 'est',   label: 'Estado',                      type:'enum',  getValue: r => r.est },
  { id: 'mod',   label: 'Modificado por',              type:'text',  getValue: r => r.mod },
  { id: '_act',  label: '',            sys: true },
]

export default function ActividadesList() {
  const { navigate } = useNav()
  const [query,   setQuery]   = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ tipo: '', est: '', team: '', u: '', rT: '' })
  const [vis, setVis] = useVisibleCols('actividades', COLS)

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = ACTS.filter(a => {
    const q = query.toLowerCase()
    if (q && !a.as.toLowerCase().includes(q) && !a.ref.toLowerCase().includes(q)) return false
    if (af.tipo && a.tipo !== af.tipo) return false
    if (af.est  && a.est  !== af.est)  return false
    if (af.team && a.team !== af.team) return false
    if (af.u    && a.u    !== af.u)    return false
    if (af.rT   && a.rT   !== af.rT)   return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  const totales    = ACTS.length
  const emails     = ACTS.filter(a=>a.tipo==='Email').length
  const llamadas   = ACTS.filter(a=>a.tipo==='Llamada').length
  const reuniones  = ACTS.filter(a=>a.tipo==='Reunión').length
  const abiertas   = ACTS.filter(a=>a.est==='Abierto').length
  const finalizadas= ACTS.filter(a=>a.est==='Finalizado').length

  const cell = (a) => ({
    _chk:  <td key="_chk"><input type="checkbox" onClick={e=>e.stopPropagation()} style={{accentColor:'var(--accent)'}}/></td>,
    id:    <td key="id"><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{a.id}</span></td>,
    u:     <td key="u">
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <div style={{width:22,height:22,borderRadius:'50%',background:'var(--accent-lt)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,flexShrink:0}}>{avatarIni(a.u)}</div>
        <span style={{fontSize:11,fontWeight:500}}>{a.u}</span>
      </div>
    </td>,
    team:  <td key="team" style={{fontSize:11,color:'var(--text3)'}}>{a.team}</td>,
    ref:   <td key="ref">
      <div style={{display:'flex',flexDirection:'column',gap:2}}>
        <span className={`tag ${REF_TAG[a.rT]||'tag-gray'}`} style={{fontSize:9}}>{a.rT}</span>
        <span className="dtbl-link" onClick={e=>e.stopPropagation()}>{a.ref}</span>
      </div>
    </td>,
    as:    <td key="as" style={{fontSize:11,fontWeight:500,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.as}</td>,
    tipo:  <td key="tipo"><span className={`tag ${TIPO_TAG[a.tipo]||'tag-gray'}`}>{TIPO_ICO[a.tipo]||'📋'} {a.tipo}</span></td>,
    fecha: <td key="fecha" style={{fontSize:11}}>{a.f} <span style={{color:'var(--text4)'}}>{a.h}</span></td>,
    est:   <td key="est"><span className={`tag ${EST_TAG[a.est]||'tag-gray'}`}>{a.est}</span></td>,
    mod:   <td key="mod" style={{fontSize:11,color:'var(--text3)'}}>{a.mod}</td>,
    _act:  <td key="_act"><button className="tbtn" style={{fontSize:10,padding:'3px 8px'}} onClick={e=>{e.stopPropagation();navigate('ficha-actividad')}}>Ver</button></td>,
  })

  const visibleCols = COLS.filter(c => vis.has(c.id))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(6,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Total</div><div className="ks-val">{totales}</div></div>
        <div className="ks"><div className="ks-lbl">Emails</div><div className="ks-val" style={{color:'var(--accent)'}}>{emails}</div></div>
        <div className="ks"><div className="ks-lbl">Llamadas</div><div className="ks-val" style={{color:'var(--green)'}}>{llamadas}</div></div>
        <div className="ks"><div className="ks-lbl">Reuniones</div><div className="ks-val" style={{color:'var(--purple)'}}>{reuniones}</div></div>
        <div className="ks"><div className="ks-lbl">Abiertas</div><div className="ks-val amber">{abiertas}</div></div>
        <div className="ks"><div className="ks-lbl">Finalizadas</div><div className="ks-val green">{finalizadas}</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar actividades..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          ⚙ Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge activeCount={activeCount} onClear={clearAll}/>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim" onClick={()=>navigate('ficha-actividad')}>+ Nueva</button>
        </div>
      </div>

      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Tipo"><select className="fsel" value={af.tipo} onChange={e=>setAf(p=>({...p,tipo:e.target.value}))}><option value="">Todos</option><option>Email</option><option>Llamada</option><option>Reunión</option><option>Nota</option><option>Tarea</option></select></Field>
          <Field label="Estado"><select className="fsel" value={af.est} onChange={e=>setAf(p=>({...p,est:e.target.value}))}><option value="">Todos</option><option>Abierto</option><option>Finalizado</option></select></Field>
          <Field label="Equipo"><select className="fsel" value={af.team} onChange={e=>setAf(p=>({...p,team:e.target.value}))}><option value="">Todos</option><option>Leasing Oficinas MAD</option><option>Leasing Industrial MAD</option></select></Field>
          <Field label="Consultor"><select className="fsel" value={af.u} onChange={e=>setAf(p=>({...p,u:e.target.value}))}><option value="">Todos</option><option>Sierra Alvaro</option><option>Consultor MAD</option></select></Field>
          <Field label="Referente a"><select className="fsel" value={af.rT} onChange={e=>setAf(p=>({...p,rT:e.target.value}))}><option value="">Todos</option><option>Demanda</option><option>Activo</option><option>Oferta</option><option>Cuenta</option><option>Negociación</option></select></Field>
          {advCount>0&&<button onClick={()=>setAf({tipo:'',est:'',team:'',u:'',rT:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c =>
              c.id === '_chk' ? <th key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th> :
              c.sys ? <th key={c.id}>{c.label}</th> :
              <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={ACTS}/>
            )}</tr>
          </thead>
          <tbody>
            {result.map(a=><tr key={a.id} onClick={()=>navigate('ficha-actividad')}>{visibleCols.map(c=>cell(a)[c.id])}</tr>)}
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
