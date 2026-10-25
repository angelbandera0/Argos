# Diseño técnico — Módulo 1

> Cómo se construye lo que especifican REQ-005 a REQ-009. Respeta `CONSTITUTION.md` (T-01 a T-07) y los ADR-002 a ADR-012.
> Estado: **En revisión**. Lo marcado **[mi decisión]** lo propone este documento y no estaba acordado; lo marcado **[validar]** depende de una verificación técnica.

## 1. Alcance

Organización (compañías, sedes, tiendas), usuarios y acceso, roles y permisos, catálogo (categorías y productos) e historial. Quedan fuera los módulos posteriores (almacén, ventas, turnos).

## 2. Arquitectura por capas (T-02, T-03)

```
core/
  domain/            entidades, objetos de valor y reglas puras (TypeScript sin dependencias)
  application/
    use-cases/       un archivo por caso de uso
    ports/           interfaces: repositorios, AuthGateway, Clock, etc.
infrastructure/
  supabase/          repositorios, fábrica del cliente con el JWT del usuario, adaptador admin
  auth/              derivación de credencial del PIN, generador de PIN
app/                 UI (páginas y server actions) y app/api/v1/ (REST); el MCP vendrá después
supabase/
  migrations/  tests/  seed.sql
```

- El alias `@/*` apunta a la raíz, así que se importa como `@/core/...`.
- `core/` no importa Next.js ni Supabase (T-02). Las dependencias apuntan hacia dentro.
- Los adaptadores (server actions, route handlers y, luego, MCP) solo validan entrada, construyen el `Actor` y llaman al caso de uso. No contienen reglas de negocio (T-03).
- `Actor` = `{ userId, kind: superadmin | admin | operator, activeStoreId?, channel: ui | api | app | mcp }`.
- En Next.js 16 el archivo de intercepción se llama `proxy.ts` (`middleware` está deprecado). Aquí solo refresca la sesión de Supabase y redirige a login, cambio de contraseña inicial o selección de tienda. **No decide permisos**: eso es de los casos de uso y RLS.
- Con `cacheComponents` activo, todo lo que lee cookies o la sesión es acceso dinámico: va dentro de `<Suspense>` y nada de datos por usuario usa `use cache`.

## 3. Modelo de datos

Todas las tablas están en `public`, con RLS activo, `id uuid`, `created_at/updated_at timestamptz` y borrado lógico con `deleted_at` donde aplica (P-03). Las columnas clave:

| Tabla | Columnas principales | Reglas |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `kind` (superadmin / admin / operator), `username`, `display_name`, `company_id` (solo operadores), `status` (active / locked / deactivated), `must_change_password`, `deleted_at` | `username` con forma `código.nombre`, único en todo el sistema, inmodificable y nunca reutilizado, sin distinguir mayúsculas (DR-011). El administrador solo escribe `nombre`; el prefijo lo pone el sistema, así que nunca hay colisión entre compañías ni se revela qué existe en otra. Solo hay un `superadmin` (índice único parcial). `company_id` nulo salvo en operadores. |
| `companies` | `name`, `code` (4 caracteres aleatorios, único e inmutable, lo genera el sistema), `founder_id` → `profiles`, `status` (active / inactive), `status_reason_code`, `status_reason_text`, `status_changed_by/at`, `session_cap_seconds` (por defecto 86400, máximo 86400 **[mi decisión]**), `deleted_at` | El fundador es siempre administrador de la compañía. |
| `company_admins` | `company_id`, `admin_id`, `granted_by`, `created_at` | PK compuesta. El fundador se inserta en la misma transacción que la compañía. |
| `sites` | `company_id`, `name`, `status` y motivo, `deleted_at` | Nombre único por compañía. |
| `stores` | `company_id`, `site_id`, `name`, `status` y motivo, `deleted_at` | FK compuesta `(site_id, company_id)` → `sites(id, company_id)`: una tienda no puede colgar de una sede de otra compañía. |
| `roles` | `owner_id` (administrador), `name`, `session_seconds` (nulo = tope de la compañía), `deleted_at` | Nombre único por dueño. |
| `role_company_exclusions` | `role_id`, `company_id` | Un rol vale por defecto para todas las compañías del dueño; esta tabla guarda las desmarcadas (DR-008). |
| `role_permissions` | `role_id`, `module` (por ahora `products`), `can_view`, `can_create`, `can_edit`, `can_delete` | El historial de un módulo se ve con `can_view` de ese módulo (DR-017). |
| `user_stores` | `user_id`, `store_id`, `company_id`, `role_id` | PK `(user_id, store_id)`. FK compuestas `(user_id, company_id)` → `profiles` y `(store_id, company_id)` → `stores`: garantizan que el usuario y la tienda son de la misma compañía (DR-009). |
| `categories` | `company_id`, `name`, `deleted_at` | Índice único `(company_id, lower(name))` donde `deleted_at is null` (DR-016). |
| `products` | `company_id`, `category_id`, `name`, `description` (opcional), `active`, `deleted_at` | FK compuesta `(category_id, company_id)`: la categoría es de la misma compañía. Nombre único como en categorías. |
| `app_sessions` | `session_id` (= `session_id` del JWT de Supabase), `user_id`, `started_at`, `active_store_id`, `ended_at` | Ver §5. |
| `audit_log` | `company_id`, `module`, `entity_type`, `entity_id`, `action` (create / update / deactivate / reactivate / delete), `actor_id`, `store_id`, `channel`, `before`, `after` (jsonb), `created_at` | Solo se inserta; sin `UPDATE` ni `DELETE` para ningún rol (P-02). |
| `auth_events` | `user_id` o `username_attempted`, `event` (login_ok / login_failed / locked / unlocked / pin_reset / password_changed), `actor_id`, `channel`, `created_at` | Solo los administradores la leen (DR-017). |

**Reglas que protege la base de datos, no solo el código:**
- Triggers que impiden quitar al fundador de `company_admins` y eliminar o desactivar un `profile` administrador que sea fundador de alguna compañía (DR-005, DR-006).
- Trigger que impide eliminar (borrado lógico) una categoría con productos vivos (CA-12 de REQ-008) y una compañía, sede o tienda con datos asociados (DR-015).
- Trigger que rechaza asignar a un usuario un rol excluido de su compañía.
- Función `app.is_operational(store_id)`: devuelve verdadero solo si la tienda, su sede y su compañía están activas y sin `deleted_at`. Implementa la desactivación en cascada con estado propio por nivel (DR-015).

## 4. Autenticación (ADR-007, ADR-011)

**Superadmin y administradores**
- Correo y contraseña de Supabase Auth, mínimo 12 caracteres, y TOTP obligatorio. Un administrador se identifica con su **correo** **[mi decisión, ver Q-018]**.
- El superadmin crea al administrador con una contraseña temporal generada por el sistema y `must_change_password = true`. Mientras sea verdadero, `proxy.ts` solo deja ir a la pantalla de cambio, y los casos de uso rechazan cualquier otra operación.
- RLS exige `aal2` en el JWT para todo lo que hagan estos perfiles.
- El superadmin recupera su contraseña con el flujo de recuperación por correo de Supabase.
- **Primer superadmin (REQ-006, CA-02b):** se crea al arrancar el servidor, desde `instrumentation.ts` (`register`), leyendo `SUPERADMIN_EMAIL` y `SUPERADMIN_INITIAL_PASSWORD` del entorno. Es idempotente y seguro ante arranques simultáneos: el índice único parcial de `profiles` más un bloqueo consultivo de Postgres impiden crear dos. Entra con `must_change_password = true` y tiene que enrolar TOTP. En Vercel el servidor arranca por instancia, así que la comprobación debe ser barata y no hacer nada si ya existe. Tras el primer ingreso se debe quitar la contraseña inicial del entorno **[validar el momento de ejecución de `register` al implementar]**.

