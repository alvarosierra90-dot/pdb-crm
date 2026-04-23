import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'

const LINEAS = ['Oficinas','Industrial / Logística','Retail','Residencial','Living','Hoteles','Suelos']
const TIPOS_TAG = { 'Break':'tag-amber', 'Fin contrato':'tag-red' }

const MOCK_VENCIMIENTOS = [
  { id:'VEN-001', activo:'P.E Avalon — Edif. A P5', arrendatario:'Celonis', sup:1202, linea:'Oficinas', fecha:'2025-10-31', tipo:'Break', origen:'interna', oportunidad:'OPO-2501', instruccion:null, _mock:true },
  { id:'VEN-002', activo:'P.E Avalon — Edif. A P1', arrendatario:'Desconocido', sup:1500, linea:'Oficinas', fecha:'2026-01-31', tipo:'Fin contrato', origen:'externa', oportunidad:null, instruccion:null, _mock:true },
  { id:'VEN-003', activo:'P.E Avalon — Edif. C P4', arrendatario:'Repsol', sup:1967, linea:'Oficinas', fecha:'2027-06-30', tipo:'Fin contrato', origen:'interna', oportunidad:null, instruccion:'TRN-2601', _mock:true },
  { id:'VEN-004', activo:'Albatros — Edif. D', arrendatario:'Oracle Spain SL', sup:13486, linea:'Oficinas', fecha:'2028-03-31', tipo:'Break', origen:'interna', oportunidad:'OPO-2502', instruccion:null, _mock:true },
  { id:'VEN-005', activo:'Park Logístico Getafe', arrendatario:'DHL Supply Chain', sup:8400, linea:'Industrial / Logística', fecha:'2026-06-30', tipo:'Fin contrato', origen:'interna', oportunidad:null, instruccion:'TRN-2502', _mock:true },
  { id:'VEN-006', activo:'Torre Glòries P8', arrendatario:'Telefónica', sup:2200, linea:'Oficinas', fecha:'2026-09-30', tipo:'Break', origen:'externa', oportunidad:null, instruccion:null, _mock:true },
  { id:'VEN-007', activo:'C.C. La Maquinista L-12', arrendatario:'Inditex', sup:1800, linea:'Retail', fecha:'2027-01-31', tipo:'Fin contrato', origen:'interna', oportunidad:null, instruccion:'TRN-2503', _mock:true },
  { id:'VEN-008', activo:'Residencial Valdebebas U3', arrendatario:'García Pérez, M.', sup:110, linea:'Residencial', fecha:'2026-12-31', tipo:'Fin contrato', origen:'externa', oportunidad:null, instruccion:null, _mock:true },
]

function sectorToLinea(sector) {
  if (!sector) return 'Oficinas'
  const s = sector.toLowerCase()
  if (s.includes('logíst') || s.includes('logist') || s.includes('industrial')) return 'Industrial / Logística'
  if (s.includes('retail') || s.includes('comerc')) return 'Retail'
  if (s.includes('resid')) return 'Residencial'
  if (s.includes('hotel') || s.includes('hostel')) return 'Hoteles'
  if (s.includes('living') || s.includes('prs') || s.includes('btr')) return 'Living'
  return 'Oficinas'
}

function mapDbToVencimientos(r) {
  const entries = []
  const activo = r.activo_ref || '—'
  const arrendatario = r.nombre || '—'
  const sup = Number(r.m2) || 0
  const linea = sectorToLinea(null) // default Oficinas; sector not stored in arrendatarios
  const mesesRecordatorio = 3

  if (r.break_option) {
    entries.push({
      id: `DB-${r.ref}-BRK`,
      activo,
      arrendatario,
      sup,
      linea,
      fecha: r.break_option,
      tipo: 'Break',
      origen: 'interna',
      oportunidad: null,
      instruccion: null,
      _real: true,
      _tenantName: r.nombre,
      _mesesRecordatorio: mesesRecordatorio,
      _recordatorioFecha: calcRecordatorioISO(r.break_option, mesesRecordatorio),
    })
  }
  if (r.fecha_fin) {
    entries.push({
      id: `DB-${r.ref}-FIN`,
      activo,
      arrendatario,
      sup,
      linea,
      fecha: r.fecha_fin,
      tipo: 'Fin contrato',
      origen: 'interna',
      oportunidad: null,
      instruccion: null,
      _real: true,
      _tenantName: r.nombre,
    })
  }
  return entries
}

