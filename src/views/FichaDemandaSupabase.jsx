import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'
import EquipoTrabajoCard, { makeEquipoHandlers, isPrincipal, EQUIPOS_SAVILLS, MIEMBROS_POR_EQUIPO } from '../components/EquipoTrabajoCard'
import FirmarMandatoModal from '../components/FirmarMandatoModal'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'

const DEM_TABS = [
  ['dem-info', 'Información general'],
  ['dem-req',  'Requisitos'],
  ['dem-360',  'Vista 360'],
  ['dem-docs', 'Documentos'],
  ['dem-neg',  'Negociaciones'],
  ['dem-conf', 'Confidencialidad'],
]

const USOS_TIPOLOGIAS = {
  'Oficinas': ['Oficina tradicional','Coworking','Subarriendo','Business park','Sede única (HQ)'],
  'Logístico / Industrial': ['Nave logística','Nave industrial','Última milla','Plataforma logística','Cross-docking'],
  'Retail': ['High Street','Local en centro comercial','Parque comercial','Local stand-alone','Flagship store'],
  'Centros comerciales': ['Centro comercial dominante','Centro comercial secundario','Parque de medianas','Outlet','Participación en centro'],
  'Residencial': ['Vivienda plurifamiliar','Vivienda unifamiliar','Obra nueva','Segunda mano'],
  'Living (PRS / BTR / Flex)': ['Build to Rent (BTR)','Build to Sell (BTS)','Flex living','Student housing','Senior living','Coliving'],
  'Hoteles': ['Hotel urbano','Hotel vacacional','Resort','Aparthotel','Hotel Boutique','Hostal'],
  'Suelos': ['Suelo finalista','Suelo en desarrollo','Suelo urbanizable'],
  'Alternativos': ['Data center','Self-storage','Sanitario','Educativo'],
  'Mixto': ['Uso mixto'],
}

const RAZONES_LEASING = ['Expansión / Crecimiento','Reducción','Reubicación','Reagrupación','Creación','Obsoleto']

// Motivos por los que se descarta una Demanda (buy-side)
const MOTIVOS_DESCARTE_DEMANDA = [
  'Renegocia en su actual ubicación',
  'Firma en otra ubicación',
  'Operación cerrada con otra consultora',
  'Cuenta cancela el proyecto',
  'Aplaza decisión sin fecha',
  'Sin presupuesto / proyecto inviable',
  'Cambio de estrategia interna',
  'Sin respuesta de la Cuenta',
  'Spam / no cualificada',
  'Otro motivo',
]

const PROVINCIAS_LISTA = ['Madrid','Barcelona','Valencia','Sevilla','Bilbao','Málaga','Zaragoza','Alicante','Las Palmas','Mallorca']
const ZONAS_MADRID = ['CBD','M-30','A-1 · Alcobendas','A-1 · Tres Cantos','A-2 · Corredor del Henares','A-3 · Vallecas','A-4 · Getafe','A-5 · Pozuelo','A-6 · Las Rozas','M-40','M-50','Centro','Salamanca','Chamberí','Chamartín','Castellana']

// Estilo coherente con of-inp/of-sel
const sel = { width:'auto', padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inp = { width:80,    padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inpFull = { ...inp, width:'100%' }
const ta  = { width:'100%', padding:'6px 9px', fontSize:11.5, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit', minHeight:60, lineHeight:1.5, resize:'vertical' }

function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('es-ES') }

const ESTADO_OPTS = [
  { v:'ongoing',           label:'En curso' },
  { v:'potencial',         label:'Potencial' },
  { v:'paralizada',        label:'Paralizado' },
  { v:'descartada',        label:'Descartado' },
  { v:'cerrada_concedido', label:'Cerrada · Concedido' },
  { v:'cerrada_perdida',   label:'Cerrada · Perdida' },
]
const ESTADO_LABEL = Object.fromEntries(ESTADO_OPTS.map(o => [o.v, o.label]))

// Paleta visual por estado · usada en header, badge de estado grande y lista
const ESTADO_COLOR = {
  ongoing:           { tag:'tag-green', headerCol:'var(--green)',  bg:'#dcfce7', bd:'#86efac', text:'#15803d', icon:'●' },
  potencial:         { tag:'tag-blue',  headerCol:'var(--accent)', bg:'#dbeafe', bd:'#93c5fd', text:'#1d4ed8', icon:'◌' },
  paralizada:        { tag:'tag-amber', headerCol:'var(--amber)',  bg:'#fef3c7', bd:'#fcd34d', text:'#92400e', icon:'⏸' },
  descartada:        { tag:'tag-red',   headerCol:'#dc2626',       bg:'#fee2e2', bd:'#fca5a5', text:'#991b1b', icon:'✕' },
  cerrada_concedido: { tag:'tag-green', headerCol:'var(--green)',  bg:'#dcfce7', bd:'#86efac', text:'#15803d', icon:'🏆' },
  cerrada_perdida:   { tag:'tag-red',   headerCol:'#dc2626',       bg:'#fee2e2', bd:'#fca5a5', text:'#991b1b', icon:'✕' },
}

function StubTab({ label }) {
  return (
    <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>
      <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
      <div style={{ fontWeight:600, color:'var(--text2)', marginBottom:4 }}>{label}</div>
      <div>Sección disponible cuando completes la información básica y guardes la demanda.</div>
    </div>
  )
}

// Chip selector reutilizable (provincias, zonas, contactos)
function Chip({ label, onRemove, color = 'var(--accent)' }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      background:'var(--accent-lt)', color, border:'1px solid var(--accent-bd)',
      padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500,
    }}>
      {label}
      {onRemove && <span style={{ cursor:'pointer', color:'var(--text4)', fontWeight:600 }} onClick={onRemove}>×</span>}
    </span>
  )
}

