// Contenido de la herramienta "Formación interna · Capital Markets"
// La maquetación se rehace en React con el canon PDB; aquí solo datos.
//
// Estructura: cada concepto tiene `tabs` o `bloques`. Los bloques son tipados:
//   { t:'p',      x }                                        párrafo (admite <strong>, <em>)
//   { t:'info',   v:'tip|warning|insight|law', icon, x }     caja informativa
//   { t:'tabla',  cols:[], rows:[[c1,c2,...]] }              tabla comparativa
//   { t:'formula', label, main, sub }                         fórmula destacada
//   { t:'ejemplo', titulo, pasos:[{num,texto}], resultado }   ejemplo paso a paso
//   { t:'related', terms:[] }                                 chips de términos relacionados
//   { t:'spectrum', bands:[{nombre,irr,lev}] }                espectro 4-bandas (Core→Opor.)
//   { t:'cycle',  steps:[{icon,label,activo}] }               ciclo de pasos

export const CALCULADORAS = [
  { id: 'caprate', titulo: 'Cap Rate / NIY',  sub: 'Tasa de capitalización · Valoración por yield' },
  { id: 'dcf',     titulo: 'DCF / IRR / TIR', sub: 'Modelo 10Y con/sin apalancamiento' },
  { id: 'wault',   titulo: 'WAULT',           sub: 'Duración media ponderada por renta y área' },
  { id: 'debt',    titulo: 'Debt sizing',     sub: 'Importe préstamo · DSCR · ICR' },
]

