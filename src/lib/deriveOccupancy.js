// ─── Ocupación derivada del stacking (única fuente de verdad) ────────────────
// El stacking (`activos.stacking_data` = array de edificios) es la verdad física.
// Cada unidad de la capa `arr` lleva `type`:
//   ten = arrendatario (ocupado) · rt = retail con inquilino (ocupado)
//   vac = vacante (con/sin oferta) · com = común/hall (no computa) · pk = parking (plazas aparte)
//
// Ocupación (%) = m² ocupados / m² alquilables (ocupados + vacantes), redondeado.
// Devuelve occ=null cuando el stacking no aporta superficie alquilable (sin datos):
// en ese caso el llamante puede caer a un proxy (disponibilidad de ofertas) o mostrar '—'.
//
// Acepta tanto el array persistido `[...]` como un envoltorio `{ buildings:[...] }`.
export function deriveOccupancy(stackingData) {
  const buildings = Array.isArray(stackingData)
    ? stackingData
    : Array.isArray(stackingData?.buildings) ? stackingData.buildings : []

  let ocupado = 0, vacante = 0
  for (const b of buildings) {
    for (const row of (b?.arr || [])) {
      for (const u of (row?.units || [])) {
        const sup = Number(u?.sup) || 0
        if (u?.type === 'ten' || u?.type === 'rt') ocupado += sup
        else if (u?.type === 'vac') vacante += sup
      }
    }
  }

  const alquilable = ocupado + vacante
  const occ = alquilable > 0 ? Math.round((ocupado / alquilable) * 100) : null
  return { ocupado, vacante, alquilable, occ }
}