function calcRecordatorioISO(isoDate, meses) {
  if (!isoDate || !meses) return null
  const d = new Date(isoDate)
  d.setMonth(d.getMonth() - meses)
  return d.toISOString().slice(0, 10)
}

function fmtFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function diasRestantes(iso) {
  const hoy = new Date()
  const f = new Date(iso)
  return Math.round((f - hoy) / 86400000)
}

function AlertaBadge({ dias }) {
  if (dias < 0)   return <span style={{fontSize:8,background:'#fee2e2',color:'#dc2626',border:'1px solid #fca5a5',borderRadius:8,padding:'1px 6px',fontWeight:700}}>VENCIDO</span>
  if (dias < 90)  return <span style={{fontSize:8,background:'#fef9c3',color:'#ca8a04',border:'1px solid #fde047',borderRadius:8,padding:'1px 6px',fontWeight:700}}>🔴 {dias}d</span>
  if (dias < 180) return <span style={{fontSize:8,background:'#fff7ed',color:'#c2410c',border:'1px solid #fed7aa',borderRadius:8,padding:'1px 6px',fontWeight:700}}>🟡 {dias}d</span>
  return <span style={{fontSize:8,background:'#f0fdf4',color:'#15803d',border:'1px solid #bbf7d0',borderRadius:8,padding:'1px 6px',fontWeight:700}}>🟢 {dias}d</span>
}

