-- 041 — propietarios: updated_at automático al editar
-- ------------------------------------------------------------
-- propietarios ya tiene la columna updated_at (001_schema) pero NO el trigger
-- que la refresca (011 solo cubría leads/mandatos/demandas/oferta_demanda).
-- Sin esto, dar de baja / editar un propietario no cambia updated_at y la lista
-- no puede ordenar "lo más reciente primero".
--
-- touch_updated_at() ya existe (011_triggers_fk). Solo añadimos el trigger.

DROP TRIGGER IF EXISTS trg_propietarios_updated ON propietarios;
CREATE TRIGGER trg_propietarios_updated
  BEFORE UPDATE ON propietarios
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
