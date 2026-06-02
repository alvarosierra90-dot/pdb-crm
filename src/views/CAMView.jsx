const CAM_URL = 'https://cam-cuentas-key.vercel.app/?embed=1'

export default function CAMView() {
  return (
    <div style={{flex:1,display:'flex',background:'var(--bg)',overflow:'hidden'}}>
      <iframe
        src={CAM_URL}
        title="CAM"
        style={{flex:1,border:0,width:'100%',height:'100%',background:'#fff'}}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
