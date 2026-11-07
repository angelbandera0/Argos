# T23 · Solicitudes de tienda (UI)

- Rutas `app/(app)/solicitudes/`: lista «Solicitudes» (tarjetas con estado derivado), `nueva` (formulario: productos con «Hay · mín.», cantidad con unidad vía QuantityPicker, nota; `?reponer=1` precarga bajos/agotados con la cantidad faltante; admin elige tienda con `?tienda=`), `[id]` (líneas con estado/atendido/motivo de rechazo). Sin costos.
- `components/requests/` (form + `request-logic.ts` con zod, mensajes, badges, prueba unitaria), acción `createRequestAction`, guard sobre `requireStockUser` + `makeRequests`.
- `/existencias` (tienda): botón «Solicitar reposición de los agotados» (con `request_replenishment`). Menú: «Solicitudes» disponible (visible con `requests.view`, test ajustado).
- `verify:fast` OK (759 casos). Sin hacer: paginador en la lista (50 más recientes), verificación visual (`/verificar-ui 23`); la unidad `base` se guarda literal y se muestra con la unidad base consultada por producto.
