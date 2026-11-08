import type { SpecialGrant } from "@/core/domain/permissions";
import { makeAddMovementUnit } from "@/core/application/use-cases/stock/add-movement-unit";
import { makeAddPresentation } from "@/core/application/use-cases/stock/add-presentation";
import { makeClearMinimum } from "@/core/application/use-cases/stock/clear-minimum";
import { makeDeleteMovementUnit } from "@/core/application/use-cases/stock/delete-movement-unit";
import { makeDeletePresentation } from "@/core/application/use-cases/stock/delete-presentation";
import { makeGetProductStock } from "@/core/application/use-cases/stock/get-product-stock";
import { makeGetProductStockConfig } from "@/core/application/use-cases/stock/get-product-stock-config";
import { makeListLocations } from "@/core/application/use-cases/stock/list-locations";
import { makeListMovements } from "@/core/application/use-cases/stock/list-movements";
import { makeListStockStatus } from "@/core/application/use-cases/stock/list-stock-status";
import { makeSaveProductStockConfig } from "@/core/application/use-cases/stock/save-product-stock-config";
import { makeSetMinimum } from "@/core/application/use-cases/stock/set-minimum";
import { makeSetMovementUnitActive } from "@/core/application/use-cases/stock/set-movement-unit-active";
import { makeSetPresentationActive } from "@/core/application/use-cases/stock/set-presentation-active";
import { makeUpdateMovementUnit } from "@/core/application/use-cases/stock/update-movement-unit";
import { makeUpdatePresentation } from "@/core/application/use-cases/stock/update-presentation";
import { InMemoryStock } from "../../fakes/in-memory-stock";
import { setup } from "./catalog-setup";

const money = (amount: number) => ({ amount, currencyId: "mxn" });
const lotBase = { origin: "purchase", sourceLotId: null, capturedUnit: "lb", content: 1, presentation: null, receivedAt: "2026-01-01" };
const mvBase = { capturedUnit: "lb", askedQty: null, askedUnit: null, reasonCode: null, reasonText: null, documentType: null, documentId: null, reversesId: null, actorId: null };

/**
 * Locations: w1 (c1 warehouse), w2 (c2), and one store location per store (l-t-u-view, l-t-u-all,
 * l-t-u-edit). Operators (all with stock view unless noted): u-view; u-all (+see_costs,
 * configure_minimums for the store); u-edit (+transfer, configure_units, configure_minimums at
 * the warehouse); u-create (configure_units without warehouse); u-none has no stock permission.
 */
export function stockSetup() {
  const base = setup();
  const stock = new InMemoryStock();
  const grant = (user: string, view: boolean, ...specials: Array<[SpecialGrant["permission"], boolean]>) => {
    const a = base.deps.access.byUser[user][0];
    a.permissions = { ...a.permissions, stock: { view, create: false, edit: false, delete: false } };
    a.specialPermissions = specials.map(([permission, warehouse]) => ({ permission, warehouse }));
  };
  grant("u-view", true);
  grant("u-all", true, ["see_costs", false], ["configure_minimums", false]);
  grant("u-edit", true, ["transfer", true], ["configure_units", true], ["configure_minimums", true]);
  grant("u-create", true, ["configure_units", false]);
  grant("u-other", true);
  stock.locations.push(
    { id: "w1", companyId: "c1", kind: "warehouse", storeId: null, name: "Almacén general", active: true },
    { id: "w2", companyId: "c2", kind: "warehouse", storeId: null, name: "Almacén general", active: true },
  );
  for (const u of ["u-view", "u-all", "u-edit", "u-create", "u-none"]) {
    stock.locations.push({ id: `l-t-${u}`, companyId: "c1", kind: "store", storeId: `t-${u}`, name: `Tienda ${u}`, active: true });
  }
  stock.addProduct("p1", "c1", "cat1");
  stock.addProduct("p2", "c1", "cat2");
  stock.addProduct("p3", "c1", "cat1");
  stock.addProduct("px", "c2");
  const line = (productId: string, productName: string, categoryId: string, quantity: number, minimum: number | null, status: "normal" | "low" | "out", locationId = "w1") =>
    stock.lines.push({ productId, productName, categoryName: categoryId, categoryId, locationId, quantity, minimum, status, baseUnit: "lb" });
  line("p1", "Arroz", "cat1", 10, 5, "normal");
  line("p2", "Aceite", "cat2", 3, 5, "low");
  line("p3", "Sal", "cat1", 0, null, "out");
  line("p1", "Arroz", "cat1", 2, null, "normal", "l-t-u-view");
  stock.lots.push(
    { id: "lot1", productId: "p1", locationId: "w1", initialQty: 4, remaining: 4, capturedQty: 4, unitCost: money(1.5), ...lotBase },
    { id: "lot2", productId: "p1", locationId: "w1", initialQty: 6, remaining: 6, capturedQty: 6, unitCost: null, ...lotBase },
    { id: "lot3", productId: "p1", locationId: "w1", initialQty: 3, remaining: 0, capturedQty: 3, unitCost: money(2), ...lotBase },
  );
  const mv = (n: number, type: string, locationId: string, productId = "p1") =>
    stock.movements.push({ id: `m${n}`, type, qtyDelta: 1, capturedQty: 1, createdAt: `2026-01-0${n}T10:00:00.000Z`, lotId: "lot1", productId, locationId, unitCost: n === 2 ? null : money(1.5), ...mvBase });
  mv(1, "entry", "w1");
  mv(2, "entry", "w1");
  mv(3, "transfer", "w1", "p2");
  mv(4, "entry", "l-t-u-view");
  mv(5, "entry", "w2", "px");
  const deps = { ...base.deps, stock };
  return {
    stock,
    deps,
    locations: makeListLocations(deps),
    status: makeListStockStatus(deps),
    productStock: makeGetProductStock(deps),
    movements: makeListMovements(deps),
    getConfig: makeGetProductStockConfig(deps),
    saveConfig: makeSaveProductStockConfig(deps),
    addPresentation: makeAddPresentation(deps),
    updatePresentation: makeUpdatePresentation(deps),
    setPresentationActive: makeSetPresentationActive(deps),
    deletePresentation: makeDeletePresentation(deps),
    addUnit: makeAddMovementUnit(deps),
    updateUnit: makeUpdateMovementUnit(deps),
    setUnitActive: makeSetMovementUnitActive(deps),
    deleteUnit: makeDeleteMovementUnit(deps),
    setMinimum: makeSetMinimum(deps),
    clearMinimum: makeClearMinimum(deps),
  };
}
