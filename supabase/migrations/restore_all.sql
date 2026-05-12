-- ============================================================
-- PDB · restore_all.sql
-- ============================================================
-- Concatenación de las 28 migraciones (001 → 028) en orden.
-- USO: pegar todo este archivo en el SQL Editor de Supabase y ejecutar.
-- IMPORTANTE: el script 001 lleva DROP TABLE IF EXISTS … CASCADE para
-- tablas principales. Es seguro porque tu BD está vacía. Si no lo está,
-- NO ejecutes este archivo.
--
-- Migraciones incluidas:
-- 001_schema.sql
-- 002_activos_propietario_seed.sql
-- 003_activos_direccion.sql
-- 004_activos_coordenadas.sql
-- 005_activos_superficies.sql
-- 006_persistencia.sql
-- 007_arrendatarios_extended.sql
-- 008_propietarios.sql
-- 009_ofertas_activa.sql
-- 010_crm_pipeline.sql
-- 011_triggers_fk.sql
-- 012_leads_seed.sql
-- 013_propuestas_y_lead_links.sql
-- 014_relax_required_fields.sql
-- 015_dynamics_account_fields.sql
-- 016_migrate_mock_demandas.sql
-- 017_demandas_motivo_descarte.sql
-- 018_motivo_descarte_oferta_propuesta.sql
-- 019_mandatos_spec_alignment.sql
-- 020_migrate_mock_mandatos.sql
-- 021_leads_equipo_trabajo.sql
-- 022_equipo_trabajo_downstream.sql
-- 023_propuesta_a_mandato_link.sql
-- 024_portfolios_seed_real.sql
-- 025_propietarios_estado.sql
-- 026_actividades_mandato.sql
-- 027_activo_competidores.sql
-- 028_activo_competidores_evolution.sql
--
-- Generado: 2026-05-12T10:26:33.662Z
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- ▼▼▼  001_schema.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · PropDatabase — Schema inicial
-- Ejecutar en Supabase SQL Editor
-- NOTA: Si ya ejecutaste una versión anterior, borra las tablas
-- con DROP TABLE IF EXISTS antes de volver a ejecutar.
-- ============================================================

DROP TABLE IF EXISTS negociacion_mensajes CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS arrendatarios CASCADE;
DROP TABLE IF EXISTS negociaciones CASCADE;
DROP TABLE IF EXISTS ofertas CASCADE;
DROP TABLE IF EXISTS activos CASCADE;
DROP TABLE IF EXISTS propietarios CASCADE;

