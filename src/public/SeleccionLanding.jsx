import OfertaCardPublica from './OfertaCardPublica'

/* ============================================================
   SeleccionLanding — Nivel 1 (MAQUETACIÓN, Modo A)
   Cabecera + mapa full-width con pins numerados + mensaje +
   grid de tarjetas + footer. Sin funcionalidad.
   ============================================================ */
export default function SeleccionLanding({ ofertas = [], agente = {}, fecha, onMore }) {
  // Posiciones de los pins (maqueta · repartidos sobre el mapa placeholder)
  const pinPos = [
    { left: '28%', top: '40%' }, { left: '46%', top: '62%' }, { left: '60%', top: '34%' },
    { left: '72%', top: '55%' }, { left: '38%', top: '72%' }, { left: '54%', top: '46%' },
    { left: '66%', top: '70%' }, { left: '33%', top: '54%' },
  ]
  return (
    <div className="pub-landing">
      {/* Cabecera */}
      <header className="pub-header">
        <div className="pub-logo"><span className="dot" /> Savills <small>PDB</small></div>
        <button className="pub-print">🖶 Versión imprimible</button>
      </header>

      {/* Mapa full-width */}
      <div className="pub-map-wrap">
        <div className="pub-map-fallback">
          <div style={{ fontSize: 28, color: 'var(--pb-accent)' }}>🗺</div>
          <div style={{ fontSize: 12 }}>Mapa de la selección (módulo Maps · Google Maps)</div>
        </div>
        {ofertas.map((_, i) => (
          <div className="pub-pin" key={i} style={pinPos[i % pinPos.length]}><span>{i + 1}</span></div>
        ))}
        <div className="pub-map-ctrls"><button>Mapa</button><button>Satélite</button><button>⛶</button></div>
      </div>

      {/* Mensaje de selección */}
      <div className="pub-selmsg">
        <h2><b>{agente.nombre || 'Tu agente'}</b> ha seleccionado para usted {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'} que corresponden a su búsqueda</h2>
        <div className="sub">Fecha de selección: {fecha || '—'}</div>
      </div>

      {/* Grid de tarjetas */}
      <div className="pub-grid">
        {ofertas.map((o, i) => (
          <OfertaCardPublica key={o.ref || i} oferta={o} num={i + 1} onMore={() => onMore(i)} />
        ))}
      </div>

      {/* Footer */}
      <footer className="pub-footer">
        <div className="pub-foot-agent">
          <div className="av">{(agente.nombre || 'A S').split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
          <div>
            <div className="nm">{agente.nombre || 'Agente Savills'}</div>
            <div className="ct">{[agente.telefono, agente.email].filter(Boolean).join('  ·  ')}</div>
          </div>
        </div>
        <div className="pub-disclaimer">
          La información contenida en este documento tiene carácter meramente informativo y no vinculante. Los importes no incluyen impuestos.
          Savills no garantiza la exactitud de los datos, que podrán variar sin previo aviso. Documento confidencial dirigido exclusivamente a su destinatario.
        </div>
        <div className="pub-foot-links">
          <a href="#">Política de cookies</a><a href="#">Protección de datos</a><a href="#">Aviso legal</a><a href="#">savills.es</a>
        </div>
      </footer>
    </div>
  )
}
