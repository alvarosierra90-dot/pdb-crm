import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import BannerInfo from '../components/BannerInfo'

export const MOCK_OPORTUNIDADES = [
  { id:'OPO-2501', fecha:'15/03/2026', marco:'Q2 2026',  etapa:'Propuesta enviada', razon:'Expansión',         sup:'13.486', lifetime:'185.000', responsable:'Sierra Álvaro',  div_user:'Leasing Of. MAD', nombre:'Albatros D — Oracle Relocation 2026', cuenta:'Oracle Spain SL',             contacto:'James Richardson',  remitido:'Savills Estefanía', origen:'Partner/Consultor', notas:'Última planta con terraza. Muy avanzado.', division:'Oficinas', pitch:'Sí', pais:'España', creado:'Sierra Álvaro', probabilidad:65, descripcion:'Oracle busca reubicar su HQ Iberia. 13.486 m² en P1-P4 del Edif. D Albatros. Demanda en curso, propuesta enviada el 02/03/2026.', vinculaciones:{ activos:['ALC-OF-00231'], ofertas:['OFR-0018'], demandas:['DEM-0078'], mandatos:[], negociaciones:['NEG-0041'], propuestas:[] } },
  { id:'OPO-2502', fecha:'29/03/2026', marco:'Q2 2026',  etapa:'Acuerdo alcanzado', razon:'Reubicación',       sup:'1.500',  lifetime:'85.000',  responsable:'Sierra Álvaro',  div_user:'Leasing Of. MAD', nombre:'Avalon P5 — Generali 2026',          cuenta:'Generali Real Estate',        contacto:'Carlos Vega',       remitido:'—',                 origen:'Contacto directo',  notas:'Acuerdo verbal alcanzado. Pendiente firma.', division:'Oficinas', pitch:'Sí', pais:'España', creado:'Sierra Álvaro', probabilidad:90, descripcion:'Generali Real Estate selecciona P.E. Avalon P5 como nueva sede en Madrid. 1.500 m² acondicionados.', vinculaciones:{ activos:['MAD-OF-00189'], ofertas:['OFR-0017'], demandas:[], mandatos:[], negociaciones:['NEG-0039'], propuestas:[] } },
  { id:'OPO-2503', fecha:'12/09/2025', marco:'Q4 2026',  etapa:'Calificación',      razon:'Nueva sede',        sup:'16.000', lifetime:'520.000', responsable:'GOMEZ Ignacio',  div_user:'Leasing Of. MAD', nombre:'Torre Norte — Grupo Mediática 2027',  cuenta:'Grupo Mediática España',      contacto:'Pedro Llorens',     remitido:'—',                 origen:'Desarrollo negocio',notas:'Búsqueda de nueva sede para 2027.',          division:'Oficinas', pitch:'No', pais:'España', creado:'GOMEZ Ignacio', probabilidad:35, descripcion:'Grupo Mediática evalúa relocalización HQ. Búsqueda activa de 16.000 m² en Madrid CBD.', vinculaciones:{ activos:[], ofertas:[], demandas:['DEM-0091'], mandatos:[], negociaciones:[], propuestas:['PRY-2503'] } },
  { id:'OPO-2504', fecha:'05/01/2026', marco:'Q3 2026',  etapa:'Identificación',    razon:'Crecimiento',       sup:'4.200',  lifetime:'95.000',  responsable:'Sierra Álvaro',  div_user:'Capital Markets', nombre:'Inversión Core+ Oficinas Madrid',     cuenta:'Capital Industrial Partners', contacto:'Roberto Peña',      remitido:'—',                 origen:'Contacto directo',  notas:'Inversión patrimonial. Ticket 35–50 M€.',   division:'Capital Markets', pitch:'No', pais:'España', creado:'Sierra Álvaro', probabilidad:25, descripcion:'CIP busca activos Core+ en Madrid CBD. Yield objetivo 5.5-6.5%.', vinculaciones:{ activos:[], ofertas:[], demandas:[], mandatos:[], negociaciones:[], propuestas:[] } },
  { id:'OPO-2505', fecha:'20/02/2026', marco:'Q2 2026',  etapa:'Negociación',       razon:'SLB',               sup:'8.000',  lifetime:'240.000', responsable:'Sierra Álvaro',  div_user:'Capital Markets', nombre:'Sale & Leaseback Logístico — FREO',   cuenta:'FREO Investments Spain SL',   contacto:'Ignacio Suárez',    remitido:'—',                 origen:'Contacto directo',  notas:'SLB plataforma logística. Due diligence.',  division:'Capital Markets', pitch:'Sí', pais:'España', creado:'Sierra Álvaro', probabilidad:60, descripcion:'SLB plataforma logística A-2. Inversor FREO interesado en estructura SLB 15+5 años.', vinculaciones:{ activos:['MAD-LG-00401'], ofertas:[], demandas:[], mandatos:[], negociaciones:[], propuestas:['PRY-2509'] } },
  { id:'OPO-2506', fecha:'10/11/2025', marco:'Q1 2027',  etapa:'Calificación',      razon:'Expansión',         sup:'2.800',  lifetime:'62.000',  responsable:'GOMEZ Ignacio',  div_user:'Leasing Of. MAD', nombre:'Oficinas Flexwork — Méndez Álvaro',   cuenta:'Flexwork Solutions Spain SL', contacto:'—',                 remitido:'Idealista',         origen:'Web/Inbound',       notas:'Búsqueda coworking/flex 200–300 puestos.', division:'Oficinas', pitch:'No', pais:'España', creado:'GOMEZ Ignacio', probabilidad:30, descripcion:'Flexwork busca espacio coworking premium en eje Méndez Álvaro. 200-300 puestos.', vinculaciones:{ activos:[], ofertas:[], demandas:[], mandatos:[], negociaciones:[], propuestas:[] } },
]

