# Carga durante peticiones

Argos UI: `Spinner` 14px/2px (borde superior transparente, 0.8s) y `status` 24px/3px; `ProgressBar`, `LoadingStatus`, `SkeletonRows` (nuevos, galería `/ui` sección ProgressBar, DESIGN-resumen, PATRONES-UI); `Button loadingLabel` apila etiqueta normal y de carga (ancho estable, aria-busy, disabled). Tokens/CSS en `docs/design/tokens.css`. Pruebas: `tests/unit/ui-progress-bar.test.ts`.

Regla: botón en carga en toda acción de servidor; ProgressBar solo con progreso medible; LoadingStatus para regiones; SkeletonRows/ViewState loading para listas.

Aplicado (loading + loadingLabel):
- Base: `FormSubmit`/`FormShell` (ancho estable), `FormDialog` (submitLabel/pendingLabel; no cierra ni cancela mientras pending), `AlertDialog` (loadingLabel; ya bloqueaba cierre), `DecisionsBar` («Aplicando…»).
- Stock: entry («Registrando…»), transfer («Trasladando…»), cost-adjust («Corrigiendo…»), ops-dialogs baja/sobrante/ajuste, reasons-manager y product-config-tab eliminar.
- Solicitudes: attend-dialog («Confirmando…»). Pedidos: purchase-panel, review-panel, adjust-panel.
- Divisas: currency-menu, denomination-manager. Roles/usuarios: delete-role, user-actions, assignments-form. Catálogo: delete-product, category-row/manager, product-form (crear categoría). Compañías: admin-actions. Notificaciones: «Marcar todas» ahora con loading. Auth: 6 formularios.
- loading.tsx / Suspense de existencias, detalle, solicitudes, bandeja, bolsa, pedidos y pedido detalle ya usaban `ViewState loading`; sin cambios.
- Pendiente: acciones masivas de product-list (sin estado pending expuesto).
