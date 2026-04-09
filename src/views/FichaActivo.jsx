import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'

const TABS = ['at-info','at-stacking','at-caract','at-prop','at-fotos','at-docs','at-adicional','at-360','at-followup']
const TAB_LABELS = ['Información general','Stacking Plan','Características','Propietarios y arrendatarios','Fotografías','Documentos','Información adicional','Vista 360','Follow-up']

/* ── Stacking Plan data ── */
const SP_EDIFS = [
  {key:'A', label:'P.E Avalon — Edif. A'},
  {key:'B', label:'Edif. B'},
  {key:'C', label:'Edif. C'},
  {key:'D', label:'Edif. D'},
]
const GRID = '64px 1fr 100px 60px 80px'

const SP_DATA = {
  A: {
    stats: { of:'9.000', otros:'3.000', disp:'4.050', renta:'10,50–14,50' },
    tipo: [
      {p:'P5', sup:'1.500 m²', units:[{cls:'u-of',n:'Oficinas',m:'1.202 m²',f:4},{cls:'u-vac',n:'Vacante',m:'298 m²',f:2}]},
      {p:'P4', sup:'1.500 m²', units:[{cls:'u-of',n:'Oficinas',m:'1.500 m²',f:6}]},
      {p:'P3', sup:'1.500 m²', units:[{cls:'u-of',n:'Oficinas',m:'767 m²',f:3},{cls:'u-vac',n:'Vacante',m:'733 m²',f:3}]},
      {p:'P2', sup:'1.500 m²', units:[{cls:'u-of',n:'Oficinas',m:'1.200 m²',f:4},{cls:'u-vac',n:'Vacante',m:'300 m²',f:2}]},
      {p:'P1', sup:'1.500 m²', units:[{cls:'u-of',n:'Oficinas',m:'1.500 m²',f:6}]},
      {p:'PB', sup:'1.500 m²', units:[{cls:'u-rt',n:'Retail',m:'380 m²',f:2},{cls:'u-com',n:'Común',m:'220 m²',f:2},{cls:'u-vac',n:'Vacante',m:'400 m²',f:2}]},
      {p:'S1', sup:'1.500 m²', units:[{cls:'u-pk',n:'Parking · 778 plazas',m:'Nivel -1',f:6}]},
      {p:'S2', sup:'1.500 m²', units:[{cls:'u-pk',n:'Parking · 52 plazas',m:'Nivel -2',f:6}]},
    ],
    prop: [
      {p:'P5', sup:'1.500 m²'},{p:'P4', sup:'1.500 m²'},{p:'P3', sup:'1.500 m²'},
      {p:'P2', sup:'1.500 m²'},{p:'P1', sup:'1.500 m²'},{p:'PB', sup:'1.500 m²'},
      {p:'S1', sup:'1.500 m²'},{p:'S2', sup:'1.500 m²'},
    ],
    arr: [
      {p:'P5', sup:'1.500 m²', units:[{type:'ten',n:'Celonis',m:'1.202 m²',brk:'Oct 2025',brkColor:'var(--amber)',f:4},{type:'vac',oferta:'OLB001',m:'298 m²',f:2}]},
      {p:'P4', sup:'1.500 m²', units:[{type:'ten',n:'Celonis',m:'1.500 m²',brk:'Oct 2025',brkColor:'var(--amber)',f:6}]},
      {p:'P3', sup:'1.500 m²', units:[{type:'ten',n:'Repsol',m:'767 m²',brk:'Jun 2027',brkColor:'var(--green)',f:3},{type:'vac',oferta:'OLB002',m:'733 m²',f:3}]},
      {p:'P2', sup:'1.500 m²', units:[{type:'ten',n:'Repsol',m:'1.200 m²',brk:'Jun 2027',brkColor:'var(--green)',f:4},{type:'vac',oferta:'OLB002',m:'300 m²',f:2}]},
      {p:'P1', sup:'1.500 m²', units:[{type:'ten',n:'Desconocido',m:'1.500 m²',brk:'Ene 2026',brkColor:'var(--red)',f:6}]},
      {p:'PB', sup:'1.500 m²', units:[{type:'rt',n:'Cafetería',m:'380 m²',brk:'Ene 2029',brkColor:'var(--text4)',f:2},{type:'com',n:'Hall / Común',m:'220 m²',f:2},{type:'vac',oferta:'OLB001',m:'400 m²',f:2}]},
      {p:'S1', sup:'1.500 m²', units:[{type:'pk',n:'Parking · 778 plazas',m:'Nivel -1',f:6}]},
      {p:'S2', sup:'1.500 m²', units:[{type:'pk',n:'Parking · 52 plazas',m:'Nivel -2',f:6}]},
    ],
  },
  B: {
    stats: { of:'4.300', otros:'250', disp:'1.450', renta:'12,00–15,00' },
    tipo: [
      {p:'P5', sup:'1.500 m²', units:[{cls:'u-of',n:'Oficinas',m:'1.500 m²',f:6}]},
      {p:'P4', sup:'1.500 m²', units:[{cls:'u-of',n:'Celonis',m:'1.300 m²',f:5},{cls:'u-vac',n:'Vacante',m:'200 m²',f:1}]},
      {p:'PB', sup:'1.500 m²', units:[{cls:'u-com',n:'Cafetería',m:'250 m²',f:1},{cls:'u-vac',n:'Vacante',m:'1.250 m²',f:5}]},
    ],
    prop: [
      {p:'P5', sup:'1.500 m²'},{p:'P4', sup:'1.500 m²'},{p:'PB', sup:'1.500 m²'},
    ],
    arr: [
      {p:'P5', sup:'1.500 m²', units:[{type:'ten',n:'Oficinas',m:'1.500 m²',brk:null,f:6}]},
      {p:'P4', sup:'1.500 m²', units:[{type:'ten',n:'Celonis',m:'1.300 m²',brk:'Oct 2025',brkColor:'var(--amber)',f:5},{type:'vac',oferta:null,m:'200 m²',f:1}]},
      {p:'PB', sup:'1.500 m²', units:[{type:'com',n:'Cafetería',m:'250 m²',f:1},{type:'vac',oferta:null,m:'1.250 m²',f:5}]},
    ],
  },
  C: {
    stats: { of:'1.967', otros:'0', disp:'1.967', renta:'11,00–14,00' },
    tipo: [
      {p:'P4', sup:'1.967 m²', units:[{cls:'u-of',n:'Repsol',m:'1.967 m²',f:6}]},
      {p:'PB', sup:'1.967 m²', units:[{cls:'u-vac',n:'Vacante',m:'1.967 m²',f:6}]},
    ],
    prop: [{p:'P4', sup:'1.967 m²'},{p:'PB', sup:'1.967 m²'}],
    arr: [
      {p:'P4', sup:'1.967 m²', units:[{type:'ten',n:'Repsol',m:'1.967 m²',brk:'Jun 2027',brkColor:'var(--green)',f:6}]},
      {p:'PB', sup:'1.967 m²', units:[{type:'vac',oferta:null,m:'1.967 m²',f:6}]},
    ],
  },
  D: {
    stats: { of:'2.000', otros:'0', disp:'2.000', renta:'10,00–13,00' },
    tipo: [
      {p:'P3', sup:'2.000 m²', units:[{cls:'u-of',n:'Oficinas',m:'2.000 m²',f:6}]},
      {p:'PB', sup:'2.000 m²', units:[{cls:'u-vac',n:'Vacante',m:'2.000 m²',f:6}]},
    ],
    prop: [{p:'P3', sup:'2.000 m²'},{p:'PB', sup:'2.000 m²'}],
    arr: [
      {p:'P3', sup:'2.000 m²', units:[{type:'ten',n:'Oficinas',m:'2.000 m²',brk:null,f:6}]},
      {p:'PB', sup:'2.000 m²', units:[{type:'vac',oferta:null,m:'2.000 m²',f:6}]},
    ],
  },
}

