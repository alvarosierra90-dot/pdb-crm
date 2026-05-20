import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { LEAD_TIPOS, LEAD_ESTADOS, LEAD_PRIORIDADES, LEAD_CANALES } from '../data/mockLeads'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'
import TransformarLeadModal from '../components/TransformarLeadModal'
import LeadNuloModal from '../components/LeadNuloModal'
import EquipoTrabajoCard, { isPrincipal as _isPrincipal } from '../components/EquipoTrabajoCard'
import VinculacionesMaestra from '../components/VinculacionesMaestra'
import HeaderPills from '../components/HeaderPills'
import FunnelTracker from '../components/FunnelTracker'
import FunnelStepCards from '../components/FunnelStepCards'
import EditarContactoLeadModal from '../components/EditarContactoLeadModal'
import { Building2, User, Target, Lightbulb, ScrollText } from 'lucide-react'

// Lista de equipos para el dropdown legacy "Asignación → Equipo" del
// lead. El equipo de trabajo (Principal/Soporte/Colaborador) usa los
// equipos definidos en components/EquipoTrabajoCard.
const EQUIPOS = [
  'Leasing Oficinas Madrid',
  'Leasing Oficinas Barcelona',
  'Industrial & Logistics',
  'Retail',
  'Capital Markets',
  'Hotels',
  'Alternativos',
  'Advisory & Consultancy',
  'Valuations',
]

const inlineInp = {
  width:'100%', padding:'4px 7px', fontSize:11.5, border:'1px solid var(--border)',
  borderRadius:5, background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', boxSizing:'border-box', outline:'none',
}
const inlineTa = { ...inlineInp, padding:'6px 8px', resize:'vertical', minHeight:60, lineHeight:1.5 }

// Tabs canónicos · "Información general" + "Vista 360" (sustituye a Trazabilidad)
const TABS = [
  ['ld-info', 'Información general'],
  ['ld-360',  'Vista 360'],
]

function TipoTag({ tipo }) {
  const t = LEAD_TIPOS.find(x => x.key === tipo)
  if (!t) return null
  return <span className={`tag ${t.tagClass}`}>{t.label}</span>
}
function EstadoTag({ estado }) {
  const e = LEAD_ESTADOS.find(x => x.key === estado)
  if (!e) return null
  return <span className={`tag ${e.tagClass}`}>{e.label}</span>
}
function PrioridadTag({ prioridad }) {
  const p = LEAD_PRIORIDADES.find(x => x.key === prioridad)
  if (!p) return null
  return <span className={`tag ${p.tagClass}`}>{p.label}</span>
}

