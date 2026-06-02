import { useState, useEffect, useCallback } from 'react'
import { useNav, useUnsavedGuard } from '../context/NavigationContext'
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
import MatchingOfertasModal from '../components/MatchingOfertasModal'
import NotasModal from '../components/NotasModal'
import IniciarNegociacionModal from '../components/IniciarNegociacionModal'
import { cardTone } from '../lib/cardTones'
import { ZONES } from './FichaActivo'
import { Building2, Target, ScrollText, Trophy, X as XClose, Briefcase, Tag, FileSearch, Handshake, MessageSquare } from 'lucide-react'

// Orden canónico · Info → Documentos → Vista 360 → Confidencialidad.
// Requisitos se fusionó en "Información general" (sección inferior).
// Negociaciones se accede ahora vía la card de Estado cuando estatus =
// 'en_negociacion' (botón 'Abrir negociación'), no hay tab dedicado.
const DEM_TABS = [
  ['dem-info', 'Información general'],
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
// Mapea el uso_principal a la key de ZONES (área → zona → subzona)
function zonesKeyForUso(uso) {
  if (!uso) return 'Oficinas'
  if (/oficina/i.test(uso)) return 'Oficinas'
  if (/log|industri/i.test(uso)) return 'Logístico'
  if (/retail|local|centro comercial|high street|flagship/i.test(uso)) return 'Retail'
  return 'Oficinas'
}

// Estilo coherente con of-inp/of-sel
const sel = { width:'auto', padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inp = { width:80,    padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inpFull = { ...inp, width:'100%' }
const ta  = { width:'100%', padding:'6px 9px', fontSize:11.5, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit', minHeight:60, lineHeight:1.5, resize:'vertical' }

function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('es-ES') }

// Opciones que el usuario puede elegir explícitamente en el dropdown del
// Estado de la demanda. 'cerrada_concedido' (Cerrada por Savills) NO se elige
// aquí — se establece automáticamente al cerrar con éxito una negociación
// (botón "Marcar como ganada").
const ESTADO_OPTS = [
  { v:'ongoing',         label:'En curso' },
  { v:'paralizada',      label:'Standby' },
  { v:'en_negociacion',  label:'En negociación' },
  { v:'cerrada_perdida', label:'Perdida' },
  { v:'descartada',      label:'Descartada' },
]
const ESTADO_LABEL = {
  ongoing:           'En curso',
  potencial:         'Potencial',
  paralizada:        'Standby',
  en_negociacion:    'En negociación',
  descartada:        'Descartada',
  cerrada_concedido: 'Cerrada por Savills',
  cerrada_perdida:   'Perdida',
}

// Paleta visual por estado · usada en header, badge de estado grande y lista
const ESTADO_COLOR = {
  ongoing:           { tag:'tag-green',  headerCol:'var(--green)',  bg:'#dcfce7', bd:'#86efac', text:'#15803d', icon:'●' },
  potencial:         { tag:'tag-blue',   headerCol:'var(--accent)', bg:'#f5efe5', bd:'#93c5fd', text:'#6f5734', icon:'' },
  paralizada:        { tag:'tag-amber',  headerCol:'var(--amber)',  bg:'#fef3c7', bd:'#fcd34d', text:'#92400e', icon:'⏸' },
  en_negociacion:    { tag:'tag-purple', headerCol:'var(--purple)', bg:'#f3e8ff', bd:'#d8b4fe', text:'#6b21a8', icon:'' },
  descartada:        { tag:'tag-red',    headerCol:'#dc2626',       bg:'#fee2e2', bd:'#fca5a5', text:'#991b1b', icon:'✕' },
  cerrada_concedido: { tag:'tag-green',  headerCol:'var(--green)',  bg:'#dcfce7', bd:'#86efac', text:'#15803d', icon:'' },
  cerrada_perdida:   { tag:'tag-red',    headerCol:'#dc2626',       bg:'#fee2e2', bd:'#fca5a5', text:'#991b1b', icon:'✕' },
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
  const [showNegociacionModal, setShowNegociacionModal] = useState(false)
  const [oportunidad, setOportunidad] = useState(null)
  // Negociación vinculada a esta demanda (si existe en BD)
  const [negociacionVinculada, setNegociacionVinculada] = useState(null)
  // Vista 360 · alternativas (oferta_demanda con joins a ofertas + activos)
  const [alternativas, setAlternativas] = useState([])
  const [showMatching, setShowMatching] = useState(false)
  const [visitaModal, setVisitaModal] = useState(null)   // { altId, fecha }
  const [descarteModal, setDescarteModal] = useState(null) // { altId, motivo }
  const [ultimaSeleccion, setUltimaSeleccion] = useState(null) // última selección/microsite
  const [enviarModal, setEnviarModal] = useState(null)         // { sel, selected:[emails], search }
  const [savedFlash, setSavedFlash] = useState(false)          // feedback "✓ Guardado" en acciones auto-guardadas
  const markSaved = () => { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1800) }
  const [historialSel, setHistorialSel] = useState([])         // historial de búsquedas/selecciones
  const [loadingAlt, setLoadingAlt] = useState(false)
  // Typeahead de búsqueda de Mandato para vincular
  const [mandatoSearch, setMandatoSearch] = useState('')
  const [mandatoResults, setMandatoResults] = useState([])
  const [showMandatoDD, setShowMandatoDD] = useState(false)
  // Typeahead Oferta · vincular una oferta concreta a la demanda
  const [ofertaSearch, setOfertaSearch] = useState('')
  const [ofertaResults, setOfertaResults] = useState([])
  const [showOfertaDD, setShowOfertaDD] = useState(false)
  // Typeahead Instrucción · texto libre con sugerencias mock (master Dynamics)
  const [instSearch, setInstSearch] = useState('')
  const [showInstDD, setShowInstDD] = useState(false)
  // Equipo/Colaboradores · estado del formulario inline para añadir
  // section = 'equipo' | 'colab' | null. Compartimos UI compacta.
  const [addEqSection, setAddEqSection] = useState(null)
  const [addEqDraft, setAddEqDraft] = useState({ equipo:'', miembro:'', rol:'Soporte' })
  // Zonas · cascada Eje (área) → Área (zona) → Subzona usando ZONES del pitch
  const [zonaCity, setZonaCity] = useState('Madrid')
  const [zonaDraft, setZonaDraft] = useState({ eje:'', area:'', subzona:'' })

  const [form, setForm] = useState({
    nombre:'', estatus:'', notas:'', motivo_descarte:'',
    standby_proxima_llamada:'', standby_notas:'',
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
      id, ref, nombre, estatus, notas, motivo_descarte, standby_proxima_llamada, standby_notas, requisitos, otros_contactos, equipo_trabajo, documentos,
      dynamics_account_id, dynamics_opportunity_id, mandato_id, oferta_id, instruccion_ref, created_at, updated_at,
      dynamics_accounts:dynamics_account_id ( dynamics_id, nombre, tipo, sector, direccion, codigo_postal, ciudad, pais, telefono, web ),
      dynamics_opportunities:dynamics_opportunity_id ( dynamics_id, nombre, tipo ),
      mandato:mandato_id ( id, ref, titulo, tipo ),
      oferta:oferta_id ( id, ref, tipo_operacion, estado, activos:activo_id ( id, ref, nombre, ciudad, uso ) )
    `
    // Si una columna nueva aún no existe, reintenta sin ella para no romper la
    // ficha entera (migración 031 = documentos, 036 = oferta_id/instruccion_ref).
    const buildFallback = (full, missing) =>
      missing.reduce((q, col) => {
        if (col === 'oferta_id') {
          return q
            .replace(', oferta_id', '')
            .replace(/,\s*oferta:oferta_id[^)]+\)\s*\)/, '')
        }
        return q.replace(new RegExp(`,\\s*${col}`, 'g'), '')
      }, full)
    const SELECT_FALLBACK = buildFallback(SELECT_FULL, ['documentos'])

    let { data, error } = await supabase.from('demandas').select(SELECT_FULL).eq('ref', refOrId).maybeSingle()
    // Migración 036 aún no aplicada → reintenta sin oferta_id/instruccion_ref.
    // Detectamos el caso por columna ausente o por relación FK que PostgREST
    // no encuentra en su schema cache.
    const looksLikeMissing036 = error && (
      /oferta_id|instruccion_ref/i.test(error.message || '') ||
      /oferta_id|instruccion_ref/i.test(error.details || '') ||
      /oferta_id|instruccion_ref/i.test(error.hint || '')
    )
    if (looksLikeMissing036) {
      const q2 = SELECT_FULL
        .replace(', oferta_id, instruccion_ref', '')
        // El join 'oferta:oferta_id (...)' anida 'activos:activo_id (...)' → 2 niveles
        .replace(/,\s*oferta:oferta_id\s*\([^)]+\)\s*\)/, '')
      const r = await supabase.from('demandas').select(q2).eq('ref', refOrId).maybeSingle()
      data = r.data; error = r.error
      if (data) { data.oferta_id = null; data.instruccion_ref = null; data.oferta = null }
    }
    if (error && /documentos/i.test(error.message)) {
      // Reintenta sin la columna documentos
      const r = await supabase.from('demandas').select(SELECT_FALLBACK).eq('ref', refOrId).maybeSingle()
      data = r.data; error = r.error
      if (data) data.documentos = []
    }
    if (error && /standby_proxima_llamada|standby_notas/i.test((error.message || '') + (error.details || ''))) {
      // Migración 038 no aplicada todavía → reintenta sin esos campos
      const q3 = SELECT_FULL.replace(', standby_proxima_llamada, standby_notas', '')
      const r = await supabase.from('demandas').select(q3).eq('ref', refOrId).maybeSingle()
      data = r.data; error = r.error
      if (data) { data.standby_proxima_llamada = null; data.standby_notas = null }
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

    // Negociación vinculada (si existe) · permite que la card de Negociación
    // abra directamente la ficha de la NEG en lugar de la lista.
    if (data?.id) {
      const { data: neg } = await supabase
        .from('negociaciones')
        .select('id, ref, estado, ronda, fecha_inicio')
        .eq('demanda_id', data.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setNegociacionVinculada(neg || null)
    } else {
      setNegociacionVinculada(null)
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

  // Última selección de alternativas (microsite) de esta demanda — para la
  // caja con el enlace en Información general.
  useEffect(() => {
    if (!demanda?.id) { setUltimaSeleccion(null); setHistorialSel([]); return }
    let cancel = false
    supabase.from('selecciones')
      .select('id, token, nombre, estado, created_at, enviada_at, vistas, ultima_vista, seleccion_ofertas(oferta_id, activo_id)')
      .eq('demanda_id', demanda.id)
      .order('created_at', { ascending:false })
      .then(({ data }) => { if (cancel) return; const list = data || []; setHistorialSel(list); setUltimaSeleccion(list[0] || null) })
    return () => { cancel = true }
  }, [demanda?.id, alternativas])

  // Busca mandatos al escribir en el typeahead · prioriza misma cuenta y tipo buy
  useEffect(() => {
    if (!showMandatoDD) return
    const q = mandatoSearch.trim()
    if (q.length < 1 && !demanda?.dynamics_account_id) { setMandatoResults([]); return }
    let cancel = false
    ;(async () => {
      let query = supabase
        .from('mandatos')
        .select('id, ref, titulo, tipo, via, estado, dynamics_account_id, fecha_firma')
        .order('fecha_firma', { ascending:false })
        .limit(12)
      // Busca por ref O por título (más fácil de localizar)
      if (q.length >= 1) {
        query = query.or(`ref.ilike.%${q.toUpperCase()}%,titulo.ilike.%${q}%`)
      }
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
    await load(); markSaved()
  }

  const desvincularMandato = async () => {
    if (!window.confirm('¿Desvincular el mandato de esta demanda? La demanda volverá a estar sin mandato.')) return
    const { error } = await supabase.from('demandas')
      .update({ mandato_id: null, updated_at: new Date().toISOString() })
      .eq('id', demanda.id)
    if (error) { setSaveError(error.message); return }
    await load()
  }

  // ── Búsqueda de ofertas para vincular a la demanda ──
  useEffect(() => {
    if (!showOfertaDD) return
    const q = ofertaSearch.trim()
    let cancel = false
    ;(async () => {
      let query = supabase
        .from('ofertas')
        .select('id, ref, tipo_operacion, estado, activos:activo_id ( id, ref, nombre, ciudad )')
        .order('updated_at', { ascending:false })
        .limit(12)
      if (q.length >= 1) query = query.ilike('ref', `%${q.toUpperCase()}%`)
      const { data } = await query
      if (!cancel) setOfertaResults(data || [])
    })()
    return () => { cancel = true }
  }, [ofertaSearch, showOfertaDD])

  const vincularOferta = async (ofertaId) => {
    const { error } = await supabase.from('demandas')
      .update({ oferta_id: ofertaId, updated_at: new Date().toISOString() })
      .eq('id', demanda.id)
    if (error) { setSaveError(error.message); return }
    setOfertaSearch(''); setShowOfertaDD(false); setOfertaResults([])
    await load(); markSaved()
  }
  const desvincularOferta = async () => {
    if (!window.confirm('¿Desvincular la oferta de esta demanda?')) return
    const { error } = await supabase.from('demandas')
      .update({ oferta_id: null, updated_at: new Date().toISOString() })
      .eq('id', demanda.id)
    if (error) { setSaveError(error.message); return }
    await load()
  }

  const vincularInstruccion = async (ref) => {
    if (!ref) return
    const { error } = await supabase.from('demandas')
      .update({ instruccion_ref: ref, updated_at: new Date().toISOString() })
      .eq('id', demanda.id)
    if (error) { setSaveError(error.message); return }
    setInstSearch(''); setShowInstDD(false)
    await load()
  }
  const desvincularInstruccion = async () => {
    if (!window.confirm('¿Desvincular la instrucción de esta demanda?')) return
    const { error } = await supabase.from('demandas')
      .update({ instruccion_ref: null, updated_at: new Date().toISOString() })
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

  // Mover alternativa entre columnas del kanban (drag&drop). Guarda hitos en
  // condiciones_negociadas (visited/fecha_visita/negotiated) para poder pintar
  // el rastro: una card sigue (en gris) en las columnas por las que pasó.
  const moverAlternativa = async (altId, destino) => {
    // Visita y descarte abren su propio modal (calendario / motivo).
    if (destino === 'visitadas') {
      const a = alternativas.find(x => x.id === altId)
      const prev = a?.condiciones_negociadas?.fecha_visita
      const today = new Date().toISOString().slice(0, 10)
      // Por defecto hoy (formato válido yyyy-mm-dd) para que el botón esté activo
      // y se vea valor aunque el calendario nativo no se abra al primer clic.
      setVisitaModal({ altId, fecha: /^\d{4}-\d{2}-\d{2}$/.test(prev || '') ? prev : today })
      return
    }
    if (destino === 'descartar') { setDescarteModal({ altId, motivo: '' }); return }
    const alt = alternativas.find(a => a.id === altId)
    if (!alt) return
    const cond = { ...(alt.condiciones_negociadas || {}) }
    let estado
    // Mover hacia atrás limpia los hitos de fases posteriores (la card sale de
    // esas columnas). Hacia delante añade el hito correspondiente.
    if (destino === 'presentadas') { estado = 'enviada'; delete cond.visited; delete cond.fecha_visita; delete cond.finalista; delete cond.negotiated }
    else if (destino === 'finalistas') { estado = 'finalista'; cond.finalista = true; delete cond.negotiated }
    else if (destino === 'negociando') { estado = 'negociando'; cond.negotiated = true }
    else return
    const { error } = await supabase.from('oferta_demanda')
      .update({ estado_alternativa: estado, condiciones_negociadas: cond, updated_at: new Date().toISOString() })
      .eq('id', altId)
    if (error) { setSaveError(error.message); return }
    // Cascada al abrir negociación.
    if (destino === 'negociando' && demanda?.id) {
      // (1) Demanda: estatus + vincular la oferta a la "card de Oferta" del info general.
      const upd = { estatus: 'en_negociacion', updated_at: new Date().toISOString() }
      if (alt.ofertas?.id) upd.oferta_id = alt.ofertas.id
      await supabase.from('demandas').update(upd).eq('id', demanda.id)
      // (2) Oferta: estado "En negociación" (visible arriba en su ficha).
      if (alt.ofertas?.id) await supabase.from('ofertas').update({ estado: 'En negociación' }).eq('id', alt.ofertas.id)
      // (3) Crear la negociación si no existe → aparece en el módulo de Negociaciones.
      if (alt.ofertas?.id) {
        const { data: ex } = await supabase.from('negociaciones').select('id').eq('oferta_demanda_id', alt.id).maybeSingle()
        if (!ex) {
          const { nextRef } = await import('../lib/nextRef')
          const ref = await nextRef('negociaciones', 'NEG')
          const today = new Date().toISOString().slice(0, 10)
          await supabase.from('negociaciones').insert({
            ref, estado: 'En negociación', ronda: 1, fecha_inicio: today, ultima_actividad: today,
            demanda_id: demanda.id, oferta_id: alt.ofertas.id, activo_id: alt.activos?.id || null,
            oferta_demanda_id: alt.id,
            cuenta_inquilina_id: demanda.dynamics_account_id || null,
            parte_nombre: CURRENT_USER.nombre, parte_equipo: CURRENT_USER.equipo || 'Equipo PDB',
            contraparte_empresa: cuenta?.nombre || null, contraparte_email: cuenta?.email || null, contraparte_telefono: cuenta?.telefono || null,
          })
        }
      }
      await load()
    }
    await loadAlternativas()
  }

  // Confirmar visita desde el modal de calendario.
  const confirmVisita = async () => {
    if (!visitaModal) return
    const { altId, fecha } = visitaModal
    const alt = alternativas.find(a => a.id === altId)
    const cond = { ...(alt?.condiciones_negociadas || {}), visited: true, fecha_visita: fecha || null }
    delete cond.finalista; delete cond.negotiated   // visitar = volver a fase visitadas
    const { error } = await supabase.from('oferta_demanda')
      .update({ estado_alternativa: 'visita_realizada', condiciones_negociadas: cond, updated_at: new Date().toISOString() })
      .eq('id', altId)
    setVisitaModal(null)
    if (error) { setSaveError(error.message); return }
    await loadAlternativas()
  }

  // Confirmar descarte (con motivo) desde el modal.
  const confirmDescarte = async () => {
    if (!descarteModal) return
    const { altId, motivo } = descarteModal
    const alt = alternativas.find(a => a.id === altId)
    const cond = { ...(alt?.condiciones_negociadas || {}), motivo_descarte: motivo || null }
    const { error } = await supabase.from('oferta_demanda')
      .update({ estado_alternativa: 'descartada', condiciones_negociadas: cond, updated_at: new Date().toISOString() })
      .eq('id', altId)
    setDescarteModal(null)
    if (error) { setSaveError(error.message); return }
    await loadAlternativas()
  }

  // Enviar al cliente la última selección: marca estado 'enviada' (trazabilidad)
  // y abre el correo con el enlace de la microsite.
  // Abre el modal de envío con la parte involucrada preseleccionada.
  const enviarSeleccion = (sel) => {
    if (!sel?.id) return
    const involucrados = (otrosListaFull || []).filter(c => c?.email).map(c => c.email)
    const fallback = involucrados.length ? [] : (contactosCuenta || []).filter(c => c?.email).slice(0, 1).map(c => c.email)
    setEnviarModal({ sel, selected: [...new Set([...involucrados, ...fallback])], search: '' })
  }

  // Confirma el envío: abre el correo a los destinatarios y marca enviada.
  const confirmEnviar = async () => {
    if (!enviarModal) return
    const { sel, selected } = enviarModal
    await supabase.from('selecciones').update({ estado:'enviada', enviada_at:new Date().toISOString() }).eq('id', sel.id)
    setUltimaSeleccion(s => s ? { ...s, estado:'enviada' } : s)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const to = (selected || []).filter(Boolean).map(encodeURIComponent).join(',')
    window.open(`mailto:${to}?subject=${encodeURIComponent('Selección de inmuebles · ' + (demanda?.nombre || ''))}&body=${encodeURIComponent('Le compartimos una selección de inmuebles:\n\n' + origin + '/m/' + sel.token)}`)
    setEnviarModal(null)
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
      standby_proxima_llamada: demanda.standby_proxima_llamada || '',
      standby_notas:          demanda.standby_notas || '',
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
      return false
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
      // Recordatorio Standby (solo se persiste si estatus='paralizada')
      standby_proxima_llamada: form.estatus === 'paralizada' ? (form.standby_proxima_llamada || null) : null,
      standby_notas:           form.estatus === 'paralizada' ? (form.standby_notas?.trim() || null) : null,
      requisitos: Object.keys(requisitos).length ? requisitos : null,
      otros_contactos: form.otros_contactos.length ? form.otros_contactos : null,
      updated_at: new Date().toISOString(),
    }
    let { error } = await supabase.from('demandas').update(payload).eq('id', demanda.id)
    if (error && /standby_proxima_llamada|standby_notas/i.test(error.message || '')) {
      // Migración 038 todavía no aplicada → guarda sin los campos de standby
      const { standby_proxima_llamada, standby_notas, ...rest } = payload  // eslint-disable-line no-unused-vars
      const retry = await supabase.from('demandas').update(rest).eq('id', demanda.id)
      error = retry.error
    }
    setSaving(false)
    if (error) { setSaveError(error.message); return false }
    setEditing(false)  // tras guardar OK, vuelve a modo vista
    await load()
    return true
  }

  // Guard de cambios sin guardar: si estás en modo edición, avisa al navegar.
  useUnsavedGuard({ isDirty: () => editing, onSave: saveEdit })

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
      {savedFlash && (
        <div style={{ position:'fixed', bottom:20, right:20, zIndex:3000, background:'#15803d', color:'#fff', padding:'10px 16px', borderRadius:8, fontSize:13, fontWeight:700, boxShadow:'0 6px 20px rgba(0,0,0,0.2)' }}>
          ✓ Guardado
        </div>
      )}

      {showMatching && demanda && (
        <MatchingOfertasModal
          demanda={demanda}
          yaAnadidas={alternativas}
          onClose={() => setShowMatching(false)}
          onAdded={loadAlternativas}
        />
      )}

      {/* Modal · enviar selección al cliente (elige destinatarios) */}
      {enviarModal && (() => {
        const involucrados = (otrosListaFull || []).filter(c => c?.email)
        const q = (enviarModal.search || '').toLowerCase().trim()
        const disponibles = (contactosCuenta || []).filter(c => c?.email
          && !enviarModal.selected.includes(c.email)
          && !involucrados.some(i => i.email === c.email)
          && (!q || (c.nombre || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)))
        const toggle = (email) => setEnviarModal(m => ({ ...m, selected: m.selected.includes(email) ? m.selected.filter(e => e !== email) : [...m.selected, email] }))
        const addContact = (c) => setEnviarModal(m => ({ ...m, selected: [...new Set([...m.selected, c.email])], search: '' }))
        const extras = enviarModal.selected.filter(e => !involucrados.some(c => c.email === e))
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={() => setEnviarModal(null)}>
            <div style={{ background:'#fff', borderRadius:10, width:'min(480px,100%)', maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 50px rgba(15,23,42,0.25)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid #e5e7eb', fontSize:14, fontWeight:700 }}>Enviar selección al cliente</div>
              <div style={{ padding:'16px 18px', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>

                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>Parte involucrada</div>
                  {involucrados.length === 0
                    ? <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>No hay parte involucrada asignada. Añade contactos de la cuenta abajo.</div>
                    : involucrados.map(c => (
                      <label key={c.dynamics_id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', cursor:'pointer' }}>
                        <input type="checkbox" checked={enviarModal.selected.includes(c.email)} onChange={() => toggle(c.email)} style={{ accentColor:'var(--accent)' }} />
                        <span style={{ fontSize:12, fontWeight:600 }}>{c.nombre}</span>
                        <span style={{ fontSize:11, color:'var(--text3)' }}>{c.email}</span>
                      </label>
                    ))}
                </div>

                {extras.length > 0 && (
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>Otros destinatarios</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {extras.map(email => (
                        <span key={email} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, background:'var(--accent-lt)', color:'var(--accent)', border:'1px solid var(--accent-bd)', borderRadius:14, padding:'3px 9px' }}>
                          {email}
                          <button onClick={() => toggle(email)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent)', fontSize:12, padding:0, lineHeight:1 }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>Añadir contactos de la cuenta</div>
                  <input value={enviarModal.search} onChange={e => setEnviarModal(m => ({ ...m, search: e.target.value }))}
                    placeholder="Buscar contacto por nombre o email…"
                    style={{ width:'100%', padding:'8px 10px', fontSize:12, border:'1px solid #e5e7eb', borderRadius:6, fontFamily:'inherit', boxSizing:'border-box' }} />
                  {q && (
                    <div style={{ marginTop:6, border:'1px solid #e5e7eb', borderRadius:6, maxHeight:160, overflowY:'auto' }}>
                      {disponibles.length === 0
                        ? <div style={{ padding:'8px 10px', fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin contactos que coincidan.</div>
                        : disponibles.map(c => (
                          <div key={c.dynamics_id} onClick={() => addContact(c)}
                            style={{ padding:'7px 10px', cursor:'pointer', borderBottom:'1px solid #f1f5f9', fontSize:12 }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}>
                            <span style={{ fontWeight:600 }}>{c.nombre}</span> <span style={{ color:'var(--text3)' }}>· {c.email}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'12px 18px', borderTop:'1px solid #e5e7eb', background:'#f8fafc' }}>
                <button onClick={() => setEnviarModal(null)} style={{ padding:'8px 14px', fontSize:12, border:'1px solid #cbd5e1', borderRadius:6, background:'#fff', cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
                <button onClick={confirmEnviar} disabled={!enviarModal.selected.length}
                  style={{ padding:'8px 16px', fontSize:12, fontWeight:700, border:'none', borderRadius:6, background:'var(--accent)', color:'#fff', cursor: enviarModal.selected.length ? 'pointer' : 'not-allowed', opacity: enviarModal.selected.length ? 1 : 0.5, fontFamily:'inherit' }}>✉ Enviar a {enviarModal.selected.length}</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal · fecha de visita (calendario) */}
      {visitaModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setVisitaModal(null)}>
          <div style={{ background:'#fff', borderRadius:10, width:'min(380px,92vw)', boxShadow:'0 20px 50px rgba(15,23,42,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:700 }}>¿Cuándo se visitó?</div>
            <div style={{ padding:'16px 18px' }}>
              <input type="date" value={visitaModal.fecha || ''} onChange={e => setVisitaModal(v => ({ ...v, fecha: e.target.value }))} autoFocus
                style={{ width:'100%', padding:'9px 10px', fontSize:13, border:'1px solid var(--border)', borderRadius:6, fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'12px 18px', borderTop:'1px solid var(--border)', background:'var(--gray-lt)' }}>
              <button onClick={() => setVisitaModal(null)} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'#fff', cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
              <button onClick={confirmVisita} disabled={!visitaModal.fecha} style={{ padding:'8px 16px', fontSize:12, fontWeight:600, border:'none', borderRadius:6, background:'var(--accent)', color:'#fff', cursor: visitaModal.fecha ? 'pointer' : 'not-allowed', opacity: visitaModal.fecha ? 1 : 0.5, fontFamily:'inherit' }}>Registrar visita</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal · motivo de descarte */}
      {descarteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setDescarteModal(null)}>
          <div style={{ background:'#fff', borderRadius:10, width:'min(440px,92vw)', boxShadow:'0 20px 50px rgba(15,23,42,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:700 }}>Motivo de descarte</div>
            <div style={{ padding:'16px 18px' }}>
              <textarea value={descarteModal.motivo} onChange={e => setDescarteModal(v => ({ ...v, motivo: e.target.value }))} autoFocus
                placeholder="Ej. fuera de presupuesto, no encaja la zona, el cliente lo descartó…"
                style={{ width:'100%', minHeight:80, padding:'9px 10px', fontSize:13, border:'1px solid var(--border)', borderRadius:6, fontFamily:'inherit', boxSizing:'border-box', resize:'vertical' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'12px 18px', borderTop:'1px solid var(--border)', background:'var(--gray-lt)' }}>
              <button onClick={() => setDescarteModal(null)} style={{ padding:'8px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'#fff', cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
              <button onClick={confirmDescarte} style={{ padding:'8px 16px', fontSize:12, fontWeight:600, border:'none', borderRadius:6, background:'var(--red)', color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>Descartar</button>
            </div>
          </div>
        </div>
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

      {showNegociacionModal && (
        <IniciarNegociacionModal
          demanda={demanda}
          onClose={() => setShowNegociacionModal(false)}
          onSuccess={() => { setShowNegociacionModal(false); load() }}
        />
      )}

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
                const colorMap = { ongoing:'green', potencial:'blue', paralizada:'amber', en_negociacion:'purple', descartada:'red', cerrada_concedido:'green', cerrada_perdida:'red' }
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

          {/* TAB: Información general — formato cards uniformes (Mandato/Propuesta).
              Incluye también los Requisitos y la Zona de búsqueda (antes eran un tab
              separado, ahora viven aquí abajo). */}
          {tab === 'dem-info' && (() => {
            const equipo = Array.isArray(demanda.equipo_trabajo) ? demanda.equipo_trabajo : []
            const userIsPrincipal = isPrincipal(equipo, CURRENT_USER.nombre)
            const canManage = userIsPrincipal || equipo.length === 0
            const handlers = makeEquipoHandlers({
              supabase, table:'demandas', idValue:demanda.id, equipo,
              onAfter: () => load(),
              onError: (msg) => setSaveError(msg),
            })

            // Helpers Requisitos (movidos desde el antiguo tab dem-req)
            const ReqField = ({ label, required, accent, children }) => (
              <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color: accent || 'var(--text)', textTransform:'uppercase', letterSpacing:'.03em' }}>
                  {label} {required && <span style={{ color:'#dc2626' }}>*</span>}
                </div>
                {children}
              </div>
            )
            const canExport = !!form.uso_principal && (!!form.sup_min || !!form.sup_max)

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
                  const hasOferta      = !!(demanda.oferta_id && demanda.oferta)
                  const hasInstruccion = !!demanda.instruccion_ref
                  const enNegociacion  = form.estatus === 'en_negociacion'
                  const yaGanada       = form.estatus === 'cerrada_concedido'
                  const yaDescartada   = form.estatus === 'descartada'
                  const yaPerdida      = form.estatus === 'cerrada_perdida'
                  const cerrada        = yaGanada || yaDescartada || yaPerdida

                  // Buscador inline reutilizable para cards 'current'
                  const ddPanel = (children) => (
                    <div style={{ position:'absolute', top:'calc(100% + 2px)', left:0, right:0, zIndex:30, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, maxHeight:240, overflowY:'auto', boxShadow:'0 6px 20px rgba(0,0,0,0.12)' }}>
                      {children}
                    </div>
                  )

                  // Estado de la demanda — bloque visual + dropdown + motivo
                  const ec = ESTADO_COLOR[form.estatus] || ESTADO_COLOR.ongoing
                  const motivoEsPredef = MOTIVOS_DESCARTE_DEMANDA.includes(form.motivo_descarte)
                  const motivoEsOtro   = !!form.motivo_descarte && !motivoEsPredef
                  const motivoSelV     = motivoEsOtro ? 'Otro motivo' : (form.motivo_descarte || '')
                  const motivoOtroTxt  = motivoEsOtro ? form.motivo_descarte : ''
                  const requiereMotivo = yaDescartada || yaPerdida
                  const sinMotivo      = requiereMotivo && !(form.motivo_descarte || '').trim()

                  const estadoExtra = (
                    <div onClick={e => e.stopPropagation()} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {/* Badge grande con el estado actual */}
                      <div style={{ padding:'10px 12px', background: ec.bg, border:`2px solid ${ec.bd}`, borderRadius:8, display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ fontSize:20, lineHeight:1, color: ec.text }}>{ec.icon}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:9, fontWeight:700, color: ec.text, opacity:.75, textTransform:'uppercase', letterSpacing:'.04em' }}>Estado actual</div>
                          <div style={{ fontSize:14, fontWeight:800, color: ec.text, lineHeight:1.2 }}>{ESTADO_LABEL[form.estatus] || form.estatus || '—'}</div>
                        </div>
                      </div>

                      {/* Dropdown de cambio · oculto si la demanda ya está cerrada por Savills */}
                      {!yaGanada && (
                        <div>
                          <div className="rp-lbl" style={{ marginBottom:4 }}>Cambiar estado</div>
                          <select
                            className="fsel"
                            value={ESTADO_OPTS.some(o => o.v === form.estatus) ? form.estatus : 'ongoing'}
                            onChange={e => {
                              const next = e.target.value
                              // Pasar a 'En negociación' → confirmación + cascada
                              // (crea NEG-XXXX y sincroniza cuenta/oportunidad/mandato/oferta).
                              // Solo dispara cuando la demanda NO está ya en negociación.
                              if (next === 'en_negociacion' && form.estatus !== 'en_negociacion') {
                                setShowNegociacionModal(true)
                                return
                              }
                              setF('estatus', next)
                            }}
                            style={{ width:'100%' }}>
                            {ESTADO_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        </div>
                      )}

                      {/* Standby · recordatorio + notas conversación cliente */}
                      {form.estatus === 'paralizada' && (
                        <div style={{ marginTop:2, padding:'12px 14px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#92400e', marginBottom:8, letterSpacing:'-0.01em' }}>
                            Recordatorio
                          </div>
                          <div style={{ marginBottom:10 }}>
                            <label style={{ fontSize:11, fontWeight:500, color:'#78350f', display:'block', marginBottom:4 }}>
                              Próxima llamada
                            </label>
                            <input
                              type="date"
                              className="kf-inp"
                              value={form.standby_proxima_llamada || ''}
                              onChange={e => setF('standby_proxima_llamada', e.target.value)}
                              style={{ width:'100%', padding:'7px 9px', fontSize:13, border:'1px solid #fcd34d', borderRadius:8, background:'#fff', fontFamily:'inherit' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize:11, fontWeight:500, color:'#78350f', display:'block', marginBottom:4 }}>
                              Última conversación con el cliente
                            </label>
                            <textarea
                              value={form.standby_notas || ''}
                              onChange={e => setF('standby_notas', e.target.value)}
                              placeholder="Qué se ha hablado, motivo del standby, próximos pasos…"
                              rows={3}
                              style={{ width:'100%', padding:'8px 10px', fontSize:13, border:'1px solid #fcd34d', borderRadius:8, background:'#fff', fontFamily:'inherit', resize:'vertical', lineHeight:1.5, letterSpacing:'-0.005em' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Motivo · obligatorio si descartada/perdida */}
                      {(requiereMotivo || demanda.motivo_descarte) && (
                        <div>
                          <div className="rp-lbl" style={{ marginTop:2, marginBottom:4, color: requiereMotivo ? '#dc2626' : undefined }}>
                            Motivo {requiereMotivo && <span style={{ color:'#dc2626' }}>*</span>}
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
                              placeholder="Describe brevemente el motivo..."
                            />
                          )}
                        </div>
                      )}

                    </div>
                  )

                  // Mandato extra body · buscador inline cuando no hay
                  const mandatoExtra = !hasMandato && !cerrada ? (
                    <div onClick={e => e.stopPropagation()} style={{ position:'relative', marginTop:4 }}>
                      <input
                        className="kf-inp"
                        value={mandatoSearch}
                        onChange={e => { setMandatoSearch(e.target.value); setShowMandatoDD(true) }}
                        onFocus={() => setShowMandatoDD(true)}
                        onBlur={() => setTimeout(() => setShowMandatoDD(false), 200)}
                        placeholder="🔍 Buscar por título o ref (MAN-...)"
                        style={{ width:'100%', fontFamily:'var(--mono)', fontSize:11, padding:'6px 8px' }}
                      />
                      {showMandatoDD && mandatoResults.length > 0 && ddPanel(
                        mandatoResults.map(m => {
                          const mismaCuenta = m.dynamics_account_id === demanda.dynamics_account_id
                          return (
                            <div key={m.id} onMouseDown={() => vincularMandato(m.id)}
                              style={{ padding:'8px 10px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:11 }}>
                              <div style={{ fontWeight:600, color:'var(--text)' }}>
                                {m.titulo || <span style={{ color:'var(--text4)', fontStyle:'italic' }}>(sin título)</span>}
                              </div>
                              <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', marginTop:2 }}>{m.ref}</div>
                              <div style={{ fontSize:9, color:'var(--text4)', marginTop:3, display:'flex', gap:5, alignItems:'center' }}>
                                <span className={`tag ${m.tipo === 'buy' ? 'tag-blue' : 'tag-amber'}`} style={{ fontSize:8 }}>{m.tipo}</span>
                                {mismaCuenta && <span className="tag tag-green" style={{ fontSize:8 }}>✓ misma cuenta</span>}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  ) : null

                  // Oferta extra body · buscador inline cuando no hay
                  const ofertaActiva = demanda.oferta
                  const ofertaExtra = !hasOferta && !cerrada ? (
                    <div onClick={e => e.stopPropagation()} style={{ position:'relative', marginTop:4 }}>
                      <input
                        className="kf-inp"
                        value={ofertaSearch}
                        onChange={e => { setOfertaSearch(e.target.value); setShowOfertaDD(true) }}
                        onFocus={() => setShowOfertaDD(true)}
                        onBlur={() => setTimeout(() => setShowOfertaDD(false), 200)}
                        placeholder="🔍 Vincular oferta (OFE-...)"
                        style={{ width:'100%', fontFamily:'var(--mono)', fontSize:11, padding:'6px 8px' }}
                      />
                      {showOfertaDD && ofertaResults.length > 0 && ddPanel(
                        ofertaResults.map(o => (
                          <div key={o.id} onMouseDown={() => vincularOferta(o.id)}
                            style={{ padding:'7px 10px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:11 }}>
                            <div style={{ fontWeight:600, fontFamily:'var(--mono)' }}>{o.ref}</div>
                            <div style={{ fontSize:9, color:'var(--text4)' }}>
                              {o.activos?.nombre || '—'} · {o.tipo_operacion || ''} · {o.estado || ''}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null

                  // Instrucción extra body · buscador (texto libre, ref Dynamics)
                  const instExtra = !hasInstruccion && enNegociacion ? (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop:4 }}>
                      <input
                        className="kf-inp"
                        value={instSearch}
                        onChange={e => setInstSearch(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') vincularInstruccion(instSearch.trim().toUpperCase()) }}
                        placeholder="🔍 Vincular instrucción (INS-...) y Enter"
                        style={{ width:'100%', fontFamily:'var(--mono)', fontSize:11, padding:'6px 8px' }}
                      />
                      <div style={{ fontSize:9, color:'var(--text4)', marginTop:3 }}>Master Dynamics · escribe la referencia exacta y pulsa Enter</div>
                    </div>
                  ) : null

                  // Sub para card Oferta done
                  const ofertaSub = hasOferta
                    ? `${ofertaActiva.activos?.nombre || ''} · ${ofertaActiva.tipo_operacion || ''}`.replace(/^ ·\s*/, '').replace(/\s*·\s*$/, '')
                    : 'Cuando empieces la negociación, vincula aquí la oferta concreta.'

                  // Card final · cuando la demanda se cierra (ganada/descartada/perdida)
                  const finalCard = (() => {
                    if (yaGanada) {
                      return {
                        key:'cerrada-savills', icon: Trophy, tone:'green', label:'Cerrada por Savills',
                        value:'✓ Operación cerrada con éxito',
                        sub: hasOferta ? `Oferta firmada: ${ofertaActiva.ref}` : 'Operación cerrada.',
                        status:'done',
                        openAction: hasOferta
                          ? { label:'Ver resumen', onClick: () => navigate('ficha-negociacion', { ref: ofertaActiva.ref }) }
                          : { label:'Ver negociación', onClick: () => navigate('negociaciones', { demanda: demanda.ref }) },
                      }
                    }
                    if (yaDescartada) {
                      return {
                        key:'descartada', icon: XClose, tone:'red', label:'Descartada',
                        value: demanda.motivo_descarte || 'Descartada',
                        sub:'Descarte registrado. Ver motivo en la card Estado.',
                        status:'done',
                      }
                    }
                    if (yaPerdida) {
                      return {
                        key:'perdida', icon: XClose, tone:'red', label:'Perdida',
                        value: demanda.motivo_descarte || 'Perdida',
                        sub:'Negociación cerrada sin éxito.',
                        status:'done',
                      }
                    }
                    return null
                  })()

                  const steps = [
                    {
                      key:'cuenta', icon: Building2, tone: cardTone('Cuenta'),
                      label:'Cuenta', value: cuenta?.nombre || null,
                      sub: cuenta?.sector || cuenta?.tipo || null,
                      status: hasCuenta ? 'done' : 'current',
                      openAction: hasCuenta ? { label:'Abrir cuenta', onClick: () => navigate('cuentas', { id: cuenta.dynamics_id || cuenta.id }) } : null,
                      dyn: true,
                    },
                    {
                      key:'oportunidad', icon: Target, tone: cardTone('Oportunidad'),
                      label:'Oportunidad', value: oportunidad?.nombre || demanda.dynamics_opportunity_id || null,
                      sub: oportunidad?.tipo || null,
                      status: hasOportunidad ? 'done' : 'locked',
                      openAction: hasOportunidad ? { label:'Abrir oportunidad', onClick: () => navigate('ficha-oportunidad', { id: oportunidad?.dynamics_id || demanda.dynamics_opportunity_id }) } : null,
                      lockedHint:'Sin oportunidad vinculada.',
                      dyn: true,
                    },
                    {
                      key:'mandato', icon: ScrollText, tone: cardTone('Mandato'),
                      label:'Mandato',
                      value: demanda.mandato?.ref || null,
                      // Sub muestra el TÍTULO del mandato (el que se puso al crearlo).
                      // El tipo (consultoría / oficinas) no ayuda a identificarlo.
                      sub: hasMandato
                        ? (demanda.mandato?.titulo || '(sin título)')
                        : 'Opcional · vincula uno existente o pasa sin mandato.',
                      status: hasMandato ? 'done' : cerrada ? 'locked' : 'current',
                      vacant: !hasMandato && !cerrada,  // gris hasta que se vincule
                      openAction: hasMandato ? { label:'Abrir mandato', onClick: () => navigate('ficha-mandato', { ref: demanda.mandato.ref }) } : null,
                      editAction: hasMandato ? { label:'Desvincular', onClick: desvincularMandato } : null,
                      extraBody: mandatoExtra,
                      optional: !hasMandato,
                    },
                    {
                      key:'oferta', icon: Tag, tone: cardTone('Oferta'),
                      label:'Oferta',
                      value: hasOferta ? ofertaActiva.ref : null,
                      sub: ofertaSub,
                      status: hasOferta ? 'done' : cerrada ? 'locked' : 'current',
                      vacant: !hasOferta && !cerrada,  // gris hasta que se vincule
                      openAction: hasOferta ? { label:'Abrir oferta', onClick: () => navigate('ficha-oferta', { ofertaRef: ofertaActiva.ref }) } : null,
                      editAction: hasOferta ? { label:'Desvincular', onClick: desvincularOferta } : null,
                      extraBody: ofertaExtra,
                      optional: !hasOferta && !enNegociacion,
                    },
                    {
                      key:'estado', icon: Briefcase, tone: cardTone('Demanda'),
                      label:'Estado de la demanda',
                      value: null,
                      sub: null,
                      status: 'current',
                      extraBody: estadoExtra,
                    },
                  ]

                  // Card Instrucción — SIEMPRE visible (gris si aún no se ha llegado).
                  steps.push({
                    key:'instruccion', icon: FileSearch, tone: cardTone('Instrucción'),
                    label:'Instrucción',
                    value: demanda.instruccion_ref || null,
                    sub: hasInstruccion ? 'Instrucción de Dynamics vinculada.' : (enNegociacion ? 'Vincula la instrucción para arrancar la negociación.' : null),
                    status: hasInstruccion ? 'done' : (enNegociacion ? 'current' : 'locked'),
                    vacant: !hasInstruccion && enNegociacion,
                    openAction: hasInstruccion ? { label:'Ver instrucciones', onClick: () => navigate('instrucciones', { ref: demanda.instruccion_ref }) } : null,
                    editAction: hasInstruccion ? { label:'Desvincular', onClick: desvincularInstruccion } : null,
                    extraBody: enNegociacion ? instExtra : null,
                    lockedHint:'Se vincula al pasar la demanda a negociación.',
                    dyn: true,
                  })

                  // Card Negociación — SIEMPRE visible (gris hasta que haya negociación).
                  {
                    const negRef = negociacionVinculada?.ref || null
                    const irANegociacion = () => negRef
                      ? navigate('ficha-negociacion', { ref: negRef })
                      : navigate('negociaciones', { demanda: demanda.ref })
                    const negActiva = enNegociacion && !yaGanada && !yaPerdida && !yaDescartada
                    const negCerrada = yaGanada || yaPerdida
                    steps.push({
                      key:'negociacion', icon: MessageSquare, tone: cardTone('Negociación'),
                      label:'Negociación',
                      value: negActiva ? (negRef || 'En curso') : (negCerrada ? (negRef || 'Cerrada') : null),
                      sub: negActiva
                        ? (negRef ? `Negociación ${negRef} · Click para abrir info general.` : (hasOferta ? `Negociando sobre la oferta ${ofertaActiva.ref}.` : 'Negociación activa.'))
                        : null,
                      status: negActiva ? 'current' : (negCerrada ? 'done' : 'locked'),
                      openAction: (negActiva || negCerrada) ? { label:'Abrir negociación', onClick: irANegociacion } : null,
                      action: negActiva ? { label:'Abrir info general de la negociación', onClick: irANegociacion, primary:true } : null,
                      lockedHint:'Se abre al mover una alternativa a "En negociación".',
                    })
                  }

                  // Card Cierre — SIEMPRE visible (gris hasta el cierre).
                  if (finalCard) steps.push(finalCard)
                  else steps.push({
                    key:'cierre', icon: Trophy, tone: cardTone('Demanda'),
                    label:'Cierre', value: null,
                    status:'locked',
                    lockedHint:'Se completa al ganar, perder o descartar la operación.',
                  })

                  return <FunnelStepCards steps={steps} />
                })()}

                {/* ════════════════════════════════════════════════════════════════
                    DASHBOARD INFO · grid 3x2 con cards estilo Apple HIG.
                    Fila 1: Requisitos · Presupuesto · Equipo + Colaboradores + Partes
                    Fila 2: Provincias · Zonas · Detalles geográficos
                    ════════════════════════════════════════════════════════════════ */}

                {/* Heading + Exportar a mapa */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, marginBottom:16, paddingBottom:10, borderBottom:'1px solid #e5e7eb' }}>
                  <div style={{ fontSize:19, fontWeight:700, color:'#0f172a', letterSpacing:'-0.02em' }}>
                    Detalle de la demanda
                  </div>
                  <button
                    onClick={() => navigate('mapas', { from:'demanda', demandaId: demanda.id, id: demanda.ref, nombre: demanda.nombre, uso: demanda.uso_principal, sbaMin: demanda.sup_min, sbaMax: demanda.sup_max, rentaMax: demanda.alq_max })}
                    disabled={!canExport}
                    title={!form.uso_principal ? 'Define al menos el uso principal' : (!form.sup_min && !form.sup_max ? 'Define superficie mínima o máxima' : 'Exportar requisitos al mapa de búsqueda')}
                    style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', border:'none', cursor: canExport ? 'pointer' : 'not-allowed', opacity: canExport ? 1 : 0.45, fontWeight:700, fontSize:13, padding:'10px 20px', borderRadius:9, fontFamily:'inherit', boxShadow: canExport ? '0 2px 10px rgba(37,99,235,.28)' : 'none' }}
                  >
                    <span style={{ fontSize:15 }}>🗺️</span> Exportar a mapa
                  </button>
                </div>

                {/* Caja · enlace de la última selección (microsite) */}
                {ultimaSeleccion && (() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : ''
                  const link = `${origin}/m/${ultimaSeleccion.token}`
                  return (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', marginBottom:14, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, flexWrap:'wrap' }}>
                      <div style={{ flexShrink:0, fontSize:9, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em' }}>
                        Link generado de la selección
                      </div>
                      <div style={{ flex:1, minWidth:160, fontFamily:'var(--mono)', fontSize:11, background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:4, padding:'5px 9px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#475569' }}>{link}</div>
                      <button onClick={() => navigator.clipboard?.writeText(link)} style={{ flexShrink:0, padding:'5px 10px', fontSize:11, fontWeight:600, border:'1px solid #e5e7eb', borderRadius:5, background:'#fff', cursor:'pointer', fontFamily:'inherit' }}>⎘ Copiar</button>
                      <button onClick={() => enviarSeleccion(ultimaSeleccion)} style={{ flexShrink:0, padding:'6px 14px', fontSize:11, fontWeight:700, border:'none', borderRadius:6, background:'var(--accent)', color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>✉ Enviar al cliente</button>
                      <span style={{ flexShrink:0, fontSize:10, color:'var(--text3)' }}>{ultimaSeleccion.vistas || 0} vistas{ultimaSeleccion.ultima_vista ? ` · última ${new Date(ultimaSeleccion.ultima_vista).toLocaleDateString('es-ES')}` : ''}</span>
                    </div>
                  )
                })()}

                {/* ─── DETALLE · todos los cuadros en una sola fila ─── */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12, marginBottom:14, alignItems:'start' }}>

                  {/* === REQUISITOS GENERALES === */}
                  <div className="dash-card">
                    <div className="dash-card-head">Requisitos del activo</div>
                    <div style={{ padding:'12px 16px 16px', display:'flex', flexDirection:'column', gap:11 }}>
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
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <ReqField label="Sup. mín. (m²)">
                          <input type="number" className="kf-inp" value={form.sup_min} onChange={e => setF('sup_min', e.target.value)} placeholder="—" style={{ width:'100%', fontFamily:'var(--mono)', textAlign:'right', fontWeight:600 }} />
                        </ReqField>
                        <ReqField label="Sup. máx. (m²)">
                          <input type="number" className="kf-inp" value={form.sup_max} onChange={e => setF('sup_max', e.target.value)} placeholder="—" style={{ width:'100%', fontFamily:'var(--mono)', textAlign:'right', fontWeight:600 }} />
                        </ReqField>
                      </div>
                    </div>
                  </div>

                  {/* === PRESUPUESTO === */}
                  <div className="dash-card">
                    <div className="dash-card-head">Presupuesto</div>
                    <div style={{ padding:'12px 16px 16px' }}>
                      <ReqField label="Tipo">
                        <select className="fsel" value={form.presupuesto_tipo} onChange={e => setF('presupuesto_tipo', e.target.value)} style={{ width:'100%' }}>
                          <option value="">—</option><option>Alquiler</option><option>Venta</option><option>Alquiler / Venta</option>
                        </select>
                      </ReqField>

                      {(presTipo === 'Alquiler' || presTipo === 'Alquiler / Venta') && (
                        <div style={{ marginTop:10, padding:'12px 14px', background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:10 }}>
                          <div style={{ fontSize:10.5, fontWeight:600, color:'#0f766e', marginBottom:10, letterSpacing:'.04em', textTransform:'uppercase' }}>Alquiler · €/m²/mes</div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                            <div className="dash-num-box">
                              <div className="dash-num-lbl">Desde</div>
                              <input type="number" value={form.alq_min} onChange={e => setF('alq_min', e.target.value)} placeholder="—" className="dash-num-input" />
                            </div>
                            <div className="dash-num-box">
                              <div className="dash-num-lbl">Hasta</div>
                              <input type="number" value={form.alq_max} onChange={e => setF('alq_max', e.target.value)} placeholder="—" className="dash-num-input" />
                            </div>
                          </div>
                        </div>
                      )}
                      {(presTipo === 'Venta' || presTipo === 'Alquiler / Venta') && (
                        <div style={{ marginTop:10, padding:'12px 14px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10 }}>
                          <div style={{ fontSize:10.5, fontWeight:600, color:'#b45309', marginBottom:10, letterSpacing:'.04em', textTransform:'uppercase' }}>Venta · €/m²</div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                            <div className="dash-num-box">
                              <div className="dash-num-lbl">Desde</div>
                              <input type="number" value={form.venta_m2_min} onChange={e => setF('venta_m2_min', e.target.value)} placeholder="—" className="dash-num-input" />
                            </div>
                            <div className="dash-num-box">
                              <div className="dash-num-lbl">Hasta</div>
                              <input type="number" value={form.venta_m2_max} onChange={e => setF('venta_m2_max', e.target.value)} placeholder="—" className="dash-num-input" />
                            </div>
                          </div>
                        </div>
                      )}
                      {!presTipo && (
                        <div style={{ marginTop:10, padding:'14px 12px', background:'#fafafa', borderRadius:10, fontSize:11.5, color:'#94a3b8', textAlign:'center' }}>
                          Selecciona el tipo de presupuesto.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* === EQUIPO + COLABORADORES + PARTES INVOLUCRADAS (3 mini-secciones en 1 card) === */}
                  <div className="dash-card" style={{ overflow:'visible' }}>
                    <div className="dash-card-head">Equipo y partes</div>
                    <div style={{ padding:'12px 16px 14px', display:'flex', flexDirection:'column', gap:12 }}>

                      {/* Equipo de trabajo */}
                      <div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                          <div className="dash-card-sub" style={{ margin:0 }}>Equipo de trabajo</div>
                          {canManage && addEqSection !== 'equipo' && (
                            <button onClick={() => { setAddEqSection('equipo'); setAddEqDraft({ equipo:'', miembro:'', rol:'Soporte' }) }}
                              style={{ background:'none', border:'none', color:'#0a66c2', cursor:'pointer', fontSize:11, fontWeight:600, padding:0, letterSpacing:'-0.005em' }}>
                              + Añadir
                            </button>
                          )}
                        </div>
                        {equipoInterno.length === 0 ? (
                          <div style={{ fontSize:11.5, color:'#94a3b8' }}>Sin asignar.</div>
                        ) : (
                          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            {equipoInterno.map((m, i) => (
                              <div key={`int-${i}`} className="dash-eq-row">
                                <div style={{ width:24, height:24, borderRadius:'50%', background:'#f5efe5', color:'#5a4828', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>
                                  {(m.nombre || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
                                </div>
                                <div style={{ fontSize:12, fontWeight:500, color:'#0f172a', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.nombre}</div>
                                <span style={{ fontSize:9.5, color: m.rol === 'Principal' ? '#0a66c2' : '#64748b', fontWeight:600 }}>{m.rol}</span>
                                {canManage && (
                                  <button onClick={() => handlers.removeMiembro(mapIdx(equipoInterno, i))}
                                    className="dash-eq-remove" title="Quitar">×</button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {addEqSection === 'equipo' && (
                          <div style={{ marginTop:8, padding:'10px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, display:'flex', flexDirection:'column', gap:6 }}>
                            <select className="fsel" value={addEqDraft.equipo} onChange={e => setAddEqDraft(p => ({ ...p, equipo: e.target.value, miembro:'' }))} style={{ fontSize:11.5 }}>
                              <option value="">Equipo…</option>
                              {EQUIPOS_SAVILLS.map(eq => <option key={eq}>{eq}</option>)}
                            </select>
                            {addEqDraft.equipo && (
                              <select className="fsel" value={addEqDraft.miembro} onChange={e => setAddEqDraft(p => ({ ...p, miembro: e.target.value }))} style={{ fontSize:11.5 }}>
                                <option value="">Miembro…</option>
                                {(MIEMBROS_POR_EQUIPO[addEqDraft.equipo] || []).map(n => <option key={n}>{n}</option>)}
                              </select>
                            )}
                            <select className="fsel" value={addEqDraft.rol} onChange={e => setAddEqDraft(p => ({ ...p, rol: e.target.value }))} style={{ fontSize:11.5 }}>
                              <option>Principal</option>
                              <option>Soporte</option>
                            </select>
                            <div style={{ display:'flex', gap:6 }}>
                              <button
                                disabled={!addEqDraft.equipo || !addEqDraft.miembro}
                                onClick={() => {
                                  handlers.addMiembro(addEqDraft.miembro, addEqDraft.equipo, addEqDraft.rol)
                                  setAddEqSection(null)
                                }}
                                style={{ flex:1, padding:'6px 10px', fontSize:11.5, fontWeight:600, border:'none', borderRadius:8, background: (!addEqDraft.equipo || !addEqDraft.miembro) ? '#cbd5e1' : '#0a66c2', color:'#fff', cursor: (!addEqDraft.equipo || !addEqDraft.miembro) ? 'not-allowed' : 'pointer' }}>
                                Añadir
                              </button>
                              <button onClick={() => setAddEqSection(null)}
                                style={{ padding:'6px 10px', fontSize:11.5, fontWeight:500, border:'1px solid var(--border)', borderRadius:8, background:'#fff', color:'#64748b', cursor:'pointer' }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Colaboradores */}
                      <div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                          <div className="dash-card-sub" style={{ margin:0 }}>Colaboradores</div>
                          {canManage && addEqSection !== 'colab' && (
                            <button onClick={() => { setAddEqSection('colab'); setAddEqDraft({ equipo:'', miembro:'', rol:'Colaborador' }) }}
                              style={{ background:'none', border:'none', color:'#6b21a8', cursor:'pointer', fontSize:11, fontWeight:600, padding:0, letterSpacing:'-0.005em' }}>
                              + Añadir
                            </button>
                          )}
                        </div>
                        {colaboradores.length === 0 ? (
                          <div style={{ fontSize:11.5, color:'#94a3b8' }}>Sin colaboradores externos.</div>
                        ) : (
                          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            {colaboradores.map((m, i) => (
                              <div key={`cl-${i}`} className="dash-eq-row">
                                <div style={{ width:24, height:24, borderRadius:'50%', background:'#fdf4ff', color:'#6b5b8e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>
                                  {(m.nombre || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
                                </div>
                                <div style={{ fontSize:12, fontWeight:500, color:'#0f172a', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.nombre}</div>
                                <span style={{ fontSize:9.5, color:'#6b21a8', fontWeight:600 }}>{m.equipo || 'Colab'}</span>
                                {canManage && (
                                  <button onClick={() => handlers.removeMiembro(mapIdx(colaboradores, i))}
                                    className="dash-eq-remove" title="Quitar">×</button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {addEqSection === 'colab' && (
                          <div style={{ marginTop:8, padding:'10px 12px', background:'#faf5ff', border:'1px solid #e9d5ff', borderRadius:10, display:'flex', flexDirection:'column', gap:6 }}>
                            <select className="fsel" value={addEqDraft.equipo} onChange={e => setAddEqDraft(p => ({ ...p, equipo: e.target.value, miembro:'' }))} style={{ fontSize:11.5 }}>
                              <option value="">Equipo / consultora…</option>
                              {EQUIPOS_SAVILLS.map(eq => <option key={eq}>{eq}</option>)}
                              <option value="Agente externo">Agente externo</option>
                            </select>
                            {addEqDraft.equipo && addEqDraft.equipo !== 'Agente externo' && (
                              <select className="fsel" value={addEqDraft.miembro} onChange={e => setAddEqDraft(p => ({ ...p, miembro: e.target.value }))} style={{ fontSize:11.5 }}>
                                <option value="">Miembro…</option>
                                {(MIEMBROS_POR_EQUIPO[addEqDraft.equipo] || []).map(n => <option key={n}>{n}</option>)}
                              </select>
                            )}
                            {addEqDraft.equipo === 'Agente externo' && (
                              <input className="kf-inp" placeholder="Nombre del agente externo"
                                value={addEqDraft.miembro}
                                onChange={e => setAddEqDraft(p => ({ ...p, miembro: e.target.value }))}
                                style={{ fontSize:11.5 }} />
                            )}
                            <div style={{ display:'flex', gap:6 }}>
                              <button
                                disabled={!addEqDraft.equipo || !addEqDraft.miembro}
                                onClick={() => {
                                  handlers.addMiembro(addEqDraft.miembro, addEqDraft.equipo, 'Colaborador')
                                  setAddEqSection(null)
                                }}
                                style={{ flex:1, padding:'6px 10px', fontSize:11.5, fontWeight:600, border:'none', borderRadius:8, background: (!addEqDraft.equipo || !addEqDraft.miembro) ? '#cbd5e1' : '#6b21a8', color:'#fff', cursor: (!addEqDraft.equipo || !addEqDraft.miembro) ? 'not-allowed' : 'pointer' }}>
                                Añadir
                              </button>
                              <button onClick={() => setAddEqSection(null)}
                                style={{ padding:'6px 10px', fontSize:11.5, fontWeight:500, border:'1px solid var(--border)', borderRadius:8, background:'#fff', color:'#64748b', cursor:'pointer' }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Partes involucradas */}
                      <div>
                        <div className="dash-card-sub">Partes involucradas</div>
                        {otrosListaFull.length === 0 ? (
                          <div style={{ fontSize:11.5, color:'#94a3b8' }}>Sin partes adicionales.</div>
                        ) : (
                          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            {otrosListaFull.map(c => (
                              <div key={c.dynamics_id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:24, height:24, borderRadius:'50%', background:'#eef2ff', color:'#4338ca', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>
                                  {(c.nombre || '').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                                </div>
                                <div style={{ fontSize:12, fontWeight:500, color:'#0f172a', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nombre}</div>
                                <button onClick={() => setF('otros_contactos', form.otros_contactos.filter(id => id !== c.dynamics_id))}
                                  style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:13, padding:'0 4px', lineHeight:1 }} title="Quitar">×</button>
                              </div>
                            ))}
                          </div>
                        )}
                        {otrosDisponibles.length > 0 && (
                          <select
                            className="fsel"
                            style={{ width:'100%', marginTop:6, fontSize:11.5 }}
                            value=""
                            onChange={e => { if (e.target.value) setF('otros_contactos', [...form.otros_contactos, e.target.value]) }}
                          >
                            <option value="">+ Añadir contacto…</option>
                            {otrosDisponibles.map(c => (
                              <option key={c.dynamics_id} value={c.dynamics_id}>{c.nombre}</option>
                            ))}
                          </select>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Provincias + Zonas (combinadas en un único card) · misma fila */}
                  <div className="dash-card">
                    <div className="dash-card-head">
                      Provincias y zonas
                      <span className="dash-card-count">{provinciasMostrar.length + zonasMostrar.length}</span>
                    </div>
                    <div style={{ padding:'12px 16px 16px', display:'flex', flexDirection:'column', gap:14 }}>
                      {/* Provincias */}
                      <div>
                        <div className="dash-card-sub">Provincias · {provinciasMostrar.length}</div>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8, minHeight:24 }}>
                          {provinciasMostrar.length === 0 && (
                            <span style={{ fontSize:11.5, color:'#94a3b8' }}>Ninguna añadida.</span>
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
                      {/* Zonas · cascada Eje → Área → Subzona (mismo modelo que Pitch paso 7) */}
                      {(() => {
                        const zKey = zonesKeyForUso(form.uso_principal)
                        const zonesByCity = (ZONES?.[zKey] || {})
                        const ciudadesDisp = Object.keys(zonesByCity)
                        const rawList = zonesByCity[zonaCity] || []
                        const ejesDisp = Array.from(new Set(rawList.map(r => r.area)))
                        const areasDisp = Array.from(new Set(rawList.filter(r => r.area === zonaDraft.eje).map(r => r.zona)))
                        const subzonasDisp = Array.from(new Set(rawList.filter(r => r.area === zonaDraft.eje && r.zona === zonaDraft.area).map(r => r.subzona)))

                        const composeLabel = (eje, area, sub) => [eje, area, sub].filter(Boolean).join(' · ')
                        const canAdd = !!zonaDraft.eje && !!zonaDraft.area && !!zonaDraft.subzona
                        const addZone = () => {
                          if (!canAdd) return
                          const label = composeLabel(zonaDraft.eje, zonaDraft.area, zonaDraft.subzona)
                          if (!form.zonas.includes(label)) {
                            setF('zonas', [...form.zonas, label])
                          }
                          setZonaDraft({ eje:'', area:'', subzona:'' })
                        }

                        return (
                          <div>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                              <div className="dash-card-sub" style={{ margin:0 }}>Zonas · {zonasMostrar.length}</div>
                              {ciudadesDisp.length > 1 && (
                                <select value={zonaCity} onChange={e => { setZonaCity(e.target.value); setZonaDraft({ eje:'', area:'', subzona:'' }) }}
                                  style={{ fontSize:10.5, border:'none', background:'transparent', color:'#64748b', fontWeight:600, cursor:'pointer', padding:0 }}>
                                  {ciudadesDisp.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              )}
                            </div>
                            {/* Chips de zonas seleccionadas */}
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10, minHeight:24 }}>
                              {zonasMostrar.length === 0 && (
                                <span style={{ fontSize:11.5, color:'#94a3b8' }}>Ninguna añadida.</span>
                              )}
                              {zonasMostrar.map(z => (
                                <Chip key={z} label={z} onRemove={() => togglePick('zonas', z)} />
                              ))}
                            </div>
                            {/* Cascada Eje → Área → Subzona */}
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                              <select className="fsel" value={zonaDraft.eje}
                                onChange={e => setZonaDraft({ eje: e.target.value, area:'', subzona:'' })}
                                style={{ fontSize:11 }}>
                                <option value="">Eje</option>
                                {ejesDisp.map(e => <option key={e}>{e}</option>)}
                              </select>
                              <select className="fsel" value={zonaDraft.area} disabled={!zonaDraft.eje}
                                onChange={e => setZonaDraft(p => ({ ...p, area: e.target.value, subzona:'' }))}
                                style={{ fontSize:11, opacity: zonaDraft.eje ? 1 : 0.5 }}>
                                <option value="">Área</option>
                                {areasDisp.map(a => <option key={a}>{a}</option>)}
                              </select>
                              <select className="fsel" value={zonaDraft.subzona} disabled={!zonaDraft.area}
                                onChange={e => setZonaDraft(p => ({ ...p, subzona: e.target.value }))}
                                style={{ fontSize:11, opacity: zonaDraft.area ? 1 : 0.5 }}>
                                <option value="">Subzona</option>
                                {subzonasDisp.map(s => <option key={s}>{s}</option>)}
                              </select>
                            </div>
                            <button onClick={addZone} disabled={!canAdd}
                              style={{ marginTop:6, width:'100%', padding:'7px 10px', fontSize:11.5, fontWeight:600, border:'none', borderRadius:8,
                                background: canAdd ? '#6b21a8' : '#cbd5e1', color:'#fff',
                                cursor: canAdd ? 'pointer' : 'not-allowed', letterSpacing:'-0.005em' }}>
                              + Añadir zona
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                </div>

              </div></div>
            )
          })()}

          {tab === 'dem-360' && (() => {
            // Hitos (guardados en condiciones_negociadas) para el rastro del funnel.
            const condOf = (alt) => alt.condiciones_negociadas || {}
            const isClosed = (alt) => ['ganada','perdida','descartada'].includes(alt.estado_alternativa)
            const wasVisited = (alt) => !!condOf(alt).visited || ['visita_programada','visita_realizada'].includes(alt.estado_alternativa)
            const wasFinalista  = (alt) => !!condOf(alt).finalista || alt.estado_alternativa === 'finalista'
            const wasNegotiated = (alt) => !!condOf(alt).negotiated || alt.estado_alternativa === 'negociando'
            const stageOf = (alt) => {
              if (isClosed(alt)) return 'cerradas'
              if (alt.estado_alternativa === 'negociando') return 'negociando'
              if (alt.estado_alternativa === 'finalista') return 'finalistas'
              if (['visita_programada','visita_realizada'].includes(alt.estado_alternativa)) return 'visitadas'
              return 'presentadas'
            }
            // Activas en el kanban + membresía por columna (con rastro): cada card
            // aparece en su etapa actual y, en gris, en las columnas que ya pasó.
            const activas       = alternativas.filter(a => !isClosed(a))
            const colPresentadas = activas
            const colVisitadas   = activas.filter(wasVisited)
            const colFinalistas  = activas.filter(wasFinalista)
            const colNegociando  = activas.filter(wasNegotiated)
            const cerradas       = alternativas.filter(a => ['ganada','perdida'].includes(a.estado_alternativa))
            const descartadas    = alternativas.filter(a => a.estado_alternativa === 'descartada')

            const fmtSba = sba => sba ? `${Number(sba).toLocaleString('es-ES')} m²` : '—'

            // Tarjeta de alternativa. ghost = card "de paso" (gris oscuro, no
            // arrastrable) en una columna que ya superó. note = pie del ghost.
            const AltCard = ({ alt, accent = 'var(--accent)', actions, ghost = false, note }) => {
              const a = alt.activos || {}
              const o = alt.ofertas || {}
              return (
                <div
                  draggable
                  onDragStart={e => { e.dataTransfer.setData('text/plain', alt.id); e.dataTransfer.effectAllowed = 'move' }}
                  style={{ display:'flex', flexDirection:'column', gap:8, padding:'10px 12px', border:'1px solid var(--border)', borderLeft:`3px solid ${ghost ? '#94a3b8' : accent}`, borderRadius:'var(--r)', background: ghost ? '#eef2f7' : 'var(--surface)', opacity: ghost ? 0.92 : 1, cursor: 'grab' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background: ghost ? '#94a3b8' : accent, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}></div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color: ghost ? 'var(--text3)' : 'var(--text)', cursor:'pointer' }} onClick={() => a.ref && navigate('ficha-activo', { ref:a.ref })}>
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
                  {note && <div style={{ fontSize:9, color:'var(--text4)', fontStyle:'italic' }}>{note}</div>}
                  {!ghost && actions && (
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', borderTop:'1px dashed var(--border)', paddingTop:8, marginTop:2 }}>
                      {actions}
                    </div>
                  )}
                </div>
              )
            }

            // Caja-columna soltable (drag&drop).
            const DropCol = ({ destino, children, ...rest }) => (
              <div {...rest}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) moverAlternativa(id, destino) }}>
                {children}
              </div>
            )

            const EmptyCol = ({ msg }) => (
              <div style={{ padding:'20px 12px', textAlign:'center', border:'1px dashed var(--border)', borderRadius:'var(--r)', background:'var(--gray-lt)', fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>
                {msg}
              </div>
            )

            return (
              <div className="tab-content active"><div className="info-pad">

                {/* Acción: matching con el pool de ofertas */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>Cruza la demanda contra el pool de ofertas y añade las que encajen como alternativas.</div>
                  <button className="ab-btn save" style={{ fontSize:12 }} onClick={() => setShowMatching(true)}>🔍 Matching con ofertas</button>
                </div>

                {/* Historial de búsquedas / selecciones enviadas */}
                {historialSel.length > 0 && (
                  <div className="va-card" style={{ marginBottom:14 }}>
                    <div className="va-card-header"><h3>Historial de búsquedas <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:6 }}>({historialSel.length})</span></h3></div>
                    <div style={{ padding:'4px 0 6px', overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead><tr>{['Fecha','Activos','Estado','Vistas','Enlace'].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 14px', fontSize:9, color:'var(--text4)', fontWeight:600, textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {historialSel.map((s, i) => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : ''
                            const link = `${origin}/m/${s.token}`
                            const n = (s.seleccion_ofertas || []).length
                            const isFirst = i === historialSel.length - 1
                            const isLast = i === 0
                            return (
                              <tr key={s.id} style={{ borderTop:'1px solid var(--border)' }}>
                                <td style={{ padding:'6px 14px', whiteSpace:'nowrap' }}>
                                  {new Date(s.created_at).toLocaleDateString('es-ES')}
                                  {isFirst && <span className="tag tag-gray" style={{ fontSize:8, marginLeft:6 }}>inicial</span>}
                                  {isLast && historialSel.length > 1 && <span className="tag tag-blue" style={{ fontSize:8, marginLeft:6 }}>actual</span>}
                                </td>
                                <td style={{ padding:'6px 14px', fontFamily:'var(--mono)' }}>{n}</td>
                                <td style={{ padding:'6px 14px' }}><span className={`tag ${s.estado === 'enviada' ? 'tag-green' : 'tag-gray'}`} style={{ fontSize:9 }}>{s.estado || 'borrador'}</span></td>
                                <td style={{ padding:'6px 14px', fontSize:10, color:'var(--text3)' }}>{s.vistas || 0}{s.ultima_vista ? ` · ${new Date(s.ultima_vista).toLocaleDateString('es-ES')}` : ''}</td>
                                <td style={{ padding:'6px 14px' }}><button onClick={() => navigator.clipboard?.writeText(link)} style={{ fontSize:9, padding:'2px 8px', border:'1px solid var(--border)', borderRadius:4, background:'#fff', cursor:'pointer', fontFamily:'inherit' }}>⎘ Copiar</button></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ padding:'4px 14px 12px', fontSize:10, color:'var(--text4)', fontStyle:'italic' }}>Cada fila es una selección enviada al cliente. La traza de búsquedas muestra cómo evolucionó el interés de la cuenta hasta cerrar.</div>
                  </div>
                )}

                {/* Cabecera con KPIs de funnel */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                  {[
                    ['Presentadas', colPresentadas.length, '#f5efe5', '#6f5734', ''],
                    ['Visitadas',   colVisitadas.length,   '#f0fdfa', '#0f766e', ''],
                    ['Negociando',  colNegociando.length,  '#fef3c7', '#92400e', ''],
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
                  <>
                  <div style={{ fontSize:10, color:'var(--text4)', marginBottom:8, fontStyle:'italic' }}>Arrastra las cards entre columnas. Una card visitada se queda en gris en "Visitadas" aunque pase a negociación, para distinguir si se visitó o se pasó directa.</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>

                    {/* === COL 1 · PRESENTADAS === */}
                    <DropCol destino="presentadas" className="va-card" style={{ marginBottom:0 }}>
                      <div className="va-card-header" style={{ background:'#f8fafc' }}>
                        <h3><span className="ico" style={{ color:'#6f5734' }}></span> Presentadas <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:4 }}>({colPresentadas.filter(a=>stageOf(a)==='presentadas').length})</span></h3>
                      </div>
                      <div style={{ padding:'10px 14px 14px', display:'flex', flexDirection:'column', gap:8, minHeight:60 }}>
                        {colPresentadas.length === 0
                          ? <EmptyCol msg="Aún no se han presentado edificios." />
                          : colPresentadas.map(alt => {
                              const ghost = stageOf(alt) !== 'presentadas'
                              return <AltCard key={alt.id} alt={alt} accent="#6f5734" ghost={ghost}
                                note={ghost ? 'Pasó de fase' : undefined} />
                            })
                        }
                      </div>
                    </DropCol>

                    {/* === COL 2 · VISITADAS === */}
                    <DropCol destino="visitadas" className="va-card" style={{ marginBottom:0 }}>
                      <div className="va-card-header" style={{ background:'#f0fdfa' }}>
                        <h3><span className="ico" style={{ color:'#0f766e' }}></span> Visitadas <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:4 }}>({colVisitadas.filter(a=>stageOf(a)==='visitadas').length})</span></h3>
                      </div>
                      <div style={{ padding:'10px 14px 14px', display:'flex', flexDirection:'column', gap:8, minHeight:60 }}>
                        {colVisitadas.length === 0
                          ? <EmptyCol msg="Arrastra aquí una card para registrar la visita." />
                          : colVisitadas.map(alt => {
                              const ghost = stageOf(alt) !== 'visitadas'
                              const fv = condOf(alt).fecha_visita
                              return <AltCard key={alt.id} alt={alt} accent="#0f766e" ghost={ghost}
                                note={ghost ? (fv ? `Visitada ${fv}` : 'Visitada') : (fv ? `Visitada ${fv}` : undefined)} />
                            })
                        }
                      </div>
                    </DropCol>

                    {/* === COL 3 · FINALISTAS === */}
                    <DropCol destino="finalistas" className="va-card" style={{ marginBottom:0 }}>
                      <div className="va-card-header" style={{ background:'#f5f3ff' }}>
                        <h3><span className="ico" style={{ color:'#6b21a8' }}></span> Finalistas <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:4 }}>({colFinalistas.filter(a=>stageOf(a)==='finalistas').length})</span></h3>
                      </div>
                      <div style={{ padding:'10px 14px 14px', display:'flex', flexDirection:'column', gap:8, minHeight:60 }}>
                        {colFinalistas.length === 0
                          ? <EmptyCol msg="Arrastra aquí las alternativas finalistas." />
                          : colFinalistas.map(alt => {
                              const ghost = stageOf(alt) !== 'finalistas'
                              return <AltCard key={alt.id} alt={alt} accent="#6b21a8" ghost={ghost}
                                note={ghost ? 'Finalista' : undefined} />
                            })
                        }
                      </div>
                    </DropCol>

                    {/* === COL 4 · EN NEGOCIACIÓN === */}
                    <DropCol destino="negociando" className="va-card" style={{ marginBottom:0 }}>
                      <div className="va-card-header" style={{ background:'#fef3c7' }}>
                        <h3><span className="ico" style={{ color:'#92400e' }}></span> En negociación <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:4 }}>({colNegociando.filter(a=>stageOf(a)==='negociando').length})</span></h3>
                      </div>
                      <div style={{ padding:'10px 14px 14px', display:'flex', flexDirection:'column', gap:8, minHeight:60 }}>
                        {colNegociando.length === 0
                          ? <EmptyCol msg="Arrastra aquí una card para abrir negociación." />
                          : colNegociando.map(alt => {
                              const ghost = stageOf(alt) !== 'negociando'
                              return <AltCard key={alt.id} alt={alt} accent="#92400e" ghost={ghost}
                                actions={ghost ? null : (
                                  <>
                                    <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px' }} onClick={() => alt.ofertas?.ref && navigate('ficha-negociacion', { id: alt.ofertas.ref })}>Ver negociación</button>
                                    <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px', color:'var(--green)' }} onClick={() => cambiarEstadoAlternativa(alt.id, 'ganada')}>Ganada</button>
                                    <button className="ab-btn" style={{ fontSize:9, padding:'3px 8px', color:'var(--red)' }} onClick={() => cambiarEstadoAlternativa(alt.id, 'perdida')}>✕ Perdida</button>
                                  </>
                                )} />
                            })
                        }
                      </div>
                    </DropCol>

                  </div>
                  </>
                )}

                {/* CERRADAS (ganada/perdida) */}
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
                              {isWin ? 'Ganada' : '✕ Perdida'}
                            </span>
                          } />
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* DESCARTADAS · zona soltable (pide motivo al soltar) */}
                {alternativas.length > 0 && (
                  <DropCol destino="descartar" className="va-card" style={{ marginTop:14, marginBottom:0 }}>
                    <div className="va-card-header">
                      <h3><span className="ico" style={{ color:'#b91c1c' }}>⊘</span> Descartadas <span style={{ color:'var(--text4)', fontWeight:400, fontSize:11, marginLeft:4 }}>({descartadas.length})</span></h3>
                    </div>
                    {descartadas.length === 0 ? (
                      <div style={{ padding:'16px 18px', textAlign:'center', fontSize:11, color:'var(--text4)', fontStyle:'italic', border:'1px dashed var(--border)', borderRadius:'var(--r)', margin:'10px 14px 14px' }}>Arrastra aquí una card para descartarla (te pedirá el motivo).</div>
                    ) : (
                      <div style={{ padding:'10px 18px 14px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                        {descartadas.map(alt => (
                          <AltCard key={alt.id} alt={alt} accent="#b91c1c" actions={
                            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                              <span className="tag tag-red" style={{ fontSize:9, width:'fit-content' }}>⊘ Descartada</span>
                              {condOf(alt).motivo_descarte && <span style={{ fontSize:10, color:'var(--text3)' }}>Motivo: {condOf(alt).motivo_descarte}</span>}
                            </div>
                          } />
                        ))}
                      </div>
                    )}
                  </DropCol>
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
                    <button onClick={() => setShowMatching(true)} style={{ fontSize:10, padding:'4px 8px', background:'none', border:'1px solid var(--accent-bd)', color:'var(--accent)', borderRadius:4, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>🔍 Matching con ofertas</button>
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
