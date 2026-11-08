# Fidelidad Existencias

## Paso 1 (layout)
- `.content` sin max-width (era 1040 px); `.main` con tope `--size-content-max` (1720 px, tokens.css). Formularios se limitan solos (`.form-shell`).

## Paso 2 (lista) corregido
- Título dinámico «Existencias del almacén general», descripción y botones (Trasladar, Dar de baja, Entrada inicial) en la cabecera.
- Tiles Bajos/Agotados con subtítulo (`StatTile hint`).
- Columna Categoría eliminada (la maqueta solo la filtra); menú de fila ⋯ con «Ver detalle».
## Paso 2 pendiente
- Botón «Configurar mínimos y unidades» (pantalla M2-Minimos no existe); select de ubicación como chip.

## Paso 3 (detalle) corregido
- Subtítulo «Unidad base X · ubicación»; fila de tiles Existencia / Estado (+mínimo) / Costo último lote / Costo promedio (costos solo con see_costs).
- Columnas de lotes: Fecha, Inicial, Restante.
## Paso 3 pendiente
- Categoría en el subtítulo; equivalencia en presentaciones («= 25 bolsas»); columnas Lote L-xxxx, Presentación usada, Sale primero; Movimientos: En unidad base, Autor, Capturado; vista previa de conversiones y «Editar todos los mínimos».