function fmtFecha(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function FichaLead() {
  const { navigate, params } = useNav()
  const [tab, setTab] = useState('ld-info')
  const [showTransformar, setShowTransformar] = useState(false)
  const [showNulo, setShowNulo] = useState(false)
  const [showEditarContacto, setShowEditarContacto] = useState(false)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const loadLead = useCallback(async () => {
    if (!params.id) return
    setLoading(true)
    // Carga el lead con relaciones Dynamics (siempre disponibles).
    // Las relaciones a propuestas/demandas/ofertas se intentan después
    // y se ignoran si la migración 013 aún no se aplicó.
    const baseSelect = `
      *,
      dynamics_accounts:dynamics_account_id     ( dynamics_id, nombre ),
      dynamics_contacts:dynamics_contact_id     ( dynamics_id, nombre, email ),
      dynamics_opportunities:dynamics_opportunity_id ( dynamics_id, nombre, tipo )
    `
    const { data, error } = await supabase
      .from('leads')
      .select(baseSelect)
      .eq('ref', params.id)
      .maybeSingle()

    if (error) {
      setError(error.message)
      setLead(null)
      setLoading(false)
      return
    }
    if (!data) {
      setError('Lead no encontrado')
      setLead(null)
      setLoading(false)
      return
    }

    // Carga opcional de propuesta/demanda/oferta + mandato derivados del lead
    const enriched = { ...data }
    if (data.propuesta_id) {
      const { data: p } = await supabase.from('propuestas').select('id, ref, nombre, estado').eq('id', data.propuesta_id).maybeSingle()
      if (p) enriched.propuestas = p
    }
    if (data.demanda_id) {
      const { data: d } = await supabase.from('demandas').select('id, ref, nombre, estatus, mandato_id').eq('id', data.demanda_id).maybeSingle()
      if (d) enriched.demandas = d
    }
    if (data.oferta_id) {
      const { data: o } = await supabase.from('ofertas').select('id, ref, mandato_id').eq('id', data.oferta_id).maybeSingle()
      if (o) enriched.ofertas = o
    }

    // Mandato vinculado: por la propuesta (pitch) o por la oportunidad (directo)
    let mandatoRow = null
    if (enriched.propuestas?.id) {
      const { data: m } = await supabase.from('mandatos').select('id, ref, tipo, estado, exclusividad_modo').eq('propuesta_id', enriched.propuestas.id).maybeSingle()
      if (m) mandatoRow = m
    }
    if (!mandatoRow && data.dynamics_opportunity_id) {
      const { data: m } = await supabase.from('mandatos').select('id, ref, tipo, estado, exclusividad_modo').eq('dynamics_opportunity_id', data.dynamics_opportunity_id).maybeSingle()
      if (m) mandatoRow = m
    }
    if (mandatoRow) {
      enriched.mandato = mandatoRow
      // Ofertas/demandas creadas en cascada al ganar la propuesta
      const [{ data: ofs = [] }, { data: dms = [] }] = await Promise.all([
        supabase.from('ofertas').select('id, ref').eq('mandato_id', mandatoRow.id),
        supabase.from('demandas').select('id, ref').eq('mandato_id', mandatoRow.id),
      ])
      enriched.ofertas_cascada  = ofs || []
      enriched.demandas_cascada = dms || []
    }

    setLead(enriched)
    setError(null)
    setLoading(false)
  }, [params.id])

  useEffect(() => { loadLead() }, [loadLead])

  if (loading) {
    return <div style={{ padding:32, color:'var(--text4)', fontSize:12 }}>Cargando…</div>
  }
  if (error || !lead) {
    return (
      <div style={{ padding:32 }}>
        <div style={{ fontSize:13, color:'#991b1b', marginBottom:12 }}>{error || 'Lead no encontrado'}</div>
        <button className="ab-btn" onClick={() => navigate('leads')}>← Volver a Leads</button>
      </div>
    )
  }

  const cuentaNombre   = lead.dynamics_accounts?.nombre   || null
  const contactoNombre = lead.dynamics_contacts?.nombre   || null
  const oportunidadId  = lead.dynamics_opportunities?.dynamics_id || null
  const oportunidadNombre = lead.dynamics_opportunities?.nombre || null

  const equipoTrabajo = Array.isArray(lead.equipo_trabajo) ? lead.equipo_trabajo : []
  // Spec: solo Principales pueden añadir/quitar miembros y editar la ficha.
  // Si aún no hay equipo de trabajo (lead recién capturado), permitimos
  // edición al usuario actual o al responsable legacy.
  const userIsPrincipal = _isPrincipal(equipoTrabajo, CURRENT_USER.nombre)
  const cerrado  = lead.estado === 'cualificado' || lead.estado === 'no_cualificado'
  const canEdit  = userIsPrincipal || (equipoTrabajo.length === 0 && (esResponsable(lead) || !lead.responsable))
  const canManageTeam = userIsPrincipal || equipoTrabajo.length === 0

  const startEdit = () => {
    setForm({
      nombre:               lead.nombre               || '',
      contacto_nombre:      lead.contacto_nombre      || '',
      contacto_apellidos:   lead.contacto_apellidos   || '',
      prioridad:            lead.prioridad            || '',
      equipo:               lead.equipo               || '',
      responsable:          lead.responsable          || '',
      descripcion:          lead.descripcion          || '',
      notas_cualificacion:  lead.notas_cualificacion  || '',
      email:                lead.email                || '',
      telefono:             lead.telefono             || '',
      origen_canal:         lead.origen_canal         || '',
      origen_campana:       lead.origen_campana       || '',
      origen_anuncio:       lead.origen_anuncio       || '',
      origen_url:           lead.origen_url           || '',
    })
    setSaveError(null)
    setEditing(true)
  }

  const cancelEdit = () => { setEditing(false); setSaveError(null) }

  const saveEdit = async () => {
    if (!form.nombre.trim()) {
      setSaveError('El nombre del lead no puede estar vacío')
      return
    }
    setSaving(true)
    const payload = {
      nombre:              form.nombre.trim(),
      contacto_nombre:     form.contacto_nombre?.trim() || null,
      contacto_apellidos:  form.contacto_apellidos?.trim() || null,
      prioridad:           form.prioridad || null,
      equipo:              form.equipo || null,
      responsable:         form.responsable || null,
      descripcion:         form.descripcion || null,
      notas_cualificacion: form.notas_cualificacion || null,
      email:               form.email || null,
      telefono:            form.telefono || null,
      origen_canal:        form.origen_canal || null,
      origen_campana:      form.origen_campana || null,
      origen_anuncio:      form.origen_anuncio || null,
      origen_url:          form.origen_url || null,
      ultima_actividad:    new Date().toISOString(),
    }
    const { error } = await supabase.from('leads').update(payload).eq('id', lead.id)
    setSaving(false)
    if (error) {
      setSaveError(`Error: ${error.message}`)
      return
    }
    setEditing(false)
    await loadLead()
  }

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // ====== Gestión de equipo de trabajo ======
  const persistEquipo = async (nuevoEquipo) => {
    // Derivar responsable + equipo legacy del primer Principal para que
    // las vistas que aún leen de esos campos sigan mostrando algo.
    const firstPrincipal = nuevoEquipo.find(m => m.rol === 'Principal')
    const payload = {
      equipo_trabajo: nuevoEquipo,
      responsable: firstPrincipal?.nombre || null,
      equipo:      firstPrincipal?.equipo || null,
      ultima_actividad: new Date().toISOString(),
    }
    const { error } = await supabase.from('leads').update(payload).eq('id', lead.id)
    if (error) {
      setSaveError(`Error guardando equipo: ${error.message}`)
      return
    }
    setSaveError(null)
    await loadLead()
  }
  const addMiembro = (nombre, equipo, rol) => {
    if (!nombre || !equipo || !rol) return
    const ya = equipoTrabajo.some(m => m.nombre === nombre && m.equipo === equipo)
    if (ya) { setSaveError(`${nombre} ya está en el equipo de trabajo.`); return }
    persistEquipo([...equipoTrabajo, { nombre, equipo, rol }])
  }
  const removeMiembro = (idx) => {
    persistEquipo(equipoTrabajo.filter((_, i) => i !== idx))
  }
  const updateMiembroRol = (idx, rol) => {
    persistEquipo(equipoTrabajo.map((m, i) => i === idx ? { ...m, rol } : m))
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      {/* Action bar */}
      <div className="action-bar">
        {editing ? (
          <>
            <button className="ab-btn save" onClick={saveEdit} disabled={saving}>
              {saving ? 'Guardando…' : '💾 Guardar cambios'}
            </button>
            <button className="ab-btn" onClick={cancelEdit} disabled={saving}>Cancelar</button>
          </>
        ) : (
          <>
            {canEdit ? (
              <button className="ab-btn save" onClick={startEdit}>✎ Editar</button>
            ) : (
              <button className="ab-btn" disabled style={{ opacity:0.55, cursor:'not-allowed' }} title={`Solo el responsable (${lead.responsable || 'sin asignar'}) puede editar`}>
                Solo lectura
              </button>
            )}
            <button className="ab-btn" onClick={() => navigate('leads')}>← Volver</button>
            <div className="ab-sep"/>
            {/* "Transformar" vive ahora como CTA en la card Oportunidad (paso actual del funnel). */}
            <button
              className="ab-btn"
              style={{ background:'#dc2626', color:'#fff', border:'none', fontWeight:700, opacity: cerrado ? 0.5 : 1, cursor: cerrado ? 'not-allowed' : 'pointer' }}
              disabled={cerrado}
              onClick={() => !cerrado && setShowNulo(true)}
            >
              ✗ Lead Nulo
            </button>
            <div className="ab-sep"/>
            <button className="ab-btn">✅ Asignar tarea</button>
            <button className="ab-btn">Registrar llamada</button>
          </>
        )}
        {saveError && <span style={{ marginLeft:12, fontSize:11, color:'#991b1b', fontWeight:600 }}>{saveError}</span>}
        {!editing && !canEdit && (
          <span style={{ marginLeft:12, fontSize:10, color:'var(--text4)' }}>
            Editas si el responsable eres tú ({CURRENT_USER.nombre}). Actual: {lead.responsable || '—'}
          </span>
        )}
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Funnel tracker · hilo conductor entre fases */}
          <FunnelTracker steps={[
            { key:'lead', label:'Lead', ref: lead.ref, current: true, onClick: null },
            { key:'opo',  label:'Oportunidad', ref: lead.dynamics_opportunity_id || null,
              onClick: lead.dynamics_opportunity_id ? () => navigate('ficha-oportunidad', { id: lead.dynamics_opportunity_id }) : null },
            { key:'pry',  label:'Propuesta', ref: lead.propuesta_ref || null,
              onClick: lead.propuesta_ref ? () => navigate('ficha-propuesta', { id: lead.propuesta_ref }) : null },
            { key:'man',  label:'Mandato', ref: lead.mandato_ref || null,
              onClick: lead.mandato_ref ? () => navigate('ficha-mandato', { ref: lead.mandato_ref }) : null },
          ]} />

          {/* Header con pills interactivos (popover editable) · canon unificado */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:50, height:50, borderRadius:10, background:'#fef3c7', border:'1px solid #fde68a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>

              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="ah-ref">
                  <span style={{ background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a', padding:'0 6px', borderRadius:3, fontSize:9, fontWeight:700 }}>LEAD</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{lead.ref}</span>
                </div>
                <div className="ah-name">{lead.nombre}</div>
              </div>
              {(() => {
                const tipo      = LEAD_TIPOS.find(x => x.key === lead.tipo)
                const estado    = LEAD_ESTADOS.find(x => x.key === lead.estado)
                const prioridad = LEAD_PRIORIDADES.find(x => x.key === lead.prioridad)
                const estadoColor = lead.estado === 'cualificado' ? 'green'
                  : lead.estado === 'no_cualificado' ? 'red'
                  : lead.estado === 'en_cualificacion' ? 'amber'
                  : lead.estado === 'nuevo' ? 'blue' : 'default'
                const tipoColor      = lead.tipo === 'demanda' ? 'purple' : lead.tipo === 'oferta' ? 'green' : lead.tipo === 'generico' ? 'amber' : 'default'
                const prioridadColor = lead.prioridad === 'alta' ? 'red' : lead.prioridad === 'media' ? 'amber' : 'default'
                // Helper para guardar un campo individual en supabase.leads y recargar
                const saveField = async (col, val) => {
                  const { error: e } = await supabase.from('leads').update({ [col]: val }).eq('id', lead.id)
                  if (e) throw e
                  loadLead()
                }
                const fechaEntrada = lead.created_at ? new Date(lead.created_at) : null
                const fechaEntradaStr = fechaEntrada ? fechaEntrada.toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—'
                const horaEntradaStr  = fechaEntrada ? fechaEntrada.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' }) : '—'
                return (
                  <HeaderPills items={[
                    { key:'estado', type:'popover', label:'Estado', value: estado?.label || null, color: estadoColor, accent: !!estado,
                      popover: { type:'select', options: LEAD_ESTADOS.map(x => ({ value:x.key, label:x.label })), onSave: v => saveField('estado', v) } },
                    { key:'prioridad', type:'popover', label:'Prioridad', value: prioridad?.label || null, color: prioridadColor, accent: lead.prioridad === 'alta' || lead.prioridad === 'media',
                      popover: { type:'select', options: LEAD_PRIORIDADES.map(x => ({ value:x.key, label:x.label })), onSave: v => saveField('prioridad', v) } },
                    { key:'tipo', type:'info', label:'Tipo', value: tipo?.label || '—', color: tipoColor, accent: !!tipo, title:'Definido al crear el lead' },
                    { key:'canal', type:'popover', label:'Origen', value: lead.origen_canal || lead.fuente || null,
                      popover: { type:'select', options: LEAD_CANALES.map(c => ({ value:c, label:c })), onSave: v => saveField('origen_canal', v) } },
                    { key:'equipo', type:'popover', label:'Equipo', value: lead.equipo || null,
                      popover: { type:'select', options: EQUIPOS.map(eq => ({ value:eq, label:eq })), onSave: v => saveField('equipo', v) } },
                    { key:'resp', type:'popover', label:'Responsable', value: lead.responsable || null,
                      popover: { type:'text', placeholder:'Nombre del broker', onSave: v => saveField('responsable', v) } },
                    { key:'fecha', type:'info', label:'Entrada', value: fechaEntradaStr, title: fechaEntrada ? fechaEntrada.toLocaleString('es-ES') : null },
                    { key:'hora',  type:'info', label:'Hora',    value: horaEntradaStr },
                    cuentaNombre && { key:'cuenta', type:'info', label:'Cuenta', value: cuentaNombre, color:'blue', accent:true },
                    oportunidadId && { key:'oportunidad', type:'info', label:'Oportunidad', value: oportunidadNombre || oportunidadId, color:'teal', accent:true },
                  ]} />
                )
              })()}
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {TABS.map(([k, label]) => (
              <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</div>
            ))}
          </div>

          {/* Tab content — flex:1 + overflowY:auto para permitir scroll vertical */}
          <div className="info-pad" style={{ flex:1, overflowY:'auto', minHeight:0 }}>

            {tab === 'ld-info' && (
              <>
                {/* ── FUNNEL STEP CARDS · cada vinculación es un paso con su CTA ── */}
                {(() => {
                  const hasContacto    = !!(lead.contacto_nombre || lead.contacto_apellidos)
                  const hasCuenta      = !!lead.dynamics_account_id
                  const hasOportunidad = !!lead.dynamics_opportunity_id
                  const hasPropuesta   = !!(lead.propuesta_ref || lead.propuesta_id)
                  const hasOfertaDir   = !!lead.oferta_id            // rama directa
                  const hasDemandaDir  = !!lead.demanda_id           // rama directa
                  const hasMandato     = !!lead.mandato?.ref
                  const ofertasCasc    = lead.ofertas_cascada  || []
                  const demandasCasc   = lead.demandas_cascada || []
                  const hasOfertasCasc = ofertasCasc.length > 0
                  const hasDemandasCasc= demandasCasc.length > 0

                  const ofertaRef      = lead.ofertas?.ref || null
                  const demandaRef     = lead.demandas?.ref || null
                  const propuestaRef   = lead.propuesta_ref || lead.propuestas?.ref || null
                  const cerradoLocal   = lead.estado === 'no_cualificado'

                  // El wizard muestra TODAS las cards del funnel siempre, incluso
                  // las que no aplican a esta rama (gris locked) — el broker ve el
                  // proceso completo de un vistazo y entiende dónde está.
                  //
                  //  Contacto → Cuenta → Oportunidad → Propuesta? → Mandato → Oferta/Demanda
                  //
                  // Aplicabilidad según rama (via + tipo):
                  //  · pitch_*           : Propuesta sí · destino final = Oferta(s) o Demanda según tipo
                  //  · directo_oferta    : Propuesta NO (locked) · destino final = Oferta
                  //  · directo_demanda   : Propuesta NO (locked) · destino final = Demanda
                  //  · directo_generico  : Propuesta NO · ningún destino comercial
                  const esPitch    = lead.via === 'pitch'
                  const esDirecto  = lead.via === 'directo'
                  // El destino comercial final (Oferta o Demanda) depende solo del tipo
                  const destinoFinal = lead.tipo === 'oferta' ? 'oferta'
                    : lead.tipo === 'demanda' ? 'demanda' : null  // generico no tiene destino comercial
                  // Done del destino final: en rama directa viene del lead.oferta_id/demanda_id;
                  // en rama pitch viene de la cascada (ofertas_cascada / demandas_cascada del mandato).
                  const destinoDone = destinoFinal === 'oferta'
                    ? (hasOfertaDir || hasOfertasCasc)
                    : destinoFinal === 'demanda'
                    ? (hasDemandaDir || hasDemandasCasc)
                    : false

                  // Contacto del lead se rellena editando arriba (campos obligatorios).
                  // Por eso aquí su CTA es "completar contacto" → activar editing.
                  const contactoStatus = hasContacto ? 'done' : 'current'

                  // Cuenta y Contacto Dynamics → se vinculan al TRANSFORMAR
                  // (el modal te pide ambos). Mientras no haya contacto, ambos locked.
                  const cuentaStatus = hasCuenta ? 'done'
                    : hasContacto ? 'current' : 'locked'

                  // Oportunidad · current cuando hay contacto pero aún no transformado.
                  // Si ya transformado → done. Sin contacto → locked.
                  const oportunidadStatus = hasOportunidad ? 'done'
                    : hasContacto ? 'current' : 'locked'

                  // Status por card del funnel:
                  // Propuesta: solo aplica via pitch
                  const propuestaStatus = hasPropuesta ? 'done'
                    : (hasOportunidad && esPitch) ? 'current'
                    : 'locked'
                  // Mandato: para pitch → al "Marcar ganada" en propuesta. Para directo
                  // → no aplica directamente desde Lead (se crea en otra ruta).
                  const mandatoStatus = hasMandato ? 'done'
                    : (hasPropuesta && esPitch) ? 'current'
                    : 'locked'
                  // Destino comercial (Oferta/Demanda): done si ya creado por cualquier rama
                  const destinoStatus = destinoDone ? 'done'
                    : (esDirecto && hasOportunidad) ? 'current'        // directo: se crea al transformar
                    : (esPitch && hasMandato)         ? 'current'      // pitch: se creó con ganar propuesta
                    : 'locked'

                  // Construyo los steps primero y luego inyecto editAction +
                  // nextAction post-hoc para que cada step DONE pueda saltar
                  // a la acción de la siguiente card CURRENT (wizard).
                  const baseSteps = [
                    {
                      key:'contacto',
                      icon: User,
                      tone:'blue',
                      label:'Contacto del lead',
                      value: [lead.contacto_nombre, lead.contacto_apellidos].filter(Boolean).join(' ') || null,
                      sub: lead.email || lead.telefono || null,
                      status: contactoStatus,
                      action: contactoStatus === 'current'
                        ? { label:'✎ Completar contacto', onClick: () => setShowEditarContacto(true), primary: true }
                        : null,
                      editTarget: () => setShowEditarContacto(true),
                      lockedHint: null,
                    },
                    {
                      key:'cuenta',
                      icon: Building2,
                      tone:'green',
                      label:'Cuenta (Dynamics)',
                      value: lead.cuenta_nombre || null,
                      sub: lead.cuenta_sector || null,
                      status: cuentaStatus,
                      action: cuentaStatus === 'current'
                        ? { label:'⚡ Transformar y vincular cuenta', onClick: () => !cerradoLocal && setShowTransformar(true), primary: true }
                        : null,
                      editTarget: () => !cerradoLocal && setShowTransformar(true),
                      openTarget: hasCuenta ? () => navigate('cuentas', { id: lead.dynamics_account_id }) : null,
                      lockedHint:'Completa antes el contacto del lead.',
                      dyn: true,
                    },
                    {
                      key:'oportunidad',
                      icon: Target,
                      tone:'accent',
                      label:'Oportunidad (Dynamics)',
                      value: oportunidadNombre || lead.dynamics_opportunity_id || null,
                      sub: lead.via ? `Vía ${lead.via}` : null,
                      status: oportunidadStatus,
                      action: oportunidadStatus === 'current'
                        ? { label:'⚡ Transformar lead', onClick: () => !cerradoLocal && setShowTransformar(true), primary: true }
                        : null,
                      editTarget: () => !cerradoLocal && setShowTransformar(true),
                      openTarget: hasOportunidad ? () => navigate('ficha-oportunidad', { id: lead.dynamics_opportunity_id }) : null,
                      lockedHint:'Completa antes el contacto del lead.',
                      dyn: true,
                    },
                    // Propuesta · solo aplica vía pitch
                    {
                      key:'propuesta',
                      icon: Lightbulb,
                      tone:'amber',
                      label:'Propuesta',
                      value: propuestaRef,
                      sub: hasPropuesta ? 'Completa el proyecto desde la ficha de propuesta.' : null,
                      status: propuestaStatus,
                      action: propuestaStatus === 'current'
                        ? { label:'Ir a generar propuesta', onClick: () => propuestaRef ? navigate('ficha-propuesta', { id: propuestaRef }) : navigate('propuestas'), primary: false }
                        : null,
                      editTarget: null,
                      openTarget: hasPropuesta && propuestaRef ? () => navigate('ficha-propuesta', { id: propuestaRef }) : null,
                      lockedHint: !hasOportunidad
                        ? 'Transforma el lead primero.'
                        : !esPitch
                          ? 'Solo aplica vía Pitch. Tu rama es directa.'
                          : 'En proceso.',
                    },
                    // Mandato · creado al marcar la Propuesta como ganada
                    {
                      key:'mandato',
                      icon: ScrollText,
                      tone:'accent',
                      label:'Mandato',
                      value: lead.mandato?.ref || null,
                      sub: hasMandato ? `${lead.mandato.tipo || 'mandato'} · ${lead.mandato.exclusividad_modo || 'exclusiva'}` : null,
                      status: mandatoStatus,
                      action: mandatoStatus === 'current' && propuestaRef
                        ? { label:'Marcar propuesta como ganada', onClick: () => navigate('ficha-propuesta', { id: propuestaRef }), primary: true }
                        : null,
                      openTarget: hasMandato ? () => navigate('ficha-mandato', { ref: lead.mandato.ref }) : null,
                      lockedHint: !hasPropuesta
                        ? 'Se crea al ganar la propuesta.'
                        : 'En proceso.',
                    },
                    // Destino comercial final (Oferta o Demanda según tipo)
                    destinoFinal && (() => {
                      const meta = destinoFinal === 'oferta' ? {
                        icon: Building2, tone:'green', label:'Oferta',
                        value: hasOfertasCasc
                          ? `${ofertasCasc.length} ${ofertasCasc.length === 1 ? 'oferta' : 'ofertas'}`
                          : ofertaRef,
                        sub: hasOfertasCasc
                          ? ofertasCasc.map(o => o.ref).join(' · ')
                          : hasOfertaDir
                            ? 'Completa stacking, fotos, condiciones desde la ficha.'
                            : null,
                        openTarget: hasOfertaDir && ofertaRef
                          ? () => navigate('ficha-oferta', { ofertaRef })
                          : hasOfertasCasc
                            ? () => navigate('ficha-oferta', { ofertaRef: ofertasCasc[0].ref })
                            : null,
                      } : {
                        icon: Target, tone:'purple', label:'Demanda',
                        value: hasDemandasCasc
                          ? demandasCasc[0].ref
                          : demandaRef,
                        sub: hasDemandasCasc || hasDemandaDir
                          ? 'Completa requisitos y arranca el matching desde la ficha.'
                          : null,
                        openTarget: hasDemandaDir && demandaRef
                          ? () => navigate('ficha-demanda', { id: demandaRef })
                          : hasDemandasCasc
                            ? () => navigate('ficha-demanda', { id: demandasCasc[0].ref })
                            : null,
                      }
                      return {
                        key:'destino',
                        icon: meta.icon,
                        tone: meta.tone,
                        label: meta.label,
                        value: meta.value,
                        sub:   meta.sub,
                        status: destinoStatus,
                        action: destinoStatus === 'current' && esDirecto
                          ? { label: `Transformar como ${meta.label} directa`, onClick: () => !cerradoLocal && setShowTransformar(true), primary: true }
                          : null,
                        openTarget: meta.openTarget,
                        lockedHint: !hasOportunidad
                          ? 'Transforma el lead primero.'
                          : (esPitch && !hasMandato)
                            ? `Se crea al ganar la propuesta (1 ${meta.label.toLowerCase()} por activo si es pitch_oferta).`
                            : 'En proceso.',
                      }
                    })(),
                  ].filter(Boolean)
                  // Calcular nextAction: del primer paso DONE en adelante, busca
                  // el primer paso CURRENT a su derecha y reusa su action.
                  const findNextCurrentAction = (idx) => {
                    for (let i = idx + 1; i < baseSteps.length; i++) {
                      if (baseSteps[i].status === 'current' && baseSteps[i].action) {
                        return { label: baseSteps[i].action.label.replace(/^[⚡✎]\s*/, ''), onClick: baseSteps[i].action.onClick }
                      }
                    }
                    return null
                  }
                  const finalSteps = baseSteps.map((s, i) => ({
                    ...s,
                    editAction: s.status === 'done' && s.editTarget ? { label:'Editar', onClick: s.editTarget } : null,
                    openAction: s.status === 'done' && s.openTarget ? { label:'Abrir ficha', onClick: s.openTarget } : null,
                    nextAction: s.status === 'done' ? findNextCurrentAction(i) : null,
                  }))
                  return <FunnelStepCards steps={finalSteps} />
                })()}

                {/* ─── Descripción del lead · único bloque del tab info ───
                       Todos los campos estructurados (estado, tipo, prioridad,
                       canal, equipo, responsable, fechas) viven ahora en pills
                       popover del header. Contacto en su step card. Cuenta y
                       Oportunidad Dynamics en step cards del wizard. ─── */}
                <div className="va-card" style={{ marginBottom:14 }}>
                  <div className="va-card-header">
                    <h3><span className="ico">▭</span> Descripción</h3>
                    <span className="hint">Texto libre · contexto del lead</span>
                  </div>
                  <div style={{padding:'4px 20px 16px',fontSize:12,color:'var(--text2)',lineHeight:1.55}}>
                    {editing
                      ? <textarea style={inlineTa} value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} placeholder="Detalles del lead..." />
                      : (lead.descripcion || <span style={{color:'var(--text4)'}}>Sin descripción.</span>)}
                  </div>
                </div>

                {/* Equipo de trabajo · bloque relacional (N miembros, no cabe como pill) */}
                <EquipoTrabajoCard
                  equipo={equipoTrabajo}
                  canManage={canManageTeam}
                  onAdd={addMiembro}
                  onRemove={removeMiembro}
                  onUpdateRol={updateMiembroRol}
                />

                {(lead.notas_cualificacion || editing) && (
                  <div className="va-card">
                    <div className="va-card-header">
                      <h3><span className="ico" style={{color:'var(--green)'}}>●</span> Notas de cualificación</h3>
                    </div>
                    <div style={{padding:'4px 20px 16px',fontSize:12,color:'var(--text2)',lineHeight:1.55}}>
                      {editing
                        ? <textarea style={inlineTa} value={form.notas_cualificacion} onChange={e => setF('notas_cualificacion', e.target.value)} placeholder="Notas internas durante la cualificación..." />
                        : lead.notas_cualificacion}
                    </div>
                  </div>
                )}

                {/* ─── Canal y origen | Captura automática ─── */}
                <div className="va-two-col">
                  <div className="va-meta-card">
                    <div className="va-meta-head"><span className="dot"/>Canal y origen</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Canal de entrada</span><span className="ir-v">
                        {editing
                          ? <select style={inlineInp} value={form.origen_canal} onChange={e => setF('origen_canal', e.target.value)}>
                              <option value="">—</option>
                              {LEAD_CANALES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          : (lead.origen_canal || <span style={{color:'var(--text4)'}}>—</span>)}
                      </span></div>
                      <div className="ir"><span className="ir-k">Campaña asociada</span><span className="ir-v">
                        {editing
                          ? <input style={inlineInp} value={form.origen_campana} onChange={e => setF('origen_campana', e.target.value)} placeholder="Q2-2026 Oficinas Madrid" />
                          : (lead.origen_campana || <span style={{color:'var(--text4)'}}>—</span>)}
                      </span></div>
                      <div className="ir"><span className="ir-k">Anuncio concreto</span><span className="ir-v">
                        {editing
                          ? <input style={inlineInp} value={form.origen_anuncio} onChange={e => setF('origen_anuncio', e.target.value)} placeholder="Form contacto general" />
                          : (lead.origen_anuncio || <span style={{color:'var(--text4)'}}>—</span>)}
                      </span></div>
                      <div className="ir"><span className="ir-k">URL de origen</span><span className="ir-v" style={{fontFamily:'var(--mono)',fontSize:11}}>
                        {editing
                          ? <input style={{ ...inlineInp, fontFamily:'var(--mono)' }} value={form.origen_url} onChange={e => setF('origen_url', e.target.value)} placeholder="savills.es/contacto" />
                          : (lead.origen_url || <span style={{color:'var(--text4)'}}>—</span>)}
                      </span></div>
                    </div>
                  </div>
                  <div className="va-meta-card">
                    <div className="va-meta-head accent-purple"><span className="dot"/>Captura automática</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Fecha y hora</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{fmtFecha(lead.created_at)}</span></div>
                      <div className="ir"><span className="ir-k">Equipo por defecto</span><span className="ir-v">{lead.equipo || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Responsable inicial</span><span className="ir-v">{lead.responsable || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Tipo sugerido</span><span className="ir-v"><TipoTag tipo={lead.tipo}/></span></div>
                    </div>
                  </div>
                </div>

                {/* ─── Registros generados al transformar (ancho completo) ─── */}
                {oportunidadId && (
                  <div className="va-card">
                    <div className="va-card-header">
                      <h3><span className="ico" style={{color:'var(--accent)'}}>●</span> Registros generados al transformar</h3>
                    </div>
                    <div style={{padding:'4px 20px 16px', display:'flex', flexDirection:'column', gap:8}}>
                      <div style={{ background:'#cffafe', border:'1px solid #67e8f9', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#0e7490' }}>
                        ⚡ Oportunidad: {oportunidadNombre} <span style={{ fontFamily:'var(--mono)', fontSize:10, marginLeft:8, opacity:0.7 }}>{oportunidadId}</span>
                      </div>
                      {lead.propuestas && (
                        <div onClick={() => navigate('propuestas')} style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#92400e', cursor:'pointer' }}>
                          📄 Propuesta: {lead.propuestas.nombre || lead.propuestas.ref} <span className="tag tag-amber" style={{ marginLeft:8 }}>{lead.propuestas.estado}</span>
                        </div>
                      )}
                      {lead.demandas && (
                        <div onClick={() => navigate('demandas')} style={{ background:'#f3e8ff', border:'1px solid #d8b4fe', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#6b21a8', cursor:'pointer' }}>
                          Demanda: {lead.demandas.nombre || lead.demandas.ref} <span className="tag tag-purple" style={{ marginLeft:8 }}>{lead.demandas.estatus}</span>
                        </div>
                      )}
                      {lead.ofertas && (
                        <div onClick={() => navigate('ofertas')} style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#15803d', cursor:'pointer' }}>
                          Oferta: {lead.ofertas.ref}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── Actividades (ancho completo) ─── */}
                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico">◈</span> Actividades del lead</h3>
                    <button className="ab-btn blue">+ Nueva actividad</button>
                  </div>
                  <div style={{padding:'12px 20px',fontSize:11,color:'var(--text4)'}}>
                    Próximamente: actividades del lead vinculadas vía tabla `actividades`.
                  </div>
                </div>
              </>
            )}

            {tab === 'ld-360' && (
              <div className="va-card">
                <div className="va-card-header">
                  <h3><span className="ico">◷</span> Trazabilidad completa</h3>
                </div>
                <div style={{padding:'4px 20px 18px',display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'#f5efe5', color:'#5a4828', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>1</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600 }}>Lead capturado</div>
                      <div style={{ fontSize:10, color:'var(--text4)' }}>{fmtFecha(lead.created_at)} · {lead.origen_canal}{lead.origen_anuncio ? ` · ${lead.origen_anuncio}` : ''}</div>
                    </div>
                  </div>
                  {lead.estado !== 'nuevo' && (
                    <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>2</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>Asignado a {lead.responsable || '—'}</div>
                        <div style={{ fontSize:10, color:'var(--text4)' }}>{lead.equipo || '—'}</div>
                      </div>
                    </div>
                  )}
                  {lead.estado === 'cualificado' && (
                    <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#dcfce7', color:'#15803d', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>3</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>Cualificado</div>
                        <div style={{ fontSize:10, color:'var(--text4)' }}>{fmtFecha(lead.fecha_cualificacion)} · Vinculado a Cuenta y Contacto</div>
                      </div>
                    </div>
                  )}
                  {oportunidadId && (
                    <div style={{ background:'#cffafe', border:'1px solid #67e8f9', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#B08D57', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>D</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#0e7490' }}>Transformado · Oportunidad creada en Dynamics</div>
                        <div style={{ fontSize:10, color:'#0891b2', fontFamily:'var(--mono)' }}>{oportunidadId} · {oportunidadNombre}</div>
                      </div>
                    </div>
                  )}
                  {lead.estado === 'no_cualificado' && (
                    <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#dc2626', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✗</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#991b1b' }}>Lead nulo · {lead.motivo_no_cualificado || 'Sin motivo registrado'}</div>
                        <div style={{ fontSize:10, color:'#7f1d1d' }}>{fmtFecha(lead.fecha_nulo)} · {lead.usuario_nulo || '—'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {showTransformar     && <TransformarLeadModal     lead={lead} onClose={() => setShowTransformar(false)}     onSuccess={() => { setShowTransformar(false); loadLead() }} />}
      {showNulo            && <LeadNuloModal            lead={lead} onClose={() => setShowNulo(false)}            onSuccess={() => { setShowNulo(false); loadLead() }} />}
      {showEditarContacto  && <EditarContactoLeadModal  lead={lead} onClose={() => setShowEditarContacto(false)}  onSaved={() => { setShowEditarContacto(false); loadLead() }} />}
    </div>
  )
}
