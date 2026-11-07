# 03 · Almacén y stock

## Resultado esperado
Cada compañía sabe cuánto hay de cada producto básico en el almacén general y en cada tienda, cuánto costó cada entrada, y puede mover, dar de baja y corregir existencias con trazabilidad total. Las tiendas ven cantidades; los costos solo los ven quienes tienen permiso (M2-D04).

## Ubicaciones
- **Almacén general** (uno por compañía, M2-Q02) y **tiendas** (las de Módulo 1). El stock se lleva por producto y ubicación.
- **S-01 [U]** Los productos entran primero al almacén general y de ahí se trasladan a las tiendas, salvo entradas directas a tienda (S-12).

## Unidades
- **S-02 [U]** Cada producto de almacén tiene una **unidad base**. Por defecto, peso en **libras con 3 decimales**; volumen y conteo, ver M2-Q05. No se mezclan magnitudes (peso/volumen/conteo); sí se convierte dentro de una (lb ↔ kg).
- **S-03 [P]** **Presentaciones de compra** (saco, paca, caja): nombre y contenido en base. Se usan al comprar y recibir.
- **S-04 [U]** **Unidades de movimiento** (porción, libra…): nombre y equivalencia en base. Se usan al trasladar. Ej.: arroz, 1 lb = 5 porciones; caja de picadillo = N lb y 1 porción = M lb.
- **S-05 [U]** El contenido habitual es fijo; en cada entrada se puede **corregir el contenido real** (un saco de 24,6 lb). El contenido usado se congela en el lote. Alternativa para productos que varían: capturar el total pesado/medido.
- **S-06 [P]** Todo se guarda en base; se conserva la cantidad capturada y su unidad junto a la convertida. Redondeo a 3 decimales, aceptado por el usuario (M2-Q06, 2026-11-07).
- **S-07 [P]** Se configuran en el producto (pantalla de configuración de almacén del producto).

## Lotes y costo
- **S-08 [U]** Cada entrada crea un **lote**: producto, ubicación, cantidad inicial y restante (base), costo unitario por base, divisa, fecha, origen (entrada inicial, pedido, entrada directa, traslado), presentación y contenido usados.
- **S-09 [U]** El costo varía por lote. El costo por unidad base permite comparar compras y presentaciones.
- **S-10 [P]** Un traslado mueve cantidad de lotes concretos y **los lotes llegan a la tienda con su costo** (oculto sin permiso).

## Salidas y lote elegido
- **S-11 [U]** Toda salida (traslado, baja, ajuste negativo) **sugiere el lote más antiguo (PEPS)**, pero se puede elegir otro lote o repartir entre varios. Cada renglón guarda lote, cantidad y costo con que salió. No se puede sacar más de lo que queda en un lote. **[P]** Elegir un lote distinto al sugerido es un permiso del rol y queda registrado con motivo opcional; sin el permiso se usa el orden sugerido.

## Entradas
- **S-12 [U]** **Entrada directa a tienda** (p. ej. pan): la hace el administrador o quien tenga el permiso; el producto no pasa por el almacén general. Puede venir de un pedido con destino tienda (ver 04) o registrarse directamente.
- **S-13 [U]** **Entrada inicial** (apertura): la hace el administrador definiendo producto, cantidad, presentación, costo, divisa y fecha. El almacenero puede con permiso; entonces se notifica a los administradores (02).
- **S-14 [P]** Stock existente sin costo conocido: se registra con costo «desconocido» y se excluye de las estadísticas de costo.

