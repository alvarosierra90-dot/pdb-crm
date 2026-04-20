import { useState, useEffect, useRef, memo, useCallback } from 'react'

export const USOS_PPAL = [
  {id:'oficinas',    label:'Oficinas',    cls:'u-of',  color:'#3b82f6', bg:'#dbeafe', bd:'#93c5fd'},
  {id:'retail',      label:'Retail',      cls:'u-rt',  color:'#ec4899', bg:'#fce7f3', bd:'#fbcfe8'},
  {id:'logistico',   label:'Logístico',   cls:'u-log', color:'#f97316', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'residencial', label:'Residencial', cls:'u-res', color:'#8b5cf6', bg:'#ede9fe', bd:'#c4b5fd'},
  {id:'hotel',       label:'Hotel',       cls:'u-hot', color:'#14b8a6', bg:'#ccfbf1', bd:'#99f6e4'},
  {id:'comun',       label:'Zona común',  cls:'u-com', color:'#22c55e', bg:'#dcfce7', bd:'#86efac'},
  {id:'parking',     label:'Parking',     cls:'u-pk',  color:'#94a3b8', bg:'#f1f5f9', bd:'#cbd5e1'},
]

export const UA_ALL = [
  {id:'recepcion',      label:'Recepción',          attr:true, color:'#7c3aed', bg:'#ede9fe', bd:'#c4b5fd'},
  {id:'nucleo_com',     label:'Núcleos comunic.',   attr:true, color:'#6366f1', bg:'#e0e7ff', bd:'#a5b4fc'},
  {id:'instalaciones',  label:'Instalaciones',      attr:true, color:'#64748b', bg:'#f1f5f9', bd:'#cbd5e1'},
  {id:'seguridad',      label:'Seguridad 24h',      attr:true, color:'#dc2626', bg:'#fee2e2', bd:'#fca5a5'},
  {id:'ct',             label:'C. Transformación',  attr:true, color:'#9ca3af', bg:'#f9fafb', bd:'#e5e7eb'},
  {id:'parking_gen',    label:'Parking',             sup:true,  color:'#475569', bg:'#f1f5f9', bd:'#94a3b8'},
  {id:'trasteros',      label:'Trasteros',           sup:true,  color:'#78716c', bg:'#fafaf9', bd:'#d6d3d1'},
  {id:'archivo',        label:'Archivo / Almacén',  sup:true,  color:'#92400e', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'vestuarios',     label:'Vestuarios',          sup:true,  color:'#9d174d', bg:'#fdf2f8', bd:'#f9a8d4'},
  {id:'comedor',        label:'Comedor',             sup:true,  color:'#d97706', bg:'#fffbeb', bd:'#fde68a'},
  {id:'auditorio',      label:'Auditorio',           sup:true,  color:'#7c3aed', bg:'#ede9fe', bd:'#c4b5fd'},
  {id:'salas_reunion',  label:'Salas reuniones',     sup:true,  color:'#0284c7', bg:'#e0f2fe', bd:'#7dd3fc'},
  {id:'gimnasio',       label:'Gimnasio',            sup:true,  color:'#059669', bg:'#ecfdf5', bd:'#6ee7b7'},
  {id:'terraza',        label:'Terraza / Jardín',    sup:true,  color:'#65a30d', bg:'#f7fee7', bd:'#bef264'},
  {id:'rooftop',        label:'Rooftop',             attr:true, color:'#0d9488', bg:'#f0fdfa', bd:'#99f6e4'},
  {id:'piscina',        label:'Piscina',             sup:true,  color:'#0891b2', bg:'#ecfeff', bd:'#67e8f9'},
  {id:'playa_maniobras',label:'Playa maniobras',     sup:true,  color:'#c2410c', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'muelles_carga',  label:'Muelles de carga',    sup:true,  color:'#b45309', bg:'#fefce8', bd:'#fde68a'},
  {id:'cross_docking',  label:'Cross-docking',       sup:true,  color:'#7c2d12', bg:'#fff1f2', bd:'#fecdd3'},
  {id:'camaras_frigo',  label:'Cámaras frigoríficas',sup:true,  color:'#1d4ed8', bg:'#eff6ff', bd:'#bfdbfe'},
  {id:'pk_camiones',    label:'Parking camiones',    sup:true,  color:'#374151', bg:'#f9fafb', bd:'#e5e7eb'},
  {id:'lobby',          label:'Lobby hotel',         sup:true,  color:'#b45309', bg:'#fffbeb', bd:'#fde68a'},
  {id:'spa',            label:'Spa / Wellness',      sup:true,  color:'#be185d', bg:'#fdf2f8', bd:'#fbcfe8'},
  {id:'salas_eventos',  label:'Salas de eventos',    sup:true,  color:'#6d28d9', bg:'#f5f3ff', bd:'#ddd6fe'},
  {id:'restaurante',    label:'Restaurante',         sup:true,  color:'#c2410c', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'salon_comun',    label:'Salón comunidad',     sup:true,  color:'#047857', bg:'#ecfdf5', bd:'#a7f3d0'},
]

export const UA_BY_USO = {
  oficinas:    ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','archivo','vestuarios','comedor','auditorio','salas_reunion','gimnasio','terraza','rooftop'],
  retail:      ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','vestuarios'],
  logistico:   ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','archivo','vestuarios','comedor','playa_maniobras','muelles_carga','cross_docking','camaras_frigo','pk_camiones'],
  residencial: ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','vestuarios','comedor','gimnasio','terraza','rooftop','piscina','salon_comun'],
  hotel:       ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','vestuarios','comedor','gimnasio','terraza','rooftop','piscina','lobby','spa','salas_eventos','restaurante'],
  comun:       ['recepcion','nucleo_com','instalaciones','seguridad','ct'],
  parking:     ['nucleo_com','instalaciones','seguridad','ct'],
}

