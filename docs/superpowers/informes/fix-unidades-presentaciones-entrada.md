# Fix: unidades compatibles y presentación nueva en entradas

- (A) El selector de unidad ofrece la familia completa de la base (`unit:<u>`), las presentaciones y «Nueva presentación…». `convertUnits`/`unitRatio` en `core/domain/stock/units.ts` (un solo redondeo a milésimas). El selector de «Unidad base» ya ofrecía las 7 unidades.
- (B) «Nueva presentación…» (solo con `configure_units`, `canConfigure` en `loadEntryConfigAction`): pide nombre y contenido (cantidad + unidad de la familia); `registerEntryAction` crea la presentación con `addPresentation` y registra la entrada por esa presentación. Si el registro falla después, la presentación queda creada.
- Sobrescritura de contenido: ya existía (`content` en `registerInitialEntry`/`registerDirectEntry`, campo «Contenido real»); no hizo falta SQL.
- Redondeo: el contenido se guarda en milésimas (25 kg = 55,116 lb), así que el resumen muestra el total guardado: «10 sacos × 25 kg = 250 kg = 551,160 lb» (no 551,155).
- Costos: por unidad elegida y su equivalente por base, solo con `canSeeCosts`.
- Pruebas: `tests/unit/entry-logic.test.ts`; `pnpm verify:fast` OK (809 casos).
