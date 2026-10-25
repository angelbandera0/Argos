# Módulo 1 · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo 1 (compañías, sedes y tiendas; usuarios y acceso; roles; catálogo; historial) con UI, casos de uso, base de datos con RLS y API REST.

**Architecture:** Clean Architecture con un núcleo de casos de uso (`core/`) y adaptadores delgados: server actions para la UI y route handlers para `/api/v1`. Supabase solo como infraestructura detrás de puertos; el aislamiento por compañía se garantiza con autorización en los casos de uso y RLS, y el historial con triggers. Se construye en cortes verticales: cada fase deja algo que funciona y se prueba.

**Tech Stack:** Next.js 16.4.3 (App Router, `cacheComponents`), React 19.3, TypeScript estricto, Tailwind v4 con los tokens de `docs/design/tokens.css`, Supabase (Postgres, Auth con MFA y hooks), `@supabase/ssr`, Vitest, pgTAP (`supabase test db`), zod, lucide-react, pnpm.

**Spec:**
- `docs/DOMAIN.md` (DR-001 a DR-018) y `docs/requirements/REQ-005` a `REQ-009`
- `docs/technical/MODULO-1-DISENO-TECNICO.md` (modelo de datos, RLS, autenticación, sesiones, API)
- `docs/DECISIONS.md` (ADR-006 a ADR-012) y `docs/CONSTITUTION.md`
- `docs/design/DESIGN.md`, `docs/design/screens/MODULO-1-PANTALLAS.md` y `docs/design/screens/mockups/`

## Enmienda 2026-10-25: entorno cloud, sin Docker

Decisión del usuario: todo se desarrolla y se prueba contra el proyecto Supabase `argos` (ref `wqzeqrjzahtqufasrydb`), sin Docker ni CLI local. Esta enmienda **prevalece** sobre el resto del plan:

- Donde el plan diga `supabase start`, "Supabase local", "base local" o "con `supabase start`", léase **el proyecto `argos`**.
- Donde diga `pnpm test:db`, léase: **aplicar la migración con `apply_migration` del MCP de Supabase y ejecutar el archivo de prueba con `execute_sql`**. Cada archivo pgTAP va envuelto en `begin; … rollback;`, así que no deja datos. Hay que habilitar `pgtap` una vez (`create extension if not exists pgtap with schema extensions;`).
- Las migraciones se guardan igualmente en `supabase/migrations/` y se aplican con `apply_migration` usando el mismo nombre. **Una migración ya aplicada no se reescribe**: un arreglo es una migración nueva.
- No hay `supabase/config.toml`. Los hooks de autenticación y el MFA se activan a mano en el panel de Supabase (instrucciones en `supabase/HOOKS.md`, que crea la Tarea 13).
- Las pruebas de integración (`pnpm test:int`) usan el proyecto real: crean usuarios con el prefijo `itest-` y los borran al terminar. Necesitan `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`, que **el usuario** debe copiar del panel (el agente no puede leerla ni debe escribirla en ningún chat).
- No hay paso final "aplicar al proyecto remoto" (Tarea 36, paso 3): las migraciones ya están aplicadas.

## Global Constraints

- Next.js 16.4.3 y React 19.3: antes de escribir código de Next.js, leer la guía correspondiente en `node_modules/next/dist/docs/` (`AGENTS.md`). El archivo de intercepción se llama `proxy.ts`, no `middleware.ts`.
- Con `cacheComponents` activo, todo lo que lee cookies o la sesión va dentro de `<Suspense>` y ningún dato por usuario usa `use cache`.
- `pnpm` como gestor de paquetes; alias `@/*` apunta a la raíz (no hay `src/`).
- `core/` no importa Next.js, React ni Supabase. Las dependencias apuntan hacia dentro (T-02).
- `service_role` solo en `infrastructure/supabase/admin-client.ts` y solo para crear usuarios y restablecer PIN o contraseñas (ADR-007, punto 9). Todo lo demás usa el JWT del usuario (T-04).
- UI: solo tokens de `docs/design/tokens.css`, sin hex ni px sueltos; texto en español; cada ruta con datos lleva su `loading.tsx` con el placeholder de su pantalla (DESIGN.md §6.15).
- Username: `código.nombre` en minúsculas; el código son 4 caracteres `[a-z0-9]` asignados al crear la compañía y no cambian (DR-011).
- PIN: 6 dígitos de un generador criptográfico; la credencial guardada es `HMAC-SHA256(PIN_PEPPER, username + ":" + PIN)`; el PIN se muestra una sola vez y nunca se guarda ni se registra (ADR-007).
- Bloqueo tras **5** PIN incorrectos seguidos; solo un administrador desbloquea, y se genera un PIN nuevo.
- Contraseña de superadmin y administradores: mínimo **12** caracteres; TOTP obligatorio (RLS exige `aal2`).
- Sesión: máximo **86400 s**; expiración = `started_at + mínimo(86400, tope de la compañía de la tienda activa, tiempo del rol)`.
- Eliminar es siempre borrado lógico (`deleted_at`); el historial es inmutable.
- Motivos de desactivación: `cierre-definitivo`, `cierre-temporal`, `reestructuracion`, `remodelacion`, `creada-por-error`, `fin-de-contrato`, `otro` (texto obligatorio).
- Los commits terminan con la línea `Co-Authored-By` que indique el entorno. Mensajes de commit en inglés, formato `tipo(ámbito): descripción`.
- Todo se desarrolla contra el proyecto cloud `argos` (ref `wqzeqrjzahtqufasrydb`); ver la enmienda de entorno cloud. No se toca ningún otro proyecto de la cuenta.

## Review Focus

1. **Dos arranques simultáneos del servidor** no deben crear dos superadmins ni fallar. (Tarea 17)
2. **Un PIN o contraseña aparece** en el historial, en `auth_events`, en un mensaje de error o en un log. (Tareas 12, 16 y 28)
3. **Un JWT todavía válido con la sesión de aplicación terminada** sigue operando. (Tareas 10 y 27)
4. **Usernames y nombres con mayúsculas, espacios o puntos de más** colisionan o eluden la unicidad. (Tareas 4, 6 y 11)
5. **Lo eliminado lógicamente reaparece** en listados o permite reutilizar un nombre o un username. (Tareas 6, 11 y 12)

---

## Registro de interfaces

Los nombres de abajo son los que usan todas las tareas. Cada una repite solo lo que consume.

**`core/domain/`**
- `actor.ts`: `type ActorKind = "superadmin" | "admin" | "operator"`; `type Channel = "ui" | "api" | "app" | "mcp"`; `interface Actor { userId: string; kind: ActorKind; channel: Channel; activeStoreId?: string }`.
- `errors.ts`: clases `Forbidden`, `NotFound`, `RuleViolation(code: RuleCode)`, `AuthFailed` (login fallido, sin detalle), `SessionExpired`. `RuleCode = "FOUNDER_PROTECTED" | "HAS_DATA" | "ROLE_EXCLUDED" | "NAME_TAKEN" | "CATEGORY_HAS_PRODUCTS" | "REASON_REQUIRED" | "SUPERADMIN_EXISTS" | "PASSWORD_TOO_SHORT" | "PERMISSION_REQUIRES_VIEW" | "SESSION_TOO_LONG" | "STORE_UNAVAILABLE"`.
- `username.ts`: `formatUsername(code, name): string`, `parseUsername(username): { code: string; name: string }`, `normalizeUsername(raw): string`, `isValidUsernameName(name): boolean`.
- `company-code.ts`: `generateCompanyCode(randomInt: (max: number) => number): string`.
- `password.ts`: `validateAdminPassword(password: string): void`.
- `permissions.ts`: `type Module = "products"`; `type Op = "view" | "create" | "edit" | "delete"`; `type PermissionSet = Record<Op, boolean>`; `assertValidPermissions(p: PermissionSet): void`.
- `deactivation.ts`: `REASON_CODES`; `interface Reason { code: ReasonCode; text?: string }`; `validateDeactivationReason(r: Reason): void`.
- `session.ts`: `effectiveExpiry(i: { startedAt: Date; companyCapSeconds: number; roleSeconds: number | null }): Date`; `isExpired(now: Date, expiry: Date): boolean`.

**`core/application/ports/`** (cada una en su archivo, nombres exactos)
- `Clock { now(): Date }`.
- `AuthGateway`: `createAdminUser(i: { email: string; displayName: string }): Promise<{ userId: string; temporaryPassword: string }>`; `createOperatorUser(i: { username: string; companyId: string; displayName: string }): Promise<{ userId: string; pin: string }>`; `resetPin(userId: string): Promise<{ pin: string }>`; `setPassword(userId: string, password: string): Promise<void>`; `revokeSessions(userId: string): Promise<void>`; `ensureSuperadmin(i: { email: string; initialPassword: string }): Promise<{ created: boolean }>`.
- `PinVerifier { verify(username: string, pin: string): Promise<{ userId: string } | null> }`.
- Repositorios: `CompanyRepository`, `SiteRepository`, `StoreRepository`, `UserRepository`, `RoleRepository`, `CatalogRepository`, `SessionRepository`, `HistoryReader`. Las firmas se fijan en la tarea que los crea y no cambian después.

