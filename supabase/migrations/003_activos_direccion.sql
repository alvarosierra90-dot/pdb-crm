-- ============================================================
-- PDB · Migration 003
-- Añade columna direccion a activos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE activos ADD COLUMN IF NOT EXISTS direccion text;
