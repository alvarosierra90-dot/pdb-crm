import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

export const MANDATOS = [
  { id:'MAN-2501', titulo:'Exclusiva Leasing — P.E Avalon · P4 y P5', tipo:'Leasing', excl:'Exclusiva', estado:'Activo', cuenta:'Merlín Properties SOCIMI', activos:['P.E Avalon'], activos_n:1, responsable:'Sierra Alvaro', equipo:'Leasing Oficinas MAD', linea:'Leasing', departamento:'Oficinas', provincia:'Madrid', zona:'M-30', fecha_concesion:'01/02/2025', fecha_inicio:'01/03/2025', fecha_fin:'28/02/2026', preaviso_dias:30, alerta_dias:60, prorroga_tacita:true, prorroga_meses:6, dias_restantes:55, sba_mandato:4050, ofertas_activas:2, actividades:4, cobroker: null },
  { id:'MAN-2502', titulo:'Coexclusiva Leasing — Albatros Edif. D', tipo:'Leasing', excl:'Coexclusiva', estado:'Activo', cuenta:'Merlín Properties SOCIMI', activos:['Albatros Edif. D'], activos_n:1, responsable:'Sierra Alvaro', equipo:'Leasing Oficinas MAD', linea:'Leasing', departamento:'Oficinas', provincia:'Madrid', zona:'A-1 · Alcobendas', fecha_concesion:'15/06/2025', fecha_inicio:'01/07/2025', fecha_fin:'30/06/2026', preaviso_dias:30, alerta_dias:60, prorroga_tacita:true, prorroga_meses:3, dias_restantes:85, sba_mandato:13486, ofertas_activas:1, actividades:6, cobroker: 'CBRE' },
  { id:'MAN-2503', titulo:'Exclusiva Capital Markets — Torre Glòries', tipo:'Capital Markets', excl:'Exclusiva', estado:'Activo', cuenta:'Merlín Properties SOCIMI', activos:['Torre Glòries'], activos_n:1, responsable:'García Marta', equipo:'Capital Markets MAD', linea:'Capital Markets', departamento:'Capital Markets', provincia:'Barcelona', zona:'22@', fecha_concesion:'01/10/2025', fecha_inicio:'01/11/2025', fecha_fin:'31/10/2026', preaviso_dias:60, alerta_dias:90, prorroga_tacita:false, prorroga_meses:0, dias_restantes:207, sba_mandato:18500, ofertas_activas:0, actividades:3, cobroker: null },
  { id:'MAN-2504', titulo:'Mandato Valoraciones — Portfolio Merlín 2026', tipo:'Valoraciones', excl:'Exclusiva', estado:'Activo', cuenta:'Merlín Properties SOCIMI', activos:['P.E Avalon','Torre Glòries','Park Logístico Getafe'], activos_n:3, responsable:'López Carmen', equipo:'Valoraciones MAD', linea:'Valoraciones', departamento:'Valoraciones', provincia:'Madrid', zona:'—', fecha_concesion:'15/01/2026', fecha_inicio:'01/02/2026', fecha_fin:'31/07/2026', preaviso_dias:30, alerta_dias:45, prorroga_tacita:false, prorroga_meses:0, dias_restantes:116, sba_mandato:89456, ofertas_activas:0, actividades:2, cobroker: null },
  { id:'MAN-2505', titulo:'Coexclusiva Leasing — Parque Empresarial Norte', tipo:'Leasing', excl:'Coexclusiva', estado:'Alerta', cuenta:'FREO Investments Spain SL', activos:['Parque Empresarial Norte'], activos_n:1, responsable:'GOMEZ Ignacio', equipo:'Leasing Oficinas MAD', linea:'Leasing', departamento:'Oficinas', provincia:'Madrid', zona:'M-30', fecha_concesion:'01/04/2025', fecha_inicio:'01/05/2025', fecha_fin:'30/04/2026', preaviso_dias:30, alerta_dias:60, prorroga_tacita:true, prorroga_meses:3, dias_restantes:24, sba_mandato:11200, ofertas_activas:1, actividades:2, cobroker: 'JLL' },
  { id:'MAN-2506', titulo:'Exclusiva Leasing — Torre Europa Valencia', tipo:'Leasing', excl:'Exclusiva', estado:'Vencido', cuenta:'FREO Investments Spain SL', activos:['Torre Europa Valencia'], activos_n:1, responsable:'Sierra Alvaro', equipo:'Leasing Oficinas MAD', linea:'Leasing', departamento:'Oficinas', provincia:'Valencia', zona:'Mestalla', fecha_concesion:'01/03/2024', fecha_inicio:'01/04/2024', fecha_fin:'31/03/2025', preaviso_dias:30, alerta_dias:60, prorroga_tacita:true, prorroga_meses:3, dias_restantes:-6, sba_mandato:7600, ofertas_activas:1, actividades:5, cobroker: null },
]

