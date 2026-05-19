import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER } from '../lib/currentUser'
import EquipoTrabajoCard, { makeEquipoHandlers, isPrincipal } from '../components/EquipoTrabajoCard'
import ActividadesPanel from '../components/ActividadesPanel'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'
import Vinculaciones from '../components/Vinculaciones'

// Mismo formato que Propuestas y Proyectos: una sola pestaña principal
// que agrupa todos los bloques. Fees y honorarios pasa a estar dentro
// de Información del mandato (encima de Equipo de trabajo).
// Vista 360 sustituye a Actividades.
const MAN_TABS = [
  ['man-info', 'Información general'],
  ['man-docs', 'Documentos'],
  ['man-act',  'Vista 360'],
  ['man-conf', 'Confidencialidad'],
]

const TIPO_OPTS = [
  { v:'alquiler',    label:'Alquiler' },
  { v:'venta',       label:'Venta' },
  { v:'demanda',     label:'Demanda' },
  { v:'consultoria', label:'Consultoría' },
]
const TIPO_LABEL = Object.fromEntries(TIPO_OPTS.map(o => [o.v, o.label]))

const VIA_OPTS = [
  { v:'pitch',   label:'Pitch' },
  { v:'directo', label:'Directo' },
]

const ESTADO_OPTS = [
  { v:'en_curso', label:'En curso' },
  { v:'cerrado',  label:'Cerrado' },
  { v:'cancelado',label:'Cancelado' },
]
const ESTADO_LABEL = Object.fromEntries(ESTADO_OPTS.map(o => [o.v, o.label]))

const EXCL_OPTS = [
  { v:'exclusiva',   label:'Exclusiva' },
  { v:'coexclusiva', label:'Co-exclusiva' },
]

// Motivos por los que se cancela un mandato (antes del vencimiento)
const MOTIVOS_CANCELACION = [
  'Cuenta cancela el encargo',
  'Pérdida de competitividad de Savills',
  'Cambio de estrategia de la Cuenta',
  'Activo vendido / alquilado fuera de Savills',
  'Conflicto de interés',
  'Problema de compliance / KYC',
  'Otro motivo',
]

const DEPARTAMENTOS = ['Oficinas','Capital Markets','Valoraciones','Property Management','Logístico','Retail','Industrial','Living']
const PROVINCIAS    = ['Madrid','Barcelona','Valencia','Sevilla','Bilbao','Málaga','Zaragoza','Alicante']

// Equipos y miembros internos de Savills (espejo de UsuariosList; cuando
// haya tabla `usuarios` en Supabase esto se reemplaza por una query).
const MIEMBROS_POR_EQUIPO = {
  'Leasing Oficinas MAD':  ['Sierra Alvaro','GOMEZ Ignacio','Consultor MAD','Alonso Abruña D.'],
  'Leasing Oficinas BCN':  ['Pérez Joan','Martí Sara'],
  'Capital Markets MAD':   ['García Marta','Ruiz Pablo'],
  'Capital Markets BCN':   ['Vidal Elena'],
  'Valoraciones MAD':      ['López Carmen','Domínguez Pedro'],
  'Property Management':   ['Hernández Lucía'],
  'Retail Spain':          ['Ortega Sergio'],
  'Logístico Spain':       ['Castro Andrea'],
  'Industrial Spain':      ['Romero David'],
  'Living Spain':          ['Aguirre Laura'],
}
const EQUIPOS_SAVILLS = Object.keys(MIEMBROS_POR_EQUIPO)

