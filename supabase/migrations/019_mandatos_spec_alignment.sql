-- ============================================================
-- PDB · Migración 019 — Alinear schema mandatos con la spec
-- 1. tipo: sell|buy → alquiler|venta|demanda|consultoria (4 valores)
-- 2. Co-exclusividad: cuenta + contacto del agente externo
-- 3. Fees ampliados: % + € fijo + mínimo garantizado + sliding + compartido
-- 4. Motivo de cancelación
-- 5. Multi-activo: tabla puente mandato_activos
-- 6. ofertas.mandato_id FK
-- ============================================================

-- ------------------------------------------------------------
-- 1. tipo y constraint asociado
-- ------------------------------------------------------------
-- El CHECK original (sell|buy) y la constraint de "sell exige activo"
-- bloquean la nueva taxonomía. Se reemplazan por 4 tipos canónicos.
-- La regla "alquiler/venta exige al menos 1 activo" se enforza en
-- mandato_activos (vía aplicación + posible trigger futuro).

ALTER TABLE mandatos DROP CONSTRAINT IF EXISTS mandato_sell_requires_activo;
ALTER TABLE mandatos DROP CONSTRAINT IF EXISTS mandatos_tipo_check;

ALTER TABLE mandatos
  ADD CONSTRAINT mandatos_tipo_check
  CHECK (tipo IN ('alquiler','venta','demanda','consultoria'));

-- ------------------------------------------------------------
-- 2-4. Nuevas columnas
-- ------------------------------------------------------------
ALTER TABLE mandatos
  ADD COLUMN IF NOT EXISTS cuenta_agente_id      text    REFERENCES dynamics_accounts(dynamics_id),
  ADD COLUMN IF NOT EXISTS contacto_agente_id    text    REFERENCES dynamics_contacts(dynamics_id),
  ADD COLUMN IF NOT EXISTS fee_eur_fijo          numeric,
  ADD COLUMN IF NOT EXISTS fee_min_garantizado   numeric,
  ADD COLUMN IF NOT EXISTS fee_sliding_jsonb     jsonb,
  ADD COLUMN IF NOT EXISTS fee_compartido_jsonb  jsonb,
  ADD COLUMN IF NOT EXISTS motivo_cancelacion    text,
  ADD COLUMN IF NOT EXISTS titulo                text,
  ADD COLUMN IF NOT EXISTS fecha_inicio          date,
  ADD COLUMN IF NOT EXISTS preaviso_dias         integer,
  ADD COLUMN IF NOT EXISTS alerta_dias           integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS prorroga_tacita       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS prorroga_meses        integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exclusividad_modo     text
    CHECK (exclusividad_modo IS NULL OR exclusividad_modo IN ('exclusiva','coexclusiva')),
  ADD COLUMN IF NOT EXISTS responsable           text,
  ADD COLUMN IF NOT EXISTS equipo                text,
  ADD COLUMN IF NOT EXISTS departamento          text,
  ADD COLUMN IF NOT EXISTS provincia             text,
  ADD COLUMN IF NOT EXISTS zona                  text,
  ADD COLUMN IF NOT EXISTS notas                 text;

-- Cancelado exige motivo
ALTER TABLE mandatos DROP CONSTRAINT IF EXISTS mandato_cancelado_requires_motivo;
ALTER TABLE mandatos
  ADD CONSTRAINT mandato_cancelado_requires_motivo
  CHECK (estado <> 'cancelado' OR motivo_cancelacion IS NOT NULL);

-- ------------------------------------------------------------
-- 5. Tabla puente multi-activo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mandato_activos (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  mandato_id    uuid        NOT NULL REFERENCES mandatos(id) ON DELETE CASCADE,
  activo_id     uuid        NOT NULL REFERENCES activos(id),
  sba_asignada  numeric,
  notas         text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (mandato_id, activo_id)
);

ALTER TABLE mandato_activos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_all ON mandato_activos;
CREATE POLICY dev_all ON mandato_activos FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_mandato_activos_mandato ON mandato_activos(mandato_id);
CREATE INDEX IF NOT EXISTS idx_mandato_activos_activo  ON mandato_activos(activo_id);

-- ------------------------------------------------------------
-- 6. ofertas.mandato_id
-- ------------------------------------------------------------
ALTER TABLE ofertas
  ADD COLUMN IF NOT EXISTS mandato_id uuid REFERENCES mandatos(id);

CREATE INDEX IF NOT EXISTS idx_ofertas_mandato ON ofertas(mandato_id);

-- ------------------------------------------------------------
-- 7. Índices adicionales sobre mandatos
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_mandatos_tipo              ON mandatos(tipo);
CREATE INDEX IF NOT EXISTS idx_mandatos_fecha_vencimiento ON mandatos(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_mandatos_responsable       ON mandatos(responsable);
