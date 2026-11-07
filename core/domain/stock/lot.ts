import type { Qty } from "./quantity";

export type Lot = { id: string; createdAt: Date | string; remaining: Qty };
export type Allocation = { lotId: string; qty: Qty };
