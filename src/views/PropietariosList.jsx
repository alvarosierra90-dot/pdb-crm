import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

export const PROPIETARIOS = [
  { id:'PRO-2501', propietario:'Merlín Properties SOCIMI',  activo:'P.E Avalon',                zona:'M-30',                subzona:'Julián Camarillo', superficie:46956, precio_compra:'130 M€', cap_rate:5.1, yield:5.4, estado_activo:'Ocupado',    tipologia:'Asset deal',  area:'Descentralizado', anyo_compra:2018, trimestre:'Q3', ltv:45, financiacion:60, responsable:'Sierra Alvaro',  ultima_act:'28/03/2026', perfil:'Core',       regimen:'Propiedad 100%', asset_manager:'Merlín Properties SOCIMI' },
  { id:'PRO-2502', propietario:'Merlín Properties SOCIMI',  activo:'Albatros Edif. D',          zona:'A-1',                 subzona:'Alcobendas',       superficie:53944, precio_compra:'—',       cap_rate:5.4, yield:5.7, estado_activo:'Ocupado',    tipologia:'Asset deal',  area:'Periferia',       anyo_compra:2016, trimestre:'Q1', ltv:35, financiacion:50, responsable:'Sierra Alvaro',  ultima_act:'15/03/2026', perfil:'Core',       regimen:'Propiedad 100%', asset_manager:'Merlín Properties SOCIMI' },
  { id:'PRO-2503', propietario:'Merlín Properties SOCIMI',  activo:'Torre Glòries',             zona:'22@',                 subzona:'Poblenou',         superficie:18500, precio_compra:'145 M€',  cap_rate:4.8, yield:5.0, estado_activo:'Ocupado',    tipologia:'Share deal',  area:'Descentralizado', anyo_compra:2021, trimestre:'Q2', ltv:40, financiacion:55, responsable:'García Marta',   ultima_act:'10/03/2026', perfil:'Core',       regimen:'Propiedad 100%', asset_manager:'Merlín Properties SOCIMI' },
  { id:'PRO-2504', propietario:'Merlín Properties SOCIMI',  activo:'Park Logístico Getafe',     zona:'Corredor del Henares',subzona:'Getafe',            superficie:24000, precio_compra:'52 M€',   cap_rate:6.2, yield:6.5, estado_activo:'Ocupado',    tipologia:'Asset deal',  area:'Periferia',       anyo_compra:2019, trimestre:'Q4', ltv:50, financiacion:65, responsable:'Sierra Alvaro',  ultima_act:'01/03/2026', perfil:'Core',       regimen:'Propiedad 100%', asset_manager:'Merlín Properties SOCIMI' },
  { id:'PRO-2505', propietario:'FREO Investments Spain SL', activo:'Torre Europa Valencia',     zona:'Mestalla',            subzona:'Benimaclet',        superficie:7600,  precio_compra:'38 M€',   cap_rate:6.8, yield:7.1, estado_activo:'Ocupado',    tipologia:'Asset deal',  area:'Descentralizado', anyo_compra:2020, trimestre:'Q2', ltv:55, financiacion:70, responsable:'GOMEZ Ignacio',  ultima_act:'05/04/2026', perfil:'Value-add',  regimen:'Propiedad 100%', asset_manager:'FREO Investments Spain SL' },
  { id:'PRO-2506', propietario:'FREO Investments Spain SL', activo:'Parque Empresarial Norte',  zona:'M-30',                subzona:'Hortaleza',         superficie:11200, precio_compra:'68 M€',   cap_rate:6.0, yield:6.3, estado_activo:'Ocupado',    tipologia:'Asset deal',  area:'Descentralizado', anyo_compra:2022, trimestre:'Q1', ltv:48, financiacion:60, responsable:'Sierra Alvaro',  ultima_act:'07/04/2026', perfil:'Value-add',  regimen:'Propiedad 100%', asset_manager:'FREO Investments Spain SL' },
  { id:'PRO-2507', propietario:'FREO Investments Spain SL', activo:'Edificio Diagonal 95',      zona:'22@',                 subzona:'Poblenou',          superficie:9800,  precio_compra:'74 M€',   cap_rate:5.5, yield:5.8, estado_activo:'Ocupado',    tipologia:'Share deal',  area:'Descentralizado', anyo_compra:2023, trimestre:'Q3', ltv:42, financiacion:55, responsable:'García Marta',   ultima_act:'20/03/2026', perfil:'Value-add',  regimen:'Propiedad 100%', asset_manager:'FREO Investments Spain SL' },
  { id:'PRO-2508', propietario:'Inversiones Familiar Velada',activo:'Centro Comercial Parquesur',zona:'Sur Madrid',         subzona:'Leganés',           superficie:42000, precio_compra:'210 M€',  cap_rate:5.8, yield:6.1, estado_activo:'Ocupado',    tipologia:'Asset deal',  area:'Periferia',       anyo_compra:2015, trimestre:'Q2', ltv:30, financiacion:40, responsable:'GOMEZ Ignacio',  ultima_act:'12/02/2026', perfil:'Core',       regimen:'Propiedad 100%', asset_manager:'Inversiones Familiar Velada' },
]