**Usuarios operativos (username + PIN)**
1. El administrador crea el usuario. El adaptador administrador de usuarios (única pieza con `service_role`, ADR-007 punto 9) crea el usuario de Supabase Auth con un correo sintético derivado **solo del username** (`<username>@<dominio interno no resoluble>`) **[mi decisión: corrige ADR-007 punto 1, que usaba la compañía; el username ya es único global]**.
2. El PIN son 6 dígitos de un generador criptográfico. La credencial real guardada es `HMAC-SHA256(PIN_PEPPER, username + ":" + PIN)`. `PIN_PEPPER` es un secreto de entorno de Vercel que no está en la base de datos. Cambiar el pepper invalida todos los PIN, así que se guarda su versión en `app_metadata` **[mi decisión]**.
3. El PIN se devuelve al administrador una sola vez, con `Cache-Control: no-store`, y nunca se registra (ni en `audit_log` ni en logs de aplicación).
4. Login: una acción del servidor recibe username y PIN, deriva el correo y la credencial, llama a Supabase y devuelve siempre el mismo error genérico si algo falla. El límite por IP lo aplica el firewall de Vercel **[validar]**.
5. **Password Verification Hook** (Postgres): en cada intento incorrecto suma al contador del `profile`; al llegar a 5 pone `status = locked` y rechaza. Con `locked` o `deactivated` rechaza aunque la credencial sea correcta. Un intento correcto reinicia el contador. Escribe en `auth_events`.
6. Desbloquear (solo administrador): genera PIN nuevo, pone `status = active`, reinicia el contador y cierra las sesiones del usuario. Cambiar el PIN hace lo mismo con las sesiones (CA-12e de REQ-006).
7. **Custom Access Token Hook:** añade al JWT `user_kind` y `company_id`. La tienda activa no va en el JWT (cambia sin volver a escribir el PIN): se lee de `app_sessions`.

**Aplicación externa (ADR-011):** el servidor OAuth de Supabase sirve la autorización; las pantallas de login y consentimiento son páginas de Next.js (`/oauth/...`). El PIN se escribe en esa página, nunca en la app.

## 5. Sesiones (ADR-009, DR-012, DR-013)

- Al iniciar sesión se inserta una fila en `app_sessions` con el `session_id` del JWT y `started_at`.
- Elegir o cambiar de tienda actualiza `active_store_id`, tras comprobar que el usuario tiene esa tienda asignada y que `app.is_operational(store)` es verdadero.
- Expiración efectiva = `started_at + mínimo(1 día, tope de la compañía de la tienda activa, tiempo de sesión del rol en esa tienda)`.
- Al cambiar de tienda, si la expiración de la nueva tienda ya pasó, se marca `ended_at` y se exige PIN de nuevo (DR-013).
- Superadmin y administradores: `started_at + 1 día`, sin tienda activa.
- Doble barrera: los casos de uso comprueban `app.session_active()` en cada operación, y las políticas RLS llaman a la misma función. Un token todavía válido para Supabase no da acceso si la fila de `app_sessions` expiró o terminó.
- La vida del JWT es corta; el valor y la posibilidad de limitar la duración de la sesión según el plan quedan en Q-014 **[validar]**.

## 6. Autorización y RLS (T-04)

Funciones `security definer` con `search_path` fijo, en el esquema `app`:

| Función | Devuelve |
|---|---|
| `app.kind()` | `superadmin`, `admin` u `operator` según `profiles` |
| `app.is_company_admin(company_id)` | verdadero si el administrador tiene fila en `company_admins` (o es superadmin) y la sesión es `aal2` |
| `app.session_active()` | verdadero si la fila de `app_sessions` no expiró ni terminó |
| `app.active_store()` | tienda activa del operador en la sesión |
| `app.can(company_id, module, op)` | verdadero si el operador tiene en su tienda activa un rol con ese permiso y `is_operational` |

