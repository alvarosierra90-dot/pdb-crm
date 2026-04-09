export const ACTIVOS = [
  { ref: 'MAD-OF-00189', name: 'P.E Avalon', zona: 'M-30', subzona: 'Julián Camarillo', ciudad: 'Madrid', uso: 'Oficinas', sba: 46956, occ: 78.4, renta: 10.5, valor: '130 M€', estado: 'Activo', dias: 127 },
  { ref: 'ALC-OF-00231', name: 'Albatros', zona: 'A-1', subzona: 'Alcobendas', ciudad: 'Madrid', uso: 'Oficinas', sba: 53944, occ: 75, renta: 12.5, valor: '—', estado: 'Activo', dias: 127 },
  { ref: 'BCN-OF-00312', name: 'Edificio Diagonal 95', zona: '22@', subzona: 'Poblenou', ciudad: 'Barcelona', uso: 'Oficinas', sba: 9800, occ: 88, renta: 22.0, valor: '74 M€', estado: 'Activo', dias: 45 },
  { ref: 'MAD-LG-00401', name: 'Park Logístico Getafe', zona: 'Corredor del Henares', subzona: 'Getafe', ciudad: 'Madrid', uso: 'Logístico', sba: 24000, occ: 96, renta: 6.8, valor: '52 M€', estado: 'Activo', dias: 12 },
  { ref: 'MAD-RT-00502', name: 'Centro Comercial Parquesur', zona: 'Sur Madrid', subzona: 'Leganés', ciudad: 'Madrid', uso: 'Retail', sba: 42000, occ: 91, renta: 18.0, valor: '210 M€', estado: 'Activo', dias: 0 },
  { ref: 'BCN-OF-00621', name: 'Torre Glòries', zona: '22@', subzona: 'Poblenou', ciudad: 'Barcelona', uso: 'Oficinas', sba: 18500, occ: 100, renta: 28.0, valor: '145 M€', estado: 'Activo', dias: 0 },
  { ref: 'VLC-OF-00712', name: 'Torre Europa Valencia', zona: 'Mestalla', subzona: 'Benimaclet', ciudad: 'Valencia', uso: 'Oficinas', sba: 7600, occ: 83, renta: 14.5, valor: '38 M€', estado: 'En comercialización', dias: 62 },
  { ref: 'MAD-OF-00841', name: 'Parque Empresarial Norte', zona: 'M-30', subzona: 'Hortaleza', ciudad: 'Madrid', uso: 'Oficinas', sba: 11200, occ: 79, renta: 16.8, valor: '68 M€', estado: 'Activo', dias: 34 },
]

export const OFERTAS = [
  { ref: 'OFR-0018', activo: 'Torre Castellana 200', espacio: 'P16 · 440 m²', tipo: 'Arrendamiento', inquilino: 'Consulting Tech Partners', renta: '€22.0/m²', m2: 440, estado: 'En revisión', vence: '28/03/25' },
  { ref: 'OFR-0017', activo: 'Edificio Diagonal 95', espacio: 'P3 · 820 m²', tipo: 'Arrendamiento', inquilino: 'Pharma Group Spain', renta: '€19.5/m²', m2: 820, estado: 'Negociando', vence: '15/04/25' },
  { ref: 'OFR-0016', activo: 'Park Logístico Getafe', espacio: 'Nave B · 4.200 m²', tipo: 'Arrendamiento', inquilino: 'Amazon Logistics', renta: '€6.8/m²', m2: 4200, estado: 'Pre-acuerdo', vence: '30/03/25' },
]

export const NEGOCIACIONES = [
  { ref: 'NEG-0044', parte: 'Sierra Álvaro', equipo: 'Transaction Spain', contraparte: 'Empresa XYZ', contacto: 'Ana Gómez · Dir. RRHH', activo: 'Avalon — Santa Leonor 65', espacio: '1.000 m² · P5', estado: 'En negociación', envio: '10/03/2026', ultima_mod: '15/03/2026', mod_desc: 'Ajuste condiciones', cierre: '30/03/2026' },
  { ref: 'NEG-0041', parte: 'Sierra Álvaro', equipo: 'Transaction Spain', contraparte: 'Oracle Spain SL', contacto: 'Carlos Méndez · Dir. Real Estate', activo: 'Albatros — Edif. D', espacio: '13.486 m² · P1–P4', estado: 'Pendiente respuesta', envio: '12/03/2026', ultima_mod: '28/03/2026', mod_desc: 'Contraoferta enviada', cierre: '30/04/2026' },
  { ref: 'NEG-0039', parte: 'Sierra Álvaro', equipo: 'Transaction Spain', contraparte: 'Generali Real Estate', contacto: 'Marta Solá · Asset Manager', activo: 'P.E Avalon — P5', espacio: '1.500 m²', estado: 'Acuerdo alcanzado', envio: '01/03/2026', ultima_mod: '29/03/2026', mod_desc: 'Contrato revisado', cierre: '15/04/2026' },
  { ref: 'NEG-0037', parte: 'Alonso Abruña D.', equipo: 'Leasing Oficinas MAD', contraparte: 'Pharma Group Spain', contacto: 'Javier Ruiz · CFO', activo: 'Diagonal 95 — P3', espacio: '820 m²', estado: 'En negociación', envio: '20/02/2026', ultima_mod: '26/03/2026', mod_desc: '3ª ronda condiciones', cierre: '15/05/2026' },
  { ref: 'NEG-0035', parte: 'Sierra Álvaro', equipo: 'Transaction Spain', contraparte: 'ISDE', contacto: 'Lucía Herrero · Dir. Expansión', activo: 'P.E Avalon — P3', espacio: '2.200 m²', estado: 'Firmado', envio: '10/01/2026', ultima_mod: '14/02/2026', mod_desc: 'Contrato firmado', cierre: '01/03/2026' },
  { ref: 'NEG-0033', parte: 'GOMEZ Ignacio', equipo: 'Leasing Oficinas MAD', contraparte: 'Grupo Empresarial Altamira SL', contacto: 'Pedro Vidal · CEO', activo: 'Parque Empresarial Norte — P2', espacio: '2.800 m²', estado: 'Rechazado', envio: '15/12/2025', ultima_mod: '10/01/2026', mod_desc: 'Cliente rechaza condiciones', cierre: '—' },
]

export const PORTFOLIOS = [
  { nombre: 'Merlín Properties SOCIMI', ticker: 'MRL', tipo: 'SOCIMI', activos: 64, m2: 2100000, disponible: 180000, ofertas: 31, yield: 5.1, contacto: '12/03/2026', colorBg: 'var(--gray-lt)', colorBorder: 'var(--border)', colorText: 'var(--text)', letra: 'M' },
  { nombre: 'FREO Investments Spain SL', ticker: 'FREO', tipo: 'Fondo', activos: 12, m2: 340000, disponible: 28000, ofertas: 8, yield: 6.2, contacto: '05/03/2026', colorBg: 'var(--green-lt)', colorBorder: 'var(--green-bd)', colorText: 'var(--green)', letra: 'F' },
]
