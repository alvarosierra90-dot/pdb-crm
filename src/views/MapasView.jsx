import { useEffect, useRef, useState, useMemo } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) { resolve(); return }
    const existing = document.getElementById('gm-script')
    if (existing) { existing.addEventListener('load', resolve); existing.addEventListener('error', reject); return }
    const s = document.createElement('script')
    s.id = 'gm-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing,geometry`
    s.async = true
    s.defer = true
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// ── Layers ─────────────────────────────────────────────────────────────────
const LAYERS = [
  { id:'ofertas',        label:'Ofertas',        color:'#4CAF50', letter:'O', icon:'🏢' },
  { id:'activos',        label:'Activos',         color:'#FF9800', letter:'A', icon:'🏗' },
  { id:'cuentas',        label:'Cuentas',         color:'#2196F3', letter:'C', icon:'🏬' },
  { id:'demanda',        label:'Demanda',         color:'#9C27B0', letter:'D', icon:'🔍' },
  { id:'vencimientos',   label:'Vencimientos',    color:'#F44336', letter:'V', icon:'⏳' },
  { id:'transacciones',  label:'Transacciones',   color:'#607D8B', letter:'T', icon:'📊' },
]

// ── Map style ──────────────────────────────────────────────────────────────
const MAP_STYLE = [
  { featureType:'water',       elementType:'geometry',              stylers:[{color:'#c9e2f4'}] },
  { featureType:'landscape',   elementType:'geometry',              stylers:[{color:'#f2f0eb'}] },
  { featureType:'road',        elementType:'geometry',              stylers:[{color:'#ffffff'}] },
  { featureType:'road.arterial', elementType:'geometry',            stylers:[{color:'#f5f1eb'}] },
  { featureType:'road.highway', elementType:'geometry',             stylers:[{color:'#ffe680'}] },
  { featureType:'poi',         elementType:'all',                   stylers:[{visibility:'off'}] },
  { featureType:'transit',     elementType:'all',                   stylers:[{visibility:'off'}] },
  { featureType:'administrative', elementType:'labels.text.fill',   stylers:[{color:'#999999'}] },
  { featureType:'road',        elementType:'labels.text.fill',      stylers:[{color:'#aaaaaa'}] },
]

