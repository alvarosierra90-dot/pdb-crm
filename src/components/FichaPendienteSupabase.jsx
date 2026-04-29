import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavigationContext'
import { supabase } from '../lib/supabase'
import { CURRENT_USER, esResponsable } from '../lib/currentUser'

// Patrón de ref nuevo (los creados desde transformación de Lead).
// Si el ref no encaja con esto, se asume mock antiguo y se devuelve false.
export function isSupabaseRef(ref) {
  return /^(DEM|OFE|PRY)-\d{4}-\d{4}$/.test(ref || '')
}

const ENTITIES = {
  demanda: {
    table:    'demandas',
    label:    'Demanda',
    icon:     '🎯',
    backView: 'demandas',
    fkRelations: [
      { fk:'dynamics_account_id',     table:'dynamics_accounts',     label:'Cuenta inquilina',  cols:'dynamics_id, nombre' },
      { fk:'dynamics_opportunity_id', table:'dynamics_opportunities',label:'Oportunidad (Dynamics)', cols:'dynamics_id, nombre, tipo' },
    ],
    editable: [
      { key:'nombre',  label:'Nombre / título',  type:'text',     placeholder:'Cómo identificas esta demanda' },
      { key:'estatus', label:'Estado',           type:'select',   options:[
        { v:'ongoing',           label:'En curso' },
        { v:'paralizada',        label:'Paralizada' },
        { v:'descartada',        label:'Descartada' },
        { v:'cerrada_concedido', label:'Cerrada · Concedido' },
        { v:'cerrada_perdida',   label:'Cerrada · Perdida' },
      ] },
      { key:'notas',   label:'Notas',            type:'textarea', placeholder:'Notas internas' },
    ],
    requisitos: true, // demandas tiene jsonb requisitos editable
  },
  oferta: {
    table:    'ofertas',
    label:    'Oferta',
    icon:     '🏢',
    backView: 'ofertas',
    fkRelations: [
      { fk:'activo_id',               table:'activos',               label:'Activo',     cols:'id, ref, nombre, ciudad, zona' },
      { fk:'dynamics_account_id',     table:'dynamics_accounts',     label:'Propietario',cols:'dynamics_id, nombre' },
      { fk:'dynamics_opportunity_id', table:'dynamics_opportunities',label:'Oportunidad',cols:'dynamics_id, nombre, tipo' },
    ],
    editable: [
      { key:'tipo_operacion',  label:'Tipo operación',     type:'select',   options:[
        { v:'Alquiler', label:'Alquiler' }, { v:'Venta', label:'Venta' }, { v:'Inversión', label:'Inversión' },
      ] },
      { key:'tipo_mercado',    label:'Mercado',            type:'select',   options:[
        { v:'mercado',    label:'Mercado' }, { v:'off_market', label:'Off-market' },
      ] },
      { key:'tipologia',       label:'Tipología',          type:'text',     placeholder:'Oficina, Logístico, Retail...' },
      { key:'superficie_disponible', label:'Sup. disponible (m²)', type:'number' },
      { key:'renta_m2',        label:'Renta €/m² /mes',    type:'number' },
      { key:'plazas',          label:'Plazas aparcamiento',type:'number' },
      { key:'estado',          label:'Estado',             type:'select',   options:[
        { v:'En curso', label:'En curso' }, { v:'Activa', label:'Activa' },
        { v:'Ocupada parcial', label:'Ocupada parcial' }, { v:'Ocupada total', label:'Ocupada total' },
        { v:'Retirada', label:'Retirada' },
      ] },
      { key:'descriptivo',     label:'Descriptivo',        type:'textarea', placeholder:'Descripción comercial' },
      { key:'comentarios',     label:'Comentarios',        type:'textarea' },
    ],
  },
  propuesta: {
    table:    'propuestas',
    label:    'Propuesta / Proyecto',
    icon:     '📄',
    backView: 'propuestas',
    fkRelations: [
      { fk:'dynamics_opportunity_id', table:'dynamics_opportunities',label:'Oportunidad', cols:'dynamics_id, nombre, tipo' },
      { fk:'dynamics_account_id',     table:'dynamics_accounts',     label:'Cuenta',      cols:'dynamics_id, nombre' },
    ],
    editable: [
      { key:'nombre',             label:'Nombre / título',  type:'text',     placeholder:'Título de la propuesta' },
      { key:'tipo',               label:'Tipo',             type:'text',     placeholder:'Pitch demanda, RFP, advisory...' },
      { key:'estado',             label:'Estado',           type:'select',   options:[
        { v:'borrador',   label:'Borrador' },
        { v:'presentada', label:'Presentada' },
        { v:'standby',    label:'Standby' },
        { v:'ganada',     label:'Ganada' },
        { v:'perdida',    label:'Perdida' },
        { v:'cancelada',  label:'Cancelada' },
      ] },
      { key:'fees',               label:'Fees (€)',         type:'number' },
      { key:'fecha_presentacion', label:'Fecha presentación', type:'date' },
      { key:'fecha_resolucion',   label:'Fecha resolución',   type:'date' },
      { key:'fecha_cierre',       label:'Fecha cierre',       type:'date' },
      { key:'equipo',             label:'Equipo',             type:'text' },
      { key:'responsable',        label:'Responsable',        type:'text' },
      { key:'notas',              label:'Notas',              type:'textarea' },
    ],
  },
}

