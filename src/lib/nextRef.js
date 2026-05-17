import { supabase } from './supabase'

// Genera el siguiente ref corto secuencial para una tabla.
// Formato: PREFIX-XXXXXXX (7 dígitos zero-padded).
// Lee la fila con ref máximo del prefijo, suma 1 y devuelve el siguiente.
//
// IMPORTANTE: la BD también tiene un DEFAULT por secuencia (migración 032)
// que garantiza ref incluso si el cliente no lo manda. Esta función sirve
// para mostrar el ref recién creado sin tener que releer la fila, y para
// inserts donde queremos el ref antes de confirmar (typeaheads, etc.).
//
// prefix: 'PRO', 'ARR', etc.
// table:  nombre de la tabla supabase
export async function nextRef(table, prefix) {
  const { data } = await supabase
    .from(table)
    .select('ref')
    .like('ref', `${prefix}-%`)
    .order('ref', { ascending: false })
    .limit(1)
    .maybeSingle()
  const last = data?.ref ? parseInt(String(data.ref).split('-').pop(), 10) : 0
  const next = (isNaN(last) ? 0 : last) + 1
  return `${prefix}-${String(next).padStart(7, '0')}`
}
