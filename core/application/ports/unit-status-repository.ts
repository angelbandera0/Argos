import type { Level } from "@/core/application/ports/company-repository";
import type { Reason } from "@/core/domain/deactivation";

export interface UnitStatusRepository {
  getCompanyId(level: Level, id: string): Promise<string | null>;
  setStatus(
    level: Level,
    id: string,
    status: "active" | "inactive",
    reason: Reason | null,
    by: string,
  ): Promise<void>;
  softDelete(level: Level, id: string): Promise<void>;
  hasData(level: Level, id: string): Promise<boolean>;
}
