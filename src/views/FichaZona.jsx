import { useState, useRef, useEffect } from 'react'
import { useNav } from '../context/NavigationContext'
import { exportPDF, exportPPT } from '../utils/exportReport'
import { usoColor, usoTag } from '../lib/usoConfig'

function ExportMenu({ getConfig }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <button onClick={() => setOpen(o => !o)}
        style={{padding:'7px 16px',background:'var(--accent)',border:'none',borderRadius:6,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:6,boxShadow:'0 1px 4px rgba(59,130,246,.3)'}}>
        ⬇ Exportar informe <span style={{fontSize:8,marginLeft:2}}>{open?'▲':'▼'}</span>
      </button>
      {open && (
        <div style={{position:'absolute',right:0,top:'110%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,boxShadow:'0 4px 16px rgba(0,0,0,.12)',zIndex:999,minWidth:130,overflow:'hidden'}}>
          <div onClick={() => { setOpen(false); exportPDF(getConfig()) }}
            style={{padding:'9px 14px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid var(--border)'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
            onMouseLeave={e=>e.currentTarget.style.background=''}>
            📄 <span>PDF</span>
          </div>
          <div onClick={() => { setOpen(false); exportPPT(getConfig()) }}
            style={{padding:'9px 14px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
            onMouseLeave={e=>e.currentTarget.style.background=''}>
            <span>PowerPoint</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Datos de la zona M-30 — construidos relacionalmente desde los módulos base
const ZONA = {
  id:'MAD-M30', zona:'M-30 / Distrito Centro', subzona:'M-30', provincia:'Madrid',
  area:'Madrid Centro · M-30 interior', uso:'Oficinas',
  stock:58156, disponible:13024, ocupacion:78.9, Disponibilidad:22.4,
  ofertas_activas:3, takeup_ytd:8500, ops_ytd:4,
  renta_media:13.5, renta_min:10.5, renta_max:16.8,
}

// Activos en esta zona (fuente: módulo Activos)
const ACTIVOS_ZONA = [
  {ref:'MAD-OF-00189',nombre:'P.E Avalon',zona:'M-30 · Madrid',uso:'Oficinas',sba:46956,disponible:10142,occ:78.4,renta:10.5,valor:'130 M€',estado:'Activo',dias:127,arrendatarios:4,ofertas:2},
  {ref:'MAD-OF-00841',nombre:'Parque Empresarial Norte',zona:'M-30 · Madrid',uso:'Oficinas',sba:11200,disponible:2882,occ:79.0,renta:16.8,valor:'68 M€',estado:'Activo',dias:34,arrendatarios:2,ofertas:1},
]

// Oferta activa (fuente: módulo Oferta → vinculada a activo)
const OFERTAS_ZONA = [
  {ref:'OLB001',activo:'P.E Avalon',espacio:'P5 · 1.500 m²',renta:'10,5–14,5 €/m²',m2:1500,estado:'En negociación',demanda:'Empresa XYZ'},
  {ref:'OLB002',activo:'P.E Avalon',espacio:'P3 · 733 m²',renta:'11,0–13,0 €/m²',m2:733,estado:'En curso',demanda:'—'},
  {ref:'OLB-NOR-001',activo:'Parque Empresarial Norte',espacio:'P2 · 2.882 m²',renta:'15,5–17,5 €/m²',m2:2882,estado:'En curso',demanda:'Grupo Prisa'},
]

// Transacciones históricas (fuente: Arrendatarios + conversión oferta → transacción)
const TRANS = [
  {fecha:'Mar 2026',activo:'P.E Avalon',arrendatario:'Oracle Spain SL',m2:13486,renta:12.5,tipo:'Nuevo contrato',duracion:'5 años'},
  {fecha:'Nov 2025',activo:'P.E Avalon',arrendatario:'Generali R.E.',m2:1500,renta:14.5,tipo:'Renovación',duracion:'3 años'},
  {fecha:'Jun 2025',activo:'P.E Norte',arrendatario:'Consulting Group',m2:1800,renta:16.0,tipo:'Nuevo contrato',duracion:'4 años'},
  {fecha:'Feb 2025',activo:'P.E Avalon',arrendatario:'Celonis SE',m2:2702,renta:10.5,tipo:'Prórroga',duracion:'1 año'},
  {fecha:'Sep 2024',activo:'P.E Norte',arrendatario:'Tech Partners',m2:1200,renta:15.5,tipo:'Nuevo contrato',duracion:'3 años'},
]

const TRANS_EST = {'Nuevo contrato':'tag-green',Renovación:'tag-blue',Prórroga:'tag-amber'}

export default function FichaZona() {
  const { navigate } = useNav()
  const [tab,   setTab]   = useState('overview')
  const [fAnio, setFAnio] = useState('')
  const [fTrim, setFTrim] = useState('')

  return (
    <div style={{display:'flex',flex:1,overflow:'hidden'}}>
      <div className="ficha-main">

        {/* Header */}
        <div className="ah">
          <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
            <div className="ah-ico" style={{background:'linear-gradient(135deg,#1e3a5f,#B08D57)',fontSize:20}}>📍</div>
            <div style={{flex:1}}>
              <div className="ah-ref">
                <span style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>ZONA</span>
                <span className="mono">{ZONA.id}</span>
                <span className="tag tag-blue">{ZONA.uso}</span>
                <span className="tag tag-gray">{ZONA.provincia}</span>
              </div>
              <div className="ah-name">{ZONA.zona}</div>
              <div className="ah-addr">📍 {ZONA.area} · {ZONA.activos_n || ACTIVOS_ZONA.length} activos en cartera</div>
              <div className="ah-tags">
                <span className="tag tag-blue">Oficinas</span>
                <span className="tag tag-teal">{ACTIVOS_ZONA.length} activos</span>
                <span className="tag tag-amber">Disponibilidad {ZONA.Disponibilidad}%</span>
                <span className="tag tag-gray">{ZONA.renta_min}–{ZONA.renta_max} €/m²</span>
              </div>
            </div>
            {/* Filtros temporales inline */}
            <div style={{display:'flex',flexDirection:'column',gap:5,alignItems:'flex-end',flexShrink:0}}>
              <select className="fsel" value={fAnio} onChange={e=>setFAnio(e.target.value)} style={{fontSize:10}}>
                <option value="">Todos los años</option>
                <option>2026</option><option>2025</option><option>2024</option><option>2023</option>
              </select>
              <select className="fsel" value={fTrim} onChange={e=>setFTrim(e.target.value)} style={{fontSize:10}}>
                <option value="">Todos los trimestres</option>
                <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI strip de zona */}
        <div className="kpi-strip" style={{gridTemplateColumns:'repeat(6,1fr)'}}>
          <div className="ks"><div className="ks-lbl">Stock total</div><div className="ks-val">{ZONA.stock.toLocaleString()} m²</div><div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Activos</div></div>
          <div className="ks"><div className="ks-lbl">Disponible</div><div className="ks-val amber">{ZONA.disponible.toLocaleString()} m²</div><div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Stacking Plan</div></div>
          <div className="ks"><div className="ks-lbl">Ocupación</div><div className="ks-val green">{ZONA.ocupacion}%</div><div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Arrendatarios</div></div>
          <div className="ks"><div className="ks-lbl">Ofertas activas</div><div className="ks-val" style={{color:'var(--accent)'}}>{ZONA.ofertas_activas}</div><div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Oferta</div></div>
          <div className="ks"><div className="ks-lbl">Take-up YTD</div><div className="ks-val">{ZONA.takeup_ytd.toLocaleString()} m²</div><div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Transacciones</div></div>
          <div className="ks"><div className="ks-lbl">Renta media</div><div className="ks-val">{ZONA.renta_media} €/m²</div><div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Arrendatarios</div></div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[['overview','Overview'],['activos','Activos ('+ACTIVOS_ZONA.length+')'],['oferta','Oferta activa ('+OFERTAS_ZONA.length+')'],['transacciones','Transacciones ('+TRANS.length+')'],['evolucion','Evolución']].map(([k,l])=>(
            <div key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</div>
          ))}
        </div>

        {/* Tab: Overview */}
        {tab==='overview' && (()=>{
          /* ── datos históricos ── */
          const TAKEUP_ANUAL=[{y:'2022',v:6200},{y:'2023',v:9800},{y:'2024',v:7100},{y:'2025',v:11200},{y:'2026',v:8500,ytd:true}]
          const TAKEUP_Q={
            '2025':[{q:'Q1',v:2400},{q:'Q2',v:3800},{q:'Q3',v:2800},{q:'Q4',v:2200}],
            '2026':[{q:'Q1',v:3200},{q:'Q2',v:3600,ytd:true},{q:'Q3',v:0},{q:'Q4',v:0}],
            '2024':[{q:'Q1',v:1600},{q:'Q2',v:2400},{q:'Q3',v:1800},{q:'Q4',v:1300}],
          }
          const RENTA_ANUAL=[{y:'2022',v:11.0},{y:'2023',v:11.8},{y:'2024',v:12.5},{y:'2025',v:13.0},{y:'2026',v:13.5,ytd:true}]
          const DISP_ANUAL=[{y:'2022',v:28},{y:'2023',v:25},{y:'2024',v:23},{y:'2025',v:21},{y:'2026',v:22.4,ytd:true}]
          const OPS_ANUAL=[{y:'2022',v:3},{y:'2023',v:5},{y:'2024',v:4},{y:'2025',v:6},{y:'2026',v:4,ytd:true}]

          /* filtrado por fAnio/fTrim */
          const takupData = fAnio&&TAKEUP_Q[fAnio]
            ? TAKEUP_Q[fAnio].map(d=>({...d,y:d.q,ytd:d.ytd||false})).filter(d=>!fTrim||d.y===fTrim)
            : TAKEUP_ANUAL.filter(d=>!fAnio||d.y===fAnio)
          const rentaData = fAnio ? RENTA_ANUAL.filter(d=>d.y===fAnio) : RENTA_ANUAL
          const dispData  = fAnio ? DISP_ANUAL.filter(d=>d.y===fAnio)  : DISP_ANUAL
          const opsData   = fAnio ? OPS_ANUAL.filter(d=>d.y===fAnio)   : OPS_ANUAL

          const takupMax = Math.max(...takupData.map(d=>d.v),1)
          const rentaMax = 16
          const dispMax  = 35
          const opsMax   = 8

          const getZonaConfig = () => ({
            title: `Zona ${ZONA.zona}`,
            subtitle: `Informe de mercado · ${ZONA.uso} · ${ZONA.provincia}`,
            coverMetrics: [
              { label: 'Stock total (m²)', value: ZONA.stock.toLocaleString('es-ES') },
              { label: 'Disponible (m²)', value: ZONA.disponible.toLocaleString('es-ES') },
              { label: 'Disponibilidad', value: `${ZONA.Disponibilidad}%` },
              { label: 'Renta media', value: `${ZONA.renta_media} €/m²` },
              { label: 'Take-up YTD', value: `${ZONA.takeup_ytd.toLocaleString('es-ES')} m²` },
            ],
            sections: [
              {
                title: 'Indicadores de mercado',
                type: 'kpis',
                data: [
                  { label: 'Stock total (m²)', value: ZONA.stock.toLocaleString('es-ES') },
                  { label: 'Disponible (m²)', value: ZONA.disponible.toLocaleString('es-ES') },
                  { label: 'Disponibilidad (%)', value: `${ZONA.Disponibilidad}%` },
                  { label: 'Ocupación media', value: `${ZONA.ocupacion}%` },
                  { label: 'Renta media €/m²/mes', value: ZONA.renta_media },
                  { label: 'Renta mínima €/m²/mes', value: ZONA.renta_min },
                  { label: 'Renta máxima €/m²/mes', value: ZONA.renta_max },
                  { label: 'Take-up YTD 2026 (m²)', value: ZONA.takeup_ytd.toLocaleString('es-ES') },
                  { label: 'Operaciones YTD', value: ZONA.ops_ytd },
                ],
              },
              {
                title: 'Evolución take-up (m²)',
                type: 'chart',
                data: TAKEUP_ANUAL,
              },
              {
                title: 'Evolución renta media (€/m²/mes)',
                type: 'chart',
                data: RENTA_ANUAL,
              },
              {
                title: 'Activos en la zona',
                type: 'table',
                headers: ['Activo', 'SBA (m²)', 'Disponible', 'Ocup.', 'Renta €/m²'],
                rows: [
                  ...ACTIVOS_ZONA.map(a=>[a.nombre, a.sba.toLocaleString('es-ES'), a.disponible.toLocaleString('es-ES'), `${a.occ}%`, `${a.renta} €`]),
                ],
              },
              {
                title: 'Transacciones históricas',
                type: 'table',
                headers: ['Fecha', 'Activo', 'Arrendatario', 'M²', 'Renta €/m²', 'Tipo'],
                rows: TRANS.map(t=>[t.fecha, t.activo, t.arrendatario, t.m2.toLocaleString('es-ES'), `${t.renta} €`, t.tipo]),
              },
            ],
          })
          const doExportOv = (fmt) => {
            const cfg = getZonaConfig()
            if (fmt === 'pdf') exportPDF(cfg)
            else               exportPPT(cfg)
          }

          return (
            <div className="tab-content active" style={{overflowY:'auto'}}>
              <div className="info-pad">

                {/* Barra filtros + export */}
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
                  <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase'}}>Filtrar por</span>
                  <select className="fsel" value={fAnio} onChange={e=>setFAnio(e.target.value)}>
                    <option value="">Todos los años</option>
                    <option>2026</option><option>2025</option><option>2024</option><option>2023</option><option>2022</option>
                  </select>
                  <select className="fsel" value={fTrim} onChange={e=>setFTrim(e.target.value)}>
                    <option value="">Todos los trimestres</option>
                    <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                  </select>
                  {(fAnio||fTrim) && (
                    <button onClick={()=>{setFAnio('');setFTrim('')}}
                      style={{padding:'3px 9px',background:'none',border:'1px solid var(--border)',borderRadius:4,fontSize:10,cursor:'pointer',color:'var(--text4)',fontFamily:'inherit'}}>
                      ✕ Limpiar
                    </button>
                  )}
                  <ExportMenu getConfig={getZonaConfig} />
                </div>

                {/* ── 4 KPI callout cards ── */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
                  {[
                    {lbl:'Operaciones YTD',val:ZONA.ops_ytd,unit:'ops',color:'var(--purple)',sub:'en la zona 2026'},
                    {lbl:'Absorción YTD',val:`${(ZONA.takeup_ytd/1000).toFixed(1)}k`,unit:'m²',color:'var(--accent)',sub:'take-up 2026'},
                    {lbl:'Disponibilidad',val:`${ZONA.Disponibilidad}%`,unit:'',color:'var(--amber)',sub:'sobre stock total'},
                    {lbl:'Renta media',val:`${ZONA.renta_media}`,unit:'€/m²',color:'var(--green)',sub:`rango ${ZONA.renta_min}–${ZONA.renta_max}`},
                  ].map(k=>(
                    <div key={k.lbl} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'12px 14px',borderTop:`3px solid ${k.color}`}}>
                      <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',marginBottom:5}}>{k.lbl}</div>
                      <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                        <span style={{fontSize:22,fontWeight:800,color:k.color,fontFamily:'var(--mono)',lineHeight:1}}>{k.val}</span>
                        <span style={{fontSize:11,color:k.color,fontWeight:600}}>{k.unit}</span>
                      </div>
                      <div style={{fontSize:9,color:'var(--text4)',marginTop:3}}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* ── Fila gráficos principales ── */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>

                  {/* Absorción */}
                  <div className="info-block">
                    <div className="ib-title" style={{marginBottom:8}}>
                      📦 Superficie absorbida por año
                      <span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>m²  ← Transacciones</span>
                    </div>
                    <div style={{display:'flex',alignItems:'flex-end',gap:8,height:90}}>
                      {takupData.filter(d=>d.v>0||(d.ytd&&!fAnio)).map((d,i)=>{
                        const h=Math.max(Math.round(d.v/takupMax*80),d.v>0?3:0)
                        return (
                          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                            <span style={{fontSize:9,fontWeight:700,color:d.ytd?'var(--accent)':'var(--text3)'}}>{(d.v/1000).toFixed(1)}k</span>
                            <div style={{width:'100%',background:d.ytd?'var(--accent)':'var(--border2)',borderRadius:'3px 3px 0 0',height:h,minHeight:d.v>0?2:0}}/>
                            <span style={{fontSize:9,color:d.ytd?'var(--accent)':'var(--text4)',fontWeight:d.ytd?700:400}}>{d.y}{d.ytd?' YTD':''}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Rentas */}
                  <div className="info-block">
                    <div className="ib-title" style={{marginBottom:8}}>
                      💶 Evolución de rentas medias
                      <span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>€/m²/mes  ← Arrendatarios</span>
                    </div>
                    <div style={{display:'flex',alignItems:'flex-end',gap:8,height:90}}>
                      {rentaData.map((d,i)=>{
                        const h=Math.round(d.v/rentaMax*80)
                        return (
                          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                            <span style={{fontSize:9,fontWeight:700,color:d.ytd?'var(--green)':'var(--text3)'}}>{d.v}</span>
                            <div style={{width:'100%',background:d.ytd?'var(--green)':'var(--border2)',borderRadius:'3px 3px 0 0',height:h}}/>
                            <span style={{fontSize:9,color:d.ytd?'var(--green)':'var(--text4)',fontWeight:d.ytd?700:400}}>{d.y}{d.ytd?' YTD':''}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>

                  {/* Disponibilidad */}
                  <div className="info-block">
                    <div className="ib-title" style={{marginBottom:8}}>
                      📉 Evolución disponibilidad
                      <span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>%  ← Stacking Plan</span>
                    </div>
                    {dispData.map(d=>(
                      <div key={d.y} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <span style={{fontSize:10,color:'var(--text3)',width:34,flexShrink:0}}>{d.y}{d.ytd?<span style={{fontSize:8,color:'var(--amber)',fontWeight:700}}> YTD</span>:''}</span>
                        <div style={{flex:1,height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${d.v/dispMax*100}%`,background:d.ytd?'var(--amber)':'var(--border2)',borderRadius:4,transition:'.3s'}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:d.ytd?'var(--amber)':'var(--text2)',width:38,textAlign:'right'}}>{d.v}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Nº operaciones */}
                  <div className="info-block">
                    <div className="ib-title" style={{marginBottom:8}}>
                      🔀 Nº operaciones por año
                      <span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Arrendatarios</span>
                    </div>
                    {opsData.map(d=>(
                      <div key={d.y} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <span style={{fontSize:10,color:'var(--text3)',width:34,flexShrink:0}}>{d.y}{d.ytd?<span style={{fontSize:8,color:'var(--purple)',fontWeight:700}}> YTD</span>:''}</span>
                        <div style={{flex:1,height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${d.v/opsMax*100}%`,background:d.ytd?'var(--purple)':'var(--border2)',borderRadius:4,transition:'.3s'}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:d.ytd?'var(--purple)':'var(--text2)',width:20,textAlign:'right'}}>{d.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tablas compactas métricas */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                  <div className="info-block">
                    <div className="ib-title">DATOS DE MERCADO
                      <span style={{fontSize:9,color:'var(--text4)',fontWeight:400}}>Agregado desde módulos base</span>
                    </div>
                    <div className="ir"><span className="ir-k">Stock total (SBA)</span><span className="ir-v">{ZONA.stock.toLocaleString()} m²</span></div>
                    <div className="ir"><span className="ir-k">Disponible actual</span><span className="ir-v" style={{color:'var(--amber)'}}>{ZONA.disponible.toLocaleString()} m²</span></div>
                    <div className="ir"><span className="ir-k">Disponibilidad</span><span className="ir-v" style={{color:'var(--amber)'}}>{ZONA.Disponibilidad}%</span></div>
                    <div className="ir"><span className="ir-k">Ocupación media</span><span className="ir-v" style={{color:'var(--green)'}}>{ZONA.ocupacion}%</span></div>
                    <div className="ir"><span className="ir-k">Activos en cartera</span><span className="ir-v">{ACTIVOS_ZONA.length}</span></div>
                    <div className="ir"><span className="ir-k">Ofertas activas</span><span className="ir-v" style={{color:'var(--accent)'}}>{ZONA.ofertas_activas}</span></div>
                  </div>
                  <div className="info-block">
                    <div className="ib-title">RENTAS Y TRANSACCIONES
                      <span style={{fontSize:9,color:'var(--text4)',fontWeight:400}}>← Arrendatarios + Transacciones</span>
                    </div>
                    <div className="ir"><span className="ir-k">Renta media</span><span className="ir-v" style={{fontWeight:700}}>{ZONA.renta_media} €/m²/mes</span></div>
                    <div className="ir"><span className="ir-k">Rango de rentas</span><span className="ir-v">{ZONA.renta_min} – {ZONA.renta_max} €/m²/mes</span></div>
                    <div className="ir"><span className="ir-k">Take-up YTD 2026</span><span className="ir-v">{ZONA.takeup_ytd.toLocaleString()} m²</span></div>
                    <div className="ir"><span className="ir-k">Operaciones YTD</span><span className="ir-v">{ZONA.ops_ytd}</span></div>
                    <div className="ir"><span className="ir-k">Sup. media por op.</span><span className="ir-v">{Math.round(ZONA.takeup_ytd/ZONA.ops_ytd).toLocaleString()} m²</span></div>
                    <div className="ir"><span className="ir-k">Superficie contratada</span><span className="ir-v">15.188 m² total histórico</span></div>
                  </div>
                </div>

                {/* Tabla activos */}
                <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                  <div className="ib-title" style={{padding:'8px 14px'}}>ACTIVOS QUE COMPONEN LA ZONA
                    <span style={{fontSize:9,color:'var(--text4)',fontWeight:400}}>← Módulo Activos</span>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr>{['Activo','SBA m²','Disponible','Ocupación','Renta €/m²','Arrendatarios','Ofertas'].map(h=>(
                        <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {ACTIVOS_ZONA.map(a=>(
                        <tr key={a.ref} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>
                          <td style={{padding:'7px 12px'}}>
                            <div className="dtbl-link">{a.nombre}</div>
                            <div className="asset-sub mono">{a.ref}</div>
                          </td>
                          <td style={{padding:'7px 12px',fontWeight:600}}>{a.sba.toLocaleString()}</td>
                          <td style={{padding:'7px 12px',color:'var(--amber)',fontWeight:600}}>{a.disponible.toLocaleString()}</td>
                          <td style={{padding:'7px 12px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:5}}>
                              <div style={{width:40,height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${a.occ}%`,background:a.occ>=90?'var(--green)':a.occ>=75?'var(--amber)':'var(--red)'}}/>
                              </div>
                              <span style={{fontSize:11,color:a.occ>=90?'var(--green)':a.occ>=75?'var(--amber)':'var(--red)',fontWeight:600}}>{a.occ}%</span>
                            </div>
                          </td>
                          <td style={{padding:'7px 12px'}}>{a.renta} €</td>
                          <td style={{padding:'7px 12px',fontWeight:500}}>{a.arrendatarios}</td>
                          <td style={{padding:'7px 12px',color:'var(--accent)',fontWeight:600}}>{a.ofertas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Tab: Activos */}
        {tab==='activos' && (
          <div className="tab-content active" style={{display:'flex',flexDirection:'column'}}>
            {/* KPI strip de los activos de la zona */}
            <div className="kpi-strip" style={{gridTemplateColumns:'repeat(6,1fr)'}}>
              <div className="ks">
                <div className="ks-lbl">Total activos</div>
                <div className="ks-val">{ACTIVOS_ZONA.length}</div>
                <div className="ks-sub">En la zona</div>
              </div>
              <div className="ks">
                <div className="ks-lbl">SBA total</div>
                <div className="ks-val">{ACTIVOS_ZONA.reduce((s,a)=>s+a.sba,0).toLocaleString()} m²</div>
                <div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Activos</div>
              </div>
              <div className="ks">
                <div className="ks-lbl">Disponible</div>
                <div className="ks-val amber">{ACTIVOS_ZONA.reduce((s,a)=>s+a.disponible,0).toLocaleString()} m²</div>
                <div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Stacking Plan</div>
              </div>
              <div className="ks">
                <div className="ks-lbl">Ocupación media</div>
                <div className="ks-val green">{(ACTIVOS_ZONA.reduce((s,a)=>s+a.occ,0)/ACTIVOS_ZONA.length).toFixed(1)}%</div>
                <div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Arrendatarios</div>
              </div>
              <div className="ks">
                <div className="ks-lbl">Renta media</div>
                <div className="ks-val">{(ACTIVOS_ZONA.reduce((s,a)=>s+a.renta,0)/ACTIVOS_ZONA.length).toFixed(1)} €/m²</div>
                <div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Arrendatarios</div>
              </div>
              <div className="ks">
                <div className="ks-lbl">Ofertas activas</div>
                <div className="ks-val" style={{color:'var(--accent)'}}>{ACTIVOS_ZONA.reduce((s,a)=>s+a.ofertas,0)}</div>
                <div className="ks-sub" style={{color:'var(--text4)',fontSize:9}}>← Oferta</div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="list-toolbar">
              <div className="search-wrap">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
                <input className="search-inp" placeholder="Buscar activo..."/>
              </div>
              <select className="fsel"><option>Todos los usos</option><option>Oficinas</option><option>Logístico</option><option>Retail</option></select>
              <select className="fsel"><option>Todos los estados</option><option>Activo</option><option>En comercialización</option></select>
              <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                <button className="tbtn">⬇ Exportar</button>
              </div>
            </div>

            {/* Tabla igual que ActivosList */}
            <div className="tbl-wrap">
              <table className="main-tbl">
                <thead>
                  <tr>
                    <th><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th>
                    <th>Activo</th><th>Zona / Ciudad</th><th>Uso</th><th>SBA (m²)</th>
                    <th>Disponible</th><th>Ocupación</th><th>Renta €/m²</th>
                    <th>Valor</th><th>Estado</th><th>Días comerc.</th><th>Ofertas</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {ACTIVOS_ZONA.map(a => {
                    const uc = usoColor(a.uso)
                    const occColor = a.occ>=90?'var(--green)':a.occ>=75?'var(--amber)':'var(--red)'
                    return (
                      <tr key={a.ref} onClick={()=>navigate('ficha-activo')}>
                        <td><input type="checkbox" onClick={e=>e.stopPropagation()} style={{accentColor:'var(--accent)'}}/></td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:7}}>
                            <div style={{width:28,height:28,borderRadius:5,background:uc.bg,color:uc.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>
                              {a.uso[0]}
                            </div>
                            <div>
                              <div className="asset-link">{a.nombre}</div>
                              <div className="asset-sub">{a.ref}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{fontSize:11,color:'var(--text3)'}}>{a.zona}</td>
                        <td><span className={`tag ${usoTag(a.uso)}`}>{a.uso}</span></td>
                        <td className="mono">{a.sba.toLocaleString()} m²</td>
                        <td className="mono" style={{color:'var(--amber)',fontWeight:600}}>{a.disponible.toLocaleString()} m²</td>
                        <td>
                          <div className="occ-cell">
                            <div className="occ-bar">
                              <div className="occ-bar-fill" style={{width:`${a.occ}%`,background:occColor}}/>
                            </div>
                            <span style={{fontSize:11,color:occColor}}>{a.occ}%</span>
                          </div>
                        </td>
                        <td className="mono">{a.renta} €/m²</td>
                        <td className="mono">{a.valor}</td>
                        <td><span className={`tag ${a.estado==='Activo en mercado'?'tag-green':a.estado==='En comercialización'?'tag-amber':'tag-gray'}`}>{a.estado}</span></td>
                        <td>{a.dias>0?<span style={{color:a.dias>90?'var(--red)':a.dias>60?'var(--amber)':'var(--text3)',fontWeight:600}}>{a.dias}d</span>:'—'}</td>
                        <td style={{fontWeight:600,color:'var(--accent)'}}>{a.ofertas}</td>
                        <td>
                          <div className="ra-cell">
                            <button className="ra" onClick={e=>{e.stopPropagation();navigate('ficha-activo')}}>Ver</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Fila de totales */}
                <tfoot>
                  <tr style={{background:'var(--gray-lt)',borderTop:'2px solid var(--border)'}}>
                    <td colSpan={4} style={{padding:'7px 12px',fontWeight:700,fontSize:11,color:'var(--text)'}}>TOTAL ZONA · {ACTIVOS_ZONA.length} activos</td>
                    <td className="mono" style={{padding:'7px 12px',fontWeight:700}}>{ACTIVOS_ZONA.reduce((s,a)=>s+a.sba,0).toLocaleString()} m²</td>
                    <td className="mono" style={{padding:'7px 12px',fontWeight:700,color:'var(--amber)'}}>{ACTIVOS_ZONA.reduce((s,a)=>s+a.disponible,0).toLocaleString()} m²</td>
                    <td style={{padding:'7px 12px',fontWeight:700,color:'var(--green)'}}>{(ACTIVOS_ZONA.reduce((s,a)=>s+a.occ,0)/ACTIVOS_ZONA.length).toFixed(1)}% media</td>
                    <td style={{padding:'7px 12px',fontWeight:700}}>{(ACTIVOS_ZONA.reduce((s,a)=>s+a.renta,0)/ACTIVOS_ZONA.length).toFixed(1)} € media</td>
                    <td colSpan={2}/>
                    <td style={{padding:'7px 12px',fontWeight:700}}>{ACTIVOS_ZONA.reduce((s,a)=>s+a.dias,0)}d total</td>
                    <td style={{padding:'7px 12px',fontWeight:700,color:'var(--accent)'}}>{ACTIVOS_ZONA.reduce((s,a)=>s+a.ofertas,0)} ofertas</td>
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Oferta activa */}
        {tab==='oferta' && (
          <div className="tab-content active">
            <div className="info-pad">
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <div className="ib-title" style={{padding:'8px 14px'}}>OFERTA ACTIVA EN LA ZONA
                  <span style={{fontSize:9,color:'var(--text4)',fontWeight:400}}>← Módulo Oferta → vinculada a Activos</span>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>{['Ref. Oferta','Activo','Espacio / Planta','Superficie','Renta €/m²','Demanda vinculada','Estado'].map(h=>(
                      <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {OFERTAS_ZONA.map(o=>(
                      <tr key={o.ref} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-oferta')}>
                        <td style={{padding:'7px 12px'}}><span className="dtbl-link mono">{o.ref}</span></td>
                        <td style={{padding:'7px 12px',fontWeight:500}}>{o.activo}</td>
                        <td style={{padding:'7px 12px',color:'var(--text3)'}}>{o.espacio}</td>
                        <td style={{padding:'7px 12px',fontWeight:600}}>{o.m2.toLocaleString()} m²</td>
                        <td style={{padding:'7px 12px'}}>{o.renta}</td>
                        <td style={{padding:'7px 12px',color:o.demanda==='—'?'var(--text4)':'var(--accent)',fontWeight:o.demanda==='—'?400:500}}>{o.demanda}</td>
                        <td style={{padding:'7px 12px'}}>
                          <span className={`tag ${o.estado==='En negociación'?'tag-amber':o.estado==='En curso'?'tag-blue':'tag-green'}`}>{o.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Transacciones */}
        {tab==='transacciones' && (
          <div className="tab-content active">
            <div className="info-pad">
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <select className="fsel"><option value="">Todos los años</option><option>2026</option><option>2025</option><option>2024</option></select>
                <select className="fsel"><option value="">Todos los trimestres</option><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select>
                <select className="fsel"><option value="">Todos los tipos</option><option>Nuevo contrato</option><option>Renovación</option><option>Prórroga</option></select>
                <span style={{fontSize:10,color:'var(--text4)',marginLeft:'auto'}}>← Arrendatarios + conversión Oferta → Transacción</span>
              </div>
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>{['Fecha','Activo','Arrendatario','Superficie','Renta €/m²','Tipo','Duración'].map(h=>(
                      <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {TRANS.map((t,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                        <td style={{padding:'7px 12px',fontWeight:500,color:'var(--text3)'}}>{t.fecha}</td>
                        <td style={{padding:'7px 12px'}}><span className="dtbl-link">{t.activo}</span></td>
                        <td style={{padding:'7px 12px',fontWeight:500}}>{t.arrendatario}</td>
                        <td style={{padding:'7px 12px',fontWeight:600}}>{t.m2.toLocaleString()} m²</td>
                        <td style={{padding:'7px 12px'}}>{t.renta} €</td>
                        <td style={{padding:'7px 12px'}}><span className={`tag ${TRANS_EST[t.tipo]||'tag-gray'}`}>{t.tipo}</span></td>
                        <td style={{padding:'7px 12px',color:'var(--text3)'}}>{t.duracion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Evolución */}
        {tab==='evolucion' && (
          <div className="tab-content active">
            <div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                {[
                  {label:'Take-up anual (m²)',data:[{y:'2022',v:6200},{y:'2023',v:9800},{y:'2024',v:7100},{y:'2025',v:11200},{y:'2026',v:8500,ytd:true}],max:12000,color:'var(--accent)'},
                  {label:'Renta media €/m²/mes',data:[{y:'2022',v:11.0},{y:'2023',v:11.8},{y:'2024',v:12.5},{y:'2025',v:13.0},{y:'2026',v:13.5,ytd:true}],max:16,color:'var(--green)'},
                ].map(chart=>(
                  <div key={chart.label} className="info-block">
                    <div className="ib-title">{chart.label}<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Transacciones históricas</span></div>
                    <div style={{display:'flex',alignItems:'flex-end',gap:8,height:90,marginTop:8}}>
                      {chart.data.map(d=>(
                        <div key={d.y} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <span style={{fontSize:9,fontWeight:600,color:d.ytd?chart.color:'var(--text3)'}}>{d.v}</span>
                          <div style={{width:'100%',background:d.ytd?chart.color:'var(--border2)',borderRadius:'3px 3px 0 0',height:`${Math.round(d.v/chart.max*70)}px`,transition:'.3s'}}/>
                          <span style={{fontSize:9,color:'var(--text4)'}}>{d.y}{d.ytd&&<> <span style={{color:chart.color,fontWeight:700}}>YTD</span></>}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="info-block">
                  <div className="ib-title">Disponibilidad histórica<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Stacking Plan</span></div>
                  {[{y:'2022',v:28},{y:'2023',v:25},{y:'2024',v:23},{y:'2025',v:21},{y:'2026',v:22.4,ytd:true}].map(d=>(
                    <div key={d.y} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                      <span style={{fontSize:10,color:'var(--text3)',width:28}}>{d.y}</span>
                      <div style={{flex:1,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${d.v/40*100}%`,background:d.ytd?'var(--amber)':'var(--border2)',borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:10,fontWeight:600,color:d.ytd?'var(--amber)':'var(--text2)',width:32,textAlign:'right'}}>{d.v}%</span>
                    </div>
                  ))}
                </div>
                <div className="info-block">
                  <div className="ib-title">Nº operaciones / año<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>← Arrendatarios</span></div>
                  {[{y:'2022',v:3},{y:'2023',v:5},{y:'2024',v:4},{y:'2025',v:6},{y:'2026',v:4,ytd:true}].map(d=>(
                    <div key={d.y} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                      <span style={{fontSize:10,color:'var(--text3)',width:28}}>{d.y}</span>
                      <div style={{flex:1,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${d.v/8*100}%`,background:d.ytd?'var(--purple)':'var(--border2)',borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:10,fontWeight:600,color:d.ytd?'var(--purple)':'var(--text2)',width:20,textAlign:'right'}}>{d.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel derecho */}
      <div className="ficha-right">
        <div className="rp-sec">
          <div className="rp-lbl">KPIs de la zona</div>
          <div className="kf-grid">
            <div className="kf"><div className="kf-lbl">Stock</div><div className="kf-val" style={{fontSize:11}}>{(ZONA.stock/1000).toFixed(1)}k m²</div></div>
            <div className="kf"><div className="kf-lbl">Disponibilidad</div><div className="kf-val amber">{ZONA.Disponibilidad}%</div></div>
            <div className="kf"><div className="kf-lbl">Renta media</div><div className="kf-val" style={{fontSize:11}}>{ZONA.renta_media} €/m²</div></div>
            <div className="kf"><div className="kf-lbl">Take-up YTD</div><div className="kf-val" style={{fontSize:11}}>{(ZONA.takeup_ytd/1000).toFixed(1)}k m²</div></div>
          </div>
        </div>

        <div className="rp-sec">
          <div className="rp-lbl">Origen del dato</div>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {[
              {fuente:'Activos',dato:'Stock · Nº activos',color:'var(--accent)'},
              {fuente:'Stacking Plan',dato:'Disponible · Disponibilidad',color:'var(--purple)'},
              {fuente:'Arrendatarios',dato:'Ocupación · Renta media · Ops',color:'var(--teal)'},
              {fuente:'Oferta',dato:'Ofertas activas',color:'var(--green)'},
              {fuente:'Transacciones',dato:'Take-up · Histórico',color:'var(--amber)'},
            ].map(f=>(
              <div key={f.fuente} style={{display:'flex',alignItems:'center',gap:7,padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{width:4,height:28,borderRadius:2,background:f.color,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:f.color}}>{f.fuente}</div>
                  <div style={{fontSize:9,color:'var(--text4)'}}>{f.dato}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rp-sec">
          <div className="rp-lbl">Activos en la zona</div>
          {ACTIVOS_ZONA.map(a=>(
            <div key={a.ref} style={{background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',padding:'7px 9px',marginBottom:5,cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>
              <div style={{fontSize:9,fontWeight:600,color:'var(--accent)',textTransform:'uppercase',marginBottom:1}}>Activo · {a.ref}</div>
              <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>{a.nombre}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>{a.sba.toLocaleString()} m² · {a.occ}% ocupado</div>
            </div>
          ))}
        </div>

        <div className="rp-sec">
          <div className="rp-lbl">Asistente IA</div>
          <div className="ai-box">
            <div className="ai-head"><div className="ai-ico"></div><span className="ai-lbl">Análisis zona</span><span className="ai-badge">Tiempo real</span></div>
            <div className="ai-text">Disponibilidad <strong>22,4%</strong> — por encima de la media de Madrid (18%). 3 ofertas activas en curso. Renta media estabilizada en 13,5 €/m². Take-up 2026 en línea con 2025.</div>
            <div className="ai-cta">✎ Generar informe de zona</div>
          </div>
        </div>
      </div>
    </div>
  )
}
