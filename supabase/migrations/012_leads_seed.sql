-- ============================================================
-- PDB · Migración 012 — Extensión de leads + seeds Dynamics y leads
-- Añade los campos UI que faltan en leads, siembra cuentas/contactos
-- de Dynamics para que el typeahead funcione, y siembra leads de
-- ejemplo equivalentes a los del mock.
-- ============================================================

-- ============================================================
-- 1. EXTENDER leads CON CAMPOS UI
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS ref               text UNIQUE,
  ADD COLUMN IF NOT EXISTS prioridad         text CHECK (prioridad IN ('alta','media','baja')),
  ADD COLUMN IF NOT EXISTS equipo            text,
  ADD COLUMN IF NOT EXISTS responsable       text,
  ADD COLUMN IF NOT EXISTS descripcion       text,
  ADD COLUMN IF NOT EXISTS origen_anuncio    text,
  ADD COLUMN IF NOT EXISTS ultima_actividad  timestamptz,
  ADD COLUMN IF NOT EXISTS fecha_nulo        timestamptz,
  ADD COLUMN IF NOT EXISTS usuario_nulo      text;

CREATE INDEX IF NOT EXISTS idx_leads_ref       ON leads(ref);
CREATE INDEX IF NOT EXISTS idx_leads_prioridad ON leads(prioridad);

-- ============================================================
-- 2. SEED dynamics_accounts (cuentas que aparecen en los leads)
-- ============================================================

INSERT INTO dynamics_accounts (dynamics_id, nombre, tipo, sector) VALUES
  ('dyn-acc-001', 'Inversiones Familiar Velada',     'Family Office',    'Inversión'),
  ('dyn-acc-002', 'Grupo Mediática España',          'Corporación',      'Media'),
  ('dyn-acc-003', 'Hospitality Group Iberia SL',     'Corporación',      'Logística'),
  ('dyn-acc-004', 'Capital Industrial Partners',     'Inversor',         'Real Estate'),
  ('dyn-acc-005', 'Oracle Spain SL',                 'Multinacional',    'Tecnología'),
  ('dyn-acc-006', 'Neinor Homes',                    'Promotor',         'Residencial'),
  ('dyn-acc-007', 'Barings RE',                      'Fondo',            'Real Estate'),
  ('dyn-acc-008', 'Flexwork Solutions Spain SL',     'Corporación',      'Coworking'),
  ('dyn-acc-009', 'FREO Investments Spain SL',       'Fondo',            'Real Estate'),
  ('dyn-acc-010', 'Academia Global Formación SL',    'Corporación',      'Educación'),
  ('dyn-acc-011', 'Nexo Digital Media SL',           'Corporación',      'Media'),
  ('dyn-acc-012', 'Merlin Properties SOCIMI',        'SOCIMI',           'Real Estate'),
  ('dyn-acc-013', 'Colonial SOCIMI',                 'SOCIMI',           'Real Estate'),
  ('dyn-acc-014', 'GMP Property',                    'Family Office',    'Real Estate')
ON CONFLICT (dynamics_id) DO NOTHING;

-- ============================================================
-- 3. SEED dynamics_contacts
-- ============================================================

INSERT INTO dynamics_contacts (dynamics_id, nombre, email, telefono, cuenta_dynamics_id) VALUES
  ('dyn-ct-001', 'Marta Rodríguez',     'marta.rodriguez@example.com',  '+34 600 000 001', NULL),
  ('dyn-ct-002', 'José María Velada',   'jm.velada@example.com',        '+34 600 000 002', 'dyn-acc-001'),
  ('dyn-ct-003', 'Ignacio Lara',        'ignacio.lara@example.com',     '+34 600 000 003', 'dyn-acc-002'),
  ('dyn-ct-004', 'Laura Fernández',     'laura.fernandez@example.com',  '+34 600 000 004', 'dyn-acc-003'),
  ('dyn-ct-005', 'Eduardo Mancera',     'eduardo.mancera@example.com',  '+34 600 000 005', 'dyn-acc-004'),
  ('dyn-ct-006', 'David Sánchez',       'david.sanchez@example.com',    '+34 600 000 006', 'dyn-acc-005'),
  ('dyn-ct-007', 'Carmen Ruiz',         'carmen.ruiz@example.com',      '+34 600 000 007', 'dyn-acc-006'),
  ('dyn-ct-008', 'Sebastián Wagner',    'sebastian.wagner@example.com', '+34 600 000 008', 'dyn-acc-007'),
  ('dyn-ct-009', 'Elena Vidal',         'elena.vidal@example.com',      '+34 600 000 009', 'dyn-acc-008'),
  ('dyn-ct-010', 'Hans Müller',         'hans.muller@example.com',      '+34 600 000 010', 'dyn-acc-009'),
  ('dyn-ct-011', 'Roger Pi',            'roger.pi@example.com',         '+34 600 000 011', 'dyn-acc-010'),
  ('dyn-ct-012', 'Marina Costa',        'marina.costa@example.com',     '+34 600 000 012', 'dyn-acc-011'),
  ('dyn-ct-013', 'Pablo Estrada',       'pablo.estrada@example.com',    '+34 600 000 013', NULL),
  ('dyn-ct-014', 'Antonio Rivera',      'antonio.rivera@example.com',   '+34 600 000 014', NULL)
