import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'

const TABS = ['at-info','at-stacking','at-caract','at-prop','at-fotos','at-docs','at-adicional','at-360','at-followup']
const TAB_LABELS = ['Información general','Stacking Plan','Características','Propietarios y arrendatarios','Fotografías','Documentos','Información adicional','Vista 360','Follow-up']

/* ── PLAZAS DE APARCAMIENTO ── */
const UBICACIONES  = ['Interior','Exterior']
const TIPOS_PLAZA  = ['Simple','Doble']
const TIPOS_VEHICULO = ['Coches','Motocicletas','Patinetes','Bicicletas','Camiones','Vans']
const INIT_PLAZAS = [
  {id:1, ubicacion:'Interior', tipo:'Simple', vehiculo:'Coches',      cantidad:578},
  {id:2, ubicacion:'Interior', tipo:'Doble',  vehiculo:'Coches',      cantidad:100},
  {id:3, ubicacion:'Interior', tipo:'Simple', vehiculo:'Motocicletas', cantidad:52},
  {id:4, ubicacion:'Exterior', tipo:'Simple', vehiculo:'Coches',      cantidad:48},
]

/* ── USOS PRINCIPALES ── */
const USOS_PPAL = [
  {id:'oficinas',    label:'Oficinas',    cls:'u-of',  color:'#3b82f6', bg:'#dbeafe', bd:'#93c5fd'},
  {id:'retail',      label:'Retail',      cls:'u-rt',  color:'#ec4899', bg:'#fce7f3', bd:'#fbcfe8'},
  {id:'logistico',   label:'Logístico',   cls:'u-log', color:'#f97316', bg:'#fff7ed', bd:'#fed7aa'},
  {id:'residencial', label:'Residencial', cls:'u-res', color:'#8b5cf6', bg:'#ede9fe', bd:'#c4b5fd'},
  {id:'hotel',       label:'Hotel',       cls:'u-hot', color:'#14b8a6', bg:'#ccfbf1', bd:'#99f6e4'},
  {id:'comun',       label:'Zona común',  cls:'u-com', color:'#22c55e', bg:'#dcfce7', bd:'#86efac'},
  {id:'parking',     label:'Parking',     cls:'u-pk',  color:'#94a3b8', bg:'#f1f5f9', bd:'#cbd5e1'},
]

