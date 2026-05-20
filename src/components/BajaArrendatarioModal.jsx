import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// Modal único para "el arrendatario se va". Decide si:
//   - sale a mercado → genera Oferta sell-side con fecha_disponibilidad = fecha salida
//   - cubierto por pre-alquiler / ocupación interna → solo marca Finalizado, sin oferta
//   - cancelar (no se borra nada)
// Usado desde Vencimientos y desde el StackingPlan al borrar un bloque de tenant.

const overlay = {
  position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000,
  display:'flex', alignItems:'center', justifyContent:'center',
}
const panel = {
  background:'#fff', borderRadius:10, width:'min(560px, 92vw)', maxHeight:'90vh', overflowY:'auto',
  boxShadow:'0 20px 50px rgba(15,23,42,0.25)',
}
const head  = { padding:'16px 22px', borderBottom:'1px solid var(--border)' }
const body  = { padding:'16px 22px', display:'flex', flexDirection:'column', gap:14 }
const foot  = { padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }
const lbl   = { fontSize:11, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }
const ks    = { display:'grid', gridTemplateColumns:'130px 1fr', gap:'8px 12px', alignItems:'center' }

function fmtFecha(iso) { if (!iso) return '—'; const [y,m,d] = String(iso).split('-'); return `${d}/${m}/${y}` }

async function generarRefOferta() {
  const year = new Date().getFullYear()
  const { data } = await supabase
    .from('ofertas')
    .select('ref')
    .ilike('ref', `OFE-${year}-%`)
    .order('ref', { ascending: false })
    .limit(1)
  const last = data?.[0]?.ref
  const next = last ? (parseInt(last.split('-')[2], 10) + 1) : 1
  return `OFE-${year}-${String(next).padStart(4, '0')}`
}

