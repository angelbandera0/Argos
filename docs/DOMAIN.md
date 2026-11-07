# Modelo de Dominio

> Glosario y relaciones del negocio. Solo entra lo **confirmado**. Lo dudoso va a `OPEN_QUESTIONS.md`.

Estado: **En revisión** — primer módulo (organización, usuarios, roles, catálogo e historial).

## Glosario

| Término | Definición |
|---|---|
| Compañía | Dueña del negocio. Es el nivel multitenant: los datos de una compañía no se ven desde otra ni se comparten entre ellas. Tiene un código corto (4 caracteres aleatorios) que asigna el sistema y no cambia. |
| Sede | Lugar o centro de trabajo de una compañía. Agrupa tiendas. (Nombre propuesto; antes "entidad".) |
| Tienda | Punto de venta dentro de una sede. Es donde trabajan los usuarios operativos. |
| Superadmin | Único usuario de nivel plataforma. Crea administradores. |
| Administrador | Usuario que gestiona una o más compañías: sedes, tiendas, usuarios, roles, categorías y productos. |
| Fundador | Administrador que creó una compañía. Es permanente en ella. |
| Usuario operativo | Usuario que no es administrador. Trabaja en tiendas según su rol. |
| Rol | Conjunto de permisos por módulo y tiempo de sesión, creado por un administrador. |
| Operación | Una de cuatro acciones sobre un módulo: ver, crear, editar, eliminar. |
| Eliminar | Borrado lógico: el registro se marca como eliminado y no se pierde. |
| Desactivar | Dejar fuera de uso una compañía, sede o tienda con datos, indicando un motivo. Es reversible. |
| Categoría | Agrupación de productos, propia de una compañía. La gestionan solo los administradores. |
| Producto | Artículo del catálogo de una compañía. Tiene una sola categoría. |
| Historial | Registro de operaciones por módulo: quién, qué cambió, cuándo. |
| Tope de sesión | Duración máxima de una sesión en una compañía. Por defecto, un día. |

## Jerarquía organizativa

```
Compañía  (tenant, dueña del negocio)
 └── Sede (1..N)     centro de trabajo
      └── Tienda (1..N)
```

## Reglas de dominio

