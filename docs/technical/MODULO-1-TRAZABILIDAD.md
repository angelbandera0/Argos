# Módulo 1 — Trazabilidad de criterios de aceptación

Cada CA de REQ-005 a REQ-009 con la prueba que lo cubre. Rutas relativas a la raíz. Unit = `tests/unit/use-cases/` (Vitest, con fakes); Int = `tests/integration/` (proyecto cloud); SQL = `supabase/tests/` (pgTAP). "manual: <pantalla>" = solo se verifica en el navegador (diferido, ver `docs/superpowers/revisiones-pendientes.md`, "Verificación final diferida").

## REQ-005 Organización

| CA | Prueba |
|---|---|
| 01 | unit `organization.test.ts` "createCompany … founder, 4-char code"; int `organization.int.test.ts` "an admin creates a company and sees its code"; SQL `002_rls_core` (P-01 companies) |
| 02 | unit `organization.test.ts` "createSite / createStore … site and a store inside it"; SQL `002_rls_core` "can create a site/store" |
| 03 | unit `organization.test.ts` "grantCompanyAccess"; SQL `002_rls_core` "CA-03 … grant access" |
| 04 | unit `organization.test.ts` "revokeCompanyAccess … non-founder gets Forbidden"; SQL `002_rls_core` "a non-founder administrator cannot revoke access" |
| 05 | unit `organization.test.ts` "FOUNDER_PROTECTED"; SQL `003_core_guards` "REQ-005 CA-05 founder cannot be removed"; int `organization.int.test.ts` "the founder cannot be revoked" |
| 06 | unit `organization.test.ts` "delete with data throws HAS_DATA"; SQL `003_core_guards` "REQ-005 CA-06 …cannot be deleted" |
| 07 | unit `organization.test.ts` "non-founder admin, stranger and operator get Forbidden"; SQL `003_core_guards` "I1: a non-founder administrator cannot …" |
| 08 | unit `organization.test.ts` "REASON_REQUIRED"; SQL `003_core_guards` "REQ-005 CA-08 …"; int `organization.int.test.ts` "reason otro and no text fails in the database" |
| 09 | unit `operators.test.ts` "active store deactivated mid-session -> STORE_UNAVAILABLE" y "makeLoginWithPin … available flag"; SQL `005_user_stores_sessions` "cannot when the store is not operational"; int `operators.int.test.ts` "full flow" |
| 10 | unit `organization.test.ts` "updateCompanySettings"; int `organization.int.test.ts` "saving the session cap … history row" |
| 11 | unit `organization.test.ts` "listCompanies … only sees his companies" y "admin without access get Forbidden"; SQL `002_rls_core` "P-01 …" |
| 12 | unit `organization.test.ts` "REQ-005 CA-12 reactivation …"; SQL `003_core_guards` "the founder reactivates a store", "I1: the superadmin can reactivate a site"; SQL `007_audit` "active true logs reactivate" |
| 13 | SQL `003_core_guards` "REQ-005 CA-13: operational only when store, site and company are all active (8 combinations)" (los hijos conservan su propio estado) |
| 14 | unit `organization.test.ts` "REQ-005 CA-14 delete without data is a soft delete"; SQL `003_core_guards` "a freshly created company can be deleted" |
| 15 | unit `organization.test.ts` "REQ-005 CA-15 …" (renombrado, vacío, hermanas); SQL `007_audit` (update con antes/después); int `organization.int.test.ts` "history gets create…" |

UI de apoyo: manual: `/companias`, `/companias/[id]`.

## REQ-006 Usuarios, acceso y sesiones

