const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const LENGTH = 4;

export function generateCompanyCode(randomInt: (max: number) => number): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
