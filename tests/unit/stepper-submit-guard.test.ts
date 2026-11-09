import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { canSubmitStep } from "@/components/ui/step-guard";

vi.mock("@/app/(app)/usuarios/actions", () => ({ checkUsernameAction: vi.fn(), createUserAction: vi.fn(), updateUserAction: vi.fn() }));
vi.mock("@/app/(app)/roles/actions", () => ({ saveRoleAction: vi.fn() }));

const src = (p: string) => readFileSync(p, "utf8");
const files = ["components/users/user-stepper.tsx", "components/roles/role-stepper.tsx"];

describe("steppers never submit from intermediate steps", () => {
  it("only the last step may submit", () => {
    expect(canSubmitStep(0, 3)).toBe(false);
    expect(canSubmitStep(2, 3)).toBe(false);
    expect(canSubmitStep(3, 3)).toBe(true);
  });

  it.each(files)("%s: next/back are type=button; submit is a distinct keyed element; Enter and action are guarded", (f) => {
    const s = src(f);
    expect(s).toMatch(/<Button\s+key="back"\s+type="button"/);
    expect(s).toMatch(/<Button key="next" type="button"/);
    expect(s).toMatch(/<Button key="submit" type="submit"/);
    expect(s.match(/type="submit"/g)).toHaveLength(1);
    expect(s).toMatch(/!canSubmitStep\(step, (lastStep|LAST_STEP)\)\) \{\s*e\.preventDefault\(\);\s*goNext\(\)/);
    expect(s).toMatch(/if \(canSubmitStep\(step, (lastStep|LAST_STEP)\)\) action\(fd\)/);
    expect(s).toMatch(/action=\{guardedAction\}/);
  });

  it.each(files)("%s: editing a field clears the step message", (f) => {
    expect(src(f).match(/setStepMsg\(undefined\)/g)!.length).toBeGreaterThanOrEqual(4);
  });

  it("first step renders Siguiente as type=button and no submit button", async () => {
    const { UserStepper } = await import("@/components/users/user-stepper");
    const html = renderToStaticMarkup(
      createElement(UserStepper, { mode: "create", code: "alfa", companyId: "c1", companyName: "Alfa", roles: [], stores: [] }),
    );
    expect(html).toMatch(/<button type="button"[^>]*>(?:(?!<\/button>).)*Siguiente/);
    expect(html).not.toContain('type="submit"');
  });
});
