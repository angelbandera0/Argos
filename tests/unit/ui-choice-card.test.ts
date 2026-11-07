import { describe, expect, it } from "vitest";
import { choiceCardClass } from "@/components/ui/choice-card";

describe("choice card", () => {
  it("marks the checked and row variants", () => {
    expect(choiceCardClass({ checked: true })).toBe("ui-choice-card ui-choice-card-on");
    expect(choiceCardClass({ row: true })).toBe("ui-choice-card ui-choice-card-row");
  });
});
