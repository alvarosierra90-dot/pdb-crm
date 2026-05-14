-- 031: Documentos para Demanda
-- Estructura jsonb: [{ id, nombre, tipo, tamano, etiqueta, fecha, autor, url? }]
-- Por ahora sin storage real · solo metadata (mock-friendly)
-- Cuando se integre Supabase Storage, `url` apuntará a un blob.

ALTER TABLE demandas
  ADD COLUMN IF NOT EXISTS documentos jsonb DEFAULT '[]'::jsonb;
