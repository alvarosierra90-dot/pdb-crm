import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import SeleccionarActivoModal from '../components/SeleccionarActivoModal'
import { Download, SlidersHorizontal, AlertTriangle } from 'lucide-react'

// Datos mock que siempre aparecen (arrendatarios demostración)
const MOCK_ARRENDATARIOS = [
  { id:'ARR-2501', arrendatario:'Oracle Spain SL',          activo:'Albatros Edif. D',          zona:'A-1',                subzona:'Alcobendas',      superficie:13486, renta_media:12.50, propietario:'Merlín Properties SOCIMI', tipo_alquiler:'Alquiler comercial', area:'Periferia',    sector:'Tecnología',          anyo_firma:2021, trimestre:'Q2', fecha_inicio:'01/07/2021', break_option:'01/07/2024', fecha_fin:'30/06/2026', fecha_recordatorio:'01/04/2024', estado:'Próximo a vencimiento', responsable:'Sierra Alvaro',  ultima_act:'28/03/2026', _mock:true },
  { id:'ARR-2502', arrendatario:'Pharma Group Spain',       activo:'Edificio Diagonal 95',      zona:'22@',                subzona:'Poblenou',        superficie:820,   renta_media:22.00, propietario:'FREO Investments Spain SL', tipo_alquiler:'Alquiler comercial', area:'Descentralizado',sector:'Sanidad',             anyo_firma:2022, trimestre:'Q1', fecha_inicio:'01/02/2022', break_option:'01/02/2025', fecha_fin:'31/01/2027', fecha_recordatorio:'01/11/2024', estado:'En negociación',        responsable:'GOMEZ Ignacio',  ultima_act:'26/03/2026', _mock:true },
  { id:'ARR-2503', arrendatario:'Amazon Logistics',         activo:'Park Logístico Getafe',     zona:'Corredor del Henares',subzona:'Getafe',          superficie:24000, renta_media:6.80,  propietario:'Merlín Properties SOCIMI', tipo_alquiler:'Alquiler industrial', area:'Periferia',    sector:'Logística',           anyo_firma:2020, trimestre:'Q4', fecha_inicio:'01/01/2021', break_option:'01/01/2024', fecha_fin:'31/12/2025', fecha_recordatorio:'01/10/2023', estado:'Próximo a vencimiento', responsable:'Sierra Alvaro',  ultima_act:'15/03/2026', _mock:true },
  { id:'ARR-2504', arrendatario:'Generali Real Estate',     activo:'Torre Glòries',             zona:'22@',                subzona:'Poblenou',        superficie:5200,  renta_media:28.00, propietario:'Merlín Properties SOCIMI', tipo_alquiler:'Alquiler comercial', area:'Descentralizado',sector:'Finanzas / Inversión', anyo_firma:2023, trimestre:'Q3', fecha_inicio:'01/10/2023', break_option:'01/10/2026', fecha_fin:'30/09/2028', fecha_recordatorio:'01/07/2026', estado:'Activo',               responsable:'García Marta',   ultima_act:'10/03/2026', _mock:true },
  { id:'ARR-2505', arrendatario:'Grupo Mediática España',   activo:'P.E Avalon',                zona:'M-30',               subzona:'Julián Camarillo',superficie:8200,  renta_media:10.50, propietario:'FREO Investments Spain SL', tipo_alquiler:'Alquiler comercial', area:'Descentralizado',sector:'Comunicación / Media', anyo_firma:2020, trimestre:'Q1', fecha_inicio:'01/03/2020', break_option:'01/03/2025', fecha_fin:'28/02/2027', fecha_recordatorio:'01/12/2024', estado:'Próximo a vencimiento', responsable:'GOMEZ Ignacio',  ultima_act:'12/01/2026', _mock:true },
  { id:'ARR-2506', arrendatario:'Centro Médico Integra SL', activo:'Parque Empresarial Norte',  zona:'M-30',               subzona:'Hortaleza',       superficie:2100,  renta_media:16.80, propietario:'FREO Investments Spain SL', tipo_alquiler:'Alquiler comercial', area:'Descentralizado',sector:'Sanidad',             anyo_firma:2023, trimestre:'Q2', fecha_inicio:'01/07/2023', break_option:'01/07/2026', fecha_fin:'30/06/2028', fecha_recordatorio:'01/04/2026', estado:'Próximo a vencimiento', responsable:'Sierra Alvaro',  ultima_act:'07/04/2026', _mock:true },
  { id:'ARR-2507', arrendatario:'Consulting Tech Partners', activo:'Torre Castellana 200',      zona:'CBD',                subzona:'Castellana',      superficie:440,   renta_media:22.00, propietario:'Merlín Properties SOCIMI', tipo_alquiler:'Alquiler comercial', area:'CBD',          sector:'Consultoría',         anyo_firma:2023, trimestre:'Q3', fecha_inicio:'15/09/2023', break_option:'15/09/2026', fecha_fin:'14/09/2028', fecha_recordatorio:'15/06/2026', estado:'Activo',               responsable:'GOMEZ Ignacio',  ultima_act:'01/03/2026', _mock:true },
]

