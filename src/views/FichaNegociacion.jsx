import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'

const TABS = ['neg-chat','neg-condiciones','neg-docs','neg-historial','neg-colab']
const TAB_LABELS = ['💬 Negociación','📋 Condiciones acordadas','📁 Documentos contractuales','🕐 Historial completo','👥 Equipos colaboradores']

const COLAB_INIT_NEG = [
  { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable negociación', initials:'AS', bg:'#dbeafe', color:'#1e40af', principal:true },
]

export default function FichaNegociacion() {
  const { navigate } = useNav()
  const [activeTab, setActiveTab] = useState('neg-chat')
  const [colabTeams, setColabTeams] = useState(COLAB_INIT_NEG)
  const [addingTeam, setAddingTeam] = useState(false)
  const [newTeam, setNewTeam] = useState('')
  const [showTarea, setShowTarea] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Cerrar negociación</button>
        <button className="ab-btn">Pasar a Instrucción</button>
        <div className="ab-sep" />
        <button className="ab-btn blue" onClick={() => alert('✅ Link copiado:\nhttps://pdb.savills.es/neg/NEG-0044\n\nCompartir con ambas partes.')}>🔗 Copiar link partes</button>
        <button className="ab-btn">📄 Subir contrato</button>
        <button className="ab-btn" onClick={() => navigate('ficha-activo')}>📊 Ver activo vinculado</button>
        <div className="ab-sep" />
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
      </div>

      {/* Header */}
      <div className="ah">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div className="ah-ico" style={{ background: 'linear-gradient(135deg,#1e3a8a,#6366f1)' }}>🤝</div>
          <div style={{ flex: 1 }}>
            <div className="ah-ref">
              <span className="ref-badge-neg">NEGOCIACIÓN</span>
              <span className="asset-link" style={{fontFamily:'var(--mono)'}}>NEG-0044</span>
              <span style={{ color: 'var(--text3)' }}>· Activo: <span className="pat-link" onClick={() => navigate('ficha-activo')}>P.E Avalon — Santa Leonor 65</span></span>
            </div>
            <div className="ah-name">Empresa XYZ — 1.000 m² · P.E Avalon</div>
            <div className="ah-addr">📍 Calle Santa Leonor 65, 28037 Madrid · M-30 · Iniciada: 10/03/2026 · Última actividad: 15/03/2026</div>
            <div className="ah-tags">
              <span className="tag tag-amber">↔ En negociación</span>
              <span className="tag tag-blue">Alquiler oficinas</span>
              <span className="tag tag-gray">1.000 m²</span>
              <span className="dias-pill">📅 20 días</span>
              <span style={{ background: 'var(--green-lt)', color: 'var(--green)', border: '1px solid var(--green-bd)', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>🔗 Link activo</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Cierre estimado</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>30/03/2026</div>
            <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600 }}>⚠ Vencido</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t, i) => (
          <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[i]}</div>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat */}
          {activeTab === 'neg-chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Chat header */}
              <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div className="neg-av" style={{ background: '#dbeafe', color: '#1e40af', width: 28, height: 28 }}>AS</div>
                  <div><div style={{ fontSize: 11, fontWeight: 600 }}>Sierra Álvaro · Savills</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>Parte — Propietario Avalon</div></div>
                </div>
                <div style={{ fontSize: 16, color: 'var(--border2)' }}>⇄</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div className="neg-av" style={{ background: '#fce7f3', color: '#9d174d', width: 28, height: 28 }}>XY</div>
                  <div><div style={{ fontSize: 11, fontWeight: 600 }}>Ana Gómez · Empresa XYZ</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>Contraparte — Demanda</div></div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--text4)', padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 20 }}>Ronda 3 de negociación</span>
                  <button className="ab-btn blue" style={{ padding: '3px 9px', fontSize: 10 }} onClick={() => alert('Link enviado a Ana Gómez (Empresa XYZ)')}>🔗 Enviar link</button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Oferta inicial */}
                <div className="neg-bubble-left">
                  <div className="neg-meta">
                    <div className="neg-av" style={{ background: '#dbeafe', color: '#1e40af' }}>AS</div>
                    <span className="neg-name">Sierra Álvaro · Savills (Propiedad Avalon)</span>
                    <span>10/03/2026 · 09:45</span>
                    <span style={{ background: 'var(--accent-lt)', color: 'var(--accent)', border: '1px solid var(--accent-bd)', padding: '0 6px', borderRadius: 8, fontSize: 9, fontWeight: 700 }}>OFERTA INICIAL</span>
                  </div>
                  <div className="neg-msg">
                    Buenos días Ana. Adjunto propuesta de arrendamiento para 1.000 m² en planta 5 del P.E Avalon:
                    <div className="neg-grid">
                      <div className="neg-grid-item"><span>Superficie</span><span>1.000 m²</span></div>
                      <div className="neg-grid-item"><span>Planta</span><span>P5 — Avalon</span></div>
                      <div className="neg-grid-item"><span>Renta</span><span style={{ color: 'var(--accent)' }}>18,00 €/m²/mes</span></div>
                      <div className="neg-grid-item"><span>Duración</span><span>5 años</span></div>
                      <div className="neg-grid-item"><span>Carencia</span><span>2 meses</span></div>
                      <div className="neg-grid-item"><span>Gastos comunes</span><span>3,50 €/m²</span></div>
                    </div>
                  </div>
                </div>

                {/* Contraoferta */}
                <div className="neg-bubble-right">
                  <div className="neg-meta" style={{ justifyContent: 'flex-end' }}>
                    <span style={{ background: 'var(--amber-lt)', color: 'var(--amber)', border: '1px solid var(--amber-bd)', padding: '0 6px', borderRadius: 8, fontSize: 9, fontWeight: 700 }}>CONTRAOFERTA</span>
                    <span>12/03/2026 · 14:20</span>
                    <span className="neg-name">Ana Gómez · Empresa XYZ</span>
                    <div className="neg-av" style={{ background: '#fce7f3', color: '#9d174d' }}>XY</div>
                  </div>
                  <div className="neg-msg-amber">
                    Álvaro, gracias por la propuesta. Estamos interesados pero necesitamos mejorar las condiciones económicas:
                    <div className="neg-grid" style={{ background: 'rgba(217,119,6,.08)' }}>
                      <div className="neg-grid-item"><span>Superficie</span><span>1.000 m²</span></div>
                      <div className="neg-grid-item"><span>Renta</span><span style={{ color: 'var(--amber)' }}>20,00 €/m²/mes <span style={{ fontSize: 9, textDecoration: 'line-through', color: 'var(--text4)' }}>18€</span></span></div>
                      <div className="neg-grid-item"><span>Duración</span><span>5 años ✓</span></div>
                      <div className="neg-grid-item"><span>Carencia</span><span style={{ color: 'var(--amber)' }}>2 meses</span></div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text4)' }}>Además solicitamos que los gastos comunes queden incluidos en la renta.</div>
                  </div>
                </div>

                {/* Ajuste */}
                <div className="neg-bubble-right">
                  <div className="neg-meta" style={{ justifyContent: 'flex-end' }}>
                    <span style={{ background: 'var(--purple-lt)', color: 'var(--purple)', border: '1px solid var(--purple-bd)', padding: '0 6px', borderRadius: 8, fontSize: 9, fontWeight: 700 }}>AJUSTE</span>
                    <span>15/03/2026 · 11:05</span>
                    <span className="neg-name">Ana Gómez · Empresa XYZ</span>
                    <div className="neg-av" style={{ background: '#fce7f3', color: '#9d174d' }}>XY</div>
                  </div>
                  <div className="neg-msg-amber">
                    Tras consultar internamente, hacemos un ajuste. Nuestra propuesta final:
                    <div className="neg-grid" style={{ background: 'rgba(124,58,237,.07)' }}>
                      <div className="neg-grid-item"><span>Superficie</span><span>1.000 m²</span></div>
                      <div className="neg-grid-item"><span>Renta</span><span style={{ color: 'var(--purple)' }}>19,00 €/m²/mes</span></div>
                      <div className="neg-grid-item"><span>Duración</span><span>5 años</span></div>
                      <div className="neg-grid-item"><span>Carencia</span><span style={{ color: 'var(--purple)' }}>3 meses</span></div>
                      <div className="neg-grid-item" style={{ gridColumn: '1/-1' }}><span>Gastos comunes</span><span>Incluidos en renta</span></div>
                    </div>
                  </div>
                </div>

                {/* Pending indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 'var(--r)', fontSize: 11, color: '#92400e' }}>
                  <span style={{ fontSize: 14 }}>⏳</span>
                  <span><strong>Pendiente respuesta de Propiedad Avalon</strong> — Última propuesta recibida: 15/03/2026 · 11:05</span>
                  <button className="ab-btn" style={{ marginLeft: 'auto', padding: '3px 9px', fontSize: 10, borderColor: '#fde68a' }}>Enviar recordatorio</button>
                </div>
              </div>

              {/* Input bar */}
              <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '10px 16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, border: '1px solid var(--border2)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: 4, padding: '4px 8px', borderBottom: '1px solid var(--border)', background: 'var(--gray-lt)' }}>
                      <button className="ab-btn" style={{ padding: '2px 8px', fontSize: 10 }}>💰 Nueva propuesta</button>
                      <button className="ab-btn" style={{ padding: '2px 8px', fontSize: 10 }}>📎 Adjuntar</button>
                      <button className="ab-btn" style={{ padding: '2px 8px', fontSize: 10 }}>✅ Aceptar</button>
                      <button className="ab-btn" style={{ padding: '2px 8px', fontSize: 10, color: 'var(--red)', borderColor: 'var(--red-bd)' }}>✗ Rechazar</button>
                    </div>
                    <textarea style={{ width: '100%', padding: '8px 10px', border: 'none', fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none', minHeight: 52 }} placeholder="Escribe un mensaje o nueva propuesta..." />
                  </div>
                  <button className="ab-btn save" style={{ padding: '8px 16px' }}>Enviar →</button>
                </div>
              </div>
            </div>
          )}

          {/* Condiciones acordadas */}
          {activeTab === 'neg-condiciones' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div className="info-pad">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Condiciones acordadas <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text4)' }}>· Ronda 3 — actualizado 15/03/2026</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 16 }}>
                  {[['3','Ronda'],['19,00 €','Renta última','Inicial: 18,00 €','var(--purple)'],['5 años','Duración'],['↔ Negociando','Estado',null,'var(--amber)']].map(([v,l,s,c],i) => (
                    <div key={i} style={{ background: 'var(--surface)', padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{l}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: c || 'var(--text)' }}>{v}</div>
                      {s && <div style={{ fontSize: 9, color: 'var(--text3)' }}>{s}</div>}
                    </div>
                  ))}
                </div>
                <table className="pat-table">
                  <thead><tr><th>Condición</th><th>Oferta inicial</th><th>Contraoferta 1</th><th>Ajuste 2</th><th>Estado</th></tr></thead>
                  <tbody>
                    <tr><td style={{ fontWeight: 500 }}>Renta (€/m²/mes)</td><td>18,00 €</td><td style={{ color: 'var(--amber)' }}>20,00 €</td><td style={{ color: 'var(--purple)', fontWeight: 700 }}>19,00 €</td><td><span className="tag tag-amber">En negociación</span></td></tr>
                    <tr><td style={{ fontWeight: 500 }}>Superficie (m²)</td><td>1.000</td><td>1.000</td><td style={{ fontWeight: 700 }}>1.000</td><td><span className="tag tag-green">Acordado</span></td></tr>
                    <tr><td style={{ fontWeight: 500 }}>Duración contrato</td><td>5 años</td><td>5 años</td><td style={{ fontWeight: 700 }}>5 años</td><td><span className="tag tag-green">Acordado</span></td></tr>
                    <tr><td style={{ fontWeight: 500 }}>Carencia (meses)</td><td>2</td><td>2</td><td style={{ fontWeight: 700, color: 'var(--purple)' }}>3</td><td><span className="tag tag-amber">En negociación</span></td></tr>
                    <tr><td style={{ fontWeight: 500 }}>Gastos comunes</td><td>3,50 €/m² aparte</td><td>Incluidos en renta</td><td style={{ fontWeight: 700 }}>Incluidos en renta</td><td><span className="tag tag-amber">En negociación</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Documentos contractuales */}
          {activeTab === 'neg-docs' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div className="info-pad">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Documentos contractuales</div>
                  <div style={{ display: 'flex', gap: 6 }}><button className="ab-btn">📎 Subir documento</button><button className="ab-btn blue">📄 Subir contrato</button></div>
                </div>
                <div style={{ background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', borderRadius: 'var(--r2)', padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📋</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>Modelo contrato arrendamiento v1 — Avalon P5 — Empresa XYZ</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>Subido por Sierra Álvaro · 14/03/2026 · Compartido con contraparte · 2 comentarios pendientes</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="ab-btn" style={{ padding: '3px 8px', fontSize: 10 }}>Ver comentarios (2)</button>
                    <button className="ab-btn save" style={{ padding: '3px 8px', fontSize: 10 }}>⬇ Descargar</button>
                  </div>
                </div>
                <table className="doc-table">
                  <thead><tr><th>Documento</th><th>Versión</th><th>Subido por</th><th>Fecha</th><th>Compartido</th><th>Comentarios</th><th></th></tr></thead>
                  <tbody>
                    <tr><td><span className="doc-link">📋 Modelo contrato arrendamiento v1</span></td><td>v1</td><td>Sierra Álvaro</td><td>14/03/2026</td><td><span className="tag tag-green">Sí</span></td><td style={{ color: 'var(--accent)', fontWeight: 600 }}>2</td><td>⬇ 🗑</td></tr>
                    <tr><td><span className="doc-link">📄 Term Sheet Empresa XYZ</span></td><td>—</td><td>Ana Gómez</td><td>12/03/2026</td><td><span className="tag tag-gray">Interno</span></td><td style={{ color: 'var(--text4)' }}>0</td><td>⬇ 🗑</td></tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 14, background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>COMENTARIOS SOBRE CLÁUSULAS</div>
                  {[
                    { av: 'XY', bg: '#fce7f3', color: '#9d174d', name: 'Ana Gómez · Empresa XYZ', msg: 'Cláusula 8.2 (subarriendo): solicitamos incluir posibilidad de subarrendar hasta el 30% de la superficie sin necesidad de consentimiento previo del arrendador.', date: '14/03/2026 · 16:30' },
                    { av: 'AS', bg: '#dbeafe', color: '#1e40af', name: 'Sierra Álvaro · Savills', msg: 'Cláusula 12 (obras): el propietario acepta aportación de 15 €/m² para adecuación básica del espacio, no obras estructurales.', date: '15/03/2026 · 09:15' },
                  ].map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i === 0 ? 8 : 0 }}>
                      <div className="neg-av" style={{ background: c.bg, color: c.color, width: 24, height: 24, fontSize: 8, flexShrink: 0 }}>{c.av}</div>
                      <div><div style={{ fontSize: 11, fontWeight: 500 }}>{c.name}</div><div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{c.msg}</div><div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2 }}>{c.date}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Historial */}
          {activeTab === 'neg-historial' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div className="info-pad">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Historial completo <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text4)' }}>· AUDITABLE · 6 eventos</span></div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  {[
                    { color: 'var(--purple)', msg: <>Ana Gómez (Empresa XYZ) envió <strong>ajuste final</strong> — renta 19 €/m², carencia 3 meses, gastos incluidos</>, date: '15/03/2026 · 11:05 · Via link externo NEG-0044' },
                    { color: 'var(--accent)', msg: <>Sierra Álvaro subió <strong>modelo de contrato v1</strong> y lo compartió con Empresa XYZ</>, date: '14/03/2026 · 10:00 · Documento: Modelo contrato v1' },
                    { color: 'var(--amber)', msg: <>Ana Gómez envió <strong>contraoferta</strong> — renta 20 €/m², carencia 2 meses, gastos incluidos</>, date: '12/03/2026 · 14:20 · Via link externo' },
                    { color: 'var(--accent)', msg: <>Ana Gómez accedió al link por primera vez</>, date: '10/03/2026 · 14:55 · IP: 85.x.x.x' },
                    { color: 'var(--accent)', msg: <>Sierra Álvaro envió <strong>oferta inicial</strong> — 1.000 m², renta 18 €/m²/mes, duración 5 años, carencia 2 meses</>, date: '10/03/2026 · 09:45' },
                    { color: 'var(--green)', msg: <>Negociación creada — link NEG-0044 generado y enviado a Ana Gómez (Empresa XYZ)</>, date: '10/03/2026 · 09:30 · Sierra Álvaro' },
                  ].map((e, i, arr) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0, marginTop: 4 }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500 }}>{e.msg}</div>
                        <div style={{ fontSize: 10, color: 'var(--text4)' }}>{e.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Colaboración */}
          {activeTab === 'neg-colab' && (
            <div style={{overflowY:'auto',flex:1}}>
              <div className="info-pad">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600}}>Equipos colaboradores</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>Gestiona qué equipos y usuarios participan en esta negociación</div>
                  </div>
                  <button className="ab-btn blue" onClick={()=>setAddingTeam(true)}>+ Añadir equipo / usuario</button>
                </div>

                <div style={{marginBottom:16}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Participantes actuales</div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {colabTeams.map((t,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',border:'1px solid var(--border)',borderRadius:'var(--r)',background:'var(--surface)'}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:t.bg,color:t.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{t.initials}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:600}}>{t.name}</div>
                          <div style={{fontSize:10,color:'var(--text3)'}}>{t.team} · {t.role}</div>
                        </div>
                        <span className={`tag ${t.principal?'tag-blue':'tag-gray'}`}>{t.principal?'Responsable':'Colaborador'}</span>
                        {!t.principal && <button onClick={()=>setColabTeams(prev=>prev.filter((_,j)=>j!==i))} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'2px 6px',fontFamily:'inherit'}}>✕ Quitar</button>}
                      </div>
                    ))}
                  </div>
                </div>

                {addingTeam && (
                  <div style={{border:'1px solid var(--accent-bd)',background:'var(--accent-lt)',borderRadius:'var(--r2)',padding:14,marginBottom:14}}>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Añadir equipo o usuario</div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
                      <div style={{display:'flex',flexDirection:'column',gap:3}}>
                        <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Equipo</span>
                        <select className="fsel" value={newTeam} onChange={e=>setNewTeam(e.target.value)} style={{minWidth:220}}>
                          <option value="">Seleccionar equipo...</option>
                          <option>Arquitectura / Workplace</option>
                          <option>Capital Markets MAD</option>
                          <option>Retail MAD</option>
                          <option>Logístico MAD</option>
                          <option>Hoteles</option>
                          <option>Valoraciones MAD</option>
                          <option>Centros Comerciales</option>
                          <option>Leasing Oficinas BCN</option>
                        </select>
                      </div>
                      <button className="ab-btn save" onClick={()=>{
                        if(!newTeam)return
                        const ini=newTeam.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                        setColabTeams(prev=>[...prev,{name:newTeam,team:newTeam,role:'Colaborador',initials:ini,bg:'#f3e8ff',color:'#6b21a8',principal:false}])
                        setAddingTeam(false);setNewTeam('')
                      }}>Añadir</button>
                      <button className="ab-btn" onClick={()=>{setAddingTeam(false);setNewTeam('')}}>Cancelar</button>
                    </div>
                  </div>
                )}

                <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Historial de colaboración</div>
                <div style={{border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
                  {[
                    {color:'var(--green)',msg:'Negociación creada — responsable: Sierra Álvaro (Transaction Spain)',date:'10/03/2026 · 09:30'},
                  ].map((e,i,arr)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 12px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:e.color,flexShrink:0,marginTop:4}}/>
                      <div><div style={{fontSize:11}}>{e.msg}</div><div style={{fontSize:10,color:'var(--text4)'}}>{e.date}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right panel */}
        <div className="ficha-right">
          <div className="rp-sec">
            <div className="rp-lbl">Estado negociación</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>En negociación</span>
            </div>
            <button className="acc-btn">📋 Cambiar estado</button>
            <button className="acc-btn" onClick={() => alert('Link copiado:\nhttps://pdb.savills.es/neg/NEG-0044')}>🔗 Copiar link partes</button>
            <button className="acc-btn">✅ Marcar acuerdo</button>
            <button className="acc-btn">→ Pasar a Instrucción</button>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Activo vinculado</div>
            <div style={{ background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 10px', cursor: 'pointer', marginBottom: 6 }} onClick={() => navigate('ficha-activo')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: 5, background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🏢</div>
                <div><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>P.E Avalon</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>Santa Leonor 65 · M-30 · Madrid</div></div>
              </div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Partes</div>
            <div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>Propiedad</div>
            <div className="cont-row"><div className="c-av" style={{ background: '#dbeafe', color: '#1e40af' }}>AS</div><div><div className="c-name">Sierra Álvaro</div><div className="c-role">Savills · Transaction Spain</div></div></div>
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>Demanda / Contraparte</div>
            <div className="cont-row"><div className="c-av" style={{ background: '#fce7f3', color: '#9d174d' }}>AG</div><div><div className="c-name">Ana Gómez</div><div className="c-role">Empresa XYZ · Dir. RRHH</div></div></div>
            <div style={{ background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '7px 9px', fontSize: 10, marginTop: 4 }}>
              <div>📧 a.gomez@empresaxyz.com</div>
              <div style={{ marginTop: 2 }}>📱 +34 650 123 456</div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Condición clave (última ronda)</div>
            <div className="kf-grid">
              <div className="kf"><div className="kf-lbl">Renta propuesta</div><div className="kf-val" style={{ color: 'var(--purple)' }}>19,00 €</div></div>
              <div className="kf"><div className="kf-lbl">Inicial</div><div className="kf-val">18,00 €</div></div>
              <div className="kf"><div className="kf-lbl">Superficie</div><div className="kf-val">1.000 m²</div></div>
              <div className="kf"><div className="kf-lbl">Duración</div><div className="kf-val">5 años</div></div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Asistente IA</div>
            <div className="ai-box">
              <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Análisis negociación</span><span className="ai-badge">Tiempo real</span></div>
              <div className="ai-text">Renta 19 €/m² está <strong>5,6% por encima</strong> del precio de salida. Carencia 3m y gastos incluidos reducen margen. Cierre estimado <strong>vencido</strong> — revisar fecha.</div>
              <div className="ai-cta">✎ Pedir estrategia de cierre</div>
            </div>
          </div>
        </div>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Negociación" refNombre="NEG-0044 · Empresa XYZ" onClose={() => setShowTarea(false)} />}
    </div>
  )
}
