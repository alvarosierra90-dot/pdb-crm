-- ============================================================
-- PDB · Migración 030 — Sincronización Propuesta → Mandato
-- ============================================================
-- Para que al cerrar una Propuesta como ganada (y crear el Mandato)
-- se sincronicen automáticamente:
--   · Oportunidad y Cuenta — ya estaban (FKs Dynamics)
--   · Equipo de trabajo    — ya estaba (equipo_trabajo jsonb)
--   · Activos vinculados   — NUEVO: propuestas.activos jsonb
--   · Fee total y reparto  — NUEVO: propuestas.fee_eur_fijo + fee_reparto
--
-- El usuario gestiona estos datos desde la ficha de la propuesta; al
-- transformarla en mandato, MarcarPropuestaGanadaModal los copia tal cual.
-- ============================================================

ALTER TABLE propuestas
  ADD COLUMN IF NOT EXISTS activos        jsonb   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fee_eur_fijo   numeric,
  ADD COLUMN IF NOT EXISTS fee_porcentaje numeric,
  ADD COLUMN IF NOT EXISTS fee_min_garantizado numeric,
  ADD COLUMN IF NOT EXISTS fee_reparto    jsonb   DEFAULT '[]'::jsonb;

-- Notas / visión y novedades (consistente con el campo del mandato)
ALTER TABLE propuestas
  ADD COLUMN IF NOT EXISTS vision_novedades text;

-- Esquema de un item de `activos` (no se enforza desde SQL, sólo se documenta):
-- {
--   "ref":       "ALB-001",            -- ref del activo
--   "nombre":    "Torre Albatros",
--   "direccion": "Av. Burgos 89",
--   "ciudad":    "Madrid",
--   "uso":       "Oficinas",
--   "sba":       21500
-- }
