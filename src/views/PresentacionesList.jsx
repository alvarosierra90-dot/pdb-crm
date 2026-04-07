import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

export const PRESENTACIONES = [
  { id:'PRE-2501', activo:'P.E Avalon',                  cuenta:'Oracle Spain SL',            contacto:'James Richardson',      fecha_envio:'01/04/2026', visitado:true,  fecha_visita:'08/04/2026', responsable:'Sierra Alvaro',  estado:'Visitado',       linea:'Oficinas',  superficie:'46.956 m²', zona:'M-30',       notas:'Reunión muy positiva. Esperando feedback formal.' },
  { id:'PRE-2502', activo:'Albatros Edif. D',            cuenta:'Grupo Mediática España',      contacto:'Carmen Fuentes',        fecha_envio:'28/03/2026', visitado:false, fecha_visita:'',          responsable:'Sierra Alvaro',  estado:'Sin respuesta',  linea:'Oficinas',  superficie:'53.944 m²', zona:'A-1',        notas:'Segundo seguimiento pendiente.' },
  { id:'PRE-2503', activo:'Parque Empresarial Norte',     cuenta:'ISDE Escuela de Derecho',     contacto:'Rodrigo Medina',        fecha_envio:'25/03/2026', visitado:true,  fecha_visita:'03/04/2026', responsable:'GOMEZ Ignacio',  estado:'En negociación', linea:'Oficinas',  superficie:'11.200 m²', zona:'M-30',       notas:'Han pedido propuesta económica. Avanzando.' },
  { id:'PRE-2504', activo:'Torre Glòries',                cuenta:'Generali Real Estate',        contacto:'Marco Rossi',           fecha_envio:'22/03/2026', visitado:true,  fecha_visita:'29/03/2026', responsable:'García Marta',   estado:'Descartado',     linea:'Oficinas',  superficie:'18.500 m²', zona:'22@',        notas:'No encaja con su estrategia actual.' },
  { id:'PRE-2505', activo:'Edificio Diagonal 95',         cuenta:'BBVA SA',                     contacto:'Patricia Solano',       fecha_envio:'18/03/2026', visitado:false, fecha_visita:'',          responsable:'García Marta',   estado:'Enviado',        linea:'Oficinas',  superficie:'9.800 m²',  zona:'22@',        notas:'Enviado dossier completo. Pendiente respuesta.' },
  { id:'PRE-2506', activo:'P.E Avalon',                   cuenta:'Telefónica SA',               contacto:'Laura Martín',          fecha_envio:'15/03/2026', visitado:true,  fecha_visita:'24/03/2026', responsable:'Sierra Alvaro',  estado:'Visitado',       linea:'Oficinas',  superficie:'46.956 m²', zona:'M-30',       notas:'Visita realizada. Analizando necesidades internas.' },
  { id:'PRE-2507', activo:'Park Logístico Getafe',         cuenta:'Amazon Logistics Spain SL',   contacto:'Thomas Clarke',         fecha_envio:'10/03/2026', visitado:true,  fecha_visita:'17/03/2026', responsable:'GOMEZ Ignacio',  estado:'En negociación', linea:'Industrial', superficie:'24.000 m²', zona:'Sur Madrid', notas:'Oferta presentada. Plazo respuesta 30/04.' },
  { id:'PRE-2508', activo:'Centro Comercial Parquesur',   cuenta:'Inditex SA',                  contacto:'Ana González',          fecha_envio:'05/03/2026', visitado:false, fecha_visita:'',          responsable:'GOMEZ Ignacio',  estado:'Sin respuesta',  linea:'Retail',    superficie:'42.000 m²', zona:'Sur Madrid', notas:'Sin respuesta tras 3 semanas.' },
  { id:'PRE-2509', activo:'Torre Europa Valencia',         cuenta:'Grupo Mutua Madrileña',       contacto:'Enrique Vázquez',       fecha_envio:'01/03/2026', visitado:true,  fecha_visita:'10/03/2026', responsable:'Sierra Alvaro',  estado:'Descartado',     linea:'Capital Markets', superficie:'7.600 m²', zona:'Mestalla', notas:'Precio fuera de rango.' },
  { id:'PRE-2510', activo:'Albatros Edif. D',             cuenta:'Repsol SA',                   contacto:'Miguel Torres',         fecha_envio:'25/02/2026', visitado:true,  fecha_visita:'04/03/2026', responsable:'García Marta',   estado:'Visitado',       linea:'Oficinas',  superficie:'53.944 m²', zona:'A-1',        notas:'Segunda visita pendiente de confirmar.' },
  { id:'PRE-2511', activo:'Parque Empresarial Norte',     cuenta:'Oracle Spain SL',             contacto:'James Richardson',      fecha_envio:'20/02/2026', visitado:false, fecha_visita:'',          responsable:'Sierra Alvaro',  estado:'Enviado',        linea:'Oficinas',  superficie:'11.200 m²', zona:'M-30',       notas:'Alternativa a P.E Avalon.' },
  { id:'PRE-2512', activo:'Edificio Diagonal 95',         cuenta:'Grupo Mediática España',      contacto:'Carmen Fuentes',        fecha_envio:'14/02/2026', visitado:true,  fecha_visita:'21/02/2026', responsable:'García Marta',   estado:'En negociación', linea:'Oficinas',  superficie:'9.800 m²',  zona:'22@',        notas:'Negociando condiciones de arrendamiento.' },
]

