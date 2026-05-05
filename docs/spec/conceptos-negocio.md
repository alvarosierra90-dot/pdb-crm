# Conceptos fundamentales de negocio

Definiciones canónicas del producto. Confirmado con el Product Owner el 2026-05-05.

## 1. OPORTUNIDAD (Dynamics)

WIP comercial amplio. 0%–100% probabilidad. 5 tipos: `pitch_demanda`, `demanda`, `pitch_oferta`, `oferta`, `generica`. Master Dynamics, read-only en PDB.

## 2. PROPUESTA y PROYECTO — DOS ENTIDADES DISTINTAS (PDB)

Confirmado el 2026-05-05: **NO son sinónimos**, conviven como dos cosas separadas. Al elegir "pitch sí" en una Oportunidad, el usuario decide entre crear una Propuesta o un Proyecto.

### 2a. PROPUESTA
- **Para qué:** captar negocio. Oferta comercial pre-contractual presentada a un cliente para ganar un encargo.
- **Contextos:** leasing de un edificio, venta de un activo o cartera (Capital Markets), captación de un mandato.
- **Características:** vinculada a Oportunidad (Dynamics); competencia con otras consultoras; incluye estrategia, propuesta de valor, condiciones (fees, exclusividad).
- **Resultado:**
  - ganada → genera **Mandato**
  - perdida → oportunidad cerrada sin mandato

### 2b. PROYECTO
- **Para qué:** ejecutar un servicio concreto solicitado por el cliente, sin proceso competitivo.
- **Contextos:** valoración de activos / cartera, reestructuración de deuda, análisis estratégico inmobiliario, consultoría especializada, estudios de mercado.
- **Características:** servicio contratado / solicitado directamente; no requiere pitch competitivo; orientado a ejecución no a captación; vinculable a una Cuenta y a uno o varios Activos o Portfolio.
- **Resultado:** entrega de informe / análisis / recomendación / documento técnico.

### Relación entre ambos
- Una Propuesta ganada puede derivar en un Mandato **o** en un Proyecto posterior.
- Un Proyecto puede existir sin Propuesta previa (cliente lo pide directamente).
- **No deben mezclarse ni reutilizarse como sinónimos** en UI, BD, ni labels.

### Frase canónica para producto
> *Una Propuesta es una oferta comercial para ganar un encargo (leasing, venta, mandato). Un Proyecto es la ejecución de un servicio específico solicitado por el cliente (valoración, consultoría, análisis), sin necesidad de pitch competitivo.*

## 3. INSTRUCCIÓN (Dynamics, bidireccional)

Kickoff formal del trabajo. Se abre en Dynamics **antes del Mandato** (es el handoff formal que da pie al Mandato como contrato Savills). Misma entidad que aparece al cierre, en estado `cerrada_concedida` o `cerrada_perdida` con fee.

### Timing de creación
- **Rama pitch ganado:** Instrucción se crea cuando se gana la Propuesta (junto al Mandato).
- **Rama directa (sin pitch):** Instrucción se crea **tras las visitas, antes de la negociación**.

## 4. MANDATO (PDB)

Contrato formal Savills. Entidad **PDB** con FK obligatorios a Oportunidad + Cuenta + Instrucción (+ Activo si sell). Tiene tipo, vía (pitch / directo), exclusividad, fechas, fee.

**Mandato NO es obligatorio** — Demanda y Oferta pueden vivir sin mandato firmado (sub-brokering, oferta de mandato ajeno, etc.).

## 5. CUENTA (Dynamics)

Empresa principal / matriz comercial. Núcleo relacional. Read-only en PDB.

**Regla absoluta:** "Cuenta" es el único término para la entidad comercial. Cualquier mención a "Cliente" o "Empresa" como entidad es Cuenta. Propietario y Arrendatario son **roles** sobre una Cuenta.

## 6. PORTFOLIO (PDB) — modelo 1:1

**1 Portfolio = 1 Cuenta** (no 1:N).

- **Auto-generado**: cuando una Cuenta se asigna como propietario en un stacking plan, se crea automáticamente un Portfolio para esa Cuenta si no existía.
- **Composición**: si esa Cuenta es propietaria en N stacking plans (N activos), su Portfolio = esos N activos.
- **No hay botón "+ Crear portfolio"** — los portfolios emergen del stacking.
- Si un fondo quiere separar vehículos de inversión → debe ser otra Cuenta hija (entidad legal diferente).

## 7. ACTIVO vs OFERTA

- **Activo** = estructura física inmobiliaria. NO representa disponibilidad.
- **Oferta** = disponibilidad comercializable (mercado o off-market). Cuelga de Activo.
- La disponibilidad SIEMPRE vive en Oferta. La ficha de Activo puede MOSTRAR disponibilidad como KPI agregado de sus Ofertas, nunca persistirla.
- Matching cruza Demanda ↔ Oferta, nunca Demanda ↔ Activo.

## 8. ALTERNATIVA (oferta_demanda)

NO es módulo. Es **vista dentro de la ficha Demanda** + tabla puente `oferta_demanda`. Cada match Oferta ↔ Demanda materializa una fila. Hace snapshot solo de `condiciones_negociadas`; el resto se referencia en vivo desde la Oferta matriz.

## Cómo aplicar

- Reporting: Oportunidad = WIP, Instrucción cerrada = revenue.
- Facturación: contra Entidad Legal de la Cuenta, no contra Cuenta.
- UI Activo: nunca mostrar disponibilidad editable, solo derivada de Ofertas.
- UI Demanda: tab "Alternativas" interno, no un módulo separado.
- Mandato: bloqueado hasta tener Oportunidad + Cuenta + Instrucción.
