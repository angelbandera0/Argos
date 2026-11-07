# Módulo 2 · Almacén y pedidos — Brief de diseño de interfaces

Documento autocontenido para Claude Design. Pantallas por módulo. Navega con el índice; no hace falta leer todo para diseñar una parte.

## Índice
A. Contexto y lenguaje visual · B. Divisas · C. Notificaciones · D. Existencias y almacén · E. Reposición (tienda y almacén) · F. Pedidos de compra · G. Roles e historial · H. Piezas transversales · I. Entregables

## A. Contexto y lenguaje visual
**Producto:** Argos, sistema de gestión para compañías con sedes y tiendas. Este módulo controla existencias de productos básicos (almacén general y tiendas), reposición y compras. Usuarios en español; pantalla de escritorio (principal), tablet y móvil (el comprador y el encargado de tienda usan móvil).

**Lenguaje visual (ya existente, respetarlo):**
- Claro y sereno: fondo blanco, paneles gris muy claro (#F6F8FA), tarjetas sin bordes ni sombras, separadas por color. Muy redondeado. Sin fondos oscuros ni degradados.
- Rojo = acción y énfasis (botón principal #D92D25, texto blanco). Amarillo = «hoy / en curso / abierto», solo como relleno con texto negro, nunca como texto. Máximo un bloque grande rojo por vista.
- Tipografías Inter Tight (títulos y cifras grandes, ligeras) e Inter. Cifras tabulares en tablas.
- Táctil ≥ 44 px. Nunca información solo por color (estado = color + texto/icono). Sin emojis como iconos.
- Componentes disponibles: cabecera de página con migas y acciones, barra de búsqueda y filtros con chips/píldoras, tabla de datos con acciones por fila, tarjetas de entidad en grilla, indicadores (StatTile), pestañas (subrayadas o segmentadas), acordeones, formularios con resumen lateral, diálogos y confirmación destructiva, alertas, avisos tipo toast, insignias, tooltips, estado vacío, paginador, selector de fechas y rangos, selector múltiple.
- Estados que cada pantalla debe cubrir: cargando (skeleton), vacío (con acción solo si el usuario puede crear), sin coincidencias, error, sin permiso.

**Visibilidad de costos:** hay un permiso «ver costos». Toda pantalla con importes debe tener su **variante sin costos** (las columnas, cifras y totales monetarios no aparecen, sin dejar huecos raros). Se indica en cada pantalla con ⓒ.

**Estados de existencia (tres):** Normal, **Bajo** (cantidad ≤ mínimo, aviso), **Agotado** (cero, énfasis). Siempre color + texto.

## B. Divisas
1. **Lista de divisas.** Tarjetas o tabla: código, nombre, símbolo, decimales, «Predeterminada», estado, nº de denominaciones. Acción: Nueva divisa. Buscador y filtro Activas/Inactivas.
2. **Formulario de divisa.** Código, nombre, símbolo, decimales, predeterminada, estado. Debajo, **sección Denominaciones**: lista editable de valores con tipo (billete / moneda), añadir, desactivar; ordenadas por valor. Resumen lateral con vista previa de cómo se formatea un monto.
3. Confirmaciones: desactivar divisa usada (explica que ya no se ofrecerá en pedidos nuevos); eliminar solo si no tiene datos.

## C. Notificaciones
1. **Campana en la barra superior.** Contador de no leídas. Al abrir: panel con las últimas notificaciones (icono de módulo, título, texto corto, hace cuánto, punto de no leída), «Marcar todas como leídas», «Ver todas». Estado vacío «Estás al día».
2. **Sección Notificaciones.** Lista con grupos por día. Filtros: módulo, operación, prioridad (info / aviso / urgente), leída/no leída, tienda, fecha. Pestañas «Todas / Sin leer». Cada fila: módulo, operación, prioridad, título, texto, tienda, hora, acción «Abrir» que lleva a la entidad. Acciones: marcar leída, marcar todas.
3. **Dashboard.** Dos bloques: «Solicitudes de hoy» (conteo por estado y lista breve con tienda, nº de líneas, estado, hora; enlace a la bandeja) y «Últimas 10 notificaciones» (lista compacta con enlace a la sección).

## D. Existencias y almacén
1. **Existencias del almacén general** (almacenero, administrador). Indicadores: total de productos, bajos, agotados ⓒ valor del inventario. Tabla/tarjetas: producto, categoría, existencia en unidad base, estado (normal/bajo/agotado), mínimo, ⓒ costo promedio, ⓒ valor. Filtros: categoría, estado, búsqueda. Acciones: Entrada inicial, Trasladar a tienda, Dar de baja, Configurar.
2. **Detalle de producto en almacén.** Pestañas: **Lotes** (fecha, origen, cantidad inicial y restante, presentación y contenido usados, ⓒ costo unitario, divisa), **Movimientos** (libro: tipo, cantidad capturada y convertida, lote, motivo, autor, fecha, enlace al pedido/solicitud), **Configuración** (unidad base; presentaciones de compra: nombre y contenido; unidades de movimiento: nombre y equivalencia, p. ej. «1 porción = 0,200 lb»; mínimos por ubicación; vista previa de conversiones), **Historial**. Indicadores: existencia, estado, ⓒ costo de último lote y promedio.
3. **Entrada inicial.** Formulario con resumen: producto, presentación y cantidad, contenido real (editable, con aviso «difiere del habitual»), ⓒ costo por presentación → muestra costo por unidad base calculado, divisa, fecha. Resumen lateral con la conversión («5 sacos × 25 lb = 125,000 lb»). Si lo registra un almacenero: aviso «se notificará a los administradores».
4. **Trasladar a tienda.** Elegir tienda, productos y cantidad en unidad de movimiento; muestra equivalente en base y existencia disponible. **Selector de lote** (si el rol puede): lista de lotes con restante, fecha, ⓒ costo; el más antiguo viene sugerido y marcado; se puede repartir la cantidad entre lotes; aviso al elegir uno distinto del sugerido, con motivo opcional. Confirmación con resumen.
5. **Dar de baja** (diálogo o formulario corto): producto, cantidad, lote, **motivo** (lista estándar + «Otro» con texto obligatorio), resumen del impacto ⓒ valor perdido.
6. **Catálogo de motivos de baja** (administrador): lista editable, estándar marcados, añadir motivos.
7. **Existencias de mi tienda** (administrador de tienda; móvil importante). Lista de productos con cantidad y unidad de movimiento, estado (normal/bajo/agotado), mínimo, filtros por estado y categoría, acción «Solicitar reposición» (por producto y global). **Nunca costos.** Banner si hay agotados.
8. **Entrada directa a tienda** (con permiso): tienda, producto, cantidad, ⓒ costo, fecha; para productos como el pan.
9. **Configurar mínimos**: tabla producto × ubicación con edición en línea y ayuda de qué significa bajo y agotado.

## E. Reposición
1. **Nueva solicitud** (tienda; móvil): buscador de productos, cantidad por producto en su unidad de movimiento, nota, ver existencia actual y estado de cada línea; botón enviar. Puede arrancar desde «Solicitar reposición» en existencias con productos preseleccionados.
2. **Mis solicitudes** (tienda): lista con fecha, nº de líneas, estado; detalle con estado por línea (surtida, por comprar, pendiente, rechazada + motivo) y quién decidió.
3. **Bandeja de solicitudes del día** (almacenero/administrador). Filtros: día (hoy por defecto, con rango), tienda, estado. Agrupada por tienda. **Panel de atención por línea:** producto, cantidad pedida, **existencia en almacén general** al lado, acciones: Trasladar todo / Trasladar parte (cantidad) / Pasar a «por comprar» / Dejar pendiente / Rechazar (motivo). Muestra de un vistazo lo que el stock cubre. Acción masiva «Trasladar todo lo que se pueda».
4. **Bolsa por comprar.** Lista de líneas acumuladas (producto, cantidad total pedida por tienda, antigüedad, tiendas de origen). Selección múltiple y botón «Armar pedido».

## F. Pedidos de compra
1. **Lista de pedidos** (almacenero/administrador): número, fecha, comprador, estado (borrador, abierto, en revisión, cumplido, devuelto, cancelado), nº de líneas, destino, ⓒ monto entregado y gastado. Filtros por estado, comprador, fecha. Para el comprador: «Mis pedidos», con el abierto destacado (amarillo = en curso).
2. **Armar pedido** (formulario ancho con resumen lateral): comprador (solo los elegibles), divisa, ⓒ monto entregado, fecha. **Líneas**: producto, cantidad pedida en presentación de compra (con su equivalente en base), **destino** (almacén general / tienda). Para las de entrega directa: selector **«General / Por tienda»**; en «Por tienda» se reparte la cantidad entre tiendas con total que debe cuadrar. Añadir desde la bolsa y añadir productos de entrega directa. Resumen: nº de líneas, total de unidades, ⓒ monto. Guardar borrador / Asignar.
3. **Mi pedido — compra** (comprador; **móvil primero**). Cabecera con monto, divisa y gastado vs. restante. Cada línea: producto, pedido, destino y controles: ¿comprado? sí/no, cantidad comprada (con aviso «menos / más de lo pedido»), costo unitario por presentación, total de línea. Barra fija inferior con **gasto total, monto entregado y diferencia** (en positivo = sobra, negativo = se excedió, con color + texto) y gasto por producto. Botón «Enviar a revisión» con confirmación y resumen. Estado «Devuelto»: muestra la nota del revisor.
4. **Revisión del pedido** (almacenero / encargado de tienda / administrador). Tabla por línea con tres cantidades: **Pedida · Reportada · Recibida (editable)**, diferencia resaltada, ⓒ costo unitario y total, destino. Para entrega general, repartir entre tiendas. Resumen: ⓒ gastado, faltante/sobrante valorado. Acciones: **Confirmar y sumar al stock** (diálogo con resumen de lo que entrará) y **Devolver al comprador** (nota obligatoria). Bloqueo con mensaje si quien revisa es quien compró.
5. **Detalle de pedido** (solo lectura + línea de tiempo): estados con quién y cuándo (armado, asignado, enviado, devuelto, confirmado), tablas de líneas con las tres cantidades, ⓒ importes, enlaces a las solicitudes y lotes creados.
6. **Corregir pedido cumplido** (administrador): formulario de ajuste enlazado: línea, tipo (cantidad / costo), valor correcto, motivo obligatorio; muestra el efecto en stock antes de confirmar.

## G. Roles e historial
1. **Formulario de rol** (existente, ampliar): secciones por módulo nuevo (Divisas, Existencias, Solicitudes, Pedidos, Notificaciones). Cada módulo con ver / crear / editar / eliminar y debajo **permisos especiales** como interruptores con descripción corta: ver costos, elegir lote, entrada inicial, entrada directa, trasladar, dar bajas (almacén / tiendas), ajustar, configurar unidades, configurar mínimos, solicitar, atender solicitudes, armar pedidos, realizar compras, revisar pedidos (almacén / tienda), corregir pedidos. Resumen lateral con lo que el rol podrá hacer, y aviso destacado si incluye «ver costos».
2. **Historial** (existente, ampliar): nuevos módulos y tipos de operación como filtros; «Ver cambios» muestra antes → después; ⓒ los valores monetarios no aparecen sin permiso.

## H. Piezas transversales
- **Selector de cantidad con unidad:** campo numérico + selector de presentación/unidad + equivalente en base debajo («= 125,000 lb»). Usado en entradas, traslados, solicitudes y compras.
- **Selector de lote:** lista de lotes con sugerido (PEPS) marcado y reparto de cantidad.
- **Insignias de estado:** existencia (normal, bajo, agotado), solicitud/línea, pedido.
- **Línea de tiempo** de estados.
- **Etiqueta «sin costo conocido»** para stock de apertura sin costo.
- **Valores monetarios** con el formato de la divisa; sin costos = ocultos, no «0».

## I. Entregables esperados
Por cada pantalla: versión escritorio y móvil (tablet si cambia), estados vacío / cargando / error, variante sin costos ⓒ, y los diálogos de confirmación indicados. Prioridad de diseño: 1) Mi pedido — compra (móvil), 2) Bandeja de solicitudes, 3) Existencias de mi tienda (móvil), 4) Revisión del pedido, 5) Armar pedido, 6) Existencias del almacén y detalle, 7) resto.
