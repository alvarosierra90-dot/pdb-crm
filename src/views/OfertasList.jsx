import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { OFERTAS as MOCK_OFERTAS } from '../data/mockData'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import { formatRef } from '../lib/formatRef'
import { healRefs } from '../lib/healRefs'
import { Download, SlidersHorizontal, AlertTriangle } from 'lucide-react'

const estadoTag = { 'En revisión': 'tag-amber', 'Negociando': 'tag-purple', 'Pre-acuerdo': 'tag-green', 'En curso': 'tag-blue', 'Disponible': 'tag-green', 'En negociación': 'tag-amber', 'Cerrada': 'tag-gray', 'Finalista': 'tag-green' }

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
  { id: '_chk',      label: '',                             sys: true },
  { id: 'ref',       label: 'ID',             required: true, type:'text',   getValue: r => r.ref },
  { id: 'activo',    label: 'Activo',         required: true, type:'text',   getValue: r => r.activo },
  { id: 'area',      label: 'Área',                          type:'enum',   getValue: r => r.area },
  { id: 'zona',      label: 'Zona',                          type:'enum',   getValue: r => r.zona },
  { id: 'subzona',   label: 'Subzona',                       type:'enum',   getValue: r => r.subzona },
  { id: 'm2',        label: 'Sup. disponible (m²)',          type:'number', getValue: r => r.m2 },
  { id: 'renta',     label: 'Renta ofertada',                type:'text',   getValue: r => r.renta },
  { id: 'gastos',    label: 'Gastos (€/m²/mes)',             type:'number', getValue: r => r.gastos },
  { id: 'ibi',       label: 'IBI (€/m²/mes)',                type:'number', getValue: r => r.ibi },
  { id: 'tipo',      label: 'Tipo',                          type:'enum',   getValue: r => r.tipo },
  { id: 'origen',    label: 'Origen',                        type:'enum',   getValue: r => r.origen },
  { id: 'estado',    label: 'Estado',                        type:'enum',   getValue: r => r.estado },
  { id: '_act',      label: '',                             sys: true },
]

