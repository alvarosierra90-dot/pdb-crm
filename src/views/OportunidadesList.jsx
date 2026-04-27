import { useState } from 'react'
import { useNav } from '../context/NavigationContext'

export const MOCK_OPORTUNIDADES = [
  { id:'OPO-2501', fecha:'15/03/2026', marco:'Q2 2026',  etapa:'Propuesta enviada', razon:'Expansión',         sup:'13.486', lifetime:'185.000', responsable:'Sierra Álvaro',  div_user:'Leasing Of. MAD', nombre:'Albatros D — Oracle Relocation 2026', cuenta:'Oracle Spain SL',             contacto:'James Richardson',  remitido:'Savills Estefanía', origen:'Partner/Consultor', notas:'Última planta con terraza. Muy avanzado.', division:'Oficinas', pitch:'Sí', pais:'España', creado:'Sierra Álvaro', probabilidad:65, descripcion:'Oracle busca reubicar su HQ Iberia. 13.486 m² en P1-P4 del Edif. D Albatros. Demanda en curso, propuesta enviada el 02/03/2026.', vinculaciones:{ activos:['ALC-OF-00231'], ofertas:['OFR-0018'], demandas:['DEM-0078'], mandatos:[], negociaciones:['NEG-0041'], propuestas:[] } },
  { id:'OPO-2502', fecha:'29/03/2026', marco:'Q2 2026',  etapa:'Acuerdo alcanzado', razon:'Reubicación',       sup:'1.500',  lifetime:'85.000',  responsable:'Sierra Álvaro',  div_user:'Leasing Of. MAD', nombre:'Avalon P5 — Generali 2026',          cuenta:'Generali Real Estate',        contacto:'Carlos Vega',       remitido:'—',                 origen:'Contacto directo',  notas:'Acuerdo verbal alcanzado. Pendiente firma.', division:'Oficinas', pitch:'Sí', pais:'España', creado:'Sierra Álvaro', probabilidad:90, descripcion:'Generali Real Estate selecciona P.E. Avalon P5 como nueva sede en Madrid. 1.500 m² acondicionados.', vinculaciones:{ activos:['MAD-OF-00189'], ofertas:['OFR-0017'], demandas:[], mandatos:[], negociaciones:['NEG-0039'], propuestas:[] } },
  { id:'OPO-2503', fecha:'12/09/2025', marco:'Q4 2026',  etapa:'Calificación',      razon:'Nueva sede',        sup:'16.000', lifetime:'520.000', responsable:'GOMEZ Ignacio',  div_user:'Leasing Of. MAD', nombre:'Torre Norte — Grupo Mediática 2027',  cuenta:'Grupo Mediática España',      contacto:'Pedro Llorens',     remitido:'—',                 origen:'Desarrollo negocio',notas:'Búsqueda de nueva sede para 2027.',          division:'Oficinas', pitch:'No', pais:'España', creado:'GOMEZ Ignacio', probabilidad:35, descripcion:'Grupo Mediática evalúa relocalización HQ. Búsqueda activa de 16.000 m² en Madrid CBD.', vinculaciones:{ activos:[], ofertas:[], demandas:['DEM-0091'], mandatos:[], negociaciones:[], propuestas:['PRY-2503'] } },
  { id:'OPO-2504', fecha:'05/01/2026', marco:'Q3 2026',  etapa:'Identificación',    razon:'Crecimiento',       sup:'4.200',  lifetime:'95.000',  responsable:'Sierra Álvaro',  div_user:'Capital Markets', nombre:'Inversión Core+ Oficinas Madrid',     cuenta:'Capital Industrial Partners', contacto:'Roberto Peña',      remitido:'—',                 origen:'Contacto directo',  notas:'Inversión patrimonial. Ticket 35–50 M€.',   division:'Capital Markets', pitch:'No', pais:'España', creado:'Sierra Álvaro', probabilidad:25, descripcion:'CIP busca activos Core+ en Madrid CBD. Yield objetivo 5.5-6.5%.', vinculaciones:{ activos:[], ofertas:[], demandas:[], mandatos:[], negociaciones:[], propuestas:[] } },
  { id:'OPO-2505', fecha:'20/02/2026', marco:'Q2 2026',  etapa:'Negociación',       razon:'SLB',               sup:'8.000',  lifetime:'240.000', responsable:'Sierra Álvaro',  div_user:'Capital Markets', nombre:'Sale & Leaseback Logístico — FREO',   cuenta:'FREO Investments Spain SL',   contacto:'Ignacio Suárez',    remitido:'—',                 origen:'Contacto directo',  notas:'SLB plataforma logística. Due diligence.',  division:'Capital Markets', pitch:'Sí', pais:'España', creado:'Sierra Álvaro', probabilidad:60, descripcion:'SLB plataforma logística A-2. Inversor FREO interesado en estructura SLB 15+5 años.', vinculaciones:{ activos:['MAD-LG-00401'], ofertas:[], demandas:[], mandatos:[], negociaciones:[], propuestas:['PRY-2509'] } },
  { id:'OPO-2506', fecha:'10/11/2025', marco:'Q1 2027',  etapa:'Calificación',      razon:'Expansión',         sup:'2.800',  lifetime:'62.000',  responsable:'GOMEZ Ignacio',  div_user:'Leasing Of. MAD', nombre:'Oficinas Flexwork — Méndez Álvaro',   cuenta:'Flexwork Solutions Spain SL', contacto:'—',                 remitido:'Idealista',         origen:'Web/Inbound',       notas:'Búsqueda coworking/flex 200–300 puestos.', division:'Oficinas', pitch:'No', pais:'España', creado:'GOMEZ Ignacio', probabilidad:30, descripcion:'Flexwork busca espacio coworking premium en eje Méndez Álvaro. 200-300 puestos.', vinculaciones:{ activos:[], ofertas:[], demandas:[], mandatos:[], negociaciones:[], propuestas:[] } },
]

