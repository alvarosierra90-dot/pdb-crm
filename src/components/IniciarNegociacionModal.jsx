import { useState, useMemo, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER } from '../lib/currentUser'
import { nextRef } from '../lib/nextRef'

/**
 * Modal de confirmación + cascada al pasar una Demanda a estado
 * 'En negociación'. Crea una fila en `negociaciones` con TODAS las FKs
 * sincronizadas (cuenta, oportunidad, mandato, oferta, activo, portfolio,
 * oferta_demanda) y luego actualiza la demanda a estatus='en_negociacion'.
 *
 * Props:
 *   demanda   · objeto cargado con joins (cuenta, oportunidad, mandato, oferta)
 *   onClose   · cierra sin cambios
 *   onSuccess · ({ negociacionRef }) → callback (la ficha refresca + navega)
 */
const overlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.48)', zIndex:2000,
  display:'flex', alignItems:'center', justifyContent:'center',
}
const panel = {
  background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12,
  width:680, maxWidth:'94vw', maxHeight:'90vh', overflowY:'auto',
  boxShadow:'0 20px 60px rgba(0,0,0,.22)',
}
const header = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  padding:'16px 22px 14px', borderBottom:'1px solid var(--border)',
}
const body = { padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }
const footer = { padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }

const ROW = {
  display:'grid', gridTemplateColumns:'140px 1fr', gap:8, alignItems:'baseline',
  fontSize:12, padding:'4px 0',
}
const ROW_LBL = { fontSize:11, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }
const ROW_VAL = { fontSize:12, color:'var(--text)', fontWeight:500 }
const ROW_VAL_DIM = { ...ROW_VAL, color:'var(--text4)', fontStyle:'italic' }

