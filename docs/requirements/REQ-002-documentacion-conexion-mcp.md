# REQ-002 — Documentación de conexión MCP

- **Módulo:** Plataforma
- **Estado:** Borrador — pendiente de desglose
- **Prioridad:** Imprescindible
- **Actor(es):** Cualquier usuario autenticado

## Resultado esperado
Cualquier usuario puede conectar su cliente de IA al sistema siguiendo instrucciones que reflejan exactamente lo que él tiene habilitado, sin depender de soporte técnico.

## Criterios de aceptación
Confirmados por decisiones previas (ADR-005). El resto se definirá en el desglose.

- CA-01: DADO un usuario autenticado, CUANDO abre la página de conexión MCP, ENTONCES ve solo las herramientas a las que tiene acceso efectivo (global ∩ rol ∩ permisos).
- CA-02: DADO un cambio en la configuración de exposición (REQ-001), CUANDO el usuario vuelve a abrir la página, ENTONCES la documentación refleja el cambio sin intervención manual.
- CA-03: DADO la página de conexión, CUANDO el usuario la consulta, ENTONCES encuentra instrucciones específicas por cliente MCP soportado.

## Restricciones
T-07.

## Fuera de alcance
_Por definir._

## Exposición
- **API REST:** _por definir._
- **MCP:** _no aplica a priori (es documentación para conectarse); por confirmar._

## Dependencias y preguntas abiertas
- Depende de REQ-001.
- Preguntas de desglose: _pendientes (ej. qué clientes MCP se soportan oficialmente)._

## Notas para el manual
_Se completa al implementar._
