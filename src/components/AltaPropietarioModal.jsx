import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, X, AlertCircle } from 'lucide-react'

/**
 * Modal de alta rápida de Propietario desde el Stacking Plan.
 *
 * Reglas pedidas por el usuario (mayo 2026):
 * - Lupa con autocomplete sobre `dynamics_accounts` (master read-only).
 *   No se permite escribir libre — solo seleccionar de la PDB.
 * - Campos vacíos por defecto. Placeholder gris cursiva
 *   "Pendiente de completar" en los opcionales.
 * - Campos obligatorios con asterisco rojo + reborde rojo si faltan
 *   al guardar.
 * - La superficie NO se mete aquí. Se completa al arrastrar al stacking.
 *
 * Props
 * - onClose:   () => void
 * - onSave:    (propietario:{id, propietario, dynamics_id?, desconocido, anyo_firma, trimestre, ...}) => void
 * - activoRef: ref del activo al que se vincula (informativo).
 */
export default function AltaPropietarioModal({ onClose, onSave, activoRef }) {
  const [desconocido, setDesconocido] = useState(false)

  // Búsqueda de cuenta
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)  // { dynamics_id, nombre, tipo, sector }

  // Resto de campos (vacíos por defecto)
  const [form, setForm] = useState({
    anyo_firma: '',
    trimestre: '',
    perfil_inversor: '',
    estrategia: '',
    horizonte_inv: '',
    cap_rate: '',
    yield_pct: '',
    notas: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Autocomplete debounced sobre dynamics_accounts
  useEffect(() => {
    if (desconocido) { setResults([]); return }
    if (!search || search.length < 2) { setResults([]); return }
    let cancel = false
    const t = setTimeout(async () => {
      const { data = [] } = await supabase.from('dynamics_accounts')
        .select('dynamics_id, nombre, tipo, sector')
        .ilike('nombre', `%${search}%`)
        .order('nombre')
        .limit(8)
      if (!cancel) setResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [search, desconocido])

  // Validación
  const missingCuenta    = !desconocido && !selected
  const missingAnyoFirma = !form.anyo_firma || !/^\d{4}$/.test(form.anyo_firma.trim())
  const missingTrimestre = !form.trimestre
  const hasErrors = missingCuenta || missingAnyoFirma || missingTrimestre

  const handleSave = () => {
    setSubmitted(true)
    if (hasErrors) return
    setSaving(true)
    const payload = {
      id: `PROP-${Date.now()}`,
      propietario: desconocido ? 'Propietario desconocido' : selected.nombre,
      dynamics_id: desconocido ? null : selected.dynamics_id,
      desconocido,
      ...form,
      activo_ref: activoRef || null,
    }
    onSave?.(payload)
  }

  const inpBase = { padding:'8px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', background:'var(--surface)', color:'var(--text)', width:'100%', boxSizing:'border-box' }
  const inpError = { ...inpBase, borderColor:'var(--red)', background:'#fef2f2' }
  const placeholderItalic = { fontStyle:'italic', color:'var(--text4)' }

  const fieldLabel = (txt, required) => (
    <div style={{ fontSize:10, fontWeight:700, color:required && submitted && (txt==='Año de firma' ? missingAnyoFirma : txt==='Trimestre' ? missingTrimestre : false) ? 'var(--red)' : 'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>
      {txt}{required && <span style={{color:'var(--red)',marginLeft:2}}>*</span>}
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:10,width:'min(640px,100%)',maxHeight:'90vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 12px 32px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:14,fontWeight:700}}>Añadir propietario al stacking</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,display:'flex'}}><X size={16}/></button>
        </div>

        <div style={{padding:'16px 18px',overflowY:'auto'}}>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:14,padding:'8px 10px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:6}}>
            La cuenta debe existir en la PDB (sincronizada desde Dynamics). Si no, marca <strong>Propietario desconocido</strong>. La superficie se asigna después arrastrando al stacking.
          </div>

          {/* Sección 1: Vinculación Cuenta */}
          <div style={{marginBottom:18}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              {fieldLabel('Cuenta', true)}
              <label style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text3)',cursor:'pointer'}}>
                <input type="checkbox" checked={desconocido} onChange={e=>{ setDesconocido(e.target.checked); if (e.target.checked) { setSelected(null); setSearch('') } }} style={{accentColor:'var(--accent)'}}/>
                Propietario desconocido
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
                    <AlertCircle size={11} strokeWidth={2}/> Selecciona una cuenta de la PDB o marca "Propietario desconocido".
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
                Se registrará como <strong>Propietario desconocido</strong>. Podrás vincular la cuenta más adelante.
              </div>
            )}
          </div>

          {/* Sección 2: Año y trimestre (obligatorios) */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:18}}>
            <div>
              {fieldLabel('Año de firma', true)}
              <input
                type="number"
                style={submitted && missingAnyoFirma ? inpError : inpBase}
                placeholder="Ej. 2024"
                value={form.anyo_firma}
                onChange={e=>set('anyo_firma', e.target.value)}
              />
            </div>
            <div>
              {fieldLabel('Trimestre', true)}
              <select
                style={submitted && missingTrimestre ? inpError : inpBase}
                value={form.trimestre}
                onChange={e=>set('trimestre', e.target.value)}>
                <option value="">Pendiente de completar</option>
                <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
              </select>
            </div>
          </div>

          {/* Sección 3: Resto opcional */}
          <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Datos opcionales</div>
          <div style={{fontSize:11,color:'var(--text4)',marginBottom:10,fontStyle:'italic'}}>Estos campos se pueden cumplimentar más tarde desde la ficha del propietario.</div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              {fieldLabel('Perfil inversor')}
              <input style={inpBase} placeholder="Pendiente de completar" value={form.perfil_inversor} onChange={e=>set('perfil_inversor', e.target.value)}/>
            </div>
            <div>
              {fieldLabel('Estrategia')}
              <select style={inpBase} value={form.estrategia} onChange={e=>set('estrategia', e.target.value)}>
                <option value="">Pendiente de completar</option>
                <option>Core</option><option>Core+</option><option>Value-add</option><option>Opportunistic</option>
              </select>
            </div>
            <div>
              {fieldLabel('Horizonte (años)')}
              <input type="number" style={inpBase} placeholder="Pendiente de completar" value={form.horizonte_inv} onChange={e=>set('horizonte_inv', e.target.value)}/>
            </div>
            <div>
              {fieldLabel('Cap Rate (%)')}
              <input type="number" style={inpBase} placeholder="Pendiente de completar" value={form.cap_rate} onChange={e=>set('cap_rate', e.target.value)}/>
            </div>
            <div style={{gridColumn:'1 / span 2'}}>
              {fieldLabel('Notas')}
              <textarea style={{...inpBase,minHeight:60,resize:'vertical'}} placeholder="Pendiente de completar" value={form.notas} onChange={e=>set('notas', e.target.value)}/>
            </div>
          </div>

          {error && (
            <div style={{marginTop:14,padding:'10px 12px',background:'var(--red-lt)',border:'1px solid var(--red-bd)',borderRadius:6,fontSize:11,color:'var(--red)'}}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',borderTop:'1px solid var(--border)',background:'var(--gray-lt)'}}>
          <div style={{fontSize:10,color:'var(--text4)'}}>La superficie se asigna después arrastrando al stacking.</div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={onClose} style={{padding:'8px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{padding:'8px 18px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:saving?'wait':'pointer',fontFamily:'inherit',opacity:saving?0.7:1}}>{saving ? 'Guardando…' : 'Guardar propietario'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