**Casos de uso** (`core/application/use-cases/<área>/<nombre>.ts`): cada uno exporta `makeXxx(deps)` que devuelve `(actor: Actor, input) => Promise<Output>`.

---

## Fase 0 · Cimientos

### Task 1: Entorno contra el proyecto cloud

**Files:**
- Modify: `.gitignore` (comprobar que `.env*.local` está ignorado)
- Create: `.env.example`, `supabase/migrations/.gitkeep`, `supabase/tests/.gitkeep`

**Interfaces:**
- Produces: `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PIN_PEPPER`, `SUPERADMIN_EMAIL`, `SUPERADMIN_INITIAL_PASSWORD`; `.env.local` (no versionado) con la URL y la clave publicable del proyecto `argos` y un `PIN_PEPPER` aleatorio de 32 o más caracteres; la extensión `pgtap` habilitada en `argos`.

- [ ] **Step 1: Obtener los valores públicos** con `get_project_url` y `get_publishable_keys` del MCP de Supabase (proyecto `argos`) y escribirlos en `.env.local`. Generar `PIN_PEPPER` con `openssl rand -hex 32`.
- [ ] **Step 2: Habilitar pgTAP** con `execute_sql`: `create extension if not exists pgtap with schema extensions;` y comprobar con `select extname from pg_extension where extname = 'pgtap';`. Esperado: una fila.
- [ ] **Step 3: Crear `.env.example`** con las seis variables y un comentario por cada una; dejar `SUPABASE_SERVICE_ROLE_KEY` vacía en `.env.local` y anotar que la copia el usuario desde el panel (Project Settings → API).
- [ ] **Step 4: Verificar** que `git status` no muestra `.env.local` (`git check-ignore .env.local` lo confirma) y añadir `!.env.example` a `.gitignore`, porque `.env*` también ignora `.env.example`; comprobar que `git status` sí muestra `.env.example`.
- [ ] **Step 5: Commit** — `chore(supabase): cloud environment, env example and pgtap`.

### Task 2: Spike de Q-014 y Q-016

**Files:**
- Modify: `docs/OPEN_QUESTIONS.md` (Q-014, Q-016), `docs/technical/MODULO-1-DISENO-TECNICO.md` (§4, §5, §7 según el resultado)

**Interfaces:**
- Produces: respuestas verificadas a: (a) si el Password Verification Hook y el Custom Access Token Hook existen en el plan de `argos` y en local; (b) si el JWT de un cliente OAuth trae `client_id`; (c) cómo limitar la duración de la sesión; (d) si Supabase acepta correos del dominio `.invalid` para usuarios sintéticos.

- [ ] **Step 1: Consultar la documentación** con la herramienta `search_docs` del MCP de Supabase y Context7 para (a), (b) y (c). Anotar cada respuesta con la fuente.
- [ ] **Step 2: Probar (d) y (a) en local** — crear con `supabase.auth.admin.createUser` un usuario `prueba@operadores.argos.invalid` y registrar un hook trivial en `supabase/config.toml`. Esperado: el usuario se crea y el hook se ejecuta; si algo falla, anotar el error exacto.
- [ ] **Step 3: Documentar** los resultados en Q-014 y Q-016 y ajustar el diseño técnico si cambia algo (por ejemplo, otro dominio para el correo sintético, o forzar la sesión solo en aplicación).
- [ ] **Step 4: Commit** — `docs: record auth hooks and session spike findings`.

### Task 3: Herramientas de prueba

**Files:**
- Modify: `package.json` (scripts), `tsconfig.json` (excluir `supabase/` si hace falta)
- Create: `vitest.config.ts`, `tests/smoke.test.ts`

**Interfaces:**
- Produces: `pnpm test` (Vitest, pruebas unitarias en `tests/unit/**`), `pnpm test:int` (Vitest, `tests/integration/**`, usa el proyecto `argos` y `SUPABASE_SERVICE_ROLE_KEY`), `pnpm typecheck` (`tsc --noEmit`). El alias `@` resuelve a la raíz en Vitest.

- [ ] **Step 1: Escribir `tests/unit/smoke.test.ts`** que importa algo vía `@/` (por ejemplo `@/core/domain/actor` tras la Tarea 4; hasta entonces un módulo trivial) y comprueba `1 + 1 === 2`.
- [ ] **Step 2: Ejecutar `pnpm test`** — Esperado: FAIL, el script no existe.
- [ ] **Step 3: Instalar `vitest` y `vite-tsconfig-paths`**; configurar `vitest.config.ts` con dos proyectos (`unit`, `integration`) y añadir los cuatro scripts.
- [ ] **Step 4: Ejecutar** `pnpm test && pnpm typecheck && pnpm lint` — Esperado: PASS.
- [ ] **Step 5: Commit** — `chore: add vitest, test scripts and typecheck`.

### Task 4: Dominio · identidad

**Files:**
- Create: `core/domain/actor.ts`, `errors.ts`, `username.ts`, `company-code.ts`, `password.ts`
- Test: `tests/unit/domain/username.test.ts`, `company-code.test.ts`, `password.test.ts`

**Interfaces:**
- Produces: las firmas del registro de interfaces para estos cinco archivos.

- [ ] **Step 1: Escribir las pruebas**
  - `username`: `formatUsername("k7m2","caja1") === "k7m2.caja1"`; `parseUsername("k7m2.caja1")` devuelve `{ code: "k7m2", name: "caja1" }`; `normalizeUsername("  K7M2.Caja1 ") === "k7m2.caja1"`; `isValidUsernameName` acepta `"caja1"`, `"ana-lopez"`, `"a_b"` y rechaza `""`, `"a"`, `"ca ja"`, `"ca.ja"`, un nombre de 25 caracteres y mayúsculas sin normalizar (regla: `^[a-z0-9_-]{2,24}$`, **decisión de este plan**); `parseUsername("sinpunto")` lanza `RuleViolation`.
  - `company-code`: con `randomInt = () => 0` devuelve `"aaaa"`; con `randomInt = (max) => max - 1` devuelve `"9999"`; siempre 4 caracteres de `[a-z0-9]` (alfabeto de 36).
  - `password`: 11 caracteres lanza `RuleViolation` con `code: "PASSWORD_TOO_SHORT"`; 12 pasa; `"            "` (12 espacios) también pasa (sin reglas de composición).
- [ ] **Step 2: Ejecutar** `pnpm test tests/unit/domain` — Esperado: FAIL, módulos inexistentes.
- [ ] **Step 3: Implementar** los cinco archivos con las firmas del registro; `RuleViolation` guarda `code` y es `instanceof Error`.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(core): add actor, errors, username, company code and password rules`.

### Task 5: Dominio · reglas

**Files:**
- Create: `core/domain/permissions.ts`, `deactivation.ts`, `session.ts`
- Test: `tests/unit/domain/permissions.test.ts`, `deactivation.test.ts`, `session.test.ts`

**Interfaces:**
- Consumes: `RuleViolation` (Tarea 4).
- Produces: `assertValidPermissions`, `REASON_CODES`, `validateDeactivationReason`, `effectiveExpiry`, `isExpired`.

- [ ] **Step 1: Escribir las pruebas**
  - `permissions`: `{view:false,create:true,edit:false,delete:false}` lanza `PERMISSION_REQUIRES_VIEW`; `{view:false,...todo false}` pasa; `{view:true,create:true,edit:false,delete:true}` pasa.
  - `deactivation`: `{code:"cierre-temporal"}` pasa; `{code:"otro"}` y `{code:"otro",text:"   "}` lanzan `REASON_REQUIRED`; `{code:"otro",text:"Cambio de local"}` pasa; un código desconocido lanza `REASON_REQUIRED`.
  - `session`: inicio `2026-10-25T08:00:00Z`, tope `86400`, rol `null` → `2026-10-26T08:00:00Z`; rol `3600` → `09:00:00Z`; tope `7200` y rol `86400` → `10:00:00Z`; tope `172800` y rol `null` → sigue en 24 h (límite absoluto); `isExpired` es falso un milisegundo antes y verdadero en el instante exacto.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar** los tres archivos; `effectiveExpiry` usa `min(86400, companyCapSeconds, roleSeconds ?? Infinity)`.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(core): add permission, reason and session expiry rules`.

---

## Fase 1 · Base de datos

