# Formulario de divisas ajustado a la maqueta (M2-Divisa-Form)

Verificación visual pendiente (sin navegador).

Captura: un formulario con dos tarjetas numeradas (1 Datos de la divisa, 2 Denominaciones). Sección 1: Código (mono) y Nombre; Símbolo y Decimales segmentado 0/2/3; dos tarjetas-interruptor sin icono y aviso con candado. Sección 2: contador «9 activas de 11», fila de alta (Valor con símbolo, Billete/Moneda, «+ Añadir») y lista con etiqueta amarilla, importe en negrita, tipo y «Activa».

| Diferencia | Arreglo |
|---|---|
| 3 secciones y denominaciones fuera del form | 2 secciones; `DenominationManager` dentro del `FormShell` (sin `<form>` anidado: botones `type=button`, Enter intercepta) |
| Alta/edición de denominaciones bloqueada en «Nueva» | Se acumulan en estado de cliente (`drafts`), viajan en `denominations` (JSON oculto); `createCurrencyAction` crea la divisa y luego cada denominación; si alguna falla devuelve `warning` (toast de error) y redirige a la edición |
| Código sin mono, campos en columna | `Input.mono`, rejilla `ui-form-section-cols` 2 columnas |
| Aviso en la descripción de «Activa» | Línea con candado bajo las tarjetas (siempre); «Activa» atenuada si es predeterminada |
| Tarjetas con icono | `ToggleCard` con `icon` opcional |
| Sin contador ni fila de alta de la maqueta | Chip «N activas de M», `ValueInput` con símbolo, `SegmentedControl` Billete/Moneda, botón Añadir |
| Fila con rectángulo/círculo | Nuevo `DenominationRow` (etiqueta de valor amarilla suave, importe, tipo, acciones); galería, PATRONES-UI, DESIGN-resumen |

Lógica pura nueva (`currency-form-logic`): alta local, orden, contador, `applyDefault`, `decimalOptions` (0/2/3 + valor guardado), (de)serialización. Pruebas añadidas a `tests/unit/currency-form-logic.test.ts`.

Pendiente: tarjetas-interruptor activas siguen en `--color-success-tint` (la captura las muestra blancas); reiniciar `pnpm dev` por el CSS nuevo. Sin prueba de integración nueva de la acción (los casos de uso no cambian).
