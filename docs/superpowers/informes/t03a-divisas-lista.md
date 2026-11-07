# T03a · Divisas: lista, navegación y confirmaciones

Hecho: `/divisas` (page, loading, guard solo admin, actions `setCurrencyActiveAction`/`deleteCurrencyAction`), `components/currencies/` (lista en tarjetas con búsqueda `q`, chips Todas/Activas/Inactivas por URL `estado`, menú «⋯» con Editar / Desactivar-Reactivar / Eliminar en `AlertDialog`, CURRENCY_IN_USE con mensaje legible), lógica pura + `tests/unit/currency-list-logic.test.ts`, «Divisas» en el menú lateral (admin) con icono `Coins`. Compañía: cookie activa o la primera. `pnpm verify` OK (536 casos).

Pendiente: verificación visual pendiente (sin navegador).
Paso 2: `/divisas/nueva` y `/divisas/[id]` (formulario, denominaciones, vista previa); los enlaces ya apuntan ahí (404 hasta entonces). Nº de denominaciones se cuenta con una consulta por divisa (N+1; aceptable por pocas divisas).