const COLS = [
  { key:'fecha',       label:'Fecha' },
  { key:'marco',       label:'Marco temporal' },
  { key:'etapa',       label:'Etapa' },
  { key:'razon',       label:'Razón' },
  { key:'sup',         label:'Superficie (m²)' },
  { key:'lifetime',    label:'Lifetime (€)' },
  { key:'responsable', label:'Responsable' },
  { key:'div_user',    label:'División (usuario)' },
  { key:'nombre',      label:'Nombre oportunidad' },
  { key:'cuenta',      label:'Cuenta' },
  { key:'contacto',    label:'Contacto' },
  { key:'remitido',    label:'Remitido por' },
  { key:'origen',      label:'Origen negocio' },
  { key:'notas',       label:'Notas' },
  { key:'division',    label:'División' },
  { key:'pitch',       label:'Pitch' },
  { key:'pais',        label:'País' },
  { key:'creado',      label:'Creado por' },
]

const ETAPA_TAG = {
  'Identificación':      { bg:'#f0f9ff', color:'#0369a1', bd:'#bae6fd' },
  'Calificación':        { bg:'#fefce8', color:'#92400e', bd:'#fde68a' },
  'Propuesta enviada':   { bg:'#eff6ff', color:'#1d4ed8', bd:'#bfdbfe' },
  'Negociación':         { bg:'#fdf4ff', color:'#7e22ce', bd:'#e9d5ff' },
  'Acuerdo alcanzado':   { bg:'#f0fdf4', color:'#15803d', bd:'#bbf7d0' },
}