Convención para las seis tareas siguientes: cada migración vive en `supabase/migrations/<AAAAMMDDHHMMSS>_<nombre>.sql` y cada prueba pgTAP en `supabase/tests/<NNN>_<nombre>.test.sql`, con la forma `begin; select plan(n); …; select * from finish(); rollback;`. Se ejecutan con `execute_sql` del MCP (ver la enmienda de entorno cloud). Los nombres de las pruebas incluyen el criterio de aceptación que cubren (por ejemplo `'REQ-005 CA-05: ...'`).

### Task 6: Esquema núcleo

**Files:**
- Create: `supabase/tests/000_helpers.sql`, `supabase/migrations/20261025000100_core_schema.sql`, `supabase/tests/001_core_schema.test.sql`

**Interfaces:**
- Produces: tablas `profiles`, `companies`, `company_admins`, `sites`, `stores` según §3 del diseño técnico; función `app.generate_company_code()`; RPC `public.create_company(p_name text) returns companies` (inserta compañía, su código y la fila del fundador en `company_admins` en una transacción, con `founder_id = auth.uid()`). Helpers de prueba: `tests.create_user(kind text, email text, company uuid default null) returns uuid`, `tests.authenticate_as(user_id uuid, aal text default 'aal2')`, `tests.clear_auth()`.

- [ ] **Step 1: Escribir `000_helpers.sql`** (crea el esquema `tests` y los tres helpers; `authenticate_as` hace `set local role authenticated` y fija `request.jwt.claims` con `sub`, `role` y `aal`).
- [ ] **Step 2: Escribir `001_core_schema.test.sql`** con estas pruebas
  - un segundo `profile` de `kind = 'superadmin'` falla (índice único parcial);
  - `username` es único sin distinguir mayúsculas y un username eliminado lógicamente **no** se puede reutilizar;
  - `companies.code` es único, tiene 4 caracteres `[a-z0-9]` y un `update` que lo cambia falla;
  - una tienda con `site_id` de una sede de otra compañía falla (FK compuesta `(site_id, company_id)`);
  - el nombre de sede es único por compañía entre las no eliminadas;
  - `create_company` crea la fila del fundador y asigna un código.
- [ ] **Step 3: Ejecutar `pnpm test:db`** — Esperado: FAIL, las tablas no existen.
- [ ] **Step 4: Escribir la migración** con enums (`profile_kind`, `org_status`, `profile_status`), las cinco tablas y sus restricciones, y `create_company`.
- [ ] **Step 5: Ejecutar `pnpm test:db`** — Esperado: PASS.
- [ ] **Step 6: Commit** — `feat(db): core schema for profiles, companies, sites and stores`.

### Task 7: Funciones `app.*` y RLS del núcleo

**Files:**
- Create: `supabase/migrations/20261025000200_rls_core.sql`, `supabase/tests/002_rls_core.test.sql`

**Interfaces:**
- Consumes: tablas y helpers de la Tarea 6.
- Produces: funciones `security definer` con `search_path` fijo `app.kind() returns text`, `app.is_superadmin() returns boolean`, `app.is_company_admin(p_company uuid) returns boolean` (exige `aal2`) y las políticas de §6 del diseño para `profiles`, `companies`, `company_admins`, `sites` y `stores`.

- [ ] **Step 1: Escribir las pruebas** (cada una con un usuario distinto)
  - un administrador ve solo las compañías de su `company_admins`; otro administrador sin acceso ve 0 filas (P-01);
  - con `aal1` un administrador ve 0 filas;
  - el superadmin ve todas; `anon` no ve ninguna;
  - un operador ve su compañía y sus tiendas asignadas, y no las demás sedes;
  - un operador no puede `insert` en `companies`;
  - dar acceso: cualquier administrador de la compañía puede insertar en `company_admins`; quien no lo es, no;
  - un administrador no puede ver filas de `profiles` de otra compañía.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Escribir la migración** con `alter table … enable row level security` y las políticas.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(db): RLS and helper functions for the core tables`.

### Task 8: Guardas del núcleo

**Files:**
- Create: `supabase/migrations/20261025000300_core_guards.sql`, `supabase/tests/003_core_guards.test.sql`

**Interfaces:**
- Consumes: Tareas 6 y 7.
- Produces: triggers de fundador y de borrado; `app.is_operational(p_store uuid) returns boolean`; `app.has_data(p_level text, p_id uuid) returns boolean`; las columnas `status_reason_code`, `status_reason_text`, `status_changed_by`, `status_changed_at` se rellenan por trigger al cambiar `status`.

- [ ] **Step 1: Escribir las pruebas**
  - `REQ-005 CA-05`: borrar de `company_admins` la fila del fundador falla, incluso con rol postgres;
  - `REQ-006 CA-06`: poner `deleted_at` a un administrador que es fundador falla;
  - `REQ-005 CA-08`: pasar una compañía a `inactive` sin `status_reason_code` falla; con `'otro'` y sin texto falla;
  - `REQ-005 CA-06`: poner `deleted_at` a una compañía con una sede viva falla con mensaje `HAS_DATA`; a una compañía recién creada sin hijos, funciona (**decisión de este plan:** los hijos vivos, usuarios, categorías y productos cuentan como datos);
  - `REQ-005 CA-13`: `app.is_operational(tienda)` es verdadero solo si tienda, sede y compañía están activas y sin `deleted_at`; tabla de verdad con las 8 combinaciones;
  - desactivar y reactivar actualiza `status_changed_by` con `auth.uid()`.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Escribir la migración** con los triggers (`before update/delete`) y las dos funciones.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(db): founder protection, soft-delete guards and operational check`.

### Task 9: Roles

**Files:**
- Create: `supabase/migrations/20261025000400_roles.sql`, `supabase/tests/004_roles.test.sql`

**Interfaces:**
- Produces: tablas `roles`, `role_company_exclusions`, `role_permissions` (columnas y reglas de §3); `check` que impide `create/edit/delete` sin `view`; políticas de modo que **solo el dueño** (`owner_id = auth.uid()`) ve y escribe sus roles y sus permisos.

- [ ] **Step 1: Escribir las pruebas**
  - `REQ-007 CA-10`: otro administrador de la misma compañía ve 0 roles ajenos;
  - nombre de rol único por dueño entre los no eliminados;
  - `insert` en `role_permissions` con `can_create` y sin `can_view` falla;
  - un operador no ve ningún rol, ni siquiera el suyo;
  - el superadmin no ve roles (gestión exclusiva de administradores).
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Escribir la migración.**
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(db): roles, permissions and company exclusions`.

### Task 10: Asignaciones y sesiones

**Files:**
- Create: `supabase/migrations/20261025000500_user_stores_sessions.sql`, `supabase/tests/005_user_stores_sessions.test.sql`

**Interfaces:**
- Produces: tablas `user_stores` (FK compuestas a `profiles(id, company_id)` y `stores(id, company_id)`) y `app_sessions`; funciones `app.session_active() returns boolean`, `app.active_store() returns uuid`, `app.can(p_company uuid, p_module text, p_op text) returns boolean`, `app.session_expiry(p_session uuid) returns timestamptz` (misma regla que `effectiveExpiry`).

- [ ] **Step 1: Escribir las pruebas**
  - asignar un usuario a una tienda de otra compañía falla;
  - `ROLE_EXCLUDED`: asignar un rol excluido de la compañía de la tienda falla (trigger);
  - `app.session_expiry`: con tope 86400 y rol `null` es `started_at + 1 día`; con rol 3600 es `+1 h`; con tope 7200 es `+2 h`;
  - **Review Focus 3:** con un JWT válido pero `app_sessions.ended_at` no nulo, o `started_at` anterior a la expiración, `app.session_active()` es falso y un `select` sobre una tabla con RLS de operador devuelve 0 filas;
  - `app.can(company,'products','view')` es verdadero con el rol de la tienda activa que lo permite, falso sin tienda activa, falso si la tienda no es operativa, y distinto al cambiar `active_store_id` a una tienda con otro rol;
  - un operador solo ve sus propias filas de `user_stores` y `app_sessions`.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Escribir la migración** (incluye el trigger de exclusión y las funciones).
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(db): store assignments, app sessions and permission checks`.

### Task 11: Catálogo

**Files:**
- Create: `supabase/migrations/20261025000600_catalog.sql`, `supabase/tests/006_catalog.test.sql`

**Interfaces:**
- Produces: tablas `categories` y `products` con FK compuesta `(category_id, company_id)`; índices únicos `(company_id, lower(trim(name)))` donde `deleted_at is null`; trigger que impide eliminar una categoría con productos vivos (`CATEGORY_HAS_PRODUCTS`); políticas: categorías solo administradores escriben y operadores con `app.can(..., 'view')` leen; productos según `app.can`.

