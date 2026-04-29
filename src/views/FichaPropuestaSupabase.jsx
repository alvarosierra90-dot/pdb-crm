import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'

// Mismas pestañas que la mock (FichaPropuesta TABS / TAB_LABELS)
const PRY_TABS = [
  ['datos',        'Datos del proyecto'],
  ['equipos',      'Equipos y participantes'],
  ['trazabilidad', 'Trazabilidad'],
  ['docs',         'Documentación'],
  ['resumen',      'Resumen'],
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

const sel = { width:'auto', padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inp = { width:120, padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inpFull = { ...inp, width:'100%' }
const ta = { width:'100%', padding:'6px 9px', fontSize:11.5, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit', minHeight:60, lineHeight:1.5, resize:'vertical' }

function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('es-ES') }

function StubTab({ label }) {
  return (
    <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>
      <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
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
  const [oportunidad, setOportunidad] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const [form, setForm] = useState({
    nombre:'', tipo:'', linea:'', estado:'',
    fees:'', fecha_presentacion:'', fecha_resolucion:'', fecha_cierre:'',
    equipo:'', responsable:'', notas:'',
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

  const startEdit = () => {
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
    })
    setSaveError(null)
    setEditing(true)
  }
  const cancelEdit = () => { setEditing(false); setSaveError(null) }

  const saveEdit = async () => {
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
      updated_at:         new Date().toISOString(),
    }).eq('id', propuesta.id)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    setEditing(false)
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
        {editing ? (
          <>
            <button className="ab-btn save" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando…' : '💾 Guardar'}</button>
            <button className="ab-btn" onClick={cancelEdit} disabled={saving}>Cancelar</button>
          </>
        ) : (
          <>
            <button className="ab-btn save" onClick={startEdit}>✎ Editar</button>
            <button className="ab-btn" onClick={() => navigate('propuestas')}>← Volver</button>
            <div className="ab-sep"/>
            <button className="ab-btn" disabled style={{ opacity:0.45 }}>Marcar como ganada</button>
          </>
        )}
        {saveError && <span style={{ marginLeft:12, fontSize:11, color:'#991b1b', fontWeight:600 }}>{saveError}</span>}
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>📄</div>
              <div style={{ flex:1 }}>
                <div className="ah-ref">
                  <span style={{ background:'#f3e8ff', color:'#7c3aed', border:'1px solid #d8b4fe', padding:'0 5px', borderRadius:3, fontSize:9, fontWeight:700 }}>PROPUESTA</span>
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
                    </div>
                  </div>

                  <div className="va-meta-card">
                    <div className="va-meta-head accent-green"><span className="dot"/>Cuenta · heredada de Dynamics</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)', marginBottom:6 }}>{cuenta?.nombre || '—'}</div>
                      <div className="ir"><span className="ir-k">Tipo</span><span className="ir-v">{cuenta?.tipo || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">Sector</span><span className="ir-v">{cuenta?.sector || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">Teléfono</span><span className="ir-v">{cuenta?.telefono || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">Dirección</span><span className="ir-v" style={{ fontSize:10 }}>{cuenta?.direccion || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">CP / Ciudad</span><span className="ir-v">{[cuenta?.codigo_postal, cuenta?.ciudad].filter(Boolean).join(' · ') || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">País</span><span className="ir-v">🌍 {cuenta?.pais || 'España'}</span></div>
                      <div className="ir"><span className="ir-k">Web</span><span className="ir-v">{cuenta?.web || <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                    </div>
                  </div>
                </div>

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

          {tab === 'equipos'      && <div className="tab-content active"><StubTab label="Equipos y participantes" /></div>}
          {tab === 'trazabilidad' && <div className="tab-content active"><StubTab label="Trazabilidad" /></div>}
          {tab === 'docs'         && <div className="tab-content active"><StubTab label="Documentación" /></div>}
          {tab === 'resumen'      && <div className="tab-content active"><StubTab label="Resumen" /></div>}

        </div>
      </div>
    </div>
  )
}