// Props:
//   arrendatario: { ref?, nombre, sup?, fecha?, activo_ref? }  (todo opcional excepto nombre+activo_ref si no hay ref)
//   activo: { id, ref, nombre?, dynamics_account_id?, portfolio_id?, uso? } — opcional si arrendatario.ref se usa para lookup completo
//   onClose, onSuccess({ action, ofertaRef? })
export default function BajaArrendatarioModal({ arrendatario, activo, onClose, onSuccess }) {
  const [mode, setMode] = useState('choose')   // 'choose' | 'oferta' | 'finalizar' | 'working' | 'done'
  const [tipoOp, setTipoOp]           = useState('Alquiler')
  const [tipoMercado, setTipoMercado] = useState('mercado')
  const [error, setError] = useState(null)
  const [resolved, setResolved] = useState({ arr: arrendatario, act: activo })  // tras lookup

  // Si falta activo o el ref del arrendatario, hacer lookup en BBDD por (activo_ref, nombre)
  useEffect(() => {
    let cancel = false
    async function lookup() {
      let arr = arrendatario
      let act = activo
      // Resolver arrendatario por ref si lo tenemos (camino directo y fiable).
      if (arr?.ref) {
        const { data } = await supabase
          .from('arrendatarios')
          .select('ref, tenant, nombre, activo_ref, superficie, vencimiento, break_option, fecha_salida, estado_arr')
          .eq('ref', arr.ref)
          .maybeSingle()
        if (data) {
          arr = {
            ref:        data.ref,
            nombre:     data.tenant || data.nombre,
            activo_ref: data.activo_ref,
            sup:        arr.sup ?? data.superficie,
            fecha:      arr.fecha ?? (data.vencimiento || data.break_option || new Date().toISOString().slice(0,10)),
          }
        }
      }
      // Fallback: si solo tenemos nombre + activo_ref, buscar por (activo_ref, tenant).
      // La columna canónica es `tenant` (mig 007); algunas filas legacy usan
      // `nombre`. Probamos ambas con un OR.
      if (!arr?.ref && arr?.nombre && arr?.activo_ref) {
        const { data } = await supabase
          .from('arrendatarios')
          .select('ref, tenant, nombre, activo_ref, superficie, vencimiento, break_option, fecha_salida, estado_arr')
          .eq('activo_ref', arr.activo_ref)
          .or(`tenant.eq.${arr.nombre},nombre.eq.${arr.nombre}`)
          .neq('estado_arr', 'Finalizado')
          .order('vencimiento', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (data) {
          arr = {
            ref:        data.ref,
            nombre:     data.tenant || data.nombre,
            activo_ref: data.activo_ref,
            sup:        arr.sup ?? data.superficie,
            fecha:      arr.fecha ?? (data.vencimiento || data.break_option || new Date().toISOString().slice(0,10)),
          }
        }
      }
      // Resolver activo si solo tenemos activo_ref
      if ((!act || !act.id) && arr?.activo_ref) {
        const { data } = await supabase
          .from('activos')
          .select('id, ref, nombre, dynamics_account_id, portfolio_id, uso')
          .eq('ref', arr.activo_ref)
          .maybeSingle()
        if (data) act = data
      }
      if (!cancel) setResolved({ arr, act })
    }
    lookup()
    return () => { cancel = true }
  }, [arrendatario, activo])

  const arr = resolved.arr
  const act = resolved.act
  const fechaSalida = arr?.fecha || new Date().toISOString().slice(0, 10)

  const canDoBusiness = useMemo(() => !!arr?.ref && !!act?.id, [arr, act])

  const ejecutarOferta = async () => {
    if (!canDoBusiness) return
    setMode('working'); setError(null)
    try {
      const newRef = await generarRefOferta()
      const sup = Number(arr.sup) || null
      const payload = {
        ref:                   newRef,
        activo_id:             act.id,
        dynamics_account_id:   act.dynamics_account_id,
        portfolio_id:          act.portfolio_id,
        tipo_operacion:        tipoOp,
        tipo_mercado:          tipoMercado,
        tipologia:             act.uso || 'Oficinas',
        estado:                'En curso',
        superficie_disponible: sup,
        m2_oferta:             sup,
        fecha_disponibilidad:  fechaSalida,
        tipo_comercializacion: 'Mandato Savills',
        comentarios:           `Oferta generada al dar de baja al arrendatario ${arr.nombre}. Disponibilidad: ${fmtFecha(fechaSalida)}.`,
      }
      const { error: ofErr, data: ofData } = await supabase.from('ofertas').insert(payload).select('id, ref').single()
      if (ofErr) throw new Error(`Oferta: ${ofErr.message}`)

      const { error: arrErr } = await supabase.from('arrendatarios')
        .update({ estado_arr: 'Finalizado', fecha_salida: fechaSalida })
        .eq('ref', arr.ref)
      if (arrErr) throw new Error(`Arrendatario: ${arrErr.message}`)

      setMode('done')
      if (onSuccess) onSuccess({ action:'oferta', ofertaRef: ofData.ref, fechaSalida })
    } catch (e) {
      setError(e.message); setMode('oferta')
    }
  }

  const ejecutarFinalizar = async () => {
    if (!canDoBusiness) return
    setMode('working'); setError(null)
    try {
      const { error: arrErr } = await supabase.from('arrendatarios')
        .update({ estado_arr: 'Finalizado', fecha_salida: fechaSalida })
        .eq('ref', arr.ref)
      if (arrErr) throw new Error(arrErr.message)
      setMode('done')
      if (onSuccess) onSuccess({ action:'finalizar', fechaSalida })
    } catch (e) {
      setError(e.message); setMode('finalizar')
    }
  }

  // Caso: no encontramos el arrendatario en BBDD → solo permitimos eliminación visual
  if (!canDoBusiness) {
    return (
      <div style={overlay} onClick={onClose}>
        <div style={panel} onClick={e => e.stopPropagation()}>
          <div style={head}>
            <div style={{ fontSize:14, fontWeight:700 }}>⚠ Arrendatario no encontrado en BBDD</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{arr?.nombre || '(sin nombre)'} · {act?.nombre || arr?.activo_ref || '—'}</div>
          </div>
          <div style={body}>
            <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55 }}>
              No localizo este arrendatario en la tabla de BBDD (puede ser data legacy del stacking que no se llegó a importar). Si confirmas, solo se eliminará la unidad del stacking plan; <strong>no se creará oferta ni se actualizará ningún registro</strong>.
            </div>
          </div>
          <div style={foot}>
            <button onClick={onClose} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>Cancelar</button>
            <button
              onClick={() => { if (onSuccess) onSuccess({ action:'visual_only' }) }}
              style={{ padding:'8px 14px', fontSize:12, border:'none', borderRadius:5, background:'var(--text4)', color:'#fff', cursor:'pointer', fontWeight:600 }}
            >
              Quitar solo del stacking
            </button>
          </div>
        </div>
      </div>
    )
  }

  const titulo =
    mode === 'oferta'    ? '📢 Generar oferta sell-side' :
    mode === 'finalizar' ? '✓ Finalizar sin oferta' :
    mode === 'done'      ? '✓ Listo' :
    'Dar de baja arrendatario'

  return (
    <div style={overlay} onClick={mode === 'working' ? undefined : onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={head}>
          <div style={{ fontSize:14, fontWeight:700 }}>{titulo}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{arr.nombre} · {act?.nombre || arr.activo_ref || '—'} · sale el {fmtFecha(fechaSalida)}</div>
        </div>

        {mode === 'choose' && (
          <>
            <div style={body}>
              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55 }}>
                ¿Qué pasa con el espacio ahora que <strong>{arr.nombre}</strong> deja {act?.nombre || 'el activo'}?
              </div>
              <div style={ks}>
                <span style={lbl}>Activo</span>
                <span style={{ fontSize:12, fontWeight:600 }}>{act?.nombre || act?.ref || arr.activo_ref}</span>
                <span style={lbl}>Superficie</span>
                <span style={{ fontSize:12, fontWeight:600 }}>{arr.sup ? `${Number(arr.sup).toLocaleString('es-ES')} m²` : '—'}</span>
                <span style={lbl}>Fecha salida</span>
                <span style={{ fontSize:12, fontWeight:600 }}>{fmtFecha(fechaSalida)}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                <button
                  onClick={() => setMode('oferta')}
                  style={{ padding:'12px 14px', fontSize:13, border:'1px solid var(--accent)', background:'var(--accent-lt)', color:'var(--accent)', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:700, textAlign:'left', lineHeight:1.4 }}
                >
                  📢 Sale a mercado → generar oferta sell-side
                  <div style={{ fontSize:10, fontWeight:500, color:'var(--text3)', marginTop:3 }}>Crea una oferta nueva con fecha de disponibilidad = la fecha de salida.</div>
                </button>
                <button
                  onClick={() => setMode('finalizar')}
                  style={{ padding:'12px 14px', fontSize:13, border:'1px solid var(--border)', background:'#fff', color:'var(--text)', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:700, textAlign:'left', lineHeight:1.4 }}
                >
                  ✓ Cubierto por pre-alquiler → finalizar sin oferta
                  <div style={{ fontSize:10, fontWeight:500, color:'var(--text3)', marginTop:3 }}>Marca al arrendatario como Finalizado pero no crea oferta.</div>
                </button>
              </div>
            </div>
            <div style={foot}>
              <button onClick={onClose} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>Cancelar</button>
            </div>
          </>
        )}

        {mode === 'oferta' && (
          <>
            <div style={body}>
              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55 }}>
                Se creará una oferta sell-side sobre <strong>{act?.nombre || act?.ref}</strong> con disponibilidad <strong>{fmtFecha(fechaSalida)}</strong>.
              </div>
              <div style={ks}>
                <span style={lbl}>Tipo operación</span>
                <select value={tipoOp} onChange={e => setTipoOp(e.target.value)} style={{ padding:'6px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', width:'fit-content' }}>
                  <option value="Alquiler">Alquiler</option>
                  <option value="Venta">Venta</option>
                </select>
                <span style={lbl}>Mercado</span>
                <select value={tipoMercado} onChange={e => setTipoMercado(e.target.value)} style={{ padding:'6px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', width:'fit-content' }}>
                  <option value="mercado">Mercado</option>
                  <option value="off_market">Off-market</option>
                </select>
              </div>
              {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:10, fontSize:11, color:'#991b1b' }}>{error}</div>}
            </div>
            <div style={foot}>
              <button onClick={() => setMode('choose')} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>← Volver</button>
              <button onClick={ejecutarOferta} style={{ padding:'8px 14px', fontSize:12, border:'none', borderRadius:5, background:'var(--accent)', color:'#fff', cursor:'pointer', fontWeight:600 }}>📢 Generar oferta</button>
            </div>
          </>
        )}

        {mode === 'finalizar' && (
          <>
            <div style={body}>
              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55 }}>
                <strong>{arr.nombre}</strong> queda como <em>Finalizado</em> el <strong>{fmtFecha(fechaSalida)}</strong>. No se crea oferta ni nuevo registro. Las fechas del contrato se conservan como histórico.
              </div>
              {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:10, fontSize:11, color:'#991b1b' }}>{error}</div>}
            </div>
            <div style={foot}>
              <button onClick={() => setMode('choose')} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>← Volver</button>
              <button onClick={ejecutarFinalizar} style={{ padding:'8px 14px', fontSize:12, border:'none', borderRadius:5, background:'var(--text)', color:'#fff', cursor:'pointer', fontWeight:600 }}>✓ Finalizar sin oferta</button>
            </div>
          </>
        )}

        {mode === 'working' && (
          <div style={body}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text3)', textAlign:'center', padding:'16px 0' }}>Procesando…</div>
          </div>
        )}

        {mode === 'done' && (
          <>
            <div style={body}>
              <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, padding:12, fontSize:12, color:'#166534', fontWeight:600 }}>
                ✓ Acción completada.
              </div>
            </div>
            <div style={foot}>
              <button onClick={onClose} style={{ padding:'8px 14px', fontSize:12, border:'none', borderRadius:5, background:'var(--accent)', color:'#fff', cursor:'pointer', fontWeight:600 }}>Cerrar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
