import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import ColumnEditor, { useVisibleCols } from '../components/ColumnEditor'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'

const DEMANDAS = [
  {ref:'D251035690',origen:'OTRAS CONSULTORAS',created:'17/10/2025',by:'Sierra Alvaro',cuenta:'Grupo Empresarial Altamira SL',desc:'Búsqueda de oficinas estándar en zona norte de Madrid, aprox. 2.500 m².',estado:'En Curso',supMin:2200,supMax:3000,tipoB:'Estándar',razon:'Expansión / Crecimiento'},
  {ref:'D251035500',origen:'IDEALISTA',created:'20/10/2025',by:'GOMEZ Ignacio',cuenta:'Nexo Digital Media SL',desc:'Interesados en espacios flexibles en entorno tecnológico Madrid.',estado:'En Curso',supMin:300,supMax:500,tipoB:'',razon:'Expansión / Crecimiento'},
  {ref:'D250935800',origen:'Web Savills',created:'01/10/2025',by:'Sierra Alvaro',cuenta:'Centro Médico Integra SL',desc:'Búsqueda de local u oficina en zona norte para uso sanitario.',estado:'En Curso',supMin:200,supMax:300,tipoB:'',razon:'Expansión / Crecimiento'},
  {ref:'D250935600',origen:'Web Savills',created:'30/09/2025',by:'Sierra Alvaro',cuenta:'Hospitality Group Iberia SL',desc:'Contacto directo. Gestión patrimonial busca inmueble para nueva operación.',estado:'En Curso',supMin:2000,supMax:6000,tipoB:'',razon:'Expansión / Crecimiento'},
  {ref:'D250935400',origen:'WEB EXTERNA',created:'25/09/2025',by:'GOMEZ Ignacio',cuenta:'Estudio Arquitectura Vértice',desc:'Demanda captada vía portal externo. Buscan oficina representativa.',estado:'En Curso',supMin:600,supMax:1000,tipoB:'Estándar',razon:'Expansión / Crecimiento'},
  {ref:'D250934800',origen:'Savills Internacional',created:'15/09/2025',by:'GOMEZ Ignacio',cuenta:'Flexwork Solutions Spain SL',desc:'Demanda recurrente de operador de espacios flexibles a nivel nacional.',estado:'En Curso',supMin:800,supMax:6000,tipoB:'Estándar / Flexible',razon:'Expansión / Crecimiento'},
  {ref:'D250934600',origen:'COVERAGE',created:'12/09/2025',by:'GOMEZ Ignacio',cuenta:'Grupo Mediática España',desc:'Empresa de comunicación busca nueva sede para 2027. Proceso largo.',estado:'En Curso',supMin:13000,supMax:18000,tipoB:'Estándar',razon:'Reagrupación de espacios'},
  {ref:'D250934200',origen:'Private Wealth',created:'04/09/2025',by:'GOMEZ Ignacio',cuenta:'Capital Industrial Partners',desc:'Family office busca activo de oficinas como inversión patrimonial.',estado:'En Curso',supMin:500,supMax:700,tipoB:'Estándar',razon:'Reubicación'},
  {ref:'D250934000',origen:'COLABORADOR',created:'03/09/2025',by:'Sierra Alvaro',cuenta:'Academia Global Formación SL',desc:'Referenciado por colaborador externo. Necesitan espacio formativo.',estado:'En Curso',supMin:700,supMax:900,tipoB:'',razon:'Expansión / Crecimiento'},
  {ref:'D250733400',origen:'SAVILLS ESPAÑA',created:'16/07/2025',by:'GOMEZ Ignacio',cuenta:'Inversiones Familiar Velada',desc:'Family office busca inmueble premium entre 1.800 y 2.500 m².',estado:'En Curso',supMin:1400,supMax:2500,tipoB:'',razon:'Creación'},
  {ref:'D250733200',origen:'OTROS SITIOS WEB',created:'09/07/2025',by:'Sierra Alvaro',cuenta:'Maritime Trading España',desc:'Captado vía portal externo. Búsqueda en zona consolidada.',estado:'Paralizado',supMin:220,supMax:400,tipoB:'',razon:'Expansión / Crecimiento'},
]
const estadoTag = e => e === 'En Curso' ? 'tag-green' : e === 'Paralizado' ? 'tag-amber' : 'tag-gray'

