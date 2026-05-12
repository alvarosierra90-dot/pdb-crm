-- ============================================================
-- PDB · Migración 028 — Evolución de Competidores
-- ============================================================
-- Convierte la pestaña Competidores en una herramienta de benchmarking:
--  - motivos pasa de texto libre a multi-select (array)
--  - orden para reordenar por relevancia
--  - imagen_url para mostrar la foto principal del competidor en la card
-- ============================================================

ALTER TABLE activo_competidores
  ADD COLUMN IF NOT EXISTS motivos     jsonb       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS orden       integer     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS imagen_url  text;

-- Migrar valores de 'motivo' (text) al nuevo array 'motivos' (jsonb).
UPDATE activo_competidores
   SET motivos = jsonb_build_array(motivo)
 WHERE motivo IS NOT NULL
   AND (motivos IS NULL OR motivos = '[]'::jsonb);

CREATE INDEX IF NOT EXISTS idx_activo_competidores_orden
  ON activo_competidores(activo_id, orden);

-- Catálogo canónico de motivos (sólo informativo, no se enforza).
-- Valores válidos:
--   'Zona'
--   'Tipología'
--   'Volumen / superficie'
--   'Rango de renta'
--   'Calidad del activo'
--   'Amenities'
--   'Transporte y accesibilidad'
--   'Estado del edificio'
--   'Perfil de tenant'
--   'Competidor prácticamente idéntico'
