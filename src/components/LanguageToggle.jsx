import { useState } from 'react'

export default function LanguageToggle() {
  const [lang, setLang] = useState('es')

  const toggle = () => {
    const next = lang === 'es' ? 'en' : 'es'
    const select = document.querySelector('.goog-te-combo')
    if (select) {
      select.value = next
      select.dispatchEvent(new Event('change'))
    }
    setLang(next)
  }

  return (
    <button
      onClick={toggle}
      title={lang === 'es' ? 'Traducir a inglés' : 'Switch to Spanish'}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '0 11px', height: 28, borderRadius: 6,
        border: '1px solid var(--border)',
        background: lang === 'en' ? 'var(--accent-lt)' : '#fff',
        color: lang === 'en' ? 'var(--accent)' : 'var(--text3)',
        fontSize: 11, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'inherit', flexShrink: 0,
        transition: 'all .15s',
      }}
    >
      🌐 {lang === 'es' ? 'ES' : 'EN'}
    </button>
  )
}
