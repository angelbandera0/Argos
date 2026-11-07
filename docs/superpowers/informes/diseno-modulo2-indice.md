# Informe · Índice y resumen del diseño del Módulo 2

Fecha: 2026-11-07. Rama: `worktree-diseno-modulo2`. Tarea solo de documentación (Haiku).

## Archivos creados o modificados
- `docs/design/modulo2/DESIGN-modulo2-resumen.md` (nuevo): resumen operativo de M1–M5, M8–M10 y componentes 6.43–6.52. Su primera línea dice que el original manda.
- `docs/design/modulo2/README.md` (reescrito como índice): estructura real, convención de nombres, cómo leer sin sobrecargar y dos tablas (mapa pantalla → sección M7 con línea → maqueta → tarea; prioridad de diseño). Sin rutas `argos-modulo2/` ni `guia/`.
- `docs/README.md`: fila para `design/modulo2/README.md`.
- `docs/superpowers/specs/2026-11-06-modulo-2-almacen-pedidos/INDEX.md`: fila para el diseño resultante.
- `docs/design/screens/MODULO-2-BRIEF-DISENO.md`: nota de una línea al inicio.
- `docs/design/PATRONES-UI.md`: sin cambios (no tiene tabla donde encaje el enlace).
- Sin tocar: `DESIGN-modulo2.md`, `tokens-modulo2.css`, los `.dc.html`, `CLAUDE.md`.

## Verificación
- `pnpm design:section --file docs/design/modulo2/DESIGN-modulo2.md --list`: imprime los encabezados M1–M11 y 6.43–6.52 con sus líneas.
- `pnpm mockup docs/design/modulo2/pantallas/4-divisas/M2-Divisas.dc.html --max-lines 15`: funciona.
- Nota: `pnpm` no se ejecuta con el Node por defecto (corepack sobre Node 18); con `PATH` apuntando a Node 22 funciona.

## Inquietudes
1. Conflicto de color: M1 limita el negro a tres usos y prohíbe fondos oscuros, pero M7 usa botones y medidores negros (p. ej. «Continuar compra») y 6.49 define una barra oscura en móvil. El resumen lo señala; conviene decidir con el diseñador.
2. Las tareas de «Estados de vista» (M8) y «Piezas comunes» quedan sin tarea («—»), porque son transversales. Dashboard se asigna a T07 (bloque de notificaciones) y T28 (solicitudes del día).
