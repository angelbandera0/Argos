# REQ-006 — Usuarios, acceso y sesiones

- **Módulo:** Usuarios
- **Estado:** En revisión
- **Prioridad:** Imprescindible
- **Actor(es):** Superadmin, Administrador, Usuario operativo

## Resultado esperado
Cada persona entra al sistema con el método que corresponde a su nivel de riesgo, solo ve y opera en las tiendas que se le asignaron, y su sesión tiene una duración controlada.

## Criterios de aceptación

### Superadmin y administradores
- CA-01: DADO el superadmin, CUANDO entra, ENTONCES lo hace con usuario y contraseña, y puede recuperar su contraseña por correo electrónico.
- CA-01b: DADO el superadmin o un administrador, CUANDO inicia sesión, ENTONCES además de la contraseña debe verificar un segundo factor (TOTP) (ADR-007).
- CA-01c: DADO el superadmin o un administrador, CUANDO define o cambia su contraseña, ENTONCES debe tener al menos 12 caracteres.
- CA-02: DADO que existe un superadmin, CUANDO se intenta crear otro, ENTONCES se rechaza.
- CA-03: DADO el superadmin, CUANDO crea un administrador, ENTONCES el sistema genera una contraseña temporal que el superadmin le entrega.
- CA-04: DADO un administrador con contraseña temporal, CUANDO inicia sesión por primera vez, ENTONCES debe cambiarla antes de continuar.
- CA-05: DADO un usuario que no es el superadmin, CUANDO intenta crear un administrador, ENTONCES se rechaza.
- CA-06: DADO un administrador que es fundador de al menos una compañía, CUANDO se intenta eliminar su cuenta, ENTONCES se rechaza.

### Usuarios operativos
- CA-07: DADO un administrador, CUANDO crea un usuario operativo, ENTONCES asigna su compañía (una sola, entre las que el administrador gestiona), su username (único en todo el sistema), su rol y sus tiendas (solo de esa compañía), y el sistema genera un PIN de 6 dígitos que se muestra una sola vez.
- CA-08: DADO un usuario operativo, CUANDO entra, ENTONCES escribe su username y su PIN y elige una de las tiendas que tiene asignadas y activas.
- CA-09: DADO un usuario con varias tiendas, CUANDO tiene el mismo rol en todas, ENTONCES se le aplica ese rol; CUANDO un administrador le asigna un rol distinto en una tienda, ENTONCES en esa tienda se aplica el rol específico.
- CA-10: DADO un usuario dentro del sistema, CUANDO cambia de tienda, ENTONCES no se le pide el PIN y se aplican el rol y el tiempo de sesión de la nueva tienda.
- CA-10b: DADO un cambio de tienda, CUANDO el tiempo de sesión de la nueva tienda, contado desde el inicio de sesión, ya se cumplió, ENTONCES la sesión se cierra y debe entrar de nuevo con su PIN. El cambio de tienda no reinicia el reloj.
- CA-11: DADO un PIN, CUANDO alguien que no es administrador intenta cambiarlo, ENTONCES se rechaza. El nuevo PIN lo genera el sistema y se muestra una sola vez.
- CA-12: DADO un usuario operativo, CUANDO escribe un PIN incorrecto 5 veces seguidas, ENTONCES se bloquea; no se desbloquea solo, y solo un administrador puede desbloquearlo, momento en que el sistema genera un PIN nuevo.
- CA-12b: DADO un login con PIN, CUANDO falla, ENTONCES el error es siempre el mismo, sin indicar si el username existe, y el PIN nunca se guarda ni se registra en claro.
- CA-12c: DADO un usuario operativo, CUANDO intenta usar el MCP, ENTONCES se rechaza: el MCP es solo para el superadmin y los administradores. El usuario operativo solo usa la API desde la app oficial, con el flujo de ADR-011.
- CA-12d: DADO la app oficial, CUANDO un usuario inicia sesión en ella, ENTONCES la app nunca recibe ni procesa el PIN ni la contraseña: el login ocurre en una ventana segura del navegador del sistema (OAuth 2.1 con PKCE, ADR-011).
- CA-12e: DADO un usuario desactivado, bloqueado o con PIN cambiado, CUANDO su app intenta usar la API, ENTONCES sus tokens dejan de ser válidos de inmediato.
- CA-13: DADO un usuario operativo, CUANDO intenta acceder a una función que su rol no permite, ENTONCES el caso de uso la rechaza aunque la interfaz no la muestre.

### Sesiones
- CA-14: DADO cualquier usuario, CUANDO inicia sesión, ENTONCES la sesión no dura más de un día.
- CA-15: DADO un rol, CUANDO tiene un tiempo de sesión configurado, ENTONCES la sesión de sus usuarios dura como máximo ese tiempo, y nunca más que el tope de la compañía de la tienda donde trabajan.
- CA-16: DADO el tope de sesión de una compañía, CUANDO un administrador lo modifica en los ajustes de la compañía, ENTONCES el cambio queda en el historial (ver REQ-005, CA-10).
- CA-17: DADO el superadmin o un administrador, CUANDO inicia sesión, ENTONCES su sesión dura como máximo un día.

## Restricciones
P-01, P-02, T-04, T-05, T-06. Reglas DR-002, DR-006, DR-007, DR-009 a DR-013. El PIN y las contraseñas nunca se almacenan ni se registran en claro.

## Fuera de alcance
- Apertura y cierre de turnos (módulo posterior).
- Cierre de sesión por inactividad (no se pidió).
- Autenticación de integraciones externas (REQ-003).

## Exposición
- **API REST:** por definir en el diseño.
- **MCP:** no se expone (ADR-012). Justificación: gestión de credenciales y accesos.

## Dependencias y preguntas abiertas
REQ-005, REQ-007, REQ-009. Q-014 (se verifica al diseñar).

## Notas para el manual
Se completa al implementar (D-04).
