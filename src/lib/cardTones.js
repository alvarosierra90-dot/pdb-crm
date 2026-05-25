// Canon de colores por título de card · aplica en todas las fichas del PDB.
//
// Regla maestra del usuario (2026-05-25):
//   · Las entidades master Dynamics (Cuenta, Contacto, Oportunidad,
//     Instrucción) son SIEMPRE azules — vienen de Dynamics.
//   · El resto de conceptos tiene un único color por título, igual en
//     toda la herramienta (Lead, Propuesta, Mandato, Oferta, Demanda,
//     Negociación, Activo).
//   · Los outcomes finales mantienen verde (éxito) / rojo (fracaso).
//
// Para usarlo en una card: `tone: cardTone('Cuenta')`.

export const CARD_TONE = {
  // ── Dynamics (master · azul siempre) ───────────────────────────────
  'Cuenta':        'blue',
  'Contacto':      'blue',
  'Oportunidad':   'blue',
  'Instrucción':   'blue',

  // ── PDB · cada concepto un color único y distinguible ────────────
  'Lead':          'amber',
  'Propuesta':     'purple',
  'Mandato':       'accent',  // bronze / gold
  'Oferta':        'green',
  'Demanda':       'amber',
  'Negociación':   'indigo',  // distinto de bronze (Mandato) y amber (Demanda)
  'Activo':        'bronze',

  // ── Outcomes finales ──────────────────────────────────────────────
  'Ganada':        'green',
  'Cerrada por Savills': 'green',
  'Perdida':       'red',
  'Descartada':    'red',
}

// Aliases / variantes de label que reciclan el tone canónico.
const ALIASES = {
  'Cliente (Cuenta)':        'Cuenta',
  'Cuenta (Dynamics)':       'Cuenta',
  'Contacto (Dynamics)':     'Contacto',
  'Etapa actual (Dynamics)': 'Oportunidad',
  'Activos del pitch':       'Activo',
  'Pitch':                   'Propuesta',
  'Estado de la demanda':    'Demanda',
  'Demanda ganada':          'Ganada',
  'Demanda perdida':         'Perdida',
  'Propuesta ganada':        'Ganada',
  'Propuesta perdida':       'Perdida',
  'Origen del negocio':      'Lead',
  'Ofertas / Demandas':      'Oferta',
}

export function cardTone(label, fallback = 'accent') {
  if (!label) return fallback
  if (CARD_TONE[label]) return CARD_TONE[label]
  const alias = ALIASES[label]
  if (alias && CARD_TONE[alias]) return CARD_TONE[alias]
  return fallback
}
