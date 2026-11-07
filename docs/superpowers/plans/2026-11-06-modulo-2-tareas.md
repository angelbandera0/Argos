# Módulo 2 · Almacén y pedidos — Listado de tareas

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (o executing-plans). Este archivo es el **listado maestro**. Antes de ejecutar cada parte se escribe su plan detallado (pasos, firmas, pruebas) en `docs/superpowers/plans/2026-11-06-modulo-2-<parte>.md`, y se para entre partes.

**Goal:** Construir divisas, notificaciones, almacén/stock y reposición con pedidos de compra, con trazabilidad y costos protegidos.

**Architecture:** Igual que el Módulo 1: dominio y casos de uso en `core/`, adaptadores Supabase en `infrastructure/`, server actions para la UI y route handlers en `/api/v1`. Movimientos de stock mediante funciones SQL atómicas; costos en tablas aparte con RLS por permiso «ver costos».

**Tech Stack:** Next.js 16.4.3, React 19.3, TypeScript, Tailwind v4 + Argos UI, Supabase cloud (migraciones con `apply_migration`, pgTAP con `execute_sql`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-06-modulo-2-almacen-pedidos/INDEX.md` (00 a 05) · brief de UI `docs/design/screens/MODULO-2-BRIEF-DISENO.md`.

## Reglas de ejecución (de CLAUDE.md)
- Un worktree por tarea; Sonnet para código/SQL, Haiku para solo documentación; Opus solo para diseño.
- Migraciones y pgTAP **no se paralelizan** (un solo proyecto cloud). Una migración aplicada no se reescribe.
- Pruebas junto con la implementación, ejecutadas una vez al final (`pnpm verify:fast`; `--int`/`--db` donde se indica). Sin navegador salvo `--browser`.
- Tareas de UI: leer `DESIGN-resumen.md`, `TRAMPAS-BASE-UI.md` y `PATRONES-UI.md`; usar `pnpm new:ui`. Las maquetas de Claude Design mandan sobre el brief cuando existan.
- Se para tras cada tarea y se espera el «sigue».

## Dependencias entre partes
`T00` → Divisas (`T01-03`) → Componentes UI (`T03c-e`) → Permisos (`T04`) → Notificaciones (`T05-07`) → Almacén (`T08-17`) → Reposición y pedidos (`T18-28`) → Cierre (`T29-31`).

---

## Preparación
- [ ] **T00 · Documentos base** (Haiku). Actualizar `REQ-007` (módulos nuevos y permisos especiales, CA-01 y fuera de alcance), `DOMAIN.md` (DR-019 en adelante: ubicaciones, lote, movimiento, pedido), `DECISIONS.md` (ADR de libro inmutable, costos protegidos y PEPS elegible), `OPEN_QUESTIONS.md` (M2-Q01 a Q08) y crear `REQ-010` a `REQ-013` (divisas, notificaciones, almacén, reposición) desde la plantilla. Entregable: docs consistentes; sin código.

## Parte 1 · Divisas
- [ ] **T01 · Esquema de divisas.** Migración `divisas` y `denominaciones` (RLS por compañía, únicos, borrado lógico, trigger de historial) + pgTAP. `test:db`.
- [ ] **T02 · Casos de uso, repositorio y API de divisas.** Crear/editar/desactivar/eliminar divisa y denominación; predeterminada; reglas D-03/D-04; endpoints `/api/v1/divisas`. Unit + `test:int`.
- [ ] **T03 · Páginas de divisas (UI, brief §B).** Lista, formulario con denominaciones, confirmaciones.

## Parte 1b · Componentes Argos UI del módulo 2
Obligatorio por CLAUDE.md: todo componente nuevo va en `components/ui/`, en la galería `/ui` y en `DESIGN-resumen.md`. Diseño en `docs/design/modulo2/` (leer `DESIGN-modulo2-resumen.md` y la sección con `pnpm design:section --file docs/design/modulo2/DESIGN-modulo2.md`). Excepción de fondos oscuros autorizada para este módulo.
- [ ] **T03c · Componentes 6.43–6.52.** Importar `tokens-modulo2.css` en `app/globals.css`; crear con `pnpm new:ui` los componentes: selector de cantidad con unidad, selector de lote (PEPS), insignias de estado (existencia, solicitud, pedido), línea de tiempo, bloque Entregado · Gastado · Sobrante, cobertura de stock, barra de decisiones pendientes, reparto por tienda, tarjeta-interruptor (reutilizar `ToggleCard` si coincide) y tabla de tres cantidades. Pruebas unitarias de la lógica pura, secciones en `/ui` y filas en `PATRONES-UI.md` y `DESIGN-resumen.md`. Dividir en dos subagentes si supera ~20 llamadas. **Incluye lo que T03e dejó pendiente para divisas:** variante de `EntityCard` con caja de código de 64 px, icono en `Badge` (estrella de «Predeterminada»), segmentado de decimales y tarjeta-interruptor «delicada» con candado (6.51); aplicarlos luego en `/divisas`.
- [ ] **T03d · Estados de vista y piezas transversales.** Estados cargando/vacío/error/sin permiso del módulo (M8, `M2-Estados`) y piezas comunes (`M2-Piezas`) como componentes o variantes de `Skeleton`, `EmptyState`, `Alert` y `Toast`; etiqueta «sin costo conocido»; valores monetarios con formato de divisa y variante sin costos. En `/ui` y `DESIGN-resumen.md`.
- [ ] **T03e · Ajustar T03 a los diseños `M2-Divisas` y `M2-Divisa-Form`.** Comparar la UI de divisas ya construida con las maquetas y corregir diferencias; resolver el conteo de denominaciones (N+1).

## Parte 2 · Permisos (base transversal)
- [ ] **T04 · Módulos y permisos especiales de roles.** Ampliar `core/domain/permissions.ts` con los módulos nuevos y los permisos especiales (05), migración del catálogo y de `app.*` para consultarlos con alcance (almacén general sí/no + tiendas asignadas, M2-D14), pgTAP, y sección nueva en el formulario de rol (brief §G.1). `test:db` + unit.

## Parte 3 · Notificaciones
- [ ] **T05 · Esquema y emisión.** Migración `notificaciones` y función `app.notify(modulo, operacion, prioridad, destino_permiso, alcance, enlace, …)` que resuelve destinatarios por permiso y alcance sin notificar al actor (N-02/N-04); RLS: cada usuario solo lee las suyas; pgTAP.
- [ ] **T06 · Casos de uso, repositorio y API.** Listar con filtros (módulo, operación, prioridad, leída, tienda, fecha), contar no leídas, marcar leídas; `/api/v1/notificaciones`. Unit + `test:int`.
- [ ] **T07 · Campana, sección y últimas diez en el dashboard (UI, brief §C.1, C.2 y bloque 2 de C.3).** Hace funcionar el botón de la barra.

## Parte 4 · Almacén y stock
- [ ] **T08 · Dominio de unidades y lotes.** Funciones puras en `core/domain/stock/`: conversión presentación/unidad de movimiento ↔ base (libra, 3 decimales), magnitudes, asignación PEPS con lote elegido y reparto, validaciones (no negativo). Unit exhaustivo (CA-01 a CA-04 de 03).
- [ ] **T09 · Esquema de ubicaciones y configuración del producto.** Migración `ubicaciones` (almacén general + tiendas, M2-D13), producto almacenable, `unidades_producto` (base, presentaciones, unidades de movimiento), mínimos; pgTAP.
- [ ] **T10 · Esquema de lotes, movimientos y costos.** (Ampliar también `app.currency_in_use` y exponer usos por divisa para deshabilitar «Eliminar» y mostrar usos en el diálogo de desactivar.) Migración `lotes`, `movimientos` (inmutable por RLS y trigger), `costos_lote` aparte con RLS por «ver costos» (M2-D15), funciones atómicas `entrada_inicial` y `entrada_directa` con bloqueo de filas (M2-D16); pgTAP incluida la prueba de que sin permiso no se leen costos.
- [ ] **T11 · Traslados, bajas y ajustes (SQL).** Funciones atómicas `trasladar` (lote por lote de origen, M2-D11), `dar_baja` + tabla `motivos_baja` con los estándar, `ajustar`; desvío del PEPS con motivo; notificaciones de entrada inicial por almacenero; pgTAP.
- [ ] **T12 · Estados de existencia.** Vista/función de estado normal/bajo/agotado por producto y ubicación y notificación al cambiar (S-19/S-20); pgTAP.
- [ ] **T13 · Casos de uso de stock.** Entrada inicial, entrada directa, traslado, baja, ajuste, configurar unidades y mínimos, catálogo de motivos; ocultar costos por permiso. Unit.
- [ ] **T14 · Repositorios y API de stock.** Adaptadores Supabase y endpoints `/api/v1/existencias`, `/traslados`, `/bajas`, `/ajustes`, `/ubicaciones`. `test:int`.
- [ ] **T15 · UI almacén general (brief §D.1 y D.2).** Existencias, detalle con pestañas Lotes/Movimientos/Configuración/Historial y configuración de unidades.
- [ ] **T16 · UI de operaciones de stock (brief §D.3 a D.6, D.8).** Entrada inicial, entrada directa, traslado con selector de lote, baja y catálogo de motivos; selector de cantidad con unidad.
- [ ] **T17 · UI de tienda y mínimos (brief §D.7 y D.9).** Existencias de mi tienda (móvil, sin costos) y configuración de mínimos.

## Parte 5 · Reposición y pedidos
- [ ] **T18 · Esquema de solicitudes.** Migración `solicitudes`, `solicitud_lineas`, `solicitud_asignaciones` (M2-D12), estado derivado, la bolsa por comprar como vista; RLS por tienda; pgTAP.
- [ ] **T19 · Esquema de pedidos.** Migración `pedidos`, `pedido_lineas` (destino, desglose por tienda), compra (cantidad y costo reportados), revisión (cantidad recibida), faltante valorado, sobrante guardado (R-11b); función atómica `confirmar_pedido` que crea lotes con costo reportado y exige reparto (M2-D10) y revisor distinto del comprador (M2-D09); `devolver_pedido`; ajuste enlazado (R-19); notificaciones; pgTAP.
- [ ] **T20 · Casos de uso de solicitudes.** Crear, atender por línea (trasladar total/parcial, por comprar, pendiente, rechazar), bolsa. Unit.
- [ ] **T21 · Casos de uso de pedidos.** Armar, asignar comprador elegible, registrar compra y comparativa entregado/gastado/sobrante, enviar a revisión, revisar, confirmar, devolver, corregir. Unit con CA-03 a CA-08 de 04.
- [ ] **T22 · Repositorios y API de reposición.** Adaptadores y endpoints `/api/v1/solicitudes`, `/pedidos`. `test:int`.
- [ ] **T23 · UI solicitudes de tienda (brief §E.1 y E.2).** Nueva solicitud y Mis solicitudes (móvil).
- [ ] **T24 · UI bandeja y bolsa (brief §E.3 y E.4).** Panel de atención por línea con existencia del almacén.
- [ ] **T25 · UI lista y armado de pedidos (brief §F.1 y F.2).**
- [ ] **T26 · UI compra del comprador (brief §F.3, móvil primero).** Incluye comparativa Entregado · Gastado · Sobrante.
- [ ] **T27 · UI revisión, detalle y corrección (brief §F.4 a F.6).**
- [ ] **T28 · Dashboard: solicitudes del día (brief §C.3 bloque 1).**

## Cierre
- [ ] **T29 · Historial.** Módulos y operaciones nuevos en los filtros y textos, valores monetarios ocultos sin «ver costos» (05·H-01 a H-04). Unit + `test:int`.
- [ ] **T30 · OpenAPI y MCP.** Documentar los endpoints nuevos y exponerlos según REQ-001 para administradores; costos protegidos también aquí.
- [ ] **T31 · Trazabilidad y verificación final.** `docs/technical/MODULO-2-TRAZABILIDAD.md` (criterios → pruebas), notas de manual (REQ-004), `pnpm verify --int --db`, anotar consumo.

## Revisiones de seguridad diferidas (anotar en `revisiones-pendientes.md`)
RLS de costos y de movimientos inmutables (T10), funciones atómicas y concurrencia (T11, T19), alcance por tienda en solicitudes (T18), exposición de costos en API/MCP (T22, T30).
