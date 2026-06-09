/* ============================================================
   DEMO · módulo aislado (Administración)
   La demo en sí es un HTML autocontenido en public/demo/index.html.
   Esta pantalla solo la presenta y la abre en pestaña nueva limpia,
   para no mostrar el CRM durante la demostración.
   Quitar = borrar src/demo/ + public/demo/ + 2 líneas (Nav y App).
   ============================================================ */
const DEMO_URL = `${import.meta.env.BASE_URL || '/'}demo/`.replace('//demo', '/demo')

export default function DemoView() {
  const abrir = () => window.open(DEMO_URL, '_blank', 'noopener')

  return (
    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{
        maxWidth: 560, textAlign: 'center', background: 'var(--surface, #fff)',
        border: '1px solid var(--border, #e6eaf1)', borderRadius: 18, padding: '40px 44px',
        boxShadow: '0 12px 30px -16px rgba(11,16,32,.14)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 15, margin: '0 auto 20px',
          display: 'grid', placeItems: 'center', color: '#fff',
          background: 'linear-gradient(120deg,#0E9F6E,#13C088)', boxShadow: '0 10px 34px -10px rgba(14,159,110,.5)',
        }}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5l11 7-11 7z"/></svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>Demostración de IA</h2>
        <p style={{ color: 'var(--text3, #56607a)', fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>
          Experiencia interactiva: <b>el consultor inmobiliario aumentado</b>. Se abre en una
          pestaña nueva e independiente, para presentarla a los equipos sin mostrar el CRM.
        </p>
        <button onClick={abrir} style={{
          marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 9, cursor: 'pointer',
          background: '#0B1020', color: '#fff', border: 'none', borderRadius: 12,
          padding: '14px 26px', fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
        }}>
          Abrir demostración
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>
        </button>
        <p style={{ color: 'var(--text4, #929bb0)', fontSize: 11, marginTop: 18 }}>
          Sugerencia: comparte solo esa pestaña al presentar.
        </p>
      </div>
    </div>
  )
}