- **DR-001 Jerarquía.** Compañía → Sede → Tienda. Cada sede pertenece a una sola compañía y cada tienda a una sola sede.
- **DR-002 Superadmin único.** Existe un solo superadmin. Solo él crea administradores. Se crea automáticamente la primera vez que arranca el servidor.
- **DR-003 Origen de las compañías.** Un administrador nuevo empieza sin compañías y crea las suyas. Quien crea una compañía es su fundador.
- **DR-004 Administración compartida.** Una compañía puede ser gestionada por varios administradores. Cualquier administrador de la compañía, o el superadmin, puede dar acceso a otro administrador.
- **DR-005 Fundador permanente.** El fundador o el superadmin pueden quitar el acceso de un administrador a la compañía; los demás administradores no. El fundador no puede ser removido de ella, ni por sí mismo ni por el superadmin.
- **DR-006 Administrador fundador protegido.** No se puede eliminar la cuenta de un administrador mientras sea fundador de alguna compañía.
- **DR-007 Gestión exclusiva de administradores.** Compañías, sedes, tiendas, usuarios, roles y categorías los gestionan solo los administradores. Ningún rol puede recibir estos permisos.
- **DR-008 Roles.** Un administrador crea roles y define, por módulo, qué operaciones permite cada uno. Un rol vale por defecto para todas las compañías del administrador y se puede excluir alguna. Solo el administrador que creó un rol lo ve, lo usa y lo edita. Si otro administrador de la compañía gestiona a un usuario con ese rol, ve al usuario con la etiqueta "rol de otro administrador" y no sus permisos; puede desbloquearlo, cambiarle el PIN y desactivarlo, pero no cambiarle el rol.
- **DR-009 Asignación de usuarios.** Un usuario operativo pertenece a una sola compañía y solo puede estar asignado a tiendas de esa compañía. Tiene por defecto el mismo rol en todas sus tiendas y se puede cambiar por tienda.
- **DR-010 Credenciales por tipo de usuario.** Superadmin y administradores entran con usuario y contraseña. Los usuarios operativos, con username y PIN de 6 dígitos.
- **DR-011 PIN y username.** El PIN lo genera el sistema, se muestra una sola vez y solo un administrador puede cambiarlo. El username tiene la forma `código.nombre`: el código es el que el sistema asigna a la compañía y el administrador solo escribe el nombre. Así es único en todo el sistema sin que una compañía pueda inferir los usuarios de otra. Tras 5 PIN incorrectos seguidos el usuario se bloquea; solo un administrador lo desbloquea, y al hacerlo se genera un PIN nuevo.
- **DR-012 Sesión.** Dura como máximo un día. Cada rol puede tener un tiempo menor. El tope por compañía lo cambia solo un administrador, en los ajustes de la compañía, y queda en el historial. Al entrar a una tienda manda el tope de la compañía de esa tienda.
- **DR-013 Elección de tienda.** El usuario operativo elige la tienda al entrar y puede cambiar de tienda sin volver a escribir el PIN. Cambiar de tienda no reinicia el reloj de la sesión: se aplican el rol y el tiempo de sesión de la nueva tienda, contados desde el inicio de sesión. Si ese tiempo ya se cumplió, la sesión se cierra y hay que entrar de nuevo con el PIN.
- **DR-014 Eliminar es borrado lógico.** Ninguna operación de eliminar borra datos físicamente.
- **DR-015 Desactivación, reactivación y eliminación.**
  - Una compañía, sede o tienda con datos asociados no se elimina: se desactiva. Solo lo hacen el fundador o el superadmin, y debe quedar un motivo.
  - Motivos predefinidos: cierre definitivo, cierre temporal, reestructuración, remodelación, creada por error, fin de contrato o acuerdo, y otro (texto obligatorio).
  - Se puede reactivar; lo hacen solo el fundador o el superadmin, con un motivo libre, y queda registrado.
  - Lo que cuelga de algo desactivado queda inaccesible, pero cada nivel conserva su propio estado: al reactivar una compañía, vuelven a operar las tiendas que estaban activas.
  - Los usuarios de una tienda desactivada no pueden entrar a ella y siguen entrando a las demás.
  - Una compañía, sede o tienda sin datos asociados (sin usuarios, productos, categorías ni operaciones posteriores a su creación) se puede eliminar con borrado lógico, solo por el fundador o el superadmin.