- [ ] **Step 1: Escribir las pruebas**
  - **Review Focus 4:** `"Pan"`, `" pan "` y `"PAN"` colisionan en la misma compañía y no en otra;
  - **Review Focus 5:** un producto eliminado lógicamente libera su nombre y no aparece en `select` normal;
  - `REQ-008 CA-05`: asignar una categoría de otra compañía falla; `CA-12`: eliminar una categoría con productos vivos falla;
  - un operador con `create` pero sin `edit` puede insertar y no actualizar; sin `view` ve 0 filas;
  - un operador no puede escribir categorías; un administrador de otra compañía no ve nada.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Escribir la migración.**
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(db): catalog tables, uniqueness and RLS`.

### Task 12: Historial por triggers

**Files:**
- Create: `supabase/migrations/20261025000700_audit.sql`, `supabase/tests/007_audit.test.sql`

**Interfaces:**
- Produces: tablas `audit_log` y `auth_events` (§3); función `app.audit_row()` y triggers `after insert or update` en `companies`, `company_admins`, `sites`, `stores`, `roles`, `role_permissions`, `role_company_exclusions`, `user_stores`, `categories`, `products` y `profiles`; acción deducida del cambio (`create`, `update`, `deactivate`, `reactivate`, `delete`); canal desde `auth.jwt()->>'client_id'` (por defecto `ui`, ajustado por el resultado de la Tarea 2); políticas de lectura del §6. Nadie tiene `update` ni `delete` sobre `audit_log`.

- [ ] **Step 1: Escribir las pruebas**
  - `REQ-009 CA-01`: actualizar el nombre de un producto crea una fila con `before.name`, `after.name`, `actor_id`, `store_id` y `created_at`;
  - poner `deleted_at` crea acción `delete`; cambiar `status` crea `deactivate` o `reactivate`;
  - `CA-03`: `update` y `delete` sobre `audit_log` fallan para el administrador y para postgres;
  - `CA-04/05`: un operador con `view` de productos ve las filas del módulo `products` y ninguna de `companies`; sin `view` no ve nada;
  - `CA-10`: el administrador ve todo lo de sus compañías; el superadmin todo; otra compañía nada;
  - **Review Focus 2:** ninguna fila de `audit_log` contiene claves cuyo nombre incluya `pin`, `password` o `credential` en `before` o `after`, y `profiles` no tiene columnas con esos nombres;
  - `auth_events`: un operador no la lee; un administrador lee la de los usuarios de sus compañías.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Escribir la migración.**
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(db): audit log and auth events via triggers`.

### Task 13: Hooks de autenticación

**Files:**
- Create: `supabase/migrations/20261025000800_auth_hooks.sql`, `supabase/tests/008_auth_hooks.test.sql`
- Create: `supabase/HOOKS.md` (pasos manuales para registrar los hooks y activar MFA en el panel de Supabase)

**Interfaces:**
- Produces: `public.custom_access_token_hook(event jsonb) returns jsonb` (añade `user_kind` y `company_id` a los claims) y `public.hook_password_verification_attempt(event jsonb) returns jsonb` (bloqueo a los 5 fallos; rechaza si el perfil está `locked` o `deactivated`; reinicia el contador en un acierto; escribe en `auth_events`). El contador y el estado viven en `profiles` (`failed_pin_attempts int`, `status`).

- [ ] **Step 1: Escribir las pruebas**
  - cinco llamadas con `valid = false` para un operador: las cuatro primeras devuelven `continue`, la quinta deja `status = 'locked'` y devuelve `reject`;
  - un acierto antes del quinto fallo reinicia el contador a 0;
  - un usuario `locked` es rechazado aunque `valid = true`;
  - los administradores no se bloquean por este hook;
  - `custom_access_token_hook` añade `user_kind` y, para operadores, `company_id`; no añade la tienda activa;
  - cada intento fallido y el bloqueo dejan una fila en `auth_events` con `username_attempted`, sin el PIN.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Escribir la migración y `supabase/HOOKS.md`** según lo verificado en la Tarea 2. El registro de los hooks en el panel lo hace el usuario; el controlador lo pide antes de la Tarea 16.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(db): custom access token and password verification hooks`.

---

## Fase 2 · Infraestructura y base de la interfaz

### Task 14: Entorno, clientes de Supabase y `proxy.ts`

**Files:**
- Create: `infrastructure/env.ts`, `infrastructure/supabase/server-client.ts`, `infrastructure/supabase/admin-client.ts`, `infrastructure/proxy/decide-redirect.ts`, `infrastructure/container.ts`, `proxy.ts`
- Test: `tests/unit/infrastructure/env.test.ts`, `tests/unit/infrastructure/decide-redirect.test.ts`

**Interfaces:**
- Produces: `parseEnv(raw: Record<string, string | undefined>): Env`; `createServerClient(): Promise<SupabaseClient>` (JWT del usuario, cookies de `@supabase/ssr`); `createAdminClient(): SupabaseClient` (marcado con `import "server-only"`); `decideRedirect(i: { pathname: string; session: null | { kind: ActorKind; aal: "aal1" | "aal2"; mustChangePassword: boolean; sessionEnded: boolean } }): string | null`; `getContainer(): Container` con `setContainerForTests(c: Partial<Container>)`.

- [ ] **Step 1: Escribir las pruebas**
  - `parseEnv` lanza si falta `NEXT_PUBLIC_SUPABASE_URL`, si `PIN_PEPPER` tiene menos de 32 caracteres, y acepta `SUPERADMIN_*` ausentes;
  - `decideRedirect`: sin sesión en `/usuarios` → `/login`; sin sesión en `/tienda` → `/entrar`; administrador `aal1` → `/login/2fa`; `mustChangePassword` → `/primer-ingreso`; operador con sesión terminada → `/entrar`; operador en `/usuarios` → `/tienda`; rutas públicas (`/login`, `/entrar`, `/recuperar`) devuelven `null` sin sesión.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Leer** `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` y la guía de cookies; implementar los archivos. `proxy.ts` refresca la sesión con `@supabase/ssr` y aplica `decideRedirect`; no decide permisos.
- [ ] **Step 4: Ejecutar** `pnpm test && pnpm typecheck && pnpm build` — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(infra): env validation, supabase clients, proxy and container`.

### Task 15: Credencial del PIN

**Files:**
- Create: `infrastructure/auth/pin.ts`
- Test: `tests/unit/infrastructure/pin.test.ts`

**Interfaces:**
- Produces: `generatePin(randomInt: (max: number) => number): string`; `derivePinCredential(username: string, pin: string, pepper: string): string` (hex de `HMAC-SHA256(pepper, normalizeUsername(username) + ":" + pin)`); `syntheticEmail(username: string): string` (`<username normalizado>@operadores.argos.invalid`, o el dominio decidido en la Tarea 2).

- [ ] **Step 1: Escribir las pruebas**
  - `generatePin(() => 123) === "000123"` (conserva ceros) y `generatePin(() => 999999) === "999999"`; siempre 6 dígitos;
  - `derivePinCredential("k7m2.caja1","482917", PEPPER)` es igual a un literal calculado **una vez, de forma independiente**, con `printf 'k7m2.caja1:482917' | openssl dgst -sha256 -hmac "<PEPPER de la prueba>"` y pegado en la prueba; con `"K7M2.Caja1"` da el mismo resultado; con otro PIN o pepper, distinto;
  - `syntheticEmail(" K7M2.Caja1 ") === "k7m2.caja1@operadores.argos.invalid"`.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar** con `node:crypto` (`createHmac`, y `randomInt` inyectado).
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(auth): pin generation and credential derivation`.

### Task 16: Adaptador `AuthGateway` y `PinVerifier`

**Files:**
- Create: `core/application/ports/auth-gateway.ts`, `core/application/ports/pin-verifier.ts`, `infrastructure/supabase/auth-gateway.ts`, `infrastructure/supabase/pin-verifier.ts`
- Test: `tests/integration/auth-gateway.int.test.ts`

**Interfaces:**
- Consumes: Tareas 14 y 15; `createAdminClient()`.
- Produces: las firmas de `AuthGateway` y `PinVerifier` del registro, implementadas con `supabase.auth.admin` y `signInWithPassword`.

- [ ] **Step 1: Escribir la prueba de integración** (con `supabase start`)
  - `createOperatorUser` devuelve un PIN de 6 dígitos y, con `PinVerifier.verify(username, pin)`, el usuario entra; con otro PIN, `null`; con un username inexistente, `null`;
  - `resetPin` invalida el PIN anterior y el nuevo funciona;
  - `revokeSessions` hace que un refresh token previo deje de funcionar;
  - **Review Focus 2:** el mensaje de cualquier error lanzado por el adaptador no contiene el PIN ni la contraseña usados.
- [ ] **Step 2: Ejecutar `pnpm test:int`** — Esperado: FAIL.
- [ ] **Step 3: Implementar** los dos adaptadores; `createAdminUser` genera una contraseña temporal (mínimo 12 caracteres) y marca `app_metadata.must_change_password = true` y el perfil.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(infra): supabase auth gateway and pin verifier`.

