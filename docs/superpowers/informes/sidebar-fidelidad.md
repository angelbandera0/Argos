# Sidebar fidelity

Fuente: Comp-Sidebar.dc.html y M2-Pedidos-Lista.dc.html. Agrupamiento y orden de nav-config ya coincidían (sin cambios; Motivos de baja solo admin).

## Diferencias corregidas
- Item: alto 52 -> 44 (min-height), fuente 15px/500, padding 0 12 0 14 (tokens --size-nav-item, --text-nav).
- Icono 18 -> 19px (--size-icon-side).
- Marca: círculo 28 -> 30px, texto 17 -> 20px, tracking -0.5, padding lateral 10.
- Panel: padding 24/14/16, gap 14 entre bloques (18 marca/compañía/nav), etiquetas con margen inferior 6 y padding 14, sin el margin-top por sección; secciones como columnas con gap 2 entre items.
- Tarjeta compañía: sin borde, sombra suave (--shadow-active), radio 18, padding 8/12/8/8, avatar 38px radio 11, nombre 15/600, etiqueta 10px con tracking 0.8.
- Insignia contador: 11px/700, padding 0 7.
- Eliminado el punto rojo automático del ítem activo (el diseño solo lo muestra con el indicador de Pedidos/Existencias; los slots de nav-slots siguen funcionando).
- Rail (<1280) y móvil conservan `display: contents` de secciones.

## No verificado sin navegador
Aspecto visual final, barra superior (no tocada: no se comparó a nivel de píxel), avatar de compañía en el menú desplegable (ahora 38px), rail/móvil.
