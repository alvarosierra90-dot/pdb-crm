import { useNav } from '../context/NavigationContext'
import LanguageToggle from './LanguageToggle'

export default function Topbar() {
  const { view, navigate } = useNav()

  const configs = {
    activos: {
      bc: <><span className="bc-title">Activos</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim">+ Nuevo Activo</button></>
    },
    'ficha-activo': {
      bc: <><span className="bc-link" onClick={() => navigate('activos')}>Activos</span><span className="bc-sep">›</span><span className="bc-cur">P.E Avalon</span></>,
      right: <><span className="sbadge sb-conf">🔒 Confidencial</span><button className="tbtn">⬇ Exportar</button><span className="sbadge sb-green">● Activo</span></>
    },
    ofertas: {
      bc: <><span className="bc-title">Ofertas</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim">+ Nueva Oferta</button></>
    },
    'ficha-oferta': {
      bc: <><span className="bc-link" onClick={() => navigate('ofertas')}>Ofertas</span><span className="bc-sep">›</span><span className="bc-cur">OLBUR2315645 · Albatros</span></>,
      right: <><span className="sbadge sb-conf">🔒 Oferta confidencial: No</span><span className="sbadge sb-green">● En curso</span><button className="tbtn">⬇ Exportar</button></>
    },
    negociaciones: {
      bc: <><span className="bc-title">Negociaciones</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim">+ Nueva negociación</button></>
    },
    'ficha-negociacion': {
      bc: <><span className="bc-link" onClick={() => navigate('negociaciones')}>Negociaciones</span><span className="bc-sep">›</span><span className="bc-cur">NEG-0044 · Empresa XYZ / Avalon</span></>,
      right: <><span className="sbadge" style={{background:'var(--amber-lt)',color:'var(--amber)',border:'1px solid var(--amber-bd)'}}>↔ En negociación</span><button className="tbtn">⬇ Exportar</button></>
    },
    portfolios: {
      bc: <><span className="bc-title">Propietarios · Portfolios</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim">+ Nuevo propietario</button></>
    },
    portfolio: {
      bc: <><span className="bc-link" onClick={() => navigate('portfolios')}>Portfolios</span><span className="bc-sep">›</span><span className="bc-cur">Merlín Properties SOCIMI</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim">+ Nuevo propietario</button></>
    },
    demandas: {
      bc: <><span className="bc-title">Demandas</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim" onClick={() => navigate('ficha-demanda')}>+ Nueva Demanda</button></>
    },
    'ficha-demanda': {
      bc: <><span className="bc-link" onClick={() => navigate('demandas')}>Demandas</span><span className="bc-sep">›</span><span className="bc-cur">D251035690 · Corporacion Financiera Azuaga</span></>,
      right: <><span className="sbadge sb-green">● En Curso</span><button className="tbtn">⬇ Exportar</button></>
    },
    actividades: {
      bc: <><span className="bc-title">Actividades</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim" onClick={() => navigate('ficha-actividad')}>+ Nueva Actividad</button></>
    },
    'ficha-actividad': {
      bc: <><span className="bc-link" onClick={() => navigate('actividades')}>Actividades</span><span className="bc-sep">›</span><span className="bc-cur">ACT-2501 · Albatros Edif. D</span></>,
      right: <><span className="sbadge" style={{background:'var(--amber-lt)',color:'var(--amber)',border:'1px solid var(--amber-bd)'}}>Abierto</span><span className="sbadge" style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',marginLeft:4}}>📧 Email</span></>
    },
    visitas: {
      bc: <><span className="bc-title">Visitas</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim" onClick={() => navigate('ficha-visita')}>+ Nueva Visita</button></>
    },
    'ficha-visita': {
      bc: <><span className="bc-link" onClick={() => navigate('visitas')}>Visitas</span><span className="bc-sep">›</span><span className="bc-cur">VIS-001 · Corp. Financiera Azuaga</span></>,
      right: <><span className="sbadge sb-green">● Realizada</span><span className="sbadge" style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',marginLeft:4}}>Alto interés</span></>
    },
    tareas: {
      bc: <><span className="bc-title">Tareas</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim" onClick={() => navigate('ficha-tarea')}>+ Nueva Tarea</button></>
    },
    mandatos: {
      bc: <><span className="bc-title">Mandatos</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim" onClick={() => navigate('ficha-mandato')}>+ Nuevo Mandato</button></>
    },
    'ficha-mandato': {
      bc: <><span className="bc-link" onClick={() => navigate('mandatos')}>Mandatos</span><span className="bc-sep">›</span><span className="bc-cur">MAN-2501 · Exclusiva Leasing P.E Avalon</span></>,
      right: <><span className="sbadge sb-green">● Activo</span><span className="sbadge" style={{background:'var(--teal-lt)',color:'var(--teal)',border:'1px solid var(--teal-bd)',marginLeft:4}}>Coexclusiva</span><button className="tbtn" style={{marginLeft:4}}>⬇ Exportar</button></>
    },
    mapas: {
      bc: <><span className="bc-title">Mapas</span></>,
      right: <><button className="tbtn">⬇ Exportar vista</button><button className="tbtn prim">🔗 Compartir mapa</button></>
    },
    zonas: {
      bc: <><span className="bc-title">Zonas</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
    'ficha-zona': {
      bc: <><span className="bc-link" onClick={() => navigate('zonas')}>Zonas</span><span className="bc-sep">›</span><span className="bc-cur">M-30 / Distrito Centro</span></>,
      right: <><span className="sbadge" style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)'}}>Oficinas · Madrid</span><button className="tbtn">⬇ Exportar</button></>
    },
    usuarios: {
      bc: <><span className="bc-title">Usuarios Savills</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
    'ficha-usuario': {
      bc: <><span className="bc-link" onClick={() => navigate('usuarios')}>Usuarios</span><span className="bc-sep">›</span><span className="bc-cur">Sierra Alvaro · Leasing Oficinas MAD</span></>,
      right: <><span className="sbadge sb-green">● Activo</span><button className="tbtn">⬇ Exportar</button></>
    },
    'ficha-tarea': {
      bc: <><span className="bc-link" onClick={() => navigate('tareas')}>Tareas</span><span className="bc-sep">›</span><span className="bc-cur">TAR-001 · Activo Avalon</span></>,
      right: <><span style={{background:'var(--red-lt)',color:'var(--red)',border:'1px solid var(--red-bd)',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600}}>⬆ Alta prioridad</span><span className="sbadge" style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',marginLeft:4}}>En curso</span></>
    },
    cuentas: {
      bc: <><span className="bc-title">Cuentas</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim">+ Nueva Cuenta</button></>
    },
    contactos: {
      bc: <><span className="bc-title">Contactos</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim">+ Nuevo Contacto</button></>
    },
    propuestas: {
      bc: <><span className="bc-title">Propuestas · Proyectos</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim" onClick={() => navigate('ficha-propuesta')}>+ Nueva Propuesta</button></>
    },
    'ficha-propuesta': {
      bc: <><span className="bc-link" onClick={() => navigate('propuestas')}>Propuestas</span><span className="bc-sep">›</span><span className="bc-cur">PRO-001 · Ficha propuesta</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
    presentaciones: {
      bc: <><span className="bc-title">Presentaciones</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim">+ Nueva Presentación</button></>
    },
    'ficha-presentacion': {
      bc: <><span className="bc-link" onClick={() => navigate('presentaciones')}>Presentaciones</span><span className="bc-sep">›</span><span className="bc-cur">Ficha presentación</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
    propietarios: {
      bc: <><span className="bc-title">Propietarios</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim">+ Nuevo Propietario</button></>
    },
    'ficha-propietario': {
      bc: <><span className="bc-link" onClick={() => navigate('propietarios')}>Propietarios</span><span className="bc-sep">›</span><span className="bc-cur">Ficha propietario</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
    arrendatarios: {
      bc: <><span className="bc-title">Arrendatarios</span></>,
      right: <><button className="tbtn">⬇ Exportar</button><button className="tbtn prim">+ Nuevo Arrendatario</button></>
    },
    'ficha-arrendatario': {
      bc: <><span className="bc-link" onClick={() => navigate('arrendatarios')}>Arrendatarios</span><span className="bc-sep">›</span><span className="bc-cur">Ficha arrendatario</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
    'mis-clientes': {
      bc: <><span className="bc-title">Mis Clientes</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
    paneles: {
      bc: <><span className="bc-title">Paneles</span></>,
      right: <></>
    },
    oportunidades: {
      bc: <><span className="bc-title">Oportunidades</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
    instruccion: {
      bc: <><span className="bc-title">Transacción · Instrucción</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
    vencimientos: {
      bc: <><span className="bc-title">Vencimientos</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
    'inteligencia-comercial': {
      bc: <><span className="bc-title">Inteligencia Comercial</span></>,
      right: <><button className="tbtn">⬇ Exportar</button></>
    },
  }

  const cfg = configs[view] || configs.activos

  return (
    <div className="topbar">
      <div className="bc">{cfg.bc}</div>
      <div className="topbar-right" style={{display:'flex',alignItems:'center',gap:6}}>
        {cfg.right}
        <div style={{width:1,height:20,background:'var(--border)',flexShrink:0,marginLeft:2}}/>
        <LanguageToggle />
      </div>
    </div>
  )
}
