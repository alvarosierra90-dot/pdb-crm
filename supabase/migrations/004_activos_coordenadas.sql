-- ============================================================
-- PDB · Migration 004
-- Añade columna coordenadas a activos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE activos ADD COLUMN IF NOT EXISTS coordenadas text;
