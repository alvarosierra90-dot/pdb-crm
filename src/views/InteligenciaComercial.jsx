import { useState, useRef, useEffect } from 'react'

const SUGERENCIAS = [
  { cat: 'Demanda', preguntas: [
    '¿Cuántas demandas activas hay y cuáles son las más grandes?',
    '¿Qué demandas llevan más tiempo sin actividad?',
    'Resume las demandas activas por zona',
  ]},
  { cat: 'Activos', preguntas: [
    '¿Qué activos tienen mayor superficie disponible?',
    '¿Cuál es la ocupación media del portfolio?',
    'Lista los activos en comercialización con más días',
  ]},
  { cat: 'Pipeline', preguntas: [
    '¿Cuál es el estado actual de las negociaciones?',
    '¿Qué negociaciones tienen el cierre más próximo?',
    'Muéstrame el pipeline por equipo',
  ]},
  { cat: 'Inteligencia', preguntas: [
    '¿Qué zonas tienen más demanda activa?',
    'Sugiere activos para Grupo Mediática España',
    '¿Qué mandatos están próximos a vencer?',
    '¿Qué clientes tienen más actividad este mes?',
    '¿Qué edificios están obsoletos o son susceptibles de rehabilitación?',
  ]},
]

const AI_RESPONSES = {
  demanda: `**Demanda activa — resumen PDB**

Actualmente hay **11 demandas activas** en el sistema. Las más relevantes por superficie:

| Cuenta | Sup. buscada | Estado |
|--------|-------------|--------|
| Grupo Mediática España | 13.000–18.000 m² | En curso |
| Flexwork Solutions Spain SL | 800–6.000 m² | En curso |
| Hospitality Group Iberia SL | 2.000–6.000 m² | En curso |
| Grupo Empresarial Altamira SL | 2.200–3.000 m² | En curso |

La superficie media buscada es **2.800 m²**. El **100%** de las demandas activas son de alquiler. Origen más frecuente: Web Savills (2) e IDEALISTA (1).

> 💡 **Insight:** Hay una oportunidad clara en la zona A-1/Alcobendas — 2 demandas activas sin activo asignado.`,

  activo: `**Activos disponibles — análisis PDB**

Portfolio actual: **8 activos**, superficie total: **213.000 m²** aprox.

Los activos con mayor disponibilidad:

| Activo | Disponible | Zona | Días comerc. |
|--------|-----------|------|-------------|
| Albatros Edif. D | ~13.486 m² (25%) | A-1 · Alcobendas | 127d |
| P.E Avalon | ~10.124 m² (21.6%) | M-30 · Madrid | 127d |
| Torre Europa Valencia | ~1.292 m² (17%) | Mestalla · Valencia | 62d |
| Parque Empresarial Norte | ~2.352 m² (21%) | M-30 · Madrid | 34d |

Ocupación media del portfolio: **86,1%**

> ⚠️ **Alerta:** Albatros y Avalon llevan más de 120 días en comercialización. Considera revisar la estrategia de precios.`,

  pipeline: `**Pipeline de negociaciones — estado actual**

Hay **4 negociaciones activas** en el PDB:

| Ref. | Contraparte | Activo | Estado | Cierre est. |
|------|------------|--------|--------|------------|
| NEG-0044 | Empresa XYZ | Avalon P5 · 1.000 m² | ↔ En negociación | 30/03/2026 ⚠️ |
| NEG-0041 | Oracle Spain SL | Albatros D · 13.486 m² | ⏳ Pdte. respuesta | 30/04/2026 |
| NEG-0039 | Generali Real Estate | Avalon P5 · 1.500 m² | ✓ Acuerdo | 15/04/2026 |
| NEG-0037 | Pharma Group Spain | Diagonal 95 P3 · 820 m² | ↔ En negociación | 15/05/2026 |

Renta potencial total: **2,02 M€/año**

> 💡 **Insight:** NEG-0044 tiene el cierre vencido. Acción recomendada: contactar a Sierra Álvaro para actualizar fecha o escalar.`,

  zona: `**Análisis de demanda por zona — PDB**

Las zonas con mayor actividad de demanda activa:

| Zona | Demandas | Sup. total buscada |
|------|---------|-------------------|
| M-30 (Madrid) | 4 | ~20.000–27.000 m² |
| A-1 / Alcobendas | 2 | ~2.400–9.300 m² |
| 22@ (Barcelona) | 0 | — |
| Mestalla (Valencia) | 0 | — |

**Tendencias identificadas:**
- Zona M-30 concentra el 40% de las demandas activas
- Creciente demanda de espacios flexibles (Estándar/Flexible)
- Perfil predominante: expansión/crecimiento (73% de las demandas)

> 💡 **Oportunidad:** Sin demanda activa en 22@ pese a tener dos activos allí (Torre Glòries, Diagonal 95). Considera generar prospección activa en Barcelona.`,

  mandato: `**Mandatos — alertas de vencimiento**

De los **6 mandatos** activos en el PDB:

| ID | Mandato | Vencimiento | Días rest. | Estado |
|----|---------|------------|-----------|--------|
| MAN-2506 | Torre Europa Valencia | 31/03/2025 | -6d | 🔴 Vencido |
| MAN-2505 | Parque Empresarial Norte | 30/04/2026 | 24d | 🔴 Alerta |
| MAN-2501 | P.E Avalon P4-P5 | 28/02/2026 | 55d | 🟡 Revisar |
| MAN-2502 | Albatros Edif. D | 30/06/2026 | 85d | 🟡 Revisar |

> ⚠️ **Acción urgente:** MAN-2505 (Parque Empresarial Norte) vence en 24 días. GOMEZ Ignacio debe contactar a FREO Investments para renovar o notificar el preaviso.`,

  cliente: `**Actividad por cliente — últimos 30 días**

Los clientes con más actividad reciente en el PDB:

| Cuenta | Actividades | Tipo más frecuente | Última actividad |
|--------|------------|-------------------|-----------------|
| Oracle Spain SL | 3 | Email | 28/03/2026 |
| Generali Real Estate | 2 | Llamada / Email | 29/03/2026 |
| Grupo Mediática España | 2 | Reunión / Llamada | 15/01/2026 |
| ISDE | 2 | Reunión / Email | 08/10/2025 |

> 💡 **Insight:** Grupo Mediática España lleva más de **2 meses sin actividad registrada**. Recomendamos programar un seguimiento para mantener el pipeline activo.`,

  mediatica: `**Análisis: Grupo Mediática España — activos sugeridos**

Demanda activa: **13.000–18.000 m²** · Tipo: Estándar · Zona: Madrid preferente

Activos del PDB que encajan:

| Activo | Disponible | Zona | Precio zona |
|--------|-----------|------|------------|
| P.E Avalon | ~10.124 m² | M-30 | 10,5 €/m²/mes |
| Albatros Edif. D | ~13.486 m² ✅ | A-1 | 12,5 €/m²/mes |
| Parque Empresarial Norte | ~2.352 m² | M-30 | 16,8 €/m²/mes |

**Mejor match:** Albatros Edif. D — cubre la superficie buscada completa y está en zona norte, compatible con los criterios de Grupo Mediática.

> ⚠️ **Nota:** Para cubrir el mínimo (13.000 m²) con un solo activo, Albatros D es la única opción en portfolio. Considera combinar plantas de Avalon si es flexible.`,

  obsoleto: `**Activos con potencial de rehabilitación o reposicionamiento**

Análisis basado en año de última rehabilitación, estado del edificio y posición de mercado:

| Activo | Ubicación | Uso | Última rehab. | Estado | Riesgo obsolescencia |
|--------|-----------|-----|--------------|--------|---------------------|
| P.E Avalon — Edif. B | Madrid · M-30 | Oficinas | 2003 (sin rehab.) | Aceptable | 🔴 Alto |
| Parque Empresarial Norte | Madrid · Periferia | Oficinas | 2001 | Desgastado | 🔴 Alto |
| Torre Europa Valencia | Valencia · Mestalla | Oficinas | 2007 | Aceptable | 🟡 Medio |
| Logístico Guadalajara | Guadalajara · A-2 | Logístico | 2008 | Funcional | 🟡 Medio |
| Albatros — Edif. D | Madrid · A-1 | Oficinas | 2005 (rehab. 2019) | Bueno | 🟢 Bajo |

**Criterios aplicados:**
- Sin rehabilitación en los últimos 10 años
- Calificación de estado inferior a "Bueno"
- Rentas por debajo de la media de zona

**Oportunidades detectadas:**
- **P.E Avalon Edif. B** — candidato prioritario para captación de mandato de rehabilitación integral
- **Parque Empresarial Norte** — reposicionamiento como flex/coworking viable dado su estado y ubicación

> 💡 **Acción recomendada:** Contactar a los propietarios de los activos con riesgo alto para proponer una valoración actualizada y explorar mandatos de rehabilitación o venta oportunista.`,

  default: (msg) => `**Análisis PDB — respuesta IA**

He analizado tu consulta: *"${msg}"*

Basándome en los datos actuales del PDB:

- **11 demandas activas** con superficie media buscada de 2.800 m²
- **8 activos** en portfolio, ocupación media **86,1%**
- **4 negociaciones** en curso con renta potencial de **2,02 M€/año**
- **6 mandatos** activos, 1 vencido y 1 en alerta

Para consultas más específicas, puedes preguntarme sobre demandas, activos disponibles, pipeline de negociaciones, mandatos, zonas o clientes concretos.

> 💡 Prueba: *"¿Qué activos tienen mayor disponibilidad?"* o *"Sugiere activos para Grupo Mediática España"*`,
}

