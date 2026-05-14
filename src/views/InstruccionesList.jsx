import { useState } from 'react'
import BannerInfo from '../components/BannerInfo'

const MOCK_INSTRUCCIONES = [
  { id:'INS-2501', pais:'España', nombre:'Avalon P5 — Generali Arrendamiento',         entidad_legal:'Savills Aguirre Newman SA',    razon:'Contrato firmado',   sup:'1.500',  lifetime:'85.000',  oficina:'Madrid · Oficinas',    division:'Leasing',          cuenta:'Generali Real Estate',        contacto:'Carlos Vega',       fecha:'15/04/2026', responsable:'Sierra Álvaro' },
  { id:'INS-2502', pais:'España', nombre:'Albatros D — Oracle Relocation',              entidad_legal:'Savills Aguirre Newman SA',    razon:'Contrato firmado',   sup:'13.486', lifetime:'185.000', oficina:'Madrid · Oficinas',    division:'Leasing',          cuenta:'Oracle Spain SL',             contacto:'James Richardson',  fecha:'30/04/2026', responsable:'Sierra Álvaro' },
  { id:'INS-2503', pais:'España', nombre:'SLB Plataforma Logística — FREO',             entidad_legal:'Savills Management SL',       razon:'Firmado',            sup:'28.000', lifetime:'420.000', oficina:'Madrid · Cap. Markets',division:'Capital Markets',  cuenta:'FREO Investments Spain SL',   contacto:'Ignacio Suárez',    fecha:'30/06/2026', responsable:'Sierra Álvaro' },
  { id:'INS-2504', pais:'España', nombre:'Torre Picasso P18 — ISDE Expansión',          entidad_legal:'Savills Aguirre Newman SA',    razon:'Contrato firmado',   sup:'2.400',  lifetime:'58.000',  oficina:'Madrid · Oficinas',    division:'Leasing',          cuenta:'ISDE',                        contacto:'María Fernández',   fecha:'28/02/2026', responsable:'GOMEZ Ignacio' },
  { id:'INS-2505', pais:'España', nombre:'Venta edificio Castellana 120 — Merlín',      entidad_legal:'Savills Management SL',       razon:'Venta escriturada',  sup:'18.500', lifetime:'650.000', oficina:'Madrid · Cap. Markets',division:'Capital Markets',  cuenta:'Merlín Properties SOCIMI',    contacto:'Elena Torres',      fecha:'15/01/2026', responsable:'Sierra Álvaro' },
  { id:'INS-2506', pais:'España', nombre:'Parque Empresarial Alcobendas — Capital Ind.',entidad_legal:'Savills Management SL',       razon:'Contrato firmado',   sup:'4.200',  lifetime:'95.000',  oficina:'Madrid · Cap. Markets',division:'Capital Markets',  cuenta:'Capital Industrial Partners', contacto:'Roberto Peña',      fecha:'30/09/2026', responsable:'Sierra Álvaro' },
]

const COLS = [
  { key:'pais',         label:'País' },
  { key:'nombre',       label:'Nombre' },
  { key:'entidad_legal',label:'Entidad legal' },
  { key:'razon',        label:'Razón / Estado' },
  { key:'sup',          label:'Superficie (m²)' },
  { key:'lifetime',     label:'Lifetime Fee (€)' },
  { key:'oficina',      label:'Oficina y departamento' },
  { key:'division',     label:'División' },
  { key:'cuenta',       label:'Cuenta' },
  { key:'contacto',     label:'Contacto cliente' },
  { key:'fecha',        label:'Fecha' },
  { key:'responsable',  label:'Responsable' },
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

function SortIcon({ active, dir }) {
  if (!active) return <span style={{ color:'var(--border)', fontSize:10, marginLeft:3 }}>↕</span>
  return <span style={{ color:'var(--accent)', fontSize:10, marginLeft:3 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

export default function InstruccionesList() {
  const [sort, setSort] = useState({ col:'fecha', dir:'desc' })
  const [query, setQuery] = useState('')

  const toggleSort = (col) => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))

  const data = [...MOCK_INSTRUCCIONES]
    .filter(r => !query || r.nombre.toLowerCase().includes(query.toLowerCase()) || r.cuenta.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      const va = String(a[sort.col] ?? '').toLowerCase()
      const vb = String(b[sort.col] ?? '').toLowerCase()
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <BannerInfo variant="dynamics" title="Solo lectura · Cierre oficial en Microsoft Dynamics 365" hint="Las instrucciones se crean y gestionan exclusivamente en Dynamics" />

      {/* Toolbar */}
      <div style={{ padding:'8px 16px', background:'var(--surface)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700 }}>Transacción / Instrucción</div>
        <span style={{ fontSize:11, color:'var(--text4)', marginLeft:4 }}>{data.length} registros</span>
        <div className="search-wrap" style={{ marginLeft:'auto' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar instrucciones..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      {/* Tabla */}
      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>
              <th style={{ width:30 }}></th>
              {COLS.map(c => (
                <th key={c.key} onClick={() => toggleSort(c.key)} style={{ cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
                  {c.label}<SortIcon active={sort.col === c.key} dir={sort.dir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0
              ? <tr><td colSpan={COLS.length + 1} style={{ textAlign:'center', padding:32, color:'var(--text4)', fontSize:12 }}>No se encontraron registros</td></tr>
              : data.map(r => (
                <tr key={r.id} style={{ cursor:'default' }}>
                  <td style={{ padding:'6px 8px' }}><DynIcon /></td>
                  <td style={{ fontSize:11 }}>{r.pais}</td>
                  <td style={{ fontWeight:600, fontSize:11, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.nombre}</td>
                  <td style={{ fontSize:11, color:'var(--text3)' }}>{r.entidad_legal}</td>
                  <td><span style={{ fontSize:9, background:'#f0fdf4', color:'var(--green)', border:'1px solid #bbf7d0', borderRadius:8, padding:'2px 8px', fontWeight:700, whiteSpace:'nowrap' }}>{r.razon}</span></td>
                  <td style={{ fontSize:11, fontFamily:'var(--mono)', textAlign:'right' }}>{Number(r.sup).toLocaleString('es-ES')} m²</td>
                  <td style={{ fontSize:11, fontFamily:'var(--mono)', textAlign:'right', color:'var(--green)', fontWeight:700 }}>{Number(r.lifetime).toLocaleString('es-ES')} €</td>
                  <td style={{ fontSize:11 }}>{r.oficina}</td>
                  <td><span className={`tag ${r.division === 'Capital Markets' ? 'tag-amber' : 'tag-blue'}`} style={{ fontSize:9 }}>{r.division}</span></td>
                  <td style={{ fontSize:11, color:'var(--accent)' }}>{r.cuenta}</td>
                  <td style={{ fontSize:11 }}>{r.contacto}</td>
                  <td style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', whiteSpace:'nowrap' }}>{r.fecha}</td>
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
