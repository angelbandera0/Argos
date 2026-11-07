# Módulo 2 · Resumen operativo de DESIGN-modulo2.md

Resumen de `DESIGN-modulo2.md` (adenda a `DESIGN.md`): ante cualquier duda o ausencia, el original manda. Lo que no aparece aquí sigue `docs/design/DESIGN-resumen.md`. Secciones del original: `pnpm design:section --file docs/design/modulo2/DESIGN-modulo2.md --list`.

## Reglas nuevas (M1)
- Secciones y bloques de contenido: `--color-panel`, radio 24, padding 20–24, sin borde. Sustituye en este módulo el borde de 6.37. Listados a pantalla completa: contorno `inset 0 0 0 1px --color-line-soft`.
- Amarillo relleno con texto `--color-ink` solo para «hoy / en curso / abierto» (pedido abierto, filtro Hoy, Sin atender, paso actual). «Sugerido» o «predeterminado» van en rojo tint.
- Máximo un bloque rojo grande por vista. Un aviso con acción usa botón de contorno (`--color-danger-border`, texto `--color-red-hover`).
- Táctil ≥ 44 px. Estado = color + texto + icono (insignias con icono de 12 px).
- Sin emojis. Sin fondos oscuros, **salvo la excepción autorizada por el usuario (2026-11-07) para el módulo 2**: botones y medidores negros de M7, toasts (`--toast-bg`) y la barra oscura móvil de 6.49. Fuera de esos casos sigue vigente la prohibición.

