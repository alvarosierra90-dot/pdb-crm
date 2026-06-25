import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, AlertCircle } from 'lucide-react'

/**
 * Modal de salida de una oferta desde el stacking plan.
 *
 * Mismo formato (ventana central) que SalidaArrendatarioModal para
 * coherencia visual. Dos motivos canónicos:
 *
 *   · Oferta cerrada (alquilada) → convierte la oferta en un nuevo
 *     arrendatario vinculado al MISMO activo. Persiste fila en
 *     arrendatarios con activo_ref auto-establecido y reemplaza la
 *     unit 'vac' por 'ten' (con arr_ref) en el stacking.
 *   · Introducida por error → elimina la unit del stacking sin más.
 *
 * Props:
 *   oferta:        { nombre, sup?, renta? }
 *   activo:        { ref, nombre, uso? }
 *   onClose:       () => void
 *   onSuccess:     ({ motivo, arrendatarioRef? }) => void
 */
export default function SalidaOfertaModal({ oferta, activo, onClose, onSuccess }) {
  const [motivo, setMotivo]       = useState(null)   // null | 'cierre' | 'error'
  const [tenant, setTenant]       = useState('')
  const [tenantDesconocido, setTenantDesconocido] = useState(false)
  const [closingRent, setClosingRent] = useState(oferta?.renta ? String(oferta.renta) : '')
  const [inicio, setInicio]       = useState('')   // fecha de inicio del contrato
  const [anyo, setAnyo]           = useState(String(new Date().getFullYear()))
  const [trimestre, setTrimestre] = useState('Q' + (Math.floor(new Date().getMonth()/3)+1))
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  const cerrarOfertaComoArrendatario = async () => {
    setSaving(true); setError(null)
    try {
      const tenantName = tenantDesconocido ? 'Arrendatario desconocido' : tenant.trim()
      if (!tenantDesconocido && !tenantName) throw new Error('Indica el nombre del arrendatario o marca Desconocido.')
      if (!inicio) throw new Error('Indica la fecha de inicio del contrato.')
      const payload = {
        nombre:              tenantName,   // columna NOT NULL
        tenant:              tenantName,
        tenant_desconocido:  tenantDesconocido,
        activo_ref:          activo?.ref || null,
        inicio:              inicio || null,
        anyo_firma:          /^\d{4}$/.test(anyo.trim()) ? Number(anyo) : null,
        trimestre:           trimestre || null,
        closing_rent:        closingRent !== '' ? Number(closingRent) : null,
        superficie:          oferta?.sup || null,
        estado_arr:          'Vigente',
        oferta_origen:       oferta?.nombre || null,
      }
      const { data, error: insErr } = await supabase
        .from('arrendatarios')
        .insert(payload)
        .select()
        .single()
      if (insErr) throw new Error(`Arrendatario: ${insErr.message}`)
      if (onSuccess) onSuccess({ motivo: 'cierre', arrendatario: data })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminarPorError = async () => {
    setSaving(true); setError(null)
    try {
      if (onSuccess) onSuccess({ motivo: 'error' })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inp = { padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', background:'var(--surface)', color:'var(--text)', width:'100%', boxSizing:'border-box' }
  const lbl = (txt, required) => (
    <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>
      {txt}{required && <span style={{color:'var(--red)',marginLeft:2}}>*</span>}
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={saving ? undefined : onClose}>
      <div style={{background:'#fff',borderRadius:10,width:'min(560px,100%)',maxHeight:'90vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 12px 32px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Dar de baja oferta</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
              {oferta?.nombre || '—'} {activo?.nombre ? `· ${activo.nombre}` : ''}
            </div>
          </div>
          <button onClick={onClose} disabled={saving} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,display:'flex'}}><X size={16}/></button>
        </div>

        <div style={{padding:'16px 18px',overflowY:'auto',display:'flex',flexDirection:'column',gap:14}}>

          {/* Selección de motivo */}
          {!motivo && (
            <>
              <div style={{fontSize:12,color:'var(--text3)',lineHeight:1.55}}>
                ¿Qué pasa con esta oferta?
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <button onClick={()=>setMotivo('cierre')}
                  style={{textAlign:'left',padding:'14px 16px',border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:4}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--text1)'}}>Oferta cerrada (alquilada)</span>
                  <span style={{fontSize:11,color:'var(--text3)',lineHeight:1.5}}>Se convierte en un nuevo arrendatario, vinculado automáticamente al activo. El espacio pasa a ocupado en el stacking.</span>
                </button>
                <button onClick={()=>setMotivo('error')}
                  style={{textAlign:'left',padding:'14px 16px',border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:4}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--red)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--red)'}}>Introducida por error</span>
                  <span style={{fontSize:11,color:'var(--text3)',lineHeight:1.5}}>Se elimina del stacking sin crear ningún registro nuevo.</span>
                </button>
              </div>
            </>
          )}

          {/* Caso: cerrar oferta (datos arrendatario) */}
          {motivo === 'cierre' && (
            <>
              <div style={{padding:'10px 12px',background:'#dcfce7',border:'1px solid #86efac',borderRadius:6,fontSize:11,color:'#166534',lineHeight:1.55}}>
                Se creará un arrendatario nuevo vinculado a <strong>{activo?.nombre || activo?.ref}</strong>. Pondrá la planta como ocupada en el stacking.
              </div>

              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  {lbl('Arrendatario', true)}
                  <label style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text3)',cursor:'pointer'}}>
                    <input type="checkbox" checked={tenantDesconocido} onChange={e=>{ setTenantDesconocido(e.target.checked); if (e.target.checked) setTenant('') }} style={{accentColor:'var(--accent)'}}/>
                    Desconocido
                  </label>
                </div>
                {!tenantDesconocido && (
                  <input value={tenant} onChange={e=>setTenant(e.target.value)} placeholder="Nombre del arrendatario o empresa" style={inp}/>
                )}
              </div>

              <div>
                {lbl('Fecha de inicio del contrato', true)}
                <input type="date" value={inicio} onChange={e=>setInicio(e.target.value)} style={inp}/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  {lbl('Año de firma', true)}
                  <input type="number" value={anyo} onChange={e=>setAnyo(e.target.value)} style={inp}/>
                </div>
                <div>
                  {lbl('Trimestre', true)}
                  <select value={trimestre} onChange={e=>setTrimestre(e.target.value)} style={inp}>
                    <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                  </select>
                </div>
              </div>

              <div>
                {lbl('Renta de cierre (€/m²/mes)')}
                <input type="number" step="0.01" value={closingRent} onChange={e=>setClosingRent(e.target.value)} placeholder="Opcional" style={{...inp,fontFamily:'var(--mono)'}}/>
              </div>

              {error && (
                <div style={{display:'flex',alignItems:'flex-start',gap:6,padding:10,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:6,fontSize:11,color:'#991b1b'}}>
                  <AlertCircle size={13} strokeWidth={1.75} style={{flexShrink:0,marginTop:1}}/>
                  <span>{error}</span>
                </div>
              )}
            </>
          )}

          {/* Caso: error */}
          {motivo === 'error' && (
            <>
              <div style={{padding:'12px 14px',background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:8,fontSize:12,color:'#7f1d1d',lineHeight:1.55}}>
                Se eliminará la oferta <strong>{oferta?.nombre}</strong> del stacking. <strong>No es reversible.</strong>
              </div>
              {error && (
                <div style={{display:'flex',alignItems:'flex-start',gap:6,padding:10,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:6,fontSize:11,color:'#991b1b'}}>
                  <AlertCircle size={13} strokeWidth={1.75} style={{flexShrink:0,marginTop:1}}/>
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',borderTop:'1px solid var(--border)',background:'var(--gray-lt)'}}>
          {motivo
            ? <button onClick={()=>setMotivo(null)} disabled={saving} style={{padding:'8px 16px',background:'none',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>← Atrás</button>
            : <div/>
          }
          <div style={{display:'flex',gap:8}}>
            <button onClick={onClose} disabled={saving} style={{padding:'8px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
            {motivo === 'cierre' && (
              <button onClick={cerrarOfertaComoArrendatario} disabled={saving} style={{padding:'8px 18px',background:'var(--green)',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:saving?'wait':'pointer',fontFamily:'inherit',opacity:saving?0.7:1}}>
                {saving ? 'Procesando…' : 'Cerrar oferta'}
              </button>
            )}
            {motivo === 'error' && (
              <button onClick={eliminarPorError} disabled={saving} style={{padding:'8px 18px',background:'var(--red)',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:saving?'wait':'pointer',fontFamily:'inherit',opacity:saving?0.7:1}}>
                {saving ? 'Eliminando…' : 'Eliminar oferta'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
