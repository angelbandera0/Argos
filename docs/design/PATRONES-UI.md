# Patrones de UI

Patrones de UI ya implementados; ante cualquier duda, el código y DESIGN.md mandan.

Antes de maquetar, lee `docs/design/DESIGN.md` y usa solo tokens de `docs/design/tokens.css`.

## 1. Página con datos

- La página exportada es síncrona: cabecera (`.topbar`, `h1.page-title`) y `<Suspense fallback={<Loading />}>` con un hijo `async` que lee sesión y datos. Ejemplo: `app/(app)/companias/page.tsx`.
- `loading.tsx` de la ruta exporta un skeleton (`Card aria-busy` + `Skeleton onPanel`) y la página lo importa como fallback. Ejemplo: `app/(app)/companias/loading.tsx`.
- Rutas que leen sesión: `export const instant = false`. `params` y `searchParams` son Promises: `await` antes de usarlos.
- Cache Components: `createServerClient()` ya hace `await connection()`; todo lo que lea cookies o sesión va dentro de Suspense; nada por usuario usa `use cache`.

## 2. Guard y casos de uso por petición

- `requireOrgUser()` en `app/(app)/companias/guard.ts` devuelve `{ supabase, actor, org }` o llama a `notFound()` (no admin, operador, sin aal2 o con contraseña pendiente de cambio). Roles y usuarios tienen guards con la misma forma (`requireRoleUser`, `requireUserAdmin`).
- Los casos de uso se construyen dentro de cada función, con el cliente de la petición (RLS aplica): `makeOrg` (`infrastructure/supabase/org-factory.ts`), `makeRoles` (`roles-factory.ts`), `makeCatalog` (`catalog-factory.ts`).

## 3. Server actions

- `actions.ts` con `"use server"`. Se usa desde el formulario cliente con `useActionState` (ejemplo: `app/(app)/companias/nueva/new-company-form.tsx`). Firma `(_: State, formData: FormData): Promise<State>`; `State` lleva `error?` y, si hace falta, el valor escrito para repoblar. Ejemplo: `createCompanyAction` en `app/(app)/companias/actions.ts`.
- Orden: `await requireXUser()`, validar, caso de uso dentro de `try`, en `catch` devolver `{ error: fail(e, mensaje) }`. Éxito: `revalidatePath` y `redirect`, o `{}`.
- `fail()` traduce `Forbidden`, `NotFound` y `RuleViolation` (por `e.code`) a español; el mensaje propio de una regla se pasa como segundo argumento. Ejemplo: `app/(app)/roles/actions.ts`.

## 4. Lista con buscador, filtro y estado vacío

- Buscador: `<form role="search">` con `<input name="q" type="search">`; el filtro se hace en servidor sobre `searchParams.q` (trim y minúsculas). Ejemplo: `app/(app)/companias/page.tsx`.
- Filtro por estado: `<select name="estado">` generado desde un mapa `STATUS`, botón "Filtrar". Ejemplo: `app/(app)/usuarios/page.tsx`.
- Dos estados vacíos distintos: sin datos (`Card.empty` con icono, texto y CTA solo si el actor puede crear) y sin coincidencias (`p.muted`).

## 5. Formularios de alta y edición

- Campos con `Field` (`components/ui/field.tsx`): `label`, `htmlFor`, `hint`, `error` (aparece con `role="alert"`). Para texto simple, `Input`.
- Estado guardando: `Button` con `loading` (spinner, `aria-busy`, deshabilitado). Con `useFormStatus` como `Submit` en `components/org/deactivate-dialog.tsx`.
- Error general: `p.form-error role="alert"` con icono `AlertCircle`.
- Comprobaciones previas que sustituyen al formulario por una tarjeta con enlace: `app/(app)/usuarios/nuevo/page.tsx` (sin roles, sin tiendas activas).

## 6. Modales

- Base: `components/ui/dialog.tsx` (`<dialog>` con `showModal`). Al desmontarse devuelve el foco al elemento que tenía activo al abrir. `dismissible={false}` bloquea Escape.
- Confirmación con motivo: `components/org/deactivate-dialog.tsx`. Se monta solo al abrir; confirmar se habilita con `ready`; cierra solo si la acción no devuelve error; el error va en `role="alert"`.
- Mostrar una sola vez: `components/users/pin-reveal-dialog.tsx`. `dismissible={false}`; "Ya lo copié" está deshabilitado hasta copiar y solo entonces llama `onDone`. Si el portapapeles falla, el valor queda seleccionable.

## 7. Menú del shell

- Items en `app/(app)/layout.tsx` como `NavItem` con `icon` en texto (`"Building2"`); `NavLink` (cliente) resuelve `NAV_ICONS[icon]` de `components/icons.ts`. Icono nuevo: añádelo a `NAV_ICONS`.
- Nunca pases un componente de icono de servidor a cliente; pasa el nombre.

## 8. Acciones deshabilitadas con razón visible

- Sin permiso: botón `disabled`, razón en `p.hint` con id, enlazada con `aria-describedby`. Ejemplo: `disabledReason` en `components/org/deactivate-dialog.tsx` y su cálculo en `app/(app)/companias/[id]/page.tsx` (líneas 370-377).
- Acciones solo de administrador: se ocultan con condicional por `actor.kind` (`{canCreate && <NewUnit ... />}`).

## 9. Fechas (deuda conocida)

- Hoy se formatean con `Intl.DateTimeFormat("es", ...)` sin `timeZone`, así que usan la zona del servidor. Ejemplo: `app/(app)/companias/[id]/page.tsx` (línea 390). Deuda registrada en `docs/superpowers/revisiones-pendientes.md`; no copies el patrón sin revisarla.

## 10. Verificación visual

- Una pantalla nueva no se da por buena sin revisión visual: pídela con `/verificar-ui N` (N = número de tarea). Si queda pendiente, anótalo en el informe de la tarea.
