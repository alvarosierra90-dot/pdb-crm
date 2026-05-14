import { useState, useMemo } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER } from '../lib/currentUser'

// Cascada Propuesta ganada → Instrucción (Dynamics) → Mandato (PDB).
// Spec sec. 5: "Cuando Propuesta = Ganada (cascada semi-automática)":
// 1) Modal lanza Dynamics donde el broker completa la Instrucción.
// 2) Al volver, sistema crea el Mandato en PDB con FK a esa Instrucción.
// 3) Broker completa los datos del Mandato (fees, exclusividad, vigencia).

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

// Sugerencia de tipo de mandato según el tipo de la Oportunidad
function defaultTipoMandato(oppTipo) {
  if (oppTipo === 'pitch_demanda' || oppTipo === 'demanda') return 'demanda'
  if (oppTipo === 'pitch_oferta'  || oppTipo === 'oferta')  return 'alquiler'
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

export default function MarcarPropuestaGanadaModal({ propuesta, oportunidad, cuenta, onClose, onSuccess }) {
  const { navigate } = useNav()
  const today = new Date().toISOString().slice(0, 10)
  const [step, setStep] = useState('form')          // 'form' | 'submitting' | 'done'
  const [error, setError]    = useState(null)
  const [created, setCreated] = useState(null)     // { instruction_id, mandato_ref }

  const [form, setForm] = useState({
    fee_savills:       '',                         // € — instrucción Dynamics
    fecha_kickoff:     today,                      // instrucción Dynamics
    tipo_mandato:      defaultTipoMandato(oportunidad?.tipo),
    fecha_firma:       today,
    fecha_vencimiento: '',
    fee_eur_fijo:      '',                         // € total mandato (default = fee_savills)
  })

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const errors = useMemo(() => {
    const e = []
    if (!propuesta?.dynamics_opportunity_id) e.push('La propuesta no tiene oportunidad Dynamics asociada.')
    if (!propuesta?.dynamics_account_id)     e.push('La propuesta no tiene cuenta asociada.')
    if (form.fee_savills === '' || Number(form.fee_savills) <= 0) e.push('Indica el fee de la instrucción (€).')
    if (!form.fecha_kickoff)                                       e.push('Indica la fecha de kickoff.')
    if (!form.tipo_mandato)                                        e.push('Selecciona el tipo de mandato.')
    if (!form.fecha_firma)                                         e.push('Indica la fecha de firma del mandato.')
    return e
  }, [propuesta, form])

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
      // 1) Crear Instrucción en Dynamics (simulado en local)
      const { error: e1 } = await supabase.from('dynamics_instructions').insert({
        dynamics_id:             dynInsId,
        oportunidad_dynamics_id: propuesta.dynamics_opportunity_id,
        estado:                  'kickoff',
        fee_savills:             feeSavills,
        fecha_kickoff:           form.fecha_kickoff,
      })
      if (e1) throw new Error(`Instrucción: ${e1.message}`)

      // 2) Crear Mandato en PDB con FKs a Oportunidad + Cuenta + Instrucción + Propuesta
      // SINCRONIZACIÓN AUTOMÁTICA desde la Propuesta (cada paso está conectado):
      //   · Oportunidad y Cuenta (Dynamics FKs)
      //   · Equipo de trabajo
      //   · Fee total + reparto + % + mínimo garantizado
      //   · Activos vinculados (via mandato_activos al final)
      const ref = await nextMandatoRef()
      const titulo = propuesta.nombre || cuenta?.nombre || `Mandato ${ref}`
      const equipoHeredado = Array.isArray(propuesta.equipo_trabajo) ? propuesta.equipo_trabajo : []
      const repartoHeredado = Array.isArray(propuesta.fee_reparto) ? propuesta.fee_reparto : []

      const { data: mand, error: e2 } = await supabase.from('mandatos').insert({
        ref,
        titulo,
        dynamics_opportunity_id: propuesta.dynamics_opportunity_id,
        dynamics_account_id:     propuesta.dynamics_account_id,
        dynamics_instruction_id: dynInsId,
        propuesta_id:            propuesta.id,
        tipo:                    form.tipo_mandato,
        via:                     'pitch',
        estado:                  'en_curso',
        exclusividad:            true,
        exclusividad_modo:       'exclusiva',
        fecha_firma:             form.fecha_firma,
        fecha_vencimiento:       form.fecha_vencimiento || null,
        // Fees: hereda total (override en formulario), %, mínimo y reparto
        fee_eur_fijo:            feeMandato || propuesta.fee_eur_fijo || null,
        fee_porcentaje:          propuesta.fee_porcentaje      || null,
        fee_min_garantizado:     propuesta.fee_min_garantizado || null,
        fee_reparto:             repartoHeredado,
        responsable:             propuesta.responsable || CURRENT_USER.nombre,
        equipo:                  propuesta.equipo || null,
        equipo_trabajo:          equipoHeredado,
      }).select('id, ref').single()
      if (e2) throw new Error(`Mandato: ${e2.message}`)

      // 2.b) Propagar activos vinculados (propuesta.activos → mandato_activos)
      const propuestaActivos = Array.isArray(propuesta.activos) ? propuesta.activos : []
      if (propuestaActivos.length > 0) {
        // Resolver ref → activo_id para cada item de la lista
        const refs = propuestaActivos.map(a => a?.ref).filter(Boolean)
        if (refs.length > 0) {
          const { data: rows = [] } = await supabase
            .from('activos').select('id, ref').in('ref', refs)
          const byRef = Object.fromEntries((rows || []).map(r => [r.ref, r.id]))
          const inserts = propuestaActivos
            .map(a => byRef[a?.ref])
            .filter(Boolean)
            .map(activo_id => ({ mandato_id: mand.id, activo_id, sba_asignada: null }))
          if (inserts.length > 0) {
            await supabase.from('mandato_activos').insert(inserts)
          }
        }
      }

      // 3) Cerrar la propuesta como ganada
      const { error: e3 } = await supabase.from('propuestas').update({
        estado:           'ganada',
        fecha_cierre:     today,
        motivo_descarte:  null,
        updated_at:       ahora,
      }).eq('id', propuesta.id)
      if (e3) throw new Error(`Propuesta: ${e3.message}`)

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

  return (
    <div style={overlay} onClick={step === 'submitting' ? undefined : onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={header}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Marcar propuesta como ganada</div>
            <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>{propuesta.ref} · {propuesta.nombre || cuenta?.nombre || '—'}</div>
          </div>
          {step !== 'submitting' && (
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text4)' }}>×</button>
          )}
        </div>

        {step === 'done' && created ? (
          <>
            <div style={body}>
              <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, padding:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#15803d', marginBottom:6 }}>✓ Cascada completada</div>
                <div style={{ fontSize:11, color:'#166534', lineHeight:1.6 }}>
                  Propuesta <strong>{propuesta.ref}</strong> marcada como ganada.<br/>
                  Instrucción <strong style={{ fontFamily:'monospace' }}>{created.instruction_id}</strong> creada en Dynamics (estado <em>kickoff</em>).<br/>
                  Mandato <strong style={{ fontFamily:'monospace' }}>{created.mandato_ref}</strong> generado en PDB con el equipo de trabajo heredado.
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                Completa en la ficha del mandato: vigencia detallada, exclusividad/co-exclusiva, reparto del fee y activos vinculados (si aplica).
              </div>
            </div>
            <div style={footer}>
              <button className="ab-btn" onClick={onClose}>Cerrar</button>
              <button className="ab-btn save" onClick={irAlMandato}>Ir al mandato {created.mandato_ref} →</button>
            </div>
          </>
        ) : (
          <>
            <div style={body}>
              <div style={{ background:'var(--accent-lt, #faf5ec)', border:'1px solid var(--accent-bd, #ece0c9)', borderRadius:8, padding:12, fontSize:11, color:'var(--text3)' }}>
                Al confirmar se ejecuta la cascada: <strong>(1)</strong> abrir la instrucción en Dynamics → <strong>(2)</strong> crear el mandato en PDB enlazado a esa instrucción → <strong>(3)</strong> cerrar la propuesta como ganada. El equipo de trabajo de la propuesta se hereda al mandato.
              </div>

              {/* Sección 1: Instrucción Dynamics */}
              <div style={{ border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
                <div style={{ background:'#B08D57', color:'#fff', padding:'8px 12px', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:14, height:14, borderRadius:3, background:'#fff', color:'#B08D57', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>D</span>
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
                  Oportunidad <strong>{oportunidad?.nombre || propuesta.dynamics_opportunity_id}</strong> · Cuenta <strong>{cuenta?.nombre || propuesta.dynamics_account_id}</strong>
                </div>
              </div>

              {/* Sección 2: Mandato PDB */}
              <div style={{ border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
                <div style={{ background:'#6b5b8e', color:'#fff', padding:'8px 12px', fontSize:11, fontWeight:700 }}>
                  2. Mandato · PDB
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
                {step === 'submitting' ? 'Generando…' : '✓ Confirmar y crear mandato'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
