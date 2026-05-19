import { useNav } from '../context/NavigationContext'

/**
 * Banda de Vinculaciones para entidades maestras (Activo, Cuenta, Lead,
 * Oportunidad, Arrendatario, Propietario). A diferencia de <Vinculaciones>,
 * que muestra "de quién dependo" (Cuenta · Activo · Oportunidad · ...), esta
 * banda muestra "qué cuelga de mí" — los vínculos naturales que tiene la
 * entidad maestra hacia entidades operativas.
 *
 * Props:
 *   items: array de 2-6 cards. Cada item:
 *     {
 *       key:     'propietario',                 // único
 *       icon:    LucideIcon,                    // del paquete lucide-react
 *       tone:    'green' | 'bronze' | 'blue' | 'purple' | 'accent' | 'amber',
 *       label:   'Propietario',                 // título de la card
 *       value:   'BBVA SL' | null,              // null → "— sin info"
 *       sub:     '8.450 m² · 2 plantas' | null, // secundario opcional
 *       onClick: () => navigate(...) | null,    // null → card no clicable
 *       count:   3 | null,                      // si la card representa una colección
 *     }
 */
export default function VinculacionesMaestra({ items }) {
  return (
    <div className="vinc-block">
      <div className="vinc-grid">
        {items.map((it) => {
          const Icon = it.icon
          const isEmpty = !it.value && it.count == null
          return (
            <div
              key={it.key}
              className={`vinc-card tone-${it.tone || 'accent'} ${isEmpty ? 'is-empty' : ''} ${it.onClick ? 'is-clickable' : ''}`}
              onClick={it.onClick || undefined}
              title={it.onClick ? `Abrir ${it.label.toLowerCase()}` : undefined}
            >
              <div className="vinc-card-ico"><Icon size={16} strokeWidth={1.75} /></div>
              <div className="vinc-card-body">
                <div className="vinc-card-lbl">{it.label}</div>
                {isEmpty ? (
                  <div className="vinc-card-empty">— sin info</div>
                ) : (
                  <>
                    <div className="vinc-card-val">
                      {it.count != null
                        ? <>{it.count} {it.value || ''}</>
                        : it.value}
                      {it.onClick && <span className="vinc-arrow">↗</span>}
                    </div>
                    {it.sub && <div className="vinc-card-sub">{it.sub}</div>}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
