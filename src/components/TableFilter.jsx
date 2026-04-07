import { useState, useRef, useEffect, useMemo } from 'react'

// ── Hook: manages column sorts + filters ───────────────────────────────────
export function useTableFilter(rows, cols) {
  const [sorts,   setSorts]   = useState([])  // [{id, dir}]
  const [filters, setFilters] = useState({})  // {colId: {mode,value} | {values:Set}}

  const setSort = (colId, dir) => setSorts(prev => {
    const rest = prev.filter(s => s.id !== colId)
    return dir ? [{ id: colId, dir }, ...rest] : rest
  })

  const setFilter = (colId, f) => setFilters(prev => ({ ...prev, [colId]: f }))

  const clearFilter = colId => {
    setFilters(prev => { const n = { ...prev }; delete n[colId]; return n })
    setSorts(prev => prev.filter(s => s.id !== colId))
  }

  const clearAll = () => { setSorts([]); setFilters({}) }

  const activeCount = useMemo(() => {
    const fc = Object.keys(filters).filter(k => {
      const f = filters[k]; if (!f) return false
      return f.values ? f.values.size > 0 : !!f.value
    }).length
    return fc + sorts.length
  }, [filters, sorts])

  const result = useMemo(() => {
    let data = [...rows]

    // Apply column filters
    cols.forEach(col => {
      const f = filters[col.id]
      if (!f || !col.getValue) return
      if (f.values !== undefined) {
        if (f.values.size === 0) return
        data = data.filter(row => f.values.has(String(col.getValue(row) ?? '')))
      } else if (f.value) {
        const fv = f.value.toLowerCase()
        data = data.filter(row => {
          const v = String(col.getValue(row) ?? '').toLowerCase()
          if (f.mode === 'startsWith')  return v.startsWith(fv)
          if (f.mode === 'equals')      return v === fv
          if (f.mode === 'notContains') return !v.includes(fv)
          return v.includes(fv) // contains (default)
        })
      }
    })

    // Apply sorts
    if (sorts.length > 0) {
      data.sort((a, b) => {
        for (const { id, dir } of sorts) {
          const col = cols.find(c => c.id === id)
          if (!col?.getValue) continue
          const av = col.getValue(a)
          const bv = col.getValue(b)
          const cmp = typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av ?? '').localeCompare(String(bv ?? ''), 'es', { numeric: true })
          if (cmp !== 0) return dir === 'asc' ? cmp : -cmp
        }
        return 0
      })
    }

    return data
  }, [rows, filters, sorts, cols])

  return { result, sorts, filters, setSort, setFilter, clearFilter, clearAll, activeCount }
}

