-- 038 — Demanda · campos de Standby (recordatorio próxima llamada + notas)
-- ========================================================================
-- Cuando el usuario pasa una demanda a estatus='paralizada' (Standby) la
-- card de Estado pide:
--   · Fecha de próxima llamada (recordatorio)
--   · Notas de lo hablado con el cliente
--
-- Se guardan en columnas dedicadas para poder filtrar por fecha de
-- recordatorio en futuros KPIs / dashboards.

ALTER TABLE demandas
  ADD COLUMN IF NOT EXISTS standby_proxima_llamada date,
  ADD COLUMN IF NOT EXISTS standby_notas           text;

CREATE INDEX IF NOT EXISTS demandas_standby_proxima_llamada_idx
  ON demandas(standby_proxima_llamada)
  WHERE estatus = 'paralizada';
