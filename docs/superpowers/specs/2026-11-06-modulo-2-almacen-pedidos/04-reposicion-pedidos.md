# 04 · Reposición y pedidos de compra

## Resultado esperado
Una tienda pide productos; el almacén surte lo que tiene; lo que falta se compra con un monto y un comprador; lo comprado se verifica antes de sumarse al stock; las diferencias quedan registradas y se corrigen con trazabilidad.

## 1. Solicitud de reposición
- **R-01 [U]** El administrador de tienda ve productos y existencias de su tienda (03·S-21) y crea una **solicitud**: líneas de producto con cantidad en unidad de movimiento.
- **R-02 [U]** Quien tiene permiso de atender solicitudes (almacenero, administrador) las ve y decide, **primero contra el stock del almacén general**: si lo cubre, **traslada** (03·S-11); si cubre en parte, traslada lo disponible.
- **R-03 [P]** Estado por línea: `nueva` → `surtida` (total o parcial por traslado) · `por comprar` · `pendiente` (no se atiende ahora) · `rechazada` (con motivo). La solicitud muestra su estado según sus líneas.
- **R-04 [U]** Lo no surtido pasa a la **bolsa por comprar** o queda pendiente; una tienda puede pedir algo que no se atienda de inmediato.
- **R-05 [U]** Todo queda con trazabilidad: quién decidió, cuándo y por qué.

## 2. Pedido de compra
- **R-06 [U]** Quien tiene permiso de armar pedidos (almacenero, administrador) crea un pedido **con líneas de la bolsa** y, si procede, **líneas de entrega directa** (p. ej. pan). Un pedido normalmente es del día, pero no se genera solo: se arma a voluntad. Puede haber varios abiertos.
- **R-07 [U]** El pedido se **asigna a un comprador** (usuario de la compañía con permiso de realizar compras) y lleva **divisa y monto entregado** (01).
- **R-08 [U]** Cada línea: producto, **cantidad pedida** (presentación de compra, 03·S-03) y destino: **almacén general** o **tienda**. En las de entrega directa se puede **desglosar por tienda** (20 a la A, 15 a la B) o dejar **general** (total; el reparto se hace al recibir).
- **R-09 [P]** Estados del pedido: `borrador` → `abierto` (asignado) → `en revisión` → `cumplido`; también `devuelto` y `cancelado`.

## 3. Compra
- **R-10 [U]** El comprador abre su pedido abierto y marca, por línea, si **pudo comprar**, la **cantidad realmente comprada** (puede ser menor o mayor a la pedida) y el **costo unitario** (por presentación; el sistema calcula por base).
- **R-11 [U]** Se muestra: gasto por producto, total gastado y **diferencia con el monto entregado**.
- **R-12** El comprador **envía a revisión**. Hasta aquí el stock no cambia (M2-D02).

## 4. Revisión y entrada al stock
- **R-13 [U]** Revisan: el **almacenero o administrador** (destino almacén) y el **administrador de tienda o administrador** (destino tienda). **[P]** No puede revisar quien compró (M2-D09).
- **R-14 [P]** El revisor registra por línea la **cantidad recibida y contada**. Se guardan siempre tres cantidades: pedida, reportada por el comprador y recibida.
- **R-15 [P]** Con diferencias el revisor puede **devolver** el pedido al comprador con nota, o **confirmar** con las diferencias registradas.
- **R-16 [U]** Al **confirmar** (`cumplido`), la cantidad **recibida** entra al stock como lotes con el costo unitario reportado, contenido y divisa. En destino tienda, el lote nace en esa tienda; en entrega general, el revisor reparte.
- **R-17 [P]** La diferencia entre reportado y recibido queda como **faltante o sobrante valorado** (lo pagado y no recibido), visible a quien ve costos.

## 5. Correcciones
- **R-18 [P]** **Antes de confirmar:** se corrige devolviendo el pedido o ajustando lo recibido; todo con trazabilidad.
- **R-19 [P]** **Después de confirmar:** nada se edita. Se registra un **ajuste enlazado al pedido** (motivo, autor, líneas), que genera movimientos de corrección (03·S-15). Requiere permiso de corregir pedidos.
- **R-20 [P]** El costo de un lote no se reescribe; si el costo real era otro, el ajuste lo documenta como corrección de costo con permiso.

## Notificaciones (02)
Solicitud creada y atendida; pedido asignado, enviado a revisión, devuelto y cumplido; faltante detectado.

## Permisos (detalle en 05)
Solicitar reposición, atender solicitudes, trasladar, armar pedidos, realizar compras (asignable), revisar pedidos, corregir pedidos, ver costos.

## Criterios de aceptación
- CA-01: DADO una solicitud con stock suficiente, CUANDO el almacenero la atiende, ENTONCES se genera el traslado y la tienda ve la cantidad en su existencia.
- CA-02: DADO stock parcial, ENTONCES se traslada lo disponible y el resto queda por comprar, pendiente o rechazado, con quién y por qué.
- CA-03: DADO un pedido con monto y divisa, CUANDO el comprador marca costos y cantidades, ENTONCES ve gasto por producto, total y diferencia con el monto.
- CA-04: DADO un pedido en revisión, ENTONCES el stock no cambia hasta confirmar.
- CA-05: DADO un pedido, CUANDO lo revisa quien lo compró, ENTONCES se rechaza.
- CA-06: DADO una confirmación con faltante, ENTONCES entra solo lo recibido y el faltante queda valorado.
- CA-07: DADO una línea de entrega directa desglosada por tienda, ENTONCES cada tienda recibe su cantidad y la confirma su encargado.
- CA-08: DADO un pedido cumplido, CUANDO se detecta un error, ENTONCES solo puede corregirse con un ajuste enlazado y con permiso.
- CA-09: DADO un pedido, ENTONCES todos los estados y decisiones constan en el historial.
