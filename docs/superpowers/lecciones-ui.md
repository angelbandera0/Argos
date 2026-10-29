# Lecciones de UI (leer en lugar de los informes anteriores)

Resumen de los informes de `docs/superpowers/informes/`. Un subagente de UI lee este archivo y no los informes.

## Herramientas (coste)
- Leer con `Read` (con `offset`/`limit`) y varias lecturas en una misma respuesta; buscar con `Grep`; editar con `Edit`/`Write`. Nada de `cat`/`sed`/`grep` por Bash para leer, ni `python3` para editar: cada volcado se relee en todas las llamadas siguientes.
- Diseño: `pnpm design:section <n.º>` y `pnpm mockup <ruta>`; nunca `DESIGN.md` ni la maqueta enteros.
- Una sola ejecución de `pnpm verify:fast` al final.

## Visual
- Contrasta siempre con la captura de `docs/design/components/mockups/img/` (Read de la imagen) antes de dar por buena la pantalla; el retrabajo por no hacerlo costó +15 % en compañías.
- Escala tipográfica reducida del proyecto: de la maqueta se copian estructura, colores y espacios, no los px de fuente.
- Chips de filtro en una fila, sin mayúsculas (`.chip` pisaba `.chip-filter`). Grilla de tarjetas con `width: 100%`. Avatares con color (tono determinista), no grises. Estado de «En uso» como chip.
- Formularios anchos: `FormShell` variante `aside` (820 + 340), no anchos sueltos.

## Código
- CSS nuevo: importarlo en `app/globals.css` y avisar de reiniciar `pnpm dev` (y borrar `.next` si hay archivos nuevos). Sin esto la pantalla se ve sin estilos.
- Solo datos reales de los casos de uso, sin migraciones; lo que no exista (rendimiento, ventas, fechas, duplicar, ver historial…) se omite y se anota en el informe.
- Controles deshabilitados no se envían en un formulario: usa campos ocultos para conservar el contrato de las server actions.
- Componente reutilizable nuevo: `pnpm new:ui`, galería `/ui`, `DESIGN-resumen.md` y `PATRONES-UI.md`; reutiliza antes de crear (EntityCard, StatTile, Pager, SummaryPanel, FormSection, ChoiceCard, PinSlots, FilterBar…).
- Menús de Base UI: `Menu.GroupLabel` dentro de `Menu.Group`.

## Cierre
- Commit con el trailer de coautoría; sin `docs/superpowers/evaluacion-software-factory.md`.
- Informe detallado en `docs/superpowers/informes/<tarea>.md`; respuesta final de máx. 5 líneas.