const sel = { width:'auto', padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inp = { width:120,   padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inpFull = { ...inp, width:'100%' }
const ta  = { width:'100%', padding:'6px 9px', fontSize:11.5, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit', minHeight:60, lineHeight:1.5, resize:'vertical' }

function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('es-ES') }
function diasEntre(d) { if (!d) return null; const t = new Date(d).getTime(); return Math.round((t - Date.now()) / 86400000) }

function StubTab({ label }) {
  return (
    <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>
      <div style={{ fontSize:32, marginBottom:8 }}></div>
      <div style={{ fontWeight:600, color:'var(--text2)', marginBottom:4 }}>{label}</div>
      <div>Sección disponible próximamente.</div>
    </div>
  )
}

export default function FichaMandatoSupabase({ refOrId }) {
  const { navigate } = useNav()
  const [tab, setTab] = useState('man-info')
  const [mandato, setMandato] = useState(null)
  const [cuenta, setCuenta]   = useState(null)
  const [mandatoConfidential, setMandatoConfidential] = useState(false)
  const [mandatoAuthUsers, setMandatoAuthUsers] = useState([
    { name: CURRENT_USER.nombre, team: CURRENT_USER.equipo || 'Equipo PDB', role:'Principal', initials:(CURRENT_USER.nombre||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(), bg:'#f5efe5', color:'#5a4828', owner:true },
  ])
  const [oportunidad, setOportunidad] = useState(null)
  const [activosLinked, setActivosLinked] = useState([]) // [{ link_id, sba_asignada, activo:{id,ref,nombre,...} }]
  const [activosCatalog, setActivosCatalog] = useState([]) // todos los activos para selector
  const [cuentasCatalog, setCuentasCatalog] = useState([])
  const [contactosAgente, setContactosAgente] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const editing = true
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [showCierreVencido, setShowCierreVencido] = useState(false)
  const [cerrandoVencido, setCerrandoVencido] = useState(false)

  const [ofertasMandato, setOfertasMandato] = useState([])
  const [showCancelar, setShowCancelar] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [cancelMotivo, setCancelMotivo] = useState('')

  const [form, setForm] = useState({
    titulo:'', tipo:'alquiler', via:'directo', estado:'en_curso',
    departamento:'', provincia:'', zona:'', responsable:'', equipo:'',
    fecha_firma:'', fecha_inicio:'', fecha_vencimiento:'',
    preaviso_dias:30, alerta_dias:60, prorroga_tacita:false, prorroga_meses:0,
    exclusividad_modo:'exclusiva', cuenta_agente_id:'', contacto_agente_id:'',
    fee_porcentaje:'', fee_eur_fijo:'', fee_min_garantizado:'',
    fee_sliding:'',
    fee_reparto:[], // [{ nombre, tipo:'interno'|'externo', porcentaje }]
    motivo_cancelacion:'', notas:'',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: errMandato } = await supabase
      .from('mandatos')
      .select(`
        id, ref, titulo, tipo, via, exclusividad, exclusividad_modo, estado, motivo_cancelacion,
        fecha_firma, fecha_inicio, fecha_vencimiento, preaviso_dias, alerta_dias,
        prorroga_tacita, prorroga_meses,
        fee_porcentaje, fee_eur_fijo, fee_min_garantizado, fee_sliding_jsonb, fee_compartido_jsonb,
        responsable, equipo, departamento, provincia, zona, notas, equipo_trabajo,
        dynamics_account_id, dynamics_opportunity_id, cuenta_agente_id, contacto_agente_id,
        created_at, updated_at,
        dynamics_accounts:dynamics_account_id ( dynamics_id, nombre, tipo, sector, telefono, ciudad, direccion, codigo_postal, pais, web ),
        dynamics_opportunities:dynamics_opportunity_id ( dynamics_id, nombre, tipo )
      `)
      .eq('ref', refOrId)
      .maybeSingle()

    if (errMandato) { setError(errMandato.message); setMandato(null); setLoading(false); return }
    if (!data)      { setError(`Mandato ${refOrId} no encontrado`); setMandato(null); setLoading(false); return }

    setMandato(data)
    setCuenta(data.dynamics_accounts)
    setOportunidad(data.dynamics_opportunities)

    // Activos vinculados
    const { data: links } = await supabase
      .from('mandato_activos')
      .select('id, sba_asignada, notas, activos:activo_id ( id, ref, nombre, ciudad, zona, uso, sba )')
      .eq('mandato_id', data.id)
    setActivosLinked(links || [])

    // Catálogo de activos (para el selector de añadir)
    const { data: cat } = await supabase
      .from('activos')
      .select('id, ref, nombre, ciudad, uso, sba')
      .order('nombre')
      .limit(200)
    setActivosCatalog(cat || [])

    // Catálogo de cuentas Dynamics (para co-exclusiva: agente externo)
    const { data: cuentasCat } = await supabase
      .from('dynamics_accounts')
      .select('dynamics_id, nombre')
      .order('nombre')
    setCuentasCatalog(cuentasCat || [])

    // Contactos del agente externo si la coex está rellena
    if (data.cuenta_agente_id) {
      const { data: cts } = await supabase
        .from('dynamics_contacts')
        .select('dynamics_id, nombre, email, telefono')
        .eq('cuenta_dynamics_id', data.cuenta_agente_id)
        .order('nombre')
      setContactosAgente(cts || [])
    } else {
      setContactosAgente([])
    }

    // Ofertas vinculadas (necesarias para la cascada de cierre por vencimiento)
    const { data: ofMan } = await supabase
      .from('ofertas')
      .select('id, ref, estado, activa')
      .eq('mandato_id', data.id)
    setOfertasMandato(ofMan || [])

    setError(null)
    setLoading(false)
  }, [refOrId])

  useEffect(() => { load() }, [load])

  // Cuando cambia la cuenta_agente_id en el form, recargar contactos
  useEffect(() => {
    let cancel = false
    async function refreshAgentContacts() {
      if (!form.cuenta_agente_id) { setContactosAgente([]); return }
      const { data } = await supabase
        .from('dynamics_contacts')
        .select('dynamics_id, nombre, email, telefono')
        .eq('cuenta_dynamics_id', form.cuenta_agente_id)
        .order('nombre')
      if (!cancel) setContactosAgente(data || [])
    }
    refreshAgentContacts()
    return () => { cancel = true }
  }, [form.cuenta_agente_id])

  useEffect(() => {
    if (!mandato) return
    setForm({
      titulo:               mandato.titulo || '',
      tipo:                 mandato.tipo || 'alquiler',
      via:                  mandato.via || 'directo',
      estado:               mandato.estado || 'en_curso',
      departamento:         mandato.departamento || '',
      provincia:            mandato.provincia || '',
      zona:                 mandato.zona || '',
      responsable:          mandato.responsable || '',
      equipo:               mandato.equipo || '',
      fecha_firma:          mandato.fecha_firma || '',
      fecha_inicio:         mandato.fecha_inicio || '',
      fecha_vencimiento:    mandato.fecha_vencimiento || '',
      preaviso_dias:        mandato.preaviso_dias ?? 30,
      alerta_dias:          mandato.alerta_dias ?? 60,
      prorroga_tacita:      !!mandato.prorroga_tacita,
      prorroga_meses:       mandato.prorroga_meses ?? 0,
      exclusividad_modo:    mandato.exclusividad_modo || (mandato.exclusividad ? 'exclusiva' : 'exclusiva'),
      cuenta_agente_id:     mandato.cuenta_agente_id || '',
      contacto_agente_id:   mandato.contacto_agente_id || '',
      fee_porcentaje:       mandato.fee_porcentaje ?? '',
      fee_eur_fijo:         mandato.fee_eur_fijo ?? '',
      fee_min_garantizado:  mandato.fee_min_garantizado ?? '',
      fee_sliding:          mandato.fee_sliding_jsonb ? JSON.stringify(mandato.fee_sliding_jsonb) : '',
      fee_reparto:          Array.isArray(mandato.fee_compartido_jsonb?.reparto) ? mandato.fee_compartido_jsonb.reparto : [],
      motivo_cancelacion:   mandato.motivo_cancelacion || '',
      notas:                mandato.notas || '',
    })
    setSaveError(null)
  }, [mandato])

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const restablecer = async () => {
    setSaveError(null)
    await load()
  }

  const saveEdit = async () => {
    if (form.estado === 'cancelado' && !form.motivo_cancelacion.trim()) {
      setSaveError('Debes indicar el motivo de cancelación antes de guardar.')
      return
    }
    setSaving(true)
    let slidingJson = null, compartidoJson = null
    try { if (form.fee_sliding.trim())    slidingJson    = JSON.parse(form.fee_sliding) } catch (e) { /* permitimos guardar sin parse */ }
    if (form.fee_reparto.length > 0) {
      compartidoJson = { reparto: form.fee_reparto.filter(r => r.nombre || r.porcentaje) }
    }

    const payload = {
      titulo:                form.titulo.trim() || null,
      tipo:                  form.tipo,
      via:                   form.via,
      estado:                form.estado,
      departamento:          form.departamento || null,
      provincia:             form.provincia || null,
      zona:                  form.zona || null,
      responsable:           form.responsable || null,
      equipo:                form.equipo || null,
      fecha_firma:           form.fecha_firma || null,
      fecha_inicio:          form.fecha_inicio || null,
      fecha_vencimiento:     form.fecha_vencimiento || null,
      preaviso_dias:         form.preaviso_dias ? Number(form.preaviso_dias) : null,
      alerta_dias:           form.alerta_dias ? Number(form.alerta_dias) : null,
      prorroga_tacita:       !!form.prorroga_tacita,
      prorroga_meses:        form.prorroga_meses ? Number(form.prorroga_meses) : 0,
      exclusividad:          true,
      exclusividad_modo:     form.exclusividad_modo,
      cuenta_agente_id:      form.exclusividad_modo === 'coexclusiva' ? (form.cuenta_agente_id || null) : null,
      contacto_agente_id:    form.exclusividad_modo === 'coexclusiva' ? (form.contacto_agente_id || null) : null,
      fee_porcentaje:        form.fee_porcentaje !== '' ? Number(form.fee_porcentaje) : null,
      fee_eur_fijo:          form.fee_eur_fijo !== '' ? Number(form.fee_eur_fijo) : null,
      fee_min_garantizado:   form.fee_min_garantizado !== '' ? Number(form.fee_min_garantizado) : null,
      fee_sliding_jsonb:     slidingJson,
      fee_compartido_jsonb:  compartidoJson,
      motivo_cancelacion:    form.estado === 'cancelado' ? (form.motivo_cancelacion.trim() || null) : null,
      notas:                 form.notas || null,
      updated_at:            new Date().toISOString(),
    }
    const { error } = await supabase.from('mandatos').update(payload).eq('id', mandato.id)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    await load()
  }

  // ====== Activos vinculados ======
  const addActivo = async (activoId) => {
    if (!activoId || !mandato) return
    const { error } = await supabase.from('mandato_activos').insert({ mandato_id: mandato.id, activo_id: activoId })
    if (error) { setSaveError(error.message); return }
    await load()
  }
  const removeActivo = async (linkId) => {
    if (!linkId) return
    const { error } = await supabase.from('mandato_activos').delete().eq('id', linkId)
    if (error) { setSaveError(error.message); return }
    await load()
  }
  const updateSbaAsignada = async (linkId, sba) => {
    const { error } = await supabase.from('mandato_activos').update({ sba_asignada: sba ? Number(sba) : null }).eq('id', linkId)
    if (error) { setSaveError(error.message); return }
    await load()
  }

  // Cierre de mandato — dos escenarios distintos:
  //   'desvincular' → mandato cerrado pero ofertas siguen vivas (el activo sigue
  //                   en mercado, simplemente lo lleva otra agencia o nadie).
  //                   Solo se rompe el vínculo (mandato_id=null, tipo_comercializacion).
  //   'retirar'     → mandato cerrado y ofertas retiradas (el activo sale del
  //                   mercado: propietario lo ocupa, no renueva, etc.).
  // Cancelar mandato (antes del vencimiento). Misma decisión sobre las ofertas
  // que en el cierre por vencimiento — ver feedback_cierre_mandato.md.
  const cancelarMandato = async (modo) => {
    if (!mandato) return
    if (!cancelMotivo.trim()) { setSaveError('Selecciona un motivo de cancelación.'); return }
    setCancelando(true); setSaveError(null)
    const ahora = new Date().toISOString()
    try {
      const { error: e1 } = await supabase.from('mandatos').update({
        estado:             'cancelado',
        motivo_cancelacion: cancelMotivo.trim(),
        updated_at:         ahora,
      }).eq('id', mandato.id)
      if (e1) throw new Error(`Mandato: ${e1.message}`)

      const ofVivas = ofertasMandato.filter(o => o.estado !== 'Retirada' && o.estado !== 'Ocupada total')
      if (ofVivas.length > 0) {
        const payload = modo === 'retirar'
          ? { estado:'Retirada', activa:false, motivo_descarte:'Mandato cancelado', updated_at:ahora }
          : { mandato_id: null, tipo_comercializacion: 'Sin mandato', updated_at: ahora }
        const { error: e2 } = await supabase.from('ofertas').update(payload).in('id', ofVivas.map(o => o.id))
        if (e2) throw new Error(`Ofertas: ${e2.message}`)
      }

      setShowCancelar(false)
      setCancelMotivo('')
      await load()
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setCancelando(false)
    }
  }

  const cerrarMandato = async (modo) => {
    if (!mandato) return
    setCerrandoVencido(true); setSaveError(null)
    const ahora = new Date().toISOString()
    try {
      const { error: e1 } = await supabase.from('mandatos').update({
        estado: 'cerrado',
        updated_at: ahora,
      }).eq('id', mandato.id)
      if (e1) throw new Error(`Mandato: ${e1.message}`)

      const ofVivas = ofertasMandato.filter(o => o.estado !== 'Retirada' && o.estado !== 'Ocupada total')
      if (ofVivas.length > 0) {
        const payload = modo === 'retirar'
          ? { estado:'Retirada', activa:false, motivo_descarte:'Mandato finalizado / no renovado', updated_at:ahora }
          : { mandato_id: null, tipo_comercializacion: 'Sin mandato', updated_at: ahora }
        const { error: e2 } = await supabase.from('ofertas').update(payload).in('id', ofVivas.map(o => o.id))
        if (e2) throw new Error(`Ofertas: ${e2.message}`)
      }

      setShowCierreVencido(false)
      await load()
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setCerrandoVencido(false)
    }
  }

  if (loading) return <div style={{ padding:32, color:'var(--text4)', fontSize:12 }}>Cargando…</div>
  if (error || !mandato) {
    return (
      <div style={{ padding:32 }}>
        <div style={{ fontSize:13, color:'#991b1b', marginBottom:12 }}>{error || 'No encontrado'}</div>
        <button className="ab-btn" onClick={() => navigate('mandatos')}>← Volver a Mandatos</button>
      </div>
    )
  }

  const dr = diasEntre(form.fecha_vencimiento || mandato.fecha_vencimiento)
  let estadoUI = '—', estadoColor = 'var(--text)'
  if (form.estado === 'cancelado')                                  { estadoUI = 'Cancelado'; estadoColor = 'var(--text4)' }
  else if (form.estado === 'cerrado' || (dr !== null && dr < 0))    { estadoUI = 'Vencido'; estadoColor = 'var(--red)' }
  else if (dr !== null && dr <= 30)                                 { estadoUI = 'Alerta'; estadoColor = 'var(--amber)' }
  else                                                              { estadoUI = 'Activo'; estadoColor = 'var(--green)' }

  const idsLinked = activosLinked.map(l => l.activos?.id).filter(Boolean)
  const activosDisponibles = activosCatalog.filter(a => !idsLinked.includes(a.id))
  const sbaTotal = activosLinked.reduce((s,l) => s + (Number(l.sba_asignada) || 0), 0)
  const equipoArr = Array.isArray(mandato.equipo_trabajo) ? mandato.equipo_trabajo : []
  const principal = equipoArr.find(m => m.rol === 'Principal')
  const responsableUI = principal?.nombre || form.responsable || '—'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <div className="action-bar">
        <button className="ab-btn save" onClick={saveEdit} disabled={saving}>
          {saving ? 'Guardando…' : '💾 Guardar cambios'}
        </button>
        <button className="ab-btn" onClick={restablecer} disabled={saving}>↺ Restablecer</button>
        <button className="ab-btn" onClick={() => navigate('mandatos')}>← Volver</button>
        <div className="ab-sep"/>
        <button className="ab-btn" disabled style={{ opacity:0.45 }}>📄 Generar contrato</button>
        {(() => {
          const vencido = dr !== null && dr < 0
          const aunVivo = mandato.estado === 'en_curso'
          if (!vencido || !aunVivo) return null
          return (
            <button
              className="ab-btn"
              onClick={() => setShowCierreVencido(true)}
              style={{ background:'var(--red)', color:'#fff', border:'1px solid var(--red)', fontWeight:700 }}
              title="Cerrar mandato vencido y retirar ofertas asociadas"
            >
              🏁 Cerrar mandato vencido
            </button>
          )
        })()}
        <button
          className="ab-btn"
          disabled={mandato.estado==='cancelado' || mandato.estado==='cerrado'}
          onClick={() => setShowCancelar(true)}
          style={{ color:'var(--red)' }}
        >Cancelar mandato</button>
        {saveError && <span style={{ marginLeft:12, fontSize:11, color:'#991b1b', fontWeight:600 }}>{saveError}</span>}
      </div>

      {showCierreVencido && (() => {
        const ofVivas = ofertasMandato.filter(o => o.estado !== 'Retirada' && o.estado !== 'Ocupada total')
        return (
          <div onClick={() => !cerrandoVencido && setShowCierreVencido(false)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:10, width:'min(620px, 94vw)', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 50px rgba(15,23,42,0.25)' }}>
              <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:14, fontWeight:700 }}>🏁 Cerrar mandato vencido</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{mandato.ref} · {mandato.titulo || cuenta?.nombre || '—'} · venció el {fmtDate(mandato.fecha_vencimiento)} ({Math.abs(dr)}d)</div>
              </div>
              <div style={{ padding:'16px 22px', display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55 }}>
                  El mandato pasa a <strong>cerrado</strong>. ¿Qué hacemos con {ofVivas.length === 0 ? 'las ofertas?' : <>las <strong>{ofVivas.length} oferta{ofVivas.length === 1 ? '' : 's'}</strong> vinculada{ofVivas.length === 1 ? '' : 's'}?</>}
                </div>

                {ofVivas.length > 0 && (
                  <div style={{ background:'var(--gray-lt)', borderRadius:6, padding:10, fontSize:11 }}>
                    {ofVivas.map(o => (
                      <div key={o.id} style={{ fontFamily:'var(--mono)', color:'var(--text2)' }}>· {o.ref} <span style={{ color:'var(--text4)', marginLeft:6 }}>({o.estado || '—'})</span></div>
                    ))}
                  </div>
                )}

                {ofVivas.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <button
                      onClick={() => cerrarMandato('desvincular')}
                      disabled={cerrandoVencido}
                      style={{ padding:'12px 14px', fontSize:13, border:'1px solid var(--accent)', background:'var(--accent-lt)', color:'var(--accent)', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:700, textAlign:'left', lineHeight:1.4 }}
                    >
                      🔄 Mantener ofertas activas, solo desvincular del mandato
                      <div style={{ fontSize:10, fontWeight:500, color:'var(--text3)', marginTop:3 }}>El activo sigue en mercado pero ya no es nuestro mandato (otra agencia, sin mandato, etc.). Las ofertas quedan con tipo "Sin mandato".</div>
                    </button>
                    <button
                      onClick={() => cerrarMandato('retirar')}
                      disabled={cerrandoVencido}
                      style={{ padding:'12px 14px', fontSize:13, border:'1px solid var(--red)', background:'var(--red-lt)', color:'var(--red)', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:700, textAlign:'left', lineHeight:1.4 }}
                    >
                      🏁 Retirar también las ofertas (activo sale del mercado)
                      <div style={{ fontSize:10, fontWeight:500, color:'var(--text3)', marginTop:3 }}>El propietario no renueva o ocupa internamente. Ofertas → Retirada con motivo "Mandato finalizado / no renovado".</div>
                    </button>
                  </div>
                )}

                {ofVivas.length === 0 && (
                  <button
                    onClick={() => cerrarMandato('desvincular')}
                    disabled={cerrandoVencido}
                    style={{ padding:'10px 14px', fontSize:13, border:'1px solid var(--text)', background:'var(--text)', color:'#fff', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}
                  >
                    🏁 Cerrar mandato (no hay ofertas que actualizar)
                  </button>
                )}

                {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:10, fontSize:11, color:'#991b1b' }}>{saveError}</div>}
              </div>
              <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button onClick={() => setShowCierreVencido(false)} disabled={cerrandoVencido} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>Cancelar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {showCancelar && (() => {
        const ofVivas = ofertasMandato.filter(o => o.estado !== 'Retirada' && o.estado !== 'Ocupada total')
        const motivoEsPredef = MOTIVOS_CANCELACION.includes(cancelMotivo)
        const motivoEsOtro   = !!cancelMotivo && !motivoEsPredef
        const sel_v = motivoEsOtro ? 'Otro motivo' : (cancelMotivo || '')
        return (
          <div onClick={() => !cancelando && (setShowCancelar(false), setCancelMotivo(''))} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:10, width:'min(620px, 94vw)', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 50px rgba(15,23,42,0.25)' }}>
              <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:14, fontWeight:700 }}>✕ Cancelar mandato</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{mandato.ref} · {mandato.titulo || cuenta?.nombre || '—'}</div>
              </div>
              <div style={{ padding:'16px 22px', display:'flex', flexDirection:'column', gap:14 }}>

                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.04em' }}>Motivo de cancelación *</div>
                  <select
                    value={sel_v}
                    onChange={e => {
                      const v = e.target.value
                      if (v === '') setCancelMotivo('')
                      else if (v === 'Otro motivo') setCancelMotivo(motivoEsOtro ? cancelMotivo : ' ')
                      else setCancelMotivo(v)
                    }}
                    style={{ width:'100%', padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', fontFamily:'inherit' }}
                  >
                    <option value="">Selecciona un motivo...</option>
                    {MOTIVOS_CANCELACION.map(m => <option key={m}>{m}</option>)}
                  </select>
                  {(sel_v === 'Otro motivo' || motivoEsOtro) && (
                    <textarea
                      value={motivoEsOtro ? cancelMotivo : ''}
                      onChange={e => setCancelMotivo(e.target.value)}
                      placeholder="Describe el motivo..."
                      style={{ width:'100%', marginTop:8, padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', minHeight:60, resize:'vertical', boxSizing:'border-box' }}
                    />
                  )}
                </div>

                {ofVivas.length > 0 && (
                  <>
                    <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55 }}>
                      Hay <strong>{ofVivas.length} oferta{ofVivas.length === 1 ? '' : 's'}</strong> vinculada{ofVivas.length === 1 ? '' : 's'} a este mandato. ¿Qué hacemos con {ofVivas.length === 1 ? 'ella' : 'ellas'}?
                    </div>
                    <div style={{ background:'var(--gray-lt)', borderRadius:6, padding:10, fontSize:11 }}>
                      {ofVivas.map(o => (
                        <div key={o.id} style={{ fontFamily:'var(--mono)', color:'var(--text2)' }}>· {o.ref} <span style={{ color:'var(--text4)', marginLeft:6 }}>({o.estado || '—'})</span></div>
                      ))}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <button
                        onClick={() => cancelarMandato('desvincular')}
                        disabled={cancelando || !cancelMotivo.trim()}
                        style={{ padding:'12px 14px', fontSize:13, border:'1px solid var(--accent)', background:'var(--accent-lt)', color:'var(--accent)', borderRadius:8, cursor: cancelando || !cancelMotivo.trim() ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontWeight:700, textAlign:'left', lineHeight:1.4, opacity: cancelando || !cancelMotivo.trim() ? 0.5 : 1 }}
                      >
                        🔄 Cancelar mandato y mantener ofertas activas
                        <div style={{ fontSize:10, fontWeight:500, color:'var(--text3)', marginTop:3 }}>El activo sigue en mercado pero ya no es nuestro mandato. Ofertas: tipo "Sin mandato".</div>
                      </button>
                      <button
                        onClick={() => cancelarMandato('retirar')}
                        disabled={cancelando || !cancelMotivo.trim()}
                        style={{ padding:'12px 14px', fontSize:13, border:'1px solid var(--red)', background:'var(--red-lt)', color:'var(--red)', borderRadius:8, cursor: cancelando || !cancelMotivo.trim() ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontWeight:700, textAlign:'left', lineHeight:1.4, opacity: cancelando || !cancelMotivo.trim() ? 0.5 : 1 }}
                      >
                        🏁 Cancelar mandato y retirar ofertas
                        <div style={{ fontSize:10, fontWeight:500, color:'var(--text3)', marginTop:3 }}>El activo sale del mercado. Ofertas → Retirada con motivo "Mandato cancelado".</div>
                      </button>
                    </div>
                  </>
                )}

                {ofVivas.length === 0 && (
                  <button
                    onClick={() => cancelarMandato('desvincular')}
                    disabled={cancelando || !cancelMotivo.trim()}
                    style={{ padding:'10px 14px', fontSize:13, border:'1px solid var(--red)', background:'var(--red)', color:'#fff', borderRadius:8, cursor: cancelando || !cancelMotivo.trim() ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontWeight:700, opacity: cancelando || !cancelMotivo.trim() ? 0.5 : 1 }}
                  >
                    ✕ Cancelar mandato (no hay ofertas que actualizar)
                  </button>
                )}

                {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:10, fontSize:11, color:'#991b1b' }}>{saveError}</div>}
              </div>
              <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button onClick={() => { setShowCancelar(false); setCancelMotivo('') }} disabled={cancelando} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>Volver</button>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Header */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#4d4068,#9333ea)' }}></div>
              <div style={{ flex:1 }}>
                <div className="ah-ref">
                  <span style={{ background:'var(--purple-lt,#f3e8ff)', color:'var(--purple,#9333ea)', border:'1px solid var(--purple-bd,#d8b4fe)', padding:'0 5px', borderRadius:3, fontSize:9, fontWeight:700 }}>MANDATO</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{mandato.ref}</span>
                </div>
                <div className="ah-name">
                  <input style={{ ...inpFull, fontSize:18, fontWeight:700, padding:'4px 8px' }} value={form.titulo} onChange={e => setF('titulo', e.target.value)} placeholder="Título del mandato" />
                </div>
                <div className="ah-addr">
                  📍 {[cuenta?.direccion, cuenta?.codigo_postal, cuenta?.ciudad].filter(Boolean).join(', ') || 'Cuenta sin dirección'} · Creado: {fmtDate(mandato.created_at)} · {CURRENT_USER.nombre}
                </div>
                <div className="ah-tags">
                  <span className="tag" style={{ background:'var(--green-lt)', color:'var(--green)', border:'1px solid var(--green-bd)' }}>● {estadoUI}</span>
                  <span className="tag tag-blue">{TIPO_LABEL[form.tipo]}</span>
                  <span className="tag tag-purple">{form.exclusividad_modo === 'coexclusiva' ? 'Co-exclusiva' : 'Exclusiva'}</span>
                  {form.via && <span className="tag tag-gray">Vía {form.via}</span>}
                  {dr !== null && dr >= 0 && dr <= 60 && <span className="tag" style={{ background:'var(--amber-lt)', color:'var(--amber)', border:'1px solid var(--amber-bd)', fontWeight:700 }}>⏳ {dr}d</span>}
                </div>
              </div>
              <div style={{ flexShrink:0, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:1, background:'var(--border)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', fontSize:10, alignSelf:'flex-start' }}>
                {[
                  ['Estado',    estadoUI,                       estadoColor],
                  ['Activos',   activosLinked.length,           'var(--accent)'],
                  ['SBA total', sbaTotal ? `${sbaTotal.toLocaleString('es-ES')} m²` : '—', null],
                  ['Responsable', responsableUI,                'var(--accent)'],
                ].map(([lbl,val,col]) => (
                  <div key={lbl} style={{ background:'var(--surface)', padding:'6px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'var(--text4)' }}>{lbl}</div>
                    <div style={{ fontWeight:600, color:col || 'var(--text)' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="tabs">
            {MAN_TABS.map(([k, label]) => (
              <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</div>
            ))}
          </div>

          {/* TAB Información del mandato — agrupa todos los bloques */}
          {tab === 'man-info' && (() => {
            const equipo = Array.isArray(mandato.equipo_trabajo) ? mandato.equipo_trabajo : []
            const userIsPrincipal = isPrincipal(equipo, CURRENT_USER.nombre)
            const canManage = userIsPrincipal || equipo.length === 0
            const handlers = makeEquipoHandlers({
              supabase, table:'mandatos', idValue:mandato.id, equipo,
              onAfter: () => load(),
              onError: (msg) => setSaveError(msg),
            })
            const equipoInterno = equipo.filter(m => m.rol !== 'Colaborador')
            const colaboradores = equipo.filter(m => m.rol === 'Colaborador')
            const mapIdx = (filtered, idx) => equipo.indexOf(filtered[idx])

            // Activo para la banda canónica de Vinculaciones:
            // · 1 activo → lo mostramos clicable
            // · N activos → mostramos el contador (no clicable; el detalle vive en la card de abajo)
            let activoForVinc = null
            if (activosLinked.length === 1 && activosLinked[0].activos) {
              const a = activosLinked[0].activos
              activoForVinc = {
                ref:       a.ref,
                nombre:    a.nombre,
                direccion: a.ciudad,
                sub:       a.uso,
              }
            } else if (activosLinked.length > 1) {
              activoForVinc = {
                nombre: `${activosLinked.length} activos vinculados`,
                sub:    'Ver listado abajo',
              }
            }

            return (
              <div className="tab-content active"><div className="info-pad">

                {/* ── VINCULACIONES (canónico, siempre arriba) ── */}
                <Vinculaciones
                  cuenta={cuenta ? {
                    id:     cuenta.dynamics_id || cuenta.id,
                    nombre: cuenta.nombre,
                    sub:    cuenta.sector || cuenta.tipo,
                  } : null}
                  activo={activoForVinc}
                  oportunidad={oportunidad ? {
                    id:     oportunidad.dynamics_id || oportunidad.id,
                    nombre: oportunidad.nombre,
                    sub:    oportunidad.tipo,
                  } : null}
                />

                {/* ── EQUIPO DE TRABAJO + COLABORADORES (50/50 justo bajo Vinculaciones) ── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <EquipoTrabajoCard
                    title="Equipo de trabajo"
                    equipo={equipoInterno}
                    canManage={canManage}
                    onAdd={(nombre, equipoNombre, rol) => handlers.addMiembro(nombre, equipoNombre, rol === 'Colaborador' ? 'Soporte' : rol)}
                    onRemove={(idx) => handlers.removeMiembro(mapIdx(equipoInterno, idx))}
                    onUpdateRol={(idx, rol) => handlers.updateMiembroRol(mapIdx(equipoInterno, idx), rol)}
                  />
                  <EquipoTrabajoCard
                    title="Colaboradores"
                    equipo={colaboradores}
                    canManage={canManage}
                    onAdd={(nombre, equipoNombre) => handlers.addMiembro(nombre, equipoNombre, 'Colaborador')}
                    onRemove={(idx) => handlers.removeMiembro(mapIdx(colaboradores, idx))}
                    onUpdateRol={(idx, rol) => handlers.updateMiembroRol(mapIdx(colaboradores, idx), rol)}
                  />
                </div>

                {/* ─── FILA 1 (antes 2): Mandato | Vigencia y alertas ─── */}
                <div className="va-two-col">
                  <div className="va-meta-card" style={{ marginBottom:0 }}>
                    <div className="va-meta-head"><span className="dot"/>Mandato</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Tipo</span>
                        <span className="ir-v">
                          <select style={sel} value={form.tipo} onChange={e => setF('tipo', e.target.value)}>
                            {TIPO_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        </span>
                      </div>
                      <div className="ir"><span className="ir-k">Vía</span>
                        <span className="ir-v">
                          <select style={sel} value={form.via} onChange={e => setF('via', e.target.value)}>
                            {VIA_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        </span>
                      </div>
                      <div className="ir"><span className="ir-k">Estado</span>
                        <span className="ir-v">
                          <select style={sel} value={form.estado} onChange={e => setF('estado', e.target.value)}>
                            {ESTADO_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        </span>
                      </div>
                      {form.estado === 'cancelado' && (() => {
                        const motivoEsPredef = MOTIVOS_CANCELACION.includes(form.motivo_cancelacion)
                        const motivoEsOtro   = !!form.motivo_cancelacion && !motivoEsPredef
                        const sel_v          = motivoEsOtro ? 'Otro motivo' : (form.motivo_cancelacion || '')
                        const otroTexto      = motivoEsOtro ? form.motivo_cancelacion : ''
                        const sinMotivo      = !form.motivo_cancelacion.trim()
                        return (
                          <>
                            <div className="ir" style={{ alignItems:'flex-start' }}>
                              <span className="ir-k" style={{ color:'#dc2626', fontWeight:700 }}>Motivo cancelación *</span>
                              <span className="ir-v">
                                <select
                                  style={{ ...sel, borderColor: sinMotivo ? '#dc2626' : 'var(--border)' }}
                                  value={sel_v}
                                  onChange={e => {
                                    const v = e.target.value
                                    if (v === '') setF('motivo_cancelacion','')
                                    else if (v === 'Otro motivo') setF('motivo_cancelacion', otroTexto || ' ')
                                    else setF('motivo_cancelacion', v)
                                  }}
                                >
                                  <option value="">Selecciona un motivo...</option>
                                  {MOTIVOS_CANCELACION.map(m => <option key={m}>{m}</option>)}
                                </select>
                              </span>
                            </div>
                            {(sel_v === 'Otro motivo' || motivoEsOtro) && (
                              <div className="ir" style={{ alignItems:'flex-start' }}>
                                <span className="ir-k">Describe el motivo</span>
                                <span className="ir-v" style={{ flex:1 }}>
                                  <textarea
                                    style={{ ...ta, minHeight:50, borderColor: sinMotivo ? '#dc2626' : 'var(--border)' }}
                                    value={otroTexto}
                                    onChange={e => setF('motivo_cancelacion', e.target.value)}
                                    placeholder="Describe el motivo de la cancelación..."
                                  />
                                </span>
                              </div>
                            )}
                          </>
                        )
                      })()}
                      <div className="ir"><span className="ir-k">Departamento</span>
                        <span className="ir-v">
                          <select style={sel} value={form.departamento} onChange={e => setF('departamento', e.target.value)}>
                            <option value="">—</option>
                            {DEPARTAMENTOS.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </span>
                      </div>
                      <div className="ir"><span className="ir-k">Provincia</span>
                        <span className="ir-v">
                          <select style={sel} value={form.provincia} onChange={e => setF('provincia', e.target.value)}>
                            <option value="">—</option>
                            {PROVINCIAS.map(p => <option key={p}>{p}</option>)}
                          </select>
                        </span>
                      </div>
                      <div className="ir"><span className="ir-k">Zona</span>
                        <span className="ir-v"><input style={{ ...inp, width:140 }} value={form.zona} onChange={e => setF('zona', e.target.value)} placeholder="Zona / submercado" /></span>
                      </div>
                    </div>
                  </div>

                  <div className="va-meta-card" style={{ marginBottom:0 }}>
                    <div className="va-meta-head accent-purple"><span className="dot"/>Vigencia y alertas</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Fecha de firma</span>
                        <span className="ir-v"><input type="date" style={{ ...sel, width:150 }} value={form.fecha_firma || ''} onChange={e => setF('fecha_firma', e.target.value)} /></span>
                      </div>
                      <div className="ir"><span className="ir-k">Fecha de inicio</span>
                        <span className="ir-v"><input type="date" style={{ ...sel, width:150 }} value={form.fecha_inicio || ''} onChange={e => setF('fecha_inicio', e.target.value)} /></span>
                      </div>
                      <div className="ir"><span className="ir-k" style={{ fontWeight:700 }}>Vencimiento</span>
                        <span className="ir-v"><input type="date" style={{ ...sel, width:150 }} value={form.fecha_vencimiento || ''} onChange={e => setF('fecha_vencimiento', e.target.value)} /></span>
                      </div>
                      <div className="ir"><span className="ir-k">Días restantes</span>
                        <span className="ir-v">{dr === null ? '—' : (dr < 0 ? <span style={{ color:'var(--red)', fontWeight:700 }}>Vencido hace {Math.abs(dr)}d</span> : <span style={{ color: dr <= 30 ? 'var(--red)' : dr <= 60 ? 'var(--amber)' : 'var(--text)' }}>{dr} días</span>)}</span>
                      </div>
                      <div className="ir"><span className="ir-k">Preaviso (días)</span>
                        <span className="ir-v"><input type="number" style={{ ...inp, width:80 }} value={form.preaviso_dias} onChange={e => setF('preaviso_dias', e.target.value)} /></span>
                      </div>
                      <div className="ir"><span className="ir-k">Alertar X días antes</span>
                        <span className="ir-v"><input type="number" style={{ ...inp, width:80 }} value={form.alerta_dias} onChange={e => setF('alerta_dias', e.target.value)} /></span>
                      </div>
                      <div className="ir"><span className="ir-k">Prórroga tácita</span>
                        <span className="ir-v">
                          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11 }}>
                            <input type="checkbox" checked={form.prorroga_tacita} onChange={e => setF('prorroga_tacita', e.target.checked)} />
                            {form.prorroga_tacita ? 'Sí' : 'No'}
                          </label>
                        </span>
                      </div>
                      <div className="ir"><span className="ir-k">Meses de prórroga</span>
                        <span className="ir-v"><input type="number" style={{ ...inp, width:80 }} value={form.prorroga_meses} onChange={e => setF('prorroga_meses', e.target.value)} disabled={!form.prorroga_tacita} /></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Activos vinculados (multi · card full) ─── */}
                <div className="va-card" style={{ marginTop:14, marginBottom:0, overflow:'visible' }}>
                  <div className="va-card-header">
                    <h3><span className="ico"></span> Activos vinculados ({activosLinked.length})</h3>
                    {(form.tipo === 'alquiler' || form.tipo === 'venta') && activosLinked.length === 0 && (
                      <span className="hint" style={{ color:'#dc2626', fontWeight:700 }}>* Tipo {TIPO_LABEL[form.tipo]} requiere al menos 1 activo</span>
                    )}
                  </div>
                  <div style={{ padding:'4px 20px 16px' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {activosLinked.length === 0 && (
                        <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic', padding:'6px 0' }}>Sin activos vinculados</div>
                      )}
                      {activosLinked.map(l => l.activos && (
                        <div
                          key={l.id}
                          style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)', cursor:'pointer' }}
                          onClick={() => navigate('ficha-activo', { ref: l.activos.ref })}
                          title={`Abrir ficha del activo ${l.activos.ref}`}
                        >
                          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}></div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600 }}>{l.activos.nombre} <span style={{ marginLeft:6, fontFamily:'var(--mono)', color:'var(--text4)', fontSize:10, fontWeight:500 }}>{l.activos.ref}</span></div>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>
                              {[l.activos.ciudad, l.activos.uso, l.activos.sba ? `${Number(l.activos.sba).toLocaleString('es-ES')} m²` : null].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                          <input type="number" style={{ ...inp, width:80, fontSize:10 }} defaultValue={l.sba_asignada ?? ''}
                            onClick={e => e.stopPropagation()}
                            onBlur={e => updateSbaAsignada(l.id, e.target.value)} placeholder="SBA asig." title="SBA asignada" />
                          <button onClick={e => { e.stopPropagation(); removeActivo(l.id) }} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:11, padding:'2px 4px' }}>✕</button>
                        </div>
                      ))}
                    </div>
                    <select style={{ ...sel, width:'100%', marginTop:6 }} value="" onChange={e => { if (e.target.value) addActivo(e.target.value) }}>
                      <option value="">+ Añadir activo al mandato…</option>
                      {activosDisponibles.map(a => (
                        <option key={a.id} value={a.id}>{a.nombre} — {a.ciudad || ''} · {a.ref}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ─── Fees y honorarios (card full) ─── */}
                {(() => {
                  const reparto      = form.fee_reparto
                  const totalFeeEur  = Number(form.fee_eur_fijo) || 0
                  const sumPct       = reparto.reduce((s, r) => s + (Number(r.porcentaje) || 0), 0)
                  const restante     = 100 - sumPct
                  const sumOk        = sumPct === 100
                  const sinTotal     = totalFeeEur <= 0
                  const updateRow = (idx, key, val) => setF('fee_reparto', reparto.map((r,i) => i === idx ? { ...r, [key]: val } : r))
                  const addRow = () => setF('fee_reparto', [...reparto, { nombre:'', tipo:'interno', porcentaje:'' }])
                  const removeRow = idx => setF('fee_reparto', reparto.filter((_,i) => i !== idx))
                  const fmtEur = n => n ? n.toLocaleString('es-ES', { maximumFractionDigits:2 }) : '0'
                  return (
                    <div className="va-card" style={{ marginTop:14, marginBottom:0, overflow:'visible' }}>
                      <div className="va-card-header">
                        <h3><span className="ico" style={{ color:'var(--green)' }}>●</span> Fees y honorarios</h3>
                        {totalFeeEur > 0 && <span className="hint" style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--green)' }}>{fmtEur(totalFeeEur)} €</span>}
                      </div>
                      <div style={{ padding:'4px 18px 16px' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                          <div>
                            <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', marginBottom:3 }}>Total fee (€)</div>
                            <input type="number" step="100" value={form.fee_eur_fijo} onChange={e => setF('fee_eur_fijo', e.target.value)} placeholder="0"
                              style={{ width:'100%', padding:'6px 8px', fontSize:13, fontWeight:700, border:'1px solid var(--border)', borderRadius:5, fontFamily:'var(--mono)', textAlign:'right', color:'var(--green)' }} />
                          </div>
                          <div>
                            <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', marginBottom:3 }}>% s/ operación</div>
                            <input type="number" step="0.1" value={form.fee_porcentaje} onChange={e => setF('fee_porcentaje', e.target.value)} placeholder="—"
                              style={{ width:'100%', padding:'6px 8px', fontSize:13, fontWeight:600, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', textAlign:'right' }} />
                          </div>
                          <div>
                            <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', marginBottom:3 }}>Mín. garantizado</div>
                            <input type="number" value={form.fee_min_garantizado} onChange={e => setF('fee_min_garantizado', e.target.value)} placeholder="—"
                              style={{ width:'100%', padding:'6px 8px', fontSize:13, fontWeight:600, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', textAlign:'right' }} />
                          </div>
                        </div>

                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span>Reparto del fee</span>
                          {reparto.length > 0 && (
                            <span style={{ fontSize:10, fontWeight:700, textTransform:'none', color: sumOk ? 'var(--green)' : (sumPct > 100 ? 'var(--red)' : 'var(--amber)') }}>
                              {sumPct}% {sumOk ? '✓' : sumPct > 100 ? `· excede ${sumPct-100}%` : `· falta ${restante}%`}
                            </span>
                          )}
                        </div>
                        {sinTotal && reparto.length > 0 && (
                          <div style={{ padding:'6px 10px', background:'var(--amber-lt)', border:'1px solid var(--amber-bd)', borderRadius:4, fontSize:10, color:'var(--amber)', marginBottom:6 }}>
                            Introduce primero el importe total para calcular los € de cada línea.
                          </div>
                        )}
                        {reparto.length === 0 ? (
                          <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic', padding:'6px 0' }}>Sin reparto · 100% para el responsable del mandato.</div>
                        ) : (
                          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            {reparto.map((r, idx) => {
                              const pct = Number(r.porcentaje) || 0
                              const eur = (pct / 100) * totalFeeEur
                              const isInterno = (r.tipo || 'interno') === 'interno'
                              const miembrosDisp = isInterno ? (MIEMBROS_POR_EQUIPO[r.equipo] || []) : []
                              return (
                                <div key={idx} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 8px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                                  <select style={{ ...sel, width:90, fontSize:10 }} value={r.tipo || 'interno'}
                                    onChange={e => {
                                      const next = e.target.value
                                      setF('fee_reparto', reparto.map((row,i) => i === idx ? { ...row, tipo:next, ...(next === 'interno' ? { agencia_id:'', contacto:'', nombre:'' } : { equipo:'', miembro:'' }) } : row))
                                    }}>
                                    <option value="interno">Interno</option>
                                    <option value="externo">Externo</option>
                                  </select>
                                  {isInterno ? (
                                    <>
                                      <select style={{ ...sel, flex:1, fontSize:10, minWidth:0 }} value={r.equipo || ''}
                                        onChange={e => setF('fee_reparto', reparto.map((row,i) => i === idx ? { ...row, equipo:e.target.value, miembro:'' } : row))}>
                                        <option value="">Equipo...</option>
                                        {EQUIPOS_SAVILLS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                                      </select>
                                      <select style={{ ...sel, flex:1, fontSize:10, minWidth:0 }} value={r.miembro || ''}
                                        onChange={e => updateRow(idx, 'miembro', e.target.value)} disabled={!r.equipo}>
                                        <option value="">Miembro...</option>
                                        {miembrosDisp.map(m => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                    </>
                                  ) : (
                                    <select style={{ ...sel, flex:2, fontSize:10, minWidth:0 }} value={r.agencia_id || ''}
                                      onChange={e => {
                                        const cu = cuentasCatalog.find(c => c.dynamics_id === e.target.value)
                                        setF('fee_reparto', reparto.map((row,i) => i === idx ? { ...row, agencia_id:e.target.value, nombre: cu?.nombre || '' } : row))
                                      }}>
                                      <option value="">Agencia externa...</option>
                                      {cuentasCatalog.map(c => <option key={c.dynamics_id} value={c.dynamics_id}>{c.nombre}</option>)}
                                    </select>
                                  )}
                                  <input type="number" step="0.5" min="0" max="100" value={r.porcentaje ?? ''}
                                    onChange={e => updateRow(idx, 'porcentaje', e.target.value)} placeholder="0"
                                    style={{ width:50, padding:'4px 6px', fontSize:11, fontWeight:600, border:'1px solid var(--border)', borderRadius:4, fontFamily:'var(--mono)', textAlign:'right' }} />
                                  <span style={{ fontSize:10, fontWeight:700, color:'var(--text3)' }}>%</span>
                                  <span style={{ minWidth:70, textAlign:'right', fontFamily:'var(--mono)', fontSize:11, fontWeight:600, color: sinTotal ? 'var(--text4)' : 'var(--text)' }}>
                                    {sinTotal ? '—' : `${fmtEur(eur)} €`}
                                  </span>
                                  <button onClick={() => removeRow(idx)} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:12, padding:'2px 4px' }}>✕</button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        <button onClick={addRow} style={{ marginTop:8, padding:'5px 10px', fontSize:10, fontWeight:600, border:'1px dashed var(--accent)', color:'var(--accent)', background:'var(--accent-lt)', borderRadius:5, cursor:'pointer', fontFamily:'inherit' }}>
                          + Añadir colaborador
                        </button>
                      </div>
                    </div>
                  )
                })()}

                {/* ─── FILA 3: Exclusividad | Notas + Visión y novedades ─── */}
                <div className="va-two-col">
                  <div className="va-meta-card" style={{ marginBottom:0 }}>
                    <div className="va-meta-head"><span className="dot"/>Exclusividad</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k" style={{ fontWeight:700 }}>Modo</span>
                        <span className="ir-v">
                          <select style={sel} value={form.exclusividad_modo} onChange={e => setF('exclusividad_modo', e.target.value)}>
                            {EXCL_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        </span>
                      </div>
                      {form.exclusividad_modo === 'coexclusiva' && (
                        <>
                          <div className="ir"><span className="ir-k">Cuenta del agente</span>
                            <span className="ir-v">
                              <select style={{ ...sel, minWidth:200 }} value={form.cuenta_agente_id} onChange={e => { setF('cuenta_agente_id', e.target.value); setF('contacto_agente_id','') }}>
                                <option value="">Selecciona agencia…</option>
                                {cuentasCatalog.map(c => <option key={c.dynamics_id} value={c.dynamics_id}>{c.nombre}</option>)}
                              </select>
                            </span>
                          </div>
                          <div className="ir"><span className="ir-k">Contacto del agente</span>
                            <span className="ir-v">
                              <select style={{ ...sel, minWidth:200 }} value={form.contacto_agente_id} onChange={e => setF('contacto_agente_id', e.target.value)} disabled={!form.cuenta_agente_id}>
                                <option value="">Selecciona contacto…</option>
                                {contactosAgente.map(c => <option key={c.dynamics_id} value={c.dynamics_id}>{c.nombre} — {c.email || c.telefono || ''}</option>)}
                              </select>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico">▭</span> Notas y novedades</h3>
                    </div>
                    <div style={{ padding:'4px 20px 16px' }}>
                      <div className="rp-lbl">Notas internas</div>
                      <textarea style={{ ...ta, width:'100%', marginTop:3 }} value={form.notas} onChange={e => setF('notas', e.target.value)} placeholder="Notas internas sobre el mandato..." rows={3} />
                      <div className="rp-lbl" style={{ marginTop:12 }}>Visión y novedades</div>
                      <textarea style={{ ...ta, width:'100%', marginTop:3 }} value={form.vision_novedades || ''} onChange={e => setF('vision_novedades', e.target.value)} placeholder="Resumen ejecutivo, hitos y próximos pasos..." rows={3} />
                    </div>
                  </div>
                </div>

              </div></div>
            )
          })()}


          {tab === 'man-docs' && <StubTab label="Documentos del mandato" />}
          {tab === 'man-act'  && (
            <div className="tab-content active">
              <ActividadesPanel
                filter={{ column:'mandato_id', value: mandato.id }}
                title="Actividades vinculadas al mandato"
              />
            </div>
          )}
          {tab === 'man-conf' && (
            <ConfidencialidadPanel
              entityLabel="mandato"
              confidential={mandatoConfidential}
              onToggle={setMandatoConfidential}
              hiddenFields={['Cuenta','Activos vinculados','Fees y honorarios','Condiciones económicas','Documentación']}
              visibleFields={['Tipo de mandato','Estado del mandato','Equipo','Fecha de inicio','Información básica']}
              authorizedUsers={mandatoAuthUsers}
              onAddUser={(newUser) => {
                const [name, team] = [newUser.split('·')[0].trim(), newUser.split('·')[1]?.trim() || '']
                const ini = name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                const today = new Date().toLocaleDateString('es-ES')
                setMandatoAuthUsers(prev => [...prev, { name, team, role:'Autorizado', initials:ini, bg:'#f0fdf4', color:'#166534', granted:today }])
              }}
              onRemoveUser={(idx) => setMandatoAuthUsers(prev => prev.filter((_,j) => j !== idx))}
              responsable={CURRENT_USER.nombre}
            />
          )}

        </div>
      </div>
    </div>
  )
}
