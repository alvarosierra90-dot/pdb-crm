-- ============================================================
-- PDB · Migration 006 — Persistencia completa
-- Tablas: desglose_ofertas, asignaciones_stacking,
--         caracteristicas_oferta, plazas_oferta, fotos_activo
-- Extensiones a: activos, ofertas, arrendatarios
-- ============================================================

-- ─── Extensiones a activos ──────────────────────────────────
ALTER TABLE activos ADD COLUMN IF NOT EXISTS propietario       text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS stacking_data     jsonb DEFAULT '[]'::jsonb;
-- stacking_data guarda el array completo de edificios del stacking plan

-- ─── Extensiones a ofertas ──────────────────────────────────
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS activo_ref              text;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS estado_espacio          text;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS origen_oferta           text;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS modalidad_visita        text;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS fecha_disponibilidad    date;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS divisible               boolean DEFAULT true;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS sup_aprox               boolean DEFAULT false;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS planta_tipo             numeric;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS confidencial            boolean DEFAULT false;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS equipo                  jsonb   DEFAULT '[]'::jsonb;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS colaboradores           jsonb   DEFAULT '[]'::jsonb;

-- ─── Extensiones a arrendatarios ────────────────────────────
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS edificio           text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS planta             text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS modulo             text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS inicio             date;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS estado_arr         text DEFAULT 'Vigente';
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS comentarios        text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS break_penalizacion text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS updated_at         timestamptz DEFAULT now();

