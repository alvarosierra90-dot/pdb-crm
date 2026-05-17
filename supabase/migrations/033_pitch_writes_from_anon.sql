-- ============================================================
-- 033_pitch_writes_from_anon.sql
-- ============================================================
-- Habilita escritura desde la app Pitch (anon key) a las tablas
-- `propuestas` y `documentos`. La app Pitch corre en otro Supabase
-- pero usa el cliente sbPDB con anon key para escribir aquí.
--
-- En dev mode todas las tablas son dev_all (USING true WITH CHECK true).
-- Esta migración:
--   1. Habilita RLS en `documentos` (no la tenía habilitada).
--   2. Crea política dev_all_documentos en `documentos`.
--   3. Confirma que la política dev_all en `propuestas` permite INSERT.
-- ============================================================

-- 1. documentos: habilitar RLS y permitir todo en dev
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_all_documentos ON documentos;
CREATE POLICY dev_all_documentos ON documentos
  FOR ALL USING (true) WITH CHECK (true);

-- 2. propuestas: la política `dev_all` ya existe (creada en 013_propuestas_y_lead_links.sql)
--    pero por idempotencia la recreamos por si la migración 013 no se aplicó completa.
ALTER TABLE propuestas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_all ON propuestas;
CREATE POLICY dev_all ON propuestas
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Relajar NOT NULL en dynamics_opportunity_id de propuestas
--    para permitir pitches que aún no tienen oportunidad Dynamics vinculada
--    (caso típico: pitch generado antes de que el lead se convierta en oportunidad).
ALTER TABLE propuestas
  ALTER COLUMN dynamics_opportunity_id DROP NOT NULL;

-- 4. Añadir columnas pitch_url + pitch_id en propuestas para vincular con
--    el pitch generado en la app externa (no es FK porque está en otro Supabase).
ALTER TABLE propuestas
  ADD COLUMN IF NOT EXISTS pitch_url text,
  ADD COLUMN IF NOT EXISTS pitch_external_id text;

-- 5. Añadir columnas pitch_url + pitch_id en documentos también, para identificar
--    documentos que vienen de la app de Pitch.
ALTER TABLE documentos
  ADD COLUMN IF NOT EXISTS pitch_external_id text;

CREATE INDEX IF NOT EXISTS idx_documentos_pitch ON documentos(pitch_external_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_pitch ON propuestas(pitch_external_id);
