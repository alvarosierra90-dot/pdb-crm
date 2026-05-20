import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

/**
 * Histórico del edificio · Gantt timeline + tabla filtrable + export PDF/Excel.
 *
 * Vive en la pestaña Información general de FichaActivo. Carga todos los
 * arrendatarios y propietarios ligados a este activo (vigentes + con
 * motivo_salida) y los visualiza como barras horizontales por entidad.
 *
 * Props:
 *   activoRef:     ref del activo
 *   activoNombre:  para el export
 */

const ARR_PALETTE  = ['#5a4828','#0f766e','#6b5b8e','#b45309','#be185d','#065f46','#7c3aed','#c2410c','#0e7490']
const PROP_PALETTE = ['#1d4ed8','#15803d','#a16207','#9d174d','#0e7490','#6d28d9','#b45309','#065f46']

const QUARTER_MONTH = { Q1: 1, Q2: 4, Q3: 7, Q4: 10 }

function yearFrac(year, quarter) {
  if (!year) return null
  const q = QUARTER_MONTH[quarter] || 1
  return Number(year) + (q - 1) / 12
}
function isoToYearFrac(iso) {
  if (!iso) return null
  const [y, m] = String(iso).split('-').map(Number)
  if (!y) return null
  return y + ((m || 1) - 1) / 12
}
function isoToDisplay(iso) {
  if (!iso) return '—'
  const [y, m, d] = String(iso).split('-')
  if (!y) return iso
  return `${d || '01'}/${m || '01'}/${y}`
}
const trimestreLabel = (q) => q || '—'

