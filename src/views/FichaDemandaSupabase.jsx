import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'
import EquipoTrabajoCard, { makeEquipoHandlers, isPrincipal, EQUIPOS_SAVILLS, MIEMBROS_POR_EQUIPO } from '../components/EquipoTrabajoCard'
import FirmarMandatoModal from '../components/FirmarMandatoModal'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'
import Vinculaciones from '../components/Vinculaciones'
import HeaderPills from '../components/HeaderPills'
import FunnelTracker from '../components/FunnelTracker'
import FunnelStepCards from '../components/FunnelStepCards'
import MarcarDemandaCierreModal from '../components/MarcarDemandaCierreModal'
import NotasModal from '../components/NotasModal'
import { Building2, Target, ScrollText, Trophy, X as XClose } from 'lucide-react'

// Orden canónico · Info → Específico → Documentos → Vista 360 → Confidencialidad
// "Negociaciones" es específico de Demanda (las que salen de ella), va antes de Documentos.
const DEM_TABS = [
  ['dem-info', 'Información general'],
  ['dem-req',  'Requisitos'],
  ['dem-neg',  'Negociaciones'],
  ['dem-docs', 'Documentos'],
  ['dem-360',  'Vista 360'],
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
  potencial:         { tag:'tag-blue',  headerCol:'var(--accent)', bg:'#f5efe5', bd:'#93c5fd', text:'#6f5734', icon:'' },
  paralizada:        { tag:'tag-amber', headerCol:'var(--amber)',  bg:'#fef3c7', bd:'#fcd34d', text:'#92400e', icon:'⏸' },
  descartada:        { tag:'tag-red',   headerCol:'#dc2626',       bg:'#fee2e2', bd:'#fca5a5', text:'#991b1b', icon:'✕' },
  cerrada_concedido: { tag:'tag-green', headerCol:'var(--green)',  bg:'#dcfce7', bd:'#86efac', text:'#15803d', icon:'' },
  cerrada_perdida:   { tag:'tag-red',   headerCol:'#dc2626',       bg:'#fee2e2', bd:'#fca5a5', text:'#991b1b', icon:'✕' },
}

