/**
 * Vercel Serverless Function — Proxy Catastro
 * GET /api/catastro?lat={lat}&lng={lng}
 *
 * Paso 1: coordenadas → referencia catastral  (OVCCoordenadas)
 * Paso 2: refcat → datos del inmueble         (Inmueble)
 * Devuelve JSON con los campos para los datos urbanísticos.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { lat, lng } = req.query
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Se requieren los parámetros lat y lng' })
  }

  // ── Utilidad: extrae el contenido de un tag XML ──────────────────────────
  function tag(xml, t) {
    const m = xml.match(new RegExp(`<${t}>([^<]*)<\/${t}>`))
    return m ? m[1].trim() : null
  }

  try {
    // ── PASO 1: coordenadas → referencia catastral ───────────────────────
    const coordUrl =
      `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfLibres/RESTServices.svc/` +
      `OVCCoordenadas?SRS=EPSG:4326&Coordenada_X=${lng}&Coordenada_Y=${lat}&Tipo=CTRU`

    const coordRes = await fetch(coordUrl, {
      headers: { Accept: 'application/xml', 'User-Agent': 'pdb-crm/1.0' },
    })
    if (!coordRes.ok) {
      return res.status(502).json({ error: 'Error al conectar con la API del Catastro' })
    }
    const coordXml = await coordRes.text()

    const pc1 = tag(coordXml, 'pc1')
    const pc2 = tag(coordXml, 'pc2')
    const car = tag(coordXml, 'car') || ''
    const cc1 = tag(coordXml, 'cc1') || ''
    const cc2 = tag(coordXml, 'cc2') || ''

    if (!pc1 || !pc2) {
      return res.status(404).json({
        error: 'No se encontró ningún inmueble catastral en esas coordenadas',
      })
    }
    const refcat = `${pc1}${pc2}${car}${cc1}${cc2}`

    // ── PASO 2: refcat → datos del inmueble ──────────────────────────────
    const inmUrl =
      `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfLibres/RESTServices.svc/` +
      `Inmueble?RefCat=${refcat}&SRS=EPSG:4326`

    const inmRes = await fetch(inmUrl, {
      headers: { Accept: 'application/xml', 'User-Agent': 'pdb-crm/1.0' },
    })
    if (!inmRes.ok) {
      return res.status(502).json({ error: 'Error al obtener datos del inmueble' })
    }
    const inmXml = await inmRes.text()

    // Uso catastral → texto
    const uso_catastral = tag(inmXml, 'luso') || ''

    // Año construcción
    const ant = tag(inmXml, 'ant')
    const anno_construccion = ant ? parseInt(ant, 10) : null

    // Superficie suelo (parcela): <ssp> primero, fallback a <stl>
    const ssp = tag(inmXml, 'ssp') || tag(inmXml, 'stl')
    const sup_parcela = ssp ? Math.round(parseFloat(ssp)) : null

    // Mapeo uso catastral → etiqueta PGOU
    const USO_MAP = {
      'Almacén-Estacionamiento':      'Terciario / Aparcamiento',
      'Industrial':                   'Industrial',
      'Industria':                    'Industrial',
      'Oficinas':                     'Terciario / Oficinas',
      'Comercial':                    'Terciario / Comercial',
      'Residencial':                  'Residencial',
      'Suelo sin edificar':           'Solar',
      'Ocio y Hostelería':            'Terciario / Hostelería',
      'Sanidad y Beneficencia':       'Equipamiento / Sanitario',
      'Cultural':                     'Equipamiento / Cultural',
      'Religioso':                    'Equipamiento / Religioso',
      'Obras de urbanización':        'Vial / Urbanización',
      'Bienes comunales':             'Dotacional',
      'Educación':                    'Equipamiento / Educativo',
      'Espectáculos':                 'Terciario / Ocio',
      'Deportivo':                    'Equipamiento / Deportivo',
    }
    const uso_pgou = USO_MAP[uso_catastral] || uso_catastral || null

    return res.status(200).json({
      ref_catastral:     refcat,
      uso_pgou,
      sup_parcela,
      anno_construccion,
    })
  } catch (err) {
    console.error('[catastro proxy]', err)
    return res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}
