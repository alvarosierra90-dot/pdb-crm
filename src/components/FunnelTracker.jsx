/**
 * Mini-breadcrumb del funnel comercial · canon project_canon_fichas (sección G).
 * Muestra el hilo conductor entre las entidades de la cadena
 * Lead → Oportunidad → Propuesta → Mandato → Oferta/Demanda → Negociación
 * en una banda fina sobre el header de la ficha.
 *
 * Cada paso es clicable (navega a la ficha del registro anterior/siguiente).
 * El paso actual se resalta con fondo `var(--accent-lt)` y se marca con `current`.
 * Los pasos no existentes (ej. flujo sin propuesta) se omiten.
 *
 * Props:
 *   steps: Array<{
 *     key:     string           // identificador único (ej. 'lead', 'opo', 'pry', 'man', 'ofr')
 *     label:   string           // etiqueta corta (ej. 'Lead', 'Oportunidad', 'Mandato')
 *     ref:     string|null      // ref code del registro (ej. 'LEA-0042')
 *     current: boolean          // true si es la ficha activa
 *     onClick: () => void|null  // navegación al hacer clic; null si el paso es inerte
 *   }>
 */
export default function FunnelTracker({ steps = [] }) {
  const visibles = steps.filter(s => s && (s.ref || s.current))
  if (visibles.length < 2) return null
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:6, flexWrap:'wrap',
      padding:'8px 22px', background:'var(--gray-lt)',
      borderBottom:'1px solid var(--border)',
      fontSize:11, fontFamily:'inherit',
    }}>
      <span style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginRight:6 }}>
        Funnel
      </span>
      {visibles.map((s, i) => (
        <span key={s.key} style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
          {i > 0 && <span style={{ color:'var(--text4)', fontSize:13 }}>→</span>}
          <Step {...s} />
        </span>
      ))}
    </div>
  )
}

function Step({ label, ref, current, onClick }) {
  const baseStyle = {
    display:'inline-flex', alignItems:'center', gap:5,
    padding:'3px 9px', borderRadius:5, fontFamily:'inherit',
    fontSize:11, lineHeight:1.3, border:'1px solid transparent',
    background:'transparent',
  }
  const labelStyle = {
    fontSize:9, fontWeight:700, color: current ? 'var(--accent)' : 'var(--text4)',
    textTransform:'uppercase', letterSpacing:'.04em',
  }
  const refStyle = {
    fontFamily:'var(--mono)', fontWeight: current ? 700 : 500,
    color: current ? 'var(--accent)' : 'var(--text2)',
  }

  if (current) {
    return (
      <span style={{
        ...baseStyle,
        background:'var(--accent-lt)', border:'1px solid var(--accent-bd)',
      }}>
        <span style={labelStyle}>{label}</span>
        <span style={refStyle}>{ref || '—'}</span>
        <span style={{ fontSize:8, fontWeight:700, color:'var(--accent)', marginLeft:2 }}>● aquí</span>
      </span>
    )
  }

  if (!ref) {
    return (
      <span style={{ ...baseStyle, opacity:0.5 }}>
        <span style={labelStyle}>{label}</span>
        <span style={{ ...refStyle, fontStyle:'italic' }}>—</span>
      </span>
    )
  }

  return (
    <button onClick={onClick} disabled={!onClick} style={{
      ...baseStyle, cursor: onClick ? 'pointer' : 'default',
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
    >
      <span style={labelStyle}>{label}</span>
      <span style={refStyle}>{ref}</span>
    </button>
  )
}