export default function HistoricoEdificio({ activoRef, activoNombre = '' }) {
  const [tab, setTab]       = useState('inquilinos')  // 'inquilinos' | 'propietarios'
  const [arrs, setArrs]     = useState([])
  const [props, setProps]   = useState([])
  const [loading, setLoading] = useState(true)
  const [yearFrom, setYearFrom] = useState(null)
  const [yearTo,   setYearTo]   = useState(null)
  const [search, setSearch]     = useState('')
  const printRef = useRef(null)

  useEffect(() => {
    if (!activoRef) return
    let cancel = false
    setLoading(true)
    Promise.all([
      supabase.from('arrendatarios').select('*').eq('activo_ref', activoRef).order('created_at', { ascending: true }),
      supabase.from('propietarios').select('*').eq('activo_ref', activoRef).order('created_at', { ascending: true }),
    ]).then(([arrRes, propRes]) => {
      if (cancel) return
      setArrs(arrRes.data || [])
      setProps(propRes.data || [])
      setLoading(false)
    })
    return () => { cancel = true }
  }, [activoRef])

  // Normaliza filas a un shape común para Gantt + tabla
  const inquilinos = useMemo(() => arrs.map((a, i) => {
    const start = a.inicio ? isoToYearFrac(a.inicio) : yearFrac(a.anyo_firma, a.trimestre)
    const end   = a.fecha_salida ? isoToYearFrac(a.fecha_salida) : null
    const estado = a.motivo_salida === 'Baja' ? 'Baja'
                 : a.motivo_salida === 'Fin de contrato' ? 'Traslado'
                 : 'Vigente'
    return {
      _id:       a.id,
      ref:       a.ref,
      nombre:    a.tenant || a.nombre || '—',
      sup:       a.superficie || 0,
      entrada:   a.inicio || (a.anyo_firma ? `${a.anyo_firma}-${String(QUARTER_MONTH[a.trimestre]||1).padStart(2,'0')}-01` : null),
      entradaYF: start,
      salida:    a.fecha_salida,
      salidaYF:  end,
      anyo_firma: a.anyo_firma,
      trimestre: a.trimestre,
      estado,
      motivo:    a.motivo_salida || null,
      destinoRef: a.destino_activo_ref || null,
      color:     ARR_PALETTE[i % ARR_PALETTE.length],
    }
  }), [arrs])

  const propietariosNorm = useMemo(() => props.map((p, i) => {
    const start = yearFrac(p.anyo_compra, p.trimestre)
    const end   = p.fecha_salida ? isoToYearFrac(p.fecha_salida) : null
    const estado = p.motivo_salida === 'Baja' ? 'Baja' : 'Vigente'
    return {
      _id:       p.id,
      ref:       p.ref,
      nombre:    p.propietario || p.nombre || '—',
      sup:       p.superficie || 0,
      entrada:   p.anyo_compra ? `${p.anyo_compra}-${String(QUARTER_MONTH[p.trimestre]||1).padStart(2,'0')}-01` : null,
      entradaYF: start,
      salida:    p.fecha_salida,
      salidaYF:  end,
      anyo_compra: p.anyo_compra,
      trimestre: p.trimestre,
      precio_compra: p.precio_compra,
      estado,
      motivo:    p.motivo_salida || null,
      color:     PROP_PALETTE[i % PROP_PALETTE.length],
    }
  }), [props])

  const rows = tab === 'inquilinos' ? inquilinos : propietariosNorm

  // Año min/max a partir de TODAS las filas (no filtradas) para el Gantt
  const allYears = useMemo(() => {
    const arr = []
    for (const r of rows) {
      if (r.entradaYF != null) arr.push(Math.floor(r.entradaYF))
      if (r.salidaYF  != null) arr.push(Math.ceil(r.salidaYF))
    }
    return arr
  }, [rows])

  const yearMin = useMemo(() => allYears.length ? Math.min(...allYears) : new Date().getFullYear() - 5, [allYears])
  const yearMax = useMemo(() => {
    const cur = new Date().getFullYear()
    return allYears.length ? Math.max(...allYears, cur) : cur
  }, [allYears])

  // Filtrado por año + búsqueda
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (search && !r.nombre.toLowerCase().includes(search.toLowerCase())) return false
      const startY = r.entradaYF != null ? Math.floor(r.entradaYF) : null
      const endY   = r.salidaYF  != null ? Math.ceil(r.salidaYF)   : yearMax
      if (yearFrom && endY != null && endY < yearFrom) return false
      if (yearTo   && startY != null && startY > yearTo) return false
      return true
    })
  }, [rows, search, yearFrom, yearTo, yearMax])

  // Total acumulado (suma de m² · período ocupado por cada inquilino)
  const totalSup     = filtered.reduce((s, r) => s + (r.sup || 0), 0)
  const totalVigente = filtered.filter(r => r.estado === 'Vigente').length

  const years = useMemo(() => {
    const out = []
    for (let y = yearMin; y <= yearMax; y++) out.push(y)
    return out
  }, [yearMin, yearMax])

  // Posición de una barra en %
  const pos = (yf) => {
    const range = yearMax - yearMin + 1
    if (range <= 0) return 0
    return Math.max(0, Math.min(100, ((yf - yearMin) / range) * 100))
  }

  // ── EXPORT ──
  const exportPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const node = printRef.current
      if (!node) return
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const iw = pw - 40
      const ih = (canvas.height * iw) / canvas.width
      pdf.setFontSize(14)
      pdf.text(`Histórico del edificio · ${activoNombre || activoRef}`, 20, 26)
      pdf.addImage(img, 'PNG', 20, 40, iw, Math.min(ih, ph - 60))
      pdf.save(`historico_${activoRef}_${tab}.pdf`)
    } catch (e) {
      console.error('Error exportando PDF:', e)
      alert('No se pudo exportar el PDF: ' + (e.message || e))
    }
  }

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      const sheetRows = filtered.map(r => ({
        Nombre:       r.nombre,
        Ref:          r.ref || '',
        ...(tab === 'inquilinos'
          ? { 'Año firma': r.anyo_firma || '', 'Trimestre': r.trimestre || '' }
          : { 'Año compra': r.anyo_compra || '', 'Trimestre': r.trimestre || '', 'Precio compra': r.precio_compra || '' }),
        'Sup. (m²)':  r.sup || 0,
        'Entrada':    isoToDisplay(r.entrada),
        'Salida':     r.salida ? isoToDisplay(r.salida) : '—',
        'Estado':     r.estado,
        'Motivo':     r.motivo || '',
      }))
      const ws = XLSX.utils.json_to_sheet(sheetRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, tab === 'inquilinos' ? 'Inquilinos' : 'Propietarios')
      XLSX.writeFile(wb, `historico_${activoRef}_${tab}.xlsx`)
    } catch (e) {
      console.error('Error exportando Excel:', e)
      alert('No se pudo exportar el Excel: ' + (e.message || e))
    }
  }

  return (
    <div className="va-card">
      <div className="va-card-header">
        <h3><span className="ico" style={{color:'var(--pdb-blue)'}}>⏱</span> Histórico del edificio</h3>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <button className="ab-btn" onClick={exportExcel} title="Exportar tabla a Excel"><FileSpreadsheet size={13} strokeWidth={1.75}/> Excel</button>
          <button className="ab-btn" onClick={exportPDF}   title="Exportar pantalla a PDF"><FileText size={13} strokeWidth={1.75}/> PDF</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,padding:'4px 18px 0',borderBottom:'1px solid var(--border)'}}>
        {[
          { v:'inquilinos',    label:`Inquilinos (${inquilinos.length})`,         color:'var(--accent)' },
          { v:'propietarios',  label:`Propietarios (${propietariosNorm.length})`, color:'var(--pdb-blue)' },
        ].map(t => {
          const active = tab === t.v
          return (
            <button key={t.v} onClick={()=>setTab(t.v)}
              style={{padding:'7px 14px',fontSize:12,fontWeight:active?700:500,background:'none',border:'none',
                borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent',
                color: active ? t.color : 'var(--text3)', cursor:'pointer',fontFamily:'inherit',marginBottom:-1}}>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Filtros */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 18px',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)',flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>Año</span>
          <select value={yearFrom||''} onChange={e=>setYearFrom(e.target.value?Number(e.target.value):null)}
            style={{padding:'4px 8px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit'}}>
            <option value="">Desde</option>
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{fontSize:11,color:'var(--text4)'}}>—</span>
          <select value={yearTo||''} onChange={e=>setYearTo(e.target.value?Number(e.target.value):null)}
            style={{padding:'4px 8px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit'}}>
            <option value="">Hasta</option>
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <input placeholder="Buscar por nombre…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{padding:'4px 10px',fontSize:11,border:'1px solid var(--border)',borderRadius:5,fontFamily:'inherit',flex:1,maxWidth:240}}/>
        {(yearFrom || yearTo || search) && (
          <button onClick={()=>{ setYearFrom(null); setYearTo(null); setSearch('') }}
            style={{padding:'4px 10px',fontSize:10,background:'none',border:'1px solid var(--border)',borderRadius:5,color:'var(--red)',cursor:'pointer',fontFamily:'inherit'}}>
            ✕ Limpiar filtros
          </button>
        )}
        <div style={{marginLeft:'auto',display:'flex',gap:14,fontSize:11,color:'var(--text3)'}}>
          <span><strong style={{color:'var(--text)'}}>{filtered.length}</strong> {tab === 'inquilinos' ? 'inquilinos' : 'propietarios'}</span>
          <span><strong style={{color:'var(--green)'}}>{totalVigente}</strong> vigentes</span>
          {totalSup > 0 && <span><strong style={{color:'var(--text)'}}>{totalSup.toLocaleString('es-ES')}</strong> m² acum.</span>}
        </div>
      </div>

      {/* Contenido — referenciado para PDF */}
      <div ref={printRef} style={{padding:'16px 18px',background:'#fff'}}>
        {loading ? (
          <div style={{padding:40,textAlign:'center',color:'var(--text4)',fontSize:13}}>Cargando histórico…</div>
        ) : filtered.length === 0 ? (
          <div style={{padding:40,textAlign:'center',color:'var(--text4)',fontSize:13}}>
            Sin {tab === 'inquilinos' ? 'inquilinos' : 'propietarios'} en el histórico de este edificio.
          </div>
        ) : (
          <>
            {/* ── GANTT ── */}
            <div style={{border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden',marginBottom:18}}>
              {/* Eje X de años */}
              <div style={{display:'grid',gridTemplateColumns:'180px 1fr',background:'var(--gray-lt)',borderBottom:'1px solid var(--border)'}}>
                <div style={{padding:'6px 12px',fontSize:10,fontWeight:700,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'.04em'}}>{tab === 'inquilinos' ? 'Inquilino' : 'Propietario'}</div>
                <div style={{position:'relative',height:24,padding:'0 8px'}}>
                  {years.map((y, i) => (
                    <span key={y} style={{
                      position:'absolute',
                      left:`${(i / (years.length)) * 100}%`,
                      top:'50%',
                      transform:'translateY(-50%)',
                      fontSize:10,
                      color:'var(--text4)',
                      fontFamily:'var(--mono)',
                      fontWeight:600,
                    }}>{y}</span>
                  ))}
                </div>
              </div>
              {/* Filas */}
              {filtered.map(r => {
                const startYF = r.entradaYF != null ? r.entradaYF : yearMin
                const endYF   = r.salidaYF  != null ? r.salidaYF   : (yearMax + 1)
                const left    = pos(startYF)
                const width   = Math.max(2, pos(endYF) - pos(startYF))
                const isOngoing = r.estado === 'Vigente'
                return (
                  <div key={r._id} style={{display:'grid',gridTemplateColumns:'180px 1fr',borderTop:'1px solid var(--line-2)',background:'#fff'}}>
                    <div style={{padding:'8px 12px',fontSize:11,fontWeight:600,color:'var(--text)',display:'flex',alignItems:'center',gap:6,overflow:'hidden'}}>
                      <span style={{width:10,height:10,borderRadius:3,background:r.color,flexShrink:0}}/>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.nombre}</span>
                    </div>
                    <div style={{position:'relative',height:28,padding:'0 8px'}}>
                      <div style={{
                        position:'absolute',
                        top:6,
                        bottom:6,
                        left:`${left}%`,
                        width:`${width}%`,
                        background:r.color,
                        borderRadius:4,
                        opacity:isOngoing ? 1 : 0.55,
                        boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
                        display:'flex',alignItems:'center',justifyContent:'flex-start',paddingLeft:6,
                        fontSize:9,fontWeight:700,color:'#fff',
                        overflow:'hidden',whiteSpace:'nowrap',
                      }}
                      title={`${r.nombre} · ${isoToDisplay(r.entrada)} → ${r.salida ? isoToDisplay(r.salida) : 'Activo'} · ${r.sup ? r.sup.toLocaleString('es-ES')+' m²' : ''}`}>
                        {width > 6 && (r.sup ? r.sup.toLocaleString('es-ES') + ' m²' : r.estado)}
                      </div>
                      {/* Marker de salida cuando hay motivo */}
                      {r.motivo && (
                        <span style={{
                          position:'absolute',
                          left:`${pos(endYF)}%`,
                          top:'50%',
                          transform:'translate(-50%, -50%)',
                          fontSize:10,
                          background:r.motivo === 'Baja' ? '#9ca3af' : 'var(--accent)',
                          color:'#fff',
                          borderRadius:9,
                          padding:'1px 6px',
                          fontWeight:700,
                          fontFamily:'var(--mono)',
                        }} title={r.motivo}>
                          {r.motivo === 'Baja' ? 'B' : 'T'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── TABLA ── */}
            <div style={{border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                <thead>
                  <tr style={{background:'var(--gray-lt)'}}>
                    {(tab === 'inquilinos'
                      ? ['Inquilino','Sup m²','Año firma','Trim.','Entrada','Salida','Estado']
                      : ['Propietario','Sup m²','Año compra','Trim.','Precio compra','Salida','Estado']
                    ).map(h => (
                      <th key={h} style={{padding:'7px 12px',fontSize:9,fontWeight:700,color:'var(--text4)',textAlign:'left',borderBottom:'1px solid var(--border)',textTransform:'uppercase',letterSpacing:'.04em'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r._id} style={{borderBottom:'1px solid var(--line-2)'}}>
                      <td style={{padding:'8px 12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{width:8,height:8,borderRadius:2,background:r.color,flexShrink:0}}/>
                          <span style={{fontWeight:600}}>{r.nombre}</span>
                        </div>
                        {r.ref && <div style={{fontSize:9,color:'var(--text4)',fontFamily:'var(--mono)',marginLeft:14}}>{r.ref}</div>}
                      </td>
                      <td style={{padding:'8px 12px',fontFamily:'var(--mono)',fontWeight:600}}>{r.sup ? r.sup.toLocaleString('es-ES') : '—'}</td>
                      <td style={{padding:'8px 12px',fontFamily:'var(--mono)'}}>{tab==='inquilinos' ? (r.anyo_firma || '—') : (r.anyo_compra || '—')}</td>
                      <td style={{padding:'8px 12px'}}><span className="tag tag-gray" style={{fontSize:9}}>{trimestreLabel(r.trimestre)}</span></td>
                      {tab === 'inquilinos' ? (
                        <td style={{padding:'8px 12px',color:'var(--text3)'}}>{isoToDisplay(r.entrada)}</td>
                      ) : (
                        <td style={{padding:'8px 12px',fontFamily:'var(--mono)',fontWeight:600}}>{r.precio_compra || '—'}</td>
                      )}
                      <td style={{padding:'8px 12px',color:'var(--text3)'}}>
                        {r.salida ? isoToDisplay(r.salida) : <span style={{color:'var(--green)',fontWeight:600}}>Activo</span>}
                      </td>
                      <td style={{padding:'8px 12px'}}>
                        <span className={`tag ${
                          r.estado === 'Vigente'  ? 'tag-green' :
                          r.estado === 'Baja'     ? 'tag-gray'  :
                          r.estado === 'Traslado' ? 'tag-blue'  : 'tag-gray'
                        }`}>{r.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
