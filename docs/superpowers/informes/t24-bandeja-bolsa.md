# T24 · Bandeja y bolsa por comprar (UI)

- `/solicitudes/bandeja`: solicitudes de todas las tiendas (20 más recientes) con filtros por URL (`estado`, `tienda`, `InboxFilters`); por línea muestra pidió / falta decidir / existencia del almacén y botón «Atender» (`AttendButton`, FormDialog): trasladar (total o parte, tope = min(falta, almacén)), por comprar, pendiente, rechazar (motivo obligatorio). Cantidad en unidad base. `attendLineAction` en `solicitudes/actions.ts`.
- `/solicitudes/bolsa`: asignaciones por comprar agrupadas por producto con desglose por tienda. Enlaces «Bandeja» y «Bolsa por comprar» en `/solicitudes` solo con `handle_requests` (admin siempre); los casos de uso devuelven Forbidden al resto (ViewState).
- Lógica pura en `components/requests/inbox-logic.ts` + `tests/unit/inbox-logic.test.ts`. Sin costos.
- `verify:fast` OK (763 casos). Sin hacer: selector de lotes en el traslado (usa FIFO del RPC), «Pasar a por comprar» en lote, paginador, verificación visual, ítems propios de menú.
