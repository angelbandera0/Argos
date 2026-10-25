# REQ-008 — Catálogo: categorías y productos

- **Módulo:** Catálogo
- **Estado:** En revisión
- **Prioridad:** Imprescindible
- **Actor(es):** Administrador, Usuario operativo con permiso

## Resultado esperado
Cada compañía mantiene un catálogo único de categorías y productos, disponible para todas sus sedes y tiendas, donde cada rol solo hace lo que se le permite.

## Criterios de aceptación

- CA-01: DADO un administrador, CUANDO crea una categoría en una compañía, ENTONCES queda disponible para toda la compañía.
- CA-02: DADO un usuario que no es administrador, CUANDO intenta crear, editar o eliminar una categoría, ENTONCES se rechaza.
- CA-03: DADO un usuario con permiso de crear productos, CUANDO registra un producto, ENTONCES indica nombre, una sola categoría de su compañía, descripción opcional y estado activo o inactivo.
- CA-04: DADO un producto, CUANDO se intenta asignarle más de una categoría, ENTONCES no es posible.
- CA-05: DADO un producto, CUANDO se intenta asignarle una categoría de otra compañía, ENTONCES se rechaza.
- CA-06: DADO un usuario con permiso de editar productos, CUANDO modifica un producto, ENTONCES el cambio queda en el historial con el valor anterior y el nuevo.
- CA-07: DADO un usuario con permiso de eliminar productos, CUANDO elimina un producto, ENTONCES se aplica borrado lógico y el producto deja de aparecer en el listado normal.
- CA-08: DADO un usuario sin permiso de ver productos, CUANDO consulta el catálogo, ENTONCES no ve productos.
- CA-09: DADO un usuario de una compañía, CUANDO consulta el catálogo de otra, ENTONCES no ve nada (P-01).
- CA-11: DADO un nombre de categoría o de producto ya usado en la compañía (sin distinguir mayúsculas y sin contar lo eliminado), CUANDO se intenta crear o renombrar otro con ese nombre, ENTONCES se rechaza.
- CA-12: DADO una categoría con productos, CUANDO un administrador intenta eliminarla, ENTONCES se rechaza hasta que sus productos pasen a otra categoría.
- CA-10: DADO un producto en estado inactivo, CUANDO se listan productos disponibles, ENTONCES no aparece como disponible, pero sigue visible para quien tiene permiso de ver.

## Restricciones
P-01, P-02, P-03, T-03, T-04. Reglas DR-014, DR-016.

## Fuera de alcance
- Copiar catálogos entre compañías.
- Almacén central, productos básicos y productos elaborados.
- Precios, inventario y unidades de medida (no se definieron para este módulo).

## Exposición
- **API REST:** por definir en el diseño.
- **MCP (ADR-012):** `lectura` para consultar y buscar productos y categorías; `escritura` para crear y editar productos; `sensible` (desactivada por defecto, con confirmación) para eliminar productos. Solo para el superadmin y los administradores.

## Dependencias y preguntas abiertas
REQ-005, REQ-007, REQ-009.

## Notas para el manual
Se completa al implementar (D-04).