-- ─── Desglose de ofertas ────────────────────────────────────
-- Cada oferta puede tener N sub-ofertas (Oferta 1, Oferta 2…)
-- que se arrastran al stacking plan por separado.
CREATE TABLE IF NOT EXISTS desglose_ofertas (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id   uuid        REFERENCES ofertas(id) ON DELETE CASCADE,
  nombre      text        NOT NULL DEFAULT 'Oferta 1',
  cuenta      text,                          -- empresa / cliente objetivo
  divisible   boolean     DEFAULT true,
  cargas_m2   numeric     DEFAULT 0,
  orden       integer     DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- ─── Asignaciones stacking ──────────────────────────────────
-- Qué desglose de oferta está asignado a qué planta de qué edificio.
-- Este es el dato comercial maestro que sincroniza:
--   - Stacking plan (visual)
--   - Espacios comercializables (tabla en FichaOferta)
CREATE TABLE IF NOT EXISTS asignaciones_stacking (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  activo_id           uuid        REFERENCES activos(id) ON DELETE CASCADE,
  oferta_id           uuid        REFERENCES ofertas(id) ON DELETE CASCADE,
  desglose_oferta_id  uuid        REFERENCES desglose_ofertas(id) ON DELETE CASCADE,
  edificio_id         text,                  -- 'A', 'B', 'D'…
  planta_id           text,                  -- 'P4', 'P3', 'PB'…
  sup                 numeric,               -- m² asignados (dato maestro)
  renta               numeric,               -- €/m²/mes
  precio              numeric,               -- €/m² si es venta
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  -- Una combinación edificio+planta+oferta debe ser única
  UNIQUE (activo_id, edificio_id, planta_id, desglose_oferta_id)
);

-- ─── Características oferta ─────────────────────────────────
-- Filtro comercial: el usuario elige qué características técnicas
-- del activo incluye en la ficha y exportaciones de esta oferta.
CREATE TABLE IF NOT EXISTS caracteristicas_oferta (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id                uuid        REFERENCES ofertas(id) ON DELETE CASCADE,
  caracteristica_origen_id integer,           -- id en ASSET_CARACT (frontend)
  tipo                     text,
  detalle                  text,
  anno                     integer,
  comentario               text,
  incluir                  boolean     DEFAULT true,
  created_at               timestamptz DEFAULT now()
);

-- ─── Plazas oferta ──────────────────────────────────────────
-- Solo las plazas que forman parte de esta operación concreta
-- (no las plazas totales del activo).
CREATE TABLE IF NOT EXISTS plazas_oferta (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id   uuid        REFERENCES ofertas(id) ON DELETE CASCADE,
  int_ext     text        DEFAULT 'Interior',   -- 'Interior' | 'Exterior'
  tipo        text        DEFAULT 'Coches',     -- 'Coches' | 'Motos' | 'Bicicletas' | 'Mixto'
  formato     text        DEFAULT 'Simple',     -- 'Simple' | 'Doble'
  cantidad    integer     DEFAULT 1,
  renta       numeric,                          -- €/plaza/mes (Alquiler)
  precio      numeric,                          -- €/plaza (Venta)
  created_at  timestamptz DEFAULT now()
);

-- ─── Fotos activo ────────────────────────────────────────────
-- Imágenes subidas a Supabase Storage, referenciadas aquí.
-- Bucket sugerido: 'fotos-activos' (público)
CREATE TABLE IF NOT EXISTS fotos_activo (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  activo_id    uuid        REFERENCES activos(id) ON DELETE CASCADE,
  storage_path text        NOT NULL,    -- ruta en el bucket: '{activo_id}/{filename}'
  url          text,                    -- URL pública de Supabase Storage
  nombre       text,
  tipo         text        DEFAULT 'exterior',  -- 'principal' | 'exterior' | 'interior' | 'plano'
  orden        integer     DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- ─── Índices ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_desglose_oferta_id      ON desglose_ofertas(oferta_id);
CREATE INDEX IF NOT EXISTS idx_asig_activo_id          ON asignaciones_stacking(activo_id);
CREATE INDEX IF NOT EXISTS idx_asig_oferta_id          ON asignaciones_stacking(oferta_id);
CREATE INDEX IF NOT EXISTS idx_asig_desglose_id        ON asignaciones_stacking(desglose_oferta_id);
CREATE INDEX IF NOT EXISTS idx_caract_oferta_id        ON caracteristicas_oferta(oferta_id);
CREATE INDEX IF NOT EXISTS idx_plazas_oferta_id        ON plazas_oferta(oferta_id);
CREATE INDEX IF NOT EXISTS idx_fotos_activo_id         ON fotos_activo(activo_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_activo_ref      ON ofertas(activo_ref);

-- ─── Row Level Security (abierto para desarrollo) ────────────
-- TODO en producción: añadir políticas por auth.uid()
ALTER TABLE desglose_ofertas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_stacking   ENABLE ROW LEVEL SECURITY;
ALTER TABLE caracteristicas_oferta  ENABLE ROW LEVEL SECURITY;
ALTER TABLE plazas_oferta           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_activo            ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "dev_all_desglose"   ON desglose_ofertas       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_all_asig"       ON asignaciones_stacking  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_all_caract"     ON caracteristicas_oferta FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_all_plazas"     ON plazas_oferta          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_all_fotos"      ON fotos_activo           FOR ALL USING (true) WITH CHECK (true);

-- ─── Políticas abiertas para tablas existentes (si no existen) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activos' AND policyname = 'dev_all_activos'
  ) THEN
    ALTER TABLE activos ENABLE ROW LEVEL SECURITY;
    CREATE POLICY dev_all_activos ON activos FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ofertas' AND policyname = 'dev_all_ofertas'
  ) THEN
    ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;
    CREATE POLICY dev_all_ofertas ON ofertas FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'arrendatarios' AND policyname = 'dev_all_arrendatarios'
  ) THEN
    ALTER TABLE arrendatarios ENABLE ROW LEVEL SECURITY;
    CREATE POLICY dev_all_arrendatarios ON arrendatarios FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'propietarios' AND policyname = 'dev_all_propietarios'
  ) THEN
    ALTER TABLE propietarios ENABLE ROW LEVEL SECURITY;
    CREATE POLICY dev_all_propietarios ON propietarios FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- ─── Storage bucket (ejecutar manualmente si no existe) ──────
-- En Supabase Dashboard → Storage → New bucket:
--   Nombre: fotos-activos
--   Public: true (para poder mostrar las imágenes sin auth)
--
-- O via SQL (requiere superuser / service_role):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('fotos-activos', 'fotos-activos', true)
-- ON CONFLICT (id) DO NOTHING;
