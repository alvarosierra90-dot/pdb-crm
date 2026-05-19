/**
 * Barra de pills interactivos para el header de fichas.
 * Todos los pills tienen la misma anchura (150px) para simetría perfecta.
 * Estilo Salesforce premium: cada pill tiene eyebrow uppercase + valor grande
 * (peso 700), border 2px del color del estado y radius 10px.
 *
 * Cada pill puede ser:
 *  · Estático: { type:'info', label, value, color, accent }
 *  · Interactivo: { type:'select', label, value, options, onChange, color }
 *  · Botón: { type:'button', label, value, onClick, color, badge }
 *
 * @param {Array} items  Array de pills
 */
export default function HeaderPills({ items = [] }) {
  return (
    <div style={{
      flexShrink: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, 150px)',
      gap: 8,
      alignSelf: 'center',
      maxWidth: 'min(640px, 70%)',
      justifyContent: 'flex-end',
    }}>
      {items.filter(Boolean).map((it, i) => <Pill key={it.key || i} {...it} />)}
    </div>
  )
}

function Pill({ type = 'info', label, value, color, accent, options, onChange, onClick, badge, icon, title }) {
  const palette = palettes[color] || palettes.default
  const baseStyle = {
    background: accent ? palette.bg : 'var(--surface)',
    border: `2px solid ${accent ? palette.bd : 'var(--border)'}`,
    borderRadius: 10,
    padding: '8px 14px',
    fontFamily: 'inherit',
    textAlign: 'left',
    boxSizing: 'border-box',
  }
  const labelStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: accent ? palette.fg : 'var(--text4)',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    lineHeight: 1.2,
  }
  const valueStyle = {
    fontSize: 15,
    fontWeight: 700,
    color: accent ? palette.fg : 'var(--text)',
    marginTop: 2,
    lineHeight: 1.25,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  if (type === 'select') {
    return (
      <div style={baseStyle} title={title}>
        <div style={labelStyle}>{label}</div>
        <select
          value={value}
          onChange={e => onChange?.(e.target.value)}
          style={{
            ...valueStyle,
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            outline: 'none',
            width: '100%',
            marginTop: 2,
          }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    )
  }

  if (type === 'button') {
    return (
      <button onClick={onClick} title={title}
        style={{ ...baseStyle, cursor: 'pointer' }}>
        <div style={labelStyle}>{label}</div>
        <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon && <span>{icon}</span>}
          {value}
          {badge != null && badge > 0 && (
            <span style={{ background: palette.fg || 'var(--accent)', color: '#fff', borderRadius: 9, padding: '1px 7px', fontSize: 10, fontWeight: 700, marginLeft: 'auto' }}>{badge}</span>
          )}
        </div>
      </button>
    )
  }

  // type === 'info'
  return (
    <div style={baseStyle} title={title}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  )
}

const palettes = {
  default: { bg: 'var(--surface)',   fg: 'var(--text)',   bd: 'var(--border)' },
  green:   { bg: 'var(--green-lt)',  fg: 'var(--green)',  bd: 'var(--green-bd)' },
  amber:   { bg: 'var(--amber-lt)',  fg: 'var(--amber)',  bd: 'var(--amber-bd)' },
  red:     { bg: 'var(--red-lt)',    fg: 'var(--red)',    bd: 'var(--red-bd)' },
  accent:  { bg: 'var(--accent-lt)', fg: 'var(--accent)', bd: 'var(--accent-bd)' },
  purple:  { bg: 'var(--purple-lt)', fg: 'var(--purple)', bd: 'var(--purple-bd)' },
  blue:    { bg: '#eff6ff',          fg: '#2563eb',       bd: '#bfdbfe' },
  teal:    { bg: 'var(--teal-lt)',   fg: 'var(--teal)',   bd: 'var(--teal-bd)' },
}
