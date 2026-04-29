import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'

const DEM_TABS = [
  ['dem-info',     'Información Demanda'],
  ['dem-req',      'Requisitos'],
  ['dem-zona',     'Zona búsqueda'],
  ['dem-seg',      'Seguimiento comercial'],
  ['dem-360',      'Ciclo 360°'],
  ['dem-act',      'Actividades'],
  ['dem-partes',   'Partes involucradas'],
  ['dem-docs',     'Documentos'],
  ['dem-neg',      'Negociaciones en curso'],
  ['dem-followup', 'Follow-up'],
  ['dem-conf',     'Confidencialidad'],
]

const USOS_TIPOLOGIAS = {
  'Oficinas': ['Oficina tradicional','Coworking','Subarriendo','Business park','Sede única (HQ)'],
  'Logístico / Industrial': ['Nave logística','Nave industrial','Última milla','Plataforma logística','Cross-docking'],
  'Retail': ['High Street','Local en centro comercial','Parque comercial','Local stand-alone','Flagship store'],
  'Centros comerciales': ['Centro comercial dominante','Centro comercial secundario','Parque de medianas','Outlet','Participación en centro'],
  'Residencial': ['Vivienda plurifamiliar','Vivienda unifamiliar','Obra nueva','Segunda mano'],
  'Living (PRS / BTR / Flex)': ['Build to Rent (BTR)','Build to Sell (BTS)','Flex living','Student housing','Senior living','Coliving'],
  'Hoteles': ['Hotel urbano','Hotel vacacional','Resort','Aparthotel','Hotel Boutique','Hostal'],
  'Suelos': ['Suelo finalista','Suelo en desarrollo','Suelo urbanizable'],
  'Alternativos': ['Data center','Self-storage','Sanitario','Educativo'],
  'Mixto': ['Uso mixto'],
}

const RAZONES_LEASING = ['Expansión / Crecimiento','Reducción','Reubicación','Reagrupación','Creación','Obsoleto']

const PROVINCIAS_LISTA = ['Madrid','Barcelona','Valencia','Sevilla','Bilbao','Málaga','Zaragoza','Alicante','Las Palmas','Mallorca']
const ZONAS_MADRID = ['CBD','M-30','A-1 · Alcobendas','A-1 · Tres Cantos','A-2 · Corredor del Henares','A-3 · Vallecas','A-4 · Getafe','A-5 · Pozuelo','A-6 · Las Rozas','M-40','M-50','Centro','Salamanca','Chamberí','Chamartín','Castellana']

// Estilo coherente con of-inp/of-sel
const sel = { width:'auto', padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inp = { width:80,    padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inpFull = { ...inp, width:'100%' }
const ta  = { width:'100%', padding:'6px 9px', fontSize:11.5, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit', minHeight:60, lineHeight:1.5, resize:'vertical' }

function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('es-ES') }

const ESTADO_OPTS = [
  { v:'ongoing',           label:'En curso' },
  { v:'potencial',         label:'Potencial' },
  { v:'paralizada',        label:'Paralizado' },
  { v:'descartada',        label:'Descartado' },
  { v:'cerrada_concedido', label:'Cerrada · Concedido' },
  { v:'cerrada_perdida',   label:'Cerrada · Perdida' },
]
const ESTADO_LABEL = Object.fromEntries(ESTADO_OPTS.map(o => [o.v, o.label]))

function StubTab({ label }) {
  return (
    <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>
      <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
      <div style={{ fontWeight:600, color:'var(--text2)', marginBottom:4 }}>{label}</div>
      <div>Sección disponible cuando completes la información básica y guardes la demanda.</div>
    </div>
  )
}

// Chip selector reutilizable (provincias, zonas, contactos)
function Chip({ label, onRemove, color = 'var(--accent)' }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      background:'var(--accent-lt)', color, border:'1px solid var(--accent-bd)',
      padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500,
    }}>
      {label}
      {onRemove && <span style={{ cursor:'pointer', color:'var(--text4)', fontWeight:600 }} onClick={onRemove}>×</span>}
    </span>
  )
}

