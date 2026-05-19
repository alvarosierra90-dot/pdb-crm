import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { LEAD_TIPOS, LEAD_ESTADOS, LEAD_CANALES, LEAD_PRIORIDADES } from '../data/mockLeads'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import BannerInfo from '../components/BannerInfo'
import NuevoLeadModal from '../components/NuevoLeadModal'

function TipoTag({ tipo }) {
  const t = LEAD_TIPOS.find(x => x.key === tipo)
  if (!t) return <span style={{ color:'var(--text4)' }}>—</span>
  return <span className={`tag ${t.tagClass}`} style={{ whiteSpace:'nowrap' }}>{t.label}</span>
}
function EstadoTag({ estado }) {
  const e = LEAD_ESTADOS.find(x => x.key === estado)
  if (!e) return <span style={{ color:'var(--text4)' }}>—</span>
  return <span className={`tag ${e.tagClass}`} style={{ whiteSpace:'nowrap' }}>{e.label}</span>
}
function PrioridadTag({ prioridad }) {
  const p = LEAD_PRIORIDADES.find(x => x.key === prioridad)
  if (!p) return <span style={{ color:'var(--text4)' }}>—</span>
  return <span className={`tag ${p.tagClass}`}>{p.label}</span>
}
const tipoLabel = k => LEAD_TIPOS.find(x => x.key === k)?.label || k || ''
const estadoLabel = k => LEAD_ESTADOS.find(x => x.key === k)?.label || k || ''
const prioridadLabel = k => LEAD_PRIORIDADES.find(x => x.key === k)?.label || k || ''

const COLS = [
  { id:'ref',              label:'ID',                  type:'text',   getValue: r => r.ref },
  { id:'nombre',           label:'Lead',                type:'text',   getValue: r => r.nombre },
  { id:'tipo',             label:'Tipo',                type:'enum',   getValue: r => tipoLabel(r.tipo) },
  { id:'estado',           label:'Estado',              type:'enum',   getValue: r => estadoLabel(r.estado) },
  { id:'prioridad',        label:'Prioridad',           type:'enum',   getValue: r => prioridadLabel(r.prioridad) },
  { id:'origen_canal',     label:'Canal',               type:'enum',   getValue: r => r.origen_canal || '' },
  { id:'origen_campana',   label:'Campaña / Anuncio',   type:'text',   getValue: r => r.origen_campana || '' },
  { id:'cuenta_nombre',    label:'Cuenta',              type:'text',   getValue: r => r.cuenta_nombre || '' },
  { id:'contacto_nombre',  label:'Contacto',            type:'text',   getValue: r => r.contacto_nombre || '' },
  { id:'created_at',       label:'Entrada',             type:'text',   getValue: r => r.created_at || '' },
  { id:'responsable',      label:'Responsable',         type:'enum',   getValue: r => r.responsable || '' },
  { id:'ultima_actividad', label:'Última actividad',    type:'text',   getValue: r => r.ultima_actividad || '' },
]

