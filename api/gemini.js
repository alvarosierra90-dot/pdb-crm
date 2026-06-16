/**
 * Vercel Serverless Function — Proxy Google Gemini (Generative Language API)
 * POST /api/gemini   body: { model?, contents, generationConfig? }
 *
 * El módulo Hoteles llama aquí (como hace Pitch con Gemini) para no exponer la
 * clave en el navegador. La clave se toma de GEMINI_API_KEY y, si no existe,
 * cae a VITE_GOOGLE_MAPS_API_KEY (misma key de Google; requiere tener habilitada
 * la "Generative Language API" en el proyecto de Google Cloud).
 */

const DEFAULT_MODEL = 'gemini-2.5-flash'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Método no permitido. Usa POST.' } })

  const key = process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return res.status(500).json({ error: { message: 'Falta GEMINI_API_KEY en el servidor (configúrala en Vercel).' } })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    const model = body.model || DEFAULT_MODEL
    const payload = { contents: body.contents || [], ...(body.generationConfig ? { generationConfig: body.generationConfig } : {}) }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const text = await upstream.text()
    res.setHeader('Content-Type', 'application/json')
    return res.status(upstream.status).send(text)
  } catch (e) {
    return res.status(502).json({ error: { message: 'Proxy error: ' + (e?.message || String(e)) } })
  }
}
