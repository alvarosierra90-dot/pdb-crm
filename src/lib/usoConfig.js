/* ============================================================================
 * usoConfig — Fuente de verdad del "Uso principal" del activo.
 *
 * El Uso principal gobierna el comportamiento de la ficha: opciones de Calidad,
 * campos de la tarjeta "Superficies y detalles" y color/etiqueta en listados.
 * Mantener aquí todo lo que dependa del uso para no dispersar literales.
 * ========================================================================== */

// Catálogo canónico (nomenclatura de mercado). El orden es el de los desplegables.
export const USOS_PRINCIPALES = [
  'Oficinas', 'Industrial', 'Logística', 'Retail High Street', 'Centro Comercial',
  'Hotel', 'Residencial', 'Build to Rent', 'Build to Sell', 'Flex Living',
  'Senior Living', 'Care Homes', 'Apartamentos Turísticos', 'Aparcamiento', 'Trasteros',
]

// Alias de valores antiguos → canónico. Tolera datos residuales sin romper
// colores/filtros/lookups. Valores fuera de catálogo (Data Center, Suelo…) se
// devuelven tal cual (identidad).
const ALIAS = {
  'Retail': 'Retail High Street',
  'Trastero': 'Trasteros',
  'Apartamentos turísticos': 'Apartamentos Turísticos',
  'Care homes': 'Care Homes',
  'Logístico': 'Logística',
  'Hoteles': 'Hotel',
}
export function normalizeUso(uso) {
  if (!uso) return ''
  return ALIAS[uso] || uso
}

/* ── Calidad por uso (spec punto 4) ──────────────────────────────────────── */
const CAL_LIVING = ['Prime', 'Alta', 'Media', 'Estándar']   // residencial-style
const CAL_ABC    = ['A', 'B', 'C']
export const CALIDADES_POR_USO = {
  'Oficinas':              ['A+', 'A', 'B', 'C'],
  'Hotel':                 ['5★', '4★', '3★', '2★', '1★'],
  'Logística':             ['Clase A', 'Clase B', 'Clase C'],
  'Industrial':            ['A', 'B', 'C'],
  'Retail High Street':    ['Prime', 'High Street', 'Secundaria'],
  'Centro Comercial':      ['Superregional', 'Regional', 'Urbano', 'Parque Comercial', 'Convenience', 'Outlet'],
  'Residencial':           CAL_LIVING,
  'Build to Rent':         CAL_LIVING,
  'Build to Sell':         CAL_LIVING,
  // Usos sin clasificación específica en la spec → defaults (a confirmar):
  'Flex Living':           CAL_LIVING,
  'Senior Living':         CAL_LIVING,
  'Care Homes':            CAL_LIVING,
  'Apartamentos Turísticos': CAL_LIVING,
  'Aparcamiento':          CAL_ABC,
  'Trasteros':             CAL_ABC,
}
const CAL_FALLBACK = ['A+', 'A', 'B', 'C']

// Opciones de calidad para un uso. Si el valor ya guardado no está en la lista,
// se añade al final para no perderlo (datos heredados).
export function calidadesDe(uso, current) {
  const base = CALIDADES_POR_USO[normalizeUso(uso)] || CAL_FALLBACK
  if (current && !base.includes(current)) return [...base, current]
  return base
}

/* ── Superficies y detalles dinámicas por uso (spec punto 3) ──────────────── */
// Cada métrica: { key, label, unit, store, type, compute?, special? }
//   store : 'col'  → columna real de `activos`
//           'jsonb'→ se guarda dentro de `activos.metricas` (jsonb)
//   type  : 'num' | 'int'
//   compute(info) → valor calculado de solo lectura (no se guarda)
//   special: 'pm' (Property Manager) | 'stacking' (Nº edificios, read-only)

export const COMMON_HEAD = [
  { key: 'sba', label: 'SBA', unit: 'm²', store: 'col', type: 'num' },
]
export const COMMON_TAIL = [
  { key: 'anno_construccion',   label: 'Año construcción',   store: 'col', type: 'int' },
  { key: 'anno_rehabilitacion', label: 'Año rehabilitación', store: 'col', type: 'int' },
  { key: 'asset_manager',       label: 'Property Manager',   store: 'col', special: 'pm' },
  { key: 'n_edificios',         label: 'Nº edificios',       special: 'stacking' },
]

const M = (key, label, unit, store = 'jsonb', type = 'num') => ({ key, label, unit, store, type })
const supNeta = {
  key: 'superficie_neta', label: 'Superficie neta', unit: 'm²',
  compute: (info) => (info?.sba && info?.ratio_perdida)
    ? Math.round(Number(info.sba) * (1 - Number(info.ratio_perdida) / 100))
    : null,
}

