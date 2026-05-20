import { useState, useEffect, useMemo } from 'react'
import { useNav } from '../context/NavigationContext'
import { GraduationCap, BookOpen, Calculator, Search, CheckCircle2, ChevronDown, ChevronRight, Trophy, Target, Building2 } from 'lucide-react'
import HeaderPills from '../components/HeaderPills'
import { MODULOS, CALCULADORAS, GLOSARIO, QUIZZES } from '../data/formacionInterna'

// Tabs principales del módulo.
const TABS = [
  ['dashboard',     'Dashboard',     GraduationCap],
  ['modulos',       'Módulos',       BookOpen],
  ['calculadoras',  'Calculadoras',  Calculator],
  ['glosario',      'Glosario',      Search],
  ['tests',         'Tests',         CheckCircle2],
]

const STORAGE_KEY = 'pdb.formacion.v1'

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveProgress(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch {}
}

export default function FormacionInterna() {
  const [tab, setTab] = useState('dashboard')
  const [moduloAbierto, setModuloAbierto] = useState(null)  // id del módulo seleccionado
  const [calcAbierta, setCalcAbierta] = useState(null)
  const [testAbierto, setTestAbierto] = useState(null)
  const [progress, setProgress] = useState(loadProgress())

  useEffect(() => { saveProgress(progress) }, [progress])

  const totalConceptos = MODULOS.reduce((s, m) => s + m.conceptos.length, 0)
  const aprendidos     = Object.values(progress.aprendidos || {}).filter(Boolean).length
  const modCompletos   = MODULOS.filter(m =>
    m.conceptos.filter(c => progress.aprendidos?.[`${m.id}-${c.num}`]).length === m.conceptos.length
  ).length
  const testsCompletos = Object.keys(progress.quizScores || {}).length
  const mejorPunt      = Object.values(progress.quizScores || {})
  const mejorPuntStr   = mejorPunt.length ? `${Math.max(...mejorPunt)}/5` : '—'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn" onClick={() => { setModuloAbierto(null); setCalcAbierta(null); setTestAbierto(null); setTab('dashboard') }}>← Inicio</button>
        <div className="ab-sep"/>
        <button
          className="ab-btn"
          onClick={() => {
            if (!window.confirm('¿Resetear todo el progreso de formación?')) return
            setProgress({})
          }}
          title="Borra cards aprendidas y puntuaciones de tests"
        >
          ↺ Resetear progreso
        </button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Header de la herramienta */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div className="ah-ico" style={{ background:'linear-gradient(135deg,#1e3a8a,#0ea5e9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <GraduationCap size={20} strokeWidth={1.75} color="#fff"/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="ah-ref">
                  <span style={{ background:'var(--accent-lt)', color:'var(--accent)', border:'1px solid var(--accent-bd)', padding:'0 6px', borderRadius:3, fontSize:9, fontWeight:700 }}>FORMACIÓN INTERNA</span>
                  <span style={{ color:'var(--text4)', fontSize:11 }}>· Capital Markets Inmobiliario · Industrial & Logistics</span>
                </div>
                <div className="ah-name">Plataforma de formación · CRE Capital Markets</div>
                <div className="ah-addr">12 módulos · 4 calculadoras · 60+ términos · Tests por módulo</div>
              </div>
              <HeaderPills items={[
                { key:'mod', type:'info', label:'Módulos completos', value:`${modCompletos}/${MODULOS.length}`, color:'accent', accent: modCompletos > 0 },
                { key:'concept', type:'info', label:'Conceptos aprendidos', value:`${aprendidos}/${totalConceptos}`, color:'green', accent: aprendidos > 0 },
                { key:'tests', type:'info', label:'Tests completados', value:`${testsCompletos}/${Object.keys(QUIZZES).length}`, color:'amber', accent: testsCompletos > 0 },
                { key:'best', type:'info', label:'Mejor puntuación', value: mejorPuntStr, color:'purple', accent: mejorPunt.length > 0 },
              ]}/>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {TABS.map(([k, label, Icon]) => (
              <div key={k} className={`tab ${tab === k ? 'active' : ''}`}
                onClick={() => { setTab(k); setModuloAbierto(null); setCalcAbierta(null); setTestAbierto(null) }}>
                <Icon size={13} strokeWidth={1.75} style={{ marginRight:5, verticalAlign:'-2px' }}/>
                {label}
              </div>
            ))}
          </div>

          <div className="info-pad" style={{ padding:'18px 22px', flex:1, overflowY:'auto', minHeight:0 }}>

            {tab === 'dashboard' && (
              <DashboardTab
                progress={progress}
                onAbrirModulo={(id) => { setModuloAbierto(id); setTab('modulos') }}
                onAbrirCalc={(id)   => { setCalcAbierta(id); setTab('calculadoras') }}
              />
            )}

            {tab === 'modulos' && (
              moduloAbierto
                ? <ModuloDetalle
                    modulo={MODULOS.find(m => m.id === moduloAbierto)}
                    progress={progress}
                    setProgress={setProgress}
                    onVolver={() => setModuloAbierto(null)}
                    onAbrirTest={(id) => { setTestAbierto(id); setTab('tests') }}
                  />
                : <ModulosLista
                    progress={progress}
                    onAbrir={(id) => setModuloAbierto(id)}
                  />
            )}

            {tab === 'calculadoras' && (
              calcAbierta
                ? <CalculadoraDetalle calc={calcAbierta} onVolver={() => setCalcAbierta(null)} />
                : <CalculadorasLista onAbrir={(id) => setCalcAbierta(id)} />
            )}

            {tab === 'glosario'    && <GlosarioTab />}

            {tab === 'tests'       && (
              testAbierto
                ? <TestRunner
                    modId={testAbierto}
                    progress={progress}
                    setProgress={setProgress}
                    onVolver={() => setTestAbierto(null)}
                  />
                : <TestsLista
                    progress={progress}
                    onAbrir={(id) => setTestAbierto(id)}
                  />
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function DashboardTab({ progress, onAbrirModulo, onAbrirCalc }) {
  const conceptoDelDia = useMemo(() => {
    const dia = new Date().getDate()
    return GLOSARIO[dia % GLOSARIO.length]
  }, [])

  return (
    <div>
      {/* Concepto del día */}
      <div style={{ padding:'14px 18px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:8, marginBottom:18 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>
          Concepto del día
        </div>
        <div style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>
          {conceptoDelDia[0]} <span style={{ fontSize:13, color:'var(--text4)', fontWeight:500 }}>· {conceptoDelDia[1]}</span>
        </div>
        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5, marginTop:6 }}>
          {conceptoDelDia[2]}
        </div>
      </div>

      {/* Indicadores de mercado · ticker */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:10, marginBottom:18 }}>
        {[
          ['Prime Log Yield MAD', '5.00%', '▼ vs 3.75% (2022)'],
          ['Euribor 12M',         '~2.5%', '▼ vs 4.1% (2023)'],
          ['Spread Log/Bono 10Y', '~180 bps', 'media histórica 200-250'],
          ['Inversión Log 2024',  '€1.2B', 'España'],
          ['BCE Rate',            '2.25%', '▼'],
        ].map(([lbl, val, sub]) => (
          <div key={lbl} style={{ padding:'10px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em' }}>{lbl}</div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginTop:2, fontFamily:'var(--mono)' }}>{val}</div>
            <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Acceso rápido a calculadoras */}
      <div style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.05em', fontSize:11 }}>
        Acceso rápido a calculadoras
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10, marginBottom:24 }}>
        {CALCULADORAS.map(c => (
          <div key={c.id} onClick={() => onAbrirCalc(c.id)}
            style={{ padding:'12px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{c.titulo}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Lista de módulos resumida */}
      <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.05em' }}>
        Programa formativo · 12 módulos
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
        {MODULOS.map(m => {
          const aprendidos = m.conceptos.filter(c => progress.aprendidos?.[`${m.id}-${c.num}`]).length
          const pct = Math.round(aprendidos / m.conceptos.length * 100)
          return (
            <div key={m.id} onClick={() => onAbrirModulo(m.id)}
              style={{ padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'.05em' }}>
                Módulo {m.id.replace('m','')} · {m.nivel}
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginTop:3 }}>{m.titulo}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:5, lineHeight:1.45 }}>{m.descripcion}</div>
              <div style={{ display:'flex', gap:5, marginTop:8, flexWrap:'wrap' }}>
                {m.tags.map(t => <span key={t} style={{ fontSize:10, padding:'1px 6px', background:'var(--gray-lt,#f4f4f5)', color:'var(--text3)', borderRadius:3 }}>{t}</span>)}
              </div>
              <div style={{ marginTop:10, height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:'var(--accent)', transition:'width .3s' }}/>
              </div>
              <div style={{ fontSize:10, color:'var(--text4)', marginTop:4, fontFamily:'var(--mono)' }}>
                {aprendidos}/{m.conceptos.length} conceptos · {pct}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MÓDULOS · LISTA
// ═══════════════════════════════════════════════════════════════════
function ModulosLista({ progress, onAbrir }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
      {MODULOS.map(m => {
        const aprendidos = m.conceptos.filter(c => progress.aprendidos?.[`${m.id}-${c.num}`]).length
        const pct = Math.round(aprendidos / m.conceptos.length * 100)
        const completo = aprendidos === m.conceptos.length
        return (
          <div key={m.id} onClick={() => onAbrir(m.id)}
            style={{ padding:'14px 16px', background:'var(--surface)', border:`1px solid ${completo ? 'var(--green-bd)' : 'var(--border)'}`, borderRadius:6, cursor:'pointer', transition:'all .15s', position:'relative' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = completo ? 'var(--green-bd)' : 'var(--border)' }}>
            {completo && <span style={{ position:'absolute', top:8, right:10, fontSize:14, color:'var(--green)' }}>✓</span>}
            <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'.05em' }}>
              Módulo {m.id.replace('m','')} · {m.nivel}
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginTop:3 }}>{m.titulo}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:5, lineHeight:1.45 }}>{m.descripcion}</div>
            <div style={{ display:'flex', gap:5, marginTop:8, flexWrap:'wrap' }}>
              {m.tags.map(t => <span key={t} style={{ fontSize:10, padding:'1px 6px', background:'var(--gray-lt,#f4f4f5)', color:'var(--text3)', borderRadius:3 }}>{t}</span>)}
            </div>
            <div style={{ marginTop:10, height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background: completo ? 'var(--green)' : 'var(--accent)', transition:'width .3s' }}/>
            </div>
            <div style={{ fontSize:10, color:'var(--text4)', marginTop:4, fontFamily:'var(--mono)' }}>
              {aprendidos}/{m.conceptos.length} conceptos · {pct}%
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MÓDULO · DETALLE con concept cards expandibles
// ═══════════════════════════════════════════════════════════════════
function ModuloDetalle({ modulo, progress, setProgress, onVolver, onAbrirTest }) {
  const [abierto, setAbierto] = useState({})
  const toggleAbierto = (key) => setAbierto(p => ({ ...p, [key]: !p[key] }))
  const toggleAprendido = (key) => {
    setProgress(p => ({
      ...p,
      aprendidos: { ...(p.aprendidos || {}), [key]: !(p.aprendidos?.[key]) }
    }))
  }

  const tieneTest = !!QUIZZES[modulo.id]
  const score = progress.quizScores?.[modulo.id]

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <button onClick={onVolver} style={{ padding:'5px 12px', fontSize:11, border:'1px solid var(--border)', borderRadius:5, background:'var(--surface)', cursor:'pointer', fontFamily:'inherit', color:'var(--text2)' }}>
          ← Módulos
        </button>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'.05em' }}>
          Módulo {modulo.id.replace('m','')} · {modulo.nivel}
        </div>
      </div>
      <div style={{ fontSize:22, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{modulo.titulo}</div>
      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20, maxWidth:680, lineHeight:1.55 }}>{modulo.descripcion}</div>

      {/* Concept cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
        {modulo.conceptos.map(c => {
          const key = `${modulo.id}-${c.num}`
          const isOpen = !!abierto[key]
          const isLearned = !!progress.aprendidos?.[key]
          return (
            <div key={c.num} style={{ background:'var(--surface)', border:`1px solid ${isLearned ? 'var(--green-bd)' : 'var(--border)'}`, borderRadius:6, overflow:'hidden' }}>
              <div onClick={() => toggleAbierto(key)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', cursor:'pointer' }}>
                <span style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--accent)', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', padding:'1px 7px', borderRadius:3, fontWeight:700 }}>
                  {c.num}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{c.titulo}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{c.sub}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAprendido(key) }}
                  style={{ padding:'3px 10px', fontSize:10, fontWeight:700, border:`1px solid ${isLearned ? 'var(--green)' : 'var(--border)'}`, borderRadius:4, background: isLearned ? 'var(--green-lt)' : 'transparent', color: isLearned ? 'var(--green)' : 'var(--text3)', cursor:'pointer', fontFamily:'inherit' }}
                >
                  {isLearned ? '✓ Aprendido' : 'Marcar'}
                </button>
                {isOpen ? <ChevronDown size={14} strokeWidth={2} color="var(--text4)"/> : <ChevronRight size={14} strokeWidth={2} color="var(--text4)"/>}
              </div>
              {isOpen && (
                <div style={{ padding:'0 14px 14px 14px', fontSize:12.5, color:'var(--text2)', lineHeight:1.65 }}>
                  {c.resumen}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA test del módulo */}
      {tieneTest && (
        <div style={{ padding:'14px 16px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:6, display:'flex', alignItems:'center', gap:14 }}>
          <Trophy size={20} strokeWidth={1.75} color="var(--accent)"/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Test del módulo</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
              {QUIZZES[modulo.id].length} preguntas con feedback inmediato. {score != null ? `Tu mejor puntuación: ${score}/${QUIZZES[modulo.id].length}` : 'Sin intentar todavía.'}
            </div>
          </div>
          <button onClick={() => onAbrirTest(modulo.id)}
            style={{ padding:'8px 16px', fontSize:12, fontWeight:700, border:'none', borderRadius:5, background:'var(--accent)', color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
            {score != null ? 'Repetir test →' : 'Empezar test →'}
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CALCULADORAS · LISTA + DETALLES (4)
// ═══════════════════════════════════════════════════════════════════
function CalculadorasLista({ onAbrir }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
      {CALCULADORAS.map(c => (
        <div key={c.id} onClick={() => onAbrir(c.id)}
          style={{ padding:'16px 18px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', transition:'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
          <Calculator size={20} strokeWidth={1.75} color="var(--accent)" style={{ marginBottom:6 }}/>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{c.titulo}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

function CalculadoraDetalle({ calc, onVolver }) {
  const meta = CALCULADORAS.find(c => c.id === calc)
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <button onClick={onVolver} style={{ padding:'5px 12px', fontSize:11, border:'1px solid var(--border)', borderRadius:5, background:'var(--surface)', cursor:'pointer', fontFamily:'inherit', color:'var(--text2)' }}>
          ← Calculadoras
        </button>
      </div>
      <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{meta.titulo}</div>
      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:18 }}>{meta.sub}</div>
      {calc === 'caprate' && <CalcCapRate/>}
      {calc === 'dcf'     && <CalcDCF/>}
      {calc === 'wault'   && <CalcWault/>}
      {calc === 'debt'    && <CalcDebt/>}
    </div>
  )
}

// helpers numéricos compartidos
function fmtM(n) {
  if (Math.abs(n) >= 1000000) return (n/1000000).toFixed(2) + 'M'
  if (Math.abs(n) >= 1000)    return (n/1000).toFixed(0) + 'K'
  return Math.round(n).toLocaleString('es-ES')
}
const Field = ({ label, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
    <label style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.04em' }}>{label}</label>
    {children}
  </div>
)
const inpStyle = { padding:'7px 9px', fontSize:12, border:'1px solid var(--border)', borderRadius:5, background:'var(--surface)', fontFamily:'var(--mono)', outline:'none', boxSizing:'border-box' }
const Result = ({ label, value, sub, primary }) => (
  <div style={{ padding:'10px 12px', background:'var(--gray-lt,#f4f4f5)', border:'1px solid var(--border)', borderRadius:5 }}>
    <div style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</div>
    <div style={{ fontSize: primary ? 18 : 15, fontWeight:700, color: primary ? 'var(--green)' : 'var(--text)', fontFamily:'var(--mono)', marginTop:3 }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:'var(--text4)', marginTop:1 }}>{sub}</div>}
  </div>
)

// Cap Rate
const PRIME_YIELDS = { logistics: 5.0, office: 4.75, retail: 5.25, residential: 4.0 }
function CalcCapRate() {
  const [price, setPrice] = useState(20000000)
  const [noi, setNoi]     = useState(1000000)
  const [costs, setCosts] = useState(1.5)
  const [asset, setAsset] = useState('logistics')
  const capRate    = price > 0 ? (noi / price) * 100 : 0
  const totalCost  = price * (1 + costs / 100)
  const niy        = totalCost > 0 ? (noi / totalCost) * 100 : 0
  const prime      = PRIME_YIELDS[asset] || 5.0
  const primeValue = noi / (prime / 100)
  const diff       = capRate - prime
  const interp     = !price || !noi ? 'Introduce precio y NOI para calcular.'
    : Math.abs(diff) < 0.1 ? `Activo valorado aproximadamente a prime yield de mercado (${prime.toFixed(2)}%).`
    : diff < 0 ? `Activo cotiza ${Math.abs(diff).toFixed(2)}% por debajo del prime — más caro que el prime.`
    : diff <= 0.5 ? `Activo ${diff.toFixed(2)}% sobre prime — ligero descuento. Activo de muy buena calidad pero no exactamente prime.`
    : diff <= 1.5 ? `Activo ${diff.toFixed(2)}% sobre prime — descuento moderado. Calidad secundaria o mercado no prime.`
    : `Activo ${diff.toFixed(2)}% sobre prime — descuento significativo. Posible vacante, WAULT corto o mercado secundario.`

  return (
    <div style={{ padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12, marginBottom:14 }}>
        <Field label="Precio de adquisición (€)"><input type="number" style={inpStyle} value={price} onChange={e => setPrice(+e.target.value)}/></Field>
        <Field label="NOI anual (€)"><input type="number" style={inpStyle} value={noi} onChange={e => setNoi(+e.target.value)}/></Field>
        <Field label="Gastos adquisición (% precio)"><input type="number" step="0.1" style={inpStyle} value={costs} onChange={e => setCosts(+e.target.value)}/></Field>
        <Field label="Clase de activo">
          <select style={{ ...inpStyle, fontFamily:'inherit' }} value={asset} onChange={e => setAsset(e.target.value)}>
            <option value="logistics">Logística</option>
            <option value="office">Oficinas</option>
            <option value="retail">Retail</option>
            <option value="residential">Residencial</option>
          </select>
        </Field>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:8, marginBottom:12 }}>
        <Result primary label="Cap Rate (sobre precio)" value={`${capRate.toFixed(2)}%`}/>
        <Result label="NIY (incl. costes adq.)" value={`${niy.toFixed(2)}%`}/>
        <Result label={`Precio si prime ${prime.toFixed(2)}%`} value={`€${fmtM(primeValue)}`}/>
        <Result label="NOI / €M invertido" value={`€${Math.round((noi/price)*1000000).toLocaleString('es-ES')}`}/>
      </div>
      <div style={{ padding:'10px 12px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:5, fontSize:12, color:'var(--accent)', lineHeight:1.5 }}>
        {interp}
      </div>
    </div>
  )
}

// DCF / IRR
function calcIRR(cashflows) {
  let r = 0.1
  for (let i = 0; i < 200; i++) {
    let npv = 0, dnpv = 0
    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / Math.pow(1+r, t)
      dnpv += -t * cashflows[t] / Math.pow(1+r, t+1)
    }
    if (Math.abs(npv) < 1) break
    if (dnpv === 0) break
    r = r - npv / dnpv
    if (r < -0.99) r = -0.99
    if (r > 10) r = 10
  }
  return r
}
function calcNPV(cf, rate) {
  return cf.reduce((sum, c, t) => sum + c / Math.pow(1+rate, t), 0)
}

function CalcDCF() {
  const [price, setPrice]       = useState(20000000)
  const [noi1, setNoi1]         = useState(1000000)
  const [growth, setGrowth]     = useState(3)
  const [exitCap, setExitCap]   = useState(5)
  const [hold, setHold]         = useState(10)
  const [ltv, setLtv]           = useState(55)
  const [debtRate, setDebtRate] = useState(4.5)
  const [discRate, setDiscRate] = useState(8)

  const result = useMemo(() => {
    if (!price || !noi1) return null
    const g = growth / 100, ec = exitCap / 100, dr = debtRate / 100, disc = discRate / 100, l = ltv / 100
    const nois = []
    let n = noi1
    for (let i = 0; i < hold; i++) { nois.push(n); n *= (1+g) }
    const exitNOI = nois[hold-1] * (1+g)
    const exitValue = exitNOI / ec
    const unlCF = [-price]
    for (let i = 0; i < hold-1; i++) unlCF.push(nois[i])
    unlCF.push(nois[hold-1] + exitValue)
    const irrUnlev = calcIRR(unlCF) * 100
    const npvVal = calcNPV(unlCF, disc)
    const debt = price * l
    const equity = price - debt
    const annualInterest = debt * dr
    const levCF = [-equity]
    for (let k = 0; k < hold-1; k++) levCF.push(nois[k] - annualInterest)
    levCF.push(nois[hold-1] - annualInterest + exitValue - debt)
    const irrLev = l > 0 ? calcIRR(levCF) * 100 : irrUnlev
    let totalRet = 0
    for (let i = 1; i < levCF.length; i++) totalRet += levCF[i]
    const em = (totalRet + equity) / equity
    return { irrUnlev, irrLev, em, npvVal, exitValue, equity, unlCF }
  }, [price, noi1, growth, exitCap, hold, ltv, debtRate, discRate])

  return (
    <div style={{ padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:14 }}>
        <Field label="Precio compra (€)"><input type="number" style={inpStyle} value={price} onChange={e => setPrice(+e.target.value)}/></Field>
        <Field label="NOI año 1 (€)"><input type="number" style={inpStyle} value={noi1} onChange={e => setNoi1(+e.target.value)}/></Field>
        <Field label="Crecimiento NOI (%)"><input type="number" step="0.1" style={inpStyle} value={growth} onChange={e => setGrowth(+e.target.value)}/></Field>
        <Field label="Exit Cap Rate (%)"><input type="number" step="0.25" style={inpStyle} value={exitCap} onChange={e => setExitCap(+e.target.value)}/></Field>
        <Field label="Hold (años)"><input type="number" min="3" max="15" style={inpStyle} value={hold} onChange={e => setHold(+e.target.value)}/></Field>
        <Field label="LTV (%, 0=sin deuda)"><input type="number" min="0" max="80" style={inpStyle} value={ltv} onChange={e => setLtv(+e.target.value)}/></Field>
        <Field label="Tipo deuda (%)"><input type="number" step="0.1" style={inpStyle} value={debtRate} onChange={e => setDebtRate(+e.target.value)}/></Field>
        <Field label="Tasa descuento NPV (%)"><input type="number" step="0.5" style={inpStyle} value={discRate} onChange={e => setDiscRate(+e.target.value)}/></Field>
      </div>

      {result && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:8, marginBottom:12 }}>
            <Result primary label="IRR Unleveraged" value={`${result.irrUnlev.toFixed(1)}%`}/>
            <Result primary label="IRR Leveraged" value={`${result.irrLev.toFixed(1)}%`}/>
            <Result label="Equity Multiple (Lev.)" value={`${result.em.toFixed(2)}x`}/>
            <Result label="NPV (a tasa descuento)" value={`${result.npvVal >= 0 ? '+' : ''}€${fmtM(result.npvVal)}`}/>
            <Result label="Precio Salida (Exit)" value={`€${fmtM(result.exitValue)}`}/>
            <Result label="Equity invertido" value={`€${fmtM(result.equity)}`}/>
          </div>
          <div style={{ padding:'10px 12px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:5, fontSize:12, color:'var(--accent)', lineHeight:1.5 }}>
            {result.irrUnlev < 6 ? `IRR Unlev ${result.irrUnlev.toFixed(1)}% — Por debajo del umbral Core (6-9%). Revisa precio o exit cap rate.`
              : result.irrUnlev < 9 ? `IRR Unlev ${result.irrUnlev.toFixed(1)}% — Rango Core (6-9%). Adecuado para pensiones y estrategias conservadoras.`
              : result.irrUnlev < 13 ? `IRR Unlev ${result.irrUnlev.toFixed(1)}% — Rango Core+/Value-Add.`
              : `IRR Unlev ${result.irrUnlev.toFixed(1)}% — Alta rentabilidad. Verifica los supuestos (exit cap, crecimiento).`}
            {ltv > 0 && <> · IRR Leveraged {result.irrLev.toFixed(1)}% con LTV {ltv}% · EM {result.em.toFixed(2)}x</>}
            {' · NPV '}{result.npvVal >= 0 ? `positivo €${fmtM(result.npvVal)} → inversión crea valor` : `negativo €${fmtM(result.npvVal)} → no alcanza la tasa requerida`}
          </div>
        </>
      )}
    </div>
  )
}

// WAULT
function CalcWault() {
  const [rows, setRows] = useState([
    { name:'Amazon',        rent: 600000, area: 15000, years: 8.5 },
    { name:'DHL',           rent: 300000, area: 8000,  years: 4.0 },
    { name:'Empresa local', rent: 100000, area: 3000,  years: 1.5 },
  ])
  const updateRow = (i, k, v) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  const removeRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i))
  const addRow    = ()  => setRows(prev => [...prev, { name:'', rent:0, area:0, years:0 }])

  let totalRent = 0, totalArea = 0, weightedRent = 0, weightedArea = 0
  rows.forEach(r => {
    if (r.rent > 0 && r.years > 0) { totalRent += +r.rent; weightedRent += r.rent * r.years }
    if (r.area > 0 && r.years > 0) { totalArea += +r.area; weightedArea += r.area * r.years }
  })
  const waultIncome = totalRent > 0 ? weightedRent / totalRent : 0
  const waultArea   = totalArea > 0 ? weightedArea / totalArea : 0

  const interp = waultIncome >= 8 ? `WAULT ${waultIncome.toFixed(1)} años — Premium. Activo tipo bono inmobiliario.`
    : waultIncome >= 6 ? `WAULT ${waultIncome.toFixed(1)} años — Bueno. Por encima del estándar (5-7Y). Apetito inversor alto.`
    : waultIncome >= 4 ? `WAULT ${waultIncome.toFixed(1)} años — Estándar. Riesgo de renovación visible. Ligera prima sobre prime.`
    : waultIncome >= 2 ? `WAULT ${waultIncome.toFixed(1)} años — Corto. Riesgo de vacante inminente.`
    : `WAULT ${waultIncome.toFixed(1)} años — Muy corto. Alta incertidumbre. Solo apetito value-add.`

  return (
    <div style={{ padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6 }}>
      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10 }}>
        Introduce los datos de cada inquilino. La fecha de referencia es hoy.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 28px', gap:6, marginBottom:6 }}>
        {['Inquilino','Renta €/año','Área m²','Años restantes',''].map((h, i) => (
          <div key={i} style={{ fontSize:9, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</div>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 28px', gap:6, marginBottom:6, alignItems:'center' }}>
          <input style={{ ...inpStyle, fontFamily:'inherit' }} value={r.name} onChange={e => updateRow(i, 'name', e.target.value)} placeholder="Nombre"/>
          <input type="number" style={inpStyle} value={r.rent} onChange={e => updateRow(i, 'rent', +e.target.value)}/>
          <input type="number" style={inpStyle} value={r.area} onChange={e => updateRow(i, 'area', +e.target.value)}/>
          <input type="number" step="0.1" style={inpStyle} value={r.years} onChange={e => updateRow(i, 'years', +e.target.value)}/>
          <button onClick={() => removeRow(i)} style={{ width:24, height:24, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', cursor:'pointer', fontSize:12, color:'var(--red, #dc2626)' }}>×</button>
        </div>
      ))}
      <button onClick={addRow} style={{ padding:'6px 12px', fontSize:11, border:'1px dashed var(--border)', borderRadius:5, background:'transparent', color:'var(--text3)', cursor:'pointer', fontFamily:'inherit', marginBottom:14 }}>
        + Añadir inquilino
      </button>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:8, marginBottom:12 }}>
        <Result primary label="WAULT por Renta" value={`${waultIncome.toFixed(2)} años`} sub="Income-weighted (principal)"/>
        <Result label="WAULT por Área" value={waultArea > 0 ? `${waultArea.toFixed(2)} años` : '—'}/>
        <Result label="Renta total" value={totalRent > 0 ? `€${fmtM(totalRent)}` : '—'}/>
        <Result label="Área total" value={totalArea > 0 ? `${totalArea.toLocaleString('es-ES')} m²` : '—'}/>
      </div>
      {totalRent > 0 && (
        <div style={{ padding:'10px 12px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:5, fontSize:12, color:'var(--accent)', lineHeight:1.5 }}>
          {interp}
        </div>
      )}
    </div>
  )
}

// Debt sizing
function CalcDebt() {
  const [value, setValue]       = useState(20000000)
  const [ltv, setLtv]           = useState(55)
  const [rate, setRate]         = useState(4.5)
  const [term, setTerm]         = useState(7)
  const [amortYears, setAmort]  = useState(0)
  const [noi, setNoi]           = useState(1000000)

  const loan = value * (ltv / 100)
  const annualInterest = loan * (rate / 100)
  const annualAmort = amortYears > 0 ? loan / amortYears : 0
  const annualService = annualInterest + annualAmort
  const dscr = annualService > 0 ? noi / annualService : 9999
  const icr  = annualInterest > 0 ? noi / annualInterest : 9999

  const interp = dscr >= 2.0 ? `DSCR ${dscr.toFixed(2)}x — Muy cómodo. Margen amplio ante caídas de NOI.`
    : dscr >= 1.5 ? `DSCR ${dscr.toFixed(2)}x — Bueno. Por encima del mínimo bancario estándar (1.25x).`
    : dscr >= 1.25 ? `DSCR ${dscr.toFixed(2)}x — En el límite mínimo bancario. Riesgo de breach ante caídas de NOI.`
    : dscr >= 1.0 ? `DSCR ${dscr.toFixed(2)}x — Por debajo del mínimo bancario (1.25x). Los bancos no financiarán en estas condiciones.`
    : `DSCR ${dscr.toFixed(2)}x — El NOI no cubre el servicio de deuda. No financiable.`

  return (
    <div style={{ padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:14 }}>
        <Field label="Valor del activo (€)"><input type="number" style={inpStyle} value={value} onChange={e => setValue(+e.target.value)}/></Field>
        <Field label="LTV solicitado (%)"><input type="number" step="5" style={inpStyle} value={ltv} onChange={e => setLtv(+e.target.value)}/></Field>
        <Field label="Tipo interés anual (%)"><input type="number" step="0.1" style={inpStyle} value={rate} onChange={e => setRate(+e.target.value)}/></Field>
        <Field label="Plazo (años)"><input type="number" min="1" max="30" style={inpStyle} value={term} onChange={e => setTerm(+e.target.value)}/></Field>
        <Field label="Amortización (años, 0=bullet)"><input type="number" style={inpStyle} value={amortYears} onChange={e => setAmort(+e.target.value)}/></Field>
        <Field label="NOI activo (€)"><input type="number" style={inpStyle} value={noi} onChange={e => setNoi(+e.target.value)}/></Field>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:8, marginBottom:12 }}>
        <Result primary label="Importe préstamo" value={`€${fmtM(loan)}`}/>
        <Result label="Intereses anuales" value={`€${fmtM(annualInterest)}`}/>
        <Result label="Amortización anual" value={amortYears > 0 ? `€${fmtM(annualAmort)}` : 'Bullet'}/>
        <Result label="Servicio deuda total" value={`€${fmtM(annualService)}`}/>
        <Result primary label="DSCR" value={`${dscr.toFixed(2)}x`} sub="Mínimo bancario: 1.25x"/>
        <Result label="ICR (solo intereses)" value={`${icr.toFixed(2)}x`}/>
      </div>
      <div style={{ padding:'10px 12px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:5, fontSize:12, color:'var(--accent)', lineHeight:1.5 }}>
        {interp} · Equity requerido: €{fmtM(value - loan)} ({(100-ltv)}% del precio).
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// GLOSARIO
// ═══════════════════════════════════════════════════════════════════
function GlosarioTab() {
  const [filter, setFilter] = useState('')
  const items = useMemo(() => {
    const f = filter.toLowerCase().trim()
    if (!f) return GLOSARIO
    return GLOSARIO.filter(([en, es, def]) =>
      en.toLowerCase().includes(f) || es.toLowerCase().includes(f) || def.toLowerCase().includes(f)
    )
  }, [filter])
  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filtrar por término o definición..."
        style={{ width:'100%', maxWidth:420, padding:'8px 12px', fontSize:13, border:'1px solid var(--border)', borderRadius:5, background:'var(--surface)', boxSizing:'border-box', outline:'none', fontFamily:'inherit', marginBottom:14 }}
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:10 }}>
        {items.map(([en, es, def], i) => (
          <div key={i} style={{ padding:'10px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:5 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)' }}>{en}</div>
            <div style={{ fontSize:10, color:'var(--text4)', fontFamily:'var(--mono)', marginTop:1 }}>{es}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:5, lineHeight:1.5 }}>{def}</div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ padding:'24px 12px', textAlign:'center', color:'var(--text4)', fontSize:12 }}>
            Sin resultados para "{filter}".
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TESTS · lista + runner
// ═══════════════════════════════════════════════════════════════════
function TestsLista({ progress, onAbrir }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
      {MODULOS.map(m => {
        const qs = QUIZZES[m.id]
        if (!qs) return (
          <div key={m.id} style={{ padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, opacity:.55 }}>
            <div style={{ fontSize:13, fontWeight:700 }}>{m.titulo}</div>
            <div style={{ fontSize:11, color:'var(--text4)', marginTop:5, fontStyle:'italic' }}>Test no disponible aún</div>
          </div>
        )
        const score = progress.quizScores?.[m.id]
        return (
          <div key={m.id} onClick={() => onAbrir(m.id)}
            style={{ padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'.05em' }}>
              Módulo {m.id.replace('m','')}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginTop:3 }}>{m.titulo}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:5 }}>{qs.length} preguntas</div>
            <div style={{ fontSize:11, marginTop:6 }}>
              {score != null
                ? <>Mejor puntuación: <strong style={{ color:'var(--green)' }}>{score}/{qs.length}</strong></>
                : <span style={{ color:'var(--text4)' }}>Sin intentar todavía</span>
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TestRunner({ modId, progress, setProgress, onVolver }) {
  const mod = MODULOS.find(m => m.id === modId)
  const qs  = QUIZZES[modId] || []
  const [idx, setIdx]           = useState(0)
  const [selected, setSelected] = useState(-1)
  const [answered, setAnswered] = useState(false)
  const [score, setScore]       = useState(0)
  const [finalized, setFin]     = useState(false)

  if (qs.length === 0) {
    return <div style={{ padding:'24px', color:'var(--text4)', fontSize:12 }}>Sin test para este módulo.</div>
  }

  if (finalized) {
    const pct = Math.round(score / qs.length * 100)
    const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red, #dc2626)'
    const msg = pct >= 80 ? 'Excelente — nivel analista'
      : pct >= 60 ? 'Bien — sigue repasando'
      : 'Necesitas más práctica'
    return (
      <div style={{ maxWidth:520 }}>
        <div style={{ padding:'24px 22px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, textAlign:'center' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, border:`3px solid ${color}`, color }}>
            {score}/{qs.length}
          </div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{msg}</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>{pct}% correcto · {mod.titulo}</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            <button onClick={() => { setIdx(0); setSelected(-1); setAnswered(false); setScore(0); setFin(false) }}
              style={{ padding:'8px 18px', fontSize:12, fontWeight:700, border:'none', borderRadius:5, background:'var(--accent)', color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
              Repetir test
            </button>
            <button onClick={onVolver}
              style={{ padding:'8px 18px', fontSize:12, fontWeight:600, border:'1px solid var(--border)', borderRadius:5, background:'var(--surface)', color:'var(--text2)', cursor:'pointer', fontFamily:'inherit' }}>
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  const q = qs[idx]
  const letters = ['A','B','C','D','E']
  const pctBar = ((idx) / qs.length * 100).toFixed(0)

  const check = () => {
    if (selected < 0) return
    setAnswered(true)
    if (selected === q.c) setScore(s => s + 1)
  }
  const next = () => {
    if (idx < qs.length - 1) { setIdx(idx + 1); setSelected(-1); setAnswered(false) }
    else {
      const finalScore = score + (selected === q.c && answered ? 0 : 0)  // ya sumado
      setProgress(p => {
        const old = p.quizScores?.[modId]
        return {
          ...p,
          quizScores: { ...(p.quizScores || {}), [modId]: old != null ? Math.max(old, score) : score }
        }
      })
      setFin(true)
    }
  }

  return (
    <div style={{ maxWidth:680 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <button onClick={onVolver} style={{ padding:'5px 12px', fontSize:11, border:'1px solid var(--border)', borderRadius:5, background:'var(--surface)', cursor:'pointer', fontFamily:'inherit', color:'var(--text2)' }}>
          ← Tests
        </button>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'.05em' }}>
          {mod.titulo}
        </div>
      </div>

      <div style={{ height:4, background:'var(--border)', borderRadius:2, marginBottom:18, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pctBar}%`, background:'var(--accent)', transition:'width .3s' }}/>
      </div>

      <div style={{ fontSize:10, fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>
        Pregunta {idx + 1} de {qs.length} · Puntuación: {score}
      </div>
      <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:16, lineHeight:1.4 }}>{q.q}</div>

      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
        {q.opts.map((opt, i) => {
          let bg = 'var(--surface)', bd = 'var(--border)', col = 'var(--text2)'
          if (answered) {
            if (i === q.c) { bg = 'var(--green-lt)'; bd = 'var(--green-bd)'; col = 'var(--green)' }
            else if (i === selected) { bg = '#fee2e2'; bd = '#fca5a5'; col = 'var(--red, #dc2626)' }
          } else if (i === selected) { bg = 'var(--accent-lt)'; bd = 'var(--accent)'; col = 'var(--accent)' }
          return (
            <div key={i} onClick={() => !answered && setSelected(i)}
              style={{ padding:'10px 13px', background: bg, border:`1px solid ${bd}`, borderRadius:5, cursor: answered ? 'default' : 'pointer', display:'flex', gap:10, alignItems:'flex-start', fontSize:13, color: col }}>
              <div style={{ width:20, height:20, borderRadius:3, background:'var(--gray-lt,#f4f4f5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--text3)', flexShrink:0 }}>{letters[i]}</div>
              <div>{opt}</div>
            </div>
          )
        })}
      </div>

      {answered && (
        <div style={{ padding:'12px 14px', background:'var(--accent-lt)', border:'1px solid var(--accent-bd)', borderRadius:5, fontSize:12, color:'var(--accent)', lineHeight:1.55, marginBottom:14 }}>
          <strong>Explicación:</strong> {q.e}
        </div>
      )}

      <div style={{ display:'flex', gap:8 }}>
        {!answered
          ? <button onClick={check} disabled={selected < 0}
              style={{ padding:'9px 20px', fontSize:13, fontWeight:700, border:'none', borderRadius:5, background: selected < 0 ? 'var(--gray-lt,#f4f4f5)' : 'var(--accent)', color: selected < 0 ? 'var(--text4)' : '#fff', cursor: selected < 0 ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
              Comprobar
            </button>
          : <button onClick={next}
              style={{ padding:'9px 20px', fontSize:13, fontWeight:700, border:'none', borderRadius:5, background:'var(--accent)', color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
              {idx < qs.length - 1 ? 'Siguiente →' : 'Ver resultado →'}
            </button>
        }
      </div>
    </div>
  )
}