// ═══════════════════════════════════════════════════════════════════
// MÓDULOS — contenido completo
// ═══════════════════════════════════════════════════════════════════
export const MODULOS = [

// ─────────────────────────────────────────────────────────────────
// MÓDULO 1 · Fundamentos
// ─────────────────────────────────────────────────────────────────
{
  id: 'm1',
  titulo: 'Fundamentos de Mercados de Capitales',
  descripcion: 'Tu puente entre el leasing y el Capital Markets. Qué se compra y vende, quién, por qué y cómo se valora.',
  nivel: 'Básico',
  tags: ['Yield','Fondos','SOCIMIs'],
  conceptos: [
    {
      num:'1.1', titulo:'Capital Markets vs. Leasing', sub:'Dos mundos · Lenguajes distintos · Mismos activos',
      tabs: [
        { id:'def', label:'Definición', bloques: [
          { t:'p', x:'<strong>Capital Markets</strong> en real estate se refiere a la compraventa de activos o portfolios inmobiliarios como productos de inversión. El activo deja de ser un espacio físico y pasa a ser un <em>generador de flujos de caja</em> valorable por sus rendimientos (NOI, IRR, Cap Rate).' },
          { t:'p', x:'A diferencia del leasing (objetivo: comercializar m²), en Capital Markets el cliente es el <em>inversor</em>, el producto es el <em>activo como instrumento financiero</em> y el lenguaje es el de la <em>rentabilidad y el riesgo</em>.' },
        ]},
        { id:'comp', label:'Comparativa', bloques: [
          { t:'tabla', cols:['Dimensión','Leasing / Agencia','Capital Markets'], rows:[
            ['Cliente','Inquilino / Propietario','<strong>Inversor</strong>'],
            ['Producto','Metros cuadrados / espacio','<strong>Activo como instrumento financiero</strong>'],
            ['KPI principal','Renta €/m²/año; ocupación','<strong>Cap Rate; IRR; Equity Multiple</strong>'],
            ['Temporalidad','Operacional (corto/medio)','<strong>Inversión (3-10 años hold)</strong>'],
            ['Tickets','Renta anual €200K-€3M','<strong>Precio €5M-€500M+</strong>'],
            ['Due Diligence','Técnica (estado inmueble)','<strong>Técnica + Legal + Financiera + Ambiental</strong>'],
            ['Fee','% sobre renta anual','<strong>% sobre precio transacción (0.5-1.5%)</strong>'],
          ]},
        ]},
        { id:'ej', label:'Ejemplo Real', bloques:[
          { t:'p', x:'Nave logística 20.000 m² en Cabanillas del Campo (Corredor A-2, Madrid):' },
          { t:'tabla', cols:['Perspectiva','Métrica','Valor'], rows:[
            ['Leasing','Renta','€4.50/m²/mes'],
            ['Leasing','Renta anual','€1.08M/año'],
            ['Capital Markets','NOI','€1.02M'],
            ['Capital Markets','Cap Rate prime','5.00%'],
            ['Capital Markets','<strong>Valor activo</strong>','<strong>≈ €20.4M (NOI/Cap Rate)</strong>'],
            ['Capital Markets','WAULT','7.2 años (driver de pricing)'],
          ]},
          { t:'info', v:'insight', icon:'💡', x:'El mismo activo que para un broker de leasing vale por su renta/m², para un fondo vale por <strong>NOI ÷ Cap Rate</strong>. Dominar esta ecuación es el primer paso al Capital Markets.' },
        ]},
      ],
      related: ['NOI','Cap Rate','IRR','WAULT'],
    },
    {
      num:'1.2', titulo:'Participantes del Mercado', sub:'Buy-side · Sell-side · Advisors',
      tabs: [
        { id:'tipos', label:'Tipos de Inversores', bloques:[
          { t:'tabla', cols:['Tipo','Características','Estrategia','Ejemplos'], rows:[
            ['🏛️ <strong>PERE (Private Equity RE)</strong>','Fondos cerrados con plazo definido (7-10 años)','IRR objetivo 12-25%+. Core, value-add u oportunístico','Blackstone, Brookfield, Ares, Cerberus'],
            ['📊 <strong>REITs / SOCIMIs</strong>','Vehículos cotizados. Distribuyen >80% beneficios','Foco yield estable + apreciación NAV','Prologis, SEGRO, Merlin Properties'],
            ['🌍 <strong>Sovereign Wealth Funds</strong>','Fondos soberanos. Ticket grande (€50M+)','Core. Investment-grade. Contratos largos','GIC (Singapur), ADIA, QIA (Qatar)'],
            ['🏦 <strong>Aseguradoras / Pensiones</strong>','Pasivos largo plazo. Flujos predecibles','Core. NNN largo plazo ideal','AXA IM Alts, Allianz RE, DWS, Nuveen'],
            ['👨‍👩‍👦 <strong>Family Offices</strong>','Patrimonios privados. €5-50M','Logística secundaria. Decisión ágil','Muchos en España y Europa'],
            ['📐 <strong>Gestoras Especializadas</strong>','Mandatos de pensiones/aseguradoras','Alta especialización','Patrizia, CBRE IM, Savills IM'],
          ]},
        ]},
        { id:'espana', label:'Activos en España', bloques:[
          { t:'tabla', cols:['Inversor','Tipo','Estrategia','Presencia Logística España'], rows:[
            ['<strong>Prologis</strong>','REIT NYSE','Core/Core+','<strong>Líder absoluto.</strong> Madrid, BCN, Valencia, Zaragoza'],
            ['<strong>SEGRO</strong>','REIT LSE','Core/Core+','Activo. Grandes mercados'],
            ['<strong>Merlin/Montepino</strong>','SOCIMI BME','Core/Core+','<strong>Mayor SOCIMI logística.</strong> 2M+ m²'],
            ['<strong>Blackstone</strong>','PERE','Value-Add/Opor.','Logicor (vendido a CPPIB)'],
            ['<strong>Logicor</strong>','Plataforma CPPIB','Core','>2M m² en España'],
            ['<strong>AXA IM / Nuveen</strong>','Gestora institucional','Core','Mandatos aseguradoras'],
          ]},
          { t:'info', v:'law', icon:'⚖️', x:'<strong>Tu perspectiva legal:</strong> Los asesores trabajan con abogados (Uría, Cuatrecasas, Garrigues) en negociación de SPA, CP, reps & warranties y cláusulas de ajuste de precio. Tu formación jurídica te diferencia de la mayoría de analistas financieros.' },
        ]},
      ],
      related: ['PERE','SOCIMI','Logística España'],
    },
    {
      num:'1.3', titulo:'Clases de Activos Inmobiliarios', sub:'Asset Classes · Risk-Return Profile',
      bloques: [
        { t:'tabla', cols:['Clase','Prime Yield España 2024','Driver Demanda','Tendencia'], rows:[
          ['<strong>Logística / Industrial</strong>','4.75-5.25%','E-commerce, nearshoring','▲ Core institucional'],
          ['<strong>Oficinas Prime CBD</strong>','4.50-5.00%','Ocupación corporativa','▼ Incertidumbre post-COVID'],
          ['<strong>Retail High Street</strong>','4.50-5.25%','Consumo, turismo','≈ Selectivo'],
          ['<strong>Residencial Multifamily</strong>','3.75-4.25%','Presión demanda alquiler','▲ Build-to-rent emergente'],
          ['<strong>Hoteles</strong>','5.00-6.00%','Turismo (España líder EU)','▲ Recuperación fuerte'],
          ['<strong>Data Centers</strong>','4.50-6.00%','IA, cloud, digitalización','▲ Alternativo en auge'],
        ]},
        { t:'info', v:'insight', icon:'📈', x:'<strong>Contexto 2025:</strong> Tras la corrección 2022-2024, el BCE bajando tipos hacia 2.00-2.50% mejora los spreads. La logística prime española ofrece ~180 bps sobre el bono español a 10Y (~3.2%), aproximándose a la media histórica de 200-250 bps. El capital institucional vuelve gradualmente.' },
      ],
    },
    {
      num:'1.4', titulo:'El Ciclo de Inversión Inmobiliaria', sub:'Acquisition → Asset Mgmt → Disposition',
      bloques: [
        { t:'cycle', steps:[
          { icon:'🎯', label:'Deal Origination', activo:true },
          { icon:'🔍', label:'Due Diligence' },
          { icon:'✍️', label:'Closing / SPA' },
          { icon:'⚙️', label:'Asset Mgmt' },
          { icon:'📊', label:'Value Creation' },
          { icon:'💰', label:'Exit / Venta' },
        ]},
        { t:'tabla', cols:['Fase','Actividades clave','El analista hace…'], rows:[
          ['<strong>Deal Origination</strong>','Identificar oportunidades, NDA, primer contacto','Screening, análisis comps, valoración inicial'],
          ['<strong>Due Diligence</strong>','DD técnica, legal, fiscal, ambiental','Modelizar flujos, revisar IM, coordinar DDs externas'],
          ['<strong>Closing</strong>','Negociación SPA, financiación, notaría','Actualizar modelo con condiciones finales'],
          ['<strong>Asset Management</strong>','Gestión inquilinos, CAPEX, renovaciones','Reporting trimestral, actualización valoraciones'],
          ['<strong>Exit</strong>','Preparar IM, proceso venta, negociar precio','Modelo CIM, análisis de compradores'],
        ]},
        { t:'info', v:'tip', icon:'💼', x:'<strong>Pregunta de entrevista:</strong> "¿Cómo añades valor durante el hold period?" Respuesta: extensión de WAULT (renovar antes del vencimiento), captura de reversión (ERV > renta passing), certificación BREEAM para atraer inquilinos de mayor calidad, refinanciación a menor coste si tipos bajan.' },
      ],
    },
    {
      num:'1.5', titulo:'Indicadores Clave de Mercado', sub:'Prime Yield · Yield Spread · Take-up · Vacancy · ERV',
      tabs:[
        { id:'yields', label:'Yields', bloques:[
          { t:'formula', label:'Yield / Cap Rate', main:'Cap Rate = NOI Anual ÷ Precio de Mercado', sub:'Precio = NOI ÷ Cap Rate · Relación INVERSA: yield baja → precio sube' },
          { t:'ejemplo', titulo:'📊 Impacto de la Compresión de Yields', pasos:[
            { num:'①', texto:'2020: NOI = <strong>€1.0M</strong> · Cap Rate = <strong>5.50%</strong> → Valor = €18.2M' },
            { num:'②', texto:'2022 (pico): NOI = <strong>€1.0M</strong> · Cap Rate = <strong>3.75%</strong> → Valor = €26.7M' },
            { num:'③', texto:'2024: NOI = <strong>€1.1M</strong> (+10%) · Cap Rate = <strong>5.00%</strong> → Valor = €22.0M' },
          ], resultado:'➜ Aunque el NOI subió +10%, el precio cayó vs 2022 por expansión de yields (+125 bps). Los tipos dominan sobre la renta.' },
        ]},
        { id:'spread', label:'Spread Analysis', bloques:[
          { t:'tabla', cols:['Escenario','Prime Log. Yield','Bono España 10Y','Spread','Señal'], rows:[
            ['2022 (pico boom)','3.75%','2.80%','95 bps','Estrecho — caro'],
            ['2023 (corrección)','5.25%','3.80%','145 bps','Neutral'],
            ['2024 (estabilización)','5.00%','3.20%','180 bps','Mejorando'],
            ['Media histórica','—','—','<strong>200-250 bps</strong>','Equilibrio'],
          ]},
        ]},
        { id:'prime', label:'Prime vs Secundario', bloques:[
          { t:'tabla', cols:['Característica','Mercado Prime','Mercado Secundario'], rows:[
            ['<strong>Localización Madrid</strong>','A-2 km 0-40, Cabanillas, Coslada','Guadalajara interior, Toledo, >60km'],
            ['<strong>Inquilino típico</strong>','Amazon, DHL, Inditex, Mercadona','SME, operadores locales'],
            ['<strong>Prime Yield 2024</strong>','4.75-5.00%','5.50-7.00%+'],
            ['<strong>Liquidez</strong>','Alta — exit fácil a fondos core','Media-baja'],
            ['<strong>ESG</strong>','BREEAM Very Good / Excellent','Sin certificación frecuente'],
          ]},
        ]},
      ],
    },
    {
      num:'1.6', titulo:'El Rol del Asesor en Capital Markets', sub:'Advisory · Sell-Side · Buy-Side · Proceso Estructurado',
      bloques: [
        { t:'tabla', cols:['Fase del Proceso','Duración típica','Documentos clave'], rows:[
          ['<strong>1. Mandato / Pitching</strong>','2-4 semanas','Pitch deck, valoración indicativa'],
          ['<strong>2. Preparación IM</strong>','4-6 semanas','Information Memorandum (IM)'],
          ['<strong>3. Marketing → Ofertas Indicativas</strong>','4-6 semanas','Teaser, NDA, IM distribuido'],
          ['<strong>4. DD → Oferta Vinculante</strong>','4-8 semanas','Data Room, SPA draft'],
          ['<strong>5. Negociación / Exclusividad</strong>','2-4 semanas','LOI, Heads of Terms'],
          ['<strong>6. Closing</strong>','2-4 semanas','SPA firmado, escritura notarial'],
        ]},
        { t:'info', v:'law', icon:'⚖️', x:'<strong>Aprovecha tu base legal:</strong> El LOI / Heads of Terms no es vinculante bajo derecho español en la mayoría de casos, pero marca el marco económico. Los abogados negociarán las <em>reps & warranties</em>, las cláusulas de <em>earn-out</em>, el <em>escrow</em> y los <em>Conditions Precedent</em>.' },
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 2 · Métricas
// ─────────────────────────────────────────────────────────────────
{
  id:'m2', titulo:'Métricas Financieras y Valoración',
  descripcion:'El lenguaje financiero. NOI, Cap Rate, IRR, DCF, WAULT — las métricas con las que se evalúa y defiende cualquier inversión.',
  nivel:'Básico', tags:['IRR','DCF','WAULT'],
  conceptos:[
    {
      num:'2.1', titulo:'NOI — Net Operating Income', sub:'Resultado Operativo Neto · Base de Toda Valoración',
      bloques:[
        { t:'p', x:'El <strong>NOI</strong> es el ingreso neto del activo después de gastos operativos, pero <em>antes</em> de financiación, amortización e impuestos. Es la base del Cap Rate y del DCF.' },
        { t:'formula', label:'Fórmula NOI', main:'NOI = Ingresos Brutos − Gastos Operativos − Vacante', sub:'⚠️ NO se resta: deuda (intereses), amortización contable, IS. Sí: IBI propietario, seguros, gestión, mantenimiento no repercutido' },
        { t:'ejemplo', titulo:'📋 Nave 15.000 m² Cabanillas (Madrid) — NNN', pasos:[
          { num:'+', texto:'Renta NNN: 15.000 m² × €4.50/m²/mes × 12 = <strong>€810.000/año</strong>' },
          { num:'+', texto:'Otros ingresos (antenas, parking): <strong>€12.000/año</strong>' },
          { num:'–', texto:'Gestión del activo (0.5%): <strong>–€4.000</strong>' },
          { num:'–', texto:'Seguro del propietario: <strong>–€8.000</strong>' },
          { num:'–', texto:'Vacante potencial (3%): <strong>–€24.300</strong>' },
        ], resultado:'NOI = €785.700/año · A Cap Rate 5.00% → Valor = €15.7M' },
        { t:'info', v:'tip', icon:'💡', x:'<strong>NNN en logística:</strong> El inquilino paga IBI, seguros y mantenimiento. El propietario recibe renta casi pura. Por eso NOI ≈ Renta Bruta en NNN, y se valoran a yields más bajos (más caros).' },
      ],
    },
    {
      num:'2.2', titulo:'Cap Rate — Tasa de Capitalización', sub:'NIY · Running Yield · Reversionary · Exit Cap',
      bloques:[
        { t:'formula', label:'Cap Rate / NIY', main:'Cap Rate = NOI / Precio de Adquisición', sub:'Precio = NOI / Cap Rate · Relación inversa: yield comprime → precio sube' },
        { t:'ejemplo', titulo:'🧮 Impacto de 25 bps en precio', pasos:[
          { num:'①', texto:'NOI €1M · Cap Rate <strong>5.00%</strong> → Precio: <strong>€20.0M</strong>' },
          { num:'②', texto:'NOI €1M · Cap Rate <strong>4.75%</strong> → Precio: <strong>€21.05M</strong>' },
        ], resultado:'25 bps de compresión = +€1.05M (+5.2%). Esto es el "yield compression play".' },
        { t:'tabla', cols:['Término','Definición'], rows:[
          ['<strong>Cap Rate / NIY</strong>','NOI actual / precio. Yield "de entrada"'],
          ['<strong>Running Yield</strong>','NOI actual / precio de coste (precio + CAPEX). Evoluciona con inversiones'],
          ['<strong>Reversionary Yield</strong>','ERV / precio. Potencial si todas las rentas llegan al nivel de mercado'],
          ['<strong>Exit Cap Rate</strong>','Cap Rate asumido en la venta al final del hold. Crítico en el DCF'],
        ]},
        { t:'info', v:'warning', icon:'⚠️', x:'<strong>Error frecuente en entrevistas:</strong> Confundir Cap Rate con IRR. Cap Rate es estático (año 1, sin crecimiento, sin leverage). IRR es dinámica (incluye crecimiento, exit y leverage).' },
      ],
    },
    {
      num:'2.3', titulo:'IRR / TIR — Internal Rate of Return', sub:'Hurdle Rate · Leveraged vs Unleveraged',
      bloques:[
        { t:'p', x:'La <strong>IRR</strong> es la tasa de descuento que hace que el VAN de todos los flujos sea igual a cero. Es el <em>rendimiento anualizado compuesto</em> de la inversión, capturando el timing de todos los flujos.' },
        { t:'formula', label:'Definición matemática', main:'0 = −Inversión + Σ [FCt / (1+IRR)^t] + [Valor Salida / (1+IRR)^n]', sub:'FCt = Free Cash Flow año t · n = años hold · IRR se calcula iterativamente' },
        { t:'ejemplo', titulo:'📊 Inversión Logística a 5 años (Unleveraged)', pasos:[
          { num:'①', texto:'Compra: <strong>–€20.0M</strong> · NOI Año 1: <strong>€1.0M</strong> · Crecimiento: <strong>+3%/año</strong>' },
          { num:'②', texto:'Flujos: €1.0M · €1.03M · €1.06M · €1.09M · €1.13M' },
          { num:'③', texto:'Exit Año 5: NOI €1.13M / Exit Cap <strong>4.75%</strong> = <strong>€23.8M</strong>' },
        ], resultado:'IRR Unleveraged ≈ 9.4% · Equity Multiple ≈ 1.62x' },
        { t:'tabla', cols:['Estrategia','IRR Target (Levered)','Equity Multiple'], rows:[
          ['<strong>Core</strong>','6-9%','1.3-1.5x'],
          ['<strong>Core+</strong>','9-12%','1.5-1.8x'],
          ['<strong>Value-Add</strong>','12-18%','1.8-2.5x'],
          ['<strong>Oportunístico</strong>','18-25%+','2.0-3.0x+'],
        ]},
      ],
      related: ['DCF','Equity Multiple'],
    },
    {
      num:'2.4', titulo:'WAULT — Weighted Average Unexpired Lease Term', sub:'Driver de Pricing en Logística',
      bloques:[
        { t:'p', x:'El <strong>WAULT</strong> mide el tiempo medio ponderado (por renta o área) que queda de vida contractual. WAULT alto reduce el riesgo de vacante y justifica yields más bajos. Es el factor más determinante del pricing en logística institucional.' },
        { t:'formula', label:'WAULT por Renta (income-weighted)', main:'WAULT = Σ (Renta_i × Años Restantes_i) / Renta Total' },
        { t:'ejemplo', titulo:'📋 Parque Logístico — 3 Inquilinos', pasos:[
          { num:'A', texto:'Amazon: Renta <strong>€600K/año</strong> · Años: <strong>8.5</strong> → Ponderado: 5.100' },
          { num:'B', texto:'DHL: Renta <strong>€300K/año</strong> · Años: <strong>4.0</strong> → Ponderado: 1.200' },
          { num:'C', texto:'Empresa local: Renta <strong>€100K/año</strong> · Años: <strong>1.5</strong> → Ponderado: 150' },
        ], resultado:'WAULT = (5.100+1.200+150) / 1.000K = <strong>6.45 años</strong>' },
        { t:'info', v:'insight', icon:'⚡', x:'<strong>Regla práctica:</strong> WAULT &gt;7 años → Premium pricing · WAULT 5-7 años → Precio estándar · WAULT &lt;5 años → Descuento. Amazon a 8.5 años convierte el activo en casi un bono inmobiliario.' },
      ],
    },
    {
      num:'2.5', titulo:'DCF — Discounted Cash Flow & NPV', sub:'Valor Terminal · Tasa de Descuento',
      bloques:[
        { t:'p', x:'El <strong>DCF</strong> proyecta todos los flujos de caja futuros (tipicamente 10 años) y los descuenta a la tasa de retorno requerida para obtener el VAN. Si el precio de compra es menor que el VAN → inversión atractiva.' },
        { t:'formula', label:'NPV / VAN', main:'NPV = −Inversión + Σ [FCt/(1+r)^t] + [NOI_{n+1}/Exit Cap / (1+r)^n]', sub:'Valor Terminal = NOI año n+1 / Exit Cap Rate · r = discount rate = IRR objetivo' },
        { t:'info', v:'tip', icon:'🧮', x:'Usa la <strong>Calculadora DCF/IRR</strong> de esta plataforma para modelizar casos reales. El Módulo 8 tiene el tutorial paso a paso.' },
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 3 · Estructuras de Deal
// ─────────────────────────────────────────────────────────────────
{
  id:'m3', titulo:'Estructuras de Deal y Mecánica Transaccional',
  descripcion:'Asset vs share deal, forward purchase, sale & leaseback, DD y SPA en España. Tu background jurídico es tu mayor activo.',
  nivel:'Intermedio', tags:['SPA','DD','S&LB'],
  conceptos:[
    {
      num:'3.1', titulo:'Asset Deal vs. Share Deal', sub:'ITP · Art. 314 LMV',
      bloques:[
        { t:'tabla', cols:['Criterio','Asset Deal','Share Deal'], rows:[
          ['<strong>Qué se compra</strong>','El inmueble directamente','Participaciones/acciones de la sociedad propietaria'],
          ['<strong>ITP / IVA España</strong>','ITP 6-10% (CCAA) o IVA 21%','<strong>Exento ITP/IVA si &gt;5% sociedad (art. 314 LMV)</strong>'],
          ['<strong>Riesgo comprador</strong>','Bajo — solo el activo','Alto — hereda TODOS los pasivos de la sociedad'],
          ['<strong>Due Diligence</strong>','Técnica, legal activo, ambiental','Todo lo anterior + societaria, fiscal, laboral'],
          ['<strong>Precio</strong>','Precio del activo','Enterprise Value − deuda neta = Equity Value'],
          ['<strong>Uso habitual</strong>','Compradores sin vehículo existente','Fondos institucionales, SOCIMIs — eficiencia fiscal'],
          ['<strong>Plazo cierre</strong>','4-8 semanas','8-16 semanas (DD más amplia)'],
        ]},
        { t:'info', v:'law', icon:'⚖️', x:'<strong>El art. 314 LMV</strong> (ex-art. 108) es la norma anti-elusión española: grava con ITP las transmisiones de valores cuando el activo principal sea inmobiliario y haya ánimo elusivo. La exención aplica cuando no hay ánimo de eludir y el inmueble está afecto a actividad económica.' },
      ],
    },
    {
      num:'3.2', titulo:'Forward Purchase vs. Forward Funding', sub:'Compra Diferida · Financiación a Promotor',
      bloques:[
        { t:'tabla', cols:['Característica','Forward Purchase','Forward Funding'], rows:[
          ['<strong>Cuándo paga el inversor</strong>','Al completarse la obra (PC)','Por certificaciones durante construcción'],
          ['<strong>Riesgo construcción</strong>','Lo asume el promotor','Lo asume el inversor'],
          ['<strong>Precio inversor</strong>','Acordado hoy, NOI futuro','Menor — financia desde el inicio'],
          ['<strong>Uso típico</strong>','Activos pre-arrendados, BTS','Parques en desarrollo, big-box especulativo'],
        ]},
        { t:'info', v:'insight', icon:'🏗️', x:'<strong>Ejemplo PLAZA:</strong> Prologis acuerda forward funding con promotor local para nave BTS de 50.000 m² en PLAZA (Zaragoza). Financia la construcción por certificaciones. Al entregar, el activo ya tiene inquilino firmado a 10 años.' },
      ],
    },
    {
      num:'3.3', titulo:'Sale & Leaseback (S&LB)', sub:'Venta con Retroarrendamiento · Inquilino = Vendedor',
      bloques:[
        { t:'p', x:'En un <strong>S&LB</strong>, una empresa propietaria de sus activos operativos los vende a un inversor y simultáneamente firma un contrato de arrendamiento a largo plazo para seguir ocupándolos. Libera capital inmovilizado en el ladrillo para reinvertirlo en su negocio core.' },
        { t:'ejemplo', titulo:'📋 Ejemplo S&LB Logístico España', pasos:[
          { num:'①', texto:'Mercadona posee 5 naves logísticas valoradas en <strong>€120M</strong>' },
          { num:'②', texto:'Vende al fondo XYZ a Cap Rate <strong>4.50%</strong> y firma arrendamiento NNN <strong>15 años</strong>' },
          { num:'③', texto:'Mercadona obtiene €120M de liquidez; el fondo obtiene arrendatario investment-grade con contrato largo' },
        ], resultado:'Para el fondo: activo de máxima calidad con cero riesgo de vacante a corto plazo.' },
      ],
    },
    {
      num:'3.4', titulo:'Due Diligence — El Proceso Completo', sub:'Técnica · Legal · Fiscal · Ambiental · Urbanística',
      bloques:[
        { t:'tabla', cols:['Tipo DD','Ámbito','Quién','Red Flags típicos'], rows:[
          ['<strong>Técnica</strong>','Estado edificio, instalaciones, estructura','Ingeniería / Arcadis, CBRE','Aluminosis, amianto, CAPEX diferido'],
          ['<strong>Legal</strong>','Titularidad, cargas, contratos, licencias','Uría, Cuatrecasas, Garrigues','Hipotecas ocultas, servidumbres'],
          ['<strong>Fiscal</strong>','Estructura societaria, ITP/IVA, contingencias','Big Four (Deloitte, PwC…)','Deuda tributaria, inspecciones'],
          ['<strong>Ambiental</strong>','Contaminación suelo/subsuelo, ESG','Consultora ambiental','Suelo contaminado (industrial: frecuente)'],
          ['<strong>Urbanística</strong>','Licencias, clasificación suelo, planes','Abogado urbanista','Usos fuera de licencia'],
        ]},
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 4 · Deuda
// ─────────────────────────────────────────────────────────────────
{
  id:'m4', titulo:'Deuda y Financiación en Real Estate',
  descripcion:'El capital stack, LTV, DSCR, tipos fijos vs variables, Euribor y el mercado de préstamos CRE en España.',
  nivel:'Intermedio', tags:['LTV','DSCR','Euribor'],
  conceptos:[
    {
      num:'4.1', titulo:'El Capital Stack', sub:'Senior · Mezzanine · Preferred · Common Equity',
      bloques:[
        { t:'tabla', cols:['Posición','Tipo','LTV%','Coste típico 2024','Riesgo'], rows:[
          ['1º (más seguro)','<strong>Senior Debt</strong>','0-55%','Euribor + 150-250 bps','Bajo — primero cobrar'],
          ['2º','<strong>Mezzanine Debt</strong>','55-70%','8-14% fijo','Medio — subordinado al senior'],
          ['3º','<strong>Preferred Equity</strong>','70-80%','12-16% fijo/PIK','Alto'],
          ['4º (más riesgo)','<strong>Common Equity (GP/LP)</strong>','80-100%','IRR objetivo 12-20%+','Residual — primero absorbe pérdidas'],
        ]},
        { t:'formula', label:'LTV — Loan-to-Value', main:'LTV = Importe Préstamo / Valor Activo', sub:'Ejemplo: Activo €20M · Deuda senior €11M → LTV = 55%' },
        { t:'formula', label:'DSCR — Debt Service Coverage Ratio', main:'DSCR = NOI / Servicio Anual de la Deuda', sub:'Servicio = intereses + amortización · Mínimo bancario: 1.25x · &lt;1.0x = breach' },
        { t:'ejemplo', titulo:'🏦 Estructura — Nave Logística €20M', pasos:[
          { num:'①', texto:'Activo: <strong>€20M</strong> · NOI: <strong>€1.0M/año</strong>' },
          { num:'②', texto:'Deuda senior: <strong>€11M (LTV 55%)</strong> · Euribor 2.5% + 2.0% = <strong>4.5%</strong> · Intereses: €495K/año (bullet)' },
          { num:'③', texto:'DSCR: €1.0M / €495K = <strong>2.02x</strong> ✓ (muy cómodo, mínimo 1.25x)' },
          { num:'④', texto:'Equity requerido: €20M − €11M = <strong>€9M</strong>' },
        ], resultado:'Cash-on-cash yield del equity = (€1.0M − €495K) / €9M = 5.6%' },
      ],
    },
    {
      num:'4.2', titulo:'Tipos Fijo vs. Variable — Euribor y Spread', sub:'Hedging · Interest Rate Cap',
      bloques:[
        { t:'p', x:'Los préstamos CRE en Europa pueden ser a <strong>tipo fijo</strong> (coste conocido todo el plazo) o <strong>variable</strong> (Euribor + spread). La elección impacta directamente el modelo financiero del fondo y los covenants.' },
        { t:'tabla', cols:['Característica','Tipo Fijo','Tipo Variable (Euribor+)'], rows:[
          ['Certeza de coste','Total — coste conocido','Parcial — varía con Euribor'],
          ['Nivel 2024-25','~4.0-5.0% todo incluido','Euribor 2.5% + spread 1.5-2.5% = ~4.0-5.0%'],
          ['Riesgo subida tipos','Nulo','Alto si Euribor sube'],
          ['Beneficio bajada tipos','Nulo','Sí — reduce coste de servicio'],
          ['Herramienta de cobertura','No necesaria','Cap, Collar, IRS (Interest Rate Swap)'],
          ['Uso habitual','Fondos core con hold largo','Fondos PERE, value-add'],
        ]},
        { t:'info', v:'insight', icon:'💡', x:'<strong>Interest Rate Cap:</strong> Un fondo con deuda variable compra un Cap (opción) que limita el Euribor a, por ejemplo, 4%. Si el Euribor sube a 5%, el banco que vendió el Cap paga la diferencia. En 2022-2023, los Caps dispararon de precio porque todos los fondos los necesitaban.' },
        { t:'info', v:'law', icon:'⚖️', x:'<strong>IRS (Interest Rate Swap):</strong> Derivado donde el fondo paga tipo fijo y recibe el Euribor, transformando variable en fijo. Requiere contrato ISDA con Close-out Netting y collateral — tu formación jurídica es directamente aplicable.' },
      ],
    },
    {
      num:'4.3', titulo:'Covenants — Condiciones de Incumplimiento', sub:'Breach · Cure · Waiver',
      bloques:[
        { t:'tabla', cols:['Tipo de Covenant','Definición','Umbral típico CRE España'], rows:[
          ['DSCR mínimo','NOI / Servicio anual deuda ≥ X','1.20-1.30x'],
          ['LTV máximo','Deuda / Valor activo ≤ X','65-70%'],
          ['ICR mínimo','NOI / Intereses anuales ≥ X','1.50-2.00x'],
          ['Occupancy mínima','% espacio arrendado ≥ X','80-85%'],
          ['WAULT mínimo','Años medios restantes ≥ X','3-4 años'],
        ]},
        { t:'ejemplo', titulo:'Escenario: Breach de Covenant DSCR', pasos:[
          { num:'①', texto:'NOI original €1.0M · Servicio deuda €495K · DSCR: <strong>2.02x ✓</strong>' },
          { num:'②', texto:'Inquilino incumple → NOI cae a €600K · DSCR: <strong>1.21x ⚠️</strong>' },
          { num:'③', texto:'Covenant mínimo era 1.25x → <strong>BREACH</strong>. El banco notifica al fondo.' },
          { num:'④', texto:'Opciones: (A) Cure: depositar cash reserve o reducir deuda · (B) Waiver: dispensa temporal · (C) Default: ejecución' },
        ], resultado:'Un breach no es automáticamente ejecución — los cure periods (30-60 días) permiten renegociar.' },
      ],
    },
    {
      num:'4.4', titulo:'Estrategias de Refinanciación', sub:'Cash-Out · Extension · Bridge · Recap',
      bloques:[
        { t:'tabla', cols:['Estrategia','Qué es','Cuándo se usa'], rows:[
          ['Cash-out Refi','Nuevo préstamo &gt; deuda existente; exceso a inversores','El activo se ha apreciado; devolver capital a LP sin vender'],
          ['Extension','Ampliar el plazo del préstamo existente','Hold period más largo de lo previsto; evitar venta forzosa'],
          ['Rate refinancing','Mismo importe, tipo más bajo','Tipos de mercado han bajado; mejorar cash-on-cash yield'],
          ['Bridge loan','Préstamo corto plazo (12-36 meses) durante reposicionamiento','Activo en obras o reletting, sin financiación permanente'],
          ['Mezzanine add-on','Añadir mezzanine sobre senior existente','Capturar capital sin romper el préstamo senior'],
        ]},
        { t:'info', v:'insight', icon:'📊', x:'<strong>Ejemplo cash-out:</strong> Fondo compra 2020 en PLAZA a 5.5% Cap Rate con LTV 55% (deuda €11M sobre €20M). En 2022 el activo vale €26M (Cap Rate 4.0%). Nuevo préstamo 55% LTV = €14.3M. Repaga €11M y extrae €3.3M de caja sin vender. IRR leveraged mejora.' },
      ],
    },
    {
      num:'4.5', titulo:'Mercado CRE Lending España y CMBS', sub:'Banca · Direct Lending · CMBS',
      bloques:[
        { t:'tabla', cols:['Tipo Prestamista','Ejemplos','LTV','Tipo 2024-25','Especialidad'], rows:[
          ['Banca española','CaixaBank, BBVA, Santander, Sabadell','50-60%','Euribor + 1.5-2.5%','Relación existente, core'],
          ['Banca internacional','Deutsche Bank, ING, BNP Paribas','50-65%','Euribor + 1.5-3.0%','Portfolios grandes, cross-border'],
          ['Seguros / Direct lending','Allianz, AXA IM, Generali','55-65%','Fijo 3.5-5.0%','NNN largo plazo, prime'],
          ['Debt funds','Blackstone Credit, Ares, M&G','65-75%','8-12%','Puente, mezzanine, value-add'],
          ['CMBS','Mercado de capitales','60-70%','Variable','Securitización portfolios grandes'],
        ]},
        { t:'formula', label:'CMBS — Commercial Mortgage-Backed Securities', main:'Pool de hipotecas comerciales → Trancheadas por rating → Vendidas a inversores de renta fija', sub:'Tramos: AAA (más seguro) hasta BB (más arriesgado). Mercado CMBS muy limitado en España vs EEUU/UK.' },
        { t:'info', v:'warning', icon:'⚠️', x:'<strong>Post-2022:</strong> Los bancos endurecieron condiciones (menos LTV, más spread, más covenants). Algunos fondos con préstamos variables sin Caps sufrieron problemas de servicio de deuda. El mercado se normaliza desde 2024 con la bajada de tipos del BCE.' },
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 5 · Logística
// ─────────────────────────────────────────────────────────────────
{
  id:'m5', titulo:'Logística & Industrial en Capital Markets',
  descripcion:'Por qué logística se convirtió en activo institucional core, submercados españoles, yields, contratos NNN, ESG y los grandes REITs activos en España.',
  nivel:'Intermedio', tags:['Prologis','NNN','BREEAM'],
  conceptos:[
    {
      num:'5.1', titulo:'Por Qué la Logística se Convirtió en Activo Core', sub:'E-commerce · Nearshoring · NNN · Demanda Estructural',
      bloques:[
        { t:'tabla', cols:['Factor','Impacto en demanda logística'], rows:[
          ['<strong>E-commerce</strong>','Por cada €1B adicional de ventas online se requieren ~75.000 m² de almacén'],
          ['<strong>COVID-19 (2020)</strong>','Acelerador definitivo: cerró el retail, disparó el e-commerce, demostró que la supply chain es infraestructura crítica'],
          ['<strong>Nearshoring</strong>','Post-COVID, empresas acortan cadenas hacia Europa del Sur → nueva demanda en España'],
          ['<strong>Vacante mínima</strong>','Vacancy logística Madrid: 3-5% vs 10-15% en oficinas. Baja vacante = rentas al alza = activo atractivo'],
          ['<strong>Contratos NNN largos</strong>','Big-box 10-15 años NNN con blue-chips = flujo predecible = sustituye bonos en portfolios core'],
          ['<strong>ESG</strong>','Logística new-build: techos solares, LED, carga eléctrica camiones → activos verdes para mandatos ESG'],
        ]},
        { t:'info', v:'insight', icon:'📈', x:'<strong>Historia de yields España:</strong> 2015: ~7.5% · 2018: ~5.5% · 2022: ~3.75% (mínimo histórico) · 2024: ~5.0%. La compresión 2018-2022 fue la más agresiva de la historia inmobiliaria española.' },
      ],
    },
    {
      num:'5.2', titulo:'Submercados Logísticos España', sub:'Madrid · BCN · Valencia · PLAZA · Sevilla',
      bloques:[
        { t:'tabla', cols:['Mercado','Zonas Prime','Prime Yield 2024','Renta Prime','Nota clave'], rows:[
          ['<strong>Madrid</strong>','PISTA (A-4), A-2 (Coslada, San Fernando), Cabanillas','4.75-5.00%','€5.50-7.00/m²/mes','Mayor mercado. Escasez suelo prime.'],
          ['<strong>Barcelona</strong>','ZAL Port, Zona Franca, Parets del Vallès, Abrera','5.00-5.25%','€5.50-6.50/m²/mes','Puerto clave. Saturación zona prime.'],
          ['<strong>Valencia</strong>','ZAL Valencia, Ribarroja, Almussafes','5.25-5.75%','€4.50-5.50/m²/mes','Puerto Mediterráneo. Importación asiática.'],
          ['<strong>Zaragoza</strong>','<strong>PLAZA — Plataforma Logística de Aragón</strong>','5.50-6.00%','€4.00-5.00/m²/mes','<strong>Hub estratégico:</strong> A-2/AP-68, ferrocarril, equidistante Madrid-BCN-Bilbao'],
          ['<strong>Sevilla</strong>','Mairena del Aljarafe, Dos Hermanas','6.00-6.50%','€3.50-4.50/m²/mes','Mercado emergente. Nearshoring.'],
        ]},
      ],
    },
    {
      num:'5.3', titulo:'Compresión y Expansión de Yields 2018-2025', sub:'Yield Compression · Expansion · Ciclo de Tipos',
      bloques:[
        { t:'p', x:'El ciclo de yields logísticos en España 2018-2025 es el más dramático de la historia del sector. En 7 años, los yields prime pasaron de 7.5% a 3.75% y de vuelta a 5.0%.' },
        { t:'tabla', cols:['Período','Prime Yield Madrid','Driver','Implicación inversora'], rows:[
          ['2015-2018','7.5% → 5.5%','Tipos BCE bajos, primer interés institucional','Entrada REITs internacionales (Prologis, SEGRO)'],
          ['2018-2021','5.5% → 4.25%','COVID dispara e-commerce; BCE tipos negativos','Aceleración compresión. Take-up histórico.'],
          ['2022 (pico)','3.75%','Liquidez extrema, BCE 0%, demanda máxima','Mínimo histórico. Spread vs bono ~95 bps.'],
          ['2022-2023','3.75% → 5.25%','BCE sube 0% → 4.5%','Corrección -30% en valores. Volumen cae -50%.'],
          ['2024','5.25% → 5.00%','BCE baja a 3.5%, mercado estabiliza','Reinicio gradual. Compradores vuelven.'],
          ['2025 est.','5.00% → 4.75%','BCE baja a 2.0-2.5%','Recuperación. Capital institucional vuelve activamente.'],
        ]},
        { t:'ejemplo', titulo:'Impacto en Valoración: Misma Nave, Diferente Año', pasos:[
          { num:'2022', texto:'NOI €1.0M · Cap Rate 3.75% → Precio: <strong>€26.7M</strong>' },
          { num:'2024', texto:'NOI €1.1M (+10%) · Cap Rate 5.00% → Precio: <strong>€22.0M</strong>' },
        ], resultado:'El activo bajó €4.7M (-17.5%) a pesar de subir el NOI. Los tipos dominan absolutamente sobre la renta a corto plazo.' },
      ],
    },
    {
      num:'5.4', titulo:'ESG en Logística — BREEAM, LEED y Green Premium', sub:'Net Zero · Stranded Assets · ESG Mandates',
      bloques:[
        { t:'tabla', cols:['Factor ESG','Impacto en Pricing','Implementación práctica'], rows:[
          ['Paneles fotovoltaicos en cubierta','Green premium: yield 10-20 bps menor','Cubierta 20.000 m² → ~2.0 MWp generados'],
          ['LED lighting 100%','Estándar ahora; sin certificar = brown discount','Reducción 60% consumo vs fluorescente'],
          ['Cargadores eléctricos camiones','Diferencial creciente con electrificación flota','Puntos de carga 22-150 kW en muelles'],
          ['BREEAM Very Good mínimo','Requisito para mandatos institucionales Art. 8/9','Auditoría externa; coste €15K-€50K'],
          ['Activo sin certificación en zona prime','Brown discount 25-75 bps sobre yield equivalente certificado','Nave 2005 sin BREEAM: 5.5% vs 5.0% nave nueva BREEAM'],
        ]},
        { t:'info', v:'warning', icon:'⚠️', x:'<strong>La regulación europea fuerza el cambio:</strong> La EPBD obliga a edificios comerciales a cumplir estándares crecientes. Los inversores bajo SFDR Art. 8 y 9 no pueden adquirir activos que no cumplan. Esto crea división estructural: activos "green" con liquidez y yields bajos; activos "brown" con descuento y menor liquidez.' },
      ],
    },
    {
      num:'5.5', titulo:'Last-Mile vs. Big-Box — Perfiles de Inversión', sub:'Urban Logistics · Cross-Dock · Yields',
      bloques:[
        { t:'tabla', cols:['Dimensión','Last-Mile Urbano','Big-Box (Gran Formato)'], rows:[
          ['Tamaño','500-8.000 m²','30.000-200.000+ m²'],
          ['Ubicación','Dentro o periurbano ciudades grandes','Segunda/tercera corona'],
          ['Inquilinos típicos','Última milla e-comm, farma, alimentación','Amazon, DHL, Carrefour, XPO, Inditex'],
          ['Contratos típicos','3-7 años · Renovaciones frecuentes','7-15 años · BTS habituales · NNN'],
          ['Prime Yield Madrid 2024','3.5-4.5% (escasez extrema suelo urbano)','4.75-5.25%'],
          ['Inversores típicos','SEGRO Urban, GLP, CBRE IM especialistas','Prologis, SEGRO, fondos core, SOCIMIs'],
        ]},
        { t:'info', v:'insight', icon:'📦', x:'<strong>Por qué el last-mile puede costar más (yield menor) que el big-box:</strong> La escasez de suelo urbano logístico en Madrid y Barcelona es extrema. Esa escasez estructural → rentas más altas → yields más bajos.' },
      ],
    },
    {
      num:'5.6', titulo:'Calidad Crediticia del Arrendatario — Impacto en Pricing', sub:'Investment Grade · SME Risk',
      bloques:[
        { t:'tabla', cols:['Perfil','Ejemplo','Rating','Impacto Cap Rate','LTV financiación'], rows:[
          ['Blue-chip / IG','Amazon, DHL, Inditex, Mercadona','BBB- o superior','Prime yield o −25/−50 bps sobre prime','55-65% LTV'],
          ['Large Corporate / Sub-IG','Operadores nacionales (MRW, Nacex)','BB / No rated','Prime yield + 25/50 bps','50-60% LTV'],
          ['SME / Sin rating','Empresa familiar, regional','Sin rating','Prime yield + 75-150 bps','40-55% LTV'],
          ['Administración Pública','Correos, admin. regionales','AAA (España BBB+)','Similar o mejor que IG','Máximo LTV'],
        ]},
        { t:'ejemplo', titulo:'Mismo Activo, Distintos Inquilinos', pasos:[
          { num:'①', texto:'Nave 10.000 m², PLAZA Zaragoza · Renta €400K/año · WAULT 7 años' },
          { num:'②', texto:'Escenario A — Amazon (IG) → Cap Rate 5.00% → Precio: <strong>€8.0M</strong>' },
          { num:'③', texto:'Escenario B — SME sin rating → Cap Rate 6.50% → Precio: <strong>€6.15M</strong>' },
        ], resultado:'Diferencia: €1.85M (-23%) por el mismo activo. Solo cambia quién firma la renta.' },
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 6 · Fondos
// ─────────────────────────────────────────────────────────────────
{
  id:'m6', titulo:'Fondos de Inversión y Vehículos Inmobiliarios',
  descripcion:'Core vs Value-Add vs Oportunístico, SOCIMIs, estructura GP/LP, waterfall y carried interest.',
  nivel:'Intermedio', tags:['SOCIMI','PERE','Carry'],
  conceptos:[
    {
      num:'6.1', titulo:'Core / Core+ / Value-Add / Oportunístico', sub:'Risk-Return Spectrum',
      bloques:[
        { t:'spectrum', bands:[
          { nombre:'Core',           irr:'IRR 6-9%',     lev:'LTV 40-50%' },
          { nombre:'Core+',          irr:'IRR 9-12%',    lev:'LTV 50-55%' },
          { nombre:'Value-Add',      irr:'IRR 12-18%',   lev:'LTV 55-65%' },
          { nombre:'Oportunístico',  irr:'IRR 18-25%+',  lev:'LTV 65-75%+' },
        ]},
        { t:'tabla', cols:['Estrategia','Perfil del activo','Fuente de retorno','Ejemplo logística España'], rows:[
          ['<strong>Core</strong>','Prime, 95%+ ocupado, WAULT &gt;7Y, IG','Yield estable + ligera apreciación','Nave Prologis en Cabanillas, Amazon 10Y NNN'],
          ['<strong>Core+</strong>','Good location, 85%+, algo de reversión','Yield + crecimiento renta + CAPEX moderado','Parque logístico Vallès con re-arrendamiento'],
          ['<strong>Value-Add</strong>','Vacante significativa, renta bajo ERV, CAPEX','Creación de valor operativa (reletting)','Naves obsoletas reconvertidas a cross-dock'],
          ['<strong>Oportunístico</strong>','Suelo, desarrollo especulativo, distressed','Desarrollo + compresión yield + alto leverage','Compra suelo logístico y desarrollo big-box'],
        ]},
      ],
    },
    {
      num:'6.2', titulo:'SOCIMIs — El REIT Español', sub:'Régimen Fiscal · Distribución · Merlin · Montepino',
      bloques:[
        { t:'tabla', cols:['Requisito Legal SOCIMI','Detalle'], rows:[
          ['<strong>Objeto social</strong>','Adquisición y arrendamiento de inmuebles. ≥80% ingresos de arrendamiento o dividendos de filiales SOCIMI.'],
          ['<strong>Cotización</strong>','Mercado regulado (BME) o MAB/BME Growth'],
          ['<strong>Distribución</strong>','<strong>Mínimo 80% beneficios arrendamiento + 50% plusvalías ventas</strong>'],
          ['<strong>IS</strong>','<strong>0% Impuesto de Sociedades si cumple requisitos</strong>'],
          ['<strong>Plazo inversión</strong>','3 años mínimo de mantenimiento de activos arrendados'],
          ['<strong>Capital mínimo</strong>','€5 millones'],
        ]},
        { t:'info', v:'insight', icon:'📊', x:'<strong>Merlin Properties + Montepino:</strong> Merlin es la mayor SOCIMI española (€11B+ activos). Su división logística es <strong>Montepino</strong>, con &gt;2M m² SBA e inquilinos como Amazon, El Corte Inglés, DHL, Decathlon. Creada como JV con Grancasa (Aragón).' },
      ],
    },
    {
      num:'6.3', titulo:'Estructura GP/LP y Waterfall de Distribución', sub:'Carried Interest · Hurdle Rate',
      bloques:[
        { t:'tabla', cols:['Concepto','Definición','Típico'], rows:[
          ['<strong>Management Fee</strong>','Comisión anual gestión sobre capital comprometido/invertido','1.0-2.0% p.a.'],
          ['<strong>Preferred Return / Hurdle</strong>','IRR mínima garantizada a LP antes de que GP participe','6-8%'],
          ['<strong>Carried Interest</strong>','% beneficios al GP una vez superado el hurdle','20%'],
          ['<strong>GP Co-Investment</strong>','Capital propio del GP en el fondo — alinea intereses','1-5% del total'],
        ]},
        { t:'ejemplo', titulo:'💰 Waterfall Simplificado — Fondo €100M', pasos:[
          { num:'①', texto:'Return of Capital: LP recupera su inversión inicial (€100M)' },
          { num:'②', texto:'Preferred Return 8%: LP recibe IRR del 8% hasta el hurdle' },
          { num:'③', texto:'Catch-up 80/20: beneficios siguientes van 80% GP hasta igualar su 20% proporcional' },
          { num:'④', texto:'Split final 80/20: 80% LP · 20% GP (el "carry")' },
        ], resultado:'Si el fondo genera €150M sobre €100M: LP recibe ~€128M · GP percibe ~€22M en carry' },
      ],
    },
    {
      num:'6.4', titulo:'Fondos Abiertos vs Cerrados', sub:'Open-End · Closed-End · NAV · Liquidez',
      bloques:[
        { t:'tabla', cols:['Característica','Fondo Abierto (Open-End)','Fondo Cerrado (Closed-End / PERE)'], rows:[
          ['Duración','Sin vencimiento definido','Plazo fijo: típicamente 7-12 años'],
          ['Entradas inversores','Continuas (ventanas trimestrales/anuales)','Solo en período de captación inicial'],
          ['Salidas (liquidez)','Ventanas de redemption','Sin liquidez — solo al vencimiento o secundario'],
          ['Estrategia dominante','Core / Core+','Value-Add / Oportunístico'],
          ['Apalancamiento típico','30-50% LTV','55-75% LTV'],
          ['Distribuciones','Renta corriente + apreciación NAV','Carry al final (waterfall GP/LP)'],
          ['Inversores típicos','Pensiones, aseguradoras, soberanos','Fondos de fondos, endowments'],
        ]},
        { t:'info', v:'warning', icon:'⚠️', x:'<strong>El riesgo de "gate" en fondos abiertos:</strong> En mercados de estrés (2022-2023), muchos fondos abiertos core recibieron redemption requests masivas. Para evitar ventas forzadas, activaron "gates" — limitando salidas al 5-10% NAV/trimestre. Liquidez periódica ≠ inmediata.' },
      ],
    },
    {
      num:'6.5', titulo:'Separate Accounts, Club Deals y Co-Inversiones', sub:'Mandatos Bilaterales · Sidecars',
      bloques:[
        { t:'tabla', cols:['Estructura','Qué es','Ventajas inversor','Limitaciones'], rows:[
          ['Separate Account','Mandato bilateral: 1 inversor encarga a gestora invertir según mandato personalizado','Máximo control, customización, fees reducidas (~0.5-0.8%)','Requiere tickets grandes (€250M+)'],
          ['Club Deal','Grupo de 3-6 inversores co-invierten en un activo sin vehículo formal','Sin management fee de fondo, mayor transparencia','Gobernanza compleja; conflictos entre inversores'],
          ['Co-Investment / Sidecar','LP del fondo participa directamente en deals específicos','No pagan carry sobre ese deal; acceso a deals grandes','Proceso rápido — el GP no espera mucho por el LP'],
          ['JV Operativa','Capital partner (fondo) + Operating partner (local)','Capital accede a conocimiento local; el local a capital institucional','Alineación de intereses crítica; conflictos governance habituales'],
        ]},
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 7 · Análisis de Mercado
// ─────────────────────────────────────────────────────────────────
{
  id:'m7', titulo:'Análisis de Mercado y Contexto Macroeconómico',
  descripcion:'Tipos BCE, inflación, informes de mercado, análisis de comparables y el ciclo inmobiliario.',
  nivel:'Intermedio', tags:['BCE','MSCI','Comps'],
  conceptos:[
    {
      num:'7.1', titulo:'Tipos de Interés BCE y Real Estate', sub:'Política Monetaria · Efecto sobre Yields',
      bloques:[
        { t:'tabla', cols:['Período','Tipo BCE','Euribor 12M','Prime Log Yield Madrid','Efecto'], rows:[
          ['<strong>2019-2021</strong>','0%','~−0.5%','5.50% → 4.25%','Boom. Capital abundante, yields comprimen'],
          ['<strong>2022 (pico)</strong>','0% → 2%','−0.5% → 2.6%','3.75%','Máximo precio. Última transacción ultra-low yield'],
          ['<strong>2023</strong>','4.50%','4.00%','5.25%','Corrección fuerte. Volumen inversión −50%'],
          ['<strong>2024</strong>','3.50% → 3.00%','3.00%','5.00%','Estabilización. Capital regresa'],
          ['<strong>2025 (est.)</strong>','2.00-2.50%','~2.50%','4.75-5.00%','Recuperación. Spreads mejoran'],
        ]},
        { t:'info', v:'insight', icon:'💡', x:'<strong>La pregunta inevitable en entrevista:</strong> "¿Cómo afecta una bajada de 100 bps del Euribor al valor de un activo logístico?" Respuesta: reduce coste deuda → mejora IRRs leveraged → inversores pagan más → yields comprimen → precios suben. Típicamente −100 bps en tipos → −25/−50 bps en yields → +5-10% precio.' },
      ],
    },
    {
      num:'7.2', titulo:'Cómo Leer un Market Report de Logística', sub:'Take-up · Vacancy · Prime Rent · Investment Volume',
      bloques:[
        { t:'p', x:'Los informes de mercado son la materia prima del análisis. Saber extraer los datos relevantes, contextualizarlos y convertirlos en argumentos para una tesis de inversión es una skill fundamental del analista junior.' },
        { t:'tabla', cols:['Indicador','Definición','Qué indica para el inversor'], rows:[
          ['Take-up (Absorción)','m² totales arrendados en el período','Alta absorción = demanda fuerte = presión alcista en rentas'],
          ['Vacancy rate','% espacio disponible / total stock mercado','&lt;5% → mercado tenso. &gt;10% → exceso oferta. Clave para ERV.'],
          ['Prime Rent (€/m²/mes)','Renta máxima en transacciones de alta calidad','Referencia ERV. Si sube → activos bajo mercado se revalorizan'],
          ['Investment Volume (€M)','Total capital invertido en el período','Indicador de apetito inversor y liquidez del mercado'],
          ['Prime Yield (%)','Cap Rate referencia activo máxima calidad','Si comprime → mercado caliente. Si expande → corrección.'],
          ['Pipeline (m² en construcción)','Superficie en construcción o proyecto','Alto pipeline → presión bajista futura sobre rentas'],
          ['Pre-let rate (%)','% del pipeline ya arrendado','&gt;50% → mercado sano. &lt;30% → riesgo especulativo'],
        ]},
        { t:'info', v:'insight', icon:'📊', x:'<strong>Fuentes principales en España:</strong> Savills Research · CBRE Research · JLL Research · Cushman & Wakefield · BNP Paribas Real Estate. TODAS publican informes trimestrales gratuitos. Lee uno de cada casa cada trimestre.' },
      ],
    },
    {
      num:'7.3', titulo:'Análisis de Comparables (Comps)', sub:'Yield Benchmarking · Pricing Evidence',
      bloques:[
        { t:'p', x:'El análisis de comparables es la metodología más usada en Capital Markets para validar el precio de un activo: se buscan transacciones recientes de activos similares y se comparan sus características con el activo en análisis para justificar el Cap Rate aplicado.' },
        { t:'tabla', cols:['Criterio de comparabilidad','Importancia','Ajuste si difiere'], rows:[
          ['Ubicación / corredor','Alta — prime vs secundario = 100+ bps','Ajuste +/− bps según accesibilidad'],
          ['Año de construcción','Alta — logística &gt;15 años con descuento','Brown discount 25-75 bps vs nave nueva'],
          ['WAULT arrendatario','Muy alta','Ajuste +/− 25 bps por cada 2 años de diferencia'],
          ['Calidad arrendatario','Muy alta','Diferencial 75-150 bps IG vs SME sin rating'],
          ['Fecha transacción','Alta','Ajustar por variación de mercado (puede ser 100-200 bps entre 2022 y 2024)'],
          ['Tipo de venta','Baja/media','Off-market: descuento 5-15% vs proceso competitivo'],
        ]},
        { t:'ejemplo', titulo:'Comp Table — Nave Objetivo: PLAZA Zaragoza, 20.000 m²', pasos:[
          { num:'①', texto:'Buscar transacciones logísticas en Zaragoza y mercados comparables (12-18 meses)' },
          { num:'②', texto:'Comp A: Nave 18.000 m² PLAZA · DHL 7Y NNN · Q1 2024 · <strong>€16.2M → Cap Rate 5.50%</strong>' },
          { num:'③', texto:'Comp B: Nave 22.000 m² A-2 Madrid km 50 · Amazon 8Y NNN · Q3 2024 · <strong>€24.0M → Cap Rate 4.85%</strong>' },
          { num:'④', texto:'Ajuste: Madrid prime vs Zaragoza secondary = +40-60 bps · WAULT similar · Tamaño similar' },
        ], resultado:'Cap Rate justificado activo objetivo: ~5.35%. Rango 5.25-5.50% consistente.' },
      ],
    },
    {
      num:'7.4', titulo:'MSCI/IPD, INREV y Benchmarking Institucional', sub:'Total Return · Performance',
      bloques:[
        { t:'tabla', cols:['Índice / Organización','Qué mide','Quién lo usa','Frecuencia'], rows:[
          ['MSCI Real Estate (ex-IPD)','Rentabilidad total de portfolios inmobiliarios directos','Fondos, pensiones, aseguradoras — benchmark global','Trimestral/Anual'],
          ['INREV','Performance de fondos no cotizados europeos','GP y LP de fondos PERE europeos','Trimestral'],
          ['EPRA (cotizadas)','Índice de REITs y SOCIMIs europeos cotizados','Inversores en RV inmobiliaria cotizada','Diario (bolsa)'],
          ['Green Street','Analista independiente REIT cotizados, NAV y pricing','Gestores cotizados, hedge funds','Continuo'],
        ]},
        { t:'formula', label:'Rentabilidad Total (Total Return) — MSCI', main:'Total Return = Income Return + Capital Return', sub:'Income Return = NOI / Valor activo · Capital Return = (Valor final − Valor inicial) / Valor inicial' },
      ],
    },
    {
      num:'7.5', titulo:'Cómo Escribir un Investment Memo', sub:'IC Paper · Executive Summary · Recommendation',
      bloques:[
        { t:'tabla', cols:['Sección del Memo','Contenido requerido','Extensión'], rows:[
          ['Executive Summary','Activo, precio, cap rate, IRR clave, tesis en 3 frases','Half page'],
          ['Property Description','Dirección, SBA, año construcción, especificaciones, ESG','1 página'],
          ['Tenant & Income Analysis','Inquilinos, renta passing, ERV, WAULT, vencimientos','1 página + tabla'],
          ['Market Context','Mercado (take-up, vacancy, prime rent), comps, posicionamiento','1 página'],
          ['Financial Analysis','Modelo DCF: NOI proyectado, exit cap, IRR, EM, NPV','1-2 páginas + Excel'],
          ['Capital Structure','LTV, coste deuda, DSCR, financiador propuesto','Half page'],
          ['Risk Factors','Riesgo de vacante, reversión renta, mercado, ESG','Half page'],
          ['Recommendation','Buy / Pass / Conditional (y a qué precio)','1 párrafo'],
        ]},
        { t:'ejemplo', titulo:'Executive Summary — Ejemplo Real', pasos:[
          { num:'①', texto:'<strong>Activo:</strong> Nave logística 25.000 m², PLAZA Zaragoza. Año 2021. BREEAM Very Good.' },
          { num:'②', texto:'<strong>Inquilino:</strong> Inditex SA (Investment Grade, BBB+). NNN. Renta €4.20/m²/mes. WAULT: 8.2 años.' },
          { num:'③', texto:'<strong>Precio:</strong> €20.5M · Cap Rate: 5.20% · LTV: 55% (€11.3M, Euribor+2.0%)' },
          { num:'④', texto:'<strong>Returns:</strong> IRR Unleveraged 8.4% · IRR Leveraged 12.8% · EM 1.85x · NPV +€1.2M a tasa 8%' },
        ], resultado:'Recomendación: COMPRAR. Retornos core+ con arrendatario IG, mercado con fundamentales sólidos (vacancy PLAZA: 4.2%).' },
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 8 · Skills
// ─────────────────────────────────────────────────────────────────
{
  id:'m8', titulo:'Skills del Profesional de Capital Markets',
  descripcion:'Modelo DCF paso a paso, cómo leer y criticar un IM, pitch de inversión, fuentes de mercado y preguntas técnicas con respuestas modelo.',
  nivel:'Avanzado', tags:['Modelo','IM','Interview'],
  conceptos:[
    {
      num:'8.1', titulo:'Preguntas de Entrevista — Capital Markets / Fund Analyst', sub:'Técnicas + Mercado + Personales',
      tabs:[
        { id:'tec', label:'Técnicas', bloques:[
          { t:'p', x:'<strong>P:</strong> "¿Cómo valoras un activo logístico?"' },
          { t:'p', x:'<strong>R:</strong> Usaría dos métodos complementarios: <strong>(1) Yield method</strong>: NOI normalizado del año 1 / Cap Rate prime ajustado por calidad, inquilino y WAULT. <strong>(2) DCF a 10 años</strong>: proyecto NOIs con indexación IPC/ERV, exit cap rate conservador y descuento a la IRR objetivo. La diferencia entre ambas me dice si hay potencial de compresión o si el activo está en valor justo.' },
          { t:'p', x:'<strong>P:</strong> "¿Diferencia entre Cap Rate e IRR?"' },
          { t:'p', x:'<strong>R:</strong> Cap Rate es estático: NOI año 1 / precio, sin crecimiento ni leverage. IRR es dinámica: incluye todos los flujos futuros, crecimiento, valor de salida y efecto del apalancamiento.' },
          { t:'p', x:'<strong>P:</strong> "¿Qué es el WAULT y por qué importa en logística?"' },
          { t:'p', x:'<strong>R:</strong> Vida media contractual ponderada por renta o área. En logística, contratos largos (10-15Y BTS, 5-7Y estándar) y los inquilinos no relocalizan fácilmente. WAULT &gt;7Y con Amazon o Mercadona convierte el activo en un bono inmobiliario para un fondo core.' },
        ]},
        { id:'mkt', label:'Mercado', bloques:[
          { t:'p', x:'<strong>P:</strong> "¿Cuál es el prime yield logístico en Madrid ahora mismo y por qué está ahí?"' },
          { t:'p', x:'<strong>R:</strong> ~5.00% (2024-2025). Vino desde mínimos históricos de ~3.75% en 2022. La subida BCE 0% → 4.5% forzó expansión de ~125 bps. Con BCE bajando hacia 2.00-2.50%, el spread sobre bono español 10Y (~3.2%) vuelve a ~200 bps, próximo a la media histórica de 200-250 bps.' },
          { t:'p', x:'<strong>P:</strong> "¿Qué diferencia hay entre forward purchase y forward funding?"' },
          { t:'p', x:'<strong>R:</strong> En forward purchase el inversor compra al completarse la obra a precio fijo acordado hoy — el riesgo de construcción lo lleva el promotor. En forward funding, el inversor financia la obra por certificaciones y es propietario desde el día 1 — asume el riesgo a cambio de un precio de entrada más atractivo.' },
        ]},
        { id:'per', label:'Personales', bloques:[
          { t:'p', x:'<strong>P:</strong> "¿Por qué quieres pasar de leasing a Capital Markets / fondos?"' },
          { t:'p', x:'<strong>R:</strong> En Capital Markets trabajo con activos logísticos y de oficinas. He aprendido que los inquilinos como Amazon o DHL no deciden solo en base al precio/m² — también miran duración del contrato, cláusulas de salida y qué tipo de propietario gestiona el activo. Eso me hizo ver el inmobiliario desde la perspectiva del inversor. Mi formación en Derecho me ha dado la base analítica — entiendo contratos, estructuras jurídicas y procesos de due diligence mejor que la mayoría. Ahora quiero añadir la capa financiera — modelización, valoración, estrategia de inversión — y aplicarla desde el lado del capital.' },
        ]},
      ],
    },
    {
      num:'8.2', titulo:'Cómo Leer y Criticar un Information Memorandum (IM)', sub:'Red Flags · Normalización · Cuestionar Supuestos',
      bloques:[
        { t:'p', x:'El IM es el documento de marketing que el asesor del vendedor prepara presentando el activo en el mejor ángulo posible. Tu trabajo como analista comprador es leerlo con <em>escepticismo constructivo</em>: extraer los datos útiles y detectar lo que se omite o presenta de forma favorable.' },
        { t:'tabla', cols:['Sección del IM','Lo que el vendedor presenta','Lo que el comprador debe preguntar'], rows:[
          ['Resumen ejecutivo','Tesis positiva, yield entry atractivo','¿NOI normalizado o pasado? ¿Cuándo vencen contratos?'],
          ['WAULT','WAULT ponderado por m² (a veces mayor que por renta)','¿WAULT by income o by area? El by income es el relevante.'],
          ['Rent roll','Renta passing vs ERV','¿El ERV está apoyado por comps reales o es aspiracional? ¿Break options?'],
          ['Proyección financiera','NOI proyectado con crecimiento','¿Tasa de indexación? ¿Se incluye CAPEX de mantenimiento?'],
          ['Comps de valoración','Las mejores transacciones del mercado','¿Cuándo fueron? ¿Comparables en WAULT, inquilino, ubicación?'],
          ['Descripción del activo','Foto de lo mejor','¿Hay deferred CAPEX? ¿Qué dice la DD técnica?'],
        ]},
        { t:'info', v:'warning', icon:'⚠️', x:'<strong>Red flags habituales en IMs logísticos:</strong> (1) WAULT by area no by income. (2) Renta passing incluye rent-free periods. (3) Vencimientos concentrados ocultos. (4) ERV aspiracional. (5) CAPEX histórico bajo = deferred CAPEX latente.' },
      ],
    },
    {
      num:'8.3', titulo:'Cómo Preparar un Pitch de Inversión', sub:'Teaser · IC Paper · Sensitivity Table',
      bloques:[
        { t:'tabla', cols:['Tipo de Pitch','Quién lo prepara','Para quién','Objetivo'], rows:[
          ['Teaser (1 pág.)','Asesor sell-side','Potenciales compradores','Generar interés, NDA firmado'],
          ['Information Memorandum','Asesor sell-side','Compradores tras NDA','Presentar activo exhaustivamente'],
          ['IC Paper','Analista buy-side','Investment Committee del fondo','Aprobar o rechazar la inversión'],
          ['Pitch fundraising','GP del fondo','Potenciales LP/inversores','Captar capital para el fondo'],
        ]},
        { t:'ejemplo', titulo:'Estructura de un Pitch a un IC en 10 Slides', pasos:[
          { num:'1️⃣', texto:'<strong>Executive Summary:</strong> Activo, precio, tesis, returns en 3 líneas' },
          { num:'2️⃣', texto:'<strong>Property Snapshot:</strong> Foto aérea, specs, ubicación' },
          { num:'3️⃣', texto:'<strong>Tenant Analysis:</strong> Rent roll, WAULT chart, calidad crediticia' },
          { num:'4️⃣', texto:'<strong>Market Context:</strong> Take-up, vacancy, prime rent — 3 gráficos' },
          { num:'5️⃣', texto:'<strong>Valuation:</strong> Yield vs comps, DCF, sensitivity table' },
          { num:'6️⃣', texto:'<strong>Capital Structure:</strong> LTV, coste deuda, DSCR' },
          { num:'7️⃣', texto:'<strong>Base Case Returns:</strong> IRR unlev/lev, EM, NPV' },
          { num:'8️⃣', texto:'<strong>Scenarios:</strong> IRR en distintos exit caps y occupancies' },
          { num:'9️⃣', texto:'<strong>Risk Factors:</strong> Top 3 riesgos y mitigantes' },
          { num:'🔟', texto:'<strong>Recommendation:</strong> Buy at €Xm / Pass / Conditional' },
        ], resultado:'El IC no lee, escucha. El pitch verbal debe poder contarse en 90 segundos.' },
        { t:'info', v:'tip', icon:'💡', x:'<strong>Sensitivity Table — el slide más importante:</strong> Muestra la IRR bajo distintos escenarios de exit cap rate (filas) y occupancy al exit (columnas). El IC quiere ver: ¿en cuántos escenarios la IRR está por encima del hurdle rate? Si la mayoría supera, el deal es robusto.' },
      ],
    },
    {
      num:'8.4', titulo:'Fuentes de Mercado y Recursos para el Analista', sub:'Market Reports · Research · Rutina Informativa',
      bloques:[
        { t:'tabla', cols:['Categoría','Fuente','Frecuencia','Contenido clave'], rows:[
          ['Market Reports (gratuitos)','Savills, CBRE, JLL, Cushman & Wakefield, BNP Paribas RE','Trimestral','Take-up, vacancy, prime yield/rent'],
          ['Benchmarking institucional','MSCI Real Estate, INREV','Trimestral/Anual','Total return, NAV, benchmark'],
          ['Cotizadas / REITs','EPRA, informes anuales Prologis, SEGRO, Merlin','Trimestral','Cap rates implícitos, portfolio'],
          ['BCE / Macro','BCE website, Banco de España, INE','Mensual','Tipos, inflación, GDP'],
          ['Deal news','React News, Property EU, CoStar, Expansión','Diario','Transacciones, precios, capital'],
          ['Regulatorio ESG','SFDR, EPBD, Taxonomía EU','Según novedades','Impacto en fondos PERE'],
          ['Academia','SSRN real estate papers, IREBS, MIT CRE','Mensual','Research pricing, ciclos, ESG premium'],
        ]},
        { t:'info', v:'insight', icon:'📚', x:'<strong>Rutina semanal recomendada:</strong> Lunes 15 min React News (deals cerrados, yields). Miércoles market report si toca. Viernes 10 min comunicados BCE si hay reunión. En 3 meses, hábito que te diferencia.' },
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 9 · Valoración
// ─────────────────────────────────────────────────────────────────
{
  id:'m9', titulo:'Valoración Profesional Inmobiliaria',
  descripcion:'RICS Red Book, EVS, los 5 métodos de valoración, NAV de fondos, valoración hipotecaria ECO 805 y sensibilidades.',
  nivel:'Avanzado', tags:['RICS','NAV','Residual'],
  conceptos:[
    {
      num:'9.1', titulo:'RICS Red Book y Estándares de Valoración', sub:'Bases de Valor · Registered Valuer',
      bloques:[
        { t:'p', x:'El <strong>RICS Red Book</strong> es el estándar internacional emitido por el Royal Institution of Chartered Surveyors. En Europa coexiste con los <strong>EVS</strong> (European Valuation Standards, TEGoVA). Todo informe de valoración para inversión institucional, financiación bancaria o reporting de fondo sigue estos estándares.' },
        { t:'tabla', cols:['Concepto','Definición'], rows:[
          ['<strong>Market Value (MV)</strong>','Precio estimado al que el activo se intercambiaría en la fecha de valoración entre partes conocedoras, dispuestas y sin presión.'],
          ['<strong>Market Rent (MR)</strong>','Renta estimada para la que el activo se arrendaría en condiciones de mercado. Equivale al ERV.'],
          ['<strong>Investment Value</strong>','Valor del activo para un inversor específico, con sus supuestos propios (puede diferir del MV).'],
          ['<strong>RICS Registered Valuer</strong>','Profesional certificado RICS habilitado para firmar informes Red Book. Obligatorio para valoraciones bancarias y de fondo.'],
          ['<strong>Valoración Desktop</strong>','Actualización rápida sin visita física — usada para reporting trimestral de fondos sobre portfolio.'],
        ]},
        { t:'info', v:'law', icon:'⚖️', x:'<strong>Obligatoriedad regulatoria:</strong> Los fondos REIT/SOCIMI deben valorar sus activos con tasador externo independiente al menos una vez al año (a menudo semestralmente). Los bancos exigen valoración RICS antes de conceder financiación CRE.' },
      ],
    },
    {
      num:'9.2', titulo:'Los Cinco Métodos de Valoración', sub:'Comparación · Capitalización · DCF · Residual · Coste',
      bloques:[
        { t:'tabla', cols:['Método','Cuándo se usa','Input principal','Output'], rows:[
          ['<strong>Comparación</strong>','Activos homogéneos con comps abundantes (residencial, naves estándar)','Precio €/m² en transacciones comparables','Valor por €/m² aplicado al activo'],
          ['<strong>Capitalización (Yield Method)</strong>','Activos arrendados con flujos estables (logística, oficinas)','NOI normalizado + Cap Rate de mercado','Valor = NOI / Cap Rate'],
          ['<strong>DCF</strong>','Activos con flujos variables, vacante, valor-add','Proyección NOI + Exit Cap + Tasa descuento','NPV de todos los flujos'],
          ['<strong>Residual</strong>','Suelo, promociones, activos en desarrollo','GDV − Costes construcción − Margen promotor','Valor del suelo o proyecto'],
          ['<strong>Coste (Depreciado)</strong>','Activos especializados sin mercado (hospitales, plantas)','Coste reposición − depreciación','Depreciated Replacement Cost (DRC)'],
        ]},
        { t:'formula', label:'Método Residual — Cálculo del Valor del Suelo', main:'Valor Suelo = GDV − Costes Construcción − Costes Indirectos − Margen Promotor', sub:'GDV = Valor del activo terminado y arrendado al 100%. Margen 15-20% sobre costes en logística' },
        { t:'ejemplo', titulo:'📊 Método Residual — Nave Logística BCN', pasos:[
          { num:'①', texto:'GDV: 20.000 m² × €5.00/m²/mes × 12 / 5.00% cap rate = <strong>€24.0M</strong>' },
          { num:'②', texto:'Costes construcción: 20.000 m² × €550/m² = <strong>€11.0M</strong>' },
          { num:'③', texto:'Costes indirectos: <strong>€2.2M</strong>' },
          { num:'④', texto:'Margen promotor 15%: <strong>€1.98M</strong>' },
        ], resultado:'Valor máximo del suelo: €24.0M − €11.0M − €2.2M − €1.98M = €8.82M (≈ €441/m² de techo)' },
      ],
    },
    {
      num:'9.3', titulo:'NAV — Net Asset Value de un Fondo', sub:'GAV · NAV · EPRA · Prima/Descuento',
      bloques:[
        { t:'p', x:'El <strong>NAV</strong> es el valor neto de los activos de un fondo o SOCIMI, descontadas las deudas. Métrica de referencia para fondos abiertos y SOCIMIs cotizadas (donde el mercado puede cotizar con prima o descuento sobre NAV).' },
        { t:'formula', label:'Cálculo del NAV', main:'NAV = GAV (Gross Asset Value) − Deuda neta − Otras obligaciones', sub:'GAV = Suma del valor de mercado de todos los activos del portfolio (valoración externa RICS)' },
        { t:'tabla', cols:['Concepto','Descripción'], rows:[
          ['<strong>GAV</strong>','Suma del valor RICS de todos los activos del portfolio. Varía con el mercado.'],
          ['<strong>NAV</strong>','GAV − Deuda − Costes de salida estimados. Lo que le corresponde a los equity holders.'],
          ['<strong>EPRA NAV</strong>','Metodología estándar EPRA para REITs cotizados. Excluye derivados y ajustes de valor de la deuda.'],
          ['<strong>Prima sobre NAV</strong>','SOCIMI cotiza por encima del NAV — el mercado espera crecimiento futuro.'],
          ['<strong>Descuento sobre NAV</strong>','Cotiza por debajo — desconfianza en cartera o sector. Frecuente en retail 2020-2023.'],
        ]},
        { t:'info', v:'insight', icon:'📊', x:'<strong>Para el analista:</strong> Si una SOCIMI cotiza con descuento del 20% sobre NAV, puede ser más barato comprar la SOCIMI en bolsa que comprar activos directamente. Este arbitraje es fuente de oportunidad para fondos oportunísticos.' },
      ],
    },
    {
      num:'9.4', titulo:'Valoración para Financiación Bancaria', sub:'ECO 805 · Mortgage Value · LTV Bancario',
      bloques:[
        { t:'p', x:'En España, las valoraciones para garantía hipotecaria siguen la <strong>Orden ECO 805/2003</strong>. Tasadoras homologadas (TINSA, Savills AN, JLL, CBRE) emiten informes bajo esta norma, que difiere del Red Book RICS.' },
        { t:'tabla', cols:['Concepto','ECO 805 España','RICS Red Book'], rows:[
          ['Base de valor','Valor de Mercado + Hipotecario (MLV)','Market Value (principalmente)'],
          ['Uso principal','Garantía hipotecaria, reporting BdE','Inversión, M&A, reporting de fondos'],
          ['Enfoque valorativo','Múltiples métodos obligatorios + restricciones subida rentas','Más flexible metodológicamente'],
          ['Tasadora','Homologada por Banco de España','RICS Registered Valuer'],
        ]},
        { t:'info', v:'tip', icon:'💼', x:'<strong>Implicación práctica:</strong> Cuando un banco español financia un activo logístico, la tasación ECO puede arrojar valor inferior al del mercado libre. Si ECO da €18M sobre un activo que vale €20M, el banco prestará al 55% de €18M = €9.9M, no de €20M.' },
      ],
    },
    {
      num:'9.5', titulo:'Reversión, Fracción Arrendada y Valor Completo', sub:'Term & Reversion · Hardcore · Over/Under-rented',
      bloques:[
        { t:'p', x:'En activos donde la renta pasante difiere del ERV, la valoración profesional descompone el valor en dos capas: el <strong>term</strong> (valor de flujos contractuales hasta el vencimiento) y la <strong>reversion</strong> (valor de flujos desde el vencimiento al ERV).' },
        { t:'tabla', cols:['Situación','Renta passing vs ERV','Impacto valoración'], rows:[
          ['<strong>Under-rented</strong>','Renta passing &lt; ERV','Potencial al alza ("reversionary upside"). Valor &gt; NIY actual.'],
          ['<strong>Over-rented</strong>','Renta passing &gt; ERV','Riesgo caída renta al vencimiento. Valor &lt; NIY actual.'],
          ['<strong>At ERV</strong>','Renta passing ≈ ERV','Activo "pleno". NIY ≈ Cap Rate de mercado.'],
        ]},
        { t:'info', v:'insight', icon:'💡', x:'<strong>Ejemplo under-rented:</strong> Nave logística BCN con renta €4.00/m² (firmada 2021) y ERV €5.50/m² (+37.5%). Cap Rate sobre renta actual da valor €16.0M (NOI €960K / 6.0%). Al vencer en 3 años, renta puede subir a €5.50/m², dando NOI €1.32M / 5.25% exit cap = €25.1M. Este upside es el argumento value-add.' },
      ],
    },
    {
      num:'9.6', titulo:'Sensibilidades en Valoración y Rangos de Incertidumbre', sub:'Material Uncertainty · Sensitividad Cap Rate',
      bloques:[
        { t:'formula', label:'Sensibilidad Cap Rate → Precio', main:'ΔPrecio (%) = ΔCap Rate (bps) × (1 / Cap Rate²) × 100', sub:'Ejemplo: NOI €1M, Cap Rate 5% → Precio €20M. Si cap sube 50 bps a 5.5% → Precio €18.18M (-9.1%)' },
        { t:'tabla', cols:['Variación Cap Rate','Impacto en precio (NOI €1M)','Implicación práctica'], rows:[
          ['+25 bps (5.00% → 5.25%)','€20.0M → €19.05M (-4.8%)','Pequeña expansión, gran impacto'],
          ['+50 bps (5.00% → 5.50%)','€20.0M → €18.18M (-9.1%)','Cada 50 bps = ~10% de pérdida de valor'],
          ['+100 bps (5.00% → 6.00%)','€20.0M → €16.67M (-16.7%)','100 bps de expansión = -16.7% precio'],
          ['-50 bps (5.00% → 4.50%)','€20.0M → €22.22M (+11.1%)','Yield compression genera alfa rápido'],
        ]},
        { t:'info', v:'warning', icon:'⚠️', x:'<strong>Por qué el cap rate domina sobre el NOI:</strong> Un crecimiento de NOI del 10% sube el precio un 10%. Una compresión de 50 bps (de 5% a 4.5%) sube el precio un 11.1% sobre una base NOI sin cambio. Cuando los tipos suben y el NOI crece, pueden compensarse — pero la corrección 2022-2024 demostró que los tipos siempre ganan a corto plazo.' },
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 10 · Derecho
// ─────────────────────────────────────────────────────────────────
{
  id:'m10', titulo:'Derecho Inmobiliario y Contratos',
  descripcion:'LAU, arrendamiento comercial, Registro Propiedad, ITP/IVA/AJD, plusvalía municipal, SOCIMIs y urbanismo.',
  nivel:'Avanzado', tags:['LAU','ITP','SOCIMI'],
  conceptos:[
    {
      num:'10.1', titulo:'LAU vs Contratos de Arrendamiento Comercial', sub:'Uso Distinto Vivienda · Libertad de Pactos',
      bloques:[
        { t:'p', x:'Los contratos de arrendamiento comercial (oficinas, naves logísticas, retail) se rigen por el Título III de la <strong>Ley 29/1994 de Arrendamientos Urbanos (LAU)</strong>. Otorga amplia libertad de pactos — la negociación del contrato determina el valor del activo.' },
        { t:'tabla', cols:['Cláusula','Estándar de mercado CRE','Impacto en valoración'], rows:[
          ['<strong>Plazo</strong>','3-7 años en logística media; 10-15Y en BTS/NNN','Directamente → WAULT → Cap Rate'],
          ['<strong>Renta y actualización</strong>','€/m²/mes, actualización anual IPC con cap/collar','Determina crecimiento del NOI'],
          ['<strong>Obligado cumplimiento</strong>','Período mínimo sin opción de salida (break inversa)','WAULT efectivo para el inversor'],
          ['<strong>Break option inquilino</strong>','Derecho a rescindir en fecha específica (preaviso 6-12 meses)','Reduce WAULT efectivo → sube yield'],
          ['<strong>Garantías</strong>','Depósito (2 mensualidades) + aval bancario o garantía corporativa','Mitiga riesgo de impago en SMEs'],
          ['<strong>Estado a la entrega</strong>','"Estado visto y aceptado" vs "llave en mano equipado"','Impacta CAPEX en renovación'],
          ['<strong>Obras del arrendatario</strong>','Con consentimiento; restitución al vencer','Puede condicionar la reversión'],
          ['<strong>Subrogación/Subarriendo</strong>','Con consentimiento previo del propietario','Red flag si el IM no lo menciona'],
        ]},
        { t:'info', v:'law', icon:'⚖️', x:'<strong>Para el analista con formación jurídica:</strong> Cuando lees el rent roll de un activo logístico, verifica: (1) ¿Hay break options ocultas? (2) ¿Qué garantías tiene el arrendatario? (3) ¿Está prohibido el subarriendo? (4) ¿Cómo se actualiza la renta y tiene caps?' },
      ],
    },
    {
      num:'10.2', titulo:'Registro de la Propiedad y Cargas Reales', sub:'Folio Real · Nota Simple · Hipotecas · Servidumbres',
      bloques:[
        { t:'p', x:'Cualquier transacción institucional comienza con la obtención de la <strong>nota simple registral</strong> para verificar la titularidad, cargas y limitaciones del activo.' },
        { t:'tabla', cols:['Concepto registral','Qué es','Relevancia'], rows:[
          ['<strong>Nota simple</strong>','Extracto del folio real con titular, cargas y descripción','Punto de partida de cualquier DD legal'],
          ['<strong>Hipoteca inscrita</strong>','Garantía real sobre el inmueble a favor del prestamista','Debe cancelarse antes o simultáneamente al closing'],
          ['<strong>Servidumbre</strong>','Derecho de uso de un tercero sobre el inmueble (paso, vistas)','Puede limitar usos futuros'],
          ['<strong>Anotación preventiva</strong>','Medida cautelar judicial (embargo, demanda)','Red flag grave — impide transmisión limpia'],
          ['<strong>Condición resolutoria</strong>','Cláusula que extingue la propiedad bajo ciertos supuestos','Red flag — revisar naturaleza y vigencia'],
          ['<strong>Derecho de tanteo/retracto</strong>','Derecho preferente de compra de un tercero','Puede frustrar transacción si no se verifica antes'],
        ]},
        { t:'info', v:'tip', icon:'💼', x:'<strong>Cancelación de hipoteca en closing:</strong> Comprador lleva fondos para cancelar la hipoteca del vendedor simultáneamente en notaría. Banco prestamista emite carta de pago y se presenta en el acto. Comprador queda con el activo libre de cargas.' },
      ],
    },
    {
      num:'10.3', titulo:'Fiscalidad en Transacciones Inmobiliarias', sub:'ITP · IVA · AJD · IS · Plusvalía Municipal',
      bloques:[
        { t:'tabla', cols:['Impuesto','Cuándo aplica','Tipo / Base','Quién paga'], rows:[
          ['<strong>ITP (Transmisiones)</strong>','Transmisión entre particulares / segunda transmisión','6-10% (CCAA). Cataluña: 10%. Madrid: 6%','Comprador'],
          ['<strong>IVA + AJD</strong>','Primera transmisión del promotor, o vendedor empresario no exento','IVA 21% (activo comercial) + AJD 0.5-1.5%','Comprador (IVA deducible)'],
          ['<strong>IS / IRNR</strong>','Venta con ganancia patrimonial','IS: 25%. IRNR: 19% (no resid. UE) / 24% (resto)','Vendedor'],
          ['<strong>Plusvalía Municipal</strong>','Transmisión de terrenos urbanos','Sobre incremento valor catastral × años × tipo municipal','Vendedor (salvo pacto)'],
          ['<strong>AJD (en hipoteca)</strong>','Constitución de hipoteca','0.5-1.5% sobre responsabilidad hipotecaria','Prestatario (banco desde 2018)'],
        ]},
        { t:'info', v:'law', icon:'⚖️', x:'<strong>Renuncia a la exención de IVA (art. 20.Dos LIVA):</strong> En segunda transmisión entre empresarios, el vendedor puede <em>renunciar</em> a la exención de IVA si el comprador puede deducirlo. Permite pagar IVA 21% + AJD reducido en lugar de ITP 10% — fiscalmente más eficiente. Fondos institucionales y SOCIMIs operan habitualmente bajo esta estructura.' },
      ],
    },
    {
      num:'10.4', titulo:'Escritura Pública y Proceso Notarial', sub:'Notaría · Escritura · Otorgamiento',
      bloques:[
        { t:'p', x:'En España, la transmisión de inmuebles requiere elevarse a <strong>escritura pública</strong> ante notario para su inscripción en el Registro. El notario da fe pública y verifica la identidad y capacidad de las partes — control jurídico independiente.' },
        { t:'cycle', steps:[
          { icon:'📋', label:'SPA / Contrato privado' },
          { icon:'🏦', label:'Fondos listos' },
          { icon:'⚖️', label:'Acto notarial', activo:true },
          { icon:'📝', label:'Inscripción Registro' },
          { icon:'✅', label:'Liquidación impuestos' },
        ]},
        { t:'tabla', cols:['Elemento','Descripción'], rows:[
          ['<strong>Precio escriturado vs real</strong>','Debe coincidir. La AEAT puede revisar si el precio declarado está por debajo del valor de mercado.'],
          ['<strong>Representación de sociedades</strong>','El representante debe acreditar poder notarial suficiente para la transmisión.'],
          ['<strong>Pago del precio</strong>','Acreditado con transferencia bancaria o cheque bancario en el acto. El notario verifica.'],
          ['<strong>Cancelación cargas</strong>','Si hay hipoteca, banco presta­mista presenta carta de pago y firma cancelación simultánea.'],
          ['<strong>Primer testimonio</strong>','Copia de la escritura al comprador — válido para inscripción registral.'],
        ]},
      ],
    },
    {
      num:'10.5', titulo:'Régimen Fiscal SOCIMI en Detalle', sub:'IS 0% · Distribución · Multas',
      bloques:[
        { t:'tabla', cols:['Requisito SOCIMI (Ley 11/2009)','Detalle'], rows:[
          ['<strong>Objeto social</strong>','Adquisición, promoción y rehabilitación para arrendamiento. ≥80% ingresos de arrendamiento o dividendos de filiales SOCIMI.'],
          ['<strong>Cotización obligatoria</strong>','Mercado regulado (BME, Euronext) o sistema multilateral (BME Growth, MAB).'],
          ['<strong>Capital mínimo</strong>','€5 millones'],
          ['<strong>Distribución obligatoria</strong>','≥80% beneficios arrendamiento + ≥50% plusvalías + 100% dividendos filiales SOCIMI'],
          ['<strong>IS</strong>','0% si cumple. Si no → IS 25% ese año.'],
          ['<strong>Retención dividendos</strong>','Exenta accionistas ≥5% que tributen IS ≥10%. Gravamen especial 19% si accionista tributa &lt;10%.'],
          ['<strong>Plazo de tenencia</strong>','Activos arrendados ≥3 años. Desarrollo ≥3 años desde finalización.'],
        ]},
        { t:'info', v:'insight', icon:'📊', x:'<strong>Por qué Montepino eligió SOCIMI no listada:</strong> BME Growth permite cotizar con menor carga regulatoria que el mercado continuo (BME), manteniendo los beneficios fiscales. Es la estructura preferida para plataformas logísticas de gran escala.' },
      ],
    },
    {
      num:'10.6', titulo:'Urbanismo y Licencias', sub:'Clasificación Suelo · PGOU · Licencia Actividad',
      bloques:[
        { t:'p', x:'En activos logísticos e industriales, el urbanismo es crítico: una nave en suelo no industrial o sin licencia de actividad vigente es una bomba de relojería legal.' },
        { t:'tabla', cols:['Concepto','Qué verificar en una DD'], rows:[
          ['<strong>Clasificación suelo</strong>','Suelo urbano industrial/logístico o urbanizable — no rústico o residencial. Certificado urbanístico municipal.'],
          ['<strong>Licencia de obras</strong>','¿Está el edificio construido legalmente? ¿Coincide la realidad con la licencia? Irregularidades pueden suponer demolición.'],
          ['<strong>Licencia de actividad / apertura</strong>','¿El uso actual está amparado por licencia en vigor? Sin licencia = riesgo de cierre por denuncia.'],
          ['<strong>Certificado primera ocupación</strong>','Documento que acredita que la obra se realizó conforme a proyecto. Obligatorio para alta de suministros.'],
          ['<strong>Informe compatibilidad urbanística</strong>','¿Puede el activo usarse para la actividad prevista? Vital en reposicionamiento.'],
          ['<strong>PGOU / Plan Parcial</strong>','Plan General: determina usos, edificabilidades y restricciones.'],
        ]},
        { t:'info', v:'warning', icon:'⚠️', x:'<strong>Red flag frecuente:</strong> Naves ampliadas sin licencia de obras. El inquilino amplió la nave en 1.500 m² con permiso informal del anterior propietario, pero sin licencia municipal. El comprador asume riesgo de legalización (€30-100K+) o incluso derribo parcial.' },
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 11 · Asset Management
// ─────────────────────────────────────────────────────────────────
{
  id:'m11', titulo:'Asset Management y Reporting',
  descripcion:'El plan de negocio del activo, reporting INREV, gestión de inquilinos, CAPEX, estrategias de creación de valor y KPIs.',
  nivel:'Avanzado', tags:['Business Plan','CAPEX','GRESB'],
  conceptos:[
    {
      num:'11.1', titulo:'El Business Plan del Activo', sub:'Value Creation Plan · KPIs · Budget',
      bloques:[
        { t:'p', x:'Cada activo en el portfolio de un fondo tiene su propio <strong>Business Plan</strong> — documento que define la estrategia de gestión, hitos operativos, plan de inversión y proyecciones financieras desde la adquisición hasta la desinversión. Hoja de ruta del asset manager.' },
        { t:'tabla', cols:['Sección del Business Plan','Contenido'], rows:[
          ['<strong>1. Situación actual</strong>','Estado de contratos (rent roll), WAULT, ocupación, calidad inquilino, estado técnico'],
          ['<strong>2. Tesis de inversión</strong>','Por qué se compró, qué valor crear (extensión WAULT, reversión renta, ESG, CAPEX)'],
          ['<strong>3. Plan operativo</strong>','Gestión vencimientos, renovaciones, obras, certificaciones ESG'],
          ['<strong>4. Plan financiero</strong>','Presupuesto NOI, CAPEX proyectado, deuda (refi prevista), distribuciones'],
          ['<strong>5. Estrategia de salida</strong>','Timing venta, buyer universe, precio objetivo, estructura (asset vs share)'],
          ['<strong>6. KPIs y métricas</strong>','NOI vs budget, WAULT, ocupación, DSCR, cap rate implícito, IRR proyectada'],
        ]},
        { t:'info', v:'tip', icon:'💼', x:'<strong>En la práctica:</strong> El asset manager actualiza el business plan al menos trimestralmente. Cualquier desviación significativa (inquilino en dificultades, CAPEX mayor, cambio de mercado) debe escalarse al IC con plan de acción.' },
      ],
    },
    {
      num:'11.2', titulo:'Reporting Trimestral a Inversores', sub:'LP Reporting · INREV · Métricas Clave',
      bloques:[
        { t:'p', x:'El <strong>reporting trimestral</strong> es la comunicación obligatoria del GP hacia los LP. Las guías <strong>INREV</strong> establecen un estándar europeo. La calidad del reporting es un diferenciador crítico del GP al levantar capital para un nuevo fondo.' },
        { t:'tabla', cols:['Sección del Report','Contenido típico'], rows:[
          ['<strong>Fund overview</strong>','NAV, GAV, leverage, IRR proyectada actualizada, equity llamado y distribuido'],
          ['<strong>Portfolio summary</strong>','Lista de activos, valoraciones, variación trimestral, ocupación, WAULT'],
          ['<strong>Performance vs business plan</strong>','NOI real vs budget, CAPEX ejecutado, hitos'],
          ['<strong>Market commentary</strong>','Contexto macro y de mercado relevante'],
          ['<strong>Transacciones</strong>','Adquisiciones, desinversiones, refinanciaciones'],
          ['<strong>Financial statements</strong>','Balance, P&L, cash flows del fondo'],
          ['<strong>ESG update</strong>','Progreso SFDR, GRESB score, certificaciones'],
        ]},
        { t:'info', v:'insight', icon:'📊', x:'<strong>GRESB (Global Real Estate Sustainability Benchmark):</strong> Estándar internacional ESG de fondos inmobiliarios. Más de 2.000 fondos participan. Los LP institucionales exigen puntuación mínima (>60/100) para incluir un fondo en su portfolio.' },
      ],
    },
    {
      num:'11.3', titulo:'CAPEX Planning y Deferred Maintenance', sub:'CapEx vs OpEx · Reserves · Lifecycle',
      bloques:[
        { t:'tabla', cols:['Tipo','Qué es','Tratamiento financiero'], rows:[
          ['<strong>CAPEX de mejora</strong>','Inversiones que aumentan valor o rendimiento (panel solar, BREEAM)','Se activa en balance, no reduce NOI. Mejora Exit Cap Rate.'],
          ['<strong>CAPEX de mantenimiento</strong>','Inversión para mantener el estado (cubierta, instalaciones)','Se activa si significativo. Restar del NOI para "normalized NOI".'],
          ['<strong>Deferred Maintenance</strong>','CAPEX que debía hacerse y no se hizo — acumula como riesgo','Red flag en DD. Puede suponer ajuste del precio (price chip).'],
          ['<strong>CapEx Reserve</strong>','Provisión anual en modelo para CAPEX futuro','Se resta del NOI (€3-5/m²/año en logística)'],
        ]},
        { t:'ejemplo', titulo:'CAPEX como argumento de precio chip en DD', pasos:[
          { num:'①', texto:'DD técnica detecta: cubierta agotada (€800K), eléctrica obsoleta (€350K), contra incendios (€200K).' },
          { num:'②', texto:'Total deferred maintenance: <strong>€1.35M</strong>' },
          { num:'③', texto:'Argumento al vendedor: price chip de €1.35M sobre €18M → precio final <strong>€16.65M</strong>' },
        ], resultado:'El price chip por deferred maintenance es una de las palancas de negociación más efectivas post-DD.' },
      ],
    },
    {
      num:'11.4', titulo:'Estrategias de Creación de Valor durante el Hold Period', sub:'Lease Extension · Reversión · ESG · Refi',
      bloques:[
        { t:'p', x:'La diferencia entre un fondo core con 7% IRR y uno core+ con 12% está en la ejecución de las estrategias de creación de valor durante el hold period.' },
        { t:'tabla', cols:['Estrategia','Cómo se ejecuta','Impacto en valor'], rows:[
          ['<strong>Extensión de WAULT</strong>','Negociar renovación anticipada del inquilino a cambio de pequeñas concesiones','WAULT +3-4 años → Cap Rate −25/50 bps → Precio +5-10%'],
          ['<strong>Reversión de renta</strong>','Al vencer, re-arrendar al ERV de mercado (superior a passing)','NOI +10-40% dependiendo del gap → Valor proporcional'],
          ['<strong>ESG upgrade</strong>','Panel solar + LED + cargadores → obtener BREEAM','Green premium: cap rate −10/20 bps + inquilinos más solventes'],
          ['<strong>Densificación</strong>','Ampliar el activo si hay suelo disponible','Nuevo NOI sobre CAPEX invertido'],
          ['<strong>Cambio de uso</strong>','De almacén industrial a cross-dock o data center','Cambio de perfil de demanda y yield implícito'],
          ['<strong>Refinanciación</strong>','Si tipos bajan, renegociar la deuda','Mejora IRR leveraged y permite cash-out refi'],
        ]},
        { t:'info', v:'insight', icon:'⚡', x:'<strong>La extensión de WAULT es la más potente:</strong> Si el fondo compra un activo con WAULT 4 años a Cap Rate 5.5% y logra extender a WAULT 7 años, el activo pasa a cotizar a ~5.0% — ganancia de precio ~9% sin necesidad de subir rentas ni bajar tipos.' },
      ],
    },
    {
      num:'11.5', titulo:'KPIs del Asset Manager y Medición de Performance', sub:'Total Return · Income · Capital · J-Curve',
      bloques:[
        { t:'tabla', cols:['KPI','Cómo se calcula','Benchmark referencia'], rows:[
          ['<strong>Total Return</strong>','(NOI + Variación valor) / Valor inicio','MSCI Spain Logistics (trimestral)'],
          ['<strong>Income Return</strong>','NOI / Valor activo inicio período','~4.5-5.5% para logística prime ES 2024'],
          ['<strong>Capital Return</strong>','(Valor fin − Valor inicio) / Valor inicio','Negativo 2022-2023; recuperando 2024-2025'],
          ['<strong>Occupancy rate</strong>','Sup. arrendada / Sup. total','&gt;95% para activos core; 85-95% core+'],
          ['<strong>Budget variance (NOI)</strong>','(NOI real − budget) / NOI budget','±5% aceptable; &gt;±10% requiere explicación al IC'],
          ['<strong>WAULT evolution</strong>','WAULT actual vs entry','Objetivo: mantener o aumentar durante hold'],
          ['<strong>IRR to date</strong>','IRR con flujos reales + estimación salida','Comparar vs IRR proyectada en IC Paper original'],
        ]},
        { t:'info', v:'warning', icon:'⚠️', x:'<strong>El "J-curve" de la IRR:</strong> En un fondo PERE, la IRR to date es negativa los primeros 2-3 años (capital llamado, gastos, sin distribuciones). Es normal — los LP lo saben. El punto de inflexión llega cuando NOIs cubren gastos y la apreciación se materializa.' },
      ],
    },
  ],
},

// ─────────────────────────────────────────────────────────────────
// MÓDULO 12 · Alternativos
// ─────────────────────────────────────────────────────────────────
{
  id:'m12', titulo:'Mercados Alternativos y Tendencias 2025+',
  descripcion:'BTR, data centers, life sciences, self-storage, SFDR/Taxonomía EU, stranded assets y el futuro del capital institucional.',
  nivel:'Avanzado', tags:['BTR','DataCenters','SFDR'],
  conceptos:[
    {
      num:'12.1', titulo:'Build-to-Rent (BTR) y el Sector Living', sub:'Multifamily · Coliving · Senior · Affordable',
      bloques:[
        { t:'p', x:'El sector <strong>Living</strong> (residencial en alquiler institucional) se ha convertido en el sector alternativo más voluminoso en España. Impulsado por presión de demanda, escasez de oferta y housing asequible.' },
        { t:'tabla', cols:['Subsector','Descripción','Prime Yield ES 2024','Riesgo clave'], rows:[
          ['<strong>BTR/Multifamily</strong>','Edificios de vivienda en alquiler gestionados profesionalmente','3.5-4.0% (prime)','Regulación de precios (Ley Vivienda 2023)'],
          ['<strong>Coliving</strong>','Habitaciones privadas con zonas comunes','4.5-5.5%','Incertidumbre regulatoria; demanda jóvenes'],
          ['<strong>Student Housing</strong>','Residencias para universitarios','4.0-5.0%','Temporalidad, vacante verano'],
          ['<strong>Senior Living</strong>','Residencias y apartamentos para mayores','4.5-5.5%','Regulación sanitaria, gestión operacional'],
        ]},
        { t:'info', v:'warning', icon:'⚠️', x:'<strong>Ley de Vivienda 2023 — Riesgo Regulatorio BTR:</strong> La Ley 12/2023 permite limitar rentas en "zonas tensionadas". Cataluña ya las declaró. Frena inversión BTR en Barcelona, empuja capital hacia Madrid, Valencia y Málaga. Es un riesgo sistémico que todo análisis BTR debe incorporar.' },
      ],
    },
    {
      num:'12.2', titulo:'Data Centers e Infraestructura Digital', sub:'Hyperscale · Edge · Colocation · MW · PUE',
      bloques:[
        { t:'p', x:'Los <strong>data centers</strong> son el activo alternativo de mayor crecimiento, impulsados por cloud, IA generativa y digitalización. Activos altamente especializados con barreras de entrada elevadas, contratos largos y arrendatarios de máxima calidad.' },
        { t:'tabla', cols:['Concepto','Descripción'], rows:[
          ['<strong>Hyperscale</strong>','Centros de enorme escala (&gt;100 MW) para AWS, Azure, Google. Lease o sale-leaseback largo.'],
          ['<strong>Colocation</strong>','Espacio alquilado a múltiples clientes empresariales. Modelo "housing" de servidores.'],
          ['<strong>Edge</strong>','Centros pequeños cerca del usuario final para baja latencia. Last-mile de datos.'],
          ['<strong>MW (Megavatios)</strong>','Unidad de capacidad — más relevante que m² como métrica de valoración.'],
          ['<strong>PUE</strong>','Ratio eficiencia energética: 1.0 = perfecto, &gt;1.5 = ineficiente.'],
          ['<strong>Prime yield 2024</strong>','Madrid 4.50-5.25% · Barcelona 4.75-5.50%. Demanda &gt;&gt; escasez energía disponible.'],
        ]},
        { t:'info', v:'insight', icon:'💡', x:'<strong>El cuello de botella en España:</strong> La limitación principal NO es el suelo — es la capacidad de la red eléctrica. Proyectos &gt;10 MW pueden esperar 3-5 años para obtener acometida. Esto crea barrera de entrada gigante y protege el valor de activos ya operativos.' },
      ],
    },
    {
      num:'12.3', titulo:'Life Sciences, Healthcare y Activos Operacionales', sub:'Laboratorios · Clínicas · Residencias',
      bloques:[
        { t:'p', x:'Los activos <strong>Life Sciences</strong> (laboratorios, parques biofarmacéuticos) y <strong>Healthcare</strong> (clínicas, hospitales, residencias asistidas) son sectores de alta especialización y creciente demanda institucional.' },
        { t:'tabla', cols:['Sector','Características','Yield ES 2024'], rows:[
          ['<strong>Laboratorios / Life Sciences</strong>','Inquilinos farma/biotech. CAPEX intensivo (BTS). España incipiente.','5.5-7.0%'],
          ['<strong>Residencias Asistidas (DoC)</strong>','Gestionadas por operadores sanitarios. Doble riesgo: inmobiliario + operacional.','5.0-6.0%'],
          ['<strong>Clínicas / Hospitales privados</strong>','Sale-leaseback de grandes grupos (Quirón, HM). Contratos largos (20-30Y).','5.0-5.75%'],
          ['<strong>Parques científicos/tec.</strong>','Mix oficinas/laboratorios. UAB, Parc Taulí en BCN — ecosistema con universidad.','5.5-7.0%'],
        ]},
        { t:'info', v:'tip', icon:'💼', x:'<strong>El riesgo operacional:</strong> En hotel o clínica, valor del activo y del negocio están entrelazados. Si el operador quiebra, el activo puede quedar vacío sin operador — requiere licencias sanitarias y personal especializado. Este "operacional risk" se refleja en yields más altos.' },
      ],
    },
    {
      num:'12.4', titulo:'Self-Storage y Otros Alternativos', sub:'Car Parks · Renewable · Telecom Towers',
      bloques:[
        { t:'tabla', cols:['Activo','Modelo','Yield indicativa','Atractivo'], rows:[
          ['<strong>Self-storage</strong>','Alquiler módulos a particulares/pymes. Operacional intensivo','5.5-7.5%','Contratos cortos = rápida adaptación inflación; alta demanda urbana'],
          ['<strong>Car Parks / Garajes</strong>','Ingresos por rotación o abonos. Sensible a electrificación','5.5-7.0%','Diversificación; opcionalidad cambio de uso'],
          ['<strong>Renewable Energy (suelo)</strong>','Suelo arrendado para plantas solares/eólicos. Contratos 20-30Y','4.0-5.5%','Cash flows ultra predecibles; mandatos ESG'],
          ['<strong>Torres telecom</strong>','Sale-leaseback de torres (5G). Contratos muy largos','3.5-5.0%','Arrendatarios AAA; 20Y+; correlación negativa con ciclo'],
        ]},
        { t:'info', v:'insight', icon:'📈', x:'<strong>La macro-tendencia "real assets":</strong> Los fondos de pensiones e inversores soberanos están aumentando exposición a "real assets" (inmobiliario + infraestructura + energías renovables) hasta 20-30% de sus portfolios. Esto crea demanda masiva para activos con flujos predecibles indexados a inflación.' },
      ],
    },
    {
      num:'12.5', titulo:'ESG Avanzado — SFDR, Taxonomía y Net Zero', sub:'Art 8/9 · EU Taxonomy · Stranded Assets',
      bloques:[
        { t:'p', x:'La regulación ESG europea está transformando el mercado a velocidad sin precedentes. Los fondos que no adapten sus portfolios a la <strong>Taxonomía UE</strong> y <strong>SFDR</strong> tendrán dificultades para captar capital institucional europeo.' },
        { t:'tabla', cols:['Marco regulatorio','Qué exige','Impacto en Capital Markets'], rows:[
          ['<strong>SFDR Art. 6</strong>','Fondos que no integran ESG activamente','Cada vez más difícil captar capital de pensiones europeas'],
          ['<strong>SFDR Art. 8</strong>','Fondos que "promueven" características ESG','Estándar mínimo exigido por la mayoría de LP institucionales'],
          ['<strong>SFDR Art. 9</strong>','Fondos con "objetivo de inversión sostenible" explícito','Premium de captación; exige máxima transparencia'],
          ['<strong>EU Taxonomy</strong>','Define qué actividades son "sostenibles"','Activos "taxonomy-aligned" acceden a Green Bonds a menor coste'],
          ['<strong>EPBD</strong>','Edificios comerciales deben mejorar EPC hasta 2030/2033','Activos con EPC bajo (F/G) → riesgo de "stranded asset"'],
        ]},
        { t:'info', v:'warning', icon:'⚠️', x:'<strong>Stranded Assets — el riesgo creciente:</strong> Inmueble que pierde valor o liquidez por no poder cumplir requisitos energéticos futuros. Nave 2005 sin BREEAM puede convertirse en stranded asset a medida que los mandatos institucionales se endurecen. Brown discount actual 25-75 bps puede llegar a 100-200 bps en 5-7 años.' },
      ],
    },
  ],
},

]

// ═══════════════════════════════════════════════════════════════════
// GLOSARIO · 75+ términos
// ═══════════════════════════════════════════════════════════════════
export const GLOSARIO = [
  ['Cap Rate','Tasa de Capitalización','NOI anual / precio de mercado. Mide rendimiento sin apalancamiento. Relación inversa con el precio.'],
  ['NOI','Ingresos Netos Operativos','Ingresos brutos − gastos operativos. Pre-deuda, pre-amortización, pre-impuestos.'],
  ['IRR / TIR','Tasa Interna de Retorno','Tasa que hace VAN=0. Rendimiento anualizado compuesto incluyendo timing de flujos.'],
  ['NPV / VAN','Valor Actual Neto','Suma de flujos futuros descontados − inversión inicial. >0 → inversión rentable.'],
  ['WAULT','Duración Media Ponderada','Σ(Renta_i × Años_i) / Renta Total. Driver crítico de pricing en logística.'],
  ['NIY','Yield Neto Inicial','Equivalente europeo del Cap Rate: NOI / (precio + costes de adquisición).'],
  ['ERV','Renta Estimada de Mercado','Renta a la que arrendaría hoy. Base del Reversionary Yield.'],
  ['Reversionary Yield','Yield Reversivo','ERV / Precio. Potencial yield si todas las rentas llegan al nivel de mercado.'],
  ['Exit Cap Rate','Tasa Capitalización Salida','Cap Rate al vender al final del hold. Driver más sensible del DCF.'],
  ['LTV','Loan-to-Value','Importe del préstamo / Valor del activo. Bancos CRE: 55-65% máximo.'],
  ['LTC','Loan-to-Cost','Importe del préstamo / Coste total del proyecto. Usado en desarrollos sin MV establecido.'],
  ['DSCR','Debt Service Coverage Ratio','NOI / servicio anual deuda. Mínimo bancario: 1.25x.'],
  ['ICR','Interest Coverage Ratio','NOI / intereses anuales. Similar al DSCR sin amortización.'],
  ['NNN / Triple Net','Triple Neto','Inquilino paga IBI + seguros + mantenimiento. NOI ≈ renta bruta.'],
  ['DCF','Flujos de Caja Descontados','Método de valoración que descuenta flujos futuros a la tasa requerida.'],
  ['Equity Multiple','Múltiplo del Capital','Total capital recibido / capital invertido. EM 2.0x = se dobla la inversión.'],
  ['Asset Deal','Compraventa de Activo','Transmisión directa del inmueble. Tributa ITP (6-10%) o IVA (21%).'],
  ['Share Deal','Compraventa de Sociedad','Adquisición de la sociedad propietaria. Exento ITP/IVA bajo art. 314 LMV.'],
  ['Forward Purchase','Compra Forward','Acuerdo de comprar un activo al PC. Promotor asume riesgo construcción.'],
  ['Forward Funding','Financiación Forward','Inversor financia por certificaciones siendo propietario desde inicio.'],
  ['Sale & Leaseback','Venta con Retroarrendamiento','Propietario-ocupante vende y firma arrendamiento NNN largo plazo.'],
  ['SPA','Share/Asset Purchase Agreement','Documento principal de la transacción.'],
  ['LOI','Letter of Intent','Términos económicos previos al SPA. Generalmente no vinculante.'],
  ['Heads of Terms','Términos Principales','Marco económico antes de la negociación formal del SPA.'],
  ['Due Diligence','Diligencia Debida','Verificación técnica, legal, fiscal y ambiental antes del cierre.'],
  ['Information Memorandum','Memorando de Información','Documento marketing del activo: descripción, financieros, WAULT, tesis.'],
  ['Data Room','Sala de Datos','Repositorio virtual con documentación del activo para DD.'],
  ['Capital Stack','Estructura de Capital','Capas por seniority: senior debt, mezz, preferred equity, common equity.'],
  ['Senior Debt','Deuda Senior','Primera en cobrar. LTV 0-55%. Coste más bajo.'],
  ['Mezzanine Debt','Deuda Mezzanine','Subordinada entre senior y equity. LTV 55-70%. Coste 8-14%.'],
  ['Preferred Equity','Capital Preferente','Entre mezz y equity común. Coste 12-16%.'],
  ['Common Equity','Capital Ordinario','Capa más junior. Primero en absorber pérdidas, último en cobrar.'],
  ['GP — General Partner','Socio General / Gestora','Gestora del fondo. Aporta 1-5% del capital, gestiona el 100%.'],
  ['LP — Limited Partner','Socio Comanditario','Inversores del fondo. Aportan capital sin gestionar.'],
  ['Carried Interest','Carry','% beneficios al GP tras superar hurdle. Típico 20% del upside.'],
  ['Hurdle Rate','Tasa Mínima de Retorno','IRR mínima a LP. Típicamente 6-8%.'],
  ['Waterfall','Cascada de Distribución','Orden: return of capital → preferred → catch-up → split 80/20.'],
  ['SOCIMI','REIT español','IS 0% si distribuye 80%+ benef. arrendamiento.'],
  ['REIT','Real Estate Investment Trust','Vehículo cotizado. SOCIMI = equivalente español.'],
  ['PERE','Private Equity Real Estate','Fondos cerrados con estrategias value-add u oportunísticas.'],
  ['Core Strategy','Estrategia Core','Activos prime estabilizados. IRR 6-9%. LTV 40-50%.'],
  ['Value-Add Strategy','Estrategia Value-Add','Activos con potencial de mejora. IRR 12-18%. LTV 55-65%.'],
  ['Opportunistic Strategy','Estrategia Oportunística','Mayor riesgo y retorno. IRR 18-25%+. LTV 65-75%+.'],
  ['Yield Compression','Compresión de Yields','Caída de cap rates, subida de precios. España 2018-2022.'],
  ['Yield Expansion','Expansión de Yields','Subida de cap rates, bajada de precios. Europa 2022-2023.'],
  ['Prime Yield','Yield Prime','Cap rate de referencia del activo de máxima calidad.'],
  ['Yield Spread','Diferencial de Yield','Cap rate inmobiliario − bono soberano 10Y. Media histórica: 200-250 bps.'],
  ['Take-up','Absorción Neta','m² arrendados en un período. Indicador de demanda ocupacional.'],
  ['Vacancy Rate','Tasa de Vacancia','% espacio disponible. <5% logística = tenso.'],
  ['BREEAM','Certificación BREEAM','Estándar ESG dominante en inmobiliario europeo.'],
  ['LEED','Certificación LEED','Estándar ESG americano, presente en algunos activos en España.'],
  ['CMBS','Commercial Mortgage-Backed Securities','Instrumentos respaldados por portfolios de hipotecas comerciales.'],
  ['BTS','Build-to-Suit','Construcción a medida con contrato pre-firmado.'],
  ['Practical Completion','Certificado Fin de Obra','Hito clave en forward purchase/funding.'],
  ['AUM','Assets Under Management','Valor total de los activos que gestiona un fondo.'],
  ['NAV','Net Asset Value','Valor neto del fondo (GAV − Deuda neta).'],
  ['GAV','Gross Asset Value','Suma del valor RICS de todos los activos del portfolio.'],
  ['Management Fee','Comisión de Gestión','Fee anual GP sobre capital comprometido. Típico 1.0-2.0%.'],
  ['Separate Account','Cuenta Separada','Mandato exclusivo de un único cliente institucional.'],
  ['JV — Joint Venture','Empresa Conjunta','Vehículo de coinversión. Capital partner + Operating partner.'],
  ['Club Deal','Club Deal','Coinversión de 3-6 inversores sin vehículo formal.'],
  ['Off-market','Fuera de Mercado','Activo vendido directamente sin proceso competitivo.'],
  ['Escrow','Cuenta de Garantía','Depósito de parte del precio hasta cumplir CP del SPA.'],
  ['Reps & Warranties','Declaraciones y Garantías','Declaraciones del vendedor en el SPA con indemnización.'],
  ['Conditions Precedent','Condiciones Suspensivas','Condiciones para que el cierre sea obligatorio.'],
  ['Escritura Notarial','Escritura Notarial','Documento público que formaliza la transmisión en España.'],
  ['ITP','Impuesto Transmisiones','6-10% según CCAA. No deducible.'],
  ['MSCI / IPD','Índices Inmobiliarios','Benchmark global rendimiento portfolios directos.'],
  ['INREV','INREV','Asociación europea fondos no cotizados. Estándar reporting.'],
  ['Bullet Loan','Préstamo Bullet','Solo intereses durante el plazo, principal íntegro al vencimiento.'],
  ['Investment Grade','Grado de Inversión','Rating BBB- o superior. Comprime yields 75-150 bps.'],
  ['Cash-on-Cash Yield','Rentabilidad Cash sobre Cash','(NOI − Intereses) / Equity invertido. Rendimiento corriente.'],
  ['PLAZA Zaragoza','Plataforma Logística Aragón','Mayor plataforma logística España. Cruce A-2/AP-68.'],
  ['Prologis','Prologis','Mayor REIT logístico mundial. Líder en España.'],
  ['SEGRO','SEGRO','REIT logístico Londres. Especializado urban y big-box.'],
  ['Montepino','Montepino','División logística Merlin. SOCIMI no listada >2M m² SBA.'],
  ['EPRA NAV','EPRA NAV','Metodología estándar EPRA para REITs cotizados.'],
  ['RICS Red Book','RICS Red Book','Estándar internacional de valoración del Royal Institution of Chartered Surveyors.'],
  ['Material Uncertainty','Material Valuation Uncertainty','Cláusula RICS cuando hay evidencia insuficiente de mercado.'],
  ['Stranded Asset','Activo Varado','Inmueble que pierde valor por no cumplir futuros requisitos ESG.'],
  ['SFDR','Sustainable Finance Disclosure Reg.','Marco UE de divulgación ESG para productos financieros. Art. 6/8/9.'],
  ['EU Taxonomy','Taxonomía UE','Reglamento que define actividades sostenibles.'],
  ['EPBD','Energy Performance Buildings Directive','Directiva UE eficiencia energética edificios.'],
  ['GRESB','GRESB','Global Real Estate Sustainability Benchmark. >60/100 mínimo institucional.'],
  ['BTR','Build-to-Rent','Edificios residenciales construidos específicamente para alquiler institucional.'],
  ['Hyperscale','Hyperscale Data Center','Centros >100 MW para cloud providers globales.'],
  ['PUE','Power Usage Effectiveness','Ratio eficiencia energética data center. 1.0 = perfecto.'],
  ['Term & Reversion','Term & Reversion','Método de valoración con dos capas: contractual + reversión a ERV.'],
  ['ECO 805','Orden ECO 805/2003','Norma española de valoración hipotecaria. Tasadoras homologadas BdE.'],
]

// ═══════════════════════════════════════════════════════════════════
// QUIZZES · 10 preguntas por módulo (12 × 10 = 120 preguntas)
// ═══════════════════════════════════════════════════════════════════
export const QUIZZES = {
m1: [
  { q:'¿Cuál es la principal diferencia entre Capital Markets y Leasing inmobiliario?',
    opts:['El tipo de activo gestionado','Capital Markets se centra en el activo como instrumento financiero (flujos, IRR, Cap Rate), el leasing en comercializar m²','Capital Markets solo funciona en oficinas','No hay diferencia real'],
    c:1, e:'En Capital Markets el activo es un generador de flujos valorado por Cap Rate, IRR y DCF. En leasing, el objetivo es arrendar m². Son lógicas distintas.' },
  { q:'¿Qué significa que el Cap Rate "comprima"?',
    opts:['Que el NOI baja','Que el precio del activo sube (yield más bajo)','Que el activo tiene más vacante','Que la deuda es más cara'],
    c:1, e:'Compresión de yield = yield más bajo = precio más alto. Precio = NOI/Cap Rate.' },
  { q:'¿Cuál de estos es un REIT logístico activo en España?',
    opts:['Blackstone (PERE)','Prologis','AXA IM (gestora)','Cerberus (PERE oportunístico)'],
    c:1, e:'Prologis es el mayor REIT logístico del mundo y líder en España. Blackstone y Cerberus son fondos PERE. AXA IM es gestora institucional.' },
  { q:'¿Qué es una SOCIMI?',
    opts:['Un contrato de arrendamiento especial','El equivalente español del REIT — cotizado con 0% IS si distribuye 80%+ beneficios','Un tipo de hipoteca comercial','Una certificación ESG'],
    c:1, e:'SOCIMI = REIT español. Tributa 0% IS si distribuye 80%+ de beneficios de arrendamiento.' },
  { q:'El ciclo de inversión inmobiliario sigue este orden:',
    opts:['Gestión → Compra → Venta','Origination → DD → Closing → Asset Mgmt → Exit','Closing → DD → Origination','Venta → Compra → Gestión'],
    c:1, e:'Ciclo estándar: identificación, DD, cierre, gestión, creación de valor, exit.' },
  { q:'¿Cuál es el spread históricamente equilibrado entre prime yield logístico y bono español 10Y?',
    opts:['50-100 bps','500-600 bps','200-250 bps','10-20 bps'],
    c:2, e:'El spread histórico es 200-250 bps. En 2022 se comprimió a ~95 bps. En 2024 se recupera hacia ~180 bps.' },
  { q:'¿Qué tipo de inversor busca contratos logísticos NNN con WAULT >10Y e investment-grade?',
    opts:['Fondos PERE oportunísticos','Family offices €5-20M','Fondos de pensiones y aseguradoras (core, 6-9% IRR)','Fondos distressed'],
    c:2, e:'Pensiones y aseguradoras tienen pasivos largos y buscan activos core: NNN, WAULT largo, investment-grade.' },
  { q:'¿Qué ratio mide la capacidad de un activo para pagar el servicio de su deuda?',
    opts:['LTV','Cap Rate','DSCR — Debt Service Coverage Ratio','WAULT'],
    c:2, e:'DSCR = NOI / Servicio Anual de la Deuda. Mínimo bancario: 1.25x.' },
  { q:'En un proceso estructurado de Capital Markets, ¿cuándo se distribuye el Information Memorandum?',
    opts:['Antes de firmar el NDA','Tras NDA firmado, en fase de marketing a compradores cualificados','Solo en el closing','Después de la escritura notarial'],
    c:1, e:'IM se distribuye tras NDA. Proceso: Mandato → IM → Teaser → NDA → IM → Ofertas → DD → Vinculante → Closing.' },
  { q:'Si el NOI es €900.000 y el Cap Rate prime logístico es 5%, ¿cuál es el valor del activo?',
    opts:['€4.500.000','€18.000.000','€9.000.000','€45.000.000'],
    c:1, e:'Precio = NOI / Cap Rate = €900K / 0.05 = €18M.' },
],
m2: [
  { q:'¿Qué partidas NO se restan para calcular el NOI?',
    opts:['IBI del propietario','Intereses de la deuda hipotecaria','Seguro del edificio','Gestión del activo'],
    c:1, e:'NOI es pre-deuda, pre-amortización, pre-IS. Sí: IBI, seguros, gestión, vacante.' },
  { q:'Nave logística con NOI €1.2M. Si la compramos a Cap Rate 5%, ¿precio de compra?',
    opts:['€6.000.000','€24.000.000','€1.200.000','€60.000.000'],
    c:1, e:'Precio = €1.2M / 0.05 = €24M. Multiplicador implícito 20x el NOI.' },
  { q:'¿Cuál es la diferencia clave entre Cap Rate e IRR?',
    opts:['No hay diferencia','Cap Rate mide año 1 (estático, sin leverage); IRR es dinámica (incluye crecimiento, exit, leverage)','Cap Rate es siempre mayor','IRR solo aplica a fondos cerrados'],
    c:1, e:'Cap Rate = NOI año 1 / Precio. IRR captura todos los flujos futuros, valor de salida y leverage.' },
  { q:'¿Qué significa un WAULT de 8 años en logística prime?',
    opts:['El activo tiene 8 años','Quedan de media 8 años de vida contractual ponderada — seguridad de ingresos para inversores core','El activo tiene 8 inquilinos','Próxima revisión en 8 años'],
    c:1, e:'WAULT = vida media contractual ponderada por renta. >7Y → premium pricing (activo casi "bono inmobiliario").' },
  { q:'¿Qué es el Exit Cap Rate en un modelo DCF?',
    opts:['Cap Rate de entrada','Cap Rate asumido al vender al final del hold — determina el valor terminal','Cap Rate máximo del banco','Cap Rate medio del año 1'],
    c:1, e:'El Exit Cap Rate es el driver más sensible del DCF. Subir 25 bps puede reducir el precio €1M+ y bajar la IRR 100-200 bps.' },
  { q:'Si NOI crece de €1.0M a €1.1M pero Cap Rate sube de 4% a 5%, ¿qué pasa con el precio?',
    opts:['Sube porque el NOI subió','Baja de €25M a €22M — la expansión de yields domina sobre el NOI','Se mantiene igual','Sube a €27.5M'],
    c:1, e:'Precio inicial: €25M. Precio final: €22M. Activo baja €3M pese a +10% NOI. Los tipos dominan a corto plazo.' },
  { q:'¿Qué es el Reversionary Yield?',
    opts:['Cap Rate de entrada','ERV / Precio — el yield potencial si toda la renta llega a mercado','Yield en la salida','Yield de la deuda'],
    c:1, e:'Reversionary Yield = ERV / Precio. Si passing < ERV, reversionary > NIY → upside por capturar.' },
  { q:'¿Cómo se calcula el WAULT por renta?',
    opts:['Suma de años restantes','Σ (Renta_i × Años_i) / Renta Total','Media simple','Contrato más largo / nº inquilinos'],
    c:1, e:'WAULT by income = Σ (Renta × Años) / Renta Total. Es el ponderado relevante para pricing.' },
  { q:'En un DCF, el "Valor Terminal" se calcula como:',
    opts:['NOI año 1 / Cap Rate entrada','NOI año (n+1) / Exit Cap Rate','IRR × Inversión','Equity Multiple × Equity'],
    c:1, e:'Valor Terminal = NOI año siguiente al último proyectado / Exit Cap Rate. Sumado a flujos descontados da el NPV.' },
  { q:'¿Qué es el Equity Multiple?',
    opts:['IRR / hold period','Total distribuciones / Capital equity invertido — mide el retorno bruto','LTV / DSCR','NOI / equity'],
    c:1, e:'EM = total recibido / invertido. 2.0x = doble. Core 1.3-1.5x. Value-Add 1.8-2.5x. Oportunístico 2.0-3.0x+.' },
],
m3: [
  { q:'¿Cuál es la ventaja fiscal principal del Share Deal en España?',
    opts:['Se aplica IVA reducido del 10%','Puede estar exento de ITP/IVA bajo art. 314 LMV si no hay ánimo elusivo','No paga ningún impuesto','Se aplica siempre ITP al 2%'],
    c:1, e:'El art. 314 LMV es la norma anti-elusión. Exención de ITP/IVA en compraventa de participaciones sin ánimo de eludir.' },
  { q:'En un Forward Purchase, ¿quién asume el riesgo de construcción?',
    opts:['El inversor comprador','El promotor — el inversor solo paga al completarse la obra','El banco financiador','El inquilino futuro'],
    c:1, e:'En Forward Purchase, el promotor asume el riesgo. En Forward Funding, el inversor.' },
  { q:'¿Qué es un Sale & Leaseback (S&LB)?',
    opts:['Vender y alquilar otro local','Una empresa vende sus activos operativos y firma simultáneamente arrendamiento largo plazo','Forward purchase con recompra','Tipo de refinanciación'],
    c:1, e:'En S&LB, el vendedor libera capital del ladrillo. El comprador obtiene arrendatario que conoce el activo perfectamente.' },
  { q:'¿Cuál es el "Enterprise Value" en un Share Deal?',
    opts:['Precio de los activos','Valor total = Equity Value + Deuda Neta','El NOI del activo','El cap rate implícito'],
    c:1, e:'EV = Equity Value + Deuda Neta. El comprador en share deal compra el Equity Value, ajustado por contingencias.' },
  { q:'¿Qué DD adicional requiere un Share Deal vs Asset Deal?',
    opts:['Ninguna','DD societaria, fiscal completa, laboral y contingencias heredadas','Solo DD técnica','Solo DD fiscal del activo'],
    c:1, e:'En share deal, el comprador hereda TODOS los pasivos: requiere DD societaria, fiscal, laboral además de la del activo.' },
  { q:'¿Cuánto dura típicamente la DD completa en una transacción institucional?',
    opts:['1-2 semanas','4-8 semanas (1-2 meses)','6-12 meses','Solo unos días'],
    c:1, e:'DD completa: 4-8 semanas. Técnica, legal, fiscal y ambiental en paralelo. Share deals pueden durar 8-16 semanas.' },
  { q:'¿Qué son las "Conditions Precedent" (CP)?',
    opts:['Condiciones del préstamo','Condiciones suspensivas que deben cumplirse antes del cierre (financiación, autorizaciones, cancelaciones)','Precio mínimo de venta','Penalizaciones por salida'],
    c:1, e:'Las CP son condiciones suspensivas: autorización IC, obtención de financiación, cancelación de cargas, aprobación antimonopolio.' },
  { q:'¿Diferencia entre Forward Purchase y Forward Funding?',
    opts:['No hay diferencia','FP: pago al completar, riesgo del promotor. FF: pago por certificaciones, riesgo del inversor','FP solo oficinas','FF implica pre-let'],
    c:1, e:'Diferencia clave: quién asume el riesgo constructivo y cuándo paga. FF suele tener precio más bajo porque el inversor asume más riesgo.' },
  { q:'¿Qué es un "Data Room" en una transacción?',
    opts:['Sala de servidores del edificio','Repositorio virtual donde el vendedor deposita docs para que compradores realicen DD','Departamento de análisis','Sistema de gestión'],
    c:1, e:'Data Room (VDR) = repositorio digital con contratos, informes técnicos, documentación legal — toda la info para DD.' },
  { q:'¿Qué documento formaliza la compraventa en España?',
    opts:['LOI','SPA firmado ante notario en escritura pública','Heads of Terms','NDA'],
    c:1, e:'En España, la transmisión de inmuebles requiere escritura pública notarial. El SPA se eleva a escritura.' },
],
m4: [
  { q:'¿Orden de prelación en el capital stack (más seguro a más arriesgado)?',
    opts:['Equity → Mezz → Senior','Senior Debt → Mezzanine → Preferred Equity → Common Equity','Common Equity → Senior → Mezz','Todos igual riesgo'],
    c:1, e:'Senior cobra primero, equity común último. En insolvencia, este orden manda.' },
  { q:'Activo €20M, LTV 55%. ¿Importe deuda senior?',
    opts:['€9M','€11M','€14M','€7.5M'],
    c:1, e:'Deuda = 55% × €20M = €11M. Equity requerido €9M.' },
  { q:'¿Qué mide el DSCR y mínimo bancario estándar?',
    opts:['LTV mín 80%','NOI / Servicio deuda — mínimo 1.25x','Equity Multiple — mín 2.0x','IRR mín 5%'],
    c:1, e:'DSCR = NOI / (Intereses + Amortización). Mínimo bancario 1.25x. <1.0x = breach seguro.' },
  { q:'¿Qué ocurre si se activa covenant de LTV máximo?',
    opts:['Nada','Banco puede requerir amortización o capital adicional. Si no cura → default y ejecución','Tipo de interés baja','Plazo se amplía'],
    c:1, e:'Opciones tras breach: (1) Cure: amortizar o aportar capital. (2) Waiver: dispensa temporal. (3) Default: ejecución.' },
  { q:'¿Qué es un préstamo "bullet" en CRE?',
    opts:['Amortización mensual desde día 1','Solo intereses durante el plazo, principal íntegro al vencimiento','Préstamo tipo fijo','Garantizado por el Estado'],
    c:1, e:'Bullet loan: solo intereses durante 5-7 años, devuelve 100% del principal al vencer. Requiere refi o venta.' },
  { q:'¿Cómo afecta una subida del Euribor de 100 bps al DSCR con deuda variable?',
    opts:['No afecta','Sube DSCR porque el activo vale más','Baja DSCR porque sube el servicio de deuda — puede activar breach','El banco reduce el spread'],
    c:2, e:'Más Euribor → más interés → mayor servicio → DSCR baja. Si LTV 65% y DSCR 1.30x sin cobertura, +200 bps puede llevar DSCR a 1.05x.' },
  { q:'¿Qué es un "Interest Rate Cap"?',
    opts:['Tipo máximo del BCE','Opción que el prestatario compra para limitar el máximo Euribor','Tipo nominal máximo legal','Límite en el LTV'],
    c:1, e:'Cap = opción OTC. Si Euribor supera el strike (ej 4%), el banco paga la diferencia. Disparados de precio en 2022-2023.' },
  { q:'¿Qué es el "mezzanine" en el capital stack?',
    opts:['Piso intermedio físico','Deuda subordinada entre senior y equity — más cara (8-14%) pero sin diluir equity','Equity preferente del GP','Comisión de gestión'],
    c:1, e:'Mezz = subordinada al senior. LTV 55-70%. Coste 8-14%. En quiebra, cobra después del senior y antes del equity.' },
  { q:'¿Qué significa "cash-out refinancing"?',
    opts:['Vender en efectivo sin financiación','Nuevo préstamo > deuda existente, exceso a inversores como liquidez','Cancelar toda la deuda','Reducir el LTV'],
    c:1, e:'Cash-out: si el activo se aprecia, nuevo préstamo al 55% del nuevo valor. Repaga el original y extrae diferencia. Devuelve capital a LP sin vender.' },
  { q:'¿Prestamista CRE típico en España para logístico prime?',
    opts:['Debt funds internacionales (8-12%)','Banca española e internacional (CaixaBank, BBVA, Deutsche Bank, ING) a Euribor+1.5-2.5%','Seguros al 0%','BCE directamente'],
    c:1, e:'Banca española e internacional. LTV 50-60%. Spread 150-250 bps sobre Euribor.' },
],
m5: [
  { q:'¿Prime yield logístico mínimo histórico en Madrid y año?',
    opts:['2.5% en 2021','3.75% en 2022','5.0% en 2019','7.5% en 2018'],
    c:1, e:'Mínimo ~3.75% en 2022: tipos BCE 0%, liquidez extrema, demanda e-commerce post-COVID.' },
  { q:'¿Dónde está la principal plataforma logística de España (PLAZA)?',
    opts:['Madrid','Zaragoza — equidistante Madrid-BCN-Bilbao, nodo ferroviario, A-2/AP-68','Barcelona','Valencia'],
    c:1, e:'PLAZA en Zaragoza. ~320km a Madrid/BCN/Bilbao. Acceso A-2/AP-68 + ferrocarril directo.' },
  { q:'¿Qué significa NNN para el propietario?',
    opts:['Propietario paga todo','Inquilino paga renta + IBI + seguros + mantenimiento — propietario recibe renta casi pura','3 años de contrato','3 inquilinos'],
    c:1, e:'En NNN el inquilino asume gastos operativos. NOI ≈ renta bruta = comparable a bonos.' },
  { q:'¿Qué es el "green premium" en logística?',
    opts:['Descuento fiscal verde','Activos BREEAM/LEED cuestan más (yield menor) y tienen menor riesgo vacante','Subvención del Estado','Beneficio por paneles solares'],
    c:1, e:'Green premium: doble efecto. Yield menor por mandatos ESG + menor riesgo vacante. Brown discount opuesto.' },
  { q:'Prime yield logístico Zaragoza (PLAZA) vs Madrid en 2024:',
    opts:['Igual ~4.75-5.00%','Superior ~5.50-6.00% por menor liquidez y distancia a grandes mercados','Inferior ~3.5%','No hay mercado institucional'],
    c:1, e:'Zaragoza ~5.50-6.00% vs Madrid ~4.75-5.00%. Diferencial 50-100 bps refleja menor liquidez.' },
  { q:'Impacto arrendatario IG (Amazon, Inditex) vs SME sin rating en Cap Rate:',
    opts:['Ningún impacto','IG permite Cap Rate 75-150 bps menor (activo más caro) por mismo activo y ubicación','SME paga más renta','Los fondos no distinguen'],
    c:1, e:'Mismo activo, mismo precio: Amazon @ 5.0% = €8M. SME @ 6.5% = €6.15M. Diferencia 23% solo por el inquilino.' },
  { q:'¿Driver principal de la corrección de yields 2022-2023?',
    opts:['Exceso oferta','Subida BCE 0% → 4.5% encareció deuda y forzó expansión de yields','Colapso e-commerce','Crisis bancaria'],
    c:1, e:'Expansión ~125 bps directamente causada por subida BCE. Fundamentales ocupacionales se mantuvieron sólidos.' },
  { q:'¿Diferencia clave entre last-mile y big-box en yields?',
    opts:['Big-box siempre yield más bajo','En zonas prime, last-mile puede tener yield IGUAL O MENOR por escasez extrema suelo urbano','Last-mile siempre yield más alto','No hay diferencia'],
    c:1, e:'En Madrid y BCN, last-mile urbano puede cotizar 3.5-4.5% (por debajo big-box prime 4.75-5.25%) por escasez de suelo.' },
  { q:'¿Qué es un activo BTS (Built-to-Suit)?',
    opts:['Vender y alquilar (S&LB)','Nave a medida para un inquilino, con contrato largo NNN firmado antes de construir','BREEAM Outstanding','Parque con N inquilinos'],
    c:1, e:'BTS = nave construida a medida con pre-let. Riesgo vacante eliminado. Demanda máxima de fondos core.' },
  { q:'¿% inversión logística España 2024 en Madrid+Barcelona?',
    opts:['30-40%','60-75% — mercados de mayor liquidez y profundidad','95% solo Madrid','80% solo BCN'],
    c:1, e:'Madrid y BCN ~60-75% del volumen. Sin embargo, Zaragoza, Valencia y secundarios capturan cada vez más capital.' },
],
m6: [
  { q:'¿IRR target de una estrategia Value-Add?',
    opts:['4-6%','12-18% mediante creación de valor operativa (reletting, reposicionamiento, CAPEX)','25-40%','6-9%'],
    c:1, e:'Value-Add: IRR 12-18%, LTV 55-65%. Retorno por reletting a ERV, reposicionamiento, ESG, extensión WAULT.' },
  { q:'¿Mínimo distribución SOCIMI para mantener IS 0%?',
    opts:['50%','80% beneficios arrendamiento + 50% plusvalías ventas','100%','30%'],
    c:1, e:'SOCIMI debe distribuir ≥80% beneficios arrendamiento + ≥50% plusvalías. Equivalente a REITs anglosajones.' },
  { q:'¿Qué es el "Carried Interest"?',
    opts:['Mgmt fee anual','% de beneficios (típicamente 20%) que el GP percibe tras superar el hurdle rate','Interés del senior debt','Penalización salida'],
    c:1, e:'Carry = remuneración del GP por gestión, una vez superado el hurdle (6-8%). 20% del upside. Alinea intereses GP/LP.' },
  { q:'¿Qué significa "GP Co-Investment"?',
    opts:['Banco co-invierte','El GP invierte capital propio en el fondo junto a LP — 1-5% para alinear intereses','Empleados sin retribución','Inversor externo como GP'],
    c:1, e:'Co-investment alinea intereses: si el fondo pierde, el GP también. Señal de confianza del gestor.' },
  { q:'¿Cuándo activa un fondo abierto el mecanismo de "gate"?',
    opts:['Cuando supera objetivo de captación','Cuando redemption requests superan capacidad de vender activos sin destruir valor — limita salidas a 5-10% NAV/trimestre','Al llegar al vencimiento','Cuando LTV > 70%'],
    c:1, e:'En 2022-2023, muchos fondos abiertos core activaron gates. Lección: fondos abiertos ≠ liquidez garantizada.' },
  { q:'Waterfall de un fondo PERE - orden de cobro:',
    opts:['GP primero','LP recupera capital → preferred return → catch-up GP → split 80/20 (LP/GP)','Split 50/50 siempre','GP cobra antes del capital LP'],
    c:1, e:'Waterfall estándar: Return of Capital LP → Preferred (hurdle 8%) → Catch-up GP → Split 80/20.' },
  { q:'¿Qué diferencia un Separate Account de un fondo estándar?',
    opts:['Menos activos','Mandato bilateral exclusivo para 1 inversor institucional — personalización total, fees reducidas (~0.5-0.8%)','Acceso retail','SOCIMI un activo'],
    c:1, e:'Separate Account: control total, transparencia por activo, fees bajas. Requiere ticket grande (€250M+).' },
  { q:'¿Principal diferencia entre fondo abierto y cerrado?',
    opts:['Abiertos más arriesgados','Abierto: sin vencimiento, liquidez periódica, core. Cerrado PERE: 7-12Y, sin liquidez, value-add/oport con waterfall','Cerrados más baratos','No hay diferencia'],
    c:1, e:'Open-end: perpetuo, ventanas trimestre/semestre, core. Closed-end: plazo fijo, sin liquidez, value-add/oport.' },
  { q:'¿Qué es un Club Deal?',
    opts:['Descuento exclusivo','Grupo de 3-6 inversores coinvierten directamente en un activo sin vehículo formal — sin mgmt fee, mayor transparencia','Fondo de socios family office','Reservado a retail'],
    c:1, e:'Club Deal: varios inversores se unen para activo grande (€50M+). Ventajas: sin fee, transparencia. Desventaja: gobernanza compleja.' },
  { q:'¿Qué es Montepino y relación con Merlin?',
    opts:['Fondo PERE americano','División logística de Merlin — SOCIMI no listada con >2M m² SBA, JV con Grancasa (Aragón). Inquilinos: Amazon, El Corte Inglés, DHL','Certificación logística','Parque en Zaragoza'],
    c:1, e:'Montepino: plataforma logística de Merlin. JV con Grancasa. >2M m² SBA. Cotiza en BME Growth.' },
],
m7: [
  { q:'¿Cómo afecta una bajada de 100 bps Euribor al valor logístico prime?',
    opts:['No afecta','Reduce coste deuda → mejora IRRs leveraged → inversores pagan más → yields comprimen → precios suben 5-10%','Hace bajar valor','Solo residencial'],
    c:1, e:'Mecánica: BCE↓ → Euribor↓ → deuda más barata → IRR leveraged mejor → inversores pagan más → yield comprime → precio sube.' },
  { q:'¿Qué indica vacancy 3% en logística Madrid?',
    opts:['Crisis — exceso oferta','Mercado muy tenso — escasez de espacio, presión alcista rentas','Equilibrio neutral','Sobreoferta'],
    c:1, e:'Vacancy <5% = tenso. Madrid logístico suele 3-5%. Inquilino con pocas opciones → poder al propietario → rentas suben.' },
  { q:'¿Qué significa "take-up" en market report logístico?',
    opts:['Renta prime','Total m² arrendados en el período — indica demanda ocupacional','Nº transacciones inversión','Vacancy al cierre año'],
    c:1, e:'Take-up = absorción. Alto take-up = demanda fuerte = presión alcista rentas.' },
  { q:'Metodología para construir Comp Table:',
    opts:['Coger precio medio del broker','Buscar transacciones recientes (12-18m) similares, ajustar diferencias para justificar Cap Rate','Cap Rate promedio 5 años','Solo Registro Propiedad'],
    c:1, e:'Comp table: comps últimos 12-18m + ajustes por ubicación, WAULT, antigüedad, inquilino, fecha transacción.' },
  { q:'¿Qué mide el índice MSCI Real Estate (ex-IPD)?',
    opts:['Rentabilidad SOCIMIs cotizadas','Rentabilidad total de portfolios inmobiliarios directos (Income + Capital Return)','Precio m² residencial EU','Evolución Euribor'],
    c:1, e:'MSCI Real Estate = benchmark global portfolios directos. Total Return = Income + Capital. Alpha medido contra este.' },
  { q:'¿Qué es el "prime rent" en logística?',
    opts:['Renta mínima','Renta máxima en transacciones alta calidad — referencia ERV','Renta media','Renta contratos antiguos'],
    c:1, e:'Prime rent = escalón más alto. Si sube, activos con passing < ERV tienen upside reversionario — argumento value-add.' },
  { q:'¿Diferencia INREV vs MSCI Real Estate?',
    opts:['Idénticos','MSCI: portfolios directos. INREV: fondos no cotizados europeos. Distinto público objetivo','INREV cotizadas','INREV solo España'],
    c:1, e:'MSCI = portfolios directos. INREV = asociación europea fondos no cotizados. Estándar de reporting GP/LP de PERE.' },
  { q:'¿Ajuste al comparar transacción 2022 vs actual (2024-25)?',
    opts:['Ninguno','+100-150 bps en Cap Rate — el mercado expandió ~125 bps por subida BCE','Solo IPC','Multiplicar por inflación'],
    c:1, e:'Comps 2022 no directamente comparables: mercado expandió 125 bps. 4.0% en 2022 ≈ 5.0-5.25% hoy. Siempre ajustar por fecha.' },
  { q:'¿Sección del IM donde van los comps?',
    opts:['Risk Factors','Executive Summary','Market Context / Valuation — para justificar Cap Rate entrada','Capital Structure'],
    c:2, e:'Comps van en Market Context (transacciones recientes) y Valuation (justificar Cap Rate). Evidencia de mercado.' },
  { q:'¿Por qué importa el "pipeline de nuevas construcciones"?',
    opts:['Trabajadores en zona','Alto pipeline con pre-let bajo (<30%) → exceso oferta futura → presión bajista rentas','Solo para desarrollos','Sin impacto'],
    c:1, e:'Pipeline = oferta futura. Alto + pre-let bajo = exceso. >70% pre-let = oferta absorbida → señal positiva.' },
],
m8: [
  { q:'En entrevista: "¿Cómo valoras un activo logístico?"',
    opts:['Precio coste construcción/m²','Yield method (NOI/Cap Rate) + DCF 10Y con exit cap conservador e IRR objetivo del fondo','Solo comps recientes','Solo renta'],
    c:1, e:'Profesional: dos métodos. Yield para precio implícito; DCF para crecimiento, timing y leverage.' },
  { q:'Red flag clásica en un IM:',
    opts:['WAULT muy largo','WAULT by area en vez de by income (puede diferir 1-2 años)','Pocos inquilinos','Renta passing alta'],
    c:1, e:'WAULT by income es el relevante. By area infla la cifra si el inquilino largo paga menos €/m².' },
  { q:'¿Slide más importante de un IC Paper?',
    opts:['Datos inquilino','Sensitivity Table — IRR bajo distintos exit caps y occupancies','Comps mercado','Estructura deuda'],
    c:1, e:'Sensibilidad demuestra robustez. Si IRR supera hurdle en >80% escenarios, deal sólido.' },
  { q:'Walk-through de DCF correcto:',
    opts:['Es una calculadora','Proyectar NOI con indexación, valor terminal = NOI(n+1)/Exit Cap, descontar a IRR objetivo. NPV>0 → atractivo','Solo si Cap Rate no funciona','Complejo para logística'],
    c:1, e:'Walk-through profesional: proyección + valor terminal + descuento + NPV. Mencionar leverage si aplica.' },
  { q:'"¿Por qué pasar de leasing a fondo?"',
    opts:['Salario','Trasladar conocimiento operativo al análisis de inversión + base jurídica como diferencial','Leasing aburrido','Trabajar menos'],
    c:1, e:'Respuesta ganadora: conocimiento operativo + capa financiera + base jurídica.' },
  { q:'¿Qué fuente para conocer prime yield actual España?',
    opts:['Wikipedia','Informes trimestrales Savills, CBRE, JLL, Cushman & Wakefield — gratuitos','Solo Registro Propiedad','Solo datos BCE'],
    c:1, e:'Market reports trimestrales de los grandes brokers son la fuente estándar. Gratuitos y rigurosos.' },
  { q:'¿Qué es el "Rent Roll" y por qué es fundamental en IM?',
    opts:['Historial pagos','Tabla maestra contratos: inquilino, sup, renta, ERV, vencimiento, break options — radiografía de flujos','Presupuesto mantenimiento','Valor catastral'],
    c:1, e:'Rent Roll = tabla completa de arrendamientos. Con él calculas WAULT, concentración vencimientos, gap passing/ERV, break options.' },
  { q:'¿Estructura típica de un IC Paper?',
    opts:['1 página con precio y IRR','Exec Summary → Property → Tenants → Market → Financials → Capital → Risks → Recommendation','Solo sensibilidad','Documento libre'],
    c:1, e:'IC Paper estándar en todos los fondos. 8 secciones. Termina con recomendación: BUY / PASS / CONDITIONAL.' },
  { q:'¿Qué es una "break option" y cómo afecta la valoración?',
    opts:['Opción de compra del activo','Derecho del inquilino a rescindir en fecha determinada — reduce WAULT efectivo, aumenta riesgo vacante, sube Cap Rate','Subida libre renta','Renovación automática'],
    c:1, e:'Break option es uno de los riesgos clave del Rent Roll. Contrato 10Y con break año 5 = WAULT efectivo 5, no 10.' },
  { q:'¿Cómo afecta "deferred maintenance" detectado en DD técnica?',
    opts:['No afecta — es del vendedor','Se traduce en "price chip" — ajuste negativo al precio por el importe del CAPEX no ejecutado','Mejora el yield','Solo aplica a oficinas'],
    c:1, e:'Deferred maintenance = CAPEX que debía hacerse y no se hizo. Price chip al vendedor por el importe detectado en DD.' },
],
m9: [
  { q:'¿Qué es el "Market Value" según RICS Red Book?',
    opts:['Precio construcción','Precio estimado al que el activo se intercambiaría entre partes conocedoras, dispuestas y sin presión','Precio reposición','Valor hipoteca pendiente'],
    c:1, e:'MV es la base de valor principal del Red Book. Precio en condiciones arm´s length.' },
  { q:'¿Cuándo se aplica el Método Residual?',
    opts:['Logístico arrendado','Suelo, promociones o activos en desarrollo — Valor Suelo = GDV − Costes − Margen','Activos cotizados','Solo valoración hipotecaria'],
    c:1, e:'Método Residual: GDV − Costes Construcción − Indirectos − Margen Promotor (15-20%) = Valor Suelo. Negativo = no viable.' },
  { q:'¿Qué es el GAV y relación con NAV?',
    opts:['GAV = suma valores RICS activos. NAV = GAV − Deuda neta − obligaciones','GAV y NAV son lo mismo','GAV = NAV + Deuda','NAV = GAV antes IS'],
    c:0, e:'GAV = valoración RICS de todos los activos. NAV = GAV − Deuda. NAV/participación = referencia precio entrada/salida.' },
  { q:'¿Qué significa "under-rented"?',
    opts:['Renta superior a ERV','Renta passing < ERV — upside reversionario al vencer contrato','Sin inquilino','Bajo mínimo legal'],
    c:1, e:'Under-rented: gap positivo passing-ERV. Se captura al vencimiento. Argumento central de tesis value-add.' },
  { q:'¿Qué es el "Depreciated Replacement Cost" (DRC)?',
    opts:['Precio compra con inflación','Coste de reposición depreciado — para activos especializados sin mercado (hospitales, plantas)','NOI capitalizado menos amort','Valor hipoteca cancelada'],
    c:1, e:'DRC = coste reposición actual − depreciación acumulada. Método de último recurso sin comps ni flujos de renta.' },
  { q:'¿Impacto en precio de +50 bps cap rate sobre NOI €1M a yield 5%?',
    opts:['No impacta','€20M → €18.18M (-9.1%) — cap rate más alto, divisor mayor, precio menor','Sube por yield atractivo','Igual'],
    c:1, e:'€1M/5% = €20M. €1M/5.5% = €18.18M. -9.1% por solo 50 bps. Por eso la corrección 2022-2024 fue tan brusca.' },
  { q:'¿En qué difiere ECO 805 española de RICS para hipotecas?',
    opts:['No difiere','ECO 805 introduce Mortgage Lending Value (más conservador) y exige homologación BdE — puede dar valores menores que RICS','RICS más conservadora','ECO solo residencial'],
    c:1, e:'Mortgage Lending Value más conservador que MV RICS. El banco presta sobre el menor, reduciendo LTV efectivo.' },
  { q:'¿Qué es el "EPRA NAV" y por qué se usa en SOCIMIs?',
    opts:['Igual al NAV contable','Metodología estándar EPRA que excluye derivados y ajustes valor deuda — comparable entre REITs europeos','Solo para no cotizados','Incluye fondo de comercio'],
    c:1, e:'EPRA NAV = benchmark estándar europeo REITs/SOCIMIs. También NTA y NRV. Esencial para descuento/prima sobre NAV.' },
  { q:'¿Cómo afecta extensión de WAULT al Cap Rate exigido?',
    opts:['No afecta','Mayor WAULT → menor riesgo vacante → menor Cap Rate → precio más alto. Cada 2Y adicionales puede comprimir 20-25 bps','Mayor WAULT = Cap Rate alto','Solo afecta DSCR'],
    c:1, e:'Regla: WAULT >7Y = premium. 5-7Y = estándar. <5Y = descuento. IG a 10Y casi un bono.' },
  { q:'¿Qué es "Material Valuation Uncertainty"?',
    opts:['Error del tasador','Cláusula RICS obligatoria cuando hay evidencia insuficiente de mercado — mayor margen de error','Valoración provisional 30d','Descuento por riesgo ESG'],
    c:1, e:'Durante corrección 2022-2023, muchas tasadoras RICS incluyeron esta cláusula por falta de comps. No invalida — avisa.' },
],
m10: [
  { q:'¿Qué ley regula arrendamientos de locales comerciales y naves logísticas en España?',
    opts:['Solo Código Civil','LAU Título III — arrendamiento para uso distinto de vivienda','Ley Propiedad Horizontal','No hay ley específica'],
    c:1, e:'LAU Título III regula arrendamientos no residenciales. Amplia libertad de pactos.' },
  { q:'¿ITP en adquisición de nave logística segunda transmisión en Cataluña?',
    opts:['IVA 21%','ITP 10% (Cataluña aplica el tipo máximo)','AJD 1.5%','Sin impuesto'],
    c:1, e:'Segunda transmisión entre particulares: ITP. Cataluña 10%, Madrid 6%. Comprador es sujeto pasivo.' },
  { q:'¿Ventaja fiscal de renunciar a exención IVA vs pagar ITP?',
    opts:['IVA siempre más caro','Si comprador deduce IVA: paga IVA 21% (recupera) + AJD ~1.5% vs ITP 10% no deducible. Ahorro ~8.5%','Solo primera transmisión','Solo la hace el comprador'],
    c:1, e:'Art. 20.Dos LIVA: vendedor renuncia. Comprador empresario deduce IVA. Coste real ~1.5% vs ITP 10%.' },
  { q:'¿Qué es la nota simple registral y para qué sirve?',
    opts:['Resumen del contrato','Extracto del Registro Propiedad: titular, cargas, descripción — punto de partida obligatorio DD legal','Valoración catastral','Licencia actividad'],
    c:1, e:'Nota simple es el primer documento de DD inmobiliaria. Identifica propietario registral, hipotecas, embargos, servidumbres.' },
  { q:'¿Cuándo el vendedor no tributa por Plusvalía Municipal?',
    opts:['Nunca','Cuando no hay incremento real de valor del suelo, gracias a STC 182/2021 (método ganancia real)','Activos >20 años','Comprador SOCIMI'],
    c:1, e:'STC 182/2021 permite método real: si valor suelo no aumentó o bajó, base imponible 0, no hay impuesto.' },
  { q:'¿Función del notario en escritura comercial?',
    opts:['Solo firma como testigo','Da fe pública, verifica identidad y capacidad, comprueba titularidad — control jurídico independiente','Solo revisa fiscal','Establece precio'],
    c:1, e:'Notario tiene función preventiva: verifica capacidad, poderes, razonabilidad precio. Intervención obligatoria para inscribir.' },
  { q:'¿Requisito distribución SOCIMI para mantener IS 0%?',
    opts:['50% todos ingresos','80% beneficios arrendamiento + 50% plusvalías + 100% dividendos filiales SOCIMI','100% beneficios','Sin obligación'],
    c:1, e:'Triple obligación SOCIMI. Si no cumple en un año, IS 25% ordinario ese año.' },
  { q:'¿Qué es la "anotación preventiva de embargo"?',
    opts:['Nota informativa','Medida cautelar judicial que bloquea transmisión durante el litigio — red flag grave','Carga permanente','Hipoteca segundo rango'],
    c:1, e:'Anotación de embargo indica proceso judicial activo. Comprador institucional no cierra sin resolverla.' },
  { q:'¿Qué es la "clasificación del suelo" en DD logística?',
    opts:['Rating crediticio inquilino','Categoría urbanística que determina usos permitidos. Logística necesita suelo industrial/terciario','Tipo catastral IBI','Clasificación energética'],
    c:1, e:'Suelo rústico no puede tener usos industriales legales. Verificar: clasificación, licencia obras, licencia actividad.' },
  { q:'¿Qué es la "condición resolutoria" registral?',
    opts:['Hipoteca primer rango','Cláusula que permite recuperar la propiedad si comprador no cumple (típicamente pago aplazado). Sigue al activo','Limitación municipal','Compromiso no arrendar'],
    c:1, e:'Condición resolutoria es carga real. Si vigente con precio aplazado pendiente, debe resolverse antes del closing.' },
],
m11: [
  { q:'¿Objetivo principal del Business Plan del activo?',
    opts:['Calcular precio compra','Definir estrategia gestión, hitos, CAPEX y proyecciones desde adquisición hasta exit — hoja de ruta del asset manager','Reportar fiscal','Cumplir DD técnica'],
    c:1, e:'Business Plan guía la gestión durante todo el hold. Actualizado trimestralmente. Desviaciones >10% al IC.' },
  { q:'¿Qué estándar europeo fija reporting trimestral fondos no cotizados?',
    opts:['RICS Red Book','INREV — estándar usado por GP y LP institucionales europeos','MSCI Real Estate','EPRA'],
    c:1, e:'INREV establece qué info incluir, cómo calcular NAV y qué métricas publicar. LP europeos esperan INREV.' },
  { q:'¿Qué es "Deferred Maintenance" y su impacto en precio?',
    opts:['IBI pendiente','CAPEX que debía ejecutarse y no se hizo. Cuantificado en DD técnica → ajuste negativo al precio (price chip)','Obras planificadas','Gastos año anterior'],
    c:1, e:'Deferred maintenance = CAPEX oculto que hereda el comprador. Price chip al vendedor por el importe.' },
  { q:'¿Qué estrategia value creation tiene más impacto sobre cap rate de salida?',
    opts:['Pintar fachadas','Extender WAULT vía renovación anticipada — +3-4 años puede comprimir 25-50 bps y subir precio 5-10%','Aumentar parking','Cambiar gestor'],
    c:1, e:'Extensión WAULT actúa directamente sobre cap rate. WAULT 4Y→8Y con misma renta = 5-10% más precio venta.' },
  { q:'¿Qué es el "GRESB score" y uso institucional?',
    opts:['Rating crediticio inquilino','Global Real Estate Sustainability Benchmark — evaluación ESG anual. LP exigen >60/100 para incluir fondo','Calificación energética','Índice ocupación'],
    c:1, e:'GRESB evalúa fondos en Gestión + Performance. Fondos de pensiones europeos excluyen GRESB <60.' },
  { q:'¿Qué es la "J-curve" en un fondo PERE?',
    opts:['Yields ciclo','Curva J de IRR to date: negativa primeros 2-3 años (gastos, sin distribuciones) y sube luego','Evolución NAV','Bonos del Estado'],
    c:1, e:'J-curve normal en PERE. Capital llamado + comisiones → IRR negativa años 1-2. Inflexión cuando NOIs cubren gastos.' },
  { q:'¿Cómo se calcula Total Return de un activo (MSCI)?',
    opts:['IRR anualizada','Income Return (NOI/Valor inicio) + Capital Return (variación valor/Valor inicio)','Solo crecimiento NOI','EM / hold years'],
    c:1, e:'Total Return = Income + Capital. NOI €1M sobre €20M + valor sube a €21M: 5% income + 5% capital = 10% total.' },
],
m12: [
  { q:'¿Principal riesgo regulatorio BTR en España?',
    opts:['Tipos de interés','Ley de Vivienda 2023 — zonas tensionadas con limitación de rentas (Cataluña ya declaradas)','Vacante exceso oferta','Riesgo ESG'],
    c:1, e:'Ley 12/2023 permite limitar rentas en zonas tensionadas. Frena BTR Barcelona, empuja capital a Madrid/Valencia/Málaga.' },
  { q:'¿Principal cuello de botella desarrollo data centers España?',
    opts:['Suelo industrial','Capacidad red eléctrica — proyectos >10 MW esperan 3-5 años para acometida','Mano de obra','Regulación urbanística'],
    c:1, e:'Cuello de botella real: electricidad. Data center 100 MW necesita más que algunos municipios. Listas espera REE largas.' },
  { q:'¿Diferencia riesgo operacional healthcare vs logístico?',
    opts:['No hay','En healthcare, valor activo y negocio operador entrelazados. Si operador quiebra, difícil re-arrendar sin licencias sanitarias','Healthcare menor riesgo','Solo secundarios'],
    c:1, e:'Nave logística vacía: re-arrendar en meses. Residencia mayores: necesita operador con licencia + personal especializado. Años.' },
  { q:'¿Qué es SFDR Artículo 9?',
    opts:['Capital riesgo','Nivel más exigente del Reg. Divulgación Finanzas Sostenibles UE: objetivo de inversión sostenible explícito y verificable','Diversificación geográfica','Limitación LTV'],
    c:1, e:'SFDR Art. 9 = sello verde más exigente. Muchos fondos Art. 9 tuvieron que reclasificarse a Art. 8 en 2023 por no demostrar cumplimiento.' },
  { q:'¿Qué es un "stranded asset" en ESG inmobiliario?',
    opts:['Sin inquilino >2 años','Activo que pierde valor por no cumplir requisitos energéticos/ESG futuros','En zona inundable','Deuda en divisa'],
    c:1, e:'Riesgo stranded crece con EPBD y mandatos ESG. Activos EPC bajo (F/G) sin posibilidad mejora → sin compradores institucionales.' },
  { q:'¿Por qué activos renewable energy (suelo solar) tienen yields bajos?',
    opts:['Alto riesgo','Contratos 20-30Y con energéticas IG, flujos predecibles indexados IPC, correlación negativa con ciclo, máxima ESG','No generan NOI','Riesgo obsolescencia'],
    c:1, e:'Casi instrumentos de renta fija real. Pensiones y soberanos pagan yields bajos por WAULT muy largo, IG, IPC, ESG.' },
  { q:'¿Qué es self-storage y atractivo en Capital Markets?',
    opts:['Oficinas flexibles','Alquiler módulos a particulares y pymes. Atractivo: contratos cortos = actualización inflación, demanda urbana estructural, occupancy >85%','Retail descuento','Solo anglosajón'],
    c:1, e:'Self-storage: contratos cortos = ventaja en inflación. Demanda resiliente al ciclo. Mercado ES fragmentado, en consolidación.' },
  { q:'¿Diferencia Hyperscale vs Edge en data centers?',
    opts:['Solo tamaño','Hyperscale: centros masivos >100 MW para cloud globales. Edge: pequeños distribuidos cerca usuario para baja latencia','Edge más caro siempre','No hay diferencia'],
    c:1, e:'Hyperscale: volumen masivo, economías escala. Edge: proximidad usuario (<10ms latencia). Gaming, IoT, vehículos autónomos.' },
  { q:'¿Atractivo del coliving frente a BTR multifamily?',
    opts:['Son lo mismo','Habitaciones privadas con zonas comunes curadas. Mayor yield potencial pero más gestión y riesgo regulatorio','Coliving más barato','BTR >100 unidades'],
    c:1, e:'Coliving: evolución residencia jóvenes profesionales. Price per sqm superior. Riesgo: regulación asimilación a VUT.' },
  { q:'¿Qué es la EU Taxonomy y cómo afecta adquisiciones?',
    opts:['Clasificación catastral','Reg. UE 2020/852 define actividades sostenibles. Fondos Art.8/9 solo clasifican como sostenibles activos que cumplen','Sistema valoración verde','Solo cotizadas'],
    c:1, e:'Taxonomía redefine qué activos captan capital institucional verde. EPC A/B + BREEAM Very Good = taxonomy-aligned.' },
],
}