// ── Mock data (→ Supabase queries shown as comments) ───────────────────────
const DATA = {
  // supabase.from('ofertas').select('*, activos(nombre,lat,lng,direccion), propietarios(nombre)')
  ofertas: [
    { id:'OFE-2501', nombre:'P.E Avalon — P4',           dir:'Avda. de Burgos 89, Las Tablas, Madrid',      lat:40.5121, lng:-3.6574, uso:'Oficinas', sba:1500,  renta:12.5, disp:'Inmediata',  prop:'Merlín Properties', mandato:'Exclusiva',   estado:'En curso'  },
    { id:'OFE-2502', nombre:'Albatros Edif. D — P3',     dir:'Calle Anabel Segura 9, Alcobendas',           lat:40.5340, lng:-3.6467, uso:'Oficinas', sba:2550,  renta:13.5, disp:'Inmediata',  prop:'Merlín Properties', mandato:'Coexclusiva', estado:'En curso'  },
    { id:'OFE-2503', nombre:'Parque Emp. Norte — P2',    dir:'Serrano Galvache 56, Madrid',                 lat:40.4895, lng:-3.6821, uso:'Oficinas', sba:1200,  renta:16.5, disp:'01/04/2026', prop:'FREO Investments',  mandato:'Sin mandato', estado:'Potencial' },
    { id:'OFE-2504', nombre:'Torre Glòries — P12',       dir:'Avda. Diagonal 211, Barcelona',               lat:41.3997, lng:2.1984,  uso:'Oficinas', sba:3400,  renta:21.0, disp:'01/06/2026', prop:'Merlín Properties', mandato:'Exclusiva',   estado:'En curso'  },
    { id:'OFE-2505', nombre:'Torre Europa Val. — P5',    dir:'Avda. de Francia 28, Valencia',               lat:39.4750, lng:-0.3576, uso:'Oficinas', sba:1800,  renta:11.0, disp:'Inmediata',  prop:'FREO Investments',  mandato:'Exclusiva',   estado:'Vencido'   },
    { id:'OFE-2506', nombre:'Torres KIO — P8',           dir:'Paseo de la Castellana 5, Madrid',            lat:40.4576, lng:-3.6885, uso:'Oficinas', sba:4200,  renta:32.0, disp:'01/07/2026', prop:'Colonial',          mandato:'Sin mandato', estado:'En curso'  },
  ],
  // supabase.from('activos').select('*, propietarios(nombre)')
  activos: [
    { id:'MAD-OF-00189', nombre:'P.E Avalon',            dir:'Avda. de Burgos 89, Las Tablas, Madrid',      lat:40.5121, lng:-3.6574, uso:'Oficinas', sba:46956, plantas:7,  ano:2001, prop:'Merlín Properties', occ:78.4, disp:10142 },
    { id:'MAD-OF-00841', nombre:'Parque Emp. Norte',     dir:'Serrano Galvache 56, Madrid',                 lat:40.4895, lng:-3.6821, uso:'Oficinas', sba:11200, plantas:5,  ano:1998, prop:'FREO Investments',  occ:79.0, disp:2882  },
    { id:'ALB-D',        nombre:'Albatros Edif. D',      dir:'Calle Anabel Segura 9, Alcobendas',           lat:40.5340, lng:-3.6467, uso:'Oficinas', sba:13486, plantas:6,  ano:2005, prop:'Merlín Properties', occ:61.5, disp:5200  },
    { id:'TOR-GLO',      nombre:'Torre Glòries',         dir:'Avda. Diagonal 211, Barcelona',               lat:41.3997, lng:2.1984,  uso:'Oficinas', sba:18500, plantas:26, ano:2005, prop:'Merlín Properties', occ:82.7, disp:3200  },
    { id:'TOR-EUR',      nombre:'Torre Europa Valencia', dir:'Avda. de Francia 28, Valencia',               lat:39.4750, lng:-0.3576, uso:'Oficinas', sba:7600,  plantas:8,  ano:1995, prop:'FREO Investments',  occ:100,  disp:0     },
  ],
  // supabase.from('propietarios').select('*').union(from('arrendatarios').select('*'))
  cuentas: [
    { id:'MRL',  nombre:'Merlín Properties SOCIMI', dir:'Paseo de la Castellana 42, Madrid',  lat:40.4402, lng:-3.6921, sector:'Inmobiliario',    empleados:380,  estado:'Cliente activo', contacto:'Carlos Ruíz',    act:'15/03/2026' },
    { id:'FREO', nombre:'FREO Investments Spain',   dir:'Ortega y Gasset 22, Madrid',          lat:40.4395, lng:-3.6814, sector:'Fondos inversión', empleados:45,   estado:'Cliente activo', contacto:'Ana García',     act:'02/03/2026' },
    { id:'ORC',  nombre:'Oracle Spain SL',          dir:'Calle Bruselas 1, Alcobendas',        lat:40.5428, lng:-3.6412, sector:'Tecnología',       empleados:1200, estado:'Cliente activo', contacto:'Marta Sánchez',  act:'10/02/2026' },
    { id:'CFZ',  nombre:'Corp. Financiera Azuaga',  dir:'Avda. D. Martínez Barrios, Sevilla',  lat:37.3886, lng:-5.9849, sector:'Banca',            empleados:230,  estado:'Potencial',      contacto:'Pedro Azuaga',   act:'01/11/2025' },
    { id:'COL',  nombre:'Inmobiliaria Colonial',    dir:'Paseo de la Castellana 5, Madrid',    lat:40.4580, lng:-3.6880, sector:'Inmobiliario',     empleados:120,  estado:'Cliente activo', contacto:'Beatriz Torres', act:'20/03/2026' },
  ],
  // supabase.from('demandas').select('*, clientes(nombre)').eq('estado','En Curso')
  demanda: [
    { id:'D251035690', nombre:'Corp. Financiera Azuaga', dir:'A-1 · Alcobendas',    lat:40.5363, lng:-3.6437, uso:'Oficinas', tipo:'Alquiler', sba_min:2200, sba_max:3000, renta_max:18, zonas:'A-1 · Alcobendas',  estado:'En Curso' },
    { id:'D251029847', nombre:'Oracle Spain SL',         dir:'M-30 · Madrid Norte', lat:40.4971, lng:-3.6821, uso:'Oficinas', tipo:'Alquiler', sba_min:1500, sba_max:2000, renta_max:15, zonas:'M-30 · Las Tablas', estado:'En Curso' },
    { id:'D251041203', nombre:'StartupHub BCN',          dir:'22@ · Barcelona',     lat:41.3950, lng:2.1920,  uso:'Flex',     tipo:'Alquiler', sba_min:800,  sba_max:1500, renta_max:24, zonas:'22@ · Poblenou',    estado:'En Curso' },
  ],
  // supabase.from('contratos').select('*, activos(nombre,lat,lng,dir), arrendatarios(nombre)').gte('fecha_fin','now()').order('fecha_fin')
  vencimientos: [
    { id:'VEN-001', arrendatario:'Oracle Spain SL',  activo:'P.E Avalon',        dir:'Avda. de Burgos 89, Madrid',        lat:40.5121, lng:-3.6574, fecha:'30/06/2026', m2:1500, renta:10.5, meses:3 },
    { id:'VEN-002', arrendatario:'Empresa XYZ SA',   activo:'Albatros Edif. D',  dir:'Calle Anabel Segura 9, Alcobendas', lat:40.5340, lng:-3.6467, fecha:'15/03/2026', m2:2550, renta:13.0, meses:0 },
    { id:'VEN-003', arrendatario:'Consultoría Q SL', activo:'Parque Emp. Norte', dir:'Serrano Galvache 56, Madrid',        lat:40.4895, lng:-3.6821, fecha:'01/09/2026', m2:1200, renta:16.0, meses:6 },
    { id:'VEN-004', arrendatario:'Telecom XY SA',    activo:'Torre Glòries',     dir:'Avda. Diagonal 211, Barcelona',     lat:41.3997, lng:2.1984,  fecha:'31/12/2026', m2:2800, renta:20.5, meses:9 },
  ],
  // supabase.from('transacciones').select('*, activos(nombre,lat,lng,dir)').order('fecha',{ascending:false})
  transacciones: [
    { id:'TRX-2501', activo:'P.E Avalon',       dir:'Avda. de Burgos 89, Madrid',        lat:40.5121, lng:-3.6574, tipo:'Alquiler', fecha:'15/11/2025', m2:1500,  renta:10.5,       cuenta:'Oracle Spain SL'  },
    { id:'TRX-2502', activo:'Albatros Edif. D', dir:'Calle Anabel Segura 9, Alcobendas', lat:40.5340, lng:-3.6467, tipo:'Alquiler', fecha:'01/10/2025', m2:2000,  renta:13.5,       cuenta:'Empresa ABC SL'   },
    { id:'TRX-2503', activo:'Torre Glòries',    dir:'Avda. Diagonal 211, Barcelona',     lat:41.3997, lng:2.1984,  tipo:'Venta',    fecha:'30/06/2025', m2:18500, precio:68500000, cuenta:'Merlín Properties' },
  ],
}

// ── Utils ──────────────────────────────────────────────────────────────────
function getMarkerColor(layerId, item, defaultColor) {
  if (layerId === 'ofertas') {
    if (item.estado === 'Disponible' || item.estado === 'En curso') return '#4CAF50'
    if (item.estado === 'En negociación' || item.estado === 'Potencial') return '#FF9800'
    return '#9E9E9E'
  }
  return defaultColor
}

