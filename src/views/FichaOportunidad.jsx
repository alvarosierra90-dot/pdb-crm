import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import { MOCK_OPORTUNIDADES, ETAPA_TAG_CLASS } from './OportunidadesList'
import VinculacionesMaestra from '../components/VinculacionesMaestra'
import HeaderPills from '../components/HeaderPills'
import FunnelTracker from '../components/FunnelTracker'
import { Building, Building2, Tag, ScrollText, Lightbulb, Search } from 'lucide-react'

function KV({ k, v, mono = false, large = false }) {
  return (
    <div className="ir">
      <span className="ir-k">{k}</span>
      <span className="ir-v" style={{ fontFamily: mono ? 'var(--mono)' : undefined, fontSize: large ? 13 : undefined, fontWeight: large ? 700 : undefined }}>
        {v || <span style={{ color:'var(--text4)' }}>—</span>}
      </span>
    </div>
  )
}

function VinculacionCard({ icon, titulo, subtitulo, onClick, color = 'var(--accent)', bg = 'var(--accent-lt)', borderColor = 'var(--accent-bd)' }) {
  return (
    <div onClick={onClick} style={{ background:bg, border:`1px solid ${borderColor}`, borderRadius:6, padding:'8px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ fontSize:16 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, fontWeight:700, color, fontFamily:'var(--mono)' }}>{titulo}</div>
        {subtitulo && <div style={{ fontSize:10, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{subtitulo}</div>}
      </div>
      <span style={{ fontSize:10, color:'var(--text4)' }}>→</span>
    </div>
  )
}

function Seccion({ titulo, count, color, bgEmpty, vacioMsg, addLabel, onAdd, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ fontSize:11, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'.04em', display:'flex', alignItems:'center', gap:6 }}>
          {titulo}
          <span style={{ fontSize:9, fontWeight:700, color:'#fff', background:color, borderRadius:9, padding:'1px 7px' }}>{count}</span>
        </div>
        <button onClick={onAdd} className="ab-btn" style={{ fontSize:10, padding:'3px 9px' }}>+ {addLabel}</button>
      </div>
      {count === 0 ? (
        <div style={{ background: bgEmpty, border:'1px dashed var(--border)', borderRadius:6, padding:'10px 12px', fontSize:11, color:'var(--text4)', textAlign:'center' }}>
          {vacioMsg}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:6 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function FichaOportunidad() {
  const { navigate, params } = useNav()
  const op = MOCK_OPORTUNIDADES.find(o => o.id === params.id) || MOCK_OPORTUNIDADES[0]
  const [tab, setTab] = useState('info')

  const v = op.vinculaciones || { activos:[], ofertas:[], demandas:[], mandatos:[], negociaciones:[], propuestas:[] }
  const tagClass = ETAPA_TAG_CLASS[op.etapa] || 'tag-gray'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      {/* Banner Dynamics */}
      <div style={{ padding:'7px 16px', background:'#faf5ec', borderBottom:'1px solid #ece0c9', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:18, height:18, borderRadius:3, background:'#B08D57', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ color:'#fff', fontWeight:800, fontSize:10 }}>D</span>
        </div>
        <span style={{ fontSize:11, color:'#5a4828', fontWeight:600 }}>Información de la oportunidad: read-only · Editable solo en Microsoft Dynamics 365</span>
        <button onClick={() => alert('En producción, abrirá el registro directamente en Microsoft Dynamics 365.')} style={{ marginLeft:'auto', fontSize:10, padding:'3px 10px', background:'#B08D57', color:'#fff', border:'none', borderRadius:5, fontWeight:700, cursor:'pointer' }}>
          Editar en Dynamics ↗
        </button>
      </div>

      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn" onClick={() => navigate('oportunidades')}>← Volver</button>
        <div className="ab-sep"/>
        <button className="ab-btn">✅ Asignar tarea</button>
        <button className="ab-btn">Registrar actividad</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Funnel tracker · hilo conductor entre fases */}
          <FunnelTracker steps={[
            { key:'lead', label:'Lead', ref: op.lead_ref || null,
              onClick: op.lead_ref ? () => navigate('ficha-lead', { ref: op.lead_ref }) : null },
            { key:'opo',  label:'Oportunidad', ref: op.id, current: true, onClick: null },
            { key:'pry',  label:'Propuesta', ref: v.propuestas?.[0] || null,
              onClick: v.propuestas?.[0] ? () => navigate('ficha-propuesta', { id: v.propuestas[0] }) : null },
            { key:'man',  label:'Mandato', ref: v.mandatos?.[0] || null,
              onClick: v.mandatos?.[0] ? () => navigate('ficha-mandato', { ref: v.mandatos[0] }) : null },
          ]} />

          {/* Header con pills interactivos · canon unificado */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:50, height:50, borderRadius:10, background:'#f5efe5', border:'1px solid #93c5fd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                ⚡
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="ah-ref">
                  <span style={{ background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a', padding:'0 6px', borderRadius:3, fontSize:9, fontWeight:700 }}>OPORTUNIDAD</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>{op.id}</span>
                  {op.marco && <span style={{ color:'var(--text4)', fontSize:11 }}>· {op.marco}</span>}
                </div>
                <div className="ah-name">{op.nombre}</div>
                <div className="ah-addr">
                  {op.cuenta} · {op.contacto || '—'} · Resp. {op.responsable}
                </div>
              </div>
              {(() => {
                const prob = parseInt(op.probabilidad) || 50
                const probColor = prob >= 75 ? 'green' : prob >= 50 ? 'amber' : prob >= 25 ? 'default' : 'red'
                const lifetime = Number(op.lifetime || 0)
                const etapaColor = tagClass?.includes('green') ? 'green' : tagClass?.includes('red') ? 'red' : tagClass?.includes('amber') ? 'amber' : tagClass?.includes('blue') ? 'blue' : tagClass?.includes('purple') ? 'purple' : 'default'
                return (
                  <HeaderPills items={[
                    { key:'etapa', type:'info', label:'Etapa', value: op.etapa || '—', color: etapaColor, accent: !!op.etapa },
                    { key:'division', type:'info', label:'División', value: op.division || '—', color: op.division === 'Capital Markets' ? 'amber' : 'blue', accent: !!op.division },
                    op.pitch === 'Sí' && { key:'pitch', type:'info', label:'Vía', value:'Pitch', color:'green', accent:true },
                    { key:'prob', type:'info', label:'Probabilidad', value: `${prob}%`, color: probColor, accent: true },
                    { key:'lifetime', type:'info', label:'Lifetime', value: lifetime > 0 ? `${lifetime.toLocaleString('es-ES')} €` : '—', color:'green', accent: lifetime > 0 },
                    { key:'resp', type:'info', label:'Responsable', value: op.responsable || '—' },
                  ]} />
                )
              })()}
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <div className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Información general</div>
            <div className={`tab ${tab === 'vinc' ? 'active' : ''}`} onClick={() => setTab('vinc')}>Vinculaciones operativas</div>
            <div className={`tab ${tab === '360' ? 'active' : ''}`} onClick={() => setTab('360')}>Vista 360</div>
          </div>

          {/* Content */}
          <div style={{ padding:'18px 20px' }}>

            {tab === 'info' && (
              <div className="info-pad">

                {/* ── VINCULACIONES MAESTRA (Oportunidad es entidad maestra · conecta cuenta con propuesta/demanda/oferta) ── */}
                <VinculacionesMaestra items={[
                  {
                    key:'cuenta',
                    icon: Building2,
                    tone:'green',
                    label:'Cuenta',
                    value: op.cuenta || null,
                    sub: op.contacto || null,
                    onClick: op.cuenta ? () => navigate('cuentas', { search: op.cuenta }) : null,
                  },
                  {
                    key:'activos',
                    icon: Building,
                    tone:'bronze',
                    label:'Activos vinculados',
                    value: v.activos.length > 0 ? (v.activos.length === 1 ? 'activo' : 'activos') : null,
                    count: v.activos.length > 0 ? v.activos.length : null,
                    onClick: v.activos.length > 0 ? () => setTab('vinc') : null,
                  },
                  {
                    key:'ofertas',
                    icon: Tag,
                    tone:'blue',
                    label:'Ofertas / Demandas',
                    value: (v.ofertas.length + v.demandas.length) > 0 ? 'op. comerciales' : null,
                    count: (v.ofertas.length + v.demandas.length) > 0 ? (v.ofertas.length + v.demandas.length) : null,
                    onClick: (v.ofertas.length + v.demandas.length) > 0 ? () => setTab('vinc') : null,
                  },
                  {
                    key:'mandato',
                    icon: ScrollText,
                    tone:'accent',
                    label: v.mandatos.length === 1 ? 'Mandato' : 'Mandatos',
                    value: v.mandatos.length > 0 ? v.mandatos[0] : null,
                    sub: v.mandatos.length > 1 ? `+${v.mandatos.length - 1} más` : null,
                    onClick: v.mandatos.length > 0 ? () => navigate('ficha-mandato', { ref: v.mandatos[0] }) : null,
                  },
                ]} />

                {/* ── IDENTIFICACIÓN + ESTADO ── */}
                <div className="va-two-col">
                  <div className="va-meta-card">
                    <div className="va-meta-head"><span className="dot"/>Identificación</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Nombre</span><span className="ir-v" style={{fontWeight:600}}>{op.nombre || '—'}</span></div>
                      <div className="ir"><span className="ir-k">ID</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{op.id}</span></div>
                      <div className="ir"><span className="ir-k">Cuenta vinculada</span><span className="ir-v" style={{color:'var(--accent)',fontWeight:600}}>{op.cuenta || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Contacto</span><span className="ir-v">{op.contacto || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Responsable</span><span className="ir-v">{op.responsable || '—'}</span></div>
                      <div className="ir"><span className="ir-k">División</span><span className="ir-v">{op.div_user || '—'}</span></div>
                    </div>
                  </div>

                  <div className="va-meta-card">
                    <div className="va-meta-head accent-purple"><span className="dot"/>Estado y económica</div>
                    <div className="va-kv-list">
                      <div className="ir"><span className="ir-k">Etapa</span><span className="ir-v"><span className={`tag ${tagClass}`}>{op.etapa}</span></span></div>
                      <div className="ir"><span className="ir-k">Probabilidad</span><span className="ir-v" style={{fontWeight:700,color:'var(--accent)'}}>{op.probabilidad || 50}%</span></div>
                      <div className="ir"><span className="ir-k">Importe estimado</span><span className="ir-v" style={{fontFamily:'var(--mono)',color:'var(--green)',fontWeight:700}}>{Number(op.lifetime).toLocaleString('es-ES')} €</span></div>
                      <div className="ir"><span className="ir-k">Línea de negocio</span><span className="ir-v">{op.division || '—'}</span></div>
                      <div className="ir"><span className="ir-k">Fecha estimada cierre</span><span className="ir-v">{op.marco || '—'}</span></div>
                    </div>
                  </div>
                </div>

                {/* ── ORIGEN ── */}
                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico"></span> Origen</h3>
                  </div>
                  <div className="va-kv-list" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 40px',paddingBottom:16}}>
                    <div className="ir"><span className="ir-k">Origen del negocio</span><span className="ir-v">{op.origen || '—'}</span></div>
                    <div className="ir"><span className="ir-k">Remitido por</span><span className="ir-v">{op.remitido !== '—' ? op.remitido : <span style={{color:'var(--text4)'}}>—</span>}</span></div>
                    <div className="ir"><span className="ir-k">Razón comercial</span><span className="ir-v">{op.razon || '—'}</span></div>
                    <div className="ir"><span className="ir-k">Fecha de alta</span><span className="ir-v" style={{fontFamily:'var(--mono)'}}>{op.fecha || '—'}</span></div>
                  </div>
                </div>

                {/* ── DESCRIPCIÓN ── */}
                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico">▭</span> Descripción</h3>
                  </div>
                  <div style={{padding:'4px 20px 16px',fontSize:12,color:'var(--text2)',lineHeight:1.55}}>
                    {op.descripcion || <span style={{color:'var(--text4)'}}>Sin descripción registrada.</span>}
                  </div>
                </div>

                {/* ── NOTAS ── */}
                {op.notas && (
                  <div className="va-card">
                    <div className="va-card-header">
                      <h3><span className="ico">✎</span> Notas</h3>
                      <span className="hint">internas</span>
                    </div>
                    <div style={{padding:'4px 20px 16px',fontSize:11,color:'var(--text3)',lineHeight:1.55,fontStyle:'italic'}}>
                      {op.notas}
                    </div>
                  </div>
                )}

              </div>
            )}

            {tab === 'vinc' && (
              <>
                <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, padding:'8px 12px', marginBottom:18, fontSize:11, color:'#166534' }}>
                  🔗 Esta sección es editable en PDB. Vincula la Oportunidad con activos, ofertas, demandas, mandatos, negociaciones y propuestas para construir la trazabilidad operativa completa.
                </div>

                <Seccion
                  titulo="Activos"
                  count={v.activos.length}
                  color="#ea580c"
                  bgEmpty="#fff7ed"
                  vacioMsg="Sin activos vinculados — añade el inmueble afectado por esta oportunidad"
                  addLabel="Vincular activo"
                  onAdd={() => alert('Selector de activos (en producción).')}
                >
                  {v.activos.map(ref => (
                    <VinculacionCard
                      key={ref}
                      icon=""
                      titulo={ref}
                      subtitulo="Click para abrir ficha del activo"
                      color="#ea580c" bg="#fff7ed" borderColor="#fed7aa"
                      onClick={() => navigate('ficha-activo', { ref })}
                    />
                  ))}
                </Seccion>

                <Seccion
                  titulo="Ofertas"
                  count={v.ofertas.length}
                  color="#15803d"
                  bgEmpty="#f0fdf4"
                  vacioMsg="Sin ofertas vinculadas — la oferta lleva la disponibilidad del activo"
                  addLabel="Vincular oferta"
                  onAdd={() => alert('Selector de ofertas (en producción).')}
                >
                  {v.ofertas.map(ref => (
                    <VinculacionCard
                      key={ref}
                      icon=""
                      titulo={ref}
                      subtitulo="Click para abrir ficha de la oferta"
                      color="#15803d" bg="#f0fdf4" borderColor="#bbf7d0"
                      onClick={() => navigate('ficha-oferta', { ofertaRef: ref })}
                    />
                  ))}
                </Seccion>

                <Seccion
                  titulo="🔍 Demandas"
                  count={v.demandas.length}
                  color="#6b5b8e"
                  bgEmpty="#faf5ff"
                  vacioMsg="Sin demandas vinculadas"
                  addLabel="Vincular demanda"
                  onAdd={() => alert('Selector de demandas (en producción).')}
                >
                  {v.demandas.map(ref => (
                    <VinculacionCard
                      key={ref}
                      icon="🔍"
                      titulo={ref}
                      subtitulo="Click para abrir ficha de la demanda"
                      color="#6b5b8e" bg="#faf5ff" borderColor="#ddd6fe"
                      onClick={() => navigate('ficha-demanda', { ref })}
                    />
                  ))}
                </Seccion>

                <Seccion
                  titulo="Mandatos"
                  count={v.mandatos.length}
                  color="#b91c1c"
                  bgEmpty="#fef2f2"
                  vacioMsg="Sin mandatos vinculados — un mandato necesita Op + Oferta + Activo"
                  addLabel="Vincular mandato"
                  onAdd={() => alert('Selector de mandatos (en producción).')}
                >
                  {v.mandatos.map(ref => (
                    <VinculacionCard
                      key={ref}
                      icon=""
                      titulo={ref}
                      subtitulo="Click para abrir ficha del mandato"
                      color="#b91c1c" bg="#fef2f2" borderColor="#fecaca"
                      onClick={() => navigate('ficha-mandato', { ref })}
                    />
                  ))}
                </Seccion>

                <Seccion
                  titulo="↔ Negociaciones"
                  count={v.negociaciones.length}
                  color="#d97706"
                  bgEmpty="#fffbeb"
                  vacioMsg="Sin negociaciones abiertas para esta oportunidad"
                  addLabel="Vincular negociación"
                  onAdd={() => alert('Selector de negociaciones (en producción).')}
                >
                  {v.negociaciones.map(ref => (
                    <VinculacionCard
                      key={ref}
                      icon="↔"
                      titulo={ref}
                      subtitulo="Click para abrir hilo de negociación"
                      color="#d97706" bg="#fffbeb" borderColor="#fde68a"
                      onClick={() => navigate('ficha-negociacion', { ref })}
                    />
                  ))}
                </Seccion>

                <Seccion
                  titulo="Propuestas / Proyectos"
                  count={v.propuestas.length}
                  color="#0e7490"
                  bgEmpty="#ecfeff"
                  vacioMsg="Sin propuestas o proyectos vinculados"
                  addLabel="Vincular propuesta"
                  onAdd={() => alert('Selector de propuestas (en producción).')}
                >
                  {v.propuestas.map(ref => (
                    <VinculacionCard
                      key={ref}
                      icon=""
                      titulo={ref}
                      subtitulo="Click para abrir ficha de propuesta"
                      color="#0e7490" bg="#ecfeff" borderColor="#a5f3fc"
                      onClick={() => navigate('ficha-propuesta', { id: ref })}
                    />
                  ))}
                </Seccion>
              </>
            )}

            {tab === '360' && (
              <div>
                <div className="rp-lbl">Actividades de la oportunidad</div>
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
                      <td style={{ fontSize:11 }}>{op.fecha}</td>
                      <td><span className="tag tag-blue">⚡ Alta</span></td>
                      <td style={{ fontSize:11 }}>Oportunidad creada en Dynamics</td>
                      <td style={{ fontSize:11 }}>{op.creado}</td>
                      <td><span className="tag tag-green">Completada</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
