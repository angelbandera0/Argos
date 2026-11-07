# T18 · Esquema de solicitudes

Migración `*_replenishment_requests.sql`: tablas `solicitudes`, `solicitud_lineas` (qty, unidad, qty_base), `solicitud_asignaciones` (fulfilled/to_buy/pending/rejected, motivo obligatorio al rechazar, decided_by/at; trigger `ASSIGNMENT_EXCEEDS_LINE` impide pasar de la cantidad de la línea, M2-D12).
Vistas (security_invoker): `solicitud_linea_estado`, `solicitud_estado` (estado derivado: new, in_progress, to_buy, pending, rejected, fulfilled), `bolsa_por_comprar` (por compañía, producto y tienda).
RLS solo select, vía `app.can_see_request`: admin de compañía, `handle_requests` con almacén, o módulo `requests` view de la tienda activa. Sin grants de escritura.
RPC: `create_request(store, lines jsonb, note)` (permiso `request_replenishment` en la tienda; notifica `requests/created` a quien atiende). `delete_test_company` actualizada.
Para T20: RPC de atender línea (trasladar con `register_transfer` pasando doc_type/doc_id = asignación, por comprar, pendiente, rechazar), notificación `handled`/`rejected`, y auditoría (`audit_row`) de estas tablas.
pgTAP: 023 (18/18); `pnpm test:db` completo en verde.
