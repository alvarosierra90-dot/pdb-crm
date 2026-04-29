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