export default function IniciarNegociacionModal({ demanda, onClose, onSuccess }) {
  const { navigate } = useNav()
  const [step, setStep] = useState('confirm') // 'confirm' | 'submitting' | 'done' | 'error'
  const [error, setError] = useState(null)
  const [negRef, setNegRef] = useState(null)
  const [mandatoFull, setMandatoFull] = useState(null)
  const [activoFull, setActivoFull]   = useState(null)
  const [ofertaDemandaId, setOfertaDemandaId] = useState(null)

  const cuenta      = demanda?.dynamics_accounts || null
  const oportunidad = demanda?.dynamics_opportunities || null
  const mandato     = demanda?.mandato || null
  const oferta      = demanda?.oferta || null
  const activo      = oferta?.activos || null

  // Carga datos auxiliares para mostrar el preview y para el insert.
  useEffect(() => {
    let cancel = false
    ;(async () => {
      // Mandato completo (para activo si está vinculado al mandato sell-side)
      if (mandato?.id) {
        const { data } = await supabase.from('mandatos')
          .select('id, ref, tipo, activo_id, portfolio_id, dynamics_account_id')
          .eq('id', mandato.id).maybeSingle()
        if (!cancel) setMandatoFull(data)
      }
      // Activo completo (propietario / portfolio para cuenta_propietaria)
      if (oferta?.activos?.id) {
        const { data } = await supabase.from('activos')
          .select('id, ref, nombre, sba, portfolio_id, propietario, dynamics_account_id')
          .eq('id', oferta.activos.id).maybeSingle()
        if (!cancel) setActivoFull(data)
      }
      // Si existe vínculo oferta_demanda preexistente, lo reutilizamos
      if (demanda?.id && oferta?.id) {
        const { data } = await supabase.from('oferta_demanda')
          .select('id')
          .eq('demanda_id', demanda.id)
          .eq('oferta_id', oferta.id)
          .maybeSingle()
        if (!cancel) setOfertaDemandaId(data?.id || null)
      }
    })()
    return () => { cancel = true }
  }, [mandato?.id, oferta?.id, oferta?.activos?.id, demanda?.id])

  const supMin = demanda?.requisitos?.sup_min
  const supMax = demanda?.requisitos?.sup_max
  const supTexto = supMin || supMax
    ? `${supMin || '?'}–${supMax || '?'} m²`
    : null

  const validation = useMemo(() => {
    const errs = []
    if (!demanda?.id) errs.push('Falta la demanda.')
    if (!cuenta?.dynamics_id) errs.push('Falta la cuenta de la demanda.')
    if (!oportunidad?.dynamics_id) errs.push('Falta la oportunidad de la demanda.')
    return errs
  }, [demanda, cuenta, oportunidad])
  const canSubmit = validation.length === 0 && step === 'confirm'

  const ejecutar = async () => {
    if (!canSubmit) return
    setStep('submitting'); setError(null)
    try {
      // 1) Generar ref canónico NEG-XXXXXXX
      const ref = await nextRef('negociaciones', 'NEG')

      // 2) Insert relacional completo. La regla del usuario: TODA la
      //    información previa debe sincronizarse con la negociación.
      const today = new Date().toISOString().slice(0, 10)
      const insert = {
        ref,
        estado:               'En negociación',
        ronda:                1,
        fecha_inicio:         today,
        ultima_actividad:     today,

        // ── Trazabilidad relacional (FKs denormalizadas) ─────────────
        demanda_id:           demanda.id,
        oferta_id:            oferta?.id || null,
        activo_id:            oferta?.activos?.id || mandatoFull?.activo_id || null,
        oferta_demanda_id:    ofertaDemandaId,
        portfolio_id:         activoFull?.portfolio_id || mandatoFull?.portfolio_id || null,

        // ── Dynamics master ─────────────────────────────────────────
        // Cuenta inquilina = la cuenta de la demanda (busca espacio)
        cuenta_inquilina_id:  cuenta?.dynamics_id || null,
        // Cuenta propietaria = la del activo, si está identificada en Dynamics
        cuenta_propietaria_id: activoFull?.dynamics_account_id || mandatoFull?.dynamics_account_id || null,

        // ── Parte Savills (lado responsable) ────────────────────────
        parte_nombre:         CURRENT_USER.nombre,
        parte_equipo:         CURRENT_USER.equipo || 'Equipo PDB',

        // ── Contraparte (cliente / inquilino) ───────────────────────
        contraparte_empresa:  cuenta?.nombre || null,
        contraparte_email:    cuenta?.email || null,
        contraparte_telefono: cuenta?.telefono || null,

        // ── Métricas iniciales (heredadas de la demanda) ────────────
        superficie:           supMin || supMax || null,
        renta_inicial:        demanda?.requisitos?.alq_min || demanda?.requisitos?.alq_max || null,
        renta_ultima:         demanda?.requisitos?.alq_max || demanda?.requisitos?.alq_min || null,
      }

      const { data: negData, error: e1 } = await supabase
        .from('negociaciones')
        .insert(insert)
        .select('id, ref')
        .single()
      if (e1) throw new Error(`Crear negociación: ${e1.message}`)

      // 3) Actualizar la demanda → estatus = en_negociacion
      const { error: e2 } = await supabase.from('demandas')
        .update({ estatus: 'en_negociacion', updated_at: new Date().toISOString() })
        .eq('id', demanda.id)
      if (e2) throw new Error(`Actualizar demanda: ${e2.message}`)

      // 4) Si hay tabla puente oferta_demanda pero aún no existe registro,
      //    crear uno con estado 'negociando' para que la vista 360 lo refleje.
      if (oferta?.id && oferta?.activos?.id && !ofertaDemandaId) {
        await supabase.from('oferta_demanda').insert({
          demanda_id: demanda.id,
          oferta_id:  oferta.id,
          activo_id:  oferta.activos.id,
          estado_alternativa: 'negociando',
        })
      } else if (ofertaDemandaId) {
        await supabase.from('oferta_demanda')
          .update({ estado_alternativa: 'negociando', updated_at: new Date().toISOString() })
          .eq('id', ofertaDemandaId)
      }

      // 5) Actividad de auditoría · negociación iniciada
      await supabase.from('actividades').insert({
        tipo: 'Nota',
        asunto: `Negociación ${ref} creada desde demanda ${demanda.ref}`,
        descripcion: `Estado de la demanda movido a 'En negociación'. Negociación sincronizada con cuenta, oportunidad${mandato?' + mandato':''}${oferta?' + oferta':''}${activo?' + activo':''}.`,
        fecha: new Date().toISOString(),
        estado: 'completado',
        cuenta_dynamics_id:      cuenta?.dynamics_id || null,
        oportunidad_dynamics_id: oportunidad?.dynamics_id || null,
        activo_id:               oferta?.activos?.id || null,
        oferta_id:               oferta?.id || null,
        demanda_id:              demanda.id,
        negociacion_id:          negData.id,
        asignado_a:              CURRENT_USER.nombre,
      })

      setNegRef(negData.ref)
      setStep('done')
      onSuccess?.({ negociacionRef: negData.ref })
    } catch (e) {
      setError(e?.message || 'Error al iniciar la negociación.')
      setStep('error')
    }
  }

  const abrirNegociacion = () => {
    if (negRef) navigate('ficha-negociacion', { ref: negRef })
    onClose?.()
  }

  return (
    <div style={overlay} onClick={step === 'submitting' ? undefined : onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={header}>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>Pasar a 'En negociación'</div>
            <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>
              {step === 'done'
                ? `Negociación ${negRef} creada.`
                : 'Esta acción crea una negociación nueva con toda la información sincronizada.'}
            </div>
          </div>
          <button onClick={onClose} disabled={step === 'submitting'}
            style={{ background:'none', border:'none', fontSize:20, color:'var(--text4)', cursor:'pointer', padding:'4px 8px' }}>×</button>
        </div>

        <div style={body}>
          {step === 'confirm' && (
            <>
              <div style={{ padding:'12px 14px', background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:8, color:'#92400e', fontSize:12, lineHeight:1.5 }}>
                <div style={{ fontWeight:700, marginBottom:4 }}>⚠ Confirma antes de continuar</div>
                Esta demanda pasará al estado <strong>'En negociación'</strong>. Se creará una negociación
                nueva en el módulo de Negociaciones con número de serie generado automáticamente y toda la
                información previa sincronizada. ¿Deseas continuar?
              </div>

              <div style={{ border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', background:'var(--surface-2)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>Información que se sincronizará</div>
                <div style={ROW}>
                  <span style={ROW_LBL}>Demanda</span>
                  <span style={ROW_VAL}>{demanda?.ref} · {demanda?.nombre || cuenta?.nombre || '—'}</span>
                </div>
                <div style={ROW}>
                  <span style={ROW_LBL}>Cuenta</span>
                  <span style={cuenta ? ROW_VAL : ROW_VAL_DIM}>{cuenta?.nombre || '(sin cuenta)'}</span>
                </div>
                <div style={ROW}>
                  <span style={ROW_LBL}>Oportunidad</span>
                  <span style={oportunidad ? ROW_VAL : ROW_VAL_DIM}>{oportunidad?.nombre || demanda?.dynamics_opportunity_id || '(sin oportunidad)'}</span>
                </div>
                <div style={ROW}>
                  <span style={ROW_LBL}>Mandato</span>
                  <span style={mandato ? ROW_VAL : ROW_VAL_DIM}>{mandato?.ref || '(sin mandato)'}</span>
                </div>
                <div style={ROW}>
                  <span style={ROW_LBL}>Oferta</span>
                  <span style={oferta ? ROW_VAL : ROW_VAL_DIM}>{oferta?.ref || '(sin oferta vinculada)'}</span>
                </div>
                <div style={ROW}>
                  <span style={ROW_LBL}>Activo</span>
                  <span style={activo ? ROW_VAL : ROW_VAL_DIM}>{activo?.nombre || '(se hereda de la oferta)'}</span>
                </div>
                <div style={ROW}>
                  <span style={ROW_LBL}>Superficie</span>
                  <span style={supTexto ? ROW_VAL : ROW_VAL_DIM}>{supTexto || '—'}</span>
                </div>
                <div style={ROW}>
                  <span style={ROW_LBL}>Responsable</span>
                  <span style={ROW_VAL}>{CURRENT_USER.nombre}{CURRENT_USER.equipo ? ` · ${CURRENT_USER.equipo}` : ''}</span>
                </div>
              </div>

              {validation.length > 0 && (
                <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#991b1b' }}>
                  <div style={{ fontWeight:700, marginBottom:4 }}>No se puede iniciar la negociación:</div>
                  <ul style={{ margin:0, paddingLeft:18 }}>
                    {validation.map((m,i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}

          {step === 'submitting' && (
            <div style={{ padding:'20px 14px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>
              Generando negociación y sincronizando datos…
            </div>
          )}

          {step === 'done' && (
            <div style={{ padding:'14px 16px', background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, color:'#15803d', fontSize:13, lineHeight:1.5 }}>
              <div style={{ fontSize:24, marginBottom:6 }}>✓</div>
              <div style={{ fontWeight:700 }}>Negociación {negRef} creada</div>
              <div style={{ marginTop:4, color:'#166534' }}>
                La demanda {demanda?.ref} está ahora en estado 'En negociación' y vinculada a la negociación.
                Puedes abrir la información general desde aquí o desde la card de Negociación.
              </div>
            </div>
          )}

          {step === 'error' && (
            <div style={{ padding:'12px 14px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, color:'#991b1b', fontSize:12 }}>
              <div style={{ fontWeight:700, marginBottom:4 }}>Error</div>
              {error}
            </div>
          )}
        </div>

        <div style={footer}>
          {step === 'confirm' && (
            <>
              <button onClick={onClose}
                style={{ padding:'8px 16px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'#fff', cursor:'pointer', fontWeight:600 }}>
                Cancelar
              </button>
              <button onClick={ejecutar} disabled={!canSubmit}
                style={{ padding:'8px 16px', fontSize:12, border:'none', borderRadius:6, background:'var(--accent)', color:'#fff', cursor: canSubmit ? 'pointer' : 'not-allowed', fontWeight:700, opacity: canSubmit ? 1 : 0.45 }}>
                Sí, continuar y crear negociación
              </button>
            </>
          )}
          {step === 'submitting' && (
            <button disabled style={{ padding:'8px 16px', fontSize:12, border:'none', borderRadius:6, background:'var(--accent)', color:'#fff', opacity:.6 }}>
              Creando…
            </button>
          )}
          {step === 'done' && (
            <>
              <button onClick={onClose}
                style={{ padding:'8px 16px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'#fff', cursor:'pointer', fontWeight:600 }}>
                Cerrar
              </button>
              <button onClick={abrirNegociacion}
                style={{ padding:'8px 16px', fontSize:12, border:'none', borderRadius:6, background:'var(--accent)', color:'#fff', cursor:'pointer', fontWeight:700 }}>
                Abrir negociación →
              </button>
            </>
          )}
          {step === 'error' && (
            <>
              <button onClick={onClose}
                style={{ padding:'8px 16px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'#fff', cursor:'pointer', fontWeight:600 }}>
                Cancelar
              </button>
              <button onClick={() => setStep('confirm')}
                style={{ padding:'8px 16px', fontSize:12, border:'none', borderRadius:6, background:'var(--accent)', color:'#fff', cursor:'pointer', fontWeight:700 }}>
                Reintentar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
