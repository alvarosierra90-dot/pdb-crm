-- 032 · IDs cortos legibles para Propietarios y Arrendatarios
-- =============================================================
-- Hasta ahora propietarios.id era el UUID de Supabase (~36 chars),
-- y arrendatarios.ref existía pero estaba vacío en muchas filas.
-- Esta migración garantiza que ambos módulos tengan refs cortos
-- tipo "PRO-0000001" / "ARR-0000001" (7 dígitos, secuenciales).

-- ──────────────────────────────────────────────────────────────
-- 1) PROPIETARIOS — añadir columna ref + secuencia + default
-- ──────────────────────────────────────────────────────────────
ALTER TABLE propietarios ADD COLUMN IF NOT EXISTS ref text;

CREATE SEQUENCE IF NOT EXISTS propietarios_ref_seq START 1;

CREATE OR REPLACE FUNCTION generate_propietario_ref() RETURNS text AS $$
  SELECT 'PRO-' || LPAD(nextval('propietarios_ref_seq')::text, 7, '0');
$$ LANGUAGE SQL VOLATILE;

-- Backfill filas existentes sin ref
UPDATE propietarios
   SET ref = generate_propietario_ref()
 WHERE ref IS NULL OR ref = '';

-- UNIQUE + NOT NULL una vez backfilled
ALTER TABLE propietarios
  DROP CONSTRAINT IF EXISTS propietarios_ref_unique;
ALTER TABLE propietarios
  ADD CONSTRAINT propietarios_ref_unique UNIQUE (ref);
ALTER TABLE propietarios ALTER COLUMN ref SET NOT NULL;

-- Default automático para inserts futuros que no especifiquen ref
ALTER TABLE propietarios ALTER COLUMN ref SET DEFAULT generate_propietario_ref();

-- ──────────────────────────────────────────────────────────────
-- 2) ARRENDATARIOS — backfill + secuencia + default
-- (La columna ya existía desde la migración 007)
-- ──────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS arrendatarios_ref_seq START 1;

CREATE OR REPLACE FUNCTION generate_arrendatario_ref() RETURNS text AS $$
  SELECT 'ARR-' || LPAD(nextval('arrendatarios_ref_seq')::text, 7, '0');
$$ LANGUAGE SQL VOLATILE;

-- Backfill filas con ref vacía o NULL
UPDATE arrendatarios
   SET ref = generate_arrendatario_ref()
 WHERE ref IS NULL OR ref = '';

-- Si la secuencia se queda corta por filas pre-existentes con refs manuales
-- tipo ARR-1234567, sincronizamos el contador para evitar colisiones futuras.
DO $$
DECLARE max_existing int;
BEGIN
  SELECT MAX(NULLIF(regexp_replace(ref, '\D', '', 'g'), '')::int)
    INTO max_existing
    FROM arrendatarios
   WHERE ref ~ '^ARR-\d+$';
  IF max_existing IS NOT NULL THEN
    PERFORM setval('arrendatarios_ref_seq', GREATEST(max_existing + 1, nextval('arrendatarios_ref_seq')));
  END IF;
END$$;

ALTER TABLE arrendatarios ALTER COLUMN ref SET DEFAULT generate_arrendatario_ref();

-- UNIQUE constraint si no existe ya
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'arrendatarios_ref_unique'
  ) THEN
    EXECUTE 'ALTER TABLE arrendatarios ADD CONSTRAINT arrendatarios_ref_unique UNIQUE (ref)';
  END IF;
END$$;
