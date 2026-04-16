/* ─────────────────────────────────────────────────────────────────
   BUILDINGS_BY_ACTIVO
   Clave = ref del activo. Cada entrada es un array de edificios
   con la misma estructura que INIT_BUILDINGS en FichaActivo.jsx
───────────────────────────────────────────────────────────────── */

const own = (floors, propietario) =>
  floors.map(f => ({ p: f.id, sup: f.sup, units: [{ n: propietario, sup: f.sup }] }))

export const BUILDINGS_BY_ACTIVO = {

  /* ── P.E AVALON (Barings) ─────────────────────────── */
  'MAD-OF-00189': [
    {
      id:'A', label:'P.E Avalon — Edif. A', supPlantaTipo:1500,
      floors:[
        {id:'P5',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
        {id:'P4',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
        {id:'P3',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
        {id:'P2',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
        {id:'P1',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
        {id:'PB',sup:1500,principal:[{uso:'retail',sup:380},{uso:'comun',sup:1120}],adicional:[]},
        {id:'S1',sup:1500,principal:[{uso:'parking',sup:1500}],adicional:[]},
        {id:'S2',sup:1500,principal:[{uso:'parking',sup:1500}],adicional:[]},
      ],
      prop: own([{id:'P5',sup:1500},{id:'P4',sup:1500},{id:'P3',sup:1500},{id:'P2',sup:1500},{id:'P1',sup:1500},{id:'PB',sup:1500},{id:'S1',sup:1500},{id:'S2',sup:1500}], 'Barings Core Spain SOCIMI'),
      arr:[
        {p:'P5',sup:1500,units:[{type:'ten',n:'Celonis',sup:1202,brk:'Oct 2025',brkColor:'var(--amber)'},{type:'vac',oferta:'OLB001',sup:298}]},
        {p:'P4',sup:1500,units:[{type:'ten',n:'Celonis',sup:1500,brk:'Oct 2025',brkColor:'var(--amber)'}]},
        {p:'P3',sup:1500,units:[{type:'ten',n:'Repsol',sup:767,brk:'Jun 2027',brkColor:'var(--green)'},{type:'vac',oferta:'OLB002',sup:733}]},
        {p:'P2',sup:1500,units:[{type:'ten',n:'Repsol',sup:1200,brk:'Jun 2027',brkColor:'var(--green)'},{type:'vac',oferta:'OLB002',sup:300}]},
        {p:'P1',sup:1500,units:[{type:'ten',n:'Desconocido',sup:1500,brk:'Ene 2026',brkColor:'var(--red)'}]},
        {p:'PB',sup:1500,units:[{type:'rt',n:'Cafetería',sup:380,brk:'Ene 2029',brkColor:'var(--text4)'},{type:'com',n:'Hall / Común',sup:220},{type:'vac',oferta:'OLB001',sup:900}]},
        {p:'S1',sup:1500,units:[{type:'pk',n:'Parking · 778 plazas',sup:1500,nota:'Nivel -1'}]},
        {p:'S2',sup:1500,units:[{type:'pk',n:'Parking · 52 plazas',sup:1500,nota:'Nivel -2'}]},
      ],
    },
    {
      id:'B', label:'Edif. B', supPlantaTipo:1500,
      floors:[
        {id:'P5',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
        {id:'P4',sup:1500,principal:[{uso:'oficinas',sup:1500}],adicional:[]},
        {id:'PB',sup:1500,principal:[{uso:'comun',sup:250},{uso:'oficinas',sup:1250}],adicional:[]},
      ],
      prop: own([{id:'P5',sup:1500},{id:'P4',sup:1500},{id:'PB',sup:1500}], 'Barings Core Spain SOCIMI'),
      arr:[
        {p:'P5',sup:1500,units:[{type:'ten',n:'Oficinas',sup:1500,brk:null}]},
        {p:'P4',sup:1500,units:[{type:'ten',n:'Celonis',sup:1300,brk:'Oct 2025',brkColor:'var(--amber)'},{type:'vac',oferta:null,sup:200}]},
        {p:'PB',sup:1500,units:[{type:'com',n:'Cafetería',sup:250},{type:'vac',oferta:null,sup:1250}]},
      ],
    },
    {
      id:'C', label:'Edif. C', supPlantaTipo:1967,
      floors:[
        {id:'P4',sup:1967,principal:[{uso:'oficinas',sup:1967}],adicional:[]},
        {id:'PB',sup:1967,principal:[{uso:'oficinas',sup:1967}],adicional:[]},
      ],
      prop: own([{id:'P4',sup:1967},{id:'PB',sup:1967}], 'Barings Core Spain SOCIMI'),
      arr:[
        {p:'P4',sup:1967,units:[{type:'ten',n:'Repsol',sup:1967,brk:'Jun 2027',brkColor:'var(--green)'}]},
        {p:'PB',sup:1967,units:[{type:'vac',oferta:null,sup:1967}]},
      ],
    },
    {
      id:'D', label:'Edif. D', supPlantaTipo:2000,
      floors:[
        {id:'P3',sup:2000,principal:[{uso:'oficinas',sup:2000}],adicional:[]},
        {id:'PB',sup:2000,principal:[{uso:'oficinas',sup:2000}],adicional:[]},
      ],
      prop: own([{id:'P3',sup:2000},{id:'PB',sup:2000}], 'Barings Core Spain SOCIMI'),
      arr:[
        {p:'P3',sup:2000,units:[{type:'ten',n:'Oracle Spain SL',sup:2000,brk:'Mar 2028',brkColor:'var(--green)'}]},
        {p:'PB',sup:2000,units:[{type:'vac',oferta:null,sup:2000}]},
      ],
    },
  ],

  /* ── ALBATROS (Allianz RE) — Alcobendas ─────────────── */
  'ALC-OF-00231': [
    {
      id:'A', label:'Albatros — Edif. A', supPlantaTipo:2500,
      floors:[
        {id:'P4',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'P3',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'P2',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'P1',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'PB',sup:2500,principal:[{uso:'comun',sup:600},{uso:'retail',sup:1900}],adicional:[]},
        {id:'S1',sup:2500,principal:[{uso:'parking',sup:2500}],adicional:[]},
      ],
      prop: own([{id:'P4',sup:2500},{id:'P3',sup:2500},{id:'P2',sup:2500},{id:'P1',sup:2500},{id:'PB',sup:2500},{id:'S1',sup:2500}], 'Allianz Real Estate'),
      arr:[
        {p:'P4',sup:2500,units:[{type:'ten',n:'IBM España SL',sup:2500,brk:'Jun 2030',brkColor:'var(--green)'}]},
        {p:'P3',sup:2500,units:[{type:'ten',n:'IBM España SL',sup:2500,brk:'Jun 2030',brkColor:'var(--green)'}]},
        {p:'P2',sup:2500,units:[{type:'ten',n:'Telefónica España SA',sup:2500,brk:'Sep 2028',brkColor:'var(--green)'}]},
        {p:'P1',sup:2500,units:[{type:'ten',n:'Telefónica España SA',sup:2500,brk:'Sep 2028',brkColor:'var(--green)'}]},
        {p:'PB',sup:2500,units:[{type:'com',n:'Hall / Lobby',sup:600},{type:'rt',n:'Cafetería Albatros',sup:1900,brk:'Ene 2028',brkColor:'var(--green)'}]},
        {p:'S1',sup:2500,units:[{type:'pk',n:'Parking · 80 plazas',sup:2500,nota:'Nivel -1'}]},
      ],
    },
    {
      id:'B', label:'Edif. B', supPlantaTipo:2500,
      floors:[
        {id:'P5',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'P4',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'P3',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'P2',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'P1',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'PB',sup:2500,principal:[{uso:'comun',sup:400},{uso:'oficinas',sup:2100}],adicional:[]},
        {id:'S1',sup:2500,principal:[{uso:'parking',sup:2500}],adicional:[]},
      ],
      prop: own([{id:'P5',sup:2500},{id:'P4',sup:2500},{id:'P3',sup:2500},{id:'P2',sup:2500},{id:'P1',sup:2500},{id:'PB',sup:2500},{id:'S1',sup:2500}], 'Allianz Real Estate'),
      arr:[
        {p:'P5',sup:2500,units:[{type:'ten',n:'IATA · Regional Office Spain',sup:2500,brk:'Dic 2029',brkColor:'var(--green)'}]},
        {p:'P4',sup:2500,units:[{type:'ten',n:'IATA · Regional Office Spain',sup:2500,brk:'Dic 2029',brkColor:'var(--green)'}]},
        {p:'P3',sup:2500,units:[{type:'ten',n:'Vodafone España SA',sup:2500,brk:'Mar 2027',brkColor:'var(--amber)'}]},
        {p:'P2',sup:2500,units:[{type:'ten',n:'Vodafone España SA',sup:2500,brk:'Mar 2027',brkColor:'var(--amber)'}]},
        {p:'P1',sup:2500,units:[{type:'ten',n:'Vodafone España SA',sup:2500,brk:'Mar 2027',brkColor:'var(--amber)'}]},
        {p:'PB',sup:2500,units:[{type:'com',n:'Hall',sup:400},{type:'vac',oferta:null,sup:2100}]},
        {p:'S1',sup:2500,units:[{type:'pk',n:'Parking · 100 plazas',sup:2500,nota:'Nivel -1'}]},
      ],
    },
    {
      id:'C', label:'Edif. C', supPlantaTipo:2500,
      floors:[
        {id:'P3',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'P2',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'P1',sup:2500,principal:[{uso:'oficinas',sup:2500}],adicional:[]},
        {id:'PB',sup:2500,principal:[{uso:'comun',sup:500},{uso:'oficinas',sup:2000}],adicional:[]},
        {id:'S1',sup:2500,principal:[{uso:'parking',sup:2500}],adicional:[]},
      ],
      prop: own([{id:'P3',sup:2500},{id:'P2',sup:2500},{id:'P1',sup:2500},{id:'PB',sup:2500},{id:'S1',sup:2500}], 'Allianz Real Estate'),
      arr:[
        {p:'P3',sup:2500,units:[{type:'ten',n:'Merck Sharp & Dohme SLU',sup:2500,brk:'Jun 2031',brkColor:'var(--green)'}]},
        {p:'P2',sup:2500,units:[{type:'ten',n:'Merck Sharp & Dohme SLU',sup:2500,brk:'Jun 2031',brkColor:'var(--green)'}]},
        {p:'P1',sup:2500,units:[{type:'ten',n:'Garrigues Abogados SLP',sup:2500,brk:'Sep 2029',brkColor:'var(--green)'}]},
        {p:'PB',sup:2500,units:[{type:'com',n:'Lobby / Zonas comunes',sup:500},{type:'rt',n:'Gym · Bienestar',sup:2000,brk:null}]},
        {p:'S1',sup:2500,units:[{type:'pk',n:'Parking · 60 plazas',sup:2500,nota:'Nivel -1'}]},
      ],
    },
    {
      id:'D', label:'Edif. D', supPlantaTipo:3371,
      floors:[
        {id:'P4',sup:3371,principal:[{uso:'oficinas',sup:3371}],adicional:[]},
        {id:'P3',sup:3371,principal:[{uso:'oficinas',sup:3371}],adicional:[]},
        {id:'P2',sup:3371,principal:[{uso:'oficinas',sup:3371}],adicional:[]},
        {id:'P1',sup:3371,principal:[{uso:'oficinas',sup:3371}],adicional:[]},
        {id:'PB',sup:3371,principal:[{uso:'comun',sup:700},{uso:'retail',sup:2671}],adicional:[]},
        {id:'S1',sup:3371,principal:[{uso:'parking',sup:3371}],adicional:[]},
        {id:'S2',sup:3371,principal:[{uso:'parking',sup:3371}],adicional:[]},
      ],
      prop: own([{id:'P4',sup:3371},{id:'P3',sup:3371},{id:'P2',sup:3371},{id:'P1',sup:3371},{id:'PB',sup:3371},{id:'S1',sup:3371},{id:'S2',sup:3371}], 'Allianz Real Estate'),
      arr:[
        {p:'P4',sup:3371,units:[{type:'vac',oferta:'OFR-0018',sup:3371}]},
        {p:'P3',sup:3371,units:[{type:'vac',oferta:'OFR-0018',sup:3371}]},
        {p:'P2',sup:3371,units:[{type:'vac',oferta:'OFR-0018',sup:3371}]},
        {p:'P1',sup:3371,units:[{type:'vac',oferta:'OFR-0018',sup:3371}]},
        {p:'PB',sup:3371,units:[{type:'com',n:'Hall / Recepción',sup:700},{type:'vac',oferta:null,sup:2671}]},
        {p:'S1',sup:3371,units:[{type:'pk',n:'Parking · 110 plazas',sup:3371,nota:'Nivel -1'}]},
        {p:'S2',sup:3371,units:[{type:'pk',n:'Parking · 82 plazas',sup:3371,nota:'Nivel -2'}]},
      ],
    },
  ],

  /* ═══════════════════════════════════════════════════════
     COLONIAL SOCIMI
  ═══════════════════════════════════════════════════════ */

  /* ── Castellana 43, Madrid ── */
  'MAD-OF-COL001': [{
    id:'A', label:'Castellana 43', supPlantaTipo:1125,
    floors:[
      {id:'P12',sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P11',sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P10',sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P9', sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P8', sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P7', sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P6', sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P5', sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P4', sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P3', sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P2', sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'P1', sup:1125,principal:[{uso:'oficinas',sup:1125}],adicional:[]},
      {id:'PB', sup:1125,principal:[{uso:'comun',sup:225},{uso:'retail',sup:900}],adicional:[]},
      {id:'S1', sup:1125,principal:[{uso:'parking',sup:1125}],adicional:[]},
    ],
    prop: own([{id:'P12',sup:1125},{id:'P11',sup:1125},{id:'P10',sup:1125},{id:'P9',sup:1125},{id:'P8',sup:1125},{id:'P7',sup:1125},{id:'P6',sup:1125},{id:'P5',sup:1125},{id:'P4',sup:1125},{id:'P3',sup:1125},{id:'P2',sup:1125},{id:'P1',sup:1125},{id:'PB',sup:1125},{id:'S1',sup:1125}], 'Colonial SOCIMI'),
    arr:[
      {p:'P12',sup:1125,units:[{type:'ten',n:'AXA Investment Managers',sup:1125,brk:'Dic 2029',brkColor:'var(--green)'}]},
      {p:'P11',sup:1125,units:[{type:'ten',n:'AXA Investment Managers',sup:1125,brk:'Dic 2029',brkColor:'var(--green)'}]},
      {p:'P10',sup:1125,units:[{type:'ten',n:'BNP Paribas Real Estate',sup:1125,brk:'Jun 2028',brkColor:'var(--green)'}]},
      {p:'P9', sup:1125,units:[{type:'ten',n:'BNP Paribas Real Estate',sup:1125,brk:'Jun 2028',brkColor:'var(--green)'}]},
      {p:'P8', sup:1125,units:[{type:'ten',n:'BNP Paribas Real Estate',sup:1125,brk:'Jun 2028',brkColor:'var(--green)'}]},
      {p:'P7', sup:1125,units:[{type:'ten',n:'Hines España SL',sup:1125,brk:'Ene 2027',brkColor:'var(--amber)'}]},
      {p:'P6', sup:1125,units:[{type:'ten',n:'Hines España SL',sup:1125,brk:'Ene 2027',brkColor:'var(--amber)'}]},
      {p:'P5', sup:1125,units:[{type:'ten',n:'Hines España SL',sup:1125,brk:'Ene 2027',brkColor:'var(--amber)'}]},
      {p:'P4', sup:1125,units:[{type:'ten',n:'Savills IM Iberia',sup:1125,brk:'Sep 2028',brkColor:'var(--green)'}]},
      {p:'P3', sup:1125,units:[{type:'ten',n:'Savills IM Iberia',sup:1125,brk:'Sep 2028',brkColor:'var(--green)'}]},
      {p:'P2', sup:1125,units:[{type:'vac',oferta:null,sup:1125}]},
      {p:'P1', sup:1125,units:[{type:'ten',n:'Allianz Real Estate',sup:1125,brk:'Mar 2030',brkColor:'var(--green)'}]},
      {p:'PB', sup:1125,units:[{type:'com',n:'Hall / Zonas comunes',sup:225},{type:'rt',n:'Cafetería',sup:900,brk:'Dic 2027',brkColor:'var(--green)'}]},
      {p:'S1', sup:1125,units:[{type:'pk',n:'Parking · 180 plazas',sup:1125,nota:'Nivel -1'}]},
    ],
  }],

  /* ── Príncipe de Vergara 112, Madrid ── */
  'MAD-OF-COL002': [{
    id:'A', label:'Príncipe de Vergara 112', supPlantaTipo:1012,
    floors:[
      {id:'P8',sup:1012,principal:[{uso:'oficinas',sup:1012}],adicional:[]},
      {id:'P7',sup:1012,principal:[{uso:'oficinas',sup:1012}],adicional:[]},
      {id:'P6',sup:1012,principal:[{uso:'oficinas',sup:1012}],adicional:[]},
      {id:'P5',sup:1012,principal:[{uso:'oficinas',sup:1012}],adicional:[]},
      {id:'P4',sup:1012,principal:[{uso:'oficinas',sup:1012}],adicional:[]},
      {id:'P3',sup:1012,principal:[{uso:'oficinas',sup:1012}],adicional:[]},
      {id:'P2',sup:1012,principal:[{uso:'oficinas',sup:1012}],adicional:[]},
      {id:'P1',sup:1012,principal:[{uso:'oficinas',sup:1012}],adicional:[]},
      {id:'PB',sup:1012,principal:[{uso:'comun',sup:200},{uso:'retail',sup:812}],adicional:[]},
      {id:'S1',sup:1012,principal:[{uso:'parking',sup:1012}],adicional:[]},
    ],
    prop: own([{id:'P8',sup:1012},{id:'P7',sup:1012},{id:'P6',sup:1012},{id:'P5',sup:1012},{id:'P4',sup:1012},{id:'P3',sup:1012},{id:'P2',sup:1012},{id:'P1',sup:1012},{id:'PB',sup:1012},{id:'S1',sup:1012}], 'Colonial SOCIMI'),
    arr:[
      {p:'P8',sup:1012,units:[{type:'ten',n:'McKinsey & Company',sup:1012,brk:'Mar 2029',brkColor:'var(--green)'}]},
      {p:'P7',sup:1012,units:[{type:'ten',n:'McKinsey & Company',sup:1012,brk:'Mar 2029',brkColor:'var(--green)'}]},
      {p:'P6',sup:1012,units:[{type:'ten',n:'McKinsey & Company',sup:1012,brk:'Mar 2029',brkColor:'var(--green)'}]},
      {p:'P5',sup:1012,units:[{type:'ten',n:'EQT Partners',sup:1012,brk:'Jun 2027',brkColor:'var(--amber)'}]},
      {p:'P4',sup:1012,units:[{type:'ten',n:'EQT Partners',sup:1012,brk:'Jun 2027',brkColor:'var(--amber)'}]},
      {p:'P3',sup:1012,units:[{type:'vac',oferta:null,sup:1012}]},
      {p:'P2',sup:1012,units:[{type:'ten',n:'Deloitte España',sup:1012,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'P1',sup:1012,units:[{type:'ten',n:'Deloitte España',sup:1012,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'PB',sup:1012,units:[{type:'com',n:'Hall',sup:200},{type:'rt',n:'Cafetería',sup:812,brk:'Jun 2028',brkColor:'var(--green)'}]},
      {p:'S1',sup:1012,units:[{type:'pk',n:'Parking · 145 plazas',sup:1012,nota:'Nivel -1'}]},
    ],
  }],

  /* ── Diagonal 530, Barcelona ── */
  'BCN-OF-COL001': [{
    id:'A', label:'Diagonal 530', supPlantaTipo:1300,
    floors:[
      {id:'P14',sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P13',sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P12',sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P11',sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P10',sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P9', sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P8', sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P7', sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P6', sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P5', sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P4', sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P3', sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P2', sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'P1', sup:1300,principal:[{uso:'oficinas',sup:1300}],adicional:[]},
      {id:'PB', sup:1300,principal:[{uso:'comun',sup:300},{uso:'retail',sup:1000}],adicional:[]},
      {id:'S1', sup:1300,principal:[{uso:'parking',sup:1300}],adicional:[]},
      {id:'S2', sup:1300,principal:[{uso:'parking',sup:1300}],adicional:[]},
    ],
    prop: own([{id:'P14',sup:1300},{id:'P13',sup:1300},{id:'P12',sup:1300},{id:'P11',sup:1300},{id:'P10',sup:1300},{id:'P9',sup:1300},{id:'P8',sup:1300},{id:'P7',sup:1300},{id:'P6',sup:1300},{id:'P5',sup:1300},{id:'P4',sup:1300},{id:'P3',sup:1300},{id:'P2',sup:1300},{id:'P1',sup:1300},{id:'PB',sup:1300},{id:'S1',sup:1300},{id:'S2',sup:1300}], 'Colonial SOCIMI'),
    arr:[
      {p:'P14',sup:1300,units:[{type:'ten',n:'Amazon Web Services',sup:1300,brk:'Sep 2030',brkColor:'var(--green)'}]},
      {p:'P13',sup:1300,units:[{type:'ten',n:'Amazon Web Services',sup:1300,brk:'Sep 2030',brkColor:'var(--green)'}]},
      {p:'P12',sup:1300,units:[{type:'ten',n:'Amazon Web Services',sup:1300,brk:'Sep 2030',brkColor:'var(--green)'}]},
      {p:'P11',sup:1300,units:[{type:'ten',n:'Amazon Web Services',sup:1300,brk:'Sep 2030',brkColor:'var(--green)'}]},
      {p:'P10',sup:1300,units:[{type:'ten',n:'Glovo · Glovoapp23 SL',sup:1300,brk:'Jun 2027',brkColor:'var(--amber)'}]},
      {p:'P9', sup:1300,units:[{type:'ten',n:'Glovo · Glovoapp23 SL',sup:1300,brk:'Jun 2027',brkColor:'var(--amber)'}]},
      {p:'P8', sup:1300,units:[{type:'ten',n:'Glovo · Glovoapp23 SL',sup:1300,brk:'Jun 2027',brkColor:'var(--amber)'}]},
      {p:'P7', sup:1300,units:[{type:'ten',n:'Vueling Airlines SAU',sup:1300,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'P6', sup:1300,units:[{type:'ten',n:'Vueling Airlines SAU',sup:1300,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'P5', sup:1300,units:[{type:'ten',n:'Vueling Airlines SAU',sup:1300,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'P4', sup:1300,units:[{type:'vac',oferta:null,sup:1300}]},
      {p:'P3', sup:1300,units:[{type:'vac',oferta:null,sup:1300}]},
      {p:'P2', sup:1300,units:[{type:'ten',n:'HP Inc. España SL',sup:1300,brk:'Mar 2027',brkColor:'var(--amber)'}]},
      {p:'P1', sup:1300,units:[{type:'ten',n:'HP Inc. España SL',sup:1300,brk:'Mar 2027',brkColor:'var(--amber)'}]},
      {p:'PB', sup:1300,units:[{type:'com',n:'Lobby',sup:300},{type:'rt',n:'Restaurante',sup:1000,brk:'Mar 2029',brkColor:'var(--green)'}]},
      {p:'S1', sup:1300,units:[{type:'pk',n:'Parking · 220 plazas',sup:1300,nota:'Nivel -1'}]},
      {p:'S2', sup:1300,units:[{type:'pk',n:'Parking · 120 plazas',sup:1300,nota:'Nivel -2'}]},
    ],
  }],

  /* ── Paseo de Gracia 11, Barcelona ── */
  'BCN-OF-COL002': [{
    id:'A', label:'Paseo de Gracia 11', supPlantaTipo:1044,
    floors:[
      {id:'P9',sup:1044,principal:[{uso:'oficinas',sup:1044}],adicional:[]},
      {id:'P8',sup:1044,principal:[{uso:'oficinas',sup:1044}],adicional:[]},
      {id:'P7',sup:1044,principal:[{uso:'oficinas',sup:1044}],adicional:[]},
      {id:'P6',sup:1044,principal:[{uso:'oficinas',sup:1044}],adicional:[]},
      {id:'P5',sup:1044,principal:[{uso:'oficinas',sup:1044}],adicional:[]},
      {id:'P4',sup:1044,principal:[{uso:'oficinas',sup:1044}],adicional:[]},
      {id:'P3',sup:1044,principal:[{uso:'oficinas',sup:1044}],adicional:[]},
      {id:'P2',sup:1044,principal:[{uso:'oficinas',sup:1044}],adicional:[]},
      {id:'P1',sup:1044,principal:[{uso:'oficinas',sup:1044}],adicional:[]},
      {id:'PB',sup:1044,principal:[{uso:'comun',sup:200},{uso:'retail',sup:844}],adicional:[]},
      {id:'S1',sup:1044,principal:[{uso:'parking',sup:1044}],adicional:[]},
    ],
    prop: own([{id:'P9',sup:1044},{id:'P8',sup:1044},{id:'P7',sup:1044},{id:'P6',sup:1044},{id:'P5',sup:1044},{id:'P4',sup:1044},{id:'P3',sup:1044},{id:'P2',sup:1044},{id:'P1',sup:1044},{id:'PB',sup:1044},{id:'S1',sup:1044}], 'Colonial SOCIMI'),
    arr:[
      {p:'P9',sup:1044,units:[{type:'ten',n:'Puig Group',sup:1044,brk:'Jun 2031',brkColor:'var(--green)'}]},
      {p:'P8',sup:1044,units:[{type:'ten',n:'Puig Group',sup:1044,brk:'Jun 2031',brkColor:'var(--green)'}]},
      {p:'P7',sup:1044,units:[{type:'ten',n:'Puig Group',sup:1044,brk:'Jun 2031',brkColor:'var(--green)'}]},
      {p:'P6',sup:1044,units:[{type:'ten',n:'KPMG España SL',sup:1044,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'P5',sup:1044,units:[{type:'ten',n:'KPMG España SL',sup:1044,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'P4',sup:1044,units:[{type:'ten',n:'KPMG España SL',sup:1044,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'P3',sup:1044,units:[{type:'ten',n:'Cuatrecasas Gonçalves',sup:1044,brk:'Mar 2030',brkColor:'var(--green)'}]},
      {p:'P2',sup:1044,units:[{type:'ten',n:'Cuatrecasas Gonçalves',sup:1044,brk:'Mar 2030',brkColor:'var(--green)'}]},
      {p:'P1',sup:1044,units:[{type:'ten',n:'Cuatrecasas Gonçalves',sup:1044,brk:'Mar 2030',brkColor:'var(--green)'}]},
      {p:'PB',sup:1044,units:[{type:'com',n:'Lobby',sup:200},{type:'rt',n:'Cafetería',sup:844,brk:'Jun 2028',brkColor:'var(--green)'}]},
      {p:'S1',sup:1044,units:[{type:'pk',n:'Parking · 155 plazas',sup:1044,nota:'Nivel -1'}]},
    ],
  }],

  /* ═══════════════════════════════════════════════════════
     MERLÍN PROPERTIES SOCIMI
  ═══════════════════════════════════════════════════════ */

  /* ── Parque Adequa Edif. 1, Madrid ── */
  'MAD-OF-MRL001': [{
    id:'A', label:'Parque Adequa — Edif. 1', supPlantaTipo:3143,
    floors:[
      {id:'P6',sup:3143,principal:[{uso:'oficinas',sup:3143}],adicional:[]},
      {id:'P5',sup:3143,principal:[{uso:'oficinas',sup:3143}],adicional:[]},
      {id:'P4',sup:3143,principal:[{uso:'oficinas',sup:3143}],adicional:[]},
      {id:'P3',sup:3143,principal:[{uso:'oficinas',sup:3143}],adicional:[]},
      {id:'P2',sup:3143,principal:[{uso:'oficinas',sup:3143}],adicional:[]},
      {id:'P1',sup:3143,principal:[{uso:'oficinas',sup:3143}],adicional:[]},
      {id:'PB',sup:3143,principal:[{uso:'comun',sup:600},{uso:'retail',sup:2543}],adicional:[]},
      {id:'S1',sup:3143,principal:[{uso:'parking',sup:3143}],adicional:[]},
      {id:'S2',sup:3143,principal:[{uso:'parking',sup:3143}],adicional:[]},
    ],
    prop: own([{id:'P6',sup:3143},{id:'P5',sup:3143},{id:'P4',sup:3143},{id:'P3',sup:3143},{id:'P2',sup:3143},{id:'P1',sup:3143},{id:'PB',sup:3143},{id:'S1',sup:3143},{id:'S2',sup:3143}], 'Merlín Properties SOCIMI'),
    arr:[
      {p:'P6',sup:3143,units:[{type:'ten',n:'BBVA · Dir. Corporativa',sup:3143,brk:'Jun 2030',brkColor:'var(--green)'}]},
      {p:'P5',sup:3143,units:[{type:'ten',n:'BBVA · Dir. Corporativa',sup:3143,brk:'Jun 2030',brkColor:'var(--green)'}]},
      {p:'P4',sup:3143,units:[{type:'ten',n:'BBVA · Dir. Corporativa',sup:3143,brk:'Jun 2030',brkColor:'var(--green)'}]},
      {p:'P3',sup:3143,units:[{type:'ten',n:'Accenture Spain SL',sup:3143,brk:'Dic 2027',brkColor:'var(--amber)'}]},
      {p:'P2',sup:3143,units:[{type:'ten',n:'Indra Sistemas SA',sup:3143,brk:'Sep 2028',brkColor:'var(--green)'}]},
      {p:'P1',sup:3143,units:[{type:'vac',oferta:null,sup:3143}]},
      {p:'PB',sup:3143,units:[{type:'com',n:'Cafetería Central',sup:600},{type:'rt',n:'Restaurante',sup:2543,brk:'Mar 2029',brkColor:'var(--green)'}]},
      {p:'S1',sup:3143,units:[{type:'pk',n:'Parking · 520 plazas',sup:3143,nota:'Nivel -1'}]},
      {p:'S2',sup:3143,units:[{type:'pk',n:'Parking · 280 plazas',sup:3143,nota:'Nivel -2'}]},
    ],
  }],

  /* ── Torre Chamartín 259A, Madrid ── */
  'MAD-OF-MRL002': [{
    id:'A', label:'Torre Chamartín 259A', supPlantaTipo:1333,
    floors:[
      ...Array.from({length:24},(_,i)=>({id:`P${24-i}`,sup:1333,principal:[{uso:'oficinas',sup:1333}],adicional:[]})),
      {id:'PB',sup:1333,principal:[{uso:'comun',sup:400},{uso:'retail',sup:933}],adicional:[]},
      {id:'S1',sup:1333,principal:[{uso:'parking',sup:1333}],adicional:[]},
      {id:'S2',sup:1333,principal:[{uso:'parking',sup:1333}],adicional:[]},
      {id:'S3',sup:1333,principal:[{uso:'parking',sup:1333}],adicional:[]},
    ],
    prop: [
      ...Array.from({length:24},(_,i)=>({p:`P${24-i}`,sup:1333,units:[{n:'Merlín Properties SOCIMI',sup:1333}]})),
      {p:'PB',sup:1333,units:[{n:'Merlín Properties SOCIMI',sup:1333}]},
      {p:'S1',sup:1333,units:[{n:'Merlín Properties SOCIMI',sup:1333}]},
      {p:'S2',sup:1333,units:[{n:'Merlín Properties SOCIMI',sup:1333}]},
      {p:'S3',sup:1333,units:[{n:'Merlín Properties SOCIMI',sup:1333}]},
    ],
    arr:[
      ...[24,23,22,21,20].map(n=>({p:`P${n}`,sup:1333,units:[{type:'ten',n:'Google España SL',sup:1333,brk:'Jun 2032',brkColor:'var(--green)'}]})),
      ...[19,18,17,16,15].map(n=>({p:`P${n}`,sup:1333,units:[{type:'ten',n:'Microsoft Ibérica SRL',sup:1333,brk:'Dic 2030',brkColor:'var(--green)'}]})),
      ...[14,13,12,11,10].map(n=>({p:`P${n}`,sup:1333,units:[{type:'ten',n:'Telefónica SA',sup:1333,brk:'Sep 2028',brkColor:'var(--green)'}]})),
      ...[9,8,7,6].map(n=>({p:`P${n}`,sup:1333,units:[{type:'ten',n:'Accenture Spain SL',sup:1333,brk:'Mar 2027',brkColor:'var(--amber)'}]})),
      ...[5,4,3,2].map(n=>({p:`P${n}`,sup:1333,units:[{type:'vac',oferta:null,sup:1333}]})),
      {p:'P1',sup:1333,units:[{type:'ten',n:'Workspring · Flex',sup:1333,brk:'Jun 2026',brkColor:'var(--red)'}]},
      {p:'PB',sup:1333,units:[{type:'com',n:'Lobby',sup:400},{type:'rt',n:'Starbucks',sup:933,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'S1',sup:1333,units:[{type:'pk',n:'Parking · 310 plazas',sup:1333,nota:'Nivel -1'}]},
      {p:'S2',sup:1333,units:[{type:'pk',n:'Parking · 310 plazas',sup:1333,nota:'Nivel -2'}]},
      {p:'S3',sup:1333,units:[{type:'pk',n:'Parking · 180 plazas',sup:1333,nota:'Nivel -3'}]},
    ],
  }],

  /* ── P.L. Guadalajara Nave 1 (Logístico) ── */
  'GUA-LG-MRL001': [{
    id:'A', label:'Nave Principal', supPlantaTipo:40000,
    floors:[
      {id:'Nave PB',    sup:40000,principal:[{uso:'logistico',sup:40000}],adicional:[{uso:'muelles_carga',label:'Muelles de carga · 42 ud.',sup:0,attr:false},{uso:'playa_maniobras',label:'Playa maniobras · 35m',sup:0,attr:false}]},
      {id:'Entreplanta', sup:2000, principal:[{uso:'oficinas',sup:2000}],adicional:[]},
      {id:'S1 Parking', sup:5000, principal:[{uso:'parking',sup:5000}],adicional:[{uso:'pk_camiones',label:'Parking camiones · 18 plazas',sup:5000,attr:false}]},
    ],
    prop:[
      {p:'Nave PB',    sup:40000,units:[{n:'Merlín Properties SOCIMI',sup:40000}]},
      {p:'Entreplanta',sup:2000, units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'S1 Parking', sup:5000, units:[{n:'Merlín Properties SOCIMI',sup:5000}]},
    ],
    arr:[
      {p:'Nave PB',    sup:40000,units:[{type:'ten',n:'DHL Supply Chain Spain SL',sup:40000,brk:'Dic 2029',brkColor:'var(--green)'}]},
      {p:'Entreplanta',sup:2000, units:[{type:'ten',n:'DHL Supply Chain Spain SL',sup:2000,brk:'Dic 2029',brkColor:'var(--green)'}]},
      {p:'S1 Parking', sup:5000, units:[{type:'pk',n:'Parking · 18 camiones + 45 turismos',sup:5000,nota:'Exterior'}]},
    ],
  }],

  /* ── Cross Dock Coslada (Logístico) ── */
  'MAD-LG-MRL002': [{
    id:'A', label:'Cross Dock Coslada', supPlantaTipo:18000,
    floors:[
      {id:'Nave PB',    sup:18000,principal:[{uso:'logistico',sup:18000}],adicional:[{uso:'cross_docking',label:'Cross-docking · zona central',sup:0,attr:false},{uso:'muelles_carga',label:'Muelles · 28 ud.',sup:0,attr:false}]},
      {id:'Entreplanta',sup:1200, principal:[{uso:'oficinas',sup:1200}],adicional:[]},
      {id:'Exterior',   sup:8000, principal:[{uso:'parking',sup:8000}],adicional:[{uso:'pk_camiones',label:'Parking camiones · 24 plazas',sup:8000,attr:false}]},
    ],
    prop:[
      {p:'Nave PB',    sup:18000,units:[{n:'Merlín Properties SOCIMI',sup:18000}]},
      {p:'Entreplanta',sup:1200, units:[{n:'Merlín Properties SOCIMI',sup:1200}]},
      {p:'Exterior',   sup:8000, units:[{n:'Merlín Properties SOCIMI',sup:8000}]},
    ],
    arr:[
      {p:'Nave PB',    sup:18000,units:[{type:'ten',n:'Decathlon España SA',sup:10800,brk:'Jun 2028',brkColor:'var(--green)'},{type:'ten',n:'Zara Logistics SLU',sup:3600,brk:'Mar 2027',brkColor:'var(--amber)'},{type:'vac',oferta:null,sup:3600}]},
      {p:'Entreplanta',sup:1200, units:[{type:'ten',n:'Decathlon España SA',sup:800,brk:'Jun 2028',brkColor:'var(--green)'},{type:'vac',oferta:null,sup:400}]},
      {p:'Exterior',   sup:8000, units:[{type:'pk',n:'Parking camiones + vehículos',sup:8000,nota:'Uso común'}]},
    ],
  }],

  /* ── Data Center Alcalá de Henares ── */
  'MAD-DC-MRL001': [{
    id:'A', label:'Data Center Alcalá', supPlantaTipo:2000,
    floors:[
      {id:'Hall técnico',  sup:800, principal:[{uso:'datacenter',sup:800}], adicional:[]},
      {id:'Sala T1',       sup:2000,principal:[{uso:'datacenter',sup:2000}],adicional:[]},
      {id:'Sala T2',       sup:2000,principal:[{uso:'datacenter',sup:2000}],adicional:[]},
      {id:'Sala T3',       sup:2000,principal:[{uso:'datacenter',sup:2000}],adicional:[]},
      {id:'Sala T4',       sup:2000,principal:[{uso:'datacenter',sup:2000}],adicional:[]},
      {id:'UPS / Generadores',sup:1200,principal:[{uso:'datacenter',sup:1200}],adicional:[]},
      {id:'Oficinas / NOC',sup:800, principal:[{uso:'oficinas',sup:800}],  adicional:[]},
      {id:'Parking',       sup:1000,principal:[{uso:'parking',sup:1000}],  adicional:[]},
    ],
    prop:[
      {p:'Hall técnico',   sup:800, units:[{n:'Merlín Properties SOCIMI',sup:800}]},
      {p:'Sala T1',        sup:2000,units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'Sala T2',        sup:2000,units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'Sala T3',        sup:2000,units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'Sala T4',        sup:2000,units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'UPS / Generadores',sup:1200,units:[{n:'Merlín Properties SOCIMI',sup:1200}]},
      {p:'Oficinas / NOC', sup:800, units:[{n:'Merlín Properties SOCIMI',sup:800}]},
      {p:'Parking',        sup:1000,units:[{n:'Merlín Properties SOCIMI',sup:1000}]},
    ],
    arr:[
      {p:'Hall técnico',   sup:800, units:[{type:'com',n:'Recepción / Control acceso',sup:800}]},
      {p:'Sala T1',        sup:2000,units:[{type:'ten',n:'Microsoft Azure · Región Sur',sup:2000,brk:'Dic 2032',brkColor:'var(--green)'}]},
      {p:'Sala T2',        sup:2000,units:[{type:'ten',n:'Microsoft Azure · Región Sur',sup:2000,brk:'Dic 2032',brkColor:'var(--green)'}]},
      {p:'Sala T3',        sup:2000,units:[{type:'ten',n:'Microsoft Azure · Región Sur',sup:2000,brk:'Dic 2032',brkColor:'var(--green)'}]},
      {p:'Sala T4',        sup:2000,units:[{type:'ten',n:'Microsoft Azure · Región Sur',sup:2000,brk:'Dic 2032',brkColor:'var(--green)'}]},
      {p:'UPS / Generadores',sup:1200,units:[{type:'com',n:'Infraestructura eléctrica · Merlín',sup:1200}]},
      {p:'Oficinas / NOC', sup:800, units:[{type:'ten',n:'Microsoft Azure · NOC 24h',sup:800,brk:'Dic 2032',brkColor:'var(--green)'}]},
      {p:'Parking',        sup:1000,units:[{type:'pk',n:'Parking · 45 plazas',sup:1000,nota:'Uso común'}]},
    ],
  }],

  /* ── Data Center Madrid Sur ── */
  'MAD-DC-MRL002': [{
    id:'A', label:'Data Center Madrid Sur', supPlantaTipo:2000,
    floors:[
      {id:'Hall técnico',  sup:1000,principal:[{uso:'datacenter',sup:1000}],adicional:[]},
      {id:'Sala T1',       sup:2000,principal:[{uso:'datacenter',sup:2000}],adicional:[]},
      {id:'Sala T2',       sup:2000,principal:[{uso:'datacenter',sup:2000}],adicional:[]},
      {id:'Sala T3',       sup:2000,principal:[{uso:'datacenter',sup:2000}],adicional:[]},
      {id:'Sala T4',       sup:2000,principal:[{uso:'datacenter',sup:2000}],adicional:[]},
      {id:'Sala T5',       sup:2000,principal:[{uso:'datacenter',sup:2000}],adicional:[]},
      {id:'Sala T6',       sup:2000,principal:[{uso:'datacenter',sup:2000}],adicional:[]},
      {id:'UPS / Generadores',sup:1500,principal:[{uso:'datacenter',sup:1500}],adicional:[]},
      {id:'Oficinas / NOC',sup:800, principal:[{uso:'oficinas',sup:800}],  adicional:[]},
      {id:'Parking',       sup:1200,principal:[{uso:'parking',sup:1200}],  adicional:[]},
    ],
    prop:[
      {p:'Hall técnico',   sup:1000,units:[{n:'Merlín Properties SOCIMI',sup:1000}]},
      {p:'Sala T1',        sup:2000,units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'Sala T2',        sup:2000,units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'Sala T3',        sup:2000,units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'Sala T4',        sup:2000,units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'Sala T5',        sup:2000,units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'Sala T6',        sup:2000,units:[{n:'Merlín Properties SOCIMI',sup:2000}]},
      {p:'UPS / Generadores',sup:1500,units:[{n:'Merlín Properties SOCIMI',sup:1500}]},
      {p:'Oficinas / NOC', sup:800, units:[{n:'Merlín Properties SOCIMI',sup:800}]},
      {p:'Parking',        sup:1200,units:[{n:'Merlín Properties SOCIMI',sup:1200}]},
    ],
    arr:[
      {p:'Hall técnico',   sup:1000,units:[{type:'com',n:'Recepción / Control acceso',sup:1000}]},
      {p:'Sala T1',        sup:2000,units:[{type:'ten',n:'Amazon Web Services · AZ-MAD1',sup:2000,brk:'Sep 2033',brkColor:'var(--green)'}]},
      {p:'Sala T2',        sup:2000,units:[{type:'ten',n:'Amazon Web Services · AZ-MAD1',sup:2000,brk:'Sep 2033',brkColor:'var(--green)'}]},
      {p:'Sala T3',        sup:2000,units:[{type:'ten',n:'Amazon Web Services · AZ-MAD1',sup:2000,brk:'Sep 2033',brkColor:'var(--green)'}]},
      {p:'Sala T4',        sup:2000,units:[{type:'ten',n:'Amazon Web Services · AZ-MAD2',sup:2000,brk:'Sep 2033',brkColor:'var(--green)'}]},
      {p:'Sala T5',        sup:2000,units:[{type:'vac',oferta:null,sup:2000}]},
      {p:'Sala T6',        sup:2000,units:[{type:'vac',oferta:null,sup:2000}]},
      {p:'UPS / Generadores',sup:1500,units:[{type:'com',n:'Infraestructura eléctrica · Merlín',sup:1500}]},
      {p:'Oficinas / NOC', sup:800, units:[{type:'ten',n:'Amazon Web Services · NOC',sup:800,brk:'Sep 2033',brkColor:'var(--green)'}]},
      {p:'Parking',        sup:1200,units:[{type:'pk',n:'Parking · 60 plazas',sup:1200,nota:'Uso común'}]},
    ],
  }],

  /* ═══════════════════════════════════════════════════════
     GMP PROPERTY SOCIMI
  ═══════════════════════════════════════════════════════ */

  /* ── Castellana 77, Madrid ── */
  'MAD-OF-GMP001': [{
    id:'A', label:'Castellana 77', supPlantaTipo:1059,
    floors:[
      ...Array.from({length:17},(_,i)=>({id:`P${17-i}`,sup:1059,principal:[{uso:'oficinas',sup:1059}],adicional:[]})),
      {id:'PB',sup:1059,principal:[{uso:'comun',sup:220},{uso:'retail',sup:839}],adicional:[]},
      {id:'S1',sup:1059,principal:[{uso:'parking',sup:1059}],adicional:[]},
      {id:'S2',sup:1059,principal:[{uso:'parking',sup:1059}],adicional:[]},
    ],
    prop:[
      ...Array.from({length:17},(_,i)=>({p:`P${17-i}`,sup:1059,units:[{n:'GMP Property SOCIMI',sup:1059}]})),
      {p:'PB',sup:1059,units:[{n:'GMP Property SOCIMI',sup:1059}]},
      {p:'S1',sup:1059,units:[{n:'GMP Property SOCIMI',sup:1059}]},
      {p:'S2',sup:1059,units:[{n:'GMP Property SOCIMI',sup:1059}]},
    ],
    arr:[
      ...[17,16,15,14].map(n=>({p:`P${n}`,sup:1059,units:[{type:'ten',n:'Garrigues Abogados SLP',sup:1059,brk:'Jun 2030',brkColor:'var(--green)'}]})),
      ...[13,12,11,10].map(n=>({p:`P${n}`,sup:1059,units:[{type:'ten',n:'Banco Santander SA',sup:1059,brk:'Dic 2028',brkColor:'var(--green)'}]})),
      ...[9,8,7].map(n=>({p:`P${n}`,sup:1059,units:[{type:'ten',n:'Oliver Wyman Consultores SL',sup:1059,brk:'Sep 2027',brkColor:'var(--amber)'}]})),
      ...[6,5,4].map(n=>({p:`P${n}`,sup:1059,units:[{type:'ten',n:'Ernst & Young SL',sup:1059,brk:'Mar 2029',brkColor:'var(--green)'}]})),
      ...[3,2].map(n=>({p:`P${n}`,sup:1059,units:[{type:'vac',oferta:null,sup:1059}]})),
      {p:'P1',sup:1059,units:[{type:'vac',oferta:null,sup:1059}]},
      {p:'PB',sup:1059,units:[{type:'com',n:'Lobby',sup:220},{type:'rt',n:'Cafetería',sup:839,brk:'Jun 2028',brkColor:'var(--green)'}]},
      {p:'S1',sup:1059,units:[{type:'pk',n:'Parking · 185 plazas',sup:1059,nota:'Nivel -1'}]},
      {p:'S2',sup:1059,units:[{type:'pk',n:'Parking · 120 plazas',sup:1059,nota:'Nivel -2'}]},
    ],
  }],

  /* ── Capitán Haya 22, Madrid ── */
  'MAD-OF-GMP002': [{
    id:'A', label:'Capitán Haya 22', supPlantaTipo:1250,
    floors:[
      {id:'P10',sup:1250,principal:[{uso:'oficinas',sup:1250}],adicional:[]},
      {id:'P9', sup:1250,principal:[{uso:'oficinas',sup:1250}],adicional:[]},
      {id:'P8', sup:1250,principal:[{uso:'oficinas',sup:1250}],adicional:[]},
      {id:'P7', sup:1250,principal:[{uso:'oficinas',sup:1250}],adicional:[]},
      {id:'P6', sup:1250,principal:[{uso:'oficinas',sup:1250}],adicional:[]},
      {id:'P5', sup:1250,principal:[{uso:'oficinas',sup:1250}],adicional:[]},
      {id:'P4', sup:1250,principal:[{uso:'oficinas',sup:1250}],adicional:[]},
      {id:'P3', sup:1250,principal:[{uso:'oficinas',sup:1250}],adicional:[]},
      {id:'P2', sup:1250,principal:[{uso:'oficinas',sup:1250}],adicional:[]},
      {id:'P1', sup:1250,principal:[{uso:'oficinas',sup:1250}],adicional:[]},
      {id:'PB', sup:1250,principal:[{uso:'comun',sup:250},{uso:'retail',sup:1000}],adicional:[]},
      {id:'S1', sup:1250,principal:[{uso:'parking',sup:1250}],adicional:[]},
    ],
    prop: own([{id:'P10',sup:1250},{id:'P9',sup:1250},{id:'P8',sup:1250},{id:'P7',sup:1250},{id:'P6',sup:1250},{id:'P5',sup:1250},{id:'P4',sup:1250},{id:'P3',sup:1250},{id:'P2',sup:1250},{id:'P1',sup:1250},{id:'PB',sup:1250},{id:'S1',sup:1250}], 'GMP Property SOCIMI'),
    arr:[
      {p:'P10',sup:1250,units:[{type:'ten',n:'NTT DATA Spain SLU',sup:1250,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'P9', sup:1250,units:[{type:'ten',n:'NTT DATA Spain SLU',sup:1250,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'P8', sup:1250,units:[{type:'ten',n:'NTT DATA Spain SLU',sup:1250,brk:'Dic 2028',brkColor:'var(--green)'}]},
      {p:'P7', sup:1250,units:[{type:'ten',n:'Vodafone España SA',sup:1250,brk:'Jun 2027',brkColor:'var(--amber)'}]},
      {p:'P6', sup:1250,units:[{type:'ten',n:'Vodafone España SA',sup:1250,brk:'Jun 2027',brkColor:'var(--amber)'}]},
      {p:'P5', sup:1250,units:[{type:'ten',n:'Vodafone España SA',sup:1250,brk:'Jun 2027',brkColor:'var(--amber)'}]},
      {p:'P4', sup:1250,units:[{type:'ten',n:'Marsh McLennan España',sup:1250,brk:'Sep 2028',brkColor:'var(--green)'}]},
      {p:'P3', sup:1250,units:[{type:'vac',oferta:null,sup:1250}]},
      {p:'P2', sup:1250,units:[{type:'vac',oferta:null,sup:1250}]},
      {p:'P1', sup:1250,units:[{type:'ten',n:'PwC Consulting SL',sup:1250,brk:'Mar 2029',brkColor:'var(--green)'}]},
      {p:'PB', sup:1250,units:[{type:'com',n:'Lobby',sup:250},{type:'rt',n:'Cafetería',sup:1000,brk:'Jun 2028',brkColor:'var(--green)'}]},
      {p:'S1', sup:1250,units:[{type:'pk',n:'Parking · 170 plazas',sup:1250,nota:'Nivel -1'}]},
    ],
  }],

  /* ── Josefa Valcárcel 26, Madrid ── */
  'MAD-OF-GMP003': [{
    id:'A', label:'Josefa Valcárcel 26', supPlantaTipo:1225,
    floors:[
      {id:'P8',sup:1225,principal:[{uso:'oficinas',sup:1225}],adicional:[]},
      {id:'P7',sup:1225,principal:[{uso:'oficinas',sup:1225}],adicional:[]},
      {id:'P6',sup:1225,principal:[{uso:'oficinas',sup:1225}],adicional:[]},
      {id:'P5',sup:1225,principal:[{uso:'oficinas',sup:1225}],adicional:[]},
      {id:'P4',sup:1225,principal:[{uso:'oficinas',sup:1225}],adicional:[]},
      {id:'P3',sup:1225,principal:[{uso:'oficinas',sup:1225}],adicional:[]},
      {id:'P2',sup:1225,principal:[{uso:'oficinas',sup:1225}],adicional:[]},
      {id:'P1',sup:1225,principal:[{uso:'oficinas',sup:1225}],adicional:[]},
      {id:'PB',sup:1225,principal:[{uso:'comun',sup:225},{uso:'retail',sup:1000}],adicional:[]},
      {id:'S1',sup:1225,principal:[{uso:'parking',sup:1225}],adicional:[]},
    ],
    prop: own([{id:'P8',sup:1225},{id:'P7',sup:1225},{id:'P6',sup:1225},{id:'P5',sup:1225},{id:'P4',sup:1225},{id:'P3',sup:1225},{id:'P2',sup:1225},{id:'P1',sup:1225},{id:'PB',sup:1225},{id:'S1',sup:1225}], 'GMP Property SOCIMI'),
    arr:[
      {p:'P8',sup:1225,units:[{type:'ten',n:'Sanitas SA de Seguros',sup:1225,brk:'Dic 2030',brkColor:'var(--green)'}]},
      {p:'P7',sup:1225,units:[{type:'ten',n:'Sanitas SA de Seguros',sup:1225,brk:'Dic 2030',brkColor:'var(--green)'}]},
      {p:'P6',sup:1225,units:[{type:'ten',n:'Sanitas SA de Seguros',sup:1225,brk:'Dic 2030',brkColor:'var(--green)'}]},
      {p:'P5',sup:1225,units:[{type:'ten',n:'Gartner España SL',sup:1225,brk:'Mar 2028',brkColor:'var(--amber)'}]},
      {p:'P4',sup:1225,units:[{type:'ten',n:'Gartner España SL',sup:1225,brk:'Mar 2028',brkColor:'var(--amber)'}]},
      {p:'P3',sup:1225,units:[{type:'ten',n:'Gartner España SL',sup:1225,brk:'Mar 2028',brkColor:'var(--amber)'}]},
      {p:'P2',sup:1225,units:[{type:'vac',oferta:null,sup:1225}]},
      {p:'P1',sup:1225,units:[{type:'ten',n:'Ferrovial SA',sup:1225,brk:'Jun 2029',brkColor:'var(--green)'}]},
      {p:'PB',sup:1225,units:[{type:'com',n:'Lobby',sup:225},{type:'rt',n:'Cafetería',sup:1000,brk:'Jun 2028',brkColor:'var(--green)'}]},
      {p:'S1',sup:1225,units:[{type:'pk',n:'Parking · 160 plazas',sup:1225,nota:'Nivel -1'}]},
    ],
  }],

  /* ── Hontanares 35, Alcobendas ── */
  'MAD-OF-GMP004': [{
    id:'A', label:'Hontanares 35', supPlantaTipo:1350,
    floors:[
      {id:'P12',sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P11',sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P10',sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P9', sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P8', sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P7', sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P6', sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P5', sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P4', sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P3', sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P2', sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'P1', sup:1350,principal:[{uso:'oficinas',sup:1350}],adicional:[]},
      {id:'PB', sup:1350,principal:[{uso:'comun',sup:300},{uso:'retail',sup:1050}],adicional:[]},
      {id:'S1', sup:1350,principal:[{uso:'parking',sup:1350}],adicional:[]},
    ],
    prop: own([{id:'P12',sup:1350},{id:'P11',sup:1350},{id:'P10',sup:1350},{id:'P9',sup:1350},{id:'P8',sup:1350},{id:'P7',sup:1350},{id:'P6',sup:1350},{id:'P5',sup:1350},{id:'P4',sup:1350},{id:'P3',sup:1350},{id:'P2',sup:1350},{id:'P1',sup:1350},{id:'PB',sup:1350},{id:'S1',sup:1350}], 'GMP Property SOCIMI'),
    arr:[
      ...[12,11,10,9].map(n=>({p:`P${n}`,sup:1350,units:[{type:'ten',n:'Pfizer España SA',sup:1350,brk:'Jun 2031',brkColor:'var(--green)'}]})),
      ...[8,7,6].map(n=>({p:`P${n}`,sup:1350,units:[{type:'ten',n:'AbbVie Spain SLU',sup:1350,brk:'Sep 2029',brkColor:'var(--green)'}]})),
      {p:'P5',sup:1350,units:[{type:'vac',oferta:null,sup:1350}]},
      ...[4,3,2].map(n=>({p:`P${n}`,sup:1350,units:[{type:'ten',n:'Reckitt Benckiser España SA',sup:1350,brk:'Mar 2028',brkColor:'var(--amber)'}]})),
      {p:'P1',sup:1350,units:[{type:'ten',n:'Reckitt Benckiser España SA',sup:1350,brk:'Mar 2028',brkColor:'var(--amber)'}]},
      {p:'PB',sup:1350,units:[{type:'com',n:'Lobby',sup:300},{type:'rt',n:'Cafetería',sup:1050,brk:'Jun 2029',brkColor:'var(--green)'}]},
      {p:'S1',sup:1350,units:[{type:'pk',n:'Parking · 200 plazas',sup:1350,nota:'Nivel -1'}]},
    ],
  }],

  /* ═══════════════════════════════════════════════════════
     PROMOCIÓN RESIDENCIAL — Valdebebas, Madrid
  ═══════════════════════════════════════════════════════ */
  'MAD-RES-001': [{
    id:'A', label:'Bloque A', supPlantaTipo:420,
    floors:[
      // Áticos
      {id:'P8 Ático',sup:380,principal:[{uso:'residencial',sup:190},{uso:'residencial',sup:190}],adicional:[{uso:'terraza',label:'Terrazas privadas',sup:120,attr:false}]},
      // Plantas tipo: 4 viviendas/planta
      {id:'P7',sup:420,principal:[{uso:'residencial',sup:120},{uso:'residencial',sup:90},{uso:'residencial',sup:90},{uso:'residencial',sup:65},{uso:'comun',sup:55}],adicional:[]},
      {id:'P6',sup:420,principal:[{uso:'residencial',sup:120},{uso:'residencial',sup:90},{uso:'residencial',sup:90},{uso:'residencial',sup:65},{uso:'comun',sup:55}],adicional:[]},
      {id:'P5',sup:420,principal:[{uso:'residencial',sup:120},{uso:'residencial',sup:90},{uso:'residencial',sup:90},{uso:'residencial',sup:65},{uso:'comun',sup:55}],adicional:[]},
      {id:'P4',sup:420,principal:[{uso:'residencial',sup:120},{uso:'residencial',sup:90},{uso:'residencial',sup:90},{uso:'residencial',sup:65},{uso:'comun',sup:55}],adicional:[]},
      {id:'P3',sup:420,principal:[{uso:'residencial',sup:120},{uso:'residencial',sup:90},{uso:'residencial',sup:90},{uso:'residencial',sup:65},{uso:'comun',sup:55}],adicional:[]},
      {id:'P2',sup:420,principal:[{uso:'residencial',sup:120},{uso:'residencial',sup:90},{uso:'residencial',sup:90},{uso:'residencial',sup:65},{uso:'comun',sup:55}],adicional:[]},
      {id:'P1',sup:420,principal:[{uso:'residencial',sup:120},{uso:'residencial',sup:90},{uso:'retail',sup:150},{uso:'comun',sup:60}],adicional:[]},
      {id:'PB',sup:420,principal:[{uso:'comun',sup:420}],adicional:[{uso:'salon_comun',label:'Hall de entrada · buzones',sup:420,attr:false}]},
      {id:'S1',sup:420,principal:[{uso:'parking',sup:420}],adicional:[{uso:'trasteros',label:'Trasteros · 42 ud.',sup:0,attr:false}]},
    ],
    prop: own([
      {id:'P8 Ático',sup:380},{id:'P7',sup:420},{id:'P6',sup:420},{id:'P5',sup:420},{id:'P4',sup:420},{id:'P3',sup:420},{id:'P2',sup:420},{id:'P1',sup:420},{id:'PB',sup:420},{id:'S1',sup:420}
    ], 'Promociones Inmobiliarias Valdebebas SA'),
    arr:[
      // Áticos — 1 vendido, 1 reservado
      {p:'P8 Ático',sup:380,units:[
        {type:'ten',n:'García Pérez, M. (Vendido)',sup:190,brk:'—',brkColor:'var(--green)'},
        {type:'vac',oferta:'RES-AT01',sup:190},
      ]},
      // P7 — 2 vendidos, 2 disponibles
      {p:'P7',sup:420,units:[
        {type:'ten',n:'Martínez López, J. · 3H (Vendido)',sup:120,brk:'—',brkColor:'var(--green)'},
        {type:'ten',n:'Rodríguez Gil, A. · 2H (Vendido)',sup:90,brk:'—',brkColor:'var(--green)'},
        {type:'vac',oferta:'RES-P7B',sup:90},
        {type:'vac',oferta:'RES-P7D',sup:65},
        {type:'com',n:'Zonas comunes',sup:55},
      ]},
      // P6 — 3 vendidos, 1 disponible
      {p:'P6',sup:420,units:[
        {type:'ten',n:'Sánchez Ruiz, C. · 3H (Vendido)',sup:120,brk:'—',brkColor:'var(--green)'},
        {type:'ten',n:'Fernández Moya, L. · 2H (Vendido)',sup:90,brk:'—',brkColor:'var(--green)'},
        {type:'ten',n:'Torres Vega, R. · 2H (Reservado)',sup:90,brk:'—',brkColor:'var(--amber)'},
        {type:'vac',oferta:'RES-P6D',sup:65},
        {type:'com',n:'Zonas comunes',sup:55},
      ]},
      // P5 — 1 vendido, 3 disponibles
      {p:'P5',sup:420,units:[
        {type:'ten',n:'López Herrera, P. · 3H (Vendido)',sup:120,brk:'—',brkColor:'var(--green)'},
        {type:'vac',oferta:'RES-P5B',sup:90},
        {type:'vac',oferta:'RES-P5C',sup:90},
        {type:'vac',oferta:'RES-P5D',sup:65},
        {type:'com',n:'Zonas comunes',sup:55},
      ]},
      // P4, P3, P2 — disponibles
      {p:'P4',sup:420,units:[
        {type:'vac',oferta:'RES-P4A',sup:120},
        {type:'vac',oferta:'RES-P4B',sup:90},
        {type:'vac',oferta:'RES-P4C',sup:90},
        {type:'vac',oferta:'RES-P4D',sup:65},
        {type:'com',n:'Zonas comunes',sup:55},
      ]},
      {p:'P3',sup:420,units:[
        {type:'vac',oferta:'RES-P3A',sup:120},
        {type:'vac',oferta:'RES-P3B',sup:90},
        {type:'vac',oferta:'RES-P3C',sup:90},
        {type:'vac',oferta:'RES-P3D',sup:65},
        {type:'com',n:'Zonas comunes',sup:55},
      ]},
      {p:'P2',sup:420,units:[
        {type:'vac',oferta:'RES-P2A',sup:120},
        {type:'vac',oferta:'RES-P2B',sup:90},
        {type:'vac',oferta:'RES-P2C',sup:90},
        {type:'vac',oferta:'RES-P2D',sup:65},
        {type:'com',n:'Zonas comunes',sup:55},
      ]},
      {p:'P1',sup:420,units:[
        {type:'vac',oferta:'RES-P1A',sup:120},
        {type:'vac',oferta:'RES-P1B',sup:90},
        {type:'rt',n:'Local comercial (Disponible)',sup:150,brk:null},
        {type:'com',n:'Zonas comunes',sup:60},
      ]},
      {p:'PB',sup:420,units:[{type:'com',n:'Hall de entrada · portal',sup:420}]},
      {p:'S1',sup:420,units:[{type:'pk',n:'Parking · 42 plazas + trasteros',sup:420,nota:'Nivel -1'}]},
    ],
  }],
}
