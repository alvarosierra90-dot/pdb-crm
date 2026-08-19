// ─── Nº de plantas derivado del stacking ────────────────────────────────────
// El stacking (`activos.stacking_data`) es la única fuente de verdad de la
// estructura física. Las columnas `activos.n_plantas_sobre` / `n_plantas_bajo`
// existen desde la migración 001 y las consumen otros módulos (p. ej. MapasView),
// pero nadie las rellenaba: quedaban a null aunque el stacking tuviera plantas.
//
// Aquí se derivan del stacking y se escriben en el MISMO update que persiste
// `stacking_data`, para que no puedan desincronizarse.
//
// Convención de ids de planta (ver createFirstBuilding / insertFloorAt):
//   · 'PB', 'P1', 'P2'…  → sobre rasante (PB incluida)
//   · 'S1', 'S2'…        → bajo rasante
//   · sufijo 'b' en colisiones ('P2b') → cuenta igual que su planta
//
// Con varios edificios se toma el MÁXIMO, no la suma: la columna describe la
// altura del edificio (cuántas plantas tiene), no el total de forjados del activo.

const esBajoRasante = (id) => /^S/i.test(String(id || ''))

export function deriveFloorCounts(buildings) {
  const blds = Array.isArray(buildings) ? buildings : []
  let sobre = 0, bajo = 0
  for (const b of blds) {
    const floors = Array.isArray(b?.floors) ? b.floors : []
    let s = 0, j = 0
    for (const f of floors) (esBajoRasante(f?.id) ? j++ : s++)
    if (s > sobre) sobre = s
    if (j > bajo)  bajo  = j
  }
  // Sin plantas no hay dato que afirmar → null (no un 0 que parecería medido).
  return {
    n_plantas_sobre: sobre > 0 ? sobre : null,
    n_plantas_bajo:  blds.length > 0 ? bajo : null,
  }
}

// Payload canónico para persistir el stacking completo. Usar SIEMPRE que se
// escriba el array de edificios entero (los updates que solo tocan units de
// una planta no cambian el nº de plantas y no lo necesitan).
export function stackingPayload(buildings) {
  return { stacking_data: buildings, ...deriveFloorCounts(buildings) }
}
