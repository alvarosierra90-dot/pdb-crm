import { useState, useMemo } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER } from '../lib/currentUser'

// Cascada para la rama pitch=No (spec sec.6).
// Demanda u Oferta directa → broker firma → modal genera Instrucción
// Dynamics + Mandato PDB con vía=directo, hereda equipo_trabajo y
// vincula la demanda/oferta al mandato recién creado. En el caso de
// oferta sell-side, el activo de la oferta queda registrado en
// mandato_activos para cumplir la regla "alquiler/venta exige activo".

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
const body = { padding:'18px 20px', display:'flex', flexDirection:'column', gap:16 }
const footer = { padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }
const lbl = { fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4, display:'block' }
const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', boxSizing:'border-box', outline:'none' }

const TIPO_MANDATO_OPTS = [
  { v:'alquiler',    label:'Alquiler' },
  { v:'venta',       label:'Venta' },
  { v:'demanda',     label:'Demanda (búsqueda para cliente)' },
  { v:'consultoria', label:'Consultoría' },
]

function defaultTipoMandato(origenTipo, oportunidadTipo, ofertaTipoOp) {
  if (origenTipo === 'demanda') return 'demanda'
  if (origenTipo === 'oferta') {
    if (ofertaTipoOp === 'Venta')     return 'venta'
    if (ofertaTipoOp === 'Alquiler')  return 'alquiler'
    if (oportunidadTipo === 'oferta') return 'alquiler'
    return 'alquiler'
  }
  return 'consultoria'
}

async function nextMandatoRef() {
  const year = new Date().getFullYear()
  const fullPrefix = `MAN-${year}-`
  const { data } = await supabase
    .from('mandatos')
    .select('ref')
    .like('ref', `${fullPrefix}%`)
    .order('ref', { ascending: false })
    .limit(1)
    .maybeSingle()
  const last = data?.ref ? parseInt(String(data.ref).split('-').pop(), 10) : 0
  return `${fullPrefix}${String((isNaN(last) ? 0 : last) + 1).padStart(4, '0')}`
}

