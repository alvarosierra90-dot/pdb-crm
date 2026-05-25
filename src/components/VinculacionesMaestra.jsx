import FunnelStepCards from './FunnelStepCards'

/**
 * Banda de Vinculaciones para entidades maestras (Activo, Cuenta, Lead,
 * Oportunidad, Arrendatario, Propietario). A diferencia de <Vinculaciones>,
 * que muestra "de quién dependo", esta banda muestra "qué cuelga de mí".
 *
 * Desde mayo 2026 delega en FunnelStepCards para mantener el canon
 * visual único (Apple HIG, vacant gris hasta tener vínculo, color por
 * concepto). Los props legacy (onClick, count, isEmpty) se mapean a la
 * API de FunnelStepCards (openAction, count, status='current' + vacant).
 *
 * Props:
 *   items: array de 2-6 cards. Cada item:
 *     {
 *       key, icon, tone, label, value, sub,
 *       onClick: () => void | null,   // null → card no clicable
 *       count:   N | null,            // si representa una colección
 *     }
 */
export default function VinculacionesMaestra({ items }) {
  const steps = (items || []).map(it => {
    const hasValue = !!it.value || it.count != null
    return {
      key:    it.key,
      icon:   it.icon,
      tone:   it.tone || 'accent',
      label:  it.label,
      value:  it.value,
      sub:    it.sub,
      count:  it.count,
      status: hasValue ? 'done' : 'current',
      vacant: !hasValue,
      openAction: hasValue && it.onClick ? { label:`Abrir ${(it.label || '').toLowerCase()}`, onClick: it.onClick } : null,
    }
  })
  return <FunnelStepCards steps={steps} />
}
