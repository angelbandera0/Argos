import type { Pick } from "@/core/application/ports/stock-operations";
import type { Assignment, AssignmentKind, RequestStatus } from "@/core/domain/requests";

export interface RequestLine {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unit: string;
  qtyBase: number;
  assignments: (Assignment & { id: string; reason: string | null; decidedBy: string | null; decidedAt: string })[];
}

export interface RequestSummary {
  id: string;
  companyId: string;
  storeId: string;
  storeName: string;
  status: RequestStatus;
  lineCount: number;
  createdAt: string;
}

export interface RequestDetail extends RequestSummary {
  note: string | null;
  lines: RequestLine[];
}

export interface RequestFilters {
  storeId?: string;
  status?: RequestStatus;
}

export interface BagRow {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  qtyBase: number;
  decisions: number;
}

export interface CreateRequestCommand {
  storeId: string;
  note?: string;
  lines: { productId: string; qty: number; unit: string }[];
}

export interface AttendLineCommand {
  lineId: string;
  kind: AssignmentKind;
  qtyBase: number;
  reason?: string;
  picks?: Pick[];
  deviationReason?: string;
}

/** Reads rely on RLS; writes go through the create_request / attend_request_line RPCs. */
export interface RequestRepository {
  create(cmd: CreateRequestCommand): Promise<string>;
  attendLine(cmd: AttendLineCommand): Promise<string>;
  list(companyId: string, filters: RequestFilters, page: { offset: number; limit: number }): Promise<{ items: RequestSummary[]; total: number }>;
  get(requestId: string): Promise<RequestDetail | null>;
  /** The request that owns the line, with every line; null when the line does not exist. */
  getByLine(lineId: string): Promise<RequestDetail | null>;
  listPurchaseBag(companyId: string): Promise<BagRow[]>;
}