const toNum = v => Number(String(v).replace(/\./g,'').replace(/,/g,'.')) || 0

const COLS = [
  { id:'_dyn',        label:'',                     sys:true },
  { id:'id',          label:'ID',                   type:'text',   getValue: r => r.id },
  { id:'fecha',       label:'Fecha',                type:'text',   getValue: r => r.fecha },
  { id:'marco',       label:'Marco temporal',       type:'enum',   getValue: r => r.marco },
  { id:'etapa',       label:'Etapa',                type:'enum',   getValue: r => r.etapa },
  { id:'razon',       label:'Razón',                type:'enum',   getValue: r => r.razon },
  { id:'sup',         label:'Superficie (m²)',      type:'number', getValue: r => toNum(r.sup) },
  { id:'lifetime',    label:'Lifetime (€)',         type:'number', getValue: r => toNum(r.lifetime) },
  { id:'responsable', label:'Responsable',          type:'enum',   getValue: r => r.responsable },
  { id:'div_user',    label:'División (usuario)',   type:'enum',   getValue: r => r.div_user },
  { id:'nombre',      label:'Nombre oportunidad',   type:'text',   getValue: r => r.nombre },
  { id:'cuenta',      label:'Cuenta',               type:'enum',   getValue: r => r.cuenta },
  { id:'contacto',    label:'Contacto',             type:'text',   getValue: r => r.contacto },
  { id:'remitido',    label:'Remitido por',         type:'text',   getValue: r => r.remitido },
  { id:'origen',      label:'Origen negocio',       type:'enum',   getValue: r => r.origen },
  { id:'notas',       label:'Notas',                type:'text',   getValue: r => r.notas },
  { id:'division',    label:'División',             type:'enum',   getValue: r => r.division },
  { id:'pitch',       label:'Pitch',                type:'enum',   getValue: r => r.pitch },
  { id:'pais',        label:'País',                 type:'enum',   getValue: r => r.pais },
  { id:'creado',      label:'Creado por',           type:'enum',   getValue: r => r.creado },
]

export const ETAPA_TAG_CLASS = {
  'Identificación':      'tag-blue',
  'Calificación':        'tag-amber',
  'Propuesta enviada':   'tag-blue',
  'Negociación':         'tag-purple',
  'Acuerdo alcanzado':   'tag-green',
}

