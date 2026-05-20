import { useState, useRef, useEffect } from 'react'

/**
 * Barra de pills interactivos para el header de fichas.
 * Todos los pills tienen la misma anchura (150px) para simetría perfecta.
 * Estilo Salesforce premium: cada pill tiene eyebrow uppercase + valor grande
 * (peso 700), border 2px del color del estado y radius 10px.
 *
 * Cada pill puede ser:
 *  · Estático:    { type:'info',    label, value, color, accent }
 *  · Select clásico (chevron, dispara onChange): { type:'select', label, value, options, onChange, color }
 *  · Botón:       { type:'button',  label, value, onClick, color, badge }
 *  · Popover editable (recomendado): { type:'popover', label, value, color, accent,
 *      popover: {
 *        type: 'select' | 'text' | 'textarea' | 'date' | 'number',
 *        options: [{ value, label }] | undefined,   // solo type='select'
 *        rows: 4 | undefined,                       // solo textarea
 *        placeholder: string | undefined,
 *        onSave: async (newValue) => void,          // se llama al guardar
 *      },
 *    }
 *
 * Solo un popover puede estar abierto a la vez (coordinado por openKey).
 *
 * @param {Array} items  Array de pills
 */
export default function HeaderPills({ items = [] }) {
  const [openKey, setOpenKey] = useState(null)

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
      {items.filter(Boolean).map((it, i) => (
        <Pill
          key={it.key || i}
          {...it}
          isOpen={openKey === (it.key || i)}
          onOpen={() => setOpenKey(it.key || i)}
          onClose={() => setOpenKey(null)}
        />
      ))}
    </div>
  )
}

function Pill({ type = 'info', label, value, color, accent, options, onChange, onClick, badge, icon, title, popover, isOpen, onOpen, onClose }) {
  const palette = palettes[color] || palettes.default
  const baseStyle = {
    background: accent ? palette.bg : 'var(--surface)',
    border: `2px solid ${accent ? palette.bd : 'var(--border)'}`,
    borderRadius: 10,
    padding: '8px 14px',
    fontFamily: 'inherit',
    textAlign: 'left',
    boxSizing: 'border-box',
    position: 'relative',
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

  if (type === 'popover') {
    return (
      <div style={baseStyle} title={title}>
        <button
          onClick={() => isOpen ? onClose?.() : onOpen?.()}
          style={{
            all: 'unset', display: 'block', width: '100%',
            cursor: 'pointer', boxSizing: 'border-box',
          }}>
          <div style={labelStyle}>
            {label}
            <span style={{ float:'right', fontSize:9, fontWeight:700, opacity:.55 }}>{isOpen ? '▴' : '▾'}</span>
          </div>
          <div style={{ ...valueStyle, color: value ? (accent ? palette.fg : 'var(--text)') : 'var(--text4)', fontStyle: value ? 'normal' : 'italic', fontWeight: value ? 700 : 500 }}>
            {value || '— pendiente'}
          </div>
        </button>
        {isOpen && (
          <PillPopover popover={popover} currentValue={value} onClose={onClose} palette={palette} />
        )}
      </div>
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

function PillPopover({ popover, currentValue, onClose, palette }) {
  const ref = useRef(null)
  const [draft, setDraft] = useState(currentValue ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  // Cerrar al perder foco fuera del popover
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.()
    }
    const onEsc = (e) => { if (e.key === 'Escape') onClose?.() }
    setTimeout(() => document.addEventListener('mousedown', onDocClick), 0)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [onClose])

  const persist = async (newVal) => {
    setSaving(true); setErr(null)
    try {
      await popover.onSave?.(newVal)
      onClose?.()
    } catch (e) {
      setErr(e?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Estilos comunes
  const panelStyle = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    minWidth: 220,
    maxWidth: 320,
    zIndex: 100,
    background: '#fff',
    border: `1px solid ${palette.bd}`,
    borderRadius: 8,
    boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
    padding: 6,
    fontFamily: 'inherit',
  }
  const inpStyle = { width:'100%', padding:'7px 9px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, fontFamily:'inherit', boxSizing:'border-box', outline:'none' }

  // SELECT · clic en opción guarda y cierra (estilo Linear)
  if (popover.type === 'select') {
    return (
      <div ref={ref} style={panelStyle}>
        {popover.options?.map(opt => {
          const isCur = opt.value === currentValue || opt.label === currentValue
          return (
            <button
              key={opt.value}
              onClick={() => persist(opt.value)}
              disabled={saving}
              style={{
                display:'flex', width:'100%', alignItems:'center', gap:8,
                padding:'7px 10px', fontSize:12, border:'none',
                borderRadius:5, cursor:'pointer', textAlign:'left',
                background: isCur ? palette.bg : 'transparent',
                color: isCur ? palette.fg : 'var(--text)',
                fontWeight: isCur ? 700 : 500,
                fontFamily:'inherit',
              }}
              onMouseEnter={e => { if (!isCur) e.currentTarget.style.background = '#f4f4f5' }}
              onMouseLeave={e => { if (!isCur) e.currentTarget.style.background = 'transparent' }}
            >
              {isCur && <span style={{ fontSize:10, color: palette.fg }}>●</span>}
              <span style={{ flex:1 }}>{opt.label}</span>
            </button>
          )
        })}
        {err && <div style={{ padding:'6px 10px', fontSize:11, color:'#dc2626' }}>{err}</div>}
      </div>
    )
  }

  // TEXT / DATE / NUMBER / TEXTAREA · input + botones
  const isMultiline = popover.type === 'textarea'
  return (
    <div ref={ref} style={panelStyle}>
      {isMultiline ? (
        <textarea
          autoFocus
          rows={popover.rows || 4}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={popover.placeholder}
          style={{ ...inpStyle, resize:'vertical', lineHeight:1.5 }}
        />
      ) : (
        <input
          autoFocus
          type={popover.type === 'number' ? 'number' : popover.type === 'date' ? 'date' : 'text'}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') persist(draft) }}
          placeholder={popover.placeholder}
          style={inpStyle}
        />
      )}
      {err && <div style={{ padding:'4px 2px', fontSize:11, color:'#dc2626' }}>{err}</div>}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:6, marginTop:6 }}>
        <button onClick={onClose} style={{ padding:'5px 10px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'#fff', cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
        <button onClick={() => persist(draft)} disabled={saving} style={{ padding:'5px 12px', fontSize:11, border:'none', borderRadius:4, background: palette.fg, color:'#fff', cursor:saving?'wait':'pointer', fontWeight:700, fontFamily:'inherit' }}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
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
