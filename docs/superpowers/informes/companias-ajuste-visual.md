# Ajuste visual /companias y /companias/[id]

- Listado: barra en una fila (buscador 360 panel, separador, chips sin mayúsculas con contador en círculo, «Ordenar: Nombre» con FilterSelect en URL `orden`, ViewToggle), subtítulo «n compañías · m activas», grilla `minmax(320px,1fr)` con `width:100%`, avatar de color (`avatarTone % 2`, inactiva gris), «En uso» chip amarillo, datos Sedes/Tiendas/Administrador/Tope de sesión reales (`company-summary.ts`, repos existentes con RLS, sin migraciones), Ver compañía / Editar (rojo), `Pager` nuevo (`pagina`, 6 por página, solo en grilla).
- Causa de chips en mayúsculas: `.chip` de globals.css pisaba `.chip-filter`; ahora `.chip.chip-filter`.
- Detalle: cabecera con avatar 64 a la izquierda y chips + «Administra» en una línea, botones Contorno sm con icono; «Sedes y tiendas · n sedes» con buscador 240 y «Nueva sede» primario en la misma fila.
- Omitido: Rendimiento y Ventas del mes (no hay datos); Usuarios (sin conteo por compañía); «Ver sede»/«Editar sede» y Tipo/Dirección/Teléfono de sede (no existen rutas ni columnas).
- Pendiente de comprobar en navegador: la capa de 2 columnas estrechas de la captura 1 (el CSS ya fijaba 320 px y `.content` mide 1040 px; la captura parece de código anterior); N+1 de consultas por compañía (6 por página).
- Inconsistencia menor: el selector de compañía sigue usando 4 tonos; las tarjetas 2.
