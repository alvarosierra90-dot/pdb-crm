# Armonía y coherencia · Property Database

**Fecha:** 27/04/2026
**Alcance:** auditoría visual / UX entre módulos. **No** se cambian funcionalidades.
**Nota:** el sistema funciona bien — el objetivo es alinear patrones para que respire como un único producto.

---

## Resumen ejecutivo · 7 desviaciones priorizadas

1. 🟠 **`ActivosList` y `OportunidadesList` no tienen KPI strip.** Las demás listas (Ofertas, Demandas, Mandatos, Negociaciones, Leads) sí. Crea sensación de listas "menos importantes" sin razón.

2. 🟠 **Tags de Oportunidad usan colores inline en lugar de clases globales.** `ETAPA_TAG` en `OportunidadesList.jsx:33-39` y `FichaOportunidad.jsx:5-11` define paleta propia. Conceptos equivalentes ("pendiente", "negociación") aparecen con colores diferentes en distintas pantallas.

3. 🟠 **Lead define su propia paleta** (`LEAD_TIPOS`, `LEAD_ESTADOS`, `LEAD_PRIORIDADES` en `mockLeads.js`) con estilos inline (`color + "33"` alpha dinámico), en lugar de las clases `.tag-*` que usa el resto.

4. 🟡 **Banners inconsistentes**. Hay 3 estilos de banner superior: azul Dynamics (Cuentas/Contactos/EL/Op/Instr), amarillo "L" en Leads, sin banner en Negociaciones/Mandatos/Propuestas. Cada uno con variantes inline.

5. 🟡 **Nomenclatura de tabs**. "Historial" en `FichaArrendatario` y `FichaNegociacion` vs "Actividades" / "Seguimiento comercial" en el resto. Mismo concepto, tres nombres.

6. 🟡 **Modales con divergencias menores**. `LeadNuloModal` usa gap 12 vs 14 estándar. `AsignarTareaModal` success state con fondo gris en vez de verde.

7. 🟢 **Parámetros de navegación heterogéneos**. `{ ref }`, `{ id }`, `{ ofertaRef }`, `{ arrRef }`. Funciona pero es ad-hoc.

**Lo que ya está bien y sirve de referencia:**
- ✓ Estructura de fichas (action-bar + header `.ah` + tabs) coherente en casi todas
- ✓ Modales comparten skeleton (overlay, panel, header/body/footer)
- ✓ Botón "← Volver" presente en todas las fichas
- ✓ FK obligatorio con `★ FALTA` rojo y badge azul "D · OPO-xxxx" para Dynamics
- ✓ Stacking Plan ya unificado (un solo componente compartido)

---

## Plan de correcciones priorizado

| # | Cambio | Esfuerzo | Impacto |
|---|---|---|---|
| 1 | Crear componente `BannerInfo` reutilizable | Bajo | Alto |
| 2 | Añadir KPI strip a `ActivosList` y `OportunidadesList` | Medio | Alto |
| 3 | Normalizar `ETAPA_TAG` (Oportunidad) a clases `.tag-*` | Bajo | Alto |
| 4 | Normalizar tags de Lead a clases globales | Medio | Medio |
| 5 | Renombrar tabs "Historial" → "Actividades" | Bajo | Medio |
| 6 | Pulir modales (gap, success state) | Bajo | Bajo |
| 7 | Implementar tab Actividades real en `FichaLead` | Medio | Medio |

Aplico en este orden — cambios pequeños primero, luego los de mayor impacto.

---

## EJE 1 — Patrón de ficha

**Patrón canónico:**
```jsx
<div className="action-bar">
  💾 Guardar · Guardar y cerrar · ← Volver · | · [específicos] · | · ✅ Asignar tarea
</div>
<div className="ah">
  <icono> + .ah-name + .ah-addr + .ah-tags
</div>
<div className="tabs">
  <div className="tab active">…</div>
</div>
```

**Coherente:** todas las fichas siguen este patrón.

**Ajuste menor:**
- `FichaLead`: action-bar tiene "⚡ Transformar" y "✗ Lead Nulo" como botones primarios. Decisión: dejarlos — son el corazón del módulo. Sí pulir orden y estilo.

