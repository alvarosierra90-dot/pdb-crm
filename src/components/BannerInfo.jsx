// Banner reutilizable para listas (head). Tres variantes:
//   - dynamics: lectura desde Microsoft Dynamics 365 (azul)
//   - info:     informativo / origen de funnel / explicativo (amarillo)
//   - warning:  advertencia (ámbar oscuro)
// Mantener idéntico en todos los módulos para coherencia visual.

const VARIANTS = {
  dynamics: {
    bg:'#faf5ec', border:'#ece0c9',
    iconBg:'#B08D57', iconChar:'D',
    titleColor:'#5a4828', subColor:'#B08D57',
  },
  info: {
    bg:'#fef3c7', border:'#fde68a',
    iconBg:'#ea580c', iconChar:'i',
    titleColor:'#7c2d12', subColor:'#9a3412',
  },
  warning: {
    bg:'#fee2e2', border:'#fca5a5',
    iconBg:'#dc2626', iconChar:'!',
    titleColor:'#991b1b', subColor:'#b91c1c',
  },
}

export default function BannerInfo({ variant = 'info', title, hint, action }) {
  const v = VARIANTS[variant] || VARIANTS.info
  return (
    <div style={{ padding:'7px 16px', background:v.bg, borderBottom:`1px solid ${v.border}`, display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
      <div style={{ width:18, height:18, borderRadius:3, background:v.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ color:'#fff', fontWeight:800, fontSize:10 }}>{v.iconChar}</span>
      </div>
      <span style={{ fontSize:11, color:v.titleColor, fontWeight:600 }}>{title}</span>
      {hint && <span style={{ fontSize:10, color:v.subColor, marginLeft:'auto' }}>{hint}</span>}
      {action && <div style={{ marginLeft: hint ? 8 : 'auto' }}>{action}</div>}
    </div>
  )
}
