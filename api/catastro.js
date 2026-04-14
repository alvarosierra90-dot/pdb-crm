/**
 * Vercel Serverless Function — Proxy Catastro
 * GET /api/catastro?lat={lat}&lng={lng}
 *
 * Usa el endpoint ASMX con tolerancia de distancia (100 m) para que coordenadas
 * de Google Maps, que pueden caer en la acera o el portal, siempre encuentren
 * la parcela más cercana.
 *
 * Paso 1: Consulta_RCCOOR_Distancia  → refcat
 * Paso 2: REST Inmueble              → datos urbanísticos
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { lat, lng } = req.query
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Se requieren los parámetros lat y lng' })
  }

  // ── Strip XML namespaces so regex works independientemente del xmlns ──
  function stripNs(xml) {
    return xml
      .replace(/\s+xmlns(?::[a-z0-9]+)?="[^"]*"/gi, '')   // quita atributos xmlns
      .replace(/<([a-z0-9]+):/gi, '<')                     // quita prefijos de apertura
      .replace(/<\/([a-z0-9]+):/gi, '</')                  // quita prefijos de cierre
  }

  // ── Extrae el contenido de un tag XML ──
  function tag(xml, t) {
    const m = xml.match(new RegExp(`<${t}[^>]*>([^<]*)</${t}>`, 'i'))
    return m ? m[1].trim() : null
  }

  try {
    // ── PASO 1: coordenadas → refcat (tolerancia 100 m) ─────────────────
    //   Endpoint ASMX — más fiable que el REST, acepta distancia de búsqueda
    const coordUrl =
      'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/' +
      `OVCCoordenadas.asmx/Consulta_RCCOOR_Distancia` +
      `?SRS=EPSG:4326&Coordenada_X=${lng}&Coordenada_Y=${lat}&Distancia=100`

    const coordRes = await fetch(coordUrl, {
      headers: { Accept: 'text/xml, application/xml', 'User-Agent': 'pdb-crm/1.0' },
    })

    if (!coordRes.ok) {
      return res.status(502).json({
        error: `Error HTTP ${coordRes.status} al conectar con el Catastro`,
      })
    }

    const rawCoord = await coordRes.text()
    const coordXml = stripNs(rawCoord)

    // Verificar si el Catastro devolvió un error propio
    const errCod = tag(coordXml, 'cod')
    if (errCod && errCod !== '0') {
      const errDes = tag(coordXml, 'des') || 'Sin datos para esas coordenadas'
      return res.status(404).json({ error: errDes })
    }

    const pc1 = tag(coordXml, 'pc1')
    const pc2 = tag(coordXml, 'pc2')

    if (!pc1 || !pc2) {
      return res.status(404).json({
        error: 'El Catastro no devolvió ningún inmueble cercano. ' +
               'Comprueba que las coordenadas corresponden a un inmueble en España.',
      })
    }

    const car = tag(coordXml, 'car') || ''
    const cc1 = tag(coordXml, 'cc1') || ''
    const cc2 = tag(coordXml, 'cc2') || ''
    const refcat = `${pc1}${pc2}${car}${cc1}${cc2}`

    // ── PASO 2: refcat → datos del inmueble ──────────────────────────────
    const inmUrl =
      'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfLibres/RESTServices.svc/' +
      `Inmueble?RefCat=${refcat}&SRS=EPSG:4326`

    const inmRes = await fetch(inmUrl, {
      headers: { Accept: 'text/xml, application/xml', 'User-Agent': 'pdb-crm/1.0' },
    })

    if (!inmRes.ok) {
      // Devolvemos al menos la refcat aunque no tengamos el resto
      return res.status(200).json({
        ref_catastral: refcat,
        uso_pgou: null,
        sup_parcela: null,
        anno_construccion: null,
        aviso: 'Ref. catastral obtenida pero no se pudieron cargar los datos completos del inmueble',
      })
    }

    const inmXml = stripNs(await inmRes.text())

    const uso_catastral    = tag(inmXml, 'luso') || ''
    const ant              = tag(inmXml, 'ant')
    const anno_construccion = ant ? parseInt(ant, 10) : null

    // sup_parcela: intenta <ssp> (superficie suelo de parcela), fallback <stl>
    const sspRaw = tag(inmXml, 'ssp') || tag(inmXml, 'stl')
    const sup_parcela = sspRaw ? Math.round(parseFloat(sspRaw)) : null

    const USO_MAP = {
      'Almacén-Estacionamiento':  'Terciario / Aparcamiento',
      'Industrial':               'Industrial',
      'Industria':                'Industrial',
      'Oficinas':                 'Terciario / Oficinas',
      'Comercial':                'Terciario / Comercial',
      'Residencial':              'Residencial',
      'Suelo sin edificar':       'Solar',
      'Ocio y Hostelería':        'Terciario / Hostelería',
      'Sanidad y Beneficencia':   'Equipamiento / Sanitario',
      'Cultural':                 'Equipamiento / Cultural',
      'Religioso':                'Equipamiento / Religioso',
      'Obras de urbanización':    'Vial / Urbanización',
      'Bienes comunales':         'Dotacional',
      'Educación':                'Equipamiento / Educativo',
      'Espectáculos':             'Terciario / Ocio',
      'Deportivo':                'Equipamiento / Deportivo',
    }
    const uso_pgou = USO_MAP[uso_catastral] || uso_catastral || null

    return res.status(200).json({
      ref_catastral: refcat,
      uso_pgou,
      sup_parcela,
      anno_construccion,
    })

  } catch (err) {
    console.error('[catastro proxy]', err)
    return res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}
