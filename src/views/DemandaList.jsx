import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import NuevaDemandaModal from '../components/NuevaDemandaModal'
import { Download, SlidersHorizontal } from 'lucide-react'

// Las demandas viven en Supabase (migración 016 las migró todas).
// Mapeo visual de estados · misma paleta que FichaDemandaSupabase
const ESTADO_TAG_MAP = {
  'En Curso':            'tag-green',
  'Potencial':           'tag-blue',
  'Paralizado':          'tag-amber',
  'Descartado':          'tag-red',
  'Cerrada · Concedido': 'tag-green',
  'Cerrada · Perdida':   'tag-red',
}
const estadoTag = e => ESTADO_TAG_MAP[e] || 'tag-gray'

const COLS = [
  { id: '_chk',   label: '',               sys: true },
  { id: 'ref',    label: 'ID',             required: true, type:'text',   getValue: r => r.ref },
  { id: 'cuenta', label: 'Cuenta',         required: true, type:'text',   getValue: r => r.cuenta },
  { id: 'origen', label: 'Origen',                         type:'enum',   getValue: r => r.origen },
  { id: 'created',label: 'Creado el',                      type:'text',   getValue: r => r.created },
  { id: 'by',     label: 'Creado por',                     type:'enum',   getValue: r => r.by },
  { id: 'desc',   label: 'Descripción',                    type:'text',   getValue: r => r.desc },
  { id: 'estado', label: 'Estado',                         type:'enum',   getValue: r => r.estado },
  { id: 'supMin', label: 'Sup. mín. m²',                   type:'number', getValue: r => r.supMin },
  { id: 'supMax', label: 'Sup. máx. m²',                   type:'number', getValue: r => r.supMax },
  { id: 'tipoB',  label: 'Tipo búsqueda',                  type:'enum',   getValue: r => r.tipoB },
  { id: 'razon',  label: 'Razón búsqueda',                 type:'enum',   getValue: r => r.razon },
  { id: '_act',   label: '',               sys: true },
]

function fmtDateEs(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('es-ES')
}

// estatus que computan como "activas" en el listado principal
const ESTATUS_ACTIVAS = ['ongoing','potencial','paralizada']

