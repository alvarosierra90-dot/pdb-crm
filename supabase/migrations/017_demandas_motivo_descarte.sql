-- ============================================================
-- PDB · Migración 017 — Motivo de descarte en demandas
-- Cuando una demanda pasa a estatus = descartada, el usuario debe
-- registrar por qué. Este motivo queda persistido para consulta.
-- ============================================================

ALTER TABLE demandas
  ADD COLUMN IF NOT EXISTS motivo_descarte text;
