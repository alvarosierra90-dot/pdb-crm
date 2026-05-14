import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNav } from '../context/NavigationContext'

// Panel reusable de actividades. Filtra la tabla `actividades` por una FK
// concreta (mandato_id / oferta_id / demanda_id / lead_id / negociacion_id /
// activo_id / cuenta_dynamics_id / oportunidad_dynamics_id) y renderiza el
// patrón unificado: KPI strip + tabla con avatar, ID, tipo (tag), descripción,
// fecha, responsable, estado.
//
// Props:
//   filter   = { column: 'mandato_id', value: '<uuid>' }
//   title    = título del header (ej. 'Actividades vinculadas al mandato')
//   onCreate = callback opcional para botón '+ Nueva actividad' (deshabilitado
//              si no se pasa)

const TIPO_LABEL = {
  email:    { lbl:'Email',     icon:'✉️', tag:'tag-blue'   },
  llamada:  { lbl:'Llamada',   icon:'', tag:'tag-green'  },
  reunion:  { lbl:'Reunión',   icon:'👥', tag:'tag-purple' },
  nota:     { lbl:'Nota',      icon:'📝', tag:'tag-gray'   },
  tarea:    { lbl:'Tarea',     icon:'✅', tag:'tag-amber'  },
}
const ESTADO_TAG = {
  abierto:    'tag-amber',
  completado: 'tag-green',
  cancelado:  'tag-gray',
}
const ESTADO_LABEL = {
  abierto:    'Abierto',
  completado: 'Completado',
  cancelado:  'Cancelado',
}

function ini(s) {
  if (!s) return '··'
  return s.split(' ').map(w => w[0] || '').join('').slice(0,2).toUpperCase()
}
function fmtFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })
}

export default function ActividadesPanel({ filter, title = 'Actividades', onCreate }) {
  const { navigate } = useNav()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!filter?.column || !filter?.value) { setRows([]); setLoading(false); return }
    let cancel = false
    setLoading(true); setErr(null)
    supabase
      .from('actividades')
      .select('id, tipo, asunto, descripcion, fecha, estado, asignado_a, created_at')
      .eq(filter.column, filter.value)
      .order('fecha', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (cancel) return
        if (error) setErr(error.message)
        else       setRows(data || [])
        setLoading(false)
      })
    return () => { cancel = true }
  }, [filter?.column, filter?.value])

  const total       = rows.length
  const llamadas    = rows.filter(r => r.tipo === 'llamada').length
  const emails      = rows.filter(r => r.tipo === 'email').length
  const reuniones   = rows.filter(r => r.tipo === 'reunion').length
  const pendientes  = rows.filter(r => r.estado === 'abierto').length

  return (
    <div className="info-pad">
      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:14 }}>
        {[
          { lbl:'Total',      val: total,      color:'var(--text)'   },
          { lbl:'Llamadas',   val: llamadas,   color:'var(--green)'  },
          { lbl:'Emails',     val: emails,     color:'var(--accent)' },
          { lbl:'Reuniones',  val: reuniones,  color:'var(--purple, #6b5b8e)' },
          { lbl:'Pendientes', val: pendientes, color:'var(--red)'    },
        ].map(k => (
          <div key={k.lbl} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'8px 12px', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{k.lbl}</div>
            <div style={{ fontSize:18, fontWeight:800, fontFamily:'var(--mono)', color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:600 }}>{title}</div>
        <button
          className="ab-btn blue"
          onClick={onCreate}
          disabled={!onCreate}
          style={!onCreate ? { opacity:0.45, cursor:'not-allowed' } : undefined}
          title={onCreate ? '' : 'Crear actividad — disponible próximamente'}
        >
          + Nueva actividad
        </button>
      </div>

      {/* Estados de carga / error / vacío */}
      {loading && <div style={{ padding:24, textAlign:'center', color:'var(--text4)', fontSize:12 }}>Cargando actividades…</div>}
      {err && !loading && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:10, fontSize:11, color:'#991b1b' }}>⚠ {err}</div>}
      {!loading && !err && rows.length === 0 && (
        <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12, background:'var(--gray-lt)', borderRadius:6 }}>
          <div style={{ fontSize:24, marginBottom:6 }}>📭</div>
          Sin actividades registradas todavía.
        </div>
      )}

      {/* Tabla */}
      {!loading && !err && rows.length > 0 && (
        <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr>
                {['','ID','Tipo','Descripción','Fecha','Responsable','Estado'].map(h => (
                  <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', background:'var(--gray-lt)', borderBottom:'1px solid var(--border)', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(a => {
                const t = TIPO_LABEL[a.tipo] || { lbl: a.tipo, icon:'•', tag:'tag-gray' }
                const e = ESTADO_LABEL[a.estado] || a.estado
                const eTag = ESTADO_TAG[a.estado] || 'tag-gray'
                return (
                  <tr key={a.id} style={{ borderBottom:'1px solid var(--border)', cursor:'pointer' }} onClick={() => navigate('ficha-actividad', { id: a.id })}>
                    <td style={{ padding:'7px 10px', width:30 }}>
                      <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--accent-lt)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700 }}>
                        {ini(a.asignado_a)}
                      </div>
                    </td>
                    <td style={{ padding:'7px 12px' }}>
                      <span className="asset-link" style={{ fontFamily:'var(--mono)', fontSize:10 }}>{String(a.id).slice(0,8)}</span>
                    </td>
                    <td style={{ padding:'7px 12px' }}>
                      <span className={`tag ${t.tag}`}>{t.icon} {t.lbl}</span>
                    </td>
                    <td style={{ padding:'7px 12px', fontWeight:500, maxWidth:320 }}>
                      <div>{a.asunto}</div>
                      {a.descripcion && <div style={{ fontSize:10, color:'var(--text3)', marginTop:2, maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.descripcion}</div>}
                    </td>
                    <td style={{ padding:'7px 12px', color:'var(--text3)', whiteSpace:'nowrap', fontFamily:'var(--mono)' }}>{fmtFecha(a.fecha)}</td>
                    <td style={{ padding:'7px 12px', fontSize:10, color:'var(--text3)' }}>{a.asignado_a || '—'}</td>
                    <td style={{ padding:'7px 12px' }}>
                      <span className={`tag ${eTag}`}>{e}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
