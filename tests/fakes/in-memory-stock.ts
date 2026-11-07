import type {
  Location,
  LotView,
  MovementFilters,
  MovementUnitItem,
  MovementView,
  Page,
  PresentationItem,
  ProductStockConfig,
  StatusFilters,
  StockLine,
  StockRepository,
} from "@/core/application/ports/stock-repository";
import type { StockOperations } from "@/core/application/ports/stock-operations";
import type { WriteOffReason, WriteOffReasonRepository } from "@/core/application/ports/write-off-reason-repository";
import { RuleViolation } from "@/core/domain/errors";
import { nameKey } from "@/core/domain/name";
import { magnitudeOf, type StockStatus, type Unit } from "@/core/domain/stock";

export class InMemoryStock implements StockRepository {
  readonly locations: Location[] = [];
  readonly products = new Map<string, { companyId: string; categoryId: string | null }>();
  readonly configs = new Map<string, ProductStockConfig>();
  readonly lines: Array<StockLine & { categoryId: string | null }> = [];
  readonly lots: LotView[] = [];
  readonly movements: MovementView[] = [];
  readonly baseUnitLocked = new Set<string>();
  private seq = 0;

  addProduct(productId: string, companyId: string, categoryId: string | null = null) {
    this.products.set(productId, { companyId, categoryId });
    this.configs.set(productId, { productId, storable: true, baseUnit: "lb", magnitude: "weight", baseUnitLocked: false, presentations: [], movementUnits: [] });
  }

  private config(productId: string) {
    const c = this.configs.get(productId);
    if (!c) throw new Error("no config");
    return c;
  }

  async listLocations(companyId: string) {
    return this.locations.filter((l) => l.companyId === companyId);
  }
  async getLocation(id: string) {
    return this.locations.find((l) => l.id === id) ?? null;
  }
  async getProductCompany(productId: string) {
    return this.products.get(productId)?.companyId ?? null;
  }

  async listStatus(f: StatusFilters, page: Page) {
    const q = f.q ? nameKey(f.q) : "";
    const rows = this.lines
      .filter((l) => l.locationId === f.locationId && this.products.get(l.productId)?.companyId === f.companyId)
      .filter((l) => !f.status || l.status === f.status)
      .filter((l) => !f.categoryId || l.categoryId === f.categoryId)
      .filter((l) => !q || nameKey(l.productName).includes(q))
      .sort((a, b) => a.productName.localeCompare(b.productName));
    return { items: rows.slice(page.offset, page.offset + page.limit).map(({ categoryId: _c, ...l }) => l), total: rows.length };
  }
  async countByStatus(_companyId: string, locationId: string) {
    const counts: Record<StockStatus, number> = { normal: 0, low: 0, out: 0 };
    for (const l of this.lines) if (l.locationId === locationId) counts[l.status]++;
    return counts;
  }
  async getStockLine(productId: string, locationId: string) {
    return this.lines.find((l) => l.productId === productId && l.locationId === locationId) ?? null;
  }

  async getProductConfig(productId: string) {
    const c = this.configs.get(productId);
    return c ? { ...c, baseUnitLocked: this.baseUnitLocked.has(productId) } : null;
  }
  async saveProductConfig(productId: string, v: { storable: boolean; baseUnit: Unit }) {
    const c = this.config(productId);
    if (v.baseUnit !== c.baseUnit && this.baseUnitLocked.has(productId)) throw new RuleViolation("BASE_UNIT_LOCKED");
    Object.assign(c, v, { magnitude: magnitudeOf(v.baseUnit) });
  }

  async addPresentation(productId: string, i: { name: string; content: number }) {
    const p: PresentationItem = { id: `pr${++this.seq}`, ...i, active: true };
    this.config(productId).presentations.push(p);
    return p;
  }
  async updatePresentation(productId: string, id: string, changes: { name?: string; content?: number }) {
    Object.assign(this.config(productId).presentations.find((p) => p.id === id)!, changes);
  }
  async setPresentationActive(productId: string, id: string, active: boolean) {
    this.config(productId).presentations.find((p) => p.id === id)!.active = active;
  }
  async deletePresentation(productId: string, id: string) {
    const c = this.config(productId);
    c.presentations = c.presentations.filter((p) => p.id !== id);
  }
  async addMovementUnit(productId: string, i: { name: string; equivalence: number }) {
    const u: MovementUnitItem = { id: `mu${++this.seq}`, ...i, active: true };
    this.config(productId).movementUnits.push(u);
    return u;
  }
  async updateMovementUnit(productId: string, id: string, changes: { name?: string; equivalence?: number }) {
    Object.assign(this.config(productId).movementUnits.find((u) => u.id === id)!, changes);
  }
  async setMovementUnitActive(productId: string, id: string, active: boolean) {
    this.config(productId).movementUnits.find((u) => u.id === id)!.active = active;
  }
  async deleteMovementUnit(productId: string, id: string) {
    const c = this.config(productId);
    c.movementUnits = c.movementUnits.filter((u) => u.id !== id);
  }

