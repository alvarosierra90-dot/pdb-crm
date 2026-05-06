import { useState } from 'react'
import { Lock, Unlock, X, Check, ShieldAlert } from 'lucide-react'

/**
 * Panel de Confidencialidad reusable.
 * Formato canónico definido en docs/spec/spec-modulos.md (regla universal):
 * NUNCA cambiar de formato entre módulos — esta misma estructura aplica a
 * Oferta · Activo · Demanda · Mandato · Propuesta · Proyecto · Negociación
 * · Propietario · Arrendatario · Portfolio.
 *
 * Props
 * - entityLabel:    string. "Oferta", "Activo", "Demanda", etc.
 * - confidential:   boolean.
 * - onToggle:       (next:boolean) => void.
 * - hiddenFields:   string[]. Campos ocultos para no autorizados (default lista de Oferta).
 * - visibleFields:  string[]. Campos siempre visibles (default lista de Oferta).
 * - authorizedUsers: Array<{name,team,role,initials,bg,color,granted?,owner?}>.
 * - onAddUser:      (newUser:string) => void.   El newUser viene del select.
 * - onRemoveUser:   (idx:number) => void.
 * - responsable:    string. Nombre que recibe la solicitud de acceso (default "el responsable").
 * - traza:          Array<{color,msg,date}>. Eventos de trazabilidad.
 */
export default function ConfidencialidadPanel({
  entityLabel = 'registro',
  confidential,
  onToggle,
  hiddenFields = ['Activo / Inmueble','Dirección y ubicación','Condiciones económicas','Documentación adjunta','Stacking plan'],
  visibleFields = ['Cuenta','Tipo de operación','Estado','Equipo','Información básica'],
  authorizedUsers = [],
  onAddUser,
  onRemoveUser,
  responsable = 'el responsable',
  traza = [],
  usersAvailable = [
    'GOMEZ Ignacio · Leasing Oficinas MAD',
    'García Marta · Capital Markets MAD',
    'López Carmen · Valoraciones MAD',
    'Alonso Abruña D. · Leasing MAD',
    'Martínez Rosa · Retail MAD',
  ],
}) {
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState('')

  return (
    <div className="tab-content active" style={{ overflowY:'auto', flex:1 }}><div className="info-pad">

      {/* Toggle confidencialidad */}
      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 18px', border:`1px solid ${confidential?'#334155':'var(--border)'}`, borderRadius:'var(--r2)', background:confidential?'#0f172a':'var(--surface)', marginBottom:18 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:confidential?'#f8fafc':'var(--text)', textTransform:'capitalize' }}>{entityLabel} confidencial</div>
          <div style={{ fontSize:11, color:confidential?'#94a3b8':'var(--text3)', marginTop:2 }}>
            {confidential
              ? 'Datos sensibles ocultos para usuarios no autorizados.'
              : `Visible para todos los usuarios con acceso al PDB.`}
          </div>
        </div>
        <button onClick={() => onToggle?.(!confidential)} style={{ padding:'6px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', background:confidential?'#f8fafc':'#1e293b', color:confidential?'#0f172a':'#f8fafc', display:'inline-flex', alignItems:'center', gap:6 }}>
          {confidential ? <><Unlock size={13} strokeWidth={2}/> Desactivar</> : <><Lock size={13} strokeWidth={2}/> Activar</>}
        </button>
      </div>

      {/* Visibilidad — solo cuando confidencial */}
      {confidential && (
        <div className="va-two-col">
          <div className="va-meta-card">
            <div className="va-meta-head accent-red"><span className="dot"/>Oculto para no autorizados</div>
            <div className="va-kv-list">
              {hiddenFields.map(item => (
                <div key={item} className="ir">
                  <span className="ir-k" style={{display:'flex',alignItems:'center',gap:6}}><X size={11} strokeWidth={2.25} color="var(--red)"/> {item}</span>
                  <span className="ir-v"><span style={{color:'var(--red)',fontSize:10,fontWeight:600}}>Oculto</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className="va-meta-card">
            <div className="va-meta-head accent-green"><span className="dot"/>Visible siempre</div>
            <div className="va-kv-list">
              {visibleFields.map(item => (
                <div key={item} className="ir">
                  <span className="ir-k" style={{display:'flex',alignItems:'center',gap:6}}><Check size={11} strokeWidth={2.25} color="var(--green)"/> {item}</span>
                  <span className="ir-v"><span style={{color:'var(--green)',fontSize:10,fontWeight:600}}>Visible</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Usuarios autorizados */}
      <div className="va-card">
        <div className="va-card-header">
          <h3>Usuarios autorizados</h3>
          <button className="ab-btn blue" onClick={() => setAddingUser(true)}>+ Añadir usuario</button>
        </div>
        <div style={{padding:'4px 20px 16px'}}>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {authorizedUsers.map((u,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:u.bg, color:u.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{u.initials}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>{u.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{u.team} · {u.role}</div>
                </div>
                {u.owner ? (
                  <span className="tag tag-blue">Propietario</span>
                ) : (
                  <>
                    <span style={{ fontSize:10, color:'var(--text4)' }}>Acceso: {u.granted}</span>
                    <button onClick={() => onRemoveUser?.(i)} style={{ fontSize:11, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 6px', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:3 }}>
                      <X size={11} strokeWidth={2}/> Quitar
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          {addingUser && (
            <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r2)', padding:14, marginTop:12 }}>
              <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Conceder acceso</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase' }}>Usuario</span>
                  <select className="fsel" value={newUser} onChange={e => setNewUser(e.target.value)} style={{ minWidth:220 }}>
                    <option value="">Seleccionar...</option>
                    {usersAvailable.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <button className="ab-btn save" onClick={() => {
                  if (!newUser) return
                  onAddUser?.(newUser)
                  setAddingUser(false); setNewUser('')
                }}>Conceder acceso</button>
                <button className="ab-btn" onClick={() => { setAddingUser(false); setNewUser('') }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo no autorizado */}
      {confidential && (
        <div className="va-card">
          <div className="va-card-header">
            <h3>Vista de usuario no autorizado (demo)</h3>
          </div>
          <div style={{padding:'4px 20px 16px'}}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', border:'1px solid var(--amber-bd)', borderRadius:'var(--r)', background:'var(--amber-lt)' }}>
              <ShieldAlert size={20} strokeWidth={1.75} color="var(--amber)" style={{flexShrink:0}}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, textTransform:'capitalize' }}>{entityLabel} confidencial</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>No tienes permisos. Puedes solicitar acceso a {responsable}.</div>
              </div>
              <button className="ab-btn save" style={{ flexShrink:0 }} onClick={() => alert(`Solicitud enviada a ${responsable}`)}>Solicitar acceso</button>
            </div>
          </div>
        </div>
      )}

      {/* Trazabilidad */}
      {traza.length > 0 && (
        <div className="va-card">
          <div className="va-card-header">
            <h3>Trazabilidad de accesos</h3>
          </div>
          <div style={{padding:'4px 0 0'}}>
            {traza.map((e,i,arr) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 20px', borderTop:i===0?'1px solid var(--border)':'none', borderBottom:i<arr.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:e.color, flexShrink:0, marginTop:5 }} />
                <div>
                  <div style={{ fontSize:12 }}>{e.msg}</div>
                  <div style={{ fontSize:10, color:'var(--text4)', marginTop:2 }}>{e.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div></div>
  )
}
