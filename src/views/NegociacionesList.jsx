import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import { NEGOCIACIONES } from '../data/mockData'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import { ArrowLeftRight, Hourglass, Check, FileSignature, X, Download, SlidersHorizontal } from 'lucide-react'

const ESTADOS = [
  { key: 'En negociación',     label: 'En negociación',     icon: ArrowLeftRight, color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  { key: 'Pendiente respuesta',label: 'Pdte. respuesta',    icon: Hourglass,       color: '#9d174d', bg: '#fdf2f8', border: '#fbcfe8', dot: '#ec4899' },
  { key: 'Acuerdo alcanzado',  label: 'Acuerdo',            icon: Check,           color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  { key: 'Firmado',            label: 'Firmado',            icon: FileSignature,   color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  { key: 'Rechazado',          label: 'Rechazado',          icon: X,               color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
]

function EstadoTag({ estado }) {
  const s = ESTADOS.find(e => e.key === estado)
  if (!s) return <span className="tag tag-gray">{estado}</span>
  const Ico = s.icon
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:600,color:s.color,background:s.bg,border:`1px solid ${s.border}`,borderRadius:4,padding:'2px 7px'}}>
      <Ico size={11} strokeWidth={1.75} /> {s.label}
    </span>
  )
}

const COLS = [
  { id:'_chk',       label:'',                 sys:true },
  { id:'ref',        label:'ID',                required:true, type:'text', getValue:r=>r.ref },
  { id:'creado',     label:'Creado el',                       type:'text', getValue:r=>r.creado },
  { id:'oportunidad',label:'Oportunidad ★',      required:true, type:'text', getValue:r=>r.oportunidad },
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

function cierreColor(e) {
  if (e === 'Firmado') return 'var(--accent)'
  if (e === 'Acuerdo alcanzado') return 'var(--green)'
  if (e === 'Rechazado') return 'var(--red)'
  if (e === 'Pendiente respuesta') return 'var(--amber)'
  return 'var(--accent)'
}

// ─── KANBAN ──────────────────────────────────────────────────────────────────
function KanbanCard({ n, onClick }) {
  const s = ESTADOS.find(e => e.key === n.estado)
  return (
    <div
      onClick={onClick}
      style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'10px 12px',cursor:'pointer',display:'flex',flexDirection:'column',gap:6,transition:'box-shadow .15s,border-color .15s'}}
      onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.09)'; e.currentTarget.style.borderColor=s?.border||'var(--border)' }}
      onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='var(--border)' }}
    >
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
        <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text4)',fontWeight:600}}>{n.ref}</span>
        <span style={{fontSize:10,color:'var(--text4)'}}>{n.cierre !== '—' ? n.cierre : ''}</span>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:'var(--text)',lineHeight:1.3}}>{n.contraparte}</div>
      <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.4}}>{n.activo}</div>
      <div style={{fontSize:10,color:'var(--text4)'}}>{n.espacio}</div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2,paddingTop:6,borderTop:'1px solid var(--border)'}}>
        <span style={{fontSize:10,color:'var(--text3)'}}>{n.parte}</span>
        <span style={{fontSize:10,color:'var(--text4)',fontStyle:'italic'}} title="Fecha de creación">📅 {n.creado || n.envio || '—'}</span>
      </div>
    </div>
  )
}

