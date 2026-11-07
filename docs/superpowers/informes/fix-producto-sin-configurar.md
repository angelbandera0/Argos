# Fix · Productos sin configurar pueden recibir su primera entrada

- Causa: L6 filtra a `storable = true` y ninguna pantalla lo activaba.
- Entrada inicial/directa: `entryProductOptions` (entry-logic.ts) lista almacenables primero y, con `configure_units`, los activos sin configurar con la marca «Sin configurar para almacén» (el Select no tiene grupos: se usa el hint de opción). Al elegirlos, aviso + selector de unidad base (por defecto lb); `registerEntryAction` llama a `saveProductStockConfig` (storable=true) solo si el producto aún no es almacenable y luego registra; si falla, no se registra nada.
- Configuración (T15c): Switch «Se almacena en almacén» (solo `configure_units`); deshabilitado con texto si hay historial.
- BD: migración `20261107235656_storable_lock` (trigger `STORABLE_LOCKED` al desactivar con lotes o movimientos), código añadido a dominio/API/mensajes, pgTAP 035 (4). Aplicada con `pnpm db:apply`.
- `pnpm test:db` OK; `pnpm verify:fast` OK (99 archivos, 806 casos). Sin navegador.
