import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER } from '../lib/currentUser'

const MAN_TABS = [
  ['man-info',     'Información'],
  ['man-activos',  'Activos vinculados'],
  ['man-vigencia', 'Vigencia y alertas'],
  ['man-excl',     'Exclusividad'],
  ['man-fees',     'Fees y honorarios'],
  ['man-docs',     'Documentos'],
  ['man-act',      'Actividades'],
  ['man-conf',     'Confidencialidad'],
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
  'Cliente cancela el encargo',
  'Pérdida de competitividad de Savills',
  'Cambio de estrategia del cliente',
  'Activo vendido / alquilado fuera de Savills',
  'Conflicto de interés',
  'Problema de compliance / KYC',
  'Otro motivo',
]

const DEPARTAMENTOS = ['Oficinas','Capital Markets','Valoraciones','Property Management','Logístico','Retail','Industrial','Living']
const PROVINCIAS    = ['Madrid','Barcelona','Valencia','Sevilla','Bilbao','Málaga','Zaragoza','Alicante']

const sel = { width:'auto', padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inp = { width:120,   padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inpFull = { ...inp, width:'100%' }
const ta  = { width:'100%', padding:'6px 9px', fontSize:11.5, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit', minHeight:60, lineHeight:1.5, resize:'vertical' }

function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('es-ES') }
function diasEntre(d) { if (!d) return null; const t = new Date(d).getTime(); return Math.round((t - Date.now()) / 86400000) }

function StubTab({ label }) {
  return (
    <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>
      <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
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
        responsable, equipo, departamento, provincia, zona, notas,
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
        <button className="ab-btn" disabled={form.estado==='cancelado'} onClick={() => setF('estado','cancelado')} style={{ color:'var(--red)' }}>Cancelar mandato</button>
        {saveError && <span style={{ marginLeft:12, fontSize:11, color:'#991b1b', fontWeight:600 }}>{saveError}</span>}
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Header */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#6d28d9,#9333ea)' }}>📜</div>
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
                  ['Responsable', form.responsable || '—',      'var(--accent)'],
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

          {/* TAB Información */}
          {tab === 'man-info' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                <div>
                  <div className="va-meta-card" style={{ marginBottom:14 }}>
                    <div className="va-meta-head"><span className="dot"/>Oportunidad vinculada</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div className="ir">
                        <span className="ir-k" style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ width:14, height:14, borderRadius:3, background:'#0078d4', color:'#fff', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>D</span>
                          Oportunidad
                        </span>
                        <span className="ir-v" style={{ fontSize:11 }}>
                          {oportunidad
                            ? <span style={{ fontWeight:600 }}>{oportunidad.nombre} <span className="tag tag-blue" style={{ marginLeft:6, fontSize:9 }}>{oportunidad.tipo}</span></span>
                            : <span style={{ color:'var(--text4)' }}>—</span>}
                        </span>
                      </div>
                      <div className="ir"><span className="ir-k">Vía</span>
                        <span className="ir-v">
                          <select style={sel} value={form.via} onChange={e => setF('via', e.target.value)}>
                            {VIA_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        </span>
                      </div>
                      <div className="ir"><span className="ir-k">Tipo de mandato</span>
                        <span className="ir-v">
                          <select style={sel} value={form.tipo} onChange={e => setF('tipo', e.target.value)}>
                            {TIPO_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="va-meta-card">
                    <div className="va-meta-head accent-green"><span className="dot"/>Cuenta · heredada de Dynamics</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)', marginBottom:6 }}>{cuenta?.nombre || '—'} ↗</div>
                      <div className="ir"><span className="ir-k">Tipo</span><span className="ir-v">{cuenta?.tipo || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Sector</span><span className="ir-v">{cuenta?.sector || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Teléfono</span><span className="ir-v">{cuenta?.telefono || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Dirección</span><span className="ir-v" style={{ fontSize:10 }}>{cuenta?.direccion || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Ciudad</span><span className="ir-v">{cuenta?.ciudad || '—'}</span></div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="va-meta-card" style={{ marginBottom:14 }}>
                    <div className="va-meta-head accent-purple"><span className="dot"/>Estado del mandato</div>
                    <div style={{ padding:'10px 14px' }}>
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
                      <div className="ir"><span className="ir-k">Responsable</span>
                        <span className="ir-v"><input style={{ ...inp, width:160 }} value={form.responsable} onChange={e => setF('responsable', e.target.value)} placeholder="Nombre" /></span>
                      </div>
                      <div className="ir"><span className="ir-k">Equipo</span>
                        <span className="ir-v"><input style={{ ...inp, width:200 }} value={form.equipo} onChange={e => setF('equipo', e.target.value)} placeholder="Equipo asignado" /></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="va-meta-card">
                    <div className="va-meta-head"><span className="dot"/>Notas</div>
                    <div style={{ padding:'10px 14px' }}>
                      <textarea style={ta} value={form.notas} onChange={e => setF('notas', e.target.value)} placeholder="Notas internas sobre el mandato..." />
                    </div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* TAB Activos vinculados */}
          {tab === 'man-activos' && (
            <div className="tab-content active"><div className="info-pad">
              <div className="of-section">🏢 ACTIVOS VINCULADOS AL MANDATO</div>
              <div style={{ fontSize:10, color:'var(--text4)', marginBottom:10 }}>
                Un mandato puede cubrir <strong>uno o varios activos</strong> (ej. Merlin encarga 3 edificios = 1 mandato con 3 activos).
                {(form.tipo === 'alquiler' || form.tipo === 'venta') && activosLinked.length === 0 && (
                  <span style={{ color:'#dc2626', marginLeft:6, fontWeight:600 }}>· Tipo {TIPO_LABEL[form.tipo]} requiere al menos 1 activo.</span>
                )}
              </div>

              {activosLinked.length === 0 ? (
                <div style={{ padding:'12px 0', color:'var(--text4)', fontSize:12 }}>Sin activos vinculados todavía.</div>
              ) : (
                <table className="pat-table" style={{ marginBottom:14 }}>
                  <thead><tr><th>Activo</th><th>Ciudad</th><th>Uso</th><th>SBA total</th><th>SBA asignada</th><th></th></tr></thead>
                  <tbody>
                    {activosLinked.map(l => l.activos && (
                      <tr key={l.id}>
                        <td><div style={{ fontWeight:600, color:'var(--accent)' }}>{l.activos.nombre}</div><div style={{ fontSize:9, color:'var(--text4)', fontFamily:'var(--mono)' }}>{l.activos.ref}</div></td>
                        <td style={{ fontSize:11 }}>{l.activos.ciudad || '—'}</td>
                        <td style={{ fontSize:11 }}>{l.activos.uso || '—'}</td>
                        <td className="mono" style={{ fontSize:11 }}>{l.activos.sba ? l.activos.sba.toLocaleString('es-ES') : '—'}</td>
                        <td>
                          <input type="number" style={{ ...inp, width:90 }} defaultValue={l.sba_asignada ?? ''}
                            onBlur={e => updateSbaAsignada(l.id, e.target.value)} placeholder="—" />
                        </td>
                        <td style={{ textAlign:'right' }}>
                          <button onClick={() => removeActivo(l.id)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:14 }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <select style={{ ...sel, minWidth:280 }} value="" onChange={e => { if (e.target.value) addActivo(e.target.value) }}>
                  <option value="">+ Añadir activo al mandato...</option>
                  {activosDisponibles.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre} — {a.ciudad || ''} · {a.ref}</option>
                  ))}
                </select>
                {activosDisponibles.length === 0 && <span style={{ fontSize:10, color:'var(--text4)' }}>No quedan activos en catálogo.</span>}
              </div>
            </div></div>
          )}

          {/* TAB Vigencia */}
          {tab === 'man-vigencia' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <div className="of-section">📅 FECHAS</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Fecha de firma</span>
                      <span className="ir-v"><input type="date" style={{ ...sel, width:150 }} value={form.fecha_firma || ''} onChange={e => setF('fecha_firma', e.target.value)} /></span>
                    </div>
                    <div className="ir"><span className="ir-k">Fecha de inicio</span>
                      <span className="ir-v"><input type="date" style={{ ...sel, width:150 }} value={form.fecha_inicio || ''} onChange={e => setF('fecha_inicio', e.target.value)} /></span>
                    </div>
                    <div className="ir"><span className="ir-k" style={{ fontWeight:700 }}>Fecha de vencimiento</span>
                      <span className="ir-v"><input type="date" style={{ ...sel, width:150 }} value={form.fecha_vencimiento || ''} onChange={e => setF('fecha_vencimiento', e.target.value)} /></span>
                    </div>
                    <div className="ir"><span className="ir-k">Días restantes</span>
                      <span className="ir-v">{dr === null ? '—' : (dr < 0 ? <span style={{ color:'var(--red)', fontWeight:700 }}>Vencido hace {Math.abs(dr)}d</span> : <span style={{ color: dr <= 30 ? 'var(--red)' : dr <= 60 ? 'var(--amber)' : 'var(--text)' }}>{dr} días</span>)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="of-section">🔔 ALERTAS Y PRÓRROGA</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Días de preaviso</span>
                      <span className="ir-v"><input type="number" style={inp} value={form.preaviso_dias} onChange={e => setF('preaviso_dias', e.target.value)} /></span>
                    </div>
                    <div className="ir"><span className="ir-k">Alertar X días antes</span>
                      <span className="ir-v"><input type="number" style={inp} value={form.alerta_dias} onChange={e => setF('alerta_dias', e.target.value)} /></span>
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
                      <span className="ir-v"><input type="number" style={inp} value={form.prorroga_meses} onChange={e => setF('prorroga_meses', e.target.value)} disabled={!form.prorroga_tacita} /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* TAB Exclusividad */}
          {tab === 'man-excl' && (
            <div className="tab-content active"><div className="info-pad">
              <div className="of-section">🤝 RÉGIMEN DE EXCLUSIVIDAD</div>
              <div className="info-block" style={{ marginBottom:14 }}>
                <div className="ir"><span className="ir-k" style={{ fontWeight:700 }}>Modo</span>
                  <span className="ir-v">
                    <select style={sel} value={form.exclusividad_modo} onChange={e => setF('exclusividad_modo', e.target.value)}>
                      {EXCL_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                    </select>
                  </span>
                </div>
              </div>

              {form.exclusividad_modo === 'coexclusiva' && (
                <>
                  <div className="of-section">👥 AGENTE EXTERNO CO-EXCLUSIVO</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Cuenta del agente</span>
                      <span className="ir-v">
                        <select style={{ ...sel, minWidth:240 }} value={form.cuenta_agente_id} onChange={e => { setF('cuenta_agente_id', e.target.value); setF('contacto_agente_id','') }}>
                          <option value="">Selecciona agencia / consultora...</option>
                          {cuentasCatalog.map(c => <option key={c.dynamics_id} value={c.dynamics_id}>{c.nombre}</option>)}
                        </select>
                      </span>
                    </div>
                    <div className="ir"><span className="ir-k">Contacto del agente</span>
                      <span className="ir-v">
                        <select style={{ ...sel, minWidth:240 }} value={form.contacto_agente_id} onChange={e => setF('contacto_agente_id', e.target.value)} disabled={!form.cuenta_agente_id}>
                          <option value="">Selecciona contacto...</option>
                          {contactosAgente.map(c => <option key={c.dynamics_id} value={c.dynamics_id}>{c.nombre} — {c.email || c.telefono || ''}</option>)}
                        </select>
                        {form.cuenta_agente_id && contactosAgente.length === 0 && (
                          <span style={{ fontSize:10, color:'var(--text4)', marginLeft:8 }}>Sin contactos en esta cuenta.</span>
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div></div>
          )}

          {/* TAB Fees */}
          {tab === 'man-fees' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <div className="of-section">💰 FEES BASE</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Fee porcentaje (%)</span>
                      <span className="ir-v"><input type="number" step="0.1" style={inp} value={form.fee_porcentaje} onChange={e => setF('fee_porcentaje', e.target.value)} placeholder="—" /></span>
                    </div>
                    <div className="ir"><span className="ir-k">Fee fijo (€)</span>
                      <span className="ir-v"><input type="number" style={inp} value={form.fee_eur_fijo} onChange={e => setF('fee_eur_fijo', e.target.value)} placeholder="—" /></span>
                    </div>
                    <div className="ir"><span className="ir-k">Mínimo garantizado (€)</span>
                      <span className="ir-v"><input type="number" style={inp} value={form.fee_min_garantizado} onChange={e => setF('fee_min_garantizado', e.target.value)} placeholder="—" /></span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="of-section">📈 SLIDING SCALE (avanzado)</div>
                  <div className="info-block" style={{ marginBottom:14 }}>
                    <div style={{ padding:'8px 0' }}>
                      <div style={{ fontSize:10, color:'var(--text4)', marginBottom:4 }}>Define tramos en JSON si el fee escala con el importe.</div>
                      <textarea style={{ ...ta, minHeight:60, fontFamily:'var(--mono)', fontSize:10 }} value={form.fee_sliding} onChange={e => setF('fee_sliding', e.target.value)} placeholder='{"tramos":[{"hasta":1000000,"pct":2},{"desde":1000000,"pct":3}]}' />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reparto del fee total entre colaboradores / equipos / agencias */}
              <div className="of-section" style={{ marginTop:18 }}>🤝 REPARTO DEL FEE (% sobre el total cobrado por Savills)</div>
              <div style={{ fontSize:10, color:'var(--text4)', marginBottom:10 }}>
                El 100% es el fee total de Savills. Cada línea indica qué porcentaje se lleva un equipo interno o un colaborador externo (otra agencia).
              </div>

              {(() => {
                const reparto = form.fee_reparto
                const sum = reparto.reduce((s, r) => s + (Number(r.porcentaje) || 0), 0)
                const restante = 100 - sum
                const sumOk = sum === 100
                const updateRow = (idx, key, val) => {
                  setF('fee_reparto', reparto.map((r,i) => i === idx ? { ...r, [key]: val } : r))
                }
                const addRow = () => setF('fee_reparto', [...reparto, { nombre:'', tipo:'interno', porcentaje:'' }])
                const removeRow = idx => setF('fee_reparto', reparto.filter((_,i) => i !== idx))

                return (
                  <>
                    {reparto.length === 0 ? (
                      <div style={{ padding:'12px 0', color:'var(--text4)', fontSize:12 }}>Sin reparto definido. El 100% del fee se lo lleva el responsable del mandato.</div>
                    ) : (
                      <table className="pat-table" style={{ marginBottom:10 }}>
                        <thead><tr><th style={{ width:'45%' }}>Colaborador / equipo / agencia</th><th>Tipo</th><th style={{ textAlign:'right' }}>Porcentaje</th><th></th></tr></thead>
                        <tbody>
                          {reparto.map((r, idx) => (
                            <tr key={idx}>
                              <td>
                                <input style={{ ...inp, width:'100%' }} value={r.nombre || ''} onChange={e => updateRow(idx, 'nombre', e.target.value)} placeholder="Nombre / equipo / agencia externa" />
                              </td>
                              <td>
                                <select style={sel} value={r.tipo || 'interno'} onChange={e => updateRow(idx, 'tipo', e.target.value)}>
                                  <option value="interno">Interno (Savills)</option>
                                  <option value="externo">Externo (otra agencia)</option>
                                </select>
                              </td>
                              <td style={{ textAlign:'right' }}>
                                <input type="number" step="0.5" min="0" max="100" style={{ ...inp, width:80, textAlign:'right' }} value={r.porcentaje ?? ''} onChange={e => updateRow(idx, 'porcentaje', e.target.value)} placeholder="0" />
                                <span style={{ marginLeft:4, fontSize:11, color:'var(--text3)' }}>%</span>
                              </td>
                              <td style={{ textAlign:'right' }}>
                                <button onClick={() => removeRow(idx)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:14 }}>×</button>
                              </td>
                            </tr>
                          ))}
                          <tr style={{ background:'var(--gray-lt)' }}>
                            <td colSpan="2" style={{ fontWeight:700, fontSize:11, textAlign:'right', paddingRight:10 }}>Total reparto</td>
                            <td style={{ textAlign:'right', fontWeight:700, fontSize:12, color: sumOk ? 'var(--green)' : (sum > 100 ? 'var(--red)' : 'var(--amber)') }}>
                              {sum}%
                              {!sumOk && <div style={{ fontSize:9, fontWeight:500, color: sum > 100 ? 'var(--red)' : 'var(--amber)' }}>
                                {sum > 100 ? `Excede en ${sum - 100}%` : `Falta ${restante}%`}
                              </div>}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                    <button className="ab-btn" onClick={addRow} style={{ fontSize:11 }}>+ Añadir colaborador</button>
                    {reparto.length > 0 && !sumOk && (
                      <span style={{ marginLeft:12, fontSize:11, color: sum > 100 ? '#dc2626' : 'var(--amber)', fontWeight:600 }}>
                        ⚠ El reparto debe sumar 100% para ser válido.
                      </span>
                    )}
                  </>
                )
              })()}
            </div></div>
          )}

          {tab === 'man-docs' && <StubTab label="Documentos del mandato" />}
          {tab === 'man-act'  && <StubTab label="Actividades asociadas" />}
          {tab === 'man-conf' && <StubTab label="Confidencialidad" />}

        </div>
      </div>
    </div>
  )
}
