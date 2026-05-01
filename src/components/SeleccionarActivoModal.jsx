import { useEffect, useMemo, useState } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'

// Modal "Selecciona un activo" — el alta de propietario/arrendatario
// siempre tiene que partir de un activo (regla del usuario: la
// superficie no se completa hasta que el registro está colocado en
// el stacking). Ver memoria project_propietario_arrendatario_stacking.md
//
// Tras confirmar, navega a la ficha correspondiente (propietario o
// arrendatario) en modo creación con `fromActivoRef` para que la
// ficha sepa volver al stacking del activo.

const overlay = {
  position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000,
  display:'flex', alignItems:'center', justifyContent:'center',
}
const panel = {
  background:'#fff', borderRadius:10, width:'min(560px, 92vw)', maxHeight:'90vh', overflowY:'auto',
  boxShadow:'0 20px 50px rgba(15,23,42,0.25)',
}

const TIPO_LABELS = {
  propietario: { titulo:'Nuevo propietario', sub:'El alta arranca desde un activo', tabActivo:'at-prop',     destino:'ficha-propietario' },
  arrendatario:{ titulo:'Nuevo arrendatario', sub:'El alta arranca desde un activo', tabActivo:'at-stacking', destino:'ficha-arrendatario' },
}

export default function SeleccionarActivoModal({ tipo = 'propietario', onClose }) {
  const { navigate } = useNav()
  const cfg = TIPO_LABELS[tipo] || TIPO_LABELS.propietario
  const [activos, setActivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery]     = useState('')
  const [pick, setPick]       = useState(null)

  useEffect(() => {
    let cancel = false
    supabase.from('activos')
      .select('id, ref, nombre, ciudad, zona, uso, sba, propietario')
      .order('nombre')
      .then(({ data }) => {
        if (cancel) return
        setActivos(data || [])
        setLoading(false)
      })
    return () => { cancel = true }
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return activos.slice(0, 12)
    return activos.filter(a =>
      (a.nombre || '').toLowerCase().includes(q)
      || (a.ref || '').toLowerCase().includes(q)
      || (a.ciudad || '').toLowerCase().includes(q)
      || (a.zona || '').toLowerCase().includes(q)
    ).slice(0, 12)
  }, [query, activos])

  const confirmar = () => {
    if (!pick) return
    navigate(cfg.destino, {
      fromActivoRef:        pick.ref,
      fromActivoNombre:     pick.nombre || '',
      fromActivoZona:       pick.zona || '',
      fromActivoSba:        pick.sba || 0,
      fromActivoPropietario:pick.propietario || '',
    })
    onClose()
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={panel}>
        <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:14, fontWeight:700 }}>{cfg.titulo}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{cfg.sub}. Selecciona el activo y luego completarás la información en la ficha.</div>
        </div>

        <div style={{ padding:'16px 22px', display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6, display:'block' }}>Activo *</label>
            <input
              autoFocus
              value={query}
              onChange={e => { setQuery(e.target.value); setPick(null) }}
              placeholder={loading ? 'Cargando activos…' : 'Busca por nombre, ref, ciudad o zona…'}
              disabled={loading}
              style={{ width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', boxSizing:'border-box' }}
            />
          </div>

          {!loading && (
            <div style={{ border:'1px solid var(--border)', borderRadius:6, maxHeight:280, overflowY:'auto' }}>
              {matches.length === 0 ? (
                <div style={{ padding:18, textAlign:'center', color:'var(--text4)', fontSize:12 }}>Sin resultados.</div>
              ) : matches.map(a => (
                <div
                  key={a.id}
                  onClick={() => setPick(a)}
                  style={{
                    padding:'8px 12px', borderBottom:'1px solid var(--border)',
                    cursor:'pointer',
                    background: pick?.id === a.id ? 'var(--accent-lt)' : '#fff',
                  }}
                  onMouseEnter={e => { if (pick?.id !== a.id) e.currentTarget.style.background = 'var(--gray-lt)' }}
                  onMouseLeave={e => { if (pick?.id !== a.id) e.currentTarget.style.background = '#fff' }}
                >
                  <div style={{ fontSize:12, fontWeight:600, color: pick?.id === a.id ? 'var(--accent)' : 'var(--text)' }}>
                    {a.nombre || '(Sin nombre)'} <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text4)', marginLeft:6 }}>{a.ref}</span>
                  </div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>
                    {[a.ciudad, a.zona, a.uso].filter(Boolean).join(' · ')}{a.sba ? ` · ${Number(a.sba).toLocaleString('es-ES')} m²` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6, padding:10, fontSize:11, color:'#1e40af' }}>
            ℹ Al guardar la ficha volverás al stacking del activo. Recuerda <strong>arrastrar el {tipo} a las plantas</strong> que le correspondan — sin eso, la superficie del activo queda incompleta.
          </div>
        </div>

        <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'#fff', cursor:'pointer', fontWeight:600 }}>Cancelar</button>
          <button
            onClick={confirmar}
            disabled={!pick}
            style={{ padding:'8px 14px', fontSize:12, border:'none', borderRadius:5, background: pick ? 'var(--accent)' : 'var(--text4)', color:'#fff', cursor: pick ? 'pointer' : 'not-allowed', fontWeight:700, opacity: pick ? 1 : 0.6 }}
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  )
}
