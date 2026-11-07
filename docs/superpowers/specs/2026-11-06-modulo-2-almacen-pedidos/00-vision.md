# 00 · Visión y decisiones transversales

## Intención
Hoy el catálogo existe (Módulo 1) pero no se sabe qué hay, cuánto cuesta ni cómo se repone. Este módulo lleva el control de las existencias de productos básicos desde que se piden hasta que llegan a las tiendas, con trazabilidad completa y costos reales por compra, para tener estadísticas fiables más adelante.

## Objetivos
- Stock por ubicación (almacén general y tiendas) con costo real por lote.
- Reposición ordenada: la tienda solicita, el almacén surte lo que puede, el resto se compra.
- Compras con monto entregado, gasto real por producto y diferencia, verificadas antes de sumarse al stock.
- Trazabilidad de todo (quién, qué, cuándo, por qué) en el historial.
- Notificaciones útiles entre módulos.
- Todo configurable por roles creados por el administrador.

## No-objetivos (por ahora)
Tasas de cambio; proveedores como entidad; ventas, caja y turnos; recetas y consumo por producción (el movimiento queda reservado); cobertura de existencias según consumo; desglose de billetes en el pedido (solo se registran las denominaciones).

## Anti-objetivos (sería un fallo aunque funcione)
- Que el stock cambie sin un movimiento registrado, o que un movimiento se edite o borre.
- Que un encargado de tienda sin permiso vea costos, por la UI, la API o el MCP.
- Que un pedido sume stock antes de su revisión.
- Que el mismo usuario compre y confirme el mismo pedido.

## Flujo de punta a punta
```
Tienda: ve existencias/alertas → solicita reposición
Revisor (almacenero/admin): ve las solicitudes → traslada lo que hay en stock → el resto: por comprar / pendiente / rechazada
Revisor: arma pedido con líneas de la bolsa → asigna comprador, divisa y monto
Comprador: compra → marca por línea lo comprado, cantidad y costo unitario → envía a revisión
Revisor del destino: cuenta lo recibido → confirma (entra al stock como lotes) o devuelve
Posterior: correcciones solo con ajuste enlazado
```
Excepciones: entrada directa a tienda (p. ej. pan) por pedido con destino tienda o registro directo con permiso; entrada inicial de apertura.

## Decisiones transversales
- **M2-D01 [U]** Una sola moneda por ahora, sin tasas de cambio (ver 01).
- **M2-D02 [U]** El stock solo cambia al confirmar la revisión de un pedido, una entrada inicial/directa, un traslado, una baja o un ajuste.
- **M2-D03 [U]** El costo de un producto varía por compra; se guarda por lote.
- **M2-D04 [U]** Los costos son información reservada a quien tenga el permiso «ver costos»; vale para UI, API y MCP.
- **M2-D05 [U]** Los roles nuevos (almacenero, comprador, administrador de tienda, etc.) los crea el administrador; ninguno es fijo en código. Todo permiso nuevo es configurable por rol.
- **M2-D06 [U]** Toda operación deja trazabilidad en el historial (DR-017).
- **M2-D07 [P]** El libro de movimientos es inmutable; los errores se corrigen con movimientos contrarios o ajustes enlazados.
- **M2-D08 [P]** Las cantidades se guardan en unidad base con la cantidad capturada junto a la convertida.
- **M2-D09 [P]** Quien compra no puede revisar el mismo pedido.

## Preguntas abiertas
- **M2-Q01** ¿Los «productos básicos» son productos del catálogo (DR-016) marcados como almacenables, o una entidad aparte? Por defecto: mismo producto del catálogo con configuración de almacén.
- **M2-Q02** ¿Un almacén general por compañía o por sede? Por defecto: por compañía.
- **M2-Q03** Notificaciones: tiempo real o al entrar/recargar el panel. Por defecto: al cargar; se debate después.
- **M2-Q04** ¿El encargado de tienda confirma la recepción de un traslado desde el almacén? Por defecto: no, entra directo con trazabilidad.
- **M2-Q05** Unidad base de volumen por defecto (litro propuesto) y de conteo (unidad).
- **M2-Q06** Tras el redondeo a 3 decimales de conversiones (p. ej. 1 lb = 3 porciones), ¿se acepta o la porción pasa a ser la base de ese producto?
- **M2-Q07** Retención de notificaciones leídas y alcance de «ver todas».
- **M2-Q08** ¿Qué líneas de un pedido no compradas vuelven a la bolsa? Por defecto: todas, como pendientes.

## Decisiones técnicas tomadas tras la revisión externa [P]
- **M2-D10** Un lote siempre pertenece a una ubicación. En entrega «general» el pedido no se puede confirmar hasta repartir el total entre tiendas (04·R-16).
- **M2-D11** Un traslado crea en la tienda un lote por cada lote de origen usado, conservando su costo y fecha; no se promedia.
- **M2-D12** Una línea de solicitud puede tener varias asignaciones (surtida, por comprar, pendiente, rechazada) que suman la cantidad pedida; el estado de la línea se deriva de ellas.
- **M2-D13** Las ubicaciones son un solo concepto: el almacén general y las tiendas son filas de la misma entidad, con tipo. El producto de catálogo se marca como almacenable (M2-Q01).
- **M2-D14** Los permisos con alcance de ubicación se definen en el rol (¿almacén general? sí/no) y se combinan con las tiendas asignadas al usuario para las tiendas.
- **M2-D15** Los costos viven separados de las cantidades (tabla o vista propia) con acceso condicionado a «ver costos» en la base de datos, no solo en la aplicación; UI, API y MCP leen por esa vía.
- **M2-D16** Todo movimiento de stock se escribe con funciones atómicas en la base de datos con bloqueo de filas; el stock nunca es negativo y un conflicto se informa para reintentar.