function isoToDisplay(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function mapDbRow(r) {
  return {
    id:              r.ref || r.id,
    _dbId:           r.id,
    arrendatario:    r.tenant || r.nombre || '—',
    activo:          r.edificio || r.activo_ref || '—',
    activo_ref:      r.activo_ref || null,
    zona:            r.zona || '—',
    subzona:         r.subzona || '—',
    superficie:      r.superficie || 0,
    renta_media:     r.closing_rent ?? r.renta ?? 0,
    propietario:     r.propietario_cuenta || '—',
    tipo_alquiler:   r.tipo_contrato || '—',
    area:            r.area_zona || '—',
    sector:          r.sector || '—',
    anyo_firma:      r.anyo_firma || null,
    trimestre:       r.trimestre || '—',
    fecha_inicio:    r.inicio ? isoToDisplay(r.inicio) : '—',
    break_option:    r.break_option ? isoToDisplay(r.break_option) : '—',
    fecha_fin:       r.vencimiento ? isoToDisplay(r.vencimiento) : '—',
    fecha_recordatorio: '—',
    estado:          r.estado_arr || r.estado || 'Activo',
    responsable:     r.agente_activo || r.responsable || '—',
    ultima_act:      r.updated_at ? isoToDisplay(r.updated_at.split('T')[0]) : isoToDisplay(r.created_at?.split('T')[0]),
    planta:          r.planta || null,
    color:           r.color || '#3b82f6',
    _real:           true,
  }
}

// Exported for compatibility (mock data only — real data via Supabase)
export const ARRENDATARIOS = MOCK_ARRENDATARIOS

const ESTADO_TAG = { 'Activo':'tag-green', 'Próximo a vencimiento':'tag-red', 'En negociación':'tag-purple', 'Renovado':'tag-blue', 'Finalizado':'tag-gray', 'Vigente':'tag-green' }

function diasHastaFecha(fechaStr) {
  if (!fechaStr || fechaStr === '—') return null
  const [d,m,y] = fechaStr.split('/').map(Number)
  const diff = new Date(y,m-1,d) - new Date()
  return Math.ceil(diff/(1000*60*60*24))
}

function BreakPill({ fecha }) {
  const dias = diasHastaFecha(fecha)
  if (dias === null) return <span style={{color:'var(--text4)'}}>—</span>
  if (dias < 0)    return <span style={{fontSize:10,fontWeight:700,color:'var(--red)',background:'var(--red-lt)',border:'1px solid var(--red-bd)',padding:'1px 7px',borderRadius:9}}>Vencida {Math.abs(dias)}d</span>
  if (dias <= 90)  return <span style={{fontSize:10,fontWeight:700,color:'var(--red)',background:'var(--red-lt)',border:'1px solid var(--red-bd)',padding:'1px 7px',borderRadius:9,display:'inline-flex',alignItems:'center',gap:3}}><AlertTriangle size={10} strokeWidth={2} /> {dias}d</span>
  if (dias <= 180) return <span style={{fontSize:10,fontWeight:700,color:'var(--amber)',background:'var(--amber-lt)',border:'1px solid var(--amber-bd)',padding:'1px 7px',borderRadius:9}}>⏳ {dias}d</span>
  return <span style={{fontSize:11,color:'var(--text3)'}}>{fecha}</span>
}

const COLS = [
  { id:'_chk',         label:'',                   sys:true },
  { id:'id',           label:'ID',                 required:true, type:'text',   getValue:r=>r.id },
  { id:'arrendatario', label:'Arrendatario',        required:true, type:'text',   getValue:r=>r.arrendatario },
  { id:'activo',       label:'Activo',              required:true, type:'text',   getValue:r=>r.activo },
  { id:'zona',         label:'Zona',                              type:'enum',   getValue:r=>r.zona },
  { id:'subzona',      label:'Sub-zona',                          type:'enum',   getValue:r=>r.subzona },
  { id:'superficie',   label:'Sup. m²',                           type:'number', getValue:r=>r.superficie },
  { id:'renta_media',  label:'Renta €/m²',                        type:'number', getValue:r=>r.renta_media },
  { id:'propietario',  label:'Propietario',                       type:'enum',   getValue:r=>r.propietario },
  { id:'tipo_alquiler',label:'Tipo alquiler',                     type:'enum',   getValue:r=>r.tipo_alquiler },
  { id:'area',         label:'Área',                              type:'enum',   getValue:r=>r.area },
  { id:'sector',       label:'Sector',                            type:'enum',   getValue:r=>r.sector },
  { id:'anyo_firma',   label:'Año firma',                         type:'number', getValue:r=>r.anyo_firma },
  { id:'trimestre',    label:'Trimestre',                         type:'enum',   getValue:r=>r.trimestre },
  { id:'fecha_inicio', label:'Inicio contrato',                   type:'text',   getValue:r=>r.fecha_inicio },
  { id:'break_option', label:'Break option',                      type:'text',   getValue:r=>r.break_option },
  { id:'fecha_fin',    label:'Fin contrato',                      type:'text',   getValue:r=>r.fecha_fin },
  { id:'recordatorio', label:'Recordatorio',                      type:'text',   getValue:r=>r.fecha_recordatorio },
  { id:'estado',       label:'Estado',                            type:'enum',   getValue:r=>r.estado },
  { id:'responsable',  label:'Responsable',                       type:'enum',   getValue:r=>r.responsable },
  { id:'ultima_act',   label:'Última actualiz.',                  type:'text',   getValue:r=>r.ultima_act },
  { id:'_act',         label:'',                   sys:true },
]

const DEFAULT_VIS = new Set(['_chk','id','arrendatario','activo','zona','superficie','renta_media','propietario','estado','break_option','fecha_fin','responsable','_act'])

export default function ArrendatariosList() {
  const { navigate } = useNav()
  const [query,   setQuery]   = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ estado:'', propietario:'', sector:'', area:'', zona:'', responsable:'' })
  const [vis, setVis] = useVisibleCols('arrendatarios', COLS, DEFAULT_VIS)
  const [dbRows, setDbRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNuevo, setShowNuevo] = useState(false)

  useEffect(() => {
    supabase.from('arrendatarios').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) setDbRows(data.map(mapDbRow))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Combine: real DB rows first, then mocks
  const allRows = [...dbRows, ...MOCK_ARRENDATARIOS]

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = allRows.filter(a => {
    const q = query.toLowerCase()
    if (q && !a.arrendatario.toLowerCase().includes(q) && !(a.activo||'').toLowerCase().includes(q) && !(a.id||'').toLowerCase().includes(q)) return false
    if (af.estado      && a.estado !== af.estado) return false
    if (af.propietario && a.propietario !== af.propietario) return false
    if (af.sector      && a.sector !== af.sector) return false
    if (af.area        && a.area !== af.area) return false
    if (af.zona        && a.zona !== af.zona) return false
    if (af.responsable && a.responsable !== af.responsable) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  const totalSup   = allRows.reduce((s,a)=>s+(a.superficie||0),0)
  const rentaAnual = allRows.reduce((s,a)=>s+(a.superficie||0)*(a.renta_media||0)*12,0)
  const nActivos   = allRows.filter(a=>a.estado==='Activo'||a.estado==='Vigente').length
  const nAlertas   = allRows.filter(a=>a.estado==='Próximo a vencimiento').length

  const handleRowClick = (a) => {
    if (a._real) {
      navigate('ficha-arrendatario', { tenantName: a.arrendatario, fromActivoRef: a.activo_ref })
    } else {
      navigate('ficha-arrendatario')
    }
  }

  const cell = (a) => ({
    _chk:         <td key="_chk"><input type="checkbox" onClick={e=>e.stopPropagation()} style={{accentColor:'var(--accent)'}}/></td>,
    id:           <td key="id">
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      {a._real && <div style={{width:6,height:6,borderRadius:'50%',background:a.color||'var(--accent)',flexShrink:0}} title="Registro real"/>}
                      <span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{a.id}</span>
                    </div>
                  </td>,
    arrendatario: <td key="arrendatario">
                    <div className="asset-link">{a.arrendatario}</div>
                    <div className="asset-sub">{a.sector !== '—' ? a.sector : ''}{a.planta ? ` · Planta ${a.planta}` : ''}</div>
                  </td>,
    activo:       <td key="activo"><div className="asset-link" onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>{a.activo}</div></td>,
    zona:         <td key="zona" style={{fontSize:11,fontWeight:500}}>{a.zona}</td>,
    subzona:      <td key="subzona" style={{fontSize:11,color:'var(--text3)'}}>{a.subzona}</td>,
    superficie:   <td key="superficie" className="mono">{a.superficie ? a.superficie.toLocaleString('es-ES')+' m²' : '—'}</td>,
    renta_media:  <td key="renta_media" className="mono">{a.renta_media ? a.renta_media.toFixed(2)+' €/m²' : '—'}</td>,
    propietario:  <td key="propietario" style={{fontSize:11}}>{a.propietario}</td>,
    tipo_alquiler:<td key="tipo_alquiler"><span className="tag tag-gray" style={{fontSize:9}}>{a.tipo_alquiler}</span></td>,
    area:         <td key="area">{a.area !== '—' ? <span className="tag tag-blue" style={{fontSize:9}}>{a.area}</span> : <span style={{color:'var(--text4)'}}>—</span>}</td>,
    sector:       <td key="sector" style={{fontSize:11,color:'var(--text3)'}}>{a.sector}</td>,
    anyo_firma:   <td key="anyo_firma" style={{fontSize:11}}>{a.anyo_firma || '—'}</td>,
    trimestre:    <td key="trimestre">{a.trimestre !== '—' ? <span className="tag tag-teal" style={{fontSize:9}}>{a.trimestre}</span> : <span style={{color:'var(--text4)'}}>—</span>}</td>,
    fecha_inicio: <td key="fecha_inicio" style={{fontSize:11,color:'var(--text3)'}}>{a.fecha_inicio}</td>,
    break_option: <td key="break_option"><BreakPill fecha={a.break_option}/></td>,
    fecha_fin:    <td key="fecha_fin" style={{fontSize:11,fontWeight:500}}>{a.fecha_fin}</td>,
    recordatorio: <td key="recordatorio" style={{fontSize:11,color:'var(--text3)'}}>{a.fecha_recordatorio}</td>,
    estado:       <td key="estado"><span className={`tag ${ESTADO_TAG[a.estado]||'tag-gray'}`}>{a.estado}</span></td>,
    responsable:  <td key="responsable" style={{fontSize:11}}>{a.responsable}</td>,
    ultima_act:   <td key="ultima_act" style={{fontSize:11,color:'var(--text3)'}}>{a.ultima_act}</td>,
    _act:         <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e=>{e.stopPropagation();handleRowClick(a)}}>Ver</button></div></td>,
  })

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>

      {nAlertas > 0 && (
        <div style={{padding:'8px 16px',background:'#fff7ed',borderBottom:'1px solid #fed7aa',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <AlertTriangle size={16} strokeWidth={1.75} style={{color:'#c2410c',flexShrink:0}} />
          <span style={{fontSize:11,fontWeight:600,color:'#c2410c'}}>
            {nAlertas} arrendatario{nAlertas>1?'s':''} próximo{nAlertas>1?'s':''} a vencimiento — revisa break options y activa equipo comercial
          </span>
          <button className="tbtn" style={{marginLeft:'auto',fontSize:10,borderColor:'#fed7aa',color:'#c2410c'}} onClick={()=>setAf(p=>({...p,estado:'Próximo a vencimiento'}))}>Ver alertas</button>
        </div>
      )}

      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Total arrendatarios</div><div className="ks-val">{allRows.length}</div><div className="ks-sub">{dbRows.length} reales · {MOCK_ARRENDATARIOS.length} demo</div></div>
        <div className="ks"><div className="ks-lbl">Activos / Vigentes</div><div className="ks-val green">{nActivos}</div></div>
        <div className="ks"><div className="ks-lbl">Próx. vencimiento</div><div className="ks-val red">{nAlertas}</div><div className="ks-sub">Break option activa</div></div>
        <div className="ks"><div className="ks-lbl">Sup. total ocupada</div><div className="ks-val">{(totalSup/1000).toFixed(1)}k m²</div></div>
        <div className="ks"><div className="ks-lbl">Renta anual total</div><div className="ks-val" style={{color:'var(--accent)'}}>{(rentaAnual/1000000).toFixed(2)} M€</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar arrendatario, activo..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          <SlidersHorizontal size={14} strokeWidth={1.75} /> Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll}/>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>
          <button className="tbtn"><Download size={14} strokeWidth={1.75} /> Exportar</button>
          <button className="tbtn prim" onClick={()=>setShowNuevo(true)}>+ Nuevo arrendatario</button>
        </div>
      </div>

      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Estado">
            <select className="fsel" value={af.estado} onChange={e=>setAf(p=>({...p,estado:e.target.value}))}>
              <option value="">Todos</option><option>Activo</option><option>Vigente</option><option>Próximo a vencimiento</option><option>En negociación</option><option>Renovado</option><option>Finalizado</option>
            </select>
          </Field>
          <Field label="Propietario">
            <select className="fsel" value={af.propietario} onChange={e=>setAf(p=>({...p,propietario:e.target.value}))}>
              <option value="">Todos</option><option>Merlín Properties SOCIMI</option><option>FREO Investments Spain SL</option>
            </select>
          </Field>
          <Field label="Sector">
            <select className="fsel" value={af.sector} onChange={e=>setAf(p=>({...p,sector:e.target.value}))}>
              <option value="">Todos</option><option>Tecnología</option><option>Logística</option><option>Sanidad</option><option>Comunicación / Media</option><option>Finanzas / Inversión</option><option>Consultoría</option>
            </select>
          </Field>
          <Field label="Área">
            <select className="fsel" value={af.area} onChange={e=>setAf(p=>({...p,area:e.target.value}))}>
              <option value="">Todas</option><option>CBD</option><option>Centro</option><option>Descentralizado</option><option>Periferia</option>
            </select>
          </Field>
          <Field label="Zona">
            <select className="fsel" value={af.zona} onChange={e=>setAf(p=>({...p,zona:e.target.value}))}>
              <option value="">Todas</option><option>M-30</option><option>A-1</option><option>22@</option><option>CBD</option><option>Corredor del Henares</option>
            </select>
          </Field>
          <Field label="Responsable">
            <select className="fsel" value={af.responsable} onChange={e=>setAf(p=>({...p,responsable:e.target.value}))}>
              <option value="">Todos</option><option>Sierra Alvaro</option><option>GOMEZ Ignacio</option><option>García Marta</option>
            </select>
          </Field>
          {advCount>0&&<button onClick={()=>setAf({estado:'',propietario:'',sector:'',area:'',zona:'',responsable:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        {loading ? (
          <div style={{padding:'40px 24px',color:'var(--text4)',fontSize:13,textAlign:'center'}}>Cargando arrendatarios...</div>
        ) : (
          <table className="main-tbl">
            <thead>
              <tr>{visibleCols.map(c=>
                c.id==='_chk'?<th key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th>:
                c.sys?<th key={c.id}>{c.label}</th>:
                <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={allRows}/>
              )}</tr>
            </thead>
            <tbody>
              {result.map((a,i)=>(
                <tr key={a.id+i} onClick={()=>handleRowClick(a)} style={{cursor:'pointer',opacity:a.estado==='Finalizado'?.6:1}}>
                  {visibleCols.map(c=>cell(a)[c.id])}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNuevo && <SeleccionarActivoModal tipo="arrendatario" onClose={() => setShowNuevo(false)} />}
    </div>
  )
}

function Field({label,children}){
  return <div style={{display:'flex',flexDirection:'column',gap:3}}><span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</span>{children}</div>
}
