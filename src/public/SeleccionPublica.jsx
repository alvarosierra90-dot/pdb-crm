import { useState } from 'react'
import './seleccion.css'
import SeleccionLanding from './SeleccionLanding'
import FichaOfertaPublica from './FichaOfertaPublica'

/* ============================================================
   SeleccionPublica — MAQUETACIÓN de la vista pública.
   SOLO formato (datos de ejemplo, sin tokens ni BD ni generación).
   · Modo A: N ofertas → Landing + grid → ficha detalle.
   · Modo B: 1 oferta → directamente la ficha detalle (sin landing).
   La barra superior es solo para previsualizar ambos modos.
   ============================================================ */

const AGENTE = { nombre: 'Álvaro Sierra', telefono: '+34 91 319 13 14', email: 'agenciamadrid@savills.es' }
const FECHA = '04/06/2026'

// Oferta de ejemplo COMPLETA (todas las secciones) para la ficha detalle
const OFERTA_FULL = {
  ref: 'OFR-0038', tipo_operacion: 'Alquiler', estado_espacio: 'Implantado', disponibilidad: 'Inmediata',
  direccion: 'Vía de los Poblados 3', cp: '28033', ciudad: 'Madrid', fecha: FECHA,
  sup_disponible: 7715, sup_min: 850, renta_m2: 16.5, gastos_m2: 3.2, renta_mensual: '127.297 €/mes',
  gastos_comentario: 'IBI incluido en los gastos comunes.',
  lat: 40.47, lng: -3.62,
  descripcion: 'Edificio de oficinas representativo en el distrito de negocios de Campo de las Naciones, completamente reformado, con espacios diáfanos, certificación de sostenibilidad y amplias zonas comunes. Excelente conectividad con el aeropuerto y la M-40.',
  fotos: [],
  destacados: [
    { label: 'LEED Gold', color: '#2f7a4f' }, { label: 'Recién reformado', color: '#b08d57' },
    { label: 'Restauración', color: '#0e7490' }, { label: 'Zona deportiva', color: '#6b21a8' }, { label: 'Zonas ajardinadas', color: '#15803d' },
  ],
  estado_renovacion: 'Renovado en 2024', transporte: ['Metro Feria de Madrid (L8)', 'Bus 122 / 828', 'Aeropuerto a 8 km'],
  esg: ['LEED Gold', 'WELL Silver', 'BREEAM Very Good'],
  servicios: ['Falso techo registrable', 'Altura libre 2,70 m', 'Climatización VRV', 'Co-working', 'Terraza', 'Restauración', 'Vending', 'Lockers', 'Tornos de acceso', 'Suelo técnico'],
  superficies: [
    { edificio: 'Edificio A', subtotal: 4500, filas: [
      { tipo: 'Oficina', planta: 'Planta 3', sup: 1500, renta: 16.5 },
      { tipo: 'Oficina', planta: 'Planta 2', sup: 1500, renta: 16.5 },
      { tipo: 'Oficina', planta: 'Planta 1', sup: 1500, renta: 16.0 },
    ] },
    { edificio: 'Edificio B', subtotal: 3215, filas: [
      { tipo: 'Oficina', planta: 'Planta 1', sup: 1715, renta: 15.5 },
      { tipo: 'Comercial', planta: 'Planta baja', sup: 1500, renta: 18.0 },
    ] },
  ],
  parking: [
    { categoria: 'Interior', tipo: 'Simple', uso: 'Coches', plazas: 180, precio: '1.200 €' },
    { categoria: 'Exterior', tipo: 'Simple', uso: 'Coches', plazas: 40, precio: '900 €' },
    { categoria: 'Interior', tipo: 'Doble', uso: 'Motos', plazas: 20, precio: '480 €' },
  ],
  planos: [{ cap: 'Planta tipo' }, { cap: 'Planta baja' }],
}

// Ofertas adicionales para el grid (más ligeras)
const OFERTAS = [
  OFERTA_FULL,
  { ref: 'OFR-0041', direccion: 'Calle de Albasanz 14', cp: '28037', ciudad: 'Madrid', estado_espacio: 'Diáfano', disponibilidad: 'Q3 2026', tipo_operacion: 'Alquiler', sup_disponible: 3200, sup_min: 600, renta_m2: 14.0, gastos_m2: 2.8, lat: 40.44, lng: -3.63, descripcion: 'Oficinas en Julián Camarillo, zona tecnológica consolidada.', servicios: ['Climatización', 'Suelo técnico', 'Parking'], parking: [{ categoria: 'Interior', tipo: 'Simple', uso: 'Coches', plazas: 60, precio: '1.000 €' }], superficies: [], esg: ['LEED Silver'], transporte: ['Metro Suanzes (L5)'] },
  { ref: 'OFR-0052', direccion: 'Paseo de la Castellana 200', cp: '28046', ciudad: 'Madrid', estado_espacio: 'Implantado', disponibilidad: 'Inmediata', tipo_operacion: 'Alquiler', sup_disponible: 1200, sup_min: 1200, renta_m2: 28.0, gastos_m2: 5.0, lat: 40.46, lng: -3.69, descripcion: 'Planta prime en el CBD de Castellana.', servicios: ['Conserjería 24h', 'Terraza'], superficies: [], esg: ['WELL Gold'] },
  { ref: 'OFR-0067', direccion: 'Av. de Bruselas 38', cp: '28108', ciudad: 'Alcobendas', estado_espacio: 'Diáfano', disponibilidad: 'Q4 2026', tipo_operacion: 'Alquiler', sup_disponible: 5400, sup_min: 900, renta_m2: 13.5, gastos_m2: 2.5, lat: 40.53, lng: -3.64, descripcion: 'Edificio exento en Arroyo de la Vega con parking propio.', servicios: ['Cafetería', 'Gimnasio', 'Parking'], superficies: [], esg: ['BREEAM Good'] },
]

export default function SeleccionPublica({ onClose }) {
  const [modo, setModo] = useState('A')                 // 'A' (N ofertas) | 'B' (1 oferta)
  const [vista, setVista] = useState('landing')         // 'landing' | 'detail'
  const [idx, setIdx] = useState(0)

  const lista = modo === 'A' ? OFERTAS : [OFERTA_FULL]
  // Modo B o N=1 → directamente ficha; Modo A con landing
  const enFicha = modo === 'B' || vista === 'detail' || lista.length === 1

  return (
    <div className="pub-skin">
      {/* Barra de previsualización (solo maqueta) */}
      <div className="pub-previewbar">
        <span>Maqueta · Selección de Alternativas (vista pública)</span>
        <div className="pp-tabs">
          <button className={modo === 'A' ? 'on' : ''} onClick={() => { setModo('A'); setVista('landing') }}>Modo A · Selección (N)</button>
          <button className={modo === 'B' ? 'on' : ''} onClick={() => { setModo('B'); setVista('detail') }}>Modo B · Ficha (1)</button>
          {onClose && <button onClick={onClose}>✕ Cerrar</button>}
        </div>
      </div>

      {enFicha ? (
        <FichaOfertaPublica
          oferta={modo === 'A' ? lista[idx] : OFERTA_FULL}
          showBack={modo === 'A' && lista.length > 1}
          onBack={() => setVista('landing')}
        />
      ) : (
        <SeleccionLanding
          ofertas={lista}
          agente={AGENTE}
          fecha={FECHA}
          onMore={(i) => { setIdx(i); setVista('detail') }}
        />
      )}
    </div>
  )
}