const ESTADO_TAG = { Activo:'tag-green', Alerta:'tag-amber', Vencido:'tag-red', Renovado:'tag-blue', Rescindido:'tag-gray' }
const EXCL_TAG   = { Exclusiva:'tag-purple', Coexclusiva:'tag-teal' }
const TIPO_TAG   = { Leasing:'tag-blue', 'Capital Markets':'tag-purple', Valoraciones:'tag-teal', 'Property Management':'tag-amber' }

function DiasRestantes({ n }) {
  if (n < 0)   return <span style={{fontSize:10,fontWeight:700,color:'var(--red)',background:'var(--red-lt)',border:'1px solid var(--red-bd)',padding:'1px 7px',borderRadius:9}}>Vencido {Math.abs(n)}d</span>
  if (n <= 30) return <span style={{fontSize:10,fontWeight:700,color:'var(--red)',background:'var(--red-lt)',border:'1px solid var(--red-bd)',padding:'1px 7px',borderRadius:9}}>⚠ {n}d restantes</span>
  if (n <= 60) return <span style={{fontSize:10,fontWeight:700,color:'var(--amber)',background:'var(--amber-lt)',border:'1px solid var(--amber-bd)',padding:'1px 7px',borderRadius:9}}>⏳ {n}d restantes</span>
  return <span style={{fontSize:10,fontWeight:600,color:'var(--text3)'}}>{n}d restantes</span>
}

