# Argos UI · Fase 4: migración de las pantallas a la librería

Objetivo: que todas las pantallas usen los componentes de `components/ui/` (fases 0-3) en lugar de marcado y clases propias repetidas. Sin cambios funcionales: mismos campos (`name`), mismas server actions, mismas reglas de permisos y mismos textos. Es un cambio de presentación y de accesibilidad.

## Reglas comunes (todos los bloques)

- Solo tokens de `docs/design/tokens.css`, sin hex ni px sueltos; texto en español; escala reducida y densidad actual.
- Lee `docs/design/PATRONES-UI.md` y `DESIGN-resumen.md` primero; la galería `/ui` (`app/ui/**`) es la referencia de uso de cada componente.
- Conserva el contrato de cada formulario: nombres de campos y valores en `FormData`, firma `(prev, formData)` de las actions con `useActionState`, `fail()` y mensajes de error. Select y Multiselect envían su valor por `name`; comprueba el mapeo con una prueba unitaria cuando haya lógica.
- Páginas: `PageHeader` (título, descripción, acciones, breadcrumbs), `ListToolbar` (buscador y filtros; sigue filtrando en servidor con `searchParams`), `DataTable` para listas con columnas, `EmptyState` para estados vacíos, `FormShell` para altas y ediciones, `Alert` para errores y avisos en línea, `useToast` para confirmaciones de éxito tras una acción (sin quitar `revalidatePath`/`redirect`), `Badge`/`Chip` para estados, `Tabs`/`Accordion` donde la maqueta los pida, `AlertDialog` para confirmaciones destructivas y `Dialog` para el resto.
- Server Components por defecto; solo lo interactivo es de cliente. Con `cacheComponents`, lo que lee cookies o sesión sigue dentro de `<Suspense>` y cada ruta mantiene su `loading.tsx` (usa `Skeleton`; la forma debe seguir al componente nuevo, p. ej. tabla).
- Iconos por NOMBRE (`components/icons.ts`), nunca funciones de servidor a cliente. Claves de React únicas.
- No rompas los diálogos con seguridad: el modal del PIN y de la contraseña temporal no se cierran hasta copiar (`dismissible={false}`), el foco vuelve al disparador.
- Elimina del repo lo que quede muerto tras migrar (clases CSS y componentes antiguos sin uso, comprobado con `grep`), sin tocar nada que otro bloque aún use.
- Sin Chrome. Verificación: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, y `pnpm test:int` si cambia lógica de servidor. Un commit por bloque.

## Bloques

- **4a · Shell y acceso:** `AppShell` (barra superior, `ProfileMenu` sobre `@base-ui/react/menu` con la cabecera y «Cerrar sesión»; `StoreSwitcher` con `Select` o `Menu`), páginas de acceso (`/login`, `/login/2fa`, `/primer-ingreso`, `/recuperar`, `/entrar`, `/tienda`) con `Field`/`Input`/`Button`/`Alert`/`Steps` donde proceda, y `/perfil`.
- **4b · Organización:** `/companias` (lista), `/companias/nueva`, `/companias/[id]` (árbol de sedes y tiendas con `Accordion`, `Badge` de estado, acciones con menú), `/companias/[id]/administradores`, `/companias/[id]/ajustes`; `DeactivateDialog` (con `Select` del motivo), `CompanySelector`.
- **4c · Roles y usuarios:** `/roles`, `/roles/nuevo`, `/roles/[id]` (`RoleForm`, `PermissionMatrix` con `Checkbox`/`Switch`), `DeleteRoleDialog`; `/usuarios`, `/usuarios/nuevo`, `/usuarios/[id]` (`Tabs`, `AssignmentsForm` con `Select`), `PinRevealDialog`.
- **4d · Catálogo, superadmin e inicio:** `/catalogo/categorias` (alta y edición en fila), `/catalogo/productos` (lista con filtros), nuevo y detalle (`ProductForm`), `DeleteProductDialog`; `/superadmin/administradores` y su alta (contraseña temporal en el modal); dashboard de inicio (`Tabs`, `Accordion`, `Badge`, `Chip`, `EmptyState`).
- **4e · Cierre:** limpieza global (CSS y componentes antiguos sin uso), actualizar `PATRONES-UI.md` con los componentes en lugar de código copiado, `DESIGN-resumen.md`, el agente `argos-dev` y `/tarea`, y la lista de pendientes visuales para el usuario.
