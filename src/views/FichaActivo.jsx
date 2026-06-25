import { useState, useEffect, useRef, Fragment } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'
import BajaArrendatarioModal from '../components/BajaArrendatarioModal'
import SalidaArrendatarioModal from '../components/SalidaArrendatarioModal'
import SalidaPropietarioModal  from '../components/SalidaPropietarioModal'
import SalidaOfertaModal       from '../components/SalidaOfertaModal'
import HistoricoEdificio       from '../components/HistoricoEdificio'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'
import AltaPropietarioModal from '../components/AltaPropietarioModal'
import AltaArrendatarioModal from '../components/AltaArrendatarioModal'
import VinculacionesMaestra from '../components/VinculacionesMaestra'
import { BUILDINGS_BY_ACTIVO } from '../data/stackingData'
import { supabase } from '../lib/supabase'
import {
  USOS_PRINCIPALES, normalizeUso, calidadesDe, camposSuperficie, buildMetricas, usoTag,
  CALIDADES_POR_USO,
} from '../lib/usoConfig'
import {
  Building2, Factory, ShoppingBag, Server, Home, Hotel, Square,
  Mail, Phone, Users, FileText, Pencil, CheckSquare,
  MapPin, Search, Upload, Image as ImageIcon, AlertTriangle, ArrowDown, BarChart3, Wallet, ClipboardList,
  Inbox, Clock, FileSpreadsheet, StickyNote, Link2, X as XClose, Download,
  Folder, Wrench, Target, Compass, Presentation, ScrollText, Tag, UserCheck, Lock
} from 'lucide-react'

const USO_PREFIX_FA    = { 'Oficinas':'OF', 'Industrial':'IN', 'Logística':'LG', 'Retail High Street':'RT', 'Centro Comercial':'CC', 'Hotel':'HT', 'Residencial':'RS', 'Build to Rent':'BR', 'Build to Sell':'BS', 'Flex Living':'FL', 'Senior Living':'SL', 'Care Homes':'CH', 'Apartamentos Turísticos':'AT', 'Aparcamiento':'AP', 'Trasteros':'TR', 'Data Center':'DC', 'Suelo':'SU' }
const CIUDAD_PREFIX_FA = { 'Madrid':'MAD', 'Barcelona':'BCN', 'Valencia':'VLC', 'Sevilla':'SEV', 'Bilbao':'BIL', 'Guadalajara':'GUA' }
function genRefFA(ciudad, uso) {
  const cp = CIUDAD_PREFIX_FA[ciudad] || ciudad.slice(0,3).toUpperCase()
  const up = USO_PREFIX_FA[normalizeUso(uso)] || 'XX'
  const num = String(Math.floor(Math.random()*90000)+10000)
  return `${cp}-${up}-${num}`
}
const CUENTAS_FA = ['Colonial SOCIMI','Merlin Properties','GMP','Barings Real Estate','Allianz Real Estate','Prologis','CBRE Investment Management','Grosvenor','IBA Capital','Neinor Homes','Axa IM Real Assets','Blackstone','Brookfield']
const USO_ICO    = { 'Oficinas': Building2, 'Industrial': Factory, 'Logística': Factory, 'Retail High Street': ShoppingBag, 'Centro Comercial': ShoppingBag, 'Hotel': Hotel, 'Residencial': Home, 'Build to Rent': Home, 'Build to Sell': Home, 'Flex Living': Home, 'Senior Living': Home, 'Care Homes': Home, 'Apartamentos Turísticos': Hotel, 'Aparcamiento': Square, 'Trasteros': Square, 'Data Center': Server, 'Suelo': Square }
function UsoIco({ uso, size = 14 }) {
  const Ico = USO_ICO[normalizeUso(uso)] || Building2
  return <Ico size={size} strokeWidth={1.75} />
}

/* ── ZONAS por USO y CIUDAD (área → zona → subzona) ──
   Exportado para reusarse en otras fichas (Demanda, Oferta…) y
   garantizar consistencia con la jerarquía del Pitch paso 7. */
export const ZONES = {
  'Oficinas': {
    'Madrid': [
      { area:'Centro',         zona:'M-30',       subzona:'Azca' },
      { area:'Centro',         zona:'M-30',       subzona:'Castellana' },
      { area:'Centro',         zona:'M-30',       subzona:'Salamanca' },
      { area:'Centro',         zona:'M-30',       subzona:'Chamberí' },
      { area:'Centro',         zona:'M-30',       subzona:'Chamartín' },
      { area:'Centro',         zona:'M-30',       subzona:'Centro' },
      { area:'Centro',         zona:'M-30',       subzona:'Jerónimos' },
      { area:'Centro',         zona:'M-30',       subzona:'Recoletos' },
      { area:'Centro',         zona:'M-30',       subzona:'Retiro' },
      { area:'Centro',         zona:'M-30',       subzona:'Tetuán' },
      { area:'Centro',         zona:'M-30',       subzona:'Viso' },
      { area:'Centro',         zona:'M-30',       subzona:'M. Álvaro' },
      { area:'Centro',         zona:'M-30',       subzona:'Prosperidad' },
      { area:'Centro',         zona:'M-30',       subzona:'Ciudad Universitaria' },
      { area:'Descentralizado',zona:'M-40',       subzona:'Vía de los Poblados' },
      { area:'Descentralizado',zona:'M-40',       subzona:'Campo de las Naciones / IFEMA' },
      { area:'Descentralizado',zona:'A-1',        subzona:'Alcobendas Europa' },
      { area:'Descentralizado',zona:'A-1',        subzona:'Alcobendas Polígono' },
      { area:'Descentralizado',zona:'A-1',        subzona:'Alcobendas Arroyo de la Vega' },
      { area:'Descentralizado',zona:'A-1',        subzona:'Alcobendas La Moraleja' },
      { area:'Descentralizado',zona:'A-1',        subzona:'San Sebastián de los Reyes' },
      { area:'Descentralizado',zona:'A-1',        subzona:'Las Tablas' },
      { area:'Descentralizado',zona:'A-1',        subzona:'Sanchinarro' },
      { area:'Descentralizado',zona:'A-1',        subzona:'Fuencarral' },
      { area:'Descentralizado',zona:'A-1',        subzona:'Mirasierra' },
      { area:'Descentralizado',zona:'A-2',        subzona:'Arturo Soria' },
      { area:'Descentralizado',zona:'A-2',        subzona:'Las Mercedes' },
      { area:'Descentralizado',zona:'A-2',        subzona:'Madbit' },
      { area:'Descentralizado',zona:'A-2',        subzona:'Julián Camarillo' },
      { area:'Descentralizado',zona:'A-2',        subzona:'San Fernando de Henares' },
      { area:'Descentralizado',zona:'A-2',        subzona:'Barajas / Eisenhower' },
      { area:'Periferia',      zona:'A-3',        subzona:'Vallecas' },
      { area:'Periferia',      zona:'A-3',        subzona:'Rivas' },
      { area:'Periferia',      zona:'A-5',        subzona:'Alcorcón' },
      { area:'Periferia',      zona:'A-5',        subzona:'Carabanchel' },
      { area:'Periferia',      zona:'A-6',        subzona:'Aravaca' },
      { area:'Periferia',      zona:'A-6',        subzona:'La Florida' },
      { area:'Periferia',      zona:'A-6',        subzona:'Pozuelo' },
      { area:'Periferia',      zona:'A-6',        subzona:'Majadahonda' },
      { area:'Periferia',      zona:'A-6',        subzona:'Las Rozas' },
      { area:'Periferia',      zona:'A-6',        subzona:'El Plantío' },
      { area:'Periferia',      zona:'A-6',        subzona:'Ciudad de la Imagen' },
      { area:'Periferia',      zona:'A-6',        subzona:'Boadilla del Monte' },
      { area:'Periferia',      zona:'A-6',        subzona:'La Finca' },
      { area:'Periferia',      zona:'Tres Cantos', subzona:'Tres Cantos' },
    ],
    'Barcelona': [
      { area:'CBD',            zona:'Diagonal',   subzona:'Paseo de Gracia / Diagonal' },
      { area:'CBD',            zona:'Diagonal',   subzona:'Les Corts' },
      { area:'CBD',            zona:'Eixample',   subzona:'Eixample Derecho' },
      { area:'CBD',            zona:'Eixample',   subzona:'Eixample Izquierdo' },
      { area:'CBD',            zona:'Eixample',   subzona:'Sarrià - Sant Gervasi' },
      { area:'Descentralizado',zona:'22@',        subzona:'Poblenou Norte' },
      { area:'Descentralizado',zona:'22@',        subzona:'Poblenou Sur' },
      { area:'Descentralizado',zona:'22@',        subzona:'Rambla del Poblenou' },
      { area:'Descentralizado',zona:"Gran Vía L'H",subzona:"L'Hospitalet Norte" },
      { area:'Descentralizado',zona:"Gran Vía L'H",subzona:"L'Hospitalet Sur" },
      { area:'Periferia',      zona:'Sant Cugat', subzona:'Sant Cugat del Vallès' },
      { area:'Periferia',      zona:'Cornellà',   subzona:'Cornellà de Llobregat' },
      { area:'Periferia',      zona:'Esplugues',  subzona:'Esplugues de Llobregat' },
      { area:'Periferia',      zona:'El Prat',    subzona:'El Prat de Llobregat' },
    ],
    'Valencia': [
      { area:'CBD',            zona:'Centro',     subzona:'Centro histórico' },
      { area:'CBD',            zona:'Ensanche',   subzona:'Ensanche' },
      { area:'CBD',            zona:'Ensanche',   subzona:'Gran Vía Marqués del Turia' },
      { area:'Descentralizado',zona:'Mestalla',   subzona:'Mestalla' },
      { area:'Descentralizado',zona:'Mestalla',   subzona:'Benimaclet' },
      { area:'Descentralizado',zona:'Campanar',   subzona:'Campanar' },
      { area:'Descentralizado',zona:'Campanar',   subzona:'Patraix' },
      { area:'Periferia',      zona:'Paterna',    subzona:'Parque Tecnológico Paterna' },
      { area:'Periferia',      zona:'Torrent',    subzona:'Torrent' },
    ],
  },
  'Logístico': {
    'Madrid': [
      { area:'Corredor del Henares',zona:'A-2', subzona:'Coslada' },
      { area:'Corredor del Henares',zona:'A-2', subzona:'San Fernando de Henares' },
      { area:'Corredor del Henares',zona:'A-2', subzona:'Torrejón de Ardoz' },
      { area:'Corredor del Henares',zona:'A-2', subzona:'Alcalá de Henares' },
      { area:'Corredor del Henares',zona:'A-2', subzona:'Meco' },
      { area:'Corredor del Henares',zona:'A-2', subzona:'Cabanillas del Campo' },
      { area:'Sur Madrid',          zona:'A-4', subzona:'Getafe' },
      { area:'Sur Madrid',          zona:'A-4', subzona:'Pinto' },
      { area:'Sur Madrid',          zona:'A-4', subzona:'Valdemoro' },
      { area:'Sur Madrid',          zona:'A-4', subzona:'Ciempozuelos' },
      { area:'Sur Madrid',          zona:'A-4', subzona:'Seseña' },
      { area:'Norte Madrid',        zona:'A-1', subzona:'Alcobendas' },
      { area:'Norte Madrid',        zona:'A-1', subzona:'San Sebastián de los Reyes' },
      { area:'Oeste Madrid',        zona:'A-5', subzona:'Leganés' },
      { area:'Oeste Madrid',        zona:'A-5', subzona:'Alcorcón' },
      { area:'Oeste Madrid',        zona:'A-5', subzona:'Móstoles' },
    ],
    'Barcelona': [
      { area:'Zona Franca / Puerto',zona:'Puerto',       subzona:'Zona Franca' },
      { area:'Zona Franca / Puerto',zona:'Puerto',       subzona:'Mercabarna' },
      { area:'Corredor Llobregat',  zona:'A-2',          subzona:'El Prat de Llobregat' },
      { area:'Corredor Llobregat',  zona:'A-2',          subzona:'Cornellà' },
      { area:'Corredor Llobregat',  zona:'A-2',          subzona:'Gavà' },
      { area:'Corredor Llobregat',  zona:'A-2',          subzona:'Castellbisbal' },
      { area:'Corredor Vallès',     zona:'A-7',          subzona:'Barberà del Vallès' },
      { area:'Corredor Vallès',     zona:'A-7',          subzona:'Mollet del Vallès' },
      { area:'Corredor Vallès',     zona:'A-7',          subzona:'Parets del Vallès' },
      { area:'Corredor Vallès',     zona:'A-7',          subzona:'Granollers' },
    ],
    'Valencia': [
      { area:'Puerto Valencia',     zona:'Zona Industrial', subzona:'Quart de Poblet' },
      { area:'Puerto Valencia',     zona:'Zona Industrial', subzona:'Riba-roja de Túria' },
      { area:'Corredor A-3',        zona:'A-3',          subzona:'Paterna' },
      { area:'Corredor A-3',        zona:'A-3',          subzona:'Torrent' },
      { area:'Corredor A-3',        zona:'A-3',          subzona:'Picassent' },
      { area:'Corredor A-7',        zona:'A-7',          subzona:'Sagunto' },
      { area:'Corredor A-7',        zona:'A-7',          subzona:'Almussafes' },
    ],
  },
  'Retail': {
    'Madrid': [
      { area:'Centro',        zona:'M-30', subzona:'Gran Vía' },
      { area:'Centro',        zona:'M-30', subzona:'Preciados / Sol' },
      { area:'Centro',        zona:'M-30', subzona:'Serrano / Salamanca' },
      { area:'Centro',        zona:'M-30', subzona:'Fuencarral' },
      { area:'Centro',        zona:'M-30', subzona:'Goya' },
      { area:'Centro',        zona:'M-30', subzona:'Orense / Azca' },
      { area:'Descentralizado',zona:'M-40', subzona:'Manoteras' },
      { area:'Descentralizado',zona:'M-40', subzona:'Las Rosas' },
      { area:'Descentralizado',zona:'M-40', subzona:'Vallecas' },
      { area:'Descentralizado',zona:'M-40', subzona:'Usera' },
      { area:'Periferia Sur', zona:'A-4', subzona:'Getafe' },
      { area:'Periferia Sur', zona:'A-4', subzona:'Leganés' },
      { area:'Periferia Sur', zona:'A-4', subzona:'Parla' },
      { area:'Periferia Norte',zona:'A-1', subzona:'Alcobendas' },
      { area:'Periferia Norte',zona:'A-1', subzona:'San Sebastián de los Reyes' },
      { area:'Periferia Oeste',zona:'A-6', subzona:'Pozuelo' },
      { area:'Periferia Oeste',zona:'A-6', subzona:'Majadahonda' },
      { area:'Periferia Oeste',zona:'A-6', subzona:'Las Rozas' },
    ],
    'Barcelona': [
      { area:'CBD',           zona:'Paseo de Gracia', subzona:'Paseo de Gracia' },
      { area:'CBD',           zona:'Paseo de Gracia', subzona:"Portal de l'Àngel" },
      { area:'CBD',           zona:'Paseo de Gracia', subzona:'Rambla Catalunya' },
      { area:'Descentralizado',zona:'Diagonal',       subzona:'Diagonal Mar' },
      { area:'Descentralizado',zona:'Diagonal',       subzona:'Les Corts' },
      { area:'Periferia',     zona:"L'Hospitalet",    subzona:"Gran Via L'Hospitalet" },
      { area:'Periferia',     zona:'Sant Cugat',      subzona:'Sant Cugat' },
    ],
    'Valencia': [
      { area:'CBD',           zona:'Centro',    subzona:'Centro / Mercado Central' },
      { area:'CBD',           zona:'Centro',    subzona:'Colón / Marqués del Turia' },
      { area:'Descentralizado',zona:'Mestalla', subzona:'Nuevo Centro' },
      { area:'Periferia',     zona:'Paterna',   subzona:'Paterna / Parque Ademuz' },
    ],
  },
  'Data Center': {
    'Madrid': [
      { area:'Corredor del Henares',zona:'A-2', subzona:'Alcalá de Henares' },
      { area:'Corredor del Henares',zona:'A-2', subzona:'Coslada' },
      { area:'Corredor del Henares',zona:'A-2', subzona:'Torrejón de Ardoz' },
      { area:'Sur Madrid',         zona:'A-4', subzona:'Getafe' },
      { area:'Sur Madrid',         zona:'A-4', subzona:'Rivas Vaciamadrid' },
      { area:'Norte Madrid',       zona:'A-1', subzona:'Tres Cantos' },
      { area:'Norte Madrid',       zona:'A-1', subzona:'Alcobendas' },
      { area:'Ciudad',             zona:'M-40', subzona:'Vallecas' },
      { area:'Ciudad',             zona:'M-40', subzona:'Hortaleza' },
    ],
    'Barcelona': [
      { area:'Zona Franca',        zona:'Puerto',   subzona:'Zona Franca' },
      { area:'Corredor Llobregat', zona:'A-2',      subzona:'El Prat de Llobregat' },
      { area:'Corredor Llobregat', zona:'A-2',      subzona:'Sant Cugat del Vallès' },
    ],
  },
  'Residencial': {
    'Madrid': [
      { area:'CBD',           zona:'M-30', subzona:'Salamanca' },
      { area:'CBD',           zona:'M-30', subzona:'Chamberí' },
      { area:'CBD',           zona:'M-30', subzona:'Chamartín' },
      { area:'CBD',           zona:'M-30', subzona:'Retiro' },
      { area:'CBD',           zona:'M-30', subzona:'Centro' },
      { area:'CBD',           zona:'M-30', subzona:'Argüelles' },
      { area:'Descentralizado',zona:'M-40', subzona:'Sanchinarro' },
      { area:'Descentralizado',zona:'M-40', subzona:'Hortaleza' },
      { area:'Descentralizado',zona:'M-40', subzona:'Valdebebas' },
      { area:'Descentralizado',zona:'M-40', subzona:'Las Tablas' },
      { area:'Descentralizado',zona:'A-1', subzona:'Alcobendas' },
      { area:'Descentralizado',zona:'A-1', subzona:'La Moraleja' },
      { area:'Descentralizado',zona:'A-2', subzona:'Arturo Soria' },
      { area:'Periferia',     zona:'A-6', subzona:'Pozuelo de Alarcón' },
      { area:'Periferia',     zona:'A-6', subzona:'Majadahonda' },
      { area:'Periferia',     zona:'A-6', subzona:'Las Rozas' },
      { area:'Periferia',     zona:'A-6', subzona:'Boadilla del Monte' },
      { area:'Periferia',     zona:'A-6', subzona:'La Finca' },
      { area:'Periferia',     zona:'A-6', subzona:'Aravaca' },
      { area:'Periferia',     zona:'A-3', subzona:'Rivas Vaciamadrid' },
      { area:'Periferia',     zona:'Sur', subzona:'Getafe' },
      { area:'Periferia',     zona:'Sur', subzona:'Leganés' },
    ],
    'Barcelona': [
      { area:'CBD',           zona:'Eixample',  subzona:'Eixample Derecho' },
      { area:'CBD',           zona:'Eixample',  subzona:'Eixample Izquierdo' },
      { area:'CBD',           zona:'Gràcia',    subzona:'Vila de Gràcia' },
      { area:'CBD',           zona:'Sarrià',    subzona:'Sarrià - Sant Gervasi' },
      { area:'Descentralizado',zona:'Poblenou', subzona:'Poblenou' },
      { area:'Descentralizado',zona:'Poblenou', subzona:'Diagonal Mar' },
      { area:'Periferia',     zona:'Sant Cugat',subzona:'Sant Cugat del Vallès' },
      { area:'Periferia',     zona:'Gavà',      subzona:'Gavà Mar' },
    ],
    'Valencia': [
      { area:'CBD',           zona:'Centro',   subzona:'Centro histórico' },
      { area:'CBD',           zona:'Ensanche', subzona:'Ensanche' },
      { area:'Descentralizado',zona:'Mestalla',subzona:'Mestalla' },
      { area:'Descentralizado',zona:'Campanar',subzona:'Campanar' },
      { area:'Periferia',     zona:'Paterna',  subzona:'Paterna' },
      { area:'Periferia',     zona:'Torrent',  subzona:'Torrent' },
    ],
  },
  'Hoteles': {
    'Madrid': [
      { area:'CBD',           zona:'M-30',    subzona:'Gran Vía' },
      { area:'CBD',           zona:'M-30',    subzona:'Castellana' },
      { area:'CBD',           zona:'M-30',    subzona:'Salamanca' },
      { area:'CBD',           zona:'M-30',    subzona:'Centro / Recoletos' },
      { area:'CBD',           zona:'M-30',    subzona:'Chamberí' },
      { area:'Aeropuerto',    zona:'Barajas', subzona:'Barajas' },
      { area:'Descentralizado',zona:'M-40',  subzona:'Campo de las Naciones / IFEMA' },
      { area:'Periferia',     zona:'A-1',     subzona:'Alcobendas' },
    ],
    'Barcelona': [
      { area:'CBD',           zona:'Ramblas',    subzona:'Las Ramblas / Gótico' },
      { area:'CBD',           zona:'Eixample',   subzona:'Eixample' },
      { area:'CBD',           zona:'Diagonal',   subzona:'Diagonal' },
      { area:'Puerto',        zona:'Barceloneta',subzona:'Barceloneta / Port Olímpic' },
      { area:'Periferia',     zona:'Aeropuerto', subzona:'El Prat' },
    ],
    'Valencia': [
      { area:'CBD',           zona:'Centro',  subzona:'Centro / Casco Antiguo' },
      { area:'CBD',           zona:'Centro',  subzona:'Ensanche' },
      { area:'Puerto',        zona:'Playa',   subzona:'La Malvarrosa / Las Arenas' },
    ],
  },
  'Suelo': {
    'Madrid': [
      { area:'Descentralizado',zona:'M-40', subzona:'Valdebebas' },
      { area:'Descentralizado',zona:'M-40', subzona:'Las Tablas' },
      { area:'Descentralizado',zona:'A-2',  subzona:'Barajas' },
      { area:'Corredor del Henares',zona:'A-2', subzona:'San Fernando de Henares' },
      { area:'Sur Madrid',    zona:'A-4',   subzona:'Getafe' },
      { area:'Sur Madrid',    zona:'A-4',   subzona:'Valdemoro' },
      { area:'Periferia',     zona:'A-6',   subzona:'Pozuelo' },
      { area:'Periferia',     zona:'A-6',   subzona:'Las Rozas' },
    ],
    'Barcelona': [
      { area:'22@',           zona:'Poblenou',  subzona:'Poblenou' },
      { area:'Periferia',     zona:'A-2',       subzona:'Gavà' },
      { area:'Periferia',     zona:'A-7',       subzona:'Granollers' },
    ],
  },
}

const CITY_NORMALIZE = {
  'Alcobendas':'Madrid','Getafe':'Madrid','Leganés':'Madrid','Alcorcón':'Madrid',
  'Coslada':'Madrid','Torrejón de Ardoz':'Madrid','Alcalá de Henares':'Madrid',
  'Tres Cantos':'Madrid','Pozuelo de Alarcón':'Madrid','Las Rozas':'Madrid',
  "L'Hospitalet de Llobregat":'Barcelona',"L'Hospitalet":'Barcelona',
  'Cornellà':'Barcelona','Cornellà de Llobregat':'Barcelona',
  'El Prat de Llobregat':'Barcelona','Sant Cugat del Vallès':'Barcelona',
  'Paterna':'Valencia','Torrent':'Valencia',
}
// Mapea el Uso principal canónico a la clave del objeto ZONES (que conserva la
// nomenclatura histórica compartida con Demanda/Oferta). Usos sin zonas propias
// caen a 'Oficinas'.
const ZONES_KEY = {
  'Oficinas':'Oficinas', 'Industrial':'Logístico', 'Logística':'Logístico',
  'Retail High Street':'Retail', 'Centro Comercial':'Retail',
  'Residencial':'Residencial', 'Build to Rent':'Residencial', 'Build to Sell':'Residencial',
  'Flex Living':'Residencial', 'Senior Living':'Residencial', 'Care Homes':'Residencial',
  'Hotel':'Hoteles', 'Apartamentos Turísticos':'Hoteles',
  'Data Center':'Data Center', 'Suelo':'Suelo',
}
function zonesKey(uso) { const n = normalizeUso(uso); return ZONES_KEY[n] || (ZONES[n] ? n : 'Oficinas') }
function getZoneData(ciudad, uso) { const c = CITY_NORMALIZE[ciudad] || ciudad; return (ZONES[zonesKey(uso)]||{})[c] || [] }
function getAreas(ciudad, uso)    { return [...new Set(getZoneData(ciudad,uso).map(z=>z.area))] }
function getZonas(ciudad, uso, area) { return [...new Set(getZoneData(ciudad,uso).filter(z=>z.area===area).map(z=>z.zona))] }
function getSubzonas(ciudad, uso, area, zona) { return getZoneData(ciudad,uso).filter(z=>z.area===area&&z.zona===zona).map(z=>z.subzona) }
/* ── Características generales (comunes a todos los usos) ── */
const CARAC_GENERALES_FIELDS = [
  { id:'altura_techo',   label:'Altura libre',    opciones:['Estándar (<2,7 m)','Normal (2,7–3 m)','Alto (>3 m)'] },
  { id:'modulacion',     label:'Modulación',      opciones:['Libre','Fija','Mixta'] },
  { id:'fachada_tipo',   label:'Fachada',         opciones:['Acristalada','Mixta','Opaca','Prefabricado','Ladrillo'] },
  { id:'cubierta',       label:'Cubierta',        opciones:['Plana transitable','Plana no transitable','Inclinada','Sandwich'] },
  { id:'escaleras',      label:'Escaleras',       opciones:['Sí','No'] },
  { id:'accesibilidad',  label:'Accesibilidad',   opciones:['Adaptado PMR','Parcialmente adaptado','No adaptado'] },
]

/* ── Características técnicas por uso ── */
const CARAC_USO_FIELDS = {
  'Oficinas': [
    { id:'iluminacion',    label:'Iluminación',              opciones:['LED','Fluorescentes','Sin iluminación'] },
    { id:'suelo',          label:'Suelo',                    opciones:['Suelo técnico','Sin suelo técnico'] },
    { id:'climatizacion',  label:'Climatización',            opciones:['Fan coils','VRV / VRF','Centralizada','Sin climatización'] },
    { id:'techo',          label:'Techo',                    opciones:['Falso techo','Forjado visto','Sin falso techo'] },
    { id:'implantada',     label:'Oficina implantada',       opciones:['Sí','No','Parcialmente implantada'] },
    { id:'estado_impl',    label:'Estado de implantación',   opciones:['Implantada','En bruto','Reformada','A reformar'] },
    { id:'cert_sost',      label:'Certificación sostenible', opciones:['LEED','BREEAM','WELL','Sin certificación'] },
    { id:'comunicaciones', label:'Comunicaciones',           opciones:['Fibra óptica','Cableado perimetral','Cableado por suelo técnico','Sin infraestructura visible'] },
    { id:'seguridad',      label:'Seguridad',                opciones:['Control de accesos','CCTV','Seguridad 24 h','Sin sistema específico'] },
    { id:'ascensores',     label:'Ascensores',               opciones:['Sí','No'] },
    { id:'montacargas',    label:'Montacargas',              opciones:['Sí','No'] },
  ],
  'Logística': [
    { id:'iluminacion',     label:'Iluminación',            opciones:['LED','Fluorescentes','Natural','Sin iluminación'] },
    { id:'tipo_nave',       label:'Tipo de nave',           opciones:['Logística','Industrial','Cross-dock','Última milla'] },
    { id:'muelles',         label:'Muelles de carga',       opciones:['Sí','No'] },
    { id:'rampas',          label:'Rampas',                 opciones:['Sí','No'] },
    { id:'altura_libre',    label:'Altura libre',           opciones:['< 7 m','7–10 m','> 10 m'] },
    { id:'riesgo_incend',   label:'Riesgo contra incendios',opciones:['Medio','Alto','No definido'] },
    { id:'pci',             label:'Sistema PCI',            opciones:['Sprinklers','BIES','Detección automática','Sin sistema específico'] },
    { id:'solera',          label:'Solera',                 opciones:['Hormigón pulido','Alta resistencia','Estándar'] },
    { id:'potencia',        label:'Potencia eléctrica',     opciones:['Baja','Media','Alta'] },
    { id:'oficinas_anexas', label:'Oficinas anexas',        opciones:['Sí','No'] },
    { id:'patio_maniobra',  label:'Patio de maniobra',      opciones:['Sí','No'] },
  ],
  'Retail High Street': [
    { id:'iluminacion',    label:'Iluminación',             opciones:['LED','Fluorescentes','Sin iluminación'] },
    { id:'estado',         label:'Estado del local',        opciones:['Implantado','En bruto','Reformado','A reformar'] },
    { id:'fachada',        label:'Fachada',                 opciones:['Amplia','Estándar','Escasa'] },
    { id:'humos',          label:'Salida de humos',         opciones:['Sí','No'] },
    { id:'climatizacion',  label:'Climatización',           opciones:['Sí','No'] },
    { id:'almacen',        label:'Almacén',                 opciones:['Sí','No'] },
    { id:'aseos',          label:'Aseos',                   opciones:['Sí','No'] },
    { id:'acceso_calle',   label:'Acceso desde calle',      opciones:['Sí','No'] },
    { id:'esquina',        label:'Esquina',                 opciones:['Sí','No'] },
    { id:'terraza',        label:'Terraza',                 opciones:['Sí','No'] },
  ],
  'Centro Comercial': [
    { id:'iluminacion',    label:'Iluminación',             opciones:['LED','Fluorescentes','Sin iluminación'] },
    { id:'tipo_unidad',    label:'Tipo de unidad',          opciones:['Local','Isla / kiosco','Restaurante','Ocio'] },
    { id:'estado',         label:'Estado',                  opciones:['Implantado','En bruto','Reformado'] },
    { id:'humos',          label:'Salida de humos',         opciones:['Sí','No'] },
    { id:'almacen',        label:'Almacén',                 opciones:['Sí','No'] },
    { id:'terraza',        label:'Terraza',                 opciones:['Sí','No'] },
    { id:'visibilidad',    label:'Visibilidad interior',    opciones:['Alta','Media','Baja'] },
    { id:'carga_descarga', label:'Acceso carga y descarga', opciones:['Sí','No'] },
  ],
  'Residencial': [
    { id:'iluminacion',    label:'Iluminación',             opciones:['LED','Fluorescentes','Sin iluminación'] },
    { id:'estado',         label:'Estado',                  opciones:['Nuevo','Reformado','A reformar','En construcción'] },
    { id:'cocina',         label:'Cocina',                  opciones:['Equipada','Sin equipar','Parcialmente equipada'] },
    { id:'amueblado',      label:'Amueblado',               opciones:['Sí','No','Parcialmente'] },
    { id:'climatizacion',  label:'Climatización',           opciones:['Sí','No'] },
    { id:'calefaccion',    label:'Calefacción',             opciones:['Individual','Central','Sin calefacción'] },
    { id:'terraza',        label:'Terraza',                 opciones:['Sí','No'] },
    { id:'trastero',       label:'Trastero',                opciones:['Sí','No'] },
    { id:'garaje',         label:'Garaje',                  opciones:['Sí','No'] },
    { id:'ascensor',       label:'Ascensor',                opciones:['Sí','No'] },
  ],
  'Hotel': [
    { id:'iluminacion',    label:'Iluminación',             opciones:['LED','Fluorescentes','Sin iluminación'] },
    { id:'categoria',      label:'Categoría',               opciones:['1 estrella','2 estrellas','3 estrellas','4 estrellas','5 estrellas'] },
    { id:'estado',         label:'Estado',                  opciones:['Operativo','Reformado','A reformar'] },
    { id:'cocina',         label:'Cocina',                  opciones:['Sí','No'] },
    { id:'restaurante',    label:'Restaurante',             opciones:['Sí','No'] },
    { id:'salas_reunion',  label:'Salas de reuniones',      opciones:['Sí','No'] },
    { id:'spa',            label:'Spa / gimnasio',          opciones:['Sí','No'] },
    { id:'climatizacion',  label:'Climatización',           opciones:['Sí','No'] },
    { id:'lavanderia',     label:'Lavandería',              opciones:['Sí','No'] },
  ],
  'Suelo': [
    { id:'clasificacion',  label:'Clasificación del suelo', opciones:['Urbano','Urbanizable','Rústico'] },
    { id:'estado_urb',     label:'Estado urbanístico',      opciones:['Finalista','En desarrollo','Pendiente de gestión'] },
    { id:'uso_admisible',  label:'Uso admisible',           opciones:['Residencial','Industrial','Logístico','Terciario','Mixto'] },
    { id:'topografia',     label:'Topografía',              opciones:['Llano','Con pendiente','Irregular'] },
    { id:'accesos',        label:'Accesos',                 opciones:['Buen acceso','Acceso medio','Acceso limitado'] },
    { id:'suministros',    label:'Suministros',             opciones:['Disponibles','Parciales','No disponibles'] },
    { id:'vallado',        label:'Vallado',                 opciones:['Sí','No'] },
  ],
  'Data Center': [
    { id:'redundancia',    label:'Redundancia',             opciones:['Tier I','Tier II','Tier III','Tier IV'] },
    { id:'potencia',       label:'Potencia eléctrica',      opciones:['Baja','Media','Alta','Muy alta'] },
    { id:'refrigeracion',  label:'Refrigeración',           opciones:['Aire forzado','Líquida','Mixta'] },
    { id:'seguridad',      label:'Seguridad física',        opciones:['Control biométrico','Control de accesos','CCTV 24 h','Sin sistema'] },
    { id:'conectividad',   label:'Conectividad',            opciones:['Fibra oscura','Multi-carrier','Carrier único'] },
    { id:'ups',            label:'UPS / Generadores',       opciones:['Sí','No'] },
  ],
}

const MEDIOS_TRANSPORTE = ['Metro','Autobús','Cercanías','Tren','Tranvía','BiciMAD / Bici pública','Coche','Taxi / VTC','Aeropuerto']
export const ESTADOS_CONSTRUCCION = ['Cambio de uso en trámite','Construcción existente','En construcción','En demolición','En rehabilitación','LC + ICO obtenidos','LC + ICO solicitados','Licencia de construcción','Licencia primera ocupación','Llave en mano','Nueva construcción / Obra nueva','Proyecto','Rehabilitación integral','Rehabilitación parcial']
// USOS_PRINCIPALES y la lógica de Calidad/Superficies viven en ../lib/usoConfig

// Tipo de hotel — solo aplica cuando Uso principal === 'Hotel' (se guarda en metricas)
const TIPOS_HOTEL = ['Boutique','Luxury','Lifestyle','Business','Urban','Resort','Aparthotel','Serviced Apartments','Extended Stay','Budget / Economy','Wellness & Spa','Convention / MICE','Heritage','Rural','Airport','Golf Resort','Beach Resort','Ski Resort']

const NEW_FORM_INIT = {
  nombre:'', direccion:'', ciudad:'Madrid', provincia:'', municipio:'', pais:'España', cp:'', coordenadas:'',
  area:'', zona:'', subzona:'',
  tipo_activo:'Edificio', estado_construccion:'',
  uso:'', uso_secundario:'', calidad:'', tipo_hotel:'',
  propietario:'', asset_manager:'',
  sba:'', sup_planta_tipo:'', ratio_perdida:'',
  anno_construccion:'', anno_rehabilitacion:'',
  ref_catastral:'', clasificacion:'', uso_pgou:'', calificacion_urb:'', edificabilidad:'', sup_parcela:'',
}

// Tab structure consolidada (mayo 2026):
// - "Información adicional" disuelta dentro de Información general.
// - "Follow-up" eliminada → audit badge en el header.
// - Multimedia + Documentos fusionados en una pestaña.
// - Confidencialidad añadida (formato canónico Oferta).
// - Características pasa al puesto 2 (antes que Stacking, regla de spec).
// - Ofertas eliminada como pestaña: las ofertas vinculadas viven en Vista 360
//   junto al resto de actividad comercial histórica.
// - Principales competidores: lista curada por el usuario, alimenta los
//   Informes de gestión (otros activos considerados como competidores).
// 7 tabs canónicos · spec mayo 2026. "Propietarios y arrendatarios" se
// absorbió como sub-bloques plegables debajo del Stacking Plan.
const TABS = ['at-info','at-comp','at-caract','at-stacking','at-mediadocs','at-360','at-conf']
const TAB_LABELS = ['Información general','Principales competidores','Características','Stacking Plan','Multimedia & Documentos','Vista 360','Confidencialidad']

/* ── PLAZAS DE APARCAMIENTO ── */
const UBICACIONES  = ['Interior','Exterior']
const TIPOS_PLAZA  = ['Simple','Doble']
const TIPOS_VEHICULO = ['Coches','Motocicletas','Patinetes','Bicicletas','Camiones','Vans']
const INIT_PLAZAS = [
  {id:1, ubicacion:'Interior', tipo:'Simple', vehiculo:'Coches',      cantidad:578},
  {id:2, ubicacion:'Interior', tipo:'Doble',  vehiculo:'Coches',      cantidad:100},
  {id:3, ubicacion:'Interior', tipo:'Simple', vehiculo:'Motocicletas', cantidad:52},
  {id:4, ubicacion:'Exterior', tipo:'Simple', vehiculo:'Coches',      cantidad:48},
]

/* ── USOS PRINCIPALES ── */
const USOS_PPAL = [
  {id:'oficinas',    label:'Oficinas',    cls:'u-of',  color:'#B08D57', bg:'#f5efe5', bd:'#93c5fd'},
  {id:'retail',      label:'Retail',      cls:'u-rt',  color:'#ec4899', bg:'#fce7f3', bd:'#fbcfe8'},
  {id:'logistico',   label:'Logístico',   cls:'u-log', color:'#f97316', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'residencial', label:'Residencial', cls:'u-res', color:'#8b5cf6', bg:'#ede9fe', bd:'#c4b5fd'},
  {id:'hotel',       label:'Hotel',       cls:'u-hot', color:'#14b8a6', bg:'#ccfbf1', bd:'#99f6e4'},
  {id:'comun',       label:'Zona común',  cls:'u-com', color:'#22c55e', bg:'#dcfce7', bd:'#86efac'},
  {id:'parking',     label:'Parking',     cls:'u-pk',  color:'#94a3b8', bg:'#f1f5f9', bd:'#cbd5e1'},
]

/* ── USOS ADICIONALES ── */
const UA_ALL = [
  {id:'recepcion',      label:'Recepción',          attr:true, color:'#6b5b8e', bg:'#ede9fe', bd:'#c4b5fd'},
  {id:'nucleo_com',     label:'Núcleos comunic.',   attr:true, color:'#6366f1', bg:'#e0e7ff', bd:'#a5b4fc'},
  {id:'instalaciones',  label:'Instalaciones',      attr:true, color:'#64748b', bg:'#f1f5f9', bd:'#cbd5e1'},
  {id:'seguridad',      label:'Seguridad 24h',      attr:true, color:'#dc2626', bg:'#fee2e2', bd:'#fca5a5'},
  {id:'ct',             label:'C. Transformación',  attr:true, color:'#9ca3af', bg:'#f9fafb', bd:'#e5e7eb'},
  {id:'parking_gen',    label:'Parking',             sup:true,  color:'#475569', bg:'#f1f5f9', bd:'#94a3b8'},
  {id:'trasteros',      label:'Trasteros',           sup:true,  color:'#78716c', bg:'#fafaf9', bd:'#d6d3d1'},
  {id:'archivo',        label:'Archivo / Almacén',  sup:true,  color:'#92400e', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'vestuarios',     label:'Vestuarios',          sup:true,  color:'#9d174d', bg:'#fdf2f8', bd:'#f9a8d4'},
  {id:'comedor',        label:'Comedor',             sup:true,  color:'#d97706', bg:'#fffbeb', bd:'#fde68a'},
  {id:'auditorio',      label:'Auditorio',           sup:true,  color:'#6b5b8e', bg:'#ede9fe', bd:'#c4b5fd'},
  {id:'salas_reunion',  label:'Salas reuniones',     sup:true,  color:'#0284c7', bg:'#e0f2fe', bd:'#7dd3fc'},
  {id:'gimnasio',       label:'Gimnasio',            sup:true,  color:'#059669', bg:'#ecfdf5', bd:'#6ee7b7'},
  {id:'terraza',        label:'Terraza / Jardín',    sup:true,  color:'#65a30d', bg:'#f7fee7', bd:'#bef264'},
  {id:'rooftop',        label:'Rooftop',             attr:true, color:'#0d9488', bg:'#f0fdfa', bd:'#99f6e4'},
  {id:'piscina',        label:'Piscina',             sup:true,  color:'#0891b2', bg:'#ecfeff', bd:'#67e8f9'},
  {id:'playa_maniobras',label:'Playa maniobras',     sup:true,  color:'#c2410c', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'muelles_carga',  label:'Muelles de carga',    sup:true,  color:'#b45309', bg:'#fefce8', bd:'#fde68a'},
  {id:'cross_docking',  label:'Cross-docking',       sup:true,  color:'#7c2d12', bg:'#fff1f2', bd:'#fecdd3'},
  {id:'camaras_frigo',  label:'Cámaras frigoríficas',sup:true,  color:'#6f5734', bg:'#faf5ec', bd:'#ece0c9'},
  {id:'pk_camiones',    label:'Parking camiones',    sup:true,  color:'#374151', bg:'#f9fafb', bd:'#e5e7eb'},
  {id:'lobby',          label:'Lobby hotel',         sup:true,  color:'#b45309', bg:'#fffbeb', bd:'#fde68a'},
  {id:'spa',            label:'Spa / Wellness',      sup:true,  color:'#be185d', bg:'#fdf2f8', bd:'#fbcfe8'},
  {id:'salas_eventos',  label:'Salas de eventos',    sup:true,  color:'#4d4068', bg:'#f5f3ff', bd:'#ddd6fe'},
  {id:'restaurante',    label:'Restaurante',         sup:true,  color:'#c2410c', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'salon_comun',    label:'Salón comunidad',     sup:true,  color:'#047857', bg:'#ecfdf5', bd:'#a7f3d0'},
]
const UA_BY_USO = {
  oficinas:    ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','archivo','vestuarios','comedor','auditorio','salas_reunion','gimnasio','terraza','rooftop'],
  retail:      ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','vestuarios'],
  logistico:   ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','archivo','vestuarios','comedor','playa_maniobras','muelles_carga','cross_docking','camaras_frigo','pk_camiones'],
  residencial: ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','vestuarios','comedor','gimnasio','terraza','rooftop','piscina','salon_comun'],
  hotel:       ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','vestuarios','comedor','gimnasio','terraza','rooftop','piscina','lobby','spa','salas_eventos','restaurante'],
  comun:       ['recepcion','nucleo_com','instalaciones','seguridad','ct'],
  parking:     ['nucleo_com','instalaciones','seguridad','ct'],
}

const GRID = '64px 1fr 100px 60px 80px'

const INIT_BUILDINGS = [
  {
    id:'A', label:'P.E Avalon — Edif. A', supPlantaTipo:1500,
    floors:[
      {id:'P5',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'P4',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'P3',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'P2',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'P1',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'PB',sup:1500,principal:[{uso:'retail',sup:380},{uso:'comun',sup:1120}],adicional:[]},
      {id:'S1',sup:1500,principal:[{uso:'parking',sup:1500}],adicional:[{uso:'parking_gen',label:'Parking · 778 plazas',sup:1500,attr:false}]},
      {id:'S2',sup:1500,principal:[{uso:'parking',sup:1500}],adicional:[{uso:'parking_gen',label:'Parking · 52 plazas',sup:1500,attr:false}]},
    ],
    prop:[
      {p:'P5',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'P4',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'P3',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'P2',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'P1',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'PB',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'S1',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'S2',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
    ],
    arr:[
      {p:'P5',sup:1500,units:[{type:'ten',n:'Celonis',sup:1202,brk:'Oct 2025',brkColor:'var(--amber)'},{type:'vac',oferta:null,sup:298}]},
      {p:'P4',sup:1500,units:[{type:'ten',n:'Celonis',sup:1500,brk:'Oct 2025',brkColor:'var(--amber)'}]},
      {p:'P3',sup:1500,units:[{type:'ten',n:'Repsol',sup:767,brk:'Jun 2027',brkColor:'var(--green)'},{type:'vac',oferta:null,sup:733}]},
      {p:'P2',sup:1500,units:[{type:'ten',n:'Repsol',sup:1200,brk:'Jun 2027',brkColor:'var(--green)'},{type:'vac',oferta:null,sup:300}]},
      {p:'P1',sup:1500,units:[{type:'ten',n:'Desconocido',sup:1500,brk:'Ene 2026',brkColor:'var(--red)'}]},
      {p:'PB',sup:1500,units:[{type:'rt',n:'Cafetería',sup:380,brk:'Ene 2029',brkColor:'var(--text4)'},{type:'com',n:'Hall / Común',sup:220},{type:'vac',oferta:null,sup:900}]},
      {p:'S1',sup:1500,units:[{type:'pk',n:'Parking · 778 plazas',sup:1500,nota:'Nivel -1'}]},
      {p:'S2',sup:1500,units:[{type:'pk',n:'Parking · 52 plazas',sup:1500,nota:'Nivel -2'}]},
    ],
  },
  {
    id:'B', label:'Edif. B', supPlantaTipo:1500,
    floors:[
      {id:'P5',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'P4',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'PB',sup:1500,principal:[{uso:'comun',sup:250},{uso:'oficinas',sup:1250}],adicional:[]},
    ],
    prop:[
      {p:'P5',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'P4',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'PB',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
    ],
    arr:[
      {p:'P5',sup:1500,units:[{type:'ten',n:'Oficinas',sup:1500,brk:null}]},
      {p:'P4',sup:1500,units:[{type:'ten',n:'Celonis',sup:1300,brk:'Oct 2025',brkColor:'var(--amber)'},{type:'vac',oferta:null,sup:200}]},
      {p:'PB',sup:1500,units:[{type:'com',n:'Cafetería',sup:250},{type:'vac',oferta:null,sup:1250}]},
    ],
  },
  {
    id:'C', label:'Edif. C', supPlantaTipo:1967,
    floors:[
      {id:'P4',sup:1967,principal:[{uso:'oficinas',sup:1967}],adicional:[]},
      {id:'PB',sup:1967,principal:[{uso:'oficinas',sup:1967}],adicional:[]},
    ],
    prop:[
      {p:'P4',sup:1967,units:[{n:'Barings Core Spain SOCIMI',sup:1967}]},
      {p:'PB',sup:1967,units:[{n:'Barings Core Spain SOCIMI',sup:1967}]},
    ],
    arr:[
      {p:'P4',sup:1967,units:[{type:'ten',n:'Repsol',sup:1967,brk:'Jun 2027',brkColor:'var(--green)'}]},
      {p:'PB',sup:1967,units:[{type:'vac',oferta:null,sup:1967}]},
    ],
  },
  {
    id:'D', label:'Edif. D', supPlantaTipo:2000,
    floors:[
      {id:'P3',sup:2000,principal:[{uso:'oficinas',sup:2000}],adicional:[]},
      {id:'PB',sup:2000,principal:[{uso:'oficinas',sup:2000}],adicional:[]},
    ],
    prop:[
      {p:'P3',sup:2000,units:[{n:'Barings Core Spain SOCIMI',sup:2000}]},
      {p:'PB',sup:2000,units:[{n:'Barings Core Spain SOCIMI',sup:2000}]},
    ],
    arr:[
      {p:'P3',sup:2000,units:[{type:'ten',n:'Oficinas',sup:2000,brk:null}]},
      {p:'PB',sup:2000,units:[{type:'vac',oferta:null,sup:2000}]},
    ],
  },
]


// Sección del sidebar lateral del StackingPlan. Patrón único compartido por
// las 3 capas (Principal, Propietarios, Arrendatarios). Cabecera clicable +
// badge con contador + opcional botón de acción. Cuando el sidebar está
// plegado (sidebarCollapsed=true), muestra solo el dot como icono.
function SidebarSection({ label, count, open, onToggle, collapsed, dot, actionLabel, onAction, children }) {
  if (collapsed) {
    return (
      <div
        className="sp-sidebar-rail-item"
        onClick={onToggle}
        title={`${label} (${count})`}
        role="button"
      >
        <span className="sp-sidebar-rail-dot" style={{background:dot || 'var(--accent)'}}/>
        <span className="sp-sidebar-rail-count">{count}</span>
      </div>
    )
  }
  return (
    <div className="sp-sidebar-section">
      <div className="sp-sidebar-section-head">
        <button
          type="button"
          className="sp-sidebar-section-toggle"
          onClick={onToggle}
          aria-expanded={open}
        >
          <span style={{display:'inline-block',transition:'transform .2s',transform:open?'rotate(0deg)':'rotate(-90deg)',width:10,textAlign:'center'}}>▾</span>
          <span className="sp-sidebar-section-dot" style={{background:dot || 'var(--accent)'}}/>
          <span className="sp-sidebar-section-label">{label}</span>
          <span className="sp-sidebar-section-count">{count}</span>
        </button>
        {actionLabel && onAction && (
          <button type="button" className="sp-sidebar-section-action" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
      {open && (
        <div className="sp-sidebar-section-body">
          {children}
        </div>
      )}
    </div>
  )
}

// Exportado para que FichaOferta consuma EXACTAMENTE el mismo componente.
// La regla del usuario: el Stacking Plan debe ser un único componente reutilizable,
// no varios componentes replicados. (Ver memoria project_stacking_compartido.md)
export function StackingPlan({ initBuildings, onCountChange, onOwnersChange, onBuildingsChange, activoPropietario='', activoRef='', activoNombre='', extraOwners=[], extraTenants=[], onAddOwner, onAddTenant, onConvertToTenant, onRemoveTenant, onRemoveOwner, onRemoveOferta, onTenantClick, extraOfertas=[], initView='principal', defaultLabel='', defaultSupPlantaTipo, allowCreate=true, noDataMessage=null }) {
  const { navigate: spNavigate } = useNav()
  const [buildings, setBuildings]       = useState(initBuildings !== undefined ? initBuildings : INIT_BUILDINGS)
  const [edifId, setEdifId]             = useState(initBuildings?.length > 0 ? initBuildings[0].id : 'A')
  const [setupForm, setSetupForm]       = useState({ label: defaultLabel || '', sobre:'5', bajo:'1', sup: defaultSupPlantaTipo ? String(defaultSupPlantaTipo) : '1500' })
  const defaultLabelRef = useRef(defaultLabel)
  defaultLabelRef.current = defaultLabel
  useEffect(() => {
    if (defaultLabel && !setupForm.label) setSetupForm(p => ({ ...p, label: defaultLabel }))
  }, [defaultLabel])
  const [view, setView]                 = useState(initView)
  const [expanded, setExpanded]         = useState(false)
  const [dragging, setDragging]         = useState(null)
  // Hover sobre un chip del sidebar → resalta las units del grid que le
  // corresponden. Convención de claves:
  //   · 'uso:<usoId>'      para chips de Usos principales / adicionales
  //   · 'owner:<id|name>'  para propietarios
  //   · 'ten:<ref|name>'   para arrendatarios
  //   · 'ofr:<nombre>'     para ofertas
  const [hoverKey, setHoverKey]         = useState(null)
  const [dragTarget, setDragTarget]     = useState(null)
  const [editFloor, setEditFloor]       = useState(null) // {floorId, idx, layer}
  const [editSup, setEditSup]           = useState('')
  const [selectedFloors, setSelectedFloors] = useState([])
  const [showCreate, setShowCreate]     = useState(false)
  const [newBldg, setNewBldg]           = useState({label:'',sup:'',sobre:'',bajo:''})
  const [splitModal, setSplitModal]     = useState(null) // {floorId, usoId}
  const [splitSup, setSplitSup]         = useState('')
  // Secciones del panel abiertas por defecto: las fuentes de arrastre tienen
  // que verse nada más entrar (si no, el panel parece vacío y no se entiende).
  const [ppOpen, setPpOpen]             = useState(true)
  const [uaOpen, setUaOpen]             = useState(true)
  // Toggles para los sidebars de las vistas 'prop' y 'arr'.
  const [propPanelOpen, setPropPanelOpen]     = useState(true)
  const [tenPanelOpen, setTenPanelOpen]       = useState(true)
  const [ofrPanelOpen, setOfrPanelOpen]       = useState(true)
  // Sidebar lateral: 300px desplegado / 60px plegado (icon-rail).
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editPA, setEditPA]             = useState(null)  // {layer:'prop'|'arr', rowP, idx}
  const [editPASup, setEditPASup]       = useState('')
  const [editPARenta, setEditPARenta]   = useState('')
  const [editPATotal, setEditPATotal]   = useState('')
  const [editFloorSup, setEditFloorSup]       = useState(null) // floorId — editable only from principal view
  const [editFloorSupVal, setEditFloorSupVal] = useState('')
  const [supLockWarn, setSupLockWarn]         = useState(null) // {floorId, vars:[]} — superficie bloqueada por asignaciones
  const [hoveredIns, setHoveredIns]           = useState(null)
  const [dropWarning, setDropWarning]         = useState(null) // floorId con aviso activo

  // Notify parent when building count changes
  useEffect(() => { if (onCountChange) onCountChange(buildings.length) }, [buildings.length])
  useEffect(() => {
    if (!onOwnersChange) return
    const names = new Set(buildings.flatMap(b=>(b.prop||[]).flatMap(r=>r.units.map(u=>u.n))))
    onOwnersChange(names.size)
  }, [buildings])
  useEffect(() => { if (onBuildingsChange) onBuildingsChange(buildings) }, [buildings])
  useEffect(() => {
    if (initBuildings?.length > 0 && buildings.length === 0) {
      setBuildings(initBuildings)
      setEdifId(initBuildings[0].id)
    }
  }, [initBuildings])

  const edif = buildings.find(b=>b.id===edifId) || buildings[0] || { id:'', label:'', floors:[], prop:[], arr:[], supPlantaTipo:0 }
  const usoInfo  = (id) => USOS_PPAL.find(u=>u.id===id) || UA_ALL.find(u=>u.id===id) || {label:id,color:'#94a3b8',bg:'#f1f5f9',bd:'#cbd5e1'}
  const uaInfo   = (id) => UA_ALL.find(u=>u.id===id)   || {label:id,color:'#64748b',bg:'#f1f5f9',bd:'#cbd5e1',attr:false}

  /* ── Stats derivados ── */
  const totalSup    = edif.floors.reduce((s,f)=>s+f.sup,0)
  const assignedSup = edif.floors.reduce((s,f)=>s+f.principal.reduce((ss,u)=>ss+u.sup,0),0)
  const occPct      = totalSup>0 ? Math.round(assignedSup/totalSup*100) : 0

  /* ── Usos adicionales disponibles (filtrados por uso principal del edificio) ── */
  const primaryUsos   = [...new Set(edif.floors.flatMap(f=>f.principal.map(p=>p.uso)))]
  const availableUA   = UA_ALL.filter(ua=>primaryUsos.some(u=>(UA_BY_USO[u]||[]).includes(ua.id)))

  /* ── Mutaciones ── */
  const updBuilding = (fn) => setBuildings(prev=>prev.map(b=>b.id===edifId?fn(b):b))

  const assignPrincipal = (floorId, usoId, supVal) => {
    if(blockIfAssigned(floorId)) return
    updBuilding(b=>({...b, floors:b.floors.map(f=>{
      if(f.id!==floorId) return f
      const used = f.principal.reduce((s,u)=>s+u.sup,0)
      const avail = f.sup-used
      if(avail<=0) return f
      const sup = Math.min(supVal||avail, avail)
      return {...f, principal:[...f.principal,{uso:usoId,sup}]}
    })}))
  }

  const assignAdicional = (floorId, usoId) => {
    const ua = UA_ALL.find(u=>u.id===usoId)
    if(!ua) return
    updBuilding(b=>({...b, floors:b.floors.map(f=>{
      if(f.id!==floorId) return f
      if(f.adicional.find(a=>a.uso===usoId)) return f
      return {...f, adicional:[...f.adicional,{uso:usoId,label:ua.label,sup:ua.sup?100:0,attr:ua.attr||false}]}
    })}))
  }

  const removeItem = (floorId, idx, layer) => {
    // Quitar un tramo de Uso principal reescribe los muros heredados → bloqueado
    // si hay asignaciones. Los usos adicionales (atributos) sí se pueden quitar.
    if(layer==='principal' && blockIfAssigned(floorId)) return
    updBuilding(b=>({...b, floors:b.floors.map(f=>{
      if(f.id!==floorId) return f
      const arr=[...f[layer]]; arr.splice(idx,1)
      return {...f,[layer]:arr}
    })}))
  }

  // ── Tramos (Model A, confirmado 2026-06-02) ──────────────────────────
  // Los tramos de una planta = sus segmentos de 'Uso principal' (uso + m²).
  // Cada tramo es la frontera de UN propietario; los m² del tramo solo se
  // editan en Uso principal — las capas prop/arr los heredan.
  // slotsFor() reconcilia las units (de prop o arr) contra los tramos:
  //   · Si ya llevan `seg` (índice de tramo), se respeta.
  //   · Legacy (sin seg): se alinea por m² acumulados — un owner que cubre
  //     toda la planta ocupa todos sus tramos. Devuelve un array alineado a
  //     los tramos (slot[i] = unit del tramo i, o null si está libre).
  const slotsFor = (tramos, units) => {
    const slots = (tramos || []).map(() => null)
    const us = units || []
    if (us.some(u => Number.isInteger(u.seg))) {
      for (const u of us) if (Number.isInteger(u.seg) && u.seg < slots.length) slots[u.seg] = u
      return slots
    }
    let ui = 0, rem = us[0]?.sup ?? 0
    for (let i = 0; i < slots.length; i++) {
      while (ui < us.length && rem <= 0) { ui++; rem = us[ui]?.sup ?? 0 }
      if (ui < us.length) { slots[i] = us[ui]; rem -= (tramos[i].sup || 0) }
    }
    return slots
  }

  // Asigna un propietario a un tramo (segIdx). Si segIdx es null, va al primer
  // tramo libre. Normaliza toda la fila a units seg-tagged con sup = tramo.
  const assignOwner = (floorId, segIdx, owner) => updBuilding(b => {
    const f = b.floors.find(fl => fl.id === floorId)
    if (!f) return b
    const tramos = f.principal || []
    if (tramos.length === 0) return b
    const prop = [...(b.prop || [])]
    const ri = prop.findIndex(r => r.p === floorId)
    const slots = slotsFor(tramos, ri >= 0 ? prop[ri].units : [])
    let seg = segIdx
    if (seg == null || seg < 0 || seg >= tramos.length) seg = slots.findIndex(s => !s)
    if (seg < 0) return b
    slots[seg] = { prop_id: owner.id || null, n: owner.name }
    const units = slots.map((s, i) => s ? { prop_id: s.prop_id || null, n: s.n, seg: i, sup: tramos[i].sup } : null).filter(Boolean)
    const row = { p: floorId, sup: f.sup, units }
    if (ri >= 0) prop[ri] = row; else prop.push(row)
    return { ...b, prop }
  })

  const removeOwnerTramo = (floorId, seg) => {
    const bldNow = buildings.find(b => b.id === edifId)
    const floor   = bldNow?.floors?.find(f => f.id === floorId)
    const propRow = bldNow?.prop?.find(r => r.p === floorId)
    const unit = slotsFor(floor?.principal || [], propRow?.units)[seg]
    if (!unit) return

    // Baja de propietario = VENTA con SUSTITUCIÓN (opción A): lo vendido NO se
    // borra, pasa a «Propietario desconocido» (la superficie no queda huérfana)
    // y el comprador real se completa luego desde el panel. Al ser venta, los
    // arrendatarios/ofertas que haya encima se traspasan al comprador → no se
    // bloquea por ocupación (eso solo aplica a cambios de Uso principal).
    // Por identidad: prop_id (o nombre si es legacy) → afecta a todas sus plantas.
    const ownerId = unit.prop_id || null
    const ownerName = unit.n
    const matchesOwner = (u) => (ownerId && u.prop_id) ? u.prop_id === ownerId : u.n === ownerName

    // Nº de plantas que ocupa + superficies (para alcance y para registrar la venta).
    let footprintCount = 0, ownerSupTotal = 0
    for (const b of buildings) for (const row of (b.prop || [])) {
      if (!(row.units || []).some(matchesOwner)) continue
      footprintCount++
      for (const u of row.units) if (matchesOwner(u)) ownerSupTotal += Number(u.sup) || 0
    }
    const tramoSup = Number(unit.sup) || Number(floor?.principal?.[seg]?.sup) || 0

    // Sustituye las units del vendedor por la identidad «Propietario desconocido»
    // (con su id y nombre propios → registro y color distintos por cada baja).
    const doSubstitute = (scope, descId, descName) => setBuildings(prev => prev.map(b => {
      if (scope === 'one' && b.id !== edifId) return b
      return {
        ...b,
        prop: (b.prop || []).map(row => {
          if (scope === 'one' && row.p !== floorId) return row
          return { ...row, units: (row.units || []).map(u => matchesOwner(u) ? { ...u, n: descName || 'Propietario desconocido', prop_id: descId || null } : u) }
        }),
      }
    }))

    // Si el padre maneja la baja (abre el modal de venta), delegamos.
    if (typeof onRemoveOwner === 'function') {
      onRemoveOwner({ unit, floorId, edifId, idx: seg, footprintCount, ownerSupTotal, tramoSup, doSubstitute })
      return
    }
    doSubstitute('all')
  }
  // arrSlotsFor: reconcilia las units de arrendatario/oferta contra los tramos.
  // A diferencia de prop, un tramo puede tener VARIOS ocupantes (el espacio del
  // propietario se reparte entre 1+ arrendatarios/ofertas). Devuelve un array
  // alineado a los tramos: slot[i] = lista de units en el tramo i.
  //   · Si las units llevan `seg`, se respeta.
  //   · Legacy (sin seg): se reparten por m² acumulados (cada unit cae en el
  //     tramo donde empieza su offset).
  const arrSlotsFor = (tramos, units) => {
    const slots = (tramos || []).map(() => [])
    // Las units 'vac' SIN oferta son espacio vacío (marcadores de hueco), no
    // ocupantes: se ignoran para que el tramo quede libre y se pueda asignar.
    // Si no, el render (que ya las filtra) y assignTenant divergían y el drop
    // fallaba en silencio en plantas que parecían vacías.
    const us = (units || []).filter(u => !(u.type === 'vac' && !u.oferta))
    if (us.some(u => Number.isInteger(u.seg))) {
      for (const u of us) { const s = Number.isInteger(u.seg) ? u.seg : 0; if (s < slots.length) slots[s].push(u) }
      return slots
    }
    const bounds = []; let acc = 0
    for (const t of tramos) { acc += (t.sup || 0); bounds.push(acc) }
    let offset = 0
    for (const u of us) {
      let seg = bounds.findIndex(b => offset < b)
      if (seg < 0) seg = slots.length - 1
      if (seg >= 0) slots[seg].push(u)
      offset += (u.sup || 0)
    }
    return slots
  }

  // Añade un ocupante (arrendatario u oferta) a un tramo, ocupando su hueco
  // libre. mk(free, seg) devuelve los campos del nuevo unit. Normaliza la fila
  // a units seg-tagged. Devuelve sin cambios si el tramo está lleno.
  const assignTenant = (floorId, segIdx, mk) => updBuilding(b => {
    const f = b.floors.find(fl => fl.id === floorId)
    if (!f) return b
    const tramos = f.principal || []
    if (tramos.length === 0) return b
    const arr = [...(b.arr || [])]
    const ri = arr.findIndex(r => r.p === floorId)
    const slots = arrSlotsFor(tramos, ri >= 0 ? arr[ri].units : [])
    const usedOf = (i) => slots[i].reduce((s, u) => s + (u.sup || 0), 0)
    let seg = segIdx
    if (seg == null || seg < 0 || seg >= tramos.length) seg = tramos.findIndex((t, i) => usedOf(i) < t.sup)
    if (seg < 0) return b
    const free = tramos[seg].sup - usedOf(seg)
    if (free <= 0) return b
    const newUnit = { ...mk(free, seg), seg, sup: free }
    slots[seg] = [...slots[seg], newUnit]
    const units = slots.flatMap((occ, i) => occ.map(u => ({ ...u, seg: i })))
    const row = { p: floorId, sup: f.sup, units }
    if (ri >= 0) arr[ri] = row; else arr.push(row)
    return { ...b, arr }
  })

  const removeArrUnit = (floorId, idx) => {
    // Localiza la unidad antes de eliminar para detectar si es una oferta.
    const bldNow = buildings.find(b => b.id === edifId)
    const unit = bldNow?.arr?.find(r => r.p === floorId)?.units?.[idx]
    const esOferta = unit && unit.type === 'vac'

    if (esOferta) {
      // Para mantener el formato consistente con la baja de arrendatario
      // (ventana central, no window.confirm), delegamos al padre vía
      // onRemoveOferta. El padre abre un modal central con 2 opciones:
      // 'Cerrar oferta (alquilada)' o 'Introducida por error'.
      const doRemove = () => updBuilding(b => ({ ...b, arr: (b.arr || []).map(r => r.p !== floorId ? r : { ...r, units: r.units.filter((_, i) => i !== idx) }) }))
      if (typeof onRemoveOferta === 'function') {
        onRemoveOferta({ unit, floorId, idx, doRemove })
        return
      }
      // Fallback (sin padre que abra modal): convertir directamente en
      // arrendatario, navegando con activoRef/activoNombre para que la
      // nueva ficha herede el vínculo (issue: 'tendría que vincularse al
      // activo directamente').
      const ofertaLabel = unit.oferta || `${unit.sup || 0} m²`
      if (window.confirm(`Eliminar la oferta "${ofertaLabel}" de la planta ${floorId}?`)) {
        doRemove()
        if (typeof onConvertToTenant === 'function') {
          onConvertToTenant(unit, floorId, idx)
          return
        }
        spNavigate('ficha-arrendatario', {
          prefilledTenant: unit.oferta || '',
          prefilledSup:    String(unit.sup || ''),
          prefilledRenta:  String(unit.renta || ''),
          fromFloorId:     floorId,
          fromOfertaName:  unit.oferta || '',
          fromActivoRef:   activoRef,
          fromActivoNombre: activoNombre,
        })
        return
      }
    }

    // Bloque de arrendatario / parking / retail-tenant: delegar al padre
    // que abre el modal de baja (Generar oferta / Sin oferta / Cancelar).
    // Si confirma, el padre llama doRemove() para borrar la unidad del JSON.
    if (unit && (unit.type === 'ten' || unit.type === 'rt' || unit.type === 'pk')) {
      const doRemove = () => updBuilding(b => ({
        ...b,
        arr: (b.arr || []).map(r => r.p !== floorId ? r : { ...r, units: r.units.filter((_, i) => i !== idx) }),
      }))
      if (typeof onRemoveTenant === 'function') {
        onRemoveTenant({ unit, floorId, idx, doRemove })
        return
      }
    }
    // Fallback: eliminar la unidad sin más preguntas (no hay padre que gestione).
    updBuilding(b => ({ ...b, arr: (b.arr || []).map(r => r.p !== floorId ? r : { ...r, units: r.units.filter((_, i) => i !== idx) }) }))
  }

  const savePASup = () => {
    if(!editPA) return
    let val = parseFloat(editPASup)
    if(isNaN(val)||val<=0) return
    const renta = parseFloat(editPARenta)
    const total = parseFloat(editPATotal)
    // Validación dura: el ocupante no puede exceder los m² de su tramo menos lo
    // que ocupan los demás del mismo tramo. El reparto de m² del tramo se define
    // en "Uso principal" — aquí solo se ajusta dentro del muro.
    {
      const f = edif.floors.find(fl => fl.id === editPA.rowP)
      const row0 = edif[editPA.layer]?.find(r => r.p === editPA.rowP)
      const u0 = row0?.units?.[editPA.idx]
      if (f && row0 && u0) {
        const tramos = f.principal || []
        const seg = Number.isInteger(u0.seg) ? u0.seg : 0
        const tramoSup = tramos[seg]?.sup ?? f.sup
        const otros = (row0.units || []).reduce((s, u, i) => {
          const us = Number.isInteger(u.seg) ? u.seg : 0
          return s + (i !== editPA.idx && us === seg ? (u.sup || 0) : 0)
        }, 0)
        const maxVal = tramoSup - otros
        if (val > maxVal) {
          window.alert(`No caben ${val.toLocaleString('es-ES')} m² en este tramo (máximo ${maxVal.toLocaleString('es-ES')} m²). El reparto de m² se define en "Uso principal".`)
          val = maxVal
          if (val <= 0) return
        }
      }
    }
    updBuilding(b=>({...b, [editPA.layer]: b[editPA.layer].map(row=>{
      if(row.p!==editPA.rowP) return row
      const units=[...row.units]
      const upd = {...units[editPA.idx], sup:val}
      if(!isNaN(renta) && renta>=0) upd.renta = renta
      if(!isNaN(total) && total>=0) upd.precio_total = total
      units[editPA.idx] = upd
      return {...row, units}
    })}))
    // Sincroniza la renta de cierre del arrendatario con closing_rent en BD.
    if (editPA.layer === 'arr' && !isNaN(renta) && renta >= 0) {
      const u0 = edif.arr?.find(r => r.p === editPA.rowP)?.units?.[editPA.idx]
      if (u0?.type === 'ten' && u0.arr_ref) {
        supabase.from('arrendatarios').update({ closing_rent: renta, renta }).eq('ref', u0.arr_ref)
      }
    }
    setEditPA(null); setEditPASup(''); setEditPARenta(''); setEditPATotal('')
  }

  // ¿Qué variables hay asignadas en una planta? El Uso principal de la planta
  // (composición de usos y sus m²) no se puede tocar si tiene propietario,
  // arrendatario u oferta: hay que ajustar antes esas variables. Lista p/ aviso.
  const floorAssignments = (floorId) => {
    const out = []
    const propUnits = (edif.prop||[]).find(r=>r.p===floorId)?.units || []
    if (propUnits.some(u => u && (u.n || u.prop_id))) out.push('propietario')
    const arrUnits = (edif.arr||[]).find(r=>r.p===floorId)?.units || []
    if (arrUnits.some(u => u && u.type==='ten')) out.push('arrendatario')
    if (arrUnits.some(u => u && u.type==='vac' && u.oferta)) out.push('oferta')
    return out
  }

  // Guarda única de TODAS las interacciones de Uso principal: si la planta tiene
  // asignaciones, muestra el aviso (auto-oculta 4 s) y devuelve true (bloqueado).
  // El usuario debe revisar/ajustar antes la oferta y el propietario.
  const blockIfAssigned = (floorId) => {
    const vars = floorAssignments(floorId)
    if (!vars.length) return false
    setSupLockWarn({ floorId, vars })
    setTimeout(() => setSupLockWarn(w => (w && w.floorId === floorId) ? null : w), 4000)
    return true
  }

  // Abridor protegido del editor de superficie de planta.
  const tryEditFloorSup = (floorId, currentSup) => {
    if (blockIfAssigned(floorId)) return
    setSupLockWarn(null)
    setEditFloorSup(floorId); setEditFloorSupVal(String(currentSup))
  }

  const saveFloorSup = () => {
    if(!editFloorSup) return
    // Backstop: aunque el editor estuviera abierto, no se guarda si hay asignaciones.
    if(blockIfAssigned(editFloorSup)){ setEditFloorSup(null); return }
    const val = parseFloat(editFloorSupVal)
    if(isNaN(val)||val<=0) return
    updBuilding(b=>({...b,
      floors: b.floors.map(f=>f.id===editFloorSup?{...f,sup:val}:f),
      prop:   (b.prop||[]).map(r=>r.p===editFloorSup?{...r,sup:val}:r),
      arr:    (b.arr||[]).map(r=>r.p===editFloorSup?{...r,sup:val}:r),
    }))
    setEditFloorSup(null); setEditFloorSupVal('')
  }

  const saveSup = () => {
    if(!editFloor) return
    // Cambiar los m² de un tramo de Uso principal reescribe el muro heredado →
    // bloqueado si hay asignaciones. La superficie de los adicionales sí se edita.
    if(editFloor.layer==='principal' && blockIfAssigned(editFloor.floorId)){ setEditFloor(null); return }
    const val = parseFloat(editSup)
    if(isNaN(val)||val<=0) return
    updBuilding(b=>({...b, floors:b.floors.map(f=>{
      if(f.id!==editFloor.floorId) return f
      const arr=[...f[editFloor.layer]]
      arr[editFloor.idx]={...arr[editFloor.idx],sup:val}
      return {...f,[editFloor.layer]:arr}
    })}))
    setEditFloor(null); setEditSup('')
  }

  const bulkAssign = (usoId) => {
    // Si alguna planta seleccionada tiene asignaciones, no se asigna en lote: avisa.
    const blocked = selectedFloors.find(fId => floorAssignments(fId).length>0)
    if(blocked){ blockIfAssigned(blocked); return }
    selectedFloors.forEach(fId=>assignPrincipal(fId,usoId))
    setSelectedFloors([])
  }

  const insertFloorAt = (idx) => {
    const sup = edif.supPlantaTipo || 1500
    const floors = edif.floors
    const above = floors[idx - 1]
    const below = floors[idx]
    const parseNum = (id) => { const m = id?.match(/^([A-Z]+)(-?\d+)$/); return m ? parseInt(m[2]) : null }
    const parsePrefix = (id) => { const m = id?.match(/^([A-Z]+)(-?\d+)$/); return m ? m[1] : null }
    let newId
    const aboveNum = above ? parseNum(above.id) : null
    const belowNum = below ? parseNum(below.id) : null
    const prefix = (above ? parsePrefix(above.id) : null) || (below ? parsePrefix(below.id) : null) || 'P'
    if (aboveNum !== null && belowNum !== null && aboveNum - belowNum > 1) {
      newId = prefix + (aboveNum - 1)
    } else if (aboveNum !== null) {
      newId = prefix + (aboveNum + 1)
    } else if (belowNum !== null) {
      newId = prefix + (belowNum + 1)
    } else {
      newId = 'P' + (floors.length + 1)
    }
    if (floors.some(f => f.id === newId)) newId = newId + 'b'
    const newFloor = { id: newId, sup, principal: [], adicional: [] }
    updBuilding(b => {
      const fs = [...b.floors]
      fs.splice(idx, 0, newFloor)
      return { ...b, floors: fs, prop:[...(b.prop||[]),{p:newId,sup,units:[]}], arr:[...(b.arr||[]),{p:newId,sup,units:[]}] }
    })
  }

  const deleteFloor = (floorId) => {
    // No se borra una planta con propietario/arrendatario/oferta: dejaría esas
    // variables huérfanas. Mismo aviso que el resto de interacciones.
    if (blockIfAssigned(floorId)) return
    updBuilding(b => ({
      ...b,
      floors: b.floors.filter(f => f.id !== floorId),
      prop:   (b.prop||[]).filter(r => r.p !== floorId),
      arr:    (b.arr||[]).filter(r => r.p !== floorId),
    }))
    setSelectedFloors(p => p.filter(id => id !== floorId))
  }

  const createBuilding = () => {
    // 'sobre' incluye PB. Si el usuario indica 5 → PB + 4 plantas (5 total).
    const sobre=Math.max(1, parseInt(newBldg.sobre)||1), bajo=parseInt(newBldg.bajo)||0
    const sup=parseFloat(newBldg.sup)||1500
    const floors=[]
    for(let i=sobre-1;i>=1;i--) floors.push({id:`P${i}`,sup,principal:[],adicional:[]})
    floors.push({id:'PB',sup,principal:[],adicional:[]})
    for(let i=1;i<=bajo;i++) floors.push({id:`S${i}`,sup,principal:[],adicional:[]})
    const newId=String.fromCharCode(65+buildings.length)
    setBuildings(prev=>[...prev,{id:newId,label:newBldg.label||`Edif. ${newId}`,supPlantaTipo:sup,floors,prop:[],arr:[]}])
    setEdifId(newId); setShowCreate(false); setView('principal')
    setNewBldg({label:'',sup:'',sobre:'',bajo:''})
  }

  /* ── Drag handlers ── */
  const onDragOver  = (e,fId)=>{e.preventDefault();setDragTarget(fId)}
  const onDrop = (e, floor, layer) => {
    e.preventDefault(); setDragTarget(null)
    if(!dragging) return
    const isUA = !!UA_ALL.find(u=>u.id===dragging)
    const used=floor.principal.reduce((s,u)=>s+u.sup,0)
    const avail=floor.sup-used
    if(layer==='adicional' || (isUA && avail<=0)) { assignAdicional(floor.id, dragging); setDragging(null); return }
    if(avail<=0) { setSplitModal({floorId:floor.id,usoId:dragging}); setSplitSup('') }
    else { assignPrincipal(floor.id,dragging,avail) }
    setDragging(null)
  }

  /* ── Tab styles ── */
  const fTab = (id) => ({
    padding:'5px 14px',borderRadius:'6px 6px 0 0',fontSize:11,fontWeight:edifId===id?600:500,
    cursor:'pointer',border:'1px solid',fontFamily:'inherit',transition:'all .15s',
    borderColor:edifId===id?'var(--accent)':'var(--border)',
    borderBottom:edifId===id?'2px solid var(--surface)':'1px solid transparent',
    background:edifId===id?'var(--accent)':'var(--surface)',
    color:edifId===id?'#fff':'var(--text2)',
  })
  const vTab = (k) => ({
    padding:'7px 14px',fontSize:11,fontWeight:view===k?600:500,cursor:'pointer',
    border:'none',borderBottom:view===k?'2px solid var(--accent)':'2px solid transparent',
    background:'var(--surface)',color:view===k?'var(--accent)':'var(--text3)',fontFamily:'inherit',
  })

  /* ── Setup vacío ── */
  const createFirstBuilding = () => {
    const label = setupForm.label.trim() || defaultLabelRef.current || 'Edificio A'
    // 'sobre' incluye la planta baja. Si el usuario indica 5, el edificio
    // tiene 5 plantas sobre rasante = PB + 4 plantas superiores.
    const sobre = Math.max(1, parseInt(setupForm.sobre) || 1)
    const bajo  = Math.max(0, parseInt(setupForm.bajo)  || 0)
    const sup   = Math.max(100, parseFloat(setupForm.sup) || 1000)
    const floors = []
    for (let i = sobre - 1; i >= 1; i--) floors.push({ id: `P${i}`, sup, principal: [], adicional: [] })
    floors.push({ id: 'PB', sup, principal: [], adicional: [] })
    for (let i = 1; i <= bajo; i++) floors.push({ id: `S${i}`, sup, principal: [], adicional: [] })
    const id = 'A'
    setBuildings([{ id, label, supPlantaTipo: sup, floors, prop: floors.map(f=>({p:f.id,sup,units:[]})), arr: floors.map(f=>({p:f.id,sup,units:[]})) }])
    setEdifId(id)
  }

  if (buildings.length === 0) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 24px',gap:20}}>
      <div style={{fontSize:32}}>🏗</div>
      <div style={{fontSize:17,fontWeight:700,color:'var(--text)',letterSpacing:'-.005em'}}>Configura el stacking plan</div>
      <div style={{fontSize:12,color:'var(--text3)',marginTop:-10,textAlign:'center'}}>Define la estructura del edificio para empezar a asignar plantas y usos</div>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:24,width:'100%',maxWidth:420,display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Nombre del edificio</span>
          <input style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}} placeholder="Edificio A" value={setupForm.label} onChange={e=>setSetupForm(p=>({...p,label:e.target.value}))}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Plantas SR</span>
            <input type="number" min="1" max="100" style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}} value={setupForm.sobre} onChange={e=>setSetupForm(p=>({...p,sobre:e.target.value}))}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Sótanos BR</span>
            <input type="number" min="0" max="20" style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}} value={setupForm.bajo} onChange={e=>setSetupForm(p=>({...p,bajo:e.target.value}))}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Sup. tipo (m²)</span>
            <input type="number" min="100" style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}} value={setupForm.sup} onChange={e=>setSetupForm(p=>({...p,sup:e.target.value}))}/>
          </div>
        </div>
        <button onClick={createFirstBuilding} style={{marginTop:4,padding:'9px 0',background:'var(--accent)',color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>Crear estructura</button>
      </div>
    </div>
  )

  return (
    <div style={expanded ? {position:'fixed',inset:0,zIndex:1000,background:'var(--bg)',overflow:'auto',padding:'20px 24px'} : undefined}>
      {/* Edificio tabs */}
      <div style={{display:'flex',gap:6,borderBottom:'1px solid var(--border)',background:'var(--gray-lt)',marginLeft:-24,marginRight:-24,paddingLeft:24,paddingTop:6,flexWrap:'wrap'}}>
        {buildings.map(b=>(
          <button key={b.id} onClick={()=>{setEdifId(b.id);setSelectedFloors([])}} style={fTab(b.id)}>{b.label}</button>
        ))}
        {showCreate ? (
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'6px 6px 0 0',flexWrap:'wrap'}}>
            <input placeholder="Nombre" value={newBldg.label} onChange={e=>setNewBldg(p=>({...p,label:e.target.value}))}
              style={{width:110,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
            <input placeholder="m² planta tipo" type="number" value={newBldg.sup} onChange={e=>setNewBldg(p=>({...p,sup:e.target.value}))}
              style={{width:90,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
            <input placeholder="P. sobre rasante" type="number" value={newBldg.sobre} onChange={e=>setNewBldg(p=>({...p,sobre:e.target.value}))}
              style={{width:80,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
            <input placeholder="P. bajo rasante" type="number" value={newBldg.bajo} onChange={e=>setNewBldg(p=>({...p,bajo:e.target.value}))}
              style={{width:78,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
            <button onClick={createBuilding} style={{padding:'4px 10px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:4,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Crear</button>
            <button onClick={()=>setShowCreate(false)} style={{padding:'4px 8px',background:'none',border:'none',cursor:'pointer',fontSize:12,color:'var(--text3)',fontFamily:'inherit'}}>✕</button>
          </div>
        ) : (
          <button onClick={()=>setShowCreate(true)} style={{padding:'5px 14px',borderRadius:'6px 6px 0 0',fontSize:11,cursor:'pointer',border:'1px dashed var(--accent-bd)',borderBottom:'1px solid transparent',background:'var(--accent-lt)',color:'var(--accent)',fontFamily:'inherit'}}>+ Añadir edificio</button>
        )}
      </div>

      {/* Vista sub-tabs + botón expandir */}
      <div className="sp-tabs" style={{marginLeft:-24,marginRight:-24,paddingLeft:24,paddingRight:24,display:'flex',alignItems:'center',gap:12}}>
        <div style={{display:'flex',gap:14,flex:1}}>
          {[['principal','Uso principal'],['prop','Propietarios'],['arr','Arrendatarios y oferta']].map(([k,l])=>(
            <div key={k} onClick={()=>setView(k)} className={`sp-tab${view===k?' active':''}`}>{l}</div>
          ))}
        </div>
        <button
          onClick={()=>setExpanded(v=>!v)}
          style={{padding:'5px 12px',fontSize:11,fontWeight:600,cursor:'pointer',border:'1px solid var(--border)',borderRadius:6,background:'var(--surface)',color:'var(--text3)',fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:5}}
          title={expanded?'Cerrar vista expandida (Esc)':'Expandir a pantalla completa'}
        >
          {expanded ? '↙ Contraer' : '↗ Expandir'}
        </button>
      </div>

      {/* Header KPIs */}
      <div className="sp-header">
        <div className="sp-kpi-hero">
          <div className="sp-kpi-label">SBA total</div>
          <div className="sp-kpi-value">
            <span className="sp-kpi-number">{totalSup.toLocaleString('es-ES')}</span>
            <span className="sp-kpi-unit">m²</span>
          </div>
          <div className="sp-kpi-caption">Superficie bruta alquilable</div>
        </div>
        <div className="sp-kpi-group">
          <div className="sp-kpi-small sp-kpi-asignado">
            <div className="sp-kpi-label">Asignado</div>
            <div className="sp-kpi-value">
              <span className="sp-kpi-number">{assignedSup.toLocaleString('es-ES')}</span>
              <span className="sp-kpi-unit">m²</span>
            </div>
          </div>
          <div className="sp-kpi-small sp-kpi-sin-asignar">
            <div className="sp-kpi-label">Sin asignar</div>
            <div className="sp-kpi-value">
              <span className="sp-kpi-number">{(totalSup-assignedSup).toLocaleString('es-ES')}</span>
              <span className="sp-kpi-unit">m²</span>
            </div>
          </div>
          <div className="sp-kpi-small sp-kpi-cobertura">
            <div className="sp-kpi-label">Cobertura</div>
            <div className="sp-kpi-value">
              <span className="sp-kpi-number">{occPct}</span>
              <span className="sp-kpi-unit">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ USO PRINCIPAL ══ */}
      {view==='principal' && (
        <div className={`sp-body sp-body-v2 ${sidebarCollapsed?'is-collapsed':''}`}>

          {/* ── SIDEBAR lateral: 300px desplegado / 60px plegado ── */}
          <aside className="sp-sidebar-v2">
            <button
              type="button"
              className="sp-sidebar-toggle"
              onClick={()=>setSidebarCollapsed(v=>!v)}
              title={sidebarCollapsed?'Desplegar panel':'Plegar panel'}
            >
              {sidebarCollapsed ? '›' : '‹'}
            </button>

            {/* SECCIÓN: Usos principales */}
            <SidebarSection
              label="Usos principales"
              count={USOS_PPAL.length}
              open={ppOpen}
              onToggle={()=>setPpOpen(v=>!v)}
              collapsed={sidebarCollapsed}
              dot={USOS_PPAL[0]?.color}
            >
              {USOS_PPAL.map(u=>(
                <div key={u.id} draggable className="sp-chip-big"
                  onDragStart={()=>setDragging(u.id)}
                  onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                  onMouseEnter={()=>setHoverKey('uso:'+u.id)}
                  onMouseLeave={()=>setHoverKey(null)}
                  style={{
                    border:`1px solid ${dragging===u.id?u.color:u.bd}`,background:u.bg,
                    opacity:dragging&&dragging!==u.id?.4:1,
                    boxShadow:dragging===u.id?`0 2px 8px ${u.color}55`:'none',
                  }}
                >
                  <span className="sp-chip-big-dot" style={{background:u.color}}/>
                  <span className="sp-chip-big-label" style={{color:u.color}}>{u.label}</span>
                </div>
              ))}
            </SidebarSection>

            {/* SECCIÓN: Usos adicionales */}
            <SidebarSection
              label="Usos adicionales"
              count={availableUA.length}
              open={uaOpen}
              onToggle={()=>setUaOpen(v=>!v)}
              collapsed={sidebarCollapsed}
              dot="#a855f7"
            >
              {availableUA.length===0 ? (
                <div className="sp-sidebar-empty">Asigna primero usos principales</div>
              ) : availableUA.map(ua=>(
                <div key={ua.id} draggable className="sp-chip-big"
                  onDragStart={()=>setDragging(ua.id)}
                  onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                  onMouseEnter={()=>setHoverKey('uso:'+ua.id)}
                  onMouseLeave={()=>setHoverKey(null)}
                  style={{
                    border:`1px solid ${dragging===ua.id?ua.color:ua.bd}`,background:ua.bg,
                    opacity:dragging&&dragging!==ua.id?.4:1,
                    boxShadow:dragging===ua.id?`0 2px 8px ${ua.color}44`:'none',
                  }}
                >
                  <span className="sp-chip-big-dot" style={{background:ua.color}}/>
                  <span className="sp-chip-big-label" style={{color:ua.color}}>{ua.label}</span>
                  <span className={`sp-chip-big-tag ${ua.attr?'tag-a':'tag-s'}`}>{ua.attr?'A':'S'}</span>
                </div>
              ))}
            </SidebarSection>

            {/* Asignación masiva — solo si hay plantas seleccionadas y sidebar abierto */}
            {selectedFloors.length>0 && !sidebarCollapsed && (
              <div className="sp-bulk-panel">
                <div className="sp-bulk-panel-title">
                  {selectedFloors.length} planta{selectedFloors.length>1?'s':''} sel.
                </div>
                {USOS_PPAL.map(u=>(
                  <button key={u.id} onClick={()=>bulkAssign(u.id)}
                    style={{display:'block',width:'100%',padding:'5px 10px',marginBottom:4,
                      background:u.bg,color:u.color,border:`1px solid ${u.bd}`,
                      borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',textAlign:'left',fontWeight:600}}>
                    {u.label}
                  </button>
                ))}
                <button onClick={()=>setSelectedFloors([])}
                  style={{display:'block',width:'100%',padding:'5px 10px',marginTop:4,
                    background:'none',color:'var(--text4)',border:'1px solid var(--border)',
                    borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
                  Cancelar
                </button>
              </div>
            )}
          </aside>

          {/* ── GRID PLANTAS a ancho completo ── */}
          <div style={{minWidth:0}}>
            {/* Cabecera */}
            <div className="sp-table-head" style={{gridTemplateColumns:'20px 40px 1fr 80px 44px'}}>
              <div/>
              <div>Planta</div>
              <div>Uso principal + usos adicionales</div>
              <div style={{textAlign:'right'}}>Sup.</div>
              <div/>
            </div>

            {(()=>{ const maxFloorSup=Math.max(...edif.floors.map(f=>f.sup),1); return edif.floors.map((floor, floorIdx)=>{
              // Altura unificada con las vistas Propietarios y Arrendatarios (misma barra en las 3).
              const barH = Math.max(38, Math.round((floor.sup / maxFloorSup) * 58))
              const used  = floor.principal.reduce((s,u)=>s+u.sup,0)
              const avail = floor.sup-used
              const isTgt = dragTarget===floor.id
              const isSel = selectedFloors.includes(floor.id)
              const hasAdic = floor.adicional.length>0
              // Superficie bloqueada si la planta tiene propietario/arrendatario/oferta
              const supLocked = floorAssignments(floor.id).length>0
              // Línea gruesa debajo de PB para separar SR de BR
              const isPB = floor.id === 'PB'

              return (
                <div key={floor.id}
                  onDragOver={e=>onDragOver(e,floor.id)}
                  onDragLeave={()=>setDragTarget(null)}
                  onDrop={e=>{
                    e.preventDefault(); setDragTarget(null)
                    if(!dragging) return
                    const isUA = !!UA_ALL.find(u=>u.id===dragging)
                    const targets = selectedFloors.length > 1 ? selectedFloors : [floor.id]
                    // Una planta con propietario/arrendatario/oferta no admite cambios
                    // de Uso principal: hay que ajustar antes esas variables.
                    const blocked = targets.find(fId => floorAssignments(fId).length>0)
                    if(blocked){ blockIfAssigned(blocked); setDragging(null); return }
                    if(isUA) {
                      if(targets.length > 1) {
                        setBuildings(prev=>prev.map(b=>{
                          if(b.id!==edifId) return b
                          return {...b, floors:b.floors.map(f=>{
                            if(!targets.includes(f.id)) return f
                            const av=f.sup-f.principal.reduce((s,u)=>s+u.sup,0)
                            if(av>0) return {...f,principal:[...f.principal,{uso:dragging,sup:av}]}
                            if(f.adicional.find(a=>a.uso===dragging)) return f
                            const ua=UA_ALL.find(u=>u.id===dragging)
                            if(!ua) return f
                            return {...f,adicional:[...f.adicional,{uso:dragging,label:ua.label,sup:ua.sup?100:0,attr:ua.attr||false}]}
                          })}
                        }))
                        setSelectedFloors([])
                      } else {
                        if(avail>0) assignPrincipal(floor.id,dragging,avail)
                        else assignAdicional(floor.id,dragging)
                      }
                      setDragging(null); return
                    }
                    if(targets.length > 1) {
                      setBuildings(prev=>prev.map(b=>{
                        if(b.id!==edifId) return b
                        return {...b, floors:b.floors.map(f=>{
                          if(!targets.includes(f.id)) return f
                          const av=f.sup-f.principal.reduce((s,u)=>s+u.sup,0)
                          if(av<=0) return f
                          return {...f, principal:[...f.principal,{uso:dragging,sup:av}]}
                        })}
                      }))
                      setSelectedFloors([])
                    } else {
                      const used2=floor.principal.reduce((s,u)=>s+u.sup,0)
                      const avail2=floor.sup-used2
                      if(avail2<=0){ setSplitModal({floorId:floor.id,usoId:dragging}); setSplitSup('') }
                      else{ assignPrincipal(floor.id,dragging,avail2) }
                    }
                    setDragging(null)
                  }}
                  className="sp-row"
                  style={{
                    gridTemplateColumns:'20px 40px 1fr 80px 44px',
                    borderBottom: isPB ? '3px solid var(--ink-2)' : undefined,
                    background:isTgt?'var(--pdb-blue-50)':isSel?'#f0f9ff':'var(--surface)',
                    outline:isSel||isTgt?'1.5px solid var(--pdb-blue)':'none',
                    cursor:'pointer',
                    // Ancho proporcional a la superficie de la planta (silueta del edificio).
                    // La más grande ocupa 100%; el resto se escala. Alineadas a la izquierda.
                    width: `${Math.max((floor.sup / maxFloorSup) * 100, 30)}%`,
                    minWidth: 280,
                  }}
                  onClick={()=>setSelectedFloors(p=>p.includes(floor.id)?p.filter(x=>x!==floor.id):[...p,floor.id])}
                >
                  {/* Checkbox */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',paddingTop:4}} onClick={e=>e.stopPropagation()}>
                    <input type="checkbox" checked={isSel}
                      onChange={()=>setSelectedFloors(p=>p.includes(floor.id)?p.filter(x=>x!==floor.id):[...p,floor.id])}
                      style={{width:11,height:11,cursor:'pointer'}}/>
                  </div>

                  {/* Label planta */}
                  <div className={`sp-row-floor${floor.principal.length===0?' empty':''}`} style={{color:isSel?'var(--pdb-blue)':undefined}}>{floor.id}</div>

                  {/* Columna central: uso principal + adicionales */}
                  <div className="sp-row-blocks" style={{flexDirection:'column',gap:4,padding:'6px 0',alignItems:'stretch'}}>

                    {/* Aviso: superficie bloqueada porque la planta tiene asignaciones */}
                    {supLockWarn?.floorId===floor.id && (
                      <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 9px',background:'#fffbeb',border:'1px solid var(--amber-bd)',borderRadius:6,fontSize:10.5,color:'#92400e',fontWeight:600}} onClick={e=>e.stopPropagation()}>
                        <AlertTriangle size={12} strokeWidth={1.9}/>
                        <span>Para modificar el Uso principal de esta planta, revisa y ajusta primero su {supLockWarn.vars.join(', ')}.</span>
                      </div>
                    )}

                    {/* Fila 1: barras de uso principal */}
                    <div style={{display:'flex',gap:2,minHeight:barH}}>
                      {floor.principal.length===0 ? (
                        <div className="sp-block-empty" style={{background:isSel?'var(--pdb-blue-50)':isTgt?'var(--pdb-blue-50)':undefined,borderColor:isSel||isTgt?'var(--pdb-blue)':undefined,color:isSel||isTgt?'var(--pdb-blue)':undefined,fontWeight:isTgt||isSel?600:undefined}}>
                          {isTgt?<><ArrowDown size={11} strokeWidth={2}/> Soltar uso aquí</>:isSel?'✓ Seleccionada — arrastra un uso':'Clic para seleccionar · arrastra un uso'}
                        </div>
                      ) : (
                        <>
                          {floor.principal.map((u,i)=>{
                            const info = usoInfo(u.uso)
                            const wpct = `${(u.sup/floor.sup)*100}%`
                            const isEd = editFloor?.floorId===floor.id && editFloor?.idx===i && editFloor?.layer==='principal'
                            const isHL = hoverKey === 'uso:'+u.uso
                            return (
                              <div key={i}
                                title={`${info.label} · ${u.sup.toLocaleString('es-ES')} m²`}
                                onClick={e=>{e.stopPropagation();if(isEd){setEditFloor(null);return}if(blockIfAssigned(floor.id))return;setEditFloor({floorId:floor.id,idx:i,layer:'principal'});setEditSup(String(u.sup))}}
                                className={`sp-block${isHL?' sp-block-hl':''}`}
                                style={{width:wpct,background:info.bg,border:`1px solid ${isHL?info.color:info.bd}`,flex:'unset',flexShrink:0,boxShadow:isHL?`0 0 0 2px ${info.color}, 0 2px 12px ${info.color}66`:undefined,transform:isHL?'scale(1.02)':undefined,zIndex:isHL?2:undefined,position:'relative',transition:'box-shadow 120ms ease, transform 120ms ease'}}
                              >
                                {isEd ? (
                                  <div style={{display:'flex',gap:5,padding:'6px 8px',alignItems:'center',background:'#fff',border:`1.5px solid ${info.color}`,borderRadius:6,boxShadow:`0 4px 14px ${info.color}33`}} onClick={e=>e.stopPropagation()}>
                                    <input type="number" value={editSup} onChange={e=>setEditSup(e.target.value)} autoFocus
                                      onKeyDown={e=>{if(e.key==='Enter')saveSup();if(e.key==='Escape')setEditFloor(null)}}
                                      style={{width:90,padding:'6px 8px',fontSize:13,fontWeight:600,border:`1px solid ${info.color}`,borderRadius:4,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                    <span style={{fontSize:11,color:info.color,fontWeight:600}}>m²</span>
                                    <button onClick={saveSup} style={{padding:'6px 10px',background:info.color,color:'#fff',border:'none',borderRadius:4,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginLeft:4}}>✓</button>
                                    <button onClick={()=>removeItem(floor.id,i,'principal')} style={{padding:'6px 10px',background:'#fee2e2',color:'#dc2626',border:'1px solid #fca5a5',borderRadius:4,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>✕</button>
                                  </div>
                                ) : (
                                  <div className="sp-block-content">
                                    <span className="sp-block-name" style={{color:info.color}}>{info.label}</span>
                                    {u.sup>=200 && <span className="sp-block-meta" style={{color:info.color}}>{u.sup.toLocaleString('es-ES')} m²</span>}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          {avail>0 && (
                            <div className="sp-block-empty" style={{flex:1,minWidth:14,background:isSel?'var(--pdb-blue-50)':isTgt?'var(--pdb-blue-50)':undefined,borderColor:isSel||isTgt?'var(--pdb-blue)':undefined,color:isSel||isTgt?'var(--pdb-blue)':undefined,fontSize:9}}>
                              {isSel?'✓ ':''}{avail.toLocaleString('es-ES')} m²
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Fila 2: chips de usos adicionales */}
                    {hasAdic && (
                      <div style={{display:'flex',flexWrap:'wrap',gap:3,paddingBottom:4}}>
                        {floor.adicional.map((ua,i)=>{
                          const info = uaInfo(ua.uso)
                          const isEd = editFloor?.floorId===floor.id&&editFloor?.idx===i&&editFloor?.layer==='adicional'
                          return (
                            <div key={i} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',
                              background:info.bg,border:`1px solid ${info.bd}`,borderRadius:10,
                              fontSize:9,color:info.color,fontWeight:600}}>
                              <div style={{width:6,height:6,borderRadius:1,background:info.color,flexShrink:0}}/>
                              <span>{ua.label}</span>
                              {!ua.attr&&(isEd?(
                                <div style={{display:'flex',gap:2}} onClick={e=>e.stopPropagation()}>
                                  <input type="number" value={editSup} onChange={e=>setEditSup(e.target.value)} autoFocus
                                    onKeyDown={e=>{if(e.key==='Enter')saveSup();if(e.key==='Escape')setEditFloor(null)}}
                                    style={{width:44,padding:'1px 3px',fontSize:8,border:`1px solid ${info.color}`,borderRadius:3,fontFamily:'var(--mono)'}}/>
                                  <button onClick={saveSup} style={{padding:'1px 3px',background:info.color,color:'#fff',border:'none',borderRadius:3,fontSize:8,cursor:'pointer'}}>✓</button>
                                </div>
                              ):(
                                <span onClick={()=>{setEditFloor({floorId:floor.id,idx:i,layer:'adicional'});setEditSup(String(ua.sup))}}
                                  style={{fontFamily:'var(--mono)',fontSize:8,color:info.color,opacity:.7,cursor:'pointer',textDecoration:'underline dotted'}}>
                                  {ua.sup>0?`${ua.sup.toLocaleString('es-ES')} m²`:''}
                                </span>
                              ))}
                              <button onClick={()=>removeItem(floor.id,i,'adicional')}
                                style={{background:'none',border:'none',cursor:'pointer',color:info.color,fontSize:10,lineHeight:1,padding:'0',opacity:.6}}>✕</button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Sup total — editable sólo desde Uso principal */}
                  <div className="sp-row-total" onClick={e=>e.stopPropagation()} style={{display:'flex',justifyContent:'flex-end',alignItems:'flex-start',paddingTop:6}}>
                    {editFloorSup===floor.id ? (
                      <div style={{display:'flex',flexDirection:'column',gap:2,alignItems:'flex-end'}} onClick={e=>e.stopPropagation()}>
                        <input type="number" value={editFloorSupVal} onChange={e=>setEditFloorSupVal(e.target.value)} autoFocus
                          onKeyDown={e=>{if(e.key==='Enter')saveFloorSup();if(e.key==='Escape')setEditFloorSup(null)}}
                          style={{width:68,padding:'2px 4px',fontSize:10,border:'1px solid var(--accent)',borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                        <div style={{display:'flex',gap:2}}>
                          <button onClick={saveFloorSup} style={{padding:'2px 5px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:3,fontSize:9,cursor:'pointer'}}>✓</button>
                          <button onClick={()=>setEditFloorSup(null)} style={{padding:'2px 5px',background:'none',color:'var(--text4)',border:'1px solid var(--border)',borderRadius:3,fontSize:9,cursor:'pointer'}}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <span
                        title={supLocked ? 'Superficie bloqueada: la planta tiene propietario, arrendatario u oferta' : 'Clic para editar superficie total'}
                        onClick={()=>tryEditFloorSup(floor.id, floor.sup)}
                        style={supLocked
                          ? {cursor:'not-allowed',color:'var(--text3)',display:'inline-flex',alignItems:'center',gap:3}
                          : {cursor:'pointer',borderBottom:'1px dotted var(--text4)'}}>
                        {supLocked && <Lock size={9} strokeWidth={2} style={{opacity:.6}}/>}
                        {floor.sup.toLocaleString('es-ES')} m²
                      </span>
                    )}
                  </div>
                  {/* Acciones: ✎ editar sup · + insertar encima · − eliminar */}
                  <div style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:2,padding:'0 4px'}} onClick={e=>e.stopPropagation()}>
                    {[
                      {icon: supLocked?'🔒':'✎', title: supLocked?'Superficie bloqueada: hay propietario, arrendatario u oferta':'Editar superficie', onClick:()=>tryEditFloorSup(floor.id, floor.sup), hoverBg:'#faf5ec', hoverCol:'var(--accent)', hoverBd:'var(--accent-bd)'},
                      {icon:'+', title:'Insertar planta encima', onClick:()=>insertFloorAt(floorIdx), hoverBg:'#f0fdf4', hoverCol:'#16a34a', hoverBd:'#86efac'},
                      {icon:'−', title:'Eliminar planta', onClick:()=>deleteFloor(floor.id), hoverBg:'#fee2e2', hoverCol:'#dc2626', hoverBd:'#fca5a5'},
                    ].map(({icon,title,onClick,hoverBg,hoverCol,hoverBd})=>(
                      <button key={icon} onClick={e=>{e.stopPropagation();onClick()}} title={title}
                        style={{width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'1px solid var(--border)',borderRadius:3,fontSize:10,lineHeight:1,cursor:'pointer',color:'var(--text4)',fontFamily:'inherit',padding:0,flexShrink:0}}
                        onMouseEnter={e=>{e.currentTarget.style.background=hoverBg;e.currentTarget.style.color=hoverCol;e.currentTarget.style.borderColor=hoverBd}}
                        onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--text4)';e.currentTarget.style.borderColor='var(--border)'}}>{icon}</button>
                    ))}
                  </div>
                </div>
              )
            })
            })()}

            {/* Barra de asignación */}
            <div className="sp-progress">
              <span className="sp-progress-label">Asignación</span>
              <div className="sp-progress-track">
                <div className="sp-progress-fill" style={{width:`${occPct}%`,background:occPct===100?'var(--pdb-green)':'var(--pdb-blue)'}}/>
              </div>
              <span className="sp-progress-value">{occPct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ══ PROPIETARIOS ══ */}
      {view==='prop' && (()=>{
        const PROP_COLORS = ['#B08D57','#8b5cf6','#14b8a6','#f97316','#ec4899','#22c55e']
        // ownerSet = lista deduplicada de chips {key, id, name}.
        //   key = id (propietarios.id, ej. 'PRO-...') si lo hay, sino name.
        //   Permite resolver renames y disambiguar varios propietarios con el
        //   mismo nombre (poco común pero posible en estructuras complejas).
        // extraOwners admite tanto strings (legacy) como {id, name}.
        const _seen = new Set()
        const ownerSet = []
        const _push = (entry) => {
          if (!entry || _seen.has(entry.key)) return
          _seen.add(entry.key); ownerSet.push(entry)
        }
        for (const e of (extraOwners || [])) {
          if (typeof e === 'string') _push({ key: e, id: null, name: e })
          else if (e && e.name)      _push({ key: e.id || e.name, id: e.id || null, name: e.name })
        }
        for (const r of (edif.prop || [])) {
          for (const u of (r.units || [])) {
            _push({ key: u.prop_id || u.n, id: u.prop_id || null, name: u.n })
          }
        }
        const ownerColor = (n) => {
          const i = ownerSet.findIndex(o => o.name === n)
          return PROP_COLORS[(i >= 0 ? i : 0) % PROP_COLORS.length]
        }
        return (
          <div className={`sp-body sp-body-v2 ${sidebarCollapsed?'is-collapsed':''}`}>

            {/* ── SIDEBAR PROPIETARIOS ── */}
            <aside className="sp-sidebar-v2">
              <button
                type="button"
                className="sp-sidebar-toggle"
                onClick={()=>setSidebarCollapsed(v=>!v)}
                title={sidebarCollapsed?'Desplegar panel':'Plegar panel'}
              >
                {sidebarCollapsed ? '›' : '‹'}
              </button>

              <SidebarSection
                label="Propietarios"
                count={ownerSet.length}
                open={propPanelOpen}
                onToggle={()=>setPropPanelOpen(v=>!v)}
                collapsed={sidebarCollapsed}
                dot={PROP_COLORS[0]}
                actionLabel="+ Añadir"
                onAction={onAddOwner}
              >
                {ownerSet.length===0 ? (
                  <div className="sp-sidebar-empty">Aún no hay propietarios</div>
                ) : ownerSet.map((o,i)=>{
                  const col = PROP_COLORS[i%PROP_COLORS.length]
                  const dragKey = o.key
                  const dupName = ownerSet.filter(x => x.name === o.name).length > 1
                  const m2 = (edif.prop||[]).flatMap(r => r.units || []).reduce((s,u) => {
                    const match = o.id ? u.prop_id === o.id : (!u.prop_id && u.n === o.name)
                    return s + (match ? (Number(u.sup)||0) : 0)
                  }, 0)
                  return (
                    <div key={o.key} draggable className="sp-chip-big"
                      onDragStart={()=>setDragging(dragKey)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      onMouseEnter={()=>setHoverKey('owner:'+(o.id || o.name))}
                      onMouseLeave={()=>setHoverKey(null)}
                      onClick={() => {
                        if (dragging) return
                        // "Propietario desconocido [N]" (placeholder de una venta) → abre
                        // la ficha de ESE hueco concreto para asignar la cuenta. Al
                        // guardar, sustituye solo sus tramos en el stacking.
                        if (o.name && o.name.startsWith('Propietario desconocido')) {
                          spNavigate('ficha-propietario', {
                            completingUnknown: true,
                            ...(o.id ? { id: o.id } : {}),
                            unknownName: o.name,
                            ownerSuperficie: m2,
                            fromActivoRef: activoRef,
                            fromActivoNombre: activoNombre,
                            fromActivoTab: 'at-stacking',
                          })
                          return
                        }
                        spNavigate('ficha-propietario', {
                          id: o.id,
                          ownerData: { id: o.id, propietario: o.name, superficie: m2 },
                          ownerSuperficie: m2,
                          fromOwnerStacking: true,
                          fromActivoRef: activoRef,
                          fromActivoNombre: activoNombre,
                          fromActivoTab: 'at-stacking',
                        })
                      }}
                      title={(!o.id && o.name === 'Propietario desconocido')
                        ? 'Hueco de una venta · pulsa para asignar el comprador (o arrastra una cuenta sobre su tramo)'
                        : `${o.name} · ${m2 ? m2.toLocaleString('es-ES') : 0} m²`}
                      style={{
                        border:`1px solid ${dragging===dragKey?col:col+'88'}`,background:col+'18',
                        opacity:dragging&&dragging!==dragKey?.4:1,
                        boxShadow:dragging===dragKey?`0 2px 8px ${col}44`:'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span className="sp-chip-big-dot" style={{background:col}}/>
                      <span className="sp-chip-big-label" style={{color:col,textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:2}}>
                        {o.name}
                        {dupName && o.id && <span style={{ marginLeft:4, fontSize:9, color:col, opacity:0.7, fontWeight:500, textDecoration:'none' }}>· {o.id.slice(-6)}</span>}
                      </span>
                      <span className="sp-chip-big-tag" style={{background:col+'22',color:col}}>{m2 ? (m2>=1000?Math.round(m2/1000)+'k':m2) : '0'} m²</span>
                    </div>
                  )
                })}
              </SidebarSection>
            </aside>

            {/* ── GRID PLANTAS (driven by edif.floors) ── */}
            <div style={{minWidth:0}}>
              <div className="sp-table-head" style={{gridTemplateColumns:'20px 40px 1fr 80px 44px'}}>
                <div/>
                <div>Planta</div>
                <div>Propietario · arrastra desde el panel</div>
                <div style={{textAlign:'right'}}>Sup.</div>
                <div/>
              </div>
              {(()=>{const maxFloorSup=Math.max(...edif.floors.map(f=>f.sup),1);return edif.floors.map(floor=>{
                const barH = Math.max(38, Math.round((floor.sup / maxFloorSup) * 58))
                const tramos   = floor.principal || []
                const propRow  = (edif.prop||[]).find(r=>r.p===floor.id)
                const slots    = slotsFor(tramos, propRow?.units)
                const rowSup   = propRow?.sup ?? floor.sup
                const noUso    = tramos.length===0
                const isEmpty  = !noUso && slots.every(s=>!s)
                const isTgt    = dragTarget===floor.id
                const isSel    = selectedFloors.includes(floor.id)
                return (
                  <div key={floor.id}
                    onClick={()=>setSelectedFloors(p=>p.includes(floor.id)?p.filter(x=>x!==floor.id):[...p,floor.id])}
                    onDragOver={e=>{
                      if(noUso){e.dataTransfer.dropEffect='none';return}
                      e.preventDefault();setDragTarget(floor.id)
                    }}
                    onDragLeave={()=>setDragTarget(null)}
                    onDrop={e=>{
                      e.preventDefault();setDragTarget(null)
                      // Sin uso principal no hay tramos → no se puede colocar
                      // propietario. El drop real se gestiona por tramo (abajo).
                      if(noUso){
                        setDropWarning(floor.id); setTimeout(()=>setDropWarning(null),3000); setDragging(null)
                      }
                    }}
                    className="sp-row"
                    style={{
                      gridTemplateColumns:'20px 40px 1fr 80px 44px',
                      borderBottom: floor.id==='PB' ? '3px solid var(--ink-2)' : undefined,
                      background:dropWarning===floor.id?'#fff1f2':isTgt?'var(--pdb-blue-50)':isSel?'#f0f9ff':'var(--surface)',
                      outline:dropWarning===floor.id?'1.5px solid #fca5a5':isSel||isTgt?'1.5px solid var(--pdb-blue)':'none', cursor:'pointer',
                      // Ancho proporcional (capa Propietarios) — misma rejilla que Uso principal
                      width: `${Math.max((floor.sup / maxFloorSup) * 100, 30)}%`,
                      minWidth: 280,
                    }}>

                    <div/>
                    <div className={`sp-row-floor${isEmpty?' empty':''}`} style={{color:isSel?'var(--pdb-blue)':undefined}}>{floor.id}</div>

                    <div className="sp-row-blocks" style={{flexDirection:'column',gap:3,padding:'6px 0',alignItems:'stretch'}}>
                      {dropWarning===floor.id && (
                        <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 8px',background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:4,fontSize:10,color:'#dc2626',fontWeight:600}}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:4}}><AlertTriangle size={11} strokeWidth={1.75}/> Asigna primero un uso principal en esta planta</span>
                        </div>
                      )}
                      {/* Referencia uso principal (gris tenue) */}
                      {floor.principal.length>0 && (
                        <div style={{display:'flex',gap:1,height:4,borderRadius:2,overflow:'hidden',opacity:.3}}>
                          {floor.principal.map((u,i)=>{
                            const info=usoInfo(u.uso)
                            return <div key={i} style={{width:`${(u.sup/floor.sup)*100}%`,background:info.color,flexShrink:0}}/>
                          })}
                        </div>
                      )}
                      {/* Bloques de propietario = un bloque por tramo de Uso principal.
                          Los m² del tramo se heredan y NO se editan aquí (B4). */}
                      <div style={{display:'flex',gap:2,minHeight:barH}}>
                        {noUso ? (
                          <div className="sp-block-empty" style={{borderColor:isTgt?'var(--pdb-blue)':undefined,color:isTgt?'var(--pdb-blue)':undefined}}>
                            Asigna primero un uso principal en esta planta
                          </div>
                        ) : tramos.map((tr,i)=>{
                          const u = slots[i]
                          const wpct = `${(tr.sup/floor.sup)*100}%`
                          const onTramoDrop = (e)=>{
                            e.preventDefault(); e.stopPropagation(); setDragTarget(null)
                            const dropOwner = ownerSet.find(o => o.key === dragging)
                            if(!dragging || !dropOwner){ setDragging(null); return }
                            const targets = selectedFloors.length>1 ? selectedFloors : [floor.id]
                            if(targets.length>1){ targets.forEach(fId=>assignOwner(fId,null,dropOwner)); setSelectedFloors([]) }
                            else assignOwner(floor.id, i, dropOwner)
                            setDragging(null)
                          }
                          if(!u){
                            return (
                              <div key={i}
                                onDragOver={e=>{e.preventDefault();e.stopPropagation();setDragTarget(floor.id)}}
                                onDrop={onTramoDrop}
                                className="sp-block-empty"
                                style={{width:wpct,flexShrink:0,borderColor:isTgt?'var(--pdb-blue)':undefined,color:isTgt?'var(--pdb-blue)':undefined}}
                                title={`Tramo ${usoInfo(tr.uso).label} · ${tr.sup.toLocaleString('es-ES')} m² · sin propietario`}>
                                {isTgt?<><ArrowDown size={11} strokeWidth={2}/> Soltar</>:`${tr.sup.toLocaleString('es-ES')} m² · sin propietario`}
                              </div>
                            )
                          }
                          const col = ownerColor(u.n)
                          const initials = (u.n||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()
                          const isHL = hoverKey === 'owner:'+(u.prop_id || u.n)
                          // "Propietario desconocido" (placeholder de una venta) admite soltar
                          // una cuenta del panel encima para completarlo/sustituirlo → sincroniza.
                          const isUnknown = !u.prop_id && u.n === 'Propietario desconocido'
                          return (
                            <div key={i}
                              onDragOver={isUnknown
                                ? e=>{e.preventDefault();e.stopPropagation();setDragTarget(floor.id)}
                                : e=>{e.preventDefault();e.stopPropagation()}}
                              onDrop={isUnknown ? onTramoDrop : undefined}
                              title={isUnknown
                                ? `${u.n} · arrastra una cuenta del panel para asignar el propietario`
                                : `${u.n} · ${tr.sup.toLocaleString('es-ES')} m² · ${usoInfo(tr.uso).label}`}
                              className={`sp-block${isHL?' sp-block-hl':''}`}
                              style={{width:wpct,background:col+(isHL?'2E':'18'),border:`1px ${isUnknown?'dashed':'solid'} ${isHL?col:col+'88'}`,flex:'unset',flexShrink:0,position:'relative',overflow:'visible',boxShadow:isHL?`0 0 0 2px ${col}, 0 2px 12px ${col}66`:undefined,transform:isHL?'scale(1.02)':undefined,zIndex:isHL?2:undefined,transition:'box-shadow 120ms ease, transform 120ms ease'}}
                            >
                              <button onClick={e=>{e.stopPropagation();removeOwnerTramo(floor.id,i)}}
                                style={{position:'absolute',top:-5,right:-5,width:14,height:14,borderRadius:7,background:'#dc2626',color:'#fff',border:'1.5px solid #fff',fontSize:9,lineHeight:1,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0,fontWeight:700,zIndex:2}}>✕</button>
                              <div className="sp-block-content">
                                <div className="sp-block-avatar" style={{background:col}}>{initials}</div>
                                <span className="sp-block-name" style={{color:col}}>{u.n}</span>
                                <span className="sp-block-meta" style={{color:col,marginLeft:'auto'}}>{tr.sup.toLocaleString('es-ES')} m²</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="sp-row-total">{rowSup.toLocaleString('es-ES')} m²</div>
                    <div/>
                  </div>
                )
              })
              })()}
            </div>
          </div>
        )
      })()}

      {/* ══ ARRENDATARIOS ══ */}
      {view==='arr' && (()=>{
        // tenantSet = lista deduplicada de chips {key, ref, name}.
        //   key = ref si lo hay, sino name → identifica el chip de forma estable.
        //   ref = id del registro arrendatario (ARR-...). Permite distinguir
        //         varios 'Desconocido' o sobrevivir a renames sin romper match.
        // extraTenants admite tanto strings (legacy) como {ref, name}.
        const _seen = new Set()
        const tenantSet = []
        const _push = (entry) => {
          if (!entry || _seen.has(entry.key)) return
          _seen.add(entry.key); tenantSet.push(entry)
        }
        for (const e of (extraTenants || [])) {
          if (typeof e === 'string') _push({ key: e, ref: null, name: e })
          else if (e && e.name)      _push({ key: e.ref || e.name, ref: e.ref || null, name: e.name, renta: e.renta })
        }
        for (const r of (edif.arr || [])) {
          for (const u of (r.units || [])) {
            if (u.type==='ten' || u.type==='rt' || u.type==='pk') {
              _push({ key: u.arr_ref || u.n, ref: u.arr_ref || null, name: u.n, renta: u.renta })
            }
          }
        }
        const ARR_COLORS = ['#5a4828','#0f766e','#6b5b8e','#b45309','#be185d','#065f46']
        const tenantIndexByKey = Object.fromEntries(tenantSet.map((t,i) => [t.key, i]))
        const tenantColor = (n) => {
          // n puede ser nombre legacy (sin ref). Buscar primer chip cuyo name coincide.
          const i = tenantSet.findIndex(t => t.name === n)
          return ARR_COLORS[(i >= 0 ? i : 0) % ARR_COLORS.length]
        }
        const TYPE_COLORS = {
          ten: {bg:'#f5efe5',bd:'#93c5fd',col:'#5a4828'},
          vac: {bg:'#fff8ec',bd:'#fcd34d',col:'#d97706'},
          com: {bg:'#dcfce7',bd:'#86efac',col:'#15803d'},
          rt:  {bg:'#fce7f3',bd:'#fbcfe8',col:'#ec4899'},
          pk:  {bg:'#f1f5f9',bd:'#94a3b8',col:'#475569'},
        }
        const typeLabel = (u) => {
          if(u.type==='vac') return u.oferta ? u.oferta : ''
          return u.n
        }
        return (
          <div className={`sp-body sp-body-v2 ${sidebarCollapsed?'is-collapsed':''}`}>

            {/* ── SIDEBAR ARRENDATARIOS + OFERTAS ── */}
            <aside className="sp-sidebar-v2">
              <button
                type="button"
                className="sp-sidebar-toggle"
                onClick={()=>setSidebarCollapsed(v=>!v)}
                title={sidebarCollapsed?'Desplegar panel':'Plegar panel'}
              >
                {sidebarCollapsed ? '›' : '‹'}
              </button>

              <SidebarSection
                label="Arrendatarios"
                count={tenantSet.length}
                open={tenPanelOpen}
                onToggle={()=>setTenPanelOpen(v=>!v)}
                collapsed={sidebarCollapsed}
                dot={ARR_COLORS[0]}
                actionLabel="+ Añadir"
                onAction={onAddTenant}
              >
                {tenantSet.length===0 ? (
                  <div className="sp-sidebar-empty">Aún no hay arrendatarios</div>
                ) : tenantSet.map((t,i)=>{
                  const col = ARR_COLORS[i%ARR_COLORS.length]
                  const dragKey = 'ten:'+t.key
                  const dupName = tenantSet.filter(x => x.name === t.name).length > 1
                  return (
                    <div key={t.key} draggable className="sp-chip-big"
                      onDragStart={()=>setDragging(dragKey)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      onMouseEnter={()=>setHoverKey('ten:'+(t.ref || t.name))}
                      onMouseLeave={()=>setHoverKey(null)}
                      onClick={() => {
                        if (dragging) return
                        spNavigate('ficha-arrendatario', {
                          tenantName: t.name,
                          arrRef: t.ref,
                          fromActivoRef: activoRef,
                          fromActivoNombre: activoNombre,
                          fromActivoTab: 'at-stacking',
                        })
                      }}
                      title={`Ver ficha de ${t.name}`}
                      style={{
                        border:`1px solid ${col}88`,background:col+'18',
                        opacity:dragging&&dragging!==dragKey?.4:1,
                        boxShadow:dragging===dragKey?`0 2px 8px ${col}44`:'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span className="sp-chip-big-dot" style={{background:col}}/>
                      <span className="sp-chip-big-label" style={{color:col,textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:2}}>
                        {t.name}
                        {dupName && t.ref && <span style={{ marginLeft:4, fontSize:9, color:col, opacity:0.7, fontWeight:500, textDecoration:'none' }}>· {t.ref.slice(-6)}</span>}
                      </span>
                    </div>
                  )
                })}
              </SidebarSection>

              <SidebarSection
                label="Ofertas activas"
                count={extraOfertas.length}
                open={ofrPanelOpen}
                onToggle={()=>setOfrPanelOpen(v=>!v)}
                collapsed={sidebarCollapsed}
                dot="#16a34a"
              >
                {extraOfertas.length === 0
                  ? <div className="sp-sidebar-empty">Sin ofertas. Créalas desde Desglose.</div>
                  : extraOfertas.map((ofr,idx)=>{
                      const COLS=['#16a34a','#8a6d40','#d97706','#6b5b8e']
                      const col=COLS[idx%COLS.length]
                      const dragKey='ofr:'+ofr.nombre
                      return (
                        <div key={ofr.id} draggable className="sp-chip-big"
                          onDragStart={()=>setDragging(dragKey)}
                          onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                          onMouseEnter={()=>setHoverKey('ofr:'+ofr.nombre)}
                          onMouseLeave={()=>setHoverKey(null)}
                          onClick={() => {
                            if (dragging) return
                            spNavigate('ficha-oferta', {
                              ofertaRef: ofr.ref || ofr.id || ofr.nombre,
                              tab: 'of-espacios',
                              fromActivoRef: activoRef,
                              fromActivoNombre: activoNombre,
                              fromActivoTab: 'at-stacking',
                            })
                          }}
                          title={`Ver ficha de ${ofr.nombre}`}
                          style={{
                            border:`1px solid ${col}88`,background:col+'18',
                            opacity:dragging&&dragging!==dragKey?.4:1,
                            boxShadow:dragging===dragKey?`0 2px 8px ${col}44`:'none',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="sp-chip-big-dot" style={{background:col}}/>
                          <span className="sp-chip-big-label" style={{color:col,textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:2}}>{ofr.nombre}</span>
                        </div>
                      )
                    })
                }
              </SidebarSection>
            </aside>

            {/* ── GRID PLANTAS (driven by edif.floors) ── */}
            <div style={{minWidth:0}}>
              <div className="sp-table-head" style={{gridTemplateColumns:'20px 40px 1fr 80px 44px'}}>
                <div/>
                <div>Planta</div>
                <div>Arrendatario · oferta</div>
                <div style={{textAlign:'right'}}>Sup.</div>
                <div/>
              </div>
              {(()=>{
                const maxFloorSup=Math.max(...edif.floors.map(f=>f.sup),1)
                // Set de nombres válidos de oferta (los que sí están en BD).
                // Sirve para FILTRAR vac units huérfanas del render: el caso
                // 'Disp 2 en Albatros' que aparecía sin card en sidebar
                // porque su oferta no existe en la tabla ofertas.
                const validOfertaNames = new Set((extraOfertas || []).map(o => o.nombre).filter(Boolean))
                const filterUnits = (us) => (us || []).filter(u => {
                  if (u.type !== 'vac') return true
                  if (!u.oferta) return false
                  return validOfertaNames.has(u.oferta)
                })
                return edif.floors.map(floor=>{
                const barH = Math.max(38, Math.round((floor.sup / maxFloorSup) * 58))
                const tramos   = floor.principal || []
                const arrRow   = (edif.arr||[]).find(r=>r.p===floor.id)
                const arrUnits = filterUnits(arrRow?.units)
                const slots    = arrSlotsFor(tramos, arrUnits)
                const rowSup   = arrRow?.sup ?? floor.sup
                const noUso    = tramos.length===0
                const isEmpty  = !noUso && slots.every(occ=>occ.length===0)
                const isTgt    = dragTarget===floor.id
                const isSel    = selectedFloors.includes(floor.id)
                // Render de un ocupante (arrendatario / oferta / común / parking)
                // dentro de su tramo. wpct = ancho relativo AL TRAMO.
                const renderOccupant = (u, wpct) => {
                  const rawIdx = (arrRow?.units || []).indexOf(u)
                  const editable = u.type==='ten' || u.type==='vac'
                  const isEd = editPA?.layer==='arr' && editPA?.rowP===floor.id && editPA?.idx===rawIdx
                  let bg, bd, col
                  if (u.type==='ten') { col = tenantColor(u.n); bg = col+'18'; bd = col+'88' }
                  else if (u.type==='vac') {
                    const OCOLS=['#16a34a','#8a6d40','#d97706','#6b5b8e']
                    const oIdx = extraOfertas.findIndex(o=>o.nombre===u.oferta)
                    col = oIdx>=0 ? OCOLS[oIdx%OCOLS.length] : OCOLS[0]; bg=col+'12'; bd=col+'55'
                  } else { const tc=TYPE_COLORS[u.type]||TYPE_COLORS.ten; bg=tc.bg; bd=tc.bd; col=tc.col }
                  const label = typeLabel(u)
                  const isHL = (u.type==='ten' && hoverKey === 'ten:'+(u.arr_ref || u.n))
                            || (u.type==='vac' && hoverKey === 'ofr:'+u.oferta)
                  return (
                    <div key={rawIdx}
                      title={`${label} · ${u.sup.toLocaleString('es-ES')} m²${u.renta>0?` · ${u.renta} €/m²/mes`:''}${u.brk?` · break ${u.brk}`:''}`}
                      onClick={editable ? e=>{e.stopPropagation();if(isEd)setEditPA(null);else{setEditPA({layer:'arr',rowP:floor.id,idx:rawIdx});setEditPASup(String(u.sup));setEditPARenta(String(u.renta??''));setEditPATotal(String(u.precio_total??''))}} : undefined}
                      className={`sp-block${isHL?' sp-block-hl':''}`}
                      style={{width:wpct,background:isHL?col+'33':bg,border:`1px solid ${isHL?col:bd}`,flex:'unset',flexShrink:0,position:'relative',overflow:'visible',flexDirection:'column',minHeight:barH,justifyContent:'center',boxShadow:isHL?`0 0 0 2px ${col}, 0 2px 12px ${col}66`:undefined,transform:isHL?'scale(1.02)':undefined,zIndex:isHL?2:undefined,transition:'box-shadow 120ms ease, transform 120ms ease'}}
                    >
                      {isEd ? (
                        <div style={{display:'flex',flexDirection:'column',gap:6,padding:'6px 8px',background:'#fff',border:`1.5px solid ${col}`,borderRadius:6,boxShadow:`0 4px 14px ${col}33`}} onClick={e=>e.stopPropagation()}>
                          <div style={{display:'flex',gap:5,alignItems:'center'}}>
                            <input type="number" value={editPASup} onChange={e=>setEditPASup(e.target.value)} autoFocus
                              onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                              style={{width:90,padding:'6px 8px',fontSize:13,fontWeight:600,border:`1px solid ${col}`,borderRadius:4,fontFamily:'var(--mono)',textAlign:'right'}}/>
                            <span style={{fontSize:11,color:col,fontWeight:600}}>m²</span>
                          </div>
                          {u.type==='ten' && (
                            <div style={{display:'flex',gap:5,alignItems:'center'}}>
                              <input type="number" step="0.01" value={editPARenta} onChange={e=>setEditPARenta(e.target.value)}
                                onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                                placeholder="Renta cierre"
                                style={{width:100,padding:'6px 8px',fontSize:13,fontWeight:600,border:`1px solid ${col}`,borderRadius:4,fontFamily:'var(--mono)',textAlign:'right'}}/>
                              <span style={{fontSize:11,color:col,fontWeight:600}}>€/m²/mes</span>
                            </div>
                          )}
                          {u.type==='vac'&&u.oferta&&(()=>{
                            const ofMeta = extraOfertas.find(o => o.nombre === u.oferta)
                            const isVenta = ofMeta?.tipoOperacion === 'Venta'
                            const unitLabel = isVenta ? '€/m²' : '€/m²/mes'
                            return (
                              <>
                                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                                  <input type="number" step="0.01" value={editPARenta} onChange={e=>setEditPARenta(e.target.value)}
                                    onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                                    placeholder={unitLabel}
                                    style={{width:100,padding:'6px 8px',fontSize:13,fontWeight:600,border:`1px solid ${col}`,borderRadius:4,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                  <span style={{fontSize:11,color:col,fontWeight:600}}>{unitLabel}</span>
                                </div>
                                {isVenta && (
                                  <div style={{display:'flex',gap:5,alignItems:'center'}}>
                                    <input type="number" step="1" value={editPATotal} onChange={e=>setEditPATotal(e.target.value)}
                                      onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                                      placeholder="Total €"
                                      style={{width:120,padding:'6px 8px',fontSize:13,fontWeight:600,border:`1px solid ${col}`,borderRadius:4,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                    <span style={{fontSize:11,color:col,fontWeight:600}}>€ total</span>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                          <button onClick={savePASup} style={{padding:'6px 10px',background:col,color:'#fff',border:'none',borderRadius:4,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>✓ Guardar</button>
                        </div>
                      ) : (
                        <>
                          {editable && (
                            <button onClick={e=>{e.stopPropagation();removeArrUnit(floor.id,rawIdx)}}
                              style={{position:'absolute',top:-5,right:-5,width:14,height:14,borderRadius:7,background:'#dc2626',color:'#fff',border:'1.5px solid #fff',fontSize:9,lineHeight:1,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0,fontWeight:700,zIndex:2}}>✕</button>
                          )}
                          <div className="sp-block-content">
                            {u.type==='ten' && u.arr_ref ? (
                              <span className="sp-block-name"
                                title="Ir a la ficha del arrendatario"
                                onClick={e=>{
                                  e.stopPropagation()
                                  spNavigate('ficha-arrendatario', {
                                    arrRef: u.arr_ref,
                                    tenantName: u.n,
                                    fromActivoRef: activoRef,
                                    fromActivoNombre: activoNombre,
                                    fromActivoTab: 'at-stacking',
                                  })
                                }}
                                style={{color:col, textDecoration:'underline', cursor:'pointer'}}>{label}</span>
                            ) : (
                              <span className="sp-block-name" style={{color:col}}>{label}</span>
                            )}
                            <span className="sp-block-meta" style={{color:col}}>{(()=>{
                              const ofMeta = u.type==='vac' ? extraOfertas.find(o => o.nombre === u.oferta) : null
                              const isVenta = ofMeta?.tipoOperacion === 'Venta'
                              const sup = u.sup.toLocaleString('es-ES') + ' m²'
                              if (u.renta>0) {
                                const unit = isVenta ? '€/m²' : '€/m²/mes'
                                const tot = isVenta && u.precio_total>0 ? ` · ${Number(u.precio_total).toLocaleString('es-ES')} €` : ''
                                return `${sup} · ${u.renta}${unit}${tot}`
                              }
                              return sup
                            })()}</span>
                          </div>
                          {u.type==='vac' && <span className="sp-block-badge" style={{color:col}}>OFERTA</span>}
                          {u.type==='ten' && <span className="sp-block-badge" style={{color:col}}>ARREND.</span>}
                          {u.brk&&<span style={{fontSize:8,color:u.brkColor||col,fontWeight:600}}>⊙ {u.brk}</span>}
                        </>
                      )}
                    </div>
                  )
                }
                return (
                  <div key={floor.id}
                    onClick={()=>setSelectedFloors(p=>p.includes(floor.id)?p.filter(x=>x!==floor.id):[...p,floor.id])}
                    onDragOver={e=>{
                      if(noUso){e.dataTransfer.dropEffect='none';return}
                      e.preventDefault();setDragTarget(floor.id)
                    }}
                    onDragLeave={()=>setDragTarget(null)}
                    onDrop={e=>{
                      e.preventDefault();setDragTarget(null)
                      // Sin uso principal no hay tramos. El drop real se hace por
                      // tramo (abajo).
                      if(noUso){ setDropWarning(floor.id); setTimeout(()=>setDropWarning(null),3000); setDragging(null) }
                    }}
                    className="sp-row"
                    style={{
                      gridTemplateColumns:'20px 40px 1fr 80px 44px',
                      borderBottom: floor.id==='PB' ? '3px solid var(--ink-2)' : undefined,
                      background:dropWarning===floor.id?'#fff1f2':isTgt?'var(--pdb-blue-50)':isSel?'#f0f9ff':'var(--surface)',
                      outline:dropWarning===floor.id?'1.5px solid #fca5a5':isSel||isTgt?'1.5px solid var(--pdb-blue)':'none',
                      cursor:'pointer',
                      // Ancho proporcional (capa Arrendatarios + ofertas) — misma rejilla que Uso principal
                      width: `${Math.max((floor.sup / maxFloorSup) * 100, 30)}%`,
                      minWidth: 280,
                    }}>

                    <div/>
                    <div className={`sp-row-floor${isEmpty?' empty':''}`} style={{color:isSel?'var(--pdb-blue)':undefined}}>{floor.id}</div>

                    <div className="sp-row-blocks" style={{flexDirection:'column',gap:3,padding:'6px 0',alignItems:'stretch'}}>
                      {dropWarning===floor.id && (
                        <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 8px',background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:4,fontSize:10,color:'#dc2626',fontWeight:600}}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:4}}><AlertTriangle size={11} strokeWidth={1.75}/> Asigna primero un uso principal en esta planta</span>
                        </div>
                      )}
                      {/* Referencia uso principal (gris tenue) */}
                      {floor.principal.length>0 && (
                        <div style={{display:'flex',gap:1,height:4,borderRadius:2,overflow:'hidden',opacity:.3}}>
                          {floor.principal.map((u,i)=>{
                            const info=usoInfo(u.uso)
                            return <div key={i} style={{width:`${(u.sup/floor.sup)*100}%`,background:info.color,flexShrink:0}}/>
                          })}
                        </div>
                      )}
                      {/* Bloques de arrendatario = tramos heredados de Uso principal
                          (los muros) con 1+ ocupantes DENTRO de cada uno. Los m² del
                          tramo no se editan aquí; solo se reparte dentro del muro (B4). */}
                      <div style={{display:'flex',gap:4,minHeight:barH}}>
                        {noUso ? (
                          <div className="sp-block-empty" style={{borderColor:isTgt?'var(--pdb-blue)':undefined,color:isTgt?'var(--pdb-blue)':undefined}}>
                            Asigna primero un uso principal en esta planta
                          </div>
                        ) : tramos.map((tr,i)=>{
                          const occ  = slots[i] || []
                          const used = occ.reduce((s,u)=>s+(u.sup||0),0)
                          const free = tr.sup - used
                          const info = usoInfo(tr.uso)
                          const assignable = tr.uso!=='parking' && tr.uso!=='comun'
                          const twpct = `${(tr.sup/floor.sup)*100}%`
                          const onTramoDrop = (e)=>{
                            e.preventDefault(); e.stopPropagation(); setDragTarget(null)
                            if(!dragging){ return }
                            const isTen = dragging.startsWith('ten:')
                            const isOfr = dragging.startsWith('ofr:')
                            if(!assignable || (!isTen && !isOfr)){ setDragging(null); return }
                            // Validación: un tramo no mezcla oferta + arrendatario.
                            const hasTen = occ.some(u=>u.type==='ten')
                            const hasVac = occ.some(u=>u.type==='vac')
                            if((isTen && hasVac) || (isOfr && hasTen)){
                              window.alert('Un tramo no puede tener oferta y arrendatario a la vez. Retira lo que haya antes.')
                              setDragging(null); return
                            }
                            const dragKey = isTen ? dragging.slice(4) : null
                            const dropTenant = dragKey ? (tenantSet.find(t=>t.key===dragKey) || {ref:null,name:dragKey}) : null
                            const ofrName = isOfr ? dragging.slice(4) : null
                            // Vínculo estable por ref de la oferta (no por nombre): así
                            // renombrar/dar de baja no rompe la relación con el stacking.
                            const ofrRef = isOfr ? (extraOfertas.find(o => (o.nombre || o.ref) === ofrName)?.ref || null) : null
                            const mk = () => isTen
                              ? {type:'ten', arr_ref: dropTenant.ref, n: dropTenant.name, renta: Number(dropTenant.renta) || 0}
                              : {type:'vac', oferta: ofrName, oferta_ref: ofrRef, renta:0}
                            // Multi-selección: mismo ocupante al primer tramo libre de
                            // cada planta seleccionada (p. ej. un inquilino en P5–P8).
                            const targets = selectedFloors.length>1 ? selectedFloors : [floor.id]
                            if(targets.length>1){ targets.forEach(fId=>assignTenant(fId, null, mk)); setSelectedFloors([]) }
                            else assignTenant(floor.id, i, mk)
                            setDragging(null)
                          }
                          return (
                            <div key={i}
                              onDragOver={assignable && free>0 ? e=>{e.preventDefault();e.stopPropagation();setDragTarget(floor.id)} : undefined}
                              onDrop={assignable ? onTramoDrop : undefined}
                              title={`Tramo ${info.label} · ${tr.sup.toLocaleString('es-ES')} m²`}
                              style={{width:twpct,flexShrink:0,display:'flex',gap:2,padding:2,borderRadius:6,background:(info.bg||'#f8fafc'),border:`1px dashed ${(info.bd||info.color||'#cbd5e1')}88`,minHeight:barH,boxSizing:'border-box'}}>
                              {occ.map(u=>renderOccupant(u, `${((u.sup||0)/tr.sup)*100}%`))}
                              {free>0 && (
                                <div className="sp-block-empty" style={{flex:1,minWidth:16,flexDirection:'column',gap:1,fontSize:9,borderColor:isTgt?'var(--pdb-blue)':undefined,color:isTgt?'var(--pdb-blue)':undefined}}>
                                  {assignable
                                    ? (isTgt?<><ArrowDown size={11} strokeWidth={2}/> Soltar</>:<span>{free.toLocaleString('es-ES')} m²</span>)
                                    : <span>{info.label}</span>}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="sp-row-total">{rowSup.toLocaleString('es-ES')} m²</div>
                    <div/>
                  </div>
                )
              })
              })()}
              {/* ── Resumen Espacios asignados (auto-sync) ── */}
              {extraOfertas.length > 0 && (()=>{
                const assigned = (edif.arr||[]).flatMap(r=>
                  r.units.filter(u=>u.type==='vac'&&u.oferta).map(u=>({planta:r.p,oferta:u.oferta,sup:u.sup,renta:u.renta||0}))
                )
                if(!assigned.length) return null
                const totalSup=assigned.reduce((s,a)=>s+a.sup,0)
                const totalRenta=assigned.filter(a=>a.renta>0).reduce((s,a)=>s+a.renta*a.sup,0)
                return (
                  <div style={{margin:'12px 8px 8px',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',overflow:'hidden'}}>
                    <div style={{padding:'7px 12px',background:'var(--accent-lt)',borderBottom:'1px solid var(--accent-bd)',display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:10,fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'.04em'}}>Espacios asignados</span>
                      <span style={{fontSize:9,background:'var(--green-lt)',color:'var(--green)',border:'1px solid var(--green-bd)',padding:'1px 6px',borderRadius:10,fontWeight:700}}>ↈ Sincronizado</span>
                      <span style={{marginLeft:'auto',fontSize:10,fontWeight:700,fontFamily:'var(--mono)',color:'var(--text2)'}}>{totalSup.toLocaleString()} m²</span>
                    </div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr>
                        {(()=>{
                          // Detección por mayoría: si la oferta vinculada es Venta, ajustamos los títulos
                          const tipos = assigned.map(a => extraOfertas.find(o=>o.nombre===a.oferta)?.tipoOperacion).filter(Boolean)
                          const isVenta = tipos.length>0 && tipos.every(t => t==='Venta')
                          const headers = isVenta
                            ? ['Planta','Oferta','Superficie','Precio €/m²','Precio total']
                            : ['Planta','Oferta','Superficie','Renta €/m²/mes','Renta mensual']
                          return headers.map(h =>
                            <th key={h} style={{padding:'5px 10px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                          )
                        })()}
                      </tr></thead>
                      <tbody>
                        {assigned.map((a,i)=>(
                          <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                            <td style={{padding:'5px 10px'}}><span className="tag tag-gray" style={{fontSize:9}}>{a.planta}</span></td>
                            <td style={{padding:'5px 10px',color:'var(--accent)',fontSize:10,fontWeight:500}}>{a.oferta}</td>
                            <td style={{padding:'5px 10px',fontFamily:'var(--mono)',fontWeight:600}}>{a.sup.toLocaleString()}</td>
                            <td style={{padding:'5px 10px',fontFamily:'var(--mono)',color:a.renta?'var(--text2)':'var(--text4)',fontStyle:a.renta?'normal':'italic'}}>{a.renta?`${a.renta} €`:'— clic para editar'}</td>
                            <td style={{padding:'5px 10px',fontFamily:'var(--mono)',fontWeight:600,color:'var(--green)'}}>{a.renta?`${(a.renta*a.sup).toLocaleString(undefined,{maximumFractionDigits:0})} €`:'—'}</td>
                          </tr>
                        ))}
                        <tr style={{background:'var(--gray-lt)',borderTop:'2px solid var(--border)'}}>
                          <td colSpan={2} style={{padding:'5px 10px',fontSize:10,fontWeight:700,color:'var(--text3)'}}>TOTAL</td>
                          <td style={{padding:'5px 10px',fontFamily:'var(--mono)',fontWeight:800}}>{totalSup.toLocaleString()}</td>
                          <td/>
                          <td style={{padding:'5px 10px',fontFamily:'var(--mono)',fontWeight:800,color:'var(--green)'}}>{totalRenta?`${totalRenta.toLocaleString(undefined,{maximumFractionDigits:0})} €`:'—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          </div>
        )
      })()}

      {/* ══ MODAL SPLIT ══ */}
      {splitModal&&(()=>{
        const floor=edif.floors.find(f=>f.id===splitModal.floorId)
        const info=usoInfo(splitModal.usoId)
        return (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}
            onClick={()=>setSplitModal(null)}>
            <div style={{background:'var(--surface)',borderRadius:'var(--r2)',padding:20,width:310,boxShadow:'0 8px 32px rgba(0,0,0,.18)'}}
              onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:'var(--text1)'}}>Dividir planta {floor?.id}</div>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:12,lineHeight:1.5}}>
                La planta está completa. Indica cuántos m² asignar a <strong style={{color:info.color}}>{info.label}</strong> — el último uso existente se reducirá proporcionalmente.
              </div>
              <input type="number" placeholder="m² a asignar" value={splitSup} onChange={e=>setSplitSup(e.target.value)}
                autoFocus
                style={{width:'100%',padding:'7px 10px',border:'1px solid var(--border)',borderRadius:5,fontSize:12,
                  fontFamily:'var(--mono)',marginBottom:10,boxSizing:'border-box'}}
                onKeyDown={e=>{if(e.key==='Enter')document.getElementById('sp-split-confirm')?.click()}}
              />
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setSplitModal(null)}
                  style={{padding:'6px 14px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                  Cancelar
                </button>
                <button id="sp-split-confirm"
                  onClick={()=>{
                    const sup=parseFloat(splitSup)
                    if(!isNaN(sup)&&sup>0&&floor){
                      updBuilding(b=>({...b,floors:b.floors.map(f=>{
                        if(f.id!==splitModal.floorId) return f
                        const last=f.principal[f.principal.length-1]
                        if(!last||last.sup<=sup) return {...f,principal:[...f.principal,{uso:splitModal.usoId,sup}]}
                        return {...f,principal:[...f.principal.slice(0,-1),{...last,sup:last.sup-sup},{uso:splitModal.usoId,sup}]}
                      })}))
                    }
                    setSplitModal(null); setSplitSup('')
                  }}
                  style={{padding:'6px 14px',background:info.color,color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
                  Asignar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}

/* ── Tab: Información general ── */
const CUENTAS_ASSET_MANAGER = [
  'Merlín Properties SOCIMI','Colonial SOCIMI','Blackstone Real Estate','AXA IM Real Assets',
  'CBRE Global Investors','Generali Real Estate','Nuveen Real Estate','DWS Real Estate',
  'Allianz Real Estate','PGGM','Patrizia','Inbeni Real Estate','Barings Core Spain SOCIMI',
  'FREO Investments Spain SL','Invesco Real Estate','Amundi Real Estate',
]

function AssetManagerSearch({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const results = CUENTAS_ASSET_MANAGER.filter(c => c.toLowerCase().includes(query.toLowerCase()))
  return (
    <div style={{position:'relative'}}>
      <div style={{display:'flex',gap:4,alignItems:'center'}}>
        <span style={{fontSize:12,color:'var(--text2)',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {value || <span style={{color:'var(--text4)'}}>—</span>}
        </span>
        <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'1px solid var(--border)',borderRadius:4,padding:'2px 6px',cursor:'pointer',color:'var(--text3)',flexShrink:0,display:'inline-flex',alignItems:'center'}}><Search size={12} strokeWidth={1.75}/></button>
        {value && <button onClick={()=>onChange('')} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'var(--text4)',padding:'0 2px',flexShrink:0}}>×</button>}
      </div>
      {open && (
        <div style={{position:'absolute',top:'110%',left:0,right:0,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,boxShadow:'0 4px 16px rgba(0,0,0,.12)',zIndex:200,maxHeight:180,overflow:'auto'}}>
          <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar cuenta…" style={{width:'100%',padding:'6px 10px',border:'none',borderBottom:'1px solid var(--border)',fontSize:11,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}}/>
          {results.map(c=>(
            <div key={c} onClick={()=>{onChange(c);setOpen(false);setQuery('')}}
              style={{padding:'6px 10px',fontSize:11,cursor:'pointer',borderBottom:'1px solid var(--gray-lt)'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--accent-lt)'}
              onMouseLeave={e=>e.currentTarget.style.background=''}>
              {c}
            </div>
          ))}
          {results.length===0 && <div style={{padding:'8px 10px',fontSize:11,color:'var(--text4)'}}>Sin resultados</div>}
        </div>
      )}
    </div>
  )
}

/* ── GOOGLE MAPS API KEY ─────────────────────────────────────
   Añade aquí tu clave de Google Maps Platform (Places API).
   En Google Cloud Console activa: Maps JavaScript API + Places API.
   ──────────────────────────────────────────────────────────── */
const GMAPS_API_KEY = 'AIzaSyArChBWnXkvyrdP-6uxTCDwFMjluO_QiSo'

function FLabel({ children }) {
  return <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>{children}</div>
}

/* ── MULTIMEDIA TAB ── */
const FOTO_TIPOS   = ['Fotografía','Plano']
const FOTO_SUB_FOTO = ['Interior','Exterior','Zonas comunes','Parking','Fotos aéreas']
const FOTO_SUB_PLAN = ['Plano de planta','Sección','Axonométrica']

const MOCK_MEDIA = [
  { id:1, tipo:'Fotografía', subtipo:'Exterior',        desc:'Fachada principal',          principal:true,  date:'07/02/2026', src:'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80' },
  { id:2, tipo:'Fotografía', subtipo:'Exterior',        desc:'Vista lateral edificio',     principal:false, date:'07/02/2026', src:'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80' },
  { id:3, tipo:'Fotografía', subtipo:'Exterior',        desc:'Acceso principal',           principal:false, date:'07/02/2026', src:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
  { id:4, tipo:'Fotografía', subtipo:'Interior',        desc:'Planta tipo — open space',   principal:false, date:'07/02/2026', src:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80' },
  { id:5, tipo:'Fotografía', subtipo:'Interior',        desc:'Sala de reuniones',          principal:false, date:'07/02/2026', src:'https://images.unsplash.com/photo-1497366754035-f200968a7db3?w=800&q=80' },
  { id:6, tipo:'Fotografía', subtipo:'Zonas comunes',   desc:'Lobby recepción',            principal:false, date:'07/02/2026', src:'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&q=80' },
  { id:7, tipo:'Plano',      subtipo:'Plano de planta', desc:'Planta tipo — distribución', principal:false, date:'20/03/2026', src:'https://images.unsplash.com/photo-1541888846341-b14b40e47e34?w=800&q=80' },
]

function TabMultimedia({ activoId }) {
  const [media, setMedia]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [busy, setBusy]         = useState(false)
  const [filter, setFilter]     = useState('todos')
  const [dragging, setDragging] = useState(false)
  const [uploadMode, setUpload] = useState(false)
  const [newTipo, setNewTipo]   = useState('Fotografía')
  const [newSub,  setNewSub]    = useState('Exterior')
  const [newDesc, setNewDesc]   = useState('')
  const [lightbox, setLightbox] = useState(null)
  const fileRef = useRef(null)

  // Carga real desde fotos_activo. Convención (sin migración): la columna `tipo`
  // guarda el SUBTIPO (Exterior, Interior, Plano de planta…). Es plano si el
  // subtipo está en FOTO_SUB_PLAN. La foto principal es la de orden 0.
  async function reload() {
    if (!activoId) { setMedia([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.from('fotos_activo')
      .select('id, url, nombre, tipo, orden').eq('activo_id', activoId).order('orden')
    setMedia((data || []).map(r => {
      const esPlano = FOTO_SUB_PLAN.includes(r.tipo)
      return {
        id: r.id,
        tipo: esPlano ? 'Plano' : 'Fotografía',
        subtipo: r.tipo || (esPlano ? 'Plano de planta' : 'Exterior'),
        desc: r.nombre || '',
        principal: !esPlano && r.orden === 0,
        src: r.url || '',
        date: '',
      }
    }))
    setLoading(false)
  }
  useEffect(() => { reload() }, [activoId])

  const displayed = filter === 'todos' ? media
    : filter === 'fotografias' ? media.filter(m=>m.tipo==='Fotografía')
    : media.filter(m=>m.tipo==='Plano')

  const setPrincipal = async (id) => {
    if (!activoId) return
    setBusy(true)
    await supabase.from('fotos_activo').update({ orden:1 }).eq('activo_id', activoId).in('tipo', FOTO_SUB_FOTO)
    await supabase.from('fotos_activo').update({ orden:0 }).eq('id', id)
    setLightbox(null)
    await reload(); setBusy(false)
  }

  const removeMedia = async (id) => {
    setBusy(true)
    await supabase.from('fotos_activo').delete().eq('id', id)
    setLightbox(null)
    await reload(); setBusy(false)
  }

  // Etiquetado posterior · cambia subtipo (columna tipo) y descripción (nombre)
  const updateTag = async (id, subtipo, desc) => {
    setBusy(true)
    await supabase.from('fotos_activo').update({ tipo: subtipo, nombre: desc }).eq('id', id)
    await reload(); setBusy(false)
  }

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'))
    if (!activoId) { window.alert('Guarda primero el activo para poder subir fotos.'); return }
    if (files.length === 0) return
    setBusy(true)
    const esPlano = FOTO_SUB_PLAN.includes(newSub)
    const yaHayPrincipal = media.some(m => m.principal)
    const base = media.length
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(f) })
      const principal = !esPlano && !yaHayPrincipal && i === 0
      await supabase.from('fotos_activo').insert({
        activo_id:    activoId,
        storage_path: `inline/${activoId}/${base + i}-${(f.name || 'img').replace(/[^\w.\-]+/g, '_')}`,
        url:          dataUrl,
        nombre:       newDesc || f.name || `${newSub} ${base + i + 1}`,
        tipo:         newSub,
        orden:        principal ? 0 : base + i + 1,
      })
    }
    setUpload(false); setNewDesc('')
    await reload(); setBusy(false)
  }

  return (
    <div className="tab-content active"><div className="info-pad">
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{fontSize:17,fontWeight:700,color:'var(--text)',letterSpacing:'-.005em'}}>Multimedia</div>
        <div style={{display:'flex',gap:8}}>
          {['todos','fotografias','planos'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{padding:'4px 12px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,cursor:'pointer',fontFamily:'inherit',
                background:filter===f?'var(--accent)':'var(--surface)',color:filter===f?'#fff':'var(--text2)',fontWeight:filter===f?600:400}}>
              {f==='todos'?'Todos':f==='fotografias'?'Fotografías':'Planos'}
            </button>
          ))}
          <button className="ab-btn blue" onClick={()=>setUpload(v=>!v)}>↑ Cargar</button>
        </div>
      </div>

      {/* Upload area */}
      {uploadMode && (
        <div style={{border:'2px dashed var(--accent)',borderRadius:8,padding:20,marginBottom:16,background:'var(--accent-lt)'}}>
          <input ref={fileRef} type="file" multiple accept="image/*" style={{display:'none'}}
            onChange={e=>{ uploadFiles(e.target.files); e.target.value='' }} />
          <div style={{textAlign:'center',marginBottom:14}}>
            <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
              onDrop={e=>{e.preventDefault();setDragging(false);uploadFiles(e.dataTransfer.files)}}
              onClick={()=>fileRef.current?.click()}
              style={{padding:'24px 0',background:dragging?'rgba(37,99,235,.08)':'transparent',borderRadius:6,transition:'background .15s',cursor:'pointer'}}>
              <Upload size={28} strokeWidth={1.5} style={{marginBottom:6,color:'var(--text4)'}}/>
              <div style={{fontSize:12,color:'var(--text3)'}}>Arrastra imágenes aquí o <span style={{color:'var(--accent)',cursor:'pointer',fontWeight:600}}>haz clic para cargar</span></div>
              <div style={{fontSize:10,color:'var(--text4)',marginTop:4}}>{busy ? 'Guardando…' : 'JPG / PNG · se guardan en la PDB'}</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:10,alignItems:'flex-end'}}>
            <div>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Tipo</div>
              <select className="fsel" style={{width:'100%'}} value={newTipo} onChange={e=>{setNewTipo(e.target.value);setNewSub(e.target.value==='Fotografía'?'Exterior':'Plano de planta')}}>
                {FOTO_TIPOS.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Subtipo</div>
              <select className="fsel" style={{width:'100%'}} value={newSub} onChange={e=>setNewSub(e.target.value)}>
                {(newTipo==='Fotografía'?FOTO_SUB_FOTO:FOTO_SUB_PLAN).map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Descripción (opcional)</div>
              <input className="of-inp" style={{width:'100%',boxSizing:'border-box'}} placeholder="Fachada principal..." value={newDesc} onChange={e=>setNewDesc(e.target.value)}/>
            </div>
            <button onClick={()=>fileRef.current?.click()} disabled={busy || !activoId} style={{padding:'5px 14px',background:(busy||!activoId)?'var(--gray-lt)':'var(--accent)',color:(busy||!activoId)?'var(--text4)':'#fff',border:'none',borderRadius:5,fontSize:11,cursor:(busy||!activoId)?'not-allowed':'pointer',fontFamily:'inherit',fontWeight:600}}>Seleccionar archivos</button>
          </div>
          {!activoId && <div style={{fontSize:10,color:'#b45309',marginTop:8}}>Guarda primero el activo para poder subir fotos.</div>}
        </div>
      )}

      {!loading && media.length === 0 && (
        <div style={{padding:'32px 0',textAlign:'center',color:'var(--text4)',fontSize:12}}>Sin multimedia todavía. Pulsa “↑ Cargar” para subir fotos y planos.</div>
      )}

      {/* Galería */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
        {displayed.map(m=>(
          <div key={m.id} style={{border:`2px solid ${m.principal?'var(--accent)':'var(--border)'}`,borderRadius:8,overflow:'hidden',background:'var(--surface)',cursor:'pointer',position:'relative'}}
            onClick={()=>setLightbox(m)}>
            <div style={{height:120,overflow:'hidden',position:'relative',background:'var(--gray-lt)'}}>
              {(m.src && (m.src.startsWith('http') || m.src.startsWith('data:'))) ? (
                <img src={m.src} alt={m.desc} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} loading="lazy"/>
              ) : (
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,color:'var(--text4)'}}>🏢</div>
              )}
              {m.principal && <span style={{position:'absolute',top:6,left:6,background:'var(--accent)',color:'#fff',fontSize:8,fontWeight:700,padding:'2px 7px',borderRadius:8,letterSpacing:'.03em'}}>PRINCIPAL</span>}
            </div>
            <div style={{padding:'6px 8px'}}>
              <div style={{fontSize:10,fontWeight:600,color:'var(--text1)',marginBottom:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.desc}</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                <span style={{fontSize:8,padding:'1px 5px',borderRadius:8,background:m.tipo==='Plano'?'#ede9fe':'#f5efe5',color:m.tipo==='Plano'?'#6b5b8e':'#5a4828',fontWeight:600}}>{m.tipo}</span>
                <span style={{fontSize:8,padding:'1px 5px',borderRadius:8,background:'var(--gray-lt)',color:'var(--text3)',border:'1px solid var(--border)'}}>{m.subtipo}</span>
              </div>
            </div>
            {!m.principal && (
              <button onClick={e=>{e.stopPropagation();setPrincipal(m.id)}}
                style={{position:'absolute',bottom:6,right:6,padding:'2px 7px',fontSize:8,background:'rgba(255,255,255,.9)',border:'1px solid var(--border)',borderRadius:5,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)',backdropFilter:'blur(4px)'}}>
                ★ Principal
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={()=>setLightbox(null)}>
          <div style={{background:'var(--surface)',borderRadius:12,overflow:'hidden',maxWidth:720,width:'92%',boxShadow:'0 24px 64px rgba(0,0,0,.4)'}} onClick={e=>e.stopPropagation()}>
            {(lightbox.src && (lightbox.src.startsWith('http') || lightbox.src.startsWith('data:'))) ? (
              <img src={lightbox.src} alt={lightbox.desc} style={{width:'100%',maxHeight:440,objectFit:'cover',display:'block'}}/>
            ) : (
              <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',fontSize:80,background:'var(--gray-lt)'}}>🏢</div>
            )}
            <div style={{padding:'16px 20px'}}>
              <div style={{display:'flex',gap:6,marginBottom:10,alignItems:'center'}}>
                <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:lightbox.tipo==='Plano'?'#ede9fe':'#f5efe5',color:lightbox.tipo==='Plano'?'#6b5b8e':'#5a4828',fontWeight:600}}>{lightbox.tipo}</span>
                {lightbox.principal && <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:'var(--accent)',color:'#fff',fontWeight:700}}>PRINCIPAL</span>}
              </div>
              {/* Etiquetado · subtipo + descripción, se guarda en la PDB */}
              <div style={{display:'grid',gridTemplateColumns:'150px 1fr auto',gap:8,alignItems:'end',marginBottom:14}}>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Etiqueta</div>
                  <select className="fsel" style={{width:'100%'}} value={lightbox.subtipo} onChange={e=>setLightbox({...lightbox,subtipo:e.target.value})}>
                    <optgroup label="Fotografía">{FOTO_SUB_FOTO.map(s=><option key={s} value={s}>{s}</option>)}</optgroup>
                    <optgroup label="Plano">{FOTO_SUB_PLAN.map(s=><option key={s} value={s}>{s}</option>)}</optgroup>
                  </select>
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Descripción</div>
                  <input className="of-inp" style={{width:'100%',boxSizing:'border-box'}} value={lightbox.desc} onChange={e=>setLightbox({...lightbox,desc:e.target.value})} placeholder="Fachada principal..."/>
                </div>
                <button onClick={()=>updateTag(lightbox.id,lightbox.subtipo,lightbox.desc)} disabled={busy} style={{padding:'8px 14px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Guardar etiqueta</button>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {!lightbox.principal && <button onClick={()=>{setPrincipal(lightbox.id);setLightbox({...lightbox,principal:true})}} style={{padding:'6px 14px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>★ Marcar como principal</button>}
                {(lightbox.src && (lightbox.src.startsWith('http') || lightbox.src.startsWith('data:'))) && (
                  <a href={lightbox.src} download={`${lightbox.desc||'imagen'}.jpg`} target="_blank" rel="noreferrer"
                    style={{padding:'6px 14px',background:'#16a34a',color:'#fff',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:4}}>
                    <ArrowDown size={12} strokeWidth={1.75}/> Descargar
                  </a>
                )}
                <button onClick={()=>removeMedia(lightbox.id)} disabled={busy} style={{padding:'6px 14px',background:'#fef2f2',color:'#b91c1c',border:'1px solid #fca5a5',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Eliminar</button>
                <button onClick={()=>setLightbox(null)} style={{padding:'6px 14px',background:'var(--surface)',color:'var(--text2)',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div></div>
  )
}

/* ── Catastro: llamada directa desde el navegador (CORS abierto) ── */
const USO_CAT_MAP = {
  'Almacén-Estacionamiento': 'Terciario / Aparcamiento',
  'Industrial':              'Industrial',
  'Industria':               'Industrial',
  'Oficinas':                'Terciario / Oficinas',
  'Comercial':               'Terciario / Comercial',
  'Residencial':             'Residencial',
  'Suelo sin edificar':      'Solar',
  'Ocio y Hostelería':       'Terciario / Hostelería',
  'Sanidad y Beneficencia':  'Equipamiento / Sanitario',
  'Cultural':                'Equipamiento / Cultural',
  'Religioso':               'Equipamiento / Religioso',
  'Educación':               'Equipamiento / Educativo',
  'Espectáculos':            'Terciario / Ocio',
  'Deportivo':               'Equipamiento / Deportivo',
}
async function fetchCatastro(lat, lng) {
  // Parsear como text/html evita todos los problemas de namespace XML en browsers:
  // con text/xml, querySelector falla si el elemento está en un namespace aunque
  // hayamos quitado la declaración xmlns del string.
  function parseXml(xmlStr) {
    const clean = xmlStr
      .replace(/\s+xmlns(?::[a-z0-9]+)?="[^"]*"/gi, '')
      .replace(/<([a-z0-9]+):/gi,  '<')
      .replace(/<\/([a-z0-9]+):/gi, '</')
    return new DOMParser().parseFromString(clean, 'text/html')
  }
  const q = (doc, sel) => doc.querySelector(sel)?.textContent?.trim() || null

  // ── Paso 1: coordenadas → refcat (tolerancia 100 m) ────────────────────
  const coordRes = await fetch(
    `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/` +
    `OVCCoordenadas.asmx/Consulta_RCCOOR_Distancia` +
    `?SRS=EPSG:4326&Coordenada_X=${lng}&Coordenada_Y=${lat}&Distancia=100`
  )
  if (!coordRes.ok) throw new Error(`Error HTTP ${coordRes.status} del Catastro`)
  const coordDoc = parseXml(await coordRes.text())

  const errCod = q(coordDoc, 'cod')
  if (errCod && errCod !== '0') throw new Error(q(coordDoc, 'des') || 'Sin datos')

  const pc1 = q(coordDoc, 'pc1'), pc2 = q(coordDoc, 'pc2')
  if (!pc1 || !pc2) throw new Error('No hay inmueble catastral en esas coordenadas')
  const refcat = `${pc1}${pc2}${q(coordDoc,'car')||''}${q(coordDoc,'cc1')||''}${q(coordDoc,'cc2')||''}`

  // ── Paso 2: refcat → datos del inmueble ────────────────────────────────
  // Usamos la referencia de 14 chars (pc1+pc2) para el endpoint REST
  let uso_pgou = null, sup_parcela = null, anno_construccion = null,
      clasificacion_urb = null, calificacion_urb = null, edificabilidad = null

  try {
    const inmRes = await fetch(
      `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfLibres/RESTServices.svc/` +
      `Inmueble?RefCat=${pc1}${pc2}&SRS=EPSG:4326`
    )
    if (!inmRes.ok) throw new Error(`HTTP ${inmRes.status}`)
    const inmDoc = parseXml(await inmRes.text())

    // Uso catastral → etiqueta PGOU
    const uso_cat = q(inmDoc, 'luso') || ''
    uso_pgou = USO_CAT_MAP[uso_cat] || uso_cat || null

    // Año de construcción (<ant>)
    const ant = q(inmDoc, 'ant')
    anno_construccion = ant ? parseInt(ant, 10) : null

    // Superficie parcela: <ssp> suelo parcela, fallback <stl> total local
    const sspRaw = q(inmDoc, 'ssp') || q(inmDoc, 'stl')
    sup_parcela = sspRaw ? Math.round(parseFloat(sspRaw)) : null

    // Datos PGOU — presentes en <loures> solo en algunos municipios
    const loures = q(inmDoc, 'loures')
    if (loures) {
      const m1 = loures.match(/clase(?:\s+de\s+suelo)?[:\s]+([^·\n,;]+)/i)
      if (m1) clasificacion_urb = m1[1].trim().replace(/\.$/, '')
      const m2 = loures.match(/calificaci[oó]n[:\s]+([^·\n,;]+)/i)
      if (m2) calificacion_urb = m2[1].trim().replace(/\.$/, '')
      const m3 = loures.match(/(?:edificabilidad|aprovechamiento)[:\s]+([^·\n,;]+)/i)
      if (m3) edificabilidad = m3[1].trim().replace(/\.$/, '')
    }
  } catch (e) {
    console.warn('[Catastro paso 2]', e)
    return { ref_catastral: refcat, uso_pgou: null, sup_parcela: null, anno_construccion: null,
             clasificacion_urb: null, calificacion_urb: null, edificabilidad: null,
             _step2Error: e?.message || 'Sin datos del inmueble' }
  }

  return { ref_catastral: refcat, uso_pgou, sup_parcela, anno_construccion,
           clasificacion_urb, calificacion_urb, edificabilidad }
}

function NewActivoInfoTab({ newForm, setNF, submitted }) {
  const [syncingCat, setSyncingCat] = useState(false)
  const [catMsg,  setCatMsg]  = useState('')

  async function syncCatastro() {
    const coords = newForm.coordenadas || ''
    if (!coords) { setCatMsg('Sin coordenadas — busca la dirección en el mapa primero'); return }
    const [latStr, lngStr] = coords.split(',').map(s => s.trim())
    if (!latStr || !lngStr || isNaN(+latStr) || isNaN(+lngStr)) { setCatMsg('Coordenadas inválidas'); return }
    setSyncingCat(true); setCatMsg('')
    try {
      const data = await fetchCatastro(latStr, lngStr)
      if (data.ref_catastral)              setNF('ref_catastral',    data.ref_catastral)
      if (data.uso_pgou)                   setNF('uso_pgou',         data.uso_pgou)
      if (data.sup_parcela       != null)  setNF('sup_parcela',      String(data.sup_parcela))
      if (data.anno_construccion != null)  setNF('anno_construccion', String(data.anno_construccion))
      if (data.clasificacion_urb)          setNF('clasificacion_urb', data.clasificacion_urb)
      if (data.calificacion_urb)           setNF('calificacion_urb',  data.calificacion_urb)
      if (data.edificabilidad)             setNF('edificabilidad',    data.edificabilidad)
      if (data._step2Error) {
        setCatMsg(`Ref. catastral obtenida. Sin datos urbanísticos: ${data._step2Error}`)
      } else {
        setCatMsg('ok'); setTimeout(() => setCatMsg(''), 4000)
      }
    } catch (e) { setCatMsg(e.message || 'Error de red') }
    finally { setSyncingCat(false) }
  }

  // Bloqueo guiado: hasta tener dirección, el resto de tarjetas queda atenuado.
  const dirOk = !!newForm.direccion
  const lock = dirOk ? undefined : { opacity:.45, pointerEvents:'none', userSelect:'none' }
  // Estilos de input idénticos a los de la ficha existente (TabInfo)
  const inp = {padding:'5px 8px',border:'1px solid var(--accent-bd)',borderRadius:5,fontSize:12,fontFamily:'inherit',background:'var(--accent-lt)',color:'var(--text1)',width:'100%',boxSizing:'border-box',outline:'none'}
  const sel = {...inp,cursor:'pointer'}
  // Marcadores de obligatorio en rojo (mismo diseño, solo cue visual)
  const reqMark = (txt) => <>{txt} <span style={{color:'var(--pdb-red)',fontWeight:700}}>*</span></>
  const reqShown = (val) => val ? val : <span style={{color:'var(--pdb-red)',fontWeight:600}}>Obligatorio</span>

  return (
    <div className="tab-content active act-cards">
      <div className="info-pad">

        {/* Mapa + carrusel · la barra de búsqueda sale en rojo (campo más importante) hasta tener dirección */}
        <MapaCarrusel activo={null} direccion={newForm.direccion} highlightSearch={!dirOk}
          onAddressChange={({direccion,ciudad,municipio,provincia,pais,cp,coordenadas})=>{
            const mun = municipio||ciudad||''
            setNF('direccion',direccion); setNF('municipio',mun); setNF('ciudad',mun)
            if(provincia) setNF('provincia',provincia)
            setNF('pais',pais||'España'); setNF('area',''); setNF('zona',''); setNF('subzona','')
            if(cp) setNF('cp',cp); if(coordenadas) setNF('coordenadas',coordenadas)
          }}/>

        {!dirOk && (
          <div style={{display:'flex',alignItems:'center',gap:7,padding:'8px 12px',marginBottom:12,
            background:'#fff5f5',border:'1px solid var(--pdb-red)',borderRadius:7,fontSize:11.5,color:'var(--pdb-red)',fontWeight:600}}>
            <AlertTriangle size={14} strokeWidth={2}/> Empieza por la <strong>dirección</strong> — desbloquea el resto de la ficha.
          </div>
        )}

        {/* ── DETALLE · misma fila de 5 tarjetas que un activo guardado ── */}
        <div className="act-info-row" style={{display:'grid',gridTemplateColumns:'repeat(5, minmax(0,1fr))',gap:12,marginBottom:14,alignItems:'stretch'}}>

          {/* LOCALIZACIÓN (bloqueado hasta tener dirección) */}
          <div className="dash-card" style={lock}>
            <div className="dash-card-head">Localización</div>
            <div style={{padding:'10px 14px 14px'}}><ZonaBox info={newForm} setI={setNF} asChipRow/></div>
          </div>

          {/* UBICACIÓN (siempre activo · contiene la dirección obligatoria) */}
          <div className="dash-card">
            <div className="dash-card-head">Ubicación</div>
            <div className="va-kv-list" style={{display:'grid',gridTemplateColumns:'1fr',gap:0,padding:'6px 14px 14px'}}>
              <InlineField label="Nombre del activo" value={newForm.nombre} onSave={()=>{}}>
                <input value={newForm.nombre} onChange={e=>setNF('nombre',e.target.value)} style={inp} placeholder="Nombre comercial del activo..."/>
              </InlineField>
              <AddressField value={newForm.direccion} ciudad={newForm.municipio||newForm.ciudad} requiredMark
                onSave={d=>{ setNF('direccion',d.direccion)
                  if(d.pais)setNF('pais',d.pais)
                  if(d.provincia)setNF('provincia',d.provincia)
                  if(d.municipio){setNF('municipio',d.municipio);setNF('ciudad',d.municipio)}
                  if(d.cp)setNF('cp',d.cp); if(d.coordenadas)setNF('coordenadas',d.coordenadas) }}/>
              <InlineField label="País" value={newForm.pais} onSave={()=>{}}>
                <input value={newForm.pais} onChange={e=>setNF('pais',e.target.value)} style={inp} placeholder="España"/>
              </InlineField>
              <InlineField label="Provincia" value={newForm.provincia||'—'} onSave={()=>{}}>
                <input value={newForm.provincia} onChange={e=>setNF('provincia',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Municipio" value={newForm.municipio||'—'} onSave={()=>{}}>
                <input value={newForm.municipio} onChange={e=>{setNF('municipio',e.target.value);setNF('ciudad',e.target.value);setNF('area','');setNF('zona','');setNF('subzona','')}} style={inp} placeholder="Madrid"/>
              </InlineField>
              <InlineField label="Código postal" value={newForm.cp||'—'} onSave={()=>{}}>
                <input value={newForm.cp} onChange={e=>setNF('cp',e.target.value)} style={inp} placeholder="28037"/>
              </InlineField>
              <InlineField label="Coordenadas" value={newForm.coordenadas||'—'}
                display={newForm.coordenadas ? <span style={{fontFamily:'var(--mono)'}}>{newForm.coordenadas}</span> : '—'} onSave={()=>{}}>
                <input value={newForm.coordenadas||''} onChange={e=>setNF('coordenadas',e.target.value)} style={{...inp,fontFamily:'var(--mono)'}} placeholder="lat, lng"/>
              </InlineField>
            </div>
          </div>

          {/* TIPOLOGÍA (bloqueado hasta tener dirección) */}
          <div className="dash-card" style={lock}>
            <div className="dash-card-head">Tipología</div>
            <div className="va-kv-list" style={{display:'grid',gridTemplateColumns:'1fr',gap:0,padding:'6px 14px 14px'}}>
              <InlineField label={reqMark('Tipo de activo')} value={newForm.tipo_activo} display={reqShown(newForm.tipo_activo)} onSave={()=>{}}>
                <select value={newForm.tipo_activo} onChange={e=>setNF('tipo_activo',e.target.value)} style={sel}>
                  {['Edificio','Nave','Local','Parcela','Complejo','Torre','Centro comercial','Parque empresarial','Parque logístico','Residencia'].map(t=><option key={t}>{t}</option>)}
                </select>
              </InlineField>
              <InlineField label={reqMark('Uso principal')} value={newForm.uso} display={reqShown(newForm.uso)} onSave={()=>{}}>
                <select value={newForm.uso} onChange={e=>{setNF('uso',e.target.value);setNF('calidad','');setNF('area','');setNF('zona','');setNF('subzona','');if(normalizeUso(e.target.value)!=='Hotel')setNF('tipo_hotel','')}} style={sel}>
                  <option value="">—</option>{USOS_PRINCIPALES.map(u=><option key={u}>{u}</option>)}
                </select>
              </InlineField>
              <InlineField label={reqMark('Estado de construcción')} value={newForm.estado_construccion} display={reqShown(newForm.estado_construccion)} onSave={()=>{}}>
                <select value={newForm.estado_construccion} onChange={e=>setNF('estado_construccion',e.target.value)} style={sel}>
                  <option value="">—</option>{ESTADOS_CONSTRUCCION.map(e=><option key={e}>{e}</option>)}
                </select>
              </InlineField>
              <InlineField label="Uso secundario" value={newForm.uso_secundario||'—'} onSave={()=>{}}>
                <select value={newForm.uso_secundario} onChange={e=>setNF('uso_secundario',e.target.value)} style={sel}>
                  <option value="">—</option>{USOS_PRINCIPALES.map(u=><option key={u}>{u}</option>)}
                </select>
              </InlineField>
              {normalizeUso(newForm.uso)==='Hotel' && (
                <InlineField label="Tipo de hotel" value={newForm.tipo_hotel||'—'} onSave={()=>{}}>
                  <select value={newForm.tipo_hotel||''} onChange={e=>setNF('tipo_hotel',e.target.value)} style={sel}>
                    <option value="">—</option>{TIPOS_HOTEL.map(t=><option key={t}>{t}</option>)}
                  </select>
                </InlineField>
              )}
              <InlineField label="Calidad" value={newForm.calidad||'—'} onSave={()=>{}}>
                <select value={newForm.calidad} onChange={e=>setNF('calidad',e.target.value)} style={sel}>
                  <option value="">—</option>{calidadesDe(newForm.uso, newForm.calidad).map(c=><option key={c}>{c}</option>)}
                </select>
              </InlineField>
            </div>
          </div>

          {/* SUPERFICIES Y DETALLES · dinámica según Uso principal */}
          <div className="dash-card" style={lock}>
            <div className="dash-card-head">Superficies y detalles</div>
            <div className="va-kv-list" style={{display:'grid',gridTemplateColumns:'1fr',gap:0,padding:'6px 14px 14px'}}>
              {camposSuperficie(newForm.uso).map(m => {
                if (m.compute) {
                  const cv = m.compute(newForm)
                  return (
                    <div className="ir" key={m.key}>
                      <span className="ir-k">{m.label}{m.unit?` (${m.unit})`:''}</span>
                      <span className="ir-v" style={{flex:1,color:'var(--pdb-blue)'}}>{cv != null ? cv.toLocaleString('es-ES') : '—'}</span>
                      <span style={{width:20,flexShrink:0}} aria-hidden="true"/>
                    </div>
                  )
                }
                if (m.special === 'pm') return (
                  <InlineField key={m.key} label={m.label} value={newForm.asset_manager||'—'} onSave={()=>{}}>
                    <AssetManagerSearch value={newForm.asset_manager} onChange={v=>setNF('asset_manager',v)}/>
                  </InlineField>
                )
                if (m.special === 'stacking') return (
                  <div className="ir" key={m.key}>
                    <span className="ir-k">{m.label}</span>
                    <span className="ir-v" style={{flex:1,fontSize:10,color:'var(--muted)',fontStyle:'italic',textAlign:'right'}}>Desde Stacking Plan</span>
                    <span style={{width:20,flexShrink:0}} aria-hidden="true"/>
                  </div>
                )
                const raw = newForm[m.key]
                const has = raw !== '' && raw != null
                const disp = !has ? '—' : m.unit === '%' ? `${raw}%` : `${Number(raw).toLocaleString('es-ES')}${m.unit?` ${m.unit}`:''}`
                const isSba = m.key === 'sba'
                return (
                  <InlineField key={m.key} label={`${m.label}${m.unit?` (${m.unit})`:''}`} value={disp}
                    display={isSba ? <span style={{fontWeight:600,fontFamily:'var(--mono)',color:'var(--pdb-blue)'}}>{has?Number(raw).toLocaleString('es-ES'):'—'}</span> : undefined}
                    onSave={()=>{}}>
                    <input type="number" value={raw||''} onChange={e=>setNF(m.key,e.target.value)} style={{...inp,fontFamily:'var(--mono)'}} placeholder="0" {...(m.unit==='%'?{min:'0',max:'100'}:{})}/>
                  </InlineField>
                )
              })}
            </div>
          </div>

          {/* DATOS URBANÍSTICOS (bloqueado hasta tener dirección) */}
          <div className="dash-card" style={lock}>
            <div className="dash-card-head">Datos urbanísticos
              <button className="ab-btn blue" onClick={syncCatastro} disabled={syncingCat} style={{padding:'2px 8px',fontSize:10}}>
                {syncingCat ? 'Consultando…' : 'Sincronizar'}
              </button>
            </div>
            {catMsg && <div style={{padding:'4px 14px 0',fontSize:9.5,color:catMsg==='ok'?'var(--pdb-green)':'var(--pdb-red)',fontWeight:600,lineHeight:1.3}}>{catMsg==='ok'?'✓ Sincronizado':catMsg}</div>}
            <div className="va-kv-list" style={{display:'grid',gridTemplateColumns:'1fr',gap:0,padding:'6px 14px 14px'}}>
              <InlineField label="Ref. catastral" value={newForm.ref_catastral||'—'} onSave={()=>{}}>
                <input value={newForm.ref_catastral} onChange={e=>setNF('ref_catastral',e.target.value)} style={{...inp,fontFamily:'var(--mono)',fontSize:11}} placeholder="—"/>
              </InlineField>
              <InlineField label="Clasificación" value={newForm.clasificacion_urb||'—'} onSave={()=>{}}>
                <input value={newForm.clasificacion_urb||''} onChange={e=>setNF('clasificacion_urb',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Edificabilidad" value={newForm.edificabilidad||'—'} onSave={()=>{}}>
                <input value={newForm.edificabilidad} onChange={e=>setNF('edificabilidad',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Uso PGOU" value={newForm.uso_pgou||'—'} onSave={()=>{}}>
                <input value={newForm.uso_pgou} onChange={e=>setNF('uso_pgou',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Calificación" value={newForm.calificacion_urb||'—'} onSave={()=>{}}>
                <input value={newForm.calificacion_urb} onChange={e=>setNF('calificacion_urb',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Sup. parcela (m²)" value={newForm.sup_parcela ? Number(newForm.sup_parcela).toLocaleString('es-ES')+' m²' : '—'} onSave={()=>{}}>
                <input type="number" value={newForm.sup_parcela} onChange={e=>setNF('sup_parcela',e.target.value)} style={{...inp,fontFamily:'var(--mono)'}} placeholder="—"/>
              </InlineField>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function MapaCarrusel({ activo, direccion, onAddressChange, highlightSearch }) {
  const mapElRef   = useRef(null)
  const mapObj     = useRef(null)
  const markerRef  = useRef(null)
  const searchRef  = useRef(null)
  const acRef      = useRef(null)
  const [carIdx, setCarIdx] = useState(0)
  const [ordenadas, setOrdenadas] = useState([])

  // Fotos reales del activo desde fotos_activo (sin defaults). Se sincroniza
  // con lo que se sube en el tab Multimedia (mismo origen). principal = orden 0.
  useEffect(() => {
    let cancel = false
    async function loadFotos() {
      if (!activo?.id) { if (!cancel) setOrdenadas([]); return }
      const { data } = await supabase.from('fotos_activo')
        .select('id, url, nombre, tipo, orden').eq('activo_id', activo.id).order('orden')
      if (cancel) return
      const fotos = (data || [])
        .filter(r => r.url && !FOTO_SUB_PLAN.includes(r.tipo))
        .map(r => ({ id: r.id, src: r.url, desc: r.nombre || '', subtipo: r.tipo || 'Foto', principal: r.orden === 0 }))
      setOrdenadas(fotos)
      setCarIdx(0)
    }
    loadFotos()
    return () => { cancel = true }
  }, [activo?.id])

  // Init map + Places search bar (once)
  useEffect(() => {
    if (!GMAPS_API_KEY) return
    const initMap = () => {
      if (!mapElRef.current || !window.google?.maps || mapObj.current) return
      const center = { lat: 40.4168, lng: -3.7038 }
      mapObj.current = new window.google.maps.Map(mapElRef.current, {
        center, zoom: 13,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
      })
      markerRef.current = new window.google.maps.Marker({ map: mapObj.current, position: center, visible: false })

      // Attach Places Autocomplete to the search input overlay
      if (searchRef.current && window.google.maps.places && !acRef.current) {
        acRef.current = new window.google.maps.places.Autocomplete(searchRef.current, {
          fields: ['formatted_address', 'geometry', 'address_components'],
        })
        acRef.current.addListener('place_changed', () => {
          const place = acRef.current.getPlace()
          if (!place.geometry) return
          const loc = place.geometry.location
          mapObj.current.setCenter(loc)
          mapObj.current.setZoom(17)
          markerRef.current.setPosition(loc)
          markerRef.current.setVisible(true)
          if (onAddressChange) {
            const get = type => { const c = (place.address_components||[]).find(x=>x.types.includes(type)); return c?c.long_name:'' }
            const municipio = get('locality') || get('postal_town') || ''
            const provincia = get('administrative_area_level_2') || ''
            onAddressChange({
              direccion:   place.formatted_address || '',
              ciudad:      municipio || provincia || '',
              municipio,
              provincia,
              pais:        get('country') || '',
              cp:          get('postal_code') || '',
              coordenadas: `${loc.lat().toFixed(6)}, ${loc.lng().toFixed(6)}`,
            })
          }
        })
      }
    }
    if (window.google?.maps) initMap()
    else {
      const ex = document.getElementById('gmaps-script')
      if (ex) ex.addEventListener('load', initMap)
      else {
        const s = document.createElement('script')
        s.id = 'gmaps-script'; s.async = true; s.defer = true
        s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_API_KEY}&libraries=places`
        s.onload = initMap
        document.head.appendChild(s)
      }
    }
  }, [])

  // Pre-fill search bar when address prop changes
  useEffect(() => {
    const dir = direccion || activo?.direccion || ''
    if (searchRef.current) searchRef.current.value = dir
  }, [direccion, activo?.direccion])

  // Geocode when address prop changes
  useEffect(() => {
    if (!GMAPS_API_KEY) return
    const dir = direccion || activo?.direccion
    if (!dir) return
    const geocode = () => {
      if (!window.google?.maps || !mapObj.current) return
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address: dir }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location
          mapObj.current.setCenter(loc)
          mapObj.current.setZoom(16)
          if (markerRef.current) { markerRef.current.setPosition(loc); markerRef.current.setVisible(true) }
        }
      })
    }
    if (window.google?.maps && mapObj.current) geocode()
    else setTimeout(geocode, 1500)
  }, [direccion, activo?.direccion])

  return (
    <div className="va-hero">

      {/* Carrusel fotos — 1.5fr izquierda */}
      <div style={{ background: 'var(--gray-lt)' }}>
        {ordenadas.length > 0 ? (
          <>
            {/* Foto principal full-bleed */}
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              {(ordenadas[carIdx]?.src && (ordenadas[carIdx].src.startsWith('http') || ordenadas[carIdx].src.startsWith('data:'))) ? (
                <img src={ordenadas[carIdx].src} alt={ordenadas[carIdx].desc}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, background: '#f1f5f9' }}>🏢</div>
              )}
              {/* Gradient overlay */}
              <div style={{ position:'absolute',inset:0, background:'linear-gradient(180deg,rgba(0,0,0,0) 50%,rgba(0,0,0,0.55) 100%)', pointerEvents:'none' }}/>
              {/* Label bottom */}
              <div style={{ position:'absolute', bottom:14, left:16, right:16, zIndex:2, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#fff', letterSpacing:'-.005em' }}>{ordenadas[carIdx]?.desc}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.8)' }}>{ordenadas[carIdx]?.subtipo}</div>
                </div>
                {ordenadas[carIdx]?.principal && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:700 }}>PRINCIPAL</span>}
              </div>
              {/* Thumbnails bottom-right */}
              <div style={{ position:'absolute', bottom:50, right:12, display:'flex', gap:4, zIndex:2 }}>
                {ordenadas.slice(0,4).map((f,i) => (
                  <div key={f.id} onClick={() => setCarIdx(i)}
                    style={{ width:32,height:32,borderRadius:4,border:`2px solid ${i===carIdx?'#fff':'rgba(255,255,255,.6)'}`,overflow:'hidden',cursor:'pointer',background:'#f8fafc',flexShrink:0 }}>
                    {(f.src && (f.src.startsWith('http') || f.src.startsWith('data:'))) ? <img src={f.src} alt={f.desc} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }} loading="lazy"/>
                      : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>🏢</div>}
                  </div>
                ))}
              </div>
              {/* Nav arrows */}
              {ordenadas.length > 1 && (
                <>
                  <button onClick={() => setCarIdx(i => (i - 1 + ordenadas.length) % ordenadas.length)}
                    style={{ position:'absolute',top:'50%',left:10,transform:'translateY(-50%)',width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,.9)',border:'none',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',zIndex:3 }}>‹</button>
                  <button onClick={() => setCarIdx(i => (i + 1) % ordenadas.length)}
                    style={{ position:'absolute',top:'50%',right:10,transform:'translateY(-50%)',width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,.9)',border:'none',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',zIndex:3 }}>›</button>
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, color:'var(--text4)' }}>
            <ImageIcon size={40} strokeWidth={1.25} style={{color:'var(--text4)'}}/>
            <div style={{ fontSize:11 }}>Sin imágenes · añade en Multimedia</div>
          </div>
        )}
      </div>

      {/* Mapa — 1fr derecha */}
      <div style={{ position: 'relative' }}>
        {GMAPS_API_KEY ? (
          <div ref={mapElRef} style={{ width: '100%', height: '100%', background: '#e5e3df' }}/>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--gray-lt)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text4)' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <div style={{ fontSize: 10 }}>Mapa no disponible</div>
          </div>
        )}
        {/* Search bar overlay */}
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10 }}>
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke={highlightSearch ? 'var(--pdb-red)' : 'var(--text3)'} strokeWidth="1.5"
              style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', width:12, height:12, pointerEvents:'none', zIndex:1 }}>
              <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/>
            </svg>
            <input ref={searchRef} type="text"
              placeholder={highlightSearch ? 'Empieza aquí · busca la dirección (obligatorio)' : 'Buscar dirección en el mapa...'}
              style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px 8px 28px',
                background: highlightSearch ? '#fff5f5' : 'rgba(255,255,255,.97)',
                border: highlightSearch ? '2px solid var(--pdb-red)' : 'none',
                borderRadius:6, fontSize:12, fontFamily:'inherit', color:'var(--text1)',
                boxShadow: highlightSearch ? '0 0 0 3px rgba(220,38,38,.18), 0 2px 8px rgba(11,18,32,.15)' : '0 2px 8px rgba(11,18,32,.15)', outline:'none' }}/>
          </div>
          {highlightSearch && (
            <div style={{marginTop:6,display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',background:'var(--pdb-red)',color:'#fff',borderRadius:5,fontSize:10.5,fontWeight:700,boxShadow:'0 2px 8px rgba(11,18,32,.2)'}}>
              <AlertTriangle size={12} strokeWidth={2}/> Campo más importante — empieza por la dirección
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(255,255,255,.92)', borderRadius: 5, padding: '3px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text2)', backdropFilter: 'blur(4px)', border: '1px solid var(--border)' }}>
          {activo?.zona || 'M-30'} · {activo?.ciudad || 'Madrid'}
        </div>
      </div>

    </div>
  )
}

/* ── Pencil icon SVG ── */
const PencilIco = () => (
  <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2L12 4.5 5 11.5H2.5V9L9.5 2z"/>
  </svg>
)
const CheckIco = () => (
  <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7l4 4 6-6"/>
  </svg>
)
const XIco = () => (
  <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M2 2l10 10M12 2L2 12"/>
  </svg>
)

function InlineField({ label, value, display, onSave, children, wide }) {
  const [editing, setEditing] = useState(false)
  const [hover,   setHover]   = useState(false)
  const shown = display ?? (value || '—')

  if (editing) return (
    <div className="ir" style={{alignItems:'flex-start',gap:6}}>
      <span className="ir-k">{label}</span>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
        {children}
        <div style={{display:'flex',gap:4,marginTop:2}}>
          <button onClick={()=>{ onSave(); setEditing(false) }}
            style={{display:'flex',alignItems:'center',gap:3,padding:'2px 8px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:4,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            <CheckIco/> Guardar
          </button>
          <button onClick={()=>setEditing(false)}
            style={{display:'flex',alignItems:'center',gap:3,padding:'2px 8px',background:'none',border:'1px solid var(--border)',borderRadius:4,fontSize:10,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)'}}>
            <XIco/> Cancelar
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="ir" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <span className="ir-k">{label}</span>
      <span className="ir-v" style={{flex:1}}>{shown}</span>
      <button onClick={()=>setEditing(true)}
        style={{opacity: hover ? 1 : 0, transition:'opacity .15s', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', color:'var(--text4)', display:'flex', alignItems:'center', borderRadius:4, flexShrink:0}}
        title={`Editar ${label}`}>
        <PencilIco/>
      </button>
    </div>
  )
}

function ZonaBox({ info, setI, asChipRow }) {
  const [editing, setEditing] = useState(false)
  const [hover,   setHover]   = useState(false)
  const [draft, setDraft] = useState({ area: info.area, zona: info.zona, subzona: info.subzona })

  const areas    = getAreas(info.ciudad, info.uso)
  const zonas    = draft.area ? getZonas(info.ciudad, info.uso, draft.area) : []
  const subzonas = draft.area && draft.zona ? getSubzonas(info.ciudad, info.uso, draft.area, draft.zona) : []

  const selSt = {padding:'4px 7px',border:'1px solid var(--border)',borderRadius:5,fontSize:11,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)',width:'100%'}

  if (editing) return (
    <div style={{marginTop:8,padding:'10px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:7}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Área</div>
          {areas.length > 0 ? (
            <select value={draft.area} onChange={e=>setDraft(p=>({...p,area:e.target.value,zona:'',subzona:''}))} style={selSt}>
              <option value="">—</option>{areas.map(a=><option key={a}>{a}</option>)}
            </select>
          ) : <input value={draft.area} onChange={e=>setDraft(p=>({...p,area:e.target.value}))} style={selSt} placeholder="—"/>}
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Zona</div>
          {zonas.length > 0 ? (
            <select value={draft.zona} onChange={e=>setDraft(p=>({...p,zona:e.target.value,subzona:''}))} style={selSt}>
              <option value="">—</option>{zonas.map(z=><option key={z}>{z}</option>)}
            </select>
          ) : <input value={draft.zona} onChange={e=>setDraft(p=>({...p,zona:e.target.value}))} style={selSt} placeholder="—"/>}
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Subzona</div>
          {subzonas.length > 0 ? (
            <select value={draft.subzona} onChange={e=>setDraft(p=>({...p,subzona:e.target.value}))} style={selSt}>
              <option value="">—</option>{subzonas.map(s=><option key={s}>{s}</option>)}
            </select>
          ) : <input value={draft.subzona} onChange={e=>setDraft(p=>({...p,subzona:e.target.value}))} style={selSt} placeholder="—"/>}
        </div>
      </div>
      <div style={{display:'flex',gap:6}}>
        <button onClick={()=>{ setI('area',draft.area); setI('zona',draft.zona); setI('subzona',draft.subzona); setEditing(false) }}
          style={{display:'flex',alignItems:'center',gap:3,padding:'3px 10px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:4,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
          <CheckIco/> Guardar
        </button>
        <button onClick={()=>{ setDraft({area:info.area,zona:info.zona,subzona:info.subzona}); setEditing(false) }}
          style={{display:'flex',alignItems:'center',gap:3,padding:'3px 10px',background:'none',border:'1px solid var(--border)',borderRadius:4,fontSize:10,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)'}}>
          <XIco/> Cancelar
        </button>
      </div>
    </div>
  )

  if (asChipRow) return (
    <div style={{position:'relative'}} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <div className="va-chip-row zona-chip-row">
        <div className="va-chip-cell"><div className="label">Área</div><div className="val">{info.area||'—'}</div></div>
        <div className="va-chip-cell"><div className="label">Zona</div><div className="val">{info.zona||'—'}</div></div>
        <div className="va-chip-cell"><div className="label">Subzona</div><div className="val">{info.subzona||'—'}</div></div>
      </div>
      <button onClick={()=>{ setDraft({area:info.area,zona:info.zona,subzona:info.subzona}); setEditing(true) }}
        style={{position:'absolute',top:8,right:12,opacity:hover?1:0,transition:'opacity .15s',background:'none',border:'none',cursor:'pointer',padding:'2px 4px',color:'var(--va-muted)',display:'flex',alignItems:'center'}}
        title="Editar zona"><PencilIco/></button>
    </div>
  )

  return (
    <div className="zona-box" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{position:'relative',cursor:'default'}}>
      <div className="zona-cell"><div className="zona-lbl">Área</div><div className="zona-val">{info.area||'—'}</div></div>
      <div className="zona-cell"><div className="zona-lbl">Zona</div><div className="zona-val">{info.zona||'—'}</div></div>
      <div className="zona-cell"><div className="zona-lbl">Subzona</div><div className="zona-val">{info.subzona||'—'}</div></div>
      <button onClick={()=>{ setDraft({area:info.area,zona:info.zona,subzona:info.subzona}); setEditing(true) }}
        style={{position:'absolute',top:6,right:6,opacity:hover?1:0,transition:'opacity .15s',background:'none',border:'none',cursor:'pointer',padding:'2px 4px',color:'var(--text4)',display:'flex',alignItems:'center'}}
        title="Editar zona">
        <PencilIco/>
      </button>
    </div>
  )
}

function AddressField({ value, ciudad, onSave, requiredMark }) {
  const [editing, setEditing] = useState(false)
  const [hover,   setHover]   = useState(false)
  const [draft, setDraft] = useState({ direccion: value, ciudad, pais: '' })
  const addressRef = useRef(null)
  const acRef = useRef(null)

  useEffect(() => {
    if (!editing || !GMAPS_API_KEY) return
    const setup = () => {
      if (!addressRef.current || !window.google?.maps?.places || acRef.current) return
      acRef.current = new window.google.maps.places.Autocomplete(addressRef.current, {
        componentRestrictions: { country: 'es' },
        fields: ['formatted_address','address_components','geometry'],
      })
      acRef.current.addListener('place_changed', () => {
        const place = acRef.current.getPlace()
        if (!place.geometry) return
        const get = type => { const c=(place.address_components||[]).find(x=>x.types.includes(type)); return c?c.long_name:'' }
        const municipio = get('locality')||get('postal_town')||''
        const provincia = get('administrative_area_level_2')||''
        const loc = place.geometry.location
        setDraft({ direccion: place.formatted_address||'', ciudad: municipio||provincia||'', municipio, provincia,
          pais: get('country')||'', cp: get('postal_code')||'',
          coordenadas: `${loc.lat().toFixed(6)}, ${loc.lng().toFixed(6)}` })
      })
    }
    if (window.google?.maps?.places) setup()
    else {
      const ex = document.getElementById('gmaps-script')
      if (ex) ex.addEventListener('load', setup)
    }
    return () => { acRef.current = null }
  }, [editing])

  if (editing) return (
    <div className="ir" style={{alignItems:'flex-start',gap:6}}>
      <span className="ir-k">Dirección</span>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
        <div style={{position:'relative'}}>
          <svg viewBox="0 0 16 16" fill="none" stroke="var(--text4)" strokeWidth="1.5"
            style={{position:'absolute',left:7,top:'50%',transform:'translateY(-50%)',width:12,height:12,pointerEvents:'none'}}>
            <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/>
          </svg>
          <input ref={addressRef} type="text" defaultValue={draft.direccion}
            onChange={e=>setDraft(p=>({...p,direccion:e.target.value}))}
            placeholder="Buscar con Google Maps..."
            style={{padding:'5px 8px 5px 24px',border:'1px solid var(--accent-bd)',borderRadius:5,fontSize:12,fontFamily:'inherit',background:'var(--accent-lt)',color:'var(--text1)',width:'100%',boxSizing:'border-box'}}
            autoFocus/>
        </div>
        {draft.ciudad && <span style={{fontSize:10,color:'var(--text3)'}}>{draft.ciudad} · {draft.pais}</span>}
        <div style={{display:'flex',gap:4}}>
          <button onClick={()=>{ onSave(draft); setEditing(false); acRef.current=null }}
            style={{display:'flex',alignItems:'center',gap:3,padding:'2px 8px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:4,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            <CheckIco/> Guardar
          </button>
          <button onClick={()=>{ setDraft({direccion:value,ciudad,pais:''}); setEditing(false); acRef.current=null }}
            style={{display:'flex',alignItems:'center',gap:3,padding:'2px 8px',background:'none',border:'1px solid var(--border)',borderRadius:4,fontSize:10,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)'}}>
            <XIco/> Cancelar
          </button>
        </div>
      </div>
    </div>
  )

  const reqEmpty = requiredMark && !value
  return (
    <div className="ir" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <span className="ir-k">Dirección{requiredMark && <span style={{color:'var(--pdb-red)',fontWeight:700,marginLeft:2}}>*</span>}</span>
      <span className="ir-v" style={{flex:1, ...(reqEmpty?{color:'var(--pdb-red)',fontWeight:600}:{})}}>{value || (reqEmpty ? 'Obligatorio' : '—')}</span>
      <button onClick={()=>{ setDraft({direccion:value,ciudad,pais:''}); setEditing(true) }}
        style={{opacity:hover?1:0,transition:'opacity .15s',background:'none',border:'none',cursor:'pointer',padding:'2px 4px',color:'var(--text4)',display:'flex',alignItems:'center',borderRadius:4,flexShrink:0}}>
        <PencilIco/>
      </button>
    </div>
  )
}

function TabInfo({ navigate, plazas, activo, nEdificios, onInfoSaved, saveRef, syncRef, hidden, vincMaestra, propietariosReg = [], arrendatariosCount = 0, goToTab, liveBuildings, activoRef, activoNombre }) {
  const INIT_INFO = {
    nombre:'', direccion:'', ciudad:'', provincia:'', municipio:'', pais:'España', cp:'', coordenadas:'',
    area:'', zona:'', subzona:'',
    tipo_activo:'Edificio', estado_construccion:'Construcción existente',
    uso:'', uso_secundario:'', calidad:'', tipo_hotel:'',
    asset_manager:'', sba:'', sup_planta_tipo:'', ratio_perdida:'',
    anno_construccion:'', anno_rehabilitacion:'',
    ref_catastral:'', uso_pgou:'', clasificacion_urb:'', calificacion_urb:'',
    edificabilidad:'', sup_parcela:'',
  }
  const [info, setInfo]   = useState(INIT_INFO)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [syncingCat, setSyncingCat] = useState(false)
  const [catMsg,  setCatMsg]  = useState('')  // '' | 'ok' | error text

  // Init from activo (Supabase)
  useEffect(() => {
    if (!activo) return
    setInfo({
      nombre:              activo.nombre              || '',
      direccion:           activo.direccion           || '',
      ciudad:              activo.ciudad              || '',
      provincia:           activo.provincia           || '',
      municipio:           activo.municipio           || activo.ciudad || '',
      pais:                activo.pais                || 'España',
      cp:                  activo.cp                  || '',
      coordenadas:         activo.coordenadas         || '',
      area:                activo.area                || '',
      zona:                activo.zona                || '',
      subzona:             activo.subzona             || '',
      tipo_activo:         activo.tipo_activo         || 'Edificio',
      estado_construccion: activo.estado_construccion || 'Construcción existente',
      uso:                 activo.uso                 || '',
      uso_secundario:      activo.uso_secundario      || '',
      calidad:             activo.calidad             || '',
      asset_manager:       activo.asset_manager       || '',
      sba:                 activo.sba                 || '',
      sup_planta_tipo:     activo.sup_planta_tipo     || '',
      ratio_perdida:       activo.ratio_perdida       || '',
      anno_construccion:   activo.anno_construccion   || '',
      anno_rehabilitacion: activo.anno_rehabilitacion || '',
      ref_catastral:       activo.ref_catastral       || '',
      uso_pgou:            activo.uso_pgou            || '',
      clasificacion_urb:   activo.clasificacion_urb   || '',
      calificacion_urb:    activo.calificacion_urb    || '',
      edificabilidad:      activo.edificabilidad      || '',
      sup_parcela:         activo.sup_parcela         || '',
      // Métricas específicas por uso (jsonb) → planas para editar con setI
      ...(activo.metricas || {}),
    })
    setDirty(false)
  }, [activo])

  const setI = (k, v) => { setInfo(p => ({...p, [k]: v})); setDirty(true); setSaveOk(false) }

  const handleSave = async () => {
    if (!activo?.ref) return
    setSaving(true)

    // Construir payload solo con columnas que existen en la tabla
    // (el SELECT * del activo ya devolvió los campos reales — si una clave no está en activo, la columna no existe)
    const has = (col) => col in activo

    const payload = {
      // Columnas base — siempre presentes
      nombre:   info.nombre   || null,
      zona:     info.zona     || null,
      subzona:  info.subzona  || null,
      ciudad:   info.ciudad   || null,
      uso:      info.uso      || null,
      sba:      info.sba      ? parseFloat(info.sba) : null,
    }

    // Columnas añadidas en migración 002+
    if (has('direccion'))           payload.direccion           = info.direccion           || null
    if (has('pais'))                payload.pais                = info.pais                || null
    if (has('cp'))                  payload.cp                  = info.cp                  || null
    if (has('coordenadas'))         payload.coordenadas         = info.coordenadas         || null
    if (has('area'))                payload.area                = info.area                || null
    if (has('tipo_activo'))         payload.tipo_activo         = info.tipo_activo         || null
    if (has('estado_construccion')) payload.estado_construccion = info.estado_construccion || null
    if (has('uso_secundario'))      payload.uso_secundario      = info.uso_secundario      || null
    if (has('calidad'))             payload.calidad             = info.calidad             || null
    if (has('asset_manager'))       payload.asset_manager       = info.asset_manager       || null
    if (has('anno_construccion'))   payload.anno_construccion   = info.anno_construccion   ? parseInt(info.anno_construccion)   : null
    if (has('anno_rehabilitacion')) payload.anno_rehabilitacion = info.anno_rehabilitacion ? parseInt(info.anno_rehabilitacion) : null

    // Columnas catastro
    if (has('ref_catastral'))     payload.ref_catastral     = info.ref_catastral     || null
    if (has('uso_pgou'))          payload.uso_pgou          = info.uso_pgou          || null
    if (has('clasificacion_urb')) payload.clasificacion_urb = info.clasificacion_urb || null
    if (has('calificacion_urb'))  payload.calificacion_urb  = info.calificacion_urb  || null
    if (has('edificabilidad'))    payload.edificabilidad    = info.edificabilidad    || null
    if (has('sup_parcela'))       payload.sup_parcela       = info.sup_parcela ? parseFloat(info.sup_parcela) : null

    // Migración 005
    if (has('sup_planta_tipo'))   payload.sup_planta_tipo   = info.sup_planta_tipo ? parseFloat(info.sup_planta_tipo) : null
    if (has('ratio_perdida'))     payload.ratio_perdida     = info.ratio_perdida    ? parseFloat(info.ratio_perdida)  : null

    // Migración 040 — ubicación granular + métricas dinámicas por uso (jsonb)
    if (has('provincia'))         payload.provincia         = info.provincia         || null
    if (has('municipio'))         payload.municipio         = info.municipio          || null
    if (has('metricas')) {
      payload.metricas = buildMetricas(info)
      if (normalizeUso(info.uso) === 'Hotel' && info.tipo_hotel) payload.metricas.tipo_hotel = info.tipo_hotel
    }

    // Marca de modificación para que el activo suba al principio del listado.
    payload.updated_at = new Date().toISOString()
    const { error } = await supabase.from('activos').update(payload).eq('ref', activo.ref)
    setSaving(false)
    if (error) { setSaveErr(error.message || 'Error al guardar'); return }
    setDirty(false); setSaveErr(''); setSaveOk(true); setTimeout(()=>setSaveOk(false),3000)
    if (onInfoSaved) onInfoSaved({ nombre: info.nombre, direccion: info.direccion })
  }
  // Expose handleSave and syncCatastro via refs so parent action bar can trigger them
  if (saveRef) saveRef.current = handleSave

  // ── Sincronización con Catastro (llamada directa desde browser) ────────
  async function syncCatastro() {
    const coords = info.coordenadas || ''
    if (!coords) { setCatMsg('Sin coordenadas — busca la dirección en el mapa primero'); return }
    const [latStr, lngStr] = coords.split(',').map(s => s.trim())
    if (!latStr || !lngStr || isNaN(+latStr) || isNaN(+lngStr)) { setCatMsg('Coordenadas inválidas'); return }
    setSyncingCat(true); setCatMsg('')
    try {
      const data = await fetchCatastro(latStr, lngStr)
      setInfo(p => ({
        ...p,
        ref_catastral:     data.ref_catastral                             ?? p.ref_catastral,
        uso_pgou:          data.uso_pgou                                  ?? p.uso_pgou,
        sup_parcela:       data.sup_parcela      != null ? String(data.sup_parcela)       : p.sup_parcela,
        anno_construccion: data.anno_construccion != null ? String(data.anno_construccion) : p.anno_construccion,
        clasificacion_urb: data.clasificacion_urb                         ?? p.clasificacion_urb,
        calificacion_urb:  data.calificacion_urb                          ?? p.calificacion_urb,
        edificabilidad:    data.edificabilidad                            ?? p.edificabilidad,
      }))
      setDirty(true)
      if (data._step2Error) {
        setCatMsg(`Ref. catastral obtenida. Sin datos urbanísticos: ${data._step2Error}`)
      } else {
        setCatMsg('ok'); setTimeout(() => setCatMsg(''), 4000)
      }
    } catch (e) { setCatMsg(e.message || 'Error de red') }
    finally { setSyncingCat(false) }
  }
  if (syncRef) syncRef.current = syncCatastro

  const totalPlazas = plazas.reduce((s,p)=>s+p.cantidad,0)
  const byUbic = UBICACIONES.map(u=>({u, n:plazas.filter(p=>p.ubicacion===u).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
  const byTipo = TIPOS_PLAZA.map(t=>({t, n:plazas.filter(p=>p.tipo===t).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
  const byVeh  = TIPOS_VEHICULO.map(v=>({v, n:plazas.filter(p=>p.vehiculo===v).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)

  // Shared input/select style for inline edit inputs
  const inp = {padding:'5px 8px',border:'1px solid var(--accent-bd)',borderRadius:5,fontSize:12,fontFamily:'inherit',background:'var(--accent-lt)',color:'var(--text1)',width:'100%',boxSizing:'border-box',outline:'none'}
  const sel = {...inp,cursor:'pointer'}

  // ── Banda Vinculaciones maestra (Activo es entidad maestra) ──
  // Cards: Propietario · Mandato activo · Ofertas activas · Arrendatarios.
  // Cada click navega a la entidad relacionada (o al tab donde se gestiona).
  const blds = liveBuildings || activo?.stacking_data || []
  const ownerSup = (p) => blds
    .flatMap(b => b.prop || [])
    .flatMap(r => r.units || [])
    .reduce((s, u) => s + ((p.id ? u.prop_id === p.id : (!u.prop_id && u.n === p.propietario)) ? (Number(u.sup) || 0) : 0), 0)
  const propietarioPrincipal = propietariosReg.length > 0
    ? [...propietariosReg].sort((a, b) => ownerSup(b) - ownerSup(a))[0]
    : null
  const propLabel = propietariosReg.length > 1
    ? `${propietariosReg.length} propietarios`
    : (propietarioPrincipal?.propietario || null)
  const propSub = propietarioPrincipal && ownerSup(propietarioPrincipal) > 0
    ? `${Number(ownerSup(propietarioPrincipal)).toLocaleString('es-ES')} m²${propietariosReg.length > 1 ? ' · mayoritario' : ''}`
    : null
  const mand = vincMaestra?.mandatoActivo
  const ofCount = vincMaestra?.ofertasActivasCount || 0
  const vincItems = [
    {
      key:   'propietario',
      icon:  UserCheck,
      tone:  'blue', // canon: Cuenta/Propietario = blue (Dynamics)
      label: propietariosReg.length > 1 ? 'Propietarios' : 'Propietario',
      value: propLabel,
      sub:   propSub,
      onClick: propietarioPrincipal
        ? () => navigate('ficha-propietario', { id: propietarioPrincipal.id, ownerData: { ...propietarioPrincipal, superficie: ownerSup(propietarioPrincipal) }, fromActivoRef: activo?.ref, fromActivoTab: 'at-stacking' })
        : () => goToTab && goToTab('at-stacking'),
    },
    {
      key:   'mandato',
      icon:  ScrollText,
      tone:  'accent', // canon: Mandato = accent
      label: 'Mandato activo',
      value: mand?.ref || null,
      sub:   mand?.titulo || mand?.tipo || null,
      onClick: mand ? () => navigate('ficha-mandato', { id: mand.ref }) : null,
    },
    {
      key:   'ofertas',
      icon:  Tag,
      tone:  'green', // canon: Oferta = green
      label: 'Ofertas activas',
      value: ofCount > 0 ? (ofCount === 1 ? 'oferta' : 'ofertas') : null,
      count: ofCount > 0 ? ofCount : null,
      sub:   null,
      onClick: ofCount > 0 ? () => goToTab && goToTab('at-360') : null,
    },
    {
      key:   'arrendatarios',
      icon:  Users,
      tone:  'purple',
      label: 'Arrendatarios',
      value: arrendatariosCount > 0 ? (arrendatariosCount === 1 ? 'arrendatario' : 'arrendatarios') : null,
      count: arrendatariosCount > 0 ? arrendatariosCount : null,
      sub:   null,
      onClick: arrendatariosCount > 0 ? () => goToTab && goToTab('at-stacking') : null,
    },
  ]

  return (
    <div className="tab-content active act-cards" style={hidden ? {display:'none'} : undefined}>
      <div className="info-pad">

        {/* ── VINCULACIONES MAESTRA (canónico, siempre arriba · NO se reubica) ── */}
        <VinculacionesMaestra items={vincItems} />

        {/* ── Mapa con barra búsqueda integrada + Carrusel ── */}
        <MapaCarrusel activo={activo} direccion={info.direccion}
          onAddressChange={({direccion,ciudad,pais,cp,coordenadas})=>{
            setInfo(p=>({...p,direccion,ciudad,pais,...(cp?{cp}:{}),...(coordenadas?{coordenadas}:{})})); setDirty(true); setSaveOk(false)
          }}/>

        {/* ── Save bar ── */}
        {(dirty || saveOk || saveErr) && (
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',
            background: saveOk ? '#f0fdf4' : saveErr ? '#fef2f2' : 'var(--accent-lt)',
            border: `1px solid ${saveOk ? '#86efac' : saveErr ? '#fca5a5' : 'var(--accent-bd)'}`,
            borderRadius:7,marginBottom:12}}>
            {saveOk ? (
              <span style={{fontSize:11,color:'#15803d',fontWeight:600,flex:1}}>✓ Guardado correctamente</span>
            ) : saveErr ? (
              <>
                <span style={{fontSize:11,color:'var(--red)',fontWeight:600,flex:1,display:'inline-flex',alignItems:'center',gap:4}}><AlertTriangle size={12} strokeWidth={1.75}/> {saveErr}</span>
                <button onClick={()=>setSaveErr('')}
                  style={{padding:'3px 8px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:10,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)'}}>
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <span style={{fontSize:11,color:'var(--accent)',fontWeight:600,flex:1}}>Cambios sin guardar</span>
                <button onClick={handleSave} disabled={saving}
                  style={{padding:'5px 16px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                  {saving ? 'Guardando...' : '💾 Guardar'}
                </button>
                <button onClick={()=>{setInfo(activo ? {...INIT_INFO,...activo} : INIT_INFO);setDirty(false);setSaveErr('')}}
                  style={{padding:'5px 10px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)'}}>
                  Descartar
                </button>
              </>
            )}
          </div>
        )}

        {/* ── DETALLE · todos los cuadros en una sola fila (estilo Demanda/Lead) ── */}
        <div className="act-info-row" style={{display:'grid',gridTemplateColumns:'repeat(5, minmax(0,1fr))',gap:12,marginBottom:14,alignItems:'stretch'}}>

          {/* LOCALIZACIÓN */}
          <div className="dash-card">
            <div className="dash-card-head">Localización</div>
            <div style={{padding:'10px 14px 14px'}}><ZonaBox info={info} setI={setI} asChipRow/></div>
          </div>

          {/* UBICACIÓN */}
          <div className="dash-card">
            <div className="dash-card-head">Ubicación</div>
            <div className="va-kv-list" style={{display:'grid',gridTemplateColumns:'1fr',gap:0,padding:'6px 14px 14px'}}>
            <InlineField label="Nombre del activo" value={info.nombre}
              onSave={()=>{ setDirty(true); if(onInfoSaved) onInfoSaved({nombre: info.nombre}) }}>
              <input value={info.nombre} onChange={e=>setI('nombre',e.target.value)} style={inp} placeholder="Nombre comercial del activo..."/>
            </InlineField>
            <AddressField value={info.direccion} ciudad={info.municipio||info.ciudad}
              onSave={d=>{ setI('direccion',d.direccion)
                if(d.pais) setI('pais',d.pais)
                if(d.provincia) setI('provincia',d.provincia)
                if(d.municipio){ setI('municipio',d.municipio); setI('ciudad',d.municipio) }
                if(d.cp) setI('cp',d.cp)
                if(d.coordenadas) setI('coordenadas',d.coordenadas) }}/>
            <InlineField label="País" value={info.pais} onSave={()=>setDirty(true)}>
              <input value={info.pais} onChange={e=>setI('pais',e.target.value)} style={inp} placeholder="—"/>
            </InlineField>
            <InlineField label="Provincia" value={info.provincia||'—'} onSave={()=>setDirty(true)}>
              <input value={info.provincia} onChange={e=>setI('provincia',e.target.value)} style={inp} placeholder="—"/>
            </InlineField>
            <InlineField label="Municipio" value={info.municipio||info.ciudad||'—'} onSave={()=>setDirty(true)}>
              <input value={info.municipio} onChange={e=>{ setI('municipio',e.target.value); setI('ciudad',e.target.value) }} style={inp} placeholder="—"/>
            </InlineField>
            <InlineField label="Código postal" value={info.cp||'—'} onSave={()=>setDirty(true)}>
              <input value={info.cp} onChange={e=>setI('cp',e.target.value)} style={inp} placeholder="—"/>
            </InlineField>
            <InlineField label="Coordenadas" value={info.coordenadas||'—'}
              display={info.coordenadas ? <span style={{fontFamily:'var(--mono)'}}>{info.coordenadas}</span> : '—'}
              onSave={()=>setDirty(true)}>
              <input value={info.coordenadas} onChange={e=>setI('coordenadas',e.target.value)} style={{...inp,fontFamily:'var(--mono)'}} placeholder="lat, lng"/>
            </InlineField>
            </div>
          </div>

          {/* TIPOLOGÍA */}
          <div className="dash-card">
            <div className="dash-card-head">Tipología</div>
            <div className="va-kv-list" style={{display:'grid',gridTemplateColumns:'1fr',gap:0,padding:'6px 14px 14px'}}>
            <InlineField label="Tipo de activo" value={info.tipo_activo} onSave={()=>setDirty(true)}>
              <select value={info.tipo_activo} onChange={e=>setI('tipo_activo',e.target.value)} style={sel}>
                {['Edificio','Nave','Local','Parcela','Complejo','Torre','Centro comercial','Parque empresarial','Parque logístico','Residencia'].map(t=><option key={t}>{t}</option>)}
              </select>
            </InlineField>
            <InlineField label="Estado construcción" value={info.estado_construccion} onSave={()=>setDirty(true)}>
              <select value={info.estado_construccion} onChange={e=>setI('estado_construccion',e.target.value)} style={sel}>
                <option value="">—</option>{ESTADOS_CONSTRUCCION.map(e=><option key={e}>{e}</option>)}
              </select>
            </InlineField>
            <InlineField label="Uso principal" value={info.uso} onSave={()=>setDirty(true)}>
              <select value={info.uso} onChange={e=>{ setI('uso',e.target.value); if(normalizeUso(e.target.value)!=='Hotel') setI('tipo_hotel','') }} style={sel}>
                <option value="">—</option>{USOS_PRINCIPALES.map(u=><option key={u}>{u}</option>)}
              </select>
            </InlineField>
            <InlineField label="Uso secundario" value={info.uso_secundario||'—'} onSave={()=>setDirty(true)}>
              <select value={info.uso_secundario} onChange={e=>setI('uso_secundario',e.target.value)} style={sel}>
                <option value="">—</option>{USOS_PRINCIPALES.map(u=><option key={u}>{u}</option>)}
              </select>
            </InlineField>
            {normalizeUso(info.uso)==='Hotel' && (
              <InlineField label="Tipo de hotel" value={info.tipo_hotel||'—'} onSave={()=>setDirty(true)}>
                <select value={info.tipo_hotel||''} onChange={e=>setI('tipo_hotel',e.target.value)} style={sel}>
                  <option value="">—</option>{TIPOS_HOTEL.map(t=><option key={t}>{t}</option>)}
                </select>
              </InlineField>
            )}
            <InlineField label="Calidad" value={info.calidad||'—'} onSave={()=>setDirty(true)}>
              <select value={info.calidad} onChange={e=>setI('calidad',e.target.value)} style={sel}>
                <option value="">—</option>{calidadesDe(info.uso, info.calidad).map(c=><option key={c}>{c}</option>)}
              </select>
            </InlineField>
            </div>
          </div>

          {/* Superficies y detalles */}
          <div className="dash-card">
            <div className="dash-card-head">Superficies y detalles</div>
            <div className="va-kv-list" style={{display:'grid',gridTemplateColumns:'1fr',gap:0,padding:'6px 14px 14px'}}>
              {/* Campos dinámicos según Uso principal (ver ../lib/usoConfig) */}
              {camposSuperficie(info.uso).map(m => {
                if (m.compute) {
                  const cv = m.compute(info)
                  return (
                    <div className="ir" key={m.key}>
                      <span className="ir-k">{m.label}{m.unit?` (${m.unit})`:''}</span>
                      <span className="ir-v" style={{flex:1,color:'var(--pdb-blue)'}}>{cv != null ? cv.toLocaleString('es-ES') : '—'}</span>
                      <span style={{width:20,flexShrink:0}} aria-hidden="true"/>
                    </div>
                  )
                }
                if (m.special === 'pm') return (
                  <InlineField key={m.key} label={m.label} value={info.asset_manager||'—'} onSave={()=>setDirty(true)}>
                    <AssetManagerSearch value={info.asset_manager} onChange={v=>setI('asset_manager',v)}/>
                  </InlineField>
                )
                if (m.special === 'stacking') return (
                  <div className="ir" key={m.key}>
                    <span className="ir-k">{m.label}</span>
                    <span className="ir-v" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'flex-end',gap:6}}>
                      <span>{nEdificios ?? 1}</span>
                      <span style={{fontSize:11,color:'var(--pdb-blue)',cursor:'pointer',fontWeight:500}}>ver stacking plan</span>
                    </span>
                    <span style={{width:20,flexShrink:0}} aria-hidden="true"/>
                  </div>
                )
                const raw = info[m.key]
                const has = raw !== '' && raw != null
                const disp = !has ? '—' : m.unit === '%' ? `${raw}%` : `${Number(raw).toLocaleString('es-ES')}${m.unit?` ${m.unit}`:''}`
                const isSba = m.key === 'sba'
                return (
                  <InlineField key={m.key} label={`${m.label}${m.unit?` (${m.unit})`:''}`} value={disp}
                    display={isSba ? <span className="kpi-strong">{has?Number(raw).toLocaleString('es-ES'):'—'}{has&&<span style={{fontSize:12,fontWeight:600,marginLeft:4,color:'var(--text4)'}}>m²</span>}</span> : undefined}
                    onSave={()=>setDirty(true)}>
                    <input type="number" value={raw||''} onChange={e=>setI(m.key,e.target.value)} style={{...inp,fontFamily:'var(--mono)'}} placeholder="0" {...(m.unit==='%'?{min:'0',max:'100'}:{})}/>
                  </InlineField>
                )
              })}
            </div>
          </div>

          {/* Datos urbanísticos */}
          <div className="dash-card">
            <div className="dash-card-head">Datos urbanísticos
              <button className="ab-btn blue" onClick={syncCatastro} disabled={syncingCat} style={{padding:'2px 8px',fontSize:10}}>
                {syncingCat ? 'Consultando…' : 'Sincronizar'}
              </button>
            </div>
            {catMsg && <div style={{padding:'4px 14px 0',fontSize:9.5,color:catMsg==='ok'?'var(--pdb-green)':'var(--pdb-red)',fontWeight:600,lineHeight:1.3}}>{catMsg==='ok'?'✓ Sincronizado':catMsg}</div>}
            <div className="va-kv-list" style={{display:'grid',gridTemplateColumns:'1fr',gap:0,padding:'6px 14px 14px'}}>
              <InlineField label="Ref. catastral" value={info.ref_catastral||'—'} onSave={()=>setDirty(true)}>
                <input value={info.ref_catastral} onChange={e=>setI('ref_catastral',e.target.value)} style={{...inp,fontFamily:'var(--mono)',fontSize:11}} placeholder="—"/>
              </InlineField>
              <InlineField label="Clasificación" value={info.clasificacion_urb||'—'} onSave={()=>setDirty(true)}>
                <input value={info.clasificacion_urb} onChange={e=>setI('clasificacion_urb',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Edificabilidad" value={info.edificabilidad||'—'} onSave={()=>setDirty(true)}>
                <input value={info.edificabilidad} onChange={e=>setI('edificabilidad',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Uso PGOU" value={info.uso_pgou||'—'} onSave={()=>setDirty(true)}>
                <input value={info.uso_pgou} onChange={e=>setI('uso_pgou',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Calificación" value={info.calificacion_urb||'—'} onSave={()=>setDirty(true)}>
                <input value={info.calificacion_urb} onChange={e=>setI('calificacion_urb',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Sup. parcela (m²)" value={info.sup_parcela ? Number(info.sup_parcela).toLocaleString('es-ES')+' m²' : '—'} onSave={()=>setDirty(true)}>
                <input type="number" value={info.sup_parcela} onChange={e=>setI('sup_parcela',e.target.value)} style={{...inp,fontFamily:'var(--mono)'}} placeholder="—"/>
              </InlineField>
            </div>
          </div>

        </div>

        {/*
          Seguimiento comercial — eliminado de Información general.
          Ahora vive en la pestaña Vista 360 (timeline completo) y aparece como
          resumen compacto en RightPanel para visibilidad rápida.

          Ofertas activas — eliminadas de Información general. Existe ya la
          pestaña Ofertas (lista completa) y la sección en Vista 360.
        */}

        {/* ── HISTÓRICO DEL EDIFICIO ── */}
        {activoRef && (
          <HistoricoEdificio activoRef={activoRef} activoNombre={activoNombre || ''} />
        )}

      </div>
    </div>
  )
}

/* ── Panel derecho ── */
function RightPanel({ navigate, nEdificios, nPropietarios, plazas, esg, activo, arrendatariosReg = [] }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg,  setChatMsg]  = useState('')
  const [chatLog,  setChatLog]  = useState([
    { role:'ai', text:'Hola. Puedo consultarte cualquier dato de este activo — disponibilidad, rentas, vencimientos, arrendatarios, comparables. ¿En qué te ayudo?' }
  ])

  const sendChat = () => {
    if (!chatMsg.trim()) return
    const q = chatMsg.trim()
    setChatLog(p=>[...p,{role:'user',text:q}])
    setChatMsg('')
    setTimeout(()=>setChatLog(p=>[...p,{role:'ai',text:`Consultando datos del activo para: "${q}"... (conecta la API de IA para respuestas en tiempo real)`}]),600)
  }

  return (
    <div className="ficha-right">

      {/* 1. Asistente IA — PRIMERO */}
      <div className="va-side-card">
        <div className="va-ai-card">
          <div className="va-ai-header">
            <span>Asistente IA · Insight activo</span>
            <span className="va-ai-badge">IA</span>
          </div>
          <div className="va-ai-body">
            <strong>10.142 m² disponibles</strong> (21,6%). 2 break options vencidas o próximas. Renta zona 10,5 €/m² — margen de subida. Oracle en fase finalista para P1–P4.
          </div>
          <span className="va-ai-link" onClick={()=>setChatOpen(v=>!v)}>✎ {chatOpen?'Cerrar chat':'Preguntar a la IA'}</span>
        </div>
        {chatOpen && (
          <div style={{marginTop:8,border:'1px solid var(--va-line)',borderRadius:8,overflow:'hidden',background:'#fff'}}>
            <div style={{maxHeight:180,overflowY:'auto',padding:'8px 10px',display:'flex',flexDirection:'column',gap:6}}>
              {chatLog.map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'85%',padding:'5px 9px',borderRadius:8,fontSize:11,lineHeight:1.4,
                    background:m.role==='user'?'var(--pdb-blue)':'var(--va-line2)',
                    color:m.role==='user'?'#fff':'var(--ink-2)',
                    border:m.role==='ai'?'1px solid var(--va-line)':'none'
                  }}>{m.text}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',borderTop:'1px solid var(--va-line)',padding:'6px 8px',gap:6}}>
              <input style={{flex:1,border:'none',outline:'none',fontSize:11,fontFamily:'inherit',background:'transparent',color:'var(--ink)'}}
                placeholder="Pregunta sobre el activo..."
                value={chatMsg} onChange={e=>setChatMsg(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')sendChat()}}/>
              <button onClick={sendChat} style={{padding:'3px 10px',background:'var(--pdb-blue)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>→</button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Sellos ESG / certificaciones (los KPIs del activo están en la cabecera) */}
      {(()=>{
        const sellos = [
          esg?.leed        && {label:`LEED ${esg.leed}`,              cls:'tag-leed'},
          esg?.breeam      && {label:`BREEAM ${esg.breeam}`,          cls:'tag-esg'},
          esg?.well        && {label:`WELL ${esg.well}`,              cls:'tag-purple'},
          esg?.dgnb        && {label:`DGNB ${esg.dgnb}`,             cls:'tag-blue'},
          esg?.wiredscore  && {label:`WiredScore ${esg.wiredscore}`,  cls:'tag-gray'},
        ].filter(Boolean)
        if (sellos.length === 0) return null
        return (
          <div className="va-side-card">
            <div className="va-side-title">Certificaciones</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {sellos.map(s=>(
                <span key={s.label} className={`tag ${s.cls}`} style={{fontSize:9,padding:'2px 7px'}}>{s.label}</span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* 3. Ubicación / datos de zona — desde activos.* */}
      <div className="va-side-card">
        <div className="va-side-title">Ubicación · zona</div>
        <div className="va-kpi-grid">
          <div className="va-kpi"><div className="k">Renta zona</div><div className="v">{activo?.renta_zona != null ? <>{activo.renta_zona}<span className="unit"> €/m²</span></> : '—'}</div></div>
          <div className="va-kpi warn"><div className="k">Disponibilidad</div><div className="v">{activo?.occupancy_rate != null ? <>{(100 - activo.occupancy_rate).toFixed(1)}<span className="unit">%</span></> : '—'}</div></div>
        </div>
      </div>

      {/* Seguimiento comercial — resumen compacto (sustituye a la sección que estaba en Info general) */}
      <div className="va-side-card">
        <div className="va-side-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Seguimiento comercial</span>
          <span style={{fontSize:9,color:'var(--text4)',fontWeight:400}}>10 eventos · 90d</span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:11}}>
          {[
            { d:'01 mar', t:'Presentación', a:'Oracle Spain', s:'Finalista', c:'var(--green)' },
            { d:'28 feb', t:'Visita',       a:'Empresa XYZ',  s:'En curso',  c:'var(--amber)' },
            { d:'15 feb', t:'Visita',       a:'Oracle Spain', s:'Finalista', c:'var(--green)' },
            { d:'12 feb', t:'Presentación', a:'Empresa XYZ',  s:'En curso',  c:'var(--amber)' },
            { d:'20 ene', t:'Presentación', a:'Generali RE',  s:'Firmado',   c:'var(--accent)' },
          ].map((e,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'46px 1fr auto',gap:6,alignItems:'center',padding:'4px 0',borderBottom:i<4?'1px solid var(--border)':'none'}}>
              <span style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{e.d}</span>
              <span style={{fontSize:11,color:'var(--text2)'}}><span style={{fontWeight:600,marginRight:4}}>{e.t}</span>· {e.a}</span>
              <span style={{fontSize:9,fontWeight:600,color:e.c,whiteSpace:'nowrap'}}>{e.s}</span>
            </div>
          ))}
        </div>
        <div style={{textAlign:'right',marginTop:6}}>
          <span style={{fontSize:10,color:'var(--accent)',cursor:'pointer'}}>Ver Vista 360 →</span>
        </div>
      </div>

      {/* 4. KPIs Financieros — desde activos.* */}
      <div className="va-side-card">
        <div className="va-side-title">KPIs Financieros</div>
        <div className="va-fin-grid">
          <div className="va-fin-item warn"><div className="k">Ocupación</div><div className="v">{activo?.occupancy_rate != null ? `${activo.occupancy_rate}%` : '—'}</div></div>
          <div className="va-fin-item ok"><div className="k">Ingresos brutos</div><div className="v">{activo?.ingresos_brutos || '—'}</div></div>
          <div className="va-fin-item"><div className="k">WAULT</div><div className="v">{activo?.wault ? `${activo.wault} años` : '—'}</div></div>
          <div className="va-fin-item ok"><div className="k">Yield</div><div className="v">{activo?.yield_pct ? `${activo.yield_pct}%` : '—'}</div></div>
          <div className="va-fin-item hero"><div className="k">Precio Adquisición</div><div className="v">{activo?.precio_compra || '—'}</div></div>
        </div>
      </div>

      {/* 5. Vencimientos contractuales — derivados de arrendatariosReg */}
      {(() => {
        const today = new Date()
        const parseDDMMYYYY = (s) => { if(!s) return null; const [d,m,y]=s.split('/'); return d&&m&&y ? new Date(+y, +m-1, +d) : null }
        const venc = arrendatariosReg
          .map(a => {
            const breakDate = parseDDMMYYYY(a.break_option)
            const finDate   = parseDDMMYYYY(a.fecha_fin)
            const next = breakDate || finDate
            if (!next) return null
            const days = Math.round((next - today) / (1000*60*60*24))
            const tipo = breakDate ? 'Break option' : 'Contrato'
            const meses = next.toLocaleDateString('es-ES', { month:'short', year:'numeric' })
            const sup = a.superficie ? `${Number(a.superficie).toLocaleString('es-ES')} m²` : '—'
            return { name: a.tenant, tipo, label: `${a.tenant} — ${tipo}`, sub: `${meses} · ${sup}`, days }
          })
          .filter(Boolean)
          .sort((a,b) => a.days - b.days)
          .slice(0,4)
        if (venc.length === 0) return null
        return (
          <div className="va-side-card">
            <div className="va-side-title">Vencimientos contractuales</div>
            {venc.map((v,i,arr)=>{
              let urgency = '', urgBg = '', urgColor = '', dotColor = 'var(--va-muted2)'
              if (v.days < 0)        { urgency = 'Vencido';   urgBg = '#FEE2E2'; urgColor = '#991B1B'; dotColor = 'var(--pdb-red)' }
              else if (v.days <= 90) { urgency = 'Próximo';   urgBg = '#FEF3C7'; urgColor = '#92400E'; dotColor = 'var(--pdb-orange)' }
              else if (v.days <= 365){ urgency = `${Math.round(v.days/30)} meses`; urgBg = '#FEF3C7'; urgColor = '#92400E'; dotColor = 'var(--pdb-orange)' }
              return (
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'7px 0',borderBottom:i<arr.length-1?'1px dashed var(--va-line2)':'none'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:dotColor,flexShrink:0,marginTop:4}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500,color:'var(--ink)'}}>{v.label}</div>
                    <div style={{fontSize:11,color:'var(--va-muted)'}}>{v.sub}</div>
                  </div>
                  {urgency && <span style={{fontSize:10,fontWeight:600,color:urgColor,background:urgBg,padding:'2px 8px',borderRadius:999,whiteSpace:'nowrap'}}>{urgency}</span>}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* 6. Propuestas / Proyectos en curso */}
      <div className="va-side-card">
        <div className="va-side-title">Propuestas / Proyectos</div>
        {[
          {ico:'🏗',label:'Reforma integral lobby',sub:'Arquitectura · En curso',dot:'var(--pdb-orange)'},
          {ico:'',label:'Mandato captación P4-P5',sub:'Leasing · Activo',dot:'var(--pdb-blue)'},
        ].map((p,i)=>(
          <div key={i} className="va-proj-item">
            <div className="va-proj-ico">{p.ico}</div>
            <div style={{flex:1}}>
              <div className="va-proj-title">{p.label}</div>
              <div className="va-proj-meta"><div className="va-proj-dot" style={{background:p.dot}}/>{p.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 7. Historial */}
      <div className="va-side-card">
        <div className="va-side-title">Historial</div>
        {[
          {cls:'transac',   label:'Transacción', desc:'Repsol — Renovación',   fecha:'Mar 2022'},
          {cls:'mandato',   label:'Mandato',     desc:'Exclusiva leasing 2023', fecha:'Ene 2023'},
          {cls:'valoracion',label:'Valoración',  desc:'Anual Q1 2026',          fecha:'Mar 2026'},
        ].map((h,i)=>(
          <div key={i} className="va-hist-item">
            <span className={`va-hist-tag ${h.cls}`}>{h.label}</span>
            <div>
              <div className="va-hist-title">{h.desc}</div>
              <div className="va-hist-date">{h.fecha}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 8. Propietario y contactos */}
      <div className="va-side-card">
        <div className="va-side-title">Propietario</div>
        <div className="va-owner">
          <div className="va-owner-avatar">BC</div>
          <div>
            <div className="va-owner-name">Barings Core Spain SOCIMI</div>
            <div className="va-owner-meta">Fondo inversión · Yield 5,2%</div>
          </div>
        </div>
        <div className="va-team-item accent-blue">
          <div className="va-team-ini">AS</div>
          <div><div className="va-team-name">Sierra Álvaro</div><div className="va-team-role">Transaction Spain · Responsable</div></div>
        </div>
        <div className="va-team-item accent-pink">
          <div className="va-team-ini">MR</div>
          <div><div className="va-team-name">María Ruiz</div><div className="va-team-role">Leasing Oficinas MAD</div></div>
        </div>
      </div>

      {/* 9. Documentos recientes — iconos vectoriales por tipo de archivo */}
      <div className="va-side-card">
        <div className="va-side-title">Documentos recientes</div>
        {[
          { Ico:FileText,        icoType:'pdf', name:'Dossier Avalon',      fecha:'07/02/2026', tag:'Comercial',  tagType:'comercial'  },
          { Ico:FileSpreadsheet, icoType:'xls', name:'Valoración Q1 2026',  fecha:'20/03/2026', tag:'Valoración', tagType:'valoracion' },
          { Ico:ClipboardList,   icoType:'ppt', name:'Rent Roll 2026',      fecha:'01/01/2026', tag:'Comercial',  tagType:'comercial'  },
        ].map((d,i)=>(
          <div key={i} className="va-doc-item">
            <div className={`va-doc-ico ${d.icoType}`} style={{display:'flex',alignItems:'center',justifyContent:'center'}}><d.Ico size={16} strokeWidth={1.75}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div className="va-doc-title">{d.name}</div>
              <div className="va-doc-date">{d.fecha}</div>
            </div>
            <span className={`va-doc-tag ${d.tagType}`}>{d.tag}</span>
          </div>
        ))}
        <span className="va-doc-all">Ver todos (8)</span>
      </div>

    </div>
  )
}

/* ══ Actividades follow-up ══ */
const TIPO_TAG_ACT = { Email:'tag-blue', Llamada:'tag-green', Reunión:'tag-purple', Tarea:'tag-gray', Visita:'tag-teal', Nota:'tag-gray' }
const TIPO_ICO_ACT = { Email: Mail, Llamada: Phone, Reunión: Users, Tarea: CheckSquare, Visita: Building2, Nota: Pencil }
function TipoIcoAct({ tipo, size = 11 }) {
  const Ico = TIPO_ICO_ACT[tipo] || Inbox
  return <Ico size={size} strokeWidth={1.75} />
}
const ACT_EST_ACT  = { Abierto:'tag-amber', Finalizado:'tag-gray', 'En curso':'tag-blue', Realizada:'tag-green' }
const FOLLOWUP_ACTS = [
  { id:'ACT-AV-01', tipo:'Reunión',  asunto:'Reunión propietario Barings — revisión estado comercialización Q1',   fecha:'15/01/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'Finalizado' },
  { id:'ACT-AV-02', tipo:'Visita',   asunto:'Visita técnica Oracle Spain SL — P1–P4 Edif. D (13.486 m²)',         fecha:'20/02/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'Realizada'  },
  { id:'ACT-AV-03', tipo:'Email',    asunto:'Envío informe ocupación Q1 2026 al asset manager de Barings',        fecha:'01/03/2026', user:'GOMEZ Ignacio', initials:'GI', bg:'#fdf4ff', color:'#6b5b8e', estado:'Finalizado' },
  { id:'ACT-AV-04', tipo:'Llamada',  asunto:'Llamada Asset Manager Barings — interés mandato captación P4–P5',    fecha:'12/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'Finalizado' },
  { id:'ACT-AV-05', tipo:'Reunión',  asunto:'Visita Oracle Spain — segunda visita + negociación condiciones',     fecha:'28/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'Finalizado' },
  { id:'ACT-AV-06', tipo:'Email',    asunto:'Contraoferta Oracle enviada a propietario — pendiente validación',   fecha:'02/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'Finalizado' },
  { id:'ACT-AV-07', tipo:'Tarea',    asunto:'Preparar informe de gestión mensual para Barings — deadline 15/04', fecha:'07/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#f5efe5', color:'#5a4828', estado:'En curso'   },
]

/* ══ Rent Roll data ══ */
const RENT_ROLL_ROWS = [
  { contrato:'CTR-2201', arrendatario:'Celonis Spain SL',    edificio:'Edif. A', planta:'P5', uso:'Oficinas', sup:1202, rentaM2:14.5, inicio:'01/01/2022', vencimiento:'31/10/2025', breakOpt:'31/10/2025', estado:'Arrendado' },
  { contrato:'CTR-2202', arrendatario:'Celonis Spain SL',    edificio:'Edif. A', planta:'P4', uso:'Oficinas', sup:1500, rentaM2:14.5, inicio:'01/01/2022', vencimiento:'31/10/2025', breakOpt:'31/10/2025', estado:'Arrendado' },
  { contrato:'CTR-2203', arrendatario:'Celonis Spain SL',    edificio:'Edif. C', planta:'P4', uso:'Oficinas', sup:1300, rentaM2:14.0, inicio:'01/03/2022', vencimiento:'31/10/2025', breakOpt:'31/10/2025', estado:'Arrendado' },
  { contrato:'CTR-2301', arrendatario:'Repsol S.A.',         edificio:'Edif. A', planta:'P3', uso:'Oficinas', sup:767,  rentaM2:12.5, inicio:'01/06/2020', vencimiento:'30/06/2027', breakOpt:'—',          estado:'Arrendado' },
  { contrato:'CTR-2302', arrendatario:'Repsol S.A.',         edificio:'Edif. A', planta:'P2', uso:'Oficinas', sup:1200, rentaM2:12.5, inicio:'01/06/2020', vencimiento:'30/06/2027', breakOpt:'—',          estado:'Arrendado' },
  { contrato:'CTR-2303', arrendatario:'Repsol S.A.',         edificio:'Edif. C', planta:'PB', uso:'Oficinas', sup:1967, rentaM2:12.0, inicio:'01/06/2020', vencimiento:'30/06/2027', breakOpt:'—',          estado:'Arrendado' },
  { contrato:'—',        arrendatario:'DISPONIBLE',          edificio:'Edif. A', planta:'P5', uso:'Oficinas', sup:298,  rentaM2:null,  inicio:'—',          vencimiento:'—',          breakOpt:'—',          estado:'Disponible' },
  { contrato:'—',        arrendatario:'DISPONIBLE',          edificio:'Edif. A', planta:'P3', uso:'Oficinas', sup:733,  rentaM2:null,  inicio:'—',          vencimiento:'—',          breakOpt:'—',          estado:'Disponible' },
  { contrato:'—',        arrendatario:'DISPONIBLE',          edificio:'Edif. A', planta:'P2', uso:'Oficinas', sup:300,  rentaM2:null,  inicio:'—',          vencimiento:'—',          breakOpt:'—',          estado:'Disponible' },
  { contrato:'CTR-2401', arrendatario:'Oracle Spain SL',     edificio:'Edif. D', planta:'P1–P4', uso:'Oficinas', sup:13486, rentaM2:13.0, inicio:'—', vencimiento:'31/03/2028', breakOpt:'31/03/2026', estado:'En negociación' },
  { contrato:'CTR-2101', arrendatario:'—',                   edificio:'Edif. A', planta:'S1', uso:'Parking',  sup:null, rentaM2:90,   inicio:'01/01/2021', vencimiento:'31/12/2026', breakOpt:'—',          estado:'Arrendado', plazas:778, rentaPlaza:'90 €/plaza/mes' },
  { contrato:'CTR-2102', arrendatario:'—',                   edificio:'Edif. C', planta:'S2', uso:'Parking',  sup:null, rentaM2:90,   inicio:'01/01/2021', vencimiento:'31/12/2026', breakOpt:'—',          estado:'Arrendado', plazas:52,  rentaPlaza:'90 €/plaza/mes' },
]

async function exportRentRoll(activo = 'P.E Avalon') {
  const XLSX = await import('xlsx')
  const X = XLSX.default || XLSX

  const now = new Date().toLocaleDateString('es-ES')

  // ── Cabecera del informe ──
  const header = [
    [`RENT ROLL — ${activo}`],
    [`Fecha de extracción: ${now}`],
    [`Generado por: PropDatabase CRM`],
    [],
  ]

  // ── Cabecera de columnas ──
  const cols = [
    'Ref. Contrato','Arrendatario','Edificio','Planta','Uso',
    'Sup. (m²)','Renta €/m²/mes','Renta mensual (€)','Renta anual (€)',
    'Inicio contrato','Vencimiento','Break option','Estado','Plazas parking','Renta plaza (€)',
  ]

  // ── Filas de datos ──
  const rows = RENT_ROLL_ROWS.map(r => {
    const rentaMes  = r.rentaM2 && r.sup ? Math.round(r.sup * r.rentaM2) : null
    const rentaAnio = rentaMes ? rentaMes * 12 : null
    return [
      r.contrato,
      r.arrendatario,
      r.edificio,
      r.planta,
      r.uso,
      r.sup ?? '',
      r.rentaM2 ?? '',
      rentaMes ?? '',
      rentaAnio ?? '',
      r.inicio,
      r.vencimiento,
      r.breakOpt,
      r.estado,
      r.plazas ?? '',
      r.rentaPlaza ?? '',
    ]
  })

  // ── Fila de totales ──
  const totalSup     = RENT_ROLL_ROWS.filter(r=>r.sup && r.estado==='Arrendado').reduce((s,r)=>s+r.sup,0)
  const totalMes     = RENT_ROLL_ROWS.filter(r=>r.rentaM2&&r.sup).reduce((s,r)=>s+Math.round(r.sup*r.rentaM2),0)
  const totalAnio    = totalMes * 12
  const totals = ['TOTAL','','','','',totalSup,'',totalMes,totalAnio,'','','','','','']

  const aoa = [...header, cols, ...rows, [], totals]

  const ws = X.utils.aoa_to_sheet(aoa)

  // Anchos de columna
  ws['!cols'] = [
    {wch:14},{wch:28},{wch:10},{wch:10},{wch:10},
    {wch:10},{wch:16},{wch:18},{wch:16},
    {wch:14},{wch:14},{wch:14},{wch:16},{wch:14},{wch:18},
  ]

  const wb = X.utils.book_new()
  X.utils.book_append_sheet(wb, ws, 'Rent Roll')
  X.writeFile(wb, `RentRoll_${activo.replace(/\s/g,'_')}_${now.replace(/\//g,'-')}.xlsx`)
}

async function exportFichaActivo(navigate_) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const azul = [37, 99, 235]
  const gris = [100, 116, 139]
  const negro = [15, 23, 42]
  const borde = [226, 232, 240]

  // ── Cabecera ──
  doc.setFillColor(...azul)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16).setFont('helvetica','bold')
  doc.text('P.E Avalon', 14, 12)
  doc.setFontSize(9).setFont('helvetica','normal')
  doc.text('Parque Empresarial · Julián Camarillo, Madrid · M-30', 14, 19)
  doc.text(`Exportado: ${new Date().toLocaleDateString('es-ES')}`, 140, 19)

  // ── KPIs principales ──
  doc.setTextColor(...negro)
  doc.setFontSize(8).setFont('helvetica','bold')
  const kpis = [
    ['SBA Total','46.956 m²'],['Ocupación','78,4%'],['Renta','10,5 €/m²/mes'],
    ['Valor','130 M€'],['WAULT','3,2 años'],['Disponible','10.142 m²'],
  ]
  const kpiX = [14,47,80,113,146,179]
  kpis.forEach(([lbl,val],i)=>{
    doc.setFont('helvetica','bold').setFontSize(7).setTextColor(...gris)
    doc.text(lbl.toUpperCase(), kpiX[i], 36)
    doc.setFont('helvetica','bold').setFontSize(11).setTextColor(...negro)
    doc.text(val, kpiX[i], 43)
  })
  doc.setDrawColor(...borde)
  doc.line(14, 48, 196, 48)

  // ── Información general ──
  doc.setFont('helvetica','bold').setFontSize(9).setTextColor(...azul)
  doc.text('INFORMACIÓN GENERAL', 14, 56)
  doc.setFont('helvetica','normal').setFontSize(8).setTextColor(...negro)
  const info = [
    ['Dirección','Calle Julián Camarillo 4, 28037 Madrid'],
    ['Zona','M-30 · Julián Camarillo'],
    ['Uso principal','Oficinas'],
    ['Año construcción','2001 · Rehabilitación 2018'],
    ['Certificación','LEED Gold · BREEAM Very Good'],
    ['Propietario','Barings Real Estate'],
    ['Gestora','Savills Investment Management'],
  ]
  info.forEach(([k,v],i)=>{
    doc.setFont('helvetica','bold').setTextColor(...gris).text(k+': ', 14, 63+i*6)
    doc.setFont('helvetica','normal').setTextColor(...negro).text(v, 50, 63+i*6)
  })
  doc.line(14, 107, 196, 107)

  // ── Rent Roll resumen ──
  doc.setFont('helvetica','bold').setFontSize(9).setTextColor(...azul)
  doc.text('RENT ROLL — RESUMEN', 14, 114)
  const rrHeaders = ['Arrendatario','Planta','Sup. m²','€/m²/mes','Vencimiento','Estado']
  const rrWidths = [50,20,20,22,28,24]
  let rrX = 14
  let rrY = 120
  doc.setFont('helvetica','bold').setFontSize(7.5).setTextColor(255,255,255)
  doc.setFillColor(...azul)
  doc.rect(14, rrY-5, 182, 7, 'F')
  rrHeaders.forEach((h,i)=>{ doc.text(h, rrX+1, rrY); rrX += rrWidths[i] })

  const rrRows = [
    ['Celonis Spain SL','P4–P5','2.702','14,5','31/10/2025','Arrendado'],
    ['Repsol S.A.','P2–P3 + C-PB','3.934','12,5','30/06/2027','Arrendado'],
    ['Oracle Spain SL (neg.)','P1–P4 Edif. D','13.486','13,0','31/03/2028','En negociación'],
    ['DISPONIBLE','P3, P2, P5 (parcial)','1.331','—','—','Disponible'],
    ['Parking','S1 + S2','—','90€/plaza','31/12/2026','Arrendado'],
  ]
  rrRows.forEach((row,ri)=>{
    rrY += 6
    rrX = 14
    doc.setFillColor(ri%2===0?248:255, ri%2===0?250:255, ri%2===0?252:255)
    doc.rect(14, rrY-4.5, 182, 6, 'F')
    doc.setFont('helvetica','normal').setFontSize(7).setTextColor(...negro)
    row.forEach((cell,ci)=>{ doc.text(String(cell), rrX+1, rrY); rrX += rrWidths[ci] })
  })
  rrY += 2
  doc.setDrawColor(...borde).line(14, rrY, 196, rrY)

  // ── Vencimientos ──
  rrY += 8
  doc.setFont('helvetica','bold').setFontSize(9).setTextColor(...azul)
  doc.text('PRÓXIMOS VENCIMIENTOS', 14, rrY)
  rrY += 7
  doc.setFont('helvetica','normal').setFontSize(8).setTextColor(...negro)
  ;[
    '• Oct 2025 — Break option Celonis (2.702 m²) · VENCIDA',
    '• Mar 2026 — Break option Oracle (13.486 m²)',
    '• Jun 2027 — Fin contrato Repsol (3.934 m²)',
  ].forEach(t=>{ doc.text(t, 14, rrY); rrY+=6 })

  // ── Footer ──
  doc.setFont('helvetica','normal').setFontSize(7).setTextColor(...gris)
  doc.text('Generado por PropDatabase CRM · Savills Spain · Confidencial', 14, 287)
  doc.text('Página 1 / 1', 180, 287)

  doc.save(`FichaActivo_P.E_Avalon_${new Date().toLocaleDateString('es-ES').replace(/\//g,'-')}.pdf`)
}

/* ── Helpers compartidos por los modales ── */
const _inp = {padding:'5px 9px',border:'1px solid var(--border)',borderRadius:5,fontSize:12,fontFamily:'inherit',width:'100%',boxSizing:'border-box',outline:'none',background:'var(--surface)',color:'var(--text1)'}
const _sel = {..._inp,cursor:'pointer'}
const _ro  = {..._inp,background:'var(--gray-lt)',color:'var(--text3)'}
function ModalField({label,children}){
  return <div><div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>{label}</div>{children}</div>
}
function CuentaSearch({value, onChange}){
  const [open,setOpen]=useState(false)
  const filtered = CUENTAS_FA.filter(c=>c.toLowerCase().includes(value.toLowerCase())).slice(0,8)
  return (
    <div style={{position:'relative'}}>
      <div style={{display:'flex',alignItems:'center',border:'1px solid var(--accent-bd)',borderRadius:5,background:'var(--accent-lt)',overflow:'hidden'}}>
        <input value={value} onChange={e=>{onChange(e.target.value);setOpen(true)}} onFocus={()=>setOpen(true)}
          placeholder="Buscar cuenta…"
          style={{flex:1,padding:'5px 9px',border:'none',background:'none',fontSize:12,fontFamily:'inherit',outline:'none'}}/>
        <span style={{padding:'0 10px',color:'var(--accent)',userSelect:'none',display:'inline-flex',alignItems:'center'}}><Search size={14} strokeWidth={1.75}/></span>
      </div>
      {open && filtered.length>0 && (
        <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:2,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:5,boxShadow:'0 4px 16px rgba(0,0,0,.12)',zIndex:2100,maxHeight:220,overflowY:'auto'}}>
          {filtered.map(c=>(
            <div key={c} onMouseDown={e=>{e.preventDefault();onChange(c);setOpen(false)}}
              style={{padding:'8px 12px',fontSize:12,cursor:'pointer',borderBottom:'1px solid var(--border)'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
              onMouseLeave={e=>e.currentTarget.style.background=''}>
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NuevoPropietarioModal({activo, onClose, onSave}){
  const [f,setF]=useState({
    cuenta:'', tipologia:'Asset deal', anyo_compra:'', trimestre:'Q1',
    precio_compra:'', regimen:'Propiedad 100%', perfil:'Core',
    cap_rate:'', yield_pct:'', estrategia:'Hold', estado:'Activo',
  })
  const set=(k,v)=>setF(p=>({...p,[k]:v}))
  const handleSave=()=>{
    if(!f.cuenta.trim()){alert('Selecciona una cuenta');return}
    onSave({
      id:`PRO-${Date.now()}`, propietario:f.cuenta,
      activo:activo?.nombre||'', activo_ref:activo?.ref||'',
      zona:activo?.zona||'', area:activo?.area||'', uso:activo?.uso||'',
      sba:activo?.sba||0,
      tipologia:f.tipologia, anyo_compra:f.anyo_compra, trimestre:f.trimestre,
      precio_compra:f.precio_compra, regimen:f.regimen, perfil:f.perfil,
      cap_rate:f.cap_rate, yield_pct:f.yield_pct, estrategia:f.estrategia, estado:f.estado,
    })
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'var(--surface)',borderRadius:'var(--r2)',width:'100%',maxWidth:620,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
        {/* Cabecera */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--surface)',zIndex:1}}>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Nuevo propietario</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>Activo: <strong>{activo?.nombre||'—'}</strong></div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--text3)',lineHeight:1,padding:'0 4px'}}>✕</button>
        </div>
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
          {/* CUENTA */}
          <ModalField label="Cuenta *">
            <CuentaSearch value={f.cuenta} onChange={v=>set('cuenta',v)}/>
          </ModalField>
          {/* Activo auto-rellenado */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <ModalField label="Activo"><input value={activo?.nombre||'—'} readOnly style={_ro}/></ModalField>
            <ModalField label="Uso"><input value={activo?.uso||'—'} readOnly style={_ro}/></ModalField>
            <ModalField label="SBA (m²)"><input value={activo?.sba?.toLocaleString('es-ES')||'—'} readOnly style={_ro}/></ModalField>
            <ModalField label="Zona"><input value={activo?.zona||'—'} readOnly style={_ro}/></ModalField>
          </div>
          <div style={{height:1,background:'var(--border)'}}/>
          {/* Campos a rellenar */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <ModalField label="Tipología">
              <select value={f.tipologia} onChange={e=>set('tipologia',e.target.value)} style={_sel}>
                <option>Asset deal</option><option>Share deal</option><option>Cartera</option><option>Sale &amp; leaseback</option><option>Otro</option>
              </select>
            </ModalField>
            <ModalField label="Año compra">
              <input type="number" value={f.anyo_compra} onChange={e=>set('anyo_compra',e.target.value)} placeholder="2024" style={_inp}/>
            </ModalField>
            <ModalField label="Trimestre">
              <select value={f.trimestre} onChange={e=>set('trimestre',e.target.value)} style={_sel}>
                <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
              </select>
            </ModalField>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <ModalField label="Precio compra">
              <input value={f.precio_compra} onChange={e=>set('precio_compra',e.target.value)} placeholder="130 M€" style={_inp}/>
            </ModalField>
            <ModalField label="Régimen">
              <select value={f.regimen} onChange={e=>set('regimen',e.target.value)} style={_sel}>
                <option>Propiedad 100%</option><option>Copropietario</option><option>Usufructo</option><option>Nuda propiedad</option>
              </select>
            </ModalField>
            <ModalField label="Perfil inversor">
              <select value={f.perfil} onChange={e=>set('perfil',e.target.value)} style={_sel}>
                <option>Core</option><option>Core+</option><option>Value-add</option><option>Oportunista</option><option>Institucional</option><option>Privado</option>
              </select>
            </ModalField>
            <ModalField label="Estrategia">
              <select value={f.estrategia} onChange={e=>set('estrategia',e.target.value)} style={_sel}>
                <option>Hold</option><option>Sell</option><option>Reposition</option><option>Desarrollo</option>
              </select>
            </ModalField>
            <ModalField label="Cap Rate compra (%)">
              <input type="number" step="0.1" value={f.cap_rate} onChange={e=>set('cap_rate',e.target.value)} placeholder="5.1" style={_inp}/>
            </ModalField>
            <ModalField label="Yield (%)">
              <input type="number" step="0.1" value={f.yield_pct} onChange={e=>set('yield_pct',e.target.value)} placeholder="5.4" style={_inp}/>
            </ModalField>
          </div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',padding:'12px 20px',borderTop:'1px solid var(--border)',position:'sticky',bottom:0,background:'var(--surface)'}}>
          <button onClick={onClose} style={{padding:'7px 16px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
          <button onClick={handleSave} style={{padding:'7px 20px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>💾 Guardar propietario</button>
        </div>
      </div>
    </div>
  )
}

function NuevoArrendatarioModal({activo, propietarioActivo, onClose, onSave}){
  const [f,setF]=useState({
    cuenta:'', edificio:'', planta:'', sup:'', uso:activo?.uso||'',
    anyo_firma:'', trimestre:'Q1', tipo_contrato:'Alquiler comercial',
    fecha_inicio:'', fecha_fin:'', break_option:'',
    closing_rent:'', carencia:'0', plazas_int:'0', plazas_ext:'0',
    estado:'Arrendado', sector:'',
  })
  const set=(k,v)=>setF(p=>({...p,[k]:v}))
  const handleSave=()=>{
    if(!f.cuenta.trim()){alert('Selecciona una cuenta');return}
    onSave({
      id:`ARR-${Date.now()}`, tenant:f.cuenta,
      activo:activo?.nombre||'', activo_ref:activo?.ref||'',
      propietario:propietarioActivo||'—',
      edificio:f.edificio, planta:f.planta,
      sup:f.sup ? parseFloat(f.sup) : 0,
      uso:f.uso, anyo_firma:f.anyo_firma, trimestre:f.trimestre,
      tipo_contrato:f.tipo_contrato,
      fecha_inicio:f.fecha_inicio, fecha_fin:f.fecha_fin, break_option:f.break_option,
      closing_rent:f.closing_rent, carencia:f.carencia,
      plazas_int:f.plazas_int, plazas_ext:f.plazas_ext,
      estado:f.estado, sector:f.sector,
    })
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'var(--surface)',borderRadius:'var(--r2)',width:'100%',maxWidth:640,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--surface)',zIndex:1}}>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Nuevo arrendatario</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>Activo: <strong>{activo?.nombre||'—'}</strong></div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--text3)',lineHeight:1,padding:'0 4px'}}>✕</button>
        </div>
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
          <ModalField label="Cuenta / Arrendatario *">
            <CuentaSearch value={f.cuenta} onChange={v=>set('cuenta',v)}/>
          </ModalField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <ModalField label="Activo"><input value={activo?.nombre||'—'} readOnly style={_ro}/></ModalField>
            <ModalField label="Propietario"><input value={propietarioActivo||'—'} readOnly style={_ro}/></ModalField>
          </div>
          <div style={{height:1,background:'var(--border)'}}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <ModalField label="Edificio">
              <input value={f.edificio} onChange={e=>set('edificio',e.target.value)} placeholder="Edif. A" style={_inp}/>
            </ModalField>
            <ModalField label="Planta(s)">
              <input value={f.planta} onChange={e=>set('planta',e.target.value)} placeholder="P3 — P5" style={_inp}/>
            </ModalField>
            <ModalField label="Superficie (m²)">
              <input type="number" value={f.sup} onChange={e=>set('sup',e.target.value)} placeholder="2500" style={_inp}/>
            </ModalField>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <ModalField label="Uso">
              <select value={f.uso} onChange={e=>set('uso',e.target.value)} style={_sel}>
                <option>Oficinas</option><option>Logístico</option><option>Retail</option><option>Parking</option><option>Residencial</option><option>Otro</option>
              </select>
            </ModalField>
            <ModalField label="Sector">
              <input value={f.sector} onChange={e=>set('sector',e.target.value)} placeholder="Tecnología, Banca…" style={_inp}/>
            </ModalField>
            <ModalField label="Año firma">
              <input type="number" value={f.anyo_firma} onChange={e=>set('anyo_firma',e.target.value)} placeholder="2024" style={_inp}/>
            </ModalField>
            <ModalField label="Trimestre">
              <select value={f.trimestre} onChange={e=>set('trimestre',e.target.value)} style={_sel}>
                <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
              </select>
            </ModalField>
            <ModalField label="Tipo contrato">
              <select value={f.tipo_contrato} onChange={e=>set('tipo_contrato',e.target.value)} style={_sel}>
                <option>Alquiler comercial</option><option>Alquiler residencial</option><option>Precario</option><option>Cesión de uso</option>
              </select>
            </ModalField>
            <ModalField label="Estado">
              <select value={f.estado} onChange={e=>set('estado',e.target.value)} style={_sel}>
                <option>Arrendado</option><option>Próximo a vencimiento</option><option>En negociación</option><option>Vacío</option>
              </select>
            </ModalField>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <ModalField label="Fecha inicio">
              <input type="date" value={f.fecha_inicio} onChange={e=>set('fecha_inicio',e.target.value)} style={_inp}/>
            </ModalField>
            <ModalField label="Fecha fin / Vencimiento">
              <input type="date" value={f.fecha_fin} onChange={e=>set('fecha_fin',e.target.value)} style={_inp}/>
            </ModalField>
            <ModalField label="Break option">
              <input type="date" value={f.break_option} onChange={e=>set('break_option',e.target.value)} style={_inp}/>
            </ModalField>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12}}>
            <ModalField label="Closing rent (€/m²/mes)">
              <input type="number" step="0.01" value={f.closing_rent} onChange={e=>set('closing_rent',e.target.value)} placeholder="12.50" style={_inp}/>
            </ModalField>
            <ModalField label="Carencia (meses)">
              <input type="number" value={f.carencia} onChange={e=>set('carencia',e.target.value)} placeholder="0" style={_inp}/>
            </ModalField>
            <ModalField label="Plazas int.">
              <input type="number" value={f.plazas_int} onChange={e=>set('plazas_int',e.target.value)} placeholder="0" style={_inp}/>
            </ModalField>
            <ModalField label="Plazas ext.">
              <input type="number" value={f.plazas_ext} onChange={e=>set('plazas_ext',e.target.value)} placeholder="0" style={_inp}/>
            </ModalField>
          </div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',padding:'12px 20px',borderTop:'1px solid var(--border)',position:'sticky',bottom:0,background:'var(--surface)'}}>
          <button onClick={onClose} style={{padding:'7px 16px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
          <button onClick={handleSave} style={{padding:'7px 20px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>💾 Guardar arrendatario</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function FichaActivo() {
  const { navigate, params } = useNav()
  const isNew = !!params?.new && !params?.ref
  const [activeTab, setActiveTab]       = useState(params?.tab || 'at-info')
  const [caracTab, setCaracTab]         = useState('ct-transporte')
  const [docCat,   setDocCat]           = useState('todos')
  const [showTarea, setShowTarea]       = useState(false)
  const [showNotasModal, setShowNotasModal] = useState(false)
  const [showIneModal, setShowIneModal] = useState(false)
  const [notasInternas, setNotasInternas] = useState([
    // Mock inicial. Cuando la tabla notas_internas exista, vendrá de Supabase.
    { id:1, autor:'Sierra Álvaro', fecha:'10/05/2026', texto:'Llamar al propietario antes del 30/06 para revisar break options.' },
  ])
  const [nuevaNota, setNuevaNota] = useState('')
  const [confidential, setConfidential] = useState(false)
  const [authorizedUsers, setAuthorizedUsers] = useState([
    { name:'Sierra Álvaro',     team:'Leasing Oficinas MAD', role:'Principal',    initials:'AS', bg:'#f5efe5', color:'#5a4828', owner:true },
    { name:'GOMEZ Ignacio',     team:'Leasing Oficinas MAD', role:'Autorizado',   initials:'GI', bg:'#f0fdf4', color:'#166534', granted:'12/03/2026' },
  ])

  // ── Principales competidores — benchmarking ─────────────────────────────
  // Sistema de comparables: lista guardada + sugerencias automáticas por
  // similitud (zona, uso, superficie, renta). Persiste en activo_competidores
  // (migración 027+028). Motivos como array (multi-select).
  const [competidores, setCompetidores] = useState([])   // guardados en BD
  const [sugerencias, setSugerencias]   = useState([])   // auto, no guardados
  const [compLoading, setCompLoading]   = useState(false)
  const [compSearch, setCompSearch]     = useState('')
  const [compResults, setCompResults]   = useState([])
  const [compError, setCompError]       = useState(null)
  const [editMotivosFor, setEditMotivosFor] = useState(null) // id de competidor con el picker abierto
  // Motivos editables por sugerencia ANTES de añadir. Empieza con los auto-detectados.
  // Mapa { sugerencia_activo_id: motivos[] }
  const [sugMotivos, setSugMotivos] = useState({})
  const getSugMotivos = (sug) => sugMotivos[sug.competidor?.id] !== undefined ? sugMotivos[sug.competidor.id] : sug.motivos
  const toggleSugMotivo = (sug, m) => {
    const current = getSugMotivos(sug)
    const has = current.includes(m)
    const next = has ? current.filter(x => x !== m) : [...current, m]
    setSugMotivos(prev => ({ ...prev, [sug.competidor.id]: next }))
  }

  // Catálogo canónico de motivos (consistente con migración 028).
  const MOTIVO_CATALOG = [
    'Zona',
    'Tipología',
    'Volumen / superficie',
    'Rango de renta',
    'Calidad del activo',
    'Amenities',
    'Transporte y accesibilidad',
    'Estado del edificio',
    'Perfil de tenant',
    'Competidor prácticamente idéntico',
  ]

  // Compara dos activos y devuelve { motivos: [...], score: 0..10, tags: [...] }
  // Usado por las sugerencias automáticas y para los tags visuales.
  const computeSimilarity = (other) => {
    if (!activo || !other) return { motivos: [], score: 0, tags: [] }
    const motivos = []
    const tags = []
    if (activo.zona && other.zona && activo.zona === other.zona) { motivos.push('Zona'); tags.push('Misma zona') }
    if (activo.uso && other.uso && activo.uso === other.uso) { motivos.push('Tipología'); tags.push('Similar por tipología') }
    if (activo.sba && other.sba) {
      const ratio = other.sba / activo.sba
      if (ratio >= 0.7 && ratio <= 1.3) { motivos.push('Volumen / superficie'); tags.push('Similar por volumen') }
    }
    if (activo.renta_zona && other.renta_zona) {
      const diff = Math.abs(other.renta_zona - activo.renta_zona) / activo.renta_zona
      if (diff <= 0.15) { motivos.push('Rango de renta'); tags.push('Similar por renta') }
    }
    if (activo.leed && other.leed) { motivos.push('Calidad del activo'); tags.push('Similar calidad') }
    if (activo.ciudad && other.ciudad && activo.ciudad === other.ciudad) {
      // Misma ciudad refuerza zona implícitamente — añade tag pero no motivo extra
      if (!tags.includes('Misma zona')) tags.push('Misma ciudad')
    }
    const score = motivos.length
    if (score >= 4) tags.push('Competidor directo')
    if (score >= 6) tags.push('Activo prácticamente idéntico')
    return { motivos, score, tags }
  }
  const [showSubstConfirm, setShowSubstConfirm] = useState(false)
  const [propietariosReg, setPropietariosReg] = useState(
    params?.newOwnerData ? [params.newOwnerData] : []
  )
  const [propietariosHist, setPropietariosHist] = useState(
    params?.substituteOwner && params?.previousOwner
      ? [{ propietario: params.previousOwner, fecha_salida: new Date().toLocaleDateString('es-ES'), id: `HIST-${Date.now()}` }]
      : []
  )
  const [arrendatariosReg, setArrendatariosReg] = useState(
    params?.newTenantData ? [params.newTenantData] : []
  )

  const [ofertas, setOfertas] = useState([])
  const [loadingOfertas, setLoadingOfertas] = useState(false)
  const [bajaArr, setBajaArr] = useState(null) // { unit, doRemove, activo } — legacy modal (Vencimientos)
  // Modales de salida v2 disparados desde la X del stacking
  const [salidaArr,  setSalidaArr]  = useState(null) // { unit, doRemove }
  const [salidaProp, setSalidaProp] = useState(null) // { unit, doRemove }
  const [salidaOfr,  setSalidaOfr]  = useState(null) // { unit, floorId, doRemove }
  const [showAltaPropietario, setShowAltaPropietario] = useState(false)

  const navigateToFichaProp = (substituteOwner = false) => {
    const previousOwner = propietariosReg[0]?.propietario || activo?.propietario || null
    navigate('ficha-propietario', {
      fromActivoRef: activo?.ref || params?.ref,
      fromActivoNombre: activo?.nombre || '',
      fromActivoZona: activo?.zona || '',
      fromActivoUso: activo?.uso || '',
      fromActivoSba: activo?.sba || 0,
      substituteOwner,
      previousOwner: substituteOwner ? previousOwner : null,
    })
  }

  const handleAddOwner = () => {
    // Si ya hay propietario en este activo, pide confirmación (sustitución).
    // Si no, abre el modal de alta rápida (lupa cuenta + campos mínimos).
    const hasOwner = propietariosReg.length > 0 || activo?.propietario
    if (hasOwner) {
      setShowSubstConfirm(true)
    } else {
      setShowAltaPropietario(true)
    }
  }

  // Callback del modal AltaPropietarioModal: registra el propietario en local
  // state (propietariosReg) para que aparezca en el panel lateral del stacking
  // y se pueda arrastrar a las plantas. La superficie se completa al hacer drop.
  const handlePropietarioCreado = async (propietario) => {
    // 1) Persistir en Supabase con ref canónico (PRO-XXXXXXX) para que la ficha
    //    del propietario cargue de verdad y la superficie se vincule por prop_id.
    //    Mismas columnas que FichaPropietario.handleSaveFromActivo.
    let savedId = null, savedRef = null
    try {
      const row = {
        nombre:        propietario.propietario,
        propietario:   propietario.propietario,
        activo:        activo?.nombre || activo?.direccion || null,
        activo_ref:    propietario.activo_ref || activo?.ref || null,
        // Hereda los datos estructurales del activo al vincularse.
        zona:          activo?.zona || null,
        subzona:       activo?.subzona || null,
        area:          activo?.area || null,
        uso:           activo?.uso || null,
        anyo_compra:   propietario.anyo_firma ? parseInt(propietario.anyo_firma) : null,
        trimestre:     propietario.trimestre || null,
        perfil:        propietario.perfil_inversor || null,
        estrategia:    propietario.estrategia || null,
        cap_rate:      propietario.cap_rate ? parseFloat(propietario.cap_rate) : null,
        observaciones: propietario.notas || null,
      }
      // propietarios no tiene columna `ref` en el esquema actual → no se envía.
      const { data, error } = await supabase.from('propietarios').insert(row).select('id').single()
      if (error) { console.error('Error guardando propietario:', error); alert('No se pudo guardar el propietario: ' + error.message) }
      else if (data) { savedId = data.id }
    } catch (e) { console.error('Exception guardando propietario:', e) }

    // 2) Estado local del panel del stacking con el id REAL (uuid) → al arrastrar
    //    se estampa prop_id = id real y todo queda vinculado.
    setPropietariosReg(prev => [...prev, {
      id: savedId || propietario.id,
      ref: savedRef,
      propietario: propietario.propietario,
      dynamics_id: propietario.dynamics_id,
      desconocido: propietario.desconocido,
      anyo_firma: propietario.anyo_firma,
      trimestre: propietario.trimestre,
      perfil_inversor: propietario.perfil_inversor,
      estrategia: propietario.estrategia,
      horizonte_inv: propietario.horizonte_inv,
      cap_rate: propietario.cap_rate,
      notas: propietario.notas,
      activo_ref: propietario.activo_ref,
    }])
    setShowAltaPropietario(false)
  }

  const [showAltaArrendatario, setShowAltaArrendatario] = useState(false)

  const handleAddTenant = () => {
    // Abre modal de alta rápida (lupa cuenta + obligatorios). La superficie
    // se asigna luego arrastrando en el stacking.
    setShowAltaArrendatario(true)
  }

  const handleArrendatarioCreado = async (arr) => {
    // 1) Persistir en Supabase con ref canónico (ARR-XXXXXXX). Garantizar el ref
    //    cliente-side evita que la ficha quede sin cargar ("Guarda primero…").
    //    Mismas columnas que FichaArrendatario.handleSaveUpdate (incl. `inicio`).
    const { nextRef } = await import('../lib/nextRef')
    let savedRef = null
    let savedId  = null
    try {
      const ref = await nextRef('arrendatarios', 'ARR')
      // Break option = fecha inicio + años de obligado cumplimiento (auto).
      const breakOption = (() => {
        if (!arr.fecha_inicio || arr.anios_obligado === '' || arr.anios_obligado == null) return null
        const d = new Date(arr.fecha_inicio)
        if (isNaN(d.getTime())) return null
        const aniosNum = Number(arr.anios_obligado)
        d.setFullYear(d.getFullYear() + Math.floor(aniosNum))
        const meses = Math.round((aniosNum - Math.floor(aniosNum)) * 12)
        if (meses) d.setMonth(d.getMonth() + meses)
        return d.toISOString().slice(0, 10)
      })()
      const payload = {
        ref,
        tenant: arr.tenant,
        nombre: arr.tenant,
        tenant_desconocido: !!arr.tenant_desconocido,
        activo_ref: arr.activo_ref || activo?.ref || null,
        edificio: activo?.nombre || activo?.direccion || null,
        anyo_firma: arr.anyo_firma ? Number(arr.anyo_firma) : null,
        trimestre: arr.trimestre || null,
        inicio: arr.fecha_inicio || null,
        break_option: breakOption,
        vencimiento: breakOption,
        closing_rent: arr.closing_rent !== '' && arr.closing_rent != null ? Number(arr.closing_rent) : null,
        renta: arr.closing_rent !== '' && arr.closing_rent != null ? Number(arr.closing_rent) : null,
        anios_obligado: arr.anios_obligado !== '' && arr.anios_obligado != null ? Number(arr.anios_obligado) : null,
        estado_arr: 'Vigente',
      }
      const { data, error } = await supabase
        .from('arrendatarios')
        .insert(payload)
        .select('id, ref')
        .single()
      if (error) {
        console.error('Error guardando arrendatario:', error)
        alert('No se pudo guardar el arrendatario: ' + error.message)
      } else if (data) {
        savedRef = data.ref || null
        savedId  = data.id  || null
      }
    } catch (e) {
      console.error('Exception guardando arrendatario:', e)
    }

    // 2) Añadir al estado local (panel del stacking) con la ref real de Supabase
    setArrendatariosReg(prev => [...prev, {
      id: savedId || arr.id,
      ref: savedRef || arr.id,
      tenant: arr.tenant,
      nombre: arr.tenant,
      dynamics_id: arr.dynamics_id,
      tenant_desconocido: arr.tenant_desconocido,
      anyo_firma: arr.anyo_firma,
      trimestre: arr.trimestre,
      fecha_inicio: arr.fecha_inicio,
      anios_obligado: arr.anios_obligado,
      closing_rent: arr.closing_rent,
      renta_m2: arr.closing_rent,
      renta_mensual: arr.renta_mensual,
      notas: arr.notas,
      activo_ref: arr.activo_ref,
    }])
    setShowAltaArrendatario(false)
  }

  const [plazas, setPlazas]             = useState([])
  const [showAddPlaza, setShowAddPlaza] = useState(false)
  const [newPlaza, setNewPlaza]         = useState({ubicacion:'Interior',tipo:'Simple',vehiculo:'Coches',cantidad:1})
  // ESG / Normativa
  const [esg, setEsg] = useState({ leed:'', breeam:'', well:'', dgnb:'', wiredscore:'', energia:'', consumo:'' })
  // Catastro sync (info adicional)
  const [catSyncAd, setCatSyncAd]     = useState(false)
  const [catSyncMsgAd, setCatSyncMsgAd] = useState('')
  // Transporte
  const [transportes, setTransportes] = useState([])
  const [showAddTransp, setShowAddTransp] = useState(false)
  const [newTransp, setNewTransp] = useState({medio:'Metro', linea:'', descripcion:'', tiempo:''})
  // Características generales { fieldId: { opcion:'', texto:'' } }
  const [caracGenVal, setCaracGenVal] = useState({})
  const setCGV = (id, key, val) => setCaracGenVal(p => ({...p, [id]: {...(p[id]||{}), [key]: val}}))
  // Características técnicas por uso
  const [caracUsoVal, setCaracUsoVal] = useState({})
  const setCUV = (id, key, val) => setCaracUsoVal(p => ({...p, [id]: {...(p[id]||{}), [key]: val}}))
  const [newForm, setNewForm]           = useState(NEW_FORM_INIT)
  const [saving,  setSaving]            = useState(false)
  const [saveErr, setSaveErr]           = useState('')
  const [saveOk,  setSaveOk]            = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const setNF = (k, v) => setNewForm(p => ({ ...p, [k]: v }))

  // Datos del activo desde Supabase
  const [activo, setActivo] = useState(null)
  const [loadingActivo, setLoadingActivo] = useState(false)
  const [displayNombre,   setDisplayNombre]   = useState(null) // overrides activo.nombre after inline save
  const [displayDireccion,setDisplayDireccion] = useState(null) // overrides activo.direccion after inline save
  const [editingNombre,   setEditingNombre]   = useState(false)
  const [editNombreVal,   setEditNombreVal]   = useState('')
  const [liveEdifCount,   setLiveEdifCount]   = useState(null) // synced from StackingPlan
  const [liveOwnerCount,  setLiveOwnerCount]  = useState(null) // unique propietarios assigned in stacking plan
  const infoSaveRef = useRef(null) // ref to TabInfo's handleSave
  const infoSyncRef = useRef(null) // ref to TabInfo's syncCatastro (available for future use)
  const liveStackingRef = useRef(null) // latest buildings state from StackingPlan
  const [liveBuildings, setLiveBuildings] = useState(null) // estado React para que las tablas se re-renderizen cuando cambie el stacking
  const activoRef = useRef(null) // always has latest activo (for auto-save closure)
  const autoSaveTimer = useRef(null) // debounce timer for stacking auto-save
  activoRef.current = activo // keep ref in sync on every render

  // Al desmontar (p. ej. al navegar a la ficha de un propietario para completar
  // un «Propietario desconocido»), vacía el autosave PENDIENTE: lo escribimos ya
  // y cancelamos el timer. Si no, el setTimeout huérfano se disparaba más tarde
  // y reescribía el stacking viejo encima de la asignación hecha en la ficha
  // (causa de que el propietario volviera a aparecer como «desconocido»).
  useEffect(() => () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = null
      const ref = activoRef.current?.ref
      const blds = liveStackingRef.current
      if (ref && blds) supabase.from('activos').update({ stacking_data: blds }).eq('ref', ref)
    }
  }, [])

  // Sincroniza superficie (y renta de cierre) de cada arrendatario/propietario
  // asignado en el stacking hacia su fila en BD, para que sus fichas lo
  // reflejen sin tener que abrirlas. Se llama tras persistir el stacking.
  const syncStackingToRecords = async (blds) => {
    const tenAgg = {}
    ;(blds||[]).flatMap(b=>b.arr||[]).flatMap(r=>r.units||[]).forEach(u=>{
      if(u.type==='ten' && u.arr_ref){
        const a = tenAgg[u.arr_ref] || { sup:0, renta:null }
        a.sup += Number(u.sup)||0
        if(u.renta>0 && a.renta==null) a.renta = Number(u.renta)
        tenAgg[u.arr_ref] = a
      }
    })
    for(const [arref, a] of Object.entries(tenAgg)){
      const upd = { superficie: a.sup }
      if(a.renta!=null){ upd.closing_rent = a.renta; upd.renta = a.renta }
      await supabase.from('arrendatarios').update(upd).eq('ref', arref)
    }
    const propAgg = {}
    ;(blds||[]).flatMap(b=>b.prop||[]).flatMap(r=>r.units||[]).forEach(u=>{
      if(u.prop_id){ propAgg[u.prop_id] = (propAgg[u.prop_id]||0) + (Number(u.sup)||0) }
    })
    for(const [pid, sup] of Object.entries(propAgg)){
      await supabase.from('propietarios').update({ superficie: sup }).eq('id', pid)
    }
  }

  useEffect(() => {
    if (!params?.ref) return
    setLoadingActivo(true)
    supabase.from('activos').select('*').eq('ref', params.ref).single()
      .then(({ data }) => {
        if (data) setActivo(data)
        setLoadingActivo(false)
      })
  }, [params?.ref])

  // ── Vínculos maestros del activo (mandato activo + count ofertas vivas) ──
  // Alimenta la banda <VinculacionesMaestra> arriba del tab Información general.
  // Propietarios y arrendatarios se leen de propietariosReg/arrendatariosReg
  // (ya cargados por otro flujo); aquí solo pedimos lo que no está disponible.
  const [vincMaestra, setVincMaestra] = useState({ mandatoActivo: null, ofertasActivasCount: 0, loaded: false })
  useEffect(() => {
    if (!activo?.id) return
    let cancelled = false
    ;(async () => {
      const [mandRes, ofRes] = await Promise.all([
        supabase.from('mandato_activos')
          .select('mandatos:mandato_id(id,ref,tipo,estado)')
          .eq('activo_id', activo.id),
        supabase.from('ofertas')
          .select('id', { count: 'exact', head: true })
          .or(`activo_id.eq.${activo.id},activo_ref.eq.${activo.ref}`)
          .neq('estado', 'Retirada'),
      ])
      if (cancelled) return
      const mandatos = (mandRes.data || []).map(m => m.mandatos).filter(Boolean)
      const mandatoActivo = mandatos.find(m => m.estado === 'en_curso') || null
      setVincMaestra({
        mandatoActivo,
        ofertasActivasCount: ofRes.count || 0,
        loaded: true,
      })
    })()
    return () => { cancelled = true }
  }, [activo?.id])

  // ── Pitches sincronizados al activo (desde la app Pitch externa) ─────────
  const [pitchesActivo, setPitchesActivo] = useState([])
  useEffect(() => {
    if (!activo?.id) return
    supabase
      .from('documentos')
      .select('id, nombre, url, fecha, pitch_external_id, autor')
      .eq('activo_id', activo.id)
      .eq('categoria', 'Pitch comercial')
      .order('fecha', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('[pitchesActivo]', error); return }
        setPitchesActivo(data || [])
      })
  }, [activo?.id])

  // ── Vista 360: carga el histórico comercial del activo ──────────────────
  // Solo se dispara cuando el usuario abre la pestaña Vista 360 y hay un
  // activo cargado. Lanza queries en paralelo para llenar las 6 secciones.
  const [vista360, setVista360] = useState({
    loading: false, loaded: false,
    ofertas: [], cuentas: [], demandas: [], transacciones: [], mandatos: [], propuestas: [],
  })
  useEffect(() => {
    if (activeTab !== 'at-360') return
    if (!activo?.id) return
    if (vista360.loaded) return
    let cancelled = false
    setVista360(s => ({ ...s, loading: true }))
    ;(async () => {
      const aid = activo.id
      const [ofertasRes, altsRes, transRes, mandActsRes] = await Promise.all([
        supabase.from('ofertas')
          .select('id,ref,estado,renta_m2,superficie_disponible,tipo_operacion,created_at')
          .or(`activo_id.eq.${aid},activo_ref.eq.${activo.ref}`).order('created_at', { ascending: false }),
        supabase.from('oferta_demanda')
          .select('demanda_id,estado_alternativa,created_at,demandas(id,ref,nombre,dynamics_account_id,sup_min,sup_max,estado)')
          .eq('activo_id', aid).order('created_at', { ascending: false }),
        supabase.from('negociaciones')
          .select('id,ref,estado,renta_cierre,fecha_cierre,contraparte_empresa,created_at')
          .eq('activo_id', aid).eq('estado', 'Firmado').order('fecha_cierre', { ascending: false }),
        supabase.from('mandato_activos')
          .select('mandatos(id,ref,tipo,estado,fecha_inicio,fecha_fin,propuesta_id)')
          .eq('activo_id', aid),
      ])

      // Demandas distinct (a partir de oferta_demanda)
      const alts = altsRes.data || []
      const seenDem = new Set()
      const demandas = []
      const accountIds = new Set()
      for (const a of alts) {
        const d = a.demandas
        if (!d || seenDem.has(d.id)) continue
        seenDem.add(d.id)
        demandas.push({ ...d, estado_alternativa: a.estado_alternativa })
        if (d.dynamics_account_id) accountIds.add(d.dynamics_account_id)
      }

      // Cuentas presentadas (master Dynamics)
      let cuentas = []
      if (accountIds.size > 0) {
        const { data } = await supabase.from('dynamics_accounts')
          .select('dynamics_id,nombre').in('dynamics_id', [...accountIds])
        cuentas = data || []
      }

      // Mandatos (extraer de la tabla puente)
      const mandatos = (mandActsRes.data || []).map(m => m.mandatos).filter(Boolean)

      // Propuestas (vía mandatos.propuesta_id)
      const propuestaIds = [...new Set(mandatos.map(m => m.propuesta_id).filter(Boolean))]
      let propuestas = []
      if (propuestaIds.length > 0) {
        const { data } = await supabase.from('propuestas')
          .select('id,ref,nombre,tipo,estado,fees,fecha_resolucion').in('id', propuestaIds)
        propuestas = data || []
      }

      if (cancelled) return
      setVista360({
        loading: false, loaded: true,
        ofertas: ofertasRes.data || [],
        cuentas, demandas,
        transacciones: transRes.data || [],
        mandatos,
        propuestas,
      })
    })()
    return () => { cancelled = true }
  }, [activeTab, activo?.id, vista360.loaded])

  // Enriquece una lista de competidores con KPIs reales del activo:
  // n_arrendatarios (rows), n_propietarios (rows), n_ofertas, n_transacciones
  // (12m), n_edificios y plazas (desde stacking_data).
  // Usa allSettled para que un fallo aislado no rompa toda la pestaña.
  const enrichWithKpis = async (rows) => {
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 12)
    const cutoffISO = cutoff.toISOString().slice(0,10)
    return Promise.all((rows || []).map(async r => {
      const a = r.competidor || r
      const cid = a?.id
      const cref = a?.ref
      const stk = Array.isArray(a?.stacking_data) ? a.stacking_data : []
      const nEdif = stk.length || a?.n_edificios || 1
      if (!cid) return { ...r, n_ofertas:0, n_transacciones:0, n_arrendatarios:0, n_propietarios:0, n_edificios:nEdif, plazas:0 }
      const safeCount = async (promise) => {
        try { const res = await promise; return res?.count || 0 } catch { return 0 }
      }
      const safeFoto = async () => {
        try {
          const { data } = await supabase.from('fotos_activo').select('url,tipo,orden').eq('activo_id', cid).order('orden').limit(8)
          const f = (data || []).find(x => x.url && !FOTO_SUB_PLAN.includes(x.tipo))
          return f?.url || null
        } catch { return null }
      }
      const [nOf, nTx, nArr, nProp, foto] = await Promise.all([
        safeCount(supabase.from('ofertas').select('id', { count:'exact', head:true }).eq('activo_id', cid)),
        safeCount(supabase.from('negociaciones').select('id', { count:'exact', head:true })
          .eq('activo_id', cid).in('estado', ['Firmado','Cerrada','Cerrado']).gte('cierre_estimado', cutoffISO)),
        safeCount(supabase.from('arrendatarios').select('id', { count:'exact', head:true }).eq('activo_ref', cref)),
        safeCount(supabase.from('propietarios').select('id', { count:'exact', head:true }).eq('activo_ref', cref)),
        safeFoto(),
      ])
      return {
        ...r,
        n_ofertas: nOf,
        n_transacciones: nTx,
        n_arrendatarios: nArr,
        n_propietarios: nProp,
        n_edificios: nEdif,
        plazas: 0,
        foto,
      }
    }))
  }

  // ── Carga de competidores cuando se abre la pestaña ─────────────────────
  const reloadCompetidores = async () => {
    if (!activo?.id) return
    setCompLoading(true); setCompError(null)
    try {
      const { data: rows = [], error } = await supabase
        .from('activo_competidores')
        .select('id, competidor_id, motivo, motivos, orden, created_at, competidor:activos!competidor_id(id,ref,nombre,zona,subzona,ciudad,uso,sba,occupancy_rate,renta_zona,leed,n_edificios,stacking_data)')
        .eq('activo_id', activo.id)
        .order('orden', { ascending: true })
      if (error) throw error
      const enriched = await enrichWithKpis(rows)
      // Normalizar motivos: BD puede traer null. Usamos array vacío.
      setCompetidores(enriched.map(r => ({ ...r, motivos: Array.isArray(r.motivos) ? r.motivos : (r.motivo ? [r.motivo] : []) })))
    } catch (e) {
      setCompError(e.message || 'No se pudo cargar competidores')
      setCompetidores([])
    } finally {
      setCompLoading(false)
    }
  }

  // ── Sugerencias automáticas por similitud ───────────────────────────────
  // Jerarquía: (1) MISMO Uso principal (obligatorio · nunca otro uso),
  // (2) proximidad de SBA, (3) cercanía de Calidad en la escala propia del uso
  // (en Hotel, además, coincidencia de Tipo de hotel afina el desempate).
  const reloadSugerencias = async () => {
    if (!activo?.id || !activo.uso) { setSugerencias([]); return }
    try {
      const usados = new Set(competidores.map(c => c.competidor_id))
      const usoA = normalizeUso(activo.uso)
      const { data = [] } = await supabase.from('activos')
        .select('id,ref,nombre,zona,subzona,ciudad,uso,calidad,metricas,sba,occupancy_rate,renta_zona,leed,n_edificios,stacking_data')
        .neq('id', activo.id).limit(60)
      // (1) Filtro obligatorio: mismo Uso principal
      const filtradas = (data || []).filter(a => !usados.has(a.id) && normalizeUso(a.uso) === usoA)

      // (3) Cercanía de calidad en la escala del uso (0..1). -1 si no informada.
      const escala = CALIDADES_POR_USO[usoA] || []
      const idxA   = escala.indexOf(activo.calidad)
      const qualCloseness = (a) => {
        const idxO = escala.indexOf(a.calidad)
        if (idxA < 0 || idxO < 0) return -1   // sin calidad → baja prioridad, no excluye
        let q = 1 - Math.abs(idxA - idxO) / Math.max(1, escala.length - 1)
        if (usoA === 'Hotel') {   // afinador por Tipo de hotel
          const tA = activo.metricas?.tipo_hotel, tO = a.metricas?.tipo_hotel
          if (tA && tO && tA === tO) q += 0.25
        }
        return q
      }
      const sbaA = Number(activo.sba) || null
      const sbaDiff = (a) => { const o = Number(a.sba) || null; return (sbaA && o) ? Math.abs(o - sbaA) : Infinity }

      const conScore = filtradas
        .map(a => ({ competidor: a, sbaDiff: sbaDiff(a), qual: qualCloseness(a), ...computeSimilarity(a) }))
        // (2) proximidad de SBA → (3) cercanía de calidad/tipo
        .sort((x,y) => (x.sbaDiff - y.sbaDiff) || (y.qual - x.qual))
        .slice(0, 6)
      const enriched = await enrichWithKpis(conScore)
      setSugerencias(enriched)
    } catch (e) {
      // No bloqueamos la pestaña si falla
      setSugerencias([])
    }
  }

  useEffect(() => {
    if (activeTab !== 'at-comp') return
    if (!activo?.id) return
    reloadCompetidores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activo?.id])

  // Las sugerencias se recargan cuando cambia la lista de manuales (para
  // no proponer un activo ya añadido) o cuando se abre la pestaña.
  useEffect(() => {
    if (activeTab !== 'at-comp') return
    if (!activo?.id) return
    reloadSugerencias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activo?.id, competidores.length])

  // Búsqueda de activos para añadir manualmente (autocomplete)
  useEffect(() => {
    if (activeTab !== 'at-comp') return
    if (!compSearch || compSearch.length < 2) { setCompResults([]); return }
    let cancel = false
    const t = setTimeout(async () => {
      const { data = [] } = await supabase.from('activos')
        .select('id,ref,nombre,zona,ciudad,uso,sba')
        .or(`nombre.ilike.%${compSearch}%,ref.ilike.%${compSearch}%`)
        .neq('id', activo?.id || '')
        .limit(8)
      if (!cancel) {
        const usados = new Set(competidores.map(c => c.competidor_id))
        setCompResults((data || []).filter(a => !usados.has(a.id)))
      }
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [compSearch, activeTab, activo?.id, competidores])

  const addCompetidor = async (competidor, motivos = []) => {
    if (!activo?.id || !competidor?.id) return
    setCompError(null)
    const { error } = await supabase.from('activo_competidores').insert({
      activo_id: activo.id,
      competidor_id: competidor.id,
      motivos: motivos,
      orden: competidores.length,
      created_by: 'Sierra Álvaro',
    })
    if (error) { setCompError(error.message); return }
    setCompSearch(''); setCompResults([])
    reloadCompetidores()
  }
  const removeCompetidor = async (rowId) => {
    setCompError(null)
    const { error } = await supabase.from('activo_competidores').delete().eq('id', rowId)
    if (error) { setCompError(error.message); return }
    reloadCompetidores()
  }
  const updateMotivos = async (rowId, newMotivos) => {
    setCompetidores(prev => prev.map(c => c.id === rowId ? { ...c, motivos: newMotivos } : c))
    const { error } = await supabase.from('activo_competidores').update({ motivos: newMotivos }).eq('id', rowId)
    if (error) setCompError(error.message)
  }
  const toggleMotivo = (rowId, motivo) => {
    const c = competidores.find(x => x.id === rowId)
    if (!c) return
    const has = (c.motivos || []).includes(motivo)
    const newMotivos = has ? c.motivos.filter(m => m !== motivo) : [...(c.motivos || []), motivo]
    updateMotivos(rowId, newMotivos)
  }
  // Export PPT: una slide por competidor con todos los KPIs, motivos y tags.
  const exportCompetidoresPPT = async () => {
    if (!competidores.length) { alert('No hay competidores guardados para exportar.'); return }
    const pptxgen = (await import('pptxgenjs')).default
    const pptx = new pptxgen()
    pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 inches
    const activoNombre = displayNombre ?? activo?.nombre ?? 'Activo'

    // Slide portada
    const cover = pptx.addSlide()
    cover.background = { color: 'F8FAFC' }
    cover.addText('Principales competidores', { x:0.5, y:1.2, w:12, h:0.8, fontSize:32, bold:true, color:'0F172A', fontFace:'Arial' })
    cover.addText(activoNombre, { x:0.5, y:2.0, w:12, h:0.6, fontSize:20, color:'2563EB', fontFace:'Arial' })
    cover.addText(`${competidores.length} competidor${competidores.length===1?'':'es'} · Generado ${new Date().toLocaleDateString('es-ES')}`, { x:0.5, y:2.8, w:12, h:0.4, fontSize:13, color:'64748B', fontFace:'Arial' })
    cover.addText('Análisis comparativo · benchmarking', { x:0.5, y:6.6, w:12, h:0.4, fontSize:11, color:'94A3B8', italic:true, fontFace:'Arial' })

    // Una slide por competidor
    competidores.forEach((c, idx) => {
      const a = c.competidor || {}
      const slide = pptx.addSlide()
      slide.background = { color: 'FFFFFF' }

      // Header con número
      slide.addShape('rect', { x:0, y:0, w:13.33, h:0.7, fill:{color:'2563EB'} })
      slide.addText(`${idx+1} / ${competidores.length}`, { x:0.4, y:0.15, w:1, h:0.4, fontSize:11, bold:true, color:'FFFFFF', fontFace:'Arial' })
      slide.addText(a.nombre || '—', { x:1.4, y:0.1, w:11.5, h:0.5, fontSize:20, bold:true, color:'FFFFFF', fontFace:'Arial' })

      // Subtítulo (zona / ciudad / ref)
      slide.addText(`${[a.zona, a.subzona, a.ciudad].filter(Boolean).join(' · ') || '—'}  ·  Ref: ${a.ref || '—'}`, { x:0.5, y:0.9, w:12.3, h:0.35, fontSize:12, color:'64748B', fontFace:'Arial' })

      // KPIs en 6 cajas (estilo header del activo)
      const kpis = [
        { lbl:'SBA',           val: a.sba ? Number(a.sba).toLocaleString('es-ES') + ' m²' : '—' },
        { lbl:'Edificios',     val: String(c.n_edificios || 1) },
        { lbl:'Ocupación',     val: a.occupancy_rate != null ? `${a.occupancy_rate}%` : '—' },
        { lbl:'Arrendatarios', val: String(c.n_arrendatarios || 0) },
        { lbl:'Propietarios',  val: String(c.n_propietarios || 0) },
        { lbl:'Renta zona',    val: a.renta_zona != null ? `${a.renta_zona} €/m²` : '—' },
      ]
      kpis.forEach((k, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = 0.5 + col * 4.25
        const y = 1.5 + row * 1.0
        slide.addShape('rect', { x, y, w:4.05, h:0.85, fill:{color:'F8FAFC'}, line:{color:'E2E8F0', width:0.5} })
        slide.addText(k.lbl, { x:x+0.15, y:y+0.1, w:3.8, h:0.25, fontSize:9, bold:true, color:'94A3B8', fontFace:'Arial' })
        slide.addText(k.val, { x:x+0.15, y:y+0.35, w:3.8, h:0.45, fontSize:18, bold:true, color:'0F172A', fontFace:'Arial' })
      })

      // Tags de similitud
      const sim = computeSimilarity(a)
      slide.addText('Tags de similitud', { x:0.5, y:3.7, w:12.3, h:0.3, fontSize:11, bold:true, color:'475569', fontFace:'Arial' })
      const tagsText = sim.tags.length ? sim.tags.map(t => `• ${t}`).join('   ') : 'Sin tags automáticos'
      slide.addText(tagsText, { x:0.5, y:4.05, w:12.3, h:0.4, fontSize:11, color:'15803D', fontFace:'Arial' })

      // Motivos seleccionados
      const motivos = c.motivos || []
      slide.addText('Motivos de comparación', { x:0.5, y:4.6, w:12.3, h:0.3, fontSize:11, bold:true, color:'475569', fontFace:'Arial' })
      const motivosText = motivos.length ? motivos.map(m => `• ${m}`).join('   ') : 'Sin motivos asignados'
      slide.addText(motivosText, { x:0.5, y:4.95, w:12.3, h:0.5, fontSize:11, color:'2563EB', fontFace:'Arial' })

      // Métricas comerciales
      slide.addText('Actividad comercial', { x:0.5, y:5.6, w:12.3, h:0.3, fontSize:11, bold:true, color:'475569', fontFace:'Arial' })
      slide.addText(`Ofertas vinculadas: ${c.n_ofertas || 0}  ·  Transacciones (últimos 12m): ${c.n_transacciones || 0}`, { x:0.5, y:5.95, w:12.3, h:0.4, fontSize:11, color:'0F172A', fontFace:'Arial' })

      // Footer
      slide.addText(`Comparativa generada desde ${activoNombre}`, { x:0.5, y:7.0, w:12.3, h:0.3, fontSize:9, color:'94A3B8', italic:true, fontFace:'Arial' })
    })

    const filename = `Competidores_${activoNombre.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pptx`
    await pptx.writeFile({ fileName: filename })
  }

  const reorderCompetidor = async (rowId, dir) => {
    const idx = competidores.findIndex(c => c.id === rowId)
    if (idx < 0) return
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= competidores.length) return
    const reordered = [...competidores]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    setCompetidores(reordered)
    // Persistir orden en BD
    await Promise.all(reordered.map((c,i) =>
      supabase.from('activo_competidores').update({ orden: i }).eq('id', c.id)
    ))
  }

  // Load propietariosReg and arrendatariosReg from Supabase for existing activos
  useEffect(() => {
    const ref = params?.ref
    if (!ref || params?.new) return
    supabase.from('propietarios').select('*').eq('activo_ref', ref).is('motivo_salida', null).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) {
          const mapped = data.map(p => ({
            id: p.id, propietario: p.propietario, activo: p.activo,
            activo_ref: p.activo_ref, zona: p.zona, uso: p.uso,
            sba: p.superficie, tipologia: p.tipologia,
            anyo_compra: p.anyo_compra, trimestre: p.trimestre,
            precio_compra: p.precio_compra, regimen: p.regimen,
            perfil: p.perfil, cap_rate: p.cap_rate, yield_pct: p.yield_pct,
            estrategia: p.estrategia, estado: p.estado,
          }))
          // Merge: DB rows take precedence; preserve any in-memory rows not yet in DB
          setPropietariosReg(prev => {
            const dbIds = new Set(mapped.map(p => p.id))
            const extras = prev.filter(p => !dbIds.has(p.id))
            return [...mapped, ...extras]
          })
        } else if (activo?.propietario) {
          // No hay fila en propietarios pero el activo tiene propietario legacy
          // (campo de la tabla activos). Solo lo sembramos como chip si REALMENTE
          // sigue presente en algún tramo del stacking — si ya se vendió/sustituyó
          // no debe aparecer en las etiquetas del panel (sí queda en el histórico).
          const enStacking = (activo?.stacking_data || []).some(b =>
            (b.prop || []).some(r => (r.units || []).some(u => u.n === activo.propietario)))
          if (!enStacking) return
          setPropietariosReg(prev => {
            if (prev.some(p => p.propietario === activo.propietario)) return prev
            return [...prev, {
              id: `LEGACY-${activo.ref}`,
              propietario: activo.propietario,
              activo_ref: activo.ref,
              sba: activo.sba,
              zona: activo.zona,
              uso: activo.uso,
              _legacy: true,
            }]
          })
        }
      })
    // Set de refs de arrendatarios que SÍ están asignados a alguna planta del
    // stacking. Evita el caso 'zombie': fila en BD pero ningún drag-drop hecho
    // → 5 chips inútiles en el sidebar sin presencia en plantas.
    const stackingArrSet = new Set(
      (activo?.stacking_data || [])
        .flatMap(b => b.arr || [])
        .flatMap(r => r.units || [])
        .filter(u => u.type === 'ten' && u.arr_ref)
        .map(u => u.arr_ref)
    )
    supabase.from('arrendatarios').select('*').eq('activo_ref', ref).is('motivo_salida', null).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) {
          // Solo incluimos arrendatarios que tienen una unit en el stacking
          // O fueron creados muy recientemente (últimos 10 min, pendientes
          // de drag-drop). Filtra los zombies del prototipo.
          const recentCutoff = Date.now() - 10 * 60 * 1000
          const mapped = data
            .filter(a => {
              const inStacking = stackingArrSet.has(a.ref)
              const recent = a.created_at && new Date(a.created_at).getTime() > recentCutoff
              return inStacking || recent
            })
            .map(a => ({
              id: a.id, ref: a.ref, tenant: a.tenant || a.nombre,
              activo: a.edificio || a.activo_ref,
              activo_ref: a.activo_ref,
              uso: a.uso || a.sector,
              sup: a.superficie,
              closing_rent: a.closing_rent,
              break_option: a.break_option,
              fecha_fin: a.vencimiento,
              anyo_firma: a.anyo_firma,
              trimestre: a.trimestre,
            }))
          setArrendatariosReg(prev => {
            const dbIds = new Set(mapped.map(a => a.id).filter(Boolean))
            const extras = prev.filter(a => !dbIds.has(a.id))
            return [...mapped, ...extras]
          })
        }
      })
    // Depende también de activo?.propietario para que la siembra legacy
    // se ejecute después de que el activo se cargue desde Supabase.
  }, [params?.ref, activo?.propietario, activo?.ref])

  // Load ofertas from Supabase for this activo.
  // Filtra por activo_id cuando el activo ya está cargado (autoritativo) y
  // se queda con activo_ref como fallback mientras se resuelve el activo.
  // Esto soluciona el caso en el que el sidebar del stacking no veía ofertas
  // vinculadas a Castellana 43: las ofertas más nuevas guardan activo_id pero
  // pueden no tener activo_ref poblado, y el query antiguo (activo_ref) las
  // descartaba aunque sí aparecieran en vista 360.
  useEffect(() => {
    const ref = params?.ref
    if (!ref || params?.new) return
    setLoadingOfertas(true)
    const q = activo?.id
      ? supabase.from('ofertas').select('*').or(`activo_id.eq.${activo.id},activo_ref.eq.${ref}`)
      : supabase.from('ofertas').select('*').eq('activo_ref', ref)
    q.then(({ data }) => {
      // Dedup por id (puede entrar dos veces si activo_id y activo_ref coinciden)
      const seen = new Set()
      const uniq = (data || []).filter(o => {
        if (seen.has(o.id)) return false
        seen.add(o.id); return true
      })
      setOfertas(uniq)
      setLoadingOfertas(false)
    })
  }, [params?.ref, activo?.id])

  const handleCreateActivo = async () => {
    setSubmitted(true)
    const missing = []
    if (!newForm.direccion) missing.push('Dirección')
    if (!newForm.tipo_activo) missing.push('Tipo de activo')
    if (!newForm.uso) missing.push('Uso principal')
    if (!newForm.estado_construccion) missing.push('Estado de construcción')
    if (missing.length) { setSaveErr(`Campos obligatorios: ${missing.join(', ')}`); return }
    const nombre = newForm.nombre || newForm.direccion.split(',')[0].trim()
    setSaving(true); setSaveErr('')
    // Generar ref garantizando unicidad (genRefFA usa Math.random — posible colisión)
    let ref = genRefFA(newForm.ciudad, newForm.uso)
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase.from('activos').select('ref').eq('ref', ref).maybeSingle()
      if (!existing) break
      ref = genRefFA(newForm.ciudad, newForm.uso)
    }
    // Only insert columns guaranteed to exist in migration 001 schema
    const payload = {
      ref, nombre,
      ciudad:            newForm.ciudad       || null,
      pais:              newForm.pais         || null,
      zona:              newForm.zona         || null,
      subzona:           newForm.subzona      || null,
      area:              newForm.area         || null,
      uso:               newForm.uso          || null,
      calidad:           newForm.calidad      || null,
      sba:               newForm.sba ? parseFloat(newForm.sba) : null,
      anno_construccion: newForm.anno_construccion   ? parseInt(newForm.anno_construccion)  : null,
      anno_rehabilitacion: newForm.anno_rehabilitacion ? parseInt(newForm.anno_rehabilitacion) : null,
      ref_catastral:     newForm.ref_catastral || null,
      estado:            'Activo',
      dias_comercializacion: 0,
    }
    // Add extra columns if migration 002 has been run (fail silently if not)
    let insertOk = false
    try {
      const { error } = await supabase.from('activos').insert({
        ...payload,
        propietario:         newForm.propietario       || null,
        direccion:           newForm.direccion         || null,
        tipo_activo:         newForm.tipo_activo       || null,
        estado_construccion: newForm.estado_construccion || null,
        uso_secundario:      newForm.uso_secundario    || null,
        asset_manager:       newForm.asset_manager     || null,
        clasificacion_urb:   newForm.clasificacion_urb || null,
        uso_pgou:            newForm.uso_pgou          || null,
        calificacion_urb:    newForm.calificacion_urb  || null,
        edificabilidad:      newForm.edificabilidad    || null,
        sup_parcela:         newForm.sup_parcela ? parseFloat(newForm.sup_parcela) : null,
        sup_planta_tipo:     newForm.sup_planta_tipo ? parseFloat(newForm.sup_planta_tipo) : null,
        ratio_perdida:       newForm.ratio_perdida ? parseFloat(newForm.ratio_perdida) : null,
        cp:                  newForm.cp                || null,
      })
      if (error) {
        // If extra columns don't exist yet, retry with base payload
        if (error.message?.includes('column') || error.code === '42703') {
          const { error: e2 } = await supabase.from('activos').insert(payload)
          if (e2) { setSaving(false); setSaveErr(`No se pudo crear el activo: ${e2.message}`); return }
          insertOk = true
        } else {
          setSaving(false); setSaveErr(`No se pudo crear el activo: ${error.message}${error.details ? ` · ${error.details}` : ''}${error.hint ? ` · ${error.hint}` : ''}`); return
        }
      } else {
        insertOk = true
      }
    } catch(e) {
      setSaving(false)
      // eslint-disable-next-line no-console
      console.error('Crear activo · excepción:', e)
      setSaveErr(`Error al crear el activo: ${e?.message || e}`); return
    }
    if (!insertOk) { setSaving(false); return }
    // Migración 040 — ubicación granular + métricas por uso (update tolerante:
    // si las columnas aún no existen, no rompe la creación ya hecha)
    try {
      const metricas = buildMetricas(newForm)
      if (normalizeUso(newForm.uso) === 'Hotel' && newForm.tipo_hotel) metricas.tipo_hotel = newForm.tipo_hotel
      await supabase.from('activos').update({
        provincia: newForm.provincia || null,
        municipio: newForm.municipio || newForm.ciudad || null,
        metricas,
      }).eq('ref', ref)
    } catch { /* columnas 040 no aplicadas todavía */ }
    // Save stacking plan if the user created buildings while on the new activo form
    const stackBlds = liveStackingRef.current
    if (stackBlds && stackBlds.length > 0) {
      await supabase.from('activos').update({ stacking_data: stackBlds }).eq('ref', ref)
    }
    setSaving(false)
    setSaveOk(true)
    // Pequeña espera para que el usuario vea "Activo guardado" antes de navegar
    setTimeout(() => navigate('ficha-activo', { ref }), 600)
  }

  const saveStackingData = async () => {
    const blds = liveStackingRef.current
    if (!blds) { console.warn('saveStackingData: no buildings data'); return }
    if (!activo?.ref) { console.warn('saveStackingData: no activo ref'); return }

    // 1. Save visual stacking to activo
    const { error: stackErr } = await supabase.from('activos').update({ stacking_data: blds }).eq('ref', activo.ref)
    if (stackErr) { alert('Error guardando stacking: ' + stackErr.message); return }

    // 2. If we came from a specific offer, sync asignaciones_stacking
    const ofertaId = params?.ofertaId
    if (ofertaId && activo?.id) {
      await supabase.from('asignaciones_stacking').delete().eq('oferta_id', ofertaId)
      const assignments = blds.flatMap(b =>
        (b.arr || []).flatMap(row =>
          row.units
            .filter(u => u.type === 'vac' && u.oferta)
            .map(u => ({
              activo_id:  activo.id,
              oferta_id:  ofertaId,
              edificio_id: b.id,
              planta_id:  row.p,
              sup:        u.sup,
              renta:      u.renta || null,
            }))
        )
      )
      if (assignments.length > 0) {
        await supabase.from('asignaciones_stacking').insert(assignments)
      }
    }
  }

  const addPlaza = () => {
    const c = parseInt(newPlaza.cantidad)||1
    if(c<=0) return
    const maxId = plazas.reduce((m,p)=>Math.max(m,p.id),0)
    setPlazas(prev=>[...prev,{...newPlaza,cantidad:c,id:maxId+1}])
    setNewPlaza({ubicacion:'Interior',tipo:'Simple',vehiculo:'Coches',cantidad:1})
    setShowAddPlaza(false)
  }
  const removePlaza = (id) => setPlazas(prev=>prev.filter(p=>p.id!==id))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>

      {/* Action bar */}
      <div className="action-bar">
        {isNew ? (
          <>
            <button className="ab-btn save" onClick={handleCreateActivo} disabled={saving}>{saving ? 'Guardando...' : '💾 Crear activo'}</button>
            <button className="ab-btn" onClick={() => navigate('activos')}>Cancelar</button>
            {saveOk  && <span style={{fontSize:11,color:'var(--green)',marginLeft:8,fontWeight:600}}>✓ Activo creado · redirigiendo…</span>}
            {saveErr && <span style={{fontSize:11,color:'var(--red)',marginLeft:8,fontWeight:600}}>{saveErr}</span>}
          </>
        ) : (
          <>
            <button className="ab-btn save" onClick={async () => { try { await infoSaveRef.current?.() } catch(e) {} await saveStackingData() }}>💾 Guardar</button>
            <button className="ab-btn" onClick={async () => { try { await infoSaveRef.current?.() } catch(e) {} await saveStackingData(); navigate('activos', { highlightRef: activo?.ref ?? params?.ref }) }}>Guardar y cerrar</button>
            <div className="ab-sep"/>
            <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
          </>
        )}
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* ── HEADER ── */}
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><UsoIco uso={isNew ? newForm.uso : 'Oficinas'} size={20} /></div>
              <div style={{flex:1}}>
                {isNew ? (
                  /* ── NUEVO ACTIVO: cabecera ── */
                  <div>
                    <div className="ah-ref" style={{marginBottom:6}}>
                      <span className="ref-badge-activo">NUEVO ACTIVO</span>
                      <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text4)'}}>Ref. auto-generada al guardar</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:4}}>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>Nombre del activo</div>
                        <input className="of-inp" placeholder="P.E Avalon, Torre Sevilla..." value={newForm.nombre} onChange={e=>setNF('nombre',e.target.value)} style={{width:'100%',boxSizing:'border-box'}}/>
                      </div>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>Propietario · <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>desde Cuentas</span></div>
                        <input className="of-inp" list="fa-cuentas-list" placeholder="Buscar cuenta..." value={newForm.propietario} onChange={e=>setNF('propietario',e.target.value)} style={{width:'100%',boxSizing:'border-box'}}/>
                        <datalist id="fa-cuentas-list">{CUENTAS_FA.map(c=><option key={c} value={c}/>)}</datalist>
                      </div>
                    </div>
                  </div>
                ) : loadingActivo ? (
                  <div style={{padding:'8px 0',color:'var(--text4)',fontSize:13}}>Cargando...</div>
                ) : (
                  /* ── ACTIVO EXISTENTE ── */
                  <>
                    <div className="ah-ref">
                      <span className="ref-badge-activo">ACTIVO</span>
                      <span className="asset-link" style={{fontFamily:'var(--mono)'}}>{activo?.ref || params?.ref}</span>
                    </div>
                    {editingNombre ? (
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                        <input
                          autoFocus
                          className="of-inp"
                          value={editNombreVal}
                          onChange={e => setEditNombreVal(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              const n = editNombreVal.trim()
                              if (n && n !== (displayNombre ?? activo?.nombre)) {
                                await supabase.from('activos').update({ nombre: n }).eq('ref', activo.ref)
                                setDisplayNombre(n)
                              }
                              setEditingNombre(false)
                            } else if (e.key === 'Escape') {
                              setEditingNombre(false)
                            }
                          }}
                          style={{fontSize:18,fontWeight:700,padding:'3px 8px',minWidth:280}}
                        />
                        <button onClick={async () => {
                          const n = editNombreVal.trim()
                          if (n && n !== (displayNombre ?? activo?.nombre)) {
                            await supabase.from('activos').update({ nombre: n }).eq('ref', activo.ref)
                            setDisplayNombre(n)
                          }
                          setEditingNombre(false)
                        }} style={{padding:'3px 10px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>✓</button>
                        <button onClick={() => setEditingNombre(false)} style={{padding:'3px 8px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)'}}>✕</button>
                      </div>
                    ) : (
                      <div className="ah-name" style={{cursor:'text',display:'flex',alignItems:'center',gap:6}} onClick={() => { setEditNombreVal(displayNombre ?? activo?.nombre ?? ''); setEditingNombre(true) }}>
                        {displayDireccion ?? activo?.direccion ?? '—'}
                      </div>
                    )}
                    <div className="ah-addr">
                      <span style={{fontWeight:600,color:'var(--text2)'}}>{displayNombre ?? activo?.nombre ?? '—'}</span>
                      {[activo?.zona, activo?.subzona, activo?.ciudad].filter(Boolean).length > 0 && <> · {[activo?.zona, activo?.subzona, activo?.ciudad].filter(Boolean).join(' · ')}</>}
                    </div>
                    <div className="ah-tags">
                      {activo?.uso && <span className={`tag ${usoTag(activo.uso)}`}>{activo.uso}</span>}
                      {activo?.leed && <span className="tag tag-leed">LEED {activo.leed}</span>}
                      {activo?.esg_rating && <span className="tag tag-esg">ESG {activo.esg_rating}</span>}
                      {(liveEdifCount ?? activo?.n_edificios) > 1 && <span className="tag tag-gray">{liveEdifCount ?? activo.n_edificios} edificios</span>}
                      {activo?.dias_comercializacion > 0 && <span className="dias-pill">📅 {activo.dias_comercializacion} días en comercialización</span>}
                    </div>
                  </>
                )}
              </div>

              {/* KPIs destacados a la derecha del título */}
              {!isNew && !loadingActivo && (
                <div style={{ display:'flex', alignItems:'stretch', gap:0, flexShrink:0, border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', background:'var(--surface)' }}>
                  {(() => {
                    const sba          = activo?.sba ?? 0
                    const occ          = activo?.occupancy_rate
                    const totalPlazas  = (plazas || []).reduce((s, p) => s + (p.cantidad || 0), 0)
                    const nEdif        = liveEdifCount ?? activo?.n_edificios ?? 1
                    const nArr         = arrendatariosReg.length
                    const nProp        = propietariosReg.length
                    const items = [
                      { lbl:'SBA',           val: sba > 0 ? sba.toLocaleString('es-ES') : '—',          sub:'m²',          color:'var(--text1)' },
                      { lbl:'Edificios',     val: nEdif > 0 ? String(nEdif) : '—',                      sub:'edif.',       color:'var(--text1)' },
                      { lbl:'Plazas',        val: totalPlazas > 0 ? totalPlazas.toLocaleString('es-ES') : '—', sub:'aparcamiento', color:'var(--text1)' },
                      { lbl:'Arrendatarios', val: String(nArr),                                          sub:'tenants',      color: nArr > 0 ? 'var(--accent)' : 'var(--text4)' },
                      { lbl:'Propietarios',  val: String(nProp),                                         sub:'titulares',    color: nProp > 0 ? 'var(--accent)' : 'var(--text4)' },
                      { lbl:'Ocupación',     val: occ != null ? `${occ}%` : '—',                        sub:'derivado',    color: occ >= 90 ? 'var(--green)' : occ >= 75 ? 'var(--amber)' : 'var(--red)' },
                    ]
                    return items.map((k, i) => (
                      <div key={k.lbl} style={{ padding:'10px 16px', textAlign:'center', minWidth:88, borderLeft: i === 0 ? 'none' : '1px solid var(--border)' }}>
                        <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{k.lbl}</div>
                        <div style={{ fontSize:22, fontWeight:800, fontFamily:'var(--mono)', color:k.color, lineHeight:1 }}>{k.val}</div>
                        <div style={{ fontSize:9, color:'var(--text4)', marginTop:3 }}>{k.sub}</div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>

            {/* Audit + export — bajo los KPIs, ancho completo. Solo en activos existentes. */}
            {!isNew && !loadingActivo && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text3)' }}>
                  <Clock size={12} strokeWidth={1.75} />
                  <span>Última modificación · {activo?.updated_by || 'Álvaro Sierra'} · {activo?.updated_at ? new Date(activo.updated_at).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES')}</span>
                </div>
                <div className="at-head-actions" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {pitchesActivo.length > 0 ? (
                    <button
                      className="tbtn"
                      style={{ background:'#2563EB', color:'#fff', borderColor:'#2563EB' }}
                      onClick={() => window.open(pitchesActivo[0].url, '_blank', 'noopener')}
                      title={`${pitchesActivo.length} pitch${pitchesActivo.length>1?'es':''} sincronizado${pitchesActivo.length>1?'s':''}`}
                    >
                      <FileText size={15} strokeWidth={1.75}/> Pitch comercial{pitchesActivo.length > 1 ? ` (${pitchesActivo.length})` : ''} ↗
                    </button>
                  ) : (
                    <button
                      className="tbtn"
                      onClick={() => window.open(`https://pitch-taupe-sigma.vercel.app/?activoRef=${encodeURIComponent(activo?.ref || '')}`, '_blank', 'noopener')}
                      title="Crear nuevo pitch para este activo"
                    >
                      <FileText size={15} strokeWidth={1.75}/> Crear pitch ↗
                    </button>
                  )}
                  <button className="tbtn" onClick={() => exportRentRoll(displayNombre ?? activo?.nombre ?? 'Activo')}><FileSpreadsheet size={15} strokeWidth={1.75} /> Rent-roll XLSX</button>
                  <button className="tbtn" onClick={() => exportFichaActivo(navigate)}><FileText size={15} strokeWidth={1.75} /> Ficha PDF</button>
                  <button className="tbtn" onClick={() => setShowNotasModal(true)}><StickyNote size={15} strokeWidth={1.75} /> Notas</button>
                  <button className="tbtn" onClick={() => setShowIneModal(true)}><BarChart3 size={15} strokeWidth={1.75} /> Datos INE</button>
                  <button className="tbtn" onClick={() => { const url = `https://savills.es/m/${activo?.ref || 'demo'}`; navigator.clipboard?.writeText(url); alert(`Link copiado:\n${url}`) }}><Link2 size={15} strokeWidth={1.75} /> Link microsite</button>
                </div>
              </div>
            )}
          </div>

          {/* ── TABS ── */}
          <div className="tabs">
            {TABS.map((t,i)=>(
              <div key={t} className={`tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>{TAB_LABELS[i]}</div>
            ))}
          </div>

          {/* ── TAB: Información general ── */}
          {isNew && activeTab==='at-info' && <NewActivoInfoTab newForm={newForm} setNF={setNF} submitted={submitted}/>}
          {!isNew && (
            <TabInfo navigate={navigate} plazas={plazas} activo={activo}
              nEdificios={liveEdifCount ?? activo?.n_edificios ?? 1}
              saveRef={infoSaveRef}
              syncRef={infoSyncRef}
              hidden={activeTab !== 'at-info'}
              vincMaestra={vincMaestra}
              propietariosReg={propietariosReg}
              arrendatariosCount={arrendatariosReg.length}
              goToTab={setActiveTab}
              liveBuildings={liveBuildings}
              activoRef={activo?.ref || params?.ref}
              activoNombre={displayNombre ?? activo?.nombre ?? ''}
              onInfoSaved={async ({nombre,direccion})=>{
                if(nombre!==undefined) setDisplayNombre(nombre||null)
                if(direccion!==undefined) setDisplayDireccion(direccion||null)
                // Reload activo so Información adicional reflects the latest saved data (ref_catastral, etc.)
                const { data } = await supabase.from('activos').select('*').eq('ref', params.ref).single()
                if (data) setActivo(data)
              }}/>
          )}

          {/* ── TAB: Stacking Plan — always mounted to preserve state ── */}
          <div className="tab-content active" style={{background:'#fff', ...(activeTab !== 'at-stacking' ? {display:'none'} : {})}}>
            <div className="info-pad" style={{paddingTop:24}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
                <div>
                  <div style={{fontSize:17,fontWeight:700,color:'var(--text)',letterSpacing:'-.005em'}}>Stacking Plan</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>Distribución de usos, propietarios y arrendatarios por planta y edificio</div>
                </div>
                {params?.ofertaId && (
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:10,color:'var(--accent)',fontWeight:600,background:'var(--accent-lt)',padding:'3px 8px',borderRadius:10,border:'1px solid var(--accent-bd)'}}>Asignando oferta</span>
                    <button className="ab-btn save" style={{fontSize:11}} onClick={async () => { await saveStackingData(); navigate('ofertas') }}>
                      💾 Guardar asignación y volver
                    </button>
                  </div>
                )}
              </div>
              <StackingPlan
                key={isNew ? 'new-activo' : (activo?.ref || params?.ref || 'stacking')}
                initBuildings={isNew ? [] : (activo?.stacking_data?.length > 0 ? activo.stacking_data : [])}
                defaultSupPlantaTipo={isNew ? (newForm.sup_planta_tipo ? parseFloat(newForm.sup_planta_tipo) : undefined) : (activo?.sup_planta_tipo || undefined)}
                defaultLabel={isNew ? (newForm.nombre || newForm.direccion || '') : (activo?.nombre || activo?.direccion || '')}
                onCountChange={setLiveEdifCount}
                onOwnersChange={setLiveOwnerCount}
                onBuildingsChange={(blds) => {
                  liveStackingRef.current = blds
                  // Estado React para que las tablas de Propietarios y Arrendatarios
                  // se re-rendericen con la superficie real asignada en el stacking.
                  setLiveBuildings(blds)
                  // Auto-save stacking to Supabase (debounced 1.5 s)
                  const ref = activoRef.current?.ref
                  if (!ref) return
                  // NO autosaves "eco" del montaje/recarga: si el stacking es idéntico
                  // al de la BD, no programamos escritura. Si no, el autosave de montaje
                  // (con el estado recién cargado) podía pisar cambios hechos en otra
                  // ficha (p. ej. asignar el comprador de un «Propietario desconocido»).
                  const current = activoRef.current?.stacking_data
                  if (current && JSON.stringify(current) === JSON.stringify(blds)) return
                  clearTimeout(autoSaveTimer.current)
                  autoSaveTimer.current = setTimeout(async () => {
                    const { error } = await supabase.from('activos').update({ stacking_data: blds }).eq('ref', ref)
                    if (error) { console.error('Stacking autosave:', error.message); return }
                    // Sincroniza la copia en memoria para que un re-render no
                    // revierta lo guardado (causa de "no se queda guardado").
                    setActivo(prev => prev ? { ...prev, stacking_data: blds } : prev)
                    // Propaga superficie/renta a las filas de arrendatarios/propietarios.
                    syncStackingToRecords(blds)
                  }, 1500)
                }}
                activoPropietario={activo?.propietario || ''}
                activoRef={activo?.ref || params?.ref || ''}
                activoNombre={displayNombre ?? activo?.nombre ?? ''}
                extraOwners={propietariosReg.map(p=>({ id: p.id, name: p.propietario }))}
                extraTenants={arrendatariosReg.map(a=>({ ref: a.ref, name: a.tenant, renta: a.closing_rent ?? a.renta_m2 }))}
                onAddOwner={handleAddOwner}
                onAddTenant={handleAddTenant}
                onRemoveTenant={({ unit, doRemove }) => {
                  // Si el unit está persistido (arr_ref) y no es legacy/desconocido,
                  // abrimos el modal v2 (Baja / Fin de contrato → Traslado).
                  // Si no hay ref, caemos al modal legacy (BajaArrendatarioModal)
                  // que sabe manejar units sin DB row.
                  if (unit?.arr_ref) {
                    setSalidaArr({ unit, doRemove })
                  } else {
                    setBajaArr({ unit, doRemove })
                  }
                }}
                onRemoveOwner={({ unit, floorId, edifId, footprintCount, ownerSupTotal, tramoSup, doSubstitute }) => {
                  setSalidaProp({ unit, floorId, edifId, footprintCount, ownerSupTotal, tramoSup, doSubstitute })
                }}
                onRemoveOferta={({ unit, floorId, doRemove }) => {
                  setSalidaOfr({ unit, floorId, doRemove })
                }}
                extraOfertas={(() => {
                  // Fuente persistente: ofertas en DB ligadas a este activo.
                  // Cualquier oferta creada y vinculada permanece en el panel
                  // izquierdo aunque ya esté asignada a una planta.
                  const fromDB = (ofertas || [])
                    .filter(o => o.estado !== 'Cerrada' && o.estado !== 'Desactivada' && o.activa !== false)
                    .map(o => ({
                      id: o.id,
                      ref: o.ref,
                      nombre: o.nombre || o.ref,
                      tipoOperacion: o.tipo_operacion || 'Alquiler',
                    }))
                  // Mezcla con ofertas pasadas vía navegación (cuando se vuelve
                  // recién creadas) deduplicando por ref/nombre.
                  const extras = (params?.ofertasFromOferta || []).filter(p =>
                    !fromDB.some(d => (p.ref && d.ref === p.ref) || d.nombre === p.nombre)
                  )
                  // Sidebar = SOLO ofertas reales en BD. Si una vac unit del
                  // stacking no tiene fila en ofertas, es data corrupta y se
                  // limpia en otro lado (no se inventan cards fantasma).
                  return [...fromDB, ...extras]
                })()}
                initView={params?.newOwnerData ? 'prop' : params?.newTenantData ? 'arr' : (params?.stackingView || 'principal')}
              />

              {/* ── PROPIETARIOS Y ARRENDATARIOS (absorbidos del antiguo tab at-prop) ── */}
              {(()=>{
                const blds = liveBuildings || activo?.stacking_data || []
                const getOwnerSup = (p) => blds
                  .flatMap(b => b.prop || [])
                  .flatMap(r => r.units || [])
                  .reduce((s, u) => {
                    const match = p.id ? u.prop_id === p.id : (!u.prop_id && u.n === p.propietario)
                    return s + (match ? (Number(u.sup) || 0) : 0)
                  }, 0)
                const goToOwner = (p) => navigate('ficha-propietario', {
                  id: p.id,
                  ownerData: { ...p, superficie: getOwnerSup(p) },
                  ownerSuperficie: getOwnerSup(p),
                  fromActivoRef: activo?.ref || params?.ref,
                  fromActivoNombre: activo?.nombre || displayNombre,
                  fromActivoTab: 'at-stacking',
                })
                const getTenantSup = (a) => blds
                  .flatMap(b => b.arr || [])
                  .flatMap(r => (r.units || []).filter(u => u.type !== 'ofr' && u.type !== 'ofr_split'))
                  .reduce((s, u) => {
                    const match = a.ref ? u.arr_ref === a.ref : (!u.arr_ref && u.n === a.tenant)
                    return s + (match ? (Number(u.sup) || 0) : 0)
                  }, 0)
                const goToArr = (a) => {
                  const supReal = getTenantSup(a)
                  navigate('ficha-arrendatario', {
                    ...(a.ref ? { arrRef: a.ref } : { tenantName: a.tenant }),
                    tenantSuperficie: supReal,
                    fromActivoRef: activo?.ref || params?.ref,
                    fromActivoNombre: activo?.nombre || displayNombre,
                    fromActivoTab: 'at-stacking',
                  })
                }
                return (
                  <div style={{marginTop:28, display:'flex', flexDirection:'column', gap:14}}>

                    {/* Propietarios (plegable, abierto por defecto) */}
                    <details open style={{border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)'}}>
                      <summary style={{cursor:'pointer', padding:'12px 16px', listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
                        <span style={{fontSize:15, fontWeight:700, color:'var(--text)'}}>Propietarios <span style={{color:'var(--text4)', fontWeight:500, marginLeft:6, fontSize:13}}>({propietariosReg.length})</span></span>
                        <button className="ab-btn blue" onClick={(e)=>{e.preventDefault(); handleAddOwner()}}>+ Nuevo propietario</button>
                      </summary>
                      <div style={{padding:'0 16px 14px'}}>
                        <table className="pat-table">
                          <thead><tr><th>Perfil</th><th>Propietario</th><th>SBA asignada</th><th>Yield</th><th>Precio compra</th><th>Año compra</th><th>Trim.</th><th></th></tr></thead>
                          <tbody>
                            {propietariosReg.map(p=>{
                              const supReal = getOwnerSup(p)
                              return (
                              <tr key={p.id} style={{cursor:'pointer'}} onClick={()=>goToOwner(p)}>
                                <td>{p.perfil||'—'}</td>
                                <td><span className="pat-link">{p.propietario}</span></td>
                                <td style={{fontFamily:'var(--mono)', fontVariantNumeric:'tabular-nums'}}>{supReal > 0 ? Number(supReal).toLocaleString('es-ES') : <span style={{color:'var(--text4)',fontStyle:'italic'}}>Pendiente · arrastra al stacking</span>}</td>
                                <td>{p.yield_pct ? p.yield_pct+'%' : '—'}</td>
                                <td>{p.precio_compra||'—'}</td>
                                <td>{p.anyo_compra||'—'}</td>
                                <td>{p.trimestre && <span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'#f5efe5',color:'#5a4828',fontWeight:600}}>{p.trimestre}</span>}</td>
                                <td><button className="ra" onClick={e=>{e.stopPropagation();goToOwner(p)}}>↗ Ver</button></td>
                              </tr>
                            )})}
                            {propietariosReg.length===0 && <tr><td colSpan={8} style={{textAlign:'center',color:'var(--text4)',fontSize:12,padding:16}}>Sin propietarios — añade uno con el botón</td></tr>}
                          </tbody>
                        </table>
                        {propietariosHist.length > 0 && (
                          <div style={{marginTop:14}}>
                            <div style={{fontSize:11,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Histórico</div>
                            <table className="pat-table">
                              <thead><tr><th>Propietario</th><th>Fecha salida</th><th>Estado</th></tr></thead>
                              <tbody>
                                {propietariosHist.map(h=>(
                                  <tr key={h.id} style={{opacity:.7}}>
                                    <td>{h.propietario}</td>
                                    <td style={{fontFamily:'var(--mono)', fontVariantNumeric:'tabular-nums', fontSize:11}}>{h.fecha_salida||'—'}</td>
                                    <td><span style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#fee2e2',color:'#dc2626',border:'1px solid #fca5a5',fontWeight:600}}>Anterior</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </details>

                    {/* Arrendatarios (plegable, abierto por defecto) */}
                    <details open style={{border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)'}}>
                      <summary style={{cursor:'pointer', padding:'12px 16px', listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
                        <span style={{fontSize:15, fontWeight:700, color:'var(--text)'}}>Arrendatarios <span style={{color:'var(--text4)', fontWeight:500, marginLeft:6, fontSize:13}}>({arrendatariosReg.length})</span></span>
                        <button className="ab-btn blue" onClick={(e)=>{e.preventDefault(); handleAddTenant()}}>+ Nuevo arrendatario</button>
                      </summary>
                      <div style={{padding:'0 16px 14px'}}>
                        <table className="pat-table">
                          <thead><tr><th>Arrendatario</th><th>Uso</th><th>Sup. asignada</th><th>Renta</th><th>Break option</th><th>Vencimiento</th><th>Año alquiler</th><th>Trim.</th><th></th></tr></thead>
                          <tbody>
                            {arrendatariosReg.map(a=>{
                              const supReal = getTenantSup(a)
                              return (
                              <tr key={a.id} style={{cursor:'pointer'}} onClick={()=>goToArr(a)}>
                                <td><span className="pat-link">{a.tenant}</span></td>
                                <td>{a.uso||'—'}</td>
                                <td style={{fontFamily:'var(--mono)', fontVariantNumeric:'tabular-nums'}}>{supReal > 0 ? Number(supReal).toLocaleString('es-ES') : <span style={{color:'var(--text4)',fontStyle:'italic'}}>Pendiente · arrastra al stacking</span>}</td>
                                <td>{a.closing_rent||'—'}</td>
                                <td style={{color:'var(--amber)',fontWeight:600}}>{a.break_option||'—'}</td>
                                <td style={{color:'var(--green)',fontWeight:600}}>{a.fecha_fin||'—'}</td>
                                <td>{a.anyo_firma||'—'}</td>
                                <td>{a.trimestre && <span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'#f5efe5',color:'#5a4828',fontWeight:600}}>{a.trimestre}</span>}</td>
                                <td><button className="ra" onClick={e=>{e.stopPropagation();goToArr(a)}}>↗ Ver</button></td>
                              </tr>
                            )})}
                            {arrendatariosReg.length===0 && <tr><td colSpan={9} style={{textAlign:'center',color:'var(--text4)',fontSize:12,padding:16}}>Sin arrendatarios — añade uno con el botón</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </details>

                    <div style={{padding:'10px 14px',background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',fontSize:11,color:'var(--text4)'}}>
                      Las <strong>ofertas activas</strong> y las <strong>transacciones</strong> se gestionan desde sus módulos y se sincronizan automáticamente con este activo.
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* ── TAB: Principales competidores — benchmarking ── */}
          {activeTab==='at-comp' && (
            <div className="tab-content active"><div className="info-pad">

              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14,gap:14}}>
                <div>
                  <div style={{fontSize:17,fontWeight:700,color:'var(--text)',letterSpacing:'-.005em'}}>Principales competidores</div>
                  <div style={{fontSize:11,color:'var(--text4)',marginTop:2,lineHeight:1.5}}>Sistema de benchmarking entre activos. Compara con activos similares de la PDB y clasifica por motivos. Alimenta los Informes de gestión.</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:'var(--text3)'}}>{competidores.length} {competidores.length===1?'competidor manual':'competidores manuales'}</span>
                  <button onClick={exportCompetidoresPPT} disabled={competidores.length === 0} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',background:competidores.length === 0 ? 'var(--gray-lt)' : 'var(--accent)',color:competidores.length === 0 ? 'var(--text4)' : '#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:600,cursor:competidores.length === 0 ? 'not-allowed' : 'pointer',fontFamily:'inherit'}}>
                    <Presentation size={13} strokeWidth={1.75}/> Exportar PPT
                  </button>
                </div>
              </div>

              {/* Buscador para añadir manualmente */}
              <div style={{background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r2)',padding:12,marginBottom:14}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div style={{flex:1,position:'relative'}}>
                    <input className="of-inp" style={{width:'100%',boxSizing:'border-box'}}
                      placeholder="Buscar activo por nombre o ref para añadirlo manualmente…"
                      value={compSearch} onChange={e=>setCompSearch(e.target.value)} />
                    {compResults.length > 0 && (
                      <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',marginTop:4,maxHeight:240,overflowY:'auto',zIndex:10,boxShadow:'0 4px 12px rgba(0,0,0,0.06)'}}>
                        {compResults.map(r => (
                          <div key={r.id} onClick={()=>addCompetidor(r, [])} style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',fontSize:11}}
                            onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
                            onMouseLeave={e=>e.currentTarget.style.background=''}>
                            <div style={{fontWeight:600}}>{r.nombre || '—'} <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text4)',marginLeft:4}}>· {r.ref}</span></div>
                            <div style={{fontSize:10,color:'var(--text3)'}}>{[r.zona, r.ciudad, r.uso].filter(Boolean).join(' · ')} · {r.sba ? Number(r.sba).toLocaleString('es-ES')+' m²' : '—'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Errores */}
              {compError && <div style={{padding:'10px 14px',background:'var(--red-lt)',border:'1px solid var(--red-bd)',borderRadius:'var(--r)',color:'var(--red)',fontSize:11,marginBottom:10}}>Error: {compError} <span style={{color:'var(--text3)',marginLeft:6}}>· Si la tabla no existe, aplica las migraciones 027 y 028.</span></div>}
              {compLoading && <div style={{padding:'10px 14px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',color:'var(--accent)',fontSize:11,marginBottom:10}}>Cargando competidores…</div>}

              {/* SECCIÓN 1: Mis competidores (manuales, guardados) */}
              {competidores.length > 0 && (
                <>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>Mis competidores ({competidores.length})</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:14,marginBottom:24}}>
                    {competidores.map((c, idx) => {
                      const a = c.competidor || {}
                      const sim = computeSimilarity(a)
                      const motivos = c.motivos || []
                      const showPicker = editMotivosFor === c.id
                      return (
                        <div key={c.id} style={{background:'#fff',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden',display:'flex',flexDirection:'column'}}>
                          {/* Imagen / placeholder */}
                          <div style={{height:120,background:'linear-gradient(135deg,#f5efe5,#ece0c9)',position:'relative',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                            onClick={()=>navigate('ficha-activo',{ref:a.ref})}>
                            {c.foto
                              ? <img src={c.foto} alt={a.nombre||a.ref} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
                              : <Building2 size={36} strokeWidth={1.5} color="#5a4828" style={{opacity:0.5}}/>}
                            {/* Tags arriba a la derecha */}
                            <div style={{position:'absolute',top:8,right:8,display:'flex',flexWrap:'wrap',gap:4,justifyContent:'flex-end',maxWidth:'70%'}}>
                              {sim.tags.slice(0,3).map(tag => (
                                <span key={tag} style={{fontSize:9,fontWeight:700,padding:'3px 7px',borderRadius:10,background:tag.includes('directo')||tag.includes('idéntico')?'var(--green-lt)':'rgba(255,255,255,0.95)',color:tag.includes('directo')||tag.includes('idéntico')?'var(--green)':'var(--text2)',border:`1px solid ${tag.includes('directo')||tag.includes('idéntico')?'var(--green-bd)':'var(--border)'}`,whiteSpace:'nowrap'}}>{tag}</span>
                              ))}
                            </div>
                            {/* Botones reorder */}
                            <div style={{position:'absolute',top:8,left:8,display:'flex',flexDirection:'column',gap:2}}>
                              {idx > 0 && <button onClick={(e)=>{e.stopPropagation();reorderCompetidor(c.id,'up')}} style={{width:22,height:22,border:'none',background:'rgba(255,255,255,0.9)',borderRadius:4,cursor:'pointer',fontSize:11,fontFamily:'inherit',color:'var(--text2)'}} title="Subir">↑</button>}
                              {idx < competidores.length - 1 && <button onClick={(e)=>{e.stopPropagation();reorderCompetidor(c.id,'down')}} style={{width:22,height:22,border:'none',background:'rgba(255,255,255,0.9)',borderRadius:4,cursor:'pointer',fontSize:11,fontFamily:'inherit',color:'var(--text2)'}} title="Bajar">↓</button>}
                            </div>
                          </div>

                          {/* Body */}
                          <div style={{padding:'12px 14px',flex:1,display:'flex',flexDirection:'column',gap:10}}>
                            <div style={{cursor:'pointer'}} onClick={()=>navigate('ficha-activo',{ref:a.ref})}>
                              <div style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:2}}>{a.nombre || '—'}</div>
                              <div style={{fontSize:10,color:'var(--text3)'}}>{[a.zona, a.subzona, a.ciudad].filter(Boolean).join(' · ') || '—'} · <span style={{fontFamily:'var(--mono)'}}>{a.ref}</span></div>
                            </div>

                            {/* KPIs (mismos que header del activo) */}
                            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',border:'1px solid var(--border)',borderRadius:6,overflow:'hidden'}}>
                              {[
                                ['SBA',          a.sba ? Number(a.sba).toLocaleString('es-ES') : '—', 'var(--text1)'],
                                ['Edificios',    String(c.n_edificios || 1), 'var(--text1)'],
                                ['Plazas',       c.plazas ? Number(c.plazas).toLocaleString('es-ES') : '—', 'var(--text1)'],
                                ['Arrendatarios',String(c.n_arrendatarios || 0), c.n_arrendatarios > 0 ? 'var(--accent)' : 'var(--text4)'],
                                ['Propietarios', String(c.n_propietarios  || 0), c.n_propietarios  > 0 ? 'var(--accent)' : 'var(--text4)'],
                                ['Ocupación',    a.occupancy_rate != null ? `${a.occupancy_rate}%` : '—', a.occupancy_rate >= 90 ? 'var(--green)' : a.occupancy_rate >= 75 ? 'var(--amber)' : 'var(--red)'],
                              ].map(([lbl,val,col]) => (
                                <div key={lbl} style={{background:'#fff',padding:'6px 8px',textAlign:'center'}}>
                                  <div style={{fontSize:8,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em'}}>{lbl}</div>
                                  <div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:col,lineHeight:1.1,marginTop:2}}>{val}</div>
                                </div>
                              ))}
                            </div>

                            {/* Motivos seleccionados */}
                            <div>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                                <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Motivos</span>
                                <button onClick={()=>setEditMotivosFor(showPicker ? null : c.id)} style={{background:'none',border:'none',color:'var(--accent)',cursor:'pointer',fontSize:10,fontFamily:'inherit',fontWeight:600,padding:0}}>{showPicker ? 'Cerrar' : 'Editar'}</button>
                              </div>
                              {motivos.length === 0 && !showPicker && <div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic'}}>Sin motivos · click en Editar</div>}
                              {motivos.length > 0 && !showPicker && (
                                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                                  {motivos.map(m => <span key={m} style={{fontSize:10,padding:'3px 8px',borderRadius:10,background:'var(--accent-lt)',color:'var(--accent)',fontWeight:600,border:'1px solid var(--accent-bd)'}}>{m}</span>)}
                                </div>
                              )}
                              {showPicker && (
                                <div style={{display:'flex',flexWrap:'wrap',gap:4,padding:'8px',background:'var(--gray-lt)',borderRadius:5}}>
                                  {MOTIVO_CATALOG.map(m => {
                                    const sel = motivos.includes(m)
                                    return (
                                      <span key={m} onClick={()=>toggleMotivo(c.id, m)} style={{fontSize:10,padding:'4px 9px',borderRadius:10,cursor:'pointer',background:sel?'var(--accent)':'var(--surface)',color:sel?'#fff':'var(--text2)',fontWeight:sel?700:500,border:`1px solid ${sel?'var(--accent)':'var(--border)'}`,userSelect:'none'}}>{m}</span>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer */}
                          <div style={{padding:'8px 14px',borderTop:'1px solid var(--border)',background:'var(--gray-lt)',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:10,color:'var(--text4)'}}>
                            <span>{c.n_ofertas} ofertas · {c.n_transacciones} transac. 12m</span>
                            <button onClick={()=>removeCompetidor(c.id)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:10,fontFamily:'inherit',fontWeight:600}}>Quitar</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* SECCIÓN 2: Sugerencias automáticas */}
              {sugerencias.length > 0 && (
                <>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.04em'}}>Sugerencias automáticas ({sugerencias.length})</div>
                    <span style={{fontSize:10,color:'var(--text4)'}}>Comparables potenciales detectados por similitud · click ⊕ para añadir</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:14}}>
                    {sugerencias.map(c => {
                      const a = c.competidor || c
                      return (
                        <div key={a.id} style={{background:'#fff',border:'1px dashed var(--border2)',borderRadius:10,overflow:'hidden',display:'flex',flexDirection:'column',opacity:0.95}}>
                          <div style={{height:120,background:'linear-gradient(135deg,#f3f4f6,#e5e7eb)',position:'relative',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                            onClick={()=>navigate('ficha-activo',{ref:a.ref})}>
                            {c.foto
                              ? <img src={c.foto} alt={a.nombre||a.ref} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
                              : <Building2 size={36} strokeWidth={1.5} color="#6b7280" style={{opacity:0.5}}/>}
                            <div style={{position:'absolute',top:8,right:8,display:'flex',flexWrap:'wrap',gap:4,justifyContent:'flex-end',maxWidth:'70%'}}>
                              {c.tags.slice(0,3).map(tag => (
                                <span key={tag} style={{fontSize:9,fontWeight:700,padding:'3px 7px',borderRadius:10,background:'rgba(255,255,255,0.95)',color:'var(--text2)',border:'1px solid var(--border)',whiteSpace:'nowrap'}}>{tag}</span>
                              ))}
                            </div>
                          </div>

                          <div style={{padding:'12px 14px',flex:1,display:'flex',flexDirection:'column',gap:10}}>
                            <div style={{cursor:'pointer'}} onClick={()=>navigate('ficha-activo',{ref:a.ref})}>
                              <div style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:2}}>{a.nombre || '—'}</div>
                              <div style={{fontSize:10,color:'var(--text3)'}}>{[a.zona, a.subzona, a.ciudad].filter(Boolean).join(' · ') || '—'} · <span style={{fontFamily:'var(--mono)'}}>{a.ref}</span></div>
                            </div>

                            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',border:'1px solid var(--border)',borderRadius:6,overflow:'hidden'}}>
                              {[
                                ['SBA',          a.sba ? Number(a.sba).toLocaleString('es-ES') : '—', 'var(--text1)'],
                                ['Edificios',    String(c.n_edificios || 1), 'var(--text1)'],
                                ['Plazas',       c.plazas ? Number(c.plazas).toLocaleString('es-ES') : '—', 'var(--text1)'],
                                ['Arrendatarios',String(c.n_arrendatarios || 0), c.n_arrendatarios > 0 ? 'var(--accent)' : 'var(--text4)'],
                                ['Propietarios', String(c.n_propietarios  || 0), c.n_propietarios  > 0 ? 'var(--accent)' : 'var(--text4)'],
                                ['Ocupación',    a.occupancy_rate != null ? `${a.occupancy_rate}%` : '—', a.occupancy_rate >= 90 ? 'var(--green)' : a.occupancy_rate >= 75 ? 'var(--amber)' : 'var(--red)'],
                              ].map(([lbl,val,col]) => (
                                <div key={lbl} style={{background:'#fff',padding:'6px 8px',textAlign:'center'}}>
                                  <div style={{fontSize:8,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em'}}>{lbl}</div>
                                  <div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:col,lineHeight:1.1,marginTop:2}}>{val}</div>
                                </div>
                              ))}
                            </div>

                            <div>
                              <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:5}}>Motivos (toggle antes de añadir)</div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                                {MOTIVO_CATALOG.map(m => {
                                  const sel = getSugMotivos(c).includes(m)
                                  const auto = c.motivos.includes(m) // auto-detectado
                                  return (
                                    <span key={m} onClick={()=>toggleSugMotivo(c, m)} style={{fontSize:10,padding:'3px 8px',borderRadius:10,cursor:'pointer',background:sel?'var(--accent)':auto?'#fef3c7':'var(--surface)',color:sel?'#fff':auto?'#92400e':'var(--text3)',fontWeight:sel||auto?700:500,border:`1px solid ${sel?'var(--accent)':auto?'#fde68a':'var(--border)'}`,userSelect:'none'}}>{m}</span>
                                  )
                                })}
                              </div>
                              <div style={{fontSize:9,color:'var(--text4)',marginTop:6,fontStyle:'italic'}}>Amarillo = detectado automáticamente · Azul = seleccionado por ti</div>
                            </div>
                          </div>

                          <div style={{padding:'8px 14px',borderTop:'1px solid var(--border)',background:'var(--gray-lt)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:10,color:'var(--text4)'}}>{getSugMotivos(c).length} motivo{getSugMotivos(c).length===1?'':'s'} · Score auto: {c.score}/6</span>
                            <button onClick={()=>addCompetidor(a, getSugMotivos(c))} style={{background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,padding:'4px 12px',cursor:'pointer',fontSize:11,fontFamily:'inherit',fontWeight:700}}>+ Añadir</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Estado vacío total */}
              {!compLoading && competidores.length === 0 && sugerencias.length === 0 && !compError && (
                <div style={{padding:32,textAlign:'center',color:'var(--text4)',fontSize:12,background:'var(--surface)',border:'1px dashed var(--border)',borderRadius:'var(--r2)'}}>
                  No hay activos similares en la PDB. Añade un competidor manualmente con el buscador.
                </div>
              )}

            </div></div>
          )}

          {/* ── TAB: Características ── */}
          {activeTab==='at-caract' && (()=>{
            const usoActivo = activo?.uso || ''
            const usoLabel = usoActivo || 'Uso principal'
            const usoIco = <UsoIco uso={usoActivo} />
            const usoIcoLg = <UsoIco uso={usoActivo} size={16} />
            const selSt = {padding:'5px 9px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}
            const inpSt = {padding:'5px 9px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)',flex:1}
            const addRowBtn = (onClick, show) => (
              <button onClick={onClick} style={{padding:'3px 10px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600,lineHeight:1.4}}>{show?'✕ Cancelar':'+ Añadir'}</button>
            )
            const addRowForm = (vals, setVals, cats, onSave, onCancel) => (
              <div style={{display:'flex',flexWrap:'wrap',gap:8,padding:'10px 12px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:7,marginBottom:12,alignItems:'flex-end'}}>
                <div style={{display:'flex',flexDirection:'column',gap:3}}>
                  <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Categoría</label>
                  <select value={vals.categoria} onChange={e=>setVals(p=>({...p,categoria:e.target.value,categoriaOtro:''}))} style={{...selSt,minWidth:160}}>
                    <option value="">Seleccionar...</option>
                    {cats.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                {vals.categoria==='Otro (especificar)' && (
                  <div style={{display:'flex',flexDirection:'column',gap:3}}>
                    <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Especificar</label>
                    <input value={vals.categoriaOtro} onChange={e=>setVals(p=>({...p,categoriaOtro:e.target.value}))} style={{...selSt,minWidth:140}} placeholder="Nombre..."/>
                  </div>
                )}
                <div style={{display:'flex',flexDirection:'column',gap:3,flex:1,minWidth:160}}>
                  <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Detalle / Valor</label>
                  <input value={vals.detalle} onChange={e=>setVals(p=>({...p,detalle:e.target.value}))} style={inpSt} placeholder="Descripción o valor..."/>
                </div>
                <button onClick={onSave} style={{padding:'5px 16px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:700,alignSelf:'flex-end'}}>Guardar</button>
                <button onClick={onCancel} style={{padding:'5px 10px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',alignSelf:'flex-end',color:'var(--text3)'}}>✕</button>
              </div>
            )
            const caracTable = (rows, onRemove) => rows.length===0 ? (
              <div style={{padding:'16px 0',textAlign:'center',color:'var(--text4)',fontSize:12}}>Sin características registradas — pulsa "+ Añadir" para empezar.</div>
            ) : (
              <table className="pat-table">
                <thead><tr><th>Categoría</th><th>Detalle / Valor</th><th style={{width:32}}></th></tr></thead>
                <tbody>{rows.map(r=>(
                  <tr key={r.id}>
                    <td><span style={{fontSize:10,padding:'2px 8px',borderRadius:9,background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',color:'var(--accent)',fontWeight:600}}>{r.categoria==='Otro (especificar)' ? r.categoriaOtro : r.categoria}</span></td>
                    <td style={{fontSize:12,color:'var(--text1)'}}>{r.detalle}</td>
                    <td><button onClick={()=>onRemove(r.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text4)',fontSize:13,padding:'0 4px'}} title="Eliminar">✕</button></td>
                  </tr>
                ))}</tbody>
              </table>
            )
            return (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Características técnicas</div>
                <div className="carac-tabs">
                  {[['ct-transporte','Transporte'],['ct-normativa','Normativa / ESG'],['ct-generales','Características generales'],['ct-uso',<><UsoIco uso={usoActivo} /> {usoLabel}</>],['ct-plazas','Plazas']].map(([k,l])=>(
                    <div key={k} className={`ct ${caracTab===k?'active':''}`} onClick={()=>setCaracTab(k)}>{l}</div>
                  ))}
                </div>

                {/* Transporte — dinámico */}
                {caracTab==='ct-transporte' && (
                  <div className="info-block">
                    <div className="ib-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span>TRANSPORTE</span>
                      {addRowBtn(()=>setShowAddTransp(v=>!v), showAddTransp)}
                    </div>
                    {showAddTransp && (
                      <div style={{display:'flex',flexWrap:'wrap',gap:8,padding:'10px 12px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:7,marginBottom:12,alignItems:'flex-end'}}>
                        <div style={{display:'flex',flexDirection:'column',gap:3}}>
                          <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Medio</label>
                          <select value={newTransp.medio} onChange={e=>setNewTransp(p=>({...p,medio:e.target.value}))} style={{padding:'5px 9px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)',minWidth:130}}>
                            {MEDIOS_TRANSPORTE.map(m=><option key={m}>{m}</option>)}
                          </select>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:3}}>
                          <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Línea / Vía</label>
                          <input value={newTransp.linea} onChange={e=>setNewTransp(p=>({...p,linea:e.target.value}))} style={{padding:'5px 9px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)',width:90}} placeholder="L7, A-3..."/>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:3,flex:1,minWidth:120}}>
                          <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Descripción</label>
                          <input value={newTransp.descripcion} onChange={e=>setNewTransp(p=>({...p,descripcion:e.target.value}))} style={{padding:'5px 9px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)',width:'100%'}} placeholder="Nombre parada..."/>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:3}}>
                          <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Tiempo</label>
                          <input value={newTransp.tiempo} onChange={e=>setNewTransp(p=>({...p,tiempo:e.target.value}))} style={{padding:'5px 9px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)',width:70}} placeholder="5 min"/>
                        </div>
                        <button onClick={()=>{
                          if (!newTransp.medio) return
                          const maxId = transportes.reduce((m,t)=>Math.max(m,t.id),0)
                          setTransportes(prev=>[...prev,{...newTransp,id:maxId+1}])
                          setNewTransp({medio:'Metro',linea:'',descripcion:'',tiempo:''})
                          setShowAddTransp(false)
                        }} style={{padding:'5px 16px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:700,alignSelf:'flex-end'}}>Guardar</button>
                        <button onClick={()=>{setShowAddTransp(false);setNewTransp({medio:'Metro',linea:'',descripcion:'',tiempo:''})}} style={{padding:'5px 10px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',alignSelf:'flex-end',color:'var(--text3)'}}>✕</button>
                      </div>
                    )}
                    {transportes.length===0 ? (
                      <div style={{padding:'16px 0',textAlign:'center',color:'var(--text4)',fontSize:12}}>Sin transporte registrado.</div>
                    ) : (
                      <table className="pat-table">
                        <thead><tr><th>Medio</th><th>Línea / Vía</th><th>Descripción</th><th>Tiempo acceso</th><th style={{width:32}}></th></tr></thead>
                        <tbody>{transportes.map(t=>(
                          <tr key={t.id}>
                            <td><span style={{fontSize:10,padding:'2px 8px',borderRadius:9,background:'#faf5ec',border:'1px solid #ece0c9',color:'#6f5734',fontWeight:600}}>{t.medio}</span></td>
                            <td style={{fontFamily:'var(--mono)',fontSize:11}}>{t.linea || '—'}</td>
                            <td style={{fontSize:11,color:'var(--text2)'}}>{t.descripcion || '—'}</td>
                            <td style={{fontSize:11,fontWeight:600}}>{t.tiempo || '—'}</td>
                            <td><button onClick={()=>setTransportes(prev=>prev.filter(x=>x.id!==t.id))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text4)',fontSize:13,padding:'0 4px'}} title="Eliminar">✕</button></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Normativa / ESG — dropdowns */}
                {caracTab==='ct-normativa' && (
                  <div className="info-block">
                    <div className="ib-title">NORMATIVA / ESG</div>
                    <div className="info-2col" style={{gap:10}}>
                      <div>
                        <div className="ir"><span className="ir-k">Certificación energética</span>
                          <select value={esg.energia} onChange={e=>setEsg(p=>({...p,energia:e.target.value}))} style={selSt}>
                            <option value="">—</option>{['A+','A','B','C','D','E','F','G'].map(v=><option key={v}>{v}</option>)}
                          </select>
                        </div>
                        <div className="ir"><span className="ir-k">LEED</span>
                          <select value={esg.leed} onChange={e=>setEsg(p=>({...p,leed:e.target.value}))} style={selSt}>
                            <option value="">—</option>{['Certified','Silver','Gold','Platinum'].map(v=><option key={v}>{v}</option>)}
                          </select>
                        </div>
                        <div className="ir"><span className="ir-k">BREEAM</span>
                          <select value={esg.breeam} onChange={e=>setEsg(p=>({...p,breeam:e.target.value}))} style={selSt}>
                            <option value="">—</option>{['Pass','Good','Very Good','Excellent','Outstanding'].map(v=><option key={v}>{v}</option>)}
                          </select>
                        </div>
                        <div className="ir"><span className="ir-k">WELL</span>
                          <select value={esg.well} onChange={e=>setEsg(p=>({...p,well:e.target.value}))} style={selSt}>
                            <option value="">—</option>{['Bronze','Silver','Gold','Platinum'].map(v=><option key={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <div className="ir"><span className="ir-k">DGNB</span>
                          <select value={esg.dgnb} onChange={e=>setEsg(p=>({...p,dgnb:e.target.value}))} style={selSt}>
                            <option value="">—</option>{['Bronze','Silver','Gold','Platinum'].map(v=><option key={v}>{v}</option>)}
                          </select>
                        </div>
                        <div className="ir"><span className="ir-k">WiredScore</span>
                          <select value={esg.wiredscore} onChange={e=>setEsg(p=>({...p,wiredscore:e.target.value}))} style={selSt}>
                            <option value="">—</option>{['Connected','Silver','Gold','Platinum'].map(v=><option key={v}>{v}</option>)}
                          </select>
                        </div>
                        <div className="ir"><span className="ir-k">Consumo energético</span>
                          <input value={esg.consumo} onChange={e=>setEsg(p=>({...p,consumo:e.target.value}))} style={{...selSt,width:120}} placeholder="kWh/m²/año"/>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Características generales (comunes) */}
                {caracTab==='ct-generales' && (() => {
                  const cSel = {padding:'4px 8px',border:'1px solid var(--border)',borderRadius:5,fontSize:11,fontFamily:'inherit',cursor:'pointer',outline:'none',minWidth:160}
                  const cInp = {padding:'4px 8px',border:'1px solid var(--border)',borderRadius:5,fontSize:11,fontFamily:'inherit',outline:'none',flex:1,minWidth:120,background:'transparent'}
                  const rowSt = {display:'grid',gridTemplateColumns:'160px 1fr 1fr',gap:8,padding:'8px 12px',borderBottom:'1px solid var(--border)',alignItems:'center'}
                  const lblSt = {fontSize:11,fontWeight:600,color:'var(--text2)'}
                  return (
                    <div className="info-block">
                      <div className="ib-title">CARACTERÍSTICAS GENERALES</div>
                      <div style={{borderTop:'1px solid var(--border)'}}>
                        <div style={{display:'grid',gridTemplateColumns:'160px 1fr 1fr',gap:8,padding:'5px 12px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)'}}>
                          <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Característica</span>
                          <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Valor / Opción</span>
                          <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Notas adicionales</span>
                        </div>
                        {CARAC_GENERALES_FIELDS.map(f => {
                          const v = caracGenVal[f.id] || {}
                          return (
                            <div key={f.id} style={rowSt}>
                              <span style={lblSt}>{f.label}</span>
                              <select value={v.opcion||''} onChange={e=>setCGV(f.id,'opcion',e.target.value)}
                                style={{...cSel, background: v.opcion ? 'var(--accent-lt)' : 'var(--surface)', color: v.opcion ? 'var(--accent)' : 'var(--text3)', fontWeight: v.opcion ? 600 : 400}}>
                                <option value="">— seleccionar —</option>
                                {f.opciones.map(o=><option key={o} value={o}>{o}</option>)}
                              </select>
                              <input type="text" value={v.texto||''} onChange={e=>setCGV(f.id,'texto',e.target.value)}
                                placeholder="Notas adicionales..." style={{...cInp, background: v.texto ? 'var(--surface)' : 'transparent'}}/>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Características técnicas por uso */}
                {caracTab==='ct-uso' && (() => {
                  const usoFields = CARAC_USO_FIELDS[normalizeUso(usoActivo)] || []
                  const cSel = {padding:'4px 8px',border:'1px solid var(--border)',borderRadius:5,fontSize:11,fontFamily:'inherit',cursor:'pointer',outline:'none',minWidth:160}
                  const cInp = {padding:'4px 8px',border:'1px solid var(--border)',borderRadius:5,fontSize:11,fontFamily:'inherit',outline:'none',flex:1,minWidth:120,background:'transparent'}
                  const rowSt = {display:'grid',gridTemplateColumns:'160px 1fr 1fr',gap:8,padding:'8px 12px',borderBottom:'1px solid var(--border)',alignItems:'center'}
                  const lblSt = {fontSize:11,fontWeight:600,color:'var(--text2)'}
                  return (
                    <div className="info-block">
                      <div className="ib-title" style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:6}}>{usoIcoLg} CARACTERÍSTICAS TÉCNICAS</span>
                        <span style={{fontSize:9,fontWeight:400,color:'var(--text4)',textTransform:'none',letterSpacing:0}}>— uso: {usoActivo || 'no definido'} · heredado de Información general</span>
                      </div>
                      {usoFields.length === 0 ? (
                        <div style={{padding:'24px',textAlign:'center',color:'var(--text4)',fontSize:12}}>
                          {usoActivo ? `No hay características definidas para "${usoActivo}"` : 'Asigna un Uso principal en la pestaña Información general para ver las características correspondientes.'}
                        </div>
                      ) : (
                        <div style={{borderTop:'1px solid var(--border)'}}>
                          <div style={{display:'grid',gridTemplateColumns:'160px 1fr 1fr',gap:8,padding:'5px 12px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)'}}>
                            <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Característica</span>
                            <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Valor / Opción</span>
                            <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Notas adicionales</span>
                          </div>
                          {usoFields.map(f => {
                            const v = caracUsoVal[f.id] || {}
                            return (
                              <div key={f.id} style={rowSt}>
                                <span style={lblSt}>{f.label}</span>
                                <select value={v.opcion||''} onChange={e=>setCUV(f.id,'opcion',e.target.value)}
                                  style={{...cSel, background: v.opcion ? 'var(--accent-lt)' : 'var(--surface)', color: v.opcion ? 'var(--accent)' : 'var(--text3)', fontWeight: v.opcion ? 600 : 400}}>
                                  <option value="">— seleccionar —</option>
                                  {f.opciones.map(o=><option key={o} value={o}>{o}</option>)}
                                </select>
                                <input type="text" value={v.texto||''} onChange={e=>setCUV(f.id,'texto',e.target.value)}
                                  placeholder="Notas adicionales..." style={{...cInp, background: v.texto ? 'var(--surface)' : 'transparent'}}/>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {caracTab==='ct-plazas' && (()=>{
                  const totalPl = plazas.reduce((s,p)=>s+p.cantidad,0)
                  const byUbicPl = UBICACIONES.map(u=>({u,n:plazas.filter(p=>p.ubicacion===u).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
                  const byTipoPl = TIPOS_PLAZA.map(t=>({t,n:plazas.filter(p=>p.tipo===t).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
                  const byVehPl  = TIPOS_VEHICULO.map(v=>({v,n:plazas.filter(p=>p.vehiculo===v).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
                  const selStyle = {padding:'5px 9px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)',cursor:'pointer'}
                  return (
                    <div className="info-block">
                      {/* Header */}
                      <div className="ib-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span>🅿 PLAZAS DE APARCAMIENTO</span>
                        <button
                          onClick={()=>setShowAddPlaza(v=>!v)}
                          style={{padding:'3px 10px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600,lineHeight:1.4}}>
                          {showAddPlaza?'✕ Cancelar':'+ Añadir'}
                        </button>
                      </div>

                      {/* Formulario de adición */}
                      {showAddPlaza && (
                        <div style={{display:'flex',flexWrap:'wrap',gap:8,padding:'12px 14px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:7,marginBottom:14,alignItems:'flex-end'}}>
                          <div style={{display:'flex',flexDirection:'column',gap:3}}>
                            <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Ubicación</label>
                            <select value={newPlaza.ubicacion} onChange={e=>setNewPlaza(p=>({...p,ubicacion:e.target.value}))} style={selStyle}>
                              {UBICACIONES.map(u=><option key={u}>{u}</option>)}
                            </select>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:3}}>
                            <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Tipo de plaza</label>
                            <select value={newPlaza.tipo} onChange={e=>setNewPlaza(p=>({...p,tipo:e.target.value}))} style={selStyle}>
                              {TIPOS_PLAZA.map(t=><option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:3}}>
                            <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Tipo de vehículo</label>
                            <select value={newPlaza.vehiculo} onChange={e=>setNewPlaza(p=>({...p,vehiculo:e.target.value}))} style={selStyle}>
                              {TIPOS_VEHICULO.map(v=><option key={v}>{v}</option>)}
                            </select>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:3}}>
                            <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Cantidad</label>
                            <input type="number" min="1" value={newPlaza.cantidad}
                              onChange={e=>setNewPlaza(p=>({...p,cantidad:e.target.value}))}
                              onKeyDown={e=>{if(e.key==='Enter')addPlaza()}}
                              style={{width:72,padding:'5px 9px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'var(--mono)',textAlign:'right'}}/>
                          </div>
                          <button onClick={addPlaza}
                            style={{padding:'5px 16px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:700,alignSelf:'flex-end'}}>
                            Guardar
                          </button>
                        </div>
                      )}

                      {/* Resumen totales */}
                      {totalPl>0 && (
                        <div style={{display:'grid',gridTemplateColumns:'auto 1fr 1fr 1fr',gap:'8px 20px',padding:'10px 14px',background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:6,marginBottom:14,alignItems:'start'}}>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingRight:16,borderRight:'1px solid var(--border)'}}>
                            <span style={{fontSize:26,fontWeight:800,color:'var(--text1)',fontFamily:'var(--mono)',lineHeight:1}}>{totalPl.toLocaleString('es-ES')}</span>
                            <span style={{fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase',marginTop:1}}>Total plazas</span>
                          </div>
                          <div>
                            <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:4}}>Ubicación</div>
                            {byUbicPl.map(x=>(
                              <div key={x.u} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                                <span style={{color:'var(--text3)'}}>{x.u}</span>
                                <span style={{fontWeight:700,fontFamily:'var(--mono)',color:'var(--text1)'}}>{x.n}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:4}}>Tipo plaza</div>
                            {byTipoPl.map(x=>(
                              <div key={x.t} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                                <span style={{color:'var(--text3)'}}>{x.t}</span>
                                <span style={{fontWeight:700,fontFamily:'var(--mono)',color:'var(--text1)'}}>{x.n}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:4}}>Vehículo</div>
                            {byVehPl.map(x=>(
                              <div key={x.v} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                                <span style={{color:'var(--text3)'}}>{x.v}</span>
                                <span style={{fontWeight:700,fontFamily:'var(--mono)',color:'var(--text1)'}}>{x.n}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tabla detalle */}
                      {plazas.length===0 ? (
                        <div style={{padding:'20px 0',textAlign:'center',color:'var(--text4)',fontSize:12}}>
                          No hay plazas registradas — pulsa "+ Añadir" para crear las primeras.
                        </div>
                      ) : (
                        <table className="pat-table">
                          <thead>
                            <tr>
                              <th>Ubicación</th>
                              <th>Tipo plaza</th>
                              <th>Vehículo</th>
                              <th style={{textAlign:'right'}}>Cantidad</th>
                              <th style={{width:32}}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {plazas.map(p=>(
                              <tr key={p.id}>
                                <td>
                                  <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
                                    <span style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#f1f5f9',border:'1px solid #cbd5e1',color:'#475569',fontWeight:600}}>{p.ubicacion}</span>
                                  </span>
                                </td>
                                <td>
                                  <span style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#ede9fe',border:'1px solid #c4b5fd',color:'#6b5b8e',fontWeight:600}}>{p.tipo}</span>
                                </td>
                                <td>
                                  <span style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#f0fdf4',border:'1px solid #86efac',color:'#15803d',fontWeight:600}}>{p.vehiculo}</span>
                                </td>
                                <td style={{textAlign:'right',fontFamily:'var(--mono)',fontWeight:700,fontSize:13}}>{p.cantidad.toLocaleString('es-ES')}</td>
                                <td>
                                  <button onClick={()=>removePlaza(p.id)}
                                    style={{background:'none',border:'none',cursor:'pointer',color:'var(--text4)',fontSize:13,padding:'0 4px',lineHeight:1}}
                                    title="Eliminar">✕</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
            )
          })()}

          {/* ── TAB: Propietarios y arrendatarios ── */}

          {/* ── TAB: Ofertas ── */}

          {/* ── TAB: Multimedia & Documentos — layout 2 columnas (50/50) ── */}
          {activeTab==='at-mediadocs' && (
            <div className="tab-content active">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,padding:'18px 24px',alignItems:'start'}}>
                {/* Columna izquierda: Multimedia */}
                <div style={{minWidth:0}}>
                  <TabMultimedia activoId={activo?.id}/>
                </div>
                {/* Columna derecha: Documentos */}
                <div style={{minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                    <div style={{fontSize:14,fontWeight:600}}>Documentos</div>
                    <button className="ab-btn blue" style={{display:'inline-flex',alignItems:'center',gap:6}}><Upload size={13} strokeWidth={1.75}/> Cargar</button>
                  </div>
                  <div className="doc-cats" style={{gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                    {[
                      { k:'todos',        Ico:Folder,          lbl:'Todos',        cnt:8 },
                      { k:'comercial',    Ico:BarChart3,       lbl:'Comercial',    cnt:3 },
                      { k:'tecnica',      Ico:Wrench,          lbl:'Técnica',      cnt:2 },
                      { k:'marketing',    Ico:Target,          lbl:'Marketing',    cnt:1 },
                      { k:'valoraciones', Ico:Wallet,          lbl:'Valoraciones', cnt:1 },
                      { k:'arquitectura', Ico:Compass,         lbl:'Arquitectura', cnt:1 },
                      { k:'informes',     Ico:ClipboardList,   lbl:'Informes',     cnt:0 },
                    ].map(c => (
                      <div key={c.k} className={`doc-cat ${docCat===c.k?'active':''}`} onClick={()=>setDocCat(c.k)} style={{padding:'10px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                        <c.Ico size={20} strokeWidth={1.75} style={{color: docCat===c.k ? 'var(--accent)' : 'var(--text3)'}}/>
                        <div className="doc-cat-name" style={{fontSize:11}}>{c.lbl}</div>
                        <div className="doc-cat-count" style={{padding:'1px 7px',fontSize:9,marginTop:0}}>{c.cnt}</div>
                      </div>
                    ))}
                  </div>
                  <div className="doc-drop" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%'}}><Upload size={14} strokeWidth={1.75}/> Arrastra documentos aquí o haz clic para cargar</div>
                  <table className="doc-table">
                    <thead><tr><th>Documento</th><th>Categoría</th><th>Fecha</th><th></th></tr></thead>
                    <tbody>
                      {[
                        { Ico:FileText,        name:'Dossier Avalon',        cat:'Comercial',   catCol:{bg:'var(--accent-lt)',color:'var(--accent)'}, fecha:'07/02/2026' },
                        { Ico:BarChart3,       name:'Stacking plan Q1',      cat:'Comercial',   catCol:{bg:'var(--accent-lt)',color:'var(--accent)'}, fecha:'07/02/2026' },
                        { Ico:FileSpreadsheet, name:'Valoración Q1 2026',    cat:'Valoraciones',catCol:{bg:'var(--amber-lt)',color:'var(--amber)'},   fecha:'20/03/2026' },
                        { Ico:ClipboardList,   name:'Rent Roll 2026',        cat:'Comercial',   catCol:{bg:'var(--accent-lt)',color:'var(--accent)'}, fecha:'01/01/2026' },
                      ].map((d,i) => (
                        <tr key={i}>
                          <td><span className="doc-link" style={{display:'inline-flex',alignItems:'center',gap:6}}><d.Ico size={14} strokeWidth={1.75}/> {d.name}</span></td>
                          <td><span className="doc-tag" style={d.catCol}>{d.cat}</span></td>
                          <td>{d.fecha}</td>
                          <td style={{display:'flex',gap:6,color:'var(--text4)'}}><Download size={13} strokeWidth={1.75}/><Pencil size={13} strokeWidth={1.75}/><XClose size={13} strokeWidth={1.75}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Información adicional ── */}

          {/* ── TAB: Vista 360 — Histórico comercial completo del activo ── */}
          {activeTab==='at-360' && (
            <div className="tab-content active"><div className="info-pad">

              {/* Loading state */}
              {vista360.loading && (
                <div style={{padding:'10px 14px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',color:'var(--accent)',fontSize:11,marginBottom:12}}>
                  Cargando histórico comercial del activo…
                </div>
              )}

              {/* KPI strip — 7 categorías de actividad */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,marginBottom:14}}>
                {[
                  {lbl:'Ofertas',                val:vista360.ofertas.length,       color:'var(--green)'},
                  {lbl:'Cuentas presentadas',    val:vista360.cuentas.length,       color:'var(--accent)'},
                  {lbl:'Demandas',               val:vista360.demandas.length,      color:'var(--purple)'},
                  {lbl:'Transacciones',          val:vista360.transacciones.length, color:'var(--text1)'},
                  {lbl:'Mandatos',               val:vista360.mandatos.length,      color:'var(--amber)'},
                  {lbl:'Propuestas / Proyectos', val:vista360.propuestas.length,    color:'var(--teal)'},
                  {lbl:'Pitches',                val:pitchesActivo.length,          color:'#0e7490'},
                ].map(k=>(
                  <div key={k.lbl} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3,lineHeight:1.2}}>{k.lbl}</div>
                    <div style={{fontSize:20,fontWeight:800,fontFamily:'var(--mono)',color:k.color,lineHeight:1}}>{k.val}</div>
                  </div>
                ))}
              </div>

              {/* Timeline cronológico */}
              <div style={{fontSize:11,fontWeight:600,marginBottom:8,color:'var(--text2)'}}>Timeline cronológico</div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:18}}>
                {[
                  {av:'AS',bg:'#f5efe5',color:'#5a4828',name:'Álvaro Sierra',msg:'firmó contrato con Oracle Spain (P5 · 13.486 m²)',badge:{bg:'var(--green-lt)',color:'var(--green)',bc:'var(--green-bd)',lbl:'TRANSACCIÓN'},time:'04/04/2026'},
                  {av:'AS',bg:'#f5efe5',color:'#5a4828',name:'Álvaro Sierra',msg:'registró visita con Oracle Spain',badge:{bg:'var(--accent-lt)',color:'var(--accent)',bc:'var(--accent-bd)',lbl:'VISITA'},time:'15/02/2026'},
                  {av:'MR',bg:'#fce7f3',color:'#9d174d',name:'María Ruiz',msg:'presentó P.E Avalon a Generali RE',badge:{bg:'var(--purple-lt)',color:'var(--purple)',bc:'var(--purple-bd)',lbl:'PRESENTACIÓN'},time:'20/01/2026'},
                  {av:'JL',bg:'#dcfce7',color:'#166534',name:'Jorge López',name2:'creó',msg:'OLB001 — P1-P6 oferta de alquiler',badge:{bg:'var(--green-lt)',color:'var(--green)',bc:'var(--green-bd)',lbl:'OFERTA'},time:'10/12/2025'},
                  {av:'AS',bg:'#f5efe5',color:'#5a4828',name:'Álvaro Sierra',msg:'firmó mandato de leasing exclusiva con Barings RE',badge:{bg:'#fef3c7',color:'#92400e',bc:'#fde68a',lbl:'MANDATO'},time:'01/10/2025'},
                ].map((item,i,arr)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:item.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:item.color,flexShrink:0}}>{item.av}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:'var(--text2)'}}><strong>{item.name}</strong> {item.msg} <span style={{background:item.badge.bg,color:item.badge.color,border:`1px solid ${item.badge.bc}`,padding:'1px 7px',borderRadius:10,fontSize:9,fontWeight:700,marginLeft:4}}>{item.badge.lbl}</span></div>
                      <div style={{fontSize:10,color:'var(--text4)',marginTop:2}}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 6 secciones en grid 2 columnas (regla 50%) */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>

                {(() => {
                  // helpers locales para mapear estado → clase de tag
                  const tagOferta = (e) => e==='Cerrada' ? 'tag-gray' : e==='Desactivada' ? 'tag-gray' : e==='En negociación' ? 'tag-amber' : 'tag-green'
                  const tagDem    = (e) => e==='Finalista' ? 'tag-green' : e==='Cancelada' || e==='Standby' ? 'tag-gray' : 'tag-amber'
                  const tagMand   = (e) => e==='en_curso' || e==='En curso' ? 'tag-green' : 'tag-gray'
                  const tagProp   = (e) => e==='ganada' ? 'tag-green' : e==='perdida' ? 'tag-red' : e==='presentada' ? 'tag-blue' : 'tag-gray'
                  const fmtDate   = (iso) => iso ? new Date(iso).toLocaleDateString('es-ES') : '—'
                  const fmtRange  = (a, b) => `${fmtDate(a)} – ${fmtDate(b)}`
                  const empty     = (msg) => <tr><td colSpan={6} style={{padding:'14px',color:'var(--text4)',fontSize:11,textAlign:'center'}}>{msg}</td></tr>
                  return null
                })()}

                {/* Ofertas vinculadas */}
                <div className="va-card" style={{margin:0}}>
                  <div className="va-card-header"><h3>Ofertas vinculadas <span style={{fontSize:9,color:'var(--text4)',fontWeight:400,marginLeft:6}}>{vista360.ofertas.length} {vista360.ofertas.length===1?'oferta':'ofertas'}</span></h3></div>
                  <div style={{padding:'4px 0 14px'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead>
                        <tr>{['Ref','Operación','Renta','Estado'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 12px',fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase'}}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {vista360.ofertas.length === 0 && !vista360.loading
                          ? <tr><td colSpan={4} style={{padding:'14px',color:'var(--text4)',fontSize:11,textAlign:'center'}}>Sin ofertas vinculadas</td></tr>
                          : vista360.ofertas.map(o=>{
                            const col = o.estado==='Cerrada' || o.estado==='Desactivada' ? 'tag-gray' : o.estado==='En negociación' ? 'tag-amber' : 'tag-green'
                            return (
                              <tr key={o.id} style={{borderTop:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-oferta',{ofertaRef:o.ref})}>
                                <td style={{padding:'6px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{o.ref}</span></td>
                                <td style={{padding:'6px 12px',fontSize:10,color:'var(--text3)'}}>{o.tipo_operacion || '—'}</td>
                                <td style={{padding:'6px 12px',fontFamily:'var(--mono)',fontSize:10}}>{o.renta_m2 ? `${o.renta_m2} €/m²` : '—'}</td>
                                <td style={{padding:'6px 12px'}}><span className={`tag ${col}`} style={{fontSize:9}}>{o.estado || '—'}</span></td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cuentas presentadas */}
                <div className="va-card" style={{margin:0}}>
                  <div className="va-card-header"><h3>Cuentas presentadas <span style={{fontSize:9,color:'var(--text4)',fontWeight:400,marginLeft:6}}>{vista360.cuentas.length} {vista360.cuentas.length===1?'cuenta':'cuentas'}</span></h3></div>
                  <div style={{padding:'4px 0 14px'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr>{['Cuenta','Dynamics ID'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 12px',fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {vista360.cuentas.length === 0 && !vista360.loading
                          ? <tr><td colSpan={2} style={{padding:'14px',color:'var(--text4)',fontSize:11,textAlign:'center'}}>Sin cuentas presentadas</td></tr>
                          : vista360.cuentas.map(c => (
                            <tr key={c.dynamics_id} style={{borderTop:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('cuentas')}>
                              <td style={{padding:'6px 12px',fontWeight:500}}>{c.nombre}</td>
                              <td style={{padding:'6px 12px',fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{c.dynamics_id}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Demandas vinculadas */}
                <div className="va-card" style={{margin:0}}>
                  <div className="va-card-header"><h3>Demandas vinculadas <span style={{fontSize:9,color:'var(--text4)',fontWeight:400,marginLeft:6}}>{vista360.demandas.length} {vista360.demandas.length===1?'demanda':'demandas'}</span></h3></div>
                  <div style={{padding:'4px 0 14px'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr>{['Ref','Sup','Estado alt.'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 12px',fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {vista360.demandas.length === 0 && !vista360.loading
                          ? <tr><td colSpan={3} style={{padding:'14px',color:'var(--text4)',fontSize:11,textAlign:'center'}}>Sin demandas con este activo en alternativas</td></tr>
                          : vista360.demandas.map(d => {
                            const col = d.estado_alternativa==='ganada' ? 'tag-green' : d.estado_alternativa==='perdida' || d.estado_alternativa==='descartada' ? 'tag-gray' : 'tag-amber'
                            const sup = d.sup_min && d.sup_max ? `${d.sup_min}–${d.sup_max} m²` : d.sup_max ? `${d.sup_max} m²` : '—'
                            return (
                              <tr key={d.id} style={{borderTop:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-demanda',{id:d.id})}>
                                <td style={{padding:'6px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{d.ref}</span></td>
                                <td style={{padding:'6px 12px',fontFamily:'var(--mono)',fontSize:10}}>{sup}</td>
                                <td style={{padding:'6px 12px'}}><span className={`tag ${col}`} style={{fontSize:9}}>{d.estado_alternativa || '—'}</span></td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transacciones */}
                <div className="va-card" style={{margin:0}}>
                  <div className="va-card-header"><h3>Transacciones <span style={{fontSize:9,color:'var(--text4)',fontWeight:400,marginLeft:6}}>{vista360.transacciones.length} {vista360.transacciones.length===1?'deal firmado':'deals firmados'}</span></h3></div>
                  <div style={{padding:'4px 0 14px'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr>{['Ref','Contraparte','Renta cierre','Fecha'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 12px',fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {vista360.transacciones.length === 0 && !vista360.loading
                          ? <tr><td colSpan={4} style={{padding:'14px',color:'var(--text4)',fontSize:11,textAlign:'center'}}>Sin transacciones cerradas</td></tr>
                          : vista360.transacciones.map(t => (
                            <tr key={t.id} style={{borderTop:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-negociacion',{id:t.id})}>
                              <td style={{padding:'6px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{t.ref}</span></td>
                              <td style={{padding:'6px 12px',fontSize:10}}>{t.contraparte_empresa || '—'}</td>
                              <td style={{padding:'6px 12px',fontFamily:'var(--mono)',fontSize:10,color:'var(--green)',fontWeight:600}}>{t.renta_cierre ? `${t.renta_cierre} €/m²` : '—'}</td>
                              <td style={{padding:'6px 12px',fontSize:10,color:'var(--text3)'}}>{t.fecha_cierre ? new Date(t.fecha_cierre).toLocaleDateString('es-ES') : '—'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mandatos */}
                <div className="va-card" style={{margin:0}}>
                  <div className="va-card-header"><h3>Mandatos <span style={{fontSize:9,color:'var(--text4)',fontWeight:400,marginLeft:6}}>{vista360.mandatos.length} {vista360.mandatos.length===1?'mandato':'mandatos'}</span></h3></div>
                  <div style={{padding:'4px 0 14px'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr>{['Ref','Tipo','Vigencia','Estado'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 12px',fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {vista360.mandatos.length === 0 && !vista360.loading
                          ? <tr><td colSpan={4} style={{padding:'14px',color:'var(--text4)',fontSize:11,textAlign:'center'}}>Sin mandatos vinculados</td></tr>
                          : vista360.mandatos.map(m => {
                            const col = m.estado==='en_curso' || m.estado==='En curso' ? 'tag-green' : 'tag-gray'
                            const fi = m.fecha_inicio ? new Date(m.fecha_inicio).toLocaleDateString('es-ES') : '—'
                            const ff = m.fecha_fin    ? new Date(m.fecha_fin).toLocaleDateString('es-ES')    : '—'
                            return (
                              <tr key={m.id} style={{borderTop:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-mandato',{id:m.id})}>
                                <td style={{padding:'6px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{m.ref}</span></td>
                                <td style={{padding:'6px 12px',fontSize:10}}>{m.tipo || '—'}</td>
                                <td style={{padding:'6px 12px',fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{fi} – {ff}</td>
                                <td style={{padding:'6px 12px'}}><span className={`tag ${col}`} style={{fontSize:9}}>{m.estado || '—'}</span></td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Propuestas / Proyectos */}
                <div className="va-card" style={{margin:0}}>
                  <div className="va-card-header"><h3>Propuestas / Proyectos <span style={{fontSize:9,color:'var(--text4)',fontWeight:400,marginLeft:6}}>{vista360.propuestas.length} {vista360.propuestas.length===1?'registro':'registros'}</span></h3></div>
                  <div style={{padding:'4px 0 14px'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr>{['Ref','Tipo','Fees','Estado'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 12px',fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {vista360.propuestas.length === 0 && !vista360.loading
                          ? <tr><td colSpan={4} style={{padding:'14px',color:'var(--text4)',fontSize:11,textAlign:'center'}}>Sin propuestas/proyectos vinculados</td></tr>
                          : vista360.propuestas.map(p => {
                            const col = p.estado==='ganada' ? 'tag-green' : p.estado==='perdida' || p.estado==='cancelada' ? 'tag-gray' : 'tag-blue'
                            return (
                              <tr key={p.id} style={{borderTop:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-propuesta',{id:p.id})}>
                                <td style={{padding:'6px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{p.ref}</span></td>
                                <td style={{padding:'6px 12px',fontSize:10}}>{p.tipo || '—'}</td>
                                <td style={{padding:'6px 12px',fontFamily:'var(--mono)',fontSize:10}}>{p.fees ? `${p.fees.toLocaleString('es-ES')} €` : '—'}</td>
                                <td style={{padding:'6px 12px'}}><span className={`tag ${col}`} style={{fontSize:9}}>{p.estado || '—'}</span></td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pitches vinculados */}
                <div className="va-card" style={{margin:0}}>
                  <div className="va-card-header">
                    <h3>Pitches <span style={{fontSize:9,color:'var(--text4)',fontWeight:400,marginLeft:6}}>{pitchesActivo.length} {pitchesActivo.length===1?'pitch':'pitches'}</span></h3>
                    <button
                      className="tbtn prim"
                      style={{ fontSize:11, padding:'5px 12px' }}
                      onClick={() => navigate('pitch', { activo_ref: activo?.ref, activo_refs: [activo?.ref] })}
                      title="Generar un nuevo pitch con este activo precargado"
                    >+ Crear pitch</button>
                  </div>
                  <div style={{padding:'4px 0 14px'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr>{['Nombre','Autor','Fecha',''].map(h=><th key={h} style={{textAlign:'left',padding:'6px 12px',fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {pitchesActivo.length === 0
                          ? <tr><td colSpan={4} style={{padding:'14px',color:'var(--text4)',fontSize:11,textAlign:'center'}}>Sin pitches vinculados — crea uno con el botón superior</td></tr>
                          : pitchesActivo.map(p => (
                            <tr key={p.id} style={{borderTop:'1px solid var(--border)',cursor: p.url ? 'pointer' : 'default'}} onClick={() => p.url && window.open(p.url, '_blank', 'noopener')}>
                              <td style={{padding:'6px 12px',fontSize:10,fontWeight:600,color:'var(--accent)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:180}} title={p.nombre}>{p.nombre || `Pitch ${p.pitch_external_id || p.id}`}</td>
                              <td style={{padding:'6px 12px',fontSize:10,color:'var(--text3)'}}>{p.autor || '—'}</td>
                              <td style={{padding:'6px 12px',fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : '—'}</td>
                              <td style={{padding:'6px 12px',textAlign:'right'}}>
                                {p.url ? <span style={{fontSize:10,color:'var(--accent)',fontWeight:600}}>Abrir ↗</span> : <span style={{fontSize:10,color:'var(--text4)'}}>—</span>}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div></div>
          )}

          {/* ── TAB: Follow-up — Trazabilidad de cambios ── */}

          {/* ── TAB: Confidencialidad — componente reusable canónico ── */}
          {activeTab==='at-conf' && (
            <ConfidencialidadPanel
              entityLabel="activo"
              confidential={confidential}
              onToggle={setConfidential}
              hiddenFields={['Dirección y ubicación','Datos urbanísticos','Stacking plan','Arrendatarios','Documentación','Valoraciones']}
              visibleFields={['Cuenta-propietario','Tipo de activo','Estado de mercado','Equipo','Zona y ciudad']}
              authorizedUsers={authorizedUsers}
              onAddUser={(newUser) => {
                const [name, team] = [newUser.split('·')[0].trim(), newUser.split('·')[1]?.trim() || '']
                const ini = name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                const today = new Date().toLocaleDateString('es-ES')
                setAuthorizedUsers(prev => [...prev, { name, team, role:'Autorizado', initials:ini, bg:'#f0fdf4', color:'#166534', granted:today }])
              }}
              onRemoveUser={(idx) => setAuthorizedUsers(prev => prev.filter((_,j) => j !== idx))}
              responsable="Sierra Álvaro"
              traza={[
                { color:'var(--green)',  msg:'Sierra Álvaro creó la ficha del activo', date:'01/02/2024 · 09:00' },
                { color:'var(--accent)', msg:'GOMEZ Ignacio recibió acceso',           date:'12/03/2026 · 14:22' },
              ]}
            />
          )}

        </div>{/* /ficha-main */}

        <RightPanel navigate={navigate} nEdificios={liveEdifCount ?? activo?.n_edificios ?? 1} nPropietarios={liveOwnerCount} plazas={plazas} esg={esg} activo={activo} arrendatariosReg={arrendatariosReg}/>

      </div>{/* /ficha-wrap */}

      {/* Modal: Notas internas — registro persistente para no preguntar lo mismo dos veces */}
      {showNotasModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setShowNotasModal(false)}>
          <div style={{background:'#fff',borderRadius:10,width:'min(560px,100%)',maxHeight:'80vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 12px 32px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,fontSize:14,fontWeight:700}}><StickyNote size={16} strokeWidth={1.75}/> Notas internas · {displayNombre ?? activo?.nombre ?? 'Activo'}</div>
              <button onClick={()=>setShowNotasModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,display:'flex'}}><XClose size={16}/></button>
            </div>
            <div style={{padding:'12px 18px',borderBottom:'1px solid var(--border)',background:'var(--gray-lt)'}}>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>Las notas quedan registradas para que nadie pregunte lo mismo dos veces. Visibles para el equipo de trabajo.</div>
              <div style={{display:'flex',gap:8}}>
                <input className="of-inp" style={{flex:1}} placeholder="Escribe una nota…" value={nuevaNota} onChange={e=>setNuevaNota(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && nuevaNota.trim()){ setNotasInternas(p=>[{id:Date.now(),autor:'Sierra Álvaro',fecha:new Date().toLocaleDateString('es-ES'),texto:nuevaNota.trim()},...p]); setNuevaNota('') } }}/>
                <button className="tbtn prim" onClick={()=>{ if(!nuevaNota.trim())return; setNotasInternas(p=>[{id:Date.now(),autor:'Sierra Álvaro',fecha:new Date().toLocaleDateString('es-ES'),texto:nuevaNota.trim()},...p]); setNuevaNota('') }}>Guardar</button>
              </div>
            </div>
            <div style={{overflowY:'auto',padding:'10px 18px 16px'}}>
              {notasInternas.length === 0
                ? <div style={{padding:20,textAlign:'center',color:'var(--text4)',fontSize:12}}>Aún no hay notas registradas.</div>
                : notasInternas.map(n=>(
                  <div key={n.id} style={{padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                    <div style={{fontSize:13,color:'var(--text)',lineHeight:1.45,marginBottom:4}}>{n.texto}</div>
                    <div style={{fontSize:10,color:'var(--text4)'}}>{n.autor} · {n.fecha}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Datos INE de la zona */}
      {showIneModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setShowIneModal(false)}>
          <div style={{background:'#fff',borderRadius:10,width:'min(640px,100%)',maxHeight:'80vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 12px 32px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,fontSize:14,fontWeight:700}}><BarChart3 size={16} strokeWidth={1.75}/> Datos INE · {activo?.zona || 'Zona'} · {activo?.ciudad || ''}</div>
              <button onClick={()=>setShowIneModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,display:'flex'}}><XClose size={16}/></button>
            </div>
            <div style={{padding:'16px 18px',overflowY:'auto'}}>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:14}}>Indicadores socioeconómicos de la zona obtenidos del Instituto Nacional de Estadística. Datos del último censo disponible.</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[
                  { k:'Población', v:'168.420 hab.' },
                  { k:'Renta media bruta', v:'34.180 €/año' },
                  { k:'Tasa de paro', v:'8,2 %' },
                  { k:'Densidad', v:'4.520 hab/km²' },
                  { k:'Edad media', v:'42,1 años' },
                  { k:'Hogares unipersonales', v:'28,5 %' },
                  { k:'Empresas activas', v:'12.350' },
                  { k:'PIB municipal', v:'5,8 mil M€' },
                ].map(r => (
                  <div key={r.k} style={{padding:'10px 12px',background:'var(--gray-lt)',borderRadius:6}}>
                    <div style={{fontSize:10,color:'var(--text4)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:2}}>{r.k}</div>
                    <div style={{fontSize:15,fontWeight:700,color:'var(--text)',fontVariantNumeric:'tabular-nums'}}>{r.v}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,padding:'8px 12px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:6,fontSize:10,color:'var(--accent)'}}>Fuente: INE · datos cacheados localmente. Cuando se conecte la API del INE, este modal se llenará en tiempo real con la geo del activo.</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: alta rápida de propietario desde stacking (con lupa cuenta) */}
      {showAltaPropietario && (
        <AltaPropietarioModal
          activoRef={activo?.ref}
          onClose={() => setShowAltaPropietario(false)}
          onSave={handlePropietarioCreado}
        />
      )}

      {/* Modal: alta rápida de arrendatario desde stacking (con lupa cuenta) */}
      {showAltaArrendatario && (
        <AltaArrendatarioModal
          activoRef={activo?.ref}
          onClose={() => setShowAltaArrendatario(false)}
          onSave={handleArrendatarioCreado}
        />
      )}

      {showTarea && <AsignarTareaModal refTipo="Activo" refNombre="P.E Avalon" onClose={() => setShowTarea(false)} />}
      {bajaArr && (
        <BajaArrendatarioModal
          arrendatario={{
            ref:        bajaArr.unit.arr_ref || null,
            nombre:     bajaArr.unit.n,
            sup:        bajaArr.unit.sup,
            activo_ref: activo?.ref,
          }}
          activo={activo ? {
            id:                  activo.id,
            ref:                 activo.ref,
            nombre:              activo.nombre || activo.direccion,
            dynamics_account_id: activo.dynamics_account_id,
            portfolio_id:        activo.portfolio_id,
            uso:                 activo.uso || 'Oficinas',
          } : null}
          onClose={() => setBajaArr(null)}
          onSuccess={() => {
            try { bajaArr.doRemove() } catch (e) {}
            setBajaArr(null)
          }}
        />
      )}
      {salidaArr && (
        <SalidaArrendatarioModal
          arrendatario={{
            ref:           salidaArr.unit.arr_ref,
            nombre:        salidaArr.unit.n,
            activo_ref:    activo?.ref,
            activo_nombre: activo?.nombre || displayNombre || '',
          }}
          onClose={() => setSalidaArr(null)}
          onSuccess={() => {
            try { salidaArr.doRemove() } catch (e) {}
            // Quita el chip del panel lateral al instante (no esperar reload)
            setArrendatariosReg(prev => prev.filter(a =>
              salidaArr.unit.arr_ref
                ? a.ref !== salidaArr.unit.arr_ref
                : a.tenant !== salidaArr.unit.n
            ))
            setSalidaArr(null)
          }}
        />
      )}
      {salidaProp && (
        <SalidaPropietarioModal
          propietario={{
            id:            salidaProp.unit.prop_id || null,
            propietario:   salidaProp.unit.n,
            activo_ref:    activo?.ref,
            activo_nombre: activo?.nombre || displayNombre || '',
          }}
          footprintCount={salidaProp.footprintCount}
          floorLabel={salidaProp.floorId}
          edifId={salidaProp.edifId}
          floorId={salidaProp.floorId}
          ownerSupTotal={salidaProp.ownerSupTotal}
          tramoSup={salidaProp.tramoSup}
          onClose={() => setSalidaProp(null)}
          onSuccess={({ scope, desconocidoId, desconocidoName } = {}) => {
            // Sustituye en memoria por la identidad «Propietario desconocido N»
            // creada (id+nombre propios). La BD ya la actualizó el modal; el
            // autosave persiste lo mismo.
            try { salidaProp.doSubstitute(scope || 'all', desconocidoId, desconocidoName) } catch (e) {}
            // Si vendió TODA su superficie, quita su chip del panel. prop_id puede
            // ser un id sintético LEGACY-… (no uuid) → filtramos por nombre.
            if ((scope || 'all') === 'all') {
              const pid = salidaProp.unit.prop_id
              const isUuidPid = typeof pid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pid)
              setPropietariosReg(prev => prev.filter(p =>
                isUuidPid ? p.id !== pid : p.propietario !== salidaProp.unit.n
              ))
            }
            setSalidaProp(null)
          }}
        />
      )}
      {salidaOfr && (
        <SalidaOfertaModal
          oferta={{
            nombre: salidaOfr.unit.oferta,
            sup:    salidaOfr.unit.sup,
            renta:  salidaOfr.unit.renta,
          }}
          activo={activo ? {
            ref:    activo.ref,
            nombre: activo.nombre || displayNombre || '',
            uso:    activo.uso,
          } : null}
          onClose={() => setSalidaOfr(null)}
          onSuccess={({ motivo, arrendatario }) => {
            try { salidaOfr.doRemove() } catch (e) {}
            // La oferta nunca se borra: pasa a Cerrada (alquilada) o Desactivada
            // (error). Así desaparece del panel y queda en su módulo.
            const ofName = salidaOfr.unit.oferta
            const ofRow = (ofertas || []).find(o => o.ref === ofName || (o.nombre || o.ref) === ofName)
            if (ofRow?.id) {
              const nuevoEstado = motivo === 'cierre' ? 'Cerrada' : 'Desactivada'
              supabase.from('ofertas').update({ estado: nuevoEstado, activa: false }).eq('id', ofRow.id)
              setOfertas(prev => prev.filter(o => o.id !== ofRow.id))
            }
            // Si fue 'cierre', el nuevo arrendatario se añade al panel y
            // se reemplaza la unit 'vac' por una 'ten' en el stacking.
            if (motivo === 'cierre' && arrendatario) {
              setArrendatariosReg(prev => [...prev, {
                id: arrendatario.id,
                ref: arrendatario.ref,
                tenant: arrendatario.tenant,
                activo_ref: arrendatario.activo_ref,
              }])
              // Re-inyecta una unit 'ten' en la planta exacta donde estaba
              // la oferta — mejor que perderla.
              setLiveBuildings(prev => (prev || []).map(b => ({
                ...b,
                arr: (b.arr || []).map(row => row.p !== salidaOfr.floorId ? row : ({
                  ...row,
                  units: [...row.units, {
                    type: 'ten',
                    arr_ref: arrendatario.ref,
                    n: arrendatario.tenant,
                    sup: salidaOfr.unit.sup,
                  }],
                })),
              })))
            }
            setSalidaOfr(null)
          }}
        />
      )}
      {showSubstConfirm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'var(--surface)',borderRadius:'var(--r2)',width:'100%',maxWidth:520,boxShadow:'0 20px 60px rgba(0,0,0,.3)',overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Añadir propietario al activo</div>
              <div style={{fontSize:12,color:'var(--text3)',lineHeight:1.6}}>
                Este activo ya tiene {propietariosReg.length > 1 ? `${propietariosReg.length} propietarios asignados` : 'un propietario asignado'}:
                <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:4}}>
                  {(propietariosReg.length > 0 ? propietariosReg : (activo?.propietario ? [{ propietario: activo.propietario }] : [])).map((p,i) => (
                    <span key={i} style={{padding:'6px 10px',background:'var(--gray-lt)',borderRadius:5,fontWeight:600,color:'var(--text2)',fontSize:12}}>{p.propietario}</span>
                  ))}
                </div>
                <div style={{marginTop:12,fontSize:12,color:'var(--text2)',fontWeight:600}}>¿Qué quieres hacer?</div>
              </div>
            </div>
            <div style={{padding:'14px 20px',display:'flex',flexDirection:'column',gap:10}}>
              {/* Opción A: propietario adicional (co-propiedad) */}
              <button
                onClick={()=>{ setShowSubstConfirm(false); setShowAltaPropietario(true) }}
                style={{textAlign:'left',padding:'12px 14px',border:'1px solid var(--border)',borderRadius:6,background:'var(--surface)',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:3}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <span style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>Propietario adicional (co-propiedad)</span>
                <span style={{fontSize:11,color:'var(--text3)',lineHeight:1.4}}>El propietario actual sigue activo. El nuevo se añade y comparte el activo según la superficie que asignes en el stacking.</span>
              </button>
              {/* Opción B: sustitución (el anterior va al histórico) */}
              <button
                onClick={()=>{ setShowSubstConfirm(false); navigateToFichaProp(true) }}
                style={{textAlign:'left',padding:'12px 14px',border:'1px solid var(--border)',borderRadius:6,background:'var(--surface)',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:3}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <span style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>Sustituir propietario actual</span>
                <span style={{fontSize:11,color:'var(--text3)',lineHeight:1.4}}>El propietario anterior pasa al histórico con fecha de salida de hoy. El nuevo lo reemplaza por completo en el stacking.</span>
              </button>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',padding:'10px 20px 14px',borderTop:'1px solid var(--border)'}}>
              <button onClick={()=>setShowSubstConfirm(false)} style={{padding:'7px 16px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
