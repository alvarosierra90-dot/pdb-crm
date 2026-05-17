import { useNav } from '../context/NavigationContext'

const PITCH_BASE = 'https://pitch-taupe-sigma.vercel.app/'

// Construye la URL del iframe inyectando como query params el contexto que viene
// por la navegación interna (NavigationContext.params). Pitch debe leer estos
// params con URLSearchParams y precargar los typeaheads correspondientes.
function buildPitchUrl(params) {
  const url = new URL(PITCH_BASE)
  url.searchParams.set('embed', '1')
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue
      url.searchParams.set(k, Array.isArray(v) ? v.join(',') : String(v))
    }
  }
  return url.toString()
}

export default function PitchView() {
  const { params } = useNav()
  const src = buildPitchUrl(params)
  return (
    <div style={{flex:1,display:'flex',background:'var(--bg)',overflow:'hidden'}}>
      <iframe
        key={src}
        src={src}
        title="Pitch Generator"
        style={{flex:1,border:0,width:'100%',height:'100%',background:'#fff'}}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
