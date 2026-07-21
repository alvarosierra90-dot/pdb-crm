import { useState, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'

const LINEAS_NEGOCIO = [
  { id:'oficinas',     label:'Oficinas',              paths:<><path d="M4 22V5a1 1 0 011-1h14a1 1 0 011 1v17"/><path d="M2 22h20"/><path d="M8 22V15h4v7"/><path d="M8 8h2M8 11h2M14 8h2M14 11h2"/></> },
  { id:'industrial',   label:'Industrial & Logística', paths:<><rect x="2" y="11" width="20" height="11" rx="1"/><path d="M2 11l6-7h8l6 7"/><path d="M10 22v-6h4v6"/><path d="M6 15h2M16 15h2"/></> },
  { id:'retail',       label:'Retail',                paths:<><path d="M6 2L3 8v1a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0V8L18 2H6z"/><path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/><path d="M9 22V14h6v8"/></> },
  { id:'residencial',  label:'Residencial',           paths:<><path d="M3 12L12 3l9 9"/><path d="M4 11v9a1 1 0 001 1h4v-6h6v6h4a1 1 0 001-1v-9"/></> },
  { id:'inversion',    label:'Inversión / Cap. Mkts', paths:<><path d="M3 17l4-5 4 3 4-7 4 4"/><path d="M3 21h18"/><path d="M18 6l3 3-3 3"/></> },
  { id:'valoraciones', label:'Valoraciones',          paths:<><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></> },
  { id:'pm',           label:'Property Management',   paths:<><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></> },
  { id:'projmgmt',     label:'Project Management',   paths:<><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></> },
  { id:'workplace',    label:'Workplace Consulting',  paths:<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2"/><path d="M12 12v5M9.5 14.5h5"/></> },
  { id:'hoteles',      label:'Hoteles',               paths:<><path d="M3 22V6a1 1 0 011-1h16a1 1 0 011 1v16"/><path d="M3 22h18"/><path d="M9 22v-7h6v7"/><path d="M8 9h2M14 9h2M8 13h2M14 13h2"/></> },
  { id:'cciales',      label:'Centros Comerciales',   paths:<><rect x="2" y="3" width="20" height="14" rx="1"/><path d="M8 21h8M12 17v4"/><path d="M6 7h4v5H6zM14 7h4v5h-4z"/></> },
  { id:'healthcare',   label:'Healthcare',            paths:<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></> },
]

/* ── Datos mock por línea ── */
const DATA_LINEA = {
  oficinas: {
    takeup: [
      { area:'CBD', zona:'Gran Vía', subzona:'Recoletos', m2:12400 },
      { area:'CBD', zona:'Gran Vía', subzona:'Castellana Norte', m2:8200 },
      { area:'Descentralizado', zona:'M-30', subzona:'Julián Camarillo', m2:18600 },
      { area:'Descentralizado', zona:'A-1', subzona:'Alcobendas', m2:9800 },
      { area:'Periferia', zona:'A-2', subzona:'Coslada', m2:4200 },
    ],
    disponibilidad: [
      { area:'CBD', zona:'Gran Vía', subzona:'Recoletos', m2:3200, activos:4 },
      { area:'Descentralizado', zona:'M-30', subzona:'Julián Camarillo', m2:21000, activos:8 },
      { area:'Descentralizado', zona:'A-1', subzona:'Alcobendas', m2:13486, activos:3 },
    ],
    transacciones: [
      { area:'Descentralizado', zona:'A-1', subzona:'Alcobendas', arrendatario:'Oracle Spain SL', activo:'Albatros D', direccion:'Av. de Bruselas 24, Alcobendas', m2:13486, renta:14.5, fecha:'Q2 2026' },
      { area:'CBD', zona:'Gran Vía', subzona:'Recoletos', arrendatario:'BBVA', activo:'Torre Norte', direccion:'P.º de la Castellana 81, Madrid', m2:4200, renta:36.0, fecha:'Q1 2026' },
      { area:'Descentralizado', zona:'M-30', subzona:'Julián Camarillo', arrendatario:'Generali RE', activo:'P.E Avalon P5', direccion:'C/ Julián Camarillo 4A, Madrid', m2:1500, renta:18.5, fecha:'Q1 2026' },
    ],
    ops_anio: [
      { arrendatario:'Oracle Spain SL', activo:'Albatros D', direccion:'Av. de Bruselas 24, Alcobendas', zona:'A-1 · Alcobendas', m2:13486, renta:14.5, tipo:'Alquiler', fecha:'Q2 2026' },
      { arrendatario:'BBVA', activo:'Torre Norte', direccion:'P.º de la Castellana 81', zona:'CBD · Recoletos', m2:4200, renta:36.0, tipo:'Alquiler', fecha:'Q1 2026' },
      { arrendatario:'Generali RE', activo:'P.E Avalon P5', direccion:'C/ Julián Camarillo 4A', zona:'M-30 · Julián Camarillo', m2:1500, renta:18.5, tipo:'Alquiler', fecha:'Q1 2026' },
      { arrendatario:'Celonis', activo:'P.E Avalon P4', direccion:'C/ Julián Camarillo 4A', zona:'M-30 · Julián Camarillo', m2:1202, renta:12.0, tipo:'Alquiler', fecha:'Q3 2026' },
      { arrendatario:'Repsol Exploration', activo:'Avalon C P3', direccion:'C/ Julián Camarillo 6', zona:'M-30 · Julián Camarillo', m2:1967, renta:10.5, tipo:'Renovación', fecha:'Q2 2026' },
      { arrendatario:'Cisco Systems', activo:'Parque Empresarial La Finca', direccion:'Pza. de los Sauces 2, Pozuelo', zona:'A-6 · Pozuelo', m2:3200, renta:22.0, tipo:'Alquiler', fecha:'Q3 2026' },
      { arrendatario:'PwC', activo:'Torre Agbar', direccion:'Av. Diagonal 22, Barcelona', zona:'CBD BCN · 22@', m2:2800, renta:30.5, tipo:'Alquiler', fecha:'Q1 2026' },
      { arrendatario:'Indra', activo:'Complejo Herre', direccion:'C/ Velázquez 130, Madrid', zona:'CBD · Salamanca', m2:1800, renta:25.0, tipo:'Renovación', fecha:'Q4 2026' },
    ],
    top10_m2: [
      { arrendatario:'Oracle Spain SL', activo:'Albatros D', m2:13486, renta:14.5 },
      { arrendatario:'BBVA', activo:'Torre Norte', m2:4200, renta:36.0 },
      { arrendatario:'Repsol Exp.', activo:'Avalon P3-P2', m2:3167, renta:10.5 },
      { arrendatario:'Celonis', activo:'Avalon P4-P5', m2:2702, renta:12.0 },
      { arrendatario:'Generali RE', activo:'Avalon P5', m2:1500, renta:18.5 },
    ],
    top10_renta: [
      { arrendatario:'BBVA', activo:'Torre Norte', m2:4200, renta:36.0 },
      { arrendatario:'Generali RE', activo:'Avalon P5', m2:1500, renta:18.5 },
      { arrendatario:'Oracle Spain SL', activo:'Albatros D', m2:13486, renta:14.5 },
      { arrendatario:'Celonis', activo:'Avalon P4-P5', m2:2702, renta:12.0 },
      { arrendatario:'Repsol Exp.', activo:'Avalon P3-P2', m2:3167, renta:10.5 },
    ],
    sectores: [
      { sector:'Tecnología', m2:16188 },
      { sector:'Banca / Finanzas', m2:4200 },
      { sector:'Energía', m2:3167 },
      { sector:'Seguros', m2:1500 },
      { sector:'Consultoría', m2:2800 },
    ],
    top10_propietarios_m2: [
      { propietario:'Merlín Properties', m2:46956, renta:11.5 },
      { propietario:'Colonial SOCIMI', m2:18500, renta:28.0 },
      { propietario:'Barings Core Spain', m2:9967, renta:10.5 },
    ],
    top10_propietarios_renta: [
      { propietario:'Colonial SOCIMI', m2:18500, renta:28.0 },
      { propietario:'Merlín Properties', m2:46956, renta:11.5 },
      { propietario:'Barings Core Spain', m2:9967, renta:10.5 },
    ],
    top5_activos_m2: [
      { activo:'Albatros D', direccion:'Av. de Bruselas 24, Alcobendas', zona:'A-1 · Alcobendas', m2:13486, nArrendatarios:1 },
      { activo:'Torre Norte', direccion:'P.º de la Castellana 81, Madrid', zona:'CBD · Recoletos', m2:4200, nArrendatarios:1 },
      { activo:'P.E Avalon C', direccion:'C/ Julián Camarillo 6, Madrid', zona:'M-30 · Julián Camarillo', m2:3200, nArrendatarios:2 },
      { activo:'Parque La Finca B2', direccion:'Pza. de los Sauces 2, Pozuelo', zona:'A-6 · Pozuelo', m2:3200, nArrendatarios:1 },
      { activo:'P.E Avalon A P5', direccion:'C/ Julián Camarillo 4A, Madrid', zona:'M-30 · Julián Camarillo', m2:1500, nArrendatarios:1 },
    ],
    top5_activos_renta: [
      { activo:'Torre Norte', direccion:'P.º de la Castellana 81, Madrid', zona:'CBD · Recoletos', renta:36.0, m2:4200 },
      { activo:'Torre Agbar', direccion:'Av. Diagonal 22, Barcelona', zona:'CBD BCN · 22@', renta:30.5, m2:2800 },
      { activo:'Complejo Herre', direccion:'C/ Velázquez 130, Madrid', zona:'CBD · Salamanca', renta:25.0, m2:1800 },
      { activo:'Parque La Finca B2', direccion:'Pza. de los Sauces 2, Pozuelo', zona:'A-6 · Pozuelo', renta:22.0, m2:3200 },
      { activo:'P.E Avalon A P5', direccion:'C/ Julián Camarillo 4A, Madrid', zona:'M-30 · Julián Camarillo', renta:18.5, m2:1500 },
    ],
    trend: [
      { label:'Q1', value:8200 },
      { label:'Q2', value:14600 },
      { label:'Q3', value:18400 },
      { label:'Q4', value:11800 },
    ],
  },
  inversion: {
    takeup: [
      { area:'Madrid', zona:'CBD', subzona:'Gran Vía-Recoletos', m2:45000 },
      { area:'Madrid', zona:'Descentralizado', subzona:'Las Rozas', m2:28000 },
      { area:'Barcelona', zona:'CBD BCN', subzona:'22@', m2:32000 },
      { area:'Barcelona', zona:'Periferia BCN', subzona:'Hospitalet', m2:18000 },
    ],
    disponibilidad: [
      { area:'Madrid', zona:'CBD', subzona:'Gran Vía-Recoletos', m2:125000, activos:6 },
      { area:'Madrid', zona:'Descentralizado', subzona:'Las Rozas', m2:85000, activos:4 },
      { area:'Barcelona', zona:'CBD BCN', subzona:'22@', m2:92000, activos:5 },
    ],
    transacciones: [
      { area:'Madrid', zona:'CBD', subzona:'Gran Vía-Recoletos', comprador:'Deka Immobilien', vendedor:'AXA IM Alts', activo:'Torre Cristal B4', direccion:'P.º de la Castellana 259, Madrid', m2:45000, precio:320, yield_:4.2, fecha:'Q1 2026', tipo:'Venta' },
      { area:'Barcelona', zona:'CBD BCN', subzona:'22@', comprador:'Colonial SOCIMI', vendedor:'Fondo Meridian', activo:'Torre Glòries P8-P14', direccion:'Av. Diagonal 211, Barcelona', m2:32000, precio:280, yield_:3.8, fecha:'Q2 2026', tipo:'Venta' },
      { area:'Madrid', zona:'Descentralizado', subzona:'Las Rozas', comprador:'Nuveen RE', vendedor:'Barings', activo:'P.E. Las Rozas', direccion:'C/ Rozabella 2, Las Rozas', m2:28000, precio:185, yield_:5.1, fecha:'Q1 2026', tipo:'Venta' },
    ],
    ops_anio: [
      { comprador:'Deka Immobilien', vendedor:'AXA IM Alts', activo:'Torre Cristal B4', direccion:'P.º de la Castellana 259, Madrid', zona:'CBD · Gran Vía-Recoletos', m2:45000, precio:320, yield_:4.2, tipo:'Venta', fecha:'Q1 2026' },
      { comprador:'Colonial SOCIMI', vendedor:'Fondo Meridian', activo:'Torre Glòries P8-P14', direccion:'Av. Diagonal 211, Barcelona', zona:'CBD BCN · 22@', m2:32000, precio:280, yield_:3.8, tipo:'Venta', fecha:'Q2 2026' },
      { comprador:'Nuveen RE', vendedor:'Barings', activo:'P.E. Las Rozas', direccion:'C/ Rozabella 2, Las Rozas', zona:'Descentralizado · Las Rozas', m2:28000, precio:185, yield_:5.1, tipo:'Venta', fecha:'Q1 2026' },
      { comprador:'M&G RE', vendedor:'CBRE IM', activo:'C.C. La Maquinista', direccion:'C/ Potosí 2, Barcelona', zona:'Periferia BCN · Sant Adrià', m2:65000, precio:210, yield_:5.8, tipo:'Venta', fecha:'Q3 2026' },
      { comprador:'GreenOak RE', vendedor:'Patrizia AG', activo:'Albatros Campus', direccion:'Av. de Bruselas 33, Alcobendas', zona:'A-1 · Alcobendas', m2:22000, precio:148, yield_:5.5, tipo:'Venta', fecha:'Q2 2026' },
    ],
    top10_m2: [
      { arrendatario:'M&G RE', activo:'C.C. La Maquinista', m2:65000, renta:3231 },
      { arrendatario:'Deka Immobilien', activo:'Torre Cristal B4', m2:45000, renta:7111 },
      { arrendatario:'Colonial SOCIMI', activo:'Torre Glòries P8-P14', m2:32000, renta:8750 },
      { arrendatario:'Nuveen RE', activo:'P.E. Las Rozas', m2:28000, renta:6607 },
      { arrendatario:'GreenOak RE', activo:'Albatros Campus', m2:22000, renta:6727 },
    ],
    top10_renta: [
      { arrendatario:'Colonial SOCIMI', activo:'Torre Glòries P8-P14', m2:32000, renta:3.8 },
      { arrendatario:'Deka Immobilien', activo:'Torre Cristal B4', m2:45000, renta:4.2 },
      { arrendatario:'Nuveen RE', activo:'P.E. Las Rozas', m2:28000, renta:5.1 },
      { arrendatario:'GreenOak RE', activo:'Albatros Campus', m2:22000, renta:5.5 },
      { arrendatario:'M&G RE', activo:'C.C. La Maquinista', m2:65000, renta:5.8 },
    ],
    sectores: [
      { sector:'Oficinas', m2:105000 },
      { sector:'Logística / Industrial', m2:85000 },
      { sector:'Retail / Comercial', m2:65000 },
      { sector:'Residencial', m2:45000 },
      { sector:'Hoteles', m2:32000 },
    ],
    top10_propietarios_m2: [
      { propietario:'M&G RE', m2:65000, renta:5.8 },
      { propietario:'Deka Immobilien', m2:45000, renta:4.2 },
      { propietario:'Colonial SOCIMI', m2:32000, renta:3.8 },
    ],
    top10_propietarios_renta: [
      { propietario:'Colonial SOCIMI', m2:32000, renta:3.8 },
      { propietario:'Deka Immobilien', m2:45000, renta:4.2 },
      { propietario:'M&G RE', m2:65000, renta:5.8 },
    ],
    top5_activos_m2: [
      { activo:'C.C. La Maquinista', direccion:'C/ Potosí 2, Barcelona', zona:'Periferia BCN · Sant Adrià', m2:65000, nArrendatarios:3 },
      { activo:'Torre Cristal B4', direccion:'P.º de la Castellana 259, Madrid', zona:'CBD · Gran Vía-Recoletos', m2:45000, nArrendatarios:1 },
      { activo:'Torre Glòries P8-P14', direccion:'Av. Diagonal 211, Barcelona', zona:'CBD BCN · 22@', m2:32000, nArrendatarios:2 },
      { activo:'P.E. Las Rozas', direccion:'C/ Rozabella 2, Las Rozas', zona:'Descentralizado · Las Rozas', m2:28000, nArrendatarios:4 },
      { activo:'Albatros Campus', direccion:'Av. de Bruselas 33, Alcobendas', zona:'A-1 · Alcobendas', m2:22000, nArrendatarios:2 },
    ],
    top5_activos_renta: [
      { activo:'Torre Glòries P8-P14', direccion:'Av. Diagonal 211, Barcelona', zona:'CBD BCN · 22@', renta:3.8, m2:32000 },
      { activo:'Torre Cristal B4', direccion:'P.º de la Castellana 259, Madrid', zona:'CBD · Gran Vía-Recoletos', renta:4.2, m2:45000 },
      { activo:'P.E. Las Rozas', direccion:'C/ Rozabella 2, Las Rozas', zona:'Descentralizado · Las Rozas', renta:5.1, m2:28000 },
      { activo:'Albatros Campus', direccion:'Av. de Bruselas 33, Alcobendas', zona:'A-1 · Alcobendas', renta:5.5, m2:22000 },
      { activo:'C.C. La Maquinista', direccion:'C/ Potosí 2, Barcelona', zona:'Periferia BCN · Sant Adrià', renta:5.8, m2:65000 },
    ],
    trend: [
      { label:'Q1', value:505 },
      { label:'Q2', value:638 },
      { label:'Q3', value:210 },
      { label:'Q4', value:0 },
    ],
  },
}

const YEARS = ['2024','2025','2026']
const QUARTERS = ['Q1','Q2','Q3','Q4']
const PROVINCIAS = ['Madrid','Barcelona','Valencia','Sevilla']

function polarToXY(cx, cy, r, deg) {
  const rad = deg * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function BarChart({ items, color = 'var(--accent)', height = 90 }) {
  const max = Math.max(...items.map(i => i.value), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:height+46, padding:'10px 14px 4px' }}>
      {items.map((item, i) => {
        const barH = Math.max(4, Math.round(item.value / max * height))
        const lbl = item.value >= 1000000 ? `${(item.value/1000000).toFixed(0)}M`
                  : item.value >= 1000 ? `${(item.value/1000).toFixed(0)}k`
                  : String(item.value)
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{ fontSize:9, fontWeight:700, fontFamily:'var(--mono)', color:'var(--text3)' }}>{lbl}</div>
            <div style={{ width:'100%', height:barH, background:color, borderRadius:'3px 3px 0 0', opacity: Math.min(1, 0.55 + i * 0.15) }} />
            <div style={{ width:'100%', height:1, background:'var(--border)' }} />
            <div style={{ fontSize:8, color:'var(--text4)', textAlign:'center', lineHeight:1.3, wordBreak:'break-word', paddingTop:2 }}>{item.label}</div>
          </div>
        )
      })}
    </div>
  )
}

