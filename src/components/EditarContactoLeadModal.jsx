import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

/**
 * Modal ligero del paso 1 del wizard del Lead · completar contacto.
 * Campos: nombre (obligatorio), apellidos, email, telefono.
 * Persistencia directa en supabase.leads. Llama a onSaved() al terminar
 * para que la ficha recargue y refleje el cambio en la card.
 *
 * Props:
 *   lead:     { id, contacto_nombre, contacto_apellidos, email, telefono }
 *   onClose:  () => void
 *   onSaved:  () => void
 */
export default function EditarContactoLeadModal({ lead, onClose, onSaved }) {
  const [form, setForm] = useState({
    contacto_nombre:    lead.contacto_nombre    || '',
    contacto_apellidos: lead.contacto_apellidos || '',
    email:              lead.email              || '',
    telefono:           lead.telefono           || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const sinNombre = !form.contacto_nombre.trim()

  const save = async () => {
    if (sinNombre) { setError('El nombre es obligatorio.'); return }
    setSaving(true); setError(null)
    const { error: e } = await supabase.from('leads').update({
      contacto_nombre:    form.contacto_nombre.trim(),
      contacto_apellidos: form.contacto_apellidos.trim() || null,
      email:              form.email.trim()              || null,
      telefono:           form.telefono.trim()           || null,
    }).eq('id', lead.id)
    setSaving(false)
    if (e) { setError(e.message); return }
    onSaved?.()
    onClose?.()
  }

  const overlay = { position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
  const panel   = { background:'#fff', borderRadius:10, width:'min(520px, 100%)', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 12px 32px rgba(0,0,0,0.25)' }
  const lbl     = (req) => ({ fontSize:10, fontWeight:700, color: req && sinNombre ? 'var(--red, #dc2626)' : 'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4, display:'block' })
  const inp     = (req) => ({ width:'100%', padding:'8px 10px', fontSize:12, border:`1px solid ${req && sinNombre ? 'var(--red, #dc2626)' : 'var(--border)'}`, borderRadius:5, fontFamily:'inherit', background:'var(--surface)', color:'var(--text)', boxSizing:'border-box', outline:'none' })

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em' }}>Paso 1 · Lead {lead.ref || ''}</div>
            <div style={{ fontSize:14, fontWeight:700, marginTop:2 }}>Completar contacto del lead</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4, display:'flex' }}><X size={16}/></button>
        </div>

        <div style={{ padding:'16px 18px', display:'grid', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl(true)}>Nombre *</label>
              <input autoFocus style={inp(true)} placeholder="Carlos" value={form.contacto_nombre} onChange={e => set('contacto_nombre', e.target.value)} />
            </div>
            <div>
              <label style={lbl(false)}>Apellidos</label>
              <input style={inp(false)} placeholder="Méndez García" value={form.contacto_apellidos} onChange={e => set('contacto_apellidos', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl(false)}>Email</label>
            <input type="email" style={inp(false)} placeholder="carlos.mendez@empresa.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label style={lbl(false)}>Teléfono</label>
            <input style={inp(false)} placeholder="+34 600 000 000" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
          </div>

          {error && (
            <div style={{ padding:'8px 10px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:5, fontSize:11, color:'#991b1b' }}>{error}</div>
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 18px', borderTop:'1px solid var(--border)', background:'var(--gray-lt)' }}>
          <div style={{ fontSize:10, color:'var(--text4)' }}>Una vez guardes, el siguiente paso será vincular cuenta + transformar.</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'8px 16px', background:'#fff', border:'1px solid var(--border)', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'var(--text2)' }}>Cancelar</button>
            <button onClick={save} disabled={saving || sinNombre} style={{ padding:'8px 18px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor: (saving || sinNombre) ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: (saving || sinNombre) ? 0.55 : 1 }}>
              {saving ? 'Guardando…' : '💾 Guardar contacto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
