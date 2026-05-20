import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { X, Search, AlertCircle, ArrowRight } from 'lucide-react'

/**
 * Modal de salida de un arrendatario del activo.
 *
 * Dos motivos canónicos (ver memory feedback-terminologia-baja-arrendatario):
 *   · Baja              → se va y no sabemos a dónde.
 *   · Fin de contrato   → se traslada a otro activo de la PDB (typeahead).
 *
 * Persistencia:
 *   · arrendatarios → fecha_salida, motivo_salida, destino_activo_ref,
 *     estado_arr='Finalizado'.
 *   · stacking_data del activo origen → unidad ten → vac.
 *   · Fin de contrato: crea fila nueva en arrendatarios para el activo
 *     destino, pendiente de asignar planta.
 *
 * Props:
 *   arrendatario: { ref, nombre, sup?, activo_ref, activo_nombre?, datos contractuales… }
 *   onClose:      () => void
 *   onSuccess:    ({ motivo, destinoRef? }) => void
 */
export default function SalidaArrendatarioModal({ arrendatario, onClose, onSuccess }) {
  const [motivo, setMotivo]               = useState(null)   // null | 'Baja' | 'Fin de contrato'
  const [fechaSalida, setFechaSalida]     = useState(new Date().toISOString().slice(0, 10))
  const [search, setSearch]               = useState('')
  const [results, setResults]             = useState([])
  const [destino, setDestino]             = useState(null)   // { ref, nombre, ciudad }
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState(null)

  // Typeahead destino — busca activos cuya ref o nombre matchee. Excluye el de origen.
  useEffect(() => {
    if (motivo !== 'Fin de contrato' || !search || search.length < 2 || destino) {
      setResults([]); return
    }
    let cancel = false
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('activos')
        .select('ref, nombre, ciudad, direccion')
        .neq('ref', arrendatario.activo_ref)
        .or(`nombre.ilike.%${search}%,ref.ilike.%${search}%,direccion.ilike.%${search}%`)
        .order('nombre')
        .limit(8)
      if (!cancel) setResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [search, motivo, destino, arrendatario.activo_ref])

  const canConfirm = useMemo(() => {
    if (!motivo)        return false
    if (!fechaSalida)   return false
    if (motivo === 'Fin de contrato' && !destino) return false
    return true
  }, [motivo, fechaSalida, destino])

  const limpiarStackingOrigen = async () => {
    // Lee stacking_data del activo origen y convierte la(s) unit(s) 'ten' que
    // matcheen este arrendatario (por arr_ref o por nombre) en 'vac' sin oferta.
    if (!arrendatario.activo_ref) return
    const { data: act } = await supabase
      .from('activos')
      .select('stacking_data')
      .eq('ref', arrendatario.activo_ref)
      .single()
    if (!act?.stacking_data) return
    const updated = act.stacking_data.map(b => ({
      ...b,
      arr: (b.arr || []).map(row => ({
        ...row,
        units: row.units.map(u => {
          const match = u.type === 'ten' && (
            (arrendatario.ref && u.arr_ref === arrendatario.ref) ||
            (!u.arr_ref && u.n === arrendatario.nombre)
          )
          if (!match) return u
          return { type: 'vac', oferta: null, sup: u.sup }
        }),
      })),
    }))
    await supabase.from('activos').update({ stacking_data: updated }).eq('ref', arrendatario.activo_ref)
  }

  const handleConfirm = async () => {
    if (!canConfirm) return
    setSaving(true); setError(null)
    try {
      // 1) Actualizar fila del arrendatario actual
      const update = {
        fecha_salida:        fechaSalida,
        motivo_salida:       motivo,
        destino_activo_ref:  motivo === 'Fin de contrato' ? destino.ref : null,
        estado_arr:          'Finalizado',
      }
      const { error: upErr } = await supabase
        .from('arrendatarios')
        .update(update)
        .eq('ref', arrendatario.ref)
      if (upErr) throw new Error(`Arrendatario: ${upErr.message}`)

      // 2) Limpiar unidades del stacking del activo origen
      await limpiarStackingOrigen()

      // 3) Si es fin de contrato, crear fila nueva en el destino
      if (motivo === 'Fin de contrato') {
        const payload = {
          tenant:              arrendatario.nombre,
          activo_ref:          destino.ref,
          estado_arr:          'Vigente',
          oferta_origen:       arrendatario.ref,    // trazabilidad del traslado
        }
        const { error: insErr } = await supabase.from('arrendatarios').insert(payload)
        if (insErr) throw new Error(`Destino: ${insErr.message}`)
      }

      if (onSuccess) onSuccess({ motivo, destinoRef: destino?.ref || null, fechaSalida })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inp = { padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', background:'var(--surface)', color:'var(--text)', width:'100%', boxSizing:'border-box' }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={saving ? undefined : onClose}>
      <div style={{background:'#fff',borderRadius:10,width:'min(560px,100%)',maxHeight:'90vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 12px 32px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Dar de baja arrendatario</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
              {arrendatario.nombre} {arrendatario.activo_nombre ? `· ${arrendatario.activo_nombre}` : ''}
            </div>
          </div>
          <button onClick={onClose} disabled={saving} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,display:'flex'}}><X size={16}/></button>
        </div>

        <div style={{padding:'16px 18px',overflowY:'auto',display:'flex',flexDirection:'column',gap:14}}>

          {/* Selección de motivo */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>Motivo de salida</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button onClick={()=>{ setMotivo('Baja'); setDestino(null); setSearch('') }}
                style={{textAlign:'left',padding:'12px 14px',
                  border:`1px solid ${motivo==='Baja'?'var(--accent)':'var(--border)'}`,
                  background: motivo==='Baja' ? 'var(--accent-lt)' : 'var(--surface)',
                  borderRadius:8,cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:3}}>
                <span style={{fontSize:13,fontWeight:700,color: motivo==='Baja' ? 'var(--accent)' : 'var(--text)'}}>
                  {motivo==='Baja'?'● ':'○ '}Baja
                </span>
                <span style={{fontSize:11,color:'var(--text3)',lineHeight:1.5,marginLeft:14}}>Se va y no sabemos dónde acaba. Queda en el histórico del edificio con fecha de salida.</span>
              </button>

              <button onClick={()=>setMotivo('Fin de contrato')}
                style={{textAlign:'left',padding:'12px 14px',
                  border:`1px solid ${motivo==='Fin de contrato'?'var(--accent)':'var(--border)'}`,
                  background: motivo==='Fin de contrato' ? 'var(--accent-lt)' : 'var(--surface)',
                  borderRadius:8,cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:3}}>
                <span style={{fontSize:13,fontWeight:700,color: motivo==='Fin de contrato' ? 'var(--accent)' : 'var(--text)'}}>
                  {motivo==='Fin de contrato'?'● ':'○ '}Fin de contrato
                </span>
                <span style={{fontSize:11,color:'var(--text3)',lineHeight:1.5,marginLeft:14}}>Se traslada a otro activo de la PDB. En el listado figurará como <strong>Traslado</strong>.</span>
              </button>
            </div>
          </div>

          {/* Destino — solo para Fin de contrato */}
          {motivo === 'Fin de contrato' && (
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>
                Activo destino <span style={{color:'var(--red)'}}>*</span>
              </div>
              {!destino ? (
                <div style={{position:'relative'}}>
                  <div style={{position:'relative'}}>
                    <Search size={14} strokeWidth={1.75} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text4)',pointerEvents:'none'}}/>
                    <input
                      autoFocus
                      placeholder="Buscar activo destino…"
                      value={search}
                      onChange={e=>setSearch(e.target.value)}
                      style={{...inp,paddingLeft:32}}
                    />
                  </div>
                  {results.length > 0 && (
                    <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,marginTop:4,maxHeight:240,overflowY:'auto',zIndex:10,boxShadow:'0 4px 14px rgba(0,0,0,0.08)'}}>
                      {results.map(r => (
                        <div key={r.ref} onClick={()=>{ setDestino(r); setSearch(''); setResults([]) }}
                          style={{padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',fontSize:12}}
                          onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
                          onMouseLeave={e=>e.currentTarget.style.background=''}>
                          <div style={{fontWeight:600}}>{r.nombre || r.ref}</div>
                          <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{r.ref}{r.ciudad?` · ${r.ciudad}`:''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{padding:'10px 12px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,display:'flex',alignItems:'center',gap:10}}>
                  <ArrowRight size={14} strokeWidth={1.75} style={{color:'#15803d',flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#15803d'}}>{destino.nombre || destino.ref}</div>
                    <div style={{fontSize:10,color:'#166534',fontFamily:'var(--mono)'}}>{destino.ref}{destino.ciudad?` · ${destino.ciudad}`:''}</div>
                  </div>
                  <button onClick={()=>setDestino(null)} style={{background:'none',border:'1px solid var(--border)',padding:'4px 10px',borderRadius:4,fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)'}}>Cambiar</button>
                </div>
              )}
              <div style={{fontSize:10,color:'var(--text4)',marginTop:6,lineHeight:1.4}}>
                Se creará una fila nueva en el activo destino con este arrendatario, pendiente de asignar planta. En el edificio actual queda en el histórico.
              </div>
            </div>
          )}

          {/* Fecha de salida */}
          {motivo && (
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>Fecha de salida</div>
              <input type="date" value={fechaSalida} onChange={e=>setFechaSalida(e.target.value)} style={{...inp,maxWidth:200}}/>
            </div>
          )}

          {error && (
            <div style={{display:'flex',alignItems:'flex-start',gap:6,padding:10,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:6,fontSize:11,color:'#991b1b'}}>
              <AlertCircle size={13} strokeWidth={1.75} style={{flexShrink:0,marginTop:1}}/>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:8,padding:'12px 18px',borderTop:'1px solid var(--border)',background:'var(--gray-lt)'}}>
          <button onClick={onClose} disabled={saving} style={{padding:'8px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
          <button onClick={handleConfirm} disabled={!canConfirm||saving} style={{padding:'8px 18px',background: canConfirm?'var(--red)':'#fca5a5',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:canConfirm?(saving?'wait':'pointer'):'not-allowed',fontFamily:'inherit',opacity:saving?0.7:1}}>
            {saving ? 'Procesando…' : 'Confirmar baja'}
          </button>
        </div>
      </div>
    </div>
  )
}