function LineChart({ points, color = 'var(--accent)' }) {
  const max = Math.max(...points.map(p => p.value), 1)
  const W = 300, H = 72, padX = 24, padY = 10
  const xs = points.map((_, i) => padX + i * ((W - 2*padX) / Math.max(points.length-1, 1)))
  const ys = points.map(p => H - padY - Math.round(p.value / max * (H - 2*padY)))
  const line = xs.map((x, i) => `${i===0?'M':'L'}${x},${ys[i]}`).join(' ')
  const fill = points.length > 1 ? `${line} L${xs[xs.length-1]},${H} L${xs[0]},${H} Z` : ''
  return (
    <div style={{ padding:'10px 14px 4px' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H+22}`} style={{ overflow:'visible' }}>
        <defs>
          <linearGradient id="lcg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a4828" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#5a4828" stopOpacity="0" />
          </linearGradient>
        </defs>
        {fill && <path d={fill} fill="url(#lcg)" />}
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => {
          const lbl = points[i].value >= 1000000 ? `${(points[i].value/1000000).toFixed(0)}M`
                    : points[i].value >= 1000 ? `${(points[i].value/1000).toFixed(0)}k`
                    : String(points[i].value)
          return (
            <g key={i}>
              <circle cx={x} cy={ys[i]} r="3.5" fill="white" stroke={color} strokeWidth="1.5" />
              <text x={x} y={ys[i]-8} textAnchor="middle" fontSize="8" fill="var(--text3)" fontWeight="600">{lbl}</text>
              <text x={x} y={H+16} textAnchor="middle" fontSize="9" fill="var(--text4)">{points[i].label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function DonutChart({ items }) {
  const COLORS = ['#5a4828','#0891b2','#059669','#d97706','#6b5b8e','#db2777','#dc2626']
  const total = items.reduce((s, i) => s + i.value, 0)
  const R=46, ir=22, cx=52, cy=52, sz=104
  // Guard: sin datos (todo a 0) → value/total = NaN rompía el path y dejaba el
  // gráfico en blanco. Mostramos un anillo neutro con "Sin datos".
  if (total <= 0) {
    return (
      <div style={{ display:'flex', gap:16, alignItems:'center', padding:'12px 14px' }}>
        <div style={{ width:sz, height:sz, borderRadius:'50%', border:'8px solid var(--border)', flexShrink:0 }} />
        <span style={{ fontSize:11, color:'var(--text4)' }}>Sin datos</span>
      </div>
    )
  }
  let angle = -90
  const slices = items.map((item, i) => {
    const sweep = (item.value/total)*360
    const a1 = angle, a2 = angle + sweep - 0.5
    angle += sweep
    const p1 = polarToXY(cx,cy,R,a1), p2 = polarToXY(cx,cy,R,a2)
    const i1 = polarToXY(cx,cy,ir,a1), i2 = polarToXY(cx,cy,ir,a2)
    const large = sweep > 180 ? 1 : 0
    const fmt = (n) => n.toFixed(1)
    return {
      d:`M${fmt(p1.x)},${fmt(p1.y)} A${R},${R} 0 ${large},1 ${fmt(p2.x)},${fmt(p2.y)} L${fmt(i2.x)},${fmt(i2.y)} A${ir},${ir} 0 ${large},0 ${fmt(i1.x)},${fmt(i1.y)} Z`,
      color: COLORS[i%COLORS.length], label:item.label, pct: Math.round(item.value/total*100)
    }
  })
  return (
    <div style={{ display:'flex', gap:16, alignItems:'center', padding:'12px 14px' }}>
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ flexShrink:0 }}>
        {slices.map((s,i) => <path key={i} d={s.d} fill={s.color} />)}
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:5, flex:1, minWidth:0 }}>
        {slices.map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:8,height:8,borderRadius:2,background:s.color,flexShrink:0 }} />
            <span style={{ fontSize:10,color:'var(--text2)',flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{s.label}</span>
            <span style={{ fontSize:10,fontWeight:700,fontFamily:'var(--mono)',color:'var(--text3)' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HierarchyTable({ data, cols, onRowClick }) {
  const [expanded, setExpanded] = useState({})
  const areas = [...new Set(data.map(r=>r.area))]

  return (
    <table className="dtbl" style={{width:'100%'}}>
      <thead>
        <tr>
          <th>Área / Zona / Subzona</th>
          {cols.map(c=><th key={c.key}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {areas.map(area=>{
          const areaRows = data.filter(r=>r.area===area)
          const zonas = [...new Set(areaRows.map(r=>r.zona))]
          const areaTotal = areaRows.reduce((s,r)=>s+(r.m2||0), 0)
          const isExpA = expanded[area]
          return [
            <tr key={area} onClick={()=>setExpanded(p=>({...p,[area]:!p[area]}))} style={{cursor:'pointer',background:'var(--gray-lt)'}}>
              <td style={{fontWeight:700,fontSize:11}}>
                <span style={{marginRight:6,fontSize:9}}>{isExpA?'▼':'▶'}</span>
                {area}
              </td>
              {cols.map(c=><td key={c.key} style={{fontWeight:700,fontSize:11,fontFamily:'var(--mono)'}}>{c.fmt ? c.fmt(areaTotal) : areaTotal.toLocaleString('es-ES')}</td>)}
            </tr>,
            ...(!isExpA ? [] : zonas.map(zona=>{
              const zonaRows = areaRows.filter(r=>r.zona===zona)
              const zonaTotal = zonaRows.reduce((s,r)=>s+(r.m2||0), 0)
              const isExpZ = expanded[`${area}_${zona}`]
              return [
                <tr key={`${area}_${zona}`} onClick={()=>setExpanded(p=>({...p,[`${area}_${zona}`]:!p[`${area}_${zona}`]}))} style={{cursor:'pointer',background:'var(--accent-lt)'}}>
                  <td style={{paddingLeft:20,fontWeight:600,fontSize:11}}>
                    <span style={{marginRight:6,fontSize:9}}>{isExpZ?'▼':'▶'}</span>
                    {zona}
                  </td>
                  {cols.map(c=><td key={c.key} style={{fontWeight:600,fontSize:11,fontFamily:'var(--mono)'}}>{c.fmt ? c.fmt(zonaTotal) : zonaTotal.toLocaleString('es-ES')}</td>)}
                </tr>,
                ...(!isExpZ ? [] : zonaRows.map(r=>(
                  <tr key={r.subzona} onClick={()=>onRowClick&&onRowClick(r)} style={{cursor:onRowClick?'pointer':'default'}}>
                    <td style={{paddingLeft:36,fontSize:11}}>↳ {r.subzona}</td>
                    {cols.map(c=><td key={c.key} style={{fontSize:11,fontFamily:'var(--mono)'}}>{c.fmt ? c.fmt(r[c.key]||0) : (r[c.key]||0).toLocaleString('es-ES')}</td>)}
                  </tr>
                )))
              ]
            }).flat())
          ]
        }).flat()}
      </tbody>
    </table>
  )
}

async function exportPDF(linea, fYear, d) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const accentR=30, accentG=64, accentB=175
  const gray = '#64748b'

  // Title page
  doc.setFillColor(accentR, accentG, accentB)
  doc.rect(0, 0, 297, 30, 'F')
  doc.setTextColor(255,255,255)
  doc.setFontSize(18); doc.setFont(undefined,'bold')
  doc.text(`${linea.label} — Informe de Mercado ${fYear}`, 14, 13)
  doc.setFontSize(10); doc.setFont(undefined,'normal')
  doc.text('Datos relacionales · Activos, Arrendatarios, Propietarios', 14, 22)

  // KPIs
  doc.setTextColor(0,0,0)
  let y = 40
  doc.setFontSize(11); doc.setFont(undefined,'bold')
  doc.text('Indicadores clave', 14, y); y+=6
  doc.setFontSize(9); doc.setFont(undefined,'normal')
  const totalTakeup = d.takeup.reduce((s,r)=>s+r.m2,0)
  doc.text(`Take-up acumulado: ${(totalTakeup/1000).toFixed(0)}k m²`, 14, y)
  doc.text(`Transacciones: ${d.transacciones.length}`, 90, y)
  doc.text(`Disponible: ${(d.disponibilidad.reduce((s,r)=>s+r.m2,0)/1000).toFixed(0)}k m²`, 160, y)
  doc.text(`Renta prime: ${Math.max(...d.top10_renta.map(r=>r.renta))} €/m²/mes`, 230, y)
  y += 10

  // Transactions table
  doc.setFontSize(11); doc.setFont(undefined,'bold')
  doc.text('Transacciones cerradas', 14, y); y+=6
  doc.setFontSize(8); doc.setFont(undefined,'bold')
  doc.setFillColor(240,242,247)
  doc.rect(14, y-4, 269, 6, 'F')
  doc.text('Arrendatario', 15, y); doc.text('Edificio', 70, y); doc.text('Dirección', 115, y)
  doc.text('m²', 185, y); doc.text('€/m²/mes', 205, y); doc.text('Período', 240, y)
  y += 2
  doc.setFont(undefined,'normal')
  d.transacciones.forEach(t => {
    if (y > 185) { doc.addPage(); y = 20 }
    y += 6
    doc.text(t.arrendatario.substring(0,18), 15, y)
    doc.text(t.activo.substring(0,18), 70, y)
    doc.text((t.direccion||'').substring(0,25), 115, y)
    doc.text(t.m2.toLocaleString('es-ES'), 185, y)
    doc.text(String(t.renta), 205, y)
    doc.text(t.fecha, 240, y)
  })
  y += 10

  // All ops
  if (d.ops_anio) {
    if (y > 150) { doc.addPage(); y = 20 }
    doc.setFontSize(11); doc.setFont(undefined,'bold')
    doc.text(`Todas las operaciones · ${fYear}`, 14, y); y+=6
    doc.setFontSize(8); doc.setFont(undefined,'bold')
    doc.setFillColor(240,242,247)
    doc.rect(14, y-4, 269, 6, 'F')
    doc.text('Arrendatario', 15, y); doc.text('Edificio', 65, y); doc.text('Dirección', 110, y)
    doc.text('Zona', 170, y); doc.text('m²', 205, y); doc.text('€/m²/mes', 220, y); doc.text('Tipo', 245, y); doc.text('Período', 265, y)
    y += 2; doc.setFont(undefined,'normal')
    d.ops_anio.forEach(op => {
      if (y > 195) { doc.addPage(); y = 20 }
      y += 6
      doc.text(op.arrendatario.substring(0,14), 15, y)
      doc.text(op.activo.substring(0,14), 65, y)
      doc.text((op.direccion||'').substring(0,20), 110, y)
      doc.text((op.zona||'').substring(0,18), 170, y)
      doc.text(op.m2.toLocaleString('es-ES'), 205, y)
      doc.text(String(op.renta), 222, y)
      doc.text(op.tipo||'', 245, y)
      doc.text(op.fecha, 265, y)
    })
  }

  // Top propietarios
  doc.addPage(); y = 20
  doc.setFontSize(11); doc.setFont(undefined,'bold')
  doc.text('Top propietarios · Superficie absorbida', 14, y); y+=6
  doc.setFontSize(8); doc.setFont(undefined,'bold')
  doc.setFillColor(240,242,247)
  doc.rect(14, y-4, 130, 6, 'F')
  doc.text('#', 15, y); doc.text('Propietario', 22, y); doc.text('m²', 100, y); doc.text('Renta media', 115, y)
  y+=2; doc.setFont(undefined,'normal')
  d.top10_propietarios_m2.forEach((r,i)=>{ y+=6; doc.text(String(i+1), 15, y); doc.text(r.propietario.substring(0,30), 22, y); doc.text(r.m2.toLocaleString('es-ES'), 100, y); doc.text(String(r.renta), 115, y) })

  // Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let i=1; i<=pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7); doc.setTextColor(150,150,150)
    doc.text(`${linea.label} — Informe de Mercado ${fYear}  ·  Página ${i} de ${pageCount}`, 14, 205)
    doc.text(new Date().toLocaleDateString('es-ES'), 270, 205)
  }

  doc.save(`Informe_${linea.id}_${fYear}.pdf`)
}

async function exportPPT(linea, fYear, d) {
  const pptxgen = (await import('pptxgenjs')).default
  const prs = new pptxgen()
  prs.layout = 'LAYOUT_WIDE'
  const ACCENT = '1e40af'
  const GRAY   = '64748b'
  const LIGHT  = 'f1f5f9'

  const addHeader = (slide, title) => {
    slide.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.7, fill:{ color:ACCENT } })
    slide.addText(`${linea.label} — Informe de Mercado ${fYear}`, { x:0.3, y:0.05, w:8, h:0.4, fontSize:10, color:'ffffff', bold:false })
    slide.addText(title, { x:0.3, y:0.42, w:12, h:0.3, fontSize:8, color:'adc6ff' })
    slide.addText(new Date().toLocaleDateString('es-ES'), { x:11.5, y:0.15, w:1.5, h:0.4, fontSize:8, color:'ffffff', align:'right' })
  }

  // Slide 1: Cover
  const s1 = prs.addSlide()
  s1.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%', fill:{ color:ACCENT } })
  s1.addText(linea.label, { x:0.6, y:1.4, w:12, h:1.2, fontSize:44, bold:true, color:'ffffff' })
  s1.addText(`Informe de Mercado · ${fYear}`, { x:0.6, y:2.7, w:10, h:0.6, fontSize:20, color:'93c5fd' })
  s1.addText('Datos relacionales · Activos, Arrendatarios, Propietarios', { x:0.6, y:3.5, w:10, h:0.4, fontSize:11, color:'bfdbfe' })

  // Slide 2: KPIs
  const totalTakeup = d.takeup.reduce((s,r)=>s+r.m2,0)
  const rentaPrime  = Math.max(...d.top10_renta.map(r=>r.renta))
  const totalDisp   = d.disponibilidad.reduce((s,r)=>s+r.m2,0)
  const s2 = prs.addSlide()
  addHeader(s2, 'Indicadores clave')
  const kpis = [
    { lbl:'Take-up acumulado', val:`${(totalTakeup/1000).toFixed(0)}k m²` },
    { lbl:'Transacciones',     val:d.transacciones.length },
    { lbl:'Disponible total',  val:`${(totalDisp/1000).toFixed(0)}k m²` },
    { lbl:'Renta prime',       val:`${rentaPrime} €/m²/mes` },
  ]
  kpis.forEach((k,i) => {
    const x = 0.3 + i*3.2
    s2.addShape(prs.ShapeType.rect, { x, y:1.0, w:3.0, h:2.0, fill:{color:LIGHT}, line:{color:'dde1e7',width:1} })
    s2.addText(k.lbl, { x, y:1.15, w:3.0, h:0.4, fontSize:8, color:GRAY, align:'center', bold:true })
    s2.addText(String(k.val), { x, y:1.6, w:3.0, h:1.0, fontSize:24, bold:true, color:ACCENT, align:'center' })
  })

  // Slide 3: Transacciones
  const s3 = prs.addSlide()
  addHeader(s3, '3. Transacciones cerradas')
  const trxRows = [
    [{ text:'Arrendatario',bold:true },{ text:'Edificio',bold:true },{ text:'Dirección',bold:true },{ text:'m²',bold:true },{ text:'€/m²/mes',bold:true },{ text:'Período',bold:true }],
    ...d.transacciones.map(t=>[t.arrendatario, t.activo, t.direccion||'', t.m2.toLocaleString('es-ES'), String(t.renta), t.fecha])
  ]
  s3.addTable(trxRows, { x:0.3, y:0.9, w:13, colW:[2.8,2.4,3,1.5,1.5,1.4], fontSize:8, border:{type:'solid',color:'e2e8f0',pt:1} })

  // Slide 4: All operations
  if (d.ops_anio) {
    const s4 = prs.addSlide()
    addHeader(s4, `9. Todas las operaciones · ${fYear}`)
    const opsRows = [
      [{ text:'Arrendatario',bold:true },{ text:'Edificio',bold:true },{ text:'Dirección',bold:true },{ text:'Zona',bold:true },{ text:'m²',bold:true },{ text:'€/m²',bold:true },{ text:'Tipo',bold:true },{ text:'Período',bold:true }],
      ...d.ops_anio.map(op=>[op.arrendatario, op.activo, op.direccion||'', op.zona||'', op.m2.toLocaleString('es-ES'), String(op.renta), op.tipo||'', op.fecha])
    ]
    s4.addTable(opsRows, { x:0.3, y:0.9, w:13, fontSize:7.5, border:{type:'solid',color:'e2e8f0',pt:1} })
  }

  // Slide 5: Top activos
  if (d.top5_activos_m2 && d.top5_activos_renta) {
    const s5a = prs.addSlide()
    addHeader(s5a, '9. Top activos · Mayor superficie absorbida')
    const act_m2Rows = [
      [{ text:'#',bold:true },{ text:'Activo',bold:true },{ text:'Dirección',bold:true },{ text:'Zona',bold:true },{ text:'m²',bold:true },{ text:'Arrend.',bold:true }],
      ...d.top5_activos_m2.map((r,i)=>[String(i+1), r.activo, r.direccion, r.zona, r.m2.toLocaleString('es-ES'), String(r.nArrendatarios)])
    ]
    s5a.addTable(act_m2Rows, { x:0.3, y:0.9, w:13, colW:[0.4,2.5,3.5,3,2,0.8], fontSize:9, border:{type:'solid',color:'e2e8f0',pt:1} })

    const s5b = prs.addSlide()
    addHeader(s5b, '10. Top activos · Renta prime más alta')
    const act_rentaRows = [
      [{ text:'#',bold:true },{ text:'Activo',bold:true },{ text:'Dirección',bold:true },{ text:'Zona',bold:true },{ text:'Renta €/m²/mes',bold:true },{ text:'m²',bold:true }],
      ...d.top5_activos_renta.map((r,i)=>[String(i+1), r.activo, r.direccion, r.zona, String(r.renta), r.m2.toLocaleString('es-ES')])
    ]
    s5b.addTable(act_rentaRows, { x:0.3, y:0.9, w:13, colW:[0.4,2.5,3.5,3,1.8,1.5], fontSize:9, border:{type:'solid',color:'e2e8f0',pt:1} })
  }

  // Slide 6: Top propietarios
  const s6 = prs.addSlide()
  addHeader(s6, '7. Top propietarios · Superficie absorbida')
  const propRows = [
    [{ text:'#',bold:true },{ text:'Propietario',bold:true },{ text:'m²',bold:true },{ text:'Renta media',bold:true }],
    ...d.top10_propietarios_m2.map((r,i)=>[String(i+1), r.propietario, r.m2.toLocaleString('es-ES'), `${r.renta} €/m²/mes`])
  ]
  s6.addTable(propRows, { x:0.3, y:0.9, w:8, colW:[0.5,4,2,1.5], fontSize:9, border:{type:'solid',color:'e2e8f0',pt:1} })

  await prs.writeFile({ fileName:`Informe_${linea.id}_${fYear}.pptx` })
}

function arrendatariosToInforme(rows) {
  // Map real arrendatarios rows to the shapes used by InformeLinea sections
  const transacciones = rows
    .filter(r => r.inicio && r.m2 > 0)
    .map(r => ({
      area: 'Real',
      zona: r.activo_ref || '—',
      subzona: r.activo_ref || '—',
      arrendatario: r.nombre || '—',
      activo: r.activo_ref || '—',
      direccion: '',
      m2: Number(r.m2) || 0,
      renta: Number(r.closing_rent) || 0,
      fecha: r.trimestre && r.anio_firma ? `${r.trimestre} ${r.anio_firma}` : (r.inicio ? r.inicio.slice(0,7) : '—'),
    }))

  if (transacciones.length === 0) return null

  const sorted_m2    = [...transacciones].sort((a,b) => b.m2 - a.m2)
  const sorted_renta = [...transacciones].sort((a,b) => b.renta - a.renta)

  return {
    transacciones: transacciones.slice(0,5),
    ops_anio: transacciones,
    top10_m2:    sorted_m2.slice(0,5).map(t=>({ arrendatario:t.arrendatario, activo:t.activo, m2:t.m2, renta:t.renta })),
    top10_renta: sorted_renta.slice(0,5).map(t=>({ arrendatario:t.arrendatario, activo:t.activo, m2:t.m2, renta:t.renta })),
  }
}

function InformeLinea({ linea, navigate }) {
  const [fYear,     setFYear]     = useState('2026')
  const [fQuarter,  setFQuarter]  = useState([])
  const [fProvincia,setFProvincia]= useState([])
  const [dbOverride, setDbOverride] = useState(null)
  const [loadingDb,  setLoadingDb]  = useState(true)

  useEffect(() => {
    supabase.from('arrendatarios')
      .select('ref,nombre,activo_ref,inicio,fecha_fin:vencimiento,m2:superficie,closing_rent,anio_firma:anyo_firma,trimestre')
      .then(({ data }) => {
        if (data?.length > 0) {
          const mapped = arrendatariosToInforme(data)
          if (mapped) setDbOverride(mapped)
        }
        setLoadingDb(false)
      })
  }, [])

  const base = DATA_LINEA[linea.id] || DATA_LINEA.oficinas
  // For non-investment lines, overlay real arrendatarios data onto transacciones/ops/top sections
  const d = (dbOverride && linea.id !== 'inversion')
    ? { ...base, ...dbOverride }
    : base

  const totalTakeup = d.takeup.reduce((s,r)=>s+r.m2, 0)
  const maxSector = Math.max(...d.sectores.map(s=>s.m2), 1)

  const filterSel = {fontSize:10,padding:'3px 8px',borderRadius:5,border:'1px solid var(--border)',background:'var(--surface)',fontFamily:'inherit',cursor:'pointer'}

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>

      {/* Header */}
      <div style={{padding:'10px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700}}>{linea.label} — Informe de Mercado</div>
          <div style={{fontSize:10,color:'var(--text3)'}}>
            Datos relacionales · Activos, Arrendatarios, Propietarios
            {loadingDb && <span style={{marginLeft:8,color:'var(--text4)'}}>· Cargando datos reales...</span>}
            {!loadingDb && dbOverride && linea.id !== 'inversion' && <span style={{marginLeft:8,color:'var(--green)',fontWeight:600}}>· Contratos reales cargados</span>}
          </div>
        </div>

        {/* Filtros globales */}
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Año</span>
          <select style={filterSel} value={fYear} onChange={e=>setFYear(e.target.value)}>
            {YEARS.map(y=><option key={y}>{y}</option>)}
          </select>
          <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Trimestre</span>
          <select style={filterSel} value={fQuarter[0]||''} onChange={e=>setFQuarter(e.target.value?[e.target.value]:[])}>
            <option value="">Todos</option>
            {QUARTERS.map(q=><option key={q}>{q}</option>)}
          </select>
          <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Provincia</span>
          <select style={filterSel} value={fProvincia[0]||''} onChange={e=>setFProvincia(e.target.value?[e.target.value]:[])}>
            <option value="">Todas</option>
            {PROVINCIAS.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Exportar */}
        <div style={{display:'flex',gap:6,marginLeft:8}}>
          <button onClick={()=>exportPDF(linea,fYear,d)} style={{fontSize:10,padding:'4px 10px',borderRadius:5,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontFamily:'inherit',fontWeight:600,color:'var(--text2)',display:'flex',alignItems:'center',gap:5}}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{width:12,height:12}}><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4"/><path d="M5 10h6M5 12h4"/></svg>
            PDF
          </button>
          <button onClick={()=>exportPPT(linea,fYear,d)} style={{fontSize:10,padding:'4px 10px',borderRadius:5,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontFamily:'inherit',fontWeight:600,color:'var(--text2)',display:'flex',alignItems:'center',gap:5}}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{width:12,height:12}}><rect x="1" y="2" width="14" height="12" rx="1.5"/><path d="M5 6h3a1.5 1.5 0 010 3H5V6zM8 9v3"/></svg>
            PPT
          </button>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'14px 16px',display:'flex',flexDirection:'column',gap:12}}>

        {/* KPIs */}
        {(() => {
          const isCapMkt = linea.id === 'inversion'
          const volTotal = isCapMkt ? d.transacciones.reduce((s,t)=>s+(t.precio||0),0) : 0
          const yieldPrime = isCapMkt ? Math.min(...d.top10_renta.map(r=>r.renta)) : 0
          const kpis = isCapMkt ? [
            {lbl:'Volumen inversión',  val:`${volTotal} M€`,          color:'var(--accent)'},
            {lbl:'Operaciones',        val:d.transacciones.length,     color:'var(--teal)'},
            {lbl:'Yield prime',        val:`${yieldPrime}%`,           color:'var(--green)'},
            {lbl:'Mayor operación',    val:`${Math.max(...d.transacciones.map(t=>t.precio||0))} M€`, color:'var(--amber)'},
          ] : [
            {lbl:'Take-up acumulado',  val:`${(totalTakeup/1000).toFixed(0)}k m²`, color:'var(--accent)'},
            {lbl:'Transacciones',      val:d.transacciones.length,     color:'var(--teal)'},
            {lbl:'Disponible total',   val:`${(d.disponibilidad.reduce((s,r)=>s+r.m2,0)/1000).toFixed(0)}k m²`, color:'var(--amber)'},
            {lbl:'Renta prime',        val:`${Math.max(...d.top10_renta.map(r=>r.renta))} €/m²/mes`, color:'var(--green)'},
          ]
          return (
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {kpis.map(k=>(
                <div key={k.lbl} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'10px 14px',textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{k.lbl}</div>
                  <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:k.color}}>{k.val}</div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* ── RESUMEN VISUAL ── */}
        {(() => {
          const isCapMkt = linea.id === 'inversion'
          const takeupByArea = [...new Set(d.takeup.map(r=>r.area))].map(a=>({label:a, value:d.takeup.filter(r=>r.area===a).reduce((s,r)=>s+r.m2,0)}))
          const dispByArea   = [...new Set(d.disponibilidad.map(r=>r.area))].map(a=>({label:a, value:d.disponibilidad.filter(r=>r.area===a).reduce((s,r)=>s+r.m2,0)}))
          return (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              {/* Chart A: take-up / volumen por área */}
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',fontSize:10,fontWeight:600,color:'var(--text2)'}}>
                  {isCapMkt ? 'Volumen inversión por mercado' : 'Take-up por área'}
                </div>
                <BarChart items={takeupByArea} height={100} />
              </div>
              {/* Chart B: disponibilidad por área */}
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',fontSize:10,fontWeight:600,color:'var(--text2)'}}>
                  Disponibilidad por área
                </div>
                <BarChart items={dispByArea} color="var(--amber)" height={100} />
              </div>
              {/* Chart C: evolución trimestral */}
              {d.trend ? (
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                  <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',fontSize:10,fontWeight:600,color:'var(--text2)'}}>
                    {isCapMkt ? 'Volumen inversión · €M' : 'Evolución take-up · m²'}
                  </div>
                  <LineChart points={d.trend} />
                </div>
              ) : (
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                  <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',fontSize:10,fontWeight:600,color:'var(--text2)'}}>Distribución por sector</div>
                  <DonutChart items={d.sectores.map(s=>({label:s.sector,value:s.m2}))} />
                </div>
              )}
            </div>
          )
        })()}

        {/* ── SEGUNDA FILA DE GRÁFICOS ── */}
        {d.trend && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
              <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',fontSize:10,fontWeight:600,color:'var(--text2)'}}>Distribución por sector</div>
              <DonutChart items={d.sectores.map(s=>({label:s.sector,value:s.m2}))} />
            </div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
              <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',fontSize:10,fontWeight:600,color:'var(--text2)'}}>
                {linea.id==='inversion' ? 'Precio medio €/m² por operación' : 'Renta media por operación'}
              </div>
              <BarChart
                color="var(--teal)"
                height={100}
                items={d.transacciones.map(t=>({
                  label: t.activo ? t.activo.split(' ').slice(0,2).join(' ') : '',
                  value: linea.id==='inversion' ? (t.precio||0) : (t.renta||0)
                }))}
              />
            </div>
          </div>
        )}

        {/* 1. Take-up */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>
            1. {linea.id==='inversion' ? 'Volumen de inversión' : 'Take-up acumulado'} · {fYear}{fQuarter[0]?' '+fQuarter[0]:''}
          </div>
          <HierarchyTable data={d.takeup} cols={[{key:'m2',label:'m²',fmt:v=>v.toLocaleString('es-ES')+' m²'}]} onRowClick={()=>navigate('activos')}/>
        </div>

        {/* 2. Disponibilidad */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>2. Disponibilidad actual</div>
          <HierarchyTable data={d.disponibilidad} cols={[{key:'m2',label:'m² Disponible',fmt:v=>v.toLocaleString('es-ES')+' m²'},{key:'activos',label:'Activos'}]} onRowClick={()=>navigate('ofertas')}/>
        </div>

        {/* 3. Transacciones */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>3. Transacciones cerradas</div>
          {linea.id === 'inversion' ? (
            <table className="dtbl">
              <thead><tr><th>Comprador</th><th>Vendedor</th><th>Activo</th><th>Dirección</th><th>m²</th><th>Precio M€</th><th>Yield %</th><th>Período</th></tr></thead>
              <tbody>
                {d.transacciones.map((t,i)=>(
                  <tr key={i} onClick={()=>navigate('portfolio')} style={{cursor:'pointer'}}>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{t.comprador}</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{t.vendedor}</td>
                    <td style={{fontSize:11}}><span className="asset-link" onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>{t.activo}</span></td>
                    <td style={{fontSize:10,color:'var(--text3)'}}>{t.direccion}</td>
                    <td className="mono" style={{fontSize:11}}>{t.m2.toLocaleString('es-ES')}</td>
                    <td className="mono" style={{fontSize:11,fontWeight:700,color:'var(--accent)'}}>{t.precio}</td>
                    <td className="mono" style={{fontSize:11,fontWeight:700,color:'var(--teal)'}}>{t.yield_}%</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{t.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="dtbl">
              <thead><tr><th>Arrendatario</th><th>Edificio</th><th>Dirección</th><th>Zona</th><th>m²</th><th>Renta €/m²/mes</th><th>Período</th></tr></thead>
              <tbody>
                {d.transacciones.map((t,i)=>(
                  <tr key={i} onClick={()=>navigate('ficha-arrendatario')} style={{cursor:'pointer'}}>
                    <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{t.arrendatario}</td>
                    <td style={{fontSize:11}}><span className="asset-link" onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>{t.activo}</span></td>
                    <td style={{fontSize:10,color:'var(--text3)'}}>{t.direccion}</td>
                    <td style={{fontSize:11}}>{t.zona} · {t.subzona}</td>
                    <td className="mono" style={{fontSize:11}}>{t.m2.toLocaleString('es-ES')}</td>
                    <td className="mono" style={{fontSize:11,fontWeight:700,color:'var(--teal)'}}>{t.renta}</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{t.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 4 & 5. Top operaciones */}
        {linea.id === 'inversion' ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
              <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>4. Top operaciones · Mayor volumen (M€)</div>
              <table className="dtbl">
                <thead><tr><th>#</th><th>Comprador</th><th>Activo</th><th>Precio M€</th><th>m²</th></tr></thead>
                <tbody>
                  {d.top10_m2.map((r,i)=>(
                    <tr key={i} onClick={()=>navigate('portfolio')} style={{cursor:'pointer'}}>
                      <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.arrendatario}</td>
                      <td style={{fontSize:11}}>{r.activo}</td>
                      <td className="mono" style={{fontSize:11,fontWeight:700,color:'var(--accent)'}}>{(r.renta/1000).toFixed(1)} M€</td>
                      <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
              <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>5. Top operaciones · Yield prime más bajo</div>
              <table className="dtbl">
                <thead><tr><th>#</th><th>Comprador</th><th>Activo</th><th>Yield %</th><th>m²</th></tr></thead>
                <tbody>
                  {d.top10_renta.map((r,i)=>(
                    <tr key={i} onClick={()=>navigate('portfolio')} style={{cursor:'pointer'}}>
                      <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.arrendatario}</td>
                      <td style={{fontSize:11}}>{r.activo}</td>
                      <td className="mono" style={{fontSize:11,fontWeight:800,color:'var(--teal)'}}>{r.renta}%</td>
                      <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
              <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>4. Top operaciones · Mayor superficie</div>
              <table className="dtbl">
                <thead><tr><th>#</th><th>Arrendatario</th><th>m²</th><th>€/m²/mes</th></tr></thead>
                <tbody>
                  {d.top10_m2.map((r,i)=>(
                    <tr key={i} onClick={()=>navigate('ficha-arrendatario')} style={{cursor:'pointer'}}>
                      <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.arrendatario}</td>
                      <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                      <td className="mono" style={{fontSize:11,color:'var(--teal)',fontWeight:700}}>{r.renta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
              <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>5. Top operaciones · Renta más alta</div>
              <table className="dtbl">
                <thead><tr><th>#</th><th>Arrendatario</th><th>€/m²/mes</th><th>m²</th></tr></thead>
                <tbody>
                  {d.top10_renta.map((r,i)=>(
                    <tr key={i} onClick={()=>navigate('ficha-arrendatario')} style={{cursor:'pointer'}}>
                      <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.arrendatario}</td>
                      <td className="mono" style={{fontSize:11,fontWeight:800,color:'var(--teal)'}}>{r.renta}</td>
                      <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Sector de actividad */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
          <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>
            {linea.id==='inversion' ? '6. Distribución por tipo de activo' : '6. Sector de actividad con más contratación'}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:0}}>
            <div style={{padding:'12px 14px',borderRight:'1px solid var(--border)'}}>
              {d.sectores.map((s,i)=>(
                <div key={s.sector} style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
                  <div style={{width:16,fontSize:10,fontWeight:700,color:'var(--text4)',textAlign:'right',fontFamily:'var(--mono)',flexShrink:0}}>{i+1}</div>
                  <div style={{width:120,fontSize:10,color:'var(--text2)',flexShrink:0}}>{s.sector}</div>
                  <div style={{flex:1,height:7,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.round(s.m2/maxSector*100)}%`,background:'var(--accent)',borderRadius:4}}/>
                  </div>
                  <div style={{width:70,fontSize:10,fontWeight:700,fontFamily:'var(--mono)',textAlign:'right',flexShrink:0}}>{s.m2.toLocaleString('es-ES')} m²</div>
                </div>
              ))}
            </div>
            <DonutChart items={d.sectores.map(s=>({label:s.sector,value:s.m2}))} />
          </div>
        </div>

        {/* 7 & 8. Top compradores / propietarios */}
        {linea.id === 'inversion' ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
              <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>7. Top compradores · Mayor volumen adquirido</div>
              <table className="dtbl">
                <thead><tr><th>#</th><th>Comprador</th><th>m² adquiridos</th><th>Yield medio</th></tr></thead>
                <tbody>
                  {d.top10_propietarios_m2.map((r,i)=>(
                    <tr key={i} onClick={()=>navigate('portfolio')} style={{cursor:'pointer'}}>
                      <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.propietario}</td>
                      <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                      <td className="mono" style={{fontSize:11,color:'var(--teal)'}}>{r.renta}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
              <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>8. Top compradores · Yield prime más bajo</div>
              <table className="dtbl">
                <thead><tr><th>#</th><th>Comprador</th><th>Yield prime</th><th>m²</th></tr></thead>
                <tbody>
                  {d.top10_propietarios_renta.map((r,i)=>(
                    <tr key={i} onClick={()=>navigate('portfolio')} style={{cursor:'pointer'}}>
                      <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.propietario}</td>
                      <td className="mono" style={{fontSize:11,fontWeight:800,color:'var(--teal)'}}>{r.renta}%</td>
                      <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
              <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>7. Top propietarios · Superficie absorbida</div>
              <table className="dtbl">
                <thead><tr><th>#</th><th>Propietario</th><th>m²</th><th>Renta media</th></tr></thead>
                <tbody>
                  {d.top10_propietarios_m2.map((r,i)=>(
                    <tr key={i} onClick={()=>navigate('portfolio')} style={{cursor:'pointer'}}>
                      <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.propietario}</td>
                      <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                      <td className="mono" style={{fontSize:11,color:'var(--teal)'}}>{r.renta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
              <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>8. Top propietarios · Renta más alta</div>
              <table className="dtbl">
                <thead><tr><th>#</th><th>Propietario</th><th>Renta max.</th><th>m²</th></tr></thead>
                <tbody>
                  {d.top10_propietarios_renta.map((r,i)=>(
                    <tr key={i} onClick={()=>navigate('portfolio')} style={{cursor:'pointer'}}>
                      <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.propietario}</td>
                      <td className="mono" style={{fontSize:11,fontWeight:800,color:'var(--teal)'}}>{r.renta}</td>
                      <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9 & 10. Top 5 activos */}
        {(d.top5_activos_m2 || d.top5_activos_renta) && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {d.top5_activos_m2 && (
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>9. Top activos · Mayor superficie absorbida</div>
                <table className="dtbl">
                  <thead><tr><th>#</th><th>Activo</th><th>Dirección</th><th>Zona</th><th>m²</th><th>Arrendatarios</th></tr></thead>
                  <tbody>
                    {d.top5_activos_m2.map((r,i)=>(
                      <tr key={i} onClick={()=>navigate('ficha-activo')} style={{cursor:'pointer'}}>
                        <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                        <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.activo}</td>
                        <td style={{fontSize:10,color:'var(--text3)'}}>{r.direccion}</td>
                        <td style={{fontSize:10,color:'var(--text3)'}}>{r.zona}</td>
                        <td className="mono" style={{fontSize:11,fontWeight:700}}>{r.m2.toLocaleString('es-ES')}</td>
                        <td className="mono" style={{fontSize:11,color:'var(--text3)'}}>{r.nArrendatarios}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {d.top5_activos_renta && (
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600}}>10. Top activos · Renta prime más alta</div>
                <table className="dtbl">
                  <thead><tr><th>#</th><th>Activo</th><th>Dirección</th><th>Zona</th><th>Renta €/m²/mes</th><th>m²</th></tr></thead>
                  <tbody>
                    {d.top5_activos_renta.map((r,i)=>(
                      <tr key={i} onClick={()=>navigate('ficha-activo')} style={{cursor:'pointer'}}>
                        <td style={{fontSize:10,color:'var(--text4)',fontFamily:'var(--mono)'}}>{i+1}</td>
                        <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{r.activo}</td>
                        <td style={{fontSize:10,color:'var(--text3)'}}>{r.direccion}</td>
                        <td style={{fontSize:10,color:'var(--text3)'}}>{r.zona}</td>
                        <td className="mono" style={{fontSize:11,fontWeight:800,color:'var(--teal)'}}>{r.renta}</td>
                        <td className="mono" style={{fontSize:11}}>{r.m2.toLocaleString('es-ES')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 11. Todas las operaciones del año */}
        {d.ops_anio && (
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
            <div style={{padding:'9px 14px',borderBottom:'1px solid var(--border)',fontSize:11,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span>11. Todas las operaciones · {fYear}</span>
              <span style={{fontSize:10,color:'var(--text4)',fontWeight:400}}>{d.ops_anio.length} operaciones</span>
            </div>
            {linea.id === 'inversion' ? (
              <table className="dtbl">
                <thead><tr><th>Comprador</th><th>Vendedor</th><th>Activo</th><th>Dirección</th><th>Zona</th><th>m²</th><th>Precio M€</th><th>Yield %</th><th>Período</th></tr></thead>
                <tbody>
                  {d.ops_anio.map((op,i)=>(
                    <tr key={i} onClick={()=>navigate('portfolio')} style={{cursor:'pointer'}}>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{op.comprador}</td>
                      <td style={{fontSize:11,color:'var(--text3)'}}>{op.vendedor}</td>
                      <td style={{fontSize:11}}><span className="asset-link" onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>{op.activo}</span></td>
                      <td style={{fontSize:10,color:'var(--text3)'}}>{op.direccion}</td>
                      <td style={{fontSize:11,color:'var(--text3)'}}>{op.zona}</td>
                      <td className="mono" style={{fontSize:11}}>{op.m2.toLocaleString('es-ES')}</td>
                      <td className="mono" style={{fontSize:11,fontWeight:700,color:'var(--accent)'}}>{op.precio}</td>
                      <td className="mono" style={{fontSize:11,fontWeight:700,color:'var(--teal)'}}>{op.yield_}%</td>
                      <td style={{fontSize:11,color:'var(--text3)'}}>{op.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="dtbl">
                <thead><tr><th>Arrendatario</th><th>Edificio</th><th>Dirección</th><th>Zona</th><th>m²</th><th>€/m²/mes</th><th>Tipo</th><th>Período</th></tr></thead>
                <tbody>
                  {d.ops_anio.map((op,i)=>(
                    <tr key={i} onClick={()=>navigate('ficha-arrendatario')} style={{cursor:'pointer'}}>
                      <td style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{op.arrendatario}</td>
                      <td style={{fontSize:11}}><span className="asset-link" onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>{op.activo}</span></td>
                      <td style={{fontSize:10,color:'var(--text3)'}}>{op.direccion}</td>
                      <td style={{fontSize:11,color:'var(--text3)'}}>{op.zona}</td>
                      <td className="mono" style={{fontSize:11}}>{op.m2.toLocaleString('es-ES')}</td>
                      <td className="mono" style={{fontSize:11,fontWeight:700,color:'var(--teal)'}}>{op.renta}</td>
                      <td><span style={{fontSize:9,padding:'1px 6px',borderRadius:6,border:'1px solid var(--border)',background:'var(--gray-lt)',color:'var(--text3)',fontWeight:600}}>{op.tipo}</span></td>
                      <td style={{fontSize:11,color:'var(--text3)'}}>{op.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default function InformesMercado() {
  const { navigate } = useNav()
  const [linea, setLinea] = useState(null)

  if (linea) {
    return (
      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
        <div style={{padding:'6px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <button onClick={()=>setLinea(null)} style={{fontSize:11,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:600,padding:0}}>
            ← Informes de Mercado
          </button>
        </div>
        <InformeLinea linea={linea} navigate={navigate}/>
      </div>
    )
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div style={{padding:'10px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{fontSize:14,fontWeight:700}}>Informes de Mercado</div>
        <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>Selecciona una línea de negocio para ver el informe de mercado</div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,height:'100%'}}>
          {LINEAS_NEGOCIO.map(l=>(
            <div key={l.id} onClick={()=>setLinea(l)}
              style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'24px 16px',cursor:'pointer',transition:'box-shadow .15s, border-color .15s',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.08)';e.currentTarget.style.borderColor='var(--text4)'}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='var(--border)'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:36,height:36,flexShrink:0}}>
                {l.paths}
              </svg>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',lineHeight:1.3}}>{l.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
