import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import BajaArrendatarioModal from '../components/BajaArrendatarioModal'

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

// Resuelve la ocupación de un arrendatario en el stacking_data del activo.
// Prioridad de matching:
//   1) arr_ref del unit === arrendatario.ref (id estable, sobrevive a renames
//      y resuelve la ambigüedad entre múltiples 'Desconocido')
//   2) Fallback por nombre (legacy: units viejas sin arr_ref)
// Devuelve { sup, count, byRef } — byRef=true si encontró match estable.
function findStackingTenant(stackingData, arrRef, tenantName) {
  const out = { sup: 0, count: 0, byRef: false }
  if (!stackingData) return out

  // Pase 1: match por arr_ref si lo tenemos
  if (arrRef) {
    for (const edif of stackingData) {
      for (const planta of (edif.arr || [])) {
        for (const u of (planta.units || [])) {
          if (u.type === 'ten' && u.arr_ref === arrRef) {
            out.sup += Number(u.sup) || 0
            out.count += 1
            out.byRef = true
          }
        }
      }
    }
    if (out.count > 0) return out
  }

  // Pase 2: fallback por nombre (solo unidades legacy sin arr_ref)
  if (tenantName) {
    for (const edif of stackingData) {
      for (const planta of (edif.arr || [])) {
        for (const u of (planta.units || [])) {
          if (u.type === 'ten' && !u.arr_ref && u.n === tenantName) {
            out.sup += Number(u.sup) || 0
            out.count += 1
          }
        }
      }
    }
  }
  return out
}

function mapDbToVencimientos(r, extras = {}) {
  const entries = []
  const activo = r.activo_ref || '—'
  const arrendatario = r.nombre || '—'
  // m² REAL = los que el arrendatario tiene asignados en el stacking del activo,
  // no los del campo libre de la tabla. Si no está asignado, su superficie es 0
  // y aparece como "huérfano" — la fila existe pero contablemente no ocupa nada.
  // Memoria: project_propietario_arrendatario_stacking.md
  const sup = extras.stackingSup ?? Number(r.m2) ?? 0
  const sinAsignar = !extras.asignadoEnStacking
  const linea = sectorToLinea(extras.uso)
  const mandato = extras.mandato || null
  const mesesRecordatorio = 3

  const baseExtras = {
    _real: true,
    _arrendatarioRef: r.ref,
    _activoRef: r.activo_ref,
    _tenantName: r.nombre,
    _estadoArr: r.estado_arr || 'Vigente',
    _mandatoRef: mandato?.ref || null,
    _mandatoTipo: mandato?.tipo || null,
    _sinAsignar: sinAsignar,
    _supLibre: Number(r.m2) || 0,
    _desconocido: !!extras.desconocido,
    _ambiguoMatch: !!extras.ambiguoMatch,
  }

  if (r.break_option) {
    entries.push({
      id: `DB-${r.ref}-BRK`, activo, arrendatario, sup, linea,
      fecha: r.break_option, tipo: 'Break', origen: 'interna',
      oportunidad: null, instruccion: null,
      ...baseExtras,
      _mesesRecordatorio: mesesRecordatorio,
      _recordatorioFecha: calcRecordatorioISO(r.break_option, mesesRecordatorio),
    })
  }
  if (r.vencimiento) {
    entries.push({
      id: `DB-${r.ref}-FIN`, activo, arrendatario, sup, linea,
      fecha: r.vencimiento, tipo: 'Fin contrato', origen: 'interna',
      oportunidad: null, instruccion: null,
      ...baseExtras,
    })
  }
  return entries
}

