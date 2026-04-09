import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'
import { exportPDF, exportPPT } from '../utils/exportReport'

const TABS = ['datos','condiciones','historico','analisis']
const TAB_LABELS = ['🏢 Datos del propietario','💰 Condiciones de inversión','🕐 Histórico propietarios','📊 Análisis']

const PERFIL_COLOR = { 'Core':'var(--accent)', 'Value-add':'var(--purple)', 'Oportunista':'var(--red)', 'Institucional':'var(--teal)', 'Privado':'var(--text3)' }
const ESTADO_COLOR = { 'Activo':'var(--green)', 'Inactivo':'var(--text4)', 'En desinversión':'var(--amber)', 'Vendido':'var(--red)' }

const HIST_INIT = [
  { id:'H-001', propietario:'Blackstone Real Estate', activo:'P.E Avalon', tipo:'Asset deal', precio:'98 M€', fecha_entrada:'2014/Q1', fecha_salida:'2018/Q3', duracion:'4 años 6 meses', motivo:'Venta estratégica — ciclo de desinversión', cap_rate_entrada:7.2, cap_rate_salida:5.1, rentabilidad:'+32%', responsable:'Sierra Alvaro' },
  { id:'H-002', propietario:'AXA IM Real Assets', activo:'Torre Glòries', tipo:'Share deal', precio:'110 M€', fecha_entrada:'2017/Q2', fecha_salida:'2021/Q2', duracion:'4 años', motivo:'Rotación de portfolio', cap_rate_entrada:5.8, cap_rate_salida:4.8, rentabilidad:'+24%', responsable:'García Marta' },
]

const LOG_INIT = [
  { fecha:'07/04/2026', usuario:'Sierra Alvaro', accion:'Actualización cap rate → 5.1%' },
  { fecha:'15/03/2026', usuario:'García Marta',  accion:'Alta propietario — PRO-2501 registrado' },
]

