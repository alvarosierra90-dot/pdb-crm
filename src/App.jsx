import { NavProvider, useNav } from './context/NavigationContext'
import { TasksProvider } from './context/TasksContext'
import Nav from './components/Nav'
import Topbar from './components/Topbar'
import ActivosList from './views/ActivosList'
import FichaActivo from './views/FichaActivo'
import OfertasList from './views/OfertasList'
import FichaOferta from './views/FichaOferta'
import NegociacionesList from './views/NegociacionesList'
import FichaNegociacion from './views/FichaNegociacion'
import PortfoliosList from './views/PortfoliosList'
import PortfolioFicha from './views/PortfolioFicha'
import DemandaList from './views/DemandaList'
import FichaDemanda from './views/FichaDemanda'
import MandatosList from './views/MandatosList'
import FichaMandato from './views/FichaMandato'
import ZonasList from './views/ZonasList'
import FichaZona from './views/FichaZona'
import UsuariosList from './views/UsuariosList'
import FichaUsuario from './views/FichaUsuario'
import ActividadesList from './views/ActividadesList'
import FichaActividad from './views/FichaActividad'
import VisitasList from './views/VisitasList'
import FichaVisita from './views/FichaVisita'
import TareasList from './views/TareasList'
import FichaTarea from './views/FichaTarea'
import MapasView from './views/MapasView'
import MisClientes from './views/MisClientes'
import InteligenciaComercial from './views/InteligenciaComercial'
import Noticias from './views/Noticias'
import ArrendatariosList from './views/ArrendatariosList'
import FichaArrendatario from './views/FichaArrendatario'
import PropietariosList from './views/PropietariosList'
import FichaPropietario from './views/FichaPropietario'
import PropuestasList from './views/PropuestasList'
import FichaPropuesta from './views/FichaPropuesta'
import PresentacionesList from './views/PresentacionesList'
import VencimientosView from './views/VencimientosView'
import MarketingView from './views/MarketingView'
import InformesMercado from './views/InformesMercado'
import CuentasList from './views/CuentasList'
import ContactosList from './views/ContactosList'
import OportunidadesList from './views/OportunidadesList'
import InstruccionesList from './views/InstruccionesList'
import EntidadesLegalesList from './views/EntidadesLegalesList'
import LeadsList from './views/LeadsList'
import FichaLead from './views/FichaLead'
import FichaOportunidad from './views/FichaOportunidad'
import PitchView from './views/PitchView'
import NexoView from './views/NexoView'
import FormacionInterna from './views/FormacionInterna'

const BUILT = ['activos','ficha-activo','ofertas','ficha-oferta','negociaciones','ficha-negociacion','portfolios','portfolio','demandas','ficha-demanda','actividades','ficha-actividad','visitas','ficha-visita','tareas','ficha-tarea','zonas','ficha-zona','usuarios','ficha-usuario','mandatos','ficha-mandato','mapas','mis-clientes','inteligencia-comercial','vencimientos','marketing','informes-mercado','noticias','arrendatarios','ficha-arrendatario','propietarios','ficha-propietario','propuestas','ficha-propuesta','presentaciones','ficha-presentacion','cuentas','contactos','oportunidades','ficha-oportunidad','instruccion','entidades-legales','leads','ficha-lead','pitch','nexo','formacion-interna']

function Router() {
  const { view } = useNav()
  if (view === 'mapas') return <div style={{position:'fixed',inset:0,display:'flex',flexDirection:'column',zIndex:100,background:'#fff'}}><MapasView /></div>
  return (
    <div className="main-wrap">
      <Topbar />
      {view === 'activos' && <ActivosList />}
      {view === 'ficha-activo' && <FichaActivo />}
      {view === 'ofertas' && <OfertasList />}
      {view === 'ficha-oferta' && <FichaOferta />}
      {view === 'negociaciones' && <NegociacionesList />}
      {view === 'ficha-negociacion' && <FichaNegociacion />}
      {view === 'portfolios' && <PortfoliosList />}
      {view === 'portfolio' && <PortfolioFicha />}
      {view === 'demandas' && <DemandaList />}
      {view === 'ficha-demanda' && <FichaDemanda />}
      {view === 'actividades' && <ActividadesList />}
      {view === 'ficha-actividad' && <FichaActividad />}
      {view === 'visitas' && <VisitasList />}
      {view === 'ficha-visita' && <FichaVisita />}
      {view === 'tareas' && <TareasList />}
      {view === 'ficha-tarea' && <FichaTarea />}
      {view === 'mandatos' && <MandatosList />}
      {view === 'ficha-mandato' && <FichaMandato />}
      {view === 'mis-clientes' && <MisClientes />}
      {view === 'inteligencia-comercial' && <InteligenciaComercial />}
      {view === 'vencimientos' && <VencimientosView />}
      {view === 'marketing' && <MarketingView />}
      {view === 'informes-mercado' && <InformesMercado />}
      {view === 'noticias' && <Noticias />}
      {view === 'arrendatarios' && <ArrendatariosList />}
      {view === 'ficha-arrendatario' && <FichaArrendatario />}
      {view === 'propietarios' && <PropietariosList />}
      {view === 'ficha-propietario' && <FichaPropietario />}
      {view === 'propuestas' && <PropuestasList />}
      {view === 'ficha-propuesta' && <FichaPropuesta />}
      {view === 'presentaciones' && <PresentacionesList />}
      {view === 'zonas' && <ZonasList />}
      {view === 'ficha-zona' && <FichaZona />}
      {view === 'usuarios' && <UsuariosList />}
      {view === 'ficha-usuario' && <FichaUsuario />}
      {view === 'cuentas' && <CuentasList />}
      {view === 'contactos' && <ContactosList />}
      {view === 'oportunidades' && <OportunidadesList />}
      {view === 'ficha-oportunidad' && <FichaOportunidad />}
      {view === 'instruccion' && <InstruccionesList />}
      {view === 'entidades-legales' && <EntidadesLegalesList />}
      {view === 'leads' && <LeadsList />}
      {view === 'ficha-lead' && <FichaLead />}
      {view === 'pitch' && <PitchView />}
      {view === 'nexo' && <NexoView />}
      {view === 'formacion-interna' && <FormacionInterna />}
      {!BUILT.includes(view) && (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text4)' }}>
          <div style={{ fontSize: 32 }}>🚧</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Sección en desarrollo</div>
          <div style={{ fontSize: 12 }}>{view}</div>
        </div>
      )}
    </div>
  )
}

function ConditionalNav() {
  const { view } = useNav()
  if (view === 'mapas') return null
  return <Nav />
}

export default function App() {
  return (
    <TasksProvider>
      <NavProvider>
        <ConditionalNav />
        <Router />
      </NavProvider>
    </TasksProvider>
  )
}