const ESTADO_ARR_TAG = {
  'Vigente':                  { bg:'#f0fdf4', color:'#15803d', border:'#bbf7d0' },
  'Activo':                   { bg:'#f0fdf4', color:'#15803d', border:'#bbf7d0' },
  'Próximo a vencimiento':    { bg:'#fef9c3', color:'#ca8a04', border:'#fde047' },
  'En negociación':           { bg:'#f5f3ff', color:'#7c3aed', border:'#ddd6fe' },
  'Renovado':                 { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe' },
  'Finalizado':               { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1' },
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
  const [fMandato, setFMandato] = useState('') // '' | 'con' | 'sin'
  const [fAsig, setFAsig]       = useState('') // '' | 'asignado' | 'huerfano'
  const [allVencimientos, setAllVencimientos] = useState(MOCK_VENCIMIENTOS)
  const [loadingDB, setLoadingDB] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [modal, setModal] = useState(null) // { action:'renovar', row, fecha }
  const [bajaArr, setBajaArr] = useState(null) // { row } — abre BajaArrendatarioModal
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState(null) // { type:'ok'|'err', msg, ofertaRef? }

  useEffect(() => {
    let cancel = false
    setLoadingDB(true)
    // 3 queries en paralelo:
    //  - arrendatarios con break/vencimiento (excl. Finalizado)
    //  - catálogo activos para mapear ref→uso (línea de negocio) y ref→id
    //  - mandatos sell-side vivos (alquiler/venta en_curso) para marcar
    //    qué vencimientos cuelgan de un activo bajo mandato → deal-flow
    //    caliente vs frío.
    Promise.all([
      supabase.from('arrendatarios')
        .select('ref,nombre,activo_ref,break_option,vencimiento,m2,estado_arr,tenant_desconocido')
        .or('break_option.not.is.null,vencimiento.not.is.null')
        .or('estado_arr.is.null,estado_arr.neq.Finalizado')
        .order('vencimiento', { nullsFirst: false }),
      supabase.from('activos').select('id,ref,uso,stacking_data'),
      supabase.from('mandato_activos')
        .select('activo_id, mandatos:mandato_id!inner(id,ref,estado,tipo,fecha_vencimiento)')
        .eq('mandatos.estado', 'en_curso')
        .in('mandatos.tipo', ['alquiler', 'venta']),
    ]).then(([arrRes, actRes, manRes]) => {
      if (cancel) return
      const usoByRef       = Object.fromEntries((actRes.data || []).map(a => [a.ref, a.uso]))
      const idByRef        = Object.fromEntries((actRes.data || []).map(a => [a.ref, a.id]))
      const stackingByRef  = Object.fromEntries((actRes.data || []).map(a => [a.ref, a.stacking_data || []]))
      const manByActivoId  = Object.fromEntries((manRes.data || []).map(m => [m.activo_id, m.mandatos]))

      const dbEntries = (arrRes.data || []).flatMap(r => {
        const stack = findStackingTenant(stackingByRef[r.activo_ref], r.ref, r.nombre)
        // 'Desconocido' es un placeholder colectivo: pueden coexistir varios
        // en el mismo activo. Si el match es por arr_ref (id estable), no hay
        // ambigüedad — la suma del stacking es fiable. Solo es ambiguo cuando
        // caemos al fallback por nombre con varios 'Desconocido' en stacking.
        const isDesconocido = !!r.tenant_desconocido || r.nombre === 'Desconocido'
        const matchSinRef = stack.count > 0 && !stack.byRef
        const ambiguo     = isDesconocido && matchSinRef
        return mapDbToVencimientos(r, {
          uso:                  usoByRef[r.activo_ref],
          mandato:              manByActivoId[idByRef[r.activo_ref]],
          // Para Desconocido sin arr_ref no usamos la suma (puede agregar
          // unidades de otros Desconocido). Con arr_ref sí confiamos.
          stackingSup:          (ambiguo ? null : (stack.sup > 0 ? stack.sup : null)),
          asignadoEnStacking:   stack.count > 0,
          desconocido:          isDesconocido,
          ambiguoMatch:         ambiguo,
        })
      })

      if (dbEntries.length > 0) setAllVencimientos(dbEntries)
      setLoadingDB(false)
    })
    return () => { cancel = true }
  }, [reloadKey])

  const filtered = allVencimientos.filter(v => {
    const [y, m] = v.fecha.split('-')
    const q = m <= '03' ? 'Q1' : m <= '06' ? 'Q2' : m <= '09' ? 'Q3' : 'Q4'
    if (fAnio    && y !== fAnio)               return false
    if (fPeriod  && q !== fPeriod)             return false
    if (fLinea   && v.linea !== fLinea)        return false
    if (fTipo    && v.tipo !== fTipo)          return false
    if (fMandato === 'con' && !v._mandatoRef)  return false
    if (fMandato === 'sin' && v._mandatoRef)   return false
    if (fAsig === 'asignado' && v._sinAsignar) return false
    if (fAsig === 'huerfano' && !v._sinAsignar) return false
    return true
  }).sort((a, b) => a.fecha.localeCompare(b.fecha))

  const alertas  = filtered.filter(v => diasRestantes(v.fecha) < 90).length
  const proximos = filtered.filter(v => { const d = diasRestantes(v.fecha); return d >= 0 && d < 365 }).length

  function isRecordatorioActivo(v) {
    if (v.tipo !== 'Break' || !v._recordatorioFecha) return false
    return diasRestantes(v._recordatorioFecha) <= 0
  }

  const handleRowClick = (v) => {
    if (v._real && v._tenantName) {
      navigate('ficha-arrendatario', { tenantName: v._tenantName })
    } else {
      navigate('ficha-arrendatario')
    }
  }

  const openRenovar = (v, e) => {
    e.stopPropagation()
    setModal({ action:'renovar', row:v, fecha:v.fecha })
  }
  const openGenerarOferta = (v, e) => {
    e.stopPropagation()
    setBajaArr({ row: v, mode: 'oferta' })
  }
  const openFinalizarSinOferta = (v, e) => {
    e.stopPropagation()
    setBajaArr({ row: v, mode: 'finalizar' })
  }
  const closeModal = () => { if (!working) { setModal(null) } }

  const confirmRenovar = async () => {
    if (!modal || !modal.fecha) return
    setWorking(true)
    const col = modal.row.tipo === 'Break' ? 'break_option' : 'vencimiento'
    // Renovar = nueva fecha + estado_arr a 'Renovado' (marca histórica
    // de que este contrato ha sido renovado al menos una vez).
    const { error } = await supabase
      .from('arrendatarios')
      .update({ [col]: modal.fecha, estado_arr: 'Renovado' })
      .eq('ref', modal.row._arrendatarioRef)
    setWorking(false)
    if (error) { setToast({ type:'err', msg:`Error renovando: ${error.message}` }); return }
    setToast({ type:'ok', msg:`✓ Contrato renovado · ${modal.row.tipo === 'Break' ? 'break' : 'fin'} → ${fmtFecha(modal.fecha)} · estado: Renovado` })
    setModal(null)
    setReloadKey(k => k + 1)
  }

  const onBajaArrSuccess = (result) => {
    if (result.action === 'oferta') {
      setToast({
        type:'ok',
        msg:`✓ Oferta ${result.ofertaRef} generada con disponibilidad ${fmtFecha(result.fechaSalida)}. Arrendatario marcado como Finalizado.`,
        ofertaRef: result.ofertaRef,
      })
    } else if (result.action === 'finalizar') {
      setToast({
        type:'ok',
        msg:`✓ Arrendatario marcado como Finalizado el ${fmtFecha(result.fechaSalida)} (sin oferta — activo cubierto).`,
      })
    }
    setBajaArr(null)
    setReloadKey(k => k + 1)
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

      {/* Toast */}
      {toast && (
        <div style={{
          padding:'8px 16px',
          background: toast.type === 'ok' ? '#f0fdf4' : '#fee2e2',
          color:      toast.type === 'ok' ? '#15803d' : '#991b1b',
          borderBottom: '1px solid', borderColor: toast.type === 'ok' ? '#bbf7d0' : '#fca5a5',
          fontSize:12, fontWeight:600,
          display:'flex', alignItems:'center', gap:12,
        }}>
          <span style={{ flex:1 }}>{toast.msg}</span>
          {toast.ofertaRef && (
            <button
              onClick={() => navigate('ficha-oferta', { id: toast.ofertaRef })}
              style={{ background:'#15803d', color:'#fff', border:'none', borderRadius:5, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
            >
              Ver oferta {toast.ofertaRef} →
            </button>
          )}
          <button onClick={() => setToast(null)} style={{ background:'none', border:'none', color:'inherit', fontSize:14, fontWeight:700, cursor:'pointer', opacity:0.6 }}>×</button>
        </div>
      )}

      {/* Filtros */}
      <div style={{padding:'8px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',gap:10,alignItems:'center',flexShrink:0}}>
        {[
          {lbl:'Año',     val:fAnio,    set:setFAnio,    opts:[['',''],['2025','2025'],['2026','2026'],['2027','2027'],['2028','2028'],['2029','2029'],['2030','2030']]},
          {lbl:'Período', val:fPeriod,  set:setFPeriod,  opts:[['',''],['Q1','Q1'],['Q2','Q2'],['Q3','Q3'],['Q4','Q4']]},
          {lbl:'Línea',   val:fLinea,   set:setFLinea,   opts:[['',''], ...LINEAS.map(l=>[l,l])]},
          {lbl:'Tipo',    val:fTipo,    set:setFTipo,    opts:[['',''],['Break','Break'],['Fin contrato','Fin contrato']]},
          {lbl:'Mandato',  val:fMandato, set:setFMandato, opts:[['','Todos'],['con','Bajo mandato vivo'],['sin','Sin mandato']]},
          {lbl:'Stacking', val:fAsig,    set:setFAsig,    opts:[['','Todos'],['asignado','Asignado al stacking'],['huerfano','⚠ Sin asignar (huérfano)']]},
        ].map(({lbl,val,set,opts})=>(
          <div key={lbl} style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>{lbl}</span>
            <select className="fsel" style={{fontSize:10}} value={val} onChange={e=>set(e.target.value)}>
              {opts.map(([v,l])=><option key={v} value={v}>{l||'Todos'}</option>)}
            </select>
          </div>
        ))}
        {(fAnio||fPeriod||fLinea||fTipo||fMandato||fAsig) && (
          <button onClick={()=>{setFAnio('');setFPeriod('');setFLinea('');setFTipo('');setFMandato('');setFAsig('')}}
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
              {['','Activo','Arrendatario','Superficie','Línea','Fecha vencim.','Tipo','Estado','Mandato','Recordatorio','Alerta','Acciones'].map(h=>(
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={12} style={{textAlign:'center',padding:32,color:'var(--text4)',fontSize:12}}>No hay vencimientos para los filtros aplicados</td></tr>
              : filtered.map(v => {
                  const dias = diasRestantes(v.fecha)
                  const recActivo = isRecordatorioActivo(v)
                  return (
                    <tr key={v.id} onClick={()=>handleRowClick(v)} style={{cursor:'pointer'}}>
                      <td style={{width:8,padding:'0 4px'}}>
                        {v._real && <span title="Dato real" style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'var(--green)'}}/>}
                      </td>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{v.activo}</td>
                      <td style={{fontSize:11}}>
                        {v._desconocido
                          ? <span style={{ fontStyle:'italic', color:'var(--text3)' }}>Desconocido</span>
                          : v.arrendatario}
                        {v._sinAsignar && !v._desconocido && (
                          <span
                            title="Existe en la tabla de arrendatarios pero NO está arrastrado al stacking del activo. Su superficie es contablemente 0 hasta que se asigne."
                            style={{ marginLeft:6, fontSize:8, fontWeight:700, padding:'1px 6px', borderRadius:8, background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a' }}
                          >
                            ⚠ HUÉRFANO
                          </span>
                        )}
                        {v._sinAsignar && v._desconocido && (
                          <span
                            title="Tenant marcado como Desconocido y no hay ninguna unidad 'Desconocido' en el stacking del activo. Hay que arrastrarlo a una planta o disambiguar el nombre."
                            style={{ marginLeft:6, fontSize:8, fontWeight:700, padding:'1px 6px', borderRadius:8, background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a' }}
                          >
                            ⚠ SIN STACKING
                          </span>
                        )}
                        {v._ambiguoMatch && (
                          <span
                            title="Hay varias unidades 'Desconocido' en el stacking del activo. El match por nombre es ambiguo — la m² mostrada viene del registro libre, no del stacking."
                            style={{ marginLeft:6, fontSize:8, fontWeight:700, padding:'1px 6px', borderRadius:8, background:'#eff6ff', color:'#1e40af', border:'1px solid #bfdbfe' }}
                          >
                            🆔 AMBIGUO
                          </span>
                        )}
                      </td>
                      <td className="mono" style={{fontSize:11}}>
                        {v._sinAsignar && !v._desconocido
                          ? <span style={{ color:'var(--text4)' }} title={`Tabla: ${Number(v._supLibre||0).toLocaleString('es-ES')} m² · Stacking: 0`}>0 m²</span>
                          : <>{Number(v.sup||0).toLocaleString('es-ES')} m²{v._desconocido && <span style={{ marginLeft:3, fontSize:9, color:'var(--text4)' }} title="Para tenants Desconocido la m² viene del registro libre, no del stacking">*</span>}</>}
                      </td>
                      <td><span className="tag tag-blue" style={{fontSize:9}}>{v.linea}</span></td>
                      <td style={{fontSize:11,fontFamily:'var(--mono)',fontWeight:600}}>{fmtFecha(v.fecha)}</td>
                      <td><span className={`tag ${TIPOS_TAG[v.tipo]||'tag-gray'}`} style={{fontSize:9}}>{v.tipo}</span></td>
                      <td>
                        {v._estadoArr ? (() => {
                          const c = ESTADO_ARR_TAG[v._estadoArr] || { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1' }
                          return <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:9, background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>{v._estadoArr}</span>
                        })() : <span style={{ fontSize:9, color:'var(--text4)' }}>—</span>}
                      </td>
                      <td>
                        {v._mandatoRef ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate('ficha-mandato', { id: v._mandatoRef }) }}
                            style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:9, background:'#f3e8ff', color:'#7c3aed', border:'1px solid #d8b4fe', cursor:'pointer', fontFamily:'inherit' }}
                            title={`Mandato ${v._mandatoTipo} vivo · click para abrir`}
                          >
                            📜 {v._mandatoRef}
                          </button>
                        ) : <span style={{ fontSize:9, color:'var(--text4)' }}>—</span>}
                      </td>
                      <td style={{fontSize:10,color:recActivo?'var(--red)':'var(--text3)'}}>
                        {v._recordatorioFecha
                          ? <>{fmtFecha(v._recordatorioFecha)}{recActivo && <span style={{marginLeft:4,fontSize:8,fontWeight:700,color:'var(--red)'}}>⚠ ACTIVO</span>}</>
                          : '—'}
                      </td>
                      <td><AlertaBadge dias={dias}/></td>
                      <td style={{ whiteSpace:'nowrap' }}>
                        {v._real ? (
                          <div style={{ display:'flex', gap:4 }}>
                            <button
                              onClick={(e) => openRenovar(v, e)}
                              style={{ fontSize:10, padding:'3px 9px', borderRadius:4, border:'1px solid var(--green-bd, #bbf7d0)', background:'var(--green-lt, #f0fdf4)', color:'var(--green, #15803d)', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}
                              title="Renovar el contrato (cambia la fecha)"
                            >
                              🔄 Renovar
                            </button>
                            <button
                              onClick={(e) => openGenerarOferta(v, e)}
                              style={{ fontSize:10, padding:'3px 9px', borderRadius:4, border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', color:'var(--accent)', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}
                              title="Sale a mercado: crear oferta sell-side"
                            >
                              📢 Generar oferta
                            </button>
                            <button
                              onClick={(e) => openFinalizarSinOferta(v, e)}
                              style={{ fontSize:10, padding:'3px 9px', borderRadius:4, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text3)', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}
                              title="Cubierto por pre-alquiler: finalizar sin generar oferta"
                            >
                              ✓ Sin oferta
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize:9, color:'var(--text4)', fontStyle:'italic' }}>(demo)</span>
                        )}
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {/* Modal Renovar (acción específica de esta vista) */}
      {modal && modal.action === 'renovar' && (
        <div onClick={closeModal} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:10, width:'min(520px, 92vw)', boxShadow:'0 20px 50px rgba(15,23,42,0.25)' }}>
            <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>🔄 Renovar contrato</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
                {modal.row.activo} · {modal.row.arrendatario} · {modal.row.tipo}
              </div>
            </div>
            <div style={{ padding:'16px 22px' }}>
              <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12, lineHeight:1.55 }}>
                Cambia la fecha {modal.row.tipo === 'Break' ? 'de break option' : 'de fin de contrato'} en el arrendatario.
                El registro seguirá apareciendo en la lista con la nueva fecha.
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', minWidth:120 }}>Nueva fecha</span>
                <input
                  type="date"
                  value={modal.fecha || ''}
                  onChange={e => setModal({ ...modal, fecha:e.target.value })}
                  style={{ padding:'8px 10px', fontSize:13, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit' }}
                />
              </div>
              <div style={{ marginTop:6, fontSize:10, color:'var(--text4)' }}>
                Fecha actual: {fmtFecha(modal.row.fecha)}
              </div>
            </div>
            <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={closeModal} disabled={working} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Cancelar</button>
              <button
                onClick={confirmRenovar}
                disabled={working || !modal.fecha}
                style={{ padding:'8px 14px', fontSize:12, border:'none', borderRadius:5, background:'var(--accent)', color:'#fff', cursor:working?'wait':'pointer', fontFamily:'inherit', fontWeight:600, opacity: working ? 0.6 : 1 }}
              >
                {working ? 'Procesando…' : '🔄 Renovar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal compartido para "el arrendatario se va" (oferta o sin oferta) */}
      {bajaArr && (
        <BajaArrendatarioModal
          arrendatario={{
            ref:        bajaArr.row._arrendatarioRef,
            nombre:     bajaArr.row.arrendatario,
            sup:        bajaArr.row.sup,
            fecha:      bajaArr.row.fecha,
            activo_ref: bajaArr.row._activoRef,
          }}
          activo={null}
          onClose={() => setBajaArr(null)}
          onSuccess={onBajaArrSuccess}
        />
      )}
    </div>
  )
}
