# T17 · Existencias de tienda (móvil)

- `components/stock/store-stock-list.tsx`: tarjetas (EntityCard) con estado, existencia, mínimo y «Faltan X para el mínimo»; chips de estado, búsqueda, paginador. «Fijar/Editar mínimo» (FormDialog + `saveMinimumAction`) con `configure_minimums`; entrada directa por producto (`EntryButton direct`) con `direct_store_entry`. Sin costos nunca en esta vista.
- `/existencias`: si el usuario es de tienda, solo se consideran las ubicaciones de su tienda (más lo que ya filtra `canSeeLocation`) y se muestra esta vista; sin selector de ubicación. Admin sigue con la tabla de escritorio.
- Lógica `shortfall`/`shortfallLabel` en `stock-list-logic.ts` con prueba. `verify:fast` OK (716 casos).
- Sin hacer: «Solicitar reposición de los agotados» (T23), página de mínimos de escritorio (M2-Minimos), verificación visual.
