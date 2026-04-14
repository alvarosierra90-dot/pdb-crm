import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { ACTIVOS } from '../data/mockData'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

function occColor(occ) {
  if (occ >= 90) return 'var(--green)'
  if (occ >= 75) return 'var(--amber)'
  return 'var(--red)'
}
function usoColor(uso) {
  if (uso === 'Oficinas')    return { bg: '#dbeafe', color: '#1e40af' }
  if (uso === 'Logístico')   return { bg: '#f0fdfa', color: '#0f766e' }
  if (uso === 'Retail')      return { bg: '#fdf4ff', color: '#7e22ce' }
  if (uso === 'Data Center') return { bg: '#f0f9ff', color: '#0369a1' }
  if (uso === 'Residencial') return { bg: '#fff7ed', color: '#c2410c' }
  return { bg: '#fce7f3', color: '#9d174d' }
}

const COLS = [
  { id: '_chk',       label: '',                    sys: true },
  { id: 'nombre',     label: 'Activo',              required: true, type:'text',   getValue: r => r.name },
  { id: 'area',       label: 'Superficie (m²)',                     type:'number', getValue: r => r.sba },
  { id: 'zona',       label: 'Zona',                               type:'enum',   getValue: r => r.zona },
  { id: 'subzona',    label: 'Sub-zona',                           type:'enum',   getValue: r => r.subzona },
  { id: 'ciudad',     label: 'Ciudad',                             type:'enum',   getValue: r => r.ciudad },
  { id: 'uso',        label: 'Uso principal',                      type:'enum',   getValue: r => r.uso },
  { id: 'occ',        label: 'Ocupación',                          type:'number', getValue: r => r.occ },
  { id: 'valor',      label: 'Precio Adquisición',                 type:'text',   getValue: r => r.valor },
  { id: 'estado',     label: 'Estado',                             type:'enum',   getValue: r => r.estado },
  { id: 'dias',       label: 'Días comerc.',                       type:'number', getValue: r => r.dias },
  { id: 'propietario',   label: 'Propietario',                        type:'enum',   getValue: r => r.propietario },
  { id: 'uso_secundario', label: 'Uso secundario',                  type:'enum',   getValue: r => r.uso_secundario },
  { id: 'sup_planta_tipo', label: 'Sup. planta tipo (m²)',          type:'number', getValue: r => r.sup_planta_tipo },
  { id: 'sup_neta',      label: 'Sup. neta (m²)',                   type:'number', getValue: r => r.sup_neta },
  { id: '_act',          label: '',                    sys: true },
]


