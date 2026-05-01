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
