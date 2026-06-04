import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import DossierGenerator from './DossierGenerator'

const SUBTABS = [
  ['campanas',    '📣 Campañas'],
  ['posicionamiento', 'Posicionamiento'],
  ['material',    'Material y Reporting'],
  ['dossier',     'Generador de dossier'],
]

/* ── Mock data ── */
const MOCK_CAMPANAS = [
  { id:'CAM-001', nombre:'Campaña P.E Avalon Q2 2026', activo:'P.E Avalon', estado:'Activa', canal:'Email + LinkedIn', target:'Empresas tecnológicas 1.000–3.000 m²', apertura:'38%', clics:'12', respuestas:3, fecha:'01/04/2026' },
  { id:'CAM-002', nombre:'Albatros D — Finalista Oracle', activo:'Albatros Edif. D', estado:'Pausada', canal:'Email', target:'Oracle Spain SL (directo)', apertura:'100%', clics:'5', respuestas:1, fecha:'15/03/2026' },
  { id:'CAM-003', nombre:'Logístico Getafe — Lanzamiento', activo:'Park Logístico Getafe', estado:'Borrador', canal:'Email + PDF', target:'Operadores logísticos 5.000+ m²', apertura:'—', clics:'—', respuestas:0, fecha:'—' },
]

const MOCK_ACTIVOS_POS = [
  { activo:'P.E Avalon', zona:'M-30', renta_asking:10.5, renta_zona:14.2, ocupacion:78, gap:-3.7, recomendacion:'Revisar renta — por debajo de comparables', score:62 },
  { activo:'Albatros Edif. D', zona:'A-1', renta_asking:12.5, renta_zona:12.8, ocupacion:0, gap:-0.3, recomendacion:'Considerar CAPEX para mejorar amenities', score:74 },
  { activo:'Torre Glòries', zona:'22@', renta_asking:28.0, renta_zona:26.5, ocupacion:100, gap:+1.5, recomendacion:'Posición óptima — renta premium justificada', score:95 },
]

const MOCK_MATERIALES = [
  { id:'MAT-001', nombre:'Ficha comercial P.E Avalon.pdf', tipo:'Ficha PDF', activo:'P.E Avalon', fecha:'10/03/2026', u:'Sierra Alvaro', envios:8 },
  { id:'MAT-002', nombre:'Presentación Albatros D v2.pptx', tipo:'Presentación', activo:'Albatros Edif. D', fecha:'20/03/2026', u:'GOMEZ Ignacio', envios:3 },
  { id:'MAT-003', nombre:'Dossier Portfolio Merlín Q1.pdf', tipo:'Dossier', activo:'Portfolio Merlín', fecha:'01/04/2026', u:'Sierra Alvaro', envios:12 },
]

const ESTADO_COLOR = { 'Activa':'var(--green)', 'Pausada':'var(--amber)', 'Borrador':'var(--text4)', 'Completada':'var(--accent)' }
const ESTADO_TAG   = { 'Activa':'tag-green', 'Pausada':'tag-amber', 'Borrador':'tag-gray', 'Completada':'tag-blue' }
const TIPO_TAG     = { 'Ficha PDF':'tag-red', 'Presentación':'tag-blue', 'Dossier':'tag-purple', 'Informe':'tag-teal', 'Otro':'tag-gray' }

function KPI({ lbl, val, color, sub }) {
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'10px 14px',textAlign:'center'}}>
      <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{lbl}</div>
      <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:color||'var(--text1)'}}>{val}</div>
      {sub && <div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>{sub}</div>}
    </div>
  )
}

