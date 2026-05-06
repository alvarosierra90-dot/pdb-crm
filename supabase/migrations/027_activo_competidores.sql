-- ============================================================
-- PDB · Migración 027 — Competidores por Activo
-- ============================================================
-- Permite que el responsable de un Activo registre qué OTROS Activos
-- considera competidores directos. Esta lista alimenta los Informes
-- de gestión (sección "Principales competidores"): por cada competidor
-- se muestran sus ofertas activas, transacciones cerradas en los últimos
-- 12 meses, ocupación, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS activo_competidores (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  activo_id      uuid        NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
  competidor_id  uuid        NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
  motivo         text,                     -- "Mismo edificio", "Misma zona", "Misma renta", etc.
  notas          text,
  created_at     timestamptz DEFAULT now(),
  created_by     text,
  UNIQUE(activo_id, competidor_id),
  CHECK (activo_id <> competidor_id)       -- un activo no se compite a sí mismo
);

ALTER TABLE activo_competidores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_all ON activo_competidores;
CREATE POLICY dev_all ON activo_competidores FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activo_competidores_activo     ON activo_competidores(activo_id);
CREATE INDEX IF NOT EXISTS idx_activo_competidores_competidor ON activo_competidores(competidor_id);