export const INIT_BUILDINGS = [
  {
    id:'A', label:'P.E Avalon — Edif. A', supPlantaTipo:1500,
    floors:[
      {id:'P5',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'P4',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'P3',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'P2',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'P1',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'PB',sup:1500,principal:[{uso:'retail',sup:380},{uso:'comun',sup:1120}],adicional:[]},
      {id:'S1',sup:1500,principal:[{uso:'parking',sup:1500}],adicional:[{uso:'parking_gen',label:'Parking · 778 plazas',sup:1500,attr:false}]},
      {id:'S2',sup:1500,principal:[{uso:'parking',sup:1500}],adicional:[{uso:'parking_gen',label:'Parking · 52 plazas',sup:1500,attr:false}]},
    ],
    prop:[
      {p:'P5',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'P4',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'P3',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'P2',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'P1',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'PB',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'S1',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'S2',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
    ],
    arr:[
      {p:'P5',sup:1500,units:[{type:'ten',n:'Celonis',sup:1202,brk:'Oct 2025',brkColor:'var(--amber)'},{type:'vac',oferta:null,sup:298}]},
      {p:'P4',sup:1500,units:[{type:'ten',n:'Celonis',sup:1500,brk:'Oct 2025',brkColor:'var(--amber)'}]},
      {p:'P3',sup:1500,units:[{type:'ten',n:'Repsol',sup:767,brk:'Jun 2027',brkColor:'var(--green)'},{type:'vac',oferta:null,sup:733}]},
      {p:'P2',sup:1500,units:[{type:'ten',n:'Repsol',sup:1200,brk:'Jun 2027',brkColor:'var(--green)'},{type:'vac',oferta:null,sup:300}]},
      {p:'P1',sup:1500,units:[{type:'ten',n:'Desconocido',sup:1500,brk:'Ene 2026',brkColor:'var(--red)'}]},
      {p:'PB',sup:1500,units:[{type:'rt',n:'Cafetería',sup:380,brk:'Ene 2029',brkColor:'var(--text4)'},{type:'com',n:'Hall / Común',sup:220},{type:'vac',oferta:null,sup:900}]},
      {p:'S1',sup:1500,units:[{type:'pk',n:'Parking · 778 plazas',sup:1500,nota:'Nivel -1'}]},
      {p:'S2',sup:1500,units:[{type:'pk',n:'Parking · 52 plazas',sup:1500,nota:'Nivel -2'}]},
    ],
  },
  {
    id:'B', label:'Edif. B', supPlantaTipo:1500,
    floors:[
      {id:'P5',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'P4',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
      {id:'PB',sup:1500,principal:[{uso:'comun',sup:250},{uso:'oficinas',sup:1250}],adicional:[]},
    ],
    prop:[
      {p:'P5',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'P4',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
      {p:'PB',sup:1500,units:[{n:'Barings Core Spain SOCIMI',sup:1500}]},
    ],
    arr:[
      {p:'P5',sup:1500,units:[{type:'ten',n:'Oficinas',sup:1500,brk:null}]},
      {p:'P4',sup:1500,units:[{type:'ten',n:'Celonis',sup:1300,brk:'Oct 2025',brkColor:'var(--amber)'},{type:'vac',oferta:null,sup:200}]},
      {p:'PB',sup:1500,units:[{type:'com',n:'Cafetería',sup:250},{type:'vac',oferta:null,sup:1250}]},
    ],
  },
  {
    id:'C', label:'Edif. C', supPlantaTipo:1967,
    floors:[
      {id:'P4',sup:1967,principal:[{uso:'oficinas',sup:1967}],adicional:[]},
      {id:'PB',sup:1967,principal:[{uso:'oficinas',sup:1967}],adicional:[]},
    ],
    prop:[
      {p:'P4',sup:1967,units:[{n:'Barings Core Spain SOCIMI',sup:1967}]},
      {p:'PB',sup:1967,units:[{n:'Barings Core Spain SOCIMI',sup:1967}]},
    ],
    arr:[
      {p:'P4',sup:1967,units:[{type:'ten',n:'Repsol',sup:1967,brk:'Jun 2027',brkColor:'var(--green)'}]},
      {p:'PB',sup:1967,units:[{type:'vac',oferta:null,sup:1967}]},
    ],
  },
  {
    id:'D', label:'Edif. D', supPlantaTipo:2000,
    floors:[
      {id:'P3',sup:2000,principal:[{uso:'oficinas',sup:2000}],adicional:[]},
      {id:'PB',sup:2000,principal:[{uso:'oficinas',sup:2000}],adicional:[]},
    ],
    prop:[
      {p:'P3',sup:2000,units:[{n:'Barings Core Spain SOCIMI',sup:2000}]},
      {p:'PB',sup:2000,units:[{n:'Barings Core Spain SOCIMI',sup:2000}]},
    ],
    arr:[
      {p:'P3',sup:2000,units:[{type:'ten',n:'Oficinas',sup:2000,brk:null}]},
      {p:'PB',sup:2000,units:[{type:'vac',oferta:null,sup:2000}]},
    ],
  },
]

// ── Formulario inicial (buildings vacío) ── memo para evitar pérdida de foco
const SetupForm = memo(function SetupForm({ form, onChange, onCreate }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 24px',gap:20}}>
      <div style={{fontSize:32}}>🏗</div>
      <div style={{fontSize:14,fontWeight:600,color:'var(--text1)'}}>Configura el stacking plan</div>
      <div style={{fontSize:12,color:'var(--text3)',marginTop:-10,textAlign:'center'}}>Define la estructura del edificio para empezar a asignar plantas y usos</div>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:24,width:'100%',maxWidth:440,display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Nombre del edificio</span>
          <input style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}} placeholder="Edificio A" value={form.label} onChange={e=>onChange('label',e.target.value)}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Uso principal (predeterminado en todas las plantas)</span>
          <select value={form.uso} onChange={e=>onChange('uso',e.target.value)} style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}}>
            <option value="">Sin asignar (arrastra después)</option>
            {USOS_PPAL.map(u=><option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Plantas SR</span>
            <input type="number" min="1" max="100" style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}} value={form.sobre} onChange={e=>onChange('sobre',e.target.value)}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Sótanos BR</span>
            <input type="number" min="0" max="20" style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}} value={form.bajo} onChange={e=>onChange('bajo',e.target.value)}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Sup. tipo (m²)</span>
            <input type="number" min="100" style={{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)'}} value={form.sup} onChange={e=>onChange('sup',e.target.value)}/>
          </div>
        </div>
        <button onClick={onCreate} style={{marginTop:4,padding:'9px 0',background:'var(--accent)',color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>Crear estructura</button>
      </div>
    </div>
  )
})

