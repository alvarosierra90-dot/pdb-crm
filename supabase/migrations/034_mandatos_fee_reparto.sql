-- ============================================================
-- PDB · Migración 034 — fee_reparto en mandatos (fix 030)
-- ============================================================
-- La migración 030 añadió fee_reparto SOLO a propuestas, asumiendo
-- que el campo ya existía en mandatos. No era cierto: MarcarPropuestaGanada
-- intenta sincronizar propuesta.fee_reparto → mandato.fee_reparto y
-- PostgREST devuelve:
--   "Could not find the 'fee_reparto' column of 'mandatos' in the schema cache"
--
-- Esta migración añade la columna que faltaba.
-- ============================================================

ALTER TABLE mandatos
  ADD COLUMN IF NOT EXISTS fee_reparto jsonb DEFAULT '[]'::jsonb;
