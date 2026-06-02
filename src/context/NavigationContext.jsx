import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'

const NavContext = createContext()

/**
 * Pila simple de navegación interna + guard de cambios sin guardar.
 *
 * Cada `navigate(view, params)` empuja la (view, params) actual a `history`,
 * de forma que `goBack()` pueda restaurar el estado anterior.
 *
 * Guard de cambios sin guardar:
 *   - Una ficha registra un guard con `useUnsavedGuard({ isDirty, onSave })`.
 *   - Al navegar/volver/cambiar de módulo, si `isDirty()` es true, se intercepta
 *     y se muestra un modal: Guardar y salir · Salir sin guardar · Cancelar.
 *   - `beforeunload` cubre el cierre/recarga de la pestaña.
 */
export function NavProvider({ children }) {
  const [view, setView]     = useState('activos')
  const [params, setParams] = useState({})
  const [history, setHistory] = useState([])  // pila de { view, params }

  const guardRef = useRef(null)               // { isDirty, save }
  const [pending, setPending] = useState(null) // { run } acción de nav diferida
  const [saving, setSaving]   = useState(false)

  const setNavGuard   = useCallback((g) => { guardRef.current = g }, [])
  const clearNavGuard = useCallback((g) => { if (!g || guardRef.current === g) guardRef.current = null }, [])

  // Ejecuta una acción de navegación, interceptando si hay cambios sin guardar.
  const guarded = (run) => {
    const g = guardRef.current
    if (g && typeof g.isDirty === 'function') {
      let dirty = false
      try { dirty = !!g.isDirty() } catch { dirty = false }
      if (dirty) { setPending({ run }); return }
    }
    run()
  }

  const doNavigate = (v, p = {}) => {
    if (v === view && JSON.stringify(p) === JSON.stringify(params)) return
    setHistory(prev => [...prev, { view, params }])
    setView(v); setParams(p)
  }

  const navigate = (v, p = {}) => guarded(() => doNavigate(v, p))
  const replace  = (v, p = {}) => { setView(v); setParams(p) } // interno, no intercepta
  const resetTo  = (v, p = {}) => guarded(() => { setHistory([]); setView(v); setParams(p) })
  const goBack   = () => guarded(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setView(last.view); setParams(last.params)
      return prev.slice(0, -1)
    })
  })

  // Resolución del modal de cambios sin guardar.
  const proceed = () => { const p = pending; guardRef.current = null; setPending(null); p?.run() }
  const onDiscard = () => proceed()
  const onCancel  = () => setPending(null)
  const onSaveAndGo = async () => {
    const g = guardRef.current
    setSaving(true)
    let ok = true
    try { if (g?.save) ok = (await g.save()) !== false } catch (e) { ok = false }
    setSaving(false)
    if (ok) proceed()
  }

  const canGoBack = history.length > 0
  const prev      = canGoBack ? history[history.length - 1] : null

  return (
    <NavContext.Provider value={{ view, params, navigate, replace, resetTo, goBack, canGoBack, prev, setNavGuard, clearNavGuard }}>
      {children}

      {pending && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex:100000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={onCancel}>
          <div style={{ background:'#fff', borderRadius:10, width:'min(440px,100%)', boxShadow:'0 20px 50px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #e2e8f0', fontSize:15, fontWeight:700, color:'#0f172a' }}>Cambios sin guardar</div>
            <div style={{ padding:'16px 20px', fontSize:13, color:'#475569', lineHeight:1.5 }}>
              Tienes cambios sin guardar en esta pantalla. Si sales ahora se perderán. ¿Qué quieres hacer?
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'12px 20px', borderTop:'1px solid #e2e8f0', background:'#f8fafc', flexWrap:'wrap' }}>
              <button onClick={onCancel} disabled={saving}
                style={{ padding:'8px 14px', fontSize:12, fontWeight:600, border:'1px solid #cbd5e1', borderRadius:6, background:'#fff', color:'#334155', cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
              <button onClick={onDiscard} disabled={saving}
                style={{ padding:'8px 14px', fontSize:12, fontWeight:600, border:'1px solid #fca5a5', borderRadius:6, background:'#fff', color:'#dc2626', cursor:'pointer', fontFamily:'inherit' }}>Salir sin guardar</button>
              <button onClick={onSaveAndGo} disabled={saving}
                style={{ padding:'8px 16px', fontSize:12, fontWeight:700, border:'none', borderRadius:6, background:'#2563eb', color:'#fff', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily:'inherit' }}>{saving ? 'Guardando…' : 'Guardar y salir'}</button>
            </div>
          </div>
        </div>
      )}
    </NavContext.Provider>
  )
}

export const useNav = () => useContext(NavContext)

/**
 * Registra un guard de cambios sin guardar para la ficha actual.
 * @param {{ isDirty: () => boolean, onSave: () => (Promise<boolean>|void) }} guard
 *   isDirty: true si hay cambios pendientes. onSave: persiste; devuelve false si falla.
 */
export function useUnsavedGuard(guard) {
  const { setNavGuard, clearNavGuard } = useNav()
  const ref = useRef(guard)
  ref.current = guard
  useEffect(() => {
    const g = {
      isDirty: () => { try { return !!ref.current?.isDirty?.() } catch { return false } },
      save:    () => ref.current?.onSave?.(),
    }
    setNavGuard(g)
    const beforeUnload = (e) => { if (g.isDirty()) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', beforeUnload)
    return () => { clearNavGuard(g); window.removeEventListener('beforeunload', beforeUnload) }
  }, [setNavGuard, clearNavGuard])
}
