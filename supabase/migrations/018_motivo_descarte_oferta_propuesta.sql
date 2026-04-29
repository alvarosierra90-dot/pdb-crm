-- ============================================================
-- PDB · Migración 018 — Motivo de descarte en Ofertas y Propuestas
-- Replica el campo motivo_descarte que existe en demandas para
-- mantener la misma dinámica en los otros módulos.
-- ============================================================

ALTER TABLE ofertas
  ADD COLUMN IF NOT EXISTS motivo_descarte text;

ALTER TABLE propuestas
  ADD COLUMN IF NOT EXISTS motivo_descarte text;
