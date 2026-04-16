import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { OFERTAS as MOCK_OFERTAS } from '../data/mockData'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

const estadoTag = { 'En revisión': 'tag-amber', 'Negociando': 'tag-purple', 'Pre-acuerdo': 'tag-green', 'En curso': 'tag-blue', 'Cerrada': 'tag-gray', 'Finalista': 'tag-green' }

function mapMock(list) {
  return list.map(o => ({
    id:        o.ref,
    ref:       o.ref,
    activo:    o.activo,
    activo_ref: o.activo_ref,
    espacio:   o.espacio || '—',
    m2:        o.m2 || 0,
    renta:     o.espacios?.length > 0
      ? `${(o.espacios.reduce((s,e)=>s+e.renta,0)/o.espacios.length).toFixed(2)} €/m²/mes`
      : '—',
    tipo:      o.tipo_operacion || '—',
    origen:    o.origen_oferta  || '—',
    estado:    o.estado         || '—',
  }))
}

const COLS = [
  { id: '_chk',      label: '',               sys: true },
  { id: 'ref',       label: 'ID',             required: true, type:'text',   getValue: r => r.ref },
  { id: 'activo',    label: 'Activo',         required: true, type:'text',   getValue: r => r.activo },
  { id: 'espacio',   label: 'Espacio',                        type:'text',   getValue: r => r.espacio },
  { id: 'm2',        label: 'M²',                             type:'number', getValue: r => r.m2 },
  { id: 'renta',     label: 'Renta ofertada',                 type:'text',   getValue: r => r.renta },
  { id: 'tipo',      label: 'Tipo',                           type:'enum',   getValue: r => r.tipo },
  { id: 'origen',    label: 'Origen',                         type:'enum',   getValue: r => r.origen },
  { id: 'estado',    label: 'Estado',                         type:'enum',   getValue: r => r.estado },
  { id: '_act',      label: '',               sys: true },
]