export default function VencimientosView() {
  const { navigate } = useNav()
  const [fAnio,   setFAnio]   = useState('')
  const [fPeriod, setFPeriod] = useState('')
  const [fLinea,  setFLinea]  = useState('')
  const [fTipo,   setFTipo]   = useState('')
  const [allVencimientos, setAllVencimientos] = useState(MOCK_VENCIMIENTOS)
  const [loadingDB, setLoadingDB] = useState(true)

  useEffect(() => {
    supabase.from('arrendatarios')
      .select('ref,nombre,activo_ref,break_option,fecha_fin,m2')
      .not('fecha_fin', 'is', null)
      .order('fecha_fin')
      .then(({ data }) => {
        if (data?.length > 0) {
          const dbEntries = data.flatMap(mapDbToVencimientos)
          setAllVencimientos(dbEntries)
        }
        setLoadingDB(false)
      })
  }, [])

  const filtered = allVencimientos.filter(v => {
    const [y, m] = v.fecha.split('-')
    const q = m <= '03' ? 'Q1' : m <= '06' ? 'Q2' : m <= '09' ? 'Q3' : 'Q4'
    if (fAnio   && y !== fAnio)         return false
    if (fPeriod && q !== fPeriod)       return false
    if (fLinea  && v.linea !== fLinea)  return false
    if (fTipo   && v.tipo !== fTipo)    return false
    return true
  }).sort((a, b) => a.fecha.localeCompare(b.fecha))

  const alertas  = filtered.filter(v => diasRestantes(v.fecha) < 90).length
  const proximos = filtered.filter(v => { const d = diasRestantes(v.fecha); return d >= 0 && d < 365 }).length

  // Check if recordatorio alert is active for Break entries
  function isRecordatorioActivo(v) {
    if (v.tipo !== 'Break' || !v._recordatorioFecha) return false
    return diasRestantes(v._recordatorioFecha) <= 0
  }

  const handleClick = (v) => {
    if (v._real && v._tenantName) {
      navigate('ficha-arrendatario', { tenantName: v._tenantName })
    } else {
      navigate('ficha-arrendatario')
    }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>

      {/* Header */}
      <div style={{padding:'10px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700}}>⏰ Vencimientos de contratos</div>
          <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>
            Fin de contrato y break options extraídos de Arrendatarios
            {loadingDB && <span style={{marginLeft:8,color:'var(--text4)'}}>· Cargando datos reales...</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:'var(--r)',padding:'4px 12px',textAlign:'center'}}>
            <div style={{fontSize:9,color:'#dc2626',fontWeight:700,textTransform:'uppercase'}}>Alertas &lt;90d</div>
            <div style={{fontSize:18,fontWeight:800,color:'#dc2626',fontFamily:'var(--mono)'}}>{alertas}</div>
          </div>
          <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'var(--r)',padding:'4px 12px',textAlign:'center'}}>
            <div style={{fontSize:9,color:'var(--accent)',fontWeight:700,textTransform:'uppercase'}}>Próximos 12m</div>
            <div style={{fontSize:18,fontWeight:800,color:'var(--accent)',fontFamily:'var(--mono)'}}>{proximos}</div>
          </div>
          <div style={{background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'4px 12px',textAlign:'center'}}>
            <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase'}}>Total</div>
            <div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'var(--mono)'}}>{filtered.length}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{padding:'8px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',gap:10,alignItems:'center',flexShrink:0}}>
        {[
          {lbl:'Año',     val:fAnio,   set:setFAnio,   opts:['','2025','2026','2027','2028','2029','2030']},
          {lbl:'Período', val:fPeriod, set:setFPeriod, opts:['','Q1','Q2','Q3','Q4']},
          {lbl:'Línea',   val:fLinea,  set:setFLinea,  opts:['',...LINEAS]},
          {lbl:'Tipo',    val:fTipo,   set:setFTipo,   opts:['','Break','Fin contrato']},
        ].map(({lbl,val,set,opts})=>(
          <div key={lbl} style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>{lbl}</span>
            <select className="fsel" style={{fontSize:10}} value={val} onChange={e=>set(e.target.value)}>
              {opts.map(o=><option key={o} value={o}>{o||'Todos'}</option>)}
            </select>
          </div>
        ))}
        {(fAnio||fPeriod||fLinea||fTipo) && (
          <button onClick={()=>{setFAnio('');setFPeriod('');setFLinea('');setFTipo('')}}
            style={{fontSize:10,padding:'2px 8px',borderRadius:4,border:'1px solid var(--border)',background:'none',cursor:'pointer',color:'var(--accent)',fontFamily:'inherit',fontWeight:600}}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="tbl-wrap">
        <table className="main-tbl">
          <thead>
            <tr>
              {['','Activo','Arrendatario','Superficie','Línea','Fecha vencim.','Tipo','Recordatorio','Alerta'].map(h=>(
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'var(--text4)',fontSize:12}}>No hay vencimientos para los filtros aplicados</td></tr>
              : filtered.map(v => {
                  const dias = diasRestantes(v.fecha)
                  const recActivo = isRecordatorioActivo(v)
                  return (
                    <tr key={v.id} onClick={()=>handleClick(v)} style={{cursor:'pointer'}}>
                      <td style={{width:8,padding:'0 4px'}}>
                        {v._real && <span title="Dato real" style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'var(--green)'}}/>}
                      </td>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{v.activo}</td>
                      <td style={{fontSize:11}}>{v.arrendatario}</td>
                      <td className="mono" style={{fontSize:11}}>{Number(v.sup||0).toLocaleString('es-ES')} m²</td>
                      <td><span className="tag tag-blue" style={{fontSize:9}}>{v.linea}</span></td>
                      <td style={{fontSize:11,fontFamily:'var(--mono)',fontWeight:600}}>{fmtFecha(v.fecha)}</td>
                      <td><span className={`tag ${TIPOS_TAG[v.tipo]||'tag-gray'}`} style={{fontSize:9}}>{v.tipo}</span></td>
                      <td style={{fontSize:10,color:recActivo?'var(--red)':'var(--text3)'}}>
                        {v._recordatorioFecha
                          ? <>{fmtFecha(v._recordatorioFecha)}{recActivo && <span style={{marginLeft:4,fontSize:8,fontWeight:700,color:'var(--red)'}}>⚠ ACTIVO</span>}</>
                          : '—'}
                      </td>
                      <td><AlertaBadge dias={dias}/></td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