export default function FichaDemandaSupabase({ refOrId }) {
  const { navigate } = useNav()
  const [tab, setTab] = useState('dem-info')
  const [demanda, setDemanda] = useState(null)
  const [cuenta, setCuenta]   = useState(null)
  const [contactosCuenta, setContactosCuenta] = useState([])
  const [otrosContactosFull, setOtrosContactosFull] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const [form, setForm] = useState({
    nombre:'', estatus:'', notas:'',
    naturaleza:'', tipo_activo:'', uso_principal:'', tipologia:'', razon_busqueda:'', timing:'',
    sup_min:'', sup_max:'',
    presupuesto_tipo:'', alq_min:'', alq_max:'', venta_m2_min:'', venta_m2_max:'',
    provincias:[], zonas:[], calles:'', puntos_interes:'', puntos_evitar:'',
    otros_contactos:[],
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('demandas')
      .select(`
        *,
        dynamics_accounts:dynamics_account_id ( dynamics_id, nombre, tipo, sector, direccion, codigo_postal, ciudad, pais, telefono, web ),
        dynamics_opportunities:dynamics_opportunity_id ( dynamics_id, nombre, tipo )
      `)
      .eq('ref', refOrId)
      .maybeSingle()
    if (error) { setError(error.message); setDemanda(null); setLoading(false); return }
    if (!data)  { setError(`Demanda ${refOrId} no encontrada`); setDemanda(null); setLoading(false); return }
    setDemanda(data)
    setCuenta(data.dynamics_accounts)

    // Cargar todos los contactos de la cuenta para el typeahead
    if (data.dynamics_account_id) {
      const { data: cts } = await supabase
        .from('dynamics_contacts')
        .select('dynamics_id, nombre, email, telefono')
        .eq('cuenta_dynamics_id', data.dynamics_account_id)
        .order('nombre')
      setContactosCuenta(cts || [])
    } else {
      setContactosCuenta([])
    }

    // Resolver los otros contactos persistidos en jsonb a sus datos completos
    const ids = Array.isArray(data.otros_contactos) ? data.otros_contactos : []
    if (ids.length) {
      const { data: full } = await supabase
        .from('dynamics_contacts')
        .select('dynamics_id, nombre, email, telefono')
        .in('dynamics_id', ids)
      setOtrosContactosFull(full || [])
    } else {
      setOtrosContactosFull([])
    }

    setError(null)
    setLoading(false)
  }, [refOrId])

  useEffect(() => { load() }, [load])

  const startEdit = () => {
    if (!demanda) return
    const r = demanda.requisitos || {}
    setForm({
      nombre:           demanda.nombre || (cuenta?.nombre || ''),
      estatus:          demanda.estatus || 'ongoing',
      notas:            demanda.notas || '',
      naturaleza:       r.naturaleza || '',
      tipo_activo:      r.tipo_activo || '',
      uso_principal:    r.uso_principal || '',
      tipologia:        r.tipologia || '',
      razon_busqueda:   r.razon_busqueda || '',
      timing:           r.timing || '',
      sup_min:          r.sup_min || '',
      sup_max:          r.sup_max || '',
      presupuesto_tipo: r.presupuesto_tipo || '',
      alq_min:          r.alq_min || '',
      alq_max:          r.alq_max || '',
      venta_m2_min:     r.venta_m2_min || '',
      venta_m2_max:     r.venta_m2_max || '',
      provincias:       Array.isArray(r.provincias) ? r.provincias : [],
      zonas:            Array.isArray(r.zonas) ? r.zonas : [],
      calles:           r.calles || '',
      puntos_interes:   r.puntos_interes || '',
      puntos_evitar:    r.puntos_evitar || '',
      otros_contactos:  Array.isArray(demanda.otros_contactos) ? demanda.otros_contactos : [],
    })
    setSaveError(null)
    setEditing(true)
  }
  const cancelEdit = () => { setEditing(false); setSaveError(null) }

  const saveEdit = async () => {
    setSaving(true)
    const requisitos = {
      naturaleza:       form.naturaleza || undefined,
      tipo_activo:      form.tipo_activo || undefined,
      uso_principal:    form.uso_principal || undefined,
      tipologia:        form.tipologia || undefined,
      razon_busqueda:   form.razon_busqueda || undefined,
      timing:           form.timing || undefined,
      sup_min:          form.sup_min ? Number(form.sup_min) : undefined,
      sup_max:          form.sup_max ? Number(form.sup_max) : undefined,
      presupuesto_tipo: form.presupuesto_tipo || undefined,
      alq_min:          form.alq_min ? Number(form.alq_min) : undefined,
      alq_max:          form.alq_max ? Number(form.alq_max) : undefined,
      venta_m2_min:     form.venta_m2_min ? Number(form.venta_m2_min) : undefined,
      venta_m2_max:     form.venta_m2_max ? Number(form.venta_m2_max) : undefined,
      provincias:       form.provincias.length ? form.provincias : undefined,
      zonas:            form.zonas.length ? form.zonas : undefined,
      calles:           form.calles || undefined,
      puntos_interes:   form.puntos_interes || undefined,
      puntos_evitar:    form.puntos_evitar || undefined,
    }
    Object.keys(requisitos).forEach(k => requisitos[k] === undefined && delete requisitos[k])

    const payload = {
      nombre:    form.nombre.trim() || null,
      estatus:   form.estatus || 'ongoing',
      notas:     form.notas || null,
      requisitos: Object.keys(requisitos).length ? requisitos : null,
      otros_contactos: form.otros_contactos.length ? form.otros_contactos : null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('demandas').update(payload).eq('id', demanda.id)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    setEditing(false)
    await load()
  }

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const togglePick = (key, val) => {
    setForm(prev => {
      const arr = prev[key] || []
      return { ...prev, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
  }

  if (loading) return <div style={{ padding:32, color:'var(--text4)', fontSize:12 }}>Cargando…</div>
  if (error || !demanda) {
    return (
      <div style={{ padding:32 }}>
        <div style={{ fontSize:13, color:'#991b1b', marginBottom:12 }}>{error || 'No encontrada'}</div>
        <button className="ab-btn" onClick={() => navigate('demandas')}>← Volver a Demandas</button>
      </div>
    )
  }

  const reqs = demanda.requisitos || {}

  // Valores activos para mostrar fuera de edición o derivados durante edición
  const visNaturaleza   = reqs.naturaleza   || ''
  const visUso          = reqs.uso_principal|| ''
  const visTipologia    = reqs.tipologia    || ''
  const tipologiasDisp  = USOS_TIPOLOGIAS[editing ? form.uso_principal : visUso] || []
  const presTipo        = editing ? form.presupuesto_tipo : (reqs.presupuesto_tipo || '')
  const provinciasMostrar = editing ? form.provincias : (reqs.provincias || [])
  const zonasMostrar      = editing ? form.zonas : (reqs.zonas || [])

  // Otros contactos disponibles (no añadidos aún)
  const idsOtros = (editing ? form.otros_contactos : (demanda.otros_contactos || []))
  const otrosListaFull = editing
    ? contactosCuenta.filter(c => idsOtros.includes(c.dynamics_id))
    : otrosContactosFull
  const otrosDisponibles = contactosCuenta.filter(c => !idsOtros.includes(c.dynamics_id))

  const tituloHeader = demanda.nombre || cuenta?.nombre || '(Sin nombre)'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <div className="action-bar">
        {editing ? (
          <>
            <button className="ab-btn save" onClick={saveEdit} disabled={saving}>
              {saving ? 'Guardando…' : '💾 Guardar'}
            </button>
            <button className="ab-btn" onClick={cancelEdit} disabled={saving}>Cancelar</button>
          </>
        ) : (
          <>
            <button className="ab-btn save" onClick={startEdit}>✎ Editar</button>
            <button className="ab-btn" onClick={() => navigate('demandas')}>← Volver</button>
            <div className="ab-sep"/>
            <button className="ab-btn" disabled style={{ opacity:0.45 }}>Transformar</button>
            <button className="ab-btn" disabled style={{ opacity:0.45 }}>Desactivar</button>
            <div className="ab-sep"/>
            <button className="ab-btn" disabled style={{ opacity:0.45 }}>✅ Asignar tarea</button>
          </>
        )}
        {saveError && <span style={{ marginLeft:12, fontSize:11, color:'#991b1b', fontWeight:600 }}>{saveError}</span>}
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Header */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>🔍</div>
              <div style={{ flex:1 }}>
                <div className="ah-ref">
                  <span style={{ background:'var(--accent-lt)', color:'var(--accent)', border:'1px solid var(--accent-bd)', padding:'0 5px', borderRadius:3, fontSize:9, fontWeight:700 }}>DEMANDA</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{demanda.ref}</span>
                </div>
                <div className="ah-name">
                  {editing
                    ? <input style={{ ...inpFull, fontSize:18, fontWeight:700, padding:'4px 8px' }} value={form.nombre} onChange={e => setF('nombre', e.target.value)} placeholder="Nombre de la demanda" />
                    : tituloHeader}
                </div>
                <div className="ah-addr">
                  📍 {[cuenta?.direccion, cuenta?.codigo_postal, cuenta?.ciudad].filter(Boolean).join(', ') || 'Dirección no disponible'} · Creada: {fmtDate(demanda.created_at)} · {CURRENT_USER.nombre}
                </div>
                <div className="ah-tags">
                  <span className="tag tag-green">● {ESTADO_LABEL[demanda.estatus] || demanda.estatus || '—'}</span>
                  {visNaturaleza && (
                    visNaturaleza === 'Inversión'
                      ? <span className="tag" style={{ background:'#fffbeb', color:'var(--amber)', border:'1px solid var(--amber-bd)', fontWeight:700 }}>🏦 Capital Markets</span>
                      : <span className="tag tag-blue">{visNaturaleza}</span>
                  )}
                  {visUso       && <span className="tag tag-blue">{visUso}</span>}
                  {visTipologia && <span className="tag tag-gray">{visTipologia}</span>}
                  {(reqs.sup_min || reqs.sup_max) && <span className="tag tag-gray">{reqs.sup_min || '?'}–{reqs.sup_max || '?'} m²</span>}
                </div>
              </div>
              <div style={{ flexShrink:0, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:1, background:'var(--border)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', fontSize:10, alignSelf:'flex-start' }}>
                {[
                  ['Estado', ESTADO_LABEL[demanda.estatus] || demanda.estatus || '—', 'var(--green)'],
                  ['Confidencial', 'No', null],
                  ['Equipo', '—', null],
                  ['Responsable', CURRENT_USER.nombre, 'var(--accent)'],
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
            {DEM_TABS.map(([k, label]) => (
              <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</div>
            ))}
          </div>

          {/* TAB: Información Demanda */}
          {tab === 'dem-info' && (
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
                          {demanda.dynamics_opportunities
                            ? <span style={{ fontWeight:600 }}>{demanda.dynamics_opportunities.nombre} <span className="tag tag-blue" style={{ marginLeft:6, fontSize:9 }}>{demanda.dynamics_opportunities.tipo}</span></span>
                            : <span style={{ color:'var(--text4)' }}>—</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="va-meta-card" style={{ marginBottom:14 }}>
                    <div className="va-meta-head accent-green"><span className="dot"/>Cuenta · heredada de Dynamics</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)', marginBottom:6, cursor:'pointer' }}>{cuenta?.nombre || '—'} ↗</div>
                      <div className="ir"><span className="ir-k">Tipo</span><span className="ir-v">{cuenta?.tipo || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">Sector</span><span className="ir-v">{cuenta?.sector || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">Teléfono</span><span className="ir-v">{cuenta?.telefono || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">Dirección</span><span className="ir-v" style={{ fontSize:10 }}>{cuenta?.direccion || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">Código postal</span><span className="ir-v">{cuenta?.codigo_postal || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">Ciudad</span><span className="ir-v">{cuenta?.ciudad || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">País</span><span className="ir-v link">🌍 {cuenta?.pais || 'España'}</span></div>
                      <div className="ir"><span className="ir-k">Web</span><span className="ir-v">{cuenta?.web || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="va-meta-card" style={{ marginBottom:14 }}>
                    <div className="va-meta-head accent-purple"><span className="dot"/>Estado de la demanda</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div className="ir">
                        <span className="ir-k">Motivo del estado</span>
                        <span className="ir-v">
                          {editing
                            ? <select style={sel} value={form.estatus} onChange={e => setF('estatus', e.target.value)}>
                                {ESTADO_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                              </select>
                            : (ESTADO_LABEL[demanda.estatus] || demanda.estatus || '—')}
                        </span>
                      </div>
                      <div className="ir"><span className="ir-k">Equipo</span><span className="ir-v">Leasing Oficinas — MAD</span></div>
                    </div>
                  </div>

                  <div className="va-meta-card">
                    <div className="va-meta-head"><span className="dot"/>Notas</div>
                    <div style={{ padding:'10px 14px' }}>
                      {editing
                        ? <textarea style={ta} value={form.notas} onChange={e => setF('notas', e.target.value)} placeholder="Notas internas sobre la demanda..." />
                        : (demanda.notas || <span style={{ color:'var(--text4)' }}>—</span>)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="va-meta-card">
                    <div className="va-meta-head accent-red"><span className="dot"/>Otros contactos asociados</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div style={{ fontSize:10, color:'var(--text4)', marginBottom:8 }}>
                        Contactos adicionales de <strong>{cuenta?.nombre || '(cuenta)'}</strong>.
                      </div>

                      {otrosListaFull.length === 0 && !editing && (
                        <div style={{ fontSize:11, color:'var(--text4)', padding:'8px 0' }}>No hay contactos adicionales.</div>
                      )}

                      {otrosListaFull.length > 0 && (
                        <table className="pat-table">
                          <thead><tr><th>Nombre</th><th>Email</th>{editing && <th></th>}</tr></thead>
                          <tbody>
                            {otrosListaFull.map(c => (
                              <tr key={c.dynamics_id}>
                                <td style={{ fontWeight:600 }}>{c.nombre}</td>
                                <td style={{ fontSize:10, color:'var(--text3)' }}>{c.email || '—'}</td>
                                {editing && (
                                  <td style={{ textAlign:'right' }}>
                                    <button onClick={() => setF('otros_contactos', form.otros_contactos.filter(id => id !== c.dynamics_id))}
                                      style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:14 }}>×</button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {editing && (
                        <div style={{ marginTop:10 }}>
                          <select
                            style={{ ...sel, width:'100%' }}
                            value=""
                            onChange={e => {
                              if (e.target.value) {
                                setF('otros_contactos', [...form.otros_contactos, e.target.value])
                              }
                            }}
                          >
                            <option value="">+ Añadir contacto de la cuenta...</option>
                            {otrosDisponibles.map(c => (
                              <option key={c.dynamics_id} value={c.dynamics_id}>{c.nombre} — {c.email || c.telefono || ''}</option>
                            ))}
                          </select>
                          {otrosDisponibles.length === 0 && (
                            <div style={{ fontSize:10, color:'var(--text4)', marginTop:4 }}>
                              No hay más contactos disponibles en la cuenta.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* TAB: Requisitos */}
          {tab === 'dem-req' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <div className="of-section">📋 REQUISITOS GENERALES</div>
                  <div className="info-block" style={{ marginBottom:10 }}>
                    <div className="ir"><span className="ir-k" style={{ fontWeight:700, color:'#0f172a' }}>Naturaleza</span>
                      <span className="ir-v">{editing
                        ? <select style={sel} value={form.naturaleza} onChange={e => setF('naturaleza', e.target.value)}>
                            <option value="">—</option><option>Leasing</option><option>Inversión</option>
                          </select>
                        : (visNaturaleza || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                    <div className="ir"><span className="ir-k">Tipo activo</span>
                      <span className="ir-v">{editing
                        ? <select style={sel} value={form.tipo_activo} onChange={e => setF('tipo_activo', e.target.value)}>
                            <option value="">—</option><option>Edificio</option><option>Suelo</option>
                          </select>
                        : (reqs.tipo_activo || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                    <div className="ir"><span className="ir-k" style={{ fontWeight:700, color:'var(--accent)' }}>Uso principal</span>
                      <span className="ir-v">{editing
                        ? <select style={sel} value={form.uso_principal} onChange={e => { setF('uso_principal', e.target.value); setF('tipologia','') }}>
                            <option value="">—</option>
                            {Object.keys(USOS_TIPOLOGIAS).map(u => <option key={u}>{u}</option>)}
                          </select>
                        : (visUso || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                    <div className="ir"><span className="ir-k" style={{ fontWeight:700, color:'var(--purple)' }}>Tipología</span>
                      <span className="ir-v">{editing
                        ? <select style={sel} value={form.tipologia} onChange={e => setF('tipologia', e.target.value)} disabled={!form.uso_principal}>
                            <option value="">—</option>
                            {tipologiasDisp.map(t => <option key={t}>{t}</option>)}
                          </select>
                        : (visTipologia || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                    <div className="ir"><span className="ir-k">Razón búsqueda</span>
                      <span className="ir-v">{editing
                        ? <select style={sel} value={form.razon_busqueda} onChange={e => setF('razon_busqueda', e.target.value)}>
                            <option value="">—</option>
                            {RAZONES_LEASING.map(r => <option key={r}>{r}</option>)}
                          </select>
                        : (reqs.razon_busqueda || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                    <div className="ir"><span className="ir-k">Timing proyecto</span>
                      <span className="ir-v">{editing
                        ? <input type="date" style={{ ...sel, width:130 }} value={form.timing} onChange={e => setF('timing', e.target.value)} />
                        : fmtDate(reqs.timing)}</span>
                    </div>
                  </div>

                  <div className="of-section">📐 SUPERFICIE</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Sup. desde (m²)</span>
                      <span className="ir-v">{editing
                        ? <input style={inp} type="number" value={form.sup_min} onChange={e => setF('sup_min', e.target.value)} placeholder="—" />
                        : (reqs.sup_min ? `${Number(reqs.sup_min).toLocaleString('es-ES')} m²` : <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                    <div className="ir"><span className="ir-k">Sup. hasta (m²)</span>
                      <span className="ir-v">{editing
                        ? <input style={inp} type="number" value={form.sup_max} onChange={e => setF('sup_max', e.target.value)} placeholder="—" />
                        : (reqs.sup_max ? `${Number(reqs.sup_max).toLocaleString('es-ES')} m²` : <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="of-section">💰 PRESUPUESTO</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k" style={{ fontWeight:700 }}>Tipo</span>
                      <span className="ir-v">{editing
                        ? <select style={sel} value={form.presupuesto_tipo} onChange={e => setF('presupuesto_tipo', e.target.value)}>
                            <option value="">—</option><option>Alquiler</option><option>Venta</option><option>Alquiler / Venta</option>
                          </select>
                        : (reqs.presupuesto_tipo || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                    {(presTipo === 'Alquiler' || presTipo === 'Alquiler / Venta') && (
                      <div style={{ marginTop:8, paddingTop:8, borderTop:'1px dashed var(--border)' }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--teal)', marginBottom:4, textTransform:'uppercase', letterSpacing:'.04em' }}>Alquiler</div>
                        <div className="ir"><span className="ir-k">Alquiler desde €/m²/mes</span>
                          <span className="ir-v">{editing
                            ? <input style={inp} type="number" value={form.alq_min} onChange={e => setF('alq_min', e.target.value)} placeholder="—" />
                            : (reqs.alq_min || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                        </div>
                        <div className="ir"><span className="ir-k">Alquiler hasta €/m²/mes</span>
                          <span className="ir-v">{editing
                            ? <input style={inp} type="number" value={form.alq_max} onChange={e => setF('alq_max', e.target.value)} placeholder="—" />
                            : (reqs.alq_max || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                        </div>
                      </div>
                    )}
                    {(presTipo === 'Venta' || presTipo === 'Alquiler / Venta') && (
                      <div style={{ marginTop:8, paddingTop:8, borderTop:'1px dashed var(--border)' }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--amber)', marginBottom:4, textTransform:'uppercase', letterSpacing:'.04em' }}>Venta</div>
                        <div className="ir"><span className="ir-k">€/m² desde</span>
                          <span className="ir-v">{editing
                            ? <input style={inp} type="number" value={form.venta_m2_min} onChange={e => setF('venta_m2_min', e.target.value)} placeholder="—" />
                            : (reqs.venta_m2_min || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                        </div>
                        <div className="ir"><span className="ir-k">€/m² hasta</span>
                          <span className="ir-v">{editing
                            ? <input style={inp} type="number" value={form.venta_m2_max} onChange={e => setF('venta_m2_max', e.target.value)} placeholder="—" />
                            : (reqs.venta_m2_max || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* TAB: Zona búsqueda — chips de provincias + chips de zonas */}
          {tab === 'dem-zona' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <div className="of-section">🗺 PROVINCIAS DE INTERÉS</div>
                  <div className="info-block" style={{ minHeight:180 }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10, minHeight:30 }}>
                      {provinciasMostrar.length === 0 && !editing && (
                        <span style={{ fontSize:11, color:'var(--text4)' }}>Ninguna provincia añadida.</span>
                      )}
                      {provinciasMostrar.map(p => (
                        <Chip key={p} label={p}
                          onRemove={editing ? () => togglePick('provincias', p) : null} />
                      ))}
                    </div>
                    {editing && (
                      <select style={{ ...sel, width:'auto' }} value=""
                        onChange={e => { if (e.target.value) togglePick('provincias', e.target.value) }}>
                        <option value="">+ Añadir provincia</option>
                        {PROVINCIAS_LISTA.filter(p => !form.provincias.includes(p)).map(p => <option key={p}>{p}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <div className="of-section">📍 ZONAS DE BÚSQUEDA</div>
                  <div className="info-block" style={{ minHeight:180 }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10, minHeight:30 }}>
                      {zonasMostrar.length === 0 && !editing && (
                        <span style={{ fontSize:11, color:'var(--text4)' }}>Ninguna zona añadida.</span>
                      )}
                      {zonasMostrar.map(z => (
                        <Chip key={z} label={z}
                          onRemove={editing ? () => togglePick('zonas', z) : null} />
                      ))}
                    </div>
                    {editing && (
                      <select style={{ ...sel, width:'auto' }} value=""
                        onChange={e => { if (e.target.value) togglePick('zonas', e.target.value) }}>
                        <option value="">+ Añadir zona</option>
                        {ZONAS_MADRID.filter(z => !form.zonas.includes(z)).map(z => <option key={z}>{z}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="info-block" style={{ marginTop:12 }}>
                    <div className="ir"><span className="ir-k">Calles específicas</span>
                      <span className="ir-v" style={{ flex:1 }}>{editing
                        ? <input style={inpFull} value={form.calles} onChange={e => setF('calles', e.target.value)} placeholder="Ej. Castellana 50–120, Serrano 1–60" />
                        : (reqs.calles || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                    <div className="ir"><span className="ir-k">Puntos de interés</span>
                      <span className="ir-v" style={{ flex:1 }}>{editing
                        ? <input style={inpFull} value={form.puntos_interes} onChange={e => setF('puntos_interes', e.target.value)} placeholder="Cerca de metro, autopistas..." />
                        : (reqs.puntos_interes || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                    <div className="ir"><span className="ir-k">Puntos a evitar</span>
                      <span className="ir-v" style={{ flex:1 }}>{editing
                        ? <input style={inpFull} value={form.puntos_evitar} onChange={e => setF('puntos_evitar', e.target.value)} placeholder="Zonas en obras, polígonos..." />
                        : (reqs.puntos_evitar || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {tab === 'dem-seg'      && <div className="tab-content active"><StubTab label="Seguimiento comercial" /></div>}
          {tab === 'dem-360'      && <div className="tab-content active"><StubTab label="Ciclo 360°" /></div>}
          {tab === 'dem-act'      && <div className="tab-content active"><StubTab label="Actividades" /></div>}
          {tab === 'dem-partes'   && <div className="tab-content active"><StubTab label="Partes involucradas" /></div>}
          {tab === 'dem-docs'     && <div className="tab-content active"><StubTab label="Documentos" /></div>}
          {tab === 'dem-neg'      && <div className="tab-content active"><StubTab label="Negociaciones en curso" /></div>}
          {tab === 'dem-followup' && <div className="tab-content active"><StubTab label="Follow-up" /></div>}
          {tab === 'dem-conf'     && <div className="tab-content active"><StubTab label="Confidencialidad" /></div>}

        </div>
      </div>
    </div>
  )
}
