import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import { LEADS, LEAD_TIPOS, LEAD_ESTADOS, LEAD_PRIORIDADES } from '../data/mockLeads'
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

function KV({ k, v, mono = false }) {
  return (
    <div className="ir">
      <span className="ir-k">{k}</span>
      <span className="ir-v" style={mono ? { fontFamily:'monospace', fontSize:11 } : null}>{v || <span style={{ color:'var(--text4)' }}>—</span>}</span>
    </div>
  )
}

export default function FichaLead() {
  const { navigate, params } = useNav()
  const [tab, setTab] = useState('ld-info')
  const [showTransformar, setShowTransformar] = useState(false)
  const [showNulo, setShowNulo] = useState(false)

  const lead = LEADS.find(l => l.id === params.id) || LEADS[0]
  const cerrado = lead.estado === 'nulo' || lead.estado === 'descartado' || lead.estado === 'convertido'

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
                  {lead.id} · Origen: {lead.canal} · Entrada: {lead.fecha} · Responsable: {lead.responsable}
                </div>
                <div className="ah-tags" style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                  <TipoTag tipo={lead.tipo} />
                  <EstadoTag estado={lead.estado} />
                  <PrioridadTag prioridad={lead.prioridad} />
                  {lead.cuenta && <span className="tag tag-blue">🏢 {lead.cuenta}</span>}
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
                      <div className="ir"><span className="ir-k">ID</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{lead.id}</span></div>
                      <div className="ir"><span className="ir-k">Nombre</span><span className="ir-v" style={{fontWeight:600}}>{lead.nombre}</span></div>
                      <div className="ir"><span className="ir-k">Tipo</span><span className="ir-v">{LEAD_TIPOS.find(t => t.key === lead.tipo)?.label || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Estado</span><span className="ir-v"><EstadoTag estado={lead.estado}/></span></div>
                      <div className="ir"><span className="ir-k">Prioridad</span><span className="ir-v"><PrioridadTag prioridad={lead.prioridad}/></span></div>
                      <div className="ir"><span className="ir-k">Fecha entrada</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{lead.fecha}</span></div>
                      <div className="ir"><span className="ir-k">Última actividad</span><span className="ir-v">{lead.ultimaActividad || '—'}</span></div>
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
              </>
            )}

            {tab === 'ld-origen' && (
              <>
                <div className="va-two-col">
                  <div className="va-meta-card">
                    <div className="va-meta-head"><span className="dot"/>Canal y origen</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Canal de entrada</span><span className="ir-v">{lead.canal}</span></div>
                      <div className="ir"><span className="ir-k">Campaña asociada</span><span className="ir-v">{lead.campana !== '—' ? lead.campana : <span style={{color:'var(--text4)'}}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">Anuncio concreto</span><span className="ir-v">{lead.anuncio !== '—' ? lead.anuncio : <span style={{color:'var(--text4)'}}>—</span>}</span></div>
                      <div className="ir"><span className="ir-k">URL de origen</span><span className="ir-v" style={{fontFamily:'var(--mono)',fontSize:11}}>{lead.url !== '—' ? lead.url : <span style={{color:'var(--text4)'}}>—</span>}</span></div>
                    </div>
                  </div>
                  <div className="va-meta-card">
                    <div className="va-meta-head accent-purple"><span className="dot"/>Captura automática</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Fecha y hora</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{lead.fecha}</span></div>
                      <div className="ir"><span className="ir-k">Equipo por defecto</span><span className="ir-v">{lead.equipo}</span></div>
                      <div className="ir"><span className="ir-k">Responsable inicial</span><span className="ir-v">{lead.responsable}</span></div>
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
                    Para transformar este lead en oportunidad es <strong>obligatorio</strong> vincularlo al menos a una Cuenta o un Contacto. Sin vinculación no se puede crear oportunidad en Dynamics.
                  </div>
                </div>

                <div className="va-two-col">
                  <div className="va-meta-card">
                    <div className="va-meta-head"><span className="dot"/>Cuenta</div>
                    <div style={{padding:'12px 14px'}}>
                      {lead.cuenta ? (
                        <div onClick={() => navigate('cuentas')} style={{ background:'#dbeafe', border:'1px solid #93c5fd', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#1e40af', cursor:'pointer' }}>
                          🏢 {lead.cuenta}
                        </div>
                      ) : (
                        <div style={{ background:'var(--surface-2)', border:'1px dashed var(--border)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:11, color:'var(--text4)', textAlign:'center' }}>
                          Sin cuenta vinculada
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="va-meta-card">
                    <div className="va-meta-head accent-green"><span className="dot"/>Contacto</div>
                    <div style={{padding:'12px 14px'}}>
                      {lead.contacto && lead.contacto !== '—' ? (
                        <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, fontWeight:600, color:'#15803d' }}>
                          👤 {lead.contacto}
                        </div>
                      ) : (
                        <div style={{ background:'var(--surface-2)', border:'1px dashed var(--border)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:11, color:'var(--text4)', textAlign:'center' }}>
                          Sin contacto vinculado
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico">◇</span> Vinculaciones inmobiliarias</h3>
                    <span className="hint">opcionales</span>
                  </div>
                  <div className="va-kv-list" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 40px',paddingBottom:14}}>
                    <div className="ir"><span className="ir-k">Activo</span><span className="ir-v" style={{color:lead.activo?'var(--accent)':undefined,fontWeight:lead.activo?600:400}}>{lead.activo || <span style={{color:'var(--text4)'}}>—</span>}</span></div>
                    <div className="ir"><span className="ir-k">Oferta</span><span className="ir-v">{lead.oferta || <span style={{color:'var(--text4)'}}>—</span>}</span></div>
                    <div className="ir"><span className="ir-k">Demanda</span><span className="ir-v" style={{color:lead.demanda?'var(--accent)':undefined,fontWeight:lead.demanda?600:400}}>{lead.demanda || <span style={{color:'var(--text4)'}}>—</span>}</span></div>
                  </div>
                  <div style={{padding:'0 20px 16px',fontSize:11,color:'var(--text3)',lineHeight:1.5}}>
                    Un lead <strong>no requiere</strong> activo, oferta ni demanda para existir. Pueden estar vacíos en leads de cuenta/servicio o en leads tempranos sin contexto inmobiliario claro.
                  </div>
                </div>
              </>
            )}

            {tab === 'ld-act' && (
              <div className="va-card">
                <div className="va-card-header">
                  <h3><span className="ico">◈</span> Actividades del lead</h3>
                  <button className="ab-btn blue">+ Nueva actividad</button>
                </div>
                <div style={{padding:'4px 0 0'}}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead><tr>{['Fecha','Tipo','Asunto','Responsable','Estado'].map(h =>
                      <th key={h} style={{ padding:'8px 16px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', background:'var(--gray-lt)', borderBottom:'1px solid var(--border)', textTransform:'uppercase' }}>{h}</th>
                    )}</tr></thead>
                    <tbody>
                      <tr style={{borderBottom:'1px solid var(--border)'}}>
                        <td style={{ padding:'8px 16px', fontSize:11 }}>{lead.fecha}</td>
                        <td style={{ padding:'8px 16px' }}><span className="tag tag-blue">📥 Entrada</span></td>
                        <td style={{ padding:'8px 16px', fontSize:11 }}>Lead capturado automáticamente desde {lead.canal}</td>
                        <td style={{ padding:'8px 16px', fontSize:11 }}>Sistema</td>
                        <td style={{ padding:'8px 16px' }}><span className="tag tag-green">Completada</span></td>
                      </tr>
                      {lead.estado !== 'nuevo' && (
                        <tr style={{borderBottom:'1px solid var(--border)'}}>
                          <td style={{ padding:'8px 16px', fontSize:11 }}>—</td>
                          <td style={{ padding:'8px 16px' }}><span className="tag tag-purple">📞 Llamada</span></td>
                          <td style={{ padding:'8px 16px', fontSize:11 }}>Cualificación inicial</td>
                          <td style={{ padding:'8px 16px', fontSize:11 }}>{lead.responsable}</td>
                          <td style={{ padding:'8px 16px' }}><span className="tag tag-green">Completada</span></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
                      <div style={{ fontSize:10, color:'var(--text4)' }}>{lead.fecha} · {lead.canal}{lead.anuncio !== '—' ? ` · ${lead.anuncio}` : ''}</div>
                    </div>
                  </div>
                  {lead.estado !== 'nuevo' && (
                    <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>2</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>Asignado a {lead.responsable}</div>
                        <div style={{ fontSize:10, color:'var(--text4)' }}>{lead.equipo}</div>
                      </div>
                    </div>
                  )}
                  {(lead.estado === 'cualificado' || lead.estado === 'convertido') && (
                    <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#dcfce7', color:'#15803d', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>3</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>Cualificado</div>
                        <div style={{ fontSize:10, color:'var(--text4)' }}>Vinculado a Cuenta y Contacto</div>
                      </div>
                    </div>
                  )}
                  {lead.estado === 'convertido' && (
                    <div style={{ background:'#cffafe', border:'1px solid #67e8f9', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#0078d4', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>D</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#0e7490' }}>Transformado · Oportunidad creada en Dynamics</div>
                        <div style={{ fontSize:10, color:'#0891b2' }}>Sincronizado de vuelta al PDB</div>
                      </div>
                    </div>
                  )}
                  {(lead.estado === 'nulo' || lead.estado === 'descartado') && (
                    <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:'var(--r)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#dc2626', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✗</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#991b1b' }}>Lead nulo · {lead.motivoNulo || 'Sin motivo registrado'}</div>
                        <div style={{ fontSize:10, color:'#7f1d1d' }}>{lead.fechaNulo} · {lead.usuarioNulo}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {showTransformar && <TransformarLeadModal lead={lead} onClose={() => setShowTransformar(false)} />}
      {showNulo        && <LeadNuloModal       lead={lead} onClose={() => setShowNulo(false)} />}
    </div>
  )
}
