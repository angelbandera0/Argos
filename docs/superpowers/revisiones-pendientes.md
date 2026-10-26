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

## Task 26 (pantallas de roles)
- Eliminar rol con usuarios asignados: el error HAS_DATA depende de hasAssignments (sin probar hasta la Tarea 27).

## Task 28 (security, deferred)
- Ban `876000h` after lock works (tested via flow); unlock lifts it inside `AuthGateway.resetPin` (`ban_duration: none`), so any PIN reset un-bans; login still requires `status = active`.
- `PinVerifier` and `enterWithPinFlow` read `profiles` with service_role before Auth; unknown/locked/deactivated users never reach Auth and do not increment attempts. Timing differs slightly between those paths and a wrong PIN.
- `register_pin_failure` is not atomic with the Auth sign-in: concurrent attempts can slip a few extra tries before the lock lands.
- `app_sessions.started_at` is the DB clock (insert grant only allows session_id,user_id); the use-case Clock may skew from it.
- A failed `loginWithPin` leaves the cookie client holding a revoked Auth session until signOut/expiry.
- `createOperatorUser` compensation (auth user + profile + user_stores) is sequential with delete-on-failure, not a single transaction; a crash between steps can leave an orphan auth user.
- createOperator trusts the use case for owns_role (service_role inserts bypass RLS); assign_user_stores/delete enforce it in DB.
- `my_store_access` ignores `userId` and is guarded in the adapter via `getClaims().sub` (the SQL uses auth.uid()).
- Integration runs leave `audit_log` rows (append-only); 007 was made hermetic.
- Actions `chooseStore/switchStore` redirect on any error to /tienda?error=...; Task 29 must handle it. `enterWithPin` has no rate limit beyond the 5-attempt lock and Auth's own limits.
- Task 29A: la hora de fin de sesion usa la zona horaria del servidor (sin zona de compania); el estado "sesion terminada" no llega por el proxy (sessionEnded=false); /catalogo/productos del menu aun no existe.
- Task 29B: con alguna asignacion de rol ajeno el admin no puede cambiar NINGUNA asignacion (assignStores exige ser dueno de todos los roles actuales); pendiente decidir la politica. Actividad usa la zona horaria del servidor; listAuthEvents sin prueba de integracion.
Task 30B: minor (deferred): live-category check in createProduct/updateProduct is not atomic with the write (race with category delete); a DB trigger on products.category_id would close it; name-exists checks fetch all live names of a company (fine at current scale)

## Task 31 (menores)
- Cambiar el activo de un producto es una segunda escritura tras updateProduct (no atomico); el operador necesita Editar para ambas.
- Pantallas de producto leen la lista completa para encontrar un producto por id (sin getProduct en los casos de uso).

## Shell sign-out (menores)
- Un token de acceso de administrador ya emitido sigue valido hasta expirar tras signOut local (la sesion de Auth se revoca, el JWT no); solo getUser lo rechaza.
- La fila .mobile-user en movil no esta en la maqueta; confirmar en /verificar-ui.

## Shell visual adjustments (menores)
- El menú de perfil solo contiene "Cerrar sesión"; añadir opciones (cambiar contraseña, etc.) cuando existan pantallas.
- La maqueta no dibuja la barra superior ni el menú de perfil (divergencia anotada en MODULO-1-PANTALLAS.md §2).
- `.code-input` conserva 16 px suelto (evita zoom en iOS); `.spinner` y `.skeleton-*` tienen px sueltos no tipográficos.
- Verificar en navegador: hover/focus de botones, escala tipográfica y el menú de perfil en las tres vistas.

## Navbar and density (menores)
- La escala tipográfica vuelve a la de la guía del usuario (más grande que la imagen de referencia); si se quiere más compacta, decidirlo y editar tokens.
- Verificar en navegador: barra superior en 3 vistas (desbordamiento del reloj en móvil), menú de perfil, teclado, y que un operador vea su compañía en `/perfil` (depende de RLS sobre `companies`).
- La campana no muestra punto rojo (no hay notificaciones); buscador y campana deshabilitados hasta tener backend.
- Mockups (`shell.js`) siguen sin dibujar la barra superior.

