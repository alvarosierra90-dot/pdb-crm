// Normaliza un ref al formato canónico PREFIX-XXXXXXX (7 dígitos zero-padded).
// Tolerante a entradas legacy: extrae todos los dígitos del ref y los repadda
// a 7. Si no hay dígitos, devuelve el ref tal cual.
//
// Ejemplos:
//   formatRef('ARR-2501', 'ARR')       → 'ARR-0002501'
//   formatRef('ARR-0000001', 'ARR')    → 'ARR-0000001'
//   formatRef('PRO-001', 'PRO')        → 'PRO-0000001'
//   formatRef('ARR-1778776088179','ARR') → 'ARR-1778776088179'  (>7, no se trunca)
//   formatRef('uuid-blah-blah', 'ARR') → 'uuid-blah-blah'        (no se reconoce)
//   formatRef(null, 'ARR')             → '—'
export function formatRef(raw, prefix) {
  if (!raw) return '—'
  const s = String(raw)
  // Si ya cumple PREFIX-{exactamente 7 dígitos}, devolver tal cual
  const exactRe = new RegExp(`^${prefix}-\\d{7}$`)
  if (exactRe.test(s)) return s
  // Si empieza con el prefijo y tiene dígitos detrás, padear a 7
  const startsRe = new RegExp(`^${prefix}-`)
  if (startsRe.test(s)) {
    const digits = s.replace(/\D/g, '')
    if (!digits) return s
    // No truncar si ya son más de 7 dígitos (es legacy, mejor verlo entero)
    if (digits.length >= 7) return `${prefix}-${digits}`
    return `${prefix}-${digits.padStart(7, '0')}`
  }
  // Formato desconocido — devolverlo intacto
  return s
}