function StubTab({ label }) {
  return (
    <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>
      <div style={{ fontSize:32, marginBottom:8 }}></div>
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
    { name: CURRENT_USER.nombre, team: CURRENT_USER.equipo || 'Equipo PDB', role:'Principal', initials:(CURRENT_USER.nombre||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(), bg:'#f5efe5', color:'#5a4828', owner:true },
  ])
  const [contactosCuenta, setContactosCuenta] = useState([])
  const [otrosContactosFull, setOtrosContactosFull] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Modo edición · default vista. Pulsa "Editar" para activar inputs/selects.
  // Tras guardar OK, vuelve a vista automáticamente.
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [showFirmarModal, setShowFirmarModal] = useState(false)
  const [showCierreModal, setShowCierreModal] = useState(null) // 'ganada' | 'perdida' | null
  const [showNotasModal, setShowNotasModal] = useState(false)
  const [oportunidad, setOportunidad] = useState(null)
  // Vista 360 · alternativas (oferta_demanda con joins a ofertas + activos)
  const [alternativas, setAlternativas] = useState([])
  const [loadingAlt, setLoadingAlt] = useState(false)
  // Typeahead de búsqueda de Mandato para vincular
  const [mandatoSearch, setMandatoSearch] = useState('')
  const [mandatoResults, setMandatoResults] = useState([])
  const [showMandatoDD, setShowMandatoDD] = useState(false)

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
    // SELECT robusto: si la columna `documentos` aún no existe (migración 031
    // sin aplicar), reintentamos sin ella para no romper la ficha entera.
    const SELECT_FULL = `
      id, ref, nombre, estatus, notas, motivo_descarte, requisitos, otros_contactos, equipo_trabajo, documentos,
      dynamics_account_id, dynamics_opportunity_id, mandato_id, created_at, updated_at,
      dynamics_accounts:dynamics_account_id ( dynamics_id, nombre, tipo, sector, direccion, codigo_postal, ciudad, pais, telefono, web ),
      dynamics_opportunities:dynamics_opportunity_id ( dynamics_id, nombre, tipo ),
      mandato:mandato_id ( id, ref )
    `
    const SELECT_FALLBACK = SELECT_FULL.replace(', documentos', '')

    let { data, error } = await supabase.from('demandas').select(SELECT_FULL).eq('ref', refOrId).maybeSingle()
    if (error && /documentos/i.test(error.message)) {
      // Reintenta sin la columna documentos
      const r = await supabase.from('demandas').select(SELECT_FALLBACK).eq('ref', refOrId).maybeSingle()
      data = r.data; error = r.error
      if (data) data.documentos = []
    }
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

  // Carga las alternativas (oferta_demanda) cuando se conoce la demanda
  const loadAlternativas = useCallback(async () => {
    if (!demanda?.id) return
    setLoadingAlt(true)
    const { data } = await supabase
      .from('oferta_demanda')
      .select(`
        id, estado_alternativa, condiciones_negociadas, created_at, updated_at,
        ofertas:oferta_id ( id, ref, tipo_operacion, estado ),
        activos:activo_id ( id, ref, nombre, ciudad, uso, sba )
      `)
      .eq('demanda_id', demanda.id)
      .order('updated_at', { ascending:false })
    setAlternativas(data || [])
    setLoadingAlt(false)
  }, [demanda?.id])

  useEffect(() => { loadAlternativas() }, [loadAlternativas])

  // Busca mandatos al escribir en el typeahead · prioriza misma cuenta y tipo buy
  useEffect(() => {
    if (!showMandatoDD) return
    const q = mandatoSearch.trim()
    if (q.length < 1 && !demanda?.dynamics_account_id) { setMandatoResults([]); return }
    let cancel = false
    ;(async () => {
      let query = supabase
        .from('mandatos')
        .select('id, ref, tipo, via, estado, dynamics_account_id, fecha_firma')
        .order('fecha_firma', { ascending:false })
        .limit(12)
      if (q.length >= 1) query = query.ilike('ref', `%${q.toUpperCase()}%`)
      const { data } = await query
      if (cancel) return
      // Ordena: mismos account_id arriba, luego buy, luego resto
      const acc = demanda?.dynamics_account_id
      const sorted = (data || []).sort((a,b) => {
        const sa = (a.dynamics_account_id === acc ? 0 : 2) + (a.tipo === 'buy' ? 0 : 1)
        const sb = (b.dynamics_account_id === acc ? 0 : 2) + (b.tipo === 'buy' ? 0 : 1)
        return sa - sb
      })
      setMandatoResults(sorted)
    })()
    return () => { cancel = true }
  }, [mandatoSearch, showMandatoDD, demanda?.dynamics_account_id])

  const vincularMandato = async (mandatoId) => {
    const { error } = await supabase.from('demandas')
      .update({ mandato_id: mandatoId, updated_at: new Date().toISOString() })
      .eq('id', demanda.id)
    if (error) { setSaveError(error.message); return }
    setMandatoSearch(''); setShowMandatoDD(false); setMandatoResults([])
    await load()
  }

  const desvincularMandato = async () => {
    if (!window.confirm('¿Desvincular el mandato de esta demanda? La demanda volverá a estar sin mandato.')) return
    const { error } = await supabase.from('demandas')
      .update({ mandato_id: null, updated_at: new Date().toISOString() })
      .eq('id', demanda.id)
    if (error) { setSaveError(error.message); return }
    await load()
  }

  // Transición de estado de una alternativa (presentada → visita → negociación)
  const cambiarEstadoAlternativa = async (altId, nuevoEstado) => {
    const { error } = await supabase
      .from('oferta_demanda')
      .update({ estado_alternativa: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', altId)
    if (error) { setSaveError(error.message); return }
    await loadAlternativas()
  }

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
    setEditing(false)  // tras guardar OK, vuelve a modo vista
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
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}
      className={editing ? 'ficha-editing' : 'ficha-viewing'}>

      <div className="action-bar">
        {!editing ? (
          <button className="ab-btn save" onClick={() => setEditing(true)}>✎ Editar</button>
        ) : (
          <>
            <button className="ab-btn save" onClick={saveEdit} disabled={saving}>
              {saving ? 'Guardando…' : '💾 Guardar cambios'}
            </button>
            <button className="ab-btn" onClick={() => { setEditing(false); restablecer() }} disabled={saving}>Cancelar</button>
          </>
        )}
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
              Mandato {demanda.mandato.ref}
            </button>
          ) : (
            <button
              className="ab-btn"
              onClick={() => setShowFirmarModal(true)}
              disabled={!puede}
              title={tip}
              style={{ background: puede ? 'var(--purple, #6b5b8e)' : undefined, color: puede ? '#fff' : undefined, border: puede ? '1px solid var(--purple, #6b5b8e)' : undefined, opacity: puede ? 1 : 0.45 }}
            >
              Firmar mandato
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
      {showCierreModal && (
        <MarcarDemandaCierreModal
          tipo={showCierreModal}
          demanda={demanda}
          onClose={() => setShowCierreModal(null)}
          onSuccess={() => { setShowCierreModal(null); load() }}
        />
      )}

      <NotasModal
        open={showNotasModal}
        onClose={() => setShowNotasModal(false)}
        onSave={async () => { await saveEdit() }}
        title="Notas"
        subtitle={`Notas internas · ${demanda.ref}`}
        saving={saving}
        fields={[
          {
            key:'notas',
            label:'Notas internas',
            value: form.notas,
            onChange: (v) => setF('notas', v),
            placeholder:'Notas internas sobre la demanda...',
            rows:6,
          },
        ]}
      />

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Funnel tracker · hilo conductor entre fases */}
          <FunnelTracker steps={[
            { key:'opo', label:'Oportunidad', ref: oportunidad?.dynamics_id || demanda.dynamics_opportunity_id || null,
              onClick: (oportunidad?.dynamics_id || demanda.dynamics_opportunity_id) ? () => navigate('ficha-oportunidad', { id: oportunidad?.dynamics_id || demanda.dynamics_opportunity_id }) : null },
            { key:'man', label:'Mandato', ref: demanda.mandato?.ref || null,
              onClick: demanda.mandato?.ref ? () => navigate('ficha-mandato', { ref: demanda.mandato.ref }) : null },
            { key:'dem', label:'Demanda', ref: demanda.ref, current: true, onClick: null },
            { key:'neg', label:'Negociación', ref: demanda.negociacion_ref || null,
              onClick: demanda.negociacion_ref ? () => navigate('ficha-negociacion', { ref: demanda.negociacion_ref }) : null },
          ]} />

          {/* Header con pills interactivos · canon unificado */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#1e3a5f,#8a6d40)' }}>🔍</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="ah-ref">
                  <span style={{ background:'var(--accent-lt)', color:'var(--accent)', border:'1px solid var(--accent-bd)', padding:'0 6px', borderRadius:3, fontSize:9, fontWeight:700 }}>DEMANDA</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{demanda.ref}</span>
                  {visTipologia && <span style={{ color:'var(--text4)', fontSize:11 }}>· {visTipologia}</span>}
                </div>
                <div className="ah-name">
                  {editing
                    ? <input style={{ ...inpFull, fontSize:22, fontWeight:700, padding:'4px 8px' }} value={form.nombre} onChange={e => setF('nombre', e.target.value)} placeholder="Nombre de la demanda" />
                    : tituloHeader}
                </div>
                <div className="ah-addr">
                  📍 {[cuenta?.direccion, cuenta?.codigo_postal, cuenta?.ciudad].filter(Boolean).join(', ') || 'Dirección no disponible'} · Creada: {fmtDate(demanda.created_at)} · {CURRENT_USER.nombre}
                </div>
              </div>
              {(() => {
                const ec = ESTADO_COLOR[form.estatus] || ESTADO_COLOR.ongoing
                const colorMap = { ongoing:'green', potencial:'blue', paralizada:'amber', descartada:'red', cerrada_concedido:'green', cerrada_perdida:'red' }
                const hasNotas = !!(form.notas || '').trim()
                const items = [
                  { key:'estado', type:'info', label:'Estado', value:`${ec.icon} ${ESTADO_LABEL[form.estatus] || form.estatus || '—'}`,
                    color: colorMap[form.estatus] || 'amber', accent:true },
                ]
                if (visNaturaleza) items.push({ key:'natur', type:'info', label:'Naturaleza', value: visNaturaleza, color: visNaturaleza === 'Inversión' ? 'amber' : 'blue', accent:true })
                if (visUso) items.push({ key:'uso', type:'info', label:'Uso principal', value: visUso, color:'blue', accent:true })
                if (reqs.sup_min || reqs.sup_max) items.push({ key:'sup', type:'info', label:'Superficie', value: `${reqs.sup_min || '?'}–${reqs.sup_max || '?'} m²` })
                items.push({ key:'resp', type:'info', label:'Responsable', value: CURRENT_USER.nombre })
                items.push({
                  key:'notas', type:'button', label:'Notas',
                  value: hasNotas ? '📝' : '—',
                  icon: hasNotas ? null : '📝',
                  color: hasNotas ? 'accent' : 'default',
                  accent: hasNotas,
                  onClick: () => setShowNotasModal(true),
                  title: hasNotas ? 'Ver/editar notas' : 'Añadir notas',
                })
                return <HeaderPills items={items} />
              })()}
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

            const equipoInterno = equipo.filter(m => m.rol !== 'Colaborador')
            const colaboradores = equipo.filter(m => m.rol === 'Colaborador')
            const mapIdx = (filtered, idx) => equipo.indexOf(filtered[idx])

            return (
              <div className="tab-content active"><div className="info-pad">

                {/* ── FUNNEL STEP CARDS · wizard del proceso de demanda ── */}
                {(() => {
                  const hasCuenta      = !!(cuenta?.dynamics_id || cuenta?.id)
                  const hasOportunidad = !!(oportunidad?.dynamics_id || demanda.dynamics_opportunity_id)
                  const hasMandato     = !!demanda.mandato_id
                  const yaGanada       = form.estatus === 'cerrada_concedido'
                  const yaPerdida      = ['cerrada_perdida','descartada'].includes(form.estatus)
                  const enCurso        = !yaGanada && !yaPerdida && hasOportunidad
                  return (
                    <FunnelStepCards steps={[
                      {
                        key:'cuenta',
                        icon: Building2,
                        tone:'green',
                        label:'Cliente (Cuenta)',
                        value: cuenta?.nombre || null,
                        sub:   cuenta?.sector || cuenta?.tipo || null,
                        status: hasCuenta ? 'done' : 'current',
                        openAction: hasCuenta ? { label:'Abrir cuenta', onClick: () => navigate('cuentas', { id: cuenta.dynamics_id || cuenta.id }) } : null,
                        dyn: true,
                      },
                      {
                        key:'oportunidad',
                        icon: Target,
                        tone:'accent',
                        label:'Oportunidad',
                        value: oportunidad?.nombre || demanda.dynamics_opportunity_id || null,
                        sub:   oportunidad?.tipo || null,
                        status: hasOportunidad ? 'done' : 'locked',
                        openAction: hasOportunidad ? { label:'Abrir oportunidad', onClick: () => navigate('ficha-oportunidad', { id: oportunidad?.dynamics_id || demanda.dynamics_opportunity_id }) } : null,
                        lockedHint:'Sin oportunidad vinculada.',
                        dyn: true,
                      },
                      {
                        key:'mandato',
                        icon: ScrollText,
                        tone:'purple',
                        label:'Mandato',
                        value: demanda.mandato?.ref || null,
                        sub: hasMandato ? 'Mandato vinculado a esta demanda.' : null,
                        status: hasMandato ? 'done' : 'locked',
                        openAction: hasMandato ? { label:'Abrir mandato', onClick: () => navigate('ficha-mandato', { ref: demanda.mandato.ref }) } : null,
                        lockedHint:'Las demandas pueden o no llevar mandato. Si no hay, se hace matching directo desde el pool de ofertas.',
                        optional: !hasMandato,
                      },
                      // Card Ganado
                      {
                        key:'ganada',
                        icon: Trophy,
                        tone:'green',
                        label:'Demanda ganada',
                        value: yaGanada ? 'Concedido' : null,
                        sub: yaGanada
                          ? 'Cuenta firmó con un activo del pool.'
                          : 'Cuando la cuenta firme con un activo, marca aquí el cierre concedido.',
                        status: yaGanada ? 'done' : yaPerdida ? 'locked' : enCurso ? 'current' : 'locked',
                        action: enCurso
                          ? { label:'✓ Marcar como ganada', onClick: () => setShowCierreModal('ganada'), primary: true }
                          : null,
                        lockedHint: yaPerdida ? 'La demanda ya está marcada como perdida/descartada.' : 'Vincula la oportunidad.',
                      },
                      // Card Perdido
                      {
                        key:'perdida',
                        icon: XClose,
                        tone:'red',
                        label:'Demanda perdida',
                        value: yaPerdida ? (demanda.motivo_descarte || ESTADO_LABEL[form.estatus]) : null,
                        sub: yaPerdida
                          ? null
                          : 'Si la cuenta no firma o cierra sin éxito, indica el motivo aquí.',
                        status: yaPerdida ? 'done' : yaGanada ? 'locked' : enCurso ? 'current' : 'locked',
                        action: enCurso
                          ? { label:'✗ Marcar como perdida', onClick: () => setShowCierreModal('perdida'), primary: false }
                          : null,
                        lockedHint: yaGanada ? 'La demanda ya está marcada como ganada.' : 'Vincula la oportunidad.',
                      },
                    ]} />
                  )
                })()}

                {/* ── EQUIPO DE TRABAJO + COLABORADORES (50/50 justo bajo Vinculaciones) ── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <EquipoTrabajoCard
                    title="Equipo de trabajo"
                    equipo={equipoInterno}
                    canManage={canManage}
                    onAdd={(nombre, equipoNombre, rol) => handlers.addMiembro(nombre, equipoNombre, rol === 'Colaborador' ? 'Soporte' : rol)}
                    onRemove={(idx) => handlers.removeMiembro(mapIdx(equipoInterno, idx))}
                    onUpdateRol={(idx, rol) => handlers.updateMiembroRol(mapIdx(equipoInterno, idx), rol)}
                  />
                  <EquipoTrabajoCard
                    title="Colaboradores"
                    equipo={colaboradores}
                    canManage={canManage}
                    onAdd={(nombre, equipoNombre) => handlers.addMiembro(nombre, equipoNombre, 'Colaborador')}
                    onRemove={(idx) => handlers.removeMiembro(mapIdx(colaboradores, idx))}
                    onUpdateRol={(idx, rol) => handlers.updateMiembroRol(mapIdx(colaboradores, idx), rol)}
                  />
                </div>

                {/* ─── FILA: Estado (1/2) + Partes involucradas (1/2) ─── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>

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

                  {/* === PARTES INVOLUCRADAS === */}
                  <div className="va-card" style={{ marginBottom:0, overflow:'visible' }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{ color:'#6b5b8e' }}></span> Partes involucradas</h3>
                      <span className="hint">Contactos de {cuenta?.nombre || '(cuenta)'}</span>
                    </div>
                    <div style={{ padding:'8px 20px 16px' }}>
                      {otrosListaFull.length === 0 ? (
                        <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic', padding:'8px 0' }}>Sin partes adicionales.</div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {otrosListaFull.map(c => (
                            <div key={c.dynamics_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                              <div style={{ width:28, height:28, borderRadius:'50%', background:'#6b5b8e', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>
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

                {/* ─── Vincular Mandato (solo si no hay vinculado · alternativa al botón "Firmar mandato") ─── */}
                {!(demanda.mandato_id && demanda.mandato) && (
                  <div className="va-card" style={{ marginBottom:12, overflow:'visible' }}>
                    <div className="va-card-header">
                      <h3><span className="ico"></span> Vincular mandato existente</h3>
                      <span className="hint">Opcional · usa "Firmar mandato" arriba para crear uno nuevo</span>
                    </div>
                    <div style={{ padding:'8px 20px 16px', position:'relative' }}>
                      <input
                        className="kf-inp"
                        value={mandatoSearch}
                        onChange={e => { setMandatoSearch(e.target.value); setShowMandatoDD(true) }}
                        onFocus={() => setShowMandatoDD(true)}
                        onBlur={() => setTimeout(() => setShowMandatoDD(false), 200)}
                        placeholder="🔍 Buscar mandato existente (ej. MAN-2026-)"
                        style={{ width:'100%', fontFamily:'var(--mono)', fontSize:12, padding:'8px 10px' }}
                      />
                      {showMandatoDD && (
                        <div style={{ position:'absolute', top:'calc(100% + 2px)', left:20, right:20, zIndex:30, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, maxHeight:240, overflowY:'auto', boxShadow:'0 6px 20px rgba(0,0,0,0.12)' }}>
                          {mandatoResults.length === 0 ? (
                            <div style={{ padding:'10px 12px', fontSize:11, color:'var(--text4)' }}>
                              {mandatoSearch.length < 1 ? 'Escribe para buscar mandatos...' : 'Sin resultados para esa referencia.'}
                            </div>
                          ) : mandatoResults.map(m => {
                            const mismaCuenta = m.dynamics_account_id === demanda.dynamics_account_id
                            return (
                              <div
                                key={m.id}
                                onMouseDown={() => vincularMandato(m.id)}
                                style={{ padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                              >
                                <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--purple, #6b5b8e)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}></div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:12, fontWeight:600, fontFamily:'var(--mono)' }}>{m.ref}</div>
                                  <div style={{ fontSize:10, color:'var(--text4)', display:'flex', gap:6, flexWrap:'wrap' }}>
                                    <span className={`tag ${m.tipo === 'buy' ? 'tag-blue' : 'tag-amber'}`} style={{ fontSize:8 }}>{m.tipo}</span>
                                    <span className="tag tag-gray" style={{ fontSize:8 }}>{m.via}</span>
                                    {mismaCuenta && <span className="tag tag-green" style={{ fontSize:8 }}>✓ misma cuenta</span>}
                                    <span>· {m.estado}</span>
                                    {m.fecha_firma && <span>· firma {fmtDate(m.fecha_firma)}</span>}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                    Exportar a mapa
                  </button>
                </div>

                {/* ─── FILA 1: Requisitos generales (1/2) + Económicos (1/2) ─── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>

                  {/* === REQUISITOS GENERALES === */}
                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{ color:'var(--accent)' }}></span> Requisitos generales</h3>
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
                      <h3><span className="ico" style={{ color:'var(--accent)' }}></span> Provincias de interés</h3>
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
                    <h3><span className="ico" style={{ color:'var(--teal)' }}></span> Detalles geográficos</h3>
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

          {tab === 'dem-360' && (() => {
            // Agrupación por fase del funnel
            const presentadas = alternativas.filter(a => ['propuesta','enviada'].includes(a.estado_alternativa))
            const visitadas   = alternativas.filter(a => ['visita_programada','visita_realizada'].includes(a.estado_alternativa))
            const negociando  = alternativas.filter(a => ['negociando'].includes(a.estado_alternativa))
            const cerradas    = alternativas.filter(a => ['ganada','perdida','descartada'].includes(a.estado_alternativa))

            const fmtSba = sba => sba ? `${Number(sba).toLocaleString('es-ES')} m²` : '—'

            // Tarjeta de alternativa reutilizable (mismo formato cards uniformes)
            const AltCard = ({ alt, accent = 'var(--accent)', actions }) => {
              const a = alt.activos || {}
              const o = alt.ofertas || {}
              return (
                <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'10px 12px', border:'1px solid var(--border)', borderLeft:`3px solid ${accent}`, borderRadius:'var(--r)', background:'var(--surface)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:accent, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}></div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', cursor:'pointer' }} onClick={() => a.ref && navigate('ficha-activo', { ref:a.ref })}>
                        {a.nombre || '(activo sin nombre)'}
                      </div>
                      <div style={{ fontSize:10, color:'var(--text3)' }}>
                        {[a.ciudad, a.uso, fmtSba(a.sba)].filter(x => x && x !== '—').join(' · ') || '—'}
                      </div>
                    </div>
                    {o.ref && (
                      <span className="tag tag-blue" style={{ fontSize:9, fontFamily:'var(--mono)', cursor:'pointer' }} onClick={() => navigate('ficha-oferta', { ofertaRef: o.ref })}>{o.ref}</span>
                    )}
                  </div>
                  {actions && (
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', borderTop:'1px dashed var(--border)', paddingTop:8, marginTop:2 }}>
                      {actions}
                    </div>
                  )}
                </div>
              )
            }

            const EmptyCol = ({ msg }) => (
              <div style={{ padding:'20px 12px', textAlign:'center', border:'1px dashed var(--border)', borderRadius:'var(--r)', background:'var(--gray-lt)', fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>
                {msg}
              </div>
            )

            return (
              <div className="tab-content active"><div className="info-pad">

                {/* Cabecera con KPIs de funnel */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                  {[
                    ['Presentadas', presentadas.length, '#f5efe5', '#6f5734', ''],
                    ['Visitadas',   visitadas.length,   '#f0fdfa', '#0f766e', ''],
                    ['Negociando',  negociando.length,  '#fef3c7', '#92400e', ''],
                    ['Cerradas',    cerradas.length,    '#f1f5f9', '#475569', '✓'],
                  ].map(([lbl, val, bg, color, icon]) => (
                    <div key={lbl} style={{ padding:'10px 12px', background:bg, border:`1px solid ${color}33`, borderRadius:6 }}>
                      <div style={{ fontSize:9, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{lbl}</div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                        <span style={{ fontSize:22, fontWeight:800, fontFamily:'var(--mono)', color, lineHeight:1 }}>{val}</span>
                        <span style={{ fontSize:14 }}>{icon}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {loadingAlt && <div style={{ padding:12, fontSize:11, color:'var(--text4)' }}>Cargando alternativas…</div>}

                {!loadingAlt && alternativas.length === 0 && (
                  <div className="va-card" style={{ marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico"></span> Aún no hay edificios presentados</h3>
                    </div>
                    <div style={{ padding:'14px 18px 18px', fontSize:12, color:'var(--text3)' }}>
                      <p style={{ margin:'0 0 8px' }}>Define los requisitos en la pestaña <strong>Requisitos</strong> y pulsa <strong>Exportar a mapa</strong> para seleccionar edificios candidatos. Cuando envíes microsites a la cuenta, aparecerán aquí como <strong>Presentadas</strong>.</p>
                      <p style={{ margin:'8px 0 0' }}>Desde cada visita realizada podrás transformar la alternativa en <strong>Negociación</strong> creando primero una Instrucción.</p>
                    </div>
                  </div>
                )}

                {!loadingAlt && alternativas.length > 0 && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>

                    {/* === COL 1 · PRESENTADAS === */}
                    <div className="va-card" style={{ marginBottom:0 }}>
                      <div className="va-card-header" style={{ background:'#f8fafc' }}>
                        <h3><span className="ico" style={{ color:'#6f5734' }}></span> Presentadas <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:4 }}>({presentadas.length})</span></h3>
                      </div>
                      <div style={{ padding:'10px 14px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                        {presentadas.length === 0
                          ? <EmptyCol msg="Aún no se han presentado edificios." />
                          : presentadas.map(alt => (
                              <AltCard key={alt.id} alt={alt} accent="#6f5734" actions={
                                <>
                                  {alt.estado_alternativa === 'propuesta' && (
                                    <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px' }} onClick={() => cambiarEstadoAlternativa(alt.id, 'enviada')}>📤 Marcar enviada</button>
                                  )}
                                  <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px' }} onClick={() => cambiarEstadoAlternativa(alt.id, 'visita_programada')}>🗓 Visita programada</button>
                                  <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px', color:'var(--red)' }} onClick={() => cambiarEstadoAlternativa(alt.id, 'descartada')}>✕ Descartar</button>
                                </>
                              } />
                            ))
                        }
                      </div>
                    </div>

                    {/* === COL 2 · VISITADAS === */}
                    <div className="va-card" style={{ marginBottom:0 }}>
                      <div className="va-card-header" style={{ background:'#f0fdfa' }}>
                        <h3><span className="ico" style={{ color:'#0f766e' }}></span> Visitadas <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:4 }}>({visitadas.length})</span></h3>
                      </div>
                      <div style={{ padding:'10px 14px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                        {visitadas.length === 0
                          ? <EmptyCol msg="Aún no hay visitas programadas." />
                          : visitadas.map(alt => (
                              <AltCard key={alt.id} alt={alt} accent="#0f766e" actions={
                                <>
                                  {alt.estado_alternativa === 'visita_programada' && (
                                    <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px' }} onClick={() => cambiarEstadoAlternativa(alt.id, 'visita_realizada')}>✓ Visita realizada</button>
                                  )}
                                  {alt.estado_alternativa === 'visita_realizada' && (
                                    <button
                                      className="ab-btn"
                                      style={{ fontSize:9, padding:'3px 8px', background:'var(--purple, #6b5b8e)', color:'#fff', border:'1px solid var(--purple, #6b5b8e)', fontWeight:700 }}
                                      onClick={() => {
                                        // TODO: cascada Instrucción → Negociación
                                        // Por ahora cambia estado a 'negociando' y muestra aviso
                                        if (window.confirm('Esto creará primero una Instrucción y después una Negociación. ¿Continuar?\n\n(Cascada Instrucción→Negociación todavía no implementada — por ahora solo se cambia el estado a "negociando".)')) {
                                          cambiarEstadoAlternativa(alt.id, 'negociando')
                                        }
                                      }}
                                      title="Crea Instrucción + Negociación (cascada)"
                                    >Transformar a Negociación</button>
                                  )}
                                  <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px', color:'var(--red)' }} onClick={() => cambiarEstadoAlternativa(alt.id, 'descartada')}>✕ Descartar</button>
                                </>
                              } />
                            ))
                        }
                      </div>
                    </div>

                    {/* === COL 3 · EN NEGOCIACIÓN === */}
                    <div className="va-card" style={{ marginBottom:0 }}>
                      <div className="va-card-header" style={{ background:'#fef3c7' }}>
                        <h3><span className="ico" style={{ color:'#92400e' }}></span> En negociación <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:4 }}>({negociando.length})</span></h3>
                      </div>
                      <div style={{ padding:'10px 14px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                        {negociando.length === 0
                          ? <EmptyCol msg="Sin negociaciones activas." />
                          : negociando.map(alt => (
                              <AltCard key={alt.id} alt={alt} accent="#92400e" actions={
                                <>
                                  <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px' }} onClick={() => alt.ofertas?.ref && navigate('ficha-negociacion', { id: alt.ofertas.ref })}>Ver negociación</button>
                                  <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px', color:'var(--green)' }} onClick={() => cambiarEstadoAlternativa(alt.id, 'ganada')}>Ganada</button>
                                  <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px', color:'var(--red)' }} onClick={() => cambiarEstadoAlternativa(alt.id, 'perdida')}>✕ Perdida</button>
                                </>
                              } />
                            ))
                        }
                      </div>
                    </div>

                  </div>
                )}

                {/* CERRADAS · siempre visible si hay alguna */}
                {cerradas.length > 0 && (
                  <div className="va-card" style={{ marginTop:14, marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{ color:'#475569' }}>✓</span> Cerradas <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:4 }}>({cerradas.length})</span></h3>
                    </div>
                    <div style={{ padding:'10px 18px 14px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                      {cerradas.map(alt => {
                        const isWin = alt.estado_alternativa === 'ganada'
                        return (
                          <AltCard key={alt.id} alt={alt} accent={isWin ? 'var(--green)' : '#94a3b8'} actions={
                            <span className={`tag ${isWin ? 'tag-green' : 'tag-gray'}`} style={{ fontSize:9 }}>
                              {alt.estado_alternativa === 'ganada' ? 'Ganada' : alt.estado_alternativa === 'perdida' ? '✕ Perdida' : '⊘ Descartada'}
                            </span>
                          } />
                        )
                      })}
                    </div>
                  </div>
                )}

              </div></div>
            )
          })()}
          {tab === 'dem-docs' && (() => {
            const docs = Array.isArray(demanda.documentos) ? demanda.documentos : []
            const CATEGORIAS = ['Brief','NDA','KYC','Plano','Propuesta económica','Reporte','Contrato','Email','Otro']
            const ICON_CAT = {
              Brief:'', NDA:'', KYC:'🪪', Plano:'📐',
              'Propuesta económica':'', Reporte:'', Contrato:'', Email:'📧', Otro:'📎',
            }
            const COLOR_CAT = {
              Brief:'#6f5734', NDA:'#6b5b8e', KYC:'#0f766e', Plano:'#0891b2',
              'Propuesta económica':'#15803d', Reporte:'#b45309', Contrato:'#0f172a', Email:'#475569', Otro:'#64748b',
            }

            const fmtSize = bytes => {
              if (!bytes) return '—'
              if (bytes < 1024) return `${bytes} B`
              if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`
              return `${(bytes/(1024*1024)).toFixed(1)} MB`
            }

            const persistDocs = async (nuevosDocs) => {
              const { error } = await supabase
                .from('demandas')
                .update({ documentos: nuevosDocs, updated_at: new Date().toISOString() })
                .eq('id', demanda.id)
              if (error) { setSaveError(error.message); return }
              await load()
            }

            const handleUpload = (fileList) => {
              const files = Array.from(fileList || [])
              if (files.length === 0) return
              const nuevos = files.map(f => ({
                id: `doc-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                nombre: f.name,
                tamano: f.size,
                etiqueta: 'Otro',
                fecha: new Date().toISOString(),
                autor: CURRENT_USER.nombre,
              }))
              persistDocs([...docs, ...nuevos])
            }

            const cambiarEtiqueta = (id, etiqueta) => {
              persistDocs(docs.map(d => d.id === id ? { ...d, etiqueta } : d))
            }

            const eliminarDoc = (id) => {
              if (!window.confirm('¿Eliminar este documento?')) return
              persistDocs(docs.filter(d => d.id !== id))
            }

            return (
              <div className="tab-content active"><div className="info-pad">

                {/* Zona de carga · drag&drop */}
                <div
                  className="va-card"
                  style={{ marginBottom:12 }}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = '' }}
                  onDrop={e => {
                    e.preventDefault()
                    e.currentTarget.style.borderColor = ''
                    handleUpload(e.dataTransfer.files)
                  }}
                >
                  <div className="va-card-header">
                    <h3><span className="ico" style={{ color:'var(--accent)' }}>↑</span> Subir documento</h3>
                    <span className="hint">Arrastra archivos aquí o pulsa para seleccionar</span>
                  </div>
                  <label style={{
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    padding:'24px 14px', margin:'10px 18px 16px',
                    border:'2px dashed var(--border)', borderRadius:8,
                    background:'var(--surface-2)', cursor:'pointer', textAlign:'center',
                  }}>
                    <div style={{ fontSize:32, marginBottom:6 }}></div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:3 }}>Arrastra archivos o haz click</div>
                    <div style={{ fontSize:11, color:'var(--text4)' }}>Brief · NDA · KYC · Planos · Propuestas · Reportes</div>
                    <input
                      type="file"
                      multiple
                      style={{ display:'none' }}
                      onChange={e => handleUpload(e.target.files)}
                    />
                  </label>
                </div>

                {/* Lista de documentos */}
                <div className="va-card" style={{ marginBottom:0 }}>
                  <div className="va-card-header">
                    <h3><span className="ico">▤</span> Documentos cargados <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:4 }}>({docs.length})</span></h3>
                  </div>
                  <div style={{ padding:'10px 18px 16px' }}>
                    {docs.length === 0 ? (
                      <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic', textAlign:'center', padding:'14px 0' }}>
                        Aún no hay documentos cargados. Arrastra archivos arriba para empezar.
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {docs.map(d => {
                          const cat = d.etiqueta || 'Otro'
                          return (
                            <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                              <div style={{ width:34, height:34, borderRadius:'50%', background:COLOR_CAT[cat] + '22', color:COLOR_CAT[cat], display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
                                {ICON_CAT[cat]}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nombre}</div>
                                <div style={{ fontSize:10, color:'var(--text3)' }}>
                                  {fmtSize(d.tamano)} · {fmtDate(d.fecha)} · {d.autor}
                                </div>
                              </div>
                              <select
                                className="fsel"
                                value={cat}
                                onChange={e => cambiarEtiqueta(d.id, e.target.value)}
                                style={{ fontSize:10, padding:'3px 6px', minWidth:130, borderColor: COLOR_CAT[cat], color: COLOR_CAT[cat], fontWeight:700 }}
                              >
                                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                              </select>
                              <button
                                onClick={() => eliminarDoc(d.id)}
                                style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:13, padding:'2px 6px' }}
                                title="Eliminar"
                              >✕</button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div style={{ marginTop:10, padding:'8px 10px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:5, fontSize:10, color:'#92400e' }}>
                      ⚠ Los archivos solo guardan metadata por ahora (storage real pendiente). El nombre, tamaño, fecha, autor y etiqueta sí se persisten.
                    </div>
                  </div>
                </div>

              </div></div>
            )
          })()}
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
                          <div style={{ width:32, height:32, borderRadius:'50%', background:'#f5efe5', color:'#5a4828', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{initials(principal.nombre)}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600 }}>{principal.nombre}</div>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>{principal.equipo}</div>
                          </div>
                          <span className="tag tag-blue" style={{ fontSize:9 }}>Principal</span>
                        </div>
                      )}
                      {soportes.map((m,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:'#fdf4ff', color:'#6b5b8e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{initials(m.nombre)}</div>
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
                  <button className="acc-btn" style={{ flex:1, fontSize:10 }}>Contacto</button>
                  <button className="acc-btn" style={{ flex:1, fontSize:10 }}>✅ Asignar</button>
                </div>
              </div>

              {/* 2 · ASISTENTE IA */}
              <div className="rp-sec">
                <div className="rp-lbl">Asistente IA</div>
                <div className="ai-box">
                  <div className="ai-head"><div className="ai-ico"></div><span className="ai-lbl">Análisis de la demanda</span><span className="ai-badge">Tiempo real</span></div>
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
                    <button style={{ fontSize:10, padding:'4px 8px', background:'none', border:'1px solid var(--accent-bd)', color:'var(--accent)', borderRadius:4, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>Resumen ejecutivo</button>
                    <button style={{ fontSize:10, padding:'4px 8px', background:'none', border:'1px solid var(--accent-bd)', color:'var(--accent)', borderRadius:4, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>Sugerir zonas alternativas</button>
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