### Task 17: Primer superadmin al arrancar

**Files:**
- Create: `core/application/use-cases/access/ensure-superadmin.ts`, `instrumentation.ts`
- Test: `tests/unit/use-cases/ensure-superadmin.test.ts`, `tests/integration/ensure-superadmin.int.test.ts`

**Interfaces:**
- Consumes: `AuthGateway.ensureSuperadmin`.
- Produces: `makeEnsureSuperadmin(deps: { auth: AuthGateway }): (i: { email: string; initialPassword: string }) => Promise<{ created: boolean }>`; `instrumentation.ts` exporta `register()` que, solo en el runtime Node y con `SUPERADMIN_EMAIL` y `SUPERADMIN_INITIAL_PASSWORD` definidos, lo ejecuta.

- [ ] **Step 1: Escribir las pruebas**
  - unitaria: con un `AuthGateway` falso, la primera llamada devuelve `created: true` y la segunda `false`; una contraseña de 11 caracteres lanza `PASSWORD_TOO_SHORT`;
  - **Review Focus 1 (integración):** `Promise.all` de cinco llamadas deja exactamente un `profile` con `kind = 'superadmin'`, sin errores no controlados, y `must_change_password = true`.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar.** Antes, leer `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`. La concurrencia la garantizan el índice único parcial y un `pg_advisory_xact_lock`; el adaptador trata la violación como `created: false`.
- [ ] **Step 4: Ejecutar `pnpm test && pnpm test:int`** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(access): bootstrap the first superadmin on server start`.

### Task 18: Base de la interfaz

**Files:**
- Create: `components/shell/app-shell.tsx`, `components/ui/{button,chip,card,field,dialog,skeleton,spinner,route-progress}.tsx`, `components/icons.ts`, `app/(app)/layout.tsx`, `app/(auth)/layout.tsx`
- Modify: `app/layout.tsx` (título "Argos", `lang="es"`), `package.json` (`lucide-react`)

**Interfaces:**
- Produces: `<AppShell nav={NavItem[]} active={string} user={{ name: string; role: string }}>` con panel lateral, barra de iconos y barra inferior (DESIGN.md §5, `mockups/shell.js`); componentes base con las clases de `tokens.css`; `<Skeleton variant="text|title|circle|pill|block" onPanel?>` y `<RouteProgress />`.

- [ ] **Step 1: Leer** las guías de layouts y de CSS de Next.js; instalar `lucide-react`.
- [ ] **Step 2: Implementar** los componentes siguiendo `mockups/` (misma estructura y tokens); los iconos de `shell.js` se sustituyen por los equivalentes de Lucide.
- [ ] **Step 3: Verificar** — `pnpm lint && pnpm typecheck && pnpm build`; con `pnpm dev` y una página temporal, comprobar en el navegador las tres vistas (web, tablet, móvil) contra `mockups/02-detalle-usuario.html`. Eliminar la página temporal.
- [ ] **Step 4: Commit** — `feat(ui): app shell and base components from the design system`.

---

## Fase 3 · Superadmin y administradores

### Task 19: Casos de uso de acceso de administradores

**Files:**
- Create: `core/application/use-cases/access/create-admin.ts`, `change-own-password.ts`, `core/application/ports/user-repository.ts`, `tests/fakes/in-memory-user-repository.ts`, `tests/fakes/fake-auth-gateway.ts`
- Test: `tests/unit/use-cases/create-admin.test.ts`, `change-own-password.test.ts`

**Interfaces:**
- Produces: `UserRepository` con `getProfile(userId: string): Promise<Profile | null>`; `Profile { id: string; kind: ActorKind; username: string | null; displayName: string; companyId: string | null; status: "active" | "locked" | "deactivated"; mustChangePassword: boolean }`; `makeCreateAdmin(deps: { auth: AuthGateway; users: UserRepository }): (actor, i: { email: string; displayName: string }) => Promise<{ adminId: string; temporaryPassword: string }>`; `makeChangeOwnPassword(deps: { auth: AuthGateway; users: UserRepository }): (actor, i: { newPassword: string }) => Promise<void>`.

- [ ] **Step 1: Escribir las pruebas**
  - `REQ-006 CA-03/05`: el superadmin crea un administrador y recibe una contraseña temporal; un administrador y un operador reciben `Forbidden`;
  - `CA-02`: no hay caso de uso para crear otro superadmin (comprobar que `createAdminUser` solo produce `kind = 'admin'`);
  - `CA-04/01c`: `changeOwnPassword` con 11 caracteres lanza `PASSWORD_TOO_SHORT`; con 12 llama a `setPassword` y deja `mustChangePassword = false`.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar** los casos de uso, el puerto y los dobles de prueba.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(access): create admin and change own password use cases`.

### Task 20: Páginas de acceso de administradores (A-01 a A-04)

**Files:**
- Create: `app/(auth)/login/page.tsx`, `login/2fa/page.tsx`, `primer-ingreso/page.tsx`, `recuperar/page.tsx`, `app/(auth)/actions.ts`, y un `loading.tsx` por ruta
- Modify: `infrastructure/supabase/auth-gateway.ts` (MFA: `enrollTotp`, `verifyTotp`)

**Interfaces:**
- Consumes: `makeChangeOwnPassword`, `createServerClient`, `decideRedirect`.
- Produces: server actions `signInAdmin(formData)`, `verifyTotp(formData)`, `completeFirstLogin(formData)`, `requestPasswordReset(formData)`.

- [ ] **Step 1: Implementar** las cuatro pantallas según `MODULO-1-PANTALLAS.md` §5 y la maqueta de login (formulario centrado, error genérico "Correo o contraseña incorrectos."), el enrolamiento de TOTP con código QR, y la recuperación por correo de Supabase.
- [ ] **Step 2: Verificar** con `pnpm dev` y Supabase local: iniciar sesión con el superadmin sembrado por la Tarea 17; ver que se fuerza el cambio de contraseña (mínimo 12), el enrolamiento de TOTP y que sin `aal2` el resto de rutas redirige. Un error de credenciales no revela si el correo existe.
- [ ] **Step 3: Commit** — `feat(access): admin login, TOTP and first-login pages`.

### Task 21: Páginas del superadmin (S-01, S-02)

**Files:**
- Create: `app/(app)/superadmin/administradores/page.tsx`, `.../nuevo/page.tsx`, `loading.tsx`, `actions.ts`
- Modify: `infrastructure/supabase/user-repository.ts` (nuevo: `getProfile`, `listAdmins`), `UserRepository` (añadir `listAdmins(): Promise<Profile[]>`)

**Interfaces:**
- Consumes: `makeCreateAdmin`.
- Produces: pantallas con la contraseña temporal mostrada una sola vez (mismo patrón que el modal del PIN de `mockups/02`).

- [ ] **Step 1: Implementar** lista (con estado vacío) y alta; la contraseña temporal aparece en un modal que no se cierra hasta copiarla.
- [ ] **Step 2: Verificar** — entrar como superadmin, crear un administrador, comprobar que la contraseña no vuelve a mostrarse tras recargar, y que un administrador no puede abrir `/superadmin/administradores`. Entrar como ese administrador: se le exige cambiar la contraseña y enrolar TOTP.
- [ ] **Step 3: Commit** — `feat(access): superadmin administrators screens`.

---

## Fase 4 · Organización

### Task 22: Casos de uso de organización

**Files:**
- Create: `core/application/ports/{company,site,store}-repository.ts`, `core/application/use-cases/organization/{create-company,grant-company-access,revoke-company-access,update-company-settings,create-site,create-store,deactivate-unit,reactivate-unit,delete-unit}.ts`, `tests/fakes/in-memory-organization.ts`
- Test: `tests/unit/use-cases/organization.test.ts`

**Interfaces:**
- Produces: `Company { id; code; name; founderId; status; sessionCapSeconds }`; `Level = "company" | "site" | "store"`; `CompanyRepository { create(i: { name: string; founderId: string }): Promise<Company>; getById(id: string): Promise<Company | null>; listForActor(actor: Actor): Promise<Company[]>; listAdmins(companyId: string): Promise<string[]>; grantAccess(companyId: string, adminId: string, grantedBy: string): Promise<void>; revokeAccess(companyId: string, adminId: string): Promise<void>; setSessionCap(companyId: string, seconds: number): Promise<void> }`; `SiteRepository` y `StoreRepository` con `create`, `getById`, `listByParent`, `hasData`; un `UnitStatusRepository { setStatus(level: Level, id: string, status: "active" | "inactive", reason: Reason | null, by: string): Promise<void>; softDelete(level: Level, id: string): Promise<void>; hasData(level: Level, id: string): Promise<boolean> }`. Casos: `makeCreateCompany`, `makeGrantCompanyAccess`, `makeRevokeCompanyAccess`, `makeUpdateCompanySettings`, `makeCreateSite`, `makeCreateStore`, `makeDeactivateUnit`, `makeReactivateUnit`, `makeDeleteUnit`.

