# T03b · Divisas: formulario y denominaciones

Hecho: `/divisas/nueva` y `/divisas/[id]` (page síncrona + Suspense, loading, guard admin, `notFound` para id inválido o inexistente, Alert si falla la carga). `components/currencies/currency-form.tsx` (FormShell aside, código/nombre/símbolo/decimales, `ToggleCard` Predeterminada, `Switch` Activa, `SummaryPanel` con vista previa `Intl.NumberFormat("es")`); `denomination-manager.tsx` (alta rápida en línea, edición en fila, desactivar/reactivar, eliminar con `AlertDialog`, reutiliza `.ui-cat-*`; en `/divisas/nueva` desactivada con «Guarda la divisa para añadir denominaciones»). Actions: create/update de divisa y add/update/setActive/delete de denominación; errores legibles CODE_TAKEN, VALUE_TAKEN, CURRENCY_IN_USE. Toast al guardar; al crear redirige a `/divisas/[id]`; al editar se queda. Lógica en `currency-form-logic.ts` + `tests/unit/currency-form-logic.test.ts`. `pnpm verify` OK (541 casos).

Pendiente: verificación visual pendiente (sin navegador).
N+1 del conteo de denominaciones de la lista: sin resolver (exigiría ampliar `Currency`/repositorio con un conteo agregado); se deja anotado.
Nota: la sección Denominaciones va fuera del `<form>` (debajo), no en el panel del formulario; no hay Mockup revisado.
