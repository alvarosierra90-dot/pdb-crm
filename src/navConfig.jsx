// Configuración del menú lateral + tabs superiores.
// Cada tab tiene su lista de items (o grupos). Cada item es:
//   [view, label, badge?, aliases?]
//     - view: id de la vista a navegar
//     - label: texto visible
//     - badge: número (count), string (Dynamics tag) o null
//     - aliases: array de views adicionales que también activan este item
//                (fichas, vistas relacionadas)

// SVGs reutilizados de la nav antigua para mantener la identidad visual
const I = {
  paneles: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
  misClientes: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 13c0-2.5 2-4 4-4s4 1.5 4 4"/><circle cx="6" cy="6" r="3"/><path d="M13 13c0-1.5-1-2.5-2.5-3"/><circle cx="11.5" cy="5.5" r="2"/></svg>,
  actividades: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M3 4h10M3 12h6"/></svg>,
  tareas: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8l2 2 4-4"/><rect x="2" y="2" width="12" height="12" rx="2"/></svg>,
  visitas: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 7h12M5 1v4M11 1v4"/></svg>,
  presentaciones: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><path d="M9 11.5h5M11.5 9v5"/></svg>,
  cuentas: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6h12"/></svg>,
  contactos: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>,
  entidades: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 9h6M5 12h4"/></svg>,
  leads: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/></svg>,
  oport: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h2l2-4 2 8 2-5 2 3h2"/></svg>,
  propuestas: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4M5 8h6M5 11h4"/></svg>,
  mandatos: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4M6 9l1.5 1.5L11 7"/></svg>,
  activos: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="12" height="9" rx="1.5"/><path d="M5 5V4a3 3 0 016 0v1"/></svg>,
  arrend: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 14c0-2.5 2-4 4-4s4 1.5 4 4"/><circle cx="6" cy="6" r="2.5"/><path d="M11 8h3M11 11h3"/></svg>,
  propiet: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6l5-4 5 4v8H3V6z"/><circle cx="8" cy="9" r="1.5"/></svg>,
  portf: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="11" rx="1.5"/><path d="M5 3V2a1 1 0 012 0v1M9 3V2a1 1 0 012 0v1"/></svg>,
  ofertas: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/><path d="M2 4l6 5 6-5"/></svg>,
  demandas: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>,
  mapas: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L2 4v10l4-2 4 2 4-2V2l-4 2-4-2z"/></svg>,
  negoc: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3z"/><path d="M5 13l1-2h4l1 2"/></svg>,
  instr: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4M6 11l1.5 1.5L11 9"/></svg>,
  venc: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>,
  intel: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
  noticias: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 6h6M5 9h4"/></svg>,
  informes: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l3-4 3 2 3-5 3 3"/><path d="M2 14h12"/></svg>,
  zonas: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z"/><circle cx="8" cy="6" r="1.5"/></svg>,
  marketing: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8l4-4 3 3 5-5"/><path d="M2 14h12"/></svg>,
  usuarios: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5"/><path d="M1 13c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/><circle cx="12" cy="5" r="2"/></svg>,
  pitch: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="9" rx="1.5"/><path d="M6 12v2M10 12v2M5 14h6"/><path d="M5 7l2 2 4-4"/></svg>,
  nexo: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="4" cy="4" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><path d="M6 4h4M6 12h4M4 6v4M12 6v4"/></svg>,
}

// Iconos pequeños para las pestañas del topbar
const T = {
  miDia:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 4l6 4 6-4M2 4v8h12V4M2 4l6-2 6 2"/></svg>,
  clientes:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="5" r="2.5"/><path d="M2 14c0-3 2.7-4.5 6-4.5s6 1.5 6 4.5"/></svg>,
  comer:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 8l4-4 3 3 5-5"/><path d="M14 4v3h-3"/></svg>,
  activo:  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="12" height="9" rx="1"/><path d="M5 5V4a3 3 0 016 0v1"/></svg>,
  anal:    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6"/><path d="M8 2v6l4 2"/></svg>,
  admin:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v3M8 12v3M1 8h3M12 8h3M3 3l2 2M11 11l2 2M3 13l2-2M11 5l2-2"/></svg>,
}

