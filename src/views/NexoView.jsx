const NEXO_URL = 'https://nexo-omega-nine.vercel.app/?embed=1'

export default function NexoView() {
  return (
    <div style={{flex:1,display:'flex',background:'var(--bg)',overflow:'hidden'}}>
      <iframe
        src={NEXO_URL}
        title="NEXO"
        style={{flex:1,border:0,width:'100%',height:'100%',background:'#fff'}}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
