-- 035 — Campos de salida del edificio (Baja / Fin de contrato → Traslado)
-- =====================================================================
-- Aplica a arrendatarios y propietarios. Permite trazar la salida del
-- inquilino o propietario de un activo concreto, distinguiendo:
--   · Baja: motivo='Baja', destino_activo_ref=NULL (se va, no sabemos dónde).
--   · Fin de contrato: motivo='Fin de contrato', destino_activo_ref=ref del
--     activo destino. En el listado /arrendatarios figurará como 'Traslado'.

-- ── Arrendatarios ───────────────────────────────────────────────────
-- fecha_salida ya existe (migración 007).
ALTER TABLE arrendatarios
  ADD COLUMN IF NOT EXISTS motivo_salida       text,
  ADD COLUMN IF NOT EXISTS destino_activo_ref  text;

ALTER TABLE arrendatarios DROP CONSTRAINT IF EXISTS arrendatarios_motivo_salida_check;
ALTER TABLE arrendatarios
  ADD CONSTRAINT arrendatarios_motivo_salida_check
  CHECK (motivo_salida IS NULL OR motivo_salida IN ('Baja','Fin de contrato'));

-- ── Propietarios ────────────────────────────────────────────────────
-- Campos NUEVOS específicos del histórico del edificio (separados de
-- fecha_desactivacion/motivo_desactivacion de la cuenta global, mig 025).
ALTER TABLE propietarios
  ADD COLUMN IF NOT EXISTS fecha_salida        date,
  ADD COLUMN IF NOT EXISTS motivo_salida       text,
  ADD COLUMN IF NOT EXISTS destino_activo_ref  text;

ALTER TABLE propietarios DROP CONSTRAINT IF EXISTS propietarios_motivo_salida_check;
ALTER TABLE propietarios
  ADD CONSTRAINT propietarios_motivo_salida_check
  CHECK (motivo_salida IS NULL OR motivo_salida IN ('Baja','Fin de contrato'));

-- ── Índices para filtros por activo destino ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_arrendatarios_destino ON arrendatarios(destino_activo_ref);
CREATE INDEX IF NOT EXISTS idx_propietarios_destino  ON propietarios(destino_activo_ref);
