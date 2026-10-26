# Patrones de UI

Patrones ya implementados. Usa SIEMPRE los componentes de la librería Argos UI (`components/ui/`, galería en `/ui` solo en desarrollo) en lugar de marcado propio; el código manda ante cualquier duda. Tokens solo de `docs/design/tokens.css`; guía en `DESIGN-resumen.md` y `DESIGN.md`.

## Servidor

1. **Página con datos.** Página síncrona con `PageHeader` y `<Suspense fallback={<Loading />}>` con un hijo `async` que lee sesión y datos. `loading.tsx` exporta el skeleton (`Card aria-busy` + `Skeleton`) y la página lo importa. Rutas con sesión: `export const instant = false`; `params` y `searchParams` son Promises. `createServerClient()` ya hace `await connection()`; nada por usuario usa `use cache`. Ejemplo: `app/(app)/companias/page.tsx`, `loading.tsx`.
2. **Guard y casos de uso.** `requireOrgUser()` (`app/(app)/companias/guard.ts`) devuelve `{ supabase, actor, org }` o `notFound()`; roles y usuarios tienen guards análogos. Casos de uso por petición con la fábrica (`makeOrg`, `makeRoles`, `makeCatalog` en `infrastructure/supabase/`), RLS aplica.
3. **Server actions.** `"use server"`, firma `(_: State, formData: FormData): Promise<State>`, `State` con `error?`. Orden: guard, validar, caso de uso en `try`, `catch` devuelve `{ error: fail(e, mensaje) }`; éxito `revalidatePath` + `redirect` o `{}`. Ejemplo: `app/(app)/roles/actions.ts`.
4. **Fechas.** Reloj de la barra en el navegador (`components/shell/top-clock.tsx`). El resto usa `Intl.DateTimeFormat("es")` sin `timeZone` (zona del servidor): deuda en `docs/superpowers/revisiones-pendientes.md`.

## Componentes por patrón

| Patrón | Componentes | Ejemplo migrado |
|---|---|---|
| Cabecera de página | `PageHeader` (título, descripción, `Breadcrumbs`, acciones) | `app/(app)/roles/[id]/page.tsx` |
| Lista con buscador y filtros | `ListToolbar` (`q` + `Select` de filtro + acción primaria) | `app/(app)/usuarios/page.tsx` |
| Tabla de datos | `DataTable` desde un componente cliente (`cell` son funciones), `rowActions`, `Badge` de estado | `components/users/user-table.tsx`, `app/(app)/companias/company-table.tsx` |
| Sin datos / sin coincidencias | `EmptyState` (icono por nombre, frase, CTA solo si puede crear); sin coincidencias: texto atenuado | `app/(app)/catalogo/productos/page.tsx` |
| Alta y edición | `FormShell` + `Field` con `Input`, `Textarea`, `Select`, `Multiselect`, `Switch`, `Checkbox`, `RadioGroup` | `components/roles/role-form.tsx`, `components/users/new-user-form.tsx` |
| Secciones de una página | `Tabs` underline (o `Accordion` variant cards en formularios largos) | `app/(app)/usuarios/[id]/page.tsx` |
| Árbol / lista expandible | `Accordion` variant rich (icono, `summary`, `badge`, `action`) | `app/(app)/companias/[id]/page.tsx` |
| Proceso de varios pasos | `Steps` | `app/(auth)/primer-ingreso/page.tsx` |
| Vista alternativa o periodo | `Tabs` variant segmented (máx. 4) con tabla alternativa accesible | `components/dashboard/analytics-card.tsx` |
| Aviso en página | `Alert` (success/warning/danger/info), `Banner` (franja global, uno a la vez) | `app/(app)/companias/[id]/page.tsx` |
| Confirmación de resultado | `useToast()` (`ToastProvider` ya montado) | `components/users/assignments-form.tsx` |
| Confirmación destructiva | `AlertDialog` (foco inicial en Cancelar) | `components/roles/delete-role-dialog.tsx` |
| Modal con formulario | `Dialog` (`size`, `footer`) | `components/org/deactivate-dialog.tsx` |
| Formulario corto en diálogo [decisión del usuario] | `FormDialog` (`Dialog` + `FormShell`, `(prev, formData)`, errores dentro, cierra y avisa con toast si hay éxito, foco al disparador). Se monta solo mientras está abierto (`{open && <FormDialog …/>}`). Alta y edición de compañía, ajustes de compañía y categorías ya no tienen página | `components/org/new-company-dialog.tsx`, `components/org/company-settings-dialog.tsx`, `components/catalog/category-dialog.tsx` |
| Secreto de una sola vez | `Dialog dismissible={false}`; cierre solo tras copiar | `components/users/pin-reveal-dialog.tsx` |
| Estado e insignias | `Badge`, `Chip`, `Tooltip` | `app/(app)/superadmin/administradores/admin-table.tsx` |
| Carga | `Skeleton`, `Spinner`, `RouteProgress`; `Button loading` | `app/(app)/roles/loading.tsx` |
| Selector de compañía activa [decisión del usuario] | `CompanySelector` en el panel lateral (`AppShell company={…}`), avatar determinista por código (`company-avatar.ts`) | `components/org/company-selector.tsx` |
| Shell y menú | `SidebarSection`, `SidebarItem`, `SidebarSubmenu`; `ProfileMenu` | `components/shell/app-shell.tsx` |

## Reglas transversales

- Errores de formulario: `FormShell` los muestra con `role="alert"`; por campo, `Field error`. Estado guardando: `FormShell`/`Button loading` (no reimplementes `useFormStatus`).
- Acción deshabilitada por falta de permiso: botón `disabled` con la razón visible y enlazada con `aria-describedby` (ejemplo `unit-menu.tsx`, `deactivate-dialog.tsx`); acciones solo de administrador se ocultan por `actor.kind`.
- Opción de `Select` con valor vacío («Todos»): usar `value=""` explícito (`app/(app)/usuarios/page.tsx`).
- Iconos del shell: pasa el NOMBRE (`"Building2"`), nunca un componente de servidor a cliente; icono nuevo: añádelo a `NAV_ICONS` (`components/icons.ts`).
- Ancho de formularios de página [decisión del usuario]: lo fija solo `FormShell` (`.form-shell`, `width: 100%`, `max-width: var(--size-form)` = 480; 100% en móvil). Las páginas ponen `FormShell` por fuera y las `Card` dentro; nunca `Card` por fuera ni anchos propios (causa del bug: `new-user-form` envolvía `FormShell` en una `Card` de ancho completo).
- Mostrar una vez, sin cierre accidental: Escape y clic fuera no cierran (`dismissible={false}`).
- Comprobaciones previas que sustituyen al formulario por una tarjeta con enlace: `app/(app)/usuarios/nuevo/page.tsx`.
- Cada componente nuevo de `components/ui/` se añade a la galería (`app/ui/sections/`) y se documenta en `DESIGN-resumen.md`.
- Pantalla nueva sin verificar a mano: anótalo en el informe y pide `/verificar-ui N`.
- Menús de Base UI: las etiquetas de grupo (`Menu.GroupLabel`) van dentro de `Menu.Group` o `Menu.RadioGroup`; fuera lanzan «MenuGroupContext is missing». Ejemplo: `components/org/company-selector.tsx`.
