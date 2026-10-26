# Revisiones de seguridad diferidas

Decisión (2026-10-25): se omiten las revisiones de seguridad por tarea para avanzar con la implementación. Este archivo lista lo que hay que revisar más adelante. Las revisiones de las Tareas 7 y 8 ya están hechas; sus Menores están abajo (detalle en `.superpowers/sdd/*/review-task-7.md` y `review-task-8.md`).

## Cuándo revisar

Una sola pasada por bloque, con Sonnet y una lista de ataque. Opus solo si el bloque es 13, 16 o 28.

| Bloque | Tareas | Qué atacar |
|---|---|---|
| Base de datos | 9-12 | RLS de roles, user_stores y sesiones (JWT válido con sesión de app terminada); lectura de operadores en sus tiendas; que historial sea inmutable y no registre PIN ni contraseñas; unicidad de nombres con borrado lógico |
| Auth | 13, 16, 17 | Bloqueo a 5 intentos y desbloqueo (ban de Auth), funciones service_role-only, carrera de dos arranques creando superadmin, PIN fuera de logs/errores/auth_events, `.invalid` y `ban_duration` máximo |
| Adaptadores | 23, 25B, 28, 30B, 32 | Creación atómica de operador (auth + perfil + asignaciones), CA-11 de `assignStores` también en BD, `setActiveStore where ended_at is null`, `requireOperatorStore` en casos de uso de catálogo e historial, colisiones de nombre/username |
| API y cierre | 34-36 | Que cada endpoint pase por `withActor`, existencia de recursos entre compañías, `service_role` solo en `admin-client.ts` |

## Menores diferidos de la Tarea 7

- `profiles_update` deja al superadmin modificar operadores, pero `profiles_insert` no: unificar con §6.
- `profiles_update`/`insert` sin límite de columnas: `id` mutable, `failed_pin_attempts` y `status` tocables sin pasar por el flujo de desbloqueo. Hacer `id` inmutable y revisar grants por columna.
- El superadmin puede renombrar companies/sites/stores (CA-10).
- Documentar que la lectura de la propia fila a aal1 es excepción a "RLS exige aal2" (§6).
- `is_company_admin`/`operator_company` no filtran compañías inactivas o eliminadas (válido mientras `is_operational` cubra la operación).

## Menores diferidos de la Tarea 8

- `app.is_operational` es oráculo de existencia/estado entre compañías (requiere el uuid): restringir o llamar solo desde `app.can`.
- TRUNCATE y `update company_admins set admin_id` con postgres/service_role esquivan los triggers de fundador y HAS_DATA.
- Faltan pruebas de aal1 para fundador y superadmin en los guards.
- Pruebas de HAS_DATA/actor no fijan mensaje ni el caso service_role.
- Nada exige la fila de `company_admins` del fundador en INSERT directo.
- TOCTOU entre `has_data` y el borrado lógico (aceptable hoy).
- `has_data('store')` ya cuenta `user_stores` (Tarea 10); Tarea 11 añade categorías y productos a `company`.

## Menores acumulados en el ledger

Ver `.superpowers/sdd/2026-10-25-modulo-1-implementacion/progress.md` (líneas "minor (deferred)") de las Tareas 3, 4, 5, 14, 15, 19, 22, 25, 27 y 30.

## Revisión final

Antes de la Tarea 36: pasar `/code-review` sobre `main..feat/modulo-1` y comprobar los cinco puntos de "Review Focus" del plan.

## Menores diferidos de la Tarea 10

- `companies_select` (rama operador) no exige `app.session_active()`; solo `stores` lo hace.
- `app_sessions` update permite al operador poner `active_store_id` a cualquier tienda asignada sin comprobar expiración; lo cubre el caso de uso (DR-013).
- `user_stores` no impide asignar un rol eliminado (`deleted_at`); `app.can` sí lo ignora.
- El superadmin no puede asignar tiendas (`owns_role` exige administrador).
- La prueba "tiendas visibles" cuenta también tiendas inactivas asignadas (por diseño: el selector las muestra deshabilitadas).

## Menores diferidos de la Tarea 11

- RLS no permite al operador pasar `deleted_at` a no nulo (la política SELECT se aplica a la fila nueva): el borrado lógico de productos por operadores va por `public.delete_product(id)` (security definer, exige `app.can(..., 'delete')`); los administradores actualizan directamente.
- Un operador con `edit` puede cambiar `category_id` a una categoría eliminada (la FK no mira `deleted_at`); y una carrera entre insertar un producto y eliminar su categoría puede dejar un producto vivo en categoría eliminada.
- `delete_product` no devuelve error si el producto ya estaba eliminado más allá del 42501 genérico.
- El superadmin no puede insertar categorías ni productos (`kind = 'admin'`, igual que sites/stores).