function DynIcon() {
  return (
    <button
      title="Abrir en Microsoft Dynamics 365"
      onClick={e => { e.stopPropagation(); alert('En producción, este enlace abrirá la oportunidad directamente en Microsoft Dynamics 365 para su edición oficial.') }}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', width:22, height:22, borderRadius:4, background:'#0078d4', border:'none', cursor:'pointer', flexShrink:0, padding:0 }}
    >
      <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
        <path d="M3 2h5.5L13 6.5v7.5H3V2z" fill="#fff" opacity=".9"/>
        <path d="M8.5 2v4.5H13" stroke="#0078d4" strokeWidth="1.2"/>
        <path d="M5.5 8.5h5M5.5 11h3.5" stroke="#0078d4" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

function SortIcon({ active, dir }) {
  if (!active) return <span style={{ color:'var(--border)', fontSize:10, marginLeft:3 }}>↕</span>
  return <span style={{ color:'var(--accent)', fontSize:10, marginLeft:3 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

export default function OportunidadesList() {
  const { navigate } = useNav()
  const [sort, setSort] = useState({ col:'fecha', dir:'desc' })
  const [query, setQuery] = useState('')

  const toggleSort = (col) => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))

  const data = [...MOCK_OPORTUNIDADES]
    .filter(r => !query || r.nombre.toLowerCase().includes(query.toLowerCase()) || r.cuenta.toLowerCase().includes(query.toLowerCase()) || r.etapa.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      const va = String(a[sort.col] ?? '').toLowerCase()
      const vb = String(b[sort.col] ?? '').toLowerCase()
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      {/* Banner Dynamics */}
      <div style={{ padding:'7px 16px', background:'#eff6ff', borderBottom:'1px solid #bfdbfe', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:18, height:18, borderRadius:3, background:'#0078d4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ color:'#fff', fontWeight:800, fontSize:10 }}>D</span>
        </div>
        <span style={{ fontSize:11, color:'#1e40af', fontWeight:600 }}>Solo lectura · WIP oficial en Microsoft Dynamics 365</span>
        <span style={{ fontSize:10, color:'#3b82f6', marginLeft:'auto' }}>Las oportunidades se crean y editan exclusivamente en Dynamics</span>
      </div>

      {/* Toolbar */}
      <div style={{ padding:'8px 16px', background:'var(--surface)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700 }}>Oportunidades</div>
        <span style={{ fontSize:11, color:'var(--text4)', marginLeft:4 }}>{data.length} registros</span>
        <div className="search-wrap" style={{ marginLeft:'auto' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar oportunidades..." value={query} onChange={e => setQuery(e.target.value)} />
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
              : data.map(r => {
                  const tag = ETAPA_TAG[r.etapa] || { bg:'var(--gray-lt)', color:'var(--text3)', bd:'var(--border)' }
                  return (
                    <tr key={r.id} style={{ cursor:'pointer' }} onClick={() => navigate('ficha-oportunidad', { id: r.id })}>
                      <td style={{ padding:'6px 8px' }}><DynIcon /></td>
                      <td style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', whiteSpace:'nowrap' }}>{r.fecha}</td>
                      <td style={{ fontSize:11 }}>{r.marco}</td>
                      <td>
                        <span style={{ fontSize:9, background:tag.bg, color:tag.color, border:`1px solid ${tag.bd}`, borderRadius:8, padding:'2px 8px', fontWeight:700, whiteSpace:'nowrap' }}>
                          {r.etapa}
                        </span>
                      </td>
                      <td style={{ fontSize:11 }}>{r.razon}</td>
                      <td style={{ fontSize:11, fontFamily:'var(--mono)', textAlign:'right' }}>{Number(r.sup).toLocaleString('es-ES')} m²</td>
                      <td style={{ fontSize:11, fontFamily:'var(--mono)', textAlign:'right', color:'var(--green)', fontWeight:600 }}>{Number(r.lifetime).toLocaleString('es-ES')} €</td>
                      <td style={{ fontSize:11, color:'var(--accent)' }}>{r.responsable}</td>
                      <td style={{ fontSize:11 }}>{r.div_user}</td>
                      <td style={{ fontSize:11, fontWeight:600, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.nombre}</td>
                      <td style={{ fontSize:11, color:'var(--accent)' }}>{r.cuenta}</td>
                      <td style={{ fontSize:11 }}>{r.contacto}</td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.remitido}</td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.origen}</td>
                      <td style={{ fontSize:10, color:'var(--text3)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.notas}</td>
                      <td><span className={`tag ${r.division === 'Capital Markets' ? 'tag-amber' : 'tag-blue'}`} style={{ fontSize:9 }}>{r.division}</span></td>
                      <td style={{ fontSize:11, textAlign:'center' }}>{r.pitch === 'Sí' ? <span style={{ fontSize:9, background:'#f0fdf4', color:'var(--green)', border:'1px solid #bbf7d0', borderRadius:8, padding:'1px 6px', fontWeight:700 }}>Sí</span> : <span style={{ color:'var(--text4)', fontSize:10 }}>—</span>}</td>
                      <td style={{ fontSize:11 }}>{r.pais}</td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.creado}</td>
                    </tr>
                  )
                })
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
