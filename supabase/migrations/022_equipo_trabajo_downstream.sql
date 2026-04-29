-- ============================================================
-- PDB · Migración 022 — Propagar equipo_trabajo a downstream
-- El equipo de trabajo del Lead se hereda a Propuesta/Demanda/Oferta/
-- Mandato cuando se transforma. Cada entidad mantiene su propia copia
-- editable (cualquier Principal puede ajustarla aguas abajo sin
-- contaminar al lead origen).
-- ============================================================

ALTER TABLE propuestas ADD COLUMN IF NOT EXISTS equipo_trabajo jsonb DEFAULT '[]'::jsonb;
ALTER TABLE demandas   ADD COLUMN IF NOT EXISTS equipo_trabajo jsonb DEFAULT '[]'::jsonb;
ALTER TABLE ofertas    ADD COLUMN IF NOT EXISTS equipo_trabajo jsonb DEFAULT '[]'::jsonb;
ALTER TABLE mandatos   ADD COLUMN IF NOT EXISTS equipo_trabajo jsonb DEFAULT '[]'::jsonb;
