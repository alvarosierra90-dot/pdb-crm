import { useState } from 'react'
import { useNav } from '../context/NavigationContext'
import AsignarTareaModal from '../components/AsignarTareaModal'

const DEM_USERS_INIT = [
  { name:'Sierra Álvaro', team:'Transaction Spain', role:'Responsable', initials:'AS', bg:'#dbeafe', color:'#1e40af', granted:'—', owner:true },
]

const DEM_TABS = [
  ['dem-info','Información Demanda'],['dem-req','Requisitos'],['dem-zona','Zona búsqueda'],
  ['dem-seg','Seguimiento comercial'],['dem-360','🔄 Ciclo 360°'],['dem-act','Actividades'],
  ['dem-partes','Partes involucradas'],['dem-docs','Documentos'],['dem-neg','Negociaciones en curso'],['dem-followup','Follow-up'],
  ['dem-conf','🔒 Confidencialidad'],
]

/* ── LÓGICA CONDICIONAL DEMANDA ── */
const USOS_TIPOLOGIAS = {
  'Oficinas': ['Oficina tradicional','Coworking','Subarriendo','Business park','Sede única (HQ)'],
  'Logístico / Industrial': ['Nave logística','Nave industrial','Última milla','Plataforma logística','Cross-docking'],
  'Retail': ['High Street','Local en centro comercial','Parque comercial','Local stand-alone','Flagship store'],
  'Centros comerciales': ['Centro comercial dominante','Centro comercial secundario','Parque de medianas','Outlet','Participación en centro'],
  'Residencial': ['Vivienda plurifamiliar','Vivienda unifamiliar','Obra nueva','Segunda mano'],
  'Living (PRS / BTR / Flex)': ['Build to Rent (BTR)','Build to Sell (BTS)','Flex living','Student housing','Senior living','Coliving'],
  'Hoteles': ['Hotel urbano','Hotel vacacional','Resort','Aparthotel','Hotel Boutique','Hostal'],
  'Suelos': ['Suelo finalista','Suelo en desarrollo','Suelo urbanizable'],
  'Alternativos': ['Data center','Self-storage','Sanitario','Educativo'],
  'Mixto': ['Uso mixto'],
}

