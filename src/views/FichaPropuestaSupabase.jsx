import { useState, useEffect, useCallback } from 'react'
import { useNav, useUnsavedGuard } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'
import { makeEquipoHandlers, isPrincipal, EQUIPOS_SAVILLS, MIEMBROS_POR_EQUIPO } from '../components/EquipoTrabajoCard'
import MarcarPropuestaGanadaModal from '../components/MarcarPropuestaGanadaModal'
import MarcarPropuestaPerdidaModal from '../components/MarcarPropuestaPerdidaModal'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'
import Vinculaciones from '../components/Vinculaciones'
import HeaderPills from '../components/HeaderPills'
import FunnelTracker from '../components/FunnelTracker'
import FunnelStepCards from '../components/FunnelStepCards'
import { Building2, Target, Building, Presentation, Trophy, X as XClose } from 'lucide-react'

// Pestañas · mismo criterio que Demandas/Leads: Información general + Vista 360.
// "Resumen" eliminada (no aporta). "Confidencialidad" deja de ser tab y vive
// al final de "Información general". "Documentos" se mantiene como tab propio.
const PRY_TABS = [
  ['datos',        'Información general'],
  ['docs',         'Documentos'],
  ['trazabilidad', 'Vista 360'],
]

const TIPOS = ['Pitch','Valoración','Propuesta de servicios','Mandato comercial','Consultoría','Urbanismo','Proyecto de arquitectura / workplace']
const ESTADOS = [
  { v:'borrador',   label:'Borrador' },
  { v:'presentada', label:'Presentada' },
  { v:'standby',    label:'Standby' },
  { v:'ganada',     label:'Ganada' },
  { v:'perdida',    label:'Perdida' },
  { v:'cancelada',  label:'Cancelada' },
]
const ESTADO_LABEL = Object.fromEntries(ESTADOS.map(o => [o.v, o.label]))
const ESTADO_TAG = {
  borrador:'tag-amber', presentada:'tag-blue', standby:'tag-amber',
  ganada:'tag-green', perdida:'tag-red', cancelada:'tag-gray',
}
const LINEAS = ['Oficinas','Capital Markets','Retail','Industrial / Logística','Residencial','Hoteles','Alternativos','Workplace & Consulting','Urbanismo','Valoraciones']

// Estados de cierre que exigen motivo (perdida o cancelada)
const ESTADOS_CIERRE_PROPUESTA = ['perdida','cancelada']

const MOTIVOS_DESCARTE_PROPUESTA = [
  'Cliente eligió otra consultora',
  'Cliente decide no contratar',
  'Fees no aceptados',
  'Plazos no aceptados',
  'Cambio de scope del cliente',
  'Cliente pospone el encargo',
  'Operación fuera de mercado',
  'Conflicto de intereses',
  'Cliente cierra otra alternativa internamente',
  'Otro motivo',
]

const sel = { width:'auto', padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inp = { width:120, padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inpFull = { ...inp, width:'100%' }
const ta = { width:'100%', padding:'6px 9px', fontSize:11.5, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit', minHeight:60, lineHeight:1.5, resize:'vertical' }

function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('es-ES') }

// Valor en modo lectura dentro de una dash-card (estilo Demanda/Lead).
const viewVal = { fontSize:13, fontWeight:600, color:'var(--text)' }
const viewVoid = { ...viewVal, color:'var(--text4)', fontWeight:500 }
// Campo vertical (label arriba + valor/input debajo) para las cards de detalle.
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
      <div>Sección disponible cuando completes los datos del proyecto y guardes la propuesta.</div>
    </div>
  )
}

