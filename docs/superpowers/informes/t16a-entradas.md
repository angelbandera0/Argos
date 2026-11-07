# T16a · Entrada inicial y directa

- `QuantityPicker` (components/ui, galería, pruebas) reutilizable por T16b/c. Lógica en `components/stock/entry-logic.ts` (zod, conversión en milésimas con Qty, mensajes), `EntryDialog`/`EntryButton`, acciones en `app/(app)/existencias/entry-actions.ts`.
- Entrada inicial (almacén) y directa (tienda) en /existencias y en el detalle; costo (por presentación, divisa, «No conozco el costo») solo con `costs`; la acción ignora el costo sin permiso. «Trasladar»/«Dar de baja» siguen «Próximamente».
- Sin hacer: fecha/hora de la entrada directa, panel lateral de conversión/valor, aviso a administradores, variante móvil −/+; verificación visual.
- `pnpm verify:fast` OK (86 archivos, 706 casos).
