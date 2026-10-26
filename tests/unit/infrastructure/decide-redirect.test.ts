import { describe, expect, it } from "vitest";
import type { ActorKind } from "@/core/domain/actor";
import { decideRedirect } from "@/infrastructure/proxy/decide-redirect";

type Session = NonNullable<Parameters<typeof decideRedirect>[0]["session"]>;

const session = (kind: ActorKind, over: Partial<Session> = {}): Session => ({
  kind,
  aal: "aal2",
  mustChangePassword: false,
  sessionEnded: false,
  ...over,
});
const go = (pathname: string, s: Session | null) =>
  decideRedirect({ pathname, session: s });

describe("decideRedirect sin sesión", () => {
  it.each(["/login", "/entrar", "/recuperar"])("%s es pública", (p) => {
    expect(go(p, null)).toBeNull();
  });
  it("/usuarios -> /login", () => expect(go("/usuarios", null)).toBe("/login"));
  it("/tienda -> /entrar", () => expect(go("/tienda", null)).toBe("/entrar"));
  it("/tienda/ventas -> /entrar", () => expect(go("/tienda/ventas", null)).toBe("/entrar"));
  it("sub-rutas públicas -> null", () => {
    expect(go("/entrar/x", null)).toBeNull();
    expect(go("/login/anything", null)).toBeNull();
    expect(go("/recuperar/confirmar", null)).toBeNull();
    expect(go("/login/", null)).toBeNull();
  });
  it("/login/2fa sin sesión -> /login", () => expect(go("/login/2fa", null)).toBe("/login"));
  it("límites de segmento: /entrar-x y /tienda-x -> /login", () => {
    expect(go("/entrar-x", null)).toBe("/login");
    expect(go("/tienda-x", null)).toBe("/login");
  });
  it("operator keeps / after choosing a store", () => expect(go("/", session("operator"))).toBeNull());
  it("/ -> /login", () => expect(go("/", null)).toBe("/login"));
});

describe("decideRedirect mustChangePassword", () => {
  it("redirige a /primer-ingreso", () => {
    expect(go("/companias", session("admin", { mustChangePassword: true }))).toBe("/primer-ingreso");
    expect(go("/tienda", session("operator", { mustChangePassword: true }))).toBe("/primer-ingreso");
  });
  it("no redirige si ya está allí", () => {
    expect(go("/primer-ingreso", session("admin", { mustChangePassword: true }))).toBeNull();
  });
});

describe("decideRedirect aal1 admin", () => {
  it("admin y superadmin aal1 -> /login/2fa", () => {
    expect(go("/companias", session("admin", { aal: "aal1" }))).toBe("/login/2fa");
    expect(go("/companias", session("superadmin", { aal: "aal1" }))).toBe("/login/2fa");
  });
  it("null en /login/2fa y /primer-ingreso", () => {
    expect(go("/login/2fa", session("admin", { aal: "aal1" }))).toBeNull();
    expect(go("/primer-ingreso", session("admin", { aal: "aal1" }))).toBeNull();
  });
});

describe("decideRedirect operador", () => {
  it("sesión terminada -> /entrar", () => {
    expect(go("/tienda", session("operator", { sessionEnded: true }))).toBe("/entrar");
  });
  it("sesión terminada en ruta pública -> null", () => {
    expect(go("/entrar", session("operator", { sessionEnded: true }))).toBeNull();
    expect(go("/login", session("operator", { sessionEnded: true }))).toBeNull();
  });
  it("/usuarios -> /tienda", () => {
    expect(go("/usuarios", session("operator"))).toBe("/tienda");
  });
  it("rutas permitidas -> null", () => {
    for (const p of ["/tienda", "/tienda/x", "/catalogo/productos", "/historial"]) {
      expect(go(p, session("operator"))).toBeNull();
    }
  });
  it("/entrar, /login y /tienda-x -> /tienda", () => {
    expect(go("/entrar", session("operator"))).toBe("/tienda");
    expect(go("/login", session("operator"))).toBe("/tienda");
    expect(go("/tienda-x", session("operator"))).toBe("/tienda");
  });
});

describe("decideRedirect admin autenticado", () => {
  it.each(["/login", "/login/2fa", "/entrar", "/primer-ingreso", "/recuperar"])(
    "%s -> /companias",
    (p) => {
      expect(go(p, session("admin"))).toBe("/companias");
      expect(go(p, session("superadmin"))).toBe("/companias");
    },
  );
  it("/superadmin solo para el superadmin; el administrador va a /companias", () => {
    expect(go("/superadmin/administradores", session("admin"))).toBe("/companias");
    expect(go("/superadmin", session("admin"))).toBe("/companias");
    expect(go("/superadmin/administradores", session("superadmin"))).toBeNull();
    expect(go("/superadministrador", session("admin"))).toBeNull();
  });
  it("otras rutas -> null", () => {
    expect(go("/usuarios", session("admin"))).toBeNull();
    expect(go("/usuarios-x", session("admin"))).toBeNull();
  });
});

describe("decideRedirect precedencias", () => {
  it("sessionEnded se ignora para admin", () => {
    expect(go("/usuarios", session("admin", { sessionEnded: true }))).toBeNull();
  });
  it("mustChangePassword gana sobre aal1", () => {
    expect(
      go("/companias", session("admin", { aal: "aal1", mustChangePassword: true })),
    ).toBe("/primer-ingreso");
  });
});