- [ ] **Step 1: Escribir las pruebas** (una por criterio de REQ-005)
  - `CA-01`: un administrador sin compañías crea una y queda como fundador con código de 4 caracteres; un operador recibe `Forbidden`;
  - `CA-02`: crear sede y tienda; una tienda con una sede de otra compañía lanza `NotFound`;
  - `CA-03`: cualquiera de los administradores de la compañía, o el superadmin, da acceso a otro administrador; un administrador ajeno recibe `Forbidden`; el destino debe ser `admin`;
  - `CA-04`: un administrador que no es fundador intenta quitar acceso a otro y recibe `Forbidden`; el fundador y el superadmin pueden;
  - `CA-05`: quitar al fundador lanza `FOUNDER_PROTECTED`, incluso por el superadmin o por sí mismo;
  - `CA-06`: `makeDeleteUnit` con `hasData = true` lanza `HAS_DATA`; con `false`, hace borrado lógico (`CA-14`);
  - `CA-07/08`: desactivar por quien no es fundador ni superadmin lanza `Forbidden`; sin motivo, o con `otro` sin texto, lanza `REASON_REQUIRED`;
  - `CA-12`: reactivar exige texto libre y solo lo hacen fundador o superadmin;
  - `CA-10`: `makeUpdateCompanySettings` con `86401` lanza `SESSION_TOO_LONG`; con `3600` guarda; el superadmin recibe `Forbidden`; un administrador sin acceso, `Forbidden`;
  - `CA-11`: `listForActor` de un administrador devuelve solo sus compañías.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar** los puertos, los casos de uso y los dobles en memoria.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(org): organization use cases and ports`.

### Task 23: Repositorios de organización

**Files:**
- Create: `infrastructure/supabase/{company,site,store,unit-status}-repository.ts`
- Test: `tests/integration/organization.int.test.ts`

**Interfaces:**
- Consumes: puertos de la Tarea 22; RPC `create_company`; funciones `app.has_data`.
- Produces: implementaciones con el cliente del usuario (RLS activa).

- [ ] **Step 1: Escribir la prueba de integración**
  - un administrador crea una compañía por el repositorio y ve su código; otro administrador, sin acceso, no la ve;
  - desactivar con motivo `otro` y sin texto falla en base de datos aunque se llame al repositorio directamente;
  - el historial recibe las filas `create` y `deactivate` con el actor correcto.
- [ ] **Step 2: Ejecutar `pnpm test:int`** — Esperado: FAIL.
- [ ] **Step 3: Implementar** los repositorios; mapear los errores de Postgres (`HAS_DATA`, `FOUNDER_PROTECTED`) a `RuleViolation`.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(org): supabase repositories for companies, sites and stores`.

### Task 24: Páginas de organización (C-01 a C-06)

**Files:**
- Create: `app/(app)/companias/{page,nueva/page,[id]/page,[id]/administradores/page,[id]/ajustes/page}.tsx`, un `loading.tsx` por ruta, `actions.ts`, `components/org/{deactivate-dialog,company-selector}.tsx`

**Interfaces:**
- Consumes: casos de uso de la Tarea 22.
- Produces: `<CompanySelector>` (compañía activa del administrador, guardada en una cookie) que usarán las fases 6, 7 y 8.

- [ ] **Step 1: Implementar** las pantallas según `MODULO-1-PANTALLAS.md` y las maquetas `04` (árbol y modal de desactivación, estados sin permiso y desactivada); el árbol muestra el estado de cada nivel.
- [ ] **Step 2: Verificar** con dos administradores y el superadmin: crear compañía, sede y tienda; dar y quitar acceso (el fundador no tiene la acción); desactivar con y sin motivo; sin permiso el botón aparece desactivado con su razón; el segundo administrador no ve compañías ajenas; cambiar el tope de sesión.
- [ ] **Step 3: Commit** — `feat(org): company, site and store screens`.

---

## Fase 5 · Roles

### Task 25: Casos de uso y repositorio de roles

**Files:**
- Create: `core/application/ports/role-repository.ts`, `core/application/use-cases/roles/{create-role,update-role,set-role-company-exclusions,delete-role,list-roles}.ts`, `infrastructure/supabase/role-repository.ts`, `tests/fakes/in-memory-roles.ts`
- Test: `tests/unit/use-cases/roles.test.ts`, `tests/integration/roles.int.test.ts`

**Interfaces:**
- Produces: `Role { id; ownerId; name; sessionSeconds: number | null; excludedCompanyIds: string[]; permissions: Record<Module, PermissionSet> }`; `RoleRepository { create(role: Omit<Role, "id">): Promise<Role>; update(id: string, patch: Partial<Omit<Role, "id" | "ownerId">>): Promise<Role>; getById(id: string): Promise<Role | null>; listByOwner(ownerId: string): Promise<Role[]>; softDelete(id: string): Promise<void> }`; casos `makeCreateRole`, `makeUpdateRole`, `makeSetRoleCompanyExclusions`, `makeDeleteRole`, `makeListRoles`.

- [ ] **Step 1: Escribir las pruebas**
  - `REQ-007 CA-01`: un administrador crea un rol con permisos sobre `products`; un operador y el superadmin reciben `Forbidden`;
  - `CA-02/03`: un rol nuevo vale para todas las compañías del dueño y `excludedCompanyIds` se guarda; asignarlo en una compañía excluida lanza `ROLE_EXCLUDED` (en la Tarea 27);
  - `CA-05`: no existe permiso para módulos de gestión (el tipo `Module` solo admite `products`; una prueba de tipo con `// @ts-expect-error`);
  - `CA-06`: `sessionSeconds = 86401` lanza `SESSION_TOO_LONG`;
  - un permiso `create` sin `view` lanza `PERMISSION_REQUIRES_VIEW`;
  - nombre repetido del mismo dueño lanza `NAME_TAKEN`, ignorando mayúsculas y espacios;
  - `CA-10`: `makeListRoles` devuelve solo los del actor; editar o eliminar un rol ajeno lanza `Forbidden`;
  - integración: el repositorio devuelve el rol creado y el de otro administrador no aparece.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Ejecutar `pnpm test && pnpm test:int`** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(roles): role use cases and repository`.

### Task 26: Páginas de roles (R-01, R-02)

**Files:**
- Create: `app/(app)/roles/{page,nuevo/page,[id]/page}.tsx`, `loading.tsx`, `actions.ts`, `components/roles/permission-matrix.tsx`

**Interfaces:**
- Consumes: casos de la Tarea 25 y `<CompanySelector>`.

- [ ] **Step 1: Implementar** según la maqueta `03`: tres tarjetas, interruptores de compañías, casillas de permisos con la regla "Ver obligatorio", error de nombre repetido y estado "guardando".
- [ ] **Step 2: Verificar** — crear, editar y eliminar un rol; desmarcar una compañía; el segundo administrador no ve el rol; guardar con un permiso `create` sin `view` es imposible desde la UI.
- [ ] **Step 3: Commit** — `feat(roles): roles list and editor screens`.

---

## Fase 6 · Operadores

### Task 27: Casos de uso de operadores y sesión

**Files:**
- Create: `core/application/ports/session-repository.ts`, `core/application/use-cases/users/{create-operator,assign-stores,change-operator-role,reset-pin,unlock-user,deactivate-user}.ts`, `core/application/use-cases/access/{login-with-pin,choose-store,switch-store,logout}.ts`, `tests/fakes/in-memory-sessions.ts`
- Modify: `core/application/ports/user-repository.ts`
- Test: `tests/unit/use-cases/operators.test.ts`, `tests/unit/use-cases/session.test.ts`

**Interfaces:**
- Consumes: `AuthGateway`, `PinVerifier`, `Clock`, repositorios de organización y roles, `effectiveExpiry`.
- Produces: `UserRepository` ampliado con `createProfile`, `findByUsername`, `listForCompany`, `setStatus(userId: string, status: Profile["status"]): Promise<void>`, `assignStores(userId: string, assignments: { storeId: string; roleId: string }[]): Promise<void>`, `listAssignments(userId: string): Promise<Assignment[]>`; `SessionRepository { start(i: { sessionId: string; userId: string; startedAt: Date }): Promise<void>; setActiveStore(sessionId: string, storeId: string): Promise<void>; end(sessionId: string): Promise<void>; get(sessionId: string): Promise<AppSession | null> }`; casos con las firmas: `makeLoginWithPin(deps)(i: { username: string; pin: string; sessionId: string }): Promise<{ userId: string; stores: StoreOption[] }>` (no recibe `Actor`), `makeChooseStore(deps)(actor, i: { storeId: string })`, `makeSwitchStore(deps)(actor, i: { storeId: string })`, `makeCreateOperator`, `makeResetPin`, `makeUnlockUser`, etc.

- [ ] **Step 1: Escribir las pruebas**
  - `REQ-006 CA-07`: `makeCreateOperator` devuelve `username = código.nombre` con el código de la compañía y un PIN de 6 dígitos; un nombre inválido lanza `RuleViolation`; un nombre repetido (ignorando mayúsculas) lanza `NAME_TAKEN`; una tienda de otra compañía lanza `NotFound`; un rol excluido lanza `ROLE_EXCLUDED`; un rol de otro administrador lanza `Forbidden`;
  - `CA-08/11`: login correcto devuelve solo las tiendas **operativas**; **un username inexistente, un PIN equivocado y un usuario bloqueado lanzan `AuthFailed` con el mismo mensaje y tipo** (`CA-12b`);
  - **Review Focus 2:** el mensaje de `AuthFailed` no contiene el username ni el PIN recibidos;
  - `CA-09`: por defecto el mismo rol en todas las tiendas; `changeOperatorRole` por tienda funciona al dueño del rol y lanza `Forbidden` a otro administrador (REQ-007 `CA-11`); cualquier administrador de la compañía puede `unlockUser`, `resetPin` y `deactivateUser`;
  - `CA-10/10b`: `switchStore` a una tienda operativa conserva `startedAt`; si la expiración de la nueva tienda ya pasó, termina la sesión y lanza `SessionExpired`; a una tienda desactivada lanza `STORE_UNAVAILABLE`;
  - **Review Focus 3:** con el reloj pasado de la expiración, cualquier caso de uso con `Actor` de operador lanza `SessionExpired`;
  - `CA-12`: `unlockUser` genera PIN nuevo, deja `status = "active"` y llama a `revokeSessions`; un operador recibe `Forbidden`.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar** casos de uso, puerto y dobles. Una función `assertSessionActive(deps, actor)` compartida por los casos de uso de operador.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(users): operator and session use cases`.

