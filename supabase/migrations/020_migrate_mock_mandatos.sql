-- ============================================================
-- PDB · Migración 020 — Migrar los 6 mandatos mock a Supabase
-- Los mandatos hardcoded en MandatosList.jsx pasan a vivir en BBDD.
-- Multi-activo se rellena en mandato_activos (puente).
-- ============================================================

-- 1. Oportunidades Dynamics asociadas (una por mandato; vía 'directo')
INSERT INTO dynamics_opportunities (dynamics_id, nombre, tipo, cuenta_dynamics_id, estado, fecha_creacion) VALUES
  ('dyn-opp-man-001', 'Mandato Leasing — P.E Avalon (P4 y P5)',                    'oferta',   'dyn-acc-012', 'abierta', '2025-02-01 09:00+01'),
  ('dyn-opp-man-002', 'Mandato Co-exclusiva Leasing — Albatros Edif. D',           'oferta',   'dyn-acc-012', 'abierta', '2025-06-15 09:00+02'),
  ('dyn-opp-man-003', 'Mandato Capital Markets — Torre Glòries',                   'oferta',   'dyn-acc-012', 'abierta', '2025-10-01 09:00+02'),
  ('dyn-opp-man-004', 'Mandato Valoraciones — Portfolio Merlin 2026',              'generica', 'dyn-acc-012', 'abierta', '2026-01-15 09:00+01'),
  ('dyn-opp-man-005', 'Mandato Co-exclusiva Leasing — Parque Empresarial Norte',   'oferta',   'dyn-acc-009', 'abierta', '2025-04-01 09:00+02'),
  ('dyn-opp-man-006', 'Mandato Leasing — Torre Europa Valencia',                   'oferta',   'dyn-acc-009', 'cerrada', '2024-03-01 09:00+01')
ON CONFLICT (dynamics_id) DO NOTHING;

-- 2. Mandatos
INSERT INTO mandatos (
  ref, dynamics_opportunity_id, dynamics_account_id,
  tipo, via, exclusividad, exclusividad_modo,
  cuenta_agente_id, contacto_agente_id,
  titulo, departamento, provincia, zona,
  fecha_firma, fecha_inicio, fecha_vencimiento,
  preaviso_dias, alerta_dias, prorroga_tacita, prorroga_meses,
  fee_porcentaje, responsable, equipo,
  estado, motivo_cancelacion, notas,
  created_at
) VALUES
  ('MAN-2501', 'dyn-opp-man-001', 'dyn-acc-012',
   'alquiler', 'directo', true, 'exclusiva',
   NULL, NULL,
   'Exclusiva Leasing — P.E Avalon · P4 y P5', 'Oficinas', 'Madrid', 'M-30',
   '2025-02-01', '2025-03-01', '2026-02-28',
   30, 60, true, 6,
   3.5, 'Sierra Alvaro', 'Leasing Oficinas MAD',
   'en_curso', NULL,
   'Mandato exclusivo Merlin para comercialización de plantas 4 y 5 del P.E Avalon.',
   '2025-02-01 12:00+01'),

  ('MAN-2502', 'dyn-opp-man-002', 'dyn-acc-012',
   'alquiler', 'directo', true, 'coexclusiva',
   NULL, NULL,
   'Coexclusiva Leasing — Albatros Edif. D', 'Oficinas', 'Madrid', 'A-1 · Alcobendas',
   '2025-06-15', '2025-07-01', '2026-06-30',
   30, 60, true, 3,
   2.5, 'Sierra Alvaro', 'Leasing Oficinas MAD',
   'en_curso', NULL,
   'Co-exclusiva con CBRE. Comercialización conjunta de Albatros Edif. D.',
   '2025-06-15 10:00+02'),

  ('MAN-2503', 'dyn-opp-man-003', 'dyn-acc-012',
   'venta', 'directo', true, 'exclusiva',
   NULL, NULL,
   'Exclusiva Capital Markets — Torre Glòries', 'Capital Markets', 'Barcelona', '22@',
   '2025-10-01', '2025-11-01', '2026-10-31',
   60, 90, false, 0,
   1.0, 'García Marta', 'Capital Markets MAD',
   'en_curso', NULL,
   'Mandato exclusivo de venta de Torre Glòries para Merlin.',
   '2025-10-01 10:00+02'),

  ('MAN-2504', 'dyn-opp-man-004', 'dyn-acc-012',
   'consultoria', 'directo', true, 'exclusiva',
   NULL, NULL,
   'Mandato Valoraciones — Portfolio Merlin 2026', 'Valoraciones', 'Madrid', NULL,
   '2026-01-15', '2026-02-01', '2026-07-31',
   30, 45, false, 0,
   NULL, 'López Carmen', 'Valoraciones MAD',
   'en_curso', NULL,
   'Mandato de valoraciones sobre 3 activos del portfolio Merlin (P.E Avalon, Torre Glòries, Park Logístico Getafe).',
   '2026-01-15 11:00+01'),

  ('MAN-2505', 'dyn-opp-man-005', 'dyn-acc-009',
   'alquiler', 'directo', true, 'coexclusiva',
   NULL, NULL,
   'Coexclusiva Leasing — Parque Empresarial Norte', 'Oficinas', 'Madrid', 'M-30',
   '2025-04-01', '2025-05-01', '2026-04-30',
   30, 60, true, 3,
   3.0, 'GOMEZ Ignacio', 'Leasing Oficinas MAD',
   'en_curso', NULL,
   'Co-exclusiva con JLL para comercialización de Parque Empresarial Norte (FREO).',
   '2025-04-01 10:00+02'),

  ('MAN-2506', 'dyn-opp-man-006', 'dyn-acc-009',
   'alquiler', 'directo', true, 'exclusiva',
   NULL, NULL,
   'Exclusiva Leasing — Torre Europa Valencia', 'Oficinas', 'Valencia', 'Mestalla',
   '2024-03-01', '2024-04-01', '2025-03-31',
   30, 60, true, 3,
   3.5, 'Sierra Alvaro', 'Leasing Oficinas MAD',
   'cerrado', NULL,
   'Mandato vencido. Operación cerrada en plazo, no renovado.',
   '2024-03-01 10:00+01')

ON CONFLICT (ref) DO NOTHING;

-- 3. Tabla puente mandato_activos (uno o varios activos por mandato)
INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 4050
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2501' AND a.ref = 'MAD-OF-00189'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 13486
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2502' AND a.ref = 'ALC-OF-00231'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 18500
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2503' AND a.ref = 'BCN-OF-00621'
ON CONFLICT DO NOTHING;

-- MAN-2504: Valoraciones multi-activo (3 activos)
INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 46956
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2504' AND a.ref = 'MAD-OF-00189'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 18500
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2504' AND a.ref = 'BCN-OF-00621'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 24000
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2504' AND a.ref = 'MAD-LG-00401'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 11200
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2505' AND a.ref = 'MAD-OF-00841'
ON CONFLICT DO NOTHING;

INSERT INTO mandato_activos (mandato_id, activo_id, sba_asignada)
SELECT m.id, a.id, 7600
FROM mandatos m, activos a
WHERE m.ref = 'MAN-2506' AND a.ref = 'VLC-OF-00712'
ON CONFLICT DO NOTHING;
