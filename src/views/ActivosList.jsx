import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { ACTIVOS } from '../data/mockData'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import { Download, SlidersHorizontal } from 'lucide-react'
import { usoColor, usoTag, normalizeUso } from '../lib/usoConfig'
import { deriveOccupancy } from '../lib/deriveOccupancy'

const shortDir = (dir) => {
  if (!dir) return ''
  const noCP = dir.replace(/,?\s*\d{5}\b.*$/, '')
  const parts = noCP.split(',').map(s => s.trim()).filter(Boolean)
  return parts.slice(0, 2).join(', ')
}

function occColor(occ) {
  if (occ >= 90) return 'var(--green)'
  if (occ >= 75) return 'var(--amber)'
  return 'var(--red)'
}
const COLS = [
  { id: '_chk',       label: '',                    sys: true },
  { id: 'nombre',       label: 'Dirección',           required: true, type:'text',   getValue: r => r.direccion },
  { id: 'nombre_activo', label: 'Nombre',            required: true, type:'text',   getValue: r => r.name },
  { id: 'area',       label: 'Superficie (m²)',                     type:'number', getValue: r => r.sba },
  { id: 'zona',       label: 'Zona',                               type:'enum',   getValue: r => r.zona },
  { id: 'subzona',    label: 'Sub-zona',                           type:'enum',   getValue: r => r.subzona },
  { id: 'ciudad',     label: 'Ciudad',                             type:'enum',   getValue: r => r.ciudad },
  { id: 'uso',        label: 'Uso principal',                      type:'enum',   getValue: r => r.uso },
  { id: 'occ',        label: 'Ocupación',                          type:'number', getValue: r => r.occ, derived: true },
  { id: 'valor',      label: 'Precio Adquisición',                 type:'text',   getValue: r => r.valor },
  { id: 'estado',     label: 'Estado',                             type:'enum',   getValue: r => r.estado },
  { id: 'dias',       label: 'Días comerc.',                       type:'number', getValue: r => r.dias, derived: true },
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
  const [activos, setActivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ uso: '', estado: '', ciudad: '', zona: '', sbaMin: '', sbaMax: '', occMin: '', occMax: '' })
  const [vis, setVis] = useVisibleCols('activos', COLS)
  const [view, setView] = useState('tabla') // 'tabla' | 'cards'
  const [quickFilter, setQuickFilter] = useState('') // chip activo: '', 'comercializacion', 'ocupado', 'parcial', 'vacio', 'oficinas', 'logistico', 'retail'

  useEffect(() => {
    Promise.all([
      // Lo último modificado primero (updated_at); nombre como desempate.
      supabase.from('activos').select('*').order('updated_at', { ascending: false, nullsFirst: false }).order('nombre'),
      supabase.from('ofertas').select('activo_ref, superficie_disponible, activa'),
      supabase.from('propietarios').select('activo_ref, activo_id, precio_compra'),
    ]).then(([actRes, ofRes, propRes]) => {
      const activosData = actRes.data || []
      const ofertasData = ofRes.data || []
      const propData    = propRes.data || []
      // Agrupar disponibilidades por activo_ref (sólo ofertas activas)
      const dispByActivo = {}
      for (const o of ofertasData) {
        if (o.activa === false) continue
        const k = o.activo_ref
        if (!k) continue
        dispByActivo[k] = (dispByActivo[k] || 0) + (Number(o.superficie_disponible) || 0)
      }
      // Mapa activo → precio_compra (del propietario asignado en stacking).
      // Preferimos activo_id (robusto, FK migración 042); caemos a activo_ref
      // para filas cuyo id aún no se resolvió. Co-propiedad → concatena con ' · '.
      const precioById = {}, precioByRef = {}
      const addPrecio = (map, k, v) => { map[k] = map[k] ? `${map[k]} · ${v}` : String(v) }
      for (const p of propData) {
        if (p.precio_compra == null || p.precio_compra === '') continue
        if (p.activo_id)       addPrecio(precioById,  p.activo_id,  p.precio_compra)
        else if (p.activo_ref) addPrecio(precioByRef, p.activo_ref, p.precio_compra)
      }
      if (!actRes.error) {
        const mapped = activosData.map(a => {
          const sba = a.sba || 0
          const sumDisp = dispByActivo[a.ref] || 0
          // Ocupación: fuente de verdad = stacking (vac/ten físico). Fallback a la
          // disponibilidad de ofertas activas cuando el activo aún no tiene stacking.
          let occ = deriveOccupancy(a.stacking_data).occ
          if (occ == null) {
            occ = 100
            if (sumDisp > 0 && sba > 0) {
              occ = Math.max(0, Math.min(100, Math.round(100 - (sumDisp / sba) * 100)))
            }
          }
          return {
            ref:    a.ref,
            name:      a.nombre,
            direccion: a.direccion || '',
            propietario: a.propietario || '—',
            zona:   a.zona   || '',
            subzona:a.subzona|| '',
            ciudad: a.ciudad || '',
            uso:    a.uso    || '',
            sba,
            occ,
            renta:  a.renta_zona     || 0,
            valor:  precioById[a.id] || precioByRef[a.ref] || a.valor || '—',
            estado: a.estado || '',
            dias:   a.dias_comercializacion || 0,
            uso_secundario: a.uso_secundario || '',
            sup_planta_tipo: a.sup_planta_tipo || 0,
            sup_neta: (a.sba && a.ratio_perdida) ? Math.round(a.sba * (1 - a.ratio_perdida / 100)) : null,
          }
        })
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
    // Quick filter chips
    if (quickFilter === 'comercializacion' && a.estado !== 'En comercialización') return false
    if (quickFilter === 'ocupado'  && !(a.occ === 100 || a.estado === 'Totalmente ocupado')) return false
    if (quickFilter === 'parcial'  && a.estado !== 'Parcialmente disponible') return false
    if (quickFilter === 'vacio'    && a.estado !== 'Vacío al completo') return false
    if (quickFilter === 'oficinas' && normalizeUso(a.uso) !== 'Oficinas') return false
    if (quickFilter === 'logistico'&& normalizeUso(a.uso) !== 'Logística') return false
    if (quickFilter === 'retail'   && normalizeUso(a.uso) !== 'Retail High Street') return false
    if (quickFilter === 'datacenter' && normalizeUso(a.uso) !== 'Data Center') return false
    if (quickFilter === 'residencial'&& normalizeUso(a.uso) !== 'Residencial') return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  const cell = (a) => ({
    _chk:    <td key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} onClick={e => e.stopPropagation()} /></td>,
    nombre:       <td key="nombre" style={{ minWidth: 360 }}><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><div style={{ width: 28, height: 28, borderRadius: 5, background: usoColor(a.uso).bg, color: usoColor(a.uso).color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{a.uso[0]}</div><div style={{ minWidth: 0, flex: 1 }}><div className="asset-link" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.direccion || a.name}>{a.direccion || a.name}</div><div className="asset-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.ref}</div></div></div></td>,
    nombre_activo: <td key="nombre_activo" style={{ fontSize: 11, fontWeight: 500 }}>{a.name}</td>,
    area:    <td key="area" className="mono">{a.sba.toLocaleString()} m²</td>,
    zona:    <td key="zona" style={{ fontSize: 11, fontWeight: 500 }}>{a.zona}</td>,
    subzona: <td key="subzona" style={{ fontSize: 11, color: 'var(--text3)' }}>{a.subzona || '—'}</td>,
    ciudad:  <td key="ciudad" style={{ fontSize: 11 }}>{a.ciudad}</td>,
    uso:     <td key="uso"><span className={`tag ${usoTag(a.uso)}`}>{a.uso}</span></td>,
    occ:     <td key="occ"><div className="occ-cell" title="KPI derivado de las Ofertas vinculadas a este Activo"><div className="occ-bar"><div className="occ-bar-fill" style={{ width: `${a.occ}%`, background: occColor(a.occ) }} /></div><span style={{ fontSize: 11, color: occColor(a.occ) }}>{a.occ}%</span></div></td>,
    valor:   <td key="valor" className="mono">{a.valor}</td>,
    estado:  <td key="estado"><span className={`tag ${a.estado === 'Totalmente ocupado' ? 'tag-green' : a.estado === 'Activo en mercado' ? 'tag-green' : a.estado === 'Parcialmente disponible' ? 'tag-amber' : a.estado === 'En comercialización' ? 'tag-amber' : a.estado === 'Vacío al completo' ? 'tag-red' : 'tag-gray'}`}>{a.estado}</span></td>,
    dias:    <td key="dias" title="KPI derivado de las Ofertas vinculadas a este Activo">{a.dias > 0 ? <span style={{ color: a.dias > 90 ? 'var(--red)' : a.dias > 60 ? 'var(--amber)' : 'var(--text3)', fontWeight: 600 }}>{a.dias}d</span> : '—'}</td>,
    propietario:    <td key="propietario" style={{ fontSize: 11 }}>{a.propietario}</td>,
    uso_secundario: <td key="uso_secundario">{a.uso_secundario ? <span className="tag tag-gray" style={{fontSize:9}}>{a.uso_secundario}</span> : <span style={{color:'var(--text4)'}}>—</span>}</td>,
    sup_planta_tipo:<td key="sup_planta_tipo" className="mono">{a.sup_planta_tipo ? a.sup_planta_tipo.toLocaleString('es-ES') + ' m²' : '—'}</td>,
    sup_neta:       <td key="sup_neta" className="mono">{a.sup_neta != null ? a.sup_neta.toLocaleString('es-ES') + ' m²' : '—'}</td>,
    _act:    <td key="_act"><div className="ra-cell"><button className="ra" onClick={e => { e.stopPropagation(); navigate('ficha-activo', { ref: a.ref }) }}>Ver</button><button className="ra p" onClick={e => e.stopPropagation()}>Editar</button></div></td>,
  })

  // KPIs derivados de las Ofertas vinculadas (no se almacenan en el activo)
  const totalActivos      = activos.length
  const sbaTotal          = activos.reduce((s, a) => s + (a.sba || 0), 0)
  const ocupPromedio      = totalActivos > 0 ? Math.round(activos.reduce((s, a) => s + (a.occ || 0), 0) / totalActivos) : 0
  const enComercializacion = activos.filter(a => a.estado === 'En comercialización').length
  const totalmenteOcupados = activos.filter(a => a.occ === 100 || a.estado === 'Totalmente ocupado').length
  const parcialDisp        = activos.filter(a => a.estado === 'Parcialmente disponible').length
  const vacioCompleto      = activos.filter(a => a.estado === 'Vacío al completo').length
  const cntOficinas    = activos.filter(a => normalizeUso(a.uso) === 'Oficinas').length
  const cntLogistico   = activos.filter(a => normalizeUso(a.uso) === 'Logística').length
  const cntRetail      = activos.filter(a => normalizeUso(a.uso) === 'Retail High Street').length
  const cntDataCenter  = activos.filter(a => normalizeUso(a.uso) === 'Data Center').length
  const cntResidencial = activos.filter(a => normalizeUso(a.uso) === 'Residencial').length

  // Chip helper
  const chip = (key, label, count, color) => {
    const active = quickFilter === key
    return (
      <button onClick={() => setQuickFilter(active ? '' : key)} style={{
        display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px',
        border:`1px solid ${active ? color : 'var(--border)'}`, borderRadius:999,
        background: active ? color : 'var(--surface)', color: active ? '#fff' : 'var(--text2)',
        fontSize:11, fontWeight: active ? 600 : 500, cursor:'pointer', fontFamily:'inherit',
        transition:'all .12s',
      }}>
        {label}
        <span style={{
          fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:9,
          background: active ? 'rgba(255,255,255,.25)' : 'var(--gray-lt)',
          color: active ? '#fff' : 'var(--text3)',
        }}>{count}</span>
      </button>
    )
  }

  return (
    <div className="act-sky" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* KPI strip canónico · 5 cuadritos como en el resto de listas */}
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Total activos</div><div className="ks-val">{totalActivos}</div><div className="ks-sub">en cartera</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">SBA total</div><div className="ks-val">{sbaTotal > 0 ? `${(sbaTotal/1000).toFixed(0)}k` : '—'}</div><div className="ks-sub">m² brutos</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Ocupación promedio</div><div className="ks-val" style={{color: ocupPromedio>=90?'var(--green)':ocupPromedio>=75?'var(--amber)':'var(--red)'}}>{ocupPromedio}%</div><div className="ks-sub">derivado</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">En comercialización</div><div className="ks-val amber">{enComercializacion}</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Totalmente ocupados</div><div className="ks-val green">{totalmenteOcupados}</div><div className="ks-sub">sin disponibilidad</div></div>
      </div>

      {/* Quick filter chips · estilo sub-tabs */}
      <div style={{ padding:'8px 16px', display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <span style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginRight:4 }}>Estado</span>
        {chip('comercializacion','En comercialización', enComercializacion, 'var(--amber)')}
        {chip('parcial',         'Parcialmente disp.',  parcialDisp,         'var(--amber)')}
        {chip('ocupado',         'Totalmente ocupado',  totalmenteOcupados,  'var(--green)')}
        {chip('vacio',           'Vacío al completo',   vacioCompleto,       'var(--red)')}
        <span style={{ width:1, height:18, background:'var(--border)', margin:'0 6px' }}/>
        <span style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginRight:4 }}>Uso</span>
        {chip('oficinas',        'Oficinas',            cntOficinas,         '#5a4828')}
        {chip('logistico',       'Logístico',           cntLogistico,        '#0f766e')}
        {chip('retail',          'Retail',              cntRetail,           '#6b5b8e')}
        {chip('datacenter',      'Data Center',         cntDataCenter,       '#0369a1')}
        {chip('residencial',     'Residencial',         cntResidencial,      '#c2410c')}
        {quickFilter && (
          <button onClick={() => setQuickFilter('')} style={{ marginLeft:'auto', fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>✕ Limpiar filtro</button>
        )}
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" /></svg>
          <input className="search-inp" placeholder="Buscar activos..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="tbtn" onClick={() => setShowAdv(v => !v)} style={showAdv || advCount > 0 ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-lt)' } : {}}>
          <SlidersHorizontal size={14} strokeWidth={1.75} /> Filtros{advCount > 0 && <span style={{ marginLeft: 4, fontSize: 9, background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '0 5px' }}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll} />
        <span style={{ fontSize:11, color:'var(--text4)', marginLeft:6 }}>{result.length} de {totalActivos}</span>

        <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
          {/* Toggle Tabla / Cards */}
          <div style={{ display:'inline-flex', border:'1px solid var(--border)', borderRadius:6, overflow:'hidden' }}>
            {[['tabla','Tabla'],['cards','Cards']].map(([k,l]) => (
              <button key={k} onClick={() => setView(k)} style={{
                padding:'5px 12px', fontSize:11, fontWeight: view === k ? 600 : 500,
                background: view === k ? 'var(--accent)' : 'var(--surface)',
                color: view === k ? '#fff' : 'var(--text2)',
                border:'none', cursor:'pointer', fontFamily:'inherit',
              }}>{l}</button>
            ))}
          </div>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis} />
          <button className="tbtn"><Download size={14} strokeWidth={1.75} /> Exportar</button>
          <button className="tbtn prim" onClick={() => navigate('ficha-activo', { new: true })}>+ Nuevo activo</button>
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
        ) : view === 'tabla' ? (
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
              {result.length === 0
                ? <tr><td colSpan={visibleCols.length} style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)', fontSize:13 }}>Sin activos. Crea el primero con "+ Nuevo".</td></tr>
                : result.map(a => <tr key={a.ref} onClick={() => navigate('ficha-activo', { ref: a.ref })} style={a.ref === highlightRef ? {background:'var(--accent-lt)',outline:'1px solid var(--accent-bd)'} : undefined}>{visibleCols.map(c => cell(a)[c.id])}</tr>)
              }
            </tbody>
          </table>
        ) : (
          /* Vista CARDS */
          <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12, alignContent:'start', overflowY:'auto' }}>
            {result.length === 0 ? (
              <div style={{ gridColumn:'1 / -1', textAlign:'center', padding:'40px 0', color:'var(--text4)', fontSize:13 }}>Sin activos.</div>
            ) : result.map(a => {
              const uc = usoColor(a.uso)
              return (
                <div key={a.ref} onClick={() => navigate('ficha-activo', { ref: a.ref })} style={{
                  background:'var(--surface)', border:`1px solid ${a.ref === highlightRef ? 'var(--accent-bd)' : 'var(--border)'}`,
                  borderRadius:10, overflow:'hidden', cursor:'pointer', boxShadow:'0 1px 3px rgba(11,18,32,.06)',
                  transition:'box-shadow .12s, border-color .12s, transform .08s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(11,18,32,.10)'; e.currentTarget.style.borderColor = 'var(--accent-bd)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(11,18,32,.06)'; e.currentTarget.style.borderColor = a.ref === highlightRef ? 'var(--accent-bd)' : 'var(--border)' }}>
                  {/* Hero del card: gradiente con uso + ocupación destacada */}
                  <div style={{ height:90, background:`linear-gradient(135deg, ${uc.bg} 0%, var(--surface) 100%)`, position:'relative', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ position:'absolute', top:10, left:12, display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:32, height:32, borderRadius:6, background:uc.bg, color:uc.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, border:`1px solid ${uc.color}33` }}>{(a.uso||'?')[0]}</div>
                      <span className={`tag ${usoTag(a.uso)}`} style={{ fontSize:9 }}>{a.uso}</span>
                    </div>
                    <div style={{ position:'absolute', top:10, right:12, textAlign:'right' }}>
                      <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Ocupación</div>
                      <div style={{ fontSize:24, fontWeight:800, fontFamily:'var(--mono)', color:occColor(a.occ), lineHeight:1, marginTop:2 }}>{a.occ}%</div>
                    </div>
                    <div style={{ position:'absolute', bottom:8, left:12, right:12 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{shortDir(a.direccion) || a.name}</div>
                      <div style={{ fontSize:10, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}><span style={{fontWeight:500}}>{a.name}</span> · {a.zona}{a.subzona ? ` · ${a.subzona}` : ''} · {a.ciudad}</div>
                    </div>
                  </div>

                  {/* Body: KPIs y datos */}
                  <div style={{ padding:'12px 14px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 12px', marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>SBA</div>
                        <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)' }}>{a.sba ? a.sba.toLocaleString('es-ES') + ' m²' : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Valor</div>
                        <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)' }}>{a.valor || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Días comerc.</div>
                        <div style={{ fontSize:13, fontWeight:700, color: a.dias > 90 ? 'var(--red)' : a.dias > 60 ? 'var(--amber)' : 'var(--text2)' }}>{a.dias > 0 ? `${a.dias}d` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Estado</div>
                        <span className={`tag ${a.estado === 'Totalmente ocupado' ? 'tag-green' : a.estado === 'Activo en mercado' ? 'tag-green' : a.estado === 'Parcialmente disponible' ? 'tag-amber' : a.estado === 'En comercialización' ? 'tag-amber' : a.estado === 'Vacío al completo' ? 'tag-red' : 'tag-gray'}`} style={{ fontSize:9, marginTop:2 }}>{a.estado}</span>
                      </div>
                    </div>

                    {/* Footer: propietario + ref */}
                    <div style={{ paddingTop:8, borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ fontSize:10, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'70%' }}>{a.propietario}</div>
                      <span style={{ fontSize:9, color:'var(--text4)', fontFamily:'var(--mono)' }}>{a.ref}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>{children}</div>
}