- **DR-016 Catálogo.** Categorías y productos son de la compañía y comunes a todas sus sedes y tiendas. Un producto tiene nombre, una sola categoría, descripción opcional y estado activo o inactivo. El nombre de una categoría y el de un producto son únicos dentro de la compañía (sin distinguir mayúsculas y sin contar lo eliminado). Una categoría con productos no se puede eliminar.
- **DR-017 Historial.** Toda creación, modificación, desactivación o eliminación queda registrada por módulo con quién, qué cambió (valor anterior y nuevo) y fecha y hora. Cada usuario ve el historial de los módulos que su rol puede ver. Los administradores ven el historial completo de las compañías a las que tienen acceso y el superadmin el de todas. Los accesos, bloqueos y cambios de PIN solo los ven los administradores.
- **DR-018 Aplicaciones cliente.** Una app oficial (para usuarios operativos y administradores) se conecta a la API con OAuth 2.1 (código de autorización con PKCE) y nunca maneja el PIN ni la contraseña (ADR-011). El MCP es solo para el superadmin y los administradores (ADR-012).
- **DR-019 Ubicaciones.** El almacén general y las tiendas son ubicaciones de una misma entidad, distinguidas por tipo (M2-D13). Una compañía tiene un almacén general (cantidad pendiente de confirmar, M2-Q02). Los productos entran al almacén general y de ahí se trasladan a las tiendas, salvo entradas directas a tienda. Todo lote pertenece a una ubicación (M2-D10).
- **DR-020 Producto almacenable.** Un producto del catálogo (DR-016) se marca como almacenable (M2-D13, M2-Q01); solo los almacenables tienen existencias, lotes y movimientos. Cada uno tiene una unidad base en la que se guardan stock y costo; la cantidad capturada se conserva junto a la convertida (M2-D08). No se mezclan magnitudes (peso, volumen, conteo). Las unidades de movimiento (p. ej. porción) tienen equivalencia fija en base. Las presentaciones de compra (p. ej. saco) tienen contenido en base; el contenido real puede corregirse en cada entrada y el usado se congela en el lote.
- **DR-021 Lote con costo.** Cada entrada crea un lote con producto, ubicación, cantidad inicial y restante en base, costo unitario por base, divisa, fecha y origen. El costo varía por lote y no se promedia (M2-D03). Un traslado crea en la tienda un lote por cada lote de origen usado, con su costo y fecha (M2-D11). Las salidas (traslado, baja, ajuste negativo) sugieren el lote más antiguo (PEPS); se puede elegir otro o repartir entre lotes, sin sacar más de lo que queda en cada uno. Elegir un lote distinto al sugerido requiere permiso del rol y queda registrado.
- **DR-022 Libro de movimientos.** Todo cambio de existencias queda en el libro de movimientos. Un movimiento no se edita ni se borra (M2-D07). Los errores se corrigen con movimientos contrarios o con un ajuste enlazado a su origen. El stock solo cambia al confirmar la revisión de un pedido, en una entrada inicial o directa, un traslado, una baja o un ajuste (M2-D02). Las escrituras de stock son atómicas en la base de datos con bloqueo de filas; el stock nunca es negativo y un conflicto se informa para reintentar (M2-D16). Toda baja exige motivo: del catálogo estándar o «otro» con texto.
- **DR-023 Solicitud de reposición.** La tienda pide productos en unidad de movimiento. Se atiende primero con el stock del almacén general mediante traslado; lo no surtido queda por comprar, pendiente o rechazado, con motivo y trazabilidad. Una línea puede tener varias asignaciones que suman la cantidad pedida, y su estado se deriva de ellas (M2-D12).
- **DR-024 Pedido de compra.** El pedido se arma con líneas de la bolsa por comprar y, si procede, de entrega directa. Se asigna a un comprador y lleva divisa y monto entregado. Cada línea tiene producto, cantidad pedida en presentación de compra y destino (almacén general o tienda); la entrega directa puede desglosarse por tienda o quedar general. Quien compra no puede revisar el mismo pedido (M2-D09). Una entrega general se reparte entre tiendas antes de confirmar (M2-D10). Al confirmar entra solo lo recibido, como lotes con el costo unitario reportado; el faltante no se absorbe en el costo. El sobrante (entregado menos gastado) se guarda en el pedido y se muestra junto a entregado y gastado.
- **DR-025 Divisa y denominación.** Cada pedido y cada lote guardan su divisa. No hay tasas de cambio ni conversión; las estadísticas no mezclan divisas (M2-D01). Las denominaciones de billetes y monedas se registran para uso futuro y no se usan en el pedido de este módulo. Crear, editar, desactivar y eliminar divisas y denominaciones queda en el historial.
- **DR-026 Notificación.** Cada notificación se clasifica por módulo y operación. Cada usuario ve solo las suyas. Ninguna notificación muestra costos a quien no tiene «ver costos» (M2-D04).

## Fuera del dominio (por ahora)

Se tratarán en módulos posteriores:

- Productos elaborados que se venden en tiendas.
- Inventario, ventas y caja.
- Apertura y cierre de turnos (día y noche).
- Copiar catálogos entre compañías (descartado por ahora).
