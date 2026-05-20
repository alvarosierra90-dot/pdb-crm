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

// Refs por entidad. Ofertas usan formato canonico 'OFR-NNNNNNN' (7 digitos
// zero-padded) porque OfertasList aplica formatRef(ref, 'OFR') — cualquier
// otra forma se hashea y la oferta se vuelve inalcanzable. Propuestas y
// demandas mantienen formato 'PRY-YYYY-NNNN' / 'DEM-YYYY-NNNN' (sus listas
// no aplican formatRef y la BD ya tiene refs en ese formato).
async function nextRef(prefix) {
  if (prefix === 'OFR') {
    const { data } = await supabase
      .from('ofertas')
      .select('ref').like('ref', 'OFR-%').order('ref', { ascending: false }).limit(1).maybeSingle()
    const last = data?.ref ? parseInt(String(data.ref).split('-').pop(), 10) : 0
    return `OFR-${String((isNaN(last) ? 0 : last) + 1).padStart(7, '0')}`
  }
  const year = new Date().getFullYear()
  const fullPrefix = `${prefix}-${year}-`
  const { data } = await supabase
    .from(prefix === 'PRY' ? 'propuestas' : 'demandas')
    .select('ref').like('ref', `${fullPrefix}%`).order('ref', { ascending: false }).limit(1).maybeSingle()
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
  // Pitch oferta admite varios activos (un mismo pitch puede cubrir N edificios).
  const [activosPitch, setActivosPitch]   = useState([])

  // Oportunidad existente · opcional. Si el broker vincula una, se reutiliza
  // su dynamics_id en lugar de crear una nueva (evita oportunidades huérfanas
  // en Dynamics cuando ya hay una abierta para la misma cuenta).
  const [oportunidadQuery, setOportunidadQuery] = useState('')
  const [oportunidadPick,  setOportunidadPick]  = useState(null)
  const [accounts, setAccounts] = useState([])
  const [contacts, setContacts] = useState([])
  const [activos, setActivos]   = useState([])
  const [oportunidades, setOportunidades] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(null)
  const [error, setError]           = useState(null)
  const [warnings, setWarnings]     = useState([])     // [{ key, msg }]
  const [warningsOK, setWarningsOK] = useState(false)  // el broker ha aceptado los avisos

  useEffect(() => {
    async function loadAll() {
      const [{ data: accs }, { data: cts }, { data: acts }, { data: opps }] = await Promise.all([
        supabase.from('dynamics_accounts').select('dynamics_id, nombre, tipo').order('nombre'),
        supabase.from('dynamics_contacts').select('dynamics_id, nombre, email, cuenta_dynamics_id').order('nombre'),
        // Cargamos dynamics_account_id (propietario en Dynamics) y propietario (texto)
        // para que en flujo oferta-directa la oferta herede automáticamente la cuenta
        // del propietario del activo (lo que aparece en Vinculaciones).
        supabase.from('activos').select('id, ref, nombre, ciudad, zona, uso, dynamics_account_id, propietario').order('nombre'),
        supabase.from('dynamics_opportunities')
          .select('dynamics_id, nombre, tipo, cuenta_dynamics_id, estado')
          .eq('estado', 'abierta')
          .order('nombre'),
      ])
      setAccounts(accs || [])
      setContacts(cts || [])
      setActivos((acts || []).map(a => ({ ...a, _label: `${a.nombre} · ${a.zona || ''} ${a.ciudad || ''}`.trim() })))
      setOportunidades(opps || [])
    }
    loadAll()
  }, [])

  // Si el broker elige una cuenta, filtramos las oportunidades por esa cuenta.
  // Si no, mostramos todas las abiertas.
  const oportunidadesFiltradas = cuentaPick?.dynamics_id
    ? oportunidades.filter(o => o.cuenta_dynamics_id === cuentaPick.dynamics_id)
    : oportunidades

  // Si cambian la cuenta y la oportunidad elegida ya no pertenece a ella, la limpiamos
  useEffect(() => {
    if (oportunidadPick && cuentaPick?.dynamics_id && oportunidadPick.cuenta_dynamics_id !== cuentaPick.dynamics_id) {
      setOportunidadPick(null)
      setOportunidadQuery('')
    }
  }, [cuentaPick?.dynamics_id])

  // Determina el esquema según pitch + lead.tipo
  const esquemaKey = pitch === null
    ? null
    : `${pitch ? 'pitch' : 'directo'}_${lead.tipo}`
  const esquema = esquemaKey ? ESQUEMAS[esquemaKey] : null

  // Activo obligatorio en directo_oferta (1 activo concreto).
  const necesitaActivo = esquema?.destino === 'oferta'
  // En pitch_oferta el broker PUEDE vincular varios activos al pitch (no es
  // obligatorio porque a veces se pitchea servicio sin activos identificados,
  // pero si los hay, se trasladan a la propuesta automáticamente).
  const esPitchOferta  = esquema?.oppType === 'pitch_oferta'
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

    // Si el broker vinculó una oportunidad existente, la reutilizamos.
    // En caso contrario creamos una nueva con el oppType del esquema.
    const reuseOpp = !!oportunidadPick
    const dynOppId = reuseOpp ? oportunidadPick.dynamics_id : `dyn-opp-${Date.now().toString(36)}`
    const oppTypeFinal = reuseOpp ? oportunidadPick.tipo : esquema.oppType
    // Auto-deriva Cuenta desde Contacto si no se eligió una
    const cuentaId = cuentaPick?.dynamics_id
      || contactoPick?.cuenta_dynamics_id
      || oportunidadPick?.cuenta_dynamics_id
      || null
    const contactoId = contactoPick?.dynamics_id || null
    const ahora = new Date().toISOString()
    const out = { dynOppId, oppType: oppTypeFinal, destino: esquema.destino, destinoRef: null, reused: reuseOpp }

    // Demanda exige cuenta (NOT NULL en BD)
    if (esquema.destino === 'demanda' && !cuentaId) {
      setError('Para crear una Demanda necesitas seleccionar una Cuenta de Dynamics (o un Contacto con Cuenta vinculada).')
      setSubmitting(false)
      return
    }

    try {
      // 1) Crear Oportunidad en dynamics_opportunities (solo si no se reutiliza una existente)
      if (!reuseOpp) {
        const { error: e1 } = await supabase.from('dynamics_opportunities').insert({
          dynamics_id:          dynOppId,
          nombre:               lead.nombre,
          tipo:                 oppTypeFinal,
          cuenta_dynamics_id:   cuentaId,
          contacto_dynamics_id: contactoId,
          estado:               'abierta',
          fecha_creacion:       ahora,
        })
        if (e1) throw new Error(`Oportunidad: ${e1.message}`)
      }

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
        // Si es pitch_oferta y el broker vinculó activos en este modal,
        // los trasladamos a propuestas.activos (jsonb) para que la ficha
        // de Propuesta los muestre ya vinculados.
        const activosJsonb = (esPitchOferta && activosPitch.length > 0)
          ? activosPitch.map(a => ({
              ref:       a.ref,
              nombre:    a.nombre,
              direccion: a.direccion || null,
              ciudad:    a.ciudad || null,
              uso:       a.uso || null,
              sba:       a.sba || null,
            }))
          : []
        const { data: prop, error: e2 } = await supabase.from('propuestas').insert({
          ref,
          nombre:                  nombreDerivado,
          dynamics_opportunity_id: dynOppId,
          dynamics_account_id:     cuentaId,
          lead_id:                 lead.id,
          equipo_trabajo:          equipoHeredado,
          activos:                 activosJsonb,
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
        const ref = await nextRef('OFR')
        // En una oferta, la cuenta de Vinculaciones es el PROPIETARIO del activo
        // (no el cliente del lead). Si el activo ya tiene dynamics_account_id
        // (propietario en Dynamics), lo usamos. Si no, fallback al cuentaPick.
        const cuentaOferta = activoPick?.dynamics_account_id || cuentaId
        // Pre-rellenamos SOLO los FKs y el equipo. El resto (tipologia, renta,
        // condiciones, stacking, espacios, fotos…) queda vacío. El broker
        // rellena la oferta desde cero en su propia ficha. La BD aplicará sus
        // DEFAULTs (estado='En curso', tipo_mercado='mercado', etc.).
        const insertPayload = {
          ref,
          activo_id:               activoPick.id,
          activo_ref:              activoPick.ref,    // para que OfertasList resuelva el nombre del activo
          dynamics_opportunity_id: dynOppId,
          dynamics_account_id:     cuentaOferta,
          equipo_trabajo:          equipoHeredado,
        }
        const { data: ofe, error: e2 } = await supabase.from('ofertas').insert(insertPayload).select('id, ref').single()
        if (e2) {
          // eslint-disable-next-line no-console
          console.error('TransformarLead · insert oferta falló', { payload: insertPayload, error: e2 })
          throw new Error(`Oferta: ${e2.message}${e2.details ? ` · ${e2.details}` : ''}${e2.hint ? ` · ${e2.hint}` : ''}`)
        }
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
                  {submitted.reused
                    ? <>Vinculado a la oportunidad existente <strong>{submitted.oppType}</strong> en Dynamics.</>
                    : <>Oportunidad <strong>{submitted.oppType}</strong> creada en Dynamics.</>}
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

              {/* Oportunidad existente · OPCIONAL. Si se elige, se reutiliza
                  en lugar de crear una nueva. */}
              <div>
                <Typeahead
                  label={`Oportunidad existente (opcional) · ${oportunidadesFiltradas.length} disponibles${cuentaPick ? ` para ${cuentaPick.nombre}` : ''}`}
                  placeholder={oportunidadesFiltradas.length === 0
                    ? 'Sin oportunidades abiertas — se creará una nueva al transformar'
                    : 'Buscar oportunidad existente para vincular...'}
                  value={oportunidadQuery}
                  onChange={v => { setOportunidadQuery(v); setOportunidadPick(null) }}
                  onPick={o => { setOportunidadPick(o); setOportunidadQuery(o.nombre) }}
                  options={oportunidadesFiltradas}
                  secondaryKey="tipo"
                  tertiaryKey="dynamics_id"
                />
                {oportunidadPick ? (
                  <div style={{ marginTop:6, padding:'8px 10px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:11, color:'#1e3a8a', flex:1 }}>
                      ✓ Se vinculará a la oportunidad <strong>{oportunidadPick.nombre}</strong> ({oportunidadPick.dynamics_id}) · tipo <strong>{oportunidadPick.tipo}</strong>. No se creará una nueva.
                    </span>
                    <button onClick={() => { setOportunidadPick(null); setOportunidadQuery('') }} style={{ background:'none', border:'1px solid #bfdbfe', color:'#1e3a8a', fontSize:10, padding:'3px 8px', borderRadius:4, cursor:'pointer' }}>Quitar</button>
                  </div>
                ) : (
                  <div style={{ marginTop:6, fontSize:10, color:'var(--text4)' }}>
                    Déjalo en blanco para crear una oportunidad nueva en Dynamics.
                  </div>
                )}
              </div>

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
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <div style={{ fontSize:10, color:'#15803d' }}>✓ Activo seleccionado: {activoPick.nombre} ({activoPick.ref})</div>
                      {(() => {
                        // El propietario del activo es quien aparecerá en la banda
                        // Vinculaciones de la oferta — no la cuenta del lead.
                        const propAcc = activoPick.dynamics_account_id
                          ? accounts.find(a => a.dynamics_id === activoPick.dynamics_account_id)
                          : null
                        if (propAcc) {
                          return (
                            <div style={{ padding:'8px 10px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6, fontSize:11, color:'#1e3a8a' }}>
                              ✓ La oferta se vinculará al <strong>propietario del activo</strong>: <strong>{propAcc.nombre}</strong>{propAcc.tipo ? ` · ${propAcc.tipo}` : ''}.
                            </div>
                          )
                        }
                        if (activoPick.propietario) {
                          return (
                            <div style={{ padding:'8px 10px', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:6, fontSize:11, color:'#7c2d12' }}>
                              ⚠ El activo tiene propietario textual <strong>{activoPick.propietario}</strong> pero sin cuenta Dynamics vinculada. La oferta usará la cuenta del lead como respaldo.
                            </div>
                          )
                        }
                        return (
                          <div style={{ padding:'8px 10px', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:6, fontSize:11, color:'#7c2d12' }}>
                            ⚠ El activo no tiene propietario asignado. La oferta usará la cuenta del lead. Después podrás asignar el propietario desde la ficha del activo.
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    <div style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>
                      ✗ Necesitas seleccionar el activo. Si no existe aún, créalo primero en el módulo Activos y vuelve aquí.
                    </div>
                  )}
                </>
              )}

              {/* Pitch_oferta · activos del pitch (opcional, multi). Se trasladan
                  a propuestas.activos para que la ficha de Propuesta los muestre
                  ya vinculados sin tener que añadirlos otra vez. */}
              {esPitchOferta && (
                <div style={{ background:'#f3e8ff', border:'1px solid #d8b4fe', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#6b5b8e', marginBottom:6 }}>
                    Activos del pitch (opcional · pitch_oferta)
                    <span style={{ marginLeft:6, padding:'1px 6px', background:'#6b5b8e', color:'#fff', borderRadius:9, fontSize:10 }}>{activosPitch.length}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#6b5b8e', marginBottom:10, lineHeight:1.5 }}>
                    Pitcheas el servicio de comercializar uno o varios edificios del propietario. Los activos vinculados aquí se trasladan a la propuesta automáticamente.
                  </div>

                  {/* Chips de activos ya añadidos */}
                  {activosPitch.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
                      {activosPitch.map(a => (
                        <div key={a.ref} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 8px 4px 10px', background:'#fff', border:'1px solid #d8b4fe', borderRadius:20, fontSize:11 }}>
                          <span style={{ fontWeight:600, color:'#6b5b8e' }}>{a.nombre || a.ref}</span>
                          {a.ciudad && <span style={{ color:'var(--text4)', fontSize:10 }}>· {a.ciudad}</span>}
                          <button
                            onClick={() => setActivosPitch(prev => prev.filter(x => x.ref !== a.ref))}
                            title="Quitar"
                            style={{ marginLeft:2, background:'transparent', border:'none', cursor:'pointer', color:'var(--text4)', fontSize:13, lineHeight:1, padding:'0 2px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Typeahead
                    label=""
                    placeholder="Buscar activo por nombre, dirección o ref..."
                    value={activoQuery}
                    onChange={v => { setActivoQuery(v) }}
                    onPick={a => {
                      if (!activosPitch.some(x => x.ref === a.ref)) {
                        setActivosPitch(prev => [...prev, a])
                      }
                      setActivoQuery('')
                    }}
                    options={activos.filter(a => !activosPitch.some(x => x.ref === a.ref))}
                    fieldKey="nombre"
                    secondaryKey="zona"
                    tertiaryKey="ciudad"
                  />
                </div>
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
