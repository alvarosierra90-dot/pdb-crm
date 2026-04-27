import { useState } from 'react'

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
const lbl = { fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4, display:'block' }
const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', boxSizing:'border-box', outline:'none' }

const TIPO_DESTINOS = {
  demanda:  [
    { key:'demanda',   label:'Crear Demanda en PDB', desc:'Perfil de búsqueda con uso, superficie, renta máx.' },
    { key:'oport',     label:'Crear Oportunidad en Dynamics', desc:'Registro maestro WIP en sistema Dynamics 365.' },
    { key:'ambas',     label:'Demanda + Oportunidad', desc:'Crea ambas y las vincula automáticamente.' },
  ],
  oferta:   [
    { key:'oferta',    label:'Crear Oferta en PDB', desc:'Producto disponible al mercado, vinculado al activo.' },
    { key:'oport',     label:'Crear Oportunidad en Dynamics', desc:'Registro maestro WIP en sistema Dynamics 365.' },
    { key:'ambas',     label:'Oferta + Oportunidad', desc:'Crea ambas y las vincula automáticamente.' },
  ],
  servicio: [
    { key:'oport',     label:'Crear Oportunidad en Dynamics', desc:'Único destino válido. Sin activo, oferta ni demanda.' },
  ],
}

export default function TransformarLeadModal({ lead, onClose }) {
  const [destino, setDestino]   = useState(lead.tipo === 'servicio' ? 'oport' : '')
  const [cuenta, setCuenta]     = useState(lead.cuenta || '')
  const [contacto, setContacto] = useState(lead.contacto || '')
  const [crearCuenta, setCrearCuenta] = useState(false)
  const [submitted, setSubmitted]     = useState(false)

  const opciones = TIPO_DESTINOS[lead.tipo] || []

  const tieneVinculo = (cuenta && cuenta.trim()) || (contacto && contacto.trim())
  const puedeTransformar = tieneVinculo && destino

  const handleTransformar = () => {
    if (!puedeTransformar) return
    setSubmitted(true)
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>

        <div style={header}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>⚡ Transformar lead</div>
            <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>{lead.id} · {lead.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text4)' }}>×</button>
        </div>

        {submitted ? (
          <>
            <div style={body}>
              <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, padding:14, display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>✓ Lead transformado correctamente</div>
                <div style={{ fontSize:11, color:'#166534' }}>
                  En producción, este flujo lanzará Dynamics 365 con los datos preasignados.
                  El usuario completará el registro en Dynamics y la oportunidad sincronizará de vuelta al PDB automáticamente.
                </div>
              </div>
              <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>Destino creado</div>
                <div style={{ fontSize:12, color:'var(--text)', fontWeight:600 }}>
                  {opciones.find(o => o.key === destino)?.label}
                </div>
              </div>
              <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>Vinculaciones</div>
                {cuenta && <div style={{ fontSize:11, color:'var(--text)', marginBottom:3 }}>🏢 Cuenta: <strong>{cuenta}</strong></div>}
                {contacto && <div style={{ fontSize:11, color:'var(--text)' }}>👤 Contacto: <strong>{contacto}</strong></div>}
              </div>
            </div>
            <div style={footer}>
              <button className="ab-btn save" onClick={onClose}>Cerrar</button>
            </div>
          </>
        ) : (
          <>
            <div style={body}>
              {/* Vinculación obligatoria */}
              <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#92400e', display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  ⚠️ Vinculación obligatoria
                </div>
                <div style={{ fontSize:11, color:'#7c2d12' }}>
                  Para transformar un lead es <strong>obligatorio</strong> vincularlo al menos a una Cuenta o un Contacto. No se puede crear oportunidad sin trazabilidad comercial.
                </div>
              </div>

              <div>
                <label style={lbl}>Cuenta vinculada</label>
                <input style={inp} placeholder="Buscar cuenta existente o escribir nueva..." value={cuenta} onChange={e => setCuenta(e.target.value)} />
                <div style={{ fontSize:10, color:'var(--text4)', marginTop:4 }}>
                  {lead.cuenta ? `Cuenta detectada en el lead: ${lead.cuenta}` : 'Sin cuenta detectada — vincula una existente o crea una nueva'}
                </div>
              </div>

              <div>
                <label style={lbl}>Contacto vinculado</label>
                <input style={inp} placeholder="Nombre del contacto..." value={contacto} onChange={e => setContacto(e.target.value)} />
              </div>

              {!tieneVinculo && (
                <div style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>
                  ✗ Necesitas al menos Cuenta o Contacto para continuar
                </div>
              )}

              {/* Destino según tipo */}
              <div>
                <label style={lbl}>Destino · Lead de tipo "{lead.tipo === 'demanda' ? 'Demanda' : lead.tipo === 'oferta' ? 'Oferta' : 'Cuenta / Servicio'}"</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
                  {opciones.map(opt => (
                    <div
                      key={opt.key}
                      onClick={() => setDestino(opt.key)}
                      style={{
                        border: destino === opt.key ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: destino === opt.key ? 'var(--accent-lt)' : 'var(--surface)',
                        borderRadius:8, padding:'10px 12px', cursor:'pointer',
                      }}
                    >
                      <div style={{ fontSize:12, fontWeight:700, color: destino === opt.key ? 'var(--accent)' : 'var(--text)' }}>
                        {destino === opt.key ? '● ' : '○ '}{opt.label}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:3, marginLeft:14 }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Dynamics */}
              {(destino === 'oport' || destino === 'ambas') && (
                <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1e40af', display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <span style={{ width:14, height:14, borderRadius:3, background:'#0078d4', color:'#fff', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>D</span>
                    Sincronización con Microsoft Dynamics 365
                  </div>
                  <div style={{ fontSize:11, color:'#1e3a8a' }}>
                    PDB lanzará Dynamics con los datos preasignados. El usuario completa el registro allí. Dynamics sincroniza la oportunidad de vuelta al PDB automáticamente, manteniendo la trazabilidad con este lead.
                  </div>
                </div>
              )}
            </div>

            <div style={footer}>
              <button className="ab-btn" onClick={onClose}>Cancelar</button>
              <button
                className="ab-btn save"
                onClick={handleTransformar}
                disabled={!puedeTransformar}
                style={{
                  opacity: puedeTransformar ? 1 : 0.5,
                  cursor: puedeTransformar ? 'pointer' : 'not-allowed',
                }}
              >
                ⚡ Transformar lead
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
