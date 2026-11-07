# T03d · Estados de vista y piezas transversales

- `ViewState` (+`view-state-logic.ts`, `app/ui-view-state.css`): kind loading/empty/no-match/error/forbidden, textos por `entity`; reutiliza `EmptyState` (icono 56 px vía `--size-state-icon` en `tokens-modulo2.css`), `Alert` danger y `Skeleton`. Vacío sin botón si `canCreate={false}`. `Lock` añadido a `NAV_ICONS`.
- `MoneyValue`: `value={null}` chip «Sin costo conocido» (Chip ring); `costs={false}` no renderiza; usa `formatMoney`.
- Ya existían de T03c (no duplicados): `SpendSummary` (entregado/gastado/sobrante, `hideAmounts`), `formatMoney`, `QuantityInput`, `StatusBadge`, `LotPicker`, `StateTimeline`, `ThreeQtyTable`.
- Pendiente: el `Toast` actual sigue claro (`--color-surface`); el fondo oscuro `--toast-bg` de M2 no se aplicó para no cambiar los toasts del módulo 1 sin decidirlo.
- Galería, PATRONES-UI, DESIGN-resumen; pruebas `tests/unit/ui-view-state.test.ts`. `pnpm verify`: OK (72 archivos, 573 casos). Sin navegador.