const inlineInp = {
  width:'100%', padding:'6px 9px', fontSize:12, border:'1px solid var(--border)',
  borderRadius:5, background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', boxSizing:'border-box', outline:'none',
}
const inlineTa = { ...inlineInp, padding:'7px 9px', resize:'vertical', minHeight:70, lineHeight:1.5 }

function fmtFecha(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES')
}

export default function FichaPendienteSupabase({ entity, refOrId }) {
  const cfg = ENTITIES[entity]
  const { navigate } = useNav()
  const [record, setRecord]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({})
  const [reqs, setReqs]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState(null)

  const load = useCallback(async () => {
    if (!cfg) { setError('Entidad desconocida'); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from(cfg.table)
      .select('*')
      .eq('ref', refOrId)
      .maybeSingle()
    if (error) {
      setError(error.message); setRecord(null); setLoading(false); return
    }
    if (!data) {
      setError(`${cfg.label} no encontrada (${refOrId})`); setRecord(null); setLoading(false); return
    }
    // Cargar las relaciones FK individualmente para mostrar nombres legibles
    const enriched = { ...data, _rel: {} }
    for (const r of cfg.fkRelations) {
      const fkVal = data[r.fk]
      if (!fkVal) { enriched._rel[r.fk] = null; continue }
      const { data: relData } = await supabase.from(r.table).select(r.cols).eq(
        r.table === 'activos' ? 'id' : 'dynamics_id',
        fkVal
      ).maybeSingle()
      enriched._rel[r.fk] = relData
    }
    setRecord(enriched)
    setError(null)
    setLoading(false)
  }, [cfg, refOrId])

  useEffect(() => { load() }, [load])

  if (!cfg) return <div style={{ padding:32, color:'#991b1b' }}>Entidad desconocida.</div>
  if (loading) return <div style={{ padding:32, color:'var(--text4)', fontSize:12 }}>Cargando…</div>
  if (error || !record) {
    return (
      <div style={{ padding:32 }}>
        <div style={{ fontSize:13, color:'#991b1b', marginBottom:12 }}>{error || 'No encontrado'}</div>
        <button className="ab-btn" onClick={() => navigate(cfg.backView)}>← Volver</button>
      </div>
    )
  }

  const canEdit = esResponsable(record) || !record.responsable

  const startEdit = () => {
    const f = {}
    for (const fld of cfg.editable) f[fld.key] = record[fld.key] ?? ''
    setForm(f)
    setReqs(record.requisitos || {})
    setSaveError(null)
    setEditing(true)
  }
  const cancelEdit = () => { setEditing(false); setSaveError(null) }
  const saveEdit = async () => {
    setSaving(true)
    const payload = {}
    for (const fld of cfg.editable) {
      const v = form[fld.key]
      payload[fld.key] = (v === '' || v === undefined) ? null : (fld.type === 'number' ? Number(v) : v)
    }
    if (cfg.requisitos) {
      payload.requisitos = Object.keys(reqs).length ? reqs : null
    }
    payload.updated_at = new Date().toISOString()
    const { error } = await supabase.from(cfg.table).update(payload).eq('id', record.id)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    setEditing(false)
    await load()
  }

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const setR = (k, v) => setReqs(prev => ({ ...prev, [k]: v }))

  // Detecta si el registro está "pendiente" (sin nombre ni notas relevantes)
  const pendiente = !record.nombre && !record.notas && !record.descripcion && !record.descriptivo

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

      {/* Action bar */}
      <div className="action-bar">
        {editing ? (
          <>
            <button className="ab-btn save" onClick={saveEdit} disabled={saving}>
              {saving ? 'Guardando…' : '💾 Guardar cambios'}
            </button>
            <button className="ab-btn" onClick={cancelEdit} disabled={saving}>Cancelar</button>
          </>
        ) : (
          <>
            {canEdit ? (
              <button className="ab-btn save" onClick={startEdit}>✎ Editar</button>
            ) : (
              <button className="ab-btn" disabled style={{ opacity:0.55, cursor:'not-allowed' }} title={`Solo el responsable puede editar`}>
                🔒 Solo lectura
              </button>
            )}
            <button className="ab-btn" onClick={() => navigate(cfg.backView)}>← Volver</button>
          </>
        )}
        {saveError && <span style={{ marginLeft:12, fontSize:11, color:'#991b1b', fontWeight:600 }}>{saveError}</span>}
      </div>

      <div className="ficha-wrap">
        <div className="ficha-main">

          {/* Header */}
          <div className="ah">
            <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:50, height:50, borderRadius:10, background:'#f1f5f9', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                {cfg.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="ah-name">
                  {record.nombre || <span style={{ color:'var(--text4)', fontStyle:'italic' }}>(Sin nombre — completar)</span>}
                </div>
                <div className="ah-addr">
                  {cfg.label} · {record.ref} · Creado {fmtFecha(record.created_at)}
                </div>
                {pendiente && (
                  <div style={{ marginTop:8, background:'#fef3c7', border:'1px solid #fde68a', borderRadius:6, padding:'8px 12px', fontSize:11, color:'#92400e' }}>
                    ⚠️ Registro recién creado — completa los campos pendientes y pulsa <strong>Guardar cambios</strong>.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="info-pad">

            {/* FKs (read-only, los marcó la transformación) */}
            <div className="va-card">
              <div className="va-card-header">
                <h3><span className="ico" style={{color:'var(--accent)'}}>●</span> Vinculaciones</h3>
                <span className="hint">heredado de la transformación</span>
              </div>
              <div className="va-kv-list" style={{ padding:'0 20px 14px' }}>
                {cfg.fkRelations.map(r => {
                  const rel = record._rel?.[r.fk]
                  return (
                    <div key={r.fk} className="ir">
                      <span className="ir-k">{r.label}</span>
                      <span className="ir-v">
                        {rel ? (
                          <span style={{ fontWeight:600 }}>
                            {rel.nombre || rel.ref || rel.dynamics_id}
                            {rel.tipo && <span className="tag tag-blue" style={{ marginLeft:8 }}>{rel.tipo}</span>}
                          </span>
                        ) : (
                          <span style={{ color:'var(--text4)' }}>—</span>
                        )}
                      </span>
                    </div>
                  )
                })}
                {record.lead_id && (
                  <div className="ir">
                    <span className="ir-k">Lead origen</span>
                    <span className="ir-v">
                      <button className="ab-btn" style={{ padding:'2px 8px', fontSize:11 }} onClick={() => navigate('leads')}>Ver lead</button>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Campos editables */}
            <div className="va-card">
              <div className="va-card-header">
                <h3><span className="ico">▭</span> Datos {cfg.label.toLowerCase()}</h3>
                {!editing && canEdit && <span className="hint">Pulsa Editar para completar</span>}
              </div>
              <div className="va-kv-list" style={{ padding:'4px 20px 14px' }}>
                {cfg.editable.map(fld => {
                  const val = record[fld.key]
                  const empty = val === null || val === undefined || val === ''
                  return (
                    <div key={fld.key} className="ir">
                      <span className="ir-k">
                        {fld.label}
                        {empty && !editing && <span style={{ marginLeft:6, fontSize:9, color:'#dc2626', fontWeight:700 }}>PENDIENTE</span>}
                      </span>
                      <span className="ir-v">
                        {!editing && (
                          fld.type === 'date' ? fmtDate(val) :
                          fld.type === 'textarea' ? (val || <span style={{ color:'var(--text4)' }}>—</span>) :
                          (val ?? <span style={{ color:'var(--text4)' }}>—</span>)
                        )}
                        {editing && fld.type === 'select' && (
                          <select style={inlineInp} value={form[fld.key] || ''} onChange={e => setF(fld.key, e.target.value)}>
                            <option value="">—</option>
                            {fld.options.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        )}
                        {editing && fld.type === 'textarea' && (
                          <textarea style={inlineTa} value={form[fld.key] || ''} onChange={e => setF(fld.key, e.target.value)} placeholder={fld.placeholder} />
                        )}
                        {editing && fld.type === 'date' && (
                          <input type="date" style={inlineInp} value={form[fld.key] || ''} onChange={e => setF(fld.key, e.target.value)} />
                        )}
                        {editing && fld.type === 'number' && (
                          <input type="number" style={inlineInp} value={form[fld.key] ?? ''} onChange={e => setF(fld.key, e.target.value)} />
                        )}
                        {editing && fld.type === 'text' && (
                          <input style={inlineInp} value={form[fld.key] || ''} onChange={e => setF(fld.key, e.target.value)} placeholder={fld.placeholder} />
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Requisitos para Demanda (JSONB libre) */}
            {cfg.requisitos && (
              <div className="va-card">
                <div className="va-card-header">
                  <h3><span className="ico" style={{color:'var(--purple)'}}>●</span> Requisitos de búsqueda</h3>
                  <span className="hint">{editing ? 'Edita los campos que apliquen' : 'Datos del perfil de búsqueda'}</span>
                </div>
                <div className="va-kv-list" style={{ padding:'4px 20px 14px' }}>
                  {[
                    { k:'uso',          label:'Uso',                placeholder:'Oficinas, Logístico, Retail...' },
                    { k:'tipologia',    label:'Tipología',          placeholder:'Oficina tradicional, Nave logística...' },
                    { k:'m2_min',       label:'Sup. mínima (m²)',   type:'number' },
                    { k:'m2_max',       label:'Sup. máxima (m²)',   type:'number' },
                    { k:'zonas',        label:'Zonas preferentes',  placeholder:'M-30, A-1, Castellana...' },
                    { k:'presupuesto',  label:'Presupuesto máx (€/m²/mes)', type:'number' },
                    { k:'plazo',        label:'Plazo de entrada',   placeholder:'Q3 2026' },
                    { k:'urgencia',     label:'Urgencia',           placeholder:'Alta / Media / Baja' },
                  ].map(r => {
                    const val = record.requisitos?.[r.k]
                    const empty = !val
                    return (
                      <div key={r.k} className="ir">
                        <span className="ir-k">
                          {r.label}
                          {empty && !editing && <span style={{ marginLeft:6, fontSize:9, color:'#dc2626', fontWeight:700 }}>PENDIENTE</span>}
                        </span>
                        <span className="ir-v">
                          {!editing && (val ?? <span style={{ color:'var(--text4)' }}>—</span>)}
                          {editing && r.type === 'number' && (
                            <input type="number" style={inlineInp} value={reqs[r.k] ?? ''} onChange={e => setR(r.k, e.target.value)} />
                          )}
                          {editing && !r.type && (
                            <input style={inlineInp} value={reqs[r.k] || ''} onChange={e => setR(r.k, e.target.value)} placeholder={r.placeholder} />
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
