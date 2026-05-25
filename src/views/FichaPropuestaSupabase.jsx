import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'
import EquipoTrabajoCard, { makeEquipoHandlers, isPrincipal } from '../components/EquipoTrabajoCard'
import MarcarPropuestaGanadaModal from '../components/MarcarPropuestaGanadaModal'
import MarcarPropuestaPerdidaModal from '../components/MarcarPropuestaPerdidaModal'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'
import Vinculaciones from '../components/Vinculaciones'
import HeaderPills from '../components/HeaderPills'
import FunnelTracker from '../components/FunnelTracker'
import FunnelStepCards from '../components/FunnelStepCards'
import { Building2, Target, Building, Presentation, Trophy, X as XClose } from 'lucide-react'

// Pestañas. "Equipos y participantes" eliminada: ahora vive como sección dentro
// de "Datos del proyecto", justo bajo Vinculaciones (mismo patrón que Oferta).
// Tabs canónicos. "Datos del proyecto" → "Información general"; "Trazabilidad" → "Vista 360"; "Documentación" → "Documentos"
const PRY_TABS = [
  ['datos',        'Información general'],
  ['resumen',      'Resumen'],
  ['docs',         'Documentos'],
  ['trazabilidad', 'Vista 360'],
  ['conf',         'Confidencialidad'],
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
              onClick: propuesta.lead_ref ? () => navigate('ficha-lead', { ref: propuesta.lead_ref }) : null },
            { key:'opo',  label:'Oportunidad', ref: oportunidad?.dynamics_id || propuesta.dynamics_opportunity_id || null,
              onClick: (oportunidad?.dynamics_id || propuesta.dynamics_opportunity_id) ? () => navigate('ficha-oportunidad', { id: oportunidad?.dynamics_id || propuesta.dynamics_opportunity_id }) : null },
            { key:'pry',  label:'Propuesta', ref: propuesta.ref, current: true, onClick: null },
            { key:'man',  label:'Mandato', ref: propuesta.mandato_ref || null,
              onClick: propuesta.mandato_ref ? () => navigate('ficha-mandato', { ref: propuesta.mandato_ref }) : null },
          ]} />

          <div className="ah">
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#6b5b8e,#a78bfa)' }}>📄</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="ah-ref">
                  <span style={{ background:'#f3e8ff', color:'#6b5b8e', border:'1px solid #d8b4fe', padding:'0 6px', borderRadius:3, fontSize:9, fontWeight:700 }}>PROPUESTA</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{propuesta.ref}</span>
                  {propuesta.linea && <span style={{ color:'var(--text4)', fontSize:11 }}>· {propuesta.linea}</span>}
                </div>
                <div className="ah-name">
                  {editing
                    ? <input style={{ ...inpFull, fontSize:22, fontWeight:700, padding:'4px 8px' }} value={form.nombre} onChange={e => setF('nombre', e.target.value)} placeholder="Nombre de la propuesta" />
                    : tituloHeader}
                </div>
                <div className="ah-addr">📍 {dirHeader} · Creada: {fmtDate(propuesta.created_at)} · {CURRENT_USER.nombre}</div>
              </div>
              <HeaderPills items={[
                { key:'estado', type:'info', label:'Estado', value:`● ${ESTADO_LABEL[propuesta.estado] || propuesta.estado}`,
                  color: propuesta.estado === 'ganada' ? 'green' : propuesta.estado === 'perdida' || propuesta.estado === 'cancelada' ? 'red' : propuesta.estado === 'presentada' ? 'blue' : 'amber',
                  accent:true,
                },
                propuesta.tipo && { key:'tipo', type:'info', label:'Tipo', value: propuesta.tipo, color:'blue', accent:true },
                { key:'fees', type:'info', label:'Fees', value: propuesta.fees ? `${Number(propuesta.fees).toLocaleString('es-ES')} €` : '—',
                  color:'green', accent: !!propuesta.fees },
                { key:'cierre', type:'info', label:'Cierre estim.', value: propuesta.fecha_cierre ? fmtDate(propuesta.fecha_cierre) : '—', color:'accent', accent: !!propuesta.fecha_cierre },
                { key:'responsable', type:'info', label:'Responsable', value: propuesta.responsable || CURRENT_USER.nombre },
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
                            <button onClick={(e) => { e.stopPropagation(); removeActivo(a.ref) }} disabled={savingActivo} title="Desvincular" style={{ marginLeft:1, background:'transparent', border:'none', cursor:'pointer', color:'var(--text4)', fontSize:12, lineHeight:1, padding:'0 2px' }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ position:'relative' }}>
                      <input
                        placeholder="Buscar activo por nombre, dirección o ref…"
                        value={activoQuery}
                        onChange={e => setActivoQuery(e.target.value)}
                        onFocus={() => setActivoFocused(true)}
                        onBlur={() => setTimeout(() => setActivoFocused(false), 150)}
                        onClick={e => e.stopPropagation()}
                        style={{ width:'100%', padding:'6px 9px', fontSize:11.5, border:'1px solid #d8b4fe', borderRadius:5, background:'#fff', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}
                      />
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

              {/* ── EQUIPO DE TRABAJO + COLABORADORES (50/50 justo bajo Vinculaciones, idéntica posición que en Oferta) ── */}
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
                // Remap idx en lista filtrada → idx real en el array completo.
                // Las refs de los items son las mismas (Array.filter no clona).
                const mapIdx = (filtered, idx) => equipo.indexOf(filtered[idx])
                return (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                    {/* Izquierda · Equipo de trabajo (Principal + Soporte) */}
                    <EquipoTrabajoCard
                      title="Equipo de trabajo"
                      equipo={equipoInterno}
                      canManage={canManage}
                      onAdd={(nombre, equipoNombre, rol) => handlers.addMiembro(nombre, equipoNombre, rol === 'Colaborador' ? 'Soporte' : rol)}
                      onRemove={(idx) => handlers.removeMiembro(mapIdx(equipoInterno, idx))}
                      onUpdateRol={(idx, rol) => handlers.updateMiembroRol(mapIdx(equipoInterno, idx), rol)}
                    />
                    {/* Derecha · Colaboradores (rol Colaborador) */}
                    <EquipoTrabajoCard
                      title="Colaboradores"
                      equipo={colaboradores}
                      canManage={canManage}
                      onAdd={(nombre, equipoNombre) => handlers.addMiembro(nombre, equipoNombre, 'Colaborador')}
                      onRemove={(idx) => handlers.removeMiembro(mapIdx(colaboradores, idx))}
                      onUpdateRol={(idx, rol) => handlers.updateMiembroRol(mapIdx(colaboradores, idx), rol)}
                    />
                  </div>
                )
              })()}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <div className="va-meta-card" style={{ marginBottom:14 }}>
                    <div className="va-meta-head accent-purple"><span className="dot"/>Datos del proyecto</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div className="ir"><span className="ir-k">Tipo</span><span className="ir-v">{editing
                        ? <select style={sel} value={form.tipo} onChange={e => setF('tipo', e.target.value)}>
                            <option value="">—</option>{TIPOS.map(t => <option key={t}>{t}</option>)}
                          </select>
                        : (propuesta.tipo || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                      <div className="ir"><span className="ir-k">Línea de negocio</span><span className="ir-v">{editing
                        ? <select style={sel} value={form.linea} onChange={e => setF('linea', e.target.value)}>
                            <option value="">—</option>{LINEAS.map(l => <option key={l}>{l}</option>)}
                          </select>
                        : (propuesta.linea || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                      <div className="ir"><span className="ir-k">Estado</span><span className="ir-v">{editing
                        ? <select style={sel} value={form.estado} onChange={e => setF('estado', e.target.value)}>
                            {ESTADOS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        : (ESTADO_LABEL[propuesta.estado] || propuesta.estado || '—')}</span></div>

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
                            <div className="ir" style={{ alignItems:'flex-start' }}>
                              <span className="ir-k" style={{ color: requiereMotivo ? '#dc2626' : 'var(--text4)', fontWeight:700 }}>
                                Motivo del cierre {requiereMotivo && <span style={{ color:'#dc2626' }}>*</span>}
                              </span>
                              <span className="ir-v">
                                {editing
                                  ? <select
                                      style={{ ...sel, borderColor: sinMotivo ? '#dc2626' : 'var(--border)' }}
                                      value={sel_v}
                                      onChange={e => {
                                        const v = e.target.value
                                        if (v === '') setF('motivo_descarte', '')
                                        else if (v === 'Otro motivo') setF('motivo_descarte', otroTexto || ' ')
                                        else setF('motivo_descarte', v)
                                      }}
                                    >
                                      <option value="">Selecciona un motivo...</option>
                                      {MOTIVOS_DESCARTE_PROPUESTA.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                  : (motivoEsPredef ? form.motivo_descarte : (motivoEsOtro ? 'Otro motivo' : <span style={{ color:'var(--text4)' }}>—</span>))}
                              </span>
                            </div>
                            {(sel_v === 'Otro motivo' || motivoEsOtro) && (
                              <div className="ir" style={{ alignItems:'flex-start' }}>
                                <span className="ir-k">Describe el motivo</span>
                                <span className="ir-v" style={{ flex:1 }}>
                                  {editing
                                    ? <textarea
                                        style={{ ...ta, minHeight:50, borderColor: sinMotivo ? '#dc2626' : 'var(--border)' }}
                                        value={otroTexto}
                                        onChange={e => setF('motivo_descarte', e.target.value)}
                                        placeholder="Describe brevemente por qué se cierra esta propuesta..."
                                      />
                                    : (propuesta.motivo_descarte || <span style={{ color:'var(--text4)' }}>—</span>)}
                                </span>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="va-meta-card">
                    <div className="va-meta-head accent-amber"><span className="dot"/>Económicos y fechas</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div className="ir"><span className="ir-k">Fees (€)</span><span className="ir-v">{editing
                        ? <input type="number" style={inp} value={form.fees} onChange={e => setF('fees', e.target.value)} placeholder="—" />
                        : (propuesta.fees ? `${Number(propuesta.fees).toLocaleString('es-ES')} €` : <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                      <div className="ir"><span className="ir-k">F. presentación</span><span className="ir-v">{editing
                        ? <input type="date" style={{ ...sel, width:130 }} value={form.fecha_presentacion} onChange={e => setF('fecha_presentacion', e.target.value)} />
                        : fmtDate(propuesta.fecha_presentacion)}</span></div>
                      <div className="ir"><span className="ir-k">F. resolución</span><span className="ir-v">{editing
                        ? <input type="date" style={{ ...sel, width:130 }} value={form.fecha_resolucion} onChange={e => setF('fecha_resolucion', e.target.value)} />
                        : fmtDate(propuesta.fecha_resolucion)}</span></div>
                      <div className="ir"><span className="ir-k">F. cierre estimada</span><span className="ir-v">{editing
                        ? <input type="date" style={{ ...sel, width:130 }} value={form.fecha_cierre} onChange={e => setF('fecha_cierre', e.target.value)} />
                        : fmtDate(propuesta.fecha_cierre)}</span></div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="va-meta-card" style={{ marginBottom:14 }}>
                    <div className="va-meta-head"><span className="dot"/>Asignación</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div className="ir"><span className="ir-k">Equipo</span><span className="ir-v">{editing
                        ? <input style={inpFull} value={form.equipo} onChange={e => setF('equipo', e.target.value)} placeholder="Capital Markets, Leasing Madrid..." />
                        : (propuesta.equipo || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                      <div className="ir"><span className="ir-k">Responsable</span><span className="ir-v">{editing
                        ? <input style={inpFull} value={form.responsable} onChange={e => setF('responsable', e.target.value)} />
                        : (propuesta.responsable || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                    </div>
                  </div>

                  <div className="va-meta-card">
                    <div className="va-meta-head accent-red"><span className="dot"/>Notas</div>
                    <div style={{ padding:'10px 14px' }}>
                      {editing
                        ? <textarea style={ta} value={form.notas} onChange={e => setF('notas', e.target.value)} placeholder="Notas internas sobre la propuesta..." />
                        : (propuesta.notas || <span style={{ color:'var(--text4)' }}>—</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {tab === 'trazabilidad' && <div className="tab-content active"><StubTab label="Vista 360" /></div>}
          {tab === 'docs'         && <div className="tab-content active"><StubTab label="Documentos" /></div>}
          {tab === 'resumen'      && <div className="tab-content active"><StubTab label="Resumen" /></div>}
          {tab === 'conf' && (
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
          )}

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