## Dashboard (menores)
- Dashboard con datos de ejemplo: sustituir por datos reales (`app/(app)/_demo/dashboard-data.ts`).
- "Hoy" del gráfico usa la zona horaria del servidor; pasar al navegador cuando haya datos reales.
- `docs/REQUIREMENTS.md` y `docs/README.md` son de solo lectura: la nota provisional no se añadió ahí.
- Pestañas del gráfico sin navegación por flechas; verificar en navegador la escala reducida y el dashboard en 3 vistas.

## Argos UI fase 0 (menores)
- `/ui` usa `notFound()` en producción, pero el build la prerrenderiza como estática: verificar que en `pnpm start` responde 404.
- La galería lee `docs/design/tokens.css` con `fs` (solo desarrollo); si se mueve el archivo, actualizar `app/ui/tokens.ts`.
- `.next/dev/types` quedó obsoleto al añadir rutas: `next typegen` lo regenera antes de `pnpm typecheck`.
- Guía ampliada: alturas de 48 px aplicadas con `--size-field` (= `--size-control`); revisar en navegador cuando haya campos nuevos.

## Argos UI fase 1 (menores)
- Multiselect: sin pie «Aplicar (n)» (la selección es inmediata) ni buscador dentro del panel (va en línea con las etiquetas).
- Borde «con valor» (`--color-line-strong`) no implementado en Input/Select; solo normal, foco, error, desactivado, solo lectura.
- Popups de Select/Multiselect usan `--z-menu` (30): dentro de `Dialog` nativo (top layer) habrá que montarlos con `container` del dialog.
- Altura de foco/hover en galería: hover real solo con cursor; foco simulado por estilo en línea.
- Tokens nuevos en tokens.css (`--color-yellow-hover`, `--color-danger-tint-hover`, `--border-field*`, `--border-hairline`) sin documentar aún en DESIGN.md.
- `.btn[disabled]` ahora usa fondo/texto desactivados de la guía en vez de opacidad.
- Fase 2 UI: Escape cerrando primero el popup de Select y luego el Dialog, foco de retorno y Toast con pausa en hover/foco dependen de Base UI y no se probaron en navegador; verificar en `/ui`.
- Fase 2 UI: los consumidores de dominio (`deactivate-dialog`, `delete-*`, `pin-reveal`) siguen montando `{open && <Dialog open>}`, así que no hay animación de salida; sin migrar a `open` controlado.
- Fase 2 UI: tokens nuevos de fase 2 (`--z-popup`, `--size-dialog-*`, `--size-close*`, `--duration-overlay`, etc.) sin documentar aún en DESIGN.md; el overlay del Dialog pasó de `--color-scrim` a `--color-overlay`.
- Fase 2 UI: Toast sin apilado en abanico de Base UI (lista simple); el tooltip es blanco con borde (sin fondo oscuro por la regla de la guía).

## Argos UI fase 3 (menores)
- DataTable no tiene modo tarjetas en móvil (< 768 px); hoy hace scroll horizontal. Tampoco hay barra de filtros con chips ni selector de columnas.
- SidebarSection plegable no recuerda el estado por usuario; en el riel y la barra móvil se ignora el plegado y el submenú no se muestra (el padre no navega).
- Verificación visual de los componentes nuevos pendiente en /ui (la hace el usuario).

