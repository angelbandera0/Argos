# T03c-1 · Componentes Argos UI 6.43-6.47

- `tokens-modulo2.css` importado en `app/globals.css` tras `tokens.css`.
- Componentes (`components/ui/`): `QuantityInput` (+`quantity-logic.ts`), `LotPicker` (+`lot-logic.ts`), `StatusBadge`, `StateTimeline`, `SpendSummary` (+`spend-logic.ts`). CSS `app/ui-*.css`.
- Galería `/ui`, `PATRONES-UI.md` y `DESIGN-resumen.md` actualizados; pruebas `tests/unit/ui-*.test.ts`.
- `pnpm verify`: OK (70 archivos, 558 casos).
- Notas: formato `es` (125 lb -> «125,000 lb»; 125000 lb -> «125.000,000 lb»). `LotPicker` toma `cost` ya formateado y lo muestra solo con `showCosts`. `SpendSummary hideAmounts` no renderiza nada. No hay verificación en navegador.