// Métricas ESPECÍFICAS por uso (entre SBA y los campos comunes).
export const SUPERFICIE_ESPECIFICAS = {
  'Oficinas':              [supNeta, M('sup_planta_tipo', 'Sup. planta tipo', 'm²', 'col'), M('ratio_perdida', 'Ratio de pérdida', '%', 'col')],
  'Hotel':                 [M('n_habitaciones', 'Nº habitaciones', '', 'jsonb', 'int'), M('sup_planta_tipo', 'Sup. planta tipo', 'm²', 'col'), M('ratio_perdida', 'Ratio de pérdida', '%', 'col')],
  'Residencial':           [M('n_viviendas', 'Nº viviendas', '', 'jsonb', 'int'), M('sup_media_vivienda', 'Sup. media por vivienda', 'm²')],
  'Build to Rent':         [M('n_viviendas', 'Nº viviendas', '', 'jsonb', 'int'), M('sup_media_vivienda', 'Sup. media por vivienda', 'm²')],
  'Build to Sell':         [M('n_viviendas', 'Nº viviendas', '', 'jsonb', 'int'), M('sup_media_vivienda', 'Sup. media por vivienda', 'm²')],
  'Retail High Street':    [M('sup_venta', 'Superficie de venta', 'm²'), M('sup_almacen', 'Superficie de almacén', 'm²'), M('fachada_comercial', 'Fachada comercial', 'm')],
  'Centro Comercial':      [M('n_locales', 'Nº locales', '', 'jsonb', 'int'), M('sup_restauracion', 'Sup. restauración', 'm²'), M('sup_ocio', 'Sup. ocio', 'm²')],
  'Logística':             [M('sup_almacen', 'Superficie de almacén', 'm²'), M('sup_oficinas', 'Superficie de oficinas', 'm²'), M('sup_parcela', 'Superficie de parcela', 'm²', 'col')],
  'Industrial':            [M('sup_produccion', 'Sup. de producción', 'm²'), M('sup_almacen', 'Superficie de almacén', 'm²'), M('sup_oficinas', 'Superficie de oficinas', 'm²'), M('sup_parcela', 'Superficie de parcela', 'm²', 'col')],
  'Aparcamiento':          [M('n_plazas', 'Nº plazas', '', 'jsonb', 'int')],
  'Trasteros':             [M('n_trasteros', 'Nº trasteros', '', 'jsonb', 'int')],
  'Flex Living':           [M('n_unidades', 'Nº unidades', '', 'jsonb', 'int'), M('sup_media_unidad', 'Sup. media por unidad', 'm²')],
  'Senior Living':         [M('n_unidades', 'Nº unidades', '', 'jsonb', 'int'), M('n_plazas', 'Nº plazas', '', 'jsonb', 'int')],
  'Care Homes':            [M('n_habitaciones', 'Nº habitaciones', '', 'jsonb', 'int'), M('n_camas', 'Nº camas', '', 'jsonb', 'int')],
  'Apartamentos Turísticos': [M('n_apartamentos', 'Nº apartamentos', '', 'jsonb', 'int')],
}

// Lista completa y ordenada de campos de la tarjeta para un uso dado.
export function camposSuperficie(uso) {
  const esp = SUPERFICIE_ESPECIFICAS[normalizeUso(uso)] || []
  return [...COMMON_HEAD, ...esp, ...COMMON_TAIL]
}

// Todas las claves que se guardan en `metricas` jsonb (unión de las store:'jsonb').
export const METRIC_JSONB_KEYS = (() => {
  const set = new Set()
  Object.values(SUPERFICIE_ESPECIFICAS).forEach(arr =>
    arr.forEach(m => { if (m.store === 'jsonb') set.add(m.key) }))
  return [...set]
})()

// Construye el objeto `metricas` a guardar a partir de un form/info plano.
export function buildMetricas(form) {
  const out = {}
  METRIC_JSONB_KEYS.forEach(k => {
    const v = form?.[k]
    if (v !== '' && v != null) out[k] = Number(v)
  })
  return out
}

/* ── Color / etiqueta por uso para listados (centraliza ActivosList/FichaZona) ── */
const USO_COLOR = {
  'Oficinas':           { bg: '#f5efe5', color: '#5a4828' },
  'Logística':          { bg: '#f0fdfa', color: '#0f766e' },
  'Retail High Street': { bg: '#fdf4ff', color: '#6b5b8e' },
  'Residencial':        { bg: '#fff7ed', color: '#c2410c' },
  'Data Center':        { bg: '#f0f9ff', color: '#0369a1' },
}
const USO_COLOR_DEFAULT = { bg: '#fce7f3', color: '#9d174d' }
export function usoColor(uso) {
  return USO_COLOR[normalizeUso(uso)] || USO_COLOR_DEFAULT
}

const USO_TAG = {
  'Oficinas':    'tag-blue',
  'Logística':   'tag-teal',
  'Data Center': 'tag-blue',
  'Residencial': 'tag-amber',
}
export function usoTag(uso) {
  return USO_TAG[normalizeUso(uso)] || 'tag-purple'
}
