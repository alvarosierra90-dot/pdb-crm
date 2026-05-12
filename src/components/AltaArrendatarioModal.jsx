import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, X, AlertCircle } from 'lucide-react'

/**
 * Modal de alta rápida de Arrendatario desde el Stacking Plan.
 *
 * Reglas (mayo 2026):
 * - Lupa autocomplete sobre `dynamics_accounts`. No texto libre.
 * - Campos vacíos por defecto. "Pendiente de completar" en placeholders.
 * - Obligatorios: Cuenta (o desconocido), Año firma, Trimestre,
 *   Fecha inicio contrato, Recordatorio.
 * - La superficie viene del stacking (drag&drop).
 *
 * Props
 * - onClose:   () => void
 * - onSave:    (arrendatario) => void
 * - activoRef: ref del activo.
 */
export default function AltaArrendatarioModal({ onClose, onSave, activoRef }) {
  const [desconocido, setDesconocido] = useState(false)

  // Búsqueda de cuenta
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)

  const [form, setForm] = useState({
    anyo_firma: '',
    trimestre: '',
    fecha_inicio: '',
    recordatorio: '',
    renta_m2: '',
    renta_mensual: '',
    break_option: '',
    fecha_fin: '',
    notas: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (desconocido) { setResults([]); return }
    if (!search || search.length < 2) { setResults([]); return }
    let cancel = false
    const t = setTimeout(async () => {
      const { data = [] } = await supabase.from('dynamics_accounts')
        .select('dynamics_id, nombre, tipo, sector')
        .ilike('nombre', `%${search}%`)
        .order('nombre').limit(8)
      if (!cancel) setResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [search, desconocido])

  // Validación — todos los obligatorios
  const missingCuenta       = !desconocido && !selected
  const missingAnyoFirma    = !form.anyo_firma || !/^\d{4}$/.test(form.anyo_firma.trim())
  const missingTrimestre    = !form.trimestre
  const missingFechaInicio  = !form.fecha_inicio
  const missingRecordatorio = !form.recordatorio
  const hasErrors = missingCuenta || missingAnyoFirma || missingTrimestre || missingFechaInicio || missingRecordatorio

  const handleSave = () => {
    setSubmitted(true)
    if (hasErrors) return
    setSaving(true)
    const payload = {
      id: `ARR-${Date.now()}`,
      tenant: desconocido ? 'Arrendatario desconocido' : selected.nombre,
      dynamics_id: desconocido ? null : selected.dynamics_id,
      tenant_desconocido: desconocido,
      ...form,
      activo_ref: activoRef || null,
    }
    onSave?.(payload)
  }

  const inpBase  = { padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', background:'var(--surface)', color:'var(--text)', width:'100%', boxSizing:'border-box' }
  const inpError = { ...inpBase, borderColor:'var(--red)', background:'#fef2f2' }

  const lbl = (txt, required, isMissing) => (
    <div style={{ fontSize:10, fontWeight:700, color:required && submitted && isMissing ? 'var(--red)' : 'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>
      {txt}{required && <span style={{color:'var(--red)',marginLeft:2}}>*</span>}
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:10,width:'min(680px,100%)',maxHeight:'90vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 12px 32px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:14,fontWeight:700}}>Añadir arrendatario al stacking</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,display:'flex'}}><X size={16}/></button>
        </div>

        <div style={{padding:'16px 18px',overflowY:'auto'}}>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:14,padding:'8px 10px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:6}}>
            Cuenta arrendataria desde la PDB (sincronizada con Dynamics). Si aún no hay cuenta, marca <strong>Arrendatario desconocido</strong>. La superficie se asigna después arrastrando al stacking.
          </div>

          {/* Vinculación Cuenta */}
          <div style={{marginBottom:18}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              {lbl('Arrendatario (Cuenta)', true, missingCuenta)}
              <label style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text3)',cursor:'pointer'}}>
                <input type="checkbox" checked={desconocido} onChange={e=>{ setDesconocido(e.target.checked); if (e.target.checked) { setSelected(null); setSearch('') } }} style={{accentColor:'var(--accent)'}}/>
                Arrendatario desconocido
              </label>
            </div>

            {!desconocido && !selected && (
              <div style={{position:'relative'}}>
                <div style={{position:'relative'}}>
                  <Search size={14} strokeWidth={1.75} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text4)',pointerEvents:'none'}}/>
                  <input
                    autoFocus
                    style={{...(submitted && missingCuenta ? inpError : inpBase), paddingLeft:32}}
                    placeholder="Buscar cuenta en la PDB…"
                    value={search}
                    onChange={e=>setSearch(e.target.value)}
                  />
                </div>
                {results.length > 0 && (
                  <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,marginTop:4,maxHeight:240,overflowY:'auto',zIndex:10,boxShadow:'0 4px 14px rgba(0,0,0,0.08)'}}>
                    {results.map(r => (
                      <div key={r.dynamics_id} onClick={()=>{ setSelected(r); setSearch(''); setResults([]) }}
                        style={{padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',fontSize:12}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
                        onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <div style={{fontWeight:600}}>{r.nombre}</div>
                        <div style={{fontSize:10,color:'var(--text3)'}}>{[r.tipo, r.sector].filter(Boolean).join(' · ') || 'Cuenta Dynamics'}</div>
                      </div>
                    ))}
                  </div>
                )}
                {submitted && missingCuenta && (
                  <div style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:6,fontSize:10,color:'var(--red)',fontWeight:600}}>
                    <AlertCircle size={11} strokeWidth={2}/> Selecciona una cuenta de la PDB o marca "Arrendatario desconocido".
                  </div>
                )}
              </div>
            )}

            {!desconocido && selected && (
              <div style={{padding:'10px 12px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,display:'flex',alignItems:'center',gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#15803d'}}>{selected.nombre}</div>
                  <div style={{fontSize:10,color:'#166534',fontFamily:'var(--mono)'}}>Dynamics · {selected.dynamics_id}</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:'none',border:'1px solid var(--border)',padding:'4px 10px',borderRadius:4,fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)'}}>Cambiar</button>
              </div>
            )}

            {desconocido && (
              <div style={{padding:'10px 12px',background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:6,fontSize:11,color:'#9a3412'}}>
                Se registrará como <strong>Arrendatario desconocido</strong>. Podrás vincular la cuenta más adelante.
              </div>
            )}
          </div>

          {/* Obligatorios: año, trimestre, fecha inicio, recordatorio */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            <div>
              {lbl('Año de firma', true, missingAnyoFirma)}
              <input type="number" style={submitted && missingAnyoFirma ? inpError : inpBase}
                placeholder="Ej. 2024" value={form.anyo_firma} onChange={e=>set('anyo_firma', e.target.value)}/>
            </div>
            <div>
              {lbl('Trimestre', true, missingTrimestre)}
              <select style={submitted && missingTrimestre ? inpError : inpBase}
                value={form.trimestre} onChange={e=>set('trimestre', e.target.value)}>
                <option value="">Pendiente de completar</option>
                <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
              </select>
            </div>
            <div>
              {lbl('Fecha inicio contrato', true, missingFechaInicio)}
              <input type="date" style={submitted && missingFechaInicio ? inpError : inpBase}
                value={form.fecha_inicio} onChange={e=>set('fecha_inicio', e.target.value)}/>
            </div>
            <div>
              {lbl('Recordatorio', true, missingRecordatorio)}
              <input type="date" style={submitted && missingRecordatorio ? inpError : inpBase}
                value={form.recordatorio} onChange={e=>set('recordatorio', e.target.value)}/>
            </div>
          </div>

          {/* Opcionales */}
          <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Datos opcionales</div>
          <div style={{fontSize:11,color:'var(--text4)',marginBottom:10,fontStyle:'italic'}}>Pendiente de completar — se pueden añadir más tarde desde la ficha del arrendatario.</div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              {lbl('Renta €/m²/mes')}
              <input type="number" style={inpBase} placeholder="Pendiente de completar" value={form.renta_m2} onChange={e=>set('renta_m2', e.target.value)}/>
            </div>
            <div>
              {lbl('Renta mensual (€)')}
              <input type="number" style={inpBase} placeholder="Pendiente de completar" value={form.renta_mensual} onChange={e=>set('renta_mensual', e.target.value)}/>
            </div>
            <div>
              {lbl('Break option')}
              <input type="date" style={inpBase} value={form.break_option} onChange={e=>set('break_option', e.target.value)}/>
            </div>
            <div>
              {lbl('Fecha fin contrato')}
              <input type="date" style={inpBase} value={form.fecha_fin} onChange={e=>set('fecha_fin', e.target.value)}/>
            </div>
            <div style={{gridColumn:'1 / span 2'}}>
              {lbl('Notas')}
              <textarea style={{...inpBase,minHeight:60,resize:'vertical'}} placeholder="Pendiente de completar" value={form.notas} onChange={e=>set('notas', e.target.value)}/>
            </div>
          </div>

          {error && (
            <div style={{marginTop:14,padding:'10px 12px',background:'var(--red-lt)',border:'1px solid var(--red-bd)',borderRadius:6,fontSize:11,color:'var(--red)'}}>{error}</div>
          )}
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',borderTop:'1px solid var(--border)',background:'var(--gray-lt)'}}>
          <div style={{fontSize:10,color:'var(--text4)'}}>La superficie se asigna después arrastrando al stacking.</div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={onClose} style={{padding:'8px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{padding:'8px 18px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:saving?'wait':'pointer',fontFamily:'inherit',opacity:saving?0.7:1}}>{saving ? 'Guardando…' : 'Guardar arrendatario'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