const PERFIL_TAG  = { 'Core':'tag-blue', 'Value-add':'tag-purple', 'Oportunista':'tag-red', 'Institucional':'tag-teal', 'Privado':'tag-gray' }
const ESTADO_TAG  = { 'Ocupado':'tag-green', 'Vacío':'tag-amber', 'En bruto':'tag-gray', 'En reforma':'tag-purple' }
const TIP_TAG     = { 'Asset deal':'tag-blue', 'Share deal':'tag-purple' }

const COLS = [
  { id:'_chk',          label:'',                   sys:true },
  { id:'id',            label:'ID',                 required:true, type:'text',   getValue:r=>r.id },
  { id:'propietario',   label:'Propietario',         required:true, type:'text',   getValue:r=>r.propietario },
  { id:'activo',        label:'Activo',              required:true, type:'text',   getValue:r=>r.activo },
  { id:'zona',          label:'Zona',                              type:'enum',   getValue:r=>r.zona },
  { id:'subzona',       label:'Sub-zona',                          type:'enum',   getValue:r=>r.subzona },
  { id:'superficie',    label:'Sup. m²',                           type:'number', getValue:r=>r.superficie },
  { id:'precio_compra', label:'Precio compra',                     type:'text',   getValue:r=>r.precio_compra },
  { id:'cap_rate',      label:'Cap rate %',                        type:'number', getValue:r=>r.cap_rate },
  { id:'yield',         label:'Yield %',                           type:'number', getValue:r=>r.yield },
  { id:'estado_activo', label:'Estado activo',                     type:'enum',   getValue:r=>r.estado_activo },
  { id:'tipologia',     label:'Tipología op.',                     type:'enum',   getValue:r=>r.tipologia },
  { id:'area',          label:'Área',                              type:'enum',   getValue:r=>r.area },
  { id:'anyo_compra',   label:'Año compra',                        type:'number', getValue:r=>r.anyo_compra },
  { id:'trimestre',     label:'Trimestre',                         type:'enum',   getValue:r=>r.trimestre },
  { id:'ltv',           label:'LTV %',                             type:'number', getValue:r=>r.ltv },
  { id:'financiacion',  label:'Financiación %',                    type:'number', getValue:r=>r.financiacion },
  { id:'perfil',        label:'Perfil',                            type:'enum',   getValue:r=>r.perfil },
  { id:'responsable',   label:'Responsable',                       type:'enum',   getValue:r=>r.responsable },
  { id:'ultima_act',    label:'Última actualiz.',                  type:'text',   getValue:r=>r.ultima_act },
  { id:'_act',          label:'',                   sys:true },
]

