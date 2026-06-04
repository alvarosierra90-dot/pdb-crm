/* ============================================================
   OfertaCardPublica — tarjeta del grid (Nivel 1, Modo A)
   MAQUETACIÓN. Recibe una `oferta` de ejemplo + nº de orden.
   ============================================================ */
export default function OfertaCardPublica({ oferta = {}, num, onMore }) {
  const o = oferta
  const foto = (o.fotos || [])[0]
  const nFotos = (o.fotos || []).length
  return (
    <div className="pub-card">
      <div className="pub-card-photo">
        {foto ? <img src={foto} alt="" /> : <div className="ph-empty">▦</div>}
        <span className="pub-badge-num">{num}</span>
        {nFotos > 0 && <span className="pub-photo-count">📷 1/{nFotos}</span>}
        <button className="pub-photo-zoom" title="Ampliar">⤢</button>
      </div>
      <div className="pub-card-body">
        <div className="pub-card-addr">{o.direccion || 'Dirección'}</div>
        <div className="pub-card-cp">{[o.cp, o.ciudad].filter(Boolean).join(' · ')}</div>
        <div className="pub-card-meta">
          {o.estado_espacio && <span className="pub-chip">{o.estado_espacio}</span>}
          {o.disponibilidad && <span className="pub-chip">{o.disponibilidad}</span>}
          {o.ref && <span className="pub-chip ref">{o.ref}</span>}
        </div>
        <div className="pub-card-tbl">
          <div><div className="k">Sup. disponible</div><div className="v">{o.sup_disponible ? `${num0(o.sup_disponible)} m²` : '—'}</div></div>
          <div><div className="k">Desde</div><div className="v">{o.sup_min ? `${num0(o.sup_min)} m²` : '—'}</div></div>
          <div><div className="k">Alquiler</div><div className="v acc">{o.renta_m2 ? `${o.renta_m2} €` : '—'}</div></div>
        </div>
        <button className="pub-more" onClick={onMore}>Más información</button>
      </div>
    </div>
  )
}
function num0(n) { const x = Number(n); return isNaN(x) ? n : x.toLocaleString('es-ES') }
