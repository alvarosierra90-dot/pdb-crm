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
