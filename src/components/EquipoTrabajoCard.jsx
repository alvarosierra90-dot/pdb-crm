import { useState } from 'react'

// Catálogo de equipos y miembros de Savills (espejo de UsuariosList).
// Cuando exista la tabla `usuarios` en Supabase esto se reemplaza por
// una query y se inyecta vía props.
export const EQUIPOS_SAVILLS = [
  'Leasing Oficinas Madrid',
  'Leasing Oficinas Barcelona',
  'Industrial & Logistics',
  'Retail',
  'Capital Markets',
  'Hotels',
  'Alternativos',
  'Advisory & Consultancy',
  'Valuations',
]

export const MIEMBROS_POR_EQUIPO = {
  'Leasing Oficinas Madrid':    ['Sierra Álvaro','GOMEZ Ignacio','Consultor MAD','Alonso Abruña D.'],
  'Leasing Oficinas Barcelona': ['Pérez Joan','Martí Sara'],
  'Industrial & Logistics':     ['Castro Andrea','Romero David'],
  'Retail':                     ['Ortega Sergio'],
  'Capital Markets':            ['García Marta','Ruiz Pablo','Vidal Elena'],
  'Hotels':                     ['Aguirre Laura'],
  'Alternativos':               ['Hernández Lucía'],
  'Advisory & Consultancy':     ['López Carmen','Domínguez Pedro'],
  'Valuations':                 ['López Carmen'],
}