export default function FichaPropuestaSupabase({ refOrId }) {
  const { navigate } = useNav()
  const [tab, setTab] = useState('datos')
  const [propuesta, setPropuesta] = useState(null)
  const [cuenta, setCuenta] = useState(null)
  const [pryConfidential, setPryConfidential] = useState(false)
  const [pryAuthUsers, setPryAuthUsers] = useState([
    { name: CURRENT_USER.nombre, team: CURRENT_USER.equipo || 'Equipo PDB', role:'Principal', initials:(CURRENT_USER.nombre||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(), bg:'#f5efe5', color:'#5a4828', owner:true },
  ])
  const [oportunidad, setOportunidad] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Modo edición · por defecto la ficha se abre en modo vista (sin flechas
  // ni inputs editables). Pulsa "Editar" para activar. Tras guardar OK,
  // vuelve a vista automáticamente.
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [showGanadaModal, setShowGanadaModal] = useState(false)
  const [showPerdidaModal, setShowPerdidaModal] = useState(false)
  // Activos vinculados (pitch oferta multi-activo) · jsonb propuestas.activos
  const [activosDB, setActivosDB] = useState([])
  const [activoQuery, setActivoQuery] = useState('')
  const [activoFocused, setActivoFocused] = useState(false)
  const [savingActivo, setSavingActivo] = useState(false)
  const [addingActivo, setAddingActivo] = useState(false)   // typeahead de activos solo tras pulsar "+ Añadir"
  // Alta inline de equipo/colaboradores (estilo Demanda/Lead)
  const [addEqSection, setAddEqSection] = useState(null)   // 'equipo' | 'colab' | null
  const [addEqDraft, setAddEqDraft] = useState({ equipo:'', miembro:'', rol:'Soporte' })

  const [form, setForm] = useState({
    nombre:'', tipo:'', linea:'', estado:'',
    fees:'', fecha_presentacion:'', fecha_resolucion:'', fecha_cierre:'',
    equipo:'', responsable:'', notas:'', motivo_descarte:'',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('propuestas')
      .select('*')
      .eq('ref', refOrId)
      .maybeSingle()
    if (error) { setError(error.message); setPropuesta(null); setLoading(false); return }
    if (!data)  { setError(`Propuesta ${refOrId} no encontrada`); setPropuesta(null); setLoading(false); return }
    setPropuesta(data)

    if (data.dynamics_account_id) {
      const { data: c } = await supabase.from('dynamics_accounts')
        .select('dynamics_id, nombre, tipo, sector, direccion, codigo_postal, ciudad, pais, telefono, web')
        .eq('dynamics_id', data.dynamics_account_id).maybeSingle()
      setCuenta(c)
    } else {
      setCuenta(null)
    }
    if (data.dynamics_opportunity_id) {
      const { data: o } = await supabase.from('dynamics_opportunities')
        .select('dynamics_id, nombre, tipo')
        .eq('dynamics_id', data.dynamics_opportunity_id).maybeSingle()
      setOportunidad(o)
    } else {
      setOportunidad(null)
    }
    setError(null)
    setLoading(false)
  }, [refOrId])

  useEffect(() => { load() }, [load])

  // Catálogo de activos para typeahead del bloque "Activos pitcheados".
  useEffect(() => {
    let cancel = false
    supabase.from('activos').select('id, ref, nombre, direccion, ciudad, uso, sba')
      .order('nombre').limit(500).then(({ data }) => { if (!cancel) setActivosDB(data || []) })
    return () => { cancel = true }
  }, [])

  // Helpers para vincular/desvincular activos a la propuesta.
  const activosVinculados = Array.isArray(propuesta?.activos) ? propuesta.activos : []
  const addActivo = async (a) => {
    if (!propuesta || activosVinculados.some(x => x.ref === a.ref)) return
    setSavingActivo(true)
    const item = { ref: a.ref, nombre: a.nombre, direccion: a.direccion, ciudad: a.ciudad, uso: a.uso, sba: a.sba }
    const next = [...activosVinculados, item]
    const { error } = await supabase.from('propuestas').update({ activos: next }).eq('id', propuesta.id)
    setSavingActivo(false)
    setActivoQuery('')
    if (error) setSaveError(`No se pudo vincular el activo: ${error.message}`)
    else load()
  }
  const removeActivo = async (ref) => {
    if (!propuesta) return
    setSavingActivo(true)
    const next = activosVinculados.filter(a => a.ref !== ref)
    const { error } = await supabase.from('propuestas').update({ activos: next }).eq('id', propuesta.id)
    setSavingActivo(false)
    if (error) setSaveError(`No se pudo desvincular el activo: ${error.message}`)
    else load()
  }
  const esPitchOferta = oportunidad?.tipo === 'pitch_oferta'

  useEffect(() => {
    if (!propuesta) return
    setForm({
      nombre:             propuesta.nombre             || (cuenta?.nombre || ''),
      tipo:               propuesta.tipo               || '',
      linea:              propuesta.linea              || '',
      estado:             propuesta.estado             || 'borrador',
      fees:               propuesta.fees               || '',
      fecha_presentacion: propuesta.fecha_presentacion || '',
      fecha_resolucion:   propuesta.fecha_resolucion   || '',
      fecha_cierre:       propuesta.fecha_cierre       || '',
      equipo:             propuesta.equipo             || '',
      responsable:        propuesta.responsable        || CURRENT_USER.nombre,
      notas:              propuesta.notas              || '',
      motivo_descarte:    propuesta.motivo_descarte    || '',
    })
    setSaveError(null)
  }, [propuesta, cuenta])

  const restablecer = async () => {
    setSaveError(null)
    await load()
  }

  const saveEdit = async () => {
    const requiereMotivo = ESTADOS_CIERRE_PROPUESTA.includes(form.estado)
    if (requiereMotivo && !form.motivo_descarte.trim()) {
      setSaveError('Debes indicar el motivo antes de cerrar la propuesta como perdida o cancelada.')
      return
    }
    setSaving(true)
    const num = v => v === '' || v === undefined ? null : Number(v)
    const txt = v => (v === '' || v === undefined) ? null : v
    const { error } = await supabase.from('propuestas').update({
      nombre:             txt(form.nombre.trim()),
      tipo:               txt(form.tipo),
      estado:             form.estado || 'borrador',
      fees:               num(form.fees),
      fecha_presentacion: txt(form.fecha_presentacion),
      fecha_resolucion:   txt(form.fecha_resolucion),
      fecha_cierre:       txt(form.fecha_cierre),
      equipo:             txt(form.equipo),
      responsable:        txt(form.responsable),
      notas:              txt(form.notas),
      motivo_descarte:    requiereMotivo ? (txt(form.motivo_descarte) || null) : null,
      updated_at:         new Date().toISOString(),
    }).eq('id', propuesta.id)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    setEditing(false)  // tras guardar OK, vuelve a modo vista
    await load()
  }

  // Guard de cambios sin guardar (modo edición de la propuesta).
  useUnsavedGuard({ isDirty: () => editing, onSave: async () => { await saveEdit() } })

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  if (loading) return <div style={{ padding:32, color:'var(--text4)', fontSize:12 }}>Cargando…</div>
  if (error || !propuesta) {
    return (
      <div style={{ padding:32 }}>
        <div style={{ fontSize:13, color:'#991b1b', marginBottom:12 }}>{error || 'No encontrada'}</div>
        <button className="ab-btn" onClick={() => navigate('propuestas')}>← Volver a Propuestas</button>
      </div>
    )
  }

  const tituloHeader = propuesta.nombre || cuenta?.nombre || `Propuesta ${propuesta.ref}`
  const dirHeader = cuenta
    ? [cuenta.direccion, cuenta.codigo_postal, cuenta.ciudad].filter(Boolean).join(', ')
    : '—'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}
      className={editing ? 'ficha-editing' : 'ficha-viewing'}>

      <div className="action-bar">
        {!editing ? (
          <button className="ab-btn save" onClick={() => setEditing(true)}>✎ Editar</button>
        ) : (
          <>
            <button className="ab-btn save" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando…' : '💾 Guardar cambios'}</button>
            <button className="ab-btn" onClick={() => { setEditing(false); restablecer() }} disabled={saving}>Cancelar</button>
          </>
        )}
        <button className="ab-btn" onClick={() => navigate('propuestas')}>← Volver</button>
        <div className="ab-sep"/>
        {/* "Crear pitch" y "Pitch automático" viven ahora como step card opcional dentro del wizard. */}
        {propuesta.pitch_url && (
          <button
            className="ab-btn"
            style={{ background:'#2563EB', color:'#fff', border:'1px solid #2563EB' }}
            onClick={() => window.open(propuesta.pitch_url, '_blank', 'noopener')}
            title="Pitch sincronizado · abrir en nueva pestaña"
          >
            Ver pitch ↗
          </button>
        )}
        {/* "Marcar como ganada / perdida" viven ahora como step cards al final del wizard. */}
        {saveError && <span style={{ marginLeft:12, fontSize:11, color:'#991b1b', fontWeight:600 }}>{saveError}</span>}
      </div>

      {showGanadaModal && (
        <MarcarPropuestaGanadaModal
          propuesta={propuesta}
          oportunidad={oportunidad}
          cuenta={cuenta}
          onClose={() => setShowGanadaModal(false)}
          onSuccess={() => { setShowGanadaModal(false); load() }}
        />
      )}
      {showPerdidaModal && (
        <MarcarPropuestaPerdidaModal
          propuesta={propuesta}
          oportunidad={oportunidad}
          onClose={() => setShowPerdidaModal(false)}
          onSuccess={() => { setShowPerdidaModal(false); load() }}
        />
      )}

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Funnel tracker · hilo conductor entre fases */}
          <FunnelTracker steps={[
            { key:'lead', label:'Lead', ref: propuesta.lead_ref || null,
              onClick: propuesta.lead_ref ? () => navigate('ficha-lead', { id: propuesta.lead_ref }) : null },
            { key:'opo',  label:'Oportunidad', ref: oportunidad?.dynamics_id || propuesta.dynamics_opportunity_id || null,
              onClick: (oportunidad?.dynamics_id || propuesta.dynamics_opportunity_id) ? () => navigate('ficha-oportunidad', { id: oportunidad?.dynamics_id || propuesta.dynamics_opportunity_id }) : null },
            { key:'pry',  label:'Propuesta', ref: propuesta.ref, current: true, onClick: null },
            { key:'man',  label:'Mandato', ref: propuesta.mandato_ref || null,
              onClick: propuesta.mandato_ref ? () => navigate('ficha-mandato', { ref: propuesta.mandato_ref }) : null },
          ]} />

          {/* Header rediseñado · identidad + chips estilo Demanda/Lead (.dem-skin / .dk-topbar) */}
          <div className="dem-skin">
            <div className="dk-topbar">
              <div className="dk-identity">
                <div className="dk-avatar" style={{ background:'linear-gradient(135deg,#6b5b8e,#a78bfa)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="dk-id-meta">
                    <span className="dk-tag">Propuesta</span>
                    <span className="dk-ref">{propuesta.ref}</span>
                    {propuesta.linea && <><span className="dk-dot">·</span><span>{propuesta.linea}</span></>}
                  </div>
                  {editing
                    ? <input style={{ ...inpFull, fontSize:24, fontWeight:700, padding:'2px 6px', margin:'2px 0' }} value={form.nombre} onChange={e => setF('nombre', e.target.value)} placeholder="Nombre de la propuesta" />
                    : <h1 className="dk-h1">{tituloHeader}</h1>}
                  <div className="dk-addr">
                    <span style={{ color:'#d93025' }}>📍</span>
                    <span>{dirHeader}</span>
                    <span className="dk-dot">·</span><span>Creada: {fmtDate(propuesta.created_at)}</span>
                    <span className="dk-dot">·</span><strong>{propuesta.responsable || CURRENT_USER.nombre}</strong>
                  </div>
                </div>
              </div>
              <HeaderPills variant="dk" items={[
                { key:'estado', type:'info', label:'Estado', value: ESTADO_LABEL[propuesta.estado] || propuesta.estado || '—',
                  color: propuesta.estado === 'ganada' ? 'green' : (propuesta.estado === 'perdida' || propuesta.estado === 'cancelada') ? 'red' : propuesta.estado === 'presentada' ? 'blue' : 'amber',
                  accent:true },
                propuesta.tipo && { key:'tipo', type:'info', label:'Tipo', value: propuesta.tipo, color:'blue', accent:true },
                { key:'fees', type:'info', label:'Fees', value: propuesta.fees ? `${Number(propuesta.fees).toLocaleString('es-ES')} €` : '—', color:'green', accent: !!propuesta.fees },
                { key:'cierre', type:'info', label:'Cierre estim.', value: propuesta.fecha_cierre ? fmtDate(propuesta.fecha_cierre) : '—', color:'accent', accent: !!propuesta.fecha_cierre },
                { key:'responsable', type:'info', label:'Responsable', value: propuesta.responsable || CURRENT_USER.nombre },
                propuesta.equipo && { key:'equipo', type:'info', label:'Equipo', value: propuesta.equipo },
                cuenta?.nombre && { key:'cliente', type:'info', label:'Cliente', value: cuenta.nombre, color:'blue', accent:true },
                oportunidad?.nombre && { key:'oportunidad', type:'info', label:'Oportunidad', value: oportunidad.nombre, color:'teal', accent:true },
                { key:'confidencialidad', type:'info', label:'Confidencialidad', value: pryConfidential ? 'Confidencial' : 'No', color:'teal', accent: pryConfidential },
              ]} />
            </div>
          </div>

          <div className="tabs">
            {PRY_TABS.map(([k, label]) => (
              <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</div>
            ))}
          </div>

          {/* TAB: Datos del proyecto */}
          {tab === 'datos' && (
            <div className="tab-content active"><div className="info-pad">

              {/* ── FUNNEL STEP CARDS · wizard del proyecto ── */}
              {(() => {
                const hasCuenta      = !!cuenta?.dynamics_id
                const hasOportunidad = !!(oportunidad?.dynamics_id || propuesta.dynamics_opportunity_id)
                const tieneActivos   = activosVinculados.length > 0
                const debeTenerActivos = esPitchOferta
                const activosStatus = tieneActivos ? 'done'
                  : (debeTenerActivos && hasOportunidad) ? 'current' : 'locked'
                // Pitch · opcional para pitch_oferta / pitch_demanda
                const tieneOportunidadPitch = oportunidad?.tipo === 'pitch_oferta' || oportunidad?.tipo === 'pitch_demanda'
                const tienePitch = !!propuesta.pitch_url
                const pitchAplica = tieneOportunidadPitch
                const pitchStatus = tienePitch ? 'done'
                  : pitchAplica ? 'current' : 'locked'

                // Params para navegar a Pitch
                const activosRefs = activosVinculados.map(a => a?.ref).filter(Boolean)
                const baseParams = {
                  propuesta_id:  propuesta.id,
                  propuesta_ref: propuesta.ref,
                  cuenta_id:     propuesta.dynamics_account_id,
                  oportunidad_id:propuesta.dynamics_opportunity_id,
                  activo_ref:    activosRefs[0],
                  activo_refs:   activosRefs,
                }
                const targetSegm = esPitchOferta ? 'propietario' : oportunidad?.tipo === 'pitch_demanda' ? 'tenant' : null
                const autoParams = {
                  ...baseParams,
                  step: 5, auto: 1,
                  oficina:  propuesta.equipo?.includes('Madrid') ? 'madrid' : propuesta.equipo?.includes('Barcelona') ? 'barcelona' : null,
                  equipo:   propuesta.equipo || propuesta.linea || null,
                  linea:    propuesta.linea || null,
                  target:   targetSegm,
                }

                // Body custom para la card "Activos" · typeahead + chips
                const q = activoQuery.trim().toLowerCase()
                const matches = !q
                  ? activosDB.filter(a => !activosVinculados.some(v => v.ref === a.ref)).slice(0, 8)
                  : activosDB.filter(a =>
                      !activosVinculados.some(v => v.ref === a.ref) &&
                      ((a.nombre || '').toLowerCase().includes(q) ||
                       (a.direccion || '').toLowerCase().includes(q) ||
                       (a.ref || '').toLowerCase().includes(q))
                    ).slice(0, 8)
                const activosBody = (
                  <div>
                    {activosVinculados.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
                        {activosVinculados.map(a => (
                          <div key={a.ref} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 6px 3px 9px', background:'#fff', border:'1px solid #d8b4fe', borderRadius:20, fontSize:10.5 }}>
                            <span onClick={() => navigate('ficha-activo', { ref: a.ref })} style={{ cursor:'pointer', fontWeight:600, color:'#6b5b8e' }} title="Abrir ficha">{a.nombre || a.ref}</span>
                            {a.ciudad && <span style={{ color:'var(--text4)', fontSize:9.5 }}>· {a.ciudad}</span>}
                            <button onClick={(e) => { e.stopPropagation(); removeActivo(a.ref) }} disabled={savingActivo} title="Quitar activo" style={{ marginLeft:1, background:'transparent', border:'none', cursor:'pointer', color:'var(--text4)', fontSize:12, lineHeight:1, padding:'0 2px' }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* El typeahead solo aparece tras pulsar "+ Añadir activo" para
                        no añadir activos por accidente (control explícito). */}
                    {!addingActivo ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setAddingActivo(true); setActivoQuery('') }}
                        style={{ padding:'5px 11px', fontSize:11, fontWeight:600, border:'1px dashed #c4b5fd', color:'#6b5b8e', background:'#faf5ff', borderRadius:6, cursor:'pointer', fontFamily:'inherit' }}>
                        + Añadir activo
                      </button>
                    ) : (
                      <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <input
                            autoFocus
                            placeholder="Buscar activo por nombre, dirección o ref…"
                            value={activoQuery}
                            onChange={e => setActivoQuery(e.target.value)}
                            onFocus={() => setActivoFocused(true)}
                            onBlur={() => setTimeout(() => setActivoFocused(false), 150)}
                            style={{ flex:1, padding:'6px 9px', fontSize:11.5, border:'1px solid #d8b4fe', borderRadius:5, background:'#fff', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}
                          />
                          <button
                            onClick={() => { setAddingActivo(false); setActivoQuery(''); setActivoFocused(false) }}
                            style={{ padding:'6px 10px', fontSize:11, fontWeight:500, border:'1px solid var(--border)', borderRadius:5, background:'#fff', color:'#64748b', cursor:'pointer', fontFamily:'inherit' }}>
                            Cerrar
                          </button>
                        </div>
                        {activoFocused && matches.length > 0 && (
                          <div style={{ position:'absolute', top:'calc(100% + 2px)', left:0, right:0, zIndex:50, background:'#fff', border:'1px solid #d8b4fe', borderRadius:5, maxHeight:200, overflowY:'auto', boxShadow:'0 6px 20px rgba(0,0,0,0.12)' }}>
                            {matches.map(a => (
                              <div key={a.ref} onMouseDown={() => addActivo(a)}
                                style={{ padding:'6px 9px', fontSize:11.5, cursor:'pointer', borderBottom:'1px solid var(--border)' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#faf5ff'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                <div style={{ fontWeight:600 }}>{a.nombre}</div>
                                <div style={{ fontSize:9.5, color:'var(--text4)' }}>{[a.ref, a.direccion, a.ciudad, a.uso].filter(Boolean).join(' · ')}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )

                return (
                  <FunnelStepCards steps={[
                    {
                      key:'cuenta',
                      icon: Building2,
                      tone:'blue', // canon: Cuenta = blue (Dynamics)
                      label:'Cliente (Cuenta)',
                      value: cuenta?.nombre || null,
                      sub:   cuenta?.sector || cuenta?.tipo || null,
                      status: hasCuenta ? 'done' : 'current',
                      vacant: !hasCuenta,
                      openAction: hasCuenta ? { label:'Abrir cuenta', onClick: () => navigate('cuentas', { id: cuenta.dynamics_id || cuenta.id }) } : null,
                      lockedHint: null,
                      dyn: true,
                    },
                    {
                      key:'oportunidad',
                      icon: Target,
                      tone:'blue', // canon: Oportunidad = blue (Dynamics)
                      label:'Oportunidad',
                      value: oportunidad?.nombre || propuesta.dynamics_opportunity_id || null,
                      sub:   oportunidad?.tipo || null,
                      status: hasOportunidad ? 'done' : 'locked',
                      openAction: hasOportunidad ? { label:'Abrir oportunidad', onClick: () => navigate('ficha-oportunidad', { id: oportunidad?.dynamics_id || propuesta.dynamics_opportunity_id }) } : null,
                      lockedHint:'Sin oportunidad vinculada.',
                      dyn: true,
                    },
                    {
                      key:'activos',
                      icon: Building,
                      tone:'bronze', // canon: Activo = bronze
                      label:'Activos del pitch',
                      value: tieneActivos
                        ? `${activosVinculados.length} ${activosVinculados.length === 1 ? 'activo' : 'activos'}`
                        : null,
                      sub: esPitchOferta ? 'Pitch de oferta · vincula los edificios del propietario al que pitcheas.' : null,
                      status: activosStatus,
                      vacant: !tieneActivos && activosStatus === 'current',
                      extraBody: hasOportunidad ? activosBody : null,
                      lockedHint:'Vincula primero la oportunidad.',
                    },
                    {
                      key:'pitch',
                      icon: Presentation,
                      tone:'purple', // canon: Pitch ≈ Propuesta = purple
                      label:'Pitch',
                      value: tienePitch ? 'Pitch sincronizado' : null,
                      sub: pitchAplica ? 'Salta al paso 5 con propuesta + activos pre-rellenados.' : null,
                      status: pitchStatus,
                      vacant: !tienePitch && pitchStatus === 'current',
                      optional: true,
                      // Slot extra: input para pegar URL del pitch externo (Drive/OneDrive/SharePoint)
                      // si el broker lo hizo fuera de la app.
                      extraBody: pitchAplica ? <PitchUrlInput propuesta={propuesta} onSaved={load} /> : null,
                      action: pitchStatus === 'current'
                        ? { label:'⚡ Pitch automático (paso 5)', onClick: () => navigate('pitch', autoParams), primary: true }
                        : null,
                      secondaryAction: pitchStatus === 'current'
                        ? { label:'Crear desde paso 1', onClick: () => navigate('pitch', baseParams) }
                        : null,
                      openAction: tienePitch ? { label:'Ver pitch', onClick: () => window.open(propuesta.pitch_url, '_blank', 'noopener') } : null,
                      lockedHint:'Solo aplica si la oportunidad es pitch_oferta o pitch_demanda.',
                    },
                    // Card Ganado · ejecuta MarcarPropuestaGanadaModal (Mandato + Oferta(s)/Demanda)
                    (() => {
                      const yaGanada  = propuesta.estado === 'ganada'
                      const yaPerdida = ['perdida','cancelada'].includes(propuesta.estado)
                      const puede     = !yaGanada && !yaPerdida && hasOportunidad && hasCuenta
                      const status    = yaGanada ? 'done' : yaPerdida ? 'locked' : puede ? 'current' : 'locked'
                      return {
                        key:'ganada',
                        icon: Trophy,
                        tone:'green',
                        label:'Propuesta ganada',
                        value: yaGanada ? 'Marcada como ganada' : null,
                        sub: yaGanada
                          ? 'Mandato + ofertas/demanda generados automáticamente.'
                          : 'Crea Mandato (exclusiva) + Oferta(s)/Demanda en cascada.',
                        status,
                        action: status === 'current'
                          ? { label:'✓ Marcar como ganada', onClick: () => setShowGanadaModal(true), primary: true }
                          : null,
                        lockedHint: yaPerdida
                          ? 'La propuesta ya está marcada como perdida.'
                          : !hasOportunidad ? 'Vincula la oportunidad.'
                          : !hasCuenta ? 'Vincula la cuenta.'
                          : 'En proceso.',
                      }
                    })(),
                    // Card Perdido · opción de crear oferta igualmente
                    (() => {
                      const yaPerdida = ['perdida','cancelada'].includes(propuesta.estado)
                      const yaGanada  = propuesta.estado === 'ganada'
                      const puede     = !yaGanada && !yaPerdida
                      const status    = yaPerdida ? 'done' : yaGanada ? 'locked' : puede ? 'current' : 'locked'
                      return {
                        key:'perdida',
                        icon: XClose,
                        tone:'red',
                        label:'Propuesta perdida',
                        value: yaPerdida ? (propuesta.motivo_descarte || 'Marcada como perdida') : null,
                        sub: yaPerdida
                          ? null
                          : 'Cierra la propuesta. Opcionalmente crea oferta(s) igualmente (off-market, otra consultora…).',
                        status,
                        action: status === 'current'
                          ? { label:'✗ Marcar como perdida', onClick: () => setShowPerdidaModal(true), primary: false }
                          : null,
                        lockedHint: yaGanada
                          ? 'La propuesta ya está marcada como ganada.'
                          : 'En proceso.',
                      }
                    })(),
                  ]} />
                )
              })()}

              {/* ── DETALLE · todos los cuadros en una sola fila (estilo Demanda/Lead) ── */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12, marginBottom:14, alignItems:'stretch' }}>

                {/* Datos del proyecto */}
                <div className="dash-card">
                  <div className="dash-card-head">Datos del proyecto</div>
                  <div style={{ padding:'12px 16px 16px', display:'flex', flexDirection:'column', gap:11 }}>
                    <DashField label="Tipo">
                      {editing
                        ? <select className="dash-field-input" value={form.tipo} onChange={e => setF('tipo', e.target.value)}><option value="">—</option>{TIPOS.map(t => <option key={t}>{t}</option>)}</select>
                        : <span style={propuesta.tipo ? viewVal : viewVoid}>{propuesta.tipo || '—'}</span>}
                    </DashField>
                    <DashField label="Línea de negocio">
                      {editing
                        ? <select className="dash-field-input" value={form.linea} onChange={e => setF('linea', e.target.value)}><option value="">—</option>{LINEAS.map(l => <option key={l}>{l}</option>)}</select>
                        : <span style={propuesta.linea ? viewVal : viewVoid}>{propuesta.linea || '—'}</span>}
                    </DashField>
                    <DashField label="Estado">
                      {editing
                        ? <select className="dash-field-input" value={form.estado} onChange={e => setF('estado', e.target.value)}>{ESTADOS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}</select>
                        : <span style={viewVal}>{ESTADO_LABEL[propuesta.estado] || propuesta.estado || '—'}</span>}
                    </DashField>

                    {/* Motivo: obligatorio si la propuesta se cierra como perdida o cancelada */}
                    {(ESTADOS_CIERRE_PROPUESTA.includes(form.estado) || propuesta.motivo_descarte) && (() => {
                      const motivoEsPredef = MOTIVOS_DESCARTE_PROPUESTA.includes(form.motivo_descarte)
                      const motivoEsOtro   = !!form.motivo_descarte && !motivoEsPredef
                      const sel_v          = motivoEsOtro ? 'Otro motivo' : (form.motivo_descarte || '')
                      const otroTexto      = motivoEsOtro ? form.motivo_descarte : ''
                      const requiereMotivo = ESTADOS_CIERRE_PROPUESTA.includes(form.estado)
                      const sinMotivo      = requiereMotivo && !form.motivo_descarte.trim()
                      return (
                        <>
                          <DashField label={`Motivo del cierre${requiereMotivo ? ' *' : ''}`}>
                            {editing
                              ? <select className="dash-field-input" style={{ borderColor: sinMotivo ? '#dc2626' : undefined }} value={sel_v}
                                  onChange={e => {
                                    const v = e.target.value
                                    if (v === '') setF('motivo_descarte', '')
                                    else if (v === 'Otro motivo') setF('motivo_descarte', otroTexto || ' ')
                                    else setF('motivo_descarte', v)
                                  }}>
                                  <option value="">Selecciona un motivo...</option>
                                  {MOTIVOS_DESCARTE_PROPUESTA.map(m => <option key={m}>{m}</option>)}
                                </select>
                              : <span style={form.motivo_descarte ? viewVal : viewVoid}>{motivoEsPredef ? form.motivo_descarte : (motivoEsOtro ? 'Otro motivo' : '—')}</span>}
                          </DashField>
                          {(sel_v === 'Otro motivo' || motivoEsOtro) && (
                            <DashField label="Describe el motivo">
                              {editing
                                ? <textarea className="dash-field-input" style={{ minHeight:60, resize:'vertical', borderColor: sinMotivo ? '#dc2626' : undefined }} value={otroTexto} onChange={e => setF('motivo_descarte', e.target.value)} placeholder="Describe brevemente por qué se cierra…" />
                                : <span style={propuesta.motivo_descarte ? { ...viewVal, fontWeight:500 } : viewVoid}>{propuesta.motivo_descarte || '—'}</span>}
                            </DashField>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Económicos y fechas */}
                <div className="dash-card">
                  <div className="dash-card-head">Económicos y fechas</div>
                  <div style={{ padding:'12px 16px 16px', display:'flex', flexDirection:'column', gap:11 }}>
                    <DashField label="Fees (€)">
                      {editing
                        ? <input type="number" className="dash-field-input" value={form.fees} onChange={e => setF('fees', e.target.value)} placeholder="—" />
                        : <span style={propuesta.fees ? { ...viewVal, fontFamily:'var(--mono)' } : viewVoid}>{propuesta.fees ? `${Number(propuesta.fees).toLocaleString('es-ES')} €` : '—'}</span>}
                    </DashField>
                    <DashField label="F. presentación">
                      {editing
                        ? <input type="date" className="dash-field-input" value={form.fecha_presentacion} onChange={e => setF('fecha_presentacion', e.target.value)} />
                        : <span style={viewVal}>{fmtDate(propuesta.fecha_presentacion)}</span>}
                    </DashField>
                    <DashField label="F. resolución">
                      {editing
                        ? <input type="date" className="dash-field-input" value={form.fecha_resolucion} onChange={e => setF('fecha_resolucion', e.target.value)} />
                        : <span style={viewVal}>{fmtDate(propuesta.fecha_resolucion)}</span>}
                    </DashField>
                    <DashField label="F. cierre estimada">
                      {editing
                        ? <input type="date" className="dash-field-input" value={form.fecha_cierre} onChange={e => setF('fecha_cierre', e.target.value)} />
                        : <span style={viewVal}>{fmtDate(propuesta.fecha_cierre)}</span>}
                    </DashField>
                  </div>
                </div>

                {/* Asignación y notas */}
                <div className="dash-card">
                  <div className="dash-card-head">Asignación y notas</div>
                  <div style={{ padding:'12px 16px 16px', display:'flex', flexDirection:'column', gap:11 }}>
                    <DashField label="Equipo">
                      {editing
                        ? <input className="dash-field-input" value={form.equipo} onChange={e => setF('equipo', e.target.value)} placeholder="Capital Markets, Leasing Madrid…" />
                        : <span style={propuesta.equipo ? viewVal : viewVoid}>{propuesta.equipo || '—'}</span>}
                    </DashField>
                    <DashField label="Responsable">
                      {editing
                        ? <input className="dash-field-input" value={form.responsable} onChange={e => setF('responsable', e.target.value)} />
                        : <span style={propuesta.responsable ? viewVal : viewVoid}>{propuesta.responsable || '—'}</span>}
                    </DashField>
                    <DashField label="Notas">
                      {editing
                        ? <textarea className="dash-field-input" style={{ minHeight:90, resize:'vertical', lineHeight:1.5 }} value={form.notas} onChange={e => setF('notas', e.target.value)} placeholder="Notas internas sobre la propuesta…" />
                        : <span style={propuesta.notas ? { ...viewVal, fontWeight:500, whiteSpace:'pre-wrap' } : viewVoid}>{propuesta.notas || '—'}</span>}
                    </DashField>
                  </div>
                </div>

                {/* Equipo de trabajo · dash-card con Equipo + Colaboradores (estilo Demanda/Lead) */}
                {(() => {
                  const equipo = Array.isArray(propuesta?.equipo_trabajo) ? propuesta.equipo_trabajo : []
                  const userIsPrincipal = isPrincipal(equipo, CURRENT_USER.nombre)
                  const canManage = userIsPrincipal || equipo.length === 0
                  const handlers = makeEquipoHandlers({
                    supabase, table:'propuestas', idValue:propuesta?.id, equipo,
                    onAfter: () => load(),
                    onError: (msg) => setSaveError(msg),
                  })
                  const equipoInterno = equipo.filter(m => m.rol !== 'Colaborador')
                  const colaboradores = equipo.filter(m => m.rol === 'Colaborador')
                  const mapIdx = (filtered, i) => equipo.indexOf(filtered[i])
                  const iniciales = n => (n || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()
                  return (
                    <div className="dash-card" style={{ overflow:'visible' }}>
                      <div className="dash-card-head">Equipo de trabajo</div>
                      <div style={{ padding:'12px 16px 14px', display:'flex', flexDirection:'column', gap:12 }}>

                        {/* Equipo (Principal/Soporte) */}
                        <div>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                            <div className="dash-card-sub" style={{ margin:0 }}>Equipo</div>
                            {canManage && addEqSection !== 'equipo' && (
                              <button onClick={() => { setAddEqSection('equipo'); setAddEqDraft({ equipo:'', miembro:'', rol:'Soporte' }) }}
                                style={{ background:'none', border:'none', color:'#0a66c2', cursor:'pointer', fontSize:11, fontWeight:600, padding:0 }}>+ Añadir</button>
                            )}
                          </div>
                          {equipoInterno.length === 0 ? (
                            <div style={{ fontSize:11.5, color:'#94a3b8' }}>Sin asignar.</div>
                          ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                              {equipoInterno.map((m, i) => (
                                <div key={`int-${i}`} className="dash-eq-row">
                                  <div style={{ width:24, height:24, borderRadius:'50%', background:'#f5efe5', color:'#5a4828', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>{iniciales(m.nombre)}</div>
                                  <div style={{ fontSize:12, fontWeight:500, color:'#0f172a', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.nombre}</div>
                                  <span style={{ fontSize:9.5, color: m.rol === 'Principal' ? '#0a66c2' : '#64748b', fontWeight:600 }}>{m.rol}</span>
                                  {canManage && (
                                    <button onClick={() => handlers.removeMiembro(mapIdx(equipoInterno, i))} className="dash-eq-remove" title="Quitar">×</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {addEqSection === 'equipo' && (
                            <div style={{ marginTop:8, padding:'10px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, display:'flex', flexDirection:'column', gap:6 }}>
                              <select className="fsel" value={addEqDraft.equipo} onChange={e => setAddEqDraft(p => ({ ...p, equipo: e.target.value, miembro:'' }))} style={{ fontSize:11.5 }}>
                                <option value="">Equipo…</option>
                                {EQUIPOS_SAVILLS.map(eq => <option key={eq}>{eq}</option>)}
                              </select>
                              {addEqDraft.equipo && (
                                <select className="fsel" value={addEqDraft.miembro} onChange={e => setAddEqDraft(p => ({ ...p, miembro: e.target.value }))} style={{ fontSize:11.5 }}>
                                  <option value="">Miembro…</option>
                                  {(MIEMBROS_POR_EQUIPO[addEqDraft.equipo] || []).map(n => <option key={n}>{n}</option>)}
                                </select>
                              )}
                              <select className="fsel" value={addEqDraft.rol} onChange={e => setAddEqDraft(p => ({ ...p, rol: e.target.value }))} style={{ fontSize:11.5 }}>
                                <option>Principal</option>
                                <option>Soporte</option>
                              </select>
                              <div style={{ display:'flex', gap:6 }}>
                                <button disabled={!addEqDraft.equipo || !addEqDraft.miembro}
                                  onClick={() => { handlers.addMiembro(addEqDraft.miembro, addEqDraft.equipo, addEqDraft.rol); setAddEqSection(null) }}
                                  style={{ flex:1, padding:'6px 10px', fontSize:11.5, fontWeight:600, border:'none', borderRadius:8, background: (!addEqDraft.equipo || !addEqDraft.miembro) ? '#cbd5e1' : '#0a66c2', color:'#fff', cursor: (!addEqDraft.equipo || !addEqDraft.miembro) ? 'not-allowed' : 'pointer' }}>Añadir</button>
                                <button onClick={() => setAddEqSection(null)} style={{ padding:'6px 10px', fontSize:11.5, fontWeight:500, border:'1px solid var(--border)', borderRadius:8, background:'#fff', color:'#64748b', cursor:'pointer' }}>Cancelar</button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Colaboradores */}
                        <div>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                            <div className="dash-card-sub" style={{ margin:0 }}>Colaboradores</div>
                            {canManage && addEqSection !== 'colab' && (
                              <button onClick={() => { setAddEqSection('colab'); setAddEqDraft({ equipo:'', miembro:'', rol:'Colaborador' }) }}
                                style={{ background:'none', border:'none', color:'#6b21a8', cursor:'pointer', fontSize:11, fontWeight:600, padding:0 }}>+ Añadir</button>
                            )}
                          </div>
                          {colaboradores.length === 0 ? (
                            <div style={{ fontSize:11.5, color:'#94a3b8' }}>Sin colaboradores externos.</div>
                          ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                              {colaboradores.map((m, i) => (
                                <div key={`cl-${i}`} className="dash-eq-row">
                                  <div style={{ width:24, height:24, borderRadius:'50%', background:'#fdf4ff', color:'#6b5b8e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>{iniciales(m.nombre)}</div>
                                  <div style={{ fontSize:12, fontWeight:500, color:'#0f172a', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.nombre}</div>
                                  <span style={{ fontSize:9.5, color:'#6b21a8', fontWeight:600 }}>{m.equipo || 'Colab'}</span>
                                  {canManage && (
                                    <button onClick={() => handlers.removeMiembro(mapIdx(colaboradores, i))} className="dash-eq-remove" title="Quitar">×</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {addEqSection === 'colab' && (
                            <div style={{ marginTop:8, padding:'10px 12px', background:'#faf5ff', border:'1px solid #e9d5ff', borderRadius:10, display:'flex', flexDirection:'column', gap:6 }}>
                              <select className="fsel" value={addEqDraft.equipo} onChange={e => setAddEqDraft(p => ({ ...p, equipo: e.target.value, miembro:'' }))} style={{ fontSize:11.5 }}>
                                <option value="">Equipo / consultora…</option>
                                {EQUIPOS_SAVILLS.map(eq => <option key={eq}>{eq}</option>)}
                                <option value="Agente externo">Agente externo</option>
                              </select>
                              {addEqDraft.equipo && addEqDraft.equipo !== 'Agente externo' && (
                                <select className="fsel" value={addEqDraft.miembro} onChange={e => setAddEqDraft(p => ({ ...p, miembro: e.target.value }))} style={{ fontSize:11.5 }}>
                                  <option value="">Miembro…</option>
                                  {(MIEMBROS_POR_EQUIPO[addEqDraft.equipo] || []).map(n => <option key={n}>{n}</option>)}
                                </select>
                              )}
                              {addEqDraft.equipo === 'Agente externo' && (
                                <input className="kf-inp" placeholder="Nombre del agente externo" value={addEqDraft.miembro} onChange={e => setAddEqDraft(p => ({ ...p, miembro: e.target.value }))} style={{ fontSize:11.5 }} />
                              )}
                              <div style={{ display:'flex', gap:6 }}>
                                <button disabled={!addEqDraft.equipo || !addEqDraft.miembro}
                                  onClick={() => { handlers.addMiembro(addEqDraft.miembro, addEqDraft.equipo, 'Colaborador'); setAddEqSection(null) }}
                                  style={{ flex:1, padding:'6px 10px', fontSize:11.5, fontWeight:600, border:'none', borderRadius:8, background: (!addEqDraft.equipo || !addEqDraft.miembro) ? '#cbd5e1' : '#6b21a8', color:'#fff', cursor: (!addEqDraft.equipo || !addEqDraft.miembro) ? 'not-allowed' : 'pointer' }}>Añadir</button>
                                <button onClick={() => setAddEqSection(null)} style={{ padding:'6px 10px', fontSize:11.5, fontWeight:500, border:'1px solid var(--border)', borderRadius:8, background:'#fff', color:'#64748b', cursor:'pointer' }}>Cancelar</button>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )
                })()}

              </div>

              {/* ── CONFIDENCIALIDAD · al final de Información general (mismo criterio que Demanda) ── */}
              <ConfidencialidadPanel
                entityLabel="propuesta"
                confidential={pryConfidential}
                onToggle={setPryConfidential}
                hiddenFields={['Cuenta','Datos económicos / Fees','Estrategia comercial','Documentación adjunta','Equipo participante']}
                visibleFields={['Tipo de propuesta','Estado','Equipo','Fecha de creación','Información básica']}
                authorizedUsers={pryAuthUsers}
                onAddUser={(newUser) => {
                  const [name, team] = [newUser.split('·')[0].trim(), newUser.split('·')[1]?.trim() || '']
                  const ini = name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                  const today = new Date().toLocaleDateString('es-ES')
                  setPryAuthUsers(prev => [...prev, { name, team, role:'Autorizado', initials:ini, bg:'#f0fdf4', color:'#166534', granted:today }])
                }}
                onRemoveUser={(idx) => setPryAuthUsers(prev => prev.filter((_,j) => j !== idx))}
                responsable={CURRENT_USER.nombre}
              />
            </div></div>
          )}

          {tab === 'trazabilidad' && <div className="tab-content active"><StubTab label="Vista 360" /></div>}
          {tab === 'docs'         && <div className="tab-content active"><StubTab label="Documentos" /></div>}

        </div>
      </div>
    </div>
  )
}

/**
 * Input inline para adjuntar la URL del pitch externo (Drive, OneDrive,
 * SharePoint…) cuando el broker hizo el pitch fuera de la app.
 * Guarda en propuestas.pitch_url y recarga.
 */
function PitchUrlInput({ propuesta, onSaved }) {
  const [url, setUrl] = useState(propuesta.pitch_url || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const dirty = url.trim() !== (propuesta.pitch_url || '')

  const save = async () => {
    setSaving(true); setErr(null)
    const v = url.trim()
    const { error: e } = await supabase.from('propuestas').update({ pitch_url: v || null }).eq('id', propuesta.id)
    setSaving(false)
    if (e) { setErr(e.message); return }
    onSaved?.()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>
        ¿Pitch hecho fuera? Pega la URL
      </div>
      <div style={{ display:'flex', gap:5 }}>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://drive.google.com/… o SharePoint…"
          style={{
            flex:1, padding:'5px 8px', fontSize:11, border:'1px solid var(--border)',
            borderRadius:5, fontFamily:'inherit', background:'#fff', outline:'none',
          }}
        />
        <button
          onClick={save}
          disabled={!dirty || saving}
          style={{
            padding:'5px 10px', fontSize:11, fontWeight:700, border:'none', borderRadius:5,
            background: (!dirty || saving) ? 'var(--gray-lt, #f4f4f5)' : 'var(--accent)',
            color: (!dirty || saving) ? 'var(--text4)' : '#fff',
            cursor: (!dirty || saving) ? 'not-allowed' : 'pointer',
            fontFamily:'inherit',
          }}>
          {saving ? '…' : '💾'}
        </button>
      </div>
      {err && <div style={{ fontSize:10, color:'#dc2626' }}>{err}</div>}
    </div>
  )
}
