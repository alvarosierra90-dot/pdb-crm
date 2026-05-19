import { useState } from 'react'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import BannerInfo from '../components/BannerInfo'

const MOCK_CUENTAS = [
  { id:'CTA-001', nombre:'Corporación Financiera Azuaga SL',   dir:'Avda. Diego Martínez Barrios 4',  ciudad:'Sevilla',   pais:'España',  industria:'Servicios financieros',  companero:'Sierra Álvaro',   principal:'—',               rel_cap:'IH' },
  { id:'CTA-002', nombre:'Oracle Spain SL',                    dir:'Calle de Basauri 17',             ciudad:'Madrid',    pais:'España',  industria:'Tecnología',             companero:'Sierra Álvaro',   principal:'Oracle Corp.',    rel_cap:'IH' },
  { id:'CTA-003', nombre:'Generali Real Estate',               dir:'Paseo de la Castellana 79',       ciudad:'Madrid',    pais:'España',  industria:'Seguros / Inversión',    companero:'Sierra Álvaro',   principal:'Generali Group',  rel_cap:'IH' },
  { id:'CTA-004', nombre:'Grupo Mediática España',             dir:'Calle del Gobernador 23',         ciudad:'Madrid',    pais:'España',  industria:'Media',                  companero:'GOMEZ Ignacio',   principal:'Mediática Int.',  rel_cap:'—' },
  { id:'CTA-005', nombre:'ISDE',                               dir:'Calle de Núñez de Balboa 35',     ciudad:'Madrid',    pais:'España',  industria:'Educación',              companero:'Sierra Álvaro',   principal:'—',               rel_cap:'—' },
  { id:'CTA-006', nombre:'RENTAMAR SL',                        dir:'Calle de Goya 45',                ciudad:'Madrid',    pais:'España',  industria:'Alimentación',           companero:'Sierra Álvaro',   principal:'—',               rel_cap:'—' },
  { id:'CTA-007', nombre:'Capital Industrial Partners',        dir:'Paseo de Gracia 60',              ciudad:'Barcelona', pais:'España',  industria:'Private Equity',         companero:'GOMEZ Ignacio',   principal:'CIP Holdings',    rel_cap:'IH' },
  { id:'CTA-008', nombre:'Merlín Properties SOCIMI',           dir:'Paseo de la Castellana 257',      ciudad:'Madrid',    pais:'España',  industria:'Real Estate',            companero:'Sierra Álvaro',   principal:'—',               rel_cap:'IH' },
  { id:'CTA-009', nombre:'FREO Investments Spain SL',          dir:'Calle de Serrano 90',             ciudad:'Madrid',    pais:'España',  industria:'Real Estate / Inversión','companero':'GOMEZ Ignacio', principal:'FREO Group',      rel_cap:'IH' },
  { id:'CTA-010', nombre:'Grupo Empresarial Altamira SL',      dir:'Calle de Orense 4',               ciudad:'Madrid',    pais:'España',  industria:'Construcción',           companero:'Sierra Álvaro',   principal:'—',               rel_cap:'—' },
  { id:'CTA-011', nombre:'Nexo Digital Media SL',              dir:'Carrer de Balmes 120',            ciudad:'Barcelona', pais:'España',  industria:'Tecnología',             companero:'GOMEZ Ignacio',   principal:'—',               rel_cap:'—' },
  { id:'CTA-012', nombre:'Hospitality Group Iberia SL',        dir:'Calle de Alcalá 502',             ciudad:'Madrid',    pais:'España',  industria:'Hostelería',             companero:'Sierra Álvaro',   principal:'HGI Europe',      rel_cap:'—' },
  { id:'CTA-013', nombre:'Academia Global Formación SL',       dir:'Calle de Príncipe de Vergara 145',ciudad:'Madrid',    pais:'España',  industria:'Educación',              companero:'GOMEZ Ignacio',   principal:'—',               rel_cap:'—' },
  { id:'CTA-014', nombre:'Inversiones Familiar Velada',        dir:'Paseo del Prado 12',              ciudad:'Madrid',    pais:'España',  industria:'Family Office',          companero:'Sierra Álvaro',   principal:'Grupo Velada',    rel_cap:'IH' },
  { id:'CTA-015', nombre:'Flexwork Solutions Spain SL',        dir:'Calle de Méndez Álvaro 20',       ciudad:'Madrid',    pais:'España',  industria:'Flexible Office',        companero:'GOMEZ Ignacio',   principal:'Flexwork Int.',   rel_cap:'—' },
]

