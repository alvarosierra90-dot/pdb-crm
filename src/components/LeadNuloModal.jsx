import { useState } from 'react'
import { MOTIVOS_LEAD_NULO } from '../data/mockLeads'

const overlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.48)', zIndex:2000,
  display:'flex', alignItems:'center', justifyContent:'center',
}
const panel = {
  background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12,
  width:480, maxWidth:'94vw', maxHeight:'90vh', overflowY:'auto',
  boxShadow:'0 20px 60px rgba(0,0,0,.22)',
}
const header = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  padding:'16px 20px 14px', borderBottom:'1px solid var(--border)',
}
const body = { padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 }
const footer = { padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }
const lbl = { fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4, display:'block' }
const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', boxSizing:'border-box', outline:'none' }

export default function LeadNuloModal({ lead, onClose }) {
  const [motivo, setMotivo] = useState('')
  const [otroTexto, setOtroTexto] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const esOtro = motivo === 'Otro motivo'
  const valido = motivo && (!esOtro || (esOtro && otroTexto.trim()))

  const handleConfirmar = () => {
    if (!valido) return
    setSubmitted(true)
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>

        <div style={header}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#991b1b' }}>✗ Marcar como Lead Nulo</div>
            <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>{lead.id} · {lead.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text4)' }}>×</button>
        </div>

        {submitted ? (
          <>
            <div style={body}>
              <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, padding:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#991b1b', marginBottom:6 }}>Lead marcado como nulo</div>
                <div style={{ fontSize:11, color:'#7f1d1d', lineHeight:1.5 }}>
                  El lead queda cerrado y ya no podrá transformarse. Computa en reporting como lead perdido / no válido.
                </div>
              </div>
              <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>Trazabilidad guardada</div>
                <div style={{ fontSize:11, color:'var(--text)', marginBottom:3 }}>📌 <strong>Motivo:</strong> {esOtro ? otroTexto : motivo}</div>
                <div style={{ fontSize:11, color:'var(--text)', marginBottom:3 }}>👤 <strong>Usuario:</strong> Sierra Álvaro</div>
                <div style={{ fontSize:11, color:'var(--text)' }}>📅 <strong>Fecha:</strong> {new Date().toLocaleString('es-ES')}</div>
              </div>
            </div>
            <div style={footer}>
              <button className="ab-btn save" onClick={onClose}>Cerrar</button>
            </div>
          </>
        ) : (
          <>
            <div style={body}>
              <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:11, color:'#7c2d12' }}>
                  Marcar este lead como nulo es <strong>irreversible</strong>. No se podrá transformar en el futuro. Selecciona el motivo para mantener trazabilidad.
                </div>
              </div>

              <div>
                <label style={lbl}>Motivo *</label>
                <select style={inp} value={motivo} onChange={e => setMotivo(e.target.value)}>
                  <option value="">Selecciona un motivo...</option>
                  {MOTIVOS_LEAD_NULO.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {esOtro && (
                <div>
                  <label style={lbl}>Especifica el motivo *</label>
                  <textarea
                    style={{ ...inp, resize:'vertical', minHeight:64 }}
                    placeholder="Describe brevemente por qué este lead no es válido..."
                    value={otroTexto}
                    onChange={e => setOtroTexto(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div style={footer}>
              <button className="ab-btn" onClick={onClose}>Cancelar</button>
              <button
                className="ab-btn"
                onClick={handleConfirmar}
                disabled={!valido}
                style={{
                  background: valido ? '#dc2626' : '#fca5a5',
                  color:'#fff', border:'none', fontWeight:700,
                  cursor: valido ? 'pointer' : 'not-allowed',
                  opacity: valido ? 1 : 0.7,
                }}
              >
                Confirmar Lead Nulo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
