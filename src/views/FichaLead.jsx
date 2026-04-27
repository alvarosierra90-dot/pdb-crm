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
  return <span style={{ fontSize:11, fontWeight:700, color:t.color, background:t.bg, border:`1px solid ${t.color}33`, borderRadius:8, padding:'3px 10px' }}>{t.label}</span>
}
function EstadoTag({ estado }) {
  const e = LEAD_ESTADOS.find(x => x.key === estado)
  if (!e) return null
  return <span style={{ fontSize:11, fontWeight:700, color:e.color, background:e.bg, border:`1px solid ${e.color}33`, borderRadius:8, padding:'3px 10px' }}>{e.label}</span>
}
function PrioridadTag({ prioridad }) {
  const p = LEAD_PRIORIDADES.find(x => x.key === prioridad)
  if (!p) return null
  return <span style={{ fontSize:10, fontWeight:700, color:p.color, background:p.bg, border:`1px solid ${p.color}33`, borderRadius:8, padding:'2px 8px' }}>{p.label}</span>
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
          <div style={{ padding:'18px 20px' }}>

            {tab === 'ld-info' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
                <div>
                  <div className="rp-lbl">Datos del lead</div>
                  <KV k="ID" v={lead.id} mono />
                  <KV k="Nombre" v={lead.nombre} />
                  <KV k="Tipo" v={LEAD_TIPOS.find(t => t.key === lead.tipo)?.label} />
                  <KV k="Estado" v={LEAD_ESTADOS.find(e => e.key === lead.estado)?.label} />
                  <KV k="Prioridad" v={LEAD_PRIORIDADES.find(p => p.key === lead.prioridad)?.label} />
                  <KV k="Fecha entrada" v={lead.fecha} />
                  <KV k="Última actividad" v={lead.ultimaActividad} />
                </div>
                <div>
                  <div className="rp-lbl">Asignación</div>
                  <KV k="Equipo" v={lead.equipo} />
                  <KV k="Responsable" v={lead.responsable} />
                  <div className="rp-lbl" style={{ marginTop:18 }}>Descripción</div>
                  <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, padding:'10px 12px', fontSize:12, color:'var(--text)', lineHeight:1.5 }}>
                    {lead.descripcion}
                  </div>
                </div>
              </div>
            )}

            {tab === 'ld-origen' && (
              <div>
                <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:12, marginBottom:18 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#7c2d12', marginBottom:4 }}>📡 Captura automática</div>
                  <div style={{ fontSize:11, color:'#7c2d12' }}>
                    Estos datos se han registrado automáticamente al entrar el lead. Permiten medir qué canales y campañas generan leads útiles vs nulos.
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
                  <div>
                    <div className="rp-lbl">Canal y origen</div>
                    <KV k="Canal de entrada" v={lead.canal} />
                    <KV k="Campaña asociada" v={lead.campana !== '—' ? lead.campana : null} />
                    <KV k="Anuncio concreto" v={lead.anuncio !== '—' ? lead.anuncio : null} />
                    <KV k="URL de origen" v={lead.url !== '—' ? lead.url : null} mono />
                  </div>
                  <div>
                    <div className="rp-lbl">Captura</div>
                    <KV k="Fecha y hora" v={lead.fecha} />
                    <KV k="Equipo asignado por defecto" v={lead.equipo} />
                    <KV k="Responsable inicial" v={lead.responsable} />
                    <KV k="Tipo de lead sugerido" v={LEAD_TIPOS.find(t => t.key === lead.tipo)?.label} />
                  </div>
                </div>
              </div>
            )}

            {tab === 'ld-vinc' && (
              <div>
                <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:12, marginBottom:18, display:'flex', alignItems:'flex-start', gap:8 }}>
                  <span style={{ width:18, height:18, borderRadius:3, background:'#0078d4', color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>D</span>
                  <div style={{ fontSize:11, color:'#1e3a8a' }}>
                    Para transformar este lead en oportunidad es <strong>obligatorio</strong> vincularlo al menos a una Cuenta o un Contacto. Sin vinculación no se puede crear oportunidad en Dynamics.
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
                  <div>
                    <div className="rp-lbl">Cuenta</div>
                    {lead.cuenta ? (
                      <div style={{ background:'#dbeafe', border:'1px solid #93c5fd', borderRadius:8, padding:'10px 12px', fontSize:12, fontWeight:600, color:'#1e40af', cursor:'pointer' }} onClick={() => navigate('cuentas')}>
                        🏢 {lead.cuenta}
                      </div>
                    ) : (
                      <div style={{ background:'var(--surface-2)', border:'1px dashed var(--border)', borderRadius:8, padding:'10px 12px', fontSize:11, color:'var(--text4)', textAlign:'center' }}>
                        Sin cuenta vinculada · vincular antes de transformar
                      </div>
                    )}

                    <div className="rp-lbl" style={{ marginTop:18 }}>Contacto</div>
                    {lead.contacto && lead.contacto !== '—' ? (
                      <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'10px 12px', fontSize:12, fontWeight:600, color:'#15803d' }}>
                        👤 {lead.contacto}
                      </div>
                    ) : (
                      <div style={{ background:'var(--surface-2)', border:'1px dashed var(--border)', borderRadius:8, padding:'10px 12px', fontSize:11, color:'var(--text4)', textAlign:'center' }}>
                        Sin contacto vinculado
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="rp-lbl">Vinculaciones inmobiliarias (opcionales)</div>
                    <KV k="Activo" v={lead.activo ? <span style={{ color:'var(--accent)', fontWeight:600 }}>{lead.activo}</span> : null} />
                    <KV k="Oferta" v={lead.oferta} />
                    <KV k="Demanda" v={lead.demanda ? <span style={{ color:'var(--accent)', fontWeight:600 }}>{lead.demanda}</span> : null} />

                    <div style={{ marginTop:18, fontSize:11, color:'var(--text3)', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, padding:'10px 12px', lineHeight:1.5 }}>
                      Un lead <strong>no requiere</strong> activo, oferta ni demanda para existir. Pueden estar vacíos en leads de cuenta/servicio o en leads tempranos sin contexto inmobiliario claro.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'ld-act' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <div className="rp-lbl" style={{ marginBottom:0 }}>Actividades del lead</div>
                  <button className="ab-btn blue" style={{ marginLeft:'auto', padding:'4px 10px', fontSize:11 }}>+ Nueva actividad</button>
                </div>

                <table className="main-tbl">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Asunto</th>
                      <th>Responsable</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontSize:11 }}>{lead.fecha}</td>
                      <td><span className="tag tag-blue">📥 Entrada</span></td>
                      <td style={{ fontSize:11 }}>Lead capturado automáticamente desde {lead.canal}</td>
                      <td style={{ fontSize:11 }}>Sistema</td>
                      <td><span className="tag tag-green">Completada</span></td>
                    </tr>
                    {lead.estado !== 'nuevo' && (
                      <tr>
                        <td style={{ fontSize:11 }}>—</td>
                        <td><span className="tag tag-purple">📞 Llamada</span></td>
                        <td style={{ fontSize:11 }}>Cualificación inicial</td>
                        <td style={{ fontSize:11 }}>{lead.responsable}</td>
                        <td><span className="tag tag-green">Completada</span></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'ld-traz' && (
              <div>
                <div className="rp-lbl">Trazabilidad completa</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
                  <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'#dbeafe', color:'#1e40af', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>1</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:600 }}>Lead capturado</div>
                      <div style={{ fontSize:10, color:'var(--text4)' }}>{lead.fecha} · {lead.canal}{lead.anuncio !== '—' ? ` · ${lead.anuncio}` : ''}</div>
                    </div>
                  </div>
                  {lead.estado !== 'nuevo' && (
                    <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>2</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:600 }}>Asignado a {lead.responsable}</div>
                        <div style={{ fontSize:10, color:'var(--text4)' }}>{lead.equipo}</div>
                      </div>
                    </div>
                  )}
                  {(lead.estado === 'cualificado' || lead.estado === 'convertido') && (
                    <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#dcfce7', color:'#15803d', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>3</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:600 }}>Cualificado</div>
                        <div style={{ fontSize:10, color:'var(--text4)' }}>Vinculado a Cuenta y Contacto</div>
                      </div>
                    </div>
                  )}
                  {lead.estado === 'convertido' && (
                    <div style={{ background:'#cffafe', border:'1px solid #67e8f9', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#0078d4', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>D</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:'#0e7490' }}>Transformado · Oportunidad creada en Dynamics</div>
                        <div style={{ fontSize:10, color:'#0891b2' }}>Sincronizado de vuelta al PDB</div>
                      </div>
                    </div>
                  )}
                  {(lead.estado === 'nulo' || lead.estado === 'descartado') && (
                    <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#dc2626', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✗</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:'#991b1b' }}>Lead nulo · {lead.motivoNulo || 'Sin motivo registrado'}</div>
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
