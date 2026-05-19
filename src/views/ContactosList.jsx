import { useState } from 'react'
import { useTableFilter, ColHeader, FilterBadge } from '../components/TableFilter'
import BannerInfo from '../components/BannerInfo'
import { ExternalLink } from 'lucide-react'

const MOCK_CONTACTOS = [
  { id:'CON-001', titulo:'Mr.', nombre:'James',       apellido:'Richardson',  cuenta:'Oracle Spain SL',                cargo:'Director Real Estate',    anio_rel:2019, cat_alumni:'—',   of_alumni:'—',  div_alumni:'—',  linkedin:'linkedin.com/in/jrichardson', ciudad:'Madrid',    pais:'España',  no_email:false, no_llamada:false, ap_ant:'—',     email:'j.richardson@oracle.com',     dir_email:'Calle Basauri 17, Madrid' },
  { id:'CON-002', titulo:'Ms.', nombre:'Laura',       apellido:'Martín',      cuenta:'Oracle Spain SL',                cargo:'Real Estate Manager',     anio_rel:2021, cat_alumni:'—',   of_alumni:'—',  div_alumni:'—',  linkedin:'—',                           ciudad:'Madrid',    pais:'España',  no_email:false, no_llamada:false, ap_ant:'González', email:'l.martin@oracle.com',         dir_email:'Calle Basauri 17, Madrid' },
  { id:'CON-003', titulo:'Mr.', nombre:'Carlos',      apellido:'Vega',        cuenta:'Generali Real Estate',           cargo:'Head of Real Estate Spain',anio_rel:2017, cat_alumni:'Alumni IESE', of_alumni:'Madrid', div_alumni:'Capital Markets', linkedin:'linkedin.com/in/cvega', ciudad:'Madrid', pais:'España', no_email:false, no_llamada:false, ap_ant:'—', email:'c.vega@generali.com', dir_email:'Castellana 79, Madrid' },
  { id:'CON-004', titulo:'Ms.', nombre:'Ana',         apellido:'Díaz',        cuenta:'Generali Real Estate',           cargo:'Investment Analyst',      anio_rel:2022, cat_alumni:'—',   of_alumni:'—',  div_alumni:'—',  linkedin:'—',                           ciudad:'Madrid',    pais:'España',  no_email:false, no_llamada:true,  ap_ant:'—',     email:'a.diaz@generali.com',         dir_email:'Castellana 79, Madrid' },
  { id:'CON-005', titulo:'Mr.', nombre:'Pedro',       apellido:'Llorens',     cuenta:'Grupo Mediática España',         cargo:'Director Financiero',     anio_rel:2020, cat_alumni:'Alumni IE', of_alumni:'Madrid', div_alumni:'Transacción', linkedin:'linkedin.com/in/pllorens', ciudad:'Madrid', pais:'España', no_email:false, no_llamada:false, ap_ant:'—', email:'p.llorens@mediatica.es', dir_email:'Gobernador 23, Madrid' },
  { id:'CON-006', titulo:'Dr.', nombre:'María',       apellido:'Fernández',   cuenta:'ISDE',                           cargo:'Directora General',       anio_rel:2016, cat_alumni:'Alumni Harvard', of_alumni:'Boston', div_alumni:'—', linkedin:'linkedin.com/in/mfernandez', ciudad:'Madrid', pais:'España', no_email:false, no_llamada:false, ap_ant:'—', email:'m.fernandez@isde.es', dir_email:'Núñez de Balboa 35, Madrid' },
  { id:'CON-007', titulo:'Mr.', nombre:'Roberto',     apellido:'Peña',        cuenta:'Capital Industrial Partners',    cargo:'Partner',                 anio_rel:2015, cat_alumni:'Alumni LBS', of_alumni:'London', div_alumni:'Capital Markets', linkedin:'linkedin.com/in/rpena', ciudad:'Barcelona', pais:'España', no_email:false, no_llamada:false, ap_ant:'—', email:'r.pena@capitalindustrial.com', dir_email:'Paseo de Gracia 60, Barcelona' },
  { id:'CON-008', titulo:'Ms.', nombre:'Elena',       apellido:'Torres',      cuenta:'Merlín Properties SOCIMI',       cargo:'Asset Manager',           anio_rel:2018, cat_alumni:'—',   of_alumni:'—',  div_alumni:'—',  linkedin:'linkedin.com/in/etorres',     ciudad:'Madrid',    pais:'España',  no_email:false, no_llamada:false, ap_ant:'—',     email:'e.torres@merlinproperties.com', dir_email:'Castellana 257, Madrid' },
  { id:'CON-009', titulo:'Mr.', nombre:'Ignacio',     apellido:'Suárez',      cuenta:'FREO Investments Spain SL',      cargo:'Country Manager Spain',   anio_rel:2019, cat_alumni:'Alumni ESADE', of_alumni:'Barcelona', div_alumni:'Inversión', linkedin:'linkedin.com/in/isuarez', ciudad:'Madrid', pais:'España', no_email:false, no_llamada:false, ap_ant:'—', email:'i.suarez@freo.com', dir_email:'Serrano 90, Madrid' },
  { id:'CON-010', titulo:'Ms.', nombre:'Patricia',    apellido:'Castro',      cuenta:'Grupo Empresarial Altamira SL',  cargo:'Responsable Inmobiliario',anio_rel:2023, cat_alumni:'—',   of_alumni:'—',  div_alumni:'—',  linkedin:'—',                           ciudad:'Madrid',    pais:'España',  no_email:true,  no_llamada:false, ap_ant:'Ruiz', email:'p.castro@altamira.es',        dir_email:'Orense 4, Madrid' },
  { id:'CON-011', titulo:'Mr.', nombre:'François',    apellido:'Dubois',      cuenta:'Hospitality Group Iberia SL',    cargo:'VP Development',          anio_rel:2020, cat_alumni:'—',   of_alumni:'—',  div_alumni:'—',  linkedin:'linkedin.com/in/fdubois',     ciudad:'Madrid',    pais:'España',  no_email:false, no_llamada:false, ap_ant:'—',     email:'f.dubois@hgi.com',            dir_email:'Alcalá 502, Madrid' },
  { id:'CON-012', titulo:'Ms.', nombre:'Sofía',       apellido:'Moreno',      cuenta:'Inversiones Familiar Velada',    cargo:'Directora Patrimonio',    anio_rel:2014, cat_alumni:'Alumni IE', of_alumni:'Madrid', div_alumni:'Family Office', linkedin:'linkedin.com/in/smoreno', ciudad:'Madrid', pais:'España', no_email:false, no_llamada:false, ap_ant:'—', email:'s.moreno@velada.com', dir_email:'Prado 12, Madrid' },
]

