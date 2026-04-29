-- ============================================================
-- PDB · Migración 014 — Relajar campos NOT NULL en propuestas
-- Cuando se crea un registro al transformar un Lead, no debemos
-- inventar contenido (nombre, tipo, notas...). Solo deben quedar
-- obligatorios los FK estructurales. La columna nombre ya era
-- nullable en demandas; en propuestas la liberamos también.
-- ============================================================

ALTER TABLE propuestas ALTER COLUMN nombre DROP NOT NULL;
