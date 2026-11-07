# Argos · Módulo 2 — Almacén y pedidos

**Adenda a `DESIGN.md`.** Aquí solo está lo nuevo del módulo 2. Todo lo que no se menciona (colores base, tipografía, botones, campos, tablas, diálogos, filtros 6.34, formularios 6.37…) sigue igual que en `DESIGN.md`. La numeración de componentes continúa en **6.43**.

Tableros de referencia en el lienzo: filas «Módulo 2 · …» (archivos `M2-*.dc.html`). Cada pantalla con importes tiene su copia «· sin costos».

---

## M1. Reglas nuevas del lenguaje visual

1. **Secciones sin borde ni sombra.** En el módulo 2, las secciones de formulario y los bloques de contenido van sobre `--color-panel` (#F6F8FA), radio 24, padding 20–24, **sin borde**. Lo que va dentro (filas, campos, tablas) es blanco. Así las superficies se separan por color.
   - Excepción: los listados largos a pantalla completa usan un contorno de 1 px `inset 0 0 0 1px --color-line-soft` en lugar de fondo, para que la tabla no quede «flotando».
   - Esto reemplaza, solo para este módulo, el borde de 1 px de las tarjetas de sección de 6.37.
2. **Amarillo relleno (`--color-yellow` #FFC93C) con texto negro solo significa «hoy / en curso / abierto».** Se usa en:
   - el pedido abierto;
   - el filtro de fecha «Hoy»;
   - el estado «Sin atender»;
   - el paso actual de una línea de tiempo.
   
   Nunca se usa como texto ni para decir «sugerido» o «predeterminado»: esos casos van en rojo tint (`--color-red-tint` + `--color-red-hover`).
3. **Máximo un bloque rojo grande por vista.** Es el botón principal, o la barra fija con la acción principal.
   - Un banner de alerta con su propia acción usa un botón de **contorno** (borde `--color-danger-border`, texto `--color-red-hover`), no otro rojo relleno.
   - Las acciones rojas pequeñas por fila (40 px) sí están permitidas.
4. **Táctil ≥ 44 px** en todo: botones, pasos de cantidad (−/+ de 40 px dentro de un campo de 48 px), interruptores dentro de filas de 44 px o más.
5. **Estado = color + texto + icono**, siempre. Las insignias (6.45) llevan un icono de 12 px.
6. **Sin emojis ni fondos oscuros.**
   - El negro (`--color-ink`) solo aparece en tres sitios: el segmento elegido de un control segmentado, el paso «hecho» de una línea de tiempo y los avisos tipo toast.
   - Ninguno de esos casos es un bloque grande.

---

## M2. Tokens nuevos

Están en `tokens-modulo2.css`, que se importa después de `tokens.css`.

| Token | Valor | Uso |
|---|---|---|
| `--stock-normal-bg` / `-fg` | #E6F4EC / #1E7A50 | Insignia Normal |
| `--stock-low-bg` / `-fg` | #FFF4CF / #7A5200 | Insignia Bajo (aviso) |
| `--stock-out-bg` / `-fg` | #FFE6E4 / #B3221B (texto 700) | Insignia Agotado (énfasis) |
| `--state-open-bg` / `-fg` | #FFC93C / #1C1C1E | «Abierto · en curso», «Sin atender», «Hoy» |
| `--state-review-ring` | #C9CDD3 | «En revisión» y «Por comprar»: blanco con contorno |
| `--state-draft-ring` | #E4E6EA | «Borrador» y «Pendiente»: panel con contorno suave |
| `--diff-row-bg` | #FFF7F6 | Fila con diferencia entre lo reportado y lo recibido |
| `--coverage-full` / `-part` / `-none` | #1E7A50 / #E0A800 / transparente | Barra de cobertura de stock |
| `--lot-suggested-bg` / `-fg` | #FFE6E4 / #B3221B | Chip «Sugerido · más antiguo» |
| `--toast-bg` | #1C1C1E | Avisos breves de confirmación |

---

## M3. Cifras, unidades y dinero

- **Separadores:** miles con «.» y decimales con «,». Las cifras siempre usan `font-variant-numeric: tabular-nums` y van alineadas a la derecha en tablas.
- **Cantidades en unidad base**, con decimales fijos por unidad:
  - lb, kg y L: 3 decimales (`125,000 lb`);
  - g y unidades: 0 decimales (`5.000 g`).
- **Cantidad capturada + equivalente.** Lo que el usuario escribe está en su presentación o unidad de movimiento («4 sacos de 25 lb», «6 botellas de 1 L»). Debajo, en 12–13 px `--color-muted`, va el equivalente en base: «= 100,000 lb».
- **Dinero:** `12.500,00 CUP` (código detrás).
  - Se usa el símbolo (`$ 12.500,00`) solo donde ya está claro cuál es la divisa: la vista previa de la divisa y los totales de un pedido de una sola divisa.
  - Los decimales salen de la divisa.
- **Costo por unidad base:** siempre que se escriba un costo por presentación, debajo aparece «= 32,00 CUP por lb».
- **Sin costo conocido.** Es el stock de apertura sin costo.
  - Se muestra como chip con contorno «Sin costo conocido»; nunca como `0,00`.
  - No suma en el valor del inventario, y el pie de la tabla lo dice: «El valor no incluye 40,000 lb de sal sin costo conocido».

### Variante sin costos (ⓒ)

Se aplica cuando el usuario no tiene el permiso «Ver costos». Se marca en la pantalla con la prop `costs: false`.

- Desaparecen las columnas de costo y valor, los indicadores de valor, el bloque Entregado · Gastado · Sobrante, el «Monto entregado», el «Valor perdido» y los importes del historial.
- **No se deja ningún hueco:** la tabla y la rejilla se reajustan, y los números de sección se recalculan («1, 2, 3» pasa a «1, 2»).
- En el historial, los cambios de importe ocultos se resumen así: «1 cambio de importe oculto: necesitas el permiso «Ver costos»».
- El texto de notificaciones y avisos también cambia: «Luis terminó la compra: 5 líneas» en lugar de citar el importe.
- **El comprador siempre ve los costos de su propio pedido**, porque es quien los escribe.

---

## M4. Navegación

### Sidebar con secciones

Usa el patrón de 6.30. Las secciones y sus elementos son:

| Sección | Elementos |
|---|---|
| GENERAL | Inicio · Notificaciones |
| ALMACÉN | Existencias · Solicitudes · Pedidos |
| CATÁLOGO | Productos · Categorías · Divisas |
| ADMINISTRACIÓN | Compañías · Roles · Usuarios · Historial |

- Los elementos miden 44 px. La sección se escribe en mayúsculas, 11 px 600, `--color-muted`.
- **Contadores en el menú.** Píldora de 22 px a la derecha del elemento, solo en Solicitudes (las que están sin atender).
  - Inactivo: fondo blanco y texto ink.
  - Activo: rojo relleno con texto blanco.
  - Lleva texto oculto « sin atender».
- Iconos nuevos (trazo de 2 px):
  - Existencias: almacén con tejado.
  - Solicitudes: portapapeles.
  - Pedidos: bolsa.
  - Divisas: billete.
  - Notificaciones: campana.

### Móvil: barra inferior por rol

Es una barra fija de 56 px sobre `--color-panel`, radio 24, con margen de 12 px. El elemento activo es blanco, con icono y texto rojos.

| Rol | Pestañas |
|---|---|
| Encargado de tienda | Inicio · Existencias · Solicitudes · Más |
| Comprador | Mis pedidos · Avisos · Perfil |
| Almacenero | Inicio · Bandeja · Almacén · Pedidos |

- **Cabecera móvil:**
  - a la izquierda, volver (44 px, panel) o el logo;
  - en el centro, el contexto en 12 px y el título en Inter Tight 22 px;
  - a la derecha, la campana con contador.

---

## M5. Notificaciones

- **Campana** (barra superior, 44 px):
  - Muestra un contador rojo de no leídas con borde blanco de 2 px.
  - `aria-label` «Notificaciones, 3 sin leer».
  - Abierta, la campana pasa a fondo `--color-red-tint`.
- **Panel flotante** (400 px, radio 24, `--shadow-popover`). De arriba abajo:
  - **Cabecera:** «Notificaciones» y «Marcar todas como leídas» (Texto rojo).
  - **Filas:**
    - icono del módulo en caja de 36 px (urgente: rojo tint);
    - título (600 si no está leída);
    - texto corto;
    - meta: insignia de prioridad, «hace 5 min» y la tienda;
    - a la derecha, un punto rojo de 9 px si no está leída.
  - **Pie:** «Ver todas», a todo el ancho.
  - Si no queda nada sin leer, el panel muestra arriba «Estás al día» en éxito.
- **Prioridad:**

  | Prioridad | Fondo | Texto |
  |---|---|---|
  | Info | panel | `--color-ink-2` |
  | Aviso | `--color-warning-tint` | `--color-warning-text` |
  | Urgente | `--color-danger-tint` | `--color-danger-text` |

- **Sección Notificaciones:**
  - Pestañas subrayadas «Todas / Sin leer», con contador.
  - Filtros (6.34): Módulo, Operación, Tienda, Fecha y chips de prioridad.
  - Agrupada por día con un overline: «HOY · VIERNES 6 DE NOVIEMBRE».
  - Cada fila lleva «Abrir →» (Contorno, lleva a la entidad) y un check para marcarla como leída. La fila sin leer tiene fondo blanco sobre el panel.
- **Dashboard.** Lleva dos bloques en panel:
  - **«Solicitudes de hoy»:**
    - 4 cifras: Sin atender (amarillo), En parte, Atendidas y Productos;
    - una lista breve con tienda, nº de productos, estado y hora;
    - el enlace «Ir a la bandeja →».
  - **«Últimas 10 notificaciones»:** filas compactas de 40 px con punto, prioridad, título en una línea y hora, más el enlace «Ver todas →».

---

## M6. Componentes nuevos

### 6.43 Selector de cantidad con unidad

Se usa en entradas, traslados, solicitudes y compras.

- **Escritorio:** número de 72–90 px (centrado, 600) + select de presentación o unidad («sacos de 25 lb») + debajo «= 125,000 lb».
- **Móvil:** paso a paso dentro de una píldora de 48 px (− y + de 40 px sobre panel, cifra 17 px 600 en el centro) + chip de unidad.
- **Error:** si se supera lo disponible, el campo lleva borde rojo de 2 px y fondo `--color-field-error-bg`, y la línea de abajo cambia a «Solo hay 125,000 lb» (rojo 600). El botón de acción queda desactivado.

### 6.44 Selector de lote (PEPS)

- **Cerrado:** una línea en panel: «Sale de L-0017 (el más antiguo primero)» + «Elegir lote» (Texto rojo). Esta opción solo aparece si el rol tiene «Elegir lote».
- **Abierto:** una fila blanca de 14 px de radio por lote:
  - código en monoespaciado;
  - chip «Sugerido · más antiguo» (rojo tint) en el primero;
  - meta «28 oct · entrada inicial · quedan 25,000 lb · 32,00 CUP/lb» (el costo, solo con permiso);
  - campo de libras a la derecha.

  Una fila con cantidad lleva contorno rojo de 1,5 px.
- **Debajo:**
  - **Total repartido:** «Repartido 30,000 de 30,000 lb» (éxito) o, si no cuadra, en rojo.
  - **Aviso de lote no sugerido:** si se reparte saltando el lote sugerido, aparece «No sale del lote más antiguo» en amarillo tint, con un campo «Motivo (opcional)».
  - **Volver al sugerido:** «Usar el sugerido» lo restablece.

### 6.45 Insignias de estado

Todas miden 26 px y tienen radio de píldora.

| Familia | Estados (icono) |
|---|---|
| Existencia | Normal (✓, éxito) · Bajo (!, aviso) · Agotado (✕, rojo tint, texto 700) |
| Línea de solicitud | Pendiente (reloj, panel + contorno) · Surtida (✓, éxito) · Surtida en parte (—, aviso) · Por comprar (bolsa, blanco + contorno) · Rechazada (✕, rojo tint) |
| Solicitud | Sin atender (amarillo relleno) · Atendida en parte (aviso) · Surtida (éxito) |
| Pedido | Borrador (lápiz, panel + contorno) · Abierto · en curso (reloj, **amarillo relleno**) · En revisión (lupa, blanco + contorno) · Devuelto (flecha atrás, rojo tint) · Cumplido (✓, éxito) · Cancelado (✕, panel, texto muted) |

### 6.46 Línea de tiempo de estados

- **Horizontal** (cabeceras): círculos de 28 px unidos por una línea de 2 px.
- **Vertical** (detalle): círculos de 26 px con una línea de 2 px `--color-ring`. Cada paso lleva título 600, «quién · cuándo» en muted y, si hay nota, la nota entre comillas en una caja blanca.
- **Estados del paso:**
  - Hecho: negro con check blanco.
  - Ahora: amarillo con reloj.
  - Devuelto: rojo tint con flecha.
  - Confirmado: éxito con check.
  - Por venir: blanco con contorno.

### 6.47 Bloque Entregado · Gastado · Sobrante

Es el mismo bloque en compra, revisión y detalle.

- Tres celdas: Entregado y Gastado son neutras (blanco o panel). El **Sobrante** es la celda resaltada:
  - Si es positivo, va en éxito: «Sobrante» y «+3.400,00».
  - Si es negativo, va en rojo tint: «Excedido» y «−450,00».
- La palabra cambia junto con el color, así que nunca depende solo del color.
- Debajo, opcional, «Gasto por producto»: filas con nombre, importe y una barra roja de 6 px proporcional al gasto.

### 6.48 Cobertura de stock

Se usa en la bandeja.

- Junto a lo que hay en el almacén aparece un chip:
  - «Cubre todo» (éxito);
  - «Cubre 8,000 lb» (aviso);
  - «Sin existencia» (rojo tint).
- Debajo, una barra de 6 px de 200 px de ancho con la proporción cubierta.
- El cálculo descuenta las decisiones ya tomadas en el mismo día, para que se vea lo que todavía queda.

### 6.49 Barra de decisiones pendientes

- Es una píldora blanca flotante (`position: sticky; bottom: 16px`, sombra flotante): «5 decisiones listas · 3 traslados · 1 por comprar · 1 rechazo» + «Deshacer todo» (Contorno) + «Aplicar decisiones» (Primario).
- En móvil es una barra oscura compacta encima de la navegación, con «Aplicar». Es la única superficie oscura del módulo.

### 6.50 Reparto por tienda

- Es una fila en panel: «Repartir entre tiendas» + un campo numérico de 72 px por tienda + un chip de resultado.
  - Si cuadra: «Cuadra: 2 de 2» (éxito).
  - Si no cuadra: «Faltan 1 por repartir» (rojo), y todos los campos se pintan de error.
- Mientras no cuadre, la acción principal está bloqueada, y la lista de comprobación lo dice.

### 6.51 Tarjeta-interruptor

- Es una opción de ancho completo con `role="switch"`: icono en caja de 44 px + título + descripción + interruptor de 46×28.
- Activa:
  - si la opción es buena, fondo `--color-success-tint`;
  - si es delicada (como «Ver costos»), fondo `#FFF4F3` y borde `--color-danger-border`.
- En listas de permisos especiales se usa la versión compacta: filas de 56 px dentro de una caja blanca e interruptor de 38×24.

### 6.52 Tabla de tres cantidades

Se usa en revisión y detalle.

- Las columnas Pedida · Reportada · Recibida van alineadas a la derecha; en la revisión, Recibida es editable (campo de 72 px).
- Columna «Diferencia», calculada como Recibida − Reportada:
  - «Coincide» (éxito);
  - «−1 saco» (rojo tint, 700);
  - «Faltante del pedido» (neutro) cuando no se compró.
- La fila con diferencia lleva fondo `--diff-row-bg`.

---

## M7. Pantallas

Para cada pantalla se indica el tablero, el estado de ejemplo (el que se ve al abrir el tablero) y solo lo que no estaba ya cubierto por los patrones existentes.

### Prioridad 1 · Mi pedido — compra (móvil primero) · `M2-Compra-Movil`

- **Cabecera:** volver + «Pedido P-0142» + «Asignado por Raul · hoy 08:30» + insignia «Abierto · en curso» + «3 de 4 comprados».
- **Si está devuelto**, arriba aparece un aviso en rojo tint: «Te lo devolvieron para corregir», la nota del revisor entre comillas y quién y cuándo. El botón final pasa a decir «Reenviar a revisión».
- **Bloque de dinero** (panel):
  - «MONTO ENTREGADO» en Inter Tight 32;
  - medidor de 10 px de lo gastado (negro; rojo si se excede);
  - «Gastado X» y «Restante X» o «Excedido X».
- **Tarjeta por producto** (panel, radio 24):
  - icono, nombre, «Pedido: 4 sacos de 25 lb = 100,000 lb», destino con icono de camión y total de la línea a la derecha;
  - control segmentado **«¿Lo compraste?» Sí / No** de 44 px (elegido: negro);
  - **con Sí:** Cantidad comprada (6.43, móvil) + «Costo por saco» en CUP y debajo «= 34,00 CUP por lb». Si no coincide con lo pedido: «2 cajas menos de lo pedido» o «1 más de lo pedido» en amarillo tint;
  - **con No:** «No lo compraste. Quedará como faltante en la revisión.»;
  - **sin marcar:** «Marca si lo compraste para poder enviar.» (aviso).
- **Filtros:** «Todos / Sin marcar», con contador.
- **Al final:** el bloque 6.47 con gasto por producto.
- **Barra fija inferior** (blanca, radio 28 arriba, sombra hacia arriba): «Gastado de 20.000,00 CUP» + cifra grande + chip «Sobran 3.400,00» o «Excedido…» + **«Enviar a revisión»**. Se desactiva y avisa «Falta marcar 1 producto» si queda algo sin marcar.
- **Confirmación:** hoja inferior «¿Enviar a revisión?» con el resumen (comprados, no comprados, gastado, sobrante a devolver) y los botones «Seguir editando» / «Enviar». Después se muestra un toast: «Enviado a revisión».

### Mis pedidos (comprador, móvil) · `M2-Mis-Pedidos-Movil`

- **Pedido en curso:** tarjeta grande **amarilla** (radio 28) con «EN CURSO», número, gastado de entregado, una barra negra y el botón negro «Continuar compra».
- **Debajo:** «Anteriores», en filas de panel con número, fecha, resumen, insignia e importe.
- **Pedido devuelto:** sube arriba del todo como «Requiere tu atención».

### Prioridad 2 · Bandeja de solicitudes del día · `M2-Bandeja` (+ `M2-Bandeja-Movil`)

- **Filtros:**
  - fecha («Hoy, 6 nov», amarillo; abre el datepicker con rango);
  - tienda;
  - chips «Sin atender / Atendidas / Todas».
- **Indicadores:**
  - Solicitudes de hoy;
  - Productos pedidos;
  - **Lo cubre el almacén «6 de 11»**, con medidor;
  - Sin atender (amarillo).
- **Aviso de acción masiva** (panel): «El almacén puede cubrir, completas o en parte, 7 de las 10 líneas sin atender» + **«Trasladar todo lo que se pueda»** (Contorno). Asigna stock por orden de llegada.
- **Un grupo por tienda** (panel, se puede plegar):
  - cabecera con icono de tienda, nombre, «SOL-0311 · 08:12 · Ana Rodríguez», nota de la tienda entre comillas y un chip «4 productos · 2 sin atender» (amarillo) o «atendida» (éxito);
  - por línea: producto, «Pide 4 bolsas de 5 lb = 20,000 lb», en almacén con cobertura (6.48) y decisión.
- **Decisión de cada línea:**
  - Botón principal pequeño: «Trasladar todo», o «Trasladar 8,000 lb» si solo cubre una parte. Si no hay stock, pasa a ser «Pasar a por comprar» (Contorno).
  - Menú ⋯: Trasladar una parte · Pasar a por comprar · Dejar pendiente · Rechazar…
  - «Trasladar una parte» y «Rechazar» abren un formulario **en la misma fila**, sobre fondo `#FFF4F3`: cantidad con su máximo, o motivo en un select.
  - Una línea decidida muestra un chip con la decisión («Trasladado · 20,000 lb», «Rechazado · Ya se envió hace poco») + «Deshacer».
- **Aplicar:** las decisiones se acumulan en la barra 6.49 y se aplican juntas.
- **Móvil:** las mismas reglas, pero cada línea es una tarjeta blanca y los grupos son acordeones.

### Prioridad 3 · Existencias de mi tienda (móvil) · `M2-Existencias-Tienda-Movil`

- **Nunca muestra costos.**
- **Banner de agotados** (rojo tint): «2 productos agotados · Aceite de soya y Leche en polvo» + «Solicitar reposición de los agotados» (Contorno rojo), que los marca todos.
- **Filtros:** buscador de 48 px + chips de estado con contador (Todos / Bajos / Agotados) + chips de categoría con desplazamiento horizontal (elegida: negro).
- **Tarjeta por producto:**
  - nombre, «Granos · mín. 10 bolsas»;
  - a la derecha, la cantidad en unidad de movimiento en Inter Tight 22 (en rojo si está agotado) y el equivalente en base;
  - insignia de estado + «Solicitar» (Contorno), que al pulsarlo pasa a «En la solicitud» (rojo relleno, con check); la tarjeta se tiñe `#FFF4F3`.
- **Botón fijo:** «Solicitar reposición · 3 productos» abre la nueva solicitud con esos productos ya cargados.

### Nueva solicitud (tienda, móvil) · `M2-Nueva-Solicitud-Movil`

- Nota inicial: «Vienen marcados los productos bajos y agotados que elegiste».
- **«Añadir producto»:** buscador con desplegable de resultados (nombre, «Hay 6 bolsas», insignia y +).
- **Tarjeta por línea:** insignia + «Hay 1 bolsa · mín. 4», cantidad (6.43, móvil), unidad y equivalente; se quita con ✕.
- **Al final:** Nota (opcional) y botón fijo «Enviar solicitud · 3 productos», desactivado si no hay productos.

### Mis solicitudes (tienda, móvil) · `M2-Mis-Solicitudes-Movil`

- Cada solicitud es un acordeón con número, fecha, insignia de la solicitud y nº de productos.
- **Cada línea** muestra:
  - lo pedido;
  - su insignia (6.45);
  - quién la decidió y cuándo («Raul la trasladó hoy 10:05», «En el pedido P-0142»);
  - si fue rechazada, el **motivo** en rojo tint.

### Prioridad 4 · Revisión del pedido · `M2-Revision-Pedido` (+ sin costos, + `-Bloqueo`)

- **Cabecera:** migas + «Revisar pedido P-0139» + insignia «En revisión» + «Comprado por Luis Martín · enviado hoy 15:40».
- **Contenido:** bloque 6.47 (ⓒ) y la tabla 6.52 «Lo que llegó».
- **Entrega directa «General»:** debajo de la fila, el reparto por tienda (6.50).
- **Lateral, «AL CONFIRMAR ENTRARÁ»:**
  - por producto y destino, «+100,000 lb» en éxito;
  - ⓒ Gastado y **Faltante valorado** («3.100,00 CUP · 1 saco»);
  - lista de comprobación (el reparto cuadra).
- **Acciones:**
  - «Confirmar y sumar al stock» (Primario) abre un diálogo con lo que entrará y avisa que se crea un lote por línea y que solo un administrador podrá corregirlo.
  - «Devolver al comprador» (Contorno rojo) abre un diálogo con una **nota obligatoria** de 10 caracteres como mínimo.
- **Bloqueo:** si quien revisa es quien compró, aparece arriba un aviso en rojo tint con candado: «No puedes revisar este pedido. Tú lo compraste…». Los campos y las acciones quedan desactivados.

### Prioridad 5 · Armar pedido · `M2-Armar-Pedido` (+ sin costos)

- **Sección 1:**
  - Comprador (select con «Solo usuarios con permiso «Realizar compras»»);
  - Divisa;
  - ⓒ Monto entregado (con el código de la divisa como sufijo);
  - Fecha de compra.
- **Sección 2, Productos.** Botones «Añadir desde la bolsa (n)» y «Entrega directa».
  - Cada línea es una fila blanca con producto, origen («De la bolsa · Tienda 23 y L (6 L), …»), cantidad + presentación + «= 12,000 L», chip de destino y papelera.
  - **Entrega directa:** control segmentado «General / Por tienda». Con «Por tienda», el reparto (6.50) debe cuadrar con la cantidad.
- **Lateral:**
  - Productos, Presentaciones y ⓒ Monto entregado (en Inter Tight 26);
  - «Luis Martín recibirá una notificación…»;
  - lista de comprobación;
  - **«Asignar a Luis»** (el nombre se incluye en el botón) y «Guardar borrador».

### Lista de pedidos · `M2-Pedidos-Lista` (+ sin costos)

- **Acciones de cabecera:** «Bolsa por comprar (4)» (Contorno con contador) y «Armar pedido».
- **Pestañas subrayadas por estado**, con contador: Todos, Borrador, Abiertos, En revisión, Devueltos, Cumplidos, Cancelados.
- **Filtros:** número, comprador y fecha.
- **Tabla:** Nº, Fecha, Comprador (avatar), Estado, Productos, Destino, ⓒ Entregado, ⓒ Gastado y chevron.

### Bolsa por comprar · `M2-Bolsa-Comprar`

- **Tabla con selección:**
  - total pedido;
  - chips por tienda («23 y L · 6 L»);
  - existencia en almacén;
  - antigüedad: «desde hace 2 días» va en aviso cuando pasa de 1 día.
- **Barra de selección:** «2 productos seleccionados» + «Armar pedido».

### Detalle de pedido · `M2-Pedido-Detalle` (+ sin costos)

- **Contenido:**
  - solo lectura;
  - bloque 6.47;
  - tabla de tres cantidades con el **lote creado** como enlace en monoespaciado;
  - «Origen»: chips enlazados a las solicitudes («SOL-0305 · Tienda 23 y L»).
- **Lateral:** línea de tiempo vertical (6.46).
- **Acción «Corregir»:** Contorno, solo para administradores.

### Corregir pedido cumplido · `M2-Corregir-Pedido`

- **Formulario:**
  - Línea (select con «4 sacos recibidos · lote L-0021»);
  - «Qué corriges»: Cantidad / Costo (segmentado);
  - valor registrado (gris, solo lectura) y valor correcto;
  - **Motivo obligatorio.**
- **Lateral, «EFECTO ANTES DE CONFIRMAR»:** filas «antes ~~tachado~~ → después» para el lote, la existencia y ⓒ el total o el costo.
- **Bloqueo:** si el lote ya dio salida a más de lo que quedaría, aparece un aviso de error y se bloquea «Aplicar corrección».

### Prioridad 6 · Existencias del almacén general · `M2-Existencias-Almacen` (+ sin costos)

- **Acciones:** Trasladar a tienda · Dar de baja · Configurar (botón de icono con `aria-label`) · **Entrada inicial** (Primario).
- **Indicadores:** Productos · Bajos · Agotados · ⓒ Valor del inventario (con «1 producto sin costo conocido»).
- **Tabla:** Producto + «Unidad base: lb», Categoría, Existencia (en rojo si es 0), Estado, Mínimo, ⓒ Costo promedio / lb, ⓒ Valor y ⋯. El pie aclara qué no entra en el valor.

### Detalle de producto en almacén · `M2-Producto-Almacen` (+ sin costos, + `-Config`)

- **Cabecera:** migas + nombre + insignia + «Granos · unidad base lb».
- **Indicadores:** Existencia (con su equivalente en bolsas), Estado (con el mínimo), ⓒ Costo del último lote y ⓒ promedio.
- **Pestañas** subrayadas:
  - **Lotes:** chip «Sale primero» en el lote PEPS. El restante lleva una barra (negra en el PEPS); el agotado se ve atenuado. Columnas de presentación usada y ⓒ costo unitario.
  - **Movimientos:** libro con tipo (Entrada en éxito, Traslado neutro, Baja en rojo tint, Ajuste en aviso), lo capturado («4 bolsas (5 lb) → Tienda 23 y L»), lo convertido con signo y en el color del tipo, el lote, el motivo o un enlace a SOL o Pedido, y el autor.
  - **Configuración:**
    - unidad base (bloqueada si hay movimientos, con candado y motivo);
    - presentaciones de compra;
    - unidades de movimiento («1 porción = 0,200 lb»);
    - mínimos por ubicación;
    - **vista previa de conversiones**: cantidad + unidad, y como resultado chips «= 75,000 lb · = 15 bolsas · = 375 porciones».
  - **Historial:** filas «Raul cambió el mínimo del almacén: ~~40,000 lb~~ → **50,000 lb**».

### Entrada inicial · `M2-Entrada-Inicial` (+ sin costos)

- **Producto y cantidad:**
  - Producto, Presentación y Cantidad;
  - **Contenido real** de cada uno: si difiere del habitual, el borde y el fondo pasan a aviso y aparece «Difiere del habitual (25 lb). Se guardará solo en este lote.».
- **ⓒ Costo:**
  - costo por presentación + divisa;
  - debajo, «= 32,65 CUP por lb» en 600;
  - casilla «No conozco el costo», que lo marca como «Sin costo conocido».
- **Lateral, «CONVERSIÓN»:** «5 sacos × 24,500 lb» y debajo **«122,500 lb»** en Inter Tight 34. Además:
  - existencia antes → después;
  - ⓒ valor del lote;
  - si lo registra un almacenero, aviso amarillo «Se notificará a los administradores».

### Trasladar a tienda · `M2-Trasladar` (+ sin costos)

- **Tienda destino:** tarjetas radio con «Pidió hoy · SOL-0311».
- **Productos:**
  - cantidad en unidad de movimiento + equivalente;
  - «Disponible en almacén»;
  - el selector de lote (6.44) en cada producto.
- **Lateral:**
  - origen → destino con iconos;
  - por producto, la cantidad, su base y los lotes usados;
  - ⓒ Valor trasladado;
  - un error que bloquea si no hay suficiente o si el reparto no cuadra.
- **Confirmación:** diálogo con el resumen. Avisa que, si viene de una solicitud, la línea queda «surtida».

### Dar de baja · Entrada directa · Motivos de baja · `M2-Dialogos-Existencias` (+ sin costos)

- **Dar de baja** (diálogo de 440 px):
  - Producto (con lo que hay), Cantidad + Unidad + equivalente, Lote (el sugerido primero);
  - **Motivo** en píldoras radio: Vencido, Dañado por humedad, Envase roto, Merma natural y Otro. Con «Otro» aparece un texto obligatorio;
  - impacto: existencia antes → después y ⓒ **valor perdido** en rojo;
  - botón «Dar de baja» en estilo **Peligro de contorno**.
- **Entrada directa a tienda:** Tienda, Producto, Cantidad, ⓒ Costo por unidad, Fecha y hora, y ⓒ Total. El texto explica que es para lo que llega directo a la tienda, como el pan.
- **Motivos de baja** (administrador):
  - alta rápida + lista;
  - los estándar llevan un chip con candado «Estándar» y no se borran;
  - los propios se pueden borrar si no se han usado («Sin usar»). Con usos, la papelera queda desactivada.

### Configurar mínimos · `M2-Minimos`

- **Tabla producto × ubicación** con campos en línea de 96 px:
  - un campo modificado lleva borde rojo de 2 px y fondo `#FFF4F3`;
  - el valor 0 lleva contorno punteado (significa sin aviso).
- **Lateral:** «QUÉ SIGNIFICA», con las tres insignias explicadas. Cuando hay cambios aparece «n cambios sin guardar» + «Guardar cambios» / «Descartar».

### Divisas · `M2-Divisas` y `M2-Divisa-Form`

- **Lista:**
  - tarjetas en panel con el código en una caja blanca de 64 px (rojo si es la predeterminada);
  - nombre, insignia Activa o Inactiva y chip «Predeterminada» (rojo tint con estrella);
  - Símbolo · Decimales · Denominaciones y un ejemplo formateado.
  - Menú ⋯: Desactivar o Activar, y Eliminar (desactivado si tiene datos: «Tiene datos: solo se puede desactivar»).
- **Confirmación de desactivar** si la divisa está en uso: «Ya no se ofrecerá en pedidos nuevos. Los pedidos, lotes y costos que ya la usan no cambian» + cuántos usos tiene.
- **Formulario:**
  - Código (monoespaciado, mayúsculas), Nombre, Símbolo y Decimales (0 / 2 / 3, segmentado);
  - tarjetas-interruptor Predeterminada y Activa. Una divisa predeterminada no se puede desactivar, y se avisa con candado.
- **Denominaciones:**
  - alta con valor + Billete / Moneda;
  - la lista va siempre **ordenada de mayor a menor**;
  - el billete se ve como un rectángulo amarillo tint y la moneda como un círculo gris;
  - se desactiva con interruptor (sin borrar).
- **Lateral, «ASÍ SE VERÁN LOS MONTOS»:** monto grande y ejemplos de precio, céntimos y con código.

### Rol ampliado · `M2-Rol-Ampliado`

- **Arriba, tarjeta-interruptor «Ver costos»** (6.51, delicada). Afecta a todos los módulos.
- **Acordeón por módulo** (Divisas, Existencias, Solicitudes, Pedidos, Notificaciones). En la cabecera: icono, resumen («Ver · Crear · Editar») y chip «n permisos».
- **Dentro de cada módulo:**
  - casillas en píldora Ver · Crear · Editar · Eliminar. Marcar Crear, Editar o Eliminar bloquea «Ver», con nota;
  - «PERMISOS ESPECIALES» con interruptores compactos con descripción (elegir lote, entrada inicial, entrada directa, trasladar, bajas en almacén o en tiendas, ajustar, configurar unidades y mínimos, solicitar, atender, armar, realizar compras, revisar del almacén o de tienda, corregir). Sin «Ver», estos interruptores están desactivados.
- **Lateral, «LO QUE PODRÁ HACER»:**
  - una frase por módulo;
  - si tiene «Ver costos», **aviso destacado en rojo tint**: «Verá costos e importes…».

### Historial ampliado · `M2-Historial` (+ sin costos)

- Pestañas por módulo nuevo y filtro de operación (Traslado, Baja, Entrada, Revisión, Corrección, Edición).
- «Ver cambios» se comporta como en 6.35.
- ⓒ Los cambios de importe se ocultan y se resumen con el aviso de M3.

---

## M8. Estados de cada vista · `M2-Estados`

Todas las pantallas cubren estos cinco casos. Se usan los textos de ejemplo cambiando la entidad.

| Estado | Cómo se ve |
|---|---|
| Cargando | Skeleton con la forma real (filas de tabla o tarjetas móviles), animación suave; `role="status"` y `aria-label="Cargando existencias"`. Sin spinner a pantalla completa. |
| Vacío | Icono en un círculo de 56 px + «Aún no hay productos en el almacén» + qué hacer. **El botón solo aparece si el usuario puede crear.** |
| Sin coincidencias | Lupa + «Ningún producto coincide con «aceitunas»» + «Limpiar filtros». |
| Error | Alerta en rojo tint con «No pudimos cargar…», tranquiliza («Tus cambios no se han perdido») y ofrece **«Reintentar»** + código para soporte. |
| Sin permiso | Candado (aviso) + «No tienes acceso a Existencias» + qué permiso pedir + «Volver al inicio». |

---

## M9. Responsive

- **Móvil primero:** Mi pedido — compra, Mis pedidos, Existencias de mi tienda, Nueva solicitud y Mis solicitudes. En escritorio, esas mismas pantallas usan el marco con sidebar y una sola columna de 720 px como máximo.
- **Escritorio primero, y en móvil:**
  - **Formularios con lateral:** el lateral de resumen pasa debajo, y la acción principal a una barra fija inferior.
  - **Tablas de existencias y pedidos:** pasan a tarjetas, una por fila, con nombre, cifra y insignia; las columnas secundarias se ocultan.
  - **Revisión del pedido:** cada línea es una tarjeta con «Pedida · Reportada» en texto y «Recibida» como cantidad editable con −/+ (6.43, móvil).
  - **Bandeja:** como `M2-Bandeja-Movil`.
- **Tablet (834–1194 px):** el sidebar pasa a riel (6.30) y los formularios se mantienen en dos columnas desde 1024 px.

---

## M10. Accesibilidad específica

- **Segmentados:** Sí/No, General/Por tienda y Cantidad/Costo usan `role="radiogroup"` + `role="radio"` con `aria-checked`.
- **Interruptores:** `role="switch"`, con el texto del estado al lado («Activa», «Desactivada»).
- **Casillas con estado mixto:** «Todas», «Seleccionar todo», «Ver» bloqueado, con `aria-checked="mixed"`. Si están bloqueadas, `disabled` + `title` con el motivo.
- **Medidores:** gastado y cobertura usan `role="meter"` con `aria-valuenow`.
- **Avisos:** el devuelto, el bloqueo y el error de stock usan `role="alert"`; el toast de confirmación, `role="status"`.
- **Diálogos:** los de confirmación destructiva usan `role="alertdialog"` y `aria-modal`, y devuelven el foco al botón que los abrió.
- **Lectores de pantalla:** los contadores llevan texto oculto (« sin atender», «Sin leer»). En la tabla 6.52, cada campo editable tiene la etiqueta «Recibida de {producto}».

---

## M11. Checklist adicional del módulo 2

- [ ] ¿Las cifras van en tabular y con el número de decimales de su unidad?
- [ ] ¿Cada cantidad capturada muestra su equivalente en base?
- [ ] ¿Existe la variante sin costos y no deja huecos ni ceros?
- [ ] ¿El amarillo solo dice «hoy / en curso / abierto»?
- [ ] ¿Hay un único bloque rojo grande?
- [ ] ¿Están los 5 estados de vista?
- [ ] ¿Las acciones que cambian el stock tienen confirmación con resumen y aparecen en el historial?
