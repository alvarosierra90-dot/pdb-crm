-- ============================================================
-- PDB · Migración 011 — Triggers de FK denormalizadas
-- Mantiene la coherencia de las FK denormalizadas que permiten
-- queries planas en las Vistas 360º.
--
-- Patrón: BEFORE INSERT/UPDATE en hijo lee del padre y rellena.
-- Si el padre cambia, AFTER UPDATE propaga a hijos.
-- ============================================================

-- ============================================================
-- 1. ofertas: heredar portfolio_id y dynamics_account_id de activo
-- ============================================================

CREATE OR REPLACE FUNCTION sync_ofertas_fks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activo_id IS NOT NULL THEN
    SELECT a.portfolio_id, a.dynamics_account_id
    INTO   NEW.portfolio_id, NEW.dynamics_account_id
    FROM   activos a
    WHERE  a.id = NEW.activo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ofertas_fks ON ofertas;
CREATE TRIGGER trg_ofertas_fks
BEFORE INSERT OR UPDATE OF activo_id ON ofertas
FOR EACH ROW EXECUTE FUNCTION sync_ofertas_fks();

-- ============================================================
-- 2. oferta_demanda: heredar activo_id y portfolio_id de oferta
-- ============================================================

CREATE OR REPLACE FUNCTION sync_oferta_demanda_fks()
RETURNS TRIGGER AS $$
BEGIN
  SELECT o.activo_id, o.portfolio_id
  INTO   NEW.activo_id, NEW.portfolio_id
  FROM   ofertas o
  WHERE  o.id = NEW.oferta_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_oferta_demanda_fks ON oferta_demanda;
CREATE TRIGGER trg_oferta_demanda_fks
BEFORE INSERT OR UPDATE OF oferta_id ON oferta_demanda
FOR EACH ROW EXECUTE FUNCTION sync_oferta_demanda_fks();

-- ============================================================
-- 3. visitas: heredar todas las FKs de oferta_demanda
-- ============================================================

CREATE OR REPLACE FUNCTION sync_visitas_fks()
RETURNS TRIGGER AS $$
BEGIN
  SELECT od.oferta_id, od.activo_id, od.portfolio_id, od.demanda_id
  INTO   NEW.oferta_id, NEW.activo_id, NEW.portfolio_id, NEW.demanda_id
  FROM   oferta_demanda od
  WHERE  od.id = NEW.oferta_demanda_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_visitas_fks ON visitas;
CREATE TRIGGER trg_visitas_fks
BEFORE INSERT OR UPDATE OF oferta_demanda_id ON visitas
FOR EACH ROW EXECUTE FUNCTION sync_visitas_fks();

-- ============================================================
-- 4. negociaciones: heredar FKs de oferta_demanda + cuentas
-- ============================================================

CREATE OR REPLACE FUNCTION sync_negociaciones_fks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.oferta_demanda_id IS NOT NULL THEN
    SELECT od.oferta_id, od.activo_id, od.portfolio_id, od.demanda_id
    INTO   NEW.oferta_id, NEW.activo_id, NEW.portfolio_id, NEW.demanda_id
    FROM   oferta_demanda od
    WHERE  od.id = NEW.oferta_demanda_id;
  END IF;

  IF NEW.demanda_id IS NOT NULL AND NEW.cuenta_inquilina_id IS NULL THEN
    SELECT d.dynamics_account_id
    INTO   NEW.cuenta_inquilina_id
    FROM   demandas d
    WHERE  d.id = NEW.demanda_id;
  END IF;

  IF NEW.activo_id IS NOT NULL AND NEW.cuenta_propietaria_id IS NULL THEN
    SELECT a.dynamics_account_id
    INTO   NEW.cuenta_propietaria_id
    FROM   activos a
    WHERE  a.id = NEW.activo_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_negociaciones_fks ON negociaciones;
CREATE TRIGGER trg_negociaciones_fks
BEFORE INSERT OR UPDATE OF oferta_demanda_id, demanda_id, activo_id ON negociaciones
FOR EACH ROW EXECUTE FUNCTION sync_negociaciones_fks();

-- ============================================================
-- 5. mandatos: heredar portfolio_id de activo
-- ============================================================

CREATE OR REPLACE FUNCTION sync_mandatos_fks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activo_id IS NOT NULL THEN
    SELECT a.portfolio_id
    INTO   NEW.portfolio_id
    FROM   activos a
    WHERE  a.id = NEW.activo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mandatos_fks ON mandatos;
CREATE TRIGGER trg_mandatos_fks
BEFORE INSERT OR UPDATE OF activo_id ON mandatos
FOR EACH ROW EXECUTE FUNCTION sync_mandatos_fks();

-- ============================================================
-- 6. vencimientos: heredar portfolio_id de activo
-- ============================================================

CREATE OR REPLACE FUNCTION sync_vencimientos_fks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activo_id IS NOT NULL THEN
    SELECT a.portfolio_id
    INTO   NEW.portfolio_id
    FROM   activos a
    WHERE  a.id = NEW.activo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vencimientos_fks ON vencimientos;
CREATE TRIGGER trg_vencimientos_fks
BEFORE INSERT OR UPDATE OF activo_id ON vencimientos
FOR EACH ROW EXECUTE FUNCTION sync_vencimientos_fks();

-- ============================================================
-- 7. PROPAGACIÓN: cuando un activo cambia portfolio o propietario,
--    actualizar todos los hijos denormalizados.
-- ============================================================

CREATE OR REPLACE FUNCTION propagate_activo_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.portfolio_id IS DISTINCT FROM OLD.portfolio_id
     OR NEW.dynamics_account_id IS DISTINCT FROM OLD.dynamics_account_id THEN

    UPDATE ofertas
    SET    portfolio_id        = NEW.portfolio_id,
           dynamics_account_id = NEW.dynamics_account_id
    WHERE  activo_id = NEW.id;

    UPDATE oferta_demanda
    SET    portfolio_id = NEW.portfolio_id
    WHERE  activo_id = NEW.id;

    UPDATE visitas
    SET    portfolio_id = NEW.portfolio_id
    WHERE  activo_id = NEW.id;

    UPDATE negociaciones
    SET    portfolio_id          = NEW.portfolio_id,
           cuenta_propietaria_id = NEW.dynamics_account_id
    WHERE  activo_id = NEW.id;

    UPDATE mandatos
    SET    portfolio_id = NEW.portfolio_id
    WHERE  activo_id = NEW.id;

    UPDATE vencimientos
    SET    portfolio_id = NEW.portfolio_id
    WHERE  activo_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_propagate_activo ON activos;
CREATE TRIGGER trg_propagate_activo
AFTER UPDATE OF portfolio_id, dynamics_account_id ON activos
FOR EACH ROW EXECUTE FUNCTION propagate_activo_changes();

-- ============================================================
-- 8. updated_at automático en tablas con esa columna
-- ============================================================

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated      ON leads;
DROP TRIGGER IF EXISTS trg_mandatos_updated   ON mandatos;
DROP TRIGGER IF EXISTS trg_demandas_updated   ON demandas;
DROP TRIGGER IF EXISTS trg_oferta_demanda_updated ON oferta_demanda;

CREATE TRIGGER trg_leads_updated      BEFORE UPDATE ON leads          FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_mandatos_updated   BEFORE UPDATE ON mandatos       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_demandas_updated   BEFORE UPDATE ON demandas       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_oferta_demanda_updated BEFORE UPDATE ON oferta_demanda FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
