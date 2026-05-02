-- ============================================================
-- PDB · Migración 026 — Actividades vinculadas a Mandato
-- La tabla `actividades` (010_crm_pipeline) tiene FK a lead, oferta,
-- demanda, negociación y oportunidad. Faltaba mandato_id, necesario
-- para listar actividades en FichaMandato (tab man-act).
-- ============================================================

ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS mandato_id uuid REFERENCES mandatos(id);

CREATE INDEX IF NOT EXISTS idx_actividades_mandato ON actividades(mandato_id);
