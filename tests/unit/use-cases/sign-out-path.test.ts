import { describe, expect, it } from "vitest";
import { signOutPath } from "@/core/application/use-cases/access/sign-out-path";

describe("signOutPath", () => {
  it("sends operators to /entrar and everyone else (or no session) to /login", () => {
    expect(signOutPath("operator")).toBe("/entrar");
    expect(signOutPath("admin")).toBe("/login");
    expect(signOutPath("superadmin")).toBe("/login");
    expect(signOutPath(null)).toBe("/login");
  });
});