function DynIcon() {
  return (
    <button
      title="Abrir en Microsoft Dynamics 365"
      onClick={e => { e.stopPropagation(); alert('En producción, este enlace abrirá la oportunidad directamente en Microsoft Dynamics 365 para su edición oficial.') }}
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

export default function OportunidadesList() {
  const { navigate } = useNav()
  const [query, setQuery] = useState('')

  const preFiltered = MOCK_OPORTUNIDADES
    .filter(r => !query || r.nombre.toLowerCase().includes(query.toLowerCase()) || r.cuenta.toLowerCase().includes(query.toLowerCase()) || r.etapa.toLowerCase().includes(query.toLowerCase()))

  const { result: data, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  const total       = MOCK_OPORTUNIDADES.length
  const identif     = MOCK_OPORTUNIDADES.filter(o => o.etapa === 'Identificación').length
  const negociacion = MOCK_OPORTUNIDADES.filter(o => o.etapa === 'Negociación').length
  const acuerdo     = MOCK_OPORTUNIDADES.filter(o => o.etapa === 'Acuerdo alcanzado').length
  const lifetime    = MOCK_OPORTUNIDADES.reduce((s, o) => s + Number(o.lifetime || 0), 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <BannerInfo variant="dynamics" title="Solo lectura · WIP oficial en Microsoft Dynamics 365" hint="Las oportunidades se crean y editan exclusivamente en Dynamics" />

      <div className="kpi-strip" style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:24, flexShrink:0, background:'var(--surface)' }}>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>{total}</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Total</div>
        </div>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'#5a4828' }}>{identif}</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Identificación</div>
        </div>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'#6b5b8e' }}>{negociacion}</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Negociación</div>
        </div>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'#15803d' }}>{acuerdo}</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Acuerdo alcanzado</div>
        </div>
        <div className="ks">
          <div style={{ fontSize:22, fontWeight:800, color:'var(--green)', fontFamily:'var(--mono)' }}>{lifetime.toLocaleString('es-ES')} €</div>
          <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>Lifetime total</div>
        </div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar oportunidades..." value={query} onChange={e => setQuery(e.target.value)} />
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
              : data.map(r => {
                  const tagClass = ETAPA_TAG_CLASS[r.etapa] || 'tag-gray'
                  return (
                    <tr key={r.id} style={{ cursor:'pointer' }} onClick={() => navigate('ficha-oportunidad', { id: r.id })}>
                      <td style={{ padding:'6px 8px' }}><DynIcon /></td>
                      <td><span className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{r.id}</span></td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}><span className="mono">{r.fecha}</span></td>
                      <td style={{ fontSize:11 }}>{r.marco}</td>
                      <td><span className={`tag ${tagClass}`}>{r.etapa}</span></td>
                      <td style={{ fontSize:11 }}>{r.razon}</td>
                      <td style={{ fontSize:11, textAlign:'right' }}><span className="mono">{Number(r.sup).toLocaleString('es-ES')} m²</span></td>
                      <td style={{ fontSize:11, textAlign:'right', color:'var(--green)', fontWeight:600 }}><span className="mono">{Number(r.lifetime).toLocaleString('es-ES')} €</span></td>
                      <td style={{ fontSize:11, color:'var(--accent)' }}>{r.responsable}</td>
                      <td style={{ fontSize:11 }}>{r.div_user}</td>
                      <td style={{ fontSize:11, fontWeight:600, minWidth:240, maxWidth:360, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.nombre}</td>
                      <td style={{ fontSize:11, color:'var(--accent)' }}>{r.cuenta}</td>
                      <td style={{ fontSize:11 }}>{r.contacto}</td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.remitido}</td>
                      <td style={{ fontSize:11, color:'var(--text3)' }}>{r.origen}</td>
                      <td style={{ fontSize:10, color:'var(--text3)', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.notas}</td>
                      <td><span className={`tag ${r.division === 'Capital Markets' ? 'tag-amber' : 'tag-blue'}`}>{r.division}</span></td>
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
