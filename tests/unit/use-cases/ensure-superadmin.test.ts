import { describe, expect, it } from "vitest";
import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import { makeEnsureSuperadmin } from "@/core/application/use-cases/access/ensure-superadmin";

function gateway() {
  let exists = false;
  return {
    async ensureSuperadmin() {
      const created = !exists;
      exists = true;
      return { created };
    },
  } as unknown as AuthGateway;
}

describe("ensureSuperadmin", () => {
  it("creates once, then reports created: false", async () => {
    const run = makeEnsureSuperadmin({ auth: gateway() });
    const i = { email: "root@example.com", initialPassword: "a-long-password-1" };
    expect(await run(i)).toEqual({ created: true });
    expect(await run(i)).toEqual({ created: false });
  });

  it("rejects an 11-character password", async () => {
    const run = makeEnsureSuperadmin({ auth: gateway() });
    await expect(run({ email: "root@example.com", initialPassword: "x".repeat(11) })).rejects.toMatchObject({
      code: "PASSWORD_TOO_SHORT",
    });
  });
});