const ESTADO_TAG = {
  'Enviado':        'tag-blue',
  'Visitado':       'tag-teal',
  'Sin respuesta':  'tag-amber',
  'En negociación': 'tag-purple',
  'Descartado':     'tag-red',
}

const COLS = [
  { id:'_chk',         label:'',                    sys:true },
  { id:'id',           label:'ID',                  required:true, type:'text',   getValue:r=>r.id },
  { id:'activo',       label:'Activo presentado',   required:true, type:'text',   getValue:r=>r.activo },
  { id:'cuenta',       label:'Cuenta',              required:true, type:'text',   getValue:r=>r.cuenta },
  { id:'contacto',     label:'Contacto',                           type:'text',   getValue:r=>r.contacto },
  { id:'linea',        label:'Línea',                              type:'enum',   getValue:r=>r.linea },
  { id:'zona',         label:'Zona',                               type:'enum',   getValue:r=>r.zona },
  { id:'superficie',   label:'Superficie',                         type:'text',   getValue:r=>r.superficie },
  { id:'fecha_envio',  label:'Fecha envío',                        type:'text',   getValue:r=>r.fecha_envio },
  { id:'visitado',     label:'Visitado',                           type:'enum',   getValue:r=>r.visitado?'Sí':'No' },
  { id:'fecha_visita', label:'Fecha visita',                       type:'text',   getValue:r=>r.fecha_visita||'—' },
  { id:'estado',       label:'Estado',                             type:'enum',   getValue:r=>r.estado },
  { id:'responsable',  label:'Responsable',                        type:'enum',   getValue:r=>r.responsable },
  { id:'notas',        label:'Notas',                              type:'text',   getValue:r=>r.notas },
  { id:'_act',         label:'',                    sys:true },
]

const DEFAULT_VIS = new Set(['_chk','id','activo','cuenta','contacto','fecha_envio','visitado','fecha_visita','estado','responsable','_act'])

