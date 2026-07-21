-- 042 — propietarios: FK activo_id (auditoría D3)
-- ------------------------------------------------------------
-- Hoy el vínculo propietario↔activo es SOLO por `activo_ref` (texto, migración 008),
-- inconsistente con el resto del modelo (ofertas, mandatos, oferta_demanda… usan
-- activo_id uuid con FK). Un match por texto es frágil: si el ref del activo cambia
-- o hay espacios/mayúsculas, el vínculo se rompe sin traza.
--
-- Esta migración añade `propietarios.activo_id` con FK real y lo mantiene
-- sincronizado desde `activo_ref` vía trigger (mismo patrón que 011, en sentido
-- inverso: aquí propietarios se clava por ref, así que derivamos el id desde el ref).
-- El código NO necesita cambiar: sigue escribiendo activo_ref y el trigger rellena
-- activo_id. El backfill cubre las filas existentes.

-- 1. Columna + FK + índice
ALTER TABLE propietarios
  ADD COLUMN IF NOT EXISTS activo_id uuid REFERENCES activos(id);

CREATE INDEX IF NOT EXISTS propietarios_activo_id_idx ON propietarios (activo_id);

-- 2. Trigger: derivar activo_id desde activo_ref en INSERT / UPDATE OF activo_ref.
--    Si activo_ref es NULL se respeta el activo_id que venga (permite escritura
--    directa por id en el futuro). Si el ref no casa con ningún activo, queda NULL
--    (sin violar la FK).
CREATE OR REPLACE FUNCTION sync_propietarios_activo_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activo_ref IS NOT NULL THEN
    SELECT a.id
    INTO   NEW.activo_id
    FROM   activos a
    WHERE  a.ref = NEW.activo_ref
    LIMIT  1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_propietarios_activo_id ON propietarios;
CREATE TRIGGER trg_propietarios_activo_id
BEFORE INSERT OR UPDATE OF activo_ref ON propietarios
FOR EACH ROW EXECUTE FUNCTION sync_propietarios_activo_id();

-- 3. Backfill de las filas existentes.
UPDATE propietarios p
SET    activo_id = a.id
FROM   activos a
WHERE  p.activo_ref IS NOT NULL
  AND  p.activo_id IS NULL
  AND  a.ref = p.activo_ref;
