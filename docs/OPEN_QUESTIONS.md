# Preguntas Abiertas

> Dudas, contradicciones y supuestos pendientes. Una pregunta se cierra cuando se responde y, si implica una elección, se registra en `DECISIONS.md`.

Estado de cada pregunta: `Abierta` | `Respondida` | `Descartada`
Impacto: `Alto` (bloquea arquitectura) | `Medio` (afecta un módulo) | `Bajo`

Las preguntas se formulan módulo a módulo. Las que siguen provienen del módulo 1 (REQ-005 a REQ-009).

| ID | Pregunta | Por qué importa | Impacto | Estado |
|---|---|---|---|---|
| Q-001 | ¿Cuántos PIN fallidos bloquean al usuario y cómo se desbloquea? | Equilibra seguridad y fricción en el mostrador | Medio | Respondida → DR-011, ADR-007 (5 intentos, desbloqueo manual con PIN nuevo) |
| Q-002 | ¿El username es único en todo el sistema o por compañía? | Al entrar solo se escribe username y PIN | Medio | Respondida → DR-011 (único en todo el sistema, con el código de la compañía como prefijo) |
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
| Q-015 | Los roles los crea un administrador. Si una compañía tiene varios administradores, ¿ven y pueden usar los demás los roles que creó uno de ellos? ¿Quién puede editarlos? | Define quién puede cambiar permisos de los usuarios de una compañía compartida | Alto | Respondida → DR-008 (solo el dueño del rol lo ve, lo usa y lo edita) |
| Q-019 | Un administrador B gestiona a un usuario cuyo rol creó otro administrador A. ¿Qué ve B de ese rol? | Consecuencia de Q-015 en compañías con varios administradores | Medio | Respondida → DR-008 (propuesta adoptada para avanzar: B ve al usuario con la etiqueta "rol de otro administrador", sin los permisos; puede desbloquearlo, cambiarle el PIN y desactivarlo, pero no cambiarle el rol) |
| Q-016 | ¿Cómo se registra el canal (interfaz, API, app, MCP) en el historial? Propuesta: según el cliente OAuth del token; sin cliente, interfaz. Hay que validar que Supabase lo exponga en el JWT. | P-02 exige el canal en cada registro | Medio | Abierta — se valida en el diseño |
| Q-017 | ¿Qué proyecto de Supabase, en qué región, y hay requisitos legales de residencia de datos? Los cuatro proyectos de la cuenta están inactivos y parecen de otros usos. | Cambiar de región después implica migrar | Medio | Respondida en parte → proyecto `argos` (ref `wqzeqrjzahtqufasrydb`) creado el 2026-10-25 en `us-east-1`, plan sin costo. Falta confirmar los requisitos legales de residencia de datos. |
| Q-018 | ¿Los administradores entran con su correo o con un username? Propuesta: correo, que también sirve para TOTP y recuperación. Además, ¿cómo se crea el primer superadmin? | Define el login de administradores y el arranque del sistema | Medio | Respondida en parte → el primer superadmin se crea la primera vez que arranca el servidor (REQ-006, CA-02b). Falta confirmar que los administradores entran con correo. |
| Q-014 | ¿Cuál es el plan de Supabase y permite limitar la duración de la sesión? ¿El Password Verification Hook soporta el volumen esperado de intentos? | Condiciona cómo se implementa el tope de sesión de ADR-009 | Medio | Abierta — se verifica al diseñar |
