/**
 * Cards del funnel comercial con 3 estados: done · current · locked.
 * Sustituye a <Vinculaciones> y <VinculacionesMaestra> en las fichas del funnel,
 * convirtiendo cada vínculo en un paso visible con CTA propio.
 *
 * Filosofía:
 *  · El usuario no tiene que ir al action-bar para encontrar "qué hago ahora".
 *    El CTA vive en la card del paso actual.
 *  · Pasos vacíos a la izquierda del actual se ven como "done" (rellenos).
 *  · Pasos a la derecha del actual son "locked" hasta que el actual se complete.
 *  · Cada card sigue siendo clicable hacia su ficha si ya está rellena.
 *
 * Props:
 *   steps: Array<{
 *     key:         string                    // id único del paso ('cuenta','oportunidad'...)
 *     icon:        LucideIcon                // del paquete lucide-react
 *     tone:        'green'|'bronze'|'blue'|'purple'|'accent'|'amber'
 *     label:       string                    // 'Cuenta', 'Oportunidad'...
 *     value:       string|null               // 'Acme Spain SL' o null si vacío
 *     sub:         string|null               // contexto secundario
 *     status:      'done'|'current'|'locked' // estado del paso
 *     onOpen:      () => void|null           // navega a la ficha del registro vinculado
 *     action:      { label, onClick, primary } | null  // CTA cuando status === 'current'
 *     lockedHint:  string|null               // texto cuando locked ("rellena el paso anterior")
 *     dyn:         boolean                   // badge "D" (Dynamics)
 *     count:       number|null               // para colecciones (maestras: "3 ofertas activas")
 *   }>
 */
export default function FunnelStepCards({ steps }) {
  return (
    <div className="vinc-block">
      <div className="step-grid">
        {steps.map((s, i) => (
          <StepCard key={s.key} {...s} index={i} total={steps.length} />
        ))}
      </div>
    </div>
  )
}

function StepCard({ icon: Icon, tone = 'accent', label, value, sub, status, onOpen, action, lockedHint, dyn, count, index, total }) {
  const isDone    = status === 'done'
  const isCurrent = status === 'current'
  const isLocked  = status === 'locked'

  const stepBadge = `${index + 1}/${total}`

  return (
    <div
      className={`step-card tone-${tone} step-${status} ${isDone && onOpen ? 'is-clickable' : ''}`}
      onClick={(isDone && onOpen) ? onOpen : undefined}
      title={(isDone && onOpen) ? `Abrir ${label.toLowerCase()}` : undefined}
    >
      <div className="step-card-ico">
        <Icon size={16} strokeWidth={1.75} />
      </div>
      <div className="step-card-body">
        <div className="step-card-lbl">
          <span className="step-num">{stepBadge}</span>
          {label}
          {dyn && <span className="vinc-dyn">D</span>}
          {isCurrent && <span className="step-pill-current">PASO ACTUAL</span>}
          {isDone    && <span className="step-pill-done">✓</span>}
          {isLocked  && <span className="step-pill-locked">🔒</span>}
        </div>

        {isDone && (
          <>
            <div className="step-card-val">
              {count != null ? <>{count} {value || ''}</> : value}
              {onOpen && <span className="vinc-arrow">↗</span>}
            </div>
            {sub && <div className="step-card-sub">{sub}</div>}
          </>
        )}

        {isCurrent && (
          <>
            {value && <div className="step-card-val">{value}</div>}
            <div className="step-card-cta">
              {action ? (
                <button
                  className={`step-cta-btn ${action.primary ? 'is-primary' : ''}`}
                  onClick={(e) => { e.stopPropagation(); action.onClick?.() }}
                >
                  {action.label}
                </button>
              ) : (
                <div className="step-card-empty">Pendiente · sigue aquí.</div>
              )}
            </div>
          </>
        )}

        {isLocked && (
          <div className="step-card-locked-msg">
            {lockedHint || 'Completa el paso anterior para desbloquear.'}
          </div>
        )}
      </div>
    </div>
  )
}
