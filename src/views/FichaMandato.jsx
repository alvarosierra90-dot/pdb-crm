import { useNav } from '../context/NavigationContext'
import FichaMandatoSupabase from './FichaMandatoSupabase'

// Todos los mandatos viven en Supabase (migración 020). Esta vista es un
// wrapper que delega siempre en FichaMandatoSupabase con el ref recibido.
// Un mandato no se crea desde la nada: nace de Propuesta ganada, Demanda
// o Oferta. Si se llega aquí sin id, redirigimos al listado.
export default function FichaMandato() {
  const { params, navigate } = useNav()

  if (!params?.id) {
    return (
      <div style={{ padding:32, maxWidth:560 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Mandato no especificado</div>
        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55, marginBottom:16 }}>
          Los mandatos se firman desde su origen — una <strong>Propuesta ganada</strong> (vía pitch) o
          una <strong>Demanda / Oferta</strong> ya existente (vía directa). Cada uno tiene su botón
          <em> 📜 Firmar mandato</em> en la barra de acciones.
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="ab-btn" onClick={() => navigate('mandatos')}>← Volver a Mandatos</button>
          <button className="ab-btn" onClick={() => navigate('propuestas')}>Ir a Propuestas</button>
          <button className="ab-btn" onClick={() => navigate('demandas')}>Ir a Demandas</button>
          <button className="ab-btn" onClick={() => navigate('ofertas')}>Ir a Ofertas</button>
        </div>
      </div>
    )
  }

  return <FichaMandatoSupabase refOrId={params.id} />
}