function debounce(fn, ms) {
  let t
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

function pinURL(color, letter, highlight = false) {
  const s = highlight ? 36 : 28
  const sw = highlight ? 3 : 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s+10}">` +
    `<circle cx="${s/2}" cy="${s/2}" r="${s/2-1.5}" fill="${color}" stroke="white" stroke-width="${sw}"/>` +
    `<text x="${s/2}" y="${s/2+4}" font-family="Arial,sans-serif" font-size="${Math.round(s*.34)}" fill="white" text-anchor="middle" font-weight="800">${letter}</text>` +
    `<polygon points="${s/2-4},${s-1} ${s/2+4},${s-1} ${s/2},${s+9}" fill="${color}"/></svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

// ── Card component ─────────────────────────────────────────────────────────
function MapCard({ item, layerId, cfg, isActive, isSelected, onToggle }) {
  const kpi = (k, v) => (
    <div key={k} style={{background:'var(--gray-lt)',borderRadius:3,padding:'2px 5px',textAlign:'center'}}>
      <div style={{fontSize:7,color:'var(--text4)'}}>{k}</div>
      <div style={{fontSize:9,fontWeight:600,color:'var(--text)'}}>{v}</div>
    </div>
  )

  return (
    <div style={{
      padding:'10px 14px', borderBottom:'1px solid var(--border)', cursor:'pointer',
      background: isActive ? cfg.color+'12' : isSelected ? cfg.color+'08' : '#fff',
      borderLeft: isActive ? `3px solid ${cfg.color}` : '3px solid transparent',
      transition:'all .1s',
    }}>

      {layerId === 'ofertas' && <>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6,marginBottom:3}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text)',lineHeight:1.3}}>{item.nombre}</div>
          <span className={`tag ${item.estado==='Disponible'||item.estado==='En curso'?'tag-green':item.estado==='En negociación'||item.estado==='Potencial'?'tag-amber':'tag-gray'}`} style={{fontSize:9,flexShrink:0}}>{item.estado}</span>
        </div>
        <div style={{fontSize:9,color:'var(--text3)',marginBottom:6}}>📍 {item.dir}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:3,marginBottom:5}}>
          {[['SBA',item.sba?.toLocaleString()+' m²'],['Renta',item.renta+' €/m²'],['Disp.',item.disp]].map(([k,v])=>kpi(k,v))}
        </div>
        <div style={{fontSize:9,color:'var(--text4)'}}>🏢 {item.prop} · <span style={{color:item.mandato!=='Sin mandato'?'var(--purple)':'inherit',fontWeight:item.mandato!=='Sin mandato'?600:400}}>{item.mandato}</span> · <span className="mono">{item.id}</span></div>
      </>}

      {layerId === 'activos' && <>
        <div style={{fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:2}}>{item.nombre} <span className="mono" style={{fontSize:9,color:'var(--text4)'}}>{item.id}</span></div>
        <div style={{fontSize:9,color:'var(--text3)',marginBottom:6}}>📍 {item.dir}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:3,marginBottom:5}}>
          {[['SBA',item.sba?.toLocaleString()+' m²'],['Ocup.',item.occ+'%'],['Disp.',item.disp?.toLocaleString()+' m²'],['Plantas',item.plantas+'pl']].map(([k,v])=>kpi(k,v))}
        </div>
        <div style={{fontSize:9,color:'var(--text4)'}}>🏢 {item.prop} · {item.ano}</div>
      </>}

      {layerId === 'cuentas' && <>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
          <div style={{width:28,height:28,borderRadius:5,background:cfg.color+'18',border:`1px solid ${cfg.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:cfg.color,flexShrink:0}}>{item.nombre.slice(0,2).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.nombre}</div>
            <div style={{fontSize:9,color:'var(--text3)'}}>{item.sector} · {item.empleados?.toLocaleString()} empl.</div>
          </div>
          <span className={`tag ${item.estado==='Cliente activo'?'tag-green':'tag-amber'}`} style={{fontSize:9,flexShrink:0}}>{item.estado}</span>
        </div>
        <div style={{fontSize:9,color:'var(--text3)'}}>{item.contacto} · Últ. act: {item.act}</div>
      </>}

      {layerId === 'demanda' && <>
        <div style={{fontSize:11,fontWeight:700,marginBottom:2}}>{item.nombre} <span className="mono" style={{fontSize:9,color:'var(--text4)'}}>{item.id}</span></div>
        <div style={{fontSize:9,color:'var(--text3)',marginBottom:5}}>📍 {item.zonas}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3,marginBottom:5}}>
          {[['Superficie',item.sba_min?.toLocaleString()+'–'+item.sba_max?.toLocaleString()+' m²'],['Renta máx.',item.renta_max+' €/m²']].map(([k,v])=>kpi(k,v))}
        </div>
        <div style={{display:'flex',gap:3}}>
          <span className="tag tag-blue" style={{fontSize:9}}>{item.uso}</span>
          <span className="tag tag-gray" style={{fontSize:9}}>{item.tipo}</span>
          <span className="tag tag-green" style={{fontSize:9}}>{item.estado}</span>
        </div>
      </>}

      {layerId === 'vencimientos' && <>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6,marginBottom:3}}>
          <div>
            <div style={{fontSize:11,fontWeight:700}}>{item.arrendatario}</div>
            <div style={{fontSize:9,color:'var(--text3)'}}>{item.activo}</div>
          </div>
          <span style={{fontSize:10,fontWeight:700,flexShrink:0,padding:'1px 7px',borderRadius:9,whiteSpace:'nowrap',
            color:item.meses<=0?'var(--red)':item.meses<=3?'var(--red)':item.meses<=6?'var(--amber)':'var(--text3)',
            background:item.meses<=0?'var(--red-lt)':item.meses<=3?'var(--red-lt)':item.meses<=6?'var(--amber-lt)':'var(--gray-lt)',
            border:`1px solid ${item.meses<=0?'var(--red-bd)':item.meses<=3?'var(--red-bd)':item.meses<=6?'var(--amber-bd)':'var(--border)'}`}}>
            {item.meses<=0?'Vencido':`${item.meses}m`}
          </span>
        </div>
        <div style={{fontSize:9,color:'var(--text3)',marginBottom:5}}>📍 {item.dir}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:3}}>
          {[['Vto.',item.fecha],['m²',item.m2?.toLocaleString()],['€/m²',item.renta]].map(([k,v])=>kpi(k,v))}
        </div>
      </>}

      {layerId === 'transacciones' && <>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6,marginBottom:3}}>
          <div style={{fontSize:11,fontWeight:700}}>{item.activo}</div>
          <span className={`tag ${item.tipo==='Alquiler'?'tag-blue':'tag-purple'}`} style={{fontSize:9,flexShrink:0}}>{item.tipo}</span>
        </div>
        <div style={{fontSize:9,color:'var(--text3)',marginBottom:5}}>📍 {item.dir}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:3,marginBottom:4}}>
          {[['Fecha',item.fecha],['m²',item.m2?.toLocaleString()+' m²'],item.renta?['€/m²',item.renta]:['Precio','€'+Math.round((item.precio||0)/1e6)+'M']].map(([k,v])=>kpi(k,v))}
        </div>
        <div style={{fontSize:9,color:'var(--text4)'}}>👤 {item.cuenta}</div>
      </>}

      <button onClick={e=>{e.stopPropagation();onToggle(item.id)}} style={{display:'block',width:'100%',marginTop:7,padding:'4px 0',borderRadius:4,border:`1px solid ${isSelected?cfg.color:cfg.color+'55'}`,background:isSelected?cfg.color:cfg.color+'14',color:isSelected?'#fff':cfg.color,fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all .1s'}}>
        {isSelected ? '✓ Seleccionado' : '+ Añadir a selección'}
      </button>
    </div>
  )
}

