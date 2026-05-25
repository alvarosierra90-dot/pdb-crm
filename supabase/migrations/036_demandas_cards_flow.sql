-- 036 — Demanda: estado 'en_negociacion' + vinculaciones para las cards del wizard
-- ============================================================================
-- Soporta el rediseño del FunnelStepCards de Demanda:
--   · Card Oferta  → demandas.oferta_id (FK a ofertas.id)
--   · Card Instrucción → demandas.instruccion_ref (text · master Dynamics)
--   · Card Estado  → estatus admite 'en_negociacion' además de los anteriores.
--
-- 'cerrada_concedido' se mantiene como valor canónico y se renombra a
-- "Cerrada por Savills" sólo en label (sin migración de valores).

-- 1. Ampliar el check de estatus para permitir 'en_negociacion'
ALTER TABLE demandas DROP CONSTRAINT IF EXISTS demandas_estatus_check;
ALTER TABLE demandas
  ADD CONSTRAINT demandas_estatus_check
  CHECK (estatus IN (
    'ongoing',
    'potencial',
    'en_negociacion',
    'paralizada',
    'descartada',
    'cerrada_concedido',
    'cerrada_perdida'
  ));

-- 2. Vincular oferta directa desde la demanda (card 4)
ALTER TABLE demandas
  ADD COLUMN IF NOT EXISTS oferta_id uuid REFERENCES ofertas(id);

-- 3. Vincular instrucción (master Dynamics — texto de la referencia)
ALTER TABLE demandas
  ADD COLUMN IF NOT EXISTS instruccion_ref text;

-- 4. Índices auxiliares
CREATE INDEX IF NOT EXISTS demandas_oferta_id_idx       ON demandas(oferta_id);
CREATE INDEX IF NOT EXISTS demandas_instruccion_ref_idx ON demandas(instruccion_ref);
