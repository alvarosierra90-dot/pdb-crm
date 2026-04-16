import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'

const TABS = ['of-info','of-contacto','of-espacios','of-plazas','of-condiciones','of-caract','of-docs','of-web','of-desc','of-seg','of-ficha','of-conf']
const TAB_LABELS = ['Información oferta','Datos de contacto','Espacios comerciales','Plazas de aparcamiento','Condiciones','Características','Documentos','Contenido web','Descriptivo','Seguimiento comercial','Crear ficha','🔒 Confidencialidad']

const ASSET = {
  nombre: 'Albatros — C. Anabel Segura 9-11, Alcobendas',
  usoPrincipal: 'Oficinas',
  estadoConstruccion: 'Rehabilitado (2023)',
  direccion: 'Calle de Anabel Segura 9-11, 28108 Alcobendas, Madrid',
  propietario: { sociedad:'FREO Investments Spain SL', contacto:'Baena Borja', telFijo:'+34 910 888 998', telMovil:'629 846 923', email:'b.baena@freogroup.com' },
}

const TIPOLOGIA_MAP = {
  'Oficinas':['Oficina tradicional','Coworking','Subarriendo','Business park','Sede única (HQ)'],
  'Logístico':['Nave logística','Nave industrial','Última milla','Plataforma logística','Cross-docking'],
  'Logístico / Industrial':['Nave logística','Nave industrial','Última milla','Plataforma logística','Cross-docking'],
  'Retail':['High Street','Local en centro comercial','Parque comercial','Local stand-alone','Flagship store','Parque de medianas'],
  'Centros comerciales':['Centro comercial dominante','Centro comercial secundario','Outlet','Participación en centro'],
  'Residencial':['Vivienda plurifamiliar','Vivienda unifamiliar','Obra nueva','Segunda mano'],
  'Living (PRS / BTR / Flex)':['Build to Rent (BTR)','Build to Sell (BTS)','Flex living','Student housing','Senior living','Coliving'],
  'Hoteles':['Hotel urbano','Hotel vacacional','Resort','Aparthotel','Hostal'],
  'Suelos':['Suelo finalista','Suelo en desarrollo','Suelo urbanizable'],
  'Alternativos':['Selección abierta'], 'Mixtos':['Selección combinada'],
  'Data Center':['Hyperscale','Colocation','Edge computing'],
}

// ── Edificio Albatros D ────────────────────────────────────────────────────
const BUILDING_FLOORS = [
  { id:'P4', sup:2577, status:'vac' },
  { id:'P3', sup:2790, status:'vac' },
  { id:'P2', sup:2790, status:'ten', tenant:'Oracle Spain SL', brk:'Mar 2028' },
  { id:'P1', sup:2793, status:'vac' },
  { id:'PB', sup:550,  status:'com', name:'Hall / Lobby' },
  { id:'S1', sup:800,  status:'pk',  name:'Parking · 322 plazas' },
]
const MAX_SUP = 2793

const OFERTA_COLORS = [
  { bg:'#dcfce7', border:'#86efac', text:'#166534', dot:'#16a34a' },
  { bg:'#dbeafe', border:'#93c5fd', text:'#1e40af', dot:'#3b82f6' },
  { bg:'#fef3c7', border:'#fcd34d', text:'#92400e', dot:'#f59e0b' },
  { bg:'#f3e8ff', border:'#d8b4fe', text:'#6b21a8', dot:'#a855f7' },
]

