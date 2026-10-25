# REQ-003 — Gestión de integraciones y usuarios técnicos

- **Módulo:** Plataforma / Administración
- **Estado:** Borrador — pendiente de desglose
- **Prioridad:** Imprescindible
- **Actor(es):** Administrador, sistema externo

## Resultado esperado
Un sistema externo puede consumir la API de forma segura, con permisos acotados, trazabilidad completa y posibilidad de revocar su acceso al instante, sin usar claves estáticas.

## Criterios de aceptación
Confirmados por decisiones previas (ADR-004, T-05, T-06). El resto se definirá en el desglose.

- CA-01: DADO una nueva integración, CUANDO un administrador la registra, ENTONCES se crea un usuario técnico con rol propio que opera mediante OAuth 2.1 (sin API key estática).
- CA-02: DADO una integración activa, CUANDO un administrador revoca su acceso desde el panel, ENTONCES sus tokens dejan de ser válidos.
- CA-03: DADO una llamada a la API de cualquier integración, CUANDO se ejecuta, ENTONCES queda auditada (quién, cuándo, qué endpoint, resultado).
- CA-04: DADO una integración que supera el límite de peticiones, CUANDO sigue llamando, ENTONCES recibe rechazo por rate limiting.

## Restricciones
P-01, T-04, T-05, T-06.

## Fuera de alcance
- API keys estáticas (descartadas en v1, ADR-004).

## Exposición
- **API REST:** _por definir._
- **MCP:** _por definir — probablemente no exponer la gestión de integraciones por seguridad._

## Dependencias y preguntas abiertas
- Depende del modelo de roles y permisos (Q-007).
- Riesgo: servidor OAuth de Supabase en beta (ADR-004).
- Preguntas de desglose: _pendientes._

## Notas para el manual
_Se completa al implementar._
