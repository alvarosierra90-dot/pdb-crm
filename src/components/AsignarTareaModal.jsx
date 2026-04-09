import { useState } from 'react'
import { useTasks } from '../context/TasksContext'

const USUARIOS = [
  'Sierra Alvaro',
  'GOMEZ Ignacio',
  'Consultor MAD',
  'Alonso Abruña D.',
  'Manager',
  'Director',
]

const TIPOS = ['Gestión de producto', 'Acción comercial', 'Estrategia', 'Seguimiento']

const todayISO = () => new Date().toISOString().split('T')[0]

export default function AsignarTareaModal({ refTipo, refNombre, onClose }) {
  const { addTask } = useTasks()
  const [form, setForm] = useState({
    asunto:      '',
    descripcion: '',
    responsable: USUARIOS[0],
    tipo:        TIPOS[0],
    prioridad:   'Media',
    fechaLimite: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    if (!form.asunto.trim()) return
    addTask({ ...form, refTipo, refNombre })
    setSubmitted(true)
  }

  // ── styles ──────────────────────────────────────────
  const overlay = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.48)',
    zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const panel = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    width: 480,
    maxWidth: '94vw',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,.22)',
  }
  const header = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px 14px',
    borderBottom: '1px solid var(--border)',
  }
  const body   = { padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }
  const footer = {
    padding: '14px 20px',
    borderTop: '1px solid var(--border)',
    display: 'flex', gap: 8, justifyContent: 'flex-end',
  }
  const lbl = {
    fontSize: 10, fontWeight: 700, color: 'var(--text4)',
    textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4, display: 'block',
  }
  const inp = {
    width: '100%', padding: '7px 10px', fontSize: 12,
    border: '1px solid var(--border)', borderRadius: 6,
    background: 'var(--surface)', color: 'var(--text)',
    fontFamily: 'inherit', boxSizing: 'border-box',
    outline: 'none',
  }
  const sel = { ...inp }
  const textarea = { ...inp, resize: 'vertical', minHeight: 64 }
  const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
  const refBox = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px',
    background: 'var(--accent-lt)',
    border: '1px solid var(--accent-bd)',
    borderRadius: 8, marginBottom: 2,
  }

  // ── success screen ───────────────────────────────────
  if (submitted) return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...panel, textAlign: 'center', padding: '40px 32px' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Tarea asignada</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>
          <strong>{form.asunto}</strong>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
          Asignada a <strong>{form.responsable}</strong> · Prioridad <strong>{form.prioridad}</strong>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 20 }}>
          Vinculada a {refTipo}: <strong>{refNombre}</strong>
        </div>
        <button className="ab-btn save" onClick={onClose} style={{ width: '100%', justifyContent: 'center', padding: '9px 0' }}>
          Cerrar
        </button>
      </div>
    </div>
  )

  // ── form ─────────────────────────────────────────────
  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={header}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>✅ Asignar tarea</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              Nueva tarea vinculada a este registro
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: 'var(--text3)', lineHeight: 1, padding: 4,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={body}>

          {/* Referencia vinculada (read-only) */}
          <div>
            <span style={lbl}>Referencia vinculada</span>
            <div style={refBox}>
              <span style={{
                background: 'var(--accent)', color: '#fff',
                borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0,
              }}>{refTipo}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{refNombre}</span>
            </div>
          </div>

          {/* Asunto */}
          <div>
            <span style={lbl}>Asunto <span style={{ color: 'var(--red)' }}>*</span></span>
            <input
              style={{ ...inp, borderColor: !form.asunto && submitted ? 'var(--red)' : undefined }}
              placeholder="Describe brevemente la tarea..."
              value={form.asunto}
              onChange={e => set('asunto', e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div>
            <span style={lbl}>Descripción</span>
            <textarea
              style={textarea}
              placeholder="Detalle adicional, instrucciones o contexto..."
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
            />
          </div>

          {/* Responsable + Tipo */}
          <div style={row2}>
            <div>
              <span style={lbl}>Usuario asignado</span>
              <select style={sel} value={form.responsable} onChange={e => set('responsable', e.target.value)}>
                {USUARIOS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <span style={lbl}>Tipo de tarea</span>
              <select style={sel} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Prioridad + Fecha límite */}
          <div style={row2}>
            <div>
              <span style={lbl}>Prioridad</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Alta', 'Media', 'Baja'].map(p => (
                  <button
                    key={p}
                    onClick={() => set('prioridad', p)}
                    style={{
                      flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600,
                      border: '1px solid',
                      borderColor: form.prioridad === p
                        ? p === 'Alta' ? 'var(--red-bd)' : p === 'Media' ? 'var(--amber-bd)' : 'var(--gray-bd)'
                        : 'var(--border)',
                      borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                      background: form.prioridad === p
                        ? p === 'Alta' ? 'var(--red-lt)' : p === 'Media' ? 'var(--amber-lt)' : 'var(--gray-lt)'
                        : 'var(--surface)',
                      color: form.prioridad === p
                        ? p === 'Alta' ? 'var(--red)' : p === 'Media' ? 'var(--amber)' : 'var(--text3)'
                        : 'var(--text3)',
                    }}
                  >
                    {p === 'Alta' ? '⬆' : p === 'Media' ? '→' : '⬇'} {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span style={lbl}>Fecha límite</span>
              <input
                type="date"
                style={inp}
                min={todayISO()}
                value={form.fechaLimite}
                onChange={e => set('fechaLimite', e.target.value)}
              />
            </div>
          </div>

          {/* Creador + Estado (informativo) */}
          <div style={{
            display: 'flex', gap: 16,
            padding: '8px 12px',
            background: 'var(--gray-lt)',
            borderRadius: 8, fontSize: 11, color: 'var(--text3)',
          }}>
            <span>👤 Creada por: <strong>Sierra Alvaro</strong></span>
            <span>📌 Estado inicial: <strong>Pendiente</strong></span>
          </div>

        </div>

        {/* Footer */}
        <div style={footer}>
          <button className="ab-btn" onClick={onClose}>Cancelar</button>
          <button
            className="ab-btn save"
            onClick={handleSubmit}
            style={{ opacity: form.asunto.trim() ? 1 : 0.5 }}
          >
            ✅ Crear tarea
          </button>
        </div>

      </div>
    </div>
  )
}