// Cada campo: { key, label, unit? }
const CAMPOS_TIPOLOGIA = {
  'Oficina tradicional':     [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'}],
  'Coworking':               [{key:'puestos_min',label:'Nº puestos desde'},{key:'puestos_max',label:'Nº puestos hasta'}],
  'Subarriendo':             [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'}],
  'Business park':           [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'parking_min',label:'Plazas parking desde'},{key:'parking_max',label:'Plazas parking hasta'}],
  'Sede única (HQ)':         [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'parking_min',label:'Plazas parking desde'},{key:'parking_max',label:'Plazas parking hasta'}],
  'Nave logística':          [{key:'sup_min',label:'Sup. almacén desde',unit:'m²'},{key:'sup_max',label:'Sup. almacén hasta',unit:'m²'},{key:'altura_min',label:'Altura libre desde',unit:'m'},{key:'altura_max',label:'Altura libre hasta',unit:'m'},{key:'muelles_min',label:'Nº muelles desde'},{key:'muelles_max',label:'Nº muelles hasta'}],
  'Nave industrial':         [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'potencia',label:'Potencia eléctrica',unit:'kW'},{key:'altura_min',label:'Altura libre desde',unit:'m'},{key:'altura_max',label:'Altura libre hasta',unit:'m'}],
  'Última milla':            [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'ubicacion',label:'Ubicación',type:'select',opts:['Urbana','Periurbana']}],
  'Plataforma logística':    [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'muelles_min',label:'Nº muelles desde'},{key:'muelles_max',label:'Nº muelles hasta'}],
  'Cross-docking':           [{key:'muelles_min',label:'Nº muelles desde'},{key:'muelles_max',label:'Nº muelles hasta'},{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'}],
  'High Street':             [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'fachada_min',label:'Fachada desde',unit:'m'},{key:'fachada_max',label:'Fachada hasta',unit:'m'}],
  'Local en centro comercial':[{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'}],
  'Parque comercial':        [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'parking_min',label:'Plazas parking desde'},{key:'parking_max',label:'Plazas parking hasta'}],
  'Local stand-alone':       [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'}],
  'Flagship store':          [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'fachada_min',label:'Fachada desde',unit:'m'},{key:'fachada_max',label:'Fachada hasta',unit:'m'}],
  'Centro comercial dominante':[{key:'sba_min',label:'SBA desde',unit:'m²'},{key:'sba_max',label:'SBA hasta',unit:'m²'},{key:'locales_min',label:'Nº locales desde'},{key:'locales_max',label:'Nº locales hasta'},{key:'parking_min',label:'Plazas parking desde'},{key:'parking_max',label:'Plazas parking hasta'}],
  'Centro comercial secundario':[{key:'sba_min',label:'SBA desde',unit:'m²'},{key:'sba_max',label:'SBA hasta',unit:'m²'},{key:'locales_min',label:'Nº locales desde'},{key:'locales_max',label:'Nº locales hasta'}],
  'Parque de medianas':      [{key:'sba_min',label:'SBA desde',unit:'m²'},{key:'sba_max',label:'SBA hasta',unit:'m²'},{key:'locales_min',label:'Nº locales desde'},{key:'locales_max',label:'Nº locales hasta'}],
  'Outlet':                  [{key:'sba_min',label:'SBA desde',unit:'m²'},{key:'sba_max',label:'SBA hasta',unit:'m²'}],
  'Participación en centro':  [{key:'pct_min',label:'% participación desde'},{key:'pct_max',label:'% participación hasta'},{key:'sba_min',label:'SBA desde',unit:'m²'},{key:'sba_max',label:'SBA hasta',unit:'m²'}],
  'Vivienda plurifamiliar':  [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'hab_min',label:'Nº habitaciones desde'},{key:'hab_max',label:'Nº habitaciones hasta'},{key:'ban_min',label:'Nº baños desde'},{key:'ban_max',label:'Nº baños hasta'},{key:'parking_min',label:'Plaza parking desde'},{key:'parking_max',label:'Plaza parking hasta'}],
  'Vivienda unifamiliar':    [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'parcela_min',label:'Parcela desde',unit:'m²'},{key:'parcela_max',label:'Parcela hasta',unit:'m²'},{key:'hab_min',label:'Nº habitaciones desde'},{key:'hab_max',label:'Nº habitaciones hasta'}],
  'Obra nueva':              [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'unidades_min',label:'Nº unidades desde'},{key:'unidades_max',label:'Nº unidades hasta'}],
  'Segunda mano':            [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'hab_min',label:'Nº habitaciones desde'},{key:'hab_max',label:'Nº habitaciones hasta'}],
  'Build to Rent (BTR)':     [{key:'unidades_min',label:'Nº unidades desde'},{key:'unidades_max',label:'Nº unidades hasta'},{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'}],
  'Build to Sell (BTS)':     [{key:'unidades_min',label:'Nº unidades desde'},{key:'unidades_max',label:'Nº unidades hasta'},{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'}],
  'Flex living':             [{key:'unidades_min',label:'Nº unidades desde'},{key:'unidades_max',label:'Nº unidades hasta'}],
  'Student housing':         [{key:'camas_min',label:'Nº camas desde'},{key:'camas_max',label:'Nº camas hasta'}],
  'Senior living':           [{key:'unidades_min',label:'Nº unidades desde'},{key:'unidades_max',label:'Nº unidades hasta'}],
  'Coliving':                [{key:'unidades_min',label:'Nº unidades desde'},{key:'unidades_max',label:'Nº unidades hasta'}],
  'Hotel urbano':            [{key:'hab_min',label:'Nº habitaciones desde'},{key:'hab_max',label:'Nº habitaciones hasta'},{key:'categoria',label:'Categoría',type:'select',opts:['1★','2★','3★','4★','5★','Gran lujo']}],
  'Hotel vacacional':        [{key:'hab_min',label:'Nº habitaciones desde'},{key:'hab_max',label:'Nº habitaciones hasta'},{key:'categoria',label:'Categoría',type:'select',opts:['1★','2★','3★','4★','5★','Gran lujo']}],
  'Resort':                  [{key:'hab_min',label:'Nº habitaciones desde'},{key:'hab_max',label:'Nº habitaciones hasta'},{key:'categoria',label:'Categoría',type:'select',opts:['4★','5★','Gran lujo']}],
  'Aparthotel':              [{key:'unidades_min',label:'Nº unidades desde'},{key:'unidades_max',label:'Nº unidades hasta'}],
  'Hotel Boutique':          [{key:'hab_min',label:'Nº habitaciones desde'},{key:'hab_max',label:'Nº habitaciones hasta'}],
  'Hostal':                  [{key:'hab_min',label:'Nº habitaciones desde'},{key:'hab_max',label:'Nº habitaciones hasta'}],
  'Suelo finalista':         [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'edif_min',label:'Edificabilidad desde',unit:'m²t'},{key:'edif_max',label:'Edificabilidad hasta',unit:'m²t'},{key:'uso_permitido',label:'Uso permitido'}],
  'Suelo en desarrollo':     [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'estado_urb',label:'Estado urbanístico'}],
  'Suelo urbanizable':       [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'},{key:'uso_permitido',label:'Uso permitido'}],
  'Data center':             [{key:'potencia',label:'Potencia',unit:'MW'},{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'}],
  'Self-storage':            [{key:'unidades_min',label:'Nº unidades desde'},{key:'unidades_max',label:'Nº unidades hasta'},{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'}],
  'Sanitario':               [{key:'camas_min',label:'Nº camas desde'},{key:'camas_max',label:'Nº camas hasta'}],
  'Educativo':               [{key:'sup_min',label:'Superficie desde',unit:'m²'},{key:'sup_max',label:'Superficie hasta',unit:'m²'}],
  'Uso mixto':               [{key:'sup_min',label:'Superficie total desde',unit:'m²'},{key:'sup_max',label:'Superficie total hasta',unit:'m²'},{key:'mix_usos',label:'% por uso'}],
}

function CampoFisico({ campo, value, onChange }) {
  if (campo.type === 'select') {
    return (
      <div className="ir">
        <span className="ir-k">{campo.label}</span>
        <span className="ir-v">
          <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={value||''} onChange={e=>onChange(e.target.value)}>
            <option value="">—</option>
            {campo.opts.map(o=><option key={o}>{o}</option>)}
          </select>
        </span>
      </div>
    )
  }
  return (
    <div className="ir">
      <span className="ir-k">{campo.label}{campo.unit?` (${campo.unit})`:''}</span>
      <span className="ir-v">
        <input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={value||''} onChange={e=>onChange(e.target.value)} placeholder="—"/>
      </span>
    </div>
  )
}

const TIPO_TAG_DEM = { Email:'tag-blue', Llamada:'tag-green', Reunión:'tag-purple', Tarea:'tag-gray', Visita:'tag-teal', Presentación:'tag-amber', Nota:'tag-gray' }
const TIPO_ICO_DEM = { Email:'📧', Llamada:'📞', Reunión:'🤝', Tarea:'✅', Visita:'🏢', Presentación:'📤', Nota:'📝' }
const ACT_EST_DEM  = { Abierto:'tag-amber', Finalizado:'tag-gray', 'En curso':'tag-blue', Realizada:'tag-green' }

const DEM_ACTS = [
  { id:'ACT-DEM-01', tipo:'Nota',         asunto:'Reunión interna equipo — análisis encaje demanda con portfolio Barings',          fecha:'18/10/2025', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-DEM-02', tipo:'Llamada',      asunto:'Llamada inicial con James Richardson (Dir. Real Estate) — briefing requisitos',  fecha:'22/10/2025', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-DEM-03', tipo:'Email',        asunto:'Envío de lista larga de activos candidatos (6 opciones en Madrid)',              fecha:'28/10/2025', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-DEM-04', tipo:'Presentación', asunto:'Presentación Albatros Edif. D — 13.486 m² A-1 Alcobendas',                     fecha:'13/11/2025', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-DEM-05', tipo:'Visita',       asunto:'Visita técnica Albatros Edif. D — James Richardson + Laura Martín',             fecha:'20/11/2025', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Realizada'  },
  { id:'ACT-DEM-06', tipo:'Presentación', asunto:'Presentación P.E Avalon — 46.956 m² M-30 Julián Camarillo',                    fecha:'20/11/2025', user:'GOMEZ Ignacio', initials:'GI', bg:'#fdf4ff', color:'#7e22ce', estado:'Finalizado' },
  { id:'ACT-DEM-07', tipo:'Email',        asunto:'Solicitud de condiciones económicas — Oracle Spain SL vs. Corp. Azuaga',         fecha:'05/12/2025', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-DEM-08', tipo:'Reunión',      asunto:'Reunión presencial Corp. Financiera Azuaga — revisión shortlist final',          fecha:'15/01/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-DEM-09', tipo:'Llamada',      asunto:'Llamada de seguimiento — confirmación decisión final Albatros',                  fecha:'10/02/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'Finalizado' },
  { id:'ACT-DEM-10', tipo:'Tarea',        asunto:'Preparar borrador contrato — pendiente validación legal',                        fecha:'15/03/2026', user:'Sierra Álvaro', initials:'AS', bg:'#dbeafe', color:'#1e40af', estado:'En curso'   },
]

const MOCK_PRESENTACIONES = [
  { id:'PRE-2501', activo:'Albatros Edif. D', zona:'A-1 · Alcobendas', sup:'13.486 m²', fecha:'13/11/2025', estado:'Visitado', visitado:true, fecha_visita:'20/11/2025' },
  { id:'PRE-2502', activo:'P.E Avalon', zona:'M-30 · Julián Camarillo', sup:'46.956 m²', fecha:'20/11/2025', estado:'Sin respuesta', visitado:false, fecha_visita:'' },
]

const MOCK_VISITAS = [
  { id:'VIS-2481', activo:'Albatros Edif. D', fecha:'20/11/2025', asistentes:'James Richardson · Laura Martín', resultado:'Muy positiva', oferta_generada:true, oferta:'OF-0038' },
]

const ETAPAS_360 = [
  { key:'demanda',       label:'Demanda',       icon:'🔍', color:'var(--accent)' },
  { key:'presentacion',  label:'Presentación',  icon:'📤', color:'var(--teal)' },
  { key:'visita',        label:'Visita',        icon:'🏢', color:'var(--purple)' },
  { key:'oferta',        label:'Oferta',        icon:'📧', color:'var(--amber)' },
  { key:'negociacion',   label:'Negociación',   icon:'🤝', color:'#f97316' },
  { key:'oportunidad',   label:'Oportunidad',   icon:'⚡', color:'var(--green)' },
  { key:'instruccion',   label:'Instrucción',   icon:'✅', color:'#16a34a' },
]

/* ── Etapa 360 ── */
function Etapa360({ icon, color, estado, titulo, ref_id, badge, fecha, detalle, responsable, onNav, navLabel, children, last }) {
  const [open, setOpen] = useState(false)
  const completado = estado === 'completado'
  const enCurso    = estado === 'en-curso'
  const pendiente  = estado === 'pendiente'

  return (
    <div style={{display:'flex',gap:14,position:'relative',paddingBottom: last?0:20}}>
      {/* Dot */}
      <div style={{
        width:40, height:40, borderRadius:'50%', flexShrink:0, zIndex:1,
        background: completado ? color : enCurso ? '#fff' : 'var(--gray-lt)',
        border: `2px solid ${completado||enCurso ? color : 'var(--border)'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: completado ? 15 : 18,
        color: completado ? '#fff' : enCurso ? color : 'var(--text4)',
        boxShadow: enCurso ? `0 0 0 4px ${color}22` : 'none',
      }}>
        {completado ? '✓' : icon}
      </div>

      {/* Contenido */}
      <div style={{flex:1, paddingTop:6, opacity: pendiente ? .5 : 1}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:3}}>
          <span style={{fontWeight:700,fontSize:13,color: pendiente?'var(--text3)':'var(--text1)'}}>{titulo}</span>
          {ref_id && <span style={{fontFamily:'var(--mono)',fontSize:11,color:color}}>{ref_id}</span>}
          {badge && <span style={{fontSize:9,background:color+'22',color,border:`1px solid ${color}44`,borderRadius:10,padding:'1px 7px',fontWeight:700}}>{badge}</span>}
          {enCurso && <span style={{fontSize:9,background:'var(--amber-lt)',color:'var(--amber)',border:'1px solid var(--amber-bd)',borderRadius:10,padding:'1px 7px',fontWeight:700,animation:'pulse 2s infinite'}}>EN CURSO</span>}
          {completado && <span style={{fontSize:9,background:'#f0fdf4',color:'var(--green)',border:'1px solid #bbf7d0',borderRadius:10,padding:'1px 7px',fontWeight:700}}>COMPLETADO</span>}
          {pendiente && <span style={{fontSize:9,background:'var(--gray-lt)',color:'var(--text4)',border:'1px solid var(--border)',borderRadius:10,padding:'1px 7px'}}>PENDIENTE</span>}
        </div>
        {fecha && <div style={{fontSize:11,color:'var(--text4)',fontFamily:'var(--mono)',marginBottom:4}}>{fecha}{responsable&&` · ${responsable}`}</div>}
        <div style={{fontSize:11,color:'var(--text2)',marginBottom:6}}>{detalle}</div>
        {children && (
          <div>
            <button onClick={()=>setOpen(v=>!v)} style={{fontSize:10,color:color,background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit',fontWeight:600}}>
              {open?'▲ Ocultar detalle':'▼ Ver detalle'}
            </button>
            {open && children}
          </div>
        )}
        {onNav && navLabel && !pendiente && (
          <button className="asset-link" style={{fontSize:11,marginTop:4,display:'inline-block'}} onClick={onNav}>{navLabel} →</button>
        )}
        {pendiente && onNav && navLabel && (
          <button className="ab-btn" style={{fontSize:10,marginTop:4,padding:'3px 10px'}} onClick={onNav}>{navLabel}</button>
        )}
      </div>
    </div>
  )
}

/* ── Right Panel ── */
function RightPanel({ navigate, naturaleza, cmFields }) {
  const esInversion = naturaleza === 'Inversión'
  return (
    <div className="ficha-right">
      <div className="rp-sec">
        <div className="rp-lbl">Estado</div>
        <select className="of-sel" style={{fontSize:12,marginBottom:10}}>
          <option>● En Curso</option><option>◎ Potencial</option><option>⏸ Paralizado</option>
        </select>
        <button className="acc-btn">↔ Ver negociación vinculada</button>
        <button className="acc-btn">📋 Ver oferta vinculada</button>
        <button className="acc-btn" style={{background:'var(--accent)',color:'#fff',border:'none',fontWeight:600}} onClick={()=>navigate('mapas',{from:'demanda',id:'D251035690',nombre:'Corporacion Financiera Azuaga SL',uso:demUsoPpal,sbaMin:Number(demCampos.sup_min||demCampos.sba_min)||undefined,sbaMax:Number(demCampos.sup_max||demCampos.sba_max)||undefined,rentaMax:Number(demPres.alq_max)||undefined,zona:'A-1 · Alcobendas',provincia:'Madrid'})}>🗺 Exportar a mapa</button>
      </div>

      {esInversion ? (
        <div className="rp-sec">
          <div className="rp-lbl">Ticket objetivo</div>
          <div className="kf-grid">
            <div className="kf"><div className="kf-lbl">Desde</div><div className="kf-val">{cmFields.ticket_min ? `${cmFields.ticket_min} M€` : '—'}</div></div>
            <div className="kf"><div className="kf-lbl">Hasta</div><div className="kf-val">{cmFields.ticket_max ? `${cmFields.ticket_max} M€` : '—'}</div></div>
          </div>
          {(cmFields.yield_min || cmFields.yield_max) && (
            <div style={{marginTop:8,display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
              <div className="kf"><div className="kf-lbl">Yield desde</div><div className="kf-val">{cmFields.yield_min}%</div></div>
              <div className="kf"><div className="kf-lbl">Yield hasta</div><div className="kf-val">{cmFields.yield_max}%</div></div>
            </div>
          )}
          {cmFields.tipo_op && (
            <div style={{marginTop:8}}>
              <div style={{fontSize:9,color:'var(--text4)',marginBottom:3}}>Tipo operación</div>
              <span className="tag tag-amber">{cmFields.tipo_op}</span>
            </div>
          )}
          {cmFields.calidad && (
            <div style={{marginTop:6}}>
              <div style={{fontSize:9,color:'var(--text4)',marginBottom:3}}>Calidad</div>
              <span className="tag tag-gray">{cmFields.calidad}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rp-sec">
          <div className="rp-lbl">Superficie buscada</div>
          <div className="kf-grid">
            <div className="kf"><div className="kf-lbl">Mínimo</div><div className="kf-val">2.200 m²</div></div>
            <div className="kf"><div className="kf-lbl">Máximo</div><div className="kf-val">3.000 m²</div></div>
          </div>
          <div style={{marginTop:8}}>
            <div style={{fontSize:9,color:'var(--text4)',marginBottom:3}}>Tipo búsqueda</div>
            <span className="tag tag-gray">Estándar</span>
          </div>
        </div>
      )}

      {!esInversion && (
        <div className="rp-sec">
          <div className="rp-lbl">Activos presentados</div>
          <div style={{background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',padding:'7px 9px',marginBottom:5,cursor:'pointer'}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>Albatros — Edif. D</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>13/11/2025 · Presentación · OLBUR2315645</div>
          </div>
          <div style={{background:'var(--green-lt)',border:'1px solid var(--green-bd)',borderRadius:'var(--r)',padding:'7px 9px',cursor:'pointer'}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--green)'}}>Albatros — Visita</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>Calle de Anabel Segura 9-11</div>
          </div>
        </div>
      )}

      <div className="rp-sec">
        <div className="rp-lbl">Zona de búsqueda</div>
        <span className="tag tag-blue">Madrid</span>
        <div style={{marginTop:6,fontSize:11,color:'var(--text3)'}}>A-1 · Alcobendas / Arroyo de la Vega</div>
      </div>
      <div className="rp-sec">
        <div className="rp-lbl">Equipo asignado</div>
        <div className="cont-row">
          <div className="c-av" style={{background:'#dbeafe',color:'#1e40af'}}>AS</div>
          <div>
            <div className="c-name">Sierra Alvaro</div>
            <div className="c-role">{esInversion ? 'Capital Markets · MAD' : 'Leasing Oficinas · MAD'}</div>
          </div>
        </div>
      </div>
      <div className="rp-sec">
        <div className="rp-lbl">Asistente IA</div>
        <div className="ai-box">
          <div className="ai-head"><div className="ai-ico">✦</div><span className="ai-lbl">Matching automático</span><span className="ai-badge">Beta</span></div>
          {esInversion
            ? <div className="ai-text">Demanda de inversión · {cmFields.calidad||'—'} · Ticket {cmFields.ticket_min||'—'}–{cmFields.ticket_max||'—'} M€. <strong>Buscando ofertas de venta compatibles.</strong></div>
            : <div className="ai-text">2.200–3.000 m² en A-1. <strong>3 activos compatibles</strong>. Albatros P4 (última planta con terraza) es el más ajustado.</div>
          }
          <div className="ai-cta">✎ {esInversion ? 'Ver ofertas de venta compatibles' : 'Ver activos compatibles'}</div>
        </div>
      </div>
    </div>
  )
}

export default function FichaDemanda() {
  const { navigate } = useNav()
  const [activeTab, setActiveTab] = useState('dem-info')
  const [showTarea, setShowTarea] = useState(false)
  const [showTransformar, setShowTransformar] = useState(false)
  const [dinamicsOk,      setDinamicsOk]      = useState(false)
  const [confidential,    setConfidential]    = useState(false)
  const [authorizedUsers, setAuthorizedUsers] = useState(DEM_USERS_INIT)
  const [addingUser,      setAddingUser]      = useState(false)
  const [newUser,         setNewUser]         = useState('')

  // Naturaleza
  const [naturaleza, setNaturaleza] = useState('Leasing')

  // Demanda condicional
  const [demUsoPpal,   setDemUsoPpal]   = useState('Oficinas')
  const [demTipologia, setDemTipologia] = useState('Oficina tradicional')
  const [demCampos,    setDemCampos]    = useState({})
  const [demTipoPres,  setDemTipoPres]  = useState('Alquiler')
  const [demPres,      setDemPres]      = useState({})

  // Capital Markets (Inversión)
  const [cmFields, setCmFields] = useState({})
  const setCmField = (k, v) => setCmFields(p => ({...p, [k]: v}))

  const tipologiasDisp = USOS_TIPOLOGIAS[demUsoPpal] || []
  const camposActivos  = CAMPOS_TIPOLOGIA[demTipologia] || []

  const setCampo = (key, val) => setDemCampos(p=>({...p,[key]:val}))
  const setPres  = (key, val) => setDemPres(p=>({...p,[key]:val}))

  const handleUsoPpal = (uso) => {
    setDemUsoPpal(uso)
    const firstTip = (USOS_TIPOLOGIAS[uso]||[])[0] || ''
    setDemTipologia(firstTip)
    setDemCampos({})
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      {/* Action bar */}
      <div className="action-bar">
        <button className="ab-btn save">💾 Guardar</button>
        <button className="ab-btn">Guardar y cerrar</button>
        <button className="ab-btn">Nuevo</button>
        <button className="ab-btn">Transformar</button>
        <button className="ab-btn">Desactivar</button>
        <div className="ab-sep"/>
        <button className="ab-btn blue" onClick={()=>navigate('mapas',{from:'demanda',id:'D251035690',nombre:'Corporacion Financiera Azuaga SL',uso:demUsoPpal,sbaMin:Number(demCampos.sup_min||demCampos.sba_min)||undefined,sbaMax:Number(demCampos.sup_max||demCampos.sba_max)||undefined,rentaMax:Number(demPres.alq_max)||undefined,zona:'A-1 · Alcobendas',provincia:'Madrid'})}>🗺 Exportar a mapa</button>
        <button className="ab-btn">Actualizar</button>
        <button className="ab-btn">Asignar</button>
        <div className="ab-sep"/>
        <button className="ab-btn" onClick={() => setShowTarea(true)}>✅ Asignar tarea</button>
        <div className="ab-sep"/>
        <button className="ab-btn" style={{background:'#0078d4',color:'#fff',border:'none',fontWeight:700}} onClick={()=>setShowTransformar(true)}>⚡ Transformar en oportunidad</button>
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">
          {/* Header */}
          <div className="ah">
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div className="ah-ico" style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)'}}>🔍</div>
              <div style={{flex:1}}>
                <div className="ah-ref">
                  <span style={{background:'var(--accent-lt)',color:'var(--accent)',border:'1px solid var(--accent-bd)',padding:'0 5px',borderRadius:3,fontSize:9,fontWeight:700}}>DEMANDA</span>
                  <span className="asset-link" style={{fontFamily:'var(--mono)'}}>D251035690</span>
                  {confidential && <span style={{background:'#1e293b',color:'#f8fafc',border:'1px solid #334155',padding:'0 7px',borderRadius:3,fontSize:9,fontWeight:700,letterSpacing:'.04em'}}>🔒 CONFIDENCIAL</span>}
                  <span className="tag tag-gray" style={{fontSize:9}}>Guardado</span>
                </div>
                <div className="ah-name">Corporacion Financiera Azuaga SL</div>
                <div className="ah-addr">📍 Avda. Diego Martínez Barrios, 41013 Sevilla · Origen: Otras Consultoras · Creada: 17/10/2025 · Sierra Alvaro</div>
                <div className="ah-tags">
                  <span className="tag tag-green">● En Curso</span>
                  {naturaleza === 'Inversión'
                    ? <span className="tag" style={{background:'#fffbeb',color:'var(--amber)',border:'1px solid var(--amber-bd)',fontWeight:700}}>🏦 Capital Markets</span>
                    : <span className="tag tag-blue">Leasing</span>
                  }
                  <span className="tag tag-blue">Oficinas</span>
                  {naturaleza === 'Leasing' && <><span className="tag tag-gray">2.200–3.000 m²</span><span className="tag tag-gray">Estándar</span><span className="tag tag-purple">Expansión / Crecimiento</span></>}
                  {naturaleza === 'Inversión' && cmFields.tipo_op && <span className="tag tag-amber">{cmFields.tipo_op}</span>}
                  {naturaleza === 'Inversión' && cmFields.calidad && <span className="tag tag-gray">{cmFields.calidad}</span>}
                </div>
              </div>
              <div style={{flexShrink:0,display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:1,background:'var(--border)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden',fontSize:10,alignSelf:'flex-start'}}>
                {[['Motivo del estado','En Curso','var(--green)'],['Confidencial','No',null],['Equipo','Leasing Of. MAD',null],['Responsable','Sierra Alvaro','var(--accent)']].map(([lbl,val,col])=>(
                  <div key={lbl} style={{background:'var(--surface)',padding:'6px 10px',textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--text4)'}}>{lbl}</div>
                    <div style={{fontWeight:600,color:col||'var(--text)'}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {DEM_TABS.map(([key,label])=>(
              <div key={key} className={`tab ${activeTab===key?'active':''}`} onClick={()=>setActiveTab(key)}>{label}</div>
            ))}
          </div>

          {/* ── TAB: Información Demanda ── */}
          {activeTab==='dem-info' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <div>
                  <div className="of-section">🏢 CUENTA</div>
                  <div className="info-block" style={{marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--accent)',marginBottom:10,cursor:'pointer'}}>Corporacion Financiera Azuaga SL ↗</div>
                    <div className="ir"><span className="ir-k">Teléfono</span><span className="ir-v">—</span></div>
                    <div className="ir"><span className="ir-k">Dirección</span><span className="ir-v" style={{fontSize:10}}>Avda. Diego Martínez Barrios</span></div>
                    <div className="ir"><span className="ir-k">Código postal</span><span className="ir-v">41013</span></div>
                    <div className="ir"><span className="ir-k">Ciudad</span><span className="ir-v">Sevilla</span></div>
                    <div className="ir"><span className="ir-k">País</span><span className="ir-v link">🌍 Spain</span></div>
                    <div className="ir"><span className="ir-k">Cía. sustituta</span><span className="ir-v"><input type="checkbox" style={{accentColor:'var(--accent)'}}/></span></div>
                    <div className="ir"><span className="ir-k">KYC demanda</span><span className="ir-v link">— ↗</span></div>
                  </div>
                  <div className="of-section">🏷 TIPO DE DEMANDA</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Demanda corporativa</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>No</option><option>Sí</option></select></span></div>
                    <div className="ir"><span className="ir-k">Confidencial</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>No</option><option>Sí</option></select></span></div>
                  </div>
                </div>
                <div>
                  <div className="of-section">👤 CONTACTO</div>
                  <div className="info-block" style={{marginBottom:10}}>
                    <div className="ir"><span className="ir-k">Persona física</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>No</option><option>Sí</option></select></span></div>
                    <div className="ir"><span className="ir-k">Contacto mandante</span><span className="ir-v link">— ↗</span></div>
                  </div>
                  <div className="of-section">📋 ESTADO</div>
                  <div className="info-block">
                    <div className="ir"><span className="ir-k">Motivo del estado</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>En Curso</option><option>Potencial</option><option>Paralizado</option></select></span></div>
                    <div className="ir"><span className="ir-k">Equipo</span><span className="ir-v">Leasing Oficinas – MAD</span></div>
                  </div>
                </div>
                <div>
                  <div className="of-section">👥 OTROS CONTACTOS ASOCIADOS</div>
                  <div className="info-block">
                    <table className="pat-table">
                      <thead><tr><th>Nombre com.</th><th>Persona física</th></tr></thead>
                      <tbody><tr><td colSpan={2} style={{textAlign:'center',color:'var(--text4)',padding:16,fontSize:11}}>No se encontró nada para mostrar aquí</td></tr></tbody>
                    </table>
                    <div style={{fontSize:10,color:'var(--text4)',marginTop:5}}>Filas: 0</div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Requisitos ── */}
          {activeTab==='dem-req' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>

                {/* ── Col 1: Requisitos generales ── */}
                <div>
                  <div className="of-section">📋 REQUISITOS GENERALES</div>
                  <div className="info-block" style={{marginBottom:10}}>
                    {/* Naturaleza */}
                    <div className="ir">
                      <span className="ir-k" style={{fontWeight:700,color:'#0f172a'}}>Naturaleza</span>
                      <span className="ir-v">
                        <div style={{display:'flex',gap:4}}>
                          {['Leasing','Inversión'].map(n => (
                            <button key={n} onClick={()=>setNaturaleza(n)} style={{padding:'2px 10px',borderRadius:12,border:`1px solid ${naturaleza===n?(n==='Inversión'?'var(--amber)':'var(--accent)'):'var(--border)'}`,background:naturaleza===n?(n==='Inversión'?'var(--amber-lt)':'var(--accent-lt)'):'transparent',color:naturaleza===n?(n==='Inversión'?'var(--amber)':'var(--accent)'):'var(--text3)',fontWeight:naturaleza===n?700:400,fontSize:11,cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
                              {n==='Inversión'?'🏦':''}{n}
                            </button>
                          ))}
                        </div>
                      </span>
                    </div>

                    {/* Tipo activo */}
                    <div className="ir">
                      <span className="ir-k">Tipo activo</span>
                      <span className="ir-v">
                        <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}>
                          <option>Edificio</option><option>Suelo</option>
                        </select>
                      </span>
                    </div>

                    {/* Nivel 1: Uso principal */}
                    <div className="ir">
                      <span className="ir-k" style={{fontWeight:700,color:'var(--accent)'}}>Uso principal</span>
                      <span className="ir-v">
                        <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={demUsoPpal} onChange={e=>handleUsoPpal(e.target.value)}>
                          {Object.keys(USOS_TIPOLOGIAS).map(u=><option key={u}>{u}</option>)}
                        </select>
                      </span>
                    </div>

                    {/* Nivel 2: Tipología (condicional) */}
                    <div className="ir">
                      <span className="ir-k" style={{fontWeight:700,color:'var(--purple)'}}>Tipología</span>
                      <span className="ir-v">
                        <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={demTipologia} onChange={e=>{setDemTipologia(e.target.value);setDemCampos({})}}>
                          {tipologiasDisp.map(t=><option key={t}>{t}</option>)}
                        </select>
                      </span>
                    </div>

                    {/* Razón búsqueda — solo Leasing */}
                    {naturaleza === 'Leasing' && (
                    <div className="ir">
                      <span className="ir-k">Razón búsqueda</span>
                      <span className="ir-v">
                        <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}>
                          {['Expansión / Crecimiento','Reducción','Reubicación','Reagrupación','Creación','Obsoleto'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </span>
                    </div>
                    )}

                    {/* Campos Capital Markets — solo Inversión */}
                    {naturaleza === 'Inversión' && (<>
                      <div className="ir">
                        <span className="ir-k" style={{fontWeight:700,color:'var(--amber)'}}>Tipo de operación</span>
                        <span className="ir-v">
                          <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={cmFields.tipo_op||''} onChange={e=>setCmField('tipo_op',e.target.value)}>
                            <option value="">—</option>
                            <option>Venta</option>
                            <option>Sale &amp; Leaseback</option>
                            <option>Forward Purchase</option>
                            <option>Forward Funding</option>
                            <option>Oportunidad de inversión</option>
                          </select>
                        </span>
                      </div>
                      <div className="ir">
                        <span className="ir-k">Calidad</span>
                        <span className="ir-v">
                          <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={cmFields.calidad||''} onChange={e=>setCmField('calidad',e.target.value)}>
                            <option value="">—</option>
                            <option>Core</option><option>Core+</option><option>Value-Add</option><option>Opportunistic</option><option>Distressed</option>
                          </select>
                        </span>
                      </div>
                      <div className="ir">
                        <span className="ir-k">Estado del activo</span>
                        <span className="ir-v">
                          <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={cmFields.estado_activo||''} onChange={e=>setCmField('estado_activo',e.target.value)}>
                            <option value="">—</option>
                            <option>Estabilizado</option><option>En desarrollo</option><option>Vacío</option><option>Parcialmente ocupado</option><option>Obra nueva</option>
                          </select>
                        </span>
                      </div>
                      <div className="ir">
                        <span className="ir-k">Tipo de explotación</span>
                        <span className="ir-v">
                          <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={cmFields.tipo_explot||''} onChange={e=>setCmField('tipo_explot',e.target.value)}>
                            <option value="">—</option>
                            <option>Propio</option><option>Arrendado</option><option>Mixto</option><option>SIGI/SOCIMI</option><option>Fondo</option>
                          </select>
                        </span>
                      </div>
                      <div className="ir">
                        <span className="ir-k">Razón inversión</span>
                        <span className="ir-v">
                          <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={cmFields.razon||''} onChange={e=>setCmField('razon',e.target.value)}>
                            <option value="">—</option>
                            <option>Inversión patrimonial</option><option>Diversificación</option><option>Reposicionamiento</option><option>Desarrollo</option><option>Sale &amp; Leaseback</option>
                          </select>
                        </span>
                      </div>
                    </>)}

                    <div className="ir"><span className="ir-k">Timing proyecto</span><span className="ir-v"><input type="date" className="of-inp" style={{padding:'2px 6px',fontSize:11,width:120}}/></span></div>
                    <div className="ir"><span className="ir-k">Origen demanda</span><span className="ir-v"><select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}}><option>Otras consultoras</option><option>Idealista</option><option>Web Savills</option><option>LinkedIn</option><option>ON personal</option><option>ON profesional</option></select></span></div>
                    <div className="ir"><span className="ir-k">Mandato asociado</span><span className="ir-v link">— ↗</span></div>
                    <div className="ir"><span className="ir-k">Nº NDA</span><span className="ir-v link">— ↗</span></div>
                  </div>

                  <div className="of-section">📝 DESCRIPCIÓN</div>
                  <textarea className="of-textarea" style={{fontSize:11}}>Savills (Estefanía): Buscan unos 2.500 m2 en la zona de Alcobendas. Preguntan específicamente por Albatros. Quieren solo la última planta con terraza.</textarea>
                </div>

                {/* ── Col 2: Campos físicos + Presupuesto (Leasing) / Criterios CM (Inversión) ── */}
                <div>
                  {naturaleza === 'Leasing' ? (<>
                    {/* Nivel 3: Campos físicos condicionales */}
                    <div className="of-section">
                      📐 CAMPOS FÍSICOS
                      <span style={{marginLeft:6,fontSize:9,background:'var(--purple)22',color:'var(--purple)',border:'1px solid var(--purple)44',borderRadius:8,padding:'1px 6px',fontWeight:700}}>{demTipologia}</span>
                    </div>
                    <div className="info-block" style={{marginBottom:10}}>
                      {camposActivos.length > 0
                        ? camposActivos.map(c=>(
                            <CampoFisico key={c.key} campo={c} value={demCampos[c.key]} onChange={v=>setCampo(c.key,v)}/>
                          ))
                        : <div style={{fontSize:11,color:'var(--text4)',padding:'8px 0'}}>Selecciona una tipología para ver los campos correspondientes.</div>
                      }
                    </div>

                    {/* Nivel 4: Presupuesto condicional */}
                    <div className="of-section">💰 PRESUPUESTO</div>
                    <div className="info-block">
                      <div className="ir">
                        <span className="ir-k" style={{fontWeight:700}}>Tipo</span>
                        <span className="ir-v">
                          <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={demTipoPres} onChange={e=>setDemTipoPres(e.target.value)}>
                            <option>Alquiler</option>
                            <option>Venta</option>
                            <option>Alquiler / Venta</option>
                          </select>
                        </span>
                      </div>
                      {(demTipoPres==='Alquiler'||demTipoPres==='Alquiler / Venta') && (
                        <div style={{marginTop:8,paddingTop:8,borderTop:'1px dashed var(--border)'}}>
                          <div style={{fontSize:10,fontWeight:700,color:'var(--teal)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.04em'}}>Alquiler</div>
                          <div className="ir">
                            <span className="ir-k">Unidad renta</span>
                            <span className="ir-v">
                              <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={demPres.unidad_alq||'€/m²/mes'} onChange={e=>setPres('unidad_alq',e.target.value)}>
                                <option>€/m²/mes</option><option>€/mes</option>
                              </select>
                            </span>
                          </div>
                          <div className="ir"><span className="ir-k">Alquiler desde</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={demPres.alq_min||''} onChange={e=>setPres('alq_min',e.target.value)} placeholder="—"/></span></div>
                          <div className="ir"><span className="ir-k">Alquiler hasta</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={demPres.alq_max||''} onChange={e=>setPres('alq_max',e.target.value)} placeholder="—"/></span></div>
                        </div>
                      )}
                      {(demTipoPres==='Venta'||demTipoPres==='Alquiler / Venta') && (
                        <div style={{marginTop:8,paddingTop:8,borderTop:'1px dashed var(--border)'}}>
                          <div style={{fontSize:10,fontWeight:700,color:'var(--amber)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.04em'}}>Venta</div>
                          <div className="ir"><span className="ir-k">€/m² desde</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={demPres.venta_m2_min||''} onChange={e=>setPres('venta_m2_min',e.target.value)} placeholder="—"/></span></div>
                          <div className="ir"><span className="ir-k">€/m² hasta</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={demPres.venta_m2_max||''} onChange={e=>setPres('venta_m2_max',e.target.value)} placeholder="—"/></span></div>
                          <div className="ir"><span className="ir-k">Precio total desde</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={demPres.venta_tot_min||''} onChange={e=>setPres('venta_tot_min',e.target.value)} placeholder="—"/></span></div>
                          <div className="ir"><span className="ir-k">Precio total hasta</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={demPres.venta_tot_max||''} onChange={e=>setPres('venta_tot_max',e.target.value)} placeholder="—"/></span></div>
                        </div>
                      )}
                    </div>
                  </>) : (<>
                    {/* Capital Markets — Criterios financieros */}
                    <div className="of-section">
                      💰 CRITERIOS FINANCIEROS
                      <span style={{marginLeft:6,fontSize:9,background:'var(--amber)22',color:'var(--amber)',border:'1px solid var(--amber)44',borderRadius:8,padding:'1px 6px',fontWeight:700}}>Capital Markets</span>
                    </div>
                    <div className="info-block" style={{marginBottom:10}}>
                      <div className="ir">
                        <span className="ir-k" style={{fontWeight:700}}>Tipo de rendimiento</span>
                        <span className="ir-v">
                          <select className="of-sel" style={{width:'auto',padding:'2px 6px',fontSize:11}} value={cmFields.tipo_rend||''} onChange={e=>setCmField('tipo_rend',e.target.value)}>
                            <option value="">—</option>
                            <option>Distribución de rentas</option>
                            <option>Plusvalía</option>
                            <option>Mixto</option>
                          </select>
                        </span>
                      </div>
                      <div style={{marginTop:8,paddingTop:8,borderTop:'1px dashed var(--border)'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'var(--amber)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.04em'}}>Ticket objetivo</div>
                        <div className="ir"><span className="ir-k">Desde (M€)</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={cmFields.ticket_min||''} onChange={e=>setCmField('ticket_min',e.target.value)} placeholder="—"/></span></div>
                        <div className="ir"><span className="ir-k">Hasta (M€)</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={cmFields.ticket_max||''} onChange={e=>setCmField('ticket_max',e.target.value)} placeholder="—"/></span></div>
                      </div>
                      <div style={{marginTop:8,paddingTop:8,borderTop:'1px dashed var(--border)'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'var(--green)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.04em'}}>Yield objetivo</div>
                        <div className="ir"><span className="ir-k">Desde (%)</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={cmFields.yield_min||''} onChange={e=>setCmField('yield_min',e.target.value)} placeholder="—"/></span></div>
                        <div className="ir"><span className="ir-k">Hasta (%)</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={cmFields.yield_max||''} onChange={e=>setCmField('yield_max',e.target.value)} placeholder="—"/></span></div>
                      </div>
                      <div style={{marginTop:8,paddingTop:8,borderTop:'1px dashed var(--border)'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'var(--purple)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.04em'}}>Otros parámetros</div>
                        <div className="ir"><span className="ir-k">Capex estimado (€/m²)</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={cmFields.capex||''} onChange={e=>setCmField('capex',e.target.value)} placeholder="—"/></span></div>
                        <div className="ir"><span className="ir-k">Ocupación mínima (%)</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={cmFields.ocup_min||''} onChange={e=>setCmField('ocup_min',e.target.value)} placeholder="—"/></span></div>
                        <div className="ir"><span className="ir-k">WAULT mínimo (años)</span><span className="ir-v"><input className="of-inp" style={{width:80,padding:'2px 6px',fontSize:11}} value={cmFields.wault_min||''} onChange={e=>setCmField('wault_min',e.target.value)} placeholder="—"/></span></div>
                      </div>
                    </div>
                  </>)}
                </div>

                {/* ── Col 3: Parámetros ── */}
                <div>
                  <div className="of-section">🔍 PARÁMETROS DE BÚSQUEDA</div>
                  <div className="info-block" style={{marginBottom:10}}>
                    <div style={{fontSize:10,color:'var(--text3)',marginBottom:4}}>Requisitos adicionales</div>
                    <textarea className="of-textarea" style={{fontSize:11,minHeight:60}}>—</textarea>
                    <div style={{fontSize:10,color:'var(--text3)',marginTop:8,marginBottom:4}}>Canal de entrada</div>
                    <input className="of-inp" style={{fontSize:11}} defaultValue="—"/>
                  </div>

                  {/* Resumen visual */}
                  {naturaleza === 'Leasing' ? (
                    <div style={{background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',padding:10,marginTop:8}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--accent)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>✦ Resumen demanda</div>
                      <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.7}}>
                        <div><strong>Uso:</strong> {demUsoPpal}</div>
                        <div><strong>Tipología:</strong> {demTipologia}</div>
                        <div><strong>Presupuesto:</strong> {demTipoPres}</div>
                        {camposActivos.filter(c=>demCampos[c.key]).map(c=>(
                          <div key={c.key}><strong>{c.label}:</strong> {demCampos[c.key]}{c.unit?` ${c.unit}`:''}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{background:'#fffbeb',border:'1px solid var(--amber-bd)',borderRadius:'var(--r)',padding:10,marginTop:8}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--amber)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>🏦 Resumen inversión</div>
                      <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.7}}>
                        <div><strong>Uso:</strong> {demUsoPpal}</div>
                        <div><strong>Tipología:</strong> {demTipologia}</div>
                        {cmFields.tipo_op && <div><strong>Operación:</strong> {cmFields.tipo_op}</div>}
                        {cmFields.calidad && <div><strong>Calidad:</strong> {cmFields.calidad}</div>}
                        {cmFields.estado_activo && <div><strong>Estado:</strong> {cmFields.estado_activo}</div>}
                        {(cmFields.ticket_min||cmFields.ticket_max) && <div><strong>Ticket:</strong> {cmFields.ticket_min||'—'} – {cmFields.ticket_max||'—'} M€</div>}
                        {(cmFields.yield_min||cmFields.yield_max) && <div><strong>Yield:</strong> {cmFields.yield_min||'—'} – {cmFields.yield_max||'—'} %</div>}
                        {cmFields.ocup_min && <div><strong>Ocup. mín.:</strong> {cmFields.ocup_min}%</div>}
                        {cmFields.capex && <div><strong>Capex:</strong> {cmFields.capex} €/m²</div>}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div></div>
          )}

          {/* ── TAB: Zona búsqueda ── */}
          {activeTab==='dem-zona' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div>
                  <div className="of-section">🗺 PROVINCIAS DE INTERÉS</div>
                  <div className="info-block" style={{minHeight:200}}>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                      <span style={{background:'var(--border2)',color:'var(--text2)',padding:'3px 10px',borderRadius:20,fontSize:12,display:'inline-flex',alignItems:'center',gap:5}}>Madrid <span style={{cursor:'pointer',color:'var(--text4)'}}>×</span></span>
                    </div>
                    <select className="of-sel"><option>+ Añadir provincia</option><option>Barcelona</option><option>Valencia</option><option>Sevilla</option></select>
                  </div>
                </div>
                <div>
                  <div className="of-section">📍 ZONAS DE BÚSQUEDA</div>
                  <div className="info-block">
                    <select className="of-sel" style={{marginBottom:10}}><option>+ Añadir zona</option><option>CBD</option><option>M-30</option><option>A-1 · Alcobendas</option><option>A-2</option></select>
                    <div style={{background:'var(--accent-lt)',border:'1px solid var(--accent-bd)',borderRadius:'var(--r)',padding:'6px 10px',marginBottom:10,fontSize:11,color:'var(--accent)'}}>
                      A-1 · Alcobendas / Arroyo de la Vega <span style={{cursor:'pointer',color:'var(--text4)',float:'right'}}>×</span>
                    </div>
                    <div className="ir"><span className="ir-k">Calles específicas</span><span className="ir-v">—</span></div>
                    <div className="ir"><span className="ir-k">Puntos de interés</span><span className="ir-v">—</span></div>
                    <div className="ir"><span className="ir-k">Puntos a evitar</span><span className="ir-v">—</span></div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Seguimiento comercial ── */}
          {activeTab==='dem-seg' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>

                {/* PRESENTACIONES */}
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:700}}>📤 Presentaciones</div>
                    <button className="ab-btn blue" style={{padding:'3px 10px',fontSize:10}} onClick={()=>navigate('presentaciones')}>+ Nueva presentación</button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {MOCK_PRESENTACIONES.map(p=>(
                      <div key={p.id} style={{border:'1px solid var(--border)',borderRadius:7,overflow:'hidden',background:'#fff'}}>
                        <div style={{padding:'8px 12px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid var(--border)',background:'var(--gray-lt)'}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600,fontSize:12,color:'var(--accent)',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>{p.activo}</div>
                            <div style={{fontSize:10,color:'var(--text4)',marginTop:1}}>{p.zona} · {p.sup}</div>
                          </div>
                          <span className={`tag ${p.visitado?'tag-teal':'tag-amber'}`} style={{fontSize:9}}>{p.estado}</span>
                        </div>
                        <div style={{padding:'7px 12px',display:'flex',gap:16,fontSize:11}}>
                          <div><span style={{color:'var(--text4)'}}>Enviado: </span><span style={{fontFamily:'var(--mono)'}}>{p.fecha}</span></div>
                          {p.visitado&&<div><span style={{color:'var(--text4)'}}>Visita: </span><span style={{fontFamily:'var(--mono)',color:'var(--teal)',fontWeight:600}}>{p.fecha_visita}</span></div>}
                          <span style={{marginLeft:'auto',fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{p.id}</span>
                        </div>
                      </div>
                    ))}
                    <button className="ab-btn" style={{justifyContent:'center',fontSize:11}} onClick={()=>navigate('presentaciones')}>Ver todas las presentaciones →</button>
                  </div>
                </div>

                {/* VISITAS */}
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:700}}>🏢 Visitas</div>
                    <button className="ab-btn blue" style={{padding:'3px 10px',fontSize:10}} onClick={()=>navigate('visitas')}>+ Nueva visita</button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {MOCK_VISITAS.map(v=>(
                      <div key={v.id} style={{border:'1px solid var(--border)',borderRadius:7,overflow:'hidden',background:'#fff'}}>
                        <div style={{padding:'8px 12px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid var(--border)',background:'var(--gray-lt)'}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600,fontSize:12,color:'var(--accent)',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>{v.activo}</div>
                            <div style={{fontSize:10,color:'var(--text4)',marginTop:1}}>{v.asistentes}</div>
                          </div>
                          <span className="tag tag-teal" style={{fontSize:9}}>{v.resultado}</span>
                        </div>
                        <div style={{padding:'7px 12px',display:'flex',gap:16,fontSize:11,alignItems:'center'}}>
                          <div><span style={{color:'var(--text4)'}}>Fecha: </span><span style={{fontFamily:'var(--mono)'}}>{v.fecha}</span></div>
                          {v.oferta_generada&&(
                            <div style={{display:'flex',alignItems:'center',gap:4}}>
                              <span style={{fontSize:9,background:'var(--green-lt)',color:'var(--green)',border:'1px solid var(--green-bd)',borderRadius:3,padding:'0 5px',fontWeight:700}}>OFERTA</span>
                              <span className="asset-link" style={{fontSize:11,fontFamily:'var(--mono)'}} onClick={()=>navigate('ficha-oferta')}>{v.oferta}</span>
                            </div>
                          )}
                          <span style={{marginLeft:'auto',fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{v.id}</span>
                        </div>
                      </div>
                    ))}
                    <button className="ab-btn" style={{justifyContent:'center',fontSize:11}} onClick={()=>navigate('visitas')}>Ver todas las visitas →</button>
                  </div>
                </div>

              </div>
            </div></div>
          )}

          {/* ── TAB: Ciclo 360° ── */}
          {activeTab==='dem-360' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{marginBottom:16,fontSize:12,color:'var(--text3)'}}>Ciclo completo de esta demanda desde su entrada hasta la instrucción de facturación.</div>

              {/* Barra de progreso */}
              <div style={{display:'flex',alignItems:'center',marginBottom:24,padding:'12px 16px',background:'var(--gray-lt)',borderRadius:10,border:'1px solid var(--border)'}}>
                {ETAPAS_360.map((e,i)=>{
                  const activo  = ['demanda','presentacion','visita','oferta'].includes(e.key)
                  const enCurso = e.key === 'oferta'
                  const futuro  = ['negociacion','oportunidad','instruccion'].includes(e.key)
                  return (
                    <div key={e.key} style={{display:'flex',alignItems:'center',flex:1}}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:activo?e.color:futuro?'var(--border)':'var(--border)',border:`2px solid ${activo?e.color:'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:activo?'#fff':'var(--text4)',opacity:futuro?.4:1}}>
                          {activo&&!enCurso?'✓':e.icon}
                        </div>
                        <div style={{fontSize:9,fontWeight:600,color:activo?e.color:'var(--text4)',textAlign:'center',whiteSpace:'nowrap',opacity:futuro?.5:1}}>{e.label}</div>
                      </div>
                      {i<ETAPAS_360.length-1&&<div style={{height:2,width:20,background:activo&&!enCurso?'var(--green)':'var(--border)',flexShrink:0,marginBottom:18}}/>}
                    </div>
                  )
                })}
              </div>

              {/* Timeline vertical */}
              <div style={{position:'relative'}}>
                <div style={{position:'absolute',left:19,top:0,bottom:0,width:2,background:'var(--border)'}}/>

                {/* DEMANDA */}
                <Etapa360
                  icon="🔍" color="var(--accent)" estado="completado"
                  titulo="Demanda creada" ref_id="D251035690"
                  fecha="17/10/2025" responsable="Sierra Alvaro"
                  detalle="Corporacion Financiera Azuaga SL · 2.200–3.000 m² · A-1 Alcobendas"
                  onNav={()=>null}
                />

                {/* PRESENTACIONES */}
                <Etapa360
                  icon="📤" color="var(--teal)" estado="completado"
                  titulo="Presentaciones enviadas" badge={`${MOCK_PRESENTACIONES.length} activos`}
                  fecha="13/11/2025 – 20/11/2025"
                  detalle={MOCK_PRESENTACIONES.map(p=>p.activo).join(' · ')}
                  onNav={()=>navigate('presentaciones')}
                  navLabel="Ver presentaciones"
                >
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                    {MOCK_PRESENTACIONES.map(p=>(
                      <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 10px',background:'var(--gray-lt)',borderRadius:5,fontSize:11}}>
                        <span style={{fontWeight:600,color:'var(--accent)',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>{p.activo}</span>
                        <span style={{color:'var(--text4)'}}>·</span>
                        <span style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>{p.fecha}</span>
                        <span className={`tag ${p.visitado?'tag-teal':'tag-amber'}`} style={{fontSize:8,marginLeft:'auto'}}>{p.estado}</span>
                      </div>
                    ))}
                  </div>
                </Etapa360>

                {/* VISITAS */}
                <Etapa360
                  icon="🏢" color="var(--purple)" estado="completado"
                  titulo="Visitas realizadas" badge={`${MOCK_VISITAS.length} visita`}
                  fecha="20/11/2025"
                  detalle="Albatros Edif. D · Resultado muy positivo"
                  onNav={()=>navigate('visitas')}
                  navLabel="Ver visitas"
                >
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                    {MOCK_VISITAS.map(v=>(
                      <div key={v.id} style={{padding:'5px 10px',background:'var(--gray-lt)',borderRadius:5,fontSize:11}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontWeight:600,color:'var(--accent)',cursor:'pointer'}} onClick={()=>navigate('ficha-activo')}>{v.activo}</span>
                          <span className="tag tag-teal" style={{fontSize:8}}>{v.resultado}</span>
                          {v.oferta_generada&&<span className="asset-link" style={{fontSize:10,marginLeft:'auto',fontFamily:'var(--mono)'}} onClick={()=>navigate('ficha-oferta')}>→ {v.oferta}</span>}
                        </div>
                        <div style={{color:'var(--text4)',marginTop:3}}>{v.asistentes} · {v.fecha}</div>
                      </div>
                    ))}
                  </div>
                </Etapa360>

                {/* OFERTA */}
                <Etapa360
                  icon="📧" color="var(--amber)" estado="en-curso"
                  titulo="Oferta en curso" ref_id="OF-0038"
                  fecha="25/11/2025"
                  detalle="Albatros Edif. D · 13.486 m² · 12,50 €/m²/mes · Pendiente aceptación"
                  onNav={()=>navigate('ficha-oferta')}
                  navLabel="Ver oferta"
                />

                {/* NEGOCIACIÓN — pendiente */}
                <Etapa360
                  icon="🤝" color="#f97316" estado="pendiente"
                  titulo="Negociación" fecha="—"
                  detalle="Pendiente — se iniciará cuando la oferta sea aceptada"
                  onNav={()=>navigate('negociaciones')}
                  navLabel="Ir a negociaciones"
                />

                {/* OPORTUNIDAD — pendiente */}
                <Etapa360
                  icon="⚡" color="var(--green)" estado="pendiente"
                  titulo="Oportunidad (WIP)" fecha="—"
                  detalle="Pendiente — se generará desde la negociación"
                  onNav={()=>navigate('oportunidades')}
                  navLabel="Ir a oportunidades"
                />

                {/* INSTRUCCIÓN — pendiente */}
                <Etapa360
                  icon="✅" color="#16a34a" estado="pendiente"
                  titulo="Instrucción / Facturación" fecha="—"
                  detalle="Pendiente — cierre del deal y registro de honorarios"
                  onNav={()=>navigate('instruccion')}
                  navLabel="Ir a instrucciones"
                  last
                />

              </div>
            </div></div>
          )}

          {/* ── TAB: Actividades ── */}
          {activeTab==='dem-act' && (
            <div className="tab-content active"><div className="info-pad">
              {/* KPI strip */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:14}}>
                {[
                  {lbl:'Total actividades', val:DEM_ACTS.length,                                                   color:'var(--text1)'},
                  {lbl:'Llamadas',          val:DEM_ACTS.filter(a=>a.tipo==='Llamada').length,                      color:'var(--green)'},
                  {lbl:'Emails',            val:DEM_ACTS.filter(a=>a.tipo==='Email').length,                        color:'var(--accent)'},
                  {lbl:'Visitas / pres.',   val:DEM_ACTS.filter(a=>a.tipo==='Visita'||a.tipo==='Presentación').length, color:'var(--teal)'},
                  {lbl:'Pendientes',        val:DEM_ACTS.filter(a=>a.estado==='Abierto'||a.estado==='En curso').length, color:'var(--red)'},
                ].map(k=>(
                  <div key={k.lbl} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 12px',textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>{k.lbl}</div>
                    <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:k.color}}>{k.val}</div>
                  </div>
                ))}
              </div>
              {/* Header */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:600}}>Actividades vinculadas a la demanda</div>
                <button className="ab-btn blue">+ Nueva actividad</button>
              </div>
              {/* Tabla */}
              <div className="info-block" style={{padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>{['','ID','Tipo','Descripción','Fecha','Responsable','Estado'].map(h=>(
                      <th key={h} style={{padding:'6px 12px',fontSize:9,fontWeight:600,color:'var(--text4)',textAlign:'left',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',textTransform:'uppercase'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {DEM_ACTS.map(a=>(
                      <tr key={a.id} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('ficha-actividad')}>
                        <td style={{padding:'7px 10px',width:30}}>
                          <div style={{width:26,height:26,borderRadius:'50%',background:a.bg,color:a.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>{a.initials}</div>
                        </td>
                        <td style={{padding:'7px 12px'}}><span className="asset-link" style={{fontFamily:'var(--mono)',fontSize:10}}>{a.id}</span></td>
                        <td style={{padding:'7px 12px'}}><span className={`tag ${TIPO_TAG_DEM[a.tipo]||'tag-gray'}`}>{TIPO_ICO_DEM[a.tipo]} {a.tipo}</span></td>
                        <td style={{padding:'7px 12px',fontWeight:500,maxWidth:320}}>{a.asunto}</td>
                        <td style={{padding:'7px 12px',color:'var(--text3)',whiteSpace:'nowrap'}}>{a.fecha}</td>
                        <td style={{padding:'7px 12px',fontSize:10,color:'var(--text3)'}}>{a.user}</td>
                        <td style={{padding:'7px 12px'}}><span className={`tag ${ACT_EST_DEM[a.estado]||'tag-gray'}`}>{a.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div></div>
          )}

          {/* ── TAB: Partes involucradas ── */}
          {activeTab==='dem-partes' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <div>
                  <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Partners / Socios</div>
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                    <table className="pat-table"><thead><tr><th>Empresa</th><th>Tipo</th><th>Comentarios</th></tr></thead>
                    <tbody><tr><td colSpan={3} style={{textAlign:'center',color:'var(--text4)',fontSize:11,padding:16}}>No se encontró nada para mostrar aquí</td></tr></tbody></table>
                    <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 0</div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Otras cuentas</div>
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                    <table className="pat-table"><thead><tr><th><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th><th>Compañía</th><th>ID LiveDeal</th><th>Contacto</th></tr></thead>
                    <tbody><tr><td><input type="checkbox" style={{accentColor:'var(--accent)'}}/></td><td className="pat-link">Savills RE Spain SAU</td><td>—</td><td>Pardo Est...</td></tr></tbody></table>
                    <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 1</div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Equipo proyecto</div>
                  <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                    <table className="pat-table"><thead><tr><th><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th><th>Usuario</th><th>Equipo</th></tr></thead>
                    <tbody><tr>
                      <td><input type="checkbox" style={{accentColor:'var(--accent)'}}/></td>
                      <td><div style={{display:'flex',alignItems:'center',gap:5}}>
                        <div className="c-av" style={{background:'#dcfce7',color:'#166534',width:18,height:18,fontSize:7}}>SA</div>
                        <span style={{fontSize:11}}>Sierra Alvaro (Ocupado)</span>
                      </div></td>
                      <td style={{fontSize:11,color:'var(--accent)'}}>Leasing Oficinas...</td>
                    </tr></tbody></table>
                    <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 1</div>
                  </div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Documentos ── */}
          {activeTab==='dem-docs' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'grid',gridTemplateColumns:'220px 1fr',border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                <div style={{borderRight:'1px solid var(--border)',padding:12}}>
                  <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Navegar...</div>
                  <button className="ab-btn" style={{width:'100%',justifyContent:'center'}}>Reiniciar</button>
                </div>
                <div style={{padding:12}}>
                  <div style={{display:'flex',gap:6,marginBottom:10}}><button className="ab-btn">🗑 BORRAR</button><button className="ab-btn">🔍 CONSULTAR</button></div>
                  <table className="doc-table"><thead><tr><th><input type="checkbox" style={{accentColor:'var(--accent)'}}/></th><th>Título del documento</th><th>Creado en</th><th>Creado por</th></tr></thead>
                  <tbody><tr><td colSpan={4} style={{textAlign:'center',color:'var(--text4)',fontSize:11,padding:14}}>No records are available.</td></tr></tbody></table>
                  <div className="doc-drop" style={{marginTop:10}}>📁 Deja tus archivos aquí</div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Negociaciones en curso ── */}
          {activeTab==='dem-neg' && (
            <div className="tab-content active"><div className="info-pad">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:600}}>Negociaciones en curso</div>
                <div style={{display:'flex',gap:6}}><button className="ab-btn">↺ Actualizar</button><button className="ab-btn blue">⟶ Ver todas</button></div>
              </div>
              <div style={{border:'1px solid var(--border)',borderRadius:'var(--r2)',overflow:'hidden'}}>
                <table className="pat-table">
                  <thead><tr><th>N° transacción</th><th>Petición</th><th>Oferta</th><th>Estado actual</th><th>Activo</th><th>Tipo operación</th><th>Demandante</th><th>Agente P.</th></tr></thead>
                  <tbody><tr><td colSpan={8} style={{textAlign:'center',color:'var(--text4)',fontSize:11,padding:20}}>No se encontró nada para mostrar aquí</td></tr></tbody>
                </table>
                <div style={{padding:'5px 10px',fontSize:10,color:'var(--text4)',borderTop:'1px solid var(--border)'}}>Filas: 0</div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Follow-up ── */}
          {activeTab==='dem-followup' && (
            <div className="tab-content active"><div className="info-pad">
              <div className="info-2col" style={{maxWidth:560}}>
                <div className="info-block">
                  <div className="ib-title">CREACIÓN</div>
                  <div className="ir"><span className="ir-k">Creado el</span><span className="ir-v">17/10/2025 · 10:24</span></div>
                  <div className="ir"><span className="ir-k">Creado por</span><span className="ir-v link">Sierra Alvaro (Ocupado)</span></div>
                </div>
                <div className="info-block">
                  <div className="ib-title">ÚLTIMA MODIFICACIÓN</div>
                  <div className="ir"><span className="ir-k">Modificado el</span><span className="ir-v">17/10/2025 · 10:24</span></div>
                  <div className="ir"><span className="ir-k">Modificado por</span><span className="ir-v link">Sierra Alvaro (Ocupado)</span></div>
                </div>
              </div>
            </div></div>
          )}

          {/* ── TAB: Confidencialidad ── */}
          {activeTab==='dem-conf' && (
            <div className="tab-content active" style={{overflowY:'auto',flex:1}}>
              <div className="info-pad">

                {/* Toggle principal */}
                <div style={{display:'flex',alignItems:'center',gap:16,padding:'14px 16px',border:`1px solid ${confidential?'#334155':'var(--border)'}`,borderRadius:'var(--r2)',background:confidential?'#0f172a':'var(--surface)',marginBottom:18,transition:'all .2s'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:confidential?'#f8fafc':'var(--text)'}}>Demanda confidencial</div>
                    <div style={{fontSize:11,color:confidential?'#94a3b8':'var(--text3)',marginTop:2}}>
                      {confidential ? 'Cliente, requisitos, condiciones económicas y documentos ocultos para usuarios no autorizados.' : 'La demanda es visible para todos los usuarios con acceso al PDB.'}
                    </div>
                  </div>
                  <button onClick={()=>setConfidential(v=>!v)} style={{padding:'6px 16px',borderRadius:20,border:'none',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',background:confidential?'#f8fafc':'#1e293b',color:confidential?'#0f172a':'#f8fafc',transition:'all .2s'}}>
                    {confidential ? '🔓 Desactivar' : '🔒 Activar'}
                  </button>
                </div>

                {/* Info visible / oculta */}
                {confidential && (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:18}}>
                    <div style={{border:'1px solid var(--red-bd)',background:'var(--red-lt)',borderRadius:'var(--r2)',padding:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--red)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>❌ Oculto (no autorizados)</div>
                      {['Cliente / Empresa','Requisitos de búsqueda','Condiciones económicas','Documentación adjunta','Zona de búsqueda'].map(item=>(
                        <div key={item} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--text2)',marginBottom:4}}>
                          <span style={{color:'var(--red)',fontWeight:700}}>✕</span> {item}
                        </div>
                      ))}
                    </div>
                    <div style={{border:'1px solid var(--green-bd)',background:'var(--green-lt)',borderRadius:'var(--r2)',padding:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>✅ Visible (siempre)</div>
                      {['Tipo de uso / línea','Estado de la demanda','Equipo responsable','Fecha de creación','Información básica'].map(item=>(
                        <div key={item} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--text2)',marginBottom:4}}>
                          <span style={{color:'var(--green)',fontWeight:700}}>✓</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usuarios autorizados */}
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em'}}>Usuarios autorizados</div>
                    <button className="ab-btn blue" onClick={()=>setAddingUser(true)} style={{fontSize:10,padding:'3px 9px'}}>+ Añadir usuario</button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {authorizedUsers.map((u,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',border:'1px solid var(--border)',borderRadius:'var(--r)',background:'var(--surface)'}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:u.bg,color:u.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>{u.initials}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:600}}>{u.name}</div>
                          <div style={{fontSize:10,color:'var(--text3)'}}>{u.team} · {u.role}</div>
                        </div>
                        {u.owner
                          ? <span className="tag tag-blue">Propietario</span>
                          : <>
                              <span style={{fontSize:10,color:'var(--text4)'}}>Acceso: {u.granted}</span>
                              <button onClick={()=>setAuthorizedUsers(prev=>prev.filter((_,j)=>j!==i))} style={{fontSize:10,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:'2px 6px',fontFamily:'inherit'}}>✕ Quitar</button>
                            </>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {addingUser && (
                  <div style={{border:'1px solid var(--accent-bd)',background:'var(--accent-lt)',borderRadius:'var(--r2)',padding:14,marginBottom:14}}>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Conceder acceso a usuario</div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
                      <div style={{display:'flex',flexDirection:'column',gap:3}}>
                        <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Usuario</span>
                        <select className="fsel" value={newUser} onChange={e=>setNewUser(e.target.value)} style={{minWidth:220}}>
                          <option value="">Seleccionar usuario...</option>
                          <option>GOMEZ Ignacio · Leasing Oficinas MAD</option>
                          <option>García Marta · Capital Markets MAD</option>
                          <option>López Carmen · Valoraciones MAD</option>
                          <option>Alonso Abruña D. · Leasing MAD</option>
                          <option>Martínez Rosa · Retail MAD</option>
                        </select>
                      </div>
                      <button className="ab-btn save" onClick={()=>{
                        if(!newUser)return
                        const [nameStr,teamStr]=[newUser.split('·')[0].trim(),newUser.split('·')[1]?.trim()||'']
                        const ini=nameStr.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                        const today=new Date().toLocaleDateString('es-ES')
                        setAuthorizedUsers(prev=>[...prev,{name:nameStr,team:teamStr,role:'Autorizado',initials:ini,bg:'#f0fdf4',color:'#166534',granted:today,owner:false}])
                        setAddingUser(false);setNewUser('')
                      }}>Conceder acceso</button>
                      <button className="ab-btn" onClick={()=>{setAddingUser(false);setNewUser('')}}>Cancelar</button>
                    </div>
                  </div>
                )}

                {/* Solicitud de acceso (demo: usuario no autorizado) */}
                {confidential && (
                  <div style={{border:'1px solid var(--amber-bd)',background:'var(--amber-lt)',borderRadius:'var(--r2)',padding:14,marginBottom:16}}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--amber)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>DEMO — Vista de usuario no autorizado</div>
                    <div style={{fontSize:11,color:'var(--text2)',marginBottom:10}}>Un usuario sin acceso vería este mensaje y podría solicitar acceso al responsable.</div>
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',border:'1px solid var(--border)',borderRadius:'var(--r)',background:'var(--surface)'}}>
                      <span style={{fontSize:20}}>🔒</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600}}>Demanda confidencial</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>No tienes permisos para ver el detalle de esta demanda. Puedes solicitar acceso al responsable.</div>
                      </div>
                      <button className="ab-btn save" style={{flexShrink:0}} onClick={()=>alert('✅ Solicitud enviada a Sierra Álvaro\n\nEl responsable recibirá una notificación y podrá aprobar o rechazar tu acceso.')}>Solicitar acceso</button>
                    </div>
                  </div>
                )}

                {/* Trazabilidad */}
                <div style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Trazabilidad de accesos</div>
                <div style={{border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
                  {[
                    {color:'var(--green)',msg:'Sierra Álvaro creó la demanda y quedó asignado como responsable',date:'17/10/2025 · 10:24'},
                    {color:'var(--accent)',msg:'Sierra Álvaro activó confidencialidad en esta demanda',date:'13/04/2026 · 09:00'},
                  ].map((e,i,arr)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 12px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:e.color,flexShrink:0,marginTop:4}}/>
                      <div><div style={{fontSize:11}}>{e.msg}</div><div style={{fontSize:10,color:'var(--text4)'}}>{e.date}</div></div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}
        </div>

        <RightPanel navigate={navigate} naturaleza={naturaleza} cmFields={cmFields}/>
      </div>
      {showTarea && <AsignarTareaModal refTipo="Demanda" refNombre="D251035690 · Corp. Financiera Azuaga" onClose={() => setShowTarea(false)} />}

      {/* Modal Transformar en Oportunidad */}
      {showTransformar && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowTransformar(false)}>
          <div style={{background:'var(--surface)',borderRadius:10,padding:24,maxWidth:480,width:'90%',boxShadow:'0 8px 32px rgba(0,0,0,.18)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:32,height:32,borderRadius:6,background:'#0078d4',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span style={{color:'#fff',fontWeight:800,fontSize:14}}>D</span>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>Transformar en Oportunidad</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>La oportunidad oficial se creará en Microsoft Dynamics 365</div>
              </div>
            </div>

            {dinamicsOk ? (
              <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:18,marginBottom:16,textAlign:'center'}}>
                <div style={{fontSize:22,marginBottom:8}}>✓</div>
                <div style={{fontSize:13,fontWeight:700,color:'#166534',marginBottom:4}}>Oportunidad creada en Dynamics</div>
                <div style={{fontSize:11,color:'#16a34a',fontWeight:600}}>✓ Oportunidad enviada a Dynamics CRM</div>
                <div style={{fontSize:10,color:'var(--text3)',marginTop:6,lineHeight:1.5}}>La demanda queda vinculada. El equipo ha sido notificado y Dynamics sincronizará el estado automáticamente.</div>
              </div>
            ) : (
              <>
                <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:7,padding:12,marginBottom:14}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#1e40af',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>Información que viajará a Dynamics</div>
                  {[
                    ['Cuenta','Corporacion Financiera Azuaga SL'],
                    ['Contacto','—'],
                    ['Uso / Naturaleza', naturaleza === 'Inversión' ? `Inversión · ${cmFields.tipo_op||'—'}` : `Leasing · ${demUsoPpal}`],
                    ['Superficie',naturaleza === 'Leasing' ? `${demCampos.sup_min||'—'} – ${demCampos.sup_max||'—'} m²` : `Ticket ${cmFields.ticket_min||'—'}–${cmFields.ticket_max||'—'} M€`],
                    ['País','España'],
                    ['Origen del negocio','Otras Consultoras'],
                    ['Responsable','Sierra Álvaro'],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex',gap:8,fontSize:11,marginBottom:3}}>
                      <span style={{color:'var(--text4)',minWidth:120}}>{k}</span>
                      <span style={{fontWeight:500,color:'var(--text)'}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:11,color:'var(--text3)',marginBottom:16,lineHeight:1.6}}>
                  Se creará una Oportunidad en Dynamics CRM y se enviará notificación al equipo. La demanda quedará vinculada y el PDB mantendrá la trazabilidad completa del proceso.
                </div>
              </>
            )}

            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              {dinamicsOk ? (
                <button className="ab-btn" onClick={()=>{ setShowTransformar(false); setDinamicsOk(false) }}>Cerrar</button>
              ) : (
                <>
                  <button className="ab-btn" onClick={()=>setShowTransformar(false)}>Cancelar</button>
                  <button style={{padding:'7px 16px',borderRadius:6,background:'#0078d4',color:'#fff',border:'none',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}
                    onClick={()=>setDinamicsOk(true)}>
                    Confirmar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