| Tabla | Lectura | Escritura |
|---|---|---|
| `profiles`, `user_stores` | Superadmin: todo. Administrador: usuarios de sus compañías. Operador: su propia fila. | Superadmin crea administradores. Administrador gestiona operadores de sus compañías. |
| `companies`, `sites`, `stores` | Superadmin: todo. Administrador: sus compañías. Operador: su compañía y tiendas asignadas. | Solo administradores con acceso. Desactivar, reactivar y eliminar: fundador o superadmin. |
| `company_admins` | Administradores de la compañía y superadmin. | Dar acceso: cualquier administrador de la compañía o superadmin. Quitar: fundador o superadmin, nunca al fundador. |
| `roles`, `role_*` | Solo el dueño del rol (DR-008). | Solo el dueño del rol. |
| `user_stores` (columna `role_id`) | Un administrador que no es dueño del rol ve la fila pero no el rol: la interfaz muestra "rol de otro administrador". | Solo el dueño del rol puede cambiar `role_id`; cualquier administrador de la compañía puede desbloquear, resetear PIN y desactivar (DR-008). |
| `categories` | Administradores y operadores con `app.can(company, 'products', 'view')`. | Solo administradores. |
| `products` | `app.can(..., 'view')`. | `app.can(..., 'create' / 'edit' / 'delete')`, y administradores. |
| `audit_log` | Superadmin: todo. Administrador: sus compañías. Operador: filas del módulo cuya vista permite su rol. | Nadie directamente; la escribe el trigger. |
| `auth_events` | Administradores de la compañía del usuario y superadmin. | Hooks y servidor. |

Las lecturas normales filtran `deleted_at is null`; el historial conserva todo.

## 7. Historial por triggers (P-02)

- Un trigger `AFTER INSERT/UPDATE` en cada tabla de negocio escribe `audit_log` con `before`/`after` (`to_jsonb`), la acción, el actor (`auth.uid()`), la tienda (de `app_sessions`) y el canal. Así ninguna escritura existe sin su registro, aunque el código se olvide, y se escribe en la misma transacción.
- La acción se deduce del cambio: `deleted_at` pasa de nulo a valor → `delete`; `status` cambia → `deactivate` / `reactivate`.
- Los campos sensibles no entran en `before/after` (no hay PIN ni contraseña en estas tablas).
- El **canal** (interfaz, API, app, MCP) se obtiene del cliente OAuth del JWT (`client_id`) mapeado a un canal; sin `client_id` es interfaz **[validar, Q-016]**.
- El cambio del tope de sesión queda en el historial por el mismo mecanismo (`companies.session_cap_seconds`).

## 8. Casos de uso

Cada uno recibe `Actor` e input validado, comprueba autorización y reglas, y usa solo puertos.

| Área | Casos de uso |
|---|---|
| Acceso | `CreateAdmin`, `ChangeOwnPassword`, `LoginWithPin`, `ChooseStore`, `SwitchStore`, `Logout` |
| Organización | `CreateCompany`, `GrantCompanyAccess`, `RevokeCompanyAccess`, `UpdateCompanySettings`, `CreateSite`, `CreateStore`, `Deactivate/Reactivate/DeleteCompanySiteStore` |
| Usuarios | `CreateOperator`, `AssignStores`, `ChangeOperatorRole`, `ResetPin`, `UnlockUser`, `DeactivateUser` |
| Roles | `CreateRole`, `UpdateRolePermissions`, `SetRoleCompanyExclusions`, `SetRoleSessionTime`, `DeleteRole` |
| Catálogo | `CreateCategory`, `RenameCategory`, `DeleteCategory`, `CreateProduct`, `UpdateProduct`, `SetProductActive`, `DeleteProduct`, `ListProducts`, `ListCategories` |
| Historial | `ListHistory(module, filtros)`, `ListAuthEvents` |

