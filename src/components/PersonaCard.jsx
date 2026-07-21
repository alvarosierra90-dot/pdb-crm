import { useState } from 'react'

// Paleta por rol · coherente con ROL_TAG de EquipoTrabajoCard
export const TONE = {
  'Principal':   { bg:'#faf5ec', ring:'#ece0c9', ink:'#6f5734', chip:'#8a6d3b', chipBg:'#f6edda' },
  'Soporte':     { bg:'#f5f3ff', ring:'#ddd6fe', ink:'#6b5b8e', chip:'#6d28d9', chipBg:'#f0ebff' },
  'Colaborador': { bg:'#f1f5f9', ring:'#cbd5e1', ink:'#475569', chip:'#475569', chipBg:'#eef2f7' },
  'Cliente':     { bg:'#ecfdf5', ring:'#a7f3d0', ink:'#0f766e', chip:'#0f766e', chipBg:'#d1fae5' },
}
export const toneOf = rol => TONE[rol] || TONE['Colaborador']
export const iniciales = n => (n || '?').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()

/**
 * Control de valoración por estrellas (1–5). Click en la estrella actual la
 * limpia (0). Solo interactivo si `canManage`.
 */
export function StarRating({ value = 0, onRate, canManage = true, accent = '#d4a017', size = 15 }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(i => {
        const on = i <= shown
        return (
          <button
            key={i}
            type="button"
            disabled={!canManage}
            onMouseEnter={() => canManage && setHover(i)}
            onClick={() => canManage && onRate?.(value === i ? 0 : i)}
            aria-label={`${i} estrella${i === 1 ? '' : 's'}`}
            style={{
              background:'none', border:'none', padding:0, lineHeight:1,
              cursor: canManage ? 'pointer' : 'default',
              fontSize:size, color: on ? accent : '#d7dde5',
              transition:'color .12s, transform .08s',
              transform: hover === i ? 'scale(1.18)' : 'none',
            }}
          >{on ? '★' : '☆'}</button>
        )
      })}
      <span style={{ marginLeft:5, fontSize:10, fontWeight:600, color: value ? accent : '#9aa5b1', minWidth:44 }}>
        {value ? `${value}.0` : 'Sin valorar'}
      </span>
    </div>
  )
}

/** Teléfono formateado clicable (tel:) o guion si no hay. */
export function TelefonoInline({ telefono, style }) {
  if (!telefono) return <span style={{ color:'#cbd5e1', fontSize:11, ...style }}>—</span>
  return (
    <a href={`tel:${String(telefono).replace(/\s+/g, '')}`} onClick={e => e.stopPropagation()}
      style={{ fontSize:11, color:'#475569', textDecoration:'none', fontFamily:'var(--mono)', whiteSpace:'nowrap', ...style }}>
      📞 {telefono}
    </a>
  )
}

/**
 * Card visual de una persona del equipo / proveedor externo / cliente.
 *
 * @param {object}   persona    { nombre, equipo, rol, valoracion, telefono }
 * @param {boolean}  canManage  Habilita valorar y quitar
 * @param {Function} onRate     (valoracion:number) => void
 * @param {Function} onRemove   () => void
 */
export default function PersonaCard({ persona, canManage = true, onRate, onRemove }) {
  const [hover, setHover] = useState(false)
  const t = toneOf(persona?.rol)
  const esExterno = persona?.rol === 'Colaborador' || persona?.rol === 'Cliente'
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position:'relative', display:'flex', flexDirection:'column', gap:10,
        padding:'12px 13px', borderRadius:12,
        border:`1px solid ${hover ? t.ring : 'var(--border)'}`, background:'#fff',
        boxShadow: hover ? '0 6px 18px rgba(15,23,42,.09)' : '0 1px 2px rgba(15,23,42,.05)',
        transition:'box-shadow .14s, border-color .14s, transform .08s',
        transform: hover ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Cabecera: avatar + nombre + rol */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:38, height:38, borderRadius:'50%', flexShrink:0,
          background:t.bg, color:t.ink, border:`1px solid ${t.ring}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:12.5, fontWeight:800, letterSpacing:'.02em',
        }}>{iniciales(persona?.nombre)}</div>

        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, minWidth:0 }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, minWidth:0 }} title={persona?.nombre}>
              {persona?.nombre || '—'}
            </div>
            {persona?.telefono && <TelefonoInline telefono={persona.telefono} style={{ flexShrink:0 }} />}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3, minWidth:0 }}>
            <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.03em', color:t.chip, background:t.chipBg, border:`1px solid ${t.ring}`, borderRadius:6, padding:'1px 6px' }}>
              {persona?.rol || 'Colaborador'}
            </span>
            <span style={{ fontSize:10.5, color:'#64748b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0 }} title={persona?.equipo}>
              {esExterno ? '🏷️ ' : ''}{persona?.equipo || '—'}
            </span>
          </div>
        </div>

        {canManage && (
          <button
            onClick={onRemove}
            title="Quitar"
            style={{
              flexShrink:0, width:22, height:22, borderRadius:6, border:'none',
              background: hover ? '#fef2f2' : 'transparent', color: hover ? '#dc2626' : '#cbd5e1',
              cursor:'pointer', fontSize:14, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background .12s, color .12s',
            }}
          >×</button>
        )}
      </div>

      {/* Valoración */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, paddingTop:9, borderTop:'1px solid var(--border)' }}>
        <span style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'#94a3b8' }}>Valoración</span>
        <StarRating value={Number(persona?.valoracion) || 0} onRate={onRate} canManage={canManage} />
      </div>
    </div>
  )
}
