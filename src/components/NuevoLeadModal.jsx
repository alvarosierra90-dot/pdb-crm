import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LEAD_TIPOS, LEAD_PRIORIDADES, LEAD_CANALES } from '../data/mockLeads'

const overlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.48)', zIndex:2000,
  display:'flex', alignItems:'center', justifyContent:'center',
}
const panel = {
  background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12,
  width:620, maxWidth:'94vw', maxHeight:'90vh', overflowY:'auto',
  boxShadow:'0 20px 60px rgba(0,0,0,.22)',
}
const header = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  padding:'16px 20px 14px', borderBottom:'1px solid var(--border)',
}
const body = { padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }
const footer = { padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }
const lbl = { fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4, display:'block' }
const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', boxSizing:'border-box', outline:'none' }

const EQUIPOS = [
  'Leasing Oficinas Madrid',
  'Leasing Oficinas Barcelona',
  'Industrial & Logistics',
  'Retail',
  'Capital Markets',
  'Hotels',
  'Alternativos',
  'Advisory & Consultancy',
  'Valuations',
]

async function nextRef() {
  const year = new Date().getFullYear()
  const prefix = `LD-${year}-`
  const { data } = await supabase
    .from('leads')
    .select('ref')
    .like('ref', `${prefix}%`)
    .order('ref', { ascending: false })
    .limit(1)
    .maybeSingle()
  const last = data?.ref ? parseInt(String(data.ref).split('-').pop(), 10) : 0
  return `${prefix}${String((isNaN(last) ? 0 : last) + 1).padStart(4, '0')}`
}

export default function NuevoLeadModal({ onClose, onSuccess }) {
  const [nombre, setNombre]           = useState('')
  const [tipo, setTipo]               = useState('demanda')
  const [prioridad, setPrioridad]     = useState('media')
  const [canal, setCanal]             = useState('Web corporativa')
  const [campana, setCampana]         = useState('')
  const [anuncio, setAnuncio]         = useState('')
  const [url, setUrl]                 = useState('')
  const [equipo, setEquipo]           = useState('')
  const [responsable, setResponsable] = useState('Sierra Álvaro')
  const [descripcion, setDescripcion] = useState('')
  const [email, setEmail]             = useState('')
  const [telefono, setTelefono]       = useState('')
  const [verMas, setVerMas]           = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState(null)

  const valido = nombre.trim().length > 0 && tipo && !submitting

  const handleCrear = async () => {
    if (!valido) return
    setSubmitting(true)
    setError(null)

    try {
      const ref = await nextRef()
      const ahora = new Date().toISOString()
      const { error } = await supabase.from('leads').insert({
        ref,
        nombre:           nombre.trim(),
        tipo,
        estado:           'nuevo',
        prioridad,
        equipo:           equipo || null,
        responsable:      responsable || null,
        fuente:           canal,
        origen_canal:     canal,
        origen_campana:   campana || null,
        origen_anuncio:   anuncio || null,
        origen_url:       url     || null,
        descripcion:      descripcion || null,
        email:            email    || null,
        telefono:         telefono || null,
        ultima_actividad: ahora,
      })
      if (error) {
        setError(`Error: ${error.message}`)
        setSubmitting(false)
        return
      }
      onSuccess ? onSuccess(ref) : onClose()
    } catch (e) {
      setError(`Error inesperado: ${e.message || e}`)
      setSubmitting(false)
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>

        <div style={header}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>+ Nuevo lead</div>
            <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>Captura manual de lead</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text4)' }}>×</button>
        </div>

        <div style={body}>
          <div>
            <label style={lbl}>Nombre del lead *</label>
            <input style={inp} placeholder="Ej. Búsqueda 1.500 m² oficinas Madrid centro" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Tipo *</label>
              <select style={inp} value={tipo} onChange={e => setTipo(e.target.value)}>
                {LEAD_TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Prioridad</label>
              <select style={inp} value={prioridad} onChange={e => setPrioridad(e.target.value)}>
                {LEAD_PRIORIDADES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Canal de entrada</label>
              <select style={inp} value={canal} onChange={e => setCanal(e.target.value)}>
                {LEAD_CANALES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Equipo asignado</label>
              <select style={inp} value={equipo} onChange={e => setEquipo(e.target.value)}>
                <option value="">— sin asignar —</option>
                {EQUIPOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Responsable inicial</label>
            <input style={inp} placeholder="Nombre del broker responsable" value={responsable} onChange={e => setResponsable(e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Descripción</label>
            <textarea
              style={{ ...inp, resize:'vertical', minHeight:70 }}
              placeholder="Detalles del lead: qué busca/ofrece, requisitos, contexto..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
          </div>

          <button
            onClick={() => setVerMas(v => !v)}
            style={{ background:'none', border:'none', fontSize:11, color:'var(--accent)', cursor:'pointer', textAlign:'left', padding:0, fontWeight:600 }}
          >
            {verMas ? '− Menos datos' : '+ Más datos (campaña, contacto, URL)'}
          </button>

          {verMas && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Campaña</label>
                  <input style={inp} placeholder="Q2-2026 Oficinas Madrid" value={campana} onChange={e => setCampana(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Anuncio concreto</label>
                  <input style={inp} placeholder="Form contacto general" value={anuncio} onChange={e => setAnuncio(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={lbl}>URL de origen</label>
                <input style={inp} placeholder="savills.es/contacto" value={url} onChange={e => setUrl(e.target.value)} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Email del contacto</label>
                  <input style={inp} placeholder="contacto@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Teléfono</label>
                  <input style={inp} placeholder="+34 ..." value={telefono} onChange={e => setTelefono(e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div style={{ background:'#faf5ec', border:'1px solid #ece0c9', borderRadius:8, padding:10, fontSize:11, color:'#1e3a8a' }}>
            El lead nace en estado <strong>nuevo</strong>. Para vincular Cuenta y Contacto de Dynamics y crear la Oportunidad, usa después el botón <strong>⚡ Transformar</strong> en su ficha.
          </div>

          {error && (
            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, padding:10, fontSize:11, color:'#991b1b' }}>
              {error}
            </div>
          )}
        </div>

        <div style={footer}>
          <button className="ab-btn" onClick={onClose}>Cancelar</button>
          <button
            className="ab-btn save"
            onClick={handleCrear}
            disabled={!valido}
            style={{ opacity: valido ? 1 : 0.5, cursor: valido ? 'pointer' : 'not-allowed' }}
          >
            {submitting ? 'Creando…' : '+ Crear lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