export default function PresentacionesList() {
  const { navigate } = useNav()
  const [query,    setQuery]    = useState('')
  const [showAdv,  setShowAdv]  = useState(false)
  const [af, setAf] = useState({ estado:'', linea:'', responsable:'', visitado:'' })
  const [vis, setVis] = useVisibleCols('presentaciones', COLS, DEFAULT_VIS)

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = PRESENTACIONES.filter(p => {
    const q = query.toLowerCase()
    if (q && !p.activo.toLowerCase().includes(q) && !p.cuenta.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !p.contacto.toLowerCase().includes(q)) return false
    if (af.estado      && p.estado !== af.estado) return false
    if (af.linea       && p.linea !== af.linea) return false
    if (af.responsable && p.responsable !== af.responsable) return false
    if (af.visitado === 'Sí' && !p.visitado) return false
    if (af.visitado === 'No' && p.visitado) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  // KPIs
  const total      = PRESENTACIONES.length
  const visitadas  = PRESENTACIONES.filter(p=>p.visitado).length
  const enNeg      = PRESENTACIONES.filter(p=>p.estado==='En negociación').length
  const sinResp    = PRESENTACIONES.filter(p=>p.estado==='Sin respuesta').length
  const convRate   = Math.round((visitadas/total)*100)

  // Activos únicos presentados
  const activosUnicos  = new Set(PRESENTACIONES.map(p=>p.activo)).size
  const cuentasUnicas  = new Set(PRESENTACIONES.map(p=>p.cuenta)).size

  const diasDesde = (fechaStr) => {
    if (!fechaStr) return null
    const [d,m,y] = fechaStr.split('/').map(Number)
    return Math.floor((new Date() - new Date(y,m-1,d))/(1000*60*60*24))
  }

  const cell = (p) => ({
    _chk:         <td key="_chk"><input type="checkbox" onClick={e=>e.stopPropagation()} style={{accentColor:'var(--accent)'}}/></td>,
    id:           <td key="id"><span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text3)'}}>{p.id}</span></td>,
    activo:       <td key="activo"><div className="asset-link" style={{fontWeight:600}} onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>{p.activo}</div><div style={{fontSize:10,color:'var(--text4)'}}>{p.superficie}</div></td>,
    cuenta:       <td key="cuenta"><div style={{fontSize:12,fontWeight:600}}>{p.cuenta}</div><div style={{fontSize:10,color:'var(--text4)'}}>{p.contacto}</div></td>,
    contacto:     <td key="contacto" style={{fontSize:11}}>{p.contacto}</td>,
    linea:        <td key="linea" style={{fontSize:11,color:'var(--text3)'}}>{p.linea}</td>,
    zona:         <td key="zona" style={{fontSize:11}}>{p.zona}</td>,
    superficie:   <td key="superficie" style={{fontSize:11,fontFamily:'var(--mono)'}}>{p.superficie}</td>,
    fecha_envio:  <td key="fecha_envio">
      <div style={{fontSize:11,fontFamily:'var(--mono)'}}>{p.fecha_envio}</div>
      {diasDesde(p.fecha_envio)!==null&&<div style={{fontSize:9,color:'var(--text4)'}}>hace {diasDesde(p.fecha_envio)}d</div>}
    </td>,
    visitado:     <td key="visitado">
      {p.visitado
        ? <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,color:'var(--green)'}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'var(--green)',display:'inline-block'}}/>Sí
          </span>
        : <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,color:'var(--text4)'}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'var(--border)',display:'inline-block'}}/>No
          </span>
      }
    </td>,
    fecha_visita: <td key="fecha_visita" style={{fontSize:11,fontFamily:'var(--mono)',color:p.fecha_visita?'var(--text1)':'var(--text4)'}}>{p.fecha_visita||'—'}</td>,
    estado:       <td key="estado"><span className={`tag ${ESTADO_TAG[p.estado]||'tag-gray'}`}>{p.estado}</span></td>,
    responsable:  <td key="responsable" style={{fontSize:11}}>{p.responsable}</td>,
    notas:        <td key="notas" style={{fontSize:10,color:'var(--text3)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.notas}</td>,
    _act:         <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-presentacion')}}>Ver</button></div></td>,
  })

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(6,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Total presentaciones</div><div className="ks-val">{total}</div></div>
        <div className="ks"><div className="ks-lbl">Activos únicos</div><div className="ks-val" style={{color:'var(--accent)'}}>{activosUnicos}</div></div>
        <div className="ks"><div className="ks-lbl">Cuentas alcanzadas</div><div className="ks-val" style={{color:'var(--purple)'}}>{cuentasUnicas}</div></div>
        <div className="ks"><div className="ks-lbl">Visitadas</div><div className="ks-val green">{visitadas} <span style={{fontSize:11,fontWeight:400,color:'var(--text4)'}}>({convRate}%)</span></div></div>
        <div className="ks"><div className="ks-lbl">En negociación</div><div className="ks-val" style={{color:'var(--teal)'}}>{enNeg}</div></div>
        <div className="ks"><div className="ks-lbl">Sin respuesta</div><div className="ks-val" style={{color:'var(--amber)'}}>{sinResp}</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar activo, cuenta, contacto..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          ⚙ Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll}/>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim" onClick={()=>navigate('ficha-presentacion')}>+ Nueva presentación</button>
        </div>
      </div>

      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Estado">
            <select className="fsel" value={af.estado} onChange={e=>setAf(p=>({...p,estado:e.target.value}))}>
              <option value="">Todos</option>
              <option>Enviado</option><option>Visitado</option><option>Sin respuesta</option><option>En negociación</option><option>Descartado</option>
            </select>
          </Field>
          <Field label="Visitado">
            <select className="fsel" value={af.visitado} onChange={e=>setAf(p=>({...p,visitado:e.target.value}))}>
              <option value="">Todos</option><option value="Sí">Sí</option><option value="No">No</option>
            </select>
          </Field>
          <Field label="Línea">
            <select className="fsel" value={af.linea} onChange={e=>setAf(p=>({...p,linea:e.target.value}))}>
              <option value="">Todas</option>
              <option>Oficinas</option><option>Industrial</option><option>Retail</option><option>Capital Markets</option>
            </select>
          </Field>
          <Field label="Responsable">
            <select className="fsel" value={af.responsable} onChange={e=>setAf(p=>({...p,responsable:e.target.value}))}>
              <option value="">Todos</option>
              <option>Sierra Alvaro</option><option>GOMEZ Ignacio</option><option>García Marta</option>
            </select>
          </Field>
          {advCount>0&&<button onClick={()=>setAf({estado:'',linea:'',responsable:'',visitado:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      {/* Resumen visual por activo */}
      <div style={{padding:'8px 16px',borderBottom:'1px solid var(--border)',display:'flex',gap:8,alignItems:'center',overflowX:'auto'}}>
        <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',flexShrink:0}}>Por activo</span>
        {Array.from(new Set(PRESENTACIONES.map(p=>p.activo))).map(activo=>{
          const rows = PRESENTACIONES.filter(p=>p.activo===activo)
          const vis  = rows.filter(r=>r.visitado).length
          return (
            <div key={activo} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 10px',borderRadius:12,border:'1px solid var(--border)',background:'#fff',fontSize:11,flexShrink:0,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>setQuery(activo)}>
              <span style={{fontWeight:600,color:'var(--text1)'}}>{activo.length>22?activo.slice(0,22)+'…':activo}</span>
              <span style={{fontSize:10,color:'var(--text4)'}}>{rows.length} env.</span>
              <span style={{fontSize:10,fontWeight:700,color:'var(--green)'}}>{vis} vis.</span>
            </div>
          )
        })}
        {query&&<button onClick={()=>setQuery('')} style={{fontSize:10,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',flexShrink:0}}>✕ Ver todos</button>}
      </div>

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c=>
              c.id==='_chk'?<th key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th>:
              c.sys?<th key={c.id}>{c.label}</th>:
              <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={PRESENTACIONES}/>
            )}</tr>
          </thead>
          <tbody>
            {result.map(p=>(
              <tr key={p.id} onClick={()=>navigate('ficha-presentacion')} style={{cursor:'pointer'}}>
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
