import { describe, expect, it } from "vitest";
import { makeAddDenomination } from "@/core/application/use-cases/currencies/add-denomination";
import { makeCreateCurrency } from "@/core/application/use-cases/currencies/create-currency";
import { makeDeleteCurrency } from "@/core/application/use-cases/currencies/delete-currency";
import { makeDeleteDenomination } from "@/core/application/use-cases/currencies/delete-denomination";
import { makeGetCurrency } from "@/core/application/use-cases/currencies/get-currency";
import { makeListCurrencies } from "@/core/application/use-cases/currencies/list-currencies";
import { makeSetCurrencyActive } from "@/core/application/use-cases/currencies/set-currency-active";
import { makeSetDenominationActive } from "@/core/application/use-cases/currencies/set-denomination-active";
import { makeUpdateCurrency } from "@/core/application/use-cases/currencies/update-currency";
import { makeUpdateDenomination } from "@/core/application/use-cases/currencies/update-denomination";
import { InMemoryCurrencies } from "../../fakes/in-memory-currencies";
import { admin, operator, setup, superadmin } from "./catalog-setup";

function build() {
  const base = setup();
  const currencies = new InMemoryCurrencies();
  const deps = { ...base.deps, currencies };
  return {
    currencies,
    create: makeCreateCurrency(deps),
    update: makeUpdateCurrency(deps),
    setActive: makeSetCurrencyActive(deps),
    remove: makeDeleteCurrency(deps),
    list: makeListCurrencies(deps),
    get: makeGetCurrency(deps),
    addDen: makeAddDenomination(deps),
    updateDen: makeUpdateDenomination(deps),
    setDenActive: makeSetDenominationActive(deps),
    removeDen: makeDeleteDenomination(deps),
  };
}

const mxn = { companyId: "c1", code: " MXN ", name: "Peso  mexicano", symbol: "$", decimals: 2 };

describe("currencies use cases", () => {
  it("creates with normalized fields and rejects invalid ones", async () => {
    const s = build();
    expect(await s.create(admin("a1"), mxn)).toMatchObject({ code: "MXN", name: "Peso mexicano", active: true, isDefault: false });
    await expect(s.create(admin("a1"), { ...mxn, code: "X", decimals: 5 })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(s.create(admin("a1"), { ...mxn, code: "X", name: " " })).rejects.toMatchObject({ code: "INVALID_NAME" });
  });

  it("rejects a repeated code in the company but not in another", async () => {
    const s = build();
    await s.create(admin("a1"), mxn);
    await expect(s.create(admin("a1"), { ...mxn, code: "mxn" })).rejects.toMatchObject({ code: "CODE_TAKEN" });
    await s.create(admin("a2"), { ...mxn, companyId: "c2" });
  });

  it("lists the denomination count per currency", async () => {
    const s = build();
    const a = await s.create(admin("a1"), mxn);
    await s.create(admin("a1"), { ...mxn, code: "USD" });
    await s.addDen(admin("a1"), { currencyId: a.id, value: 5, kind: "bill" });
    await s.addDen(admin("a1"), { currencyId: a.id, value: 1, kind: "coin" });
    const rows = await s.list(admin("a1"), { companyId: "c1" });
    expect(rows.map((r) => [r.code, r.denominationCount])).toEqual([["MXN", 2], ["USD", 0]]);
  });

  it("only one default per company", async () => {
    const s = build();
    const a = await s.create(admin("a1"), { ...mxn, isDefault: true });
    const b = await s.create(admin("a1"), { ...mxn, code: "USD" });
    await s.update(admin("a1"), { id: b.id, isDefault: true });
    expect((await s.list(admin("a1"), { companyId: "c1" })).filter((c) => c.isDefault).map((c) => c.id)).toEqual([b.id]);
    expect(a.id).not.toBe(b.id);
  });

  it("lists with active filter and search", async () => {
    const s = build();
    const a = await s.create(admin("a1"), mxn);
    await s.create(admin("a1"), { ...mxn, code: "USD", name: "Dólar" });
    await s.setActive(admin("a1"), { id: a.id, active: false });
    const l = (f: object) => s.list(admin("a1"), { companyId: "c1", ...f }).then((r) => r.map((c) => c.code));
    expect(await l({ active: true })).toEqual(["USD"]);
    expect(await l({ active: false })).toEqual(["MXN"]);
    expect(await l({ search: "dolar" })).toEqual(["USD"]);
    expect(await l({})).toHaveLength(2);
  });

  it("denominations: ordered by value, no repeats, validated", async () => {
    const s = build();
    const c = await s.create(admin("a1"), mxn);
    const a = admin("a1");
    await s.addDen(a, { currencyId: c.id, value: 100, kind: "bill" });
    const half = await s.addDen(a, { currencyId: c.id, value: 0.5, kind: "coin" });
    await expect(s.addDen(a, { currencyId: c.id, value: 100, kind: "coin" })).rejects.toMatchObject({ code: "VALUE_TAKEN" });
    await expect(s.addDen(a, { currencyId: c.id, value: 0, kind: "coin" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(s.updateDen(a, { id: half.id, value: 100 })).rejects.toMatchObject({ code: "VALUE_TAKEN" });
    await s.updateDen(a, { id: half.id, value: 1, kind: "coin" });
    await s.setDenActive(a, { id: half.id, active: false });
    expect((await s.get(a, { id: c.id })).denominations.map((d) => [d.value, d.active])).toEqual([[1, false], [100, true]]);
    await s.removeDen(a, { id: half.id });
    expect((await s.get(a, { id: c.id })).denominations).toHaveLength(1);
  });

  it("delete is logical and CURRENCY_IN_USE passes through", async () => {
    const s = build();
    const used = await s.create(admin("a1"), mxn);
    const free = await s.create(admin("a1"), { ...mxn, code: "USD" });
    s.currencies.used.add(used.id);
    await expect(s.remove(admin("a1"), { id: used.id })).rejects.toMatchObject({ code: "CURRENCY_IN_USE" });
    await s.remove(admin("a1"), { id: free.id });
    await expect(s.get(admin("a1"), { id: free.id })).rejects.toMatchObject({ name: "NotFound" });
  });

  it("authorization: operators of the company read only; others are refused", async () => {
    const s = build();
    const c = await s.create(admin("a1"), mxn);
    const d = await s.addDen(admin("a1"), { currencyId: c.id, value: 5, kind: "coin" });
    expect(await s.list(operator("u-none"))).toHaveLength(1);
    expect((await s.get(operator("u-view"), { id: c.id })).denominations).toHaveLength(1);
    await expect(s.create(operator("u-all"), mxn)).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.update(operator("u-all"), { id: c.id, name: "X" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.removeDen(operator("u-all"), { id: d.id })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.get(operator("u-other"), { id: c.id })).rejects.toMatchObject({ name: "NotFound" });
    await expect(s.list(admin("a2"), { companyId: "c1" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.update(admin("a2"), { id: c.id, name: "X" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.list(superadmin)).rejects.toMatchObject({ name: "Forbidden" });
  });
});