/* ── Helper rows ── */
function SpRow({ p, sup, children }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:GRID,borderBottom:'1px solid var(--border)',minHeight:36}}>
      <div className="sp-planta">{p}</div>
      <div className="sp-units">{children}</div>
      <div className="sp-sup mono">{sup}</div>
      <div className="sp-edit"><button className="sp-ibtn">✏</button></div>
      <div className="sp-add"><span className="sp-addlink">+ Unidad</span></div>
    </div>
  )
}

function SpOccBar() {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10}}>
      <span style={{fontSize:10,color:'var(--text4)',fontWeight:600,minWidth:60}}>Ocupación</span>
      <div style={{flex:1,height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
        <div style={{width:'78.4%',height:'100%',background:'linear-gradient(90deg,#f59e0b,#d97706)',borderRadius:4}}/>
      </div>
      <span style={{fontSize:12,fontWeight:700,color:'var(--amber)'}}>78.4%</span>
    </div>
  )
}

function StackingPlan() {
  const [edif, setEdif] = useState('A')
  const [view, setView] = useState('tipo')
  const d = SP_DATA[edif]

  /* Folder tab styles */
  const fTab = (key) => ({
    padding:'5px 14px', borderRadius:'6px 6px 0 0', fontSize:11, fontWeight: edif===key ? 600 : 500,
    cursor:'pointer', border:'1px solid', fontFamily:'inherit',
    borderColor: edif===key ? 'var(--accent)' : 'var(--border)',
    borderBottom: edif===key ? '2px solid var(--surface)' : '1px solid transparent',
    background: edif===key ? 'var(--accent)' : 'var(--surface)',
    color: edif===key ? '#fff' : 'var(--text2)',
  })
  /* Underline sub-tab styles */
  const vTab = (key) => ({
    padding:'7px 14px', fontSize:11, fontWeight: view===key ? 600 : 500, cursor:'pointer',
    border:'none', borderBottom: view===key ? '2px solid var(--accent)' : '2px solid transparent',
    background:'var(--surface)', color: view===key ? 'var(--accent)' : 'var(--text3)', fontFamily:'inherit',
  })

  return (
    <div>
      {/* FILA 1: edificio tabs (folder style) */}
      <div style={{padding:'6px 0 0',display:'flex',gap:6,borderBottom:'1px solid var(--border)',background:'var(--gray-lt)',marginLeft:-14,marginRight:-14,paddingLeft:14}}>
        {SP_EDIFS.map(e=>(
          <button key={e.key} onClick={()=>{setEdif(e.key);setView('tipo')}} style={fTab(e.key)}>{e.label}</button>
        ))}
        <button style={{padding:'5px 14px',borderRadius:'6px 6px 0 0',fontSize:11,cursor:'pointer',border:'1px dashed var(--accent-bd)',borderBottom:'1px solid transparent',background:'var(--accent-lt)',color:'var(--accent)',fontFamily:'inherit'}}>+ Añadir edificio</button>
      </div>

      {/* FILA 2: sub-tabs vista */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',marginLeft:-14,marginRight:-14,paddingLeft:14}}>
        {[['tipo','Uso'],['prop','Propietarios'],['arr','Arrendatarios y oferta']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={vTab(k)}>{l}</button>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:1,background:'var(--border)',borderBottom:'1px solid var(--border)',marginLeft:-14,marginRight:-14,marginBottom:10}}>
        <div style={{background:'var(--surface)',padding:'9px 14px'}}>
          <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>OFICINAS</div>
          <div style={{fontSize:18,fontWeight:700}}>{d.stats.of} m²</div>
          <div style={{fontSize:10,color:'var(--text3)'}}>Uso principal</div>
        </div>
        <div style={{background:'var(--surface)',padding:'9px 14px'}}>
          <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>OTROS USOS</div>
          <div style={{fontSize:18,fontWeight:700}}>{d.stats.otros} m²</div>
          <div style={{fontSize:10,color:'var(--text3)'}}>Retail + Servicios</div>
        </div>
        <div style={{background:'var(--surface)',padding:'9px 14px'}}>
          <div style={{fontSize:9,fontWeight:600,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>DISPONIBLE</div>
          <div style={{fontSize:18,fontWeight:700,color:'var(--amber)'}}>{d.stats.disp} m²</div>
          <div style={{fontSize:10,color:'var(--text3)'}}>{d.stats.renta} €/m²/mes</div>
        </div>
      </div>

      {/* ── VISTA: Tipo de superficie ── */}
      {view==='tipo' && <>
        <div style={{display:'flex',gap:12,marginBottom:10,flexWrap:'wrap'}}>
          {[['#3b82f6','#dbeafe','#93c5fd','Oficinas'],['#ec4899','#fce7f3','#fbcfe8','Retail'],['#22c55e','#dcfce7','#86efac','Común'],['#f59e0b','#fff7ed','#fed7aa','Vacante'],['#94a3b8','#f1f5f9','#cbd5e1','Parking']].map(([ac,bg,bd,lbl])=>(
            <label key={lbl} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,cursor:'pointer'}}>
              <input type="checkbox" defaultChecked style={{accentColor:ac}}/>
              <span style={{width:10,height:10,background:bg,border:`1px solid ${bd}`,borderRadius:2,display:'inline-block'}}/>
              {lbl}
            </label>
          ))}
        </div>
        <div className="sp-grid-wrap">
          <div style={{display:'grid',gridTemplateColumns:GRID,background:'var(--gray-lt)',borderBottom:'1px solid var(--border)'}}>
            {['Planta','USO','Sup. Total','Editar','Añadir'].map(h=><div key={h} className="sp-hc">{h}</div>)}
          </div>
          {d.tipo.map((row,ri)=>(
            <SpRow key={row.p} p={row.p} sup={row.sup}>
              {row.units.map((u,i)=>(
                <div key={i} className={`sp-unit ${u.cls}`} style={{flex:u.f}}>
                  <div className="sp-u-name">{u.n}</div>
                  <div className="sp-u-m2">{u.m}</div>
                </div>
              ))}
            </SpRow>
          ))}
        </div>
      </>}

      {/* ── VISTA: Propietarios ── */}
      {view==='prop' && <>
        <div style={{marginBottom:8}}>
          <label style={{display:'flex',alignItems:'center',gap:5,fontSize:11,cursor:'pointer'}}>
            <input type="checkbox" defaultChecked style={{accentColor:'var(--accent)'}}/>
            Barings Core Spain SOCIMI
          </label>
        </div>
        <div className="sp-grid-wrap">
          <div style={{display:'grid',gridTemplateColumns:GRID,background:'var(--gray-lt)',borderBottom:'1px solid var(--border)'}}>
            {['Planta','PROPIETARIO','Sup. Total','Editar','Añadir'].map(h=><div key={h} className="sp-hc">{h}</div>)}
          </div>
          {d.prop.map(row=>(
            <SpRow key={row.p} p={row.p} sup={row.sup}>
              <div className="sp-unit u-of" style={{flex:6}}>
                <div className="sp-u-name">Barings Core Spain SOCIMI</div>
              </div>
            </SpRow>
          ))}
        </div>
      </>}

      {/* ── VISTA: Arrendatarios y oferta ── */}
      {view==='arr' && <>
        <div style={{display:'flex',gap:12,marginBottom:10,flexWrap:'wrap'}}>
          {[['var(--accent)','#dbeafe','#93c5fd','Arrendatario'],['#f59e0b','#fff7ed','#fed7aa','Oferta disponible'],['#22c55e','#dcfce7','#86efac','Zona común']].map(([ac,bg,bd,lbl])=>(
            <label key={lbl} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,cursor:'pointer'}}>
              <input type="checkbox" defaultChecked style={{accentColor:ac}}/>
              <span style={{width:10,height:10,background:bg,border:`1px solid ${bd}`,borderRadius:2,display:'inline-block'}}/>
              {lbl}
            </label>
          ))}
        </div>
        <div className="sp-grid-wrap">
          <div style={{display:'grid',gridTemplateColumns:GRID,background:'var(--gray-lt)',borderBottom:'1px solid var(--border)'}}>
            {['Planta','ARRENDATARIO / OFERTA DISPONIBLE','Sup. Total','Editar','Añadir'].map(h=><div key={h} className="sp-hc">{h}</div>)}
          </div>
          {d.arr.map(row=>(
            <SpRow key={row.p} p={row.p} sup={row.sup}>
              {row.units.map((u,i)=>{
                if (u.type==='pk') return (
                  <div key={i} className="sp-unit u-pk" style={{flex:u.f}}>
                    <div className="sp-u-name">{u.n}</div>
                    <div className="sp-u-m2">{u.m}</div>
                  </div>
                )
                if (u.type==='com') return (
                  <div key={i} className="sp-unit u-com" style={{flex:u.f,flexDirection:'column',alignItems:'flex-start',padding:'4px 8px'}}>
                    <div className="sp-u-name">{u.n}</div>
                    <div className="sp-u-m2">{u.m}</div>
                  </div>
                )
                if (u.type==='vac') return (
                  <div key={i} style={{flex:u.f,background:'#fff8ec',border:'1px dashed #fcd34d',display:'flex',flexDirection:'column',justifyContent:'center',padding:'4px 8px'}}>
                    <div style={{fontSize:9,fontWeight:600,color:'var(--amber)'}}>Disponible{u.oferta ? ` · ${u.oferta}` : ''}</div>
                    <div className="sp-u-m2" style={{color:'var(--text3)'}}>{u.m}</div>
                  </div>
                )
                if (u.type==='rt') return (
                  <div key={i} className="sp-unit u-rt" style={{flex:u.f,flexDirection:'column',alignItems:'flex-start',padding:'4px 8px'}}>
                    <div className="sp-u-name" style={{fontWeight:600}}>{u.n}</div>
                    <div className="sp-u-m2">{u.m}</div>
                    {u.brk && <div style={{fontSize:9,color:u.brkColor}}>⊙ break {u.brk}</div>}
                  </div>
                )
                return (
                  <div key={i} style={{flex:u.f,background:'#dbeafe',color:'#1e40af',display:'flex',flexDirection:'column',justifyContent:'center',padding:'4px 8px'}}>
                    <div className="sp-u-name" style={{fontWeight:600}}>{u.n}</div>
                    <div className="sp-u-m2">{u.m}</div>
                    {u.brk && <div style={{fontSize:9,color:u.brkColor}}>⊙ break {u.brk}</div>}
                  </div>
                )
              })}
            </SpRow>
          ))}
        </div>
      </>}

      <SpOccBar/>
    </div>
  )
}

