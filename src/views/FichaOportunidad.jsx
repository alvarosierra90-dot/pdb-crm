import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import { MOCK_OPORTUNIDADES } from './OportunidadesList'

const ETAPA_TAG = {
  'Identificación':      { bg:'#f0f9ff', color:'#0369a1', bd:'#bae6fd' },
  'Calificación':        { bg:'#fefce8', color:'#92400e', bd:'#fde68a' },
  'Propuesta enviada':   { bg:'#eff6ff', color:'#1d4ed8', bd:'#bfdbfe' },
  'Negociación':         { bg:'#fdf4ff', color:'#7e22ce', bd:'#e9d5ff' },
  'Acuerdo alcanzado':   { bg:'#f0fdf4', color:'#15803d', bd:'#bbf7d0' },
}

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
  const tag = ETAPA_TAG[op.etapa] || { bg:'var(--gray-lt)', color:'var(--text3)', bd:'var(--border)' }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      {/* Banner Dynamics */}
      <div style={{ padding:'7px 16px', background:'#eff6ff', borderBottom:'1px solid #bfdbfe', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:18, height:18, borderRadius:3, background:'#0078d4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ color:'#fff', fontWeight:800, fontSize:10 }}>D</span>
        </div>
        <span style={{ fontSize:11, color:'#1e40af', fontWeight:600 }}>Información de la oportunidad: read-only · Editable solo en Microsoft Dynamics 365</span>
        <button onClick={() => alert('En producción, abrirá el registro directamente en Microsoft Dynamics 365.')} style={{ marginLeft:'auto', fontSize:10, padding:'3px 10px', background:'#0078d4', color:'#fff', border:'none', borderRadius:5, fontWeight:700, cursor:'pointer' }}>
          Editar en Dynamics ↗
        </button>
      </div>

      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn" onClick={() => navigate('oportunidades')}>← Volver</button>
        <div className="ab-sep"/>
        <button className="ab-btn">✅ Asignar tarea</button>
        <button className="ab-btn">📞 Registrar actividad</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Header */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:50, height:50, borderRadius:10, background:'#dbeafe', border:'1px solid #93c5fd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                ⚡
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="ah-name">{op.nombre}</div>
                <div className="ah-addr">
                  {op.id} · {op.cuenta} · {op.contacto || '—'} · Resp. {op.responsable}
                </div>
                <div className="ah-tags" style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:11, fontWeight:700, color:tag.color, background:tag.bg, border:`1px solid ${tag.bd}`, borderRadius:8, padding:'3px 10px' }}>{op.etapa}</span>
                  <span className={`tag ${op.division === 'Capital Markets' ? 'tag-amber' : 'tag-blue'}`}>{op.division}</span>
                  <span className="tag tag-gray">{op.marco}</span>
                  {op.pitch === 'Sí' && <span className="tag tag-green">Pitch</span>}
                  <span style={{ fontSize:11, fontWeight:700, color:'#15803d', marginLeft:'auto' }}>{Number(op.lifetime).toLocaleString('es-ES')} €</span>
                  <span style={{ fontSize:11, color:'var(--text4)' }}>· {op.probabilidad || 50}% probabilidad</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <div className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Información de la oportunidad</div>
            <div className={`tab ${tab === 'vinc' ? 'active' : ''}`} onClick={() => setTab('vinc')}>Vinculaciones operativas</div>
            <div className={`tab ${tab === 'act' ? 'active' : ''}`} onClick={() => setTab('act')}>Actividades</div>
          </div>

          {/* Content */}
          <div style={{ padding:'18px 20px' }}>

            {tab === 'info' && (
              <>
                <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:'8px 12px', marginBottom:18, fontSize:11, color:'#7c2d12' }}>
                  ℹ️ Estos datos se sincronizan desde Microsoft Dynamics 365 y no son editables en PDB. La Cuenta vinculada se hereda automáticamente.
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
                  <div>
                    <div className="rp-lbl">Identificación</div>
                    <KV k="Nombre de la oportunidad" v={op.nombre} large />
                    <KV k="ID" v={op.id} mono />
                    <KV k="Cuenta vinculada" v={<span style={{ color:'var(--accent)', fontWeight:600 }}>🏢 {op.cuenta}</span>} />
                    <KV k="Contacto" v={op.contacto} />
                    <KV k="Responsable" v={op.responsable} />
                    <KV k="División" v={op.div_user} />
                  </div>
                  <div>
                    <div className="rp-lbl">Estado y económica</div>
                    <KV k="Etapa" v={<span style={{ fontSize:11, fontWeight:700, color:tag.color, background:tag.bg, border:`1px solid ${tag.bd}`, borderRadius:8, padding:'2px 10px' }}>{op.etapa}</span>} />
                    <KV k="Probabilidad de éxito" v={<span style={{ fontWeight:700, color:'var(--accent)' }}>{op.probabilidad || 50}%</span>} />
                    <KV k="Importe estimado (lifetime)" v={<span style={{ color:'var(--green)', fontWeight:700, fontFamily:'var(--mono)' }}>{Number(op.lifetime).toLocaleString('es-ES')} €</span>} />
                    <KV k="Línea de negocio" v={op.division} />
                    <KV k="Fecha estimada cierre" v={op.marco} />
                    <KV k="Origen del negocio" v={op.origen} />
                    <KV k="Remitido por" v={op.remitido} />
                    <KV k="Razón comercial" v={op.razon} />
                  </div>
                </div>

                <div style={{ marginTop:24 }}>
                  <div className="rp-lbl">Descripción</div>
                  <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, padding:'10px 12px', fontSize:12, color:'var(--text)', lineHeight:1.5 }}>
                    {op.descripcion || op.notas || '—'}
                  </div>
                </div>

                <div style={{ marginTop:18 }}>
                  <div className="rp-lbl">Notas</div>
                  <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, padding:'10px 12px', fontSize:11, color:'var(--text3)', lineHeight:1.5, fontStyle:'italic' }}>
                    {op.notas || '—'}
                  </div>
                </div>
              </>
            )}

            {tab === 'vinc' && (
              <>
                <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, padding:'8px 12px', marginBottom:18, fontSize:11, color:'#166534' }}>
                  🔗 Esta sección es editable en PDB. Vincula la Oportunidad con activos, ofertas, demandas, mandatos, negociaciones y propuestas para construir la trazabilidad operativa completa.
                </div>

                <Seccion
                  titulo="🏢 Activos"
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
                      icon="🏢"
                      titulo={ref}
                      subtitulo="Click para abrir ficha del activo"
                      color="#ea580c" bg="#fff7ed" borderColor="#fed7aa"
                      onClick={() => navigate('ficha-activo', { ref })}
                    />
                  ))}
                </Seccion>

                <Seccion
                  titulo="📨 Ofertas"
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
                      icon="📨"
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
                  color="#7c3aed"
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
                      color="#7c3aed" bg="#faf5ff" borderColor="#ddd6fe"
                      onClick={() => navigate('ficha-demanda', { ref })}
                    />
                  ))}
                </Seccion>

                <Seccion
                  titulo="📋 Mandatos"
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
                      icon="📋"
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
                  titulo="📊 Propuestas / Proyectos"
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
                      icon="📊"
                      titulo={ref}
                      subtitulo="Click para abrir ficha de propuesta"
                      color="#0e7490" bg="#ecfeff" borderColor="#a5f3fc"
                      onClick={() => navigate('ficha-propuesta', { id: ref })}
                    />
                  ))}
                </Seccion>
              </>
            )}

            {tab === 'act' && (
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
