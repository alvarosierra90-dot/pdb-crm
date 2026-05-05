# Glosario canónico

Tabla maestra de términos consolidada con el Product Owner el 2026-05-05.

Cualquier label, columna, valor de estado, header de tabla debe usar exactamente estos términos. Sin alternar sinónimos. Cuando aparezca un término nuevo, validar contra este documento antes de añadirlo.

## Términos confirmados

### 1. Propuesta vs Proyecto — DOS ENTIDADES DISTINTAS
- **Propuesta** = oferta comercial pre-contractual para ganar un encargo. Vinculada a Oportunidad. Si gana → genera Mandato.
- **Proyecto** = ejecución de un servicio concreto solicitado por el cliente. No requiere pitch competitivo.
- Detalle completo en [conceptos-negocio.md](./conceptos-negocio.md).

### 2. Arrendatario
- Único término para la entidad-inquilino (en español, no "Tenant").
- Campo "Tenant (Cuenta)" → renombrar a **"Arrendatario (Cuenta)"**.
- Mantiene "Arrendatario desconocido" como fallback cuando no hay Cuenta vinculada.

### 3. Activo / Edificio / Propiedad
- **Activo** = único término para la entidad-inmueble.
- **Edificio** = se mantiene en dos contextos legítimos:
  - sub-unidad dentro de un Activo multi-edificio (Edif. A / B / C).
  - valor del campo `tipo_activo` (junto a Nave, Local, Parcela, Complejo, Torre, Centro comercial, etc.).
- **Propiedad** = corregir 2 mislabels:
  - `FichaArrendatario.jsx:666` "Propiedad (Cuenta)" → "Propietario (Cuenta)".
  - `FichaOfertaSupabase.jsx:41` "Retirada por la propiedad" → "Retirada por el propietario".
- "Propiedad 100%" en `FichaPropietario.jsx:119` se mantiene — es **régimen de tenencia**, concepto distinto.

### 4. Estados de Propuesta (resultado del pitch)
| Estado | Cuándo |
|---|---|
| Borrador | En preparación, aún no entregada |
| Standby | Presentada al cliente, sin decisión / cliente aplaza |
| Ganado | Pitch ganado → genera Mandato |
| Perdido | Pitch perdido → oportunidad cerrada |
| Cancelada | Anulada antes de respuesta |

Género **masculino fijo**: "Ganado / Perdido" en todas las entidades (incluso Propuesta / Oportunidad / Demanda).

### 5. Estados del Lead
- **Standby** (creación por defecto, sin tocar)
- **Cualificado**
- **No cualificado**

### 6. Vista 360
- **Vista 360** (no "Ciclo 360°", no "Vista 360º").
- Mismo componente compartido en: Activo · Oferta · Demanda · Propuesta · Proyecto · Mandato · Instrucción · Propietario · Arrendatario.
- En Demanda fusiona Seguimiento comercial + Ciclo 360 + Actividades en este único tab.

### 7. Cuenta — REGLA ABSOLUTA
- "Cuenta" es el único término para la entidad comercial.
- "Cliente" y "Empresa" → eliminar como labels en TODOS los contextos:
  - Listas de campos confidenciales: "Cliente / Cuenta" → "Cuenta", "Cliente / Empresa" → "Cuenta".
  - Estados / causas: "Cliente cancela el encargo" → "Cuenta cancela el encargo".
  - Textos: "Texto comercial visible al cliente final" → "Texto comercial visible a la Cuenta".
- **Implicación arquitectónica**: Propietario y Arrendatario son **labels de rol** sobre una Cuenta. Internamente siempre apuntan al master `cuentas` vía FK. La búsqueda en sus campos (al crear arrendatario o propietario) busca sobre `cuentas`, no es texto libre.

### 8. Equipo vs Equipo de trabajo
- **Equipo** = unidad organizativa interna (Leasing Oficinas MAD, Leasing Industrial MAD, Capital Markets, etc.). Unifica todas las variantes "Equipo asignado / Equipo responsable" → **Equipo**.
- **Equipo de trabajo** = personas concretas asignadas al registro (con roles), pueden venir de cualquier Equipo. Aplica a Lead, Demanda, Oferta, Propuesta, Proyecto, Mandato, Negociación.

