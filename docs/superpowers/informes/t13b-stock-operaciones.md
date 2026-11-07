# T13b · Casos de uso de stock: operaciones y motivos de baja

Puertos: `core/application/ports/stock-operations.ts` (`StockOperations`: registerInitialEntry/registerDirectEntry(EntryCommand)→lotId, transfer→{movedBase,movedUnitQty,lots[{sourceLot,destLot,qty}]}, writeOff→{removedBase,lots[{lotId,qty,movementId}]}, adjust({lotId,delta,reasonText})→movementId, registerSurplus({productId,locationId,qty,reasonText,unitCost?,currencyId?})→lotId; `Pick{lotId,qty}`) y `write-off-reason-repository.ts` (`WriteOffReason{id,companyId,code,name,active,standard,requiresText}`; list, get, create(companyId,{code,name}), rename, setActive, delete). `StockRepository` gana `getLot(id)`.

Deps: `StockOpsDeps = StockDeps & {ops, reasons}` (`operations-shared.ts`, con `canDo/requireDo(scope, permission, location)`: admin, o permiso especial con almacén en el almacén / en SU tienda).

Casos de uso (`core/application/use-cases/stock/`, todos `make…(deps)(actor, input)`):
- `makeRegisterInitialEntry` / `makeRegisterDirectEntry` → `string`; input `{productId, locationId, qty, unit: nombre de presentación|'base', content?, unitCost? (por base), pricePerPresentation?, currencyId?, receivedAt?}`. Al puerto: `unit` = nombre de la presentación o la unidad base del producto (ej. "lb"), `content`, `unitCost` por base.
- `makePreviewConsumption` → `{baseQty, lots (sin unitCost sin permiso), allocation, suggested, isDeviation, errors?: RuleCode[]}`; input `{productId, locationId, qty, unit: unidad de movimiento|'base', picks?}`.
- `makeTransferStock` `{productId, fromLocationId, toLocationId, qty, unit, picks?, deviationReason?}`; `makeWriteOffStock` `{productId, locationId, qty, unit, reasonId, reasonText?, picks?, deviationReason?}`.
- `makeAdjustLot` `{lotId, delta, reasonText}`; `makeRegisterSurplus` `{productId, locationId, qty, reasonText, unitCost?, currencyId?}`.
- Motivos: `makeListWriteOffReasons` `{companyId?}`, `makeCreateWriteOffReason` `{companyId, code, name}`, `makeRenameWriteOffReason` `{id, name}`, `makeSetWriteOffReasonActive` `{id, active}`, `makeDeleteWriteOffReason` `{id}`.

Errores: nuevos RuleCode (DUPLICATE_LOT, COST_NOT_ALLOWED, CHOOSE_LOT_FORBIDDEN, INVALID_UNIT, INVALID_REASON, REASON_TEXT_REQUIRED, NOT_WAREHOUSE, NOT_STORE, LOCATION_NOT_FOUND, PRODUCT_NOT_STORABLE, ADJUST_EXCEEDS_LOT, INVALID_REVERSES, STANDARD_REASON_LOCKED) y `translateStockError(code)` en `core/domain/errors.ts` (busca el código dentro del texto; FORBIDDEN→Forbidden; desconocido→Error).

Notas: estándar = `standard` del repo (T14 lo deriva); `other`/requiresText no se desactiva. Texto de motivo normalizado (trim) y error REASON_TEXT_REQUIRED si fuera de rango. Ubicación de otra compañía → NotFound (no LOCATION_NOT_FOUND). Fakes `InMemoryReasons`, `RecordingOperations`; setup `tests/unit/use-cases/stock-ops-setup.ts`. `pnpm verify:fast`: 82 archivos, 656 casos OK.