const COLS = [
  { id:'_dyn',      label:'',                       sys:true },
  { id:'id',        label:'ID',                     type:'text',   getValue: r => r.id },
  { id:'titulo',    label:'Título',                 type:'enum',   getValue: r => r.titulo },
  { id:'nombre',    label:'Nombre',                 type:'text',   getValue: r => r.nombre },
  { id:'apellido',  label:'Primer apellido',        type:'text',   getValue: r => r.apellido },
  { id:'cuenta',    label:'Cuenta',                 type:'enum',   getValue: r => r.cuenta },
  { id:'cargo',     label:'Cargo',                  type:'text',   getValue: r => r.cargo },
  { id:'anio_rel',  label:'Año inicio relación',    type:'number', getValue: r => r.anio_rel },
  { id:'cat_alumni',label:'Cat. Alumni',            type:'enum',   getValue: r => r.cat_alumni },
  { id:'of_alumni', label:'Oficina Alumni',         type:'enum',   getValue: r => r.of_alumni },
  { id:'div_alumni',label:'División Alumni',        type:'enum',   getValue: r => r.div_alumni },
  { id:'linkedin',  label:'LinkedIn URL (IH)',      type:'text',   getValue: r => r.linkedin },
  { id:'ciudad',    label:'Pueblo / Ciudad',        type:'enum',   getValue: r => r.ciudad },
  { id:'pais',      label:'País',                   type:'enum',   getValue: r => r.pais },
  { id:'no_email',  label:'No email',               type:'enum',   getValue: r => r.no_email ? 'Sí' : 'No' },
  { id:'no_llamada',label:'No llamadas',            type:'enum',   getValue: r => r.no_llamada ? 'Sí' : 'No' },
  { id:'ap_ant',    label:'Ap. anterior',           type:'text',   getValue: r => r.ap_ant },
  { id:'email',     label:'Correo electrónico',     type:'text',   getValue: r => r.email },
  { id:'dir_email', label:'Dirección de correo',    type:'text',   getValue: r => r.dir_email },
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

export default function ContactosList() {
  const [query, setQuery] = useState('')

  const preFiltered = MOCK_CONTACTOS
    .filter(r => !query || `${r.nombre} ${r.apellido}`.toLowerCase().includes(query.toLowerCase()) || r.cuenta.toLowerCase().includes(query.toLowerCase()) || r.cargo.toLowerCase().includes(query.toLowerCase()))

  const { result: data, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount } = useTableFilter(preFiltered, COLS)

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <BannerInfo variant="dynamics" title="Solo lectura · Datos sincronizados desde Microsoft Dynamics 365" hint="Cualquier modificación debe realizarse directamente en Dynamics" />

      {/* KPI strip canónico */}
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">Total contactos</div><div className="ks-val">{MOCK_CONTACTOS.length}</div><div className="ks-sub">en Dynamics</div></div>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">Alumni Savills</div><div className="ks-val">{MOCK_CONTACTOS.filter(c => c.cat_alumni && c.cat_alumni !== '—').length}</div></div>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">No email</div><div className="ks-val" style={{color:'var(--red)'}}>{MOCK_CONTACTOS.filter(c => c.no_email).length}</div></div>
        <div className="ks" style={{ padding:'12px 16px' }}><div className="ks-lbl">No llamadas</div><div className="ks-val" style={{color:'var(--red)'}}>{MOCK_CONTACTOS.filter(c => c.no_llamada).length}</div></div>
      </div>

      <div className="list-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          <input className="search-inp" placeholder="Buscar contactos..." value={query} onChange={e => setQuery(e.target.value)} />
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
                  <td style={{ fontSize:11, color:'var(--text3)' }}>{r.titulo}</td>
                  <td style={{ fontWeight:600, fontSize:11 }}>{r.nombre}</td>
                  <td style={{ fontWeight:600, fontSize:11 }}>{r.apellido}</td>
                  <td style={{ fontSize:11, color:'var(--accent)' }}>{r.cuenta}</td>
                  <td style={{ fontSize:11 }}>{r.cargo}</td>
                  <td style={{ fontSize:11, textAlign:'center' }}><span className="mono">{r.anio_rel}</span></td>
                  <td style={{ fontSize:10, color:'var(--text3)' }}>{r.cat_alumni}</td>
                  <td style={{ fontSize:10, color:'var(--text3)' }}>{r.of_alumni}</td>
                  <td style={{ fontSize:10, color:'var(--text3)' }}>{r.div_alumni}</td>
                  <td style={{ fontSize:10, color:'var(--accent)' }}>
                    {r.linkedin !== '—' ? <a href={`https://${r.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color:'var(--accent)', display:'inline-flex', alignItems:'center', gap:4 }}>LinkedIn <ExternalLink size={11} strokeWidth={1.75} /></a> : '—'}
                  </td>
                  <td style={{ fontSize:11 }}>{r.ciudad}</td>
                  <td style={{ fontSize:11 }}>{r.pais}</td>
                  <td style={{ textAlign:'center' }}>{r.no_email ? <span style={{ fontSize:9, background:'#fef2f2', color:'var(--red)', border:'1px solid #fecaca', borderRadius:8, padding:'1px 6px', fontWeight:700 }}>✕</span> : <span style={{ color:'var(--text4)', fontSize:10 }}>—</span>}</td>
                  <td style={{ textAlign:'center' }}>{r.no_llamada ? <span style={{ fontSize:9, background:'#fef2f2', color:'var(--red)', border:'1px solid #fecaca', borderRadius:8, padding:'1px 6px', fontWeight:700 }}>✕</span> : <span style={{ color:'var(--text4)', fontSize:10 }}>—</span>}</td>
                  <td style={{ fontSize:10, color:'var(--text3)' }}>{r.ap_ant}</td>
                  <td style={{ fontSize:10, color:'var(--text2)' }}>{r.email}</td>
                  <td style={{ fontSize:10, color:'var(--text3)' }}>{r.dir_email}</td>
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