## Libro de movimientos
- **S-15 [P]** Tipos: entrada_inicial, entrada_compra, entrada_directa, traslado (salida y entrada), baja, ajuste, consumo (**reservado**, no se construye). Cada movimiento: tipo, lote(s), cantidad base, cantidad capturada y unidad, costo, divisa, motivo, autor, fecha y documento origen (pedido, solicitud).
- **S-15b [U]** **Sobrante de conteo (2026-11-07):** un ajuste positivo solo restituye a un lote hasta lo recibido. Lo que supere eso se registra como un **lote nuevo de origen «ajuste»** (fecha de hoy, motivo obligatorio, permiso `adjust_stock`); si lo hace quien no es administrador se avisa a los administradores. **Su costo es «sin costo conocido»** salvo que quien lo registra tenga «Ver costos» y lo indique; no se inventa un costo.
- Inmutable (M2-D07). La baja y el ajuste tienen sus propias reglas abajo.
- **S-15c [U]** **Corrección de costo (L8, ADR-018):** corregir el costo de un lote ya confirmado es un **ajuste de valor**, nunca una edición. Se registra un ajuste con costo anterior, costo nuevo (≥ 0, 6 decimales), motivo obligatorio, autor y fecha; si el lote viene de un pedido se enlaza al pedido y queda en su línea de tiempo. Cambia solo el costo unitario **vigente** del lote: lo ya consumido o trasladado conserva el costo con que salió (la diferencia es un ajuste de valor del periodo de la corrección). Lo hace el administrador de la compañía o quien tenga «Ver costos» y «Corregir pedidos»; el costo anterior es visible en el historial solo con «Ver costos». No se inventa un costo: nunca se corrige a «sin dato» ni a 0 por omisión.

## Bajas
- **S-16 [U]** Se pueden dar de baja productos del almacén con motivo obligatorio: un **catálogo estándar** (merma, caducado, dañado, derrame, consumo interno, pérdida) y la opción **«otro»** con texto libre. **[P]** El administrador puede ampliar el catálogo.
- **S-17 [U]** Quién da bajas y en qué ubicaciones (almacén, tiendas) es un **permiso del rol**.
- **S-18 [P]** La baja elige lote (S-11) y registra su valor como pérdida.

## Mínimos y alertas
- **S-19 [U]** Se define un **mínimo por producto y ubicación**, configurable por permiso del rol (y siempre por el administrador). Todo cambio deja trazabilidad.
- **S-20 [P]** Estados: **normal**, **bajo** (cantidad ≤ mínimo) y **agotado** (cero). Al pasar a bajo o agotado se emite notificación (02). Cobertura según consumo queda para cuando existan las recetas.

## Visibilidad
- **S-21 [U]** Administrador de tienda: ve productos y existencias de su tienda (cantidad y unidad de movimiento), con estados bajo y agotado. Nunca costos sin permiso.
- **S-22** Almacenero y administrador: ven almacén general, lotes, movimientos, y costos según permiso.

## Permisos (detalle en 05)
Ver existencias, entrada inicial, entrada directa, trasladar, bajas, ajustar, elegir lote, configurar unidades del producto, configurar mínimos, ver costos.

## Criterios de aceptación
- CA-01: DADO una entrada de 5 sacos de 25 lb a 300 el saco, ENTONCES hay un lote de 125,000 lb a 12,000 por lb, con la captura original guardada.
- CA-02: DADO un traslado de 10 porciones (1 porción = 0,200 lb), ENTONCES se descuentan 2,000 lb del lote elegido y la tienda ve 10 porciones.
- CA-03: DADO una salida sin elegir lote, ENTONCES se usa el lote más antiguo; si se elige otro, se registra como desvío.
- CA-04: DADO un lote con menos de lo pedido, ENTONCES no se permite sacar más de lo que queda en él.
- CA-05: DADO un usuario sin «ver costos», ENTONCES no aparece ningún costo en pantallas, API ni MCP.
- CA-06: DADO una baja, ENTONCES exige motivo del catálogo o «otro» con texto, y baja el stock del lote elegido.
- CA-07: DADO un producto que llega a su mínimo o a cero, ENTONCES cambia a bajo o agotado y se notifica.
- CA-08: DADO una entrada inicial hecha por un almacenero, ENTONCES se notifica a los administradores.
- CA-09: DADO un movimiento registrado, ENTONCES no puede editarse ni borrarse; solo corregirse con un ajuste.
- CA-10: DADO un lote con costo 12, cuando un administrador lo corrige a 15 con motivo, ENTONCES el costo vigente del lote es 15, existe un ajuste «de 12 a 15» con motivo y autor, y los movimientos previos conservan su costo 12.
- CA-11: DADO un usuario sin («Ver costos» y «Corregir pedidos»), ENTONCES no puede corregir costos ni ver los ajustes; sin motivo o con costo negativo la corrección se rechaza.
