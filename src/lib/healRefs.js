import { supabase } from './supabase'

// Auto-limpia los refs de una tabla para que todos tengan formato
// PREFIX-XXXXXXX (7 dígitos zero-padded). Se ejecuta al cargar la lista.
//
// Encuentra el máximo ref bien formado existente, y reasigna los refs
// malos (legacy timestamps, sin padding, NULL, etc.) con valores
// secuenciales empezando justo después del máximo.
//
// Retorna true si se hizo algún cambio (en cuyo caso conviene recargar
// la lista).
//
// table: 'arrendatarios' | 'propietarios' | ...
// prefix: 'ARR' | 'PRO' | ...
export async function healRefs(table, prefix) {
  const { data: rows, error } = await supabase
    .from(table)
    .select('id, ref')
  if (error || !rows) return false

  const goodRe = new RegExp(`^${prefix}-\\d{7}$`)

  // Calcular el máximo numérico de los refs ya bien formados
  let maxNum = 0
  for (const r of rows) {
    if (goodRe.test(r.ref || '')) {
      const n = parseInt(String(r.ref).split('-')[1], 10)
      if (!isNaN(n) && n > maxNum) maxNum = n
    }
  }

  // Detectar los refs malos
  const bad = rows.filter(r => !goodRe.test(r.ref || ''))
  if (bad.length === 0) return false

  // Reasignar secuencialmente desde maxNum + 1
  let counter = maxNum
  let changed = false
  for (const row of bad) {
    counter++
    const newRef = `${prefix}-${String(counter).padStart(7, '0')}`
    const { error: upErr } = await supabase
      .from(table)
      .update({ ref: newRef })
      .eq('id', row.id)
    if (!upErr) changed = true
  }
  return changed
}