- Task 12: audit_row omite \`failed_pin_attempts\` y \`must_change_password\` de before/after (Review Focus 2); sus cambios solos no generan fila. Canal: \`client_id\` presente se mapea a \`api\` hasta que la Tarea 27/28 defina el mapa. audit_log solo cubre insert/update (no delete físico).

## Menores diferidos de la Tarea 16

- Migración extra `revoke_user_sessions(uuid)` (security definer, solo `service_role`): el Admin API no permite cerrar sesiones por id de usuario (`signOut` exige el JWT), así que `revokeSessions` borra `auth.sessions`.
- `PinVerifier.verify` deja viva la sesión de Supabase que crea; el llamador (Tarea 28) debe usarla o cerrarla. El `session_id` se lee del JWT sin verificar firma (acaba de emitirlo Auth).
- Compensación de `createOperatorUser`/`createAdminUser` no es transaccional: si falla el borrado del usuario de Auth tras un fallo de perfil, queda un usuario huérfano.
- `ensureSuperadmin` decide por la existencia de un perfil `superadmin`; no repara un usuario de Auth sin perfil.
- `getEnv` trata las cadenas vacías de variables opcionales como ausentes (`.env.local` las trae vacías). Vitest carga `.env.local` con `process.loadEnvFile` y se añadió un alias vacío de `server-only` (tests/stubs).
- La prueba limpia `audit_log`/`auth_events` de sus entidades; `audit_log` de pruebas previas no se purga.

## Menores diferidos de la Tarea 17

- Sin `pg_advisory_xact_lock`: la carrera la resuelven el índice único parcial y el correo único de Auth; el perdedor reintenta hasta 3 s esperando el perfil del ganador. Si el ganador falla tras crear el usuario de Auth, el perdedor lanza el error original.
- `instrumentation.ts` no captura errores: un fallo de `ensureSuperadmin` impide arrancar el servidor (deliberado, falla visible).

## Menores diferidos de la Tarea 18

- `app/(app)/layout.tsx` es un paso directo: `AppShell` necesita el actor/menú reales (sesión), que llegan con las páginas de las Tareas 20-21; `active` lo pasa cada página al montar el shell.
- `tokens.css` ganó tokens `--size-*` y `--color-scrim`; quedan px sueltos heredados de la maqueta (fuente de marca 20px, avatar 13px, ancho de `.auth-card` 440px).
- `Dialog` usa un id fijo `dialog-title`: no apilar dos diálogos a la vez.
- `instrumentation.ts` aborta `pnpm dev` si `.env.local` trae una contraseña inicial de superadmin de menos de 12 caracteres.

## Menores diferidos de la Tarea 20

- `requestPasswordReset` solo envía el correo (sin `redirectTo`): falta la página de destino que intercambie el código y fije la nueva contraseña (con TOTP exige aal2). Pendiente de diseño.
- Cambiar la contraseña con `service_role` revoca los refresh tokens; `completeFirstLogin` vuelve a iniciar sesión con la contraseña nueva para obtener claims frescos (`must_change_password = false`).
- `/login/2fa` y `/primer-ingreso` usan `export const instant = false` (lectura de sesión no prerenderizable; `getClaims` usa `Date.now` y la validación de navegación instantánea avisa en dev).
- `makeChangeOwnPassword`: `users` pasó a ser opcional (no se usa; aún no existe el repositorio de usuarios).
- Tras verificar TOTP se redirige a `/companias`, que aún no existe (404 hasta la fase de organización). Sin límite de intentos propio en TOTP (solo el de Supabase).
- px sueltos heredados del diseño: bordes 1.5px/2px de las casillas, `font-size: 16px` del input (anti-zoom iOS).

## Menores diferidos de la Tarea 21

- `/companias` sigue sin existir (404) hasta la fase de organizacion; el menu ya enlaza a ella.
- La lista de administradores no muestra el correo (`Profile` no lo incluye; vive en `auth.users`).
- La contrasena temporal vive solo en el estado del cliente; si el usuario cierra la pestana sin copiarla, hay que crear otro administrador (no existe aun "restablecer contrasena de administrador").
- El error de correo duplicado se detecta buscando `email_exists` en el mensaje del gateway.
- `.secret-reveal` usa `var(--font-geist-mono, monospace)` heredado de `.secret`; el fallback no es un token.

## Menores diferidos de la Tarea 23

- Las pruebas de integración de organización dejan una compañía `itest-` y su administrador fundador (el esquema impide borrarlos por API); hace falta limpieza por SQL tras cada ejecución.
- `UnitStatusRepository.hasData` replica `app.has_data` con lecturas bajo RLS porque la función no es ejecutable por `authenticated`; si cambia la regla en la base, actualizar ambos sitios (el trigger sigue siendo la garantía).
- `setStatus` ignora el parámetro `by`: la base usa `auth.uid()`.
- Los repositorios no están en `container.ts` (necesitan cliente por petición).
- Seguridad: `public.delete_test_company` es security definer y desactiva el trigger `company_admins_guard_founder` durante su ejecución; por eso solo es ejecutable por service_role y solo actúa sobre compañías `itest-`. Revisar que nunca se exponga a otros roles.

## Task 24A
- Aviso de compañía desactivada sin autor/fecha; foco no vuelve al disparador tras cerrar con éxito el diálogo de desactivar/reactivar/crear.
- `setActiveCompanyAction` y `getActiveCompanyId` validan contra `listCompanies` (RLS); CompanySelector aún no montado.

## Task 24B
- "Dar acceso" solo ofrece administradores visibles por RLS (los que comparten otra compania con el actor); el superadmin ve todos.
- El tope de sesion acepta medias horas (0,5 a 24); no se revisa si roles existentes superan el nuevo tope.

## UI fix (icons/prerender)
- Lección: de Server a Client Components solo pasar datos serializables (nombre de icono, no componentes Lucide). Con cacheComponents, `createServerClient` espera `connection()` antes de crear el cliente (el constructor de Supabase Auth lee `Date.now()`), y el layout muestra un skeleton del shell en el Suspense.
- Pendiente: comprobar en el navegador (con sesión) que ya no salen ambos errores; por curl sin sesión `/companias` redirige a /login.

## Task 25B (role repository)
- create/update de roles no son atómicos (varias escrituras vía PostgREST); en create fallido se hace soft delete compensatorio. Valorar una RPC transaccional.
- hasAssignments=true no se prueba en integración (requiere operador con user_stores; Tarea 27).
