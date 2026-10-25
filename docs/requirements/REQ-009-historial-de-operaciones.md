# REQ-009 — Historial de operaciones

- **Módulo:** Historial
- **Estado:** En revisión
- **Prioridad:** Imprescindible
- **Actor(es):** Todos los usuarios (según su rol), Administrador

## Resultado esperado
Cualquier cambio en el sistema se puede rastrear: quién lo hizo, qué cambió y cuándo, y cada usuario consulta solo el historial de lo que su rol le permite ver.

## Criterios de aceptación

- CA-01: DADO una operación de crear, modificar, desactivar o eliminar en cualquier módulo, CUANDO se ejecuta, ENTONCES queda un registro del módulo con quién la hizo, qué cambió (valor anterior y nuevo), fecha y hora, tienda o contexto desde el que se hizo y canal (interfaz, API o MCP).
- CA-02: DADO una operación fallida por falta de permisos, CUANDO se rechaza, ENTONCES no cambia ningún dato.
- CA-03: DADO un registro del historial, CUANDO alguien intenta modificarlo o eliminarlo, ENTONCES no es posible.
- CA-04: DADO un usuario con permiso de ver un módulo, CUANDO abre su historial, ENTONCES ve los registros de ese módulo dentro de las compañías y tiendas a las que tiene acceso.
- CA-05: DADO un usuario sin permiso de ver un módulo, CUANDO intenta abrir su historial, ENTONCES no lo ve.
- CA-06: DADO un inicio de sesión (correcto o fallido), un bloqueo, un desbloqueo o un cambio de PIN, CUANDO ocurre, ENTONCES queda registrado.
- CA-07: DADO el historial de accesos, bloqueos y cambios de PIN, CUANDO lo consulta un usuario que no es administrador, ENTONCES no ve nada.
- CA-08: DADO un cambio del tope de sesión de una compañía, CUANDO ocurre, ENTONCES queda registrado con valor anterior y nuevo.
- CA-10: DADO un administrador, CUANDO consulta el historial, ENTONCES ve todo el historial de las compañías a las que tiene acceso; y CUANDO lo consulta el superadmin, ENTONCES ve el de todas.
- CA-09: DADO un historial, CUANDO se consulta, ENTONCES se puede filtrar por módulo, usuario y rango de fechas.

## Restricciones
P-01, P-02, P-03, T-04. Reglas DR-014 y DR-017. El historial nunca registra PIN ni contraseñas, ni en claro ni en valor anterior o nuevo.

## Fuera de alcance
- Exportar el historial.
- Alertas sobre eventos del historial.

## Exposición
- **API REST:** consulta de solo lectura, por definir en el diseño.
- **MCP (ADR-012):** `lectura`, según el permiso del rol. El historial de accesos y PIN nunca se expone.

## Dependencias y preguntas abiertas
Todos los REQ del módulo.

## Notas para el manual
Se completa al implementar (D-04).
