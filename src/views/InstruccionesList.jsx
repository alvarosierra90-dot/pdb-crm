import { useState } from 'react'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import BannerInfo from '../components/BannerInfo'

const MOCK_INSTRUCCIONES = [
  { id:'INS-2501', pais:'España', nombre:'Avalon P5 — Generali Arrendamiento',         entidad_legal:'Savills Aguirre Newman SA',    razon:'Contrato firmado',   sup:'1.500',  lifetime:'85.000',  oficina:'Madrid · Oficinas',    division:'Leasing',          cuenta:'Generali Real Estate',        contacto:'Carlos Vega',       fecha:'15/04/2026', responsable:'Sierra Álvaro' },
  { id:'INS-2502', pais:'España', nombre:'Albatros D — Oracle Relocation',              entidad_legal:'Savills Aguirre Newman SA',    razon:'Contrato firmado',   sup:'13.486', lifetime:'185.000', oficina:'Madrid · Oficinas',    division:'Leasing',          cuenta:'Oracle Spain SL',             contacto:'James Richardson',  fecha:'30/04/2026', responsable:'Sierra Álvaro' },
  { id:'INS-2503', pais:'España', nombre:'SLB Plataforma Logística — FREO',             entidad_legal:'Savills Management SL',       razon:'Firmado',            sup:'28.000', lifetime:'420.000', oficina:'Madrid · Cap. Markets',division:'Capital Markets',  cuenta:'FREO Investments Spain SL',   contacto:'Ignacio Suárez',    fecha:'30/06/2026', responsable:'Sierra Álvaro' },
  { id:'INS-2504', pais:'España', nombre:'Torre Picasso P18 — ISDE Expansión',          entidad_legal:'Savills Aguirre Newman SA',    razon:'Contrato firmado',   sup:'2.400',  lifetime:'58.000',  oficina:'Madrid · Oficinas',    division:'Leasing',          cuenta:'ISDE',                        contacto:'María Fernández',   fecha:'28/02/2026', responsable:'GOMEZ Ignacio' },
  { id:'INS-2505', pais:'España', nombre:'Venta edificio Castellana 120 — Merlín',      entidad_legal:'Savills Management SL',       razon:'Venta escriturada',  sup:'18.500', lifetime:'650.000', oficina:'Madrid · Cap. Markets',division:'Capital Markets',  cuenta:'Merlín Properties SOCIMI',    contacto:'Elena Torres',      fecha:'15/01/2026', responsable:'Sierra Álvaro' },
  { id:'INS-2506', pais:'España', nombre:'Parque Empresarial Alcobendas — Capital Ind.',entidad_legal:'Savills Management SL',       razon:'Contrato firmado',   sup:'4.200',  lifetime:'95.000',  oficina:'Madrid · Cap. Markets',division:'Capital Markets',  cuenta:'Capital Industrial Partners', contacto:'Roberto Peña',      fecha:'30/09/2026', responsable:'Sierra Álvaro' },
]

const toNum = v => Number(String(v).replace(/\./g,'').replace(/,/g,'.')) || 0

const COLS = [
  { id:'_dyn',         label:'',                          sys:true },
  { id:'id',           label:'ID',                        type:'text',   getValue: r => r.id },
  { id:'pais',         label:'País',                      type:'enum',   getValue: r => r.pais },
  { id:'nombre',       label:'Nombre',                    type:'text',   getValue: r => r.nombre },
  { id:'entidad_legal',label:'Entidad legal',             type:'enum',   getValue: r => r.entidad_legal },
  { id:'razon',        label:'Razón / Estado',            type:'enum',   getValue: r => r.razon },
  { id:'sup',          label:'Superficie (m²)',           type:'number', getValue: r => toNum(r.sup) },
  { id:'lifetime',     label:'Lifetime Fee (€)',          type:'number', getValue: r => toNum(r.lifetime) },
  { id:'oficina',      label:'Oficina y departamento',    type:'enum',   getValue: r => r.oficina },
  { id:'division',     label:'División',                  type:'enum',   getValue: r => r.division },
  { id:'cuenta',       label:'Cuenta',                    type:'enum',   getValue: r => r.cuenta },
  { id:'contacto',     label:'Contacto cliente',          type:'text',   getValue: r => r.contacto },
  { id:'fecha',        label:'Fecha',                     type:'text',   getValue: r => r.fecha },
  { id:'responsable',  label:'Responsable',               type:'enum',   getValue: r => r.responsable },
]

