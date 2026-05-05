# Spec del producto — fuente de verdad

Documentación canónica consolidada con el Product Owner el **2026-05-05**.

Cualquier nueva funcionalidad, refactor, label, columna o estado debe validarse contra estos documentos antes de tocar código.

## Índice

| Doc | Contenido |
|---|---|
| [conceptos-negocio.md](./conceptos-negocio.md) | Definiciones canónicas: Oportunidad, Propuesta, Proyecto, Instrucción, Mandato, Cuenta, Portfolio, Activo, Oferta, Alternativa |
| [glosario.md](./glosario.md) | Tabla maestra de términos únicos del sistema y estados canónicos por entidad |
| [terminologia.md](./terminologia.md) | Regla maestra: un concepto = un único término. Sin sinónimos |
| [diseno.md](./diseno.md) | Tres directrices de diseño: 50% ancho · iconos vectoriales monocromo · color restrictivo |
| [spec-modulos.md](./spec-modulos.md) | Cambios estructurales por módulo (pestañas, campos, búsquedas, cascadas) |

## Reglas de oro

1. **Un concepto = un término** — sin sinónimos en todo el sistema.
2. **Vista 360 universal** — mismo componente compartido en todas las fichas.
3. **Confidencialidad canónica** = formato Oferta replicado en todos los módulos.
4. **Información general primero** = Cuenta · Activo · Oportunidad · Instrucción al inicio de cada ficha.
5. **Densidad ejecutiva** = 50% de ancho por defecto, full-width sólo cuando el módulo lo justifique.
6. **Buscar antes que escribir** = lupa con autocomplete sobre tabla master, nunca texto libre.
7. **Crear nuevo = campos vacíos** = nada precargado en formularios de alta.
8. **Cascadas explícitas** = un cambio de estado puede disparar transiciones automáticas en N entidades (ver `glosario.md` · sección "Transiciones de estado con cascada").

## Estado de la spec

| Módulo | Estado |
|---|---|
| Lead | Cerrado |
| Propuesta / Proyecto | Cerrado |
| Mandato | Cerrado |
| Activo | Cerrado |
| Oferta | Cerrado |
| Demanda | Cerrado |
| Arrendatario | Cerrado |
| Propietario | Cerrado |
| Portfolios | Cerrado |
| Negociaciones | Cerrado |
| Mapas | Pendiente |
| Vencimientos | Pendiente |
| Cierre del Mandato | Pendiente |
| Tareas / Visitas / Cuentas / Contactos | Pendiente |
| Inteligencia / Informes / Marketing / Mis Clientes / Usuarios / Zonas / Noticias | Pendiente |