### Task 28: Adaptadores de operadores y sesión

**Files:**
- Create: `infrastructure/supabase/{user-repository,session-repository}.ts` (completar), `app/(auth)/entrar/actions.ts`
- Test: `tests/integration/operators.int.test.ts`

**Interfaces:**
- Consumes: Tareas 16 y 27.
- Produces: implementaciones de `UserRepository` y `SessionRepository`; acciones `enterWithPin(formData)`, `chooseStore(formData)`, `switchStore(formData)`, `logout()`.

- [ ] **Step 1: Escribir la prueba de integración** (flujo completo contra la base local)
  - crear compañía, sede, tienda, rol y operador; entrar con el PIN devuelto; elegir tienda; con esa sesión, leer productos según el rol;
  - cinco PIN incorrectos bloquean; el sexto intento con el PIN correcto sigue fallando con el mismo error genérico; `unlockUser` y el nuevo PIN permiten entrar;
  - **Review Focus 2:** buscar el PIN en `audit_log`, `auth_events` y en la salida de `console` capturada durante la prueba; no aparece;
  - cambiar de tienda no pide el PIN; con `app_sessions.ended_at` fijado, el siguiente `select` devuelve 0 filas aunque el token siga vigente.
- [ ] **Step 2: Ejecutar `pnpm test:int`** — Esperado: FAIL.
- [ ] **Step 3: Implementar.** La acción `enterWithPin` registra `app_sessions` con el `session_id` del JWT y escribe `login_ok` o `login_failed` en `auth_events` sin el PIN.
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(users): operator repositories and pin login actions`.

### Task 29: Páginas de usuarios y acceso con PIN (U-01 a U-04, A-05 a A-07)

**Files:**
- Create: `app/(auth)/entrar/page.tsx`, `app/(auth)/tienda/page.tsx`, `app/(app)/usuarios/{page,nuevo/page,[id]/page}.tsx`, `loading.tsx` por ruta, `components/auth/pin-field.tsx`, `components/users/pin-reveal-dialog.tsx`, `components/shell/store-switcher.tsx`

**Interfaces:**
- Consumes: acciones de la Tarea 28 y `<CompanySelector>`.
- Produces: `<PinField name label error? />` con un único `<input>` invisible sobre 6 casillas (DESIGN.md §6.14).

- [ ] **Step 1: Implementar** según `mockups/01` y `02`: campo de PIN de seis casillas, botón desactivado hasta tener usuario y 6 dígitos, error genérico, elección de tienda con la hora de fin de sesión, detalle de usuario con pestañas, rol por tienda, "Rol de otro administrador" y el modal del PIN que no se cierra sin copiarlo.
- [ ] **Step 2: Verificar** en el navegador: entrar con PIN, elegir y cambiar de tienda, ver el error genérico, bloqueo a los 5 intentos y desbloqueo con PIN nuevo (el PIN solo se ve una vez); el administrador B ve "Rol de otro administrador" y puede desbloquear pero no cambiar el rol; el operador no ve menús de gestión; la vista móvil coincide con la maqueta.
- [ ] **Step 3: Commit** — `feat(users): users screens and PIN access flow`.

---

## Fase 7 · Catálogo

### Task 30: Casos de uso y repositorio de catálogo

**Files:**
- Create: `core/application/ports/catalog-repository.ts`, `core/application/use-cases/catalog/{create-category,rename-category,delete-category,create-product,update-product,set-product-active,delete-product,list-products,list-categories}.ts`, `infrastructure/supabase/catalog-repository.ts`, `tests/fakes/in-memory-catalog.ts`
- Test: `tests/unit/use-cases/catalog.test.ts`, `tests/integration/catalog.int.test.ts`

**Interfaces:**
- Produces: `Category { id; companyId; name }`; `Product { id; companyId; categoryId; name; description: string | null; active: boolean }`; `CatalogRepository` con `createCategory`, `renameCategory`, `softDeleteCategory`, `countLiveProducts(categoryId: string): Promise<number>`, `createProduct`, `updateProduct`, `setActive`, `softDeleteProduct`, `listProducts(companyId: string, filter?: { onlyActive?: boolean }): Promise<Product[]>`, `listCategories(companyId: string): Promise<Category[]>`.

- [ ] **Step 1: Escribir las pruebas** (REQ-008)
  - `CA-01/02`: un administrador crea una categoría; un operador (aun con todos los permisos) recibe `Forbidden`;
  - `CA-03`: un operador con `create` crea un producto con nombre, categoría, descripción opcional y estado; sin `create`, `Forbidden`;
  - `CA-05`: categoría de otra compañía lanza `NotFound`; `CA-04`: el tipo de `categoryId` es un solo identificador (no un arreglo);
  - `CA-06/07`: editar y eliminar exigen `edit` y `delete`; eliminar es borrado lógico;
  - `CA-08/09`: sin `view` el listado lanza `Forbidden`; otra compañía no ve nada;
  - **Review Focus 4 y 5:** `"Pan"`, `" pan "` y `"PAN"` lanzan `NAME_TAKEN`; tras eliminar un producto, su nombre puede reutilizarse; `CA-12`: eliminar una categoría con productos vivos lanza `CATEGORY_HAS_PRODUCTS`;
  - `CA-10`: `onlyActive` excluye los inactivos; el listado normal los conserva;
  - integración: las mismas reglas valen contra la base de datos real.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Ejecutar `pnpm test && pnpm test:int`** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(catalog): catalog use cases and repository`.

### Task 31: Páginas de catálogo (K-01, P-01, P-02)

**Files:**
- Create: `app/(app)/catalogo/categorias/page.tsx`, `app/(app)/catalogo/productos/{page,nuevo/page,[id]/page}.tsx`, `loading.tsx`, `actions.ts`

**Interfaces:**
- Consumes: casos de la Tarea 30; menú del operador filtrado por permisos.

- [ ] **Step 1: Implementar** listas con buscador, filtro y estado vacío, y formularios con nombre, categoría única, descripción opcional y estado; error de nombre repetido; el menú del operador solo muestra lo que su rol permite.
- [ ] **Step 2: Verificar** con un administrador y un operador con `view` y `create`: el operador no ve categorías para editar, crea un producto, no puede editar ni eliminar; un producto eliminado desaparece del listado; el catálogo de otra compañía no aparece.
- [ ] **Step 3: Commit** — `feat(catalog): categories and products screens`.

---

