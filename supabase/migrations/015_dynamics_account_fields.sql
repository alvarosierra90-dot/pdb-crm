-- ============================================================
-- PDB · Migración 015 — Datos extendidos de Cuenta + estado
-- potencial + otros_contactos en demandas.
--
-- Objetivo: que la ficha de Demanda pueda heredar TODOS los datos
-- de la Cuenta vinculada en Dynamics sin reintroducir nada manual,
-- y que el campo estado contemple "Potencial" además de los actuales.
-- ============================================================

-- 1. Extender dynamics_accounts con datos de dirección/contacto
ALTER TABLE dynamics_accounts
  ADD COLUMN IF NOT EXISTS direccion       text,
  ADD COLUMN IF NOT EXISTS codigo_postal   text,
  ADD COLUMN IF NOT EXISTS ciudad          text,
  ADD COLUMN IF NOT EXISTS pais            text DEFAULT 'España',
  ADD COLUMN IF NOT EXISTS telefono        text,
  ADD COLUMN IF NOT EXISTS web             text;

-- 2. Permitir 'potencial' como estado de Demanda
ALTER TABLE demandas DROP CONSTRAINT IF EXISTS demandas_estatus_check;
ALTER TABLE demandas
  ADD CONSTRAINT demandas_estatus_check
  CHECK (estatus IN ('ongoing','potencial','paralizada','descartada','cerrada_concedido','cerrada_perdida'));

-- 3. Lista de otros contactos asociados a la demanda (referencias dynamics_contacts)
ALTER TABLE demandas
  ADD COLUMN IF NOT EXISTS otros_contactos jsonb;

-- 4. Poblar las cuentas seed con datos para que la herencia se vea real
UPDATE dynamics_accounts SET direccion = 'Calle Velázquez, 24', codigo_postal = '28001', ciudad = 'Madrid'                  WHERE dynamics_id = 'dyn-acc-001' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Avda. de la Industria, 42', codigo_postal = '28760', ciudad = 'Tres Cantos'        WHERE dynamics_id = 'dyn-acc-002' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle Goya, 12', codigo_postal = '28001', ciudad = 'Madrid'                       WHERE dynamics_id = 'dyn-acc-003' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Paseo de la Castellana, 89', codigo_postal = '28046', ciudad = 'Madrid'            WHERE dynamics_id = 'dyn-acc-004' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle José Echegaray, 6B', codigo_postal = '28230', ciudad = 'Las Rozas de Madrid' WHERE dynamics_id = 'dyn-acc-005' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Avenida de Bruselas, 26', codigo_postal = '28108', ciudad = 'Alcobendas'           WHERE dynamics_id = 'dyn-acc-006' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Paseo de la Castellana, 110', codigo_postal = '28046', ciudad = 'Madrid'           WHERE dynamics_id = 'dyn-acc-007' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle Alcalá, 75', codigo_postal = '28009', ciudad = 'Madrid'                     WHERE dynamics_id = 'dyn-acc-008' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle Príncipe de Vergara, 132', codigo_postal = '28002', ciudad = 'Madrid'        WHERE dynamics_id = 'dyn-acc-009' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle Serrano, 89', codigo_postal = '28006', ciudad = 'Madrid'                    WHERE dynamics_id = 'dyn-acc-010' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Avenida Diagonal, 615', codigo_postal = '08028', ciudad = 'Barcelona'              WHERE dynamics_id = 'dyn-acc-011' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Paseo de la Castellana, 257', codigo_postal = '28046', ciudad = 'Madrid'           WHERE dynamics_id = 'dyn-acc-012' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Avenida Diagonal, 532', codigo_postal = '08006', ciudad = 'Barcelona'              WHERE dynamics_id = 'dyn-acc-013' AND direccion IS NULL;
UPDATE dynamics_accounts SET direccion = 'Calle Luchana, 23', codigo_postal = '28010', ciudad = 'Madrid'                    WHERE dynamics_id = 'dyn-acc-014' AND direccion IS NULL;

UPDATE dynamics_accounts SET telefono = '+34 91 432 11 00', web = 'familiarvelada.es'   WHERE dynamics_id = 'dyn-acc-001' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 803 22 50', web = 'mediatica.es'        WHERE dynamics_id = 'dyn-acc-002' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 555 80 12', web = 'hospitality-iberia.com' WHERE dynamics_id = 'dyn-acc-003' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 575 99 30', web = 'capitalindustrial.es'   WHERE dynamics_id = 'dyn-acc-004' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 631 90 00', web = 'oracle.com/es'          WHERE dynamics_id = 'dyn-acc-005' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 484 56 00', web = 'neinor.com'            WHERE dynamics_id = 'dyn-acc-006' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 781 38 00', web = 'barings.com'           WHERE dynamics_id = 'dyn-acc-007' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 540 11 88', web = 'flexworksolutions.es'  WHERE dynamics_id = 'dyn-acc-008' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 290 41 22', web = 'freoinvestments.com'   WHERE dynamics_id = 'dyn-acc-009' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 720 60 11', web = 'academiaglobal.es'     WHERE dynamics_id = 'dyn-acc-010' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 93 414 90 90', web = 'nexodigital.com'       WHERE dynamics_id = 'dyn-acc-011' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 786 11 00', web = 'merlinproperties.com'  WHERE dynamics_id = 'dyn-acc-012' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 93 304 38 00', web = 'inmocolonial.com'      WHERE dynamics_id = 'dyn-acc-013' AND telefono IS NULL;
UPDATE dynamics_accounts SET telefono = '+34 91 350 04 00', web = 'gmpproperty.com'       WHERE dynamics_id = 'dyn-acc-014' AND telefono IS NULL;