| CA | Prueba |
|---|---|
| 01 | manual: `/login`, `/recuperar` (usuario+contraseña y recuperación por correo) |
| 01b | SQL `002_rls_core` "ADR-007: … aal1 sees no …"; SQL `008_auth_hooks` (claims del hook); manual: `/login/2fa` (TOTP). Activación de MFA en el panel: pendiente del usuario |
| 01c | unit `change-own-password.test.ts` "CA-01c: 12 characters"; unit `ensure-superadmin.test.ts` "rejects an 11-character password"; unit `domain/password.test.ts` |
| 02b | unit `ensure-superadmin.test.ts` "creates once, then reports created: false"; int `ensure-superadmin.int.test.ts` "five concurrent calls leave exactly one superadmin" |
| 02 | SQL `001_core_schema` "REQ-005 CA-01: a second superadmin profile is rejected" (índice `profiles_single_superadmin`); unit `create-admin.test.ts` "creating an admin never produces a superadmin" |
| 03 | unit `create-admin.test.ts` "CA-03 temporary password"; int `superadmin-admins.int.test.ts` |
| 04 | unit `change-own-password.test.ts` "CA-04"; int `superadmin-admins.int.test.ts` "token carries must_change_password"; SQL `008_auth_hooks` "always must_change_password for admins"; manual: `/primer-ingreso` |
| 05 | unit `create-admin.test.ts` "CA-05 admin / operator get Forbidden"; SQL `002_rls_core` "an administrator cannot create administrators" |
| 06 | SQL `003_core_guards` "REQ-006 CA-06: a founder administrator cannot be soft-deleted" |
| 07 | unit `operators.test.ts` "makeCreateOperator … code.name username and a 6-digit PIN"; int `auth-gateway.int.test.ts` "writes the profile and the store assignments"; manual: `/usuarios/nuevo` (PIN mostrado una vez) |
| 08 | unit `session-login.test.ts` "REQ-006 CA-08"; int `operators.int.test.ts` "full flow: enter with the PIN, choose a store" |
| 09 | unit `operators-admin.test.ts` "REQ-006 CA-09" (asignar tiendas / cambiar rol por tienda); SQL `005_user_stores_sessions` "changing the active store changes the role used" |
| 10 | unit `session-login.test.ts` "REQ-006 CA-10: switch keeps startedAt"; int `operators.int.test.ts` "switch store without PIN" |
| 10b | unit `session-login.test.ts` "REQ-006 CA-10b: shorter limit already elapsed -> SessionExpired" |
| 11 | unit `operators-admin.test.ts` "makeResetPin … operator … get Forbidden"; SQL `010_operator_functions` "an operator cannot assign stores"; PIN generado por el sistema: int `auth-gateway.int.test.ts` "resetPin" |
| 12 | unit `operators-admin.test.ts` "makeUnlockUser: new PIN, status active"; SQL `008_auth_hooks` "profile is locked with counter 5", "unlock leaves active with counter 0"; int `operators.int.test.ts` "unlock restores access" |
| 12b | unit `session-login.test.ts` "REQ-006 CA-12b … fail identically"; int `operators.int.test.ts` "same answer", "Review Focus 2: no PIN in audit_log…"; SQL `008_auth_hooks` "no PIN stored in auth_events"; int `auth-gateway.int.test.ts` "never leaks the pin" |
| 12c | Diferido: MCP y flujo OAuth (ADR-011/012) están en un plan aparte (ver plan, Autorrevisión). La API REST de la Tarea 35 rechaza operadores en rutas de administración: unit `api/endpoints.test.ts` |
| 12d | Diferido: flujo OAuth 2.1 + PKCE de la app oficial (ADR-011), plan aparte |
| 12e | int `operators.int.test.ts` "setting app_sessions.ended_at hides data even though the token is still valid"; unit `operators-admin.test.ts` (revocación de sesiones al reiniciar/desactivar); int `auth-gateway.int.test.ts` "revokeSessions kills a previous refresh token" |
| 13 | unit `catalog-guards.test.ts`, `roles.test.ts`, `session-guards.test.ts` ("permission is checked before any entity lookup"); int `catalog.int.test.ts` "RLS blocks edit/delete … even when the use case is bypassed" |
| 14 | unit `session.test.ts` "role seconds above 86400 are clamped"; SQL `005_user_stores_sessions` "expiry with cap 86400 and null role is started_at + 1 day" |
| 15 | unit `session.test.ts` "company cap below role seconds wins"; SQL `005_user_stores_sessions` "expiry with a 3600 s role / 7200 s company cap" |
| 16 | int `organization.int.test.ts` "saving the session cap persists it and leaves a history row" |
| 17 | unit `session-login.test.ts` "the 1-day cap holds with a 172800 s company cap"; manual: `/login` (sesión de administrador ≤ 1 día) |

