import { useEffect, useMemo, useRef, useState } from 'react'

// Mapa de Google reutilizable. Recibe una lista de activos con
// `coordenadas` ("lat, lng" como string), `uso`, `nombre`, `ref` y
// `ciudad`. Pinta una chincheta por activo coloreada por uso y un
// filtro de chips encima. Click en chincheta → onMarkerClick(activo).

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Misma carga global que MapasView para evitar duplicar el script.
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) { resolve(); return }
    const existing = document.getElementById('gm-script')
    if (existing) { existing.addEventListener('load', resolve); existing.addEventListener('error', reject); return }
    const s = document.createElement('script')
    s.id = 'gm-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
    s.async = true; s.defer = true
    s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

const MAP_STYLE = [
  { featureType:'water',          elementType:'geometry',           stylers:[{color:'#c9e2f4'}] },
  { featureType:'landscape',      elementType:'geometry',           stylers:[{color:'#f2f0eb'}] },
  { featureType:'road',           elementType:'geometry',           stylers:[{color:'#ffffff'}] },
  { featureType:'road.highway',   elementType:'geometry',           stylers:[{color:'#ffe680'}] },
  { featureType:'poi',            elementType:'all',                stylers:[{visibility:'off'}] },
  { featureType:'transit',        elementType:'all',                stylers:[{visibility:'off'}] },
  { featureType:'administrative', elementType:'labels.text.fill',   stylers:[{color:'#999999'}] },
]

// Paleta deterministic — mismo uso = mismo color siempre.
const USO_PALETTE = [
  '#B08D57', // azul — Oficinas
  '#16a34a', // verde — Logístico/Industrial
  '#ec4899', // rosa — Retail
  '#8b5cf6', // morado — Residencial / Living
  '#f59e0b', // ámbar — Hoteles
  '#ef4444', // rojo — Suelos
  '#0891b2', // teal — Centros comerciales
  '#9333ea', // morado oscuro — Mixto
  '#65a30d', // verde lima — Alternativos
  '#94a3b8', // gris — Sin uso
]

function colorForUso(uso, allUsos) {
  if (!uso) return USO_PALETTE[USO_PALETTE.length - 1]
  const idx = allUsos.indexOf(uso)
  return USO_PALETTE[idx % USO_PALETTE.length]
}