### 9. Documentos comerciales — 4 conceptos distintos
| Término | Qué es |
|---|---|
| **Ficha comercial** | PDF / PPT por **una oferta** |
| **Dossier** | PDF más extenso de un **activo** o **portfolio** |
| **Microsite** | **Link web** con varias ofertas, enviado al cliente desde Demanda |
| **Presentación** | Categoría genérica de material |

### 10. Tipos de Mandato

**Origen = Demanda** (Cuenta busca espacio):
- Demanda alquiler
- Demanda venta
- Demanda alquiler / venta

**Origen = Oferta** (activo a comercializar):
- Oferta alquiler
- Oferta venta

**Transversal:**
- Consultoría (cuando es Proyecto, no Mandato)

Schema viejo `('sell','buy')` queda obsoleto — usar el set español.

### 11. Roles del Equipo de trabajo y permisos
- **Principal**: edita todo + es el único que puede añadir / quitar Soportes y Colaboradores.
- **Soporte**: edita datos (entrada concedida por el Principal).
- **Colaborador**: solo lectura.

### 12. Estado "Activo" del Activo
- El estado actual `'Activo'` (en `mockData.js`) → renombrar a **"Activo en mercado"** para evitar colisión con la entidad Activo.

## Estados canónicos por entidad

### Lead
- **Standby** (creación por defecto, sin tocar)
- **Cualificado**
- **No cualificado**

### Propuesta (5 estados)
| Estado | Cuándo |
|---|---|
| Borrador | En preparación, aún no entregada |
| Standby | Presentada al cliente, sin decisión / cliente aplaza |
| Ganado | Pitch ganado → genera Mandato |
| Perdido | Pitch perdido → oportunidad cerrada |
| Cancelada | Anulada antes de respuesta |

### Demanda (6 estados)
| Estado | Cuándo / Transición |
|---|---|
| Standby | Pausada — al asignar este estado, **dispara modal de calendario para fijar fecha de recordatorio** |
| En curso | Activamente buscando alternativas |
| Finalista | El cliente se queda con una opción concreta — **dispara creación del registro en Negociación** |
| Ganado | Operación firmada |
| Perdido | Cliente desiste / no firma |
| Cancelada | Cliente retira el encargo |

### Oferta (5 estados)
| Estado | Cuándo / Transición |
|---|---|
| Oferta futura | Conocida pero todavía no comercializable |
| En comercialización | Activa en mercado |
| En negociación | Hay contraparte concreta negociando |
| Cerrada | Deal firmado — **autopuebla Hoja del Arrendatario + asigna al stacking plan** |
| Desactivada | Propietario retira sin operación |

(Reservada queda fuera de momento, posible añadido futuro.)

### Mandato (5 estados)
- En curso
- Ganado
- Perdido
- Cancelado
- Vencido (vigencia llega a su fin sin cerrar deal)

### Negociación
- En negociación
- Pendiente respuesta
- Acuerdo alcanzado
- Firmado
- Rechazado

### Actividad / Tarea (mismo set)
- Pendiente
- En curso
- Completada
- Cancelada

### Visita
- Programada
- Realizada
- Cancelada
- Reprogramada

### Activo (estado de mercado)
- Activo en mercado
- En comercialización
- Reservado
- Vendido
- Inactivo

### Arrendamiento (vida del contrato)
- Vigente
- Prorrogado
- Renovado
- Vencido
- Abandonado

### Propietario
- Activo
- Inactivo
- En desinversión
- Vendido

### Proyecto
- Borrador
- En curso
- Entregado
- Cancelado

## Transiciones de estado con cascada

1. **Demanda → Standby**: abrir modal de calendario para fecha de recordatorio (recall del cliente).
2. **Demanda → Finalista**: crear automáticamente registro en Negociación.
3. **Oferta → Cerrada**: autopoblar Hoja del Arrendatario + asignar superficie en stacking plan.
4. **Propuesta → Ganado**: crear Mandato.
5. **Negociación → Firmado**: dispara Oferta → Cerrada (que a su vez dispara Arrendatario + Stacking). Cadena: 1 click → 4 efectos.
6. **Asignar Cuenta como propietario en Stacking**: crear Portfolio para esa Cuenta si no existe.
