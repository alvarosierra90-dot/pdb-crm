-- ============================================================
-- PDB · Migración 029 — Datos de contacto del lead
-- ============================================================
-- Añade campos para capturar nombre y apellidos del contacto del
-- lead ANTES de la cualificación / vinculación a Dynamics.
--
-- Flujo:
--   - Al crear el lead, el broker rellena nombre + apellidos + email +
--     teléfono. Son obligatorios para identificar al contacto.
--   - Más tarde, al cualificar/transformar el lead, se vincula a una
--     Cuenta + Contacto de Dynamics (FK ya existentes).
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS contacto_nombre    text,
  ADD COLUMN IF NOT EXISTS contacto_apellidos text;