function KanbanView({ items, onCard }) {
  return (
    <div style={{flex:1,overflowX:'auto',overflowY:'hidden',padding:'12px 16px'}}>
      <div style={{display:'flex',gap:12,height:'100%',minWidth:900}}>
        {ESTADOS.map(col => {
          const cards = items.filter(n => n.estado === col.key)
          return (
            <div key={col.key} style={{flex:1,minWidth:200,display:'flex',flexDirection:'column',gap:8}}>
              {/* Column header */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',background:col.bg,border:`1px solid ${col.border}`,borderRadius:'var(--r)',flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:700,color:col.color}}>{col.label}</span>
                <span style={{fontSize:11,fontWeight:700,background:col.border,color:col.color,borderRadius:10,padding:'1px 7px',minWidth:20,textAlign:'center'}}>{cards.length}</span>
              </div>
              {/* Cards */}
              <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
                {cards.length === 0
                  ? <div style={{padding:'20px 10px',textAlign:'center',fontSize:11,color:'var(--text4)',border:'1px dashed var(--border)',borderRadius:'var(--r)'}}>Sin negociaciones</div>
                  : cards.map(n => <KanbanCard key={n.ref} n={n} onClick={() => onCard(n)} />)
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function NegociacionesList() {
  const { navigate } = useNav()
  const [query, setQuery] = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ estado:'', equipo:'', parte:'' })
  const [vis, setVis] = useVisibleCols('negociaciones', COLS)
  const [viewMode, setViewMode] = useState('kanban')

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
    creado:     <td key="creado" style={{fontSize:11,color:'var(--text3)',whiteSpace:'nowrap'}}>{n.creado || n.envio || '—'}</td>,
    oportunidad:<td key="oportunidad" title="FK Oportunidad obligatorio · Cuenta heredada">{n.oportunidad ? <span style={{fontFamily:'var(--mono)',fontSize:10,fontWeight:700,color:'#1e40af',background:'#dbeafe',padding:'2px 7px',borderRadius:6,whiteSpace:'nowrap'}} onClick={e=>{e.stopPropagation();navigate('ficha-oportunidad',{id:n.oportunidad})}}>D · {n.oportunidad}</span> : <span style={{color:'var(--red)',fontSize:10,fontWeight:600}}>★ FALTA</span>}</td>,
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

  const totEnCurso   = NEGOCIACIONES.filter(n => n.estado === 'En negociación').length
  const totPdte      = NEGOCIACIONES.filter(n => n.estado === 'Pendiente respuesta').length
  const totAcuerdo   = NEGOCIACIONES.filter(n => n.estado === 'Acuerdo alcanzado').length
  const totFirmado   = NEGOCIACIONES.filter(n => n.estado === 'Firmado').length
  const totRechazado = NEGOCIACIONES.filter(n => n.estado === 'Rechazado').length

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <div className="ks"><div className="ks-lbl">En negociación</div><div className="ks-val amber">{totEnCurso}</div></div>
        <div className="ks"><div className="ks-lbl">Pdte. respuesta</div><div className="ks-val" style={{color:'#9d174d'}}>{totPdte}</div></div>
        <div className="ks"><div className="ks-lbl">Acuerdo alcanzado</div><div className="ks-val green">{totAcuerdo}</div></div>
        <div className="ks"><div className="ks-lbl">Firmado</div><div className="ks-val" style={{color:'var(--accent)'}}>{totFirmado}</div></div>
        <div className="ks"><div className="ks-lbl">Rechazado</div><div className="ks-val" style={{color:'var(--red)'}}>{totRechazado}</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar negociaciones..." value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <button className="tbtn" onClick={()=>setShowAdv(v=>!v)} style={showAdv||advCount>0?{borderColor:'var(--accent)',color:'var(--accent)',background:'var(--accent-lt)'}:{}}>
          <SlidersHorizontal size={14} strokeWidth={1.75} /> Filtros{advCount>0&&<span style={{marginLeft:4,fontSize:9,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 5px'}}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll}/>

        {/* View toggle */}
        <div style={{display:'flex',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden',flexShrink:0}}>
          <button
            onClick={()=>setViewMode('kanban')}
            style={{padding:'5px 10px',border:'none',background:viewMode==='kanban'?'var(--accent)':'var(--surface)',color:viewMode==='kanban'?'#fff':'var(--text3)',cursor:'pointer',fontSize:11,fontFamily:'inherit',display:'flex',alignItems:'center',gap:4,transition:'background .15s'}}
            title="Vista Kanban"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><rect x="1" y="1" width="3.5" height="12" rx="1"/><rect x="5.5" y="1" width="3.5" height="8" rx="1"/><rect x="10" y="1" width="3.5" height="10" rx="1"/></svg>
            Kanban
          </button>
          <button
            onClick={()=>setViewMode('tabla')}
            style={{padding:'5px 10px',border:'none',borderLeft:'1px solid var(--border)',background:viewMode==='tabla'?'var(--accent)':'var(--surface)',color:viewMode==='tabla'?'#fff':'var(--text3)',cursor:'pointer',fontSize:11,fontFamily:'inherit',display:'flex',alignItems:'center',gap:4,transition:'background .15s'}}
            title="Vista Tabla"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><rect x="1" y="1" width="12" height="12" rx="1"/><path d="M1 5h12M1 9h12M5 1v12"/></svg>
            Tabla
          </button>
        </div>

        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          {viewMode === 'tabla' && <ColumnEditor cols={COLS} vis={vis} setVis={setVis}/>}
          <button className="tbtn"><Download size={14} strokeWidth={1.75} /> Exportar</button>
          <button className="tbtn prim">+ Nueva negociación</button>
        </div>
      </div>

      {showAdv && (
        <div style={{padding:'10px 16px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-end'}}>
          <Field label="Estado">
            <select className="fsel" value={af.estado} onChange={e=>setAf(p=>({...p,estado:e.target.value}))}>
              <option value="">Todos</option>
              {ESTADOS.map(e=><option key={e.key}>{e.key}</option>)}
            </select>
          </Field>
          <Field label="Equipo"><select className="fsel" value={af.equipo} onChange={e=>setAf(p=>({...p,equipo:e.target.value}))}><option value="">Todos</option><option>Transaction Spain</option><option>Leasing Oficinas MAD</option></select></Field>
          <Field label="Consultor"><select className="fsel" value={af.parte} onChange={e=>setAf(p=>({...p,parte:e.target.value}))}><option value="">Todos</option><option>Sierra Álvaro</option><option>Alonso Abruña D.</option><option>GOMEZ Ignacio</option></select></Field>
          {advCount>0&&<button onClick={()=>setAf({estado:'',equipo:'',parte:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      {viewMode === 'kanban' && <KanbanView items={result} onCard={() => navigate('ficha-negociacion')} />}

      {viewMode === 'tabla' && (
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
      )}
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
