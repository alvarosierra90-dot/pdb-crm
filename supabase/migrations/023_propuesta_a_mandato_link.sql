-- ============================================================
-- PDB · Migración 023 — Cascada Propuesta ganada → Mandato
-- Añade FK propuesta_id en mandatos para trazar el origen de la
-- cascada (Propuesta → Instrucción → Mandato) cuando se gana un
-- pitch.
-- ============================================================

ALTER TABLE mandatos
  ADD COLUMN IF NOT EXISTS propuesta_id uuid REFERENCES propuestas(id);

CREATE INDEX IF NOT EXISTS idx_mandatos_propuesta ON mandatos(propuesta_id);
