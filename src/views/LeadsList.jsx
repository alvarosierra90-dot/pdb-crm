import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { LEAD_TIPOS, LEAD_ESTADOS, LEAD_CANALES, LEAD_PRIORIDADES } from '../data/mockLeads'
import BannerInfo from '../components/BannerInfo'
import NuevoLeadModal from '../components/NuevoLeadModal'

const COLS = [
  { key:'ref',            label:'ID' },
  { key:'nombre',         label:'Lead' },
  { key:'tipo',           label:'Tipo' },
  { key:'estado',         label:'Estado' },
  { key:'prioridad',      label:'Prioridad' },
  { key:'origen_canal',   label:'Canal' },
  { key:'origen_campana', label:'Campaña / Anuncio' },
  { key:'cuenta_nombre',  label:'Cuenta' },
  { key:'contacto_nombre',label:'Contacto' },
  { key:'created_at',     label:'Entrada' },
  { key:'responsable',    label:'Responsable' },
  { key:'ultima_actividad', label:'Última actividad' },
]

function SortIcon({ active, dir }) {
  if (!active) return <span style={{ color:'var(--border)', fontSize:10, marginLeft:3 }}>↕</span>
  return <span style={{ color:'var(--accent)', fontSize:10, marginLeft:3 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

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
  const [sort, setSort]   = useState({ col:'created_at', dir:'desc' })
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

  const toggleSort = (col) => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))

  const data = leads
    .filter(r => !query
      || (r.nombre || '').toLowerCase().includes(query.toLowerCase())
      || (r.ref    || '').toLowerCase().includes(query.toLowerCase())
      || (r.cuenta_nombre   || '').toLowerCase().includes(query.toLowerCase())
      || (r.contacto_nombre || '').toLowerCase().includes(query.toLowerCase())
      || (r.origen_canal    || '').toLowerCase().includes(query.toLowerCase()))
    .filter(r => !fTipo   || r.tipo === fTipo)
    .filter(r => !fEstado || r.estado === fEstado)
    .filter(r => !fCanal  || r.origen_canal === fCanal)
    .sort((a, b) => {
      const va = (a[sort.col] || '').toString().toLowerCase()
      const vb = (b[sort.col] || '').toString().toLowerCase()
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

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
          <div style={{ fontSize:22, fontWeight:800, color:'#1e40af' }}>{nuevos}</div>
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
          <div style={{ fontSize:22, fontWeight:800, color:'#7c3aed' }}>{tasaConv}%</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Tasa conversión</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding:'8px 16px', background:'var(--surface)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0, flexWrap:'wrap' }}>
        <div style={{ fontSize:13, fontWeight:700 }}>Leads</div>
        <span style={{ fontSize:11, color:'var(--text4)', marginLeft:4 }}>{data.length} de {total}</span>

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

        <div className="search-wrap" style={{ marginLeft:'auto' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar leads..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="tbtn prim" onClick={() => setShowNuevo(true)}>+ Nuevo lead 🆕</button>
      </div>

      {/* Tabla */}
      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key} onClick={() => toggleSort(c.key)} style={{ cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
                  {c.label}<SortIcon active={sort.col === c.key} dir={sort.dir} />
                </th>
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
                      <td style={{ fontSize:11, fontFamily:'monospace', color:'var(--text3)', whiteSpace:'nowrap' }}>{r.ref}</td>
                      <td style={{ fontWeight:600, fontSize:11, color:'var(--text)' }}>{r.nombre}</td>
                      <td><TipoTag tipo={r.tipo} /></td>
                      <td><EstadoTag estado={r.estado} /></td>
                      <td><PrioridadTag prioridad={r.prioridad} /></td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.origen_canal || '—'}</td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.origen_campana || <span style={{ color:'var(--text4)' }}>—</span>}</td>
                      <td style={{ fontSize:11, color: r.cuenta_nombre ? 'var(--accent)' : 'var(--text4)' }}>{r.cuenta_nombre || '—'}</td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.contacto_nombre || '—'}</td>
                      <td style={{ fontSize:10, color:'var(--text3)', whiteSpace:'nowrap' }}>{fmtFecha(r.created_at)}</td>
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
