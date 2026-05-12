import { useNav } from '../context/NavigationContext'
import LanguageToggle from './LanguageToggle'
import { Download, Lock, Mail, ArrowUp, Plus, Share2, ArrowLeftRight, ChevronRight } from 'lucide-react'

const ICO = 14
const ICO_SM = 12

const Sep = () => <ChevronRight size={ICO_SM} style={{color:'var(--border2)',margin:'0 4px',flexShrink:0}} />
const ExportBtn = ({ label = 'Exportar' }) => (
  <button className="tbtn"><Download size={ICO} strokeWidth={1.75} /> {label}</button>
)
const NewBtn = ({ label, onClick }) => (
  <button className="tbtn prim" onClick={onClick}><Plus size={ICO} strokeWidth={2} /> {label}</button>
)

export default function Topbar() {
  const { view, navigate } = useNav()

  const configs = {
    activos: {
      bc: <><span className="bc-title">Activos</span></>,
      right: <><ExportBtn /><NewBtn label="Nuevo Activo" /></>
    },
    'ficha-activo': {
      bc: <><span className="bc-link" onClick={() => navigate('activos')}>Activos</span><Sep /><span className="bc-cur">P.E Avalon</span></>,
      right: <><span className="sbadge sb-conf"><Lock size={ICO_SM} /> Confidencial</span><ExportBtn /><span className="sbadge sb-green">● Activo en mercado</span></>
    },
    ofertas: {
      bc: <><span className="bc-title">Ofertas</span></>,
      right: <><ExportBtn /><NewBtn label="Nueva Oferta" /></>
    },
    'ficha-oferta': {
      bc: <><span className="bc-link" onClick={() => navigate('ofertas')}>Ofertas</span><Sep /><span className="bc-cur">OLBUR2315645 · Albatros</span></>,
      right: <><span className="sbadge sb-conf"><Lock size={ICO_SM} /> Oferta confidencial: No</span><span className="sbadge sb-green">● En curso</span><ExportBtn /></>
    },
    negociaciones: {
      bc: <><span className="bc-title">Negociaciones</span></>,
      right: <><ExportBtn /><NewBtn label="Nueva negociación" /></>
    },
    'ficha-negociacion': {
      bc: <><span className="bc-link" onClick={() => navigate('negociaciones')}>Negociaciones</span><Sep /><span className="bc-cur">NEG-0044 · Cuenta XYZ / Avalon</span></>,
      right: <><span className="sbadge" style={{background:'var(--amber-lt)',color:'var(--amber)',border:'1px solid var(--amber-bd)'}}><ArrowLeftRight size={ICO_SM} /> En negociación</span><ExportBtn /></>
    },
    portfolios: {
      bc: <><span className="bc-title">Propietarios · Portfolios</span></>,
      right: <><ExportBtn /></>
    },
    portfolio: {
      bc: <><span className="bc-link" onClick={() => navigate('portfolios')}>Portfolios</span><Sep /><span className="bc-cur">Merlín Properties SOCIMI</span></>,
      right: <><ExportBtn /></>
    },
    demandas: {
      bc: <><span className="bc-title">Demandas</span></>,
      right: <><ExportBtn /><NewBtn label="Nueva Demanda" onClick={() => navigate('ficha-demanda')} /></>
    },
    'ficha-demanda': {
      bc: <><span className="bc-link" onClick={() => navigate('demandas')}>Demandas</span><Sep /><span className="bc-cur">D251035690 · Corporacion Financiera Azuaga</span></>,
      right: <><span className="sbadge sb-green">● En Curso</span><ExportBtn /></>
    },
    actividades: {
      bc: <><span className="bc-title">Actividades</span></>,
      right: <><ExportBtn /><NewBtn label="Nueva Actividad" onClick={() => navigate('ficha-actividad')} /></>
    },
    'ficha-actividad': {
      bc: <><span className="bc-link" onClick={() => navigate('actividades')}>Actividades</span><Sep /><span className="bc-cur">ACT-2501 · Albatros Edif. D</span></>,
      right: <><span className="sbadge" style={{background:'var(--amber-lt)',color:'var(--amber)',border:'1px solid var(--amber-bd)'}}>Pendiente</span><span className="sbadge" style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',marginLeft:4}}><Mail size={ICO_SM} /> Email</span></>
    },
    visitas: {
      bc: <><span className="bc-title">Visitas</span></>,
      right: <><ExportBtn /><NewBtn label="Nueva Visita" onClick={() => navigate('ficha-visita')} /></>
    },
    'ficha-visita': {
      bc: <><span className="bc-link" onClick={() => navigate('visitas')}>Visitas</span><Sep /><span className="bc-cur">VIS-001 · Corp. Financiera Azuaga</span></>,
      right: <><span className="sbadge sb-green">● Realizada</span><span className="sbadge" style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',marginLeft:4}}>Alto interés</span></>
    },
    tareas: {
      bc: <><span className="bc-title">Tareas</span></>,
      right: <><ExportBtn /><NewBtn label="Nueva Tarea" onClick={() => navigate('ficha-tarea')} /></>
    },
    mandatos: {
      bc: <><span className="bc-title">Mandatos</span></>,
      right: <><ExportBtn /></>
    },
    'ficha-mandato': {
      bc: <><span className="bc-link" onClick={() => navigate('mandatos')}>Mandatos</span><Sep /><span className="bc-cur">MAN-2501 · Exclusiva Leasing P.E Avalon</span></>,
      right: <><span className="sbadge sb-green">● En curso</span><span className="sbadge" style={{background:'var(--teal-lt)',color:'var(--teal)',border:'1px solid var(--teal-bd)',marginLeft:4}}>Coexclusiva</span><ExportBtn /></>
    },
    mapas: {
      bc: <><span className="bc-title">Mapas</span></>,
      right: <><ExportBtn label="Exportar vista" /><button className="tbtn prim"><Share2 size={ICO} strokeWidth={1.75} /> Compartir mapa</button></>
    },
    zonas: {
      bc: <><span className="bc-title">Zonas</span></>,
      right: <><ExportBtn /></>
    },
    'ficha-zona': {
      bc: <><span className="bc-link" onClick={() => navigate('zonas')}>Zonas</span><Sep /><span className="bc-cur">M-30 / Distrito Centro</span></>,
      right: <><span className="sbadge" style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)'}}>Oficinas · Madrid</span><ExportBtn /></>
    },
    usuarios: {
      bc: <><span className="bc-title">Usuarios Savills</span></>,
      right: <><ExportBtn /></>
    },
    'ficha-usuario': {
      bc: <><span className="bc-link" onClick={() => navigate('usuarios')}>Usuarios</span><Sep /><span className="bc-cur">Sierra Alvaro · Leasing Oficinas MAD</span></>,
      right: <><span className="sbadge sb-green">● Activo</span><ExportBtn /></>
    },
    'ficha-tarea': {
      bc: <><span className="bc-link" onClick={() => navigate('tareas')}>Tareas</span><Sep /><span className="bc-cur">TAR-001 · Activo Avalon</span></>,
      right: <><span style={{background:'var(--red-lt)',color:'var(--red)',border:'1px solid var(--red-bd)',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,display:'inline-flex',alignItems:'center',gap:4}}><ArrowUp size={ICO_SM} /> Alta prioridad</span><span className="sbadge" style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',marginLeft:4}}>En curso</span></>
    },
    cuentas: {
      bc: <><span className="bc-title">Cuentas</span></>,
      right: <><ExportBtn /><NewBtn label="Nueva Cuenta" /></>
    },
    contactos: {
      bc: <><span className="bc-title">Contactos</span></>,
      right: <><ExportBtn /><NewBtn label="Nuevo Contacto" /></>
    },
    propuestas: {
      bc: <><span className="bc-title">Propuestas · Proyectos</span></>,
      right: <><ExportBtn /><NewBtn label="Nueva Propuesta" onClick={() => navigate('ficha-propuesta')} /></>
    },
    'ficha-propuesta': {
      bc: <><span className="bc-link" onClick={() => navigate('propuestas')}>Propuestas</span><Sep /><span className="bc-cur">PRO-001 · Ficha propuesta</span></>,
      right: <><ExportBtn /></>
    },
    presentaciones: {
      bc: <><span className="bc-title">Presentaciones</span></>,
      right: <><ExportBtn /><NewBtn label="Nueva Presentación" /></>
    },
    'ficha-presentacion': {
      bc: <><span className="bc-link" onClick={() => navigate('presentaciones')}>Presentaciones</span><Sep /><span className="bc-cur">Ficha presentación</span></>,
      right: <><ExportBtn /></>
    },
    propietarios: {
      bc: <><span className="bc-title">Propietarios</span></>,
      right: <><ExportBtn /><NewBtn label="Nuevo Propietario" /></>
    },
    'ficha-propietario': {
      bc: <><span className="bc-link" onClick={() => navigate('propietarios')}>Propietarios</span><Sep /><span className="bc-cur">Ficha propietario</span></>,
      right: <><ExportBtn /></>
    },
    arrendatarios: {
      bc: <><span className="bc-title">Arrendatarios</span></>,
      right: <><ExportBtn /><NewBtn label="Nuevo Arrendatario" /></>
    },
    'ficha-arrendatario': {
      bc: <><span className="bc-link" onClick={() => navigate('arrendatarios')}>Arrendatarios</span><Sep /><span className="bc-cur">Ficha arrendatario</span></>,
      right: <><ExportBtn /></>
    },
    'mis-clientes': {
      bc: <><span className="bc-title">Mis Cuentas</span></>,
      right: <><ExportBtn /></>
    },
    paneles: {
      bc: <><span className="bc-title">Paneles</span></>,
      right: <></>
    },
    oportunidades: {
      bc: <><span className="bc-title">Oportunidades</span></>,
      right: <><ExportBtn /></>
    },
    instruccion: {
      bc: <><span className="bc-title">Transacción · Instrucción</span></>,
      right: <><ExportBtn /></>
    },
    vencimientos: {
      bc: <><span className="bc-title">Vencimientos</span></>,
      right: <><ExportBtn /></>
    },
    'inteligencia-comercial': {
      bc: <><span className="bc-title">Inteligencia Comercial</span></>,
      right: <><ExportBtn /></>
    },
    leads: {
      bc: <><span className="bc-title">Leads</span></>,
      right: <><ExportBtn /></>
    },
    'ficha-lead': {
      bc: <><span className="bc-link" onClick={() => navigate('leads')}>Leads</span><Sep /><span className="bc-cur">Ficha lead</span></>,
      right: <><ExportBtn /></>
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
