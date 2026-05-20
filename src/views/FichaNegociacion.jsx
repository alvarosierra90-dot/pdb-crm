import { useState, useRef } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'
import ConfidencialidadPanel from '../components/ConfidencialidadPanel'
import Vinculaciones from '../components/Vinculaciones'
import EquipoTrabajoCard from '../components/EquipoTrabajoCard'
import HeaderPills from '../components/HeaderPills'
import FunnelTracker from '../components/FunnelTracker'

// ─── CONTRACT DRAFTS ─────────────────────────────────────────────────────────
const CONTRACTS_INIT = [
  {
    id: 1, version: 1, nombre: 'Borrador_Contrato_NEG0044_v1.docx',
    autor: 'Sierra Álvaro', parte: 'Savills', fecha: '10/03/2026', hora: '10:15', size: '48 KB',
    cambios: null,
  },
  {
    id: 2, version: 2, nombre: 'Borrador_Contrato_NEG0044_v2.docx',
    autor: 'Ana Gómez', parte: 'Empresa XYZ', fecha: '13/03/2026', hora: '09:30', size: '51 KB',
    cambios: [
      { tipo: 'mod', seccion: 'Cláusula 3 — Renta',
        anterior: 'La renta mensual pactada es de 18,00 €/m²/mes, resultando una renta total mensual de 18.000 €/mes.',
        nuevo:    'La renta mensual pactada es de 20,00 €/m²/mes, resultando una renta total mensual de 20.000 €/mes.' },
      { tipo: 'add', seccion: 'Cláusula 5 — Gastos comunes',
        nuevo: 'Los gastos de comunidad quedarán incluidos dentro de la renta pactada en la Cláusula 3, sin coste adicional para el arrendatario.' },
      { tipo: 'del', seccion: 'Cláusula 6 — Servicios',
        anterior: 'El arrendatario abonará mensualmente 3,50 €/m²/mes en concepto de gastos comunes y servicios del edificio.' },
    ],
  },
]

