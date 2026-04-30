import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

// Mandatos viven en Supabase (migración 020 los migró todos).
// Aquí queda solo el mapeo display + computados (días restantes, estado UI).

const TIPO_LABEL = { alquiler:'Alquiler', venta:'Venta', demanda:'Demanda', consultoria:'Consultoría' }
const TIPO_TAG   = { Alquiler:'tag-blue', Venta:'tag-purple', Demanda:'tag-amber', 'Consultoría':'tag-teal' }
const EXCL_LABEL = { exclusiva:'Exclusiva', coexclusiva:'Coexclusiva' }
const EXCL_TAG   = { Exclusiva:'tag-purple', Coexclusiva:'tag-teal' }
const ESTADO_TAG = { Activo:'tag-green', Alerta:'tag-amber', Vencido:'tag-red', Cancelado:'tag-gray' }

function fmtDateEs(s) { if (!s) return '—'; return new Date(s).toLocaleDateString('es-ES') }
function diasEntre(d) { if (!d) return null; const t = new Date(d).getTime(); return Math.round((t - Date.now()) / 86400000) }
function ini(s){ return (s||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() }

function DiasRestantes({ n }) {
  if (n === null) return <span style={{fontSize:10,color:'var(--text4)'}}>—</span>
  if (n < 0)   return <span style={{fontSize:10,fontWeight:700,color:'var(--red)',background:'var(--red-lt)',border:'1px solid var(--red-bd)',padding:'1px 7px',borderRadius:9}}>Vencido {Math.abs(n)}d</span>
  if (n <= 30) return <span style={{fontSize:10,fontWeight:700,color:'var(--red)',background:'var(--red-lt)',border:'1px solid var(--red-bd)',padding:'1px 7px',borderRadius:9}}>⚠ {n}d restantes</span>
  if (n <= 60) return <span style={{fontSize:10,fontWeight:700,color:'var(--amber)',background:'var(--amber-lt)',border:'1px solid var(--amber-bd)',padding:'1px 7px',borderRadius:9}}>⏳ {n}d restantes</span>
  if (n <= 90) return <span style={{fontSize:10,fontWeight:600,color:'var(--accent)',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',padding:'1px 7px',borderRadius:9}}>{n}d restantes</span>
  return <span style={{fontSize:10,fontWeight:600,color:'var(--text3)'}}>{n}d restantes</span>
}

const COLS = [
  { id: '_chk',         label: '',                 sys: true },
  { id: 'ref',          label: 'ID',               required: true, type:'text',   getValue: r => r.ref },
  { id: 'titulo',       label: 'Mandato',          required: true, type:'text',   getValue: r => r.titulo },
  { id: 'cuenta',       label: 'Cuenta',           required: true, type:'text',   getValue: r => r.cuenta },
  { id: 'activos',      label: 'Activos',                          type:'text',   getValue: r => r.activosRefs.join(', ') },
  { id: 'tipo',         label: 'Tipo',                             type:'enum',   getValue: r => r.tipoLabel },
  { id: 'excl',         label: 'Exclusividad',                     type:'enum',   getValue: r => r.exclLabel },
  { id: 'departamento', label: 'Departamento',                     type:'enum',   getValue: r => r.departamento },
  { id: 'responsable',  label: 'Responsable',                      type:'enum',   getValue: r => r.responsable },
  { id: 'fecha_inicio', label: 'Fecha inicio',                     type:'text',   getValue: r => r.fecha_inicio },
  { id: 'fecha_fin',    label: 'Fecha fin',                        type:'text',   getValue: r => r.fecha_vencimiento },
  { id: 'prorroga',     label: 'Prórr. tácita' },
  { id: 'estado',       label: 'Estado',                           type:'enum',   getValue: r => r.estadoUI },
  { id: 'vencimiento',  label: 'Vencimiento',                      type:'number', getValue: r => r.dias_restantes ?? 999 },
  { id: 'fee',          label: 'Fee %',                            type:'number', getValue: r => r.fee_porcentaje ?? 0 },
  { id: '_act',         label: '',                 sys: true },
]

const ACTIVOS_VALIDOS = ['en_curso']
const DESACTIVADOS    = ['cerrado','cancelado']

export default function MandatosList() {
  const { navigate } = useNav()
  const [query, setQuery] = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ tipo:'', excl:'', estado:'', departamento:'', provincia:'' })
  const [vis, setVis] = useVisibleCols('mandatos', COLS)
  const [rows, setRows] = useState([])
  const [vista, setVista] = useState('activas')
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('mandatos')
        .select(`
          id, ref, titulo, tipo, via, exclusividad, exclusividad_modo, estado, motivo_cancelacion,
          fecha_firma, fecha_inicio, fecha_vencimiento, preaviso_dias, alerta_dias,
          prorroga_tacita, prorroga_meses,
          fee_porcentaje, fee_eur_fijo, fee_min_garantizado,
          responsable, equipo, departamento, provincia, zona,
          dynamics_account_id, cuenta_agente_id,
          dynamics_accounts:dynamics_account_id ( nombre ),
          mandato_activos ( id, sba_asignada, activos ( id, ref, nombre ) )
        `)
        .order('created_at', { ascending: false })

      if (cancel) return
      if (error) { console.error('Error mandatos:', error); setRows([]); setLoading(false); return }

      const mapped = (data || []).map(m => {
        const dr = diasEntre(m.fecha_vencimiento)
        const tipoLabel = TIPO_LABEL[m.tipo] || m.tipo || '—'
        const exclLabel = m.exclusividad_modo ? EXCL_LABEL[m.exclusividad_modo] : (m.exclusividad ? 'Exclusiva' : '—')
        let estadoUI = '—'
        if (m.estado === 'cancelado') estadoUI = 'Cancelado'
        else if (m.estado === 'cerrado' || (dr !== null && dr < 0)) estadoUI = 'Vencido'
        else if (dr !== null && dr <= 30) estadoUI = 'Alerta'
        else estadoUI = 'Activo'

        const activos = (m.mandato_activos || []).map(ma => ma.activos).filter(Boolean)
        return {
          id: m.id,
          ref: m.ref,
          titulo: m.titulo || `Mandato ${m.ref}`,
          cuenta: m.dynamics_accounts?.nombre || '(Cuenta pendiente)',
          activos,
          activosRefs: activos.map(a => a.nombre || a.ref),
          tipoLabel,
          exclLabel,
          departamento: m.departamento || '—',
          provincia: m.provincia || '—',
          zona: m.zona || '',
          responsable: m.responsable || '—',
          fecha_inicio: fmtDateEs(m.fecha_inicio || m.fecha_firma),
          fecha_vencimiento: fmtDateEs(m.fecha_vencimiento),
          prorroga_tacita: m.prorroga_tacita,
          prorroga_meses: m.prorroga_meses || 0,
          dias_restantes: dr,
          fee_porcentaje: m.fee_porcentaje,
          estadoUI,
          _estado: m.estado,
          _activa: ACTIVOS_VALIDOS.includes(m.estado),
          _desactivada: DESACTIVADOS.includes(m.estado),
          _sba: (m.mandato_activos || []).reduce((s, ma) => s + (Number(ma.sba_asignada) || 0), 0),
        }
      })
      setRows(mapped)
      setLoading(false)
    }
    load()
    return () => { cancel = true }
  }, [reloadKey])

  const activas      = rows.filter(r => r._activa)
  const desactivadas = rows.filter(r => r._desactivada)
  const vistaList    = vista === 'activas' ? activas : desactivadas

  const advCount = Object.values(af).filter(Boolean).length
  const preFiltered = vistaList.filter(m => {
    const q = query.toLowerCase()
    if (q && !m.titulo.toLowerCase().includes(q) && !m.cuenta.toLowerCase().includes(q) && !m.ref.toLowerCase().includes(q)) return false
    if (af.tipo         && m.tipoLabel    !== af.tipo) return false
    if (af.excl         && m.exclLabel    !== af.excl) return false
    if (af.estado       && m.estadoUI     !== af.estado) return false
    if (af.departamento && m.departamento !== af.departamento) return false
    if (af.provincia    && m.provincia    !== af.provincia) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  // KPIs sobre activas
  const total       = rows.length
  const activosCount = activas.filter(m => m.estadoUI === 'Activo').length
  const alertas     = activas.filter(m => m.estadoUI === 'Alerta').length
  const vencidos    = rows.filter(m => m.estadoUI === 'Vencido').length
  const exclusivas  = activas.filter(m => m.exclLabel === 'Exclusiva').length
  const coexcl      = activas.filter(m => m.exclLabel === 'Coexclusiva').length
  const sbaTotal    = activas.reduce((s, m) => s + m._sba, 0)

  const cell = (m) => ({
    _chk:        <td key="_chk"><input type="checkbox" onClick={e=>e.stopPropagation()} style={{accentColor:'var(--accent)'}}/></td>,
    ref:         <td key="ref"><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:11}}>{m.ref}</span></td>,
    titulo:      <td key="titulo"><div className="asset-link">{m.titulo}</div>{m.zona && <div className="asset-sub mono">{m.zona}</div>}</td>,
    departamento:<td key="departamento" style={{fontSize:11,fontWeight:500}}>{m.departamento}</td>,
    cuenta:      <td key="cuenta"><div style={{fontSize:11,fontWeight:500,color:'var(--text)'}}>{m.cuenta}</div><div className="asset-sub">{m.provincia}</div></td>,
    activos:     <td key="activos">
      {m.activosRefs.length === 0
        ? <span style={{fontSize:10,color:'var(--text4)'}}>—</span>
        : <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {m.activosRefs.slice(0,2).map(a=><span key={a} style={{fontSize:10,color:'var(--accent)',fontWeight:500}}>{a}</span>)}
            {m.activosRefs.length>2&&<span style={{fontSize:9,color:'var(--text4)'}}>+{m.activosRefs.length-2} más</span>}
          </div>
      }
    </td>,
    tipo:        <td key="tipo"><span className={`tag ${TIPO_TAG[m.tipoLabel]||'tag-gray'}`}>{m.tipoLabel}</span></td>,
    excl:        <td key="excl"><span className={`tag ${EXCL_TAG[m.exclLabel]||'tag-gray'}`}>{m.exclLabel}</span></td>,
    responsable: <td key="responsable">
      <div style={{display:'flex',alignItems:'center',gap:5}}>
        <div style={{width:20,height:20,borderRadius:'50%',background:'var(--accent-lt)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,flexShrink:0}}>{ini(m.responsable)}</div>
        <span style={{fontSize:11}}>{m.responsable}</span>
      </div>
    </td>,
    fecha_inicio:<td key="fecha_inicio" style={{fontSize:11,color:'var(--text3)'}}>{m.fecha_inicio}</td>,
    fecha_fin:   <td key="fecha_fin" style={{fontSize:11,fontWeight:m.dias_restantes!==null&&m.dias_restantes<=60?600:400,color:m.dias_restantes!==null&&m.dias_restantes<=30?'var(--red)':m.dias_restantes!==null&&m.dias_restantes<=60?'var(--amber)':'var(--text2)'}}>{m.fecha_vencimiento}</td>,
    prorroga:    <td key="prorroga" style={{textAlign:'center'}}>{m.prorroga_tacita ? <span style={{fontSize:10,fontWeight:600,color:'var(--teal)'}}>✓ {m.prorroga_meses}m</span> : <span style={{fontSize:10,color:'var(--text4)'}}>—</span>}</td>,
    estado:      <td key="estado"><span className={`tag ${ESTADO_TAG[m.estadoUI]||'tag-gray'}`}>{m.estadoUI}</span></td>,
    vencimiento: <td key="vencimiento"><DiasRestantes n={m.dias_restantes}/></td>,
    fee:         <td key="fee" className="mono" style={{fontSize:11}}>{m.fee_porcentaje != null ? `${m.fee_porcentaje}%` : '—'}</td>,
    _act:        <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e=>{e.stopPropagation();navigate('ficha-mandato',{id:m.ref})}}>Ver</button></div></td>,
  })

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="kpi-strip" style={{gridTemplateColumns:'repeat(6,1fr)'}}>
        <div className="ks"><div className="ks-lbl">Total mandatos</div><div className="ks-val">{total}</div></div>
        <div className="ks"><div className="ks-lbl">Activos</div><div className="ks-val green">{activosCount}</div></div>
        <div className="ks"><div className="ks-lbl">Alerta / próx. venc.</div><div className="ks-val red">{alertas}</div><div className="ks-sub">≤ 30 días</div></div>
        <div className="ks"><div className="ks-lbl">Exclusivas</div><div className="ks-val" style={{color:'var(--purple)'}}>{exclusivas}</div></div>
        <div className="ks"><div className="ks-lbl">Coexclusivas</div><div className="ks-val" style={{color:'var(--teal)'}}>{coexcl}</div></div>
        <div className="ks"><div className="ks-lbl">SBA bajo mandato</div><div className="ks-val">{sbaTotal>=1000 ? `${(sbaTotal/1000).toFixed(0)}k` : sbaTotal} m²</div></div>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', paddingLeft:16, paddingTop:6, gap:0 }}>
        {[['activas','Activos'],['desactivadas','Cerrados / cancelados']].map(([k, l]) => (
          <button key={k} onClick={()=>setVista(k)} style={{ padding:'6px 16px', fontSize:11, fontWeight: vista === k ? 600 : 500, cursor:'pointer', border:'none', borderBottom: vista === k ? '2px solid var(--accent)' : '2px solid transparent', background:'none', color: vista === k ? 'var(--accent)' : 'var(--text3)', fontFamily:'inherit' }}>
            {l}{k === 'desactivadas' && desactivadas.length > 0 && <span style={{ marginLeft:5, fontSize:9, background:'var(--border)', borderRadius:8, padding:'0 4px' }}>{desactivadas.length}</span>}
          </button>
        ))}
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
          <Field label="Tipo"><select className="fsel" value={af.tipo} onChange={e=>setAf(p=>({...p,tipo:e.target.value}))}><option value="">Todos</option><option>Alquiler</option><option>Venta</option><option>Demanda</option><option>Consultoría</option></select></Field>
          <Field label="Exclusividad"><select className="fsel" value={af.excl} onChange={e=>setAf(p=>({...p,excl:e.target.value}))}><option value="">Todas</option><option>Exclusiva</option><option>Coexclusiva</option></select></Field>
          <Field label="Estado"><select className="fsel" value={af.estado} onChange={e=>setAf(p=>({...p,estado:e.target.value}))}><option value="">Todos</option><option>Activo</option><option>Alerta</option><option>Vencido</option><option>Cancelado</option></select></Field>
          <Field label="Departamento"><select className="fsel" value={af.departamento} onChange={e=>setAf(p=>({...p,departamento:e.target.value}))}><option value="">Todos</option><option>Oficinas</option><option>Capital Markets</option><option>Valoraciones</option><option>Property Management</option></select></Field>
          <Field label="Provincia"><select className="fsel" value={af.provincia} onChange={e=>setAf(p=>({...p,provincia:e.target.value}))}><option value="">Todas</option><option>Madrid</option><option>Barcelona</option><option>Valencia</option></select></Field>
          {advCount>0&&<button onClick={()=>setAf({tipo:'',excl:'',estado:'',departamento:'',provincia:''})} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'0 4px',fontFamily:'inherit',alignSelf:'flex-end',marginBottom:2}}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        {loading ? (
          <div style={{padding:40,textAlign:'center',color:'var(--text4)',fontSize:12}}>Cargando mandatos...</div>
        ) : (
          <table className="main-tbl">
            <thead>
              <tr>{visibleCols.map(c=>c.id==='_chk'?<th key="_chk"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th>:c.sys?<th key={c.id}>{c.label}</th>:<ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={vistaList}/>)}</tr>
            </thead>
            <tbody>
              {result.map(m=>(
                <tr key={m.id} onClick={()=>navigate('ficha-mandato',{id:m.ref})} style={{cursor:'pointer',opacity:m.estadoUI==='Vencido'||m.estadoUI==='Cancelado'?.65:1}}>
                  {visibleCols.map(c=>cell(m)[c.id])}
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
