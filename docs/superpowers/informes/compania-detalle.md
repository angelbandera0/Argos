# Detalle de compañía (rediseño §6.37)

Hecho: cabecera (migas, avatar 64, título, chips código/estado, «Administra: …», acciones Contorno Administradores/Ajustes), fila de 4 `StatTile` (sedes, tiendas, tiendas activas, tope de sesión), sección «Sedes y tiendas» (buscador, Nueva sede, grilla `EntityCard` mín. 420 px con `EntityPanel`, menú ⋯ por sede y tienda, «Añadir tienda»), zona de peligro con `DeactivateDialog` (botón Peligro, razón deshabilitada conservada). Componentes nuevos: `StatTile`, `EntityPanel`; `EntityCard` gana `avatarClassName`. Galería, PATRONES-UI y DESIGN-resumen actualizados; loading.tsx nuevo.

Omitido (sin dato): «Creada el …» (la compañía no expone fecha de creación), datos Tipo/Rendimiento/Dirección/Teléfono de la sede, botones «Ver sede»/«Editar sede» (no hay página ni edición de sede), ordenar.
Meta del `meta` de tienda («Física · Caja…») omitido por falta de datos. Sin verificación en navegador: pedir `/verificar-ui`.
