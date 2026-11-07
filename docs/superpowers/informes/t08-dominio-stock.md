# T08 · Dominio de stock (`core/domain/stock/`)

Importar de `@/core/domain/stock`. Errores: `RuleViolation` con códigos nuevos en `errors.ts`: INVALID_QUANTITY, NEGATIVE_QUANTITY, UNIT_MAGNITUDE_MISMATCH, INVALID_CONTENT, QUANTITY_MISMATCH, LOT_EXCEEDED, LOT_NOT_FOUND, INSUFFICIENT_STOCK (y INVALID_INPUT existente).

## Firmas públicas
- quantity: `type Qty` (entero en milésimas, branded); `qty(n: number|string, signed=false): Qty`; `toNumber(q)`; `add(a,b)`; `sub(a,b,signed=false)` (lanza NEGATIVE_QUANTITY); `mul(q, factor: number)`; `div(a: Qty, b: Qty): Qty`; `compare`; `isZero`; `isNegative`; `format(q, locale="es")`.
- units: `Magnitude`, `Unit`, `KG_PER_LB=0.45359237`, `BASE_UNIT`, `unitsOf(m)`, `magnitudeOf(u)`, `convertToBase(value, unit, magnitude?): Qty`, `convertFromBase(base, unit, magnitude?): Qty` (el parámetro `magnitude` activa UNIT_MAGNITUDE_MISMATCH).
- presentation: `Presentation {name, content}`, `MovementUnit {name, equivalence}`, `capture(qty, source, overrideContent?) -> {captured:{qty,unitName}, base, content}`, `baseToMovementUnits(base, unit): Qty`.
- cost: `COST_DECIMALS=6`, `unitCostPerBase(price: number, content: Qty): number`, `lineTotal(base, unitCost): number` (half-up a 6 decimales).
- lot/allocation: `Lot {id, createdAt, remaining}`, `Allocation {lotId, qty}`, `suggestFifo(lots, needed)`, `allocateChosen(lots, picks, needed)`, `isFifoDeviation(lots, allocations, needed)`, `applyAllocations(lots, allocations)`.
- status: `StockStatus`, `stockStatus(q, minimum|null)`, `crossedThreshold(prev, next, minimum|null): "low"|"out"|null` (solo al empeorar).

## Notas
- M2-Q06: con 1 lb = 3 porciones la equivalencia queda 0,333; 1 lb = 3,003 porciones y 3 porciones = 0,999 lb (cubierto en pruebas).
- Reutilizable luego desde la UI (no modificada): `components/ui/lot-logic.ts` (`suggestedAllocation`, `isBalanced`, `isSuggested`, `setLotQty` usan number con `toFixed(3)`) y `quantity-logic.ts`; pueden delegar en `suggestFifo`/`allocateChosen`/`qty` convirtiendo number<->Qty. `split-logic.ts`/`diff-logic.ts` no se revisaron a fondo.
