# /catalogo/categorias rediseñado (§6.41)

- Lista con edición en línea: franja de alta rápida, tarjeta «n categorías» + buscador, filas de 64 (renombrar en línea, eliminar con confirmación en la fila `role="alertdialog"`, papelera desactivada con `title` si hay productos), lateral 340 (CÓMO FUNCIONAN + `StatTile` Categorías/Productos; debajo en <1024).
- Datos reales sin migraciones: productos por categoría desde `listProducts`; enlace `/catalogo/productos?categoria=id` (el filtro existe). Server actions y permisos (`requireCategoryAdmin`) intactos.
- `nameKey` ahora ignora también tildes (spec §6.41); afecta a unicidad de productos y categorías.
- Borrados `category-dialog.tsx`, `category-row.tsx` antiguo; nuevos `category-manager.tsx`, `category-row.tsx`, `category-list-logic.ts`, `app/ui-category-list.css` (importado en globals.css). Iconos `Tag`, `Pencil` en `icons.ts`. Docs actualizadas (K-01, PATRONES-UI).
- Sin componente nuevo en `components/ui/` (todo específico de catálogo; sin galería). Reiniciar `pnpm dev` por el CSS nuevo. Sin verificar en navegador: pedir `/verificar-ui`.
