# Terminología única en todo el sistema

**Regla:** Un concepto = un único término = uso consistente en todo el sistema. No alternar sinónimos para la misma entidad / campo / estado (ej. nunca "cliente" / "cuenta" / "empresa" si se refieren a lo mismo).

**Por qué:** Evitar confusión al usuario, reducir errores operativos, facilitar adopción, garantizar coherencia en navegación y formación. Definido por el Product Owner el 2026-05-05 como principio fundacional.

## Cómo aplicar

- Antes de añadir un label, botón, columna, header de tabla, tab o mensaje — verificar si ese concepto ya tiene un nombre canónico en otra parte del sistema. Reutilizarlo exactamente.
- Si encuentras dos términos compitiendo en el código actual (ej. "Propuesta" vs "Proyecto", "Tenant" vs "Arrendatario", "Activo" vs "Propiedad"), **parar y preguntar** cuál es el canónico antes de tocar nada.
- Aplica también a:
  - Estados (ej. "ganada" vs "cerrada-ganada")
  - Tipos de operación
  - Roles de usuario
  - Nombres de pestañas
- El [glosario](./glosario.md) define el set canónico — actualizarlo cuando se decida un término nuevo.

## Implicación de no respetar la regla

- Aprendizaje fragmentado del usuario.
- Bugs por inconsistencia de filtros / estados.
- Documentación desincronizada.
- Imposibilidad de generar reports cross-módulo coherentes.
