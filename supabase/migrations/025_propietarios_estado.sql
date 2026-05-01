-- ============================================================
-- PDB · Migración 025 — Propietarios pueden desactivarse
-- ------------------------------------------------------------
-- Un propietario puede pasar a inactivo (vendió todo y no ha
-- recomprado, en desinversión, fondo cerrado…) sin borrarse: la
-- historia de los activos sigue apuntando a él. Añadimos un estado
-- igual que ofertas/demandas, fecha_desactivacion y motivo.
-- ============================================================

ALTER TABLE propietarios
  ADD COLUMN IF NOT EXISTS estado               text DEFAULT 'Activo',
  ADD COLUMN IF NOT EXISTS fecha_desactivacion  date,
  ADD COLUMN IF NOT EXISTS motivo_desactivacion text;

-- CHECK constraint para los 4 estados canónicos. Drop antes por si
-- ya existía con otro listado.
ALTER TABLE propietarios DROP CONSTRAINT IF EXISTS propietarios_estado_check;
ALTER TABLE propietarios
  ADD CONSTRAINT propietarios_estado_check
  CHECK (estado IN ('Activo','Inactivo','En desinversión','Vendido'));

CREATE INDEX IF NOT EXISTS idx_propietarios_estado ON propietarios(estado);
