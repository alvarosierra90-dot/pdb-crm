import { useState, useEffect, useRef } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'
import BajaArrendatarioModal from '../components/BajaArrendatarioModal'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'
import { StackingPlan } from './FichaActivo'
import { supabase } from '../lib/supabase'

// DD/MM/YYYY → YYYY-MM-DD (for DB date columns and <input type="date">)
function parseDate(ddmmyyyy) {
  if (!ddmmyyyy || ddmmyyyy.length < 8) return null
  const parts = ddmmyyyy.trim().split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y || y < 1900) return null
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}
// YYYY-MM-DD → DD/MM/YYYY (from DB / <input type="date"> back to form state)
function formatDate(iso) {
  if (!iso || iso.length < 8) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}
// form state (DD/MM/YYYY) → <input type="date"> value (YYYY-MM-DD)
function toInputDate(ddmmyyyy) { return parseDate(ddmmyyyy) || '' }
// <input type="date"> onChange → form state (DD/MM/YYYY)
function fromInputDate(yyyymmdd) { return yyyymmdd ? formatDate(yyyymmdd) : '' }

function addYearsToDate(ddmmyyyy, years) {
  if (!ddmmyyyy || !years || isNaN(parseFloat(years))) return ''
  const parts = ddmmyyyy.trim().split('/')
  if (parts.length !== 3) return ''
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y || y < 1900) return ''
  const dt = new Date(y + Math.floor(parseFloat(years)), m - 1, d)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}

function calcRecordatorio(breakOption, meses) {
  if (!breakOption) return '—'
  const [d,m,y] = breakOption.split('/').map(Number)
  const fecha = new Date(y, m-1-meses, d)
  return `${String(fecha.getDate()).padStart(2,'0')}/${String(fecha.getMonth()+1).padStart(2,'0')}/${fecha.getFullYear()}`
}

function diasHasta(fechaStr) {
  if (!fechaStr || fechaStr==='—') return null
  const [d,m,y] = fechaStr.split('/').map(Number)
  return Math.ceil((new Date(y,m-1,d) - new Date())/(1000*60*60*24))
}

const TABS = ['datos','stacking','condiciones','alertas','historial','conf']
const TAB_LABELS = ['Datos del arrendatario','Stacking plan','Condiciones económicas','Alertas y break option','Historial','Confidencialidad']

const TIPO_TAG_ARR = { Email:'tag-blue', Llamada:'tag-green', Reunión:'tag-purple', Tarea:'tag-gray', Nota:'tag-gray', Alerta:'tag-red', Modificación:'tag-amber' }
const TIPO_ICO_ARR = { Email:'📧', Llamada:'', Reunión:'', Tarea:'✅', Nota:'📝', Alerta:'🔔', Modificación:'✏️' }
const ACT_EST_ARR  = { Sistema:'tag-gray', 'Sierra Alvaro':'tag-blue', Automático:'tag-amber' }

const HIST_ACTS = [
  { id:'HST-001', tipo:'Nota',         asunto:'Arrendatario creado — Oracle Spain SL vinculado a Albatros Edif. D · 13.486 m²',        fecha:'01/07/2021', user:'Sierra Alvaro',  initials:'AS', bg:'#f5efe5', color:'#5a4828', origen:'Sierra Alvaro'  },
  { id:'HST-002', tipo:'Modificación', asunto:'Actualización condiciones económicas — closing rent ajustado a 12,50 €/m²/mes',          fecha:'15/06/2023', user:'Sierra Alvaro',  initials:'AS', bg:'#f5efe5', color:'#5a4828', origen:'Sierra Alvaro'  },
  { id:'HST-003', tipo:'Email',        asunto:'Email de renovación enviado a Carlos Méndez (Dir. Real Estate Oracle)',                   fecha:'01/04/2024', user:'Sierra Alvaro',  initials:'AS', bg:'#f5efe5', color:'#5a4828', origen:'Sierra Alvaro'  },
  { id:'HST-004', tipo:'Alerta',       asunto:'Recordatorio automático — break option a 90 días (vencimiento 01/07/2024)',               fecha:'01/04/2024', user:'Sistema',        initials:'SY', bg:'#fff7ed', color:'#c2410c', origen:'Automático'     },
  { id:'HST-005', tipo:'Llamada',      asunto:'Llamada Carlos Méndez — Oracle no ejercerá break option, confirma continuidad',          fecha:'15/05/2024', user:'Sierra Alvaro',  initials:'AS', bg:'#f5efe5', color:'#5a4828', origen:'Sierra Alvaro'  },
  { id:'HST-006', tipo:'Alerta',       asunto:'Break option alcanzada — Oracle Spain SL no ha notificado decisión (vencida 01/07/2024)',fecha:'01/07/2024', user:'Sistema',        initials:'SY', bg:'#fff7ed', color:'#c2410c', origen:'Automático'     },
  { id:'HST-007', tipo:'Reunión',      asunto:'Reunión de seguimiento anual — revisión condiciones y plazos',                           fecha:'10/01/2025', user:'GOMEZ Ignacio',  initials:'GI', bg:'#fdf4ff', color:'#6b5b8e', origen:'Sierra Alvaro'  },
  { id:'HST-008', tipo:'Nota',         asunto:'Oracle interesado en ampliar superficie — P3 disponible (13.486 m² adicionales)',        fecha:'15/02/2025', user:'Sierra Alvaro',  initials:'AS', bg:'#f5efe5', color:'#5a4828', origen:'Sierra Alvaro'  },
]

