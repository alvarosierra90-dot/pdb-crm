import { useState } from 'react'

/* ============================================================
   FichaOfertaPublica — Nivel 2 (MAQUETACIÓN, sin funcionalidad)
   Componente único de ficha detalle, compartido por Modo A y Modo B.
   Recibe una `oferta` (objeto de ejemplo) y pinta el layout. Las
   secciones sin datos no se muestran (ni su entrada de menú).
   ============================================================ */
const ImgOr = ({ src, fontSize = 30 }) =>
  src ? <img src={src} alt="" /> : <div className="ph-empty" style={{ fontSize }}>▦</div>

export default function FichaOfertaPublica({ oferta = {}, onBack, showBack = false }) {
  const o = oferta
  const fotos = o.fotos || []
  const planos = o.planos || []
  const servicios = o.servicios || []
  const superficies = o.superficies || []
  const parking = o.parking || []

  // Secciones visibles (ocultar vacías)
  const secs = [
    { id: 'descripcion', label: 'Descripción', show: !!o.descripcion },
    { id: 'ubicacion',   label: 'Ubicación',   show: !!(o.lat || o.direccion) },
    { id: 'fotos',       label: 'Fotografías', show: fotos.length > 0 || (o.destacados || []).length > 0 },
    { id: 'servicios',   label: 'Servicios',   show: servicios.length > 0 || (o.transporte || []).length > 0 || (o.esg || []).length > 0 },
    { id: 'superficies', label: 'Desglose de superficies y Condiciones económicas', show: superficies.length > 0 || !!o.renta_m2 },
    { id: 'parking',     label: 'Parking',     show: parking.length > 0 },
    { id: 'planos',      label: 'Planos',      show: planos.length > 0 },
  ].filter(s => s.show)

  const [activeSec, setActiveSec] = useState(secs[0]?.id)

  return (
    <div className="pub-ficha">
      {/* Hero */}
      <div className="pub-hero">
        <ImgOr src={fotos[0]} fontSize={56} />
        <div className="pub-hero-grad" />
        <div className="pub-hero-logo"><span className="dot" /> Savills</div>
        {showBack && <button className="pub-hero-back" onClick={onBack}>← Volver a la selección</button>}
        <div className="pub-hero-addr">
          <h1>{o.direccion || 'Dirección del activo'}</h1>
          <div>{[o.cp, o.ciudad].filter(Boolean).join(' · ')}</div>
        </div>
      </div>

      {/* Banda de datos clave */}
      <div className="pub-band">
        <div className="pub-band-item"><div className="k">Superficie disponible</div><div className="v">{o.sup_disponible ? `${fmt(o.sup_disponible)}` : '—'} <small>m²</small></div></div>
        <div className="pub-band-item"><div className="k">Superficie mín.</div><div className="v">{o.sup_min ? `${fmt(o.sup_min)}` : '—'} <small>m²</small></div></div>
        <div className="pub-band-item"><div className="k">Renta</div><div className="v">{o.renta_m2 ? `${o.renta_m2}` : '—'} <small>€/m²/mes</small></div></div>
        <div className="pub-band-item"><div className="k">Disponibilidad</div><div className="v" style={{ fontSize: 15 }}>{o.disponibilidad || '—'}</div></div>
        <div className="pub-band-item"><div className="k">Estado del espacio</div><div className="v" style={{ fontSize: 15 }}>{o.estado_espacio || '—'}</div></div>
        <div className="pub-band-op">
          <span className="op">{(o.tipo_operacion || 'Alquiler').toUpperCase()}</span>
          <span className="ref">ref {o.ref || '—'}{o.fecha ? ` · Creado el ${o.fecha}` : ''}</span>
        </div>
      </div>

      {/* Nav anclas */}
      <nav className="pub-nav">
        {secs.map(s => (
          <a key={s.id} href={`#${s.id}`} className={activeSec === s.id ? 'on' : ''} onClick={() => setActiveSec(s.id)}>{s.label}</a>
        ))}
      </nav>

      {/* Descripción */}
      {o.descripcion && (
        <section id="descripcion" className="pub-sec">
          <h3>Descripción</h3>
          <p className="lead">{o.descripcion}</p>
        </section>
      )}

      {/* Ubicación */}
      {(o.lat || o.direccion) && (
        <section id="ubicacion" className="pub-sec">
          <h3>Ubicación</h3>
          <div className="pub-loc-map">
            <div className="pub-map-fallback">
              <div style={{ fontSize: 30, color: 'var(--pb-accent)' }}>◉</div>
              <div style={{ fontSize: 12 }}>{o.direccion || ''} · {o.ciudad || ''}</div>
              <div style={{ fontSize: 10, color: 'var(--pb-muted-2)' }}>Mapa de ubicación (módulo Maps)</div>
            </div>
            <button className="pub-loc-recenter">Volver a centrar</button>
          </div>
        </section>
      )}

      {/* Fotografías */}
      {(fotos.length > 0 || (o.destacados || []).length > 0) && (
        <section id="fotos" className="pub-sec">
          <h3>Fotografías</h3>
          <div className="pub-gallery">
            {[0, 1, 2, 3, 4].map(i => (
              <div className="g" key={i}><ImgOr src={fotos[i]} /></div>
            ))}
          </div>
          {(o.destacados || []).length > 0 && (
            <div className="pub-tags">
              {o.destacados.map((d, i) => (
                <span className="pub-tag" key={i} style={{ background: d.color || 'var(--pb-accent)' }}>{d.label}</span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Servicios */}
      {(servicios.length > 0 || (o.transporte || []).length > 0 || (o.esg || []).length > 0) && (
        <section id="servicios" className="pub-sec">
          <h3>Servicios</h3>
          <div className="pub-2col">
            <div className="pub-kv">
              <div className="row"><div className="lbl">Estado</div><div className="val">{o.estado_renovacion || '—'}</div></div>
              <div className="row"><div className="lbl">Transporte</div><div className="val">{(o.transporte || []).length ? o.transporte.join(' · ') : '—'}</div></div>
              <div className="row">
                <div className="lbl">Normativa / ESG</div>
                <div className="pub-seals">
                  {(o.esg || []).length ? o.esg.map((s, i) => <span className="pub-seal" key={i}>{s}</span>) : <span className="val">—</span>}
                </div>
              </div>
            </div>
            <div>
              <div className="lbl" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--pb-muted)', marginBottom: 10 }}>Características y servicios de oficinas</div>
              <div className="pub-svc-list">
                {servicios.map((s, i) => <div className="it" key={i}>{s}</div>)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Desglose superficies + Condiciones económicas */}
      {(superficies.length > 0 || o.renta_m2) && (
        <section id="superficies" className="pub-sec">
          <h3>Desglose de superficies y Condiciones económicas</h3>
          <div className="pub-2col">
            {/* Cuadro de superficies */}
            <div>
              <div className="pub-supbox">
                <div className="big">{o.sup_disponible ? `${fmt(o.sup_disponible)} m²` : '—'}</div>
                <div className="lbl">Superficie total disponible</div>
                <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--pb-ink-2)' }}>
                  {o.sup_min ? `Divisible a partir de ${fmt(o.sup_min)} m²` : 'No divisible'} · Disponibilidad {o.disponibilidad || '—'}
                </div>
              </div>
              {superficies.map((edif, ei) => (
                <table className="pub-tbl" key={ei} style={{ marginBottom: 14 }}>
                  <thead>
                    <tr><th>Edificio</th><th>Tipo</th><th>Planta</th><th className="num">Superficie</th><th className="num">€/m²/mes</th></tr>
                  </thead>
                  <tbody>
                    {edif.filas.map((f, fi) => (
                      <tr key={fi}>
                        <td className="edif">{fi === 0 ? edif.edificio : ''}</td>
                        <td>{f.tipo}</td><td>{f.planta}</td>
                        <td className="num">{fmt(f.sup)} m²</td><td className="num">{f.renta || '—'}</td>
                      </tr>
                    ))}
                    <tr className="sub"><td colSpan={3}>Subtotal {edif.edificio}</td><td className="num">{fmt(edif.subtotal)} m²</td><td /></tr>
                  </tbody>
                </table>
              ))}
            </div>
            {/* Condiciones económicas */}
            <div>
              <div className="pub-econ">
                <div className="row"><span className="k">Renta</span><span className="v">{o.renta_m2 ? `${o.renta_m2} €/m²/mes` : '—'}</span></div>
                <div className="row"><span className="k">Gastos</span><span className="v">{o.gastos_m2 ? `${o.gastos_m2} €/m²/mes` : '—'}</span></div>
                {o.renta_mensual && <div className="row"><span className="k">Renta mensual estimada</span><span className="v">{o.renta_mensual}</span></div>}
                {o.gastos_comentario && <div className="note">{o.gastos_comentario}</div>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Parking */}
      {parking.length > 0 && (
        <section id="parking" className="pub-sec">
          <h3>Parking</h3>
          <table className="pub-tbl">
            <thead><tr><th>Categoría</th><th>Tipo</th><th>Uso</th><th className="num">Plazas</th><th className="num">Alquiler plaza/año</th></tr></thead>
            <tbody>
              {parking.map((p, i) => (
                <tr key={i}><td>{p.categoria}</td><td>{p.tipo}</td><td>{p.uso}</td><td className="num">{p.plazas}</td><td className="num">{p.precio || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Planos */}
      {planos.length > 0 && (
        <section id="planos" className="pub-sec" style={{ borderBottom: 'none' }}>
          <h3>Planos</h3>
          <div className="pub-planos">
            {planos.map((p, i) => (
              <div className="pub-plano" key={i}>
                <ImgOr src={p.url} />
                <div className="cap">{p.cap || `Plano ${i + 1}`}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function fmt(n) { const x = Number(n); return isNaN(x) ? (n || '—') : x.toLocaleString('es-ES') }
