-- 009 — Ofertas: campo activa para vista activas/desactivadas
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS activa boolean DEFAULT true;
UPDATE ofertas SET activa = true WHERE activa IS NULL;

-- Cambiar estado por defecto a Disponible para nuevas ofertas
ALTER TABLE ofertas ALTER COLUMN estado SET DEFAULT 'Disponible';
