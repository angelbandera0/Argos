export interface Pick {
  lotId: string;
  qty: number;
}

export interface EntryCommand {
  productId: string;
  locationId: string;
  qty: number;
  /** Presentation name, or the product base unit when captured in base. */
  unit: string;
  content: number;
  unitCost?: number | null;
  currencyId?: string | null;
  receivedAt?: string;
}

export interface TransferCommand {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  qty: number;
  /** Movement unit name or 'base'. */
  unit: string;
  picks?: Pick[];
  deviationReason?: string;
}

export interface WriteOffCommand {
  productId: string;
  locationId: string;
  qty: number;
  unit: string;
  reasonId: string;
  reasonText?: string;
  picks?: Pick[];
  deviationReason?: string;
}

export interface TransferResult {
  movedBase: number;
  movedUnitQty: number;
  lots: { sourceLot: string; destLot: string; qty: number }[];
}

export interface WriteOffResult {
  removedBase: number;
  lots: { lotId: string; qty: number; movementId: string }[];
}

/** Wraps the SQL functions; database errors surface through `translateStockError`. */
export interface StockOperations {
  registerInitialEntry(c: EntryCommand): Promise<string>;
  registerDirectEntry(c: EntryCommand): Promise<string>;
  transfer(c: TransferCommand): Promise<TransferResult>;
  writeOff(c: WriteOffCommand): Promise<WriteOffResult>;
  /** Returns the movement id. */
  adjust(c: { lotId: string; delta: number; reasonText: string }): Promise<string>;
  registerSurplus(c: { productId: string; locationId: string; qty: number; reasonText: string; unitCost?: number | null; currencyId?: string | null }): Promise<string>;
}