const TIPO_DIFF = {
  mod: { label: 'Modificado', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  add: { label: 'Añadido',    color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  del: { label: 'Eliminado',  color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
}

function ContractCard({ c, isLatest }) {
  const [open, setOpen] = useState(false)
  const isSavills = c.parte === 'Savills'
  return (
    <div className={isSavills ? 'neg-bubble-left' : 'neg-bubble-right'} style={{maxWidth:'90%'}}>
      <div className="neg-meta" style={isSavills ? {} : { justifyContent:'flex-end' }}>
        {!isSavills && <>
          <span style={{background:'#f3e8ff',color:'#6b5b8e',border:'1px solid #e9d5ff',padding:'0 6px',borderRadius:8,fontSize:9,fontWeight:700}}>BORRADOR v{c.version}</span>
          <span>{c.fecha} · {c.hora}</span>
          <span className="neg-name">{c.autor} · {c.parte}</span>
          <div className="neg-av" style={{background:'#fce7f3',color:'#9d174d'}}>{c.autor.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        </>}
        {isSavills && <>
          <div className="neg-av" style={{background:'#f5efe5',color:'#5a4828'}}>AS</div>
          <span className="neg-name">{c.autor} · {c.parte}</span>
          <span>{c.fecha} · {c.hora}</span>
          <span style={{background:'#f3e8ff',color:'#6b5b8e',border:'1px solid #e9d5ff',padding:'0 6px',borderRadius:8,fontSize:9,fontWeight:700}}>BORRADOR v{c.version}</span>
          {isLatest && <span style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',padding:'0 6px',borderRadius:8,fontSize:9,fontWeight:700}}>ÚLTIMA VERSIÓN</span>}
        </>}
      </div>

      {/* Document card */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden',maxWidth:480}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderBottom:'1px solid var(--border)'}}>
          <div style={{width:36,height:36,borderRadius:6,background:'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>📄</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.nombre}</div>
            <div style={{fontSize:10,color:'var(--text4)',marginTop:1}}>{c.size} · Word · Versión {c.version}{c.cambios ? ` · ${c.cambios.length} cambio${c.cambios.length>1?'s':''}` : ' · Borrador inicial'}</div>
          </div>
          <button
            style={{padding:'4px 10px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--gray-lt)',fontSize:10,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)',flexShrink:0}}
            onClick={() => alert(`Descargando ${c.nombre}...`)}
          >⬇ Descargar</button>
        </div>

        {c.cambios && (
          <div>
            <button
              onClick={() => setOpen(v => !v)}
              style={{width:'100%',padding:'7px 12px',border:'none',background:open?'#f5f3ff':'var(--gray-lt)',fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text2)',display:'flex',alignItems:'center',gap:6,fontWeight:500,borderTop:'none'}}
            >
              <span style={{fontSize:12}}>{open ? '▾' : '▸'}</span>
              Ver {c.cambios.length} cambio{c.cambios.length>1?'s':''} respecto a v{c.version-1}
              <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
                {Object.entries(c.cambios.reduce((acc,ch)=>{ acc[ch.tipo]=(acc[ch.tipo]||0)+1; return acc }, {})).map(([t,n]) => (
                  <span key={t} style={{fontSize:9,fontWeight:700,color:TIPO_DIFF[t].color,background:TIPO_DIFF[t].bg,border:`1px solid ${TIPO_DIFF[t].border}`,borderRadius:4,padding:'1px 5px'}}>{TIPO_DIFF[t].label}: {n}</span>
                ))}
              </div>
            </button>

            {open && (
              <div style={{borderTop:'1px solid var(--border)',padding:'10px 12px',display:'flex',flexDirection:'column',gap:8,background:'var(--bg)'}}>
                {c.cambios.map((ch, i) => {
                  const d = TIPO_DIFF[ch.tipo]
                  return (
                    <div key={i} style={{border:`1px solid ${d.border}`,borderRadius:'var(--r)',overflow:'hidden'}}>
                      <div style={{background:d.bg,padding:'5px 10px',display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:10,fontWeight:700,color:d.color}}>{d.label}</span>
                        <span style={{fontSize:11,fontWeight:600,color:'var(--text)'}}>{ch.seccion}</span>
                      </div>
                      <div style={{padding:'8px 10px',background:'var(--surface)',display:'flex',flexDirection:'column',gap:4}}>
                        {ch.anterior && (
                          <div style={{fontSize:11,color:'#b91c1c',background:'#fef2f2',borderRadius:4,padding:'5px 8px',lineHeight:1.5,textDecoration:ch.tipo==='del'?'line-through':'none',fontStyle:'italic'}}>
                            — {ch.anterior}
                          </div>
                        )}
                        {ch.nuevo && (
                          <div style={{fontSize:11,color:'#15803d',background:'#f0fdf4',borderRadius:4,padding:'5px 8px',lineHeight:1.5}}>
                            + {ch.nuevo}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function UploadPanel({ onUpload, onClose, nextVersion }) {
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [note, setNote] = useState('')

  function handleFile(e) {
    const f = e.target.files[0]
    if (f) setFile(f)
  }
  function handleUpload() {
    if (!file) return
    setUploading(true)
    setTimeout(() => { onUpload(file, note); setUploading(false) }, 900)
  }

  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'12px 14px',marginBottom:8,display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>📄 Subir borrador de contrato <span style={{fontSize:10,fontWeight:400,color:'var(--text4)'}}>— Versión {nextVersion}</span></div>
        <button onClick={onClose} style={{border:'none',background:'none',cursor:'pointer',fontSize:14,color:'var(--text4)',padding:'0 4px'}}>✕</button>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        style={{border:'2px dashed var(--border2)',borderRadius:'var(--r)',padding:'20px',textAlign:'center',cursor:'pointer',background:'var(--bg)',transition:'border-color .15s'}}
        onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border2)'}
      >
        <input ref={fileRef} type="file" accept=".doc,.docx,.pdf" style={{display:'none'}} onChange={handleFile}/>
        {file
          ? <div style={{fontSize:12,fontWeight:600,color:'var(--accent)'}}>📄 {file.name} <span style={{fontSize:10,fontWeight:400,color:'var(--text4)'}}>({(file.size/1024).toFixed(0)} KB)</span></div>
          : <div><div style={{fontSize:13,color:'var(--text3)'}}>Arrastra o haz clic para seleccionar</div><div style={{fontSize:10,color:'var(--text4)',marginTop:4}}>.docx · .pdf</div></div>
        }
      </div>

      <input
        value={note}
        onChange={e=>setNote(e.target.value)}
        placeholder="Nota sobre los cambios realizados (opcional)..."
        style={{padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:'var(--r)',fontSize:11,fontFamily:'inherit',outline:'none'}}
      />

      <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
        <button onClick={onClose} style={{padding:'5px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'none',fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'var(--text3)'}}>Cancelar</button>
        <button
          onClick={handleUpload}
          disabled={!file||uploading}
          style={{padding:'5px 14px',borderRadius:'var(--r)',border:'none',background:file&&!uploading?'var(--accent)':'var(--border)',color:file&&!uploading?'#fff':'var(--text4)',fontSize:11,cursor:file&&!uploading?'pointer':'default',fontFamily:'inherit',fontWeight:600}}
        >
          {uploading ? 'Subiendo...' : '⬆ Subir borrador'}
        </button>
      </div>
    </div>
  )
}

// 5 tabs canónicos · spec mayo 2026.
// · neg-info: Vinculaciones canónica + Equipo+Colaboradores 50/50 + Condiciones acordadas (resumen) + Notas
// · neg-chat: Negociación (chat con contraparte + borradores de contrato)
// · neg-docs: Documentos contractuales
// · neg-360: Vista 360 (sustituye al antiguo "Historial completo")
// · neg-conf: Confidencialidad (formato canónico Oferta)
const TABS = ['neg-info','neg-chat','neg-docs','neg-360','neg-conf']
const TAB_LABELS = ['Información general','Negociación','Documentos contractuales','Vista 360','Confidencialidad']

const COLAB_INIT_NEG = [
  { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable negociación', initials:'AS', bg:'#f5efe5', color:'#5a4828', principal:true },
]

export default function FichaNegociacion() {
  const { navigate } = useNav()
  const [activeTab, setActiveTab] = useState('neg-info')
  const [colabTeams] = useState(COLAB_INIT_NEG)
  const [negConfidential, setNegConfidential] = useState(false)
  const [negAuthUsers, setNegAuthUsers] = useState([
    { name:'Sierra Álvaro', team:'Leasing Oficinas MAD', role:'Principal', initials:'AS', bg:'#f5efe5', color:'#5a4828', owner:true },
  ])
  const [showTarea, setShowTarea] = useState(false)
  const [contracts, setContracts] = useState(CONTRACTS_INIT)
  const [showUpload, setShowUpload] = useState(false)

  function handleUpload(file, note) {
    const nextV = contracts.length + 1
    setContracts(prev => [...prev, {
      id: Date.now(),
      version: nextV,
      nombre: file.name,
      autor: 'Sierra Álvaro',
      parte: 'Savills',
      fecha: new Date().toLocaleDateString('es-ES'),
      hora: new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' }),
      size: `${(file.size/1024).toFixed(0)} KB`,
      cambios: note ? [{ tipo:'mod', seccion:'Nota de cambios', anterior: null, nuevo: note }] : null,
    }])
    setShowUpload(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Cerrar negociación</button>
        <button className="ab-btn">Pasar a Instrucción</button>
        <div className="ab-sep" />
        <button className="ab-btn blue" onClick={() => alert('✅ Link copiado:\nhttps://pdb.savills.es/neg/NEG-0044\n\nCompartir con ambas partes.')}>🔗 Copiar link partes</button>
        <button className="ab-btn">📄 Subir contrato</button>
        <button className="ab-btn" onClick={() => navigate('ficha-activo')}>Ver activo vinculado</button>
        <div className="ab-sep" />
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
      </div>

      {/* Funnel tracker · hilo conductor entre fases */}
      <FunnelTracker steps={[
        { key:'opo', label:'Oportunidad', ref:'OPP-2024-0042',
          onClick: () => navigate('ficha-oportunidad', { id:'OPP-2024-0042' }) },
        { key:'man', label:'Mandato', ref:'MAN-0014',
          onClick: () => navigate('ficha-mandato', { ref:'MAN-0014' }) },
        { key:'ofr', label:'Oferta', ref:'OFR-0027',
          onClick: () => navigate('ficha-oferta', { ofertaRef:'OFR-0027' }) },
        { key:'neg', label:'Negociación', ref:'NEG-0044', current: true, onClick: null },
        { key:'ins', label:'Instrucción', ref: null, onClick: null },
      ]} />

      {/* Header con pills interactivos · canon unificado */}
      <div className="ah">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="ah-ico" style={{ background: 'linear-gradient(135deg,#1e3a8a,#6366f1)' }}></div>
          <div style={{ flex: 1, minWidth:0 }}>
            <div className="ah-ref">
              <span className="ref-badge-neg">NEGOCIACIÓN</span>
              <span className="asset-link" style={{fontFamily:'var(--mono)'}}>NEG-0044</span>
              <span style={{ color: 'var(--text4)', fontSize:11 }}>· Alquiler oficinas · 1.000 m²</span>
            </div>
            <div className="ah-name">Empresa XYZ — 1.000 m² · P.E Avalon</div>
            <div className="ah-addr">📍 Calle Santa Leonor 65, 28037 Madrid · M-30 · Iniciada: 10/03/2026 · Última actividad: 15/03/2026</div>
          </div>
          <HeaderPills items={[
            { key:'estado',  type:'info', label:'Estado',      value:'↔ En negociación',  color:'amber',  accent:true },
            { key:'ronda',   type:'info', label:'Ronda',       value:'3',                 color:'accent', accent:true },
            { key:'renta',   type:'info', label:'Renta última', value:'19,00 €/m²',       color:'purple', accent:true },
            { key:'sup',     type:'info', label:'Superficie',  value:'1.000 m²' },
            { key:'cierre',  type:'info', label:'Cierre estim.', value:'30/03/2026', color:'red', accent:true, title:'Vencido' },
            { key:'resp',    type:'info', label:'Responsable', value:'Sierra Álvaro' },
          ]} />
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t, i) => (
          <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[i]}</div>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* TAB: Información general — banda Vinculaciones + Equipo/Colaboradores + Condiciones acordadas */}
          {activeTab === 'neg-info' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div className="info-pad">

                {/* ── VINCULACIONES (canónico, siempre arriba) ── */}
                <Vinculaciones
                  cuenta={{ id:'ORACLE', nombre:'Oracle Spain SL', sub:'Cliente · Demanda' }}
                  activo={{ ref:'MAD-OF-AVALON', nombre:'P.E Avalon', direccion:'Calle Santa Leonor 65, 28037 Madrid', sub:'M-30 · Oficinas' }}
                  oportunidad={{ id:'OPO-2501', nombre:'OPO-2501 · Albatros D — Oracle Relocation 2026', sub:'Pitch demanda · Leasing' }}
                />

                {/* ── EQUIPO DE TRABAJO + COLABORADORES (50/50 justo bajo Vinculaciones) ── */}
                {(() => {
                  const internos = colabTeams.filter(t => t.role !== 'Colaborador')
                  const colabs   = colabTeams.filter(t => t.role === 'Colaborador')
                  const toEqArr = (arr) => arr.map(t => ({ nombre: t.name, equipo: t.team, rol: t.principal ? 'Principal' : (t.role || 'Soporte') }))
                  return (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                      <EquipoTrabajoCard
                        title="Equipo de trabajo"
                        equipo={toEqArr(internos)}
                        canManage={false}
                      />
                      <EquipoTrabajoCard
                        title="Colaboradores"
                        equipo={toEqArr(colabs)}
                        canManage={false}
                      />
                    </div>
                  )
                })()}

                {/* ── CONDICIONES ACORDADAS (sub-bloque, era tab aparte) ── */}
                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico" style={{color:'var(--pdb-blue)'}}>●</span> Resumen ronda actual</h3>
                    <span className="hint">Ronda 3 — actualizado 15/03/2026</span>
                  </div>
                  <div style={{padding:'4px 20px 16px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24}}>
                    {[['3','Ronda',null,'var(--text)'],['19,00 €','Renta última','Inicial: 18,00 €','var(--purple)'],['5 años','Duración',null,'var(--text)'],['↔ Negociando','Estado',null,'var(--amber)']].map(([v,l,s,c],i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: c || 'var(--text)', fontVariantNumeric:'tabular-nums' }}>{v}</div>
                        <div style={{ fontSize: 10, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop:3 }}>{l}</div>
                        {s && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop:2, fontStyle:'italic' }}>{s}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico"></span> Condiciones por ronda</h3>
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
            </div>
          )}

          {/* Chat */}
          {activeTab === 'neg-chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Chat header */}
              <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div className="neg-av" style={{ background: '#f5efe5', color: '#5a4828', width: 28, height: 28 }}>AS</div>
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
                    <div className="neg-av" style={{ background: '#f5efe5', color: '#5a4828' }}>AS</div>
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

                {/* Contract version divider */}
                <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0'}}>
                  <div style={{flex:1,height:1,background:'var(--border)'}}/>
                  <span style={{fontSize:10,color:'var(--text4)',fontWeight:600,padding:'2px 8px',background:'var(--gray-lt)',borderRadius:10,border:'1px solid var(--border)'}}>📄 Borradores de contrato</span>
                  <div style={{flex:1,height:1,background:'var(--border)'}}/>
                </div>

                {/* Contract cards */}
                {contracts.map((c, i) => (
                  <ContractCard key={c.id} c={c} isLatest={i === contracts.length - 1} />
                ))}
              </div>

              {/* Input bar */}
              <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '10px 16px', flexShrink: 0 }}>
                {showUpload && (
                  <UploadPanel
                    nextVersion={contracts.length + 1}
                    onUpload={handleUpload}
                    onClose={() => setShowUpload(false)}
                  />
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, border: '1px solid var(--border2)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: 4, padding: '4px 8px', borderBottom: '1px solid var(--border)', background: 'var(--gray-lt)', flexWrap:'wrap' }}>
                      <button className="ab-btn" style={{ padding: '2px 8px', fontSize: 10 }}>Nueva propuesta</button>
                      <button className="ab-btn" style={{ padding: '2px 8px', fontSize: 10 }}>📎 Adjuntar</button>
                      <button
                        className="ab-btn"
                        style={{ padding: '2px 8px', fontSize: 10, color: showUpload ? 'var(--accent)' : undefined, borderColor: showUpload ? 'var(--accent-bd)' : undefined, background: showUpload ? 'var(--accent-lt)' : undefined }}
                        onClick={() => setShowUpload(v => !v)}
                      >📄 Subir borrador</button>
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

          {/* Documentos contractuales */}
          {activeTab === 'neg-docs' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div className="info-pad">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Documentos contractuales</div>
                  <div style={{ display: 'flex', gap: 6 }}><button className="ab-btn">📎 Subir documento</button><button className="ab-btn blue">📄 Subir contrato</button></div>
                </div>
                <div style={{ background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', borderRadius: 'var(--r2)', padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}></span>
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
                    <tr><td><span className="doc-link">Modelo contrato arrendamiento v1</span></td><td>v1</td><td>Sierra Álvaro</td><td>14/03/2026</td><td><span className="tag tag-green">Sí</span></td><td style={{ color: 'var(--accent)', fontWeight: 600 }}>2</td><td>⬇ 🗑</td></tr>
                    <tr><td><span className="doc-link">📄 Term Sheet Empresa XYZ</span></td><td>—</td><td>Ana Gómez</td><td>12/03/2026</td><td><span className="tag tag-gray">Interno</span></td><td style={{ color: 'var(--text4)' }}>0</td><td>⬇ 🗑</td></tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 14, background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>COMENTARIOS SOBRE CLÁUSULAS</div>
                  {[
                    { av: 'XY', bg: '#fce7f3', color: '#9d174d', name: 'Ana Gómez · Empresa XYZ', msg: 'Cláusula 8.2 (subarriendo): solicitamos incluir posibilidad de subarrendar hasta el 30% de la superficie sin necesidad de consentimiento previo del arrendador.', date: '14/03/2026 · 16:30' },
                    { av: 'AS', bg: '#f5efe5', color: '#5a4828', name: 'Sierra Álvaro · Savills', msg: 'Cláusula 12 (obras): el propietario acepta aportación de 15 €/m² para adecuación básica del espacio, no obras estructurales.', date: '15/03/2026 · 09:15' },
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

          {/* TAB: Vista 360 — sustituye al antiguo Historial completo */}
          {activeTab === 'neg-360' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div className="info-pad">
                <div className="va-card">
                  <div className="va-card-header">
                    <h3><span className="ico">◷</span> Vista 360</h3>
                    <span className="hint">AUDITABLE · 6 eventos</span>
                  </div>
                <div>
                  {[
                    { color: 'var(--purple)', msg: <>Ana Gómez (Empresa XYZ) envió <strong>ajuste final</strong> — renta 19 €/m², carencia 3 meses, gastos incluidos</>, date: '15/03/2026 · 11:05 · Via link externo NEG-0044' },
                    { color: 'var(--accent)', msg: <>Sierra Álvaro subió <strong>modelo de contrato v1</strong> y lo compartió con Empresa XYZ</>, date: '14/03/2026 · 10:00 · Documento: Modelo contrato v1' },
                    { color: 'var(--amber)', msg: <>Ana Gómez envió <strong>contraoferta</strong> — renta 20 €/m², carencia 2 meses, gastos incluidos</>, date: '12/03/2026 · 14:20 · Via link externo' },
                    { color: 'var(--accent)', msg: <>Ana Gómez accedió al link por primera vez</>, date: '10/03/2026 · 14:55 · IP: 85.x.x.x' },
                    { color: 'var(--accent)', msg: <>Sierra Álvaro envió <strong>oferta inicial</strong> — 1.000 m², renta 18 €/m²/mes, duración 5 años, carencia 2 meses</>, date: '10/03/2026 · 09:45' },
                    { color: 'var(--green)', msg: <>Negociación creada — link NEG-0044 generado y enviado a Ana Gómez (Empresa XYZ)</>, date: '10/03/2026 · 09:30 · Sierra Álvaro' },
                  ].map((e, i, arr) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 20px', borderTop: i===0?'1px solid var(--border)':'none', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0, marginTop: 4 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{e.msg}</div>
                        <div style={{ fontSize: 10, color: 'var(--text4)', marginTop:2 }}>{e.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            </div>
          )}
          {/* Colaboración */}

          {/* TAB: CONFIDENCIALIDAD — formato canónico Oferta */}
          {activeTab === 'neg-conf' && (
            <ConfidencialidadPanel
              entityLabel="negociación"
              confidential={negConfidential}
              onToggle={setNegConfidential}
              hiddenFields={['Cuenta','Contraparte','Condiciones acordadas','Documentos contractuales','Term sheet']}
              visibleFields={['Activo vinculado','Estado de la negociación','Equipo','Fecha de inicio','Información básica']}
              authorizedUsers={negAuthUsers}
              onAddUser={(newUser) => {
                const [name, team] = [newUser.split('·')[0].trim(), newUser.split('·')[1]?.trim() || '']
                const ini = name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                const today = new Date().toLocaleDateString('es-ES')
                setNegAuthUsers(prev => [...prev, { name, team, role:'Autorizado', initials:ini, bg:'#f0fdf4', color:'#166534', granted:today }])
              }}
              onRemoveUser={(idx) => setNegAuthUsers(prev => prev.filter((_,j) => j !== idx))}
              responsable="Sierra Álvaro"
            />
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
            <button className="acc-btn">Cambiar estado</button>
            <button className="acc-btn" onClick={() => alert('Link copiado:\nhttps://pdb.savills.es/neg/NEG-0044')}>🔗 Copiar link partes</button>
            <button className="acc-btn">✅ Marcar acuerdo</button>
            <button className="acc-btn">→ Pasar a Instrucción</button>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Activo vinculado</div>
            <div style={{ background: 'var(--gray-lt)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 10px', cursor: 'pointer', marginBottom: 6 }} onClick={() => navigate('ficha-activo')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: 5, background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}></div>
                <div><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>P.E Avalon</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>Santa Leonor 65 · M-30 · Madrid</div></div>
              </div>
            </div>
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Partes</div>
            <div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>Propiedad</div>
            <div className="cont-row"><div className="c-av" style={{ background: '#f5efe5', color: '#5a4828' }}>AS</div><div><div className="c-name">Sierra Álvaro</div><div className="c-role">Savills · Transaction Spain</div></div></div>
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
              <div className="ai-head"><div className="ai-ico"></div><span className="ai-lbl">Análisis negociación</span><span className="ai-badge">Tiempo real</span></div>
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