ON CONFLICT (dynamics_id) DO NOTHING;

-- ============================================================
-- 4. SEED leads (equivalente a los del mock con servicio→generico)
-- ============================================================

INSERT INTO leads (ref, nombre, tipo, via, estado, prioridad, equipo, responsable,
                   fuente, origen_canal, origen_campana, origen_anuncio, origen_url,
                   descripcion, ultima_actividad,
                   dynamics_account_id, dynamics_contact_id, fecha_cualificacion,
                   notas_cualificacion, motivo_no_cualificado, fecha_nulo, usuario_nulo,
                   created_at) VALUES
  ('LD-2026-0042', 'Búsqueda 2.000 m² oficinas Madrid centro',
    'demanda', NULL, 'nuevo', 'alta', 'Leasing Oficinas Madrid', 'Sierra Álvaro',
    'Web', 'Web corporativa', 'Q2-2026 Oficinas Madrid', 'Form contacto general', 'savills.es/contacto',
    'Multinacional tecnológica busca relocation HQ. Sup. 2.000 m². Eje Castellana o La Castellana.',
    now() - interval '2 hours',
    NULL, 'dyn-ct-001', NULL, NULL, NULL, NULL, NULL,
    '2026-04-26 14:32+02'),

  ('LD-2026-0041', 'Edificio en alquiler — Calle Serrano',
    'oferta', 'directo', 'cualificado', 'alta', 'Leasing Oficinas Madrid', 'Sierra Álvaro',
    'Recomendación', 'Recomendación', NULL, NULL, NULL,
    'Propietario quiere poner en alquiler edificio completo de 4.500 m² en Serrano 90.',
    now() - interval '1 day',
    'dyn-acc-001', 'dyn-ct-002', '2026-04-25 11:00+02', 'Propietario verificado, quiere lanzar Q3', NULL, NULL, NULL,
    '2026-04-25 10:15+02'),

  ('LD-2026-0040', 'Consultoría estratégica relocation grupo media',
    'generico', NULL, 'en_cualificacion', 'media', 'Advisory & Consultancy', 'GOMEZ Ignacio',
    'LinkedIn', 'LinkedIn', 'Advisory Strategic Q1', 'Post Savills Advisory', 'linkedin.com/savills-spain',
    'Quieren contratar servicio de consultoría estratégica inmobiliaria para reorganizar 3 sedes.',
    now() - interval '3 days',
    'dyn-acc-002', 'dyn-ct-003', NULL, NULL, NULL, NULL, NULL,
    '2026-04-24 09:48+02'),

  ('LD-2026-0039', 'Logística 12.000 m² A-2 corredor del Henares',
    'demanda', 'pitch', 'cualificado', 'alta', 'Industrial & Logistics', 'GOMEZ Ignacio',
    'Idealista', 'Idealista', NULL, 'Nave logística A-2 Coslada', 'idealista.com/anuncio/2348790',
    'Operador logístico 3PL busca plataforma 12.000 m² en corredor del Henares. Altura libre 11m.',
    now() - interval '4 days',
    'dyn-acc-003', 'dyn-ct-004', '2026-04-24 10:00+02', 'Cualificado y va a pitch competitivo con CBRE+JLL', NULL, NULL, NULL,
    '2026-04-23 16:20+02'),

  ('LD-2026-0038', 'Venta portfolio retail high street',
    'oferta', 'pitch', 'en_cualificacion', 'alta', 'Capital Markets', 'Sierra Álvaro',
    'Directo', 'Contacto directo', NULL, NULL, NULL,
    'CIP desinvierte cartera 8 locales high street en Madrid + Barcelona. Valor estimado 45 M€.',
    now() - interval '5 days',
    'dyn-acc-004', 'dyn-ct-005', NULL, NULL, NULL, NULL, NULL,
    '2026-04-22 11:05+02'),

  ('LD-2026-0037', 'Búsqueda data center 5MW',
    'demanda', NULL, 'en_cualificacion', 'media', 'Alternativos', 'Sierra Álvaro',
    'Belbex', 'Belbex', NULL, 'Data center San Fernando', 'belbex.com/dc/madrid-1',
    'Ampliación capacidad. 5MW IT load. Proximidad fibra óptica troncal. Madrid Sur preferente.',
    now() - interval '6 days',
    'dyn-acc-005', 'dyn-ct-006', NULL, NULL, NULL, NULL, NULL,
    '2026-04-21 13:50+02'),

  ('LD-2026-0036', 'Consultoría valoración portfolio residencial',
    'generico', NULL, 'cualificado', 'media', 'Valuations', 'GOMEZ Ignacio',
    'Web', 'Formulario consultoría', 'Valuations Q2', 'Form valoración portfolio', 'savills.es/valuations',
    'Valoración independiente portfolio 850 unidades BTR para refinanciación.',
    now() - interval '7 days',
    'dyn-acc-006', 'dyn-ct-007', '2026-04-21 09:00+02', 'Mandato directo, sin pitch', NULL, NULL, NULL,
    '2026-04-20 17:12+02'),

  ('LD-2026-0035', 'Local Gran Vía 200 m² flagship',
    'demanda', NULL, 'no_cualificado', 'baja', 'Retail', 'Sierra Álvaro',
    'Habitaclia', 'Habitaclia', NULL, 'Local Gran Vía 32', 'habitaclia.com/loc/8923',
    'Marca DTC busca flagship 200 m² Gran Vía o Preciados.',
    now() - interval '7 days',
    NULL, 'dyn-ct-013', NULL, NULL,
    'Presupuesto insuficiente', '2026-04-21 09:30+02', 'Sierra Álvaro',
    '2026-04-19 12:00+02'),

  ('LD-2026-0034', 'Comercialización P.E. Avalon edificio 4',
    'oferta', 'directo', 'cualificado', 'alta', 'Leasing Oficinas Madrid', 'Sierra Álvaro',
    'Recomendación', 'Recomendación', NULL, NULL, NULL,
    'Propietario quiere comercializar plantas 5-7 (3.200 m² netos) en exclusiva.',
    now() - interval '14 days',
    'dyn-acc-007', 'dyn-ct-008', '2026-04-19 10:00+02', 'Mandato directo firmado', NULL, NULL, NULL,
    '2026-04-18 10:30+02'),

  ('LD-2026-0033', '2.500 m² coworking flexible Barcelona',
    'demanda', NULL, 'en_cualificacion', 'media', 'Leasing Oficinas Barcelona', 'GOMEZ Ignacio',
    'LinkedIn', 'LinkedIn', 'Q2-2026 Coworking BCN', 'Post oficinas flexibles', 'linkedin.com/savills-spain',
    'Operador coworking expansión 22@. 2.500 m² + 200 puestos. Plug & play preferente.',
    now() - interval '14 days',
    'dyn-acc-008', 'dyn-ct-009', NULL, NULL, NULL, NULL, NULL,
    '2026-04-17 15:45+02'),

  ('LD-2026-0032', 'Spam — venta de leads inmobiliarios',
    'generico', NULL, 'no_cualificado', 'baja', NULL, NULL,
    'Email', 'Email entrante', NULL, NULL, NULL,
    'Email no solicitado ofreciendo bases de datos.',
    now() - interval '14 days',
    NULL, NULL, NULL, NULL,
    'Spam', '2026-04-16 08:25+02', 'Sistema',
    '2026-04-16 08:20+02'),

  ('LD-2026-0031', 'Hotel boutique centro histórico Sevilla',
    'demanda', NULL, 'nuevo', 'media', 'Hotels', 'Sierra Álvaro',
    'Web', 'Web corporativa', NULL, 'Form hotel investment', 'savills.es/hotels',
    'Cadena hotelera busca 30-50 habitaciones centro Sevilla. Edificio singular.',
    now() - interval '14 days',
    NULL, 'dyn-ct-014', NULL, NULL, NULL, NULL, NULL,
    '2026-04-15 19:08+02'),

  ('LD-2026-0030', 'Advisory expansión retail España',
    'generico', NULL, 'cualificado', 'alta', 'Advisory & Consultancy', 'GOMEZ Ignacio',
    'Evento', 'Evento / Networking', 'MIPIM 2026', NULL, NULL,
    'Cliente busca asesoramiento estratégico para abrir 12 puntos de venta en 18 meses.',
    now() - interval '14 days',
    'dyn-acc-011', 'dyn-ct-012', '2026-04-15 12:00+02', 'Cualificado tras MIPIM', NULL, NULL, NULL,
    '2026-04-14 11:25+02'),

  ('LD-2026-0028', 'Oficinas 800 m² Diagonal BCN',
    'demanda', 'directo', 'cualificado', 'media', 'Leasing Oficinas Barcelona', 'GOMEZ Ignacio',
    'Idealista', 'Idealista', NULL, 'Edificio Diagonal 95', 'idealista.com/anuncio/2349123',
    'Centro formación busca aulas + oficinas 800 m² eje Diagonal.',
    now() - interval '21 days',
    'dyn-acc-010', 'dyn-ct-011', '2026-04-11 10:00+02', 'Cualificado y derivado a Demanda', NULL, NULL, NULL,
    '2026-04-10 09:50+02')
ON CONFLICT (ref) DO NOTHING;
