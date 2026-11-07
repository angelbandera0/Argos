# T15a · Lista de existencias (/existencias)

- Ruta `app/(app)/existencias/` (page con Suspense, loading, error con «Reintentar», guard `requireStockUser`) y `components/stock/stock-list.tsx` + `stock-list-logic.ts` (pruebas `tests/unit/stock-list-logic.test.ts`). Ítem «Existencias» activado (`nav-config`); Solicitudes y Pedidos siguen deshabilitados.
- Ubicación por defecto: almacén general si es visible, si no la tienda activa; selector solo si hay más de una. Indicadores Productos/Bajos/Agotados y, con costos, Valor del inventario (por divisa; «N productos sin costo conocido» fuera del valor). Filtros en URL: `ubicacion`, `q`, `categoria`, `estado` (normal|bajo|agotado), `pagina`.
- Nuevo caso de uso `listLocationLots` (puerto, repo, fake, fábrica) para costos de toda la ubicación en una consulta; `costs()` del repo trocea en lotes de 100 ids. Costo promedio y valor se calculan de los lotes; tope 5000 lotes.
- Acciones Entrada inicial / Trasladar / Dar de baja: botones deshabilitados con título «Próximamente» (T16), solo con el permiso especial (admin siempre), solo en el almacén.
- Fila enlaza a `/existencias/[productId]?ubicacion=` (paso 2; da 404 hasta entonces).
- Sin hacer: punto rojo del menú (necesitaría conteo en el layout por Suspense); cobertura (la maqueta no la muestra en esta lista); filtro de categoría vacío si el operador no puede leer categorías; sin permiso de divisas el código de divisa queda vacío.
- Verificación visual pendiente.
