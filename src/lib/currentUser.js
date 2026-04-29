// Usuario actual del sistema. Hasta que haya auth real, queda hardcoded.
// Cuando se conecte SSO/Supabase Auth, esto se reemplaza por un hook
// que lea la sesión real.

export const CURRENT_USER = {
  nombre:  'Sierra Álvaro',
  email:   'alvaro.sierra@savills.com',
  equipo:  'Leasing Oficinas Madrid',
}

// Comprueba si el usuario actual es el responsable de un registro.
// Acepta tanto el campo `responsable` (texto) como un objeto.
export function esResponsable(registro) {
  if (!registro) return false
  const r = typeof registro === 'string' ? registro : registro.responsable
  if (!r) return false
  return r.trim().toLowerCase() === CURRENT_USER.nombre.toLowerCase()
}
