import { createContext, useContext, useState } from 'react'

const NavContext = createContext()

/**
 * Pila simple de navegación interna. Cada `navigate(view, params)` empuja
 * la (view, params) actual a un stack `history`, de forma que `goBack()`
 * pueda restaurar el estado anterior tantas veces como sea necesario.
 *
 * Esto permite al usuario navegar entre fichas (ej. Lead → Oportunidad →
 * Propuesta → Mandato) y volver paso a paso sin perder el contexto.
 *
 * API expuesta:
 *   view, params       — estado actual
 *   navigate(v, p)     — empuja current a history y cambia a (v, p)
 *   goBack()           — restaura (view, params) del último item del stack
 *   canGoBack          — boolean (history.length > 0)
 *   prev               — { view, params } del tope del stack, o null
 *   replace(v, p)      — cambia (view, params) sin tocar el historial
 *   resetTo(v, p)      — limpia el historial y va a (v, p) (útil para sidebar)
 */
export function NavProvider({ children }) {
  const [view, setView]     = useState('activos')
  const [params, setParams] = useState({})
  const [history, setHistory] = useState([])  // pila de { view, params }

  const navigate = (v, p = {}) => {
    // No registramos en historial si es la misma vista con mismos params
    // (evita ruido al re-renderizar). Mantenemos el comportamiento simple:
    // siempre que cambie algo, empujamos.
    if (v === view && JSON.stringify(p) === JSON.stringify(params)) return
    setHistory(prev => [...prev, { view, params }])
    setView(v)
    setParams(p)
  }

  const replace = (v, p = {}) => {
    setView(v)
    setParams(p)
  }

  const resetTo = (v, p = {}) => {
    setHistory([])
    setView(v)
    setParams(p)
  }

  const goBack = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setView(last.view)
      setParams(last.params)
      return prev.slice(0, -1)
    })
  }

  const canGoBack = history.length > 0
  const prev      = canGoBack ? history[history.length - 1] : null

  return (
    <NavContext.Provider value={{ view, params, navigate, replace, resetTo, goBack, canGoBack, prev }}>
      {children}
    </NavContext.Provider>
  )
}

export const useNav = () => useContext(NavContext)
