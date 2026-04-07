import { createContext, useContext, useState } from 'react'

const NavContext = createContext()

export function NavProvider({ children }) {
  const [view, setView] = useState('activos')
  const [params, setParams] = useState({})

  const navigate = (v, p = {}) => {
    setView(v)
    setParams(p)
  }

  return (
    <NavContext.Provider value={{ view, params, navigate }}>
      {children}
    </NavContext.Provider>
  )
}

export const useNav = () => useContext(NavContext)
