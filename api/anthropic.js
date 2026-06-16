/**
 * Vercel Serverless Function — Proxy Anthropic Messages API
 * POST /api/anthropic
 *
 * El módulo Hoteles (public/hoteles.html) llama aquí en vez de a la API de
 * Anthropic directamente, para no exponer la API key en el navegador. La clave
 * se inyecta desde la variable de entorno ANTHROPIC_API_KEY (configurada en
 * Vercel). El body del cliente (model, max_tokens, messages…) se reenvía tal cual.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Método no permitido. Usa POST.' } })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'Falta ANTHROPIC_API_KEY en el servidor (configúrala en Vercel).' } })
  }

  try {
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: payload,
    })
    // Reenvía la respuesta de Anthropic verbatim (incl. JSON de error con error.message)
    const text = await upstream.text()
    res.setHeader('Content-Type', 'application/json')
    return res.status(upstream.status).send(text)
  } catch (e) {
    return res.status(502).json({ error: { message: 'Proxy error: ' + (e?.message || String(e)) } })
  }
}