export default function FichaDemandaSupabase({ refOrId }) {
  const { navigate } = useNav()
  const [tab, setTab] = useState('dem-info')
  const [demanda, setDemanda] = useState(null)
  const [cuenta, setCuenta]   = useState(null)
  const [demandaConfidential, setDemandaConfidential] = useState(false)
  const [demandaAuthUsers, setDemandaAuthUsers] = useState([
    { name: CURRENT_USER.nombre, team: CURRENT_USER.equipo || 'Equipo PDB', role:'Principal', initials:(CURRENT_USER.nombre||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(), bg:'#dbeafe', color:'#1e40af', owner:true },
  ])
  const [contactosCuenta, setContactosCuenta] = useState([])
  const [otrosContactosFull, setOtrosContactosFull] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // editing siempre true: los campos son inputs reales desde el primer
  // segundo. Se mantiene la variable para no tocar el resto del JSX.
  const editing = true
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [showFirmarModal, setShowFirmarModal] = useState(false)
  const [oportunidad, setOportunidad] = useState(null)
  const [showAddEq, setShowAddEq] = useState(false)
  const [newEqDraft, setNewEqDraft] = useState({ equipo:'', usuario:'', rol:'Soporte' })

  const [form, setForm] = useState({
    nombre:'', estatus:'', notas:'', motivo_descarte:'',
    naturaleza:'', tipo_activo:'', uso_principal:'', tipologia:'', razon_busqueda:'', timing:'',
    sup_min:'', sup_max:'',
    presupuesto_tipo:'', alq_min:'', alq_max:'', venta_m2_min:'', venta_m2_max:'',
    provincias:[], zonas:[], calles:'', puntos_interes:'', puntos_evitar:'',
    otros_contactos:[],
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('demandas')
      .select(`
        id, ref, nombre, estatus, notas, motivo_descarte, requisitos, otros_contactos, equipo_trabajo,
        dynamics_account_id, dynamics_opportunity_id, mandato_id, created_at, updated_at,
        dynamics_accounts:dynamics_account_id ( dynamics_id, nombre, tipo, sector, direccion, codigo_postal, ciudad, pais, telefono, web ),
        dynamics_opportunities:dynamics_opportunity_id ( dynamics_id, nombre, tipo ),
        mandato:mandato_id ( id, ref )
      `)
      .eq('ref', refOrId)
      .maybeSingle()
    if (error) { setError(error.message); setDemanda(null); setLoading(false); return }
    if (!data)  { setError(`Demanda ${refOrId} no encontrada`); setDemanda(null); setLoading(false); return }
    setDemanda(data)
    setCuenta(data.dynamics_accounts)
    setOportunidad(data.dynamics_opportunities)

    // Cargar todos los contactos de la cuenta para el typeahead
    if (data.dynamics_account_id) {
      const { data: cts } = await supabase
        .from('dynamics_contacts')
        .select('dynamics_id, nombre, email, telefono')
        .eq('cuenta_dynamics_id', data.dynamics_account_id)
        .order('nombre')
      setContactosCuenta(cts || [])
    } else {
      setContactosCuenta([])
    }

    // Resolver los otros contactos persistidos en jsonb a sus datos completos
    const ids = Array.isArray(data.otros_contactos) ? data.otros_contactos : []
    if (ids.length) {
      const { data: full } = await supabase
        .from('dynamics_contacts')
        .select('dynamics_id, nombre, email, telefono')
        .in('dynamics_id', ids)
      setOtrosContactosFull(full || [])
    } else {
      setOtrosContactosFull([])
    }

    setError(null)
    setLoading(false)
  }, [refOrId])

  useEffect(() => { load() }, [load])

  // Cada vez que la demanda se (re)carga, sincroniza el form para que los
  // inputs reflejen el estado persistido. El usuario puede modificar
  // libremente y pulsar Guardar para persistir.
  useEffect(() => {
    if (!demanda) return
    const r = demanda.requisitos || {}
    setForm({
      nombre:           demanda.nombre || (cuenta?.nombre || ''),
      estatus:          demanda.estatus || 'ongoing',
      notas:            demanda.notas || '',
      motivo_descarte:  demanda.motivo_descarte || '',
      naturaleza:       r.naturaleza || '',
      tipo_activo:      r.tipo_activo || '',
      uso_principal:    r.uso_principal || '',
      tipologia:        r.tipologia || '',
      razon_busqueda:   r.razon_busqueda || '',
      timing:           r.timing || '',
      sup_min:          r.sup_min || '',
      sup_max:          r.sup_max || '',
      presupuesto_tipo: r.presupuesto_tipo || '',
      alq_min:          r.alq_min || '',
      alq_max:          r.alq_max || '',
      venta_m2_min:     r.venta_m2_min || '',
      venta_m2_max:     r.venta_m2_max || '',
      provincias:       Array.isArray(r.provincias) ? r.provincias : [],
      zonas:            Array.isArray(r.zonas) ? r.zonas : [],
      calles:           r.calles || '',
      puntos_interes:   r.puntos_interes || '',
      puntos_evitar:    r.puntos_evitar || '',
      otros_contactos:  Array.isArray(demanda.otros_contactos) ? demanda.otros_contactos : [],
    })
    setSaveError(null)
  }, [demanda, cuenta])

  const restablecer = async () => {
    setSaveError(null)
    await load()
  }

  const saveEdit = async () => {
    // Si pasa a descartada, motivo es obligatorio
    if (form.estatus === 'descartada' && !form.motivo_descarte.trim()) {
      setSaveError('Debes indicar el motivo del descarte antes de guardar.')
      return
    }
    setSaving(true)
    const requisitos = {
      naturaleza:       form.naturaleza || undefined,
      tipo_activo:      form.tipo_activo || undefined,
      uso_principal:    form.uso_principal || undefined,
      tipologia:        form.tipologia || undefined,
      razon_busqueda:   form.razon_busqueda || undefined,
      timing:           form.timing || undefined,
      sup_min:          form.sup_min ? Number(form.sup_min) : undefined,
      sup_max:          form.sup_max ? Number(form.sup_max) : undefined,
      presupuesto_tipo: form.presupuesto_tipo || undefined,
      alq_min:          form.alq_min ? Number(form.alq_min) : undefined,
      alq_max:          form.alq_max ? Number(form.alq_max) : undefined,
      venta_m2_min:     form.venta_m2_min ? Number(form.venta_m2_min) : undefined,
      venta_m2_max:     form.venta_m2_max ? Number(form.venta_m2_max) : undefined,
      provincias:       form.provincias.length ? form.provincias : undefined,
      zonas:            form.zonas.length ? form.zonas : undefined,
      calles:           form.calles || undefined,
      puntos_interes:   form.puntos_interes || undefined,
      puntos_evitar:    form.puntos_evitar || undefined,
    }
    Object.keys(requisitos).forEach(k => requisitos[k] === undefined && delete requisitos[k])

    const payload = {
      nombre:    form.nombre.trim() || null,
      estatus:   form.estatus || 'ongoing',
      notas:     form.notas || null,
      motivo_descarte: form.estatus === 'descartada' ? (form.motivo_descarte.trim() || null) : null,
      requisitos: Object.keys(requisitos).length ? requisitos : null,
      otros_contactos: form.otros_contactos.length ? form.otros_contactos : null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('demandas').update(payload).eq('id', demanda.id)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    await load()
  }

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const togglePick = (key, val) => {
    setForm(prev => {
      const arr = prev[key] || []
      return { ...prev, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
  }

  if (loading) return <div style={{ padding:32, color:'var(--text4)', fontSize:12 }}>Cargando…</div>
  if (error || !demanda) {
    return (
      <div style={{ padding:32 }}>
        <div style={{ fontSize:13, color:'#991b1b', marginBottom:12 }}>{error || 'No encontrada'}</div>
        <button className="ab-btn" onClick={() => navigate('demandas')}>← Volver a Demandas</button>
      </div>
    )
  }

  const reqs = demanda.requisitos || {}

  // Valores activos para mostrar fuera de edición o derivados durante edición
  const visNaturaleza   = reqs.naturaleza   || ''
  const visUso          = reqs.uso_principal|| ''
  const visTipologia    = reqs.tipologia    || ''
  const tipologiasDisp  = USOS_TIPOLOGIAS[editing ? form.uso_principal : visUso] || []
  const presTipo        = editing ? form.presupuesto_tipo : (reqs.presupuesto_tipo || '')
  const provinciasMostrar = editing ? form.provincias : (reqs.provincias || [])
  const zonasMostrar      = editing ? form.zonas : (reqs.zonas || [])

  // Otros contactos disponibles (no añadidos aún)
  const idsOtros = (editing ? form.otros_contactos : (demanda.otros_contactos || []))
  const otrosListaFull = editing
    ? contactosCuenta.filter(c => idsOtros.includes(c.dynamics_id))
    : otrosContactosFull
  const otrosDisponibles = contactosCuenta.filter(c => !idsOtros.includes(c.dynamics_id))

  const tituloHeader = demanda.nombre || cuenta?.nombre || '(Sin nombre)'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <div className="action-bar">
        <button className="ab-btn save" onClick={saveEdit} disabled={saving}>
          {saving ? 'Guardando…' : '💾 Guardar cambios'}
        </button>
        <button className="ab-btn" onClick={restablecer} disabled={saving}>↺ Restablecer</button>
        <button className="ab-btn" onClick={() => navigate('demandas')}>← Volver</button>
        <div className="ab-sep"/>
        {(() => {
          const yaTieneMandato = !!demanda.mandato_id
          const cerrada = ['descartada','cerrada_concedido','cerrada_perdida'].includes(demanda.estatus)
          const puede = !yaTieneMandato && !cerrada && !!demanda.dynamics_opportunity_id && !!demanda.dynamics_account_id
          const tip = yaTieneMandato
            ? `Ya cuelga del mandato ${demanda.mandato?.ref || ''}`
            : cerrada ? 'Demanda cerrada'
            : !demanda.dynamics_opportunity_id ? 'Falta oportunidad'
            : !demanda.dynamics_account_id     ? 'Falta cuenta'
            : 'Crear instrucción + mandato'
          return yaTieneMandato ? (
            <button className="ab-btn" onClick={() => navigate('ficha-mandato', { id: demanda.mandato.ref })}>
              📜 Mandato {demanda.mandato.ref}
            </button>
          ) : (
            <button
              className="ab-btn"
              onClick={() => setShowFirmarModal(true)}
              disabled={!puede}
              title={tip}
              style={{ background: puede ? 'var(--purple, #7c3aed)' : undefined, color: puede ? '#fff' : undefined, border: puede ? '1px solid var(--purple, #7c3aed)' : undefined, opacity: puede ? 1 : 0.45 }}
            >
              📜 Firmar mandato
            </button>
          )
        })()}
        <button className="ab-btn" disabled style={{ opacity:0.45 }}>Desactivar</button>
        <div className="ab-sep"/>
        <button className="ab-btn" disabled style={{ opacity:0.45 }}>✅ Asignar tarea</button>
        {saveError && <span style={{ marginLeft:12, fontSize:11, color:'#991b1b', fontWeight:600 }}>{saveError}</span>}
      </div>

      {showFirmarModal && (
        <FirmarMandatoModal
          origen={{ tipo:'demanda', record: demanda }}
          oportunidad={oportunidad}
          cuenta={cuenta}
          onClose={() => setShowFirmarModal(false)}
          onSuccess={() => { setShowFirmarModal(false); load() }}
        />
      )}

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Header */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>🔍</div>
              <div style={{ flex:1 }}>
                <div className="ah-ref">
                  <span style={{ background:'var(--accent-lt)', color:'var(--accent)', border:'1px solid var(--accent-bd)', padding:'0 5px', borderRadius:3, fontSize:9, fontWeight:700 }}>DEMANDA</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{demanda.ref}</span>
                </div>
                <div className="ah-name">
                  {editing
                    ? <input style={{ ...inpFull, fontSize:18, fontWeight:700, padding:'4px 8px' }} value={form.nombre} onChange={e => setF('nombre', e.target.value)} placeholder="Nombre de la demanda" />
                    : tituloHeader}
                </div>
                <div className="ah-addr">
                  📍 {[cuenta?.direccion, cuenta?.codigo_postal, cuenta?.ciudad].filter(Boolean).join(', ') || 'Dirección no disponible'} · Creada: {fmtDate(demanda.created_at)} · {CURRENT_USER.nombre}
                </div>
                <div className="ah-tags">
                  {(() => {
                    const ec = ESTADO_COLOR[form.estatus] || ESTADO_COLOR.ongoing
                    return <span className={`tag ${ec.tag}`}>{ec.icon} {ESTADO_LABEL[form.estatus] || form.estatus || '—'}</span>
                  })()}
                  {visNaturaleza && (
                    visNaturaleza === 'Inversión'
                      ? <span className="tag" style={{ background:'#fffbeb', color:'var(--amber)', border:'1px solid var(--amber-bd)', fontWeight:700 }}>🏦 Capital Markets</span>
                      : <span className="tag tag-blue">{visNaturaleza}</span>
                  )}
                  {visUso       && <span className="tag tag-blue">{visUso}</span>}
                  {visTipologia && <span className="tag tag-gray">{visTipologia}</span>}
                  {(reqs.sup_min || reqs.sup_max) && <span className="tag tag-gray">{reqs.sup_min || '?'}–{reqs.sup_max || '?'} m²</span>}
                </div>
              </div>
              <div style={{ flexShrink:0, display:'flex', flexDirection:'column', gap:4, alignSelf:'flex-start' }}>
                {(() => {
                  const ec = ESTADO_COLOR[form.estatus] || ESTADO_COLOR.ongoing
                  const equipoLen = Array.isArray(demanda.equipo_trabajo) ? demanda.equipo_trabajo.length : 0
                  const equipos = [...new Set((demanda.equipo_trabajo || []).map(m => m.equipo).filter(Boolean))]
                  return (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:1, background:'var(--border)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', fontSize:10 }}>
                      <div style={{ background:'var(--surface)', padding:'6px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'var(--text4)' }}>Estado</div>
                        <div style={{ fontWeight:700, color:ec.headerCol }}>{ec.icon} {ESTADO_LABEL[form.estatus] || form.estatus || '—'}</div>
                      </div>
                      <div style={{ background:'var(--surface)', padding:'6px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'var(--text4)' }}>Confidencial</div>
                        <div style={{ fontWeight:600, color: demandaConfidential ? 'var(--amber)' : 'var(--text)' }}>{demandaConfidential ? 'Sí' : 'No'}</div>
                      </div>
                      <div style={{ background:'var(--surface)', padding:'6px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'var(--text4)' }}>Equipo</div>
                        <div style={{ fontWeight:600 }}>{equipos[0] || '—'}{equipoLen > 1 ? ` +${equipoLen-1}` : ''}</div>
                      </div>
                      <div style={{ background:'var(--surface)', padding:'6px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'var(--text4)' }}>Responsable</div>
                        <div style={{ fontWeight:600, color:'var(--accent)' }}>{CURRENT_USER.nombre}</div>
                      </div>
                    </div>
                  )
                })()}
                <div style={{ fontSize:9, color:'var(--text4)', textAlign:'right', fontStyle:'italic' }}>
                  Última modificación: {fmtDate(demanda.updated_at)} · {CURRENT_USER.nombre}
                </div>
              </div>
            </div>
          </div>

          <div className="tabs">
            {DEM_TABS.map(([k, label]) => (
              <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</div>
            ))}
          </div>

          {/* TAB: Información general — formato cards uniformes (Mandato/Propuesta) */}
          {tab === 'dem-info' && (() => {
            const equipo = Array.isArray(demanda.equipo_trabajo) ? demanda.equipo_trabajo : []
            const userIsPrincipal = isPrincipal(equipo, CURRENT_USER.nombre)
            const canManage = userIsPrincipal || equipo.length === 0
            const handlers = makeEquipoHandlers({
              supabase, table:'demandas', idValue:demanda.id, equipo,
              onAfter: () => load(),
              onError: (msg) => setSaveError(msg),
            })
            const ec = ESTADO_COLOR[form.estatus] || ESTADO_COLOR.ongoing
            const motivoEsPredef = MOTIVOS_DESCARTE_DEMANDA.includes(form.motivo_descarte)
            const motivoEsOtro   = !!form.motivo_descarte && !motivoEsPredef
            const motivoSelV     = motivoEsOtro ? 'Otro motivo' : (form.motivo_descarte || '')
            const motivoOtroTxt  = motivoEsOtro ? form.motivo_descarte : ''
            const requiereMotivo = form.estatus === 'descartada'
            const sinMotivo      = requiereMotivo && !(form.motivo_descarte || '').trim()

            return (
              <div className="tab-content active"><div className="info-pad">

                {/* ─── FILA 1: Estado visual (1/3) + Vinculaciones (2/3) ─── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:12, marginBottom:12 }}>

                  {/* === ESTADO DE LA DEMANDA · cuadro visual grande === */}
                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{ color: ec.headerCol }}>{ec.icon}</span> Estado de la demanda</h3>
                    </div>
                    <div style={{ padding:'8px 18px 16px' }}>
                      {/* Badge grande con color por estado */}
                      <div style={{
                        padding:'14px 16px',
                        background: ec.bg, border: `2px solid ${ec.bd}`, borderRadius: 8,
                        display:'flex', alignItems:'center', gap:12, marginBottom: 12,
                      }}>
                        <div style={{ fontSize:26, lineHeight:1, color: ec.text }}>{ec.icon}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:10, fontWeight:700, color: ec.text, opacity:.75, textTransform:'uppercase', letterSpacing:'.04em' }}>Estado actual</div>
                          <div style={{ fontSize:18, fontWeight:800, color: ec.text, lineHeight:1.2 }}>{ESTADO_LABEL[form.estatus] || form.estatus || '—'}</div>
                        </div>
                      </div>

                      {/* Cambiar estado */}
                      <div style={{ marginBottom: motivoSelV ? 10 : 0 }}>
                        <div className="rp-lbl" style={{ marginBottom:4 }}>Cambiar estado</div>
                        <select className="fsel" value={form.estatus} onChange={e => setF('estatus', e.target.value)} style={{ width:'100%' }}>
                          {ESTADO_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                        </select>
                      </div>

                      {/* Motivo del descarte: visible si descartada o ya guardado */}
                      {(requiereMotivo || demanda.motivo_descarte) && (
                        <>
                          <div className="rp-lbl" style={{ marginTop:8, marginBottom:4, color: requiereMotivo ? '#dc2626' : undefined }}>
                            Motivo del descarte {requiereMotivo && <span style={{ color:'#dc2626' }}>*</span>}
                          </div>
                          <select className="fsel" value={motivoSelV}
                            style={{ width:'100%', borderColor: sinMotivo ? '#dc2626' : undefined }}
                            onChange={e => {
                              const v = e.target.value
                              if (v === '') setF('motivo_descarte', '')
                              else if (v === 'Otro motivo') setF('motivo_descarte', motivoOtroTxt || ' ')
                              else setF('motivo_descarte', v)
                            }}>
                            <option value="">Selecciona un motivo...</option>
                            {MOTIVOS_DESCARTE_DEMANDA.map(m => <option key={m}>{m}</option>)}
                          </select>
                          {(motivoSelV === 'Otro motivo' || motivoEsOtro) && (
                            <textarea
                              className="kf-inp"
                              style={{ width:'100%', marginTop:6, minHeight:50, resize:'vertical', borderColor: sinMotivo ? '#dc2626' : undefined }}
                              value={motivoOtroTxt}
                              onChange={e => setF('motivo_descarte', e.target.value)}
                              placeholder="Describe brevemente por qué se descarta esta demanda..."
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* === VINCULACIONES === */}
                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico">◇</span> Vinculaciones</h3>
                      <span className="hint">Oportunidad · Cuenta · Mandato</span>
                    </div>
                    <div style={{ padding:'8px 20px 16px' }}>

                      {/* Oportunidad */}
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:5 }}>Oportunidad</div>
                        {oportunidad ? (
                          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                            <div style={{ width:28, height:28, borderRadius:'50%', background:'#0078d4', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>D</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:600 }}>{oportunidad.nombre || '—'}</div>
                              {oportunidad.tipo && <div style={{ fontSize:10, color:'var(--text3)' }}>{oportunidad.tipo}</div>}
                            </div>
                            <span className="tag tag-blue" style={{ fontSize:9 }}>Dynamics</span>
                          </div>
                        ) : (
                          <div style={{ padding:'8px 10px', border:'1px dashed var(--border)', borderRadius:'var(--r)', background:'var(--gray-lt)', fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin oportunidad vinculada</div>
                        )}
                      </div>

                      {/* Cuenta */}
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:5 }}>Cuenta (heredada de Dynamics)</div>
                        {cuenta ? (
                          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                            <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>🏢</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:600 }}>{cuenta.nombre || '—'}</div>
                              <div style={{ fontSize:10, color:'var(--text3)' }}>{[cuenta.tipo, cuenta.sector, cuenta.ciudad].filter(Boolean).join(' · ') || '—'}</div>
                            </div>
                            <span className="tag tag-blue" style={{ fontSize:9 }}>Dynamics</span>
                          </div>
                        ) : (
                          <div style={{ padding:'8px 10px', border:'1px dashed var(--border)', borderRadius:'var(--r)', background:'var(--gray-lt)', fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin cuenta vinculada</div>
                        )}
                      </div>

                      {/* Mandato */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:5 }}>Mandato</div>
                        {demanda.mandato_id && demanda.mandato ? (
                          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                            <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--purple, #7c3aed)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>📜</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:600, fontFamily:'var(--mono)' }}>{demanda.mandato.ref}</div>
                              <div style={{ fontSize:10, color:'var(--text3)' }}>Mandato vinculado</div>
                            </div>
                            <button className="ab-btn" style={{ fontSize:9, padding:'2px 8px' }} onClick={() => navigate('ficha-mandato', { id: demanda.mandato.ref })}>Ver</button>
                          </div>
                        ) : (
                          <div style={{ padding:'8px 10px', border:'1px dashed var(--border)', borderRadius:'var(--r)', background:'var(--gray-lt)', fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin mandato firmado todavía</div>
                        )}
                      </div>

                    </div>
                  </div>

                </div>

                {/* ─── FILA 2: Equipo de trabajo (1/2) + Partes involucradas (1/2) ─── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>

                  {/* === EQUIPO DE TRABAJO · formato Propuestas/Mandato (inline) === */}
                  <div className="va-card" style={{ marginBottom:0, overflow:'visible' }}>
                    <div className="va-card-header">
                      <h3><span className="ico">◆</span> Equipo de trabajo</h3>
                      {canManage && (
                        <button className="ab-btn" style={{ fontSize:10, padding:'3px 10px' }} onClick={() => setShowAddEq(v => !v)}>+ Añadir</button>
                      )}
                    </div>
                    <div style={{ padding:'8px 20px 16px' }}>
                      {showAddEq && canManage && (
                        <div style={{ marginBottom:10, padding:10, border:'1px solid var(--border)', borderRadius:6, background:'var(--surface-2)', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, alignItems:'end' }}>
                          <div>
                            <div className="rp-lbl">Equipo</div>
                            <select className="fsel" value={newEqDraft.equipo} onChange={e => setNewEqDraft(p => ({ ...p, equipo:e.target.value, usuario:'' }))} style={{ width:'100%' }}>
                              <option value="">Seleccionar...</option>
                              {EQUIPOS_SAVILLS.filter(eq => !equipo.find(m => m.equipo === eq && m.nombre)).map(eq => <option key={eq}>{eq}</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="rp-lbl">Miembro</div>
                            <select className="fsel" value={newEqDraft.usuario} onChange={e => setNewEqDraft(p => ({ ...p, usuario:e.target.value }))} disabled={!newEqDraft.equipo} style={{ width:'100%' }}>
                              <option value="">Seleccionar...</option>
                              {(MIEMBROS_POR_EQUIPO[newEqDraft.equipo] || []).map(u => <option key={u}>{u}</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="rp-lbl">Rol</div>
                            <select className="fsel" value={newEqDraft.rol} onChange={e => setNewEqDraft(p => ({ ...p, rol:e.target.value }))} style={{ width:'100%' }}>
                              {['Principal','Soporte','Colaborador'].map(r => <option key={r}>{r}</option>)}
                            </select>
                          </div>
                          <div style={{ gridColumn:'1 / -1', display:'flex', gap:6, justifyContent:'flex-end' }}>
                            <button className="ab-btn save" disabled={!newEqDraft.equipo || !newEqDraft.usuario}
                              onClick={() => {
                                handlers.addMiembro(newEqDraft.usuario, newEqDraft.equipo, newEqDraft.rol)
                                setShowAddEq(false)
                                setNewEqDraft({ equipo:'', usuario:'', rol:'Soporte' })
                              }}>Añadir</button>
                            <button className="ab-btn" onClick={() => setShowAddEq(false)}>Cancelar</button>
                          </div>
                        </div>
                      )}
                      {equipo.length === 0 ? (
                        <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic', padding:'8px 0' }}>Sin equipo asignado.</div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {equipo.map((m,i) => (
                            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                              <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>
                                {(m.nombre || '').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, fontWeight:600 }}>{m.nombre}</div>
                                <div style={{ fontSize:10, color:'var(--text3)' }}>{m.equipo}</div>
                              </div>
                              <span className="tag tag-blue" style={{ fontSize:9 }}>{m.rol}</span>
                              {canManage && (
                                <button onClick={() => handlers.removeMiembro(i)} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:11, padding:'2px 4px' }}>✕</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* === PARTES INVOLUCRADAS === */}
                  <div className="va-card" style={{ marginBottom:0, overflow:'visible' }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{ color:'#7e22ce' }}>◉</span> Partes involucradas</h3>
                      <span className="hint">Contactos de {cuenta?.nombre || '(cuenta)'}</span>
                    </div>
                    <div style={{ padding:'8px 20px 16px' }}>
                      {otrosListaFull.length === 0 ? (
                        <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic', padding:'8px 0' }}>Sin partes adicionales.</div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {otrosListaFull.map(c => (
                            <div key={c.dynamics_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                              <div style={{ width:28, height:28, borderRadius:'50%', background:'#7e22ce', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>
                                {(c.nombre || '').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, fontWeight:600 }}>{c.nombre}</div>
                                <div style={{ fontSize:10, color:'var(--text3)' }}>{c.email || c.telefono || '—'}</div>
                              </div>
                              <button onClick={() => setF('otros_contactos', form.otros_contactos.filter(id => id !== c.dynamics_id))}
                                style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:11, padding:'2px 4px' }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <select
                        className="fsel"
                        style={{ width:'100%', marginTop:8 }}
                        value=""
                        onChange={e => { if (e.target.value) setF('otros_contactos', [...form.otros_contactos, e.target.value]) }}
                      >
                        <option value="">+ Añadir contacto de la cuenta...</option>
                        {otrosDisponibles.map(c => (
                          <option key={c.dynamics_id} value={c.dynamics_id}>{c.nombre} — {c.email || c.telefono || ''}</option>
                        ))}
                      </select>
                      {otrosDisponibles.length === 0 && (
                        <div style={{ fontSize:10, color:'var(--text4)', marginTop:4 }}>No hay más contactos disponibles en la cuenta.</div>
                      )}
                    </div>
                  </div>

                </div>

                {/* ─── FILA 3: Notas (full-width) ─── */}
                <div className="va-card" style={{ marginBottom:0 }}>
                  <div className="va-card-header">
                    <h3><span className="ico">▭</span> Notas internas</h3>
                  </div>
                  <div style={{ padding:'8px 20px 16px' }}>
                    <textarea
                      className="kf-inp"
                      style={{ width:'100%', minHeight:80, resize:'vertical', fontSize:12 }}
                      value={form.notas}
                      onChange={e => setF('notas', e.target.value)}
                      placeholder="Notas internas sobre la demanda..."
                    />
                  </div>
                </div>

              </div></div>
            )
          })()}

          {/* TAB: Requisitos (Requisitos + Zona de búsqueda fusionados) */}
          {tab === 'dem-req' && (() => {
            // Helper compacto: label + control + gap mínimo
            const ReqField = ({ label, required, accent, children }) => (
              <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color: accent || 'var(--text)', textTransform:'uppercase', letterSpacing:'.03em' }}>
                  {label} {required && <span style={{ color:'#dc2626' }}>*</span>}
                </div>
                {children}
              </div>
            )
            const canExport = !!form.uso_principal && (!!form.sup_min || !!form.sup_max)
            return (
              <div className="tab-content active"><div className="info-pad">

                {/* ─── BARRA SUPERIOR · descripción + botón Exportar a mapa ─── */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, padding:'10px 14px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6 }}>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>
                    Define los requisitos y la zona de búsqueda. Cuando tengas el perfil mínimo, exporta al mapa para seleccionar alternativas.
                  </div>
                  <button
                    className="ab-btn"
                    onClick={() => navigate('mapa-busqueda', { demanda: demanda.ref })}
                    disabled={!canExport}
                    title={!form.uso_principal ? 'Define al menos el uso principal' : (!form.sup_min && !form.sup_max ? 'Define superficie mínima o máxima' : 'Exportar requisitos al mapa de búsqueda')}
                    style={{ background:'var(--accent)', color:'#fff', border:'1px solid var(--accent)', opacity: canExport ? 1 : 0.45, fontWeight:600, fontSize:12 }}
                  >
                    🗺 Exportar a mapa
                  </button>
                </div>

                {/* ─── FILA 1: Requisitos generales (1/2) + Económicos (1/2) ─── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>

                  {/* === REQUISITOS GENERALES === */}
                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{ color:'var(--accent)' }}>◐</span> Requisitos generales</h3>
                    </div>
                    <div style={{ padding:'10px 18px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <ReqField label="Naturaleza" accent="#0f172a">
                        <select className="fsel" value={form.naturaleza} onChange={e => setF('naturaleza', e.target.value)} style={{ width:'100%' }}>
                          <option value="">—</option><option>Leasing</option><option>Inversión</option>
                        </select>
                      </ReqField>
                      <ReqField label="Tipo de activo">
                        <select className="fsel" value={form.tipo_activo} onChange={e => setF('tipo_activo', e.target.value)} style={{ width:'100%' }}>
                          <option value="">—</option><option>Edificio</option><option>Suelo</option>
                        </select>
                      </ReqField>
                      <ReqField label="Uso principal" accent="var(--accent)">
                        <select className="fsel" value={form.uso_principal} onChange={e => { setF('uso_principal', e.target.value); setF('tipologia','') }} style={{ width:'100%' }}>
                          <option value="">—</option>
                          {Object.keys(USOS_TIPOLOGIAS).map(u => <option key={u}>{u}</option>)}
                        </select>
                      </ReqField>
                      <ReqField label="Tipología" accent="var(--purple)">
                        <select className="fsel" value={form.tipologia} onChange={e => setF('tipologia', e.target.value)} disabled={!form.uso_principal} style={{ width:'100%' }}>
                          <option value="">—</option>
                          {tipologiasDisp.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </ReqField>
                      <ReqField label="Razón de búsqueda">
                        <select className="fsel" value={form.razon_busqueda} onChange={e => setF('razon_busqueda', e.target.value)} style={{ width:'100%' }}>
                          <option value="">—</option>
                          {RAZONES_LEASING.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </ReqField>
                      <ReqField label="Timing del proyecto">
                        <input type="date" className="fsel" value={form.timing} onChange={e => setF('timing', e.target.value)} style={{ width:'100%' }} />
                      </ReqField>
                      <ReqField label="Superficie mín. (m²)">
                        <input type="number" className="kf-inp" value={form.sup_min} onChange={e => setF('sup_min', e.target.value)} placeholder="—" style={{ width:'100%', fontFamily:'var(--mono)', textAlign:'right', fontWeight:600 }} />
                      </ReqField>
                      <ReqField label="Superficie máx. (m²)">
                        <input type="number" className="kf-inp" value={form.sup_max} onChange={e => setF('sup_max', e.target.value)} placeholder="—" style={{ width:'100%', fontFamily:'var(--mono)', textAlign:'right', fontWeight:600 }} />
                      </ReqField>
                    </div>
                  </div>

                  {/* === PRESUPUESTO === */}
                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{ color:'var(--green)' }}>€</span> Presupuesto</h3>
                    </div>
                    <div style={{ padding:'10px 18px 16px' }}>
                      <ReqField label="Tipo de presupuesto" accent="var(--text)">
                        <select className="fsel" value={form.presupuesto_tipo} onChange={e => setF('presupuesto_tipo', e.target.value)} style={{ width:'100%' }}>
                          <option value="">—</option><option>Alquiler</option><option>Venta</option><option>Alquiler / Venta</option>
                        </select>
                      </ReqField>

                      {(presTipo === 'Alquiler' || presTipo === 'Alquiler / Venta') && (
                        <div style={{ marginTop:12, padding:10, background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:6 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'#0f766e', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>Alquiler · €/m²/mes</div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                            <ReqField label="Desde">
                              <input type="number" className="kf-inp" value={form.alq_min} onChange={e => setF('alq_min', e.target.value)} placeholder="—" style={{ width:'100%', fontFamily:'var(--mono)', textAlign:'right', fontWeight:600 }} />
                            </ReqField>
                            <ReqField label="Hasta">
                              <input type="number" className="kf-inp" value={form.alq_max} onChange={e => setF('alq_max', e.target.value)} placeholder="—" style={{ width:'100%', fontFamily:'var(--mono)', textAlign:'right', fontWeight:600 }} />
                            </ReqField>
                          </div>
                        </div>
                      )}
                      {(presTipo === 'Venta' || presTipo === 'Alquiler / Venta') && (
                        <div style={{ marginTop:10, padding:10, background:'#fffbeb', border:'1px solid #fde68a', borderRadius:6 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'#b45309', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>Venta · €/m²</div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                            <ReqField label="Desde">
                              <input type="number" className="kf-inp" value={form.venta_m2_min} onChange={e => setF('venta_m2_min', e.target.value)} placeholder="—" style={{ width:'100%', fontFamily:'var(--mono)', textAlign:'right', fontWeight:600 }} />
                            </ReqField>
                            <ReqField label="Hasta">
                              <input type="number" className="kf-inp" value={form.venta_m2_max} onChange={e => setF('venta_m2_max', e.target.value)} placeholder="—" style={{ width:'100%', fontFamily:'var(--mono)', textAlign:'right', fontWeight:600 }} />
                            </ReqField>
                          </div>
                        </div>
                      )}
                      {!presTipo && (
                        <div style={{ marginTop:10, padding:14, border:'1px dashed var(--border)', borderRadius:6, background:'var(--gray-lt)', fontSize:11, color:'var(--text4)', fontStyle:'italic', textAlign:'center' }}>
                          Selecciona el tipo de presupuesto para definir rangos económicos.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── FILA 2: Provincias (1/2) + Zonas (1/2) ─── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{ color:'var(--accent)' }}>🗺</span> Provincias de interés</h3>
                      <span className="hint">{provinciasMostrar.length} seleccionada(s)</span>
                    </div>
                    <div style={{ padding:'10px 18px 16px' }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8, minHeight:28 }}>
                        {provinciasMostrar.length === 0 && (
                          <span style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Ninguna provincia añadida.</span>
                        )}
                        {provinciasMostrar.map(p => (
                          <Chip key={p} label={p} onRemove={() => togglePick('provincias', p)} />
                        ))}
                      </div>
                      <select className="fsel" style={{ width:'100%' }} value=""
                        onChange={e => { if (e.target.value) togglePick('provincias', e.target.value) }}>
                        <option value="">+ Añadir provincia</option>
                        {PROVINCIAS_LISTA.filter(p => !form.provincias.includes(p)).map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{ color:'var(--purple)' }}>📍</span> Zonas de búsqueda</h3>
                      <span className="hint">{zonasMostrar.length} seleccionada(s)</span>
                    </div>
                    <div style={{ padding:'10px 18px 16px' }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8, minHeight:28 }}>
                        {zonasMostrar.length === 0 && (
                          <span style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Ninguna zona añadida.</span>
                        )}
                        {zonasMostrar.map(z => (
                          <Chip key={z} label={z} onRemove={() => togglePick('zonas', z)} />
                        ))}
                      </div>
                      <select className="fsel" style={{ width:'100%' }} value=""
                        onChange={e => { if (e.target.value) togglePick('zonas', e.target.value) }}>
                        <option value="">+ Añadir zona</option>
                        {ZONAS_MADRID.filter(z => !form.zonas.includes(z)).map(z => <option key={z}>{z}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ─── FILA 3: Detalles geográficos (full-width) ─── */}
                <div className="va-card" style={{ marginBottom:0 }}>
                  <div className="va-card-header">
                    <h3><span className="ico" style={{ color:'var(--teal)' }}>◑</span> Detalles geográficos</h3>
                  </div>
                  <div style={{ padding:'10px 18px 16px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                    <ReqField label="Calles específicas">
                      <input className="kf-inp" value={form.calles} onChange={e => setF('calles', e.target.value)} placeholder="Ej. Castellana 50–120" style={{ width:'100%' }} />
                    </ReqField>
                    <ReqField label="Puntos de interés">
                      <input className="kf-inp" value={form.puntos_interes} onChange={e => setF('puntos_interes', e.target.value)} placeholder="Cerca de metro, autopistas..." style={{ width:'100%' }} />
                    </ReqField>
                    <ReqField label="Puntos a evitar">
                      <input className="kf-inp" value={form.puntos_evitar} onChange={e => setF('puntos_evitar', e.target.value)} placeholder="Zonas en obras, polígonos..." style={{ width:'100%' }} />
                    </ReqField>
                  </div>
                </div>

              </div></div>
            )
          })()}

          {tab === 'dem-360'  && (
            <div className="tab-content active">
              <StubTab label="Vista 360 · Seguimiento + Actividades + Microsites" />
            </div>
          )}
          {tab === 'dem-docs' && <div className="tab-content active"><StubTab label="Documentos" /></div>}
          {tab === 'dem-neg'  && <div className="tab-content active"><StubTab label="Negociaciones en curso" /></div>}
          {tab === 'dem-conf'     && (
            <ConfidencialidadPanel
              entityLabel="demanda"
              confidential={demandaConfidential}
              onToggle={setDemandaConfidential}
              hiddenFields={['Cuenta','Requisitos de búsqueda','Condiciones económicas','Documentación adjunta','Zona de búsqueda']}
              visibleFields={['Tipo de uso / línea','Estado de la demanda','Equipo','Fecha de creación','Información básica']}
              authorizedUsers={demandaAuthUsers}
              onAddUser={(newUser) => {
                const [name, team] = [newUser.split('·')[0].trim(), newUser.split('·')[1]?.trim() || '']
                const ini = name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                const today = new Date().toLocaleDateString('es-ES')
                setDemandaAuthUsers(prev => [...prev, { name, team, role:'Autorizado', initials:ini, bg:'#f0fdf4', color:'#166534', granted:today }])
              }}
              onRemoveUser={(idx) => setDemandaAuthUsers(prev => prev.filter((_,j) => j !== idx))}
              responsable={CURRENT_USER.nombre}
            />
          )}

        </div>

        {/* ─── SIDEBAR DERECHO · mismo formato que Oferta ─── */}
        {(() => {
          const esInversion = form.naturaleza === 'Inversión' || form.naturaleza === 'inversion'
          const supMin  = Number(form.sup_min) || 0
          const supMax  = Number(form.sup_max) || 0
          const rentaMin = Number(form.alq_min) || 0
          const rentaMax = Number(form.alq_max) || 0
          const ventaMin = Number(form.venta_m2_min) || 0
          const ventaMax = Number(form.venta_m2_max) || 0
          const equipo = Array.isArray(demanda?.equipo_trabajo) ? demanda.equipo_trabajo : []
          const principal = equipo.find(m => m.rol === 'Principal') || equipo[0]
          const soportes  = equipo.filter(m => m !== principal).slice(0,2)
          const initials = (n) => (n || '').split(' ').filter(Boolean).slice(0,2).map(s => s[0]?.toUpperCase() || '').join('') || '—'
          const fmtFecha = (iso) => iso ? new Date(iso).toLocaleDateString('es-ES') : '—'
          const diasActiva = demanda?.created_at ? Math.max(0, Math.floor((Date.now() - new Date(demanda.created_at)) / 86400000)) : 0
          return (
            <div className="ficha-right">

              {/* 1 · EQUIPO RESPONSABLE */}
              <div className="rp-sec">
                <div className="rp-lbl">Equipo responsable</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {equipo.length === 0 ? (
                    <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin equipo asignado.</div>
                  ) : (
                    <>
                      {principal && (
                        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:'#dbeafe', color:'#1e40af', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{initials(principal.nombre)}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600 }}>{principal.nombre}</div>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>{principal.equipo}</div>
                          </div>
                          <span className="tag tag-blue" style={{ fontSize:9 }}>Principal</span>
                        </div>
                      )}
                      {soportes.map((m,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:'#fdf4ff', color:'#7e22ce', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{initials(m.nombre)}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600 }}>{m.nombre}</div>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>{m.equipo}</div>
                          </div>
                          <span className="tag tag-purple" style={{ fontSize:9 }}>{m.rol}</span>
                        </div>
                      ))}
                      {equipo.length > 1 + soportes.length && (
                        <div style={{ fontSize:10, color:'var(--text3)', textAlign:'center' }}>+ {equipo.length - 1 - soportes.length} más</div>
                      )}
                    </>
                  )}
                </div>
                <div style={{ display:'flex', gap:6, marginTop:8 }}>
                  <button className="acc-btn" style={{ flex:1, fontSize:10 }}>📞 Contacto</button>
                  <button className="acc-btn" style={{ flex:1, fontSize:10 }}>✅ Asignar</button>
                </div>
              </div>

              {/* 2 · ASISTENTE IA */}
              <div className="rp-sec">
                <div className="rp-lbl">Asistente IA</div>
                <div className="ai-box">
                  <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Análisis de la demanda</span><span className="ai-badge">Tiempo real</span></div>
                  <div className="ai-text">
                    {esInversion
                      ? <>Demanda de inversión · ticket en análisis. <strong>Detectando activos compatibles</strong> y posibles riesgos de yield.</>
                      : <>Búsqueda de <strong>{supMin.toLocaleString('es-ES')}–{supMax.toLocaleString('es-ES')} m²</strong>. <strong>Matching automático con ofertas vigentes</strong>.</>}
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:9, fontWeight:700, color:'#15803d', background:'#dcfce7', padding:'2px 7px', borderRadius:6 }}>✓ Cumple · 3</span>
                    <span style={{ fontSize:9, fontWeight:700, color:'#7c2d12', background:'#fef3c7', padding:'2px 7px', borderRadius:6 }}>± Flexible · 3</span>
                    <span style={{ fontSize:9, fontWeight:700, color:'#475569', background:'#e2e8f0', padding:'2px 7px', borderRadius:6 }}>≈ Alternativas · 2</span>
                    <span style={{ fontSize:9, fontWeight:700, color:'#991b1b', background:'#fee2e2', padding:'2px 7px', borderRadius:6 }}>⚠ Riesgos · 1</span>
                  </div>
                  <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:3 }}>
                    <button style={{ fontSize:10, padding:'4px 8px', background:'none', border:'1px solid var(--accent-bd)', color:'var(--accent)', borderRadius:4, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>📊 Resumen ejecutivo</button>
                    <button style={{ fontSize:10, padding:'4px 8px', background:'none', border:'1px solid var(--accent-bd)', color:'var(--accent)', borderRadius:4, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>🏢 Sugerir zonas alternativas</button>
                    <button style={{ fontSize:10, padding:'4px 8px', background:'none', border:'1px solid var(--accent-bd)', color:'var(--accent)', borderRadius:4, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>🔍 Matching con ofertas</button>
                  </div>
                  <div className="ai-cta">✎ Preguntar a la IA</div>
                </div>
              </div>

              {/* 3 · KPIs · resumen ejecutivo */}
              <div className="rp-sec">
                <div className="rp-lbl">KPIs · resumen ejecutivo</div>

                {/* Superficie requerida (rango grande) */}
                <div style={{ padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:6 }}>
                  <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700, marginBottom:3 }}>Superficie requerida</div>
                  <div style={{ fontSize:16, fontWeight:800, fontFamily:'var(--mono)', color:'var(--accent)' }}>
                    {supMin > 0 || supMax > 0 ? `${supMin.toLocaleString('es-ES')} – ${supMax.toLocaleString('es-ES')}` : '—'}
                    <span style={{ fontSize:11, color:'var(--text3)', fontWeight:500 }}> m²</span>
                  </div>
                </div>

                {/* Sup min/max + Renta/Ticket */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6 }}>
                  <div style={{ padding:'6px 8px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                    <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700 }}>Sup. mín.</div>
                    <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)' }}>{supMin > 0 ? supMin.toLocaleString('es-ES') + ' m²' : '—'}</div>
                  </div>
                  <div style={{ padding:'6px 8px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                    <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700 }}>Sup. máx.</div>
                    <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)' }}>{supMax > 0 ? supMax.toLocaleString('es-ES') + ' m²' : '—'}</div>
                  </div>
                </div>

                {/* Renta / Ticket */}
                <div style={{ padding:'7px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:6 }}>
                  <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700 }}>{esInversion ? 'Precio venta €/m²' : 'Renta objetivo'}</div>
                  <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color:'var(--green)' }}>
                    {esInversion
                      ? (ventaMin > 0 || ventaMax > 0 ? `${ventaMin}–${ventaMax} €/m²` : '—')
                      : (rentaMin > 0 || rentaMax > 0 ? `${rentaMin}–${rentaMax} €/m²/mes` : '—')}
                  </div>
                </div>

                {/* Métricas operativas */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6, marginBottom:6 }}>
                  {[
                    { lbl:'Alternativas', val:5, col:'var(--text1)' },
                    { lbl:'Visitas',      val:2, col:'var(--accent)' },
                    { lbl:'Propuestas',   val:1, col:'var(--purple)' },
                  ].map(k => (
                    <div key={k.lbl} style={{ padding:'6px 8px', border:'1px solid var(--border)', borderRadius:'var(--r)', textAlign:'center' }}>
                      <div style={{ fontSize:8, color:'var(--text4)', textTransform:'uppercase', fontWeight:700 }}>{k.lbl}</div>
                      <div style={{ fontSize:14, fontWeight:800, fontFamily:'var(--mono)', color:k.col }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {/* Estado + Prioridad */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6 }}>
                  <div style={{ padding:'6px 8px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                    <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700, marginBottom:3 }}>Estado</div>
                    <span className="tag tag-green" style={{ fontSize:10 }}>● {form.estatus || 'En curso'}</span>
                  </div>
                  <div style={{ padding:'6px 8px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                    <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700, marginBottom:3 }}>Prioridad</div>
                    <span className="tag tag-amber" style={{ fontSize:10 }}>Alta</span>
                  </div>
                </div>

                {/* Probabilidad de cierre */}
                <div style={{ padding:'7px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
                    <span style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700 }}>Probabilidad de cierre</span>
                    <span style={{ fontSize:13, fontWeight:800, fontFamily:'var(--mono)', color:'var(--accent)' }}>65%</span>
                  </div>
                  <div style={{ height:5, background:'var(--gray-lt)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:'65%', background:'var(--accent)' }} />
                  </div>
                </div>

                {/* Fecha objetivo + Tiempo activa */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6 }}>
                  <div style={{ padding:'6px 8px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                    <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700 }}>Fecha objetivo</div>
                    <div style={{ fontSize:12, fontWeight:700, fontFamily:'var(--mono)' }}>{form.timing || '—'}</div>
                  </div>
                  <div style={{ padding:'6px 8px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                    <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700 }}>Tiempo activa</div>
                    <div style={{ fontSize:12, fontWeight:700, fontFamily:'var(--mono)' }}>{diasActiva} d</div>
                  </div>
                </div>

                {/* Tipo de activo */}
                <div style={{ padding:'7px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:6 }}>
                  <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>Tipo de activo</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {form.uso_principal && <span className="tag tag-blue" style={{ fontSize:9 }}>{form.uso_principal}</span>}
                    {form.tipologia && <span className="tag tag-gray" style={{ fontSize:9 }}>{form.tipologia}</span>}
                    {!form.uso_principal && !form.tipologia && <span style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>—</span>}
                  </div>
                </div>

                {/* Zonas objetivo */}
                <div style={{ padding:'7px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:6 }}>
                  <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>Zonas objetivo</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {(form.provincias || []).map(p => <span key={p} className="tag tag-blue" style={{ fontSize:9 }}>{p}</span>)}
                    {(form.zonas || []).map(z => <span key={z} className="tag tag-gray" style={{ fontSize:9 }}>{z}</span>)}
                    {(form.provincias || []).length === 0 && (form.zonas || []).length === 0 && <span style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>—</span>}
                  </div>
                </div>

                {/* Equipos involucrados */}
                <div style={{ padding:'7px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                  <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>Equipos involucrados</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {[...new Set(equipo.map(m => m.equipo).filter(Boolean))].map(eq => (
                      <span key={eq} className="tag tag-blue" style={{ fontSize:9 }}>{eq}</span>
                    ))}
                    {equipo.length === 0 && <span style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>—</span>}
                  </div>
                </div>
              </div>

            </div>
          )
        })()}
      </div>
    </div>
  )
}
