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
