# PDB · CRM inmobiliario

App React + Vite sobre Supabase. Prototipo funcional de un CRM inmobiliario
organizado en dos pilares —**Activo** y **Cliente**— con el flujo comercial
Lead → Oportunidad → Propuesta → Mandato → Oferta → Negociación → Cierre.

## Antes de tocar nada

**Lee `REGLAS_PDB.md`.** Contiene las reglas del usuario sobre terminología,
componentes compartidos, formato de IDs, borrado, diseño y forma de trabajar.
Romperlas obliga a rehacer trabajo.

Documentación de referencia, en la raíz:

- **`REGLAS_PDB.md`** — reglas transversales del proyecto. Empieza por aquí.
- **`STACKING_PLAN_PDB.md`** — el Stacking Plan: estructura de edificios y
  plantas, asignación y baja de propietarios y arrendatarios, reglas de bloqueo,
  cadena de fechas del contrato.
- **`GUIA_OFERTA_PDB.md`** — la Oferta: flujo end-to-end y catálogo completo de
  campos desplegables.
- **`GLOSARIO_DATOS_PDB.md`** — qué significa cada columna de superficie, renta,
  estado y vínculo. Consúltalo antes de tocar esas columnas.

## Las tres reglas que más se rompen

1. **El stacking es la única fuente de verdad.** `activos.stacking_data` manda;
   ocupación, superficies y nº de plantas se **derivan** de él, no se leen de
   campos almacenados.
2. **Un concepto, un término.** Sin sinónimos en interfaz, columnas ni código.
   Ante un conflicto de nombres, para y pregunta.
3. **Nada se borra**, se cambia de estado. El borrado real rompe la
   trazabilidad.

## Comandos

```bash
npm run dev            # servidor de desarrollo
npx vite build         # build de producción
npx eslint <ficheros>  # el repo arrastra errores previos: el listón es no empeorarlo
```

Producción: https://pdb-crm.vercel.app/

## Convenciones

- Referencias: **`PREFIJO-XXXXXXX`** (3 letras + 7 dígitos), generadas **solo**
  con `nextRef(tabla, prefijo)`.
- Tras cualquier cambio funcional: **commit + push**, sin esperar a que lo pidan.
- Componentes siempre a nivel de módulo, nunca dentro del render de otro (el
  input pierde el foco al teclear).
