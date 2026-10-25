import { createHmac } from "node:crypto";
import { normalizeUsername } from "@/core/domain/username";

const SYNTHETIC_EMAIL_DOMAIN = "operadores.argos.invalid";

export function generatePin(randomInt: (max: number) => number): string {
  return String(randomInt(1_000_000)).padStart(6, "0");
}

export function derivePinCredential(
  username: string,
  pin: string,
  pepper: string,
): string {
  return createHmac("sha256", pepper)
    .update(`${normalizeUsername(username)}:${pin}`)
    .digest("hex");
}

export function syntheticEmail(username: string): string {
  return `${normalizeUsername(username)}@${SYNTHETIC_EMAIL_DOMAIN}`;
}