export const ROLES = ['Principal','Soporte','Colaborador']
export const ROL_TAG = {
  'Principal':   { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe' },
  'Soporte':     { bg:'#f5f3ff', color:'#7c3aed', border:'#ddd6fe' },
  'Colaborador': { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1' },
}

/**
 * Card de gestión de equipo de trabajo.
 *
 * @param {Array}    equipo       Lista actual [{nombre, equipo, rol}]
 * @param {boolean}  canManage    Si el usuario puede añadir/quitar/editar roles
 * @param {Function} onAdd        (nombre, equipo, rol) => void
 * @param {Function} onRemove     (idx) => void
 * @param {Function} onUpdateRol  (idx, rol) => void
 * @param {string}   [title]      Título del card (default "Equipo de trabajo")
 */
export default function EquipoTrabajoCard({ equipo = [], canManage = true, onAdd, onRemove, onUpdateRol, title = 'Equipo de trabajo' }) {
  const [adding, setAdding] = useState(false)
  const [draftEquipo, setDraftEquipo]   = useState('')
  const [draftMiembro, setDraftMiembro] = useState('')
  const [draftRol, setDraftRol]         = useState('Soporte')

  const principales = equipo.filter(m => m.rol === 'Principal').length

  const submit = () => {
    if (!draftEquipo || !draftMiembro || !draftRol) return
    onAdd(draftMiembro, draftEquipo, draftRol)
    setAdding(false)
    setDraftEquipo(''); setDraftMiembro(''); setDraftRol('Soporte')
  }

  return (
    <div className="va-card" style={{ marginBottom:14 }}>
      <div className="va-card-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3><span className="ico" style={{ color:'var(--accent)' }}>●</span> {title}</h3>
        <span style={{ fontSize:10, color:'var(--text4)' }}>
          {equipo.length === 0 ? 'Sin miembros' : `${equipo.length} miembro(s) · ${principales} Principal(es)`}
        </span>
      </div>

      <div style={{ padding:'4px 20px 14px' }}>
        {equipo.length === 0 ? (
          <div style={{ fontSize:11, color:'var(--text4)', padding:'6px 0' }}>
            Aún no hay equipo de trabajo asignado. Añade al menos un Principal.
          </div>
        ) : (
          <table className="pat-table" style={{ marginBottom:10 }}>
            <thead>
              <tr>
                <th>Miembro</th>
                <th>Equipo</th>
                <th style={{ width:140 }}>Rol</th>
                {canManage && <th style={{ width:32 }}></th>}
              </tr>
            </thead>
            <tbody>
              {equipo.map((m, idx) => {
                const c = ROL_TAG[m.rol] || ROL_TAG['Colaborador']
                return (
                  <tr key={`${m.nombre}-${m.equipo}-${idx}`}>
                    <td style={{ fontWeight:600 }}>{m.nombre}</td>
                    <td style={{ fontSize:11, color:'var(--text3)' }}>{m.equipo || '—'}</td>
                    <td>
                      {canManage ? (
                        <select
                          value={m.rol}
                          onChange={e => onUpdateRol(idx, e.target.value)}
                          style={{ fontSize:11, padding:'3px 6px', border:`1px solid ${c.border}`, borderRadius:4, color:c.color, background:c.bg, fontWeight:700, fontFamily:'inherit' }}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:9, background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>{m.rol}</span>
                      )}
                    </td>
                    {canManage && (
                      <td style={{ textAlign:'right' }}>
                        <button
                          onClick={() => onRemove(idx)}
                          style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:14, padding:'2px 6px' }}
                          title="Quitar del equipo"
                        >×</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {!canManage && equipo.length > 0 && (
          <div style={{ fontSize:10, color:'var(--text4)', fontStyle:'italic' }}>
            🔒 Solo los Principales del equipo pueden añadir o quitar miembros.
          </div>
        )}

        {canManage && !adding && (
          <button
            onClick={() => setAdding(true)}
            style={{ padding:'6px 12px', fontSize:11, fontWeight:600, border:'1px dashed var(--accent)', color:'var(--accent)', background:'var(--accent-lt)', borderRadius:5, cursor:'pointer', fontFamily:'inherit' }}
          >
            + Añadir miembro
          </button>
        )}

        {canManage && adding && (
          <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, padding:12, display:'grid', gridTemplateColumns:'1fr 1fr 130px auto auto', gap:8, alignItems:'center' }}>
            <select value={draftEquipo} onChange={e => { setDraftEquipo(e.target.value); setDraftMiembro('') }} style={{ padding:'7px 9px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', fontFamily:'inherit' }}>
              <option value="">Selecciona equipo...</option>
              {EQUIPOS_SAVILLS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
            <select value={draftMiembro} onChange={e => setDraftMiembro(e.target.value)} disabled={!draftEquipo} style={{ padding:'7px 9px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background: draftEquipo ? '#fff' : 'var(--gray-lt)', fontFamily:'inherit' }}>
              <option value="">{draftEquipo ? 'Selecciona miembro...' : '— elige equipo primero —'}</option>
              {(MIEMBROS_POR_EQUIPO[draftEquipo] || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={draftRol} onChange={e => setDraftRol(e.target.value)} style={{ padding:'7px 9px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', fontFamily:'inherit' }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button
              onClick={submit}
              disabled={!draftEquipo || !draftMiembro}
              style={{ padding:'7px 14px', fontSize:12, fontWeight:600, border:'none', borderRadius:5, background:'var(--accent)', color:'#fff', cursor:'pointer', fontFamily:'inherit', opacity:(draftEquipo&&draftMiembro)?1:0.5 }}
            >Añadir</button>
            <button
              onClick={() => { setAdding(false); setDraftEquipo(''); setDraftMiembro(''); setDraftRol('Soporte') }}
              style={{ padding:'7px 10px', fontSize:11, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontFamily:'inherit' }}
            >Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Hook helper para gestionar las operaciones de equipo contra una tabla
 * cualquiera de Supabase con columna equipo_trabajo jsonb. Devuelve
 * (addMiembro, removeMiembro, updateMiembroRol, persistEquipo).
 *
 * @param {object} supabase   Instancia del cliente Supabase
 * @param {string} table      Nombre de la tabla
 * @param {string} idValue    UUID del registro
 * @param {Array}  equipo     Equipo actual (array)
 * @param {Function} onAfter  Callback tras persistir (ej. recargar)
 * @param {Function} onError  Callback con string de error
 */
export function makeEquipoHandlers({ supabase, table, idValue, equipo, onAfter, onError }) {
  const persistEquipo = async (nuevoEquipo) => {
    const payload = { equipo_trabajo: nuevoEquipo, updated_at: new Date().toISOString() }
    const { error } = await supabase.from(table).update(payload).eq('id', idValue)
    if (error) { onError && onError(error.message); return }
    onAfter && onAfter()
  }
  const addMiembro = (nombre, equipoStr, rol) => {
    if (!nombre || !equipoStr || !rol) return
    const ya = equipo.some(m => m.nombre === nombre && m.equipo === equipoStr)
    if (ya) { onError && onError(`${nombre} ya está en el equipo de trabajo.`); return }
    persistEquipo([...equipo, { nombre, equipo: equipoStr, rol }])
  }
  const removeMiembro = (idx) => persistEquipo(equipo.filter((_, i) => i !== idx))
  const updateMiembroRol = (idx, rol) => persistEquipo(equipo.map((m, i) => i === idx ? { ...m, rol } : m))
  return { addMiembro, removeMiembro, updateMiembroRol, persistEquipo }
}

/** Helper: ¿el usuario actual es Principal en este equipo? */
export function isPrincipal(equipo, currentUserName) {
  if (!Array.isArray(equipo) || !currentUserName) return false
  const norm = currentUserName.trim().toLowerCase()
  return equipo.some(m => m.rol === 'Principal' && (m.nombre || '').trim().toLowerCase() === norm)
}
