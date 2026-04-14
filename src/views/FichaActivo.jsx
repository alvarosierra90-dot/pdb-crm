import { useState, useEffect, useRef } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'
import { BUILDINGS_BY_ACTIVO } from '../data/stackingData'
import { supabase } from '../lib/supabase'

const USO_PREFIX_FA    = { 'Oficinas':'OF', 'Logístico':'LG', 'Retail':'RT', 'Data Center':'DC', 'Residencial':'RS', 'Hoteles':'HT', 'Suelo':'SU' }
const CIUDAD_PREFIX_FA = { 'Madrid':'MAD', 'Barcelona':'BCN', 'Valencia':'VLC', 'Sevilla':'SEV', 'Bilbao':'BIL', 'Guadalajara':'GUA' }
function genRefFA(ciudad, uso) {
  const cp = CIUDAD_PREFIX_FA[ciudad] || ciudad.slice(0,3).toUpperCase()
  const up = USO_PREFIX_FA[uso] || 'XX'
  const num = String(Math.floor(Math.random()*90000)+10000)
  return `${cp}-${up}-${num}`
}
const CUENTAS_FA = ['Colonial SOCIMI','Merlin Properties','GMP','Barings Real Estate','Allianz Real Estate','Prologis','CBRE Investment Management','Grosvenor','IBA Capital','Neinor Homes','Axa IM Real Assets','Blackstone','Brookfield']
const USO_ICO    = { 'Oficinas':'🏢', 'Logístico':'🏭', 'Retail':'🛍', 'Data Center':'🖥', 'Residencial':'🏘', 'Hoteles':'🏨', 'Suelo':'🟫' }