-- Activos
CREATE TABLE activos (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ref                   text        UNIQUE NOT NULL,
  nombre                text        NOT NULL,
  zona                  text,
  ciudad                text        DEFAULT 'Madrid',
  pais                  text        DEFAULT 'España',
  area                  text,
  subzona               text,
  uso                   text        DEFAULT 'Oficinas',
  sba                   numeric,
  sba_neta              numeric,
  occupancy_rate        numeric,
  renta_zona            numeric,
  vacancia_zona         numeric,
  valor                 text,
  estado                text        DEFAULT 'Activo',
  dias_comercializacion integer     DEFAULT 0,
  anno_construccion     integer,
  anno_rehabilitacion   integer,
  n_edificios           integer     DEFAULT 1,
  n_plantas_sobre       integer,
  n_plantas_bajo        integer,
  calidad               text,
  leed                  text,
  breeam                text,
  esg_rating            text,
  certificacion_energetica text,
  wault                 numeric,
  yield_pct             numeric,
  precio_compra         text,
  ingresos_brutos       text,
  ref_catastral         text,
  lat                   numeric,
  lng                   numeric,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Propietarios / Portfolios
CREATE TABLE propietarios (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre               text        NOT NULL,
  ticker               text,
  tipo                 text,
  descripcion          text,
  cotizacion           numeric,
  cotizacion_variacion numeric,
  activos_count        integer     DEFAULT 0,
  m2_totales           bigint      DEFAULT 0,
  m2_disponible        bigint      DEFAULT 0,
  ofertas_activas      integer     DEFAULT 0,
  yield_pct            numeric,
  ultimo_contacto      date,
  created_at           timestamptz DEFAULT now()
);

-- Ofertas
CREATE TABLE ofertas (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ref                   text        UNIQUE NOT NULL,
  activo_id             uuid        REFERENCES activos(id),
  tipo_comercializacion text        DEFAULT 'Mandato Savills',
  tipologia             text        DEFAULT 'Oficina',
  tipo_operacion        text        DEFAULT 'Alquiler',
  estado                text        DEFAULT 'En curso',
  dias_comercializacion integer     DEFAULT 0,
  renta_m2              numeric,
  gastos_comunes        numeric,
  renta_mensual         numeric,
  renta_anual           numeric,
  superficie_disponible numeric,
  plazas                integer,
  broker_nombre         text,
  broker_equipo         text,
  propietario_nombre    text,
  propietario_empresa   text,
  comentarios           text,
  titulo_web            text,
  descripcion_web       text,
  publicado_savills     boolean     DEFAULT true,
  publicado_idealista   boolean     DEFAULT false,
  publicado_misoficinas boolean     DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Negociaciones
CREATE TABLE negociaciones (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ref                  text        UNIQUE NOT NULL,
  activo_id            uuid        REFERENCES activos(id),
  oferta_id            uuid        REFERENCES ofertas(id),
  parte_nombre         text,
  parte_equipo         text,
  contraparte_nombre   text,
  contraparte_empresa  text,
  contraparte_cargo    text,
  contraparte_email    text,
  contraparte_telefono text,
  estado               text        DEFAULT 'En negociación',
  ronda                integer     DEFAULT 1,
  fecha_inicio         date,
  ultima_actividad     date,
  cierre_estimado      date,
  superficie           numeric,
  renta_inicial        numeric,
  renta_ultima         numeric,
  duracion_anos        integer,
  carencia_meses       integer,
  gastos_incluidos     boolean     DEFAULT false,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Chat de negociación
CREATE TABLE negociacion_mensajes (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  negociacion_id uuid        REFERENCES negociaciones(id) ON DELETE CASCADE,
  tipo           text,
  autor_nombre   text,
  autor_empresa  text,
  autor_initials text,
  es_propiedad   boolean     DEFAULT true,
  mensaje        text,
  condiciones    jsonb,
  created_at     timestamptz DEFAULT now()
);

-- Documentos
CREATE TABLE documentos (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  activo_id      uuid        REFERENCES activos(id),
  oferta_id      uuid        REFERENCES ofertas(id),
  negociacion_id uuid        REFERENCES negociaciones(id),
  nombre         text        NOT NULL,
  categoria      text,
  fecha          date,
  autor          text,
  tamano         text,
  url            text,
  compartido     boolean     DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

-- Arrendatarios
CREATE TABLE arrendatarios (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  activo_id  uuid        REFERENCES activos(id),
  nombre     text        NOT NULL,
  uso        text,
  superficie numeric,
  renta      numeric,
  break_option date,
  vencimiento  date,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO activos (ref, nombre, zona, ciudad, uso, sba, sba_neta, occupancy_rate, renta_zona, valor, estado, dias_comercializacion, anno_construccion, anno_rehabilitacion, n_edificios, calidad, leed, esg_rating, wault, yield_pct, precio_compra, ingresos_brutos) VALUES
('MAD-OF-00189', 'P.E Avalon',               'M-30',    'Madrid',     'Oficinas',  46956, 44186, 78.4, 10.5, '130 M€',  'Activo',               127, 2003, 2018, 4, 'Prime', 'Gold', 'A', 2.8, 5.2, '130 M€', '3.2 M€/año'),
('ALC-OF-00231', 'Albatros',                 'A-1',     'Alcobendas', 'Oficinas',  53944,  NULL, 75.0, 12.5, '—',       'Activo',               127, NULL, NULL, 4,  NULL,    NULL,  NULL, NULL, NULL,  NULL,    NULL),
('BCN-OF-00312', 'Edificio Diagonal 95',     '22@',     'Barcelona',  'Oficinas',   9800,  NULL, 88.0, 22.0, '74 M€',   'Activo',                45, NULL, NULL, 1,  NULL,    NULL,  NULL, NULL, NULL,  NULL,    NULL),
('MAD-LG-00401', 'Park Logístico Getafe',    'Getafe',  'Madrid',     'Logístico', 24000,  NULL, 96.0,  6.8, '52 M€',   'Activo',                12, NULL, NULL, 1,  NULL,    NULL,  NULL, NULL, NULL,  NULL,    NULL),
('MAD-RT-00502', 'Centro Comercial Parquesur','Leganés','Madrid',     'Retail',    42000,  NULL, 91.0, 18.0, '210 M€',  'Activo',                 0, NULL, NULL, 1,  NULL,    NULL,  NULL, NULL, NULL,  NULL,    NULL),
('BCN-OF-00621', 'Torre Glòries',            '22@',     'Barcelona',  'Oficinas',  18500,  NULL,100.0, 28.0, '145 M€',  'Activo',                 0, NULL, NULL, 1, 'Prime',  NULL,  NULL, NULL, NULL,  NULL,    NULL),
('VLC-OF-00712', 'Torre Europa Valencia',    'Mestalla','Valencia',   'Oficinas',   7600,  NULL, 83.0, 14.5, '38 M€',   'En comercialización',   62, NULL, NULL, 1,  NULL,    NULL,  NULL, NULL, NULL,  NULL,    NULL),
('MAD-OF-00841', 'Parque Empresarial Norte', 'M-30',    'Madrid',     'Oficinas',  11200,  NULL, 79.0, 16.8, '68 M€',   'Activo',                34, NULL, NULL, 1,  NULL,    NULL,  NULL, NULL, NULL,  NULL,    NULL);

INSERT INTO propietarios (nombre, ticker, tipo, activos_count, m2_totales, m2_disponible, ofertas_activas, yield_pct, cotizacion, cotizacion_variacion, ultimo_contacto) VALUES
('Merlín Properties SOCIMI',  'MRL',  'SOCIMI', 64, 2100000, 180000, 31, 5.1, 11.24, 1.8,  '2026-03-12'),
('FREO Investments Spain SL', 'FREO', 'Fondo',  12,  340000,  28000,  8, 6.2,  NULL, NULL, '2026-03-05');

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  002_activos_propietario_seed.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migration 002
-- Añade campo propietario (text) a activos
-- Inserta los 15 activos restantes (Colonial, Merlin, GMP, Residencial)
-- Actualiza los 8 ya existentes con propietario y subzona
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Añadir columnas nuevas si no existen
ALTER TABLE activos ADD COLUMN IF NOT EXISTS propietario         text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS pais                text DEFAULT 'España';
ALTER TABLE activos ADD COLUMN IF NOT EXISTS cp                  text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS area                text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS tipo_activo         text DEFAULT 'Edificio';
ALTER TABLE activos ADD COLUMN IF NOT EXISTS estado_construccion text DEFAULT 'Construcción existente';
ALTER TABLE activos ADD COLUMN IF NOT EXISTS uso_secundario      text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS asset_manager       text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS clasificacion_urb   text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS uso_pgou            text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS calificacion_urb    text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS edificabilidad      text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS sup_parcela         numeric;

-- 2. Actualizar los 8 activos ya insertados con propietario y subzona correctos
UPDATE activos SET propietario = 'Barings RE',   subzona = 'Julián Camarillo' WHERE ref = 'MAD-OF-00189';
UPDATE activos SET propietario = 'Allianz RE',   subzona = 'Alcobendas',       ciudad = 'Madrid' WHERE ref = 'ALC-OF-00231';
UPDATE activos SET propietario = 'Grosvenor',    subzona = 'Poblenou'          WHERE ref = 'BCN-OF-00312';
UPDATE activos SET propietario = 'Prologis',     subzona = 'Getafe',           zona = 'Corredor del Henares', ciudad = 'Madrid' WHERE ref = 'MAD-LG-00401';
UPDATE activos SET propietario = 'Klepierre',    subzona = 'Leganés',          zona = 'Sur Madrid', ciudad = 'Madrid' WHERE ref = 'MAD-RT-00502';
UPDATE activos SET propietario = 'Merlin',        subzona = 'Poblenou'          WHERE ref = 'BCN-OF-00621';
UPDATE activos SET propietario = 'IBA Capital',   subzona = 'Benimaclet'        WHERE ref = 'VLC-OF-00712';
UPDATE activos SET propietario = 'CBRE IM',       subzona = 'Hortaleza'         WHERE ref = 'MAD-OF-00841';

-- 3. Insertar los 15 activos restantes

-- Colonial (4)
INSERT INTO activos (ref, nombre, zona, subzona, ciudad, uso, sba, occupancy_rate, renta_zona, valor, estado, dias_comercializacion, propietario) VALUES
('MAD-OF-COL001', 'Castellana 43',           'CBD',       'Recoletos',   'Madrid',    'Oficinas',  13500, 95.0, 36.0, '210 M€', 'Activo',               0,  'Colonial'),
('MAD-OF-COL002', 'Príncipe de Vergara 112', 'M-30',      'Salamanca',   'Madrid',    'Oficinas',   8096, 88.0, 28.5, '92 M€',  'Activo',              18,  'Colonial'),
('BCN-OF-COL001', 'Diagonal 530',            'Diagonal',  'Les Corts',   'Barcelona', 'Oficinas',  18200,100.0, 30.0, '280 M€', 'Activo',               0,  'Colonial'),
('BCN-OF-COL002', 'Paseo de Gracia 11',      'CBD',       'Eixample',    'Barcelona', 'Oficinas',   9396, 91.0, 42.0, '195 M€', 'Activo',               5,  'Colonial');

-- Merlin Properties (6)
INSERT INTO activos (ref, nombre, zona, subzona, ciudad, uso, sba, occupancy_rate, renta_zona, valor, estado, dias_comercializacion, propietario) VALUES
('MAD-OF-MRL001', 'Parque Adequa — Edif. 1',   'A-2',               'Arturo Soria',        'Madrid',      'Oficinas',   18858, 82.0, 14.0, '115 M€', 'Activo',               44,  'Merlin'),
('MAD-OF-MRL002', 'Torre Chamartín',            'Chamartín',         'CTBA',                'Madrid',      'Oficinas',   31992, 90.0, 25.0, '320 M€', 'Activo',               0,   'Merlin'),
('GUA-LG-MRL001', 'P.L. Guadalajara — Nave 1', 'Corredor A-2',      'Cabanillas del Campo','Guadalajara', 'Logístico',  41500,100.0,  5.2, '88 M€',  'Activo',               0,   'Merlin'),
('MAD-LG-MRL002', 'Cross Dock Coslada',         'Corredor del Henares','Coslada',           'Madrid',      'Logístico',  18000, 94.0,  6.2, '55 M€',  'Activo',              11,   'Merlin'),
('MAD-DC-MRL001', 'Data Center Alcalá',         'A-2',               'Alcalá de Henares',   'Madrid',      'Data Center', 4200,100.0,120.0, '145 M€', 'Activo',               0,   'Merlin'),
('MAD-DC-MRL002', 'Data Center Madrid Sur',     'Sur Madrid',        'Getafe',              'Madrid',      'Data Center', 6000, 67.0,115.0, '180 M€', 'En comercialización',  38,   'Merlin');

-- GMP (4)
INSERT INTO activos (ref, nombre, zona, subzona, ciudad, uso, sba, occupancy_rate, renta_zona, valor, estado, dias_comercializacion, propietario) VALUES
('MAD-OF-GMP001', 'Castellana 77',          'CBD',   'Castellana',  'Madrid', 'Oficinas', 18003, 93.0, 32.0, '245 M€', 'Activo',               0,  'GMP'),
('MAD-OF-GMP002', 'Capitán Haya 22',        'Azca',  'Azca',        'Madrid', 'Oficinas', 12500, 87.0, 24.5, '135 M€', 'Activo',              22,  'GMP'),
('MAD-OF-GMP003', 'Josefa Valcárcel 26',    'M-30',  'Arturo Soria','Madrid', 'Oficinas',  9800,100.0, 20.0, '88 M€',  'Activo',               0,  'GMP'),
('MAD-OF-GMP004', 'Hontanares 35 Alcobendas','A-1',  'Alcobendas',  'Madrid', 'Oficinas', 16200, 75.0, 16.5, '95 M€',  'En comercialización', 67,  'GMP');

-- Residencial (1)
INSERT INTO activos (ref, nombre, zona, subzona, ciudad, uso, sba, occupancy_rate, renta_zona, valor, estado, dias_comercializacion, propietario) VALUES
('MAD-RES-001', 'Residencial Valdebebas', 'Valdebebas', 'Valdebebas', 'Madrid', 'Residencial', 2940, 71.0, 16.0, '22 M€', 'En comercialización', 89, 'Neinor Homes');

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  003_activos_direccion.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migration 003
-- Añade columna direccion a activos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE activos ADD COLUMN IF NOT EXISTS direccion text;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  004_activos_coordenadas.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migration 004
-- Añade columna coordenadas a activos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE activos ADD COLUMN IF NOT EXISTS coordenadas text;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  005_activos_superficies.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migration 005
-- Añade sup_planta_tipo y ratio_perdida a activos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE activos ADD COLUMN IF NOT EXISTS sup_planta_tipo numeric;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS ratio_perdida   numeric;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  006_persistencia.sql
-- ════════════════════════════════════════════════════════════

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

-- Postgres no soporta CREATE POLICY IF NOT EXISTS; usamos DROP IF EXISTS + CREATE.
DROP POLICY IF EXISTS "dev_all_desglose" ON desglose_ofertas;
DROP POLICY IF EXISTS "dev_all_asig"     ON asignaciones_stacking;
DROP POLICY IF EXISTS "dev_all_caract"   ON caracteristicas_oferta;
DROP POLICY IF EXISTS "dev_all_plazas"   ON plazas_oferta;
DROP POLICY IF EXISTS "dev_all_fotos"    ON fotos_activo;
CREATE POLICY "dev_all_desglose"   ON desglose_ofertas       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_asig"       ON asignaciones_stacking  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_caract"     ON caracteristicas_oferta FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_plazas"     ON plazas_oferta          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_fotos"      ON fotos_activo           FOR ALL USING (true) WITH CHECK (true);

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

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  007_arrendatarios_extended.sql
-- ════════════════════════════════════════════════════════════

-- 007 — Extended arrendatarios schema
-- Run in Supabase SQL Editor

ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS ref                  text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS activo_ref           text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS tenant               text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS tenant_desconocido   boolean DEFAULT false;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS persona_fisica       boolean DEFAULT false;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS tenant_mayoritario   text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS propietario_cuenta   text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS anyo_firma           integer;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS trimestre            text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS asking_rent          numeric;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS closing_rent         numeric;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS meses_carencia       integer;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS plazas_int           integer DEFAULT 0;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS precio_int           numeric DEFAULT 0;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS plazas_ext           integer DEFAULT 0;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS precio_ext           numeric DEFAULT 0;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS agente_activo        text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS agente_pasivo        text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS aportacion_obras_m2  numeric;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS tipo_contrato        text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS anios_obligado       numeric;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS anios_obligado_2     numeric;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS meses_recordatorio   integer DEFAULT 3;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS color                text DEFAULT '#3b82f6';
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS sector               text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS area_zona            text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS zona                 text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS subzona              text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS responsable          text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS oferta_origen        text;
ALTER TABLE arrendatarios ADD COLUMN IF NOT EXISTS fecha_salida         text;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  008_propietarios.sql
-- ════════════════════════════════════════════════════════════

-- 008 — Propietarios table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS propietarios (
  id                text PRIMARY KEY,
  propietario       text NOT NULL,
  activo            text,
  activo_ref        text,
  zona              text,
  subzona           text,
  superficie        numeric,
  uso               text,
  area              text,
  tipologia         text    DEFAULT 'Asset deal',
  anyo_compra       integer,
  trimestre         text    DEFAULT 'Q1',
  precio_compra     text,
  estado_activo     text,
  regimen           text    DEFAULT 'Propiedad 100%',
  valoracion_actual text,
  perfil            text    DEFAULT 'Core',
  estrategia        text    DEFAULT 'Hold',
  cap_rate          numeric,
  yield_pct         numeric,
  tir_objetivo      numeric,
  horizonte_inv     integer,
  ltv               numeric,
  financiacion      numeric,
  banco             text,
  tipo_deuda        text,
  vencimiento_deuda text,
  estado            text    DEFAULT 'Activo',
  responsable       text,
  asset_manager     text,
  cif               text,
  tipo_entidad      text,
  pais              text,
  ciudad_sede       text,
  email             text,
  telefono          text,
  contacto_principal text,
  observaciones     text,
  created_at        timestamptz DEFAULT now()
);

-- Index for fast lookups by activo
CREATE INDEX IF NOT EXISTS propietarios_activo_ref_idx ON propietarios (activo_ref);

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  009_ofertas_activa.sql
-- ════════════════════════════════════════════════════════════

-- 009 — Ofertas: campo activa para vista activas/desactivadas
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS activa boolean DEFAULT true;
UPDATE ofertas SET activa = true WHERE activa IS NULL;

-- Cambiar estado por defecto a Disponible para nuevas ofertas
ALTER TABLE ofertas ALTER COLUMN estado SET DEFAULT 'Disponible';

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  010_crm_pipeline.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 010 — Pipeline CRM completo
-- Crea las tablas faltantes del lado CRM y alinea las existentes
-- con el modelo canónico de la spec PDB.
-- ============================================================

-- ============================================================
-- 1. TABLAS DE CACHE LOCAL DE DYNAMICS 365 (read-only en PDB)
-- ============================================================

CREATE TABLE IF NOT EXISTS dynamics_accounts (
  dynamics_id text PRIMARY KEY,
  nombre      text NOT NULL,
  tipo        text,
  sector      text,
  synced_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dynamics_contacts (
  dynamics_id        text PRIMARY KEY,
  nombre             text NOT NULL,
  email              text,
  telefono           text,
  cuenta_dynamics_id text REFERENCES dynamics_accounts(dynamics_id),
  synced_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dynamics_opportunities (
  dynamics_id         text PRIMARY KEY,
  nombre              text NOT NULL,
  tipo                text NOT NULL CHECK (tipo IN ('pitch_demanda','demanda','pitch_oferta','oferta','generica')),
  cuenta_dynamics_id  text REFERENCES dynamics_accounts(dynamics_id),
  contacto_dynamics_id text REFERENCES dynamics_contacts(dynamics_id),
  valor_estimado      numeric,
  estado              text,
  fecha_creacion      timestamptz,
  synced_at           timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dynamics_instructions (
  dynamics_id              text PRIMARY KEY,
  oportunidad_dynamics_id  text REFERENCES dynamics_opportunities(dynamics_id),
  estado                   text CHECK (estado IN ('kickoff','en_curso','cerrada_concedida','cerrada_perdida')),
  fee_savills              numeric,
  fecha_kickoff            timestamptz,
  fecha_cierre             timestamptz,
  synced_at                timestamptz DEFAULT now()
);

-- ============================================================
-- 2. ALINEACIÓN DE TABLAS EXISTENTES
-- ============================================================
-- propietarios actúa como "portfolio" en la spec. Le añadimos el FK a Cuenta Dynamics.

ALTER TABLE propietarios
  ADD COLUMN IF NOT EXISTS dynamics_account_id text REFERENCES dynamics_accounts(dynamics_id),
  ADD COLUMN IF NOT EXISTS descripcion text;

-- activos: añadir denormalización para Vista 360º + campos canónicos
ALTER TABLE activos
  ADD COLUMN IF NOT EXISTS portfolio_id uuid REFERENCES propietarios(id),
  ADD COLUMN IF NOT EXISTS dynamics_account_id text REFERENCES dynamics_accounts(dynamics_id),
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS uso_principal text,
  ADD COLUMN IF NOT EXISTS m2_totales numeric,
  ADD COLUMN IF NOT EXISTS m2_disponibles numeric,
  ADD COLUMN IF NOT EXISTS info_general jsonb,
  ADD COLUMN IF NOT EXISTS stacking_plan jsonb,
  ADD COLUMN IF NOT EXISTS caracteristicas jsonb,
  ADD COLUMN IF NOT EXISTS vista_360_data jsonb;

-- ofertas: añadir FKs denormalizadas + Dynamics opportunity link + tipo_mercado
ALTER TABLE ofertas
  ADD COLUMN IF NOT EXISTS portfolio_id uuid REFERENCES propietarios(id),
  ADD COLUMN IF NOT EXISTS dynamics_account_id text REFERENCES dynamics_accounts(dynamics_id),
  ADD COLUMN IF NOT EXISTS dynamics_opportunity_id text REFERENCES dynamics_opportunities(dynamics_id),
  ADD COLUMN IF NOT EXISTS tipo_mercado text NOT NULL DEFAULT 'mercado' CHECK (tipo_mercado IN ('mercado','off_market')),
  ADD COLUMN IF NOT EXISTS m2_oferta numeric,
  ADD COLUMN IF NOT EXISTS plazas_aparcamiento integer,
  ADD COLUMN IF NOT EXISTS condiciones jsonb,
  ADD COLUMN IF NOT EXISTS contenido_web jsonb,
  ADD COLUMN IF NOT EXISTS espacios_comerciales jsonb,
  ADD COLUMN IF NOT EXISTS fichas_comerciales jsonb,
  ADD COLUMN IF NOT EXISTS descriptivo text;

-- ============================================================
-- 3. TABLAS PDB NATIVAS QUE FALTABAN
-- ============================================================

-- Lead: nace en PDB, dispara creación en Dynamics al cualificar
CREATE TABLE IF NOT EXISTS leads (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre                text        NOT NULL,
  email                 text,
  telefono              text,
  tipo                  text        NOT NULL CHECK (tipo IN ('oferta','demanda','generico')),
  via                   text        CHECK (via IN ('pitch','directo')),
  fuente                text,
  estado                text        NOT NULL DEFAULT 'nuevo'
                                    CHECK (estado IN ('nuevo','en_cualificacion','cualificado','no_cualificado')),
  notas_cualificacion   text,
  motivo_no_cualificado text,
  dynamics_contact_id   text        REFERENCES dynamics_contacts(dynamics_id),
  dynamics_account_id   text        REFERENCES dynamics_accounts(dynamics_id),
  dynamics_opportunity_id text      REFERENCES dynamics_opportunities(dynamics_id),
  fecha_cualificacion   timestamptz,
  cualificado_por       text,
  origen_url            text,
  origen_canal          text,
  origen_campana        text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  CONSTRAINT lead_cualificado_requires_dynamics
    CHECK (estado <> 'cualificado' OR (dynamics_contact_id IS NOT NULL AND dynamics_account_id IS NOT NULL))
);

-- Mandato: contrato Savills, entidad PDB
CREATE TABLE IF NOT EXISTS mandatos (
  id                       uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ref                      text        UNIQUE NOT NULL,
  dynamics_opportunity_id  text        NOT NULL REFERENCES dynamics_opportunities(dynamics_id),
  dynamics_account_id      text        NOT NULL REFERENCES dynamics_accounts(dynamics_id),
  dynamics_instruction_id  text        REFERENCES dynamics_instructions(dynamics_id),
  tipo                     text        NOT NULL CHECK (tipo IN ('sell','buy')),
  via                      text        NOT NULL CHECK (via IN ('pitch','directo')),
  activo_id                uuid        REFERENCES activos(id),
  portfolio_id             uuid        REFERENCES propietarios(id),
  exclusividad             boolean     DEFAULT false,
  fecha_firma              date,
  fecha_vencimiento        date,
  fee_porcentaje           numeric,
  estado                   text        DEFAULT 'en_curso'
                                       CHECK (estado IN ('en_curso','cerrado','cancelado')),
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  CONSTRAINT mandato_sell_requires_activo
    CHECK (tipo <> 'sell' OR activo_id IS NOT NULL)
);

-- Demanda: requisitos de búsqueda de un cliente inquilino
CREATE TABLE IF NOT EXISTS demandas (
  id                       uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ref                      text        UNIQUE NOT NULL,
  dynamics_opportunity_id  text        NOT NULL REFERENCES dynamics_opportunities(dynamics_id),
  dynamics_account_id      text        NOT NULL REFERENCES dynamics_accounts(dynamics_id),
  mandato_id               uuid        REFERENCES mandatos(id),
  requisitos               jsonb,
  estatus                  text        DEFAULT 'ongoing'
                                       CHECK (estatus IN ('ongoing','paralizada','descartada','cerrada_concedido','cerrada_perdida')),
  notas                    text,
  equipos_involucrados     jsonb,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

-- Tabla puente Oferta-Demanda (Alternativas)
CREATE TABLE IF NOT EXISTS oferta_demanda (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  oferta_id             uuid        NOT NULL REFERENCES ofertas(id),
  demanda_id            uuid        NOT NULL REFERENCES demandas(id),
  activo_id             uuid        NOT NULL REFERENCES activos(id),
  portfolio_id          uuid        REFERENCES propietarios(id),
  condiciones_negociadas jsonb,
  match_score           numeric,
  estado_alternativa    text        DEFAULT 'propuesta'
                                    CHECK (estado_alternativa IN ('propuesta','enviada','visita_programada','visita_realizada','negociando','ganada','perdida','descartada')),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE(oferta_id, demanda_id)
);

-- Envíos de ofertas a cliente
CREATE TABLE IF NOT EXISTS envios_ofertas (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  demanda_id          uuid        NOT NULL REFERENCES demandas(id),
  oferta_demanda_ids  uuid[]      NOT NULL,
  fecha               timestamptz DEFAULT now(),
  canal               text        CHECK (canal IN ('email','presencial','llamada')),
  destinatarios       jsonb,
  notas               text,
  enviado_por         text
);

-- Visitas
CREATE TABLE IF NOT EXISTS visitas (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  oferta_demanda_id   uuid        NOT NULL REFERENCES oferta_demanda(id),
  oferta_id           uuid        NOT NULL REFERENCES ofertas(id),
  activo_id           uuid        NOT NULL REFERENCES activos(id),
  portfolio_id        uuid        REFERENCES propietarios(id),
  demanda_id          uuid        NOT NULL REFERENCES demandas(id),
  fecha               timestamptz NOT NULL,
  asistentes          jsonb,
  notas               text,
  resultado           text        CHECK (resultado IN ('positiva','neutral','negativa')),
  created_at          timestamptz DEFAULT now()
);

-- Vencimientos
CREATE TABLE IF NOT EXISTS vencimientos (
  id                              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  activo_id                       uuid        NOT NULL REFERENCES activos(id),
  portfolio_id                    uuid        REFERENCES propietarios(id),
  arrendatario_dynamics_account_id text       REFERENCES dynamics_accounts(dynamics_id),
  arrendatario_id                 uuid        REFERENCES arrendatarios(id),
  m2                              numeric,
  renta_actual                    numeric,
  fecha_vencimiento               date        NOT NULL,
  fecha_alerta                    date,
  estado                          text        DEFAULT 'vigente'
                                              CHECK (estado IN ('vigente','prorrogado','vencido','renovado','abandonado')),
  oportunidad_generada_dynamics_id text       REFERENCES dynamics_opportunities(dynamics_id),
  created_at                      timestamptz DEFAULT now()
);

-- Actividades (CRM cross-entidad)
CREATE TABLE IF NOT EXISTS actividades (
  id                          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo                        text        NOT NULL CHECK (tipo IN ('email','llamada','reunion','nota','tarea')),
  asunto                      text        NOT NULL,
  descripcion                 text,
  fecha                       timestamptz NOT NULL,
  estado                      text        DEFAULT 'abierto' CHECK (estado IN ('abierto','completado','cancelado')),
  cuenta_dynamics_id          text        REFERENCES dynamics_accounts(dynamics_id),
  contacto_dynamics_id        text        REFERENCES dynamics_contacts(dynamics_id),
  oportunidad_dynamics_id     text        REFERENCES dynamics_opportunities(dynamics_id),
  activo_id                   uuid        REFERENCES activos(id),
  oferta_id                   uuid        REFERENCES ofertas(id),
  demanda_id                  uuid        REFERENCES demandas(id),
  negociacion_id              uuid        REFERENCES negociaciones(id),
  lead_id                     uuid        REFERENCES leads(id),
  asignado_a                  text,
  created_at                  timestamptz DEFAULT now()
);

-- ============================================================
-- 4. AMPLIAR negociaciones CON FKs DENORMALIZADAS DE LA SPEC
-- ============================================================

ALTER TABLE negociaciones
  ADD COLUMN IF NOT EXISTS oferta_demanda_id uuid REFERENCES oferta_demanda(id),
  ADD COLUMN IF NOT EXISTS demanda_id uuid REFERENCES demandas(id),
  ADD COLUMN IF NOT EXISTS portfolio_id uuid REFERENCES propietarios(id),
  ADD COLUMN IF NOT EXISTS cuenta_inquilina_id text REFERENCES dynamics_accounts(dynamics_id),
  ADD COLUMN IF NOT EXISTS cuenta_propietaria_id text REFERENCES dynamics_accounts(dynamics_id),
  ADD COLUMN IF NOT EXISTS condiciones_acordadas jsonb,
  ADD COLUMN IF NOT EXISTS documentos_versionados jsonb,
  ADD COLUMN IF NOT EXISTS motivo_perdida text,
  ADD COLUMN IF NOT EXISTS fee_savills_estimado numeric,
  ADD COLUMN IF NOT EXISTS fecha_cierre timestamptz;

-- ============================================================
-- 5. RLS PERMISIVO EN DESARROLLO (igual al patrón existente)
-- ============================================================

ALTER TABLE dynamics_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamics_contacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamics_opportunities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamics_instructions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandatos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE oferta_demanda          ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios_ofertas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE vencimientos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades             ENABLE ROW LEVEL SECURITY;

CREATE POLICY dev_all ON dynamics_accounts       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON dynamics_contacts       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON dynamics_opportunities  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON dynamics_instructions   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON leads                   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON mandatos                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON demandas                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON oferta_demanda          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON envios_ofertas          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON visitas                 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON vencimientos            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY dev_all ON actividades             FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 6. ÍNDICES PARA VISTAS 360º Y FILTROS HABITUALES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_activos_portfolio        ON activos(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_activos_dynamics_account ON activos(dynamics_account_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_portfolio        ON ofertas(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_dynamics_account ON ofertas(dynamics_account_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_estado           ON ofertas(estado);
CREATE INDEX IF NOT EXISTS idx_leads_estado             ON leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_tipo               ON leads(tipo);
CREATE INDEX IF NOT EXISTS idx_mandatos_activo          ON mandatos(activo_id);
CREATE INDEX IF NOT EXISTS idx_mandatos_estado          ON mandatos(estado);
CREATE INDEX IF NOT EXISTS idx_demandas_estatus         ON demandas(estatus);
CREATE INDEX IF NOT EXISTS idx_oferta_demanda_demanda   ON oferta_demanda(demanda_id);
CREATE INDEX IF NOT EXISTS idx_oferta_demanda_oferta    ON oferta_demanda(oferta_id);
CREATE INDEX IF NOT EXISTS idx_oferta_demanda_activo    ON oferta_demanda(activo_id);
CREATE INDEX IF NOT EXISTS idx_oferta_demanda_estado    ON oferta_demanda(estado_alternativa);
CREATE INDEX IF NOT EXISTS idx_visitas_demanda          ON visitas(demanda_id);
CREATE INDEX IF NOT EXISTS idx_visitas_activo           ON visitas(activo_id);
CREATE INDEX IF NOT EXISTS idx_negociaciones_demanda    ON negociaciones(demanda_id);
CREATE INDEX IF NOT EXISTS idx_vencimientos_activo      ON vencimientos(activo_id);
CREATE INDEX IF NOT EXISTS idx_vencimientos_fecha       ON vencimientos(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_actividades_lead         ON actividades(lead_id);
CREATE INDEX IF NOT EXISTS idx_actividades_activo       ON actividades(activo_id);
CREATE INDEX IF NOT EXISTS idx_actividades_demanda      ON actividades(demanda_id);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha        ON actividades(fecha);

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  011_triggers_fk.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 011 — Triggers de FK denormalizadas
-- Mantiene la coherencia de las FK denormalizadas que permiten
-- queries planas en las Vistas 360º.
--
-- Patrón: BEFORE INSERT/UPDATE en hijo lee del padre y rellena.
-- Si el padre cambia, AFTER UPDATE propaga a hijos.
-- ============================================================

-- ============================================================
-- 1. ofertas: heredar portfolio_id y dynamics_account_id de activo
-- ============================================================

CREATE OR REPLACE FUNCTION sync_ofertas_fks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activo_id IS NOT NULL THEN
    SELECT a.portfolio_id, a.dynamics_account_id
    INTO   NEW.portfolio_id, NEW.dynamics_account_id
    FROM   activos a
    WHERE  a.id = NEW.activo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ofertas_fks ON ofertas;
CREATE TRIGGER trg_ofertas_fks
BEFORE INSERT OR UPDATE OF activo_id ON ofertas
FOR EACH ROW EXECUTE FUNCTION sync_ofertas_fks();

-- ============================================================
-- 2. oferta_demanda: heredar activo_id y portfolio_id de oferta
-- ============================================================

CREATE OR REPLACE FUNCTION sync_oferta_demanda_fks()
RETURNS TRIGGER AS $$
BEGIN
  SELECT o.activo_id, o.portfolio_id
  INTO   NEW.activo_id, NEW.portfolio_id
  FROM   ofertas o
  WHERE  o.id = NEW.oferta_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_oferta_demanda_fks ON oferta_demanda;
CREATE TRIGGER trg_oferta_demanda_fks
BEFORE INSERT OR UPDATE OF oferta_id ON oferta_demanda
FOR EACH ROW EXECUTE FUNCTION sync_oferta_demanda_fks();

-- ============================================================
-- 3. visitas: heredar todas las FKs de oferta_demanda
-- ============================================================

CREATE OR REPLACE FUNCTION sync_visitas_fks()
RETURNS TRIGGER AS $$
BEGIN
  SELECT od.oferta_id, od.activo_id, od.portfolio_id, od.demanda_id
  INTO   NEW.oferta_id, NEW.activo_id, NEW.portfolio_id, NEW.demanda_id
  FROM   oferta_demanda od
  WHERE  od.id = NEW.oferta_demanda_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_visitas_fks ON visitas;
CREATE TRIGGER trg_visitas_fks
BEFORE INSERT OR UPDATE OF oferta_demanda_id ON visitas
FOR EACH ROW EXECUTE FUNCTION sync_visitas_fks();

-- ============================================================
-- 4. negociaciones: heredar FKs de oferta_demanda + cuentas
-- ============================================================

CREATE OR REPLACE FUNCTION sync_negociaciones_fks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.oferta_demanda_id IS NOT NULL THEN
    SELECT od.oferta_id, od.activo_id, od.portfolio_id, od.demanda_id
    INTO   NEW.oferta_id, NEW.activo_id, NEW.portfolio_id, NEW.demanda_id
    FROM   oferta_demanda od
    WHERE  od.id = NEW.oferta_demanda_id;
  END IF;

  IF NEW.demanda_id IS NOT NULL AND NEW.cuenta_inquilina_id IS NULL THEN
    SELECT d.dynamics_account_id
    INTO   NEW.cuenta_inquilina_id
    FROM   demandas d
    WHERE  d.id = NEW.demanda_id;
  END IF;

  IF NEW.activo_id IS NOT NULL AND NEW.cuenta_propietaria_id IS NULL THEN
    SELECT a.dynamics_account_id
    INTO   NEW.cuenta_propietaria_id
    FROM   activos a
    WHERE  a.id = NEW.activo_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_negociaciones_fks ON negociaciones;
CREATE TRIGGER trg_negociaciones_fks
BEFORE INSERT OR UPDATE OF oferta_demanda_id, demanda_id, activo_id ON negociaciones
FOR EACH ROW EXECUTE FUNCTION sync_negociaciones_fks();

-- ============================================================
-- 5. mandatos: heredar portfolio_id de activo
-- ============================================================

CREATE OR REPLACE FUNCTION sync_mandatos_fks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activo_id IS NOT NULL THEN
    SELECT a.portfolio_id
    INTO   NEW.portfolio_id
    FROM   activos a
    WHERE  a.id = NEW.activo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mandatos_fks ON mandatos;
CREATE TRIGGER trg_mandatos_fks
BEFORE INSERT OR UPDATE OF activo_id ON mandatos
FOR EACH ROW EXECUTE FUNCTION sync_mandatos_fks();

-- ============================================================
-- 6. vencimientos: heredar portfolio_id de activo
-- ============================================================

CREATE OR REPLACE FUNCTION sync_vencimientos_fks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activo_id IS NOT NULL THEN
    SELECT a.portfolio_id
    INTO   NEW.portfolio_id
    FROM   activos a
    WHERE  a.id = NEW.activo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vencimientos_fks ON vencimientos;
CREATE TRIGGER trg_vencimientos_fks
BEFORE INSERT OR UPDATE OF activo_id ON vencimientos
FOR EACH ROW EXECUTE FUNCTION sync_vencimientos_fks();

-- ============================================================
-- 7. PROPAGACIÓN: cuando un activo cambia portfolio o propietario,
--    actualizar todos los hijos denormalizados.
-- ============================================================

CREATE OR REPLACE FUNCTION propagate_activo_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.portfolio_id IS DISTINCT FROM OLD.portfolio_id
     OR NEW.dynamics_account_id IS DISTINCT FROM OLD.dynamics_account_id THEN

    UPDATE ofertas
    SET    portfolio_id        = NEW.portfolio_id,
           dynamics_account_id = NEW.dynamics_account_id
    WHERE  activo_id = NEW.id;

    UPDATE oferta_demanda
    SET    portfolio_id = NEW.portfolio_id
    WHERE  activo_id = NEW.id;

    UPDATE visitas
    SET    portfolio_id = NEW.portfolio_id
    WHERE  activo_id = NEW.id;

    UPDATE negociaciones
    SET    portfolio_id          = NEW.portfolio_id,
           cuenta_propietaria_id = NEW.dynamics_account_id
    WHERE  activo_id = NEW.id;

    UPDATE mandatos
    SET    portfolio_id = NEW.portfolio_id
    WHERE  activo_id = NEW.id;

    UPDATE vencimientos
    SET    portfolio_id = NEW.portfolio_id
    WHERE  activo_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_propagate_activo ON activos;
CREATE TRIGGER trg_propagate_activo
AFTER UPDATE OF portfolio_id, dynamics_account_id ON activos
FOR EACH ROW EXECUTE FUNCTION propagate_activo_changes();

-- ============================================================
-- 8. updated_at automático en tablas con esa columna
-- ============================================================

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated      ON leads;
DROP TRIGGER IF EXISTS trg_mandatos_updated   ON mandatos;
DROP TRIGGER IF EXISTS trg_demandas_updated   ON demandas;
DROP TRIGGER IF EXISTS trg_oferta_demanda_updated ON oferta_demanda;

CREATE TRIGGER trg_leads_updated      BEFORE UPDATE ON leads          FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_mandatos_updated   BEFORE UPDATE ON mandatos       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_demandas_updated   BEFORE UPDATE ON demandas       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_oferta_demanda_updated BEFORE UPDATE ON oferta_demanda FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  012_leads_seed.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 012 — Extensión de leads + seeds Dynamics y leads
-- Añade los campos UI que faltan en leads, siembra cuentas/contactos
-- de Dynamics para que el typeahead funcione, y siembra leads de
-- ejemplo equivalentes a los del mock.
-- ============================================================

-- ============================================================
-- 1. EXTENDER leads CON CAMPOS UI
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS ref               text UNIQUE,
  ADD COLUMN IF NOT EXISTS prioridad         text CHECK (prioridad IN ('alta','media','baja')),
  ADD COLUMN IF NOT EXISTS equipo            text,
  ADD COLUMN IF NOT EXISTS responsable       text,
  ADD COLUMN IF NOT EXISTS descripcion       text,
  ADD COLUMN IF NOT EXISTS origen_anuncio    text,
  ADD COLUMN IF NOT EXISTS ultima_actividad  timestamptz,
  ADD COLUMN IF NOT EXISTS fecha_nulo        timestamptz,
  ADD COLUMN IF NOT EXISTS usuario_nulo      text;

CREATE INDEX IF NOT EXISTS idx_leads_ref       ON leads(ref);
CREATE INDEX IF NOT EXISTS idx_leads_prioridad ON leads(prioridad);

-- ============================================================
-- 2. SEED dynamics_accounts (cuentas que aparecen en los leads)
-- ============================================================

INSERT INTO dynamics_accounts (dynamics_id, nombre, tipo, sector) VALUES
  ('dyn-acc-001', 'Inversiones Familiar Velada',     'Family Office',    'Inversión'),
  ('dyn-acc-002', 'Grupo Mediática España',          'Corporación',      'Media'),
  ('dyn-acc-003', 'Hospitality Group Iberia SL',     'Corporación',      'Logística'),
  ('dyn-acc-004', 'Capital Industrial Partners',     'Inversor',         'Real Estate'),
  ('dyn-acc-005', 'Oracle Spain SL',                 'Multinacional',    'Tecnología'),
  ('dyn-acc-006', 'Neinor Homes',                    'Promotor',         'Residencial'),
  ('dyn-acc-007', 'Barings RE',                      'Fondo',            'Real Estate'),
  ('dyn-acc-008', 'Flexwork Solutions Spain SL',     'Corporación',      'Coworking'),
  ('dyn-acc-009', 'FREO Investments Spain SL',       'Fondo',            'Real Estate'),
  ('dyn-acc-010', 'Academia Global Formación SL',    'Corporación',      'Educación'),
  ('dyn-acc-011', 'Nexo Digital Media SL',           'Corporación',      'Media'),
  ('dyn-acc-012', 'Merlin Properties SOCIMI',        'SOCIMI',           'Real Estate'),
  ('dyn-acc-013', 'Colonial SOCIMI',                 'SOCIMI',           'Real Estate'),
  ('dyn-acc-014', 'GMP Property',                    'Family Office',    'Real Estate')
ON CONFLICT (dynamics_id) DO NOTHING;

-- ============================================================
-- 3. SEED dynamics_contacts
-- ============================================================

INSERT INTO dynamics_contacts (dynamics_id, nombre, email, telefono, cuenta_dynamics_id) VALUES
  ('dyn-ct-001', 'Marta Rodríguez',     'marta.rodriguez@example.com',  '+34 600 000 001', NULL),
  ('dyn-ct-002', 'José María Velada',   'jm.velada@example.com',        '+34 600 000 002', 'dyn-acc-001'),
  ('dyn-ct-003', 'Ignacio Lara',        'ignacio.lara@example.com',     '+34 600 000 003', 'dyn-acc-002'),
  ('dyn-ct-004', 'Laura Fernández',     'laura.fernandez@example.com',  '+34 600 000 004', 'dyn-acc-003'),
  ('dyn-ct-005', 'Eduardo Mancera',     'eduardo.mancera@example.com',  '+34 600 000 005', 'dyn-acc-004'),
  ('dyn-ct-006', 'David Sánchez',       'david.sanchez@example.com',    '+34 600 000 006', 'dyn-acc-005'),
  ('dyn-ct-007', 'Carmen Ruiz',         'carmen.ruiz@example.com',      '+34 600 000 007', 'dyn-acc-006'),
  ('dyn-ct-008', 'Sebastián Wagner',    'sebastian.wagner@example.com', '+34 600 000 008', 'dyn-acc-007'),
  ('dyn-ct-009', 'Elena Vidal',         'elena.vidal@example.com',      '+34 600 000 009', 'dyn-acc-008'),
  ('dyn-ct-010', 'Hans Müller',         'hans.muller@example.com',      '+34 600 000 010', 'dyn-acc-009'),
  ('dyn-ct-011', 'Roger Pi',            'roger.pi@example.com',         '+34 600 000 011', 'dyn-acc-010'),
  ('dyn-ct-012', 'Marina Costa',        'marina.costa@example.com',     '+34 600 000 012', 'dyn-acc-011'),
  ('dyn-ct-013', 'Pablo Estrada',       'pablo.estrada@example.com',    '+34 600 000 013', NULL),
  ('dyn-ct-014', 'Antonio Rivera',      'antonio.rivera@example.com',   '+34 600 000 014', NULL)
ON CONFLICT (dynamics_id) DO NOTHING;

-- ============================================================
-- 4. SEED leads (equivalente a los del mock con servicio→generico)
-- ============================================================

INSERT INTO leads (ref, nombre, tipo, via, estado, prioridad, equipo, responsable,
                   fuente, origen_canal, origen_campana, origen_anuncio, origen_url,
                   descripcion, ultima_actividad,
                   dynamics_account_id, dynamics_contact_id, fecha_cualificacion,
                   notas_cualificacion, motivo_no_cualificado, fecha_nulo, usuario_nulo,
                   created_at) VALUES
  ('LD-2026-0042', 'Búsqueda 2.000 m² oficinas Madrid centro',
    'demanda', NULL, 'nuevo', 'alta', 'Leasing Oficinas Madrid', 'Sierra Álvaro',
    'Web', 'Web corporativa', 'Q2-2026 Oficinas Madrid', 'Form contacto general', 'savills.es/contacto',
    'Multinacional tecnológica busca relocation HQ. Sup. 2.000 m². Eje Castellana o La Castellana.',
    now() - interval '2 hours',
    NULL, 'dyn-ct-001', NULL, NULL, NULL, NULL, NULL,
    '2026-04-26 14:32+02'),

  ('LD-2026-0041', 'Edificio en alquiler — Calle Serrano',
    'oferta', 'directo', 'cualificado', 'alta', 'Leasing Oficinas Madrid', 'Sierra Álvaro',
    'Recomendación', 'Recomendación', NULL, NULL, NULL,
    'Propietario quiere poner en alquiler edificio completo de 4.500 m² en Serrano 90.',
    now() - interval '1 day',
    'dyn-acc-001', 'dyn-ct-002', '2026-04-25 11:00+02', 'Propietario verificado, quiere lanzar Q3', NULL, NULL, NULL,
    '2026-04-25 10:15+02'),

  ('LD-2026-0040', 'Consultoría estratégica relocation grupo media',
    'generico', NULL, 'en_cualificacion', 'media', 'Advisory & Consultancy', 'GOMEZ Ignacio',
    'LinkedIn', 'LinkedIn', 'Advisory Strategic Q1', 'Post Savills Advisory', 'linkedin.com/savills-spain',
    'Quieren contratar servicio de consultoría estratégica inmobiliaria para reorganizar 3 sedes.',
    now() - interval '3 days',
    'dyn-acc-002', 'dyn-ct-003', NULL, NULL, NULL, NULL, NULL,
    '2026-04-24 09:48+02'),

  ('LD-2026-0039', 'Logística 12.000 m² A-2 corredor del Henares',
    'demanda', 'pitch', 'cualificado', 'alta', 'Industrial & Logistics', 'GOMEZ Ignacio',
    'Idealista', 'Idealista', NULL, 'Nave logística A-2 Coslada', 'idealista.com/anuncio/2348790',
    'Operador logístico 3PL busca plataforma 12.000 m² en corredor del Henares. Altura libre 11m.',
    now() - interval '4 days',
    'dyn-acc-003', 'dyn-ct-004', '2026-04-24 10:00+02', 'Cualificado y va a pitch competitivo con CBRE+JLL', NULL, NULL, NULL,
    '2026-04-23 16:20+02'),

  ('LD-2026-0038', 'Venta portfolio retail high street',
    'oferta', 'pitch', 'en_cualificacion', 'alta', 'Capital Markets', 'Sierra Álvaro',
    'Directo', 'Contacto directo', NULL, NULL, NULL,
    'CIP desinvierte cartera 8 locales high street en Madrid + Barcelona. Valor estimado 45 M€.',
    now() - interval '5 days',
    'dyn-acc-004', 'dyn-ct-005', NULL, NULL, NULL, NULL, NULL,
    '2026-04-22 11:05+02'),

  ('LD-2026-0037', 'Búsqueda data center 5MW',
    'demanda', NULL, 'en_cualificacion', 'media', 'Alternativos', 'Sierra Álvaro',
    'Belbex', 'Belbex', NULL, 'Data center San Fernando', 'belbex.com/dc/madrid-1',
    'Ampliación capacidad. 5MW IT load. Proximidad fibra óptica troncal. Madrid Sur preferente.',
    now() - interval '6 days',
    'dyn-acc-005', 'dyn-ct-006', NULL, NULL, NULL, NULL, NULL,
    '2026-04-21 13:50+02'),

  ('LD-2026-0036', 'Consultoría valoración portfolio residencial',
    'generico', NULL, 'cualificado', 'media', 'Valuations', 'GOMEZ Ignacio',
    'Web', 'Formulario consultoría', 'Valuations Q2', 'Form valoración portfolio', 'savills.es/valuations',
    'Valoración independiente portfolio 850 unidades BTR para refinanciación.',
    now() - interval '7 days',
    'dyn-acc-006', 'dyn-ct-007', '2026-04-21 09:00+02', 'Mandato directo, sin pitch', NULL, NULL, NULL,
    '2026-04-20 17:12+02'),

  ('LD-2026-0035', 'Local Gran Vía 200 m² flagship',
    'demanda', NULL, 'no_cualificado', 'baja', 'Retail', 'Sierra Álvaro',
    'Habitaclia', 'Habitaclia', NULL, 'Local Gran Vía 32', 'habitaclia.com/loc/8923',
    'Marca DTC busca flagship 200 m² Gran Vía o Preciados.',
    now() - interval '7 days',
    NULL, 'dyn-ct-013', NULL, NULL,
    'Presupuesto insuficiente', '2026-04-21 09:30+02', 'Sierra Álvaro',
    '2026-04-19 12:00+02'),

  ('LD-2026-0034', 'Comercialización P.E. Avalon edificio 4',
    'oferta', 'directo', 'cualificado', 'alta', 'Leasing Oficinas Madrid', 'Sierra Álvaro',
    'Recomendación', 'Recomendación', NULL, NULL, NULL,
    'Propietario quiere comercializar plantas 5-7 (3.200 m² netos) en exclusiva.',
    now() - interval '14 days',
    'dyn-acc-007', 'dyn-ct-008', '2026-04-19 10:00+02', 'Mandato directo firmado', NULL, NULL, NULL,
    '2026-04-18 10:30+02'),

  ('LD-2026-0033', '2.500 m² coworking flexible Barcelona',
    'demanda', NULL, 'en_cualificacion', 'media', 'Leasing Oficinas Barcelona', 'GOMEZ Ignacio',
    'LinkedIn', 'LinkedIn', 'Q2-2026 Coworking BCN', 'Post oficinas flexibles', 'linkedin.com/savills-spain',
    'Operador coworking expansión 22@. 2.500 m² + 200 puestos. Plug & play preferente.',
    now() - interval '14 days',
    'dyn-acc-008', 'dyn-ct-009', NULL, NULL, NULL, NULL, NULL,
    '2026-04-17 15:45+02'),

  ('LD-2026-0032', 'Spam — venta de leads inmobiliarios',
    'generico', NULL, 'no_cualificado', 'baja', NULL, NULL,
    'Email', 'Email entrante', NULL, NULL, NULL,
    'Email no solicitado ofreciendo bases de datos.',
    now() - interval '14 days',
    NULL, NULL, NULL, NULL,
    'Spam', '2026-04-16 08:25+02', 'Sistema',
    '2026-04-16 08:20+02'),

  ('LD-2026-0031', 'Hotel boutique centro histórico Sevilla',
    'demanda', NULL, 'nuevo', 'media', 'Hotels', 'Sierra Álvaro',
    'Web', 'Web corporativa', NULL, 'Form hotel investment', 'savills.es/hotels',
    'Cadena hotelera busca 30-50 habitaciones centro Sevilla. Edificio singular.',
    now() - interval '14 days',
    NULL, 'dyn-ct-014', NULL, NULL, NULL, NULL, NULL,
    '2026-04-15 19:08+02'),

  ('LD-2026-0030', 'Advisory expansión retail España',
    'generico', NULL, 'cualificado', 'alta', 'Advisory & Consultancy', 'GOMEZ Ignacio',
    'Evento', 'Evento / Networking', 'MIPIM 2026', NULL, NULL,
    'Cliente busca asesoramiento estratégico para abrir 12 puntos de venta en 18 meses.',
    now() - interval '14 days',
    'dyn-acc-011', 'dyn-ct-012', '2026-04-15 12:00+02', 'Cualificado tras MIPIM', NULL, NULL, NULL,
    '2026-04-14 11:25+02'),

  ('LD-2026-0028', 'Oficinas 800 m² Diagonal BCN',
    'demanda', 'directo', 'cualificado', 'media', 'Leasing Oficinas Barcelona', 'GOMEZ Ignacio',
    'Idealista', 'Idealista', NULL, 'Edificio Diagonal 95', 'idealista.com/anuncio/2349123',
    'Centro formación busca aulas + oficinas 800 m² eje Diagonal.',
    now() - interval '21 days',
    'dyn-acc-010', 'dyn-ct-011', '2026-04-11 10:00+02', 'Cualificado y derivado a Demanda', NULL, NULL, NULL,
    '2026-04-10 09:50+02')
ON CONFLICT (ref) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  013_propuestas_y_lead_links.sql
-- ════════════════════════════════════════════════════════════

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

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  014_relax_required_fields.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 014 — Relajar campos NOT NULL en propuestas
-- Cuando se crea un registro al transformar un Lead, no debemos
-- inventar contenido (nombre, tipo, notas...). Solo deben quedar
-- obligatorios los FK estructurales. La columna nombre ya era
-- nullable en demandas; en propuestas la liberamos también.
-- ============================================================

ALTER TABLE propuestas ALTER COLUMN nombre DROP NOT NULL;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  015_dynamics_account_fields.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 015 — Datos extendidos de Cuenta + estado
-- potencial + otros_contactos en demandas.
--
-- Objetivo: que la ficha de Demanda pueda heredar TODOS los datos
-- de la Cuenta vinculada en Dynamics sin reintroducir nada manual,
-- y que el campo estado contemple "Potencial" además de los actuales.
-- ============================================================

-- 1. Extender dynamics_accounts con datos de dirección/contacto
ALTER TABLE dynamics_accounts
  ADD COLUMN IF NOT EXISTS direccion       text,
  ADD COLUMN IF NOT EXISTS codigo_postal   text,
  ADD COLUMN IF NOT EXISTS ciudad          text,
  ADD COLUMN IF NOT EXISTS pais            text DEFAULT 'España',
  ADD COLUMN IF NOT EXISTS telefono        text,
  ADD COLUMN IF NOT EXISTS web             text;

-- 2. Permitir 'potencial' como estado de Demanda
ALTER TABLE demandas DROP CONSTRAINT IF EXISTS demandas_estatus_check;
ALTER TABLE demandas
  ADD CONSTRAINT demandas_estatus_check
  CHECK (estatus IN ('ongoing','potencial','paralizada','descartada','cerrada_concedido','cerrada_perdida'));

-- 3. Lista de otros contactos asociados a la demanda (referencias dynamics_contacts)
ALTER TABLE demandas
  ADD COLUMN IF NOT EXISTS otros_contactos jsonb;

-- 4. Poblar las cuentas seed con datos para que la herencia se vea real
UPDATE dynamics_accounts SET direccion = 'Calle Velázquez, 24', codigo_postal = '28001', ciudad = 'Madrid'                  WHERE dynamics_id = 'dyn-acc-001' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Avda. de la Industria, 42', codigo_postal = '28760', ciudad = 'Tres Cantos'        WHERE dynamics_id = 'dyn-acc-002' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle Goya, 12', codigo_postal = '28001', ciudad = 'Madrid'                       WHERE dynamics_id = 'dyn-acc-003' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Paseo de la Castellana, 89', codigo_postal = '28046', ciudad = 'Madrid'            WHERE dynamics_id = 'dyn-acc-004' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle José Echegaray, 6B', codigo_postal = '28230', ciudad = 'Las Rozas de Madrid' WHERE dynamics_id = 'dyn-acc-005' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Avenida de Bruselas, 26', codigo_postal = '28108', ciudad = 'Alcobendas'           WHERE dynamics_id = 'dyn-acc-006' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Paseo de la Castellana, 110', codigo_postal = '28046', ciudad = 'Madrid'           WHERE dynamics_id = 'dyn-acc-007' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle Alcalá, 75', codigo_postal = '28009', ciudad = 'Madrid'                     WHERE dynamics_id = 'dyn-acc-008' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle Príncipe de Vergara, 132', codigo_postal = '28002', ciudad = 'Madrid'        WHERE dynamics_id = 'dyn-acc-009' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle Serrano, 89', codigo_postal = '28006', ciudad = 'Madrid'                    WHERE dynamics_id = 'dyn-acc-010' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Avenida Diagonal, 615', codigo_postal = '08028', ciudad = 'Barcelona'              WHERE dynamics_id = 'dyn-acc-011' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Paseo de la Castellana, 257', codigo_postal = '28046', ciudad = 'Madrid'           WHERE dynamics_id = 'dyn-acc-012' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Avenida Diagonal, 532', codigo_postal = '08006', ciudad = 'Barcelona'              WHERE dynamics_id = 'dyn-acc-013' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle Luchana, 23', codigo_postal = '28010', ciudad = 'Madrid'                    WHERE dynamics_id = 'dyn-acc-014' AND direccion IS NULL;

UPDATE dynamics_accounts SET telefono = '+34 91 432 11 00', web = 'familiarvelada.es'   WHERE dynamics_id = 'dyn-acc-001' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 803 22 50', web = 'mediatica.es'        WHERE dynamics_id = 'dyn-acc-002' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 555 80 12', web = 'hospitality-iberia.com' WHERE dynamics_id = 'dyn-acc-003' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 575 99 30', web = 'capitalindustrial.es'   WHERE dynamics_id = 'dyn-acc-004' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 631 90 00', web = 'oracle.com/es'          WHERE dynamics_id = 'dyn-acc-005' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 484 56 00', web = 'neinor.com'            WHERE dynamics_id = 'dyn-acc-006' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 781 38 00', web = 'barings.com'           WHERE dynamics_id = 'dyn-acc-007' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 540 11 88', web = 'flexworksolutions.es'  WHERE dynamics_id = 'dyn-acc-008' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 290 41 22', web = 'freoinvestments.com'   WHERE dynamics_id = 'dyn-acc-009' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 720 60 11', web = 'academiaglobal.es'     WHERE dynamics_id = 'dyn-acc-010' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 93 414 90 90', web = 'nexodigital.com'       WHERE dynamics_id = 'dyn-acc-011' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 786 11 00', web = 'merlinproperties.com'  WHERE dynamics_id = 'dyn-acc-012' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 93 304 38 00', web = 'inmocolonial.com'      WHERE dynamics_id = 'dyn-acc-013' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 350 04 00', web = 'gmpproperty.com'       WHERE dynamics_id = 'dyn-acc-014' AND telefono IS NULL;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  016_migrate_mock_demandas.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 016 — Migrar las 11 demandas mock a Supabase
-- Las demandas hardcoded en DemandaList pasan a vivir en BBDD para
-- que sean editables igual que las creadas desde Lead.
-- ============================================================

-- 1. Cuentas Dynamics que faltaban en seed previo
INSERT INTO dynamics_accounts (dynamics_id, nombre, tipo, sector, direccion, codigo_postal, ciudad, pais, telefono) VALUES
  ('dyn-acc-015', 'Grupo Empresarial Altamira SL',  'Corporación',   'Industrial',  'Calle Orense, 81',         '28020', 'Madrid', 'España', '+34 91 567 23 40'),
  ('dyn-acc-016', 'Centro Médico Integra SL',       'Corporación',   'Sanitario',   'Avenida de Manoteras, 22', '28050', 'Madrid', 'España', '+34 91 372 88 90'),
  ('dyn-acc-017', 'Estudio Arquitectura Vértice',   'PYME',          'Arquitectura','Calle Goya, 42',           '28001', 'Madrid', 'España', '+34 91 401 55 12'),
  ('dyn-acc-018', 'Maritime Trading España',        'PYME',          'Trading',     'Gran Vía Diego López, 1',  '48001', 'Bilbao', 'España', '+34 94 423 78 60')
ON CONFLICT (dynamics_id) DO NOTHING;

-- 2. Oportunidades Dynamics: una por demanda mock (todas tipo 'demanda' directo)
INSERT INTO dynamics_opportunities (dynamics_id, nombre, tipo, cuenta_dynamics_id, estado, fecha_creacion) VALUES
  ('dyn-opp-mig-001', 'Búsqueda oficinas Madrid Norte — Altamira',                'demanda', 'dyn-acc-015', 'abierta', '2025-10-17 09:00+02'),
  ('dyn-opp-mig-002', 'Búsqueda espacios flexibles Madrid — Nexo Digital',        'demanda', 'dyn-acc-011', 'abierta', '2025-10-20 09:00+02'),
  ('dyn-opp-mig-003', 'Búsqueda local sanitario Madrid — Centro Médico Integra',  'demanda', 'dyn-acc-016', 'abierta', '2025-10-01 09:00+02'),
  ('dyn-opp-mig-004', 'Búsqueda inmueble — Hospitality Group',                    'demanda', 'dyn-acc-003', 'abierta', '2025-09-30 09:00+02'),
  ('dyn-opp-mig-005', 'Búsqueda oficina representativa — Vértice',                'demanda', 'dyn-acc-017', 'abierta', '2025-09-25 09:00+02'),
  ('dyn-opp-mig-006', 'Búsqueda operador flexibles nacional — Flexwork',          'demanda', 'dyn-acc-008', 'abierta', '2025-09-15 09:00+02'),
  ('dyn-opp-mig-007', 'Búsqueda nueva sede 2027 — Grupo Mediática',               'demanda', 'dyn-acc-002', 'abierta', '2025-09-12 09:00+02'),
  ('dyn-opp-mig-008', 'Inversión patrimonial oficinas — Capital Industrial',      'demanda', 'dyn-acc-004', 'abierta', '2025-09-04 09:00+02'),
  ('dyn-opp-mig-009', 'Búsqueda espacio formativo — Academia Global',             'demanda', 'dyn-acc-010', 'abierta', '2025-09-03 09:00+02'),
  ('dyn-opp-mig-010', 'Búsqueda inmueble premium — Familiar Velada',              'demanda', 'dyn-acc-001', 'abierta', '2025-07-16 09:00+02'),
  ('dyn-opp-mig-011', 'Búsqueda zona consolidada — Maritime Trading',             'demanda', 'dyn-acc-018', 'abierta', '2025-07-09 09:00+02')
ON CONFLICT (dynamics_id) DO NOTHING;

-- 3. Demandas: ref nuevo formato DEM-2025-XXXX, nombre = cuenta, requisitos rellenos
INSERT INTO demandas (ref, nombre, dynamics_opportunity_id, dynamics_account_id, estatus, requisitos, notas, created_at) VALUES

  ('DEM-2025-0001', 'Grupo Empresarial Altamira SL',
   'dyn-opp-mig-001', 'dyn-acc-015', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Oficina tradicional","sup_min":2200,"sup_max":3000,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Búsqueda de oficinas estándar en zona norte de Madrid, aprox. 2.500 m². Origen: Otras consultoras.',
   '2025-10-17 12:14+02'),

  ('DEM-2025-0002', 'Nexo Digital Media SL',
   'dyn-opp-mig-002', 'dyn-acc-011', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Coworking","sup_min":300,"sup_max":500,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Interesados en espacios flexibles en entorno tecnológico Madrid. Origen: Idealista.',
   '2025-10-20 10:30+02'),

  ('DEM-2025-0003', 'Centro Médico Integra SL',
   'dyn-opp-mig-003', 'dyn-acc-016', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Alternativos","tipologia":"Sanitario","sup_min":200,"sup_max":300,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Búsqueda de local u oficina en zona norte para uso sanitario. Origen: Web Savills.',
   '2025-10-01 11:00+02'),

  ('DEM-2025-0004', 'Hospitality Group Iberia SL',
   'dyn-opp-mig-004', 'dyn-acc-003', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Sede única (HQ)","sup_min":2000,"sup_max":6000,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Contacto directo. Gestión patrimonial busca inmueble para nueva operación. Origen: Web Savills.',
   '2025-09-30 14:00+02'),

  ('DEM-2025-0005', 'Estudio Arquitectura Vértice',
   'dyn-opp-mig-005', 'dyn-acc-017', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Oficina tradicional","sup_min":600,"sup_max":1000,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Demanda captada vía portal externo. Buscan oficina representativa. Origen: Web externa.',
   '2025-09-25 10:00+02'),

  ('DEM-2025-0006', 'Flexwork Solutions Spain SL',
   'dyn-opp-mig-006', 'dyn-acc-008', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Coworking","sup_min":800,"sup_max":6000,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid","Barcelona","Valencia"]}'::jsonb,
   'Demanda recurrente de operador de espacios flexibles a nivel nacional. Origen: Savills Internacional.',
   '2025-09-15 10:00+02'),

  ('DEM-2025-0007', 'Grupo Mediática España',
   'dyn-opp-mig-007', 'dyn-acc-002', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Sede única (HQ)","sup_min":13000,"sup_max":18000,"razon_busqueda":"Reagrupación","presupuesto_tipo":"Alquiler","provincias":["Madrid"],"timing":"2027-01-01"}'::jsonb,
   'Empresa de comunicación busca nueva sede para 2027. Proceso largo. Origen: Coverage.',
   '2025-09-12 10:00+02'),

  ('DEM-2025-0008', 'Capital Industrial Partners',
   'dyn-opp-mig-008', 'dyn-acc-004', 'ongoing',
   '{"naturaleza":"Inversión","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Oficina tradicional","sup_min":500,"sup_max":700,"razon_busqueda":"Reubicación","presupuesto_tipo":"Venta","provincias":["Madrid"]}'::jsonb,
   'Family office busca activo de oficinas como inversión patrimonial. Origen: Private Wealth.',
   '2025-09-04 10:00+02'),

  ('DEM-2025-0009', 'Academia Global Formación SL',
   'dyn-opp-mig-009', 'dyn-acc-010', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Alternativos","tipologia":"Educativo","sup_min":700,"sup_max":900,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Referenciado por colaborador externo. Necesitan espacio formativo. Origen: Colaborador.',
   '2025-09-03 10:00+02'),

  ('DEM-2025-0010', 'Inversiones Familiar Velada',
   'dyn-opp-mig-010', 'dyn-acc-001', 'ongoing',
   '{"naturaleza":"Inversión","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Oficina tradicional","sup_min":1400,"sup_max":2500,"razon_busqueda":"Creación","presupuesto_tipo":"Venta","provincias":["Madrid"]}'::jsonb,
   'Family office busca inmueble premium entre 1.800 y 2.500 m². Origen: Savills España.',
   '2025-07-16 10:00+02'),

  ('DEM-2025-0011', 'Maritime Trading España',
   'dyn-opp-mig-011', 'dyn-acc-018', 'paralizada',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Oficina tradicional","sup_min":220,"sup_max":400,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Bilbao"]}'::jsonb,
   'Captado vía portal externo. Búsqueda en zona consolidada. Origen: Otros sitios web.',
   '2025-07-09 10:00+02')

ON CONFLICT (ref) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  017_demandas_motivo_descarte.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 017 — Motivo de descarte en demandas
-- Cuando una demanda pasa a estatus = descartada, el usuario debe
-- registrar por qué. Este motivo queda persistido para consulta.
-- ============================================================

ALTER TABLE demandas
  ADD COLUMN IF NOT EXISTS motivo_descarte text;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  018_motivo_descarte_oferta_propuesta.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 018 — Motivo de descarte en Ofertas y Propuestas
-- Replica el campo motivo_descarte que existe en demandas para
-- mantener la misma dinámica en los otros módulos.
-- ============================================================

ALTER TABLE ofertas
  ADD COLUMN IF NOT EXISTS motivo_descarte text;

ALTER TABLE propuestas
  ADD COLUMN IF NOT EXISTS motivo_descarte text;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  019_mandatos_spec_alignment.sql
-- ════════════════════════════════════════════════════════════

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

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  020_migrate_mock_mandatos.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 020 — Migrar los 6 mandatos mock a Supabase
-- Los mandatos hardcoded en MandatosList.jsx pasan a vivir en BBDD.
-- Multi-activo se rellena en mandato_activos (puente).
-- ============================================================

-- 1. Oportunidades Dynamics asociadas (una por mandato; vía 'directo')
INSERT INTO dynamics_opportunities (dynamics_id, nombre, tipo, cuenta_dynamics_id, estado, fecha_creacion) VALUES
  ('dyn-opp-man-001', 'Mandato Leasing — P.E Avalon (P4 y P5)',                    'oferta',   'dyn-acc-012', 'abierta', '2025-02-01 09:00+01'),
  ('dyn-opp-man-002', 'Mandato Co-exclusiva Leasing — Albatros Edif. D',           'oferta',   'dyn-acc-012', 'abierta', '2025-06-15 09:00+02'),
  ('dyn-opp-man-003', 'Mandato Capital Markets — Torre Glòries',                   'oferta',   'dyn-acc-012', 'abierta', '2025-10-01 09:00+02'),
  ('dyn-opp-man-004', 'Mandato Valoraciones — Portfolio Merlin 2026',              'generica', 'dyn-acc-012', 'abierta', '2026-01-15 09:00+01'),
  ('dyn-opp-man-005', 'Mandato Co-exclusiva Leasing — Parque Empresarial Norte',   'oferta',   'dyn-acc-009', 'abierta', '2025-04-01 09:00+02'),
  ('dyn-opp-man-006', 'Mandato Leasing — Torre Europa Valencia',                   'oferta',   'dyn-acc-009', 'cerrada', '2024-03-01 09:00+01')
ON CONFLICT (dynamics_id) DO NOTHING;

-- 2. Mandatos
INSERT INTO mandatos (
  ref, dynamics_opportunity_id, dynamics_account_id,
  tipo, via, exclusividad, exclusividad_modo,
  cuenta_agente_id, contacto_agente_id,
  titulo, departamento, provincia, zona,
  fecha_firma, fecha_inicio, fecha_vencimiento,
  preaviso_dias, alerta_dias, prorroga_tacita, prorroga_meses,
  fee_porcentaje, responsable, equipo,
  estado, motivo_cancelacion, notas,
  created_at
) VALUES
  ('MAN-2501', 'dyn-opp-man-001', 'dyn-acc-012',
   'alquiler', 'directo', true, 'exclusiva',
   NULL, NULL,
   'Exclusiva Leasing — P.E Avalon · P4 y P5', 'Oficinas', 'Madrid', 'M-30',
   '2025-02-01', '2025-03-01', '2026-02-28',
   30, 60, true, 6,
   3.5, 'Sierra Alvaro', 'Leasing Oficinas MAD',
   'en_curso', NULL,
   'Mandato exclusivo Merlin para comercialización de plantas 4 y 5 del P.E Avalon.',
   '2025-02-01 12:00+01'),

  ('MAN-2502', 'dyn-opp-man-002', 'dyn-acc-012',
   'alquiler', 'directo', true, 'coexclusiva',
   NULL, NULL,
   'Coexclusiva Leasing — Albatros Edif. D', 'Oficinas', 'Madrid', 'A-1 · Alcobendas',
   '2025-06-15', '2025-07-01', '2026-06-30',
   30, 60, true, 3,
   2.5, 'Sierra Alvaro', 'Leasing Oficinas MAD',
   'en_curso', NULL,
   'Co-exclusiva con CBRE. Comercialización conjunta de Albatros Edif. D.',
   '2025-06-15 10:00+02'),

  ('MAN-2503', 'dyn-opp-man-003', 'dyn-acc-012',
   'venta', 'directo', true, 'exclusiva',
   NULL, NULL,
   'Exclusiva Capital Markets — Torre Glòries', 'Capital Markets', 'Barcelona', '22@',
   '2025-10-01', '2025-11-01', '2026-10-31',
   60, 90, false, 0,
   1.0, 'García Marta', 'Capital Markets MAD',
   'en_curso', NULL,
   'Mandato exclusivo de venta de Torre Glòries para Merlin.',
   '2025-10-01 10:00+02'),

  ('MAN-2504', 'dyn-opp-man-004', 'dyn-acc-012',
   'consultoria', 'directo', true, 'exclusiva',
   NULL, NULL,
   'Mandato Valoraciones — Portfolio Merlin 2026', 'Valoraciones', 'Madrid', NULL,
   '2026-01-15', '2026-02-01', '2026-07-31',
   30, 45, false, 0,
   NULL, 'López Carmen', 'Valoraciones MAD',
   'en_curso', NULL,
   'Mandato de valoraciones sobre 3 activos del portfolio Merlin (P.E Avalon, Torre Glòries, Park Logístico Getafe).',
   '2026-01-15 11:00+01'),

  ('MAN-2505', 'dyn-opp-man-005', 'dyn-acc-009',
   'alquiler', 'directo', true, 'coexclusiva',
   NULL, NULL,
   'Coexclusiva Leasing — Parque Empresarial Norte', 'Oficinas', 'Madrid', 'M-30',
   '2025-04-01', '2025-05-01', '2026-04-30',
   30, 60, true, 3,
   3.0, 'GOMEZ Ignacio', 'Leasing Oficinas MAD',
   'en_curso', NULL,
   'Co-exclusiva con JLL para comercialización de Parque Empresarial Norte (FREO).',
   '2025-04-01 10:00+02'),

  ('MAN-2506', 'dyn-opp-man-006', 'dyn-acc-009',
   'alquiler', 'directo', true, 'exclusiva',
   NULL, NULL,
   'Exclusiva Leasing — Torre Europa Valencia', 'Oficinas', 'Valencia', 'Mestalla',
   '2024-03-01', '2024-04-01', '2025-03-31',
   30, 60, true, 3,
   3.5, 'Sierra Alvaro', 'Leasing Oficinas MAD',
   'cerrado', NULL,
   'Mandato vencido. Operación cerrada en plazo, no renovado.',
   '2024-03-01 10:00+01')

ON CONFLICT (ref) DO NOTHING;

-- 3. Tabla puente mandato_activos (uno o varios activos por mandato)
INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 4050
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2501' AND a.ref = 'MAD-OF-00189'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 13486
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2502' AND a.ref = 'ALC-OF-00231'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 18500
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2503' AND a.ref = 'BCN-OF-00621'
ON CONFLICT DO NOTHING;

-- MAN-2504: Valoraciones multi-activo (3 activos)
INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 46956
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2504' AND a.ref = 'MAD-OF-00189'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 18500
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2504' AND a.ref = 'BCN-OF-00621'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 24000
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2504' AND a.ref = 'MAD-LG-00401'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 11200
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2505' AND a.ref = 'MAD-OF-00841'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 7600
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2506' AND a.ref = 'VLC-OF-00712'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  021_leads_equipo_trabajo.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 021 — Equipo de trabajo del Lead
-- Spec: roles diferenciados Principal · Soporte · Colaborador.
-- Pueden ser varios Principales y miembros de equipos distintos
-- (= "equipo de trabajo"). Se hereda a Oportunidad → Demanda/Oferta
-- → Mandato downstream (la propagación se implementa en una fase
-- posterior; este paso solo añade la columna del Lead).
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS equipo_trabajo jsonb DEFAULT '[]'::jsonb;

-- Backfill: si el lead ya tiene `responsable` (texto) y `equipo`, los
-- convertimos en un único miembro con rol = 'Principal' para que la
-- nueva UI muestre algo coherente desde el primer render.
UPDATE leads
   SET equipo_trabajo = jsonb_build_array(
         jsonb_build_object(
           'nombre',  responsable,
           'equipo',  COALESCE(equipo, ''),
           'rol',     'Principal'
         )
       )
 WHERE responsable IS NOT NULL
   AND (equipo_trabajo IS NULL OR jsonb_array_length(equipo_trabajo) = 0);

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  022_equipo_trabajo_downstream.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 022 — Propagar equipo_trabajo a downstream
-- El equipo de trabajo del Lead se hereda a Propuesta/Demanda/Oferta/
-- Mandato cuando se transforma. Cada entidad mantiene su propia copia
-- editable (cualquier Principal puede ajustarla aguas abajo sin
-- contaminar al lead origen).
-- ============================================================

ALTER TABLE propuestas ADD COLUMN IF NOT EXISTS equipo_trabajo jsonb DEFAULT '[]'::jsonb;
ALTER TABLE demandas   ADD COLUMN IF NOT EXISTS equipo_trabajo jsonb DEFAULT '[]'::jsonb;
ALTER TABLE ofertas    ADD COLUMN IF NOT EXISTS equipo_trabajo jsonb DEFAULT '[]'::jsonb;
ALTER TABLE mandatos   ADD COLUMN IF NOT EXISTS equipo_trabajo jsonb DEFAULT '[]'::jsonb;

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  023_propuesta_a_mandato_link.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 023 — Cascada Propuesta ganada → Mandato
-- Añade FK propuesta_id en mandatos para trazar el origen de la
-- cascada (Propuesta → Instrucción → Mandato) cuando se gana un
-- pitch.
-- ============================================================

ALTER TABLE mandatos
  ADD COLUMN IF NOT EXISTS propuesta_id uuid REFERENCES propuestas(id);

CREATE INDEX IF NOT EXISTS idx_mandatos_propuesta ON mandatos(propuesta_id);

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  024_portfolios_seed_real.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 024 — Portfolios reales con activos asignados
-- ------------------------------------------------------------
-- Hoy `propietarios` solo tiene Merlín y FREO seed, mientras que
-- `activos` lleva un campo de texto `propietario` con muchos otros
-- nombres (Colonial, GMP, Barings, Allianz, Klepierre, Prologis,
-- Grosvenor, IBA Capital, CBRE IM, Neinor Homes). Esta migración:
--   1) Da de alta esos propietarios en la tabla (sin duplicar si ya
--      existen, comprobando por `nombre`).
--   2) Cablea activos.portfolio_id apuntando al propietario que
--      les corresponde (matching por nombre, con alias para Merlin).
--   3) Rellena coordenadas en los activos del seed que no las tenían
--      para que el mapa del Portfolio muestre chinchetas reales.
--   4) Recomputa los contadores agregados que /portfolios muestra.
-- Idempotente.
-- ============================================================

-- 1) Alta de propietarios faltantes (idempotente: solo inserta si no
--    existe ya una fila con el mismo nombre).
INSERT INTO propietarios (nombre, tipo, descripcion)
SELECT v.nombre, v.tipo, v.descripcion
FROM (VALUES
  ('Colonial',         'SOCIMI',       'Inmobiliaria Colonial — oficinas prime Madrid/Barcelona/París'),
  ('GMP',              'Family Office','Patrimonialista español — oficinas Madrid'),
  ('Barings RE',       'Fondo',        'Real estate manager global'),
  ('Allianz RE',       'Aseguradora',  'Brazo inmobiliario de Allianz'),
  ('Klepierre',        'SOCIMI',       'Centros comerciales paneuropeos'),
  ('Prologis',         'Fondo',        'Líder logístico global'),
  ('Grosvenor',        'Family Office','Grupo patrimonial británico'),
  ('IBA Capital',      'Fondo',        'Gestora value-add hispano'),
  ('CBRE IM',          'Fondo',        'CBRE Investment Management'),
  ('Neinor Homes',     'Promotora',    'Promotora residencial cotizada')
) AS v(nombre, tipo, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM propietarios p WHERE p.nombre = v.nombre);

-- 2) Cableado activos.portfolio_id por nombre
UPDATE activos a
SET portfolio_id = p.id
FROM propietarios p
WHERE a.propietario = p.nombre
  AND (a.portfolio_id IS NULL OR a.portfolio_id <> p.id);

-- Alias: 'Merlin' (text en activos) → 'Merlín Properties SOCIMI'
UPDATE activos a
SET portfolio_id = p.id
FROM propietarios p
WHERE a.propietario = 'Merlin'
  AND p.nombre = 'Merlín Properties SOCIMI'
  AND (a.portfolio_id IS NULL OR a.portfolio_id <> p.id);

-- 3) Coordenadas para los activos del seed (formato "lat, lng")
UPDATE activos SET coordenadas = '40.5121, -3.6574' WHERE ref = 'MAD-OF-00189' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.5340, -3.6467' WHERE ref = 'ALC-OF-00231' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '41.4047, 2.1933'  WHERE ref = 'BCN-OF-00312' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.3217, -3.7325' WHERE ref = 'MAD-LG-00401' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.3390, -3.7708' WHERE ref = 'MAD-RT-00502' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '41.4036, 2.1894'  WHERE ref = 'BCN-OF-00621' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '39.4750, -0.3576' WHERE ref = 'VLC-OF-00712' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.4895, -3.6821' WHERE ref = 'MAD-OF-00841' AND (coordenadas IS NULL OR coordenadas = '');

UPDATE activos SET coordenadas = '40.4321, -3.6912' WHERE ref = 'MAD-OF-COL001' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.4358, -3.6764' WHERE ref = 'MAD-OF-COL002' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '41.3877, 2.1245'  WHERE ref = 'BCN-OF-COL001' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '41.3943, 2.1652'  WHERE ref = 'BCN-OF-COL002' AND (coordenadas IS NULL OR coordenadas = '');

UPDATE activos SET coordenadas = '40.4634, -3.6510' WHERE ref = 'MAD-OF-MRL001' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.4747, -3.6850' WHERE ref = 'MAD-OF-MRL002' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.6386, -3.2289' WHERE ref = 'GUA-LG-MRL001' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.4263, -3.4760' WHERE ref = 'MAD-LG-MRL002' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.4818, -3.3653' WHERE ref = 'MAD-DC-MRL001' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.3217, -3.7325' WHERE ref = 'MAD-DC-MRL002' AND (coordenadas IS NULL OR coordenadas = '');

UPDATE activos SET coordenadas = '40.4476, -3.6886' WHERE ref = 'MAD-OF-GMP001' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.4524, -3.6915' WHERE ref = 'MAD-OF-GMP002' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.4496, -3.6479' WHERE ref = 'MAD-OF-GMP003' AND (coordenadas IS NULL OR coordenadas = '');
UPDATE activos SET coordenadas = '40.5390, -3.6457' WHERE ref = 'MAD-OF-GMP004' AND (coordenadas IS NULL OR coordenadas = '');

UPDATE activos SET coordenadas = '40.4926, -3.6182' WHERE ref = 'MAD-RES-001' AND (coordenadas IS NULL OR coordenadas = '');

-- 4) Recomputar contadores agregados que /portfolios muestra.
UPDATE propietarios p SET
  activos_count = COALESCE(s.cnt,    0),
  m2_totales    = COALESCE(s.m2_tot,  0),
  m2_disponible = COALESCE(s.m2_disp, 0)
FROM (
  SELECT portfolio_id,
         COUNT(*)                                  AS cnt,
         SUM(COALESCE(m2_totales, sba, 0))::bigint AS m2_tot,
         SUM(COALESCE(m2_disponibles, 0))::bigint  AS m2_disp
  FROM activos
  WHERE portfolio_id IS NOT NULL
  GROUP BY portfolio_id
) s
WHERE p.id = s.portfolio_id;

-- Resetear a 0 los propietarios sin activos (por si quedaba algún
-- valor mock en activos_count del seed inicial).
UPDATE propietarios SET activos_count = 0, m2_totales = 0, m2_disponible = 0
WHERE id NOT IN (SELECT DISTINCT portfolio_id FROM activos WHERE portfolio_id IS NOT NULL);

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  025_propietarios_estado.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 025 — Propietarios pueden desactivarse
-- ------------------------------------------------------------
-- Un propietario puede pasar a inactivo (vendió todo y no ha
-- recomprado, en desinversión, fondo cerrado…) sin borrarse: la
-- historia de los activos sigue apuntando a él. Añadimos un estado
-- igual que ofertas/demandas, fecha_desactivacion y motivo.
-- ============================================================

ALTER TABLE propietarios
  ADD COLUMN IF NOT EXISTS estado               text DEFAULT 'Activo',
  ADD COLUMN IF NOT EXISTS fecha_desactivacion  date,
  ADD COLUMN IF NOT EXISTS motivo_desactivacion text;

-- CHECK constraint para los 4 estados canónicos. Drop antes por si
-- ya existía con otro listado.
ALTER TABLE propietarios DROP CONSTRAINT IF EXISTS propietarios_estado_check;
ALTER TABLE propietarios
  ADD CONSTRAINT propietarios_estado_check
  CHECK (estado IN ('Activo','Inactivo','En desinversión','Vendido'));

CREATE INDEX IF NOT EXISTS idx_propietarios_estado ON propietarios(estado);

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  026_actividades_mandato.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 026 — Actividades vinculadas a Mandato
-- La tabla `actividades` (010_crm_pipeline) tiene FK a lead, oferta,
-- demanda, negociación y oportunidad. Faltaba mandato_id, necesario
-- para listar actividades en FichaMandato (tab man-act).
-- ============================================================

ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS mandato_id uuid REFERENCES mandatos(id);

CREATE INDEX IF NOT EXISTS idx_actividades_mandato ON actividades(mandato_id);

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  027_activo_competidores.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 027 — Competidores por Activo
-- ============================================================
-- Permite que el responsable de un Activo registre qué OTROS Activos
-- considera competidores directos. Esta lista alimenta los Informes
-- de gestión (sección "Principales competidores"): por cada competidor
-- se muestran sus ofertas activas, transacciones cerradas en los últimos
-- 12 meses, ocupación, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS activo_competidores (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  activo_id      uuid        NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
  competidor_id  uuid        NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
  motivo         text,                     -- "Mismo edificio", "Misma zona", "Misma renta", etc.
  notas          text,
  created_at     timestamptz DEFAULT now(),
  created_by     text,
  UNIQUE(activo_id, competidor_id),
  CHECK (activo_id <> competidor_id)       -- un activo no se compite a sí mismo
);

ALTER TABLE activo_competidores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_all ON activo_competidores;
CREATE POLICY dev_all ON activo_competidores FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activo_competidores_activo     ON activo_competidores(activo_id);
CREATE INDEX IF NOT EXISTS idx_activo_competidores_competidor ON activo_competidores(competidor_id);

-- ════════════════════════════════════════════════════════════
-- ▼▼▼  028_activo_competidores_evolution.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PDB · Migración 028 — Evolución de Competidores
-- ============================================================
-- Convierte la pestaña Competidores en una herramienta de benchmarking:
--  - motivos pasa de texto libre a multi-select (array)
--  - orden para reordenar por relevancia
--  - imagen_url para mostrar la foto principal del competidor en la card
-- ============================================================

ALTER TABLE activo_competidores
  ADD COLUMN IF NOT EXISTS motivos     jsonb       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS orden       integer     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS imagen_url  text;

-- Migrar valores de 'motivo' (text) al nuevo array 'motivos' (jsonb).
UPDATE activo_competidores
   SET motivos = jsonb_build_array(motivo)
 WHERE motivo IS NOT NULL
   AND (motivos IS NULL OR motivos = '[]'::jsonb);

CREATE INDEX IF NOT EXISTS idx_activo_competidores_orden
  ON activo_competidores(activo_id, orden);

-- Catálogo canónico de motivos (sólo informativo, no se enforza).
-- Valores válidos:
--   'Zona'
--   'Tipología'
--   'Volumen / superficie'
--   'Rango de renta'
--   'Calidad del activo'
--   'Amenities'
--   'Transporte y accesibilidad'
--   'Estado del edificio'
--   'Perfil de tenant'
--   'Competidor prácticamente idéntico'

-- ════════════════════════════════════════════════════════════
-- ✓ Fin del restore_all.sql · 28 migraciones aplicadas
-- ════════════════════════════════════════════════════════════
