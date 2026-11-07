# T15b · Detalle de producto (/existencias/[productId])

- Ruta `app/(app)/existencias/[productId]/` (page con Suspense, loading, error con «Reintentar»); reutiliza `requireStockUser`. Lógica en `components/stock/product-detail-logic.ts` (pruebas `tests/unit/product-detail-logic.test.ts`), UI en `components/stock/product-detail.tsx`.
- Pestañas Lotes y Movimientos (Tabs controlado por URL `pestana`). Lotes: todos, incluidos agotados (`onlyAvailable: false`); costo solo con `costs` (undefined oculto, null «Sin costo conocido»). Movimientos: filtros URL `tipo`, `desde`, `hasta`, `pagina` (10 por página); costos solo con permiso.
- Aislamiento por ubicación y costos los aplican `getProductStock` / `listMovements`. Acciones de cabecera deshabilitadas «Próximamente» (solo almacén y con permiso). El enlace desde la lista ya existía (T15a).
- Sin casos de uso nuevos: el nombre sale de `catalog.listProducts`. Sin hacer: pestañas Configuración/Historial de la maqueta; tarjetas de resumen; lote mostrado por prefijo del id (no hay código); verificación visual.