function TabCampanas({ navigate }) {
  const [campanas, setCampanas] = useState(MOCK_CAMPANAS)
  const [showNew, setShowNew]   = useState(false)
  const [newForm, setNewForm]   = useState({ nombre:'', activo:'', canal:'Email', target:'' })

  const activas   = campanas.filter(c=>c.estado==='Activa').length
  const totalResp = campanas.reduce((s,c)=>s+(parseInt(c.respuestas)||0), 0)
  const avgApert  = campanas.filter(c=>c.apertura!=='—').reduce((s,c,_,a)=>s+parseFloat(c.apertura)/a.length, 0)

  return (
    <div className="info-pad">
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
        <KPI lbl="Campañas activas"   val={activas}               color="var(--green)"/>
        <KPI lbl="Total campañas"     val={campanas.length}        color="var(--text1)"/>
        <KPI lbl="Tasa apertura media" val={`${avgApert.toFixed(0)}%`} color="var(--accent)"/>
        <KPI lbl="Respuestas totales" val={totalResp}             color="var(--purple)"/>
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:700}}>📣 Campañas</div>
        <button className="ab-btn blue" style={{padding:'4px 12px',fontSize:10}} onClick={()=>setShowNew(v=>!v)}>+ Nueva campaña</button>
      </div>

      {showNew && (
        <div style={{background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:12,marginBottom:12,display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
          {[['Nombre',  'nombre',  'text'],['Activo', 'activo', 'text'],['Target', 'target', 'text']].map(([lbl,key])=>(
            <div key={key} style={{display:'flex',flexDirection:'column',gap:3,flex:1,minWidth:160}}>
              <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>{lbl}</span>
              <input className="of-inp" style={{fontSize:11}} value={newForm[key]} onChange={e=>setNewForm(p=>({...p,[key]:e.target.value}))} placeholder={lbl}/>
            </div>
          ))}
          <div style={{display:'flex',flexDirection:'column',gap:3}}>
            <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Canal</span>
            <select className="of-sel" style={{fontSize:11}} value={newForm.canal} onChange={e=>setNewForm(p=>({...p,canal:e.target.value}))}>
              {['Email','LinkedIn','Email + LinkedIn','Email + PDF'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <button className="ab-btn blue" style={{padding:'4px 12px',fontSize:10}} onClick={()=>{
            if(!newForm.nombre) return
            const d = new Date()
            setCampanas(prev=>[...prev,{
              id:`CAM-${String(prev.length+1).padStart(3,'0')}`,
              nombre:newForm.nombre, activo:newForm.activo||'—', estado:'Borrador',
              canal:newForm.canal, target:newForm.target||'—',
              apertura:'—', clics:'—', respuestas:0,
              fecha:`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`,
            }])
            setNewForm({nombre:'',activo:'',canal:'Email',target:''})
            setShowNew(false)
          }}>Guardar</button>
          <button className="ab-btn" style={{padding:'4px 12px',fontSize:10}} onClick={()=>setShowNew(false)}>Cancelar</button>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {campanas.map(c=>(
          <div key={c.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'12px 14px',cursor:'pointer',transition:'border-color .15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:700}}>{c.nombre}</span>
                  <span className={`tag ${ESTADO_TAG[c.estado]||'tag-gray'}`} style={{fontSize:9}}>{c.estado}</span>
                </div>
                <div style={{fontSize:10,color:'var(--text3)'}}>{c.activo} · 📡 {c.canal} · {c.target}</div>
              </div>
              <div style={{fontSize:10,color:'var(--text4)',flexShrink:0}}>{c.fecha}</div>
            </div>
            <div style={{display:'flex',gap:16}}>
              {[
                {lbl:'Apertura',   val:c.apertura,   color:c.apertura!=='—'&&parseFloat(c.apertura)>30?'var(--green)':'var(--amber)'},
                {lbl:'Clics',      val:c.clics,      color:'var(--accent)'},
                {lbl:'Respuestas', val:c.respuestas, color:'var(--purple)'},
              ].map(m=>(
                <div key={m.lbl} style={{display:'flex',alignItems:'baseline',gap:4}}>
                  <span style={{fontSize:14,fontWeight:800,fontFamily:'var(--mono)',color:m.val!=='—'?m.color:'var(--text4)'}}>{m.val}</span>
                  <span style={{fontSize:9,color:'var(--text4)'}}>{m.lbl}</span>
                </div>
              ))}
              {c.estado==='Activa' && (
                <div style={{marginLeft:'auto',display:'flex',gap:5}}>
                  <button className="ab-btn" style={{padding:'2px 8px',fontSize:9}}>⏸ Pausar</button>
                  <button className="ab-btn blue" style={{padding:'2px 8px',fontSize:9}}>✉ Enviar</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabPosicionamiento() {
  return (
    <div className="info-pad">
      <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Posicionamiento de Activos vs. Comparables</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {MOCK_ACTIVOS_POS.map(a=>{
          const scoreColor = a.score>=80?'var(--green)':a.score>=60?'var(--amber)':'var(--red)'
          return (
            <div key={a.activo} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'12px 14px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:10}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{a.activo}</div>
                  <div style={{fontSize:10,color:'var(--text3)'}}>Zona: {a.zona} · Ocupación: {a.ocupacion}%</div>
                </div>
                <div style={{textAlign:'center',flexShrink:0}}>
                  <div style={{fontSize:9,color:'var(--text4)',textTransform:'uppercase',marginBottom:2}}>Score</div>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--mono)',color:scoreColor}}>{a.score}</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:10}}>
                <div style={{background:'var(--gray-lt)',borderRadius:'var(--r)',padding:'7px 10px',textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text4)',marginBottom:2}}>Renta asking</div>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:'var(--accent)'}}>{a.renta_asking} €/m²</div>
                </div>
                <div style={{background:'var(--gray-lt)',borderRadius:'var(--r)',padding:'7px 10px',textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text4)',marginBottom:2}}>Media zona</div>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:'var(--text1)'}}>{a.renta_zona} €/m²</div>
                </div>
                <div style={{background:a.gap>=0?'#f0fdf4':'#fef2f2',border:`1px solid ${a.gap>=0?'#bbf7d0':'#fca5a5'}`,borderRadius:'var(--r)',padding:'7px 10px',textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text4)',marginBottom:2}}>Gap vs zona</div>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:a.gap>=0?'var(--green)':'var(--red)'}}>{a.gap>=0?'+':''}{a.gap} €/m²</div>
                </div>
              </div>
              <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'var(--r)',padding:'7px 10px',fontSize:11,color:'#92400e'}}>
                💡 {a.recomendacion}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TabMaterial() {
  const [materiales, setMateriales] = useState(MOCK_MATERIALES)
  const [showNew, setShowNew]       = useState(false)
  const [newNom, setNewNom]         = useState('')
  const [newTipo, setNewTipo]       = useState('Ficha PDF')
  const [newActivo, setNewActivo]   = useState('')

  const totalEnvios = materiales.reduce((s,m)=>s+m.envios, 0)

  return (
    <div className="info-pad">
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
        <KPI lbl="Materiales totales" val={materiales.length} color="var(--accent)"/>
        <KPI lbl="Envíos totales"     val={totalEnvios}       color="var(--teal)"/>
        <KPI lbl="Conversión estimada" val="18%"              color="var(--green)" sub="Demanda generada vs. envíos"/>
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:700}}>Biblioteca de materiales</div>
        <button className="ab-btn blue" style={{padding:'4px 12px',fontSize:10}} onClick={()=>setShowNew(v=>!v)}>+ Añadir material</button>
      </div>

      {showNew && (
        <div style={{background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:12,marginBottom:12,display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{display:'flex',flexDirection:'column',gap:3,flex:2,minWidth:180}}>
            <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Nombre</span>
            <input className="of-inp" style={{fontSize:11}} value={newNom} onChange={e=>setNewNom(e.target.value)} placeholder="Nombre del archivo"/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:3,flex:1,minWidth:120}}>
            <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Activo</span>
            <input className="of-inp" style={{fontSize:11}} value={newActivo} onChange={e=>setNewActivo(e.target.value)} placeholder="Activo asociado"/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:3}}>
            <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Tipo</span>
            <select className="of-sel" style={{fontSize:11}} value={newTipo} onChange={e=>setNewTipo(e.target.value)}>
              {['Ficha PDF','Presentación','Dossier','Informe','Otro'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <button className="ab-btn blue" style={{padding:'4px 12px',fontSize:10}} onClick={()=>{
            if(!newNom) return
            const d = new Date()
            setMateriales(prev=>[...prev,{
              id:`MAT-${String(prev.length+1).padStart(3,'0')}`,
              nombre:newNom, tipo:newTipo, activo:newActivo||'—',
              fecha:`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`,
              u:'Sierra Alvaro', envios:0,
            }])
            setNewNom(''); setNewActivo(''); setShowNew(false)
          }}>Guardar</button>
          <button className="ab-btn" style={{padding:'4px 12px',fontSize:10}} onClick={()=>setShowNew(false)}>Cancelar</button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
        {materiales.map(m=>(
          <div key={m.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'10px 12px',cursor:'pointer',transition:'border-color .15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
              <div style={{fontSize:22,flexShrink:0}}>📄</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.nombre}</div>
                <div style={{display:'flex',gap:5,marginTop:4,flexWrap:'wrap',alignItems:'center'}}>
                  <span className={`tag ${TIPO_TAG[m.tipo]||'tag-gray'}`} style={{fontSize:9}}>{m.tipo}</span>
                  <span style={{fontSize:9,color:'var(--text4)'}}>{m.activo}</span>
                  <span style={{fontSize:9,color:'var(--text4)'}}>{m.fecha}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:5}}>
                  <span style={{fontSize:10,color:'var(--text3)'}}>{m.u}</span>
                  <span style={{fontSize:9,fontWeight:700,color:'var(--teal)',fontFamily:'var(--mono)'}}>{m.envios} envíos</span>
                </div>
              </div>
              <button onClick={()=>setMateriales(prev=>prev.filter(x=>x.id!==m.id))}
                style={{background:'none',border:'none',cursor:'pointer',color:'var(--text4)',fontSize:12,padding:'0 2px',flexShrink:0}}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Reporting resumen */}
      <div style={{marginTop:16,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
        <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>Reporting de actividad</div>
        <div style={{padding:'12px 14px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[
            {lbl:'Nº campañas Q2 2026',val:'3',color:'var(--accent)'},
            {lbl:'Interacciones generadas',val:'32',color:'var(--teal)'},
            {lbl:'Demandas generadas',val:'4',color:'var(--green)'},
            {lbl:'Visitas originadas',val:'2',color:'var(--purple)'},
          ].map(k=>(
            <div key={k.lbl} style={{textAlign:'center'}}>
              <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{k.lbl}</div>
              <div style={{fontSize:20,fontWeight:800,fontFamily:'var(--mono)',color:k.color}}>{k.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MarketingView() {
  const { navigate } = useNav()
  const [subtab, setSubtab] = useState('campanas')

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>

      {/* Header */}
      <div style={{padding:'10px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <div className="ah-ico" style={{background:'linear-gradient(135deg,#be185d,#ec4899)',fontSize:18,width:38,height:38,borderRadius:'var(--r)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>📣</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700}}>Marketing</div>
          <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>Campañas · Posicionamiento de activos · Material y reporting comercial</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="tabs" style={{flexShrink:0}}>
        {SUBTABS.map(([k,l])=>(
          <div key={k} className={`tab ${subtab===k?'active':''}`} onClick={()=>setSubtab(k)}>{l}</div>
        ))}
      </div>

      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',minHeight:0}}>
        {subtab==='campanas'        && <TabCampanas navigate={navigate}/>}
        {subtab==='posicionamiento' && <TabPosicionamiento/>}
        {subtab==='material'        && <TabMaterial/>}
        {subtab==='dossier'         && <DossierGenerator/>}
      </div>
    </div>
  )
}