## Fase 8 · Historial

### Task 32: Casos de uso y repositorio de historial

**Files:**
- Create: `core/application/ports/history-reader.ts`, `core/application/use-cases/history/{list-history,list-auth-events}.ts`, `infrastructure/supabase/history-reader.ts`, `tests/fakes/in-memory-history.ts`
- Test: `tests/unit/use-cases/history.test.ts`, `tests/integration/history.int.test.ts`

**Interfaces:**
- Produces: `HistoryEntry { id; module: string; entityType: string; entityId: string; action: "create" | "update" | "deactivate" | "reactivate" | "delete"; actorId: string; storeId: string | null; channel: Channel; before: unknown; after: unknown; createdAt: Date }`; `HistoryReader { list(i: { companyId: string; module?: string; actorId?: string; from?: Date; to?: Date; cursor?: string }): Promise<{ items: HistoryEntry[]; nextCursor: string | null }>; listAuthEvents(i: { companyId: string; cursor?: string }): Promise<{ items: AuthEventEntry[]; nextCursor: string | null }> }`; casos `makeListHistory`, `makeListAuthEvents`.

- [ ] **Step 1: Escribir las pruebas** (REQ-009)
  - `CA-04/05`: un operador sin `view` de `products` recibe `Forbidden` al pedir ese módulo; con `view` solo recibe filas de `products`;
  - `CA-09`: los filtros por módulo, usuario y fechas se pasan al lector;
  - `CA-07`: `makeListAuthEvents` lanza `Forbidden` al operador; un administrador de otra compañía no ve eventos ajenos;
  - **Review Focus 2:** las entradas devueltas nunca contienen claves `pin`, `password` ni `credential`;
  - integración: crear y editar un producto como operador deja dos entradas visibles para el administrador con el valor anterior y el nuevo.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Ejecutar `pnpm test && pnpm test:int`** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(history): history use cases and reader`.

### Task 33: Páginas de historial (H-01, H-02)

**Files:**
- Create: `app/(app)/historial/{page,[modulo]/page,accesos/page}.tsx`, `loading.tsx`, `components/history/{history-table,change-detail}.tsx`

- [ ] **Step 1: Implementar** tabla con fecha, quién, acción, módulo y canal; detalle con el valor anterior y el nuevo; filtros por módulo, usuario y fechas; pestaña "Accesos" visible solo para administradores.
- [ ] **Step 2: Verificar** — las acciones hechas en fases anteriores aparecen; un operador solo ve el módulo permitido y no ve "Accesos"; no aparece ningún PIN ni contraseña.
- [ ] **Step 3: Commit** — `feat(history): history and access events screens`.

---

## Fase 9 · API REST

### Task 34: Fundamentos de la API

**Files:**
- Create: `app/api/v1/_lib/{with-actor,problem,openapi}.ts`, `app/api/v1/openapi.json/route.ts`
- Test: `tests/unit/api/with-actor.test.ts`, `tests/unit/api/problem.test.ts`

**Interfaces:**
- Produces: `withActor(handler: (req: Request, actor: Actor, ctx: unknown) => Promise<Response>): (req: Request, ctx: unknown) => Promise<Response>` (valida `Authorization: Bearer`, resuelve el `Actor` con `channel: "api"`); `toProblem(error: unknown): Response` (`application/problem+json`: `Forbidden` 403, `NotFound` 404, `RuleViolation` 422 con `code`, `AuthFailed` y `SessionExpired` 401); `buildOpenApiDocument(): object`.

- [ ] **Step 1: Escribir las pruebas**
  - sin cabecera `Authorization` → 401; token inválido → 401;
  - cada tipo de error se traduce al estado y al `code` indicados, y el cuerpo nunca incluye la traza ni datos de entrada;
  - `buildOpenApiDocument()` devuelve `openapi: "3.1.0"` y la ruta `/api/v1/companies`.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar.** Antes, leer `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`. Generar los esquemas desde los de zod de cada endpoint (verificar con Context7 la función de zod que produce JSON Schema).
- [ ] **Step 4: Ejecutar** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(api): actor resolution, problem responses and openapi base`.

### Task 35: Endpoints

**Files:**
- Create: `app/api/v1/{admins,companies,sites,stores,users,roles,categories,products,history,auth-events}/**/route.ts` según `docs/technical/MODULO-1-DISENO-TECNICO.md` §9, `app/api/v1/_lib/schemas.ts`
- Test: `tests/unit/api/endpoints.test.ts`

**Interfaces:**
- Consumes: `withActor`, `toProblem`, `getContainer()` y los casos de uso; cada handler solo valida la entrada con zod y llama a un caso de uso.

- [ ] **Step 1: Escribir las pruebas** invocando los handlers con un contenedor falso (`setContainerForTests`)
  - por cada recurso: sin token 401, un rol sin permiso 403, y el caso feliz devuelve el estado esperado (201 al crear, 200 al leer);
  - los endpoints de acción (`:deactivate`, `:reactivate`, `:reset-pin`, `:unlock`) exigen los mismos actores que el caso de uso;
  - la respuesta de `:reset-pin` incluye el PIN una sola vez con `Cache-Control: no-store`;
  - el documento OpenAPI incluye todas las rutas probadas.
- [ ] **Step 2: Ejecutar** — Esperado: FAIL.
- [ ] **Step 3: Implementar** los route handlers; paginación por cursor en las listas.
- [ ] **Step 4: Ejecutar `pnpm test && pnpm typecheck && pnpm build`** — Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(api): module 1 endpoints and openapi document`.

---

## Fase 10 · Cierre

### Task 36: Trazabilidad y verificación final

**Files:**
- Create: `docs/technical/MODULO-1-TRAZABILIDAD.md`
- Modify: `CLAUDE.md` (comandos nuevos: `pnpm test`, `test:int`, `test:db`, `typecheck`, `supabase start`; estructura de `core/`, `infrastructure/`, `supabase/`), `docs/README.md` (enlace al plan y a la trazabilidad), `docs/requirements/REQ-005` a `REQ-009` (sección "Notas para el manual" con los pasos de uso, D-04)

**Interfaces:**
- Produces: tabla con cada criterio de aceptación de REQ-005 a REQ-009 y el archivo y el nombre de la prueba que lo cubre (o "manual: <pantalla>" si solo se verifica en el navegador).

- [ ] **Step 1: Construir la tabla** recorriendo cada CA de los cinco REQ; todo criterio sin prueba se anota y se añade la prueba que falta antes de seguir.
- [ ] **Step 2: Ejecutar la verificación completa** — `pnpm lint && pnpm typecheck && pnpm test && pnpm test:int && pnpm build`, más todas las pruebas SQL con `execute_sql`. Esperado: todo PASS, sin avisos nuevos.
- [ ] **Step 3: Revisar el proyecto `argos`**: comprobar con `list_migrations` que todas las migraciones están aplicadas y con `get_advisors` (seguridad y rendimiento) que no hay avisos nuevos; confirmar con el usuario que los hooks y MFA están activos en el panel.
- [ ] **Step 4: Completar** las "Notas para el manual" de cada REQ (D-04, punto 5).
- [ ] **Step 5: Commit** — `docs: module 1 traceability matrix, manual notes and commands`.

---

## Autorrevisión

**Cobertura de la especificación**
- REQ-005: tareas 6 a 8 (BD), 22 a 24; REQ-006: tareas 10, 13 a 21, 27 a 29; REQ-007: tareas 9, 25, 26; REQ-008: tareas 11, 30, 31; REQ-009: tareas 12, 32, 33.
- Diseño técnico: §2 (tareas 14, 18), §3 (6 a 12), §4 (13 a 17), §5 (10, 27), §6 (7 a 11), §7 (12), §8 (19 a 33), §9 (34, 35), §11 (cada tarea trae sus pruebas), §12 (tarea 1 y 36), §13 (las fases 0 a 9 siguen su orden).
- ADR-011 (flujo OAuth de la aplicación) y ADR-012 (MCP) **no están en este plan**: son un plan aparte, junto con REQ-001 a REQ-003. La API REST de la Tarea 35 deja listo el punto de entrada.

**Decisiones que toma este plan** (no estaban en la especificación): regla de caracteres del `nombre` de usuario `^[a-z0-9_-]{2,24}$`; los hijos vivos cuentan como "datos" al eliminar una compañía o sede; las violaciones de reglas devuelven HTTP 422; el correo sintético de operadores termina en `.invalid` salvo que la Tarea 2 diga otra cosa; Vitest como ejecutor de pruebas.

**Riesgos que el plan reconoce:** el desarrollo corre contra el proyecto cloud real (sin Docker); la disponibilidad del Password Verification Hook y de los límites de sesión en el plan de `argos` se verifica en la Tarea 2 antes de construir sobre ellos.
