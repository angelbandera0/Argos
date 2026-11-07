# L7 · Unidad base bloqueada con historial

- DB: migración `20261107232005_base_unit_lock` (`app.product_has_history`: cualquier lote o movimiento, aunque esté en 0; el trigger existente ahora lanza `BASE_UNIT_LOCKED`, antes `BASE_UNIT_IN_USE`). pgTAP 033 (6) + 016 ajustado.
- Caso de uso: se reutiliza `saveProductStockConfig` (permiso `configure_units`, error mapeado); `getProductStockConfig` devuelve `baseUnitLocked`. Código renombrado en dominio, API (409) y OpenAPI.
- UI (pestaña Configuración): selector de unidad base solo con `configure_units`, deshabilitado con historial y con el texto explicativo. Solo ofrece unidades de la misma familia (cambiar de familia queda bloqueado por diseño: reinterpretaría presentaciones y mínimos). Presentaciones y mínimos no se reescriben.
- Limitación: `baseUnitLocked` se calcula con RLS del usuario; la BD sigue siendo la barrera real.
- `pnpm test:db` OK; `pnpm verify:fast` OK (98 archivos, 795 casos).