const COLS = [
  { id: '_chk',   label: '',               sys: true },
  { id: 'ref',    label: 'Código',         required: true, type:'text',   getValue: r => r.ref },
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

export default function DemandaList() {
  const { navigate } = useNav()
  const [query, setQuery] = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [af, setAf] = useState({ estado: '', origen: '', by: '', tipoB: '', supMin: '', supMax: '' })
  const [vis, setVis] = useVisibleCols('demandas', COLS)

  const advCount = Object.values(af).filter(Boolean).length
  const preFiltered = DEMANDAS.filter(d => {
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
    ref:    <td key="ref"><span className="asset-link" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{d.ref}</span></td>,
    cuenta: <td key="cuenta"><div className="asset-link">{d.cuenta}</div></td>,
    origen: <td key="origen"><span className="tag tag-gray" style={{ fontSize: 9 }}>{d.origen}</span></td>,
    created:<td key="created" style={{ fontSize: 11 }}>{d.created}</td>,
    by:     <td key="by" style={{ fontSize: 11 }}>{d.by}</td>,
    desc:   <td key="desc" style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.desc}</td>,
    estado: <td key="estado"><span className={`tag ${estadoTag(d.estado)}`}>{d.estado}</span></td>,
    supMin: <td key="supMin" className="mono">{d.supMin.toLocaleString('es-ES')}</td>,
    supMax: <td key="supMax" className="mono">{d.supMax.toLocaleString('es-ES')}</td>,
    tipoB:  <td key="tipoB" style={{ fontSize: 11 }}>{d.tipoB || '—'}</td>,
    razon:  <td key="razon" style={{ fontSize: 11 }}>{d.razon}</td>,
    _act:   <td key="_act"><div className="ra-cell"><button className="ra p" onClick={e => { e.stopPropagation(); navigate('ficha-demanda') }}>Ver</button></div></td>,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Total demandas</div><div className="ks-val">63</div><div className="ks-sub">Equipo Off Leas MAD · 2025</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">En curso</div><div className="ks-val green">58</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Paralizadas</div><div className="ks-val amber">5</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Sup. media buscada</div><div className="ks-val">2.800 m²</div></div>
        <div className="ks" style={{ padding: '12px 16px' }}><div className="ks-lbl">Sólo alquiler</div><div className="ks-val" style={{ color: 'var(--accent)' }}>63</div></div>
      </div>
      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" /></svg>
          <input className="search-inp" placeholder="Buscar demandas..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="tbtn" onClick={() => setShowAdv(v => !v)} style={showAdv || advCount > 0 ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-lt)' } : {}}>
          ⚙ Filtros{advCount > 0 && <span style={{ marginLeft: 4, fontSize: 9, background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '0 5px' }}>{advCount}</span>}
        </button>
        <FilterBadge count={activeCount} onClear={clearAll} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <ColumnEditor cols={COLS} vis={vis} setVis={setVis} />
          <button className="tbtn">⬇ Exportar</button>
          <button className="tbtn prim" onClick={() => navigate('ficha-demanda')}>+ Nueva Demanda</button>
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
            <tr>{visibleCols.map(c => c.id === '_chk' ? <th key="_chk"><input type="checkbox" style={{ accentColor: 'var(--accent)' }} /></th> : c.sys ? <th key={c.id}>{c.label}</th> : <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={DEMANDAS} />)}</tr>
          </thead>
          <tbody>
            {result.map(d => <tr key={d.ref} onClick={() => navigate('ficha-demanda')} style={{ cursor: 'pointer' }}>{visibleCols.map(c => cell(d)[c.id])}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>{children}</div>
}