export default function FichaArrendatario() {
  const { navigate, params } = useNav()
  const [tab, setTab] = useState('datos')
  const [showTarea, setShowTarea] = useState(false)
  const [saving, setSaving] = useState(false)
  const [arrConfidential, setArrConfidential] = useState(false)
  const [arrAuthUsers, setArrAuthUsers] = useState([
    { name:'Sierra Álvaro', team:'Leasing Oficinas MAD', role:'Principal', initials:'AS', bg:'#f5efe5', color:'#5a4828', owner:true },
  ])
  const [saveErr, setSaveErr] = useState('')
  const [saveOk, setSaveOk] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])

  // Detect launch context
  const fromOferta = !!params?.fromOfertaRef
  const fromActivo = !!params?.fromActivoRef && !fromOferta
  const fromTenantClick = !!params?.tenantName && !fromOferta && !fromActivo
  const fromDarBaja = !!params?.arrRef
  const isNew = (fromOferta || fromActivo) && !fromDarBaja

  // Form 100% vacío — nada de defaults ficticios. El usuario rellena todo.
  // Solo dejamos `color` con un valor visual base (no es un campo de negocio).
  const EMPTY_FORM = {
    activo: '',
    activo_direccion: '',
    persona_fisica: false,
    tenant_desconocido: false,
    tenant: '',
    tenant_mayoritario: '',
    propietario: '',
    anyo_firma: '',
    trimestre: '',
    superficie: '',
    asking_rent: '',
    closing_rent: '',
    renta_mensual: '',
    meses_carencia: '',
    plazas_int: '',
    plazas_ext: '',
    precio_int: '',
    precio_ext: '',
    agente_activo: '',
    agente_pasivo: '',
    aportacion_obras_m2: '',
    aportacion_total: '',
    tipo_contrato: '',
    anios_obligado: '',
    anios_obligado_2: '',
    fecha_inicio: '',
    break_option: '',
    fecha_fin: '',
    fecha_salida: '',
    meses_recordatorio: '',
    color: '#B08D57',
    estado: '',
    responsable: '',
    sector: '',
    area: '',
    zona: '',
    subzona: '',
  }

  // Datos del arrendatario — inicializa desde params si viene de oferta/activo, sino mock
  const [form, setForm] = useState(() => {
    if (params?.fromOfertaRef) {
      // Generado desde stacking de una oferta. Sólo se hereda info
      // ESTRUCTURAL del activo (nombre, dirección, propietario). El resto
      // queda pendiente de cumplimentar manualmente.
      return {
        ...EMPTY_FORM,
        activo:           params.fromActivoNombre     || '',
        activo_direccion: params.fromActivoDireccion  || '',
        propietario:      params.fromActivoPropietario|| '',
      }
    }
    if (params?.fromActivoRef && !params?.fromOfertaRef) {
      return {
        ...EMPTY_FORM,
        activo:           params.fromActivoNombre     || '',
        activo_direccion: params.fromActivoDireccion  || '',
        propietario:      params.fromActivoPropietario|| '',
        zona:             params.fromActivoZona       || '',
      }
    }
    // Nuevo arrendatario "en blanco" (desde el módulo / lista, sin contexto):
    // formulario 100% vacío. El usuario vincula activo + cuenta con lupa.
    const isBlankNew = !params?.tenantName && !params?.arrRef
    if (isBlankNew) {
      return { ...EMPTY_FORM }
    }
    // Mock data for existing tenant view
    return {
      activo: 'Albatros Edif. D',
      persona_fisica: false,
      tenant_desconocido: false,
      tenant: 'Oracle Spain SL',
      tenant_mayoritario: 'Oracle Spain SL',
      propietario: 'Merlín Properties SOCIMI',
      anyo_firma: '2021',
      trimestre: 'Q2',
      superficie: '13486',
      asking_rent: '13.00',
      closing_rent: '12.50',
      renta_mensual: '',
      meses_carencia: '2',
      plazas_int: '40',
      plazas_ext: '0',
      precio_int: '110',
      precio_ext: '0',
      agente_activo: 'Sierra Alvaro',
      agente_pasivo: 'CBRE',
      aportacion_obras_m2: '15',
      aportacion_total: '',
      tipo_contrato: 'Alquiler comercial',
      anios_obligado: '3',
      anios_obligado_2: '2',
      fecha_inicio: '01/07/2021',
      break_option: '01/07/2024',
      fecha_fin: '01/07/2026',
      fecha_salida: '',
      meses_recordatorio: '3',
      color: '#B08D57',
      estado: 'Próximo a vencimiento',
      responsable: 'Sierra Alvaro',
      sector: 'Tecnología',
      area: 'Periferia',
      zona: 'A-1',
      subzona: 'Alcobendas',
    }
  })

  const set = (k, v) => setForm(p => {
    const next = { ...p, [k]: v }
    // Auto-compute break_option from fecha_inicio + anios_obligado (primer periodo)
    if (k === 'fecha_inicio' || k === 'anios_obligado') {
      if (next.fecha_inicio && next.anios_obligado) {
        const bo = addYearsToDate(next.fecha_inicio, next.anios_obligado)
        if (bo) {
          next.break_option = bo
          // Also recompute fecha_fin if segundo periodo is set
          if (next.anios_obligado_2) {
            const ff = addYearsToDate(bo, next.anios_obligado_2)
            if (ff) next.fecha_fin = ff
          }
        }
      }
    }
    // Auto-compute fecha_fin from break_option + anios_obligado_2 (segundo periodo)
    if (k === 'break_option' || k === 'anios_obligado_2') {
      if (next.break_option && next.anios_obligado_2) {
        const ff = addYearsToDate(next.break_option, next.anios_obligado_2)
        if (ff) next.fecha_fin = ff
      }
    }
    return next
  })

  // ── Lupa de Activo (para vincular desde la lista o cambiar el actual) ──
  const [activoSearch,    setActivoSearch]    = useState('')
  const [showActivoDD,    setShowActivoDD]    = useState(false)
  const [activoResults,   setActivoResults]   = useState([])
  useEffect(() => {
    if (!activoSearch || activoSearch.length < 2) { setActivoResults([]); return }
    let cancel = false
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('activos')
        .select('ref, nombre, direccion, propietario, zona, uso')
        .ilike('nombre', `%${activoSearch}%`)
        .order('nombre')
        .limit(10)
      if (!cancel) setActivoResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [activoSearch])

  const [linkedActivoRef, setLinkedActivoRef] = useState(null)
  const linkActivo = (a) => {
    set('activo',           a.nombre || '')
    set('activo_direccion', a.direccion || '')
    if (a.propietario) set('propietario', a.propietario)
    if (a.zona)        set('zona', a.zona)
    if (a.subzona)     set('subzona', a.subzona)
    if (a.area)        set('area', a.area)
    if (a.uso)         set('uso', a.uso)
    setLinkedActivoRef(a.ref || null)
    setActivoSearch('')
    setShowActivoDD(false)
  }

  // ── Lupa de cuentas (Arrendatario + Arrendatario mayoritario) ──
  const [tenantSearch,    setTenantSearch]    = useState('')
  const [showTenantDD,    setShowTenantDD]    = useState(false)
  const [tenantResults,   setTenantResults]   = useState([])
  const [mayorSearch,     setMayorSearch]     = useState('')
  const [showMayorDD,     setShowMayorDD]     = useState(false)
  const [mayorResults,    setMayorResults]    = useState([])

  // Debounce búsqueda sobre dynamics_accounts para tenant
  useEffect(() => {
    if (!tenantSearch || tenantSearch.length < 2) { setTenantResults([]); return }
    let cancel = false
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('dynamics_accounts')
        .select('dynamics_id, nombre, tipo, sector')
        .ilike('nombre', `%${tenantSearch}%`)
        .order('nombre')
        .limit(10)
      if (!cancel) setTenantResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [tenantSearch])

  // Debounce búsqueda sobre dynamics_accounts para arrendatario mayoritario
  useEffect(() => {
    if (!mayorSearch || mayorSearch.length < 2) { setMayorResults([]); return }
    let cancel = false
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('dynamics_accounts')
        .select('dynamics_id, nombre, tipo, sector')
        .ilike('nombre', `%${mayorSearch}%`)
        .order('nombre')
        .limit(10)
      if (!cancel) setMayorResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [mayorSearch])

  // Stacking plan compartido — capa 'arr' por defecto
  const [stackingActivo, setStackingActivo] = useState(null) // { id, ref, nombre, stacking_data, ... }
  const [arrTodosActivo, setArrTodosActivo] = useState([])    // arrendatarios del mismo activo (sidebar)
  const [bajaArr, setBajaArr] = useState(null)
  const stackingAutoSaveTimer = useRef(null)

  // Load from arrRef (coming from dar de baja)
  const [loadedRef, setLoadedRef] = useState(null)
  useEffect(() => {
    if (!params?.arrRef) return
    supabase.from('arrendatarios').select('*').eq('ref', params.arrRef).single()
      .then(async ({ data }) => {
        if (!data) return
        setLoadedRef(data.ref)
        // Cargar la dirección del activo vinculado (no mostrar el ref code al usuario)
        let activoDireccion = ''
        if (data.activo_ref) {
          const { data: ac } = await supabase
            .from('activos').select('ref, nombre, direccion, propietario, zona, subzona, area, uso')
            .eq('ref', data.activo_ref).maybeSingle()
          if (ac) {
            activoDireccion = ac.direccion || ac.nombre || data.activo_ref
            setLinkedActivoRef(ac.ref)
          }
        }
        setForm(prev => ({
          ...prev,
          activo:           activoDireccion || data.activo_ref || '',
          activo_direccion: activoDireccion,
          tenant:           data.tenant || data.nombre || '',
          tenant_desconocido: data.tenant_desconocido || false,
          anyo_firma:       data.anyo_firma ? String(data.anyo_firma) : '',
          trimestre:        data.trimestre || 'Q1',
          superficie:       data.superficie ? String(data.superficie) : '',
          closing_rent:     data.closing_rent ? String(data.closing_rent) : '',
          tipo_contrato:    data.tipo_contrato || 'Alquiler comercial',
          anios_obligado:   data.anios_obligado ? String(data.anios_obligado) : '',
          anios_obligado_2: data.anios_obligado_2 ? String(data.anios_obligado_2) : '',
          fecha_inicio:     data.inicio ? formatDate(data.inicio) : '',
          break_option:     data.break_option ? formatDate(data.break_option) : '',
          fecha_fin:        data.vencimiento ? formatDate(data.vencimiento) : '',
          estado:           data.estado_arr || 'Vigente',
          meses_recordatorio: data.meses_recordatorio ? String(data.meses_recordatorio) : '3',
        }))
      })
  }, [params?.arrRef])

  const [showErrors, setShowErrors] = useState(false)
  const invalidFields = showErrors ? (() => {
    const s = new Set()
    if (!form.tenant_desconocido && !form.tenant.trim()) s.add('tenant')
    if (!form.anyo_firma || !/^\d{4}$/.test(form.anyo_firma.trim())) s.add('anyo_firma')
    if (!form.trimestre) s.add('trimestre')
    if (!form.closing_rent || isNaN(parseFloat(form.closing_rent))) s.add('closing_rent')
    if (!form.fecha_inicio || form.fecha_inicio.trim().length < 6) s.add('fecha_inicio')
    if (!form.anios_obligado || isNaN(parseFloat(form.anios_obligado))) s.add('anios_obligado')
    if (!form.meses_recordatorio || isNaN(parseInt(form.meses_recordatorio))) s.add('meses_recordatorio')
    return s
  })() : new Set()

  // ── Validation ────────────────────────────────────────────────
  function validate() {
    const errs = []
    if (!form.tenant_desconocido && !form.tenant.trim())
      errs.push('Cuenta del arrendatario (o marca "Arrendatario desconocido")')
    if (!form.anyo_firma || !/^\d{4}$/.test(form.anyo_firma.trim()))
      errs.push('Año de firma (4 dígitos)')
    if (!form.trimestre)
      errs.push('Trimestre')
    if (!form.closing_rent || isNaN(parseFloat(form.closing_rent)))
      errs.push('Closing rent (valor numérico)')
    if (!form.fecha_inicio || form.fecha_inicio.trim().length < 6)
      errs.push('Fecha de inicio contractual')
    if (!form.anios_obligado || isNaN(parseFloat(form.anios_obligado)))
      errs.push('Número de años de obligado cumplimiento')
    if (!form.meses_recordatorio || isNaN(parseInt(form.meses_recordatorio)))
      errs.push('Recordatorio (meses)')
    return errs
  }

  // ── Load activo (con stacking_data) cuando se abre el tab Stacking ─
  useEffect(() => {
    if (tab !== 'stacking') return
    let cancel = false
    const SELECT = 'id, ref, nombre, direccion, stacking_data, sup_planta_tipo, propietario, dynamics_account_id, portfolio_id, uso'
    async function lookupActivo() {
      // Estrategias en orden: 1) param explícito, 2) ref, 3) nombre exacto,
      // 4) ilike por nombre. La primera que devuelva fila gana.
      const candRef  = (params?.fromActivoRef || '').trim()
      const candForm = (form.activo || '').trim()
      let data = null

      if (candRef) {
        const r = await supabase.from('activos').select(SELECT).eq('ref', candRef).maybeSingle()
        data = r.data
      }
      if (!data && candForm) {
        const r = await supabase.from('activos').select(SELECT).eq('ref', candForm).maybeSingle()
        data = r.data
      }
      if (!data && candForm) {
        const r = await supabase.from('activos').select(SELECT).eq('nombre', candForm).maybeSingle()
        data = r.data
      }
      if (!data && candForm) {
        const r = await supabase.from('activos').select(SELECT).ilike('nombre', `%${candForm}%`).limit(1)
        data = r.data?.[0] || null
      }
      if (!cancel) setStackingActivo(data || null)
    }
    lookupActivo()
    return () => { cancel = true }
  }, [tab, form.activo, params?.fromActivoRef])

  // Carga la lista de arrendatarios del activo para alimentar el sidebar
  // del Stacking Plan dentro de la ficha del arrendatario.
  useEffect(() => {
    if (tab !== 'stacking' || !stackingActivo?.ref) { setArrTodosActivo([]); return }
    let cancel = false
    supabase.from('arrendatarios')
      .select('ref, nombre, tenant, activo_ref')
      .eq('activo_ref', stackingActivo.ref)
      .order('created_at', { ascending:false })
      .then(({ data }) => {
        if (cancel) return
        const list = (data || []).map(r => ({ ref: r.ref, name: r.tenant || r.nombre || '—' }))
        // Si el arrendatario actual aún no está en BD (recién creado y sin persistir)
        // pero el form tiene nombre, añadimos un chip temporal para que se vea.
        const currentName = form.tenant_desconocido ? 'Desconocido' : (form.tenant || '').trim()
        const currentRef  = loadedRef
        const already = list.some(t => (currentRef && t.ref === currentRef) || (!currentRef && t.name === currentName))
        if (!already && currentName) list.unshift({ ref: currentRef, name: currentName })
        setArrTodosActivo(list)
      })
    return () => { cancel = true }
  }, [tab, stackingActivo?.ref, loadedRef, form.tenant, form.tenant_desconocido])

  // ── Load from DB when opened by tenant name click ─────────────
  useEffect(() => {
    if (!params?.tenantName || params?.fromOfertaRef) return
    supabase.from('arrendatarios').select('*').eq('nombre', params.tenantName).limit(1).then(async ({ data }) => {
      if (!data?.[0]) return
      const r = data[0]
      let activoDireccion = ''
      if (r.activo_ref) {
        const { data: ac } = await supabase
          .from('activos').select('ref, nombre, direccion')
          .eq('ref', r.activo_ref).maybeSingle()
        if (ac) {
          activoDireccion = ac.direccion || ac.nombre || r.activo_ref
          setLinkedActivoRef(ac.ref)
        }
      }
      setForm(prev => ({
        ...prev,
        activo:          activoDireccion || r.edificio || r.activo_ref || prev.activo,
        tenant:          r.tenant || r.nombre || prev.tenant,
        persona_fisica:  r.persona_fisica    ?? prev.persona_fisica,
        tenant_desconocido: r.tenant_desconocido ?? prev.tenant_desconocido,
        anyo_firma:      r.anyo_firma != null ? String(r.anyo_firma) : prev.anyo_firma,
        trimestre:       r.trimestre         || prev.trimestre,
        superficie:      r.superficie != null ? String(r.superficie) : prev.superficie,
        asking_rent:     r.asking_rent != null ? String(r.asking_rent) : prev.asking_rent,
        closing_rent:    r.closing_rent != null ? String(r.closing_rent) : (r.renta != null ? String(r.renta) : prev.closing_rent),
        meses_carencia:  r.meses_carencia != null ? String(r.meses_carencia) : prev.meses_carencia,
        plazas_int:      r.plazas_int != null ? String(r.plazas_int) : prev.plazas_int,
        precio_int:      r.precio_int != null ? String(r.precio_int) : prev.precio_int,
        plazas_ext:      r.plazas_ext != null ? String(r.plazas_ext) : prev.plazas_ext,
        precio_ext:      r.precio_ext != null ? String(r.precio_ext) : prev.precio_ext,
        agente_activo:   r.agente_activo     || prev.agente_activo,
        agente_pasivo:   r.agente_pasivo     || prev.agente_pasivo,
        aportacion_obras_m2: r.aportacion_obras_m2 != null ? String(r.aportacion_obras_m2) : prev.aportacion_obras_m2,
        tipo_contrato:   r.tipo_contrato     || prev.tipo_contrato,
        anios_obligado:  r.anios_obligado != null ? String(r.anios_obligado) : prev.anios_obligado,
        anios_obligado_2: r.anios_obligado_2 != null ? String(r.anios_obligado_2) : prev.anios_obligado_2,
        fecha_inicio:    r.inicio ? formatDate(r.inicio) : prev.fecha_inicio,
        break_option:    r.break_option ? formatDate(r.break_option) : prev.break_option,
        fecha_fin:       r.vencimiento ? formatDate(r.vencimiento) : prev.fecha_fin,
        meses_recordatorio: r.meses_recordatorio != null ? String(r.meses_recordatorio) : prev.meses_recordatorio,
        color:           r.color             || prev.color,
        estado:          r.estado_arr || r.estado || prev.estado,
        sector:          r.sector            || prev.sector,
      }))
    })
  }, [])

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validate()
    if (errs.length > 0) { setValidationErrors(errs); setShowErrors(true); return }
    setShowErrors(false)
    setValidationErrors([])
    setSaving(true); setSaveErr('')
    try {
      const tenantName = form.tenant_desconocido ? 'Desconocido' : form.tenant.trim()

      // Base row — columns guaranteed to exist (001 + 006)
      const baseRow = {
        nombre:      tenantName,
        uso:         form.sector || null,
        superficie:  parseFloat(form.superficie) || null,
        renta:       parseFloat(form.closing_rent) || null,
        break_option: parseDate(form.break_option),
        vencimiento:  parseDate(form.fecha_fin),
        inicio:       parseDate(form.fecha_inicio),
        planta:       params?.fromFloorId || null,
        // Si se viene desde un activo, usar su nombre directo; si se vincula
        // con la lupa, usar form.activo (que es el nombre del activo elegido)
        edificio:     params?.fromActivoNombre || form.activo || null,
        estado_arr:   form.estado || 'Vigente',
      }

      // Extended row — needs migration 007
      // Resolución del activo final: fromActivoRef (navegado desde Oferta/Activo) o
      // linkedActivoRef (vinculado con la lupa desde el formulario)
      const activoRefFinal = params?.fromActivoRef || linkedActivoRef || null
      const { nextRef } = await import('../lib/nextRef')
      const extRow = {
        ...baseRow,
        ref:                  await nextRef('arrendatarios', 'ARR'),
        activo_ref:           activoRefFinal,
        tenant:               tenantName,
        tenant_desconocido:   form.tenant_desconocido,
        persona_fisica:       form.persona_fisica,
        // Campos heredados del activo · necesarios para que la vista principal
        // de /arrendatarios muestre zona/subzona/area/uso correctamente.
        zona:                 form.zona || null,
        subzona:              form.subzona || null,
        area_zona:            form.area || null,
        // baseRow.uso = form.sector (legacy). Mantenemos sector explícito abajo
        // y persistimos también el uso real del activo en columna 'uso' aparte
        // cuando exista — comentado porque baseRow.uso ya está ocupado por sector.
        propietario_cuenta:   form.propietario || null,
        tenant_mayoritario:   form.tenant_mayoritario || null,
        anyo_firma:           parseInt(form.anyo_firma) || null,
        trimestre:            form.trimestre,
        asking_rent:          parseFloat(form.asking_rent) || null,
        closing_rent:         parseFloat(form.closing_rent) || null,
        meses_carencia:       parseInt(form.meses_carencia) || null,
        plazas_int:           parseInt(form.plazas_int) || 0,
        precio_int:           parseFloat(form.precio_int) || 0,
        plazas_ext:           parseInt(form.plazas_ext) || 0,
        precio_ext:           parseFloat(form.precio_ext) || 0,
        agente_activo:        form.agente_activo || null,
        agente_pasivo:        form.agente_pasivo || null,
        aportacion_obras_m2:  parseFloat(form.aportacion_obras_m2) || null,
        tipo_contrato:        form.tipo_contrato,
        anios_obligado:       parseFloat(form.anios_obligado) || null,
        anios_obligado_2:     parseFloat(form.anios_obligado_2) || null,
        meses_recordatorio:   parseInt(form.meses_recordatorio) || 3,
        color:                form.color,
        sector:               form.sector,
        oferta_origen:        params?.fromOfertaRef || null,
      }

      let { error } = await supabase.from('arrendatarios').insert(extRow)
      if (error && (error.message?.includes('column') || error.code === '42703')) {
        // Migration 007 not yet applied — fall back to base+006 columns
        const res2 = await supabase.from('arrendatarios').insert(baseRow)
        error = res2.error
      }
      if (error && (error.message?.includes('column') || error.code === '42703')) {
        // Migration 006 not yet applied either — absolute minimum (001 schema only)
        const minRow = {
          nombre:      tenantName,
          uso:         form.sector || null,
          superficie:  parseFloat(form.superficie) || null,
          renta:       parseFloat(form.closing_rent) || null,
          break_option: parseDate(form.break_option),
          vencimiento:  parseDate(form.fecha_fin),
        }
        const res3 = await supabase.from('arrendatarios').insert(minRow)
        error = res3.error
      }
      if (error) { setSaveErr(error.message); return }

      // Auto-assign tenant to the floor in the activo's stacking_data
      // (read fresh from DB — FichaOferta already removed the offer unit before navigating here)
      if (params?.fromActivoRef && params?.fromFloorId) {
        const sup = parseFloat(params?.prefilledSup) || 0
        const { data: acData } = await supabase.from('activos').select('stacking_data').eq('ref', params.fromActivoRef).single()
        if (acData?.stacking_data) {
          const updatedStacking = acData.stacking_data.map(b => ({
            ...b,
            arr: (b.arr||[]).map(r => {
              if (r.p !== params.fromFloorId) return r
              // Remove any remaining offer units on this floor, then add the tenant.
              // arr_ref es el id estable del arrendatario — sobrevive a renames y
              // resuelve la ambigüedad entre múltiples 'Desconocido'.
              const withoutOffers = r.units.filter(u => !(u.type === 'vac' && u.oferta))
              return { ...r, units: [...withoutOffers, { type:'ten', arr_ref: extRow.ref, n:tenantName, sup, brk:null, brkColor: form.color || '#B08D57' }] }
            })
          }))
          await supabase.from('activos').update({ stacking_data: updatedStacking }).eq('ref', params.fromActivoRef)
        }
      }

      setSaveOk(true)
      // Marcamos como persistido: a partir de aquí, los cambios (incluida la
      // superficie que se asignará en el Stacking) se aplican como UPDATE
      // contra este mismo arr_ref.
      setLoadedRef(extRow.ref)

      // Solo navegamos fuera si el arrendatario se creó desde el flujo de Oferta
      // (allí hay un activo y una planta concretos esperando el chip).
      if (params?.fromOfertaRef) {
        setTimeout(() => navigate('ficha-oferta', {
          ofertaRef: params.fromOfertaRef,
          newTenantName: tenantName,
          newTenantFloor: params?.fromFloorId || null,
          newActivoRef: params?.fromActivoRef || null,
        }), 1000)
      }
      // En cualquier otro caso (desde lista o desde activo) nos quedamos en
      // la ficha del arrendatario. El usuario puede ir al tab Stacking Plan
      // para asignar la superficie y volver al tab Datos para verla reflejada.
    } catch(e) {
      setSaveErr(e.message || 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveUpdate = async () => {
    if (!loadedRef) return
    setSaving(true); setSaveErr('')
    const tenantName = form.tenant_desconocido ? 'Desconocido' : form.tenant.trim()
    // activo_ref editable: si el usuario vinculó otro activo con la lupa,
    // lo persistimos. Si no, mantenemos el que ya tenía.
    const activoRefFinal = linkedActivoRef || params?.fromActivoRef || undefined
    const updatePayload = {
      nombre: tenantName, tenant: tenantName,
      tenant_desconocido: form.tenant_desconocido,
      persona_fisica: form.persona_fisica,
      // Heredados del activo · vista principal de /arrendatarios los necesita
      zona: form.zona || null,
      subzona: form.subzona || null,
      area_zona: form.area || null,
      propietario_cuenta: form.propietario || null,
      tenant_mayoritario: form.tenant_mayoritario || null,
      anyo_firma: parseInt(form.anyo_firma)||null,
      trimestre: form.trimestre,
      superficie: parseFloat(form.superficie)||null,
      asking_rent: parseFloat(form.asking_rent)||null,
      closing_rent: parseFloat(form.closing_rent)||null,
      renta: parseFloat(form.closing_rent)||null,
      meses_carencia: parseInt(form.meses_carencia)||null,
      plazas_int: parseInt(form.plazas_int)||0,
      precio_int: parseFloat(form.precio_int)||0,
      plazas_ext: parseInt(form.plazas_ext)||0,
      precio_ext: parseFloat(form.precio_ext)||0,
      aportacion_obras_m2: parseFloat(form.aportacion_obras_m2)||null,
      tipo_contrato: form.tipo_contrato,
      anios_obligado: parseFloat(form.anios_obligado)||null,
      anios_obligado_2: parseFloat(form.anios_obligado_2)||null,
      inicio: parseDate(form.fecha_inicio),
      break_option: parseDate(form.break_option),
      vencimiento: parseDate(form.fecha_fin),
      meses_recordatorio: parseInt(form.meses_recordatorio)||3,
      color: form.color,
      sector: form.sector||null,
      agente_activo: form.agente_activo||null,
      agente_pasivo: form.agente_pasivo||null,
      estado_arr: form.estado||'Vigente',
    }
    if (activoRefFinal !== undefined) updatePayload.activo_ref = activoRefFinal
    // edificio = nombre del activo (cuando se cambió por la lupa)
    if (form.activo) updatePayload.edificio = form.activo
    const { error } = await supabase.from('arrendatarios').update(updatePayload).eq('ref', loadedRef)
    setSaving(false)
    if (error) { setSaveErr(error.message); return }
    setSaveOk(true); setTimeout(()=>setSaveOk(false),3000)
  }

  const rentaMensual = form.superficie && form.closing_rent
    ? (parseFloat(form.superficie)*parseFloat(form.closing_rent)).toLocaleString('es-ES',{minimumFractionDigits:0,maximumFractionDigits:0})
    : '—'
  const aportacionTotal = form.superficie && form.aportacion_obras_m2
    ? (parseFloat(form.superficie)*parseFloat(form.aportacion_obras_m2)).toLocaleString('es-ES')
    : '—'
  const fechaRecordatorio = calcRecordatorio(form.break_option, parseInt(form.meses_recordatorio)||3)
  const diasBreak = diasHasta(form.break_option)
  const diasRecord = diasHasta(fechaRecordatorio)

  const ESTADO_COLOR = { 'Activo':'var(--green)', 'Próximo a vencimiento':'var(--red)', 'En negociación':'var(--purple)', 'Renovado':'var(--accent)', 'Finalizado':'var(--text4)' }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="action-bar">
        <button className="ab-btn save" onClick={(fromDarBaja || loadedRef) ? handleSaveUpdate : handleSave} disabled={saving}>{saving ? 'Guardando...' : (loadedRef ? '💾 Guardar cambios' : '💾 Guardar')}</button>
        {!isNew && !fromDarBaja && <button className="ab-btn">Nuevo</button>}
        {!isNew && !fromDarBaja && <button className="ab-btn">Desactivar</button>}
        <div className="ab-sep"/>
        {(params?.fromActivoRef || fromDarBaja || fromActivo) && <button className="ab-btn blue" onClick={()=>navigate('ficha-activo',{ref:params?.fromActivoRef||(fromDarBaja?(form.activo||params?.arrRef):undefined)})}>Ver activo</button>}
        {!isNew && !fromDarBaja && !params?.fromActivoRef && <button className="ab-btn blue" onClick={()=>navigate('ficha-demanda')}>🔍 Crear demanda</button>}
        <button className="ab-btn" onClick={()=>
          params?.fromActivoRef ? navigate('ficha-activo',{ref:params.fromActivoRef, tab: params?.fromActivoTab || 'at-prop'})
          : fromDarBaja  ? navigate('arrendatarios')
          : fromOferta  ? navigate('ficha-oferta',{ofertaRef:params.fromOfertaRef})
          : fromActivo ? navigate('ficha-activo',{ref:params.fromActivoRef, tab: params?.fromActivoTab || 'at-stacking'})
          : fromTenantClick ? navigate(-1)
          : navigate('arrendatarios')}>
          ← {params?.fromActivoRef ? `Volver a ${params?.fromActivoNombre || 'activo'}` : fromDarBaja ? 'Ir al listado' : fromOferta ? 'Volver a la oferta' : fromActivo ? 'Volver al activo' : 'Volver'}
        </button>
        <div className="ab-sep"/>
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
        {saveOk  && <span style={{fontSize:11,color:'var(--green)',marginLeft:8}}>✓ Arrendatario guardado</span>}
        {saveErr && <span style={{fontSize:11,color:'var(--red)',marginLeft:8}}>{saveErr}</span>}
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">
          {/* Validation banner */}
          {validationErrors.length > 0 && (
            <div style={{margin:'0 0 0 0',padding:'10px 16px',background:'var(--red-lt)',borderBottom:'1px solid var(--red-bd)',display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{color:'var(--red)',fontWeight:700,fontSize:12,flexShrink:0}}>⚠ Campos obligatorios incompletos:</span>
              <span style={{fontSize:11,color:'var(--red)',lineHeight:1.5}}>{validationErrors.join(' · ')}</span>
              <button onClick={()=>setValidationErrors([])} style={{marginLeft:'auto',background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:14,lineHeight:1,flexShrink:0}}>✕</button>
            </div>
          )}

          {/* Banner "creación desde oferta" */}
          {fromOferta && (
            <div style={{padding:'8px 16px',background:'#faf5ec',borderBottom:'1px solid #ece0c9',fontSize:11,color:'#5a4828',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontWeight:700}}>Creación desde oferta</span>
              <span>·</span>
              <span>Vinculado a <strong>{params?.fromOfertaRef}</strong>{params?.fromActivoNombre ? ` · Activo: ${params.fromActivoNombre}` : ''}</span>
              <span style={{marginLeft:'auto',color:'#60a5fa',fontSize:10}}>Los campos marcados con * son obligatorios para guardar</span>
            </div>
          )}
          {/* Banner "creación desde activo" */}
          {fromActivo && (
            <div style={{padding:'8px 14px',background:'#faf5ec',border:'1px solid #ece0c9',borderRadius:'var(--r)',margin:'0 0 12px',fontSize:11,color:'#5a4828',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontWeight:700}}>Nuevo arrendatario</span>
              <span style={{color:'#B08D57'}}>·</span>
              Activo: <strong>{params?.fromActivoNombre || params?.fromActivoRef}</strong>
              <span style={{marginLeft:'auto',color:'#60a5fa',fontSize:10}}>Los campos marcados con * son obligatorios</span>
            </div>
          )}

          {/* Header */}
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#0f766e,#14b8a6)',fontSize:18}}></div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'var(--teal-lt)',color:'var(--teal)',border:'1px solid var(--teal-bd)',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>ARRENDATARIO</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>{isNew ? 'NUEVO' : fromTenantClick ? params.tenantName : 'ARR-2501'}</span>
                  <span className={`tag ${form.estado==='Activo'?'tag-green':form.estado==='Próximo a vencimiento'?'tag-red':form.estado==='En negociación'?'tag-purple':'tag-gray'}`}>{form.estado}</span>
                  {isNew && <span style={{background:'#f5efe5',color:'#5a4828',border:'1px solid #ece0c9',padding:'0 6px',borderRadius:3,fontSize:9,fontWeight:700}}>DESDE OFERTA</span>}
                </div>
                <div className="ah-name">{form.tenant_desconocido ? 'Arrendatario desconocido' : (form.tenant || <span style={{color:'var(--text4)',fontStyle:'italic'}}>Sin nombre</span>)} {form.activo ? `— ${form.activo}` : ''}</div>
                <div className="ah-addr">📍 {form.zona} · {form.subzona} · Inicio: {form.fecha_inicio} · Break: {form.break_option} · Fin: {form.fecha_fin}</div>
                <div className="ah-tags">
                  <span className="tag tag-teal">{form.sector}</span>
                  <span className="tag tag-blue">{form.area}</span>
                  <span className="tag tag-gray">{parseFloat(form.superficie||0).toLocaleString('es-ES')} m²</span>
                  <span className="tag tag-green">{form.closing_rent} €/m²/mes</span>
                  {diasBreak !== null && diasBreak <= 90 && (
                    <span style={{background:'var(--red-lt)',color:'var(--red)',border:'1px solid var(--red-bd)',padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700}}>
                      ⚠ Break option {diasBreak < 0 ? `vencida ${Math.abs(diasBreak)}d` : `en ${diasBreak}d`}
                    </span>
                  )}
                </div>
              </div>
              {/* KPIs económicos a la derecha del título */}
              <div style={{ display:'flex', alignItems:'stretch', gap:0, flexShrink:0, border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', background:'var(--surface)' }}>
                {(() => {
                  const sup       = parseFloat(form.superficie || 0)
                  const closing   = parseFloat(form.closing_rent || 0)
                  const rentaMes  = sup && closing ? sup * closing : 0
                  const rentaAno  = rentaMes * 12
                  const carencia  = parseInt(form.meses_carencia || 0)
                  const aportTot  = parseFloat(String(aportacionTotal).replace(/[^0-9.]/g,'')) || 0
                  const items = [
                    { lbl:'Closing rent', val: closing > 0 ? closing.toFixed(2) : '—',                                            sub:'€/m²/mes',  color:'var(--accent)' },
                    { lbl:'Renta mensual',val: rentaMes > 0 ? Math.round(rentaMes).toLocaleString('es-ES') : '—',                  sub:'€/mes',     color:'var(--green)' },
                    { lbl:'Renta anual',  val: rentaAno > 0 ? `${(rentaAno/1000).toFixed(0)}k` : '—',                              sub:'€/año',     color:'var(--green)' },
                    { lbl:'Superficie',   val: sup > 0 ? sup.toLocaleString('es-ES') : '—',                                       sub:'m²',         color:'var(--text1)' },
                    { lbl:'Carencia',     val: carencia > 0 ? `${carencia}m` : '—',                                                sub:'meses',      color:'var(--text1)' },
                    { lbl:'Aportación',   val: aportTot > 0 ? `${(aportTot/1000).toFixed(0)}k` : '—',                              sub:'€ obras',    color: aportTot > 0 ? 'var(--accent)' : 'var(--text4)' },
                  ]
                  return items.map((k, i) => (
                    <div key={k.lbl} style={{ padding:'10px 14px', textAlign:'center', minWidth:80, borderLeft: i === 0 ? 'none' : '1px solid var(--border)' }}>
                      <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{k.lbl}</div>
                      <div style={{ fontSize:22, fontWeight:800, fontFamily:'var(--mono)', color:k.color, lineHeight:1 }}>{k.val}</div>
                      <div style={{ fontSize:9, color:'var(--text4)', marginTop:3 }}>{k.sub}</div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>

          <div className="tabs">
            {TABS.map((t,i)=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{TAB_LABELS[i]}</div>)}
          </div>

          {/* Tab Datos */}
          {tab==='datos' && (
            <div className="tab-content active">
              <div className="info-pad" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 40px',alignItems:'start',padding:'28px 36px'}}>

                {/* Columna 1 — Inquilino */}
                <div style={{minWidth:0}}>
                  <Section title="Inquilino">
                      {/* Activo · lupa para vincular; si ya hay activo, chip clicable + ✕ para cambiar */}
                      <FField label="Activo" req invalid={invalidFields.has('activo')}>
                        {form.activo ? (
                          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',background:'var(--accent-lt)',width:'100%'}}>
                            <span
                              onClick={() => {
                                const ref = linkedActivoRef || params?.fromActivoRef
                                if (ref) navigate('ficha-activo', { ref })
                                else navigate('ficha-activo')
                              }}
                              style={{fontWeight:600,color:'var(--accent)',fontSize:12,flex:1,cursor:'pointer',textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:2}}
                              title="Abrir ficha del activo"
                            >{form.activo_direccion || form.activo} ↗</span>
                            <button onClick={() => { set('activo',''); set('activo_direccion',''); set('propietario',''); set('zona',''); set('subzona',''); set('area',''); set('uso','') }} style={{fontSize:11,color:'var(--text4)',background:'none',border:'none',cursor:'pointer'}} title="Cambiar activo">✕</button>
                          </div>
                        ) : (
                          <div style={{position:'relative'}}>
                            <input
                              className="of-inp"
                              placeholder="🔍 Buscar activo..."
                              value={activoSearch}
                              onChange={e => { setActivoSearch(e.target.value); setShowActivoDD(true) }}
                              onFocus={() => setShowActivoDD(true)}
                              onBlur={() => setTimeout(() => setShowActivoDD(false), 200)}
                              style={{ fontStyle: activoSearch ? 'normal' : 'italic' }}
                            />
                            {showActivoDD && activoSearch.length >= 2 && (
                              <div style={{position:'absolute',top:'100%',left:0,right:0,minWidth:300,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.18)',zIndex:9999,maxHeight:240,overflowY:'auto',marginTop:2}}>
                                {activoResults.length === 0 ? (
                                  <div style={{padding:'10px 12px',color:'var(--text4)',fontSize:11}}>Sin resultados</div>
                                ) : activoResults.map(a => (
                                  <div key={a.ref} onMouseDown={() => linkActivo(a)}
                                    style={{padding:'7px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',fontSize:11}}>
                                    <div style={{fontWeight:600}}>{a.nombre}</div>
                                    <div style={{color:'var(--text4)',fontSize:10,marginTop:2}}>{[a.ref, a.uso, a.zona].filter(Boolean).join(' · ')}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </FField>
                      <FField label="Dirección">
                        {form.activo_direccion
                          ? <div style={{padding:'6px 9px',border:'1px solid var(--border2)',borderRadius:'var(--r)',fontSize:12,color:'var(--text2)'}}>{form.activo_direccion}</div>
                          : <div style={{padding:'6px 9px',border:'1px solid var(--border)',borderRadius:'var(--r)',fontSize:12,fontStyle:'italic',color:'var(--text4)'}}>por completar</div>}
                      </FField>

                      {/* Campos heredados del activo · read-only cuando hay activo */}
                      {(() => {
                        const lock = !!form.activo
                        const ReadOnly = ({value, placeholder='por completar'}) => (
                          <div style={{padding:'6px 9px',border:'1px solid var(--border2)',borderRadius:'var(--r)',fontSize:12,color:value?'var(--text2)':'var(--text4)',fontStyle:value?'normal':'italic',background:'var(--gray-lt)'}}>{value || placeholder}</div>
                        )
                        return (
                          <>
                            <FField label="Zona">
                              {lock
                                ? <ReadOnly value={form.zona}/>
                                : <input className="of-inp" value={form.zona||''} onChange={e=>set('zona',e.target.value)} placeholder="por completar" style={{ fontStyle: form.zona ? 'normal' : 'italic' }}/>}
                            </FField>
                            <FField label="Sub-zona">
                              {lock
                                ? <ReadOnly value={form.subzona}/>
                                : <input className="of-inp" value={form.subzona||''} onChange={e=>set('subzona',e.target.value)} placeholder="por completar" style={{ fontStyle: form.subzona ? 'normal' : 'italic' }}/>}
                            </FField>
                            <FField label="Área">
                              {lock
                                ? <ReadOnly value={form.area}/>
                                : <select className="of-sel" value={form.area} onChange={e=>set('area',e.target.value)} style={{ color: form.area ? 'var(--text)' : 'var(--text4)', fontStyle: form.area ? 'normal' : 'italic' }}>
                                    <option value="">por completar</option>
                                    <option>CBD</option><option>Centro</option><option>Descentralizado</option><option>Periferia</option><option>Corredor de Carretera</option>
                                  </select>}
                            </FField>
                            <FField label="Uso">
                              {lock
                                ? <ReadOnly value={form.uso}/>
                                : <input className="of-inp" value={form.uso||''} onChange={e=>set('uso',e.target.value)} placeholder="por completar" style={{ fontStyle: form.uso ? 'normal' : 'italic' }}/>}
                            </FField>
                          </>
                        )
                      })()}

                      <div style={{display:'flex',gap:12,marginBottom:8}}>
                        <label style={{display:'flex',alignItems:'center',gap:5,fontSize:11,cursor:'pointer'}}>
                          <input type="checkbox" checked={form.persona_fisica} onChange={e=>set('persona_fisica',e.target.checked)} style={{accentColor:'var(--accent)'}}/>
                          Persona física
                        </label>
                        <label style={{display:'flex',alignItems:'center',gap:5,fontSize:11,cursor:'pointer'}}>
                          <input
                            type="checkbox"
                            checked={form.tenant_desconocido}
                            onChange={e => {
                              const checked = e.target.checked
                              set('tenant_desconocido', checked)
                              if (checked) {
                                // Al marcar desconocido, limpiar cualquier cuenta seleccionada
                                set('tenant', '')
                                setTenantSearch('')
                                setShowTenantDD(false)
                              }
                            }}
                            style={{accentColor:'var(--accent)'}}
                          />
                          Arrendatario desconocido
                        </label>
                      </div>

                      {/* Arrendatario (cuenta) — buscador lupa sobre dynamics_accounts.
                          Bloqueado cuando se marca "Arrendatario desconocido". */}
                      <FField label="Arrendatario (cuenta)" req={!form.tenant_desconocido} invalid={invalidFields.has('tenant')}>
                        {form.tenant_desconocido ? (
                          <div style={{padding:'6px 9px',border:'1px dashed var(--border)',borderRadius:'var(--r)',fontSize:11,color:'var(--text4)',fontStyle:'italic',background:'var(--gray-lt)'}}>
                            Arrendatario desconocido — desmarca la casilla para buscar una cuenta
                          </div>
                        ) : form.tenant ? (
                          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',background:'var(--accent-lt)',width:'100%'}}>
                            <span style={{fontWeight:600,color:'var(--accent)',fontSize:12,flex:1}}>{form.tenant}</span>
                            <button onClick={() => set('tenant','')} style={{fontSize:11,color:'var(--text4)',background:'none',border:'none',cursor:'pointer'}}>✕</button>
                          </div>
                        ) : (
                          <div style={{position:'relative'}}>
                            <input
                              className="of-inp"
                              placeholder="🔍 Buscar cuenta..."
                              value={tenantSearch}
                              onChange={e => { setTenantSearch(e.target.value); setShowTenantDD(true) }}
                              onFocus={() => setShowTenantDD(true)}
                              onBlur={() => setTimeout(() => setShowTenantDD(false), 200)}
                              style={{ fontStyle: tenantSearch ? 'normal' : 'italic' }}
                            />
                            {showTenantDD && tenantSearch.length >= 2 && (
                              <div style={{position:'absolute',top:'100%',left:0,right:0,minWidth:300,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.18)',zIndex:9999,maxHeight:240,overflowY:'auto',marginTop:2}}>
                                {tenantResults.length === 0 ? (
                                  <div style={{padding:'10px 12px',color:'var(--text4)',fontSize:11}}>Sin resultados</div>
                                ) : tenantResults.map(a => (
                                  <div key={a.dynamics_id} onMouseDown={() => { set('tenant', a.nombre); setTenantSearch(''); setShowTenantDD(false) }}
                                    style={{padding:'7px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',fontSize:11}}>
                                    <div style={{fontWeight:600}}>{a.nombre}</div>
                                    <div style={{color:'var(--text4)',fontSize:10,marginTop:2}}>{[a.tipo, a.sector].filter(Boolean).join(' · ') || a.dynamics_id}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </FField>

                      {/* Arrendatario mayoritario (cuenta) — buscador lupa */}
                      <FField label="Arrendatario mayoritario (cuenta)">
                        {form.tenant_mayoritario ? (
                          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',background:'var(--accent-lt)',width:'100%'}}>
                            <span style={{fontWeight:600,color:'var(--accent)',fontSize:12,flex:1}}>{form.tenant_mayoritario}</span>
                            <button onClick={() => set('tenant_mayoritario','')} style={{fontSize:11,color:'var(--text4)',background:'none',border:'none',cursor:'pointer'}}>✕</button>
                          </div>
                        ) : (
                          <div style={{position:'relative'}}>
                            <input
                              className="of-inp"
                              placeholder="🔍 Buscar cuenta..."
                              value={mayorSearch}
                              onChange={e => { setMayorSearch(e.target.value); setShowMayorDD(true) }}
                              onFocus={() => setShowMayorDD(true)}
                              onBlur={() => setTimeout(() => setShowMayorDD(false), 200)}
                              style={{ fontStyle: mayorSearch ? 'normal' : 'italic' }}
                            />
                            {showMayorDD && mayorSearch.length >= 2 && (
                              <div style={{position:'absolute',top:'100%',left:0,right:0,minWidth:300,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.18)',zIndex:9999,maxHeight:240,overflowY:'auto',marginTop:2}}>
                                {mayorResults.length === 0 ? (
                                  <div style={{padding:'10px 12px',color:'var(--text4)',fontSize:11}}>Sin resultados</div>
                                ) : mayorResults.map(a => (
                                  <div key={a.dynamics_id} onMouseDown={() => { set('tenant_mayoritario', a.nombre); setMayorSearch(''); setShowMayorDD(false) }}
                                    style={{padding:'7px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',fontSize:11}}>
                                    <div style={{fontWeight:600}}>{a.nombre}</div>
                                    <div style={{color:'var(--text4)',fontSize:10,marginTop:2}}>{[a.tipo, a.sector].filter(Boolean).join(' · ') || a.dynamics_id}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </FField>

                      {/* Propietario (cuenta) — auto-link desde el activo, read-only */}
                      <FField label="Propietario (cuenta)">
                        {form.propietario
                          ? <div style={{padding:'6px 9px',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',fontSize:12,color:'var(--accent)',fontWeight:600,background:'var(--accent-lt)'}}>{form.propietario}</div>
                          : <div style={{padding:'6px 9px',border:'1px solid var(--border)',borderRadius:'var(--r)',fontSize:12,fontStyle:'italic',color:'var(--text4)'}}>por completar</div>}
                      </FField>

                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <FField label="Año firma" invalid={invalidFields.has('anyo_firma')}><input className="of-inp" placeholder="por completar" style={{ fontStyle: form.anyo_firma ? 'normal' : 'italic' }} value={form.anyo_firma} onChange={e=>set('anyo_firma',e.target.value)}/></FField>
                        <FField label="Trimestre" invalid={invalidFields.has('trimestre')}>
                          <select className="of-sel" value={form.trimestre} onChange={e=>set('trimestre',e.target.value)} style={{ color: form.trimestre ? 'var(--text)' : 'var(--text4)', fontStyle: form.trimestre ? 'normal' : 'italic' }}>
                            <option value="">por completar</option>
                            <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                          </select>
                        </FField>
                      </div>
                      <FField label="Sector actividad">
                        <select className="of-sel" value={form.sector} onChange={e=>set('sector',e.target.value)} style={{ color: form.sector ? 'var(--text)' : 'var(--text4)', fontStyle: form.sector ? 'normal' : 'italic' }}>
                          <option value="">por completar</option>
                          <option>Tecnología</option><option>Logística</option><option>Sanidad</option><option>Comunicación / Media</option><option>Finanzas / Inversión</option><option>Consultoría</option><option>Retail / Distribución</option><option>Hostelería</option>
                        </select>
                      </FField>
                      <FField label="Estado contrato">
                        <select className="of-sel" value={form.estado} onChange={e=>set('estado',e.target.value)} style={{ color: form.estado ? 'var(--text)' : 'var(--text4)', fontStyle: form.estado ? 'normal' : 'italic' }}>
                          <option value="">por completar</option>
                          <option>Activo</option><option>Próximo a vencimiento</option><option>En negociación</option><option>Renovado</option><option>Finalizado</option>
                        </select>
                      </FField>
                      <FField label="Color identificativo">
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <input type="color" value={form.color} onChange={e=>set('color',e.target.value)} style={{width:36,height:28,border:'1px solid var(--border)',borderRadius:'var(--r)',cursor:'pointer',padding:2}}/>
                          <span style={{fontSize:11,color:'var(--text3)'}}>Para stacking plan</span>
                        </div>
                      </FField>
                  </Section>
                </div>

                {/* Columna 2 — Condiciones / Aparcamiento / Intervinientes */}
                <div style={{minWidth:0}}>
                  <Section title="Condiciones económicas" tinted>
                      <FField label="Superficie total ocupada (m²)" req invalid={invalidFields.has('superficie')}>
                        {form.superficie
                          ? <input className="of-inp" value={form.superficie} onChange={e=>set('superficie',e.target.value)} style={{fontFamily:'var(--mono)'}}/>
                          : <div style={{padding:'6px 9px',border:'1px dashed var(--border)',borderRadius:'var(--r)',fontSize:12,color:'var(--text4)',fontStyle:'italic',background:'var(--gray-lt)'}}>por asignar en stacking plan</div>}
                      </FField>
                      <FField label="Asking rent (€/m²/mes)"><input className="of-inp" placeholder="por completar" style={{ fontStyle: form.asking_rent ? 'normal' : 'italic' }} value={form.asking_rent} onChange={e=>set('asking_rent',e.target.value)}/></FField>
                      <FField label="Closing rent (€/m²/mes)" req invalid={invalidFields.has('closing_rent')}><input className="of-inp" placeholder="por completar" style={{ fontStyle: form.closing_rent ? 'normal' : 'italic' }} value={form.closing_rent} onChange={e=>set('closing_rent',e.target.value)}/></FField>
                      <FField label="Renta mensual (€)">
                        <div style={{padding:'6px 9px',border:'1px solid var(--border)',borderRadius:'var(--r)',fontSize:12,fontWeight:700,color: rentaMensual ? 'var(--accent)' : 'var(--text4)', fontStyle: rentaMensual ? 'normal' : 'italic',background:'var(--gray-lt)'}}>{rentaMensual ? `${rentaMensual} €` : 'por completar'}</div>
                      </FField>
                      <FField label="Nº meses carencia"><input className="of-inp" placeholder="por completar" style={{ fontStyle: form.meses_carencia ? 'normal' : 'italic' }} value={form.meses_carencia} onChange={e=>set('meses_carencia',e.target.value)}/></FField>
                  </Section>

                  <Section title="Aparcamiento">
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>
                      <FField label="Plazas interior"><input className="of-inp" placeholder="por completar" style={{ fontStyle: form.plazas_int ? 'normal' : 'italic' }} value={form.plazas_int} onChange={e=>set('plazas_int',e.target.value)}/></FField>
                      <FField label="Precio/plaza int. (€)"><input className="of-inp" placeholder="por completar" style={{ fontStyle: form.precio_int ? 'normal' : 'italic' }} value={form.precio_int} onChange={e=>set('precio_int',e.target.value)}/></FField>
                      <FField label="Plazas exterior"><input className="of-inp" placeholder="por completar" style={{ fontStyle: form.plazas_ext ? 'normal' : 'italic' }} value={form.plazas_ext} onChange={e=>set('plazas_ext',e.target.value)}/></FField>
                      <FField label="Precio/plaza ext. (€)"><input className="of-inp" placeholder="por completar" style={{ fontStyle: form.precio_ext ? 'normal' : 'italic' }} value={form.precio_ext} onChange={e=>set('precio_ext',e.target.value)}/></FField>
                    </div>
                  </Section>

                  <Section title="Intervinientes" tinted>
                    <FField label="Agente activo">
                      <select className="of-sel" value={form.agente_activo} onChange={e=>set('agente_activo',e.target.value)}>
                        <option>Sierra Alvaro</option><option>GOMEZ Ignacio</option><option>García Marta</option><option>López Carmen</option>
                      </select>
                    </FField>
                    <FField label="Agente pasivo (cobroker)"><input className="of-inp" value={form.agente_pasivo} onChange={e=>set('agente_pasivo',e.target.value)}/></FField>
                  </Section>
                </div>

                {/* Columna 3 — Workplace / Contrato / Acción comercial */}
                <div style={{minWidth:0}}>
                  <Section title="Workplace">
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>
                      <FField label="Aportación obras (€/m²)"><input className="of-inp" value={form.aportacion_obras_m2} onChange={e=>set('aportacion_obras_m2',e.target.value)}/></FField>
                      <FField label="Aportación total (€)">
                        <div style={{padding:'6px 9px',border:'1px solid var(--border)',borderRadius:'var(--r)',fontSize:12,fontWeight:700,color:'var(--accent)',background:'var(--gray-lt)'}}>{aportacionTotal} €</div>
                      </FField>
                    </div>
                  </Section>

                  <Section title="Contrato" tinted>
                      <FField label="Tipo de contrato">
                        <select className="of-sel" value={form.tipo_contrato} onChange={e=>set('tipo_contrato',e.target.value)}>
                          <option>Alquiler comercial</option><option>Alquiler industrial</option><option>Arrendamiento mixto</option>
                        </select>
                      </FField>
                      <FField label="Obligado cumplimiento del primer periodo (años)" req invalid={invalidFields.has('anios_obligado')}><input className="of-inp" value={form.anios_obligado} onChange={e=>set('anios_obligado',e.target.value)} placeholder="ej. 3"/></FField>
                      <FField label="Fecha inicio" req invalid={invalidFields.has('fecha_inicio')}>
                        <input type="date" className="of-inp" value={toInputDate(form.fecha_inicio)} onChange={e=>set('fecha_inicio',fromInputDate(e.target.value))}/>
                      </FField>
                      <FField label="Break option (automática — calculada)">
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <input type="date" className="of-inp" value={toInputDate(form.break_option)} onChange={e=>set('break_option',fromInputDate(e.target.value))} style={{flex:1}}/>
                          {form.break_option && <span style={{fontSize:9,color:'var(--accent)',fontWeight:700,flexShrink:0,padding:'2px 6px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:3}}>AUTO</span>}
                        </div>
                      </FField>
                      <FField label="Años obligado cumplimiento del segundo periodo"><input className="of-inp" value={form.anios_obligado_2} onChange={e=>set('anios_obligado_2',e.target.value)} placeholder="ej. 2"/></FField>
                      <FField label="Fecha fin contrato (automática — calculada)">
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <input type="date" className="of-inp" value={toInputDate(form.fecha_fin)} onChange={e=>set('fecha_fin',fromInputDate(e.target.value))} style={{flex:1}}/>
                          {form.fecha_fin && <span style={{fontSize:9,color:'var(--accent)',fontWeight:700,flexShrink:0,padding:'2px 6px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:3}}>AUTO</span>}
                        </div>
                      </FField>
                      <FField label="Fecha salida efectiva">
                        <input type="date" className="of-inp" value={toInputDate(form.fecha_salida)} onChange={e=>set('fecha_salida',fromInputDate(e.target.value))}/>
                      </FField>
                  </Section>

                  <Section title="Acción comercial">
                    <FField label="Recordatorio (meses antes de break option)" req invalid={invalidFields.has('meses_recordatorio')}>
                      <input className="of-inp" type="number" value={form.meses_recordatorio} onChange={e=>set('meses_recordatorio',e.target.value)} min="1" max="24"/>
                    </FField>
                    <FField label="Fecha recordatorio (automática)">
                      <div style={{padding:'6px 9px',border:'1px solid var(--border)',borderRadius:'var(--r)',fontSize:12,fontWeight:700,color:diasRecord!==null&&diasRecord<=0?'var(--red)':diasRecord!==null&&diasRecord<=30?'var(--amber)':'var(--text)',background:'var(--gray-lt)'}}>
                        {fechaRecordatorio}
                        {diasRecord!==null&&diasRecord<=0&&<span style={{fontSize:10,fontWeight:700,color:'var(--red)',marginLeft:8}}>⚠ Vencida</span>}
                        {diasRecord!==null&&diasRecord>0&&diasRecord<=30&&<span style={{fontSize:10,fontWeight:700,color:'var(--amber)',marginLeft:8}}>En {diasRecord}d</span>}
                      </div>
                    </FField>
                  </Section>
                </div>

              </div>
            </div>
          )}

          {/* Tab Condiciones económicas */}
          {tab==='condiciones' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'var(--border)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden',marginBottom:16}}>
                  {[
                    ['Closing rent','12,50 €/m²/mes','var(--accent)'],
                    ['Renta mensual',`${rentaMensual} €`,'var(--text)'],
                    ['Renta anual',`${form.superficie&&form.closing_rent?(parseFloat(form.superficie)*parseFloat(form.closing_rent)*12/1000).toFixed(0)+'k €':'—'}`,'var(--text)'],
                    ['Plazas interior',`${form.plazas_int} × ${form.precio_int} €`,'var(--text3)'],
                  ].map(([l,v,c],i)=>(
                    <div key={i} style={{background:'var(--surface)',padding:12,textAlign:'center'}}>
                      <div style={{fontSize:9,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>{l}</div>
                      <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
                <table className="pat-table">
                  <thead><tr><th>Concepto</th><th>Valor</th><th>Observaciones</th></tr></thead>
                  <tbody>
                    <tr><td style={{fontWeight:500}}>Asking rent</td><td>{form.asking_rent} €/m²/mes</td><td style={{color:'var(--text4)',fontSize:10}}>Precio inicial ofertado</td></tr>
                    <tr><td style={{fontWeight:500}}>Closing rent</td><td style={{color:'var(--accent)',fontWeight:700}}>{form.closing_rent} €/m²/mes</td><td style={{color:'var(--text4)',fontSize:10}}>Precio negociado final</td></tr>
                    <tr><td style={{fontWeight:500}}>Carencia</td><td>{form.meses_carencia} meses</td><td style={{color:'var(--text4)',fontSize:10}}>Sin coste de renta</td></tr>
                    <tr><td style={{fontWeight:500}}>Superficie</td><td>{parseFloat(form.superficie||0).toLocaleString('es-ES')} m²</td><td style={{color:'var(--text4)',fontSize:10}}>Total ocupada</td></tr>
                    <tr><td style={{fontWeight:500}}>Plazas interior</td><td>{form.plazas_int} × {form.precio_int} €/mes</td><td style={{color:'var(--text4)',fontSize:10}}>{(parseInt(form.plazas_int||0)*parseInt(form.precio_int||0)).toLocaleString('es-ES')} €/mes</td></tr>
                    <tr><td style={{fontWeight:500}}>Aportación en obras</td><td>{form.aportacion_obras_m2} €/m²</td><td style={{color:'var(--text4)',fontSize:10}}>Total: {aportacionTotal} €</td></tr>
                    <tr><td style={{fontWeight:500}}>Agente activo</td><td>{form.agente_activo}</td><td style={{color:'var(--text4)',fontSize:10}}>Savills</td></tr>
                    <tr><td style={{fontWeight:500}}>Agente pasivo</td><td>{form.agente_pasivo||'—'}</td><td style={{color:'var(--text4)',fontSize:10}}>Cobroker externo</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Alertas */}
          {tab==='alertas' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Alertas y acción comercial</div>

                {/* Estado actual */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
                  {[
                    {label:'Break option',fecha:form.break_option,dias:diasBreak},
                    {label:'Fecha recordatorio',fecha:fechaRecordatorio,dias:diasRecord},
                    {label:'Fin contrato',fecha:form.fecha_fin,dias:diasHasta(form.fecha_fin)},
                  ].map((item,i)=>{
                    const alerta = item.dias!==null&&item.dias<=0 ? 'red' : item.dias!==null&&item.dias<=90 ? 'amber' : 'normal'
                    return (
                      <div key={i} style={{border:`1px solid ${alerta==='red'?'var(--red-bd)':alerta==='amber'?'var(--amber-bd)':'var(--border)'}`,background:alerta==='red'?'var(--red-lt)':alerta==='amber'?'var(--amber-lt)':'var(--surface)',borderRadius:'var(--r2)',padding:14,textAlign:'center'}}>
                        <div style={{fontSize:10,fontWeight:700,color:alerta==='red'?'var(--red)':alerta==='amber'?'var(--amber)':'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>{item.label}</div>
                        <div style={{fontSize:18,fontWeight:700,color:alerta==='red'?'var(--red)':alerta==='amber'?'var(--amber)':'var(--text)'}}>{item.fecha}</div>
                        {item.dias!==null&&<div style={{fontSize:11,marginTop:4,color:alerta==='red'?'var(--red)':alerta==='amber'?'var(--amber)':'var(--text3)'}}>
                          {item.dias<0?`Vencida hace ${Math.abs(item.dias)}d`:item.dias===0?'Hoy':`En ${item.dias} días`}
                        </div>}
                      </div>
                    )
                  })}
                </div>

                {/* Acciones comerciales */}
                <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:16}}>
                  <div style={{padding:'10px 14px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:700}}>Acciones comerciales recomendadas</div>
                  <div style={{padding:14,display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',border:'1px solid var(--red-bd)',background:'var(--red-lt)',borderRadius:'var(--r)'}}>
                      <span style={{fontSize:20}}>⚠️</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:700,color:'var(--red)'}}>Break option vencida — acción urgente</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>Oracle Spain SL tenía break option el 01/07/2024. Verificar si ejercieron o continúan. Contrato vence jun 2026.</div>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button className="ab-btn" style={{fontSize:10,padding:'3px 9px'}}>Llamar</button>
                        <button className="ab-btn save" style={{fontSize:10,padding:'3px 9px'}} onClick={()=>navigate('ficha-actividad')}>+ Crear actividad</button>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',border:'1px solid var(--amber-bd)',background:'var(--amber-lt)',borderRadius:'var(--r)'}}>
                      <span style={{fontSize:20}}>📅</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:700,color:'var(--amber)'}}>Contrato vence en junio 2026 — iniciar conversación</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>Quedan ~{diasHasta(form.fecha_fin)} días. Recomendar iniciar negociación de renovación o búsqueda de alternativas.</div>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button className="ab-btn" style={{fontSize:10,padding:'3px 9px'}} onClick={()=>navigate('ficha-demanda')}>🔍 Crear demanda</button>
                        <button className="ab-btn save" style={{fontSize:10,padding:'3px 9px'}}>📧 Enviar propuesta</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuración alertas */}
                <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:700}}>Configuración de notificaciones</div>
                  <div style={{padding:14}}>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {[
                        {label:'Notificar al responsable del arrendatario',checked:true},
                        {label:'Notificar a equipos asignados',checked:true},
                        {label:'Crear actividad automática al alcanzar recordatorio',checked:false},
                        {label:'Enviar resumen semanal de contratos próximos a vencer',checked:true},
                      ].map((item,i)=>(
                        <label key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,cursor:'pointer'}}>
                          <input type="checkbox" defaultChecked={item.checked} style={{accentColor:'var(--accent)'}}/>
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Stacking plan — mismo componente compartido, capa 'arr' */}
          {tab==='stacking' && (
            <div className="tab-content active">
              <div className="info-pad">
                {(() => {
                  // Guard: el arrendatario debe estar persistido antes de poder
                  // asignarlo al stacking. Si no, la sup no se vincularía a su ref.
                  if (!loadedRef) {
                    return (
                      <div style={{ padding:32, textAlign:'center', color:'var(--text3)', fontSize:13, background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:6 }}>
                        <div style={{ fontWeight:700, marginBottom:8, color:'#7c2d12', fontSize:14 }}>Guarda primero los datos del arrendatario</div>
                        <div>Vuelve a la pestaña <strong>Datos del arrendatario</strong>, completa los campos obligatorios y pulsa <strong>💾 Guardar</strong>. Después podrás asignarlo al stacking plan.</div>
                      </div>
                    )
                  }
                  const ref = (params?.fromActivoRef || '').trim() || (form.activo || '').trim()
                  if (!ref) {
                    return (
                      <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>
                        Este arrendatario no está vinculado a un activo. Asigna uno desde la pestaña "Datos del arrendatario" para ver su stacking plan.
                      </div>
                    )
                  }
                  if (!stackingActivo) {
                    return (
                      <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>
                        <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
                        <div style={{ marginBottom:8 }}>No encuentro el activo <strong>{ref}</strong> en la BBDD.</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>El stacking plan se nutre del activo, así que primero hay que tenerlo dado de alta.</div>
                      </div>
                    )
                  }
                  const hasStacking = Array.isArray(stackingActivo.stacking_data) && stackingActivo.stacking_data.length > 0
                  return (
                    <>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700 }}>Stacking plan · {stackingActivo.nombre || stackingActivo.ref}</div>
                          <div style={{ fontSize:10, color:'var(--text4)', marginTop:2 }}>
                            Mismo plan que en la ficha del activo y la oferta. Vista por defecto: arrendatarios. Los cambios se sincronizan al activo.
                          </div>
                        </div>
                        <button
                          className="ab-btn"
                          onClick={() => navigate('ficha-activo', { ref: stackingActivo.ref, tab: 'at-stacking' })}
                          style={{ fontSize:11 }}
                        >
                          Abrir en ficha del activo →
                        </button>
                      </div>
                      {!hasStacking && (
                        <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:6, padding:10, marginBottom:10, fontSize:11, color:'#7c2d12' }}>
                          ⚠ Este activo todavía no tiene stacking plan creado. Construirlo aquí lo guarda en la ficha del activo (es el mismo plan).
                        </div>
                      )}
                      <StackingPlan
                        key={stackingActivo.ref}
                        initBuildings={hasStacking ? stackingActivo.stacking_data : []}
                        defaultLabel={stackingActivo.nombre || stackingActivo.direccion || ''}
                        defaultSupPlantaTipo={stackingActivo.sup_planta_tipo || undefined}
                        activoRef={stackingActivo.ref}
                        activoNombre={stackingActivo.nombre || ''}
                        activoPropietario={stackingActivo.propietario || ''}
                        extraTenants={arrTodosActivo}
                        initView="arr"
                        onBuildingsChange={(blds) => {
                          clearTimeout(stackingAutoSaveTimer.current)
                          stackingAutoSaveTimer.current = setTimeout(async () => {
                            // 1) Persistir stacking_data del activo
                            await supabase.from('activos').update({ stacking_data: blds }).eq('ref', stackingActivo.ref)
                            // 2) Sincronizar la superficie del arrendatario actual
                            //    sumando todas las units 'ten' cuyo arr_ref coincide con
                            //    el ref de este arrendatario (loadedRef o ref guardado).
                            const myRef = loadedRef
                            if (myRef) {
                              const totalSup = (blds || []).flatMap(b => b.arr || []).flatMap(r => r.units || [])
                                .filter(u => u.type === 'ten' && u.arr_ref === myRef)
                                .reduce((s,u) => s + (Number(u.sup) || 0), 0)
                              if (totalSup > 0) {
                                await supabase.from('arrendatarios')
                                  .update({ superficie: totalSup })
                                  .eq('ref', myRef)
                                // Reflejar en el form para que el usuario vea el valor actualizado
                                set('superficie', String(totalSup))
                              }
                            }
                          }, 1500)
                        }}
                        onAddTenant={() => navigate('ficha-arrendatario', {
                          fromActivoRef:         stackingActivo.ref,
                          fromActivoNombre:      stackingActivo.nombre || '',
                          fromActivoZona:        stackingActivo.zona || '',
                          fromActivoSba:         stackingActivo.sba || 0,
                          fromActivoPropietario: stackingActivo.propietario || '',
                        })}
                        onTenantClick={(name) => navigate('ficha-arrendatario', {
                          tenantName: name,
                          fromActivoRef: stackingActivo.ref,
                          fromActivoNombre: stackingActivo.nombre || '',
                        })}
                        onRemoveTenant={({ unit, doRemove }) => setBajaArr({ unit, doRemove })}
                      />
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Tab Historial */}
          {tab==='historial' && (
            <div className="tab-content active">
              <div className="info-pad">
                {/* KPI strip */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                  {[
                    {lbl:'Eventos totales',    val:HIST_ACTS.length,                                                     color:'var(--text1)'},
                    {lbl:'Comunicaciones',     val:HIST_ACTS.filter(a=>['Email','Llamada','Reunión'].includes(a.tipo)).length, color:'var(--accent)'},
                    {lbl:'Alertas sistema',    val:HIST_ACTS.filter(a=>a.tipo==='Alerta').length,                         color:'var(--red)'},
                    {lbl:'Modificaciones',     val:HIST_ACTS.filter(a=>a.tipo==='Modificación'||a.tipo==='Nota').length,  color:'var(--amber)'},
                  ].map(k=>(
                    <div key={k.lbl} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 12px',textAlign:'center'}}>
                      <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>{k.lbl}</div>
                      <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:k.color}}>{k.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:600}}>Historial del arrendatario <span style={{fontSize:10,fontWeight:400,color:'var(--text4)'}}>· AUDITABLE</span></div>
                  <button className="ab-btn blue">+ Registrar actividad</button>
                </div>
                <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr>{['','ID','Tipo','Descripción','Fecha','Usuario','Origen'].map(h=>(
                        <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {[...HIST_ACTS].reverse().map(a=>(
                        <tr key={a.id} style={{borderBottom:'1px solid var(--border)'}}>
                          <td style={{padding:'7px 10px',width:30}}>
                            <div style={{width:26,height:26,borderRadius:'50%',background:a.bg,color:a.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>{a.initials}</div>
                          </td>
                          <td style={{padding:'7px 12px'}}><span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text3)'}}>{a.id}</span></td>
                          <td style={{padding:'7px 12px'}}><span className={`tag ${TIPO_TAG_ARR[a.tipo]||'tag-gray'}`}>{TIPO_ICO_ARR[a.tipo]} {a.tipo}</span></td>
                          <td style={{padding:'7px 12px',fontWeight:500,maxWidth:320}}>{a.asunto}</td>
                          <td style={{padding:'7px 12px',color:'var(--text3)',whiteSpace:'nowrap'}}>{a.fecha}</td>
                          <td style={{padding:'7px 12px',fontSize:10,color:'var(--text3)'}}>{a.user}</td>
                          <td style={{padding:'7px 12px'}}><span className={`tag ${ACT_EST_ARR[a.origen]||'tag-gray'}`} style={{fontSize:9}}>{a.origen}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONFIDENCIALIDAD — formato canónico Oferta */}
          {tab==='conf' && (
            <ConfidencialidadPanel
              entityLabel="arrendatario"
              confidential={arrConfidential}
              onToggle={setArrConfidential}
              hiddenFields={['Cuenta','Condiciones económicas','Renta cierre','Documentación','Stacking']}
              visibleFields={['Activo vinculado','Estado del contrato','Equipo','Año de firma','Información básica']}
              authorizedUsers={arrAuthUsers}
              onAddUser={(newUser) => {
                const [name, team] = [newUser.split('·')[0].trim(), newUser.split('·')[1]?.trim() || '']
                const ini = name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                const today = new Date().toLocaleDateString('es-ES')
                setArrAuthUsers(prev => [...prev, { name, team, role:'Autorizado', initials:ini, bg:'#f0fdf4', color:'#166534', granted:today }])
              }}
              onRemoveUser={(idx) => setArrAuthUsers(prev => prev.filter((_,j) => j !== idx))}
              responsable="Sierra Álvaro"
            />
          )}
        </div>

        {/* Right panel */}
        <div className="ficha-right">
          <div className="rp-sec">
            <div className="rp-lbl">Estado contrato</div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:ESTADO_COLOR[form.estado]||'var(--text4)'}}/>
              <span style={{fontSize:13,fontWeight:700,color:ESTADO_COLOR[form.estado]||'var(--text4)'}}>{form.estado}</span>
            </div>
            <button className="acc-btn" onClick={()=>navigate('ficha-activo')}>Ver activo</button>
            <button className="acc-btn" onClick={()=>navigate('ficha-demanda')}>🔍 Crear demanda</button>
            <button className="acc-btn" onClick={()=>navigate('ficha-actividad')}>Registrar actividad</button>
            <button className="acc-btn">Ver en stacking plan</button>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Fechas clave</div>
            <div className="info-block" style={{padding:0}}>
              {[
                {k:'Inicio',v:form.fecha_inicio},
                {k:'Break option',v:form.break_option,alerta:diasBreak!==null&&diasBreak<=90},
                {k:'Recordatorio',v:fechaRecordatorio,alerta:diasRecord!==null&&diasRecord<=30},
                {k:'Fin contrato',v:form.fecha_fin},
              ].map((r,i)=>(
                <div key={i} className="ir" style={{padding:'6px 10px'}}>
                  <span className="ir-k">{r.k}</span>
                  <span className="ir-v" style={{color:r.alerta?'var(--red)':'var(--text2)',fontWeight:r.alerta?700:400}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">KPIs económicos</div>
            <div className="kf-grid">
              <div className="kf"><div className="kf-lbl">Sup. ocupada</div><div className="kf-val">{parseFloat(form.superficie||0).toLocaleString('es-ES')} m²</div></div>
              <div className="kf"><div className="kf-lbl">Closing rent</div><div className="kf-val" style={{color:'var(--accent)'}}>{form.closing_rent} €</div></div>
              <div className="kf"><div className="kf-lbl">Renta mensual</div><div className="kf-val">{rentaMensual} €</div></div>
              <div className="kf"><div className="kf-lbl">Obras</div><div className="kf-val">{aportacionTotal} €</div></div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Activo vinculado</div>
            <div style={{background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 10px',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>Albatros Edif. D</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>A-1 · Alcobendas · Merlín Properties</div>
            </div>
          </div>
        </div>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Arrendatario" refNombre="Oracle Spain SL · ARR-2501" onClose={() => setShowTarea(false)} />}
      {bajaArr && stackingActivo && (
        <BajaArrendatarioModal
          arrendatario={{
            nombre:     bajaArr.unit.n,
            sup:        bajaArr.unit.sup,
            activo_ref: stackingActivo.ref,
          }}
          activo={{
            id:                  stackingActivo.id,
            ref:                 stackingActivo.ref,
            nombre:              stackingActivo.nombre || stackingActivo.direccion,
            dynamics_account_id: stackingActivo.dynamics_account_id,
            portfolio_id:        stackingActivo.portfolio_id,
            uso:                 stackingActivo.uso || 'Oficinas',
          }}
          onClose={() => setBajaArr(null)}
          onSuccess={() => {
            try { bajaArr.doRemove() } catch (e) {}
            setBajaArr(null)
          }}
        />
      )}
    </div>
  )
}

function FField({label,req,invalid,children}){
  return (
    <div className="of-field" style={{marginBottom:8}}>
      <div className="of-lbl" style={invalid?{color:'var(--red)',fontWeight:600}:req?{color:'var(--text)'}:{}}>{(req||invalid)&&<span style={{color:'var(--red)',marginRight:2}}>*</span>}{label}</div>
      <div style={invalid?{borderRadius:'var(--r)',boxShadow:'0 0 0 2px var(--red)',overflow:'hidden'}:{}}>{children}</div>
    </div>
  )
}

// Sección editorial · caja sutil siempre · título serif + hairline interior
function Section({title, hint, tinted, children, style}){
  const wrap = {
    marginBottom: 14,
    padding: '16px 20px 18px',
    background: tinted ? '#f4efe3' : '#fbfaf6',
    border: '1px solid var(--border)',
    borderRadius: 4,
    ...style,
  }
  return (
    <section style={wrap}>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', paddingBottom:10, marginBottom:14, borderBottom:'1px solid var(--border)'}}>
        <h3 style={{fontFamily:'var(--serif)', fontSize:15, fontWeight:500, color:'var(--ink)', letterSpacing:'-.005em', margin:0}}>{title}</h3>
        {hint && <span style={{fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.12em'}}>{hint}</span>}
      </div>
      <div>{children}</div>
    </section>
  )
}
