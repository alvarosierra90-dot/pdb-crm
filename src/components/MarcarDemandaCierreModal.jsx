import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

const MOTIVOS_PERDIDA = [
  'Renegocia en su actual ubicación',
  'Firma en otra ubicación',
  'Operación cerrada con otra consultora',
  'Cuenta cancela el proyecto',
  'Aplaza decisión sin fecha',
  'Sin presupuesto / proyecto inviable',
  'Cambio de estrategia interna',
  'Sin respuesta de la Cuenta',
  'Spam / no cualificada',
  'Otro motivo',
]

/**
 * Modal de cierre de la Demanda (ganada o perdida).
 *
 * Ganada: la demanda se cierra como `cerrada_concedido` — la cuenta firmó
 *         con alguno de los activos del pool. No cascadea nada (la demanda
 *         es el destino final del funnel buy-side).
 * Perdida: la demanda se cierra como `cerrada_perdida` con motivo obligatorio.
 *
 * Props:
 *   tipo:    'ganada' | 'perdida'
 *   demanda: { id, ref, nombre }
 *   onClose, onSuccess
 */
export default function MarcarDemandaCierreModal({ tipo, demanda, onClose, onSuccess }) {
  const esGanada = tipo === 'ganada'
  const [motivo, setMotivo] = useState('')
  const [activoFinal, setActivoFinal] = useState('')   // texto libre (ej. "MAD-OF-00189 · Albatros")
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const valido = esGanada ? true : !!motivo.trim()

  const confirmar = async () => {
    if (!valido) { setErr('Selecciona el motivo del cierre.'); return }
    setSaving(true); setErr(null)
    try {
      const ahora = new Date().toISOString()
      const update = {
        estatus:    esGanada ? 'cerrada_concedido' : 'cerrada_perdida',
        updated_at: ahora,
      }
      if (!esGanada) update.motivo_descarte = motivo.trim()
      // Anotamos en notas el activo final firmado y el comentario libre.
      const sufijo = []
      if (esGanada && activoFinal.trim()) sufijo.push(`Activo firmado: ${activoFinal.trim()}`)
      if (notas.trim())                   sufijo.push(notas.trim())
      if (sufijo.length > 0) {
        update.notas = sufijo.join(' · ')
      }
      const { error } = await supabase.from('demandas').update(update).eq('id', demanda.id)
      setSaving(false)
      if (error) { setErr(error.message); return }
      onSuccess?.()
      onClose?.()
    } catch (e) {
      setSaving(false)
      setErr(e?.message || 'Error al guardar')
    }
  }

  const overlay = { position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
  const panel   = { background:'#fff', borderRadius:10, width:'min(520px, 100%)', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 12px 32px rgba(0,0,0,0.25)' }
  const lbl     = { fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4, display:'block' }
  const inp     = { width:'100%', padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', background:'#fff', boxSizing:'border-box', outline:'none' }

  const colorAccent = esGanada ? 'var(--green, #16a34a)' : 'var(--red, #dc2626)'

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em' }}>Demanda {demanda.ref}</div>
            <div style={{ fontSize:14, fontWeight:700, marginTop:2, color: colorAccent }}>
              {esGanada ? '✓ Marcar como ganada (concedido)' : '✗ Marcar como perdida'}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4, display:'flex' }}><X size={16}/></button>
        </div>

        <div style={{ padding:'16px 18px', display:'grid', gap:14 }}>
          {esGanada ? (
            <>
              <div style={{ padding:'10px 12px', background:'#dcfce7', border:'1px solid #86efac', borderRadius:6, fontSize:11, color:'#15803d', lineHeight:1.5 }}>
                La demanda se cerrará como <strong>Concedido</strong>: el cliente firmó con uno de los activos del pool. La demanda queda archivada.
              </div>
              <div>
                <label style={lbl}>Activo donde firmó (opcional)</label>
                <input
                  type="text"
                  value={activoFinal}
                  onChange={e => setActivoFinal(e.target.value)}
                  placeholder="Ej. MAD-OF-00189 · Albatros Edif. D"
                  style={inp}
                />
                <div style={{ fontSize:10, color:'var(--text4)', marginTop:4 }}>
                  Solo a modo informativo en las notas. La negociación firmada vive en el módulo Negociaciones.
                </div>
              </div>
              <div>
                <label style={lbl}>Notas del cierre (opcional)</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Comentarios sobre el cierre"
                  style={{ ...inp, resize:'vertical', lineHeight:1.5 }}
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ padding:'10px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, fontSize:11, color:'#991b1b', lineHeight:1.5 }}>
                La demanda se cerrará como <strong>Perdida</strong>. Indica el motivo para análisis posterior.
              </div>
              <div>
                <label style={lbl}>Motivo del cierre *</label>
                <select style={inp} value={motivo} onChange={e => setMotivo(e.target.value)}>
                  <option value="">Selecciona un motivo…</option>
                  {MOTIVOS_PERDIDA.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Notas (opcional)</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Detalles adicionales del cierre"
                  style={{ ...inp, resize:'vertical', lineHeight:1.5 }}
                />
              </div>
            </>
          )}

          {err && (
            <div style={{ padding:'8px 10px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:5, fontSize:11, color:'#991b1b' }}>{err}</div>
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', padding:'12px 18px', borderTop:'1px solid var(--border)', background:'var(--gray-lt)', gap:8 }}>
          <button onClick={onClose} disabled={saving} style={{ padding:'8px 16px', background:'#fff', border:'1px solid var(--border)', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'var(--text2)' }}>Cancelar</button>
          <button onClick={confirmar} disabled={saving || !valido} style={{ padding:'8px 18px', background: colorAccent, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor: (saving || !valido) ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: (saving || !valido) ? 0.55 : 1 }}>
            {saving ? 'Procesando…' : esGanada ? '✓ Confirmar ganada' : '✗ Confirmar perdida'}
          </button>
        </div>
      </div>
    </div>
  )
}
