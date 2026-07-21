import { useState } from 'react'
import { EQUIPOS_SAVILLS, MIEMBROS_POR_EQUIPO } from './EquipoTrabajoCard'
import PersonaCard, { StarRating, TelefonoInline, toneOf, iniciales } from './PersonaCard'

// Un único bloque de personas para las fichas. Tres categorías (Empleados,
// Proveedores, Clientes) con toggle Grupo/Tabla, valoración por estrellas y
// teléfono. Sustituye a la vez la vista "tabla" (EquipoTrabajoCard) y la vista
// "cards" inline, que antes convivían incoherentes en distintas fichas.

const SECCIONES = [
  { key:'empleados',   label:'Empleados',   roles:['Principal','Soporte'], defRol:'Soporte',     accent:'#0a66c2', match: m => m.rol === 'Principal' || m.rol === 'Soporte' },
  { key:'proveedores', label:'Proveedores', roles:['Colaborador'],         defRol:'Colaborador', accent:'#6b21a8', match: m => m.rol === 'Colaborador' },
  { key:'clientes',    label:'Clientes',    roles:['Cliente'],             defRol:'Cliente',     accent:'#0f766e', match: m => m.rol === 'Cliente' },
]

function AddForm({ seccion, onSubmit, onCancel }) {
  const [equipo, setEquipo]     = useState('')
  const [miembro, setMiembro]   = useState('')
  const [rol, setRol]           = useState(seccion.defRol)
  const [telefono, setTelefono] = useState('')

  const esEmpleados   = seccion.key === 'empleados'
  const esProveedores = seccion.key === 'proveedores'
  const esClientes    = seccion.key === 'clientes'
  const libre = esClientes || equipo === 'Agente externo'

  const nombre = miembro.trim()
  const valido = esClientes ? (nombre && equipo.trim()) : (equipo && nombre)

  const opcionesEquipo = esEmpleados ? EQUIPOS_SAVILLS
    : esProveedores ? [...EQUIPOS_SAVILLS, 'Agente externo']
    : []

  const bg = seccion.key === 'proveedores' ? '#faf5ff' : seccion.key === 'clientes' ? '#f0fdfa' : '#f8fafc'
  const bd = seccion.key === 'proveedores' ? '#e9d5ff' : seccion.key === 'clientes' ? '#a7f3d0' : '#e2e8f0'

  const submit = () => {
    if (!valido) return
    onSubmit({ nombre, equipo: equipo.trim(), rol, telefono: telefono.trim() || null })
  }

  return (
    <div style={{ marginTop:8, padding:'10px 12px', background:bg, border:`1px solid ${bd}`, borderRadius:10, display:'flex', flexDirection:'column', gap:6 }}>
      {esClientes ? (
        <>
          <input className="kf-inp" placeholder="Nombre del contacto" value={miembro} onChange={e => setMiembro(e.target.value)} style={{ fontSize:11.5 }} />
          <input className="kf-inp" placeholder="Empresa / cuenta" value={equipo} onChange={e => setEquipo(e.target.value)} style={{ fontSize:11.5 }} />
        </>
      ) : (
        <>
          <select className="fsel" value={equipo} onChange={e => { setEquipo(e.target.value); setMiembro('') }} style={{ fontSize:11.5 }}>
            <option value="">{esProveedores ? 'Equipo / consultora…' : 'Equipo…'}</option>
            {opcionesEquipo.map(eq => <option key={eq} value={eq}>{eq}</option>)}
          </select>
          {equipo && !libre && (
            <select className="fsel" value={miembro} onChange={e => setMiembro(e.target.value)} style={{ fontSize:11.5 }}>
              <option value="">Miembro…</option>
              {(MIEMBROS_POR_EQUIPO[equipo] || []).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          {libre && (
            <input className="kf-inp" placeholder="Nombre del agente externo" value={miembro} onChange={e => setMiembro(e.target.value)} style={{ fontSize:11.5 }} />
          )}
          {esEmpleados && (
            <select className="fsel" value={rol} onChange={e => setRol(e.target.value)} style={{ fontSize:11.5 }}>
              <option>Principal</option>
              <option>Soporte</option>
            </select>
          )}
        </>
      )}
      <input className="kf-inp" placeholder="Teléfono (opcional)" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ fontSize:11.5 }} />
      <div style={{ display:'flex', gap:6 }}>
        <button disabled={!valido} onClick={submit}
          style={{ flex:1, padding:'6px 10px', fontSize:11.5, fontWeight:600, border:'none', borderRadius:8, background: valido ? seccion.accent : '#cbd5e1', color:'#fff', cursor: valido ? 'pointer' : 'not-allowed' }}>Añadir</button>
        <button onClick={onCancel} style={{ padding:'6px 10px', fontSize:11.5, fontWeight:500, border:'1px solid var(--border)', borderRadius:8, background:'#fff', color:'#64748b', cursor:'pointer' }}>Cancelar</button>
      </div>
    </div>
  )
}

function TablaPersonas({ personas, idxOf, canManage, onRate, onRemove }) {
  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
      {personas.map((m, i) => {
        const t = toneOf(m.rol)
        return (
          <div key={`row-${i}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 11px', borderTop: i ? '1px solid var(--border)' : 'none', background:'#fff' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:t.bg, color:t.ink, border:`1px solid ${t.ring}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800 }}>{iniciales(m.nombre)}</div>
            {/* Nombre + teléfono a la derecha del nombre */}
            <div style={{ minWidth:0, flex:1, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={m.nombre}>{m.nombre}</span>
              <TelefonoInline telefono={m.telefono} style={{ flexShrink:0 }} />
            </div>
            <span style={{ fontSize:9.5, fontWeight:700, color:t.chip, background:t.chipBg, border:`1px solid ${t.ring}`, borderRadius:6, padding:'1px 6px', flexShrink:0 }}>{m.rol}</span>
            <span style={{ fontSize:10.5, color:'#64748b', width:130, flexShrink:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={m.equipo}>{m.equipo || '—'}</span>
            <StarRating value={Number(m.valoracion) || 0} canManage={canManage} onRate={v => onRate(idxOf(i), v)} size={13} />
            {canManage && (
              <button onClick={() => onRemove(idxOf(i))} title="Quitar" className="dash-eq-remove" style={{ flexShrink:0 }}>×</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ViewToggle({ view, setView }) {
  return (
    <div style={{ display:'inline-flex', border:'1px solid var(--border)', borderRadius:7, overflow:'hidden' }}>
      {[['grupo','Grupo'],['tabla','Tabla']].map(([k, l]) => (
        <button key={k} onClick={() => setView(k)} style={{
          padding:'3px 11px', fontSize:10.5, fontWeight: view === k ? 700 : 500,
          background: view === k ? 'var(--accent)' : '#fff', color: view === k ? '#fff' : '#64748b',
          border:'none', cursor:'pointer', fontFamily:'inherit',
        }}>{l}</button>
      ))}
    </div>
  )
}

export default function EquipoBloque({ equipo = [], canManage = true, onAdd, onRemove, onRate, title = 'Equipo de trabajo', bare = false }) {
  const [view, setView]   = useState('grupo') // 'grupo' | 'tabla'
  const [adding, setAdding] = useState(null)   // seccion.key en alta

  const idxOf = (filtered) => (i) => equipo.indexOf(filtered[i])

  const secciones = (
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {SECCIONES.map(seccion => {
          const personas = equipo.filter(seccion.match)
          const mapIdx = idxOf(personas)
          return (
            <div key={seccion.key}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <div className="dash-card-sub" style={{ margin:0 }}>
                  {seccion.label} {personas.length > 0 && <span style={{ color:'var(--text4)', fontWeight:600 }}>· {personas.length}</span>}
                </div>
                {canManage && adding !== seccion.key && (
                  <button onClick={() => setAdding(seccion.key)}
                    style={{ background:'none', border:'none', color:seccion.accent, cursor:'pointer', fontSize:11, fontWeight:600, padding:0 }}>+ Añadir</button>
                )}
              </div>

              {personas.length === 0 ? (
                <div style={{ fontSize:11.5, color:'#94a3b8' }}>Sin {seccion.label.toLowerCase()}.</div>
              ) : view === 'grupo' ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:8 }}>
                  {personas.map((m, i) => (
                    <PersonaCard key={`c-${i}`} persona={m} canManage={canManage}
                      onRate={v => onRate(mapIdx(i), v)} onRemove={() => onRemove(mapIdx(i))} />
                  ))}
                </div>
              ) : (
                <TablaPersonas personas={personas} idxOf={mapIdx} canManage={canManage} onRate={onRate} onRemove={onRemove} />
              )}

              {canManage && adding === seccion.key && (
                <AddForm seccion={seccion}
                  onSubmit={p => { onAdd(p); setAdding(null) }}
                  onCancel={() => setAdding(null)} />
              )}
            </div>
          )
        })}
      </div>
  )

  if (bare) {
    return (
      <>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom:8 }}>
          <ViewToggle view={view} setView={setView} />
        </div>
        {secciones}
      </>
    )
  }

  return (
    <div className="dash-card" style={{ overflow:'visible' }}>
      <div className="dash-card-head" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span>{title}</span>
        <ViewToggle view={view} setView={setView} />
      </div>
      <div style={{ padding:'12px 16px 14px' }}>
        {secciones}
      </div>
    </div>
  )
}
