import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { LEAD_TIPOS, LEAD_ESTADOS, LEAD_PRIORIDADES } from '../data/mockLeads'
import TransformarLeadModal from '../components/TransformarLeadModal'
import LeadNuloModal from '../components/LeadNuloModal'

const TABS = [
  ['ld-info',    'Información'],
  ['ld-origen',  'Origen y captura'],
  ['ld-vinc',    'Vinculaciones'],
  ['ld-act',     'Actividades'],
  ['ld-traz',    'Trazabilidad'],
]

function TipoTag({ tipo }) {
  const t = LEAD_TIPOS.find(x => x.key === tipo)
  if (!t) return null
  return <span className={`tag ${t.tagClass}`}>{t.label}</span>
}
function EstadoTag({ estado }) {
  const e = LEAD_ESTADOS.find(x => x.key === estado)
  if (!e) return null
  return <span className={`tag ${e.tagClass}`}>{e.label}</span>
}
function PrioridadTag({ prioridad }) {
  const p = LEAD_PRIORIDADES.find(x => x.key === prioridad)
  if (!p) return null
  return <span className={`tag ${p.tagClass}`}>{p.label}</span>
}

function fmtFecha(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function FichaLead() {
  const { navigate, params } = useNav()
  const [tab, setTab] = useState('ld-info')
  const [showTransformar, setShowTransformar] = useState(false)
  const [showNulo, setShowNulo] = useState(false)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadLead = useCallback(async () => {
    if (!params.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        dynamics_accounts:dynamics_account_id     ( dynamics_id, nombre ),
        dynamics_contacts:dynamics_contact_id     ( dynamics_id, nombre, email ),
        dynamics_opportunities:dynamics_opportunity_id ( dynamics_id, nombre, tipo ),
        propuestas:propuesta_id ( id, ref, nombre, estado ),
        demandas:demanda_id     ( id, ref, nombre, estatus ),
        ofertas:oferta_id       ( id, ref )
      `)
      .eq('ref', params.id)
      .maybeSingle()
    if (error) {
      setError(error.message)
      setLead(null)
    } else if (!data) {
      setError('Lead no encontrado')
      setLead(null)
    } else {
      setLead(data)
      setError(null)
    }
    setLoading(false)
  }, [params.id])

  useEffect(() => { loadLead() }, [loadLead])

  if (loading) {
    return <div style={{ padding:32, color:'var(--text4)', fontSize:12 }}>Cargando…</div>
  }
  if (error || !lead) {
    return (
      <div style={{ padding:32 }}>
        <div style={{ fontSize:13, color:'#991b1b', marginBottom:12 }}>{error || 'Lead no encontrado'}</div>
        <button className="ab-btn" onClick={() => navigate('leads')}>← Volver a Leads</button>
      </div>
    )
  }

  const cuentaNombre   = lead.dynamics_accounts?.nombre   || null
  const contactoNombre = lead.dynamics_contacts?.nombre   || null
  const oportunidadId  = lead.dynamics_opportunities?.dynamics_id || null
  const oportunidadNombre = lead.dynamics_opportunities?.nombre || null

  const cerrado = lead.estado === 'cualificado' || lead.estado === 'no_cualificado'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Guardar y cerrar</button>
        <button className="ab-btn" onClick={() => navigate('leads')}>← Volver</button>
        <div className="ab-sep"/>
        <button
          className="ab-btn"
          style={{ background:'#0078d4', color:'#fff', border:'none', fontWeight:700, opacity: cerrado ? 0.5 : 1, cursor: cerrado ? 'not-allowed' : 'pointer' }}
          disabled={cerrado}
          onClick={() => !cerrado && setShowTransformar(true)}
        >
          ⚡ Transformar
        </button>
        <button
          className="ab-btn"
          style={{ background:'#dc2626', color:'#fff', border:'none', fontWeight:700, opacity: cerrado ? 0.5 : 1, cursor: cerrado ? 'not-allowed' : 'pointer' }}
          disabled={cerrado}
          onClick={() => !cerrado && setShowNulo(true)}
        >
          ✗ Lead Nulo
        </button>
        <div className="ab-sep"/>
        <button className="ab-btn">✅ Asignar tarea</button>
        <button className="ab-btn">📞 Registrar llamada</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Header */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:50, height:50, borderRadius:10, background:'#fef3c7', border:'1px solid #fde68a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                🎯
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="ah-name">{lead.nombre}</div>
                <div className="ah-addr">
                  {lead.ref} · Origen: {lead.origen_canal || lead.fuente || '—'} · Entrada: {fmtFecha(lead.created_at)} · Responsable: {lead.responsable || '—'}
                </div>
                <div className="ah-tags" style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                  <TipoTag tipo={lead.tipo} />
                  <EstadoTag estado={lead.estado} />
                  <PrioridadTag prioridad={lead.prioridad} />
                  {cuentaNombre && <span className="tag tag-blue">🏢 {cuentaNombre}</span>}
                  {oportunidadId && <span className="tag tag-teal">⚡ Oportunidad: {oportunidadNombre}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {TABS.map(([k, label]) => (
              <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</div>
            ))}
          </div>

          {/* Tab content */}
          <div className="info-pad">

            {tab === 'ld-info' && (
              <>
                <div className="va-two-col">
                  <div className="va-meta-card">
                    <div className="va-meta-head"><span className="dot"/>Datos del lead</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">ID</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{lead.ref}</span></div>
                      <div className="ir"><span className="ir-k">Nombre</span><span className="ir-v" style={{fontWeight:600}}>{lead.nombre}</span></div>
                      <div className="ir"><span className="ir-k">Tipo</span><span className="ir-v">{LEAD_TIPOS.find(t => t.key === lead.tipo)?.label || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Vía</span><span className="ir-v">{lead.via ? (lead.via === 'pitch' ? 'Pitch (con propuesta)' : 'Directo') : <span style={{color:'var(--text4)'}}>Por decidir</span>}</span></div>
                      <div className="ir"><span className="ir-k">Estado</span><span className="ir-v"><EstadoTag estado={lead.estado}/></span></div>
                      <div className="ir"><span className="ir-k">Prioridad</span><span className="ir-v"><PrioridadTag prioridad={lead.prioridad}/></span></div>
                      <div className="ir"><span className="ir-k">Fecha entrada</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{fmtFecha(lead.created_at)}</span></div>
                      <div className="ir"><span className="ir-k">Última actividad</span><span className="ir-v">{fmtFecha(lead.ultima_actividad)}</span></div>
                    </div>
                  </div>
                  <div className="va-meta-card">
                    <div className="va-meta-head accent-purple"><span className="dot"/>Asignación</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Equipo</span><span className="ir-v">{lead.equipo || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Responsable</span><span className="ir-v">{lead.responsable || '—'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico">▭</span> Descripción</h3>
                  </div>
                  <div style={{padding:'4px 20px 16px',fontSize:12,color:'var(--text2)',lineHeight:1.55}}>
                    {lead.descripcion || <span style={{color:'var(--text4)'}}>Sin descripción.</span>}
                  </div>
                </div>

                {lead.notas_cualificacion && (
                  <div className="va-card">
                    <div className="va-card-header">
                      <h3><span className="ico" style={{color:'var(--green)'}}>●</span> Notas de cualificación</h3>
                    </div>
                    <div style={{padding:'4px 20px 16px',fontSize:12,color:'var(--text2)',lineHeight:1.55}}>
                      {lead.notas_cualificacion}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'ld-origen' && (
              <>
                <div className="va-two-col">
                  <div className="va-meta-card">
                    <div className="va-meta-head"><span className="dot"/>Canal y origen</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Canal de entrada</span><span className="ir-v">{lead.origen_canal || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Campaña asociada</span><span className="ir-v">{lead.origen_campana || <span style={{color:'var(--text4)'}}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">Anuncio concreto</span><span className="ir-v">{lead.origen_anuncio || <span style={{color:'var(--text4)'}}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">URL de origen</span><span className="ir-v" style={{fontFamily:'var(--mono)',fontSize:11}}>{lead.origen_url || <span style={{color:'var(--text4)'}}>—</span>}</span></div>
                    </div>
                  </div>
                  <div className="va-meta-card">
                    <div className="va-meta-head accent-purple"><span className="dot"/>Captura automática</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Fecha y hora</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{fmtFecha(lead.created_at)}</span></div>
                      <div className="ir"><span className="ir-k">Equipo por defecto</span><span className="ir-v">{lead.equipo || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Responsable inicial</span><span className="ir-v">{lead.responsable || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Tipo sugerido</span><span className="ir-v"><TipoTag tipo={lead.tipo}/></span></div>
                    </div>
                  </div>
                </div>

                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico" style={{color:'var(--amber)'}}>●</span> Captura automática</h3>
                  </div>
                  <div style={{padding:'4px 20px 16px',fontSize:12,color:'var(--text3)',lineHeight:1.55}}>
                    Estos datos se han registrado automáticamente al entrar el lead. Permiten medir qué canales y campañas generan leads útiles vs nulos.
                  </div>
                </div>
              </>
            )}

            {tab === 'ld-vinc' && (
              <>
                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico" style={{color:'var(--pdb-blue)'}}>●</span> Vinculación obligatoria</h3>
                    <span className="hint">Para transformar el lead</span>
                  </div>
                  <div style={{padding:'4px 20px 16px',fontSize:12,color:'var(--text3)',lineHeight:1.55}}>
                    Para transformar este lead en oportunidad es <strong>obligatorio</strong> vincularlo al menos a una Cuenta o un Contacto de Dynamics. Sin vinculación no se puede crear oportunidad.
                  </div>
                </div>

                <div className="va-two-col">
                  <div className="va-meta-card">
                    <div className="va-meta-head"><span className="dot"/>Cuenta (Dynamics)</div>
                    <div style={{padding:'12px 14px'}}>
                      {cuentaNombre ? (
                        <div onClick={() => navigate('cuentas')} style={{ background:'#dbeafe', border:'1px solid #93c5fd', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#1e40af', cursor:'pointer' }}>
                          🏢 {cuentaNombre}
                        </div>
                      ) : (
                        <div style={{ background:'var(--surface-2)', border:'1px dashed var(--border)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:11, color:'var(--text4)', textAlign:'center' }}>
                          Sin cuenta vinculada
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="va-meta-card">
                    <div className="va-meta-head accent-green"><span className="dot"/>Contacto (Dynamics)</div>
                    <div style={{padding:'12px 14px'}}>
                      {contactoNombre ? (
                        <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#15803d' }}>
                          👤 {contactoNombre}
                        </div>
                      ) : (
                        <div style={{ background:'var(--surface-2)', border:'1px dashed var(--border)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:11, color:'var(--text4)', textAlign:'center' }}>
                          Sin contacto vinculado
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {oportunidadId && (
                  <div className="va-card">
                    <div className="va-card-header">
                      <h3><span className="ico" style={{color:'var(--accent)'}}>●</span> Registros generados al transformar</h3>
                    </div>
                    <div style={{padding:'4px 20px 16px', display:'flex', flexDirection:'column', gap:8}}>
                      <div style={{ background:'#cffafe', border:'1px solid #67e8f9', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#0e7490' }}>
                        ⚡ Oportunidad: {oportunidadNombre} <span style={{ fontFamily:'var(--mono)', fontSize:10, marginLeft:8, opacity:0.7 }}>{oportunidadId}</span>
                      </div>
                      {lead.propuestas && (
                        <div onClick={() => navigate('propuestas')} style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#92400e', cursor:'pointer' }}>
                          📄 Propuesta: {lead.propuestas.nombre || lead.propuestas.ref} <span className="tag tag-amber" style={{ marginLeft:8 }}>{lead.propuestas.estado}</span>
                        </div>
                      )}
                      {lead.demandas && (
                        <div onClick={() => navigate('demandas')} style={{ background:'#f3e8ff', border:'1px solid #d8b4fe', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#6b21a8', cursor:'pointer' }}>
                          🎯 Demanda: {lead.demandas.nombre || lead.demandas.ref} <span className="tag tag-purple" style={{ marginLeft:8 }}>{lead.demandas.estatus}</span>
                        </div>
                      )}
                      {lead.ofertas && (
                        <div onClick={() => navigate('ofertas')} style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#15803d', cursor:'pointer' }}>
                          🏢 Oferta: {lead.ofertas.ref}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'ld-act' && (
              <div className="va-card">
                <div className="va-card-header">
                  <h3><span className="ico">◈</span> Actividades del lead</h3>
                  <button className="ab-btn blue">+ Nueva actividad</button>
                </div>
                <div style={{padding:'12px 20px',fontSize:11,color:'var(--text4)'}}>
                  Próximamente: actividades del lead vinculadas vía tabla `actividades`.
                </div>
              </div>
            )}

            {tab === 'ld-traz' && (
              <div className="va-card">
                <div className="va-card-header">
                  <h3><span className="ico">◷</span> Trazabilidad completa</h3>
                </div>
                <div style={{padding:'4px 20px 18px',display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'#dbeafe', color:'#1e40af', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>1</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600 }}>Lead capturado</div>
                      <div style={{ fontSize:10, color:'var(--text4)' }}>{fmtFecha(lead.created_at)} · {lead.origen_canal}{lead.origen_anuncio ? ` · ${lead.origen_anuncio}` : ''}</div>
                    </div>
                  </div>
                  {lead.estado !== 'nuevo' && (
                    <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>2</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>Asignado a {lead.responsable || '—'}</div>
                        <div style={{ fontSize:10, color:'var(--text4)' }}>{lead.equipo || '—'}</div>
                      </div>
                    </div>
                  )}
                  {lead.estado === 'cualificado' && (
                    <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#dcfce7', color:'#15803d', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>3</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>Cualificado</div>
                        <div style={{ fontSize:10, color:'var(--text4)' }}>{fmtFecha(lead.fecha_cualificacion)} · Vinculado a Cuenta y Contacto</div>
                      </div>
                    </div>
                  )}
                  {oportunidadId && (
                    <div style={{ background:'#cffafe', border:'1px solid #67e8f9', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#0078d4', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>D</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#0e7490' }}>Transformado · Oportunidad creada en Dynamics</div>
                        <div style={{ fontSize:10, color:'#0891b2', fontFamily:'var(--mono)' }}>{oportunidadId} · {oportunidadNombre}</div>
                      </div>
                    </div>
                  )}
                  {lead.estado === 'no_cualificado' && (
                    <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#dc2626', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✗</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#991b1b' }}>Lead nulo · {lead.motivo_no_cualificado || 'Sin motivo registrado'}</div>
                        <div style={{ fontSize:10, color:'#7f1d1d' }}>{fmtFecha(lead.fecha_nulo)} · {lead.usuario_nulo || '—'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {showTransformar && <TransformarLeadModal lead={lead} onClose={() => setShowTransformar(false)} onSuccess={() => { setShowTransformar(false); loadLead() }} />}
      {showNulo        && <LeadNuloModal       lead={lead} onClose={() => setShowNulo(false)}       onSuccess={() => { setShowNulo(false); loadLead() }} />}
    </div>
  )
}
