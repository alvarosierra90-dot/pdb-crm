import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'

const overlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.48)', zIndex:2000,
  display:'flex', alignItems:'center', justifyContent:'center',
}
const panel = {
  background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12,
  width:560, maxWidth:'94vw', maxHeight:'90vh', overflowY:'auto',
  boxShadow:'0 20px 60px rgba(0,0,0,.22)',
}
const header = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  padding:'16px 20px 14px', borderBottom:'1px solid var(--border)',
}
const body = { padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }
const footer = { padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }
const lbl = { fontSize:11, fontWeight:700, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:5, display:'block' }
const inp = { width:'100%', padding:'8px 12px', fontSize:13, border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', boxSizing:'border-box', outline:'none' }

async function nextDemandaRef() {
  const year = new Date().getFullYear()
  const prefix = `DEM-${year}-`
  const { data } = await supabase
    .from('demandas')
    .select('ref')
    .like('ref', `${prefix}%`)
    .order('ref', { ascending:false })
    .limit(1)
    .maybeSingle()
  const last = data?.ref ? parseInt(String(data.ref).split('-').pop(), 10) : 0
  return `${prefix}${String((isNaN(last) ? 0 : last) + 1).padStart(4, '0')}`
}

export default function NuevaDemandaModal({ onClose, onSuccess }) {
  const { navigate } = useNav()
  const [oportunidades, setOportunidades] = useState([])
  const [oppQuery, setOppQuery] = useState('')
  const [oppPick, setOppPick]   = useState(null)
  const [cuenta, setCuenta]     = useState(null)
  const [focused, setFocused]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  // Carga oportunidades Dynamics con cuenta vinculada
  useEffect(() => {
    let cancel = false
    ;(async () => {
      const { data } = await supabase
        .from('dynamics_opportunities')
        .select('dynamics_id, nombre, tipo, cuenta_dynamics_id, dynamics_accounts:cuenta_dynamics_id ( dynamics_id, nombre, ciudad, sector )')
        .order('nombre')
      if (!cancel) setOportunidades(data || [])
    })()
    return () => { cancel = true }
  }, [])

  const matches = !oppQuery
    ? oportunidades.slice(0, 10)
    : oportunidades.filter(o => (o.nombre || '').toLowerCase().includes(oppQuery.toLowerCase())).slice(0, 10)

  const handlePick = (opp) => {
    setOppPick(opp)
    setOppQuery(opp.nombre || '')
    setCuenta(opp.dynamics_accounts || null)
    setFocused(false)
  }

  const handleCrear = async () => {
    if (!oppPick || !cuenta) {
      setError('Falta seleccionar una Oportunidad con Cuenta vinculada.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const ref = await nextDemandaRef()
      const basePayload = {
        ref,
        dynamics_opportunity_id: oppPick.dynamics_id,
        dynamics_account_id:     cuenta.dynamics_id,
        estatus:                 'ongoing',
        nombre:                  '',
        requisitos:              null,
        equipo_trabajo:          [],
      }
      // Intento con `documentos` (migración 031); si la columna no existe,
      // reintento sin ella.
      let { error: insErr } = await supabase.from('demandas').insert({ ...basePayload, documentos: [] })
      if (insErr && /documentos/i.test(insErr.message)) {
        const r = await supabase.from('demandas').insert(basePayload)
        insErr = r.error
      }
      if (insErr) throw insErr
      onSuccess && onSuccess(ref)
      navigate('ficha-demanda', { id: ref })
    } catch (e) {
      setError(e.message || 'Error creando la demanda')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={header}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>+ Nueva Demanda</div>
            <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>Vincula una Oportunidad Dynamics · la Cuenta se hereda automáticamente</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text4)' }}>✕</button>
        </div>

        <div style={body}>
          {/* Oportunidad · typeahead */}
          <div style={{ position:'relative' }}>
            <label style={lbl}>Oportunidad Dynamics *</label>
            <input
              style={inp}
              placeholder="🔍 Buscar oportunidad por nombre..."
              value={oppQuery}
              onChange={e => { setOppQuery(e.target.value); setOppPick(null); setCuenta(null); setFocused(true) }}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
            />
            {focused && matches.length > 0 && (
              <div style={{
                position:'absolute', top:'calc(100% + 2px)', left:0, right:0, zIndex:10,
                background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6,
                maxHeight:240, overflowY:'auto', boxShadow:'0 6px 20px rgba(0,0,0,0.08)',
              }}>
                {matches.map(o => (
                  <div
                    key={o.dynamics_id}
                    onMouseDown={() => handlePick(o)}
                    style={{ padding:'8px 12px', fontSize:12, cursor:'pointer', borderBottom:'1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                  >
                    <div style={{ fontWeight:600 }}>{o.nombre}</div>
                    <div style={{ fontSize:10, color:'var(--text4)', marginTop:2 }}>
                      <span style={{ display:'inline-block', padding:'1px 6px', borderRadius:3, background:'#f5efe5', color:'#6f5734', fontWeight:600, marginRight:6 }}>{o.tipo}</span>
                      {o.dynamics_accounts?.nombre || 'Sin cuenta vinculada'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cuenta heredada · read-only */}
          <div>
            <label style={lbl}>Cuenta (heredada de la Oportunidad)</label>
            {cuenta ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--border)', borderRadius:6, background:'var(--surface-2)' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>🏢</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{cuenta.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>{[cuenta.sector, cuenta.ciudad].filter(Boolean).join(' · ') || '—'}</div>
                </div>
                <span className="tag tag-blue" style={{ fontSize:9 }}>🔒 Heredada</span>
              </div>
            ) : (
              <div style={{ padding:'10px 12px', border:'1px dashed var(--border)', borderRadius:6, background:'var(--gray-lt)', fontSize:12, color:'var(--text4)', fontStyle:'italic' }}>
                Selecciona una Oportunidad para ver la cuenta.
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding:'8px 12px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:5, fontSize:11, color:'#991b1b', fontWeight:600 }}>
              {error}
            </div>
          )}

          <div style={{ padding:'8px 12px', background:'#faf5ec', border:'1px solid #ece0c9', borderRadius:5, fontSize:11, color:'#5a4828' }}>
            💡 Tras crear, podrás editar los requisitos y empezar a presentar edificios desde la pestaña Vista 360.
          </div>
        </div>

        <div style={footer}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ padding:'7px 14px', fontSize:12, fontWeight:600, border:'1px solid var(--border)', borderRadius:5, background:'var(--surface)', color:'var(--text)', cursor:'pointer', fontFamily:'inherit' }}
          >Cancelar</button>
          <button
            onClick={handleCrear}
            disabled={saving || !oppPick || !cuenta}
            style={{ padding:'7px 14px', fontSize:12, fontWeight:700, border:'none', borderRadius:5, background:'var(--accent)', color:'#fff', cursor:'pointer', fontFamily:'inherit', opacity: (saving || !oppPick || !cuenta) ? 0.5 : 1 }}
          >{saving ? 'Creando…' : '+ Crear Demanda'}</button>
        </div>
      </div>
    </div>
  )
}
