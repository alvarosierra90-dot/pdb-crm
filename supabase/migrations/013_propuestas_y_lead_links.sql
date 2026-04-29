-- ============================================================
-- PDB · Migración 013 — Propuestas + tracking en leads
-- Crea la tabla propuestas y añade en leads los FK que faltaban
-- para saber qué se creó al transformar el lead (propuesta /
-- demanda / oferta).
-- ============================================================

-- ============================================================
-- 1. TABLA propuestas
-- ============================================================

CREATE TABLE IF NOT EXISTS propuestas (
  id                       uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ref                      text        UNIQUE NOT NULL,
  nombre                   text        NOT NULL,
  dynamics_opportunity_id  text        NOT NULL REFERENCES dynamics_opportunities(dynamics_id),
  dynamics_account_id      text        REFERENCES dynamics_accounts(dynamics_id),
  lead_id                  uuid        REFERENCES leads(id),
  tipo                     text,
  estado                   text        DEFAULT 'borrador'
                                       CHECK (estado IN ('borrador','presentada','standby','ganada','perdida','cancelada')),
  fees                     numeric,
  fecha_presentacion       date,
  fecha_resolucion         date,
  fecha_cierre             date,
  notas                    text,
  equipo                   text,
  responsable              text,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

ALTER TABLE propuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY dev_all ON propuestas FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_propuestas_oportunidad ON propuestas(dynamics_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_lead        ON propuestas(lead_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_estado      ON propuestas(estado);

-- updated_at automático
CREATE TRIGGER trg_propuestas_updated
BEFORE UPDATE ON propuestas
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- 2. AÑADIR nombre A demandas (para que las creadas desde Lead
--    tengan título legible sin abrir la ficha)
-- ============================================================

ALTER TABLE demandas ADD COLUMN IF NOT EXISTS nombre text;

-- ============================================================
-- 3. AMPLIAR leads CON FKs A LO QUE GENERA SU TRANSFORMACIÓN
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS propuesta_id uuid REFERENCES propuestas(id),
  ADD COLUMN IF NOT EXISTS demanda_id   uuid REFERENCES demandas(id),
  ADD COLUMN IF NOT EXISTS oferta_id    uuid REFERENCES ofertas(id);

CREATE INDEX IF NOT EXISTS idx_leads_propuesta ON leads(propuesta_id);
CREATE INDEX IF NOT EXISTS idx_leads_demanda   ON leads(demanda_id);
CREATE INDEX IF NOT EXISTS idx_leads_oferta    ON leads(oferta_id);
