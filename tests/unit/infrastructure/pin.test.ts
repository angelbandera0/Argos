import { describe, expect, it } from "vitest";
import {
  derivePinCredential,
  generatePin,
  syntheticEmail,
} from "@/infrastructure/auth/pin";

const PEPPER = "test-pepper-0123456789-abcdefghijklmnop";
// Computed once, independently: printf 'k7m2.caja1:482917' | openssl dgst -sha256 -hmac "$PEPPER"
const EXPECTED = "b87539d7f05db98994a1fda4c02e84d173c7210561056acdc512152e92cdae0c";

describe("generatePin", () => {
  it("zero-pads to 6 digits", () => {
    expect(generatePin(() => 123)).toBe("000123");
  });
  it("keeps the maximum value", () => {
    expect(generatePin(() => 999999)).toBe("999999");
  });
  it("asks for a number below 1_000_000 and always yields 6 digits", () => {
    let asked = 0;
    const pin = generatePin((max) => {
      asked = max;
      return 0;
    });
    expect(asked).toBe(1_000_000);
    expect(pin).toMatch(/^\d{6}$/);
  });
});

describe("derivePinCredential", () => {
  it("matches the independently computed HMAC-SHA256 hex", () => {
    expect(derivePinCredential("k7m2.caja1", "482917", PEPPER)).toBe(EXPECTED);
  });
  it("is 64 lowercase hex chars", () => {
    expect(derivePinCredential("k7m2.caja1", "482917", PEPPER)).toMatch(
      /^[0-9a-f]{64}$/,
    );
  });
  it("normalizes the username", () => {
    expect(derivePinCredential("  K7M2.Caja1 ", "482917", PEPPER)).toBe(EXPECTED);
  });
  it("differs for another PIN", () => {
    expect(derivePinCredential("k7m2.caja1", "482918", PEPPER)).not.toBe(EXPECTED);
  });
  it("differs for another pepper", () => {
    expect(
      derivePinCredential("k7m2.caja1", "482917", PEPPER + "x"),
    ).not.toBe(EXPECTED);
  });
});

describe("syntheticEmail", () => {
  it("builds a normalized reserved-domain address", () => {
    expect(syntheticEmail(" K7M2.Caja1 ")).toBe(
      "k7m2.caja1@operadores.argos.invalid",
    );
  });
});
