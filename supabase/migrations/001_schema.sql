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