const DEFAULT_VIS = new Set(['_chk','id','propietario','activo','zona','superficie','precio_compra','cap_rate','yield','estado_activo','tipologia','perfil','responsable','_act'])

export default function PropietariosList() {
  const { navigate } = useNav()
  const [query,   setQuery]   = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ propietario:'', perfil:'', tipologia:'', estado_activo:'', area:'', responsable:'' })
  const [vis, setVis] = useVisibleCols('propietarios', COLS, DEFAULT_VIS)

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = PROPIETARIOS.filter(p => {
    const q = query.toLowerCase()
    if (q && !p.propietario.toLowerCase().includes(q) && !p.activo.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false
    if (af.propietario  && p.propietario !== af.propietario) return false
    if (af.perfil       && p.perfil !== af.perfil) return false
    if (af.tipologia    && p.tipologia !== af.tipologia) return false
    if (af.estado_activo&& p.estado_activo !== af.estado_activo) return false
    if (af.area         && p.area !== af.area) return false
    if (af.responsable  && p.responsable !== af.responsable) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  const totalSup   = PROPIETARIOS.reduce((s,p)=>s+p.superficie,0)
  const avgCapRate = (PROPIETARIOS.reduce((s,p)=>s+p.cap_rate,0)/PROPIETARIOS.length).toFixed(1)
  const avgYield   = (PROPIETARIOS.reduce((s,p)=>s+p.yield,0)/PROPIETARIOS.length).toFixed(1)
  const nPropietarios = new Set(PROPIETARIOS.map(p=>p.propietario)).size

  const cell = (p) => ({
    _chk:          <td key="_chk"><input type="checkbox" onClick={e=>e.stopPropagation()} style={{accentColor:'var(--accent)'}}/></td>,
    id:            <td key="id"><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{p.id}</span></td>,
    propietario:   <td key="propietario"><div className="asset-link">{p.propietario}</div><div className="asset-sub">{p.regimen}</div></td>,
    activo:        <td key="activo"><div className="asset-link" onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>{p.activo}</div></td>,
    zona:          <td key="zona" style={{fontSize:11,fontWeight:500}}>{p.zona}</td>,
    subzona:       <td key="subzona" style={{fontSize:11,color:'var(--text3)'}}>{p.subzona}</td>,
    superficie:    <td key="superficie" className="mono">{p.superficie.toLocaleString('es-ES')} m²</td>,
    precio_compra: <td key="precio_compra" className="mono" style={{fontWeight:600}}>{p.precio_compra}</td>,
    cap_rate:      <td key="cap_rate"><span style={{fontSize:12,fontWeight:700,color:p.cap_rate>=6?'var(--green)':p.cap_rate>=5?'var(--accent)':'var(--text3)'}}>{p.cap_rate}%</span></td>,
    yield:         <td key="yield"><span style={{fontSize:12,fontWeight:700,color:p.yield>=6.5?'var(--green)':p.yield>=5.5?'var(--accent)':'var(--text3)'}}>{p.yield}%</span></td>,
    estado_activo: <td key="estado_activo"><span className={`tag ${ESTADO_TAG[p.estado_activo]||'tag-gray'}`}>{p.estado_activo}</span></td>,
    tipologia:     <td key="tipologia"><span className={`tag ${TIP_TAG[p.tipologia]||'tag-gray'}`} style={{fontSize:9}}>{p.tipologia}</span></td>,
    area:          <td key="area"><span className="tag tag-blue" style={{fontSize:9}}>{p.area}</span></td>,
    anyo_compra:   <td key="anyo_compra" style={{fontSize:11}}>{p.anyo_compra}</td>,
    trimestre:     <td key="trimestre"><span className="tag tag-teal" style={{fontSize:9}}>{p.trimestre}</span></td>,
    ltv:           <td key="ltv" style={{fontSize:11,fontWeight:600,color:p.ltv>50?'var(--amber)':'var(--text2)'}}>{p.ltv}%</td>,
    financiacion:  <td key="financiacion" style={{fontSize:11}}>{p.financiacion}%</td>,
    perfil:        <td key="perfil"><span className={`tag ${PERFIL_TAG[p.perfil]||'tag-gray'}`} style={{fontSize:9}}>{p.perfil}</span></td>,
    responsable:   <td key="responsable" style={{fontSize:11}}>{p.responsable}</td>,
    ultima_act:    <td key="ultima_act" style={{fontSize:11,color:'var(--text3)'}}>{p.ultima_act}</td>,
    _act:          <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-propietario')}}>Ver</button></div></td>,
  })

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Total activos</div><div className="ks-val">{PROPIETARIOS.length}</div></div>
        <div className="ks"><div className="ks-lbl">Propietarios únicos</div><div className="ks-val" style={{color:'var(--accent)'}}>{nPropietarios}</div></div>
        <div className="ks"><div className="ks-lbl">Sup. total gestionada</div><div className="ks-val">{(totalSup/1000).toFixed(0)}k m²</div></div>
        <div className="ks"><div className="ks-lbl">Cap rate medio</div><div className="ks-val green">{avgCapRate}%</div></div>
        <div className="ks"><div className="ks-lbl">Yield medio</div><div className="ks-val" style={{color:'var(--purple)'}}>{avgYield}%</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar propietario, activo..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          ⚙ Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll}/>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim" onClick={()=>navigate('ficha-propietario')}>+ Nuevo propietario</button>
        </div>
      </div>

      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Propietario">
            <select className="fsel" value={af.propietario} onChange={e=>setAf(p=>({...p,propietario:e.target.value}))}>
              <option value="">Todos</option><option>Merlín Properties SOCIMI</option><option>FREO Investments Spain SL</option><option>Inversiones Familiar Velada</option>
            </select>
          </Field>
          <Field label="Perfil">
            <select className="fsel" value={af.perfil} onChange={e=>setAf(p=>({...p,perfil:e.target.value}))}>
              <option value="">Todos</option><option>Core</option><option>Value-add</option><option>Oportunista</option><option>Institucional</option><option>Privado</option>
            </select>
          </Field>
          <Field label="Tipología">
            <select className="fsel" value={af.tipologia} onChange={e=>setAf(p=>({...p,tipologia:e.target.value}))}>
              <option value="">Todas</option><option>Asset deal</option><option>Share deal</option>
            </select>
          </Field>
          <Field label="Estado activo">
            <select className="fsel" value={af.estado_activo} onChange={e=>setAf(p=>({...p,estado_activo:e.target.value}))}>
              <option value="">Todos</option><option>Ocupado</option><option>Vacío</option><option>En bruto</option><option>En reforma</option>
            </select>
          </Field>
          <Field label="Área">
            <select className="fsel" value={af.area} onChange={e=>setAf(p=>({...p,area:e.target.value}))}>
              <option value="">Todas</option><option>CBD</option><option>Centro</option><option>Descentralizado</option><option>Periferia</option>
            </select>
          </Field>
          <Field label="Responsable">
            <select className="fsel" value={af.responsable} onChange={e=>setAf(p=>({...p,responsable:e.target.value}))}>
              <option value="">Todos</option><option>Sierra Alvaro</option><option>GOMEZ Ignacio</option><option>García Marta</option>
            </select>
          </Field>
          {advCount>0&&<button onClick={()=>setAf({propietario:'',perfil:'',tipologia:'',estado_activo:'',area:'',responsable:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c=>
              c.id==='_chk'?<th key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th>:
              c.sys?<th key={c.id}>{c.label}</th>:
              <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={PROPIETARIOS}/>
            )}</tr>
          </thead>
          <tbody>
            {result.map(p=>(
              <tr key={p.id} onClick={()=>navigate('ficha-propietario')} style={{cursor:'pointer'}}>
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