const COLS = [
  { id:'_dyn',     label:'',                          sys:true },
  { id:'id',       label:'ID',                        type:'text', getValue: r => r.id },
  { id:'nombre',   label:'Nombre',                    type:'text', getValue: r => r.nombre },
  { id:'dir',      label:'Dirección 1',               type:'text', getValue: r => r.dir },
  { id:'ciudad',   label:'Ciudad',                    type:'enum', getValue: r => r.ciudad },
  { id:'pais',     label:'País',                      type:'enum', getValue: r => r.pais },
  { id:'industria',label:'Industria',                 type:'enum', getValue: r => r.industria },
  { id:'companero',label:'Compañero más conectado',   type:'enum', getValue: r => r.companero },
  { id:'principal',label:'Cuenta principal',          type:'text', getValue: r => r.principal },
  { id:'rel_cap',  label:'Relación Cap. (IH)',        type:'enum', getValue: r => r.rel_cap },
]

function DynIcon() {
  return (
    <button
      title="Abrir en Microsoft Dynamics 365"
      onClick={e => { e.stopPropagation(); alert('En producción, este enlace abrirá el registro directamente en Microsoft Dynamics 365.') }}
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

export default function CuentasList() {
  const [query, setQuery] = useState('')

  const preFiltered = MOCK_CUENTAS
    .filter(r => !query || r.nombre.toLowerCase().includes(query.toLowerCase()) || r.industria.toLowerCase().includes(query.toLowerCase()) || r.ciudad.toLowerCase().includes(query.toLowerCase()))

  const { result: data, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <BannerInfo variant="dynamics" title="Solo lectura · Datos sincronizados desde Microsoft Dynamics 365" hint="Cualquier modificación debe realizarse directamente en Dynamics" />

      {/* KPI strip canónico */}
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">Total cuentas</div><div className="ks-val">{MOCK_CUENTAS.length}</div><div className="ks-sub">en Dynamics</div></div>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">Relación IH</div><div className="ks-val">{MOCK_CUENTAS.filter(c => c.rel_cap === 'IH').length}</div><div className="ks-sub">Capital Markets</div></div>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">Ciudades</div><div className="ks-val">{new Set(MOCK_CUENTAS.map(c => c.ciudad)).size}</div></div>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">Industrias</div><div className="ks-val">{new Set(MOCK_CUENTAS.map(c => c.industria)).size}</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar cuentas..." value={query} onChange={e => setQuery(e.target.value)} />
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
                  <td style={{ fontWeight:600, fontSize:11, color:'var(--text)' }}>{r.nombre}</td>
                  <td style={{ fontSize:11, color:'var(--text3)' }}>{r.dir}</td>
                  <td style={{ fontSize:11 }}>{r.ciudad}</td>
                  <td style={{ fontSize:11 }}>{r.pais}</td>
                  <td style={{ fontSize:11 }}>{r.industria}</td>
                  <td style={{ fontSize:11, color:'var(--accent)' }}>{r.companero}</td>
                  <td style={{ fontSize:11, color:'var(--text3)' }}>{r.principal}</td>
                  <td style={{ fontSize:11, textAlign:'center' }}>
                    {r.rel_cap === 'IH'
                      ? <span style={{ fontSize:9, background:'#faf5ec', color:'#5a4828', border:'1px solid #ece0c9', borderRadius:8, padding:'1px 7px', fontWeight:700 }}>IH</span>
                      : <span style={{ color:'var(--text4)' }}>—</span>
                    }
                  </td>
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
