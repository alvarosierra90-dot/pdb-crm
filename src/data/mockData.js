// ⚠ Deuda técnica documentada (auditoría 27/04/2026):
// Los campos `occ`, `renta` y `dias` se mantienen aquí como mock-data por compatibilidad
// con la UI actual, pero CONCEPTUALMENTE NO pertenecen al Activo. Son KPIs derivados
// agregando las OFERTAS vinculadas por activo_ref:
//   - occ:   100 - (sum(superficie_disponible_ofertas) / sba) * 100
//   - renta: rango/promedio de rentas de las ofertas vigentes
//   - dias:  max(días) de las ofertas activas
// En producción (schema Supabase real) NO deben persistirse en la tabla `activos`.
// Usa el helper `deriveActivoStats(ref, ofertas)` definido al final del archivo.
export const ACTIVOS = [
  // ── Portfolio propio / mandatos ──
  { ref: 'MAD-OF-00189', name: 'P.E Avalon',                  propietario: 'Barings RE', zona: 'M-30',              subzona: 'Julián Camarillo', ciudad: 'Madrid',    uso: 'Oficinas',     sba: 46956, occ: 78.4, renta: 10.5, valor: '130 M€',  estado: 'Activo',              dias: 127 },
  { ref: 'ALC-OF-00231', name: 'Albatros',                    propietario: 'Allianz RE',  zona: 'A-1',               subzona: 'Alcobendas',       ciudad: 'Madrid',    uso: 'Oficinas',     sba: 53944, occ: 75,   renta: 12.5, valor: '—',      estado: 'Activo',              dias: 127 },
  { ref: 'BCN-OF-00312', name: 'Edificio Diagonal 95',        propietario: 'Grosvenor',   zona: '22@',               subzona: 'Poblenou',          ciudad: 'Barcelona', uso: 'Oficinas',     sba: 9800,  occ: 88,   renta: 22.0, valor: '74 M€',  estado: 'Activo',              dias: 45  },
  { ref: 'MAD-LG-00401', name: 'Park Logístico Getafe',       propietario: 'Prologis',    zona: 'Corredor del Henares', subzona: 'Getafe',         ciudad: 'Madrid',    uso: 'Logístico',    sba: 24000, occ: 96,   renta: 6.8,  valor: '52 M€',  estado: 'Activo',              dias: 12  },
  { ref: 'MAD-RT-00502', name: 'C.C. Parquesur',              propietario: 'Klepierre',   zona: 'Sur Madrid',        subzona: 'Leganés',           ciudad: 'Madrid',    uso: 'Retail',       sba: 42000, occ: 91,   renta: 18.0, valor: '210 M€', estado: 'Activo',              dias: 0   },
  { ref: 'BCN-OF-00621', name: 'Torre Glòries',               propietario: 'Merlin',      zona: '22@',               subzona: 'Poblenou',          ciudad: 'Barcelona', uso: 'Oficinas',     sba: 18500, occ: 100,  renta: 28.0, valor: '145 M€', estado: 'Activo',              dias: 0   },
  { ref: 'VLC-OF-00712', name: 'Torre Europa Valencia',       propietario: 'IBA Capital', zona: 'Mestalla',          subzona: 'Benimaclet',        ciudad: 'Valencia',  uso: 'Oficinas',     sba: 7600,  occ: 83,   renta: 14.5, valor: '38 M€',  estado: 'En comercialización', dias: 62  },
  { ref: 'MAD-OF-00841', name: 'Parque Empresarial Norte',    propietario: 'CBRE IM',     zona: 'M-30',              subzona: 'Hortaleza',         ciudad: 'Madrid',    uso: 'Oficinas',     sba: 11200, occ: 79,   renta: 16.8, valor: '68 M€',  estado: 'Activo',              dias: 34  },

  // ── Colonial SOCIMI ──
  { ref: 'MAD-OF-COL001', name: 'Castellana 43',              propietario: 'Colonial',    zona: 'CBD',               subzona: 'Recoletos',         ciudad: 'Madrid',    uso: 'Oficinas',     sba: 13500, occ: 95,   renta: 36.0, valor: '210 M€', estado: 'Activo',              dias: 0   },
  { ref: 'MAD-OF-COL002', name: 'Príncipe de Vergara 112',    propietario: 'Colonial',    zona: 'M-30',              subzona: 'Salamanca',         ciudad: 'Madrid',    uso: 'Oficinas',     sba: 8096,  occ: 88,   renta: 28.5, valor: '92 M€',  estado: 'Activo',              dias: 18  },
  { ref: 'BCN-OF-COL001', name: 'Diagonal 530',               propietario: 'Colonial',    zona: 'Diagonal',          subzona: 'Les Corts',         ciudad: 'Barcelona', uso: 'Oficinas',     sba: 18200, occ: 100,  renta: 30.0, valor: '280 M€', estado: 'Activo',              dias: 0   },
  { ref: 'BCN-OF-COL002', name: 'Paseo de Gracia 11',         propietario: 'Colonial',    zona: 'CBD',               subzona: 'Eixample',          ciudad: 'Barcelona', uso: 'Oficinas',     sba: 9396,  occ: 91,   renta: 42.0, valor: '195 M€', estado: 'Activo',              dias: 5   },

  // ── Merlin Properties ──
  { ref: 'MAD-OF-MRL001', name: 'Parque Adequa — Edif. 1',   propietario: 'Merlin',      zona: 'A-2',               subzona: 'Arturo Soria',      ciudad: 'Madrid',    uso: 'Oficinas',     sba: 18858, occ: 82,   renta: 14.0, valor: '115 M€', estado: 'Activo',              dias: 44  },
  { ref: 'MAD-OF-MRL002', name: 'Torre Chamartín',            propietario: 'Merlin',      zona: 'Chamartín',         subzona: 'CTBA',              ciudad: 'Madrid',    uso: 'Oficinas',     sba: 31992, occ: 90,   renta: 25.0, valor: '320 M€', estado: 'Activo',              dias: 0   },
  { ref: 'GUA-LG-MRL001', name: 'P.L. Guadalajara — Nave 1', propietario: 'Merlin',      zona: 'Corredor A-2',      subzona: 'Cabanillas del Campo', ciudad: 'Guadalajara', uso: 'Logístico', sba: 41500, occ: 100, renta: 5.2, valor: '88 M€',  estado: 'Activo',              dias: 0   },
  { ref: 'MAD-LG-MRL002', name: 'Cross Dock Coslada',         propietario: 'Merlin',      zona: 'Corredor del Henares', subzona: 'Coslada',        ciudad: 'Madrid',    uso: 'Logístico',    sba: 18000, occ: 94,   renta: 6.2,  valor: '55 M€',  estado: 'Activo',              dias: 11  },
  { ref: 'MAD-DC-MRL001', name: 'Data Center Alcalá',         propietario: 'Merlin',      zona: 'A-2',               subzona: 'Alcalá de Henares', ciudad: 'Madrid',    uso: 'Data Center',  sba: 4200,  occ: 100,  renta: 120.0,valor: '145 M€', estado: 'Activo',              dias: 0   },
  { ref: 'MAD-DC-MRL002', name: 'Data Center Madrid Sur',     propietario: 'Merlin',      zona: 'Sur Madrid',        subzona: 'Getafe',            ciudad: 'Madrid',    uso: 'Data Center',  sba: 6000,  occ: 67,   renta: 115.0,valor: '180 M€', estado: 'En comercialización', dias: 38  },

  // ── GMP ──
  { ref: 'MAD-OF-GMP001', name: 'Castellana 77',              propietario: 'GMP',         zona: 'CBD',               subzona: 'Castellana',        ciudad: 'Madrid',    uso: 'Oficinas',     sba: 18003, occ: 93,   renta: 32.0, valor: '245 M€', estado: 'Activo',              dias: 0   },
  { ref: 'MAD-OF-GMP002', name: 'Capitán Haya 22',            propietario: 'GMP',         zona: 'Azca',              subzona: 'Azca',              ciudad: 'Madrid',    uso: 'Oficinas',     sba: 12500, occ: 87,   renta: 24.5, valor: '135 M€', estado: 'Activo',              dias: 22  },
  { ref: 'MAD-OF-GMP003', name: 'Josefa Valcárcel 26',        propietario: 'GMP',         zona: 'M-30',              subzona: 'Arturo Soria',      ciudad: 'Madrid',    uso: 'Oficinas',     sba: 9800,  occ: 100,  renta: 20.0, valor: '88 M€',  estado: 'Activo',              dias: 0   },
  { ref: 'MAD-OF-GMP004', name: 'Hontanares 35 Alcobendas',   propietario: 'GMP',         zona: 'A-1',               subzona: 'Alcobendas',        ciudad: 'Madrid',    uso: 'Oficinas',     sba: 16200, occ: 75,   renta: 16.5, valor: '95 M€',  estado: 'En comercialización', dias: 67  },

  // ── Residencial ──
  { ref: 'MAD-RES-001',   name: 'Residencial Valdebebas',     propietario: 'Neinor Homes',zona: 'Valdebebas',        subzona: 'Valdebebas',        ciudad: 'Madrid',    uso: 'Residencial',  sba: 2940,  occ: 71,   renta: 16.0, valor: '22 M€',  estado: 'En comercialización', dias: 89  },
]

