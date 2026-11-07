# T03c-2 · Componentes Argos UI 6.48-6.52 y pendientes de divisas

- Nuevos (`components/ui/`): `StockCoverage` (+`coverage-logic.ts`), `DecisionsBar` (+`decisions-logic.ts`; móvil oscura con `--toast-bg/--toast-fg`), `StoreSplit` (+`split-logic.ts`), `ThreeQtyTable` (+`diff-logic.ts`, `showCosts`), `SegmentedControl` (radiogroup base-ui).
- `ToggleCard`: `tone="delicate"` (fondo `--diff-row-bg`, borde peligro; el DESIGN dice `#FFF4F3`, se usa el token más cercano) y `locked` (candado). `Badge icon`, `EntityCard codeBox` (caja de 64 px).
- /divisas: lista con caja de código y estrella en «Predeterminada»; formulario con decimales segmentados y «Activa» con candado si es predeterminada.
- Galería, `PATRONES-UI.md`, `DESIGN-resumen.md`; pruebas en `tests/unit/ui-m2-b.test.ts`. Sin verificación en navegador.
- Pendiente: la lista de comprobación que bloquea la acción principal (6.50) queda a cargo de la pantalla que use `StoreSplit`.
