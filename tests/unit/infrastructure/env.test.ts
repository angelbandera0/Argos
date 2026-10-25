import { describe, expect, it } from "vitest";
import { parseEnv } from "@/infrastructure/env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
  PIN_PEPPER: "p".repeat(32),
};

describe("parseEnv", () => {
  it("acepta el entorno mínimo y deja opcionales ausentes", () => {
    const env = parseEnv(valid);
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(valid.NEXT_PUBLIC_SUPABASE_URL);
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(env.SUPERADMIN_EMAIL).toBeUndefined();
    expect(env.SUPERADMIN_INITIAL_PASSWORD).toBeUndefined();
  });

  it("conserva los opcionales cuando existen", () => {
    const env = parseEnv({ ...valid, SUPABASE_SERVICE_ROLE_KEY: "srk" });
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("srk");
  });

  it("lanza si falta NEXT_PUBLIC_SUPABASE_URL", () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: undefined })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("lanza si la URL no es válida", () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "no-url" })).toThrow();
  });

  it("lanza si falta la clave publicable", () => {
    expect(() =>
      parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("lanza si PIN_PEPPER tiene menos de 32 caracteres", () => {
    expect(() => parseEnv({ ...valid, PIN_PEPPER: "p".repeat(31) })).toThrow(/PIN_PEPPER/);
  });
});