/* ── Tab: Información general ── */
function TabInfo({ navigate }) {
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
          <div className="kf"><div className="kf-lbl">Vacancia zona</div><div className="kf-val amber">11,4%</div></div>
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
            <strong>10.142 m² vacantes</strong> (21,6%). 2 break options vencidas o próximas. Renta zona 10,5 €/m² — margen de subida. Oracle en fase finalista para P1–P4.
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
  const [activeTab, setActiveTab] = useState('at-info')
  const [caracTab, setCaracTab] = useState('ct-estado')
  const [docCat,   setDocCat]   = useState('todos')
  const [showTarea, setShowTarea] = useState(false)

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
          {activeTab==='at-info' && <TabInfo navigate={navigate}/>}

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
                    <span style={{fontSize:11,color:'var(--text4)'}}>Vacante: <strong style={{color:'var(--amber)'}}>10.142 m²</strong></span>
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
                {caracTab==='ct-uso' && <div className="info-block"><div className="ib-title">OFICINAS (USO)</div><div className="ir"><span className="ir-k">Uso actual</span><span className="ir-v">Oficinas corporativas</span></div><div className="ir"><span className="ir-k">Inquilinos actuales</span><span className="ir-v">Celonis, Repsol, Cafetería</span></div><div className="ir"><span className="ir-k">M² ocupados</span><span className="ir-v">36.814 m²</span></div><div className="ir"><span className="ir-k">M² vacantes</span><span className="ir-v">10.142 m²</span></div></div>}
                {caracTab==='ct-plazas' && (
                  <div className="info-block">
                    <div className="ib-title">PLAZAS DE APARCAMIENTO</div>
                    <table className="pat-table">
                      <thead><tr><th>Tipo</th><th>Planta</th><th>Nº plazas</th><th>Precio/mes</th><th>Estado</th></tr></thead>
                      <tbody>
                        <tr><td>Rotación</td><td>S1</td><td>778</td><td>120 €</td><td><span className="tag tag-green">Disponible</span></td></tr>
                        <tr><td>Fijo</td><td>S2</td><td>52</td><td>150 €</td><td><span className="tag tag-amber">Reservado</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                )}
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
                  {av:'AI',bg:'var(--purple-lt)',color:'var(--purple)',name:'IA',msg:'10.142 m² vacantes. 2 break options próximas.',badge:{bg:'var(--purple-lt)',color:'var(--purple)',bc:'var(--purple-bd)',lbl:'IA'},time:'Hoy · Automático'},
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
