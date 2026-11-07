import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeAdjustLot } from "@/core/application/use-cases/stock/adjust-lot";
import { makeAddMovementUnit } from "@/core/application/use-cases/stock/add-movement-unit";
import { makeAddPresentation } from "@/core/application/use-cases/stock/add-presentation";
import { makeClearMinimum } from "@/core/application/use-cases/stock/clear-minimum";
import { makeCreateWriteOffReason } from "@/core/application/use-cases/stock/create-write-off-reason";
import { makeDeleteMovementUnit } from "@/core/application/use-cases/stock/delete-movement-unit";
import { makeDeletePresentation } from "@/core/application/use-cases/stock/delete-presentation";
import { makeDeleteWriteOffReason } from "@/core/application/use-cases/stock/delete-write-off-reason";
import { makeGetProductStock } from "@/core/application/use-cases/stock/get-product-stock";
import { makeGetProductStockConfig } from "@/core/application/use-cases/stock/get-product-stock-config";
import { makeListLocations } from "@/core/application/use-cases/stock/list-locations";
import { makeListMovements } from "@/core/application/use-cases/stock/list-movements";
import { makeListStockStatus } from "@/core/application/use-cases/stock/list-stock-status";
import { makeListWriteOffReasons } from "@/core/application/use-cases/stock/list-write-off-reasons";
import { makePreviewConsumption } from "@/core/application/use-cases/stock/preview-consumption";
import { makeRegisterDirectEntry } from "@/core/application/use-cases/stock/register-direct-entry";
import { makeRegisterInitialEntry } from "@/core/application/use-cases/stock/register-initial-entry";
import { makeRegisterSurplus } from "@/core/application/use-cases/stock/register-surplus";
import { makeRenameWriteOffReason } from "@/core/application/use-cases/stock/rename-write-off-reason";
import { makeSaveProductStockConfig } from "@/core/application/use-cases/stock/save-product-stock-config";
import { makeSetMinimum } from "@/core/application/use-cases/stock/set-minimum";
import { makeSetMovementUnitActive } from "@/core/application/use-cases/stock/set-movement-unit-active";
import { makeSetPresentationActive } from "@/core/application/use-cases/stock/set-presentation-active";
import { makeSetWriteOffReasonActive } from "@/core/application/use-cases/stock/set-write-off-reason-active";
import { makeTransferStock } from "@/core/application/use-cases/stock/transfer-stock";
import { makeUpdateMovementUnit } from "@/core/application/use-cases/stock/update-movement-unit";
import { makeUpdatePresentation } from "@/core/application/use-cases/stock/update-presentation";
import { makeWriteOffStock } from "@/core/application/use-cases/stock/write-off-stock";
import { makeCompanyRepository } from "./company-repository";
import { makeSessionRepository } from "./session-repository";
import { makeStockOperations } from "./stock-operations";
import { makeStockRepository } from "./stock-repository";
import { makeStoreAccessReader } from "./store-access-reader";
import { makeWriteOffReasonRepository } from "./write-off-reason-repository";

const clock = { now: () => new Date() };

/** Stock use cases bound to one request's user client (RLS applies). */
export function makeStock(supabase: SupabaseClient) {
  const deps = {
    stock: makeStockRepository(supabase),
    companies: makeCompanyRepository(supabase),
    sessions: makeSessionRepository(supabase),
    access: makeStoreAccessReader(supabase),
    clock,
  };
  const ops = { ...deps, ops: makeStockOperations(supabase), reasons: makeWriteOffReasonRepository(supabase) };
  return {
    listLocations: makeListLocations(deps),
    listStockStatus: makeListStockStatus(deps),
    getProductStock: makeGetProductStock(deps),
    listMovements: makeListMovements(deps),
    getProductStockConfig: makeGetProductStockConfig(deps),
    saveProductStockConfig: makeSaveProductStockConfig(deps),
    addPresentation: makeAddPresentation(deps),
    updatePresentation: makeUpdatePresentation(deps),
    setPresentationActive: makeSetPresentationActive(deps),
    deletePresentation: makeDeletePresentation(deps),
    addMovementUnit: makeAddMovementUnit(deps),
    updateMovementUnit: makeUpdateMovementUnit(deps),
    setMovementUnitActive: makeSetMovementUnitActive(deps),
    deleteMovementUnit: makeDeleteMovementUnit(deps),
    setMinimum: makeSetMinimum(deps),
    clearMinimum: makeClearMinimum(deps),
    registerInitialEntry: makeRegisterInitialEntry(ops),
    registerDirectEntry: makeRegisterDirectEntry(ops),
    previewConsumption: makePreviewConsumption(ops),
    transferStock: makeTransferStock(ops),
    writeOffStock: makeWriteOffStock(ops),
    adjustLot: makeAdjustLot(ops),
    registerSurplus: makeRegisterSurplus(ops),
    listWriteOffReasons: makeListWriteOffReasons(ops),
    createWriteOffReason: makeCreateWriteOffReason(ops),
    renameWriteOffReason: makeRenameWriteOffReason(ops),
    setWriteOffReasonActive: makeSetWriteOffReasonActive(ops),
    deleteWriteOffReason: makeDeleteWriteOffReason(ops),
  };
}
