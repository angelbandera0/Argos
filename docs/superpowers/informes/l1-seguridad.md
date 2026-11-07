# L1 seguridad

- 1 HECHO: causa raíz del 403 REST de operadores: `makeApiServices` creaba el cliente solo con cabecera Authorization; `store-access-reader` llama `client.auth.getClaims()` sin sesión, devolvía `[]` y `requireOperatorStore` lanzaba Forbidden. Arreglo en `infrastructure/supabase/api-services.ts` (getClaims por defecto con el token). Prueba REST en `tests/integration/replenishment.int.test.ts` (comprador ve su unitCost, sin shortageValue; no comprador 404; solicitudes y stock por REST; sin costos de lote). Se corrigió también la aserción obsoleta (el comprador ve sus costos desde order_buyer_costs).
- 2 HECHO: pgTAP 028 (5 aserciones, ok). No hay fixture de lote para lot_costs: solo comprueba 0 filas.
- 3 y 4 PENDIENTES (límite de llamadas): ocultado en origen de costos en audit_log y revoke de grants excesivos de M1.
- No se ejecutó test:int completo ni test:db completo ni verify:fast.
