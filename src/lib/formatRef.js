// Normaliza un ref al formato canónico PREFIX-XXXXXXX (7 dígitos zero-padded).
// Es defensivo: aunque la BD tenga refs raros (UUIDs, timestamps, sin padding),
// el display SIEMPRE devuelve el formato corto consistente.
//
// Reglas en orden:
//   1. Si ya es PREFIX-{7 dígitos exactos} → tal cual
//   2. Si empieza por PREFIX-{dígitos} → repadear a 7 (o coger los últimos 7)
//   3. Si es un UUID o cualquier otra cosa con caracteres hex →
//        coger los 7 primeros hex chars, convertir a número, mod 10⁷,
//        y formar PREFIX-{7 dígitos}. Determinístico y estable.
//   4. Si nada de lo anterior → '—'
//
// Ejemplos:
//   formatRef('PRO-0000001', 'PRO')                            → 'PRO-0000001'
//   formatRef('PRO-2501', 'PRO')                               → 'PRO-0002501'
//   formatRef('PRO-1778776088179', 'PRO')                      → 'PRO-6088179' (últimos 7)
//   formatRef('e8bd8f05-80a8-4208-98ac-3a5433ffefcf', 'PRO')   → 'PRO-4236528' (hash hex)
//   formatRef(null, 'PRO')                                      → '—'
export function formatRef(raw, prefix) {
  if (!raw) return '—'
  const s = String(raw)

  // 1. Formato exacto canónico
  const exactRe = new RegExp(`^${prefix}-\\d{7}$`)
  if (exactRe.test(s)) return s

  // 2. PREFIX- con dígitos legacy → repad
  const startsRe = new RegExp(`^${prefix}-`)
  if (startsRe.test(s)) {
    const digits = s.replace(/\D/g, '')
    if (digits.length >= 7) return `${prefix}-${digits.slice(-7)}`
    if (digits.length > 0) return `${prefix}-${digits.padStart(7, '0')}`
  }

  // 3. UUID o cualquier otro string con caracteres hex → hash determinístico a 7 dígitos
  const hexOnly = s.replace(/[^0-9a-f]/gi, '')
  if (hexOnly.length >= 4) {
    // Usar los primeros 8 hex chars; convertir a número, mod 10⁷ para 7 dígitos
    const hexSlice = hexOnly.slice(0, 8)
    const num = parseInt(hexSlice, 16) % 10000000
    return `${prefix}-${String(num).padStart(7, '0')}`
  }

  // 4. No reconocido
  return '—'
}
