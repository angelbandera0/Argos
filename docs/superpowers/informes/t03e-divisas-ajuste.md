# T03e · Ajuste de divisas a las maquetas (M2-Divisas, M2-Divisa-Form)

Verificación visual pendiente (sin navegador).

| Diferencia | Arreglo |
|---|---|
| Descripción de la lista | Texto de la maqueta |
| Cifras sin separador de miles (1234,50) | `useGrouping: always` → 1.234,50 |
| N+1 al contar denominaciones | `Currency` → `CurrencyListItem` (`denominationCount`); `list` del repositorio con un conteo embebido en una sola consulta; fake y prueba |
| Código en caja (roja si predeterminada) | Código como avatar de la tarjeta, tono rojo si es la predeterminada. No es la caja blanca de 64 px: requiere variante de EntityCard, pendiente |
| Chip «Predeterminada» con estrella | Sin estrella: Badge no admite icono. No se arregla aquí |
| Texto de desactivar | Texto de la maqueta. No se muestra el nº de usos ni se bloquea Eliminar con datos (no hay consulta de usos; la BD sigue devolviendo CURRENCY_IN_USE). Pendiente de decisión |
| Menú «Reactivar» vs «Activar» | Sin cambio (sinónimo) |
| Cabecera del editor: «Divisa: CUP» | «Editar divisa» + descripción de la maqueta |
| Decimales 0–4 en select | Opciones 0/2/3 (más el valor actual si es otro). Segmentado radiogroup: pendiente de T03c |
| Predeterminada/Activa | Dos ToggleCard; Activa bloqueada con aviso si es predeterminada; marcar predeterminada activa la divisa. Variante «delicada»/candado: pendiente de T03c (6.51) |
| Textos del código y sección | Textos de la maqueta |
| Denominaciones: orden menor→mayor | Mayor→menor (`sortDenominations`) |
| Billete/moneda con icono genérico | Rectángulo amarillo tint / círculo gris (CSS en `ui-category-list.css`) |
| Desactivar con botón + insignia | Interruptor `Switch` por denominación |
| Lateral: «Así se verá» | «Así se verán los montos»: monto grande, precio, céntimos, con código |
| Estados (vacío, sin coincidencias, cargando, error) | Ya existen con los textos de M2-Estados no verificados; sin cambios |

Pruebas: conteo agregado, orden descendente, ejemplos de montos, agrupación de miles.
