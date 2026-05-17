import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'
import EquipoTrabajoCard, { makeEquipoHandlers, isPrincipal } from '../components/EquipoTrabajoCard'
import FirmarMandatoModal from '../components/FirmarMandatoModal'
import { Inbox, Building2, MapPin, Wallet, FileText, Globe, Presentation, Clock } from 'lucide-react'
import Vinculaciones from '../components/Vinculaciones'

// Pestañas de la ficha de oferta. "Crear ficha" eliminada (botones PPT/PDF
// se exponen en el header). Equipo de trabajo se mantiene por ahora como
// pestaña; en una iteración posterior se integrará en Información general.
const OF_TABS = [
  ['of-info',        'Información oferta'],
  ['of-equipo',      'Equipo de trabajo'],
  ['of-stacking',    'Stacking plan'],
  ['of-espacios',    'Espacios comerciales'],
  ['of-condiciones', 'Condiciones'],
  ['of-caract',      'Características'],
  ['of-docs',        'Documentos'],
  ['of-web',         'Contenido web'],
  ['of-seg',         'Seguimiento comercial'],
  ['of-conf',        'Confidencialidad'],
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
  const [mandatoVinculado, setMandatoVinculado] = useState(null)

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

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Header */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#15803d,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center' }}><Building2 size={20} strokeWidth={1.75} color="#fff" /></div>
              <div style={{ flex:1 }}>
                <div className="ah-ref">
                  <span style={{ background:'#dcfce7', color:'#15803d', border:'1px solid #86efac', padding:'0 5px', borderRadius:3, fontSize:9, fontWeight:700 }}>OFERTA</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{oferta.ref}</span>
                </div>
                <div className="ah-name">{tituloHeader}</div>
                <div className="ah-addr">{dirHeader} · Creada: {fmtDate(oferta.created_at)} · {CURRENT_USER.nombre}</div>
                <div className="ah-tags">
                  <span className="tag tag-green">● {oferta.estado || 'En curso'}</span>
                  <span className={`tag ${oferta.tipo_mercado === 'off_market' ? 'tag-amber' : 'tag-blue'}`}>
                    {oferta.tipo_mercado === 'off_market' ? 'Off-market' : 'Mercado'}
                  </span>
                  {oferta.tipo_operacion && <span className="tag tag-teal">{oferta.tipo_operacion}</span>}
                  {oferta.tipologia && <span className="tag tag-gray">{oferta.tipologia}</span>}
                </div>
              </div>
              <div style={{ flexShrink:0, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:1, background:'var(--border)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', fontSize:10, alignSelf:'flex-start' }}>
                {[
                  ['Estado', oferta.estado || '—', 'var(--green)'],
                  ['Mercado', oferta.tipo_mercado === 'off_market' ? 'Off-market' : 'Mercado', null],
                  ['Sup. m²', oferta.superficie_disponible || '—', null],
                  ['Renta €/m²', oferta.renta_m2 || '—', 'var(--accent)'],
                ].map(([lbl,val,col]) => (
                  <div key={lbl} style={{ background:'var(--surface)', padding:'6px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'var(--text4)' }}>{lbl}</div>
                    <div style={{ fontWeight:600, color:col || 'var(--text)' }}>{val}</div>
                  </div>
                ))}
              </div>
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
              {/* ── SECCIÓN 01 · VINCULACIONES ── */}
              <div className="fp-section-eyebrow">
                <span className="fp-eyebrow-n">01</span>
                <span className="fp-eyebrow-l">Vinculaciones</span>
                <span className="fp-eyebrow-hint">A qué está conectada esta oferta</span>
              </div>
              <Vinculaciones
                cuenta={propietario ? {
                  id: propietario.id || propietario.dynamics_id,
                  nombre: propietario.nombre,
                  sub: propietario.sector || propietario.tipo
                } : null}
                cuentaLabel="Propietario (Cuenta)"
                activo={activo ? {
                  ref: activo.ref,
                  nombre: activo.nombre,
                  direccion: activo.direccion,
                  sub: [activo.zona, activo.ciudad].filter(Boolean).join(' · ') || activo.uso
                } : null}
                oportunidad={oportunidad ? {
                  id: oportunidad.id || oportunidad.dynamics_id,
                  nombre: oportunidad.nombre,
                  sub: oportunidad.tipo
                } : null}
                instruccion={mandatoVinculado?.dynamics_instruction_id ? {
                  id: mandatoVinculado.dynamics_instruction_id,
                  dynamics_id: mandatoVinculado.dynamics_instruction_id
                } : null}
                mandato={mandatoVinculado ? {
                  id: mandatoVinculado.id,
                  ref: mandatoVinculado.ref,
                  titulo: mandatoVinculado.titulo,
                  sub: mandatoVinculado.tipo
                } : null}
              />
              {/* ── SECCIÓN 02 · ESTADO (lo accionable) + 03 · COMENTARIOS ── */}
              <div className="fp-section-eyebrow">
                <span className="fp-eyebrow-n">02</span>
                <span className="fp-eyebrow-l">Estado y notas</span>
                <span className="fp-eyebrow-hint">Cambia aquí el estado y deja contexto interno</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:14 }}>
                {/* ─ COL 1 · ESTADO (accionable, destacado en accent) ─ */}
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

                {/* ─ COL 2 · COMENTARIOS INTERNOS ─ */}
                <div>
                  <div className="va-meta-card">
                    <div className="va-meta-head accent-red"><span className="dot"/>Comentarios internos</div>
                    <div style={{ padding:'10px 14px' }}>
                      {editing
                        ? <textarea style={ta} value={form.comentarios} onChange={e => setF('comentarios', e.target.value)} placeholder="Comentarios internos sobre la oferta..." />
                        : (oferta.comentarios || <span style={{ color:'var(--text4)' }}>—</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* TAB: Condiciones */}
          {tab === 'of-condiciones' && (
            <div className="tab-content active"><div className="info-pad">
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
          {tab === 'of-stacking' && <div className="tab-content active"><StubTab label="Stacking plan" /></div>}
          {tab === 'of-espacios' && <div className="tab-content active"><StubTab label="Espacios comerciales" /></div>}
          {tab === 'of-caract'   && <div className="tab-content active"><StubTab label="Características" /></div>}
          {tab === 'of-docs'     && <div className="tab-content active"><StubTab label="Documentos" /></div>}
          {tab === 'of-seg'      && <div className="tab-content active"><StubTab label="Seguimiento comercial" /></div>}
          {tab === 'of-conf'     && <div className="tab-content active"><StubTab label="Confidencialidad" /></div>}

        </div>
      </div>
    </div>
  )
}
