import { useNav } from '../context/NavigationContext'
import FichaMandatoSupabase from './FichaMandatoSupabase'

// Todos los mandatos viven en Supabase (migración 020). Esta vista es un
// wrapper que delega siempre en FichaMandatoSupabase con el ref recibido.
// Si la navegación llega sin id (ej. "+ Nuevo Mandato"), se muestra un
// placeholder hasta que se implemente el flujo de creación canónico
// (Propuesta=Ganada → cascada Instrucción → Mandato).
export default function FichaMandato() {
  const { params, navigate } = useNav()

  if (params?.nuevo || !params?.id) {
    return (
      <div style={{ padding:32, maxWidth:520 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:8 }}>Crear nuevo mandato</div>
        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55, marginBottom:14 }}>
          Los mandatos se crean a partir de una <strong>Propuesta ganada</strong> (rama pitch) o de un
          <strong> Lead cualificado vía directa</strong>. La cascada Dynamics → Instrucción →
          Mandato aún no está conectada en este prototipo.
        </div>
        <button className="ab-btn" onClick={() => navigate('mandatos')}>← Volver a Mandatos</button>
      </div>
    )
  }

  return <FichaMandatoSupabase refOrId={params.id} />
}
