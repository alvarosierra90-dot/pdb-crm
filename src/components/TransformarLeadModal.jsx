import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { tipoOportunidad } from '../data/mockLeads'

const overlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.48)', zIndex:2000,
  display:'flex', alignItems:'center', justifyContent:'center',
}
const panel = {
  background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12,
  width:640, maxWidth:'94vw', maxHeight:'90vh', overflowY:'auto',
  boxShadow:'0 20px 60px rgba(0,0,0,.22)',
}
const header = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  padding:'16px 20px 14px', borderBottom:'1px solid var(--border)',
}
const body = { padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }
const footer = { padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }
const lbl = { fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4, display:'block' }
const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', boxSizing:'border-box', outline:'none' }

function Typeahead({ label, placeholder, value, onChange, onPick, options, fieldKey = 'nombre', secondaryKey, tertiaryKey }) {
  const [focused, setFocused] = useState(false)
  const matches = !value
    ? options.slice(0, 8)
    : options.filter(o => (o[fieldKey] || '').toLowerCase().includes(value.toLowerCase())).slice(0, 8)

  return (
    <div style={{ position:'relative' }}>
      <label style={lbl}>{label}</label>
      <input
        style={inp}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {focused && matches.length > 0 && (
        <div style={{
          position:'absolute', top:'calc(100% + 2px)', left:0, right:0, zIndex:10,
          background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6,
          maxHeight:220, overflowY:'auto', boxShadow:'0 6px 20px rgba(0,0,0,0.08)',
        }}>
          {matches.map(o => (
            <div
              key={o.dynamics_id || o.id || o.ref}
              onMouseDown={() => onPick(o)}
              style={{ padding:'7px 10px', fontSize:12, cursor:'pointer', borderBottom:'1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <div style={{ fontWeight:600 }}>{o[fieldKey]}</div>
              {secondaryKey && o[secondaryKey] && <div style={{ fontSize:10, color:'var(--text4)' }}>{o[secondaryKey]}</div>}
              {tertiaryKey  && o[tertiaryKey]  && <div style={{ fontSize:10, color:'var(--text4)' }}>{o[tertiaryKey]}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

async function nextRef(prefix) {
  const year = new Date().getFullYear()
  const fullPrefix = `${prefix}-${year}-`
  const { data } = await supabase
    .from(prefix === 'PRY' ? 'propuestas' : prefix === 'DEM' ? 'demandas' : 'ofertas')
    .select('ref')
    .like('ref', `${fullPrefix}%`)
    .order('ref', { ascending: false })
    .limit(1)
    .maybeSingle()
  const last = data?.ref ? parseInt(String(data.ref).split('-').pop(), 10) : 0
  return `${fullPrefix}${String((isNaN(last) ? 0 : last) + 1).padStart(4, '0')}`
}

const ESQUEMAS = {
  // pitch=true: crea Oport + Propuesta (sea cual sea el tipo)
  pitch_demanda:  { oppType:'pitch_demanda',  destino:'propuesta', label:'Pitch Demanda → Propuesta' },
  pitch_oferta:   { oppType:'pitch_oferta',   destino:'propuesta', label:'Pitch Oferta → Propuesta' },
  pitch_generico: { oppType:'generica',       destino:'propuesta', label:'Pitch Genérico → Propuesta' },
  // pitch=false: crea Oport + (Demanda | Oferta | nada)
  directo_demanda:  { oppType:'demanda',  destino:'demanda',  label:'Mandato directo → Demanda' },
  directo_oferta:   { oppType:'oferta',   destino:'oferta',   label:'Mandato directo → Oferta' },
  directo_generico: { oppType:'generica', destino:'ninguno',  label:'Servicio genérico directo' },
}

export default function TransformarLeadModal({ lead, onClose, onSuccess }) {
  const { navigate } = useNav()
  const [pitch, setPitch] = useState(null) // null | true | false
  const [cuentaQuery, setCuentaQuery]     = useState(lead.dynamics_accounts?.nombre || '')
  const [cuentaPick, setCuentaPick]       = useState(lead.dynamics_account_id ? { dynamics_id: lead.dynamics_account_id, nombre: lead.dynamics_accounts?.nombre } : null)
  const [contactoQuery, setContactoQuery] = useState(lead.dynamics_contacts?.nombre || '')
  const [contactoPick, setContactoPick]   = useState(lead.dynamics_contact_id ? { dynamics_id: lead.dynamics_contact_id, nombre: lead.dynamics_contacts?.nombre } : null)
  const [activoQuery, setActivoQuery]     = useState('')
  const [activoPick, setActivoPick]       = useState(null)

  const [accounts, setAccounts] = useState([])
  const [contacts, setContacts] = useState([])
  const [activos, setActivos]   = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(null)
  const [error, setError]           = useState(null)
  const [warnings, setWarnings]     = useState([])     // [{ key, msg }]
  const [warningsOK, setWarningsOK] = useState(false)  // el broker ha aceptado los avisos

  useEffect(() => {
    async function loadAll() {
      const [{ data: accs }, { data: cts }, { data: acts }] = await Promise.all([
        supabase.from('dynamics_accounts').select('dynamics_id, nombre, tipo').order('nombre'),
        supabase.from('dynamics_contacts').select('dynamics_id, nombre, email, cuenta_dynamics_id').order('nombre'),
        supabase.from('activos').select('id, ref, nombre, ciudad, zona, uso').order('nombre'),
      ])
      setAccounts(accs || [])
      setContacts(cts || [])
      setActivos((acts || []).map(a => ({ ...a, _label: `${a.nombre} · ${a.zona || ''} ${a.ciudad || ''}`.trim() })))
    }
    loadAll()
  }, [])

  // Determina el esquema según pitch + lead.tipo
  const esquemaKey = pitch === null
    ? null
    : `${pitch ? 'pitch' : 'directo'}_${lead.tipo}`
  const esquema = esquemaKey ? ESQUEMAS[esquemaKey] : null

  const necesitaActivo = esquema?.destino === 'oferta'
  // Spec: Cuenta + Contacto SIEMPRE obligatorios (gate de cualificación)
  const tieneVinculo   = !!cuentaPick && !!contactoPick
  const activoOk       = !necesitaActivo || !!activoPick
  // Si hay avisos, el broker tiene que confirmar que los ha visto antes de transformar
  const avisosOk       = warnings.length === 0 || warningsOK
  const puedeTransformar = pitch !== null && tieneVinculo && activoOk && avisosOk && !submitting

  // Recalcular avisos cuando cambian cuenta / contacto / pitch / lead
  useEffect(() => {
    let cancel = false
    async function detectar() {
      const w = []
      // 1. Email o teléfono ya presente en otro lead
      const matchers = []
      if (lead.email)    matchers.push({ col:'email',    val:lead.email })
      if (lead.telefono) matchers.push({ col:'telefono', val:lead.telefono })
      for (const m of matchers) {
        const { data } = await supabase
          .from('leads')
          .select('ref, nombre, estado')
          .eq(m.col, m.val)
          .neq('id', lead.id)
          .limit(3)
        if (data && data.length) {
          w.push({
            key: `dup-${m.col}`,
            msg: `Ya existe ${data.length === 1 ? 'otro lead' : `${data.length} leads`} con el mismo ${m.col} (${m.val}): ${data.map(d => `${d.ref} · ${d.nombre}`).join(', ')}.`,
          })
        }
      }
      // 2. Cuenta con demanda activa similar (mismo lead.tipo=demanda → estatus ongoing)
      if (cuentaPick?.dynamics_id && lead.tipo === 'demanda') {
        const { data } = await supabase
          .from('demandas')
          .select('ref, nombre, estatus')
          .eq('dynamics_account_id', cuentaPick.dynamics_id)
          .in('estatus', ['ongoing','potencial'])
          .limit(3)
        if (data && data.length) {
          w.push({
            key: 'dup-demanda-cuenta',
            msg: `La cuenta ${cuentaPick.nombre} ya tiene ${data.length} demanda(s) en curso: ${data.map(d => `${d.ref}${d.nombre ? ' · ' + d.nombre : ''}`).join(', ')}. Verifica si son la misma búsqueda.`,
          })
        }
      }
      if (!cancel) {
        setWarnings(w)
        setWarningsOK(false)
      }
    }
    detectar()
    return () => { cancel = true }
  }, [cuentaPick?.dynamics_id, contactoPick?.dynamics_id, lead.id, lead.email, lead.telefono, lead.tipo])

  const handleTransformar = async () => {
    if (!puedeTransformar) return
    setSubmitting(true)
    setError(null)

    const dynOppId = `dyn-opp-${Date.now().toString(36)}`
    // Auto-deriva Cuenta desde Contacto si no se eligió una
    const cuentaId = cuentaPick?.dynamics_id
      || contactoPick?.cuenta_dynamics_id
      || null
    const contactoId = contactoPick?.dynamics_id || null
    const ahora = new Date().toISOString()
    const out = { dynOppId, oppType: esquema.oppType, destino: esquema.destino, destinoRef: null }

    // Demanda exige cuenta (NOT NULL en BD)
    if (esquema.destino === 'demanda' && !cuentaId) {
      setError('Para crear una Demanda necesitas seleccionar una Cuenta de Dynamics (o un Contacto con Cuenta vinculada).')
      setSubmitting(false)
      return
    }

    try {
      // 1) Crear Oportunidad en dynamics_opportunities
      const { error: e1 } = await supabase.from('dynamics_opportunities').insert({
        dynamics_id:          dynOppId,
        nombre:               lead.nombre,
        tipo:                 esquema.oppType,
        cuenta_dynamics_id:   cuentaId,
        contacto_dynamics_id: contactoId,
        estado:               'abierta',
        fecha_creacion:       ahora,
      })
      if (e1) throw new Error(`Oportunidad: ${e1.message}`)

      const leadUpdate = {
        estado:                  'cualificado',
        via:                     pitch ? 'pitch' : 'directo',
        dynamics_account_id:     cuentaId,
        dynamics_contact_id:     contactoId,
        dynamics_opportunity_id: dynOppId,
        fecha_cualificacion:     ahora,
        cualificado_por:         'Sierra Álvaro',
        ultima_actividad:        ahora,
      }

      // 2) Crear destino según esquema. NO se prefillan campos de contenido
      //    (nombre, tipo, notas, comentarios, equipo, responsable). Solo
      //    los FK estructurales obligatorios. El usuario los completa en
      //    la ficha del nuevo registro.
      // Propagación del equipo de trabajo: cada entidad downstream
      // hereda una copia editable del equipo del Lead. La copia es
      // independiente: editar el equipo del downstream no contamina
      // al lead origen.
      const equipoHeredado = Array.isArray(lead.equipo_trabajo) ? lead.equipo_trabajo : []

      let destinoView = null
      if (esquema.destino === 'propuesta') {
        const ref = await nextRef('PRY')
        const nombreDerivado = cuentaPick?.nombre || null
        const { data: prop, error: e2 } = await supabase.from('propuestas').insert({
          ref,
          nombre:                  nombreDerivado,
          dynamics_opportunity_id: dynOppId,
          dynamics_account_id:     cuentaId,
          lead_id:                 lead.id,
          equipo_trabajo:          equipoHeredado,
        }).select('id, ref').single()
        if (e2) throw new Error(`Propuesta: ${e2.message}`)
        leadUpdate.propuesta_id = prop.id
        out.destinoRef = prop.ref
        destinoView = 'ficha-propuesta'
      } else if (esquema.destino === 'demanda') {
        const ref = await nextRef('DEM')
        // El nombre se deriva de la Cuenta vinculada para que la ficha
        // no aparezca "sin nombre". Si no hay cuenta, queda null.
        const nombreDerivado = cuentaPick?.nombre || null
        const { data: dem, error: e2 } = await supabase.from('demandas').insert({
          ref,
          nombre:                  nombreDerivado,
          dynamics_opportunity_id: dynOppId,
          dynamics_account_id:     cuentaId,
          equipo_trabajo:          equipoHeredado,
        }).select('id, ref').single()
        if (e2) throw new Error(`Demanda: ${e2.message}`)
        leadUpdate.demanda_id = dem.id
        out.destinoRef = dem.ref
        destinoView = 'ficha-demanda'
      } else if (esquema.destino === 'oferta') {
        const ref = await nextRef('OFE')
        const { data: ofe, error: e2 } = await supabase.from('ofertas').insert({
          ref,
          activo_id:               activoPick.id,
          dynamics_opportunity_id: dynOppId,
          dynamics_account_id:     cuentaId,
          equipo_trabajo:          equipoHeredado,
        }).select('id, ref').single()
        if (e2) throw new Error(`Oferta: ${e2.message}`)
        leadUpdate.oferta_id = ofe.id
        out.destinoRef = ofe.ref
        destinoView = 'ficha-oferta'
      }

      // 3) Actualizar el lead
      const { error: e3 } = await supabase.from('leads').update(leadUpdate).eq('id', lead.id)
      if (e3) throw new Error(`Lead: ${e3.message}`)

      out.destinoView = destinoView
      setSubmitted(out)
      setSubmitting(false)

      // 4) Redirigir directamente a la ficha del registro creado.
      //    Si no hay destino (genérico directo), se queda en el lead.
      if (destinoView && out.destinoRef) {
        // Pequeño delay para que el usuario vea el éxito antes de saltar
        setTimeout(() => {
          if (onSuccess) onSuccess()
          navigate(destinoView, { id: out.destinoRef })
        }, 1200)
      }
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>

        <div style={header}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>⚡ Transformar lead</div>
            <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>{lead.ref} · {lead.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text4)' }}>×</button>
        </div>

        {submitted ? (
          <>
            <div style={body}>
              <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, padding:14, display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>✓ Lead transformado correctamente</div>
                <div style={{ fontSize:11, color:'#166534' }}>
                  Oportunidad <strong>{submitted.oppType}</strong> creada en Dynamics.
                  {submitted.destino !== 'ninguno' && <> Se ha generado además una <strong>{submitted.destino}</strong> ({submitted.destinoRef}).</>}
                  {' '}El lead pasa a <strong>cualificado</strong>.
                </div>
              </div>
              <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>Registros creados</div>
                <div style={{ fontSize:11, color:'var(--text)', marginBottom:3 }}>⚡ Oportunidad: <strong style={{ fontFamily:'var(--mono)', fontVariantNumeric:'tabular-nums' }}>{submitted.dynOppId}</strong> · tipo {submitted.oppType}</div>
                {submitted.destino !== 'ninguno' && submitted.destinoRef && (
                  <div style={{ fontSize:11, color:'var(--text)' }}>📄 {submitted.destino === 'propuesta' ? 'Propuesta' : submitted.destino === 'demanda' ? 'Demanda' : 'Oferta'}: <strong style={{ fontFamily:'var(--mono)', fontVariantNumeric:'tabular-nums' }}>{submitted.destinoRef}</strong></div>
                )}
              </div>
            </div>
            <div style={footer}>
              <button className="ab-btn save" onClick={() => onSuccess ? onSuccess() : onClose()}>Cerrar</button>
            </div>
          </>
        ) : (
          <>
            <div style={body}>
              {/* Vinculación obligatoria */}
              <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#92400e', display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  ⚠️ Vinculación obligatoria
                </div>
                <div style={{ fontSize:11, color:'#7c2d12' }}>
                  Para transformar son <strong>obligatorios Cuenta y Contacto</strong> de Dynamics. Selecciona ambos del typeahead.
                </div>
              </div>

              {/* Pitch yes/no */}
              <div>
                <label style={lbl}>¿Hay pitch? *</label>
                <div style={{ display:'flex', gap:8, marginTop:4 }}>
                  {[
                    { v:true,  label:'Sí, hay pitch',  desc:'Vamos a competir → se generará una Propuesta/Proyecto.' },
                    { v:false, label:'No, directo',    desc:'Mandato directo → se generará Demanda u Oferta directamente (según tipo).' },
                  ].map(opt => (
                    <div
                      key={String(opt.v)}
                      onClick={() => setPitch(opt.v)}
                      style={{
                        flex:1,
                        border: pitch === opt.v ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: pitch === opt.v ? 'var(--accent-lt)' : 'var(--surface)',
                        borderRadius:8, padding:'10px 12px', cursor:'pointer',
                      }}
                    >
                      <div style={{ fontSize:12, fontWeight:700, color: pitch === opt.v ? 'var(--accent)' : 'var(--text)' }}>
                        {pitch === opt.v ? '● ' : '○ '}{opt.label}
                      </div>
                      <div style={{ fontSize:10, color:'var(--text3)', marginTop:3, marginLeft:14 }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Typeahead
                label="Cuenta vinculada (Dynamics)"
                placeholder="Buscar cuenta..."
                value={cuentaQuery}
                onChange={v => { setCuentaQuery(v); setCuentaPick(null) }}
                onPick={a => { setCuentaPick(a); setCuentaQuery(a.nombre) }}
                options={accounts}
                secondaryKey="tipo"
              />
              {cuentaPick && (
                <div style={{ fontSize:10, color:'#15803d' }}>✓ Cuenta seleccionada: {cuentaPick.nombre}</div>
              )}

              <Typeahead
                label="Contacto vinculado (Dynamics)"
                placeholder="Buscar contacto..."
                value={contactoQuery}
                onChange={v => { setContactoQuery(v); setContactoPick(null) }}
                onPick={c => { setContactoPick(c); setContactoQuery(c.nombre) }}
                options={contacts}
                secondaryKey="email"
              />
              {contactoPick && (
                <div style={{ fontSize:10, color:'#15803d' }}>✓ Contacto seleccionado: {contactoPick.nombre}</div>
              )}

              {!tieneVinculo && (
                <div style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>
                  ✗ Necesitas seleccionar Cuenta <strong>y</strong> Contacto del typeahead.
                </div>
              )}

              {/* Avisos de duplicados — no bloquean, requieren acuse de recibo */}
              {warnings.length > 0 && (
                <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#c2410c', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                    ⚠️ Posibles duplicados detectados
                  </div>
                  <ul style={{ margin:0, paddingLeft:18, fontSize:11, color:'#7c2d12', lineHeight:1.5 }}>
                    {warnings.map(w => (<li key={w.key} style={{ marginBottom:4 }}>{w.msg}</li>))}
                  </ul>
                  <label style={{ marginTop:10, display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#7c2d12', cursor:'pointer' }}>
                    <input
                      type="checkbox"
                      checked={warningsOK}
                      onChange={e => setWarningsOK(e.target.checked)}
                      style={{ accentColor:'#c2410c' }}
                    />
                    He revisado los duplicados y quiero continuar igualmente.
                  </label>
                </div>
              )}

              {/* Activo (solo cuando directo + oferta) */}
              {necesitaActivo && (
                <>
                  <Typeahead
                    label="Activo a comercializar (PDB) *"
                    placeholder="Buscar activo existente..."
                    value={activoQuery}
                    onChange={v => { setActivoQuery(v); setActivoPick(null) }}
                    onPick={a => { setActivoPick(a); setActivoQuery(a.nombre) }}
                    options={activos}
                    fieldKey="nombre"
                    secondaryKey="zona"
                    tertiaryKey="ciudad"
                  />
                  {activoPick ? (
                    <div style={{ fontSize:10, color:'#15803d' }}>✓ Activo seleccionado: {activoPick.nombre} ({activoPick.ref})</div>
                  ) : (
                    <div style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>
                      ✗ Necesitas seleccionar el activo. Si no existe aún, créalo primero en el módulo Activos y vuelve aquí.
                    </div>
                  )}
                </>
              )}

              {/* Resumen */}
              {esquema && tieneVinculo && activoOk && (
                <div style={{ background:'#faf5ec', border:'1px solid #ece0c9', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#5a4828', marginBottom:4 }}>Resumen de la transformación</div>
                  <div style={{ fontSize:11, color:'#1e3a8a', lineHeight:1.5 }}>
                    {esquema.label}.
                    {' '}Oportunidad <strong>{esquema.oppType}</strong>
                    {esquema.destino !== 'ninguno' && <> + <strong>{esquema.destino === 'propuesta' ? 'Propuesta/Proyecto' : esquema.destino === 'demanda' ? 'Demanda' : 'Oferta'}</strong></>}
                    {activoPick && <> sobre el activo <strong>{activoPick.nombre}</strong></>}
                    . Lead → <strong>cualificado</strong>.
                  </div>
                </div>
              )}

              {error && (
                <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, padding:10, fontSize:11, color:'#991b1b' }}>
                  {error}
                </div>
              )}
            </div>

            <div style={footer}>
              <button className="ab-btn" onClick={onClose}>Cancelar</button>
              <button
                className="ab-btn save"
                onClick={handleTransformar}
                disabled={!puedeTransformar}
                style={{ opacity: puedeTransformar ? 1 : 0.5, cursor: puedeTransformar ? 'pointer' : 'not-allowed' }}
              >
                {submitting ? 'Transformando…' : '⚡ Transformar lead'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
