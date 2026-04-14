-- ============================================================
-- PDB · Migration 005
-- Añade sup_planta_tipo y ratio_perdida a activos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE activos ADD COLUMN IF NOT EXISTS sup_planta_tipo numeric;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS ratio_perdida   numeric;
