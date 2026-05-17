import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'
import EquipoTrabajoCard, { makeEquipoHandlers, isPrincipal } from '../components/EquipoTrabajoCard'
import MarcarPropuestaGanadaModal from '../components/MarcarPropuestaGanadaModal'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'
import Vinculaciones from '../components/Vinculaciones'

// Pestañas. "Equipos y participantes" eliminada: ahora vive como sección dentro
// de "Datos del proyecto", justo bajo Vinculaciones (mismo patrón que Oferta).
const PRY_TABS = [
  ['datos',        'Datos del proyecto'],
  ['trazabilidad', 'Trazabilidad'],
  ['docs',         'Documentación'],
  ['resumen',      'Resumen'],
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
  const editing = true
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [showGanadaModal, setShowGanadaModal] = useState(false)

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
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <div className="action-bar">
        <button className="ab-btn save" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando…' : '💾 Guardar cambios'}</button>
        <button className="ab-btn" onClick={restablecer} disabled={saving}>↺ Restablecer</button>
        <button className="ab-btn" onClick={() => navigate('propuestas')}>← Volver</button>
        <div className="ab-sep"/>
        {propuesta.pitch_url ? (
          <button
            className="ab-btn"
            style={{ background:'#2563EB', color:'#fff', border:'1px solid #2563EB' }}
            onClick={() => window.open(propuesta.pitch_url, '_blank', 'noopener')}
            title="Pitch sincronizado · abrir en nueva pestaña"
          >
            Ver pitch ↗
          </button>
        ) : (
          <button
            className="ab-btn"
            onClick={() => {
              const activosRefs = Array.isArray(propuesta.activos) ? propuesta.activos.map(a => a?.ref).filter(Boolean) : []
              navigate('pitch', {
                propuesta_id:  propuesta.id,
                propuesta_ref: propuesta.ref,
                cuenta_id:     propuesta.dynamics_account_id,
                oportunidad_id:propuesta.dynamics_opportunity_id,
                activo_ref:    activosRefs[0],
                activo_refs:   activosRefs,
              })
            }}
            title="Generar un pitch con esta propuesta como contexto (activos, cuenta, oportunidad)"
          >
            Crear pitch
          </button>
        )}
        {(() => {
          const yaCerrada = ['ganada','perdida','cancelada'].includes(propuesta.estado)
          const puede     = !yaCerrada && !!propuesta.dynamics_opportunity_id && !!propuesta.dynamics_account_id
          const tip = yaCerrada
            ? `Propuesta ya cerrada (${ESTADO_LABEL[propuesta.estado]})`
            : !propuesta.dynamics_opportunity_id ? 'Falta oportunidad Dynamics'
            : !propuesta.dynamics_account_id     ? 'Falta cuenta'
            : 'Crear instrucción + mandato'
          return (
            <button
              className="ab-btn"
              onClick={() => setShowGanadaModal(true)}
              disabled={!puede}
              title={tip}
              style={{ background: puede ? 'var(--green)' : undefined, color: puede ? '#fff' : undefined, border: puede ? '1px solid var(--green)' : undefined, opacity: puede ? 1 : 0.45 }}
            >
              Marcar como ganada
            </button>
          )
        })()}
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

      <div className="ficha-wrap">
        <div className="ficha-main">

          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#6b5b8e,#a78bfa)' }}>📄</div>
              <div style={{ flex:1 }}>
                <div className="ah-ref">
                  <span style={{ background:'#f3e8ff', color:'#6b5b8e', border:'1px solid #d8b4fe', padding:'0 5px', borderRadius:3, fontSize:9, fontWeight:700 }}>PROPUESTA</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{propuesta.ref}</span>
                </div>
                <div className="ah-name">
                  {editing
                    ? <input style={{ ...inpFull, fontSize:18, fontWeight:700, padding:'4px 8px' }} value={form.nombre} onChange={e => setF('nombre', e.target.value)} placeholder="Nombre de la propuesta" />
                    : tituloHeader}
                </div>
                <div className="ah-addr">📍 {dirHeader} · Creada: {fmtDate(propuesta.created_at)} · {CURRENT_USER.nombre}</div>
                <div className="ah-tags">
                  <span className={`tag ${ESTADO_TAG[propuesta.estado] || 'tag-gray'}`}>● {ESTADO_LABEL[propuesta.estado] || propuesta.estado}</span>
                  {propuesta.tipo && <span className="tag tag-blue">{propuesta.tipo}</span>}
                  {propuesta.linea && <span className="tag tag-gray">{propuesta.linea}</span>}
                  {propuesta.fees && <span className="tag tag-amber">{Number(propuesta.fees).toLocaleString('es-ES')} €</span>}
                </div>
              </div>
              <div style={{ flexShrink:0, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:1, background:'var(--border)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', fontSize:10, alignSelf:'flex-start' }}>
                {[
                  ['Estado', ESTADO_LABEL[propuesta.estado] || '—', null],
                  ['Tipo', propuesta.tipo || '—', null],
                  ['Fees', propuesta.fees ? `${Number(propuesta.fees).toLocaleString('es-ES')} €` : '—', 'var(--amber)'],
                  ['Cierre', propuesta.fecha_cierre ? fmtDate(propuesta.fecha_cierre) : '—', 'var(--accent)'],
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
            {PRY_TABS.map(([k, label]) => (
              <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</div>
            ))}
          </div>

          {/* TAB: Datos del proyecto */}
          {tab === 'datos' && (
            <div className="tab-content active"><div className="info-pad">
              {/* ── VINCULACIONES (canónico, siempre arriba) ── */}
              <Vinculaciones
                cuentaLabel="Cliente (Cuenta)"
                cuenta={cuenta ? {
                  id:     cuenta.dynamics_id || cuenta.id,
                  nombre: cuenta.nombre,
                  sub:    cuenta.sector || cuenta.tipo,
                } : null}
                oportunidad={oportunidad ? {
                  id:     oportunidad.dynamics_id || oportunidad.id,
                  nombre: oportunidad.nombre,
                  sub:    oportunidad.tipo,
                } : null}
              />

              {/* ── EQUIPO DE TRABAJO (justo bajo Vinculaciones, antes era pestaña aparte) ── */}
              {(() => {
                const equipo = Array.isArray(propuesta?.equipo_trabajo) ? propuesta.equipo_trabajo : []
                const userIsPrincipal = isPrincipal(equipo, CURRENT_USER.nombre)
                const canManage = userIsPrincipal || equipo.length === 0
                const handlers = makeEquipoHandlers({
                  supabase, table:'propuestas', idValue:propuesta?.id, equipo,
                  onAfter: () => load(),
                  onError: (msg) => setSaveError(msg),
                })
                return (
                  <EquipoTrabajoCard
                    equipo={equipo}
                    canManage={canManage}
                    onAdd={handlers.addMiembro}
                    onRemove={handlers.removeMiembro}
                    onUpdateRol={handlers.updateMiembroRol}
                  />
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

          {tab === 'equipos' && (() => {
            const equipo = Array.isArray(propuesta.equipo_trabajo) ? propuesta.equipo_trabajo : []
            const userIsPrincipal = isPrincipal(equipo, CURRENT_USER.nombre)
            const canManage = userIsPrincipal || equipo.length === 0
            const handlers = makeEquipoHandlers({
              supabase, table:'propuestas', idValue:propuesta.id, equipo,
              onAfter: () => load(),
              onError: (msg) => setSaveError(msg),
            })
            return (
              <div className="tab-content active"><div className="info-pad">
                <EquipoTrabajoCard
                  equipo={equipo}
                  canManage={canManage}
                  onAdd={handlers.addMiembro}
                  onRemove={handlers.removeMiembro}
                  onUpdateRol={handlers.updateMiembroRol}
                />
              </div></div>
            )
          })()}
          {tab === 'trazabilidad' && <div className="tab-content active"><StubTab label="Trazabilidad" /></div>}
          {tab === 'docs'         && <div className="tab-content active"><StubTab label="Documentación" /></div>}
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