// ── Formulario añadir edificio (en tabs) ── memo para evitar pérdida de foco
const NewBldgForm = memo(function NewBldgForm({ form, onChange, onCreate, onCancel }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'6px 6px 0 0',flexWrap:'wrap'}}>
      <input placeholder="Nombre edificio" value={form.label} onChange={e=>onChange('label',e.target.value)}
        style={{width:120,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
      <select value={form.uso} onChange={e=>onChange('uso',e.target.value)}
        style={{width:110,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit',background:'#fff'}}>
        <option value="">Sin uso</option>
        {USOS_PPAL.map(u=><option key={u.id} value={u.id}>{u.label}</option>)}
      </select>
      <input placeholder="m² planta tipo" type="number" value={form.sup} onChange={e=>onChange('sup',e.target.value)}
        style={{width:90,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
      <input placeholder="Plantas SR" type="number" value={form.sobre} onChange={e=>onChange('sobre',e.target.value)}
        style={{width:76,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
      <input placeholder="Sótanos BR" type="number" value={form.bajo} onChange={e=>onChange('bajo',e.target.value)}
        style={{width:76,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
      <button onClick={onCreate} style={{padding:'4px 10px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:4,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Crear</button>
      <button onClick={onCancel} style={{padding:'4px 8px',background:'none',border:'none',cursor:'pointer',fontSize:12,color:'var(--text3)',fontFamily:'inherit'}}>✕</button>
    </div>
  )
})

export default function StackingPlan({ initBuildings, onCountChange, onOwnersChange, onBuildingsChange, activoPropietario='', extraOwners=[], extraTenants=[], onAddOwner, onAddTenant, extraOfertas=[], initView='principal', defaultSupPlantaTipo, defaultLabel='' }) {
  const [buildings, setBuildings]       = useState(initBuildings ?? [])
  const [edifId, setEdifId]             = useState(initBuildings?.length > 0 ? initBuildings[0].id : 'A')
  const [setupForm, setSetupForm]       = useState({ label: defaultLabel, sobre:'5', bajo:'1', sup: defaultSupPlantaTipo ? String(defaultSupPlantaTipo) : '1500', uso:'' })
  const setupFormRef = useRef(setupForm)
  setupFormRef.current = setupForm
  const [view, setView]                 = useState(initView)
  const [dragging, setDragging]         = useState(null)
  const [dragTarget, setDragTarget]     = useState(null)
  const [editFloor, setEditFloor]       = useState(null)
  const [editSup, setEditSup]           = useState('')
  const [selectedFloors, setSelectedFloors] = useState([])
  const [showCreate, setShowCreate]     = useState(false)
  const [newBldg, setNewBldg]           = useState({label:'',sup:'',sobre:'',bajo:'',uso:''})

  const handleSetupChange   = useCallback((k,v) => setSetupForm(p=>({...p,[k]:v})), [])
  const handleNewBldgChange = useCallback((k,v) => setNewBldg(p=>({...p,[k]:v})), [])
  const [splitModal, setSplitModal]     = useState(null)
  const [splitSup, setSplitSup]         = useState('')
  const [ppOpen, setPpOpen]             = useState(true)
  const [uaOpen, setUaOpen]             = useState(true)
  const [editPA, setEditPA]             = useState(null)
  const [editPASup, setEditPASup]       = useState('')
  const [editPARenta, setEditPARenta]   = useState('')
  const [editFloorSup, setEditFloorSup]       = useState(null)
  const [editFloorSupVal, setEditFloorSupVal] = useState('')

  useEffect(() => { if (onCountChange) onCountChange(buildings.length) }, [buildings.length])
  useEffect(() => {
    if (!onOwnersChange) return
    const names = new Set(buildings.flatMap(b=>(b.prop||[]).flatMap(r=>r.units.map(u=>u.n))))
    onOwnersChange(names.size)
  }, [buildings])
  useEffect(() => { if (onBuildingsChange) onBuildingsChange(buildings) }, [buildings])

  const edif = buildings.find(b=>b.id===edifId) || buildings[0] || { id:'', label:'', floors:[], prop:[], arr:[], supPlantaTipo:0 }
  const usoInfo  = (id) => USOS_PPAL.find(u=>u.id===id) || UA_ALL.find(u=>u.id===id) || {label:id,color:'#94a3b8',bg:'#f1f5f9',bd:'#cbd5e1'}
  const uaInfo   = (id) => UA_ALL.find(u=>u.id===id)   || {label:id,color:'#64748b',bg:'#f1f5f9',bd:'#cbd5e1',attr:false}

  const totalSup    = edif.floors.reduce((s,f)=>s+f.sup,0)
  const assignedSup = edif.floors.reduce((s,f)=>s+f.principal.reduce((ss,u)=>ss+u.sup,0),0)
  const occPct      = totalSup>0 ? Math.round(assignedSup/totalSup*100) : 0

  const primaryUsos   = [...new Set(edif.floors.flatMap(f=>f.principal.map(p=>p.uso)))]
  const availableUA   = UA_ALL.filter(ua=>primaryUsos.some(u=>(UA_BY_USO[u]||[]).includes(ua.id)))

  const updBuilding = (fn) => setBuildings(prev=>prev.map(b=>b.id===edifId?fn(b):b))

  const assignPrincipal = (floorId, usoId, supVal) => {
    updBuilding(b=>({...b, floors:b.floors.map(f=>{
      if(f.id!==floorId) return f
      const used = f.principal.reduce((s,u)=>s+u.sup,0)
      const avail = f.sup-used
      if(avail<=0) return f
      const sup = Math.min(supVal||avail, avail)
      return {...f, principal:[...f.principal,{uso:usoId,sup}]}
    })}))
  }

  const assignAdicional = (floorId, usoId) => {
    const ua = UA_ALL.find(u=>u.id===usoId)
    if(!ua) return
    updBuilding(b=>({...b, floors:b.floors.map(f=>{
      if(f.id!==floorId) return f
      if(f.adicional.find(a=>a.uso===usoId)) return f
      return {...f, adicional:[...f.adicional,{uso:usoId,label:ua.label,sup:ua.sup?100:0,attr:ua.attr||false}]}
    })}))
  }

  const removeItem = (floorId, idx, layer) => {
    updBuilding(b=>({...b, floors:b.floors.map(f=>{
      if(f.id!==floorId) return f
      const arr=[...f[layer]]; arr.splice(idx,1)
      return {...f,[layer]:arr}
    })}))
  }

  const removePropUnit = (floorId, idx) => {
    updBuilding(b=>({...b, prop:(b.prop||[]).map(r=>r.p!==floorId?r:{...r,units:r.units.filter((_,i)=>i!==idx)})}))
  }
  const removeArrUnit = (floorId, idx) => {
    updBuilding(b=>({...b, arr:(b.arr||[]).map(r=>r.p!==floorId?r:{...r,units:r.units.filter((_,i)=>i!==idx)})}))
  }

  const savePASup = () => {
    if(!editPA) return
    const val = parseFloat(editPASup)
    if(isNaN(val)||val<=0) return
    const renta = parseFloat(editPARenta)
    updBuilding(b=>({...b, [editPA.layer]: b[editPA.layer].map(row=>{
      if(row.p!==editPA.rowP) return row
      const units=[...row.units]
      const upd = {...units[editPA.idx], sup:val}
      if(!isNaN(renta) && renta>=0) upd.renta = renta
      units[editPA.idx] = upd
      return {...row, units}
    })}))
    setEditPA(null); setEditPASup('')
  }

  const saveFloorSup = () => {
    if(!editFloorSup) return
    const val = parseFloat(editFloorSupVal)
    if(isNaN(val)||val<=0) return
    updBuilding(b=>({...b,
      floors: b.floors.map(f=>f.id===editFloorSup?{...f,sup:val}:f),
      prop:   (b.prop||[]).map(r=>r.p===editFloorSup?{...r,sup:val}:r),
      arr:    (b.arr||[]).map(r=>r.p===editFloorSup?{...r,sup:val}:r),
    }))
    setEditFloorSup(null); setEditFloorSupVal('')
  }

  const saveSup = () => {
    if(!editFloor) return
    const val = parseFloat(editSup)
    if(isNaN(val)||val<=0) return
    updBuilding(b=>({...b, floors:b.floors.map(f=>{
      if(f.id!==editFloor.floorId) return f
      const arr=[...f[editFloor.layer]]
      arr[editFloor.idx]={...arr[editFloor.idx],sup:val}
      return {...f,[editFloor.layer]:arr}
    })}))
    setEditFloor(null); setEditSup('')
  }

  const bulkAssign = (usoId) => {
    // Aplicar a todas las plantas seleccionadas en una sola actualización
    setBuildings(prev => prev.map(b => {
      if(b.id !== edifId) return b
      const newFloors = b.floors.map(f => {
        if(!selectedFloors.includes(f.id)) return f
        const avail = f.sup - f.principal.reduce((s,u)=>s+u.sup,0)
        if(avail <= 0) return f
        return {...f, principal:[...f.principal,{uso:usoId,sup:avail}]}
      })
      return {...b, floors:newFloors}
    }))
    setSelectedFloors([])
  }

  const createBuilding = () => {
    const sobre=parseInt(newBldg.sobre)||0, bajo=parseInt(newBldg.bajo)||0
    const sup=parseFloat(newBldg.sup)||1500
    const uso=newBldg.uso
    const mkFloor = (id) => ({id,sup,principal:uso?[{uso,sup}]:[],adicional:[]})
    const floors=[]
    for(let i=sobre;i>=1;i--) floors.push(mkFloor(`P${i}`))
    floors.push(mkFloor('PB'))
    for(let i=1;i<=bajo;i++) floors.push(mkFloor(`S${i}`))
    const newId=String.fromCharCode(65+buildings.length)
    setBuildings(prev=>[...prev,{id:newId,label:newBldg.label||`Edif. ${newId}`,supPlantaTipo:sup,floors,prop:[],arr:[]}])
    setEdifId(newId); setShowCreate(false); setView('principal')
    setNewBldg({label:'',sup:'',sobre:'',bajo:'',uso:''})
  }

  const onDragOver  = (e,fId)=>{e.preventDefault();setDragTarget(fId)}
  const onDrop = (e, floor, layer) => {
    e.preventDefault(); setDragTarget(null)
    if(!dragging) return
    const isUA = !!UA_ALL.find(u=>u.id===dragging)
    const used=floor.principal.reduce((s,u)=>s+u.sup,0)
    const avail=floor.sup-used
    if(layer==='adicional' || (isUA && avail<=0)) { assignAdicional(floor.id, dragging); setDragging(null); return }
    if(avail<=0) { setSplitModal({floorId:floor.id,usoId:dragging}); setSplitSup('') }
    else { assignPrincipal(floor.id,dragging,avail) }
    setDragging(null)
  }

  const fTab = (id) => ({
    padding:'5px 14px',borderRadius:'6px 6px 0 0',fontSize:11,fontWeight:edifId===id?600:500,
    cursor:'pointer',border:'1px solid',fontFamily:'inherit',transition:'all .15s',
    borderColor:edifId===id?'var(--accent)':'var(--border)',
    borderBottom:edifId===id?'2px solid var(--surface)':'1px solid transparent',
    background:edifId===id?'var(--accent)':'var(--surface)',
    color:edifId===id?'#fff':'var(--text2)',
  })
  const vTab = (k) => ({
    padding:'7px 14px',fontSize:11,fontWeight:view===k?600:500,cursor:'pointer',
    border:'none',borderBottom:view===k?'2px solid var(--accent)':'2px solid transparent',
    background:'var(--surface)',color:view===k?'var(--accent)':'var(--text3)',fontFamily:'inherit',
  })

  const createFirstBuilding = useCallback(() => {
    const form  = setupFormRef.current
    const label = form.label.trim() || 'Edificio A'
    const sobre = Math.max(1, parseInt(form.sobre) || 1)
    const bajo  = Math.max(0, parseInt(form.bajo)  || 0)
    const sup   = Math.max(100, parseFloat(form.sup) || 1000)
    const uso   = form.uso
    const mkFloor = (id) => ({id, sup, principal: uso ? [{uso, sup}] : [], adicional: []})
    const floors = []
    for (let i = sobre; i >= 1; i--) floors.push(mkFloor(`P${i}`))
    floors.push(mkFloor('PB'))
    for (let i = 1; i <= bajo; i++) floors.push(mkFloor(`S${i}`))
    const id = 'A'
    setBuildings([{ id, label, supPlantaTipo: sup, floors, prop: floors.map(f=>({p:f.id,sup,units:[]})), arr: floors.map(f=>({p:f.id,sup,units:[]})) }])
    setEdifId(id)
  }, [])

  if (buildings.length === 0) return (
    <SetupForm form={setupForm} onChange={handleSetupChange} onCreate={createFirstBuilding} />
  )

  return (
    <div>
      {/* Edificio tabs */}
      <div style={{display:'flex',gap:6,borderBottom:'1px solid var(--border)',background:'var(--gray-lt)',marginLeft:-24,marginRight:-24,paddingLeft:24,paddingTop:6,flexWrap:'wrap'}}>
        {buildings.map(b=>(
          <button key={b.id} onClick={()=>{setEdifId(b.id);setSelectedFloors([])}} style={fTab(b.id)}>{b.label}</button>
        ))}
        {showCreate ? (
          <NewBldgForm form={newBldg} onChange={handleNewBldgChange} onCreate={createBuilding} onCancel={()=>setShowCreate(false)} />
        ) : (
          <button onClick={()=>setShowCreate(true)} style={{padding:'5px 14px',borderRadius:'6px 6px 0 0',fontSize:11,cursor:'pointer',border:'1px dashed var(--accent-bd)',borderBottom:'1px solid transparent',background:'var(--accent-lt)',color:'var(--accent)',fontFamily:'inherit'}}>+ Añadir edificio</button>
        )}
      </div>

      {/* Vista sub-tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',marginLeft:-24,marginRight:-24,paddingLeft:24}}>
        {[['principal','Uso principal'],['prop','Propietarios'],['arr','Arrendatarios y oferta']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={vTab(k)}>{l}</button>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:1,background:'var(--border)',marginLeft:-24,marginRight:-24,marginBottom:12}}>
        {[
          {lbl:'SBA TOTAL',   val:`${totalSup.toLocaleString('es-ES')} m²`,    sub:'Superficie bruta alquilable', col:'var(--text1)'},
          {lbl:'ASIGNADO',    val:`${assignedSup.toLocaleString('es-ES')} m²`, sub:'Uso principal definido',       col:occPct===100?'var(--green)':'var(--accent)'},
          {lbl:'SIN ASIGNAR', val:`${(totalSup-assignedSup).toLocaleString('es-ES')} m²`, sub:'Pendiente de definir', col:(totalSup-assignedSup)===0?'var(--green)':'var(--amber)'},
          {lbl:'COBERTURA',   val:`${occPct}%`,                                sub:'Usos definidos sobre total',   col:occPct===100?'var(--green)':occPct>50?'var(--amber)':'var(--red)'},
        ].map(s=>(
          <div key={s.lbl} style={{background:'var(--surface)',padding:'9px 14px'}}>
            <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>{s.lbl}</div>
            <div style={{fontSize:16,fontWeight:700,color:s.col,fontFamily:'var(--mono)'}}>{s.val}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ══ USO PRINCIPAL ══ */}
      {view==='principal' && (
        <div style={{display:'flex',gap:16}}>
          <div style={{width:160,flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
            <div style={{marginBottom:4}}>
              <div onClick={()=>setPpOpen(v=>!v)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'5px 2px',userSelect:'none'}}>
                <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Usos principales</span>
                <span style={{fontSize:11,color:'var(--text4)',transition:'transform .2s',display:'inline-block',transform:ppOpen?'rotate(0deg)':'rotate(-90deg)'}}>▾</span>
              </div>
              {ppOpen && (
                <div style={{maxHeight:210,overflowY:'auto',paddingRight:2}}>
                  {USOS_PPAL.map(u=>(
                    <div key={u.id} draggable
                      onDragStart={()=>setDragging(u.id)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{display:'flex',alignItems:'center',gap:7,padding:'6px 9px',marginBottom:4,borderRadius:6,cursor:'grab',userSelect:'none',border:`1px solid ${dragging===u.id?u.color:u.bd}`,background:u.bg,opacity:dragging&&dragging!==u.id?.4:1,boxShadow:dragging===u.id?`0 2px 8px ${u.color}55`:'none',transform:dragging===u.id?'scale(1.02)':'scale(1)',transition:'opacity .15s,transform .1s,box-shadow .1s'}}>
                      <div style={{width:9,height:9,borderRadius:2,background:u.color,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:u.color}}>{u.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div onClick={()=>setUaOpen(v=>!v)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'5px 2px',userSelect:'none',borderTop:'1px solid var(--border)',marginTop:4,paddingTop:8}}>
                <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Usos adicionales</span>
                <span style={{fontSize:11,color:'var(--text4)',transition:'transform .2s',display:'inline-block',transform:uaOpen?'rotate(0deg)':'rotate(-90deg)'}}>▾</span>
              </div>
              {uaOpen && (
                <div style={{maxHeight:260,overflowY:'auto',paddingRight:2}}>
                  {availableUA.length===0 ? (
                    <div style={{fontSize:10,color:'var(--text4)',padding:'6px 0',lineHeight:1.4}}>Asigna primero usos principales</div>
                  ) : availableUA.map(ua=>(
                    <div key={ua.id} draggable
                      onDragStart={()=>setDragging(ua.id)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{display:'flex',alignItems:'center',gap:6,padding:'5px 9px',marginBottom:3,borderRadius:5,cursor:'grab',userSelect:'none',border:`1px solid ${dragging===ua.id?ua.color:ua.bd}`,background:ua.bg,opacity:dragging&&dragging!==ua.id?.4:1,boxShadow:dragging===ua.id?`0 2px 8px ${ua.color}44`:'none',transition:'opacity .15s,box-shadow .1s'}}>
                      <div style={{width:8,height:8,borderRadius:2,background:ua.color,flexShrink:0}}/>
                      <span style={{fontSize:10,fontWeight:600,color:ua.color,flex:1}}>{ua.label}</span>
                      <span style={{fontSize:8,padding:'1px 3px',borderRadius:2,fontWeight:700,flexShrink:0,background:ua.attr?'#ede9fe':'#f0fdf4',color:ua.attr?'#7c3aed':'#16a34a'}}>{ua.attr?'A':'S'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedFloors.length>0 && (
              <div style={{marginTop:10,padding:10,background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:6}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--accent)',marginBottom:6}}>{selectedFloors.length} planta{selectedFloors.length>1?'s':''} sel.</div>
                <div style={{maxHeight:160,overflowY:'auto'}}>
                  {USOS_PPAL.map(u=>(
                    <button key={u.id} onClick={()=>bulkAssign(u.id)} style={{display:'block',width:'100%',padding:'4px 8px',marginBottom:3,background:u.bg,color:u.color,border:`1px solid ${u.bd}`,borderRadius:4,fontSize:10,cursor:'pointer',fontFamily:'inherit',textAlign:'left',fontWeight:600}}>{u.label}</button>
                  ))}
                </div>
                <button onClick={()=>setSelectedFloors([])} style={{display:'block',width:'100%',padding:'4px 8px',marginTop:4,background:'none',color:'var(--text4)',border:'1px solid var(--border)',borderRadius:4,fontSize:10,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>Cancelar</button>
              </div>
            )}
          </div>

          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'grid',gridTemplateColumns:'22px 52px 1fr 90px',background:'var(--gray-lt)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
              <div style={{padding:'5px 4px'}}/>
              <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Planta</div>
              <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Uso principal + Usos adicionales</div>
              <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',textAlign:'right'}}>Sup. total</div>
            </div>

            {edif.floors.map(floor=>{
              const used  = floor.principal.reduce((s,u)=>s+u.sup,0)
              const avail = floor.sup-used
              const isTgt = dragTarget===floor.id
              const isSel = selectedFloors.includes(floor.id)
              const hasAdic = floor.adicional.length>0
              const isPB = floor.id === 'PB'
              return (
                <div key={floor.id}
                  onDragOver={e=>onDragOver(e,floor.id)}
                  onDragLeave={()=>setDragTarget(null)}
                  onDrop={e=>{
                    e.preventDefault(); setDragTarget(null)
                    if(!dragging) return
                    const isUA = !!UA_ALL.find(u=>u.id===dragging)
                    // Multi-planta: si hay varias seleccionadas, aplica a todas independientemente de dónde se suelte
                    const targets = selectedFloors.length > 1 ? selectedFloors : [floor.id]
                    if(isUA) {
                      targets.forEach(fId=>assignAdicional(fId,dragging))
                      if(targets.length>1) setSelectedFloors([])
                      setDragging(null); return
                    }
                    if(targets.length > 1) {
                      setBuildings(prev=>prev.map(b=>{
                        if(b.id!==edifId) return b
                        return {...b, floors:b.floors.map(f=>{
                          if(!targets.includes(f.id)) return f
                          const av=f.sup-f.principal.reduce((s,u)=>s+u.sup,0)
                          if(av<=0) return f
                          return {...f, principal:[...f.principal,{uso:dragging,sup:av}]}
                        })}
                      }))
                      setSelectedFloors([])
                    } else {
                      const used2=floor.principal.reduce((s,u)=>s+u.sup,0)
                      const avail2=floor.sup-used2
                      if(avail2<=0){ setSplitModal({floorId:floor.id,usoId:dragging}); setSplitSup('') }
                      else{ assignPrincipal(floor.id,dragging,avail2) }
                    }
                    setDragging(null)
                  }}
                  style={{display:'grid',gridTemplateColumns:'22px 52px 1fr 90px',borderBottom:isPB?'3px solid var(--text3)':'1px solid var(--border)',background:isTgt?'#eff6ff':isSel?'#f0f9ff':'var(--surface)',outline:isTgt?'1.5px solid var(--accent)':'none',transition:'background .1s'}}
                >
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',paddingTop:4}}>
                    <input type="checkbox" checked={isSel} onChange={()=>setSelectedFloors(p=>p.includes(floor.id)?p.filter(x=>x!==floor.id):[...p,floor.id])} style={{width:11,height:11,cursor:'pointer'}}/>
                  </div>
                  <div style={{padding:'6px 8px',fontSize:12,fontWeight:700,color:'var(--text3)',display:'flex',alignItems:'flex-start',paddingTop:10}}>{floor.id}</div>
                  <div style={{padding:'4px 4px 4px 0',display:'flex',flexDirection:'column',gap:4}}>
                    <div style={{display:'flex',alignItems:'stretch',gap:2,height:32}}>
                      {floor.principal.length===0 ? (
                        <div style={{flex:1,background:isTgt?'var(--accent-lt)':'var(--gray-lt)',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:isTgt?'var(--accent)':'var(--text4)',fontWeight:isTgt?600:400}}>
                          {isTgt?'⬇ Soltar uso aquí':'Sin uso asignado — arrastra un uso'}
                        </div>
                      ) : (
                        <>
                          {floor.principal.map((u,i)=>{
                            const info = usoInfo(u.uso)
                            const wpct = `${(u.sup/floor.sup)*100}%`
                            const isEd = editFloor?.floorId===floor.id && editFloor?.idx===i && editFloor?.layer==='principal'
                            return (
                              <div key={i} title={`${info.label} · ${u.sup.toLocaleString('es-ES')} m²`}
                                onClick={()=>{if(isEd)setEditFloor(null);else{setEditFloor({floorId:floor.id,idx:i,layer:'principal'});setEditSup(String(u.sup))}}}
                                style={{width:wpct,background:info.bg,border:`1px solid ${info.bd}`,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,overflow:'hidden',transition:'filter .1s'}}>
                                {isEd ? (
                                  <div style={{display:'flex',gap:3,padding:'0 4px'}} onClick={e=>e.stopPropagation()}>
                                    <input type="number" value={editSup} onChange={e=>setEditSup(e.target.value)} autoFocus
                                      onKeyDown={e=>{if(e.key==='Enter')saveSup();if(e.key==='Escape')setEditFloor(null)}}
                                      style={{width:52,padding:'2px 4px',fontSize:9,border:`1px solid ${info.color}`,borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                    <button onClick={saveSup} style={{padding:'2px 4px',background:info.color,color:'#fff',border:'none',borderRadius:3,fontSize:8,cursor:'pointer'}}>✓</button>
                                    <button onClick={()=>removeItem(floor.id,i,'principal')} style={{padding:'2px 4px',background:'#fee2e2',color:'#dc2626',border:'1px solid #fca5a5',borderRadius:3,fontSize:8,cursor:'pointer'}}>✕</button>
                                  </div>
                                ) : (
                                  <span style={{fontSize:9,fontWeight:700,color:info.color,padding:'0 5px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>
                                    {info.label}{u.sup>=200?` · ${u.sup.toLocaleString('es-ES')} m²`:''}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                          {avail>0 && (
                            <div style={{flex:1,minWidth:14,background:isTgt?'var(--accent-lt)':'var(--gray-lt)',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:isTgt?'var(--accent)':'var(--text4)'}}>
                              {avail.toLocaleString('es-ES')} m²
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {hasAdic && (
                      <div style={{display:'flex',flexWrap:'wrap',gap:3,paddingBottom:4}}>
                        {floor.adicional.map((ua,i)=>{
                          const info = uaInfo(ua.uso)
                          const isEd = editFloor?.floorId===floor.id&&editFloor?.idx===i&&editFloor?.layer==='adicional'
                          return (
                            <div key={i} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',background:info.bg,border:`1px solid ${info.bd}`,borderRadius:10,fontSize:9,color:info.color,fontWeight:600}}>
                              <div style={{width:6,height:6,borderRadius:1,background:info.color,flexShrink:0}}/>
                              <span>{ua.label}</span>
                              {!ua.attr&&(isEd?(
                                <div style={{display:'flex',gap:2}} onClick={e=>e.stopPropagation()}>
                                  <input type="number" value={editSup} onChange={e=>setEditSup(e.target.value)} autoFocus
                                    onKeyDown={e=>{if(e.key==='Enter')saveSup();if(e.key==='Escape')setEditFloor(null)}}
                                    style={{width:44,padding:'1px 3px',fontSize:8,border:`1px solid ${info.color}`,borderRadius:3,fontFamily:'var(--mono)'}}/>
                                  <button onClick={saveSup} style={{padding:'1px 3px',background:info.color,color:'#fff',border:'none',borderRadius:3,fontSize:8,cursor:'pointer'}}>✓</button>
                                </div>
                              ):(
                                <span onClick={()=>{setEditFloor({floorId:floor.id,idx:i,layer:'adicional'});setEditSup(String(ua.sup))}}
                                  style={{fontFamily:'var(--mono)',fontSize:8,color:info.color,opacity:.7,cursor:'pointer',textDecoration:'underline dotted'}}>
                                  {ua.sup>0?`${ua.sup.toLocaleString('es-ES')} m²`:''}
                                </span>
                              ))}
                              <button onClick={()=>removeItem(floor.id,i,'adicional')} style={{background:'none',border:'none',cursor:'pointer',color:info.color,fontSize:10,lineHeight:1,padding:'0',opacity:.6}}>✕</button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{padding:'8px 8px',fontSize:11,fontWeight:600,color:'var(--text3)',display:'flex',alignItems:'flex-start',justifyContent:'flex-end',fontFamily:'var(--mono)',paddingTop:8}}>
                    {editFloorSup===floor.id ? (
                      <div style={{display:'flex',flexDirection:'column',gap:2,alignItems:'flex-end'}} onClick={e=>e.stopPropagation()}>
                        <input type="number" value={editFloorSupVal} onChange={e=>setEditFloorSupVal(e.target.value)} autoFocus
                          onKeyDown={e=>{if(e.key==='Enter')saveFloorSup();if(e.key==='Escape')setEditFloorSup(null)}}
                          style={{width:68,padding:'2px 4px',fontSize:10,border:'1px solid var(--accent)',borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                        <div style={{display:'flex',gap:2}}>
                          <button onClick={saveFloorSup} style={{padding:'2px 5px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:3,fontSize:9,cursor:'pointer'}}>✓</button>
                          <button onClick={()=>setEditFloorSup(null)} style={{padding:'2px 5px',background:'none',color:'var(--text4)',border:'1px solid var(--border)',borderRadius:3,fontSize:9,cursor:'pointer'}}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <span title="Clic para editar superficie total" onClick={()=>{setEditFloorSup(floor.id);setEditFloorSupVal(String(floor.sup))}} style={{cursor:'pointer',borderBottom:'1px dotted var(--text4)'}}>
                        {floor.sup.toLocaleString('es-ES')} m²
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10,padding:'8px 0'}}>
              <span style={{fontSize:10,color:'var(--text4)',fontWeight:600,minWidth:70}}>Asignación</span>
              <div style={{flex:1,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                <div style={{width:`${occPct}%`,height:'100%',background:occPct===100?'var(--green)':'var(--accent)',borderRadius:3,transition:'width .4s'}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:occPct===100?'var(--green)':'var(--accent)',minWidth:32,textAlign:'right'}}>{occPct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ══ PROPIETARIOS ══ */}
      {view==='prop' && (()=>{
        const PROP_COLORS = ['#3b82f6','#8b5cf6','#14b8a6','#f97316','#ec4899','#22c55e']
        const ownerSet = [...new Set([...extraOwners, ...(edif.prop||[]).flatMap(r=>r.units.map(u=>u.n))])]
        const ownerColor = (n) => PROP_COLORS[ownerSet.indexOf(n)%PROP_COLORS.length]
        const dropProp = (floorId, floorSup, ownerName) => {
          updBuilding(b=>{
            const exists = (b.prop||[]).find(r=>r.p===floorId)
            if(exists){
              const avail = exists.sup - exists.units.reduce((s,u)=>s+u.sup,0)
              if(avail<=0) return b
              return {...b, prop: b.prop.map(r=>r.p===floorId?{...r,units:[...r.units,{n:ownerName,sup:avail}]}:r)}
            } else {
              return {...b, prop: [...(b.prop||[]), {p:floorId, sup:floorSup, units:[{n:ownerName,sup:floorSup}]}]}
            }
          })
        }
        return (
          <div style={{display:'flex',gap:16}}>
            <div style={{width:160,flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',padding:'5px 2px',marginBottom:6}}>Propietarios</div>
              <div style={{maxHeight:320,overflowY:'auto',paddingRight:2}}>
                {ownerSet.length===0 ? (
                  <div style={{fontSize:10,color:'var(--text4)',lineHeight:1.5,padding:'4px 0'}}>Aún no hay propietarios</div>
                ) : ownerSet.map((n,i)=>{
                  const col = PROP_COLORS[i%PROP_COLORS.length]
                  return (
                    <div key={n} draggable onDragStart={()=>setDragging(n)} onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{display:'flex',alignItems:'center',gap:7,padding:'6px 9px',marginBottom:4,borderRadius:6,cursor:'grab',userSelect:'none',border:`1px solid ${dragging===n?col:col+'88'}`,background:col+'18',opacity:dragging&&dragging!==n?.4:1,boxShadow:dragging===n?`0 2px 8px ${col}44`:'none',transition:'opacity .15s,box-shadow .1s'}}>
                      <div style={{width:9,height:9,borderRadius:2,background:col,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:col,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n}</span>
                    </div>
                  )
                })}
              </div>
              <button onClick={onAddOwner} style={{marginTop:8,padding:'5px 8px',background:'none',border:'1px dashed var(--accent-bd)',borderRadius:5,fontSize:10,color:'var(--accent)',cursor:'pointer',fontFamily:'inherit',textAlign:'left',width:'100%'}}>+ Añadir propietario</button>
            </div>

            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',background:'var(--gray-lt)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Planta</div>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Propietario — arrastra desde el panel izquierdo · clic en bloque para editar</div>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',textAlign:'right'}}>Sup. total</div>
              </div>
              {edif.floors.map(floor=>{
                const propRow = (edif.prop||[]).find(r=>r.p===floor.id)
                const units    = propRow?.units || []
                const rowSup   = propRow?.sup ?? floor.sup
                const assigned = units.reduce((s,u)=>s+u.sup,0)
                const unassigned = rowSup - assigned
                const isEmpty  = units.length===0
                const isTgt    = dragTarget===floor.id
                return (
                  <div key={floor.id}
                    onDragOver={e=>{e.preventDefault();setDragTarget(floor.id)}}
                    onDragLeave={()=>setDragTarget(null)}
                    onDrop={e=>{e.preventDefault();setDragTarget(null);if(!dragging||!ownerSet.includes(dragging)) return;dropProp(floor.id, floor.sup, dragging);setDragging(null)}}
                    style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',borderBottom:floor.id==='PB'?'3px solid var(--text3)':'1px solid var(--border)',minHeight:44,background:isTgt?'#eff6ff':isEmpty?'var(--gray-lt)':'var(--surface)',outline:isTgt?'1.5px solid var(--accent)':'none',transition:'background .1s'}}>
                    <div style={{padding:'6px 8px',fontSize:12,fontWeight:700,color:isEmpty?'var(--text4)':'var(--text3)',display:'flex',alignItems:'center'}}>{floor.id}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:3,padding:'5px 4px 5px 0'}}>
                      {floor.principal.length>0 && (
                        <div style={{display:'flex',gap:1,height:6,borderRadius:2,overflow:'hidden',opacity:.35}}>
                          {floor.principal.map((u,i)=>{const info=usoInfo(u.uso);return <div key={i} style={{width:`${(u.sup/floor.sup)*100}%`,background:info.color,flexShrink:0}}/>})}
                        </div>
                      )}
                      <div style={{display:'flex',alignItems:'stretch',gap:2,minHeight:34}}>
                        {isEmpty ? (
                          <div style={{flex:1,background:isTgt?'var(--accent-lt)':'transparent',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:isTgt?'var(--accent)':'var(--text4)',gap:5}}>
                            {isTgt?'⬇ Soltar propietario':'Sin propietario asignado — arrastra aquí'}
                          </div>
                        ) : (
                          <>
                            {units.map((u,i)=>{
                              const col = ownerColor(u.n)
                              const wpct = `${(u.sup/rowSup)*100}%`
                              const isEd = editPA?.layer==='prop' && editPA?.rowP===floor.id && editPA?.idx===i
                              return (
                                <div key={i} title={`${u.n} · ${u.sup.toLocaleString('es-ES')} m²`}
                                  onClick={()=>{if(isEd)setEditPA(null);else{setEditPA({layer:'prop',rowP:floor.id,idx:i});setEditPASup(String(u.sup))}}}
                                  style={{position:'relative',width:wpct,background:col+'18',border:`1px solid ${col}88`,borderRadius:4,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,overflow:'visible',padding:'3px 4px',gap:1}}>
                                  {isEd ? (
                                    <div style={{display:'flex',gap:3,padding:'0 4px'}} onClick={e=>e.stopPropagation()}>
                                      <input type="number" value={editPASup} onChange={e=>setEditPASup(e.target.value)} autoFocus
                                        onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                                        style={{width:58,padding:'2px 4px',fontSize:9,border:`1px solid ${col}`,borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                      <button onClick={savePASup} style={{padding:'2px 4px',background:col,color:'#fff',border:'none',borderRadius:3,fontSize:8,cursor:'pointer'}}>✓</button>
                                    </div>
                                  ) : (
                                    <>
                                      <button onClick={e=>{e.stopPropagation();removePropUnit(floor.id,i)}} style={{position:'absolute',top:-5,right:-5,width:14,height:14,borderRadius:7,background:'#dc2626',color:'#fff',border:'1.5px solid #fff',fontSize:9,lineHeight:1,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0,fontWeight:700,zIndex:2}}>✕</button>
                                      <span style={{fontSize:10,fontWeight:700,color:col,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center',padding:'0 3px'}}>{u.n}</span>
                                      <span style={{fontSize:9,color:col,opacity:.7,fontFamily:'var(--mono)'}}>{u.sup.toLocaleString('es-ES')} m²</span>
                                    </>
                                  )}
                                </div>
                              )
                            })}
                            {unassigned>0 && (
                              <div style={{flex:1,minWidth:20,background:isTgt?'var(--accent-lt)':'var(--gray-lt)',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:9,color:isTgt?'var(--accent)':'var(--text4)',gap:1,padding:'2px 4px'}}>
                                <span>{unassigned.toLocaleString('es-ES')} m²</span>
                                <span style={{fontSize:8}}>sin asignar</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{padding:'6px 8px',fontSize:11,fontWeight:600,color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'flex-end',fontFamily:'var(--mono)'}}>{rowSup.toLocaleString('es-ES')} m²</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ══ ARRENDATARIOS ══ */}
      {view==='arr' && (()=>{
        const tenantSet = [...new Set([...extraTenants, ...(edif.arr||[]).flatMap(r=>r.units.filter(u=>u.type==='ten'||u.type==='rt'||u.type==='pk').map(u=>u.n))])]
        const ARR_COLORS = ['#1e40af','#0f766e','#7c3aed','#b45309','#be185d','#065f46']
        const tenantColor = (n) => ARR_COLORS[tenantSet.indexOf(n)%ARR_COLORS.length]
        const TYPE_COLORS = {
          ten: {bg:'#dbeafe',bd:'#93c5fd',col:'#1e40af'},
          vac: {bg:'#fff8ec',bd:'#fcd34d',col:'#d97706'},
          com: {bg:'#dcfce7',bd:'#86efac',col:'#15803d'},
          rt:  {bg:'#fce7f3',bd:'#fbcfe8',col:'#ec4899'},
          pk:  {bg:'#f1f5f9',bd:'#94a3b8',col:'#475569'},
        }
        const typeLabel = (u) => { if(u.type==='vac') return u.oferta ? u.oferta : ''; return u.n }
        return (
          <div style={{display:'flex',gap:16}}>
            <div style={{width:160,flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',padding:'5px 2px',marginBottom:6}}>Arrendatarios</div>
              <div style={{maxHeight:200,overflowY:'auto',paddingRight:2}}>
                {tenantSet.length===0 ? (
                  <div style={{fontSize:10,color:'var(--text4)',lineHeight:1.5,padding:'4px 0'}}>Aún no hay arrendatarios</div>
                ) : tenantSet.map((n,i)=>{
                  const col = ARR_COLORS[i%ARR_COLORS.length]
                  return (
                    <div key={n} draggable onDragStart={()=>setDragging('ten:'+n)} onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{display:'flex',alignItems:'center',gap:7,padding:'6px 9px',marginBottom:4,borderRadius:6,cursor:'grab',userSelect:'none',border:`1px solid ${col}88`,background:col+'18',opacity:dragging&&dragging!=='ten:'+n?.4:1,boxShadow:dragging==='ten:'+n?`0 2px 8px ${col}44`:'none',transition:'opacity .15s,box-shadow .1s'}}>
                      <div style={{width:9,height:9,borderRadius:2,background:col,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:col,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n}</span>
                    </div>
                  )
                })}
              </div>
              <button onClick={onAddTenant} style={{marginTop:4,padding:'5px 8px',background:'none',border:'1px dashed var(--accent-bd)',borderRadius:5,fontSize:10,color:'var(--accent)',cursor:'pointer',fontFamily:'inherit',textAlign:'left',width:'100%'}}>+ Añadir arrendatario</button>
              <div style={{borderTop:'1px solid var(--border)',marginTop:10,paddingTop:8}}>
                <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Ofertas activas</div>
                {extraOfertas.length === 0
                  ? <div style={{fontSize:10,color:'var(--text4)',fontStyle:'italic',padding:'6px 0'}}>Sin ofertas. Créalas desde Desglose de ofertas.</div>
                  : extraOfertas.map((ofr,idx)=>{
                      const COLS=['#16a34a','#2563eb','#d97706','#7c3aed']
                      const col=COLS[idx%COLS.length]
                      const dragKey='ofr:'+ofr.nombre
                      return (
                        <div key={ofr.id} draggable onDragStart={()=>setDragging(dragKey)} onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                          style={{display:'flex',flexDirection:'column',gap:2,padding:'6px 9px',marginBottom:4,borderRadius:5,cursor:'grab',userSelect:'none',border:`1px solid ${col}55`,background:col+'12',opacity:dragging&&dragging!==dragKey?0.4:1,transition:'opacity .15s'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
                            <span style={{fontSize:11,fontWeight:700,color:col}}>{ofr.nombre}</span>
                          </div>
                          <div style={{fontSize:9,color:'var(--text4)'}}>Arrastra para asignar plantas</div>
                        </div>
                      )
                    })
                }
              </div>
            </div>

            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',background:'var(--gray-lt)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Planta</div>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Arrendatario / Oferta — arrastra desde el panel izquierdo · clic en bloque para editar</div>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',textAlign:'right'}}>Sup. total</div>
              </div>
              {edif.floors.map(floor=>{
                const arrRow  = (edif.arr||[]).find(r=>r.p===floor.id)
                const units   = arrRow?.units || []
                const rowSup  = arrRow?.sup ?? floor.sup
                const assigned = units.reduce((s,u)=>s+u.sup,0)
                const isEmpty = units.length===0
                const isTgt   = dragTarget===floor.id
                const dropArr = (newUnit) => {
                  updBuilding(b=>{
                    const exists=(b.arr||[]).find(r=>r.p===floor.id)
                    if(exists){
                      const avail=exists.sup-exists.units.reduce((s,u)=>s+u.sup,0)
                      if(avail<=0) return b
                      const fitSup = newUnit.sup && newUnit.sup>0 ? Math.min(newUnit.sup, avail) : avail
                      const unit={...newUnit,sup:fitSup}
                      return {...b,arr:b.arr.map(r=>r.p===floor.id?{...r,units:[...r.units,unit]}:r)}
                    } else {
                      return {...b,arr:[...(b.arr||[]),{p:floor.id,sup:floor.sup,units:[{...newUnit,sup:floor.sup}]}]}
                    }
                  })
                }
                return (
                  <div key={floor.id}
                    onDragOver={e=>{e.preventDefault();setDragTarget(floor.id)}}
                    onDragLeave={()=>setDragTarget(null)}
                    onDrop={e=>{
                      e.preventDefault();setDragTarget(null)
                      if(!dragging) return
                      if(dragging.startsWith('ten:')){dropArr({type:'ten',n:dragging.slice(4)})}
                      else if(dragging.startsWith('ofr:')){const ref=dragging.slice(4);dropArr({type:'vac',oferta:ref,sup:floor.sup,renta:0})}
                      setDragging(null)
                    }}
                    style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',borderBottom:floor.id==='PB'?'3px solid var(--text3)':'1px solid var(--border)',minHeight:52,background:isTgt?'#eff6ff':isEmpty?'var(--gray-lt)':'var(--surface)',outline:isTgt?'1.5px solid var(--accent)':'none',transition:'background .1s'}}>
                    <div style={{padding:'6px 8px',fontSize:12,fontWeight:700,color:isEmpty?'var(--text4)':'var(--text3)',display:'flex',alignItems:'center'}}>{floor.id}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:3,padding:'5px 4px 5px 0'}}>
                      {floor.principal.length>0 && (
                        <div style={{display:'flex',gap:1,height:6,borderRadius:2,overflow:'hidden',opacity:.35}}>
                          {floor.principal.map((u,i)=>{const info=usoInfo(u.uso);return <div key={i} style={{width:`${(u.sup/floor.sup)*100}%`,background:info.color,flexShrink:0}}/>})}
                        </div>
                      )}
                      <div style={{display:'flex',alignItems:'stretch',gap:2,minHeight:42}}>
                        {isEmpty ? (
                          <div style={{flex:1,background:isTgt?'var(--accent-lt)':'transparent',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:isTgt?'var(--accent)':'var(--text4)',gap:5}}>
                            {isTgt?'⬇ Soltar aquí':'Sin asignación — arrastra desde el panel lateral'}
                          </div>
                        ) : (
                          <>
                            {units.map((u,i)=>{
                              const wpct = `${(u.sup/rowSup)*100}%`
                              const isEd = editPA?.layer==='arr' && editPA?.rowP===floor.id && editPA?.idx===i
                              const tc = TYPE_COLORS[u.type]||TYPE_COLORS.ten
                              const {bg,bd,col} = tc
                              const label = typeLabel(u)
                              return (
                                <div key={i}
                                  title={`${label} · ${u.sup.toLocaleString('es-ES')} m²${u.brk?` · break ${u.brk}`:''}`}
                                  onClick={()=>{if(isEd)setEditPA(null);else{setEditPA({layer:'arr',rowP:floor.id,idx:i});setEditPASup(String(u.sup));setEditPARenta(String(u.renta??''))}}}
                                  style={{position:'relative',width:wpct,background:bg,border:`1px solid ${bd}`,borderRadius:4,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,overflow:'visible',padding:'4px 6px',gap:2,minHeight:42}}>
                                  {isEd ? (
                                    <div style={{display:'flex',flexDirection:'column',gap:3,padding:'2px 4px'}} onClick={e=>e.stopPropagation()}>
                                      <div style={{display:'flex',gap:2,alignItems:'center'}}>
                                        <input type="number" value={editPASup} onChange={e=>setEditPASup(e.target.value)} autoFocus
                                          onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                                          style={{width:56,padding:'2px 4px',fontSize:9,border:`1px solid ${col}`,borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                        <span style={{fontSize:8,color:col}}>m²</span>
                                      </div>
                                      {u.type==='vac'&&u.oferta&&(
                                        <div style={{display:'flex',gap:2,alignItems:'center'}}>
                                          <input type="number" step="0.01" value={editPARenta} onChange={e=>setEditPARenta(e.target.value)}
                                            onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                                            placeholder="€/m²"
                                            style={{width:56,padding:'2px 4px',fontSize:9,border:`1px solid ${col}`,borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                          <span style={{fontSize:8,color:col}}>€/m²</span>
                                        </div>
                                      )}
                                      <button onClick={savePASup} style={{padding:'2px 4px',background:col,color:'#fff',border:'none',borderRadius:3,fontSize:8,cursor:'pointer'}}>✓ Guardar</button>
                                    </div>
                                  ) : (
                                    <>
                                      <button onClick={e=>{e.stopPropagation();removeArrUnit(floor.id,i)}} style={{position:'absolute',top:-5,right:-5,width:14,height:14,borderRadius:7,background:'#dc2626',color:'#fff',border:'1.5px solid #fff',fontSize:9,lineHeight:1,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0,fontWeight:700,zIndex:2}}>✕</button>
                                      <span style={{fontSize:10,fontWeight:700,color:col,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>{label}</span>
                                      {u.type==='vac'&&u.oferta&&activoPropietario&&(
                                        <span style={{fontSize:8,color:col,opacity:.6,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>🏠 {activoPropietario}</span>
                                      )}
                                      <span style={{fontSize:9,color:col,opacity:.75,fontFamily:'var(--mono)',fontWeight:600}}>{u.sup.toLocaleString('es-ES')} m²{u.renta>0?` · ${u.renta}€/m²`:''}</span>
                                      {u.brk&&<span style={{fontSize:8,color:u.brkColor||col,fontWeight:600,whiteSpace:'nowrap'}}>⊙ {u.brk}</span>}
                                      {u.nota&&<span style={{fontSize:8,color:col,opacity:.6}}>{u.nota}</span>}
                                    </>
                                  )}
                                </div>
                              )
                            })}
                            {assigned<rowSup && (
                              <div style={{flex:1,minWidth:20,background:isTgt?'var(--accent-lt)':'var(--gray-lt)',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:9,color:isTgt?'var(--accent)':'var(--text4)',gap:1,padding:'2px 4px',minHeight:42}}>
                                <span>{(rowSup-assigned).toLocaleString('es-ES')} m²</span>
                                <span style={{fontSize:8}}>sin asignar</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{padding:'6px 8px',fontSize:11,fontWeight:600,color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'flex-end',fontFamily:'var(--mono)'}}>{rowSup.toLocaleString('es-ES')} m²</div>
                  </div>
                )
              })}
              {extraOfertas.length > 0 && (()=>{
                const assigned = (edif.arr||[]).flatMap(r=>r.units.filter(u=>u.type==='vac'&&u.oferta).map(u=>({planta:r.p,oferta:u.oferta,sup:u.sup,renta:u.renta||0})))
                if(!assigned.length) return null
                const totalSup=assigned.reduce((s,a)=>s+a.sup,0)
                const totalRenta=assigned.filter(a=>a.renta>0).reduce((s,a)=>s+a.renta*a.sup,0)
                return (
                  <div style={{margin:'12px 8px 8px',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',overflow:'hidden'}}>
                    <div style={{padding:'7px 12px',background:'var(--accent-lt)',borderBottom:'1px solid var(--accent-bd)',display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:10,fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'.04em'}}>Espacios asignados</span>
                      <span style={{fontSize:9,background:'var(--green-lt)',color:'var(--green)',border:'1px solid var(--green-bd)',padding:'1px 6px',borderRadius:10,fontWeight:700}}>ↈ Sincronizado</span>
                      <span style={{marginLeft:'auto',fontSize:10,fontWeight:700,fontFamily:'var(--mono)',color:'var(--text2)'}}>{totalSup.toLocaleString()} m²</span>
                    </div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr>{['Planta','Oferta','Superficie','Renta €/m²/mes','Renta mensual'].map(h=><th key={h} style={{padding:'5px 10px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {assigned.map((a,i)=>(
                          <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                            <td style={{padding:'5px 10px'}}><span className="tag tag-gray" style={{fontSize:9}}>{a.planta}</span></td>
                            <td style={{padding:'5px 10px',color:'var(--accent)',fontSize:10,fontWeight:500}}>{a.oferta}</td>
                            <td style={{padding:'5px 10px',fontFamily:'var(--mono)',fontWeight:600}}>{a.sup.toLocaleString()}</td>
                            <td style={{padding:'5px 10px',fontFamily:'var(--mono)',color:a.renta?'var(--text2)':'var(--text4)',fontStyle:a.renta?'normal':'italic'}}>{a.renta?`${a.renta} €`:'— clic para editar'}</td>
                            <td style={{padding:'5px 10px',fontFamily:'var(--mono)',fontWeight:600,color:'var(--green)'}}>{a.renta?`${(a.renta*a.sup).toLocaleString(undefined,{maximumFractionDigits:0})} €`:'—'}</td>
                          </tr>
                        ))}
                        <tr style={{background:'var(--gray-lt)',borderTop:'2px solid var(--border)'}}>
                          <td colSpan={2} style={{padding:'5px 10px',fontSize:10,fontWeight:700,color:'var(--text3)'}}>TOTAL</td>
                          <td style={{padding:'5px 10px',fontFamily:'var(--mono)',fontWeight:800}}>{totalSup.toLocaleString()}</td>
                          <td/>
                          <td style={{padding:'5px 10px',fontFamily:'var(--mono)',fontWeight:800,color:'var(--green)'}}>{totalRenta?`${totalRenta.toLocaleString(undefined,{maximumFractionDigits:0})} €`:'—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          </div>
        )
      })()}

      {/* Modal split */}
      {splitModal&&(()=>{
        const floor=edif.floors.find(f=>f.id===splitModal.floorId)
        const info=usoInfo(splitModal.usoId)
        return (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}} onClick={()=>setSplitModal(null)}>
            <div style={{background:'var(--surface)',borderRadius:'var(--r2)',padding:20,width:310,boxShadow:'0 8px 32px rgba(0,0,0,.18)'}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:'var(--text1)'}}>Dividir planta {floor?.id}</div>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:12,lineHeight:1.5}}>La planta está completa. Indica cuántos m² asignar a <strong style={{color:info.color}}>{info.label}</strong> — el último uso existente se reducirá proporcionalmente.</div>
              <input type="number" placeholder="m² a asignar" value={splitSup} onChange={e=>setSplitSup(e.target.value)} autoFocus
                style={{width:'100%',padding:'7px 10px',border:'1px solid var(--border)',borderRadius:5,fontSize:12,fontFamily:'var(--mono)',marginBottom:10,boxSizing:'border-box'}}
                onKeyDown={e=>{if(e.key==='Enter')document.getElementById('sp-split-confirm')?.click()}}/>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setSplitModal(null)} style={{padding:'6px 14px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                <button id="sp-split-confirm"
                  onClick={()=>{
                    const sup=parseFloat(splitSup)
                    if(!isNaN(sup)&&sup>0&&floor){
                      updBuilding(b=>({...b,floors:b.floors.map(f=>{
                        if(f.id!==splitModal.floorId) return f
                        const last=f.principal[f.principal.length-1]
                        if(!last||last.sup<=sup) return {...f,principal:[...f.principal,{uso:splitModal.usoId,sup}]}
                        return {...f,principal:[...f.principal.slice(0,-1),{...last,sup:last.sup-sup},{uso:splitModal.usoId,sup}]}
                      })}))
                    }
                    setSplitModal(null); setSplitSup('')
                  }}
                  style={{padding:'6px 14px',background:info.color,color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
                  Asignar
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
