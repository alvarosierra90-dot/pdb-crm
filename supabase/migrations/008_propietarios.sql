-- 008 — Propietarios: añadir columnas operativas
-- Run in Supabase SQL Editor
--
-- Histórico: en 001 se crea propietarios con un esquema de portfolio
-- (id uuid, nombre, ticker, tipo, cotización, etc.). Esta migración
-- añade las columnas que la UI necesita (propietario, activo, activo_ref,
-- superficie, zona, perfil, financiación, contacto…) sin destruir la
-- tabla existente — así no rompe las FKs portfolio_id que apuntan a
-- propietarios(id) desde 010 (ofertas, demandas, oferta_demanda, visitas…).

ALTER TABLE propietarios
  ADD COLUMN IF NOT EXISTS propietario        text,
  ADD COLUMN IF NOT EXISTS activo             text,
  ADD COLUMN IF NOT EXISTS activo_ref         text,
  ADD COLUMN IF NOT EXISTS zona               text,
  ADD COLUMN IF NOT EXISTS subzona            text,
  ADD COLUMN IF NOT EXISTS superficie         numeric,
  ADD COLUMN IF NOT EXISTS uso                text,
  ADD COLUMN IF NOT EXISTS area               text,
  ADD COLUMN IF NOT EXISTS tipologia          text    DEFAULT 'Asset deal',
  ADD COLUMN IF NOT EXISTS anyo_compra        integer,
  ADD COLUMN IF NOT EXISTS trimestre          text    DEFAULT 'Q1',
  ADD COLUMN IF NOT EXISTS precio_compra      text,
  ADD COLUMN IF NOT EXISTS estado_activo      text,
  ADD COLUMN IF NOT EXISTS regimen            text    DEFAULT 'Propiedad 100%',
  ADD COLUMN IF NOT EXISTS valoracion_actual  text,
  ADD COLUMN IF NOT EXISTS perfil             text    DEFAULT 'Core',
  ADD COLUMN IF NOT EXISTS estrategia         text    DEFAULT 'Hold',
  ADD COLUMN IF NOT EXISTS cap_rate           numeric,
  ADD COLUMN IF NOT EXISTS tir_objetivo       numeric,
  ADD COLUMN IF NOT EXISTS horizonte_inv      integer,
  ADD COLUMN IF NOT EXISTS ltv                numeric,
  ADD COLUMN IF NOT EXISTS financiacion       numeric,
  ADD COLUMN IF NOT EXISTS banco              text,
  ADD COLUMN IF NOT EXISTS tipo_deuda         text,
  ADD COLUMN IF NOT EXISTS vencimiento_deuda  text,
  ADD COLUMN IF NOT EXISTS estado             text    DEFAULT 'Activo',
  ADD COLUMN IF NOT EXISTS responsable        text,
  ADD COLUMN IF NOT EXISTS asset_manager      text,
  ADD COLUMN IF NOT EXISTS cif                text,
  ADD COLUMN IF NOT EXISTS tipo_entidad       text,
  ADD COLUMN IF NOT EXISTS pais               text,
  ADD COLUMN IF NOT EXISTS ciudad_sede        text,
  ADD COLUMN IF NOT EXISTS email              text,
  ADD COLUMN IF NOT EXISTS telefono           text,
  ADD COLUMN IF NOT EXISTS contacto_principal text,
  ADD COLUMN IF NOT EXISTS observaciones      text;

-- Index for fast lookups by activo
CREATE INDEX IF NOT EXISTS propietarios_activo_ref_idx ON propietarios (activo_ref);
