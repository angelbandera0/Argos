# Argos · Módulo 2 — Almacén y pedidos

Diseño del módulo 2: adenda de la guía (solo lo nuevo respecto a `DESIGN.md`), tokens nuevos y 40 pantallas del lienzo.

## Estructura

```
docs/design/modulo2/
├── README.md                    Este índice
├── DESIGN-modulo2-resumen.md    Resumen operativo (leer primero)
├── DESIGN-modulo2.md            Guía completa (M1–M11, componentes 6.43–6.52, pantallas M7)
├── tokens-modulo2.css           Importar después de tokens.css
└── pantallas/
    ├── 1-pedidos/               Compra, mis pedidos, revisión, armar, lista, bolsa, detalle, corregir
    ├── 2-reposicion/            Bandeja (web y móvil), nueva solicitud, mis solicitudes
    ├── 3-existencias/           Tienda (móvil), almacén, producto, entrada, traslado, bajas, mínimos
    ├── 4-divisas/               Lista y formulario
    ├── 5-notificaciones/        Dashboard y sección de notificaciones
    ├── 6-roles-historial/       Rol ampliado, historial ampliado
    └── 7-transversales/         Piezas comunes y estados de vista
```

## Convención de nombres

- `*-Movil`: móvil (390 px). Lo demás es escritorio (1440 px, fluido).
- `*-SinCostos`: variante para usuarios sin el permiso «Ver costos».
- `-Devuelto`: pedido devuelto por el revisor. `-Bloqueo`: quien revisa es quien compró. `-Config`: pestaña Configuración.

## Cómo leer sin sobrecargar

1. Lee `DESIGN-modulo2-resumen.md`. Ante cualquier duda, manda `DESIGN-modulo2.md`.
2. Para una sección concreta: `pnpm design:section --file docs/design/modulo2/DESIGN-modulo2.md "<título>"` (lista con `--list`).
3. Para una maqueta: `pnpm mockup docs/design/modulo2/pantallas/<carpeta>/<archivo>.dc.html` (no `cat`).
4. Los `.dc.html` cargan `./support.js` del lienzo: se ven solo dentro de él (página «Módulo 2 · Almacén y pedidos»). Fuera sirven como referencia de código: marcado, estilos en línea y datos de ejemplo.

Los datos son de ejemplo, salvo el usuario Raul y la categoría Viandas.

## Mapa pantalla → sección → maqueta → tarea

Las secciones son las de M7 (`DESIGN-modulo2.md`, línea entre paréntesis). Las tareas son las del plan `docs/superpowers/plans/2026-11-06-modulo-2-tareas.md`. «—» = no encaja en una tarea concreta.

| Pantalla (sección M7) | Maqueta(s) en `pantallas/` | Tarea |
|---|---|---|
| Mi pedido, compra (263) | `1-pedidos/M2-Compra-Movil`, `-Devuelto` | T26 |
| Mis pedidos, móvil (282) | `1-pedidos/M2-Mis-Pedidos-Movil` | T26 |
| Bandeja de solicitudes (288) | `2-reposicion/M2-Bandeja`, `M2-Bandeja-Movil` | T24 |
| Existencias de mi tienda (311) | `3-existencias/M2-Existencias-Tienda-Movil` | T17 |
| Nueva solicitud, móvil (322) | `2-reposicion/M2-Nueva-Solicitud-Movil` | T23 |
| Mis solicitudes, móvil (329) | `2-reposicion/M2-Mis-Solicitudes-Movil` | T23 |
| Revisión del pedido (338) | `1-pedidos/M2-Revision-Pedido`, `-SinCostos`, `-Bloqueo` | T27 |
| Armar pedido (352) | `1-pedidos/M2-Armar-Pedido`, `-SinCostos` | T25 |
| Lista de pedidos (368) | `1-pedidos/M2-Pedidos-Lista`, `-SinCostos` | T25 |
| Bolsa por comprar (375) | `1-pedidos/M2-Bolsa-Comprar` | T24 |
| Detalle de pedido (384) | `1-pedidos/M2-Pedido-Detalle`, `-SinCostos` | T27 |
| Corregir pedido cumplido (394) | `1-pedidos/M2-Corregir-Pedido` | T27 |
| Existencias del almacén (404) | `3-existencias/M2-Existencias-Almacen`, `-SinCostos` | T15 |
| Detalle de producto en almacén (410) | `3-existencias/M2-Producto-Almacen`, `-SinCostos`, `-Config` | T15 |
| Entrada inicial (425) | `3-existencias/M2-Entrada-Inicial`, `-SinCostos` | T16 |
| Trasladar a tienda (439) | `3-existencias/M2-Trasladar`, `-SinCostos` | T16 |
| Dar de baja, entrada directa, motivos (453) | `3-existencias/M2-Dialogos-Existencias`, `-SinCostos` | T16 |
| Configurar mínimos (466) | `3-existencias/M2-Minimos` | T17 |
| Divisas (473) | `4-divisas/M2-Divisas`, `M2-Divisa-Form` | T03 |
| Rol ampliado (491) | `6-roles-historial/M2-Rol-Ampliado` | T04 |
| Historial ampliado (502) | `6-roles-historial/M2-Historial`, `-SinCostos` | T29 |
| Notificaciones y campana (M5, línea 120) | `5-notificaciones/M2-Notificaciones` | T07 |
| Dashboard con solicitudes del día (M5, línea 149) | `5-notificaciones/M2-Dashboard` | T07, T28 |
| Estados de vista (M8, línea 510) | `7-transversales/M2-Estados` | T03d |
| Piezas comunes | `7-transversales/M2-Piezas` | T03c, T03d |

## Prioridad de diseño (del brief)

1. `1-pedidos/M2-Compra-Movil`: Mi pedido, compra.
2. `2-reposicion/M2-Bandeja`: bandeja de solicitudes.
3. `3-existencias/M2-Existencias-Tienda-Movil`: existencias de mi tienda.
4. `1-pedidos/M2-Revision-Pedido`: revisión del pedido.
5. `1-pedidos/M2-Armar-Pedido`: armar pedido.
6. `3-existencias/M2-Existencias-Almacen` y `M2-Producto-Almacen`.
