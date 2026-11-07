# T15c · Pestaña Configuración (/existencias/[productId])

- Tercera pestaña `configuracion` (URL `pestana`). Unidad base (solo lectura), presentaciones y unidades de movimiento (añadir/editar/activar/eliminar, FormDialog + AlertDialog), mínimos por ubicación (DataTable + diálogo).
- Server actions en `app/(app)/existencias/[productId]/actions.ts` con validación zod (`components/stock/product-config-logic.ts`, pruebas `tests/unit/product-config-logic.test.ts`). Los casos de uso aplican permisos; la UI oculta acciones sin `configure_units` / `configure_minimums`. Mínimo 0 o vacío llama a `clearMinimum` y se muestra «Sin mínimo». No hay costos en esta pestaña.
- Sin hacer: cambiar la unidad base, vista previa de conversiones, «Editar todos los mínimos»; mínimos por ubicación leen `getProductStock` por ubicación (N llamadas); verificación visual.
- `pnpm verify:fast` OK (85 archivos, 701 casos).
