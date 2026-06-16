// Hotel Asset Manager — app standalone embebida (Administración).
// Sirve public/hoteles.html vía iframe, mismo patrón que NEXO/Pitch.
const HOTELES_URL = `${import.meta.env.BASE_URL}hoteles.html`

export default function HotelesView() {
  return (
    <div style={{flex:1,display:'flex',background:'var(--bg)',overflow:'hidden'}}>
      <iframe
        src={HOTELES_URL}
        title="Hoteles · Hotel Asset Manager"
        style={{flex:1,border:0,width:'100%',height:'100%',background:'#fff'}}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
