# Preguntas Abiertas

> Dudas, contradicciones y supuestos pendientes. Una pregunta se cierra cuando se responde y, si implica una elección, se registra en `DECISIONS.md`.

Estado de cada pregunta: `Abierta` | `Respondida` | `Descartada`
Impacto: `Alto` (bloquea arquitectura) | `Medio` (afecta un módulo) | `Bajo`

Las preguntas se formulan módulo a módulo. Las que siguen provienen del módulo 1 (REQ-005 a REQ-009).

| ID | Pregunta | Por qué importa | Impacto | Estado |
|---|---|---|---|---|
| Q-001 | ¿Cuántos PIN fallidos bloquean al usuario y cómo se desbloquea? | Equilibra seguridad y fricción en el mostrador | Medio | Respondida → DR-011, ADR-007 (5 intentos, desbloqueo manual con PIN nuevo) |
| Q-002 | ¿El username es único en todo el sistema o por compañía? | Al entrar solo se escribe username y PIN | Medio | Respondida → DR-011 (único en todo el sistema) |
| Q-003 | ¿Qué pasa con la sesión al cambiar de tienda? | Define el comportamiento al cambiar de tienda | Medio | Respondida → DR-013, ADR-009 |
| Q-004 | ¿Qué historial ven los administradores y el superadmin? | Define el alcance de la visibilidad del historial | Medio | Respondida → DR-017, ADR-010 |
| Q-005 | ¿Se puede reactivar lo desactivado, quién y cómo? ¿Se desactiva en cascada? | Falta la regla inversa a DR-015 | Medio | Respondida → DR-015, ADR-008 |
| Q-006 | ¿Se puede eliminar una compañía, sede o tienda sin datos? | Define el caso borde de DR-015 | Bajo | Respondida → DR-015 |
| Q-007 | ¿Puede el superadmin quitar el acceso a un administrador que no es fundador? | Afecta a la recuperación ante un administrador comprometido | Medio | Respondida → DR-005 |
| Q-008 | ¿Qué motivos predefinidos tiene la lista de desactivación? | Hace falta el contenido de la lista | Bajo | Respondida → DR-015 |
| Q-009 | ¿Puede un usuario operativo tener tiendas de compañías distintas? | Afecta al modelo de datos y a P-01 | Alto | Respondida → DR-009 (no) |
| Q-010 | ¿Cómo se implementa username + PIN sobre Supabase Auth manteniendo OAuth 2.1? | Condiciona la arquitectura de autenticación | Alto | Respondida → ADR-007, ADR-011 |
| Q-011 | ¿Qué se expone por REST y MCP en este módulo? | D-04 exige exposición MCP o justificación | Medio | Respondida → ADR-012 |
| Q-012 | ¿Nombres repetidos y eliminación de categorías con productos? | Evita datos ambiguos en el catálogo | Medio | Respondida → DR-016 |
| Q-013 | ¿Qué política de contraseñas se aplica al superadmin y a los administradores? | Son las cuentas de mayor riesgo | Medio | Respondida → ADR-007 (TOTP obligatorio y contraseña de mínimo 12 caracteres, sin reglas de composición forzadas) |
| Q-014 | ¿Cuál es el plan de Supabase y permite limitar la duración de la sesión? ¿El Password Verification Hook soporta el volumen esperado de intentos? | Condiciona cómo se implementa el tope de sesión de ADR-009 | Medio | Abierta — se verifica al diseñar |