function fmtFecha(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
function fmtRelativa(ts) {
  if (!ts) return '—'
  const diffMs = Date.now() - new Date(ts).getTime()
  const h = Math.floor(diffMs / 3600000)
  if (h < 1) return 'Hace minutos'
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `Hace ${d}d`
  const w = Math.floor(d / 7)
  return `Hace ${w}sem`
}

export default function LeadsList() {
  const { navigate } = useNav()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [fTipo, setFTipo]     = useState('')
  const [fEstado, setFEstado] = useState('')
  const [fCanal, setFCanal]   = useState('')
  const [showNuevo, setShowNuevo] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id, ref, nombre, tipo, via, estado, prioridad, equipo, responsable,
          fuente, origen_canal, origen_campana, origen_anuncio, origen_url,
          descripcion, ultima_actividad, created_at,
          dynamics_account_id, dynamics_contact_id, dynamics_opportunity_id,
          dynamics_accounts:dynamics_account_id ( nombre ),
          dynamics_contacts:dynamics_contact_id ( nombre )
        `)
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) {
        setError(error.message)
        setLeads([])
      } else {
        setLeads((data || []).map(l => ({
          ...l,
          cuenta_nombre:   l.dynamics_accounts?.nombre  || null,
          contacto_nombre: l.dynamics_contacts?.nombre || null,
        })))
        setError(null)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [reloadKey])

  const preFiltered = leads
    .filter(r => !query
      || (r.nombre || '').toLowerCase().includes(query.toLowerCase())
      || (r.ref    || '').toLowerCase().includes(query.toLowerCase())
      || (r.cuenta_nombre   || '').toLowerCase().includes(query.toLowerCase())
      || (r.contacto_nombre || '').toLowerCase().includes(query.toLowerCase())
      || (r.origen_canal    || '').toLowerCase().includes(query.toLowerCase()))
    .filter(r => !fTipo   || r.tipo === fTipo)
    .filter(r => !fEstado || r.estado === fEstado)
    .filter(r => !fCanal  || r.origen_canal === fCanal)

  const { result: data, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  const total = leads.length
  const nuevos       = leads.filter(l => l.estado === 'nuevo').length
  const enCualif     = leads.filter(l => l.estado === 'en_cualificacion').length
  const cualificados = leads.filter(l => l.estado === 'cualificado').length
  const convertidos  = leads.filter(l => l.estado === 'cualificado' && l.dynamics_opportunity_id).length
  const nulos        = leads.filter(l => l.estado === 'no_cualificado').length
  const tasaConv = total ? ((convertidos / total) * 100).toFixed(1) : '0'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <BannerInfo variant="info" title="Punto inicial del funnel comercial · Captura automática desde web, portales, formularios y campañas" hint="Sincronizado con anuncios + Microsoft Dynamics 365" />

      {/* KPI strip */}
      <div className="kpi-strip" style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:24, flexShrink:0, background:'var(--surface)' }}>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>{total}</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Total leads</div>
        </div>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'#5a4828' }}>{nuevos}</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Nuevos</div>
        </div>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'#92400e' }}>{enCualif}</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>En cualificación</div>
        </div>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'#15803d' }}>{cualificados}</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Cualificados</div>
        </div>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'#0e7490' }}>{convertidos}</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Con oportunidad</div>
        </div>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'#991b1b' }}>{nulos}</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>No cualificados</div>
        </div>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'#6b5b8e' }}>{tasaConv}%</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Tasa conversión</div>
        </div>
      </div>

      {/* Toolbar canónico */}
      <div className="list-toolbar" style={{ flexWrap:'wrap' }}>
        <span style={{ fontSize:11, color:'var(--text4)' }}>{data.length} de {total}</span>

        <select value={fTipo} onChange={e=>setFTipo(e.target.value)} style={{ fontSize:11, padding:'4px 8px', border:'1px solid var(--border)', borderRadius:5, marginLeft:8 }}>
          <option value="">Todos los tipos</option>
          {LEAD_TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <select value={fEstado} onChange={e=>setFEstado(e.target.value)} style={{ fontSize:11, padding:'4px 8px', border:'1px solid var(--border)', borderRadius:5 }}>
          <option value="">Todos los estados</option>
          {LEAD_ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
        </select>
        <select value={fCanal} onChange={e=>setFCanal(e.target.value)} style={{ fontSize:11, padding:'4px 8px', border:'1px solid var(--border)', borderRadius:5 }}>
          <option value="">Todos los canales</option>
          {LEAD_CANALES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <FilterBadge count={activeCount} onClear={clearAll} />

        <div className="search-wrap" style={{ marginLeft:'auto' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar leads..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="tbtn prim" onClick={() => setShowNuevo(true)}>+ Nuevo lead</button>
      </div>

      {/* Tabla */}
      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>
              {COLS.map(c => (
                <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={preFiltered} />
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={COLS.length} style={{ textAlign:'center', padding:32, color:'var(--text4)', fontSize:12 }}>Cargando…</td></tr>
              : error
                ? <tr><td colSpan={COLS.length} style={{ textAlign:'center', padding:32, color:'#991b1b', fontSize:12 }}>Error: {error}</td></tr>
                : data.length === 0
                  ? <tr><td colSpan={COLS.length} style={{ textAlign:'center', padding:32, color:'var(--text4)', fontSize:12 }}>No se encontraron leads</td></tr>
                  : data.map(r => (
                    <tr key={r.id} style={{ cursor:'pointer' }} onClick={() => navigate('ficha-lead', { id: r.ref })}>
                      <td><span className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{r.ref}</span></td>
                      <td style={{ fontWeight:600, fontSize:11, color:'var(--text)' }}>{r.nombre}</td>
                      <td><TipoTag tipo={r.tipo} /></td>
                      <td><EstadoTag estado={r.estado} /></td>
                      <td><PrioridadTag prioridad={r.prioridad} /></td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.origen_canal || '—'}</td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.origen_campana || <span style={{ color:'var(--text4)' }}>—</span>}</td>
                      <td style={{ fontSize:11, color: r.cuenta_nombre ? 'var(--accent)' : 'var(--text4)' }}>{r.cuenta_nombre || '—'}</td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.contacto_nombre || '—'}</td>
                      <td style={{ fontSize:10, color:'var(--text3)' }}><span className="mono">{fmtFecha(r.created_at)}</span></td>
                      <td style={{ fontSize:11 }}>{r.responsable || <span style={{ color:'var(--text4)' }}>—</span>}</td>
                      <td style={{ fontSize:10, color:'var(--text4)' }}>{fmtRelativa(r.ultima_actividad)}</td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>
      <div style={{ padding:'5px 16px', fontSize:10, color:'var(--text4)', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        Filas: {data.length} · Captura automática desde {LEAD_CANALES.length} canales · Trazabilidad completa hasta cierre
      </div>

      {showNuevo && (
        <NuevoLeadModal
          onClose={() => setShowNuevo(false)}
          onSuccess={(ref) => {
            setShowNuevo(false)
            setReloadKey(k => k + 1)
            navigate('ficha-lead', { id: ref })
          }}
        />
      )}
    </div>
  )
}