// OFERTAS mock — usadas como fallback cuando la DB está vacía.
// Cada oferta incluye campos completos para poder probar el flujo entero.
// estado: 'Negociando' | 'En curso' | 'Finalista' | 'En revisión' | 'Cerrada'
export const OFERTAS = [

  /* ─── ALBATROS · Allianz RE ──────────────────────────── */
  {
    ref: 'OFR-0018', activo_ref: 'ALC-OF-00231', activo: 'Albatros',
    espacio: 'Edif. D · P3–P4 · 6.742 m²',
    m2: 6742, tipo_operacion: 'Alquiler', estado: 'Negociando',
    tipo_comercializacion: 'Mandato Savills', tipologia: 'Oficina tradicional',
    estado_espacio: 'Llave en mano', modalidad_visita: 'Libre acceso con agente',
    origen_oferta: 'Demanda directa',
    equipo: [
      { name:'Sierra Álvaro',    team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', owner:true  },
      { name:'GOMEZ Ignacio',    team:'Leasing MAD',       role:'Colaborador', initials:'GI', bg:'#fdf4ff', color:'#7e22ce', owner:false },
    ],
    espacios: [
      { edificio:'D', planta:'P4', uso:'Oficina', sup:3371, renta:14.5 },
      { edificio:'D', planta:'P3', uso:'Oficina', sup:3371, renta:14.5 },
    ],
  },
  {
    ref: 'OFR-0019', activo_ref: 'ALC-OF-00231', activo: 'Albatros',
    espacio: 'Edif. D · P2 parcial · 1.200 m²',
    m2: 1200, tipo_operacion: 'Alquiler', estado: 'En curso',
    tipo_comercializacion: 'Mandato Savills', tipologia: 'Coworking',
    estado_espacio: 'Acondicionado', modalidad_visita: 'Con cita previa',
    origen_oferta: 'Agencia externa',
    equipo: [
      { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', owner:true },
    ],
    espacios: [
      { edificio:'D', planta:'P2', uso:'Oficina', sup:1200, renta:14.0 },
    ],
  },
  {
    // Borrador — no asignada en stacking plan (P1 queda libre / sin oferta)
    ref: 'OFR-0020', activo_ref: 'ALC-OF-00231', activo: 'Albatros',
    espacio: '—',
    m2: 0, tipo_operacion: 'Alquiler', estado: 'En revisión',
    tipo_comercializacion: 'Mandato Savills', tipologia: 'Oficina tradicional',
    estado_espacio: '', modalidad_visita: '',
    origen_oferta: 'Directo propiedad',
    equipo: [
      { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', owner:true },
    ],
    espacios: [], // pendiente de asignación en stacking plan
  },

  /* ─── P.E AVALON · Barings RE ───────────────────────── */
  {
    ref: 'OFR-0017', activo_ref: 'MAD-OF-00189', activo: 'P.E Avalon',
    espacio: 'Edif. A · P5 + PB · 1.198 m²',
    m2: 1198, tipo_operacion: 'Alquiler', estado: 'En curso',
    tipo_comercializacion: 'Co-exclusiva', tipologia: 'Oficina tradicional',
    estado_espacio: 'Semi-acondicionado', modalidad_visita: 'Con cita previa',
    origen_oferta: 'Agencia externa',
    equipo: [
      { name:'Sierra Álvaro',    team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', owner:true  },
      { name:'Alonso Abruña D.', team:'Leasing MAD',       role:'Colaborador', initials:'AD', bg:'#f3e8ff', color:'#6b21a8', owner:false },
    ],
    espacios: [
      { edificio:'A', planta:'P5', uso:'Oficina', sup:298,  renta:11.5 },
      { edificio:'A', planta:'PB', uso:'Oficina', sup:900,  renta:11.5 },
    ],
  },
  {
    ref: 'OFR-0023', activo_ref: 'MAD-OF-00189', activo: 'P.E Avalon',
    espacio: 'Edif. A · P3 + P2 parcial · 1.033 m²',
    m2: 1033, tipo_operacion: 'Alquiler', estado: 'Negociando',
    tipo_comercializacion: 'Co-exclusiva', tipologia: 'Business park',
    estado_espacio: 'Implantado (reforma 2022)', modalidad_visita: 'Con cita previa',
    origen_oferta: 'ON profesional',
    equipo: [
      { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', owner:true },
    ],
    espacios: [
      { edificio:'A', planta:'P3', uso:'Oficina', sup:733, renta:12.0 },
      { edificio:'A', planta:'P2', uso:'Oficina', sup:300, renta:12.0 },
    ],
  },

  /* ─── TORRE CHAMARTÍN · Merlin ──────────────────────── */
  {
    ref: 'OFR-0016', activo_ref: 'MAD-OF-MRL002', activo: 'Torre Chamartín',
    espacio: 'Edif. A · P5–P2 · 5.332 m²',
    m2: 5332, tipo_operacion: 'Alquiler', estado: 'Finalista',
    tipo_comercializacion: 'Exclusiva', tipologia: 'Sede única (HQ)',
    estado_espacio: 'Acondicionado', modalidad_visita: 'Libre acceso con agente',
    origen_oferta: 'Demanda directa',
    equipo: [
      { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', owner:true },
    ],
    espacios: [
      { edificio:'A', planta:'P5', uso:'Oficina', sup:1333, renta:26.0 },
      { edificio:'A', planta:'P4', uso:'Oficina', sup:1333, renta:26.0 },
      { edificio:'A', planta:'P3', uso:'Oficina', sup:1333, renta:26.0 },
      { edificio:'A', planta:'P2', uso:'Oficina', sup:1333, renta:26.0 },
    ],
  },

  /* ─── CASTELLANA 77 · GMP ───────────────────────────── */
  {
    ref: 'OFR-0015', activo_ref: 'MAD-OF-GMP001', activo: 'Castellana 77',
    espacio: 'Edif. A · P3–P2 · 2.118 m²',
    m2: 2118, tipo_operacion: 'Alquiler', estado: 'Negociando',
    tipo_comercializacion: 'Mandato Savills', tipologia: 'Oficina tradicional',
    estado_espacio: 'Acondicionado', modalidad_visita: 'Libre acceso con agente',
    origen_oferta: 'Mandato corporate',
    equipo: [
      { name:'GOMEZ Ignacio',    team:'Leasing MAD',       role:'Responsable', initials:'GI', bg:'#fdf4ff', color:'#7e22ce', owner:true  },
      { name:'Alonso Abruña D.', team:'Leasing MAD',       role:'Colaborador', initials:'AD', bg:'#f3e8ff', color:'#6b21a8', owner:false },
    ],
    espacios: [
      { edificio:'A', planta:'P3', uso:'Oficina', sup:1059, renta:33.0 },
      { edificio:'A', planta:'P2', uso:'Oficina', sup:1059, renta:33.0 },
    ],
  },
  {
    // Borrador — P1 libre en stacking, oferta pendiente de asignación
    ref: 'OFR-0014', activo_ref: 'MAD-OF-GMP001', activo: 'Castellana 77',
    espacio: '—',
    m2: 0, tipo_operacion: 'Alquiler', estado: 'En revisión',
    tipo_comercializacion: 'Mandato Savills', tipologia: 'Oficina representativa',
    estado_espacio: '', modalidad_visita: '',
    origen_oferta: 'ON profesional',
    equipo: [
      { name:'GOMEZ Ignacio', team:'Leasing MAD', role:'Responsable', initials:'GI', bg:'#fdf4ff', color:'#7e22ce', owner:true },
    ],
    espacios: [],
  },

  /* ─── CASTELLANA 43 · Colonial ──────────────────────── */
  {
    ref: 'OFR-0013', activo_ref: 'MAD-OF-COL001', activo: 'Castellana 43',
    espacio: 'Edif. A · P2 · 1.125 m²',
    m2: 1125, tipo_operacion: 'Alquiler', estado: 'En curso',
    tipo_comercializacion: 'Co-exclusiva', tipologia: 'Oficina representativa',
    estado_espacio: 'Acondicionado', modalidad_visita: 'Con cita previa',
    origen_oferta: 'Otras consultoras',
    equipo: [
      { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', owner:true },
    ],
    espacios: [
      { edificio:'A', planta:'P2', uso:'Oficina', sup:1125, renta:38.0 },
    ],
  },
]

export const NEGOCIACIONES = [
  { ref: 'NEG-0044', parte: 'Sierra Álvaro', equipo: 'Transaction Spain', contraparte: 'Empresa XYZ', contacto: 'Ana Gómez · Dir. RRHH', activo: 'Avalon — Santa Leonor 65', espacio: '1.000 m² · P5', estado: 'En negociación', envio: '10/03/2026', ultima_mod: '15/03/2026', mod_desc: 'Ajuste condiciones', cierre: '30/03/2026' },
  { ref: 'NEG-0041', parte: 'Sierra Álvaro', equipo: 'Transaction Spain', contraparte: 'Oracle Spain SL', contacto: 'Carlos Méndez · Dir. Real Estate', activo: 'Albatros — Edif. D', espacio: '13.486 m² · P1–P4', estado: 'Pendiente respuesta', envio: '12/03/2026', ultima_mod: '28/03/2026', mod_desc: 'Contraoferta enviada', cierre: '30/04/2026' },
  { ref: 'NEG-0039', parte: 'Sierra Álvaro', equipo: 'Transaction Spain', contraparte: 'Generali Real Estate', contacto: 'Marta Solá · Asset Manager', activo: 'P.E Avalon — P5', espacio: '1.500 m²', estado: 'Acuerdo alcanzado', envio: '01/03/2026', ultima_mod: '29/03/2026', mod_desc: 'Contrato revisado', cierre: '15/04/2026' },
  { ref: 'NEG-0037', parte: 'Alonso Abruña D.', equipo: 'Leasing Oficinas MAD', contraparte: 'Pharma Group Spain', contacto: 'Javier Ruiz · CFO', activo: 'Diagonal 95 — P3', espacio: '820 m²', estado: 'En negociación', envio: '20/02/2026', ultima_mod: '26/03/2026', mod_desc: '3ª ronda condiciones', cierre: '15/05/2026' },
  { ref: 'NEG-0035', parte: 'Sierra Álvaro', equipo: 'Transaction Spain', contraparte: 'ISDE', contacto: 'Lucía Herrero · Dir. Expansión', activo: 'P.E Avalon — P3', espacio: '2.200 m²', estado: 'Firmado', envio: '10/01/2026', ultima_mod: '14/02/2026', mod_desc: 'Contrato firmado', cierre: '01/03/2026' },
  { ref: 'NEG-0033', parte: 'GOMEZ Ignacio', equipo: 'Leasing Oficinas MAD', contraparte: 'Grupo Empresarial Altamira SL', contacto: 'Pedro Vidal · CEO', activo: 'Parque Empresarial Norte — P2', espacio: '2.800 m²', estado: 'Rechazado', envio: '15/12/2025', ultima_mod: '10/01/2026', mod_desc: 'Cliente rechaza condiciones', cierre: '—' },
]

// ─── Helpers de KPI derivados ─────────────────────────────
// El Activo NO almacena disponibilidad. Estas funciones agregan datos de OFERTAS
// vinculadas por activo_ref para mostrar KPIs derivados en la UI del Activo.
// Marca visual sugerida en UI: prefijar el valor con "Σ" para indicar agregación.
export function deriveActivoStats(activoRef, ofertasArray = OFERTAS) {
  const ofertasDelActivo = (ofertasArray || []).filter(o => o.activo_ref === activoRef && o.estado !== 'Cerrada')
  if (ofertasDelActivo.length === 0) {
    return { occ: null, rentaMin: null, rentaMax: null, dias: null, numOfertas: 0, supDisponible: 0 }
  }
  const supDisponible = ofertasDelActivo.reduce((s, o) => s + (o.m2 || 0), 0)
  const rentas = ofertasDelActivo
    .flatMap(o => (o.espacios || []).map(e => e.renta).filter(r => r > 0))
  const rentaMin = rentas.length ? Math.min(...rentas) : null
  const rentaMax = rentas.length ? Math.max(...rentas) : null
  const dias = Math.max(...ofertasDelActivo.map(o => o.dias_mercado || 0), 0) || null
  return { rentaMin, rentaMax, dias, numOfertas: ofertasDelActivo.length, supDisponible }
}

export const PORTFOLIOS = [
  { nombre: 'Merlín Properties SOCIMI', ticker: 'MRL', tipo: 'SOCIMI', activos: 64, m2: 2100000, disponible: 180000, ofertas: 31, yield: 5.1, contacto: '12/03/2026', colorBg: 'var(--gray-lt)', colorBorder: 'var(--border)', colorText: 'var(--text)', letra: 'M' },
  { nombre: 'FREO Investments Spain SL', ticker: 'FREO', tipo: 'Fondo', activos: 12, m2: 340000, disponible: 28000, ofertas: 8, yield: 6.2, contacto: '05/03/2026', colorBg: 'var(--green-lt)', colorBorder: 'var(--green-bd)', colorText: 'var(--green)', letra: 'F' },
]
