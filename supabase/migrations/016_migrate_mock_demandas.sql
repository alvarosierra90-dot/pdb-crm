-- ============================================================
-- PDB · Migración 016 — Migrar las 11 demandas mock a Supabase
-- Las demandas hardcoded en DemandaList pasan a vivir en BBDD para
-- que sean editables igual que las creadas desde Lead.
-- ============================================================

-- 1. Cuentas Dynamics que faltaban en seed previo
INSERT INTO dynamics_accounts (dynamics_id, nombre, tipo, sector, direccion, codigo_postal, ciudad, pais, telefono) VALUES
  ('dyn-acc-015', 'Grupo Empresarial Altamira SL',  'Corporación',   'Industrial',  'Calle Orense, 81',         '28020', 'Madrid', 'España', '+34 91 567 23 40'),
  ('dyn-acc-016', 'Centro Médico Integra SL',       'Corporación',   'Sanitario',   'Avenida de Manoteras, 22', '28050', 'Madrid', 'España', '+34 91 372 88 90'),
  ('dyn-acc-017', 'Estudio Arquitectura Vértice',   'PYME',          'Arquitectura','Calle Goya, 42',           '28001', 'Madrid', 'España', '+34 91 401 55 12'),
  ('dyn-acc-018', 'Maritime Trading España',        'PYME',          'Trading',     'Gran Vía Diego López, 1',  '48001', 'Bilbao', 'España', '+34 94 423 78 60')
ON CONFLICT (dynamics_id) DO NOTHING;

-- 2. Oportunidades Dynamics: una por demanda mock (todas tipo 'demanda' directo)
INSERT INTO dynamics_opportunities (dynamics_id, nombre, tipo, cuenta_dynamics_id, estado, fecha_creacion) VALUES
  ('dyn-opp-mig-001', 'Búsqueda oficinas Madrid Norte — Altamira',                'demanda', 'dyn-acc-015', 'abierta', '2025-10-17 09:00+02'),
  ('dyn-opp-mig-002', 'Búsqueda espacios flexibles Madrid — Nexo Digital',        'demanda', 'dyn-acc-011', 'abierta', '2025-10-20 09:00+02'),
  ('dyn-opp-mig-003', 'Búsqueda local sanitario Madrid — Centro Médico Integra',  'demanda', 'dyn-acc-016', 'abierta', '2025-10-01 09:00+02'),
  ('dyn-opp-mig-004', 'Búsqueda inmueble — Hospitality Group',                    'demanda', 'dyn-acc-003', 'abierta', '2025-09-30 09:00+02'),
  ('dyn-opp-mig-005', 'Búsqueda oficina representativa — Vértice',                'demanda', 'dyn-acc-017', 'abierta', '2025-09-25 09:00+02'),
  ('dyn-opp-mig-006', 'Búsqueda operador flexibles nacional — Flexwork',          'demanda', 'dyn-acc-008', 'abierta', '2025-09-15 09:00+02'),
  ('dyn-opp-mig-007', 'Búsqueda nueva sede 2027 — Grupo Mediática',               'demanda', 'dyn-acc-002', 'abierta', '2025-09-12 09:00+02'),
  ('dyn-opp-mig-008', 'Inversión patrimonial oficinas — Capital Industrial',      'demanda', 'dyn-acc-004', 'abierta', '2025-09-04 09:00+02'),
  ('dyn-opp-mig-009', 'Búsqueda espacio formativo — Academia Global',             'demanda', 'dyn-acc-010', 'abierta', '2025-09-03 09:00+02'),
  ('dyn-opp-mig-010', 'Búsqueda inmueble premium — Familiar Velada',              'demanda', 'dyn-acc-001', 'abierta', '2025-07-16 09:00+02'),
  ('dyn-opp-mig-011', 'Búsqueda zona consolidada — Maritime Trading',             'demanda', 'dyn-acc-018', 'abierta', '2025-07-09 09:00+02')
ON CONFLICT (dynamics_id) DO NOTHING;

