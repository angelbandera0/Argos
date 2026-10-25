# REQ-001 — Configuración de exposición MCP

- **Módulo:** Plataforma / Administración
- **Estado:** Borrador — pendiente de desglose
- **Prioridad:** Imprescindible
- **Actor(es):** Administrador

## Resultado esperado
Un administrador controla desde el panel qué herramientas MCP están disponibles y para qué roles, sin tocar código, de modo que ningún agente pueda acceder a algo que no se haya habilitado explícitamente.

## Criterios de aceptación
Confirmados por decisiones previas (ADR-005, T-07). El resto se definirá en el desglose.

- CA-01: DADO una herramienta deshabilitada globalmente, CUANDO cualquier agente intenta usarla, ENTONCES la petición se rechaza y la herramienta no aparece en el listado que recibe el cliente MCP.
- CA-02: DADO una herramienta habilitada globalmente pero no permitida para un rol, CUANDO un usuario con ese rol se conecta vía MCP, ENTONCES la herramienta no está disponible para él.
- CA-03: DADO un usuario cuyos permisos no cubren una operación, CUANDO su agente invoca una herramienta habilitada que la ejecuta, ENTONCES el caso de uso rechaza la operación (el agente nunca excede los permisos del usuario).
- CA-04: DADO una herramienta de categoría `sensible` recién creada, CUANDO se despliega, ENTONCES está deshabilitada por defecto.
- CA-05: DADO una herramienta `sensible` habilitada, CUANDO un agente la invoca, ENTONCES se requiere confirmación antes de ejecutarla.

## Restricciones
P-01, T-03, T-04, T-07.

## Fuera de alcance
- Configuración por usuario individual o por token (descartado para v1, ADR-005).

## Exposición
- **API REST:** _por definir en el desglose._
- **MCP:** _por definir — ¿la propia configuración del MCP debe poder gestionarse vía MCP? (probablemente no, por seguridad)._

## Dependencias y preguntas abiertas
- Depende del modelo de roles y permisos (Q-007).
- Preguntas de desglose: _pendientes._

## Notas para el manual
_Se completa al implementar._
