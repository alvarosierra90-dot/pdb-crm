/**
 * Vercel Serverless Function — Open Graph image de una URL
 * GET /api/oimg?url=https://hotel.com
 *
 * Devuelve { image } con la foto principal (og:image / twitter:image) de la
 * web indicada. Sirve de respaldo para el módulo Hoteles cuando Google Places
 * no tiene foto del hotel: se usa la foto de su propia web. Se hace en servidor
 * para evitar el bloqueo CORS del navegador.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  let url = req.query?.url
  if (Array.isArray(url)) url = url[0]
  if (!url) return res.status(400).json({ image: null, error: 'Falta el parámetro url' })
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 6000)
    const r = await fetch(url, {
      redirect: 'follow', signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PDB-Hoteles/1.0; +https://pdb-crm.vercel.app)', 'Accept': 'text/html' },
    })
    clearTimeout(t)
    const html = (await r.text()).slice(0, 600000)
    const pick = re => { const m = html.match(re); return m ? m[1] : null }
    let img =
      pick(/<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i) ||
      pick(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)
    if (img) {
      img = img.replace(/&amp;/g, '&').trim()
      if (img.startsWith('//')) img = 'https:' + img
      else if (img.startsWith('/')) { try { img = new URL(url).origin + img } catch { /* noop */ } }
    }
    return res.status(200).json({ image: img || null })
  } catch (e) {
    return res.status(200).json({ image: null, error: String(e?.message || e) })
  }
}