## Colisiones con Tailwind
- Clase propia `overline` renombrada a `eyebrow` (chocaba con la utilidad `overline`). Revisadas las clases propias de los CSS: ninguna otra coincide con utilidades de Tailwind con efecto visible.
- 4a: verificar visualmente ProfileMenu (Base UI Menu), StoreSwitcher (Select) y Steps en /primer-ingreso; aun existe .select (otros bloques).
- 4b: verificar visualmente Accordion con UnitMenu en la cabecera (action fuera del trigger), Select dentro de Dialog y toasts; el alta de compañía no muestra toast (redirect). .menu-hint añadido a ui-navdata.css.
- 4c: verificar visualmente filtro de estado con opción «Todos» (valor vacío), Multiselect de tiendas en nuevo usuario, Tabs del usuario, AlertDialog de acciones y PIN modal; mergeExclusions no existe en el código (nada que conservar).
- 4d: verificar visualmente categorías (edición en fila, AlertDialog), filtros Select de productos (valor vacío «Todas»), producto en solo lectura (Select/Switch deshabilitados), tabla de administradores, modal de contraseña temporal (sin cierre), Tabs del gráfico y Accordion del inicio. Guardar/eliminar producto y crear administrador no muestran toast (redirect/modal). Añadido aviso si falta «Ver» en la lista de productos.
- 4e: limpieza global. Eliminadas `.topbar`, `.modal-body.flush`, `.select` y `.card .select`. Clases con sufijo dinámico (`btn-*`, `chip-*`, `badge-*`, `tone-*`, `dialog-*`, `acc-*`, `dt-*`, `steps-*`, `tabs-*`, `nav-badge-*`, `pill-*`) se conservan (construidas por plantilla). `components/ui/route-progress.tsx` no tiene importadores (componente de librería; no está en la galería ni montado): decidir si se monta en el layout o se elimina.
- 4e: colisiones con Tailwind v4 revisadas: las clases propias `card`, `content`, `list`, `row`, `stack` y `tab` no coinciden con utilidades actuales (`tab-*` existe solo con sufijo numérico); `.sr-only` coincide a propósito con la utilidad. Vigilar `tab` y `content` si se actualiza Tailwind.
- 4e: `pnpm test:db` falla en `002_rls_core` test 43 (`stores_update`: aparece una tienda «Restaurante» no esperada); el resto de archivos pasa. Sin relación con la UI; posiblemente datos residuales en la base local. Investigar.

- Selector de compañía en el panel: no verificado en navegador (riel, móvil, popover en riel abre bajo el avatar); `/verificar-ui`. Tonos de avatar: 4 (colisiones posibles entre compañías).
- Diálogos de formulario: `createCompanyAction` redirige tras éxito, así que el diálogo de nueva compañía no muestra toast ni cierra explícitamente (la navegación lo desmonta). Sin verificar a mano: pedir `/verificar-ui` de /companias, /companias/[id] y /catalogo/categorias.
- El commit 18ee5cf incluyó por error cambios ajenos en curso (`app/(app)/layout.tsx`, `components/org/company-selector.tsx`, `components/org/company-avatar.ts`); `tests/unit/org/` sigue sin añadir.

## Task 32 (menores)
- auth_events no tiene company_id: el filtro por compañía pasa por profiles (solo operadores); los eventos de administradores solo los ve el superadmin. Valorar columna company_id en Task 33/36.
- Cada integración itest deja filas en audit_log (inmutable) con company_id de compañías borradas.

## Task 33 (menores)
- Historial: filtro de módulo por enlaces, no Select; «Anterior» sustituido por «Primera página» (cursor opaco solo avanza). Fechas desde/hasta se interpretan en UTC (zona del servidor). Nombres de actor solo vía listForCompany (operadores sin acceso ven «Usuario»); administradores fuera de la compañía también. Historial de roles/usuarios/organización listado para admins, sin pantalla de detalle específica.

## Fix ProfileMenu / server actions (menores)
- El proxy deja pasar toda petición con `next-action`: las server actions deben validar sesión por sí mismas (revisar que todas lo hagan en la revisión de seguridad).
- El error «unexpected response» en login puede además deberse a IDs de acción obsoletos tras Fast Refresh en dev.
