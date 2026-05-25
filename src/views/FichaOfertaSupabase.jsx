import { useState, useEffect, useCallback, useRef } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'
import EquipoTrabajoCard, { makeEquipoHandlers, isPrincipal } from '../components/EquipoTrabajoCard'
import FirmarMandatoModal from '../components/FirmarMandatoModal'
import { Inbox, Building2, MapPin, Wallet, FileText, Globe, Presentation, Clock } from 'lucide-react'
import Vinculaciones from '../components/Vinculaciones'
import HeaderPills from '../components/HeaderPills'
import FunnelTracker from '../components/FunnelTracker'
import FunnelStepCards from '../components/FunnelStepCards'
import NotasModal from '../components/NotasModal'
import { cardTone } from '../lib/cardTones'
import { ScrollText, Target, Tag, FileSearch } from 'lucide-react'
// Stacking compartido con FichaActivo · misma lógica/diseño, solo cambia initView.
import { StackingPlan } from './FichaActivo'

// Pestañas de la ficha de oferta. "Crear ficha" eliminada (botones PPT/PDF
// se exponen en el header). "Equipo de trabajo" se quitó como pestaña porque
// ahora vive como sección dentro de "Información oferta".
// Tabs canónicos · "Información general" + bloques específicos del módulo · "Vista 360" (sustituye Seguimiento comercial)
// 'Condiciones' fusionado dentro de 'Espacios comerciales' (regla del usuario).
const OF_TABS = [
  ['of-info',     'Información general'],
  ['of-stacking', 'Stacking plan'],
  ['of-espacios', 'Espacios comerciales'],
  ['of-caract',   'Características'],
  ['of-docs',     'Documentos'],
  ['of-web',      'Contenido web'],
  ['of-seg',      'Vista 360'],
  ['of-conf',     'Confidencialidad'],
]

const TIPO_OPERACION = ['Alquiler','Venta','Inversión','Sale & Leaseback']
const TIPO_COMERC    = ['Mandato Savills','Mandato compartido','Off-market','Alianza','Sin mandato']
const TIPOLOGIAS     = ['Oficina','Logístico','Industrial','Retail','Centro comercial','Residencial','Hotel','Suelo','Data center','Mixto']
const TIPO_MERCADO   = [{ v:'mercado', label:'Mercado' }, { v:'off_market', label:'Off-market' }]

const ESTADO_OFERTA = [
  { v:'En curso',         label:'En curso' },
  { v:'Activa',           label:'Activa' },
  { v:'Ocupada parcial',  label:'Ocupada parcial' },
  { v:'Ocupada total',    label:'Ocupada total' },
  { v:'Retirada',         label:'Retirada' },
]

// Estados que computan como "cierre" de la oferta y exigen motivo
const ESTADOS_CIERRE_OFERTA = ['Ocupada total','Retirada']

const MOTIVOS_DESCARTE_OFERTA = [
  'Arrendado / vendido a otra Cuenta',
  'Retirada por el propietario',
  'Mandato finalizado / no renovado',
  'Cambio de precio o condiciones',
  'Activo en obras / no comercializable',
  'Operación interna del propietario',
  'Off-market estratégico',
  'Comercialización exclusiva por otra agencia',
  'Otro motivo',
]

