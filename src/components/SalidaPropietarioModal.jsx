import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, AlertCircle } from 'lucide-react'

/**
 * Modal de salida de un propietario de un activo concreto.
 *
 * A diferencia del arrendatario, propietarios SOLO tienen Baja: cuando un
 * propietario deja un activo es porque lo ha vendido (no hay traslado).
 * Ver memory feedback-terminologia-baja-arrendatario.
 *
 * Persistencia:
 *   · propietarios → fecha_salida, motivo_salida='Baja', estado='Vendido'.
 *   · stacking_data del activo origen → unidades de este propietario eliminadas.
 *
 * Props:
 *   propietario: { id, ref?, propietario (nombre), activo_ref, activo_nombre? }
 *   onClose:     () => void
 *   onSuccess:   ({ fechaSalida }) => void
 */
export default function SalidaPropietarioModal({ propietario, onClose, onSuccess }) {
  const [fechaSalida, setFechaSalida] = useState(new Date().toISOString().slice(0, 10))
  const [confirm, setConfirm]         = useState(false)  // checkbox confirmación
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)

  const limpiarStackingOrigen = async () => {
    if (!propietario.activo_ref) return
    const { data: act } = await supabase
      .from('activos')
      .select('stacking_data')
      .eq('ref', propietario.activo_ref)
      .single()
    if (!act?.stacking_data) return
    const updated = act.stacking_data.map(b => ({
      ...b,
      prop: (b.prop || []).map(row => ({
        ...row,
        units: row.units.filter(u => {
          if (propietario.id && u.prop_id) return u.prop_id !== propietario.id
          return u.n !== propietario.propietario
        }),
      })),
    }))
    await supabase.from('activos').update({ stacking_data: updated }).eq('ref', propietario.activo_ref)
  }

  const handleConfirm = async () => {
    if (!confirm) return
    setSaving(true); setError(null)
    try {
      const update = {
        fecha_salida:    fechaSalida,
        motivo_salida:   'Baja',
        estado:          'Vendido',
      }
      const target = supabase.from('propietarios').update(update)
      const { error: upErr } = await (propietario.id
        ? target.eq('id', propietario.id)
        : target.eq('activo_ref', propietario.activo_ref).eq('propietario', propietario.propietario))
      if (upErr) throw new Error(`Propietario: ${upErr.message}`)

      await limpiarStackingOrigen()

      if (onSuccess) onSuccess({ fechaSalida })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inp = { padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', background:'var(--surface)', color:'var(--text)', width:'100%', boxSizing:'border-box' }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={saving ? undefined : onClose}>
      <div style={{background:'#fff',borderRadius:10,width:'min(520px,100%)',maxHeight:'90vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 12px 32px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Dar de baja propietario</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
              {propietario.propietario} {propietario.activo_nombre ? `· ${propietario.activo_nombre}` : ''}
            </div>
          </div>
          <button onClick={onClose} disabled={saving} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,display:'flex'}}><X size={16}/></button>
        </div>

        <div style={{padding:'16px 18px',overflowY:'auto',display:'flex',flexDirection:'column',gap:14}}>

          <div style={{padding:'12px 14px',background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:8,fontSize:12,color:'#9a3412',lineHeight:1.55}}>
            Un propietario sale del activo porque <strong>lo ha vendido</strong>. La fila queda en el histórico del edificio con fecha de salida; no hay traslado a otro activo (a diferencia de los arrendatarios).
          </div>

          {/* Fecha de salida */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>
              Fecha de venta <span style={{color:'var(--red)'}}>*</span>
            </div>
            <input type="date" value={fechaSalida} onChange={e=>setFechaSalida(e.target.value)} style={{...inp,maxWidth:200}}/>
          </div>

          {/* Confirmación */}
          <label style={{display:'flex',alignItems:'flex-start',gap:8,padding:'10px 12px',background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:6,cursor:'pointer'}}>
            <input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)} style={{accentColor:'var(--accent)',marginTop:2}}/>
            <span style={{fontSize:11,color:'var(--text2)',lineHeight:1.5}}>
              Confirmo que <strong>{propietario.propietario}</strong> ha vendido este activo y debe salir de su stacking. El registro queda en el histórico del edificio.
            </span>
          </label>

          {error && (
            <div style={{display:'flex',alignItems:'flex-start',gap:6,padding:10,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:6,fontSize:11,color:'#991b1b'}}>
              <AlertCircle size={13} strokeWidth={1.75} style={{flexShrink:0,marginTop:1}}/>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:8,padding:'12px 18px',borderTop:'1px solid var(--border)',background:'var(--gray-lt)'}}>
          <button onClick={onClose} disabled={saving} style={{padding:'8px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
          <button onClick={handleConfirm} disabled={!confirm||saving||!fechaSalida} style={{padding:'8px 18px',background:(confirm&&fechaSalida)?'var(--red)':'#fca5a5',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:(confirm&&fechaSalida)?(saving?'wait':'pointer'):'not-allowed',fontFamily:'inherit',opacity:saving?0.7:1}}>
            {saving ? 'Procesando…' : 'Confirmar baja'}
          </button>
        </div>
      </div>
    </div>
  )
}