function getResponse(msg) {
  const m = msg.toLowerCase()
  if (m.includes('demanda')) return AI_RESPONSES.demanda
  if (m.includes('activo') || m.includes('disponib') || m.includes('ocupaci')) return AI_RESPONSES.activo
  if (m.includes('negoci') || m.includes('pipeline') || m.includes('cierre')) return AI_RESPONSES.pipeline
  if (m.includes('zona') || m.includes('tendencia') || m.includes('barcelona') || m.includes('madrid')) return AI_RESPONSES.zona
  if (m.includes('mandato') || m.includes('vencimi')) return AI_RESPONSES.mandato
  if (m.includes('obsolet') || m.includes('rehabilit') || m.includes('reposicion')) return AI_RESPONSES.obsoleto
  if (m.includes('cliente') || m.includes('cuenta') || m.includes('actividad')) return AI_RESPONSES.cliente
  if (m.includes('mediática') || m.includes('mediatica') || m.includes('sugiere') || m.includes('recomiend')) return AI_RESPONSES.mediatica
  return AI_RESPONSES.default(msg)
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2,-2)}</strong>
      : p
  )
}

function hasTable(text) { return text.includes('| ') }

function MsgContent({ text }) {
  if (!hasTable(text)) {
    return (
      <div style={{fontSize:12,lineHeight:1.7}}>
        {text.split('\n').map((line, i) => {
          if (line.startsWith('**') && line.endsWith('**') && !line.slice(2,-2).includes('**'))
            return <div key={i} style={{fontWeight:700,fontSize:13,marginBottom:4}}>{line.slice(2,-2)}</div>
          if (line.startsWith('> '))
            return <div key={i} style={{borderLeft:'3px solid var(--accent)',paddingLeft:10,margin:'8px 0',color:'var(--text2)',fontSize:11}}>{renderInline(line.slice(2))}</div>
          if (line === '') return <div key={i} style={{height:6}}/>
          return <div key={i} style={{fontSize:12,lineHeight:1.6,marginBottom:2}}>{renderInline(line)}</div>
        })}
      </div>
    )
  }
  const blocks = []
  let tableLines = []
  let inTable = false
  text.split('\n').forEach(line => {
    if (line.startsWith('| ')) {
      if (!inTable) { inTable = true; tableLines = [] }
      tableLines.push(line)
    } else {
      if (inTable) { blocks.push({ type:'table', lines: tableLines }); tableLines = []; inTable = false }
      blocks.push({ type:'line', content: line })
    }
  })
  if (inTable) blocks.push({ type:'table', lines: tableLines })

  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === 'table') {
          return (
            <div key={i} style={{overflowX:'auto',margin:'8px 0'}}>
              <table style={{width:'100%',borderCollapse:'collapse',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
                <tbody>{b.lines.map((l, j) => {
                  const cells = l.split('|').slice(1,-1).map(c=>c.trim())
                  if (l.match(/^\|[-| ]+\|$/)) return null
                  return (
                    <tr key={j}>
                      {cells.map((c, k) => (
                        j === 0
                          ? <th key={k} style={{padding:'5px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)'}}>{c}</th>
                          : <td key={k} style={{padding:'5px 10px',fontSize:11,borderBottom:'1px solid var(--border)'}}>{renderInline(c)}</td>
                      ))}
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )
        }
        const line = b.content
        if (line.startsWith('**') && line.endsWith('**') && !line.slice(2,-2).includes('**'))
          return <div key={i} style={{fontWeight:700,fontSize:13,marginBottom:4,marginTop:i>0?8:0}}>{line.slice(2,-2)}</div>
        if (line.startsWith('> '))
          return <div key={i} style={{borderLeft:'3px solid var(--accent)',paddingLeft:10,margin:'8px 0',color:'var(--text2)',fontSize:11}}>{renderInline(line.slice(2))}</div>
        if (line === '') return <div key={i} style={{height:4}}/>
        return <div key={i} style={{fontSize:12,lineHeight:1.6,marginBottom:2}}>{renderInline(line)}</div>
      })}
    </div>
  )
}

export default function InteligenciaComercial() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [catOpen, setCatOpen] = useState('Demanda')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  function sendMsg(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role:'user', text: msg }])
    setLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { role:'ai', text: getResponse(msg) }])
      setLoading(false)
    }, 900 + Math.random() * 600)
  }

  return (
    <div style={{display:'flex',flex:1,overflow:'hidden',background:'var(--bg)'}}>

      {/* Sidebar */}
      <div style={{width:240,flexShrink:0,borderRight:'1px solid var(--border)',background:'var(--surface)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text)'}}>Inteligencia Comercial</div>
          <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>Análisis IA sobre datos PDB</div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
          {SUGERENCIAS.map(s=>(
            <div key={s.cat}>
              <div
                onClick={()=>setCatOpen(catOpen===s.cat?null:s.cat)}
                style={{padding:'6px 14px',fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',userSelect:'none'}}
              >
                {s.cat}
                <span style={{fontSize:9,color:'var(--text4)'}}>{catOpen===s.cat?'▲':'▼'}</span>
              </div>
              {catOpen===s.cat && s.preguntas.map(p=>(
                <div
                  key={p}
                  onClick={()=>sendMsg(p)}
                  style={{padding:'6px 14px 6px 20px',fontSize:11,color:'var(--text2)',cursor:'pointer',lineHeight:1.4,transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--gray-lt)'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}
                >
                  {p}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding:12,borderTop:'1px solid var(--border)',flexShrink:0}}>
          <button
            onClick={()=>setMessages([])}
            style={{width:'100%',padding:'6px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'#fff',fontSize:11,cursor:'pointer',color:'var(--text3)',fontFamily:'inherit'}}
          >
            + Nueva conversación
          </button>
        </div>
      </div>

      {/* Chat principal */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {messages.length === 0 && !loading && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,gap:24}}>
            <div style={{textAlign:'center'}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 14px'}}>✦</div>
              <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>Inteligencia Comercial</div>
              <div style={{fontSize:13,color:'var(--text3)',maxWidth:400,lineHeight:1.6}}>
                Consulta sobre demandas, activos, pipeline, mandatos y actividad comercial usando lenguaje natural.
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,maxWidth:560,width:'100%'}}>
              {[
                '¿Cuántas demandas activas hay?',
                '¿Qué activos tienen mayor disponibilidad?',
                'Muéstrame el estado del pipeline',
                'Sugiere activos para Grupo Mediática España',
              ].map(q=>(
                <button
                  key={q}
                  onClick={()=>sendMsg(q)}
                  style={{padding:'10px 14px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',fontSize:11,cursor:'pointer',textAlign:'left',color:'var(--text2)',fontFamily:'inherit',lineHeight:1.4,transition:'border-color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {(messages.length > 0 || loading) && (
          <div style={{flex:1,overflowY:'auto',padding:'20px 0'}}>
            {messages.map((m,i)=>(
              <div key={i} style={{maxWidth:780,margin:'0 auto',padding:'0 24px',marginBottom:20}}>
                {m.role === 'user' ? (
                  <div style={{display:'flex',justifyContent:'flex-end'}}>
                    <div style={{background:'var(--accent)',color:'#fff',borderRadius:12,borderBottomRightRadius:3,padding:'10px 16px',maxWidth:'75%',fontSize:13,lineHeight:1.5}}>
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,marginTop:2}}>✦</div>
                    <div style={{flex:1,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,borderTopLeftRadius:3,padding:'12px 16px'}}>
                      <MsgContent text={m.text}/>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{maxWidth:780,margin:'0 auto',padding:'0 24px',marginBottom:20}}>
                <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>✦</div>
                  <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,borderTopLeftRadius:3,padding:'12px 16px',display:'flex',gap:5,alignItems:'center'}}>
                    {[0,1,2].map(j=>(
                      <div key={j} style={{width:7,height:7,borderRadius:'50%',background:'var(--accent)',opacity:.7,animation:`pulse 1.2s ease-in-out ${j*0.2}s infinite`}}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
        )}

        <div style={{padding:'12px 24px',borderTop:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
          <div style={{maxWidth:780,margin:'0 auto',display:'flex',gap:8}}>
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg()}
              placeholder="Pregunta sobre demandas, activos, pipeline, zonas..."
              style={{flex:1,padding:'10px 14px',border:'1px solid var(--border2)',borderRadius:'var(--r)',fontSize:13,fontFamily:'inherit',outline:'none',background:'#fff'}}
            />
            <button
              onClick={()=>sendMsg()}
              disabled={!input.trim()||loading}
              style={{padding:'10px 20px',borderRadius:'var(--r)',border:'none',background:input.trim()&&!loading?'var(--accent)':'var(--border)',color:input.trim()&&!loading?'#fff':'var(--text4)',fontWeight:600,fontSize:13,cursor:input.trim()&&!loading?'pointer':'default',fontFamily:'inherit',transition:'background .15s'}}
            >
              Enviar
            </button>
          </div>
          <div style={{maxWidth:780,margin:'6px auto 0',fontSize:10,color:'var(--text4)',textAlign:'center'}}>
            IA analiza datos del PDB en tiempo real · Respuestas basadas en datos mock
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: .3; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