function ini(s){ return (s||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() }

const COLS = [
  { id: '_chk',         label: '',                 sys: true },
  { id: 'id',           label: 'ID',               required: true, type:'text',   getValue: r => r.id },
  { id: 'titulo',       label: 'Mandato',          required: true, type:'text',   getValue: r => r.titulo },
  { id: 'cuenta',       label: 'Cuenta',           required: true, type:'text',   getValue: r => r.cuenta },
  { id: 'activos',      label: 'Activos',                          type:'text',   getValue: r => r.activos.join(', ') },
  { id: 'tipo',         label: 'Tipo',                             type:'enum',   getValue: r => r.tipo },
  { id: 'excl',         label: 'Exclusividad',                     type:'enum',   getValue: r => r.excl },
  { id: 'departamento', label: 'Departamento',                     type:'enum',   getValue: r => r.departamento },
  { id: 'responsable',  label: 'Responsable',                      type:'enum',   getValue: r => r.responsable },
  { id: 'fecha_inicio', label: 'Fecha inicio',                     type:'text',   getValue: r => r.fecha_inicio },
  { id: 'fecha_fin',    label: 'Fecha fin',                        type:'text',   getValue: r => r.fecha_fin },
  { id: 'prorroga',     label: 'Prórr. tácita' },
  { id: 'estado',       label: 'Estado',                           type:'enum',   getValue: r => r.estado },
  { id: 'vencimiento',  label: 'Vencimiento',                      type:'number', getValue: r => r.dias_restantes },
  { id: 'ofertas',      label: 'Ofertas',                          type:'number', getValue: r => r.ofertas_activas },
  { id: '_act',         label: '',                 sys: true },
]

export default function MandatosList() {
  const { navigate } = useNav()
  const [query,   setQuery]   = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ tipo: '', excl: '', estado: '', linea: '', provincia: '' })
  const [vis, setVis] = useVisibleCols('mandatos', COLS)

  const advCount = Object.values(af).filter(Boolean).length

  const filtered = MANDATOS.filter(m => {
    const q = query.toLowerCase()
    return (!q      || m.titulo.toLowerCase().includes(q) || m.cuenta.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
        && (!af.tipo     || m.tipo === af.tipo)
        && (!af.excl     || m.excl === af.excl)
        && (!af.estado   || m.estado === af.estado)
        && (!af.linea    || m.linea === af.linea)
        && (!af.provincia|| m.provincia === af.provincia)
  })

  const activos_s   = MANDATOS.filter(m=>m.estado==='Activo').length
  const alertas     = MANDATOS.filter(m=>m.estado==='Alerta'||m.dias_restantes<=30&&m.dias_restantes>=0).length
  const vencidos    = MANDATOS.filter(m=>m.estado==='Vencido').length
  const exclusivas  = MANDATOS.filter(m=>m.excl==='Exclusiva'&&m.estado!=='Vencido').length
  const coexcl      = MANDATOS.filter(m=>m.excl==='Coexclusiva'&&m.estado!=='Vencido').length
  const sbaTotal    = MANDATOS.filter(m=>m.estado!=='Vencido').reduce((s,m)=>s+m.sba_mandato,0)

  const cell = (m) => ({
    _chk:        <td key="_chk"><input type="checkbox" onClick={e=>e.stopPropagation()} style={{accentColor:'var(--accent)'}}/></td>,
    id:          <td key="id"><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{m.id}</span></td>,
    titulo:      <td key="titulo"><div className="asset-link">{m.titulo}</div><div className="asset-sub mono">{m.zona}</div></td>,
    departamento:<td key="departamento" style={{fontSize:11,fontWeight:500}}>{m.departamento || '—'}</td>,
    cuenta:      <td key="cuenta"><div style={{fontSize:11,fontWeight:500,color:'var(--text)'}}>{m.cuenta}</div><div className="asset-sub">{m.provincia}</div></td>,
    activos:     <td key="activos">
      <div style={{display:'flex',flexDirection:'column',gap:2}}>
        {m.activos.slice(0,2).map(a=><span key={a} style={{fontSize:10,color:'var(--accent)',fontWeight:500}}>{a}</span>)}
        {m.activos.length>2&&<span style={{fontSize:9,color:'var(--text4)'}}>+{m.activos.length-2} más</span>}
      </div>
    </td>,
    tipo:        <td key="tipo"><span className={`tag ${TIPO_TAG[m.tipo]||'tag-gray'}`}>{m.tipo}</span></td>,
    excl:        <td key="excl">
      <span className={`tag ${EXCL_TAG[m.excl]||'tag-gray'}`}>{m.excl}</span>
      {m.excl === 'Coexclusiva' && m.cobroker && <div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>{m.cobroker}</div>}
    </td>,
    responsable: <td key="responsable">
      <div style={{display:'flex',alignItems:'center',gap:5}}>
        <div style={{width:20,height:20,borderRadius:'50%',background:'var(--accent-lt)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,flexShrink:0}}>{ini(m.responsable)}</div>
        <span style={{fontSize:11}}>{m.responsable}</span>
      </div>
    </td>,
    fecha_inicio:<td key="fecha_inicio" style={{fontSize:11,color:'var(--text3)'}}>{m.fecha_inicio}</td>,
    fecha_fin:   <td key="fecha_fin" style={{fontSize:11,fontWeight:m.dias_restantes<=60?600:400,color:m.dias_restantes<=30?'var(--red)':m.dias_restantes<=60?'var(--amber)':'var(--text2)'}}>{m.fecha_fin}</td>,
    prorroga:    <td key="prorroga" style={{textAlign:'center'}}>{m.prorroga_tacita ? <span style={{fontSize:10,fontWeight:600,color:'var(--teal)'}}>✓ {m.prorroga_meses}m</span> : <span style={{fontSize:10,color:'var(--text4)'}}>—</span>}</td>,
    estado:      <td key="estado"><span className={`tag ${ESTADO_TAG[m.estado]||'tag-gray'}`}>{m.estado}</span></td>,
    vencimiento: <td key="vencimiento"><DiasRestantes n={m.dias_restantes}/></td>,
    ofertas:     <td key="ofertas" style={{fontSize:11,fontWeight:600,color:m.ofertas_activas>0?'var(--accent)':'var(--text4)'}}>{m.ofertas_activas>0?m.ofertas_activas:'—'}</td>,
    _act:        <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-mandato')}}>Ver</button></div></td>,
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(filtered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(6,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Total mandatos</div><div className="ks-val">{MANDATOS.length}</div></div>
        <div className="ks"><div className="ks-lbl">Activos</div><div className="ks-val green">{activos_s}</div></div>
        <div className="ks"><div className="ks-lbl">Alerta / próx. venc.</div><div className="ks-val red">{alertas}</div><div className="ks-sub">≤ 30 días</div></div>
        <div className="ks"><div className="ks-lbl">Exclusivas</div><div className="ks-val" style={{color:'var(--purple)'}}>{exclusivas}</div></div>
        <div className="ks"><div className="ks-lbl">Coexclusivas</div><div className="ks-val" style={{color:'var(--teal)'}}>{coexcl}</div></div>
        <div className="ks"><div className="ks-lbl">SBA bajo mandato</div><div className="ks-val">{(sbaTotal/1000).toFixed(0)}k m²</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar mandato, cuenta, activo..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          ⚙ Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll}/>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim" onClick={()=>navigate('ficha-mandato',{nuevo:true})}>+ Nuevo Mandato</button>
        </div>
      </div>

      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Tipo"><select className="fsel" value={af.tipo} onChange={e=>setAf(p=>({...p,tipo:e.target.value}))}><option value="">Todos</option><option>Leasing</option><option>Capital Markets</option><option>Valoraciones</option><option>Property Management</option></select></Field>
          <Field label="Exclusividad"><select className="fsel" value={af.excl} onChange={e=>setAf(p=>({...p,excl:e.target.value}))}><option value="">Todas</option><option>Exclusiva</option><option>Coexclusiva</option></select></Field>
          <Field label="Estado"><select className="fsel" value={af.estado} onChange={e=>setAf(p=>({...p,estado:e.target.value}))}><option value="">Todos</option><option>Activo</option><option>Alerta</option><option>Vencido</option><option>Renovado</option></select></Field>
          <Field label="Línea"><select className="fsel" value={af.linea} onChange={e=>setAf(p=>({...p,linea:e.target.value}))}><option value="">Todas</option><option>Leasing</option><option>Capital Markets</option><option>Valoraciones</option></select></Field>
          <Field label="Provincia"><select className="fsel" value={af.provincia} onChange={e=>setAf(p=>({...p,provincia:e.target.value}))}><option value="">Todas</option><option>Madrid</option><option>Barcelona</option><option>Valencia</option></select></Field>
          {advCount>0&&<button onClick={()=>setAf({tipo:'',excl:'',estado:'',linea:'',provincia:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c=>c.id==='_chk'?<th key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th>:c.sys?<th key={c.id}>{c.label}</th>:<ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={MANDATOS}/>)}</tr>
          </thead>
          <tbody>
            {result.map(m=>(
              <tr key={m.id} onClick={()=>navigate('ficha-mandato')} style={{opacity:m.estado==='Vencido'?.65:1}}>
                {visibleCols.map(c=>cell(m)[c.id])}
              </tr>
            ))}
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
