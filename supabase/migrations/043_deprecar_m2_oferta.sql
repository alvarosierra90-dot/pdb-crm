-- 043 — ofertas: deprecar m2_oferta (dup de superficie_disponible) · D7/glosario
-- ------------------------------------------------------------
-- `ofertas` tenía DOS columnas para la misma superficie de oferta:
--   superficie_disponible (canónica) y m2_oferta (legacy, 010:78).
-- El código hacía `superficie_disponible || m2_oferta` como parche.
-- Se ha unificado en superficie_disponible; esta migración retira el duplicado.
--
-- ⚠️ ORDEN OBLIGATORIO: aplicar DESPUÉS de desplegar el código que ya no
--    referencia m2_oferta (commit de deprecación, ya en Vercel). Si se aplica
--    ANTES, el código viejo que aún hace .select(... m2_oferta ...) devolvería
--    400 → data=null. Como esta migración solo retira una columna ya sin uso en
--    el código nuevo, aplicarla después es seguro.

-- 1. Backfill de rescate: filas legacy donde solo m2_oferta tenía valor.
UPDATE ofertas
SET    superficie_disponible = m2_oferta
WHERE  superficie_disponible IS NULL
  AND  m2_oferta IS NOT NULL;

-- 2. Eliminar la columna duplicada.
ALTER TABLE ofertas DROP COLUMN IF EXISTS m2_oferta;
