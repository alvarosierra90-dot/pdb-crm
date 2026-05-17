import { useNav } from '../context/NavigationContext'

// Bloque canónico de Vinculaciones para todas las fichas.
// Siempre muestra los enlaces en el mismo orden: Cuenta · Activo · Oportunidad · Instrucción · Mandato
// Cada chip es clicable y navega a la ficha correspondiente.
// Si una vinculación no existe, se muestra como "—" no clicable (para que la posición
// no se desplace entre módulos y el usuario siempre encuentre la info en el mismo sitio).
//
// Props (todos opcionales, pasa los que tengas):
//   cuenta:      { id, nombre }                  → navega a ficha-cuenta
//   cuentaLabel: string                          → override del label "Cuenta" para reflejar el rol
//                                                  (Oferta: "Propietario (Cuenta)", Demanda: "Cliente (Cuenta)", etc.)
//   activo:      { ref, nombre, direccion }      → navega a ficha-activo
//   oportunidad: { id, nombre }                  → navega a ficha-oportunidad
//   instruccion: { id, nombre, dynamics_id }     → muestra chip (read-only, vive en Dynamics)
//   mandato:     { id, ref, titulo }             → navega a ficha-mandato
//   propuesta:   { id, ref, nombre }             → navega a ficha-propuesta (opcional, algunas fichas la incluyen)
export default function Vinculaciones({ cuenta, cuentaLabel, activo, oportunidad, instruccion, mandato, propuesta }) {
  const { navigate } = useNav()

  const items = [
    {
      label: cuentaLabel || 'Cuenta',
      value: cuenta?.nombre,
      onClick: cuenta?.id ? () => navigate('cuentas', { id: cuenta.id }) : null,
      dyn: true,
    },
    {
      label: 'Activo',
      value: activo?.direccion || activo?.nombre,
      onClick: activo?.ref ? () => navigate('ficha-activo', { ref: activo.ref }) : null,
    },
    {
      label: 'Oportunidad',
      value: oportunidad?.nombre,
      onClick: oportunidad?.id ? () => navigate('ficha-oportunidad', { id: oportunidad.id }) : null,
      dyn: true,
    },
    {
      label: 'Instrucción',
      value: instruccion?.nombre || instruccion?.dynamics_id,
      onClick: instruccion?.id ? () => navigate('instruccion', { id: instruccion.id }) : null,
      dyn: true,
    },
    {
      label: 'Mandato',
      value: mandato?.titulo || mandato?.ref,
      onClick: mandato?.id ? () => navigate('ficha-mandato', { id: mandato.id }) : null,
    },
  ]
  if (propuesta) {
    items.push({
      label: 'Propuesta',
      value: propuesta.nombre || propuesta.ref,
      onClick: propuesta.id ? () => navigate('ficha-propuesta', { id: propuesta.id }) : null,
    })
  }

  return (
    <div className="vinc-block">
      <div className="vinc-head">Vinculaciones</div>
      <div className="vinc-grid">
        {items.map((it) => (
          <div key={it.label} className="vinc-cell">
            <div className="vinc-lbl">
              {it.label}
              {it.dyn && <span className="vinc-dyn">Dynamics</span>}
            </div>
            {it.value ? (
              it.onClick ? (
                <span className="vinc-val link" onClick={it.onClick} title={`Abrir ${it.label.toLowerCase()}`}>
                  {it.value} <span className="vinc-arrow">↗</span>
                </span>
              ) : (
                <span className="vinc-val">{it.value}</span>
              )
            ) : (
              <span className="vinc-val empty">—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
