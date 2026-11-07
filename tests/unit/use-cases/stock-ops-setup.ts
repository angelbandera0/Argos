import type { SpecialGrant } from "@/core/domain/permissions";
import { makeAdjustLot } from "@/core/application/use-cases/stock/adjust-lot";
import { makeCreateWriteOffReason } from "@/core/application/use-cases/stock/create-write-off-reason";
import { makeDeleteWriteOffReason } from "@/core/application/use-cases/stock/delete-write-off-reason";
import { makeListWriteOffReasons } from "@/core/application/use-cases/stock/list-write-off-reasons";
import { makePreviewConsumption } from "@/core/application/use-cases/stock/preview-consumption";
import { makeRegisterDirectEntry } from "@/core/application/use-cases/stock/register-direct-entry";
import { makeRegisterInitialEntry } from "@/core/application/use-cases/stock/register-initial-entry";
import { makeRegisterSurplus } from "@/core/application/use-cases/stock/register-surplus";
import { makeRenameWriteOffReason } from "@/core/application/use-cases/stock/rename-write-off-reason";
import { makeSetWriteOffReasonActive } from "@/core/application/use-cases/stock/set-write-off-reason-active";
import { makeTransferStock } from "@/core/application/use-cases/stock/transfer-stock";
import { makeWriteOffStock } from "@/core/application/use-cases/stock/write-off-stock";
import { InMemoryReasons, RecordingOperations } from "../../fakes/in-memory-stock";
import { stockSetup } from "./stock-setup";

/** Product p1 (lb): presentation Saco = 25 lb, movement unit Porción = 0,2 lb. Reasons for c1: merma, otro (requires text, standard), baja (inactive), custom. */
export function opsSetup() {
  const base = stockSetup();
  const ops = new RecordingOperations();
  const reasons = new InMemoryReasons();
  const cfg = base.stock.configs.get("p1")!;
  cfg.presentations.push({ id: "pr-saco", name: "Saco", content: 25, active: true });
  cfg.movementUnits.push({ id: "mu-por", name: "Porción", equivalence: 0.2, active: true });
  const reason = (id: string, code: string, extra: Partial<(typeof reasons.rows)[number]> = {}) =>
    reasons.rows.push({ id, companyId: "c1", code, name: code, active: true, standard: false, requiresText: false, ...extra });
  reason("r-merma", "merma", { standard: true });
  reason("r-otro", "other", { standard: true, requiresText: true });
  reason("r-off", "baja", { active: false });
  reason("r-custom", "custom");
  const deps = { ...base.deps, ops, reasons };
  const give = (user: string, ...specials: Array<[SpecialGrant["permission"], boolean]>) => {
    deps.access.byUser[user][0].specialPermissions = specials.map(([permission, warehouse]) => ({ permission, warehouse }));
  };
  return {
    stock: base.stock,
    ops,
    reasons,
    give,
    initialEntry: makeRegisterInitialEntry(deps),
    directEntry: makeRegisterDirectEntry(deps),
    preview: makePreviewConsumption(deps),
    transfer: makeTransferStock(deps),
    writeOff: makeWriteOffStock(deps),
    adjust: makeAdjustLot(deps),
    surplus: makeRegisterSurplus(deps),
    listReasons: makeListWriteOffReasons(deps),
    createReason: makeCreateWriteOffReason(deps),
    renameReason: makeRenameWriteOffReason(deps),
    setReasonActive: makeSetWriteOffReasonActive(deps),
    deleteReason: makeDeleteWriteOffReason(deps),
  };
}
