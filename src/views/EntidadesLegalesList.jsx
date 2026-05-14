import { useState } from 'react'
import BannerInfo from '../components/BannerInfo'

const MOCK_ENTIDADES = [
  { id:'EL-001', nombre_legal:'Savills Aguirre Newman SA',                cuenta:'Savills RE Spain SAU',                dir1:'Calle de Serrano 73',         ciudad:'Madrid',    pais:'España', reg:'A-28123456', duns:'12-345-6789' },
  { id:'EL-002', nombre_legal:'Savills Management SL',                    cuenta:'Savills RE Spain SAU',                dir1:'Calle de Serrano 73',         ciudad:'Madrid',    pais:'España', reg:'B-28654321', duns:'12-345-6790' },
  { id:'EL-003', nombre_legal:'Oracle Spain SL',                          cuenta:'Oracle Spain SL',                    dir1:'Calle de Basauri 17',         ciudad:'Madrid',    pais:'España', reg:'B-28112233', duns:'22-111-2233' },
  { id:'EL-004', nombre_legal:'Generali Real Estate Spain SA',            cuenta:'Generali Real Estate',               dir1:'Paseo de la Castellana 79',   ciudad:'Madrid',    pais:'España', reg:'A-28445566', duns:'33-222-3344' },
  { id:'EL-005', nombre_legal:'Generali Seguros SA',                      cuenta:'Generali Real Estate',               dir1:'Paseo de la Castellana 79',   ciudad:'Madrid',    pais:'España', reg:'A-28778899', duns:'33-222-3345' },
  { id:'EL-006', nombre_legal:'Grupo Mediática España SL',                cuenta:'Grupo Mediática España',             dir1:'Calle del Gobernador 23',     ciudad:'Madrid',    pais:'España', reg:'B-28001122', duns:'44-333-4455' },
  { id:'EL-007', nombre_legal:'ISDE Abogados SL',                        cuenta:'ISDE',                               dir1:'Calle de Núñez de Balboa 35', ciudad:'Madrid',    pais:'España', reg:'B-28334455', duns:'55-444-5566' },
  { id:'EL-008', nombre_legal:'Capital Industrial Partners Spain SL',     cuenta:'Capital Industrial Partners',        dir1:'Paseo de Gracia 60',         ciudad:'Barcelona', pais:'España', reg:'B-08223344', duns:'66-555-6677' },
  { id:'EL-009', nombre_legal:'FREO Investments Spain SL',               cuenta:'FREO Investments Spain SL',          dir1:'Calle de Serrano 90',         ciudad:'Madrid',    pais:'España', reg:'B-28556677', duns:'77-666-7788' },
  { id:'EL-010', nombre_legal:'Merlín Properties SOCIMI SA',              cuenta:'Merlín Properties SOCIMI',           dir1:'Paseo de la Castellana 257',  ciudad:'Madrid',    pais:'España', reg:'A-28889900', duns:'88-777-8899' },
  { id:'EL-011', nombre_legal:'Grupo Empresarial Altamira SL',            cuenta:'Grupo Empresarial Altamira SL',      dir1:'Calle de Orense 4',           ciudad:'Madrid',    pais:'España', reg:'B-28100200', duns:'99-888-9900' },
  { id:'EL-012', nombre_legal:'Inversiones Familiar Velada SA',           cuenta:'Inversiones Familiar Velada',        dir1:'Paseo del Prado 12',          ciudad:'Madrid',    pais:'España', reg:'A-28300400', duns:'11-999-1100' },
]

const COLS = [
  { key:'nombre_legal', label:'Nombre legal' },
  { key:'cuenta',       label:'Cuenta' },
  { key:'dir1',         label:'Línea de dirección 1' },
  { key:'ciudad',       label:'Pueblo / Ciudad' },
  { key:'pais',         label:'País' },
  { key:'reg',          label:'Nº registro compañía' },
  { key:'duns',         label:'Nº DUNS' },
]

function DynIcon() {
  return (
    <button
      title="Abrir en Microsoft Dynamics 365"
      onClick={e => { e.stopPropagation(); alert('En producción, este enlace abrirá la entidad legal directamente en Microsoft Dynamics 365.') }}
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

export default function EntidadesLegalesList() {
  const [sort, setSort] = useState({ col:'nombre_legal', dir:'asc' })
  const [query, setQuery] = useState('')

  const toggleSort = (col) => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))

  const data = [...MOCK_ENTIDADES]
    .filter(r => !query || r.nombre_legal.toLowerCase().includes(query.toLowerCase()) || r.cuenta.toLowerCase().includes(query.toLowerCase()) || r.ciudad.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      const va = String(a[sort.col] ?? '').toLowerCase()
      const vb = String(b[sort.col] ?? '').toLowerCase()
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <BannerInfo variant="dynamics" title="Solo lectura · Entidades de facturación en Microsoft Dynamics 365" hint="Las entidades legales se definen y controlan exclusivamente en Dynamics" />

      {/* Toolbar */}
      <div style={{ padding:'8px 16px', background:'var(--surface)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700 }}>Entidades Legales</div>
        <span style={{ fontSize:11, color:'var(--text4)', marginLeft:4 }}>{data.length} registros</span>
        <div style={{ fontSize:10, color:'var(--text3)', marginLeft:8, padding:'2px 8px', background:'var(--gray-lt)', borderRadius:8, border:'1px solid var(--border)' }}>
          Sociedad jurídica de facturación
        </div>
        <div className="search-wrap" style={{ marginLeft:'auto' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar entidades legales..." value={query} onChange={e => setQuery(e.target.value)} />
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
                  <td style={{ fontWeight:600, fontSize:11 }}>{r.nombre_legal}</td>
                  <td style={{ fontSize:11, color:'var(--accent)' }}>{r.cuenta}</td>
                  <td style={{ fontSize:11, color:'var(--text3)' }}>{r.dir1}</td>
                  <td style={{ fontSize:11 }}>{r.ciudad}</td>
                  <td style={{ fontSize:11 }}>{r.pais}</td>
                  <td style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text3)' }}>{r.reg}</td>
                  <td style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text3)' }}>{r.duns}</td>
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