export default function DemandaList() {
  const { navigate } = useNav()
  const [query, setQuery] = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ estado: '', origen: '', by: '', tipoB: '', supMin: '', supMax: '' })
  const [vis, setVis] = useVisibleCols('demandas', COLS)
  const [supabaseDems, setSupabaseDems] = useState([])
  const [vista, setVista] = useState('activas') // 'activas' | 'desactivadas'
  const [reloadKey, setReloadKey] = useState(0)
  const [showNuevaModal, setShowNuevaModal] = useState(false)

  // Carga las demandas reales desde Supabase y las mapea al formato de la lista
  useEffect(() => {
    let cancel = false
    async function load() {
      const { data, error } = await supabase
        .from('demandas')
        .select(`
          id, ref, nombre, estatus, notas, requisitos, motivo_descarte, created_at,
          dynamics_account_id,
          dynamics_accounts:dynamics_account_id ( nombre )
        `)
        .order('created_at', { ascending: false })
      if (cancel || error) return
      const rows = (data || []).map(d => ({
        ref:    d.ref,
        id:     d.id,
        cuenta: d.dynamics_accounts?.nombre || '(Cuenta pendiente)',
        origen: 'Lead',
        created: fmtDateEs(d.created_at),
        by:     '—',
        desc:   d.nombre || d.notas || '(Sin descripción — completar)',
        estado: d.estatus === 'ongoing' ? 'En Curso'
              : d.estatus === 'potencial' ? 'Potencial'
              : d.estatus === 'paralizada' ? 'Paralizado'
              : d.estatus === 'descartada' ? 'Descartado'
              : d.estatus === 'cerrada_concedido' ? 'Cerrada · Concedido'
              : d.estatus === 'cerrada_perdida' ? 'Cerrada · Perdida'
              : d.estatus || '—',
        supMin: Number(d.requisitos?.sup_min ?? d.requisitos?.m2_min) || 0,
        supMax: Number(d.requisitos?.sup_max ?? d.requisitos?.m2_max) || 0,
        tipoB:  d.requisitos?.tipologia || '',
        razon:  '—',
        _estatus:    d.estatus,
        _activa:     ESTATUS_ACTIVAS.includes(d.estatus),
        _motivo:     d.motivo_descarte || null,
        _pendiente:  !d.nombre && !d.notas,
      }))
      setSupabaseDems(rows)
    }
    load()
    return () => { cancel = true }
  }, [reloadKey])

  const handleReactivar = async (id, e) => {
    e.stopPropagation()
    await supabase.from('demandas')
      .update({ estatus: 'ongoing', motivo_descarte: null, updated_at: new Date().toISOString() })
      .eq('id', id)
    setReloadKey(k => k + 1)
  }

  const demandasActivas = supabaseDems.filter(d => d._activa)
  const demandasDesact  = supabaseDems.filter(d => !d._activa)
  const vistaList = vista === 'activas' ? demandasActivas : demandasDesact

  const advCount = Object.values(af).filter(Boolean).length
  const preFiltered = vistaList.filter(d => {
    const q = query.toLowerCase()
    if (q && !d.cuenta.toLowerCase().includes(q) && !d.ref.toLowerCase().includes(q) && !d.origen.toLowerCase().includes(q)) return false
    if (af.estado && d.estado !== af.estado) return false
    if (af.origen && d.origen !== af.origen) return false
    if (af.by     && d.by !== af.by) return false
    if (af.tipoB  && d.tipoB !== af.tipoB) return false
    if (af.supMin && d.supMax < parseInt(af.supMin)) return false
    if (af.supMax && d.supMin > parseInt(af.supMax)) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS.filter(c => vis.has(c.id))

  const cell = (d) => ({
    _chk:   <td key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} onClick={e => e.stopPropagation()} /></td>,
    ref:    <td key="ref">
              <span className="asset-link" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{d.ref}</span>
              {d._pendiente && <span className="tag tag-amber" style={{ marginLeft:6, fontSize:9 }}>PENDIENTE</span>}
            </td>,
    cuenta: <td key="cuenta"><div className="asset-link">{d.cuenta}</div></td>,
    origen: <td key="origen"><span className="tag tag-gray" style={{ fontSize: 9 }}>{d.origen}</span></td>,
    created:<td key="created" style={{ fontSize: 11 }}>{d.created}</td>,
    by:     <td key="by" style={{ fontSize: 11 }}>{d.by}</td>,
    desc:   <td key="desc" style={{ fontSize: 11, color: 'var(--text3)', minWidth: 280, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.desc}</td>,
    estado: <td key="estado">
              <span className={`tag ${estadoTag(d.estado)}`} title={d._motivo ? `Motivo: ${d._motivo}` : undefined}>{d.estado}</span>
              {d._motivo && <div style={{ fontSize:10, color:'var(--text4)', marginTop:2, fontStyle:'italic', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d._motivo}</div>}
            </td>,
    supMin: <td key="supMin" className="mono">{d.supMin ? d.supMin.toLocaleString('es-ES') : '—'}</td>,
    supMax: <td key="supMax" className="mono">{d.supMax ? d.supMax.toLocaleString('es-ES') : '—'}</td>,
    tipoB:  <td key="tipoB" style={{ fontSize: 11 }}>{d.tipoB || '—'}</td>,
    razon:  <td key="razon" style={{ fontSize: 11 }}>{d.razon}</td>,
    _act:   <td key="_act"><div className="ra-cell">
              <button className="ra p" onClick={e => { e.stopPropagation(); navigate('ficha-demanda', { id: d.ref }) }}>Ver</button>
              {vista === 'desactivadas' && d.id && (
                <button className="ra" style={{ color:'var(--green)', borderColor:'var(--green)' }} onClick={e => handleReactivar(d.id, e)}>Reactivar</button>
              )}
            </div></td>,
  })

  // KPIs derivados de los datos reales
  const enCurso       = demandasActivas.filter(d => d._estatus === 'ongoing').length
  const paralizadas   = demandasActivas.filter(d => d._estatus === 'paralizada').length
  const potenciales   = demandasActivas.filter(d => d._estatus === 'potencial').length
  const supMediaBusc  = demandasActivas.length
    ? Math.round(demandasActivas.reduce((s, d) => s + ((d.supMin + d.supMax) / 2), 0) / demandasActivas.length)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Activas</div><div className="ks-val green">{demandasActivas.length}</div><div className="ks-sub">En curso + potencial + paralizada</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">En curso</div><div className="ks-val">{enCurso}</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Paralizadas</div><div className="ks-val amber">{paralizadas}</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Potenciales</div><div className="ks-val" style={{ color:'var(--accent)' }}>{potenciales}</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Desactivadas</div><div className="ks-val" style={{ color:'var(--text3)' }}>{demandasDesact.length}</div><div className="ks-sub">Descartadas / cerradas</div></div>
      </div>

      {/* Tabs Activas / Desactivadas */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', paddingLeft:16, paddingTop:6, gap:0 }}>
        {[['activas','Activas'],['desactivadas','Desactivadas']].map(([k, l]) => (
          <button key={k} onClick={() => setVista(k)} style={{ padding:'6px 16px', fontSize:11, fontWeight: vista === k ? 600 : 500, cursor:'pointer', border:'none', borderBottom: vista === k ? '2px solid var(--accent)' : '2px solid transparent', background:'none', color: vista === k ? 'var(--accent)' : 'var(--text3)', fontFamily:'inherit' }}>
            {l}{k === 'desactivadas' && demandasDesact.length > 0 && <span style={{ marginLeft:5, fontSize:9, background:'var(--border)', borderRadius:8, padding:'0 4px' }}>{demandasDesact.length}</span>}
          </button>
        ))}
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" /></svg>
          <input className="search-inp" placeholder="Buscar demandas..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="tbtn" onClick={() => setShowAdv(v => !v)} style={showAdv || advCount > 0 ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-lt)' } : {}}>
          <SlidersHorizontal size={14} strokeWidth={1.75} /> Filtros{advCount > 0 && <span style={{ marginLeft: 4, fontSize: 9, background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '0 5px' }}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis} />
          <button className="tbtn"><Download size={14} strokeWidth={1.75} /> Exportar</button>
          <button className="tbtn prim" onClick={() => setShowNuevaModal(true)}>+ Nueva Demanda</button>
        </div>
      </div>
      {showAdv && (
        <div style={{ padding: '10px 16px', background: 'var(--gray-lt)', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <Field label="Estado"><select className="fsel" value={af.estado} onChange={e => setAf(p => ({ ...p, estado: e.target.value }))}><option value="">Todos</option><option>En Curso</option><option>Paralizado</option></select></Field>
          <Field label="Origen"><select className="fsel" value={af.origen} onChange={e => setAf(p => ({ ...p, origen: e.target.value }))}><option value="">Todos</option><option>IDEALISTA</option><option>Web Savills</option><option>Savills Internacional</option><option>Private Wealth</option><option>OTRAS CONSULTORAS</option><option>SAVILLS ESPAÑA</option><option>COVERAGE</option><option>COLABORADOR</option><option>WEB EXTERNA</option><option>OTROS SITIOS WEB</option></select></Field>
          <Field label="Consultor"><select className="fsel" value={af.by} onChange={e => setAf(p => ({ ...p, by: e.target.value }))}><option value="">Todos</option><option>Sierra Alvaro</option><option>GOMEZ Ignacio</option></select></Field>
          <Field label="Tipo búsqueda"><select className="fsel" value={af.tipoB} onChange={e => setAf(p => ({ ...p, tipoB: e.target.value }))}><option value="">Todos</option><option>Estándar</option><option>Estándar / Flexible</option></select></Field>
          <Field label="Sup. mín. m²"><input className="fsel" type="number" value={af.supMin} onChange={e => setAf(p => ({ ...p, supMin: e.target.value }))} /></Field>
          <Field label="Sup. máx. m²"><input className="fsel" type="number" value={af.supMax} onChange={e => setAf(p => ({ ...p, supMax: e.target.value }))} /></Field>
          {advCount > 0 && <button onClick={() => setAf({ estado: '', origen: '', by: '', tipoB: '', supMin: '', supMax: '' })} style={{ fontSize: 10, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit', alignSelf: 'flex-end', marginBottom: 2 }}>✕ Limpiar</button>}
        </div>
      )}
      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>{visibleCols.map(c => c.id === '_chk' ? <th key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} /></th> : c.sys ? <th key={c.id}>{c.label}</th> : <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={vistaList} />)}</tr>
          </thead>
          <tbody>
            {result.map(d => <tr key={d.ref} onClick={() => navigate('ficha-demanda', { id: d.ref })} style={{ cursor: 'pointer' }}>{visibleCols.map(c => cell(d)[c.id])}</tr>)}
          </tbody>
        </table>
      </div>

      {showNuevaModal && (
        <NuevaDemandaModal
          onClose={() => setShowNuevaModal(false)}
          onSuccess={() => { setShowNuevaModal(false); setReloadKey(k => k + 1) }}
        />
      )}
    </div>
  )
}
function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>{children}</div>
}