function pinSvg(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">` +
    `<path d="M14 1 C7 1 2 6 2 13 c0 9 12 23 12 23 s12-14 12-23 C26 6 21 1 14 1 z" fill="${color}" stroke="white" stroke-width="2"/>` +
    `<circle cx="14" cy="13" r="4.5" fill="white"/>` +
    `</svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

function parseCoords(s) {
  if (!s || typeof s !== 'string') return null
  const parts = s.split(',').map(p => parseFloat(p.trim()))
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
  return { lat: parts[0], lng: parts[1] }
}

export default function PortfolioMap({ activos = [], height = 420, onMarkerClick }) {
  const mapDiv = useRef(null)
  const mapObj = useRef(null)
  const markers = useRef({})
  const infoWin = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [mapErr, setMapErr] = useState(false)
  const [filtroUso, setFiltroUso] = useState('Todo')

  // Activos con coordenadas válidas + usos únicos (orden determinista)
  const { puntos, usos } = useMemo(() => {
    const pts = activos
      .map(a => ({ ...a, _coords: parseCoords(a.coordenadas) }))
      .filter(a => a._coords)
    const usosSet = Array.from(new Set(pts.map(a => a.uso || 'Sin uso'))).sort()
    return { puntos: pts, usos: usosSet }
  }, [activos])

  const puntosFiltrados = filtroUso === 'Todo'
    ? puntos
    : puntos.filter(a => (a.uso || 'Sin uso') === filtroUso)

  // Inicializar mapa una vez
  useEffect(() => {
    if (!MAPS_KEY) { setMapErr(true); return }
    if (loaded) return
    loadGoogleMaps(MAPS_KEY)
      .then(() => {
        if (!mapDiv.current) return
        mapObj.current = new window.google.maps.Map(mapDiv.current, {
          center: { lat: 40.4168, lng: -3.7038 },
          zoom: 6,
          styles: MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        infoWin.current = new window.google.maps.InfoWindow()
        setLoaded(true)
      })
      .catch(() => setMapErr(true))
  }, [loaded])

  // Refresh markers cuando cambian puntos / filtro
  useEffect(() => {
    if (!loaded || !mapObj.current) return

    // Quitar markers que ya no aplican
    const idsActivos = new Set(puntosFiltrados.map(p => p.id))
    Object.entries(markers.current).forEach(([id, m]) => {
      if (!idsActivos.has(id)) { m.setMap(null); delete markers.current[id] }
    })

    // Crear / actualizar
    puntosFiltrados.forEach(a => {
      const color = colorForUso(a.uso || 'Sin uso', usos)
      const icon = {
        url: pinSvg(color),
        scaledSize: new window.google.maps.Size(28, 38),
        anchor: new window.google.maps.Point(14, 36),
      }
      if (markers.current[a.id]) {
        markers.current[a.id].setIcon(icon)
        markers.current[a.id].setPosition(a._coords)
      } else {
        const m = new window.google.maps.Marker({
          position: a._coords,
          map: mapObj.current,
          icon,
          title: a.nombre || a.ref,
          optimized: false,
        })
        m.addListener('click', () => {
          const html = `
            <div style="font-family:inherit;min-width:180px;padding:2px">
              <div style="font-size:12px;font-weight:700;color:#6f5734;margin-bottom:2px">${(a.nombre || a.ref || '—').replace(/</g,'&lt;')}</div>
              <div style="font-size:10px;color:#64748b;margin-bottom:4px">${(a.ciudad || '').replace(/</g,'&lt;')}${a.zona ? ' · ' + String(a.zona).replace(/</g,'&lt;') : ''}</div>
              <div style="display:inline-block;font-size:9px;font-weight:700;background:${color};color:white;padding:2px 8px;border-radius:8px;margin-bottom:4px">${(a.uso || 'Sin uso').replace(/</g,'&lt;')}</div>
              <div style="font-size:10px;color:#475569;font-family:ui-monospace,monospace">${(a.ref || '').replace(/</g,'&lt;')}</div>
            </div>`
          infoWin.current.setContent(html)
          infoWin.current.open({ anchor: m, map: mapObj.current })
          if (typeof onMarkerClick === 'function') onMarkerClick(a)
        })
        markers.current[a.id] = m
      }
    })

    // Auto-fit a los puntos visibles
    if (puntosFiltrados.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      puntosFiltrados.forEach(a => bounds.extend(a._coords))
      mapObj.current.fitBounds(bounds, 64)
      if (puntosFiltrados.length === 1) {
        // Un solo punto: zoom razonable, no infinito
        const listener = window.google.maps.event.addListenerOnce(mapObj.current, 'idle', () => {
          if (mapObj.current.getZoom() > 14) mapObj.current.setZoom(14)
        })
        // listener guard via removal on cleanup not needed (one-shot)
      }
    }
  }, [loaded, puntosFiltrados, usos, onMarkerClick])

  if (mapErr || !MAPS_KEY) {
    return (
      <div style={{ background:'#fef9c3', border:'1px solid #fde047', borderRadius:6, padding:14, fontSize:12, color:'#713f12' }}>
        ⚠ Mapa no disponible. {MAPS_KEY ? 'No se pudo cargar Google Maps.' : 'Falta configurar VITE_GOOGLE_MAPS_API_KEY en el entorno.'}
      </div>
    )
  }

  if (puntos.length === 0) {
    return (
      <div style={{ background:'var(--gray-lt)', border:'1px solid var(--border)', borderRadius:6, padding:32, textAlign:'center', color:'var(--text4)', fontSize:12 }}>
        🗺 Ningún activo del portfolio tiene coordenadas guardadas. Edita la ficha de un activo y añade su dirección/coordenadas para verlo en el mapa.
      </div>
    )
  }

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'hidden' }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ fontSize:11, fontWeight:700 }}>📍 Ubicaciones del portfolio</div>
        <span style={{ fontSize:10, color:'var(--text4)' }}>{puntosFiltrados.length} de {puntos.length} activos</span>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span
            onClick={() => setFiltroUso('Todo')}
            className={`fchip ${filtroUso === 'Todo' ? 'active' : ''}`}
            style={{ cursor:'pointer' }}
          >Todos</span>
          {usos.map(u => {
            const c = colorForUso(u, usos)
            const active = filtroUso === u
            return (
              <span
                key={u}
                onClick={() => setFiltroUso(active ? 'Todo' : u)}
                style={{
                  cursor:'pointer',
                  display:'inline-flex', alignItems:'center', gap:5,
                  fontSize:10, fontWeight:600,
                  padding:'3px 9px', borderRadius:11,
                  border: active ? `1.5px solid ${c}` : '1px solid var(--border)',
                  background: active ? c+'1a' : 'var(--surface)',
                  color: active ? c : 'var(--text2)',
                }}
                title={`Filtrar por ${u}`}
              >
                <span style={{ width:8, height:8, borderRadius:'50%', background:c, flexShrink:0 }} />
                {u}
              </span>
            )
          })}
        </div>
      </div>
      <div ref={mapDiv} style={{ height, width:'100%' }} />
    </div>
  )
}