export default function FichaPropietario() {
  const { navigate } = useNav()
  const [tab, setTab] = useState('datos')
  const [hist] = useState(HIST_INIT)
  const [log]  = useState(LOG_INIT)
  const [showTarea, setShowTarea] = useState(false)

  const [form, setForm] = useState({
    // Identificación
    id: 'PRO-2501',
    propietario: 'Merlín Properties SOCIMI',
    cif: 'A-86305997',
    tipo_entidad: 'SOCIMI',
    pais: 'España',
    ciudad_sede: 'Madrid',
    estado: 'Activo',
    perfil: 'Core',
    asset_manager: 'Merlín Properties SOCIMI',
    responsable: 'Sierra Alvaro',
    email: 'ir@merlin-properties.com',
    telefono: '+34 91 769 99 00',
    contacto_principal: 'Ismael Clemente (CEO)',
    observaciones: 'SOCIMI cotizada en BME. Foco en oficinas, logística y centros comerciales en España y Portugal.',

    // Activo vinculado
    activo: 'P.E Avalon',
    zona: 'M-30',
    subzona: 'Julián Camarillo',
    superficie: '46956',
    uso: 'Oficinas',
    area: 'Descentralizado',
    tipologia: 'Asset deal',
    anyo_compra: '2018',
    trimestre: 'Q3',
    precio_compra: '130 M€',
    estado_activo: 'Ocupado',
    regimen: 'Propiedad 100%',
    valoracion_actual: '145 M€',
    plusvalia_latente: '+15 M€',

    // Condiciones inversión
    cap_rate: '5.1',
    yield: '5.4',
    tir_objetivo: '7.0',
    horizonte_inv: '7',
    estrategia: 'Hold',
    cap_rate_compra: '7.2',
    precio_m2_compra: '2769',
    precio_m2_actual: '3088',
    revalorizacion: '+11.5%',
    nota_estrategia: 'Activo estabilizado con potencial de rotación de arrendatarios. Estrategia de captura de rentas y eventual desinversión en ciclo alcista.',

    // Financiación
    ltv: '45',
    financiacion: '60',
    banco: 'CaixaBank / BBVA (sindicado)',
    tipo_deuda: 'Préstamo hipotecario',
    vencimiento_deuda: '2028',
    tipo_interes: 'EURIBOR + 175pb',
    cobertura: 'IRS al 70%',
    loan_amount: '58.5 M€',
    dscr: '2.1x',
    nota_financiacion: 'Deuda sindicada refinanciada en 2023. Covenant DSCR mínimo 1.5x cumplido holgadamente.',
  })

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const plusvaliaNum = form.valoracion_actual && form.precio_compra
    ? (() => {
        const va = parseFloat(form.valoracion_actual.replace(/[^0-9.]/g,''))
        const pc = parseFloat(form.precio_compra.replace(/[^0-9.]/g,''))
        if (isNaN(va)||isNaN(pc)||pc===0) return '—'
        const diff = va - pc
        const pct  = ((diff/pc)*100).toFixed(1)
        return `${diff>0?'+':''}${diff.toFixed(0)} M€ (${diff>0?'+':''}${pct}%)`
      })()
    : '—'

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn" style={{color:'var(--amber)'}}>Desactivar</button>
        <div className="ab-sep"/>
        <button className="ab-btn blue" onClick={()=>navigate('ficha-activo')}>🏢 Ver activo</button>
        <button className="ab-btn blue" onClick={()=>navigate('ficha-arrendatario')}>🔑 Ver arrendatarios</button>
        <button className="ab-btn blue" onClick={()=>navigate('mandatos')}>📄 Mandatos</button>
        <button className="ab-btn" onClick={()=>navigate('propietarios')}>← Volver</button>
        <div className="ab-sep"/>
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
        {(()=>{
          const getPropConfig = () => ({
            title: form.propietario,
            subtitle: `Informe de propietario · ${form.tipo_entidad} · ${form.perfil}`,
            coverMetrics: [
              { label: 'Perfil inversor', value: form.perfil },
              { label: 'Cap Rate', value: `${form.cap_rate}%` },
              { label: 'Yield', value: `${form.yield}%` },
              { label: 'Valoración actual', value: form.valoracion_actual },
              { label: 'Plusvalía latente', value: form.plusvalia_latente },
            ],
            sections: [
              {
                title: 'Identificación del propietario',
                type: 'kpis',
                data: [
                  { label: 'ID', value: form.id },
                  { label: 'CIF / NIF', value: form.cif },
                  { label: 'Tipo entidad', value: form.tipo_entidad },
                  { label: 'País', value: form.pais },
                  { label: 'Ciudad sede', value: form.ciudad_sede },
                  { label: 'Estado', value: form.estado },
                  { label: 'Perfil inversor', value: form.perfil },
                  { label: 'Responsable', value: form.responsable },
                ],
              },
              {
                title: 'Activo vinculado',
                type: 'kpis',
                data: [
                  { label: 'Activo', value: form.activo },
                  { label: 'Zona', value: form.zona },
                  { label: 'Uso', value: form.uso },
                  { label: 'Superficie (m²)', value: `${Number(form.superficie).toLocaleString('es-ES')} m²` },
                  { label: 'Régimen', value: form.regimen || '—' },
                  { label: 'Año compra', value: form.anyo_compra || '—' },
                  { label: 'Precio compra', value: form.precio_compra || '—' },
                  { label: 'Valoración actual', value: form.valoracion_actual || '—' },
                  { label: 'Plusvalía latente', value: form.plusvalia_latente || '—' },
                ],
              },
              {
                title: 'Condiciones de inversión',
                type: 'kpis',
                data: [
                  { label: 'Cap Rate actual', value: `${form.cap_rate}%` },
                  { label: 'Yield', value: `${form.yield}%` },
                  { label: 'TIR objetivo', value: `${form.tir_objetivo}%` },
                  { label: 'Cap Rate compra', value: `${form.cap_rate_compra}%` },
                  { label: 'Horizonte inv. (años)', value: form.horizonte_inv },
                  { label: 'Estrategia', value: form.estrategia },
                  { label: '€/m² compra', value: `${Number(form.precio_m2_compra).toLocaleString('es-ES')} €` },
                  { label: '€/m² actual', value: `${Number(form.precio_m2_actual).toLocaleString('es-ES')} €` },
                  { label: 'Revalorización', value: form.revalorizacion },
                ],
              },
              {
                title: 'Financiación',
                type: 'kpis',
                data: [
                  { label: 'LTV', value: `${form.ltv}%` },
                  { label: 'Banco', value: form.banco || '—' },
                  { label: 'Tipo de deuda', value: form.tipo_deuda || '—' },
                  { label: 'Vencimiento', value: form.vencimiento_deuda || '—' },
                  { label: 'Tipo de interés', value: form.tipo_interes ? `${form.tipo_interes}%` : '—' },
                ],
              },
              {
                title: 'Histórico de propietarios',
                type: 'table',
                headers: ['Propietario', 'Activo', 'Tipo', 'Precio', 'Entrada', 'Salida', 'Rentabilidad'],
                rows: HIST_INIT.map(h=>[h.propietario, h.activo, h.tipo, h.precio, h.fecha_entrada, h.fecha_salida||'Actual', h.rentabilidad||'—']),
              },
            ],
          })
          return (
            <div style={{display:'flex',gap:4}}>
              <button className="ab-btn" onClick={()=>exportPDF(getPropConfig())}>⬇ PDF</button>
              <button className="ab-btn" onClick={()=>exportPPT(getPropConfig())}>⬇ PPT</button>
            </div>
          )
        })()}
      </div>

      {/* Header */}
      <div className="ficha-wrap" style={{overflow:'auto'}}>
        <div className="ficha-main" style={{minWidth:0}}>

          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#1e40af,#3b82f6)',fontSize:18}}>🏛</div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'#eff6ff',color:'#1d4ed8',border:'1px solid #bfdbfe',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>PROPIETARIO</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>{form.id}</span>
                  <span className="tag" style={{fontSize:9,background:PERFIL_COLOR[form.perfil]+'22',color:PERFIL_COLOR[form.perfil],border:`1px solid ${PERFIL_COLOR[form.perfil]}44`}}>{form.perfil}</span>
                  <span className="tag" style={{fontSize:9,background:ESTADO_COLOR[form.estado]+'22',color:ESTADO_COLOR[form.estado],border:`1px solid ${ESTADO_COLOR[form.estado]}44`}}>{form.estado}</span>
                </div>
                <div className="ah-name">{form.propietario}</div>
                <div className="ah-sub">{form.activo} · {form.zona} · {form.superficie} m² · {form.anyo_compra}/{form.trimestre}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:24,marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)',flexWrap:'wrap'}}>
              <KpiMini label="Precio compra" value={form.precio_compra} color="var(--text1)"/>
              <KpiMini label="Valoración actual" value={form.valoracion_actual} color="var(--green)"/>
              <KpiMini label="Plusvalía latente" value={plusvaliaNum} color={plusvaliaNum.startsWith('+') ? 'var(--green)' : 'var(--red)'}/>
              <KpiMini label="Cap Rate" value={`${form.cap_rate}%`} color="var(--accent)"/>
              <KpiMini label="Yield" value={`${form.yield}%`} color="var(--purple)"/>
              <KpiMini label="LTV" value={`${form.ltv}%`} color={parseFloat(form.ltv)>55?'var(--amber)':'var(--text2)'}/>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {TABS.map((t,i)=>(
              <button key={t} className={`tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>{TAB_LABELS[i]}</button>
            ))}
          </div>

          {/* TAB: DATOS */}
          {tab==='datos' && (
            <div className="tab-content active">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>

                {/* Col 1: Propietario */}
                <div>
                  <div className="rp-sec">Propietario</div>
                  <div className="info-pad">
                    <div className="kf-grid">
                      <KF label="ID" value={form.id} mono/>
                      <KF label="Razón social" value={form.propietario} set={(v)=>set('propietario',v)}/>
                      <KF label="CIF / NIF" value={form.cif} set={(v)=>set('cif',v)} mono/>
                      <KF label="Tipo entidad" value={form.tipo_entidad} set={(v)=>set('tipo_entidad',v)}/>
                      <KF label="País" value={form.pais} set={(v)=>set('pais',v)}/>
                      <KF label="Ciudad sede" value={form.ciudad_sede} set={(v)=>set('ciudad_sede',v)}/>
                      <KF label="Perfil inversor">
                        <select className="kf-sel" value={form.perfil} onChange={e=>set('perfil',e.target.value)}>
                          {['Core','Value-add','Oportunista','Institucional','Privado'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Estado">
                        <select className="kf-sel" value={form.estado} onChange={e=>set('estado',e.target.value)}>
                          {['Activo','Inactivo','En desinversión','Vendido'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Asset manager" value={form.asset_manager} set={(v)=>set('asset_manager',v)}/>
                      <KF label="Responsable Savills">
                        <select className="kf-sel" value={form.responsable} onChange={e=>set('responsable',e.target.value)}>
                          {['Sierra Alvaro','GOMEZ Ignacio','García Marta'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                    </div>
                    <div style={{marginTop:10}}>
                      <div className="rp-lbl">Contacto principal</div>
                      <input className="kf-inp" value={form.contacto_principal} onChange={e=>set('contacto_principal',e.target.value)} style={{width:'100%',marginTop:3}}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
                      <div>
                        <div className="rp-lbl">Email</div>
                        <input className="kf-inp" value={form.email} onChange={e=>set('email',e.target.value)} style={{width:'100%',marginTop:3}}/>
                      </div>
                      <div>
                        <div className="rp-lbl">Teléfono</div>
                        <input className="kf-inp" value={form.telefono} onChange={e=>set('telefono',e.target.value)} style={{width:'100%',marginTop:3}}/>
                      </div>
                    </div>
                    <div style={{marginTop:10}}>
                      <div className="rp-lbl">Observaciones</div>
                      <textarea className="kf-inp" value={form.observaciones} onChange={e=>set('observaciones',e.target.value)} rows={4} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                    </div>
                  </div>
                </div>

                {/* Col 2: Activo vinculado */}
                <div>
                  <div className="rp-sec">Activo vinculado</div>
                  <div className="info-pad">
                    <div className="kf-grid">
                      <KF label="Activo">
                        <span className="asset-link" style={{cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>{form.activo}</span>
                      </KF>
                      <KF label="Zona" value={form.zona} set={(v)=>set('zona',v)}/>
                      <KF label="Sub-zona" value={form.subzona} set={(v)=>set('subzona',v)}/>
                      <KF label="Superficie" value={form.superficie} set={(v)=>set('superficie',v)} mono suffix="m²"/>
                      <KF label="Uso" value={form.uso} set={(v)=>set('uso',v)}/>
                      <KF label="Área">
                        <select className="kf-sel" value={form.area} onChange={e=>set('area',e.target.value)}>
                          {['CBD','Centro','Descentralizado','Periferia'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Tipología op.">
                        <select className="kf-sel" value={form.tipologia} onChange={e=>set('tipologia',e.target.value)}>
                          {['Asset deal','Share deal'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Año compra" value={form.anyo_compra} set={(v)=>set('anyo_compra',v)} mono/>
                      <KF label="Trimestre">
                        <select className="kf-sel" value={form.trimestre} onChange={e=>set('trimestre',e.target.value)}>
                          {['Q1','Q2','Q3','Q4'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Estado activo">
                        <select className="kf-sel" value={form.estado_activo} onChange={e=>set('estado_activo',e.target.value)}>
                          {['Ocupado','Vacío','En bruto','En reforma'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Régimen de prop." value={form.regimen} set={(v)=>set('regimen',v)}/>
                    </div>
                    <div style={{marginTop:12,background:'var(--gray-lt)',borderRadius:6,padding:10}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Valoración</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <div>
                          <div className="rp-lbl">Precio compra</div>
                          <input className="kf-inp" value={form.precio_compra} onChange={e=>set('precio_compra',e.target.value)} style={{width:'100%',marginTop:3,fontFamily:'var(--mono)',fontWeight:700}}/>
                        </div>
                        <div>
                          <div className="rp-lbl">Valoración actual</div>
                          <input className="kf-inp" value={form.valoracion_actual} onChange={e=>set('valoracion_actual',e.target.value)} style={{width:'100%',marginTop:3,fontFamily:'var(--mono)',fontWeight:700,color:'var(--green)'}}/>
                        </div>
                        <div>
                          <div className="rp-lbl">€/m² compra</div>
                          <input className="kf-inp" value={form.precio_m2_compra} onChange={e=>set('precio_m2_compra',e.target.value)} style={{width:'100%',marginTop:3,fontFamily:'var(--mono)'}}/>
                        </div>
                        <div>
                          <div className="rp-lbl">€/m² actual</div>
                          <input className="kf-inp" value={form.precio_m2_actual} onChange={e=>set('precio_m2_actual',e.target.value)} style={{width:'100%',marginTop:3,fontFamily:'var(--mono)'}}/>
                        </div>
                      </div>
                      <div style={{marginTop:8,padding:'6px 10px',background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:5}}>
                        <span style={{fontSize:11,color:'var(--text3)'}}>Plusvalía latente: </span>
                        <span style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:plusvaliaNum.startsWith('+')?'var(--green)':'var(--red)'}}>{plusvaliaNum}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Col 3: Financiación */}
                <div>
                  <div className="rp-sec">Financiación y estrategia</div>
                  <div className="info-pad">
                    <div className="kf-grid">
                      <KF label="LTV %" value={form.ltv} set={(v)=>set('ltv',v)} mono
                        extra={<span style={{fontSize:10,color:parseFloat(form.ltv)>55?'var(--amber)':'var(--green)',fontWeight:700,marginLeft:4}}>{parseFloat(form.ltv)>55?'⚠ Alto':'✓ OK'}</span>}
                      />
                      <KF label="Financiación %" value={form.financiacion} set={(v)=>set('financiacion',v)} mono/>
                      <KF label="Banco / entidad" value={form.banco} set={(v)=>set('banco',v)}/>
                      <KF label="Tipo de deuda" value={form.tipo_deuda} set={(v)=>set('tipo_deuda',v)}/>
                      <KF label="Importe del préstamo" value={form.loan_amount} set={(v)=>set('loan_amount',v)} mono/>
                      <KF label="Vencimiento deuda" value={form.vencimiento_deuda} set={(v)=>set('vencimiento_deuda',v)} mono/>
                      <KF label="Tipo de interés" value={form.tipo_interes} set={(v)=>set('tipo_interes',v)}/>
                      <KF label="Cobertura" value={form.cobertura} set={(v)=>set('cobertura',v)}/>
                      <KF label="DSCR" value={form.dscr} set={(v)=>set('dscr',v)} mono/>
                    </div>
                    <div style={{marginTop:10}}>
                      <div className="rp-lbl">Nota financiación</div>
                      <textarea className="kf-inp" value={form.nota_financiacion} onChange={e=>set('nota_financiacion',e.target.value)} rows={3} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                    </div>

                    <div style={{marginTop:14,borderTop:'1px solid var(--border)',paddingTop:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Estrategia inversión</div>
                      <div className="kf-grid">
                        <KF label="Estrategia">
                          <select className="kf-sel" value={form.estrategia} onChange={e=>set('estrategia',e.target.value)}>
                            {['Hold','Add value','Desinvertir','Refinanciar','Renovar contrato'].map(o=><option key={o}>{o}</option>)}
                          </select>
                        </KF>
                        <KF label="TIR objetivo %" value={form.tir_objetivo} set={(v)=>set('tir_objetivo',v)} mono/>
                        <KF label="Horizonte (años)" value={form.horizonte_inv} set={(v)=>set('horizonte_inv',v)} mono/>
                      </div>
                      <div style={{marginTop:8}}>
                        <div className="rp-lbl">Nota estrategia</div>
                        <textarea className="kf-inp" value={form.nota_estrategia} onChange={e=>set('nota_estrategia',e.target.value)} rows={3} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: CONDICIONES */}
          {tab==='condiciones' && (
            <div className="tab-content active">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

                <div>
                  <div className="rp-sec">Métricas de inversión</div>
                  <div className="info-pad">
                    <div className="kf-grid">
                      <KF label="Cap Rate entrada %" value={form.cap_rate_compra} set={(v)=>set('cap_rate_compra',v)} mono/>
                      <KF label="Cap Rate actual %" value={form.cap_rate} set={(v)=>set('cap_rate',v)} mono/>
                      <KF label="Yield actual %" value={form.yield} set={(v)=>set('yield',v)} mono/>
                      <KF label="TIR objetivo %" value={form.tir_objetivo} set={(v)=>set('tir_objetivo',v)} mono/>
                      <KF label="Revalorización" value={form.revalorizacion} mono
                        extra={<span style={{fontSize:11,fontWeight:700,color:form.revalorizacion.startsWith('+')?'var(--green)':'var(--red)',marginLeft:4}}>{form.revalorizacion.startsWith('+')?'▲':'▼'}</span>}
                      />
                      <KF label="Horizonte inversión (años)" value={form.horizonte_inv} set={(v)=>set('horizonte_inv',v)} mono/>
                    </div>

                    <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                      {[
                        {label:'Cap Rate compra',val:`${form.cap_rate_compra}%`,color:'var(--text2)'},
                        {label:'Cap Rate actual',val:`${form.cap_rate}%`,color:'var(--accent)'},
                        {label:'Compresión',val:`-${(parseFloat(form.cap_rate_compra)-parseFloat(form.cap_rate)).toFixed(1)}pp`,color:'var(--green)'},
                      ].map(m=>(
                        <div key={m.label} style={{background:'var(--gray-lt)',borderRadius:6,padding:'8px 10px',textAlign:'center'}}>
                          <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>{m.label}</div>
                          <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--mono)',color:m.color}}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="rp-sec">Estrategia y desinversión</div>
                  <div className="info-pad">
                    <div className="kf-grid">
                      <KF label="Estrategia actual">
                        <select className="kf-sel" value={form.estrategia} onChange={e=>set('estrategia',e.target.value)}>
                          {['Hold','Add value','Desinvertir','Refinanciar','Renovar contrato'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                      <KF label="Perfil inversor">
                        <select className="kf-sel" value={form.perfil} onChange={e=>set('perfil',e.target.value)}>
                          {['Core','Value-add','Oportunista','Institucional','Privado'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </KF>
                    </div>
                    <div style={{marginTop:10}}>
                      <div className="rp-lbl">Nota estrategia</div>
                      <textarea className="kf-inp" value={form.nota_estrategia} onChange={e=>set('nota_estrategia',e.target.value)} rows={5} style={{width:'100%',marginTop:3,resize:'vertical'}}/>
                    </div>
                    <div style={{marginTop:12,padding:10,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6}}>
                      <div style={{fontSize:10,fontWeight:700,color:'#16a34a',marginBottom:6}}>ACCIONES COMERCIALES</div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start',textAlign:'left'}} onClick={()=>navigate('ficha-mandato')}>📄 Crear mandato de venta</button>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start',textAlign:'left'}} onClick={()=>navigate('demandas')}>🔍 Buscar comprador activo</button>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start',textAlign:'left'}} onClick={()=>navigate('ficha-oferta')}>📧 Emitir oferta de venta</button>
                        <button className="ab-btn blue" style={{justifyContent:'flex-start',textAlign:'left'}} onClick={()=>navigate('ficha-negociacion')}>🤝 Iniciar negociación</button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: HISTÓRICO PROPIETARIOS */}
          {tab==='historico' && (
            <div className="tab-content active">
              <div style={{marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:12,color:'var(--text3)'}}>Propietarios anteriores de este activo — cuando un propietario se desactiva, queda registrado aquí.</div>
                <button className="tbtn prim" style={{fontSize:11}} onClick={()=>{}}>+ Registrar desinversión</button>
              </div>

              {hist.length===0 ? (
                <div style={{textAlign:'center',padding:'40px 0',color:'var(--text4)',fontSize:12}}>Sin registros históricos para este activo.</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {hist.map(h=>(
                    <div key={h.id} style={{border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'}}>
                      <div style={{background:'var(--gray-lt)',padding:'10px 14px',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid var(--border)'}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:13}}>{h.propietario}</div>
                          <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{h.activo} · {h.fecha_entrada} → {h.fecha_salida} · {h.duracion}</div>
                        </div>
                        <span className="tag tag-blue" style={{fontSize:9}}>{h.tipo}</span>
                        <span style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:13,color:'var(--text1)'}}>{h.precio}</span>
                        <span style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:h.rentabilidad.startsWith('+')?'var(--green)':'var(--red)'}}>{h.rentabilidad}</span>
                      </div>
                      <div style={{padding:'10px 14px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                        <div><div className="rp-lbl">Cap Rate entrada</div><div style={{fontFamily:'var(--mono)',fontWeight:600,marginTop:2}}>{h.cap_rate_entrada}%</div></div>
                        <div><div className="rp-lbl">Cap Rate salida</div><div style={{fontFamily:'var(--mono)',fontWeight:600,marginTop:2,color:'var(--accent)'}}>{h.cap_rate_salida}%</div></div>
                        <div><div className="rp-lbl">Responsable</div><div style={{fontSize:12,marginTop:2}}>{h.responsable}</div></div>
                        <div><div className="rp-lbl">Motivo desinversión</div><div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{h.motivo}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{marginTop:24}}>
                <div className="rp-sec">Registro de actividad</div>
                <div className="info-pad" style={{padding:0,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr style={{background:'var(--gray-lt)'}}>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'var(--text4)',fontSize:10,textTransform:'uppercase',letterSpacing:'.04em'}}>Fecha</th>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'var(--text4)',fontSize:10,textTransform:'uppercase',letterSpacing:'.04em'}}>Usuario</th>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'var(--text4)',fontSize:10,textTransform:'uppercase',letterSpacing:'.04em'}}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {log.map((l,i)=>(
                        <tr key={i} style={{borderTop:'1px solid var(--border)'}}>
                          <td style={{padding:'7px 12px',fontFamily:'var(--mono)',color:'var(--text3)'}}>{l.fecha}</td>
                          <td style={{padding:'7px 12px',fontWeight:600}}>{l.usuario}</td>
                          <td style={{padding:'7px 12px',color:'var(--text2)'}}>{l.accion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANÁLISIS */}
          {tab==='analisis' && (
            <div className="tab-content active">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

                <div>
                  <div className="rp-sec">Evolución de métricas</div>
                  <div className="info-pad">
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      {[
                        {anyo:'2018',cap:'7.2',yield:'7.5',val:'130 M€',nota:'Adquisición'},
                        {anyo:'2019',cap:'7.0',yield:'7.3',val:'133 M€',nota:''},
                        {anyo:'2020',cap:'6.5',yield:'6.8',val:'131 M€',nota:'Impacto Covid'},
                        {anyo:'2021',cap:'6.0',yield:'6.3',val:'136 M€',nota:''},
                        {anyo:'2022',cap:'5.8',yield:'6.1',val:'138 M€',nota:''},
                        {anyo:'2023',cap:'5.4',yield:'5.7',val:'142 M€',nota:'Refinanciación'},
                        {anyo:'2024',cap:'5.2',yield:'5.5',val:'143 M€',nota:''},
                        {anyo:'2025',cap:'5.1',yield:'5.4',val:'145 M€',nota:'Valoración actual'},
                      ].map((row,i,arr)=>(
                        <div key={row.anyo} style={{display:'grid',gridTemplateColumns:'50px 60px 60px 80px 1fr',gap:8,padding:'5px 10px',background:i===arr.length-1?'var(--accent-lt)':'transparent',borderRadius:4,fontSize:11,alignItems:'center'}}>
                          <div style={{fontWeight:700,fontFamily:'var(--mono)'}}>{row.anyo}</div>
                          <div style={{fontFamily:'var(--mono)',color:'var(--accent)'}}>{row.cap}%</div>
                          <div style={{fontFamily:'var(--mono)',color:'var(--purple)'}}>{row.yield}%</div>
                          <div style={{fontFamily:'var(--mono)',fontWeight:600}}>{row.val}</div>
                          <div style={{fontSize:10,color:'var(--text4)'}}>{row.nota}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:8,padding:'4px 10px',background:'var(--gray-lt)',borderRadius:4,fontSize:10,color:'var(--text4)',display:'flex',gap:16}}>
                      <span>Cap Rate · <span style={{color:'var(--accent)'}}>acum.</span></span>
                      <span>Yield · <span style={{color:'var(--purple)'}}>acum.</span></span>
                      <span>Valoración · <span style={{fontWeight:700}}>€</span></span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="rp-sec">Comparativa de mercado</div>
                  <div className="info-pad">
                    <div style={{marginBottom:10,fontSize:11,color:'var(--text3)'}}>Métricas del activo vs. benchmark de mercado (M-30 / Descentralizado)</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {[
                        {met:'Cap Rate',activo:5.1,mercado:5.3,unit:'%'},
                        {met:'Yield',activo:5.4,mercado:5.6,unit:'%'},
                        {met:'Precio €/m²',activo:3088,mercado:2900,unit:''},
                        {met:'LTV',activo:45,mercado:50,unit:'%'},
                      ].map(m=>{
                        const better = m.met==='Precio €/m²' ? m.activo > m.mercado : m.activo < m.mercado
                        return (
                          <div key={m.met} style={{display:'grid',gridTemplateColumns:'120px 1fr 80px',gap:8,alignItems:'center'}}>
                            <div style={{fontSize:11,fontWeight:600}}>{m.met}</div>
                            <div style={{position:'relative',height:14,background:'var(--gray-lt)',borderRadius:10,overflow:'hidden'}}>
                              <div style={{position:'absolute',left:0,top:0,height:'100%',width:`${Math.min((m.activo/Math.max(m.activo,m.mercado))*100,100)}%`,background:better?'var(--green)':'var(--amber)',borderRadius:10,transition:'width .4s'}}/>
                              <div style={{position:'absolute',left:`${(m.mercado/Math.max(m.activo,m.mercado))*100}%`,top:0,bottom:0,width:2,background:'var(--accent)',opacity:.5}}/>
                            </div>
                            <div style={{fontSize:11,fontFamily:'var(--mono)',textAlign:'right',color:better?'var(--green)':'var(--amber)',fontWeight:700}}>
                              {m.activo}{m.unit} <span style={{color:'var(--text4)',fontWeight:400,fontSize:9}}>vs {m.mercado}{m.unit}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{marginTop:14,padding:'8px 10px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,fontSize:11,color:'#15803d'}}>
                      <strong>Posición relativa:</strong> Activo con métricas por debajo del mercado en cap rate y yield (mejor posición para el propietario). Precio €/m² por encima de la media.
                    </div>
                  </div>

                  <div style={{marginTop:12}}>
                    <div className="rp-sec">Portfolio del propietario</div>
                    <div className="info-pad" style={{padding:0,overflow:'hidden'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                        <thead>
                          <tr style={{background:'var(--gray-lt)'}}>
                            {['Activo','Área','Sup. m²','Cap Rate','Estado'].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',fontWeight:700,color:'var(--text4)',fontSize:10,textTransform:'uppercase',letterSpacing:'.04em'}}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {activo:'P.E Avalon',area:'Descentralizado',sup:'46.956',cap:'5.1%',estado:'Ocupado',current:true},
                            {activo:'Albatros Edif. D',area:'Periferia',sup:'53.944',cap:'5.4%',estado:'Ocupado'},
                            {activo:'Torre Glòries',area:'Descentralizado',sup:'18.500',cap:'4.8%',estado:'Ocupado'},
                            {activo:'Park Logístico Getafe',area:'Periferia',sup:'24.000',cap:'6.2%',estado:'Ocupado'},
                          ].map(r=>(
                            <tr key={r.activo} style={{borderTop:'1px solid var(--border)',background:r.current?'var(--accent-lt)':'transparent'}}>
                              <td style={{padding:'6px 10px'}}><span className="asset-link" onClick={()=>navigate('ficha-activo')} style={{cursor:'pointer'}}>{r.activo}</span>{r.current&&<span style={{marginLeft:4,fontSize:8,background:'var(--accent)',color:'#fff',borderRadius:3,padding:'0 4px'}}>ESTE</span>}</td>
                              <td style={{padding:'6px 10px',color:'var(--text3)'}}>{r.area}</td>
                              <td style={{padding:'6px 10px',fontFamily:'var(--mono)'}}>{r.sup}</td>
                              <td style={{padding:'6px 10px',fontFamily:'var(--mono)',color:'var(--accent)',fontWeight:700}}>{r.cap}</td>
                              <td style={{padding:'6px 10px'}}><span className="tag tag-green" style={{fontSize:9}}>{r.estado}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Propietario" refNombre="Merlín Properties SOCIMI" onClose={() => setShowTarea(false)} />}
    </div>
  )
}

function KpiMini({label,value,color}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:2}}>
      <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</div>
      <div style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:color||'var(--text1)'}}>{value}</div>
    </div>
  )
}

function KF({label,value,set,mono,suffix,extra,children}) {
  if (children) return (
    <div className="kf">
      <div className="rp-lbl">{label}</div>
      {children}
    </div>
  )
  return (
    <div className="kf">
      <div className="rp-lbl">{label}</div>
      {set
        ? <input className="kf-inp" value={value||''} onChange={e=>set(e.target.value)}
            style={mono?{fontFamily:'var(--mono)'}:{}}/>
        : <div className="kf-val" style={mono?{fontFamily:'var(--mono)'}:{}}>{value||'—'}{suffix&&<span style={{fontSize:10,marginLeft:3,color:'var(--text4)'}}>{suffix}</span>}{extra}</div>
      }
    </div>
  )
}
