-- 008 — Propietarios table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS propietarios (
  id                text PRIMARY KEY,
  propietario       text NOT NULL,
  activo            text,
  activo_ref        text,
  zona              text,
  subzona           text,
  superficie        numeric,
  uso               text,
  area              text,
  tipologia         text    DEFAULT 'Asset deal',
  anyo_compra       integer,
  trimestre         text    DEFAULT 'Q1',
  precio_compra     text,
  estado_activo     text,
  regimen           text    DEFAULT 'Propiedad 100%',
  valoracion_actual text,
  perfil            text    DEFAULT 'Core',
  estrategia        text    DEFAULT 'Hold',
  cap_rate          numeric,
  yield_pct         numeric,
  tir_objetivo      numeric,
  horizonte_inv     integer,
  ltv               numeric,
  financiacion      numeric,
  banco             text,
  tipo_deuda        text,
  vencimiento_deuda text,
  estado            text    DEFAULT 'Activo',
  responsable       text,
  asset_manager     text,
  cif               text,
  tipo_entidad      text,
  pais              text,
  ciudad_sede       text,
  email             text,
  telefono          text,
  contacto_principal text,
  observaciones     text,
  created_at        timestamptz DEFAULT now()
);

-- Index for fast lookups by activo
CREATE INDEX IF NOT EXISTS propietarios_activo_ref_idx ON propietarios (activo_ref);