/* ── ZONAS por USO y CIUDAD (área → zona → subzona) ── */
const ZONES = {
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
function getZoneData(ciudad, uso) { const c = CITY_NORMALIZE[ciudad] || ciudad; return (ZONES[uso]||{})[c] || [] }
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
  'Logístico': [
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
  'Retail': [
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
  'Centro comercial': [
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
  'Hoteles': [
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
const ESTADOS_CONSTRUCCION = ['Cambio de uso en trámite','Construcción existente','En construcción','En demolición','En rehabilitación','LC + ICO obtenidos','LC + ICO solicitados','Licencia de construcción','Licencia primera ocupación','Llave en mano','Nueva construcción / Obra nueva','Proyecto','Rehabilitación integral','Rehabilitación parcial']
const USOS_PRINCIPALES = ['Build to Rent','Aparcamiento','Apartamentos turísticos','Build to Sell','Care homes','Trastero','Flex Living','Hotel','Industrial','Logística','Oficinas','Residencial','Retail','Senior Living']
const CALIDADES = ['A+','A','B+','B','C','D']

const NEW_FORM_INIT = {
  nombre:'', direccion:'', ciudad:'Madrid', pais:'España', cp:'',
  area:'', zona:'', subzona:'',
  tipo_activo:'Edificio', estado_construccion:'Construcción existente',
  uso:'Oficinas', uso_secundario:'', calidad:'A',
  propietario:'', asset_manager:'',
  sba:'', anno_construccion:'', anno_rehabilitacion:'',
  ref_catastral:'', clasificacion:'', uso_pgou:'', calificacion_urb:'', edificabilidad:'', sup_parcela:'',
}

const TABS = ['at-info','at-stacking','at-caract','at-prop','at-fotos','at-docs','at-adicional','at-360','at-followup']
const TAB_LABELS = ['Información general','Stacking Plan','Características','Propietarios y arrendatarios','Multimedia','Documentos','Información adicional','Vista 360°','Follow-up']

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
  {id:'oficinas',    label:'Oficinas',    cls:'u-of',  color:'#3b82f6', bg:'#dbeafe', bd:'#93c5fd'},
  {id:'retail',      label:'Retail',      cls:'u-rt',  color:'#ec4899', bg:'#fce7f3', bd:'#fbcfe8'},
  {id:'logistico',   label:'Logístico',   cls:'u-log', color:'#f97316', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'residencial', label:'Residencial', cls:'u-res', color:'#8b5cf6', bg:'#ede9fe', bd:'#c4b5fd'},
  {id:'hotel',       label:'Hotel',       cls:'u-hot', color:'#14b8a6', bg:'#ccfbf1', bd:'#99f6e4'},
  {id:'comun',       label:'Zona común',  cls:'u-com', color:'#22c55e', bg:'#dcfce7', bd:'#86efac'},
  {id:'parking',     label:'Parking',     cls:'u-pk',  color:'#94a3b8', bg:'#f1f5f9', bd:'#cbd5e1'},
]

/* ── USOS ADICIONALES ── */
const UA_ALL = [
  {id:'recepcion',      label:'Recepción',          attr:true, color:'#7c3aed', bg:'#ede9fe', bd:'#c4b5fd'},
  {id:'nucleo_com',     label:'Núcleos comunic.',   attr:true, color:'#6366f1', bg:'#e0e7ff', bd:'#a5b4fc'},
  {id:'instalaciones',  label:'Instalaciones',      attr:true, color:'#64748b', bg:'#f1f5f9', bd:'#cbd5e1'},
  {id:'seguridad',      label:'Seguridad 24h',      attr:true, color:'#dc2626', bg:'#fee2e2', bd:'#fca5a5'},
  {id:'ct',             label:'C. Transformación',  attr:true, color:'#9ca3af', bg:'#f9fafb', bd:'#e5e7eb'},
  {id:'parking_gen',    label:'Parking',             sup:true,  color:'#475569', bg:'#f1f5f9', bd:'#94a3b8'},
  {id:'trasteros',      label:'Trasteros',           sup:true,  color:'#78716c', bg:'#fafaf9', bd:'#d6d3d1'},
  {id:'archivo',        label:'Archivo / Almacén',  sup:true,  color:'#92400e', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'vestuarios',     label:'Vestuarios',          sup:true,  color:'#9d174d', bg:'#fdf2f8', bd:'#f9a8d4'},
  {id:'comedor',        label:'Comedor',             sup:true,  color:'#d97706', bg:'#fffbeb', bd:'#fde68a'},
  {id:'auditorio',      label:'Auditorio',           sup:true,  color:'#7c3aed', bg:'#ede9fe', bd:'#c4b5fd'},
  {id:'salas_reunion',  label:'Salas reuniones',     sup:true,  color:'#0284c7', bg:'#e0f2fe', bd:'#7dd3fc'},
  {id:'gimnasio',       label:'Gimnasio',            sup:true,  color:'#059669', bg:'#ecfdf5', bd:'#6ee7b7'},
  {id:'terraza',        label:'Terraza / Jardín',    sup:true,  color:'#65a30d', bg:'#f7fee7', bd:'#bef264'},
  {id:'rooftop',        label:'Rooftop',             attr:true, color:'#0d9488', bg:'#f0fdfa', bd:'#99f6e4'},
  {id:'piscina',        label:'Piscina',             sup:true,  color:'#0891b2', bg:'#ecfeff', bd:'#67e8f9'},
  {id:'playa_maniobras',label:'Playa maniobras',     sup:true,  color:'#c2410c', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'muelles_carga',  label:'Muelles de carga',    sup:true,  color:'#b45309', bg:'#fefce8', bd:'#fde68a'},
  {id:'cross_docking',  label:'Cross-docking',       sup:true,  color:'#7c2d12', bg:'#fff1f2', bd:'#fecdd3'},
  {id:'camaras_frigo',  label:'Cámaras frigoríficas',sup:true,  color:'#1d4ed8', bg:'#eff6ff', bd:'#bfdbfe'},
  {id:'pk_camiones',    label:'Parking camiones',    sup:true,  color:'#374151', bg:'#f9fafb', bd:'#e5e7eb'},
  {id:'lobby',          label:'Lobby hotel',         sup:true,  color:'#b45309', bg:'#fffbeb', bd:'#fde68a'},
  {id:'spa',            label:'Spa / Wellness',      sup:true,  color:'#be185d', bg:'#fdf2f8', bd:'#fbcfe8'},
  {id:'salas_eventos',  label:'Salas de eventos',    sup:true,  color:'#6d28d9', bg:'#f5f3ff', bd:'#ddd6fe'},
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
      {p:'P5',sup:1500,units:[{type:'ten',n:'Celonis',sup:1202,brk:'Oct 2025',brkColor:'var(--amber)'},{type:'vac',oferta:'OLB001',sup:298}]},
      {p:'P4',sup:1500,units:[{type:'ten',n:'Celonis',sup:1500,brk:'Oct 2025',brkColor:'var(--amber)'}]},
      {p:'P3',sup:1500,units:[{type:'ten',n:'Repsol',sup:767,brk:'Jun 2027',brkColor:'var(--green)'},{type:'vac',oferta:'OLB002',sup:733}]},
      {p:'P2',sup:1500,units:[{type:'ten',n:'Repsol',sup:1200,brk:'Jun 2027',brkColor:'var(--green)'},{type:'vac',oferta:'OLB002',sup:300}]},
      {p:'P1',sup:1500,units:[{type:'ten',n:'Desconocido',sup:1500,brk:'Ene 2026',brkColor:'var(--red)'}]},
      {p:'PB',sup:1500,units:[{type:'rt',n:'Cafetería',sup:380,brk:'Ene 2029',brkColor:'var(--text4)'},{type:'com',n:'Hall / Común',sup:220},{type:'vac',oferta:'OLB001',sup:900}]},
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

// Ofertas activas vinculadas a este activo (en producción vendrían del estado global)
const OFERTAS_ACTIVAS = [
  { ref:'OLB001', contraparte:'Celonis',         sup:698,   estado:'En curso',  color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  { ref:'OLB002', contraparte:'Repsol Exp.',     sup:1033,  estado:'En curso',  color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
  { ref:'OLB003', contraparte:'Oracle Spain SL', sup:13486, estado:'Finalista', color:'#7c3aed', bg:'#faf5ff', border:'#e9d5ff' },
]

function StackingPlan({ initBuildings, onCountChange }) {
  const [buildings, setBuildings]       = useState(initBuildings !== undefined ? initBuildings : INIT_BUILDINGS)
  const [edifId, setEdifId]             = useState(initBuildings?.length > 0 ? initBuildings[0].id : 'A')
  const [setupForm, setSetupForm]       = useState({ label:'', sobre:'5', bajo:'1', sup:'1500' })
  const [view, setView]                 = useState('principal')
  const [dragging, setDragging]         = useState(null)
  const [dragTarget, setDragTarget]     = useState(null)
  const [editFloor, setEditFloor]       = useState(null) // {floorId, idx, layer}
  const [editSup, setEditSup]           = useState('')
  const [selectedFloors, setSelectedFloors] = useState([])
  const [showCreate, setShowCreate]     = useState(false)
  const [newBldg, setNewBldg]           = useState({label:'',sup:'',sobre:'',bajo:''})
  const [splitModal, setSplitModal]     = useState(null) // {floorId, usoId}
  const [splitSup, setSplitSup]         = useState('')
  const [ppOpen, setPpOpen]             = useState(true)
  const [uaOpen, setUaOpen]             = useState(true)
  const [editPA, setEditPA]             = useState(null)  // {layer:'prop'|'arr', rowP, idx}
  const [editPASup, setEditPASup]       = useState('')
  const [editFloorSup, setEditFloorSup]       = useState(null) // floorId — editable only from principal view
  const [editFloorSupVal, setEditFloorSupVal] = useState('')

  // Notify parent when building count changes
  useEffect(() => { if (onCountChange) onCountChange(buildings.length) }, [buildings.length])

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
    updBuilding(b=>({...b, floors:b.floors.map(f=>{
      if(f.id!==floorId) return f
      const arr=[...f[layer]]; arr.splice(idx,1)
      return {...f,[layer]:arr}
    })}))
  }

  const savePASup = () => {
    if(!editPA) return
    const val = parseFloat(editPASup)
    if(isNaN(val)||val<=0) return
    updBuilding(b=>({...b, [editPA.layer]: b[editPA.layer].map(row=>{
      if(row.p!==editPA.rowP) return row
      const units=[...row.units]
      units[editPA.idx]={...units[editPA.idx], sup:val}
      return {...row, units}
    })}))
    setEditPA(null); setEditPASup('')
  }

  const saveFloorSup = () => {
    if(!editFloorSup) return
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
    selectedFloors.forEach(fId=>assignPrincipal(fId,usoId))
    setSelectedFloors([])
  }

  const createBuilding = () => {
    const sobre=parseInt(newBldg.sobre)||0, bajo=parseInt(newBldg.bajo)||0
    const sup=parseFloat(newBldg.sup)||1500
    const floors=[]
    for(let i=sobre;i>=1;i--) floors.push({id:`P${i}`,sup,principal:[],adicional:[]})
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
    const label = setupForm.label.trim() || 'Edificio A'
    const sobre = Math.max(1, parseInt(setupForm.sobre) || 1)
    const bajo  = Math.max(0, parseInt(setupForm.bajo)  || 0)
    const sup   = Math.max(100, parseFloat(setupForm.sup) || 1000)
    const floors = []
    for (let i = sobre; i >= 1; i--) floors.push({ id: `P${i}`, sup, principal: [], adicional: [] })
    floors.push({ id: 'PB', sup, principal: [], adicional: [] })
    for (let i = 1; i <= bajo; i++) floors.push({ id: `S${i}`, sup, principal: [], adicional: [] })
    const id = 'A'
    setBuildings([{ id, label, supPlantaTipo: sup, floors, prop: floors.map(f=>({p:f.id,sup,units:[]})), arr: floors.map(f=>({p:f.id,sup,units:[]})) }])
    setEdifId(id)
  }

  if (buildings.length === 0) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 24px',gap:20}}>
      <div style={{fontSize:32}}>🏗</div>
      <div style={{fontSize:14,fontWeight:600,color:'var(--text1)'}}>Configura el stacking plan</div>
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
    <div>
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

      {/* Vista sub-tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',marginLeft:-24,marginRight:-24,paddingLeft:24}}>
        {[['principal','Uso principal'],['prop','Propietarios'],['arr','Arrendatarios y oferta']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={vTab(k)}>{l}</button>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:1,background:'var(--border)',marginLeft:-24,marginRight:-24,marginBottom:12}}>
        {[
          {lbl:'SBA TOTAL',   val:`${totalSup.toLocaleString('es-ES')} m²`,    sub:'Superficie bruta alquilable', col:'var(--text1)'},
          {lbl:'ASIGNADO',    val:`${assignedSup.toLocaleString('es-ES')} m²`, sub:'Uso principal definido',       col:occPct===100?'var(--green)':'var(--accent)'},
          {lbl:'SIN ASIGNAR', val:`${(totalSup-assignedSup).toLocaleString('es-ES')} m²`, sub:'Pendiente de definir', col:(totalSup-assignedSup)===0?'var(--green)':'var(--amber)'},
          {lbl:'COBERTURA',   val:`${occPct}%`,                                sub:'Usos definidos sobre total',   col:occPct===100?'var(--green)':occPct>50?'var(--amber)':'var(--red)'},
        ].map(s=>(
          <div key={s.lbl} style={{background:'var(--surface)',padding:'9px 14px'}}>
            <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>{s.lbl}</div>
            <div style={{fontSize:16,fontWeight:700,color:s.col,fontFamily:'var(--mono)'}}>{s.val}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ══ USO PRINCIPAL ══ */}
      {view==='principal' && (
        <div style={{display:'flex',gap:16}}>

          {/* ── SIDEBAR ── */}
          <div style={{width:160,flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>

            {/* SECCIÓN: Usos principales */}
            <div style={{marginBottom:4}}>
              <div
                onClick={()=>setPpOpen(v=>!v)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'5px 2px',userSelect:'none'}}
              >
                <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Usos principales</span>
                <span style={{fontSize:11,color:'var(--text4)',transition:'transform .2s',display:'inline-block',transform:ppOpen?'rotate(0deg)':'rotate(-90deg)'}}>▾</span>
              </div>
              {ppOpen && (
                <div style={{maxHeight:210,overflowY:'auto',paddingRight:2}}>
                  {USOS_PPAL.map(u=>(
                    <div key={u.id} draggable
                      onDragStart={()=>setDragging(u.id)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{
                        display:'flex',alignItems:'center',gap:7,padding:'6px 9px',marginBottom:4,
                        borderRadius:6,cursor:'grab',userSelect:'none',
                        border:`1px solid ${dragging===u.id?u.color:u.bd}`,background:u.bg,
                        opacity:dragging&&dragging!==u.id?.4:1,
                        boxShadow:dragging===u.id?`0 2px 8px ${u.color}55`:'none',
                        transform:dragging===u.id?'scale(1.02)':'scale(1)',
                        transition:'opacity .15s,transform .1s,box-shadow .1s',
                      }}
                    >
                      <div style={{width:9,height:9,borderRadius:2,background:u.color,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:u.color}}>{u.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN: Usos adicionales */}
            <div>
              <div
                onClick={()=>setUaOpen(v=>!v)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'5px 2px',userSelect:'none',borderTop:'1px solid var(--border)',marginTop:4,paddingTop:8}}
              >
                <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Usos adicionales</span>
                <span style={{fontSize:11,color:'var(--text4)',transition:'transform .2s',display:'inline-block',transform:uaOpen?'rotate(0deg)':'rotate(-90deg)'}}>▾</span>
              </div>
              {uaOpen && (
                <div style={{maxHeight:260,overflowY:'auto',paddingRight:2}}>
                  {availableUA.length===0 ? (
                    <div style={{fontSize:10,color:'var(--text4)',padding:'6px 0',lineHeight:1.4}}>Asigna primero usos principales</div>
                  ) : availableUA.map(ua=>(
                    <div key={ua.id} draggable
                      onDragStart={()=>setDragging(ua.id)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{
                        display:'flex',alignItems:'center',gap:6,padding:'5px 9px',marginBottom:3,
                        borderRadius:5,cursor:'grab',userSelect:'none',
                        border:`1px solid ${dragging===ua.id?ua.color:ua.bd}`,background:ua.bg,
                        opacity:dragging&&dragging!==ua.id?.4:1,
                        boxShadow:dragging===ua.id?`0 2px 8px ${ua.color}44`:'none',
                        transition:'opacity .15s,box-shadow .1s',
                      }}
                    >
                      <div style={{width:8,height:8,borderRadius:2,background:ua.color,flexShrink:0}}/>
                      <span style={{fontSize:10,fontWeight:600,color:ua.color,flex:1}}>{ua.label}</span>
                      <span style={{fontSize:8,padding:'1px 3px',borderRadius:2,fontWeight:700,flexShrink:0,
                        background:ua.attr?'#ede9fe':'#f0fdf4',color:ua.attr?'#7c3aed':'#16a34a'}}>{ua.attr?'A':'S'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Asignación masiva */}
            {selectedFloors.length>0 && (
              <div style={{marginTop:10,padding:10,background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:6}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--accent)',marginBottom:6}}>
                  {selectedFloors.length} planta{selectedFloors.length>1?'s':''} sel.
                </div>
                <div style={{maxHeight:160,overflowY:'auto'}}>
                  {USOS_PPAL.map(u=>(
                    <button key={u.id} onClick={()=>bulkAssign(u.id)}
                      style={{display:'block',width:'100%',padding:'4px 8px',marginBottom:3,
                        background:u.bg,color:u.color,border:`1px solid ${u.bd}`,
                        borderRadius:4,fontSize:10,cursor:'pointer',fontFamily:'inherit',textAlign:'left',fontWeight:600}}>
                      {u.label}
                    </button>
                  ))}
                </div>
                <button onClick={()=>setSelectedFloors([])}
                  style={{display:'block',width:'100%',padding:'4px 8px',marginTop:4,
                    background:'none',color:'var(--text4)',border:'1px solid var(--border)',
                    borderRadius:4,fontSize:10,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* ── GRID PLANTAS ── */}
          <div style={{flex:1,minWidth:0}}>
            {/* Cabecera */}
            <div style={{display:'grid',gridTemplateColumns:'22px 52px 1fr 90px',background:'var(--gray-lt)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
              <div style={{padding:'5px 4px'}}/>
              <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Planta</div>
              <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Uso principal + Usos adicionales</div>
              <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',textAlign:'right'}}>Sup. total</div>
            </div>

            {edif.floors.map(floor=>{
              const used  = floor.principal.reduce((s,u)=>s+u.sup,0)
              const avail = floor.sup-used
              const isTgt = dragTarget===floor.id
              const isSel = selectedFloors.includes(floor.id)
              const hasAdic = floor.adicional.length>0
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
                    const used2=floor.principal.reduce((s,u)=>s+u.sup,0)
                    const avail2=floor.sup-used2
                    if(isUA && avail2<=0){ assignAdicional(floor.id,dragging); setDragging(null); return }
                    if(avail2<=0){ setSplitModal({floorId:floor.id,usoId:dragging}); setSplitSup('') }
                    else{ assignPrincipal(floor.id,dragging,avail2) }
                    setDragging(null)
                  }}
                  style={{
                    display:'grid',gridTemplateColumns:'22px 52px 1fr 90px',
                    borderBottom: isPB ? '3px solid var(--text3)' : '1px solid var(--border)',
                    background:isTgt?'#eff6ff':isSel?'#f0f9ff':'var(--surface)',
                    outline:isTgt?'1.5px solid var(--accent)':'none',
                    transition:'background .1s',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',paddingTop:4}}>
                    <input type="checkbox" checked={isSel}
                      onChange={()=>setSelectedFloors(p=>p.includes(floor.id)?p.filter(x=>x!==floor.id):[...p,floor.id])}
                      style={{width:11,height:11,cursor:'pointer'}}/>
                  </div>

                  {/* Label planta */}
                  <div style={{padding:'6px 8px',fontSize:12,fontWeight:700,color:'var(--text3)',display:'flex',alignItems:'flex-start',paddingTop:10}}>{floor.id}</div>

                  {/* Columna central: uso principal + adicionales */}
                  <div style={{padding:'4px 4px 4px 0',display:'flex',flexDirection:'column',gap:4}}>

                    {/* Fila 1: barras de uso principal */}
                    <div style={{display:'flex',alignItems:'stretch',gap:2,height:32}}>
                      {floor.principal.length===0 ? (
                        <div style={{flex:1,background:isTgt?'var(--accent-lt)':'var(--gray-lt)',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:isTgt?'var(--accent)':'var(--text4)',fontWeight:isTgt?600:400}}>
                          {isTgt?'⬇ Soltar uso aquí':'Sin uso asignado — arrastra un uso'}
                        </div>
                      ) : (
                        <>
                          {floor.principal.map((u,i)=>{
                            const info = usoInfo(u.uso)
                            const wpct = `${(u.sup/floor.sup)*100}%`
                            const isEd = editFloor?.floorId===floor.id && editFloor?.idx===i && editFloor?.layer==='principal'
                            return (
                              <div key={i}
                                title={`${info.label} · ${u.sup.toLocaleString('es-ES')} m²`}
                                onClick={()=>{if(isEd)setEditFloor(null);else{setEditFloor({floorId:floor.id,idx:i,layer:'principal'});setEditSup(String(u.sup))}}}
                                style={{width:wpct,background:info.bg,border:`1px solid ${info.bd}`,borderRadius:4,
                                  display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
                                  flexShrink:0,overflow:'hidden',transition:'filter .1s'}}
                              >
                                {isEd ? (
                                  <div style={{display:'flex',gap:3,padding:'0 4px'}} onClick={e=>e.stopPropagation()}>
                                    <input type="number" value={editSup} onChange={e=>setEditSup(e.target.value)} autoFocus
                                      onKeyDown={e=>{if(e.key==='Enter')saveSup();if(e.key==='Escape')setEditFloor(null)}}
                                      style={{width:52,padding:'2px 4px',fontSize:9,border:`1px solid ${info.color}`,borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                    <button onClick={saveSup} style={{padding:'2px 4px',background:info.color,color:'#fff',border:'none',borderRadius:3,fontSize:8,cursor:'pointer'}}>✓</button>
                                    <button onClick={()=>removeItem(floor.id,i,'principal')} style={{padding:'2px 4px',background:'#fee2e2',color:'#dc2626',border:'1px solid #fca5a5',borderRadius:3,fontSize:8,cursor:'pointer'}}>✕</button>
                                  </div>
                                ) : (
                                  <span style={{fontSize:9,fontWeight:700,color:info.color,padding:'0 5px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>
                                    {info.label}{u.sup>=200?` · ${u.sup.toLocaleString('es-ES')} m²`:''}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                          {avail>0 && (
                            <div style={{flex:1,minWidth:14,background:isTgt?'var(--accent-lt)':'var(--gray-lt)',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:isTgt?'var(--accent)':'var(--text4)'}}>
                              {avail.toLocaleString('es-ES')} m²
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
                  <div style={{padding:'8px 8px',fontSize:11,fontWeight:600,color:'var(--text3)',display:'flex',alignItems:'flex-start',justifyContent:'flex-end',fontFamily:'var(--mono)',paddingTop:8}}>
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
                        title="Clic para editar superficie total"
                        onClick={()=>{setEditFloorSup(floor.id);setEditFloorSupVal(String(floor.sup))}}
                        style={{cursor:'pointer',borderBottom:'1px dotted var(--text4)'}}>
                        {floor.sup.toLocaleString('es-ES')} m²
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Barra de asignación */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10,padding:'8px 0'}}>
              <span style={{fontSize:10,color:'var(--text4)',fontWeight:600,minWidth:70}}>Asignación</span>
              <div style={{flex:1,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                <div style={{width:`${occPct}%`,height:'100%',background:occPct===100?'var(--green)':'var(--accent)',borderRadius:3,transition:'width .4s'}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:occPct===100?'var(--green)':'var(--accent)',minWidth:32,textAlign:'right'}}>{occPct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ══ PROPIETARIOS ══ */}
      {view==='prop' && (()=>{
        const PROP_COLORS = ['#3b82f6','#8b5cf6','#14b8a6','#f97316','#ec4899','#22c55e']
        const ownerSet = [...new Set((edif.prop||[]).flatMap(r=>r.units.map(u=>u.n)))]
        const ownerColor = (n) => PROP_COLORS[ownerSet.indexOf(n)%PROP_COLORS.length]
        // Helper: upsert a prop row on drop
        const dropProp = (floorId, floorSup, ownerName) => {
          updBuilding(b=>{
            const exists = (b.prop||[]).find(r=>r.p===floorId)
            if(exists){
              const avail = exists.sup - exists.units.reduce((s,u)=>s+u.sup,0)
              if(avail<=0) return b
              return {...b, prop: b.prop.map(r=>r.p===floorId?{...r,units:[...r.units,{n:ownerName,sup:avail}]}:r)}
            } else {
              return {...b, prop: [...(b.prop||[]), {p:floorId, sup:floorSup, units:[{n:ownerName,sup:floorSup}]}]}
            }
          })
        }
        return (
          <div style={{display:'flex',gap:16}}>

            {/* ── SIDEBAR PROPIETARIOS ── */}
            <div style={{width:160,flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',padding:'5px 2px',marginBottom:6}}>Propietarios</div>
              <div style={{maxHeight:320,overflowY:'auto',paddingRight:2}}>
                {ownerSet.length===0 ? (
                  <div style={{fontSize:10,color:'var(--text4)',lineHeight:1.5,padding:'4px 0'}}>Aún no hay propietarios</div>
                ) : ownerSet.map((n,i)=>{
                  const col = PROP_COLORS[i%PROP_COLORS.length]
                  return (
                    <div key={n} draggable
                      onDragStart={()=>setDragging(n)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{
                        display:'flex',alignItems:'center',gap:7,padding:'6px 9px',marginBottom:4,
                        borderRadius:6,cursor:'grab',userSelect:'none',
                        border:`1px solid ${dragging===n?col:col+'88'}`,background:col+'18',
                        opacity:dragging&&dragging!==n?.4:1,
                        boxShadow:dragging===n?`0 2px 8px ${col}44`:'none',
                        transition:'opacity .15s,box-shadow .1s',
                      }}
                    >
                      <div style={{width:9,height:9,borderRadius:2,background:col,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:col,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n}</span>
                    </div>
                  )
                })}
              </div>
              <button style={{marginTop:8,padding:'5px 8px',background:'none',border:'1px dashed var(--border)',borderRadius:5,fontSize:10,color:'var(--text4)',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                + Añadir propietario
              </button>
            </div>

            {/* ── GRID PLANTAS (driven by edif.floors) ── */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',background:'var(--gray-lt)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Planta</div>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Propietario — arrastra desde el panel izquierdo · clic en bloque para editar</div>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',textAlign:'right'}}>Sup. total</div>
              </div>
              {edif.floors.map(floor=>{
                const propRow = (edif.prop||[]).find(r=>r.p===floor.id)
                const units    = propRow?.units || []
                const rowSup   = propRow?.sup ?? floor.sup
                const assigned = units.reduce((s,u)=>s+u.sup,0)
                const unassigned = rowSup - assigned
                const isEmpty  = units.length===0
                const isTgt    = dragTarget===floor.id
                return (
                  <div key={floor.id}
                    onDragOver={e=>{e.preventDefault();setDragTarget(floor.id)}}
                    onDragLeave={()=>setDragTarget(null)}
                    onDrop={e=>{
                      e.preventDefault();setDragTarget(null)
                      if(!dragging||!ownerSet.includes(dragging)) return
                      dropProp(floor.id, floor.sup, dragging)
                      setDragging(null)
                    }}
                    style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',borderBottom:floor.id==='PB'?'3px solid var(--text3)':'1px solid var(--border)',minHeight:44,
                      background:isTgt?'#eff6ff':isEmpty?'var(--gray-lt)':'var(--surface)',
                      outline:isTgt?'1.5px solid var(--accent)':'none',transition:'background .1s'}}>

                    <div style={{padding:'6px 8px',fontSize:12,fontWeight:700,color:isEmpty?'var(--text4)':'var(--text3)',display:'flex',alignItems:'center'}}>{floor.id}</div>

                    <div style={{display:'flex',flexDirection:'column',gap:3,padding:'5px 4px 5px 0'}}>
                      {/* Referencia uso principal (gris tenue) */}
                      {floor.principal.length>0 && (
                        <div style={{display:'flex',gap:1,height:6,borderRadius:2,overflow:'hidden',opacity:.35}}>
                          {floor.principal.map((u,i)=>{
                            const info=usoInfo(u.uso)
                            return <div key={i} style={{width:`${(u.sup/floor.sup)*100}%`,background:info.color,flexShrink:0}}/>
                          })}
                        </div>
                      )}
                      {/* Bloques de propietario */}
                      <div style={{display:'flex',alignItems:'stretch',gap:2,minHeight:34}}>
                        {isEmpty ? (
                          <div style={{flex:1,background:isTgt?'var(--accent-lt)':'transparent',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,
                            color:isTgt?'var(--accent)':'var(--text4)',gap:5}}>
                            {isTgt?'⬇ Soltar propietario':'Sin propietario asignado — arrastra aquí'}
                          </div>
                        ) : (
                          <>
                            {units.map((u,i)=>{
                              const col = ownerColor(u.n)
                              const wpct = `${(u.sup/rowSup)*100}%`
                              const isEd = editPA?.layer==='prop' && editPA?.rowP===floor.id && editPA?.idx===i
                              return (
                                <div key={i}
                                  title={`${u.n} · ${u.sup.toLocaleString('es-ES')} m²`}
                                  onClick={()=>{if(isEd)setEditPA(null);else{setEditPA({layer:'prop',rowP:floor.id,idx:i});setEditPASup(String(u.sup))}}}
                                  style={{width:wpct,background:col+'18',border:`1px solid ${col}88`,borderRadius:4,
                                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                                    cursor:'pointer',flexShrink:0,overflow:'hidden',padding:'3px 4px',gap:1}}
                                >
                                  {isEd ? (
                                    <div style={{display:'flex',gap:3,padding:'0 4px'}} onClick={e=>e.stopPropagation()}>
                                      <input type="number" value={editPASup} onChange={e=>setEditPASup(e.target.value)} autoFocus
                                        onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                                        style={{width:58,padding:'2px 4px',fontSize:9,border:`1px solid ${col}`,borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                      <button onClick={savePASup} style={{padding:'2px 4px',background:col,color:'#fff',border:'none',borderRadius:3,fontSize:8,cursor:'pointer'}}>✓</button>
                                    </div>
                                  ) : (
                                    <>
                                      <span style={{fontSize:10,fontWeight:700,color:col,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center',padding:'0 3px'}}>{u.n}</span>
                                      <span style={{fontSize:9,color:col,opacity:.7,fontFamily:'var(--mono)'}}>{u.sup.toLocaleString('es-ES')} m²</span>
                                    </>
                                  )}
                                </div>
                              )
                            })}
                            {unassigned>0 && (
                              <div style={{flex:1,minWidth:20,background:isTgt?'var(--accent-lt)':'var(--gray-lt)',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,
                                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                                fontSize:9,color:isTgt?'var(--accent)':'var(--text4)',gap:1,padding:'2px 4px'}}>
                                <span>{unassigned.toLocaleString('es-ES')} m²</span>
                                <span style={{fontSize:8}}>sin asignar</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{padding:'6px 8px',fontSize:11,fontWeight:600,color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'flex-end',fontFamily:'var(--mono)'}}>
                      {rowSup.toLocaleString('es-ES')} m²
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ══ ARRENDATARIOS ══ */}
      {view==='arr' && (()=>{
        const tenantSet = [...new Set((edif.arr||[]).flatMap(r=>r.units.filter(u=>u.type==='ten'||u.type==='rt'||u.type==='pk').map(u=>u.n)))]
        const ARR_COLORS = ['#1e40af','#0f766e','#7c3aed','#b45309','#be185d','#065f46']
        const tenantColor = (n) => ARR_COLORS[tenantSet.indexOf(n)%ARR_COLORS.length]
        const TYPE_COLORS = {
          ten: {bg:'#dbeafe',bd:'#93c5fd',col:'#1e40af'},
          vac: {bg:'#fff8ec',bd:'#fcd34d',col:'#d97706'},
          com: {bg:'#dcfce7',bd:'#86efac',col:'#15803d'},
          rt:  {bg:'#fce7f3',bd:'#fbcfe8',col:'#ec4899'},
          pk:  {bg:'#f1f5f9',bd:'#94a3b8',col:'#475569'},
        }
        const typeLabel = (u) => {
          if(u.type==='vac') return u.oferta ? u.oferta : 'Disponible'
          return u.n
        }
        return (
          <div style={{display:'flex',gap:16}}>

            {/* ── SIDEBAR ARRENDATARIOS ── */}
            <div style={{width:160,flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',padding:'5px 2px',marginBottom:6}}>Arrendatarios</div>
              <div style={{maxHeight:200,overflowY:'auto',paddingRight:2}}>
                {tenantSet.length===0 ? (
                  <div style={{fontSize:10,color:'var(--text4)',lineHeight:1.5,padding:'4px 0'}}>Aún no hay arrendatarios</div>
                ) : tenantSet.map((n,i)=>{
                  const col = ARR_COLORS[i%ARR_COLORS.length]
                  return (
                    <div key={n} draggable
                      onDragStart={()=>setDragging('ten:'+n)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{
                        display:'flex',alignItems:'center',gap:7,padding:'6px 9px',marginBottom:4,
                        borderRadius:6,cursor:'grab',userSelect:'none',
                        border:`1px solid ${col}88`,background:col+'18',
                        opacity:dragging&&dragging!=='ten:'+n?.4:1,
                        boxShadow:dragging==='ten:'+n?`0 2px 8px ${col}44`:'none',
                        transition:'opacity .15s,box-shadow .1s',
                      }}
                    >
                      <div style={{width:9,height:9,borderRadius:2,background:col,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:col,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n}</span>
                    </div>
                  )
                })}
              </div>
              <button style={{marginTop:4,padding:'5px 8px',background:'none',border:'1px dashed var(--border)',borderRadius:5,fontSize:10,color:'var(--text4)',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                + Añadir arrendatario
              </button>
              <div style={{borderTop:'1px solid var(--border)',marginTop:10,paddingTop:8}}>
                <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Ofertas activas</div>
                {OFERTAS_ACTIVAS.map(ofr=>{
                  const dragKey = 'ofr:'+ofr.ref
                  return (
                    <div key={ofr.ref} draggable
                      onDragStart={()=>setDragging(dragKey)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{
                        display:'flex',flexDirection:'column',gap:2,padding:'6px 9px',marginBottom:4,
                        borderRadius:5,cursor:'grab',userSelect:'none',
                        border:`1px solid ${ofr.border}`,background:ofr.bg,
                        opacity:dragging&&dragging!==dragKey?0.4:1,
                        transition:'opacity .15s',
                      }}
                    >
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
                        <span style={{fontSize:11,fontWeight:700,color:ofr.color,fontFamily:'var(--mono)'}}>{ofr.ref}</span>
                        <span style={{fontSize:9,fontWeight:600,color:ofr.color,background:'#fff',border:`1px solid ${ofr.border}`,borderRadius:3,padding:'0 4px'}}>{ofr.estado}</span>
                      </div>
                      <div style={{fontSize:10,color:'var(--text3)',lineHeight:1.2}}>{ofr.contraparte}</div>
                      <div style={{fontSize:10,fontWeight:600,color:'var(--text2)'}}>{ofr.sup.toLocaleString('es-ES')} m²</div>
                    </div>
                  )
                })}
                <button style={{marginTop:2,padding:'5px 8px',background:'none',border:'1px dashed var(--border)',borderRadius:5,fontSize:10,color:'var(--text4)',cursor:'pointer',fontFamily:'inherit',textAlign:'left',width:'100%'}}>
                  + Nueva oferta
                </button>
              </div>
            </div>

            {/* ── GRID PLANTAS (driven by edif.floors) ── */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',background:'var(--gray-lt)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Planta</div>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Arrendatario / Oferta — arrastra desde el panel izquierdo · clic en bloque para editar</div>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',textAlign:'right'}}>Sup. total</div>
              </div>
              {edif.floors.map(floor=>{
                const arrRow  = (edif.arr||[]).find(r=>r.p===floor.id)
                const units   = arrRow?.units || []
                const rowSup  = arrRow?.sup ?? floor.sup
                const assigned = units.reduce((s,u)=>s+u.sup,0)
                const isEmpty = units.length===0
                const isTgt   = dragTarget===floor.id
                // upsert helper for arr
                const dropArr = (newUnit) => {
                  updBuilding(b=>{
                    const exists=(b.arr||[]).find(r=>r.p===floor.id)
                    if(exists){
                      const avail=exists.sup-exists.units.reduce((s,u)=>s+u.sup,0)
                      if(avail<=0) return b
                      // use the offer's own sup if provided and fits, otherwise cap to available
                      const fitSup = newUnit.sup && newUnit.sup>0 ? Math.min(newUnit.sup, avail) : avail
                      const unit={...newUnit,sup:fitSup}
                      return {...b,arr:b.arr.map(r=>r.p===floor.id?{...r,units:[...r.units,unit]}:r)}
                    } else {
                      return {...b,arr:[...(b.arr||[]),{p:floor.id,sup:floor.sup,units:[{...newUnit,sup:floor.sup}]}]}
                    }
                  })
                }
                return (
                  <div key={floor.id}
                    onDragOver={e=>{e.preventDefault();setDragTarget(floor.id)}}
                    onDragLeave={()=>setDragTarget(null)}
                    onDrop={e=>{
                      e.preventDefault();setDragTarget(null)
                      if(!dragging) return
                      if(dragging.startsWith('ten:')){
                        dropArr({type:'ten',n:dragging.slice(4)})
                      } else if(dragging.startsWith('ofr:')){
                        const ref=dragging.slice(4)
                        const ofr=OFERTAS_ACTIVAS.find(o=>o.ref===ref)
                        dropArr({type:'vac',oferta:ref,sup:ofr?.sup??0})
                      }
                      setDragging(null)
                    }}
                    style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',borderBottom:floor.id==='PB'?'3px solid var(--text3)':'1px solid var(--border)',minHeight:52,
                      background:isTgt?'#eff6ff':isEmpty?'var(--gray-lt)':'var(--surface)',
                      outline:isTgt?'1.5px solid var(--accent)':'none',transition:'background .1s'}}>

                    <div style={{padding:'6px 8px',fontSize:12,fontWeight:700,color:isEmpty?'var(--text4)':'var(--text3)',display:'flex',alignItems:'center'}}>{floor.id}</div>

                    <div style={{display:'flex',flexDirection:'column',gap:3,padding:'5px 4px 5px 0'}}>
                      {/* Referencia uso principal (gris tenue) */}
                      {floor.principal.length>0 && (
                        <div style={{display:'flex',gap:1,height:6,borderRadius:2,overflow:'hidden',opacity:.35}}>
                          {floor.principal.map((u,i)=>{
                            const info=usoInfo(u.uso)
                            return <div key={i} style={{width:`${(u.sup/floor.sup)*100}%`,background:info.color,flexShrink:0}}/>
                          })}
                        </div>
                      )}
                      {/* Bloques de arrendatario */}
                      <div style={{display:'flex',alignItems:'stretch',gap:2,minHeight:42}}>
                        {isEmpty ? (
                          <div style={{flex:1,background:isTgt?'var(--accent-lt)':'transparent',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,
                            color:isTgt?'var(--accent)':'var(--text4)',gap:5}}>
                            {isTgt?'⬇ Soltar aquí':'Sin asignación — arrastra un arrendatario o disponible'}
                          </div>
                        ) : (
                          <>
                            {units.map((u,i)=>{
                              const wpct = `${(u.sup/rowSup)*100}%`
                              const isEd = editPA?.layer==='arr' && editPA?.rowP===floor.id && editPA?.idx===i
                              const tc = TYPE_COLORS[u.type]||TYPE_COLORS.ten
                              const {bg,bd,col} = tc
                              const label = typeLabel(u)
                              return (
                                <div key={i}
                                  title={`${label} · ${u.sup.toLocaleString('es-ES')} m²${u.brk?` · break ${u.brk}`:''}`}
                                  onClick={()=>{if(isEd)setEditPA(null);else{setEditPA({layer:'arr',rowP:floor.id,idx:i});setEditPASup(String(u.sup))}}}
                                  style={{width:wpct,background:bg,border:`1px solid ${bd}`,borderRadius:4,
                                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                                    cursor:'pointer',flexShrink:0,overflow:'hidden',padding:'4px 6px',gap:2,minHeight:42}}
                                >
                                  {isEd ? (
                                    <div style={{display:'flex',gap:3,padding:'0 4px'}} onClick={e=>e.stopPropagation()}>
                                      <input type="number" value={editPASup} onChange={e=>setEditPASup(e.target.value)} autoFocus
                                        onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                                        style={{width:58,padding:'2px 4px',fontSize:9,border:`1px solid ${col}`,borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                      <button onClick={savePASup} style={{padding:'2px 4px',background:col,color:'#fff',border:'none',borderRadius:3,fontSize:8,cursor:'pointer'}}>✓</button>
                                    </div>
                                  ) : (
                                    <>
                                      <span style={{fontSize:10,fontWeight:700,color:col,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>{label}</span>
                                      <span style={{fontSize:9,color:col,opacity:.75,fontFamily:'var(--mono)',fontWeight:600}}>{u.sup.toLocaleString('es-ES')} m²</span>
                                      {u.brk&&<span style={{fontSize:8,color:u.brkColor||col,fontWeight:600,whiteSpace:'nowrap'}}>⊙ {u.brk}</span>}
                                      {u.nota&&<span style={{fontSize:8,color:col,opacity:.6}}>{u.nota}</span>}
                                    </>
                                  )}
                                </div>
                              )
                            })}
                            {assigned<rowSup && (
                              <div style={{flex:1,minWidth:20,background:isTgt?'var(--accent-lt)':'var(--gray-lt)',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:9,color:isTgt?'var(--accent)':'var(--text4)',gap:1,padding:'2px 4px',minHeight:42}}>
                                <span>{(rowSup-assigned).toLocaleString('es-ES')} m²</span>
                                <span style={{fontSize:8}}>sin asignar</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{padding:'6px 8px',fontSize:11,fontWeight:600,color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'flex-end',fontFamily:'var(--mono)'}}>
                      {rowSup.toLocaleString('es-ES')} m²
                    </div>
                  </div>
                )
              })}
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
        <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'1px solid var(--border)',borderRadius:4,padding:'1px 6px',cursor:'pointer',fontSize:11,color:'var(--text3)',flexShrink:0}}>🔍</button>
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
  { id:1, tipo:'Fotografía', subtipo:'Exterior',        desc:'Fachada principal',        principal:true,  date:'07/02/2026', src:'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80' },
  { id:2, tipo:'Fotografía', subtipo:'Interior',        desc:'Planta tipo — open space', principal:false, date:'07/02/2026', src:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80' },
  { id:3, tipo:'Fotografía', subtipo:'Interior',        desc:'Sala de reuniones',        principal:false, date:'07/02/2026', src:'https://images.unsplash.com/photo-1497366754035-f200968a7db3?w=800&q=80' },
  { id:4, tipo:'Fotografía', subtipo:'Zonas comunes',   desc:'Lobby recepción',          principal:false, date:'07/02/2026', src:'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80' },
  { id:5, tipo:'Fotografía', subtipo:'Fotos aéreas',    desc:'Vista aérea conjunto',     principal:false, date:'01/01/2026', src:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80' },
  { id:6, tipo:'Plano',      subtipo:'Plano de planta', desc:'Planta tipo — distribución', principal:false, date:'20/03/2026', src:'https://images.unsplash.com/photo-1541888846341-b14b40e47e34?w=800&q=80' },
]

function TabMultimedia() {
  const [media, setMedia]       = useState(MOCK_MEDIA)
  const [filter, setFilter]     = useState('todos')
  const [dragging, setDragging] = useState(false)
  const [uploadMode, setUpload] = useState(false)
  const [newTipo, setNewTipo]   = useState('Fotografía')
  const [newSub,  setNewSub]    = useState('Exterior')
  const [newDesc, setNewDesc]   = useState('')
  const [lightbox, setLightbox] = useState(null)

  const displayed = filter === 'todos' ? media
    : filter === 'fotografias' ? media.filter(m=>m.tipo==='Fotografía')
    : media.filter(m=>m.tipo==='Plano')

  const setPrincipal = (id) => setMedia(prev => prev.map(m => ({...m, principal: m.id === id})))

  const addMedia = () => {
    const id = Math.max(0,...media.map(m=>m.id))+1
    setMedia(prev => [...prev, { id, tipo:newTipo, subtipo:newSub, desc:newDesc||`${newSub} ${id}`, principal:false, src:newTipo==='Plano'?'📐':'🖼', date:'14/04/2026' }])
    setUpload(false); setNewDesc('')
  }

  return (
    <div className="tab-content active"><div className="info-pad">
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:600}}>Multimedia</div>
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
          <div style={{textAlign:'center',marginBottom:14}}>
            <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false)}}
              style={{padding:'24px 0',background:dragging?'rgba(37,99,235,.08)':'transparent',borderRadius:6,transition:'background .15s'}}>
              <div style={{fontSize:28,marginBottom:6}}>⬆</div>
              <div style={{fontSize:12,color:'var(--text3)'}}>Arrastra archivos JPEG aquí o <span style={{color:'var(--accent)',cursor:'pointer',fontWeight:600}}>haz clic para cargar</span></div>
              <div style={{fontSize:10,color:'var(--text4)',marginTop:4}}>Solo se admiten archivos .jpg / .jpeg</div>
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
            <button onClick={addMedia} style={{padding:'5px 14px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Añadir</button>
          </div>
        </div>
      )}

      {/* Galería */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
        {displayed.map(m=>(
          <div key={m.id} style={{border:`2px solid ${m.principal?'var(--accent)':'var(--border)'}`,borderRadius:8,overflow:'hidden',background:'var(--surface)',cursor:'pointer',position:'relative'}}
            onClick={()=>setLightbox(m)}>
            <div style={{height:120,overflow:'hidden',position:'relative',background:'var(--gray-lt)'}}>
              {m.src.startsWith('http') ? (
                <img src={m.src} alt={m.desc} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} loading="lazy"/>
              ) : (
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40}}>{m.src}</div>
              )}
              {m.principal && <span style={{position:'absolute',top:6,left:6,background:'var(--accent)',color:'#fff',fontSize:8,fontWeight:700,padding:'2px 7px',borderRadius:8,letterSpacing:'.03em'}}>PRINCIPAL</span>}
            </div>
            <div style={{padding:'6px 8px'}}>
              <div style={{fontSize:10,fontWeight:600,color:'var(--text1)',marginBottom:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.desc}</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                <span style={{fontSize:8,padding:'1px 5px',borderRadius:8,background:m.tipo==='Plano'?'#ede9fe':'#dbeafe',color:m.tipo==='Plano'?'#7c3aed':'#1e40af',fontWeight:600}}>{m.tipo}</span>
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
            {lightbox.src.startsWith('http') ? (
              <img src={lightbox.src} alt={lightbox.desc} style={{width:'100%',maxHeight:440,objectFit:'cover',display:'block'}}/>
            ) : (
              <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',fontSize:80,background:'var(--gray-lt)'}}>{lightbox.src}</div>
            )}
            <div style={{padding:'16px 20px'}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{lightbox.desc}</div>
              <div style={{display:'flex',gap:6,marginBottom:10}}>
                <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:'#dbeafe',color:'#1e40af',fontWeight:600}}>{lightbox.tipo}</span>
                <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:'var(--gray-lt)',color:'var(--text3)',border:'1px solid var(--border)'}}>{lightbox.subtipo}</span>
                {lightbox.principal && <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:'var(--accent)',color:'#fff',fontWeight:700}}>PRINCIPAL</span>}
              </div>
              <div style={{fontSize:10,color:'var(--text4)',marginBottom:14}}>Subido el {lightbox.date}</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {!lightbox.principal && <button onClick={()=>{setPrincipal(lightbox.id);setLightbox({...lightbox,principal:true})}} style={{padding:'6px 14px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>★ Marcar como principal</button>}
                {lightbox.src?.startsWith('http') && (
                  <a href={lightbox.src} download={`${lightbox.desc||'imagen'}.jpg`} target="_blank" rel="noreferrer"
                    style={{padding:'6px 14px',background:'#16a34a',color:'#fff',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:4}}>
                    ⬇ Descargar JPG
                  </a>
                )}
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

  // Derived conditional zone data
  const nfAreas  = getAreas(newForm.ciudad, newForm.uso)
  const zonas    = newForm.area ? getZonas(newForm.ciudad, newForm.uso, newForm.area) : []
  const subzonas = newForm.area && newForm.zona ? getSubzonas(newForm.ciudad, newForm.uso, newForm.area, newForm.zona) : []

  const err = (field) => submitted && !newForm[field]
  const inp = (field) => ({padding:'5px 8px',border:`1px solid ${err(field)?'var(--red)':'var(--accent-bd)'}`,borderRadius:5,fontSize:12,fontFamily:'inherit',background:err(field)?'#fff5f5':'var(--accent-lt)',color:'var(--text1)',width:'100%',boxSizing:'border-box',outline:'none'})
  const inpBase = {padding:'5px 8px',border:'1px solid var(--accent-bd)',borderRadius:5,fontSize:12,fontFamily:'inherit',background:'var(--accent-lt)',color:'var(--text1)',width:'100%',boxSizing:'border-box',outline:'none'}
  const sel = (field) => ({...inpBase,cursor:'pointer',...(err(field)?{border:'1px solid var(--red)',background:'#fff5f5'}:{})})
  const selSt = {padding:'4px 7px',border:'1px solid var(--border)',borderRadius:5,fontSize:11,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)',width:'100%'}

  const Req = () => <span style={{color:'var(--red)',marginLeft:2,fontWeight:700}}>*</span>

  const Row = ({label, required, children}) => (
    <div className="ir" style={{alignItems:'flex-start',gap:6}}>
      <span className="ir-k">{label}{required && <Req/>}</span>
      <div style={{flex:1}}>{children}</div>
    </div>
  )

  return (
    <div className="tab-content active">
      <div className="info-pad">

        {/* Mapa + carrusel */}
        <MapaCarrusel activo={null} direccion={newForm.direccion}
          onAddressChange={({direccion,ciudad,pais,cp,coordenadas})=>{
            setNF('direccion',direccion); setNF('ciudad',ciudad); setNF('pais',pais||'España')
            if(cp) setNF('cp',cp); if(coordenadas) setNF('coordenadas',coordenadas)
          }}/>

        {/* UBICACIÓN + TIPOLOGÍA */}
        <div className="info-2col" style={{marginBottom:12}}>
          <div className="info-block">
            <div className="ib-title">📍 UBICACIÓN</div>
            <Row label="Nombre del activo">
              <input value={newForm.nombre} onChange={e=>setNF('nombre',e.target.value)} style={inpBase} placeholder="P.E Avalon, Torre Sevilla..."/>
            </Row>
            <Row label="Propietario">
              <input list="fa-cuentas-new" value={newForm.propietario} onChange={e=>setNF('propietario',e.target.value)} style={inpBase} placeholder="Buscar cuenta..."/>
              <datalist id="fa-cuentas-new">{CUENTAS_FA.map(c=><option key={c} value={c}/>)}</datalist>
            </Row>
            <Row label="Dirección" required>
              <input value={newForm.direccion} onChange={e=>setNF('direccion',e.target.value)} style={inp('direccion')} placeholder="Calle Serrano 41, Madrid..."/>
              {err('direccion') && <span style={{fontSize:10,color:'var(--red)'}}>Campo obligatorio</span>}
            </Row>
            <Row label="Ciudad">
              <input value={newForm.ciudad} onChange={e=>{setNF('ciudad',e.target.value);setNF('area','');setNF('zona','');setNF('subzona','')}} style={inpBase} placeholder="Madrid"/>
            </Row>
            <Row label="País">
              <input value={newForm.pais} onChange={e=>setNF('pais',e.target.value)} style={inpBase} placeholder="España"/>
            </Row>
            <Row label="Código postal">
              <input value={newForm.cp} onChange={e=>setNF('cp',e.target.value)} style={inpBase} placeholder="28037"/>
            </Row>
            <Row label="Coordenadas">
              <input value={newForm.coordenadas||''} onChange={e=>setNF('coordenadas',e.target.value)} style={{...inp,fontFamily:'var(--mono)',fontSize:11}} placeholder="40.416775, -3.703790"/>
            </Row>
            {/* Área / Zona / Subzona */}
            <div style={{marginTop:8,padding:'10px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:7}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:0}}>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Área</div>
                  {nfAreas.length > 0
                    ? <select value={newForm.area} onChange={e=>{setNF('area',e.target.value);setNF('zona','');setNF('subzona','')}} style={selSt}><option value="">—</option>{nfAreas.map(a=><option key={a}>{a}</option>)}</select>
                    : <input value={newForm.area} onChange={e=>setNF('area',e.target.value)} style={selSt} placeholder="—"/>}
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Zona</div>
                  {zonas.length > 0
                    ? <select value={newForm.zona} onChange={e=>{setNF('zona',e.target.value);setNF('subzona','')}} style={selSt}><option value="">—</option>{zonas.map(z=><option key={z}>{z}</option>)}</select>
                    : <input value={newForm.zona} onChange={e=>setNF('zona',e.target.value)} style={selSt} placeholder="—"/>}
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:3}}>Subzona</div>
                  {subzonas.length > 0
                    ? <select value={newForm.subzona} onChange={e=>setNF('subzona',e.target.value)} style={selSt}><option value="">—</option>{subzonas.map(s=><option key={s}>{s}</option>)}</select>
                    : <input value={newForm.subzona} onChange={e=>setNF('subzona',e.target.value)} style={selSt} placeholder="—"/>}
                </div>
              </div>
            </div>
          </div>

          <div className="info-block">
            <div className="ib-title">🏢 TIPOLOGÍA</div>
            <Row label="Tipo de activo" required>
              <select value={newForm.tipo_activo} onChange={e=>setNF('tipo_activo',e.target.value)} style={sel('tipo_activo')}>
                {['Edificio','Nave','Local','Parcela','Complejo','Torre','Centro comercial','Parque empresarial','Parque logístico','Residencia'].map(t=><option key={t}>{t}</option>)}
              </select>
            </Row>
            <Row label="Estado construcción">
              <select value={newForm.estado_construccion} onChange={e=>setNF('estado_construccion',e.target.value)} style={{...inpBase,cursor:'pointer'}}>
                <option value="">—</option>{ESTADOS_CONSTRUCCION.map(e=><option key={e}>{e}</option>)}
              </select>
            </Row>
            <Row label="Uso principal" required>
              <select value={newForm.uso} onChange={e=>setNF('uso',e.target.value)} style={sel('uso')}>
                <option value="">—</option>{USOS_PRINCIPALES.map(u=><option key={u}>{u}</option>)}
              </select>
            </Row>
            <Row label="Uso secundario">
              <select value={newForm.uso_secundario} onChange={e=>setNF('uso_secundario',e.target.value)} style={{...inpBase,cursor:'pointer'}}>
                <option value="">—</option>{USOS_PRINCIPALES.map(u=><option key={u}>{u}</option>)}
              </select>
            </Row>
            <Row label="Calidad">
              <select value={newForm.calidad} onChange={e=>setNF('calidad',e.target.value)} style={{...inpBase,cursor:'pointer'}}>
                <option value="">—</option>{CALIDADES.map(c=><option key={c}>{c}</option>)}
              </select>
            </Row>
            <Row label="SBA (m²)">
              <input type="number" value={newForm.sba} onChange={e=>setNF('sba',e.target.value)} style={{...inpBase,fontFamily:'var(--mono)'}} placeholder="0"/>
            </Row>
            <Row label="Año construcción">
              <input type="number" value={newForm.anno_construccion} onChange={e=>setNF('anno_construccion',e.target.value)} style={inpBase} placeholder="—"/>
            </Row>
            <Row label="Año rehabilitación">
              <input type="number" value={newForm.anno_rehabilitacion} onChange={e=>setNF('anno_rehabilitacion',e.target.value)} style={inpBase} placeholder="—"/>
            </Row>
            <Row label="Asset Manager">
              <input value={newForm.asset_manager} onChange={e=>setNF('asset_manager',e.target.value)} style={inpBase} placeholder="—"/>
            </Row>
            <div className="ir">
              <span className="ir-k">Nº edificios</span>
              <span className="ir-v" style={{fontSize:10,color:'var(--text4)',fontStyle:'italic'}}>Desde Stacking Plan</span>
            </div>
          </div>
        </div>

        {/* DATOS URBANÍSTICOS */}
        <div className="info-block" style={{marginBottom:12}}>
          <div className="ib-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>🏛 DATOS URBANÍSTICOS</span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {catMsg === 'ok' && <span style={{fontSize:10,color:'var(--green)',fontWeight:600}}>✓ Sincronizado</span>}
              {catMsg && catMsg !== 'ok' && <span style={{fontSize:10,color:'var(--red)',maxWidth:200,textAlign:'right',lineHeight:1.3}}>{catMsg}</span>}
              <button className="ab-btn blue" onClick={syncCatastro} disabled={syncingCat}>
                {syncingCat ? '⟳ Consultando...' : '⟳ Sincronizar'}
              </button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 24px'}}>
            <div>
              <Row label="Ref. catastral"><input value={newForm.ref_catastral} onChange={e=>setNF('ref_catastral',e.target.value)} style={{...inpBase,fontFamily:'var(--mono)',fontSize:11}} placeholder="—"/></Row>
              <Row label="Uso PGOU"><input value={newForm.uso_pgou} onChange={e=>setNF('uso_pgou',e.target.value)} style={inpBase} placeholder="—"/></Row>
            </div>
            <div>
              <Row label="Clasificación"><input value={newForm.clasificacion_urb||''} onChange={e=>setNF('clasificacion_urb',e.target.value)} style={inpBase} placeholder="—"/></Row>
              <Row label="Calificación"><input value={newForm.calificacion_urb} onChange={e=>setNF('calificacion_urb',e.target.value)} style={inpBase} placeholder="—"/></Row>
            </div>
            <div>
              <Row label="Edificabilidad"><input value={newForm.edificabilidad} onChange={e=>setNF('edificabilidad',e.target.value)} style={inpBase} placeholder="—"/></Row>
              <Row label="Sup. parcela (m²)"><input type="number" value={newForm.sup_parcela} onChange={e=>setNF('sup_parcela',e.target.value)} style={{...inpBase,fontFamily:'var(--mono)'}} placeholder="—"/></Row>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function MapaCarrusel({ activo, direccion, onAddressChange }) {
  const mapElRef   = useRef(null)
  const mapObj     = useRef(null)
  const markerRef  = useRef(null)
  const searchRef  = useRef(null)
  const acRef      = useRef(null)
  const [carIdx, setCarIdx] = useState(0)

  const fotos = MOCK_MEDIA.filter(m => m.tipo === 'Fotografía')
  const principal = fotos.find(m => m.principal) || fotos[0]
  const ordenadas = principal
    ? [principal, ...fotos.filter(m => m.id !== principal?.id)]
    : fotos

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
            onAddressChange({
              direccion:   place.formatted_address || '',
              ciudad:      get('locality') || get('administrative_area_level_2') || '',
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>

      {/* Mapa con barra de búsqueda integrada */}
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
        {GMAPS_API_KEY ? (
          <div ref={mapElRef} style={{ width: '100%', height: 220, background: '#e5e3df' }}/>
        ) : (
          <div style={{ width: '100%', height: 220, background: 'var(--gray-lt)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text4)' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <div style={{ fontSize: 10 }}>Mapa no disponible</div>
          </div>
        )}
        {/* Search bar overlay — always visible at top of map */}
        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 10 }}>
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="var(--text3)" strokeWidth="1.5"
              style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', width:12, height:12, pointerEvents:'none', zIndex:1 }}>
              <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/>
            </svg>
            <input ref={searchRef} type="text"
              placeholder="Buscar dirección en el mapa..."
              style={{ width:'100%', boxSizing:'border-box', padding:'7px 10px 7px 26px',
                background:'rgba(255,255,255,.96)', border:'1px solid rgba(0,0,0,.12)',
                borderRadius:6, fontSize:11, fontFamily:'inherit', color:'var(--text1)',
                boxShadow:'0 2px 6px rgba(0,0,0,.15)', outline:'none' }}/>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(255,255,255,.92)', borderRadius: 5, padding: '3px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text2)', backdropFilter: 'blur(4px)', border: '1px solid var(--border)' }}>
          {activo?.zona || 'M-30'} · {activo?.ciudad || 'Madrid'}
        </div>
      </div>

      {/* Carrusel fotos */}
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', background: 'var(--gray-lt)' }}>
        {ordenadas.length > 0 ? (
          <>
            {/* Foto principal */}
            <div style={{ width: '100%', height: 166, overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
              {ordenadas[carIdx]?.src?.startsWith('http') ? (
                <img src={ordenadas[carIdx].src} alt={ordenadas[carIdx].desc} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>{ordenadas[carIdx]?.src}</div>
              )}
            </div>
            {/* Descripción */}
            <div style={{ padding: '6px 10px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text1)' }}>{ordenadas[carIdx]?.desc}</div>
                <div style={{ fontSize: 9, color: 'var(--text4)' }}>{ordenadas[carIdx]?.subtipo}</div>
              </div>
              {ordenadas[carIdx]?.principal && <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontWeight: 700 }}>PRINCIPAL</span>}
            </div>
            {/* Thumbnails scroll */}
            <div style={{ display: 'flex', gap: 5, padding: '0 10px 8px', overflowX: 'auto' }}>
              {ordenadas.map((f, i) => (
                <div key={f.id} onClick={() => setCarIdx(i)}
                  style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 5, border: `2px solid ${i === carIdx ? 'var(--accent)' : 'var(--border)'}`, overflow: 'hidden', cursor: 'pointer', background: '#f8fafc' }}>
                  {f.src?.startsWith('http') ? (
                    <img src={f.src} alt={f.desc} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy"/>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{f.src}</div>
                  )}
                </div>
              ))}
            </div>
            {/* Flechas nav */}
            {ordenadas.length > 1 && (
              <>
                <button onClick={() => setCarIdx(i => (i - 1 + ordenadas.length) % ordenadas.length)}
                  style={{ position: 'absolute', top: '50%', left: 6, transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,.9)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>‹</button>
                <button onClick={() => setCarIdx(i => (i + 1) % ordenadas.length)}
                  style={{ position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,.9)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>›</button>
              </>
            )}
          </>
        ) : (
          <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text4)' }}>
            <div style={{ fontSize: 28 }}>🖼</div>
            <div style={{ fontSize: 11 }}>Sin imágenes · añade en Multimedia</div>
          </div>
        )}
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

function ZonaBox({ info, setI }) {
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

function AddressField({ value, ciudad, onSave }) {
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
        setDraft({ direccion: place.formatted_address||'', ciudad: get('locality')||get('administrative_area_level_2')||'', pais: get('country')||'' })
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
        {draft.ciudad && <span style={{fontSize:10,color:'var(--text3)'}}>📍 {draft.ciudad} · {draft.pais}</span>}
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

  return (
    <div className="ir" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <span className="ir-k">Dirección</span>
      <span className="ir-v" style={{flex:1}}>{value || '—'}</span>
      <button onClick={()=>{ setDraft({direccion:value,ciudad,pais:''}); setEditing(true) }}
        style={{opacity:hover?1:0,transition:'opacity .15s',background:'none',border:'none',cursor:'pointer',padding:'2px 4px',color:'var(--text4)',display:'flex',alignItems:'center',borderRadius:4,flexShrink:0}}>
        <PencilIco/>
      </button>
    </div>
  )
}

function TabInfo({ navigate, plazas, activo, nEdificios, onInfoSaved, saveRef, syncRef, hidden }) {
  const INIT_INFO = {
    nombre:'', direccion:'', ciudad:'', pais:'España', cp:'', coordenadas:'',
    area:'', zona:'', subzona:'',
    tipo_activo:'Edificio', estado_construccion:'Construcción existente',
    uso:'', uso_secundario:'', calidad:'',
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

  return (
    <div className="tab-content active" style={hidden ? {display:'none'} : undefined}>
      <div className="info-pad">

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
                <span style={{fontSize:11,color:'var(--red)',fontWeight:600,flex:1}}>⚠ {saveErr}</span>
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

        {/* ── UBICACIÓN + TIPOLOGÍA ── */}
        <div className="info-2col" style={{marginBottom:12}}>

          {/* UBICACIÓN */}
          <div className="info-block">
            <div className="ib-title">📍 UBICACIÓN</div>
            <InlineField label="Nombre del activo" value={info.nombre}
              onSave={()=>{ setDirty(true); if(onInfoSaved) onInfoSaved({nombre: info.nombre}) }}>
              <input value={info.nombre} onChange={e=>setI('nombre',e.target.value)} style={inp} placeholder="Nombre comercial del activo..."/>
            </InlineField>
            <AddressField value={info.direccion} ciudad={info.ciudad}
              onSave={d=>{ setI('direccion',d.direccion); if(d.ciudad) setI('ciudad',d.ciudad); if(d.pais) setI('pais',d.pais) }}/>
            <InlineField label="Ciudad" value={info.ciudad} onSave={()=>setDirty(true)}>
              <input value={info.ciudad} onChange={e=>setI('ciudad',e.target.value)} style={inp} placeholder="—"/>
            </InlineField>
            <InlineField label="País" value={info.pais} onSave={()=>setDirty(true)}>
              <input value={info.pais} onChange={e=>setI('pais',e.target.value)} style={inp} placeholder="—"/>
            </InlineField>
            <InlineField label="Código postal" value={info.cp||'—'} onSave={()=>setDirty(true)}>
              <input value={info.cp} onChange={e=>setI('cp',e.target.value)} style={inp} placeholder="—"/>
            </InlineField>
            <InlineField label="Coordenadas" value={info.coordenadas||'—'} onSave={()=>setDirty(true)}>
              <input value={info.coordenadas} onChange={e=>setI('coordenadas',e.target.value)} style={{...inp,fontFamily:'var(--mono)',fontSize:11}} placeholder="40.416775, -3.703790"/>
            </InlineField>
            <ZonaBox info={info} setI={setI}/>
          </div>

          {/* TIPOLOGÍA */}
          <div className="info-block">
            <div className="ib-title">🏢 TIPOLOGÍA</div>
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
              <select value={info.uso} onChange={e=>setI('uso',e.target.value)} style={sel}>
                <option value="">—</option>{USOS_PRINCIPALES.map(u=><option key={u}>{u}</option>)}
              </select>
            </InlineField>
            <InlineField label="Uso secundario" value={info.uso_secundario||'—'} onSave={()=>setDirty(true)}>
              <select value={info.uso_secundario} onChange={e=>setI('uso_secundario',e.target.value)} style={sel}>
                <option value="">—</option>{USOS_PRINCIPALES.map(u=><option key={u}>{u}</option>)}
              </select>
            </InlineField>
            <InlineField label="Calidad" value={info.calidad||'—'} onSave={()=>setDirty(true)}>
              <select value={info.calidad} onChange={e=>setI('calidad',e.target.value)} style={sel}>
                <option value="">—</option>{CALIDADES.map(c=><option key={c}>{c}</option>)}
              </select>
            </InlineField>
            <InlineField label="SBA (m²)" value={info.sba ? Number(info.sba).toLocaleString('es-ES')+' m²' : '—'}
              display={<span style={{fontWeight:700,fontFamily:'var(--mono)',fontSize:14}}>{info.sba ? Number(info.sba).toLocaleString('es-ES') : '—'}</span>}
              onSave={()=>setDirty(true)}>
              <input type="number" value={info.sba} onChange={e=>setI('sba',e.target.value)} style={{...inp,fontFamily:'var(--mono)'}} placeholder="0"/>
            </InlineField>
            <InlineField label="Sup. planta tipo (m²)" value={info.sup_planta_tipo ? Number(info.sup_planta_tipo).toLocaleString('es-ES')+' m²' : '—'} onSave={()=>setDirty(true)}>
              <input type="number" value={info.sup_planta_tipo} onChange={e=>setI('sup_planta_tipo',e.target.value)} style={{...inp,fontFamily:'var(--mono)'}} placeholder="0"/>
            </InlineField>
            <InlineField label="Ratio de pérdida (%)"
              value={info.ratio_perdida ? `${info.ratio_perdida}%` : '—'}
              display={<span style={{fontFamily:'var(--mono)'}}>{info.ratio_perdida ? `${info.ratio_perdida}%` : '—'}</span>}
              onSave={()=>setDirty(true)}>
              <input type="number" min="0" max="100" value={info.ratio_perdida} onChange={e=>setI('ratio_perdida',e.target.value)} style={{...inp,fontFamily:'var(--mono)'}} placeholder="0"/>
            </InlineField>
            {(info.sba && info.ratio_perdida) && (
              <div className="ir">
                <span className="ir-k">Superficie neta (m²)</span>
                <span className="ir-v" style={{fontWeight:700,fontFamily:'var(--mono)',fontSize:14,color:'var(--accent)'}}>
                  {Math.round(Number(info.sba) * (1 - Number(info.ratio_perdida)/100)).toLocaleString('es-ES')} m²
                </span>
              </div>
            )}
            <InlineField label="Año construcción" value={info.anno_construccion||'—'} onSave={()=>setDirty(true)}>
              <input type="number" value={info.anno_construccion} onChange={e=>setI('anno_construccion',e.target.value)} style={inp} placeholder="—"/>
            </InlineField>
            <InlineField label="Año rehabilitación" value={info.anno_rehabilitacion||'—'} onSave={()=>setDirty(true)}>
              <input type="number" value={info.anno_rehabilitacion} onChange={e=>setI('anno_rehabilitacion',e.target.value)} style={inp} placeholder="—"/>
            </InlineField>
            <InlineField label="Asset Manager" value={info.asset_manager||'—'} onSave={()=>setDirty(true)}>
              <AssetManagerSearch value={info.asset_manager} onChange={v=>setI('asset_manager',v)}/>
            </InlineField>
            <div className="ir">
              <span className="ir-k">Nº edificios</span>
              <span className="ir-v" style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontWeight:700,fontFamily:'var(--mono)',fontSize:14}}>{nEdificios ?? 1}</span>
                <span style={{fontSize:9,color:'var(--text4)'}}>· desde Stacking Plan</span>
              </span>
            </div>
            {totalPlazas>0 && (
              <div className="ir" style={{alignItems:'flex-start',paddingTop:6,borderTop:'1px solid var(--border)',marginTop:4}}>
                <span className="ir-k">🅿 Plazas apar.</span>
                <span className="ir-v" style={{display:'flex',flexDirection:'column',gap:3}}>
                  <span style={{fontSize:15,fontWeight:700,color:'var(--text1)',fontFamily:'var(--mono)',lineHeight:1}}>{totalPlazas.toLocaleString('es-ES')}</span>
                  <span style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:2}}>
                    {byUbic.map(x=><span key={x.u} style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#f1f5f9',border:'1px solid #cbd5e1',color:'#475569',fontWeight:600}}>{x.u} {x.n}</span>)}
                    {byTipo.map(x=><span key={x.t} style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#ede9fe',border:'1px solid #c4b5fd',color:'#7c3aed',fontWeight:600}}>{x.t} {x.n}</span>)}
                    {byVeh.map(x=><span key={x.v} style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#f0fdf4',border:'1px solid #86efac',color:'#15803d',fontWeight:600}}>{x.v} {x.n}</span>)}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── DATOS URBANÍSTICOS ── */}
        <div className="info-block" style={{marginBottom:12}}>
          <div className="ib-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>🏛 DATOS URBANÍSTICOS</span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {catMsg === 'ok' && <span style={{fontSize:10,color:'var(--green)',fontWeight:600}}>✓ Sincronizado</span>}
              {catMsg && catMsg !== 'ok' && <span style={{fontSize:10,color:'var(--red)',maxWidth:260,textAlign:'right',lineHeight:1.3}}>{catMsg}</span>}
              <button className="ab-btn blue" onClick={syncCatastro} disabled={syncingCat}>
                {syncingCat ? '⟳ Consultando...' : '⟳ Sincronizar'}
              </button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 24px'}}>
            <div>
              <InlineField label="Ref. catastral" value={info.ref_catastral||'—'} onSave={()=>setDirty(true)}>
                <input value={info.ref_catastral} onChange={e=>setI('ref_catastral',e.target.value)} style={{...inp,fontFamily:'var(--mono)',fontSize:11}} placeholder="—"/>
              </InlineField>
              <InlineField label="Uso PGOU" value={info.uso_pgou||'—'} onSave={()=>setDirty(true)}>
                <input value={info.uso_pgou} onChange={e=>setI('uso_pgou',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
            </div>
            <div>
              <InlineField label="Clasificación" value={info.clasificacion_urb||'—'} onSave={()=>setDirty(true)}>
                <input value={info.clasificacion_urb} onChange={e=>setI('clasificacion_urb',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Calificación" value={info.calificacion_urb||'—'} onSave={()=>setDirty(true)}>
                <input value={info.calificacion_urb} onChange={e=>setI('calificacion_urb',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
            </div>
            <div>
              <InlineField label="Edificabilidad" value={info.edificabilidad||'—'} onSave={()=>setDirty(true)}>
                <input value={info.edificabilidad} onChange={e=>setI('edificabilidad',e.target.value)} style={inp} placeholder="—"/>
              </InlineField>
              <InlineField label="Sup. parcela (m²)" value={info.sup_parcela ? Number(info.sup_parcela).toLocaleString('es-ES')+' m²' : '—'} onSave={()=>setDirty(true)}>
                <input type="number" value={info.sup_parcela} onChange={e=>setI('sup_parcela',e.target.value)} style={{...inp,fontFamily:'var(--mono)'}} placeholder="—"/>
              </InlineField>
            </div>
          </div>
        </div>

        {/* ── SEGUIMIENTO COMERCIAL ── */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:12}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:11,fontWeight:600}}>📋 Seguimiento comercial <span style={{fontSize:9,color:'var(--text4)',fontWeight:400}}>· Sincronizado desde Ofertas y Demandas</span></div>
          </div>
          <div className="seg-2col">
            <div className="seg-block">
              <div className="seg-head">Presentaciones</div>
              <table className="seg-table">
                <thead><tr><th>Fecha</th><th>Demanda</th><th>Consultor</th><th>Feedback</th></tr></thead>
                <tbody>
                  <tr><td>01/03/2026</td><td>Oracle Spain</td><td>Álvaro S.</td><td className="fb-fin">Finalista</td></tr>
                  <tr><td>12/02/2026</td><td>Empresa XYZ</td><td>Álvaro S.</td><td className="fb-cur">En curso</td></tr>
                  <tr><td>20/01/2026</td><td>Generali RE</td><td>María R.</td><td style={{color:'var(--green)',fontWeight:600}}>Firmado</td></tr>
                </tbody>
              </table>
            </div>
            <div className="seg-block">
              <div className="seg-head">Visitas</div>
              <table className="seg-table">
                <thead><tr><th>Fecha</th><th>Demanda</th><th>M²</th><th>Feedback</th></tr></thead>
                <tbody>
                  <tr><td>15/03/2026</td><td>Oracle Spain</td><td>13.486</td><td className="fb-fin">Finalista</td></tr>
                  <tr><td>28/02/2026</td><td>Empresa XYZ</td><td>1.000</td><td className="fb-cur">En curso</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── OFERTAS ACTIVAS ── */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:12}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:11,fontWeight:600}}>📄 Ofertas activas <span style={{fontSize:9,color:'var(--text4)',fontWeight:400}}>· Gestionadas desde el módulo Ofertas</span></div>
          </div>
          <table className="dtbl">
            <thead><tr><th>Nº Oferta</th><th>Módulo</th><th>Sup. (m²)</th><th>Renta asking</th><th>Días comerc.</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              <tr>
                <td className="mono dtbl-link" onClick={()=>navigate('ficha-oferta')}>OLB001</td>
                <td>P5 + PB — Edif. A</td><td>698</td><td className="mono">10,5–14,5 €/m²</td>
                <td><span className="dias-pill">📅 127d</span></td>
                <td><span className="tag tag-blue">En curso</span></td>
                <td><button className="ra p" onClick={()=>navigate('ficha-oferta')}>Ver</button></td>
              </tr>
              <tr>
                <td className="mono dtbl-link">OLB002</td>
                <td>P2 — Edif. A</td><td>400</td><td className="mono">13,0 €/m²</td>
                <td><span className="dias-pill">📅 45d</span></td>
                <td><span className="tag tag-amber">En revisión</span></td>
                <td><button className="ra">Ver</button></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

/* ── Panel derecho ── */
function RightPanel({ navigate, nEdificios, plazas, esg, activo }) {
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
      <div className="rp-sec">
        <div className="rp-lbl">Asistente IA</div>
        <div className="ai-box">
          <div className="ai-head">
            <div className="ai-ico">✦</div>
            <span className="ai-lbl">Insight activo</span>
            <span className="ai-badge">Tiempo real</span>
          </div>
          <div className="ai-text">
            <strong>10.142 m² disponibles</strong> (21,6%). 2 break options vencidas o próximas. Renta zona 10,5 €/m² — margen de subida. Oracle en fase finalista para P1–P4.
          </div>
          <div className="ai-cta" onClick={()=>setChatOpen(v=>!v)}>✎ {chatOpen?'Cerrar chat':'Preguntar a la IA'}</div>
        </div>
        {chatOpen && (
          <div style={{marginTop:8,border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',background:'var(--surface)'}}>
            <div style={{maxHeight:180,overflowY:'auto',padding:'8px 10px',display:'flex',flexDirection:'column',gap:6}}>
              {chatLog.map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'85%',padding:'5px 9px',borderRadius:8,fontSize:11,lineHeight:1.4,
                    background:m.role==='user'?'var(--accent)':'var(--gray-lt)',
                    color:m.role==='user'?'#fff':'var(--text2)',
                    border:m.role==='ai'?'1px solid var(--border)':'none'
                  }}>{m.text}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',borderTop:'1px solid var(--border)',padding:'6px 8px',gap:6}}>
              <input style={{flex:1,border:'none',outline:'none',fontSize:11,fontFamily:'inherit',background:'transparent',color:'var(--text1)'}}
                placeholder="Pregunta sobre el activo..."
                value={chatMsg} onChange={e=>setChatMsg(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')sendChat()}}/>
              <button onClick={sendChat} style={{padding:'3px 10px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>→</button>
            </div>
          </div>
        )}
      </div>

      {/* 2. KPIs del activo */}
      {(()=>{
        const totalPlazas = (plazas||[]).reduce((s,p)=>s+p.cantidad,0)
        const nArrendatarios = new Set(
          RENT_ROLL_ROWS
            .filter(r => r.arrendatario !== 'DISPONIBLE' && r.arrendatario !== '—' && r.uso !== 'Parking')
            .map(r => r.arrendatario)
        ).size
        const sellos = [
          esg?.leed        && {label:`LEED ${esg.leed}`,              cls:'tag-leed'},
          esg?.breeam      && {label:`BREEAM ${esg.breeam}`,          cls:'tag-esg'},
          esg?.well        && {label:`WELL ${esg.well}`,              cls:'tag-purple'},
          esg?.dgnb        && {label:`DGNB ${esg.dgnb}`,             cls:'tag-blue'},
          esg?.wiredscore  && {label:`WiredScore ${esg.wiredscore}`,  cls:'tag-gray'},
        ].filter(Boolean)
        return (
          <div className="rp-sec">
            <div className="rp-lbl">KPIs del activo</div>
            <div className="kf-grid">
              <div className="kf">
                <div className="kf-lbl">SBA total</div>
                <div className="kf-val">{activo?.sba ? activo.sba.toLocaleString('es-ES') + ' m²' : '—'}</div>
              </div>
              <div className="kf">
                <div className="kf-lbl">Nº edificios</div>
                <div className="kf-val">{nEdificios ?? 1}</div>
              </div>
              <div className="kf">
                <div className="kf-lbl">Total plazas</div>
                <div className="kf-val">{totalPlazas > 0 ? totalPlazas.toLocaleString('es-ES') : '—'}</div>
              </div>
              <div className="kf">
                <div className="kf-lbl">Nº arrendatarios</div>
                <div className="kf-val">{nArrendatarios}</div>
              </div>
            </div>
            <div style={{marginTop:8}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:5}}>Sellos sostenibilidad</div>
              {sellos.length > 0 ? (
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                  {sellos.map(s=>(
                    <span key={s.label} className={`tag ${s.cls}`} style={{fontSize:9,padding:'2px 7px'}}>{s.label}</span>
                  ))}
                </div>
              ) : (
                <span style={{fontSize:11,color:'var(--text4)'}}>—</span>
              )}
            </div>
          </div>
        )
      })()}

      {/* 3. Ubicación / datos de zona */}
      <div className="rp-sec">
        <div className="rp-lbl">Ubicación · datos de zona</div>
        <div className="kf-grid">
          <div className="kf"><div className="kf-lbl">Renta zona (media oferta)</div><div className="kf-val">10,5 €/m²</div></div>
          <div className="kf"><div className="kf-lbl">Disponibilidad zona</div><div className="kf-val amber">11,4%</div></div>
        </div>
      </div>

      {/* 4. KPIs Financieros */}
      <div className="rp-sec">
        <div className="rp-lbl">KPIs Financieros</div>
        <div className="kf-grid">
          <div className="kf"><div className="kf-lbl">Ocupación</div><div className="kf-val amber">78,4%</div></div>
          <div className="kf"><div className="kf-lbl">Ingresos brutos</div><div className="kf-val">3,2 M€/año</div></div>
          <div className="kf"><div className="kf-lbl">WAULT</div><div className="kf-val">2,8 años</div></div>
          <div className="kf"><div className="kf-lbl">Yield</div><div className="kf-val">5,2%</div></div>
          <div className="kf"><div className="kf-lbl">Precio Adquisición</div><div className="kf-val">130 M€</div></div>
        </div>
      </div>

      {/* 5. Vencimientos contractuales */}
      <div className="rp-sec">
        <div className="rp-lbl">Vencimientos contractuales</div>
        {[
          {color:'var(--red)',    label:'Celonis — Break option', sub:'Oct 2025 · 2.702 m²',  urgency:'Vencido'},
          {color:'var(--amber)', label:'Oracle — Contrato',       sub:'Mar 2026 · 13.486 m²', urgency:'Próximo'},
          {color:'var(--amber)', label:'Empresa XYZ — Break',     sub:'Dic 2026 · 1.000 m²',  urgency:'6 meses'},
          {color:'var(--gray)',  label:'Repsol — Break option',   sub:'Jun 2027 · 1.967 m²',  urgency:''},
        ].map((v,i)=>(
          <div key={i} className="venc-item">
            <div className="vd" style={{background:v.color,marginTop:4}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:500,color:v.color==='var(--gray)'?'var(--text)':v.color}}>{v.label}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>{v.sub}</div>
            </div>
            {v.urgency && <span style={{fontSize:9,fontWeight:600,color:v.color,background:v.color==='var(--red)'?'var(--red-lt)':v.color==='var(--amber)'?'var(--amber-lt)':'var(--gray-lt)',border:`1px solid ${v.color==='var(--red)'?'var(--red-bd)':v.color==='var(--amber)'?'var(--amber-bd)':'var(--gray-bd)'}`,padding:'1px 5px',borderRadius:8,whiteSpace:'nowrap'}}>{v.urgency}</span>}
          </div>
        ))}
      </div>

      {/* 6. Propuestas / Proyectos en curso */}
      <div className="rp-sec">
        <div className="rp-lbl">Propuestas / Proyectos en curso</div>
        {[
          {ico:'🏗',label:'Reforma integral lobby',sub:'Arquitectura · En curso',color:'var(--amber)'},
          {ico:'📋',label:'Mandato captación P4-P5',sub:'Leasing · Activo',color:'var(--accent)'},
        ].map((p,i)=>(
          <div key={i} className="proj-item">
            <div style={{width:26,height:26,borderRadius:5,background:'var(--gray-lt)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>{p.ico}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:500,color:'var(--text)'}}>{p.label}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>{p.sub}</div>
            </div>
            <div style={{width:6,height:6,borderRadius:'50%',background:p.color,flexShrink:0,marginTop:5}}/>
          </div>
        ))}
      </div>

      {/* 7. Historial */}
      <div className="rp-sec">
        <div className="rp-lbl">Historial</div>
        {[
          {tag:'tag-teal',  label:'Transacción', desc:'Repsol — Renovación',   fecha:'Mar 2022'},
          {tag:'tag-blue',  label:'Mandato',     desc:'Exclusiva leasing 2023', fecha:'Ene 2023'},
          {tag:'tag-amber', label:'Valoración',  desc:'Anual Q1 2026',          fecha:'Mar 2026'},
        ].map((h,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:6,padding:'4px 0',borderBottom:i<2?'1px solid var(--border)':'none'}}>
            <span className={`tag ${h.tag}`} style={{fontSize:9,marginTop:1,flexShrink:0}}>{h.label}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:'var(--text2)'}}>{h.desc}</div>
              <div style={{fontSize:10,color:'var(--text4)'}}>{h.fecha}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 8. Propietario y contactos */}
      <div className="rp-sec">
        <div className="rp-lbl">Propietario</div>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
          <div style={{width:28,height:28,borderRadius:6,background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'var(--accent)',flexShrink:0}}>BC</div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>Barings Core Spain SOCIMI</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>Fondo inversión · Yield 5,2%</div>
          </div>
        </div>
        <div className="cont-row">
          <div className="c-av" style={{background:'#dbeafe',color:'#1e40af'}}>AS</div>
          <div><div className="c-name">Sierra Álvaro</div><div className="c-role">Transaction Spain · Responsable</div></div>
        </div>
        <div className="cont-row">
          <div className="c-av" style={{background:'#fce7f3',color:'#9d174d'}}>MR</div>
          <div><div className="c-name">María Ruiz</div><div className="c-role">Leasing Oficinas MAD</div></div>
        </div>
      </div>

      {/* 9. Documentos recientes */}
      <div className="rp-sec">
        <div className="rp-lbl">Documentos recientes</div>
        {[
          {ico:'📊',name:'Dossier Avalon',fecha:'07/02/2026',tag:'Comercial',tagCls:'tag-blue'},
          {ico:'💰',name:'Valoración Q1 2026',fecha:'20/03/2026',tag:'Valoración',tagCls:'tag-amber'},
          {ico:'📋',name:'Rent Roll 2026',fecha:'01/01/2026',tag:'Comercial',tagCls:'tag-blue'},
        ].map((d,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 0',borderBottom:i<2?'1px solid var(--border)':'none'}}>
            <span style={{fontSize:16,flexShrink:0}}>{d.ico}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:500,color:'var(--accent)',cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
              <div style={{fontSize:10,color:'var(--text4)'}}>{d.fecha}</div>
            </div>
            <span className={`tag ${d.tagCls}`} style={{fontSize:9,flexShrink:0}}>{d.tag}</span>
          </div>
        ))}
        <span className="add-link">Ver todos (8)</span>
      </div>

    </div>
  )
}

/* ══ Actividades follow-up ══ */
const TIPO_TAG_ACT = { Email:'tag-blue', Llamada:'tag-green', Reunión:'tag-purple', Tarea:'tag-gray', Visita:'tag-teal', Nota:'tag-gray' }
const TIPO_ICO_ACT = { Email:'📧', Llamada:'📞', Reunión:'🤝', Tarea:'✅', Visita:'🏢', Nota:'📝' }
const ACT_EST_ACT  = { Abierto:'tag-amber', Finalizado:'tag-gray', 'En curso':'tag-blue', Realizada:'tag-green' }
const FOLLOWUP_ACTS = [
  { id:'ACT-AV-01', tipo:'Reunión',  asunto:'Reunión propietario Barings — revisión estado comercialización Q1',   fecha:'15/01/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-AV-02', tipo:'Visita',   asunto:'Visita técnica Oracle Spain SL — P1–P4 Edif. D (13.486 m²)',         fecha:'20/02/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Realizada'  },
  { id:'ACT-AV-03', tipo:'Email',    asunto:'Envío informe ocupación Q1 2026 al asset manager de Barings',        fecha:'01/03/2026', user:'GOMEZ Ignacio', initials:'GI', bg:'#fdf4ff', color:'#7e22ce', estado:'Finalizado' },
  { id:'ACT-AV-04', tipo:'Llamada',  asunto:'Llamada Asset Manager Barings — interés mandato captación P4–P5',    fecha:'12/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-AV-05', tipo:'Reunión',  asunto:'Visita Oracle Spain — segunda visita + negociación condiciones',     fecha:'28/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-AV-06', tipo:'Email',    asunto:'Contraoferta Oracle enviada a propietario — pendiente validación',   fecha:'02/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-AV-07', tipo:'Tarea',    asunto:'Preparar informe de gestión mensual para Barings — deadline 15/04', fecha:'07/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'En curso'   },
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

/* ══════════════════════════════════════════════════════════ */
export default function FichaActivo() {
  const { navigate, params } = useNav()
  const isNew = !!params?.new && !params?.ref
  const [activeTab, setActiveTab]       = useState('at-info')
  const [caracTab, setCaracTab]         = useState('ct-transporte')
  const [docCat,   setDocCat]           = useState('todos')
  const [showTarea, setShowTarea]       = useState(false)
  const [plazas, setPlazas]             = useState(INIT_PLAZAS)
  const [showAddPlaza, setShowAddPlaza] = useState(false)
  const [newPlaza, setNewPlaza]         = useState({ubicacion:'Interior',tipo:'Simple',vehiculo:'Coches',cantidad:1})
  // ESG / Normativa
  const [esg, setEsg] = useState({ leed:'', breeam:'', well:'', dgnb:'', wiredscore:'', energia:'', consumo:'' })
  // Catastro sync (info adicional)
  const [catSyncAd, setCatSyncAd]     = useState(false)
  const [catSyncMsgAd, setCatSyncMsgAd] = useState('')
  // Transporte
  const [transportes, setTransportes] = useState([
    {id:1, medio:'Metro', linea:'L7', descripcion:'Estadio Olímpico', tiempo:'5 min'},
    {id:2, medio:'Autobús', linea:'23, 37, 140', descripcion:'', tiempo:''},
    {id:3, medio:'Coche', linea:'', descripcion:'M-30 · A-2', tiempo:''},
  ])
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
  const infoSaveRef = useRef(null) // ref to TabInfo's handleSave
  const infoSyncRef = useRef(null) // ref to TabInfo's syncCatastro (available for future use)

  useEffect(() => {
    if (!params?.ref) return
    setLoadingActivo(true)
    supabase.from('activos').select('*').eq('ref', params.ref).single()
      .then(({ data }) => {
        if (data) setActivo(data)
        setLoadingActivo(false)
      })
  }, [params?.ref])

  const handleCreateActivo = async () => {
    setSubmitted(true)
    const missing = []
    if (!newForm.direccion) missing.push('Dirección')
    if (!newForm.tipo_activo) missing.push('Tipo de activo')
    if (!newForm.uso) missing.push('Uso principal')
    if (missing.length) { setSaveErr(`Campos obligatorios: ${missing.join(', ')}`); return }
    const nombre = newForm.nombre || newForm.direccion.split(',')[0].trim()
    setSaving(true); setSaveErr('')
    const ref = genRefFA(newForm.ciudad, newForm.uso)
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
        cp:                  newForm.cp                || null,
      })
      setSaving(false)
      if (error) {
        // If extra columns don't exist yet, retry with base payload
        if (error.message?.includes('column') || error.code === '42703') {
          const { error: e2 } = await supabase.from('activos').insert(payload)
          if (e2) { setSaveErr(e2.message); return }
        } else {
          setSaveErr(error.message); return
        }
      }
    } catch(e) {
      setSaving(false)
      setSaveErr(String(e)); return
    }
    setSaving(false)
    navigate('ficha-activo', { ref })
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
            {saveErr && <span style={{fontSize:11,color:'var(--red)',marginLeft:8}}>{saveErr}</span>}
          </>
        ) : (
          <>
            <button className="ab-btn save" onClick={() => infoSaveRef.current?.()}>💾 Guardar</button>
            <button className="ab-btn" onClick={async () => { await infoSaveRef.current?.(); navigate('activos', { highlightRef: activo?.ref ?? params?.ref }) }}>Guardar y cerrar</button>
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
              <div className="ah-ico">{isNew ? (USO_ICO[newForm.uso] || '🏢') : '🏢'}</div>
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
                        {displayNombre ?? activo?.nombre ?? '—'}
                        <span style={{fontSize:11,color:'var(--text4)',fontWeight:400,opacity:0.6}}>✎</span>
                      </div>
                    )}
                    <div className="ah-addr">
                      {(displayDireccion ?? activo?.direccion) && <>📍 {displayDireccion ?? activo.direccion} · </>}
                      {[activo?.zona, activo?.subzona, activo?.ciudad].filter(Boolean).join(' · ')}
                    </div>
                    <div className="ah-tags">
                      {activo?.uso && <span className={`tag ${activo.uso === 'Oficinas' ? 'tag-blue' : activo.uso === 'Logístico' ? 'tag-teal' : activo.uso === 'Data Center' ? 'tag-blue' : activo.uso === 'Residencial' ? 'tag-amber' : 'tag-purple'}`}>{activo.uso}</span>}
                      {activo?.leed && <span className="tag tag-leed">LEED {activo.leed}</span>}
                      {activo?.esg_rating && <span className="tag tag-esg">ESG {activo.esg_rating}</span>}
                      {(liveEdifCount ?? activo?.n_edificios) > 1 && <span className="tag tag-gray">{liveEdifCount ?? activo.n_edificios} edificios</span>}
                      {activo?.dias_comercializacion > 0 && <span className="dias-pill">📅 {activo.dias_comercializacion} días en comercialización</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
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
              onInfoSaved={async ({nombre,direccion})=>{
                if(nombre!==undefined) setDisplayNombre(nombre||null)
                if(direccion!==undefined) setDisplayDireccion(direccion||null)
                // Reload activo so Información adicional reflects the latest saved data (ref_catastral, etc.)
                const { data } = await supabase.from('activos').select('*').eq('ref', params.ref).single()
                if (data) setActivo(data)
              }}/>
          )}

          {/* ── TAB: Stacking Plan — always mounted to preserve state ── */}
          <div className="tab-content active" style={activeTab !== 'at-stacking' ? {display:'none'} : undefined}>
            <div className="info-pad">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>Stacking Plan</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>Distribución de usos, propietarios y arrendatarios por planta y edificio</div>
                </div>
              </div>
              <StackingPlan initBuildings={isNew ? [] : (BUILDINGS_BY_ACTIVO[params?.ref] || undefined)} onCountChange={setLiveEdifCount}/>
            </div>
          </div>

          {/* ── TAB: Características ── */}
          {activeTab==='at-caract' && (()=>{
            const usoActivo = activo?.uso || ''
            const usoLabel = usoActivo || 'Uso principal'
            const usoIco = USO_ICO[usoActivo] || '🏢'
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
                  {[['ct-transporte','Transporte'],['ct-normativa','Normativa / ESG'],['ct-generales','Características generales'],[`ct-uso`,`${usoIco} ${usoLabel}`],['ct-plazas','Plazas']].map(([k,l])=>(
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
                            <td><span style={{fontSize:10,padding:'2px 8px',borderRadius:9,background:'#eff6ff',border:'1px solid #bfdbfe',color:'#1d4ed8',fontWeight:600}}>{t.medio}</span></td>
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
                  const usoFields = CARAC_USO_FIELDS[usoActivo] || []
                  const cSel = {padding:'4px 8px',border:'1px solid var(--border)',borderRadius:5,fontSize:11,fontFamily:'inherit',cursor:'pointer',outline:'none',minWidth:160}
                  const cInp = {padding:'4px 8px',border:'1px solid var(--border)',borderRadius:5,fontSize:11,fontFamily:'inherit',outline:'none',flex:1,minWidth:120,background:'transparent'}
                  const rowSt = {display:'grid',gridTemplateColumns:'160px 1fr 1fr',gap:8,padding:'8px 12px',borderBottom:'1px solid var(--border)',alignItems:'center'}
                  const lblSt = {fontSize:11,fontWeight:600,color:'var(--text2)'}
                  return (
                    <div className="info-block">
                      <div className="ib-title" style={{display:'flex',alignItems:'center',gap:8}}>
                        <span>{usoIco} CARACTERÍSTICAS TÉCNICAS</span>
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
                                  <span style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#ede9fe',border:'1px solid #c4b5fd',color:'#7c3aed',fontWeight:600}}>{p.tipo}</span>
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
          {activeTab==='at-prop' && (
            <div className="tab-content active">
              <div className="info-pad">

                {/* PROPIETARIOS */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{fontSize:13,fontWeight:700,letterSpacing:'.01em',color:'var(--text1)'}}>PROPIETARIOS</div>
                  <button className="ab-btn blue" onClick={()=>navigate('ficha-propietario')}>+ Crear propietario</button>
                </div>
                <table className="pat-table" style={{marginBottom:20}}>
                  <thead><tr><th>Perfil</th><th>Propietario</th><th>SBA</th><th>Yield</th><th>Precio compra</th><th>Año compra</th><th>Trim.</th><th></th></tr></thead>
                  <tbody>
                    <tr>
                      <td>Fondo inversión</td>
                      <td><span className="pat-link">Barings Core Spain SOCIMI</span></td>
                      <td>46.956</td><td>5.2%</td><td>130 M€</td>
                      <td>2018</td><td><span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'#dbeafe',color:'#1e40af',fontWeight:600}}>Q2</span></td>
                      <td><button className="ra">Ver</button></td>
                    </tr>
                  </tbody>
                </table>

                {/* ARRENDATARIOS */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{fontSize:13,fontWeight:700,letterSpacing:'.01em',color:'var(--text1)'}}>ARRENDATARIOS</div>
                  <button className="ab-btn blue" onClick={()=>navigate('ficha-arrendatario')}>+ Crear arrendatario</button>
                </div>
                <table className="pat-table" style={{marginBottom:20}}>
                  <thead><tr><th>Arrendatario</th><th>Uso</th><th>Sup. (m²)</th><th>Renta</th><th>Break option</th><th>Vencimiento</th><th>Año alquiler</th><th>Trim.</th><th></th></tr></thead>
                  <tbody>
                    <tr>
                      <td><span className="pat-link">Celonis</span></td>
                      <td>Oficinas</td><td>2.702</td><td>14,50</td>
                      <td style={{color:'var(--amber)',fontWeight:600}}>Oct 2025</td>
                      <td style={{color:'var(--amber)',fontWeight:600}}>Oct 2026</td>
                      <td>2021</td><td><span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'#dbeafe',color:'#1e40af',fontWeight:600}}>Q3</span></td>
                      <td><button className="ra">Ver</button></td>
                    </tr>
                    <tr>
                      <td><span className="pat-link">Repsol</span></td>
                      <td>Oficinas</td><td>1.967</td><td>13,80</td>
                      <td style={{color:'var(--green)',fontWeight:600}}>Jun 2027</td>
                      <td style={{color:'var(--green)',fontWeight:600}}>Jun 2029</td>
                      <td>2022</td><td><span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'#dbeafe',color:'#1e40af',fontWeight:600}}>Q1</span></td>
                      <td><button className="ra">Ver</button></td>
                    </tr>
                  </tbody>
                </table>

                {/* NOTA read-only */}
                <div style={{padding:'10px 14px',background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',fontSize:11,color:'var(--text4)',marginBottom:16}}>
                  Las <strong>ofertas activas</strong> y las <strong>transacciones</strong> se gestionan desde sus módulos correspondientes y se sincronizan automáticamente con este activo.
                </div>

              </div>
            </div>
          )}

          {/* ── TAB: Multimedia ── */}
          {activeTab==='at-fotos' && <TabMultimedia/>}

          {/* ── TAB: Documentos ── */}
          {activeTab==='at-docs' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div style={{fontSize:14,fontWeight:600}}>Documentos</div>
                <button className="ab-btn blue">↑ Cargar</button>
              </div>
              <div className="doc-cats">
                {[['todos','📁','Todos',8],['comercial','📊','Comercial',3],['tecnica','🔧','Técnica',2],['marketing','🎯','Marketing',1],['valoraciones','💰','Valoraciones',1],['arquitectura','📐','Arquitectura',1],['informes','📋','Informes',0]].map(([k,ico,lbl,cnt])=>(
                  <div key={k} className={`doc-cat ${docCat===k?'active':''}`} onClick={()=>setDocCat(k)}>
                    <div className="doc-cat-ico">{ico}</div>
                    <div className="doc-cat-name">{lbl}</div>
                    <div className="doc-cat-count">{cnt}</div>
                  </div>
                ))}
              </div>
              <div className="doc-drop">↑ Arrastra documentos aquí o haz clic para cargar</div>
              <table className="doc-table">
                <thead><tr><th>Documento</th><th>Categoría</th><th>Ámbito / Planta</th><th>Fecha</th><th>Por</th><th>Tamaño</th><th></th></tr></thead>
                <tbody>
                  <tr><td><span className="doc-link">📊 Dossier Avalon</span></td><td><span className="doc-tag" style={{background:'var(--accent-lt)',color:'var(--accent)'}}>Comercial</span></td><td><span className="doc-tag" style={{background:'var(--gray-lt)',color:'var(--text3)'}}>Edificio completo</span></td><td>07/02/2026</td><td>Álvaro Sierra</td><td>4.2 MB</td><td style={{display:'flex',gap:4}}>⬇ ✏ 🗑</td></tr>
                  <tr><td><span className="doc-link">📈 Stacking plan Q1 2026</span></td><td><span className="doc-tag" style={{background:'var(--accent-lt)',color:'var(--accent)'}}>Comercial</span></td><td><span className="doc-tag" style={{background:'var(--gray-lt)',color:'var(--text3)'}}>Edificio completo</span></td><td>07/02/2026</td><td>Álvaro Sierra</td><td>1.1 MB</td><td style={{display:'flex',gap:4}}>⬇ ✏ 🗑</td></tr>
                  <tr><td><span className="doc-link">💰 Valoración Q1 2026</span></td><td><span className="doc-tag" style={{background:'var(--amber-lt)',color:'var(--amber)'}}>Valoraciones</span></td><td><span className="doc-tag" style={{background:'var(--gray-lt)',color:'var(--text3)'}}>Edificio completo</span></td><td>20/03/2026</td><td>Jorge López</td><td>5.6 MB</td><td style={{display:'flex',gap:4}}>⬇ ✏ 🗑</td></tr>
                  <tr><td><span className="doc-link">📋 Rent Roll 2026</span></td><td><span className="doc-tag" style={{background:'var(--accent-lt)',color:'var(--accent)'}}>Comercial</span></td><td><span className="doc-tag" style={{background:'#f0fdfa',color:'#0f766e',border:'1px solid #99f6e4'}}>P3</span></td><td>01/01/2026</td><td>Álvaro Sierra</td><td>680 KB</td><td style={{display:'flex',gap:4}}>⬇ ✏ 🗑</td></tr>
                </tbody>
              </table>
            </div></div>
          )}

          {/* ── TAB: Información adicional ── */}
          {activeTab==='at-adicional' && (
            <div className="tab-content active"><div className="info-pad">

              {/* ── Ficha comercial ── */}
              <div style={{marginBottom:22}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Ficha comercial <span style={{fontSize:10,fontWeight:400,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>· RESUMEN EJECUTIVO</span></div>
                <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'16px 18px',background:'var(--surface)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 24px',marginBottom:12}}>
                    <div className="ir"><span className="ir-k">Activo</span><span className="ir-v" style={{fontWeight:700}}>{activo?.nombre || '—'}</span></div>
                    <div className="ir"><span className="ir-k">Propietario</span><span className="ir-v">{activo?.propietario || '—'}</span></div>
                    <div className="ir"><span className="ir-k">Uso</span><span className="ir-v">{activo?.uso || '—'}</span></div>
                    <div className="ir"><span className="ir-k">SBA (m²)</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{activo?.sba ? activo.sba.toLocaleString('es-ES') : '—'}</span></div>
                    <div className="ir"><span className="ir-k">Zona</span><span className="ir-v">{activo?.zona || '—'}</span></div>
                    <div className="ir"><span className="ir-k">Subzona</span><span className="ir-v">{activo?.subzona || '—'}</span></div>
                    <div className="ir"><span className="ir-k">Ciudad</span><span className="ir-v">{activo?.ciudad || '—'}</span></div>
                    <div className="ir"><span className="ir-k">Ocupación</span><span className="ir-v" style={{fontWeight:700}}>{activo?.occupancy_rate != null ? `${activo.occupancy_rate}%` : '—'}</span></div>
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button onClick={()=>exportFichaActivo()} style={{padding:'5px 14px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
                      <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 1v8M4 6l3 3 3-3"/><path d="M2 11h10" strokeLinecap="round"/></svg>
                      Exportar .pdf
                    </button>
                    <button style={{padding:'5px 14px',background:'none',border:'1px solid var(--border)',color:'var(--text2)',borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
                      🔗 Generar enlace
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Ficha detallada ── */}
              <div style={{marginBottom:22}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Ficha detallada <span style={{fontSize:10,fontWeight:400,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>· INFORME TÉCNICO COMPLETO</span></div>
                <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'16px 18px',background:'var(--surface)'}}>
                  <div style={{fontSize:11,color:'var(--text3)',marginBottom:12,lineHeight:1.5}}>
                    Informe técnico completo con datos generales, superficies, características técnicas, ESG, stacking plan, rent roll, propietarios y arrendatarios.
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button onClick={()=>exportFichaActivo()} style={{padding:'5px 14px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
                      <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 1v8M4 6l3 3 3-3"/><path d="M2 11h10" strokeLinecap="round"/></svg>
                      Exportar .pdf
                    </button>
                    <button style={{padding:'5px 14px',background:'none',border:'1px solid var(--border)',color:'var(--text2)',borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
                      🔗 Generar enlace
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Exportar ── */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Exportar <span style={{fontSize:10,fontWeight:400,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>· DOCUMENTACIÓN DEL ACTIVO</span></div>
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  {/* Rent Roll Excel */}
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'14px 18px',background:'var(--surface)',display:'flex',alignItems:'flex-start',gap:12,minWidth:260,flex:1}}>
                    <div style={{width:36,height:36,borderRadius:8,background:'#f0fdf4',border:'1px solid #bbf7d0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="#16a34a" strokeWidth="1.5"><rect x="3" y="2" width="14" height="16" rx="1.5"/><path d="M7 6h6M7 9h6M7 12h4"/><path d="M11 15l2-2-2-2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>Rent Roll</div>
                      <div style={{fontSize:10,color:'var(--text3)',marginBottom:10,lineHeight:1.4}}>Exporta el rent roll completo del activo con arrendatarios, superficies, rentas, vencimientos y break options.</div>
                      <button onClick={()=>exportRentRoll('P.E Avalon')}
                        style={{padding:'5px 14px',background:'#16a34a',color:'#fff',border:'none',borderRadius:5,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
                        <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 1v8M4 6l3 3 3-3"/><path d="M2 11h10" strokeLinecap="round"/></svg>
                        Exportar .xlsx
                      </button>
                    </div>
                  </div>

                  {/* Ficha PDF */}
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'14px 18px',background:'var(--surface)',display:'flex',alignItems:'flex-start',gap:12,minWidth:260,flex:1}}>
                    <div style={{width:36,height:36,borderRadius:8,background:'#eff6ff',border:'1px solid #bfdbfe',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="1.5"><rect x="3" y="2" width="14" height="16" rx="1.5"/><path d="M7 7h6M7 10h4"/><path d="M7 13h2"/></svg>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>Ficha del activo</div>
                      <div style={{fontSize:10,color:'var(--text3)',marginBottom:10,lineHeight:1.4}}>Exporta la ficha completa del activo en PDF con información general, rent roll resumido y próximos vencimientos.</div>
                      <button onClick={()=>exportFichaActivo()}
                        style={{padding:'5px 14px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
                        <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 1v8M4 6l3 3 3-3"/><path d="M2 11h10" strokeLinecap="round"/></svg>
                        Exportar .pdf
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Integraciones externas ── */}
              {(()=>{
                const refcat   = activo?.ref_catastral || null
                const fichaUrl = refcat ? `https://www1.sedecatastro.gob.es/CYCBienInmueble/SECCallejero.aspx?refcat=${refcat}` : null
                const visorUrl = refcat ? `https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?tipo=I&refcat=${refcat}` : null
                const handleSyncAd = async () => {
                  const coords = activo?.coordenadas || ''
                  if (!coords) { setCatSyncMsgAd('Sin coordenadas en la ficha'); return }
                  const [latStr, lngStr] = coords.split(',').map(s=>s.trim())
                  if (isNaN(+latStr)||isNaN(+lngStr)) { setCatSyncMsgAd('Coordenadas inválidas'); return }
                  setCatSyncAd(true); setCatSyncMsgAd('')
                  try {
                    const data = await fetchCatastro(latStr, lngStr)
                    await supabase.from('activos').update({
                      ref_catastral:     data.ref_catastral     || null,
                      uso_pgou:          data.uso_pgou          || null,
                      sup_parcela:       data.sup_parcela       ?? null,
                      anno_construccion: data.anno_construccion ?? null,
                      clasificacion_urb: data.clasificacion_urb || null,
                      calificacion_urb:  data.calificacion_urb  || null,
                      edificabilidad:    data.edificabilidad    || null,
                    }).eq('ref', activo.ref)
                    // Recargar activo para que los links aparezcan inmediatamente
                    const { data: fresh } = await supabase.from('activos').select('*').eq('ref', activo.ref).single()
                    if (fresh) setActivo(fresh)
                    setCatSyncMsgAd('ok'); setTimeout(()=>setCatSyncMsgAd(''),4000)
                  } catch(e) { setCatSyncMsgAd(e.message||'Error') }
                  finally { setCatSyncAd(false) }
                }
                return (
                  <>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Extracción de datos <span style={{fontSize:10,fontWeight:400,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>· INTEGRACIONES EXTERNAS</span></div>
                    <div className="info-2col" style={{marginBottom:20}}>
                      {/* Catastro */}
                      <div className="info-block">
                        <div className="ib-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <span>🏛 Catastro</span>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            {catSyncMsgAd==='ok' && <span style={{fontSize:9,color:'var(--green)',fontWeight:600}}>✓ Sincronizado</span>}
                            {catSyncMsgAd&&catSyncMsgAd!=='ok' && <span style={{fontSize:9,color:'var(--red)'}}>{catSyncMsgAd}</span>}
                            <button onClick={handleSyncAd} disabled={catSyncAd}
                              style={{padding:'2px 8px',fontSize:9,fontWeight:600,fontFamily:'inherit',cursor:'pointer',background:'var(--accent)',color:'#fff',border:'none',borderRadius:4,opacity:catSyncAd?0.7:1,whiteSpace:'nowrap'}}>
                              {catSyncAd?'⟳ Consultando…':'⟳ Sincronizar'}
                            </button>
                          </div>
                        </div>
                        <div className="ir">
                          <span className="ir-k">Ref. catastral</span>
                          {refcat
                            ? <span className="ir-v mono" style={{fontSize:10,color:'var(--accent)',fontWeight:600}}>{refcat}</span>
                            : <span className="ir-v" style={{color:'var(--text4)',fontSize:10}}>— (sincroniza para obtenerla)</span>}
                        </div>
                        <div className="ir" style={{gap:6,marginTop:4}}>
                          <span className="ir-k">Ficha catastral</span>
                          {fichaUrl
                            ? <a href={fichaUrl} target="_blank" rel="noreferrer" style={{fontSize:10,color:'var(--accent)',fontWeight:600,textDecoration:'none'}}>Abrir en Catastro ↗</a>
                            : <span style={{fontSize:10,color:'var(--text4)'}}>—</span>}
                        </div>
                        <div className="ir" style={{gap:6,marginTop:4}}>
                          <span className="ir-k">Visor cartografía</span>
                          {visorUrl
                            ? <a href={visorUrl} target="_blank" rel="noreferrer" style={{fontSize:10,color:'var(--accent)',fontWeight:600,textDecoration:'none'}}>Abrir visor ↗</a>
                            : <span style={{fontSize:10,color:'var(--text4)'}}>—</span>}
                        </div>
                      </div>
                      {/* Visor Urbanístico */}
                      <div className="info-block">
                        <div className="ib-title">🗺 Visor Urbanístico</div>
                        {[
                          {ciudad:'Madrid',    lbl:'SIGUR Madrid',     url:'https://sig.madrid.es/SigGeoportal/'},
                          {ciudad:'Barcelona', lbl:'Urbanisme BCN',    url:'https://w133.bcn.cat/APPS/geoportal/AppGeoportal.html'},
                          {ciudad:'Valencia',  lbl:'SIT Valencia',     url:'https://sit.valencia.es/GEOSAT/'},
                        ].map(v=>(
                          <div key={v.ciudad} className="ir" style={{gap:6}}>
                            <span className="ir-k" style={{minWidth:70}}>{v.ciudad}</span>
                            <a href={v.url} target="_blank" rel="noreferrer" style={{fontSize:10,color:'var(--accent)',fontWeight:600,textDecoration:'none'}}>{v.lbl} ↗</a>
                          </div>
                        ))}
                      </div>
                      {/* INE */}
                      <div className="info-block"><div className="ib-title">📊 INE</div><div className="ir"><span className="ir-k">Estadísticas del barrio</span><a href="https://www.ine.es/censos2021/" target="_blank" rel="noreferrer" style={{fontSize:10,color:'var(--accent)',fontWeight:600,textDecoration:'none'}}>Abrir INE ↗</a></div></div>
                      {/* Registradores */}
                      <div className="info-block"><div className="ib-title">🏷 Registradores</div><div className="ir"><span className="ir-k">Nota simple</span><a href="https://www.registradores.org/tools/servicios/solicitud-nota-simple-informativa/" target="_blank" rel="noreferrer" style={{fontSize:10,color:'var(--accent)',fontWeight:600,textDecoration:'none'}}>Solicitar ↗</a></div></div>
                    </div>
                  </>
                )
              })()}
            </div></div>
          )}

          {/* ── TAB: Vista 360° — Actividad transversal + Seguimiento ── */}
          {activeTab==='at-360' && (
            <div className="tab-content active"><div className="info-pad">

              {/* KPI strip */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                {[
                  {lbl:'Total actividades', val:FOLLOWUP_ACTS.length,                                                          color:'var(--text1)'},
                  {lbl:'Reuniones / Visitas',val:FOLLOWUP_ACTS.filter(a=>a.tipo==='Reunión'||a.tipo==='Visita').length,         color:'var(--purple)'},
                  {lbl:'Emails / Llamadas', val:FOLLOWUP_ACTS.filter(a=>a.tipo==='Email'||a.tipo==='Llamada').length,           color:'var(--accent)'},
                  {lbl:'Pendientes',        val:FOLLOWUP_ACTS.filter(a=>a.estado==='Abierto'||a.estado==='En curso').length,    color:'var(--red)'},
                ].map(k=>(
                  <div key={k.lbl} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 12px',textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>{k.lbl}</div>
                    <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:k.color}}>{k.val}</div>
                  </div>
                ))}
              </div>

              {/* Timeline de actividad */}
              <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Actividad transversal · Timeline</div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:16}}>
                {[
                  {av:'AI',bg:'var(--purple-lt)',color:'var(--purple)',name:'IA',msg:'10.142 m² disponibles. 2 break options próximas.',badge:{bg:'var(--purple-lt)',color:'var(--purple)',bc:'var(--purple-bd)',lbl:'IA'},time:'Hoy · Automático'},
                  {av:'AS',bg:'#dbeafe',color:'#1e40af',name:'Álvaro Sierra',msg:'registró visita con Oracle',badge:{bg:'var(--accent-lt)',color:'var(--accent)',bc:'var(--accent-bd)',lbl:'VISITA'},time:'Ayer, 16:30'},
                  {av:'MR',bg:'#fce7f3',color:'#9d174d',name:'María Ruiz',msg:'envió Deal Room a Celonis',badge:{bg:'var(--green-lt)',color:'var(--green)',bc:'var(--green-bd)',lbl:'OFERTA'},time:'23/03/2026'},
                  {av:'JL',bg:'#dcfce7',color:'#166534',name:'Jorge López',msg:'subió Valoración Q1 2026',badge:{bg:'var(--gray-lt)',color:'var(--text2)',bc:'var(--gray-bd)',lbl:'DOC'},time:'20/03/2026'},
                ].map((item,i,arr)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 16px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:item.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:item.color,flexShrink:0}}>{item.av}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:'var(--text2)'}}><strong>{item.name}</strong> {item.msg} <span style={{background:item.badge.bg,color:item.badge.color,border:`1px solid ${item.badge.bc}`,padding:'1px 6px',borderRadius:10,fontSize:9,fontWeight:700}}>{item.badge.lbl}</span></div>
                      <div style={{fontSize:10,color:'var(--text4)',marginTop:3}}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seguimiento comercial (solo lectura) */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:600}}>Seguimiento comercial del activo <span style={{fontSize:9,color:'var(--text4)',fontWeight:400,marginLeft:4}}>· Sincronizado desde Ofertas y Demandas</span></div>
              </div>
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>{['','ID','Tipo','Descripción','Fecha','Responsable','Estado'].map(h=>(
                      <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {FOLLOWUP_ACTS.map(a=>(
                      <tr key={a.id} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-actividad')}>
                        <td style={{padding:'7px 10px',width:30}}>
                          <div style={{width:26,height:26,borderRadius:'50%',background:a.bg,color:a.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>{a.initials}</div>
                        </td>
                        <td style={{padding:'7px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{a.id}</span></td>
                        <td style={{padding:'7px 12px'}}><span className={`tag ${TIPO_TAG_ACT[a.tipo]||'tag-gray'}`}>{TIPO_ICO_ACT[a.tipo]} {a.tipo}</span></td>
                        <td style={{padding:'7px 12px',fontWeight:500,maxWidth:320}}>{a.asunto}</td>
                        <td style={{padding:'7px 12px',color:'var(--text3)',whiteSpace:'nowrap'}}>{a.fecha}</td>
                        <td style={{padding:'7px 12px',fontSize:10,color:'var(--text3)'}}>{a.user}</td>
                        <td style={{padding:'7px 12px'}}><span className={`tag ${ACT_EST_ACT[a.estado]||'tag-gray'}`}>{a.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div></div>
          )}

          {/* ── TAB: Follow-up — Trazabilidad de cambios ── */}
          {activeTab==='at-followup' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Follow-up · Trazabilidad del activo</div>
              <div style={{fontSize:11,color:'var(--text4)',marginBottom:14}}>Registro de última modificación y auditoría de cambios.</div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                {[
                  {u:'AS',bg:'#dbeafe',color:'#1e40af',nombre:'Álvaro Sierra',cambio:'Actualización SBA y subida de planos P2',fecha:'04/04/2026',hora:'12:32'},
                  {u:'AS',bg:'#dbeafe',color:'#1e40af',nombre:'Álvaro Sierra',cambio:'Modificación occupancy rate → 78.4%',fecha:'01/04/2026',hora:'09:15'},
                  {u:'JL',bg:'#dcfce7',color:'#166534',nombre:'Jorge López',  cambio:'Subida Valoración Q1 2026 a Documentos',fecha:'20/03/2026',hora:'11:48'},
                  {u:'MR',bg:'#fce7f3',color:'#9d174d',nombre:'María Ruiz',   cambio:'Actualización datos urbanísticos',fecha:'15/03/2026',hora:'17:05'},
                ].map((item,i,arr)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'36px 1fr auto',gap:10,padding:'12px 16px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none',alignItems:'start'}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:item.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:item.color}}>{item.u}</div>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--text1)',marginBottom:2}}>{item.nombre}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>{item.cambio}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:11,color:'var(--text2)',fontWeight:500}}>{item.fecha}</div>
                      <div style={{fontSize:10,color:'var(--text4)'}}>{item.hora}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div></div>
          )}

        </div>{/* /ficha-main */}

        <RightPanel navigate={navigate} nEdificios={liveEdifCount ?? activo?.n_edificios ?? 1} plazas={plazas} esg={esg} activo={activo}/>

      </div>{/* /ficha-wrap */}
      {showTarea && <AsignarTareaModal refTipo="Activo" refNombre="P.E Avalon" onClose={() => setShowTarea(false)} />}
    </div>
  )
}
