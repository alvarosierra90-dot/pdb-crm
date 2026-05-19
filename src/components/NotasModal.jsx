/**
 * Modal reutilizable para editar notas de una ficha.
 * Soporta uno o dos campos textarea (notas internas + visión/novedades opcional).
 *
 * Props:
 *   open       boolean
 *   onClose    () => void
 *   onSave     () => Promise<void> | void   (opcional · si no se pasa, solo cierra)
 *   title      string                       (default 'Notas')
 *   subtitle   string                       (default null)
 *   fields     Array<{ key, label, value, onChange, placeholder, rows }>
 *   saving     boolean                      (deshabilita el botón Guardar)
 */
export default function NotasModal({ open, onClose, onSave, title = 'Notas', subtitle = null, fields = [], saving = false }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#fff', borderRadius:10, width:'min(720px, 94vw)', maxHeight:'90vh',
        overflowY:'auto', boxShadow:'0 20px 50px rgba(15,23,42,0.25)',
      }}>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>{title}</div>
            {subtitle && <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, color:'var(--text4)', cursor:'pointer', padding:'4px 8px' }}>×</button>
        </div>

        <div style={{ padding:'20px 24px', display:'grid', gap:18 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{
                fontSize:11, fontWeight:700, color:'var(--text3)',
                textTransform:'uppercase', letterSpacing:'.05em',
                display:'block', marginBottom:6,
              }}>{f.label}</label>
              <textarea
                value={f.value || ''}
                onChange={e => f.onChange?.(e.target.value)}
                placeholder={f.placeholder || ''}
                rows={f.rows || 5}
                style={{
                  width:'100%', padding:'10px 12px', fontSize:13, fontFamily:'inherit',
                  border:'1px solid var(--border)', borderRadius:6,
                  resize:'vertical', lineHeight:1.5, boxSizing:'border-box',
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{
            padding:'8px 16px', fontSize:12, border:'1px solid var(--border)',
            borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600,
          }}>Cerrar</button>
          {onSave && (
            <button onClick={async () => { await onSave(); onClose() }} disabled={saving}
              style={{
                padding:'8px 16px', fontSize:12, border:'none',
                borderRadius:5, background:'var(--accent)', color:'#fff',
                cursor:'pointer', fontWeight:600, opacity: saving ? 0.6 : 1,
              }}>{saving ? 'Guardando…' : 'Guardar'}</button>
          )}
        </div>
      </div>
    </div>
  )
}
