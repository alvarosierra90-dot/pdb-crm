import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { tipoOportunidad } from '../data/mockLeads'

const overlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.48)', zIndex:2000,
  display:'flex', alignItems:'center', justifyContent:'center',
}
const panel = {
  background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12,
  width:600, maxWidth:'94vw', maxHeight:'90vh', overflowY:'auto',
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

function Typeahead({ label, placeholder, value, onChange, onPick, options, fieldKey = 'nombre' }) {
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
              key={o.dynamics_id}
              onMouseDown={() => onPick(o)}
              style={{ padding:'7px 10px', fontSize:12, cursor:'pointer', borderBottom:'1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              <div style={{ fontWeight:600 }}>{o[fieldKey]}</div>
              {o.tipo   && <div style={{ fontSize:10, color:'var(--text4)' }}>{o.tipo}</div>}
              {o.email  && <div style={{ fontSize:10, color:'var(--text4)' }}>{o.email}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TransformarLeadModal({ lead, onClose, onSuccess }) {
  const esGenerico = lead.tipo === 'generico'

  const [via, setVia]                = useState(lead.via || (esGenerico ? null : ''))
  const [cuentaQuery, setCuentaQuery]     = useState(lead.dynamics_accounts?.nombre || '')
  const [cuentaPick, setCuentaPick]       = useState(lead.dynamics_account_id ? { dynamics_id: lead.dynamics_account_id, nombre: lead.dynamics_accounts?.nombre } : null)
  const [contactoQuery, setContactoQuery] = useState(lead.dynamics_contacts?.nombre || '')
  const [contactoPick, setContactoPick]   = useState(lead.dynamics_contact_id ? { dynamics_id: lead.dynamics_contact_id, nombre: lead.dynamics_contacts?.nombre } : null)

  const [accounts, setAccounts] = useState([])
  const [contacts, setContacts] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(null)
  const [error, setError]           = useState(null)

  useEffect(() => {
    async function loadDynamics() {
      const [{ data: accs }, { data: cts }] = await Promise.all([
        supabase.from('dynamics_accounts').select('dynamics_id, nombre, tipo').order('nombre'),
        supabase.from('dynamics_contacts').select('dynamics_id, nombre, email, cuenta_dynamics_id').order('nombre'),
      ])
      setAccounts(accs || [])
      setContacts(cts || [])
    }
    loadDynamics()
  }, [])

  const tieneVinculo  = !!cuentaPick || !!contactoPick
  const viaOk         = esGenerico || !!via
  const puedeTransformar = tieneVinculo && viaOk && !submitting

  const handleTransformar = async () => {
    if (!puedeTransformar) return
    setSubmitting(true)
    setError(null)

    const tipoOpp = tipoOportunidad(lead.tipo, via)
    const dynId   = `dyn-opp-${Date.now().toString(36)}`
    const cuentaId   = cuentaPick?.dynamics_id   || null
    const contactoId = contactoPick?.dynamics_id || null

    const { error: e1 } = await supabase.from('dynamics_opportunities').insert({
      dynamics_id:          dynId,
      nombre:               lead.nombre,
      tipo:                 tipoOpp,
      cuenta_dynamics_id:   cuentaId,
      contacto_dynamics_id: contactoId,
      estado:               'abierta',
      fecha_creacion:       new Date().toISOString(),
    })
    if (e1) {
      setError(`Error creando oportunidad: ${e1.message}`)
      setSubmitting(false)
      return
    }

    const { error: e2 } = await supabase.from('leads').update({
      estado:                  'cualificado',
      via:                     esGenerico ? null : via,
      dynamics_account_id:     cuentaId,
      dynamics_contact_id:     contactoId,
      dynamics_opportunity_id: dynId,
      fecha_cualificacion:     new Date().toISOString(),
      cualificado_por:         'Sierra Álvaro',
      ultima_actividad:        new Date().toISOString(),
    }).eq('id', lead.id)

    if (e2) {
      setError(`Oportunidad creada pero el lead no se actualizó: ${e2.message}`)
      setSubmitting(false)
      return
    }

    setSubmitted({ dynId, tipoOpp })
    setSubmitting(false)
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
                  Oportunidad <strong>{submitted.tipoOpp}</strong> creada en Dynamics y vinculada al lead. El lead pasa a estado <strong>cualificado</strong>.
                </div>
              </div>
              <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>Oportunidad creada</div>
                <div style={{ fontSize:12, color:'var(--text)', fontWeight:600, fontFamily:'monospace' }}>{submitted.dynId}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Tipo: {submitted.tipoOpp}</div>
              </div>
              {(cuentaPick || contactoPick) && (
                <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>Vinculaciones</div>
                  {cuentaPick   && <div style={{ fontSize:11, color:'var(--text)', marginBottom:3 }}>🏢 Cuenta: <strong>{cuentaPick.nombre}</strong></div>}
                  {contactoPick && <div style={{ fontSize:11, color:'var(--text)' }}>👤 Contacto: <strong>{contactoPick.nombre}</strong></div>}
                </div>
              )}
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
                  Para transformar un lead es <strong>obligatorio</strong> vincularlo al menos a una Cuenta o Contacto de Dynamics. Selecciona del typeahead.
                </div>
              </div>

              {/* Vía: pitch o directo (no aplica a genérico) */}
              {!esGenerico && (
                <div>
                  <label style={lbl}>Vía de transformación *</label>
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    {[
                      { key:'pitch',   label:'Pitch',   desc:'Competimos por el mandato. Requiere Propuesta antes del Mandato.' },
                      { key:'directo', label:'Directo', desc:'Mandato directo, sin Propuesta competitiva.' },
                    ].map(opt => (
                      <div
                        key={opt.key}
                        onClick={() => setVia(opt.key)}
                        style={{
                          flex:1,
                          border: via === opt.key ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: via === opt.key ? 'var(--accent-lt)' : 'var(--surface)',
                          borderRadius:8, padding:'10px 12px', cursor:'pointer',
                        }}
                      >
                        <div style={{ fontSize:12, fontWeight:700, color: via === opt.key ? 'var(--accent)' : 'var(--text)' }}>
                          {via === opt.key ? '● ' : '○ '}{opt.label}
                        </div>
                        <div style={{ fontSize:10, color:'var(--text3)', marginTop:3, marginLeft:14 }}>{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Typeahead
                label="Cuenta vinculada (Dynamics)"
                placeholder="Buscar cuenta..."
                value={cuentaQuery}
                onChange={v => { setCuentaQuery(v); setCuentaPick(null) }}
                onPick={a => { setCuentaPick(a); setCuentaQuery(a.nombre) }}
                options={accounts}
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
              />
              {contactoPick && (
                <div style={{ fontSize:10, color:'#15803d' }}>✓ Contacto seleccionado: {contactoPick.nombre}</div>
              )}

              {!tieneVinculo && (
                <div style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>
                  ✗ Necesitas seleccionar al menos Cuenta o Contacto del typeahead
                </div>
              )}

              {/* Resumen de la transformación */}
              {tieneVinculo && viaOk && (
                <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1e40af', display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <span style={{ width:14, height:14, borderRadius:3, background:'#0078d4', color:'#fff', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>D</span>
                    Resumen
                  </div>
                  <div style={{ fontSize:11, color:'#1e3a8a', lineHeight:1.5 }}>
                    Se creará una Oportunidad de tipo <strong>{tipoOportunidad(lead.tipo, via)}</strong> en Dynamics, vinculada a {cuentaPick ? `cuenta "${cuentaPick.nombre}"` : '—'}{contactoPick ? ` y contacto "${contactoPick.nombre}"` : ''}. El lead pasará a <strong>cualificado</strong>.
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
                style={{
                  opacity: puedeTransformar ? 1 : 0.5,
                  cursor: puedeTransformar ? 'pointer' : 'not-allowed',
                }}
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
