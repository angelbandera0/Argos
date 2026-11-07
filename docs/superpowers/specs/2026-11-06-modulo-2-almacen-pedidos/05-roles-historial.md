# 05 · Roles, permisos e historial

## Cambio respecto a REQ-007
REQ-007 CA-01 define por módulo las operaciones ver, crear, editar y eliminar. Este módulo añade **módulos nuevos** y **permisos especiales** (acciones que no encajan en CRUD). Hay que actualizar REQ-007 (CA-01 y «Fuera de alcance», que excluía inventario) antes de construir.

## Módulos nuevos del catálogo de permisos
Divisas · Existencias (almacén y tiendas) · Solicitudes de reposición · Pedidos de compra · Notificaciones (solo ver las propias).

## Permisos especiales
Se asignan por rol, y los que dependen de ubicación se acotan a almacén general y/o tiendas (usan el alcance de tiendas del usuario).

| Permiso | Quién lo usa típicamente | Dónde se define |
|---|---|---|
| Ver costos | Administrador | 03 |
| Elegir lote en salidas | Almacenero | 03·S-11 |
| Entrada inicial | Administrador; almacenero (notifica) | 03·S-13 |
| Entrada directa a tienda | Administrador y roles designados | 03·S-12 |
| Trasladar a tienda | Almacenero | 03·S-02/04 |
| Dar bajas (almacén / tienda) | Según rol | 03·S-17 |
| Ajustar existencias | Administrador | 03·S-15 |
| Configurar unidades/presentaciones del producto | Administrador | 03·S-07 |
| Configurar mínimos | Según rol | 03·S-19 |
| Solicitar reposición | Administrador de tienda | 04·R-01 |
| Atender solicitudes | Almacenero | 04·R-02 |
| Armar pedidos | Almacenero | 04·R-06 |
| Realizar compras (asignable) | Comprador | 04·R-07 |
| Revisar pedidos (almacén / tienda) | Almacenero / administrador de tienda | 04·R-13 |
| Corregir pedidos cumplidos | Administrador | 04·R-19 |

## Reglas
- **P-M2-01 [U]** Los roles almacenero, comprador y administrador de tienda no existen en código: el administrador los crea combinando permisos (M2-D05).
- **P-M2-02 [P]** Sigue valiendo REQ-007: un administrador solo ve y edita sus propios roles y no puede dar permisos sobre gestión de organización.
- **P-M2-03 [P]** Un usuario es elegible como comprador si su rol tiene «Realizar compras» y pertenece a la compañía del pedido.
- **P-M2-04 [P]** El formulario de rol agrupa los permisos nuevos por módulo, con los especiales como interruptores.

## Historial (REQ-009 / DR-017)
- **H-01 [U]** Se actualizan los datos mostrados: aparecen los módulos nuevos (Divisas, Existencias, Solicitudes, Pedidos, Notificaciones si procede) y los tipos de operación nuevos (traslado, baja, ajuste, entrada inicial, entrada directa, revisión, devolución, confirmación, corrección).
- **H-02 [P]** Cada usuario ve el historial de los módulos que su rol puede ver (REQ-007 CA-07).
- **H-03 [P]** En el historial, el campo costo y los valores monetarios se muestran solo a quien tenga «ver costos» (M2-D04).
- **H-04** Antes → después en los cambios de configuración (mínimos, unidades, catálogo de motivos, divisas).

## Criterios de aceptación
- CA-01: DADO el formulario de rol, ENTONCES muestra los módulos y permisos especiales nuevos y los guarda por rol.
- CA-02: DADO un usuario sin «ver costos», ENTONCES el historial oculta los valores monetarios.
- CA-03: DADO una operación del módulo, ENTONCES aparece en el historial con módulo, operación, autor y fecha, visible solo a roles con permiso de ver ese módulo.
- CA-04: DADO un pedido asignado, ENTONCES solo se ofrecen compradores de la compañía con «Realizar compras».
