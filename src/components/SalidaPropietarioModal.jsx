import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { X, AlertCircle, Search } from 'lucide-react'

/**
 * Modal de salida de un propietario de un activo concreto.
 *
 * Propietarios SOLO tienen Baja: cuando salen es porque han vendido el activo
 * (no hay traslado). Ver memory feedback-terminologia-baja-arrendatario.
 *
 * Campos pedidos:
 *   · Año de venta + trimestre  (obligatorio)
 *   · Precio de venta            (obligatorio)
 *   · Comprador                  (opcional, typeahead dynamics_accounts).
 *     Si no se conoce, queda como 'Comprador desconocido'.
 *
 * Persistencia:
 *   · propietarios → fecha_salida (año-trimestre→fecha aprox), motivo_salida='Baja',
 *     destino_activo_ref (NULL siempre para propietarios — no hay traslado),
 *     estado='Vendido'. Además precio_venta y comprador_cuenta_id en metadata.
 *   · stacking_data del activo origen → unidades de este propietario eliminadas.
 *
 * Props:
 *   propietario: { id, ref?, propietario (nombre), activo_ref, activo_nombre? }
 *   onClose:     () => void
 *   onSuccess:   ({ anyo, trimestre, precio, comprador }) => void
 */
export default function SalidaPropietarioModal({ propietario, onClose, onSuccess, footprintCount = 1, floorLabel = '', edifId = null, floorId = null, tramoSup = 0, ownerSupTotal = 0 }) {
  const [anyoVenta, setAnyoVenta]   = useState(String(new Date().getFullYear()))
  const [trimestre, setTrimestre]   = useState('Q' + (Math.floor(new Date().getMonth()/3)+1))
  const [precio, setPrecio]         = useState('')
  // Alcance de la venta: 'all' (todos sus tramos) | 'one' (solo la planta del aspa).
  // Solo se pregunta cuando ocupa más de una planta.
  const [scope, setScope]           = useState('all')
  const [search, setSearch]         = useState('')
  const [results, setResults]       = useState([])
  const [comprador, setComprador]   = useState(null) // { dynamics_id, nombre } | null
  const [desconocido, setDesconocido] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

  // Typeahead cuenta del comprador (dynamics)
  useEffect(() => {
    if (desconocido || !search || search.length < 2 || comprador) {
      setResults([]); return
    }
    let cancel = false
    const t = setTimeout(async () => {
      const { data = [] } = await supabase
        .from('dynamics_accounts')
        .select('dynamics_id, nombre, tipo, sector')
        .ilike('nombre', `%${search}%`)
        .order('nombre').limit(8)
      if (!cancel) setResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [search, comprador, desconocido])

  const canConfirm = useMemo(() => {
    if (!/^\d{4}$/.test(anyoVenta.trim())) return false
    if (!trimestre) return false
    if (!precio || isNaN(parseFloat(precio))) return false
    // Comprador es opcional — si !desconocido y no hay selected, vale; si
    // desconocido marcado, vale; si selected, vale.
    return true
  }, [anyoVenta, trimestre, precio])

  // Sustitución (opción A): lo vendido NO se borra, pasa a "Propietario
  // desconocido" (se completa el comprador real luego desde el panel del
  // stacking). Respeta el alcance: 'all' = todos sus tramos; 'one' = solo la
  // planta del aspa (mismo edificio + misma planta).
  const DESCONOCIDO = 'Propietario desconocido'
  const matchesOwner = (u) =>
    (propietario.id && u.prop_id) ? u.prop_id === propietario.id : u.n === propietario.propietario
  const sustituirStackingOrigen = async () => {
    if (!propietario.activo_ref) return
    const { data: act } = await supabase
      .from('activos')
      .select('stacking_data')
      .eq('ref', propietario.activo_ref)
      .single()
    if (!act?.stacking_data) return
    const inScope = (b, row) =>
      scope === 'all' || (String(b.id) === String(edifId) && row.p === floorId)
    const updated = act.stacking_data.map(b => ({
      ...b,
      prop: (b.prop || []).map(row =>
        inScope(b, row)
          ? { ...row, units: (row.units || []).map(u => matchesOwner(u) ? { ...u, n: DESCONOCIDO, prop_id: null } : u) }
          : row
      ),
    }))
    await supabase.from('activos').update({ stacking_data: updated }).eq('ref', propietario.activo_ref)
  }

  // Convierte año + trimestre en una fecha aproximada (1º día del trimestre).
  // El campo motivo_salida es text; precio_venta y comprador_cuenta no existen
  // como columnas todavía, así que los guardamos en observaciones / notas.
  const trimestreToMonth = { Q1:1, Q2:4, Q3:7, Q4:10 }

  // El stacking puede llevar prop_id sintéticos (LEGACY-…) para propietarios sin
  // fila real en BD. Esos NO son uuid → no se puede filtrar la tabla por id con
  // ellos (Postgres lanza "invalid input syntax for type uuid"). En ese caso
  // caemos al match por activo_ref + nombre.
  const isUuid = (v) => typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

  const handleConfirm = async () => {
    if (!canConfirm) return
    setSaving(true); setError(null)
    try {
      const m = trimestreToMonth[trimestre] || 1
      const fechaAprox = `${anyoVenta}-${String(m).padStart(2,'0')}-01`
      const precioFmt = `${Number(precio).toLocaleString('es-ES')} €`
      const compradorTexto = desconocido
        ? 'Comprador desconocido'
        : (comprador?.nombre || 'Comprador desconocido')

      // observaciones: registro legible de la venta (incluye el precio).
      const observacion = `Venta ${trimestre} ${anyoVenta} · ${precioFmt} · ${compradorTexto}`
      // updated_at → para que en la lista aparezca arriba lo recién dado de baja.
      const saleCore = {
        fecha_salida:  fechaAprox,
        motivo_salida: 'Baja',
        estado:        'Vendido',
        observaciones: observacion,
        updated_at:    new Date().toISOString(),
      }
      const supVendida = scope === 'all' ? (ownerSupTotal || null) : (tramoSup || null)

      if (scope === 'all') {
        // Localiza la fila del propietario; si es legacy (sin fila), la crea para
        // que la venta quede guardada y salga en la lista + histórico.
        let rowId = isUuid(propietario.id) ? propietario.id : null
        if (!rowId && propietario.activo_ref) {
          const { data: found } = await supabase.from('propietarios')
            .select('id').eq('activo_ref', propietario.activo_ref).eq('propietario', propietario.propietario).limit(1)
          rowId = found?.[0]?.id || null
        }
        if (rowId) {
          const { error: upErr } = await supabase.from('propietarios').update(saleCore).eq('id', rowId)
          if (upErr) throw new Error(`Propietario: ${upErr.message}`)
        } else {
          const { error: insErr } = await supabase.from('propietarios').insert({
            propietario: propietario.propietario,
            activo_ref:  propietario.activo_ref,
            activo:      propietario.activo_nombre || null,
            superficie:  supVendida,
            ...saleCore,
          })
          if (insErr) throw new Error(`Propietario: ${insErr.message}`)
        }
      } else {
        // Venta parcial: el propietario conserva su fila (sigue siendo dueño del
        // resto). Creamos una fila de histórico para la superficie vendida.
        const { error: insErr } = await supabase.from('propietarios').insert({
          propietario: propietario.propietario,
          activo_ref:  propietario.activo_ref,
          activo:      propietario.activo_nombre || null,
          superficie:  supVendida,
          ...saleCore,
        })
        if (insErr) throw new Error(`Propietario: ${insErr.message}`)
      }

      await sustituirStackingOrigen()

      if (onSuccess) onSuccess({ scope, anyo: anyoVenta, trimestre, precio, comprador: comprador?.nombre || null })
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
            <div style={{fontSize:14,fontWeight:700}}>Dar de baja propietario</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
              {propietario.propietario} {propietario.activo_nombre ? `· ${propietario.activo_nombre}` : ''}
            </div>
          </div>
          <button onClick={onClose} disabled={saving} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,display:'flex'}}><X size={16}/></button>
        </div>

        <div style={{padding:'16px 18px',overflowY:'auto',display:'flex',flexDirection:'column',gap:14}}>

          <div style={{padding:'10px 12px',background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:6,fontSize:11,color:'#9a3412',lineHeight:1.55}}>
            Un propietario sale del activo porque <strong>lo ha vendido</strong>. Lo vendido pasa a <strong>«Propietario desconocido»</strong> (la superficie no queda huérfana); el comprador real se completa después desde el panel izquierdo del stacking.
          </div>

          {/* Alcance — solo si ocupa más de una planta */}
          {footprintCount > 1 && (
            <div>
              {lbl('Alcance de la venta', true)}
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',border:`1px solid ${scope==='all'?'var(--accent)':'var(--border)'}`,borderRadius:6,cursor:'pointer',fontSize:12}}>
                  <input type="radio" name="scope" checked={scope==='all'} onChange={()=>setScope('all')} style={{accentColor:'var(--accent)'}}/>
                  <span>Toda su superficie <span style={{color:'var(--text4)'}}>· {footprintCount} plantas</span></span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',border:`1px solid ${scope==='one'?'var(--accent)':'var(--border)'}`,borderRadius:6,cursor:'pointer',fontSize:12}}>
                  <input type="radio" name="scope" checked={scope==='one'} onChange={()=>setScope('one')} style={{accentColor:'var(--accent)'}}/>
                  <span>Solo esta planta{floorLabel ? <span style={{color:'var(--text4)'}}> · {floorLabel}</span> : null}</span>
                </label>
              </div>
            </div>
          )}

          {/* Año + Trimestre */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              {lbl('Año de venta', true)}
              <input type="number" value={anyoVenta} onChange={e=>setAnyoVenta(e.target.value)} placeholder="2026" style={inp}/>
            </div>
            <div>
              {lbl('Trimestre', true)}
              <select value={trimestre} onChange={e=>setTrimestre(e.target.value)} style={inp}>
                <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
              </select>
            </div>
          </div>

          {/* Precio de venta */}
          <div>
            {lbl('Precio de venta (€)', true)}
            <input type="number" value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Ej. 45000000" style={{...inp,fontFamily:'var(--mono)'}}/>
          </div>

          {/* Comprador (cuenta) — opcional */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              {lbl('Comprador (cuenta)', false)}
              <label style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text3)',cursor:'pointer'}}>
                <input type="checkbox" checked={desconocido} onChange={e=>{ setDesconocido(e.target.checked); if (e.target.checked) { setComprador(null); setSearch('') } }} style={{accentColor:'var(--accent)'}}/>
                Comprador desconocido
              </label>
            </div>

            {!desconocido && !comprador && (
              <div style={{position:'relative'}}>
                <div style={{position:'relative'}}>
                  <Search size={14} strokeWidth={1.75} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text4)',pointerEvents:'none'}}/>
                  <input
                    placeholder="Buscar cuenta del comprador en la PDB…"
                    value={search}
                    onChange={e=>setSearch(e.target.value)}
                    style={{...inp,paddingLeft:32}}
                  />
                </div>
                {results.length > 0 && (
                  <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,marginTop:4,maxHeight:240,overflowY:'auto',zIndex:10,boxShadow:'0 4px 14px rgba(0,0,0,0.08)'}}>
                    {results.map(r => (
                      <div key={r.dynamics_id} onClick={()=>{ setComprador(r); setSearch(''); setResults([]) }}
                        style={{padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',fontSize:12}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
                        onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <div style={{fontWeight:600}}>{r.nombre}</div>
                        <div style={{fontSize:10,color:'var(--text3)'}}>{[r.tipo, r.sector].filter(Boolean).join(' · ') || 'Cuenta Dynamics'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!desconocido && comprador && (
              <div style={{padding:'10px 12px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,display:'flex',alignItems:'center',gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#15803d'}}>{comprador.nombre}</div>
                  <div style={{fontSize:10,color:'#166534',fontFamily:'var(--mono)'}}>Dynamics · {comprador.dynamics_id}</div>
                </div>
                <button onClick={()=>setComprador(null)} style={{background:'none',border:'1px solid var(--border)',padding:'4px 10px',borderRadius:4,fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)'}}>Cambiar</button>
              </div>
            )}

            {desconocido && (
              <div style={{padding:'10px 12px',background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:6,fontSize:11,color:'#9a3412'}}>
                La operación se registrará como <strong>comprador desconocido</strong>. Podrás añadir la cuenta más adelante desde el histórico del edificio.
              </div>
            )}
          </div>

          {error && (
            <div style={{display:'flex',alignItems:'flex-start',gap:6,padding:10,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:6,fontSize:11,color:'#991b1b'}}>
              <AlertCircle size={13} strokeWidth={1.75} style={{flexShrink:0,marginTop:1}}/>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:8,padding:'12px 18px',borderTop:'1px solid var(--border)',background:'var(--gray-lt)'}}>
          <button onClick={onClose} disabled={saving} style={{padding:'8px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
          <button onClick={handleConfirm} disabled={!canConfirm||saving} style={{padding:'8px 18px',background:canConfirm?'var(--red)':'#fca5a5',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:canConfirm?(saving?'wait':'pointer'):'not-allowed',fontFamily:'inherit',opacity:saving?0.7:1}}>
            {saving ? 'Procesando…' : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </div>
  )
}
