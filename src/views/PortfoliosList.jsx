import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

const COLS = [
  { id: 'nombre',    label: 'Propietario / Portfolio', required: true, type:'text',   getValue: r => r.nombre },
  { id: 'tipo',      label: 'Tipo',                                    type:'enum',   getValue: r => r.tipo },
  { id: 'activos',   label: 'Activos',                                 type:'number', getValue: r => r.activos },
  { id: 'm2',        label: 'M² totales',                              type:'number', getValue: r => r.m2 },
  { id: 'disponible',label: 'Disponible',                              type:'number', getValue: r => r.disponible },
  { id: 'ofertas',   label: 'Ofertas activas',                         type:'number', getValue: r => r.ofertas },
  { id: 'yield',     label: 'Yield',                                   type:'number', getValue: r => r.yield },
  { id: 'contacto',  label: 'Último contacto',                         type:'text',   getValue: r => r.contacto },
  { id: '_act',      label: '',                         sys: true },
]

// Map DB row → local shape matching COLS
function mapRow(r) {
  const nombre = r.nombre || ''
  const letra  = nombre.charAt(0).toUpperCase()
  return {
    id: r.id,
    estado:      r.estado || 'Activo',
    fechaBaja:   r.fecha_desactivacion || null,
    motivoBaja:  r.motivo_desactivacion || null,
    nombre,
    ticker:      r.ticker      || '',
    tipo:        r.tipo        || '',
    activos:     r.activos_count  ?? 0,
    m2:          r.m2_totales     ?? 0,
    disponible:  r.m2_disponible  ?? 0,
    ofertas:     r.ofertas_activas ?? 0,
    yield:       r.yield_pct      ?? 0,
    contacto:    r.ultimo_contacto || '—',
    letra,
    colorBg:     'var(--gray-lt)',
    colorBorder: 'var(--border)',
    colorText:   'var(--text)',
  }
}

export default function PortfoliosList() {
  const { navigate } = useNav()
  const [portfolios, setPortfolios] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [query,   setQuery]   = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ tipo: '' })
  const [vis, setVis] = useVisibleCols('portfolios', COLS)
  const [vista, setVista] = useState('activos') // 'activos' | 'desactivados'

  useEffect(() => {
    supabase.from('propietarios').select('*').order('nombre')
      .then(({ data }) => {
        setPortfolios((data || []).map(mapRow))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = portfolios.filter(p => {
    const q = query.toLowerCase()
    if (q && !p.nombre.toLowerCase().includes(q) && !p.ticker.toLowerCase().includes(q)) return false
    if (af.tipo && p.tipo !== af.tipo) return false
    if (vista === 'activos'      && p.estado !== 'Activo') return false
    if (vista === 'desactivados' && p.estado === 'Activo') return false
    return true
  })

  const countActivos      = portfolios.filter(p => p.estado === 'Activo').length
  const countDesactivados = portfolios.filter(p => p.estado !== 'Activo').length

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  const cell = (p) => ({
    nombre:    <td key="nombre">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: p.colorBg, border: `1px solid ${p.colorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: p.colorText }}>{p.letra}</div>
        <div><div className="asset-link">{p.nombre}</div><div className="asset-sub">{p.ticker} · {p.tipo}</div></div>
      </div>
    </td>,
    tipo:      <td key="tipo"><span className={`tag ${p.tipo === 'SOCIMI' ? 'tag-blue' : 'tag-green'}`}>{p.tipo}</span></td>,
    activos:   <td key="activos">{p.activos}</td>,
    m2:        <td key="m2">{p.m2.toLocaleString()}</td>,
    disponible:<td key="disponible" style={{ color: 'var(--amber)', fontWeight: 600 }}>{p.disponible.toLocaleString()}</td>,
    ofertas:   <td key="ofertas">{p.ofertas}</td>,
    yield:     <td key="yield">{p.yield}%</td>,
    contacto:  <td key="contacto">{p.contacto}</td>,
    _act:      <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e => { e.stopPropagation(); navigate('portfolio', { id: p.id }) }}>Ver</button></div></td>,
  })

  const visibleCols = COLS.filter(c => vis.has(c.id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display:'flex', gap:0, padding:'8px 16px 0', borderBottom:'1px solid var(--border)', background:'var(--surface)' }}>
        {[
          { v:'activos',      label:`Activos (${countActivos})`,         color:'var(--green)' },
          { v:'desactivados', label:`Desactivados (${countDesactivados})`, color:'var(--text4)' },
        ].map(t => {
          const active = vista === t.v
          return (
            <button
              key={t.v}
              onClick={() => setVista(t.v)}
              style={{
                padding:'8px 16px', fontSize:12, fontWeight: active ? 700 : 500,
                background:'none', border:'none', borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent',
                color: active ? t.color : 'var(--text3)',
                cursor:'pointer', fontFamily:'inherit', marginBottom:-1,
              }}
            >{t.label}</button>
          )
        })}
      </div>
      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" /></svg>
          <input className="search-inp" placeholder="Buscar propietarios / portfolios..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="tbtn" onClick={() => setShowAdv(v => !v)} style={showAdv || advCount > 0 ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-lt)' } : {}}>
          ⚙ Filtros{advCount > 0 && <span style={{ marginLeft: 4, fontSize: 9, background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '0 5px' }}>{advCount}</span>}
        </button>
        <FilterBadge activeCount={activeCount} onClear={clearAll}/>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis} />
          <button className="tbtn">⬇ Exportar</button>
        </div>
      </div>

      {showAdv && (
        <div style={{ padding: '10px 16px', background: 'var(--gray-lt)', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <Field label="Tipo"><select className="fsel" value={af.tipo} onChange={e => setAf(p => ({ ...p, tipo: e.target.value }))}><option value="">Todos</option><option>SOCIMI</option><option>Fondo</option><option>Family Office</option><option>Aseguradora</option></select></Field>
          {advCount > 0 && <button onClick={() => setAf({ tipo: '' })} style={{ fontSize: 10, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit', alignSelf: 'flex-end', marginBottom: 2 }}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c =>
              c.sys ? <th key={c.id}>{c.label}</th> :
              <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={portfolios}/>
            )}</tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={visibleCols.length} style={{ textAlign:'center', padding:24, color:'var(--text4)', fontSize:12 }}>Cargando propietarios…</td></tr>
              : result.map((p, i) => <tr key={i} onClick={() => navigate('portfolio', { id: p.id })}>{visibleCols.map(c => cell(p)[c.id])}</tr>)
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
      {children}
    </div>
  )
}
