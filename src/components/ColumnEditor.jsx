import { useState, useRef, useEffect } from 'react'

// Hook: persists column visibility in localStorage
export function useVisibleCols(key, cols) {
  const validIds = new Set(cols.map(c => c.id))
  const [vis, setVis] = useState(() => {
    try {
      const s = localStorage.getItem('cols_' + key)
      if (s) {
        const saved = JSON.parse(s).filter(id => validIds.has(id))
        // Si quedan muy pocas columnas válidas, resetear a todas
        if (saved.length >= 2) return new Set(saved)
      }
    } catch {}
    return new Set(cols.map(c => c.id))
  })
  const save = next => {
    setVis(next)
    try { localStorage.setItem('cols_' + key, JSON.stringify([...next])) } catch {}
  }
  return [vis, save]
}

// Component: floating column picker button
export default function ColumnEditor({ cols, vis, setVis }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const pickable = cols.filter(c => !c.sys)
  const activeN  = pickable.filter(c => vis.has(c.id)).length

  const toggle = id => {
    if (cols.find(c => c.id === id)?.required) return
    const n = new Set(vis); n.has(id) ? n.delete(id) : n.add(id); setVis(n)
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="tbtn"
        onClick={() => setOpen(v => !v)}
        style={open ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-lt)' } : {}}
      >
        ⊞ Columnas
        {activeN < pickable.length &&
          <span style={{ marginLeft: 4, fontSize: 9, background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '0 5px' }}>
            {activeN}/{pickable.length}
          </span>
        }
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
          padding: '10px 0 8px', minWidth: 220, maxHeight: 360, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,.12)', zIndex: 300,
        }}>
          <div style={{ padding: '0 14px 8px', fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Columnas visibles
          </div>
          {pickable.map(c => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 14px', cursor: c.required ? 'default' : 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={vis.has(c.id)} onChange={() => toggle(c.id)} disabled={c.required} style={{ accentColor: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text)' }}>
                {c.label}
                {c.required && <span style={{ marginLeft: 5, fontSize: 9, color: 'var(--text4)' }}>requerida</span>}
              </span>
            </label>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0 0', padding: '6px 14px 0', display: 'flex', gap: 10 }}>
            <button onClick={() => setVis(new Set(cols.map(c => c.id)))} style={{ fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              Todas
            </button>
            <button onClick={() => setVis(new Set(cols.filter(c => c.required || c.sys).map(c => c.id)))} style={{ fontSize: 10, color: 'var(--text4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              Solo obligatorias
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
