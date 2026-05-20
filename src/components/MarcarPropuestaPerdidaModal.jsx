import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

// Catálogos · mismos que la ficha de oferta.
const TIPO_COMERC = ['Mandato compartido','Off-market','Alianza','Sin mandato']
//  ↑ ojo: 'Mandato Savills' no aparece porque la propuesta se ha perdido.
//  Si el broker quisiera seguir con Mandato Savills no debería marcarla perdida.

const ORIGEN_OFERTA = [
  'Directo propiedad',
  'Otras consultoras',
  'Agencia externa',
  'Demanda directa',
  'ON profesional',
  'Mandato corporate',
]

const MOTIVOS = [
  'Cliente eligió otra consultora',
  'Cliente decide no contratar',
  'Fees no aceptados',
  'Plazos no aceptados',
  'Cambio de scope del cliente',
  'Cliente pospone el encargo',
  'Operación fuera de mercado',
  'Conflicto de intereses',
]

/**
 * Modal "Marcar propuesta como perdida".
 *
 * Cierra la propuesta con motivo + permite (opcional) crear ofertas igualmente
 * si el broker va a comercializar de todos modos (caso típico: la propiedad
 * decide vender directamente, otra consultora gana el mandato pero seguimos
 * con la oferta off-market, etc.).
 *
 * Si la propuesta es pitch_oferta y tiene activos vinculados, se crea 1 oferta
 * por activo con el tipo_comercializacion y origen_oferta que elija el broker.
 *
 * Props:
 *   propuesta: { id, ref, activos jsonb, dynamics_opportunity_id, dynamics_account_id, equipo_trabajo, nombre }
 *   oportunidad: { tipo }   — para saber si es pitch_oferta / pitch_demanda
 *   onClose, onSuccess
 */
