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