// ── ColHeader: Excel-style column filter header ────────────────────────────
export function ColHeader({ col, sorts, filters, setSort, setFilter, clearFilter, allRows }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const sort     = sorts.find(s => s.id === col.id)
  const filter   = filters[col.id]
  const hasFilter = filter && (filter.value || (filter.values && filter.values.size > 0))
  const isActive = sort || hasFilter

  const [textMode, setTextMode] = useState('contains')
  const [textVal,  setTextVal]  = useState('')

  // Sync text input when filter is cleared externally
  useEffect(() => {
    if (!filter) { setTextVal(''); setTextMode('contains') }
  }, [filter])

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Unique values for enum columns (computed from all rows, not filtered)
  const uniqueVals = useMemo(() => {
    if (!col.getValue || col.type !== 'enum') return []
    return [...new Set((allRows || []).map(r => String(col.getValue(r) ?? '')).filter(Boolean))].sort()
  }, [allRows, col])

  const selectedVals = filter?.values ?? null
  const allSelected  = !selectedVals || selectedVals.size === 0

  const toggleEnumVal = val => {
    // Start from "all selected" if no filter set
    const cur = allSelected ? new Set(uniqueVals) : new Set(selectedVals)
    const next = new Set(cur)
    next.has(val) ? next.delete(val) : next.add(val)
    if (next.size === uniqueVals.length) setFilter(col.id, { values: new Set() }) // all = no filter
    else setFilter(col.id, { values: next })
  }

  const applyText = (val, mode = textMode) => {
    setTextVal(val)
    if (val) setFilter(col.id, { mode, value: val })
    else clearFilter(col.id)
  }

  const doSort = dir => { setSort(col.id, sort?.dir === dir ? null : dir); setOpen(false) }
  const doClear = () => { clearFilter(col.id); setTextVal(''); setOpen(false) }

  if (!col.getValue) {
    return <th>{col.label}</th>
  }

  return (
    <th style={{ position: 'relative', userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={() => setOpen(v => !v)}>
        <span style={{ color: isActive ? 'var(--accent)' : undefined, fontWeight: isActive ? 700 : undefined }}>
          {col.label}
        </span>
        <span style={{ fontSize: 9, color: isActive ? 'var(--accent)' : 'var(--text4)', marginLeft: 1, lineHeight: 1 }}>
          {sort?.dir === 'asc' ? '↑' : sort?.dir === 'desc' ? '↓' : hasFilter ? '●' : '▾'}
        </span>
      </div>

      {open && (
        <div
          ref={ref}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 'calc(100% + 2px)', left: 0, zIndex: 500,
            background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,.15)', minWidth: 210, padding: '8px 0',
            fontWeight: 400,
          }}
        >
          {/* Sort */}
          <div style={{ padding: '0 10px 8px', borderBottom: '1px solid var(--gray-lt)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>Ordenar</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {[['asc', '↑ A → Z'], ['desc', '↓ Z → A']].map(([dir, label]) => (
                <button key={dir} onClick={() => doSort(dir)} style={{
                  flex: 1, padding: '4px 0', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${sort?.dir === dir ? 'var(--accent)' : 'var(--border)'}`,
                  background: sort?.dir === dir ? 'var(--accent-lt)' : '#fff',
                  color: sort?.dir === dir ? 'var(--accent)' : 'var(--text2)',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div style={{ padding: '8px 10px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Filtrar</div>

            {col.type === 'enum' ? (
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 2px', cursor: 'pointer', fontSize: 11 }}>
                  <input type="checkbox" checked={allSelected} onChange={() => setFilter(col.id, { values: new Set() })} style={{ accentColor: 'var(--accent)' }} />
                  <em style={{ color: 'var(--text3)' }}>(Todos)</em>
                </label>
                {uniqueVals.map(v => (
                  <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 2px', cursor: 'pointer', fontSize: 11 }}>
                    <input type="checkbox" checked={allSelected || selectedVals.has(v)} onChange={() => toggleEnumVal(v)} style={{ accentColor: 'var(--accent)' }} />
                    {v}
                  </label>
                ))}
              </div>
            ) : (
              <>
                <select
                  value={textMode}
                  onChange={e => { setTextMode(e.target.value); if (textVal) applyText(textVal, e.target.value) }}
                  style={{ width: '100%', marginBottom: 5, fontSize: 11, border: '1px solid var(--border)', borderRadius: 4, padding: '4px 6px', fontFamily: 'inherit', background: '#fff', outline: 'none' }}
                >
                  <option value="contains">Contiene</option>
                  <option value="startsWith">Empieza por</option>
                  <option value="equals">Es igual a</option>
                  <option value="notContains">No contiene</option>
                </select>
                <input
                  value={textVal}
                  onChange={e => applyText(e.target.value)}
                  placeholder="Escribir valor..."
                  autoFocus
                  style={{ width: '100%', fontSize: 11, border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </>
            )}
          </div>

          {(hasFilter || sort) && (
            <div style={{ padding: '4px 10px 0', borderTop: '1px solid var(--gray-lt)' }}>
              <button onClick={doClear} style={{ fontSize: 10, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>
                ✕ Limpiar
              </button>
            </div>
          )}
        </div>
      )}
    </th>
  )
}

// Active filter indicator badge for toolbar
export function FilterBadge({ count, onClear }) {
  if (!count) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', borderRadius: 6, fontSize: 11, color: 'var(--accent)', fontWeight: 600, height: 28 }}>
      <span>⚡ {count} filtro{count !== 1 ? 's' : ''} activo{count !== 1 ? 's' : ''}</span>
      <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, padding: 0, lineHeight: 1, fontFamily: 'inherit' }}>✕</button>
    </div>
  )
}