  async setMinimum(productId: string, locationId: string, minimum: number) {
    const l = this.lines.find((x) => x.productId === productId && x.locationId === locationId);
    if (l) l.minimum = minimum;
  }
  async clearMinimum(productId: string, locationId: string) {
    const l = this.lines.find((x) => x.productId === productId && x.locationId === locationId);
    if (l) l.minimum = null;
  }

  async getLot(id: string) {
    return this.lots.find((l) => l.id === id) ?? null;
  }
  async listLots(productId: string, locationId: string, f: { onlyAvailable: boolean }) {
    return this.lots.filter((l) => l.productId === productId && l.locationId === locationId && (!f.onlyAvailable || l.remaining > 0));
  }
  async listLocationLots(locationId: string) {
    return this.lots.filter((l) => l.locationId === locationId && l.remaining > 0);
  }
  async listMovements(f: MovementFilters, page: Page) {
    const rows = this.movements
      .filter((m) => f.locationIds.includes(m.locationId))
      .filter((m) => !f.productId || m.productId === f.productId)
      .filter((m) => !f.locationId || m.locationId === f.locationId)
      .filter((m) => !f.type || m.type === f.type)
      .filter((m) => !f.from || new Date(m.createdAt) >= f.from)
      .filter((m) => !f.to || new Date(m.createdAt) <= f.to)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: rows.slice(page.offset, page.offset + page.limit), total: rows.length };
  }
}

export class InMemoryReasons implements WriteOffReasonRepository {
  readonly rows: WriteOffReason[] = [];
  private seq = 0;

  async list(companyId: string) {
    return this.rows.filter((r) => r.companyId === companyId).sort((a, b) => a.name.localeCompare(b.name));
  }
  async get(id: string) {
    return this.rows.find((r) => r.id === id) ?? null;
  }
  async create(companyId: string, i: { code: string; name: string }) {
    const r: WriteOffReason = { id: `r${++this.seq}`, companyId, ...i, active: true, standard: false, requiresText: false };
    this.rows.push(r);
    return r;
  }
  async rename(id: string, name: string) {
    this.rows.find((r) => r.id === id)!.name = name;
  }
  async setActive(id: string, active: boolean) {
    this.rows.find((r) => r.id === id)!.active = active;
  }
  async delete(id: string) {
    this.rows.splice(this.rows.findIndex((r) => r.id === id), 1);
  }
}

type Calls = { [K in keyof StockOperations]: Array<Parameters<StockOperations[K]>[0]> };

export class RecordingOperations implements StockOperations {
  readonly calls: Calls = { registerInitialEntry: [], registerDirectEntry: [], transfer: [], writeOff: [], adjust: [], registerSurplus: [] };

  async registerInitialEntry(c: Calls["registerInitialEntry"][number]) {
    this.calls.registerInitialEntry.push(c);
    return "lot-new";
  }
  async registerDirectEntry(c: Calls["registerDirectEntry"][number]) {
    this.calls.registerDirectEntry.push(c);
    return "lot-new";
  }
  async transfer(c: Calls["transfer"][number]) {
    this.calls.transfer.push(c);
    return { movedBase: c.qty, movedUnitQty: c.qty, lots: [] };
  }
  async writeOff(c: Calls["writeOff"][number]) {
    this.calls.writeOff.push(c);
    return { removedBase: c.qty, lots: [] };
  }
  async adjust(c: Calls["adjust"][number]) {
    this.calls.adjust.push(c);
    return "mv-new";
  }
  async registerSurplus(c: Calls["registerSurplus"][number]) {
    this.calls.registerSurplus.push(c);
    return "lot-new";
  }
}
