-- 037 — Políticas RLS permisivas (dev) para negociaciones + actividades
-- ====================================================================
-- La migración 010 enabled RLS en demandas/ofertas/etc. y creó dev_all
-- policies. Pero negociaciones y negociacion_mensajes se crearon en 001
-- y se quedaron sin policy explícita, por lo que cualquier INSERT desde
-- el cliente anon (key publishable) falla con:
--   "new row violates row-level security policy for table negociaciones"
--
-- Soluciona el flujo "Pasar a En negociación" (IniciarNegociacionModal).
-- Mismo patrón dev_all que el resto del esquema.

-- ── negociaciones ───────────────────────────────────────────────────
ALTER TABLE negociaciones           ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_all ON negociaciones;
CREATE POLICY dev_all ON negociaciones           FOR ALL USING (true) WITH CHECK (true);

-- ── negociacion_mensajes (chat de la negociación) ───────────────────
ALTER TABLE negociacion_mensajes    ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_all ON negociacion_mensajes;
CREATE POLICY dev_all ON negociacion_mensajes    FOR ALL USING (true) WITH CHECK (true);

-- ── actividades (auditoría · ya tenía RLS pero por si acaso) ────────
-- El INSERT del modal escribe aquí una nota de auditoría tras crear
-- la negociación.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'actividades') THEN
    EXECUTE 'ALTER TABLE actividades ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS dev_all ON actividades';
    EXECUTE 'CREATE POLICY dev_all ON actividades FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;
