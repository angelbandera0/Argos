# REQ-007 — Roles y permisos

- **Módulo:** Roles
- **Estado:** En revisión
- **Prioridad:** Imprescindible
- **Actor(es):** Administrador

## Resultado esperado
Un administrador define qué puede hacer cada tipo de usuario en cada módulo, sin tocar código, y el sistema garantiza que nadie excede lo definido.

## Criterios de aceptación

- CA-01: DADO un administrador, CUANDO crea un rol, ENTONCES define para cada módulo disponible cuáles de las operaciones ver, crear, editar y eliminar permite, y cuáles permisos especiales tiene (p. ej. ver costos, trasladar, dar bajas, revisar pedidos). Los módulos nuevos del Módulo 2 (Divisas, Existencias, Solicitudes de reposición, Pedidos de compra, Notificaciones —solo ver las propias—) y sus permisos especiales se listan en `superpowers/specs/2026-11-06-modulo-2-almacen-pedidos/05-roles-historial.md`.
- CA-02: DADO un rol nuevo, CUANDO se crea, ENTONCES vale por defecto para todas las compañías del administrador y puede desmarcar alguna.
- CA-03: DADO un rol excluido de una compañía, CUANDO se intenta asignar a un usuario en una tienda de esa compañía, ENTONCES se rechaza.
- CA-04: DADO el permiso eliminar de un rol, CUANDO un usuario con ese rol elimina un registro, ENTONCES se aplica borrado lógico.
- CA-05: DADO un rol, CUANDO un administrador intenta darle permisos sobre compañías, sedes, tiendas, usuarios, roles o categorías, ENTONCES no es posible: esa gestión es exclusiva de los administradores.
- CA-06: DADO un rol, CUANDO un administrador define su tiempo de sesión, ENTONCES no puede superar el tope de sesión de la compañía (ver REQ-006).
- CA-07: DADO un rol con permiso de ver sobre un módulo, CUANDO el usuario consulta el historial, ENTONCES ve el historial de ese módulo (ver REQ-009).
- CA-08: DADO un administrador, CUANDO modifica o desactiva un rol, ENTONCES los usuarios con ese rol ven el cambio en su siguiente petición y la operación queda en el historial.
- CA-10: DADO un rol creado por un administrador, CUANDO otro administrador de la misma compañía consulta los roles, ENTONCES no lo ve, no puede asignarlo ni editarlo. Solo su dueño puede.
- CA-11: DADO un usuario cuyo rol creó otro administrador de la misma compañía, CUANDO un administrador que no es el dueño del rol consulta al usuario, ENTONCES ve la etiqueta "rol de otro administrador" sin los permisos del rol; puede desbloquearlo, cambiarle el PIN y desactivarlo, pero no cambiarle el rol ni las tiendas con ese rol.
- CA-09: DADO un administrador sin acceso a una compañía, CUANDO intenta usar los roles o asignaciones de esa compañía, ENTONCES no puede.

## Restricciones
P-01, P-02, P-03, T-03, T-04. Reglas DR-007, DR-008, DR-014.

## Fuera de alcance
- Permisos sobre módulos que aún no existen (ventas, turnos).
- Permisos a nivel de registro individual.

## Exposición
- **API REST:** por definir en el diseño.
- **MCP:** no se expone (ADR-012). Justificación: gestión de permisos.

## Dependencias y preguntas abiertas
REQ-005, REQ-006, REQ-008, REQ-009.

## Notas para el manual
1. En **Roles > Nuevo** el administrador pone nombre, marca para cada módulo disponible ver, crear, editar y eliminar (crear, editar y eliminar exigen "ver"), y fija el tiempo de sesión (no puede superar el tope de la compañía).
2. Por defecto el rol vale para todas sus compañías; desmarque las que quiera excluir. Un rol excluido no se puede asignar en tiendas de esa compañía.
3. Cada rol pertenece al administrador que lo creó: los demás no lo ven ni lo editan. En la ficha de un usuario con rol ajeno aparece "rol de otro administrador"; se puede desbloquear, cambiar el PIN o desactivar, pero no cambiar su rol ni sus tiendas.
4. Los permisos sobre compañías, sedes, tiendas, usuarios, roles y categorías no existen para roles: son exclusivos de los administradores.
5. Los cambios de un rol se aplican en la siguiente petición de sus usuarios. Un rol con usuarios asignados no se puede eliminar.