**Puertos:** `UserRepository`, `CompanyRepository`, `SiteRepository`, `StoreRepository`, `RoleRepository`, `CatalogRepository`, `SessionRepository`, `HistoryReader`, `AuthGateway` (crear usuario, derivar credencial, generar PIN, cerrar sesiones; envuelve a Supabase Auth para poder sustituirlo, T-05), `Clock`.

Los errores del dominio (`Forbidden`, `NotFound`, `RuleViolation(code)`, `Locked`, `SessionExpired`) se traducen en cada adaptador: página de error en la UI y `application/problem+json` en la API.

## 9. API REST `/api/v1` (T-06)

- Autenticación: `Authorization: Bearer` con el token OAuth de Supabase. La UI no usa esta API (usa server actions, T-03).
- Esquemas de entrada y salida con un validador de esquemas, y especificación OpenAPI generada a partir de ellos **[librería por decidir al implementar]**.
- Paginación por cursor, `ETag`, rate limiting y auditoría de cada llamada.
- Recursos: `/admins` (superadmin), `/companies`, `/companies/{id}/admins`, `/companies/{id}/settings`, `/sites`, `/stores` (con `:deactivate`, `:reactivate`), `/users` (con `:reset-pin`, `:unlock`), `/roles`, `/categories`, `/products`, `/history/{module}`, `/auth-events`.

## 10. MCP (ADR-012)

Solo catálogo (`lectura`, `escritura`, `sensible`) e historial de módulos (`lectura`), para superadmin y administradores. Configuración de qué herramientas se habilitan: REQ-001. No se implementa en este diseño; las herramientas son adaptadores sobre los casos de uso de §8.

## 11. Pruebas (D-04)

- **Casos de uso:** pruebas unitarias con repositorios en memoria. Cubren cada criterio de aceptación de REQ-005 a REQ-009 que no dependa de la base de datos.
- **RLS y triggers:** pruebas SQL (pgTAP con la CLI de Supabase) que verifican, por cada tabla y tipo de usuario, qué filas se ven y qué escrituras se rechazan; incluyen aislamiento entre compañías (P-01), fundador protegido, historial inmutable y sesión expirada.
- **Autenticación:** pruebas de integración del bloqueo a los 5 intentos, del error genérico y de que ningún registro contiene PIN.
- El ejecutor de pruebas de TypeScript se elige al empezar a implementar **[mi decisión pendiente]**.

## 12. Entorno

- Desarrollo local con la CLI de Supabase (migraciones en `supabase/migrations`) antes de tocar un proyecto remoto.
- Proyecto de Supabase de este sistema: `argos`, ref `wqzeqrjzahtqufasrydb`, región `us-east-1`, creado el 2026-10-25 (Q-017). Los otros cuatro proyectos de la cuenta (`gestion-negocio`, `OpenRouterAI`, `Argos-Analytics`, `argos-analytics-dev`) están inactivos y son de otros usos: no se tocan.
- La residencia de datos sigue abierta (Q-017). Las migraciones se prueban primero en local con la CLI de Supabase y solo después se aplican a `argos`.
- Secretos de entorno: `PIN_PEPPER`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor, usado únicamente por el adaptador administrador).

## 13. Orden de construcción

Cortes verticales, cada uno con casos de uso, pruebas, RLS y pantalla:

1. Cimientos: Supabase local, migración base, perfiles, función `app.*`, cliente con JWT, `Actor`.
2. Superadmin: login, creación de administradores, contraseña temporal y TOTP.
3. Organización: compañías, acceso compartido, sedes, tiendas, desactivación y ajustes.
4. Roles y permisos.
5. Operadores: creación, PIN, login, bloqueo, selección de tienda y sesiones.
6. Catálogo: categorías y productos.
7. Historial y eventos de acceso (vistas).
8. API REST con OpenAPI.
9. Flujo OAuth para la app (ADR-011) y MCP.
