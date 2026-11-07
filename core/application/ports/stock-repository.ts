import type { Magnitude, StockStatus, Unit } from "@/core/domain/stock";

export interface Location {
  id: string;
  companyId: string;
  kind: "warehouse" | "store";
  storeId: string | null;
  name: string;
  active: boolean;
}

export interface Money {
  amount: number;
  currencyId: string;
}

export interface StockLine {
  productId: string;
  productName: string;
  categoryName: string | null;
  locationId: string;
  quantity: number;
  minimum: number | null;
  status: StockStatus;
  baseUnit: Unit;
}

/** `unitCost` undefined = hidden for lack of permission; null = no known cost. */
export interface LotView {
  id: string;
  productId: string;
  locationId: string;
  origin: string;
  sourceLotId: string | null;
  receivedAt: string;
  initialQty: number;
  remaining: number;
  capturedQty: number;
  capturedUnit: string;
  content: number;
  unitCost?: Money | null;
}

export interface MovementView {
  id: string;
  type: string;
  qtyDelta: number;
  capturedQty: number;
  capturedUnit: string;
  reasonCode: string | null;
  reasonText: string | null;
  documentType: string | null;
  documentId: string | null;
  reversesId: string | null;
  actorId: string | null;
  createdAt: string;
  lotId: string;
  productId: string;
  locationId: string;
  unitCost?: Money | null;
}

export interface PresentationItem {
  id: string;
  name: string;
  content: number;
  active: boolean;
}

export interface MovementUnitItem {
  id: string;
  name: string;
  equivalence: number;
  active: boolean;
}

export interface ProductStockConfig {
  productId: string;
  storable: boolean;
  baseUnit: Unit;
  magnitude: Magnitude;
  /** True once the product has lots or movements anywhere: the base unit can no longer change. */
  baseUnitLocked: boolean;
  presentations: PresentationItem[];
  movementUnits: MovementUnitItem[];
}

export interface Page {
  offset: number;
  limit: number;
}

export interface StatusFilters {
  companyId: string;
  locationId: string;
  status?: StockStatus;
  q?: string;
  categoryId?: string;
}

export interface MovementFilters {
  companyId: string;
  locationIds: string[];
  productId?: string;
  locationId?: string;
  type?: string;
  from?: Date;
  to?: Date;
}

export interface LotCostAdjustment {
  id: string;
  lotId: string;
  orderId: string | null;
  oldUnitCost: number | null;
  newUnitCost: number;
  currencyId: string | null;
  reason: string;
  createdBy: string | null;
  createdAt: string;
}

/**
 * Reads and configuration only. Costs come back only where the database lets the caller read
 * them; use cases strip them again. Deleted presentations/units are invisible. A base unit
 * change with stock surfaces as BASE_UNIT_LOCKED (from the database).
 */
export interface StockRepository {
  listLocations(companyId: string): Promise<Location[]>;
  getLocation(id: string): Promise<Location | null>;
  /** Company owning the product, null when it does not exist. */
  getProductCompany(productId: string): Promise<string | null>;
  listStatus(filters: StatusFilters, page: Page): Promise<{ items: StockLine[]; total: number }>;
  countByStatus(companyId: string, locationId: string): Promise<Record<StockStatus, number>>;
  getStockLine(productId: string, locationId: string): Promise<StockLine | null>;
  getProductConfig(productId: string): Promise<ProductStockConfig | null>;
  saveProductConfig(productId: string, config: { storable: boolean; baseUnit: Unit }): Promise<void>;
  addPresentation(productId: string, i: { name: string; content: number }): Promise<PresentationItem>;
  updatePresentation(productId: string, id: string, changes: { name?: string; content?: number }): Promise<void>;
  setPresentationActive(productId: string, id: string, active: boolean): Promise<void>;
  deletePresentation(productId: string, id: string): Promise<void>;
  addMovementUnit(productId: string, i: { name: string; equivalence: number }): Promise<MovementUnitItem>;
  updateMovementUnit(productId: string, id: string, changes: { name?: string; equivalence?: number }): Promise<void>;
  setMovementUnitActive(productId: string, id: string, active: boolean): Promise<void>;
  deleteMovementUnit(productId: string, id: string): Promise<void>;
  setMinimum(productId: string, locationId: string, minimum: number): Promise<void>;
  clearMinimum(productId: string, locationId: string): Promise<void>;
  getLot(id: string): Promise<LotView | null>;
  /** Newest first; empty without see_costs (RLS). */
  listLotCostAdjustments(lotId: string): Promise<LotCostAdjustment[]>;
  /** Oldest first. */
  listLots(productId: string, locationId: string, filter: { onlyAvailable: boolean }): Promise<LotView[]>;
  /** Every lot with stock in the location. */
  listLocationLots(locationId: string): Promise<LotView[]>;
  /** Newest first. */
  listMovements(filters: MovementFilters, page: Page): Promise<{ items: MovementView[]; total: number }>;
}