/* ── USOS ADICIONALES ── */
const UA_ALL = [
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
const UA_BY_USO = {
  oficinas:    ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','archivo','vestuarios','comedor','auditorio','salas_reunion','gimnasio','terraza','rooftop'],
  retail:      ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','vestuarios'],
  logistico:   ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','archivo','vestuarios','comedor','playa_maniobras','muelles_carga','cross_docking','camaras_frigo','pk_camiones'],
  residencial: ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','vestuarios','comedor','gimnasio','terraza','rooftop','piscina','salon_comun'],
  hotel:       ['recepcion','nucleo_com','instalaciones','seguridad','ct','parking_gen','trasteros','vestuarios','comedor','gimnasio','terraza','rooftop','piscina','lobby','spa','salas_eventos','restaurante'],
  comun:       ['recepcion','nucleo_com','instalaciones','seguridad','ct'],
  parking:     ['nucleo_com','instalaciones','seguridad','ct'],
}

const GRID = '64px 1fr 100px 60px 80px'

const INIT_BUILDINGS = [
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
      {p:'P5',sup:1500,units:[{type:'ten',n:'Celonis',sup:1202,brk:'Oct 2025',brkColor:'var(--amber)'},{type:'vac',oferta:'OLB001',sup:298}]},
      {p:'P4',sup:1500,units:[{type:'ten',n:'Celonis',sup:1500,brk:'Oct 2025',brkColor:'var(--amber)'}]},
      {p:'P3',sup:1500,units:[{type:'ten',n:'Repsol',sup:767,brk:'Jun 2027',brkColor:'var(--green)'},{type:'vac',oferta:'OLB002',sup:733}]},
      {p:'P2',sup:1500,units:[{type:'ten',n:'Repsol',sup:1200,brk:'Jun 2027',brkColor:'var(--green)'},{type:'vac',oferta:'OLB002',sup:300}]},
      {p:'P1',sup:1500,units:[{type:'ten',n:'Desconocido',sup:1500,brk:'Ene 2026',brkColor:'var(--red)'}]},
      {p:'PB',sup:1500,units:[{type:'rt',n:'Cafetería',sup:380,brk:'Ene 2029',brkColor:'var(--text4)'},{type:'com',n:'Hall / Común',sup:220},{type:'vac',oferta:'OLB001',sup:900}]},
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

function StackingPlan() {
  const [buildings, setBuildings]       = useState(INIT_BUILDINGS)
  const [edifId, setEdifId]             = useState('A')
  const [view, setView]                 = useState('principal')
  const [dragging, setDragging]         = useState(null)
  const [dragTarget, setDragTarget]     = useState(null)
  const [editFloor, setEditFloor]       = useState(null) // {floorId, idx, layer}
  const [editSup, setEditSup]           = useState('')
  const [selectedFloors, setSelectedFloors] = useState([])
  const [showCreate, setShowCreate]     = useState(false)
  const [newBldg, setNewBldg]           = useState({label:'',sup:'',sobre:'',bajo:''})
  const [splitModal, setSplitModal]     = useState(null) // {floorId, usoId}
  const [splitSup, setSplitSup]         = useState('')
  const [ppOpen, setPpOpen]             = useState(true)
  const [uaOpen, setUaOpen]             = useState(true)
  const [editPA, setEditPA]             = useState(null)  // {layer:'prop'|'arr', rowP, idx}
  const [editPASup, setEditPASup]       = useState('')
  const [editFloorSup, setEditFloorSup]       = useState(null) // floorId — editable only from principal view
  const [editFloorSupVal, setEditFloorSupVal] = useState('')

  const edif = buildings.find(b=>b.id===edifId) || buildings[0]
  const usoInfo  = (id) => USOS_PPAL.find(u=>u.id===id) || {label:id,color:'#94a3b8',bg:'#f1f5f9',bd:'#cbd5e1'}
  const uaInfo   = (id) => UA_ALL.find(u=>u.id===id)   || {label:id,color:'#64748b',bg:'#f1f5f9',bd:'#cbd5e1',attr:false}

  /* ── Stats derivados ── */
  const totalSup    = edif.floors.reduce((s,f)=>s+f.sup,0)
  const assignedSup = edif.floors.reduce((s,f)=>s+f.principal.reduce((ss,u)=>ss+u.sup,0),0)
  const occPct      = totalSup>0 ? Math.round(assignedSup/totalSup*100) : 0

  /* ── Usos adicionales disponibles (filtrados por uso principal del edificio) ── */
  const primaryUsos   = [...new Set(edif.floors.flatMap(f=>f.principal.map(p=>p.uso)))]
  const availableUA   = UA_ALL.filter(ua=>primaryUsos.some(u=>(UA_BY_USO[u]||[]).includes(ua.id)))

  /* ── Mutaciones ── */
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

  const savePASup = () => {
    if(!editPA) return
    const val = parseFloat(editPASup)
    if(isNaN(val)||val<=0) return
    updBuilding(b=>({...b, [editPA.layer]: b[editPA.layer].map(row=>{
      if(row.p!==editPA.rowP) return row
      const units=[...row.units]
      units[editPA.idx]={...units[editPA.idx], sup:val}
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
    selectedFloors.forEach(fId=>assignPrincipal(fId,usoId))
    setSelectedFloors([])
  }

  const createBuilding = () => {
    const sobre=parseInt(newBldg.sobre)||0, bajo=parseInt(newBldg.bajo)||0
    const sup=parseFloat(newBldg.sup)||1500
    const floors=[]
    for(let i=sobre;i>=1;i--) floors.push({id:`P${i}`,sup,principal:[],adicional:[]})
    floors.push({id:'PB',sup,principal:[],adicional:[]})
    for(let i=1;i<=bajo;i++) floors.push({id:`S${i}`,sup,principal:[],adicional:[]})
    const newId=String.fromCharCode(65+buildings.length)
    setBuildings(prev=>[...prev,{id:newId,label:newBldg.label||`Edif. ${newId}`,supPlantaTipo:sup,floors,prop:[],arr:[]}])
    setEdifId(newId); setShowCreate(false); setView('principal')
    setNewBldg({label:'',sup:'',sobre:'',bajo:''})
  }

  /* ── Drag handlers ── */
  const onDragOver  = (e,fId)=>{e.preventDefault();setDragTarget(fId)}
  const onDrop = (e, floor, layer) => {
    e.preventDefault(); setDragTarget(null)
    if(!dragging) return
    if(layer==='adicional') { assignAdicional(floor.id, dragging); setDragging(null); return }
    const used=floor.principal.reduce((s,u)=>s+u.sup,0)
    const avail=floor.sup-used
    if(avail<=0) { setSplitModal({floorId:floor.id,usoId:dragging}); setSplitSup('') }
    else { assignPrincipal(floor.id,dragging,avail) }
    setDragging(null)
  }

  /* ── Tab styles ── */
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

  return (
    <div>
      {/* Edificio tabs */}
      <div style={{display:'flex',gap:6,borderBottom:'1px solid var(--border)',background:'var(--gray-lt)',marginLeft:-24,marginRight:-24,paddingLeft:24,paddingTop:6,flexWrap:'wrap'}}>
        {buildings.map(b=>(
          <button key={b.id} onClick={()=>{setEdifId(b.id);setSelectedFloors([])}} style={fTab(b.id)}>{b.label}</button>
        ))}
        {showCreate ? (
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'6px 6px 0 0',flexWrap:'wrap'}}>
            <input placeholder="Nombre" value={newBldg.label} onChange={e=>setNewBldg(p=>({...p,label:e.target.value}))}
              style={{width:110,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
            <input placeholder="m² planta tipo" type="number" value={newBldg.sup} onChange={e=>setNewBldg(p=>({...p,sup:e.target.value}))}
              style={{width:90,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
            <input placeholder="P. sobre rasante" type="number" value={newBldg.sobre} onChange={e=>setNewBldg(p=>({...p,sobre:e.target.value}))}
              style={{width:80,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
            <input placeholder="P. bajo rasante" type="number" value={newBldg.bajo} onChange={e=>setNewBldg(p=>({...p,bajo:e.target.value}))}
              style={{width:78,padding:'3px 6px',fontSize:11,border:'1px solid var(--accent-bd)',borderRadius:4,fontFamily:'inherit'}}/>
            <button onClick={createBuilding} style={{padding:'4px 10px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:4,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Crear</button>
            <button onClick={()=>setShowCreate(false)} style={{padding:'4px 8px',background:'none',border:'none',cursor:'pointer',fontSize:12,color:'var(--text3)',fontFamily:'inherit'}}>✕</button>
          </div>
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

          {/* ── SIDEBAR ── */}
          <div style={{width:160,flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>

            {/* SECCIÓN: Usos principales */}
            <div style={{marginBottom:4}}>
              <div
                onClick={()=>setPpOpen(v=>!v)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'5px 2px',userSelect:'none'}}
              >
                <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Usos principales</span>
                <span style={{fontSize:11,color:'var(--text4)',transition:'transform .2s',display:'inline-block',transform:ppOpen?'rotate(0deg)':'rotate(-90deg)'}}>▾</span>
              </div>
              {ppOpen && (
                <div style={{maxHeight:210,overflowY:'auto',paddingRight:2}}>
                  {USOS_PPAL.map(u=>(
                    <div key={u.id} draggable
                      onDragStart={()=>setDragging(u.id)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{
                        display:'flex',alignItems:'center',gap:7,padding:'6px 9px',marginBottom:4,
                        borderRadius:6,cursor:'grab',userSelect:'none',
                        border:`1px solid ${dragging===u.id?u.color:u.bd}`,background:u.bg,
                        opacity:dragging&&dragging!==u.id?.4:1,
                        boxShadow:dragging===u.id?`0 2px 8px ${u.color}55`:'none',
                        transform:dragging===u.id?'scale(1.02)':'scale(1)',
                        transition:'opacity .15s,transform .1s,box-shadow .1s',
                      }}
                    >
                      <div style={{width:9,height:9,borderRadius:2,background:u.color,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:u.color}}>{u.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN: Usos adicionales */}
            <div>
              <div
                onClick={()=>setUaOpen(v=>!v)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'5px 2px',userSelect:'none',borderTop:'1px solid var(--border)',marginTop:4,paddingTop:8}}
              >
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
                      style={{
                        display:'flex',alignItems:'center',gap:6,padding:'5px 9px',marginBottom:3,
                        borderRadius:5,cursor:'grab',userSelect:'none',
                        border:`1px solid ${dragging===ua.id?ua.color:ua.bd}`,background:ua.bg,
                        opacity:dragging&&dragging!==ua.id?.4:1,
                        boxShadow:dragging===ua.id?`0 2px 8px ${ua.color}44`:'none',
                        transition:'opacity .15s,box-shadow .1s',
                      }}
                    >
                      <div style={{width:8,height:8,borderRadius:2,background:ua.color,flexShrink:0}}/>
                      <span style={{fontSize:10,fontWeight:600,color:ua.color,flex:1}}>{ua.label}</span>
                      <span style={{fontSize:8,padding:'1px 3px',borderRadius:2,fontWeight:700,flexShrink:0,
                        background:ua.attr?'#ede9fe':'#f0fdf4',color:ua.attr?'#7c3aed':'#16a34a'}}>{ua.attr?'A':'S'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Asignación masiva */}
            {selectedFloors.length>0 && (
              <div style={{marginTop:10,padding:10,background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:6}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--accent)',marginBottom:6}}>
                  {selectedFloors.length} planta{selectedFloors.length>1?'s':''} sel.
                </div>
                <div style={{maxHeight:160,overflowY:'auto'}}>
                  {USOS_PPAL.map(u=>(
                    <button key={u.id} onClick={()=>bulkAssign(u.id)}
                      style={{display:'block',width:'100%',padding:'4px 8px',marginBottom:3,
                        background:u.bg,color:u.color,border:`1px solid ${u.bd}`,
                        borderRadius:4,fontSize:10,cursor:'pointer',fontFamily:'inherit',textAlign:'left',fontWeight:600}}>
                      {u.label}
                    </button>
                  ))}
                </div>
                <button onClick={()=>setSelectedFloors([])}
                  style={{display:'block',width:'100%',padding:'4px 8px',marginTop:4,
                    background:'none',color:'var(--text4)',border:'1px solid var(--border)',
                    borderRadius:4,fontSize:10,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* ── GRID PLANTAS ── */}
          <div style={{flex:1,minWidth:0}}>
            {/* Cabecera */}
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

              return (
                <div key={floor.id}
                  onDragOver={e=>onDragOver(e,floor.id)}
                  onDragLeave={()=>setDragTarget(null)}
                  onDrop={e=>{
                    e.preventDefault(); setDragTarget(null)
                    if(!dragging) return
                    const isUA = UA_ALL.find(u=>u.id===dragging)
                    if(isUA){ assignAdicional(floor.id,dragging); setDragging(null); return }
                    const used2=floor.principal.reduce((s,u)=>s+u.sup,0)
                    const avail2=floor.sup-used2
                    if(avail2<=0){ setSplitModal({floorId:floor.id,usoId:dragging}); setSplitSup('') }
                    else{ assignPrincipal(floor.id,dragging,avail2) }
                    setDragging(null)
                  }}
                  style={{
                    display:'grid',gridTemplateColumns:'22px 52px 1fr 90px',
                    borderBottom:'1px solid var(--border)',
                    background:isTgt?'#eff6ff':isSel?'#f0f9ff':'var(--surface)',
                    outline:isTgt?'1.5px solid var(--accent)':'none',
                    transition:'background .1s',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',paddingTop:4}}>
                    <input type="checkbox" checked={isSel}
                      onChange={()=>setSelectedFloors(p=>p.includes(floor.id)?p.filter(x=>x!==floor.id):[...p,floor.id])}
                      style={{width:11,height:11,cursor:'pointer'}}/>
                  </div>

                  {/* Label planta */}
                  <div style={{padding:'6px 8px',fontSize:12,fontWeight:700,color:'var(--text3)',display:'flex',alignItems:'flex-start',paddingTop:10}}>{floor.id}</div>

                  {/* Columna central: uso principal + adicionales */}
                  <div style={{padding:'4px 4px 4px 0',display:'flex',flexDirection:'column',gap:4}}>

                    {/* Fila 1: barras de uso principal */}
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
                              <div key={i}
                                title={`${info.label} · ${u.sup.toLocaleString('es-ES')} m²`}
                                onClick={()=>{if(isEd)setEditFloor(null);else{setEditFloor({floorId:floor.id,idx:i,layer:'principal'});setEditSup(String(u.sup))}}}
                                style={{width:wpct,background:info.bg,border:`1px solid ${info.bd}`,borderRadius:4,
                                  display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
                                  flexShrink:0,overflow:'hidden',transition:'filter .1s'}}
                              >
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

                    {/* Fila 2: chips de usos adicionales */}
                    {hasAdic && (
                      <div style={{display:'flex',flexWrap:'wrap',gap:3,paddingBottom:4}}>
                        {floor.adicional.map((ua,i)=>{
                          const info = uaInfo(ua.uso)
                          const isEd = editFloor?.floorId===floor.id&&editFloor?.idx===i&&editFloor?.layer==='adicional'
                          return (
                            <div key={i} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',
                              background:info.bg,border:`1px solid ${info.bd}`,borderRadius:10,
                              fontSize:9,color:info.color,fontWeight:600}}>
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
                              <button onClick={()=>removeItem(floor.id,i,'adicional')}
                                style={{background:'none',border:'none',cursor:'pointer',color:info.color,fontSize:10,lineHeight:1,padding:'0',opacity:.6}}>✕</button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Sup total — editable sólo desde Uso principal */}
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
                      <span
                        title="Clic para editar superficie total"
                        onClick={()=>{setEditFloorSup(floor.id);setEditFloorSupVal(String(floor.sup))}}
                        style={{cursor:'pointer',borderBottom:'1px dotted var(--text4)'}}>
                        {floor.sup.toLocaleString('es-ES')} m²
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Barra de asignación */}
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
        const ownerSet = [...new Set((edif.prop||[]).flatMap(r=>r.units.map(u=>u.n)))]
        const ownerColor = (n) => PROP_COLORS[ownerSet.indexOf(n)%PROP_COLORS.length]
        // Helper: upsert a prop row on drop
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

            {/* ── SIDEBAR PROPIETARIOS ── */}
            <div style={{width:160,flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',padding:'5px 2px',marginBottom:6}}>Propietarios</div>
              <div style={{maxHeight:320,overflowY:'auto',paddingRight:2}}>
                {ownerSet.length===0 ? (
                  <div style={{fontSize:10,color:'var(--text4)',lineHeight:1.5,padding:'4px 0'}}>Aún no hay propietarios</div>
                ) : ownerSet.map((n,i)=>{
                  const col = PROP_COLORS[i%PROP_COLORS.length]
                  return (
                    <div key={n} draggable
                      onDragStart={()=>setDragging(n)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{
                        display:'flex',alignItems:'center',gap:7,padding:'6px 9px',marginBottom:4,
                        borderRadius:6,cursor:'grab',userSelect:'none',
                        border:`1px solid ${dragging===n?col:col+'88'}`,background:col+'18',
                        opacity:dragging&&dragging!==n?.4:1,
                        boxShadow:dragging===n?`0 2px 8px ${col}44`:'none',
                        transition:'opacity .15s,box-shadow .1s',
                      }}
                    >
                      <div style={{width:9,height:9,borderRadius:2,background:col,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:col,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n}</span>
                    </div>
                  )
                })}
              </div>
              <button style={{marginTop:8,padding:'5px 8px',background:'none',border:'1px dashed var(--border)',borderRadius:5,fontSize:10,color:'var(--text4)',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                + Añadir propietario
              </button>
            </div>

            {/* ── GRID PLANTAS (driven by edif.floors) ── */}
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
                    onDrop={e=>{
                      e.preventDefault();setDragTarget(null)
                      if(!dragging||!ownerSet.includes(dragging)) return
                      dropProp(floor.id, floor.sup, dragging)
                      setDragging(null)
                    }}
                    style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',borderBottom:'1px solid var(--border)',minHeight:44,
                      background:isTgt?'#eff6ff':isEmpty?'var(--gray-lt)':'var(--surface)',
                      outline:isTgt?'1.5px solid var(--accent)':'none',transition:'background .1s'}}>

                    <div style={{padding:'6px 8px',fontSize:12,fontWeight:700,color:isEmpty?'var(--text4)':'var(--text3)',display:'flex',alignItems:'center'}}>{floor.id}</div>

                    <div style={{display:'flex',flexDirection:'column',gap:3,padding:'5px 4px 5px 0'}}>
                      {/* Referencia uso principal (gris tenue) */}
                      {floor.principal.length>0 && (
                        <div style={{display:'flex',gap:1,height:6,borderRadius:2,overflow:'hidden',opacity:.35}}>
                          {floor.principal.map((u,i)=>{
                            const info=usoInfo(u.uso)
                            return <div key={i} style={{width:`${(u.sup/floor.sup)*100}%`,background:info.color,flexShrink:0}}/>
                          })}
                        </div>
                      )}
                      {/* Bloques de propietario */}
                      <div style={{display:'flex',alignItems:'stretch',gap:2,minHeight:34}}>
                        {isEmpty ? (
                          <div style={{flex:1,background:isTgt?'var(--accent-lt)':'transparent',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,
                            color:isTgt?'var(--accent)':'var(--text4)',gap:5}}>
                            {isTgt?'⬇ Soltar propietario':'Sin propietario asignado — arrastra aquí'}
                          </div>
                        ) : (
                          <>
                            {units.map((u,i)=>{
                              const col = ownerColor(u.n)
                              const wpct = `${(u.sup/rowSup)*100}%`
                              const isEd = editPA?.layer==='prop' && editPA?.rowP===floor.id && editPA?.idx===i
                              return (
                                <div key={i}
                                  title={`${u.n} · ${u.sup.toLocaleString('es-ES')} m²`}
                                  onClick={()=>{if(isEd)setEditPA(null);else{setEditPA({layer:'prop',rowP:floor.id,idx:i});setEditPASup(String(u.sup))}}}
                                  style={{width:wpct,background:col+'18',border:`1px solid ${col}88`,borderRadius:4,
                                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                                    cursor:'pointer',flexShrink:0,overflow:'hidden',padding:'3px 4px',gap:1}}
                                >
                                  {isEd ? (
                                    <div style={{display:'flex',gap:3,padding:'0 4px'}} onClick={e=>e.stopPropagation()}>
                                      <input type="number" value={editPASup} onChange={e=>setEditPASup(e.target.value)} autoFocus
                                        onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                                        style={{width:58,padding:'2px 4px',fontSize:9,border:`1px solid ${col}`,borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                      <button onClick={savePASup} style={{padding:'2px 4px',background:col,color:'#fff',border:'none',borderRadius:3,fontSize:8,cursor:'pointer'}}>✓</button>
                                    </div>
                                  ) : (
                                    <>
                                      <span style={{fontSize:10,fontWeight:700,color:col,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center',padding:'0 3px'}}>{u.n}</span>
                                      <span style={{fontSize:9,color:col,opacity:.7,fontFamily:'var(--mono)'}}>{u.sup.toLocaleString('es-ES')} m²</span>
                                    </>
                                  )}
                                </div>
                              )
                            })}
                            {unassigned>0 && (
                              <div style={{flex:1,minWidth:20,background:isTgt?'var(--accent-lt)':'var(--gray-lt)',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,
                                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                                fontSize:9,color:isTgt?'var(--accent)':'var(--text4)',gap:1,padding:'2px 4px'}}>
                                <span>{unassigned.toLocaleString('es-ES')} m²</span>
                                <span style={{fontSize:8}}>sin asignar</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{padding:'6px 8px',fontSize:11,fontWeight:600,color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'flex-end',fontFamily:'var(--mono)'}}>
                      {rowSup.toLocaleString('es-ES')} m²
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ══ ARRENDATARIOS ══ */}
      {view==='arr' && (()=>{
        const tenantSet = [...new Set((edif.arr||[]).flatMap(r=>r.units.filter(u=>u.type==='ten'||u.type==='rt'||u.type==='pk').map(u=>u.n)))]
        const ARR_COLORS = ['#1e40af','#0f766e','#7c3aed','#b45309','#be185d','#065f46']
        const tenantColor = (n) => ARR_COLORS[tenantSet.indexOf(n)%ARR_COLORS.length]
        const TYPE_COLORS = {
          ten: {bg:'#dbeafe',bd:'#93c5fd',col:'#1e40af'},
          vac: {bg:'#fff8ec',bd:'#fcd34d',col:'#d97706'},
          com: {bg:'#dcfce7',bd:'#86efac',col:'#15803d'},
          rt:  {bg:'#fce7f3',bd:'#fbcfe8',col:'#ec4899'},
          pk:  {bg:'#f1f5f9',bd:'#94a3b8',col:'#475569'},
        }
        const typeLabel = (u) => {
          if(u.type==='vac') return `Disponible${u.oferta?` · ${u.oferta}`:''}`
          return u.n
        }
        return (
          <div style={{display:'flex',gap:16}}>

            {/* ── SIDEBAR ARRENDATARIOS ── */}
            <div style={{width:160,flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',padding:'5px 2px',marginBottom:6}}>Arrendatarios</div>
              <div style={{maxHeight:200,overflowY:'auto',paddingRight:2}}>
                {tenantSet.length===0 ? (
                  <div style={{fontSize:10,color:'var(--text4)',lineHeight:1.5,padding:'4px 0'}}>Aún no hay arrendatarios</div>
                ) : tenantSet.map((n,i)=>{
                  const col = ARR_COLORS[i%ARR_COLORS.length]
                  return (
                    <div key={n} draggable
                      onDragStart={()=>setDragging('ten:'+n)}
                      onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                      style={{
                        display:'flex',alignItems:'center',gap:7,padding:'6px 9px',marginBottom:4,
                        borderRadius:6,cursor:'grab',userSelect:'none',
                        border:`1px solid ${col}88`,background:col+'18',
                        opacity:dragging&&dragging!=='ten:'+n?.4:1,
                        boxShadow:dragging==='ten:'+n?`0 2px 8px ${col}44`:'none',
                        transition:'opacity .15s,box-shadow .1s',
                      }}
                    >
                      <div style={{width:9,height:9,borderRadius:2,background:col,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:col,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n}</span>
                    </div>
                  )
                })}
              </div>
              <button style={{marginTop:4,padding:'5px 8px',background:'none',border:'1px dashed var(--border)',borderRadius:5,fontSize:10,color:'var(--text4)',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                + Añadir arrendatario
              </button>
              <div style={{borderTop:'1px solid var(--border)',marginTop:10,paddingTop:8}}>
                <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Disponibles</div>
                {[['vac','#d97706','#fff8ec','Disponible / Oferta'],['com','#15803d','#dcfce7','Zona común'],['rt','#ec4899','#fce7f3','Retail'],['pk','#475569','#f1f5f9','Parking']].map(([type,col,bg,lbl])=>(
                  <div key={type} draggable
                    onDragStart={()=>setDragging('type:'+type)}
                    onDragEnd={()=>{setDragging(null);setDragTarget(null)}}
                    style={{
                      display:'flex',alignItems:'center',gap:7,padding:'5px 9px',marginBottom:3,
                      borderRadius:5,cursor:'grab',userSelect:'none',
                      border:`1px solid ${col}66`,background:bg,
                      opacity:dragging&&dragging!=='type:'+type?.4:1,
                      transition:'opacity .15s',
                    }}
                  >
                    <div style={{width:8,height:8,borderRadius:2,background:col,flexShrink:0}}/>
                    <span style={{fontSize:10,fontWeight:600,color:col}}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── GRID PLANTAS (driven by edif.floors) ── */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',background:'var(--gray-lt)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Planta</div>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Arrendatario / Disponible — arrastra desde el panel izquierdo · clic en bloque para editar</div>
                <div style={{padding:'5px 8px',fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',textAlign:'right'}}>Sup. total</div>
              </div>
              {edif.floors.map(floor=>{
                const arrRow  = (edif.arr||[]).find(r=>r.p===floor.id)
                const units   = arrRow?.units || []
                const rowSup  = arrRow?.sup ?? floor.sup
                const assigned = units.reduce((s,u)=>s+u.sup,0)
                const isEmpty = units.length===0
                const isTgt   = dragTarget===floor.id
                // upsert helper for arr
                const dropArr = (newUnit) => {
                  updBuilding(b=>{
                    const exists=(b.arr||[]).find(r=>r.p===floor.id)
                    if(exists){
                      const avail=exists.sup-exists.units.reduce((s,u)=>s+u.sup,0)
                      if(avail<=0) return b
                      const unit={...newUnit,sup:avail}
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
                      if(dragging.startsWith('ten:')){
                        dropArr({type:'ten',n:dragging.slice(4)})
                      } else if(dragging.startsWith('type:')){
                        const type=dragging.slice(5)
                        dropArr(type==='vac'?{type:'vac',oferta:''}:type==='com'?{type:'com',n:'Zona común'}:type==='rt'?{type:'rt',n:'Retail'}:{type:'pk',n:'Parking'})
                      }
                      setDragging(null)
                    }}
                    style={{display:'grid',gridTemplateColumns:'52px 1fr 90px',borderBottom:'1px solid var(--border)',minHeight:52,
                      background:isTgt?'#eff6ff':isEmpty?'var(--gray-lt)':'var(--surface)',
                      outline:isTgt?'1.5px solid var(--accent)':'none',transition:'background .1s'}}>

                    <div style={{padding:'6px 8px',fontSize:12,fontWeight:700,color:isEmpty?'var(--text4)':'var(--text3)',display:'flex',alignItems:'center'}}>{floor.id}</div>

                    <div style={{display:'flex',flexDirection:'column',gap:3,padding:'5px 4px 5px 0'}}>
                      {/* Referencia uso principal (gris tenue) */}
                      {floor.principal.length>0 && (
                        <div style={{display:'flex',gap:1,height:6,borderRadius:2,overflow:'hidden',opacity:.35}}>
                          {floor.principal.map((u,i)=>{
                            const info=usoInfo(u.uso)
                            return <div key={i} style={{width:`${(u.sup/floor.sup)*100}%`,background:info.color,flexShrink:0}}/>
                          })}
                        </div>
                      )}
                      {/* Bloques de arrendatario */}
                      <div style={{display:'flex',alignItems:'stretch',gap:2,minHeight:42}}>
                        {isEmpty ? (
                          <div style={{flex:1,background:isTgt?'var(--accent-lt)':'transparent',border:`1px dashed ${isTgt?'var(--accent)':'var(--border)'}`,borderRadius:4,
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,
                            color:isTgt?'var(--accent)':'var(--text4)',gap:5}}>
                            {isTgt?'⬇ Soltar aquí':'Sin asignación — arrastra un arrendatario o disponible'}
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
                                  onClick={()=>{if(isEd)setEditPA(null);else{setEditPA({layer:'arr',rowP:floor.id,idx:i});setEditPASup(String(u.sup))}}}
                                  style={{width:wpct,background:bg,border:`1px solid ${bd}`,borderRadius:4,
                                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                                    cursor:'pointer',flexShrink:0,overflow:'hidden',padding:'4px 6px',gap:2,minHeight:42}}
                                >
                                  {isEd ? (
                                    <div style={{display:'flex',gap:3,padding:'0 4px'}} onClick={e=>e.stopPropagation()}>
                                      <input type="number" value={editPASup} onChange={e=>setEditPASup(e.target.value)} autoFocus
                                        onKeyDown={e=>{if(e.key==='Enter')savePASup();if(e.key==='Escape')setEditPA(null)}}
                                        style={{width:58,padding:'2px 4px',fontSize:9,border:`1px solid ${col}`,borderRadius:3,fontFamily:'var(--mono)',textAlign:'right'}}/>
                                      <button onClick={savePASup} style={{padding:'2px 4px',background:col,color:'#fff',border:'none',borderRadius:3,fontSize:8,cursor:'pointer'}}>✓</button>
                                    </div>
                                  ) : (
                                    <>
                                      <span style={{fontSize:10,fontWeight:700,color:col,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>{label}</span>
                                      <span style={{fontSize:9,color:col,opacity:.75,fontFamily:'var(--mono)',fontWeight:600}}>{u.sup.toLocaleString('es-ES')} m²</span>
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

                    <div style={{padding:'6px 8px',fontSize:11,fontWeight:600,color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'flex-end',fontFamily:'var(--mono)'}}>
                      {rowSup.toLocaleString('es-ES')} m²
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ══ MODAL SPLIT ══ */}
      {splitModal&&(()=>{
        const floor=edif.floors.find(f=>f.id===splitModal.floorId)
        const info=usoInfo(splitModal.usoId)
        return (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}
            onClick={()=>setSplitModal(null)}>
            <div style={{background:'var(--surface)',borderRadius:'var(--r2)',padding:20,width:310,boxShadow:'0 8px 32px rgba(0,0,0,.18)'}}
              onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:'var(--text1)'}}>Dividir planta {floor?.id}</div>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:12,lineHeight:1.5}}>
                La planta está completa. Indica cuántos m² asignar a <strong style={{color:info.color}}>{info.label}</strong> — el último uso existente se reducirá proporcionalmente.
              </div>
              <input type="number" placeholder="m² a asignar" value={splitSup} onChange={e=>setSplitSup(e.target.value)}
                autoFocus
                style={{width:'100%',padding:'7px 10px',border:'1px solid var(--border)',borderRadius:5,fontSize:12,
                  fontFamily:'var(--mono)',marginBottom:10,boxSizing:'border-box'}}
                onKeyDown={e=>{if(e.key==='Enter')document.getElementById('sp-split-confirm')?.click()}}
              />
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setSplitModal(null)}
                  style={{padding:'6px 14px',background:'none',border:'1px solid var(--border)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                  Cancelar
                </button>
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

/* ── Tab: Información general ── */
function TabInfo({ navigate, plazas }) {
  const totalPlazas = plazas.reduce((s,p)=>s+p.cantidad,0)
  const byUbic = UBICACIONES.map(u=>({u, n:plazas.filter(p=>p.ubicacion===u).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
  const byTipo = TIPOS_PLAZA.map(t=>({t, n:plazas.filter(p=>p.tipo===t).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
  const byVeh  = TIPOS_VEHICULO.map(v=>({v, n:plazas.filter(p=>p.vehiculo===v).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
  return (
    <div className="tab-content active">
      <div className="info-pad">

        {/* ── Fila 1: UBICACIÓN + TIPOLOGÍA ── */}
        <div className="info-2col" style={{marginBottom:12}}>
          <div className="info-block">
            <div className="ib-title">📍 UBICACIÓN</div>
            <div className="ir"><span className="ir-k">Dirección</span><span className="ir-v">Calle Santa Leonor 65</span></div>
            <div className="ir"><span className="ir-k">Nombre edificio</span><span className="ir-v">P.E Avalon</span></div>
            <div className="ir"><span className="ir-k">Ciudad</span><span className="ir-v">Madrid</span></div>
            <div className="ir"><span className="ir-k">País</span><span className="ir-v">España</span></div>
            <div className="zona-box">
              <div className="zona-cell"><div className="zona-lbl">Área</div><div className="zona-val">Centro</div></div>
              <div className="zona-cell"><div className="zona-lbl">Zona</div><div className="zona-val">M-30</div></div>
              <div className="zona-cell"><div className="zona-lbl">Sub-zona</div><div className="zona-val">M.Álvaro</div></div>
            </div>
          </div>

          <div className="info-block">
            <div className="ib-title">🏢 TIPOLOGÍA</div>
            <div className="ir"><span className="ir-k">Tipo de activo</span><span className="ir-v"><span className="tag tag-gray">Construcción existente</span></span></div>
            <div className="ir"><span className="ir-k">Estado</span><span className="ir-v"><span className="tag tag-green">Activo</span></span></div>
            <div className="ir"><span className="ir-k">Uso principal</span><span className="ir-v"><span className="tag tag-blue">Oficinas</span></span></div>
            <div className="ir"><span className="ir-k">SBA (m²)</span><span className="ir-v" style={{fontSize:14,fontWeight:700}}>46.956</span></div>
            <div className="ir"><span className="ir-k">Calidad</span><span className="ir-v"><span className="tag tag-amber">Prime</span></span></div>
            <div className="ir"><span className="ir-k">Año construcción</span><span className="ir-v">2003 · Rehab: 2018</span></div>
            <div className="ir"><span className="ir-k">Nº edificios</span><span className="ir-v">4</span></div>
            {totalPlazas>0 && (
              <div className="ir" style={{alignItems:'flex-start',paddingTop:6,borderTop:'1px solid var(--border)',marginTop:4}}>
                <span className="ir-k">🅿 Plazas apar.</span>
                <span className="ir-v" style={{display:'flex',flexDirection:'column',gap:3}}>
                  <span style={{fontSize:15,fontWeight:700,color:'var(--text1)',fontFamily:'var(--mono)',lineHeight:1}}>{totalPlazas.toLocaleString('es-ES')}</span>
                  <span style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:2}}>
                    {byUbic.map(x=>(
                      <span key={x.u} style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#f1f5f9',border:'1px solid #cbd5e1',color:'#475569',fontWeight:600}}>{x.u} {x.n}</span>
                    ))}
                    {byTipo.map(x=>(
                      <span key={x.t} style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#ede9fe',border:'1px solid #c4b5fd',color:'#7c3aed',fontWeight:600}}>{x.t} {x.n}</span>
                    ))}
                    {byVeh.map(x=>(
                      <span key={x.v} style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#f0fdf4',border:'1px solid #86efac',color:'#15803d',fontWeight:600}}>{x.v} {x.n}</span>
                    ))}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── DATOS URBANÍSTICOS ── */}
        <div className="info-block" style={{marginBottom:12}}>
          <div className="ib-title">
            🏛 DATOS URBANÍSTICOS
            <span className="ir-v link" style={{fontSize:10}}>Consultar Visor ↗</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 24px'}}>
            <div>
              <div className="ir"><span className="ir-k">Ref. catastral</span><span className="ir-v link mono" style={{fontSize:10}}>1380341VK4718A0001FU</span></div>
              <div className="ir"><span className="ir-k">Uso PGOU</span><span className="ir-v">Terciario / Oficinas</span></div>
            </div>
            <div>
              <div className="ir"><span className="ir-k">Clasificación</span><span className="ir-v">Suelo urbano consolidado</span></div>
              <div className="ir"><span className="ir-k">Calificación</span><span className="ir-v">ZVD — Zona Verde / Dotacional</span></div>
            </div>
            <div>
              <div className="ir"><span className="ir-k">Edificabilidad</span><span className="ir-v">1,5 m²t/m²s</span></div>
              <div className="ir"><span className="ir-k">Sup. parcela (m²)</span><span className="ir-v">12.400</span></div>
            </div>
          </div>
        </div>

        {/* ── SEGUIMIENTO COMERCIAL ── */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:12}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:11,fontWeight:600}}>📋 Seguimiento comercial</div>
            <button className="ab-btn blue" style={{padding:'3px 9px',fontSize:10}}>+ Registrar</button>
          </div>
          <div className="seg-2col">
            <div className="seg-block">
              <div className="seg-head">Presentaciones</div>
              <table className="seg-table">
                <thead><tr><th>Fecha</th><th>Demanda</th><th>Consultor</th><th>Feedback</th></tr></thead>
                <tbody>
                  <tr><td>01/03/2026</td><td>Oracle Spain</td><td>Álvaro S.</td><td className="fb-fin">Finalista</td></tr>
                  <tr><td>12/02/2026</td><td>Empresa XYZ</td><td>Álvaro S.</td><td className="fb-cur">En curso</td></tr>
                  <tr><td>20/01/2026</td><td>Generali RE</td><td>María R.</td><td style={{color:'var(--green)',fontWeight:600}}>Firmado</td></tr>
                </tbody>
              </table>
            </div>
            <div className="seg-block">
              <div className="seg-head">Visitas</div>
              <table className="seg-table">
                <thead><tr><th>Fecha</th><th>Demanda</th><th>M²</th><th>Feedback</th></tr></thead>
                <tbody>
                  <tr><td>15/03/2026</td><td>Oracle Spain</td><td>13.486</td><td className="fb-fin">Finalista</td></tr>
                  <tr><td>28/02/2026</td><td>Empresa XYZ</td><td>1.000</td><td className="fb-cur">En curso</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── TRANSACCIONES Y OFERTAS ── */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:11,fontWeight:600}}>📄 Transacciones y ofertas activas</div>
            <button className="ab-btn blue" style={{padding:'3px 9px',fontSize:10}}>+ Nueva oferta</button>
          </div>
          <table className="dtbl">
            <thead><tr><th>Nº Oferta</th><th>Módulo</th><th>Sup. (m²)</th><th>Renta asking</th><th>Días comerc.</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              <tr>
                <td className="mono dtbl-link" onClick={()=>navigate('ficha-oferta')}>OLB001</td>
                <td>P5 + PB — Edif. A</td>
                <td>698</td>
                <td className="mono">10,5–14,5 €/m²</td>
                <td><span className="dias-pill">📅 127d</span></td>
                <td><span className="tag tag-blue">En curso</span></td>
                <td><button className="ra p" onClick={()=>navigate('ficha-oferta')}>Ver</button></td>
              </tr>
              <tr>
                <td className="mono dtbl-link">OLB002</td>
                <td>P2 — Edif. A</td>
                <td>400</td>
                <td className="mono">13,0 €/m²</td>
                <td><span className="dias-pill">📅 45d</span></td>
                <td><span className="tag tag-amber">En revisión</span></td>
                <td><button className="ra">Ver</button></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

/* ── Panel derecho ── */
function RightPanel({ navigate }) {
  return (
    <div className="ficha-right">

      {/* Mapa */}
      <div className="rp-sec">
        <div className="rp-lbl">Ubicación</div>
        <div className="map-ph">
          <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>M-30 · Madrid</div>
          <div style={{fontSize:10,color:'var(--text3)'}}>Calle Santa Leonor 65</div>
          <div style={{fontSize:10,background:'var(--accent)',color:'#fff',padding:'3px 8px',borderRadius:4,marginTop:2}}>Ver en Google Maps</div>
        </div>
        <div className="kf-grid">
          <div className="kf"><div className="kf-lbl">Renta zona</div><div className="kf-val">10,5 €/m²</div></div>
          <div className="kf"><div className="kf-lbl">Disponibilidad zona</div><div className="kf-val amber">11,4%</div></div>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="rp-sec">
        <div className="rp-lbl">KPIs Financieros</div>
        <div className="kf-grid">
          <div className="kf"><div className="kf-lbl">SBA total</div><div className="kf-val">46.956 m²</div></div>
          <div className="kf"><div className="kf-lbl">Ocupación</div><div className="kf-val amber">78,4%</div></div>
          <div className="kf"><div className="kf-lbl">Ingresos brutos</div><div className="kf-val">3,2 M€/año</div></div>
          <div className="kf"><div className="kf-lbl">WAULT</div><div className="kf-val">2,8 años</div></div>
          <div className="kf"><div className="kf-lbl">Yield</div><div className="kf-val">5,2%</div></div>
          <div className="kf"><div className="kf-lbl">Precio compra</div><div className="kf-val">130 M€</div></div>
        </div>
      </div>

      {/* Vencimientos con timeline */}
      <div className="rp-sec">
        <div className="rp-lbl">Vencimientos contractuales</div>
        {[
          {color:'var(--red)',   label:'Celonis — Break option', sub:'Oct 2025 · 2.702 m²',     urgency:'Vencido'},
          {color:'var(--amber)', label:'Oracle — Contrato',      sub:'Mar 2026 · 13.486 m²',    urgency:'Próximo'},
          {color:'var(--amber)', label:'Empresa XYZ — Break',    sub:'Dic 2026 · 1.000 m²',     urgency:'6 meses'},
          {color:'var(--gray)',  label:'Repsol — Break option',  sub:'Jun 2027 · 1.967 m²',     urgency:''},
        ].map((v,i)=>(
          <div key={i} className="venc-item">
            <div className="vd" style={{background:v.color,marginTop:4}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:500,color:v.color==='var(--gray)'?'var(--text)':v.color}}>{v.label}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>{v.sub}</div>
            </div>
            {v.urgency && <span style={{fontSize:9,fontWeight:600,color:v.color,background:v.color==='var(--red)'?'var(--red-lt)':v.color==='var(--amber)'?'var(--amber-lt)':'var(--gray-lt)',border:`1px solid ${v.color==='var(--red)'?'var(--red-bd)':v.color==='var(--amber)'?'var(--amber-bd)':'var(--gray-bd)'}`,padding:'1px 5px',borderRadius:8,whiteSpace:'nowrap'}}>{v.urgency}</span>}
          </div>
        ))}
      </div>

      {/* Proyectos en curso */}
      <div className="rp-sec">
        <div className="rp-lbl">Proyectos en curso</div>
        {[
          {ico:'🏗',label:'Reforma integral lobby',sub:'Arquitectura · En curso',color:'var(--amber)'},
          {ico:'📋',label:'Mandato captación P4-P5',sub:'Leasing · Activo',color:'var(--accent)'},
        ].map((p,i)=>(
          <div key={i} className="proj-item">
            <div style={{width:26,height:26,borderRadius:5,background:'var(--gray-lt)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>{p.ico}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:500,color:'var(--text)'}}>{p.label}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>{p.sub}</div>
            </div>
            <div style={{width:6,height:6,borderRadius:'50%',background:p.color,flexShrink:0,marginTop:5}}/>
          </div>
        ))}
        <span className="add-link">+ Añadir proyecto</span>
      </div>

      {/* Historial proyectos */}
      <div className="rp-sec">
        <div className="rp-lbl">Historial</div>
        {[
          {tag:'tag-teal',  label:'Transacción', desc:'Repsol — Renovación',   fecha:'Mar 2022'},
          {tag:'tag-blue',  label:'Mandato',     desc:'Exclusiva leasing 2023', fecha:'Ene 2023'},
          {tag:'tag-amber', label:'Valoración',  desc:'Anual Q1 2026',          fecha:'Mar 2026'},
        ].map((h,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:6,padding:'4px 0',borderBottom:i<2?'1px solid var(--border)':'none'}}>
            <span className={`tag ${h.tag}`} style={{fontSize:9,marginTop:1,flexShrink:0}}>{h.label}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:'var(--text2)'}}>{h.desc}</div>
              <div style={{fontSize:10,color:'var(--text4)'}}>{h.fecha}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Asistente IA */}
      <div className="rp-sec">
        <div className="rp-lbl">Asistente IA</div>
        <div className="ai-box">
          <div className="ai-head">
            <div className="ai-ico">✦</div>
            <span className="ai-lbl">Insight activo</span>
            <span className="ai-badge">Tiempo real</span>
          </div>
          <div className="ai-text">
            <strong>10.142 m² disponibles</strong> (21,6%). 2 break options vencidas o próximas. Renta zona 10,5 €/m² — margen de subida. Oracle en fase finalista para P1–P4.
          </div>
          <div className="ai-cta">✎ Preguntar a la IA</div>
        </div>
      </div>

      {/* Propietario y contactos */}
      <div className="rp-sec">
        <div className="rp-lbl">Propietario</div>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
          <div style={{width:28,height:28,borderRadius:6,background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'var(--accent)',flexShrink:0}}>BC</div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>Barings Core Spain SOCIMI</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>Fondo inversión · Yield 5,2%</div>
          </div>
        </div>
        <div className="cont-row">
          <div className="c-av" style={{background:'#dbeafe',color:'#1e40af'}}>AS</div>
          <div><div className="c-name">Sierra Álvaro</div><div className="c-role">Transaction Spain · Responsable</div></div>
        </div>
        <div className="cont-row">
          <div className="c-av" style={{background:'#fce7f3',color:'#9d174d'}}>MR</div>
          <div><div className="c-name">María Ruiz</div><div className="c-role">Leasing Oficinas MAD</div></div>
        </div>
      </div>

      {/* Documentos recientes */}
      <div className="rp-sec">
        <div className="rp-lbl">Documentos recientes</div>
        {[
          {ico:'📊',name:'Dossier Avalon',fecha:'07/02/2026',tag:'Comercial',tagCls:'tag-blue'},
          {ico:'💰',name:'Valoración Q1 2026',fecha:'20/03/2026',tag:'Valoración',tagCls:'tag-amber'},
          {ico:'📋',name:'Rent Roll 2026',fecha:'01/01/2026',tag:'Comercial',tagCls:'tag-blue'},
        ].map((d,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 0',borderBottom:i<2?'1px solid var(--border)':'none'}}>
            <span style={{fontSize:16,flexShrink:0}}>{d.ico}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:500,color:'var(--accent)',cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
              <div style={{fontSize:10,color:'var(--text4)'}}>{d.fecha}</div>
            </div>
            <span className={`tag ${d.tagCls}`} style={{fontSize:9,flexShrink:0}}>{d.tag}</span>
          </div>
        ))}
        <span className="add-link">Ver todos (8)</span>
      </div>

    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function FichaActivo() {
  const { navigate } = useNav()
  const [activeTab, setActiveTab]       = useState('at-info')
  const [caracTab, setCaracTab]         = useState('ct-estado')
  const [docCat,   setDocCat]           = useState('todos')
  const [showTarea, setShowTarea]       = useState(false)
  const [plazas, setPlazas]             = useState(INIT_PLAZAS)
  const [showAddPlaza, setShowAddPlaza] = useState(false)
  const [newPlaza, setNewPlaza]         = useState({ubicacion:'Interior',tipo:'Simple',vehiculo:'Coches',cantidad:1})
  const addPlaza = () => {
    const c = parseInt(newPlaza.cantidad)||1
    if(c<=0) return
    const maxId = plazas.reduce((m,p)=>Math.max(m,p.id),0)
    setPlazas(prev=>[...prev,{...newPlaza,cantidad:c,id:maxId+1}])
    setNewPlaza({ubicacion:'Interior',tipo:'Simple',vehiculo:'Coches',cantidad:1})
    setShowAddPlaza(false)
  }
  const removePlaza = (id) => setPlazas(prev=>prev.filter(p=>p.id!==id))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>

      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Guardar y cerrar</button>
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn">Desactivar</button>
        <div className="ab-sep"/>
        <button className="ab-btn">Actualizar</button>
        <button className="ab-btn">📄 Plantillas word</button>
        <div className="ab-sep"/>
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* ── HEADER ── */}
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico">🏢</div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span className="ref-badge-activo">ACTIVO</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>MAD-OF-00189</span>
                </div>
                <div className="ah-name">P.E Avalon</div>
                <div className="ah-addr">📍 Calle Santa Leonor 65, 28037 Madrid · Área: Centro · Zona: M-30 · Sub-zona: M.Álvaro</div>
                <div className="ah-tags">
                  <span className="tag tag-blue">Oficinas</span>
                  <span className="tag tag-gray">Construcción existente</span>
                  <span className="tag tag-leed">LEED Gold</span>
                  <span className="tag tag-esg">ESG A</span>
                  <span className="tag tag-gray">4 edificios</span>
                  <span className="dias-pill">📅 127 días en comercialización</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="tabs">
            {TABS.map((t,i)=>(
              <div key={t} className={`tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>{TAB_LABELS[i]}</div>
            ))}
          </div>

          {/* ── TAB: Información general ── */}
          {activeTab==='at-info' && <TabInfo navigate={navigate} plazas={plazas}/>}

          {/* ── TAB: Stacking Plan ── */}
          {activeTab==='at-stacking' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600}}>Stacking Plan</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>Distribución de usos, propietarios y arrendatarios por planta y edificio</div>
                  </div>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <span style={{fontSize:11,color:'var(--text4)'}}>Disponible: <strong style={{color:'var(--amber)'}}>10.142 m²</strong></span>
                    <span style={{fontSize:11,color:'var(--text4)'}}>·</span>
                    <span style={{fontSize:11,color:'var(--text4)'}}>Ocupado: <strong style={{color:'var(--green)'}}>36.814 m²</strong></span>
                  </div>
                </div>
                <StackingPlan/>
              </div>
            </div>
          )}

          {/* ── TAB: Características ── */}
          {activeTab==='at-caract' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Características técnicas</div>
                <div className="carac-tabs">
                  {[['ct-estado','Estado'],['ct-transporte','Transporte'],['ct-normativa','Normativa / ESG'],['ct-generales','Características generales'],['ct-oficinas','🏢 Oficinas'],['ct-uso','Oficinas (uso)'],['ct-plazas','Plazas']].map(([k,l])=>(
                    <div key={k} className={`ct ${caracTab===k?'active':''}`} onClick={()=>setCaracTab(k)}>{l}</div>
                  ))}
                </div>
                {caracTab==='ct-estado' && (
                  <div className="info-2col">
                    <div className="info-block">
                      <div className="ib-title">DATOS DEL INMUEBLE</div>
                      <div className="ir"><span className="ir-k">Año de construcción</span><span className="ir-v">2003</span></div>
                      <div className="ir"><span className="ir-k">Año de rehabilitación</span><span className="ir-v">2018</span></div>
                      <div className="ir"><span className="ir-k">Estado actual</span><span className="ir-v">Construcción existente</span></div>
                      <div className="ir"><span className="ir-k">Calidad</span><span className="ir-v"><span className="tag tag-amber">Prime</span></span></div>
                      <div className="ir"><span className="ir-k">Nº de edificios</span><span className="ir-v">4</span></div>
                      <div className="ir"><span className="ir-k">Nº plantas sobre rasante</span><span className="ir-v">7</span></div>
                      <div className="ir"><span className="ir-k">Nº plantas bajo rasante</span><span className="ir-v">2</span></div>
                    </div>
                    <div className="info-block">
                      <div className="ib-title">SUPERFICIES</div>
                      <div className="ir"><span className="ir-k">SBA (m²)</span><span className="ir-v" style={{fontWeight:700}}>46.956</span></div>
                      <div className="ir"><span className="ir-k">Sup. neta (m²)</span><span className="ir-v">44.186</span></div>
                      <div className="ir"><span className="ir-k">Ratio de pérdida</span><span className="ir-v">5,9%</span></div>
                      <div className="ir"><span className="ir-k">Sup. planta tipo (m²)</span><span className="ir-v">1.500</span></div>
                      <div className="ir"><span className="ir-k">Sup. parcela (m²)</span><span className="ir-v">12.400</span></div>
                      <div className="ir"><span className="ir-k">Ocupación parcela</span><span className="ir-v">32%</span></div>
                    </div>
                  </div>
                )}
                {caracTab==='ct-transporte' && <div className="info-block"><div className="ib-title">TRANSPORTE</div><div className="ir"><span className="ir-k">Metro (línea)</span><span className="ir-v">L7 · Estadio Olímpico (5 min)</span></div><div className="ir"><span className="ir-k">Autobús</span><span className="ir-v">Líneas 23, 37, 140</span></div><div className="ir"><span className="ir-k">Acceso por coche</span><span className="ir-v">M-30 · A-2</span></div><div className="ir"><span className="ir-k">Bicicleta / BiciMAD</span><span className="ir-v">Estación a 200m</span></div></div>}
                {caracTab==='ct-normativa' && <div className="info-block"><div className="ib-title">NORMATIVA / ESG</div><div className="ir"><span className="ir-k">Certificación energética</span><span className="ir-v">A+</span></div><div className="ir"><span className="ir-k">LEED</span><span className="ir-v">Gold</span></div><div className="ir"><span className="ir-k">BREEAM</span><span className="ir-v">Very Good</span></div><div className="ir"><span className="ir-k">ESG Rating</span><span className="ir-v">A</span></div><div className="ir"><span className="ir-k">Consumo energético</span><span className="ir-v">87 kWh/m²/año</span></div></div>}
                {caracTab==='ct-generales' && <div className="info-block"><div className="ib-title">CARACTERÍSTICAS GENERALES</div><div className="ir"><span className="ir-k">Altura libre</span><span className="ir-v">2,85 m</span></div><div className="ir"><span className="ir-k">Módulo mínimo</span><span className="ir-v">300 m²</span></div><div className="ir"><span className="ir-k">Suelo técnico</span><span className="ir-v">Sí</span></div><div className="ir"><span className="ir-k">Climatización</span><span className="ir-v">Fan-coil 4 tubos</span></div><div className="ir"><span className="ir-k">Seguridad 24h</span><span className="ir-v">Sí</span></div></div>}
                {caracTab==='ct-oficinas' && <div className="info-block"><div className="ib-title">🏢 OFICINAS</div><div className="ir"><span className="ir-k">Configuración</span><span className="ir-v">Planta abierta / diáfana</span></div><div className="ir"><span className="ir-k">Falso techo</span><span className="ir-v">Sí</span></div><div className="ir"><span className="ir-k">Luminosidad</span><span className="ir-v">Alta — fachada acristalada</span></div><div className="ir"><span className="ir-k">Terraza</span><span className="ir-v">Sí (planta 7)</span></div></div>}
                {caracTab==='ct-uso' && <div className="info-block"><div className="ib-title">OFICINAS (USO)</div><div className="ir"><span className="ir-k">Uso actual</span><span className="ir-v">Oficinas corporativas</span></div><div className="ir"><span className="ir-k">Inquilinos actuales</span><span className="ir-v">Celonis, Repsol, Cafetería</span></div><div className="ir"><span className="ir-k">M² ocupados</span><span className="ir-v">36.814 m²</span></div><div className="ir"><span className="ir-k">M² disponibles</span><span className="ir-v">10.142 m²</span></div></div>}
                {caracTab==='ct-plazas' && (()=>{
                  const totalPl = plazas.reduce((s,p)=>s+p.cantidad,0)
                  const byUbicPl = UBICACIONES.map(u=>({u,n:plazas.filter(p=>p.ubicacion===u).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
                  const byTipoPl = TIPOS_PLAZA.map(t=>({t,n:plazas.filter(p=>p.tipo===t).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
                  const byVehPl  = TIPOS_VEHICULO.map(v=>({v,n:plazas.filter(p=>p.vehiculo===v).reduce((s,p)=>s+p.cantidad,0)})).filter(x=>x.n>0)
                  const selStyle = {padding:'5px 9px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit',background:'var(--surface)',color:'var(--text1)',cursor:'pointer'}
                  return (
                    <div className="info-block">
                      {/* Header */}
                      <div className="ib-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span>🅿 PLAZAS DE APARCAMIENTO</span>
                        <button
                          onClick={()=>setShowAddPlaza(v=>!v)}
                          style={{padding:'3px 10px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600,lineHeight:1.4}}>
                          {showAddPlaza?'✕ Cancelar':'+ Añadir'}
                        </button>
                      </div>

                      {/* Formulario de adición */}
                      {showAddPlaza && (
                        <div style={{display:'flex',flexWrap:'wrap',gap:8,padding:'12px 14px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:7,marginBottom:14,alignItems:'flex-end'}}>
                          <div style={{display:'flex',flexDirection:'column',gap:3}}>
                            <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Ubicación</label>
                            <select value={newPlaza.ubicacion} onChange={e=>setNewPlaza(p=>({...p,ubicacion:e.target.value}))} style={selStyle}>
                              {UBICACIONES.map(u=><option key={u}>{u}</option>)}
                            </select>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:3}}>
                            <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Tipo de plaza</label>
                            <select value={newPlaza.tipo} onChange={e=>setNewPlaza(p=>({...p,tipo:e.target.value}))} style={selStyle}>
                              {TIPOS_PLAZA.map(t=><option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:3}}>
                            <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Tipo de vehículo</label>
                            <select value={newPlaza.vehiculo} onChange={e=>setNewPlaza(p=>({...p,vehiculo:e.target.value}))} style={selStyle}>
                              {TIPOS_VEHICULO.map(v=><option key={v}>{v}</option>)}
                            </select>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:3}}>
                            <label style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Cantidad</label>
                            <input type="number" min="1" value={newPlaza.cantidad}
                              onChange={e=>setNewPlaza(p=>({...p,cantidad:e.target.value}))}
                              onKeyDown={e=>{if(e.key==='Enter')addPlaza()}}
                              style={{width:72,padding:'5px 9px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'var(--mono)',textAlign:'right'}}/>
                          </div>
                          <button onClick={addPlaza}
                            style={{padding:'5px 16px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:700,alignSelf:'flex-end'}}>
                            Guardar
                          </button>
                        </div>
                      )}

                      {/* Resumen totales */}
                      {totalPl>0 && (
                        <div style={{display:'grid',gridTemplateColumns:'auto 1fr 1fr 1fr',gap:'8px 20px',padding:'10px 14px',background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:6,marginBottom:14,alignItems:'start'}}>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingRight:16,borderRight:'1px solid var(--border)'}}>
                            <span style={{fontSize:26,fontWeight:800,color:'var(--text1)',fontFamily:'var(--mono)',lineHeight:1}}>{totalPl.toLocaleString('es-ES')}</span>
                            <span style={{fontSize:9,color:'var(--text4)',fontWeight:600,textTransform:'uppercase',marginTop:1}}>Total plazas</span>
                          </div>
                          <div>
                            <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:4}}>Ubicación</div>
                            {byUbicPl.map(x=>(
                              <div key={x.u} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                                <span style={{color:'var(--text3)'}}>{x.u}</span>
                                <span style={{fontWeight:700,fontFamily:'var(--mono)',color:'var(--text1)'}}>{x.n}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:4}}>Tipo plaza</div>
                            {byTipoPl.map(x=>(
                              <div key={x.t} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                                <span style={{color:'var(--text3)'}}>{x.t}</span>
                                <span style={{fontWeight:700,fontFamily:'var(--mono)',color:'var(--text1)'}}>{x.n}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',marginBottom:4}}>Vehículo</div>
                            {byVehPl.map(x=>(
                              <div key={x.v} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                                <span style={{color:'var(--text3)'}}>{x.v}</span>
                                <span style={{fontWeight:700,fontFamily:'var(--mono)',color:'var(--text1)'}}>{x.n}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tabla detalle */}
                      {plazas.length===0 ? (
                        <div style={{padding:'20px 0',textAlign:'center',color:'var(--text4)',fontSize:12}}>
                          No hay plazas registradas — pulsa "+ Añadir" para crear las primeras.
                        </div>
                      ) : (
                        <table className="pat-table">
                          <thead>
                            <tr>
                              <th>Ubicación</th>
                              <th>Tipo plaza</th>
                              <th>Vehículo</th>
                              <th style={{textAlign:'right'}}>Cantidad</th>
                              <th style={{width:32}}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {plazas.map(p=>(
                              <tr key={p.id}>
                                <td>
                                  <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
                                    <span style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#f1f5f9',border:'1px solid #cbd5e1',color:'#475569',fontWeight:600}}>{p.ubicacion}</span>
                                  </span>
                                </td>
                                <td>
                                  <span style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#ede9fe',border:'1px solid #c4b5fd',color:'#7c3aed',fontWeight:600}}>{p.tipo}</span>
                                </td>
                                <td>
                                  <span style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'#f0fdf4',border:'1px solid #86efac',color:'#15803d',fontWeight:600}}>{p.vehiculo}</span>
                                </td>
                                <td style={{textAlign:'right',fontFamily:'var(--mono)',fontWeight:700,fontSize:13}}>{p.cantidad.toLocaleString('es-ES')}</td>
                                <td>
                                  <button onClick={()=>removePlaza(p.id)}
                                    style={{background:'none',border:'none',cursor:'pointer',color:'var(--text4)',fontSize:13,padding:'0 4px',lineHeight:1}}
                                    title="Eliminar">✕</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* ── TAB: Propietarios y arrendatarios ── */}
          {activeTab==='at-prop' && (
            <div className="tab-content active">
              <div className="info-pad">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <div style={{fontSize:14,fontWeight:600}}>Propietarios y Arrendatarios</div>
                  <button className="ab-btn blue">+ Crear tenant</button>
                </div>
                <div className="pat-section-title">PROPIETARIOS</div>
                <table className="pat-table" style={{marginBottom:16}}>
                  <thead><tr><th>Perfil</th><th>Propietario</th><th>SBA</th><th>Yield</th><th>Precio compra</th></tr></thead>
                  <tbody><tr><td>Fondo inversión</td><td><span className="pat-link">Barings Core Spain SOCIMI</span></td><td>46.956</td><td>5.2%</td><td>130 M€</td></tr></tbody>
                </table>
                <div className="pat-section-title">ARRENDATARIOS</div>
                <table className="pat-table" style={{marginBottom:16}}>
                  <thead><tr><th>Arrendatario</th><th>Uso</th><th>Sup. (m²)</th><th>Renta</th><th>Break option</th><th></th></tr></thead>
                  <tbody>
                    <tr><td><span className="pat-link">Celonis</span></td><td>Oficinas</td><td>2.702</td><td>14,50</td><td style={{color:'var(--amber)',fontWeight:600}}>Oct 2025</td><td><button className="ra">Ver</button></td></tr>
                    <tr><td><span className="pat-link">Repsol</span></td><td>Oficinas</td><td>1.967</td><td>13,80</td><td style={{color:'var(--green)',fontWeight:600}}>Jun 2027</td><td><button className="ra">Ver</button></td></tr>
                  </tbody>
                </table>
                <div className="pat-section-title">DISPONIBILIDAD / OFERTA ACTIVA</div>
                <table className="pat-table">
                  <thead><tr><th>Nº Oferta</th><th>Módulo</th><th>Sup. (m²)</th><th>Renta asking</th><th>Días comerc.</th><th>Estado</th><th></th></tr></thead>
                  <tbody>
                    <tr><td className="pat-link" onClick={()=>navigate('ficha-oferta')}>OLB001</td><td>P5 + PB</td><td>698</td><td>10.5–14.5 €/m²</td><td><span className="dias-pill">📅 127d</span></td><td style={{color:'var(--accent)',fontWeight:600}}>En curso</td><td><button className="ra p" onClick={()=>navigate('ficha-oferta')}>Ver</button></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: Fotografías ── */}
          {activeTab==='at-fotos' && (
            <div className="tab-content active"><div className="info-pad">
              <div className="foto-grid">
                <div className="foto-thumb principal">🏢</div>
                <div className="foto-thumb">🏙</div>
                <div className="foto-thumb">🖼</div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Documentos ── */}
          {activeTab==='at-docs' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div style={{fontSize:14,fontWeight:600}}>Documentos</div>
                <button className="ab-btn blue">↑ Cargar</button>
              </div>
              <div className="doc-cats">
                {[['todos','📁','Todos',8],['comercial','📊','Comercial',3],['tecnica','🔧','Técnica',2],['marketing','🎯','Marketing',1],['valoraciones','💰','Valoraciones',1],['arquitectura','📐','Arquitectura',1],['informes','📋','Informes',0]].map(([k,ico,lbl,cnt])=>(
                  <div key={k} className={`doc-cat ${docCat===k?'active':''}`} onClick={()=>setDocCat(k)}>
                    <div className="doc-cat-ico">{ico}</div>
                    <div className="doc-cat-name">{lbl}</div>
                    <div className="doc-cat-count">{cnt}</div>
                  </div>
                ))}
              </div>
              <div className="doc-drop">↑ Arrastra documentos aquí o haz clic para cargar</div>
              <table className="doc-table">
                <thead><tr><th>Documento</th><th>Categorías</th><th>Fecha</th><th>Por</th><th>Tamaño</th><th></th></tr></thead>
                <tbody>
                  <tr><td><span className="doc-link">📊 Dossier Avalon</span></td><td><span className="doc-tag" style={{background:'var(--accent-lt)',color:'var(--accent)'}}>Comercial</span></td><td>07/02/2026</td><td>Álvaro Sierra</td><td>4.2 MB</td><td style={{display:'flex',gap:4}}>⬇ ✏ 🗑</td></tr>
                  <tr><td><span className="doc-link">📈 Stacking plan Q1 2026</span></td><td><span className="doc-tag" style={{background:'var(--accent-lt)',color:'var(--accent)'}}>Comercial</span></td><td>07/02/2026</td><td>Álvaro Sierra</td><td>1.1 MB</td><td style={{display:'flex',gap:4}}>⬇ ✏ 🗑</td></tr>
                  <tr><td><span className="doc-link">💰 Valoración Q1 2026</span></td><td><span className="doc-tag" style={{background:'var(--amber-lt)',color:'var(--amber)'}}>Valoraciones</span></td><td>20/03/2026</td><td>Jorge López</td><td>5.6 MB</td><td style={{display:'flex',gap:4}}>⬇ ✏ 🗑</td></tr>
                  <tr><td><span className="doc-link">📋 Rent Roll 2026</span></td><td><span className="doc-tag" style={{background:'var(--accent-lt)',color:'var(--accent)'}}>Comercial</span></td><td>01/01/2026</td><td>Álvaro Sierra</td><td>680 KB</td><td style={{display:'flex',gap:4}}>⬇ ✏ 🗑</td></tr>
                </tbody>
              </table>
            </div></div>
          )}

          {/* ── TAB: Información adicional ── */}
          {activeTab==='at-adicional' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{fontSize:12,fontWeight:600,marginBottom:12}}>Extracción de datos <span style={{fontSize:10,fontWeight:400,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>· INTEGRACIONES EXTERNAS</span></div>
              <div className="info-2col" style={{marginBottom:20}}>
                <div className="info-block"><div className="ib-title">🏛 Catastro</div><div className="ir"><span className="ir-k">Certificado catastral</span><button className="ab-btn save" style={{padding:'3px 10px',fontSize:10}}>Descargar</button></div><div className="ir"><span className="ir-k">Ref. catastral</span><span className="ir-v link mono" style={{fontSize:10}}>1380341VK4718A0001FU</span></div></div>
                <div className="info-block"><div className="ib-title">📊 INE</div><div className="ir"><span className="ir-k">Estadísticas del barrio</span><button className="ab-btn save" style={{padding:'3px 10px',fontSize:10}}>Descargar</button></div></div>
                <div className="info-block"><div className="ib-title">🗺 Visor Urbanístico</div><div className="ir"><span className="ir-k">PGOU Madrid</span><span className="ir-v link">Abrir ↗</span></div></div>
                <div className="info-block"><div className="ib-title">🏷 Registradores</div><div className="ir"><span className="ir-k">Nota simple informativa</span><button className="ab-btn save" style={{padding:'3px 10px',fontSize:10}}>Solicitar</button></div></div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Vista 360 ── */}
          {activeTab==='at-360' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Vista 360° — Actividad transversal</div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                {[
                  {av:'AI',bg:'var(--purple-lt)',color:'var(--purple)',name:'IA',msg:'10.142 m² disponibles. 2 break options próximas.',badge:{bg:'var(--purple-lt)',color:'var(--purple)',bc:'var(--purple-bd)',lbl:'IA'},time:'Hoy · Automático'},
                  {av:'AS',bg:'#dbeafe',color:'#1e40af',name:'Álvaro Sierra',msg:'registró visita con Oracle',badge:{bg:'var(--accent-lt)',color:'var(--accent)',bc:'var(--accent-bd)',lbl:'VISITA'},time:'Ayer, 16:30'},
                  {av:'MR',bg:'#fce7f3',color:'#9d174d',name:'María Ruiz',msg:'envió Deal Room a Celonis',badge:{bg:'var(--green-lt)',color:'var(--green)',bc:'var(--green-bd)',lbl:'OFERTA'},time:'23/03/2026'},
                  {av:'JL',bg:'#dcfce7',color:'#166534',name:'Jorge López',msg:'subió Valoración Q1 2026',badge:{bg:'var(--gray-lt)',color:'var(--text2)',bc:'var(--gray-bd)',lbl:'DOC'},time:'20/03/2026'},
                ].map((item,i,arr)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 16px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:item.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:item.color,flexShrink:0}}>{item.av}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:'var(--text2)'}}><strong>{item.name}</strong> {item.msg} <span style={{background:item.badge.bg,color:item.badge.color,border:`1px solid ${item.badge.bc}`,padding:'1px 6px',borderRadius:10,fontSize:9,fontWeight:700}}>{item.badge.lbl}</span></div>
                      <div style={{fontSize:10,color:'var(--text4)',marginTop:3}}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div></div>
          )}

          {/* ── TAB: Follow-up ── */}
          {activeTab==='at-followup' && (
            <div className="tab-content active"><div className="info-pad">
              <table className="pat-table">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Contacto</th><th>Notas</th></tr></thead>
                <tbody><tr><td>12/03/2026</td><td><span className="tag tag-blue">Llamada</span></td><td>Asset Manager</td><td>Interés en mandato captación P4-P5</td></tr></tbody>
              </table>
            </div></div>
          )}

        </div>{/* /ficha-main */}

        <RightPanel navigate={navigate}/>

      </div>{/* /ficha-wrap */}
      {showTarea && <AsignarTareaModal refTipo="Activo" refNombre="P.E Avalon" onClose={() => setShowTarea(false)} />}
    </div>
  )
}