export default function ActivosList() {
  const { navigate, params } = useNav()
  const highlightRef = params?.highlightRef || null
  const [query,   setQuery]   = useState('')
  const [activos, setActivos] = useState(ACTIVOS)
  const [loading, setLoading] = useState(true)
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ uso: '', estado: '', ciudad: '', zona: '', sbaMin: '', sbaMax: '', occMin: '', occMax: '' })
  const [vis, setVis] = useVisibleCols('activos', COLS)

  useEffect(() => {
    supabase.from('activos').select('*').order('nombre').then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        const mapped = data.map(a => ({
          ref:    a.ref,
          name:   a.nombre,
          propietario: a.propietario || '—',
          zona:   a.zona   || '',
          subzona:a.subzona|| '',
          ciudad: a.ciudad || '',
          uso:    a.uso    || '',
          sba:    a.sba    || 0,
          occ:    a.occupancy_rate || 0,
          renta:  a.renta_zona     || 0,
          valor:  a.valor  || '—',
          estado: a.estado || '',
          dias:   a.dias_comercializacion || 0,
          uso_secundario: a.uso_secundario || '',
          sup_planta_tipo: a.sup_planta_tipo || 0,
          sup_neta: (a.sba && a.ratio_perdida) ? Math.round(a.sba * (1 - a.ratio_perdida / 100)) : null,
        }))
        // Si venimos de "Guardar y cerrar", poner ese activo primero
        if (highlightRef) {
          const idx = mapped.findIndex(a => a.ref === highlightRef)
          if (idx > 0) mapped.unshift(mapped.splice(idx, 1)[0])
        }
        setActivos(mapped)
      }
      setLoading(false)
    })
  }, [highlightRef])

  const advCount = Object.values(af).filter(Boolean).length

  const preFiltered = activos.filter(a => {
    const q = query.toLowerCase()
    if (q && !a.name.toLowerCase().includes(q) && !a.zona.toLowerCase().includes(q) && !a.ciudad.toLowerCase().includes(q) && !a.uso.toLowerCase().includes(q)) return false
    if (af.uso    && a.uso !== af.uso) return false
    if (af.estado && a.estado !== af.estado) return false
    if (af.ciudad && !a.ciudad.toLowerCase().includes(af.ciudad.toLowerCase())) return false
    if (af.zona   && a.zona !== af.zona) return false
    if (af.sbaMin && a.sba < parseInt(af.sbaMin)) return false
    if (af.sbaMax && a.sba > parseInt(af.sbaMax)) return false
    if (af.occMin && a.occ < parseFloat(af.occMin)) return false
    if (af.occMax && a.occ > parseFloat(af.occMax)) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  const cell = (a) => ({
    _chk:    <td key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} onClick={e => e.stopPropagation()} /></td>,
    nombre:  <td key="nombre"><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><div style={{ width: 28, height: 28, borderRadius: 5, background: usoColor(a.uso).bg, color: usoColor(a.uso).color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{a.uso[0]}</div><div><div className="asset-link">{a.name}</div><div className="asset-sub">{a.ref}</div></div></div></td>,
    area:    <td key="area" className="mono">{a.sba.toLocaleString()} m²</td>,
    zona:    <td key="zona" style={{ fontSize: 11, fontWeight: 500 }}>{a.zona}</td>,
    subzona: <td key="subzona" style={{ fontSize: 11, color: 'var(--text3)' }}>{a.subzona || '—'}</td>,
    ciudad:  <td key="ciudad" style={{ fontSize: 11 }}>{a.ciudad}</td>,
    uso:     <td key="uso"><span className={`tag ${a.uso === 'Oficinas' ? 'tag-blue' : a.uso === 'Logístico' ? 'tag-teal' : a.uso === 'Data Center' ? 'tag-blue' : a.uso === 'Residencial' ? 'tag-amber' : 'tag-purple'}`}>{a.uso}</span></td>,
    occ:     <td key="occ"><div className="occ-cell"><div className="occ-bar"><div className="occ-bar-fill" style={{ width: `${a.occ}%`, background: occColor(a.occ) }} /></div><span style={{ fontSize: 11, color: occColor(a.occ) }}>{a.occ}%</span></div></td>,
    valor:   <td key="valor" className="mono">{a.valor}</td>,
    estado:  <td key="estado"><span className={`tag ${a.estado === 'Totalmente ocupado' ? 'tag-green' : a.estado === 'Activo' ? 'tag-green' : a.estado === 'Parcialmente disponible' ? 'tag-amber' : a.estado === 'En comercialización' ? 'tag-amber' : a.estado === 'Vacío al completo' ? 'tag-red' : 'tag-gray'}`}>{a.estado}</span></td>,
    dias:    <td key="dias">{a.dias > 0 ? <span style={{ color: a.dias > 90 ? 'var(--red)' : a.dias > 60 ? 'var(--amber)' : 'var(--text3)', fontWeight: 600 }}>{a.dias}d</span> : '—'}</td>,
    propietario:    <td key="propietario" style={{ fontSize: 11 }}>{a.propietario}</td>,
    uso_secundario: <td key="uso_secundario">{a.uso_secundario ? <span className="tag tag-gray" style={{fontSize:9}}>{a.uso_secundario}</span> : <span style={{color:'var(--text4)'}}>—</span>}</td>,
    sup_planta_tipo:<td key="sup_planta_tipo" className="mono">{a.sup_planta_tipo ? a.sup_planta_tipo.toLocaleString('es-ES') + ' m²' : '—'}</td>,
    sup_neta:       <td key="sup_neta" className="mono">{a.sup_neta != null ? a.sup_neta.toLocaleString('es-ES') + ' m²' : '—'}</td>,
    _act:    <td key="_act"><div className="ra-cell"><button className="ra" onClick={e => { e.stopPropagation(); navigate('ficha-activo', { ref: a.ref }) }}>Ver</button><button className="ra p" onClick={e => e.stopPropagation()}>Editar</button></div></td>,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" /></svg>
          <input className="search-inp" placeholder="Buscar activos..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="tbtn" onClick={() => setShowAdv(v => !v)} style={showAdv || advCount > 0 ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-lt)' } : {}}>
          ⚙ Filtros{advCount > 0 && <span style={{ marginLeft: 4, fontSize: 9, background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '0 5px' }}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis} />
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim" onClick={() => navigate('ficha-activo', { new: true })}>+ Nuevo</button>
        </div>
      </div>
      {showAdv && (
        <div style={{ padding: '10px 16px', background: 'var(--gray-lt)', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <Field label="Uso"><select className="fsel" value={af.uso} onChange={e => setAf(p => ({ ...p, uso: e.target.value }))}><option value="">Todos</option><option>Oficinas</option><option>Logístico</option><option>Retail</option><option>Data Center</option><option>Residencial</option></select></Field>
          <Field label="Estado"><select className="fsel" value={af.estado} onChange={e => setAf(p => ({ ...p, estado: e.target.value }))}><option value="">Todos</option><option>Activo</option><option>En comercialización</option><option>Totalmente ocupado</option><option>Parcialmente disponible</option><option>Vacío al completo</option></select></Field>
          <Field label="Zona"><select className="fsel" value={af.zona} onChange={e => setAf(p => ({ ...p, zona: e.target.value }))}><option value="">Todas</option><option>M-30</option><option>A-1</option><option>22@</option><option>Corredor del Henares</option><option>Sur Madrid</option><option>Mestalla</option></select></Field>
          <Field label="Ciudad"><input className="fsel" placeholder="Madrid..." value={af.ciudad} onChange={e => setAf(p => ({ ...p, ciudad: e.target.value }))} /></Field>
          <Field label="Área mín. m²"><input className="fsel" type="number" placeholder="0" value={af.sbaMin} onChange={e => setAf(p => ({ ...p, sbaMin: e.target.value }))} /></Field>
          <Field label="Área máx. m²"><input className="fsel" type="number" placeholder="∞" value={af.sbaMax} onChange={e => setAf(p => ({ ...p, sbaMax: e.target.value }))} /></Field>
          <Field label="Ocup. mín %"><input className="fsel" type="number" placeholder="0" value={af.occMin} onChange={e => setAf(p => ({ ...p, occMin: e.target.value }))} /></Field>
          <Field label="Ocup. máx %"><input className="fsel" type="number" placeholder="100" value={af.occMax} onChange={e => setAf(p => ({ ...p, occMax: e.target.value }))} /></Field>
          {advCount > 0 && <button onClick={() => setAf({ uso: '', estado: '', ciudad: '', zona: '', sbaMin: '', sbaMax: '', occMin: '', occMax: '' })} style={{ fontSize: 10, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit', alignSelf: 'flex-end', marginBottom: 2 }}>✕ Limpiar</button>}
        </div>
      )}

      <div className="tbl-wrap">
        {loading ? (
          <div style={{ padding: '40px 24px', color: 'var(--text4)', fontSize: 13, textAlign: 'center' }}>Cargando activos...</div>
        ) : (
          <table className="main-tbl">
            <thead>
              <tr>
                {visibleCols.map(c =>
                  c.id === '_chk' ? <th key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} /></th> :
                  c.sys ? <th key={c.id}>{c.label}</th> :
                  <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={activos} />
                )}
              </tr>
            </thead>
            <tbody>
              {result.map(a => <tr key={a.ref} onClick={() => navigate('ficha-activo', { ref: a.ref })} style={a.ref === highlightRef ? {background:'var(--accent-lt)',outline:'1px solid var(--accent-bd)'} : undefined}>{visibleCols.map(c => cell(a)[c.id])}</tr>)}
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