## REQ-007 Roles y permisos

| CA | Prueba |
|---|---|
| 01 | unit `roles.test.ts` "CA-01: admin creates a role with permissions"; int `roles.int.test.ts` "returns the created role with permissions" |
| 02 | unit `roles.test.ts` "CA-02/03: stores excludedCompanyIds"; int `roles.int.test.ts` "keeps an exclusion on a company the actor cannot see" |
| 03 | unit `operators.test.ts` "REQ-007: role excluded for the company -> ROLE_EXCLUDED"; SQL `005_user_stores_sessions` "ROLE_EXCLUDED …" |
| 04 | unit `catalog-products.test.ts` "CA-07 delete … soft delete"; SQL `006_catalog` "delete permission soft-deletes a product", "a direct soft delete by an operator is rejected" |
| 05 | unit `roles.test.ts` "CA-05: no permission exists for management modules (compile-time)" |
| 06 | unit `roles.test.ts` "CA-06: sessionSeconds 86401 is SESSION_TOO_LONG" |
| 07 | unit `history.test.ts` "CA-04/05 … only that module's rows"; SQL `007_audit` "CA-04: an operator with view sees the products rows" |
| 08 | SQL `010_operator_functions` "my_store_access returns the role permissions" (los permisos se leen en cada petición, sin copia en el token); SQL `007_audit` (roles auditados); unit `roles.test.ts` "makeUpdateRole / makeDeleteRole"; la desactivación de rol no existe como función aparte: el borrado (`HAS_DATA` si tiene asignaciones) es la baja |
| 09 | unit `roles.test.ts` "inaccessible company … Forbidden"; SQL `002_rls_core` (P-01) y `004_roles` "an operator sees no roles" |
| 10 | unit `roles.test.ts` "CA-10: another admin's or missing role is Forbidden", "returns only the actor's live roles"; SQL `004_roles` "REQ-007 CA-10: another admin of the same company sees 0 roles" |
| 11 | unit `operators-admin.test.ts` "REQ-007 CA-11 …" (reset PIN, desbloquear, desactivar sí; asignar tiendas/rol no); SQL `010_operator_functions` "REQ-007 CA-11 …"; int `operators.int.test.ts` "only the role owner can change assignments"; manual: `/usuarios/[id]` (etiqueta "rol de otro administrador") |

UI de apoyo: manual: `/roles`, `/roles/nuevo`, `/roles/[id]`.

## REQ-008 Catálogo

