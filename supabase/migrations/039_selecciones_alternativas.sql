-- 039 — Selección de alternativas (paquete enviable / microsite) para Demandas
-- ============================================================================
-- Una "Selección de alternativas" es un paquete que el broker arma desde el
-- mapa: un conjunto de ofertas de una demanda que se comparte con el cliente
-- mediante un enlace público (microsite /m/<token>). Es un EVENTO agrupador,
-- distinto de `oferta_demanda` (que es la alternativa atómica 1 oferta ↔ 1
-- demanda y de la que ya derivan las Vistas 360).
--
-- Decisión (usuario): la misma oferta puede aparecer en VARIAS selecciones de
-- la misma demanda a lo largo del tiempo (re-envíos) → tabla join.
--
-- Trazabilidad básica en la propia selección (vistas, ultima_vista). El log
-- de eventos detallado de la microsite (activos abiertos, tiempo, descargas,
-- favoritos) se añadirá en una migración posterior (fase analítica).

-- ── selecciones (el paquete / envío / microsite) ────────────────────────────
CREATE TABLE IF NOT EXISTS selecciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id    uuid NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
  token         text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  nombre        text,
  estado        text NOT NULL DEFAULT 'borrador',   -- borrador | enviada | vista | cerrada
  created_by    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  enviada_at    timestamptz,
  vistas        int NOT NULL DEFAULT 0,
  ultima_vista  timestamptz
);

-- ── seleccion_ofertas (qué ofertas/activos lleva cada selección) ────────────
CREATE TABLE IF NOT EXISTS seleccion_ofertas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seleccion_id  uuid NOT NULL REFERENCES selecciones(id) ON DELETE CASCADE,
  oferta_id     uuid REFERENCES ofertas(id)  ON DELETE SET NULL,
  activo_id     uuid REFERENCES activos(id)  ON DELETE SET NULL,
  orden         int DEFAULT 0,                       -- numeración visual en mapa/microsite
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seleccion_id, oferta_id)
);

CREATE INDEX IF NOT EXISTS idx_selecciones_demanda        ON selecciones(demanda_id);
CREATE INDEX IF NOT EXISTS idx_seleccion_ofertas_sel      ON seleccion_ofertas(seleccion_id);
CREATE INDEX IF NOT EXISTS idx_seleccion_ofertas_oferta   ON seleccion_ofertas(oferta_id);
CREATE INDEX IF NOT EXISTS idx_seleccion_ofertas_activo   ON seleccion_ofertas(activo_id);

-- ── RLS dev_all (mismo patrón que el resto del esquema) ─────────────────────
-- USING(true) abierto: la microsite pública (anon key) necesita leer la
-- selección por token y poder incrementar las vistas.
ALTER TABLE selecciones        ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_all ON selecciones;
CREATE POLICY dev_all ON selecciones        FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE seleccion_ofertas  ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_all ON seleccion_ofertas;
CREATE POLICY dev_all ON seleccion_ofertas  FOR ALL USING (true) WITH CHECK (true);