function DynIcon() {
  return (
    <button
      title="Abrir en Microsoft Dynamics 365"
      onClick={e => { e.stopPropagation(); alert('En producción, este enlace abrirá la instrucción directamente en Microsoft Dynamics 365.') }}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', width:22, height:22, borderRadius:4, background:'#B08D57', border:'none', cursor:'pointer', flexShrink:0, padding:0 }}
    >
      <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
        <path d="M3 2h5.5L13 6.5v7.5H3V2z" fill="#fff" opacity=".9"/>
        <path d="M8.5 2v4.5H13" stroke="#B08D57" strokeWidth="1.2"/>
        <path d="M5.5 8.5h5M5.5 11h3.5" stroke="#B08D57" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

export default function InstruccionesList() {
  const [query, setQuery] = useState('')

  const preFiltered = MOCK_INSTRUCCIONES
    .filter(r => !query || r.nombre.toLowerCase().includes(query.toLowerCase()) || r.cuenta.toLowerCase().includes(query.toLowerCase()))

  const { result: data, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <BannerInfo variant="dynamics" title="Solo lectura · Cierre oficial en Microsoft Dynamics 365" hint="Las instrucciones se crean y gestionan exclusivamente en Dynamics" />

      {/* KPI strip canónico */}
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">Total instrucciones</div><div className="ks-val">{MOCK_INSTRUCCIONES.length}</div></div>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">Lifetime total</div><div className="ks-val green">{MOCK_INSTRUCCIONES.reduce((s,i) => s + toNum(i.lifetime), 0).toLocaleString('es-ES')} €</div></div>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">SBA total</div><div className="ks-val">{(MOCK_INSTRUCCIONES.reduce((s,i) => s + toNum(i.sup), 0) / 1000).toFixed(0)}k m²</div></div>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">Capital Markets</div><div className="ks-val amber">{MOCK_INSTRUCCIONES.filter(i => i.division === 'Capital Markets').length}</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar instrucciones..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <FilterBadge count={activeCount} onClear={clearAll} />
        <span style={{ fontSize:11, color:'var(--text4)' }}>{data.length} registros</span>
      </div>

      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>
              {COLS.map(c => c.sys
                ? <th key={c.id} style={{ width:30 }}></th>
                : <ColHeader key={c.id} col={c} sorts={sorts} filters={filters} setSort={setSort} setFilter={setFilter} clearFilter={clearFilter} allRows={preFiltered} />
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0
              ? <tr><td colSpan={COLS.length} style={{ textAlign:'center', padding:32, color:'var(--text4)', fontSize:12 }}>No se encontraron registros</td></tr>
              : data.map(r => (
                <tr key={r.id} style={{ cursor:'default' }}>
                  <td style={{ padding:'6px 8px' }}><DynIcon /></td>
                  <td><span className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{r.id}</span></td>
                  <td style={{ fontSize:11 }}>{r.pais}</td>
                  <td style={{ fontWeight:600, fontSize:11, minWidth:240, maxWidth:360, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.nombre}</td>
                  <td style={{ fontSize:11, color:'var(--text3)' }}>{r.entidad_legal}</td>
                  <td><span style={{ fontSize:9, background:'#f0fdf4', color:'var(--green)', border:'1px solid #bbf7d0', borderRadius:8, padding:'2px 8px', fontWeight:700, whiteSpace:'nowrap' }}>{r.razon}</span></td>
                  <td style={{ fontSize:11, textAlign:'right' }}><span className="mono">{Number(r.sup).toLocaleString('es-ES')} m²</span></td>
                  <td style={{ fontSize:11, textAlign:'right', color:'var(--green)', fontWeight:700 }}><span className="mono">{Number(r.lifetime).toLocaleString('es-ES')} €</span></td>
                  <td style={{ fontSize:11 }}>{r.oficina}</td>
                  <td><span className={`tag ${r.division === 'Capital Markets' ? 'tag-amber' : 'tag-blue'}`}>{r.division}</span></td>
                  <td style={{ fontSize:11, color:'var(--accent)' }}>{r.cuenta}</td>
                  <td style={{ fontSize:11 }}>{r.contacto}</td>
                  <td style={{ fontSize:11, color:'var(--text3)' }}><span className="mono">{r.fecha}</span></td>
                  <td style={{ fontSize:11, color:'var(--accent)' }}>{r.responsable}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      <div style={{ padding:'5px 16px', fontSize:10, color:'var(--text4)', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        Filas: {data.length} · Read-only · Fuente: Microsoft Dynamics 365
      </div>
    </div>
  )
}