const USERS_INIT = [{ name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', granted:'—', owner:true }]
const TIPO_TAG = { Email:'tag-blue', Llamada:'tag-green', Reunión:'tag-purple', Tarea:'tag-gray', Visita:'tag-teal', Presentación:'tag-amber' }
const TIPO_ICO = { Email:'📧', Llamada:'📞', Reunión:'🤝', Tarea:'✅', Visita:'🏢', Presentación:'📤' }
const ACT_EST  = { Abierto:'tag-amber', Finalizado:'tag-gray', 'En curso':'tag-blue', Realizada:'tag-green' }
const SEG_ACTS = [
  { id:'ACT-OF-01', tipo:'Presentación', asunto:'Presentación oferta Albatros P1–P4 enviada a Oracle Spain',  fecha:'10/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-OF-02', tipo:'Visita',       asunto:'Visita técnica Oracle Spain — Albatros Edif. D P2',          fecha:'15/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Realizada'  },
  { id:'ACT-OF-03', tipo:'Email',        asunto:'Envío condiciones económicas actualizadas a Carlos Méndez',   fecha:'20/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-OF-04', tipo:'Llamada',      asunto:'Llamada de seguimiento — confirmación interés Oracle',        fecha:'25/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-OF-05', tipo:'Reunión',      asunto:'Reunión propietario Allianz — revisión oferta y condiciones', fecha:'28/03/2026', user:'GOMEZ Ignacio', initials:'GI', bg:'#fdf4ff', color:'#7e22ce', estado:'Finalizado' },
  { id:'ACT-OF-06', tipo:'Email',        asunto:'Contraoferta recibida Oracle — análisis pendiente',           fecha:'02/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'En curso'   },
  { id:'ACT-OF-07', tipo:'Tarea',        asunto:'Preparar respuesta a contraoferta Oracle Spain SL',           fecha:'07/04/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Abierto'    },
]

function FieldLbl({ children, req }) {
  return <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{children}{req && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}</div>
}
function ReadonlyPill({ value }) {
  return <div style={{ padding:'6px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', fontSize:12, background:'var(--gray-lt)', color:'var(--text3)', display:'flex', alignItems:'center', gap:6 }}>{value}<span style={{ marginLeft:'auto', fontSize:9, color:'var(--text4)', fontWeight:600 }}>AUTO</span></div>
}

export default function FichaOferta() {
  const { navigate } = useNav()
  const [activeTab, setActiveTab] = useState('of-info')
  const [confidential, setConfidential] = useState(false)
  const [authorizedUsers, setAuthorizedUsers] = useState(USERS_INIT)
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState('')
  const [showTarea, setShowTarea] = useState(false)

  // Tab 1
  const [tipoComercializacion, setTipoComercializacion] = useState('Mandato Savills')
  const [tipologia, setTipologia] = useState('')
  const [estadoEspacio, setEstadoEspacio] = useState('')
  const [tipoOperacion, setTipoOperacion] = useState('Alquiler')
  const [origenOferta, setOrigenOferta] = useState('')
  const [modalidadVisita, setModalidadVisita] = useState('')
  const [comentarios, setComentarios] = useState('')

  // Tab 2
  const [colaboradores, setColaboradores] = useState([])
  const [addingColab, setAddingColab] = useState(false)
  const [newColabEmpresa, setNewColabEmpresa] = useState('')
  const [newColabContacto, setNewColabContacto] = useState('')
  const [equipoMembers, setEquipoMembers] = useState([
    { name:'Sierra Álvaro',    team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', owner:true  },
    { name:'Alonso Abruña D.', team:'Leasing MAD',       role:'Colaborador', initials:'AD', bg:'#f3e8ff', color:'#6b21a8', owner:false },
  ])
  const [addingMiembro, setAddingMiembro] = useState(false)
  const [newMiembro, setNewMiembro] = useState('')

  // Tab 3 + Stacking
  const [fechaDispGlobal, setFechaDispGlobal] = useState('2026-06-01')
  const [divisibleGlobal, setDivisibleGlobal] = useState(true)
  const [supAprox, setSupAprox] = useState(false)
  const [plantaTipo, setPlantaTipo] = useState(2790)
  const [ofertasDesglose, setOfertasDesglose] = useState([
    { id:1, nombre:'Oferta 1', divisible:true, cargasM2:3.01 },
  ])
  const [nextOfertaId, setNextOfertaId] = useState(2)
  const [editNombreId, setEditNombreId] = useState(null)
  const [editNombreVal, setEditNombreVal] = useState('')

  // Stacking plan
  const [showStacking, setShowStacking] = useState(false)
  const [selectedOfertaId, setSelectedOfertaId] = useState(null)
  const [floorAssignments, setFloorAssignments] = useState({
    P4: { ofertaId:1, sup:2577, renta:12.50 },
    P3: { ofertaId:1, sup:2790, renta:12.50 },
    P1: { ofertaId:1, sup:2793, renta:12.50 },
  })

  // Derived: espacios comercializables from floor assignments
  const espaciosComercializables = BUILDING_FLOORS
    .filter(f => floorAssignments[f.id])
    .map(f => {
      const a = floorAssignments[f.id]
      const oferta = ofertasDesglose.find(o => o.id === a.ofertaId)
      return { edificio:'Edificio Albatros D', modulo:`D-${f.id}`, planta:f.id, uso:'Oficina', sup:a.sup, renta:a.renta, ofertaNombre:oferta?.nombre || '—', ofertaId:a.ofertaId }
    })

  const supTotal = espaciosComercializables.reduce((s, e) => s + e.sup, 0)

  function addOferta() {
    const id = nextOfertaId
    setOfertasDesglose(prev => [...prev, { id, nombre:`Oferta ${id}`, divisible:divisibleGlobal, cargasM2:3.01 }])
    setNextOfertaId(id + 1)
  }

  function getEscenarios() {
    if (!divisibleGlobal) return [{ label:'Total disponible', sup:supTotal, tipo:'unico' }]
    const base = espaciosComercializables.map(e => ({ label:`${e.planta} — ${e.edificio}`, sup:e.sup, tipo:'modulo' }))
    if (espaciosComercializables.length > 1) base.push({ label:'Total combinado', sup:supTotal, tipo:'total' })
    return base
  }

  const tipologiaOpciones = TIPOLOGIA_MAP[ASSET.usoPrincipal] || []

  // ── STACKING PLAN VIEW ───────────────────────────────────────────────────
  function StackingView() {
    return (
      <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 16px', borderBottom:'1px solid var(--border)', background:'var(--gray-lt)', flexShrink:0 }}>
          <button className="ab-btn" onClick={() => { setShowStacking(false); setSelectedOfertaId(null) }}>← Volver</button>
          <div style={{ fontSize:13, fontWeight:700 }}>Stacking Plan · Albatros — Edificio D</div>
          <div style={{ fontSize:10, color:'var(--text4)', marginLeft:4 }}>Asigna las ofertas a las plantas disponibles</div>
          {selectedOfertaId && (
            <div style={{ marginLeft:'auto', fontSize:10, background:'#dcfce7', color:'#166534', border:'1px solid #86efac', padding:'3px 10px', borderRadius:10, fontWeight:700 }}>
              Modo asignación activo — clic en planta disponible
            </div>
          )}
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          {/* Left panel: offers */}
          <div style={{ width:220, borderRight:'1px solid var(--border)', overflowY:'auto', padding:12, flexShrink:0 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:10 }}>Ofertas disponibles</div>

            {ofertasDesglose.length === 0
              ? <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin ofertas creadas. Ve a Espacios comerciales → Desglose de ofertas.</div>
              : ofertasDesglose.map((o, idx) => {
                  const col = OFERTA_COLORS[idx % OFERTA_COLORS.length]
                  const assignedFloors = BUILDING_FLOORS.filter(f => floorAssignments[f.id]?.ofertaId === o.id)
                  const assignedSup = assignedFloors.reduce((s, f) => s + (floorAssignments[f.id]?.sup || 0), 0)
                  const isSelected = selectedOfertaId === o.id
                  return (
                    <div key={o.id}
                      onClick={() => setSelectedOfertaId(isSelected ? null : o.id)}
                      style={{ padding:'9px 10px', border:`2px solid ${isSelected ? col.border : 'var(--border)'}`, borderRadius:'var(--r)', background:isSelected ? col.bg : 'var(--surface)', marginBottom:6, cursor:'pointer', transition:'all .15s' }}>
                      <div style={{ fontWeight:600, fontSize:12, color:col.text }}>{o.nombre}</div>
                      <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>
                        {assignedFloors.length} plantas · {assignedSup.toLocaleString()} m²
                      </div>
                      {isSelected && <div style={{ fontSize:9, color:col.text, fontWeight:700, marginTop:4 }}>Seleccionada · clic en planta disponible</div>}
                    </div>
                  )
                })
            }

            {/* Legend */}
            <div style={{ marginTop:16, borderTop:'1px solid var(--border)', paddingTop:10 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', marginBottom:6 }}>Leyenda</div>
              {[
                { color:'#f1f5f9', border:'#cbd5e1', label:'Disponible sin asignar' },
                { color:'#dcfce7', border:'#86efac', label:'Asignada a oferta' },
                { color:'#dbeafe', border:'#93c5fd', label:'Ocupada (arrendatario)' },
                { color:'#f8fafc', border:'#e2e8f0', label:'Zonas comunes' },
                { color:'#1e293b', border:'#334155', label:'Parking' },
              ].map((l, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <div style={{ width:12, height:12, borderRadius:2, background:l.color, border:`1px solid ${l.border}`, flexShrink:0 }} />
                  <span style={{ fontSize:10, color:'var(--text3)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Building */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700 }}>Albatros — Edificio D</div>
              <div style={{ fontSize:10, color:'var(--text4)' }}>Calle de Anabel Segura 9-11 · Alcobendas · 6 niveles</div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {BUILDING_FLOORS.map(floor => {
                const assignment = floorAssignments[floor.id]
                const isAssigned = !!assignment
                const ofertaIdx = isAssigned ? ofertasDesglose.findIndex(o => o.id === assignment.ofertaId) : -1
                const col = ofertaIdx >= 0 ? OFERTA_COLORS[ofertaIdx % OFERTA_COLORS.length] : null
                const oferta = isAssigned ? ofertasDesglose.find(o => o.id === assignment.ofertaId) : null
                const isVacant = floor.status === 'vac'
                const canAssign = isVacant && selectedOfertaId !== null
                const barPct = Math.max(15, Math.round((floor.sup / MAX_SUP) * 100))

                let bg, bd, tx
                if (isAssigned && col) { bg=col.bg; bd=col.border; tx=col.text }
                else if (floor.status==='ten') { bg='#dbeafe'; bd='#93c5fd'; tx='#1e40af' }
                else if (floor.status==='com') { bg='#f8fafc'; bd='#e2e8f0'; tx='#64748b' }
                else if (floor.status==='pk')  { bg='#1e293b'; bd='#334155'; tx='#94a3b8' }
                else { bg='#f1f5f9'; bd='#cbd5e1'; tx='#94a3b8' }

                return (
                  <div key={floor.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, fontSize:10, fontWeight:700, color:'var(--text3)', textAlign:'right', flexShrink:0 }}>{floor.id}</div>

                    <div
                      style={{ position:'relative', height:46, flex:1, background:'var(--gray-lt)', borderRadius:'var(--r)', overflow:'hidden', border:`1px solid ${canAssign ? '#86efac' : 'var(--border)'}`, cursor:canAssign ? 'pointer' : 'default', transition:'border .15s', boxShadow: canAssign ? '0 0 0 2px #dcfce7' : 'none' }}
                      onClick={() => {
                        if (!isVacant || !selectedOfertaId) return
                        setFloorAssignments(prev => ({ ...prev, [floor.id]:{ ofertaId:selectedOfertaId, sup:floor.sup, renta:12.50 } }))
                      }}
                    >
                      <div style={{ position:'absolute', top:0, left:0, width:`${barPct}%`, height:'100%', background:bg, borderRight:`2px solid ${bd}`, display:'flex', alignItems:'center', paddingLeft:10, gap:8, minWidth:0, overflow:'hidden' }}>

                        {floor.status==='ten' && !isAssigned && (
                          <>
                            <div style={{ width:6, height:6, borderRadius:'50%', background:'#3b82f6', flexShrink:0 }} />
                            <span style={{ fontSize:11, fontWeight:600, color:tx, whiteSpace:'nowrap' }}>{floor.tenant}</span>
                            <span style={{ fontSize:10, color:'#64748b', whiteSpace:'nowrap' }}>· vcto. {floor.brk}</span>
                          </>
                        )}
                        {(floor.status==='com'||floor.status==='pk') && (
                          <span style={{ fontSize:11, color:tx, whiteSpace:'nowrap' }}>{floor.name}</span>
                        )}
                        {isVacant && !isAssigned && (
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:10, color:tx }}>Disponible</span>
                            {canAssign && <span style={{ fontSize:9, background:'#dcfce7', color:'#166534', border:'1px solid #86efac', borderRadius:10, padding:'1px 7px', fontWeight:700 }}>+ Asignar</span>}
                          </div>
                        )}
                        {isAssigned && oferta && col && (
                          <div style={{ display:'flex', alignItems:'center', gap:8, width:'100%' }}>
                            <div style={{ width:7, height:7, borderRadius:'50%', background:col.dot, flexShrink:0 }} />
                            <span style={{ fontSize:11, fontWeight:600, color:tx, whiteSpace:'nowrap' }}>{oferta.nombre}</span>
                            <div style={{ display:'flex', alignItems:'center', gap:3 }} onClick={e => e.stopPropagation()}>
                              <input type="number" value={assignment.sup}
                                onChange={e => setFloorAssignments(prev => ({ ...prev, [floor.id]:{ ...prev[floor.id], sup:Number(e.target.value) } }))}
                                style={{ width:68, fontSize:10, border:'1px solid var(--border)', borderRadius:3, padding:'2px 5px', fontFamily:'var(--mono)', background:'white' }} />
                              <span style={{ fontSize:10, color:tx }}>m²</span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:3 }} onClick={e => e.stopPropagation()}>
                              <input type="number" step="0.01" value={assignment.renta}
                                onChange={e => setFloorAssignments(prev => ({ ...prev, [floor.id]:{ ...prev[floor.id], renta:Number(e.target.value) } }))}
                                style={{ width:52, fontSize:10, border:'1px solid var(--border)', borderRadius:3, padding:'2px 5px', fontFamily:'var(--mono)', background:'white' }} />
                              <span style={{ fontSize:10, color:tx }}>€/m²</span>
                            </div>
                            <button onClick={e => { e.stopPropagation(); setFloorAssignments(prev => { const n={...prev}; delete n[floor.id]; return n }) }}
                              style={{ marginLeft:'auto', marginRight:6, fontSize:11, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 6px', fontFamily:'inherit' }}>✕</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ width:66, fontSize:10, color:'var(--text4)', fontFamily:'var(--mono)', textAlign:'right', flexShrink:0 }}>{floor.sup.toLocaleString()} m²</div>
                  </div>
                )
              })}
            </div>

            {/* Summary table */}
            <div style={{ marginTop:20, borderTop:'1px solid var(--border)', paddingTop:14 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
                Espacios comercializables
                <span style={{ fontSize:9, color:'var(--green)', background:'var(--green-lt)', border:'1px solid var(--green-bd)', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>ↈ Auto-actualizado</span>
              </div>
              {espaciosComercializables.length === 0
                ? <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Sin plantas asignadas todavía.</div>
                : (
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                    <thead><tr>
                      {['Planta','Oferta','Superficie','Renta €/m²','Renta mensual'].map(h =>
                        <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', background:'var(--gray-lt)', borderBottom:'1px solid var(--border)', textTransform:'uppercase' }}>{h}</th>
                      )}
                    </tr></thead>
                    <tbody>
                      {espaciosComercializables.map((e,i) => (
                        <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                          <td style={{ padding:'6px 12px' }}><span className="tag tag-gray" style={{ fontSize:9 }}>{e.planta}</span></td>
                          <td style={{ padding:'6px 12px', fontSize:10, color:'var(--accent)' }}>{e.ofertaNombre}</td>
                          <td style={{ padding:'6px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{e.sup.toLocaleString()}</td>
                          <td style={{ padding:'6px 12px', fontFamily:'var(--mono)' }}>{e.renta.toFixed(2)} €</td>
                          <td style={{ padding:'6px 12px', fontFamily:'var(--mono)', fontWeight:600, color:'var(--green)' }}>{(e.renta*e.sup).toLocaleString(undefined,{maximumFractionDigits:0})} €</td>
                        </tr>
                      ))}
                      <tr style={{ background:'var(--gray-lt)', borderTop:'2px solid var(--border)' }}>
                        <td colSpan={2} style={{ padding:'6px 12px', fontSize:10, fontWeight:700, color:'var(--text3)' }}>TOTAL</td>
                        <td style={{ padding:'6px 12px', fontFamily:'var(--mono)', fontWeight:800 }}>{supTotal.toLocaleString()}</td>
                        <td />
                        <td style={{ padding:'6px 12px', fontFamily:'var(--mono)', fontWeight:800, color:'var(--green)' }}>{espaciosComercializables.reduce((s,e)=>s+e.renta*e.sup,0).toLocaleString(undefined,{maximumFractionDigits:0})} €</td>
                      </tr>
                    </tbody>
                  </table>
                )
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Guardar y cerrar</button>
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn">Desactivar</button>
        <div className="ab-sep" />
        <button className={`ab-btn ${showStacking ? 'save' : 'blue'}`} onClick={() => { setShowStacking(v => !v); setSelectedOfertaId(null) }}>
          📊 Stacking plan{showStacking ? ' ✓' : ''}
        </button>
        <button className="ab-btn">📄 Crear ficha</button>
        <button className="ab-btn">🔄 Recalcular</button>
        <button className="ab-btn">🌐 Descripción web</button>
        <div className="ab-sep" />
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">
          {/* Header */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#064e3b,#10b981)' }}>📋</div>
              <div style={{ flex:1 }}>
                <div className="ah-ref">
                  <span className="ref-badge-oferta">OFERTA</span>
                  <span className="asset-link" style={{ fontFamily:'var(--mono)' }}>OLBUR2315645</span>
                  {confidential && <span style={{ background:'#1e293b',color:'#f8fafc',border:'1px solid #334155',padding:'0 7px',borderRadius:3,fontSize:9,fontWeight:700,letterSpacing:'.04em' }}>🔒 CONFIDENCIAL</span>}
                  <span style={{ color:'var(--text3)' }}>· Activo: <span className="pat-link" onClick={() => navigate('ficha-activo')}>Albatros — C. Anabel Segura 9-11, Alcobendas</span></span>
                  <span className="tag tag-green" style={{ fontSize:9 }}>+ Vinculado</span>
                </div>
                <div className="ah-name">Albatros — Calle de Anabel Segura 9-11, 28108 Alcobendas</div>
                <div className="ah-addr">📍 Alcobendas · Área: Periferia · Zona: A-1 · Sub-zona: Alcobendas / Arroyo de la Vega</div>
                <div className="ah-tags">
                  <span className="tag tag-blue">Oficinas</span>
                  <span className="tag tag-purple">Mandato Savills</span>
                  <span className="tag tag-teal">Alquiler</span>
                  <span className="tag tag-green">En curso</span>
                  <span className="dias-pill">📅 127 días en comercialización</span>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase' }}>Equipo</div>
                <div style={{ fontSize:11, fontWeight:600 }}>Transaction Spain</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4, justifyContent:'flex-end' }}>
                  <div className="c-av" style={{ background:'#dbeafe', color:'#1e40af', width:22, height:22, fontSize:8 }}>AS</div>
                  <span style={{ fontSize:11 }}>Sierra Álvaro</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stacking plan view — replaces tabs when active */}
          {showStacking ? <StackingView /> : (
            <>
              <div className="tabs">
                {TABS.map((t,i) => <div key={t} className={`tab ${activeTab===t?'active':''}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[i]}</div>)}
              </div>

              {/* ── TAB 1: Información oferta ── */}
              {activeTab==='of-info' && (
                <div className="tab-content active">
                  <div className="info-pad">
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        <div>
                          <FieldLbl req>Activo / Asset</FieldLbl>
                          <div style={{ padding:'6px 9px', border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', fontSize:12, color:'var(--accent)', cursor:'pointer', background:'var(--accent-lt)', display:'flex', alignItems:'center', gap:6 }} onClick={() => navigate('ficha-activo')}>
                            <span>🏢</span><span style={{ flex:1, fontWeight:500 }}>Albatros — C. Anabel Segura 9-11, Alcobendas</span><span style={{ fontSize:9, fontWeight:700 }}>↗</span>
                          </div>
                        </div>
                        <div><FieldLbl>Uso principal</FieldLbl><ReadonlyPill value={ASSET.usoPrincipal} /></div>
                        <div><FieldLbl>Estado de construcción</FieldLbl><ReadonlyPill value={ASSET.estadoConstruccion} /></div>
                        <div>
                          <FieldLbl req>Tipología de comercialización</FieldLbl>
                          <select className="of-sel" value={tipoComercializacion} onChange={e => setTipoComercializacion(e.target.value)}>
                            <option>Mandato Savills</option><option>Sin mandato</option><option>Otras consultoras</option>
                          </select>
                        </div>
                        <div>
                          <FieldLbl req>Tipología</FieldLbl>
                          <select className="of-sel" value={tipologia} onChange={e => setTipologia(e.target.value)}>
                            <option value="">— Seleccionar —</option>
                            {tipologiaOpciones.map(t => <option key={t}>{t}</option>)}
                          </select>
                          {tipologiaOpciones.length > 0 && <div style={{ fontSize:9, color:'var(--text4)', marginTop:2 }}>Opciones para <strong>{ASSET.usoPrincipal}</strong></div>}
                        </div>
                        <div>
                          <FieldLbl>Estado del espacio</FieldLbl>
                          <select className="of-sel" value={estadoEspacio} onChange={e => setEstadoEspacio(e.target.value)}>
                            <option value="">— Seleccionar —</option>
                            {['Nuevo','Obra nueva','Muy buen estado','En bruto','Segunda mano','Implantado','Plug&Play','Por reformar','Amueblado','Sin amueblar'].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <FieldLbl req>Tipo de operación</FieldLbl>
                          <select className="of-sel" value={tipoOperacion} onChange={e => setTipoOperacion(e.target.value)}>
                            <option>Alquiler</option><option>Venta</option><option>Alquiler / Venta</option>
                          </select>
                        </div>
                        <div>
                          <FieldLbl>Origen de la oferta</FieldLbl>
                          <select className="of-sel" value={origenOferta} onChange={e => setOrigenOferta(e.target.value)}>
                            <option value="">— Seleccionar —</option>
                            {['Demanda entrante','Prospección directa','Referencia interna','Portal web','Red de colaboradores','Otra consultora'].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                        <div><FieldLbl>Mandato asociado</FieldLbl><input className="of-inp" placeholder="🔍  Buscar mandato..." /></div>
                        <div><FieldLbl>KYC</FieldLbl><input className="of-inp" placeholder="🔍  Buscar registro KYC..." /></div>
                        <div>
                          <FieldLbl>Modalidad de visita</FieldLbl>
                          <select className="of-sel" value={modalidadVisita} onChange={e => setModalidadVisita(e.target.value)}>
                            <option value="">— Seleccionar —</option><option>Presencial</option><option>Virtual</option><option>Presencial + Virtual</option>
                          </select>
                        </div>
                        <div><FieldLbl>Comentarios</FieldLbl><textarea className="of-textarea" placeholder="Observaciones internas..." value={comentarios} onChange={e => setComentarios(e.target.value)} style={{ minHeight:72 }} /></div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        <div>
                          <FieldLbl>Ubicación · Georreferenciado desde activo</FieldLbl>
                          <div style={{ borderRadius:'var(--r2)', overflow:'hidden', border:'1px solid var(--border)', height:280 }}>
                            <iframe title="Mapa oferta" width="100%" height="100%" style={{ border:0 }} loading="lazy"
                              src="https://maps.google.com/maps?q=Calle+de+Anabel+Segura+9-11,+Alcobendas,+Madrid&z=15&output=embed" />
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                            <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'7px 10px', fontSize:11 }}>
                              <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Dirección</div>
                              <div style={{ color:'var(--text2)', marginTop:2 }}>Calle de Anabel Segura 9-11</div>
                              <div style={{ color:'var(--text3)' }}>28108 Alcobendas, Madrid</div>
                            </div>
                            <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'7px 10px', fontSize:11 }}>
                              <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Zona</div>
                              <div style={{ color:'var(--text2)', marginTop:2 }}>A-1 · Alcobendas</div>
                              <div style={{ color:'var(--text3)' }}>Arroyo de la Vega</div>
                            </div>
                          </div>
                        </div>
                        <div><FieldLbl>Imágenes · Vinculadas al activo</FieldLbl><div className="img-strip"><div className="img-thumb principal">🏢</div><div className="img-thumb">🏙</div><div className="img-thumb">🖼</div></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: Datos de contacto ── */}
              {activeTab==='of-contacto' && (
                <div className="tab-content active">
                  <div className="info-pad">
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                      {/* Propietario */}
                      <div className="info-block">
                        <div className="ib-title">🏠 PROPIETARIO</div>
                        <div style={{ fontSize:9, color:'var(--text4)', marginBottom:8, fontWeight:600, letterSpacing:'.04em' }}>Sincronizado desde el activo</div>
                        <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{ASSET.propietario.sociedad}</div>
                        <div style={{ fontSize:11, color:'var(--accent)', fontWeight:500, marginBottom:8 }}>{ASSET.propietario.contacto}</div>
                        <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:10, fontSize:11, display:'flex', flexDirection:'column', gap:4 }}>
                          <div>📞 {ASSET.propietario.telFijo}</div>
                          <div>📱 {ASSET.propietario.telMovil}</div>
                          <div style={{ color:'var(--accent)' }}>✉ {ASSET.propietario.email}</div>
                        </div>
                        <div style={{ marginTop:8 }}><span style={{ fontSize:9, background:'var(--green-lt)', color:'var(--green)', border:'1px solid var(--green-bd)', padding:'2px 7px', borderRadius:10, fontWeight:700 }}>ↈ Sincronizado</span></div>
                      </div>
                      {/* Colaboradores */}
                      <div className="info-block">
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                          <div className="ib-title" style={{ marginBottom:0 }}>🤝 COLABORADORES</div>
                          {tipoComercializacion==='Otras consultoras' && <button className="ab-btn blue" style={{ fontSize:10, padding:'2px 8px' }} onClick={() => setAddingColab(true)}>+ Añadir</button>}
                        </div>
                        {tipoComercializacion!=='Otras consultoras'
                          ? <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Selecciona "Otras consultoras" en Información general para activar.</div>
                          : colaboradores.length===0 && !addingColab
                            ? <button className="ab-btn" style={{ fontSize:10 }} onClick={() => setAddingColab(true)}>+ Añadir consultora</button>
                            : null
                        }
                        {colaboradores.map((c,i) => (
                          <div key={i} style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', padding:10, marginBottom:8, fontSize:11 }}>
                            <div style={{ fontWeight:600 }}>{c.empresa}</div>
                            {c.contacto && <div style={{ color:'var(--accent)' }}>{c.contacto}</div>}
                            <button onClick={() => setColaboradores(prev => prev.filter((_,j)=>j!==i))} style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'4px 0', fontFamily:'inherit' }}>✕ Quitar</button>
                          </div>
                        ))}
                        {addingColab && (
                          <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r)', padding:12 }}>
                            <div style={{ fontSize:11, fontWeight:600, marginBottom:8 }}>Añadir consultora</div>
                            <div style={{ marginBottom:7 }}>
                              <FieldLbl>Empresa</FieldLbl>
                              <select className="fsel" style={{ width:'100%' }} value={newColabEmpresa} onChange={e => setNewColabEmpresa(e.target.value)}>
                                <option value="">Buscar...</option>
                                {['CBRE','JLL','Cushman & Wakefield','Colliers','Knight Frank','BNP Paribas RE'].map(e => <option key={e}>{e}</option>)}
                              </select>
                            </div>
                            <div style={{ marginBottom:10 }}><FieldLbl>Contacto</FieldLbl><input className="of-inp" placeholder="Buscar..." value={newColabContacto} onChange={e => setNewColabContacto(e.target.value)} /></div>
                            <div style={{ display:'flex', gap:6 }}>
                              <button className="ab-btn save" onClick={() => { if(!newColabEmpresa)return; setColaboradores(prev=>[...prev,{empresa:newColabEmpresa,contacto:newColabContacto}]); setAddingColab(false); setNewColabEmpresa(''); setNewColabContacto('') }}>Añadir</button>
                              <button className="ab-btn" onClick={() => { setAddingColab(false); setNewColabEmpresa(''); setNewColabContacto('') }}>Cancelar</button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Equipo Savills */}
                      <div className="info-block">
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                          <div className="ib-title" style={{ marginBottom:0 }}>👥 EQUIPO SAVILLS</div>
                          <div style={{ display:'flex', gap:5 }}>
                            <button className="ab-btn" style={{ fontSize:9, padding:'2px 7px' }} onClick={() => setAddingMiembro(true)}>+ Miembro</button>
                            <button className="ab-btn" style={{ fontSize:9, padding:'2px 7px' }}>+ Equipo</button>
                          </div>
                        </div>
                        <div style={{ fontSize:9, color:'var(--amber)', background:'var(--amber-lt)', border:'1px solid var(--amber-bd)', borderRadius:4, padding:'4px 8px', marginBottom:10, fontWeight:600 }}>Solo editable por creador o manager</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {equipoMembers.map((m,i) => (
                            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                              <div style={{ width:28, height:28, borderRadius:'50%', background:m.bg, color:m.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>{m.initials}</div>
                              <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:600 }}>{m.name}</div><div style={{ fontSize:10, color:'var(--text3)' }}>{m.team}</div></div>
                              {m.owner ? <span className="tag tag-blue" style={{ fontSize:9 }}>Responsable</span>
                                : <button onClick={() => setEquipoMembers(prev=>prev.filter((_,j)=>j!==i))} style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', fontFamily:'inherit' }}>✕</button>}
                            </div>
                          ))}
                        </div>
                        {addingMiembro && (
                          <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r)', padding:10, marginTop:8 }}>
                            <FieldLbl>Usuario</FieldLbl>
                            <select className="fsel" style={{ width:'100%', marginBottom:8 }} value={newMiembro} onChange={e => setNewMiembro(e.target.value)}>
                              <option value="">Seleccionar...</option>
                              {['GOMEZ Ignacio · Leasing Oficinas MAD','García Marta · Capital Markets MAD','López Carmen · Valoraciones MAD','Martínez Rosa · Retail MAD'].map(u => <option key={u}>{u}</option>)}
                            </select>
                            <div style={{ display:'flex', gap:6 }}>
                              <button className="ab-btn save" style={{ fontSize:10 }} onClick={() => {
                                if(!newMiembro)return
                                const [nameStr,teamStr]=[newMiembro.split('·')[0].trim(),newMiembro.split('·')[1]?.trim()||'']
                                const ini=nameStr.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                                setEquipoMembers(prev=>[...prev,{name:nameStr,team:teamStr,role:'Colaborador',initials:ini,bg:'#f0fdf4',color:'#166534',owner:false}])
                                setAddingMiembro(false); setNewMiembro('')
                              }}>Añadir</button>
                              <button className="ab-btn" style={{ fontSize:10 }} onClick={() => { setAddingMiembro(false); setNewMiembro('') }}>Cancelar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: Espacios comerciales ── */}
              {activeTab==='of-espacios' && (
                <div className="tab-content active">
                  <div className="info-pad">
                    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16 }}>
                      {/* Config izquierda */}
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        <div style={{ fontSize:11, fontWeight:700, marginBottom:2 }}>Configuración general</div>
                        <div><FieldLbl>Fecha disponibilidad</FieldLbl><input type="date" className="of-inp" value={fechaDispGlobal} onChange={e => setFechaDispGlobal(e.target.value)} /></div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                          <div><div style={{ fontSize:11, fontWeight:600 }}>¿Divisible?</div><div style={{ fontSize:9, color:'var(--text4)' }}>Aplica a toda la oferta</div></div>
                          <button onClick={() => setDivisibleGlobal(v=>!v)} style={{ padding:'4px 12px', borderRadius:12, border:'none', fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit', background:divisibleGlobal?'#dcfce7':'#fef2f2', color:divisibleGlobal?'#166534':'#991b1b' }}>
                            {divisibleGlobal ? 'Sí' : 'No'}
                          </button>
                        </div>
                        <div>
                          <FieldLbl>Superficie total disponible (m²)</FieldLbl>
                          <div style={{ padding:'6px 9px', border:'1px solid var(--border)', borderRadius:'var(--r)', fontSize:14, fontWeight:700, background:'var(--gray-lt)', display:'flex', alignItems:'center', gap:6 }}>
                            <span>{supTotal.toLocaleString()}</span><span style={{ marginLeft:'auto', fontSize:9, color:'var(--text4)', fontWeight:600 }}>AUTO</span>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <input type="checkbox" id="supAprox" checked={supAprox} onChange={e => setSupAprox(e.target.checked)} style={{ accentColor:'var(--accent)' }} />
                          <label htmlFor="supAprox" style={{ fontSize:11, cursor:'pointer' }}>Superficie aproximada</label>
                        </div>
                        <div><FieldLbl>Planta tipo (m²)</FieldLbl><input type="number" className="of-inp" value={plantaTipo} onChange={e => setPlantaTipo(e.target.value)} /></div>
                        <div style={{ padding:'10px 12px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:'var(--r)', fontSize:10 }}>
                          <div style={{ fontWeight:700, color:'var(--accent)', marginBottom:4 }}>Escenarios comerciales</div>
                          {getEscenarios().map((sc,i) => (
                            <div key={i} style={{ display:'flex', justifyContent:'space-between', color:'var(--text2)', marginBottom:2 }}>
                              <span>{sc.label}</span><span style={{ fontFamily:'var(--mono)', fontWeight:600 }}>{sc.sup.toLocaleString()} m²</span>
                            </div>
                          ))}
                        </div>
                        <button className="ab-btn blue" style={{ fontSize:10 }} onClick={() => setShowStacking(true)}>📊 Abrir Stacking Plan →</button>
                      </div>

                      {/* Derecha */}
                      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        {/* Desglose de ofertas */}
                        <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--gray-lt)' }}>
                            <div style={{ fontSize:11, fontWeight:700 }}>Desglose de ofertas</div>
                            <button className="ab-btn blue" style={{ fontSize:10, padding:'3px 10px' }} onClick={addOferta}>+ Agregar</button>
                          </div>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                            <thead><tr>
                              {['Nombre área','Sup. total','¿Divisible?','Cargas €/m²','Fecha disp.','Plantas asignadas',''].map(h =>
                                <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                              )}
                            </tr></thead>
                            <tbody>
                              {ofertasDesglose.map((o,idx) => {
                                const col = OFERTA_COLORS[idx % OFERTA_COLORS.length]
                                const assignedFloors = BUILDING_FLOORS.filter(f => floorAssignments[f.id]?.ofertaId === o.id)
                                const assignedSup = assignedFloors.reduce((s,f) => s+(floorAssignments[f.id]?.sup||0), 0)
                                return (
                                  <tr key={o.id} style={{ borderBottom:'1px solid var(--border)' }}>
                                    <td style={{ padding:'7px 12px' }}>
                                      {editNombreId===o.id
                                        ? <input autoFocus value={editNombreVal} onChange={e => setEditNombreVal(e.target.value)}
                                            onBlur={() => { setOfertasDesglose(prev=>prev.map(x=>x.id===o.id?{...x,nombre:editNombreVal||x.nombre}:x)); setEditNombreId(null) }}
                                            onKeyDown={e => { if(e.key==='Enter'){setOfertasDesglose(prev=>prev.map(x=>x.id===o.id?{...x,nombre:editNombreVal||x.nombre}:x));setEditNombreId(null)} }}
                                            style={{ fontSize:11, border:'1px solid var(--accent)', borderRadius:3, padding:'2px 6px', fontFamily:'inherit', width:120 }} />
                                        : <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                            <div style={{ width:8, height:8, borderRadius:'50%', background:col.dot, flexShrink:0 }} />
                                            <span className="pat-link" onClick={() => { setEditNombreId(o.id); setEditNombreVal(o.nombre) }}>{o.nombre}</span>
                                          </div>
                                      }
                                    </td>
                                    <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{assignedSup>0?assignedSup.toLocaleString():<span style={{ color:'var(--text4)' }}>—</span>}</td>
                                    <td style={{ padding:'7px 12px' }}><span style={{ fontSize:10, fontWeight:600, color:o.divisible?'var(--green)':'var(--red)' }}>{o.divisible?'Sí':'No'}</span></td>
                                    <td style={{ padding:'7px 12px', color:'var(--text3)' }}>{o.cargasM2} €</td>
                                    <td style={{ padding:'7px 12px', color:'var(--text3)', whiteSpace:'nowrap' }}>{fechaDispGlobal?new Date(fechaDispGlobal).toLocaleDateString('es-ES'):'—'}</td>
                                    <td style={{ padding:'7px 12px' }}>
                                      {assignedFloors.length>0
                                        ? <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                                            {assignedFloors.map(f=><span key={f.id} style={{ fontSize:9, background:col.bg, color:col.text, border:`1px solid ${col.border}`, borderRadius:8, padding:'1px 6px', fontWeight:600 }}>{f.id}</span>)}
                                          </div>
                                        : <span style={{ fontSize:10, color:'var(--text4)', fontStyle:'italic' }}>Sin asignar</span>
                                      }
                                    </td>
                                    <td style={{ padding:'7px 12px' }}>
                                      <div style={{ display:'flex', gap:4 }}>
                                        <button className="ra p" onClick={() => { setEditNombreId(o.id); setEditNombreVal(o.nombre) }}>✎</button>
                                        <button className="ra" onClick={() => setOfertasDesglose(prev=>prev.filter(x=>x.id!==o.id))} style={{ color:'var(--red)' }}>✕</button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                              {ofertasDesglose.length===0 && <tr><td colSpan={7} style={{ padding:18, textAlign:'center', color:'var(--text4)', fontSize:11, fontStyle:'italic' }}>Sin ofertas. Pulsa "+ Agregar".</td></tr>}
                            </tbody>
                          </table>
                          <div style={{ padding:'7px 14px', background:'var(--accent-lt)', borderTop:'1px solid var(--accent-bd)', fontSize:10, color:'var(--accent)' }}>
                            ↈ Al guardar, las ofertas se sincronizan automáticamente con el Stacking Plan.
                          </div>
                        </div>

                        {/* Espacios comercializables */}
                        <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--gray-lt)' }}>
                            <div><span style={{ fontSize:11, fontWeight:700 }}>Espacios comercializables</span><span style={{ marginLeft:8, fontSize:9, color:'var(--text4)' }}>Proyección automática del Stacking Plan</span></div>
                            <span className="tag tag-green" style={{ fontSize:9 }}>ↈ Auto-calculado</span>
                          </div>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                            <thead><tr>
                              {['Edificio','Módulo','Planta','Uso','Superficie','Divisible','Renta €/m²/mes','Renta mensual'].map(h =>
                                <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', borderBottom:'1px solid var(--border)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                              )}
                            </tr></thead>
                            <tbody>
                              {espaciosComercializables.map((e,i) => (
                                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                                  <td style={{ padding:'7px 12px', fontSize:10, color:'var(--text2)' }}>{e.edificio}</td>
                                  <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontSize:10 }}>{e.modulo}</td>
                                  <td style={{ padding:'7px 12px' }}><span className="tag tag-gray" style={{ fontSize:9 }}>{e.planta}</span></td>
                                  <td style={{ padding:'7px 12px' }}><span className="tag tag-blue" style={{ fontSize:9 }}>{e.uso}</span></td>
                                  <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600 }}>{e.sup.toLocaleString()}</td>
                                  <td style={{ padding:'7px 12px' }}><span style={{ fontSize:10, fontWeight:600, color:divisibleGlobal?'var(--green)':'var(--red)' }}>{divisibleGlobal?'Sí':'No'}</span></td>
                                  <td style={{ padding:'7px 12px', fontFamily:'var(--mono)' }}>{e.renta.toFixed(2)} €</td>
                                  <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:600, color:'var(--green)' }}>{(e.renta*e.sup).toLocaleString(undefined,{maximumFractionDigits:0})} €</td>
                                </tr>
                              ))}
                              <tr style={{ background:'var(--gray-lt)', borderTop:'2px solid var(--border)' }}>
                                <td colSpan={4} style={{ padding:'7px 12px', fontSize:10, fontWeight:700, color:'var(--text3)' }}>TOTAL</td>
                                <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:800 }}>{supTotal.toLocaleString()}</td>
                                <td /><td />
                                <td style={{ padding:'7px 12px', fontFamily:'var(--mono)', fontWeight:800, color:'var(--green)' }}>{espaciosComercializables.reduce((s,e)=>s+e.renta*e.sup,0).toLocaleString(undefined,{maximumFractionDigits:0})} €</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plazas */}
              {activeTab==='of-plazas' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Plazas de aparcamiento</div>
                  <table className="pat-table"><thead><tr><th>Tipo</th><th>Int/Ext</th><th>Vehículo</th><th>Número</th><th>Renta plaza</th><th>Total/mes</th></tr></thead>
                  <tbody><tr><td>Simple</td><td>Interior</td><td>Coches</td><td>322</td><td>€110,00</td><td style={{ fontWeight:600 }}>€35.420,00</td></tr></tbody></table>
                </div></div>
              )}

              {/* Condiciones */}
              {activeTab==='of-condiciones' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Condiciones <span className="tag tag-green" style={{ fontSize:9, marginLeft:6 }}>+ Sincronizado</span></div>
                  <div className="cond-grid">
                    <div className="cond-block"><div className="cond-block-title">CONDICIONES CONTRACTUALES</div>
                      <div className="cond-row"><span className="cond-key">Tipo arrendamiento</span><span className="cond-val">Alquiler comercial</span></div>
                      <div className="cond-row"><span className="cond-key">Régimen fiscal</span><span className="cond-val">I.V.A.</span></div>
                      <div className="cond-row"><span className="cond-key">Fianza legal</span><span className="cond-val">2 meses sin IVA</span></div>
                      <div className="cond-row"><span className="cond-key">Indexación anual</span><span className="cond-val">Sí</span></div>
                      <div className="cond-row"><span className="cond-key">Pago honorarios</span><span className="cond-val">A la firma</span></div>
                    </div>
                    <div className="cond-block"><div className="cond-block-title">CONDICIONES ECONÓMICAS</div>
                      <div className="cond-row"><span className="cond-key">Renta (€/m²/mes)</span><span className="cond-val" style={{ fontSize:15, color:'var(--green)' }}>12,50 €</span></div>
                      <div className="cond-row"><span className="cond-key">Renta mensual</span><span className="cond-val" style={{ color:'var(--green)' }}>168.575 €</span></div>
                      <div className="cond-row"><span className="cond-key">Gastos comunes</span><span className="cond-val">3,01 €/m²/mes</span></div>
                    </div>
                    <div className="cond-block"><div className="cond-block-title">INCENTIVOS Y CAPEX</div>
                      <div className="cond-row"><span className="cond-key">Meses de carencia</span><span className="cond-val">—</span></div>
                      <div className="cond-row"><span className="cond-key">Aportación obras</span><span className="cond-val">—</span></div>
                      <div className="cond-row"><span className="cond-key">Estado oferta</span><span className="cond-val" style={{ color:'var(--green)' }}>Disponible</span></div>
                    </div>
                  </div>
                </div></div>
              )}

              {/* Características */}
              {activeTab==='of-caract' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ fontSize:14, fontWeight:600 }}>Características · Importadas del activo</div>
                    <button className="ab-btn blue" style={{ padding:'3px 9px', fontSize:10 }}>↩ Recuperar</button>
                  </div>
                  <div style={{ background:'var(--green-lt)', border:'1px solid var(--green-bd)', borderRadius:'var(--r)', padding:'6px 10px', marginBottom:10, fontSize:11, color:'var(--green)' }}>
                    ↈ Características recuperadas del activo. Edita sin modificar el dato maestro.
                    <span style={{ background:'var(--green-lt)', color:'var(--green)', border:'1px solid var(--green-bd)', padding:'1px 7px', borderRadius:10, fontSize:9, fontWeight:700, marginLeft:6 }}>+ Importado</span>
                  </div>
                  <table className="pat-table"><thead><tr><th>¿Incluido?</th><th>Proponer</th><th>Tipo</th><th>Año</th><th>Comentario</th></tr></thead>
                  <tbody><tr><td><input type="checkbox" defaultChecked style={{ accentColor:'var(--accent)' }} /></td><td><input type="checkbox" style={{ accentColor:'var(--accent)' }} /></td><td>Rehabilitación integral</td><td>2023</td><td style={{ color:'var(--text4)' }}>—</td></tr></tbody></table>
                </div></div>
              )}

              {/* Documentos */}
              {activeTab==='of-docs' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div style={{ fontSize:14, fontWeight:600 }}>Documentos</div><button className="ab-btn blue">↑ Cargar</button>
                  </div>
                  <table className="doc-table"><thead><tr><th>Documento</th><th>Tipo</th><th>Fecha</th></tr></thead>
                  <tbody>
                    <tr><td><span className="doc-link">📊 Dossier Albatros</span></td><td><span className="tag tag-blue">Comercial</span></td><td>05/11/2024</td></tr>
                    <tr><td><span className="doc-link">📋 Ficha técnica Edif. D</span></td><td><span className="tag tag-teal">Técnica</span></td><td>05/11/2024</td></tr>
                  </tbody></table>
                </div></div>
              )}

              {/* Contenido web */}
              {activeTab==='of-web' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <div className="of-field" style={{ marginBottom:10 }}><div className="of-lbl">Título (Web/Flyer)</div><input className="of-inp" defaultValue="Complejo de edificios exclusivos en Arroyo de la Vega" /></div>
                      <div className="of-field"><div className="of-lbl">Texto descriptivo</div><textarea className="of-textarea" defaultValue="Situados en un entorno profesional de alto nivel, en Arroyo de la Vega, los edificios C y D Albatros ofrecen unas instalaciones únicas reformadas de forma integral." /></div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>PORTALES WEB</div>
                      <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                        {[['🌐 Web Savills',true],['🏠 Idealista',false],['🏢 Mis Oficinas',false]].map(([lbl,checked],i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom:i<2?'1px solid var(--border)':'none' }}>
                            <span style={{ fontSize:12 }}>{lbl}</span><input type="checkbox" defaultChecked={checked} style={{ accentColor:'var(--accent)' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div></div>
              )}

              {/* Descriptivo */}
              {activeTab==='of-desc' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div className="info-block"><div className="ib-title">OPCIONES DE VISUALIZACIÓN</div>
                      <div className="of-field" style={{ marginBottom:10 }}><div className="of-lbl">Geolocalizar dirección</div><select className="of-sel"><option>Sí</option><option>No</option></select></div>
                      <div className="of-field"><div className="of-lbl">Mostrar datos consultor</div><select className="of-sel"><option>No</option><option>Sí</option></select></div>
                    </div>
                    <div className="info-block"><div className="ib-title">CARACTERÍSTICAS A RESALTAR</div>
                      <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:10, fontSize:11, lineHeight:1.8 }}>
                        <div>• Gimnasio equipado</div><div>• Parking interior</div><div>• Zonas ajardinadas</div><div>• Terraza privativa en 4ª planta</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop:16 }}>
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>HISTÓRICO DE DESCRIPTIVOS</div>
                    <table className="pat-table"><thead><tr><th>Enlace</th><th>Fecha</th><th>Autor</th></tr></thead>
                    <tbody>
                      <tr><td><span className="pat-link">https://savills.com/flyer/#/descrip...</span></td><td>13/10/2025 · 9:58</td><td>Sierra Álvaro</td></tr>
                      <tr><td><span className="pat-link">https://savills.com/flyer/#/descrip...</span></td><td>27/11/2024 · 18:09</td><td>Sierra Álvaro</td></tr>
                    </tbody></table>
                  </div>
                </div></div>
              )}

              {/* Seguimiento */}
              {activeTab==='of-seg' && (
                <div className="tab-content active"><div className="info-pad">
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                    {[
                      {lbl:'Actividades totales',val:SEG_ACTS.length,color:'var(--text1)'},
                      {lbl:'Presentaciones',val:SEG_ACTS.filter(a=>a.tipo==='Presentación').length,color:'var(--amber)'},
                      {lbl:'Visitas realizadas',val:SEG_ACTS.filter(a=>a.tipo==='Visita').length,color:'var(--teal)'},
                      {lbl:'Pendientes',val:SEG_ACTS.filter(a=>a.estado==='Abierto'||a.estado==='En curso').length,color:'var(--red)'},
                    ].map(k => (
                      <div key={k.lbl} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'8px 12px', textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{k.lbl}</div>
                        <div style={{ fontSize:18, fontWeight:800, fontFamily:'var(--mono)', color:k.color }}>{k.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ fontSize:11, fontWeight:600 }}>Actividades vinculadas a la oferta</div>
                    <button className="ab-btn blue">+ Registrar actividad</button>
                  </div>
                  <div className="info-block" style={{ padding:0, overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                      <thead><tr>{['','ID','Tipo','Descripción','Fecha','Responsable','Estado'].map(h =>
                        <th key={h} style={{ padding:'6px 12px', fontSize:9, fontWeight:600, color:'var(--text4)', textAlign:'left', background:'var(--gray-lt)', borderBottom:'1px solid var(--border)', textTransform:'uppercase' }}>{h}</th>
                      )}</tr></thead>
                      <tbody>{SEG_ACTS.map(a => (
                        <tr key={a.id} style={{ borderBottom:'1px solid var(--border)', cursor:'pointer' }} onClick={() => navigate('ficha-actividad')}>
                          <td style={{ padding:'7px 10px', width:30 }}><div style={{ width:26, height:26, borderRadius:'50%', background:a.bg, color:a.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700 }}>{a.initials}</div></td>
                          <td style={{ padding:'7px 12px' }}><span className="asset-link" style={{ fontFamily:'var(--mono)', fontSize:10 }}>{a.id}</span></td>
                          <td style={{ padding:'7px 12px' }}><span className={`tag ${TIPO_TAG[a.tipo]||'tag-gray'}`}>{TIPO_ICO[a.tipo]} {a.tipo}</span></td>
                          <td style={{ padding:'7px 12px', fontWeight:500, maxWidth:320 }}>{a.asunto}</td>
                          <td style={{ padding:'7px 12px', color:'var(--text3)', whiteSpace:'nowrap' }}>{a.fecha}</td>
                          <td style={{ padding:'7px 12px', fontSize:10, color:'var(--text3)' }}>{a.user}</td>
                          <td style={{ padding:'7px 12px' }}><span className={`tag ${ACT_EST[a.estado]||'tag-gray'}`}>{a.estado}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div></div>
              )}

              {/* Crear ficha */}
              {activeTab==='of-ficha' && (
                <div className="tab-content active"><div className="info-pad">
                  <div className="info-block"><div className="ib-title">CREAR FICHA COMERCIAL</div>
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <button className="ab-btn blue">📄 Generar PDF</button>
                      <button className="ab-btn">📝 Generar Word</button>
                      <button className="ab-btn">🌐 Ver ficha web</button>
                    </div>
                  </div>
                </div></div>
              )}

              {/* Confidencialidad */}
              {activeTab==='of-conf' && (
                <div className="tab-content active" style={{ overflowY:'auto', flex:1 }}><div className="info-pad">
                  <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', border:`1px solid ${confidential?'#334155':'var(--border)'}`, borderRadius:'var(--r2)', background:confidential?'#0f172a':'var(--surface)', marginBottom:18 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:confidential?'#f8fafc':'var(--text)' }}>Oferta confidencial</div>
                      <div style={{ fontSize:11, color:confidential?'#94a3b8':'var(--text3)', marginTop:2 }}>{confidential?'Activo, dirección, documentos y condiciones ocultos para no autorizados.':'La oferta es visible para todos los usuarios con acceso al PDB.'}</div>
                    </div>
                    <button onClick={() => setConfidential(v=>!v)} style={{ padding:'6px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', background:confidential?'#f8fafc':'#1e293b', color:confidential?'#0f172a':'#f8fafc' }}>
                      {confidential?'🔓 Desactivar':'🔒 Activar'}
                    </button>
                  </div>
                  {confidential && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
                      <div style={{ border:'1px solid var(--red-bd)', background:'var(--red-lt)', borderRadius:'var(--r2)', padding:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--red)', textTransform:'uppercase', marginBottom:8 }}>❌ Oculto (no autorizados)</div>
                        {['Activo / Inmueble','Dirección y ubicación','Condiciones económicas','Documentación adjunta','Stacking plan'].map(item=>(<div key={item} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, marginBottom:4 }}><span style={{ color:'var(--red)', fontWeight:700 }}>✕</span> {item}</div>))}
                      </div>
                      <div style={{ border:'1px solid var(--green-bd)', background:'var(--green-lt)', borderRadius:'var(--r2)', padding:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--green)', textTransform:'uppercase', marginBottom:8 }}>✅ Visible (siempre)</div>
                        {['Cliente / Cuenta','Tipo de operación','Estado de la oferta','Equipo responsable','Información básica'].map(item=>(<div key={item} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, marginBottom:4 }}><span style={{ color:'var(--green)', fontWeight:700 }}>✓</span> {item}</div>))}
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase' }}>Usuarios autorizados</div>
                      <button className="ab-btn blue" onClick={() => setAddingUser(true)} style={{ fontSize:10, padding:'3px 9px' }}>+ Añadir usuario</button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {authorizedUsers.map((u,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background:u.bg, color:u.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{u.initials}</div>
                          <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>{u.name}</div><div style={{ fontSize:10, color:'var(--text3)' }}>{u.team} · {u.role}</div></div>
                          {u.owner ? <span className="tag tag-blue">Propietario</span>
                            : <><span style={{ fontSize:10, color:'var(--text4)' }}>Acceso: {u.granted}</span><button onClick={() => setAuthorizedUsers(prev=>prev.filter((_,j)=>j!==i))} style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'2px 6px', fontFamily:'inherit' }}>✕ Quitar</button></>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {addingUser && (
                    <div style={{ border:'1px solid var(--accent-bd)', background:'var(--accent-lt)', borderRadius:'var(--r2)', padding:14, marginBottom:14 }}>
                      <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Conceder acceso</div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                          <span style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase' }}>Usuario</span>
                          <select className="fsel" value={newUser} onChange={e => setNewUser(e.target.value)} style={{ minWidth:220 }}>
                            <option value="">Seleccionar...</option>
                            <option>GOMEZ Ignacio · Leasing Oficinas MAD</option>
                            <option>García Marta · Capital Markets MAD</option>
                            <option>López Carmen · Valoraciones MAD</option>
                            <option>Alonso Abruña D. · Leasing MAD</option>
                            <option>Martínez Rosa · Retail MAD</option>
                          </select>
                        </div>
                        <button className="ab-btn save" onClick={() => {
                          if(!newUser)return
                          const [nameStr,teamStr]=[newUser.split('·')[0].trim(),newUser.split('·')[1]?.trim()||'']
                          const ini=nameStr.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                          const today=new Date().toLocaleDateString('es-ES')
                          setAuthorizedUsers(prev=>[...prev,{name:nameStr,team:teamStr,role:'Autorizado',initials:ini,bg:'#f0fdf4',color:'#166534',granted:today,owner:false}])
                          setAddingUser(false);setNewUser('')
                        }}>Conceder acceso</button>
                        <button className="ab-btn" onClick={() => {setAddingUser(false);setNewUser('')}}>Cancelar</button>
                      </div>
                    </div>
                  )}
                  {confidential && (
                    <div style={{ border:'1px solid var(--amber-bd)', background:'var(--amber-lt)', borderRadius:'var(--r2)', padding:14, marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--amber)', textTransform:'uppercase', marginBottom:8 }}>DEMO — Vista de usuario no autorizado</div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
                        <span style={{ fontSize:20 }}>🔒</span>
                        <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>Oferta confidencial</div><div style={{ fontSize:11, color:'var(--text3)' }}>No tienes permisos. Puedes solicitar acceso al responsable.</div></div>
                        <button className="ab-btn save" style={{ flexShrink:0 }} onClick={() => alert('✅ Solicitud enviada a Sierra Álvaro')}>Solicitar acceso</button>
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', marginBottom:8 }}>Trazabilidad de accesos</div>
                  <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                    {[{color:'var(--green)',msg:'Sierra Álvaro creó la oferta',date:'05/04/2026 · 10:00'},{color:'var(--accent)',msg:'Sierra Álvaro activó confidencialidad',date:'07/04/2026 · 09:00'}].map((e,i,arr) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 12px', borderBottom:i<arr.length-1?'1px solid var(--border)':'none' }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:e.color, flexShrink:0, marginTop:4 }} />
                        <div><div style={{ fontSize:11 }}>{e.msg}</div><div style={{ fontSize:10, color:'var(--text4)' }}>{e.date}</div></div>
                      </div>
                    ))}
                  </div>
                </div></div>
              )}
            </>
          )}
        </div>

        {/* Right panel */}
        {!showStacking && (
          <div className="ficha-right">
            <div className="rp-sec">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div><div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', marginBottom:3 }}>Ocupación activo</div><div style={{ fontSize:20, fontWeight:700 }}>75%</div></div>
                <div><div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', marginBottom:3 }}>Otras ofertas</div><div style={{ fontSize:20, fontWeight:700 }}>2</div></div>
              </div>
            </div>
            <div className="rp-sec">
              <div className="rp-lbl">KPIs de la oferta</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Renta (€/m²/mes)</div><div style={{ fontSize:14, fontWeight:700 }}>12,50</div></div>
                <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Gastos (€/m²/mes)</div><div style={{ fontSize:14, fontWeight:700 }}>3,01</div></div>
                <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Renta mensual</div><div style={{ fontSize:12, fontWeight:700 }}>{espaciosComercializables.reduce((s,e)=>s+e.renta*e.sup,0).toLocaleString(undefined,{maximumFractionDigits:0})} €</div></div>
                <div><div style={{ fontSize:9, color:'var(--text4)', marginBottom:1 }}>Sup. disponible</div><div style={{ fontSize:12, fontWeight:700, color:'var(--amber)' }}>{supTotal.toLocaleString()} m²</div></div>
              </div>
            </div>
            <div className="rp-sec">
              <div className="rp-lbl">Asistente IA</div>
              <div className="ai-box">
                <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Insight oferta</span><span className="ai-badge">Tiempo real</span></div>
                <div className="ai-text">127 días en comercialización. Renta 12,50 €/m² <strong>por debajo del mercado A-1</strong> (13,50–14,00 €). Oracle en fase finalista.</div>
                <div className="ai-cta">✎ Preguntar a la IA</div>
              </div>
            </div>
            <div className="rp-sec">
              <div className="rp-lbl">Propietario / Mandante</div>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'#fef3c7', border:'1px solid #fde68a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#92400e' }}>BB</div>
                <div><div style={{ fontSize:11, fontWeight:600, color:'var(--accent)' }}>Baena Borja</div><div style={{ fontSize:10, color:'var(--text3)' }}>FREO Investments Spain SL</div></div>
              </div>
              <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:8, fontSize:11 }}>
                <div>📞 +34 910 888 998 · 📱 629 846 923</div>
                <div style={{ color:'var(--accent)' }}>✉ b.baena@freogroup.com</div>
              </div>
            </div>
            <div className="rp-sec">
              <div className="rp-lbl">Publicación portales</div>
              {[['🌐 Web Savills','Publicado',true],['🏠 Idealista','No publicado',false],['🏢 Mis Oficinas','No publicado',false]].map(([lbl,status,pub],i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:i<2?'1px solid var(--border)':'none' }}>
                  <span style={{ fontSize:11 }}>{lbl}</span><span style={{ fontSize:10, fontWeight:600, color:pub?'var(--green)':'var(--text4)' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showTarea && <AsignarTareaModal refTipo="Oferta" refNombre="OLBUR2315645" onClose={() => setShowTarea(false)} />}
    </div>
  )
}