export default function OfertasList() {
  const { navigate } = useNav()
  const [query, setQuery] = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ tipo: '', estado: '', m2Min: '', m2Max: '' })
  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('activas') // 'activas' | 'desactivadas'

  useEffect(() => {
    // Auto-limpia refs legacy/UUIDs en ofertas a OFR-NNNNNNN
    healRefs('ofertas', 'OFR').finally(() => {
    Promise.all([
      supabase.from('ofertas').select('*').order('created_at', { ascending: false }),
      supabase.from('activos').select('ref, nombre, direccion, zona, subzona, ciudad'),
    ]).then(([{ data: ofertasData, error }, { data: activosData }]) => {
      if (!error && ofertasData) {
        const activosMap = Object.fromEntries((activosData || []).map(a => [a.ref, a]))
        setOfertas(ofertasData.map(o => {
          const act = activosMap[o.activo_ref]
          return {
            id:         o.id,
            ref:        formatRef(o.ref || o.id, 'OFR'),
            activo:     act?.nombre || o.activo_ref || (o.activo_ref ? o.activo_ref : 'Pendiente Activo'),
            activo_dir: act?.direccion || '',
            activo_ref: o.activo_ref || '',
            sin_activo: !o.activo_ref,
            area:       act?.ciudad   || '—',
            zona:       act?.zona     || '—',
            subzona:    act?.subzona  || '—',
            m2:         o.superficie_disponible || 0,
            renta:      o.renta_m2 ? `${o.renta_m2} €/m²/mes` : '—',
            gastos:     o.gastos_comunes ?? o.gastos_medios ?? null,
            ibi:        o.ibi_medio ?? null,
            tipo:       o.tipo_operacion || '—',
            origen:     o.origen_oferta  || '—',
            estado:     o.estado         || '—',
            activa:     o.activa !== false, // treat null/undefined as active
          }
        }))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
    })
  }, [])

  const [creando, setCreando] = useState(false)

  const handleReactivar = async (ref, e) => {
    e.stopPropagation()
    await supabase.from('ofertas').update({ activa: true, estado: 'Disponible' }).eq('ref', ref)
    setOfertas(prev => prev.map(o => o.ref === ref ? { ...o, activa: true, estado: 'Disponible' } : o))
  }

  const handleNuevaOferta = async () => {
    setCreando(true)
    const { nextRef } = await import('../lib/nextRef')
    const ref = await nextRef('ofertas', 'OFR')
    const { data, error } = await supabase.from('ofertas').insert({
      ref,
      tipo_comercializacion: 'Mandato Savills',
      tipo_operacion: 'Alquiler',
      estado: 'Disponible',
      activa: true,
    }).select().single()
    setCreando(false)
    if (!error && data) {
      navigate('ficha-oferta', { ofertaRef: data.ref, nuevaOferta: true })
    }
  }

  const ofertasActivas = ofertas.filter(o => o.activa)
  const ofertasDesact  = ofertas.filter(o => !o.activa)
  const vistaOfertas   = vista === 'activas' ? ofertasActivas : ofertasDesact

  const advCount = Object.values(af).filter(Boolean).length
  const preFiltered = vistaOfertas.filter(o => {
    const q = query.toLowerCase()
    if (q && !(o.activo||'').toLowerCase().includes(q) && !(o.ref||'').toLowerCase().includes(q) && !(o.activo_dir||'').toLowerCase().includes(q)) return false
    if (af.tipo      && o.tipo !== af.tipo) return false
    if (af.estado    && o.estado !== af.estado) return false
    if (af.m2Min     && o.m2 < parseInt(af.m2Min)) return false
    if (af.m2Max     && o.m2 > parseInt(af.m2Max)) return false
    return true
  })

  const { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)
  const visibleCols = COLS
  const allRows = vistaOfertas

  const cell = (o) => ({
    _chk:    <td key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} onClick={e => e.stopPropagation()} /></td>,
    ref:     <td key="ref"><span className="asset-link" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{o.ref}</span></td>,
    activo:  <td key="activo"><div className="asset-link">{o.activo}</div>{o.activo_dir && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, lineHeight:1.3 }}>{o.activo_dir}</div>}</td>,
    area:    <td key="area" style={{ fontSize:11, color:'var(--text2)' }}>{o.area !== '—' ? o.area : <span style={{ color:'var(--text4)' }}>—</span>}</td>,
    zona:    <td key="zona" style={{ fontSize:11, color:'var(--text2)' }}>{o.zona !== '—' ? o.zona : <span style={{ color:'var(--text4)' }}>—</span>}</td>,
    subzona: <td key="subzona" style={{ fontSize:11, color:'var(--text3)' }}>{o.subzona !== '—' ? o.subzona : <span style={{ color:'var(--text4)' }}>—</span>}</td>,
    m2:      <td key="m2" className="mono">{o.m2 > 0 ? o.m2.toLocaleString('es-ES') + ' m²' : <span style={{ color:'var(--text4)' }}>—</span>}</td>,
    renta:   <td key="renta" className="mono">{o.renta}</td>,
    gastos:  <td key="gastos" className="mono">{o.gastos != null ? `${Number(o.gastos).toFixed(2)} €` : <span style={{ color:'var(--text4)' }}>—</span>}</td>,
    ibi:     <td key="ibi" className="mono">{o.ibi != null ? `${Number(o.ibi).toFixed(2)} €` : <span style={{ color:'var(--text4)' }}>—</span>}</td>,
    tipo:    <td key="tipo">{o.tipo !== '—' ? <span className="tag tag-blue">{o.tipo}</span> : <span style={{ color:'var(--text4)' }}>—</span>}</td>,
    origen:  <td key="origen" style={{ fontSize: 11, color: 'var(--text3)' }}>{o.origen}</td>,
    estado:  <td key="estado"><span className={`tag ${estadoTag[o.estado] || 'tag-gray'}`}>{o.estado}</span></td>,
    _act:    <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e => { e.stopPropagation(); navigate('ficha-oferta', { ofertaRef: o.ref }) }}>Ver</button>{vista==='desactivadas' && <button className="ra" style={{color:'var(--green)',borderColor:'var(--green)'}} onClick={e=>handleReactivar(o.ref,e)}>Reactivar</button>}</div></td>,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Activas</div><div className="ks-val green">{ofertasActivas.length}</div><div className="ks-sub">Disponibles + negociación</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Disponibles</div><div className="ks-val">{ofertasActivas.filter(o=>o.estado==='Disponible'||o.estado==='En curso').length}</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">En negociación</div><div className="ks-val amber">{ofertasActivas.filter(o=>o.estado==='En negociación').length}</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Desactivadas</div><div className="ks-val" style={{color:'var(--text3)'}}>{ofertasDesact.length}</div><div className="ks-sub">Arrendadas / retiradas</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Sup. disponible</div><div className="ks-val">{ofertasActivas.reduce((s,o)=>s+(o.m2||0),0).toLocaleString('es-ES')} m²</div></div>
      </div>
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',background:'var(--surface)',paddingLeft:16,paddingTop:6,gap:0}}>
        {[['activas','Activas'],['desactivadas','Desactivadas']].map(([k,l])=>(
          <button key={k} onClick={()=>setVista(k)} style={{padding:'6px 16px',fontSize:11,fontWeight:vista===k?600:500,cursor:'pointer',border:'none',borderBottom:vista===k?'2px solid var(--accent)':'2px solid transparent',background:'none',color:vista===k?'var(--accent)':'var(--text3)',fontFamily:'inherit'}}>
            {l}{k==='desactivadas'&&ofertasDesact.length>0&&<span style={{marginLeft:5,fontSize:9,background:'var(--border)',borderRadius:8,padding:'0 4px'}}>{ofertasDesact.length}</span>}
          </button>
        ))}
      </div>
      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" /></svg>
          <input className="search-inp" placeholder="Buscar ofertas..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="tbtn" onClick={() => setShowAdv(v => !v)} style={showAdv || advCount > 0 ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-lt)' } : {}}>
          <SlidersHorizontal size={14} strokeWidth={1.75} /> Filtros{advCount > 0 && <span style={{ marginLeft: 4, fontSize: 9, background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '0 5px' }}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="tbtn"><Download size={14} strokeWidth={1.75} /> Exportar</button>
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
              <tr>{visibleCols.map(c => c.id === '_chk' ? <th key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} /></th> : c.sys ? <th key={c.id}>{c.label}</th> : <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={allRows} />)}</tr>
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