export const TABS = [
  {
    id: 'mi-dia', label: 'Mi día', icon: T.miDia, default: 'paneles',
    items: [
      { view:'paneles',        label:'Paneles',        icon:I.paneles },
      { view:'mis-clientes',   label:'Mis clientes',   icon:I.misClientes },
      { view:'actividades',    label:'Actividades',    icon:I.actividades, badge:10, aliases:['ficha-actividad'] },
      { view:'tareas',         label:'Tareas',         icon:I.tareas, aliases:['ficha-tarea'] },
      { view:'visitas',        label:'Visitas',        icon:I.visitas, aliases:['ficha-visita'] },
      { view:'presentaciones', label:'Presentaciones', icon:I.presentaciones, aliases:['ficha-presentacion'] },
    ],
  },
  {
    id: 'clientes', label: 'Clientes', icon: T.clientes, default: 'cuentas',
    items: [
      { view:'cuentas',           label:'Cuentas',           icon:I.cuentas,   dyn:true },
      { view:'contactos',         label:'Contactos',         icon:I.contactos, dyn:true },
      { view:'entidades-legales', label:'Entidades legales', icon:I.entidades, dyn:true },
    ],
  },
  {
    id: 'comercial', label: 'Comercial', icon: T.comer, default: 'ofertas',
    groups: [
      { label: 'Captación', items: [
        { view:'leads',         label:'Leads',                 icon:I.leads, badge:15, badgeStyle:{background:'#fef3c7',color:'#92400e'}, aliases:['ficha-lead'] },
        { view:'oportunidades', label:'Oportunidades',         icon:I.oport, dyn:true },
        { view:'propuestas',    label:'Propuestas / Proyectos',icon:I.propuestas, aliases:['ficha-propuesta'] },
        { view:'mandatos',      label:'Mandatos',              icon:I.mandatos,   aliases:['ficha-mandato'] },
      ]},
      { label: 'Mercado', items: [
        { view:'ofertas',  label:'Ofertas',  icon:I.ofertas,  aliases:['ficha-oferta'] },
        { view:'demandas', label:'Demandas', icon:I.demandas, aliases:['ficha-demanda'] },
        { view:'mapas',    label:'Mapas',    icon:I.mapas },
      ]},
      { label: 'Cierre', items: [
        { view:'negociaciones', label:'Negociaciones', icon:I.negoc, badge:4, aliases:['ficha-negociacion'] },
        { view:'instruccion',   label:'Instrucciones', icon:I.instr, dyn:true },
      ]},
    ],
  },
  {
    id: 'activo', label: 'Activo', icon: T.activo, default: 'activos',
    items: [
      { view:'activos',       label:'Activos',                 icon:I.activos, aliases:['ficha-activo'] },
      { view:'arrendatarios', label:'Arrendatarios',           icon:I.arrend,  aliases:['ficha-arrendatario'] },
      { view:'propietarios',  label:'Propietarios',            icon:I.propiet, aliases:['ficha-propietario'] },
      { view:'portfolios',    label:'Portfolios institucionales', icon:I.portf, aliases:['portfolio'] },
    ],
  },
  {
    id: 'analisis', label: 'Análisis', icon: T.anal, default: 'informes-mercado',
    items: [
      { view:'vencimientos',           label:'Vencimientos',           icon:I.venc },
      { view:'inteligencia-comercial', label:'Inteligencia comercial', icon:I.intel },
      { view:'noticias',               label:'Noticias',               icon:I.noticias },
      { view:'informes-mercado',       label:'Informes de mercado',    icon:I.informes },
      { view:'zonas',                  label:'Zonas',                  icon:I.zonas, aliases:['ficha-zona'] },
    ],
  },
  {
    id: 'admin', label: 'Admin', icon: T.admin, default: 'usuarios',
    groups: [
      { label: 'Gestión', items: [
        { view:'marketing', label:'Marketing',        icon:I.marketing },
        { view:'usuarios',  label:'Usuarios Savills', icon:I.usuarios, aliases:['ficha-usuario'] },
      ]},
      { label: 'Herramientas', items: [
        { view:'pitch', label:'Pitch', icon:I.pitch },
        { view:'nexo',  label:'NEXO',  icon:I.nexo },
      ]},
    ],
  },
]

const VIEW_TO_TAB = (() => {
  const map = {}
  for (const tab of TABS) {
    const flatten = (items) => items.forEach(it => {
      map[it.view] = tab.id
      ;(it.aliases || []).forEach(v => { map[v] = tab.id })
    })
    if (tab.items) flatten(tab.items)
    if (tab.groups) tab.groups.forEach(g => flatten(g.items))
  }
  return map
})()

export function tabOfView(view) {
  return VIEW_TO_TAB[view] || 'mi-dia'
}
