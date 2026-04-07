import { LOGIN_CODE_CHARSET, LOGIN_CODE_LENGTH } from "./constants";
import crypto from "crypto";

export function generateLoginCode(): string {
  const bytes = crypto.randomBytes(LOGIN_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < LOGIN_CODE_LENGTH; i++) {
    code += LOGIN_CODE_CHARSET[bytes[i] % LOGIN_CODE_CHARSET.length];
  }
  return code;
}

export async function generateUniqueCodes(
  count: number,
  existingCodes: Set<string>
): Promise<string[]> {
  const codes: string[] = [];
  const allCodes = new Set(existingCodes);

  while (codes.length < count) {
    const code = generateLoginCode();
    if (!allCodes.has(code)) {
      allCodes.add(code);
      codes.push(code);
    }
  }

  return codes;
}
