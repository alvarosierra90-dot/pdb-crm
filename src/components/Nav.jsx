import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'

function ChevronDown({ collapsed }) {
  return (
    <svg className={`nav-section-arrow ${collapsed ? 'collapsed' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l4 4 4-4"/>
    </svg>
  )
}

// Mapeo view → key de sección. Cualquier vista de una sección hace que esa sección
// se auto-expanda al navegar. Mantener en sync con los `toggle('xxx')` del render.
const SECTION_OF_VIEW = {
  // work
  paneles:'work', 'mis-clientes':'work',
  actividades:'work', 'ficha-actividad':'work',
  tareas:'work', 'ficha-tarea':'work',
  visitas:'work', 'ficha-visita':'work',
  presentaciones:'work', 'ficha-presentacion':'work',
  // cli
  cuentas:'cli', contactos:'cli', 'entidades-legales':'cli',
  // funnel (consolidado: captacion + ejecucion + cierre)
  leads:'funnel', 'ficha-lead':'funnel',
  oportunidades:'funnel', 'ficha-oportunidad':'funnel',
  propuestas:'funnel', 'ficha-propuesta':'funnel',
  mandatos:'funnel', 'ficha-mandato':'funnel',
  ofertas:'funnel', 'ficha-oferta':'funnel',
  demandas:'funnel', 'ficha-demanda':'funnel',
  negociaciones:'funnel', 'ficha-negociacion':'funnel',
  instruccion:'funnel',
  // act2
  activos:'act2', 'ficha-activo':'act2',
  arrendatarios:'act2', 'ficha-arrendatario':'act2',
  propietarios:'act2', 'ficha-propietario':'act2',
  // int
  vencimientos:'int', 'inteligencia-comercial':'int', noticias:'int',
  // ana (incluye Mapas)
  mapas:'ana',
  portfolios:'ana', portfolio:'ana',
  'informes-mercado':'ana',
  zonas:'ana', 'ficha-zona':'ana',
  // adm
  marketing:'adm',
  usuarios:'adm', 'ficha-usuario':'adm',
  pitch:'adm', nexo:'adm',
  'formacion-interna':'adm',
}

const STORAGE_KEY = 'pdb.nav.collapsed.v2'
const ALL_SECTIONS = ['work','cli','funnel','act2','int','ana','adm']

// Estado inicial: todas colapsadas excepto la del view actual. Si hay
// preferencias guardadas en localStorage, prevalecen (pero la sección del
// view actual siempre se fuerza abierta para que el usuario vea el item activo).
function initialCollapsed(view) {
  let saved = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw)
  } catch {}
  const out = {}
  for (const s of ALL_SECTIONS) {
    out[s] = saved && typeof saved[s] === 'boolean' ? saved[s] : true
  }
  const active = SECTION_OF_VIEW[view]
  if (active) out[active] = false
  return out
}

export default function Nav() {
  const { view, resetTo } = useNav()
  // El sidebar siempre limpia el historial al saltar de sección: cuando el
  // usuario clica un módulo del menú está abandonando el flujo actual.
  // Eso evita acumular pasos extraños en la pila de "Atrás".
  const navigate = (v, p) => resetTo(v, p)
  const [collapsed, setCollapsed] = useState(() => initialCollapsed(view))

  // Al cambiar de view, auto-expandir su sección (sin tocar las demás).
  useEffect(() => {
    const active = SECTION_OF_VIEW[view]
    if (!active) return
    setCollapsed(prev => prev[active] === false ? prev : { ...prev, [active]: false })
  }, [view])

  // Persistir preferencias del usuario.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed)) } catch {}
  }, [collapsed])

  const isActive = (...views) => views.includes(view)
  const toggle = (s) => setCollapsed(p => ({ ...p, [s]: !p[s] }))
  const open = (s) => !collapsed[s]

  return (
    <nav>
      <div className="nav-logo">
        <div className="nav-logo-mark">PDB</div>
        <div className="nav-logo-text">PropDatabase</div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          1. MI TRABAJO — vista personal del broker (día a día)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="nav-section" onClick={() => toggle('work')}>
        Mi trabajo <ChevronDown collapsed={collapsed.work} />
      </div>
      {open('work') && <>
        <div className={`nav-item ${isActive('paneles') ? 'active' : ''}`} onClick={() => navigate('paneles')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
          Paneles
        </div>
        <div className={`nav-item ${isActive('mis-clientes') ? 'active' : ''}`} onClick={() => navigate('mis-clientes')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 13c0-2.5 2-4 4-4s4 1.5 4 4"/><circle cx="6" cy="6" r="3"/><path d="M13 13c0-1.5-1-2.5-2.5-3"/><circle cx="11.5" cy="5.5" r="2"/></svg>
          Mis clientes
        </div>
        <div className={`nav-item ${isActive('actividades','ficha-actividad') ? 'active' : ''}`} onClick={() => navigate('actividades')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M3 4h10M3 12h6"/></svg>
          Actividades <span className="nav-badge">10</span>
        </div>
        <div className={`nav-item ${isActive('tareas','ficha-tarea') ? 'active' : ''}`} onClick={() => navigate('tareas')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8l2 2 4-4"/><rect x="2" y="2" width="12" height="12" rx="2"/></svg>
          Tareas
        </div>
        <div className={`nav-item ${isActive('visitas','ficha-visita') ? 'active' : ''}`} onClick={() => navigate('visitas')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 7h12M5 1v4M11 1v4"/></svg>
          Visitas
        </div>
        <div className={`nav-item ${isActive('presentaciones','ficha-presentacion') ? 'active' : ''}`} onClick={() => navigate('presentaciones')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><path d="M9 11.5h5M11.5 9v5"/></svg>
          Presentaciones
        </div>
      </>}

      {/* ═══════════════════════════════════════════════════════════════
          2. CLIENTES — datos maestros desde Dynamics (read-only)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="nav-section" onClick={() => toggle('cli')}>
        Clientes <ChevronDown collapsed={collapsed.cli} />
      </div>
      {open('cli') && <>
        <div className={`nav-item ${isActive('cuentas') ? 'active' : ''}`} onClick={() => navigate('cuentas')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6h12"/></svg>
          Cuentas <span className="nav-dyn">Dynamics</span>
        </div>
        <div className={`nav-item ${isActive('contactos') ? 'active' : ''}`} onClick={() => navigate('contactos')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>
          Contactos <span className="nav-dyn">Dynamics</span>
        </div>
        <div className={`nav-item ${isActive('entidades-legales') ? 'active' : ''}`} onClick={() => navigate('entidades-legales')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 9h6M5 12h4"/></svg>
          Entidades legales <span className="nav-dyn">Dynamics</span>
        </div>
      </>}

      {/* ═══════════════════════════════════════════════════════════════
          3. FUNNEL COMERCIAL — todo el hilo conductor en una sola sección
             CAPTACIÓN: Lead → Oportunidad (Dynamics) → Propuesta
             EJECUCIÓN: Mandato · Oferta · Demanda
             CIERRE:    Negociación → Instrucción (Dynamics)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="nav-section" onClick={() => toggle('funnel')}>
        Funnel comercial <ChevronDown collapsed={collapsed.funnel} />
      </div>
      {open('funnel') && <>
        <div className="nav-subhead">Captación</div>
        <div className={`nav-item ${isActive('leads','ficha-lead') ? 'active' : ''}`} onClick={() => navigate('leads')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"/></svg>
          Leads <span className="nav-badge" style={{background:'#fef3c7',color:'#92400e'}}>15</span>
        </div>
        <div className={`nav-item ${isActive('oportunidades') ? 'active' : ''}`} onClick={() => navigate('oportunidades')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h2l2-4 2 8 2-5 2 3h2"/></svg>
          Oportunidades <span className="nav-dyn">Dynamics</span>
        </div>
        <div className={`nav-item ${isActive('propuestas','ficha-propuesta') ? 'active' : ''}`} onClick={() => navigate('propuestas')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4M5 8h6M5 11h4"/></svg>
          Propuestas / Proyectos
        </div>
        <div className="nav-subhead">Ejecución</div>
        <div className={`nav-item ${isActive('mandatos','ficha-mandato') ? 'active' : ''}`} onClick={() => navigate('mandatos')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4M6 9l1.5 1.5L11 7"/></svg>
          Mandatos
        </div>
        <div className={`nav-item ${isActive('ofertas','ficha-oferta') ? 'active' : ''}`} onClick={() => navigate('ofertas')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/><path d="M2 4l6 5 6-5"/></svg>
          Ofertas
        </div>
        <div className={`nav-item ${isActive('demandas','ficha-demanda') ? 'active' : ''}`} onClick={() => navigate('demandas')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
          Demandas
        </div>
        <div className="nav-subhead">Cierre</div>
        <div className={`nav-item ${isActive('negociaciones','ficha-negociacion') ? 'active' : ''}`} onClick={() => navigate('negociaciones')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3z"/><path d="M5 13l1-2h4l1 2"/><path d="M5 7h6M5 9.5h4"/></svg>
          Negociaciones <span className="nav-badge">4</span>
        </div>
        <div className={`nav-item ${isActive('instruccion') ? 'active' : ''}`} onClick={() => navigate('instruccion')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4M6 11l1.5 1.5L11 9"/></svg>
          Instrucciones <span className="nav-dyn">Dynamics</span>
        </div>
      </>}

      {/* ═══════════════════════════════════════════════════════════════
          4. ACTIVO — base maestra del inmueble
             Activo (estructura física) + Arrendatarios (ocupación)
             + Propietarios (titularidad)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="nav-section" onClick={() => toggle('act2')}>
        Activo <ChevronDown collapsed={collapsed.act2} />
      </div>
      {open('act2') && <>
        <div className={`nav-item ${isActive('activos','ficha-activo') ? 'active' : ''}`} onClick={() => navigate('activos')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="12" height="9" rx="1.5"/><path d="M5 5V4a3 3 0 016 0v1"/></svg>
          Activos
        </div>
        <div className={`nav-item ${isActive('arrendatarios','ficha-arrendatario') ? 'active' : ''}`} onClick={() => navigate('arrendatarios')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 14c0-2.5 2-4 4-4s4 1.5 4 4"/><circle cx="6" cy="6" r="2.5"/><path d="M11 8h3M11 11h3"/></svg>
          Arrendatarios
        </div>
        <div className={`nav-item ${isActive('propietarios','ficha-propietario') ? 'active' : ''}`} onClick={() => navigate('propietarios')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6l5-4 5 4v8H3V6z"/><circle cx="8" cy="9" r="1.5"/></svg>
          Propietarios
        </div>
      </>}

      {/* ═══════════════════════════════════════════════════════════════
          7. INTELIGENCIA — radar comercial
         ═══════════════════════════════════════════════════════════════ */}
      <div className="nav-section" onClick={() => toggle('int')}>
        Inteligencia <ChevronDown collapsed={collapsed.int} />
      </div>
      {open('int') && <>
        <div className={`nav-item ${isActive('vencimientos') ? 'active' : ''}`} onClick={() => navigate('vencimientos')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>
          Vencimientos
        </div>
        <div className={`nav-item ${isActive('inteligencia-comercial') ? 'active' : ''}`} onClick={() => navigate('inteligencia-comercial')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>
          Inteligencia comercial
        </div>
        <div className={`nav-item ${isActive('noticias') ? 'active' : ''}`} onClick={() => navigate('noticias')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 6h6M5 9h4"/></svg>
          Noticias
        </div>
      </>}

      {/* ═══════════════════════════════════════════════════════════════
          8. ANÁLISIS — reporting, consolidación y cartografía
         ═══════════════════════════════════════════════════════════════ */}
      <div className="nav-section" onClick={() => toggle('ana')}>
        Análisis <ChevronDown collapsed={collapsed.ana} />
      </div>
      {open('ana') && <>
        <div className={`nav-item ${isActive('mapas') ? 'active' : ''}`} onClick={() => navigate('mapas')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L2 4v10l4-2 4 2 4-2V2l-4 2-4-2z"/></svg>
          Mapas
        </div>
        <div className={`nav-item ${isActive('portfolios','portfolio') ? 'active' : ''}`} onClick={() => navigate('portfolios')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="11" rx="1.5"/><path d="M5 3V2a1 1 0 012 0v1M9 3V2a1 1 0 012 0v1"/></svg>
          Portfolios institucionales
        </div>
        <div className={`nav-item ${isActive('informes-mercado') ? 'active' : ''}`} onClick={() => navigate('informes-mercado')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l3-4 3 2 3-5 3 3"/><path d="M2 14h12"/></svg>
          Informes de mercado
        </div>
        <div className={`nav-item ${isActive('zonas','ficha-zona') ? 'active' : ''}`} onClick={() => navigate('zonas')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z"/><circle cx="8" cy="6" r="1.5"/></svg>
          Zonas
        </div>
      </>}

      {/* ═══════════════════════════════════════════════════════════════
          9. ADMINISTRACIÓN
         ═══════════════════════════════════════════════════════════════ */}
      <div className="nav-section" onClick={() => toggle('adm')}>
        Administración <ChevronDown collapsed={collapsed.adm} />
      </div>
      {open('adm') && <>
        <div className={`nav-item ${isActive('marketing') ? 'active' : ''}`} onClick={() => navigate('marketing')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8l4-4 3 3 5-5"/><path d="M2 14h12"/></svg>
          Marketing
        </div>
        <div className={`nav-item ${isActive('usuarios','ficha-usuario') ? 'active' : ''}`} onClick={() => navigate('usuarios')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5"/><path d="M1 13c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/><circle cx="12" cy="5" r="2"/><path d="M14 13c0-1.8-1.3-3-3-3"/></svg>
          Usuarios Savills
        </div>
        <div className={`nav-item ${isActive('pitch') ? 'active' : ''}`} onClick={() => navigate('pitch')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="9" rx="1.5"/><path d="M6 12v2M10 12v2M5 14h6"/><path d="M5 7l2 2 4-4"/></svg>
          Pitch
        </div>
        <div className={`nav-item ${isActive('nexo') ? 'active' : ''}`} onClick={() => navigate('nexo')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="4" cy="4" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><path d="M6 4h4M6 12h4M4 6v4M12 6v4"/></svg>
          NEXO
        </div>
        <div className={`nav-item ${isActive('formacion-interna') ? 'active' : ''}`} onClick={() => navigate('formacion-interna')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2L1 5l7 3 7-3-7-3z"/><path d="M3 7v3l5 2 5-2V7"/></svg>
          Formación interna
        </div>
      </>}

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
