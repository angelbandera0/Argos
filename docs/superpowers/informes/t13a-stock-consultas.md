# T13a · Casos de uso de stock: consultas y configuración

Puerto `core/application/ports/stock-repository.ts` (`StockRepository`, DTOs `Location`, `Money`, `StockLine`, `LotView`, `MovementView`, `ProductStockConfig`, `PresentationItem`, `MovementUnitItem`, `Page{offset,limit}`). Además de lo pedido: `getLocation`, `getProductCompany`, `getStockLine`. Los ítems se actualizan por `(productId, id)`.

Casos de uso (`core/application/use-cases/stock/`, deps `StockDeps = {stock, companies, sessions, access, clock}`; `companyId` solo lo usan administradores):
- `makeListLocations(deps)(actor, {companyId?}) → Location[]` (solo visibles; operador sin ninguna: Forbidden)
- `makeListStockStatus(deps)(actor, {companyId?, locationId, status?, q?, categoryId?, page?, pageSize?}) → {items,total,counts}` (tope 100)
- `makeGetProductStock(deps)(actor, {productId, locationId, onlyAvailable?=true}) → {config, lots, quantity, minimum, status}`
- `makeListMovements(deps)(actor, {companyId?, productId?, locationId?, type?, from?, to?, page?, pageSize?}) → {items,total}` (pasa `locationIds` visibles al repo)
- `makeGetProductStockConfig(deps)(actor, {productId})`; `makeSaveProductStockConfig(deps)(actor, {productId, storable, baseUnit})`
- `makeAdd/Update/SetActive/Delete` + `Presentation` | `MovementUnit` (`{productId, id, name?, content|equivalence?, active?}`; NAME_TAKEN, INVALID_NAME, INVALID_CONTENT)
- `makeSetMinimum(deps)(actor, {productId, locationId, minimum})`, `makeClearMinimum(...)` (minimum >= 0)

`shared.ts`: `resolveStockScope`, `scopeOfProduct`, `loadLocation`, `requireView`, `canSeeLocation(scope, location)` (punto aislado de la decisión pendiente), `canSeeCosts(actor, access)`, `stripCosts`, `canConfigureUnits`, `canConfigureMinimum`, `pageOf`.

Permisos: administrador de la compañía siempre; operador con `stock` ver ve su tienda; almacén general solo con algún permiso especial con almacén; unidades = `configure_units` con almacén; mínimos = `configure_minimums` (almacén con warehouse, tienda en la suya). Costos solo administrador o `see_costs` (si no, `unitCost` se elimina; `null` = sin costo conocido).

Otros: `BASE_UNIT_IN_USE` añadido a `RuleCode`. Divisas: `resolveCurrencyScope`/`loadScoped` usan `op: Op` y el permiso del módulo `currencies` para operadores (nota T04 cerrada); prueba actualizada. Fake `tests/fakes/in-memory-stock.ts`, setup `tests/unit/use-cases/stock-setup.ts`. `pnpm verify:fast`: 80 archivos, 640 casos OK.
