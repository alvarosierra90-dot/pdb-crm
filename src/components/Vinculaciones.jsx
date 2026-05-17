import { useNav } from '../context/NavigationContext'
import { Building, Building2, Target, FileText, ScrollText, Lightbulb } from 'lucide-react'

// Bloque canónico de Vinculaciones para todas las fichas.
// Siempre muestra los enlaces en el mismo orden: Cuenta · Activo · Oportunidad · Instrucción · Mandato (· Propuesta opcional)
// Cada card es clicable y navega a la ficha correspondiente.
// Si una vinculación no existe, se muestra como "—" no clicable (para que la posición
// no se desplace entre módulos y el usuario siempre encuentre la info en el mismo sitio).
//
// Props (todos opcionales, pasa los que tengas):
//   cuenta:      { id, nombre, sub }              → sub opcional (sector, tipo, etc.)
//   cuentaLabel: string                           → override del label (Oferta: "Propietario (Cuenta)", Demanda: "Cliente (Cuenta)", etc.)
//   activo:      { ref, nombre, direccion, sub }
//   oportunidad: { id, nombre, sub }
//   instruccion: { id, nombre, dynamics_id, sub }
//   mandato:     { id, ref, titulo, sub }
//   propuesta:   { id, ref, nombre, sub }         → opcional
export default function Vinculaciones({ cuenta, cuentaLabel, activo, oportunidad, instruccion, mandato, propuesta }) {
  const { navigate } = useNav()

  const items = [
    {
      key:  'cuenta',
      icon: Building2,
      tone: 'green',
      label: cuentaLabel || 'Cuenta',
      value: cuenta?.nombre,
      sub:   cuenta?.sub,
      onClick: cuenta?.id ? () => navigate('cuentas', { id: cuenta.id }) : null,
      dyn: true,
    },
    {
      key:  'activo',
      icon: Building,
      tone: 'bronze',
      label: 'Activo',
      value: activo?.direccion || activo?.nombre,
      sub:   activo?.sub || (activo?.nombre && activo?.direccion ? activo.nombre : null),
      onClick: activo?.ref ? () => navigate('ficha-activo', { ref: activo.ref }) : null,
    },
    {
      key:  'oportunidad',
      icon: Target,
      tone: 'blue',
      label: 'Oportunidad',
      value: oportunidad?.nombre,
      sub:   oportunidad?.sub,
      onClick: oportunidad?.id ? () => navigate('ficha-oportunidad', { id: oportunidad.id }) : null,
      dyn: true,
    },
    {
      key:  'instruccion',
      icon: FileText,
      tone: 'purple',
      label: 'Instrucción',
      value: instruccion?.nombre || instruccion?.dynamics_id,
      sub:   instruccion?.sub,
      onClick: instruccion?.id ? () => navigate('instruccion', { id: instruccion.id }) : null,
      dyn: true,
    },
    {
      key:  'mandato',
      icon: ScrollText,
      tone: 'accent',
      label: 'Mandato',
      value: mandato?.titulo || mandato?.ref,
      sub:   mandato?.sub,
      onClick: mandato?.id ? () => navigate('ficha-mandato', { id: mandato.id }) : null,
    },
  ]
  if (propuesta) {
    items.push({
      key:  'propuesta',
      icon: Lightbulb,
      tone: 'amber',
      label: 'Propuesta',
      value: propuesta.nombre || propuesta.ref,
      sub:   propuesta.sub,
      onClick: propuesta.id ? () => navigate('ficha-propuesta', { id: propuesta.id }) : null,
    })
  }

  return (
    <div className="vinc-block">
      <div className="vinc-head">Vinculaciones</div>
      <div className="vinc-grid">
        {items.map((it) => {
          const Icon = it.icon
          const isEmpty = !it.value
          return (
            <div
              key={it.key}
              className={`vinc-card tone-${it.tone} ${isEmpty ? 'is-empty' : ''} ${it.onClick ? 'is-clickable' : ''}`}
              onClick={it.onClick || undefined}
              title={it.onClick ? `Abrir ${it.label.toLowerCase()}` : undefined}
            >
              <div className="vinc-card-ico"><Icon size={16} strokeWidth={1.75} /></div>
              <div className="vinc-card-body">
                <div className="vinc-card-lbl">
                  {it.label}
                  {it.dyn && <span className="vinc-dyn">D</span>}
                </div>
                {isEmpty ? (
                  <div className="vinc-card-empty">— sin vincular</div>
                ) : (
                  <>
                    <div className="vinc-card-val">
                      {it.value}
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
