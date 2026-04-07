import { useNav } from '../context/NavigationContext'

export default function Nav() {
  const { view, navigate } = useNav()

  const isActive = (...views) => views.includes(view)

  return (
    <nav>
      <div className="nav-logo">
        <div className="nav-logo-mark">PDB</div>
        <div className="nav-logo-text">PropDatabase</div>
      </div>

      <div className="nav-section">My Work</div>
      <div className={`nav-item ${isActive('paneles') ? 'active' : ''}`} onClick={() => navigate('paneles')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
        Paneles
      </div>
      <div className="nav-section">Actividades</div>
      <div className={`nav-item ${isActive('actividades','ficha-actividad') ? 'active' : ''}`} onClick={() => navigate('actividades')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M3 4h10M3 12h6"/></svg>
        Actividad <span className="nav-badge">10</span>
      </div>
      <div className={`nav-item ${isActive('tareas','ficha-tarea') ? 'active' : ''}`} onClick={() => navigate('tareas')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8l2 2 4-4"/><rect x="2" y="2" width="12" height="12" rx="2"/></svg>
        Tareas
      </div>
      <div className={`nav-item ${isActive('visitas','ficha-visita') ? 'active' : ''}`} onClick={() => navigate('visitas')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 7h12M5 1v4M11 1v4"/></svg>
        Visitas
      </div>
      <div className="nav-item" onClick={() => navigate('actividades')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><path d="M9 11.5h5M11.5 9v5"/></svg>
        Presentaciones
      </div>
      <div className={`nav-item ${isActive('mis-clientes') ? 'active' : ''}`} onClick={() => navigate('mis-clientes')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 13c0-2.5 2-4 4-4s4 1.5 4 4"/><circle cx="6" cy="6" r="3"/><path d="M13 13c0-1.5-1-2.5-2.5-3"/><circle cx="11.5" cy="5.5" r="2"/></svg>
        Mis Clientes
      </div>
      <div className={`nav-item ${isActive('propuestas','ficha-propuesta') ? 'active' : ''}`} onClick={() => navigate('propuestas')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4M5 8h6M5 11h4"/></svg>
        Propuestas / Proyectos
      </div>

      <div className="nav-section">Clientes</div>
      <div className={`nav-item ${isActive('cuentas') ? 'active' : ''}`} onClick={() => navigate('cuentas')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6h12"/></svg>
        Cuentas <span className="nav-dyn">Dynamics</span>
      </div>
      <div className={`nav-item ${isActive('contactos') ? 'active' : ''}`} onClick={() => navigate('contactos')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>
        Contactos <span className="nav-dyn">Dynamics</span>
      </div>

      <div className="nav-section">Activos</div>
      <div className={`nav-item ${isActive('activos', 'ficha-activo') ? 'active' : ''}`} onClick={() => navigate('activos')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="12" height="9" rx="1.5"/><path d="M5 5V4a3 3 0 016 0v1"/></svg>
        Activos
      </div>
      <div className={`nav-sub ${isActive('arrendatarios','ficha-arrendatario')?'active':''}`} style={isActive('arrendatarios','ficha-arrendatario')?{color:'var(--accent)',fontWeight:600}:{}} onClick={() => navigate('arrendatarios')}>Arrendatarios</div>
      <div className={`nav-sub ${isActive('propietarios','ficha-propietario')?'active':''}`} style={isActive('propietarios','ficha-propietario')?{color:'var(--accent)',fontWeight:600}:{}} onClick={() => navigate('propietarios')}>Propietarios</div>

      <div className="nav-section">Comercialización</div>
      <div className={`nav-item ${isActive('demandas') ? 'active' : ''}`} onClick={() => navigate('demandas')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
        Demandas
      </div>
      <div className={`nav-item ${isActive('ofertas', 'ficha-oferta') ? 'active' : ''}`} onClick={() => navigate('ofertas')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/><path d="M2 4l6 5 6-5"/></svg>
        Ofertas
      </div>
      <div className={`nav-item ${isActive('mandatos','ficha-mandato') ? 'active' : ''}`} onClick={() => navigate('mandatos')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4M5 8h6M5 11h4"/></svg>
        Mandatos
      </div>
      <div className={`nav-item ${isActive('vencimientos') ? 'active' : ''}`} onClick={() => navigate('vencimientos')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>
        Vencimientos
      </div>
      <div className={`nav-item ${isActive('mapas') ? 'active' : ''}`} onClick={() => navigate('mapas')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L2 4v10l4-2 4 2 4-2V2l-4 2-4-2z"/></svg>
        Mapas
      </div>

      <div className="nav-section">Transacción</div>
      <div className={`nav-item ${isActive('oportunidades') ? 'active' : ''}`} onClick={() => navigate('oportunidades')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h2l2-4 2 8 2-5 2 3h2"/></svg>
        Oportunidades <span className="nav-dyn">Dynamics</span>
      </div>
      <div className={`nav-item ${isActive('negociaciones', 'ficha-negociacion') ? 'active' : ''}`} onClick={() => navigate('negociaciones')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3z"/><path d="M5 13l1-2h4l1 2"/><path d="M5 7h6M5 9.5h4"/></svg>
        Negociaciones <span className="nav-badge">4</span>
      </div>
      <div className={`nav-item ${isActive('instruccion') ? 'active' : ''}`} onClick={() => navigate('instruccion')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h2l2-4 2 8 2-5 2 3h2"/></svg>
        Transacción / Instrucción <span className="nav-dyn">Dynamics</span>
      </div>

      <div className="nav-section">Inteligencia</div>
      <div className={`nav-item ${isActive('inteligencia-comercial') ? 'active' : ''}`} onClick={() => navigate('inteligencia-comercial')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>
        Inteligencia Comercial
      </div>

      <div className="nav-section">Análisis</div>
      <div className={`nav-item ${isActive('portfolios', 'portfolio') ? 'active' : ''}`} onClick={() => navigate('portfolios')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="11" rx="1.5"/><path d="M5 3V2a1 1 0 012 0v1M9 3V2a1 1 0 012 0v1"/></svg>
        Propietarios / Portfolios
      </div>
      <div className={`nav-item ${isActive('zonas', 'ficha-zona') ? 'active' : ''}`} onClick={() => navigate('zonas')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z"/><circle cx="8" cy="6" r="1.5"/></svg>
        Zonas
      </div>
      <div className={`nav-item ${isActive('usuarios', 'ficha-usuario') ? 'active' : ''}`} onClick={() => navigate('usuarios')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5"/><path d="M1 13c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/><circle cx="12" cy="5" r="2"/><path d="M14 13c0-1.8-1.3-3-3-3"/></svg>
        Usuarios Savills
      </div>

      <div className="nav-user">
        <div className="nav-av">AS</div>
        <div>
          <div className="nav-user-name">Álvaro Sierra</div>
          <div className="nav-user-role">Oficinas · Madrid</div>
        </div>
      </div>
    </nav>
  )
}
