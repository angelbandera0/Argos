# 01 · Divisas

## Resultado esperado
El administrador registra las monedas que usa la compañía y, para el efectivo, las denominaciones de sus billetes y monedas. Los montos de los pedidos y los costos de los lotes usan estas divisas.

## Entidades
- **Divisa:** compañía, código (único en la compañía), nombre, símbolo, decimales, estado activa/inactiva.
- **Denominación:** divisa, valor, tipo (billete/moneda), estado. Única por divisa y valor.

## Reglas
- **D-01 [U]** Sin tasas de cambio ni conversión. Cada pedido y cada lote guardan su divisa; las estadísticas no mezclan divisas, se agrupan por divisa.
- **D-02 [U]** Las denominaciones se registran ahora porque se usarán después (desglose del efectivo); en este módulo no se usan en el pedido.
- **D-03 [P]** Las divisas son por compañía. Una puede marcarse como predeterminada.
- **D-04 [P]** Una divisa o denominación usada se desactiva, no se elimina (se elimina solo si no tiene datos asociados, con borrado lógico).
- **D-05 [P]** Se formatea con `Intl.NumberFormat('es', …)` según los decimales de la divisa.
- **D-06** Crear, editar, desactivar y eliminar divisas y denominaciones queda en el historial.

## Permisos
Módulo «Divisas»: ver, crear, editar, eliminar. Ver divisas es necesario para elegirlas en un pedido.

## Criterios de aceptación
- CA-01: DADO un administrador, CUANDO crea una divisa con código repetido en su compañía, ENTONCES se rechaza.
- CA-02: DADO una divisa, CUANDO se agregan denominaciones, ENTONCES se listan ordenadas por valor y no se repite el valor.
- CA-03: DADO una divisa usada en un pedido o lote, CUANDO se intenta eliminar, ENTONCES no es posible; se puede desactivar y deja de ofrecerse en pedidos nuevos.
- CA-04: DADO un pedido, CUANDO se define el monto, ENTONCES solo se ofrecen las divisas activas de su compañía.
