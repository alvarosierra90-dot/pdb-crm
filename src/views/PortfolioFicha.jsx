import { useState } from 'react'
import { useNav } from '../context/NavigationContext'

const TABS = ['pt-overview','pt-activos','pt-ofertas','pt-actividad','pt-financiero']
const TAB_LABELS = ['Overview','Activos (8)','Ofertas (5)','Actividad comercial','Financiero']

export default function PortfolioFicha() {
  const { navigate } = useNav()
  const [activeTab, setActiveTab] = useState('pt-overview')

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div className="ficha-main" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="port-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div className="port-ico">M</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="port-name">Merlín Properties SOCIMI</div>
                    <span className="tag tag-gray">MRL</span>
                    <span className="tag tag-gray">SOCIMI</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Mayor SOCIMI cotizada de España. Portfolio diversificado con activos prime en principales mercados.</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>📅 Último contacto: 12/03/2026</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase' }}>Cotización</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>11,24 €</div>
                  <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>↑ +1,8%</div>
                </div>
              </div>
              <div className="uso-bar">
                <div style={{ flex: .55, background: '#3b82f6', borderRadius: '3px 0 0 3px' }} />
                <div style={{ flex: .10, background: '#f59e0b' }} />
                <div style={{ flex: .20, background: '#ec4899' }} />
                <div style={{ flex: .05, background: '#8b5cf6' }} />
                <div style={{ flex: .05, background: '#f97316' }} />
                <div style={{ flex: .05, background: '#94a3b8', borderRadius: '0 3px 3px 0' }} />
              </div>
              <div className="uso-leg">
                {[['#3b82f6','Oficinas: 55%'],['#f59e0b','Logístico: 10%'],['#ec4899','Retail: 20%'],['#8b5cf6','Residencial: 5%'],['#f97316','Hoteles: 5%']].map(([c,l]) => (
                  <div key={l} className="ul-item"><div className="ul-dot" style={{ background: c }} />{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filtros-wrap">
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>Uso principal</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['Todo','Oficinas','Logístico','Retail'].map((f, i) => (
                  <span key={f} className={`fchip ${i === 0 ? 'active' : ''}`}>{f}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>Ciudad</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['Todo','Madrid','Barcelona','Valencia'].map((f, i) => (
                  <span key={f} className={`fchip ${i === 0 ? 'active' : ''}`}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="port-kpi-strip">
          <div className="pks"><div className="pks-lbl">Portfolio total (m²)</div><div className="pks-val">612.800</div><div className="pks-sub">Filtrado: Todo</div></div>
          <div className="pks"><div className="pks-lbl">Disponible (m²)</div><div className="pks-val amber">48.496</div><div className="pks-sub">Disponibilidad: 7.9%</div></div>
          <div className="pks"><div className="pks-lbl">Ocupación media</div><div className="pks-val green">88.8%</div><div className="pks-sub">WAULT: 4.2 años</div></div>
          <div className="pks"><div className="pks-lbl">Take-up 2026</div><div className="pks-val">52.000</div><div className="pks-sub">m² absorbidos</div></div>
          <div className="pks"><div className="pks-lbl">Yield medio</div><div className="pks-val">5.1%</div><div className="pks-sub">Cap rate: 4.8%</div></div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map((t, i) => (
            <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[i]}</div>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'pt-overview' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">
              <div className="port-grid-2">
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Portfolio total · Por ciudad</div>
                  <table className="dtbl">
                    <thead><tr><th>Ciudad</th><th>Nº Activos</th><th>M² Totales</th><th>Disponible</th></tr></thead>
                    <tbody>
                      <tr><td>Madrid</td><td>32</td><td>1.050.000</td><td className="d-up">96.000</td></tr>
                      <tr><td>Barcelona</td><td>19</td><td>630.000</td><td className="d-up">54.000</td></tr>
                      <tr><td>Valencia</td><td>6</td><td>210.000</td><td className="d-up">18.000</td></tr>
                      <tr style={{ fontWeight: 700 }}><td>TOTAL</td><td>64</td><td>2.100.000</td><td style={{ color: 'var(--amber)' }}>180.000</td></tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Portfolio · Por uso principal</div>
                  <table className="dtbl">
                    <thead><tr><th>Uso</th><th>% Portfolio</th><th>M² estimados</th></tr></thead>
                    <tbody>
                      <tr><td><span className="tag tag-blue">Oficinas</span></td><td>55%</td><td>1.155.000</td></tr>
                      <tr><td><span className="tag tag-teal">Logístico</span></td><td>10%</td><td>210.000</td></tr>
                      <tr><td><span className="tag tag-purple">Retail</span></td><td>20%</td><td>420.000</td></tr>
                      <tr><td><span className="tag tag-amber">Hoteles</span></td><td>5%</td><td>105.000</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="port-grid-2">
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Facturación Savills · KPIs</div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div className="kf"><div className="kf-lbl">Facturación histórica</div><div className="kf-val">20 M€</div></div>
                      <div className="kf"><div className="kf-lbl">Facturación 2026</div><div className="kf-val">2,65 M€</div></div>
                      <div className="kf"><div className="kf-lbl">Pipeline activo</div><div className="kf-val amber">1,50 M€</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activos */}
        {activeTab === 'pt-activos' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Activos del portfolio (8)</div>
                <table className="dtbl">
                  <thead><tr><th>Activo</th><th>Ciudad</th><th>Uso</th><th>SBA (m²)</th><th>Ocupación</th><th>Renta €/m²</th><th>Estado</th></tr></thead>
                  <tbody>
                    <tr onClick={() => navigate('ficha-activo')}><td className="dtbl-link">P.E Avalon</td><td>Madrid</td><td><span className="tag tag-blue">Oficinas</span></td><td>46.956</td><td style={{ color: 'var(--amber)' }}>78.4%</td><td>10,5</td><td><span className="tag tag-green">Activo</span></td></tr>
                    <tr><td className="dtbl-link">Torre Glòries</td><td>Barcelona</td><td><span className="tag tag-blue">Oficinas</span></td><td>18.500</td><td style={{ color: 'var(--green)' }}>100%</td><td>28,0</td><td><span className="tag tag-green">Activo</span></td></tr>
                    <tr><td className="dtbl-link">Park Logístico Getafe</td><td>Madrid</td><td><span className="tag tag-teal">Logístico</span></td><td>24.000</td><td style={{ color: 'var(--green)' }}>96%</td><td>6,8</td><td><span className="tag tag-green">Activo</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Ofertas */}
        {activeTab === 'pt-ofertas' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600 }}>Ofertas activas (5)</div>
                <table className="dtbl">
                  <thead><tr><th>Ref.</th><th>Activo</th><th>M²</th><th>Renta</th><th>Estado</th></tr></thead>
                  <tbody>
                    <tr onClick={() => navigate('ficha-oferta')}><td><span className="asset-link" style={{fontFamily:'var(--mono)'}}>OLB001</span></td><td>P.E Avalon</td><td>698</td><td>10,5–14,5 €/m²</td><td><span className="tag tag-blue">En curso</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Actividad */}
        {activeTab === 'pt-actividad' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">
              <div className="info-block">
                <div className="ib-title">ACTIVIDAD COMERCIAL RECIENTE</div>
                <div className="ir"><span className="ir-k">12/03/2026</span><span className="ir-v">Llamada con Asset Manager — interés mandato</span></div>
                <div className="ir"><span className="ir-k">01/03/2025</span><span className="ir-v">Visita Oracle a P.E Avalon — fase finalista</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Financiero */}
        {activeTab === 'pt-financiero' && (
          <div className="tab-content active" style={{ overflowY: 'auto' }}>
            <div className="port-body">
              <div className="info-2col">
                <div className="info-block">
                  <div className="ib-title">FINANCIERO PORTFOLIO</div>
                  <div className="ir"><span className="ir-k">Valor total cartera</span><span className="ir-v" style={{ fontWeight: 700 }}>€487M</span></div>
                  <div className="ir"><span className="ir-k">Ingresos brutos</span><span className="ir-v">€28.3M/año</span></div>
                  <div className="ir"><span className="ir-k">NOI</span><span className="ir-v">€24.2M/año</span></div>
                  <div className="ir"><span className="ir-k">Cap Rate</span><span className="ir-v">5.8%</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="ficha-right">

        {/* Resumen portfolio */}
        <div className="rp-sec">
          <div className="rp-lbl">Resumen del portfolio</div>
          <div className="kf-grid">
            <div className="kf"><div className="kf-lbl">Total activos</div><div className="kf-val">64</div></div>
            <div className="kf"><div className="kf-lbl">Portfolio (m²)</div><div className="kf-val">2.1M</div></div>
            <div className="kf"><div className="kf-lbl">Disponible</div><div className="kf-val amber">180k m²</div></div>
            <div className="kf"><div className="kf-lbl">Ofertas activas</div><div className="kf-val">31</div></div>
          </div>
        </div>

        {/* Facturación histórica */}
        <div className="rp-sec">
          <div className="rp-lbl">Facturación Savills · Histórico</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Total acumulado</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>20,3 M€</span>
            </div>
            {/* Barra visual por línea de negocio */}
            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1, marginBottom: 6 }}>
              <div style={{ flex: .52, background: 'var(--accent)' }} title="Leasing"/>
              <div style={{ flex: .28, background: 'var(--purple)' }} title="Capital Markets"/>
              <div style={{ flex: .12, background: 'var(--teal)' }} title="Valoraciones"/>
              <div style={{ flex: .08, background: 'var(--amber)' }} title="Otros"/>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', marginBottom: 8 }}>
              {[['var(--accent)','Leasing','10,6M'],['var(--purple)','Cap. Markets','5,7M'],['var(--teal)','Valoraciones','2,4M'],['var(--amber)','Otros','1,6M']].map(([c,l,v])=>(
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: c, flexShrink: 0 }}/>
                  <span style={{ fontSize: 9, color: 'var(--text3)' }}>{l}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Tabla por año */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '3px 0', fontSize: 9, fontWeight: 600, color: 'var(--text4)', textAlign: 'left', textTransform: 'uppercase' }}>Año</th>
                <th style={{ padding: '3px 0', fontSize: 9, fontWeight: 600, color: 'var(--text4)', textAlign: 'right', textTransform: 'uppercase' }}>Facturado</th>
                <th style={{ padding: '3px 0', fontSize: 9, fontWeight: 600, color: 'var(--text4)', textAlign: 'right', textTransform: 'uppercase' }}>Ops</th>
              </tr>
            </thead>
            <tbody>
              {[
                {year:'2026',val:'2,65 M€',ops:3,cur:true},
                {year:'2025',val:'4,10 M€',ops:5},
                {year:'2024',val:'3,80 M€',ops:4},
                {year:'2023',val:'5,20 M€',ops:7},
                {year:'2022',val:'4,55 M€',ops:6},
              ].map(r=>(
                <tr key={r.year} style={{ borderBottom: '1px solid var(--border)', background: r.cur ? 'var(--accent-lt)' : 'transparent' }}>
                  <td style={{ padding: '4px 0', fontWeight: r.cur ? 700 : 400, color: r.cur ? 'var(--accent)' : 'var(--text2)' }}>{r.year}{r.cur && <span style={{ fontSize: 8, marginLeft: 4, background: 'var(--accent)', color: '#fff', padding: '0 4px', borderRadius: 3 }}>YTD</span>}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: r.cur ? 700 : 500, color: r.cur ? 'var(--accent)' : 'var(--text)' }}>{r.val}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--text3)' }}>{r.ops}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Facturación año en curso */}
        <div className="rp-sec">
          <div className="rp-lbl">Facturación 2026 · En curso</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Facturado</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>2,65 M€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Pipeline activo</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)' }}>1,50 M€</span>
            </div>
            {/* Barra progreso vs objetivo */}
            <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 3 }}>Progreso vs. objetivo anual (5,5 M€)</div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
              <div style={{ height: '100%', width: '48%', background: 'var(--green)', borderRadius: 3 }}/>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'right' }}>48% conseguido</div>
          </div>
          {/* Desglose 2026 */}
          {[
            {ico:'📋',label:'Arrendamiento P.E Avalon P4',valor:'620 k€',estado:'Cerrado',color:'var(--green)'},
            {ico:'💹',label:'Mandato captación Glòries',valor:'1,03 M€',estado:'Cerrado',color:'var(--green)'},
            {ico:'📊',label:'Valoración portfolio Q1',valor:'85 k€',estado:'Facturado',color:'var(--teal)'},
            {ico:'🤝',label:'Arrendamiento Getafe P3',valor:'910 k€',estado:'En curso',color:'var(--amber)'},
            {ico:'📄',label:'Mandato exclusiva retail',valor:'590 k€',estado:'En curso',color:'var(--amber)'},
          ].map((op,i)=>(
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{op.ico}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{op.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: op.color }}>{op.valor}</span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: op.color, background: op.color === 'var(--green)' ? 'var(--green-lt)' : op.color === 'var(--teal)' ? 'var(--teal-lt)' : 'var(--amber-lt)', border: `1px solid ${op.color === 'var(--green)' ? 'var(--green-bd)' : op.color === 'var(--teal)' ? 'var(--teal-bd)' : 'var(--amber-bd)'}`, padding: '0 4px', borderRadius: 4 }}>{op.estado}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Proyectos en curso */}
        <div className="rp-sec">
          <div className="rp-lbl">Proyectos en curso</div>
          {[
            {ico:'📋',label:'Mandato exclusiva Leasing',sub:'Leasing · P.E Avalon P4–P5 · Activo',color:'var(--accent)'},
            {ico:'📋',label:'Mandato captación retail',sub:'Retail · Parque La Gavia · Activo',color:'var(--accent)'},
            {ico:'💹',label:'Due Diligence venta Torre Glòries',sub:'Capital Markets · En proceso',color:'var(--purple)'},
            {ico:'📊',label:'Valoración anual portfolio',sub:'Valoraciones · Q2 2026 · Abierto',color:'var(--teal)'},
            {ico:'🔍',label:'Informe de mercado logístico',sub:'Research · Q2 2026 · En redacción',color:'var(--gray)'},
          ].map((p,i)=>(
            <div key={i} className="proj-item">
              <div style={{ width: 26, height: 26, borderRadius: 5, background: 'var(--gray-lt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{p.ico}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.sub}</div>
              </div>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0, marginTop: 5 }}/>
            </div>
          ))}
          <span style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500, marginTop: 4, display: 'inline-block' }}>+ Añadir proyecto</span>
        </div>

        {/* Equipos comerciales */}
        <div className="rp-sec">
          <div className="rp-lbl">Equipos comerciales</div>
          {[
            {equipo:'Leasing Oficinas MAD',ops:12,factura:'8,4 M€',last:'Mar 2026',color:'var(--accent)'},
            {equipo:'Capital Markets MAD',ops:4,factura:'5,7 M€',last:'Feb 2026',color:'var(--purple)'},
            {equipo:'Valoraciones MAD',ops:6,factura:'2,4 M€',last:'Ene 2026',color:'var(--teal)'},
            {equipo:'Leasing Industrial MAD',ops:3,factura:'1,8 M€',last:'Dic 2025',color:'var(--orange)'},
            {equipo:'Retail MAD',ops:2,factura:'1,0 M€',last:'Nov 2025',color:'var(--amber)'},
            {equipo:'Research MAD',ops:5,factura:'—',last:'Mar 2026',color:'var(--gray)'},
          ].map((eq,i)=>(
            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
              <div style={{ width: 4, borderRadius: 2, alignSelf: 'stretch', background: eq.color, flexShrink: 0, marginTop: 2 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)' }}>{eq.equipo}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 9, color: 'var(--text4)' }}>{eq.ops} ops</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: eq.color }}>{eq.factura}</span>
                  <span style={{ fontSize: 9, color: 'var(--text4)' }}>Últ. {eq.last}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Asistente IA */}
        <div className="rp-sec">
          <div className="rp-lbl">Asistente IA</div>
          <div className="ai-box">
            <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Análisis relación</span><span className="ai-badge">Tiempo real</span></div>
            <div className="ai-text">Relación de <strong>5 años</strong>. Facturación histórica 20M€ — 3er mayor cliente. Pipeline 1,5M€ activo. Próximo vencimiento mandato <strong>Jul 2026</strong>.</div>
            <div className="ai-cta">✎ Preparar propuesta de valor</div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="rp-sec">
          <div className="rp-lbl">Accesos rápidos</div>
          <button className="acc-btn" onClick={() => setActiveTab('pt-activos')}>📋 Ver activos (8)</button>
          <button className="acc-btn" onClick={() => setActiveTab('pt-ofertas')}>📄 Ver ofertas (5)</button>
          <button className="acc-btn" onClick={() => setActiveTab('pt-actividad')}>📊 Actividad comercial</button>
          <button className="acc-btn">💹 Cotización 11,24€</button>
        </div>
      </div>
    </div>
  )
}
