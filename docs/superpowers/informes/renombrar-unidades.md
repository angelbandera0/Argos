# Renombrar compañías, sedes y tiendas (REQ-005 CA-15)

- Dominio: `rename-unit.ts` (operador Forbidden, admin sin acceso Forbidden, superadmin permitido; nombre recortado 1-80; NAME_TAKEN entre hermanas sin distinguir mayúsculas; el código no se toca). `rename` añadido a los puertos/repositorios de compañía, sede y tienda; `org.renameUnit` en org-factory.
- BD: sin migración. RLS `*_update` ya permite al admin con acceso y al superadmin; el trigger `audit_row` ya registra `before.name`/`after.name`; sedes y tiendas tienen índice único `lower(trim(name))`. Las compañías no tienen índice único: la unicidad (mismo fundador) se comprueba solo en el caso de uso. No se aplicó nada a la base cloud; no se ejecutó test:db/test:int.
- UI: campo «Nombre» en `company-settings-dialog.tsx`; «Renombrar sede/tienda» en `unit-menu.tsx` (FormDialog, toast, deshabilitado con razón); acción `renameUnitAction`; `revalidatePath("/companias","layout")` refresca tarjeta, selector y miga.
- Limitación: el diálogo de compañía solo se muestra a administradores (el tope de sesión sigue prohibido al superadmin), así que el superadmin renombra sedes/tiendas pero no la compañía desde el diálogo.
- Pruebas: 6 casos unit nuevos; `pnpm verify:fast` OK (45 archivos, 411 casos).
