/**
 * Cards del funnel comercial con 3 estados: done · current · locked.
 * Sustituye a <Vinculaciones> y <VinculacionesMaestra> en las fichas del funnel,
 * convirtiendo cada vínculo en un paso visible con CTA propio.
 *
 * Filosofía wizard paso-a-paso:
 *  · Card CURRENT  → muestra CTA primary grande que abre el modal del paso.
 *  · Card DONE     → muestra los datos + dos acciones: [✎ Editar] [→ Siguiente paso].
 *                    El botón "Editar" reabre el mismo modal; "Siguiente" lleva
 *                    el foco a la siguiente card current.
 *  · Card LOCKED   → gris, sin acciones, hint "completa el paso anterior".
 *
 * Props por step:
 *   key:         string
 *   icon:        LucideIcon
 *   tone:        'green'|'bronze'|'blue'|'purple'|'accent'|'amber'
 *   label:       string
 *   value:       string|null            // contenido principal (nombre, ref, etc.)
 *   sub:         string|null
 *   status:      'done'|'current'|'locked'
 *   action:      { label, onClick, primary } | null   // CTA cuando current
 *   editAction:  { label, onClick } | null            // ✎ Editar cuando done (reabre el modal)
 *   nextAction:  { label, onClick } | null            // → Siguiente paso cuando done
 *   openAction:  { label, onClick } | null            // ↗ Abrir ficha del registro (opcional)
 *   lockedHint:  string|null
 *   dyn:         boolean
 *   count:       number|null
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

function StepCard({
  icon: Icon, tone = 'accent', label, value, sub,
  status, action, secondaryAction, editAction, nextAction, openAction, lockedHint,
  dyn, count, index, total, extraBody, optional,
}) {
  const isDone    = status === 'done'
  const isCurrent = status === 'current'
  const isLocked  = status === 'locked'

  // Si la card está done y tiene openAction, todo el cuerpo es clicable y
  // navega al registro vinculado. Los botones internos hacen stopPropagation.
  const cardClickable = isDone && !!openAction
  const handleCardClick = cardClickable ? () => openAction.onClick?.() : undefined

  return (
    <div
      className={`step-card tone-${tone} step-${status}${cardClickable ? ' step-clickable' : ''}`}
      onClick={handleCardClick}
      style={cardClickable ? { cursor:'pointer' } : undefined}
      role={cardClickable ? 'button' : undefined}
      tabIndex={cardClickable ? 0 : undefined}
    >
      <div className="step-card-ico">
        <Icon size={16} strokeWidth={1.75} />
      </div>
      <div className="step-card-body">
        <div className="step-card-lbl">
          <span className="step-num">{index + 1}/{total}</span>
          {label}
          {dyn      && <span className="vinc-dyn">D</span>}
          {optional && <span className="step-pill-optional">OPCIONAL</span>}
          {isCurrent && <span className="step-pill-current">PASO ACTUAL</span>}
          {isDone    && <span className="step-pill-done">✓</span>}
          {isLocked  && <span className="step-pill-locked">🔒</span>}
        </div>

        {isDone && (
          <>
            <div className="step-card-val">
              {count != null ? <>{count} {value || ''}</> : (value || '—')}
            </div>
            {sub && <div className="step-card-sub">{sub}</div>}
            {extraBody && <div className="step-card-extra">{extraBody}</div>}
            <div className="step-card-actions">
              {editAction && (
                <button
                  className="step-mini-btn"
                  onClick={(e) => { e.stopPropagation(); editAction.onClick?.() }}
                  title={editAction.label || 'Editar este paso'}
                >
                  ✎ {editAction.label || 'Editar'}
                </button>
              )}
              {openAction && (
                <button
                  className="step-mini-btn"
                  onClick={(e) => { e.stopPropagation(); openAction.onClick?.() }}
                  title={openAction.label || 'Abrir ficha'}
                >
                  ↗ {openAction.label || 'Abrir'}
                </button>
              )}
              {nextAction && (
                <button
                  className="step-mini-btn is-next"
                  onClick={(e) => { e.stopPropagation(); nextAction.onClick?.() }}
                  title={nextAction.label || 'Ir al siguiente paso'}
                >
                  {nextAction.label || 'Siguiente paso'} →
                </button>
              )}
            </div>
          </>
        )}

        {isCurrent && (
          <>
            {value && <div className="step-card-val">{value}</div>}
            {extraBody && <div className="step-card-extra">{extraBody}</div>}
            <div className="step-card-cta">
              {action ? (
                <button
                  className={`step-cta-btn ${action.primary ? 'is-primary' : ''}`}
                  onClick={(e) => { e.stopPropagation(); action.onClick?.() }}
                >
                  {action.label}
                </button>
              ) : (
                !extraBody && <div className="step-card-empty">Pendiente · sigue aquí.</div>
              )}
              {secondaryAction && (
                <button
                  className="step-cta-btn"
                  style={{ marginTop:6 }}
                  onClick={(e) => { e.stopPropagation(); secondaryAction.onClick?.() }}
                >
                  {secondaryAction.label}
                </button>
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
