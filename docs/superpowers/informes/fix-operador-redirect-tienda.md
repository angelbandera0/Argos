# Fix: operadores redirigidos a /tienda

Causa raíz: `proxy.ts` -> `decideRedirect` tenía una lista blanca de rutas de operador (`/`, `/tienda`, `/catalogo/productos`, `/historial`); cualquier otra (`/solicitudes`, `/existencias`, `/pedidos`, `/divisas`, `/notificaciones`, `/perfil`) respondía 302 a `/tienda` antes de ejecutar ningún guard. No era claims, sesión ni BD: la prueba `tests/integration/operator-guard.int.test.ts` (PIN real -> claims.sessionId -> requireOperatorStore -> can("request_replenishment")) pasa sin cambios.

Corrección: ampliar `OPERATOR_PATHS` (infrastructure/proxy/decide-redirect.ts) con `/catalogo`, `/existencias`, `/solicitudes`, `/pedidos`, `/divisas`, `/notificaciones`, `/perfil`; `/usuarios`, `/roles`, `/companias`, `/superadmin` siguen bloqueadas. Todos los guards de operador pasaban por el mismo proxy. Test unitario actualizado.