export default function MarcarPropuestaPerdidaModal({ propuesta, oportunidad, onClose, onSuccess }) {
  const [motivo, setMotivo]   = useState('')
  const [crearOferta, setCrearOferta] = useState(false)
  const [tipoCom, setTipoCom] = useState('Off-market')
  const [origen, setOrigen]   = useState('Directo propiedad')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [done, setDone]       = useState(null)

  const esPitchOferta  = oportunidad?.tipo === 'pitch_oferta'
  const activos        = Array.isArray(propuesta.activos) ? propuesta.activos : []
  const puedeCrearOferta = esPitchOferta && activos.length > 0

  const confirmar = async () => {
    if (!motivo.trim()) { setError('Selecciona o escribe el motivo.'); return }
    setSaving(true); setError(null)
    try {
      const ahora = new Date().toISOString()

      // 1) Cerrar propuesta como perdida con el motivo elegido
      const { error: e1 } = await supabase.from('propuestas').update({
        estado:           'perdida',
        motivo_descarte:  motivo.trim(),
        fecha_cierre:     ahora.slice(0, 10),
        updated_at:       ahora,
      }).eq('id', propuesta.id)
      if (e1) throw new Error(`Propuesta: ${e1.message}`)

      // 2) Si el broker quiere crear oferta igualmente, generamos 1 por activo.
      //    Sin mandato_id (la propuesta se perdió, no hay mandato).
      //    tipo_comercializacion y origen_oferta vienen del formulario.
      const ofertasCreadas = []
      if (crearOferta && puedeCrearOferta) {
        const equipoHeredado = Array.isArray(propuesta.equipo_trabajo) ? propuesta.equipo_trabajo : []
        const refsAct = activos.map(a => a?.ref).filter(Boolean)
        const { data: rowsAct = [] } = await supabase.from('activos').select('id, ref, dynamics_account_id').in('ref', refsAct)

        // Refs canónicas OFR-NNNNNNN (mismo formato que OfertasList espera).
        const { data: lastOfe } = await supabase
          .from('ofertas').select('ref').like('ref', 'OFR-%')
          .order('ref', { ascending: false }).limit(1).maybeSingle()
        let n = lastOfe?.ref ? parseInt(String(lastOfe.ref).split('-').pop(), 10) : 0
        n = isNaN(n) ? 0 : n

        for (const act of rowsAct) {
          n += 1
          const ofeRef = `OFR-${String(n).padStart(7, '0')}`
          const cuentaOferta = act.dynamics_account_id || propuesta.dynamics_account_id
          const { data: ofe, error: eOfe } = await supabase.from('ofertas').insert({
            ref:                     ofeRef,
            activo_id:               act.id,
            activo_ref:              act.ref,   // para OfertasList
            dynamics_opportunity_id: propuesta.dynamics_opportunity_id,
            dynamics_account_id:     cuentaOferta,
            equipo_trabajo:          equipoHeredado,
            tipo_comercializacion:   tipoCom,
            origen_oferta:           origen,
            estado:                  'En curso',
          }).select('ref').single()
          if (eOfe) throw new Error(`Oferta ${ofeRef}: ${eOfe.message}`)
          ofertasCreadas.push(ofe.ref)
        }
      }

      setSaving(false)
      setDone({ motivo: motivo.trim(), ofertas: ofertasCreadas })
    } catch (e) {
      setSaving(false)
      setError(e.message)
    }
  }

  const overlay = { position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
  const panel   = { background:'#fff', borderRadius:10, width:'min(560px, 100%)', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 12px 32px rgba(0,0,0,0.25)' }
  const lbl     = { fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4, display:'block' }
  const inp     = { width:'100%', padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', background:'#fff', boxSizing:'border-box', outline:'none' }

  if (done) {
    return (
      <div style={overlay} onClick={onClose}>
        <div style={panel} onClick={e => e.stopPropagation()}>
          <div style={{ padding:'18px 22px' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--red, #dc2626)', marginBottom:6 }}>✗ Propuesta marcada como perdida</div>
            <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.6 }}>
              {propuesta.ref} cerrada con motivo: <strong>{done.motivo}</strong>.
              {done.ofertas.length > 0 && (
                <><br/>{done.ofertas.length === 1 ? 'Oferta' : `${done.ofertas.length} ofertas`} {done.ofertas.length === 1 ? 'creada' : 'creadas'}: <strong style={{ fontFamily:'var(--mono)' }}>{done.ofertas.join(', ')}</strong> con tipo de comercialización <strong>{tipoCom}</strong>.</>
              )}
            </div>
          </div>
          <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
            <button onClick={() => { onSuccess?.(); onClose?.() }} style={{ padding:'8px 16px', fontSize:12, background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Cerrar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em' }}>Propuesta {propuesta.ref}</div>
            <div style={{ fontSize:14, fontWeight:700, marginTop:2 }}>Marcar como perdida</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4, display:'flex' }}><X size={16}/></button>
        </div>

        <div style={{ padding:'16px 18px', display:'grid', gap:14 }}>
          <div>
            <label style={lbl}>Motivo del cierre *</label>
            <select style={inp} value={motivo} onChange={e => setMotivo(e.target.value)}>
              <option value="">Selecciona un motivo…</option>
              {MOTIVOS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {puedeCrearOferta && (
            <div style={{ padding:'12px 14px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6 }}>
              <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer' }}>
                <input
                  type="checkbox"
                  checked={crearOferta}
                  onChange={e => setCrearOferta(e.target.checked)}
                  style={{ marginTop:2, accentColor:'var(--accent)' }}
                />
                <span style={{ flex:1 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1e3a8a' }}>¿Quieres crear oferta(s) igualmente?</span>
                  <span style={{ display:'block', fontSize:11, color:'#1e3a8a', marginTop:2, lineHeight:1.4 }}>
                    Se generará 1 oferta por cada activo vinculado a la propuesta ({activos.length} {activos.length === 1 ? 'activo' : 'activos'}) sin mandato. Útil si vas a seguir comercializando con otra modalidad (off-market, propiedad directa, alianza con otra consultora…).
                  </span>
                </span>
              </label>

              {crearOferta && (
                <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={lbl}>Tipo de comercialización *</label>
                    <select style={inp} value={tipoCom} onChange={e => setTipoCom(e.target.value)}>
                      {TIPO_COMERC.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Origen de la oferta</label>
                    <select style={inp} value={origen} onChange={e => setOrigen(e.target.value)}>
                      {ORIGEN_OFERTA.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {!puedeCrearOferta && (
            <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>
              {esPitchOferta
                ? 'Esta propuesta no tiene activos vinculados, por lo que no se puede crear oferta automáticamente.'
                : 'Solo las propuestas pitch_oferta con activos vinculados pueden generar oferta tras cerrarse como perdidas.'}
            </div>
          )}

          {error && (
            <div style={{ padding:'8px 10px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:5, fontSize:11, color:'#991b1b' }}>{error}</div>
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', padding:'12px 18px', borderTop:'1px solid var(--border)', background:'var(--gray-lt)', gap:8 }}>
          <button onClick={onClose} disabled={saving} style={{ padding:'8px 16px', background:'#fff', border:'1px solid var(--border)', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'var(--text2)' }}>Cancelar</button>
          <button onClick={confirmar} disabled={saving || !motivo} style={{ padding:'8px 18px', background:'var(--red, #dc2626)', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor: (saving || !motivo) ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: (saving || !motivo) ? 0.55 : 1 }}>
            {saving ? 'Procesando…' : '✗ Marcar como perdida'}
          </button>
        </div>
      </div>
    </div>
  )
}
