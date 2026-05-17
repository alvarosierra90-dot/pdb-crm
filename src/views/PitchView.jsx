const PITCH_URL = 'https://pitch-taupe-sigma.vercel.app/?embed=1'

export default function PitchView() {
  return (
    <div style={{flex:1,display:'flex',background:'var(--bg)',overflow:'hidden'}}>
      <iframe
        src={PITCH_URL}
        title="Pitch Generator"
        style={{flex:1,border:0,width:'100%',height:'100%',background:'#fff'}}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
