# L8 ajuste de costo de lote (parte 1: docs + BD)
- Hecho: S-15c, CA-10/11 (03), ADR-018, migración `lot_cost_adjustments` + `adjust_lot_cost` (errores: FORBIDDEN, LOT_NOT_FOUND, INVALID_COST, REASON_TEXT_REQUIRED, CURRENCY_REQUIRED), audit_row y delete_test_company parcheados vía pg_get_functiondef, pgTAP 034 (14).
- Notas: lote sin divisa (costo desconocido) no se puede corregir (CURRENCY_REQUIRED). `strip_cost_keys` ya oculta old_/new_unit_cost (sufijo unit_cost). Inmutabilidad se logra por falta de grants más trigger.
- Pendiente: (2) TS+API, (3) UI.