## Tokens nuevos (M2)
En `tokens-modulo2.css`, importado después de `tokens.css`.
- `--stock-normal-bg/-fg` (verde) · `--stock-low-bg/-fg` (aviso) · `--stock-out-bg/-fg` (rojo tint, texto 700): insignias Normal, Bajo, Agotado.
- `--state-open-bg/-fg`: amarillo relleno con ink (abierto, sin atender, hoy).
- `--state-review-ring` (#C9CDD3): en revisión y por comprar, blanco con contorno.
- `--state-draft-ring` (#E4E6EA): borrador y pendiente, panel con contorno suave.
- `--diff-row-bg` (#FFF7F6): fila con diferencia entre reportado y recibido.
- `--coverage-full/-part/-none`: barra de cobertura de stock (6.48).
- `--lot-suggested-bg/-fg`: chip «Sugerido · más antiguo».
- `--toast-bg` (#1C1C1E): aviso breve de confirmación.

## Cifras, unidades y dinero (M3)
- Miles con «.», decimales con «,». `tabular-nums` y alineadas a la derecha en tablas.
- Unidad base: lb, kg y L con 3 decimales; g y unidades con 0. Lo capturado va en su presentación y debajo, en 12–13 px muted, el equivalente («= 100,000 lb»).
- Dinero: `12.500,00 CUP` (código detrás); el símbolo solo si la divisa está clara. Decimales según la divisa. Costo por presentación: debajo «= 32,00 CUP por lb».
- Sin costo conocido: chip con contorno, nunca `0,00`; no suma al valor y el pie lo dice.
- Variante sin costos (`costs: false`, sin permiso «Ver costos», archivos `*-SinCostos`): quita columnas, bloques y importes de costo, sin huecos (se renumeran secciones). El historial resume «1 cambio de importe oculto…». El comprador siempre ve los costos de su pedido.

## Navegación (M4)
- Sidebar (6.30): GENERAL (Inicio, Notificaciones) · ALMACÉN (Existencias, Solicitudes, Pedidos) · CATÁLOGO (Productos, Categorías, Divisas) · ADMINISTRACIÓN (Compañías, Roles, Usuarios, Historial). Elementos de 44 px. Contador de Solicitudes: píldora de 22 px, con texto oculto « sin atender».
- Móvil: barra inferior de 56 px sobre panel. Encargado: Inicio · Existencias · Solicitudes · Más. Comprador: Mis pedidos · Avisos · Perfil. Almacenero: Inicio · Bandeja · Almacén · Pedidos.

## Notificaciones (M5)
- Campana de 44 px con contador rojo; `aria-label` «Notificaciones, 3 sin leer»; abierta, fondo red-tint.
- Panel flotante de 400 px (radio 24, `--shadow-popover`): «Marcar todas como leídas», filas con icono de 36 px, meta de prioridad, hora y tienda, y punto rojo si no está leída. Prioridad: Info (panel), Aviso (warning-tint), Urgente (danger-tint).
- Sección y dashboard: pestañas Todas / Sin leer, agrupadas por día; «Abrir →» y check; dashboard con «Solicitudes de hoy» y «Últimas 10 notificaciones».

## Componentes 6.43–6.52
- **6.43 Selector de cantidad con unidad:** cifra + presentación + equivalente; en móvil, −/+ en píldora de 48 px. Entradas, traslados, solicitudes, compras.
- **6.44 Selector de lote (PEPS):** lote sugerido «más antiguo» y campo de cantidad por lote. Solo con el permiso «Elegir lote».
- **6.45 Insignias de estado:** 26 px con icono; familias existencia, línea de solicitud, solicitud y pedido.
- **6.46 Línea de tiempo de estados:** horizontal en cabeceras, vertical en detalle; pasos hecho, ahora, devuelto, confirmado y por venir.
- **6.47 Bloque Entregado · Gastado · Sobrante:** compra, revisión y detalle. Excedido se marca con rojo tint y palabra, no solo color.
- **6.48 Cobertura de stock:** chip «Cubre todo / Cubre X / Sin existencia» y barra de 6 px. Bandeja.
- **6.49 Barra de decisiones pendientes:** píldora sticky inferior con contador y «Aplicar decisiones». En móvil es barra oscura, en conflicto con M1.
- **6.50 Reparto por tienda:** campo de 72 px por tienda; «Cuadra» o «Faltan N»; bloquea la acción mientras no cuadre.
- **6.51 Tarjeta-interruptor:** `role="switch"` de ancho completo. Buena: success-tint. Delicada («Ver costos»): #FFF4F3 con borde danger. Versión compacta en listas de permisos.
- **6.52 Tabla de tres cantidades:** Pedida · Reportada · Recibida (editable en revisión) y Diferencia (Coincide, −N, Faltante del pedido).

## Responsive (M9)
- Móvil primero: Mi pedido (compra), Mis pedidos, Existencias de mi tienda, Nueva solicitud y Mis solicitudes. En escritorio, una columna de 720 px como máximo.
- Escritorio primero: el lateral pasa debajo y la acción va en barra fija; tablas de existencias y pedidos pasan a tarjetas.
- Tablet 834–1194 px: sidebar en riel; formularios de dos columnas desde 1024 px.

## Accesibilidad (M10)
- Segmentados: `radiogroup` + `radio` con `aria-checked`. Interruptores: `role="switch"` con texto de estado.
- Casillas con `aria-checked="mixed"`; medidores con `role="meter"`.
- Avisos (devuelto, bloqueo, error de stock): `role="alert"`; toast: `role="status"`.
- Confirmaciones destructivas: `role="alertdialog"` y foco de vuelta al botón que abrió el diálogo.
- Contadores con texto oculto; campos de 6.52 etiquetados «Recibida de {producto}».

## Estados de vista (M8) y checklist (M11)
- Cinco estados en cada vista (`M2-Estados`): cargando (skeleton, `role="status"`, sin spinner a pantalla completa), vacío (botón solo si puede crear), sin coincidencias, error (con «Reintentar»), sin permiso.
- Las acciones que cambian stock llevan confirmación con resumen y aparecen en el historial.

- **QuantityPicker (§6.43):** `components/ui/quantity-picker.tsx`; cifra + select de unidad + línea «= X lb» o error. Solo variante escritorio.