| CA | Prueba |
|---|---|
| 01 | unit `catalog-categories.test.ts` "CA-01"; int `catalog.int.test.ts` "an admin creates a category and lists it"; SQL `006_catalog` "an admin creates categories" |
| 02 | unit `catalog-categories.test.ts` "CA-02: an operator with every permission cannot create…"; SQL `006_catalog` "even with all product permissions an operator cannot create categories" |
| 03 | unit `catalog-products.test.ts` "CA-03" |
| 04 | unit `catalog-products.test.ts` "CA-04: categoryId is a single identifier" (además `category_id` es una columna escalar) |
| 05 | unit `catalog-products.test.ts` "CA-05"; SQL `006_catalog` "REQ-008 CA-05" |
| 06 | unit `catalog-products.test.ts` "CA-06"; SQL `007_audit` "REQ-009 CA-01: renaming a product logs one update" (antes/después) |
| 07 | unit `catalog-products.test.ts` "CA-07"; int `catalog.int.test.ts` "soft delete by an operator frees the name" |
| 08 | unit `catalog-products.test.ts` "CA-08"; SQL `006_catalog` "without view an operator sees 0 products"; int `catalog.int.test.ts` "without view the operator sees 0" |
| 09 | unit `catalog-products.test.ts` "CA-09"; SQL `006_catalog` "an admin of another company sees no products" |
| 10 | unit `catalog-products.test.ts` "CA-10: onlyActive excludes inactive products" |
| 11 | unit `catalog-products.test.ts` "CA-11", `catalog-categories.test.ts` "CA-11"; SQL `006_catalog` "Review Focus 4 …" |
| 12 | unit `catalog-categories.test.ts` "CA-12"; SQL `006_catalog` "REQ-008 CA-12"; int `catalog.int.test.ts` "CATEGORY_HAS_PRODUCTS" |

UI de apoyo: manual: `/catalogo/categorias`, `/catalogo/productos`, `/catalogo/productos/nuevo`.

## REQ-009 Historial

| CA | Prueba |
|---|---|
| 01 | SQL `007_audit` "every audited table logs inserts", "CA-01: store_id from the session", "channel defaults to ui", "CA-01: deleted_at logs delete"; int `history.int.test.ts` "create + edit by an operator leave two entries … before/after, actor, store and channel" |
| 02 | unit (todas las suites de casos de uso) "…Forbidden and nothing changes", p. ej. `catalog-products.test.ts` "CA-03: without create it is Forbidden and nothing changes"; `roles.test.ts` "no mutation"; SQL `006_catalog` "create without edit: the name is unchanged" |
| 03 | SQL `007_audit` "CA-03: postgres cannot update / delete from / truncate audit_log", "CA-03: an administrator cannot update/delete audit_log", "nobody inserts into audit_log directly" |
| 04 | unit `history.test.ts` "CA-04/05"; SQL `007_audit` "CA-04"; int `history.int.test.ts` |
| 05 | unit `history.test.ts` "CA-04/05: operator without view gets Forbidden"; SQL `007_audit` "CA-05: an operator without view sees nothing" |
| 06 | SQL `008_auth_hooks` "each failure leaves a login_failed event", "the lock leaves a locked event", "unlock leaves an unlocked event"; int `operators.int.test.ts` (login_ok); int `history.int.test.ts` "auth_events are for administrators only". Cambio de PIN (`pin_reset`): int `auth-gateway.int.test.ts` "resetPin" |
| 07 | unit `history.test.ts` "CA-07: auth events are admin-only"; SQL `007_audit` "an operator does not read auth_events" |
| 08 | int `organization.int.test.ts` "saving the session cap persists it and leaves a history row"; SQL `007_audit` (actualización de `companies` con antes/después) |
| 09 | unit `history.test.ts` "CA-09: module, user and date filters reach the reader", "filters by action, channel, several modules…"; manual: `/historial` (filtros) |
| 10 | unit `history.test.ts` "admins see their companies only; the superadmin sees all"; SQL `007_audit` "CA-10 …" |

Además, "el historial nunca registra PIN ni contraseñas": unit `history.test.ts` "Review Focus 2", SQL `007_audit` "Review Focus 2: no sensitive keys in before/after".

UI de apoyo: manual: `/historial`, `/historial/[modulo]`, `/historial/accesos`.

## Brechas

- Sin prueba automática (verificación en navegador, diferida): REQ-006 CA-01 (recuperación por correo), CA-01b (flujo TOTP completo) y CA-17 en pantalla.
- Fuera del plan del Módulo 1 (plan aparte de ADR-011/012): REQ-006 CA-12c y CA-12d.
- Pruebas automáticas ausentes y añadidas: ninguna; todo CA del plan tiene al menos una prueba o se marca manual/diferido.