const sel = { width:'auto', padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inp = { width:90, padding:'2px 6px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit' }
const inpFull = { ...inp, width:'100%' }
const ta = { width:'100%', padding:'6px 9px', fontSize:11.5, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', fontFamily:'inherit', minHeight:60, lineHeight:1.5, resize:'vertical' }

function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('es-ES') }

function StubTab({ label }) {
  return (
    <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>
      <Inbox size={32} strokeWidth={1.5} style={{ marginBottom:8, color:'var(--text4)' }} />
      <div style={{ fontWeight:600, color:'var(--text2)', marginBottom:4 }}>{label}</div>
      <div>Sección disponible cuando completes la información básica y guardes la oferta.</div>
    </div>
  )
}

export default function FichaOfertaSupabase({ refOrId }) {
  const { navigate } = useNav()
  const [tab, setTab] = useState('of-info')
  const [oferta, setOferta] = useState(null)
  const [activo, setActivo] = useState(null)
  const [propietario, setPropietario] = useState(null)
  const [oportunidad, setOportunidad] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const editing = true
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [showFirmarModal, setShowFirmarModal] = useState(false)
  const [showNotasModal, setShowNotasModal] = useState(false)
  const [mandatoVinculado, setMandatoVinculado] = useState(null)
  // Buscador de cuentas para añadir un Colaborador a la oferta
  const [colabSearch, setColabSearch] = useState('')
  const [colabResults, setColabResults] = useState([])
  const [showColabDD, setShowColabDD] = useState(false)
  // Live stacking del activo · refleja edits en tiempo real para el tab Espacios.
  const [liveBuildings, setLiveBuildings] = useState(null)
  const liveBuildingsRef = useRef(null)
  const stackingAutoSave = useRef(null)

  const [form, setForm] = useState({
    tipo_operacion:'', tipo_comercializacion:'', tipologia:'', tipo_mercado:'mercado', estado:'',
    superficie_disponible:'', plazas:'', renta_m2:'', gastos_comunes:'',
    descriptivo:'', comentarios:'', motivo_descarte:'',
    titulo_web:'', descripcion_web:'',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ofertas')
      .select('*')
      .eq('ref', refOrId)
      .maybeSingle()
    if (error) { setError(error.message); setOferta(null); setLoading(false); return }
    if (!data)  { setError(`Oferta ${refOrId} no encontrada`); setOferta(null); setLoading(false); return }
    setOferta(data)

    // Activo vinculado (con todos los datos heredables)
    if (data.activo_id) {
      const { data: a } = await supabase.from('activos').select('*').eq('id', data.activo_id).maybeSingle()
      setActivo(a)
    } else {
      setActivo(null)
    }
    // Propietario (cuenta Dynamics) heredado
    if (data.dynamics_account_id) {
      const { data: p } = await supabase.from('dynamics_accounts')
        .select('dynamics_id, nombre, tipo, sector, direccion, codigo_postal, ciudad, pais, telefono, web')
        .eq('dynamics_id', data.dynamics_account_id).maybeSingle()
      setPropietario(p)
    } else {
      setPropietario(null)
    }
    // Oportunidad
    if (data.dynamics_opportunity_id) {
      const { data: o } = await supabase.from('dynamics_opportunities')
        .select('dynamics_id, nombre, tipo')
        .eq('dynamics_id', data.dynamics_opportunity_id).maybeSingle()
      setOportunidad(o)
    } else {
      setOportunidad(null)
    }
    // Mandato vinculado (si la oferta ya cuelga de uno)
    if (data.mandato_id) {
      const { data: m } = await supabase.from('mandatos')
        .select('id, ref').eq('id', data.mandato_id).maybeSingle()
      setMandatoVinculado(m)
    } else {
      setMandatoVinculado(null)
    }
    setError(null)
    setLoading(false)
  }, [refOrId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!oferta) return
    setForm({
      tipo_operacion:        oferta.tipo_operacion        || '',
      tipo_comercializacion: oferta.tipo_comercializacion || '',
      tipologia:             oferta.tipologia             || '',
      tipo_mercado:          oferta.tipo_mercado          || 'mercado',
      estado:                oferta.estado                || '',
      superficie_disponible: oferta.superficie_disponible || '',
      plazas:                oferta.plazas                || '',
      renta_m2:              oferta.renta_m2              || '',
      gastos_comunes:        oferta.gastos_comunes        || '',
      descriptivo:           oferta.descriptivo           || '',
      comentarios:           oferta.comentarios           || '',
      motivo_descarte:       oferta.motivo_descarte       || '',
      titulo_web:            oferta.titulo_web            || '',
      descripcion_web:       oferta.descripcion_web       || '',
    })
    setSaveError(null)
  }, [oferta])

  const restablecer = async () => {
    setSaveError(null)
    await load()
  }

  // Buscar cuentas en dynamics_accounts para añadir como Colaborador
  useEffect(() => {
    if (!showColabDD) return
    if (!colabSearch || colabSearch.length < 2) { setColabResults([]); return }
    let cancel = false
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('dynamics_accounts')
        .select('dynamics_id, nombre, tipo, sector')
        .ilike('nombre', `%${colabSearch}%`)
        .order('nombre')
        .limit(10)
      if (!cancel) setColabResults(data || [])
    }, 200)
    return () => { cancel = true; clearTimeout(t) }
  }, [colabSearch, showColabDD])

  const addColaborador = async (cuenta) => {
    const equipo = Array.isArray(oferta?.equipo_trabajo) ? oferta.equipo_trabajo : []
    // Evita duplicados por nombre
    if (equipo.some(m => m.nombre === cuenta.nombre && m.rol === 'Colaborador')) {
      setColabSearch(''); setShowColabDD(false); setColabResults([])
      return
    }
    const nuevoEquipo = [...equipo, { nombre: cuenta.nombre, equipo: cuenta.tipo || 'Agente externo', rol: 'Colaborador' }]
    const { error } = await supabase.from('ofertas')
      .update({ equipo_trabajo: nuevoEquipo, updated_at: new Date().toISOString() })
      .eq('id', oferta.id)
    if (error) { setSaveError(error.message); return }
    setColabSearch(''); setShowColabDD(false); setColabResults([])
    await load()
  }

  const removeColaborador = async (nombre) => {
    const equipo = Array.isArray(oferta?.equipo_trabajo) ? oferta.equipo_trabajo : []
    const nuevoEquipo = equipo.filter(m => !(m.nombre === nombre && m.rol === 'Colaborador'))
    const { error } = await supabase.from('ofertas')
      .update({ equipo_trabajo: nuevoEquipo, updated_at: new Date().toISOString() })
      .eq('id', oferta.id)
    if (error) { setSaveError(error.message); return }
    await load()
  }

  const saveEdit = async () => {
    // Si el estado pasa a uno de cierre (Retirada, Ocupada total), el motivo es obligatorio
    const requiereMotivo = ESTADOS_CIERRE_OFERTA.includes(form.estado)
    if (requiereMotivo && !form.motivo_descarte.trim()) {
      setSaveError('Debes indicar el motivo antes de cerrar/retirar la oferta.')
      return
    }
    setSaving(true)
    const num = v => v === '' || v === undefined ? null : Number(v)
    const txt = v => (v === '' || v === undefined) ? null : v
    const { error } = await supabase.from('ofertas').update({
      tipo_operacion:        txt(form.tipo_operacion),
      tipo_comercializacion: txt(form.tipo_comercializacion),
      tipologia:             txt(form.tipologia),
      tipo_mercado:          form.tipo_mercado || 'mercado',
      estado:                txt(form.estado),
      superficie_disponible: num(form.superficie_disponible),
      plazas:                num(form.plazas),
      renta_m2:              num(form.renta_m2),
      gastos_comunes:        num(form.gastos_comunes),
      descriptivo:           txt(form.descriptivo),
      comentarios:           txt(form.comentarios),
      motivo_descarte:       requiereMotivo ? (txt(form.motivo_descarte) || null) : null,
      // En ofertas también marcamos activa según estado (alinea con la vista activas/desactivadas)
      activa:                !requiereMotivo,
      titulo_web:            txt(form.titulo_web),
      descripcion_web:       txt(form.descripcion_web),
      updated_at:            new Date().toISOString(),
    }).eq('id', oferta.id)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    await load()
  }

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  if (loading) return <div style={{ padding:32, color:'var(--text4)', fontSize:12 }}>Cargando…</div>
  if (error || !oferta) {
    return (
      <div style={{ padding:32 }}>
        <div style={{ fontSize:13, color:'#991b1b', marginBottom:12 }}>{error || 'No encontrada'}</div>
        <button className="ab-btn" onClick={() => navigate('ofertas')}>← Volver a Ofertas</button>
      </div>
    )
  }

  const tituloHeader = activo?.nombre || `Oferta ${oferta.ref}`
  const dirHeader = activo
    ? [activo.direccion, activo.ciudad, activo.zona].filter(Boolean).join(' · ')
    : 'Activo no vinculado'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      <div className="action-bar">
        <button className="ab-btn save" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando…' : '💾 Guardar cambios'}</button>
        <button className="ab-btn" onClick={restablecer} disabled={saving}>↺ Restablecer</button>
        <button className="ab-btn" onClick={() => navigate('ofertas')}>← Volver</button>
        <div className="ab-sep"/>
        {(() => {
          const yaTieneMandato = !!oferta.mandato_id
          const cerrada = ['Retirada','Ocupada total'].includes(oferta.estado)
          const puede = !yaTieneMandato && !cerrada && !!oferta.dynamics_opportunity_id && !!oferta.dynamics_account_id && !!oferta.activo_id
          const tip = yaTieneMandato
            ? `Ya cuelga del mandato ${mandatoVinculado?.ref || ''}`
            : cerrada ? 'Oferta cerrada/retirada'
            : !oferta.dynamics_opportunity_id ? 'Falta oportunidad'
            : !oferta.dynamics_account_id     ? 'Falta cuenta'
            : !oferta.activo_id               ? 'Falta activo'
            : 'Crear instrucción + mandato'
          return yaTieneMandato && mandatoVinculado ? (
            <button className="ab-btn" onClick={() => navigate('ficha-mandato', { id: mandatoVinculado.ref })}>
              Mandato {mandatoVinculado.ref}
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
        {saveError && <span style={{ marginLeft:12, fontSize:11, color:'#991b1b', fontWeight:600 }}>{saveError}</span>}
      </div>

      {showFirmarModal && (
        <FirmarMandatoModal
          origen={{ tipo:'oferta', record: oferta }}
          oportunidad={oportunidad}
          cuenta={propietario}
          onClose={() => setShowFirmarModal(false)}
          onSuccess={() => { setShowFirmarModal(false); load() }}
        />
      )}

      <NotasModal
        open={showNotasModal}
        onClose={() => setShowNotasModal(false)}
        onSave={async () => { await saveEdit() }}
        title="Notas"
        subtitle={`Notas internas · ${oferta.ref}`}
        saving={saving}
        fields={[{
          key:'comentarios',
          label:'Notas internas',
          value: form.comentarios,
          onChange: (v) => setF('comentarios', v),
          placeholder:'Observaciones internas sobre la oferta...',
          rows:6,
        }]}
      />

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Funnel tracker · hilo conductor entre fases */}
          <FunnelTracker steps={[
            { key:'opo', label:'Oportunidad', ref: oportunidad?.dynamics_id || oferta.dynamics_opportunity_id || null,
              onClick: (oportunidad?.dynamics_id || oferta.dynamics_opportunity_id) ? () => navigate('ficha-oportunidad', { id: oportunidad?.dynamics_id || oferta.dynamics_opportunity_id }) : null },
            { key:'man', label:'Mandato', ref: mandatoVinculado?.ref || null,
              onClick: mandatoVinculado?.ref ? () => navigate('ficha-mandato', { ref: mandatoVinculado.ref }) : null },
            { key:'ofr', label:'Oferta', ref: oferta.ref, current: true, onClick: null },
            { key:'neg', label:'Negociación', ref: oferta.negociacion_ref || null,
              onClick: oferta.negociacion_ref ? () => navigate('ficha-negociacion', { ref: oferta.negociacion_ref }) : null },
          ]} />

          {/* Header con pills interactivos · canon unificado */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#15803d,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center' }}><Building2 size={20} strokeWidth={1.75} color="#fff" /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="ah-ref">
                  <span style={{ background:'#dcfce7', color:'#15803d', border:'1px solid #86efac', padding:'0 6px', borderRadius:3, fontSize:9, fontWeight:700 }}>OFERTA</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{oferta.ref}</span>
                  {oferta.tipologia && <span style={{ color:'var(--text4)', fontSize:11 }}>· {oferta.tipologia}</span>}
                </div>
                <div className="ah-name" style={{ fontSize:22, fontWeight:700, letterSpacing:'-.015em' }}>{tituloHeader}</div>
                <div className="ah-addr">{dirHeader} · Creada: {fmtDate(oferta.created_at)} · {CURRENT_USER.nombre}</div>
              </div>
              {(() => {
                const hasNotas = !!(form.comentarios || '').trim()
                return (
                  <HeaderPills items={[
                    { key:'estado', type:'info', label:'Estado', value:`● ${oferta.estado || 'En curso'}`, color:'green', accent:true },
                    { key:'mercado', type:'info', label:'Mercado', value: oferta.tipo_mercado === 'off_market' ? 'Off-market' : 'Mercado', color: oferta.tipo_mercado === 'off_market' ? 'amber' : 'blue', accent:true },
                    oferta.tipo_operacion && { key:'tipo', type:'info', label:'Operación', value: oferta.tipo_operacion, color:'teal', accent:true },
                    { key:'sup', type:'info', label:'Sup. disponible', value: oferta.superficie_disponible ? `${Number(oferta.superficie_disponible).toLocaleString('es-ES')} m²` : '—' },
                    { key:'renta', type:'info', label:'Renta €/m²', value: oferta.renta_m2 ? `${oferta.renta_m2} €` : '—', color:'accent', accent: !!oferta.renta_m2 },
                    { key:'responsable', type:'info', label:'Responsable', value: oferta.responsable || CURRENT_USER.nombre },
                    {
                      key:'notas', type:'button', label:'Notas',
                      value: hasNotas ? '📝' : '—',
                      icon: hasNotas ? null : '📝',
                      color: hasNotas ? 'accent' : 'default',
                      accent: hasNotas,
                      onClick: () => setShowNotasModal(true),
                      title: hasNotas ? 'Ver / editar notas' : 'Añadir notas',
                    },
                  ]} />
                )
              })()}
            </div>

            {/* Audit + export — debajo de los KPIs, ancho completo */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text3)' }}>
                <Clock size={12} strokeWidth={1.75} />
                <span>Última modificación · {oferta.updated_by || CURRENT_USER.nombre} · {fmtDate(oferta.updated_at || oferta.created_at)}</span>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="tbtn"><FileText size={13} strokeWidth={1.75} /> Ficha PDF</button>
                <button className="tbtn"><Presentation size={13} strokeWidth={1.75} /> Ficha PPT</button>
              </div>
            </div>
          </div>

          <div className="tabs">
            {OF_TABS.map(([k, label]) => (
              <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</div>
            ))}
          </div>

          {/* TAB: Información oferta */}
          {tab === 'of-info' && (
            <div className="tab-content active"><div className="info-pad fp-tab">
              {/* ── SECCIÓN 01 · VINCULACIONES (FunnelStepCards canon) ── */}
              <div className="fp-section-eyebrow">
                <span className="fp-eyebrow-n">01</span>
                <span className="fp-eyebrow-l">Vinculaciones</span>
                <span className="fp-eyebrow-hint">A qué está conectada esta oferta</span>
              </div>
              {(() => {
                const hasActivo  = !!activo
                const hasPropie  = !!propietario
                const hasOpo     = !!oportunidad
                const hasMandato = !!mandatoVinculado
                const hasInstr   = !!mandatoVinculado?.dynamics_instruction_id
                return (
                  <FunnelStepCards steps={[
                    {
                      key:'activo', icon: Tag, tone: cardTone('Activo'),
                      label:'Activo', value: activo?.nombre || null,
                      sub: activo ? ([activo.zona, activo.ciudad].filter(Boolean).join(' · ') || activo.uso || null) : null,
                      status: hasActivo ? 'done' : 'current',
                      vacant: !hasActivo,
                      openAction: hasActivo ? { label:'Abrir activo', onClick: () => navigate('ficha-activo', { ref: activo.ref }) } : null,
                    },
                    {
                      key:'propietario', icon: Building2, tone: cardTone('Cuenta'),
                      label:'Propietario (Cuenta)', value: propietario?.nombre || null,
                      sub: propietario?.sector || propietario?.tipo || null,
                      status: hasPropie ? 'done' : 'current',
                      vacant: !hasPropie,
                      openAction: hasPropie ? { label:'Abrir cuenta', onClick: () => navigate('cuentas', { id: propietario.dynamics_id || propietario.id }) } : null,
                      dyn: true,
                    },
                    {
                      key:'oportunidad', icon: Target, tone: cardTone('Oportunidad'),
                      label:'Oportunidad', value: oportunidad?.nombre || null,
                      sub: oportunidad?.tipo || null,
                      status: hasOpo ? 'done' : 'current',
                      vacant: !hasOpo,
                      openAction: hasOpo ? { label:'Abrir oportunidad', onClick: () => navigate('ficha-oportunidad', { id: oportunidad.dynamics_id || oportunidad.id }) } : null,
                      dyn: true,
                    },
                    {
                      key:'mandato', icon: ScrollText, tone: cardTone('Mandato'),
                      label:'Mandato', value: mandatoVinculado?.ref || null,
                      sub: hasMandato ? (mandatoVinculado.titulo || mandatoVinculado.tipo || '(sin título)') : 'Opcional · vincula uno o pasa sin mandato.',
                      status: hasMandato ? 'done' : 'current',
                      vacant: !hasMandato,
                      openAction: hasMandato ? { label:'Abrir mandato', onClick: () => navigate('ficha-mandato', { ref: mandatoVinculado.ref }) } : null,
                      optional: !hasMandato,
                    },
                    {
                      key:'instruccion', icon: FileSearch, tone: cardTone('Instrucción'),
                      label:'Instrucción', value: mandatoVinculado?.dynamics_instruction_id || null,
                      sub: hasInstr ? 'Instrucción de Dynamics vinculada.' : 'Se genera al firmar el mandato.',
                      status: hasInstr ? 'done' : 'current',
                      vacant: !hasInstr,
                      dyn: true,
                    },
                  ]} />
                )
              })()}
              {/* ── SECCIÓN 02 · EQUIPO Y COLABORADORES (50/50) ── */}
              <div className="fp-section-eyebrow">
                <span className="fp-eyebrow-n">02</span>
                <span className="fp-eyebrow-l">Equipo y colaboradores</span>
                <span className="fp-eyebrow-hint">Quién está trabajando en esta oferta</span>
              </div>
              {(() => {
                const equipo = Array.isArray(oferta.equipo_trabajo) ? oferta.equipo_trabajo : []
                const equipoInterno = equipo.filter(m => m.rol === 'Principal' || m.rol === 'Soporte')
                const colaboradores = equipo.filter(m => m.rol === 'Colaborador')
                const renderList = (list, emptyHint, accent) => list.length === 0 ? (
                  <div style={{ fontSize:12, color:'var(--text4)', fontStyle:'italic', padding:'10px 4px' }}>{emptyHint}</div>
                ) : (
                  <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:6 }}>
                    {list.map((m, i) => (
                      <li key={`${m.nombre}-${i}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', background:'#fff', border:'1px solid var(--border)', borderRadius:8, borderLeft:`3px solid ${accent}` }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:accent, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                          {(m.nombre || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{m.nombre}</div>
                          <div style={{ fontSize:11, color:'var(--text3)' }}>{m.equipo || '—'}</div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:9, background:`${accent}15`, color:accent, border:`1px solid ${accent}30`, textTransform:'uppercase', letterSpacing:'.04em' }}>{m.rol}</span>
                      </li>
                    ))}
                  </ul>
                )
                return (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:8 }}>
                    <div className="va-meta-card va-card-info-cuenta">
                      <div className="va-meta-head accent-green"><span className="dot"/>Equipo de trabajo</div>
                      <div style={{ padding:'10px 14px' }}>
                        {renderList(equipoInterno, 'Sin Principal ni Soporte asignados aún.', '#15803d')}
                      </div>
                    </div>
                    <div className="va-meta-card" style={{ overflow:'visible' }}>
                      <div className="va-meta-head accent-purple"><span className="dot"/>Colaboradores</div>
                      <div style={{ padding:'10px 14px' }}>
                        {colaboradores.length === 0 ? (
                          <div style={{ fontSize:12, color:'var(--text4)', fontStyle:'italic', padding:'6px 4px' }}>Sin colaboradores externos vinculados.</div>
                        ) : (
                          <ul style={{ listStyle:'none', padding:0, margin:'0 0 8px', display:'flex', flexDirection:'column', gap:6 }}>
                            {colaboradores.map((m, i) => (
                              <li key={`${m.nombre}-${i}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', background:'#fff', border:'1px solid var(--border)', borderRadius:8, borderLeft:'3px solid #6b21a8' }}>
                                <div style={{ width:28, height:28, borderRadius:'50%', background:'#6b21a8', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                                  {(m.nombre || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:13, fontWeight:600 }}>{m.nombre}</div>
                                  <div style={{ fontSize:11, color:'var(--text3)' }}>{m.equipo || '—'}</div>
                                </div>
                                <button onClick={() => removeColaborador(m.nombre)} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:13, padding:'2px 6px' }} title="Quitar colaborador">✕</button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div style={{ position:'relative' }}>
                          <input
                            className="kf-inp"
                            value={colabSearch}
                            onChange={e => { setColabSearch(e.target.value); setShowColabDD(true) }}
                            onFocus={() => setShowColabDD(true)}
                            onBlur={() => setTimeout(() => setShowColabDD(false), 200)}
                            placeholder="🔍 Añadir colaborador (cuenta competencia / gestor exclusivo)"
                            style={{ width:'100%', fontSize:12, padding:'6px 9px' }}
                          />
                          {showColabDD && colabSearch.length >= 2 && (
                            <div style={{ position:'absolute', top:'calc(100% + 2px)', left:0, right:0, zIndex:30, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, maxHeight:220, overflowY:'auto', boxShadow:'0 6px 20px rgba(0,0,0,0.12)' }}>
                              {colabResults.length === 0 ? (
                                <div style={{ padding:'8px 12px', fontSize:11, color:'var(--text4)' }}>Sin resultados.</div>
                              ) : colabResults.map(c => (
                                <div key={c.dynamics_id} onMouseDown={() => addColaborador(c)}
                                  style={{ padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                                  <div style={{ fontWeight:600 }}>{c.nombre}</div>
                                  <div style={{ fontSize:10, color:'var(--text4)' }}>{[c.tipo, c.sector].filter(Boolean).join(' · ') || c.dynamics_id}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {colabSearch.length > 0 && colabSearch.length < 2 && (
                            <div style={{ fontSize:10, color:'var(--text4)', marginTop:4 }}>Escribe al menos 2 caracteres.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* ── SECCIÓN 03 · ESTADO ── (Notas viven arriba a la derecha) */}
              <div className="fp-section-eyebrow">
                <span className="fp-eyebrow-n">03</span>
                <span className="fp-eyebrow-l">Estado</span>
                <span className="fp-eyebrow-hint">Cambia aquí el estado de la oferta</span>
              </div>
              <div>
                {/* ─ ESTADO (accionable, destacado en accent) ─ */}
                <div>
                  <div className="va-meta-card va-card-primary">
                    <div className="va-meta-head accent-purple"><span className="dot"/>Estado de la oferta</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div className="ir">
                        <span className="ir-k">Estado oferta</span>
                        <span className="ir-v">{editing
                          ? <select style={sel} value={form.estado} onChange={e => setF('estado', e.target.value)}>
                              <option value="">—</option>
                              {ESTADO_OFERTA.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                            </select>
                          : (oferta.estado || <span style={{ color:'var(--text4)' }}>—</span>)}</span>
                      </div>

                      {/* Motivo: obligatorio cuando estado es Retirada / Ocupada total */}
                      {(ESTADOS_CIERRE_OFERTA.includes(form.estado) || oferta.motivo_descarte) && (() => {
                        const motivoEsPredef = MOTIVOS_DESCARTE_OFERTA.includes(form.motivo_descarte)
                        const motivoEsOtro   = !!form.motivo_descarte && !motivoEsPredef
                        const sel_v          = motivoEsOtro ? 'Otro motivo' : (form.motivo_descarte || '')
                        const otroTexto      = motivoEsOtro ? form.motivo_descarte : ''
                        const requiereMotivo = ESTADOS_CIERRE_OFERTA.includes(form.estado)
                        const sinMotivo      = requiereMotivo && !form.motivo_descarte.trim()
                        return (
                          <>
                            <div className="ir" style={{ alignItems:'flex-start' }}>
                              <span className="ir-k" style={{ color: requiereMotivo ? '#dc2626' : 'var(--text4)', fontWeight:700 }}>
                                Motivo del cierre {requiereMotivo && <span style={{ color:'#dc2626' }}>*</span>}
                              </span>
                              <span className="ir-v">
                                {editing
                                  ? <select
                                      style={{ ...sel, borderColor: sinMotivo ? '#dc2626' : 'var(--border)' }}
                                      value={sel_v}
                                      onChange={e => {
                                        const v = e.target.value
                                        if (v === '') setF('motivo_descarte', '')
                                        else if (v === 'Otro motivo') setF('motivo_descarte', otroTexto || ' ')
                                        else setF('motivo_descarte', v)
                                      }}
                                    >
                                      <option value="">Selecciona un motivo...</option>
                                      {MOTIVOS_DESCARTE_OFERTA.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                  : (motivoEsPredef ? form.motivo_descarte : (motivoEsOtro ? 'Otro motivo' : <span style={{ color:'var(--text4)' }}>—</span>))}
                              </span>
                            </div>
                            {(sel_v === 'Otro motivo' || motivoEsOtro) && (
                              <div className="ir" style={{ alignItems:'flex-start' }}>
                                <span className="ir-k">Describe el motivo</span>
                                <span className="ir-v" style={{ flex:1 }}>
                                  {editing
                                    ? <textarea
                                        style={{ ...ta, minHeight:50, borderColor: sinMotivo ? '#dc2626' : 'var(--border)' }}
                                        value={otroTexto}
                                        onChange={e => setF('motivo_descarte', e.target.value)}
                                        placeholder="Describe brevemente por qué se cierra/retira esta oferta..."
                                      />
                                    : (oferta.motivo_descarte || <span style={{ color:'var(--text4)' }}>—</span>)}
                                </span>
                              </div>
                            )}
                          </>
                        )
                      })()}

                      <div className="ir">
                        <span className="ir-k">Mercado</span>
                        <span className="ir-v">{editing
                          ? <select style={sel} value={form.tipo_mercado} onChange={e => setF('tipo_mercado', e.target.value)}>
                              {TIPO_MERCADO.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                            </select>
                          : (oferta.tipo_mercado === 'off_market' ? 'Off-market' : 'Mercado')}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div></div>
          )}

          {/* Condiciones · fusionado dentro de Espacios comerciales
              (regla del usuario · ya no es un tab independiente). */}
          {tab === 'of-espacios' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:10, borderBottom:'2px solid var(--border)' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, flexShrink:0 }}>€</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Condiciones de la oferta</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Comercialización, tipología y estado · vinculado a los espacios de arriba</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <div className="of-section">📑 COMERCIALIZACIÓN</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Tipo operación</span><span className="ir-v">{editing
                      ? <select style={sel} value={form.tipo_operacion} onChange={e => setF('tipo_operacion', e.target.value)}>
                          <option value="">—</option>{TIPO_OPERACION.map(o => <option key={o}>{o}</option>)}
                        </select>
                      : (oferta.tipo_operacion || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                    <div className="ir"><span className="ir-k">Tipo comercialización</span><span className="ir-v">{editing
                      ? <select style={sel} value={form.tipo_comercializacion} onChange={e => setF('tipo_comercializacion', e.target.value)}>
                          <option value="">—</option>{TIPO_COMERC.map(o => <option key={o}>{o}</option>)}
                        </select>
                      : (oferta.tipo_comercializacion || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                    <div className="ir"><span className="ir-k">Tipología</span><span className="ir-v">{editing
                      ? <select style={sel} value={form.tipologia} onChange={e => setF('tipologia', e.target.value)}>
                          <option value="">—</option>{TIPOLOGIAS.map(o => <option key={o}>{o}</option>)}
                        </select>
                      : (oferta.tipologia || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                  </div>

                  <div className="of-section">📐 SUPERFICIE</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Sup. disponible (m²)</span><span className="ir-v">{editing
                      ? <input type="number" style={inp} value={form.superficie_disponible} onChange={e => setF('superficie_disponible', e.target.value)} placeholder="—" />
                      : (oferta.superficie_disponible ? `${Number(oferta.superficie_disponible).toLocaleString('es-ES')} m²` : <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                    <div className="ir"><span className="ir-k">Plazas aparcamiento</span><span className="ir-v">{editing
                      ? <input type="number" style={inp} value={form.plazas} onChange={e => setF('plazas', e.target.value)} placeholder="—" />
                      : (oferta.plazas || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                  </div>
                </div>

                <div>
                  <div className="of-section" style={{display:'inline-flex',alignItems:'center',gap:6}}><Wallet size={14} strokeWidth={1.75} /> RENTA / PRECIO</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Renta €/m² /mes</span><span className="ir-v">{editing
                      ? <input type="number" style={inp} value={form.renta_m2} onChange={e => setF('renta_m2', e.target.value)} placeholder="—" />
                      : (oferta.renta_m2 || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                    <div className="ir"><span className="ir-k">Gastos comunes €/m²</span><span className="ir-v">{editing
                      ? <input type="number" style={inp} value={form.gastos_comunes} onChange={e => setF('gastos_comunes', e.target.value)} placeholder="—" />
                      : (oferta.gastos_comunes || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                    <div className="ir"><span className="ir-k">Renta mensual</span><span className="ir-v">{oferta.renta_mensual ? `${Number(oferta.renta_mensual).toLocaleString('es-ES')} €` : <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                    <div className="ir"><span className="ir-k">Renta anual</span><span className="ir-v">{oferta.renta_anual ? `${Number(oferta.renta_anual).toLocaleString('es-ES')} €` : <span style={{ color:'var(--text4)' }}>—</span>}</span></div>
                  </div>

                  <div className="of-section" style={{display:'inline-flex',alignItems:'center',gap:6}}><FileText size={14} strokeWidth={1.75} /> DESCRIPTIVO</div>
                  <div className="info-block">
                    {editing
                      ? <textarea style={ta} value={form.descriptivo} onChange={e => setF('descriptivo', e.target.value)} placeholder="Descripción comercial completa..." />
                      : (oferta.descriptivo || <span style={{ color:'var(--text4)' }}>—</span>)}
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* TAB: Contenido web */}
          {tab === 'of-web' && (
            <div className="tab-content active"><div className="info-pad">
              <div className="of-section" style={{display:'inline-flex',alignItems:'center',gap:6}}><Globe size={14} strokeWidth={1.75} /> PUBLICACIÓN WEB</div>
              <div className="info-block">
                <div className="ir"><span className="ir-k">Título web</span><span className="ir-v" style={{ flex:1 }}>{editing
                  ? <input style={inpFull} value={form.titulo_web} onChange={e => setF('titulo_web', e.target.value)} placeholder="Cómo aparece en savills.es" />
                  : (oferta.titulo_web || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                <div className="ir" style={{ alignItems:'flex-start' }}><span className="ir-k">Descripción web</span><span className="ir-v" style={{ flex:1 }}>{editing
                  ? <textarea style={ta} value={form.descripcion_web} onChange={e => setF('descripcion_web', e.target.value)} placeholder="Texto comercial visible a la Cuenta..." />
                  : (oferta.descripcion_web || <span style={{ color:'var(--text4)' }}>—</span>)}</span></div>
                <div className="ir"><span className="ir-k">Publicar en Savills</span><span className="ir-v">{oferta.publicado_savills ? 'Sí' : 'No'}</span></div>
                <div className="ir"><span className="ir-k">Publicar en Idealista</span><span className="ir-v">{oferta.publicado_idealista ? 'Sí' : 'No'}</span></div>
                <div className="ir"><span className="ir-k">Publicar en MisOficinas</span><span className="ir-v">{oferta.publicado_misoficinas ? 'Sí' : 'No'}</span></div>
              </div>
            </div></div>
          )}

          {tab === 'of-equipo' && (() => {
            const equipo = Array.isArray(oferta.equipo_trabajo) ? oferta.equipo_trabajo : []
            const userIsPrincipal = isPrincipal(equipo, CURRENT_USER.nombre)
            const canManage = userIsPrincipal || equipo.length === 0
            const handlers = makeEquipoHandlers({
              supabase, table:'ofertas', idValue:oferta.id, equipo,
              onAfter: () => load(),
              onError: (msg) => setSaveError(msg),
            })
            return (
              <div className="tab-content active"><div className="info-pad">
                <EquipoTrabajoCard
                  equipo={equipo}
                  canManage={canManage}
                  onAdd={handlers.addMiembro}
                  onRemove={handlers.removeMiembro}
                  onUpdateRol={handlers.updateMiembroRol}
                />
              </div></div>
            )
          })()}
          {tab === 'of-stacking' && (
            <div className="tab-content active">
              {!activo ? (
                <StubTab label="Stacking plan" />
              ) : (
                <div style={{ padding:'8px 16px 16px' }}>
                  <div style={{ marginBottom:10, padding:'8px 12px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:6, fontSize:11, color:'var(--accent)' }}>
                    Stacking del activo <strong>{activo.nombre || activo.ref}</strong>. Arrastra la oferta <strong>{oferta.ref}</strong> a las plantas para definir los espacios comerciales. Los cambios se guardan automáticamente en el activo.
                  </div>
                  <StackingPlan
                    key={oferta.ref}
                    initBuildings={activo.stacking_data?.length > 0 ? activo.stacking_data : []}
                    defaultLabel={activo.nombre || activo.direccion || ''}
                    defaultSupPlantaTipo={activo.sup_planta_tipo || undefined}
                    activoPropietario={activo.propietario || ''}
                    activoRef={activo.ref || ''}
                    activoNombre={activo.nombre || ''}
                    extraOfertas={[{
                      id: oferta.id,
                      ref: oferta.ref,
                      nombre: oferta.ref,
                      tipoOperacion: oferta.tipo_operacion || 'Alquiler',
                    }]}
                    initView="arr"
                    allowCreate={false}
                    onBuildingsChange={(blds) => {
                      liveBuildingsRef.current = blds
                      setLiveBuildings(blds)
                      // Auto-save al activo (no a la oferta · el stacking pertenece al activo).
                      if (activo.ref) {
                        clearTimeout(stackingAutoSave.current)
                        stackingAutoSave.current = setTimeout(() => {
                          supabase.from('activos').update({ stacking_data: blds }).eq('ref', activo.ref)
                        }, 1500)
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
          {tab === 'of-espacios' && (
            <div className="tab-content active">
              {(() => {
                // Derivamos los espacios desde el stacking en vivo (o el persistido)
                // filtrando las unidades tipo 'vac' (oferta) cuya etiqueta sea esta oferta.
                const blds = liveBuildings || activo?.stacking_data || []
                const espacios = blds.flatMap(b =>
                  (b.arr || []).flatMap(row =>
                    (row.units || [])
                      .filter(u => u.type === 'vac' && u.oferta === oferta.ref)
                      .map(u => ({
                        edificio: b.label || b.id,
                        planta:   row.p,
                        sup:      u.sup || 0,
                        renta:    u.renta || 0,
                        precio_total: u.precio_total || 0,
                      }))
                  )
                )
                const totalSup   = espacios.reduce((s,e) => s + (e.sup || 0), 0)
                const totalRenta = espacios.filter(e => e.renta > 0).reduce((s,e) => s + e.renta * e.sup, 0)
                if (!activo) {
                  return <div style={{ padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>Sin activo vinculado.</div>
                }
                if (espacios.length === 0) {
                  return (
                    <div style={{ padding:'24px 20px', textAlign:'center' }}>
                      <Inbox size={32} strokeWidth={1.5} style={{ color:'var(--text4)', marginBottom:8 }} />
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Sin espacios comerciales todavía</div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14, maxWidth:480, marginLeft:'auto', marginRight:'auto', lineHeight:1.5 }}>
                        Los espacios de esta oferta se crean arrastrando la oferta a las plantas del activo en el <strong>Stacking plan</strong>. Cuando los asignes, aparecerán aquí automáticamente con su superficie y renta.
                      </div>
                      <button
                        onClick={() => setTab('of-stacking')}
                        style={{ padding:'8px 16px', fontSize:12, fontWeight:700, border:'1px solid var(--accent)', borderRadius:6, background:'var(--accent)', color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
                        Ir al Stacking plan →
                      </button>
                    </div>
                  )
                }
                return (
                  <div style={{ padding:'14px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>
                        Espacios asignados <span style={{ marginLeft:6, padding:'1px 7px', background:'var(--accent-lt)', color:'var(--accent)', borderRadius:9, fontSize:10 }}>{espacios.length}</span>
                      </div>
                      <button onClick={() => setTab('of-stacking')} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, border:'1px solid var(--border)', borderRadius:5, background:'var(--surface)', cursor:'pointer', fontFamily:'inherit' }}>
                        ✎ Editar en Stacking →
                      </button>
                    </div>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, border:'1px solid var(--border)', borderRadius:6, overflow:'hidden' }}>
                      <thead>
                        <tr style={{ background:'var(--gray-lt)' }}>
                          {['Edificio','Planta','Superficie (m²)', oferta.tipo_operacion === 'Venta' ? 'Precio €/m²' : 'Renta €/m²/mes', oferta.tipo_operacion === 'Venta' ? 'Precio total' : 'Renta mensual'].map(h =>
                            <th key={h} style={{ padding:'8px 12px', fontSize:10, fontWeight:700, color:'var(--text4)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.04em', borderBottom:'1px solid var(--border)' }}>{h}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {espacios.map((e, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                            <td style={{ padding:'7px 12px' }}>{e.edificio}</td>
                            <td style={{ padding:'7px 12px' }}><span className="tag tag-gray" style={{ fontSize:10 }}>{e.planta}</span></td>
                            <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{e.sup.toLocaleString('es-ES')}</td>
                            <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', color: e.renta ? 'var(--text2)' : 'var(--text4)', fontStyle: e.renta ? 'normal' : 'italic' }}>
                              {e.renta ? `${e.renta} €` : '— por completar'}
                            </td>
                            <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600, color:'var(--green)' }}>
                              {oferta.tipo_operacion === 'Venta'
                                ? (e.precio_total ? `${Number(e.precio_total).toLocaleString('es-ES')} €` : (e.renta && e.sup ? `${Math.round(e.renta * e.sup).toLocaleString('es-ES')} €` : '—'))
                                : (e.renta && e.sup ? `${Math.round(e.renta * e.sup).toLocaleString('es-ES')} €` : '—')}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ background:'var(--gray-lt)', borderTop:'2px solid var(--border)' }}>
                          <td colSpan={2} style={{ padding:'8px 12px', fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>Total</td>
                          <td style={{ padding:'8px 12px', fontFamily:'var(--mono)', fontWeight:800 }}>{totalSup.toLocaleString('es-ES')}</td>
                          <td></td>
                          <td style={{ padding:'8px 12px', fontFamily:'var(--mono)', fontWeight:800, color:'var(--green)' }}>
                            {totalRenta > 0 ? `${Math.round(totalRenta).toLocaleString('es-ES')} €` : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          )}
          {tab === 'of-caract'   && <div className="tab-content active"><StubTab label="Características" /></div>}
          {tab === 'of-docs'     && <div className="tab-content active"><StubTab label="Documentos" /></div>}
          {tab === 'of-seg'      && <div className="tab-content active"><StubTab label="Seguimiento comercial" /></div>}
          {tab === 'of-conf'     && <div className="tab-content active"><StubTab label="Confidencialidad" /></div>}

        </div>
      </div>
    </div>
  )
}