// ── Proposal modal ─────────────────────────────────────────────────────────
function ProposalModal({ items, onClose, navigate, data = DATA }) {
  const [copied, setCopied] = useState(false)
  const url = 'https://pdb.savills.es/propuesta/PRO-2026-0047'
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:12,width:540,maxHeight:'85vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.25)'}}>
        <div style={{padding:'18px 22px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff',zIndex:1}}>
          <div>
            <div style={{fontSize:15,fontWeight:700}}>Propuesta generada · PRO-2026-0047</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{items.length} alternativa{items.length!==1?'s':''} seleccionada{items.length!==1?'s':''}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--text4)'}}>✕</button>
        </div>
        <div style={{padding:'18px 22px'}}>
          <div style={{background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',padding:'12px 14px',marginBottom:16}}>
            <div style={{fontSize:9,fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Enlace para el cliente</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{flex:1,fontSize:11,fontWeight:500,background:'#fff',border:'1px solid var(--border)',borderRadius:4,padding:'6px 10px',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{url}</div>
              <button onClick={()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)}} style={{flexShrink:0,padding:'6px 12px',borderRadius:4,border:'none',background:copied?'var(--green)':'var(--accent)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'background .2s'}}>
                {copied?'✓ Copiado':'⎘ Copiar'}
              </button>
            </div>
            <div style={{fontSize:9,color:'var(--text3)',marginTop:5}}>El cliente verá mapa interactivo, fichas comerciales, transportes y contexto del entorno.</div>
          </div>

          <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Alternativas</div>
          {items.map((item,i)=>{
            const layer = LAYERS.find(l => data[l.id]?.some(d=>d.id===item.id))
            const name = item.nombre||item.arrendatario||item.activo||item.id
            return (
              <div key={item.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 10px',marginBottom:4,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)'}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:layer?.color||'#666',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
                  <div style={{fontSize:9,color:'var(--text3)'}}>{layer?.icon} {layer?.label} · {item.dir||item.zonas||'—'}</div>
                </div>
              </div>
            )
          })}

          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button onClick={()=>{onClose();navigate('ficha-demanda')}} style={{flex:1,padding:'9px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>💾 Guardar en demanda</button>
            <button style={{flex:1,padding:'9px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'#fff',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>📄 Exportar PDF</button>
            <button style={{flex:1,padding:'9px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'#fff',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✉ Enviar email</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function MapasView() {
  const { params, navigate } = useNav()
  const fromDemanda = params?.from === 'demanda'

  const mapRef     = useRef(null)
  const mapObj     = useRef(null)
  const markerMap  = useRef({})
  const dmgr       = useRef(null)
  const shapesRef  = useRef([])
  const transitRef = useRef(null)
  const cardEls    = useRef({})
  const liveDataRef = useRef(DATA)

  const [loaded,       setLoaded]       = useState(false)
  const [mapError,     setMapError]     = useState(false)
  const [layer,        setLayer]        = useState('ofertas')
  const [selected,     setSelected]     = useState(new Set())
  const [activeId,     setActiveId]     = useState(null)
  const [inShape,      setInShape]      = useState(null)
  const [shapeCount,   setShapeCount]   = useState(0)
  const [drawMode,     setDrawMode]     = useState(null)
  const [filters,      setFilters]      = useState({ q:'', uso:'', estado:'', sbaMin:'', sbaMax:'', rentaMax:'' })
  const [showFilters,  setShowFilters]  = useState(false)
  const [showProposal, setShowProposal] = useState(false)
  const [showCtx,      setShowCtx]      = useState(false)
  const [transitOn,    setTransitOn]    = useState(false)
  const [dbOfertas,    setDbOfertas]    = useState([])
  const [dbActivos,    setDbActivos]    = useState([])

  // Load real data from Supabase
  useEffect(() => {
    supabase.from('ofertas')
      .select('ref, estado, renta_m2, superficie_disponible, activos(nombre, zona, lat, lng, uso, propietario, sba)')
      .eq('activa', true)
      .then(({ data }) => {
        if (!data?.length) return
        const mapped = data
          .filter(o => o.activos?.lat && o.activos?.lng)
          .map(o => ({
            id: o.ref,
            nombre: `${o.activos?.nombre || '—'} — ${o.ref}`,
            dir: o.activos?.zona || '—',
            lat: Number(o.activos.lat),
            lng: Number(o.activos.lng),
            uso: o.activos?.uso || '—',
            sba: o.superficie_disponible || 0,
            renta: o.renta_m2 || 0,
            disp: 'Inmediata',
            prop: o.activos?.propietario || '—',
            mandato: '—',
            estado: o.estado || 'Disponible',
          }))
        if (mapped.length) setDbOfertas(mapped)
      })

    supabase.from('activos')
      .select('ref, nombre, zona, lat, lng, uso, sba, n_plantas_sobre, anno_construccion, propietario, occupancy_rate')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .then(({ data }) => {
        if (!data?.length) return
        const mapped = data.map(a => ({
          id: a.ref,
          nombre: a.nombre || '—',
          dir: a.zona || '—',
          lat: Number(a.lat),
          lng: Number(a.lng),
          uso: a.uso || '—',
          sba: a.sba || 0,
          plantas: a.n_plantas_sobre || 0,
          ano: a.anno_construccion || '—',
          prop: a.propietario || '—',
          occ: a.occupancy_rate || 0,
          disp: 0,
        }))
        if (mapped.length) setDbActivos(mapped)
      })
  }, [])

  // Pre-apply demanda filters
  useEffect(() => {
    if (fromDemanda) {
      setLayer('ofertas')
      setFilters(f => ({
        ...f,
        uso: params.uso || '',
        sbaMin: params.sbaMin ? String(params.sbaMin) : '',
        sbaMax: params.sbaMax ? String(params.sbaMax) : '',
        rentaMax: params.rentaMax ? String(params.rentaMax) : '',
      }))
    }
  }, [])

  // ── Init Google Maps ────────────────────────────────────────────────────
  useEffect(() => {
    if (!MAPS_KEY) { setMapError(true); return }

    loadGoogleMaps(MAPS_KEY).then(() => {
      const center = fromDemanda ? { lat:40.5363, lng:-3.6437 } : { lat:40.4168, lng:-3.7038 }
      const map = new window.google.maps.Map(mapRef.current, {
        center, zoom: fromDemanda ? 12 : 9,
        disableDefaultUI: true, zoomControl: true,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
        styles: MAP_STYLE,
      })
      mapObj.current = map

      // Drawing manager
      const dm = new window.google.maps.drawing.DrawingManager({
        drawingMode: null, drawingControl: false,
        circleOptions:  { fillColor:'#8a6d40', fillOpacity:.07, strokeColor:'#8a6d40', strokeWeight:1.5, clickable:false, editable:true, zIndex:1 },
        polygonOptions: { fillColor:'#8a6d40', fillOpacity:.07, strokeColor:'#8a6d40', strokeWeight:1.5, clickable:false, editable:true, zIndex:1 },
      })
      dm.setMap(map)
      dmgr.current = dm

      const recalcShapeFilter = () => {
        if (!shapesRef.current.length) { setInShape(null); return }
        const result = new Set()
        Object.values(liveDataRef.current).flat().forEach(item => {
          const pt = new window.google.maps.LatLng(item.lat, item.lng)
          const inside = shapesRef.current.some(({ type, shape }) => {
            if (type === 'circle') {
              return window.google.maps.geometry.spherical.computeDistanceBetween(pt, shape.getCenter()) <= shape.getRadius()
            }
            return window.google.maps.geometry.poly.containsLocation(pt, shape)
          })
          if (inside) result.add(item.id)
        })
        setInShape(result)
      }

      const finishShape = (type, shape) => {
        shapesRef.current.push({ type, shape })
        setShapeCount(c => c + 1)
        dm.setDrawingMode(null)
        setDrawMode(null)
        recalcShapeFilter()
        shape.addListener('radius_changed', recalcShapeFilter)  // circle edit
        shape.addListener('center_changed', recalcShapeFilter)
      }

      dm.addListener('circlecomplete',  shape => finishShape('circle', shape))
      dm.addListener('polygoncomplete', shape => finishShape('polygon', shape))

      // Bounds → update visible cards
      map.addListener('bounds_changed', debounce(() => {
        const b = map.getBounds()
        if (!b) return
        // No bounds filter (all items shown in panel) — optional: uncomment to enable
        // const visible = new Set()
        // Object.values(DATA).flat().forEach(i => b.contains({lat:i.lat,lng:i.lng}) && visible.add(i.id))
        // setInBounds(visible)
      }, 400))

      setLoaded(true)
    }).catch(() => setMapError(true))
  }, [])

  // Keep liveDataRef in sync so shape filter closure can access current data
  const liveData = useMemo(() => ({
    ...DATA,
    ofertas: dbOfertas.length ? dbOfertas : DATA.ofertas,
    activos: dbActivos.length ? dbActivos : DATA.activos,
  }), [dbOfertas, dbActivos])

  useEffect(() => { liveDataRef.current = liveData }, [liveData])

  // ── Update markers on state change ──────────────────────────────────────
  useEffect(() => {
    if (!loaded || !mapObj.current) return
    const cfg = LAYERS.find(l => l.id === layer)
    if (!cfg) return

    const items = liveData[layer] || []
    const filtered = items.filter(item => {
      const n = (item.nombre||item.arrendatario||item.activo||'').toLowerCase()
      if (filters.q && !n.includes(filters.q.toLowerCase()) && !(item.dir||'').toLowerCase().includes(filters.q.toLowerCase())) return false
      if (filters.uso    && item.uso    && item.uso    !== filters.uso)    return false
      if (filters.estado && item.estado && item.estado !== filters.estado) return false
      if (filters.sbaMin && item.sba != null && Number(item.sba) < Number(filters.sbaMin)) return false
      if (filters.sbaMax && item.sba != null && Number(item.sba) > Number(filters.sbaMax)) return false
      if (filters.rentaMax && item.renta != null && Number(item.renta) > Number(filters.rentaMax)) return false
      return true
    })
    const filteredIds = new Set(filtered.map(i => i.id))

    // Remove stale markers
    Object.entries(markerMap.current).forEach(([id, m]) => {
      if (!filteredIds.has(id)) { m.setMap(null); delete markerMap.current[id] }
    })

    // Add / update markers
    filtered.forEach(item => {
      const isActive = item.id === activeId
      const isSel    = selected.has(item.id)
      const hl       = isActive || isSel
      const color    = getMarkerColor(layer, item, cfg.color)
      const icon = {
        url: pinURL(color, cfg.letter, hl),
        scaledSize: new window.google.maps.Size(hl?36:28, hl?46:38),
        anchor:     new window.google.maps.Point(hl?18:14, hl?44:36),
      }
      if (markerMap.current[item.id]) {
        markerMap.current[item.id].setIcon(icon)
        markerMap.current[item.id].setZIndex(isActive?999:isSel?100:1)
      } else {
        const m = new window.google.maps.Marker({
          position: { lat: item.lat, lng: item.lng },
          map: mapObj.current, icon,
          title: item.nombre||item.arrendatario||item.activo,
          zIndex: isActive?999:isSel?100:1,
          optimized: false,
        })
        m.addListener('click', () => {
          setActiveId(prev => prev === item.id ? null : item.id)
          setTimeout(() => cardEls.current[item.id]?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 60)
        })
        markerMap.current[item.id] = m
      }
    })
  }, [loaded, layer, filters, selected, activeId, liveData])

  // ── Helpers ────────────────────────────────────────────────────────────
  const toggleDraw = mode => {
    if (!dmgr.current || !window.google) return
    if (drawMode === mode) {
      dmgr.current.setDrawingMode(null)
      setDrawMode(null)
    } else {
      const ot = window.google.maps.drawing.OverlayType
      dmgr.current.setDrawingMode(mode === 'circle' ? ot.CIRCLE : ot.POLYGON)
      setDrawMode(mode)
    }
  }

  const clearShapes = () => {
    shapesRef.current.forEach(({ shape }) => shape.setMap(null))
    shapesRef.current = []
    setShapeCount(0)
    setInShape(null)
    setDrawMode(null)
    dmgr.current?.setDrawingMode(null)
  }

  const toggleTransit = () => {
    if (!mapObj.current || !window.google?.maps) return
    if (transitOn) { transitRef.current?.setMap(null); transitRef.current = null }
    else { transitRef.current = new window.google.maps.TransitLayer(); transitRef.current.setMap(mapObj.current) }
    setTransitOn(v => !v)
  }

  const switchLayer = newLayer => {
    Object.values(markerMap.current).forEach(m => m.setMap(null))
    markerMap.current = {}
    clearShapes()
    setLayer(newLayer)
    setActiveId(null)
    setFilters({ q:'', uso:'', estado:'', sbaMin:'', sbaMax:'', rentaMax:'' })
  }

  const toggleSelect = id => setSelected(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  // ── Derived ────────────────────────────────────────────────────────────
  const layerCfg = LAYERS.find(l => l.id === layer)

  const filteredItems = useMemo(() => {
    return (liveData[layer] || []).filter(item => {
      const n = (item.nombre||item.arrendatario||item.activo||'').toLowerCase()
      if (filters.q && !n.includes(filters.q.toLowerCase()) && !(item.dir||'').toLowerCase().includes(filters.q.toLowerCase())) return false
      if (filters.uso    && item.uso    && item.uso    !== filters.uso)    return false
      if (filters.estado && item.estado && item.estado !== filters.estado) return false
      if (filters.sbaMin && item.sba != null && Number(item.sba) < Number(filters.sbaMin)) return false
      if (filters.sbaMax && item.sba != null && Number(item.sba) > Number(filters.sbaMax)) return false
      if (filters.rentaMax && item.renta != null && Number(item.renta) > Number(filters.rentaMax)) return false
      return true
    })
  }, [layer, filters, liveData])

  const displayItems = useMemo(() => {
    if (inShape) return filteredItems.filter(i => inShape.has(i.id))
    return filteredItems
  }, [filteredItems, inShape])

  const selectedItems = useMemo(() =>
    Object.values(liveData).flat().filter(i => selected.has(i.id))
  , [selected, liveData])

  // ── No API key ─────────────────────────────────────────────────────────
  if (mapError) {
    return (
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,background:'#f8f9fa',padding:32,textAlign:'center'}}>
        <div style={{fontSize:48}}>🗺️</div>
        <div style={{fontSize:18,fontWeight:700,color:'var(--text)'}}>Configurar Google Maps API</div>
        <p style={{maxWidth:480,lineHeight:1.7,fontSize:13,color:'var(--text3)',margin:0}}>
          Crea el fichero <code style={{background:'var(--gray-lt)',padding:'1px 6px',borderRadius:4,fontFamily:'monospace'}}>.env</code> en la raíz del proyecto:
        </p>
        <div style={{background:'#1a1a2e',color:'#e0e0ff',padding:'14px 24px',borderRadius:8,fontFamily:'monospace',fontSize:13}}>
          VITE_GOOGLE_MAPS_API_KEY=<span style={{color:'#7fffb2'}}>tu_clave_aqui</span>
        </div>
        <p style={{maxWidth:440,fontSize:11,color:'var(--text4)',lineHeight:1.6,margin:0}}>
          Activa en Google Cloud Console: <strong>Maps JavaScript API</strong>, <strong>Places API</strong>, <strong>Drawing Library</strong>, <strong>Geometry Library</strong>.
        </p>
        <button onClick={()=>navigate('activos')} className="tbtn" style={{marginTop:8}}>← Volver al CRM</button>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>

      {/* BARRA SUPERIOR */}
      <div style={{display:'flex',alignItems:'stretch',background:'#fff',borderBottom:'1px solid var(--border)',flexShrink:0,overflowX:'auto',minHeight:44}}>
        <button onClick={()=>navigate('activos')}
          style={{padding:'0 14px',background:'none',border:'none',borderRight:'1px solid var(--border)',cursor:'pointer',fontSize:12,color:'var(--text3)',fontFamily:'inherit',flexShrink:0,whiteSpace:'nowrap'}}>
          ← PDB
        </button>

        {LAYERS.map(l => (
          <button key={l.id} onClick={()=>switchLayer(l.id)}
            style={{padding:'0 16px',background:layer===l.id?l.color+'14':'none',border:'none',borderRight:'1px solid var(--border)',borderBottom:layer===l.id?`2px solid ${l.color}`:'2px solid transparent',cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:layer===l.id?700:400,color:layer===l.id?l.color:'var(--text2)',flexShrink:0,whiteSpace:'nowrap',transition:'all .15s'}}>
            {l.icon} {l.label} <span style={{marginLeft:4,fontSize:10,opacity:.6,fontWeight:400}}>({liveData[l.id]?.length||0})</span>
          </button>
        ))}

        <div style={{flex:1}}/>

        {/* Draw tools */}
        <div style={{display:'flex',alignItems:'center',gap:4,padding:'0 10px',borderLeft:'1px solid var(--border)',flexShrink:0}}>
          <span style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginRight:2}}>Zona</span>
          {[{id:'circle',icon:'◯',tip:'Zona circular'},{id:'polygon',icon:'⬡',tip:'Polígono libre'}].map(t=>(
            <button key={t.id} title={t.tip} onClick={()=>toggleDraw(t.id)}
              style={{width:28,height:28,borderRadius:4,border:`1px solid ${drawMode===t.id?'var(--accent)':'var(--border)'}`,background:drawMode===t.id?'var(--accent-lt)':'#fff',color:drawMode===t.id?'var(--accent)':'var(--text3)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .1s'}}>
              {t.icon}
            </button>
          ))}
          {shapeCount > 0 && (
            <button onClick={clearShapes} style={{padding:'3px 7px',borderRadius:4,border:'1px solid var(--red-bd)',background:'var(--red-lt)',color:'var(--red)',fontSize:10,cursor:'pointer',fontWeight:600,fontFamily:'inherit'}}>✕ limpiar</button>
          )}
        </div>

        <button onClick={()=>setShowCtx(v=>!v)}
          style={{padding:'0 14px',background:showCtx?'var(--teal-lt)':'none',border:'none',borderLeft:'1px solid var(--border)',cursor:'pointer',fontSize:11,fontWeight:600,color:showCtx?'var(--teal)':'var(--text3)',fontFamily:'inherit',flexShrink:0,whiteSpace:'nowrap'}}>
          🌍 Contexto
        </button>

        {selected.size > 0 && (
          <button onClick={()=>setShowProposal(true)}
            style={{padding:'0 16px',background:'var(--accent)',border:'none',cursor:'pointer',fontSize:11,fontWeight:700,color:'#fff',fontFamily:'inherit',flexShrink:0,whiteSpace:'nowrap'}}>
            {selected.size} sel. → Propuesta ↗
          </button>
        )}

        {fromDemanda && (
          <div style={{display:'flex',alignItems:'center',padding:'0 12px',background:'var(--amber-lt)',borderLeft:'2px solid var(--amber)',fontSize:10,fontWeight:600,color:'var(--amber)',flexShrink:0,whiteSpace:'nowrap'}}>
            📤 {params.id} · {(params.nombre||'').split(' ').slice(0,2).join(' ')}
          </div>
        )}
      </div>

      {/* BODY */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* MAP */}
        <div style={{flex:1,position:'relative'}}>
          <div ref={mapRef} style={{width:'100%',height:'100%'}}/>

          {!loaded && (
            <div style={{position:'absolute',inset:0,background:'#f2f0eb',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
              <div style={{fontSize:36}}>🗺️</div>
              <div style={{fontSize:13,color:'var(--text3)',fontWeight:500}}>Cargando Google Maps…</div>
            </div>
          )}

          {drawMode && (
            <div style={{position:'absolute',top:12,left:'50%',transform:'translateX(-50%)',background:'var(--accent)',color:'#fff',padding:'6px 16px',borderRadius:20,fontSize:11,fontWeight:600,pointerEvents:'none',boxShadow:'0 2px 8px rgba(37,99,235,.35)',whiteSpace:'nowrap'}}>
              {drawMode==='circle' ? '◯ Haz clic y arrastra para definir el radio' : '⬡ Clic para añadir puntos · Doble clic para cerrar'}
            </div>
          )}

          {/* Context panel floating */}
          {showCtx && (
            <div style={{position:'absolute',top:8,right:8,background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'14px 16px',width:228,boxShadow:'0 4px 18px rgba(0,0,0,.1)',zIndex:20}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>🌍 Contexto urbano</div>
              <label style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,cursor:'pointer'}}>
                <div><div style={{fontSize:11,fontWeight:600}}>🚇 Transporte público</div><div style={{fontSize:9,color:'var(--text4)'}}>Metro, bus, cercanías</div></div>
                <input type="checkbox" checked={transitOn} onChange={toggleTransit} style={{accentColor:'var(--accent)',width:15,height:15}}/>
              </label>
              <div style={{opacity:.45}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div><div style={{fontSize:11,fontWeight:600}}>📊 Datos INE</div><div style={{fontSize:9,color:'var(--text4)'}}>Renta, población</div></div>
                  <span style={{fontSize:9,background:'var(--amber-lt)',color:'var(--amber)',border:'1px solid var(--amber-bd)',padding:'1px 6px',borderRadius:9,fontWeight:600}}>Próximo</span>
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div><div style={{fontSize:11,fontWeight:600}}>📍 Servicios cercanos</div><div style={{fontSize:9,color:'var(--text4)'}}>Restaurantes, parking…</div></div>
                  <span style={{fontSize:9,background:'var(--amber-lt)',color:'var(--amber)',border:'1px solid var(--amber-bd)',padding:'1px 6px',borderRadius:9,fontWeight:600}}>Próximo</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:356,flexShrink:0,background:'#fff',borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {/* Header */}
          <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:layerCfg?.color,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:700,flex:1}}>{layerCfg?.icon} {layerCfg?.label}</span>
              <span style={{fontSize:11,color:'var(--text4)'}}>{displayItems.length} result.</span>
              <button onClick={()=>setShowFilters(v=>!v)} style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:4,border:`1px solid ${showFilters?'var(--accent-bd)':'var(--border)'}`,background:showFilters?'var(--accent-lt)':'var(--gray-lt)',color:showFilters?'var(--accent)':'var(--text3)',cursor:'pointer',fontFamily:'inherit'}}>⚙ Filtros</button>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--gray-lt)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'4px 9px'}}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:13,height:13,color:'var(--text4)',flexShrink:0}}><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
              <input placeholder={`Buscar en ${layerCfg?.label.toLowerCase()}…`} value={filters.q} onChange={e=>setFilters(f=>({...f,q:e.target.value}))} style={{border:'none',background:'none',fontSize:11,width:'100%',outline:'none',fontFamily:'inherit'}}/>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',background:'var(--gray-lt)',flexShrink:0}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6}}>
                <div>
                  <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>Uso</div>
                  <select value={filters.uso} onChange={e=>setFilters(f=>({...f,uso:e.target.value}))} className="fsel" style={{width:'100%',fontSize:10}}>
                    <option value="">Todos</option>
                    {['Oficinas','Logística','Retail','Industrial','Flex'].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>Estado</div>
                  <select value={filters.estado} onChange={e=>setFilters(f=>({...f,estado:e.target.value}))} className="fsel" style={{width:'100%',fontSize:10}}>
                    <option value="">Todos</option>
                    {layer==='ofertas'
                      ? ['Disponible','En negociación'].map(s=><option key={s}>{s}</option>)
                      : ['En curso','Potencial','Vencido','Cliente activo'].map(s=><option key={s}>{s}</option>)
                    }
                  </select>
                </div>
              </div>
              {(layer==='ofertas'||fromDemanda) && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:6}}>
                  <div>
                    <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>SBA mín. m²</div>
                    <input value={filters.sbaMin} onChange={e=>setFilters(f=>({...f,sbaMin:e.target.value}))} className="fsel" style={{width:'100%',fontSize:10}} placeholder="—" type="number"/>
                  </div>
                  <div>
                    <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>SBA máx. m²</div>
                    <input value={filters.sbaMax} onChange={e=>setFilters(f=>({...f,sbaMax:e.target.value}))} className="fsel" style={{width:'100%',fontSize:10}} placeholder="—" type="number"/>
                  </div>
                  <div>
                    <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>Renta máx. €/m²</div>
                    <input value={filters.rentaMax} onChange={e=>setFilters(f=>({...f,rentaMax:e.target.value}))} className="fsel" style={{width:'100%',fontSize:10}} placeholder="—" type="number"/>
                  </div>
                </div>
              )}
              <button onClick={()=>{setFilters({q:'',uso:'',estado:'',sbaMin:'',sbaMax:'',rentaMax:''});setShowFilters(false)}} style={{fontSize:10,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:0}}>Limpiar filtros</button>
            </div>
          )}

          {/* Demanda context banner */}
          {fromDemanda && layer==='ofertas' && (
            <div style={{padding:'7px 14px',background:'var(--amber-lt)',borderBottom:'2px solid var(--amber-bd)',flexShrink:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--amber)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:1}}>Búsqueda desde demanda</div>
              <div style={{fontSize:10,color:'var(--text2)',fontWeight:500}}>{params.nombre} · {params.sbaMin?.toLocaleString()}–{params.sbaMax?.toLocaleString()} m² · ≤{params.rentaMax}€ · {params.zona}</div>
            </div>
          )}

          {/* Shape filter indicator */}
          {inShape && (
            <div style={{padding:'5px 14px',background:'var(--accent-lt)',borderBottom:'1px solid var(--accent-bd)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <span style={{fontSize:10,fontWeight:600,color:'var(--accent)'}}>📐 Zona dibujada · {displayItems.length} resultado{displayItems.length!==1?'s':''}</span>
              <button onClick={clearShapes} style={{fontSize:9,fontWeight:600,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:0}}>✕ quitar</button>
            </div>
          )}

          {/* Select all */}
          <div style={{padding:'6px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'#fafafa'}}>
            <button onClick={()=>setSelected(prev=>{const n=new Set(prev);displayItems.forEach(i=>n.add(i.id));return n})} style={{fontSize:10,fontWeight:600,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:0}}>
              + Seleccionar todos ({displayItems.length})
            </button>
            {selected.size > 0 && (
              <button onClick={()=>setSelected(new Set())} style={{fontSize:10,color:'var(--text4)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:0}}>✕ limpiar</button>
            )}
          </div>

          {/* Cards */}
          <div style={{flex:1,overflow:'auto'}}>
            {displayItems.length === 0 ? (
              <div style={{textAlign:'center',padding:'48px 20px',color:'var(--text4)'}}>
                <div style={{fontSize:32,marginBottom:8}}>{layerCfg?.icon}</div>
                <div style={{fontSize:12,fontWeight:500}}>Sin resultados</div>
                <div style={{fontSize:11,marginTop:4}}>Ajusta los filtros o mueve el mapa</div>
              </div>
            ) : displayItems.map(item => (
              <div key={item.id} ref={el=>cardEls.current[item.id]=el} onClick={()=>setActiveId(id=>id===item.id?null:item.id)}>
                <MapCard item={item} layerId={layer} cfg={layerCfg} isActive={activeId===item.id} isSelected={selected.has(item.id)} onToggle={toggleSelect}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showProposal && <ProposalModal items={selectedItems} onClose={()=>setShowProposal(false)} navigate={navigate} data={liveData}/>}
    </div>
  )
}
