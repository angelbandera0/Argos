# REQ-011 — Notificaciones

- **Módulo:** Notificaciones (Módulo 2)
- **Estado:** Borrador
- **Prioridad:** Imprescindible
- **Actor(es):** Cualquier usuario (destinatario); el sistema (emisor)

## Resultado esperado
Cada usuario recibe los avisos que le corresponden por su rol y alcance, los consulta desde la campana y desde una sección propia, y puede filtrarlos por módulo, operación y prioridad. Cualquier módulo puede emitir notificaciones sin conocer a los destinatarios.

Detalle: `docs/superpowers/specs/2026-11-06-modulo-2-almacen-pedidos/02-notificaciones.md`.

## Criterios de aceptación
Verificables, en formato DADO … CUANDO … ENTONCES.

- CA-01: DADO un hecho notificable, CUANDO ocurre, ENTONCES cada usuario con el permiso y alcance indicados recibe una notificación y quien lo provocó no.
- CA-02: DADO notificaciones sin leer, CUANDO el usuario abre una desde la campana, ENTONCES se marca leída y el contador baja.
- CA-03: DADO la sección de notificaciones, CUANDO filtra por módulo y operación, ENTONCES solo ve las coincidentes.
- CA-04: DADO el dashboard, ENTONCES muestra las solicitudes del día y las últimas diez notificaciones.
- CA-05: DADO un usuario sin «ver costos», ENTONCES ninguna de sus notificaciones muestra montos de costo.

## Restricciones
DR-017 (historial), DR-026 (notificación). Decisiones M2-D04 (costos reservados), M2-D05 (roles configurables).

## Fuera de alcance
- Ver notificaciones ajenas (solo las propias).
- Tiempo real: pendiente de decidir (M2-Q03); el diseño no debe impedir cambiar de uno a otro.
- Retención de leídas y alcance de «ver todas» (M2-Q07).

## Exposición
- **API REST:** `/api/v1/notificaciones` (listar con filtros, contar no leídas, marcar leídas).
- **MCP:** por definir en el plan del módulo; sin montos de costo para quien no tenga «ver costos».

## Dependencias y preguntas abiertas
REQ-007 (permiso Notificaciones), REQ-009, REQ-012 y REQ-013 (emisores). M2-Q03, M2-Q07.

## Notas para el manual
Se completa al implementar (D-04).