-- 3. Demandas: ref nuevo formato DEM-2025-XXXX, nombre = cuenta, requisitos rellenos
INSERT INTO demandas (ref, nombre, dynamics_opportunity_id, dynamics_account_id, estatus, requisitos, notas, created_at) VALUES

  ('DEM-2025-0001', 'Grupo Empresarial Altamira SL',
   'dyn-opp-mig-001', 'dyn-acc-015', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Oficina tradicional","sup_min":2200,"sup_max":3000,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Búsqueda de oficinas estándar en zona norte de Madrid, aprox. 2.500 m². Origen: Otras consultoras.',
   '2025-10-17 12:14+02'),

  ('DEM-2025-0002', 'Nexo Digital Media SL',
   'dyn-opp-mig-002', 'dyn-acc-011', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Coworking","sup_min":300,"sup_max":500,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Interesados en espacios flexibles en entorno tecnológico Madrid. Origen: Idealista.',
   '2025-10-20 10:30+02'),

  ('DEM-2025-0003', 'Centro Médico Integra SL',
   'dyn-opp-mig-003', 'dyn-acc-016', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Alternativos","tipologia":"Sanitario","sup_min":200,"sup_max":300,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Búsqueda de local u oficina en zona norte para uso sanitario. Origen: Web Savills.',
   '2025-10-01 11:00+02'),

  ('DEM-2025-0004', 'Hospitality Group Iberia SL',
   'dyn-opp-mig-004', 'dyn-acc-003', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Sede única (HQ)","sup_min":2000,"sup_max":6000,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Contacto directo. Gestión patrimonial busca inmueble para nueva operación. Origen: Web Savills.',
   '2025-09-30 14:00+02'),

  ('DEM-2025-0005', 'Estudio Arquitectura Vértice',
   'dyn-opp-mig-005', 'dyn-acc-017', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Oficina tradicional","sup_min":600,"sup_max":1000,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Demanda captada vía portal externo. Buscan oficina representativa. Origen: Web externa.',
   '2025-09-25 10:00+02'),

  ('DEM-2025-0006', 'Flexwork Solutions Spain SL',
   'dyn-opp-mig-006', 'dyn-acc-008', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Coworking","sup_min":800,"sup_max":6000,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid","Barcelona","Valencia"]}'::jsonb,
   'Demanda recurrente de operador de espacios flexibles a nivel nacional. Origen: Savills Internacional.',
   '2025-09-15 10:00+02'),

  ('DEM-2025-0007', 'Grupo Mediática España',
   'dyn-opp-mig-007', 'dyn-acc-002', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Sede única (HQ)","sup_min":13000,"sup_max":18000,"razon_busqueda":"Reagrupación","presupuesto_tipo":"Alquiler","provincias":["Madrid"],"timing":"2027-01-01"}'::jsonb,
   'Empresa de comunicación busca nueva sede para 2027. Proceso largo. Origen: Coverage.',
   '2025-09-12 10:00+02'),

  ('DEM-2025-0008', 'Capital Industrial Partners',
   'dyn-opp-mig-008', 'dyn-acc-004', 'ongoing',
   '{"naturaleza":"Inversión","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Oficina tradicional","sup_min":500,"sup_max":700,"razon_busqueda":"Reubicación","presupuesto_tipo":"Venta","provincias":["Madrid"]}'::jsonb,
   'Family office busca activo de oficinas como inversión patrimonial. Origen: Private Wealth.',
   '2025-09-04 10:00+02'),

  ('DEM-2025-0009', 'Academia Global Formación SL',
   'dyn-opp-mig-009', 'dyn-acc-010', 'ongoing',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Alternativos","tipologia":"Educativo","sup_min":700,"sup_max":900,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Madrid"]}'::jsonb,
   'Referenciado por colaborador externo. Necesitan espacio formativo. Origen: Colaborador.',
   '2025-09-03 10:00+02'),

  ('DEM-2025-0010', 'Inversiones Familiar Velada',
   'dyn-opp-mig-010', 'dyn-acc-001', 'ongoing',
   '{"naturaleza":"Inversión","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Oficina tradicional","sup_min":1400,"sup_max":2500,"razon_busqueda":"Creación","presupuesto_tipo":"Venta","provincias":["Madrid"]}'::jsonb,
   'Family office busca inmueble premium entre 1.800 y 2.500 m². Origen: Savills España.',
   '2025-07-16 10:00+02'),

  ('DEM-2025-0011', 'Maritime Trading España',
   'dyn-opp-mig-011', 'dyn-acc-018', 'paralizada',
   '{"naturaleza":"Leasing","tipo_activo":"Edificio","uso_principal":"Oficinas","tipologia":"Oficina tradicional","sup_min":220,"sup_max":400,"razon_busqueda":"Expansión / Crecimiento","presupuesto_tipo":"Alquiler","provincias":["Bilbao"]}'::jsonb,
   'Captado vía portal externo. Búsqueda en zona consolidada. Origen: Otros sitios web.',
   '2025-07-09 10:00+02')

ON CONFLICT (ref) DO NOTHING;
