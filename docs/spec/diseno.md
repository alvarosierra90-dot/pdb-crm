# Directrices de diseño — densidad y consistencia visual

Tres reglas transversales definidas con el Product Owner el 2026-05-05.

---

## 1. Regla del 50% — uso del espacio

**Por defecto, todos los módulos / widgets / cards ocupan 50% del ancho** (grid de 2 columnas). Evitar el diseño vertical tipo lista. Maximizar información visible sin scroll.

### Por qué
El layout actual desperdicia espacio horizontal — cada bloque ocupa toda la pantalla generando scroll vertical infinito. El producto necesita densidad ejecutiva (estilo Notion / Linear / dashboards SaaS), mejor lectura de un vistazo y uso eficiente del espacio.

### Cómo aplicar

- Layout base: `grid-template-columns: repeat(2, 1fr)` con gap razonable.
- Sólo puede ser **full-width (100%)** si el módulo es:
  - **De entrada principal** (asistente, buscador global).
  - **De foco crítico** (convocatorias destacadas, alertas top, banner de estado).
  - **Visualización compleja** que genuinamente lo requiere (mapa grande, stacking plan, tabla extensa con muchas columnas).

### Jerarquía
- Nivel 1 (full): muy pocos elementos.
- Nivel 2 (50%): la mayoría de módulos / cards.
- Nivel 3 (grid interno): listas y detalles dentro de cada card.

### Regla de decisión rápida
> *"Si un módulo no necesita toda tu atención → no puede ocupar toda la pantalla."*

### Aplicación verificable
- Vistas Overview / Dashboard / Vista 360 / pestañas con múltiples bloques → 2 columnas por defecto.
- Listas-tabla con muchas columnas (ActivosList, CuentasList, etc.) → tabla full-width está justificada (visualización compleja).
- Fichas con tabs y formularios → dentro de cada tab, si hay múltiples cards (KPIs, info, gráficos), aplicar grid 2 columnas.

---

## 2. Iconos — vectorizados monocromo

**Sólo iconos vectorizados (SVG) en un único color.** Nada de iconos infantiles, multicolor, emojis grandes o estilo "niño de 5 años".

### Por qué
Acabado profesional / ejecutivo (Notion / Linear). Los iconos multicolor y emojis hacen el producto parecer juguete.

### Cómo aplicar
- Set de iconos consistente (lucide-react, heroicons, o similar).
- Color: el del texto secundario (`var(--text3)` o `var(--text4)`), o accent en estados activos. Nunca rojo+verde+amarillo+azul mezclados en la misma vista.
- Emojis grandes en headers / cards → reemplazar por iconos vectoriales.
- Iconos viejos infantiles o multicolor (📊 📁 🏢 ✅ ❌ etc. usados decorativamente) → sustituir por icon-component monocromo.

---

## 3. Color — uso restrictivo

**Sólo se resaltan en color los campos / elementos importantes.** El resto va en gris / neutro.

### Por qué
Si todo es de color, nada destaca. La densidad ejecutiva (regla 50%) requiere que el ojo encuentre rápido lo que importa.

### Cómo aplicar

- Por defecto: tipografía y bordes en grises (`--text1`, `--text2`, `--text3`, `--border`).
- Color sólo para:
  - **KPIs críticos** (renta, ocupación, alertas, fechas vencidas).
  - **Estados activos** (badges de estado del módulo).
  - **Errores** (campos obligatorios no rellenos → reborde rojo).
  - **CTAs principales** (botón primario por card).
- NO usar color para:
  - Decorar headers de sección.
  - Fondos de cards genéricas.
  - Tags repetitivos en listas largas (saturación).

### Antes de pintar algo de color
Preguntarse: *"¿Es importante que el usuario lo localice rápido?"*. Si no → gris.