// Props:
//   origen   = { tipo:'demanda'|'oferta', record }
//   oportunidad, cuenta
//   onClose, onSuccess
export default function FirmarMandatoModal({ origen, oportunidad, cuenta, onClose, onSuccess }) {
  const { navigate } = useNav()
  const today = new Date().toISOString().slice(0, 10)
  const [step, setStep] = useState('form')
  const [error, setError]    = useState(null)
  const [created, setCreated] = useState(null)

  const r = origen.record
  const ofertaTipoOp = origen.tipo === 'oferta' ? r.tipo_operacion : null
  const tipoDefault = defaultTipoMandato(origen.tipo, oportunidad?.tipo, ofertaTipoOp)

  const [form, setForm] = useState({
    fee_savills:       '',
    fecha_kickoff:     today,
    tipo_mandato:      tipoDefault,
    fecha_firma:       today,
    fecha_vencimiento: '',
    fee_eur_fijo:      '',
  })

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const errors = useMemo(() => {
    const e = []
    if (!r?.dynamics_opportunity_id) e.push('Falta oportunidad Dynamics asociada.')
    if (!r?.dynamics_account_id)     e.push('Falta cuenta asociada.')
    if (origen.tipo === 'oferta' && !r?.activo_id) e.push('La oferta no tiene activo vinculado.')
    if (form.fee_savills === '' || Number(form.fee_savills) <= 0) e.push('Indica el fee de la instrucción (€).')
    if (!form.fecha_kickoff) e.push('Indica la fecha de kickoff.')
    if (!form.tipo_mandato)  e.push('Selecciona el tipo de mandato.')
    if (!form.fecha_firma)   e.push('Indica la fecha de firma.')
    if (origen.tipo === 'demanda' && !['demanda','consultoria'].includes(form.tipo_mandato)) {
      e.push('Para una Demanda, el mandato debe ser tipo Demanda o Consultoría.')
    }
    if (origen.tipo === 'oferta' && !['alquiler','venta','consultoria'].includes(form.tipo_mandato)) {
      e.push('Para una Oferta sell-side, el mandato debe ser Alquiler, Venta o Consultoría.')
    }
    return e
  }, [origen, r, form])

  const valid = errors.length === 0

  const ejecutar = async () => {
    if (!valid) return
    setStep('submitting')
    setError(null)

    const ahora = new Date().toISOString()
    const dynInsId = `dyn-ins-${Date.now().toString(36)}`
    const feeSavills = Number(form.fee_savills)
    const feeMandato = form.fee_eur_fijo === '' ? feeSavills : Number(form.fee_eur_fijo)

    try {
      const { error: e1 } = await supabase.from('dynamics_instructions').insert({
        dynamics_id:             dynInsId,
        oportunidad_dynamics_id: r.dynamics_opportunity_id,
        estado:                  'kickoff',
        fee_savills:             feeSavills,
        fecha_kickoff:           form.fecha_kickoff,
      })
      if (e1) throw new Error(`Instrucción: ${e1.message}`)

      const ref = await nextMandatoRef()
      const titulo = (r.nombre || cuenta?.nombre || `Mandato ${ref}`)
      const equipoHeredado = Array.isArray(r.equipo_trabajo) ? r.equipo_trabajo : []

      const { data: mand, error: e2 } = await supabase.from('mandatos').insert({
        ref,
        titulo,
        dynamics_opportunity_id: r.dynamics_opportunity_id,
        dynamics_account_id:     r.dynamics_account_id,
        dynamics_instruction_id: dynInsId,
        tipo:                    form.tipo_mandato,
        via:                     'directo',
        estado:                  'en_curso',
        exclusividad:            true,
        exclusividad_modo:       'exclusiva',
        fecha_firma:             form.fecha_firma,
        fecha_vencimiento:       form.fecha_vencimiento || null,
        fee_eur_fijo:            feeMandato || null,
        responsable:             r.responsable || CURRENT_USER.nombre,
        equipo:                  r.equipo || null,
        equipo_trabajo:          equipoHeredado,
      }).select('id, ref').single()
      if (e2) throw new Error(`Mandato: ${e2.message}`)

      // Para Oferta: registrar el activo en mandato_activos (sell exige activo)
      if (origen.tipo === 'oferta' && r.activo_id) {
        const { error: e3 } = await supabase.from('mandato_activos').insert({
          mandato_id: mand.id,
          activo_id:  r.activo_id,
        })
        if (e3) throw new Error(`Activo del mandato: ${e3.message}`)
      }

      // Vincular el origen al mandato recién creado
      const tabla = origen.tipo === 'demanda' ? 'demandas' : 'ofertas'
      const { error: e4 } = await supabase.from(tabla)
        .update({ mandato_id: mand.id, updated_at: ahora })
        .eq('id', r.id)
      if (e4) throw new Error(`Vincular ${origen.tipo}: ${e4.message}`)

      setCreated({ instruction_id: dynInsId, mandato_ref: mand.ref })
      setStep('done')
    } catch (e) {
      setError(e.message)
      setStep('form')
    }
  }

  const irAlMandato = () => {
    if (!created) return
    if (onSuccess) onSuccess()
    navigate('ficha-mandato', { id: created.mandato_ref })
  }

  const tipoLabel = origen.tipo === 'demanda' ? 'Demanda' : 'Oferta'

  return (
    <div style={overlay} onClick={step === 'submitting' ? undefined : onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={header}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>📜 Firmar mandato</div>
            <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>{tipoLabel} {r.ref} · {r.nombre || cuenta?.nombre || '—'}</div>
          </div>
          {step !== 'submitting' && (
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text4)' }}>×</button>
          )}
        </div>

        {step === 'done' && created ? (
          <>
            <div style={body}>
              <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, padding:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#15803d', marginBottom:6 }}>✓ Mandato firmado</div>
                <div style={{ fontSize:11, color:'#166534', lineHeight:1.6 }}>
                  Instrucción <strong style={{ fontFamily:'monospace' }}>{created.instruction_id}</strong> creada en Dynamics.<br/>
                  Mandato <strong style={{ fontFamily:'monospace' }}>{created.mandato_ref}</strong> generado en PDB con vía <em>directo</em>.<br/>
                  {tipoLabel} <strong>{r.ref}</strong> ahora cuelga del mandato. Equipo de trabajo heredado.
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                Completa en la ficha del mandato: vigencia detallada, exclusividad/co-exclusiva y reparto del fee.
              </div>
            </div>
            <div style={footer}>
              <button className="ab-btn" onClick={onClose}>Cerrar</button>
              <button className="ab-btn save" onClick={irAlMandato}>📜 Ir al mandato {created.mandato_ref} →</button>
            </div>
          </>
        ) : (
          <>
            <div style={body}>
              <div style={{ background:'var(--accent-lt, #eff6ff)', border:'1px solid var(--accent-bd, #bfdbfe)', borderRadius:8, padding:12, fontSize:11, color:'var(--text3)' }}>
                Esta {tipoLabel.toLowerCase()} se creó sin pitch (vía <strong>directo</strong>). Al firmar se ejecuta la cascada: <strong>(1)</strong> abrir la instrucción en Dynamics → <strong>(2)</strong> crear el mandato en PDB → <strong>(3)</strong> vincular esta {tipoLabel.toLowerCase()} al mandato.
              </div>

              <div style={{ border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
                <div style={{ background:'#0078d4', color:'#fff', padding:'8px 12px', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:14, height:14, borderRadius:3, background:'#fff', color:'#0078d4', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>D</span>
                  1. Instrucción · Microsoft Dynamics 365
                </div>
                <div style={{ padding:'12px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={lbl}>Fee Savills (lifetime, €) *</label>
                    <input type="number" step="100" style={inp} value={form.fee_savills} onChange={e => setF('fee_savills', e.target.value)} placeholder="0" autoFocus />
                  </div>
                  <div>
                    <label style={lbl}>Fecha kickoff *</label>
                    <input type="date" style={inp} value={form.fecha_kickoff} onChange={e => setF('fecha_kickoff', e.target.value)} />
                  </div>
                </div>
                <div style={{ padding:'0 14px 12px', fontSize:10, color:'var(--text4)' }}>
                  Oportunidad <strong>{oportunidad?.nombre || r.dynamics_opportunity_id}</strong> · Cuenta <strong>{cuenta?.nombre || r.dynamics_account_id}</strong>
                </div>
              </div>

              <div style={{ border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
                <div style={{ background:'#7c3aed', color:'#fff', padding:'8px 12px', fontSize:11, fontWeight:700 }}>
                  📜 2. Mandato · PDB
                </div>
                <div style={{ padding:'12px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <label style={lbl}>Tipo de mandato *</label>
                    <select style={inp} value={form.tipo_mandato} onChange={e => setF('tipo_mandato', e.target.value)}>
                      {TIPO_MANDATO_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Fecha de firma *</label>
                    <input type="date" style={inp} value={form.fecha_firma} onChange={e => setF('fecha_firma', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Fecha de vencimiento</label>
                    <input type="date" style={inp} value={form.fecha_vencimiento} onChange={e => setF('fecha_vencimiento', e.target.value)} />
                  </div>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <label style={lbl}>Fee total mandato (€) — opcional, por defecto = fee Savills</label>
                    <input type="number" step="100" style={inp} value={form.fee_eur_fijo} onChange={e => setF('fee_eur_fijo', e.target.value)} placeholder={form.fee_savills || '0'} />
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:10, fontSize:11, color:'#991b1b' }}>
                  ⚠ {error}
                </div>
              )}
              {!valid && errors.length > 0 && (
                <div style={{ fontSize:10, color:'var(--text4)' }}>
                  Pendiente: {errors.join(' · ')}
                </div>
              )}
            </div>
            <div style={footer}>
              <button className="ab-btn" onClick={onClose} disabled={step === 'submitting'}>Cancelar</button>
              <button
                className="ab-btn save"
                onClick={ejecutar}
                disabled={!valid || step === 'submitting'}
                style={{ opacity: valid ? 1 : 0.5 }}
              >
                {step === 'submitting' ? 'Generando…' : '✓ Firmar y crear mandato'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