---

## EJE 2 — Patrón de lista

**Faltan KPI strips en:**
- `ActivosList` → añadir: Total · Disponibles · SBA total · Ocupación promedio Σ · Días comerc. promedio Σ
- `OportunidadesList` → añadir: Total · Identificación · Negociación · Acuerdo · Lifetime total

**Banners**: extraer a componente `BannerInfo` con variantes `dynamics`, `info`, `warning`.

---

## EJE 3 — Marcas de vinculación

**Patrones canónicos ya en uso:**
- ★ FALTA rojo cuando falta FK obligatorio
- Badge azul `D · OPO-xxxx` para Dynamics
- Badge `🔒 heredada de Op` para Cuenta heredada
- Sufijo `Σ` para KPIs derivados

**Aplicado en:** Mandato, Propuesta, Negociación, Demanda. **Faltaría revisar:** otras vistas que muestren oportunidades vinculadas.

---

## EJE 4 — Tags y semántica de color

**Patrón canónico:** clases globales en `src/styles/global.css`:
- `.tag-blue` — info / Dynamics / oficinas
- `.tag-green` — ok / disponible / ganado
- `.tag-amber` — pendiente / atención
- `.tag-red` — crítico / perdido / nulo
- `.tag-purple` — advisory / servicio / negociación
- `.tag-gray` — neutral / cerrado

**Desviaciones:**

`OportunidadesList.jsx:33-39` y `FichaOportunidad.jsx:5-11`:
```js
const ETAPA_TAG = {
  'Identificación':    { bg:'#f0f9ff', color:'#0369a1', bd:'#bae6fd' },
  'Calificación':      { bg:'#fefce8', color:'#92400e', bd:'#fde68a' },
  ...
}
```
→ Mapear a `.tag-blue` (Identificación, Propuesta), `.tag-amber` (Calificación), `.tag-purple` (Negociación), `.tag-green` (Acuerdo).

`mockLeads.js`:
```js
{ key:'nuevo', label:'Nuevo', color:'#1e40af', bg:'#dbeafe' }
```
→ Mapear a una clase canónica en lugar de inline.

---

## EJE 5 — Modales

**Skeleton común:** overlay 0.48 + panel borderRadius 12 + header padding 16-20 + body 18-20 gap 14 + footer 14-20.

**Ajustes:**
- `LeadNuloModal.jsx:17` — gap 12 → 14
- `AsignarTareaModal.jsx` success state → fondo verde

---

## EJE 6 — Trazabilidad / actividades

**Patrón canónico:** tabla con columnas Fecha · Tipo (icono+tag) · Asunto · Responsable (avatar) · Estado.

**Iconos por tipo:** 📧 Email · 📞 Llamada · 🤝 Reunión · ✅ Tarea · 🏠 Visita · 📤 Presentación

**Estados:** Abierto amber · En curso blue · Realizada green · Finalizado gray

**Renombrar tabs:**
- `FichaArrendatario` clave `'historial'` → `'arr-actividades'` (label "Actividades")
- `FichaNegociacion` clave `'neg-historial'` → `'neg-actividades'`

**Implementar tab actividades real en `FichaLead`** (ahora muestra placeholder).

---

## EJE 7 — Navegación

**Funciona pero es ad-hoc.** Mejora futura: centralizar parámetros en helpers (`navigateToActivo(ref)`, `navigateToOferta(ref)`). No urgente.

**Botón Volver:** presente en todas. ✓

**Click en row:** funciona en la mayoría. Verificar las que no.

---

## Decisiones de diseño aplicadas en esta iteración

1. Crear `BannerInfo` componente reutilizable con variantes.
2. Añadir KPI strips faltantes.
3. Migrar `ETAPA_TAG` y tags de Lead a clases globales con mapping de colores semánticos.
4. Renombrar tabs de actividades para coherencia.
5. Pulir modales menores.
6. Implementar tab Actividades real en FichaLead.

**No se tocan funcionalidades.** Solo capa visual y nomenclatura.
