import { useState, useEffect, useCallback } from 'react'
import { useNav, useUnsavedGuard } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER } from '../lib/currentUser'
import EquipoTrabajoCard, { makeEquipoHandlers, isPrincipal } from '../components/EquipoTrabajoCard'
import EquipoBloque from '../components/EquipoBloque'
import ActividadesPanel from '../components/ActividadesPanel'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'
import Vinculaciones from '../components/Vinculaciones'
import HeaderPills from '../components/HeaderPills'
import FunnelTracker from '../components/FunnelTracker'
import FunnelStepCards from '../components/FunnelStepCards'
import { cardTone } from '../lib/cardTones'
import { Building2, Target, ScrollText, Tag, FileSearch } from 'lucide-react'

// Mismo criterio que Demandas/Leads/Propuestas: Información general + Vista 360.
// "Documentos" y "Confidencialidad" dejan de ser tabs y viven como secciones
// al final de "Información general".
const MAN_TABS = [
  ['man-info', 'Información general'],
  ['man-act',  'Vista 360'],
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

// Campo vertical (label arriba + control debajo) para las dash-cards de detalle.
function DashField({ label, children }) {
  return (
    <div className="dash-field">
      <span className="dash-field-lbl">{label}</span>
      {children}
    </div>
  )
}

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
  // Modo edición · default vista. Pulsa "Editar" para activar inputs/selects.
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [showCierreVencido, setShowCierreVencido] = useState(false)
  const [cerrandoVencido, setCerrandoVencido] = useState(false)

  const [ofertasMandato, setOfertasMandato] = useState([])
  const [showCancelar, setShowCancelar] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [cancelMotivo, setCancelMotivo] = useState('')
  const [showNotasModal, setShowNotasModal] = useState(false)
  const [showFeesModal, setShowFeesModal] = useState(false)
  const [showActivosModal, setShowActivosModal] = useState(false)

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
        dynamics_opportunities:dynamics_opportunity_id ( dynamics_id, nombre, tipo ),
        propuestas:propuesta_id ( id, ref )
      `)
      .eq(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(refOrId || '')) ? 'id' : 'ref', refOrId)
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
    setEditing(false)  // tras guardar OK, vuelve a modo vista
    await load()
  }

  // Guard de cambios sin guardar (modo edición del mandato).
  useUnsavedGuard({ isDirty: () => editing, onSave: async () => { await saveEdit() } })

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
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}
      className={editing ? 'ficha-editing' : 'ficha-viewing'}>

      <div className="action-bar">
        {!editing ? (
          <button className="ab-btn save" onClick={() => setEditing(true)}>✎ Editar</button>
        ) : (
          <>
            <button className="ab-btn save" onClick={saveEdit} disabled={saving}>
              {saving ? 'Guardando…' : '💾 Guardar cambios'}
            </button>
            <button className="ab-btn" onClick={() => { setEditing(false); restablecer() }} disabled={saving}>Cancelar</button>
          </>
        )}
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

      {/* Modal Notas y novedades — accesible vía botón 📝 del action-bar */}
      {showNotasModal && (
        <div onClick={() => setShowNotasModal(false)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:10, width:'min(720px, 94vw)', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 50px rgba(15,23,42,0.25)' }}>
            <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>Notas y novedades</div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Notas internas + visión y novedades · {mandato.ref}</div>
              </div>
              <button onClick={() => setShowNotasModal(false)} style={{ background:'none', border:'none', fontSize:20, color:'var(--text4)', cursor:'pointer', padding:'4px 8px' }}>×</button>
            </div>
            <div style={{ padding:'20px 24px', display:'grid', gap:18 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>Notas internas</label>
                <textarea
                  value={form.notas}
                  onChange={e => setF('notas', e.target.value)}
                  placeholder="Notas internas sobre el mandato..."
                  rows={5}
                  style={{ width:'100%', padding:'10px 12px', fontSize:13, fontFamily:'inherit', border:'1px solid var(--border)', borderRadius:6, resize:'vertical', lineHeight:1.5 }}
                />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>Visión y novedades</label>
                <textarea
                  value={form.vision_novedades || ''}
                  onChange={e => setF('vision_novedades', e.target.value)}
                  placeholder="Resumen ejecutivo, hitos y próximos pasos..."
                  rows={5}
                  style={{ width:'100%', padding:'10px 12px', fontSize:13, fontFamily:'inherit', border:'1px solid var(--border)', borderRadius:6, resize:'vertical', lineHeight:1.5 }}
                />
              </div>
            </div>
            <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={() => setShowNotasModal(false)} style={{ padding:'8px 16px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>Cerrar</button>
              <button onClick={() => { saveEdit(); setShowNotasModal(false) }} disabled={saving} style={{ padding:'8px 16px', fontSize:12, border:'none', borderRadius:5, background:'var(--accent)', color:'#fff', cursor:'pointer', fontWeight:600 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Funnel tracker · hilo conductor entre fases */}
          <FunnelTracker steps={[
            { key:'opo',  label:'Oportunidad', ref: oportunidad?.dynamics_id || mandato.dynamics_opportunity_id || null,
              onClick: (oportunidad?.dynamics_id || mandato.dynamics_opportunity_id) ? () => navigate('ficha-oportunidad', { id: oportunidad?.dynamics_id || mandato.dynamics_opportunity_id }) : null },
            { key:'pry',  label:'Propuesta', ref: mandato.propuestas?.ref || null,
              onClick: mandato.propuestas?.ref ? () => navigate('ficha-propuesta', { id: mandato.propuestas.ref }) : null },
            { key:'man',  label:'Mandato', ref: mandato.ref, current: true, onClick: null },
          ]} />

          {/* Header rediseñado · identidad + chips dk (estilo Demanda/Lead/Propuesta) */}
          {(() => {
            const hasNotas = !!(form.notas?.trim() || form.vision_novedades?.trim())
            const notasCount = (form.notas?.trim() ? 1 : 0) + (form.vision_novedades?.trim() ? 1 : 0)
            const totalFee = Number(form.fee_eur_fijo) || 0
            const isCoex = form.exclusividad_modo === 'coexclusiva'
            const estadoPal = estadoColor === 'var(--green)' ? 'green' : estadoColor === 'var(--amber)' ? 'amber' : estadoColor === 'var(--red)' ? 'red' : 'default'
            // Cambiar exclusividad · al pasar a exclusiva limpia agente y lo quita de Colaboradores
            const cambiarExclusividad = async (nuevoModo) => {
              setF('exclusividad_modo', nuevoModo)
              if (nuevoModo === 'exclusiva' && mandato?.id) {
                setF('cuenta_agente_id','')
                setF('contacto_agente_id','')
                const eq = Array.isArray(mandato.equipo_trabajo) ? mandato.equipo_trabajo : []
                const limpio = eq.filter(m => m.equipo !== 'Agente externo')
                if (limpio.length !== eq.length) {
                  await supabase.from('mandatos').update({ equipo_trabajo: limpio }).eq('id', mandato.id)
                  load()
                }
              }
            }
            // Vincular cuenta del agente externo · sincroniza con Colaboradores
            const cambiarAgente = async (newId) => {
              setF('cuenta_agente_id', newId)
              setF('contacto_agente_id','')
              if (!mandato?.id) return
              const eq = Array.isArray(mandato.equipo_trabajo) ? mandato.equipo_trabajo : []
              const sinExterno = eq.filter(m => m.equipo !== 'Agente externo')
              let nuevoEquipo = sinExterno
              if (newId) {
                const cu = cuentasCatalog.find(c => c.dynamics_id === newId)
                if (cu) nuevoEquipo = [...sinExterno, { nombre: cu.nombre, equipo: 'Agente externo', rol: 'Colaborador' }]
              }
              await supabase.from('mandatos').update({
                equipo_trabajo: nuevoEquipo,
                cuenta_agente_id: newId || null,
                contacto_agente_id: null,
              }).eq('id', mandato.id)
              load()
            }
            return (
              <div className="dem-skin">
                <div className="dk-topbar">
                  <div className="dk-identity">
                    <div className="dk-avatar" style={{ background:'linear-gradient(135deg,#4d4068,#9333ea)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="dk-id-meta">
                        <span className="dk-tag">Mandato</span>
                        <span className="dk-ref">{mandato.ref}</span>
                        <span className="dk-dot">·</span><span>{TIPO_LABEL[form.tipo]}{form.via && ` · Vía ${form.via}`}</span>
                      </div>
                      <input style={{ ...inpFull, fontSize:24, fontWeight:700, padding:'2px 6px', margin:'2px 0' }} value={form.titulo} onChange={e => setF('titulo', e.target.value)} placeholder="Título del mandato" />
                      <div className="dk-addr">
                        <span style={{ color:'#d93025' }}>📍</span>
                        <span>{[cuenta?.direccion, cuenta?.codigo_postal, cuenta?.ciudad].filter(Boolean).join(', ') || 'Cuenta sin dirección'}</span>
                        <span className="dk-dot">·</span><span>Creado: {fmtDate(mandato.created_at)}</span>
                        <span className="dk-dot">·</span><strong>{responsableUI}</strong>
                      </div>
                    </div>
                  </div>
                  <HeaderPills variant="dk" items={[
                    { key:'estado', type:'info', label:'Estado', value: estadoUI, color: estadoPal, accent: estadoPal !== 'default' },
                    { key:'excl', type:'select', label:'Exclusividad', value: form.exclusividad_modo, color: isCoex ? 'purple' : 'accent', accent:true,
                      options:[{ value:'exclusiva', label:'Exclusiva' },{ value:'coexclusiva', label:'Co-exclusiva' }], onChange: cambiarExclusividad },
                    isCoex && { key:'agente', type:'select', label:'Agente externo', value: form.cuenta_agente_id, color:'purple', accent:true,
                      options:[{ value:'', label:'Vincular cuenta…' }, ...cuentasCatalog.map(c => ({ value:c.dynamics_id, label:c.nombre }))], onChange: cambiarAgente },
                    { key:'fees', type:'button', label:'Fees', value: totalFee > 0 ? `${totalFee.toLocaleString('es-ES')} €` : 'Sin fee', color: totalFee > 0 ? 'green' : 'default', accent: totalFee > 0, onClick: () => setShowFeesModal(true) },
                    { key:'notas', type:'button', label:'Notas', value: hasNotas ? `📝 ${notasCount}` : '—', color: hasNotas ? 'accent' : 'default', accent: hasNotas, onClick: () => setShowNotasModal(true) },
                    { key:'activos', type:'info', label:'Activos', value: `${activosLinked.length}${sbaTotal ? ` · ${(sbaTotal/1000).toFixed(1)}k m²` : ''}`, color:'accent', accent: activosLinked.length > 0 },
                    { key:'responsable', type:'info', label:'Responsable', value: responsableUI },
                    (dr !== null && dr >= 0 && dr <= 60) && { key:'dias', type:'info', label:'Días restantes', value:`⏳ ${dr}d`, color:'amber', accent:true },
                    { key:'conf', type:'info', label:'Confidencialidad', value: mandatoConfidential ? 'Confidencial' : 'No', color:'teal', accent: mandatoConfidential },
                  ]} />
                </div>
              </div>
            )
          })()}

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

                {/* ── VINCULACIONES (FunnelStepCards canon) ── */}
                {(() => {
                  const hasCuenta = !!cuenta
                  const hasOpo    = !!oportunidad
                  const hasActivo = activosLinked.length > 0
                  const hasInstr  = !!mandato.dynamics_instruction_id
                  return (
                    <FunnelStepCards steps={[
                      {
                        key:'cuenta', icon: Building2, tone: cardTone('Cuenta'),
                        label:'Cuenta', value: cuenta?.nombre || null,
                        sub: cuenta?.sector || cuenta?.tipo || null,
                        status: hasCuenta ? 'done' : 'current',
                        vacant: !hasCuenta,
                        openAction: hasCuenta ? { label:'Abrir cuenta', onClick: () => navigate('cuentas', { id: cuenta.dynamics_id || cuenta.id }) } : null,
                        dyn: true,
                      },
                      {
                        key:'oportunidad', icon: Target, tone: cardTone('Oportunidad'),
                        label:'Oportunidad', value: oportunidad?.nombre || null,
                        sub: oportunidad?.tipo || null,
                        status: hasOpo ? 'done' : 'current',
                        vacant: !hasOpo,
                        openAction: hasOpo ? { label:'Abrir oportunidad', onClick: () => navigate('ficha-oportunidad', { id: oportunidad.dynamics_id || oportunidad.id }) } : null,
                        dyn: true,
                      },
                      {
                        key:'instruccion', icon: FileSearch, tone: cardTone('Instrucción'),
                        label:'Instrucción', value: mandato.dynamics_instruction_id || null,
                        sub: hasInstr ? 'Instrucción de Dynamics vinculada.' : 'Se sincroniza con Dynamics al firmar.',
                        status: hasInstr ? 'done' : 'current',
                        vacant: !hasInstr,
                        dyn: true,
                      },
                      {
                        key:'activos', icon: Tag, tone: cardTone('Activo'),
                        label: activosLinked.length === 1 ? 'Activo' : 'Activos',
                        value: hasActivo ? `${activosLinked.length} ${activosLinked.length === 1 ? 'activo' : 'activos'}` : null,
                        sub: hasActivo
                          ? (sbaTotal ? `${(sbaTotal/1000).toFixed(1)}k m² · SBA total` : 'Pulsa para ver y gestionar')
                          : 'Vincula los activos del mandato.',
                        status: hasActivo ? 'done' : 'current',
                        vacant: !hasActivo,
                        // La gestión (lista + alta) vive en un modal → la card mantiene tamaño fijo
                        action: !hasActivo
                          ? { label:'+ Vincular activos', onClick: () => setShowActivosModal(true), primary: true }
                          : null,
                        openAction: hasActivo
                          ? { label:'Ver / gestionar', onClick: () => setShowActivosModal(true) }
                          : null,
                      },
                    ]} />
                  )
                })()}

                {/* ── DETALLE · todos los cuadros en una sola fila (estilo Demanda/Lead/Propuesta) ── */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:12, marginBottom:14, alignItems:'stretch' }}>

                  {/* Mandato */}
                  <div className="dash-card">
                    <div className="dash-card-head">Mandato</div>
                    <div style={{ padding:'12px 16px 16px', display:'flex', flexDirection:'column', gap:11 }}>
                      <DashField label="Tipo">
                        <select className="dash-field-input" value={form.tipo} onChange={e => setF('tipo', e.target.value)}>
                          {TIPO_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                        </select>
                      </DashField>
                      <DashField label="Vía">
                        <select className="dash-field-input" value={form.via} onChange={e => setF('via', e.target.value)}>
                          {VIA_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                        </select>
                      </DashField>
                      <DashField label="Estado">
                        <select className="dash-field-input" value={form.estado} onChange={e => setF('estado', e.target.value)}>
                          {ESTADO_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                        </select>
                      </DashField>
                      {form.estado === 'cancelado' && (() => {
                        const motivoEsPredef = MOTIVOS_CANCELACION.includes(form.motivo_cancelacion)
                        const motivoEsOtro   = !!form.motivo_cancelacion && !motivoEsPredef
                        const sel_v          = motivoEsOtro ? 'Otro motivo' : (form.motivo_cancelacion || '')
                        const otroTexto      = motivoEsOtro ? form.motivo_cancelacion : ''
                        const sinMotivo      = !form.motivo_cancelacion.trim()
                        return (
                          <>
                            <DashField label="Motivo cancelación *">
                              <select className="dash-field-input" style={{ borderColor: sinMotivo ? '#dc2626' : undefined }} value={sel_v}
                                onChange={e => {
                                  const v = e.target.value
                                  if (v === '') setF('motivo_cancelacion','')
                                  else if (v === 'Otro motivo') setF('motivo_cancelacion', otroTexto || ' ')
                                  else setF('motivo_cancelacion', v)
                                }}>
                                <option value="">Selecciona un motivo...</option>
                                {MOTIVOS_CANCELACION.map(m => <option key={m}>{m}</option>)}
                              </select>
                            </DashField>
                            {(sel_v === 'Otro motivo' || motivoEsOtro) && (
                              <DashField label="Describe el motivo">
                                <textarea className="dash-field-input" style={{ minHeight:60, resize:'vertical', borderColor: sinMotivo ? '#dc2626' : undefined }} value={otroTexto} onChange={e => setF('motivo_cancelacion', e.target.value)} placeholder="Describe el motivo de la cancelación…" />
                              </DashField>
                            )}
                          </>
                        )
                      })()}
                      <DashField label="Departamento">
                        <select className="dash-field-input" value={form.departamento} onChange={e => setF('departamento', e.target.value)}>
                          <option value="">—</option>
                          {DEPARTAMENTOS.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </DashField>
                      <DashField label="Provincia">
                        <select className="dash-field-input" value={form.provincia} onChange={e => setF('provincia', e.target.value)}>
                          <option value="">—</option>
                          {PROVINCIAS.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </DashField>
                      <DashField label="Zona">
                        <input className="dash-field-input" value={form.zona} onChange={e => setF('zona', e.target.value)} placeholder="Zona / submercado" />
                      </DashField>
                    </div>
                  </div>

                  {/* Vigencia y alertas */}
                  <div className="dash-card">
                    <div className="dash-card-head">Vigencia y alertas</div>
                    <div style={{ padding:'12px 16px 16px', display:'flex', flexDirection:'column', gap:11 }}>
                      <DashField label="Fecha de firma">
                        <input type="date" className="dash-field-input" value={form.fecha_firma || ''} onChange={e => setF('fecha_firma', e.target.value)} />
                      </DashField>
                      <DashField label="Fecha de inicio">
                        <input type="date" className="dash-field-input" value={form.fecha_inicio || ''} onChange={e => setF('fecha_inicio', e.target.value)} />
                      </DashField>
                      <DashField label="Vencimiento">
                        <input type="date" className="dash-field-input" value={form.fecha_vencimiento || ''} onChange={e => setF('fecha_vencimiento', e.target.value)} />
                      </DashField>
                      <DashField label="Días restantes">
                        <span style={{ fontSize:13, fontWeight:600 }}>{dr === null ? '—' : (dr < 0 ? <span style={{ color:'var(--red)', fontWeight:700 }}>Vencido hace {Math.abs(dr)}d</span> : <span style={{ color: dr <= 30 ? 'var(--red)' : dr <= 60 ? 'var(--amber)' : 'var(--text)' }}>{dr} días</span>)}</span>
                      </DashField>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <DashField label="Preaviso (días)">
                          <input type="number" className="dash-field-input" value={form.preaviso_dias} onChange={e => setF('preaviso_dias', e.target.value)} />
                        </DashField>
                        <DashField label="Alertar antes (días)">
                          <input type="number" className="dash-field-input" value={form.alerta_dias} onChange={e => setF('alerta_dias', e.target.value)} />
                        </DashField>
                      </div>
                      <DashField label="Prórroga tácita">
                        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600 }}>
                          <input type="checkbox" checked={form.prorroga_tacita} onChange={e => setF('prorroga_tacita', e.target.checked)} />
                          {form.prorroga_tacita ? 'Sí' : 'No'}
                        </label>
                      </DashField>
                      {form.prorroga_tacita && (
                        <DashField label="Meses de prórroga">
                          <input type="number" className="dash-field-input" value={form.prorroga_meses} onChange={e => setF('prorroga_meses', e.target.value)} />
                        </DashField>
                      )}
                    </div>
                  </div>

                  {/* Bloque unificado de personas · Empleados / Proveedores / Clientes con toggle Grupo/Tabla */}
                  <EquipoBloque
                    equipo={equipo}
                    canManage={canManage}
                    onAdd={handlers.addPersona}
                    onRemove={handlers.removeMiembro}
                    onRate={handlers.updateMiembroValoracion}
                  />

                </div>

                {/* ─── Modal · Activos vinculados (lista + alta) ─── */}
                {showActivosModal && (
                  <div onClick={() => setShowActivosModal(false)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:10, width:'min(720px, 96vw)', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 50px rgba(15,23,42,0.25)' }}>
                      <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                        <div>
                          <div style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>Activos vinculados ({activosLinked.length})</div>
                          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{mandato.ref} · Vincula activos y ajusta la SBA asignada</div>
                        </div>
                        <button onClick={() => setShowActivosModal(false)} style={{ background:'none', border:'none', fontSize:20, color:'var(--text4)', cursor:'pointer', padding:'4px 8px' }}>×</button>
                      </div>
                      <div style={{ flex:1, overflowY:'auto', padding:'14px 24px 18px' }}>
                        {(form.tipo === 'alquiler' || form.tipo === 'venta') && activosLinked.length === 0 && (
                          <div style={{ marginBottom:10, padding:'8px 10px', background:'var(--amber-lt)', border:'1px solid var(--amber-bd)', borderRadius:5, fontSize:11, color:'var(--amber)', fontWeight:700 }}>
                            * Tipo {TIPO_LABEL[form.tipo]} requiere al menos 1 activo
                          </div>
                        )}
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {activosLinked.length === 0 && (
                            <div style={{ fontSize:12, color:'var(--text4)', fontStyle:'italic', padding:'6px 0' }}>Sin activos vinculados</div>
                          )}
                          {activosLinked.map(l => l.activos && (
                            <div key={l.id}
                              style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)', cursor:'pointer' }}
                              onClick={() => navigate('ficha-activo', { ref: l.activos.ref })}
                              title={`Abrir ficha del activo ${l.activos.ref}`}>
                              <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}></div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, fontWeight:600 }}>{l.activos.nombre} <span style={{ marginLeft:6, fontFamily:'var(--mono)', color:'var(--text4)', fontSize:10, fontWeight:500 }}>{l.activos.ref}</span></div>
                                <div style={{ fontSize:10, color:'var(--text3)' }}>{[l.activos.ciudad, l.activos.uso, l.activos.sba ? `${Number(l.activos.sba).toLocaleString('es-ES')} m²` : null].filter(Boolean).join(' · ')}</div>
                              </div>
                              <input type="number" style={{ ...inp, width:90, fontSize:11 }} defaultValue={l.sba_asignada ?? ''}
                                onClick={e => e.stopPropagation()}
                                onBlur={e => updateSbaAsignada(l.id, e.target.value)} placeholder="SBA asig." title="SBA asignada" />
                              <button onClick={e => { e.stopPropagation(); removeActivo(l.id) }} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:13, padding:'2px 4px' }} title="Quitar activo">✕</button>
                            </div>
                          ))}
                        </div>
                        <select style={{ ...sel, width:'100%', marginTop:10 }} value="" onChange={e => { if (e.target.value) addActivo(e.target.value) }}>
                          <option value="">+ Añadir activo al mandato…</option>
                          {activosDisponibles.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre} — {a.ciudad || ''} · {a.ref}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', flexShrink:0 }}>
                        <button onClick={() => setShowActivosModal(false)} style={{ padding:'8px 16px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>Cerrar</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Agente externo (solo si co-exclusiva) — mini-fila compacta ─── */}
                {form.exclusividad_modo === 'coexclusiva' && (
                  <div style={{ marginTop:14, padding:'12px 16px', background:'var(--purple-lt)', border:'1px solid var(--purple-bd)', borderRadius:8, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, alignItems:'center' }}>
                    <div>
                      <div className="ir-k" style={{ fontSize:10.5, fontWeight:700, color:'var(--purple)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Cuenta del agente externo</div>
                      <select value={form.cuenta_agente_id} onChange={e => { setF('cuenta_agente_id', e.target.value); setF('contacto_agente_id','') }}
                        style={{ width:'100%', padding:'6px 10px', fontSize:13, fontWeight:500, border:'1px solid var(--purple-bd)', borderRadius:5, background:'#fff', fontFamily:'inherit' }}>
                        <option value="">Selecciona agencia…</option>
                        {cuentasCatalog.map(c => <option key={c.dynamics_id} value={c.dynamics_id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="ir-k" style={{ fontSize:10.5, fontWeight:700, color:'var(--purple)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Contacto del agente</div>
                      <select value={form.contacto_agente_id} onChange={e => setF('contacto_agente_id', e.target.value)} disabled={!form.cuenta_agente_id}
                        style={{ width:'100%', padding:'6px 10px', fontSize:13, fontWeight:500, border:'1px solid var(--purple-bd)', borderRadius:5, background: form.cuenta_agente_id ? '#fff' : 'var(--gray-lt)', fontFamily:'inherit' }}>
                        <option value="">Selecciona contacto…</option>
                        {contactosAgente.map(c => <option key={c.dynamics_id} value={c.dynamics_id}>{c.nombre} — {c.email || c.telefono || ''}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Notas y novedades vive ahora en el modal accesible vía botón del action-bar (📝 Notas) */}
                {/* Activos vinculados · ahora dentro de la card "Activos" del wizard (extraBody) */}

                {/* Modal Fees y honorarios — accesible vía pill 🏦 del header */}
                {showFeesModal && (
                  <div onClick={() => setShowFeesModal(false)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:10, width:'min(960px, 96vw)', maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 50px rgba(15,23,42,0.25)' }}>
                      <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                        <div>
                          <div style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>Fees y honorarios</div>
                          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{mandato.ref} · Importe total + reparto entre colaboradores</div>
                        </div>
                        <button onClick={() => setShowFeesModal(false)} style={{ background:'none', border:'none', fontSize:20, color:'var(--text4)', cursor:'pointer', padding:'4px 8px' }}>×</button>
                      </div>
                      <div style={{ flex:1, overflowY:'auto', padding:'4px 24px 18px' }}>
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
                      </div>
                      <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
                        <button onClick={() => setShowFeesModal(false)} style={{ padding:'8px 16px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>Cerrar</button>
                        <button onClick={() => { saveEdit(); setShowFeesModal(false) }} disabled={saving} style={{ padding:'8px 16px', fontSize:12, border:'none', borderRadius:5, background:'var(--accent)', color:'#fff', cursor:'pointer', fontWeight:600 }}>Guardar</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── DOCUMENTOS · sección dentro de Información general ── */}
                <div className="va-card" style={{ marginTop:14 }}>
                  <div className="va-card-header">
                    <h3><span className="ico">▤</span> Documentos del mandato</h3>
                    <button className="ab-btn blue">+ Subir documento</button>
                  </div>
                  <div style={{ padding:'12px 20px', fontSize:11, color:'var(--text4)' }}>
                    Próximamente: documentos del mandato (contrato firmado, anexos, KYC) con almacenamiento real.
                  </div>
                </div>

                {/* ── CONFIDENCIALIDAD · al final de Información general (mismo criterio que Demanda) ── */}
                <div style={{ marginTop:14 }}>
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
                </div>

              </div></div>
            )
          })()}

          {tab === 'man-act'  && (
            <div className="tab-content active">
              <ActividadesPanel
                filter={{ column:'mandato_id', value: mandato.id }}
                title="Actividades vinculadas al mandato"
              />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
