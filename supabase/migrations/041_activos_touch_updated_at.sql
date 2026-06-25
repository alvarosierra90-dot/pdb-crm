-- 041 — activos: updated_at automático al modificar
-- ------------------------------------------------------------
-- activos ya tiene la columna updated_at (001_schema) pero NO un trigger que la
-- refresque en cada UPDATE (011 solo cubría leads/mandatos/demandas/oferta_demanda).
-- Sin esto, modificar un activo (info, stacking, multimedia…) no cambia
-- updated_at y el listado no puede ordenar "lo último modificado primero".
--
-- touch_updated_at() ya existe (011_triggers_fk). Solo añadimos el trigger.

DROP TRIGGER IF EXISTS trg_activos_updated ON activos;
CREATE TRIGGER trg_activos_updated
  BEFORE UPDATE ON activos
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
