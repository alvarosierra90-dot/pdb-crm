import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Modal para desactivar (o reactivar) un propietario. Spec del usuario:
// un propietario que vendió todo y no ha recomprado pasa a estado
// "Vendido" / "En desinversión" / "Inactivo" — no se borra. Sigue
// quedando en el histórico de los activos que tuvo.

const overlay = {
  position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000,
  display:'flex', alignItems:'center', justifyContent:'center',
}
const panel = {
  background:'#fff', borderRadius:10, width:'min(540px, 92vw)', maxHeight:'90vh', overflowY:'auto',
  boxShadow:'0 20px 50px rgba(15,23,42,0.25)',
}

const ESTADOS_DESACTIVADO = [
  { v:'Vendido',         label:'Vendido',         desc:'Vendió todos los activos y no ha vuelto a comprar.' },
  { v:'En desinversión', label:'En desinversión', desc:'Está en proceso de venta del portfolio.' },
  { v:'Inactivo',        label:'Inactivo',        desc:'Otro motivo (cierre del fondo, fusión, …).' },
]

const MOTIVOS_PREDEF = [
  'Vendió todo el portfolio',
  'Estrategia de salida del mercado',
  'Cierre de fondo',
  'Fusión / absorción',
  'Cambio de SOCIMI a privado',
  'Otro motivo',
]

export default function DesactivarPropietarioModal({ propietarioId, propietarioNombre, modo = 'desactivar', onClose, onSuccess }) {
  const [estado, setEstado] = useState('Vendido')
  const [motivoSel, setMotivoSel] = useState('')
  const [motivoLibre, setMotivoLibre] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  const motivoFinal = motivoSel === 'Otro motivo' ? motivoLibre.trim() : motivoSel
  const reactivar = modo === 'reactivar'

  const ejecutar = async () => {
    if (!propietarioId) { setError('Falta el id del propietario.'); return }
    if (!reactivar && !motivoFinal) { setError('Selecciona un motivo de la baja.'); return }
    setWorking(true); setError(null)
    const today = new Date().toISOString().slice(0, 10)
    const payload = reactivar
      ? { estado: 'Activo', fecha_desactivacion: null, motivo_desactivacion: null }
      : { estado, fecha_desactivacion: today, motivo_desactivacion: motivoFinal }
    const { error: e } = await supabase.from('propietarios').update(payload).eq('id', propietarioId)
    setWorking(false)
    if (e) { setError(e.message); return }
    if (onSuccess) onSuccess(payload)
    onClose()
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={panel}>
        <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:14, fontWeight:700 }}>{reactivar ? '🔄 Reactivar propietario' : '⏸ Desactivar propietario'}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{propietarioNombre || '—'}</div>
        </div>

        <div style={{ padding:'16px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          {reactivar ? (
            <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55 }}>
              El propietario volverá a aparecer en las vistas activas y se borrará la fecha y el motivo de baja. Los activos que tuvo siguen apuntando a él.
            </div>
          ) : (
            <>
              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55 }}>
                Pasa a inactivo (no se borra). Sigue apareciendo en el histórico de los activos que tuvo y en /portfolios con la pestaña "Desactivados".
              </div>

              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>Estado *</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {ESTADOS_DESACTIVADO.map(opt => {
                    const sel = estado === opt.v
                    return (
                      <label
                        key={opt.v}
                        style={{ padding:'10px 12px', border: sel ? '1.5px solid var(--accent)' : '1px solid var(--border)', borderRadius:6, cursor:'pointer', display:'flex', gap:10, alignItems:'flex-start', background: sel ? 'var(--accent-lt)' : '#fff' }}
                      >
                        <input type="radio" checked={sel} onChange={() => setEstado(opt.v)} style={{ marginTop:3 }} />
                        <div>
                          <div style={{ fontSize:13, fontWeight:600 }}>{opt.label}</div>
                          <div style={{ fontSize:11, color:'var(--text3)' }}>{opt.desc}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>Motivo de la baja *</div>
                <select
                  value={motivoSel}
                  onChange={e => setMotivoSel(e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', fontFamily:'inherit', boxSizing:'border-box' }}
                >
                  <option value="">Selecciona un motivo…</option>
                  {MOTIVOS_PREDEF.map(m => <option key={m}>{m}</option>)}
                </select>
                {motivoSel === 'Otro motivo' && (
                  <textarea
                    value={motivoLibre}
                    onChange={e => setMotivoLibre(e.target.value)}
                    placeholder="Describe el motivo…"
                    style={{ marginTop:8, width:'100%', minHeight:60, padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', boxSizing:'border-box', resize:'vertical' }}
                  />
                )}
              </div>
            </>
          )}

          {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:10, fontSize:11, color:'#991b1b' }}>{error}</div>}
        </div>

        <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} disabled={working} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>Cancelar</button>
          <button
            onClick={ejecutar}
            disabled={working || (!reactivar && !motivoFinal)}
            style={{
              padding:'8px 14px', fontSize:12, border:'none', borderRadius:5,
              background: reactivar ? 'var(--green)' : 'var(--amber)',
              color:'#fff', cursor:'pointer', fontWeight:700,
              opacity: working || (!reactivar && !motivoFinal) ? 0.5 : 1,
            }}
          >
            {working ? 'Procesando…' : (reactivar ? '🔄 Reactivar' : '⏸ Desactivar')}
          </button>
        </div>
      </div>
    </div>
  )
}
