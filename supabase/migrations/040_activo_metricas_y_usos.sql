-- 040 — Activo: provincia/municipio + métricas dinámicas por uso + homogeneización de usos
-- ============================================================================
-- 1) Nuevas columnas:
--    · provincia / municipio: capturadas de Google Places (administrative_area_level_2
--      y locality) además de `ciudad`.
--    · metricas jsonb: indicadores específicos por Uso principal que no tienen
--      columna propia (Nº habitaciones, Nº viviendas, Sup. de venta, etc.). Las
--      métricas comunes (sba, sup_planta_tipo, ratio_perdida, sup_parcela…) siguen
--      en sus columnas reales.
-- 2) Homogeneización del catálogo de usos a la nomenclatura de mercado.

ALTER TABLE activos ADD COLUMN IF NOT EXISTS provincia text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS municipio text;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS metricas  jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Remapeo de usos antiguos → catálogo canónico (uso principal)
UPDATE activos SET uso = 'Retail High Street'       WHERE uso = 'Retail';
UPDATE activos SET uso = 'Trasteros'                WHERE uso = 'Trastero';
UPDATE activos SET uso = 'Apartamentos Turísticos'  WHERE uso = 'Apartamentos turísticos';
UPDATE activos SET uso = 'Care Homes'               WHERE uso = 'Care homes';
UPDATE activos SET uso = 'Logística'                WHERE uso = 'Logístico';
UPDATE activos SET uso = 'Hotel'                    WHERE uso = 'Hoteles';

-- Idéntico para uso_secundario
UPDATE activos SET uso_secundario = 'Retail High Street'      WHERE uso_secundario = 'Retail';
UPDATE activos SET uso_secundario = 'Trasteros'              WHERE uso_secundario = 'Trastero';
UPDATE activos SET uso_secundario = 'Apartamentos Turísticos' WHERE uso_secundario = 'Apartamentos turísticos';
UPDATE activos SET uso_secundario = 'Care Homes'             WHERE uso_secundario = 'Care homes';
UPDATE activos SET uso_secundario = 'Logística'              WHERE uso_secundario = 'Logístico';
UPDATE activos SET uso_secundario = 'Hotel'                  WHERE uso_secundario = 'Hoteles';
