import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { X, Search, Check, Plus } from 'lucide-react'

/**
 * Matching de Demanda contra el pool de Ofertas.
 *
 * Cruza la demanda (uso, superficie, zona, presupuesto) contra TODAS las ofertas
 * activas y las clasifica en Cumple / Flexible / Razonable (filosofía flexible:
 * nunca "0 resultados" si hay opciones cercanas — ver memoria matching-demanda).
 * Añadir una oferta crea una fila en `oferta_demanda` con snapshot de las
 * condiciones negociables; el resto se referencia en vivo desde la oferta.
 *
 * Props
 *  - demanda:      fila de la demanda (sup_min, sup_max, uso_principal, presupuesto_tipo, alq_min/max, zonas, provincias, id)
 *  - yaAnadidas:   array de oferta_demanda (para excluir/marcar las ya añadidas)
 *  - onClose:      () => void
 *  - onAdded:      () => void   (recargar alternativas)
 */
export default function MatchingOfertasModal({ demanda, yaAnadidas = [], onClose, onAdded }) {
  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(null)   // oferta_id en curso
  const [added, setAdded]   = useState(() => new Set((yaAnadidas || []).map(a => a.ofertas?.id || a.oferta_id).filter(Boolean)))

  // Pool de ofertas activas + activo vinculado (zona/uso para el cruce).
  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      const { data: ofs } = await supabase
        .from('ofertas')
        .select('id, ref, nombre:titulo_web, tipo_operacion, tipologia, estado, activa, superficie_disponible, renta_m2, activo_id, activo_ref')
        .order('created_at', { ascending: false })
      const CERRADAS = new Set(['Cerrada', 'Desactivada', 'Perdida', 'Retirada'])
      // Excluir cerradas por estado Y las dadas de baja (activa=false): una oferta
      // retirada no debe reaparecer en el matching como alternativa "Cumple".
      const lista = (ofs || []).filter(o => o.activa !== false && !CERRADAS.has(o.estado))
      // Join cliente-side con activos (por id o ref) para zona/uso/sba.
      const ids = [...new Set(lista.map(o => o.activo_id).filter(Boolean))]
      const refs = [...new Set(lista.map(o => o.activo_ref).filter(Boolean))]
      const byId = {}, byRef = {}
      if (ids.length || refs.length) {
        const orParts = []
        if (ids.length) orParts.push(`id.in.(${ids.join(',')})`)
        if (refs.length) orParts.push(`ref.in.(${refs.map(r => `"${r}"`).join(',')})`)
        const { data: acts } = await supabase
          .from('activos').select('id, ref, nombre, ciudad, zona, subzona, uso, sba')
          .or(orParts.join(','))
        ;(acts || []).forEach(a => { byId[a.id] = a; if (a.ref) byRef[a.ref] = a })
      }
      if (cancel) return
      setOfertas(lista.map(o => ({ ...o, activos: byId[o.activo_id] || byRef[o.activo_ref] || null })))
      setLoading(false)
    })()
    return () => { cancel = true }
  }, [])

  // Los criterios de la demanda (superficie, zona, uso, presupuesto) viven en el
  // jsonb `requisitos`. Algunos flujos antiguos los pasan planos; fusionamos para
  // leer de ambos. Sin esto el matching corría SIN criterios (todo "flexible").
  const req = useMemo(() => ({ ...(demanda || {}), ...(demanda?.requisitos || {}) }), [demanda])

  // Tokens de zona/provincia de la demanda para el match geográfico.
  const zonaTokens = useMemo(() => {
    const t = []
    ;(req?.zonas || []).forEach(z => {
      if (typeof z === 'string') t.push(z)
      else if (z) t.push(z.subzona, z.area, z.zona, z.eje, z.nombre)
    })
    ;(req?.provincias || []).forEach(p => t.push(typeof p === 'string' ? p : p?.nombre))
    return t.filter(Boolean).map(s => String(s).toLowerCase().trim()).filter(Boolean)
  }, [req])

  const supMin = Number(req?.sup_min ?? req?.m2_min) || 0
  const supMax = Number(req?.sup_max ?? req?.m2_max) || 0
  const alqMin = Number(req?.alq_min) || 0
  const alqMax = Number(req?.alq_max) || 0
  const tienePresupuesto = (req?.presupuesto_tipo === 'Alquiler') || alqMin > 0 || alqMax > 0

  // Clasifica una oferta: { overall, supCat, zCat, rentaCat, usoOK, sup, renta }
  const score = (o) => {
    const act = o.activos
    const sup = Number(o.superficie_disponible || act?.sba || 0)
    let supCat = 'na'
    if (supMin || supMax) {
      const lo = supMin || 0, hi = supMax || Infinity
      if (sup >= lo && sup <= hi) supCat = 'cumple'
      else if (sup >= lo * 0.8 && sup <= hi * 1.2) supCat = 'flex'
      else supCat = 'no'
    }
    let zCat = 'na'
    if (zonaTokens.length) {
      const hay = [act?.zona, act?.subzona, act?.ciudad].filter(Boolean).map(s => String(s).toLowerCase())
      zCat = hay.some(h => zonaTokens.some(t => h.includes(t) || t.includes(h))) ? 'cumple' : 'no'
    }
    const usoOK = !req?.uso_principal || !act?.uso || act.uso === req.uso_principal
    let rentaCat = 'na'
    if (tienePresupuesto) {
      const r = Number(o.renta_m2) || 0
      if (r > 0) {
        const lo = alqMin || 0, hi = alqMax || Infinity
        if (r >= lo && r <= hi) rentaCat = 'cumple'
        else if (r <= hi * 1.2) rentaCat = 'flex'
        else rentaCat = 'no'
      }
    }
    const cats = [supCat, zCat, rentaCat].filter(c => c !== 'na')
    let overall
    if (!usoOK) overall = 'razonable'
    else if (cats.length && cats.every(c => c === 'cumple')) overall = 'cumple'
    else if (cats.filter(c => c === 'no').length >= 2) overall = 'razonable'
    else if (cats.includes('no') || cats.includes('flex')) overall = 'flexible'
    else overall = 'flexible'
    return { overall, supCat, zCat, rentaCat, usoOK, sup, renta: Number(o.renta_m2) || 0 }
  }

  const ranked = useMemo(() => {
    const q = search.trim().toLowerCase()
    const ord = { cumple: 0, flexible: 1, razonable: 2 }
    return ofertas
      .map(o => ({ o, s: score(o) }))
      .filter(({ o }) => {
        if (!q) return true
        const hay = [o.nombre, o.ref, o.activos?.nombre, o.activos?.ciudad, o.activos?.zona].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => (ord[a.s.overall] - ord[b.s.overall]) || (b.s.sup - a.s.sup))
  }, [ofertas, search, zonaTokens, supMin, supMax, alqMin, alqMax])

  const grupos = {
    cumple:    ranked.filter(r => r.s.overall === 'cumple'),
    flexible:  ranked.filter(r => r.s.overall === 'flexible'),
    razonable: ranked.filter(r => r.s.overall === 'razonable'),
  }

  const addAlternativa = async (o, s) => {
    if (added.has(o.id)) return
    // oferta_demanda.activo_id es NOT NULL: sin activo vinculado el insert falla
    // en BD. Avisar en vez de dejar que reviente silenciosamente.
    const activoId = o.activo_id || o.activos?.id || null
    if (!activoId) { window.alert('Esta oferta no tiene un activo vinculado; no se puede añadir como alternativa.'); return }
    setAdding(o.id)
    const condiciones = {
      renta_m2: s.renta || null,
      tipo_operacion: o.tipo_operacion || null,
      superficie: s.sup || null,
      match: s.overall,
      snapshot_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('oferta_demanda').insert({
      demanda_id: demanda.id,
      oferta_id: o.id,
      activo_id: activoId,
      estado_alternativa: 'propuesta',
      condiciones_negociadas: condiciones,
    })
    setAdding(null)
    if (error) { window.alert('No se pudo añadir como alternativa: ' + error.message); return }
    setAdded(prev => new Set(prev).add(o.id))
    onAdded?.()
  }

  const BADGE = {
    cumple:    { label: 'Cumple',     bg: '#dcfce7', col: '#166534', bd: '#86efac' },
    flexible:  { label: 'Flexible',   bg: '#fef3c7', col: '#92400e', bd: '#fcd34d' },
    razonable: { label: 'Razonable',  bg: '#f1f5f9', col: '#475569', bd: '#cbd5e1' },
  }
  const catTag = (cat, txt) => {
    if (cat === 'na') return null
    const c = cat === 'cumple' ? '#16a34a' : cat === 'flex' ? '#d97706' : '#dc2626'
    return <span style={{ fontSize: 9, fontWeight: 700, color: c, border: `1px solid ${c}55`, borderRadius: 4, padding: '1px 5px' }}>{txt}</span>
  }

  const Card = ({ o, s }) => {
    const b = BADGE[s.overall]
    const act = o.activos
    const ya = added.has(o.id)
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act?.nombre || o.nombre || o.ref}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{o.ref}{act?.zona ? ` · ${act.zona}` : ''}{act?.ciudad ? ` · ${act.ciudad}` : ''}</div>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: b.col, background: b.bg, border: `1px solid ${b.bd}`, borderRadius: 10, padding: '2px 8px', flexShrink: 0 }}>{b.label}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--text2)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{s.sup ? s.sup.toLocaleString('es-ES') + ' m²' : '— m²'}</span>
          <span style={{ fontFamily: 'var(--mono)' }}>{s.renta ? `${s.renta} €/m²/mes` : '—'}</span>
          <span style={{ color: 'var(--text4)' }}>{o.tipo_operacion || ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {catTag(s.supCat, 'Superficie')}
          {catTag(s.zCat, 'Zona')}
          {catTag(s.rentaCat, 'Renta')}
          {!s.usoOK && <span style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', border: '1px solid #dc262655', borderRadius: 4, padding: '1px 5px' }}>Otro uso</span>}
          <button
            disabled={ya || adding === o.id}
            onClick={() => addAlternativa(o, s)}
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 5, border: 'none', cursor: ya ? 'default' : 'pointer', fontFamily: 'inherit', background: ya ? '#dcfce7' : 'var(--accent)', color: ya ? '#166534' : '#fff', opacity: adding === o.id ? 0.6 : 1 }}>
            {ya ? <><Check size={12} /> Añadida</> : adding === o.id ? 'Añadiendo…' : <><Plus size={12} /> Alternativa</>}
          </button>
        </div>
      </div>
    )
  }

  const Grupo = ({ k, titulo }) => {
    const items = grupos[k]
    const b = BADGE[k]
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: b.col, background: b.bg, border: `1px solid ${b.bd}`, borderRadius: 10, padding: '2px 10px' }}>{titulo}</span>
          <span style={{ fontSize: 11, color: 'var(--text4)' }}>{items.length}</span>
        </div>
        {items.length === 0
          ? <div style={{ fontSize: 11, color: 'var(--text4)', fontStyle: 'italic', padding: '2px 2px 6px' }}>Sin ofertas en este grupo.</div>
          : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{items.map(({ o, s }) => <Card key={o.id} o={o} s={s} />)}</div>}
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 10, width: 'min(900px,100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Matching con el pool de ofertas</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              {req.uso_principal || 'Uso —'}
              {(supMin || supMax) ? ` · ${supMin.toLocaleString('es-ES')}–${supMax.toLocaleString('es-ES')} m²` : ''}
              {tienePresupuesto && (alqMin || alqMax) ? ` · ${alqMin || '—'}–${alqMax || '—'} €/m²/mes` : ''}
              {zonaTokens.length ? ` · ${zonaTokens.slice(0, 3).join(', ')}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex' }}><X size={16} /></button>
        </div>

        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', pointerEvents: 'none' }} />
            <input
              placeholder="Buscar oferta, activo, zona… (añade cualquiera saltándote los filtros)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 32px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 18px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text4)' }}>Cruzando con el pool de ofertas…</div>
          ) : ranked.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text4)' }}>No hay ofertas activas en el pool.</div>
          ) : (
            <>
              <Grupo k="cumple"    titulo="Cumple requisitos" />
              <Grupo k="flexible"  titulo="Flexible" />
              <Grupo k="razonable" titulo="Alternativas razonables" />
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'var(--gray-lt)' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
