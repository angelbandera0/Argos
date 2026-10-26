import { describe, expect, it } from "vitest";
import { alertRole, badgeClass, chipClass, TOAST_LIMIT, toastTimeout } from "@/components/ui/feedback-utils";

describe("avisos", () => {
  it("solo el error usa role alert", () => {
    expect(alertRole("danger")).toBe("alert");
    expect(["success", "warning", "info"].map((t) => alertRole(t as "info"))).toEqual(["status", "status", "status"]);
  });
  it("el toast de error no se cierra solo y el resto dura 5 s", () => {
    expect(toastTimeout("danger")).toBe(0);
    expect(toastTimeout("success")).toBe(5000);
    expect(TOAST_LIMIT).toBe(3);
  });
});

describe("insignias y chips", () => {
  it("la insignia de estado lleva punto y el contador no", () => {
    expect(badgeClass("success")).toBe("badge badge-success badge-dot");
    expect(badgeClass("count", "x")).toBe("badge badge-count x");
  });
  it("compone las clases del chip", () => {
    expect(chipClass({})).toBe("chip");
    expect(chipClass({ variant: "alert", className: "x" })).toBe("chip chip-alert x");
    expect(chipClass({ filter: true })).toBe("chip chip-filter");
    expect(chipClass({ variant: "success", removable: true })).toBe("chip chip-success chip-removable");
  });
});
