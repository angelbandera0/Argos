# Sidebar: padding interno de items (2.º intento)

Objetivo medido: pastilla ≈ 68 px en captura (≈ 52 reales), paso ≈ 71 (gap ≈ 2-4), pastilla a ≈ 16 px de los bordes, icono a ≈ 18 px, punto a ≈ 14 px del borde derecho.

| Valor (≥1280 px) | Antes | Después |
|---|---|---|
| `--size-nav-item` | 44px | 52px |
| gap entre filas | 8px | 2px |
| padding panel | 20/16 | 20/16 (sin cambio) |
| padding item izq / der | 14 / 14 | 18 / 14 |
| padding rótulo (lateral) | 14 | 18 (alinea con el icono: 16+18) |
| margen entre secciones | 20 | 12 |

Rail de tablet y barra móvil no se tocan (el cambio está en `@media (min-width: 1280px)`; el alto de fila `--size-nav-item` solo lo usa el sidebar de escritorio).

Verificación visual pendiente.