export default function OfertasList() {
  const { navigate } = useNav()
  const [query, setQuery] = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ tipo: '', estado: '', m2Min: '', m2Max: '' })
  const [ofertas, setOfertas] = useState(mapMock(MOCK_OFERTAS))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('ofertas').select('*').order('created_at', { ascending: false }),
      supabase.from('activos').select('ref, nombre'),
    ]).then(([{ data: ofertasData, error }, { data: activosData }]) => {
      // Solo usar DB si hay ofertas reales (con activo vinculado)
      const reales = (ofertasData || []).filter(o => o.activo_ref)
      if (!error && reales.length > 0) {
        const activosMap = Object.fromEntries((activosData || []).map(a => [a.ref, a]))
        setOfertas(reales.map(o => ({
          id:        o.id,
          ref:       o.ref || o.id,
          activo:    activosMap[o.activo_ref]?.nombre || o.activo_ref || '—',
          activo_ref: o.activo_ref,
          espacio:   o.espacio || '—',
          m2:        0,
          renta:     '—',
          tipo:      o.tipo_operacion || '—',
          origen:    o.origen_oferta  || '—',
          estado:    o.estado         || '—',
        })))
      }
      // Si no hay ofertas reales en DB → se mantienen los mocks
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const [creando, setCreando] = useState(false)

  const handleNuevaOferta = async () => {
    setCreando(true)
    const ref = 'OF-' + Date.now()
    const { data, error } = await supabase.from('ofertas').insert({
      ref,
      tipo_comercializacion: 'Mandato Savills',
      tipo_operacion: 'Alquiler',
      estado: 'En curso',
    }).select().single()
    setCreando(false)
    if (!error && data) {
      navigate('ficha-oferta', { ofertaRef: data.ref })
    }
  }

  const advCount = Object.values(af).filter(Boolean).length
  const preFiltered = ofertas.filter(o => {
    const q = query.toLowerCase()
    if (q && !(o.activo||'').toLowerCase().includes(q) && !(o.ref||'').toLowerCase().includes(q) && !(o.espacio||'').toLowerCase().includes(q)) return false
    if (af.tipo      && o.tipo !== af.tipo) return false
    if (af.estado    && o.estado !== af.estado) return false
    if (af.m2Min     && o.m2 < parseInt(af.m2Min)) return false
    if (af.m2Max     && o.m2 > parseInt(af.m2Max)) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS

  const cell = (o) => ({
    _chk:    <td key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} onClick={e => e.stopPropagation()} /></td>,
    ref:     <td key="ref"><span className="asset-link" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{o.ref}</span></td>,
    activo:  <td key="activo"><div className="asset-link">{o.activo}</div><div className="asset-sub">{o.activo_ref || ''}</div></td>,
    espacio: <td key="espacio" style={{ fontSize: 11, color: o.espacio === '—' ? 'var(--text4)' : 'var(--text2)', fontStyle: o.espacio === '—' ? 'italic' : 'normal' }}>{o.espacio}</td>,
    m2:      <td key="m2" className="mono">{o.m2 > 0 ? o.m2.toLocaleString('es-ES') + ' m²' : <span style={{ color:'var(--text4)' }}>—</span>}</td>,
    renta:   <td key="renta" className="mono">{o.renta}</td>,
    tipo:    <td key="tipo">{o.tipo !== '—' ? <span className="tag tag-blue">{o.tipo}</span> : <span style={{ color:'var(--text4)' }}>—</span>}</td>,
    origen:  <td key="origen" style={{ fontSize: 11, color: 'var(--text3)' }}>{o.origen}</td>,
    estado:  <td key="estado"><span className={`tag ${estadoTag[o.estado] || 'tag-gray'}`}>{o.estado}</span></td>,
    _act:    <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e => { e.stopPropagation(); navigate('ficha-oferta', { ofertaRef: o.ref }) }}>Ver</button></div></td>,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Total Ofertas</div><div className="ks-val">{ofertas.length}</div><div className="ks-sub">Registradas</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">En curso</div><div className="ks-val amber">{ofertas.filter(o=>o.estado==='En curso').length}</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Finalistas</div><div className="ks-val" style={{ color: 'var(--accent)' }}>{ofertas.filter(o=>o.estado==='Finalista').length}</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Cerradas</div><div className="ks-val green">{ofertas.filter(o=>o.estado==='Cerrada').length}</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Sup. disponible</div><div className="ks-val">{ofertas.reduce((s,o)=>s+(o.m2||0),0).toLocaleString('es-ES')} m²</div></div>
      </div>
      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" /></svg>
          <input className="search-inp" placeholder="Buscar ofertas..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="tbtn" onClick={() => setShowAdv(v => !v)} style={showAdv || advCount > 0 ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-lt)' } : {}}>
          ⚙ Filtros{advCount > 0 && <span style={{ marginLeft: 4, fontSize: 9, background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '0 5px' }}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim" onClick={handleNuevaOferta} disabled={creando}>{creando ? 'Creando...' : '+ Nueva Oferta'}</button>
        </div>
      </div>
      {showAdv && (
        <div style={{ padding: '10px 16px', background: 'var(--gray-lt)', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <Field label="Tipo"><select className="fsel" value={af.tipo} onChange={e => setAf(p => ({ ...p, tipo: e.target.value }))}><option value="">Todos</option><option>Alquiler</option><option>Venta</option><option>Alquiler / Venta</option></select></Field>
          <Field label="Estado"><select className="fsel" value={af.estado} onChange={e => setAf(p => ({ ...p, estado: e.target.value }))}><option value="">Todos</option><option>En curso</option><option>Finalista</option><option>Cerrada</option></select></Field>
          <Field label="M² mín."><input className="fsel" type="number" value={af.m2Min} onChange={e => setAf(p => ({ ...p, m2Min: e.target.value }))} /></Field>
          <Field label="M² máx."><input className="fsel" type="number" value={af.m2Max} onChange={e => setAf(p => ({ ...p, m2Max: e.target.value }))} /></Field>
          {advCount > 0 && <button onClick={() => setAf({ tipo: '', estado: '', m2Min: '', m2Max: '' })} style={{ fontSize: 10, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit', alignSelf: 'flex-end', marginBottom: 2 }}>✕ Limpiar</button>}
        </div>
      )}
      <div className="tbl-wrap">
        {loading ? (
          <div style={{ padding: '40px 24px', color: 'var(--text4)', fontSize: 13, textAlign: 'center' }}>Cargando ofertas...</div>
        ) : (
          <table className="main-tbl">
            <thead>
              <tr>{visibleCols.map(c => c.id === '_chk' ? <th key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} /></th> : c.sys ? <th key={c.id}>{c.label}</th> : <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={ofertas} />)}</tr>
            </thead>
            <tbody>
              {result.length === 0 ? (
                <tr><td colSpan={visibleCols.length} style={{ textAlign:'center', padding:'32px 0', color:'var(--text4)', fontSize:13 }}>Sin ofertas. Crea la primera desde la ficha de un activo.</td></tr>
              ) : (
                result.map(o => <tr key={o.ref} onClick={() => navigate('ficha-oferta', { ofertaRef: o.ref })} style={{ cursor:'pointer' }}>{visibleCols.map(c => cell(o)[c.id])}</tr>)
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>{children}</div>
}
