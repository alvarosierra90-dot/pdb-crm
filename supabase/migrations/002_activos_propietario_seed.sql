-- ============================================================
-- PDB · Migration 002
-- Añade campo propietario (text) a activos
-- Inserta los 15 activos restantes (Colonial, Merlin, GMP, Residencial)
-- Actualiza los 8 ya existentes con propietario y subzona
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Añadir columna propietario si no existe
ALTER TABLE activos ADD COLUMN IF NOT EXISTS propietario text;

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
