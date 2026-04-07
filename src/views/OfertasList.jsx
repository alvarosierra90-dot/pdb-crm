import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import { OFERTAS } from '../data/mockData'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

const estadoTag = { 'En revisión': 'tag-amber', 'Negociando': 'tag-purple', 'Pre-acuerdo': 'tag-green' }

const COLS = [
  { id: '_chk',      label: '',                sys: true },
  { id: 'ref',       label: 'ID',              required: true, type:'text',   getValue: r => r.ref },
  { id: 'activo',    label: 'Activo / Espacio',required: true, type:'text',   getValue: r => r.activo },
  { id: 'tipo',      label: 'Tipo',                            type:'enum',   getValue: r => r.tipo },
  { id: 'inquilino', label: 'Inquilino',                       type:'text',   getValue: r => r.inquilino },
  { id: 'renta',     label: 'Renta ofertada',                  type:'text',   getValue: r => r.renta },
  { id: 'm2',        label: 'M²',                              type:'number', getValue: r => r.m2 },
  { id: 'estado',    label: 'Estado',                          type:'enum',   getValue: r => r.estado },
  { id: 'vence',     label: 'Vence',                           type:'text',   getValue: r => r.vence },
  { id: '_act',      label: '',                sys: true },
]

export default function OfertasList() {
  const { navigate } = useNav()
  const [query, setQuery] = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ tipo: '', estado: '', inquilino: '', m2Min: '', m2Max: '' })
  const [vis, setVis] = useVisibleCols('ofertas', COLS)

  const advCount = Object.values(af).filter(Boolean).length
  const preFiltered = OFERTAS.filter(o => {
    const q = query.toLowerCase()
    if (q && !o.activo.toLowerCase().includes(q) && !o.inquilino.toLowerCase().includes(q) && !o.ref.toLowerCase().includes(q)) return false
    if (af.tipo      && o.tipo !== af.tipo) return false
    if (af.estado    && o.estado !== af.estado) return false
    if (af.inquilino && !o.inquilino.toLowerCase().includes(af.inquilino.toLowerCase())) return false
    if (af.m2Min     && o.m2 < parseInt(af.m2Min)) return false
    if (af.m2Max     && o.m2 > parseInt(af.m2Max)) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  const cell = (o) => ({
    _chk:      <td key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} onClick={e => e.stopPropagation()} /></td>,
    ref:       <td key="ref"><span className="asset-link" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{o.ref}</span></td>,
    activo:    <td key="activo"><div className="asset-link">{o.activo}</div><div className="asset-sub">{o.espacio}</div></td>,
    tipo:      <td key="tipo"><span className="tag tag-blue">{o.tipo}</span></td>,
    inquilino: <td key="inquilino" style={{ fontSize: 11 }}>{o.inquilino}</td>,
    renta:     <td key="renta" className="mono">{o.renta}</td>,
    m2:        <td key="m2">{o.m2.toLocaleString()}</td>,
    estado:    <td key="estado"><span className={`tag ${estadoTag[o.estado] || 'tag-gray'}`}>{o.estado}</span></td>,
    vence:     <td key="vence" style={{ color: o.estado === 'En revisión' ? 'var(--red)' : 'var(--text2)', fontWeight: o.estado === 'En revisión' ? 700 : 400 }}>{o.vence}</td>,
    _act:      <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e => { e.stopPropagation(); navigate('ficha-oferta') }}>Ver</button></div></td>,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Total Ofertas</div><div className="ks-val">7</div><div className="ks-sub">Activas</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">En Revisión</div><div className="ks-val amber">3</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">En Negociación</div><div className="ks-val" style={{ color: 'var(--accent)' }}>2</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Cerradas (mes)</div><div className="ks-val green">2</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Renta Potencial</div><div className="ks-val">€842K</div></div>
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
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis} />
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim">+ Nueva Oferta</button>
        </div>
      </div>
      {showAdv && (
        <div style={{ padding: '10px 16px', background: 'var(--gray-lt)', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <Field label="Tipo"><select className="fsel" value={af.tipo} onChange={e => setAf(p => ({ ...p, tipo: e.target.value }))}><option value="">Todos</option><option>Arrendamiento</option><option>Venta</option></select></Field>
          <Field label="Estado"><select className="fsel" value={af.estado} onChange={e => setAf(p => ({ ...p, estado: e.target.value }))}><option value="">Todos</option><option>En revisión</option><option>Negociando</option><option>Pre-acuerdo</option></select></Field>
          <Field label="Inquilino"><input className="fsel" placeholder="Nombre..." value={af.inquilino} onChange={e => setAf(p => ({ ...p, inquilino: e.target.value }))} /></Field>
          <Field label="M² mín."><input className="fsel" type="number" value={af.m2Min} onChange={e => setAf(p => ({ ...p, m2Min: e.target.value }))} /></Field>
          <Field label="M² máx."><input className="fsel" type="number" value={af.m2Max} onChange={e => setAf(p => ({ ...p, m2Max: e.target.value }))} /></Field>
          {advCount > 0 && <button onClick={() => setAf({ tipo: '', estado: '', inquilino: '', m2Min: '', m2Max: '' })} style={{ fontSize: 10, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit', alignSelf: 'flex-end', marginBottom: 2 }}>✕ Limpiar</button>}
        </div>
      )}
      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c => c.id === '_chk' ? <th key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} /></th> : c.sys ? <th key={c.id}>{c.label}</th> : <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={OFERTAS} />)}</tr>
          </thead>
          <tbody>
            {result.map(o => <tr key={o.ref} onClick={() => navigate('ficha-oferta')}>{visibleCols.map(c => cell(o)[c.id])}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>{children}</div>
}
