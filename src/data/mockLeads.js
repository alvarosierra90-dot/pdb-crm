// Constantes de UI para Leads. Los datos viven en Supabase (tabla leads).
// Mapeo a clases globales — coherencia visual con resto del sistema (.tag-*)

export const LEAD_TIPOS = [
  { key:'demanda',  label:'Demanda',  tagClass:'tag-purple' },
  { key:'oferta',   label:'Oferta',   tagClass:'tag-green'  },
  { key:'generico', label:'Genérico', tagClass:'tag-amber'  },
]

// Estados alineados al CHECK de la tabla leads (4 estados canónicos)
export const LEAD_ESTADOS = [
  { key:'nuevo',             label:'Nuevo',             tagClass:'tag-blue'  },
  { key:'en_cualificacion',  label:'En cualificación',  tagClass:'tag-amber' },
  { key:'cualificado',       label:'Cualificado',       tagClass:'tag-green' },
  { key:'no_cualificado',    label:'No cualificado',    tagClass:'tag-red'   },
]

// Vía: pitch o directo (decisión en cualificación)
export const LEAD_VIAS = [
  { key:'pitch',   label:'Pitch (con propuesta competitiva)' },
  { key:'directo', label:'Directo (sin propuesta)'           },
]

export const LEAD_CANALES = [
  'Web corporativa',
  'Landing page',
  'Idealista',
  'Habitaclia',
  'Belbex',
  'LinkedIn',
  'Formulario consultoría',
  'Campaña marketing',
  'Recomendación',
  'Contacto directo',
  'Email entrante',
  'Evento / Networking',
]

export const LEAD_PRIORIDADES = [
  { key:'alta',  label:'Alta',  tagClass:'tag-red'   },
  { key:'media', label:'Media', tagClass:'tag-amber' },
  { key:'baja',  label:'Baja',  tagClass:'tag-gray'  },
]

export const MOTIVOS_LEAD_NULO = [
  'No encaja con ningún producto disponible',
  'No encaja con ningún servicio ofrecido',
  'Requisitos fuera de mercado',
  'Presupuesto insuficiente',
  'Ubicación no cubierta',
  'Superficie solicitada no disponible',
  'Activo no comercializable',
  'Servicio no aplicable',
  'Cuenta no responde',
  'Contacto duplicado',
  'Información incompleta',
  'Lead irrelevante',
  'Error de entrada',
  'Spam',
  'Otro motivo',
]

// Mapeo lead.tipo + via → tipo de Oportunidad en Dynamics
export function tipoOportunidad(leadTipo, via) {
  if (leadTipo === 'generico') return 'generica'
  if (leadTipo === 'demanda')  return via === 'pitch' ? 'pitch_demanda' : 'demanda'
  if (leadTipo === 'oferta')   return via === 'pitch' ? 'pitch_oferta'  : 'oferta'
  return null
}
